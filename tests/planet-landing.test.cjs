/* Planet landings and take-offs (planet-landing.js, 20 Nov 2026): no dead ends (always a way home to NeoChinatown, every planet location on the map is landable,
   a ship-less District player away from home takes the shuttle home), the landing at NeoChinatown sets down at the Port, the descent / ascent timelines and camera
   lines (they end on the pad, clear the buildings), the NeoChinatown plan from the real layout, and the wiring (the sequence never changes mode or the route). */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const C=require('../void-runner/campaign.js'),U=require('../void-runner/universe.js'),N=require('../void-runner/nav-coords.js'),L=require('../void-runner/planet-landing.js');
const NC=require('../void-runner/neochinatown.js'),CT=require('../void-runner/ncz-containers.js'),CO=require('../void-runner/corporate.js'),PL=require('../void-runner/planets.js'),ED=require('../void-runner/exploration-data.js');
const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const district=()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;return s;};
const pilot=()=>{const s=district();C.awardStarterShip(s);delete s.story.flags.area;s.location='earth';return s;};
const copy=s=>JSON.parse(JSON.stringify(s));
// One flight to a shown marker, the way the game does it (chooseDestination, Campaign.flight, Campaign.complete). Returns an error string or null.
function fly(s,to){if(!C.chooseDestination(s,to))return 'cannot choose '+to;const f=C.flight(s);if(!f)return 'no flight';if(!C.complete(s))return 'the flight never ends (complete returned null): stuck in space';return s.location===f.destination?null:'landed at '+s.location;}
// Every place reachable through the markers, and from each of them a way home.
function explore(start,active){const seen=new Map([[start.location,start]]),q=[start],errors=[];
 while(q.length){const s=q.shift();for(const m of N.markers(s,active(s))){const c=copy(s),e=fly(c,m);if(e){errors.push(s.location+' -> '+m+': '+e);continue;}if(!seen.has(c.location)){seen.set(c.location,c);q.push(c);}}}
 for(const [loc,s] of seen){if(loc==='earth')continue;const v=new Set([loc]),q2=[s];let home=false;while(q2.length&&!home){const x=q2.shift();for(const m of N.markers(x,active(x))){const c=copy(x);if(fly(c,m))continue;if(c.location==='earth'){home=true;break;}if(!v.has(c.location)){v.add(c.location);q2.push(c);}}}if(!home)errors.push('no way home from '+loc);}
 return {seen:[...seen.keys()],errors};}
const MODES={
 'route-only (a mission at Meridian)':[()=>pilot(),()=>[{id:'m',destination:'meridian'}]],
 'route-only (a mission at Kepler)':[()=>pilot(),()=>[{id:'m',destination:'kepler'}]],
 'known places (no mission)':[()=>pilot(),()=>[]],
 'all locations (coordinates)':[()=>{const s=pilot();N.grant(s,'t');return s;},()=>[]],
 'all locations and both faction systems':[()=>{const s=pilot();N.grant(s,'t');for(const id of ['vigil','nexus','holdfast','order-homeworld'])U.discover(s,id);return s;},()=>[]],
 'route-only to the Nexus':[()=>{const s=pilot();for(const id of ['vigil','nexus'])U.discover(s,id);return s;},()=>[{id:'m',destination:'nexus'}]]};

test('always a way home: from every place the map can reach, in every marker mode, a chain of markers leads back to NeoChinatown',()=>{
 for(const [name,[make,active]] of Object.entries(MODES)){const r=explore(make(),active);assert.deepEqual(r.errors,[],name);assert.ok(r.seen.length>2,name);}
 // and after a warp: from the far side of every jump (each system hub)
 for(const hub of ['meridian','sol-belt','vigil','holdfast']){const s=pilot();N.grant(s,'t');for(const id of ['vigil','nexus','holdfast','order-homeworld'])U.discover(s,id);s.location=hub;U.visit(s);assert.deepEqual(explore(s,()=>[]).errors,[],hub);}
});

