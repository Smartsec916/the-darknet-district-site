// Rook's procedural cargo jobs (rook-cargo-gen.js, 21 Nov 2026): the District board after Mission 012 is generated per player and per run.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const C=require('../void-runner/campaign.js'),U=require('../void-runner/universe.js'),M=require('../void-runner/mission-log.js'),N=require('../void-runner/nav-coords.js');
const RC=require('../void-runner/rook-cargo-jobs.js'),RG=require('../void-runner/rook-cargo-gen.js'),P=require('../void-runner/progression.js');
const reload=s=>C.restore(JSON.stringify(s));
const rookReady=(seed)=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;C.awardStarterShip(s);s.location='meridian';U.visit(s);s.story.flags['rook-first-delivery-done']=true;if(seed)s.story.flags.rookSeed=seed;N.grant(s,'rook');return s;};
function fly(s){for(let i=0;i<4&&s.contract==='rook-run';i++)C.complete(s);return s;}
const view=b=>b.map(j=>[j.kind,j.destination,j.cargo,j.units,j.payment,j.title].join('/'));

test('the generator is deterministic for a seed and run, and differs between players and runs',()=>{
 const pool=['kepler','rusthaven','foundry','sol-belt','earth','mars'],args={seed:12345,number:3,kinds:RC.districtBoard,pool,capacity:2};
 assert.deepEqual(RG.board(args),RG.board({...args}));
 assert.notDeepEqual(view(RG.board(args)),view(RG.board({...args,seed:999})),'another player sees another board');
 assert.notDeepEqual(view(RG.board(args)),view(RG.board({...args,number:4})),'the next run brings a new board');
 assert.deepEqual(RG.board(args).map(j=>j.kind),RC.districtBoard,'one job per kind, in the owner\'s order');
 const a=RG.rng(7),b=RG.rng(7);for(let i=0;i<20;i++){const x=a();assert.equal(x,b());assert.ok(x>=0&&x<1);}
 assert.equal(RG.hash('abc'),RG.hash('abc'));assert.ok(RG.validSeed(RG.freshSeed()));assert.ok(RG.validSeed(RG.seedOf({})));
});

test('a campaign board: same after a reload, new after each finished run, seeded per player',()=>{
 const s=rookReady();assert.ok(RG.validSeed(s.story.flags.rookSeed),'a new District campaign gets a seed');
 const board=C.rookBoard(s);assert.equal(board.length,RC.districtBoard.length);
 assert.deepEqual(C.rookBoard(reload(s)),board,'a reload never rerolls');
 assert.notDeepEqual(view(C.rookBoard(rookReady(4242))),view(C.rookBoard(rookReady(777))),'two players, two boards');
 assert.ok(C.accept(s,'rook-job:routine'));fly(s);s.location='meridian';
 const next=C.rookBoard(s);assert.equal(next[0].number,board[0].number+1);assert.notDeepEqual(view(next),view(board));
});

test('only reachable places: never the never list, known places in known systems, flight Map markers, far kinds leave Erebus',()=>{
 for(const seed of [1,2,3,99,5000,123456,77777,31337]){const s=rookReady(seed);s.universe.discoveredLocations.push('nexus');
  for(let run=0;run<6;run++){const b=C.rookBoard(s);assert.equal(new Set(b.map(j=>j.destination)).size,b.length,'each job to a different place');
   for(const j of b){assert.ok(!RC.never.includes(j.destination),j.destination);assert.ok(s.universe.discoveredLocations.includes(j.destination));
    assert.ok(s.universe.discoveredSystems.includes(U.system(j.destination)));assert.ok(N.markers({...s,location:'meridian'},[]).includes(U.nextHop('meridian',j.destination)));
    if(RC.jobs[j.kind].far)assert.notEqual(U.system(j.destination),'erebus');}
   assert.ok(C.accept(s,'rook-job:'+b[run%b.length].kind));fly(s);s.location='meridian';C.collectRook(s);}}
 // a faction system Admin's delivery still holds is never offered
 const h=rookReady(5);U.discover(h,'vigil');for(const j of C.rookBoard(h))assert.notEqual(U.system(j.destination),'communion');
});

test('pay stays in bounds, scales with distance, and the hold is never overfilled',()=>{
 let local=[],far=[];
 for(let seed=1;seed<=60;seed++){const s=rookReady(seed*7919),cap=P.systems(s).cargo;for(const j of C.rookBoard(s)){
  const b=RG.payBounds(j.number,j.kind,cap);assert.ok(j.payment>=b.min&&j.payment<=b.max,j.kind+' '+j.payment+' '+JSON.stringify(b));assert.equal(j.payment%10,0);
  assert.ok(j.units>=RC.jobs[j.kind].units&&j.units<=Math.max(cap,RC.jobs[j.kind].units));assert.ok(j.weightKg<=j.units*RC.procedural.holdKg,'the weight fits the spaces');
  assert.match(j.cargo,/^\d+ .+ of .+$/);assert.ok(j.title&&j.title.length<=80);
  if(j.kind==='routine')(U.system(j.destination)==='erebus'?local:far).push(j.payment/RG.basePay(j.number,j.kind));}}
 const avg=a=>a.reduce((x,y)=>x+y,0)/a.length;assert.ok(local.length&&far.length);assert.ok(avg(far)>avg(local),'farther pays more');
 assert.ok(RG.distance('sol-belt').factor>RG.distance('kepler').factor);assert.ok(RG.distance('earth').factor>RG.distance('sol-belt').factor,'a landing adds a little');
});

