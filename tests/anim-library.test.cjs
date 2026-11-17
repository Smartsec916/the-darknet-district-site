/* The shared animation library's catalogue (the owner, 16 Nov 2026). */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const L=require('../void-runner/anim-library.js');
test('fourteen ActorCore clips, each with a title, a category and a length',()=>{
 const all=L.all();assert.equal(all.length,14);assert.equal(new Set(all.map(c=>c.id)).size,14);
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
});
test('the licensed files are not in the public repository; the code and the page are',()=>{
 assert.equal(fs.existsSync('void-runner/assets/models/anim/anim-actorcore.glb'),false);
 const tracked=require('node:child_process').execSync('git ls-files void-runner/assets/models/anim',{encoding:'utf8'}).trim();assert.equal(tracked,'','no library file is committed');
 const h=fs.readFileSync('void-runner.html','utf8');assert.ok(h.includes('void-runner/anim-library.js'));assert.equal(fs.readFileSync('static/void-runner.html','utf8'),h);
 assert.ok(fs.readFileSync('void-runner/vr-suite.js','utf8').includes('VoidAnimLibrary?.apply'));
});
