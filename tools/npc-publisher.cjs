/* Run on the developer's PC. Only the paired production editor may submit an asset. */
'use strict';
const http=require('node:http'),crypto=require('node:crypto');
const {spawn}=require('node:child_process');
const {pack}=require('./assets/pack-model.cjs');
const paths=require('../void-runner/npc-paths.js');
const source='https://thedarknetdistrict.com',host='127.0.0.1',port=47831;
const repository='Smartsec916/void-runner-licensed-assets',site='Smartsec916/the-darknet-district-site';
function gh(args,input){
 return new Promise((resolve,reject)=>{
  const child=spawn('gh',args,{stdio:['pipe','pipe','pipe'],windowsHide:true});
  let output='',errors='';child.stdout.on('data',c=>output+=c);child.stderr.on('data',c=>errors+=c);
  child.on('error',reject);child.on('close',code=>code?reject(Error(errors.trim()||'GitHub CLI failed')):resolve(output));
  child.stdin.on('error',()=>{});child.stdin.end(input);
 });
}
async function register(bytes,{allowOverTriangleLimit=false}={},run=gh){
 const doc=paths.importDocument(bytes,'.glb');
 const meshPrimitives=doc.meshes.flatMap(m=>m.primitives||[]);
 let triangles=0;
 for(const p of meshPrimitives){
  const count=doc.accessors?.[p.indices??p.attributes?.POSITION]?.count;
  if(!Number.isSafeInteger(count)||count<=0)throw Error('Invalid mesh accessor.');
  const mode=p.mode??4;
  if(mode===4)triangles+=Math.floor(count/3);else if(mode===5||mode===6)triangles+=Math.max(0,count-2);
 }
 if(!triangles||(!allowOverTriangleLimit&&triangles>paths.IMPORT.maxTriangles))throw Error('Check the triangle budget and per-model exception.');
 const names=(doc.animations||[]).map(a=>a.name);
 if(!doc.skins?.length||!names.includes('idle'))throw Error('The published rig needs a skin and a named idle clip.');
 const hash=crypto.createHash('sha256').update(bytes).digest('hex'),asset='npc-upload-'+hash.slice(0,32);
 const packed=pack(bytes,parseInt(hash.slice(0,8),16));
 const address='repos/'+repository+'/contents/void-runner/assets/models/crowd/'+asset+'.vrpak';
 const gitSha=crypto.createHash('sha1').update('blob '+packed.length+'\0').update(packed).digest('hex');
 let exists=false;
 try{exists=(await run(['api',address+'?ref=main','--jq','.sha'])).trim()===gitSha;if(!exists)throw Error('Existing asset differs.');}
 catch(e){if(!/HTTP 404/.test(e.message))throw e;}
 if(!exists)await run(['api','--method','PUT',address,'--input','-','--silent'],JSON.stringify({branch:'main',message:'Register game NPC model '+asset,content:packed.toString('base64')}));
 await run(['workflow','run','pages.yml','--repo',site,'--ref','main']);
 return {hash,asset};
}
function serve(){
 if(process.platform==='win32')process.title='Void Runner NPC Publisher';
 const pairing=crypto.randomBytes(18).toString('base64url');let busy=false;
 const server=http.createServer(async(req,res)=>{
  const reply=(code,body)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
  if(req.headers.host!==host+':'+port||req.headers.origin!==source||req.url!=='/models')return reply(403,{error:'Open the production NPC editor.'});
  res.setHeader('Access-Control-Allow-Origin',source);res.setHeader('Vary','Origin');
  if(req.method==='OPTIONS'){
   res.setHeader('Access-Control-Allow-Methods','POST');res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type, X-Triangle-Exception');res.setHeader('Access-Control-Allow-Private-Network','true');return reply(200,{});
  }
  if(req.method!=='POST'||req.headers.authorization!=='Bearer '+pairing)return reply(403,{error:'Enter the current PC pairing code.'});
  if(busy)return reply(409,{error:'Another model is registering. Retry after it finishes.'});
  busy=true;
  try{
   const chunks=[];let size=0;
   for await(const c of req){size+=c.length;if(size>paths.IMPORT.maxBytes)throw Error('The 15 MiB model limit was exceeded.');chunks.push(c);}
   const result=await register(Buffer.concat(chunks),{allowOverTriangleLimit:req.headers['x-triangle-exception']==='true'});
   reply(200,result);
  }catch(err){reply(400,{error:String(err.message).slice(0,450)});}finally{busy=false;}
 });
 server.listen(port,host,()=>console.log('NPC publisher ready. Enter this pairing code in the game editor:',pairing));
}
if(require.main===module)serve();
module.exports={register};
