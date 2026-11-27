/* Shared humanoid movement and seating helpers, and the Avenue street cat runtime. */
(function(root){
 'use strict';
 /* THE CAT AS AN NPC AND GIVER (the owner, 18 Nov 2026: "add the cat as an npc and giver"): id CAT_ID; out whenever the street is (it lives there, day and night). A PET THE
    CAT prompt follows it (action CAT_ACTION); a Mission Editor mission it gives is offered first (live-content.js), else CAT_REACTION (text only, no voice, no lore). While
    the player pets it, it comes to them and sits looking up (its own procedural pose: the cat has no clips). The NPCs tab can give it a plan (CAT_ACTS: npc-paths.js). */
 const CAT_ID='street-cat',CAT_ACTION='street-cat',CAT_REACTION=['The cat looks up at you.'];
 // The clip library both of them carry (crowd.js lists it per file; tools/animation-pipeline/characters/npc-*.json build it). Casual street clips only.
 const CLIPS={idles:['idle','idle-shift','idle-stretch'],look:['look','watch'],walk:'walk',run:'run',sitDown:'sit-enter',sit:'sit',standUp:'sit-exit',wave:'sit-wave',
  dances:['dance-groove','dance-bop'],talk:['talk','gesture'],shrug:'shrug',floor:['floor-kneel','floor-cross','floor-knees'],
  floorMoves:['kneel','cross','knees'].flatMap(p=>['floor-'+p+'-down','floor-'+p+'-up']).concat(['cross','knees'].flatMap(p=>['floor-'+p+'-down-hi','floor-'+p+'-up-hi']))};   // floor: the floor poses (21 Nov 2026, posed by code: make_floor_poses.py), at a cushion, a cot or a bench
 const CLIP_LIST=[...CLIPS.idles,...CLIPS.look,CLIPS.walk,CLIPS.run,CLIPS.sitDown,CLIPS.sit,CLIPS.standUp,CLIPS.wave,...CLIPS.dances,...CLIPS.talk,CLIPS.shrug,...CLIPS.floor,...CLIPS.floorMoves];   // floorMoves: sitting down to a floor pose and standing up from it (21 Nov 2026)
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
 let skew=null;
 const streetTime=(ms=Date.now())=>skew===null?ms:ms+skew,simulated=()=>skew!==null;
 function simulate(ms,real=Date.now()){skew=Number.isFinite(ms)?ms-real:null;return simulated();}
 const pad2=n=>String(n).padStart(2,'0'),utcLabel=ms=>{const d=new Date(ms);return pad2(d.getUTCHours())+':'+pad2(d.getUTCMinutes());};
 const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
 /* Whom the cat goes to. her: {x, z, sitting, moving} of the one who is out, or null; player: {x, z} or null; cat: {x, z}; clock: seconds; until: the time
    before which the cat will not go to a player again (its cool-down); rnd(): a fresh chance each time a player comes into range (pass 0 to always go).
    Returns {kind: 'player' | 'her' | 'home', x, z}. */
 function catTarget({player=null,cat=null,clock=0,until=0,chance=0},cfg=config.cat){
  if(player&&cat&&clock>=until&&dist(player,cat)<cfg.playerRadius&&chance<cfg.playerChance)return {kind:'player',x:player.x,z:player.z};

  return {kind:'home',x:CAT_HOME.x,z:CAT_HOME.z};}
 /* The routine, one step. s: {who, mode, x, z, dir, left, step, yaw, clip, once, device}. ctx: {cat: {x, z} or null, player: {x, z} or null}.
    Returns the same object, changed: `clip` the clip to play (`once`: a transition played once), `device` an npc-device.js pose to hold or null, `face` a point
    she turns to (the cat) or null.
    walk -> (a turn: pause) | run | stop (idle, look, V1, selfie; with the cat near: talk to it, photograph it, dance) | to-step -> settle -> sit-down -> sit
    -> stand-up -> step-off -> walk */
 const between=(r,[a,b])=>a+r()*(b-a),pick=(r,l)=>l[Math.min(l.length-1,Math.floor(r()*l.length))];
 function routineStart(p={},rnd=Math.random,cfg=config){const x=between(rnd,[STRETCH.x0+3,STRETCH.x1-3]);return {who:p.id,favourite:p.favourite||null,mode:'walk',x,z:STRETCH.z,dir:rnd()<.5?1:-1,left:between(rnd,cfg.walk),step:null,yaw:0,clip:'walk',once:false,device:null,face:null,sub:null};}
 // the sit clip puts the hips 0.35 m behind the figure's origin (its feet) and 0.65 m up: so she stands that far in front of the ledge's middle
 const seatOf=st=>st.z-.36,frontOf=st=>seatOf(st)-.05;   // the figure's origin while seated (hips over the ledge's middle), and where she stands to sit down
 /* SEATS THAT FACE ANY WAY (20 Nov 2026: the underground alcoves' benches and crates, ncz-underground.js SEATS {id, x, z (the seat's middle), yaw (the way a sitter faces)}).
    The same sit-down / sit / stand-up as at the ledges, measured along the way the seat faces: along(st, d) is the point d metres in front of the seat's middle.
    A ledge (no yaw) faces the road (-z): exactly the numbers above. */
 const SEAT_BACK=.36,SEAT_FRONT=.41,STEP_OFF=.71;
 /* How far in front of the seat's middle the figure's origin is while seated: Reverie's and Lace's sit clip puts the hips 0.36 m behind the feet; the street figures'
    (made givers on a street model) only about 0.08 m, so their runtime sets s.seatBack (npc-made.js SEAT_BACK_STREET) or they float in front of the seat. */
 /* A seat may set its own `back` (21 Nov 2026, the mahjong stools: measured in the game, every figure's sit clip puts the hips 0.36 to 0.38 m behind its origin, so on a
    0.34 m stool the origin goes 0.37 m in front of the stool's middle; the benches keep the numbers above, the hips against the backrest). */
 const backOf=s=>Number.isFinite(s&&s.step&&s.step.back)?s.step.back:Number.isFinite(s&&s.seatBack)?s.seatBack:SEAT_BACK;
 const seatYaw=st=>Number.isFinite(st&&st.yaw)?st.yaw:Math.PI;
 const along=(st,d)=>Number.isFinite(st.yaw)?{x:st.x+Math.sin(st.yaw)*d,z:st.z+Math.cos(st.yaw)*d}:{x:st.x,z:st.z-d};
 const UGS=()=>{try{return (typeof module==='object'&&module.exports?require('./ncz-underground.js'):root.VoidUnderground)||null;}catch{return null;}};
 /* Every seat other than the Avenue's ledges: [{id, x, z, yaw, h}] (the tunnels' alcoves). */
 function seats(){const U=UGS();return ((U&&(U.seatsAll?U.seatsAll():U.SEATS))||[]).map(x=>({id:x.id,x:x.x,z:x.z,yaw:x.yaw,h:x.h,w:.5,poses:x.poses||['chair'],stand:x.stand||null,...(Number.isFinite(x.back)?{back:x.back}:{})}));}
 /* THE FLOOR POSES (21 Nov 2026: kneeling, cross-legged, knees to chest; crowd.js FLOOR): a seat's `poses` say which it takes ('chair': the sit-down clips; ledges are
    chairs only). POSE_CLIP: pose -> clip; FLOOR_BACK: how far behind the seat's middle the figure's origin (under her hips) goes, so the body sits on the cushion / cot.
    standOf(seat): where one stands before sitting: the seat's own `stand`, else 0.41 m in front of a chair, else the seat itself. */
 const POSES=['chair','kneel','cross','knees'],POSE_CLIP={chair:'sit',kneel:'floor-kneel',cross:'floor-cross',knees:'floor-knees'},FLOOR_BACK={kneel:.12,cross:.06,knees:.16};
 const POSE_NAME={chair:'chair (sit on it)',kneel:'kneel (seiza)',cross:'cross-legged',knees:'knees to chest'};
 /* SITTING DOWN AND STANDING UP AT A FLOOR SEAT (21 Nov 2026, the owner asked for a proper standing-up animation; a matching sit-down): one-shot clips posed by code
    (tools/animation-pipeline/make_floor_poses.py TRANS / MOVES, the same numbers): floor-<pose>-down ends on the loop's first frame, floor-<pose>-up starts on it and ends
    on the figure's idle. The figure starts standing at S, d metres in front of the loop's origin (negative: behind it; kneeling goes down forward), and hb below the
    seat's top; over the clip its origin moves from S to the loop's origin and up by hb with r = smoothstep(k) (backwards for -up), and the clip's hips carry the
    opposite, so a foot on the floor stays put: the figure's lift is h - hb*(1-r). Low seats (the cushions, up to 0.27 m with the dais): hb 0, she steps onto the
    cushion first (the lift eases up over the last 0.3 m). Raised seats (above RAISED: the cots, the alcove benches) use the '-hi' clips: on the floor in front of the
    edge, sit on it, legs up, push back. A figure without the clips: the cross-fade as before (FLOOR_BACK, liftTo). */
 const FLOOR_MOVE={kneel:{d:-.08,hb:0,down:1.8,up:1.6},cross:{d:.18,hb:0,down:1.6,up:1.5},knees:{d:.32,hb:0,down:1.5,up:1.4},'cross-hi':{d:.74,hb:.45,down:2,up:1.8},'knees-hi':{d:.84,hb:.45,down:1.9,up:1.7}};
 const RAISED=.35,STEP_ON=.3,smooth01=k=>k<=0?0:k>=1?1:k*k*(3-2*k);
 /* the lift follows where it should be at most 0.6 m/s (a step up or down, never a jump) */
 const liftToward=(s,want,dt)=>{const l=s.lift||0,m=.6*dt;s.lift=Math.abs(want-l)<=m?want:l+Math.sign(want-l)*m;s.liftTo=null;};
 const moveOf=s=>{const st=s&&s.step;if(!st||!s.pose||s.pose==='chair')return null;const k=s.pose+(Number.isFinite(st.h)&&st.h>RAISED?'-hi':'');return FLOOR_MOVE[k]?k:null;};
 /* floorClip(s, 'down' | 'up'): the clip name for her seat and pose, or null (kneeling on a raised seat: none; no seat takes it) */
 const floorClip=(s,dir)=>{const k=moveOf(s);return k?'floor-'+s.pose+'-'+dir+(k.endsWith('-hi')?'-hi':''):null;};
 /* Does she sit down / stand up with the clips? (ctx.has: the figure's clip list; tests and the runtimes pass it) */
 const floorFx=(s,ctx)=>{if(!floorPose(s)||!ctx||typeof ctx.has!=='function')return false;const a=floorClip(s,'down'),b=floorClip(s,'up');return !!(a&&b&&ctx.has(a)&&ctx.has(b));};
 /* S: where she stands before sitting down and after standing up; the lift standing there (the cushion's top; the floor in front of a cot or bench) */
 const floorStart=s=>{const m=FLOOR_MOVE[moveOf(s)];return along(s.step,-(FLOOR_BACK[s.pose]||0)+m.d);};
 const floorRest=s=>Math.max(0,(s.step.h||0)-FLOOR_MOVE[moveOf(s)].hb);
 /* during the clip: k 0..1 through it, r = how far down (0 standing at S, 1 seated): where her origin is and how high */
 function floorAt(s,r){const m=FLOOR_MOVE[moveOf(s)],o=along(s.step,-(FLOOR_BACK[s.pose]||0)+m.d*(1-r));s.x=o.x;s.z=o.z;s.lift=(s.step.h||0)-m.hb*(1-r);s.liftTo=null;}
 const floorPose=s=>!!(s&&s.step&&s.pose&&s.pose!=='chair'&&POSE_CLIP[s.pose]);
 const posesOf=st=>st&&Array.isArray(st.poses)?st.poses:['chair'];
 const standOf=st=>st&&Array.isArray(st.stand)?{x:st.stand[0],z:st.stand[1]}:posesOf(st).includes('chair')?along(st,SEAT_FRONT):{x:st.x,z:st.z};
 /* The ledge or seat a spot is in front of (to sit on), or null: a ledge as before; a seat when the spot is within 0.6 m of where one stands to sit on it. */
 function seatNear(t,pose){if(!t)return null;if(!pose||pose==='chair')for(const st of STEPS)if(Math.abs(t.x-st.x)<=st.w/2+.3&&t.z>=frontOf(st)-1)return st;let best=null,bd=.6+1e-6;
  for(const st of seats()){if(pose&&!posesOf(st).includes(pose))continue;const f=standOf(st),d=Math.hypot(t.x-f.x,t.z-f.z);if(d<=bd){bd=d;best=st;}}return best;}   // the nearest seat whose stand point is within 0.6 m (pose: only seats that take it)
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
 /* THE EDITOR'S PLAN (Developer Tools > NPCs and a mission's "Giver waits at", npc-paths.js planNow): ctx.plan {key, mode:'stay', x, z, yaw, actions} or {key, mode:'path',
    points:[{x, z, action, seconds}]}. She walks there (mode plan-go), does the action (plan-do: a clip, a V1 pose, or the ledge's sit through the usual sit-down / sit /
    stand-up), then the next action (stay) or the next point (path, round and round). A conversation still stops her (hold); once the plan is gone she walks back to her
    stretch on foot (never a jump). ACT: an action id -> {clip, device, sit}. */
 const ACT={wait:{clip:'idle'},idle:{clip:'idle'},scroll:{clip:'idle',device:'scroll'},selfie:{clip:'idle',device:'selfie'},photo:{clip:'idle',device:'photo'},sit:{sit:true},'sit-wave':{sit:true,pose:'chair'},'sit-kneel':{sit:true,pose:'kneel'},'sit-cross':{sit:true,pose:'cross'},'sit-knees':{sit:true,pose:'knees'},'walk-on':{clip:'walk',pass:true},work:{clip:'interact'}};
 const actOf=a=>ACT[a]||{clip:a};
 const FREE=new Set(['walk','run','pause','stop']),PLAN=new Set(['plan-go','plan-do','esc']);   // esc: a mission's follow / lead / cab step (npc-escort.js; run in start())
 function planTarget(s,P){if(P.mode==='stay')return P;const n=P.points.length;s.pi=((s.pi||0)%n+n)%n;return P.points[s.pi];}
 const ledgeNear=seatNear;
 /* The seated figure's eased offset (zo, and a clip's own shift) as world x / z: back from the way the seat faces (a ledge: +z, as before). */
 const seatOffset=(s,off)=>{const st=s&&s.step;if(!off||!st||!Number.isFinite(st.yaw))return {x:0,z:off||0};return {x:-Math.sin(st.yaw)*off,z:-Math.cos(st.yaw)*off};};
 function planNext(s,P){if(P.mode==='path')s.pi=((s.pi||0)+1)%P.points.length;}
 function planDo(s,P,rnd,cfg){const t=planTarget(s,P),a=P.mode==='stay'?pick(rnd,P.actions&&P.actions.length?P.actions:['idle']):t.action,A=actOf(a);s.pact=a;
  if(A.sit){const st=ledgeNear(t,A.pose||'chair');if(st){s.step=st;s.pose=A.pose||'chair';s.mode='to-step';s.psit=true;s.psec=P.mode==='path'?t.seconds:null;s.psecSet=false;s.device=null;s.face=null;return;}}
  if(A.pass){planNext(s,P);s.mode='plan-go';return;}
  s.mode='plan-do';s.clip=A.clip;s.device=A.device||null;s.face=null;s.sub=null;const st=cfg.stop;
  s.left=P.mode==='path'?Math.max(1,t.seconds||5):between(rnd,a==='scroll'?st.device:(a==='selfie'||a==='photo')?st.selfie:/^dance/.test(a)?st.dance:/^(talk|gesture)/.test(a)?st.talk:a==='shrug'?st.shrug:a==='look'||a==='watch'?st.look:st.idle);}
 function itineraryTarget(s,P,target){
  if(!P.crossings||s.itineraryDone)return target;
  if(s.itineraryRoute===undefined){
   const A=root.VoidNPCAreas,E=root.VoidNPCEscort,M=root.VoidNPCPaths?.MOVABLE?.[s.who];
   const permissions={adult:!!M?.adult,made:!!M?.made};
   s.itineraryRoute=A&&!A.leg(s,target,permissions).length?[]:E?.walkRoute(s,target,P.area,permissions)||null;
  }
  while(s.itineraryRoute?.length&&Math.hypot(s.x-s.itineraryRoute[0].x,s.z-s.itineraryRoute[0].z)<.08)s.itineraryRoute.shift();
  if(s.itineraryRoute===null)return null;
  if(s.itineraryRoute.length>1)return s.itineraryRoute[0];
  s.itineraryDone=true;return target;
 }
 function planStep(s,dt,rnd,cfg,P){
  if(s.planKey!==P.key){s.planKey=P.key;s.pi=0;s.psit=false;s.itineraryRoute=undefined;s.itineraryDone=false;if(PLAN.has(s.mode)||FREE.has(s.mode)){s.mode='plan-go';s.device=null;s.sub=null;}}
  if(s.psit&&s.mode==='walk'){s.psit=false;planNext(s,P);s.mode='plan-go';}   // back on her feet after sitting at a point
  if(FREE.has(s.mode)&&s.sub!=='chat')s.mode='plan-go';
  if(s.mode==='plan-go'){const final=planTarget(s,P),t=itineraryTarget(s,P,final);if(!t){s.clip='idle';return true;}const v=cfg.speed*dt,dx=t.x-s.x,dz=t.z-s.z,d=Math.hypot(dx,dz);s.clip='walk';s.device=null;s.face=null;s.once=false;
   if(d<=v+.02){s.x=t.x;s.z=t.z;if(t===final)planDo(s,P,rnd,cfg);}else{s.x+=dx/d*v;s.z+=dz/d*v;s.yaw=Math.atan2(dx,dz);}return true;}
  if(s.mode==='plan-do'){s.left-=dt;s.once=false;const want=P.mode==='stay'&&Number.isFinite(P.yaw)?P.yaw:s.yaw,dy=Math.atan2(Math.sin(want-s.yaw),Math.cos(want-s.yaw));s.yaw+=dy*Math.min(1,dt*3);
   if(s.left<=0){if(P.mode==='path'){planNext(s,P);s.mode='plan-go';}else planDo(s,P,rnd,cfg);}return true;}
  if(s.mode==='sit'&&s.psec&&!s.psecSet){s.left=Math.max(2,s.psec);s.psecSet=true;}   // a path point's seconds of sitting
  return false;}   // sitting at a point, or held for a conversation: the ordinary steps below
 function routineStep(s,dt,rnd=Math.random,cfg=config,ctx={}){
  if(s.liftTo!=null){const k=Math.min(1,dt*3.5);s.lift=(s.lift||0)+(s.liftTo-(s.lift||0))*k;if(Math.abs(s.lift-s.liftTo)<.002){s.lift=s.liftTo;if(!s.lift){s.lift=0;s.liftTo=null;}}}   // the lift eases (a floor seat: up onto it, down off it)
  if(ctx.plan&&planStep(s,dt,rnd,cfg,ctx.plan))return s;
  if(!ctx.plan&&(PLAN.has(s.mode)||s.planKey)){s.planKey=null;s.psit=false;if(PLAN.has(s.mode)){s.mode='walk';s.clip='walk';s.device=null;s.left=between(rnd,cfg.walk);}}
  s.left-=dt;s.once=false;
  // off her stretch (the editor's plan took her elsewhere): she walks back to it rather than being put back
  const clampEnds=()=>{if(s.x>STRETCH.x1+.6||s.x>STRETCH.x1&&s.dir<0){s.dir=-1;return false;}if(s.x<STRETCH.x0-.6||s.x<STRETCH.x0&&s.dir>0){s.dir=1;return false;}if(s.x>STRETCH.x1||s.x<STRETCH.x0){s.x=Math.max(STRETCH.x0,Math.min(STRETCH.x1,s.x));s.dir*=-1;return true;}return false;};
  const toWalk=()=>{s.mode='walk';s.clip='walk';s.device=null;s.face=null;s.sub=null;s.after=null;s.left=between(rnd,cfg.walk);};
  if(s.mode==='walk'||s.mode==='run'){const run=s.mode==='run',v=(run?cfg.run:cfg.speed)*dt;s.x+=s.dir*v;s.z+=(STRETCH.z-s.z)*Math.min(1,dt*2);s.yaw=s.dir>0?Math.PI/2:-Math.PI/2;s.clip=run?'run':'walk';s.device=null;s.face=null;
   if(clampEnds()){if(run)toWalk();else if(rnd()<cfg.pauseShare){s.mode='pause';s.left=between(rnd,cfg.pause);s.clip=pick(rnd,CLIPS.look);}return s;}
   if(s.left<=0&&(s.x>STRETCH.x1+.6||s.x<STRETCH.x0-.6)){s.left=2;return s;}   // still walking back to her stretch
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
  if(s.mode==='to-step'){const fx=floorFx(s,ctx)&&!Array.isArray(s.step.stand),v=cfg.speed*dt,f=fx?floorStart(s):Number.isFinite(s.step.yaw)?standOf(s.step):along(s.step,SEAT_FRONT),tx=f.x,tz=f.z,dx=tx-s.x,dz=tz-s.z,d=Math.hypot(dx,dz);s.clip='walk';
   if(fx)liftToward(s,floorRest(s)*smooth01(1-(d-.05)/STEP_ON),dt);   // onto the cushion as she reaches it
   if(d<=v+.02){s.x=tx;s.z=tz;const side=!floorPose(s)&&Array.isArray(s.step.stand);s.mode=floorPose(s)?'floor-in':side?'chair-in':'settle';s.left=1.1;s.clip=floorPose(s)||side?'walk':'idle';}else{s.x+=dx/d*v;s.z+=dz/d*v;s.yaw=Math.atan2(dx,dz);}return s;}
  // THE FLOOR POSES: step onto the cushion / cot, turn to face the way the seat does, and the pose takes over (no sit-down clip); `lift` raises the figure to the seat's
  // top (eased, the runtimes add it to the ground's height); getting up: back down and out to the stand point, then walk on
  // a chair one reaches from the side (the mahjong stools: the table leaves no room to stand in front until one is there): step round in front of it, then sit as usual
  if(s.mode==='chair-in'){const v=cfg.speed*.7*dt,o=along(s.step,SEAT_FRONT),dx=o.x-s.x,dz=o.z-s.z,d=Math.hypot(dx,dz);s.clip='walk';
   if(d<=v+.02){s.x=o.x;s.z=o.z;s.mode='settle';s.left=1.1;s.clip='idle';}else{s.x+=dx/d*v;s.z+=dz/d*v;s.yaw=Math.atan2(dx,dz);}return s;}
  if(s.mode==='floor-in'){const fx=floorFx(s,ctx),v=cfg.speed*.7*dt,o=fx?floorStart(s):along(s.step,-(FLOOR_BACK[s.pose]||0)),dx=o.x-s.x,dz=o.z-s.z,d=Math.hypot(dx,dz);s.clip='walk';s.device=null;
   if(fx&&Array.isArray(s.step.stand)){const f=standOf(s.step);liftToward(s,floorRest(s)*smooth01(Math.hypot(s.x-f.x,s.z-f.z)/STEP_ON),dt);}else if(fx)liftToward(s,floorRest(s),dt);   // up onto the dais / cushion over the first 0.3 m from the stand point
   if(d<=v+.02){s.x=o.x;s.z=o.z;s.mode='floor-turn';s.left=1;s.clip='idle';}else{s.x+=dx/d*v;s.z+=dz/d*v;s.yaw=Math.atan2(dx,dz);}return s;}
  if(s.mode==='floor-turn'){const want=seatYaw(s.step),dy=Math.atan2(Math.sin(want-s.yaw),Math.cos(want-s.yaw));s.yaw+=dy*Math.min(1,dt*6);s.clip='idle';
   const fxl=floorFx(s,ctx);if(fxl)liftToward(s,floorRest(s),dt);   // up on the cushion before she sits down
   if((s.left<=0||Math.abs(dy)<.05)&&(!fxl||Math.abs((s.lift||0)-floorRest(s))<1e-6||s.left<-1)){s.yaw=want;s.device=null;s.sub=null;s.waved=true;
    if(fxl){const m=FLOOR_MOVE[moveOf(s)];s.mode='floor-down';s.clip=floorClip(s,'down');s.once=true;s.after=POSE_CLIP[s.pose];s.left=m.down;floorAt(s,0);return s;}   // the sit-down clip, then the pose
    s.mode='sit';s.clip=POSE_CLIP[s.pose];s.liftTo=Number.isFinite(s.step.h)?s.step.h:0;s.left=between(rnd,cfg.sit);}return s;}
  if(s.mode==='floor-down'){const m=FLOOR_MOVE[moveOf(s)];if(!m){s.mode='floor-out';s.left=0;return s;}s.clip=floorClip(s,'down');s.device=null;floorAt(s,smooth01(1-Math.max(0,s.left)/m.down));
   if(s.left<=0){floorAt(s,1);s.mode='sit';s.clip=POSE_CLIP[s.pose];s.after=null;s.left=between(rnd,cfg.sit);}return s;}
  if(s.mode==='sit'&&floorPose(s)){s.clip=POSE_CLIP[s.pose];s.device=null;if(s.left<=0){
    if(floorFx(s,ctx)){const m=FLOOR_MOVE[moveOf(s)];s.mode='floor-up';s.clip=floorClip(s,'up');s.once=true;s.after='idle';s.left=m.up;floorAt(s,1);return s;}   // the stand-up clip, then she walks off
    s.mode='floor-out';s.liftTo=0;s.clip='idle';s.left=.5;}return s;}
  if(s.mode==='floor-up'){const m=FLOOR_MOVE[moveOf(s)];if(!m){s.mode='floor-out';s.left=0;return s;}s.clip=floorClip(s,'up');s.device=null;floorAt(s,1-smooth01(1-Math.max(0,s.left)/m.up));
   if(s.left<=0){floorAt(s,0);s.after=null;s.mode='floor-out';s.fx=true;s.left=0;s.clip='walk';}return s;}
  if(s.mode==='floor-out'&&s.fx){// off the seat after the stand-up clip: out to the stand point (the dais, a cot, a bench), or straight on from a cushion, stepping down
   const st=s.step,h0=floorRest(s),done=()=>{s.step=null;s.pose=null;s.fx=false;s.liftTo=s.lift?0:null;if(!s.lift)s.lift=0;toWalk();};s.clip='walk';
   if(!Array.isArray(st.stand)){done();return s;}
   const v=cfg.speed*.7*dt,f=standOf(st),dx=f.x-s.x,dz=f.z-s.z,d=Math.hypot(dx,dz);liftToward(s,h0*smooth01(d/STEP_ON),dt);
   if(d<=v+.02&&!(s.lift>0)){s.x=f.x;s.z=f.z;s.lift=0;done();}else if(d<=v+.02){s.x=f.x;s.z=f.z;}else{s.x+=dx/d*v;s.z+=dz/d*v;const want=Math.atan2(dx,dz),dy=Math.atan2(Math.sin(want-s.yaw),Math.cos(want-s.yaw));s.yaw+=dy*Math.min(1,dt*8);}return s;}
  if(s.mode==='floor-out'){s.clip=s.left>0?'idle':'walk';if(s.left>0)return s;const v=cfg.speed*.7*dt,f=standOf(s.step),dx=f.x-s.x,dz=f.z-s.z,d=Math.hypot(dx,dz);
   if(d<=v+.02){s.x=f.x;s.z=f.z;s.step=null;s.pose=null;s.lift=0;s.liftTo=null;toWalk();}else{s.x+=dx/d*v;s.z+=dz/d*v;s.yaw=Math.atan2(dx,dz);}return s;}
  if(s.mode==='settle'){// turn to face the road, then sit down through the transition clip
   const want=seatYaw(s.step),dy=Math.atan2(Math.sin(want-s.yaw),Math.cos(want-s.yaw));s.yaw+=dy*Math.min(1,dt*5);s.clip='idle';
   if(s.left<=0||Math.abs(dy)<.06){s.yaw=want;s.mode='sit-down';s.left=cfg.len['sit-enter'];s.clip=CLIPS.sitDown;s.once=true;s.z0=s.z;s.sa0=SEAT_FRONT;}return s;}
  const sh=cfg.seatShift,ease=()=>{if(!s.zo)return;s.zoLeft-=dt;s.zo=s.zoLeft<=0?0:s.zo0*s.zoLeft/sh.blendFor;},shift=v=>{s.zo=s.zo0=v;s.zoLeft=sh.blendFor;};   // zo: an offset eased out over the cross-fade, so hips and feet stay put when the clip changes
  if(s.mode==='sit-down'){// she backs onto the ledge as she lowers: the figure moves back as fast as the clip slides her feet forward, so the feet stay put
   const k=Math.min(1,1-Math.max(0,s.left)/cfg.len['sit-enter']);if(Number.isFinite(s.step.yaw)){const q=along(s.step,(s.sa0??SEAT_FRONT)-sh.enter*k);s.x=q.x;s.z=q.z;}else s.z=s.z0+sh.enter*k;s.clip=CLIPS.sitDown;
   if(s.left<=0){const bk=backOf(s);if(Number.isFinite(s.step.yaw)){const q=along(s.step,bk);s.x=q.x;s.z=q.z;}else s.z=s.step.z-bk;shift(sh.sit);s.mode='sit';s.left=between(rnd,cfg.sit);s.clip=CLIPS.sit;s.waved=false;s.device=rnd()<.45?'scroll':null;s.devLeft=between(rnd,[8,14]);}return s;}
  if(s.mode==='sit'){ease();s.clip=CLIPS.sit;s.devLeft-=dt;if(s.device&&s.devLeft<=0)s.device=null;
   // a wave from the seat to a player who comes close (once a sit)
   if(!s.waved&&((s.psit&&s.pact==='sit-wave')||(ctx.player&&dist(ctx.player,s)<4.5))){s.waved=true;s.device=null;s.sub='wave';s.waveLeft=3.6;}
   if(s.sub==='wave'){s.waveLeft-=dt;s.clip=CLIPS.wave;if(s.waveLeft<=0)s.sub=null;}
   if(s.left<=0&&s.sub!=='wave'){s.mode='stand-up';s.device=null;s.zo=0;s.z0=s.step.z-backOf(s)+sh.exitStart;s.sa0=backOf(s)-sh.exitStart;if(Number.isFinite(s.step.yaw)){const q=along(s.step,s.sa0);s.x=q.x;s.z=q.z;}else s.z=s.z0;s.left=cfg.len['sit-exit'];s.clip=CLIPS.standUp;s.once=true;}return s;}
  if(s.mode==='stand-up'){// she leans forward and rises over her feet: the figure moves forward with her hips
   const k=Math.min(1,1-Math.max(0,s.left)/cfg.len['sit-exit']),fy=Number.isFinite(s.step.yaw);s.sa=(s.sa0??0)+sh.exit*k;if(fy){const q=along(s.step,s.sa);s.x=q.x;s.z=q.z;}else s.z=s.z0-sh.exit*k;s.clip=CLIPS.standUp;
   if(s.left<=0){if(fy){s.sa-=sh.walk;const q=along(s.step,s.sa);s.x=q.x;s.z=q.z;}else s.z+=sh.walk;shift(-sh.walk);s.mode='step-off';s.clip='walk';s.dir=rnd()<.5?1:-1;}return s;}
  if(s.mode==='step-off'){ease();const v=cfg.speed*dt;s.clip='walk';if(Array.isArray(s.step.stand)){const f=standOf(s.step),dx=f.x-s.x,dz=f.z-s.z,d=Math.hypot(dx,dz);   // back out to the side of a stool
    if(d<=v+.02){s.x=f.x;s.z=f.z;s.step=null;s.zo=0;toWalk();}else{s.x+=dx/d*v;s.z+=dz/d*v;s.yaw=Math.atan2(dx,dz);}return s;}
   if(Number.isFinite(s.step.yaw)){s.yaw=s.step.yaw;s.sa=(s.sa??SEAT_FRONT)+v;const q=along(s.step,s.sa);s.x=q.x;s.z=q.z;if(s.sa>=STEP_OFF){s.step=null;s.zo=0;toWalk();}return s;}
   const tz=frontOf(s.step)-.3;s.yaw=Math.PI;s.z-=v;if(s.z<=tz){s.step=null;s.zo=0;toWalk();}return s;}
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

 const api={ACT,PLAN_MODES:PLAN,CLIPS,CLIP_LIST,BANNED,DEVICE,QUARTER,CAT,WALL,SEAT,STRETCH,STEPS,CAT_HOME,config,catTarget,routineStart,routineStep,frontOf,seatOf,seats,seatNear,seatYaw,seatOffset,along,SEAT_BACK,SEAT_FRONT,POSES,POSE_CLIP,POSE_NAME,FLOOR_BACK,FLOOR_MOVE,RAISED,floorClip,floorFx,floorStart,floorRest,posesOf,standOf,floorPose,lookAt,canLook,streetTime,simulated,simulate,utcLabel,CAT_ID,CAT_ACTION,CAT_REACTION};
 if(typeof module==='object'&&module.exports){module.exports=api;return;}

 /* start({B, scene, parent, quality, player, now}) -> {tick(dt), stats(), dispose()}. The figures and the cat appear when their files have loaded. */
 function start({B=root.BABYLON,scene,parent,quality='medium',player=()=>typeof walker!=='undefined'?walker:null,now:clockFn=()=>streetTime(),rnd=Math.random,cfg=config,where={scene:'street',quarter:QUARTER}}){
  let now=clockFn;   // setClock(fn): tests force a shift
  // who is out: the shift on the street clock (a draft test runs it at a time she is out: simulate above). A mission's follow / lead / cab step with the one who is out
  // never brings her out off-shift (the step starts only while she is out: live-content.js plans()); if her shift ends during the step she finishes it, then leaves.
  // (fix 19 Nov 2026) the same for her mission while it runs (live-content.js plans() why:'mission': she holds a spot between its steps), so she is not gone between its steps
  const assets=root.VoidAssets,owned=[];let disposed=false,clock=0,asked=-1;
  // which areas this scene has (npc-areas.js): one street quarter, every street area (the whole city), or the District interior; where each of them is now
  const AR=root.VoidNPCAreas,HERE=new Set(AR?AR.here(where.scene||'street',where.quarter||null):['avenue']),AVENUE=HERE.has('avenue');
  // Corporate and Temple store spots shifted off the city map. The figure stands in the scene's own metres; area and obstacle checks use the stored spot.
  const shift=AR&&AR.SCENE_SHIFT&&AR.SCENE_SHIFT[where.scene]||null,finite=p=>!!(p&&Number.isFinite(+p.x)&&Number.isFinite(+p.z)),world=p=>shift&&finite(p)?{...p,x:+p.x+shift.x,z:+p.z+shift.z}:p,localOf=p=>shift&&finite(p)?{...p,x:+p.x-shift.x,z:+p.z-shift.z}:p;
  const localPlan=P=>{if(!shift||!P)return P;if(P.mode==='stay')return localOf(P);if(P.mode==='path')return {...P,points:(P.points||[]).map(localOf)};if(P.mode==='escort')return {...P,to:localOf(P.to),from:localOf(P.from),resume:localOf(P.resume),final:localOf(P.final)};return P;};
  const areaOfPlan=P=>{if(!P)return 'avenue';if(P.area)return P.area;const q=P.mode==='path'?P.points&&P.points[0]:P,id=AR&&AR.areaOf(world(q));return id||(shift?null:'avenue');};
  function catArea(){return areaOfPlan(planOf(CAT_ID));}
  // the ground under a spot (pavement slabs stand about 0.18 m up): the area data, else the last known height
  const yAt=(x,z,last)=>{try{const s=root.VoidBackAlleys?.groundAt?.(x,z);if((where.scene||'street')==='street'&&Number.isFinite(s)&&s<0)return s;}catch{}const g=AR?AR.groundY(world({x,z})):null;return Number.isFinite(g)?g:Number.isFinite(last)?last:(shift?0:PAVE);};   // on the stairs down to the tunnels (20 Nov 2026): the steps' height
  const animRadius=quality==='low'?cfg.lowAnimRadius:cfg.animRadius;
  const cam=()=>scene?.activeCamera?.globalPosition||null;
  // The pavement's top (the sidewalk slabs stand about 0.18 m above the road): read from the built street once, under Reverie's spot.
  let PAVE=.18;if(AVENUE)try{const h=scene.pickWithRay(new B.Ray(new B.Vector3(SEAT.x,3,SEAT.z-.4),new B.Vector3(0,-1,0),6),m=>/^sidewalk/.test(m.name));if(h?.hit&&h.pickedPoint.y>-.05&&h.pickedPoint.y<.4)PAVE=h.pickedPoint.y;}catch{}
  // ---- the ledges they sit on (street furniture: there on both shifts) ----
  const ledgeMat=new B.PBRMaterial('street-pair-ledge',scene);ledgeMat.albedoColor=B.Color3.FromHexString('#3a3c40');ledgeMat.roughness=.92;ledgeMat.metallic=0;owned.push(ledgeMat);
  const trimMat=new B.PBRMaterial('street-pair-ledge-trim',scene);trimMat.albedoColor=B.Color3.FromHexString('#1d1e21');trimMat.roughness=.7;trimMat.metallic=.3;owned.push(trimMat);
  for(const st of AVENUE?STEPS:[]){const b=B.MeshBuilder.CreateBox('street-pair-'+st.id,{width:st.w,height:st.h,depth:st.d},scene);b.parent=parent;b.position.set(st.x,PAVE+st.h/2,st.z);b.material=ledgeMat;b.isPickable=false;
   const t=B.MeshBuilder.CreateBox('street-pair-'+st.id+'-edge',{width:st.w+.04,height:.04,depth:st.d+.04},scene);t.parent=parent;t.position.set(st.x,PAVE+st.h+.02,st.z);t.material=trimMat;t.isPickable=false;owned.push(b,t);b.freezeWorldMatrix();t.freezeWorldMatrix();}
  // ---- loading: only the one who is out, and the cat ----
  const src=a=>'assets/models/crowd/'+a+'.glb',has=a=>!!assets?.container?.('crowd:'+a);
  const dbg={asks:0,fails:[],nan:{her:0,cat:0,look:0}};   // nan: times a bad number was caught and reset (should stay 0)
  function ask(){if(clock<asked||!assets?.load)return;asked=clock+20;dbg.asks++;const want=HERE.has(catArea())?[CAT]:[];for(const a of want)if(!has(a))Promise.resolve(assets.load('crowd:'+a,{src:src(a),background:true},scene)).catch(e=>{if(dbg.fails.length<6)dbg.fails.push(a+': '+(e?.message||e));});}
  const scenePlan=(id,P)=>localPlan(root.VoidNPCPaths?.scheduledScenePlan(id,P,HERE)||P);
  const planRaw=id=>{try{return scenePlan(id,root.VoidStreetPair?.planFor?.(id)||null);}catch{return null;}};
  /* NEVER POPPED IN OR OUT IN FRONT OF THE PLAYER (the owner, 19 Nov 2026, about a giver whose offer was denied: she goes about her own routine meanwhile and walks back for
     the offer; "never offer again" sends her back to her own routine): a new plan she cannot walk to in a straight line, or in another area, is HELD (she keeps the old one)
     while she is in the player's view; she is moved once she is out of it, and comes back in at a new spot only while that spot is out of view too. held: id -> {plan, key}. */
  const held={},rejoin={};
  const planOf=id=>held[id]?held[id].plan:planRaw(id);
  const zoomK=()=>root.VoidZoom?root.VoidZoom.now():1;
  function inView(x,y,z,c){if(!c||!Number.isFinite(x+z))return false;if(Math.hypot(c.x-x,c.z-z)*zoomK()>cfg.showRadius)return false;
   try{const v=new B.Vector3(x,(Number.isFinite(y)?y:PAVE)+1,z);for(const pl of B.Frustum.GetPlanes(scene.getTransformMatrix()))if(pl.dotCoordinate(v)<-1.2)return false;return true;}catch{return true;}}
  const planSpot=P=>P&&(P.mode==='stay'?P:P.mode==='path'?P.points[0]:null);
  /* Hold or release a plan change for one figure: body {x, z, key, plan, enabled}; leg(from, to): the straight walk is blocked. Returns true while held. */
  function holdCheck(id,body,c,leg){const R=planRaw(id),k=R?R.key:null,seen=body.enabled&&inView(body.x,body.y,body.z,c);
   if(held[id]){if(!seen||k===held[id].key){const moved=k!==held[id].key;delete held[id];if(moved)rejoin[id]=true;return false;}return true;}
   if(k===body.key||(R&&R.mode==='escort')||!seen)return false;   /* (follow fix, 19 Nov 2026) a finished follow step is held too: a mission that ends with one sent her back to her Avenue routine and she vanished at the spot, on screen */
   const t=planSpot(R),jump=R?!!(t&&leg(t)):!!leg(null),gone=!HERE.has(areaOfPlan(R));if((jump&&!R?.crossings)||gone){held[id]={plan:body.plan||null,key:body.key};return true;}return false;}
  // where she appears: as planSpot, and for a follow / lead / cab step where it had got to (a reload) or where she stood when it started (P.from, live-content.js;
  // fix 19 Nov 2026: she appeared at her routine's spot on The Avenue, outside the quarter the step happens in)
  const appearAt=P=>{if(!P)return null;const ok=q=>q&&Number.isFinite(q.x)&&Number.isFinite(q.z)?q:null;return P.mode==='escort'?ok(P.resume)||ok(P.from):ok(P.entry)||planSpot(P);};
  let talkScan=0;
  const wl=()=>typeof walkingLocation!=='undefined'?walkingLocation:null;
  const catItem={id:'street-cat',action:CAT_ACTION,character:CAT_ID,label:'PET THE CAT',position:[0,.45,0],range:1.8,talk:true};
  function talkSync(dt,shown){const L=wl();if(!L||!Array.isArray(L.interactions))return;
   if(cat){catItem.position[0]=cat.x;catItem.position[2]=cat.z;}
   if((talkScan-=dt)>0)return;talkScan=.25;
   const street=L.id==='neochinatown'&&L.area!=='milked';
   {const want=street&&!!cat&&cat.node.isEnabled(),k=L.interactions.indexOf(catItem);if(want&&k<0)L.interactions.push(catItem);else if(!want&&k>=0)L.interactions.splice(k,1);}}
  function talkOff(){const L=wl();if(!L||!Array.isArray(L.interactions))return;for(const it of [catItem]){const k=L.interactions.indexOf(it);if(k>=0)L.interactions.splice(k,1);}}
  // Is the player petting the cat (a conversation opened from its prompt)? It comes to them and sits looking up meanwhile.
  let petSeen=false,petting=false;function petNow(){if(!convo()){petSeen=false;petting=false;return false;}if(!petSeen){petSeen=true;petting=typeof walkTarget!=='undefined'&&walkTarget===catItem;}return petting;}
  const convo=()=>!!root.VoidConversationUI?.isOpen||(typeof mode!=='undefined'&&mode==='dialogue');
  // ---- a mission's follow / lead / cab step (npc-escort.js; the plan comes from live-content.js plans(): {key, mode:'escort', kind, npc, to, set, stop, resume}) ----
  /* One step for her or the cat: the pure rules move `body` ({x, z, yaw}); here only the frustum test, the cab (road-taxi.js) and getting in and out. Only the local
     player (walker) is followed or led: other players never move this player's NPC. Returns {clip, speed, seat: {x, y, z, yaw} while she sits in the cab}. */
  const escorts={};let frustum=null,frustumAt=-1;
  function seen(x,z){const cam=scene.activeCamera;if(!cam)return true;try{if(frustumAt!==clock){frustumAt=clock;frustum=B.Frustum.GetPlanes(cam.getTransformationMatrix());}return B.Frustum.IsPointInFrustum(new B.Vector3(x,PAVE+.8,z),frustum);}catch{return true;}}
  function taxiJob(){const T=root.VoidRoadTaxi,R=root.VoidRoadTaxiRules,w=T&&T.world,j=w&&w.job;if(!j||j.released||!j.cab)return null;const did=j.dest&&j.dest.id;return {id:j.cab.id+':'+did,phase:j.cab.phase,dest:did,far:!!(root.VoidQuarters?.FAR||[]).some(f=>f.id===did),released:false,cab:{x:j.cab.x,z:j.cab.z,yaw:j.cab.yaw},doors:R?R.doorPoints(j.cab):[]};}
  const taxiCrossing=()=>{try{return !!root.VoidRoadTaxi?.crossing||(typeof mode!=='undefined'&&mode==='preparing');}catch{return false;}};
  const tell=(npc,P,ev,e,extra)=>{try{root.VoidStreetPair?.onEscort?.({npc,key:P.key,step:P.step,kind:P.kind,event:ev,phase:e.st.phase,x:e.st.x,z:e.st.z,...(extra||{})});}catch{}};
  function escTick(who,npc,P,body,dt,isCat){const E=root.VoidNPCEscort;if(!E)return {clip:'idle',speed:0,seat:null};let e=escorts[who];
   if(!e||e.key!==P.key){e=escorts[who]={key:P.key,st:{x:body.x,z:body.z,yaw:body.yaw||0,phase:null},trail:{pts:[],shifted:0},cab:null,told:null};
    const r=P.resume;if(r&&Number.isFinite(r.x)&&Number.isFinite(r.z)){e.st.x=r.x;e.st.z=r.z;if(Number.isFinite(r.yaw))e.st.yaw=r.yaw;}if(r&&P.kind==='follow-them'&&['walk','wait','paused','there'].includes(r.phase))e.st.phase=r.phase==='walk'?'wait':r.phase;if(r&&r.unarmed)e.st.unarmed=true;
    // carried with the player (npc-escort-across.js): still in the taxi through a gate's bay, or come through a link (ride / phase)
    if(r&&r.ride==='in-cab')e.st.ride='in-cab';if(r&&E.CAB.has(P.kind)&&r.phase==='in-cab')e.st.phase='in-cab';}
   const st=e.st,me=player(),meP=me&&Number.isFinite(me.x+me.z)?{x:me.x,z:me.z}:null,md=typeof mode!=='undefined'?mode:'',walking=md==='walking',riding=md==='road-taxi',job=taxiJob();
   if(walking&&meP)E.trailPush(e.trail,meP);
   const inp={area:P.area||'avenue',me:riding?null:meP,to:P.to||null,door:P.door||null,noDone:!!P.via,social:!!P.social,set:P.set,dt,cat:isCat,trail:e.trail,seen:seen(st.x,st.z),kind:P.kind,stop:P.stop,walking,riding,job:E.CAB.has(P.kind)?job:null,crossing:taxiCrossing()};
   if(P.kind==='their-cab'||P.kind==='shared-cab')inp.me=meP;
   // a follow / lead step's taxi (20 Nov 2026): she rides along in the player's cab (the cat does not: it waits); the walking rules wait while the ride has her
   let rv=null;if(!E.CAB.has(P.kind)&&E.rideAlong){const rr=E.rideAlong(st,{me:meP,job,riding,dt,set:P.set,crossing:inp.crossing,can:!isCat});rv=rr.ev;if(rv==='ride-out'||rv==='ride-left'){e.trail.pts.length=0;e.trail.shifted=0;}if(rr.busy){if(job&&st.ride==='in-cab')e.cab=job.cab;}}
   const ev=st.ride==='in-cab'||st.ride==='to-cab'?null:P.kind==='follow-them'?E.lead(st,inp):P.kind==='they-follow'?E.follow(st,inp):E.cab(st,inp);
   if(st.want==='hail'){const T=root.VoidRoadTaxi,k=E.kerb(st,P.area);const res=T&&T.hailFor?T.hailFor(k.call||{x:k.x,z:k.z-.8},P.stop,P.name):{ok:false,reason:'Street taxis are not running.'};if(!res.ok&&e.told!==res.reason){e.told=res.reason;tell(npc,P,'hail-failed',e,{reason:res.reason});}}
   if(job&&st.phase==='in-cab')e.cab=job.cab;
   let seat=null;if((st.phase==='in-cab'||st.ride==='in-cab')&&e.cab){const R=root.VoidRoadTaxiRules,sp=R&&R.companionSeat?R.companionSeat(e.cab):{x:e.cab.x,y:0,z:e.cab.z,yaw:e.cab.yaw};seat=sp;st.x=sp.x;st.z=sp.z;st.yaw=sp.yaw;}
   if(ev==='out'||(ev==='kerb'||ev==='follow')&&st.out||rv==='ride-out'||rv==='ride-left'){// out of the cab: beside it, the side away from the player
    const R=root.VoidRoadTaxiRules,c=e.cab;st.out=false;st.rideOut=false;if(c&&R){const ds=R.doorPoints(c),blocked=p=>{try{return !!root.VoidExplorer?.blocked?.(p.x,p.z,typeof walkingLocation!=='undefined'?walkingLocation:null);}catch{return false;}};
     const pick=ds.filter(p=>!blocked(p)).sort((a,b)=>(meP?Math.hypot(b.x-meP.x,b.z-meP.z)-Math.hypot(a.x-meP.x,a.z-meP.z):0))[0]||ds[2];if(pick){st.x=pick.x;st.z=pick.z;st.yaw=c.yaw||0;}}e.cab=null;}
   body.x=st.x;body.z=st.z;body.yaw=st.yaw;
   if(P.social){const others=[];if(meP)others.push(meP);const n=root.VoidAdvancedInteractions?.separate?.({x:body.x,z:body.z},others,.85);if(n&&AR&&!AR.leg(world({x:body.x,z:body.z}),world(n),{passing:true}).length){body.x=st.x=n.x;body.z=st.z=n.z;}}
   if(ev)tell(npc,P,ev,e);if(rv&&rv!==ev)tell(npc,P,rv,e,{ride:st.ride||null});
   return {clip:seat?'sit':st.clip||'idle',speed:st.speed||0,seat};}
  // ---- the cat ----
  let cat=null;   // {node, bones, x, z, yaw, gait, sit, mode, ...}
  const BONES=['Body','Neck','Head','Tail1','Tail2','Tail3','LegFL','LegFR','LegBL','LegBR'];
  function catArrive(){const node=assets?.instance?.('crowd:'+CAT,parent);if(!node)return;node.metadata={...node.metadata,streetCat:true};const bones={};
   for(const t of node.getDescendants(false)){const b=BONES.find(k=>t.name===k||t.name.endsWith('-'+k));if(b&&!bones[b]){if(!t.rotationQuaternion)t.rotationQuaternion=B.Quaternion.FromEulerVector(t.rotation);bones[b]={t,rest:t.rotationQuaternion.clone()};}}
   for(const m of node.getChildMeshes(false)){m.isPickable=false;if(m.material&&m.material.maxSimultaneousLights<8)m.material.maxSimultaneousLights=8;}
   const P=planOf(CAT_ID),t=appearAt(P),at=t||CAT_HOME;   // where it appears: its plan's spot, beside her, or by the LAUNDRY door
   cat={node,bones,x:at.x,z:at.z,yaw:Math.PI,gait:0,sit:0,mode:'home',until:0,lap:0,ang:0,circleLeft:0,playerLeft:0,wander:null,wanderLeft:0,rubbed:false,lastNear:false,tail:0,y:yAt(at.x,at.z,PAVE),key:P?P.key:null};node.position.set(cat.x,cat.y,cat.z);lit(node);}
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
   c.y+=(yAt(c.x,c.z,c.y)-c.y)*Math.min(1,dt*8);c.node.position.y=c.y-.11*s+Math.abs(Math.sin(c.gait))*.008*st;}
  function catGo(c,tx,tz,dt,fast){const dx=tx-c.x,dz=tz-c.z,d=Math.hypot(dx,dz);if(d<.04)return 0;const sp=Math.min(d/dt,fast?cfg.cat.trot:cfg.cat.walk)*(1-c.sit*.95),want=Math.atan2(dx,dz);
   let dy=Math.atan2(Math.sin(want-c.yaw),Math.cos(want-c.yaw));c.yaw+=dy*Math.min(1,dt*cfg.cat.turn);const k=Math.max(0,Math.cos(dy));const step=sp*k*dt;c.x+=Math.sin(c.yaw)*step;c.z+=Math.cos(c.yaw)*step;
   if(AVENUE)c.z=Math.min(WALL-.12,c.z);c.gait+=step/(fast?.3:.22)*Math.PI*2;return dt>0?step/dt:0;}
  /* The NPCs tab's plan for the cat (npc-paths.js planNow for CAT_ID: a stay, a route, a schedule block, a mission's "Giver waits at"): it walks (trots when far) to
     the spot or point and does the action: cat-sit (sits, facing the plan's way), cat-look (looks about), cat-wander (potters about within a metre), wait (stands). */
  function catPlan(c,P,dt){if(c.planKey!==P.key){c.planKey=P.key;c.pi=0;c.pk=-1;c.who=CAT_ID;c.itineraryRoute=undefined;c.itineraryDone=false;c.pdo=0;c.pact=null;c.pw=null;}let speed=0,sit=0;
   const n=P.mode==='path'?P.points.length:1,t=P.mode==='path'?P.points[((c.pi%n)+n)%n]:P;
   if(!c.pact){const target=itineraryTarget(c,P,t);if(!target)return {speed:0,sit:0};const d=Math.hypot(target.x-c.x,target.z-c.z);if(d>.08)return {speed:catGo(c,target.x,target.z,dt,d>1.6),sit:0};
    const list=P.mode==='stay'&&P.actions&&P.actions.length?P.actions:['cat-sit'],a=P.mode==='path'?t.action:list[(c.pk=(c.pk+1)%list.length)];
    if(a==='walk-on'){c.pi++;return {speed:0,sit:0};}c.pact=a;c.pdo=P.mode==='path'?Math.max(1,t.seconds||5):between(rnd,[6,14]);c.pw=null;}
   c.pdo-=dt;const a=c.pact;c.look=0;
   if(a==='cat-sit'){sit=1;const want=Number.isFinite(t.yaw)?t.yaw:Math.PI;c.yaw+=Math.atan2(Math.sin(want-c.yaw),Math.cos(want-c.yaw))*Math.min(1,dt*2);}
   else if(a==='cat-look'){c.look=Math.sin(clock*.7)*.6;}
   else if(a==='cat-wander'){if(!c.pw||(c.pwLeft-=dt)<=0){c.pw={x:t.x+(rnd()-.5)*1.6,z:AVENUE?Math.min(WALL-.25,t.z+(rnd()-.5)*.6):t.z+(rnd()-.5)*.6};c.pwLeft=3+rnd()*3;}const dd=Math.hypot(c.pw.x-c.x,c.pw.z-c.z);if(dd>.06)speed=catGo(c,c.pw.x,c.pw.z,dt,false);}
   if(c.pdo<=0){c.pact=null;if(P.mode==='path')c.pi++;}
   return {speed,sit};}
  function sitTo(c,v,dt){c.sit+=(v-c.sit)*Math.min(1,dt*(v>c.sit?2.2:4));}
  function catLeave(){if(!cat)return;cat.node?.dispose?.();cat=null;}
  function tickCat(dt,c0){if(cat)holdCheck(CAT_ID,{x:cat.x,y:cat.y,z:cat.z,key:cat.key,plan:cat.plan,enabled:cat.node.isEnabled()},c0,t=>!!(AR&&t&&AR.leg(world({x:cat.x,z:cat.z}),world(t)).length));
   const area=catArea();if(!HERE.has(area)){catLeave();return;}
   if(cat){const P=planOf(CAT_ID),k=P?P.key:null;if(k!==cat.key){const t=P&&(P.mode==='stay'?P:P.mode==='path'?P.points[0]:null);if(AR&&t&&!P?.crossings&&AR.leg(world({x:cat.x,z:cat.z}),world(t)).length)catLeave();else if(cat)cat.key=k;}}
   // away from the Avenue with no plan of its own it comes out beside her, once she is here
   if(!cat){const t=planSpot(planOf(CAT_ID));if(has(CAT)&&(area==='avenue'||planOf(CAT_ID))&&!(rejoin[CAT_ID]&&t&&inView(t.x,null,t.z,c0))){delete rejoin[CAT_ID];catArrive();}if(!cat)return;}cat.plan=planOf(CAT_ID);const c=cat,n=c.node;if(!Number.isFinite(c.x+c.z+c.yaw+c.sit+c.gait)){dbg.nan.cat++;Object.assign(c,{x:CAT_HOME.x,z:CAT_HOME.z,yaw:Math.PI,sit:0,gait:0,ang:0,mode:'home'});}
   const far=c0?Math.hypot(c0.x-c.x,c0.z-c.z)*(root.VoidZoom?root.VoidZoom.now():1)>cfg.showRadius:false;if(n.isEnabled()===far)n.setEnabled(!far);if(far&&planOf(CAT_ID)?.mode!=='escort')return;   // far away: still, unless a mission step has it following the player
   const me=player(),meP=me?{x:me.x,z:me.z}:null,near=!!meP&&dist(meP,c)<cfg.cat.playerRadius;
   let chance=1;if(near&&!c.lastNear)chance=rnd();c.lastNear=near;
   if(meP&&petNow()&&c.mode!=='player'){c.mode='player';c.playerLeft=4;}else if(c.mode==='player'&&petting)c.playerLeft=Math.max(c.playerLeft,2);   // petted: it comes and sits looking up
   const P=planOf(CAT_ID);if(P&&c.mode!=='player')c.mode='plan';else if(!P&&c.mode==='plan'){c.mode='home';c.planKey=null;c.pact=null;}
   if(c.mode!=='player'&&c.mode!=='plan'){const t=catTarget({player:meP,cat:c,clock,until:c.until,chance},cfg.cat);
    if(t.kind==='home'&&area!=='avenue'){c.mode='wait';}else if(t.kind==='player'){c.mode='player';c.playerLeft=between(rnd,cfg.cat.playerFor);}else if(t.kind==='home')c.mode='home';}
   let speed=0,sit=0;c.rub=false;
   if(c.mode==='plan'&&P&&P.mode==='escort'){const x0=c.x,z0=c.z,r=escTick('cat',CAT_ID,P,c,dt,true),mv=Math.hypot(c.x-x0,c.z-z0);c.gait+=mv/(r.speed>1?.3:.22)*Math.PI*2;speed=dt>0?mv/dt:0;sit=r.speed>0||speed>.05?0:1;c.look=0;}   // a mission's follow / lead step: at its own pace; it sits while it waits
   else if(c.mode==='plan'&&P){const r=catPlan(c,P,dt);speed=r.speed;sit=r.sit;}
   else if(c.mode==='player'){if(!meP){c.mode='home';}else{const d=dist(meP,c);c.look=0;
     if(d>.75){speed=catGo(c,meP.x,meP.z,dt,d>1.6);}else{const want=Math.atan2(meP.x-c.x,meP.z-c.z);c.yaw+=Math.atan2(Math.sin(want-c.yaw),Math.cos(want-c.yaw))*Math.min(1,dt*3);sit=1;c.playerLeft-=dt;}
     if(c.playerLeft<=0||d>cfg.cat.playerRadius*2.5){c.mode='home';c.until=clock+between(rnd,cfg.cat.playerCool);}}}
   else if(c.mode==='wait'){sit=1;c.look=Math.sin(clock*.35)*.5;}   // in another area with her not here yet: it sits where it is
   else{// home: a short wander by the LAUNDRY door, then sits a while
    c.wanderLeft-=dt;if(!c.wander||c.wanderLeft<=0){c.wander={x:CAT_HOME.x+(rnd()-.5)*2*cfg.cat.homeWander,z:AVENUE?Math.min(WALL-.25,CAT_HOME.z-rnd()*.8):CAT_HOME.z-rnd()*.8};c.wanderLeft=6+rnd()*10;}
    const dd=Math.hypot(c.wander.x-c.x,c.wander.z-c.z);if(dd>.06&&c.wanderLeft>4)speed=catGo(c,c.wander.x,c.wander.z,dt,false);else sit=c.wanderLeft<4?1:0;c.look=Math.sin(clock*.35)*.5;}
   sitTo(c,sit,dt);n.position.x=c.x;n.position.z=c.z;n.rotation.y=c.yaw;if(c0&&Math.hypot(c0.x-c.x,c0.z-c.z)>animRadius)return;pose(c,dt,speed);}
  // A small warm light from the shop windows on whoever is out and the cat (Medium and up; it lights only them: the pavement is untouched). Low: none.
  const lamp=quality==='low'?null:new B.PointLight('street-pair-lamp',new B.Vector3(SEAT.x,PAVE+1.92,WALL-1.05),scene);if(lamp){lamp.parent=parent;lamp.diffuse=B.Color3.FromHexString('#ffd2a8');lamp.specular=B.Color3.FromHexString('#ffb48a').scale(.4);lamp.intensity=16;lamp.range=7;lamp.includedOnlyMeshes=[];owned.push(lamp);}
  function lit(n){if(!lamp||!n)return;for(const m of n.getChildMeshes(false))if(!lamp.includedOnlyMeshes.includes(m))lamp.includedOnlyMeshes.push(m);lamp.includedOnlyMeshes=lamp.includedOnlyMeshes;}
  function lampTo(){if(!lamp)return;const x=cat?.x??SEAT.x,raw=(cat?.z??SEAT.z)-1.05,z=AVENUE?Math.min(WALL-1.05,raw):raw;lamp.position.x+=(x-lamp.position.x)*.1;lamp.position.z+=(z-lamp.position.z)*.1;}   // a little in front of her (toward the road), so her face is lit wherever she walks
  function tick(dt){if(disposed)return;clock+=dt;if(clock>3&&typeof mode!=='undefined'&&(mode==='walking'||mode==='road-taxi'))ask();const c=cam();talkSync(dt);tickCat(dt,c);lampTo();}
  const self={tick,stats:()=>({held:Object.keys(held),pave:+PAVE.toFixed(3),asks:dbg.asks,fails:dbg.fails.slice(),nan:{...dbg.nan},clock:+clock.toFixed(1),onShift:null,onStreet:null,here:[...HERE],catArea:catArea(),cat:cat?{mode:cat.mode,plan:cat.planKey||null,act:cat.pact||null,pet:!!wl()?.interactions?.includes(catItem),x:cat.x,z:cat.z,sit:+cat.sit.toFixed(2),bones:Object.keys(cat.bones).length}:null,escort:Object.fromEntries(Object.entries(escorts).map(([w,e])=>[w,{key:e.key,npc:CAT_ID,phase:e.st.phase,ride:e.st.ride||null,x:+e.st.x.toFixed(2),z:+e.st.z.toFixed(2),yaw:+(e.st.yaw||0).toFixed(2),trail:e.trail.pts.length,here:!!cat}]))}),
   get cat(){return cat;},catItem,setClock(fn){now=fn||clockFn;asked=-1;},
   dispose(){disposed=true;talkOff();catLeave();cat?.node?.dispose?.();cat=null;for(const o of owned)o.dispose?.();if(root.VoidStreetPair&&root.VoidStreetPair.live===liveFn)root.VoidStreetPair.live=null;}};
  // the editor's map shows where she is now (Developer Tools)
  const liveFn=()=>self.stats();if(root.VoidStreetPair)root.VoidStreetPair.live=liveFn;return self;
 }
 function watchScene(sceneId,owner){if(!owner||typeof owner.build!=='function'||owner.build.pair)return;const b0=owner.build;const b1=function(o){const h=b0.apply(this,arguments);let pair=null;try{pair=start({...(o||{}),where:{scene:sceneId}});}catch(e){}
  if(!h||!pair)return h;let last=null;const t=h.tick,d=h.dispose;h.tick=function(){const r=t.apply(this,arguments);const now=performance.now()/1000,dt=last==null?0:Math.min(.1,now-last);last=now;if(dt>0)pair.tick(dt);return r;};h.dispose=function(){try{pair.dispose();}catch{}return d.apply(this,arguments);};h.pair=pair;return h;};b1.pair=true;owner.build=b1;}
 root.VoidStreetPair={...api,start,watchScene};watchScene('corporate',root.VoidCorporate);watchScene('temple',root.VoidTemple);
 // TALK TO REVERIE / LACE with no mission waiting: her greeting (live-content.js offers a Mission Editor mission first). Name cards for the dialogue window.
 const wait=setInterval(()=>{if(typeof VoidInteractions==='undefined'||!VoidInteractions.register||typeof talk!=='function')return;clearInterval(wait);
  const chars=root.VoidStoryContent?.characters;
  if(chars&&!chars[CAT_ID])chars[CAT_ID]={id:CAT_ID,name:'Street cat',role:'',portrait:'art/characters.png',cell:'0% 0%',faction:'independent',tags:['street'],biography:'',relationshipDefault:0};
  VoidInteractions.register(CAT_ACTION,()=>{talk('',CAT_REACTION.map(text=>({who:CAT_ID,text})),()=>{try{resumeWalking();}catch{}},'CLOSE');});
 },300);
})(typeof globalThis!=='undefined'?globalThis:this);
