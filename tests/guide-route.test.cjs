/* The yellow guide arrow on foot (the owner, 17 Nov 2026: "The mission arrow sometimes switches directions ... if it's pointing at a doorway and you walk slightly
   past the marker point the arrow points backwards for a bit"). void-runner/guide-route.js: doorways are gates passed by radius or by crossing their plane, a route
   never goes back without the player going back through a door, the arrow's direction is smoothed (shortest arc), near the goal it fades.
   Walks here sample the arrow every 1/60 s along real routes (District rooms, the vestibule, NULL, Milked, the quarter gates A1-A6). The browser walk: tests/arrow-route-browser.cjs. */
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const R=require(path.join(__dirname,'..','void-runner','guide-route.js')),N=require(path.join(__dirname,'..','void-runner','neochinatown.js')),QT=require(path.join(__dirname,'..','void-runner','ncz-quarters.js')),
 NC=require(path.join(__dirname,'..','void-runner','ncz-nightclub.js')),MK=require(path.join(__dirname,'..','void-runner','milked.js')),A=require(path.join(__dirname,'..','void-runner','district-area.js'));
const G=R.graphFor('neochinatown'),T=R.TUNE,deg=r=>r*180/Math.PI,L=(x,z)=>N.toWorld(x,z),DT=1/60;
const NULL_DOOR={x:NC.DOOR.x+1.6,y:1.7,z:NC.DOOR.z};
const JUNO={x:NC.JUNO.x,y:1.7,z:NC.JUNO.z};
const admin=()=>{const a=N.layout('interior').interactions.find(i=>i.id==='admin');return {x:a.position[0],y:1.7,z:a.position[2]};};
/* Walk a polyline in 5 cm steps (3 m/s at 60 fps); returns every sample. opts: area(x,z) for the area / quarter at each point. */
function walk(points,goal,{f=R.follower(),key='m',step=.05,area=()=>'',quarter=()=>''}={}){const out=[];
 for(let s=0;s<points.length-1;s++){const [ax,az]=points[s],[bx,bz]=points[s+1],n=Math.max(1,Math.ceil(Math.hypot(bx-ax,bz-az)/step)),travel=Math.atan2(bx-ax,bz-az);
  for(let i=0;i<n;i++){const t=i/n,x=ax+(bx-ax)*t,z=az+(bz-az)*t,o=f.update({graph:G,scene:'neochinatown',area:area(x,z),quarter:quarter(x,z),player:{x,z},goal,key,dt:DT});out.push({x,z,travel,seg:s,...o});}}
 return out;}
/* The checks every walk must pass: consecutive samples never turn more than 100 degrees; once a door is passed the route index never goes back during a forward walk;
   and after a door the arrow never points backwards (more than 100 degrees from the way the player walks) while the player keeps walking the route. */
function smooth(samples,label){let worst=0,at=null;for(let i=1;i<samples.length;i++){const d=Math.abs(deg(R.wrap(samples[i].bearing-samples[i-1].bearing)));if(d>worst&&!samples[i].snapped){worst=d;at=samples[i];}}
 assert.ok(worst<100,label+': the arrow turned '+worst.toFixed(0)+' degrees in one frame at '+(at&&at.x.toFixed(2)+','+at.z.toFixed(2)));
 // a waypoint once left behind never becomes the target again on a forward walk
 const left=new Set();for(let i=1;i<samples.length;i++){const a=samples[i-1].waypoint.id,b=samples[i].waypoint.id;if(a!==b)left.add(a);assert.ok(!left.has(b),label+': the route went back to '+b+' at '+samples[i].x.toFixed(2)+','+samples[i].z.toFixed(2));}
 return worst;}
function neverBackwards(samples,label,limit=100){for(const s of samples){if(s.alpha<=.01)continue;const d=Math.abs(deg(R.wrap(s.raw-s.travel)));if(d>limit)assert.fail(label+': the arrow pointed '+d.toFixed(0)+' degrees from the walking direction at '+s.x.toFixed(2)+','+s.z.toFixed(2)+' (waypoint '+s.waypoint.id+')');}}
const ids=(from,goal)=>R.plan(G,from,goal).map(w=>w.id);

