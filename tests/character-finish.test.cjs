const test=require('node:test'),assert=require('node:assert/strict');
const F=require('../void-runner/character-finish.js');
test('the finish is for ordinary character models only, never the VR companions',()=>{
 assert.equal(F.wants('crowd:district-smuggler'),true);assert.equal(F.wants('crowd:district-resident'),true);assert.equal(F.wants('crowd:hacker-01'),true);
 assert.equal(F.wants('crowd:vr-companion-f'),false);assert.equal(F.wants('crowd:vr-companion-m'),false);assert.equal(F.wants('district:couch'),false);assert.equal(F.wants('entry:district_vestibule_wall_6m'),false);assert.equal(F.wants(null),false);
});
test('eyes, lashes and teeth get no edge light; skin, cloth and hair do',()=>{
 for(const n of ['eyes','eyelashes','eyebrow001','teeth_base','tongue01'])assert(F.notSurface.test(n),n);
 for(const n of ['young_asian_female','male_casualsuit01','short04','shoes03','fedora_cocked'])assert(!F.notSurface.test(n),n);
});
test('the light is restrained: an accent, not a glow',()=>{assert(F.config.strength<=1&&F.config.lift<=.12&&F.config.power>=2);});
test('without the engine nothing is applied and nothing throws',()=>{assert.equal(F.apply('crowd:district-smuggler'),0);});
test('surface quality: each MakeHuman part is recognised for what it is; faces\' small parts and unknown parts are left alone',()=>{
 const k=F.surface;assert.equal(k('district_resident.body'),'skin');assert.equal(k('district_resident.female_sportsuit01'),'clothing');assert.equal(k('outlaw_01.matcreator_mc-scifi-armor_guardian'),'clothing');assert.equal(k('district_smuggler.fedora_cocked'),'clothing');
 assert.equal(k('district_resident.shoes04'),'footwear');assert.equal(k('hacker_01.short02'),'hair');assert.equal(k('district_resident.braid01'),'hair');assert.equal(k('district_smuggler.shades0'),'shell');assert.equal(k('hacker_01.visor0'),'shell');assert.equal(k('district_resident.mask0'),'shell');assert.equal(k('district_resident.mask0.slit0'),'light');
 for(const n of ['x.eyebrow001','x.eyelashes01','x.low-poly','x.teeth','something-else',''])assert.equal(k(n),null,n);
 assert.equal(k('district_smuggler.male_casualsuit01-tint'),'clothing','a creator-tinted copy keeps its kind');
});
test('surface quality: cloth is coated and grained, boots shinier than cloth, skin gets a sheen; a person keeps one accent colour',()=>{
 const q=F.quality;assert(q.clothing.coat>0&&q.clothing.grain>0);assert(q.footwear.coat>q.clothing.coat&&q.footwear.rough<q.clothing.rough);assert(q.skin.sheen>0&&!q.skin.coat);assert(q.light.glow>=1);
 assert.deepEqual(F.accentOf('crowd:hacker-01'),F.accentOf('crowd:hacker-01'));assert.equal(F.accentOf('crowd:hacker-01').length,3);
 assert.equal(F.config.quality,true);
});
