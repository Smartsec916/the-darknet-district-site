/* Milked's studio dancers change dance every 20-40 s (the owner, 18 Nov 2026: "The new girl in studio 4 needs more dance animations, the male in 3 isn't doing much"). */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const MK=require('../void-runner/milked.js'),Crowd=require('../void-runner/crowd.js');
test('studios 3 and 4 have a rotation of several distinct dances, each one in the figure\'s clip list',()=>{
 const by=n=>MK.STUDIOS.find(s=>s.n===n).dancer;
 assert.equal(by(3).look,'vr-companion-bm');assert.equal(by(4).look,'npc-milked-auburn');
 assert.ok(by(3).dances.length>=5,'Dex: several men\'s dances');assert.ok(by(4).dances.length>=5,'Auburn: at least five dances');
 for(const n of [3,4]){const d=by(n);assert.equal(new Set(d.dances).size,d.dances.length,'no dance listed twice');for(const c of d.dances){assert.match(c,/^dance/,'named as a dance, so milked-build.js never adds its fake sway');assert.ok(Crowd.clips[d.look].includes(c),d.look+' lists '+c);}
  assert.ok(Crowd.clips[d.look].includes(d.clips[0]),'the first clip is one the figure has');}
 assert.ok(!by(3).dances.includes('hips')&&!by(3).clips.includes('hips'),'Dex no longer stands in the women\'s hip-shift pose');
});
test('danceTurn: 20 to 40 s per dance, every dance used, never the same dance twice in a row, the same order every time for a dancer',()=>{
 for(const n of [3,4]){const list=MK.STUDIOS.find(s=>s.n===n).dancer.dances,seen=new Set();let prev=null;
  for(let i=0;i<list.length*6;i++){const t=MK.danceTurn(list,i,n);assert.ok(t.seconds>=20&&t.seconds<=40,t.seconds);assert.ok(list.includes(t.clip));assert.notEqual(t.clip,prev,'turn '+i);prev=t.clip;seen.add(t.clip);
   assert.deepEqual(MK.danceTurn(list,i,n),t,'deterministic');}
  assert.equal(seen.size,list.length,'each dance comes round');}
 assert.equal(MK.danceTurn([],0,1),null);assert.equal(MK.danceTurn(['dance'],3,1).clip,'dance');
 // the build plays only the dances the loaded file really has, and cross-fades (crowd.js turns blending on for every clip)
 const b=fs.readFileSync(path.join(__dirname,'../void-runner/milked-build.js'),'utf8'),c=fs.readFileSync(path.join(__dirname,'../void-runner/crowd.js'),'utf8');
 assert.match(b,/own\.length>1/);assert.match(b,/MK\.danceTurn\(p\.rot\.list,\+\+p\.rot\.n,p\.studio\)/);assert.match(c,/g\.enableBlending=true/);
});
test('Auburn\'s file carries her dances (her own Meshy model, in this repository)',()=>{
 const f=path.join(__dirname,'../void-runner/assets/models/crowd/npc-milked-auburn.glb'),b=fs.readFileSync(f),j=JSON.parse(b.slice(20,20+b.readUInt32LE(12)));
 const names=(j.animations||[]).map(a=>a.name);for(const c of MK.STUDIOS.find(s=>s.n===4).dancer.dances)assert.ok(names.includes(c),'npc-milked-auburn.glb has '+c);
 assert.ok(b.length<8e6,'the file stays small: '+b.length);
});
