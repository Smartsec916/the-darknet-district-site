// #495: regression coverage for the group/follow primitives already on main.
// This is a simulated two-session contract, not a browser/network multiplayer test.
const test=require('node:test');
const assert=require('node:assert/strict');
const A=require('../void-runner/npc-advanced-interactions.js');
const members=['iris','admin'];
const lines={iris:['A1','A2'],admin:['B1','B2']};
function session(clock){
 const coordinator=A.createDialogueCoordinator(clock),index={};
 return {coordinator,index,step:(near=members,id='store')=>A.groupStep(coordinator,{
  id,members,order:'alternate',cooldownMs:5000,lines,index,near
 })};
}
test('two player sessions retain separate turns, authored line positions and cooldowns',()=>{
 let now=1000;const a=session(()=>now),b=session(()=>now);
 assert.equal(a.step().line,'A1');
 assert.equal(b.step().line,'A1');
 now=5999;assert.equal(a.step().line,null);assert.deepEqual(a.index,{iris:1});
 now=6000;assert.equal(a.step().line,'B1');
 assert.deepEqual(b.index,{iris:1});
 now=11000;assert.equal(a.step().line,'A2');assert.equal(b.step().line,'B1');
 assert.deepEqual(a.index,{iris:2,admin:1});assert.deepEqual(b.index,{iris:1,admin:1});
});
test('loss of nearby participants never advances the group or consumes its next line',()=>{
 let now=0;const a=session(()=>now);assert.equal(a.step().line,'A1');
 now=5000;assert.equal(a.step(['iris']).line,null);assert.equal(a.step([]).line,null);
 assert.deepEqual(a.index,{iris:1});assert.equal(a.step().line,'B1');
});
test('a group lock cannot release another group or survive an explicit session reset',()=>{
 let now=0;const c=A.createDialogueCoordinator(()=>now);
 const old=c.acquire('store','iris',members,0,true);
 const other=c.acquire('other','iris',members,0,true);
 assert.ok(old);assert.ok(other);assert.equal(c.busy('other'),true);
 assert.equal(c.release(old,members),true);assert.equal(c.busy('other'),true);
 c.clear();assert.equal(c.busy('other'),false);
 const fresh=c.acquire('other','iris',members,0,true);assert.ok(fresh);
 assert.equal(c.release(other,members),false);assert.equal(c.busy('other'),true);
 assert.equal(c.release(fresh,members),true);
});
test('two independent follower invitations cannot share timeout or accepted state',()=>{
 let a=A.followStep(undefined,{dt:3,maxWait:5});
 let b=A.followStep(undefined,{accepted:true,near:true,maxWait:5});
 assert.equal(a.phase,'invite');assert.equal(b.phase,'lead');
 a=A.followStep(a,{dt:2,maxWait:5});assert.equal(a.phase,'return');
 b=A.followStep(b,{near:false,dt:1,maxWait:5});assert.equal(b.phase,'wait');
 b=A.followStep(b,{near:true,maxWait:5});assert.equal(b.phase,'lead');
 assert.equal(A.followStep(b,{atDestination:true,playerArrived:false,dt:1,maxWait:5}).phase,'wait');
 assert.equal(A.followStep(b,{atDestination:true,playerArrived:true,maxWait:5}).phase,'done');
 assert.equal(a.phase,'return');
});
