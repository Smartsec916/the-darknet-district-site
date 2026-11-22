const test=require('node:test'),assert=require('node:assert/strict');
const A=require('../void-runner/npc-advanced-interactions.js');
test('group conversations serialize speakers, alternate turns, and respect cooldown and session isolation',()=>{
 let now=0;const a=A.createDialogueCoordinator(()=>now),b=A.createDialogueCoordinator(()=>now),m=['iris','admin'];
 assert.equal(a.acquire('store','admin',m,0,true),null);
 const first=a.acquire('store','iris',m,100,true);assert.ok(first);assert.equal(a.acquire('store','admin',m),null);
 assert.ok(b.acquire('store','iris',m),'a separate player is not locked out');
 assert.equal(a.release({...first},m),false,'stale or copied token cannot release a speaker');assert.equal(a.release(first,m),true);
 assert.equal(a.acquire('store','admin',m,100,true),null);now=100;
 const second=a.acquire('store','admin',m,100,true);assert.ok(second);assert.equal(a.release(second,m),true);now=200;
 assert.ok(a.acquire('store','iris',m,100,true));a.clear();assert.equal(a.busy('store'),false);
});
test('visit tracks entry, duration, and a single exit; separate trackers do not share state',()=>{
 let a=A.roomVisit(null,true,100);assert.equal(a.event,'enter');assert.equal(a.duration,0);
 let t=A.roomVisit(a.state,true,350);assert.equal(t.event,null);assert.equal(t.duration,250);
 let b=A.roomVisit(null,true,300);assert.equal(b.event,'enter');
 t=A.roomVisit(t.state,false,500);assert.equal(t.event,'exit');assert.equal(t.duration,400);
 assert.equal(A.roomVisit(t.state,false,600).event,null);assert.equal(A.roomVisit(b.state,true,600).duration,300);
});
test('follow invitation can time out, wait for a player, finish only together, or return on cancellation',()=>{
 const step=A.followStep;let p=step(undefined,{dt:2,maxWait:5});assert.equal(p.phase,'invite');
 assert.equal(step(p,{dt:3,maxWait:5}).phase,'return');
 p=step(p,{accepted:true,near:true});assert.equal(p.phase,'lead');
 p=step(p,{dt:2,near:false,maxWait:5});assert.equal(p.phase,'wait');assert.equal(p.waited,2);
 p=step(p,{near:true});assert.equal(p.phase,'lead');assert.equal(p.waited,0);
 assert.equal(step(p,{atDestination:true,playerArrived:false,dt:1}).phase,'wait');assert.equal(step(p,{atDestination:true,playerArrived:true}).phase,'done');
 assert.equal(step(p,{declined:true}).phase,'return');
});