test('angles: wrap and shortest-arc, time-based smoothing',()=>{
 assert.ok(Math.abs(R.wrap(3*Math.PI)-Math.PI)<1e-9||Math.abs(R.wrap(3*Math.PI)+Math.PI)<1e-9);assert.ok(Math.abs(R.wrap(-Math.PI/2-4*Math.PI)+Math.PI/2)<1e-9);
 // 170 -> -170 goes the short way (+20 through 180), never back through 0
 const a=R.smoothAngle(170*Math.PI/180,-170*Math.PI/180,.05);assert.ok(Math.abs(a)>170*Math.PI/180,'took the long way: '+deg(a));
 let x=-175*Math.PI/180;for(let i=0;i<60;i++){const nx=R.smoothAngle(x,175*Math.PI/180,DT);assert.ok(Math.abs(deg(R.wrap(nx-x)))<=10.01,'spun');x=nx;}assert.ok(Math.abs(deg(R.wrap(x-175*Math.PI/180)))<.5);
 // time-based: two half steps equal one full step; about 95% after smoothTime
 const one=R.smoothAngle(0,1,.1),two=R.smoothAngle(R.smoothAngle(0,1,.05),1,.05);assert.ok(Math.abs(one-two)<1e-9);
 const s=R.smoothAngle(0,1,T.smoothTime);assert.ok(s>.94&&s<.96,'settle '+s);assert.ok(T.smoothTime>=.15&&T.smoothTime<=.25);
 assert.equal(R.smoothAngle(NaN,2,DT),2);assert.equal(R.smoothAngle(1,2,0),1);});

test('waypoint advance: a doorway passes by radius or by crossing its plane, within its width',()=>{
 const route=R.plan(G,{x:L(0,40)[0],z:L(0,40)[1]},NULL_DOOR),inner=route[0];assert.equal(inner.id,'district-inner-door<');
 const at=(lx,lz)=>{const [x,z]=L(lx,lz);return {x,z};};
 assert.equal(R.passed(inner,at(0,26+T.passRadius+.2)),false);assert.equal(R.passed(inner,at(0,26+T.passRadius-.1)),true);   // radius
 assert.equal(R.passed(inner,at(2.9,25.7)),true);                              // crossed the plane, inside the door's width (radius alone: 2.9 m away)
 assert.equal(R.passed(inner,at(9,25)),false);                                // beyond the plane but far to the side: not through this door
 assert.equal(R.advance(route,null,at(0,25.8)),1);assert.equal(route[1].id,'district-door<');
 // standing exactly on a door: it is passed (no NaN, no zero-length direction)
 const f=R.follower(),o=f.update({graph:G,scene:'neochinatown',player:at(0,26),goal:NULL_DOOR,key:'k',dt:DT});assert.equal(o.waypoint.id,'district-door<');assert.ok(Number.isFinite(o.bearing));});

test('hysteresis: the route returns to a door only when the player is clearly back through it',()=>{
 const at=(lx,lz)=>{const [x,z]=L(lx,lz);return {x,z};},f=R.follower(),u=p=>f.update({graph:G,scene:'neochinatown',player:p,goal:NULL_DOOR,key:'k',dt:DT});
 u(at(0,40));u(at(0,25));assert.equal(f.last.waypoint.id,'district-door<');
 for(const lz of [25.5,26.4,27,27.9])assert.equal(u(at(0,lz)).waypoint.id,'district-door<','went back to the inner door at local z '+lz);   // within 2 m back through it
 assert.equal(u(at(0,26+T.backtrack+.3)).waypoint.id,'district-inner-door<');   // clearly back in the hall
 assert.equal(u(at(0,25.5)).waypoint.id,'district-door<');
 // an apron: going back is measured from its door
 u(at(0,19.3));assert.equal(f.last.waypoint.id,'district-door<+');u(at(0,20.5));assert.equal(f.last.waypoint.id,'district-door<+');u(at(0,22.4));assert.equal(f.last.waypoint.id,'district-door<');});