test('every planet location on the map is landable: a descent, a landing area, a walkable scene with a BOARD point',()=>{
 const s=pilot();N.grant(s,'t');for(const id of ['vigil','nexus','holdfast','order-homeworld'])U.discover(s,id);const reach=explore(s,()=>[]).seen;
 const planets=Object.keys(U.locations).filter(U.planetside);assert.deepEqual(planets.sort(),['earth','mars','nexus','order-homeworld','vesper'].sort());
 for(const id of planets){assert.ok(L.landable(id),id);assert.ok(reach.includes(id),id+' can be flown to');const b=L.biome(id);assert.ok(b.pad&&b.planet&&b.at.length===3,id);}
 // the walkable scene dock() enters for each (world-integration.js dock, homeworld-scenes.js), each with BOARD
 const scene={earth:NC.layout('street','port'),mars:ED.locations['mars-terminal'],nexus:PL.layout('nexus'),'order-homeworld':PL.layout('order-homeworld')};
 for(const [id,l] of Object.entries(scene))assert.ok(l.interactions.some(i=>i.action==='board'),id+' has a BOARD point');
 assert.match(read('void-runner/world-integration.js'),/state\.location==='mars'\?'mars-terminal'/);assert.match(read('void-runner/homeworld-scenes.js'),/VoidUniverse\.locations\[state\.location\]\?\.planet\)return enterWalking\('planet-'/);
 for(const id of Object.keys(U.locations))if(!U.planetside(id))assert.equal(L.landable(id),false,'no descent at a station: '+id);
});

test('landing at NeoChinatown from a flight sets down at the Port, on the street (never inside the District or another quarter)',()=>{
 const s=pilot();s.location='sol-belt';U.visit(s);s.story.flags.area='district';s.story.flags.districtBadge=true;s.story.flags.quarter='avenue';
 assert.equal(fly(s,'earth'),null);assert.equal(s.location,'earth');assert.equal(s.story.flags.area,undefined);assert.equal(s.story.flags.quarter,undefined,'no quarter = the Port');
 const m=pilot();m.location='sol-belt';U.visit(m);m.story.flags.quarter='avenue';assert.equal(fly(m,'mars'),null);assert.equal(m.story.flags.quarter,'avenue','other places leave the city flags alone');
});

test('no ship away from home: the passenger shuttle home (District campaigns only)',()=>{
 const s=district();delete s.story.flags.area;s.location='meridian';U.visit(s);s.story.flags.quarter='oldtown';
 assert.equal(L.needsShuttle(s),true);assert.equal(L.shuttleHome(s),true);assert.equal(s.location,'earth');assert.equal(s.story.flags.quarter,undefined);assert.equal(s.story.flags.area,undefined);
 assert.equal(s.progression.checkpoint.location,'earth');assert.equal(s.story.flags.shuttleFrom,'meridian');assert.equal(L.shuttleHome(s),false,'at home: nothing to do');
 const owner=pilot();owner.location='meridian';assert.equal(L.needsShuttle(owner),false,'a ship owner flies');
 const opening=C.fresh();opening.location='vesper';assert.equal(L.needsShuttle(opening),false,'the old Vesper opening keeps its own story');
 // reload keeps it home (cloud saves accept the short string flag)
 const r=C.restore(JSON.stringify(s));assert.equal(r.location,'earth');
});

test('the timelines: a 15 to 25 s descent, a shorter ascent, phases in order',()=>{
 const d=L.duration('descent'),a=L.duration('ascent');assert.ok(d>=15&&d<=25,d);assert.ok(a>=10&&a<=18,a);
 assert.deepEqual(L.TIMELINES.descent.map(p=>p[0]),['orbit','entry','clouds','approach','touchdown']);assert.deepEqual(L.TIMELINES.ascent.map(p=>p[0]),['liftoff','climb','clouds','space']);
 assert.equal(L.phaseAt('descent',0).id,'orbit');assert.equal(L.phaseAt('descent',d-.01).id,'touchdown');assert.equal(L.phaseAt('descent',d+5).id,'touchdown');assert.equal(L.phaseAt('ascent',.1).id,'liftoff');
 const c=L.captions('earth','descent');assert.match(c.orbit,/SERVO/);assert.match(c.orbit,/TESSALY SYSTEM/);assert.match(c.touchdown,/PORT/);assert.match(c.approach,/NEOCHINATOWN/);
 assert.equal(L.enabled({getItem:()=>null}),true,'on by default');assert.equal(L.enabled({getItem:()=>'off'}),false);
});

test('the camera lines: the descent ends on the pad at cockpit height facing the way the ship stands; the ascent starts there; never below ground',()=>{
 for(const id of Object.keys(L.BIOMES)){const b=L.biome(id),end=L.camera(id,'descent',L.duration('descent')-1e-3),st=L.camera(id,'ascent',0);
  assert.ok(Math.abs(end.pos[0]-b.at[0])<.01&&Math.abs(end.pos[2]-b.at[1])<.01,id);assert.ok(Math.abs(end.pos[1]-b.eye)<.05,id+' eye height');assert.ok(end.touched,id);
  const fy=Math.atan2(b.face[0],b.face[1]),dy=Math.atan2(Math.sin(end.yaw-fy),Math.cos(end.yaw-fy));assert.ok(Math.abs(dy)<.01,id+' faces the way the ship stands');
  assert.ok(Math.abs(st.pos[1]-b.eye)<.05&&Math.abs(st.pos[0]-b.at[0])<.01,id);
  for(const kind of ['descent','ascent'])for(let t=0;t<L.duration(kind);t+=.1){const c=L.camera(id,kind,t);if(!c.space)assert.ok(c.pos[1]>=b.eye-.2,id+' '+kind+' '+t);}}
 // NeoChinatown's ship stands nose south on the pad (neochinatown.js rotation.y = PI at x 22, z -96)
 assert.match(read('void-runner/neochinatown.js'),/ship\.position\.set\(22,1\.9,-96\);ship\.scaling\.setAll\(2\.2\);ship\.rotation\.y=Math\.PI/);assert.deepEqual(L.biome('earth').face,[0,-1]);
});

