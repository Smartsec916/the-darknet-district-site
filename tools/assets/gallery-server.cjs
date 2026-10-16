/* Developer-only asset gallery (graphics brief §20). Never part of the game or the website.
   Usage: node tools/assets/gallery-server.cjs [library folder]
   Default library: %LOCALAPPDATA%/void-runner-assets/library (output of import-models.cjs).
   Open http://127.0.0.1:5191/. Listens on this computer only. Review decisions are written to
   <library>/decisions.json; nothing in the game changes until a model is added to the registry. */
const http=require('http'),fs=require('fs'),path=require('path');
const repo=path.resolve(__dirname,'..','..');
const library=path.resolve(process.argv[2]||path.join(process.env.LOCALAPPDATA||'.', 'void-runner-assets','library'));
const port=5191,types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.glb':'model/gltf-binary','.json':'application/json'};
function file(res,base,rel){
 const p=path.resolve(base,'.'+decodeURIComponent(rel));
 if(!p.startsWith(path.resolve(base)+path.sep)||!fs.existsSync(p)||!fs.statSync(p).isFile()){res.writeHead(404);return res.end('not found');}
 res.writeHead(200,{'Content-Type':types[path.extname(p)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(p).pipe(res);
}
function list(){
 const decisions=fs.existsSync(path.join(library,'decisions.json'))?JSON.parse(fs.readFileSync(path.join(library,'decisions.json'),'utf8')):{};
 const packs={};
 for(const pack of fs.readdirSync(library,{withFileTypes:true}).filter(d=>d.isDirectory())){
  const r=path.join(library,pack.name,'import-report.json');if(!fs.existsSync(r))continue;
  packs[pack.name]=JSON.parse(fs.readFileSync(r,'utf8')).models.filter(m=>m.glb).map(m=>({...m,url:'/library/'+pack.name+'/'+m.glb,decision:decisions[m.id]||null}));
 }
 return packs;
}
http.createServer((req,res)=>{
 const url=req.url.split('?')[0];
 if(req.method==='POST'&&url==='/api/decision'){
  // Only this page may record decisions.
  if(req.headers.origin&&req.headers.origin!=='http://127.0.0.1:'+port){res.writeHead(403);return res.end();}
  let body='';req.on('data',c=>{body+=c;if(body.length>4096)req.destroy();});
  req.on('end',()=>{try{const {id,status,note}=JSON.parse(body);if(!/^[a-z0-9/-]{1,160}$/.test(id)||!['shortlisted','rejected','unreviewed'].includes(status))throw Error('bad');
   const f=path.join(library,'decisions.json'),all=fs.existsSync(f)?JSON.parse(fs.readFileSync(f,'utf8')):{};all[id]={status,note:String(note||'').slice(0,300),date:new Date().toISOString().slice(0,10)};
   fs.writeFileSync(f,JSON.stringify(all,null,1));res.writeHead(200,{'Content-Type':'application/json'});res.end('{"ok":true}');}catch{res.writeHead(400);res.end('{"ok":false}');}});
  return;
 }
 if(url==='/'||url==='/index.html')return file(res,__dirname,'/gallery.html');
 if(url==='/api/models'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});return res.end(JSON.stringify(list()));}
 if(url.startsWith('/vendor/'))return file(res,path.join(repo,'void-runner','vendor'),url.slice(7));
 if(url.startsWith('/library/'))return file(res,library,url.slice(8));
 res.writeHead(404);res.end('not found');
}).listen(port,'127.0.0.1',()=>console.log('Asset gallery: http://127.0.0.1:'+port+'/  (library: '+library+')'));
