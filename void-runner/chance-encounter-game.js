(function(root){
 'use strict';
 const B=()=>root.BABYLON;
 const laceFile='assets/models/crowd/npc-lib-eb1d6cc8.vrpak';
 const keyModel='assets/models/keycards/kade-lace-key.glb';
 const kadeLook='npc-hacker',laceLook='npc-lib-eb1d6cc8';
 let running=null;
 function delay(ms,signal){
  return new Promise((resolve,reject)=>{
   if(signal.aborted){reject(signal.reason);return;}
   const stop=()=>{clearTimeout(timer);reject(signal.reason);};
   const timer=setTimeout(()=>{signal.removeEventListener('abort',stop);resolve();},ms);
   signal.addEventListener('abort',stop,{once:true});
  });
 }
 async function until(check,signal,timeout=0){
  const start=performance.now();
  while(!check()){
   if(timeout&&performance.now()-start>timeout)throw Error('The encounter could not prepare the location in time.');
   await delay(80,signal);
  }
 }
 async function model(run,id,src,height,localBuffer){
  const scene=root.VoidBabylon.scene,assets=root.VoidAssets;
  if(!assets.container(id)){
   const def={src,background:true,localBuffer};try{await assets.load(id,def,scene);}finally{delete def.localBuffer;}
  }
  run.signal.throwIfAborted();
  if(scene!==root.VoidBabylon.scene||scene.isDisposed)throw Error('The location changed during loading.');
  const parent=new (B().TransformNode)('encounter-'+id,scene);
  run.owned.add(parent);
  const made=assets.instance(id,parent);
  if(!made)throw Error('Could not load '+id+'.');
  if(height){
   const box=made.getHierarchyBoundingVectors(true),scale=height/(box.max.y-box.min.y);
   made.scaling.scaleInPlace(scale);made.position.y=-box.min.y*scale;
  }
  return {parent,made};
 }
 function play(figure,name,loop=true){
  const all=figure.made.metadata.animationGroups||[];
  const clip=all.find(g=>g.name.toLowerCase().endsWith('-'+name));
  if(!clip)throw Error('The assigned animation is unavailable: '+name);
  if(figure.returnToPose){
   const {group,observer}=figure.returnToPose;
   group.onAnimationGroupEndObservable.remove(observer);figure.returnToPose=null;
  }
  for(const group of all)if(group!==clip&&group.isPlaying)group.stop();
  if(!loop&&clip.isStarted)clip.stop();
  clip.start(loop);
  if(!loop&&name==='sz-tiedbf-look-back-return'){
   const observer=clip.onAnimationGroupEndObservable.addOnce(()=>{
    figure.returnToPose=null;
    if(!figure.parent.isDisposed())play(figure,'sz-tiedbf');
   });
   figure.returnToPose={group:clip,observer};
  }
  return clip;
 }
 async function assignedClip(figure,look,name,signal,loop=true){
  if(!figure.made.metadata.animationGroups.some(g=>g.name.toLowerCase().endsWith('-'+name))){
   await root.VoidAnimLibrary.apply(figure.made,look,{only:[name],catalog:false});
  }
  signal?.throwIfAborted();return play(figure,name,loop);
 }
 async function lines(run,prefix,section,signal=run.signal,caption=announce){
  const api=root.VoidChanceEncounter,sections=api.dialogueSections(run.graph);
  const byId=new Map(run.graph.dialogue.map(row=>[row.id,row])),controls=[];
  async function action(line,signal,replay){
   signal.throwIfAborted();
   const text=replay&&!line.repeatSpeech?'':line.text.trim();
   const animation=replay&&!line.repeatAnimation?'':line.animation;
   if(text||animation){
    if(line.delay)await delay(line.delay*1000,signal);
    const clip=animation&&run.lace?await assignedClip(run.lace,laceLook,animation,signal,false):null;
    try{
     if(text){
      caption(line.speaker+' · '+text);
      const recording=line.recording&&{...line.recording,src:run.private?'draft':'live'};
      const bus=root.VoidAudio?.bus('voice');
      if(bus&&(recording||root.VoidVoiceClips?.has(line.speaker,line.text))){
       const silence=()=>root.VoidVoiceClips.cancel();
       signal.addEventListener('abort',silence,{once:true});
       try{await root.VoidVoiceClips.speak({characterId:line.speaker,text:line.text,bus:bus.node,recording});}
       finally{signal.removeEventListener('abort',silence);}
      }else await delay(Math.max(1500,text.length*55),signal);
     }
     if(clip)await until(()=>!clip.isPlaying,signal);
    }finally{if(clip&&signal.aborted)clip.stop();}
   }
   signal.throwIfAborted();
   const branch=api.chooseBranch(line);
   if(branch)await sequence(branch.actions.map(id=>byId.get(id)),branch.passes??1,signal,true);
  }
  async function sequence(rows,passes,parentSignal,child=false){
   const {before,cycle,after}=api.playlist(rows,child&&passes!==1);
   for(const row of before)await action(row,parentSignal,false);
   if(cycle.length){
    const controller=new AbortController(),signal=controller.signal,cancel=()=>controller.abort();
    const key=e=>{if(e.code==='Backspace'&&!e.repeat&&controls.at(-1)===button){e.preventDefault();cancel();}};
    let button;
    parentSignal.throwIfAborted();parentSignal.addEventListener('abort',cancel,{once:true});
    if(passes!==1){
     button=document.createElement('button');button.type='button';
     button.textContent=child?'Return to parent playlist':'Stop repeat · Backspace';
     Object.assign(button.style,{position:'fixed',right:'2vw',top:'calc(25vh + '+controls.length*3.1+'rem)',zIndex:76});
     controls.push(button);button.onclick=cancel;document.body.append(button);document.addEventListener('keydown',key,true);
    }
    try{
     const marked=cycle.filter(api.isRepeat);
     for(let pass=0;passes===0||pass<passes;pass++){
      signal.throwIfAborted();
      for(const row of pass&&marked.length?marked:cycle)await action(row,signal,pass>0&&marked.length>0);
      if(passes===0||pass+1<passes)await delay(250,signal);
     }
    }catch(error){if(!signal.aborted)throw error;}
    finally{
     parentSignal.removeEventListener('abort',cancel);
     if(button){controls.splice(controls.indexOf(button),1);button.remove();document.removeEventListener('keydown',key,true);}
    }
    parentSignal.throwIfAborted();
    if(child&&signal.aborted)return;
   }
   for(const row of after)await action(row,parentSignal,false);
  }
  await sequence(sections[section||prefix]||[],0,signal);
 }
 function standing(figure,pose){
  figure.parent.position.set(pose.x,pose.y||0,pose.z);
  figure.parent.rotation.y=pose.yaw||0;
 }
 function address(run){
  const live=root.VoidLiveContent?.current?.content?.characters?.[run.graph.residence?.character]?.residence;
  const home=live||(run.private?{door:'apt-road-n-27',slot:0}:null);
  const door=home&&root.VoidApartments.door(home.door);
  if(!door||!Number.isInteger(home.slot))throw Error('Kade needs a registered apartment.');
  return {door,slot:home.slot,number:root.VoidApartments.slotNumber(home.slot,door.style),
   target:root.VoidApartments.residenceKey(door.id,home.slot)};
 }
 function stop(){
  if(!running)return;
  running.controller.abort(new DOMException('Encounter stopped','AbortError'));
  for(const obj of running.owned)obj.dispose?.();
  running.panel?.remove();running=null;root.dispatchEvent?.(new Event('void-encounter-journal'));
 }
 function panel(run){
  if(!run.panel){
   run.panel=document.createElement('aside');run.panel.id='chance-interaction';
   Object.assign(run.panel.style,{position:'fixed',right:'2vw',bottom:'10vh',zIndex:'75',padding:'14px',color:'#e1eeec'});
   document.body.append(run.panel);
  }
  return run.panel;
 }
 function prompt(run,text,choices,onLeave,waiting=false){
  const host=panel(run);host.hidden=false;host.replaceChildren();
  const line=document.createElement('p');line.textContent=text;host.append(line);
  return new Promise((resolve,reject)=>{
   let locationTimer,waitController;
   const cleanup=()=>{waitController?.abort();clearInterval(locationTimer);document.removeEventListener('keydown',keys,true);run.signal.removeEventListener('abort',cancel);};
   const select=label=>{cleanup();host.hidden=true;resolve(label);};
   const keys=e=>{
    if(e.repeat||e.target?.matches?.('input,textarea,select'))return;
    let label=choices[Number(e.key)-1];
    if(e.key==='Escape')label=choices.find(c=>c.startsWith('Cancel'));
    if(label){e.preventDefault();e.stopImmediatePropagation();select(label);}
   };
   const cancel=()=>{cleanup();reject(run.signal.reason);};
   run.signal.addEventListener('abort',cancel,{once:true});
   document.addEventListener('keydown',keys,true);
   if(onLeave){
    const apartment=walkingLocation?.inst;
    locationTimer=setInterval(()=>{if(walkingLocation?.inst!==apartment||walkingLocation?.part!=='flat')select(onLeave);},100);
   }
   if(waiting){
    waitController=new AbortController();
    const subtitle=document.createElement('p');subtitle.setAttribute('role','status');subtitle.hidden=true;host.append(subtitle);
    lines(run,'wait',null,waitController.signal,text=>{subtitle.textContent=text;subtitle.hidden=false;})
     .catch(error=>{if(!waitController.signal.aborted)console.warn('Encounter waiting dialogue:',error);});
   }
   for(const label of choices){
    const b=document.createElement('button');b.type='button';b.textContent=(choices.indexOf(label)+1)+' · '+label;host.append(b);
    b.onclick=()=>select(label);
   }
  });
 }
 async function walk(run){
  await until(()=>root.VoidRoadTaxi?.world?.quarter==='oldtown',run.signal,30000);
  run.actor=await model(run,'crowd:'+kadeLook,'assets/models/crowd/'+kadeLook+'.glb',1.78);
  run.impactVoice=await voiceBuffer(run,'kade-taxi-impact.mp3');
  const crossing=root.VoidChanceCrossing;
  await until(()=>{run.plan=crossing.plan(root.VoidRoadTaxi.world,run.graph.playtest.crossing,run.graph.playtest.delaySeconds,run.private);return run.plan;},run.signal,65000);
  if(run.private)crossing.preparePrivate(run.plan);
  play(run.actor,'walk');
  let lastProgress=0,lastMotion=performance.now();
  await until(()=>{
   if(run.plan.taxi.phase!=='cruise'||root.VoidRoadTaxi.world.quarter!=='oldtown')
    throw Error('The taxi left the crossing before the encounter.');
   const progress=crossing.crossingProgress(run.plan);
   if(progress>lastProgress){lastProgress=progress;lastMotion=performance.now();}
   else if(performance.now()-lastMotion>60000)throw Error('The taxi could not reach the crossing.');
   standing(run.actor,crossing.walking(run.plan,progress*run.plan.seconds));
   return progress>=1;
  },run.signal);
 }
 const witnessLines=[
  'So unsafe. I liked it better when I could yell at a person.',
  "They're revolting! Yesterday mine demanded a tip.",
  'Five stars for pickup. One star for putting him back down.',
  'Somewhere a little checkbox says pedestrian detected.',
  'My taxi asked me to rate the ride. Does he get a vote?',
  'It stopped for a plastic bag this morning. A plastic bag.'
 ];
 // The model folds at its knees while its centre of mass rolls away from the bumper.
 function impactPose(actor,recover=false){
  const scene=root.VoidBabylon.scene,node=actor.parent;
  const start={x:node.rotation.x,y:node.position.y,z:node.position.z};
  const duration=recover ? .85 : .58;
  let elapsed=0;
  const obs=scene.onBeforeRenderObservable.add(()=>{
   elapsed+=Math.min(.1,scene.getEngine().getDeltaTime()/1000);
   const t=Math.min(1,elapsed/duration),weight=t*t*(3-2*t);
   node.rotation.x=start.x+((recover?0:-1.29)-start.x)*weight;
   node.position.y=start.y+((recover?0:.16)-start.y)*weight;
   node.position.z=start.z+(recover?0:-.48)*weight;
   if(t===1)scene.onBeforeRenderObservable.remove(obs);
  });
  node.onDisposeObservable.addOnce(()=>scene.onBeforeRenderObservable.remove(obs));
 }
 async function voiceBuffer(run,file){
  const bus=root.VoidAudio?.bus('voice');
  if(!bus)return null;
  try{
   const response=await fetch('void-runner/assets/audio/voice/'+file,{signal:run.signal});
   if(!response.ok)return null;
   return await bus.context.decodeAudioData(await response.arrayBuffer());
  }catch{return null;}
 }
 function playVoice(run,buffer){
  const voice=root.VoidAudio?.bus('voice');
  if(!voice||!buffer||run.signal.aborted)return;
  const source=voice.context.createBufferSource();source.buffer=buffer;source.connect(voice.node);
  const stop=()=>source.stop();
  source.onended=()=>{source.disconnect();run.signal.removeEventListener('abort',stop);};
  run.signal.addEventListener('abort',stop,{once:true});source.start();
 }
 function taxiImpact(run){
  const bus=root.VoidAudio?.bus('effects');
  if(bus){
   const ctx=bus.context,now=ctx.currentTime,body=ctx.createOscillator(),volume=ctx.createGain();
   body.type='triangle';body.frequency.setValueAtTime(143,now);body.frequency.exponentialRampToValueAtTime(42,now+.14);
   volume.gain.setValueAtTime(.001,now);volume.gain.exponentialRampToValueAtTime(.92,now+.008);
   volume.gain.exponentialRampToValueAtTime(.001,now+.30);
   body.connect(volume);volume.connect(bus.node);body.onended=()=>{body.disconnect();volume.disconnect();};
   body.start(now);body.stop(now+.31);
  }
  playVoice(run,run.impactVoice);
  const event=root.VoidCrowdReact?.spectacle({...run.plan.hit,radius:12,duration:6,kind:'taxi-impact',filmCap:0});
  if(!event)return;
  run.signal.addEventListener('abort',event.end,{once:true});
  if(event.reactions.some(person=>person.mode==='watch')){
   const index=Math.floor(Math.random()*witnessLines.length);
   Promise.all([delay(1400,run.signal),voiceBuffer(run,'taxi-witness-'+(index+1)+'.ogg')]).then(([,buffer])=>{
    if(!run.signal.aborted&&walkingLocation?.area==='street'&&root.VoidRoadTaxi?.world?.quarter==='oldtown'){
     announce('Passer-by: '+witnessLines[index]);playVoice(run,buffer);
    }
   }).catch(e=>{if(e.name!=='AbortError')console.warn(e);});
  }
 }
 function preloadLace(run){
  if(!run.laceBytes&&run.graph.placement){
   run.laceBytes=fetch('void-runner/'+laceFile,{signal:run.signal})
    .then(r=>r.ok?r.arrayBuffer():null).then(bytes=>bytes?root.VoidAssets.open(bytes):null).catch(()=>null);
  }
 }
 async function drop(run){
  const home=address(run);
  const info=run.private?{name:"Kade and Lace's Apartment Key",position:run.graph.dropPosition,range:run.graph.pickupDistance,model:keyModel}:
   await root.VoidConsumableGame.request('chance-encounters/drop',{id:run.graph.id,run:run.token});
  const card=await model(run,'encounter-key',info.model||keyModel);
  const at=run.dropPosition=info.position,plan={drop:at,hit:run.plan?.hit||{x:at.x+1.65,z:at.z-.45}};
  const scene=root.VoidBabylon.scene,ray=new (B().Ray)(new (B().Vector3)(at.x,.65,at.z),B().Vector3.Down(),1.2);
  const ground=scene.pickWithRay(ray,m=>m.isEnabled()&&m.isVisible&&/sidewalk|paving|asphalt|road|city-ground/i.test(m.material?.name||m.name));
  const surface=ground?.hit?ground.pickedPoint.y:0;
  card.parent.scaling.setAll(2);
  const start=performance.now();
  do{
   const t=(performance.now()-start)/1000,p=root.VoidChanceCrossing.cardPose(plan,t);
   card.parent.position.set(p.x,p.y+surface+.003,p.z);card.parent.rotation.z=p.spin;
   if(t>=.85)break;
   await delay(16,run.signal);
  }while(true);
  if(run.actor){
   const actor=run.actor;
   const recover=async()=>{
    await delay((run.graph.recoverySeconds??8)*1000,run.signal);
    if(actor.parent.isDisposed())return;
    impactPose(actor,true);
    const exit=play(actor,'floor-knees-up',false);
    await until(()=>!exit.isPlaying||actor.parent.isDisposed(),run.signal);
    if(!actor.parent.isDisposed()){actor.parent.dispose();run.owned.delete(actor.parent);}
   };
   recover().catch(e=>{if(e.name!=='AbortError')console.warn('[Chance encounters]',e.message);});
  }
  // Draw the spill on the road so it remains visible without post-processing on Low.
  const b=B(),halo=b.MeshBuilder.CreateGround('dropped keycard glow',{width:.86,height:.86},scene);
  halo.position.set(at.x,surface+.008,at.z);halo.isPickable=false;
  const texture=new b.DynamicTexture('keycard glow falloff',64,scene,false),ctx=texture.getContext();
  const gradient=ctx.createRadialGradient(32,32,0,32,32,32);
  gradient.addColorStop(0,'rgba(153,255,251,.94)');gradient.addColorStop(.32,'rgba(59,245,231,.60)');gradient.addColorStop(1,'rgba(35,216,210,0)');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);texture.hasAlpha=true;texture.update();
  const light=new b.StandardMaterial('keycard light spill',scene);
  light.disableLighting=true;light.emissiveColor=b.Color3.White();light.diffuseTexture=texture;light.useAlphaFromDiffuseTexture=true;
  light.disableDepthWrite=true;light.alphaMode=b.Engine.ALPHA_ADD;halo.material=light;
  card.parent.onDisposeObservable.addOnce(()=>{halo.dispose();light.dispose();texture.dispose();});
  const rim=card.made.getChildMeshes().find(mesh=>mesh.material?.name?.includes('Brushed edge'));
  if(rim){
   const edge=rim.material.clone('encounter-card-edge');rim.material=edge;
   const scene=card.parent.getScene();
   const pulse=scene.onBeforeRenderObservable.add(()=>{
    const glow=.82+.16*Math.sin(performance.now()*.004);edge.emissiveColor.set(.20*glow,.92*glow,glow);
   });
   card.parent.onDisposeObservable.addOnce(()=>{scene.onBeforeRenderObservable.remove(pulse);edge.dispose();});
  }
  const meshes=card.made.getChildMeshes();
  const focus=()=>{
   const cam=root.VoidBabylon.scene?.activeCamera;
   if(!cam||typeof walker==='undefined'||!walker||walkingLocation?.area!=='street')return false;
   const delta=card.parent.position.subtract(cam.globalPosition);
   return delta.length()<=info.range&&B().Vector3.Dot(cam.getForwardRay().direction,delta.normalize())>.963;
  };
  const host=panel(run);host.replaceChildren();
  const title=document.createElement('strong'),where=document.createElement('p'),pick=document.createElement('button');
  title.textContent=info.name;where.textContent='Street Door '+home.door.number+' — Apartment '+home.number;pick.textContent='Pick up';host.append(title,where,pick);
  let taken=false;
  const take=()=>{if(focus())taken=true;};
  pick.onclick=take;
  const key=e=>{if(e.code==='KeyE'&&!e.repeat&&focus()){e.preventDefault();e.stopImmediatePropagation();take();}};
  document.addEventListener('keydown',key,true);
  try{
   await until(()=>{
    const visible=focus();host.hidden=!visible;
    for(const mesh of meshes){mesh.renderOutline=visible;if(visible){mesh.outlineWidth=.004;mesh.outlineColor=new (B().Color3)(1,.8,.15);}}
    return taken;
   },run.signal);
   if(!run.private){
    await root.VoidConsumableGame.request('keycards/move',{action:'pickup',card:info.id,door:info.door,nonce:crypto.randomUUID(),
     position:{quarter:walkingLocation.quarter,area:'street',x:walker.x,z:walker.z}});
    await root.VoidConsumableGame.refresh();
   }
   run.holds=true;run.cardName=info.name;run.cardDescription=info.description;preloadLace(run);
   if(run.private)run.expiresAt=performance.now()+86400000;
  }finally{document.removeEventListener('keydown',key,true);host.hidden=true;card.parent.dispose();run.owned.delete(card.parent);}
 }
 async function pickupReceipt(run){
  const a=address(run),host=panel(run);
  const wait=prompt(run,'You picked up '+run.cardName+'.',['Continue']);
  host.style.maxWidth='24rem';host.style.boxShadow='0 8px 30px #0009';host.setAttribute('role','dialog');host.setAttribute('aria-label','Keycard picked up');
  const description=document.createElement('p');description.textContent=run.cardDescription||'A residential access card belonging to Kade Mercer and Lace.';
  const addressLine=document.createElement('p');addressLine.textContent='Street Door '+a.door.number+' — Apartment '+a.number;
  host.insertBefore(description,host.lastChild);host.insertBefore(addressLine,host.lastChild);
  try{await wait;}finally{host.removeAttribute('role');host.removeAttribute('aria-label');}
 }
 // glTF joints are linked transform nodes; reading the animated node respects each imported rig's bind scale.
 function joint(figure,name){
  for(const mesh of figure.made.getChildMeshes()){
   const bone=mesh.skeleton?.bones.find(b=>b.name.toLowerCase().replace(/[^a-z]/g,'').endsWith(name));
   if(bone)return bone.getTransformNode();
  }
  return null;
 }
 function addWristRope(figure,room,style){
  const left=joint(figure,'lefthand'),right=joint(figure,'righthand');
  if(!left||!right)return;
  const scene=figure.parent.getScene(),b=B(),rope=new b.TransformNode('encounter-rope',scene);
  const material=new b.StandardMaterial('braided cord',scene);
  material.diffuseColor=new b.Color3(.59,.39,.20);material.emissiveColor=new b.Color3(.12,.08,.04);
  const cuffs=[left,right].map((hand,i)=>{
   const loop=b.MeshBuilder.CreateTorus('wrist cord '+i,{diameter:.067,thickness:.016,tessellation:16},scene);
   loop.parent=rope;loop.material=material;loop.isPickable=false;return loop;
  });
  const path=[b.Vector3.Zero(),new b.Vector3(.01,-.03,0),new b.Vector3(.03,0,0)];
  const span=b.MeshBuilder.CreateTube('visible wrist cord',{path,radius:.007,tessellation:6,updatable:true},scene);
  span.parent=rope;span.material=material;span.isPickable=false;
  left.computeWorldMatrix(true);right.computeWorldMatrix(true);
  const mount=b.Vector3.Center(left.getAbsolutePosition(),right.getAbsolutePosition());
  mount.y=root.VoidApartments.world([0,room.CEIL,0])[1];
  const metal=new b.StandardMaterial('screw eye steel',scene);
  metal.diffuseColor=new b.Color3(.52,.53,.5);metal.emissiveColor=new b.Color3(.13,.13,.12);
  // The fixed length and knot belong to the room. Only the free length follows Lace.
  const fixed=new b.TransformNode('encounter mounted cord',scene);
  function screwEye(name,position){
   const fitting=new b.TransformNode(name+' mounting',scene);fitting.parent=fixed;fitting.position.copyFrom(position);
   const eye=b.MeshBuilder.CreateTorus(name,{diameter:.14,thickness:.025,tessellation:28},scene);
   eye.rotation.x=Math.PI/2;eye.position.y=-.14;
   const stem=b.MeshBuilder.CreateCylinder(name+' stem',{height:.085,diameter:.032},scene);stem.position.y=-.041;
   const washer=b.MeshBuilder.CreateCylinder(name+' washer',{height:.016,diameter:.105},scene);washer.position.y=-.009;
   for(const mesh of [eye,stem,washer]){mesh.parent=fitting;mesh.material=metal;mesh.isPickable=false;}
   return fitting;
  }
  screwEye('screw eye',mount);
  const [x0,x1,z0,z1]=room.FURN.bed;
  const wallSide=room.container;
  const face=wallSide?[x1-.37,.92,z1-.05]:[x1-.06,.91,z0+.32];
  const boardPoint=b.Vector3.FromArray(root.VoidApartments.world(face));
  const boardEye=screwEye('headboard screw eye',boardPoint);
  if(wallSide)boardEye.rotation.x=Math.PI/2;
  else boardEye.rotation.z=-Math.PI/2;
  if(style.includes('rundown')){
   // Pallet beds lack a back panel. Seat the mounting plate on the bed frame.
   const plank=b.MeshBuilder.CreateBox('encounter bed back panel',{width:wallSide?x1-x0:.06,height:1,depth:wallSide?.05:z1-z0},scene);
   plank.position.copyFromFloats(...root.VoidApartments.world(wallSide?[(x0+x1)/2,.53,z1-.025]:[x1-.03,.53,(z0+z1)/2]));
   plank.parent=fixed;plank.material=metal;plank.isPickable=false;
  }
  const matrix=boardEye.computeWorldMatrix(true);
  const atRing=(x,y,z)=>b.Vector3.TransformCoordinates(new b.Vector3(x,y,z),matrix);
  const overhead=mount.add(new b.Vector3(0,-.20,0)),tie=atRing(0,-.21,0);
  const middle=b.Vector3.Center(overhead,tie);middle.y-=.09;
  const bend=overhead.add(new b.Vector3(.045,.005,.025));
  const laid=b.Curve3.CreateCatmullRomSpline([overhead,bend,middle,tie],8).getPoints();
  const fixedCord=(name,points,radius)=>{
   const tube=b.MeshBuilder.CreateTube(name,{path:points,radius,tessellation:10,cap:b.Mesh.CAP_ALL},scene);
   tube.parent=fixed;tube.material=material;tube.isPickable=false;
  };
  fixedCord('ceiling to headboard cord',laid,.014);
  const knot=[tie];
  for(let i=0;i<=44;i++){
   const t=i/44,angle=t*Math.PI*4.5;
   knot.push(atRing(t*.055-.025,-.205+Math.cos(angle)*.024,Math.sin(angle)*.028));
  }
  const end=knot.at(-1);
  knot.push(end.add(new b.Vector3(-.018,-.05,.025)),end.add(new b.Vector3(-.02,-.12,.03)));
  fixedCord('headboard cord knot and tail',knot,.012);
  figure.parent.onDisposeObservable.addOnce(()=>{fixed.dispose();metal.dispose();material.dispose();});
  const leadPath=[mount.clone(),mount.clone(),overhead.clone()];
  const lead=b.MeshBuilder.CreateTube('wrist to screw eye rope',{path:leadPath,radius:.014,tessellation:10,updatable:true},scene);
  lead.material=material;lead.isPickable=false;lead.parent=rope;
  const obs=scene.onBeforeRenderObservable.add(()=>{
   for(const [i,hand] of [left,right].entries()){hand.computeWorldMatrix(true);cuffs[i].position.copyFrom(hand.getAbsolutePosition());}
   path[0].copyFrom(cuffs[0].position);path[2].copyFrom(cuffs[1].position);
   b.Vector3.LerpToRef(path[0],path[2],.5,path[1]);path[1].y-=.035;
   b.MeshBuilder.CreateTube('visible wrist cord',{path,instance:span},scene);
   leadPath[0].copyFrom(path[1]);b.Vector3.LerpToRef(leadPath[0],leadPath[2],.5,leadPath[1]);
   leadPath[1].x+=.012;
   b.MeshBuilder.CreateTube('wrist to screw eye rope',{path:leadPath,instance:lead},scene);
  });
  rope.onDisposeObservable.addOnce(()=>scene.onBeforeRenderObservable.remove(obs));
  figure.parent.onDisposeObservable.addOnce(()=>{if(!rope.isDisposed())rope.dispose();});
  return rope;
 }
 function groundPose(figure,floor,bedEdge,bedHeight){
  let bottom=Infinity;
  for(const mesh of figure.made.getChildMeshes()){
   if(!mesh.skeleton||!mesh.getTotalVertices())continue;
   mesh.computeWorldMatrix(true);mesh.skeleton.prepare(true);mesh.refreshBoundingInfo(true);
   bottom=Math.min(bottom,mesh.getBoundingInfo().boundingBox.minimumWorld.y);
  }
  if(!Number.isFinite(bottom))return;
  if(Number.isFinite(bedEdge)){
   // Measure the posed shoes in world space. The rig origin can be well behind the feet.
   const point=new (B().Vector3)();
   let nearest=-Infinity;
   for(const mesh of figure.made.getChildMeshes()){
    if(!mesh.skeleton||!mesh.getTotalVertices())continue;
    const vertices=mesh.getPositionData(true,true),matrix=mesh.getWorldMatrix();
    for(let i=0;vertices&&i<vertices.length;i+=3){
     B().Vector3.TransformCoordinatesFromFloatsToRef(vertices[i],vertices[i+1],vertices[i+2],matrix,point);
     if(point.y<=bottom+bedHeight+.04){
      nearest=Math.max(nearest,point.x);
     }
    }
   }
   if(Number.isFinite(nearest))figure.parent.position.x+=bedEdge-.08-nearest;
  }
  figure.parent.position.y+=floor-bottom;
 }
 async function flat(run,jump){
  const a=address(run);preloadLace(run);
  if(jump&&run.private){
   await root.VoidApartments.enterHall(a.door,[]);
   await root.VoidApartments.enterFlat({id:'residence-'+a.slot,key:a.target,door:a.door.id,style:a.door.style,
    residenceSlot:a.slot,number:a.number,items:[],residents:[]});
  }
  await until(()=>typeof walkingLocation!=='undefined'&&walkingLocation?.part==='flat'&&walkingLocation.inst===a.target,run.signal);
  run.signal.throwIfAborted();run.entered=a.target;
  run.lace=await model(run,'crowd:'+laceLook,laceFile,1.68,await run.laceBytes);run.laceBytes=null;
  const placement=run.graph.placement,anchor=root.VoidApartments.world([placement.x,placement.y,placement.z]);
  // Older drafts used the original default position half a metre from the bed.
  const room=root.VoidApartments.geo(a.door.style);
  let bedEdge;
  if(placement.x===1.5&&placement.z===-.8){
   const bed=room.FURN.bed;
   bedEdge=anchor[0]+bed[0]-placement.x;
   anchor[0]=bedEdge-.04;anchor[2]+=(bed[2]+bed[3])/2-placement.z;
  }
  standing(run.lace,{x:anchor[0],y:anchor[1],z:anchor[2],yaw:placement.yaw});
  run.lace.parent.scaling.setAll(placement.scale);
  const transition=['sz-tiedbf-look-back','sz-tiedbf-look-back-return'].includes(placement.clip);
  const posed=await assignedClip(run.lace,laceLook,placement.clip,run.signal,!transition);
  posed.goToFrame(posed.from);
  groundPose(run.lace,anchor[1],bedEdge,room.FURN.bed[4]);
  if(['sz-tiedbf','sz-tiedbf-look-back','sz-tiedbf-look-back-return'].includes(placement.clip))run.rope=addWristRope(run.lace,room,a.door.style);
  await lines(run,'arrival','opening');
 }
 async function releaseLace(run){
  if(!run.lace)await flat(run,true);
  run.rope?.dispose();run.rope=null;
  await lines(run,'free');
  play(run.lace,'idle');
  const exit=walkingLocation.interactions.find(it=>/exit|hall/.test(it.action)&&it.position);
  if(!exit)return;
  const p=run.lace.parent.position,dx=exit.position[0]-p.x,dz=exit.position[2]-p.z;
  const length=Math.hypot(dx,dz),time=Math.max(.2,length/1.25),x=p.x,z=p.z;
  run.lace.parent.rotation.y=Math.atan2(dx,dz);play(run.lace,'walk');
  const start=performance.now();
  while(!run.lace.parent.isDisposed()){
   const t=Math.min(1,(performance.now()-start)/(time*1000));p.x=x+t*dx;p.z=z+t*dz;
   if(t===1)break;await delay(30,run.signal);
  }
 }
 async function roleplay(run){
  if(!run.lace)await flat(run,true);
  if(await prompt(run,'Temporarily play Kade’s animation? You can cancel at any time.',['Begin','Cancel'])!=='Begin')return;
  if(run.rope){
   const rope=run.rope,meshes=rope.getChildMeshes(),start=performance.now();
   await until(()=>{
    const opacity=Math.max(0,1-(performance.now()-start)/400);
    for(const mesh of meshes)mesh.visibility=opacity;
    return opacity===0;
   },run.signal);
   rope.dispose();run.rope=null;
  }
  const sceneController=new AbortController(),phase={...run,controller:sceneController,signal:sceneController.signal,owned:new Set()};
  const cancel=()=>sceneController.abort(new DOMException('Roleplay ended','AbortError'));
  run.signal.addEventListener('abort',cancel,{once:true});
  try{
   const animate=async()=>{
    const figure=await model(phase,'crowd:'+kadeLook,'assets/models/crowd/'+kadeLook+'.glb',1.78);
    // Keep the POV rig invisible even while its animation pack is loading.
    for(const mesh of figure.made.getChildMeshes())mesh.visibility=0;
    const p=run.lace.parent.position;standing(figure,{x:p.x-.77,y:0,z:p.z,yaw:Math.PI/2});
    await assignedClip(figure,kadeLook,run.graph.roleplayClip);
    phase.signal.throwIfAborted();
    const head=joint(figure,'head');
    if(!head)throw Error('The player animation rig is missing its head joint.');
    const w=walker;
    run.pov={w,head,inst:walkingLocation.inst,from:{x:w.x,y:w.y,z:w.z,yaw:w.yaw,pitch:w.pitch}};
    head.computeWorldMatrix(true);const eye=head.getAbsolutePosition();
    w.yaw=Math.atan2(p.x-eye.x,p.z-eye.z);w.pitch=0;
    await lines(phase,'be_kade');
    await until(()=>walkingLocation?.inst!==run.pov?.inst,phase.signal);
   };
   await Promise.race([prompt(phase,'Playing as Kade Mercer',['Cancel and leave apartment']),animate()]);
  }finally{
   cancel();run.signal.removeEventListener('abort',cancel);
   if(run.pov&&typeof walker!=='undefined'&&walker===run.pov.w&&walkingLocation?.inst===run.pov.inst)Object.assign(walker,run.pov.from);
   run.pov=null;
   for(const obj of phase.owned)obj.dispose();
   if(run.panel)run.panel.hidden=true;
   if(!run.signal.aborted&&walkingLocation?.inst===run.entered)await root.VoidApartments.backToHall();
  }
 }
 async function runGraph(run,start){
  const sequence=root.VoidChanceEncounter.createRun(run.graph,start);
  let first=true;
  while(sequence.node){
   run.signal.throwIfAborted();
   const node=run.node=sequence.node;root.dispatchEvent?.(new Event('void-encounter-journal'));let choice;
   if(node.kind==='move')await walk(run);
   if(node.kind==='item'){await drop(run);await pickupReceipt(run);}
   if(node.kind==='location'){if(first)run.holds=true;await flat(run,first);}
   if(node.kind==='choice'){
    if(!run.lace&&node.speaker==='lace'&&run.graph.residence){run.holds=true;await flat(run,true);}
    const exit=run.lace&&node.edges.find(e=>run.graph.nodes.some(n=>n.id===e.to&&n.kind==='end'&&n.id==='leave'));
    choice=await prompt(run,node.name,node.edges.map(e=>e.label),exit?.label,!!run.lace&&node.speaker==='lace');
    if(run.lace&&node.speaker==='lace'&&choice!==exit?.label)await lines(run,'arrival','remaining');
   }
   if(node.kind==='animation'){
    if(node.action==='release')await releaseLace(run);
    else if(node.action==='roleplay')await roleplay(run);
    else if(node.action==='stumble'){
     if(!run.actor)await walk(run);
     impactPose(run.actor);taxiImpact(run);
     play(run.actor,'floor-knees-down',false);
    }else throw Error('Choose a supported animation action for '+node.name+'.');
   }
   if(node.kind==='end'){
    if(run.graph.id==='dropped-cardkey'&&run.entered){
     run.ending=node.id;run.node={...node,name:'Leave the apartment'};
     root.dispatchEvent(new Event('void-encounter-journal'));
     await until(()=>false,run.signal);
    }
    if(!run.private)await root.VoidConsumableGame.request('chance-encounters/outcome',{id:run.graph.id,run:run.token,outcome:node.id});
    break;
   }
   sequence.step(choice);first=false;
  }
 }
 async function watchApartment(run){
  let nextPoll=0,left=false;
  while(!run.signal.aborted){
   await delay(200,run.signal);
   if(!run.holds)continue;
   if(run.private&&performance.now()>=run.expiresAt)return;
   left=left||run.entered&&(typeof walkingLocation==='undefined'||walkingLocation?.inst!==run.entered);
   if(run.private&&left)return;
   if(run.private||Date.now()<nextPoll)continue;
   if(!left&&Date.now()<(run.nextExpiryCheck||0))continue;
   try{
    if(left){
     const ending=run.ending||run.graph.nodes.find(n=>n.id==='leave'&&n.kind==='end')?.id||run.graph.nodes.find(n=>n.kind==='end')?.id;
     await root.VoidConsumableGame.request('chance-encounters/outcome',{id:run.graph.id,run:run.token,outcome:ending});
     return;
    }
    const state=await root.VoidConsumableGame.request('chance-encounters/resume',{id:run.graph.id});
    if(state.expired&&state.run===run.token)return;
    run.nextExpiryCheck=Date.now()+15000;
   }catch(e){nextPoll=Date.now()+3000;console.warn('[Chance encounters]',e.message);}
  }
 }
 async function begin(graph,start,privateTest,token){
  stop();const controller=new AbortController();
  const run={graph:root.VoidChanceEncounter.withWaitingDialogue(graph),private:privateTest,token,controller,signal:controller.signal,owned:new Set(),holds:false,expiresAt:Infinity};
  run.tracked=true;running=run;
  try{
   const playback=runGraph(run,start);
   if(graph.id==='dropped-cardkey')await Promise.race([playback,watchApartment(run)]);
   else await playback;
  }finally{if(running===run)stop();}
 }
 async function playtest(graph,start){
  const errors=root.VoidChanceEncounter.validate(graph);if(errors.length)throw Error(errors.join(' '));
  if(!graph.nodes.some(n=>n.id===start))throw Error('Choose a starting node.');
  const at=graph.playtest;
  sessionStorage.setItem('chance-editor-return',graph.id);
  const result=await root.VoidDevTest.session({kind:'encounter',banner:graph.name,leave:'Return to Editor',
   build(){const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;s.story.flags.districtBadge=true;s.location='earth';return s;},
   async enter(){
    await enterWalking(root.VoidDistrictArea.KEY.street,{silent:true,quarter:at.quarter,spawn:[at.x,1.7,at.z],yaw:at.yaw});
    if(typeof walker!=='undefined'&&walker)walker.pitch=at.pitch||0;
    begin(graph,start,true).catch(e=>{if(e.name!=='AbortError')announce(e.message);});
   }});
  if(result.error||result.problem)throw Error(result.error||result.problem);
  const bar=document.getElementById('dev-test-banner');
  for(const old of bar.querySelectorAll('[data-chance-control]'))old.remove();
  const controls=[['Restart Encounter',()=>playtest(graph,start)],['Stop Playtest',()=>{stop();root.VoidDevTest.exit();}]];
  if(graph.item)controls.push(['Expire test keycard',()=>{
   if(!running?.private||!running.holds){announce('Collect the test keycard first.');return;}
   running.expiresAt=0;announce('Test keycard expired.');
  }]);
  for(const [name,action] of controls){
   const b=document.createElement('button');b.type='button';b.dataset.chanceControl='';b.textContent=name;b.onclick=action;bar.append(b);
  }
 }
 let catalog=null,refreshAt=0,checking=false,lastUser;
 const nextCheck=new Map(),startEvents=new Map(),nearby=new Set(),nearEvents=new Map();
 let eventUser;
 function recordStartEvent(kind,target){
  const user=root.VoidAccount?.user;
  if(!user||user.isAnonymous||root.VoidDevTest?.active||running?.private)return;
  if(eventUser!==user.uid){startEvents.clear();eventUser=user.uid;}
  startEvents.set(kind+'/'+(target||''),{kind,target,token:crypto.randomUUID()});
 }
 root.addEventListener('void-place',({detail})=>{
  for(const id of detail.entered)recordStartEvent('place',id);
  for(const id of detail.left)recordStartEvent('leave',id);
 });
 async function opportunities(){
  const user=root.VoidAccount?.user;
  if(lastUser!==user?.uid){
   if(running&&!running.private)stop();
   catalog=null;nextCheck.clear();nearby.clear();nearEvents.clear();refreshAt=0;
   if(eventUser!==user?.uid){startEvents.clear();eventUser=user?.uid;}lastUser=user?.uid;
  }
  if(checking||running||root.VoidDevTest?.active||!user||user.isAnonymous||typeof mode==='undefined'||mode!=='walking')return;
  const inside=walkingLocation?.part==='flat';

  checking=true;
  try{
   const now=Date.now();
   if(now>=refreshAt){refreshAt=now+60000;catalog=(await root.VoidNetwork.request('chance-encounters')).encounters;}
   for(const graph of catalog||[]){
    const c=graph.conditions,p=graph.playtest;
    const trigger=c.startTrigger||{},visit=root.VoidChanceEncounter.isVisitTrigger(trigger.kind);
    // Poll the same moving TALK point as the Mission Editor, including visits outside the staging area.
    const nearKey=graph.id+'/near/'+trigger.target+'/'+trigger.distance;
    if(graph.enabled&&trigger.kind==='near'&&root.VoidLiveContent?.nearBlocked()===false){
     const distance=root.VoidLiveContent.giverDistance(trigger.target,walkingLocation,walker.x,walker.z);
     if(distance>trigger.distance)nearby.delete(nearKey);
     else if(!nearby.has(nearKey)){
      nearby.add(nearKey);nearEvents.set(nearKey,{kind:'near',target:trigger.target,token:crypto.randomUUID()});
     }
    }
    if(inside){
     const home=root.VoidLiveContent?.current?.content?.characters?.[graph.residence?.character]?.residence;
     const target=home&&root.VoidApartments.residenceKey(home.door,home.slot);
     const location=graph.nodes.find(n=>n.kind==='location'),key=graph.id+'/resume';
     if(!location||!target||target!==walkingLocation.inst||now<(nextCheck.get(key)||0))continue;
     nextCheck.set(key,now+30000);
     const saved=await root.VoidConsumableGame.request('chance-encounters/resume',{id:graph.id});
     if(saved.active&&saved.target===walkingLocation?.inst&&root.VoidAccount?.user?.uid===user.uid&&!root.VoidDevTest?.active)
      begin(graph,location.id,false,saved.run).catch(e=>{if(e.name!=='AbortError')console.warn('[Chance encounters]',e.message);});
     break;
    }
    if(walkingLocation?.area!=='street')continue;
    const pulse=trigger.kind==='near'?nearEvents.get(nearKey):visit&&startEvents.get(trigger.kind+'/'+(trigger.target||''));
    const usedKey=graph.id+'/event/'+trigger.kind+'/'+(trigger.target||''),pending=pulse&&pulse.token!==nextCheck.get(usedKey);
    if(!graph.enabled||walkingLocation?.quarter!==c.quarter||!walker||Math.hypot(walker.x-p.x,walker.z-p.z)>c.radius||(!pending&&now<(nextCheck.get(graph.id)||0))||now<(nextCheck.get(graph.id+'/retry')||0))continue;
    nextCheck.set(graph.id,now+c.intervalSeconds*1000);
    const event=await root.VoidConsumableGame.request('chance-encounters/opportunity',{id:graph.id,
     ...(pending?{startEvent:pulse}:{}),position:{area:'street',quarter:walkingLocation.quarter,x:walker.x,z:walker.z}});
    if(pending&&user.uid===root.VoidAccount?.user?.uid){
     if(event.rolled)nextCheck.set(usedKey,pulse.token);
     else nextCheck.set(graph.id+'/retry',event.next?event.next*1000:now+5000);
    }
    if(!event.active||root.VoidAccount?.user?.uid!==user.uid||root.VoidDevTest?.active)continue;
    const start=event.stage==='collected'?'flat':event.stage==='dropped'?'drop':graph.start;
    begin(graph,start,false,event.run).catch(e=>{if(e.name!=='AbortError')console.warn('[Chance encounters]',e.message);});break;
   }
  }catch(e){console.warn('[Chance encounters]',e.message);}finally{checking=false;}
 }
 setInterval(opportunities,2000);
 function journal(){
  if(!running?.node)return null;
  return {id:'encounter:'+running.graph.id,title:running.graph.name,type:'encounter',objective:running.node.name,objectives:[],completed:false,tracked:running.tracked};
 }
 function waypoint(){
  const run=running,loc=typeof walkingLocation!=='undefined'&&walkingLocation;
  if(!run?.tracked||!loc||loc.id!=='neochinatown')return null;
  let position,quarter=run.graph.playtest.quarter;
  if(run.holds&&run.graph.residence){
   const a=address(run);
   if(loc.part==='hall'||loc.part==='flat'){
    const exit=loc.interactions.find(i=>i.id===(loc.part==='hall'?(loc.street===a.door.id?'hall-door-'+a.slot:'hall-exit'):'apt-exit'))?.position;
    position=loc.inst===a.target&&run.lace&&!run.ending?run.lace.parent.position.asArray():exit;
   }else{position=[a.door.x,1,a.door.z];quarter=a.door.quarter;}
  }else if(run.node?.kind==='item'){
   const drop=run.dropPosition||run.graph.dropPosition;if(drop)position=[drop.x,.1,drop.z];
  }else if(run.actor)position=run.actor.parent.position.asArray();
  else position=[run.graph.playtest.x,1,run.graph.playtest.z];
  return position?{position,quarter,key:'encounter:'+run.graph.id+'|'+run.node.id,label:run.node.name,encounter:true}:null;
 }
 root.VoidEncounterGame={recordStartEvent,playtest,stop,journal,waypoint,setTracked(value){if(running)running.tracked=value;},playerStep(w){
   const pov=running?.pov;if(!pov||pov.w!==w||walkingLocation?.inst!==pov.inst||pov.head.isDisposed())return false;
   pov.head.computeWorldMatrix(true);const eye=pov.head.getAbsolutePosition();w.x=eye.x;w.y=eye.y+.06;w.z=eye.z;return true;
  },hidesResident:id=>running?.graph.residence?.character===id,get privateSession(){return document.getElementById('dev-test-banner')?.dataset.kind==='encounter';},
  testAccess(target){if(!running?.private||!root.VoidDevTest.active||!running.holds||performance.now()>=running.expiresAt)return false;const a=address(running);return target===a.target||target===a.door.id;}};
})(globalThis);
