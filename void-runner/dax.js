/* Dax (David, 15 Nov 2026): a bounty hunter and mercenary who lives in The Darknet District on her own terms. There is only one of her.
   STAGE 1 (this file): she is IN the District with a life of her own. She moves between the bar, the store, the VR area, the arcade, the vending machines and the
   pods end of the hall, stays a while at each, watches, looks about, uses her V3 // Shadow (its camera is in her left eye, which glows green while she does), and at
   times leaves the District altogether and comes back later. She has a profile in the Players list and the Social app like anyone else.
   NOT in stage 1 (each needs David's decisions; see docs/development/DAX.md): talking to her (her voice and words), her memory of players and how she comes to
   trust or hunt them, her life outside the District's interior, her social posts, other outfits, the NPC editor.
   How her day works: there is no server for her and none is needed. Where she is at any moment is worked out from the clock alone (schedule(), below), the same on
   every player's machine, so two players standing together see her in the same place, and nothing is computed or drawn while nobody is near: when a player
   walks in, she is simply where the clock says she is.
   Her model is a purchased, licensed one (docs/VOID_RUNNER_ASSET_LICENSES.md). It is NOT in this repository: the live site gets it from the private asset
   repository at publishing time. On a machine without the file she does not appear, and the console says so once; no other figure stands in for her.
   Pure rules (places, routes, the schedule) run in Node (tests/dax.test.cjs). */
