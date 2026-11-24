const test=require('node:test'),assert=require('node:assert/strict');
const {plan}=require('../void-runner/npc-voice-batch.js');
const sample={about:'Friendly adult',personality:{initiative:.5},dialogue:{
 greet:['Hello there','Welcome back','Hello there'],
 chat:['How was your trip?']}};
const voice={kind:'elevenlabs',voiceId:'ABCDEFGHIJKLMNOPQRST',model:'eleven_multilingual_v2'};
test('only unique missing dialogue is queued, and costs are estimated',()=>{
 const result=plan(sample,{id:'desire',voice,recordings:[{text:'Hello there',voiceId:'ABCDEFGHIJKLMNOPQRST'}]});
 assert.equal(result.total,3);
 assert.equal(result.existing,1);
 assert.equal(result.missing,2);
 assert.deepEqual(result.jobs.map(j=>j.text),['Welcome back','How was your trip?']);
 assert.equal(result.canGenerate,true);
 assert.equal(result.requiresExplicitConfirmation,true);
 assert.ok(result.estimate.chars>0);
});
test('edited text becomes missing while unchanged recordings are retained',()=>{
 const result=plan(sample,{id:'desire',voice,recordings:[{text:'Old line'},{text:'Hello there'}]});
 assert.equal(result.missing,2);
});
test('changing the selected voice preserves every recording of unchanged text',()=>{
 const a=plan(sample,{id:'desire',voice,recordings:[{text:'Hello there',voiceId:'ZYXWVUTSRQPONMLKJIHG'}]});
 assert.equal(a.missing,2);
 const b=plan(sample,{id:'desire',voice,recordings:[{text:'Hello there'}]});
 assert.equal(b.missing,2);
});
test('without a selected ElevenLabs voice planner does not authorize generation',()=>{
 const a=plan(sample,{id:'desire'});
 assert.equal(a.canGenerate,false);
 assert.equal(a.missing,3);
});
test('bad JSON or invalid identity is rejected before any generation',()=>{
 assert.throws(()=>plan({...sample,personality:{initiative:2}},{id:'desire'}),/Invalid behavior setting/);
 assert.throws(()=>plan(sample,{id:'bad id'}),/Invalid NPC ID/);
});
