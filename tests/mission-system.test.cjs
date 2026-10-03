const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../void-runner/campaign.js'),M=require('../void-runner/mission-log.js'),P=require('../void-runner/progression.js'),U=require('../void-runner/universe.js');

test('skipped Flight Training maneuvers stay incomplete after navigation, warp and docking',()=>{
 const s=C.fresh();s.quest='arrival';
 for(const id of ['throttle','navigation','jumpTravel','dock'])P.mark(s,id);
 M.sync(s,C);
 const training=M.all(s,C).find(m=>m.id==='flight-training');
 assert.equal(training.objectives.find(o=>o.id==='steer').complete,false);
 assert.equal(training.objectives.find(o=>o.id==='jumpTravel').complete,true);
 assert.equal(training.completed,false);
 assert(M.track(s,'flight-training',C));
 M.untrack(s);assert.equal(M.tracked(s,C),null);
 assert.equal(M.all(s,C).find(m=>m.id==='flight-training').objectives.find(o=>o.id==='steer').complete,false);
 assert(M.track(s,'flight-training',C));
 const restored=C.restore(JSON.stringify(s));
 assert(restored);assert.equal(M.tracked(restored,C).id,'flight-training');
 assert.equal(M.tracked(restored,C).objectives.find(o=>o.id==='steer').complete,false);
 P.mark(restored,'steer');M.sync(restored,C);
 assert.equal(M.tracked(restored,C).objectives.find(o=>o.id==='steer').complete,true);
});

test('Mission Log keeps completed missions and tracking never changes ownership',()=>{
 const s=C.fresh();s.quest='open';s.universe.freeTravel=true;M.sync(s,C);
 assert(M.track(s,'meet-admin',C));M.untrack(s);
 assert.equal(M.all(s,C).find(m=>m.id==='meet-admin').completed,false);
 assert.equal(M.tracked(s,C),null);
 M.complete(s,'meet-admin','meet-admin');
 assert.equal(M.all(s,C).find(m=>m.id==='meet-admin').completed,true);
 assert.equal(M.track(s,'meet-admin',C),false);
 const restored=C.restore(JSON.stringify(s));
 assert.equal(M.all(restored,C).find(m=>m.id==='meet-admin').completed,true);
});

test('finishing later qualification allows travel while a skipped maneuver remains available',()=>{
 const s=C.fresh();s.quest='open';s.missileOfferSeen=true;
 for(const id of M.trainingIds.filter(id=>id!=='steer'))P.mark(s,id);
 U.unlock(s);M.sync(s,C);
 assert.equal(s.progression.completed,false);
 assert.equal(s.universe.freeTravel,true);
 assert.equal(M.all(s,C).find(m=>m.id==='flight-training').completed,false);
 M.untrack(s);assert(C.chooseDestination(s,'kepler'));
 assert.equal(C.flight(s).kind,'transit');
 M.track(s,'flight-training',C);
 assert.equal(M.tracked(s,C).objectives.find(o=>!o.complete).id,'steer');
});

test('a registered multi-objective mission completes only after each required event',()=>{
 assert(M.define('test-bounty',{title:'Test bounty',type:'bounty',objectives:[{id:'find',label:'Find target'},{id:'destroy',label:'Destroy target'}]}));
 const s=C.fresh();M.acquire(s,'test-bounty');
 assert(M.complete(s,'test-bounty','find',C));
 assert.equal(M.all(s,C).find(m=>m.id==='test-bounty').completed,false);
 assert(M.complete(s,'test-bounty','destroy',C));
 assert.equal(M.all(s,C).find(m=>m.id==='test-bounty').completed,true);
});

test('boarding after the opening unlocks the Flight Training Mission Log',()=>{
 const s=C.fresh();s.progression.opening={version:2,hologram:true,pistol:true,cans:[0,1,2,3]};
 for(const id of ['move','look','interact','draw','aim','fire','reload','groundCombat'])P.mark(s,id);
 assert(C.beginJourney(s));assert.equal(s.universe.missionLogUnlocked,true);
 assert.equal(M.tracked(s,C)?.id,'flight-training');
});
