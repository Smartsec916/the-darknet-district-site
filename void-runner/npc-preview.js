/* DEVELOPER TOOLS > NPCs: the 3D preview (browser only; loaded with the editor for a confirmed developer). Its own small Babylon engine on its own canvas, so the game's
   scene is never touched: one figure (a crowd file the game ships, read through the game's own loader VoidAssets.loadContainer, or a model file the owner picked from
   his computer, read in this browser only), a turntable camera, two lights. Every clip in the file can be played; a clip of the shared animation library can be tried on
   the figure (anim-library.js; refused, with the reason, when the rig's rest pose is more than its 25 degree limit off). For an imported file it also measures what the
   checklist needs (triangles, file size, textures, skeleton, clips, height). Nothing is uploaded anywhere.
   mount(host) -> {show({asset} | {file}), play(clip), tryLibrary(id), info, dispose()}. */
(function(root){
 'use strict';
 let loaderP=null;
 function loaders(){const B=root.BABYLON;if(B?.SceneLoader?.IsPluginForExtensionAvailable?.('.glb'))return Promise.resolve();
  return loaderP??=new Promise((ok,fail)=>{const s=document.createElement('script');s.src='void-runner/vendor/babylonjs-loaders-8.26.0.min.js';s.onload=ok;s.onerror=()=>fail(new Error('The model loader could not be loaded.'));document.head.append(s);});}
 function mount(host){
  const B=root.BABYLON,cv=document.createElement('canvas');cv.className='npc-preview-canvas';cv.width=360;cv.height=360;cv.setAttribute('aria-label','3D preview of the NPC');host.append(cv);
  const engine=new B.Engine(cv,true,{preserveDrawingBuffer:true,stencil:true});const scene=new B.Scene(engine);scene.clearColor=new B.Color4(.05,.06,.09,1);
  const cam=new B.ArcRotateCamera('npc-preview-cam',Math.PI/2,Math.PI/2.3,3.4,new B.Vector3(0,.95,0),scene);cam.attachControl(cv,true);cam.lowerRadiusLimit=1.2;cam.upperRadiusLimit=9;cam.wheelPrecision=60;cam.minZ=.05;
  const hemi=new B.HemisphericLight('npc-preview-sky',new B.Vector3(0,1,0),scene);hemi.intensity=.85;hemi.groundColor=new B.Color3(.18,.16,.22);
  const key=new B.DirectionalLight('npc-preview-key',new B.Vector3(-.4,-.7,.6),scene);key.intensity=1.6;
  const floor=B.MeshBuilder.CreateDisc('npc-preview-floor',{radius:1.1,tessellation:48},scene);floor.rotation.x=Math.PI/2;const fm=new B.StandardMaterial('npc-preview-floor-m',scene);fm.diffuseColor=new B.Color3(.16,.17,.22);fm.specularColor=new B.Color3(0,0,0);floor.material=fm;
  let container=null,rootNode=null,groups=[],current=null,spin=true,disposed=false,info=null;
  cv.addEventListener('pointerdown',()=>{spin=false;});
  engine.runRenderLoop(()=>{if(disposed||!cv.isConnected||cv.offsetParent===null)return;   /* nothing drawn while the preview is not on screen (another tab, the panel closed, a test session) */if(spin&&rootNode)rootNode.rotation.y+=.006;scene.render();});
  function clear(){current=null;for(const g of groups)g.stop();container?.removeAllFromScene?.();container?.dispose?.();container=null;rootNode=null;groups=[];info=null;}
  function measure(bytes){const meshes=container.meshes.filter(m=>m.getTotalVertices&&m.getTotalVertices()>0);let tri=0;for(const m of meshes){const n=m.getTotalIndices?m.getTotalIndices():0;tri+=n?n/3:m.getTotalVertices()/3;}
   let min=new B.Vector3(Infinity,Infinity,Infinity),max=new B.Vector3(-Infinity,-Infinity,-Infinity);for(const m of meshes){m.computeWorldMatrix(true);const bb=m.getBoundingInfo().boundingBox;min=B.Vector3.Minimize(min,bb.minimumWorld);max=B.Vector3.Maximize(max,bb.maximumWorld);}
   const bones=[...new Set([...(container.skeletons||[]).flatMap(s=>s.bones.map(b=>b.name))])];
   const textures=(container.textures||[]).map(t=>{const s=t.getSize?.()||{};return {name:t.name,w:s.width|0,h:s.height|0};});
   return {triangles:Math.round(tri),bytes:bytes|0,textures,bones,clips:groups.map(g=>g.name.split('-').pop()===g.name?g.name:g.name),height:Number.isFinite(max.y-min.y)?max.y-min.y:NaN,min,max};}
  function frame(){const i=info;if(!i||!Number.isFinite(i.height))return;const h=i.height;const s=h>0&&(h<1.3||h>2.3)?1.75/h:1;if(rootNode&&s!==1)rootNode.scaling.scaleInPlace(s);cam.target=new B.Vector3(0,Math.min(1.2,h*s*.55),0);cam.radius=Math.max(2.2,h*s*1.9);}
  async function show(src){clear();await loaders();
   if(src.asset){container=await root.VoidAssets.loadContainer({src:'assets/models/crowd/'+src.asset+'.glb'},scene,null,'preview:'+src.asset);}
   else if(src.file){const buf=src.buffer||await src.file.arrayBuffer(),ext=/\.gltf$/i.test(src.file.name||'')?'.gltf':'.glb';container=await B.SceneLoader.LoadAssetContainerAsync('',ext==='.gltf'?new TextDecoder().decode(buf):new Uint8Array(buf),scene,null,ext);src.bytes=buf.byteLength;}
   else return null;
   if(disposed){container.dispose();return null;}
   container.addAllToScene();groups=container.animationGroups.slice();for(const g of groups)g.stop();
   rootNode=container.meshes.find(m=>!m.parent)||container.transformNodes.find(t=>!t.parent)||null;
   info=measure(src.bytes||0);frame();const idle=groups.find(g=>/(^|-)idle$/.test(g.name))||groups[0];if(idle)play(idle.name);return info;}
  function play(name){const g=groups.find(x=>x.name===name||x.name.endsWith('-'+name));if(!g)return false;for(const x of groups)if(x!==g)x.stop();g.start(true,1);current=g.name;return true;}
  async function tryLibrary(id,look,library='actorcore'){const L=root.VoidAnimLibrary;if(!L?.apply)return {ok:false,why:'The animation library is not loaded here.'};if(!rootNode)return {ok:false,why:'Nothing is shown yet.'};
   const meta=rootNode.metadata=rootNode.metadata||{};meta.animationGroups=meta.animationGroups||groups;let added=[];
   try{const m=/^([a-z0-9-]+)\/([a-z0-9-]+)$/.exec(id);if(m){library='crowd:'+m[1];L.register?.(library,'assets/models/crowd/'+m[1]+'.glb',[{id,clip:m[2]}]);}added=await L.apply(rootNode,look||'preview',{only:[id],scene,library});}catch(e){return {ok:false,why:'Could not try it: '+(e?.message||e)};}
   if(!added.length)return {ok:false,why:meta.animLibraryRefused!=null?'Her rig does not take it: the rest pose is '+meta.animLibraryRefused+' degrees off (the limit is '+L.REST_LIMIT+').':(library==='actorcore'?'The animation library file is not on this computer (licensed motion capture is published with the live site only), or her bones do not match.':'Her bones do not match that file’s, so it was not added.')};
   const g=(meta.animationGroups||[]).find(x=>x.name.endsWith(id));if(g&&!groups.includes(g))groups.push(g);play(id);return {ok:true};}
  function dispose(){disposed=true;clear();engine.stopRenderLoop();scene.dispose();engine.dispose();cv.remove();}
  /* NPC looks (npc-looks.js): the file as loaded (what the model supports is read from it) and a look put on the figure live (null: as made). */
  function look(asset,l){const L=root.VoidNPCLooks;if(!L||!rootNode)return null;return L.applyLook(rootNode,asset,l||null,{scene});}
  return {show,play,tryLibrary,dispose,look,get container(){return container;},get root(){return rootNode;},get clips(){return groups.map(g=>g.name);},get current(){return current;},get info(){return info;},get spinning(){return spin;},set spinning(v){spin=!!v;},canvas:cv,scene};
 }
 root.VoidNPCPreview={mount,loaders};
})(globalThis);
