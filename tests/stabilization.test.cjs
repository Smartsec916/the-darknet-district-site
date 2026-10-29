const test=require('node:test'),assert=require('node:assert/strict');
const Timing=require('../void-runner/frame-timing.js'),Effects=require('../void-runner/simulation-effects.js');
const N=require('../void-runner/ncz-nightlife.js'),Assets=require('../void-runner/asset-pipeline.js');

test('frame timing measures presented intervals, not a clamped simulation delta or engine FPS',()=>{
 const m=Timing.create();for(let t=0;t<7000;t+=1000/30)m.sample(t);
 assert(m.stats.ready);assert(Math.abs(m.stats.fps-30)<.1);assert.equal(m.stats.samples,90);
 for(let t=7000;t<14000;t+=1000/60)m.sample(t);
 assert(Math.abs(m.stats.fps-60)<1);assert(m.stats.samples<=90);
});
test('frame timing resets on pauses and long gaps instead of treating loading as sustained slowdown',()=>{
 const m=Timing.create();for(let t=0;t<4000;t+=16.67)m.sample(t);assert(m.stats.ready);
 m.sample(4000,false);assert(!m.stats.ready);m.sample(20000);m.sample(31000);assert.equal(m.stats.samples,0);
 m.sample(31016);assert.equal(m.stats.samples,1);assert(!m.stats.ready);
});
test('crowd budget warms up, reduces under sustained slowdown, and keeps a density floor',()=>{
 const b=N.createBudget(50);for(let i=0;i<20;i++)b.step(.1,{ready:false,fps:20});assert.equal(b.value,50);
 for(let i=0;i<20;i++)b.step(.1,{ready:true,fps:20});assert.equal(b.value,50);
 for(let i=0;i<400;i++)b.step(.1,{ready:true,fps:25});assert.equal(b.value,20);
});
test('crowd budget has hysteresis and recovers more gradually than it sheds load',()=>{
 const b=N.createBudget(50,{...N.config.fps,warmup:0});b.step(.1,{ready:true,fps:20});assert.equal(b.value,46);
 for(let i=0;i<100;i++)b.step(.1,{ready:true,fps:50});assert.equal(b.value,46);
 for(let i=0;i<21;i++)b.step(.1,{ready:true,fps:60});assert.equal(b.value,48);
 for(let i=0;i<25;i++)b.step(.1,{ready:true,fps:60});assert.equal(b.value,50);
});
test('simulation effects do not call campaign actions, while ordinary campaign actions still run',()=>{
 const e=Effects.create(),campaign={credits:100,progression:{flags:{},personal:{ammo:10}},story:{flags:{},events:[]}};
 let called=0;assert.equal(e.effect('mark',()=>++called),1);const s=e.begin(campaign);
 assert.equal(e.effect('jump',()=>++called),false);assert.equal(called,1);
 s.state.progression.flags.jump=true;s.state.progression.personal.ammo=0;s.state.credits=0;s.state.story.flags.changed=true;s.state.story.events.push('reward');
 assert.equal(campaign.credits,100);assert.deepEqual(campaign.progression.flags,{});assert.equal(campaign.progression.personal.ammo,10);assert.deepEqual(campaign.story,{flags:{},events:[]});
 assert.equal(e.end(),campaign);assert(!e.active);assert.equal(e.effect('mark',()=>++called),2);
});
test('each simulation gets a fresh state and its own progress; nested sessions cannot steal the owner',()=>{
 const e=Effects.create(),campaign={inventory:['pistol']};const first=e.begin(campaign);first.progress.score=10;first.state.inventory.push('loan');assert.throws(()=>e.begin(campaign),/already owns/);e.end();
 const next=e.begin(campaign);assert.deepEqual(next.state.inventory,['pistol']);assert.deepEqual(next.progress,{});assert.notEqual(first.state,next.state);e.end();
});
test('model clone ownership releases skeletons/bone textures and animations exactly once, never shared materials',()=>{
 let callback,skeletons=0,animations=0,materials=0;const owner={onDisposeObservable:{addOnce(fn){callback=fn;}}};
 const result={skeletons:[{dispose(){skeletons++;}}],animationGroups:[{stop(){},dispose(){animations++;}}],materials:[{dispose(){materials++;}}]};
 const dispose=Assets.ownInstance(result,owner);callback();dispose();assert.equal(skeletons,1);assert.equal(animations,1);assert.equal(materials,0);
});

test('optional crowd loading waits for first presentation, is counted while scheduled, and releases its observer',async()=>{
 let callback,removed=0;const scene={onAfterRenderObservable:{addOnce(fn){callback=fn;return fn;},remove(fn){assert.equal(fn,callback);removed++;}}};
 await Assets.prepare(scene,{'crowd:test':{src:'test.glb',background:true}});
 assert.equal(typeof callback,'function');assert.equal(Assets.pending,1);
 Assets.release();assert.equal(Assets.pending,0);assert.equal(removed,1);
});

test('sustained one-FPS active rendering remains measurable and reduces work in wall time',()=>{
 const m=Timing.create(),b=N.createBudget(21);for(let t=0;t<=40000;t+=1100){m.sample(t);b.step(Math.min(m.stats.interval/1000,2),m.stats);}
 assert(m.stats.ready);assert(Math.abs(m.stats.fps-1000/1100)<.01);assert.equal(b.value,9);
 m.sample(41000,false);assert(!m.stats.ready);assert.equal(m.stats.interval,0);
});
