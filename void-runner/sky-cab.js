/* REUSABLE SKY-CAB TRANSITION (Corporate District now; the Zen Zephyr Temple next). docs/development/CORPORATE.md.
   The player stays inside a small 3D cab (a real room built from Babylon geometry: seats, dashboard glow, fare readout, rain on the windows, neon streaking past)
   while the destination is made ready; the destination replaces the cab only when it is ready.

   PART 1, create(deps): the orchestration. No browser dependencies, so it is unit-tested with fakes (tests/sky-cab.test.cjs).
     boarded -> riding (the cab room replaces the origin, which is released) -> loading (destination readied during the ride) -> arrived
     Any failure goes to recovery: the fare is refunded once, the player is put back where they left, and nobody is stranded.
   PART 2, build(): the 3D cab interior, used as the 'skycab' walking location by the renderer.
   PART 3, the game wiring (browser only): the fare record, the reload refund, and the hand-off from the street cab (city-taxi.js).

   Fares: the destination's own fare (Corporate 60 CR, the existing maximum), charged once by the street cab when the player boards (taxi-rules.js charge). The return
   ride is INCLUDED in that fare (David's brief asked for a return cab and no second fare; nobody can be stranded without credits). */
(function(root){
 'use strict';
 const CAB_SEAT=[0,1.15,-.35],CAB_LOCATION={id:'skycab',name:'SKY CAB',kind:'city',skycab:true,bounds:[.6,.6],spawn:CAB_SEAT.slice(),yaw:0,color:'#071014',music:'earth',solids:[],interactions:[],signs:[]};
 const FLAG='skyCabTrip',RETURN_FLAG='cabReturn';
 // Destinations: key = the walking location id the game loads. `home` is true for the NeoChinatown street (the return leg). fare is the whole round trip.
 const DESTINATIONS={
  corporate:{id:'corporate',label:'Corporate District',key:'corporate',module:'VoidCorporate',fare:60,distance:1800,spawn:[0,1.7,-14],yaw:0},
  temple:{id:'temple',label:'Zen Zephyr Temple',key:'temple',module:'VoidTemple',fare:60,distance:6000,spawn:[0,1.7,-38],yaw:0},
  neochinatown:{id:'neochinatown',label:'NeoChinatown',key:null,home:true,fare:0,distance:1800}};
 const RIDE_MIN_MS=4500,RIDE_MAX_MS=9000,SPEED_MPS=300;
 const rideMs=(dest,reduced=false)=>reduced?3500:Math.max(RIDE_MIN_MS,Math.min(RIDE_MAX_MS,Math.round((dest.distance||1800)/SPEED_MPS*1000)));
 const parseTrip=v=>{const m=/^([a-z-]{1,24}):(\d{1,4})$/.exec(String(v||''));return m?{dest:m[1],paid:Number(m[2])}:null;};
 const parseReturn=v=>{const m=/^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/.exec(String(v||''));return m?{spawn:[Number(m[1]),1.7,Number(m[2])],yaw:Number(m[3])}:null;};

 function create(d){
  let phase='IDLE',busy=false,returnTo=null;const history=[];
  const sleep=d.sleep||(ms=>new Promise(r=>setTimeout(r,ms))),set=p=>{phase=p;history.push(p);if(history.length>30)history.shift();d.onState?.(p);};
  const flags=()=>d.state().story.flags;
  const homeKey=()=>d.homeKey();
  // Travel to a destination id. from: where the player left ({spawn,yaw}); paid: the fare already charged for this trip (0 for the included return leg).
  async function travel(destId,{from,paid=0}={}){
   const dest=DESTINATIONS[destId];
   if(busy){return false;}
   if(!dest){d.announce?.('That sky cab destination does not exist.');return false;}
   if(!(paid>=0&&paid<=60)){d.announce?.('That fare is not allowed.');return false;}
   busy=true;let arrived=false;const f=flags(),origin=d.location()?.id;
   // Where this trip began: the return leg goes back here. Kept in memory and as text in the save so a reload cannot lose it.
   if(!dest.home&&from){returnTo={spawn:from.spawn.slice(),yaw:from.yaw};f[RETURN_FLAG]=[from.spawn[0].toFixed(2),from.spawn[2].toFixed(2),(from.yaw||0).toFixed(3)].join(',');}
   const target=dest.home?{key:homeKey(),...(returnTo||parseReturn(f[RETURN_FLAG])||d.homeSpawn())}:{key:dest.key,spawn:dest.spawn,yaw:dest.yaw};
   const back=from||{spawn:d.walker()?[d.walker().x,1.7,d.walker().z]:[0,1.7,0],yaw:d.walker()?.yaw||0};
   try{
    f[FLAG]=destId+':'+paid;d.save();set('BOARDED');
    // 1. The cab replaces the origin. The origin is released by the loader, so only one real place is loaded at a time.
    await d.enterWalking('skycab',{silent:true,spawn:CAB_SEAT.slice(),yaw:0});
    if(d.location()?.id!=='skycab')throw new Error('The cab could not be entered.');
    set('RIDING');d.onRide?.(dest);
    // 2. The ride: at least a minimum time, and the destination is readied meanwhile. The cab stays until BOTH are done.
    await Promise.all([sleep(d.rideMs?.(dest)??rideMs(dest)),Promise.resolve(d.prefetch?d.prefetch(dest):null)]);
    // 3. The destination replaces the cab.
    set('LOADING');d.onLoading?.(dest);
    await d.enterWalking(target.key,{silent:true,spawn:target.spawn,yaw:target.yaw});
    const wantId=dest.home?homeKey():dest.key;if(d.location()?.id!==d.locationIdOf(wantId))throw new Error('The destination did not load.');
    arrived=true;delete f[FLAG];if(dest.home)delete f[RETURN_FLAG];d.save();set('ARRIVED');d.announce?.('Arrived: '+dest.label+'.');return true;
   }catch(e){
    // Recovery: the fare comes back once, the player goes back where they left. If even that fails, the flag stays so the next load refunds it.
    set('RECOVERY');let restored=false;
    try{if(paid>0){d.refund(paid);}delete f[FLAG];
     if(d.location()?.id==='skycab'||d.location()?.id!==origin){await d.enterWalking(d.originKey(origin),{silent:true,spawn:back.spawn,yaw:back.yaw});}
     restored=d.location()?.id!=='skycab';}catch{}
    if(restored){d.save();set('RECOVERED');d.announce?.('The sky cab could not land. '+(paid>0?'Your fare of '+paid+' CR was returned.':'You are back where you started.'));}
    else{set('FAILED');if(paid>0)f[FLAG]=destId+':0';}
    return false;
   }finally{busy=false;}
  }
  // After a reload: a trip still recorded was interrupted. Refund its fare once (never twice).
  function recoverSaved(){const f=flags(),t=parseTrip(f[FLAG]);if(!t)return 0;delete f[FLAG];delete f[RETURN_FLAG];if(t.paid>0)d.refund(t.paid);d.save();return t.paid;}
  return {travel,recoverSaved,get phase(){return phase;},get busy(){return busy;},get history(){return history.slice();},get returnTo(){return returnTo;}};
 }

 // ---------------------------------------------------------------- PART 2: the 3D cab (browser) ----------------------------------------------------------------
 // build({scene,parent,quality}) -> {tick(time), setStatus({text,fare,progress}), dispose()}. Built in well under a second: boxes, a few planes and small canvases.
 function build({scene,parent,quality}){
  const B=root.BABYLON,low=quality==='low',own=[],node=new B.TransformNode('skycab',scene);node.parent=parent;
  const mats=new Map(),M=(name,hex,em)=>{const k=name+hex+em;if(mats.has(k))return mats.get(k);const m=new B.StandardMaterial('cab-'+name,scene);m.diffuseColor=B.Color3.FromHexString(hex);m.specularColor=new B.Color3(.3,.3,.34);m.specularPower=48;if(em)m.emissiveColor=B.Color3.FromHexString(em);own.push(m);mats.set(k,m);return m;};
  const G=(name,hex,k=1)=>{const key='g'+name+hex+k;if(mats.has(key))return mats.get(key);const m=new B.StandardMaterial('cab-'+name,scene);m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.emissiveColor=B.Color3.FromHexString(hex).scale(k);m.disableLighting=true;own.push(m);mats.set(key,m);return m;};
  const put=(mesh,mat,x,y,z)=>{mesh.material=mat;mesh.parent=node;mesh.position.set(x,y,z);mesh.isPickable=false;return mesh;};
  const box=(w,h,d,x,y,z,mat)=>put(B.MeshBuilder.CreateBox('cab-box',{width:w,height:h,depth:d},scene),mat,x,y,z);
  const canvas=(w,h,draw)=>{const t=new B.DynamicTexture('cab-tex',{width:w,height:h},scene,false);own.push(t);draw(t.getContext(),w,h,0);t.update();return t;};
  const emissive=(t,alpha)=>{const m=new B.StandardMaterial('cab-screen',scene);m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.emissiveTexture=t;m.disableLighting=true;m.backFaceCulling=false;if(alpha){m.opacityTexture=t;}own.push(m);return m;};
  const dark=M('dark','#0f1114','#07080a'),seatM=M('seat','#1d1a22','#0c0a10'),trim=M('trim','#2a2d33','#101216'),floor=M('floor','#14161a','#08090b'),teal=G('teal','#38e8ff',.9),mag=G('mag','#ff3fb4',.9);
  // The cabin shell (x +-1.1, z -1.5..1.55, floor 0, roof 1.75): floor, roof, door pillars, seats, dashboard.
  box(2.3,.08,3.2,0,-.04,.02,floor);box(2.3,.1,3.2,0,1.8,.02,dark);box(.08,1.8,3.2,-1.16,.9,.02,dark);box(.08,1.8,3.2,1.16,.9,.02,dark);box(2.3,.5,.08,0,.25,-1.6,dark);
  for(const x of [-1.12,1.12])for(const z of [-1.5,-.2,.9,1.5])box(.1,1.75,.1,x,.9,z,trim);
  for(const z of [-1.5,1.5])box(2.3,.1,.1,0,1.72,z,trim);
  // Seats: a rear bench (where the player sits) and two empty front seats (the cab drives itself).
  box(2,.4,.7,0,.3,-1.05,seatM);box(2,.75,.16,0,.78,-1.4,seatM);for(const x of [-.55,.55]){box(.75,.32,.62,x,.28,.55,seatM);box(.7,.62,.14,x,.7,.25,seatM);}
  box(.06,.05,.9,-.98,.52,-1.05,teal);box(.06,.05,.9,.98,.52,-1.05,mag);
  // Dashboard: dark top, teal and magenta glow strips, the fare readout and a progress bar.
  box(2.2,.34,.5,0,.72,1.3,dark);box(2.2,.04,.04,0,.9,1.06,teal);box(2.2,.03,.03,0,.57,1.05,mag);box(.5,.3,.3,-.82,.95,1.22,trim);box(.5,.3,.3,.82,.95,1.22,trim);
  box(1.2,.05,.4,0,.9,1.3,M('dashtop','#181b20','#0b0d10'));
  const dashDraw=(g,w,h,st)=>{g.fillStyle='#04090c';g.fillRect(0,0,w,h);g.fillStyle='#38e8ff';g.font='bold 26px Consolas,monospace';g.textAlign='left';g.fillText('SKY CAB',14,34);
   g.fillStyle='#ff3fb4';g.font='bold 18px Consolas,monospace';g.fillText((st?.text||'BOARDED').slice(0,30),14,66);g.fillStyle='#ffd23f';g.font='bold 24px Consolas,monospace';g.fillText('FARE '+(st?.fare!=null?st.fare:'--')+' CR',14,100);
   g.fillStyle='#0e1d22';g.fillRect(14,112,w-28,10);g.fillStyle='#39ff9c';g.fillRect(14,112,(w-28)*Math.max(0,Math.min(1,st?.progress||0)),10);};
  const status={text:'BOARDED',fare:null,progress:0},dashTex=canvas(320,132,(g,w,h)=>dashDraw(g,w,h,status));
  const dash=put(B.MeshBuilder.CreatePlane('cab-dash',{width:.9,height:.37},scene),emissive(dashTex),0,1.02,1.12);dash.rotation.x=.35;
  // Windows: a windscreen and two side panes of dark glass with rain streaks that run down them (a canvas scrolled, not particles).
  const glass=M('glass','#0a2026','#041014');glass.alpha=.22;glass.backFaceCulling=false;
  const rainTex=canvas(256,512,(g,w,h)=>{g.clearRect(0,0,w,h);let s=11;const r=()=>((s=s*16807%2147483647)-1)/2147483646;for(let i=0;i<(low?90:170);i++){const x=r()*w,y=r()*h,l=18+r()*60;g.strokeStyle='rgba(190,230,255,'+(.15+r()*.4)+')';g.lineWidth=1+r()*1.6;g.beginPath();g.moveTo(x,y);g.lineTo(x+(r()-.5)*3,y+l);g.stroke();}
   for(let i=0;i<(low?30:70);i++){g.fillStyle='rgba(210,240,255,'+(.2+r()*.4)+')';g.beginPath();g.arc(r()*w,r()*h,1+r()*2.2,0,7);g.fill();}});
  rainTex.hasAlpha=true;rainTex.wrapV=B.Texture.WRAP_ADDRESSMODE;rainTex.vScale=1;const rainMat=emissive(rainTex,true);
  const panes=[{w:2.1,h:.95,x:0,y:1.25,z:1.55,ry:0},{w:2.8,h:.95,x:-1.16,y:1.25,z:0,ry:Math.PI/2},{w:2.8,h:.95,x:1.16,y:1.25,z:0,ry:-Math.PI/2}];
  const paneMeshes=[];for(const p of panes){const g=put(B.MeshBuilder.CreatePlane('cab-glass',{width:p.w,height:p.h},scene),glass,p.x,p.y,p.z);g.rotation.y=p.ry;const r=put(B.MeshBuilder.CreatePlane('cab-rain',{width:p.w,height:p.h},scene),rainMat,p.x*.99,p.y,p.z-(p.ry===0?.01:0));r.rotation.y=p.ry;paneMeshes.push(r);}
  // Outside: blurred neon streaking past (long thin emissive bars that slide back and wrap), distant towers, a glow of city far below.
  const outside=new B.TransformNode('cab-outside',scene);outside.parent=node;const streaks=[],cols=['#38e8ff','#ff3fb4','#ffb347','#9b5cff','#e8f6ff'];let s2=7;const r2=()=>((s2=s2*16807%2147483647)-1)/2147483646;
  const n=low?26:46;for(let i=0;i<n;i++){const side=i%2?1:-1,len=1.2+r2()*3.4,m=G('streak'+i%5,cols[i%5],.55+r2()*.4),b=B.MeshBuilder.CreateBox('cab-streak',{width:.05+r2()*.14,height:.05+r2()*.3,depth:len},scene);b.material=m;b.parent=outside;b.isPickable=false;
   b.position.set(side*(2.2+r2()*7),-1+r2()*6,-24+r2()*52);streaks.push({m:b,speed:26+r2()*34,len});}
  const towers=[];for(let i=0;i<(low?10:18);i++){const side=i%2?1:-1,h=10+r2()*40,b=B.MeshBuilder.CreateBox('cab-tower',{width:3+r2()*6,height:h,depth:3+r2()*6},scene);b.material=M('tower','#0b1418','#050c0f');b.parent=outside;b.isPickable=false;b.position.set(side*(11+r2()*16),h/2-18,-30+r2()*60);towers.push({m:b,speed:9+r2()*6});
   const w=B.MeshBuilder.CreatePlane('cab-tower-win',{width:2.4,height:h*.7},scene);w.material=G('tw'+i%3,['#2d6a74','#7a2a60','#8a6a2a'][i%3],.5);w.parent=b;w.position.set(0,0,side>0?-(b.scaling.z||1)*1.6-0.05:0);w.rotation.y=side>0?0:Math.PI;w.isPickable=false;w.setEnabled(false);}
  const city=B.MeshBuilder.CreateGround('cab-city',{width:90,height:90},scene);city.material=G('city','#0a2a30',.45);city.parent=outside;city.position.y=-24;city.isPickable=false;
  let next=0,clock=0,progressTarget=0;
  return {tick(time){const dt=Math.min(.1,Math.max(0,time-clock));clock=time;
    for(const s of streaks){s.m.position.z-=s.speed*dt;if(s.m.position.z<-26)s.m.position.z+=54;}for(const t of towers){t.m.position.z-=t.speed*dt;if(t.m.position.z<-34)t.m.position.z+=68;}
    rainTex.vOffset=(rainTex.vOffset||0)-dt*.55;   // streaks run down the glass
    node.position.y=Math.sin(time*1.7)*.012;node.rotation.z=Math.sin(time*.9)*.006;node.rotation.x=Math.sin(time*1.3)*.004;   // subtle motion
    if(time>next){next=time+.25;status.progress+=(progressTarget-status.progress)*.4;const g=dashTex.getContext();dashDraw(g,320,132,status);dashTex.update();}},
   setStatus(s){if(s.text!==undefined)status.text=s.text;if(s.fare!==undefined)status.fare=s.fare;if(s.progress!==undefined)progressTarget=s.progress;},
   get status(){return {...status};},meshCount:()=>node.getChildMeshes().length,
   dispose(){node.dispose(false,true);for(const o of own)try{o.dispose();}catch{}own.length=0;}};
 }

 const api={CAB_SEAT,CAB_LOCATION,DESTINATIONS,FLAG,RETURN_FLAG,RIDE_MIN_MS,RIDE_MAX_MS,rideMs,parseTrip,parseReturn,create,build};
 if(typeof module==='object'&&module.exports){module.exports=api;return;}
 root.VoidSkyCab=api;
 if(typeof document==='undefined')return;

 // ---------------------------------------------------------------- PART 3: the game wiring (browser) ----------------------------------------------------------------
 const wait=setInterval(()=>{if(typeof enterWalking==='undefined'||typeof VoidExplorationData==='undefined'||typeof state==='undefined'||!root.VoidTaxiRules)return;clearInterval(wait);wire();},400);
 function wire(){
  VoidExplorationData.locations.skycab=CAB_LOCATION;
  const R=root.VoidTaxiRules;let ctl=null;
  const make=()=>ctl||(ctl=create({state:()=>state,enterWalking:(k,o)=>enterWalking(k,o),location:()=>walkingLocation,walker:()=>walker,save:()=>save(),announce:t=>{try{announce(t);}catch{}},
   refund:n=>{state.credits+=n;try{save();hud();}catch{}},homeKey:()=>root.VoidDistrictArea?.KEY?.street||'sacramento',locationIdOf:k=>k==='sacramento'?'neochinatown':k,
   originKey:id=>id==='neochinatown'?(root.VoidDistrictArea?.KEY?.street||'sacramento'):id,homeSpawn:()=>({spawn:[-90,1.7,-12.5],yaw:Math.PI/2}),
   prefetch:dest=>{if(!dest.home&&!(dest.module&&root[dest.module]&&root[dest.module].build))throw new Error('The destination is not available yet.');return null;},
   rideMs:dest=>rideMs(dest,matchMedia?.('(prefers-reduced-motion: reduce)')?.matches),
   onRide:dest=>{try{if(walker){walker.pitch=-.17;walker.yaw=0;}}catch{}const h=root.VoidBabylon?.zone;h?.setStatus?.({text:'EN ROUTE · '+dest.label.toUpperCase().slice(0,18),fare:dest.home?0:dest.fare,progress:.15});let k=0;const t=setInterval(()=>{k++;const z=root.VoidBabylon?.zone;if(!z||ctl.phase!=='RIDING'){clearInterval(t);return;}z.setStatus?.({progress:Math.min(.9,.15+k*.09)});},700);},
   onLoading:dest=>{root.VoidBabylon?.zone?.setStatus?.({text:'LANDING · '+dest.label.toUpperCase().slice(0,18),progress:1});}}));
  // From the street cab (city-taxi.js): the fare was charged at boarding. Hand the trip to the transition.
  root.VoidSkyCab.ride=async function(destId,{from,paid}){const c=make();try{R.arrive(state);}catch{}return c.travel(destId,{from,paid});};
  root.VoidSkyCab.controller=make;
  // A reload during a trip leaves a record: refund it once. The street cab has its own record (taxiTrip) and its own refund; this is the cab-room one.
  const prev=update;update=function(dt){prev(dt);if(state?.story?.flags?.[FLAG]&&!(ctl&&ctl.busy)){const n=make().recoverSaved();if(n>0){announce('Your interrupted sky cab trip was refunded: '+n+' CR.');}}};
 }
})(typeof globalThis!=='undefined'?globalThis:this);
