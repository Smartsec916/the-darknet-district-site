/* FOLLOW / LEAD / SHARED-CAB MISSION STEPS (the owner, queue item 3, approved 18 Nov 2026; built 19 Nov 2026). Pure rules: browser and Node tests; no DOM, no network.
   Four step kinds a Mission Editor mission may use with any PATH-CAPABLE NPC (npc-paths.js MOVABLE: today Reverie, Lace and the street cat; more NPCs plug in as soon as
   their walking code follows a plan, by being added to MOVABLE with an area and, for cabs, a quarter):
     follow-them  "Follow them": the NPC walks to a spot picked on the map and the player follows. She starts once the player is within `wait` metres of her, stops and
                  waits (turned to the player) while the player is more than `wait` metres behind, walks on when they catch up; if the player goes further than `lost`
                  metres: `ifLost` 'pause' (she waits until they come back) or 'fail' (the mission fails: it goes back to being offered). Done when both are at the spot.
     they-follow  "They follow you": the NPC follows the player (about 2 m behind; a cat at its own pace) along the player's own trail (walkable by definition), walking or
                  running to keep up, and is put a few metres behind the player only when she is far (20 m+) AND off-screen. Done when both are at the spot.
     their-cab    "They call a cab": she walks to the kerb and calls a street taxi (road-taxi.js, the same cabs and fares) to the chosen stop, gets in, and the player
                  boards with her (BOARD TAXI, fare as normal; the developer account rides free). Both get out at the stop; done then.
     shared-cab   "You call a cab, they ride along": she follows the player; when the player's cab to the chosen stop is waiting she gets in too (or as the player
                  boards, if she is close); both get out at the stop; done then. A cab to another stop: she does not get in (a short notice says where she goes).
   WHERE: the spot must be walkable in the area where she is placed (placedArea; npc-areas.js, since 19 Nov 2026 anywhere walkable in the city). A cab stop must be in
   that area's quarter (stops(id, area)); the other stops, the Corporate District and the Temple are greyed with the reason (Reverie / Lace: city only). The cat walks but
   does not ride in cabs.
   MULTIPLAYER: the street is not shared (each player's own copy of the street pair): only the mission player's NPC follows them; other players see her as usual.
   SAVE: nothing new in the save shape. While a step runs, story.flags.npcEsc holds '<mission>/<step>|<phase>|<x>|<z>' (a string under 200 characters, which clean_save()
   accepts) so a reload puts her back where she was; it is removed when the step ends. */
