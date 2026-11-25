const test=require('node:test'),assert=require('node:assert/strict');
const A=require('../void-runner/npc-advanced-interactions.js');
test('one group speaker takes the next turn and the listeners stay idle',()=>{
 const c=A.createDialogueCoordinator(()=>1000),index={};
 const step=near=>A.groupStep(c,{id:'pair',members:['grey-reverie','ethereal-lace'],order:'authored',cooldownMs:0,lines:{'grey-reverie':['After you'],'ethereal-lace':['Your turn']},index,near});
 const first=step(new Set(['grey-reverie','ethereal-lace']));
 assert.equal(first.speaker,'grey-reverie');assert.equal(first.line,'After you');assert.equal(first.poses['ethereal-lace'],'idle');
 const second=step(new Set(['grey-reverie','ethereal-lace']));
 assert.equal(second.speaker,'ethereal-lace');assert.equal(second.line,'Your turn');
 assert.equal(step(new Set(['grey-reverie'])).line,null);
});
test('a follow invitation expires, restarts and never overlaps a declined offer',()=>{
 assert.equal(A.followInvite(null,{now:0,maxWait:10}).phase,'offer');
 assert.equal(A.followInvite({phase:'offer',at:0},{now:11000,maxWait:10}).phase,'return');
 assert.equal(A.followInvite({phase:'return',at:11000},{now:12000,maxWait:10}).phase,'offer');
 assert.equal(A.followInvite({phase:'offer',at:0,generation:1},{now:1000,accepted:true,maxWait:10}).phase,'active');
 assert.equal(A.followInvite({phase:'offer',at:0},{now:1000,declined:true,maxWait:10}).phase,'return');
});
test('separation pushes overlapping people apart and leaves a clear pair alone',()=>{
 const moved=A.separate({x:0,z:0},[{x:0.2,z:0}],1);
 assert.ok(Math.hypot(moved.x-0.2,moved.z)>0.99);
 assert.deepEqual(A.separate({x:0,z:0},[{x:3,z:0}],0.8),{x:0,z:0});
});
test('the walking runtime gives social follow to the existing escort mover and keeps it local',()=>{
 const fs=require('node:fs');
 const live=fs.readFileSync(require('node:path').join(__dirname,'../void-runner/live-content.js'),'utf8');
 const made=fs.readFileSync(require('node:path').join(__dirname,'../void-runner/npc-made.js'),'utf8');
 assert.match(live,/socialPlan\(id\)/);assert.match(live,/startsWith\('social:'\)/);assert.match(live,/groupTick\(\)/);assert.match(live,/social\.clear\(\)/);
 assert.match(made,/P\.social/);assert.match(made,/socialPose/);
 assert.doesNotMatch(live,/social:[^'\n]*FLAG|f\[E\.FLAG\]=.*social/);
});