test('THE OWNER\'S CASE: leaving the District for NULL, through the vestibule, slightly past each doorway marker, the arrow never points back',()=>{
 // the old arrow, for the record: one point in the middle of the vestibule until the scan swapped the street in; past it, 180 degrees
 const [vx,vz]=L(0,23),[px,pz]=L(0,22.4);assert.ok(Math.abs(deg(R.wrap(Math.atan2(vx-px,vz-pz)-0)))>170,'the old target lies behind a player 0.6 m past it');
 assert.ok(A.centre(N,{x:L(0,24.1)[0],z:L(0,24.1)[1]}),'the checkpoint starts 1.1 m before that point, so a walking player always passed it');
 const pts=[[8,45],[3,46],[1,45],[0,40],[0,26],[0,23],[0,20.3],[0,20],[0,17.4]].map(([a,b])=>L(a,b));pts.push([71,-58.5],[NULL_DOOR.x+1.6,NULL_DOOR.z]);
 const s=walk(pts,NULL_DOOR,{area:(x,z)=>N.zone({x,z}).area==='district'?'interior':'street'});smooth(s,'Admin to NULL');neverBackwards(s,'Admin to NULL');
 // slightly past each marker: 0.3 m past the inner door, the vestibule's middle and the outer door
 for(const lz of [25.7,22.7,19.7]){const p=s.find(q=>Math.abs(q.z-L(0,lz)[1])<.03&&Math.abs(q.x-L(0,lz)[0])<.03);assert.ok(p,'sample at '+lz);assert.ok(Math.abs(deg(R.wrap(p.raw-p.travel)))<45,'0.3 m past local z '+(lz+.3)+': '+deg(R.wrap(p.raw-p.travel)).toFixed(0));}
 // just out of the outer door the arrow points out of the door (the apron), never along the front wall
 const out=s.find(q=>Math.abs(q.z-L(0,19.6)[1])<.03);assert.equal(out.waypoint.id,'district-door<+');
 // the player stops in the vestibule during the scan and the street replaces the interior: same route, same waypoint
 const f=R.follower(),[x1,z1]=L(0,22.8);f.update({graph:G,scene:'neochinatown',area:'interior',player:{x:x1,z:z1-1},goal:NULL_DOOR,key:'k',dt:DT});
 const a=f.update({graph:G,scene:'neochinatown',area:'interior',player:{x:x1,z:z1},goal:NULL_DOOR,key:'k',dt:DT}),b=f.update({graph:G,scene:'neochinatown',area:'street',quarter:'oldtown',player:{x:x1,z:z1},goal:NULL_DOOR,key:'k',dt:DT});
 assert.equal(a.waypoint.id,b.waypoint.id);assert.ok(Math.abs(R.wrap(a.raw-b.raw))<1e-9);});

test('entering the District from the street to Admin: outer door, vestibule, inner door, the hall, the shop door, Admin',()=>{
 const g=admin(),start=L(0,17.4);assert.deepEqual(ids({x:start[0]-15,z:start[1]},g),['district-door>','district-inner-door>','district-shop-door>','goal']);
 const pts=[[start[0]-15,start[1]],start,...[[0,20],[0,23],[0,26],[0,45],[1.5,46],[3,46],[5,46.2],[7.2,46.2]].map(([a,b])=>L(a,b))];
 const s=walk(pts,g);smooth(s,'street to Admin');neverBackwards(s.filter(q=>q.seg<7),'street to Admin');
 const end=s[s.length-1];assert.equal(end.final,true);assert.ok(end.alpha<1,'fading near Admin');});

test('rooms with several doors: from the bar to the arcade and from the VR area to the pods, out of one room, along the hall, into the other',()=>{
 const [bx,bz]=L(10,35),[ax,az]=L(-8,62);assert.deepEqual(ids({x:bx,z:bz},{x:ax,z:az}),['district-bar-door<','district-bar-door<+','district-arcade-door>','goal']);
 const [vx,vz]=L(-10,36),[px,pz]=L(0,75);assert.deepEqual(ids({x:vx,z:vz},{x:px,z:pz}),['district-vr-door<','district-vr-door<+','district-pods-door>','goal']);
 const pts=[[10,35],[3,33],[1,33],[0,40],[0,60],[-1.5,62],[-3,62],[-5,62],[-8,62]].map(([a,b])=>L(a,b));const s=walk(pts,{x:ax,y:1.7,z:az});smooth(s,'bar to arcade');neverBackwards(s.filter(q=>q.seg!==3),'bar to arcade');
 // never aims through the hall's east wall: just inside the bar door, the arrow leads to the apron in the hall, not straight at the arcade door
 const near=s.find(q=>Math.abs(q.x-L(3.8,33)[0])<.04);assert.equal(near.waypoint.id,'district-bar-door<+');});

