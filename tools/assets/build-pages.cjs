/* Builds the GitHub Pages site for .github/workflows/pages.yml.
   The site is what the old branch deployment published: every tracked file except paths with a part starting with
   "." or "_" (Jekyll leaves those out) and exports/ (Git LFS archives, which Pages only ever served as pointer files).
   The licensed models come from the private asset repository (never the public one), laid out as in the site
   (void-runner/...), and every packed model and look texture (.vrpak, .vrtex) is encrypted with AES-256-GCM: a "VRPE"
   header, a 12-byte IV, then the ciphertext and tag (asset-pipeline.js open() reads it). The key goes into
   void-runner/asset-pipeline.js. The browser needs the key to draw the model, so this meets CGTrader's "encrypting
   the Product data" measure without stopping a determined player.
   Usage: VOID_ASSET_KEY=<base64, 32 bytes> node tools/assets/build-pages.cjs <licensed-dir> <out-dir>
          node tools/assets/build-pages.cjs --new-key */
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{execFileSync}=require('child_process');
const PACKED=0x4b505256,SEALED=0x45505256,PAGES_LIMIT=1024**3;

// Published by Pages (as Jekyll did): no part of the path starts with "." or "_", and not exports/.
const publishable=f=>!f.split('/').some(p=>p.startsWith('.')||p.startsWith('_'))&&!f.startsWith('exports/');

// The .vrpak scramble (tools/assets/pack-model.cjs), undone.
function unscramble(buf){
 if(buf.length<8||buf.readUInt32LE(0)!==PACKED)throw Error('Not a VRPK file');
 const out=Buffer.alloc(buf.length-8);let x=(0x9e3779b9^buf.readUInt32LE(4))>>>0||1;
 for(let i=0;i<out.length;i++){if((i&3)===0){x^=x<<13;x>>>=0;x^=x>>>17;x^=x<<5;x>>>=0;}out[i]=buf[i+8]^(x>>>((i&3)*8))&255;}
 return out;}

function seal(plain,key){
 const iv=crypto.randomBytes(12),c=crypto.createCipheriv('aes-256-gcm',key,iv);
 const body=Buffer.concat([c.update(plain),c.final(),c.getAuthTag()]),head=Buffer.alloc(16);
 head.writeUInt32LE(SEALED,0);iv.copy(head,4);return Buffer.concat([head,body]);}

function keyFrom(b64){const k=Buffer.from(b64||'','base64');if(k.length!==32)throw Error('VOID_ASSET_KEY must be 32 bytes, base64');return k;}

function walk(dir,out=[]){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p,out);else out.push(p);}return out;}

function build(licensed,out,key){
 fs.rmSync(out,{recursive:true,force:true});
 let bytes=0,files=0;const copy=(from,to)=>{fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to);bytes+=fs.statSync(to).size;files++;};
 for(const f of execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0'))if(f&&publishable(f)&&fs.existsSync(f))copy(f,path.join(out,f));
 // Licensed files: only the site's own tree, and never over a tracked file.
 let added=0;const root=path.join(licensed,'void-runner');
 if(fs.existsSync(root))for(const f of walk(root)){const rel=path.relative(licensed,f).split(path.sep).join('/');if(!publishable(rel))continue;
  const to=path.join(out,rel);if(fs.existsSync(to))throw Error('Licensed file would replace a tracked file: '+rel);copy(f,to);added++;}
 let sealed=0;
 for(const f of walk(out))if(/\.(vrpak|vrtex)$/.test(f)){const buf=fs.readFileSync(f);if(buf.readUInt32LE(0)!==PACKED)continue;
  const next=seal(unscramble(buf),key);bytes+=next.length-buf.length;fs.writeFileSync(f,next);sealed++;}
 const loader=path.join(out,'void-runner/asset-pipeline.js'),src=fs.readFileSync(loader,'utf8');
 if(src.split("'__VOID_ASSET_KEY__'").length!==2)throw Error('Key placeholder not found once in asset-pipeline.js');
 fs.writeFileSync(loader,src.replace("'__VOID_ASSET_KEY__'","'"+key.toString('base64')+"'"));
 // Every deploy starts a fresh offline cache (void-runner-sw.js caches game files per BUILD), so a forgotten BUILD
 // bump or a new key can never leave players on stale files.
 const sw=path.join(out,'void-runner-sw.js'),worker=fs.readFileSync(sw,'utf8'),stamp=(process.env.GITHUB_SHA||Date.now().toString(36)).slice(0,10);
 if(!/const BUILD='[^']*';/.test(worker))throw Error('BUILD not found in void-runner-sw.js');
 fs.writeFileSync(sw,worker.replace(/const BUILD='([^']*)';/,(m,b)=>`const BUILD='${b}+${stamp}';`));
 if(bytes>PAGES_LIMIT)throw Error(`Site is ${(bytes/1048576).toFixed(0)} MB, over GitHub Pages' 1 GB limit`);
 return {files,added,sealed,mb:+(bytes/1048576).toFixed(1)};}

module.exports={publishable,unscramble,seal,keyFrom,build};
if(require.main===module){
 const args=process.argv.slice(2);
 if(args[0]==='--new-key'){console.log(crypto.randomBytes(32).toString('base64'));process.exit(0);}
 if(args.length!==2){console.error('Usage: VOID_ASSET_KEY=<base64> node tools/assets/build-pages.cjs <licensed-dir> <out-dir>');process.exit(1);}
 const r=build(args[0],args[1],keyFrom(process.env.VOID_ASSET_KEY));
 console.log(`site: ${r.files} files, ${r.mb} MB; ${r.added} licensed files added; ${r.sealed} models and textures encrypted`);}
