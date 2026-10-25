const test=require('node:test'),assert=require('node:assert/strict');
const W=require('../void-runner/warp.js'),S=require('../void-runner/sensors.js'),P=require('../void-runner/enemy-pilots.js');
const basis={f:{x:0,y:0,z:1},r:{x:1,y:0,z:0},u:{x:0,y:-1,z:0}};
const length=p=>Math.hypot(p.x,p.y,p.z);

test('an interdiction wave starts far away, on radar and out of enemy weapons range',()=>{
 for(const count of [1,3,5,8]){
  const points=Array.from({length:count},(_,i)=>W.interdictionPoint(i,count,basis));
  for(const p of points){
   assert.ok(Math.abs(length(p)-W.config.interdictionRange)<1e-9,'every ship starts at the interdiction range');
   assert.ok(length(p)<S.profiles.standard.range,'inside radar range');
   assert.ok(length(p)>165,'outside enemy firing range');
   assert.ok(p.z>0,'ahead of the player');
  }
  const keys=new Set(points.map(p=>p.x.toFixed(3)+','+p.y.toFixed(3)));assert.equal(keys.size,count,'ships are fanned out, not stacked');
 }
});

test('interdiction placement follows the player basis and wraps reinforcements onto the same arc',()=>{
 const turned={f:{x:1,y:0,z:0},r:{x:0,y:0,z:-1},u:{x:0,y:-1,z:0}};
 const p=W.interdictionPoint(0,1,turned);assert.ok(Math.abs(p.x-W.config.interdictionRange)<1e-9);assert.ok(Math.abs(p.z)<1e-9);
 assert.deepEqual(W.interdictionPoint(5,5,basis),W.interdictionPoint(0,5,basis));
});

test('a raider placed at interdiction range closes on a player whose radar is on',()=>{
 const e={...W.interdictionPoint(0,3,basis),armor:3,maxArmor:3,age:0};e.velocity={x:-e.x,y:-e.y,z:-e.z};P.init(e,'rookie',0);
 const player=S.create();// radar on, engines idle: the quietest the player is with radar running
 assert.ok(length(e)<S.detectableAt(player.signature),'raiders can see the player from where they start');
 const start=length(e);
 for(let t=0;t<5;t+=.1){P.step(e,.1,{detected:length(e)<S.detectableAt(player.signature),velocity:{x:0,y:0,z:0},forward:basis.f,right:basis.r});e.age+=.1;for(const a of ['x','y','z'])e[a]+=e.velocity[a]*.1;}
 assert.ok(length(e)<start-60,'closed at least 60 units in five seconds');
});