test('multi-hop: from the District hall to Juno Vex inside NULL, through the vestibule, the alley, Main Street and NULL\'s entry',()=>{
 const [hx,hz]=L(0,50);assert.deepEqual(ids({x:hx,z:hz},JUNO),['district-inner-door<','district-door<','district-door<+','junction:s:oldtown:0:s:oldtown:1<','null-door>','null-inner-door>','goal']);
 const pts=[[0,50],[0,26],[0,20],[0,17.4]].map(([a,b])=>L(a,b));pts.push([71,-58.5],[NC.ENTRY.doors.outer.x+1,NC.DOOR.z],[NC.ENTRY.doors.inner.x-1.5,NC.DOOR.z],[JUNO.x+2,JUNO.z-1.5]);
 const s=walk(pts,JUNO);smooth(s,'hall to Juno');neverBackwards(s.filter(q=>q.seg<6),'hall to Juno');
 // and back out of NULL to Admin
 const back=ids({x:30,z:-55},admin());assert.deepEqual(back.filter(i=>!i.startsWith('junction:')),['null-inner-door<','null-door<','district-door>','district-inner-door>','district-shop-door>','goal']);});

test('quarter gates A1-A6: walkers go through the nearest foot lane, both doors, and out; the lane never alternates',()=>{
 // A2 North Gate: the Avenue to NULL
 const r=ids({x:56,z:-12},NULL_DOOR);assert.deepEqual(r.slice(0,2),['north:foot-w:hi>','north:foot-w:lo<']);
 const r2=ids({x:68,z:-12},NULL_DOOR);assert.deepEqual(r2.slice(0,2),['north:foot-e:hi>','north:foot-e:lo<']);
 // standing between the two lanes, walking across: the lane in use is kept (preferBonus)
 const f=R.follower();let first=null;for(let x=60;x<=64;x+=.05){const o=f.update({graph:G,scene:'neochinatown',quarter:'avenue',player:{x,z:-14},goal:NULL_DOOR,key:'k',dt:DT});first??=o.waypoint.id;assert.equal(o.waypoint.id,first,'switched lanes at x '+x.toFixed(2));}
 // walk the West lane from the Avenue to NULL's door; the quarter swaps in the middle of the lane
 const l=QT.lane('north:foot-w'),pts=[[52.8,-12],[l.doors.hi.x,l.doors.hi.z+1],[l.mid[0],l.mid[1]],[l.doors.lo.x,l.doors.lo.z-1],[52.8,-40],[NULL_DOOR.x+.5,NULL_DOOR.z+2]];
 const s=walk(pts,NULL_DOOR,{quarter:(x,z)=>z>l.mid[1]?'avenue':'oldtown'});smooth(s,'North Gate');neverBackwards(s.filter(q=>q.seg<4),'North Gate');
 // A5 South Gate (Old Town -> Far South, to Milked), A6 Far South Gate (Far South -> the Outskirts, walkers only), A1 Port Customs
 const toMilked=ids({x:61,z:-100},{x:MK.DOOR.x,z:MK.DOOR.z+3});assert.ok(toMilked[0].startsWith('south:foot-'),toMilked.join(' '));
 const out=ids({x:61,z:-200},{x:60,z:-240});assert.deepEqual(out.slice(0,2),['far-south-gate:foot:hi>','far-south-gate:foot:lo<']);
 const port=ids({x:61,z:-110},{x:25,z:-95});assert.ok(port.some(i=>i.startsWith('customs:foot:')),port.join(' '));
 // a walker never routes through a vehicle bay unless standing in it
 for(const g of QT.GATES)for(const w of R.plan(G,{x:61,z:-60},{x:61,z:-250}))assert.ok(!/:bay/.test(w.id),w.id);
 const bay=QT.lane('north:bay-s');const inBay=ids({x:bay.mid[0],z:bay.mid[1]},NULL_DOOR);assert.ok(inBay[0].startsWith('north:bay-s:'),inBay.join(' '));
 // A6 walk, both ways
 const l6=QT.lane('far-south-gate:foot'),p6=[[60,-200],[l6.doors.hi.x,l6.doors.hi.z+1],[l6.doors.lo.x,l6.doors.lo.z-1],[60,-240]];smooth(walk(p6,{x:60,z:-245}),'A6 south');smooth(walk(p6.slice().reverse(),{x:61,z:-190}),'A6 north');});

