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

test('profile achievements: real-money ones first, then the hardest; three shown; most recent, difficulty and type orders',()=>{
 const t=d=>Date.parse(d+'T12:00:00Z'),held=[{id:'district-first-visit',at:t('2026-01-01')},{id:'official-shirt',at:t('2026-02-01')},{id:'arcade-top-blackout-protocol',at:t('2026-03-01')},{id:'rook-three-runs',at:t('2026-11-01')},{id:'tropical-100-fish',at:t('2026-04-01')},{id:'nope',at:1},{id:'rook-three-runs',at:5}];
 const ids=s=>A.profileList(held,s).map(a=>a.id);
 assert.deepEqual(ids('featured'),['official-shirt','arcade-top-blackout-protocol','tropical-100-fish','rook-three-runs','district-first-visit'],'bought with real money first, then hardest first; unknown and repeated ones dropped');
 assert.deepEqual(ids(),ids('featured'));assert.equal(A.SHOWN,3);
 assert.deepEqual(ids('recent').slice(0,2),['rook-three-runs','tropical-100-fish']);assert.equal(ids('difficulty')[0],'arcade-top-blackout-protocol');
 assert.deepEqual(ids('type').map(id=>A.definitions.find(d=>d.id===id).category),['merchandise','district','district','arcade','arcade']);
 assert.deepEqual(A.SORTS.map(s=>s[1]),['Featured','Most recent','Difficulty','Type']);assert.deepEqual(A.profileList(null),[]);
 for(const d of A.definitions){assert.ok(d.difficulty>=1&&d.difficulty<=5,d.id);assert.equal(typeof d.paid,'boolean');assert.ok(A.DIFFICULTY[d.difficulty]);}
});
test('every playable arcade game has a "Make Highest Score" achievement, and Dax holds them all plus three cargo runs for Rook',()=>{
 const {GAMES}=require('../void-runner/district-arcade.js'),DP=require('../void-runner/district-people.js');
 for(const g of Object.keys(GAMES)){const d=A.definitions.find(x=>x.id==='arcade-top-'+g);assert.ok(d,g);assert.match(d.name,/^Make Highest Score in /);assert.equal(d.condition.equals,g);assert.equal(d.difficulty,5);}
 const dax=DP.achievementsOf('dax').map(a=>a.id).sort();assert.deepEqual(dax,[...Object.keys(GAMES).map(g=>'arcade-top-'+g),'rook-three-runs'].sort());
 for(const n of DP.NPCS)for(const a of DP.achievementsOf(n.id)){assert.ok(A.definitions.some(d=>d.id===a.id),n.id+' '+a.id);assert.ok(a.at>0,n.id+' has a date');}
 const others=DP.NPCS.filter(n=>n.id!=='dax'&&DP.achievementsOf(n.id).length);assert.ok(others.length>=8,'some residents have achievements');
 assert.ok(others.every(n=>A.profileList(DP.achievementsOf(n.id)).every(a=>a.difficulty<=3)),'and theirs are the easier ones');assert.deepEqual(DP.achievementsOf('nobody'),[]);
});

test('difficulty is shown as stars, and Admin is a Merchant and a Mercenary',()=>{
 assert.equal(A.stars(1),'★☆☆☆☆');assert.equal(A.stars(5),'★★★★★');assert.equal(A.stars(9),'★★★★★');assert.equal(A.stars(0),'★☆☆☆☆');
 const js=require('node:fs').readFileSync('void-runner/personal-device.js','utf8');assert.match(js,/A\.stars\(a\.difficulty\)/);assert.doesNotMatch(js,/A\.DIFFICULTY\[a\.difficulty\]/,'the word is no longer shown');
 const DP=require('../void-runner/district-people.js');assert.equal(DP.jobsText(DP.npc('admin').jobs),'Merchant · Mercenary');
});
