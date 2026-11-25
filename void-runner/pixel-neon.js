/* Pixel and Neon share the District resident clock and the same hallway routes as the ambient crew. */
(function(root){
 'use strict';
 const people={pixel:{name:'Pixel',height:1.65},neon:{name:'Neon',height:1.70}};
 const names={pixel:'Pixel',neon:'Neon',bartender:'Bartender',admin:'Admin',iris:'Iris'};
 const stops=[
  {kind:'arcade',at:[-8.5,59.15],face:[-9.9,58.6],door:62,via:[[-3.4,62],[-6,62],[-6,59.15]],seconds:180},
  {kind:'vr',at:[-5.4,32],face:[-12.6,32.4],door:32.4,via:[[-3.4,32.4]],seconds:50},
  {kind:'bar',at:[10.6,36.9],face:[10,40],door:33.5,via:[[3.4,33.5],[10.6,34.6]],seconds:85},
  {kind:'store',at:[10.1,45.25],face:[10.1,48.6],door:45.6,via:[[3.4,45.6]],seconds:115}
 ];
 function makeRoute(life){
  const legs=[];let total=0;
  for(let i=0;i<stops.length;i++){
   const place=stops[i],path=life.route(place,stops[(i+1)%stops.length]);
   legs.push({place,start:total,end:total+place.seconds});total+=place.seconds;
   const duration=life.length(path)/life.SPEED;
   legs.push({path,start:total,end:total+duration});total+=duration;
  }
  return seconds=>{
   const t=((seconds%total)+total)%total,leg=legs.find(s=>t<s.end),elapsed=t-leg.start;
   if(leg.path){const p=life.along(leg.path,elapsed*life.SPEED);return {...p,kind:'district',yaw:Math.atan2(p.dx,p.dz),elapsed,remaining:leg.end-t};}
   const p=leg.place;return {x:p.at[0],z:p.at[1],kind:p.kind,yaw:Math.atan2(p.face[0]-p.at[0],p.face[1]-p.at[1]),elapsed,remaining:leg.end-t};
  };
 }
 function choose(exchanges,pose,adminNearby,lastPlayed,random=Math.random){
  const eligible=exchanges.filter(e=>e.locations.includes(pose.kind)&&(!e.requiresAdminNearby||adminNearby)&&
   e.lines.reduce((sum,l)=>sum+l.seconds+.8,1)<pose.remaining);
  if(!eligible.length)return null;
  const oldest=Math.min(...eligible.map(e=>lastPlayed.get(e.id)||0));
  const pool=eligible.filter(e=>(lastPlayed.get(e.id)||0)===oldest);
  return pool[Math.floor(random()*pool.length)];
 }
 if(typeof module==='object'&&module.exports){module.exports={makeRoute,choose,stops};return;}
 const route=makeRoute(root.VoidDistrictLife),figs=new Map(),history=new Map();
 let scene=null,observer=null,loading=false,retry=0,script=[],exchange=null,index=0,next=0,spoken=null,visit=null;
 const inside=()=>typeof walkingLocation!=='undefined'&&walkingLocation?.id==='neochinatown'&&walkingLocation.area==='interior';
 function silence(){
  const status=root.VoidAudio?.voiceStatus;
  if(spoken&&status?.id===spoken.speaker&&status.text===spoken.text&&status.active)root.VoidAudio.cancel();
  exchange=null;spoken=null;index=0;
 }
 function drop(){
  silence();if(observer)scene.onBeforeRenderObservable.remove(observer);
  for(const f of figs.values()){f.ctrl?.dispose();f.node.dispose();}
  figs.clear();scene=null;observer=null;visit=null;
 }
 function tick(){
  if(!inside()||scene!==root.VoidBabylon?.scene||scene.isDisposed){drop();return;}
  const clock=performance.now()/1000,p=route(Date.now()/1000+(root.VoidDistrictLife.offset||0));
  const w=root.VoidNeoChinatown.toWorld(p.x,p.z),yaw=p.yaw+Math.PI;
  const close=typeof walker!=='undefined'&&walker&&Math.hypot(walker.x-w[0],walker.z-w[1])<6;
  const audible=close&&typeof mode!=='undefined'&&mode==='walking'&&!document.hidden&&!root.VoidArcade?.playing;
  if(!audible||visit!==p.kind){if(exchange||spoken)silence();next=clock+1;visit=p.kind;}
  const status=root.VoidAudio?.voiceStatus,own=spoken&&status?.id===spoken.speaker&&status?.text===spoken.text;
  if(audible&&status?.active&&!own){silence();next=clock+2;}
  if(audible&&clock>=next&&!status?.active&&script.length){
   if(!exchange){
    const admin=p.kind==='store'&&typeof state!=='undefined'&&!state.story?.flags?.adminOccupied;
    exchange=choose(script,p,admin,history);index=0;
    if(exchange)history.set(exchange.id,Date.now());else next=clock+2;
   }
   if(exchange){
    spoken=exchange.lines[index++];announce(names[spoken.speaker]+' · '+spoken.text);
    root.VoidAudio?.speak(spoken.speaker,spoken.text,false,false,true);
    next=clock+spoken.seconds+.45;
    if(index===exchange.lines.length){exchange=null;next+=9;}
   }
  }
  for(const [id,f] of figs){
   const lateral=id==='pixel'?.72:0;
   f.node.position.x=w[0]+Math.cos(yaw)*lateral;f.node.position.z=w[1]-Math.sin(yaw)*lateral;
   const delta=Math.atan2(Math.sin(yaw-f.node.rotation.y),Math.cos(yaw-f.node.rotation.y));
   f.node.rotation.y+=delta*Math.min(1,scene.getEngine().getDeltaTime()*.008);
   const talking=own&&status?.active&&spoken?.speaker===id;
   const clip=p.kind==='district'?'walk':talking?'talk':p.kind==='arcade'&&id==='neon'?'interact':p.kind==='vr'?'watch':p.kind==='store'?'look':'idle';
   if(f.clip!==clip){f.ctrl.play(clip);f.clip=clip;}
  }
 }
 async function attach(target){
  loading=true;
  try{
   const assets=root.VoidAssets;
   await Promise.all(Object.keys(people).map(id=>{
    const key='crowd:npc-'+id;
    return assets.container(key)||assets.load(key,{src:'assets/models/crowd/npc-'+id+'.vrpak',background:true},target);
   }));
   if(!inside()||target!==root.VoidBabylon.scene||target.isDisposed)return;
   scene=target;
   for(const [id,person] of Object.entries(people)){
    const model='npc-'+id,node=new root.BABYLON.TransformNode(model,scene);
    const made=assets.instance('crowd:'+model,node);
    if(!made){node.dispose();throw Error('Missing instance '+id);}
    const box=made.getHierarchyBoundingVectors(true),scale=person.height/(box.max.y-box.min.y);
    made.scaling.scaleInPlace(scale);made.position.y=-box.min.y*scale;
    node.metadata={npc:true,character:id};for(const mesh of made.getChildMeshes())mesh.isPickable=false;
    figs.set(id,{node,ctrl:root.VoidCrowd.animate(made,model,'idle'),clip:'idle'});
   }
   tick();observer=scene.onBeforeRenderObservable.add(tick);
  }catch(error){drop();retry=Date.now()+15000;console.warn('[District residents]',error.message);}
  finally{loading=false;}
 }
 setInterval(()=>{
  if(!script.length&&root.VoidVoiceClips?.districtExchanges)root.VoidVoiceClips.districtExchanges.then(list=>{script=list;});
  if(scene&&(!inside()||scene!==root.VoidBabylon?.scene))drop();
  if(!scene&&!loading&&Date.now()>=retry&&inside()&&root.VoidBabylon?.scene&&root.VoidAssets)attach(root.VoidBabylon.scene);
 },1000);
 root.VoidPixelNeon={get ready(){return figs.size===2;},get activity(){return visit;}};
})(globalThis);
