/* GUIDE ROUTE (pure rules: browser and Node tests; no DOM, no clock). The ONE place that decides where the yellow mission arrow points on foot and how it moves
   (the owner, 17 Nov 2026: "The mission arrow sometimes switches directions ... if it's pointing at a doorway and you walk slightly past the marker point the arrow
   points backwards for a bit ... look for other cases when this might happen so it's programming is set optimal for future missions").
   Every mission, old and future, goes through it: world-integration.js (and anything else) only says WHERE THE GOAL IS (trackedWalkWaypoint); the route, the
   next waypoint, the smoothing and the fading are decided here. Tunables: TUNE, below (docs/development/MISSION_EDITOR.md, "The guide arrow").

   Why it flipped: the arrow used to aim at ONE point, the middle of the District's security vestibule, until the scan swapped the street in. The checkpoint starts as
   soon as the player is within 1.2 m of that middle, and the player keeps walking while the doors seal, so they passed the point and the arrow turned 180 degrees
   for the whole scan; then it aimed straight at NULL through the vestibule's side wall. The arrow also aimed at where the point was ON SCREEN, and a point half a
   metre below the eyes and closer than about 2 m projects below the arrow's ring, so it turned to point down (backwards) just before the point was reached.

   How it works now:
   - The walkable world is a few REGIONS (rooms, the vestibule, NULL's entry and hall, Milked's lobbies, each gate lane, each street of each quarter) joined by
     PORTALS (doorways, door pairs, street junctions). A route is the cheapest chain of portals from the player's region to the goal's region (Dijkstra; tiny graph), then the goal.
   - A portal is a GATE, not a point: it is passed when the player is within passRadius of it OR has crossed its plane in the travel direction (planeMargin), within
     its width (+ planeSlack). Where the next leg turns away from straight through a door (out onto a street, out of a room into the hallway), an APRON point a little beyond
     it comes first, so the arrow points out of the door, not along the wall beside it.
   - Hysteresis: the route never goes back to an earlier waypoint unless the player is more than `backtrack` metres back through it. Re-planning keeps the waypoint
     the player is heading for (by id), and a route already in use wins ties (preferBonus), so equal lanes (the North Gate's two walkers' lanes) never alternate.
   - The arrow's WORLD direction is smoothed (damped, time-based, shortest arc: it never spins the long way round). It snaps, with a quick fade in, only on a new
     goal (a step change, STOP TRACKING then tracking again), a teleport, or a scene / area / quarter change. A moving goal (a person walking) is followed, smoothed.
   - Near the goal (horizontal distance under nearFade) the arrow fades, and under nearHide it is hidden, so it never jitters over a point you stand on, above or below.
   Saves: nothing is saved; a reload starts a fresh follower, which picks up the route from where the player stands. */
