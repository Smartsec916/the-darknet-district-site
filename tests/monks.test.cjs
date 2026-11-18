/* The monks (18 Nov 2026): three monk figures made with Meshy from the owner's reference picture, Zen Zephyr's own seated model, the rule that puts more monks on
   the streets toward the East Gate (the way up to the Temple), and the Temple's own monks. docs/development/TEMPLE.md "Monks", docs/development/MESHY_CHARACTERS.md. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ROOT=path.join(__dirname,'..'),R=p=>path.join(ROOT,p);
const N=require('../void-runner/ncz-nightlife.js'),C=require('../void-runner/crowd.js'),T=require('../void-runner/temple.js');
function seeded(s){return ()=>{s=(s*16807)%2147483647;return (s-1)/2147483646;};}
function glb(file){const d=fs.readFileSync(file);assert.equal(d.readUInt32LE(0),0x46546c67,'glTF magic');const len=d.readUInt32LE(12);return JSON.parse(d.subarray(20,20+len).toString('utf8'));}
const LOOKS=['npc-monk-elder','npc-monk-tech','npc-monk-grey'];

test('the closer to the Temple, the more of the walkers are monks',()=>{
 const S=N.config.monkShare,g=S.gate;
 assert.ok(N.monkShareAt(g[0],g[1])>.6,'at the East Gate most walkers are monks');
 assert.ok(N.monkShareAt(61,-70)<.05,'Old Town, the city centre: rare');
 let prev=1;for(let d=0;d<=140;d+=10){const s=N.monkShareAt(g[0]-d,g[1]);assert.ok(s<=prev+1e-12,'never more monks further from the gate ('+d+' m)');prev=s;}
 const share=(quarter,f=()=>true)=>{let w=0,m=0;for(let s=1;s<120;s++)for(const p of N.plan('high',seeded(s),N.config,quarter).filter(x=>!x.fixed)){const at=N.at(N.lanesFor(quarter).find(l=>l.id===p.lane),p.t);if(!f(at))continue;w++;if(p.monk)m++;}return m/w;};
 const old=share('oldtown'),avenue=share('avenue'),nearGate=share('avenue',([x])=>x>115),avenueWest=share('avenue',([x])=>x<50);
 assert.ok(old<.05,'Old Town '+old.toFixed(3));assert.ok(avenue>.12,'the Avenue '+avenue.toFixed(3));assert.ok(nearGate>.45,'the Avenue by the East Gate '+nearGate.toFixed(3));
 assert.ok(avenueWest<.06,'the Avenue\'s far (west) end '+avenueWest.toFixed(3));assert.ok(old>0,'still the odd monk in the centre');
});

test('a street monk walks alone and sober, and keeps to the stretch of lane toward the gate',()=>{
 for(let s=1;s<60;s++)for(const quarter of ['oldtown','avenue',null]){const plan=N.plan('high',seeded(s),N.config,quarter);
  for(const p of plan.filter(x=>x.monk)){assert.ok(!p.drunk&&!p.pairOf&&!p.friendOf&&!plan.some(o=>o.pairOf===p.id||o.friendOf===p.id),p.id);
   const l=N.lanesFor(quarter).find(x=>x.id===p.lane),L=Math.hypot(l.b[0]-l.a[0],l.b[1]-l.a[1]);assert.ok(p.range[0]>=1&&p.range[1]<=L-1&&p.range[0]<=p.t+1e-9&&p.range[1]>=p.t-1e-9&&p.range[1]-p.range[0]>=24,p.id+' '+p.range);
   if(/^avenue/.test(p.lane)&&N.at(l,p.t)[0]>90)assert.ok(p.range[1]>=L-1.01,'an Avenue monk near the gate comes and goes through it');}}
 // who is a monk does not use the shared random sequence: the rest of the plan (drunks, pairs, standers) is what it was
 const a=N.plan('high',seeded(7),{...N.config,monkShare:{...N.config.monkShare,min:0,max:0}}),b=N.plan('high',seeded(7));
 assert.deepEqual(a.map(p=>[p.id,p.lane,p.t,p.drunk]),b.map(p=>[p.id,p.lane,p.t,p.drunk]));assert.equal(a.filter(p=>p.monk).length,0);
});

test('street monks use the game\'s monk behaviour: monk figures, tagged so they never use a V1 or film a spectacle',()=>{
 const src=fs.readFileSync(R('void-runner/ncz-nightlife.js'),'utf8');
 assert.match(src,/monkCast=root\.VoidCrowd\?\.monks/);assert.match(src,/VoidNPCDevice\?\.tag\?\.\(node,\{monk:true\}\)/);assert.match(src,/monkPlan:!!p\.monk/);
 assert.ok(N.isMonk({metadata:{monk:true}}),'the metadata marks them for ncz-nightlife.js and npc-device.js');
});

test('the three monks are registered crowd looks with the game\'s clips, loaded with the street (not the District interior)',()=>{
 assert.deepEqual(C.monks,LOOKS);
 for(const look of LOOKS){for(const c of ['idle','talk','walk','watch'])assert.ok(C.clips[look].includes(c),look+' '+c);
  assert.ok(!Object.values(C.casts).some(cast=>cast.includes(look)),'ordinary crowd spots never get a monk');
  const file=R('void-runner/assets/models/crowd/'+look+'.glb'),size=fs.statSync(file).size;assert.ok(size>1e6&&size<7e6,look+' is game sized ('+size+')');
  const j=glb(file),anims=j.animations.map(a=>a.name);for(const c of C.clips[look])assert.ok(anims.some(a=>a===c||a.endsWith('-'+c)),look+' carries '+c+' ('+anims+')');
  assert.equal(j.skins.length,1,look+' is one skinned figure');let tris=0;for(const m of j.meshes)for(const p of m.primitives)tris+=j.accessors[p.indices].count/3;assert.ok(tris<40000,look+' '+tris+' triangles');
  assert.ok(fs.existsSync(R('tools/animation-pipeline/characters/'+look+'.json')),look+' spec');}
 const street=C.models('neochinatown','high','street'),inside=C.models('neochinatown','high','interior');
 for(const look of LOOKS){assert.ok(street['crowd:'+look],look+' on the street');assert.equal(inside['crowd:'+look],undefined,look+' not in the interior');}
});

test('Zen Zephyr has his own seated model with a neck and head the speaker\'s gaze can turn',()=>{
 const m=T.MODEL;assert.equal(m.asset,'npc-zen-zephyr');assert.equal(m.file,'assets/models/crowd/npc-zen-zephyr.glb');assert.ok(m.height>1&&m.height<1.6);assert.deepEqual(m.seat,[0,22]);
 const file=R('void-runner/'+m.file),size=fs.statSync(file).size;assert.ok(size>5e5&&size<7e6,'game sized ('+size+')');
 const j=glb(file),names=j.nodes.map(n=>n.name);assert.ok(names.includes('zz:Head'),names.join());assert.ok(names.includes('zz:Neck'),names.join());
 const head=j.nodes.find(n=>n.name==='zz:Head'),neck=j.nodes.find(n=>n.name==='zz:Neck');assert.ok(neck.children.includes(j.nodes.indexOf(head)),'the head turns on the neck');
 assert.ok(j.nodes.find(n=>n.name==='zz:Head').children?.length,'the head carries its mesh');
 const npcLook=/(^|[:_ .|])Head$/;assert.match('crowd:npc-zen-zephyr-zz:Head',npcLook,'npc-look.js finds the head by name');
 const b=fs.readFileSync(R('void-runner/temple-build.js'),'utf8');assert.match(b,/character:'zen-zephyr',monk:true/);assert.match(b,/assets\.instance\(id,monk\)/);
});

test('the Temple\'s monks: more on higher quality, praying at the altars or walking the aisles and the courtyard, never on the walk up to the dais',()=>{
 assert.deepEqual(['low','medium','high','ultra'].map(q=>T.monksFor(q).length),[2,5,7,7]);
 const solids=T.solids(),inside=([x,z],pad)=>solids.some(s=>Math.abs(x-s.position[0])<s.size[0]/2+pad&&Math.abs(z-s.position[2])<s.size[2]/2+pad);
 const corridor=([x,z])=>Math.abs(x)<4&&z>-40&&z<T.DAIS.z-T.DAIS.r+.5;
 const prompts=T.INTERACTIONS.map(i=>[i.position[0],i.position[2]]);
 for(const m of T.MONKS){assert.ok(LOOKS.includes(m.look),m.id);
  const pts=m.kind==='pray'?[m.at]:Array.from({length:21},(_,i)=>[m.path[0][0]+(m.path[1][0]-m.path[0][0])*i/20,m.path[0][1]+(m.path[1][1]-m.path[0][1])*i/20]);
  for(const p of pts){assert.ok(!inside(p,.35),m.id+' clear of walls and furniture at '+p);assert.ok(!corridor(p),m.id+' off the walk to the dais at '+p);
   for(const q of prompts)assert.ok(Math.hypot(p[0]-q[0],p[1]-q[1])>1.2,m.id+' does not stand on a prompt at '+q);}
  if(m.kind==='pray')assert.ok(Math.hypot(m.face[0]-m.at[0],m.face[1]-m.at[1])<2.5,'faces their altar');}
 assert.ok(T.MONKS.every(m=>m.kind==='pray'||Math.hypot(m.path[1][0]-m.path[0][0],m.path[1][1]-m.path[0][1])>10));
 const b=fs.readFileSync(R('void-runner/temple-build.js'),'utf8');assert.match(b,/VoidNPCDevice\?\.tag\?\.\(n,\{monk:true\}\)/);assert.match(b,/monkSpeed/);
});
