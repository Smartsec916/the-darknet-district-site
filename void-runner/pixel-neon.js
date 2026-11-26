/* Pixel and Neon share the District resident clock and the same hallway routes as the ambient crew. */
(function(root){
 'use strict';
 const people={pixel:{name:'Pixel',height:1.65,stride:1.44},neon:{name:'Neon',height:1.70,stride:1.50}};
 const names={pixel:'Pixel',neon:'Neon',bartender:'Bartender',admin:'Admin',iris:'Iris'};
 const stops=[
  {kind:'arcade',at:[-8.45,60.3],face:[-9.9,60.3],door:62,via:[[-3.4,62],[-6,62],[-6,60.3]],seconds:180},
  {kind:'vr',at:[-5.4,32],face:[-12.6,32.4],door:32.4,via:[[-3.4,32.4]],seconds:115},
  {kind:'bar',at:[10.6,36.9],face:[10,40],door:33.5,via:[[3.4,33.5],[10.6,34.6]],seconds:85},
  {kind:'store',at:[10.1,45.25],face:[10.1,48.6],door:45.6,via:[[3.4,45.6]],seconds:115}
 ];
 function makeRoute(life){
  const legs=[];let total=0;
  function travel(points){
   const duration=life.length(points)/life.SPEED;
   legs.push({path:points,start:total,end:total+duration});total+=duration;
  }
  // Both clients see the same occasional stop. The detour is on the east side of the hall.
  for(let lap=0;lap<3;lap++)for(let i=0;i<stops.length;i++){
   const place=stops[i],path=life.route(place,stops[(i+1)%stops.length]);
   legs.push({place,start:total,end:total+place.seconds});total+=place.seconds;
   if(lap===1&&i===0){
    const k=path.findIndex((b,j)=>j&&path[j-1][1]>54&&b[1]<52);
    const bay=[1.72,53];
    travel([...path.slice(0,k),[1.72,54.5],bay]);
    legs.push({place:{kind:'kiss',at:bay,face:[1.72,52]},start:total,end:total+5});total+=5;
    travel([bay,[1.72,51.5],...path.slice(k)]);
   }else travel(path);
  }
  return seconds=>{
   const t=((seconds%total)+total)%total,leg=legs.find(s=>t<s.end),elapsed=t-leg.start;
   if(leg.path){
    const distance=elapsed*life.SPEED,len=(leg.end-leg.start)*life.SPEED;
    const width=Math.min(.42,distance,len-distance),point=d=>life.along(leg.path,d);
    const p=point(distance),a=point(distance-width),b=point(distance+width);
    // Round the path around corners and face its tangent.
    const dx=b.x-a.x,dz=b.z-a.z;
    return {x:(a.x+2*p.x+b.x)/4,z:(a.z+2*p.z+b.z)/4,kind:'district',yaw:Math.atan2(width>1e-5?dx:p.dx,width>1e-5?dz:p.dz),elapsed,distance,remaining:leg.end-t};
   }
   const p=leg.place,remaining=leg.end-t;
   let yaw=Math.atan2(p.face[0]-p.at[0],p.face[1]-p.at[1]);
   if(elapsed<1||remaining<1){
    const i=legs.indexOf(leg),entering=elapsed<1,adjacent=legs[(i+(entering?-1:1)+legs.length)%legs.length].path;
    const at=entering?adjacent.length-2:0,a=adjacent[at],b=adjacent[at+1];
    const travelYaw=Math.atan2(b[0]-a[0],b[1]-a[1]),u=1-Math.min(elapsed,remaining);
    yaw+=Math.atan2(Math.sin(travelYaw-yaw),Math.cos(travelYaw-yaw))*u*u*(3-2*u);
   }
   return {x:p.at[0],z:p.at[1],kind:p.kind,yaw,elapsed,remaining};
  };
 }
 // Individual paths begin and end at the couple's shared formation. Pixel uses
 // the opening at the end of the glass. Neon reaches the bar via the hallway.
 function activityPose(id,p,life){
  const side=id==='pixel'?1:-1;
  const origin=[p.x+Math.cos(p.yaw)*side*.32,p.z-Math.sin(p.yaw)*side*.32];
  if(p.kind!=='vr'&&p.kind!=='arcade')return null;
  let path;
  if(p.kind==='arcade'){
   path=[origin,id==='neon'?[-9.03,60.3]:[-8.82,61.04]];
  }else if(id==='pixel'){
   path=[origin,[-6.4,30.2],[-7.3,28.95],[-8.5,28.62],[-9.7,28.62],[-12.6,32.4]];
  }else{
   path=[origin,[-3.4,32.4],[0,32.4],[0,33.5],[3.4,33.5],[10.6,34.6],[10.6,36.9]];
  }
  const length=life.length(path),wait=p.kind==='vr'&&id==='pixel'?13:0;
  const distance=Math.max(0,Math.min(length,(Math.min(p.elapsed,p.remaining)-wait)*life.SPEED));
  const q=life.along(path,distance),returning=p.elapsed>p.remaining;
  if(distance<length){
   const walking=distance>0;
   return {x:q.x,z:q.z,yaw:walking?Math.atan2(q.dx,q.dz)+(returning?Math.PI:0):p.yaw,walking,distance:returning?length-distance:distance,clip:walking?'walk':'watch'};
  }
  if(p.kind==='arcade'){
   const glance=id==='pixel'?(1+Math.tanh((Math.sin(p.elapsed*.53)-.72)*7))/2:0;
   const lookX=-9.9+.87*glance,lookZ=60.3;
   return {x:q.x,z:q.z,yaw:Math.atan2(lookX-q.x,lookZ-q.z),clip:id==='pixel'?'watch':'interact',controls:id==='neon'};
  }
  if(id==='neon')return {x:q.x,z:q.z,yaw:Math.atan2(10-q.x,40-q.z),clip:'idle',bar:true};
  const t=(p.elapsed-wait-length/life.SPEED)%12;
  return {x:q.x,z:q.z,yaw:Math.PI/2,clip:t<1?'idle':t<5?'vr-aim':t<7?'vr-shoot':t<10?'vr-duck':'idle'};
 }
 function choose(exchanges,pose,adminNearby,lastPlayed,random=Math.random){
  const eligible=exchanges.filter(e=>e.locations.includes(pose.kind)&&(!e.requiresAdminNearby||adminNearby)&&
   e.lines.reduce((sum,l)=>sum+l.seconds+.8,1)<pose.remaining);
  if(!eligible.length)return null;
  const oldest=Math.min(...eligible.map(e=>lastPlayed.get(e.id)||0));
  const pool=eligible.filter(e=>(lastPlayed.get(e.id)||0)===oldest);
  return pool[Math.floor(random()*pool.length)];
 }
 if(typeof module==='object'&&module.exports){module.exports={makeRoute,choose,stops,activityPose};return;}
 const route=makeRoute(root.VoidDistrictLife),figs=new Map(),history=new Map();
 let availableAt=0,exchangeStart=0;
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
  const solo=activityPose('neon',p,root.VoidDistrictLife);
  const location=solo?.bar?root.VoidNeoChinatown.toWorld(solo.x,solo.z):w;
  const venue=solo?.bar?'bar':p.kind;
  const close=typeof walker!=='undefined'&&walker&&Math.hypot(walker.x-location[0],walker.z-location[1])<6;
  const audible=close&&typeof mode!=='undefined'&&mode==='walking'&&!document.hidden&&!root.VoidArcade?.playing;
  if(!audible||visit!==venue){if(exchange||spoken)silence();next=clock+1;visit=venue;}
  const status=root.VoidAudio?.voiceStatus,own=spoken&&status?.id===spoken.speaker&&status?.text===spoken.text;
  if(audible&&status?.active&&!own){silence();next=clock+2;}
  if(audible&&(p.kind!=='vr'||solo?.bar)&&p.kind!=='kiss'&&clock>=next&&(exchange||clock>=availableAt)&&!status?.active&&script.length){
   if(!exchange){
    const admin=p.kind==='store'&&typeof state!=='undefined'&&!state.story?.flags?.adminOccupied;
    exchange=choose(solo?.bar?script.filter(e=>e.lines.every(l=>l.speaker==='neon'||l.speaker==='bartender')):script,{...p,kind:venue,remaining:p.remaining-(solo?.bar?15:0)},admin,history);index=0;
    if(exchange){history.set(exchange.id,Date.now());exchangeStart=clock;}else next=clock+2;
   }
   if(exchange){
    spoken=exchange.lines[index++];announce(names[spoken.speaker]+' · '+spoken.text);
    root.VoidAudio?.speak(spoken.speaker,spoken.text,false,false,true);
    next=clock+spoken.seconds+.45;
    if(index===exchange.lines.length){exchange=null;availableAt=next+(next-exchangeStart)+18;}
   }
  }
  for(const [id,f] of figs){
   const pose=activityPose(id,p,root.VoidDistrictLife),walking=pose?pose.walking:p.kind==='district',kissing=p.kind==='kiss',side=id==='pixel'?1:-1;
   const approach=kissing?Math.min(1,p.elapsed,p.remaining):0;
   const ease=approach*approach*(3-2*approach);
   const lateral=side*(.32-.20*ease);
   f.node.position.x=w[0]+Math.cos(yaw)*lateral;f.node.position.z=w[1]-Math.sin(yaw)*lateral;
   f.heading=yaw-side*Math.PI/2*ease;
   if(pose){
    const pos=root.VoidNeoChinatown.toWorld(pose.x,pose.z);f.node.position.x=pos[0];f.node.position.z=pos[1];f.heading=pose.yaw+Math.PI;
   }
   f.node.rotationQuaternion=root.BABYLON.Quaternion.RotationYawPitchRoll(f.heading,0,0);
   const talking=own&&status?.active&&spoken?.speaker===id;
   const clip=walking?'walk':pose?.controls?'interact':talking?'talk':pose?.clip||(p.kind==='store'?'look':'idle');
   if(f.clip!==clip){f.ctrl.play(clip);f.clip=clip;if(walking)f.walk.pause();}
   if(pose?.controls){
    const cab=root.VoidNeoChinatown.arcade.find(c=>c.game==='hotel-headshots');
    const beat=p.elapsed*4.6;
    for(const [side,dx,h] of [['Left',-.16,1.145],['Right',.14,1.095]]){
     const arm=f.hands[side];if(!arm)continue;
     const [x,z]=root.VoidNeoChinatown.toWorld(cab.x+.42,cab.z+dx);
     const press=side==='Right'?.023*Math.max(0,Math.sin(beat)):.008*Math.sin(beat*.53);
     root.VoidCrowd.reachHand(arm,new root.BABYLON.Vector3(x,h-press,z),f.heading);
    }
   }
   if(walking){
    const phase=((pose?.distance??p.distance)/people[id].stride+(side>0?.25:.75))%1;
    f.walk.goToFrame(f.walk.from+phase*(f.walk.to-f.walk.from));
   }
  }
  if(p.kind==='district'||p.kind==='kiss')joinHands();
 }
 function joinHands(){
  const a=figs.get('pixel'),b=figs.get('neon');if(!a?.arm||!b?.arm)return;
  const goal=a.arm[0].computeWorldMatrix(true).getTranslation().add(b.arm[0].computeWorldMatrix(true).getTranslation()).scale(.5);
  goal.y-=.37;
  for(const f of [a,b])root.VoidCrowd.reachHand(f.arm,goal,f.heading);
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
    const walk=made.metadata.animationGroups.find(g=>g.name.endsWith('-walk'));
    const side=id==='pixel'?'Left':'Right',bones=made.getDescendants();
    const arm=['Arm','ForeArm','Hand'].map(k=>bones.find(n=>n.name.endsWith(':'+side+k)));
    const ctrl=root.VoidCrowd.animate(made,model,'idle');walk.enableBlending=false;
    const hands={};
    for(const side of ['Left','Right']){
     const chain=['Arm','ForeArm','Hand'].map(k=>bones.find(n=>n.name.endsWith(':'+side+k)));
     if(chain.every(n=>n?.rotationQuaternion))hands[side]=chain;
    }
    figs.set(id,{node,ctrl,walk,hands,arm:arm.every(n=>n?.rotationQuaternion)?arm:null,clip:'idle'});
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
 root.VoidPixelNeon={get ready(){return figs.size===2;},get boothVisit(){
  if(!scene||!inside())return null;
  const p=route(Date.now()/1000+(root.VoidDistrictLife.offset||0));return p.kind==='vr'?p:null;
 },get activity(){return visit;}};
})(globalThis);
