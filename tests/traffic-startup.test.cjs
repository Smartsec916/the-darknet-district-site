const test=require('node:test'),assert=require('node:assert/strict');
const Traffic=require('../void-runner/traffic.js'),Story=require('../void-runner/story.js'),Preparation=require('../void-runner/preparation.js');
function rng(seed){return()=>((seed=(seed*1664525+1013904223)>>>0)/2**32);}
test('seeded traffic includes empty areas, both crossings, varied distance and only neutral contacts',()=>{
 let empty=0,populated=0,left=false,right=false;const distances=new Set();
 for(let seed=1;seed<200;seed++){
  const area=Traffic.create(rng(seed*731));if(area.contacts.length)populated++;else empty++;
  for(const c of area.contacts){assert.equal(c.relationship,'neutral');left||=c.velocity.x<0;right||=c.velocity.x>0;distances.add(Math.round(c.z));}
  for(let i=0;i<700;i++)Traffic.step(area,.1,{x:3,y:0,z:2});
  assert.equal(area.contacts.length,0);
 }
 assert(empty>40&&populated>40&&left&&right&&distances.size>50);
 assert.equal(Traffic.create(()=>.9,true).contacts.length,0);
});
test('traffic subtracts player translation without steering or matching player velocity',()=>{
 const a=Traffic.create(rng(9000)),b=structuredClone(a);assert(a.contacts.length);
 const v={...a.contacts[0].velocity};Traffic.step(a,1,{x:100,y:20,z:40});Traffic.step(b,1);
 assert.deepEqual(a.contacts[0].velocity,v);
 for(const [axis,n]of Object.entries({x:100,y:20,z:40}))assert(Math.abs(b.contacts[0][axis]-a.contacts[0][axis]-n)<1e-8);
 a.contacts[0].age=a.contacts[0].lifetime;Traffic.step(a,.5);assert(a.contacts[0].warp>0);
});
test('relationships drive hostility and marker colors with old scripted allegiance compatibility',()=>{
 assert.equal(Story.contactColors.hostile,'#ff718a');assert.equal(Story.contactColors.neutral,'#bbc2cc');assert.equal(Story.contactColors.friendly,'#58ffe1');
 assert(!Story.hostile({relationship:'neutral',allegiance:'hostile'}));assert(!Story.hostile({allegiance:'friendly'}));assert(Story.hostile({relationship:'hostile'}));
});
test('phase deadlines abort late work and preserve useful failure metadata',async()=>{
 const old={...Preparation.limits};Preparation.limits.assets=15;
 try{await assert.rejects(Preparation.run(task=>task.wait('assets',()=>new Promise(r=>setTimeout(r,80)),'slow.png')),e=>e.phase==='assets'&&e.asset==='slow.png'&&e.elapsedMs>=10);assert.equal(Preparation.current,null);}
 finally{Object.assign(Preparation.limits,old);}
});
