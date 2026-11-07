const test=require('node:test'),assert=require('node:assert/strict');
const A=require('../void-runner/achievements.js'),P=require('../void-runner/social-profiles.js');

test('achievement rules are reusable and previews ignore unverified events',()=>{
 assert.equal(new Set(A.definitions.map(d=>d.id)).size,A.definitions.length);
 assert(A.definitions.every(A.valid));
 const rook=A.definitions.find(d=>d.id==='rook-three-runs');
 const event={type:'cargo_mission_completed',data:{giver:'rook'}};
 assert.equal(A.preview(rook,[event,event,event]).progress,0);
 assert.deepEqual(A.preview(rook,[{...event,verified:true},{...event,verified:true}]),{id:rook.id,progress:2,target:3,unlocked:false});
 assert.equal(A.preview(rook,[{...event,verified:true},{...event,verified:true},{...event,verified:true}]).unlocked,true);
});
test('NPC and player profiles share fields but keep separate identity namespaces',()=>{
 const p=P.player('same','Guest'),n=P.npc('same','Admin');
 assert.equal(p.key,'player:same');assert.equal(n.key,'npc:same');
 for(const key of ['name','portrait','bio','achievements','stats','actions'])assert(Object.hasOwn(p,key)&&Object.hasOwn(n,key));
 assert(p.actions.includes('block'));assert(n.actions.includes('converse'));
});
test('public achievement display puts verified merchandise first and filters categories',()=>{
 const t=Date.now(),unlocks=A.definitions.map(d=>({id:d.id,verified:true,unlockedAt:t}));
 assert.equal(A.publicDisplay(A.definitions,unlocks)[0].category,'merchandise');
 assert(A.publicDisplay(A.definitions,unlocks,'arcade').every(d=>d.category==='arcade'));
 assert.equal(A.publicDisplay(A.definitions,unlocks.map(u=>({...u,verified:false}))).length,0);
});
