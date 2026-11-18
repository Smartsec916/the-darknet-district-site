/* The Avenue's street pair (the owner, 18 Nov 2026: "Put Reverie and Lace in the streets rotated every 12 hours", and a cat "which seeks these two out on the street
   and seeks attention from them"). Two named residents made from the owner's own Meshy generations take turns on the north pavement of The Avenue, by the
   LAUNDRY and REPAIR shopfronts (a plain daytime stretch: well away from Milked, NULL and the clubs). Both are ordinary street residents: casual, everyday clips only.
   - REVERIE (internal id grey-reverie, Meshy title "Grey Reverie"; placeholder name): oversized grey hoodie, dark ankle socks, chunky platform loafers. Until
     18 Nov 2026 a static figure sculpted sitting hugging her knees; now a standing A-pose model of her (Meshy image-to-image from a render of the original, then
     image-to-3d, remesh and auto-rig) with the full street library below. Her favourite seat is the ledge against the LAUNDRY wall (ledge-reverie).
   - LACE (internal id ethereal-lace, Meshy title "Ethereal Lace"; placeholder name): white tiered lace mini dress, frilled ankle socks, a ribbon.
   - THE LIBRARY (the owner, 18 Nov 2026: "a wider range of animations"; CLIPS below, the same for both): idles (a weight shift, a stretch), looking about and
     watching, walk and a short run, sitting down, sitting and standing up again (transition clips), two casual dances (a groove and a happy bop: nothing
     sensual; BANNED lists what must never be added), talking and gesturing (to the cat), a shrug, a wave from the seat, and the V1 (npc-device.js poses:
     reading while walking, scrolling while stopped or seated, a selfie, a photo of the cat).
   - THE ROUTINE (routineStep, pure): walk the stretch; now and then run a short way; stop for an idle, a look about, a glance at the V1 or a selfie; when the cat
     is close, talk to it, photograph it or dance a little; sit on a ledge (Reverie mostly on hers) through the sit-down clip, then stand up through the
     stand-up clip and walk on. Clips cross-fade over about 0.4 s.
   - THE SHIFT is real time on one clock for everyone (UTC): hours 0-11 Reverie, 12-23 Lace. For the first `arrive` seconds of each shift nobody is out yet (one
     has gone, the other is on her way). The game clock (game-clock.js) was not used: it is per player and only runs while playing, so players would disagree.
   - THE CAT (npc-street-cat, the owner's Meshy cat; a small rig of ten bones added in Blender, no Meshy credits) trots to whichever of them is out: it circles
     and rubs round her legs when she stops, follows at her heel when she walks, and sits beside her while she sits. With neither out it potters about by the
     LAUNDRY door. Now and then it goes to a player who comes close, sits looking up for a few seconds, and goes back.
   MISSION GIVERS (the owner, 18 Nov 2026: Reverie and Lace as givers in the Mission Editor): whoever is out has a TALK TO prompt that follows her (an interaction
   in walkingLocation.interactions, id street-pair-<id>, action 'street-pair', its position moved with her figure every frame; added to the list four times a second,
   and only while she is out, on the street, within showRadius). Talking to her: a mission the Mission Editor gives her is offered (live-content.js wraps every
   interaction); otherwise her one neutral GREETING line (text only, no voice; a placeholder). While the player talks to her she stops (or stays seated) and turns to
   them. A mission given by one of them is offered only while she is out (mission-givers.js onDuty; mission-content.js). Ordinary street residents: nothing flirtatious.
   Draft play (Mission Editor) may put a chosen one on the street at any hour: VoidStreetPair.force = '<id>' (throwaway session only). Names are placeholders awaiting the owner. Pure planning (the shift, the routine, the cat's choice of whom to go to) runs in Node: tests/ncz-street-pair.test.cjs.
   The figures run in the browser, started by neochinatown.js with the street (The Avenue, or the whole city). Multiplayer: the street is not shared, but the
   shift is the same for everyone. */
