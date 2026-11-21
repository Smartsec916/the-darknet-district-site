// Environmental sound: which beds an area has, the floor underfoot, how a placed sound is heard, and that every file it names exists.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const A=require('../void-runner/area-ambience.js'),S=require('../void-runner/music-score.js'),root=path.join(__dirname,'..');
const file=name=>path.join(root,A.DIR,name+'.ogg');
test('each area has its own bed, and an unknown area has none',()=>{
 assert.ok(A.beds('neochinatown')['rain-street']>0&&A.beds('neochinatown')['city-distant']>0,'rain and the far city on the street');
 assert.ok(A.beds('alley')['alley-drip']>A.beds('alley')['rain-street'],'the alley drips');
 assert.ok(A.beds('district-hall')['vent-hum']>0);assert.equal(A.beds('district-hall')['rain-street'],undefined,'no rain indoors');
 assert.ok(A.beds('temple')['temple-wind']>0);assert.ok(A.beds('corporate')['corporate-plaza']>0);
 assert.deepEqual(A.beds('space'),{});assert.deepEqual(A.beds(null),{});
 for(const area of Object.keys(A.BEDS))assert.ok(S.styles[area],area+' is an area the music knows');
});
test('the floor underfoot follows the area',()=>{
 assert.equal(A.surface('neochinatown'),'wet');assert.equal(A.surface('alley'),'wet');assert.equal(A.surface('district-entry'),'metal');assert.equal(A.surface('district-hall'),'concrete');assert.equal(A.surface(null),null);
});
test('a placed sound fades with distance and sits on the side it comes from',()=>{
 const near=A.heard(0,1,0,10),mid=A.heard(0,5,0,10),far=A.heard(0,10,0,10);assert.ok(near.level>mid.level&&mid.level>0);assert.equal(far.level,0);
 assert.ok(Math.abs(mid.pan)<1e-9,'straight ahead is in the middle');
 assert.ok(A.heard(5,0,0,10).pan>.9,'to the right when facing +z');assert.ok(A.heard(-5,0,0,10).pan<-.9,'to the left');
 assert.ok(A.heard(5,0,Math.PI,10).pan<-.9,'turn round and it changes side');
 assert.equal(A.heard(0,0,0,10).pan,0,'standing on it: no side');
});
test('emitters belong to the inside of the District or to the street, never both',()=>{
 const inside=A.emittersFor('district-hall').map(e=>e.id),street=A.emittersFor('alley').map(e=>e.id);
 assert.ok(inside.includes('arcade')&&inside.includes('counter')&&inside.includes('scanner'));assert.deepEqual(street,['door-neon']);
 assert.deepEqual(A.emittersFor('district-terrace'),[]);assert.deepEqual(A.emittersFor('temple'),[]);assert.deepEqual(A.emittersFor(null),[]);
});
test('the lock sounds only when passing through the vestibule',()=>{
 assert.ok(A.lockBetween('alley','district-entry'));assert.ok(A.lockBetween('district-entry','district-hall'));
 assert.ok(!A.lockBetween('district-hall','district-store'));assert.ok(!A.lockBetween(null,'district-entry'),'not on arriving in the game');assert.ok(!A.lockBetween('district-entry','district-entry'));
});
test('every sound named is a file in the game, small enough to fetch on entering an area',()=>{
 const names=new Set(['door-lock']);for(const b of Object.values(A.BEDS))for(const n of Object.keys(b))names.add(n);for(const e of A.EMITTERS)names.add(e.loop);
 for(const s of new Set(['concrete',...Object.values(A.SURFACE)]))for(let i=1;i<=A.STEP_COUNT;i++)names.add('steps-'+A.stepSet(s).files+'-'+i);
 for(const n of names){const st=fs.statSync(file(n));assert.ok(st.size>2000&&st.size<400000,n);}
 const onDisk=fs.readdirSync(path.join(root,A.DIR)).filter(f=>f.endsWith('.ogg')).map(f=>f.slice(0,-4));assert.deepEqual(onDisk.filter(f=>!names.has(f)),[],'no unused sound files');
});
test('the Temple has its own soft stone floor: the player\'s steps play there, a little quieter, lower and softer than elsewhere (the owner, 18 Nov 2026)',()=>{
 assert.equal(A.surface('temple'),'stone');assert.equal(A.stepSet('stone').files,'concrete','stone uses the concrete recordings (no new files)');
 for(const run of [false,true]){const t=A.ownStepSound('stone',run,.4,.5),c=A.ownStepSound('concrete',run,.4,.5),w=A.ownStepSound('wet',run,.4,.5);
  assert.match(t.file,/^steps-concrete-[1-6]$/);assert.ok(t.level<c.level&&t.level<w.level,'quieter');assert.ok(t.level>=c.level*.5,'still clearly heard');assert.ok(t.rate<c.rate,'a little lower');assert.ok(t.lowpass>0&&c.lowpass===0,'the click taken off');}
 assert.ok(A.ownStepSound('stone',true,.4,.5).level>A.ownStepSound('stone',false,.4,.5).level,'running is still louder than walking');
 for(const p of [0,.5,.999]){const f=A.ownStepSound('wet',false,p,.5).file;assert.ok(/-([1-6])$/.test(f),f);}assert.equal(A.ownStepSound(null,false),null);
 assert.equal(A.ownStepSound('unknown-floor',false,0,.5).file,'steps-concrete-1','an unlisted floor sounds like concrete');
});
test('a place of its own is known from the walking location when the music\'s report is stale, so its steps never fall back to the silent tone',()=>{
 assert.equal(A.placeArea({id:'temple',temple:true}),'temple');assert.equal(A.placeArea({id:'corporate',corporate:true}),'corporate');assert.equal(A.placeArea({id:'neochinatown'}),null);assert.equal(A.placeArea(null),null);
 assert.equal(A.surface(A.placeArea({temple:true})),'stone');
});
