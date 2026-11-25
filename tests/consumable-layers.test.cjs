const test=require('node:test'),assert=require('node:assert/strict');
const R=require('../void-runner/consumables.js'),renderer=require('../void-runner/consumable-renderer.js');
test('gameplay and preview sample onset, sustain, recovery and expiry from the saved start time',()=>{
 const e={...R.newEffect('wavyVision'),delay:2,duration:10,fadeIn:2,fadeOut:4,intensity:1};
 assert.deepEqual([1,2,3,4,8,10,12,13].map(t=>renderer.envelope(e,t)),[0,0,.5,1,1,.5,0,0]);
 const def={effects:[e],modifiers:[{stat:'walkSpeed',amount:.2,delay:3,duration:3}]};
 const loaded=JSON.parse(JSON.stringify([{startedAt:100,definition:def}]));
 assert.deepEqual(renderer.sample(loaded,104).modifiers,{walkSpeed:.2});assert.deepEqual(renderer.sample(loaded,112).modifiers,{});
});
test('reduced motion and distortion suppress camera displacement and animated warps',()=>{
 const effects=['doubleVision','cameraMotion','wavyVision','motionTrails'].map(t=>({...R.newEffect(t),duration:30,fadeIn:0,fadeOut:0}));
 const f=renderer.sample([{startedAt:0,definition:{effects}}],3);
 const on=renderer.uniforms(f,{motion:true,distortion:true,flashing:true}),off=renderer.uniforms(f,{motion:false,distortion:false,flashing:false});
 assert.ok(on.ghost[2]>0&&on.trail>0&&on.wave[0]>0);assert.equal(off.ghost[2],0);assert.equal(off.trail,0);assert.equal(off.wave[0],0);assert.ok(off.motion.every(n=>n===0));assert.equal(off.fov,0);
});
