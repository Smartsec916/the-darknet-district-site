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

test('authoring curves modulate real gameplay and post processing on the same clock',()=>{
 const e=R.newEffect('lensGrade');Object.assign(e,{intensity:1,duration:10,fadeIn:0,fadeOut:0,curve:{mode:'linear',points:[[0,0],[.5,1],[1,0]]}});
 const m={stat:'runSpeed',amount:.2,delay:0,duration:10,curve:e.curve};
 const rows=[{startedAt:100,definition:{effects:[e],modifiers:[m]}}];
 for(const [mode,weight] of [['linear',.25],['smooth',.15625],['step',0]]){
  e.curve.mode=mode;
  const frame=renderer.sample(rows,101.25);
  assert.equal(frame.modifiers.runSpeed||0,.2*weight);assert.equal(frame.effects.get('lensGrade')?.[0].weight||0,weight);
 }
 assert.deepEqual(renderer.sample(rows,110).modifiers,{});
 for(const points of [[[0,1],[0,0]],[[.1,0],[1,1]],[[0,2],[1,1]]]){
  assert.ok(R.modifierProblems({...m,curve:{mode:'linear',points}},'test').length);
 }
});

test('accessibility, recovery, and signed-in sound expiration use the active time window',()=>{
 const e=R.newEffect('signalGlitch');Object.assign(e,{delay:0,fadeIn:0,fadeOut:0,duration:10});
 const active=[{startedAt:0,definition:{effects:[e],modifiers:[]}}],frame=renderer.sample(active,2);
 assert.ok(renderer.uniforms(frame,{motion:true,distortion:true,flashing:true}).screen[3]>0);
 assert.equal(renderer.uniforms(frame,{motion:true,distortion:true,flashing:false}).screen[3],0);
 assert.equal(renderer.recoveryRate(100,.04,.01,0),3);assert.equal(renderer.staminaAfter(.5,true,0,.25,1),.4);
 require('../void-runner/consumable-audio.js');
 const events=[];const cues=global.VoidConsumableAudio.cues((path,loop)=>{events.push([path,loop]);return {pause(){events.push('stop');}};});
 const dose={item:'tea',startedAt:8,until:12,definition:{loopSound:'loop',expireSound:'end'}};
 cues.tick([dose],10);cues.tick([dose],11);cues.tick([dose],12);cues.tick([],13);
 assert.deepEqual(events,[['loop',true],'stop',['end',false]]);
});

test('all visual tracks retain their authored strength through the shared runtime sampler',()=>{
 const schema=require('../void-runner/consumable-spec.js');
 for(const [type,config] of Object.entries(schema.effects)){
  if(config.group==='audio')continue;
  const effect={...R.newEffect(type),duration:10,fadeIn:0,fadeOut:0};
  const active=[{startedAt:0,definition:{effects:[effect]}}];
  for(const strength of [0,.25,.5,1,2,3]){
   effect.intensity=strength;
   assert.deepEqual(R.effectProblems(effect,type),[]);
   assert.equal(renderer.sample(active,5).effects.get(type)?.[0].weight??0,strength,type);
  }
  assert.equal(renderer.sample(active,10).effects.size,0,type);
 }
});
