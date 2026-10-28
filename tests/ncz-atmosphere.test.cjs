const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const N=require('../void-runner/neochinatown.js');

test('the VR terminal stands on the spot where E opens the VR menu, with its own collision',()=>{
 const d=N.layout(),kiosk=d.solids.find(s=>s.id==='arcade-terminal'),spot=d.interactions.find(i=>i.id==='district-vr');
 assert.ok(kiosk&&spot);
 // The prompt is just in front of the kiosk's screen, within reach.
 assert.ok(Math.hypot(kiosk.position[0]-spot.position[0],kiosk.position[2]-spot.position[2])<1.2);
 assert.ok(!/^vr-/.test(kiosk.id),'not drawn as a wall by the district wall builder');
});

test('both District doors keep their collision; the story only unlocks them (the door system opens and closes them)',()=>{
 const d=N.layout();for(const id of ['district-door','district-inner-door'])assert.ok(d.solids.find(s=>s.id===id),id);
 const src=fs.readFileSync(path.join(__dirname,'../void-runner/prologue-integration.js'),'utf8');
 assert.ok(!/s\.id==='district-door'&&f\.districtDoor/.test(src),'the door solid is no longer dropped when unlocked');
 const ncz=fs.readFileSync(path.join(__dirname,'../void-runner/neochinatown.js'),'utf8');
 assert.ok(/solid\.open=d\.open>=\.8/.test(ncz),'collision follows the door');
 assert.ok(!/box\('district-door-frame',\[6\.4,3\.6,\.5\]/.test(ncz),'no solid slab across the doorway');
});

test('the NeoChinatown sky is a closed dome (no open-topped cylinder)',()=>{
 const ncz=fs.readFileSync(path.join(__dirname,'../void-runner/neochinatown.js'),'utf8');
 assert.ok(!/CreateCylinder\('haze-dome'/.test(ncz));assert.ok(/shell\('night-sky'/.test(ncz));
});
