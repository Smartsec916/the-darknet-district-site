/* Footsteps placed by ear (void-runner/footsteps.js): who is heard, how often, how loud. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const F=require('../void-runner/footsteps.js');
test('standing is silent; walking steps; running steps faster and louder',()=>{
 assert.equal(F.gait(0),null);assert.equal(F.gait(.2),null);const w=F.gait(1.5),r=F.gait(6.4);assert(w&&r);assert.equal(w.run,false);assert.equal(r.run,true);
 assert(r.gain>w.gain*1.5,'running is clearly louder');assert(r.every<w.every,'and quicker');assert(F.gait(3.9).run===false&&F.gait(6.4).run===true,'the game\'s own walk and run speeds fall on the right sides');
});
test('only people who are moving and near are voiced: the nearest few, never the whole street',()=>{
 const list=[];for(let i=0;i<30;i++)list.push({id:i,dist:2+i,speed:i%2?1.4:0});
 const a=F.audible(list);assert(a.length<=F.config.maxVoices);assert(a.every(m=>m.speed>0&&m.dist<=F.config.range));assert.deepEqual(a.map(m=>m.dist),a.map(m=>m.dist).slice().sort((x,y)=>x-y));
 assert.deepEqual(F.audible([{id:1,dist:50,speed:6}]),[],'too far to hear');assert.deepEqual(F.audible([]),[]);
});
test('it plays on the effects channel through a panner at the figure, and the game page loads it',()=>{
 const src=fs.readFileSync('void-runner/footsteps.js','utf8');assert.match(src,/bus\?\.\('effects'\)/);assert.match(src,/createPanner\(\)/);assert.match(src,/distanceModel='inverse'/);assert.doesNotMatch(src,/fetch\(|new Audio\(/,'no audio file and no network');
 assert(fs.readFileSync('void-runner.html','utf8').includes('void-runner/footsteps.js'));assert.match(fs.readFileSync('void-runner/babylon-integration.js','utf8'),/moving\.run \? \.017 : \.009/);
});
