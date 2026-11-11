/* Local preview of the site and the game. Serves this folder as static files and nothing else.
   - Listens on 127.0.0.1 only (this computer). Add --lan to let another device on your home network open it, e.g. a handheld.
   - Serves only known web file types (html, css, js, images, models, audio...). Source, config, secrets and dot-files are never served.
   - There is no backend here: /api/* answers 503, so accounts, cloud saves, the shop and Iris chat are unavailable; progress saves in the browser.
   - Nothing is cached, so reloading always shows the files on disk. Nothing is sent anywhere except what the pages already load from public CDNs.
   Run: node tools/preview-server.cjs        (PORT=5200 to change the port) */
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const root=path.resolve(__dirname,'..'),port=Number(process.env.PORT)||5187,lan=process.argv.includes('--lan'),host=lan?'0.0.0.0':'127.0.0.1';
const TYPES={html:'text/html; charset=utf-8',css:'text/css; charset=utf-8',js:'text/javascript; charset=utf-8',mjs:'text/javascript; charset=utf-8',json:'application/json; charset=utf-8',
 png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',svg:'image/svg+xml',ico:'image/x-icon',avif:'image/avif',
 glb:'model/gltf-binary',gltf:'model/gltf+json',bin:'application/octet-stream',ktx2:'image/ktx2',vrpak:'application/octet-stream',wasm:'application/wasm',
 mp3:'audio/mpeg',ogg:'audio/ogg',wav:'audio/wav',m4a:'audio/mp4',mp4:'video/mp4',webm:'video/webm',woff:'font/woff',woff2:'font/woff2',ttf:'font/ttf',otf:'font/otf',
 txt:'text/plain; charset=utf-8',md:'text/plain; charset=utf-8',xml:'application/xml',csv:'text/csv; charset=utf-8',webmanifest:'application/manifest+json'};
function send(res,code,body,type='text/plain; charset=utf-8'){res.writeHead(code,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(body);}
http.createServer((req,res)=>{
 if(req.method!=='GET'&&req.method!=='HEAD')return send(res,405,'Method not allowed');
 let url;try{url=decodeURIComponent(req.url.split('?')[0]);}catch{return send(res,400,'Bad request');}
 if(url.startsWith('/api/'))return send(res,503,JSON.stringify({error:'This local preview has no backend.'}),'application/json');
 if(url.endsWith('/'))url+='index.html';
 const file=path.resolve(root,'.'+url),rel=path.relative(root,file);
 if(!file.startsWith(root+path.sep)||rel.split(path.sep).some(part=>part.startsWith('.')||part==='node_modules'||part==='__pycache__'))return send(res,404,'Not found');
 const type=TYPES[path.extname(file).slice(1).toLowerCase()];if(!type)return send(res,404,'Not found');
 fs.stat(file,(error,stat)=>{if(error||!stat.isFile())return send(res,404,'Not found');
  const range=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range||'');let start=0,end=stat.size-1,code=200;
  if(range&&(range[1]||range[2])){start=range[1]?Number(range[1]):Math.max(0,stat.size-Number(range[2]));end=range[2]&&range[1]?Math.min(Number(range[2]),stat.size-1):stat.size-1;if(start>end||start>=stat.size){res.writeHead(416,{'Content-Range':'bytes */'+stat.size});return res.end();}code=206;}
  const headers={'Content-Type':type,'Content-Length':end-start+1,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes'};if(code===206)headers['Content-Range']='bytes '+start+'-'+end+'/'+stat.size;
  res.writeHead(code,headers);if(req.method==='HEAD')return res.end();fs.createReadStream(file,{start,end}).pipe(res);});
}).listen(port,host,()=>{
 console.log('\nThe Darknet District: local preview (nothing here is published)\n');
 console.log('  Game:      http://127.0.0.1:'+port+'/void-runner.html');
 console.log('  Home page: http://127.0.0.1:'+port+'/index.html');
 if(lan){const ips=Object.values(os.networkInterfaces()).flat().filter(i=>i&&i.family==='IPv4'&&!i.internal).map(i=>i.address);console.log('\n  --lan is on: other devices on your home network can open http://'+(ips[0]||'<this-computer>')+':'+port+'/void-runner.html');console.log('  Only use --lan on a network you trust, and stop the preview when you are done.');}
 console.log('\n  Press Ctrl+C to stop.\n');
}).on('error',e=>{console.error(e.code==='EADDRINUSE'?'Port '+port+' is already in use. Close the other preview, or run with PORT=5200.':e.message);process.exit(1);});
