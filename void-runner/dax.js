/* Dax's licensed District actor. Its only movement source is the published NPC
   editor plan, or an isolated developer draft. Other clients use the same UTC
   clock and content, with a stationary hallway default when the plan is clear. */
(function(root){
 'use strict';
 const MODEL='npc-dax',FILE='assets/models/crowd/npc-dax.vrpak';
 const EYE=[.0294,1.5846,.0844,.0129]; // The V3 // Shadow camera in her left eye.
 const pure={MODEL,FILE,EYE};
 if(typeof module==='object'&&module.exports){module.exports=pure;return;}
 if(typeof document==='undefined')return;
 let fig=null,loading=null,missing=false,told=false,shownClip=null,eyeOn=false,sceneRef=null,observer=null;
 let clockOffset=0,previousPlan,readRoutine=null;
 const now=()=>Date.now()/1000+(root.VoidLiveContent?.draft&&root.VoidDevTest?.active?clockOffset:0);
 function previewAt(minute){
  const time=Date.now()/1000;
  clockOffset=Number.isFinite(minute)?Math.floor(time/86400)*86400+minute*60-time:0;
 }

 const interior=()=>{try{return typeof walkingLocation!=='undefined'&&walkingLocation?.id==='neochinatown'&&walkingLocation.area==='interior'&&typeof mode!=='undefined'&&['walking','dialogue','mission-log','pod-waking'].includes(mode);}catch{return false;}};
 function drop(){if(observer&&sceneRef)try{sceneRef.onBeforeRenderObservable.remove(observer);}catch{}observer=null;if(fig){try{fig.ctrl?.dispose?.();fig.node.dispose();}catch{}}fig=null;shownClip=null;eyeOn=false;sceneRef=null;}
 async function ensure(scene){
  if(missing||loading||fig)return;const A=root.VoidAssets,C=root.VoidCrowd;if(!A||!C)return;
  loading=(async()=>{try{if(!A.container('crowd:'+MODEL))await A.load('crowd:'+MODEL,{src:FILE,background:true},scene);}catch(e){missing=true;if(!told){told=true;console.info('[VOID//RUNNER] Dax is not on this machine: her licensed model (void-runner/'+FILE+') is published with the live site only. Nobody stands in for her.');}return;}
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
 function step(){
  if(!fig||fig.node.isDisposed()){drop();return;}const N=root.VoidNeoChinatown,s=editorState();
  fig.node.setEnabled(!!s.inside);if(!s.inside)return;
  const w=N.toWorld(s.x,s.z),f=N.toWorld(s.x+Math.sin(s.yaw),s.z+Math.cos(s.yaw));fig.node.position.set(w[0],0,w[1]);
  // turn smoothly toward where the schedule faces her
  const want=Math.atan2(f[0]-w[0],f[1]-w[1]);let d=want-fig.node.rotation.y;d=Math.atan2(Math.sin(d),Math.cos(d));fig.node.rotation.y+=d*Math.min(1,.12);
  if(s.clip!==shownClip){shownClip=s.clip;try{fig.ctrl.play(s.clip);}catch{}}
  if(s.device!==eyeOn){eyeOn=s.device;root.VoidStreetGear?.eye?.(fig.node,eyeOn,EYE);}}
 setInterval(()=>{const scene=root.VoidBabylon?.scene;if(fig&&(fig.node.isDisposed()||scene!==sceneRef||!interior()&&typeof mode!=='undefined'&&mode==='menu')){drop();}
  if(!fig&&scene&&interior())ensure(scene);},1000);
 root.VoidDax={...pure,previewAt,get shown(){return !!fig&&fig.node.isEnabled();},get available(){return !missing;},get where(){return editorState();}};
})(typeof globalThis!=='undefined'?globalThis:this);
