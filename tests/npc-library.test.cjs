'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const library=require('../void-runner/npc-library.js');

test('renames consider reserved names, Unicode case and truncated suffixes',()=>{
 assert.equal(library.availableName('ＮＯＭＩ',['Nomi','ＮＯＭＩ 2']),'ＮＯＭＩ 3');
 assert.equal(library.availableName('Neon Vale',['neon vale'],9),'Neon Va 2');
});
test('reference checks cover keys, mission steps and placements without substring matches',()=>{
 const ids=new Set(['imp-42','import:imp-42']);
 for(const data of [{npcs:{'import:imp-42':{}}},{missions:[{giver:'imp-42'}]}])assert.ok(library.referenced(data,ids));
 assert.equal(library.referenced({name:'imp-420'},ids),false);
});
test('similarity evidence keeps texture, geometry and byte identity distinct',()=>{
 const a={sha256:'a',shape:'19 joints',images:'tex',positions:'one'};
 assert.equal(library.match(a,{...a}),'Identical model bytes');
 assert.match(library.match(a,{...a,sha256:'b'}),/position buffers/);
 assert.match(library.match(a,{...a,sha256:'b',positions:'two'}),/texture files/);
 assert.match(library.match(a,{...a,sha256:'b',positions:'two',images:'other'}),/counts/);
 assert.equal(library.match(a,null),'');
});
