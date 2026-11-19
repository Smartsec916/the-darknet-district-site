'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const A=require('../void-runner/character-appearance.js'),CAT=A.CATALOG,ROOT=path.join(__dirname,'..');
const {parseGlb}=require('../tools/assets/glb-lib.cjs'),BIND=JSON.parse(fs.readFileSync(path.join(ROOT,'void-runner/assets/models/parts/bind-data.json'),'utf8'));
const clone=o=>JSON.parse(JSON.stringify(o));

test('the browser copy of the catalog matches the JSON source',()=>{
 const r=cp.spawnSync(process.execPath,[path.join(ROOT,'tools/assets/build-character-catalog.cjs'),'--check'],{encoding:'utf8'});
 assert.equal(r.status,0,r.stderr);
});
test('catalog integrity: counts, ids, files, colours',()=>{
 assert.equal(Object.keys(CAT.hair).length,9);assert.equal(CAT.hairColors.length,8);assert.equal(CAT.clothingColors.length,8);
 assert.equal(CAT.hairColors.filter(c=>c.group==='natural').length,5);assert.equal(CAT.hairColors.filter(c=>c.group==='cyber').length,3);
 for(const c of [...CAT.hairColors,...CAT.clothingColors]){assert.match(c.hex,/^#[0-9a-f]{6}$/);assert.match(c.id,/^[a-z0-9-]+$/);}
 assert.equal(new Set([...CAT.hairColors,...CAT.clothingColors].map(c=>c.id)).size,16,'colour ids unique');
 for(const [id,h] of Object.entries(CAT.hair)){assert.ok(fs.existsSync(path.join(ROOT,'void-runner/assets/models/parts',h.part)),id);assert.ok(BIND.parts[id],id);}
 assert.deepEqual(Object.keys(CAT.bases).sort(),['female','male']);
 for(const [id,l] of Object.entries(CAT.looks)){
  assert.ok(CAT.bases[l.base]);assert.ok(fs.existsSync(path.join(ROOT,'void-runner/assets/models/crowd',l.model+'.glb')),id);
  assert.ok(BIND.bodies[l.model],'no bind data for '+id);
  const names=parseGlb(path.join(ROOT,'void-runner/assets/models/crowd',l.model+'.glb')).json.materials.map(m=>m.name);   // runtime mesh names are the material names
  assert.ok(names.includes(l.outfit)&&names.includes(l.body)&&(!l.shoes||names.includes(l.shoes))&&(!l.nativeHair||names.includes(l.nativeHair)),id+' mesh names');   // armoured looks (OUTLAW, CYBORG) have no separate shoes, and CYBORG has no native hair
  for(const [k,meshes] of Object.entries(l.accessories)){assert.ok(CAT.accessories[k],k);for(const m of meshes)assert.ok(names.includes(m),id+' '+m);}
  for(const d of l.defaultAccessories)assert.ok(l.accessories[d],id+' default accessory');
  // every hairstyle the catalog offers on a body must pass the head-fit gate
  for(const h of l.hairOk)assert.ok(BIND.fit[h][l.model].ok,h+' on '+id);
 }
 assert.ok(Object.values(CAT.looks).filter(l=>l.base==='male').length>=1&&Object.values(CAT.looks).filter(l=>l.base==='female').length>=1);
});
test('standard heights are configured per base, not per model',()=>{
 assert.equal(CAT.bases.male.height,1.78);assert.equal(CAT.bases.female.height,1.66);
 for(const l of Object.values(CAT.looks)){
  const s=A.heightScale(l.base,BIND.bodies[l.model].topY);
  assert.ok(s>0.9&&s<1.3,l.model+' scale '+s+' is outside the uniform-scale limit'); // the shipped bodies really differ (district-resident is 1.32 m native): standardising is one uniform scale, never a per-axis stretch
  assert.ok(Math.abs(BIND.bodies[l.model].topY*s-CAT.bases[l.base].height)<1e-9);
 }
});
test('every look has a valid default appearance and preset looks keep their legacy ids',()=>{
 for(const id of Object.keys(CAT.looks))assert.deepEqual(A.problems(A.defaults(id)),[]);
 assert.deepEqual(A.fromLegacy({gender:'male',model:'district-smuggler'}),A.defaults('district-smuggler'));
 assert.deepEqual(A.fromLegacy({gender:'female',model:'district-resident'}),A.defaults('district-resident'));
 assert.equal(A.fromLegacy({gender:'male',model:'admin'}),null);assert.equal(A.fromLegacy(null),null);assert.equal(A.fromLegacy({gender:'female',model:'district-smuggler'}),null);
});
test('valid combinations pass',()=>{
 const a=A.defaults('hacker-01');a.hair='bob01';a.hairColor='magenta';a.clothingColor='navy';
 assert.deepEqual(A.problems(a),[]);
 const b=A.defaults('ncz-neon');b.hair='none';b.accessories=[];assert.ok(A.validate(b));
});
test('invalid or hostile data is rejected, never repaired halfway',()=>{
 const base=A.defaults('district-smuggler'),bad=[];
 const with_=(k,v)=>{const x=clone(base);x[k]=v;return x;};
 bad.push(with_('base','robot'),with_('look','../../etc/passwd'),with_('look','ncz-neon'),with_('hair','C:\\x.glb'),with_('hair','longhair99'),with_('hairColor','#ff0000'),with_('hairColor','red'),with_('clothingColor','jet'),
  with_('accessories','hat'),with_('accessories',['hat','hat']),with_('accessories',['collar']),with_('accessories',new Array(20).fill('hat')),with_('v',2),with_('hair',{}),with_('hair',null),
  {...base,extra:1},{...base,__proto__:{x:1}}.constructor===Object?{...base,'constructor':1}:base,'string',null,[],42,undefined);
 for(const x of bad.filter(x=>x!==base))assert.equal(A.validate(x),false,JSON.stringify(x));
 const hat=clone(base);hat.accessories=['hat'];hat.hair='long01';assert.ok(A.problems(hat).some(p=>/hat/.test(p)),'a hat is not allowed over long hair');
 hat.hair='short01';assert.deepEqual(A.problems(hat),[]);
 // fallback is always a fully valid appearance
 assert.deepEqual(A.normalize({base:'male',look:'nope'},'district-resident'),A.defaults('district-resident'));
 assert.deepEqual(A.normalize('garbage'),A.defaults('district-smuggler'));
 for(const x of bad)assert.doesNotThrow(()=>A.normalize(x));
});
test('the creator offers only what is valid together (hat hides long hair)',()=>{
 const a=A.defaults('district-smuggler');                    // wears a hat by default
 const o=A.options(a);
 assert.equal(o.hair.find(h=>h.id==='long01').enabled,false);assert.equal(o.hair.find(h=>h.id==='short02').enabled,true);
 a.accessories=[];assert.equal(A.options(a).hair.find(h=>h.id==='long01').enabled,true);
 assert.ok(A.options(a).looks.every(l=>CAT.looks[l.id].base==='male'));
 assert.equal(A.options(a).hairColors.length,8);assert.equal(A.options(a).clothingColors.length,8);
});
test('locked options are listed honestly and never selectable',()=>{
 assert.equal(CAT.lockedOptions.status,'needs-export');
 for(const o of CAT.lockedOptions.outfits){const x=A.defaults('fixer-01');x.look='nope';assert.equal(A.validate({...A.defaults('hacker-01'),outfit:o.id}),false);}
});
test('legacy characters map to the same two looks and the server record stays compatible',()=>{
 assert.deepEqual(A.toLegacy(A.defaults('district-smuggler')),{gender:'male',model:'district-smuggler'});
 assert.deepEqual(A.toLegacy(A.defaults('ncz-neon')),{gender:'female',model:'district-resident'});
 assert.deepEqual(A.toLegacy(A.defaults('hacker-01')),{gender:'male',model:'district-smuggler'});
});
test('local persistence: save, load, per-account, bad data, legacy fallback, no storage',()=>{
 const mem=()=>{const m={};return {getItem:k=>(k in m?m[k]:null),setItem:(k,v)=>{m[k]=v;},m};};
 const s=mem(),a=A.defaults('fixer-01');a.hair='short03';a.hairColor='silver';
 assert.equal(A.save(s,'uid-1',a),true);assert.deepEqual(A.load(s,'uid-1'),a);assert.equal(A.load(s,'uid-2'),null);
 assert.deepEqual(A.load(s,'uid-2',{gender:'female',model:'district-resident'}),A.defaults('district-resident'),'an old character keeps its look');
 s.setItem(A.KEY+'uid-3','{not json');assert.equal(A.load(s,'uid-3'),null);
 s.setItem(A.KEY+'uid-4',JSON.stringify({...a,look:'../x'}));assert.equal(A.load(s,'uid-4',{gender:'male',model:'district-smuggler'}).look,'district-smuggler');
 assert.equal(A.save(s,'uid-1',{base:'x'}),false);
 assert.equal(A.save({getItem(){throw new Error('x');},setItem(){throw new Error('x');}},'u',a),false);
 assert.equal(A.load({getItem(){throw new Error('x');}},'u'),null);
});

test('the hub carries identical copies of the appearance rules and catalog',()=>{
 const r=cp.spawnSync(process.execPath,[path.join(ROOT,'tools/assets/sync-hub-appearance.cjs'),'--check'],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);
});

test('the creator is never downloaded by phones: every creator script is gate-inert, and the static page is identical',()=>{
 const html=fs.readFileSync(path.join(ROOT,'void-runner.html'),'utf8');
 for(const f of ['character-catalog','character-appearance','character-fit','character-assembler','character-creator']){
  assert.match(html,new RegExp('<script type="text/tdd-game" src="void-runner/'+f+'\\.js"></script>'),f);
  assert.doesNotMatch(html,new RegExp('<script(?![^>]*tdd-game)[^>]*'+f),f+' must not load outside the device gate');
 }
 assert.equal(Buffer.compare(fs.readFileSync(path.join(ROOT,'void-runner.html')),fs.readFileSync(path.join(ROOT,'static/void-runner.html'))),0);
 const order=['character-catalog','character-appearance','character-fit','character-assembler','character-creator'].map(f=>html.indexOf('void-runner/'+f+'.js'));
 assert.deepEqual([...order].sort((a,b)=>a-b),order,'load order');
 assert.ok(order[4]>html.indexOf('void-runner/world-integration.js')&&order[4]>html.indexOf('void-runner/babylon-integration.js'),'after the wrappers it pauses');
});
test('cosmetics are separate from inventory and equipment: the creator code never touches them',()=>{
 for(const f of ['character-creator.js','character-assembler.js','character-appearance.js']){
  const src=fs.readFileSync(path.join(ROOT,'void-runner',f),'utf8');
  assert.doesNotMatch(src,/state\.(credits|inventory|equipment|loadout|missions)\s*=/,f);
  assert.doesNotMatch(src,/\b(trade|sendTrade|loadout)\b/i,f+' has no trade or equipment code');
 }
});
