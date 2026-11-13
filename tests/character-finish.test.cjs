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
