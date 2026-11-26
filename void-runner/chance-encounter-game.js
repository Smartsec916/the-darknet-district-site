(function(root){
 'use strict';
 const B=()=>root.BABYLON;
 const keyModel='assets/models/keycards/kade-lace-key.glb';
 const kadeLook='district-resident',laceLook='npc-lib-eb1d6cc8';
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
 async function model(run,id,src,height){
  const scene=root.VoidBabylon.scene,assets=root.VoidAssets;
  if(!assets.container(id))await assets.load(id,{src,background:true},scene);
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
  for(const group of all)if(group!==clip&&group.isPlaying)group.stop();
  clip.start(loop);return clip;
 }
 async function assignedClip(figure,look,name){
  if(!figure.made.metadata.animationGroups.some(g=>g.name.toLowerCase().endsWith('-'+name))){
   await root.VoidAnimLibrary.apply(figure.made,look,{only:[name],catalog:false});
  }
  return play(figure,name);
 }
 async function lines(run,prefix){
  for(const line of (run.graph.dialogue||[]).filter(l=>l.id.startsWith('lace_'+prefix+'_')&&l.text.trim())){
   if(line.delay)await delay(line.delay*1000,run.signal);
   run.signal.throwIfAborted();announce(line.speaker+' · '+line.text);
   if(line.animation&&run.lace)await assignedClip(run.lace,laceLook,line.animation);
   const recording=line.recording&&{...line.recording,src:run.private?'draft':'live'};
   const bus=root.VoidAudio?.bus('voice');
   if(bus&&(recording||root.VoidVoiceClips?.has(line.speaker,line.text))){
    const cancel=()=>root.VoidVoiceClips.cancel();
    run.signal.addEventListener('abort',cancel,{once:true});
    try{await root.VoidVoiceClips.speak({characterId:line.speaker,text:line.text,bus,recording});}
    finally{run.signal.removeEventListener('abort',cancel);}
   }
  }
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
  running.panel?.remove();running=null;
 }
 function panel(run){
  if(!run.panel){
   run.panel=document.createElement('aside');run.panel.id='chance-interaction';
   Object.assign(run.panel.style,{position:'fixed',right:'2vw',bottom:'10vh',zIndex:'75',padding:'14px',background:'#0a1921',color:'#e1eeec'});
   document.body.append(run.panel);
  }
  return run.panel;
 }
 function prompt(run,text,choices,onLeave){
  const host=panel(run);host.hidden=false;host.replaceChildren();
  const line=document.createElement('p');line.textContent=text;host.append(line);
  return new Promise((resolve,reject)=>{
   let locationTimer;
   const cleanup=()=>{clearInterval(locationTimer);document.removeEventListener('keydown',keys,true);run.signal.removeEventListener('abort',cancel);};
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
   for(const label of choices){
    const b=document.createElement('button');b.type='button';b.textContent=(choices.indexOf(label)+1)+' · '+label;host.append(b);
    b.onclick=()=>select(label);
   }
  });
 }
 async function walk(run){
  await until(()=>root.VoidRoadTaxi?.world?.quarter==='oldtown',run.signal,30000);
  run.actor=await model(run,'crowd:'+kadeLook,'assets/models/crowd/'+kadeLook+'.glb',1.78);
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
 async function drop(run){
  const home=address(run);
  const info=run.private?{name:"Kade and Lace's Apartment Key",position:run.graph.dropPosition,range:run.graph.pickupDistance,model:keyModel}:
   await root.VoidConsumableGame.request('chance-encounters/drop',{id:run.graph.id,run:run.token});
  const card=await model(run,'encounter-key',info.model||keyModel);
  const at=info.position,plan={drop:at,hit:run.plan?.hit||{x:at.x+1.65,z:at.z-.45}};
  const start=performance.now();
  do{
   const t=(performance.now()-start)/1000,p=root.VoidChanceCrossing.cardPose(plan,t);
   card.parent.position.set(p.x,p.y,p.z);card.parent.rotation.z=p.spin;
   if(t>=.85)break;
   await delay(16,run.signal);
  }while(true);
  if(run.actor){
   const actor=run.actor;
   const recover=async()=>{
    await delay((run.graph.recoverySeconds??8)*1000,run.signal);
    if(actor.parent.isDisposed())return;
    const exit=play(actor,'floor-knees-up',false);
    await until(()=>!exit.isPlaying||actor.parent.isDisposed(),run.signal);
    if(!actor.parent.isDisposed()){actor.parent.dispose();run.owned.delete(actor.parent);}
   };
   recover().catch(e=>{if(e.name!=='AbortError')console.warn('[Chance encounters]',e.message);});
  }
  const meshes=card.made.getChildMeshes();
  const focus=()=>{
   const cam=root.VoidBabylon.scene?.activeCamera;
   if(!cam||typeof walker==='undefined'||!walker||walkingLocation?.area!=='street')return false;
   const delta=card.parent.position.subtract(cam.globalPosition);
   return delta.length()<=info.range&&B().Vector3.Dot(cam.getForwardRay().direction,delta.normalize())>.986;
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
    for(const mesh of meshes){mesh.renderOutline=visible;if(visible){mesh.outlineWidth=.0007;mesh.outlineColor=new (B().Color3)(1,.8,.15);}}
    return taken;
   },run.signal);
   if(!run.private){
    await root.VoidConsumableGame.request('keycards/move',{action:'pickup',card:info.id,door:info.door,nonce:crypto.randomUUID(),
     position:{quarter:walkingLocation.quarter,area:'street',x:walker.x,z:walker.z}});
    await root.VoidConsumableGame.refresh();
   }
   run.holds=true;
   if(run.private)run.expiresAt=performance.now()+86400000;
  }finally{document.removeEventListener('keydown',key,true);host.hidden=true;card.parent.dispose();run.owned.delete(card.parent);}
 }
 async function flat(run,jump){
  const a=address(run);
  if(jump&&run.private){
   await root.VoidApartments.enterHall(a.door,[]);
   await root.VoidApartments.enterFlat({id:'residence-'+a.slot,key:a.target,door:a.door.id,style:a.door.style,
    residenceSlot:a.slot,number:a.number,items:[],residents:[]});
  }
  await until(()=>typeof walkingLocation!=='undefined'&&walkingLocation?.part==='flat'&&walkingLocation.inst===a.target,run.signal);
  run.lace=await model(run,'crowd:'+laceLook,'assets/models/crowd/'+laceLook+'.vrpak',1.68);
  const placement=run.graph.placement,anchor=root.VoidApartments.world([placement.x,placement.y,placement.z]);
  standing(run.lace,{x:anchor[0],y:anchor[1],z:anchor[2],yaw:placement.yaw});
  run.lace.parent.scaling.setAll(placement.scale);
  await assignedClip(run.lace,laceLook,placement.clip);
  await lines(run,'arrival');
 }
 async function releaseLace(run){
  if(!run.lace)await flat(run,true);
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
  const sceneController=new AbortController(),phase={...run,controller:sceneController,signal:sceneController.signal,owned:new Set()};
  const cancel=()=>sceneController.abort(new DOMException('Roleplay ended','AbortError'));
  run.signal.addEventListener('abort',cancel,{once:true});
  try{
   const animate=async()=>{
    await lines(phase,'be_kade');
    const figure=await model(phase,'crowd:'+kadeLook,'assets/models/crowd/'+kadeLook+'.glb',1.78);
    const p=run.lace.parent.position;standing(figure,{x:p.x-1.25,y:p.y,z:p.z,yaw:Math.PI/2});
    await assignedClip(figure,kadeLook,run.graph.roleplayClip);
    await until(()=>walkingLocation?.part!=='flat',phase.signal);
   };
   await Promise.race([prompt(phase,'Playing as Kade Mercer',['Cancel and leave apartment']),animate()]);
  }finally{
   cancel();run.signal.removeEventListener('abort',cancel);
   for(const obj of phase.owned)obj.dispose();
   if(run.panel)run.panel.hidden=true;
   if(walkingLocation?.part==='flat')await root.VoidApartments.backToHall();
  }
 }
 async function runGraph(run,start){
  const sequence=root.VoidChanceEncounter.createRun(run.graph,start);
  let first=true;
  while(sequence.node){
   run.signal.throwIfAborted();
   const node=sequence.node;let choice;
   if(node.kind==='move')await walk(run);
   if(node.kind==='item')await drop(run);
   if(node.kind==='location'){if(first)run.holds=true;await flat(run,first);}
   if(node.kind==='choice'){
    if(!run.lace&&node.speaker==='lace'&&run.graph.residence){run.holds=true;await flat(run,true);}
    const exit=run.lace&&node.edges.find(e=>run.graph.nodes.some(n=>n.id===e.to&&n.kind==='end'&&n.id==='leave'));
    choice=await prompt(run,node.name,node.edges.map(e=>e.label),exit?.label);
   }
   if(node.kind==='animation'){
    if(node.action==='release')await releaseLace(run);
    else if(node.action==='roleplay')await roleplay(run);
    else if(node.action==='stumble'){
     if(!run.actor)await walk(run);
     play(run.actor,'floor-knees-down',false);
    }else throw Error('Choose a supported animation action for '+node.name+'.');
   }
   if(node.kind==='end'){
    if(!run.private)await root.VoidConsumableGame.request('chance-encounters/outcome',{id:run.graph.id,run:run.token,outcome:node.id});
    break;
   }
   sequence.step(choice);first=false;
  }
 }
 async function begin(graph,start,privateTest,token){
  stop();const controller=new AbortController();
  const run={graph,private:privateTest,token,controller,signal:controller.signal,owned:new Set(),holds:false,expiresAt:Infinity};
  running=run;
  try{await runGraph(run,start);}finally{if(running===run)stop();}
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
 const nextCheck=new Map();
 async function opportunities(){
  const user=root.VoidAccount?.user;
  if(lastUser!==user?.uid){
   if(running&&!running.private)stop();
   catalog=null;nextCheck.clear();refreshAt=0;lastUser=user?.uid;
  }
  if(checking||running||root.VoidDevTest?.active||!user||user.isAnonymous||typeof mode==='undefined'||mode!=='walking')return;
  const inside=walkingLocation?.part==='flat';
  if(!inside&&walkingLocation?.area!=='street')return;
  checking=true;
  try{
   const now=Date.now();
   if(now>=refreshAt){refreshAt=now+60000;catalog=(await root.VoidNetwork.request('chance-encounters')).encounters;}
   for(const graph of catalog||[]){
    const c=graph.conditions,p=graph.playtest;
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
    if(!graph.enabled||walkingLocation?.quarter!==c.quarter||!walker||Math.hypot(walker.x-p.x,walker.z-p.z)>c.radius||now<(nextCheck.get(graph.id)||0))continue;
    nextCheck.set(graph.id,now+c.intervalSeconds*1000);
    const event=await root.VoidConsumableGame.request('chance-encounters/opportunity',{id:graph.id,
     position:{area:'street',quarter:walkingLocation.quarter,x:walker.x,z:walker.z}});
    if(!event.active||root.VoidAccount?.user?.uid!==user.uid||root.VoidDevTest?.active)continue;
    const start=event.stage==='collected'?'flat':event.stage==='dropped'?'drop':graph.start;
    begin(graph,start,false,event.run).catch(e=>{if(e.name!=='AbortError')console.warn('[Chance encounters]',e.message);});break;
   }
  }catch(e){console.warn('[Chance encounters]',e.message);}finally{checking=false;}
 }
 setInterval(opportunities,2000);
 root.VoidEncounterGame={playtest,stop,get privateSession(){return document.getElementById('dev-test-banner')?.dataset.kind==='encounter';},
  testAccess(target){if(!running?.private||!root.VoidDevTest.active||!running.holds||performance.now()>=running.expiresAt)return false;const a=address(running);return target===a.target||target===a.door.id;}};
})(globalThis);
