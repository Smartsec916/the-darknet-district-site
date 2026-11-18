const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const S=require('../void-runner/ncz-street-pair.js'),C=require('../void-runner/crowd.js'),Q=require('../void-runner/ncz-quarters.js'),M=require('../void-runner/milked.js');
const at=(h,m=0,day=18)=>Date.UTC(2026,10,day,h,m);

test('the 12-hour rotation: UTC 0-11 Reverie, 12-23 Lace, the same for everyone',()=>{
 for(let h=0;h<24;h++)assert.equal(S.onShift(at(h,30)).id,h<12?'grey-reverie':'ethereal-lace',String(h));
 assert.equal(S.onShift(at(11,59)).id,'grey-reverie');assert.equal(S.onShift(at(12,0)).id,'ethereal-lace');assert.equal(S.onShift(at(0,0,19)).id,'grey-reverie');
 // a player's own time zone does not matter: the same instant gives the same answer
 const t=at(15,10);assert.equal(S.onShift(t).id,S.onShift(new Date(t).getTime()).id);
 assert.equal(S.shiftStart(at(15,10)),at(12,0));assert.equal(S.shiftStart(at(3,0)),at(0,0));assert.equal(S.nextChange(at(15,10)),at(0,0,19));assert.equal(S.nextChange(at(3,0)),at(12,0));
});

test('nobody is out for the first moments of a shift (the handover), then the one on shift is',()=>{
 const a=S.config.arrive;assert.ok(a>0&&a<600);
 assert.equal(S.onStreet(at(12,0)),null);assert.equal(S.onStreet(at(12,0)+(a-1)*1000),null);assert.equal(S.onStreet(at(12,0)+a*1000).id,'ethereal-lace');
 assert.equal(S.onStreet(at(0,0,19)+1000),null);assert.equal(S.onStreet(at(6,0)).id,'grey-reverie');
});

test('names: no spaces, placeholders, the Meshy titles kept; neither has dialogue or a voice; both walk now',()=>{
 assert.deepEqual(S.PAIR.map(p=>p.kind),['walker','walker']);
 assert.deepEqual(S.PAIR.map(p=>p.id),['grey-reverie','ethereal-lace']);assert.deepEqual(S.PAIR.map(p=>p.name),['Reverie','Lace']);
 for(const p of S.PAIR){assert.doesNotMatch(p.name,/\s/);assert.equal(p.placeholder,true);}assert.deepEqual(S.PAIR.map(p=>p.title),['Grey Reverie','Ethereal Lace']);
 const src=fs.readFileSync(path.join(__dirname,'../void-runner/ncz-street-pair.js'),'utf8');assert.doesNotMatch(src,/talkChoice|speech\s*=|announce\(|VoidInteractions|voice-clips/);
 const reg=fs.readFileSync(path.join(__dirname,'../tools/audio/npc-voice-registry.json'),'utf8');assert.doesNotMatch(reg,/reverie|ethereal|"lace"/i);
});

test('both carry the same casual street library; no sensual, flirt or club clip is allowed anywhere',()=>{
 const want=S.CLIP_LIST.slice().sort();assert.equal(new Set(want).size,want.length);
 for(const k of ['idle','idle-shift','idle-stretch','look','watch','walk','run','sit-enter','sit','sit-exit','sit-wave','dance-groove','dance-bop','talk','gesture','shrug'])assert.ok(want.includes(k),k);
 const banned=['slow-dance','dance-belly','dance-samba','blow-kiss','coy','hips','recline','sensual-movement','twerk','grind','pole-dance','milked-dance','flirt','seductive-idle','lap-dance','club-dance'];
 for(const b of banned)assert.match(b,S.BANNED,b+' is caught by the rule');
 for(const c of S.CLIP_LIST)assert.doesNotMatch(c,S.BANNED,c);
 const clips=JSON.parse(fs.readFileSync(path.join(__dirname,'../tools/animation-pipeline/clips.json'),'utf8')).clips;
 for(const f of ['npc-grey-reverie','npc-ethereal-lace']){
  assert.deepEqual(C.clips[f].slice().sort(),want,f+' in crowd.js');
  const spec=JSON.parse(fs.readFileSync(path.join(__dirname,'../tools/animation-pipeline/characters/'+f+'.json'),'utf8'));
  assert.deepEqual(spec.clips.map(c=>clips[c].as||c).sort(),want,f+' spec');
  for(const c of spec.clips){assert.doesNotMatch(c,S.BANNED);assert.doesNotMatch(clips[c].as||c,S.BANNED);assert.doesNotMatch(String(clips[c].action||''),S.BANNED,c+' source action');assert.doesNotMatch(clips[c].file,/flirt|belly|samba|sensual|seduc|laying|twerk|pole/i,c+' source file');}
  const b=fs.readFileSync(path.join(__dirname,'../void-runner/assets/models/crowd/'+f+'.glb')),j=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString('utf8'));
  assert.deepEqual(j.animations.map(a=>a.name.replace(/\.\d+$/,'')).sort(),want,f+': the file carries exactly these clips');
  for(const a of j.animations)assert.doesNotMatch(a.name,S.BANNED);
  assert.ok(b.length<6.2e6,f+' is game-sized ('+b.length+')');
  const tris=j.meshes.reduce((n,m)=>n+m.primitives.reduce((k,p)=>k+j.accessors[p.indices].count/3,0),0);assert.ok(tris>30000&&tris<47000,f+' triangles '+tris);
  const names=new Set(j.nodes.map(n=>n.name));for(const bn of ['Hips','Spine','Spine1','Spine2','Neck','Head','LeftArm','LeftForeArm','LeftHand','RightArm','RightForeArm','RightHand','LeftUpLeg','LeftLeg','LeftFoot','RightUpLeg','RightLeg','RightFoot'])assert.ok(names.has('mixamorig:'+bn),f+' has the standard joint '+bn);}
 assert.ok(fs.statSync(path.join(__dirname,'../void-runner/assets/models/crowd/npc-street-cat.glb')).size<1.2e6,'the cat is small');
 // the V1 poses they use are npc-device.js poses
 const D=require('../void-runner/npc-device.js'),src=fs.readFileSync(path.join(__dirname,'../void-runner/npc-device.js'),'utf8');for(const p of S.DEVICE)assert.match(src,new RegExp("case '"+p+"'|'"+p+"'"),p);
});

