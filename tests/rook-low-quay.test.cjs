// Low Quay (Stale System) as a Rook freight destination (owner, 27 Nov 2026): both of Rook's boards, the older routine board and the District board,
// use one reachability rule (campaign.js rookReachable). A discovered Low Quay can be offered; an undiscovered one is skipped; an accepted job survives a reload.
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../void-runner/campaign.js'),U=require('../void-runner/universe.js'),N=require('../void-runner/nav-coords.js');
const RC=require('../void-runner/rook-cargo-jobs.js'),registry=require('../void-runner/rook-freight-registry.json');
const reload=s=>C.restore(JSON.stringify(s));
function fly(s){for(let i=0;i<4&&s.contract==='rook-run';i++)C.complete(s);return s;}
// The older campaign (open mission pool): the legacy routine board.
function legacy(){const s=C.fresh();s.quest='open';s.location='meridian';s.progression.completed=true;s.progression.flags.missileFired=true;s.universe=U.restore({...s.universe,freeTravel:true},s);s.universe.freeTravel=true;s.story.flags.rookSystems='erebus,sol';return s;}
// A District campaign after the first delivery to Rook (his coordinates granted): the procedural board.
function district(seed){const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;C.awardStarterShip(s);s.location='meridian';U.visit(s);s.story.flags['rook-first-delivery-done']=true;s.story.flags.rookSeed=seed;N.grant(s,'rook');return s;}

test('Low Quay is not on the never list and is in the freight registry like any other place',()=>{
 assert.ok(!RC.never.includes('low-quay'));
 assert.deepEqual(registry.stations['low-quay'],{system:'stale',hub:'low-quay',surface:true,gate:null});
 assert.ok(registry.config.destinations.includes('low-quay'));
});

test('one reachability rule: undiscovered Low Quay is skipped by both boards, discovered Low Quay is offerable by both',()=>{
 const a=legacy(),b=district(4242);
 for(const s of [a,b]){assert.equal(C.rookReachable(s,'low-quay'),false);assert.ok(!C.districtPool(s).includes('low-quay'));
  assert.ok(!C.rookBoard(s).some(j=>j.destination==='low-quay'),'unreachable Low Quay never offered');}
 assert.notEqual(C.rookRunTarget(a),'low-quay');
 // Rook's coordinates cover only the open systems (Erebus, Tessaly): they do not expose the Stale System.
 assert.ok(!b.universe.discoveredSystems.includes('stale'));
 for(const s of [a,b]){U.discover(s,'low-quay');assert.equal(C.rookReachable(s,'low-quay'),true);assert.ok(C.districtPool(s).includes('low-quay'));}
 // the older board sends its routine run into the newly known system first, as it does for every system
 assert.equal(C.rookRunTarget(a),'low-quay');assert.equal(C.rookBoard(a)[0].destination,'low-quay');
});

test('an unreachable Low Quay is skipped on the District board for many seeds and runs',()=>{
 for(const seed of [1,2,3,99,5000,123456]){const s=district(seed);
  for(let run=0;run<5;run++){const b=C.rookBoard(s);assert.ok(b.length);assert.ok(!b.some(j=>j.destination==='low-quay'));
   assert.ok(C.accept(s,'rook-job:'+b[0].kind));fly(s);s.location='meridian';C.collectRook(s);}}
});

test('a District board can offer a discovered Low Quay; the accepted job survives a reload and still completes',()=>{
 let s=null,job=null;
 for(let seed=1;seed<400&&!job;seed++){const t=district(seed);U.discover(t,'low-quay');const j=C.rookBoard(t).find(x=>x.destination==='low-quay');if(j){s=t;job=j;}}
 assert.ok(job,'some player is offered Low Quay');
 assert.ok(C.accept(s,'rook-job:'+job.kind));assert.equal(s.story.flags.rookRunTo,'low-quay');
 const r=reload(s);assert.equal(r.contract,'rook-run');assert.equal(C.rookRun(r).destination,'low-quay');assert.equal(C.rookRun(r).payment,C.rookRun(s).payment);
 fly(r);assert.equal(r.location,'low-quay');assert.equal(r.contract,null);assert.equal(r.story.flags.rookRuns,1);
});

test('the older routine board: an accepted Low Quay run survives a reload and still completes',()=>{
 const s=legacy();U.discover(s,'low-quay');
 assert.ok(C.accept(s,'rook-run'));assert.equal(C.rookRun(s).destination,'low-quay');
 const r=reload(s);assert.equal(r.contract,'rook-run');assert.equal(C.rookRun(r).destination,'low-quay');
 const first=C.complete(r);assert.equal(first.destination,'stale-arrival');
 fly(r);assert.equal(r.location,'low-quay');assert.equal(r.contract,null);assert.equal(r.story.flags.rookRuns,1);assert.match(r.story.flags.rookSystems,/stale/);
});
