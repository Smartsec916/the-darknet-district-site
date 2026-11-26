/* Pixel and Neon share the District resident clock and the same hallway routes as the ambient crew. */
(function(root){
 'use strict';
 const people={pixel:{name:'Pixel',height:1.65,stride:1.44},neon:{name:'Neon',height:1.70,stride:1.50}};
 const names={pixel:'Pixel',neon:'Neon',bartender:'Bartender',admin:'Admin',iris:'Iris'};
 const stops=[
  {kind:'arcade',at:[-8.45,60.3],face:[-9.9,60.3],door:62,via:[[-3.4,62],[-6,62],[-6,60.3]],seconds:180},
  {kind:'vr',at:[-5.4,32],face:[-12.6,32.4],door:32.4,via:[[-3.4,32.4]],seconds:50},
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
  const close=typeof walker!=='undefined'&&walker&&Math.hypot(walker.x-w[0],walker.z-w[1])<6;
  const audible=close&&typeof mode!=='undefined'&&mode==='walking'&&!document.hidden&&!root.VoidArcade?.playing;
  if(!audible||visit!==p.kind){if(exchange||spoken)silence();next=clock+1;visit=p.kind;}
  const status=root.VoidAudio?.voiceStatus,own=spoken&&status?.id===spoken.speaker&&status?.text===spoken.text;
  if(audible&&status?.active&&!own){silence();next=clock+2;}
  if(audible&&p.kind!=='kiss'&&clock>=next&&(exchange||clock>=availableAt)&&!status?.active&&script.length){
   if(!exchange){
    const admin=p.kind==='store'&&typeof state!=='undefined'&&!state.story?.flags?.adminOccupied;
    exchange=choose(script,p,admin,history);index=0;
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
   const walking=p.kind==='district',kissing=p.kind==='kiss',side=id==='pixel'?1:-1;
   const approach=kissing?Math.min(1,p.elapsed,p.remaining):0;
   const ease=approach*approach*(3-2*approach);
   const lateral=side*(.32-.20*ease);
   f.node.position.x=w[0]+Math.cos(yaw)*lateral;f.node.position.z=w[1]-Math.sin(yaw)*lateral;
   f.heading=yaw-side*Math.PI/2*ease;
   f.node.rotationQuaternion=root.BABYLON.Quaternion.RotationYawPitchRoll(f.heading,0,0);
   const talking=own&&status?.active&&spoken?.speaker===id;
   const clip=walking?'walk':talking?'talk':p.kind==='arcade'&&id==='neon'?'interact':p.kind==='vr'?'watch':p.kind==='store'?'look':'idle';
   if(f.clip!==clip){f.ctrl.play(clip);f.clip=clip;if(walking)f.walk.pause();}
   if(walking){
    const phase=(p.distance/people[id].stride+(side>0?.25:.75))%1;
    f.walk.goToFrame(f.walk.from+phase*(f.walk.to-f.walk.from));
   }
  }
  if(p.kind==='district'||p.kind==='kiss')joinHands();
 }
 // Rotate in each joint's parent space so reflected glTF roots and different rest poses work.
 const point=n=>n.computeWorldMatrix(true).getTranslation();
 function aim(joint,tip,target){
  const B=root.BABYLON,inv=joint.parent.computeWorldMatrix(true).clone().invert(),local=p=>B.Vector3.TransformCoordinates(p,inv).subtract(joint.position).normalize();
  const from=local(point(tip)),to=local(target),axis=B.Vector3.Cross(from,to),s=axis.length();
  if(s<.00001)return;
  const q=B.Quaternion.RotationAxis(axis.scale(1/s),Math.atan2(s,B.Vector3.Dot(from,to)));
  joint.rotationQuaternion.copyFrom(q.multiply(joint.rotationQuaternion));
 }
 function joinHands(){
  const a=figs.get('pixel'),b=figs.get('neon');if(!a?.arm||!b?.arm)return;
  const goal=point(a.arm[0]).add(point(b.arm[0])).scale(.5);
  goal.y-=.37;
  for(const f of [a,b]){
   const [upper,lower,hand]=f.arm,shoulder=point(upper),elbow=point(lower),wrist=point(hand);
   const toward=goal.subtract(shoulder),distance=toward.length(),axis=toward.normalize();
   const upperLength=elbow.subtract(shoulder).length(),lowerLength=wrist.subtract(elbow).length();
   const reach=Math.max(.01,Math.min(distance,upperLength+lowerLength-.001));
   const along=(upperLength**2-lowerLength**2+reach**2)/(2*reach);
   const back=new root.BABYLON.Vector3(-Math.sin(f.heading),-.6,-Math.cos(f.heading));
   const bend=back.subtract(axis.scale(root.BABYLON.Vector3.Dot(axis,back))).normalize();
   const targetElbow=shoulder.add(axis.scale(along)).add(bend.scale(Math.sqrt(Math.max(0,upperLength**2-along**2))));
   aim(upper,lower,targetElbow);aim(lower,hand,goal);
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
    const walk=made.metadata.animationGroups.find(g=>g.name.endsWith('-walk'));
    const side=id==='pixel'?'Left':'Right',bones=made.getDescendants();
    const arm=['Arm','ForeArm','Hand'].map(k=>bones.find(n=>n.name.endsWith(':'+side+k)));
    const ctrl=root.VoidCrowd.animate(made,model,'idle');walk.enableBlending=false;
    figs.set(id,{node,ctrl,walk,arm:arm.every(n=>n?.rotationQuaternion)?arm:null,clip:'idle'});
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
