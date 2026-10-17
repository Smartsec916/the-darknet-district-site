const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const C=require('../void-runner/crowd.js');
const specs=path.join(__dirname,'../tools/animation-pipeline/characters'),models=path.join(__dirname,'../void-runner/assets/models/crowd');

test('every look in a cast has a clip list that matches its character spec',()=>{
 const used=new Set(Object.values(C.casts).flat());
 for(const look of used){
  assert.ok(C.clips[look],look+' has no clip list');
  const spec=JSON.parse(fs.readFileSync(path.join(specs,look+'.json'),'utf8'));
  assert.deepEqual([...spec.clips].sort(),[...C.clips[look]].sort(),look+' clips differ from its spec');
  assert.ok(C.clips[look].includes('idle'),look+' needs an idle fallback');
 }
});

test('shipped crowd models exist for every cast look',()=>{
 for(const look of new Set(Object.values(C.casts).flat()))assert.ok(fs.existsSync(path.join(models,look+'.glb')),look+'.glb missing');
});

test('clips follow what each crew member is doing',()=>{
 assert.equal(C.clipFor('crew-smoke1'),'smoke');
 assert.equal(C.clipFor('crew-vr-watch'),'sit');
 assert.equal(C.clipFor('crew-vr2'),'sit');
 assert.equal(C.clipFor('crew-vesper-sit1'),'sit');
 assert.equal(C.clipFor('crew-pray3'),'watch');
 assert.equal(C.clipFor('crew-repair1'),'work');
 assert.equal(C.clipFor('crew-teach'),'talk');
 assert.ok(['work','watch'].includes(C.clipFor('crew-farm4')));
 for(const id of ['crew-0','crew-ncz2','crew-wander1'])assert.ok(['idle','talk','watch'].includes(C.clipFor(id)));
});

test('NeoChinatown street and District crew wear different looks',()=>{
 C.begin();
 assert.ok(C.casts.neochinatown.includes(C.pick('neochinatown','crew-ncz1')));
 assert.ok(C.casts.district.includes(C.pick('neochinatown','crew-bar1')));
 assert.ok(C.casts.district.includes(C.pick('neochinatown','crew-vr0')));
 assert.ok(C.casts.district.includes(C.pick('neochinatown','crew-smoke2')));
 const defs=C.models('neochinatown','high');
 for(const l of [...C.casts.neochinatown,...C.casts.district])assert.ok(defs['crowd:'+l]);
});

test('picking deals varied looks and only ones with the needed clip',()=>{
 C.begin();
 const seen=new Set();for(let i=0;i<6;i++)seen.add(C.pick('meridian','crew-'+i,'idle'));
 assert.ok(seen.size>=5,'six Meridian crew should show at least five looks');
 C.begin();
 for(let i=0;i<4;i++)assert.ok(C.clips[C.pick('vesper','crew-vesper-sit'+i)].includes('sit'));
});

test('named characters, unknown places and low quality get no crowd looks',()=>{
 C.begin();
 assert.equal(C.pick('derelict','crew-1'),null);
 assert.deepEqual(C.models('vesper','low'),{});
 assert.deepEqual(C.models('nowhere','high'),{});
 for(const cast of Object.values(C.casts))for(const look of cast)assert.ok(!/mara|rook|nyx|admin|iris|elias|kess|mercer|elara|marcus/.test(look));
});

test('Natural Order looks carry no glowing tech (no embedded AI)',()=>{
 for(const look of new Set([...C.casts.holdfast,...C.casts['order-homeworld']])){
  const spec=JSON.parse(fs.readFileSync(path.join(specs,look+'.json'),'utf8'));
  assert.ok(!(spec.accessories||[]).some(a=>a.glow),look+' has a glowing accessory');
  assert.ok(!Object.values(spec.style||{}).some(s=>s.glow),look+' has glowing trim');
 }
});
