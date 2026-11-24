/* The shared animation library's catalogue (the owner, 16 Nov 2026). */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const L=require('../void-runner/anim-library.js');
test('fourteen ActorCore clips, each with a title, a category and a length',()=>{
 const all=L.all().filter(c=>c.library==='actorcore');assert.equal(L.clip('meshy-run').category,'locomotion');assert.equal(all.length,14);assert.equal(new Set(all.map(c=>c.id)).size,14);
 for(const c of all){assert.match(c.id,/^ac-[a-z0-9-]+$/);assert.ok(c.title&&c.category&&c.seconds>5,c.id);assert.ok(['inplace','free'].includes(c.root));}
 assert.equal(L.byCategory('dance').length,2);assert.equal(L.byCategory('floor').length,3);assert.equal(L.clip('ac-sit-bench-1').needs,'seat');assert.equal(L.clip('nope'),null);
});
test('group sequences say which seats have no recording, so mismatched parts are never forced together',()=>{
 const g=Object.fromEntries(L.groups().map(x=>[x.name,x]));
 assert.deepEqual(g['3sit-g1'].missing,[2,3]);assert.deepEqual(g['3sit-g2'].missing,[1]);assert.deepEqual(g['cuddle-kiss'].missing,[2]);assert.deepEqual(g['sit-cuddle-hug'].missing,[2]);
 for(const x of Object.values(g))for(const p of x.parts)assert.equal(p.group,x.name);
});
test('a figure takes the library only if it has the bones; names are matched after the last colon',()=>{
 assert.equal(L.bare('look-mixamorig:LeftArm'),'LeftArm');assert.equal(L.compatible(L.CORE),true);assert.equal(L.compatible(L.CORE.filter(b=>b!=='LeftFoot')),false);assert.equal(L.compatible(null),false);
 // same bone names are not enough: the rests must match (Dex's base rig names its bones mixamorig:* but every limb rests on other local axes, 18 Nov 2026)
 {const lib={Hips:[0,.02,0,1],LeftArm:[0,-.25,0,.97],LeftUpLeg:[.06,0,-1,0]},makehuman={Hips:[0,.02,0,1],LeftArm:[0,-.24,0,.97],LeftUpLeg:[.06,0,-1,0]},dex={Hips:[-.01,.71,-.01,.71],LeftArm:[.46,.09,.13,.88],LeftUpLeg:[1,0,0,.08]};
  assert.ok(L.restMatches(lib,makehuman),'a MakeHuman figure takes the clips');assert.equal(L.restMatches(lib,dex),false,'Dex keeps his own clips');assert.ok(L.restOffset(lib,dex)>60);assert.ok(L.restOffset(lib,{})===0,'no shared bones: nothing to compare');}
});
test('the licensed files are not in the public repository; the code and the page are',()=>{
 assert.equal(fs.existsSync('void-runner/assets/models/anim/anim-actorcore.glb'),false);
 const tracked=require('node:child_process').execSync('git ls-files void-runner/assets/models/anim',{encoding:'utf8'}).trim();assert.equal(tracked,'','no library file is committed');
 const h=fs.readFileSync('void-runner.html','utf8');assert.ok(h.includes('void-runner/anim-library.js'));assert.equal(fs.readFileSync('static/void-runner.html','utf8'),h);
 assert.ok(fs.readFileSync('void-runner/vr-suite.js','utf8').includes('VoidAnimLibrary?.apply'));
});
