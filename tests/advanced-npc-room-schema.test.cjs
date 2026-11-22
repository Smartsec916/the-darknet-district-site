const test=require('node:test'),assert=require('node:assert/strict');
const MC=require('../void-runner/mission-content.js');
const fixtures=require('./fixtures/advanced-npc-room-schema.json');
test('room interaction fixtures match the server schema',()=>{
 for(const {name,record,valid} of fixtures)assert.equal(MC.interactionProblems({'tea-host':record}).length===0,valid,name);
});
test('configured rooms must be known to the current place registry',()=>{
 const places=new Set(['under-tea-room']);const record={distance:3,cooldown:60,advanced:{room:{id:'under-tea-room',cooldown:30,enter:'Welcome'}}};
 assert.deepEqual(MC.interactionProblems({'tea-host':record},null,places),[]);
 assert.equal(MC.interactionProblems({'tea-host':{...record,advanced:{room:{...record.advanced.room,id:'unregistered-room'}}}},null,places).length,1);
});
test('room dialogue is preserved in drafts and matches exact audio words without changing basic audio filenames',()=>{
 const basic={near:'Hello',distance:3,cooldown:60};const advanced={...basic,advanced:{room:{id:'tea-room',cooldown:30,enter:'Hello\nCome in',exit:'Goodbye',longVisit:'Have some tea',longSeconds:90}}};
 const content={format:MC.FORMAT,version:1,interactions:{'tea-host':advanced}};
 assert.deepEqual(MC.fromDrafts({local:content}).interactions,content.interactions);
 assert.equal(MC.interactionRows('tea-host',advanced)[0].file,MC.interactionRows('tea-host',basic)[0].file);
 assert.deepEqual(MC.interactionRows('tea-host',advanced).map(r=>[r.pool,r.text]),[['near','Hello'],['room.enter','Come in'],['room.exit','Goodbye'],['room.longVisit','Have some tea']]);
 const clip={who:'tea-host',text:'Come in',hash:'a'.repeat(64),type:'audio/mpeg',duration:1,bytes:100};
 assert.equal(MC.interactionProblems({'tea-host':{...advanced,clips:[clip]}}).length,0);
 assert.equal(MC.interactionProblems({'tea-host':{...advanced,clips:[{...clip,text:'Unrelated'}]}}).length,1);
});
