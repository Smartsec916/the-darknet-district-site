const {test}=require('node:test'),assert=require('node:assert/strict'),H=require('../void-runner/hud-math.js');
test('navigation reference signs, wrapping and bank including inversion',()=>{
 const v=H.read({yaw:-Math.PI/2,pitch:-Math.PI/6,roll:Math.PI,velocity:{x:3,y:4,z:0}});
 assert.equal(v.heading,270);assert(Math.abs(v.pitch-30)<1e-8);assert.equal(v.bank,180);assert.equal(v.speed,5);
 assert.equal(H.headingOffset(0,359),1);assert.equal(H.headingOffset(350,5),-15);
 assert(H.ladderOffset(10,0,400)>0);assert(H.ladderOffset(-10,0,400)<0);assert.equal(H.ladderOffset(20,20,400),0);
});
test('range and closure use relative position and both velocities',()=>{
 const f={yaw:0,pitch:0,roll:0,velocity:{x:0,y:0,z:20}},t={x:0,y:0,z:100,velocity:{x:0,y:0,z:5}};
 assert.equal(H.read(f,t).range,100);assert.equal(H.read(f,t).closing,15);t.velocity.z=30;assert.equal(H.read(f,t).closing,-10);assert.equal(H.read(f,null).range,0);
});
