// Rook's cargo network (editor brief stage 3, part 2): the board, hold space, payment rules and saves.
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../void-runner/campaign.js'),M=require('../void-runner/mission-log.js'),U=require('../void-runner/universe.js');
function open(){const s=C.fresh();s.quest='open';s.location='meridian';s.progression.completed=true;s.progression.flags.missileFired=true;s.universe=U.restore({...s.universe,freeTravel:true},s);s.universe.freeTravel=true;return s;}
const reload=s=>C.restore(JSON.stringify(s));
// Flies until the cargo is unloaded (an interstellar job stops at the hub first).
function fly(s){s.dockFees=0;for(let i=0;i<4&&s.contract==='rook-run';i++)s.dockFees+=C.complete(s).repairCharged;return s;}
// active() refreshes the log first, as the game does every frame.
const entry=(s,id)=>{M.sync(s,C);return M.all(s,C).find(m=>m.id===id);};
// Plays runs until the board shows a job of this kind, then returns the save at Meridian.
function boardWith(kind){const s=open();for(let i=0;i<12;i++){if(C.rookBoard(s).some(j=>j.kind===kind))return s;C.accept(s,'rook-run');fly(s);s.location='meridian';}throw Error('no '+kind);}

test('the board starts with one routine job and grows as runs are finished',()=>{
  const s=open();assert.deepEqual(C.rookBoard(s).map(j=>j.kind),['routine']);
  C.accept(s,'rook-run');fly(s);s.location='meridian';assert.equal(C.rookBoard(s).length,2);
  for(let i=0;i<2;i++){C.accept(s,'rook-run');fly(s);s.location='meridian';}
  const board=C.rookBoard(s);assert.equal(board.length,3);
  for(const j of board){assert.ok(j.payment>0&&j.units>=1&&C.stations[j.destination]);assert.ok(['delivery','rook'].includes(j.payAt));assert.notEqual(j.destination,'meridian');}
  // The board is the same after a reload: no rerolling for better jobs.
  assert.deepEqual(C.rookBoard(reload(s)),board);
});

test('only restricted jobs are not legal, and legal jobs stay legal',()=>{
  for(const [kind,job] of Object.entries(C.rookJobs))assert.equal(job.legal,kind!=='restricted',kind);
});

test('a pay-on-delivery job pays once when the cargo is unloaded, and survives saves at each stage',()=>{
  const s=open(),credits=s.credits;assert.ok(C.accept(s,'rook-job:routine'));
  const run=C.rookRun(s);assert.equal(run.payAt,'delivery');
  // Accepted: cargo aboard, pickup done, destination known and trackable.
  let r=reload(s);assert.equal(r.contract,'rook-run');assert.equal(C.rookRun(r).destination,run.destination);
  assert.equal(entry(r,run.id).objective,'Deliver '+run.cargo+' to '+C.stations[run.destination].name);
  assert.ok(M.track(r,run.id,C));assert.equal(M.tracked(r,C).destination,run.destination);
  fly(r);assert.equal(r.location,run.destination);assert.equal(r.contract,null);
  assert.equal(r.credits,credits+run.payment-r.dockFees,'paid once, less the usual dock servicing');
  assert.equal(entry(r,run.id).completed,true);assert.equal(C.rookOwed(r),null);
  // Reloading after delivery pays nothing more, and Rook owes nothing.
  r=reload(r);r.location='meridian';const before=r.credits;assert.equal(C.collectRook(r),0);assert.equal(r.credits,before);
  assert.equal(C.rookLog(r)[0].status,'paid');
});

test('a pay-at-Rook job is confirmed on delivery and paid by Rook in person, exactly once',()=>{
  const s=boardWith('valuable');assert.ok(C.accept(s,'rook-job:valuable'));const run=C.rookRun(s);
  assert.equal(run.payAt,'rook');assert.equal(C.flight(s).reward,0,'the dock pays nothing');
  const before=s.credits;fly(s);assert.equal(s.location,run.destination);
  assert.equal(s.credits,before-s.dockFees,'no pay at the destination');assert.deepEqual(C.rookOwed(s),{number:run.number,amount:run.payment});
  const e=entry(s,run.id);assert.equal(e.completed,false);assert.ok(M.track(s,run.id,C),'still trackable until paid');assert.equal(M.tracked(s,C).id,run.id);assert.equal(M.tracked(s,C).destination,'meridian');assert.equal(e.destination,'meridian');assert.equal(e.interaction,'rook');assert.match(e.objective,/from Rook at Meridian/);
  // Rook is at Meridian only.
  assert.equal(C.collectRook(s),0);
  // Saved while owed: still owed after a reload.
  const r=reload(s);r.location='meridian';const credits=r.credits;
  assert.equal(C.collectRook(r),run.payment);assert.equal(r.credits,credits+run.payment);assert.equal(entry(r,run.id).completed,true);
  // A second collection, or the paid save reloaded, pays nothing.
  assert.equal(C.collectRook(r),0);const again=reload(r);again.location='meridian';assert.equal(C.collectRook(again),0);
  assert.equal(C.rookLog(again)[0].status,'paid');
});

