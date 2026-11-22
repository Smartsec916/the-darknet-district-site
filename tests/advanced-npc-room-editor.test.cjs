const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../void-runner/npc-editor.js'),'utf8');
test('advanced room controls are optional and save the existing interaction record with exact audio matching',()=>{
 assert.match(source,/roomRead=advancedRoomBox\(box,r\)/);assert.match(source,/if\(room\)v\.advanced=\{room\}/);assert.match(source,/!v\.near&&!v\.talk&&!v\.advanced/);assert.match(source,/interactionRows\(e\.id,v\).*x\.text===c\.text/);
 assert.match(source,/put\('','Disabled'\)/);assert.match(source,/P\?\.options\?\.\(\)/);for(const k of ['enter','exit','shortVisit','longVisit','longSeconds','cooldown'])assert.ok(source.includes(k));
});
