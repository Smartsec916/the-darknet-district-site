/* Corporate District security: cameras, patrol drones, security robots, stealth and detection. PURE rules (no rendering); tests/corporate-security.test.cjs.
   The 3D robots, drones and cameras are built from this data (corporate-actors.js, corporate.js) and moved by the same functions, so what the player sees is what is tested.

   Passive in this release: nothing here ever attacks. A fully detected player is challenged or warned. Combat can hook in later through `hooks` (see on()).

   Detection (0..1) rises while at least one observer sees the player and falls when none does:
     seen    = inside the observer's cone and range, with a clear line (no building, dumpster, crate or wall between)
     visible = light of the zone the player stands in x stance (crouching) x motion (standing still)
   Cover, shadow, crouching and passing under a walkway all lower `visible`; solid cover also breaks the line entirely.
   States: clear (under SUSPICIOUS), suspicious (yellow), detected (red). Hysteresis stops it flickering at a threshold. */
(function(root){
 'use strict';
 const TAU=Math.PI*2,SUSPICIOUS=.35,DETECTED=.85,CLEARS_DETECTED=.6,GAIN=1.1,DECAY=.28,LOST_TO=.6;
 const STANCE={stand:1,crouch:.55},MOTION={still:.7,walk:1,run:1.25};
 const QUALITY_COUNTS={robots:{low:3,medium:4,high:5,ultra:6},drones:{low:1,medium:2,high:3,ultra:4},cameras:{low:4,medium:6,high:8,ultra:8}};
 const counts=q=>({robots:QUALITY_COUNTS.robots[q]??QUALITY_COUNTS.robots.medium,drones:QUALITY_COUNTS.drones[q]??QUALITY_COUNTS.drones.medium,cameras:QUALITY_COUNTS.cameras[q]??QUALITY_COUNTS.cameras.medium});
 const norm=a=>{a=(a+Math.PI)%TAU;if(a<0)a+=TAU;return a-Math.PI;};
 // yaw convention matches the game: yaw 0 looks along +z, +PI/2 along +x.
 const bearing=(from,to)=>Math.atan2(to.x-from.x,to.z-from.z);
 // A camera's head sweeps predictably: base +- amplitude on a sine of fixed period.
 const cameraYaw=(cam,t)=>cam.yaw+(cam.sweep||0)*Math.sin(TAU*(t/(cam.period||8))+(cam.phase||0));
 // A drone flies a closed loop of points at a steady speed; its heading turns toward the segment direction, never snapping.
 function loopLength(path){let L=0;for(let i=0;i<path.length;i++){const a=path[i],b=path[(i+1)%path.length];L+=Math.hypot(b[0]-a[0],b[1]-a[1]);}return L;}
 function patrolPoint(path,speed,t,offset=0){const L=loopLength(path);if(!L)return {x:path[0][0],z:path[0][1],heading:0};let d=((t*speed+offset)%L+L)%L;
  for(let i=0;i<path.length;i++){const a=path[i],b=path[(i+1)%path.length],s=Math.hypot(b[0]-a[0],b[1]-a[1]);if(d<=s){const k=s?d/s:0;return {x:a[0]+(b[0]-a[0])*k,z:a[1]+(b[1]-a[1])*k,heading:Math.atan2(b[0]-a[0],b[1]-a[1])};}d-=s;}
  return {x:path[0][0],z:path[0][1],heading:0};}
 const turnToward=(cur,want,maxStep)=>{const d=norm(want-cur);return norm(cur+Math.max(-maxStep,Math.min(maxStep,d)));};
 // Segment a->b against axis-aligned boxes [x0,x1,z0,z1] (slab method).
 function segmentHitsBox(a,b,[x0,x1,z0,z1]){let t0=0,t1=1;const dx=b.x-a.x,dz=b.z-a.z;
  for(const [p,d,lo,hi] of [[a.x,dx,x0,x1],[a.z,dz,z0,z1]]){if(Math.abs(d)<1e-9){if(p<lo||p>hi)return false;}else{let u=(lo-p)/d,v=(hi-p)/d;if(u>v)[u,v]=[v,u];t0=Math.max(t0,u);t1=Math.min(t1,v);if(t0>t1)return false;}}return true;}
 const losBlocked=(a,b,boxes)=>boxes.some(bx=>segmentHitsBox(a,b,bx)&&!(a.x>=bx[0]&&a.x<=bx[1]&&a.z>=bx[2]&&a.z<=bx[3]));
 const inRect=(r,x,z)=>x>=r[0]&&x<=r[1]&&z>=r[2]&&z<=r[3];
 // Light of the zone a point is in. Zones are listed most specific first; the first match wins. covered: under a walkway or roof (a camera cannot see through).
 function zoneAt(zones,x,z){for(const zn of zones)if(inRect(zn.rect,x,z))return zn;return null;}
 const lightAt=(zones,x,z)=>zoneAt(zones,x,z)?.light??.6;
 const visibility=(player,light)=>light*(player.crouch?STANCE.crouch:STANCE.stand)*(player.run?MOTION.run:player.moving?MOTION.walk:MOTION.still);
 // Does this observer see the player (geometry only)? obs: {x,z,y?,range,fov (half angle),yaw (current)}. Returns 0 (no) or a distance factor 0.25..1.
 function sees(obs,player,cover){const d=Math.hypot(player.x-obs.x,player.z-obs.z);if(d>obs.range)return 0;
  if(!obs.omni&&Math.abs(norm(bearing(obs,player)-obs.yaw))>obs.fov)return 0;
  if(obs.under&&d>obs.under)return 0;   // a drone looks straight down: only a small disc
  if(losBlocked({x:obs.x,z:obs.z},{x:player.x,z:player.z},cover))return 0;
  return Math.max(.25,1-d/obs.range);}

 function create(world){
  const W={cameras:[],drones:[],guards:[],cover:[],zones:[],entrances:[],...world},hooks=new Map();
  const S={detection:0,state:'clear',t:0,cooldown:0,challenged:new Map(),lastSeenBy:null,events:[]};
  const emit=(name,data)=>{S.events.push({name,...data});for(const f of hooks.get(name)||[])try{f(data);}catch{}};
  // Hooks for later missions and combat: 'suspicious', 'detected', 'cleared', 'challenge', 'warning'. Returns an unsubscribe function.
  const on=(name,fn)=>{if(!hooks.has(name))hooks.set(name,new Set());hooks.get(name).add(fn);return()=>hooks.get(name).delete(fn);};
  const observers=t=>[
   ...W.cameras.map(c=>({id:c.id,kind:'camera',x:c.x,z:c.z,range:c.range||22,fov:c.fov||.5,yaw:cameraYaw(c,t)})),
   ...W.guards.map(g=>{const p=g.path?patrolPoint(g.path,g.speed||1.2,t,g.offset||0):null;return {id:g.id,kind:'guard',x:p?p.x:g.x,z:p?p.z:g.z,range:g.range||16,fov:g.fov||.9,yaw:p?p.heading:g.scan?g.yaw+(g.scan)*Math.sin(TAU*t/(g.period||10)):g.yaw};}),
   ...W.drones.map(d=>{const p=patrolPoint(d.path,d.speed||5,t,d.offset||0);return {id:d.id,kind:'drone',x:p.x,z:p.z,range:d.range||12,fov:Math.PI,yaw:p.heading,omni:true,under:d.under||9};})];
  function challenge(player){
   for(const e of W.entrances){const d=Math.hypot(player.x-e.x,player.z-e.z),st=S.challenged.get(e.id)||{armed:true,until:0};
    if(d<e.radius&&st.armed&&S.t>=st.until){S.challenged.set(e.id,{armed:false,until:S.t+(e.cooldown||14)});emit('challenge',{entrance:e.id,text:e.text||'State your business.',guard:e.guard||null});}
    else if(d>e.radius*1.6&&!st.armed)S.challenged.set(e.id,{...st,armed:true});}}
  // Advance by dt seconds at game time t with the player's current state. Returns the events raised this step.
  function step(dt,t,player){
   S.t=t;S.events=[];const light=lightAt(W.zones,player.x,player.z),zone=zoneAt(W.zones,player.x,player.z),vis=visibility(player,light),covered=!!zone?.covered;
   let rate=0,by=null;for(const o of observers(t)){
    if(covered&&o.kind==='camera')continue;   // a camera cannot see under a walkway or roof
    const k=sees(o,player,W.cover);if(k>0){const r=GAIN*vis*(.4+.6*k);if(r>rate){rate=r;by=o.id;}}}
   S.lastSeenBy=rate>0?by:null;S.detection=Math.max(0,Math.min(1,S.detection+(rate>0?rate*dt:-DECAY*dt)));
   const prev=S.state;let next=prev;
   if(prev==='detected'){if(S.detection<CLEARS_DETECTED)next=S.detection>=SUSPICIOUS?'suspicious':'clear';}
   else if(S.detection>=DETECTED)next='detected';
   else if(S.detection>=SUSPICIOUS)next='suspicious';else if(prev==='suspicious'&&S.detection<SUSPICIOUS-.1)next='clear';
   if(next!==prev){S.state=next;if(next==='suspicious')emit('suspicious',{by});else if(next==='detected')emit('detected',{by});else if(next==='clear')emit('cleared',{});}
   // Detected: a warning, never an attack. The detection drops to LOST_TO so the warning is not repeated every frame.
   if(S.state==='detected'&&S.cooldown<=0){S.cooldown=6;S.detection=Math.min(S.detection,LOST_TO+.05);emit('warning',{by,text:'Restricted area. Return to the plaza.'});}
   S.cooldown=Math.max(0,S.cooldown-dt);
   challenge(player);return S.events;}
  const reset=()=>{S.detection=0;S.state='clear';S.cooldown=0;S.challenged.clear();S.events=[];S.lastSeenBy=null;};
  return {step,on,reset,observers,world:W,get detection(){return S.detection;},get state(){return S.state;},get seenBy(){return S.lastSeenBy;},set detection(v){S.detection=v;}};
 }
 const api={SUSPICIOUS,DETECTED,CLEARS_DETECTED,QUALITY_COUNTS,STANCE,MOTION,counts,cameraYaw,patrolPoint,loopLength,turnToward,segmentHitsBox,losBlocked,zoneAt,lightAt,visibility,sees,bearing,norm,create};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.VoidCorporateSecurity=api;
})(typeof globalThis!=='undefined'?globalThis:this);
