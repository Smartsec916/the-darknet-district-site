const test=require('node:test'),assert=require('node:assert/strict');
const M=require('../void-runner/meridian-interior.js'),A=require('../void-runner/station-activities.js'),C=require('../void-runner/crowd.js');
const seeded=seed=>()=>{seed=(seed*9301+49297)%233280;return seed/233280;};

test('the bartender works behind the bar and never leaves it',()=>{
 const L=M.layout(),w=A.create(L,6,seeded(3)),bt=w.actors.find(a=>a.staff),bar=L.furniture.bar,seen=new Set();
 assert.ok(bt&&bt.id==='bartender');
 for(let i=0;i<40000;i++){A.step(w,.05);seen.add(bt.state);
  assert.ok(bt.x>bar.backX+.25&&bt.x<bar.x-.6,'between the back bar and the counter: '+bt.x);
  assert.ok(Math.abs(bt.z-bar.z)<=bar.length/2,'along the bar: '+bt.z);}
 for(const s of ['serve','pour','wipe','shelf'])assert.ok(seen.has(s),'bartender does '+s);
});

test('a patron sitting at the bar gets served',()=>{
 const L=M.layout(),w=A.create(L,1,seeded(5)),bt=w.actors.find(a=>a.staff),patron=w.actors[0],stool=L.activityPoints.find(p=>p.id==='bar-2');
 Object.assign(patron,{x:stool.position[0],z:stool.position[2],point:stool,state:'drink',timer:1e9,path:[]});
 let served=false;for(let i=0;i<4000&&!served;i++){A.step(w,.05);served=bt.state==='serve'&&Math.abs(bt.z-stool.position[2])<.3;}
 assert.ok(served,'the bartender walks over to the occupied stool and serves');
});

test('crew never take the bartender’s spots, chats or window slots',()=>{
 const L=M.layout(),w=A.create(L,6,seeded(9)),staffIds=new Set(L.staffPoints.map(p=>p.id));
 for(let i=0;i<30000;i++){A.step(w,.05);for(const a of w.actors)if(!a.staff){assert.ok(!staffIds.has(a.point?.id));assert.notEqual(a.partner,'bartender');}}
});

test('Meridian preloads the bartender look and only gives it to the bartender',()=>{
 assert.deepEqual(C.castFor('meridian','crew-bartender'),['meridian-bartender']);
 assert.ok(C.models('meridian','high')['crowd:meridian-bartender']);
 assert.ok(!C.casts.meridian.includes('meridian-bartender'));
 assert.deepEqual(C.castFor('vigil','crew-bartender'),['cyborg-01']); // every station has a bar now, with a local bartender
 for(const id of ['kepler','rusthaven','foundry','sol-belt','vigil','holdfast'])assert.ok(!C.castFor(id,'crew-bartender').includes('meridian-bartender'));
 for(const s of ['serve','wipe','pour','shelf'])assert.ok(C.clips['meridian-bartender'].includes(C.clipIn('meridian-bartender',C.activityClip[s])));
});

test('seated routines have their moves in every Meridian look',()=>{
 for(const look of C.casts.meridian)for(const c of ['sit','sit-enter','sit-exit','sit-talk','interact','look','walk'])assert.ok(C.clips[look].includes(c),look+' lacks '+c);
});
