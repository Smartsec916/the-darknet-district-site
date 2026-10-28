// NeoChinatown nightlife: who walks where, how many are drunk, and that every lane stays on open sidewalk.
const test=require('node:test'),assert=require('node:assert/strict'),N=require('../void-runner/ncz-nightlife.js'),NCZ=require('../void-runner/neochinatown.js');
const seeded=s=>()=>((s=(s*1664525+1013904223)>>>0)/4294967296);
test('crowd density follows quality: walkers plus people standing about',()=>{
  for(const q of ['high','medium','low']){const p=N.plan(q,seeded(1)),walk=p.filter(x=>!x.fixed),stand=p.filter(x=>x.fixed);
   assert.equal(walk.length,N.config.walkers[q],q+' walkers');
   const want=Object.values(N.config.standers[q]).reduce((a,b)=>a+b,0);assert.ok(stand.length>=want,q+' standers '+stand.length);}
  assert.ok(N.plan('high',seeded(2)).length>N.plan('medium',seeded(2)).length);
  assert.ok(N.plan('high',seeded(3)).length>=70,'High is visibly busier than before (22)');});

test('people standing about keep clear of doors, taxi stands and the static crew, and face something sensible',()=>{
  for(let seed=1;seed<6;seed++)for(const p of N.plan('high',seeded(seed)).filter(x=>x.fixed)){
   for(const [x,z,r] of N.keepClear)assert.ok(Math.hypot(p.x-x,p.z-z)>=r-.6,p.id+' too close to a kept-clear spot');
   assert.ok(['group','couple','shop','lean'].includes(p.kind));assert.ok(Array.isArray(p.face));}});
test('about 8% are drunk, and only on nightlife lanes',()=>{
  for(let s=1;s<40;s++){const p=N.plan('high',seeded(s)),drunk=p.filter(x=>x.drunk);assert.ok(drunk.length>=1&&drunk.length<=Math.ceil(p.length*.1),'seed '+s);
   for(const d of drunk)assert.ok(N.lanes.find(l=>l.id===d.lane).nightlife,d.lane);}});
test('the drunk share is configurable',()=>{const p=N.plan('high',seeded(3),{...N.config,drunkShare:.3});assert.ok(p.filter(x=>x.drunk).length>=6);});
test('a sober friend walks beside some drunks; friends share their lane',()=>{let helped=0;for(let s=1;s<40;s++){const p=N.plan('high',seeded(s));for(const f of p.filter(x=>x.friendOf)){helped++;const d=p.find(x=>x.id===f.friendOf);assert.ok(d.drunk);assert.equal(f.lane,d.lane);}}assert.ok(helped>0);});
test('every lane runs over open street inside NeoChinatown, clear of buildings',()=>{
  const open=Object.values(NCZ.streets);const inside=([x,z])=>open.some(([a,b,c,d])=>x>=a&&x<=b&&z>=c&&z<=d);
  for(const l of N.lanes)for(let k=0;k<=20;k++){const t=k/20*Math.hypot(l.b[0]-l.a[0],l.b[1]-l.a[1]);for(const side of [-l.half,0,l.half])assert.ok(inside(N.at(l,t,side)),l.id+' '+t.toFixed(1)+' '+side);}});
test('nobody leans or stops in front of the District door or the taxi stands',()=>{
  const door=N.keepClear[0];const alley=N.lanes.find(l=>l.id==='alley');assert.ok(Math.hypot(alley.b[0]-door[0],alley.b[1]-door[1])>door[2],'the alley lane ends short of the door');
  for(const l of N.lanes)for(let t=1;t<Math.hypot(l.b[0]-l.a[0],l.b[1]-l.a[1]);t+=1)if(N.canLean(l,t)){const p=N.at(l,t);for(const [x,z,r] of N.keepClear)assert.ok(Math.hypot(p[0]-x,p[1]-z)>=r);}});