test('Milked: in through the front security vestibule, out through the rear lobby',()=>{
 const inside={x:88,z:-181.5};assert.deepEqual(ids({x:81.75,z:-171},inside),['milked-door>','milked-inner-door>','milked-inner-door>+','goal']);
 assert.deepEqual(ids({x:94.75,z:-195},inside).slice(0,2),['milked-rear-door>','milked-lobby-door>']);
 const s=walk([[81.75,-171],[81.75,-174],[81.75,-177],[81.75,-179],[85,-181.5],[88,-181.5]],inside);smooth(s,'Milked');neverBackwards(s.filter(q=>q.seg<3),'Milked');});

test('a moving target is followed, smoothed; a jump is snapped to',()=>{
 const f=R.follower(),p={x:30,z:-60};let prev=null,worst=0;
 for(let i=0;i<240;i++){const g={x:30+6*Math.cos(i/40),z:-52+2*Math.sin(i/40)},o=f.update({graph:G,scene:'neochinatown',player:p,goal:g,key:'juno',dt:DT});if(prev!==null)worst=Math.max(worst,Math.abs(deg(R.wrap(o.bearing-prev))));prev=o.bearing;assert.equal(o.snapped,i===0);}
 assert.ok(worst<6,'per-frame turn '+worst);
 const j=f.update({graph:G,scene:'neochinatown',player:p,goal:{x:60,z:-70},key:'juno',dt:DT});assert.ok(Math.hypot(f.last.route.at(-1).x-60,f.last.route.at(-1).z+70)<1e-9,'a far jump snaps the goal');assert.ok(j);});

test('very close, directly above or below: the arrow fades out and hides instead of jittering',()=>{
 const f=R.follower(),g={x:30,y:1.7,z:-60},at=d=>f.update({graph:G,scene:'neochinatown',player:{x:30+d,z:-60},goal:g,key:'k',dt:1});
 at(5);assert.equal(at(5).alpha,1);assert.equal(at(T.nearHide-.1).alpha,0);assert.ok(at((T.nearHide+T.nearFade)/2).alpha>0&&at((T.nearHide+T.nearFade)/2).alpha<1);
 const up=f.update({graph:G,scene:'neochinatown',player:{x:30,z:-60},goal:{x:30,y:6,z:-60},key:'k',dt:1});assert.equal(up.alpha,0);assert.ok(Number.isFinite(up.bearing));
 // standing on the goal and wobbling by a few cm: the direction is held
 const h=R.follower();h.update({graph:G,scene:'neochinatown',player:{x:28,z:-60},goal:g,key:'k',dt:DT});const b0=h.update({graph:G,scene:'neochinatown',player:{x:29.8,z:-60},goal:g,key:'k',dt:1}).bearing;
 for(const [dx,dz] of [[.1,0],[-.1,.1],[0,-.2],[.05,.05]])assert.equal(h.update({graph:G,scene:'neochinatown',player:{x:30+dx,z:-60+dz},goal:g,key:'k',dt:DT}).bearing,b0);});

