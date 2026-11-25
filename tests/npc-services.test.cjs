const test=require('node:test'),assert=require('node:assert/strict'),S=require('../void-runner/npc-services.js');
test('service stages use the saved clock and expire after confirmation grace',()=>{
 const s={started:10,end:18,expires:25,definition:{steps:[{seconds:3,line:'First'},{seconds:5,line:'Second'}]}};
 assert.equal(S.stage(s,9),null);assert.equal(S.stage(s,10).step.line,'First');assert.equal(S.stage(s,13).step.line,'Second');assert.equal(S.stage(s,18).step,null);assert.equal(S.stage(s,25),null);
});
test('only enabled NPC vendors gain an extra choice',()=>{
 S.index({vendors:[{id:'npc-guide',entity:'npc-guide',kind:'npc',entries:[{available:true}]},{id:'npc-other',entity:'npc-other',kind:'npc',enabled:false,entries:[{available:true}]}]});
 assert.ok(S.has(['guide']));assert.ok(!S.has(['other']));assert.ok(!S.has(['unrelated']));
});
