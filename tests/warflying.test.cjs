const test=require('node:test'),assert=require('node:assert/strict');
const W=require('../void-runner/warflying.js'),S=require('../void-runner/signals.js'),P=require('../void-runner/progression.js'),C=require('../void-runner/campaign.js');
const see=(db,id,confidence='confirmed',place='erebus',t=1000)=>W.observe(db,{sourceId:id,confidence,place},t);

test('a newly identified source is worth exactly one point, whatever it is',()=>{
  const db=W.fresh();assert.equal(W.POINTS_PER_SOURCE,1);
  for(const id of ['ship:erebus-cargo-1','ship:sol-police-1','satellite:sol-1','beacon:erebus-2','station:meridian','ship:erebus-pirate-3'])assert.equal(see(db,id).points,1,id);
  assert.equal(W.points(db),6);assert.equal(W.discoveries(db),6);
});
test('repeat sightings, new places and later times earn nothing but update the history',()=>{
  const db=W.fresh();see(db,'ship:erebus-cargo-1','confirmed','meridian',1000);
  const again=see(db,'ship:erebus-cargo-1','confirmed','kepler',5000);assert.equal(again.status,'repeat');assert.equal(again.points,0);
  const r=db.records['ship:erebus-cargo-1'];assert.equal(r.k,2);assert.equal(r.f,1000);assert.equal(r.l,5000);assert.deepEqual(r.places,['meridian','kepler']);
  for(let i=0;i<20;i++)see(db,'ship:erebus-cargo-1','confirmed','p'+i,6000+i);
  assert.equal(r.places.length,W.limits.places,'history is bounded');assert.equal(W.points(db),1);
});
test('a partial contact is recorded without a point until it is confirmed, then scores once',()=>{
  const db=W.fresh();const first=see(db,'ship:sol-civilian-2','partial');assert.equal(first.status,'new');assert.equal(first.points,0);
  assert.equal(db.records['ship:sol-civilian-2'].n,null,'no name before identification');
  const confirmed=see(db,'ship:sol-civilian-2');assert.equal(confirmed.status,'confirmed');assert.equal(confirmed.points,1);
  assert.equal(see(db,'ship:sol-civilian-2').points,0);assert.equal(see(db,'ship:sol-civilian-2','partial').points,0);assert.equal(W.points(db),1);
});
test('category, name and affiliation come from the registry, and nothing about cargo is stored',()=>{
  const db=W.fresh();W.observe(db,{sourceId:'ship:erebus-cargo-1',confidence:'confirmed',place:'erebus',category:'military',name:'Fake',cargo:['contraband'],manifest:'secret'},1);
  const r=db.records['ship:erebus-cargo-1'];assert.equal(r.c,'cargo');assert.equal(r.n,S.source('ship:erebus-cargo-1').name);
  assert.doesNotMatch(JSON.stringify(r),/contraband|secret|manifest/);
  assert.equal(see(db,'ship:made-up-1').status,'ignored');assert.equal(see(db,'nonsense').status,'ignored');assert.equal(W.points(db),1);
});
test('identities are stable, rosters are finite, and pirates broadcast no name',()=>{
  assert.deepEqual(S.roster('erebus','cargo'),S.roster('erebus','cargo'));
  const ids=S.all().map(s=>s.id);assert.equal(new Set(ids).size,ids.length,'unique ids');
  assert(S.roster('erebus','pirate').every(s=>s.name===null));assert.deepEqual(S.roster('erebus','police'),[]);assert.equal(S.roster('sol','police').length,4);
  assert.equal(S.source('station:earth').category,'settlement');assert.equal(S.source('station:meridian').category,'station');
  assert.equal(S.source('ship:battle-communion-natural-order-2').category,'natural-order');assert.equal(S.source('ship:battle-communion-communion-0').category,'communion');assert.equal(S.source('ship:battle-communion-0'),null);
  // Respawned traffic draws from the roster, so points are capped by the number of real sources.
  const db=W.fresh();for(let i=0;i<500;i++)see(db,S.pick('erebus','cargo',Math.random).id);assert(W.points(db)<=S.roster('erebus','cargo').length);
});
test('the database survives a save round trip and tampered records are corrected',()=>{
  const s=C.fresh();see(s.warflying,'beacon:sol-1');see(s.warflying,'ship:sol-cargo-2','partial');
  let r=C.restore(JSON.stringify(s));assert.equal(W.points(r.warflying),1);assert.equal(Object.keys(r.warflying.records).length,2);
  const raw=JSON.parse(JSON.stringify(s));raw.warflying.records['ship:sol-cargo-2'].p=1;raw.warflying.records['ship:fake-9']={p:1,conf:'confirmed'};raw.warflying.records['beacon:sol-1'].n='Renamed';
  r=C.restore(JSON.stringify(raw));assert.equal(W.points(r.warflying),1,'a partial contact cannot carry a point');assert(!r.warflying.records['ship:fake-9']);assert.equal(r.warflying.records['beacon:sol-1'].n,'NAV TES-1');
  const old=JSON.parse(JSON.stringify(C.fresh()));delete old.warflying;assert.equal(W.points(C.restore(JSON.stringify(old)).warflying),0,'older saves start empty');
});

