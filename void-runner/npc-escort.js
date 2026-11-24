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
   WHERE: the step STARTS in the area where she is placed (placedArea; npc-areas.js, since 19 Nov 2026 anywhere walkable in the city). Since 20 Nov 2026 (ACROSS, below) the
   spot may be in any area she can walk to from there: she comes through the city gates, the stairs to and from the tunnels and the District's door with the player, walking
   or in a taxi. A cab is called in her area (it must have taxis) to any stop of the city (through the gates' bays); the Corporate District and the Temple are greyed with the
   reason (Reverie / Lace: city only). The cat walks (through the gates too) but never goes inside or down into the tunnels, and does not ride in cabs.
   MULTIPLAYER: the street is not shared (each player's own copy of the street pair): only the mission player's NPC follows them; other players see her as usual.
   SAVE: nothing new in the save shape. While a step runs, story.flags.npcEsc holds '<mission>/<step>|<phase>|<x>|<z>' (a string under 200 characters, which clean_save()
   accepts) so a reload puts her back where she was; it is removed when the step ends.
   INTO A PLACE (the owner, 20 Nov 2026: "For the follow options if I add an apartment there should be an option to follow into the apartment"): a follow-them or they-follow
   step may end in one of the mission's own places instead of a street spot: `apt` (an apartment or a location of the mission) and, for a location built from modules, `mod`
   (the room; none: anywhere inside). On the street she walks to the place's street door; inside she goes room to room with the player (npc-escort-indoors.js). The rules
   (intoProblems, roomGraph, roomPath, crossing, insideDone, gridRoute) are below; a fifth field 'in' in story.flags.npcEsc marks a step that had gone inside. */
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
  {id:'follow-them',name:'Follow them (they lead the way)',needs:'spot',help:'The person walks to the spot you pick on the map (or into one of this mission’s places: an apartment, a room of a location) and the player follows. They wait if the player falls behind and walk on when the player catches up. Done when both are at the spot (or both inside the room).'},
  {id:'they-follow',name:'They follow you',needs:'spot',help:'The person follows the player (about 6 ft behind, walking or running to keep up) to the spot you pick on the map (or into one of this mission’s places). Done when both are there.'},
  {id:'their-cab',name:'They call a cab, you ride together',needs:'stop',cab:true,help:'The person walks to the kerb and calls a street taxi to the stop you choose. The player boards with them (normal fare). Both get out at the stop; done then.'},
  {id:'shared-cab',name:'You call a cab, they ride along',needs:'stop',cab:true,help:'The person follows the player. When the player calls a taxi to the stop you choose, they get in too, and both get out at the stop; done then.'}];
 const IDS=KINDS.map(k=>k.id),CAB=new Set(['their-cab','shared-cab']),SPOT=new Set(['follow-them','they-follow']);
 const IF_LOST=[{id:'pause',name:'They stop and wait for the player'},{id:'fail',name:'The mission fails (it can be taken again)'}];
 /* wait / lost (metres): ranges and defaults; arrive: how close both must be to the spot; gap: how far behind she follows (the cat a little closer); catchUp: how far
    behind (and off-screen) she must be before she is put behind the player; lane: the line she walks along the pavement (clear of the kerb's furniture). */
 const LIMIT={wait:[3,30],lost:[15,150],def:{wait:8,lost:40,ifLost:'pause'},arrive:4,rearm:6,gap:2,catGap:1.2,catchUp:20,behind:3,lane:-6.6,resume:.6,cabNear:40,trail:400,crumb:.5,stopNear:20};
 /* m/s. lead: her pace while she leads. A follower matches the player's own pace (estimated from their last moves; the player walks at 3.9 m/s and sprints at 6.4,
    exploration-controller.js) plus a little to close the gap, at most `max`; above `runAbove` she plays her run clip. The cat: up to `catTrot` near, a dash when far behind. */
 const SPEED={lead:1.2,walk:1.2,runAbove:2.2,max:6.6,gain:1.6,catWalk:.55,catTrot:1.45,catDash:4.5,catDashOver:6};
 const FLAG='npcEsc';
 const num=v=>typeof v==='number'&&Number.isFinite(v);
 const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
 const kind=id=>KINDS.find(k=>k.id===id)||null;
 const movable=id=>{const X=NPX();const m=X?.MOVABLE?.[id];return m&&!m.placementOnly?m:null;};
 /* Can this NPC do this kind of step? {ok, why}. */
 function can(id,k){if(!id)return {ok:false,why:'Choose who walks with the player.'};const M=movable(id);
  if(!M)return {ok:false,why:'This character cannot walk with the player yet: only characters whose walking code follows a path can (today Reverie, Lace and the street cat). Others are added as the path system grows.'};
  if(CAB.has(k)&&M.cat)return {ok:false,why:'The cat walks with the player but does not ride in cabs (it is a cat).'};
  if(CAB.has(k)&&M.made)return {ok:false,why:M.name+' walks with the player, but riding a cab together works only with Reverie or Lace for now (a made character walks: use “Follow them” or “They follow you”).'};
  return {ok:true,why:null};}
 /* Every cab stop and far place, with whether this NPC can go there: {id, name, quarter, far, ok, why}. */
 function stops(id,area='avenue'){const Q=QT(),M=movable(id),out=[],A=AR(),q=A&&A.get(area)?A.get(area).quarter:'avenue';if(!Q)return out;
  // (20 Nov 2026, escort across) the cab drives through the gates' bays like the player's own: any stop of the city, as long as her area has taxis (she calls it there)
  const taxis=!!q&&(Q.STOPS||[]).some(s=>s.quarter===q);
  for(const s of Q.STOPS||[]){const ok=!!M&&!M.cat&&!M.made&&taxis;
   out.push({id:s.id,name:s.name,quarter:s.quarter,far:false,ok,why:ok?null:!M?'Only for characters who can walk with the player.':M.cat?'The cat does not ride in cabs.':M.made?'Cab rides: only Reverie or Lace for now.':!q?M.name+' is placed inside The Darknet District for this mission: no taxis there.':M.name+' is placed in '+areaName(area)+' for this mission: no taxis run there, so she cannot call one.'});}
  for(const f of Q.FAR||[])out.push({id:f.id,name:f.name,quarter:null,far:true,ok:false,why:!M?'Only for characters who can walk with the player.':M.cat?'The cat does not ride in cabs.':M.name+' stays in the city (her content rule): never the Corporate District or the Temple.'});
  return out;}
 const stopOk=(id,stop,area='avenue')=>stops(id,area).some(s=>s.id===stop&&s.ok);
 const stopPos=stop=>{const Q=QT(),s=Q&&(Q.STOPS||[]).find(x=>x.id===stop);return s?{x:s.position[0],z:s.position[1]}:null;};
 const clamp=(v,[a,b])=>Math.max(a,Math.min(b,v));
 /* The settings of a follow-them step, filled in with the defaults and kept in range. */
 function settings(o){o=o||{};const wait=num(o.wait)?clamp(o.wait,LIMIT.wait):LIMIT.def.wait;let lost=num(o.lost)?clamp(o.lost,LIMIT.lost):LIMIT.def.lost;if(lost<=wait)lost=Math.min(LIMIT.lost[1],wait+10);
  return {wait,lost,ifLost:o.ifLost==='fail'?'fail':'pause'};}
 const FIELDS={'follow-them':['to','apt','mod','wait','lost','ifLost'],'they-follow':['to','apt','mod'],'their-cab':['stop'],'shared-cab':['stop']},ALL_FIELDS=['to','apt','mod','wait','lost','ifLost','stop'];
 /* A step's problems in plain words (empty: fine). Used by mission-content.js check (with the same words as the server: void_runner_live_content.py escort_problems). */
 function problems(o,ctx={}){const area=ctx.area||'avenue',out=[];if(!o||!IDS.includes(o.kind))return out;const k=kind(o.kind),c=can(o.npc,o.kind);if(!c.ok){out.push(c.why);return out;}
  for(const f of ALL_FIELDS)if(o[f]!=null&&!FIELDS[o.kind].includes(f))out.push('“'+k.name+'” has no '+f+' setting.');
  if(SPOT.has(o.kind)&&(o.apt!=null||o.mod!=null)){for(const p of intoProblems(o,ctx))out.push(p);}
  else if(SPOT.has(o.kind)){const t=o.to;if(!t||typeof t!=='object'||Array.isArray(t)||Object.keys(t).some(x=>x!=='x'&&x!=='z'))out.push('Pick the spot on the map.');else{const X=NPX(),pp=X?X.spotProblems(o.npc,t):[];for(const p of pp)out.push(p);const ta=!pp.length&&AR()?AR().areaOf(t):null,rw=ta&&ta!==area?reachWhy(o.npc,area,ta):null;if(rw)out.push(rw);}}   // (20 Nov 2026) another area is fine when she can walk there (through the gates, the stairs, the District's door)
  if(o.kind==='follow-them'){if(o.wait!=null&&!(num(o.wait)&&o.wait>=LIMIT.wait[0]&&o.wait<=LIMIT.wait[1]))out.push('“Waits when the player is this far behind” must be '+LIMIT.wait[0]+' to '+LIMIT.wait[1]+' metres.');
   if(o.lost!=null&&!(num(o.lost)&&o.lost>=LIMIT.lost[0]&&o.lost<=LIMIT.lost[1]))out.push('“The player is lost beyond” must be '+LIMIT.lost[0]+' to '+LIMIT.lost[1]+' metres.');
   const s=settings(o);if(num(o.lost)&&num(o.wait)&&o.lost<=o.wait)out.push('“The player is lost beyond” must be further than “waits when the player is this far behind” ('+s.wait+' m).');
   if(o.ifLost!=null&&!IF_LOST.some(x=>x.id===o.ifLost))out.push('If the player gets lost: choose “stop and wait” or “the mission fails”.');}
  if(CAB.has(o.kind)){if(typeof o.stop!=='string'||!o.stop)out.push('Choose the cab stop.');else{const s=stops(o.npc,area).find(x=>x.id===o.stop);if(!s)out.push('“'+o.stop+'” is not a cab stop.');else if(!s.ok)out.push(s.why);}}
  return out;}
 /* What is still missing (for "Guide me" and the play check): [{text, key}] with mission-editor.js NEED_SEL keys. */
 function needs(o,ctx={}){if(!o||!IDS.includes(o.kind))return [];if(!o.npc)return [{text:'choose who walks with the player',key:'step-npc'}];const c=can(o.npc,o.kind);if(!c.ok)return [{text:c.why,key:'step-npc'}];
  if(SPOT.has(o.kind)&&o.apt==null&&o.mod==null&&!(o.to&&num(o.to.x)&&num(o.to.z)))return [{text:'pick the spot on the map (or a place of this mission to go into)',key:'step-spot'}];if(CAB.has(o.kind)&&!o.stop)return [{text:'choose the cab stop',key:'step-stop'}];
  const p=problems(o,ctx);return p.length?[{text:p[0],key:SPOT.has(o.kind)?(o.apt!=null||o.mod!=null?'step-into':'step-spot'):'step-stop'}]:[];}
 /* Named spots for the "Make a mission" wizard: just in front of each shop on the NPC's pavement, where allowed. */
 function spots(id,area=placedArea(id)){const A=AR(),X=NPX(),M=movable(id);if(!A||!X||!M)return [];
  return A.places().filter(p=>p.area===area&&!X.spotProblems(id,p).length).map(p=>({id:p.id,name:p.name.replace(/^in front of /,'Outside ').replace(/\s*\([^)]*\)$/,''),x:p.x,z:p.z}));}
 /* Her walk on the pavement from a to b: onto the walking line, along it, then to the spot (straight lines, clear of the kerb's furniture). */
 function route(a,b,area='avenue'){const L=LIMIT.lane,pts=[],A=AR();
  // away from the Avenue's north pavement: a straight walk when it stays on walkable ground, else round one corner (npc-areas.js leg), else along the pavements (walkRoute)
  // (night QA 20 Nov 2026: the back alleys behind the Avenue's north side are north of z -5 too; a walk from or to one went straight through the buildings to the lane)
  if(A&&(area!=='avenue'||a.z<-8||b.z<-8||a.z>-4.9||b.z>-4.9)){if(!A.leg(a,b).length)return [{x:b.x,z:b.z}];for(const c of [{x:b.x,z:a.z},{x:a.x,z:b.z}])if(!A.leg(a,c).length&&!A.leg(c,b).length)return [c,{x:b.x,z:b.z}];return walkRoute(a,b,area)||[{x:b.x,z:b.z}];}
  if(Math.abs(a.x-b.x)<1.2)return [{x:b.x,z:b.z}];if(Math.abs(a.z-L)>.05)pts.push({x:a.x,z:L});pts.push({x:b.x,z:L});if(Math.abs(b.z-L)>.05)pts.push({x:b.x,z:b.z});return pts;}
 /* ALONG THE PAVEMENTS (fix 19 Nov 2026: a spot she could not reach in a straight line or round one corner was walked to in a straight line, through shopfronts and across
    the road at a slant): a search over a half-metre grid of the area's walkable ground (npc-areas.js check), the road allowed only where it must be crossed (each metre of road
    costs ROAD metres, so she crosses where it is narrowest, straight over), then shortened to straight legs that add no road. Returns the points after a, ending at b, or
    null (no way within the search box). */
 const ROAD=8,GRID=.5,MAXN=30000,XWALK=1.2,XW=()=>node?require('./crosswalks.js'):root.VoidCrosswalks;   // a crosswalk (crosswalks.js, 20 Nov 2026) costs little more than pavement: she crosses there
 function walkRoute(a,b,area){const A=AR();if(!A||!a||!b)return null;const G=(A.get(area)||{}).under?.25:GRID,memo=new Map(),c2=v=>Math.floor(v/G);
  const ar=A.get(area),inn=(r,x,z)=>x>r.x0&&x<r.x1&&z>r.z0&&z<r.z1;   // the kerb (the street's floor between the pavement and the road, not a forbidden place) counts as road
  const cost=(i,j)=>{const k=i*100003+j;let v=memo.get(k);if(v===undefined){const x=(i+.5)*G,z=(j+.5)*G,c=A.check({x,z},area,undefined,{passing:true});v=c.ok&&c.area===area?1:XW()?.at?.(x,z,null,-.25)?XWALK:(c.kind==='road'&&c.area===area)||(c.kind==='blocked'&&ar&&!ar.under&&ar.floors.some(f=>inn(f,x,z))&&!ar.no.some(f=>inn(f,x,z))&&!(ar.obstacles||[]).some(o=>x>o[0]&&x<o[1]&&z>o[2]&&z<o[3]))?ROAD:0;memo.set(k,v);}return v;};
  const pad=30/G,i0=Math.min(c2(a.x),c2(b.x))-pad,i1=Math.max(c2(a.x),c2(b.x))+pad,j0=Math.min(c2(a.z),c2(b.z))-pad,j1=Math.max(c2(a.z),c2(b.z))+pad;
  const near=p=>{const ci=c2(p.x),cj=c2(p.z);let best=null,bd=Infinity;for(let di=-4;di<=4;di++)for(let dj=-4;dj<=4;dj++){const i=ci+di,j=cj+dj;if(cost(i,j)!==1)continue;const d=Math.hypot((i+.5)*G-p.x,(j+.5)*G-p.z);if(d<bd){bd=d;best=[i,j];}}return best;};
  const s0=near(a),s1=near(b);if(!s0||!s1)return null;const key=(i,j)=>(i-i0)*((j1-j0)+1)+(j-j0),goal=key(s1[0],s1[1]);
  const g=new Map(),from=new Map(),heap=[];const h=(i,j)=>Math.hypot(i-s1[0],j-s1[1]);
  const push=(f,k,i,j)=>{heap.push([f,k,i,j]);let n=heap.length-1;while(n>0){const p=(n-1)>>1;if(heap[p][0]<=heap[n][0])break;[heap[p],heap[n]]=[heap[n],heap[p]];n=p;}};
  const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let n=0;for(;;){const l=2*n+1,r=l+1;let m=n;if(l<heap.length&&heap[l][0]<heap[m][0])m=l;if(r<heap.length&&heap[r][0]<heap[m][0])m=r;if(m===n)break;[heap[m],heap[n]]=[heap[n],heap[m]];n=m;}}return top;};
  const k0=key(s0[0],s0[1]);g.set(k0,0);push(h(s0[0],s0[1]),k0,s0[0],s0[1]);let n=0,found=false;
  while(heap.length&&n++<MAXN){const [,k,i,j]=pop();if(k===goal){found=true;break;}const gk=g.get(k);
   for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const ni=i+di,nj=j+dj;if(ni<i0||ni>i1||nj<j0||nj>j1)continue;const c=cost(ni,nj);if(!c)continue;if(di&&dj&&(!cost(i+di,j)||!cost(i,j+dj)))continue;
    const nk=key(ni,nj),ng=gk+Math.hypot(di,dj)*(c+cost(i,j))/2;if(ng<(g.has(nk)?g.get(nk):Infinity)){g.set(nk,ng);from.set(nk,[k,i,j]);push(ng+h(ni,nj),nk,ni,nj);}}}
  if(!found)return null;const cells=[];for(let k=goal,i=s1[0],j=s1[1];;){cells.unshift({x:(i+.5)*G,z:(j+.5)*G});const f=from.get(k);if(!f)break;[k,i,j]=f;}
  const P=[{x:a.x,z:a.z},...cells,{x:b.x,z:b.z}];
  // road metres up to each point of the grid path; a straight leg may replace a stretch of it when every step is walkable (or road) and it adds no road
  const roadAt=p=>{const c=cost(c2(p.x),c2(p.z)),k=A.check(p,area,undefined,{passing:true});return k.ok&&k.area===area?0:c===ROAD?1:c===XWALK?0:-1;},acc=[0];for(let k=1;k<P.length;k++){const d=dist(P[k],P[k-1]);acc.push(acc[k-1]+(roadAt(P[k])===1||roadAt(P[k-1])===1?d:0));}
  const clear=(u,v)=>{const p=P[u],q=P[v],d=dist(p,q),m=Math.max(1,Math.ceil(d/.2));let road=0;for(let t=0;t<=m;t++){const r=roadAt({x:p.x+(q.x-p.x)*t/m,z:p.z+(q.z-p.z)*t/m});if(r<0)return false;if(r)road+=d/m;}return road<=acc[v]-acc[u]+.3;};
  const out=[];for(let u=0;u<P.length-1;){let v=P.length-1;while(v>u+1&&!clear(u,v))v--;out.push({x:+P[v].x.toFixed(2),z:+P[v].z.toFixed(2)});u=v;}
  out[out.length-1]={x:b.x,z:b.z};return out;}
 const turnTo=(st,want,dt,rate=4)=>{const dy=Math.atan2(Math.sin(want-st.yaw),Math.cos(want-st.yaw));st.yaw+=dy*Math.min(1,dt*rate);};
 const face=(st,p,dt)=>{if(p&&dist(p,st)>.05)turnTo(st,Math.atan2(p.x-st.x,p.z-st.z),dt);};
 /* Moves st toward p at speed v for dt; returns true on arrival. */
 function stepTo(st,p,v,dt){const dx=p.x-st.x,dz=p.z-st.z,d=Math.hypot(dx,dz),s=v*dt;if(d<=s+.02){st.x=p.x;st.z=p.z;return true;}st.x+=dx/d*s;st.z+=dz/d*s;st.yaw=Math.atan2(dx,dz);if(!node)root.VoidCrosswalks?.mark?.(st,st.x,st.z);return false;}
 /* FOLLOW THEM, one step. st: {x, z, yaw, phase, route, ri} (changed in place). inp: {me: {x, z} (the mission player) or null, to: {x, z}, set: the step's settings,
    dt, cat}. Phases: ready (waiting for the player to come within `wait`) -> walk <-> wait (player behind) ; paused (player lost, ifLost pause) ; there (at the spot,
    waiting for the player) -> done ; failed (player lost, ifLost fail). Returns the new phase when it changed (else null). st.clip: 'walk' / 'idle'; st.speed: m/s. */
 function lead(st,inp){const S=settings(inp.set),me=inp.me,to=inp.to,dt=inp.dt||0,d=me?dist(me,st):Infinity;let ev=null;const go=p=>{if(st.phase!==p){st.phase=p;ev=p;}};
  if(!st.phase)st.phase='ready';st.speed=0;st.clip='idle';if(st.phase==='done'||st.phase==='failed')return null;
  if(st.phase==='in')return null;   // into a place: she has gone in through its street door (npc-escort-indoors.js takes her from there)
  const rk=inp.route?inp.routeKey:to.x+','+to.z;if(!st.route||st.routeFor!==rk){const had=!!st.route;st.route=inp.route?inp.route.slice():route(st,to,inp.area);st.ri=0;st.routeFor=rk;if(had&&st.phase==='there'&&st.route.length)st.phase=me&&d<=S.wait?'walk':'wait';}
  const atSpot=st.ri>=st.route.length;
  if(st.phase==='enter'){st.speed=SPEED.lead;st.clip='walk';if(stepTo(st,inp.door,SPEED.lead,dt))go('in');return ev;}
  if(st.phase!=='ready'&&d>S.lost){if(S.ifLost==='fail'){go('failed');return ev;}go('paused');}
  else if(st.phase==='ready'){if(d<=S.wait)go(atSpot?'there':'walk');}
  else if(st.phase==='paused'||st.phase==='wait'){if(d<=Math.max(2,S.wait*LIMIT.resume))go(atSpot?'there':'walk');}
  else if(st.phase==='walk'&&d>S.wait)go('wait');
  if(st.phase==='walk'){const v=(inp.cat?SPEED.catTrot:SPEED.lead);st.speed=v;st.clip='walk';if(stepTo(st,st.route[st.ri],v,dt)){st.ri++;if(st.ri>=st.route.length)go('there');}}
  else face(st,me,dt);
  if(st.phase==='there'&&inp.door){if(st.unarmed&&me&&dist(me,to)>LIMIT.rearm)st.unarmed=false;if(!st.unarmed&&me&&d<=S.wait&&dist(me,to)<=LIMIT.arrive+1)go('enter');}   // at the street door with the player near: she goes in first
  else if(st.phase==='there'&&!inp.noDone&&me&&dist(me,to)<=LIMIT.arrive)go('done');
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
  if(inp.to&&!inp.door&&!inp.noDone&&dist(me,inp.to)<=LIMIT.arrive&&dist(st,inp.to)<=LIMIT.arrive+gap+1){go('done');}
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
   if(inp.crossing)return ev;   // (20 Nov 2026) the cab is going through a gate's bay into another quarter: no job for a moment, she stays in her seat
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
 function encode(e){if(!e||typeof e.key!=='string')return null;const w=e.w?String(e.w).replace(/[^a-z]/g,'').slice(0,4):'';const s=[e.key.slice(0,150),String(e.phase||'').replace(/[^a-z-]/g,'').slice(0,12),num(e.x)?e.x.toFixed(1):'',num(e.z)?e.z.toFixed(1):'',...(w?[w]:[])].join('|');return s.length<200?s:null;}
 function decode(v){if(typeof v!=='string')return null;const [key,phase,x,z,w]=v.split('|');if(!key)return null;const out={key,phase:phase||null};if(x!==''&&x!=null&&Number.isFinite(+x)&&z!==''&&z!=null&&Number.isFinite(+z)){out.x=+x;out.z=+z;}if(w)out.w=w;return out;}
 /* For the admin inventory (the server's copy of these rules: void_runner_live_content.py escort_problems). */
 function inventory(){const X=NPX(),out={},ids=(AR()&&AR().IDS)||['avenue'];for(const id of Object.keys((X&&X.MOVABLE)||{}).filter(movable))out[id]={stops:stops(id).filter(s=>s.ok).map(s=>s.id),stopsByArea:Object.fromEntries(ids.map(a=>[a,stops(id,a).filter(s=>s.ok).map(s=>s.id)])),cab:can(id,'their-cab').ok,into:canInto(id).ok,youthful:!!(X.MOVABLE[id]&&X.MOVABLE[id].youthful),reach:Object.fromEntries(ids.map(a=>[a,[...reach(id,a)].sort()]))};
  // into a place (the server's into_problems): the area of every street door's front (npc-areas.js), the rooms a youthful character never goes into
  const P=APX(),doorAreas={};try{for(const d of (P&&P.doors?P.doors():[]))doorAreas[d.id]=doorArea({front:{x:d.front[0],z:d.front[1]}})||null;}catch{}
  return {kinds:IDS.slice(),fields:FIELDS,limits:{wait:LIMIT.wait,lost:LIMIT.lost,def:LIMIT.def},ifLost:IF_LOST.map(x=>x.id),npcs:out,into:{kinds:[...SPOT],adultRooms:ADULT_ROOMS.slice(),doorAreas}};}
 // ================================================================= INTO A PLACE OF THIS MISSION (20 Nov 2026)
 /* "Follow her into Rundown apartment 104", "Lead her to the server room": a follow-them / they-follow step whose destination is `apt` (one of this mission's apartments or
    locations, mission.apartments) and, for a location built from modules, `mod` (the room; none: anywhere inside). Chosen from the same list as the "Go into" step
    (mission-blocks.js placeOptions). The street part is the ordinary step with the place's street door as its spot (she walks there along the pavements); then:
      follow-them  at the door with the player near, she goes in first (phase enter -> in: through the open door into the dark doorway) and waits just inside;
      they-follow  the player goes in and she comes in behind them a moment later (through the door they came in by).
    Inside (npc-escort-indoors.js) she leads or follows room to room, through doorways, through doors that lead elsewhere and in the elevator (she rides with the player when
    she is in the cab with them); the step is done when both are inside the chosen room. Leaving the place: she comes out behind the player (a follow-them step whose player
    went further than "lost": she waits where she is, or the mission fails, as on the street). After the step she stays in that room until the mission ends.
    WHO: the people a step can walk with (MOVABLE), except the cat (canInto). Reverie, Lace and made characters not marked adult never go into the fight pit (ADULT_ROOMS),
    as they never go into the adult venues on the street (npc-areas.js). The place's street door must be in the area she is placed in for this mission. */
 const reqI=f=>{try{return require(f);}catch{return null;}};
 const APX=()=>node?reqI('./apartments.js'):root.VoidApartments,MDX=()=>node?reqI('./modules.js'):root.VoidModules;
 const ADULT_ROOMS=['fight-pit'];   // only the fight pit (the owner, 20 Nov 2026: the gang are friendly; bar back room, card room and gang checkpoint are open)
 const INTO={pace:2.4,minDelay:.8,maxDelay:6,ride:2.6,ahead:2,through:.75,approach:.7};
 function canInto(id){const M=movable(id);if(!M)return {ok:false,why:'This character cannot walk with the player yet.'};if(M.cat)return {ok:false,why:'The cat stays outside: it does not go into buildings with the player. Pick a spot on the street for it.'};return {ok:true,why:null};}
 const isLoc=a=>!!a&&Array.isArray(a.modules);
 /* The area (npc-areas.js) of a street door's front: where she walks to. */
 function doorArea(d){const A=AR();if(!A||!d)return null;const f=d.front;return A.areaOf(f)||(()=>{const q=A.nearest?A.nearest(f,null,1.5):null;return q?A.areaOf(q):null;})();}
 /* A street door's points: front (where the player stands outside it, on the pavement), inside (just behind the door, in the dark doorway), the door itself and its normal
    (pointing into the building). null for an unknown door. */
 function doorAt(id){const X=APX();let d=null;try{d=X&&id?X.door(id):null;}catch{}if(!d)return null;
  return {id:d.id,name:d.name,quarter:d.quarter,front:{x:d.front[0],z:d.front[1]},inside:{x:+(d.x+d.n[0]*.45).toFixed(2),z:+(d.z+d.n[1]*.45).toFixed(2)},at:{x:d.x,z:d.z},n:d.n.slice()};}
 /* The rooms of a place and how they join: {legacy, rooms, types, cabs, entry, edges:[{a, b, kind: snap (a doorway on one floor) | portal (a door that leads elsewhere) |
    lift (the elevator, cab to cab) | door (an older apartment: hallway to apartment), id}]}. An older apartment: 'hall' and 'flat'. */
 function roomGraph(a){const out={legacy:!isLoc(a),rooms:[],types:{},cabs:[],edges:[],entry:null,clusters:{}};
  if(!isLoc(a)){out.rooms=['hall','flat'];out.entry='hall';out.edges=[{a:'hall',b:'flat',kind:'door',id:'hall|flat'}];out.clusters={hall:'hall',flat:'flat'};return out;}
  const M=MDX();if(!M||!M.analyse)return out;let an;try{an=M.analyse(a);}catch{return out;}const mod=r=>(M.parseRef(r)||{}).mod;
  for(const id of Object.keys(an.byId)){out.rooms.push(id);out.types[id]=an.byId[id].m.type;if(an.byId[id].t.cab)out.cabs.push(id);const c=an.clusterOf(id);out.clusters[id]=c?c.id:null;}
  for(const d of an.doors){if(d.kind==='entry'){out.entry=mod(d.a);continue;}out.edges.push({a:mod(d.a),b:mod(d.b),kind:d.kind==='snap'?'snap':'portal',id:d.id});}
  for(const c of an.cabs)for(const k of an.cabs)if(c.id<k.id&&c.floor!==k.floor)out.edges.push({a:c.id,b:k.id,kind:'lift',id:'lift|'+c.id+'|'+k.id});
  return out;}
 /* The rooms from `from` to `to` (shortest by doors): [{room, edge, from}] (empty when already there), or null when there is no way. */
 function roomPath(g,from,to){if(!g||from==null||to==null)return null;if(from===to)return [];const prev=new Map([[from,null]]),q=[from];
  while(q.length){const x=q.shift();if(x===to)break;for(const e of g.edges){const y=e.a===x?e.b:e.b===x?e.a:null;if(y==null||prev.has(y))continue;prev.set(y,{from:x,edge:e});q.push(y);}}
  if(!prev.has(to))return null;const out=[];for(let x=to;x!==from;){const p=prev.get(x);out.unshift({room:x,edge:p.edge,from:p.from});x=p.from;}return out;}
 /* The room the step ends in: an older apartment's own room ('flat'), the chosen room, or null (anywhere inside). */
 const destOf=(g,o)=>g&&g.legacy?'flat':(o&&o.mod)||null;
 /* A step's place problems in plain words (empty: fine). ctx: {area (where she is placed), apartments (the mission's), steps (the mission's, for "available from")}. */
 function intoProblems(o,ctx={}){const out=[],M=movable(o.npc),who=(M&&M.name)||'they',c=canInto(o.npc);if(!c.ok)return [c.why];
  if(o.to!=null)out.push('Choose either a spot on the street or a place of this mission to go into, not both.');
  if(o.apt==null){out.push('Choose the place of this mission to go into.');return out;}
  const list=Array.isArray(ctx.apartments)?ctx.apartments:null;if(!list)return out;   // checked with its mission (mission-content.js check, the editor)
  const a=list.find(x=>x&&x.id===o.apt);if(!a){out.push('Choose one of this mission’s places to go into (add a location or an apartment to the mission first).');return out;}
  const g=roomGraph(a);
  if(g.legacy){if(o.mod!=null)out.push('Only a location built from modules has rooms to choose.');}
  else if(o.mod!=null&&!g.rooms.includes(o.mod))out.push('Choose one of the location’s rooms.');
  else if(o.mod!=null&&g.cabs.includes(o.mod))out.push('An elevator cab is the way between floors, not a place to stop: choose the room on the floor where the step should end.');
  else if(o.mod!=null&&g.entry&&!roomPath(g,g.entry,o.mod))out.push('That room cannot be reached from the street door.');
  if(M&&M.youthful&&!g.legacy&&g.entry){const dest=o.mod&&g.rooms.includes(o.mod)?o.mod:g.entry,path=roomPath(g,g.entry,dest)||[],rooms=[g.entry,...path.map(p=>p.room)];
   if(rooms.some(r=>ADULT_ROOMS.includes(g.types[r])))out.push(who+' never goes into the fight pit (her content rule, as for the adult places on the street): choose another room or place, or someone marked as an adult.');}
  if(!a.door){out.push('That place has no street door yet: choose its street door first.');return out;}
  const d=doorAt(a.door);if(!d){out.push('That place’s street door is not in the game.');return out;}
  const A=AR(),da=doorArea(d),area=ctx.area||'avenue';if(A&&!da)out.push(who+' cannot walk to that street door (it is not on ground the people of the city walk on): choose another place.');
  else if(da&&da!==area){const rw=reachWhy(o.npc,area,da);if(rw)out.push('The street door of that place is in '+areaName(da)+', but '+who+' starts in '+areaName(area)+' for this mission and cannot get there: '+rw);}
  const steps=Array.isArray(ctx.steps)?ctx.steps:null;if(steps&&a.from&&a.from!=='start'){const k=steps.findIndex(x=>x&&x.id===a.from),i=steps.findIndex(x=>x&&x.id===o.id);if(k>=0&&i>=0&&k>i)out.push('That place opens later in the mission (its “available from” is a later step): its door is still locked during this step.');}
  return out;}
 /* THE PLAYER CHANGES PLACE while the step runs (into a room, through a door that leads elsewhere, the elevator, back out to the street). inp: {kind, set, herIn (she is in
    the place the player left), dist (metres between them as they left), cab (the player rode the elevator), inCab (she was in the cab with them)}. Returns {go, delay}:
    'with' (she comes through the same door behind them after `delay` seconds: about her walk to it), 'ride' (she rides with them: there at once), 'stay' (she stays where she
    is: not in that place, or a follow-them player who went further than "lost" with "they stop and wait"), 'fail' (lost with "the mission fails"). */
 function crossing(inp){const S=settings(inp&&inp.set);if(!inp||!inp.herIn)return {go:'stay',delay:0};if(inp.cab&&inp.inCab)return {go:'ride',delay:0};
  const d=num(inp.dist)?Math.max(0,inp.dist):LIMIT.catchUp;if(inp.kind==='follow-them'&&d>S.lost)return S.ifLost==='fail'?{go:'fail',delay:0}:{go:'stay',delay:0};
  return {go:'with',delay:+clamp(d/INTO.pace,[INTO.minDelay,INTO.maxDelay]).toFixed(2)};}
 /* Done: both inside the place, in the chosen room (dest null: anywhere inside), and she is really there (arrived, not still coming through the door). */
 function insideDone(inp){if(!inp||!inp.me||!inp.her)return false;const {me,her}=inp;if(!me.inside||!her.inside||!her.here)return false;if(me.scene!==her.scene)return false;return inp.dest==null||(me.room===inp.dest&&her.room===inp.dest);}
 /* A reload in the middle of the step (every login wakes in the Sleeping Pod): a step that had gone inside starts again at the place's street door, she waiting there
    (follow-them: at the door, going in when the player comes; they-follow: by the door, following the player again). saved: decode(story.flags.npcEsc). */
 function resumeInto(saved,door){if(!saved||!door)return null;if(saved.w==='in'||saved.phase==='enter'||saved.phase==='in')return {x:door.front.x,z:door.front.z,phase:'there',unarmed:false};return null;}
 /* Inside: a walk from a to b around the furniture and walls (solids: the walking area's boxes, door slabs left out: they open for her), on a grid of `grid` metres,
    shortened to straight legs. Returns the points after a, ending at b (or the free point nearest b), or null. */
 function gridRoute(a,b,solids,opt={}){if(!a||!b)return null;const G=opt.grid||.25,R=opt.radius||.3,pad=opt.pad||8,S=(solids||[]).filter(s=>s&&!s.door&&!s.open&&Array.isArray(s.position)&&Array.isArray(s.size));
  const memo=new Map(),c2=v=>Math.floor(v/G);
  const hit=(x,z)=>S.some(s=>Math.abs(x-s.position[0])<s.size[0]/2+R&&Math.abs(z-s.position[2])<s.size[2]/2+R);
  const free=(i,j)=>{const k=i*100003+j;let v=memo.get(k);if(v===undefined){v=!hit((i+.5)*G,(j+.5)*G);memo.set(k,v);}return v;};
  const p0=Math.ceil(pad/G),i0=Math.min(c2(a.x),c2(b.x))-p0,i1=Math.max(c2(a.x),c2(b.x))+p0,j0=Math.min(c2(a.z),c2(b.z))-p0,j1=Math.max(c2(a.z),c2(b.z))+p0;
  const near=p=>{const ci=c2(p.x),cj=c2(p.z);let best=null,bd=Infinity;for(let di=-6;di<=6;di++)for(let dj=-6;dj<=6;dj++){const i=ci+di,j=cj+dj;if(!free(i,j))continue;const d=Math.hypot((i+.5)*G-p.x,(j+.5)*G-p.z);if(d<bd){bd=d;best=[i,j];}}return best;};
  const s0=near(a),s1=near(b);if(!s0||!s1)return null;const W=(j1-j0)+1,key=(i,j)=>(i-i0)*W+(j-j0),goal=key(s1[0],s1[1]),h=(i,j)=>Math.hypot(i-s1[0],j-s1[1]);
  const g=new Map(),from=new Map(),heap=[];
  const push=e=>{heap.push(e);let n=heap.length-1;while(n>0){const p=(n-1)>>1;if(heap[p][0]<=heap[n][0])break;[heap[p],heap[n]]=[heap[n],heap[p]];n=p;}};
  const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let n=0;for(;;){const l=2*n+1,r=l+1;let m=n;if(l<heap.length&&heap[l][0]<heap[m][0])m=l;if(r<heap.length&&heap[r][0]<heap[m][0])m=r;if(m===n)break;[heap[m],heap[n]]=[heap[n],heap[m]];n=m;}}return top;};
  const k0=key(s0[0],s0[1]);g.set(k0,0);push([h(s0[0],s0[1]),k0,s0[0],s0[1]]);let n=0,found=false;
  while(heap.length&&n++<MAXN){const [,k,i,j]=pop();if(k===goal){found=true;break;}const gk=g.get(k);
   for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const ni=i+di,nj=j+dj;if(ni<i0||ni>i1||nj<j0||nj>j1||!free(ni,nj))continue;if(di&&dj&&(!free(i+di,j)||!free(i,j+dj)))continue;
    const nk=key(ni,nj),ng=gk+Math.hypot(di,dj);if(ng<(g.has(nk)?g.get(nk):Infinity)){g.set(nk,ng);from.set(nk,[k,i,j]);push([ng+h(ni,nj),nk,ni,nj]);}}}
  if(!found)return null;const cells=[];for(let k=goal,i=s1[0],j=s1[1];;){cells.unshift({x:(i+.5)*G,z:(j+.5)*G});const f=from.get(k);if(!f)break;[k,i,j]=f;}
  const end=hit(b.x,b.z)?cells[cells.length-1]:{x:b.x,z:b.z},P=[{x:a.x,z:a.z},...cells,end];
  const clear=(u,v)=>{const p=P[u],q=P[v],d=dist(p,q),m=Math.max(1,Math.ceil(d/.1));for(let t=1;t<m;t++){if(hit(p.x+(q.x-p.x)*t/m,p.z+(q.z-p.z)*t/m))return false;}return true;};
  const out=[];for(let u=0;u<P.length-1;){let v=P.length-1;while(v>u+1&&!clear(u,v))v--;out.push({x:+P[v].x.toFixed(2),z:+P[v].z.toFixed(2)});u=v;}
  if(out.length&&dist(out[out.length-1],P[P.length-1])>.01)out.push({x:+end.x.toFixed(2),z:+end.z.toFixed(2)});return out;}
 /* A free standing spot near p (the walking area's solids), searched in rings: for where she waits and where she stays. */
 function freeSpot(p,solids,R=.35){const S=(solids||[]).filter(s=>s&&!s.door&&Array.isArray(s.position)&&Array.isArray(s.size)),hit=(x,z)=>S.some(s=>Math.abs(x-s.position[0])<s.size[0]/2+R&&Math.abs(z-s.position[2])<s.size[2]/2+R);
  if(!hit(p.x,p.z))return {x:p.x,z:p.z};for(let r=.25;r<=4;r+=.25)for(let k=0;k<16;k++){const t=k/16*Math.PI*2,q={x:p.x+Math.sin(t)*r,z:p.z+Math.cos(t)*r};if(!hit(q.x,q.z))return {x:+q.x.toFixed(2),z:+q.z.toFixed(2)};}return {x:p.x,z:p.z};}
 // ================================================================= ACROSS GATES, THE STAIRS TO THE TUNNELS AND THE DISTRICT DOOR (20 Nov 2026)
 /* The owner, 20 Nov 2026: a follow / lead step did not carry the person through a city gate or up / down the stairwells to the tunnels: "I need this fixed. whether it's
    walking or in a taxi". The city's walking AREAS (npc-areas.js: The Avenue, Old Town, Far South, The Outskirts, The Port, The Underground, the District inside) are joined by
    LINKS: each walkers' lane of a gate between two city quarters (ncz-quarters.js LANES, foot), each stairwell between a quarter and the tunnels (ncz-backalleys.js
    UNDERGROUND_ENTRANCES, ncz-underground.js arrive / leave) and the District's door (Old Town <-> the District inside). Each end of a link has, in that end's area:
      wait    where a person who LEADS waits for the player (just outside the gate's door, at the top of the stairs, a little inside the checkpoint's door)
      ahead   where she stands when she comes through AHEAD of the player (follow-them): out of the door on the far side, facing on
      behind  where she stands when she comes through BEHIND the player (they-follow, shared-cab): inside the lane / on the landing, facing the way the player goes
    areaRoute (cheapest chain of links from her area to the destination's) gives a leading person her next leg: to the link's `wait` until the destination's area. across()
    decides what happens when the player changes area while a step runs (npc-escort-across.js asks: with / ride / stay / fail / refused). rideAlong() is a follow / lead
    step's taxi: she gets in the player's cab, rides (seated), and gets out with the player at the stop, also through a gate's bay into another quarter.
    RULES KEPT: a link is usable only if she may stand at both ends (npc-paths.js spotProblems: Reverie, Lace and made characters not marked adult never go where the adult
    places are); the cat never goes inside (the District) or down into the tunnels, and never rides a cab; the Corporate District and the Temple are never entered (city only). */
 const BAX=()=>node?reqI('./ncz-backalleys.js'):root.VoidBackAlleys,UGX=()=>node?reqI('./ncz-underground.js'):root.VoidUnderground;
 const ACROSS={wait:1.6,ahead:2.4,behind:1.4,snap:3,cross:6,rideNear:12,withMax:40};
 const fwd=y=>({x:Math.sin(y),z:Math.cos(y)}),r2=v=>+v.toFixed(2);
 const areaOfQuarter=q=>{const A=AR();const a=A&&A.list().find(x=>x.scene==='street'&&x.quarter===q);return a?a.id:null;};
 const snapIn=(p,area)=>{const A=AR();let q=null;try{q=A&&A.nearest?A.nearest(p,area,ACROSS.snap):null;}catch{}return q?{x:r2(q.x),z:r2(q.z)}:{x:r2(p.x),z:r2(p.z)};};
 let LINKS=null;
 /* Every link: {id, kind: 'gate' | 'stairs' | 'door', name, ends: {[area]: {wait, ahead, behind}}}. Built once (data only). */
 function links(){if(LINKS)return LINKS;const out=[],Q=QT(),A=AR();if(!Q||!A)return out;
  for(const l of Q.LANES||[]){if(l.kind!=='foot')continue;const g=Q.gate(l.gate);if(!g||g.shut)continue;const ql=g.ends.lo&&g.ends.lo.quarter,qh=g.ends.hi&&g.ends.hi.quarter;if(!ql||!qh||ql===qh)continue;
   const al=areaOfQuarter(ql),ah=areaOfQuarter(qh);if(!al||!ah)continue;const mid={x:l.mid[0],z:l.mid[1]},ends={};
   for(const [e,a] of [['lo',al],['hi',ah]]){const d=l.doors[e],n=Math.hypot(d.x-mid.x,d.z-mid.z)||1,u={x:(d.x-mid.x)/n,z:(d.z-mid.z)/n},yaw=r2(Math.atan2(u.x,u.z));
    ends[a]={wait:snapIn({x:d.x+u.x*ACROSS.wait,z:d.z+u.z*ACROSS.wait},a),ahead:{...snapIn({x:d.x+u.x*ACROSS.ahead,z:d.z+u.z*ACROSS.ahead},a),yaw},behind:{x:r2(mid.x-u.x*ACROSS.behind),z:r2(mid.z-u.z*ACROSS.behind),yaw}};}
   out.push({id:'gate:'+l.key,kind:'gate',name:g.name,ends});}
  const BA=BAX(),U=UGX(),ua=U?areaOfQuarter(U.ID||'underground'):null;
  if(BA&&U&&ua&&U.arrive&&U.leave)for(const u of BA.UNDERGROUND_ENTRANCES||[]){const sa=areaOfQuarter(u.quarter),inn=U.arrive(u.id),lv=U.leave(u.id);if(!sa||!inn||!lv)continue;
   const dn={x:u.down[0],z:u.down[1]},top={x:u.top[0],z:u.top[2]},up=r2(Math.atan2(-dn.x,-dn.z)),fi=fwd(inn.yaw),ip={x:inn.spawn[0],z:inn.spawn[2]},fl=fwd(lv.yaw),lp={x:lv.spawn[0],z:lv.spawn[2]};
   out.push({id:'stairs:'+u.id,kind:'stairs',name:'the stairs down to the tunnels ('+areaName(sa)+')',ends:{
    [sa]:{wait:snapIn({x:top.x-dn.x*1.4,z:top.z-dn.z*1.4},sa),ahead:{...snapIn({x:top.x-dn.x*1.9,z:top.z-dn.z*1.9},sa),yaw:up},behind:{x:r2(lp.x-fl.x*.7),z:r2(lp.z-fl.z*.7),yaw:r2(lv.yaw)}},
    [ua]:{wait:snapIn({x:ip.x+fi.x*1.3,z:ip.z+fi.z*1.3},ua),ahead:{...snapIn({x:ip.x+fi.x*2.6,z:ip.z+fi.z*2.6},ua),yaw:r2(inn.yaw)},behind:{x:r2(ip.x-fi.x*.5),z:r2(ip.z-fi.z*.5),yaw:r2(inn.yaw)}}}});}
  // the District's door (its security vestibule; npc-areas.js DOOR / toWorld: the street is north of the door, the District's plan runs south of it)
  if(A.get('district')&&A.DOOR&&A.toWorld){const ot=areaOfQuarter('oldtown'),w=(x,z)=>{const [a,b]=A.toWorld(x,z);return {x:a,z:b};};
   if(ot)out.push({id:'door:district',kind:'door',name:'the District’s door',ends:{
    [ot]:{wait:snapIn(w(0,17.6),ot),ahead:{...snapIn(w(0,17.2),ot),yaw:0},behind:{...w(0,22.6),yaw:0}},
    district:{wait:snapIn(w(0,28.4),'district'),ahead:{...snapIn(w(0,29.2),'district'),yaw:r2(Math.PI)},behind:{...w(0,23.4),yaw:r2(Math.PI)}}}});}
  return LINKS=out;}
 const linkById=id=>links().find(l=>l.id===id)||null;
 /* May this person go into `area` at all, and stand at point p there? {ok, why}. The cat: streets only (never inside, never down into the tunnels). */
 function mayEnter(id,area,p){const M=movable(id),A=AR(),a=A&&A.get(area),who=(M&&M.name)||'They';if(!M)return {ok:false,why:'This character cannot walk with the player.'};
  if(!a)return {ok:false,why:who+' stays in the city: '+(M.cat?'it waits':'she waits')+' here for you.'};
  if(M.cat&&(a.scene==='interior'||a.scene==='milked'||area==='underground'||area===areaOfQuarter('underground')))return {ok:false,why:'The cat never goes inside or down into the tunnels: it waits here for you.'};
  if(p){const X=NPX(),pp=X&&X.spotProblems?X.spotProblems(id,p):[];if(pp.length)return {ok:false,why:who+' does not go there ('+String(pp[0]).replace(/\.$/,'')+'): '+(M.cat?'it waits':'she waits')+' here for you.'};}
  return {ok:true,why:null};}
 const usable=(l,id)=>Object.entries(l.ends).every(([a,e])=>mayEnter(id,a,e.wait).ok&&mayEnter(id,a,e.ahead).ok);
 /* The cheapest chain of links from `from` ({area, x, z}) to `to` ({area, x, z}) for this person: [{link, a (area she leaves), b (area she enters)}], [] when already
    there, null when there is no way. Cost: metres walked (straight) plus a few per crossing. */
 function areaRoute(id,from,to){if(!from||!to||!from.area||!to.area)return null;if(from.area===to.area)return [];const L=links().filter(l=>usable(l,id));
  const best=new Map(),q=[{cost:0,area:from.area,at:{x:num(from.x)?from.x:0,z:num(from.z)?from.z:0},path:[]}];let win=null;
  while(q.length){q.sort((u,v)=>u.cost-v.cost);const s=q.shift();if(s.area===to.area){const c=s.cost+(num(to.x)&&num(to.z)?dist(s.at,to):0);if(!win||c<win.cost)win={cost:c,path:s.path};continue;}
   if(win&&s.cost>=win.cost)continue;
   for(const l of L){const e=l.ends[s.area];if(!e)continue;for(const [b,f] of Object.entries(l.ends)){if(b===s.area||s.path.some(p=>p.a===b))continue;const cost=s.cost+dist(s.at,e.wait)+ACROSS.cross,k=l.id+'>'+b;if(best.has(k)&&best.get(k)<=cost)continue;best.set(k,cost);q.push({cost,area:b,at:{x:f.ahead.x,z:f.ahead.z},path:[...s.path,{link:l,a:s.area,b}]});}}}
  return win?win.path:null;}
 /* The areas this person can walk to from `area` (through the links she may use), `area` included. */
 function reach(id,area){const out=new Set([area]),L=links().filter(l=>usable(l,id)),q=[area];while(q.length){const a=q.shift();for(const l of L){if(!l.ends[a])continue;for(const b of Object.keys(l.ends))if(!out.has(b)){out.add(b);q.push(b);}}}return out;}
 /* Why she cannot get from area a to area b on foot (null: she can). */
 function reachWhy(id,a,b){if(!a||!b||a===b||reach(id,a).has(b))return null;const M=movable(id),who=(M&&M.name)||'They',m=mayEnter(id,b,null);
  return m.ok?who+' cannot walk from '+areaName(a)+' to '+areaName(b)+' (there is no way through for '+(M&&M.cat?'it':'her')+'): pick a spot in an area '+(M&&M.cat?'it':'she')+' can reach.':String(m.why).replace(/: (it|she) waits here for you\.$/,'.')+' Pick a spot in an area '+(M&&M.cat?'it':'she')+' can reach from '+areaName(a)+'.';}
 /* Her next leg in `area` toward `dest` (a point in `destArea`): {to, via (a link id, or null on the last leg), next (the area beyond), final}. to null: no way. */
 function legOf(id,area,pos,dest,destArea){if(!dest)return {to:null,via:null,final:true};if(!area||!destArea||area===destArea)return {to:{x:dest.x,z:dest.z},via:null,final:true};
  const r=areaRoute(id,{area,x:pos&&pos.x,z:pos&&pos.z},{area:destArea,x:dest.x,z:dest.z});if(!r||!r.length)return {to:null,via:null,final:false,why:reachWhy(id,area,destArea)};
  const w=r[0].link.ends[area].wait;return {to:{x:w.x,z:w.z},via:r[0].link.id,next:r[0].b,final:false};}
 /* Which link the player just went through from area a to area b, the one nearest to where they stood (null: none). */
 function linkBetween(a,b,at){let best=null,bd=Infinity;for(const l of links()){if(!l.ends[a]||!l.ends[b])continue;const d=at?dist(at,l.ends[a].wait):0;if(d<bd){bd=d;best=l;}}return best;}
 /* THE PLAYER CHANGES AREA while a step runs. inp: {kind, set, npc, from (the area the player left), to (the area they go to, null: a place that is not a walking area),
    herArea (the area she was in), dist (metres between them as they left), riding (the player is in a taxi), inCab (she sits in it with them), allowed ({ok, why}: may she
    go there), farScene (the Corporate District / the Temple)}. Returns {go: 'with' | 'ride' | 'stay' | 'fail' | 'refused', place: 'ahead' | 'behind', why}. */
 function across(inp){const S=settings(inp&&inp.set);if(!inp||!inp.herArea||inp.herArea!==inp.from)return {go:'stay'};
  if(!inp.to)return inp.farScene?{go:'refused',why:inp.allowed&&inp.allowed.why||null}:{go:'stay'};
  if(inp.riding){if(!inp.inCab)return {go:'stay'};return inp.allowed&&!inp.allowed.ok?{go:'refused',why:inp.allowed.why}:{go:'ride'};}
  if(inp.inCab)return {go:'stay'};   // she sat in a cab the player walked away from
  const d=num(inp.dist)?Math.max(0,inp.dist):Infinity;
  if(inp.kind==='their-cab')return {go:'stay'};   // she waits at her kerb for her cab
  if(inp.kind==='follow-them'){if(d>S.lost)return S.ifLost==='fail'?{go:'fail'}:{go:'stay'};if(inp.allowed&&!inp.allowed.ok)return {go:'refused',why:inp.allowed.why};return {go:'with',place:'ahead'};}
  if(d>Math.max(S.lost,ACROSS.withMax))return {go:'stay'};
  if(inp.allowed&&!inp.allowed.ok)return {go:'refused',why:inp.allowed.why};
  return {go:'with',place:'behind'};}
 /* Where she stands on the other side: the link's ahead / behind point, else beside the player's arrival (spawn {x, z, yaw}): ahead 2.4 m in front, behind 1.4 m. */
 function arrival(link,area,place,spawn){const e=link&&link.ends[area];if(e){const p=e[place==='ahead'?'ahead':'behind'];return {x:p.x,z:p.z,yaw:num(p.yaw)?p.yaw:0};}
  if(!spawn)return null;const y=num(spawn.yaw)?spawn.yaw:0,f=fwd(y),k=place==='ahead'?ACROSS.ahead:-ACROSS.behind;return {x:r2(spawn.x+f.x*k),z:r2(spawn.z+f.z*k),yaw:r2(y)};}
 /* A FOLLOW / LEAD STEP'S TAXI (the owner: "whether it's walking or in a taxi"). st gains `ride`: null | 'to-cab' | 'in-cab'. inp: {me, job (the player's taxi job: {phase,
    dest, far, released, cab:{x,z,yaw}, doors}), riding (the player sits in it), crossing (the cab is going through a gate: no job for a moment), dt, set, can (she rides
    cabs)}. Returns {busy (the ride has her: the walking rules wait), ev}: events 'to-cab', 'in-cab', 'ride-out' (out with the player at the stop: st.route / phase reset so
    the walk goes on from there), 'no-cab' (the cat, a far stop: she stays out; once per cab). */
 function rideAlong(st,inp){const job=inp.job&&!inp.job.released?inp.job:null,me=inp.me,dt=inp.dt||0;let ev=null;
  if(st.ride==='in-cab'){st.clip='sit';st.speed=0;if(job){if(job.phase==='arrived')st.rideArrived=true;return {busy:true,ev};}if(inp.crossing)return {busy:true,ev};
   st.ride=null;st.route=null;st.routeFor=null;if(st.phase!=='done'&&st.phase!=='failed')st.phase='ready';st.rideOut=true;const was=st.rideArrived;st.rideArrived=false;return {busy:false,ev:was?'ride-out':'ride-left'};}
  if(!job){if(st.ride==='to-cab')st.ride=null;return {busy:false,ev:null};}
  const d=me?dist(me,st):Infinity,S=settings(inp.set);
  if(!inp.can||job.far){if((inp.riding||job.phase==='waiting')&&d<=S.lost&&st.noCab!==job.id){st.noCab=job.id;ev='no-cab';}if(st.ride==='to-cab')st.ride=null;return {busy:false,ev};}
  if(inp.riding){if(st.ride==='to-cab'||d<=LIMIT.cabNear){st.ride='in-cab';st.rideArrived=false;st.clip='sit';return {busy:true,ev:'in-cab'};}return {busy:false,ev};}   // the player got in first: she gets in too (left behind beyond cabNear)
  if(job.phase==='waiting'&&me&&job.cab&&dist(me,job.cab)<=ACROSS.rideNear&&d<=Math.max(S.lost,LIMIT.cabNear)){const doors=job.doors||[],door=doors.slice(0,2).sort((a,b)=>dist(a,st)-dist(b,st))[0];if(!door)return {busy:false,ev};
   if(st.ride!=='to-cab'){st.ride='to-cab';ev='to-cab';}st.clip='walk';st.speed=SPEED.walk*1.5;if(stepTo(st,door,SPEED.walk*1.5,dt)){st.ride='in-cab';st.rideArrived=false;st.clip='sit';ev='in-cab';}return {busy:true,ev};}
  if(st.ride==='to-cab')st.ride=null;return {busy:false,ev};}
 const api={ACROSS,links,linkById,mayEnter,areaRoute,reach,reachWhy,legOf,linkBetween,across,arrival,rideAlong,areaOfQuarter,ADULT_ROOMS,INTO,canInto,doorAt,doorArea,roomGraph,roomPath,destOf,intoProblems,crossing,insideDone,resumeInto,gridRoute,freeSpot,placedArea,draftPlans:null,KINDS,IDS,CAB,SPOT,IF_LOST,LIMIT,SPEED,FLAG,FIELDS,kind,can,stops,stopOk,stopPos,settings,problems,needs,spots,route,lead,trailPush,behind,follow,kerb,cab,walkRoute,keyOf,encode,decode,inventory};
 if(node)module.exports=api;else root.VoidNPCEscort=api;
})(typeof globalThis!=='undefined'?globalThis:this);
