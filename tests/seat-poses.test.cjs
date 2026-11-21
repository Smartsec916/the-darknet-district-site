// The floor poses (the owner, 21 Nov 2026: "can you add kneeling and cross-legged pose? add them to any npc that has the correct skeleton. also a sitting knee to chest
// pose."): three clips posed by code on every public figure with the shared mixamorig skeleton (tools/animation-pipeline/make_floor_poses.py), the seats that use them
// (the tea room cushions, the mahjong stools, the sleeping room's cots, the alcove benches), the editor's choices and the server's check. Also Mission 011's reward.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ROOT=path.join(__dirname,'..'),R=f=>path.join(ROOT,f),read=f=>fs.readFileSync(R(f),'utf8');
const C=require(R('void-runner/crowd.js')),U=require(R('void-runner/ncz-underground.js')),M=require(R('void-runner/modules.js')),SP=require(R('void-runner/ncz-street-pair.js'));
const P=require(R('void-runner/npc-paths.js')),MM=require(R('void-runner/mission-mechanics.js')),NG=require(R('void-runner/npc-gestures.js')),A=require(R('void-runner/npc-areas.js'));
const FLOOR=['floor-kneel','floor-cross','floor-knees'],DIR=R('void-runner/assets/models/crowd');
const glb=f=>{const b=fs.readFileSync(path.join(DIR,f+'.glb'));const n=b.readUInt32LE(12);return JSON.parse(b.slice(20,20+n).toString('utf8'));};

test('every public figure on the shared skeleton carries the three floor poses (small looping clips); the companions and licensed files do not',()=>{
 assert.deepEqual(C.FLOOR,FLOOR);let n=0;
 for(const f of fs.readdirSync(DIR).filter(x=>x.endsWith('.glb')).map(x=>x.slice(0,-4))){const j=glb(f),sk=j.skins&&j.skins[0];
  const mixamo=!!sk&&sk.joints.some(i=>j.nodes[i].name==='mixamorig:Hips'),own=/^(vr-companion|npc-kai$|npc-zane$|npc-luna$|npc-blackrock-robe$)/.test(f),names=(j.animations||[]).map(a=>a.name);
  if(!mixamo||own){for(const c of FLOOR)assert.ok(!names.includes(c),f+' should not have '+c);continue;}
  n++;for(const c of FLOOR){const a=j.animations.find(x=>x.name===c);assert.ok(a,f+' '+c);assert.ok(C.clips[f]&&C.clips[f].includes(c),f+' lists '+c);
   assert.ok(a.channels.some(ch=>ch.target.path==='translation'&&j.nodes[ch.target.node].name==='mixamorig:Hips'),'the hips go down to the floor');
   const t=j.accessors[a.samplers[0].input];assert.equal(t.count,9);assert.ok(t.max[0]>=4&&t.max[0]<=6,'a 4 to 6 s loop');}}
 assert.ok(n>=60,'figures with the poses: '+n);
 for(const k of ['vr-companion-f','vr-companion-ava','npc-kai','npc-zane','npc-luna','npc-dax','studio-warrior'])for(const c of FLOOR)assert.ok(!(C.clips[k]||[]).includes(c),k);
 for(const c of FLOOR)assert.ok(SP.CLIP_LIST.includes(c),'Reverie and Lace list it');for(const c of SP.CLIP_LIST)assert.doesNotMatch(c,SP.BANNED);
 const lib=JSON.parse(read('tools/animation-pipeline/clips.json')).clips;for(const c of FLOOR)assert.equal(lib[c].source,'pose','a Blender rebuild skips it');
 assert.match(read('tools/animation-pipeline/build_mpfb_character.py'),/source'\) == 'pose': continue/);assert.match(read('tools/animation-pipeline/build_imported_character.py'),/source'\) == 'pose': continue/);
 assert.doesNotMatch(read('tools/animation-pipeline/make_floor_poses.py'),/import (requests|urllib)|http/,'no outside service');});