(function(root){
 'use strict';
 const MODEL='npc-dax',FILE='assets/models/crowd/npc-dax.vrpak',SPEED=1.3,HOUR=3600;   /* FILE is relative to void-runner/, like every model path */
 // Her left eye in her own model file (x, y, how far forward, radius), for the V3 light (street-gear.js eye()).
 const EYE=[.0294,1.5846,.0844,.0129];
 /* Places she goes, in District plan metres (the numbers the District's rooms use). `at` is where she stands, `face` what she looks toward, `door` the point on the
    hallway's centre line (x = 0) level with the way in. clips: what she does there, most likely first. device: how likely she is to be on her V3 there. */
 const SPOTS={
  bar:{label:'The bar and oxygen lounge',at:[7,36.4],face:[7,38.5],door:33.5,via:[[3.4,33.5],[7,34.6]],clips:['idle','look','watch'],device:.35,stay:[70,150]},
  store:{label:'The Darknet District store',at:[11,45.7],face:[11,48],door:45.6,via:[[3.4,45.6]],clips:['look','idle','watch'],device:.2,stay:[45,100]},
  vr:{label:'VR play area',at:[-6.4,33.6],face:[-9.5,36],door:34,via:[[-3.4,34]],clips:['watch','idle'],device:.3,stay:[50,120]},
  arcade:{label:'The arcade',at:[-5.6,62],face:[-9,62],door:62,via:[[-3.4,62]],clips:['watch','look','idle'],device:.25,stay:[50,110]},
  vending:{label:'The vending machines',at:[-3.7,49.6],face:[-6,49.6],door:49.6,via:[],clips:['look','idle'],device:.45,stay:[30,60]},
  pods:{label:'The sleeping pods',at:[2.2,72.6],face:[0,70],door:71.5,via:[],clips:['idle','look'],device:.7,stay:[60,130]},
  hall:{label:'The hallway',at:[1.6,54.5],face:[-2,54.5],door:54.5,via:[],clips:['look','idle','glance-back'],device:.55,stay:[35,80]}
 };
 const ORDER=Object.keys(SPOTS),EXIT=[0,28.8],AWAY={label:'NeoChinatown',stay:[240,520]};
 // A repeatable 0..1 from numbers (the hour and a counter): her day is the same for everyone.
 function rnd(a,b){let h=(Math.imul(a|0,374761393)+Math.imul(b|0,668265263))|0;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;}
 const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 /* The way on foot from one place to another: out to the hallway's centre line, along it, and in. Places are spot names or 'away' (the way out to the street).
    Returns the points to walk through, starting where she stands and ending where she will stand. */
 function route(from,to){
  const leg=name=>name==='away'?{at:EXIT,door:EXIT[1],via:[]}:SPOTS[name],a=leg(from),b=leg(to),p=[a.at.slice()];
  for(const v of a.via.slice().reverse())p.push(v.slice());
  p.push([0,a.door]);if(Math.abs(a.door-b.door)>.05)p.push([0,b.door]);
  for(const v of b.via)p.push(v.slice());
  p.push(b.at.slice());
  return p.filter((q,i)=>i===0||dist(q,p[i-1])>.05);}
 const length=p=>p.reduce((s,q,i)=>i?s+dist(q,p[i-1]):0,0);
 // The point `d` metres along a path, and the direction of travel there.
 function along(p,d){for(let i=1;i<p.length;i++){const L=dist(p[i],p[i-1]);if(d<=L||i===p.length-1){const k=L?Math.min(1,d/L):1;return {x:p[i-1][0]+(p[i][0]-p[i-1][0])*k,z:p[i-1][1]+(p[i][1]-p[i-1][1])*k,dx:p[i][0]-p[i-1][0],dz:p[i][1]-p[i-1][1]};}d-=L;}return {x:p[0][0],z:p[0][1],dx:0,dz:1};}
 /* One hour of her life (hour = a whole number: the hour since 1970): a list of steps {kind:'walk'|'stay'|'away', from, to|spot, start, end (seconds into the hour), clip, device}.
    Each hour begins where the hour before ended, so her day joins up. About one stretch in five is spent away from the District. */
 function endOf(hour){const n=ORDER.length;return rnd(hour,9001)<.22?'away':ORDER[Math.floor(rnd(hour,9002)*n)];}
 function day(hour){
  const steps=[],last=endOf(hour);let here=endOf(hour-1),t=0,i=0;
  const pick=()=>{for(let k=0;k<8;k++){const r=rnd(hour,100+i*7+k),s=r<.2?'away':ORDER[Math.floor(rnd(hour,200+i*7+k)*ORDER.length)];if(s!==here)return s;}return here==='hall'?'bar':'hall';};
  const stayAt=(end)=>{const sp=SPOTS[here];steps.push(here==='away'?{kind:'away',spot:'away',start:t,end}:{kind:'stay',spot:here,start:t,end,clip:sp.clips[rnd(hour,400+i)<.55?0:1+Math.floor(rnd(hour,500+i)*(sp.clips.length-1))]||'idle',device:rnd(hour,600+i)<sp.device});};
  while(i<200){
   // the last five minutes of the hour take her to where the next hour begins, and she stays there until it does
   if(t>=HOUR-300&&here===last){stayAt(HOUR+1);break;}
   if(t<HOUR-300){const span=(here==='away'?AWAY:SPOTS[here]).stay,stay=span[0]+rnd(hour,300+i)*(span[1]-span[0]);stayAt(t+stay);t+=stay;}
   i++;const next=t>=HOUR-300?last:pick();if(next===here)continue;
   const path=route(here,next),time=length(path)/SPEED;steps.push({kind:'walk',from:here,to:next,start:t,end:t+time,path});t+=time;here=next;
  }
  return steps;}
 const cache=new Map();
 const dayOf=hour=>{let d=cache.get(hour);if(!d){d=day(hour);cache.set(hour,d);if(cache.size>4)cache.delete(cache.keys().next().value);}return d;};
 /* Where she is and what she is doing at a moment (seconds since 1970): {inside, x, z (plan metres), yaw (plan: 0 = toward +z, a quarter turn = +x), clip, device,
    spot (where she is, or is going), place (words for her profile)}. Away from the District: inside false and no position. */
 function schedule(seconds){
  const hour=Math.floor(seconds/HOUR),t=seconds-hour*HOUR,steps=dayOf(hour),s=steps.find(q=>t>=q.start&&t<q.end)||steps[steps.length-1];
  if(s.kind==='away')return {inside:false,spot:'away',place:AWAY.label,clip:null,device:false};
  if(s.kind==='stay'){const p=SPOTS[s.spot];return {inside:true,x:p.at[0],z:p.at[1],yaw:Math.atan2(p.face[0]-p.at[0],p.face[1]-p.at[1]),clip:s.clip,device:s.device,spot:s.spot,place:p.label};}
  const a=along(s.path,(t-s.start)*SPEED),gone=s.to==='away'&&dist([a.x,a.z],EXIT)<.3||s.from==='away'&&dist([a.x,a.z],EXIT)<.05;
  return {inside:!gone,x:a.x,z:a.z,yaw:Math.atan2(a.dx,a.dz),clip:'walk',device:false,spot:s.to,place:s.to==='away'?'Leaving the District':SPOTS[s.to].label+' (on her way)'};}
 const pure={MODEL,FILE,SPOTS,EXIT,EYE,SPEED,route,length,along,day,schedule};
 if(typeof module!=='undefined'&&module.exports){module.exports=pure;return;}
 if(typeof document==='undefined')return;

 let fig=null,loading=null,missing=false,told=false,shownClip=null,eyeOn=false,sceneRef=null,observer=null;
 const now=()=>Date.now()/1000+(root.VoidDax?.offset||0);
 const interior=()=>{try{return typeof walkingLocation!=='undefined'&&walkingLocation?.id==='neochinatown'&&walkingLocation.area==='interior'&&typeof mode!=='undefined'&&['walking','dialogue','mission-log','pod-waking'].includes(mode);}catch{return false;}};
 function drop(){if(observer&&sceneRef)try{sceneRef.onBeforeRenderObservable.remove(observer);}catch{}observer=null;if(fig){try{fig.ctrl?.dispose?.();fig.node.dispose();}catch{}}fig=null;shownClip=null;eyeOn=false;sceneRef=null;}
 async function ensure(scene){
  if(missing||loading||fig)return;const A=root.VoidAssets,C=root.VoidCrowd;if(!A||!C)return;
  loading=(async()=>{try{if(!A.container('crowd:'+MODEL))await A.load('crowd:'+MODEL,{src:FILE,background:true},scene);}catch(e){missing=true;if(!told){told=true;console.info('[VOID//RUNNER] Dax is not on this machine: her licensed model (void-runner/'+FILE+') is published with the live site only. Nobody stands in for her.');}return;}
   if(scene.isDisposed||!interior()||root.VoidBabylon?.scene!==scene)return;
   const parent=new root.BABYLON.TransformNode('npc-dax',scene),made=A.instance('crowd:'+MODEL,parent);if(!made){parent.dispose();return;}
   parent.metadata={character:'dax',npc:true};made.metadata={...made.metadata,character:'dax',crowd:MODEL};
   fig={node:parent,made,ctrl:C.animate(made,MODEL,'idle')};sceneRef=scene;observer=scene.onBeforeRenderObservable.add(step);})().finally(()=>{loading=null;});}
 function step(){
  if(!fig||fig.node.isDisposed()){drop();return;}const N=root.VoidNeoChinatown,s=schedule(now());
  fig.node.setEnabled(!!s.inside);if(!s.inside)return;
  const w=N.toWorld(s.x,s.z),f=N.toWorld(s.x+Math.sin(s.yaw),s.z+Math.cos(s.yaw));fig.node.position.set(w[0],0,w[1]);
  // turn smoothly toward where the schedule faces her
  const want=Math.atan2(f[0]-w[0],f[1]-w[1]);let d=want-fig.node.rotation.y;d=Math.atan2(Math.sin(d),Math.cos(d));fig.node.rotation.y+=d*Math.min(1,.12);
  if(s.clip!==shownClip){shownClip=s.clip;try{fig.ctrl.play(s.clip);}catch{}}
  if(s.device!==eyeOn){eyeOn=s.device;root.VoidStreetGear?.eye?.(fig.node,eyeOn,EYE);}}
 setInterval(()=>{const scene=root.VoidBabylon?.scene;if(fig&&(fig.node.isDisposed()||scene!==sceneRef||!interior()&&typeof mode!=='undefined'&&mode==='menu')){drop();}
  if(!fig&&scene&&interior())ensure(scene);},1000);
 root.VoidDax={...pure,offset:0,get shown(){return !!fig&&fig.node.isEnabled();},get available(){return !missing;},get where(){return schedule(now());}};
})(typeof globalThis!=='undefined'?globalThis:this);
