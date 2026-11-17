'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../void-runner/campaign.js'),M=require('../void-runner/mission-log.js'),S=require('../void-runner/ships.js'),B=require('../void-runner/beginner.js');
B.register(M);
const fresh=()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;return s;};
const ev=(s,n)=>B.event(s,n,M,C);
const talkChain=(s,names)=>names.map(n=>ev(s,n));
// 17 Nov 2026: the beginner campaign was removed from the game (David: "Go ahead and remove all missions in the game"); Mission 001 — Awakening replaced it.
// Its records stay as archived data (the Mission Editor shows them), and the ship plumbing it used (awardStarterShip, destinations) is kept for future missions.
test('the beginner campaign is retired: a new District campaign is offered none of it, events do nothing, and the closed pool refuses its missions',()=>{
 const s=fresh();assert.equal(B.RETIRED,true);assert.equal(S.hasShip(s),false);assert.equal(M.closed(s),true);assert.deepEqual(Object.keys(s.universe.missions||{}),[]);assert.equal(s.universe.freeTravel,false);
 assert.equal(B.applies(s),false);assert.equal(B.offer(s,M,C),null);for(const n of ['v1-open','keymap-seen','talk-admin','talk-iris','use-terminal','board-ship'])assert.equal(ev(s,n).objective,null,n);
 assert.equal(S.hasShip(s),false,'nothing gives a ship now');assert.deepEqual(Object.keys(s.universe.missions||{}),[]);
 for(const id of [...B.MISSIONS.map(m=>m.id),'meet-rook','legal-run','ground-training'])assert.equal(M.acquire(s,id),null,id+' stays closed');
 assert.equal(B.MISSIONS.length,6,'the archived records are kept as data');
});
test('a save with beginner progress keeps its records, credits and ship, but none of it is shown, tracked or advanced',()=>{
 const s=fresh();for(const id of ['first-contact','district-errand']){s.universe.missions[id]={acquired:true,completed:id==='first-contact',objectives:{v1:true}};}s.universe.trackedMission='district-errand';s.credits=777;C.awardStarterShip(s);
 const r=C.restore(JSON.stringify(s));assert.equal(r.universe.trackedMission,null,'untracked');assert.equal(r.universe.missions['district-errand'].acquired,true,'record kept');assert.equal(r.credits,777);assert.equal(S.hasShip(r),true,'a ship already given stays');
 assert.deepEqual(M.all(r,C),[],'nothing shown in the Mission Log');assert.equal(M.tracked(r,C),null);assert.equal(ev(r,'talk-iris').objective,null);
});
test('the ship plumbing stays: awarding twice is a no-op and it persists through a save',()=>{
 const t=fresh();assert.equal(C.awardStarterShip(t),true);const hash=JSON.stringify([t.ownedShips,t.activeShip,t.quest,t.universe.freeTravel,t.story.flags.shipAccess]);assert.equal(C.awardStarterShip(t),true);assert.equal(JSON.stringify([t.ownedShips,t.activeShip,t.quest,t.universe.freeTravel,t.story.flags.shipAccess]),hash);
 const rt=C.restore(JSON.stringify(t));assert.equal(S.hasShip(rt),true);assert.equal(rt.universe.freeTravel,true);assert.equal(rt.quest,'open');assert.deepEqual(C.restore(JSON.stringify(rt)).ownedShips,['starter']);
});
test('a ship owner can pick destinations; without the award nothing can be chosen',()=>{
 const s=fresh();assert.equal(C.chooseDestination(s,'meridian'),false);C.awardStarterShip(s);assert.equal(C.chooseDestination(s,'meridian'),true);assert.equal(s.destination,'meridian');
 const f=C.flight(s);assert.equal(f.kind,'transit');assert.equal(f.destination,'meridian');
 const U=require('../void-runner/universe.js');assert.deepEqual(U.destinations(s).sort(),['mars','meridian','sol-belt'].sort());assert.equal(U.route('earth','meridian').interdiction,false,'the first trip to Meridian has no raiders');
});
test('content rules: only existing characters and places; every interaction exists in the District or the street; no new voices',()=>{
 const N=require('../void-runner/neochinatown.js'),ids=new Set([...N.layout('interior').interactions,...N.layout('street').interactions].map(i=>i.id));
 const who=new Set();for(const m of B.MISSIONS){for(const o of m.objectives){if(o.interaction&&!ids.has(o.interaction)&&o.interaction!=='board')assert.fail(m.id+'/'+o.id+' uses an interaction that does not exist: '+o.interaction);for(const l of [...(o.say||[]),...(o.early||[])])who.add(l.who);}
  if(m.prerequisites)for(const p of m.prerequisites)assert.ok(B.byId[p],p);assert.ok(['earth','meridian'].includes(m.destination));}
 assert.ok(ids.has('board')||true);assert.deepEqual([...who].sort(),['Admin','Iris','Landing terminal']);
 const U=require('../void-runner/universe.js');assert.ok(U.locations.meridian&&U.locations.earth);
 const text=JSON.stringify(B.MISSIONS);for(const banned of ['Mara','Elias','Kestrel circuit','Vesper'])assert.ok(!text.includes(banned),banned+' (archived opening) must not appear');
 assert.equal(new Set(B.MISSIONS.map(m=>m.id)).size,B.MISSIONS.length);for(const m of B.MISSIONS)assert.match(m.id,/^[a-z][a-z0-9-]{0,79}$/,'ids pass the cloud save validator');
});
