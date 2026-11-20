/* Flight-map warp markers and Rook's cargo side missions (20 Nov 2026): nav-coords.js (route-only / full / known), the save migration, grantCoordinates,
   the Mission Editor unlock "nav-coords", and Rook's District board (rook-cargo-jobs.js) after story flag rook-first-delivery-done. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const C=require('../void-runner/campaign.js'),U=require('../void-runner/universe.js'),M=require('../void-runner/mission-log.js'),N=require('../void-runner/nav-coords.js');
const MC=require('../void-runner/mission-content.js'),G=require('../void-runner/mission-givers.js'),RC=require('../void-runner/rook-cargo-jobs.js'),FN=require('../void-runner/flight-nav.js');
const district=()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;return s;};
const reload=s=>C.restore(JSON.stringify(s));
// A new pilot just given the Kestrel (the Awakening tree's ship unlock), on the pad in NeoChinatown.
const newPilot=()=>{const s=district();C.awardStarterShip(s);s.location='earth';return s;};
const toMeridian=[{id:'m',title:'First delivery',destination:'meridian'}];
const sameSet=(a,b,msg)=>assert.deepEqual([...a].sort(),[...b].sort(),msg);
// Flies until the cargo is unloaded (an interstellar job stops at the hub first).
function fly(s){s.dockFees=0;for(let i=0;i<4&&s.contract==='rook-run';i++)s.dockFees+=C.complete(s).repairCharged;return s;}
const rookReady=()=>{const s=newPilot();s.location='meridian';U.visit(s);s.story.flags['rook-first-delivery-done']=true;return s;};

test('a new pilot starts in route-only mode: only the way to Meridian (and home)',()=>{
 const s=newPilot();assert.equal(s.story.flags.navCoords,false,'the ship grant starts the Map in route-only mode');
 assert.equal(N.mode(s,toMeridian),'route');sameSet(N.markers(s,toMeridian),['meridian'],'from NeoChinatown only the warp marker to Meridian’s system (Meridian itself)');
 assert.ok(U.destinations(s).length>1,'other places are known, but not shown');
 s.location='sol-belt';sameSet(N.markers(s,toMeridian),['meridian','earth'],'elsewhere: the route plus the way home');
 s.location='meridian';sameSet(N.markers(s,[{id:'h',destination:'earth'}]),['sol-belt'],'from Meridian, home is the warp marker to Tessaly');
 // the flight Map app lists the same set
 s.location='earth';sameSet(FN.entries(s,U,toMeridian).map(e=>e.id),['meridian']);
 assert.equal(FN.markerFor(s,'kepler',U,toMeridian),'meridian');assert.equal(FN.markerFor(s,'mars',U,toMeridian),null,'a hidden marker gets no square');
 // still route-only after a reload, and after flying to Meridian
 const r=reload(s);assert.equal(r.story.flags.navCoords,false);r.location='meridian';U.visit(r);assert.equal(reload(r).story.flags.navCoords,false,'the migration never upgrades a new pilot');
});

test('no mission and no coordinates: the places already discovered (never zero markers)',()=>{
 const s=newPilot();assert.equal(N.mode(s,[]),'known');sameSet(N.markers(s,[]),U.destinations(s));assert.ok(N.markers(s,[]).length>0);
 assert.equal(N.mode(s,[{id:'x',destination:'earth'}]),'known','a mission right here needs no route');
 assert.equal(N.mode(s,[{id:'x',destination:'meridian',completed:true}]),'known','a finished mission does not count');
});

test('full mode: every location in this system and the warp marker to every reachable system',()=>{
 const s=newPilot();assert.equal(N.grant(s,'test'),true);assert.equal(N.mode(s,toMeridian),'full');
 sameSet(N.markers(s,toMeridian),['sol-belt','mars','meridian']);
 s.location='meridian';sameSet(N.markers(s,[]),['vesper','kepler','rusthaven','foundry','sol-belt'],'every Erebus place plus the Tessaly warp marker');
 for(const id of Object.keys(U.locations).filter(id=>['erebus','sol'].includes(U.system(id))))assert.ok(s.universe.discoveredLocations.includes(id),id);
 assert.ok(!s.universe.discoveredLocations.includes('vigil')&&!s.universe.discoveredLocations.includes('nexus'),'faction systems stay closed until their own story opens them');
 s.universe.discoveredLocations.push('vigil');s.universe.discoveredSystems.push('communion');assert.ok(N.markers(s,[]).includes('vigil'),'an opened faction system gets its warp marker');
 s.location='earth';const kinds=Object.fromEntries(FN.entries(s,U,[]).map(e=>[e.id,e.kind]));assert.equal(kinds['sol-belt'],'station');assert.equal(kinds.mars,'planet');assert.equal(kinds.meridian,'warp');assert.equal(kinds.vigil,'warp');
 // flight can fly to every marker
 for(const id of N.markers(s,[]))assert.ok(C.chooseDestination({...s,universe:s.universe},id),id);
});

test('grantCoordinates is idempotent and survives a reload',()=>{
 const s=newPilot();assert.equal(N.grant(s,'rook'),true);const once=JSON.stringify(s);
 assert.equal(N.grant(s,'rook'),false,'a second grant changes nothing');assert.equal(JSON.stringify(s),once);
 const r=reload(s);assert.equal(r.story.flags.navCoords,true);assert.equal(N.grant(r,'rook'),false);
 assert.equal(N.grant(null),false);assert.equal(N.grant({}),false);
});

test('save migration: saves that already fly freely keep (and gain) all markers; others are untouched',()=>{
 // a District pilot from before this build: ship granted, has flown to Meridian, no navCoords flag
 const old=district();C.awardStarterShip(old);delete old.story.flags.navCoords;old.location='meridian';old.progression.checkpoint={location:'meridian'};U.visit(old);
 const r=reload(old);assert.equal(r.story.flags.navCoords,true);assert.equal(N.mode(r,toMeridian),'full');
 for(const id of U.destinations(old))assert.ok(N.markers(r,[]).includes(id),'kept '+id);
 // one who only discovered a place beyond Erebus and Tessaly (no flight yet; every ship owner knows those anyway)
 const d=district();C.awardStarterShip(d);delete d.story.flags.navCoords;U.discover(d,'vigil');assert.equal(reload(d).story.flags.navCoords,true);
 // an older (open mission pool) campaign flying freely
 const legacy=C.fresh();legacy.quest='open';legacy.location='meridian';legacy.progression.checkpoint={location:'meridian'};legacy.progression.completed=true;legacy.progression.flags.missileFired=true;legacy.universe=U.restore({...legacy.universe,freeTravel:true},legacy);
 const lr=reload(legacy);assert.equal(lr.story.flags.navCoords,true);sameSet(N.markers(lr,[]),U.destinations(legacy));
 // no ship, or a ship never flown beyond NeoChinatown: no change
 assert.equal(reload(district()).story.flags.navCoords,undefined);
 const parked=district();C.awardStarterShip(parked);delete parked.story.flags.navCoords;assert.equal(reload(parked).story.flags.navCoords,undefined);
 // an explicit false (a new pilot) is never upgraded
 const fresh=newPilot();fresh.location='meridian';U.visit(fresh);U.discover(fresh,'kepler');assert.equal(reload(fresh).story.flags.navCoords,false);
});

test('the Mission Editor unlock "nav-coords" grants the coordinates once, at a step or at the end',()=>{
 assert.ok(MC.UNLOCKS.includes('nav-coords'));const k=G.UNLOCK_KINDS.find(x=>x.id==='nav-coords');assert.ok(k&&k.supported&&/nav coordinates/i.test(k.name));
 const s=newPilot();assert.match(MC.unlockNow(s,{kind:'nav-coords'},{U},C),/NAV DATA RECEIVED/);assert.equal(s.story.flags.navCoords,true);
 assert.equal(MC.unlockNow(s,{kind:'nav-coords'},{U},C),null,'a second time says nothing');
 const inv=JSON.parse(fs.readFileSync('void_runner_admin_inventory.json','utf8'));assert.ok(inv.missionEditor.unlockKinds.includes('nav-coords'),'the server accepts it (node tools/admin-inventory.cjs)');
});

test('Rook’s side-mission board appears only after rook-first-delivery-done',()=>{
 const s=newPilot();s.location='meridian';U.visit(s);
 assert.deepEqual(C.rookBoard(s),[]);assert.equal(C.rookOpen(s),false);assert.equal(C.accept(s,'rook-job:routine'),false);
 s.story.flags['rook-first-delivery-done']=true;assert.equal(C.rookOpen(s),true);N.grant(s,'rook');
 const board=C.rookBoard(s);assert.deepEqual(board.map(j=>j.kind),RC.districtBoard.filter(k=>RC.jobs[k]));
 assert.equal(new Set(board.map(j=>j.destination)).size,board.length,'each job to a different place');
 assert.deepEqual(C.rookBoard(reload(s)),board,'a reload never rerolls the board');
 const flag=newPilot();flag.location='meridian';flag.story.flags['mf_rook-first-delivery-done']=true;assert.ok(C.rookBoard(flag).length,'a Mission Editor flag unlock (mf_) opens it too');
});

test('jobs only target reachable places, never Vesper, a homeworld or Meridian',()=>{
 const s=rookReady();N.grant(s,'rook');s.universe.discoveredLocations.push('nexus');
 for(let run=0;run<8;run++){for(const j of C.rookBoard(s)){
   assert.ok(!RC.never.includes(j.destination),j.destination);assert.ok(s.universe.discoveredLocations.includes(j.destination));assert.ok(s.universe.discoveredSystems.includes(U.system(j.destination)));
   assert.ok(N.markers({...s,location:'meridian'},[]).includes(U.nextHop('meridian',j.destination)),'its marker is on the flight Map');
   if(RC.jobs[j.kind].far)assert.notEqual(U.system(j.destination),'erebus');}
  assert.ok(C.accept(s,'rook-job:routine'));fly(s);s.location='meridian';}
 // before the coordinates only known places are used
 const k=rookReady();for(const j of C.rookBoard(k))assert.ok(k.universe.discoveredLocations.includes(j.destination));
});

test('a side mission: Mission Log entry, tracked, yellow route marker, paid exactly once',()=>{
 const s=rookReady();N.grant(s,'rook');const credits=s.credits;
 const job=C.rookBoard(s).find(j=>j.kind==='routine');assert.ok(C.accept(s,'rook-job:routine'));const run=C.rookRun(s);
 assert.ok(M.track(s,run.id,C),'trackable in a District campaign');const e=M.tracked(s,C);assert.equal(e.id,run.id);assert.equal(e.type,'side');assert.equal(e.destination,job.destination);
 assert.ok(N.markers(s,M.active(s,C)).includes(U.nextHop('meridian',job.destination)));
 const r=reload(s);assert.equal(r.universe.trackedMission,run.id,'stays tracked after a reload (retireMissions)');
 fly(r);assert.equal(r.location,job.destination);assert.equal(r.contract,null);assert.equal(r.credits,credits+run.payment-r.dockFees,'paid once on delivery');
 assert.equal(M.all(r,C).find(m=>m.id===run.id).completed,true);
 const again=reload(r),before=again.credits;assert.equal(C.complete(again),null,'nothing left to deliver');assert.equal(again.credits,before);again.location='meridian';assert.equal(C.collectRook(again),0);
 // the next board moves on
 again.location='meridian';assert.equal(C.rookBoard(again)[0].number,run.number+1);
});

test('a pay-at-Rook side mission is paid by Rook once',()=>{
 const s=rookReady();N.grant(s,'rook');assert.ok(C.accept(s,'rook-job:valuable'));const run=C.rookRun(s);assert.equal(run.payAt,'rook');
 fly(s);assert.deepEqual(C.rookOwed(s),{number:run.number,amount:run.payment});s.location='meridian';const before=s.credits;
 assert.equal(C.collectRook(s),run.payment);assert.equal(s.credits,before+run.payment);assert.equal(C.collectRook(s),0);const r=reload(s);r.location='meridian';assert.equal(C.collectRook(r),0);
});

test('pay is balanced with the older board and the data file drives it',()=>{
 for(const j of C.rookBoard(rookReady())){assert.ok(j.payment>=RC.pay.base&&j.payment<=RC.pay.cap+Math.max(...Object.values(RC.jobs).map(x=>x.bonus)));assert.equal(j.units,RC.jobs[j.kind].units);}
 assert.equal(C.rookJobs,RC.jobs);assert.ok(RC.lines.coordinates&&RC.lines.board);assert.match(RC.status.lines,/PROPOSED/);
});

test('wiring: scripts load before campaign.js, flight and Rook use them, the server keeps a tracked side mission',()=>{
 const html=fs.readFileSync('void-runner.html','utf8'),at=f=>html.indexOf('src="void-runner/'+f+'"');
 assert.ok(at('nav-coords.js')>at('universe.js')&&at('nav-coords.js')<at('campaign.js')&&at('rook-cargo-jobs.js')<at('campaign.js'));
 const wi=fs.readFileSync('void-runner/world-integration.js','utf8');assert.match(wi,/VoidNav\.shown\(\)/);assert.match(wi,/grantCoordinates\('rook'\)/);assert.match(wi,/rookNavSent/);
 const api=fs.readFileSync('void_runner_api.py','utf8');assert.match(api,/rook-first-delivery-done/);
});
