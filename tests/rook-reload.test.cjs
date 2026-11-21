/* Rook's cargo side jobs and the Sleeping Pod (21 Nov 2026): every login wakes the player in NeoChinatown (socialEntry). A job to NeoChinatown taken before the
   reload must not be completed and paid by the next flight (which leaves NeoChinatown): a delivery completes only on a real arrival at its destination. */
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../void-runner/campaign.js'),U=require('../void-runner/universe.js'),M=require('../void-runner/mission-log.js'),N=require('../void-runner/nav-coords.js');
// Seed 13: the routine job goes to NeoChinatown (paid on delivery); seed 8: the high-value job goes there (paid by Rook).
function rookReady(seed){const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;C.awardStarterShip(s);s.location='meridian';U.visit(s);s.story.flags['rook-first-delivery-done']=true;s.story.flags.rookSeed=seed;N.grant(s,'rook');return s;}
// A reload: the save is restored and the login puts the player in their pod in NeoChinatown.
const relog=s=>{const r=C.socialEntry(C.restore(JSON.stringify(s)));r.story.flags.podWakePending=false;return r;};
const entry=(s,id)=>M.all(s,C).find(m=>m.id===id);

for(const [seed,kind] of [[13,'routine'],[8,'valuable']])test('a '+kind+' job to NeoChinatown is not delivered by waking there and flying away (seed '+seed+')',()=>{
 const s=rookReady(seed),job=C.rookBoard(s).find(j=>j.kind===kind);assert.equal(job.destination,'earth','the seed puts this job in NeoChinatown');
 assert.ok(C.accept(s,'rook-job:'+kind));const run=C.rookRun(s);
 const r=relog(s);assert.equal(r.location,'earth');assert.equal(r.contract,'rook-run');const credits=r.credits;
 // the HUD still shows the cargo aboard
 assert.equal(C.missionFlight(r).id,run.id);
 // the next flight leaves NeoChinatown with the cargo still aboard: no delivery, no pay
 const f=C.flight(r);assert.equal(f.kind,'transit');assert.equal(f.reward,0);assert.notEqual(f.destination,'earth');
 const out=C.complete(r);assert.ok(out,'the flight arrives');assert.notEqual(r.location,'earth');
 assert.equal(r.contract,'rook-run','the cargo is still aboard');assert.equal(r.story.flags.rookRunTo,'earth');assert.equal(C.rookOwed(r),null);
 assert.equal(r.credits,credits-out.repairCharged,'nothing paid');assert.notEqual(entry(r,run.id).completed,true);
 // flying back to NeoChinatown delivers it, once
 let fees=out.repairCharged;for(let i=0;i<4&&r.contract==='rook-run';i++)fees+=C.complete(r).repairCharged;
 assert.equal(r.location,'earth');assert.equal(r.contract,null);
 if(run.payAt==='delivery')assert.equal(r.credits,credits+run.payment-fees,'paid once on delivery');
 else{assert.deepEqual(C.rookOwed(r),{number:run.number,amount:run.payment});r.location='meridian';const before=r.credits;assert.equal(C.collectRook(r),run.payment);assert.equal(r.credits,before+run.payment);assert.equal(C.collectRook(r),0);}
 assert.equal(C.complete(relog(r)),null,'nothing left to deliver after another reload');
});

test('woken at the destination, the job can still be handed back at Meridian',()=>{
 const s=rookReady(13);assert.ok(C.accept(s,'rook-job:routine'));const r=relog(s),credits=r.credits;
 let fees=0;for(let i=0;i<4&&r.location!=='meridian';i++)fees+=C.complete(r).repairCharged;
 assert.equal(r.location,'meridian');assert.equal(r.contract,'rook-run');assert.ok(C.cancelRook(r));assert.equal(r.contract,null);assert.equal(r.credits,credits-fees);
 assert.ok(C.rookBoard(r).length,'the board is open again');
});

test('a job elsewhere is unchanged by a reload: the next flight from NeoChinatown delivers it',()=>{
 const s=rookReady(13),job=C.rookBoard(s).find(j=>j.kind==='long-haul');assert.notEqual(job.destination,'earth');
 assert.ok(C.accept(s,'rook-job:long-haul'));const run=C.rookRun(s),r=relog(s),credits=r.credits;
 let fees=0;for(let i=0;i<4&&r.contract==='rook-run';i++)fees+=C.complete(r).repairCharged;
 assert.equal(r.location,job.destination);assert.equal(r.credits,credits+run.payment-fees);
});
