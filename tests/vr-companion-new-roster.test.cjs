// Una and the two base figures: roster placement, dev-only listing, pairing, Una's outfits (David's Style A by
// default) with their parts, textures and glossier finishes, and nothing changed for the public roster.
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../void-runner/vr-companions.js');

test('Una and the female base figure are female companions; the male base figure is male',()=>{
 assert.equal(C.get('una').sex,'female');assert.equal(C.get('base-f').sex,'female');assert.equal(C.get('base-m').sex,'male');
 for(const id of ['una','base-f','base-m']){const e=C.get(id);assert.equal(e.listed,'dev');assert.ok(e.pairable);assert.deepEqual(e.dialogue,{});assert.ok(e.voice.characterId);
  assert.equal(C.offered(e,'localhost'),true);assert.equal(C.offered(e,'thedarknetdistrict.com'),false);}
 assert.ok(C.list({sex:'male'}).some(e=>e.id==='base-m'));assert.ok(!C.list({sex:'female'}).some(e=>e.id==='base-m'));
});

test('Una wears Style A (minimalist) by default; every outfit shows its own parts',()=>{
 const una=C.get('una');assert.deepEqual(C.chosen(una),{outfit:'minimalist'});
 const a=C.wears(una,{}),b=C.wears(una,{outfit:'nightlife'}),c=C.wears(una,{outfit:'elegant'}),o=C.wears(una,{outfit:'original'});
 assert.ok(!a('jacket')&&a('leggings')&&a('piping_top')&&a('piping_waist')&&!a('shorts'));
 assert.ok(b('jacket')&&b('shorts')&&b('piping_shorts')&&!b('leggings')&&!b('jacket_item'));
 assert.ok(c('jacket')&&c('jacket_item')&&c('piping_jacket')&&c('leggings'));
 assert.ok(o('jacket')&&o('leggings')&&!o('piping_top')&&!o('piping_jacket'));
 for(const part of ['top','waistband','shoes','body','hair'])assert.ok(a(part)&&b(part)&&c(part)&&o(part),part);
 assert.deepEqual(C.lookTextures(una,{}),{outfit_top:'top-charcoal',outfit_pants:'pants-charcoal'});
 assert.deepEqual(C.lookTextures(una,{outfit:'original'}),{});
 assert.equal(C.lookMaterials(una,{outfit:'nightlife'}).outfit_jacket.roughness,.55);assert.deepEqual(C.lookMaterials(una,{}),{});
});

test('pairs work across the new companions, and the public roster is unchanged',()=>{
 assert.deepEqual(C.party({companions:['una','ava']}).map(e=>e.id),['una','ava']);
 assert.deepEqual(C.party({companions:['base-m','base-f']}).map(e=>e.id),['base-m','base-f']);
 assert.deepEqual([...C.companions.values()].filter(e=>C.offered(e,'thedarknetdistrict.com')).map(e=>e.id).sort(),['kai','nadia','seren']);
});
