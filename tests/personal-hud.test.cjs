// Personal HUD data: in-person versus remote contacts, link status, the inventory split, and the HUD key.
const test=require('node:test'),assert=require('node:assert/strict');
const H=require('../void-runner/hud-data.js'),C=require('../void-runner/campaign.js'),U=require('../void-runner/universe.js');
function open(at='meridian'){const s=C.fresh();s.quest='open';s.location=at;s.progression.completed=true;s.progression.flags.missileFired=true;s.universe=U.restore({...s.universe,freeTravel:true},s);s.universe.freeTravel=true;return s;}

test('contacts are only people met, placed where they really are, and only story channels are remote',()=>{
  const s=open();s.story.met.push('rook','mara','Admin','elara','pilot');
  const c=H.contacts(s),by=Object.fromEntries(c.map(x=>[x.id,x]));
  assert.deepEqual(c.map(x=>x.id).sort(),['Admin','elara','mara','rook']);
  assert.equal(by.rook.channel,'Here, in person');assert.equal(by.Admin.channel,'In person only');assert.equal(by.elara.remote,null);
  assert.equal(by.mara.remote,'comm');
  // No contact can be called: the data offers no call action at all.
  assert.ok(c.every(x=>!('call' in x)));
});

test('messages are rebuilt from story state, not stored separately',()=>{
  const s=open();assert.equal(H.messages(s).length,0);
  s.story.flags.flightTrainingComplete=true;assert.equal(H.messages(s)[0].from,'Mara');
  s.missileOfferSeen=true;assert.equal(H.messages(s,{rook:'line'}).length,2);
});

test("the link follows the game's comms rules, including the District's premises",()=>{
  const s=open();assert.equal(H.link(s,{onFoot:true}).state,'connected');
  s.location='earth';const l=H.link(s,{onFoot:true});assert.equal(l.state,'unavailable');assert.match(l.note,/blocked on these premises/);
  assert.equal(l.local,true);
});

test('inventory keeps what you carry apart from what is aboard, and ship equipment is read-only',()=>{
  const s=open();s.progression.personal.weapon='ward-pistol';C.accept(s,'rook-job:routine');s.progression.cargo=[{id:'drive-coil',units:1}];s.progression.equipment.owned.push('cooling');
  const i=H.inventory(s,{mission:C.missionFlight(s),ship:'Kestrel'});
  assert.equal(i.personal.weapon.name,'Ward pistol');assert.equal(i.ship.readOnly,true);
  assert.match(i.ship.cargo.contract.name,/./);assert.equal(i.ship.cargo.contract.units,1);assert.equal(i.ship.cargo.salvage[0].units,1);
  assert.equal(i.ship.cargo.used,2);assert.ok(i.ship.modules.owned.some(m=>/cooling/i.test(m.name)));
  assert.ok(!('cargo' in i.personal),'cargo is never shown as carried');
});

test('the HUD has its own key and controller button, and older saved bindings get a free key',()=>{
  const I=require('../void-runner/input.js');assert.equal(I.bindings.personalHud,'KeyP');assert.equal(I.controller.bindings.personalHud,8);
  const keys=Object.values(I.bindings);assert.equal(new Set(keys).size,keys.length,'no key does two things');
  const pads=Object.entries(I.controller.bindings).filter(([id])=>!['throttleUp','throttleDown'].includes(id)).map(([,b])=>b);assert.ok(!pads.filter(b=>b===8).slice(1).length);
});