test('they stay on one ordinary stretch of the Avenue, far from Milked, NULL and the club',()=>{
 const pts=[S.SEAT,S.CAT_HOME,{x:S.STRETCH.x0,z:S.STRETCH.z},{x:S.STRETCH.x1,z:S.STRETCH.z},...S.STEPS];
 for(const p of pts){assert.ok(Q.inQuarter(S.QUARTER,p.x,p.z),JSON.stringify(p));assert.ok(M.distance(p.x,p.z)>100,'far from Milked');assert.ok(p.z<S.WALL&&p.z>-8,'on the north pavement');}
 // NULL and the District door are on Main Street / the alley (x 52-70, z -40..-70): nowhere near
 for(const p of pts)assert.ok(Math.hypot(p.x-61,p.z+60)>50);
});

const seeded=k=>{let seed=k;return ()=>(seed=(seed*16807)%2147483647)/2147483647;};
function simulate(p,minutes,ctxAt,rnd=seeded(7)){const s=S.routineStart(p,rnd);const seen={modes:new Set(),clips:new Set(),devices:new Set(),subs:new Set(),ledges:{},onceClips:new Set(),minX:1e9,maxX:-1e9};let t=0;
 for(let i=0;i<minutes*600;i++,t+=.1){const ctx=ctxAt?ctxAt(s,t):{};S.routineStep(s,.1,rnd,S.config,ctx);seen.modes.add(s.mode);seen.clips.add(s.clip);if(s.device)seen.devices.add(s.device);if(s.sub)seen.subs.add(s.sub);if(s.once)seen.onceClips.add(s.clip);
  if(s.mode==='sit'){seen.ledges[s.step.id]=(seen.ledges[s.step.id]||0)+1;assert.ok(S.STEPS.some(st=>Math.abs(st.x-s.x)<.01),'sits on a ledge');assert.ok(['sit','sit-wave'].includes(s.clip));}
  if(s.mode==='run')assert.equal(s.clip,'run');
  seen.minX=Math.min(seen.minX,s.x);seen.maxX=Math.max(seen.maxX,s.x);assert.ok(s.z<S.WALL&&s.z>-7.5,'on the pavement: '+s.z);assert.ok(S.CLIP_LIST.includes(s.clip),s.clip);if(s.device)assert.ok(S.DEVICE.includes(s.device));}
 return seen;}