test('step change, STOP TRACKING, teleport, scene change and reload: snap with a quick fade; otherwise never a snap',()=>{
 const f=R.follower(),u=(o)=>f.update({graph:G,scene:'neochinatown',area:'street',quarter:'oldtown',dt:DT,...o});
 assert.equal(u({player:{x:100,z:-58},goal:NULL_DOOR,key:'a'}).snapped,true);for(let i=0;i<20;i++)assert.equal(u({player:{x:100-i*.05,z:-58},goal:NULL_DOOR,key:'a'}).snapped,false);
 assert.equal(f.last.alpha,1);
 const c=u({player:{x:99,z:-58},goal:admin(),key:'b'});assert.equal(c.snapped,true);assert.equal(c.alpha,0);   // the step changed: a new goal
 let o;for(let i=0;i<Math.ceil(T.snapFade/DT)+1;i++)o=u({player:{x:99,z:-58},goal:admin(),key:'b'});assert.equal(o.alpha,1,'faded back in within snapFade');
 assert.equal(f.update(null),null);assert.equal(f.last,null);   // STOP TRACKING
 assert.equal(u({player:{x:99,z:-58},goal:admin(),key:'b'}).snapped,true);
 assert.equal(u({player:{x:60,z:-58},goal:admin(),key:'b'}).snapped,true);   // teleport
 assert.equal(u({player:{x:60,z:-58},goal:admin(),key:'b',quarter:'avenue'}).snapped,true);   // quarter / area swap
 // reload mid-route: a fresh follower in the vestibule heads for the outer door, not back to the inner one
 const [x,z]=L(0,22);const r=R.follower().update({graph:G,scene:'neochinatown',area:'interior',player:{x,z},goal:NULL_DOOR,key:'a',dt:0});assert.equal(r.waypoint.id,'district-door<');
 const [x2,z2]=L(0,16);const r2=R.follower().update({graph:G,scene:'neochinatown',area:'street',quarter:'oldtown',player:{x:x2,z:z2},goal:admin(),key:'a',dt:0});assert.equal(r2.waypoint.id,'district-door>');});

test('the older stations: hangar, corridor and concourse doors on the centre line, as before',()=>{
 const S=R.graphFor('hangar','station');assert.deepEqual(R.plan(S,{x:2,z:-5},{x:4,z:30}).map(w=>w.id).filter(i=>!i.endsWith('+')),['st-door-3>','st-door-19>','goal']);
 assert.deepEqual(R.plan(S,{x:2,z:25},{x:-3,z:1}).map(w=>w.id).filter(i=>!i.endsWith('+')),['st-door-19<','st-door-3<','goal']);
 assert.equal(R.graphFor('corporate'),null);assert.equal(R.graphFor('temple'),null);assert.deepEqual(R.plan(null,{x:0,z:0},{x:5,z:5}).map(w=>w.id),['goal']);});

test('every route between the named places walks without a flip (all future missions use the same rules)',()=>{
 const P=require(path.join(__dirname,'..','void-runner','places.js'));const spots=P.NODES.filter(n=>n.scene==='neochinatown'&&!n.whole&&!n.group&&n.rects&&!n.id.startsWith('gate-'))/* a gate's point is the middle of its building, between the lanes */.map(n=>({id:n.id,p:P.target(n.id)})).filter(x=>x.p);
 let walks=0;for(const a of spots)for(const b of spots){if(a===b)continue;const from={x:a.p[0],z:a.p[2]},goal={x:b.p[0],y:1.7,z:b.p[2]},route=R.plan(G,from,goal);
  const pts=[[from.x,from.z],...route.map(w=>[w.x,w.z])];const s=walk(pts,goal,{step:.1});smooth(s,a.id+' -> '+b.id);walks++;}
 assert.ok(walks>100,'walks '+walks);});

test('the route leaves the vestibule as one route across the checkpoint exchange in both directions (the game\'s own trigger zone)',()=>{
 // walking in: the arrow points into the District across the whole centre zone
 const f=R.follower(),g=admin();for(let lz=18;lz<=27;lz+=.05){const [x,z]=L(0,lz),o=f.update({graph:G,scene:'neochinatown',area:lz<23?'street':'interior',quarter:lz<23?'oldtown':'',player:{x,z},goal:g,key:'k',dt:DT});
  if(o.snapped)continue;const d=Math.abs(deg(R.wrap(o.raw-Math.PI)));assert.ok(d<90,'walking in, local z '+lz.toFixed(2)+': '+d.toFixed(0));}});