test('an accepted job keeps its generated terms: Mission Log, tracking, payment on delivery',()=>{
 const s=rookReady(2024),job=C.rookBoard(s).find(j=>j.kind==='routine'),credits=s.credits;
 assert.ok(C.accept(s,'rook-job:routine'));const run=C.rookRun(s);
 for(const k of ['cargo','units','payment','title','destination'])assert.equal(run[k],job[k],k);
 assert.ok(String(s.story.flags.rookTerms).length<=200);assert.deepEqual(RG.decode(s.story.flags.rookTerms),{units:job.units,payment:job.payment,weightKg:job.weightKg,cargo:job.cargo,title:job.title});
 assert.ok(M.track(s,run.id,C));const e=M.tracked(s,C);assert.equal(e.type,'side');assert.equal(e.destination,job.destination);assert.match(e.description,new RegExp(job.cargo));
 assert.ok(N.markers(s,M.active(s,C)).includes(U.nextHop('meridian',job.destination)),'the yellow route marker');
 const r=reload(s);assert.equal(C.rookRun(r).payment,job.payment,'a reload keeps the terms');assert.equal(r.universe.trackedMission,run.id);
 // (a reload wakes the player in NeoChinatown, so the flight is flown from the save before the reload)
 let fees=0;for(let i=0;i<4&&s.contract==='rook-run';i++)fees+=C.complete(s).repairCharged;
 assert.equal(s.location,job.destination);assert.equal(s.credits,credits+job.payment-fees,'paid once on delivery');assert.equal(s.story.flags.rookTerms,undefined,'the terms are cleared');
 // handing the cargo back clears them too
 const c=rookReady(9);C.accept(c,'rook-job:routine');assert.ok(c.story.flags.rookTerms);assert.ok(C.cancelRook(c));assert.equal(c.story.flags.rookTerms,undefined);
 // a pay-at-Rook job: Rook owes exactly the generated payment
 const v=rookReady(31);const vj=C.rookBoard(v).find(j=>j.kind==='valuable');assert.ok(C.accept(v,'rook-job:valuable'));fly(v);assert.deepEqual(C.rookOwed(v),{number:vj.number,amount:vj.payment});
 v.location='meridian';assert.equal(C.collectRook(v),vj.payment);assert.equal(C.collectRook(v),0);
});

test('migration: an old save without a seed or terms loads cleanly and keeps its job',()=>{
 const s=rookReady(55);delete s.story.flags.rookSeed;
 // a job accepted on the older fixed board: rookJob + rookRunTo, no rookTerms
 s.contract='rook-run';s.story.flags.rookJob='routine';s.story.flags.rookRunTo='kepler';
 const r=reload(s);assert.ok(r,'restores');assert.ok(RG.validSeed(r.story.flags.rookSeed),'a seed is written once');assert.equal(reload(r).story.flags.rookSeed,r.story.flags.rookSeed);
 const run=C.rookRun(r);assert.equal(run.destination,'kepler');assert.equal(run.payment,RG.basePay(run.number,'routine'),'the older terms, unchanged');assert.equal(run.title,undefined);
 assert.equal(run.cargo,RC.jobs.routine.cargo[(run.number-1)%RC.jobs.routine.cargo.length]);
 // same seed derived for the same save, so the board is the same on every load before it is saved
 const t=rookReady();delete t.story.flags.rookSeed;assert.equal(reload(t).story.flags.rookSeed,reload(t).story.flags.rookSeed);
 // a damaged terms flag falls back to the older terms instead of failing
 const d=rookReady(8);C.accept(d,'rook-job:routine');d.story.flags.rookTerms='junk';assert.equal(C.rookRun(reload(d)).payment,RG.basePay(1,'routine'));
 assert.equal(RG.decode('3|abc|0|x|y'),null);assert.equal(RG.decode('1|0|0|x|y'),null);
});

test('wiring: loaded after the data and before campaign.js; build bumped',()=>{
 const html=fs.readFileSync('void-runner.html','utf8'),at=n=>html.indexOf('void-runner/'+n);
 assert.ok(at('rook-cargo-jobs.js')<at('rook-cargo-gen.js')&&at('rook-cargo-gen.js')<at('campaign.js')&&at('universe.js')<at('rook-cargo-gen.js'));
 assert.equal(fs.readFileSync('static/void-runner.html','utf8'),html);
 assert.match(fs.readFileSync('void-runner-sw.js','utf8').split(/\r?\n/)[3],/^const BUILD='\d{4}-\d{2}-\d{2}-[a-z0-9-]+';$/);
 assert.ok(RC.lines.coordinates&&RC.lines.board,'Rook\'s two lines are unchanged data');
});