(function(root){
 'use strict';
 const PAIR=[
  {id:'grey-reverie',name:'Reverie',title:'Grey Reverie',asset:'npc-grey-reverie',kind:'walker',hours:[0,12],favourite:'ledge-reverie',placeholder:true},
  {id:'ethereal-lace',name:'Lace',title:'Ethereal Lace',asset:'npc-ethereal-lace',kind:'walker',hours:[12,24],favourite:null,placeholder:true}];
 // What she says when there is no mission for the player (neutral placeholders: no lore, no voice). The interaction: TALK_ACTION, id talkId(p.id).
 const GREETING={'grey-reverie':['Hey.'],'ethereal-lace':['Hi.']},TALK_ACTION='street-pair',talkId=id=>'street-pair-'+id;
 // The clip library both of them carry (crowd.js lists it per file; tools/animation-pipeline/characters/npc-*.json build it). Casual street clips only.
 const CLIPS={idles:['idle','idle-shift','idle-stretch'],look:['look','watch'],walk:'walk',run:'run',sitDown:'sit-enter',sit:'sit',standUp:'sit-exit',wave:'sit-wave',
  dances:['dance-groove','dance-bop'],talk:['talk','gesture'],shrug:'shrug'};
 const CLIP_LIST=[...CLIPS.idles,...CLIPS.look,CLIPS.walk,CLIPS.run,CLIPS.sitDown,CLIPS.sit,CLIPS.standUp,CLIPS.wave,...CLIPS.dances,...CLIPS.talk,CLIPS.shrug];
 // Never add these to the pair (the owner's content rule for these two: youthful faces, ordinary street residents): no sensual, slow, belly, hip, twerk, grind,
 // pole, "milked", flirt, kiss or seductive clips, no reclining or lying poses.
 const BANNED=/sensual|slow|belly|hip|twerk|grind|pole|milk|flirt|kiss|seduc|coy|samba|recline|lap|strip|club/i;
 const DEVICE=['scroll','selfie','photo'];    // npc-device.js poses they use (reading while walking comes from its own scheduler)
 const QUARTER='avenue',CAT='npc-street-cat';
 // World metres (x east, z north). The Avenue's north pavement runs along z -6.6 (ncz-nightlife.js lane avenue-north); the shopfronts' wall is the face of the
 // street block at z -5 (neochinatown.js city-block-32).
 const WALL=-5.05;
 const SEAT={x:104.4,z:-5.42,yaw:Math.PI};                     // Reverie's favourite spot: against the LAUNDRY wall, looking out at the road (her ledge, below)
 const STRETCH={x0:84,x1:121,z:-6.85};                         // the walk (between REPAIR at 75.5 and the BIO-CLINIC at 124.5)
 const STEPS=[{id:'ledge-repair',x:90.5,w:1.5,d:.45,h:.5},{id:'ledge-reverie',x:SEAT.x,w:1.5,d:.45,h:.5},{id:'ledge-laundry',x:113.2,w:1.5,d:.45,h:.5}].map(s=>({...s,z:WALL-s.d/2}));   // concrete ledges against the wall, seat height (the sit clip's hips joint is 0.6 m up)
 const CAT_HOME={x:100.6,z:-5.7};
 const config={
  arrive:90,                 // seconds at the start of each shift with nobody out yet
  walk:[18,36],sit:[22,40],pause:[3,6],pauseShare:.35,         // how long she walks between things, sits, stops to look about at a turn
  speed:1,run:2.9,runFor:[2.2,3.6],                          // walking and running pace (m/s); a run lasts a few seconds
  next:{sit:.34,stop:.48,run:.18},                             // what she does when a walk ends
  stop:{idle:[5,9],look:[5,8],device:[6,11],selfie:[4,6],talk:[4,7],photo:[3.5,5],dance:[6,10],shrug:[3,4]},
  len:{'sit-enter':1.3,'sit-exit':1},                          // the transition clips' lengths (s); the browser uses the clip's own length
  // The clips keep the hips in place horizontally (the game moves the figure), so sitting down and standing up need the figure moved under them: measured on the
  // rig (the hips sit 0.34 m behind the feet origin in `sit`, 0.03 in sit-enter and 0.28 in sit-exit; sit-enter slides the feet 0.36 m forward, sit-exit 0.28 back).
  seatShift:{enter:.36,sit:.31,exitStart:.06,exit:.34,walk:.3,blendFor:.42},
  clipShift:{'sit-wave':-.38},                                 // the seated wave clip sits 0.38 m further back than `sit`: the figure comes forward while she waves
  favourite:.7,catNear:1.6,dance:{cat:.3,alone:.05},
  showRadius:80,animRadius:40,lowAnimRadius:25,blend:.04,      // hide / stop limbs beyond these (m); cross-fade speed per frame (about 0.4 s at 60 fps)
  // A glance at a player close in front of her (the owner, 18 Nov 2026: "slight head tracking when a player is near the front of them"): within `radius` metres
  // and `cone` either side of where her body faces; the head and neck turn at most `yaw` / `pitch`, eased in and out over `blend` seconds. Not while she
  // dances, runs or holds a V1 pose. Their Meshy rigs have no eye bones and the eyes are painted into the face texture, so there is no separate eye tracking.
  look:{radius:4.5,cone:70*Math.PI/180,yaw:35*Math.PI/180,pitch:15*Math.PI/180,blend:.4,neck:.35},
  cat:{trot:1.45,walk:.55,turn:4,playerRadius:3.5,playerFor:[4,7],playerCool:[40,70],playerChance:.5,circleR:.42,circleFor:[4,7],sitBy:.55,heel:.6,homeWander:2.2}};
 const hourOf=ms=>new Date(ms).getUTCHours();
 // Who is on shift at a moment (ms since the epoch, UTC): hours 0-11 Reverie, 12-23 Lace.
 function onShift(ms){const h=hourOf(ms);return PAIR.find(p=>h>=p.hours[0]&&h<p.hours[1])||PAIR[0];}
 // The start of the shift a moment falls in, and the next change (ms).
 function shiftStart(ms){const d=new Date(ms);return Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate(),d.getUTCHours()<12?0:12);}
 const nextChange=ms=>shiftStart(ms)+12*3600e3;
 // Who is actually out on the street: the one on shift, except in the first `arrive` seconds of a shift (nobody yet).
 function onStreet(ms,cfg=config){return ms-shiftStart(ms)<cfg.arrive*1000?null:onShift(ms);}
 const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
 /* Whom the cat goes to. her: {x, z, sitting, moving} of the one who is out, or null; player: {x, z} or null; cat: {x, z}; clock: seconds; until: the time
    before which the cat will not go to a player again (its cool-down); rnd(): a fresh chance each time a player comes into range (pass 0 to always go).
    Returns {kind: 'player' | 'her' | 'home', x, z}. */
 function catTarget({her=null,player=null,cat=null,clock=0,until=0,chance=0},cfg=config.cat){
  if(player&&cat&&clock>=until&&dist(player,cat)<cfg.playerRadius&&chance<cfg.playerChance)return {kind:'player',x:player.x,z:player.z};
  if(her)return {kind:'her',x:her.x,z:her.z,sitting:!!her.sitting,moving:!!her.moving};
  return {kind:'home',x:CAT_HOME.x,z:CAT_HOME.z};}
 /* The routine, one step. s: {who, mode, x, z, dir, left, step, yaw, clip, once, device}. ctx: {cat: {x, z} or null, player: {x, z} or null}.
    Returns the same object, changed: `clip` the clip to play (`once`: a transition played once), `device` an npc-device.js pose to hold or null, `face` a point
    she turns to (the cat) or null.
    walk -> (a turn: pause) | run | stop (idle, look, V1, selfie; with the cat near: talk to it, photograph it, dance) | to-step -> settle -> sit-down -> sit
    -> stand-up -> step-off -> walk */
 const between=(r,[a,b])=>a+r()*(b-a),pick=(r,l)=>l[Math.min(l.length-1,Math.floor(r()*l.length))];
 function routineStart(p=PAIR[1],rnd=Math.random,cfg=config){const x=between(rnd,[STRETCH.x0+3,STRETCH.x1-3]);return {who:p.id,favourite:p.favourite||null,mode:'walk',x,z:STRETCH.z,dir:rnd()<.5?1:-1,left:between(rnd,cfg.walk),step:null,yaw:0,clip:'walk',once:false,device:null,face:null,sub:null};}
 // the sit clip puts the hips 0.35 m behind the figure's origin (its feet) and 0.65 m up: so she stands that far in front of the ledge's middle
 const seatOf=st=>st.z-.36,frontOf=st=>seatOf(st)-.05;   // the figure's origin while seated (hips over the ledge's middle), and where she stands to sit down
 function chooseStep(s,rnd,cfg){const near=(a,b)=>Math.abs(a.x-s.x)-Math.abs(b.x-s.x);
  if(s.favourite&&rnd()<cfg.favourite){const f=STEPS.find(t=>t.id===s.favourite);if(f)return f;}
  const ahead=STEPS.filter(t=>(t.x-s.x)*s.dir>1.5).sort(near);return ahead[0]||STEPS.slice().sort(near)[0];}
 function chooseStop(s,rnd,cfg,ctx){const catNear=!!ctx.cat&&dist(ctx.cat,s)<cfg.catNear*2.2,st=cfg.stop;
  if(catNear){const r=rnd();if(r<cfg.dance.cat)return {sub:'dance',clip:pick(rnd,CLIPS.dances),left:between(rnd,st.dance)};
   if(r<cfg.dance.cat+.3)return {sub:'talk',clip:pick(rnd,CLIPS.talk),left:between(rnd,st.talk),face:true};
   if(r<cfg.dance.cat+.5)return {sub:'photo',clip:'idle',device:'photo',left:between(rnd,st.photo),face:true};}
  const r=rnd();
  if(r<cfg.dance.alone)return {sub:'dance',clip:pick(rnd,CLIPS.dances),left:between(rnd,st.dance)};
  if(r<.3)return {sub:'idle',clip:pick(rnd,CLIPS.idles),left:between(rnd,st.idle)};
  if(r<.5)return {sub:'look',clip:pick(rnd,CLIPS.look),left:between(rnd,st.look)};
  if(r<.75)return {sub:'device',clip:pick(rnd,['idle','idle-shift']),device:'scroll',left:between(rnd,st.device)};
  if(r<.88)return {sub:'selfie',clip:'idle',device:'selfie',left:between(rnd,st.selfie)};
  return {sub:'shrug',clip:CLIPS.shrug,left:between(rnd,st.shrug)};}
 function routineStep(s,dt,rnd=Math.random,cfg=config,ctx={}){
  s.left-=dt;s.once=false;
  const clampEnds=()=>{if(s.x>STRETCH.x1||s.x<STRETCH.x0){s.x=Math.max(STRETCH.x0,Math.min(STRETCH.x1,s.x));s.dir*=-1;return true;}return false;};
  const toWalk=()=>{s.mode='walk';s.clip='walk';s.device=null;s.face=null;s.sub=null;s.left=between(rnd,cfg.walk);};
  if(s.mode==='walk'||s.mode==='run'){const run=s.mode==='run',v=(run?cfg.run:cfg.speed)*dt;s.x+=s.dir*v;s.z+=(STRETCH.z-s.z)*Math.min(1,dt*2);s.yaw=s.dir>0?Math.PI/2:-Math.PI/2;s.clip=run?'run':'walk';s.device=null;s.face=null;
   if(clampEnds()){if(run)toWalk();else if(rnd()<cfg.pauseShare){s.mode='pause';s.left=between(rnd,cfg.pause);s.clip=pick(rnd,CLIPS.look);}return s;}
   if(s.left<=0){if(run){toWalk();return s;}
    const r=rnd(),n=cfg.next;
    if(r<n.sit){s.step=chooseStep(s,rnd,cfg);s.mode='to-step';}
    else if(r<n.sit+n.run&&Math.min(s.x-STRETCH.x0,STRETCH.x1-s.x)>4){s.mode='run';s.clip='run';s.left=between(rnd,cfg.runFor);}
    else{const o=chooseStop(s,rnd,cfg,ctx);s.mode='stop';s.sub=o.sub;s.clip=o.clip;s.device=o.device||null;s.left=o.left;s.face=o.face&&ctx.cat?{x:ctx.cat.x,z:ctx.cat.z}:null;}}
   return s;}
  if(s.mode==='pause'){if(s.left<=0)toWalk();return s;}
  if(s.mode==='stop'){if(s.face&&ctx.cat){s.face.x=ctx.cat.x;s.face.z=ctx.cat.z;}
   if(s.face){const want=Math.atan2(s.face.x-s.x,s.face.z-s.z),dy=Math.atan2(Math.sin(want-s.yaw),Math.cos(want-s.yaw));s.yaw+=dy*Math.min(1,dt*3);}
   if(s.left<=0)toWalk();return s;}
  if(s.mode==='to-step'){const v=cfg.speed*dt,tx=s.step.x,tz=frontOf(s.step),dx=tx-s.x,dz=tz-s.z,d=Math.hypot(dx,dz);s.clip='walk';
   if(d<=v+.02){s.x=tx;s.z=tz;s.mode='settle';s.left=1.1;s.clip='idle';}else{s.x+=dx/d*v;s.z+=dz/d*v;s.yaw=Math.atan2(dx,dz);}return s;}
  if(s.mode==='settle'){// turn to face the road, then sit down through the transition clip
   const want=Math.PI,dy=Math.atan2(Math.sin(want-s.yaw),Math.cos(want-s.yaw));s.yaw+=dy*Math.min(1,dt*5);s.clip='idle';
   if(s.left<=0||Math.abs(dy)<.06){s.yaw=want;s.mode='sit-down';s.left=cfg.len['sit-enter'];s.clip=CLIPS.sitDown;s.once=true;s.z0=s.z;}return s;}
  const sh=cfg.seatShift,ease=()=>{if(!s.zo)return;s.zoLeft-=dt;s.zo=s.zoLeft<=0?0:s.zo0*s.zoLeft/sh.blendFor;},shift=v=>{s.zo=s.zo0=v;s.zoLeft=sh.blendFor;};   // zo: an offset eased out over the cross-fade, so hips and feet stay put when the clip changes
  if(s.mode==='sit-down'){// she backs onto the ledge as she lowers: the figure moves back as fast as the clip slides her feet forward, so the feet stay put
   const k=Math.min(1,1-Math.max(0,s.left)/cfg.len['sit-enter']);s.z=s.z0+sh.enter*k;s.clip=CLIPS.sitDown;
   if(s.left<=0){s.z=seatOf(s.step);shift(sh.sit);s.mode='sit';s.left=between(rnd,cfg.sit);s.clip=CLIPS.sit;s.waved=false;s.device=rnd()<.45?'scroll':null;s.devLeft=between(rnd,[8,14]);}return s;}
  if(s.mode==='sit'){ease();s.clip=CLIPS.sit;s.devLeft-=dt;if(s.device&&s.devLeft<=0)s.device=null;
   // a wave from the seat to a player who comes close (once a sit)
   if(!s.waved&&ctx.player&&dist(ctx.player,s)<4.5){s.waved=true;s.device=null;s.sub='wave';s.waveLeft=3.6;}
   if(s.sub==='wave'){s.waveLeft-=dt;s.clip=CLIPS.wave;if(s.waveLeft<=0)s.sub=null;}
   if(s.left<=0&&s.sub!=='wave'){s.mode='stand-up';s.device=null;s.zo=0;s.z0=seatOf(s.step)+sh.exitStart;s.z=s.z0;s.left=cfg.len['sit-exit'];s.clip=CLIPS.standUp;s.once=true;}return s;}
  if(s.mode==='stand-up'){// she leans forward and rises over her feet: the figure moves forward with her hips
   const k=Math.min(1,1-Math.max(0,s.left)/cfg.len['sit-exit']);s.z=s.z0-sh.exit*k;s.clip=CLIPS.standUp;
   if(s.left<=0){s.z+=sh.walk;shift(-sh.walk);s.mode='step-off';s.clip='walk';s.dir=rnd()<.5?1:-1;}return s;}
  if(s.mode==='step-off'){ease();const v=cfg.speed*dt,tz=frontOf(s.step)-.3;s.clip='walk';s.yaw=Math.PI;s.z-=v;if(s.z<=tz){s.step=null;s.zo=0;toWalk();}return s;}
  return s;}
 /* Whom she glances at and how far. body: {x, z, yaw} (her figure); head: {x, y, z}; eyes: [{x, y, z}] the players' eyes (the local one and others in the
    scene). Returns {i (index of the nearest player in range and in front), yaw, pitch (clamped, radians, relative to the body), dist} or null. */
 const wrapA=a=>((a+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;
 function lookAt(body,head,eyes,cfg=config.look){let best=null;
  for(let i=0;i<(eyes||[]).length;i++){const e=eyes[i];if(!e)continue;const dx=e.x-head.x,dz=e.z-head.z,d=Math.hypot(dx,dz);if(d>cfg.radius||d<.15)continue;
   const off=wrapA(Math.atan2(dx,dz)-body.yaw);if(Math.abs(off)>cfg.cone)continue;if(best&&best.dist<=d)continue;
   best={i,dist:d,yaw:Math.max(-cfg.yaw,Math.min(cfg.yaw,off)),pitch:Math.max(-cfg.pitch,Math.min(cfg.pitch,Math.atan2(e.y-head.y,d)))};}
  return best;}
 // When the glance is allowed: not while she dances, runs, or holds a V1 pose (npc-device.js turns the head itself then).
 const canLook=s=>!!s&&s.mode!=='run'&&s.sub!=='dance'&&!s.device;
 // Older names (the first version had only Lace walking).
 const laceStart=(rnd=Math.random,cfg=config)=>routineStart(PAIR[1],rnd,cfg),laceStep=routineStep;
 const api={PAIR,CLIPS,CLIP_LIST,BANNED,DEVICE,QUARTER,CAT,WALL,SEAT,STRETCH,STEPS,CAT_HOME,config,onShift,shiftStart,nextChange,onStreet,catTarget,routineStart,routineStep,laceStart,laceStep,frontOf,seatOf,lookAt,canLook,GREETING,TALK_ACTION,talkId};
 if(typeof module==='object'&&module.exports){module.exports=api;return;}

 /* start({B, scene, parent, quality, player, now}) -> {tick(dt), stats(), dispose()}. The figures and the cat appear when their files have loaded. */
 function start({B=root.BABYLON,scene,parent,quality='medium',player=()=>typeof walker!=='undefined'?walker:null,now:clockFn=()=>Date.now(),rnd=Math.random,cfg=config}){
  let now=clockFn;   // setClock(fn): tests force a shift
  // who is out: the shift, or the one draft play put on the street (VoidStreetPair.force)
  const out=()=>{const f=root.VoidStreetPair?.force;return (f&&PAIR.find(p=>p.id===f))||onStreet(now(),cfg);};
  const assets=root.VoidAssets,owned=[];let disposed=false,clock=0,asked=-1;
  const animRadius=quality==='low'?cfg.lowAnimRadius:cfg.animRadius;
  const cam=()=>scene?.activeCamera?.globalPosition||null;
  // The pavement's top (the sidewalk slabs stand about 0.18 m above the road): read from the built street once, under Reverie's spot.
  let PAVE=.18;try{const h=scene.pickWithRay(new B.Ray(new B.Vector3(SEAT.x,3,SEAT.z-.4),new B.Vector3(0,-1,0),6),m=>/^sidewalk/.test(m.name));if(h?.hit&&h.pickedPoint.y>-.05&&h.pickedPoint.y<.4)PAVE=h.pickedPoint.y;}catch{}
  // ---- the ledges they sit on (street furniture: there on both shifts) ----
  const ledgeMat=new B.PBRMaterial('street-pair-ledge',scene);ledgeMat.albedoColor=B.Color3.FromHexString('#3a3c40');ledgeMat.roughness=.92;ledgeMat.metallic=0;owned.push(ledgeMat);
  const trimMat=new B.PBRMaterial('street-pair-ledge-trim',scene);trimMat.albedoColor=B.Color3.FromHexString('#1d1e21');trimMat.roughness=.7;trimMat.metallic=.3;owned.push(trimMat);
  for(const st of STEPS){const b=B.MeshBuilder.CreateBox('street-pair-'+st.id,{width:st.w,height:st.h,depth:st.d},scene);b.parent=parent;b.position.set(st.x,PAVE+st.h/2,st.z);b.material=ledgeMat;b.isPickable=false;
   const t=B.MeshBuilder.CreateBox('street-pair-'+st.id+'-edge',{width:st.w+.04,height:.04,depth:st.d+.04},scene);t.parent=parent;t.position.set(st.x,PAVE+st.h+.02,st.z);t.material=trimMat;t.isPickable=false;owned.push(b,t);b.freezeWorldMatrix();t.freezeWorldMatrix();}
  // ---- loading: only the one who is out, and the cat ----
  const src=a=>'assets/models/crowd/'+a+'.glb',has=a=>!!assets?.container?.('crowd:'+a);
  const dbg={asks:0,fails:[],nan:{her:0,cat:0,look:0}};   // nan: times a bad number was caught and reset (should stay 0)
  function ask(){if(clock<asked||!assets?.load)return;asked=clock+20;dbg.asks++;const who=out();for(const a of [CAT,...(who?[who.asset]:[])])if(!has(a))Promise.resolve(assets.load('crowd:'+a,{src:src(a),background:true},scene)).catch(e=>{if(dbg.fails.length<6)dbg.fails.push(a+': '+(e?.message||e));});}
  // ---- the woman who is out ----
  let her=null;   // {p (PAIR entry), node, anim, s (her routine), clip}
  function leave(){if(!her)return;her.anim?.dispose?.();her.node?.dispose?.();her=null;}
  function arrive(p){const node=assets?.instance?.('crowd:'+p.asset,parent);if(!node)return;node.metadata={...node.metadata,character:p.id,streetPair:p.id,displayName:p.name};
   for(const m of node.getChildMeshes(false)){m.isPickable=false;if(m.material&&m.material.maxSimultaneousLights<8)m.material.maxSimultaneousLights=8;}
   her={p,node,anim:null,s:routineStart(p,rnd,cfg),clip:null};lit(node);
   her.anim=root.VoidCrowd?.animate?.(node,p.asset,'walk')||null;her.clip='walk';node.position.set(her.s.x,PAVE,her.s.z);
   for(const g of node.metadata?.animationGroups||[])g.blendingSpeed=cfg.blend;   // a slower cross-fade than the crowd's (about 0.4 s)
   // her V1 (npc-device.js): its own scheduler gives the walking glances; the routine forces a scroll, a selfie or a photo of the cat when she stops
   try{root.VoidNPCDevice?.enlist?.(node,{kind:'walker',state:()=>({moving:her?.s?.mode==='walk'||her?.s?.mode==='run',can:her?.s?.mode==='walk'||her?.s?.mode==='sit'}),
    force:()=>her?.node===node?her.s.device:null,target:()=>cat&&her?.s?.device==='photo'?new B.Vector3(cat.x,PAVE+.15,cat.z):null});}catch{}}
  const SITTING=new Set(['sit','settle','sit-down','stand-up']),MOVING=new Set(['walk','run','to-step','step-off']);
  function herNow(){if(!her?.node)return null;const n=her.node.position;return {x:n.x,z:n.z,sitting:SITTING.has(her.s.mode),moving:MOVING.has(her.s.mode)};}
  // ---- her TALK TO prompt: one interaction per woman, made once; its position follows her figure (mutated in place: no allocation per frame) ----
  const talkItems=Object.fromEntries(PAIR.map(p=>[p.id,{id:talkId(p.id),action:TALK_ACTION,character:p.id,label:'TALK TO '+p.name.toUpperCase(),position:[0,1.6,0],range:2.2,talk:true}]));
  let talkScan=0;
  const wl=()=>typeof walkingLocation!=='undefined'?walkingLocation:null;
  function talkSync(dt,shown){const L=wl();if(!L||!Array.isArray(L.interactions))return;
   if(her&&shown){const p=her.node.getAbsolutePosition(),it=talkItems[her.p.id];it.position[0]=p.x;it.position[2]=p.z;}
   if((talkScan-=dt)>0)return;talkScan=.25;
   const street=L.id==='neochinatown'&&L.area!=='interior'&&L.area!=='milked';
   for(const p of PAIR){const it=talkItems[p.id],want=street&&shown&&her?.p.id===p.id,k=L.interactions.indexOf(it);if(want&&k<0)L.interactions.push(it);else if(!want&&k>=0)L.interactions.splice(k,1);}}
  function talkOff(){const L=wl();if(!L||!Array.isArray(L.interactions))return;for(const p of PAIR){const k=L.interactions.indexOf(talkItems[p.id]);if(k>=0)L.interactions.splice(k,1);}}
  // Is the player talking to her? A conversation is open (in the District it floats over walking: VoidConversationUI.isOpen; else the dialogue mode) and it was opened
  // from her prompt (her prompt was the one selected when it opened; latched until it closes, so walking about during it changes nothing)
  const convo=()=>!!root.VoidConversationUI?.isOpen||(typeof mode!=='undefined'&&mode==='dialogue');let chatSeen=false,chatHer=null;
  function chatting(){if(!convo()){chatSeen=false;chatHer=null;return false;}if(!chatSeen){chatSeen=true;chatHer=her&&typeof walkTarget!=='undefined'&&walkTarget===talkItems[her.p.id]?her.p.id:null;}return !!her&&chatHer===her.p.id;}
  const HOLD=new Set(['walk','run','pause','stop','to-step']),SEATED=new Set(['sit','sit-down','settle']);
  function hold(s,me){if(SEATED.has(s.mode)){if(s.mode==='sit'){s.left=Math.max(s.left,2);if(s.sub==='wave')s.sub=null;}return;}
   if(!HOLD.has(s.mode))return;s.mode='stop';s.sub='chat';s.clip='idle';s.device=null;s.left=Math.max(s.left,1.2);
   if(me){if(!s.face)s.face={x:me.x,z:me.z};else{s.face.x=me.x;s.face.z=me.z;}}}
  function tickHer(dt,c){const want=out();if(her&&(!want||want.id!==her.p.id))leave();if(!her&&want&&has(want.asset))arrive(want);if(!her)return;
   const n=her.node,d=c?Math.hypot(c.x-n.position.x,c.z-n.position.z)*(root.VoidZoom?root.VoidZoom.now():1):0,far=d>cfg.showRadius;if(n.isEnabled()===far)n.setEnabled(!far);
   const me=player(),talking=chatting(),ctx={cat:cat&&!talking?{x:cat.x,z:cat.z}:null,player:me?{x:me.x,z:me.z}:null};
   if(!Number.isFinite(her.s.x+her.s.z+her.s.yaw+(her.s.zo||0))){dbg.nan.her++;her.s=routineStart(her.p,rnd,cfg);}
   if(talking)hold(her.s,me);else if(her.s.sub==='chat'){her.s.sub=null;her.s.face=null;her.s.left=Math.min(her.s.left,1.2);}   // after the conversation: a moment, then on her way
   const s=routineStep(her.s,dt,rnd,cfg,ctx),cz=cfg.clipShift[s.clip]||0;her.cz=(her.cz||0)+(cz-(her.cz||0))*Math.min(1,dt/cfg.seatShift.blendFor*2.5);n.position.set(s.x,PAVE,s.z+(s.zo||0)+her.cz);n.rotation.y=s.yaw;her.anim?.setActive?.(!far&&d<animRadius);
   if(her.anim&&s.clip!==her.clip){her.clip=s.clip;if(s.once&&her.anim.playOnce)her.anim.playOnce(s.clip,s.clip===CLIPS.sitDown?CLIPS.sit:'idle');else her.anim.play(s.clip);}}
  // ---- the cat ----
  let cat=null;   // {node, bones, x, z, yaw, gait, sit, mode, ...}
  const BONES=['Body','Neck','Head','Tail1','Tail2','Tail3','LegFL','LegFR','LegBL','LegBR'];
  function catArrive(){const node=assets?.instance?.('crowd:'+CAT,parent);if(!node)return;node.metadata={...node.metadata,streetCat:true};const bones={};
   for(const t of node.getDescendants(false)){const b=BONES.find(k=>t.name===k||t.name.endsWith('-'+k));if(b&&!bones[b]){if(!t.rotationQuaternion)t.rotationQuaternion=B.Quaternion.FromEulerVector(t.rotation);bones[b]={t,rest:t.rotationQuaternion.clone()};}}
   for(const m of node.getChildMeshes(false)){m.isPickable=false;if(m.material&&m.material.maxSimultaneousLights<8)m.material.maxSimultaneousLights=8;}
   cat={node,bones,x:CAT_HOME.x,z:CAT_HOME.z,yaw:Math.PI,gait:0,sit:0,mode:'home',until:0,lap:0,ang:0,circleLeft:0,playerLeft:0,wander:null,wanderLeft:0,rubbed:false,lastNear:false,tail:0};node.position.set(cat.x,PAVE,cat.z);lit(node);}
  const Q=(b,ax,a)=>B.Quaternion.RotationAxis(ax,a);
  function pose(c,dt,speed){const b=c.bones,X=B.Axis.X,Z=B.Axis.Z,s=c.sit,st=Math.min(1,speed/1.2),sw=Math.sin(c.gait),sw2=Math.sin(c.gait+Math.PI);
   const set=(k,...qs)=>{const o=b[k];if(!o)return;let q=o.rest.clone();for(const x of qs)q=q.multiply(x);o.t.rotationQuaternion.copyFrom(q);};
   const legA=.42*st*(1-s);
   // trot: diagonal pairs together; sitting: the body tips back on its haunches, the hind legs fold under and the front legs stand straight
   set('Body',Q(0,X,-.4*s+Math.sin(c.gait*2)*.025*st));
   set('LegFL',Q(0,X,legA*sw+.4*s));set('LegBR',Q(0,X,legA*sw+1.1*s));set('LegFR',Q(0,X,legA*sw2+.4*s));set('LegBL',Q(0,X,legA*sw2+1.1*s));
   c.tail+=dt*(1.1+st*1.8);const up=c.rub?.35:.12+.18*st;
   set('Tail1',Q(0,X,-up+s*.5),Q(0,Z,Math.sin(c.tail)*.12));set('Tail2',Q(0,Z,Math.sin(c.tail-.7)*(.25+.1*s)));set('Tail3',Q(0,Z,Math.sin(c.tail-1.4)*.35));
   const look=Math.max(-.7,Math.min(.7,c.look||0));set('Neck',Q(0,Z,look*.6),Q(0,X,.05*s));set('Head',Q(0,Z,look*.4),Q(0,X,Math.sin(clock*.8)*.04));
   c.node.position.y=PAVE-.11*s+Math.abs(Math.sin(c.gait))*.008*st;}
  function catGo(c,tx,tz,dt,fast){const dx=tx-c.x,dz=tz-c.z,d=Math.hypot(dx,dz);if(d<.04)return 0;const sp=Math.min(d/dt,fast?cfg.cat.trot:cfg.cat.walk)*(1-c.sit*.95),want=Math.atan2(dx,dz);
   let dy=Math.atan2(Math.sin(want-c.yaw),Math.cos(want-c.yaw));c.yaw+=dy*Math.min(1,dt*cfg.cat.turn);const k=Math.max(0,Math.cos(dy));const step=sp*k*dt;c.x+=Math.sin(c.yaw)*step;c.z+=Math.cos(c.yaw)*step;
   c.z=Math.min(WALL-.12,c.z);c.gait+=step/(fast?.3:.22)*Math.PI*2;return dt>0?step/dt:0;}
  function sitTo(c,v,dt){c.sit+=(v-c.sit)*Math.min(1,dt*(v>c.sit?2.2:4));}
  function tickCat(dt,c0){if(!cat){if(has(CAT))catArrive();if(!cat)return;}const c=cat,n=c.node;if(!Number.isFinite(c.x+c.z+c.yaw+c.sit+c.gait)){dbg.nan.cat++;Object.assign(c,{x:CAT_HOME.x,z:CAT_HOME.z,yaw:Math.PI,sit:0,gait:0,ang:0,mode:'home'});}
   const far=c0?Math.hypot(c0.x-c.x,c0.z-c.z)*(root.VoidZoom?root.VoidZoom.now():1)>cfg.showRadius:false;if(n.isEnabled()===far)n.setEnabled(!far);if(far)return;
   const me=player(),h=herNow(),meP=me?{x:me.x,z:me.z}:null,near=!!meP&&dist(meP,c)<cfg.cat.playerRadius;
   let chance=1;if(near&&!c.lastNear)chance=rnd();c.lastNear=near;
   if(c.mode!=='player'){const t=catTarget({her:h,player:meP,cat:c,clock,until:c.until,chance},cfg.cat);
    if(t.kind==='player'){c.mode='player';c.playerLeft=between(rnd,cfg.cat.playerFor);}else if(t.kind==='her'&&c.mode!=='her'){c.mode='her';c.circleLeft=between(rnd,cfg.cat.circleFor);c.rubbed=false;}else if(t.kind==='home')c.mode='home';}
   let speed=0,sit=0;c.rub=false;
   if(c.mode==='player'){if(!meP){c.mode='home';}else{const d=dist(meP,c);c.look=0;
     if(d>.75){speed=catGo(c,meP.x,meP.z,dt,d>1.6);}else{const want=Math.atan2(meP.x-c.x,meP.z-c.z);c.yaw+=Math.atan2(Math.sin(want-c.yaw),Math.cos(want-c.yaw))*Math.min(1,dt*3);sit=1;c.playerLeft-=dt;}
     if(c.playerLeft<=0||d>cfg.cat.playerRadius*2.5){c.mode='home';c.until=clock+between(rnd,cfg.cat.playerCool);}}}
   else if(c.mode==='her'&&h){const d=dist(h,c);
    if(h.sitting){// beside her, a little toward the road (she sits against the wall)
     const side=c.x<h.x?-1:1,tx=h.x+side*cfg.cat.sitBy,tz=Math.min(WALL-.2,h.z-.2),dd=Math.hypot(tx-c.x,tz-c.z);
     if(!c.rubbed&&d<1.2){// a pass close in front of her knees first, rubbing
      c.ang=(c.ang||Math.atan2(c.x-h.x,c.z-h.z))+dt*1.3;const r=.38,ax=h.x+Math.sin(c.ang)*r,az=Math.min(WALL-.2,h.z-.15+Math.cos(c.ang)*r*.6);speed=catGo(c,ax,az,dt,false);c.rub=true;c.circleLeft-=dt;if(c.circleLeft<=0)c.rubbed=true;}
     else if(dd>.06){speed=catGo(c,tx,tz,dt,dd>1.6);}
     else{const want=Math.atan2(h.x-c.x,h.z-c.z)+side*.9;c.yaw+=Math.atan2(Math.sin(want-c.yaw),Math.cos(want-c.yaw))*Math.min(1,dt*2);sit=1;}}
    else if(h.moving){// at her heel, on the road side (a run leaves it trotting behind)
     c.rubbed=false;c.circleLeft=between(rnd,cfg.cat.circleFor);const yaw=her?.s?.yaw??0,tx=h.x-Math.sin(yaw)*cfg.cat.heel,tz=Math.min(WALL-.2,h.z-.32);const dd=Math.hypot(tx-c.x,tz-c.z);speed=dd>.08?catGo(c,tx,tz,dt,dd>.9):0;}
    else{// she has stopped: round her legs, rubbing, then sit by her feet (a little further off while she dances)
     const dancing=her?.s?.sub==='dance',r0=dancing?.8:cfg.cat.circleR;
     if(d>.9+(dancing?.4:0)&&!c.rubbed){speed=catGo(c,h.x,h.z-.4-(dancing?.4:0),dt,true);}
     else if(c.circleLeft>0&&!dancing){c.ang=(c.ang||Math.atan2(c.x-h.x,c.z-h.z))+dt*1.6;speed=catGo(c,h.x+Math.sin(c.ang)*r0,Math.min(WALL-.2,h.z+Math.cos(c.ang)*r0),dt,false);c.rub=true;c.circleLeft-=dt;if(c.circleLeft<=0)c.rubbed=true;}
     else{const tx=h.x+(dancing?.85:.45),tz=h.z-(dancing?.55:.25),dd=Math.hypot(tx-c.x,tz-c.z);if(dd>.06)speed=catGo(c,tx,tz,dt,false);else sit=1;}}
    const want=Math.atan2(h.x-c.x,h.z-c.z);c.look=Math.atan2(Math.sin(want-c.yaw),Math.cos(want-c.yaw));}
   else{// home: a short wander by the LAUNDRY door, then sits a while
    c.wanderLeft-=dt;if(!c.wander||c.wanderLeft<=0){c.wander={x:CAT_HOME.x+(rnd()-.5)*2*cfg.cat.homeWander,z:Math.min(WALL-.25,CAT_HOME.z-rnd()*.8)};c.wanderLeft=6+rnd()*10;}
    const dd=Math.hypot(c.wander.x-c.x,c.wander.z-c.z);if(dd>.06&&c.wanderLeft>4)speed=catGo(c,c.wander.x,c.wander.z,dt,false);else sit=c.wanderLeft<4?1:0;c.look=Math.sin(clock*.35)*.5;}
   sitTo(c,sit,dt);n.position.x=c.x;n.position.z=c.z;n.rotation.y=c.yaw;if(c0&&Math.hypot(c0.x-c.x,c0.z-c.z)>animRadius)return;pose(c,dt,speed);}
  // ---- the glance (head and neck toward the nearest player in front of her), applied after the clip each frame and taken off before the next ----
  const lk={w:0,yaw:0,pitch:0,applied:new Map(),bones:null,node:null,eyes:[],scan:0},qT=new B.Quaternion(),MI=new B.Matrix(),ID=B.Quaternion.Identity();
  function lookBones(node){const out={};for(const t of node.getDescendants(false))for(const n of ['Neck','Head'])if(!out[n]&&/mixamorig:/.test(t.name)&&t.name.endsWith(':'+n)){if(!t.rotationQuaternion)t.rotationQuaternion=B.Quaternion.FromEulerVector(t.rotation);out[n]=t;}return out.Head&&out.Neck?out:null;}
  function lookUndo(){for(const [b,q] of lk.applied){if(b.isDisposed?.())continue;q.conjugateToRef(qT);qT.multiplyToRef(b.rotationQuaternion,qT);b.rotationQuaternion.copyFrom(qT);}lk.applied.clear();}
  function lookEyes(){const c=scene.activeCamera;lk.eyes.length=0;if(c)lk.eyes.push(c.globalPosition);
   if((lk.scan-=1)<=0){lk.scan=30;lk.remote=scene.transformNodes.filter(n=>/^remote-player:/.test(n.name)&&!n.isDisposed());}   // other players (cheap: a scan twice a second)
   for(const n of lk.remote||[]){if(n.isDisposed()||!n.isEnabled())continue;const p=n.getAbsolutePosition();lk.eyes.push({x:p.x,y:p.y+1.6,z:p.z});}}
  function lookApply(dt){if(!her?.node||!her.node.isEnabled()){lk.w=0;return;}if(lk.node!==her.node){lk.node=her.node;lk.bones=lookBones(her.node);lk.w=0;}if(!lk.bones)return;
   const head=lk.bones.Head;head.computeWorldMatrix(true);const hp=head.getAbsolutePosition(),n=her.node.position;lookEyes();
   if(!Number.isFinite(hp.x+hp.y+hp.z)){dbg.nan.look++;lk.w=0;return;}
   const t=canLook(her.s)?lookAt({x:n.x,z:n.z,yaw:her.node.rotation.y},hp,lk.eyes,cfg.look):null;
   const k=Math.min(1,dt/cfg.look.blend);lk.w=Math.max(0,Math.min(1,lk.w+(t?k:-k)));if(t){lk.yaw+=(t.yaw-lk.yaw)*Math.min(1,dt*6);lk.pitch+=(t.pitch-lk.pitch)*Math.min(1,dt*6);}
   if(!Number.isFinite(lk.yaw+lk.pitch)){dbg.nan.look++;lk.yaw=lk.pitch=0;lk.w=0;}lk.debug={on:!!t,w:+lk.w.toFixed(2),yaw:+(lk.yaw*180/Math.PI).toFixed(1),pitch:+(lk.pitch*180/Math.PI).toFixed(1)};if(lk.w<.005)return;
   // turn the head's forward (+Z of a Mixamo head) toward body yaw + yaw, pitch: the neck takes its share, the head the rest
   const yw=her.node.rotation.y+lk.yaw*lk.w,pt=lk.pitch*lk.w,want=new B.Vector3(Math.sin(yw)*Math.cos(pt),Math.sin(pt),Math.cos(yw)*Math.cos(pt));let done=0;
   for(const [name,share] of [['Neck',cfg.look.neck],['Head',1]]){const b=lk.bones[name];if(!b?.parent)continue;const frac=(share-done)/(1-done);done=share;
    head.computeWorldMatrix(true);const fw=B.Vector3.TransformNormal(B.Axis.Z,head.getWorldMatrix()).normalize();b.parent.computeWorldMatrix(true);b.parent.getWorldMatrix().invertToRef(MI);
    const fp=B.Vector3.TransformNormal(fw,MI).normalize(),wp=B.Vector3.TransformNormal(want,MI).normalize(),Q=new B.Quaternion();B.Quaternion.FromUnitVectorsToRef(fp,wp,Q);const d=B.Quaternion.Slerp(ID,Q,frac);if(!Number.isFinite(d.x+d.y+d.z+d.w)){dbg.nan.look++;continue;}
    d.multiplyToRef(b.rotationQuaternion,qT);b.rotationQuaternion.copyFrom(qT);b.computeWorldMatrix(true);const prev=lk.applied.get(b);lk.applied.set(b,prev?d.multiply(prev):d);}}
  let lookClock=performance.now();
  const lookBefore=scene.onBeforeAnimationsObservable.add(()=>{try{lookUndo();}catch{lk.applied.clear();}});
  const lookAfter=scene.onAfterAnimationsObservable.add(()=>{const t=performance.now(),dt=Math.min(.1,(t-lookClock)/1000);lookClock=t;try{lookApply(dt);}catch(e){lk.bones=null;}});
  // A small warm light from the shop windows on whoever is out and the cat (Medium and up; it lights only them: the pavement is untouched). Low: none.
  const lamp=quality==='low'?null:new B.PointLight('street-pair-lamp',new B.Vector3(SEAT.x,PAVE+1.92,WALL-1.05),scene);if(lamp){lamp.parent=parent;lamp.diffuse=B.Color3.FromHexString('#ffd2a8');lamp.specular=B.Color3.FromHexString('#ffb48a').scale(.4);lamp.intensity=16;lamp.range=7;lamp.includedOnlyMeshes=[];owned.push(lamp);}
  function lit(n){if(!lamp||!n)return;for(const m of n.getChildMeshes(false))if(!lamp.includedOnlyMeshes.includes(m))lamp.includedOnlyMeshes.push(m);lamp.includedOnlyMeshes=lamp.includedOnlyMeshes;}
  function lampTo(){if(!lamp)return;const h=herNow(),c=cat;const x=h?h.x:c?c.x:SEAT.x,z=Math.min(WALL-1.05,(h?h.z:c?c.z:SEAT.z)-1.05);lamp.position.x+=(x-lamp.position.x)*.1;lamp.position.z+=(z-lamp.position.z)*.1;}   // a little in front of her (toward the road), so her face is lit wherever she walks
  function tick(dt){if(disposed)return;clock+=dt;if(clock>3&&typeof mode!=='undefined'&&mode==='walking')ask();const c=cam();tickHer(dt,c);talkSync(dt,!!her&&her.node.isEnabled());tickCat(dt,c);lampTo();}
  return {tick,stats:()=>({pave:+PAVE.toFixed(3),asks:dbg.asks,fails:dbg.fails.slice(),nan:{...dbg.nan},clock:+clock.toFixed(1),onShift:onShift(now()).id,onStreet:out()?.id||null,talk:her&&wl()?.interactions?.includes(talkItems[her.p.id])?{id:talkItems[her.p.id].id,label:talkItems[her.p.id].label,x:talkItems[her.p.id].position[0],z:talkItems[her.p.id].position[2]}:null,chat:chatting(),her:her?{id:her.p.id,mode:her.s.mode,sub:her.s.sub||null,clip:her.clip||null,device:her.s.device||null,x:her.node.position.x,z:her.node.position.z}:null,cat:cat?{mode:cat.mode,x:cat.x,z:cat.z,sit:+cat.sit.toFixed(2),bones:Object.keys(cat.bones).length}:null,look:lk.debug||null}),
   get her(){return her;},get cat(){return cat;},setClock(fn){now=fn||clockFn;asked=-1;},talkItems,
   dispose(){disposed=true;talkOff();scene.onBeforeAnimationsObservable.remove(lookBefore);scene.onAfterAnimationsObservable.remove(lookAfter);lookUndo();leave();cat?.node?.dispose?.();cat=null;for(const o of owned)o.dispose?.();}};
 }
 root.VoidStreetPair={...api,start,force:null};
 // TALK TO REVERIE / LACE with no mission waiting: her greeting (live-content.js offers a Mission Editor mission first). Name cards for the dialogue window.
 const wait=setInterval(()=>{if(typeof VoidInteractions==='undefined'||!VoidInteractions.register||typeof talk!=='function')return;clearInterval(wait);
  const chars=root.VoidStoryContent?.characters;if(chars)for(const p of PAIR)if(!chars[p.id])chars[p.id]={id:p.id,name:p.name,role:'',portrait:'art/characters.png',cell:'0% 0%',faction:'independent',tags:['street'],biography:'',relationshipDefault:0};
  VoidInteractions.register(TALK_ACTION,({item}={})=>{const p=PAIR.find(x=>x.id===item?.character)||PAIR[0];talk('',(GREETING[p.id]||['Hi.']).map(text=>({who:p.id,text})),()=>{try{resumeWalking();}catch{}},'CLOSE');});},300);
})(typeof globalThis!=='undefined'?globalThis:this);
