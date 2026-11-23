// Nomi/Se7en back-room duet: no invented words and no repeated greetings while inside.
const test=require('node:test'),assert=require('node:assert/strict');
const A=require('../void-runner/npc-advanced-interactions.js');
const lines={nomi:['Welcome to the back room.','Tea is on the way.'],se7en:['Hello, visitor.','Stay a little.']};
const input=(inside,now,extra={})=>({inside,now,present:true,blocked:false,lines,members:['nomi','se7en'],gapMs:1000,cooldownMs:10000,...extra});
test('a room entry produces Nomi, Se7en, Nomi, Se7en, never two lines in one tick',()=>{
 let state=null,spoken=[];for(const t of [1000,1100,6000,10000,15000,20000]){
  const r=A.roomDuoStep(state,input(true,t));state=r.state;if(r.line)spoken.push(r.line.speaker);
 }
 assert.deepEqual(spoken,['nomi','se7en','nomi','se7en']);
 const extra=A.roomDuoStep(state,input(true,40000));assert.equal(extra.line,null);
});
test('leaving cancels the pending lines; quick return respects the cooldown',()=>{
 let s=A.roomDuoStep(null,input(true,1000)).state;
 s=A.roomDuoStep(s,input(false,1100)).state;
 assert.deepEqual(s.queue,[]);
 const quickly=A.roomDuoStep(s,input(true,1500));assert.equal(quickly.line,null);
 const leave=A.roomDuoStep(quickly.state,input(false,2000));
 const later=A.roomDuoStep(leave.state,input(true,12000));assert.equal(later.line.speaker,'nomi');
});
test('absent actors or blocked conversations do not emit dialogue',()=>{
 let r=A.roomDuoStep(null,input(true,1000,{present:false}));assert.equal(r.line,null);
 r=A.roomDuoStep(null,input(true,1000,{blocked:true}));assert.equal(r.line,null);
 const next=A.roomDuoStep(r.state,input(true,8000));assert.equal(next.line.speaker,'nomi');
});
test('each player session has an independent dialogue order and state',()=>{
 const x=A.roomDuoStep(null,input(true,1000)),y=A.roomDuoStep(null,input(true,1000));
 assert.equal(x.line.speaker,'nomi');assert.equal(y.line.speaker,'nomi');
 const second=A.roomDuoStep(x.state,input(true,8000));assert.equal(second.line.speaker,'se7en');
 assert.equal(y.state.queue[0].speaker,'se7en');
});