test('the seats: cushions take the floor poses, the mahjong stools are chairs with room to stand, the cots and alcove benches take knees to chest',()=>{
 const all=U.seatsAll(),by=p=>all.filter(s=>s.place===p);
 assert.equal(U.SEATS.length,6,'the alcoves\' chairs unchanged');
 const cush=by('under-tea-room');assert.equal(cush.length,9);for(const s of cush)assert.deepEqual(s.poses,['kneel','cross','knees']);
 const mj=by('under-mahjong');assert.equal(mj.length,6);for(const s of mj){assert.deepEqual(s.poses,['chair']);assert.equal(s.h,.48);}
 const cots=by('under-sleeping-room');assert.equal(cots.length,4);for(const s of cots){assert.deepEqual(s.poses,['knees','cross']);assert.equal(s.h,.44);}
 assert.equal(all.filter(s=>/bench-up$/.test(s.id)).length,4);
 for(const s of all){   // (the alcoves' chairs from 20 Nov 2026 are reached within 0.6 m of their front, as before)
  assert.equal(U.placeAt(s.x,s.z),s.place,s.id+' in its place');const f=SP.standOf(s);assert.equal(U.placeAt(f.x,f.z),s.place,s.id+' stand point in its place');
  if(!U.SEATS.includes(s)){const c=A.check(f,'underground');assert.ok(c.ok&&c.area==='underground',s.id+' stand point is walkable ground ('+JSON.stringify(f)+'): '+c.why);}
  for(const q of s.poses)assert.equal(SP.seatNear(f,q).id,s.id,s.id+' found from its stand point for '+q);}
 // the stools people sit on stand 0.55 m out from the table (0.3 for the others, against the walls), so one can stand between stool and table
 const st=M.MJ_STOOLS;assert.equal(st.length,12);for(const t of st){const T=M.TYPES.mahjong.furn.find(r=>r[5]==='table-'+t.id.split('-')[0]);const gap=Math.max(T[0]-t.x,t.x-T[1],T[2]-t.z,t.z-T[3]);
  assert.ok(Math.abs(gap-(t.seat?.55:.3))<1e-3,t.id+' '+gap);if(t.seat){const f={x:t.x+Math.sin(t.yaw)*SP.SEAT_FRONT,z:t.z+Math.cos(t.yaw)*SP.SEAT_FRONT};assert.ok(Math.max(T[0]-f.x,f.x-T[1],T[2]-f.z,f.z-T[3])>.1,'room in front of the stool to sit down');}}
 assert.match(read('void-runner/module-build.js'),/for\(const st of t\.stools\|\|\[\]\)stool\(st\.x,st\.z,\.48\)/,'the parlour draws the same stools');
 assert.equal(M.TYPES['tea-room'].sits.length,8,'the street tea house\'s cushions are seats too (module data)');});

