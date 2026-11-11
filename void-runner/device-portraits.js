/* Profile portraits drawn from the ACTUAL in-game character: a player's saved creator look (character-assembler.js) or an NPC's game model. BROWSER ONLY.
   - One consistent head-and-shoulders camera, light and background for everyone (the world's own lights are switched off for the one frame that is drawn).
   - Drawn once, on demand, one at a time, into a small offscreen target, then cached by KEY. The key (device-v1.js portraitKey) contains the character, a hash of
     the exact look or model, and ASSET_VERSION, so a changed hairstyle, outfit or model, or a new asset version, is a different key: an old picture is never shown for a new
     look and one character's picture can never be shown for another. Old entries of the same character are dropped when the new one is stored.
   - No character model is loaded unless a profile that needs it is opened. If a model or look is unavailable the caller shows a labelled silhouette: no face is ever invented.
   - Nothing here trusts an image from the network: pictures are produced locally from validated ids only. */
(function(root){
 'use strict';
 const LAYER=0x20000000,SIZE=160,STORE='void-runner-portraits-v1',MAX_STORED=40;
 const mem=new Map(),inflight=new Map();let queue=Promise.resolve();
 const prefix=key=>String(key).split(':').slice(0,2).join(':')+':';
 const readStore=()=>{try{const o=JSON.parse(root.localStorage.getItem(STORE)||'{}');return o&&typeof o==='object'&&!Array.isArray(o)?o:{};}catch{return {};}};
 const writeStore=o=>{try{root.localStorage.setItem(STORE,JSON.stringify(o));}catch{}};
 function remember(key,url){
  mem.set(key,url);const o=readStore(),pre=prefix(key);
  for(const k of Object.keys(o))if(prefix(k)===pre&&k!==key)delete o[k];   // an older look of the same character is no longer needed
  o[key]=url;const keys=Object.keys(o);while(keys.length>MAX_STORED)delete o[keys.shift()];
  writeStore(o);
 }
 function lookup(key){
  if(mem.has(key))return mem.get(key);
  const o=readStore(),v=o[key];if(typeof v==='string'&&/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(v)){mem.set(key,v);return v;}
  return null;
 }

 async function draw(portrait){
  const B=root.BABYLON,scene=root.VoidBabylon?.scene;if(!B||!scene)return null;
  const src=portrait.source,holder=new B.TransformNode('portrait-stage',scene);holder.position.set(0,-800,0);
  const lights=[],saved=[],fog=scene.fogEnabled;let character=null,rtt=null,cam=null;
  try{
   let meshes=[];
   if(src.type==='appearance'){
    if(!root.VoidCharacterAssembler||!root.VoidCharacterAppearance?.validate(src.appearance))return null;
    character=await root.VoidCharacterAssembler.build(src.appearance,holder,{scene});meshes=character.meshes();
   }else if(src.type==='model'&&/^[a-z0-9-]{1,40}$/.test(String(src.model))){
    await root.VoidCharacterAssembler.ensureLook(src.model,scene);const made=root.VoidAssets.instance('crowd:'+src.model,holder);if(!made)return null;meshes=holder.getChildMeshes();
   }else return null;
   meshes=meshes.filter(m=>m.getTotalVertices?.()>0&&m.isEnabled());if(!meshes.length)return null;
   for(const m of holder.getChildMeshes())m.layerMask=LAYER;
   const skeletons=new Set(meshes.map(m=>m.skeleton).filter(Boolean));for(const s of skeletons)s.prepare?.(true);
   let top=-Infinity;for(const m of meshes){m.computeWorldMatrix(true);m.refreshBoundingInfo?.({applySkeleton:true,applyMorph:false});top=Math.max(top,m.getBoundingInfo().boundingBox.maximumWorld.y);}
   if(!isFinite(top))return null;
   const target=new B.Vector3(holder.position.x,top-.16,holder.position.z),fov=.6,dist=(.56/2)/Math.tan(fov/2);
   cam=new B.FreeCamera('portrait-cam',new B.Vector3(target.x,target.y+.03,target.z+dist),scene);cam.fov=fov;cam.minZ=.05;cam.maxZ=20;cam.layerMask=LAYER;cam.setTarget(target);
   // the same studio light for everyone; the world's lights skip these meshes for the moment of the picture
   const key=new B.DirectionalLight('portrait-key',new B.Vector3(.35,-.35,-1),scene),fill=new B.HemisphericLight('portrait-fill',new B.Vector3(0,1,.3),scene);
   key.intensity=1.5;fill.intensity=.75;fill.groundColor=new B.Color3(.12,.14,.2);for(const l of [key,fill]){l.includeOnlyWithLayerMask=LAYER;lights.push(l);}
   for(const l of scene.lights)if(!lights.includes(l)){saved.push([l,l.excludeWithLayerMask]);l.excludeWithLayerMask=(l.excludeWithLayerMask||0)|LAYER;}
   scene.fogEnabled=false;
   rtt=new B.RenderTargetTexture('portrait-rtt',SIZE,scene,false);rtt.renderList=meshes.filter(m=>m.getClassName?.()!=='TransformNode');rtt.activeCamera=cam;rtt.clearColor=new B.Color4(.015,.04,.07,1);rtt.refreshRate=0;
   // Wait until the character's materials and textures are ready (a first frame can otherwise come out empty), then take the picture; retry a few times.
   const frame=()=>new Promise(r=>requestAnimationFrame(()=>r())),cv=document.createElement('canvas');cv.width=cv.height=SIZE;const g=cv.getContext('2d'),img=g.createImageData(SIZE,SIZE);let varied=false;
   for(let tries=0;tries<60&&!rtt.renderList.every(m=>m.isReady(true));tries++)await frame();
   for(let attempt=0;attempt<4&&!varied;attempt++){
    if(attempt)for(let i=0;i<10;i++)await frame();
    rtt.render();const px=await rtt.readPixels();if(!px)continue;const first=px[0];
    for(let y=0;y<SIZE;y++){const sy=SIZE-1-y;for(let x=0;x<SIZE;x++){const i=(y*SIZE+x)*4,j=(sy*SIZE+x)*4;img.data[i]=px[j];img.data[i+1]=px[j+1];img.data[i+2]=px[j+2];img.data[i+3]=255;if(px[j]!==first||px[j+1]!==px[1])varied=true;}}
   }
   if(!varied)return null;   // an empty picture is a failure, not a portrait
   g.putImageData(img,0,0);return cv.toDataURL('image/jpeg',.85);
  }finally{
   scene.fogEnabled=fog;for(const [l,m] of saved)l.excludeWithLayerMask=m;for(const l of lights)l.dispose();
   rtt?.dispose();cam?.dispose();try{character?.dispose();}catch{}holder.dispose();
  }
 }
 /* request({key, source, state}) -> Promise<dataURL|null>. Never rejects; null means "show the silhouette". */
 function request(portrait){
  if(!portrait||portrait.state!=='ready'||!portrait.source||typeof portrait.key!=='string')return Promise.resolve(null);
  const hit=lookup(portrait.key);if(hit)return Promise.resolve(hit);
  if(inflight.has(portrait.key))return inflight.get(portrait.key);
  const job=queue.then(()=>draw(portrait)).then(url=>{if(url)remember(portrait.key,url);return url||null;}).catch(()=>null).finally(()=>inflight.delete(portrait.key));
  queue=job.catch(()=>{});inflight.set(portrait.key,job);return job;
 }
 function invalidate(pre){for(const k of [...mem.keys()])if(k.startsWith(pre))mem.delete(k);const o=readStore();for(const k of Object.keys(o))if(k.startsWith(pre))delete o[k];writeStore(o);}
 root.VoidDevicePortraits={request,invalidate,lookup,get size(){return mem.size;},clear(){mem.clear();writeStore({});},SIZE};
})(globalThis);