(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports;
 const NPX=()=>node?require('./npc-paths.js'):root.VoidNPCPaths;
 const QT=()=>node?require('./ncz-quarters.js'):root.VoidQuarters;
 /* WHERE SHE IS (the owner, 19 Nov 2026: "Let me place REVERIE or LACE anywhere"; npc-areas.js): a step runs in the area she is placed in for that mission: where she waits
    for it ("Giver waits at"), else her all-day placement (Developer Tools > NPCs), else The Avenue. Its spot must be in that area, and a cab stop in that area's quarter
    (none inside the District). placedArea(id, {waitAt, plan}); the editor hands over the draft's placements with draftPlans (browser only). */
 const AR=()=>node?require('./npc-areas.js'):root.VoidNPCAreas;
 const areaName=a=>((AR()&&AR().get(a))||{name:a}).name;
 function placedArea(id,{waitAt=null,plan=null}={}){const A=AR();if(!A)return 'avenue';if(waitAt&&num(waitAt.x)&&num(waitAt.z)){const a=A.areaOf(waitAt);if(a)return a;}
  if(id&&plan===null&&api.draftPlans){try{plan=(api.draftPlans()||{})[id]||null;}catch{}}
  const t=plan&&(plan.mode==='stay'?plan:plan.mode==='path'&&Array.isArray(plan.points)?plan.points[0]:null);return (t&&num(t.x)&&num(t.z)&&A.areaOf(t))||'avenue';}
 const KINDS=[
  {id:'follow-them',name:'Follow them (they lead the way)',needs:'spot',help:'The person walks to the spot you pick on the map and the player follows. They wait if the player falls behind and walk on when the player catches up. Done when both are at the spot.'},
  {id:'they-follow',name:'They follow you',needs:'spot',help:'The person follows the player (about 2 metres behind, walking or running to keep up) to the spot you pick on the map. Done when both are there.'},
  {id:'their-cab',name:'They call a cab, you ride together',needs:'stop',cab:true,help:'The person walks to the kerb and calls a street taxi to the stop you choose. The player boards with them (normal fare). Both get out at the stop; done then.'},
  {id:'shared-cab',name:'You call a cab, they ride along',needs:'stop',cab:true,help:'The person follows the player. When the player calls a taxi to the stop you choose, they get in too, and both get out at the stop; done then.'}];
 const IDS=KINDS.map(k=>k.id),CAB=new Set(['their-cab','shared-cab']),SPOT=new Set(['follow-them','they-follow']);
 const IF_LOST=[{id:'pause',name:'They stop and wait for the player'},{id:'fail',name:'The mission fails (it can be taken again)'}];
 /* wait / lost (metres): ranges and defaults; arrive: how close both must be to the spot; gap: how far behind she follows (the cat a little closer); catchUp: how far
    behind (and off-screen) she must be before she is put behind the player; lane: the line she walks along the pavement (clear of the kerb's furniture). */
 const LIMIT={wait:[3,30],lost:[15,150],def:{wait:8,lost:40,ifLost:'pause'},arrive:4,gap:2,catGap:1.2,catchUp:20,behind:3,lane:-6.6,resume:.6,cabNear:40,trail:400,crumb:.5,stopNear:20};
 /* m/s. lead: her pace while she leads. A follower matches the player's own pace (estimated from their last moves; the player walks at 3.9 m/s and sprints at 6.4,
    exploration-controller.js) plus a little to close the gap, at most `max`; above `runAbove` she plays her run clip. The cat: up to `catTrot` near, a dash when far behind. */
 const SPEED={lead:1.2,walk:1.2,runAbove:2.2,max:6.6,gain:1.6,catWalk:.55,catTrot:1.45,catDash:4.5,catDashOver:6};
 const FLAG='npcEsc';
 const num=v=>typeof v==='number'&&Number.isFinite(v);
 const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
 const kind=id=>KINDS.find(k=>k.id===id)||null;
 const movable=id=>{const X=NPX();return (X&&X.MOVABLE&&X.MOVABLE[id])||null;};
 /* Can this NPC do this kind of step? {ok, why}. */
 function can(id,k){if(!id)return {ok:false,why:'Choose who walks with the player.'};const M=movable(id);
  if(!M)return {ok:false,why:'This character cannot walk with the player yet: only characters whose walking code follows a path can (today Reverie, Lace and the street cat). Others are added as the path system grows.'};
  if(CAB.has(k)&&M.cat)return {ok:false,why:'The cat walks with the player but does not ride in cabs (it is a cat).'};
  return {ok:true,why:null};}
 /* Every cab stop and far place, with whether this NPC can go there: {id, name, quarter, far, ok, why}. */
 function stops(id,area='avenue'){const Q=QT(),M=movable(id),out=[],A=AR(),q=A&&A.get(area)?A.get(area).quarter:'avenue';if(!Q)return out;
  for(const s of Q.STOPS||[]){const ok=!!M&&!M.cat&&!!q&&s.quarter===q;
   out.push({id:s.id,name:s.name,quarter:s.quarter,far:false,ok,why:ok?null:!M?'Only for characters who can walk with the player.':M.cat?'The cat does not ride in cabs.':!q?M.name+' is placed inside The Darknet District for this mission: no taxis there.':M.name+' is placed in '+areaName(area)+' for this mission, so a cab can only take her to a stop there ('+s.name+' is in '+((Q.QUARTERS[s.quarter]||{}).name||s.quarter)+').'});}
  for(const f of Q.FAR||[])out.push({id:f.id,name:f.name,quarter:null,far:true,ok:false,why:!M?'Only for characters who can walk with the player.':M.cat?'The cat does not ride in cabs.':M.name+' stays in the city (her content rule): never the Corporate District or the Temple.'});
  return out;}
 const stopOk=(id,stop,area='avenue')=>stops(id,area).some(s=>s.id===stop&&s.ok);
 const stopPos=stop=>{const Q=QT(),s=Q&&(Q.STOPS||[]).find(x=>x.id===stop);return s?{x:s.position[0],z:s.position[1]}:null;};
 const clamp=(v,[a,b])=>Math.max(a,Math.min(b,v));
 /* The settings of a follow-them step, filled in with the defaults and kept in range. */
 function settings(o){o=o||{};const wait=num(o.wait)?clamp(o.wait,LIMIT.wait):LIMIT.def.wait;let lost=num(o.lost)?clamp(o.lost,LIMIT.lost):LIMIT.def.lost;if(lost<=wait)lost=Math.min(LIMIT.lost[1],wait+10);
  return {wait,lost,ifLost:o.ifLost==='fail'?'fail':'pause'};}
 const FIELDS={'follow-them':['to','wait','lost','ifLost'],'they-follow':['to'],'their-cab':['stop'],'shared-cab':['stop']},ALL_FIELDS=['to','wait','lost','ifLost','stop'];
 /* A step's problems in plain words (empty: fine). Used by mission-content.js check (with the same words as the server: void_runner_live_content.py escort_problems). */
 function problems(o,ctx={}){const area=ctx.area||'avenue',out=[];if(!o||!IDS.includes(o.kind))return out;const k=kind(o.kind),c=can(o.npc,o.kind);if(!c.ok){out.push(c.why);return out;}
  for(const f of ALL_FIELDS)if(o[f]!=null&&!FIELDS[o.kind].includes(f))out.push('“'+k.name+'” has no '+f+' setting.');
  if(SPOT.has(o.kind)){const t=o.to;if(!t||typeof t!=='object'||Array.isArray(t)||Object.keys(t).some(x=>x!=='x'&&x!=='z'))out.push('Pick the spot on the map.');else{const X=NPX(),pp=X?X.spotProblems(o.npc,t):[];for(const p of pp)out.push(p);const ta=!pp.length&&AR()?AR().areaOf(t):null;if(ta&&ta!==area)out.push('That spot is in '+areaName(ta)+', but '+((movable(o.npc)||{}).name||'she')+' is placed in '+areaName(area)+' for this mission: pick a spot in '+areaName(area)+' (or move her placement).');}}
  if(o.kind==='follow-them'){if(o.wait!=null&&!(num(o.wait)&&o.wait>=LIMIT.wait[0]&&o.wait<=LIMIT.wait[1]))out.push('“Waits when the player is this far behind” must be '+LIMIT.wait[0]+' to '+LIMIT.wait[1]+' metres.');
   if(o.lost!=null&&!(num(o.lost)&&o.lost>=LIMIT.lost[0]&&o.lost<=LIMIT.lost[1]))out.push('“The player is lost beyond” must be '+LIMIT.lost[0]+' to '+LIMIT.lost[1]+' metres.');
   const s=settings(o);if(num(o.lost)&&num(o.wait)&&o.lost<=o.wait)out.push('“The player is lost beyond” must be further than “waits when the player is this far behind” ('+s.wait+' m).');
   if(o.ifLost!=null&&!IF_LOST.some(x=>x.id===o.ifLost))out.push('If the player gets lost: choose “stop and wait” or “the mission fails”.');}
  if(CAB.has(o.kind)){if(typeof o.stop!=='string'||!o.stop)out.push('Choose the cab stop.');else{const s=stops(o.npc,area).find(x=>x.id===o.stop);if(!s)out.push('“'+o.stop+'” is not a cab stop.');else if(!s.ok)out.push(s.why);}}
  return out;}
 /* What is still missing (for "Guide me" and the play check): [{text, key}] with mission-editor.js NEED_SEL keys. */
 function needs(o,ctx={}){if(!o||!IDS.includes(o.kind))return [];if(!o.npc)return [{text:'choose who walks with the player',key:'step-npc'}];const c=can(o.npc,o.kind);if(!c.ok)return [{text:c.why,key:'step-npc'}];
  if(SPOT.has(o.kind)&&!(o.to&&num(o.to.x)&&num(o.to.z)))return [{text:'pick the spot on the map',key:'step-spot'}];if(CAB.has(o.kind)&&!o.stop)return [{text:'choose the cab stop',key:'step-stop'}];
  const p=problems(o,ctx);return p.length?[{text:p[0],key:SPOT.has(o.kind)?'step-spot':'step-stop'}]:[];}
 /* Named spots for the "Make a mission" wizard: just in front of each shop on the NPC's pavement, where allowed. */
 function spots(id,area=placedArea(id)){const A=AR(),X=NPX(),M=movable(id);if(!A||!X||!M)return [];
  return A.places().filter(p=>p.area===area&&!X.spotProblems(id,p).length).map(p=>({id:p.id,name:p.name.replace(/^in front of /,'Outside ').replace(/\s*\([^)]*\)$/,''),x:p.x,z:p.z}));}
 /* Her walk on the pavement from a to b: onto the walking line, along it, then to the spot (straight lines, clear of the kerb's furniture). */
 function route(a,b,area='avenue'){const L=LIMIT.lane,pts=[],A=AR();
  // away from the Avenue's north pavement: a straight walk when it stays on walkable ground, else round one corner (npc-areas.js leg)
  if(A&&(area!=='avenue'||a.z<-8||b.z<-8)){if(!A.leg(a,b).length)return [{x:b.x,z:b.z}];for(const c of [{x:b.x,z:a.z},{x:a.x,z:b.z}])if(!A.leg(a,c).length&&!A.leg(c,b).length)return [c,{x:b.x,z:b.z}];return [{x:b.x,z:b.z}];}
  if(Math.abs(a.x-b.x)<1.2)return [{x:b.x,z:b.z}];if(Math.abs(a.z-L)>.05)pts.push({x:a.x,z:L});pts.push({x:b.x,z:L});if(Math.abs(b.z-L)>.05)pts.push({x:b.x,z:b.z});return pts;}
 const turnTo=(st,want,dt,rate=4)=>{const dy=Math.atan2(Math.sin(want-st.yaw),Math.cos(want-st.yaw));st.yaw+=dy*Math.min(1,dt*rate);};
 const face=(st,p,dt)=>{if(p&&dist(p,st)>.05)turnTo(st,Math.atan2(p.x-st.x,p.z-st.z),dt);};
 /* Moves st toward p at speed v for dt; returns true on arrival. */
 function stepTo(st,p,v,dt){const dx=p.x-st.x,dz=p.z-st.z,d=Math.hypot(dx,dz),s=v*dt;if(d<=s+.02){st.x=p.x;st.z=p.z;return true;}st.x+=dx/d*s;st.z+=dz/d*s;st.yaw=Math.atan2(dx,dz);return false;}
 /* FOLLOW THEM, one step. st: {x, z, yaw, phase, route, ri} (changed in place). inp: {me: {x, z} (the mission player) or null, to: {x, z}, set: the step's settings,
    dt, cat}. Phases: ready (waiting for the player to come within `wait`) -> walk <-> wait (player behind) ; paused (player lost, ifLost pause) ; there (at the spot,
    waiting for the player) -> done ; failed (player lost, ifLost fail). Returns the new phase when it changed (else null). st.clip: 'walk' / 'idle'; st.speed: m/s. */
 function lead(st,inp){const S=settings(inp.set),me=inp.me,to=inp.to,dt=inp.dt||0,d=me?dist(me,st):Infinity;let ev=null;const go=p=>{if(st.phase!==p){st.phase=p;ev=p;}};
  if(!st.phase)st.phase='ready';st.speed=0;st.clip='idle';if(st.phase==='done'||st.phase==='failed')return null;
  if(!st.route||st.routeFor!==to.x+','+to.z){st.route=route(st,to,inp.area);st.ri=0;st.routeFor=to.x+','+to.z;}
  const atSpot=st.ri>=st.route.length;
  if(st.phase!=='ready'&&d>S.lost){if(S.ifLost==='fail'){go('failed');return ev;}go('paused');}
  else if(st.phase==='ready'){if(d<=S.wait)go(atSpot?'there':'walk');}
  else if(st.phase==='paused'||st.phase==='wait'){if(d<=Math.max(2,S.wait*LIMIT.resume))go(atSpot?'there':'walk');}
  else if(st.phase==='walk'&&d>S.wait)go('wait');
  if(st.phase==='walk'){const v=(inp.cat?SPEED.catTrot:SPEED.lead);st.speed=v;st.clip='walk';if(stepTo(st,st.route[st.ri],v,dt)){st.ri++;if(st.ri>=st.route.length)go('there');}}
  else face(st,me,dt);
  if(st.phase==='there'&&me&&dist(me,to)<=LIMIT.arrive)go('done');
  return ev;}
 /* The player's trail (walkable by definition): {pts:[{x,z}], shifted}. A point is added when the player has moved half a metre. */
 function trailPush(tr,p){if(!p||!num(p.x)||!num(p.z))return;const l=tr.pts[tr.pts.length-1];if(l&&Math.hypot(l.x-p.x,l.z-p.z)<LIMIT.crumb)return;tr.pts.push({x:p.x,z:p.z});if(tr.pts.length>LIMIT.trail){tr.pts.shift();tr.shifted=(tr.shifted||0)+1;}}
 /* A point on the trail about `m` metres behind its end (the player). */
 function behind(tr,m){const p=tr.pts;if(!p.length)return null;let acc=0;for(let i=p.length-1;i>0;i--){const s=dist(p[i],p[i-1]);if(acc+s>=m){const k=(m-acc)/s;return {x:p[i].x+(p[i-1].x-p[i].x)*k,z:p[i].z+(p[i-1].z-p[i].z)*k,i:i-1};}acc+=s;}return {x:p[0].x,z:p[0].z,i:0};}
 /* THEY FOLLOW YOU (and the "ride along" part of shared-cab), one step. inp: {me, trail, to (or null: just follow), seen (is she on screen), dt, cat, set}. Phases: ready (until
    the player comes within `wait` of her) -> follow -> done (both at `to`). Events: 'follow', 'caught-up' (put behind the player while off-screen), 'done'. */
 function follow(st,inp){const me=inp.me,tr=inp.trail,dt=inp.dt||0,cat=!!inp.cat,gap=cat?LIMIT.catGap:LIMIT.gap,S=settings(inp.set);let ev=null;const go=p=>{if(st.phase!==p){st.phase=p;ev=p;}};
  if(!st.phase)st.phase='ready';st.speed=0;st.clip='idle';if(st.phase==='done'||!me)return null;
  const d=dist(me,st);
  if(st.phase==='ready'){if(d<=S.wait){go('follow');tr.pts.length=0;tr.shifted=0;st.ti=0;st.tShift=0;trailPush(tr,st);trailPush(tr,me);}else{face(st,me,dt);return ev;}}
  // the player's pace (smoothed), from how far they moved since the last step
  if(st.lastMe&&dt>0){const v=Math.min(10,dist(me,st.lastMe)/dt);st.meV=(st.meV||0)+(v-(st.meV||0))*Math.min(1,dt*4);}st.lastMe={x:me.x,z:me.z};
  if(st.tShift!==(tr.shifted||0)){st.ti=Math.max(0,(st.ti||0)-((tr.shifted||0)-(st.tShift||0)));st.tShift=tr.shifted||0;}
  if(d>LIMIT.catchUp&&inp.seen===false){const b=behind(tr,LIMIT.behind);if(b){st.x=b.x;st.z=b.z;st.ti=b.i+1;st.yaw=Math.atan2(me.x-b.x,me.z-b.z);ev='caught-up';}}
  else if(d>gap){const p=tr.pts;let i=Math.min(st.ti||0,p.length-1);while(i<p.length-1&&dist(p[i],st)<.35)i++;st.ti=i;
   // straight to the player when the trail's next crumb is further than the player (a trail that loops back)
   const t=p[i]&&dist(p[i],me)<d?p[i]:me,want=(st.meV||0)+(d-gap)*SPEED.gain,cap=cat?(d>SPEED.catDashOver?SPEED.catDash:SPEED.catTrot):SPEED.max;
   st.speed=Math.max(0,Math.min(cap,Math.max(want,Math.min(cap,cat?SPEED.catWalk:SPEED.walk)*Math.min(1,(d-gap)/.6))));st.clip=st.speed>SPEED.runAbove?'run':'walk';stepTo(st,t,st.speed,dt);if(dist(me,st)<gap)face(st,me,dt);}
  else face(st,me,dt);
  if(inp.to&&dist(me,inp.to)<=LIMIT.arrive&&dist(st,inp.to)<=LIMIT.arrive+gap+1){go('done');}
  return ev;}
 /* The kerb point she calls a cab from: the edge of the pavement in front of her, clear of the kerb's furniture (npc-paths.js OBSTACLES). */
 function kerb(p,area='avenue'){const AA=AR(),Q=QT();
  // in another quarter: the taxi pole nearest to her (ncz-quarters.js CALL_POINTS), she stands beside it and calls the cab to its stop
  if(AA&&area!=='avenue'&&AA.get(area)){const q=AA.get(area).quarter,cs=((Q&&Q.CALL_POINTS)||[]).filter(c=>c.quarter===q&&c.stop).sort((u,v)=>Math.hypot(u.post[0]-p.x,u.post[1]-p.z)-Math.hypot(v.post[0]-p.x,v.post[1]-p.z));
   const c=cs[0];if(c){const at=AA.nearest({x:c.post[0],z:c.post[1]},area,4)||{x:c.post[0],z:c.post[1]},s=Q.STOPS.find(x=>x.id===c.stop);return {x:at.x,z:at.z,call:s?{x:s.position[0],z:s.position[1]}:{x:c.post[0],z:c.post[1]}};}}
  const X=NPX(),A=(X&&X.AREAS&&X.AREAS['avenue-north'])||{x0:12.5,x1:141.5};let x=clamp(p.x,[A.x0+1,A.x1-1]);
  for(const o of (X&&X.OBSTACLES)||[])if(x>o[0]-.6&&x<o[1]+.6)x=(x-o[0]<o[1]-x?o[0]-.7:o[1]+.7);return {x,z:-7.2};}
 /* A CAB STEP, one step (their-cab or shared-cab). inp: {kind, stop, me, walking (the player is on foot), riding (the player is in a cab), job: the player's street-taxi
    job {phase (the cab's), dest, released, cab:{x,z,yaw}, doors:[{x,z}]} or null, seen, trail, dt, set}. st.want: 'hail' when she wants road-taxi.js to call her cab (the
    caller sets st.hailed / st.retry). Phases: ready -> kerb -> hail -> to-cab -> in-cab -> out -> done (their-cab); ready -> follow -> to-cab -> in-cab -> out -> done
    (shared-cab). A cab that leaves without the player: she gets out and calls again (their-cab) or follows again (shared-cab). Events as phase names, plus 'wrong-stop'. */
 function cab(st,inp){let ev=null;const go=p=>{if(st.phase!==p){st.phase=p;ev=p;}};const me=inp.me,job=inp.job&&!inp.job.released?inp.job:null,dt=inp.dt||0,S=settings(inp.set);
  if(!st.phase)st.phase='ready';st.speed=0;st.clip='idle';st.want=null;if(st.phase==='done')return null;
  const mine=!!job&&job.dest===inp.stop,d=me?dist(me,st):Infinity;
  if(st.phase==='in-cab'){st.clip='sit';if(job){if(job.phase==='arrived')st.arrived=true;return ev;}   // riding
   // the trip is over: out of the cab together where it stopped (she arrived), or the cab went without the player
   st.out=true;if(st.arrived&&inp.walking){go('out');return ev;}if(!st.arrived){st.arrived=false;go(inp.kind==='their-cab'?'kerb':'follow');st.retry=3;return ev;}return ev;}
  if(st.phase==='out'){go('done');return ev;}
  if(inp.kind==='shared-cab'){
   if(st.phase==='ready'||st.phase==='follow'){const e=follow(st.f||(st.f={x:st.x,z:st.z,yaw:st.yaw}),{me,trail:inp.trail,to:null,seen:inp.seen,dt,set:inp.set});Object.assign(st,{x:st.f.x,z:st.f.z,yaw:st.f.yaw,speed:st.f.speed,clip:st.f.clip});if(e==='follow')go('follow');else if(e==='caught-up')ev='caught-up';
    if(job&&!mine&&st.wrongFor!==job.id){st.wrongFor=job.id;ev='wrong-stop';}
    if(mine&&st.phase==='follow'&&inp.riding&&d<=LIMIT.cabNear){st.arrived=false;go('in-cab');st.clip='sit';return ev;}   // the player got in first: she gets in too
    if(mine&&job.phase==='waiting'&&st.phase==='follow')go('to-cab');return ev;}}
  if(inp.kind==='their-cab'){
   if(st.phase==='ready'){face(st,me,dt);if(d<=S.wait)go('kerb');return ev;}
   if(st.phase==='kerb'){const k=kerb(st,inp.area);if(st.retry>0){st.retry-=dt;face(st,me,dt);return ev;}st.clip='walk';st.speed=SPEED.walk;if(stepTo(st,k,SPEED.walk,dt)){st.clip='idle';st.speed=0;st.retry=0;go('hail');}return ev;}
   if(st.phase==='hail'){turnTo(st,Math.PI,dt);if(mine){go(job.phase==='waiting'?'to-cab':'hail');return ev;}if((st.retry-=dt)<=0){st.want='hail';st.retry=4;}return ev;}}
  if(st.phase==='to-cab'){if(!mine){go(inp.kind==='their-cab'?'kerb':'follow');st.retry=2;return ev;}
   if(inp.riding&&d<=LIMIT.cabNear){st.arrived=false;go('in-cab');st.clip='sit';return ev;}
   if(job.phase!=='waiting'){return ev;}const doors=job.doors||[],door=doors.slice(0,2).sort((a,b)=>dist(a,st)-dist(b,st))[0];if(!door)return ev;
   st.clip='walk';st.speed=SPEED.walk;if(stepTo(st,door,SPEED.walk*1.5,dt)){st.arrived=false;go('in-cab');st.clip='sit';}return ev;}
  return ev;}
 /* The steps a running mission wants now: given the step record (mission-content.js escortNow), the plan key for npc-paths / ncz-street-pair. */
 const keyOf=e=>'esc:'+e.key+':'+e.kind+':'+(e.to?e.to.x+','+e.to.z:e.stop||'');
 /* story.flags.npcEsc: '<mission>/<step>|<phase>|<x>|<z>' (under 200 characters). */
 function encode(e){if(!e||typeof e.key!=='string')return null;const s=[e.key.slice(0,150),String(e.phase||'').replace(/[^a-z-]/g,'').slice(0,12),num(e.x)?e.x.toFixed(1):'',num(e.z)?e.z.toFixed(1):''].join('|');return s.length<200?s:null;}
 function decode(v){if(typeof v!=='string')return null;const [key,phase,x,z]=v.split('|');if(!key)return null;const out={key,phase:phase||null};if(x!==''&&x!=null&&Number.isFinite(+x)&&z!==''&&z!=null&&Number.isFinite(+z)){out.x=+x;out.z=+z;}return out;}
 /* For the admin inventory (the server's copy of these rules: void_runner_live_content.py escort_problems). */
 function inventory(){const X=NPX(),out={},ids=(AR()&&AR().IDS)||['avenue'];for(const id of Object.keys((X&&X.MOVABLE)||{}))out[id]={stops:stops(id).filter(s=>s.ok).map(s=>s.id),stopsByArea:Object.fromEntries(ids.map(a=>[a,stops(id,a).filter(s=>s.ok).map(s=>s.id)])),cab:can(id,'their-cab').ok};
  return {kinds:IDS.slice(),fields:FIELDS,limits:{wait:LIMIT.wait,lost:LIMIT.lost,def:LIMIT.def},ifLost:IF_LOST.map(x=>x.id),npcs:out};}
 const api={placedArea,draftPlans:null,KINDS,IDS,CAB,SPOT,IF_LOST,LIMIT,SPEED,FLAG,FIELDS,kind,can,stops,stopOk,stopPos,settings,problems,needs,spots,route,lead,trailPush,behind,follow,kerb,cab,keyOf,encode,decode,inventory};
 if(node)module.exports=api;else root.VoidNPCEscort=api;
})(typeof globalThis!=='undefined'?globalThis:this);