// ---- The Utility slot (internal id 'signal'): exactly one of three modules ----
function pilot(credits=5000){const s=C.fresh();s.credits=credits;return s;}
test('the Utility slot holds exactly one module, and swapping keeps ownership',()=>{
  const s=pilot();assert.equal(P.slotLabel('signal'),'UTILITY');assert.equal(P.slotLabel('utility'),'DRIVE');
  assert(P.buy(s,'warflying-module'));assert(P.buy(s,'warflying-scrambler','admin'));
  assert(P.install(s,'signal','warflying-module'));assert.equal(P.utility(s),'warflying-module');
  assert(P.install(s,'signal','warflying-scrambler'));assert.equal(P.utility(s),'warflying-scrambler','installing one replaces the other');
  assert.equal(Object.values(s.progression.equipment.installed[s.activeShip]).filter(id=>P.modules[id]?.slot==='signal').length,1);
  assert(s.progression.equipment.owned.includes('warflying-module'),'still owned after the swap');
  assert(!P.install(s,'sensor','warflying-module'),'never in another slot');
  assert(P.install(s,'signal',null));assert.equal(P.utility(s),null);
});
test('Admin alone sells the scrambler; scanners are outfitter stock',()=>{
  const s=pilot();assert(!P.buy(s,'warflying-scrambler'),'not at an outfitter');assert(P.buy(s,'warflying-scrambler','admin'));
  const t=pilot();assert(!P.buy(t,'warflying-module','admin'),'Admin does not sell scanners');assert(P.buy(t,'warflying-module'));
});
test('the Signal Tracker is defined but cannot be bought, fitted or smuggled in through a save',()=>{
  const s=pilot();assert.equal(P.modules['signal-tracker'].slot,'signal');
  for(const vendor of ['outfitter','admin',null])assert(!P.buy(s,'signal-tracker',vendor));
  s.progression.equipment.owned.push('signal-tracker');assert(!P.install(s,'signal','signal-tracker'));
  const raw=JSON.parse(JSON.stringify(s));raw.progression.equipment.installed.starter={signal:'signal-tracker'};
  const r=C.restore(JSON.stringify(raw));assert(!r.progression.equipment.owned.includes('signal-tracker'));assert.equal(P.utility(r),null);
});
test('each ship keeps its own Utility module across ship changes and reloads',()=>{
  const s=pilot();P.buy(s,'warflying-module');P.install(s,'signal','warflying-module');
  const r=C.restore(JSON.stringify(s));assert.equal(P.utility(r),'warflying-module');
  r.activeShip='ship2';assert.equal(P.utility(r),null,'another hull has its own slot');
});
test('continuous listening in one place is one sighting, not hundreds',()=>{
  const db=W.fresh();for(let i=0;i<120;i++)see(db,'beacon:erebus-1','confirmed','erebus:meridian>kepler',1000+i*500);
  assert.equal(db.records['beacon:erebus-1'].k,2,'two sightings: the first, and again after a minute');
});
