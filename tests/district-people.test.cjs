/* District residents and profile jobs (void-runner/district-people.js): the roster the V1 lists beside real players, and the jobs a profile can show. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const P=require('../void-runner/district-people.js'),Crowd=require('../void-runner/crowd.js'),D=require('../void-runner/device-v1.js');
test('jobs: David\'s list is there, ids are unique, and a profile holds one or two known jobs',()=>{
 const labels=P.JOBS.map(j=>j.label);for(const l of ['Smuggler','Pirate','Mercenary','Merchant','Influencer','Dancer','DJ','Mechanic'])assert(labels.includes(l),l);
 assert.equal(new Set(P.JOBS.map(j=>j.id)).size,P.JOBS.length);for(const j of P.JOBS)assert.match(j.id,/^[a-z-]{2,20}$/);
 assert.deepEqual(P.cleanJobs('smuggler,nonsense,dj,smuggler,pirate,mechanic'),['smuggler','dj']);assert.deepEqual(P.cleanJobs(null),[]);assert.deepEqual(P.cleanJobs({}),[]);
 assert.equal(P.jobsText(['dj','mechanic']),'DJ · Mechanic');
 let ids=[];for(const id of ['smuggler','pirate','dj','mechanic'])ids=P.toggleJob(ids,id);assert.deepEqual(ids,['smuggler','pirate'],'a third is refused');assert.deepEqual(P.toggleJob(ids,'pirate'),['smuggler']);
});
test('a player\'s jobs are kept in the save as one short string the save server accepts',()=>{
 const flags={};P.writeJobs(flags,['influencer','dancer']);assert.equal(flags.profileJobs,'influencer,dancer');assert(flags.profileJobs.length<=200);assert.deepEqual(P.readJobs(flags),['influencer','dancer']);
 P.writeJobs(flags,[]);assert(!('profileJobs' in flags));assert.deepEqual(P.readJobs({profileJobs:'<script>'}),[]);
});
test('the roster: Admin, Iris and the DJ are in it; every resident has a name, a known job and a place; ids are unique',()=>{
 assert.equal(new Set(P.NPCS.map(n=>n.id)).size,P.NPCS.length);
 for(const n of P.NPCS){assert(n.name&&n.name.length<=40,n.id);assert(n.jobs.length>=1&&n.jobs.every(j=>P.jobLabel(j)),n.id);assert(P.AREAS[n.area],n.id);assert(n.place&&n.bio,n.id);}
 assert.equal(P.npc('admin').name,'Admin');assert.equal(P.npc('iris').name,'Iris');assert.deepEqual(P.npcs('club').map(n=>n.jobs[0]),['dj']);assert(P.npcs('interior').length>=10);
 assert(P.NPCS.filter(n=>n.jobs.includes('influencer')).length>=3,'many residents are influencers');
});
test('every crew figure standing in the District interior is on the roster, and a named resident keeps one face with the clip their spot needs',()=>{
 const src=fs.readFileSync('void-runner/neochinatown.js','utf8'),interior=[...src.matchAll(/'(crew-(?:hall|bar|vr)[a-z0-9-]*)'/g)].map(m=>m[1]);
 assert(interior.length>=6);for(const id of new Set(interior))assert(P.NPCS.some(n=>n.crew===id),id+' has a name');
 globalThis.VoidDistrictPeople=P;try{for(const n of P.NPCS.filter(n=>/^crew-/.test(n.crew||''))){assert(Crowd.clips[n.look],n.id);for(let i=0;i<5;i++)assert.equal(Crowd.pick('neochinatown',n.crew),n.look,n.id);}}finally{delete globalThis.VoidDistrictPeople;}
 // Admin's and Iris's portraits use the same look the scene builds them with
 const A=require('../void-runner/character-appearance.js');for(const id of ['admin','iris']){const a=P.npc(id).appearance;assert(A.validate(a),id+' has a valid look');assert(src.includes("root.VoidDistrictPeople?.npc('"+id+"')?.appearance||"),id+': the scene draws the roster record');
  const lit=src.slice(src.indexOf("npc('"+id+"')?.appearance||")).match(/\|\|(\{[^}]*\})/)[1];assert.deepEqual(Function('return '+lit)(),a,id+': the fallback is the same look');}
});
test('a resident\'s profile: jobs under the name, a portrait from the real figure, and never a player action',()=>{
 const n=P.npc('rin-takeda'),p=D.profile('npc',{id:n.id,name:n.name,affiliation:P.jobsText(n.jobs),bio:n.bio,place:n.place,model:n.look});
 assert.equal(p.key,'npc:rin-takeda');assert.equal(p.subtitle,'Influencer');assert.equal(p.portrait.state,'ready');assert.deepEqual(p.portrait.source,{type:'model',model:'district-resident'});assert.deepEqual(p.actions.map(a=>a.id),['talk']);
 const a=P.npc('admin'),pa=D.profile('npc',{id:a.id,name:a.name,appearance:a.appearance});assert.equal(pa.portrait.source.type,'appearance');assert.equal(pa.portrait.source.resident,true);
 assert.equal(D.profile('npc',{id:'nyx-district',name:'Nyx'}).portrait.state,'unavailable','no model, no invented face');
 const me=D.profile('player',{handle:'Neon_Fox',publicId:'abc123',jobs:'Smuggler · Mechanic'});assert.equal(me.subtitle,'@Neon_Fox · Smuggler · Mechanic');
});
test('following: residents and handle players can be followed and unfollowed; it is one short string in the save; junk is ignored',()=>{
 const f={};assert.equal(P.toggleFollow(f,{kind:'npc',id:'iris'}),true);assert.equal(P.toggleFollow(f,{kind:'player',id:'abc123def4567890',name:'Neon_Fox'}),true);
 assert.equal(f.socialFollowing,'n:iris,p:abc123def456:Neon_Fox');assert.deepEqual(P.readFollowing(f).map(x=>x.name),['Iris','Neon_Fox']);assert(P.isFollowing(f,'n:iris')&&P.isFollowing(f,'p:abc123def456'));
 assert.equal(P.toggleFollow(f,{kind:'npc',id:'iris'}),false,'again = unfollow');assert.equal(f.socialFollowing,'p:abc123def456:Neon_Fox');
 assert.equal(P.toggleFollow(f,{kind:'npc',id:'nobody'}),false);assert.equal(P.toggleFollow(f,{kind:'player',id:'abc',name:'<b>'}),false);assert.equal(P.toggleFollow(f,{kind:'player',id:'abc',name:'Guest-1a2b'}),false,'a guest name is not a handle');
 assert.deepEqual(P.readFollowing({socialFollowing:'n:iris,n:iris,x:evil,n:ghost,p:zz:Bad'}).map(x=>x.key),['n:iris']);
 const g={};for(let i=0;i<40;i++)P.toggleFollow(g,{kind:'player',id:i.toString(16).padStart(12,'0'),name:'Player_'+i});assert(g.socialFollowing.length<=200);assert(P.isFollowing(g,'p:'+(39).toString(16).padStart(12,'0')),'the newest is kept');
 P.toggleFollow(f,{kind:'player',id:'abc123def456',name:'Neon_Fox'});assert(!('socialFollowing' in f));
});
