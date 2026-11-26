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
 // Each visit uses the same sequence and local clip time for every observer.
 const vrSequences=[
  [['cowgirlf',15.07],['rodeof',10.07]],
  [['teddyf',2.4],['bananaf',2.55]],
  [['missf',10.07]],
  [['pgf',6.73]],
  [['doggyf',6.73]]
 ];
 const vrLengths=Object.fromEntries(vrSequences.flat());
 vrLengths.doubleactf1=vrLengths.doggyf;
 const vrDefaults={x:-12.6,z:32.4,yaw:90,duration:115,fade:.55,sequences:vrSequences.map(steps=>({weight:1,speed:1,clips:steps.map(([id])=>id)}))};
 function validVR(c){
  const range=(v,a,b)=>Number.isFinite(v)&&v>=a&&v<=b;
  return !!c&&range(c.x,-13,-12)&&range(c.z,32,33)&&range(c.yaw,-180,180)&&range(c.fade,.05,2)&&range(c.duration,50,300)&&
   Array.isArray(c.sequences)&&c.sequences.length>0&&c.sequences.length<=12&&c.sequences.some(s=>s?.weight>0)&&
   c.sequences.every(s=>s&&Number.isInteger(s.weight)&&range(s.weight,0,100)&&range(s.speed,.25,2)&&Array.isArray(s.clips)&&s.clips.length>0&&s.clips.length<=16&&s.clips.every(id=>Object.hasOwn(vrLengths,id))&&
    (s.enabled===undefined||(Array.isArray(s.enabled)&&s.enabled.length===s.clips.length&&s.enabled.every(v=>typeof v==='boolean')&&(!s.weight||s.enabled.some(Boolean)))));
 }
 function vrFrame(visit,time,remaining,config){
  const total=config.sequences.reduce((n,s)=>n+s.weight,0);
  let ticket=((visit*.61803398875)%1+1)%1*total;
  const selected=config.sequences.find(s=>{ticket-=s.weight;return ticket<0;});
  const sequence=selected.clips.filter((_,i)=>selected.enabled?.[i]!==false).map(id=>[id==='doubleactf1'?'doggyf':id,vrLengths[id]/selected.speed]);
  const duration=sequence.reduce((n,step)=>n+step[1],0)+2;
  let phase=time%duration;
  if(remaining<1||phase<1)return {clip:'idle'};
  phase-=1;
  for(const [name,length] of sequence){
   if(phase<length)return {clip:'sz-'+name,phase:phase/length};
   phase-=length;
  }
  return {clip:'idle'};
 }
 const modelFile=id=>(id==='npc-pixel'||id==='npc-neon')?'assets/models/crowd/'+id+'.vrpak':null;
 const shared=typeof module==='object'&&module.exports?require('./shared-activities.js'):root.VoidSharedActivities;
 function makeRoute(life,config=vrDefaults,library=[],edits={}){
  const legs=[];let total=0;
  function travel(points){
   const duration=life.length(points)/life.SPEED;
   legs.push({path:points,start:total,end:total+duration});total+=duration;
  }
  // Both clients see the same occasional stop. The detour is on the east side of the hall.
  const visits=shared.plan(stops,library,edits);
  for(let i=0;i<visits.length;i++){
   const {place,lap,decision}=visits[i];
   const replay=visits[i+1]?.replay?visits[++i]:null;
   const nextPlace=visits[i].next,path=life.route(place,nextPlace);
   const seconds=place.kind==='vr'?config.duration:place.seconds;
   const extra=replay?40:0;
   const lead=decision?shared.duration(decision.entry)+2+(decision.rule.delay||0):0;
   const decisionAt=decision?Math.max(1,seconds-lead-(place.kind==='arcade'?5:0)):null;
   legs.push({place,lap,decision,decisionAt,next:nextPlace.kind,start:total,end:total+seconds+extra});total+=seconds+extra;
   if(lap===1&&place.kind==='arcade'&&place.door>54&&nextPlace.door<52){
    const k=path.findIndex((b,j)=>j&&path[j-1][1]>54&&b[1]<52);
    const bay=[1.72,53];
    travel([...path.slice(0,k),[1.72,54.5],bay]);
    legs.push({place:{kind:'kiss',at:bay,face:[1.72,52]},start:total,end:total+5});total+=5;
    travel([bay,[1.72,51.5],...path.slice(k)]);
   }else travel(path);
   const leg=legs[legs.length-1];leg.next=nextPlace.kind;
   if(nextPlace.kind==='arcade'&&(!decision||lap%2===1)){
    const approach=library.find(e=>e.locations.includes('district')&&({...e.behavior,...edits[e.id]}).destination==='arcade');
    if(approach&&leg.end-leg.start>shared.duration(approach)+1){leg.decision={entry:approach,rule:{...approach.behavior,...edits[approach.id]}};leg.decisionAt=.2;}
   }
  }
  const sample=seconds=>{
   const t=((seconds%total)+total)%total,leg=legs.find(s=>t<s.end),elapsed=t-leg.start;
   const intention={nextActivity:leg.next||null,decision:leg.decision||null,decisionAt:leg.decisionAt??null,legStart:seconds-elapsed};
   if(leg.path){
    const distance=elapsed*life.SPEED,len=(leg.end-leg.start)*life.SPEED;
    const width=Math.min(.42,distance,len-distance),point=d=>life.along(leg.path,d);
    const p=point(distance),a=point(distance-width),b=point(distance+width);
    // Round the path around corners and face its tangent.
    const dx=b.x-a.x,dz=b.z-a.z;
    return {...intention,x:(a.x+2*p.x+b.x)/4,z:(a.z+2*p.z+b.z)/4,kind:'district',yaw:Math.atan2(width>1e-5?dx:p.dx,width>1e-5?dz:p.dz),elapsed,distance,remaining:leg.end-t};
   }
   const p=leg.place,remaining=leg.end-t;
   let yaw=Math.atan2(p.face[0]-p.at[0],p.face[1]-p.at[1]);
   if(elapsed<1||remaining<1){
    const i=legs.indexOf(leg),entering=elapsed<1,adjacent=legs[(i+(entering?-1:1)+legs.length)%legs.length].path;
    const at=entering?adjacent.length-2:0,a=adjacent[at],b=adjacent[at+1];
    const travelYaw=Math.atan2(b[0]-a[0],b[1]-a[1]),u=1-Math.min(elapsed,remaining);
    yaw+=Math.atan2(Math.sin(travelYaw-yaw),Math.cos(travelYaw-yaw))*u*u*(3-2*u);
   }
   return {...intention,x:p.at[0],z:p.at[1],kind:p.kind,yaw,elapsed,remaining,visit:Math.floor(seconds/total)*3+leg.lap};
  };
  sample.legs=legs;sample.duration=total;return sample;
 }
 // Individual paths begin and end at the couple's shared formation. Pixel uses
 // the opening at the end of the glass. Neon reaches the bar via the hallway.
 function activityPose(id,p,life,config=vrDefaults){
  const side=id==='pixel'?1:-1;
  const origin=[p.x+Math.cos(p.yaw)*side*.32,p.z-Math.sin(p.yaw)*side*.32];
  if(p.kind!=='vr'&&p.kind!=='arcade')return null;
  let path;
  if(p.kind==='arcade'){
   path=[origin,id==='neon'?[-9.03,60.3]:[-8.82,61.04]];
  }else if(id==='pixel'){
   path=[origin,[-6.4,30.2],[-7.3,28.95],[-8.5,28.62],[-9.7,28.62],[config.x,config.z]];
  }else{
   path=[origin,[-3.4,32.4],[0,32.4],[0,33.5],[3.4,33.5],[10.6,34.6],[10.6,36.9]];
  }
  const length=life.length(path),wait=p.kind==='vr'&&id==='pixel'?9:0;
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
  const approach=wait+length/life.SPEED;
  return {x:q.x,z:q.z,yaw:config.yaw*Math.PI/180,vr:true,...vrFrame(p.visit,p.elapsed-approach,p.remaining-approach,config)};
 }
 function choose(exchanges,pose,adminNearby,lastPlayed,random=Math.random){
  const eligible=exchanges.filter(e=>e.locations.includes(pose.kind)&&(!e.requiresAdminNearby||adminNearby)&&
   e.lines.reduce((sum,l)=>sum+l.seconds+.8,1)<pose.remaining);
  if(!eligible.length)return null;
  const oldest=Math.min(...eligible.map(e=>lastPlayed.get(e.id)||0));
  const pool=eligible.filter(e=>(lastPlayed.get(e.id)||0)===oldest);
  return pool[Math.floor(random()*pool.length)];
 }
 if(typeof module==='object'&&module.exports){module.exports={makeRoute,choose,stops,activityPose,validVR,vrDefaults};return;}
 const defaults={};let testDialogue=null,routineEdits=defaults,lastEdits,lastLibrary,testConfig=null,config=vrDefaults,lastConfig,route=makeRoute(root.VoidDistrictLife);
 function refreshConfig(){
  routineEdits=testDialogue||root.VoidLiveContent?.env?.pairDialogue||defaults;
  const c=testConfig||root.VoidLiveContent?.env?.pixelVR;
  if(c===lastConfig&&lastLibrary===script&&lastEdits===routineEdits)return;
  lastLibrary=script;lastEdits=routineEdits;
  lastConfig=c;config=validVR(c)?c:vrDefaults;route=makeRoute(root.VoidDistrictLife,config,script,routineEdits);
 }
 const figs=new Map();
 let exchangeStart=0,lastBeat=null,currentState=null,slotKey=null,slotEntry=null;
 let scene=null,observer=null,loading=false,retry=0,script=[],spoken=null,visit=null;
 const inside=()=>typeof walkingLocation!=='undefined'&&walkingLocation?.id==='neochinatown'&&walkingLocation.area==='interior';
 function silence(){
  const status=root.VoidAudio?.voiceStatus;
  if(spoken&&status?.id===spoken.speaker&&status.text===spoken.text&&status.active)root.VoidAudio.cancel();
  spoken=null;
 }
 function drop(){
  silence();if(observer)scene.onBeforeRenderObservable.remove(observer);
  for(const f of figs.values()){f.ctrl?.dispose();f.node.dispose();}
  figs.clear();scene=null;observer=null;visit=null;
 }
 function tick(){
  if(!inside()||scene!==root.VoidBabylon?.scene||scene.isDisposed){drop();return;}
  refreshConfig();
  const clock=performance.now()/1000,p=route(Date.now()/1000+(root.VoidDistrictLife.offset||0));
  const w=root.VoidNeoChinatown.toWorld(p.x,p.z),yaw=p.yaw+Math.PI;
  const solo=activityPose('neon',p,root.VoidDistrictLife,config);
  const location=solo?.bar?root.VoidNeoChinatown.toWorld(solo.x,solo.z):w;
  const venue=solo?.bar?'bar':p.kind;
  const close=typeof walker!=='undefined'&&walker&&Math.hypot(walker.x-location[0],walker.z-location[1])<6;
  const audible=close&&typeof mode!=='undefined'&&mode==='walking'&&!document.hidden&&!root.VoidArcade?.playing;
  if(!audible||visit!==venue){if(spoken)silence();visit=venue;}
  const status=root.VoidAudio?.voiceStatus,own=spoken&&status?.id===spoken.speaker&&status?.text===spoken.text;
  if(audible&&status?.active&&!own){silence();}
  const admin=p.kind==='store'&&typeof state!=='undefined'&&!state.story?.flags?.adminOccupied;
  const ctx={venue,split:!!solo?.bar,admin,iris:p.kind==='store',observer:close,approaching:!!solo?.walking,
   completed:p.elapsed>30,elapsed:p.elapsed,remaining:p.remaining-(solo?.bar?15:0)};
  const decision=p.decision,scheduled=decision?.entry;
  const beatTime=p.elapsed-p.decisionAt;
  const reserved=!!scheduled&&beatTime>=-1&&beatTime<shared.duration(scheduled)+.5;
  const slot=Math.floor(ctx.elapsed/shared.interval);
  const key=[Math.round(p.legStart),slot,venue,admin,ctx.iris,ctx.split,ctx.approaching,ctx.observer].join('|');
  if(key!==slotKey){
   slotKey=key;
   const freeUntil=scheduled&&beatTime<0?Math.min(ctx.remaining,-beatTime-1):ctx.remaining;
   slotEntry=shared.conversationAt(script,routineEdits,{...ctx,remaining:freeUntil},Math.round(p.legStart),p.visit)?.entry;
  }
  const ambient=slotEntry&&{entry:slotEntry,time:ctx.elapsed-slot*shared.interval-3};
  const forced=forcedExchange&&{entry:forcedExchange,time:clock-exchangeStart};
  const beat=forced|| (reserved?{entry:scheduled,time:beatTime}:ambient);
  const committed=!!scheduled&&beatTime>=scheduled.lines.slice(0,(decision.rule.agreement??scheduled.lines.length-1)+1).reduce((n,l)=>n+l.seconds+.45,0);
  currentState={activity:p.kind,destination:committed?decision.rule.destination:p.nextActivity,initiator:scheduled?.lines[0].speaker||null,
   exchange:null,scheduled:scheduled?.id||null,movement:p.kind==='district'||solo?.walking?'walking':'at destination',
   accepted:committed,remaining:p.remaining};
  if(forced&&forced.time>shared.duration(forced.entry))forcedExchange=null;
  if(beat&&audible&&(p.kind!=='vr'||solo?.bar)&&p.kind!=='kiss'){
   let elapsed=0;
   for(const [i,line] of beat.entry.lines.entries()){
    const age=beat.time-elapsed;elapsed+=line.seconds+.45;
    if(age<0||age>=line.seconds)continue;
    const key=Math.round(p.legStart)+':'+beat.entry.id+':'+Math.round((p.elapsed-beat.time)*2)+':'+i;
    currentState.exchange=beat.entry.id;
    if(lastBeat!==key){
     lastBeat=key;
     if(age<.9&&(!status?.active||own)){
      spoken=line;announce(names[line.speaker]+' · '+line.text);root.VoidAudio?.speak(line.speaker,line.text,false,false,true);
     }
    }
    break;
   }
  }
  for(const [id,f] of figs){
   const pose=activityPose(id,p,root.VoidDistrictLife,config),walking=pose?pose.walking:p.kind==='district',kissing=p.kind==='kiss',side=id==='pixel'?1:-1;
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
   const clip=walking?'walk':pose?.controls?'interact':pose?.vr?pose.clip:talking?'talk':pose?.clip||(p.kind==='store'?'look':'idle');
   if(f.clip!==clip){
    if(id==='pixel'&&(pose?.vr||f.inBooth)){
     f.blendFrom=f.poseTargets.map(({target,property})=>target[property].clone());
     f.blendAt=clock;
    }
    f.ctrl.play(clip);f.clip=clip;if(walking)f.walk.pause();}
   if(pose?.phase!==undefined){
    const group=f.vrClips.get(clip);
    if(group){
     group.pause();
     const frame=group.from+pose.phase*(group.to-group.from);
     for(const track of group.targetedAnimations){
      const value=track.target[track.animation.targetProperty];
      if(value?.copyFrom)value.copyFrom(track.animation.evaluate(frame));
     }
    }
   }
   f.inBooth=!!pose?.vr;
   if(f.blendFrom){
    const t=Math.min(1,(clock-f.blendAt)/config.fade),amount=t*t*(3-2*t);
    if(t>=1)f.blendFrom=null;
    else f.poseTargets.forEach(({target,property},i)=>{
     const value=target[property],from=f.blendFrom[i];
     if(property==='rotationQuaternion')root.BABYLON.Quaternion.SlerpToRef(from,value,amount,value);
     else root.BABYLON.Vector3.LerpToRef(from,value,amount,value);
    });
   }
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
    return assets.container(key)||assets.load(key,{src:modelFile('npc-'+id),background:true},target);
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
    const vrClips=new Map(vrSequences.flat().map(([name])=>{
     const clip='sz-'+name;
     return [clip,made.metadata.animationGroups.find(g=>g.name.endsWith('-'+clip))];
    }));
    const sample=[...vrClips.values()].find(Boolean);
    const poseTargets=(sample?.targetedAnimations||[]).map(a=>({target:a.target,property:a.animation.targetProperty}))
     .filter(({target,property})=>(property==='position'||property==='rotationQuaternion')&&target[property]);
    for(const group of vrClips.values())if(group)group.enableBlending=false;
    figs.set(id,{node,ctrl,walk,hands,vrClips,poseTargets,arm:arm.every(n=>n?.rotationQuaternion)?arm:null,clip:'idle'});
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
 let forcedExchange=null;
 function inspectJump(id){
  refreshConfig();
  const entry=script.find(e=>e.id===id);
  const rule=entry&&{...entry.behavior,...routineEdits[id]};
  const leg=route.legs.find(l=>l.decision?.entry.id===id)||
   route.legs.find(l=>l.place&&entry?.locations.includes(l.place.kind)&&(!rule?.from||rule.from===l.place.kind))||route.legs[0];
  const timed=leg.decision?.entry.id===id;
  const offset=timed?leg.decisionAt:rule?.phase==='after'?Math.max(1,leg.end-leg.start-32):rule?.phase==='before'?2:30;
  const t=leg.start+(id?Math.max(0,offset-(timed?1:0)):0);
  root.VoidDistrictLife.offset=t-Date.now()/1000;
  silence();
  forcedExchange=timed?null:entry;exchangeStart=performance.now()/1000+1;
  const pose=route(t),point=activityPose('neon',pose,root.VoidDistrictLife,config)||pose;
  const [x,z]=root.VoidNeoChinatown.toWorld(point.x,point.z);
  return [x,1.7,z+1.5];
 }
 async function testRoutine(edits,id){
  if(!shared.valid(edits))return {problem:'Check the conversation action settings.'};
  script=await root.VoidVoiceClips.districtExchanges;
  if(!script.length)return {problem:'The conversation recordings are unavailable.'};
  return root.VoidDevTest.session({kind:'pair-routine',banner:'PIXEL & NEON ROUTINE',leave:'EXIT TEST',
   build(){const s=C.startDistrictCampaign(C.fresh());s.location='earth';Object.assign(s.story.flags,{area:'district',districtBadge:true,podWakePending:false,appearanceOffered:true});return s;},
   async enter(){
    testDialogue=structuredClone(edits);refreshConfig();
    await enterWalking(VoidDistrictArea.KEY.interior,{silent:true,spawn:inspectJump(id)});
    inspectJump(id);
    const banner=document.getElementById('dev-test-banner'),status=document.createElement('output'),skip=document.createElement('button');
    skip.textContent='Skip to next activity';skip.onclick=()=>{
     const t=Date.now()/1000+root.VoidDistrictLife.offset,leg=route(t);
     root.VoidDistrictLife.offset+=leg.remaining+.2;
     const q=route(t+leg.remaining+.2),xy=root.VoidNeoChinatown.toWorld(q.x,q.z);walker.x=xy[0];walker.z=xy[1]+1.5;
     forcedExchange=null;silence();
    };banner.append(status,skip);
    const timer=setInterval(()=>{if(!root.VoidDevTest.active){clearInterval(timer);status.remove();skip.remove();return;}
     if(currentState)status.textContent=[currentState.exchange,currentState.initiator,currentState.activity+' → '+(currentState.destination||'hallway'),currentState.movement,figs.get('pixel')?.clip].filter(Boolean).join(' · ');
    },250);
   }
  });
 }
 async function previewVR(draft){
  if(!validVR(draft))return {problem:'Check the sequence settings before testing.'};
  return root.VoidDevTest.session({
   kind:'pixel-vr',banner:'PIXEL VR VISIT',leave:'EXIT TEST',
   build(){const fresh=C.startDistrictCampaign(C.fresh());fresh.location='earth';Object.assign(fresh.story.flags,{area:'district',districtBadge:true,podWakePending:false,appearanceOffered:true});return fresh;},
   async enter(){
    testConfig=structuredClone(draft);refreshConfig();
    const [x,z]=root.VoidNeoChinatown.toWorld(-6.8,32.4);
    await enterWalking(VoidDistrictArea.KEY.interior,{silent:true,spawn:[x,1.7,z]});
    const t=route.legs.find(leg=>leg.place?.kind==='vr').start;
    root.VoidDistrictLife.offset=t-3-Date.now()/1000;
   }
  });
 }
 root.VoidPixelNeon={testRoutine,modelFile,previewVR,validVR,vrDefaults,clipIds:Object.keys(vrLengths),get ready(){return figs.size===2;},get boothVisit(){
  if(!scene||!inside())return null;
  const p=route(Date.now()/1000+(root.VoidDistrictLife.offset||0));return p.kind==='vr'?p:null;
 },get activity(){return visit;},get objective(){return currentState;}};
})(globalThis);
