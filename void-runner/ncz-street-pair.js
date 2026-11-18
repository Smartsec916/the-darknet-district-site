/* The Avenue's street pair (the owner, 18 Nov 2026: "Put Reverie and Lace in the streets rotated every 12 hours", and a cat "which seeks these two out on the street
   and seeks attention from them"). Two named residents made from the owner's own Meshy generations take turns on the north pavement of The Avenue, by the
   LAUNDRY and REPAIR shopfronts (a plain daytime stretch: well away from Milked, NULL and the clubs):
   - REVERIE (internal id grey-reverie, Meshy title "Grey Reverie"; placeholder name) is sculpted sitting on the ground hugging her knees: a static figure on the
     pavement with her back to the LAUNDRY's wall. She only breathes (a slow, small rise and fall); her head rests on her arms, so it is not cut free to turn.
   - LACE (internal id ethereal-lace, Meshy title "Ethereal Lace"; placeholder name) is rigged (Meshy auto-rig) with neutral street clips only: idle, walk, sit,
     look. She walks the pavement for a while, sits on one of the two concrete ledges against the shop walls, gets up and walks again, always within this stretch.
   - THE SHIFT is real time on one clock for everyone (UTC): hours 0-11 Reverie, 12-23 Lace. For the first `arrive` seconds of each shift nobody is out yet (one
     has gone, the other is on her way). The game clock (game-clock.js) was not used: it is per player and only runs while playing, so players would disagree.
   - THE CAT (npc-street-cat, the owner's Meshy cat; a small rig of ten bones added in Blender, no Meshy credits) trots to whichever of them is out: it circles
     and rubs round Lace's legs when she stops, follows at her heel when she walks, and sits beside either of them while she sits. With neither out it potters
     about by the LAUNDRY door. Now and then it goes to a player who comes close, sits looking up for a few seconds, and goes back.
   Nobody here speaks or has a voice, a mission or a conversation (no dialogue at all); there is no interaction. Names are placeholders awaiting the owner.
   Pure planning (the shift, Lace's routine, the cat's choice of whom to go to) runs in Node: tests/ncz-street-pair.test.cjs. The figures run in the browser,
   started by neochinatown.js with the street (The Avenue, or the whole city). Multiplayer: the street is not shared, but the shift is the same for everyone. */