test('hold space limits which jobs can be taken',()=>{
  const s=boardWith('valuable'),cap=C.holdFree(s);
  s.progression.cargo=[{id:'salvage',units:cap-1}];assert.equal(C.holdFree(s),1);
  assert.equal(C.accept(s,'rook-job:valuable'),false,'two-space job needs two free spaces');
  assert.equal(s.contract,null);
  s.progression.cargo=[{id:'salvage',units:cap}];assert.equal(C.accept(s,'rook-job:routine'),false,'a full hold takes nothing');
  s.progression.cargo=[];assert.ok(C.accept(s,'rook-job:valuable'));
});

test('one job at a time, no new job while Rook owes pay, and only jobs on the board',()=>{
  const s=boardWith('valuable'),missing=Object.keys(C.rookJobs).find(k=>!C.rookBoard(s).some(j=>j.kind===k));assert.equal(C.accept(s,'rook-job:'+missing),false);assert.equal(C.accept(s,'rook-job:nonsense'),false);
  assert.ok(C.accept(s,'rook-job:valuable'));assert.equal(C.accept(s,'rook-job:routine'),false);
  fly(s);s.location='meridian';assert.equal(C.accept(s,'rook-job:routine'),false,'collect first');
  C.collectRook(s);assert.ok(C.accept(s,'rook-job:routine'));
});

test('handing the cargo back ends the job without pay, and the run can be taken again',()=>{
  const s=open();C.accept(s,'rook-job:routine');const run=C.rookRun(s),credits=s.credits;
  assert.ok(C.cancelRook(s));assert.equal(s.contract,null);assert.equal(s.credits,credits);assert.equal(entry(s,run.id),undefined);
  assert.equal(C.rookOwed(s),null);assert.equal(C.collectRook(s),0);
  assert.ok(C.accept(s,'rook-job:routine'));assert.equal(C.rookRun(s).id,run.id);
});

test('a run accepted before the board keeps its original terms after the update',()=>{
  const s=open();s.contract='rook-run';s.story.flags.rookRunTo='kepler';s.story.flags.rookRuns=1;
  const r=reload(s),run=C.rookRun(r);assert.equal(run.kind,'legacy');assert.equal(run.legal,false);assert.equal(run.reward,650);
  const credits=r.credits;fly(r);assert.equal(r.location,'kepler');assert.ok(r.credits>credits);assert.equal(C.rookOwed(r),null);
});

test('many runs keep the Mission Log within the cloud save limit',()=>{
  const s=open();for(let i=0;i<30;i++){const b=C.rookBoard(s);C.accept(s,'rook-job:'+b[b.length-1].kind);fly(s);s.location='meridian';C.collectRook(s);}
  assert.equal(s.story.flags.rookRuns,30);assert.ok(Object.keys(s.universe.missions).filter(id=>id.startsWith('rook-run-')).length<=6);
  assert.ok(String(s.story.flags.rookLog).length<=200);assert.equal(C.rookLog(s).length,5);
  assert.ok(!s.universe.completedObjectives.some(id=>id.startsWith('rook-run-')));const r=reload(s);M.sync(r,C);
  assert.equal(r.story.flags.rookRuns,30);assert.ok(Object.keys(r.universe.missions).length<=100);
});

test("Admin's sealed cargo is untouched by the board",()=>{
  assert.equal(C.sealedCargo.payment,1800);assert.equal(C.sealedCargo.enemies,0);assert.match(C.sealedCargo.cargo,/contents undisclosed/);
  assert.ok(!Object.values(C.rookJobs).some(j=>j.cargo.some(c=>/sealed container/i.test(c))));
});