test('the routine (both): walks, runs a short way, stops for idles, looks and the V1, sits down, sits and stands up through the transitions, never leaving the stretch',()=>{
 for(const p of S.PAIR){const seen=simulate(p,40);
  for(const m of ['walk','run','stop','pause','to-step','settle','sit-down','sit','stand-up','step-off'])assert.ok(seen.modes.has(m),p.id+' '+m);
  for(const c of ['walk','run','sit-enter','sit','sit-exit','look'])assert.ok(seen.clips.has(c),p.id+' '+c);
  assert.ok(seen.onceClips.has('sit-enter')&&seen.onceClips.has('sit-exit'),'the sit-down and stand-up clips play once');
  assert.ok(seen.clips.has('idle-shift')||seen.clips.has('idle-stretch'),'idle variations');
  assert.ok(seen.devices.has('scroll')&&seen.devices.has('selfie'),'the V1: scrolling and a selfie');
  assert.ok(seen.minX>=S.STRETCH.x0-.01&&seen.maxX<=S.STRETCH.x1+.01,seen.minX+'..'+seen.maxX);}
});

test('the order of a sit: settle -> sit-down (once) -> sit -> stand-up (once) -> step-off -> walk',()=>{
 const rnd=seeded(3),s=S.routineStart(S.PAIR[0],rnd);s.left=0;s.mode='walk';const order=[];for(let i=0;i<4000&&order.length<8;i++){const m0=s.mode;S.routineStep(s,.1,()=>0.01,S.config,{});if(s.mode!==m0)order.push(s.mode);}
 const i=order.indexOf('settle');assert.ok(i>=0,order.join(','));assert.deepEqual(order.slice(i,i+6),['settle','sit-down','sit','stand-up','step-off','walk']);
});

test('Reverie keeps her favourite seat against the LAUNDRY wall; Lace uses all three ledges',()=>{
 const fav=S.STEPS.find(t=>t.id==='ledge-reverie');assert.ok(Math.abs(fav.x-S.SEAT.x)<.01&&fav.z<S.WALL);
 const r=simulate(S.PAIR[0],60),l=simulate(S.PAIR[1],60);const tot=o=>Object.values(o).reduce((a,b)=>a+b,0);
 assert.ok(r.ledges['ledge-reverie']/tot(r.ledges)>.5,JSON.stringify(r.ledges));assert.ok(Object.keys(l.ledges).length>=2,JSON.stringify(l.ledges));
});

test('with the cat close she talks to it, photographs it and now and then dances (casual clips only)',()=>{
 for(const p of S.PAIR){const seen=simulate(p,60,s=>({cat:{x:s.x+.7,z:s.z+.25}}));
  assert.ok(seen.subs.has('dance')&&(seen.clips.has('dance-groove')||seen.clips.has('dance-bop')),p.id+' dances');
  assert.ok(seen.subs.has('talk')&&(seen.clips.has('talk')||seen.clips.has('gesture')),p.id+' talks to the cat');
  assert.ok(seen.devices.has('photo'),p.id+' photographs the cat');}
 // alone, dancing is rare
 const alone=simulate(S.PAIR[1],60,null,seeded(11));const withCat=simulate(S.PAIR[1],60,s=>({cat:{x:s.x+.7,z:s.z+.25}}),seeded(11));
 assert.ok(!alone.subs.has('dance')||withCat.subs.has('dance'));
 // seated, a player close by gets a wave from the seat
 const w=simulate(S.PAIR[0],40,s=>({player:{x:s.x,z:s.z-2}}));assert.ok(w.clips.has('sit-wave'));
});