(function(root){
 'use strict';
 const PAIR=[
  {id:'grey-reverie',name:'Reverie',title:'Grey Reverie',asset:'npc-grey-reverie',kind:'seated',hours:[0,12],placeholder:true},
  {id:'ethereal-lace',name:'Lace',title:'Ethereal Lace',asset:'npc-ethereal-lace',kind:'walker',hours:[12,24],placeholder:true}];
 const QUARTER='avenue',CAT='npc-street-cat';
 // World metres (x east, z north). The Avenue's north pavement runs along z -6.6 (ncz-nightlife.js lane avenue-north); the shopfronts' wall is the face of the
 // street block at z -5 (neochinatown.js city-block-32).
 const WALL=-5.05;
 const SEAT={x:104.4,z:-5.42,yaw:Math.PI};                     // Reverie: on the pavement, back to the LAUNDRY wall, looking out at the road
 const STRETCH={x0:84,x1:121,z:-6.85};                         // Lace's walk (between REPAIR at 75.5 and the BIO-CLINIC at 124.5)
 const STEPS=[{id:'ledge-repair',x:90.5,w:1.5,d:.45,h:.6},{id:'ledge-laundry',x:113.2,w:1.5,d:.45,h:.6}].map(s=>({...s,z:WALL-s.d/2}));   // concrete ledges against the wall, seat height (the sit clip's)
 const CAT_HOME={x:100.6,z:-5.7};
 const config={
  arrive:90,                 // seconds at the start of each shift with nobody out yet
  walk:[26,48],sit:[22,40],pause:[3,6],pauseShare:.35,         // Lace: how long she walks, sits, stops to look about at a turn
  speed:.95,                 // her walking pace (m/s)
  showRadius:80,animRadius:40,   // beyond these from the camera the figures are hidden / stop moving their limbs
  cat:{trot:1.45,walk:.55,turn:4,playerRadius:3.5,playerFor:[4,7],playerCool:[40,70],playerChance:.5,circleR:.42,circleFor:[4,7],sitBy:.55,heel:.6,homeWander:2.2},
  breathe:{rate:.27,depth:.006}};
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
 /* Lace's routine, one step. s: {mode, x, z, dir, left, step} (left: seconds left in this mode). Returns the same object, changed, with `clip` the clip to play.
    walk -> (now and then at a turn: pause) -> to-step (walk to the front of the nearest ledge ahead) -> settle (turn and lower onto it) -> sit -> rise -> walk */
 const between=(r,[a,b])=>a+r()*(b-a);
 function laceStart(rnd=Math.random,cfg=config){const x=between(rnd,[STRETCH.x0+3,STRETCH.x1-3]);return {mode:'walk',x,z:STRETCH.z,dir:rnd()<.5?1:-1,left:between(rnd,cfg.walk),step:null,yaw:0,clip:'walk',sitZ:0};}
 // the sit clip puts the hips 0.35 m behind the figure's origin (its feet) and 0.65 m up: so she stands that far in front of the ledge's middle
 const frontOf=st=>st.z-st.d/2-.42,seatOf=st=>st.z-.3;
 function laceStep(s,dt,rnd=Math.random,cfg=config){
  const v=cfg.speed*dt;s.left-=dt;
  if(s.mode==='walk'){s.x+=s.dir*v;s.z+=(STRETCH.z-s.z)*Math.min(1,dt*2);s.yaw=s.dir>0?Math.PI/2:-Math.PI/2;s.clip='walk';
   if(s.x>STRETCH.x1||s.x<STRETCH.x0){s.x=Math.max(STRETCH.x0,Math.min(STRETCH.x1,s.x));s.dir*=-1;if(rnd()<cfg.pauseShare){s.mode='pause';s.pauseLeft=between(rnd,cfg.pause);s.clip='look';}}
   if(s.left<=0&&s.mode==='walk'){const ahead=STEPS.filter(t=>(t.x-s.x)*s.dir>1.5).sort((a,b)=>Math.abs(a.x-s.x)-Math.abs(b.x-s.x));s.step=ahead[0]||STEPS.slice().sort((a,b)=>Math.abs(a.x-s.x)-Math.abs(b.x-s.x))[0];s.mode='to-step';}
   return s;}
  if(s.mode==='pause'){s.pauseLeft-=dt;s.clip='look';if(s.pauseLeft<=0){s.mode='walk';s.clip='walk';}return s;}
  if(s.mode==='to-step'){const tx=s.step.x,tz=frontOf(s.step),dx=tx-s.x,dz=tz-s.z,d=Math.hypot(dx,dz);s.clip='walk';
   if(d<=v+.02){s.x=tx;s.z=tz;s.mode='settle';s.left=1.1;s.clip='idle';}else{s.x+=dx/d*v;s.z+=dz/d*v;s.yaw=Math.atan2(dx,dz);}return s;}
  if(s.mode==='settle'){// turn to face the road, then lower back onto the ledge (the sit clip fades in as she moves back)
   const want=Math.PI,dy=Math.atan2(Math.sin(want-s.yaw),Math.cos(want-s.yaw));s.yaw+=dy*Math.min(1,dt*5);
   if(Math.abs(dy)<.15){s.clip='sit';s.z+=(seatOf(s.step)-s.z)*Math.min(1,dt*3);}
   if(s.left<=0){s.z=seatOf(s.step);s.yaw=want;s.mode='sit';s.left=between(rnd,cfg.sit);s.clip='sit';}return s;}
  if(s.mode==='sit'){s.clip='sit';if(s.left<=0){s.mode='rise';s.left=.9;s.clip='idle';}return s;}
  if(s.mode==='rise'){s.clip='idle';s.z+=(frontOf(s.step)-s.z)*Math.min(1,dt*3);if(s.left<=0){s.mode='walk';s.dir=rnd()<.5?1:-1;s.left=between(rnd,cfg.walk);s.step=null;s.clip='walk';}return s;}
  return s;}
 const api={PAIR,QUARTER,CAT,WALL,SEAT,STRETCH,STEPS,CAT_HOME,config,onShift,shiftStart,nextChange,onStreet,catTarget,laceStart,laceStep};
 if(typeof module==='object'&&module.exports){module.exports=api;return;}

 /* start({B, scene, parent, quality, player, now}) -> {tick(dt), stats(), dispose()}. The two figures and the cat appear when their files have loaded. */
 function start({B=root.BABYLON,scene,parent,quality='medium',player=()=>typeof walker!=='undefined'?walker:null,now:clockFn=()=>Date.now(),rnd=Math.random,cfg=config}){
  let now=clockFn;   // setClock(fn): tests force a shift
  const assets=root.VoidAssets,owned=[];let disposed=false,clock=0,asked=-1;
  const cam=()=>scene?.activeCamera?.globalPosition||null;
  // The pavement's top (the sidewalk slabs stand about 0.18 m above the road): read from the built street once, under Reverie's spot.
  let PAVE=.18;try{const h=scene.pickWithRay(new B.Ray(new B.Vector3(SEAT.x,3,SEAT.z-.4),new B.Vector3(0,-1,0),6),m=>/^sidewalk/.test(m.name));if(h?.hit&&h.pickedPoint.y>-.05&&h.pickedPoint.y<.4)PAVE=h.pickedPoint.y;}catch{}
  // ---- the two ledges Lace sits on (street furniture: there on both shifts) ----
  const ledgeMat=new B.PBRMaterial('street-pair-ledge',scene);ledgeMat.albedoColor=B.Color3.FromHexString('#3a3c40');ledgeMat.roughness=.92;ledgeMat.metallic=0;owned.push(ledgeMat);
  const trimMat=new B.PBRMaterial('street-pair-ledge-trim',scene);trimMat.albedoColor=B.Color3.FromHexString('#1d1e21');trimMat.roughness=.7;trimMat.metallic=.3;owned.push(trimMat);
  for(const st of STEPS){const b=B.MeshBuilder.CreateBox('street-pair-'+st.id,{width:st.w,height:st.h,depth:st.d},scene);b.parent=parent;b.position.set(st.x,PAVE+st.h/2,st.z);b.material=ledgeMat;b.isPickable=false;
   const t=B.MeshBuilder.CreateBox('street-pair-'+st.id+'-edge',{width:st.w+.04,height:.04,depth:st.d+.04},scene);t.parent=parent;t.position.set(st.x,PAVE+st.h+.02,st.z);t.material=trimMat;t.isPickable=false;owned.push(b,t);b.freezeWorldMatrix();t.freezeWorldMatrix();}
  // ---- loading: only the one who is out, and the cat ----
  const src=a=>'assets/models/crowd/'+a+'.glb',has=a=>!!assets?.container?.('crowd:'+a);
  const dbg={asks:0,fails:[]};
  function ask(){if(clock<asked||!assets?.load)return;asked=clock+20;dbg.asks++;const who=onStreet(now(),cfg);for(const a of [CAT,...(who?[who.asset]:[])])if(!has(a))Promise.resolve(assets.load('crowd:'+a,{src:src(a),background:true},scene)).catch(e=>{if(dbg.fails.length<6)dbg.fails.push(a+': '+(e?.message||e));});}
  // ---- the woman who is out ----
  let her=null;   // {p (PAIR entry), node, anim, s (Lace's routine), base}
  function leave(){if(!her)return;her.anim?.dispose?.();her.node?.dispose?.();her=null;}
  function arrive(p){const node=assets?.instance?.('crowd:'+p.asset,parent);if(!node)return;node.metadata={...node.metadata,character:p.id,streetPair:p.id,displayName:p.name};
   for(const m of node.getChildMeshes(false)){m.isPickable=false;if(m.material&&m.material.maxSimultaneousLights<8)m.material.maxSimultaneousLights=8;}
   her={p,node,anim:null,s:null};lit(node);
   if(p.kind==='seated'){node.position.set(SEAT.x,PAVE,SEAT.z);node.rotation.y=SEAT.yaw;her.base=node.scaling.clone();}
   else{her.s=laceStart(rnd,cfg);her.anim=root.VoidCrowd?.animate?.(node,p.asset,'walk')||null;node.position.set(her.s.x,PAVE,her.s.z);
    // she may glance at her V1 as she walks (npc-device.js, the street's ordinary reading); never while sitting down or getting up
    try{root.VoidNPCDevice?.enlist?.(node,{kind:'walker',state:()=>({moving:her?.s?.mode==='walk',can:her?.s?.mode==='walk'||her?.s?.mode==='sit'})});}catch{}}}
  function herNow(){if(!her?.node)return null;const n=her.node.position;return {x:n.x,z:n.z,sitting:her.p.kind==='seated'||her.s?.mode==='sit'||her.s?.mode==='settle',moving:her.s?.mode==='walk'||her.s?.mode==='to-step'};}
  function tickHer(dt,c){const want=onStreet(now(),cfg);if(her&&(!want||want.id!==her.p.id))leave();if(!her&&want&&has(want.asset))arrive(want);if(!her)return;
   const n=her.node,far=c?Math.hypot(c.x-n.position.x,c.z-n.position.z)*(root.VoidZoom?root.VoidZoom.now():1)>cfg.showRadius:false;if(n.isEnabled()===far)n.setEnabled(!far);
   if(her.p.kind==='seated'){if(far)return;const k=Math.sin(clock*Math.PI*2*cfg.breathe.rate),d=cfg.breathe.depth;n.scaling.set(her.base.x*(1+d*.5*k),her.base.y*(1+d*k),her.base.z*(1+d*.7*k));return;}
   const s=laceStep(her.s,dt,rnd,cfg);n.position.set(s.x,PAVE,s.z);n.rotation.y=s.yaw;her.anim?.setActive?.(!far);if(her.anim&&s.clip!==her.clip){her.clip=s.clip;her.anim.play(s.clip);}}
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
   c.z=Math.min(WALL-.12,c.z);c.gait+=step/(fast?.3:.22)*Math.PI*2;return step/dt;}
  function sitTo(c,v,dt){c.sit+=(v-c.sit)*Math.min(1,dt*(v>c.sit?2.2:4));}
  function tickCat(dt,c0){if(!cat){if(has(CAT))catArrive();if(!cat)return;}const c=cat,n=c.node;
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
    if(h.sitting){// beside her, a little toward the road; Reverie sits against the wall, so the cat sits at her side on the pavement
     const side=c.x<h.x?-1:1,tx=h.x+side*cfg.cat.sitBy,tz=Math.min(WALL-.2,h.z-.2),dd=Math.hypot(tx-c.x,tz-c.z);
     if(!c.rubbed&&d<1.2){// a pass close in front of her knees first, rubbing
      c.ang=(c.ang||Math.atan2(c.x-h.x,c.z-h.z))+dt*1.3;const r=.38,ax=h.x+Math.sin(c.ang)*r,az=Math.min(WALL-.2,h.z-.15+Math.cos(c.ang)*r*.6);speed=catGo(c,ax,az,dt,false);c.rub=true;c.circleLeft-=dt;if(c.circleLeft<=0)c.rubbed=true;}
     else if(dd>.06){speed=catGo(c,tx,tz,dt,dd>1.6);}
     else{const want=Math.atan2(h.x-c.x,h.z-c.z)+side*.9;c.yaw+=Math.atan2(Math.sin(want-c.yaw),Math.cos(want-c.yaw))*Math.min(1,dt*2);sit=1;}}
    else if(h.moving){// at her heel, on the road side
     c.rubbed=false;c.circleLeft=between(rnd,cfg.cat.circleFor);const yaw=her?.s?.yaw??0,tx=h.x-Math.sin(yaw)*cfg.cat.heel+Math.cos(yaw)*.0,tz=Math.min(WALL-.2,h.z-.32);const dd=Math.hypot(tx-c.x,tz-c.z);speed=dd>.08?catGo(c,tx,tz,dt,dd>.9):0;}
    else{// she has stopped: round her legs, rubbing, then sit by her feet
     if(d>.9&&!c.rubbed){speed=catGo(c,h.x,h.z-.4,dt,true);}
     else if(c.circleLeft>0){c.ang=(c.ang||Math.atan2(c.x-h.x,c.z-h.z))+dt*1.6;const r=cfg.cat.circleR;speed=catGo(c,h.x+Math.sin(c.ang)*r,Math.min(WALL-.2,h.z+Math.cos(c.ang)*r),dt,false);c.rub=true;c.circleLeft-=dt;if(c.circleLeft<=0)c.rubbed=true;}
     else{const tx=h.x+.45,tz=h.z-.25,dd=Math.hypot(tx-c.x,tz-c.z);if(dd>.06)speed=catGo(c,tx,tz,dt,false);else sit=1;}}
    const want=Math.atan2(h.x-c.x,h.z-c.z);c.look=Math.atan2(Math.sin(want-c.yaw),Math.cos(want-c.yaw));}
   else{// home: a short wander by the LAUNDRY door, then sits a while
    c.wanderLeft-=dt;if(!c.wander||c.wanderLeft<=0){c.wander={x:CAT_HOME.x+(rnd()-.5)*2*cfg.cat.homeWander,z:Math.min(WALL-.25,CAT_HOME.z-rnd()*.8)};c.wanderLeft=6+rnd()*10;}
    const dd=Math.hypot(c.wander.x-c.x,c.wander.z-c.z);if(dd>.06&&c.wanderLeft>4)speed=catGo(c,c.wander.x,c.wander.z,dt,false);else sit=c.wanderLeft<4?1:0;c.look=Math.sin(clock*.35)*.5;}
   sitTo(c,sit,dt);n.position.x=c.x;n.position.z=c.z;n.rotation.y=c.yaw;if(c0&&Math.hypot(c0.x-c.x,c0.z-c.z)>cfg.animRadius)return;pose(c,dt,speed);}
  // A small warm light from the shop windows on whoever is out and the cat (Medium and up; it lights only them: the pavement is untouched). Low: none.
  const lamp=quality==='low'?null:new B.PointLight('street-pair-lamp',new B.Vector3(SEAT.x,PAVE+1.92,WALL-1.05),scene);if(lamp){lamp.parent=parent;lamp.diffuse=B.Color3.FromHexString('#ffd2a8');lamp.specular=B.Color3.FromHexString('#ffb48a').scale(.4);lamp.intensity=16;lamp.range=7;lamp.includedOnlyMeshes=[];owned.push(lamp);}
  function lit(n){if(!lamp||!n)return;for(const m of n.getChildMeshes(false))if(!lamp.includedOnlyMeshes.includes(m))lamp.includedOnlyMeshes.push(m);lamp.includedOnlyMeshes=lamp.includedOnlyMeshes;}
  function lampTo(){if(!lamp)return;const h=herNow(),c=cat;const x=h?h.x:c?c.x:SEAT.x;lamp.position.x+=(x-lamp.position.x)*.1;}
  function tick(dt){if(disposed)return;clock+=dt;if(clock>3&&typeof mode!=='undefined'&&mode==='walking')ask();const c=cam();tickHer(dt,c);tickCat(dt,c);lampTo();}
  return {tick,stats:()=>({pave:+PAVE.toFixed(3),asks:dbg.asks,fails:dbg.fails.slice(),clock:+clock.toFixed(1),onShift:onShift(now()).id,onStreet:onStreet(now(),cfg)?.id||null,her:her?{id:her.p.id,mode:her.s?.mode||'seated',clip:her.clip||null,x:her.node.position.x,z:her.node.position.z}:null,cat:cat?{mode:cat.mode,x:cat.x,z:cat.z,sit:+cat.sit.toFixed(2),bones:Object.keys(cat.bones).length}:null}),
   get her(){return her;},get cat(){return cat;},setClock(fn){now=fn||clockFn;asked=-1;},
   dispose(){disposed=true;leave();cat?.node?.dispose?.();cat=null;for(const o of owned)o.dispose?.();}};
 }
 root.VoidStreetPair={...api,start};
})(typeof globalThis!=='undefined'?globalThis:this);
