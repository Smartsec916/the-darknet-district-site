const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../void-runner/campaign.js'),M=require('../void-runner/mission-log.js'),U=require('../void-runner/universe.js'),PP=require('../void-runner/police-patrol.js');
const ID='admin-sealed-cargo-01';
function district(){const s=C.fresh();s.quest='open';s.location='earth';s.progression.completed=true;s.progression.flags.missileFired=true;s.universe=U.restore({...s.universe,freeTravel:true},s);s.universe.freeTravel=true;s.story.flags.metAdmin=true;return s;}
// The first District delivery delivered and paid, so Admin is free again.
function afterFirstPayment(){const s=district();assert(C.acceptFaction(s,'communion'));C.complete(s);assert(C.deliverFaction(s,'communion'));s.location='earth';C.collectFactionPayment(s);return s;}
const rng=seq=>{let i=0;return ()=>seq[i++%seq.length];};

test('Admin offers the sealed crate only after the first District delivery is paid',()=>{
  const s=district();assert(!C.sealedOffered(s));
  assert(C.acceptFaction(s,'communion'));C.complete(s);C.deliverFaction(s,'communion');
  // Delivered but unpaid: Admin is "occupied" and offers nothing.
  assert(!C.sealedOffered(s));
  s.location='earth';C.collectFactionPayment(s);assert(C.sealedOffered(s));
});
test('accepting loads the crate for Rook at Meridian with pay held until the handover',()=>{
  const s=afterFirstPayment(),credits=s.credits;assert(C.accept(s,ID));
  assert.equal(s.contract,ID);assert.equal(s.story.flags.sealedCargo,'accepted');assert(!C.sealedOffered(s));
  const f=C.flight(s);assert.equal(f.destination,'meridian');assert.equal(f.reward,0);assert.equal(f.enemies,0);assert.equal(f.legal,false);
  assert(M.track(s,ID,C));
  C.complete(s);assert.equal(s.location,'meridian');
  assert.equal(s.contract,null);assert(C.sealedDeliverable(s));assert.equal(s.universe.missions[ID].objectives.arrive,true);assert(!s.universe.missions[ID].completed);
  const before=s.credits;assert(C.deliverSealed(s));assert.equal(s.credits,before+1800);assert.equal(s.story.flags.sealedCargo,'delivered');
  assert(s.universe.missions[ID].completed);assert(!C.deliverSealed(s),'paid once');assert(!C.sealedOffered(s));
});
test('"Don’t Ask Questions" is trouble-free: no patrol line, inspection or seizure (doc 11 §23)',()=>{
  const s=afterFirstPayment();assert(C.accept(s,ID));assert.equal(C.sealedCargo.name,'Don’t Ask Questions');
  assert.equal(C.seizeSealed,undefined,'nothing can confiscate the crate');
  const f=C.flight(s);assert.equal(f.enemies,0);assert.equal(U.route('earth','meridian').interdiction,false);
  for(const progress of [.1,.3,.5,.9])assert.equal(PP.due(s,{...f,id:ID},{phase:'warp',progress}),false);
  const entry=M.all(s,C).find(m=>m.id===ID);assert.equal(entry.title,'DON’T ASK QUESTIONS');assert.doesNotMatch(entry.description+f.briefing,/patrol|scan/i);
  // Saves from PR #59 where a patrol took the crate: Admin simply offers it again.
  const old=afterFirstPayment();old.story.flags.sealedCargo='seized';assert(C.sealedOffered(old));assert(C.acceptSealed(old));
});
test('the crate keeps the hold busy and survives a save round trip',()=>{
  const s=afterFirstPayment();assert(C.accept(s,ID));assert(!C.accept(s,'rook-run'));
  const r=C.restore(JSON.stringify(s));assert.equal(r.contract,ID);assert.equal(r.story.flags.sealedCargo,'accepted');
  assert(require('../void-runner/save-manifest.json').missions.includes(ID));
});

test('the patrol rules stay available for future police work but no run triggers them',()=>{
  assert.equal(PP.mission,null);const route={phase:'warp',progress:.5};assert.equal(PP.due({contract:null,story:{flags:{}}},{id:'anything'},route),false);
});
test('going dark and easing off the throttle shrinks the patrol scan range',()=>{
  assert(Math.abs(PP.scanRange(1.5)-PP.config.scanRange)<1e-9);assert(PP.scanRange(.08)<PP.config.scanRange*.25);assert(PP.scanRange(.9)<PP.scanRange(2));
});
test('the scan meter fills only inside scan range, faster up close, and decays outside',()=>{
  const z=PP.create();z.ships.forEach(s=>s.loop.speed=0);
  // Park the player far from every loop: nothing fills.
  z.player={x:0,y:900,z:0};for(let i=0;i<50;i++)PP.step(z,.1,undefined,1.5);assert.equal(z.meter,0);
  // Sit on a cutter: the meter fills and the hail comes, never an automatic inspection.
  const c=z.ships[0];z.player={...c.world};let events=[];for(let i=0;i<40&&z.state==='patrol';i++)events=events.concat(PP.step(z,.1,undefined,1.5));
  assert.equal(z.state,'hail');assert(events.some(e=>e.type==='hail'));
  const far=PP.create();far.ships.forEach(s=>s.loop.speed=0);far.meter=.5;far.player={x:0,y:900,z:0};PP.step(far,1);assert(far.meter<.5);
});
test('every hail answer is the player’s choice and talking only works once',()=>{
  const hailed=()=>{const z=PP.create();z.state='hail';return z;};
  assert.deepEqual(PP.resolve(hailed(),'comply'),{outcome:'seized',fine:PP.config.fine});
  const run=hailed();assert.equal(PP.resolve(run,'run').outcome,'pursuit');assert.equal(run.state,'pursuit');
  const lucky=hailed();assert.equal(PP.resolve(lucky,'talk',rng([.1])).outcome,'released');assert.equal(lucky.state,'clear');
  const unlucky=hailed();assert.equal(PP.resolve(unlucky,'talk',rng([.9])).outcome,'refused');assert.equal(unlucky.state,'hail');
  assert.equal(PP.resolve(unlucky,'talk',rng([.1])),null,'no second try');assert.equal(PP.resolve(unlucky,'comply').outcome,'seized');
});
test('once released or after complying the patrols stop scanning',()=>{
  const z=PP.create();z.state='hail';PP.resolve(z,'comply');const c=z.ships[0];c.loop.speed=0;z.player={...c.world};
  for(let i=0;i<30;i++)PP.step(z,.1);assert.equal(z.meter,0);assert.equal(z.state,'clear');assert(!z.ships.some(s=>s.scanning));
});
test('in a pursuit the cutters close in and their fire can hit the pilot',()=>{
  const z=PP.create();z.state='hail';PP.resolve(z,'run');const start=Math.min(...PP.visible(z).map(s=>Math.hypot(s.x,s.y,s.z)));
  let hits=0;for(let i=0;i<120;i++)hits+=PP.step(z,.1,undefined,1.5,rng([.5])).filter(e=>e.type==='hit').length;
  const end=Math.min(...PP.visible(z).map(s=>Math.hypot(s.x,s.y,s.z)));assert(end<start);assert(hits>0);
  assert(end>PP.config.standoff-8,'they hold off rather than ram');
  assert(PP.visible(z).every(s=>s.relationship==='neutral'&&s.className==='police-cutter'));
});
