const test=require('node:test'),assert=require('node:assert/strict');
const {TeaRoom,valid}=require('../tools/district-hub/tea-room.cjs');
test('only the current bedroom guest directs the pair, and departure clears the activity',()=>{
 const messages=[],room=new TeaRoom((conn,m)=>messages.push([conn,m]),()=>1000);
 const pose={t:'tea-pose',line:'nomi-greet-1',seated:true,activity:'sit',actors:[[-12,-102,1,'sit'],[-13,-102,1,'sit']]};
 assert.ok(valid(pose));assert.equal(valid({...pose,actors:[[0,0,0,'sit'],pose.actors[1]]}),false);
 const first={placed:true,x:1988,z:-103,room:'neochinatown-street',id:'a',conn:'a'};
 const second={...first,id:'b',conn:'b'},outside={...first,id:'c',conn:'c',x:12};
 room.update(first);room.update(second);room.update(outside);
 room.publish(second,pose);assert.equal(room.snapshot,null);
 room.publish(first,pose);assert.equal(messages.at(-1)[1].state.line,'nomi-greet-1');
 assert.equal(messages.at(-1)[0],'b');assert.equal(messages.some(([id])=>id==='c'),false);
 first.x=1992;room.update(first);
 assert.equal(room.owner,second);assert.equal(room.snapshot,null);
});