test('a placed person walks onto a cushion, takes the pose at the seat\'s height and gets up again; poses only where the seat takes them',()=>{
 const seat=U.seatsAll().find(s=>s.id==='under-tea-room-cushion-c-w'),f=SP.standOf(seat),rnd=()=>.5,cfg={...SP.config,sit:[3,3]};
 for(const [act,pose,clip] of [['sit-kneel','kneel','floor-kneel'],['sit-cross','cross','floor-cross'],['sit-knees','knees','floor-knees']]){
  const plan={key:'k'+act,mode:'stay',x:f.x,z:f.z,yaw:0,actions:[act]};let s={mode:'plan-go',x:f.x+1,z:f.z,yaw:0,left:0,clip:'idle'},seen=new Set(),sat=null;
  for(let i=0;i<1200;i++){s=SP.routineStep(s,1/30,rnd,cfg,{plan});seen.add(s.mode);if(s.mode==='sit'&&s.clip===clip&&Math.abs((s.lift||0)-seat.h)<.01&&!sat)sat={x:s.x,z:s.z,yaw:s.yaw};}
  assert.ok(sat,act+' sits: '+[...seen]);const back=SP.FLOOR_BACK[pose];assert.ok(Math.abs(sat.x-(seat.x-Math.sin(seat.yaw)*back))<.02&&Math.abs(sat.z-(seat.z-Math.cos(seat.yaw)*back))<.02,'on the cushion');
  assert.ok(Math.abs(Math.atan2(Math.sin(sat.yaw-seat.yaw),Math.cos(sat.yaw-seat.yaw)))<.06,'facing the table');assert.ok(seen.has('floor-out'),'gets up again');}
 {const st=U.seatsAll().find(x=>x.id==='under-mahjong-stool-e-w'),sf=SP.standOf(st),plan={key:'stool',mode:'stay',x:sf.x,z:sf.z,yaw:0,actions:['sit']};let q={mode:'plan-go',x:sf.x,z:sf.z+1,yaw:0,left:0,clip:'idle',seatBack:.1},seen=[];
  for(let i=0;i<1500;i++){q=SP.routineStep(q,1/30,rnd,cfg,{plan});if(seen[seen.length-1]!==q.mode)seen.push(q.mode);}
  assert.ok(['chair-in','settle','sit-down','sit','stand-up','step-off'].every(x=>seen.includes(x)),'a mahjong stool: from the side, in front, down, up and back out: '+seen.join(' '));}
 // the editor's checks: a floor pose needs a seat that takes it; the chair at a stool
 P.setMade({sitter:{name:'Sitter',model:'npc-casual-m'}});try{const ids=P.actionsFor('sitter').map(a=>a.id);for(const a of ['sit','sit-kneel','sit-cross','sit-knees'])assert.ok(ids.includes(a),a);
  const stool=U.seatsAll().find(s=>s.id==='under-mahjong-stool-e-w'),sf=SP.standOf(stool);
  assert.deepEqual(P.planProblems('sitter',{mode:'stay',x:+sf.x.toFixed(1),z:+sf.z.toFixed(1),yaw:0,actions:['sit']}),[]);
  assert.ok(P.planProblems('sitter',{mode:'stay',x:+sf.x.toFixed(1),z:+sf.z.toFixed(1),yaw:0,actions:['sit-kneel']}).some(x=>/seat that takes that pose/.test(x)));
  assert.deepEqual(P.planProblems('sitter',{mode:'stay',x:+f.x.toFixed(1),z:+f.z.toFixed(1),yaw:0,actions:['sit-kneel','sit-cross']}),[]);
  assert.ok(P.planProblems('sitter',{mode:'stay',x:+f.x.toFixed(1),z:+f.z.toFixed(1),yaw:0,actions:['sit']}).length,'no chair on a cushion');
  const sp=P.seatPoses(f);assert.deepEqual(sp.poses.map(q=>q.action),['sit-kneel','sit-cross','sit-knees']);
  const cot=U.seatsAll().find(s=>s.id==='under-sleeping-room-cot-2'),cf=SP.standOf(cot);assert.deepEqual(P.planProblems('sitter',{mode:'stay',x:cf.x,z:cf.z,yaw:0,actions:['sit-knees']}),[]);
 }finally{P.setMade({});}
 // Reverie and Lace can too; a figure without the clips is never offered them (Kai, a companion)
 assert.ok(P.actionsFor('grey-reverie').some(a=>a.id==='sit-kneel'));
 // the inventory hands the server each seat's poses and stand point
 const inv=JSON.parse(read('void_runner_admin_inventory.json')),seats=inv.npcPaths.movable['grey-reverie'].seats;const c=seats.find(s=>s.id==='under-tea-room-cushion-c-w');
 assert.deepEqual(c.poses,['kneel','cross','knees']);assert.deepEqual(c.front,[+f.x.toFixed(3),+f.z.toFixed(3)]);
 assert.ok(inv.npcPaths.movable['grey-reverie'].actions.includes('sit-kneel'));});

test('the Mission Editor\'s cast and the gestures offer the poses only to figures that have them',()=>{
 for(const c of FLOOR)assert.ok(MM.CLIPS.includes(c));
 const m=(model,clip)=>({id:'m',cast:[{id:'p1',model,place:'under-tea-room',clip}],objectives:[{id:'a'}]}),probs=x=>MM.castProblems(x,{}).filter(p=>/pose/.test(p));
 assert.deepEqual(probs(m('npc-cook-old','floor-kneel')),[]);assert.ok(probs(m('npc-kai','floor-kneel')).length,'Kai has no floor pose');
 assert.match(read('void_runner_live_content.py'),/'floor-kneel', 'floor-cross', 'floor-knees'\)/,'the server accepts the cast poses');
 const g=NG.clipsFor('grey-reverie');assert.ok(g.clips.filter(c=>c.pose).map(c=>c.id).sort().join()===FLOOR.slice().sort().join(),'idle poses in the gestures list');
 assert.match(NG.nameOf('floor-kneel'),/^Idle pose/);});

test('Mission 011 pays 5,000 CR (the owner, 21 Nov 2026)',()=>{const MS=require(R('void-runner/main-story.js'));assert.equal(MS.REWARD,5000);
 assert.ok(MS.M011.unlocks.some(u=>u.kind==='credits'&&u.amount===5000));assert.match(read('void-runner-sw.js').split('\n')[3],/^const BUILD='\d{4}-\d{2}-\d{2}-[a-z0-9-]+';\r?$/);});
