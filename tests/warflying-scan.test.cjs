const test=require('node:test'),assert=require('node:assert/strict');
const X=require('../void-runner/warflying-scan.js'),W=require('../void-runner/warflying.js'),S=require('../void-runner/signals.js'),C=require('../void-runner/campaign.js');

test('the scanner hears ships by their own emissions: quiet ships only up close, never from anywhere',()=>{
  const loud=X.hearingRange(2),normal=X.hearingRange(1.5),dark=X.hearingRange(.08);
  assert.equal(normal,X.config.range);assert(loud>normal&&dark<normal*.25);
  assert.equal(X.classify(normal*.5,1.5),'confirmed');assert.equal(X.classify(normal*.9,1.5),'partial');assert.equal(X.classify(normal*1.1,1.5),null);
  // A ship running dark at 100 units is not heard, though one transmitting normally would be identified.
  assert.equal(X.classify(100,.08),null);assert.equal(X.classify(100,1.5),'confirmed');
});
test('each route passes its own fixed emitters: both stations, and a share of each system’s beacons and satellites',()=>{
  const local=X.routeSources('meridian','kepler');
  assert.equal(local[0].source.id,'station:meridian');assert.equal(local[local.length-1].source.id,'station:kepler');
  assert(local.every(p=>p.at>0&&p.at<1));
  const far=X.routeSources('earth','meridian'),mid=far.filter(p=>!p.source.id.startsWith('station:'));
  assert(mid.filter(p=>p.source.system==='sol').every(p=>p.at<.5));assert(mid.filter(p=>p.source.system==='erebus').every(p=>p.at>.5));
  // Different routes pass different subsets, so new routes are worth flying.
  const seen=new Set();for(const [a,b] of [['meridian','kepler'],['meridian','rusthaven'],['kepler','foundry'],['foundry','meridian'],['rusthaven','kepler']])for(const p of X.routeSources(a,b))seen.add(p.source.id);
  assert(seen.size>X.routeSources('meridian','kepler').length);
  assert.deepEqual(X.routeSources('meridian','kepler'),X.routeSources('meridian','kepler'),'stable');
  assert.deepEqual(X.passed('meridian','kepler',.5,.5),[]);assert.equal(X.passed('meridian','kepler',0,1).length,local.length);
});
test('moving contacts map to the right roster',()=>{
  assert.equal(X.role({relationship:'hostile',className:'raider'}),'pirate');
  assert.equal(X.role({traffic:true,role:'cargo arrival',className:'courier'}),'cargo');
  assert.equal(X.role({traffic:true,role:'civilian departure',className:'shuttle'}),'passenger');
  assert.equal(X.role({traffic:true,role:'mining transfer',className:'courier'}),'civilian');
  assert.equal(X.role({relationship:'neutral',battle:true}),null);
});
test('flying a route earns one point per emitter passed, and flying it again earns nothing',()=>{
  const db=W.fresh();let earned=0;
  for(const p of X.passed('meridian','kepler',0,1))earned+=W.observe(db,{sourceId:p.source.id,confidence:'confirmed',place:'erebus'},1).points;
  assert.equal(earned,X.routeSources('meridian','kepler').length);
  let again=0;for(const p of X.passed('meridian','kepler',0,1))again+=W.observe(db,{sourceId:p.source.id,confidence:'confirmed',place:'erebus'},2).points;
  assert.equal(again,0);
});
test('the leaderboard rivals advance slowly with play time and stay beatable',()=>{
  const start=X.leaderboard(0,0);assert.deepEqual(start.map(r=>r.name),['GhostVector','SignalWraith','EchoNine','VoidWalker','RiftRunner','YOU']);
  assert.equal(start.find(r=>r.player).rank,6);
  const tenHours=X.leaderboard(36000,0);assert(tenHours[0].points<80,'no runaway inflation');
  const forever=X.leaderboard(1e9,0);assert(Math.max(...forever.map(r=>r.points))<S.all().length,'every rival is below the number of real signals');
  assert.equal(X.leaderboard(36000,S.all().length).find(r=>r.player).rank,1,'a thorough player can reach the top');
  assert.equal(X.leaderboard(0,48).find(r=>r.player).rank,2,'a tie goes to the rival who got there first');
});
test('the play clock is saved and validated',()=>{
  const s=C.fresh();s.warflying.clock=7200;assert.equal(C.restore(JSON.stringify(s)).warflying.clock,7200);
  const raw=JSON.parse(JSON.stringify(s));raw.warflying.clock=-5;assert.equal(C.restore(JSON.stringify(raw)).warflying.clock,0);
});