test('NeoChinatown from the air is the real layout: plots between the streets, the Port pad clear, the District, the Corporate District west; the flight clears every roof',()=>{
 for(const q of ['low','medium','high']){const p=L.cityPlan(NC,CT,CO,q),open=[...Object.values(NC.streets),...Object.values(NC.footprints)];
  assert.ok(p.plots.length>500,q);for(const b of p.plots)for(const r of open)assert.ok(!(b.x0<r[1]-.26&&b.x1>r[0]+.26&&b.z0<r[3]-.26&&b.z1>r[2]+.26),'a plot on a street '+JSON.stringify(b));
  assert.ok(p.landmarks.some(l=>l.id==='district'&&l.r===NC.footprints.district));assert.deepEqual(p.pad.rect,NC.streets.pad);
  assert.ok(p.corp.length===CO.BLOCKS.length&&p.corp.every(c=>c.x1<NC.cityBox[0]-500),'the Corporate District stands west of the city');
  assert.ok(p.homes.length>20,'the Outskirts container homes');assert.ok(p.lamps.length>30&&p.strips.length>100&&p.signs.length>30);
  for(const kind of ['descent','ascent'])for(let t=0;t<L.duration(kind);t+=.05){const c=L.camera('earth',kind,t);if(c.space||c.phase==='touchdown'||c.phase==='liftoff')continue;const h=L.heightAt(p,c.pos[0],c.pos[2]);assert.ok(c.pos[1]-h>8,q+' '+kind+' '+t.toFixed(2)+' '+c.pos[1].toFixed(1)+' over '+h);}}
 const lo=L.cityPlan(NC,CT,CO,'low'),hi=L.cityPlan(NC,CT,CO,'high');assert.ok(lo.towers.length<hi.towers.length&&lo.mid.length<hi.mid.length,'quality tiers');
 assert.deepEqual(L.cityPlan(NC,CT,CO,'high'),hi,'deterministic');
});

test('wiring: loaded after flight-nav.js, presentation only (never changes mode or the route), sounds from flight-sfx.js, the setting, the build',()=>{
 const html=read('void-runner.html');assert.equal(html,read('static/void-runner.html'));const a=html.indexOf('void-runner/flight-nav.js'),b=html.indexOf('void-runner/planet-landing.js'),c=html.indexOf('void-runner/bootstrap.js');assert.ok(a>0&&b>a&&c>b);
 const src=read('void-runner/planet-landing.js');assert.doesNotMatch(src,/[^=!]mode\s*=[^=]/,'never assigns mode');assert.doesNotMatch(src,/flight\.route\s*=[^=]/,'never replaces the route');
 for(const w of ['arrive=function','launch=function','leaveWalking=async function','settingsPage=function','draw=function','update=function'])assert.ok(src.includes(w),w);
 assert.match(src,/landing-seq-setting/);assert.match(src,/data-landing-skip/);assert.match(src,/'Space','Enter','Escape'/);
 const sfx=read('void-runner/flight-sfx.js');for(const n of ['entry','wind','thrusters','gear','touchdown','steam','liftoff'])assert.match(sfx,new RegExp('\\n  '+n+'\\(\\)'));assert.match(sfx,/function play\(name/);
 // the Mission 012 / beginner flight steps read the same state the sequence leaves alone
 assert.match(read('void-runner/mission-mechanics-game.js'),/o\.stage==='board'&&m==='play'&&s\.location==='earth'/);assert.match(read('void-runner/mission-mechanics-game.js'),/o\.stage==='launch'&&r&&\['align','warp','encounter','arrived'\]\.includes\(r\.phase\)/);
 assert.match(read('void-runner/beginner-integration.js'),/fire\('board-ship'\)/);
 assert.match(read('void-runner-sw.js').split('\n')[3],/^const BUILD='\d{4}-\d{2}-\d{2}-[a-z0-9-]+';\r?$/);
});
