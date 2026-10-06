const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../void-runner/campaign.js'),P=require('../void-runner/progression.js'),O=require('../void-runner/opening-data.js');
function practice(){const s=C.fresh();s.location='vesper';Object.assign(s.progression.opening,{hologram:true,pistol:true});s.progression.personal.weapon='ward-pistol';return s;}
test('four distinct targets finish shooting without reload or an NPC callback',()=>{
 const s=practice();for(let i=0;i<3;i++)O.hit(s,i);assert.equal(P.groundDone(s),false);
 assert.equal(O.hit(s,2),false);assert.equal(O.hit(s,6),false);assert.equal(O.hit(s,3),true);
 assert.equal(s.progression.flags.shootingTutorialComplete,true);assert.equal(s.progression.flags.reload,undefined);
 assert.equal(P.groundDone(s),true);assert.equal(O.next(s),'handoff');
 P.mark(s,'maraShipHandoff');assert.equal(O.next(s),'ship');
 const restored=C.restore(JSON.stringify(s));assert.equal(O.next(restored),'ship');assert.equal(P.groundDone(restored),true);
 assert.equal(C.beginJourney(restored),true);
});
test('old saves with recorded cans repair completion while partial practice stays unfinished',()=>{
 const s=practice();s.progression.opening.cans=[0,1,2,3];const restored=C.restore(JSON.stringify(s));
 assert.equal(restored.progression.flags.shootingTutorialComplete,true);assert.equal(O.next(restored),'handoff');
 s.progression.opening.cans=[0,1,2];const partial=C.restore(JSON.stringify(s));assert.equal(P.groundDone(partial),false);
});
test('boarding and completed shooting are monotonic despite missing old target records',()=>{
 const s=practice();P.mark(s,'board');s.progression.opening.cans=[];
 const restored=C.restore(JSON.stringify(s));assert.equal(O.next(restored),'ship');assert.equal(P.groundDone(restored),true);
 assert.equal(restored.progression.flags.maraShipHandoff,true);
 delete restored.progression.flags.board;assert.equal(P.groundDone(restored),true);assert.equal(O.next(restored),'ship');
});
test('owned content, mission objectives and safe checkpoint survive a local save',()=>{
 const s=practice();s.credits=10000;C.buyShip(s,'ship2');C.switchShip(s,'ship2');C.equip(s,'pulse2');
 P.buy(s,'capacitor');P.install(s,'power','capacitor');s.progression.personal.attachments=['red-dot'];s.progression.personal.optic='red-dot';
 s.progression.missiles=3;s.progression.cargo=[{id:'salvage',units:1}];s.progression.data=['archive'];
 s.universe.missions={repair:{acquired:true,completed:false,objectives:{parts:true}}};s.universe.trackedMission='repair';s.universe.trackingInitialized=true;
 P.checkpoint(s,'kepler');s.location='undertow';const r=C.restore(JSON.stringify(s));
 assert.equal(r.location,'kepler');assert.equal(r.activeShip,'ship2');for(const id of s.ownedShips)assert.deepEqual(r.shipLoadouts[id],s.shipLoadouts[id]);
 assert.equal(r.progression.equipment.installed.ship2.power,'capacitor');assert.equal(r.progression.personal.optic,'red-dot');assert.equal(r.progression.missiles,3);
 assert.deepEqual(r.progression.cargo,s.progression.cargo);assert.deepEqual(r.progression.data,s.progression.data);assert.deepEqual(r.universe.missions.repair,s.universe.missions.repair);
 assert.equal(r.universe.trackedMission,'repair');
});
