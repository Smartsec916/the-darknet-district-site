/* Dax's licensed District actor. Its only movement source is the published NPC
   editor plan, or an isolated developer draft. Other clients use the same UTC
   clock and content, with a stationary hallway default when the plan is clear. */
(function(root){
 'use strict';
 const MODEL='npc-dax',FILE='assets/models/crowd/npc-dax.vrpak';
 const EYE=[.0294,1.5846,.0844,.0129]; // The V3 // Shadow camera in her left eye.
 function interest(save,settings,minutes){
  const flags=save?.story?.flags;
  if(!flags||!settings||!Number.isFinite(minutes))return null;
  const reputation=save.progression?.reputation?.civilian||0,missions=save.universe?.missions||{};
  const eligible=limit=>Number.isFinite(limit)&&limit>=0&&minutes>=limit;
  if(!flags.daxBountyContact&&eligible(settings.daxBountyPlayMinutes)&&reputation<=settings.daxBountyCivilianReputation&&
    (missions['illegal-run']?.completed||save.contract?.legal===false))return 'bounty';
  if(!flags.daxRecruitContact&&eligible(settings.daxRecruitPlayMinutes)&&reputation>=settings.daxRecruitCivilianReputation&&
    (missions['legal-run']?.completed||save.contract?.legal===true))return 'recruit';
  return null;
 }
 const pure={MODEL,FILE,EYE,interest};
 if(typeof module==='object'&&module.exports){module.exports=pure;return;}
 if(typeof document==='undefined')return;
 let fig=null,loading=null,missing=false,told=false,shownClip=null,eyeOn=false,sceneRef=null,observer=null;
 let encounter=null,seenVisit=false,nextLook=0,geometry=null,nextLoad=0;
 let clockOffset=0,previousPlan,readRoutine=null;
 const now=()=>Date.now()/1000+(root.VoidLiveContent?.draft&&root.VoidDevTest?.active?clockOffset:0);
 function previewAt(minute){
  const time=Date.now()/1000;
  clockOffset=Number.isFinite(minute)?Math.floor(time/86400)*86400+minute*60-time:0;
 }

 const interior=()=>{try{return typeof walkingLocation!=='undefined'&&walkingLocation?.id==='neochinatown'&&walkingLocation.area==='interior'&&typeof mode!=='undefined'&&['walking','dialogue','mission-log','pod-waking'].includes(mode);}catch{return false;}};
 function drop(){updateTalk(null);encounter=null;seenVisit=false;geometry=null;nextLook=0;if(observer&&sceneRef)try{sceneRef.onBeforeRenderObservable.remove(observer);}catch{}observer=null;if(fig){try{fig.ctrl?.dispose?.();fig.node.dispose();}catch{}}fig=null;shownClip=null;eyeOn=false;sceneRef=null;}
 async function ensure(scene){
  if(missing||loading||fig||Date.now()<nextLoad)return;const A=root.VoidAssets,C=root.VoidCrowd;if(!A||!C)return;
  loading=(async()=>{try{if(!A.container('crowd:'+MODEL))await A.load('crowd:'+MODEL,{src:FILE,background:true},scene);}catch(e){if(scene.isDisposed||root.VoidBabylon?.scene!==scene)return;
    if(!/HTTP (404|410)\b/.test(String(e))){nextLoad=Date.now()+15000;return;}missing=true;if(!told){told=true;console.info('[VOID//RUNNER] Dax is not on this machine: her licensed model (void-runner/'+FILE+') is published with the live site only. Nobody stands in for her.');}return;}
   if(scene.isDisposed||!interior()||root.VoidBabylon?.scene!==scene)return;
   const parent=new root.BABYLON.TransformNode('npc-dax',scene),made=A.instance('crowd:'+MODEL,parent);if(!made){parent.dispose();return;}
   parent.metadata={character:'dax',npc:true};made.metadata={...made.metadata,character:'dax',crowd:MODEL};
   fig={node:parent,made,ctrl:C.animate(made,MODEL,'idle')};sceneRef=scene;observer=scene.onBeforeRenderObservable.add(step);})().finally(()=>{loading=null;});}
 function transition(a,b){
  const N=root.VoidNeoChinatown,E=root.VoidNPCEscort;
  const world=p=>{const [x,z]=N.toWorld(p.x,p.z);return {x,z};};
  const start=world(a),end=world(b),solids=N.layout('interior').solids.filter(s=>s.position[1]-s.size[1]/2<1.6&&s.position[1]+s.size[1]/2>.1);
  const path=E.gridRoute(start,end,solids,{grid:.25,radius:.25});
  if(!path?.length||Math.hypot(path.at(-1).x-end.x,path.at(-1).z-end.z)>.02)return null;
  const {x,z}=N.door;
  return path.map(p=>({x:x-p.x,z:z+20-p.z}));
 }
 function editorState(){
  const R=root.VoidDaxEditorRoutine,X=root.VoidNPCPaths,N=root.VoidNeoChinatown;
  const raw=root.VoidLiveContent?.env?.npcPlans?.dax||null;
  if(!X||!N)return R.DEFAULT;
  if(!readRoutine||previousPlan!==raw){previousPlan=raw;readRoutine=R.timeline(raw,X,N.door,transition);}
  return readRoutine(now());
 }
 function surroundings(){
  if(!geometry){
   const solids=(walkingLocation.solids||[]).filter(s=>s.position&&s.size&&!s.open&&s.position[1]-s.size[1]/2<1.6&&s.position[1]+s.size[1]/2>.1);
   geometry={solids,rects:solids.map(s=>[s.position[0]-s.size[0]/2,s.position[0]+s.size[0]/2,s.position[2]-s.size[2]/2,s.position[2]+s.size[2]/2])};
  }
  return geometry;
 }
 const talkItem={id:'district-dax',character:'dax',action:'district-dax',label:'TALK TO DAX',position:[0,1.6,0],range:2.2,talk:true};
 let items=null;
 function updateTalk(list,p){
  if(items!==list){
   const i=items?.indexOf(talkItem)??-1;if(i>=0)items.splice(i,1);
   items=list;if(list&&!list.includes(talkItem))list.push(talkItem);
  }
  if(p){talkItem.position[0]=p.x;talkItem.position[2]=p.z;}
 }
 root.VoidInteractions?.register('district-dax',()=>{announce('Dax acknowledges you with a nod.');});
 function contact(kind){
  const flags=state.story.flags;
  const key=kind==='bounty'?'daxBountyContact':'daxRecruitContact';
  flags[key]=true;
  // An authored meeting uses the Mission Editor's ordinary offer, costs, and accept/deny rules.
  const live=root.VoidLiveContent,mc=root.VoidMissionContent;
  if(live?.treesOn()&&mc?.treeWants(state,live.env,['dax'])){
   root.VoidInteractions?.handlers.get(talkItem.action)?.({item:talkItem});
  }
  try{announce(kind==='bounty'?'Dax checks your record on her V3.':'Dax signals you about a job.');if(!root.VoidDevTest?.active)save();}catch{}
 }
 function encounterPose(home){
  if(typeof walker==='undefined'||!walker||typeof state==='undefined'||!interior())return null;
  const time=performance.now(),p=fig.node.position,dist=Math.hypot(walker.x-p.x,walker.z-p.z);
  if(time>=nextLook&&mode==='walking'&&!document.hidden){
   nextLook=time+500;
   const awareness=root.VoidLiveContent?.env?.npcPlans?.dax?.awareness;
   const seen=root.VoidNPCAwareness?.notice({x:p.x,z:p.z,yaw:fig.node.rotation.y,tier:3,awareness},walker,surroundings().rects).seen;
   if(seen&&!seenVisit&&state.story?.flags){
    seenVisit=true;const flags=state.story.flags;
    flags.daxEncounters=Math.min(1000000,(Number(flags.daxEncounters)||0)+1);
    if(flags.daxEncounters>1){flags.daxRecognized=true;announce('Dax gives you a nod of recognition.');}
   }
   if(seen&&!encounter){
    const C=root.VoidClock;
    const settings=(typeof VoidDevTools!=='undefined'&&VoidDevTools.pending)||root.VoidBalance?.values;
    const kind=interest(state,settings,C.realMinutes(C.minutes(state)));
    if(kind)encounter={kind,returning:false,route:[],last:time,planAt:0};
   }
   if(encounter&&!encounter.returning&&(!seen&&dist>4||state.story?.flags?.podWakePending))encounter.returning=true;
  }
  const e=encounter;if(!e)return null;
  const dt=Math.min(.25,(time-e.last)/1000);e.last=time;
  if(mode!=='walking'||document.hidden)return {clip:'watch',yaw:fig.node.rotation.y,device:e.kind==='bounty'};
  if(!e.returning&&dist<=1.8&&!root.VoidNPCAwareness.blocked(p,walker,surroundings().rects)){
   contact(e.kind);e.returning=true;e.planAt=time+1800;e.route=[];
  }
  const target=e.returning?home:walker;
  if(e.returning&&Math.hypot(home.x-p.x,home.z-p.z)<.12){encounter=null;return null;}
  if(time>=e.planAt){
   e.planAt=time+900;
   e.route=root.VoidNPCEscort.gridRoute(p,target,surroundings().solids,{grid:.25,radius:.25})||[];
  }
  const leg=e.route[0];
  if(!leg)return {clip:'watch',yaw:Math.atan2(walker.x-p.x,walker.z-p.z),device:e.kind==='bounty'};
  const dx=leg.x-p.x,dz=leg.z-p.z,length=Math.hypot(dx,dz),k=length?Math.min(1,dt*1.3/length):1;
  p.x+=k*dx;p.z+=k*dz;if(k===1)e.route.shift();
  return {clip:'walk',yaw:Math.atan2(dx,dz),device:false};
 }
 function step(){
  if(!fig||fig.node.isDisposed()){drop();return;}const N=root.VoidNeoChinatown,s=editorState();
  fig.node.setEnabled(!!s.inside);if(!s.inside)return;
  const w=N.toWorld(s.x,s.z),f=N.toWorld(s.x+Math.sin(s.yaw),s.z+Math.cos(s.yaw));if(!fig.placed){fig.node.position.set(w[0],0,w[1]);fig.placed=true;}
  const pose=encounterPose({x:w[0],z:w[1]});
  if(!pose)fig.node.position.set(w[0],0,w[1]);
  updateTalk(interior()?walkingLocation.interactions:null,fig.node.position);
  // turn smoothly toward where the schedule faces her
  const want=pose?.yaw??Math.atan2(f[0]-w[0],f[1]-w[1]);let d=want-fig.node.rotation.y;d=Math.atan2(Math.sin(d),Math.cos(d));fig.node.rotation.y+=d*Math.min(1,.12);
  const clip=pose?.clip||s.clip,device=pose?.device??s.device;
  if(clip!==shownClip){shownClip=clip;try{fig.ctrl.play(clip);}catch{}}
  if(device!==eyeOn){eyeOn=device;root.VoidStreetGear?.eye?.(fig.node,eyeOn,EYE);}}
 setInterval(()=>{const scene=root.VoidBabylon?.scene;if(fig&&(fig.node.isDisposed()||scene!==sceneRef||typeof walkingLocation!=='undefined'&&(walkingLocation?.id!=='neochinatown'||walkingLocation?.area!=='interior'))){drop();}
  if(!fig&&scene&&interior())ensure(scene);},1000);
 root.VoidDax={...pure,previewAt,get encounter(){return encounter?.kind||null;},get shown(){return !!fig&&fig.node.isEnabled();},get available(){return !missing;},get where(){return editorState();}};
})(typeof globalThis!=='undefined'?globalThis:this);
