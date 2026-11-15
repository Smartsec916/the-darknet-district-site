/* What the District's residents do with their time (David, 15 Nov 2026): the people who used to stand in one place all day now go and play the arcade
   machines (the ones without a game too), walk into the store and look around, and go to the bar to order a drink or oxygen, then come back to where they
   hang out. About half of the people at the bar wear a clear oxygen mask while they are there.
   - Who: the ambient crew figures the District already places (neochinatown.js: crew-hall-*, crew-vr-watch, crew-bar*). Nothing is added or removed; while a
     resident is at their own spot the game animates them exactly as before.
   - When: by the clock, like Dax (dax.js): every player sees the same person in the same place. Each resident runs the same eight-minute round, offset from
     the others, so they do not all leave together.
   - Where: District plan metres. A walk goes out to the hallway's centre line, along it, and in (the route Dax uses).
   Pure rules (who, where, when) run in Node (tests/district-life.test.cjs). */
(function(root){
 'use strict';
 const SPEED=1.25,ROUND=480;
 /* Each resident's own spot (where neochinatown.js stands them) and what they look toward there. */
 const HOMES={
  'crew-hall-talk1':{at:[-2.0,40.3],face:[-1.9,41.5],door:40.3},'crew-hall-talk2':{at:[-1.9,41.5],face:[-2.0,40.3],door:41.5},'crew-hall-talk3':{at:[2.0,38.4],face:[0,39.5],door:38.4},
  'crew-hall-watch1':{at:[2.05,57.2],face:[0,56],door:57.2},'crew-vr-watch':{at:[-5.4,33],face:[-9,33.5],door:33,via:[[-3.4,33]]},
  'crew-bar1':{at:[7,36.6],face:[7,38.5],door:33.5,via:[[3.4,33.5],[7,34.6]]},'crew-bar2':{at:[14.5,30],face:[12,32],door:33.5,via:[[3.4,33.5],[12,32.2]]}
 };
 const WHO=Object.keys(HOMES);
 /* Places to go. kind: what is done there (which clips are tried, most wanted first). via: the way in from the hallway's centre line at z = door. */
 const CLIPS={arcade:['interact','watch','idle'],store:['look','watch','idle'],bar:['drink','talk','idle'],oxygen:['idle','talk']};
 const cab=i=>({kind:'arcade',label:'The arcade',at:[-8.75,58.6+i*1.7],face:[-9.9,58.6+i*1.7],door:62,via:[[-3.4,62],[-6.2,62],[-6.2,58.6+i*1.7]]});
 const PLACES=[
  cab(0),cab(1),cab(2),cab(3),cab(4),
  {kind:'store',label:'The Darknet District store',at:[7.4,44.6],face:[7.4,42.6],door:45.6,via:[[3.4,45.6],[7.4,45.6]]},
  {kind:'store',label:'The Darknet District store',at:[11.2,45.7],face:[11.2,48],door:45.6,via:[[3.4,45.6]]},
  {kind:'store',label:'The Darknet District store',at:[13.6,45.6],face:[15.8,45.6],door:45.6,via:[[3.4,45.6]]},
  {kind:'store',label:'The Darknet District store',at:[9.3,45.7],face:[9.3,48],door:45.6,via:[[3.4,45.6]]},
  {kind:'bar',label:'The bar and oxygen lounge',at:[8.4,36.5],face:[8.4,38.5],door:33.5,via:[[3.4,33.5],[8.4,34.6]]},
  {kind:'bar',label:'The bar and oxygen lounge',at:[9.8,36.5],face:[9.8,38.5],door:33.5,via:[[3.4,33.5],[9.8,34.6]]},
  {kind:'bar',label:'The bar and oxygen lounge',at:[11.4,36.5],face:[11.4,38.5],door:33.5,via:[[3.4,33.5],[11.4,34.6]]},
  {kind:'bar',label:'The bar and oxygen lounge',at:[12.9,36.5],face:[12.9,38.5],door:33.5,via:[[3.4,33.5],[12.9,34.6]]}
 ];
 function rnd(a,b){let h=(Math.imul(a|0,374761393)+Math.imul(b|0,668265263))|0;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;}
 const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 function route(a,b){const p=[a.at.slice()];for(const v of (a.via||[]).slice().reverse())p.push(v.slice());p.push([0,a.door]);if(Math.abs(a.door-b.door)>.05)p.push([0,b.door]);for(const v of b.via||[])p.push(v.slice());p.push(b.at.slice());
  return p.filter((q,i)=>i===0||dist(q,p[i-1])>.05);}
 const length=p=>p.reduce((s,q,i)=>i?s+dist(q,p[i-1]):0,0);
 function along(p,d){for(let i=1;i<p.length;i++){const L=dist(p[i],p[i-1]);if(d<=L||i===p.length-1){const k=L?Math.min(1,d/L):1;return {x:p[i-1][0]+(p[i][0]-p[i-1][0])*k,z:p[i-1][1]+(p[i][1]-p[i-1][1])*k,dx:p[i][0]-p[i-1][0],dz:p[i][1]-p[i-1][1]};}d-=L;}return {x:p[0][0],z:p[0][1],dx:0,dz:1};}
 /* One resident's round `n` (a whole number): at home, to a first place, to a second, home again. Two residents are never sent to the same first place or
    the same second place in one round (the places are dealt out, not drawn). */
 function round(id,n){
  const k=WHO.indexOf(id),home=HOMES[id],N=PLACES.length,first=(Math.floor(rnd(n,11)*N)+k*2)%N;let second=(Math.floor(rnd(n,23)*N)+k*2+5)%N;if(second===first)second=(second+1)%N;
  const A=PLACES[first],B=PLACES[second],steps=[];let t=0;
  const stay=(place,index,seconds,hold)=>{steps.push({kind:hold?'home':'stay',place:index,start:t,end:t+seconds,mask:!hold&&place.kind==='bar'&&rnd(n,400+k*7+index)<.5});t+=seconds;};
  const walk=(a,b,to)=>{const path=route(a,b),time=length(path)/SPEED;steps.push({kind:'walk',to,start:t,end:t+time,path});t+=time;};
  stay(home,-1,50+rnd(n,31+k)*60,true);walk(home,A,first);stay(A,first,60+rnd(n,47+k)*40);walk(A,B,second);stay(B,second,50+rnd(n,59+k)*35);walk(B,home,-1);
  steps.push({kind:'home',place:-1,start:t,end:Math.max(t,ROUND)+1});return steps;}
 const cache=new Map();
 /* Where a resident is at a moment (seconds since 1970): {home} when they are at their own spot (the game animates them as before), or
    {x, z, yaw (plan), kind:'walk'|'stay', what:'arcade'|'store'|'bar'|null, clips, mask, label}. */
 function at(id,seconds){
  const k=WHO.indexOf(id);if(k<0)return null;const shifted=seconds+k*ROUND/WHO.length,n=Math.floor(shifted/ROUND),t=shifted-n*ROUND,key=id+'|'+n;
  let steps=cache.get(key);if(!steps){steps=round(id,n);cache.set(key,steps);if(cache.size>40)cache.delete(cache.keys().next().value);}
  const s=steps.find(q=>t>=q.start&&t<q.end)||steps[steps.length-1];
  if(s.kind==='home')return {home:true,label:null};
  if(s.kind==='stay'){const p=PLACES[s.place];return {home:false,kind:'stay',x:p.at[0],z:p.at[1],yaw:Math.atan2(p.face[0]-p.at[0],p.face[1]-p.at[1]),what:p.kind,clips:CLIPS[s.mask?'oxygen':p.kind],mask:s.mask,label:p.label};}
  const a=along(s.path,(t-s.start)*SPEED);return {home:false,kind:'walk',x:a.x,z:a.z,yaw:Math.atan2(a.dx,a.dz),what:null,clips:['walk'],mask:false,label:s.to<0?null:PLACES[s.to].label};}
 /* Residents whose own spot is at the bar: about half of them wear a mask there too (fixed per person, so it does not flicker). */
 const homeMask=id=>id==='crew-bar1';
 const pure={SPEED,ROUND,HOMES,WHO,PLACES,CLIPS,route,length,along,round,at,homeMask};
 if(typeof module!=='undefined'&&module.exports){module.exports=pure;return;}
 if(typeof document==='undefined')return;

 // ---- browser ----
 const figs=new Map();let sceneRef=null,observer=null,maskMat=null,tubeMat=null,lastScan=0;
 const now=()=>Date.now()/1000+(root.VoidDistrictLife?.offset||0);
 const interior=()=>{try{return typeof walkingLocation!=='undefined'&&walkingLocation?.id==='neochinatown'&&walkingLocation.area==='interior';}catch{return false;}};
 function mats(scene){const B=root.BABYLON;if(maskMat&&maskMat.getScene()===scene)return;maskMat=new B.StandardMaterial('life-oxygen-mask',scene);maskMat.diffuseColor=new B.Color3(.55,.8,.9);maskMat.emissiveColor=new B.Color3(.02,.05,.06);maskMat.specularColor=new B.Color3(.3,.35,.4);maskMat.alpha=.36;maskMat.backFaceCulling=false;
  tubeMat=new B.StandardMaterial('life-oxygen-tube',scene);tubeMat.diffuseColor=new B.Color3(.7,.85,.9);tubeMat.emissiveColor=new B.Color3(.03,.05,.06);tubeMat.alpha=.6;}
 /* A clear oxygen mask over the nose and mouth with a tube down to the chest: placed on the standing figure's face, then tied to the head so it follows it. */
 function mask(f,on){
  if(!on){if(f.mask){f.mask.dispose();f.mask=null;}return;}if(f.mask&&!f.mask.isDisposed())return;
  const B=root.BABYLON,scene=f.node.getScene(),head=f.node.getDescendants(false).find(t=>/(^|[:_\- ])Head$/.test(t.name)&&t.getAbsolutePosition);if(!head)return;mats(scene);
  f.node.computeWorldMatrix(true);head.computeWorldMatrix(true);const hp=head.getAbsolutePosition(),fwd=B.Vector3.TransformNormal(new B.Vector3(0,0,1),f.node.getWorldMatrix()).normalize(),top=(()=>{try{return f.node.getHierarchyBoundingVectors(true).max.y;}catch{return hp.y+.2;}})();
  const faceY=Math.min(top-.16,Math.max(hp.y+.055,top-.23)),root_=new B.TransformNode('life-oxygen',scene);
  const cup=B.MeshBuilder.CreateSphere('life-oxygen-cup',{diameter:.085,segments:10,slice:.6},scene);cup.material=maskMat;cup.parent=root_;cup.rotation.x=Math.PI/2;cup.scaling.set(.95,.75,1.05);
  const rim=B.MeshBuilder.CreateTorus('life-oxygen-rim',{diameter:.072,thickness:.006,tessellation:14},scene);rim.material=tubeMat;rim.parent=root_;rim.rotation.x=Math.PI/2;rim.position.z=-.012;rim.scaling.set(1,1,1.05);
  const tube=B.MeshBuilder.CreateCylinder('life-oxygen-hose',{diameter:.011,height:.2,tessellation:6},scene);tube.material=tubeMat;tube.parent=root_;tube.position.set(0,-.125,-.022);tube.rotation.x=.28;
  for(const m of root_.getChildMeshes()){m.isPickable=false;m.metadata={oxygenMask:true};}
  root_.position.set(hp.x+fwd.x*.1,faceY,hp.z+fwd.z*.1);root_.rotation.y=Math.atan2(fwd.x,fwd.z);root_.setParent(head);f.mask=root_;}
 function release(f){if(f.driven){f.driven=false;f.node.metadata.life=false;f.node.position.x=f.home.x;f.node.position.z=f.home.z;f.node.rotation.y=f.home.ry;f.clip=null;}}
 function drop(){for(const f of figs.values()){try{mask(f,false);if(!f.node.isDisposed())release(f);}catch{}}figs.clear();if(observer&&sceneRef)try{sceneRef.onBeforeRenderObservable.remove(observer);}catch{}observer=null;sceneRef=null;}
 function scan(scene){
  for(const id of WHO){const f=figs.get(id);if(f&&!f.node.isDisposed())continue;if(f)figs.delete(id);
   const node=scene.transformNodes.find(t=>t.metadata?.character===id&&t.metadata?.crowd&&!t.isDisposed())||scene.meshes.find(t=>t.metadata?.character===id&&t.metadata?.crowd&&!t.isDisposed());if(!node)continue;
   const ctrl=root.VoidCrowd?.controller?.(node);if(!ctrl)continue;figs.set(id,{id,node,ctrl,look:node.metadata.crowd,home:{x:node.position.x,z:node.position.z,ry:node.rotation.y},driven:false,clip:null,mask:null});}}
 function step(){
  const scene=sceneRef;if(!scene||scene.isDisposed||!interior()){drop();return;}
  const t=now(),ms=performance.now();if(ms-lastScan>1500){lastScan=ms;scan(scene);}
  for(const f of figs.values()){if(f.node.isDisposed())continue;const s=at(f.id,t);
   if(!s||s.home){release(f);mask(f,homeMask(f.id));continue;}
   if(!f.driven){f.driven=true;f.node.metadata.life=true;}
   f.node.position.x=s.x;f.node.position.z=s.z;let d=s.yaw-f.node.rotation.y;d=Math.atan2(Math.sin(d),Math.cos(d));f.node.rotation.y+=d*.14;
   const have=root.VoidCrowd.clips[f.look]||[],clip=s.clips.find(c=>have.includes(c))||'idle';if(clip!==f.clip){f.clip=clip;try{f.ctrl.play(clip);}catch{}}
   mask(f,s.kind==='stay'&&s.mask);}}
 setInterval(()=>{const scene=root.VoidBabylon?.scene;if(sceneRef&&(scene!==sceneRef||!interior()))drop();
  if(!sceneRef&&scene&&interior()&&root.VoidCrowd?.controller){sceneRef=scene;lastScan=0;observer=scene.onBeforeRenderObservable.add(step);}},1000);
 root.VoidDistrictLife={...pure,offset:0,get driven(){return [...figs.values()].filter(f=>f.driven).map(f=>f.id);},get masked(){return [...figs.values()].filter(f=>f.mask&&!f.mask.isDisposed()).map(f=>f.id);},get figures(){return [...figs.keys()];}};
})(typeof globalThis!=='undefined'?globalThis:this);