(function(root){
 'use strict';
 const TUNE={
  passRadius:1.6,     // m: a doorway counts as passed this close to its centre
  planeMargin:.15,    // m: ... or this far through its plane, in the travel direction
  planeSlack:.8,      // m: beyond a doorway's half width, crossing its plane still counts
  apron:1.8,          // m: how far beyond a door its apron is
  apronRadius:.9,     // m: an apron counts as reached this close
  apronTurn:.6,       // rad (about 35 degrees): a door gets an apron when the next leg turns more than this from straight through it
  backtrack:2,        // m: how far back through a passed doorway before the route returns to it
  smoothTime:.2,      // s: the arrow settles on a new direction in about this long (95%)
  snapFade:.18,       // s: fade-in after a snap
  nearHide:1.5,       // m: closer than this to the goal (horizontally) the arrow is hidden
  nearFade:2.6,       // m: from here down to nearHide it fades out
  hold:.35,           // m: closer than this to a waypoint the direction is held, not recomputed
  teleport:4,         // m: a jump this big in one update is a teleport (snap)
  moveTime:.35,       // s: a moving goal is followed with this lag (95%)
  moveSnap:6,         // m: a goal that jumps further than this is snapped to
  preferBonus:4,      // m: a portal on the route already in use costs this much less
  bayPenalty:40,      // m: walkers use a gate's vehicle bay only if they are standing in it
  keep:8              // m: a waypoint in use stays in use across a region edge until passed, or this far away
 };
 const TAU=Math.PI*2;
 const wrap=a=>((a+Math.PI)%TAU+TAU)%TAU-Math.PI;
 // Damped, time-based, shortest-arc approach of `target` (radians). time: about 95% of the way after this many seconds.
 function smoothAngle(cur,target,dt,time=TUNE.smoothTime){if(!Number.isFinite(cur))return wrap(target);if(!(dt>0))return wrap(cur);const k=1-Math.exp(-dt*3/Math.max(1e-3,time));return wrap(cur+wrap(target-cur)*k);}
 const bearing=(from,to)=>Math.atan2(to.x-from.x,to.z-from.z);   // world yaw, the walker's convention (0 = +z, PI/2 = +x)
 const inRect=([x0,x1,z0,z1],x,z)=>x>=x0&&x<=x1&&z>=z0&&z<=z1;

 /* ---- the graph ---- region: {id, rects?, test?(x,z), outdoor?}; portal: {id, a, b, x, z, nx, nz (unit, from a into b), half, penalty?} */
 function graph(regions,portals,quarterAt,near){return {regions,portals,quarterAt:quarterAt||null,near:near||null};}
 function regionAt(G,x,z,hint){if(!G||!Number.isFinite(x)||!Number.isFinite(z))return null;for(const r of G.regions){if(r.test?r.test(x,z):r.rects&&r.rects.some(q=>inRect(q,x,z)))return r.id;}
  if(G.near){const n=G.near(x,z,hint);if(n)return n;}   // a doorstep or a kerb just off a street's rect
  if(G.quarterAt){const q=G.quarterAt(x,z,hint);if(q)return 'q:'+q;}return null;}

 // NeoChinatown's street and every building in it that has doors (one coordinate space: world metres). deps: {N: VoidNeoChinatown, QT: VoidQuarters, NC: VoidNightclub, MK: VoidMilked}.
 function neochinatown(d){const N=d.N,QT=d.QT,NC=d.NC,MK=d.MK,regions=[],portals=[];
  if(N&&N.toWorld){const L=(x,z)=>N.toWorld(x,z),lrect=([x0,x1,z0,z1])=>{const [ax,az]=L(x0,z0),[bx,bz]=L(x1,z1);return [Math.min(ax,bx),Math.max(ax,bx),Math.min(az,bz),Math.max(az,bz)];};
   // The District's own plan (neochinatown.js walls): local metres, door at (0,20); the half turn maps local +x to world -x and local +z to world -z.
   for(const [id,r] of [['district-vestibule',[-3,3,20,26]],['district-hall',[-3,3,26,70.5]],['district-pods',[-17,17,70.5,78.3]],['district-vr',[-17,-3,28,44]],['district-vend',[-7,-3,46.5,52.5]],
    ['district-arcade',[-10.5,-3,57.5,66.5]],['district-bar',[3,17,28,42]],['district-shop',[3,17,43,53]],['district-meeting',[3,15,56,69]]])regions.push({id,rects:[lrect(r)]});
   const lp=(id,a,b,lx,lz,nx,nz,half)=>{const [x,z]=L(lx,lz);portals.push({id,a,b,x,z,nx:-nx,nz:-nz,half});};
   lp('district-door','q:oldtown','district-vestibule',0,20,0,1,3);lp('district-inner-door','district-vestibule','district-hall',0,26,0,1,3);
   // the hallway's openings (the gaps between the hall-west / hall-east wall pieces), and the pod room at the end
   lp('district-vr-door','district-hall','district-vr',-3,34,-1,0,2.5);lp('district-vend-door','district-hall','district-vend',-3,49.5,-1,0,3);lp('district-arcade-door','district-hall','district-arcade',-3,62,-1,0,2.5);
   lp('district-bar-door','district-hall','district-bar',3,33,1,0,2.5);lp('district-shop-door','district-hall','district-shop',3,46,1,0,1.5);lp('district-meeting-door','district-hall','district-meeting',3,62.5,1,0,2);
   lp('district-pods-door','district-hall','district-pods',0,70.5,0,1,3);}
  if(NC&&NC.ENTRY&&NC.HALL){const E=NC.ENTRY;regions.push({id:'null-entry',rects:[E.rect]},{id:'null-hall',rects:[NC.HALL]});
   portals.push({id:'null-door',a:'q:oldtown',b:'null-entry',x:E.doors.outer.x,z:E.doors.outer.z,nx:-1,nz:0,half:E.doors.outer.half},{id:'null-inner-door',a:'null-entry',b:'null-hall',x:E.doors.inner.x,z:E.doors.inner.z,nx:-1,nz:0,half:E.doors.inner.half});}
  if(MK&&MK.DOOR&&MK.FOOTPRINT){const front=QT?QT.quarterAt(MK.DOOR.x,MK.DOOR.z+2):null,rear=QT?QT.quarterAt(MK.REAR.x,MK.REAR.z-2):null;
   // Inside (Mission 003, 17 Nov 2026: the arrow to Eva at reception and on to Fish's office): reception, the studio hallway, the staff corridor and Fish's office are
   // regions of their own, joined by the door beside the desk, the STAFF ONLY door at the hallway's far end and the office door, so the arrow never points through a wall.
   // The rest of the building (studios, dressing rooms, the rear corridor) stays one region ('milked'), as before.
   const room=id=>((MK.ROOMS||[]).find(r=>r.id===id)||{}).rect,rooms=[['milked-reception','reception'],['milked-hall','hallway'],['milked-office','office'],['milked-staff','staff-corridor']].filter(([,r])=>room(r));
   regions.push({id:'milked-vestibule',rects:[MK.VESTIBULE]},{id:'milked-lobby',rects:[MK.LOBBY]},...rooms.map(([id,r])=>({id,rects:[room(r)]})),{id:'milked',rects:[MK.FOOTPRINT]});
   const north=(MK.DOORS||[]).find(x=>x.id==='milked-lobby-north')||{x:MK.REAR.x,z:MK.REAR.z+2.6,half:.7},inside=rooms.length===4;
   const hz=MK.HALL?(MK.HALL[2]+MK.HALL[3])/2:0,office=room('office');
   portals.push({id:'milked-door',a:'q:'+(front||'far-south'),b:'milked-vestibule',x:MK.DOOR.x,z:MK.DOOR.z,nx:0,nz:-1,half:MK.DOOR.half||1},{id:'milked-inner-door',a:'milked-vestibule',b:inside?'milked-reception':'milked',x:MK.INNER.x,z:MK.INNER.z,nx:0,nz:-1,half:MK.INNER.half||1},
    {id:'milked-rear-door',a:'q:'+(rear||'far-south'),b:'milked-lobby',x:MK.REAR.x,z:MK.REAR.z,nx:0,nz:1,half:MK.REAR.half||.7},{id:'milked-lobby-door',a:'milked-lobby',b:inside?'milked-staff':'milked',x:north.x,z:north.z,nx:0,nz:1,half:north.half||.7});
   if(inside)portals.push({id:'milked-side-door',a:'milked-reception',b:'milked-hall',x:MK.HALL[0],z:hz,nx:1,nz:0,half:.65},{id:'milked-staff-door',a:'milked-hall',b:'milked-staff',x:MK.HALL[1],z:hz,nx:1,nz:0,half:.65},
    {id:'milked-office-door',a:'milked-staff',b:'milked-office',x:office[0]+1.25,z:office[2],nx:0,nz:1,half:.65},{id:'milked-lobby-west',a:'milked-lobby',b:'milked',x:(MK.LOBBY_W||{}).x||MK.LOBBY[0],z:(MK.LOBBY_W||{}).z||MK.LOBBY[2]+1,nx:-1,nz:0,half:.65});}
  if(QT&&QT.LANES){for(const l of QT.LANES){const g=QT.gate(l.gate);if(!g)continue;regions.push({id:'lane:'+l.key,rects:[l.rect]});
    for(const end of ['lo','hi']){const e=g.ends[end],door=l.doors&&l.doors[end];if(!e||!door)continue;const into=end==='lo'?1:-1;   // from the quarter at this end, into the lane
     portals.push({id:l.key+':'+end,a:e.quarter?'q:'+e.quarter:'scene:'+e.scene,b:'lane:'+l.key,x:door.x,z:door.z,nx:g.axis==='x'?into:0,nz:g.axis==='z'?into:0,half:door.half||1,penalty:l.kind==='bay'?TUNE.bayPenalty:0});}}}
  // The streets of each quarter (ncz-quarters.js) are regions too, joined where they meet (a junction is a gate across the shared edge), so a route turns at
  // street corners instead of cutting across buildings or back through a gate. A door onto a street joins the street just outside it.
  const streets=[];if(QT&&QT.QUARTERS){const same=(r,q)=>!!q&&r.every((v,i)=>Math.abs(v-q[i])<.01);
   for(const q of QT.IDS||Object.keys(QT.QUARTERS))(QT.QUARTERS[q].streets||[]).forEach((r,i)=>{if(!(NC&&(same(r,NC.RECT)||same(r,NC.HALL))))streets.push({id:'s:'+q+':'+i,rects:[r],quarter:q});});
   for(let i=0;i<streets.length;i++)for(let j=i+1;j<streets.length;j++){const A=streets[i],B=streets[j];if(A.quarter!==B.quarter)continue;const a=A.rects[0],c=B.rects[0],x0=Math.max(a[0],c[0]),x1=Math.min(a[1],c[1]),z0=Math.max(a[2],c[2]),z1=Math.min(a[3],c[3]);
    if(x1<x0-.05||z1<z0-.05)continue;const w=Math.max(0,x1-x0),h=Math.max(0,z1-z0),alongX=w<h,ca=[(a[0]+a[1])/2,(a[2]+a[3])/2],cb=[(c[0]+c[1])/2,(c[2]+c[3])/2],sx=Math.sign(cb[0]-ca[0])||1,sz=Math.sign(cb[1]-ca[1])||1;
    portals.push({id:'junction:'+A.id+':'+B.id,a:A.id,b:B.id,x:(x0+x1)/2,z:(z0+z1)/2,nx:alongX?sx:0,nz:alongX?0:sz,half:(alongX?h:w)/2});}
   const street=(x,z)=>(streets.find(r=>inRect(r.rects[0],x,z))||{}).id;
   for(const p of portals)for(const [k,dir] of [['a',-1],['b',1]]){const id=p[k];if(typeof id!=='string'||!id.startsWith('q:'))continue;const hit=street(p.x+p.nx*dir,p.z+p.nz*dir);if(hit)p[k]=hit;}}
  const near=(x,z,hint)=>{let best=null;for(const r of streets){const q=r.rects[0],d=Math.hypot(Math.max(q[0]-x,0,x-q[1]),Math.max(q[2]-z,0,z-q[3]))+(hint&&r.quarter!==hint?.5:0);if(d<=3&&(!best||d<best.d))best={d,id:r.id};}return best&&best.id;};
  return graph([...regions,...streets],portals,QT?(x,z,hint)=>QT.quarterAt(x,z,hint):null,near);}
 // The older stations (hangar, Meridian, Kepler...): a hangar (z < 3), a corridor (3..19) and the concourse beyond, joined by doors on the centre line.
 function station(){const band=(lo,hi)=>(x,z)=>z>=lo&&z<hi;
  return graph([{id:'st-hangar',test:band(-1e9,3)},{id:'st-corridor',test:band(3,19)},{id:'st-concourse',test:band(19,1e9)}],
   [{id:'st-door-3',a:'st-hangar',b:'st-corridor',x:0,z:3,nx:0,nz:1,half:2},{id:'st-door-19',a:'st-corridor',b:'st-concourse',x:0,z:19,nx:0,nz:1,half:2}],null);}

 /* The route from `from` {x,z,quarter?} to `goal` {x,y?,z}: waypoints [{id, kind:'door'|'apron'|'goal', x, y, z, nx, nz, half, r, door?}], the goal last.
    opt.prefer: a Set of waypoint ids already in use (they win ties). */
 function plan(G,from,goal,opt={}){const end={id:'goal',kind:'goal',x:goal.x,y:Number.isFinite(goal.y)?goal.y:1.7,z:goal.z};if(!G)return [end];
  const start=regionAt(G,from.x,from.z,from.quarter),target=regionAt(G,goal.x,goal.z,null);if(!start||!target||start===target)return [end];
  const prefer=opt.prefer||null,best=new Map(),open=[{region:start,x:from.x,z:from.z,cost:0,path:[]}];let found=null;
  while(open.length){let k=0;for(let i=1;i<open.length;i++)if(open[i].cost<open[k].cost)k=i;const c=open.splice(k,1)[0];if(found&&c.cost>=found.total)break;
   if(c.region===target){const total=c.cost+Math.hypot(goal.x-c.x,goal.z-c.z);if(!found||total<found.total)found={total,path:c.path};continue;}
   for(const p of G.portals){const dir=p.a===c.region?1:p.b===c.region?-1:0;if(!dir||c.path.some(s=>s.p===p))continue;const id=p.id+(dir>0?'>':'<');
    let cost=c.cost+Math.hypot(p.x-c.x,p.z-c.z)+(p.penalty||0);if(prefer&&prefer.has(id))cost=Math.max(c.cost,cost-TUNE.preferBonus);
    if(best.has(id)&&best.get(id)<=cost)continue;best.set(id,cost);open.push({region:dir>0?p.b:p.a,x:p.x,z:p.z,cost,path:[...c.path,{p,dir,id,into:dir>0?p.b:p.a}]});}}
  if(!found)return [end];
  const doors=found.path.map(s=>{const p=s.p;return {id:s.id,kind:'door',x:p.x,y:1.7,z:p.z,nx:p.nx*s.dir,nz:p.nz*s.dir,half:p.half,r:TUNE.passRadius};}),out=[];
  // An APRON a little beyond a door wherever the next leg turns away from straight through it (out onto a street, from a room into a corridor), so the arrow
  // first points out through the door, never along the wall beside it.
  doors.forEach((d,i)=>{out.push(d);const n=doors[i+1]||end,dx=n.x-d.x,dz=n.z-d.z,l=Math.hypot(dx,dz)||1;
   if((dx*d.nx+dz*d.nz)/l<Math.cos(TUNE.apronTurn))out.push({id:d.id+'+',kind:'apron',x:d.x+d.nx*TUNE.apron,y:1.7,z:d.z+d.nz*TUNE.apron,nx:d.nx,nz:d.nz,half:d.half,r:TUNE.apronRadius,door:d});});
  out.push(end);return out;}
 // Signed distance through a waypoint's plane (travel direction positive) and the distance along it.
 // An apron is reached at its own point; going back is measured from its door (the route returns only when the player is back through the DOOR).
 function side(w,p,ref=w){const dx=p.x-ref.x,dz=p.z-ref.z;return {s:dx*w.nx+dz*w.nz,lat:Math.abs(-dx*w.nz+dz*w.nx)};}
 function passed(w,p){if(!w||w.kind==='goal')return false;if(Math.hypot(p.x-w.x,p.z-w.z)<w.r)return true;const {s,lat}=side(w,p);return s>TUNE.planeMargin&&lat<=w.half+TUNE.planeSlack;}
 function behind(w,p){if(!w||w.kind==='goal')return false;const {s,lat}=side(w,p,w.door||w);return s<-TUNE.backtrack&&lat<=w.half+TUNE.planeSlack+TUNE.backtrack;}
 // Which waypoint of `route` to head for, given the one in use (`cur`, an id) and the player `p`.
 function advance(route,cur,p){let i=cur?route.findIndex(w=>w.id===cur):-1;if(i<0)i=0;while(i>0&&behind(route[i-1],p))i--;while(i<route.length-1&&passed(route[i],p))i++;return i;}
 // How visible the arrow is for a horizontal distance to the goal (1: fully).
 const nearAlpha=d=>Math.max(0,Math.min(1,(d-TUNE.nearHide)/Math.max(1e-3,TUNE.nearFade-TUNE.nearHide)));

 /* One player's arrow. update({graph, scene, area, quarter, player:{x,z}, goal:{x,y,z}, key, dt}) ->
    {waypoint, index, route, bearing (smoothed world yaw), raw (unsmoothed), alpha, length (route metres), final, snapped}; null when there is no goal. */
 function follower(){let prev=null,key=null,cur=null,ang=NaN,fade=1,last=null,goal=null,where=null,ids=[],out=null;
  function reset(){key=cur=prev=null;ang=NaN;last=null;goal=null;ids=[];out=null;}
  function update(o){if(!o||!o.goal||!o.player||!Number.isFinite(o.player.x)||!Number.isFinite(o.goal.x)){reset();return null;}
   const dt=Math.max(0,Math.min(.25,Number(o.dt)||0)),p={x:o.player.x,z:o.player.z},k=String(o.key??'goal'),w=String(o.scene||'')+'|'+String(o.area||'')+'|'+String(o.quarter||'');let snap=false;
   if(k!==key){key=k;cur=prev=null;ids=[];goal=null;snap=true;}
   if(w!==where){if(where!==null)snap=true;where=w;}
   if(last&&Math.hypot(p.x-last.x,p.z-last.z)>TUNE.teleport)snap=true;last=p;
   const g=o.goal,gy=Number.isFinite(g.y)?g.y:1.7;
   if(!goal||snap||Math.hypot(g.x-goal.x,g.z-goal.z)>TUNE.moveSnap)goal={x:g.x,y:gy,z:g.z};else{const f=1-Math.exp(-dt*3/TUNE.moveTime);goal={x:goal.x+(g.x-goal.x)*f,y:goal.y+(gy-goal.y)*f,z:goal.z+(g.z-goal.z)*f};}
   let route=plan(o.graph||null,{x:p.x,z:p.z,quarter:o.quarter||null},goal,{prefer:new Set(ids)});
   // Stepping over a region's edge can drop the waypoint in use from a fresh plan (just out of a door, the street plan no longer has that door's apron): keep
   // the rest of the route in use (advance() moves along it) while that waypoint is within `keep` metres, so the arrow never skips ahead and swings.
   if(cur&&prev&&!route.some(x=>x.id===cur)){const j=prev.findIndex(x=>x.id===cur),w=prev[j];if(w&&w.kind!=='goal'&&Math.hypot(w.x-p.x,w.z-p.z)<TUNE.keep)route=[...prev.slice(j,-1),route[route.length-1]];}
   const i=advance(route,cur,p),t=route[i];cur=t.id;ids=route.map(x=>x.id);prev=route;
   const d=Math.hypot(t.x-p.x,t.z-p.z),raw=d>TUNE.hold?bearing(p,t):(Number.isFinite(ang)?ang:bearing(p,t));
   if(snap||!Number.isFinite(ang)){ang=wrap(raw);fade=0;}else ang=smoothAngle(ang,raw,dt);fade=snap?0:Math.min(1,fade+(TUNE.snapFade>0?dt/TUNE.snapFade:1));
   let length=d;for(let j=i+1;j<route.length;j++)length+=Math.hypot(route[j].x-route[j-1].x,route[j].z-route[j-1].z);
   const gd=Math.hypot(goal.x-p.x,goal.z-p.z);
   out={waypoint:t,index:i,route,bearing:ang,raw,alpha:Math.min(fade,nearAlpha(gd)),length,goalDistance:gd,final:i===route.length-1,snapped:snap,key};return out;}
  return {update,reset,get last(){return out;}};}

 const node=typeof module!=='undefined'&&module.exports;
 // The graph for a walking scene (cached; the gate list can grow: ncz-quarters.js define()). kind: 'station' for the older stations' corridor; null: straight to the goal.
 const cache=new Map();
 function deps(){if(node)return {N:require('./neochinatown.js'),QT:require('./ncz-quarters.js'),NC:require('./ncz-nightclub.js'),MK:require('./milked.js')};return {N:root.VoidNeoChinatown,QT:root.VoidQuarters,NC:root.VoidNightclub,MK:root.VoidMilked};}
 function graphFor(scene,kind){if(kind==='station'){if(!cache.has('station'))cache.set('station',station());return cache.get('station');}
  if(scene!=='neochinatown'&&scene!=='milked')return null;const D=deps(),n=(D.QT&&D.QT.LANES||[]).length,c=cache.get('ncz');if(c&&c.lanes===n)return c.g;const g=neochinatown(D);cache.set('ncz',{g,lanes:n});return g;}
 const api={TUNE,wrap,smoothAngle,bearing,graph,regionAt,neochinatown,station,graphFor,plan,passed,behind,advance,nearAlpha,follower};
 if(node)module.exports=api;else root.VoidGuideRoute=api;
})(typeof globalThis!=='undefined'?globalThis:this);