test('the glance: the nearest player within 4.5 m and 70 degrees of her front; head turn clamped to 35 / 15 degrees; never while dancing, running or on the V1',()=>{
 const D=Math.PI/180,L=S.config.look,body={x:100,z:-6.8,yaw:Math.PI},head={x:100,y:1.45,z:-6.8},at=(deg,d,y=1.6)=>({x:100+Math.sin(Math.PI+deg*D)*d,y,z:-6.8+Math.cos(Math.PI+deg*D)*d});
 assert.ok(Math.abs(L.radius-4.5)<.6&&Math.abs(L.cone-70*D)<1e-9&&Math.abs(L.yaw-35*D)<1e-9&&Math.abs(L.pitch-15*D)<1e-9&&Math.abs(L.blend-.4)<.11);
 assert.equal(S.lookAt(body,head,[]),null);assert.equal(S.lookAt(body,head,[at(0,6)]),null,'too far');assert.equal(S.lookAt(body,head,[at(100,2)]),null,'behind the cone');assert.equal(S.lookAt(body,head,[at(180,1.5)]),null,'behind her');
 const straight=S.lookAt(body,head,[at(0,3)]);assert.ok(straight&&Math.abs(straight.yaw)<1e-6&&straight.pitch>0&&straight.pitch<=L.pitch);
 const side=S.lookAt(body,head,[at(60,2)]);assert.ok(Math.abs(side.yaw)<=L.yaw+1e-9&&Math.abs(Math.abs(side.yaw)-L.yaw)<1e-9,'clamped to 35 degrees');
 const small=S.lookAt(body,head,[at(20,2)]);assert.ok(Math.abs(Math.abs(small.yaw)-20*D)<1e-6,'a small turn is not clamped');
 const low=S.lookAt(body,head,[at(0,1,0)]);assert.ok(Math.abs(low.pitch+L.pitch)<1e-9,'pitch clamped');
 const two=S.lookAt(body,head,[at(10,4),at(-30,1.5)]);assert.equal(two.i,1,'the nearest player wins');
 assert.equal(S.canLook({mode:'walk'}),true);assert.equal(S.canLook({mode:'sit'}),true);assert.equal(S.canLook({mode:'stop',sub:'idle'}),true);
 assert.equal(S.canLook({mode:'run'}),false);assert.equal(S.canLook({mode:'stop',sub:'dance'}),false);assert.equal(S.canLook({mode:'stop',device:'selfie'}),false);
 // no eye bones to aim on their rigs (the eyes are painted into the face): head tracking only
 for(const f of ['npc-grey-reverie','npc-ethereal-lace']){const b=fs.readFileSync(path.join(__dirname,'../void-runner/assets/models/crowd/'+f+'.glb')),j=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString('utf8'));assert.ok(!j.nodes.some(n=>/eye/i.test(n.name)),f);assert.equal(j.meshes.length,1,f+' is one mesh');}
});

test("the cat's target: whoever is out, else home; a close player now and then, never during its cool-down",()=>{
 const cat={x:100,z:-6.2},her={x:110,z:-6.8,moving:true};
 assert.deepEqual(S.catTarget({her:null,cat}),{kind:'home',x:S.CAT_HOME.x,z:S.CAT_HOME.z});
 const t=S.catTarget({her,cat});assert.equal(t.kind,'her');assert.equal(t.x,110);assert.equal(t.moving,true);
 assert.equal(S.catTarget({her:{...her,sitting:true},cat}).sitting,true);
 const near={x:101,z:-6.5},far={x:120,z:-12};
 assert.equal(S.catTarget({her,cat,player:near,chance:0}).kind,'player','a close player, when the chance falls');
 assert.equal(S.catTarget({her,cat,player:near,chance:.99}).kind,'her','not every time');
 assert.equal(S.catTarget({her,cat,player:far,chance:0}).kind,'her','a far player is ignored');
 assert.equal(S.catTarget({her,cat,player:near,chance:0,clock:10,until:30}).kind,'her','cool-down');
 assert.equal(S.catTarget({her:null,cat,player:near,chance:0}).kind,'player');
 // the one out comes from the shift: in the handover the cat goes home
 assert.equal(S.catTarget({her:S.onStreet(at(12,0))?her:null,cat}).kind,'home');
});

test('wired into the page and the street (after the alley, before neochinatown.js)',()=>{
 for(const f of ['void-runner.html','static/void-runner.html']){const h=fs.readFileSync(path.join(__dirname,'..',f),'utf8');assert.match(h,/src="void-runner\/ncz-street-pair\.js"/);assert.ok(h.indexOf('ncz-street-pair.js')<h.indexOf('void-runner/neochinatown.js'));}
 const n=fs.readFileSync(path.join(__dirname,'../void-runner/neochinatown.js'),'utf8');assert.match(n,/VoidStreetPair\.start/);assert.match(n,/streetPair\?\.tick\(dt\)/);assert.match(n,/streetPair\?\.dispose\(\)/);
});
