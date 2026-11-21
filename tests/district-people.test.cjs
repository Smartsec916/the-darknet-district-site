/* District residents and profile jobs (void-runner/district-people.js): the roster the V1 lists beside real players, and the jobs a profile can show. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const P=require('../void-runner/district-people.js'),Crowd=require('../void-runner/crowd.js'),D=require('../void-runner/device-v1.js');
test('jobs: the owner\'s list is there, ids are unique, and a profile holds one or two known jobs',()=>{
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
 globalThis.VoidDistrictPeople=P;try{for(const n of P.NPCS.filter(n=>/^crew-/.test(n.crew||''))){const face=n.own||n.look;assert(Crowd.clips[face],n.id);assert(Crowd.clips[face].includes(Crowd.clipFor(n.crew)),n.id+' has the clip their spot needs');for(let i=0;i<5;i++)assert.equal(Crowd.pick('neochinatown',n.crew),face,n.id);}}finally{delete globalThis.VoidDistrictPeople;}
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
test('the house rule on scanning: Admin half the time, Iris the other half, Iris always when Admin is out; the walk goes round the counter to the hallway',()=>{
 const E=P.ETIQUETTE;let a=0,i=0;for(let k=0;k<1000;k++){const w=E.who(true,true,(k+.5)/1000);if(w==='admin')a++;else if(w==='iris')i++;}assert.equal(a,500);assert.equal(i,500);
 for(const r of [0,.3,.7,.999])assert.equal(E.who(false,true,r),'iris','Admin is not in the District: Iris always goes');assert.equal(E.who(true,false,.9),'admin');assert.equal(E.who(false,false,.5),null);
 const N=require('../void-runner/neochinatown.js'),Ex=require('../void-runner/exploration-controller.js'),interior=N.layout('interior');
 for(const [id,x] of [['admin',8],['iris',12.5]]){const path=E.path([x,48.6],[0.4,29]);assert.deepEqual(path[path.length-1],[0.4,29]);let prev=[x,48.6];
  for(const p of path){for(let t=.1;t<=1;t+=.1){const lx=prev[0]+(p[0]-prev[0])*t,lz=prev[1]+(p[1]-prev[1])*t;if(lz>48.2&&lx>5&&lx<15)continue;   // behind the counter is staff floor, not player floor
    const [wx,wz]=N.toWorld(lx,lz);assert(!Ex.blocked(wx,wz,interior),id+' walks through open floor at '+lx.toFixed(1)+','+lz.toFixed(1));}prev=p;}}
 assert.match(E.lines.admin,/rude/i);assert.match(E.lines.admin,/deactivate/i);assert.match(E.lines.iris,/rude/i);assert.match(E.lines.iris,/deactivate/i);
});
test('on foot is slightly faster (the owner, 15 Nov 2026) and still inside what the multiplayer server allows',()=>{
 const src=require('node:fs').readFileSync('void-runner/exploration-controller.js','utf8'),m=src.match(/walk:([\d.]+),sprint:([\d.]+)/);assert(m);assert(+m[1]>3.4&&+m[1]<=4.2);assert(+m[2]>5.6&&+m[2]<=7);
 const hub=require('node:fs').readFileSync('tools/district-hub/protocol.cjs','utf8').match(/maxSpeed:(\d+)/);assert(+m[2]<+hub[1]);
});
test('the two scanning lines have stored recordings: the words match exactly, the files exist, and nothing in the Kokoro manifest was touched',()=>{
 const fs=require('node:fs'),m=JSON.parse(fs.readFileSync('void-runner/assets/audio/voice/extra/manifest.json','utf8')),E=P.ETIQUETTE;
 for(const who of ['admin','iris']){const l=Object.values(m.lines).find(x=>x.speaker===who);assert(l,who);assert.equal(l.text,E.spoken[who][1]);assert.equal(E.lines[who],E.spoken[who][0]+': '+E.spoken[who][1]);assert.match(l.file,/^extra\/[a-z0-9-]+\.ogg$/);
  const st=fs.statSync('void-runner/assets/audio/voice/'+l.file);assert(st.size>5000&&st.size<400000,who+' clip size');assert(l.voice&&l.voiceId,'the voice used is recorded');}
 const main=JSON.parse(fs.readFileSync('void-runner/assets/audio/voice/manifest.json','utf8'));assert(!Object.values(main.lines).some(l=>l.text===E.spoken.admin[1]||l.text===E.spoken.iris[1]));assert.equal(Object.keys(main.lines).length,790,'the Kokoro manifest is as it was (736, plus Zane\'s 54 companion lines on 18 Nov 2026)');
 assert.match(fs.readFileSync('void-runner/voice-clips.js','utf8'),/extra\/manifest\.json/);
});
test('player lists show distance outside The Darknet District and not inside it',()=>{
 const src=require('node:fs').readFileSync('void-runner/personal-device.js','utf8');
 assert.match(src,/function distanceTo\(p\)\{try\{if\(areasHere\(\)\.includes\('interior'\)/,'inside the District no distance is shown');
 assert.match(src,/distText=d=>d==null\?'':VoidUnits\.fmtDist\(d\)\+' away'/,'shown in feet (units.js)');assert.match(src,/rows\.sort\(\(a,b\)=>\(a\.dist\?\?0\)-\(b\.dist\?\?0\)\)/,'nearest first');
});
