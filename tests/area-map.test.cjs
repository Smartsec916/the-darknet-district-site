// Map spaces and exploration fog for separate areas (area-map.js): reveal, pack to text, restore, safe on bad input.
const test=require('node:test'),assert=require('node:assert/strict');
const A=require('../void-runner/area-map.js'),C=require('../void-runner/corporate.js');
test('fog starts unexplored, reveals a disc of cells, and counts them',()=>{
  const f=A.createFog([-100,100,-100,100],8);assert.equal(f.explored(),0);assert.equal(f.fraction(),0);
  const n=f.reveal(0,0,16);assert.ok(n>8&&n<40,'a disc of cells: '+n);assert.equal(f.isExplored(0,0),true);assert.equal(f.isExplored(90,90),false);assert.equal(f.reveal(0,0,16),0,'nothing new the second time');
});
test('fog packs into a short text and restores exactly',()=>{
  const f=A.createFog([-100,100,-100,100],8);f.reveal(-60,40,20);f.reveal(55,-70,12);const t=f.encode();assert.match(t,/^A[A-Za-z0-9+/]+$/);assert.ok(t.length<=190,'fits a save flag: '+t.length);
  const g=A.createFog([-100,100,-100,100],8);assert.equal(g.decode(t),true);assert.equal(g.explored(),f.explored());for(const [x,z] of [[-60,40],[55,-70],[0,0],[90,90]])assert.equal(g.isExplored(x,z),f.isExplored(x,z));
});
test('bad or foreign fog text is ignored, never thrown',()=>{
  const f=A.createFog([-100,100,-100,100],8);f.reveal(0,0,10);const keep=f.encode();for(const bad of [undefined,null,'',42,'B'+'A'.repeat(104),'A'+'!'.repeat(105),'AAAA',{}])assert.equal(f.decode(bad),false,String(bad));
  assert.equal(f.encode(),keep,'a failed restore leaves the fog as it was');
});
test('a space saves and loads through story.flags, and an older save without it starts unexplored',()=>{
  const sp=A.get('corporate');assert.ok(sp&&sp.flag==='corpFog'&&typeof sp.model==='function');const flags={};const fog=A.load(sp,flags);assert.equal(fog.explored(),0);
  fog.reveal(0,-14,18);assert.equal(A.save(sp,fog,flags),true);assert.ok(typeof flags.corpFog==='string'&&flags.corpFog.length<200);
  const again=A.load(sp,flags);assert.equal(again.explored(),fog.explored());assert.equal(A.load(sp,{}).explored(),0);assert.equal(A.load(sp,null).explored(),0);
});
test('the save validator accepts the fog flag (a string under 200 characters)',()=>{
  const sp=A.get('corporate'),fog=A.load(sp,{});for(let x=-90;x<90;x+=6)for(let z=-90;z<90;z+=6)fog.reveal(x,z,5);assert.ok(fog.encode().length<200,'even a fully explored map fits: '+fog.encode().length);
});
test('registering a space needs an id, a flag and bounds',()=>{assert.throws(()=>A.register({id:'x'}));assert.throws(()=>A.register({id:'x',flag:'f'}));assert.ok(A.register({id:'tmp',flag:'tmpFog',bounds:[0,10,0,10],model(){return {};}}));});
