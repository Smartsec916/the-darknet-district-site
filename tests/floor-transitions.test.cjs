// Sitting down to a floor pose and standing up from it (the owner, 21 Nov 2026, asked for a proper standing-up animation; a matching sit-down): ten one-shot clips per
// figure posed by code (tools/animation-pipeline/make_floor_poses.py TRANS), floor-<pose>-down / -up and the '-hi' pairs for the raised seats (cots, alcove benches).
// Checked here: every figure with the floor poses has them (and nobody else), each -down ends exactly on the loop's first frame and starts on the figure's idle, each -up
// the reverse (the numbers read from the files, meshopt-compressed idles decoded), the runtime's root motion matches the generator's, and the routine plays
// walk -> -down -> the loop -> -up -> walk at a cushion, a dais cushion and a cot, keeping the old cross-fade for a figure without the clips and the chair path unchanged.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ROOT=path.join(__dirname,'..'),R=f=>path.join(ROOT,f),read=f=>fs.readFileSync(R(f),'utf8');
const C=require(R('void-runner/crowd.js')),U=require(R('void-runner/ncz-underground.js')),SP=require(R('void-runner/ncz-street-pair.js')),NG=require(R('void-runner/npc-gestures.js'));
const DIR=R('void-runner/assets/models/crowd'),FLOOR=['floor-kneel','floor-cross','floor-knees'];
const MOVES=['kneel','cross','knees'].flatMap(p=>['floor-'+p+'-down','floor-'+p+'-up']).concat(['cross','knees'].flatMap(p=>['floor-'+p+'-down-hi','floor-'+p+'-up-hi']));

// ---- reading a GLB's clips (plain floats, or EXT_meshopt_compression ATTRIBUTES v0 as gltfpack writes the figures' own clips) ----
function glb(f){const b=fs.readFileSync(path.join(DIR,f+'.glb')),n=b.readUInt32LE(12),j=JSON.parse(b.subarray(20,20+n).toString('utf8'));return {j,bin:b.subarray(28+n)};}
function meshopt(src,count,stride){if(src[0]!==0xa0)throw new Error('meshopt version');let pos=1;const out=Buffer.alloc(count*stride),last=Buffer.from(src.subarray(src.length-stride)),block=Math.min((8192/stride|0)&~15,256);
 for(let v0=0;v0<count;v0+=block){const n=Math.min(block,count-v0),na=(n+15)&~15,groups=na/16;
  for(let k=0;k<stride;k++){const buf=Buffer.alloc(na),hs=(groups+3)>>2,head=src.subarray(pos,pos+hs);pos+=hs;
   for(let g=0;g<groups;g++){const bits=(head[g>>2]>>((g&3)*2))&3;if(!bits)continue;if(bits===3){src.copy(buf,g*16,pos,pos+16);pos+=16;continue;}
    const w=bits===1?2:4,esc=(1<<w)-1;let v=pos+2*w;for(let i=0;i<16;i++){const e=(src[pos+((i*w)>>3)]>>(8-w-((i*w)&7)))&esc;if(e===esc)buf[g*16+i]=src[v++];else buf[g*16+i]=e;}pos=v;}
   let p=last[k];for(let i=0;i<n;i++){const v=buf[i];p=(p+((v>>1)^(-(v&1)&0xff)))&0xff;out[(v0+i)*stride+k]=p;}last[k]=p;}}
 return out;}
function values({j,bin},ai){const a=j.accessors[ai],bv=j.bufferViews[a.bufferView],n={SCALAR:1,VEC3:3,VEC4:4}[a.type],e=bv.extensions&&bv.extensions.EXT_meshopt_compression;
 let data,stride;if(e){data=meshopt(bin.subarray(e.byteOffset||0,(e.byteOffset||0)+e.byteLength),e.count,e.byteStride);stride=e.byteStride;}else{data=bin.subarray(bv.byteOffset||0,(bv.byteOffset||0)+bv.byteLength);stride=bv.byteStride||n*4;}
 const out=[];for(let i=0;i<a.count;i++){const o=(a.byteOffset||0)+i*stride,v=[];for(let c=0;c<n;c++)v.push(data.readFloatLE(o+c*4));out.push(v);}return out;}
// a clip's first / last frame: {node: [path, value]} (rotation of every channel; the hips' translation)
function frame(g,name,last){const a=g.j.animations.find(x=>x.name===name);if(!a)return null;const out={};
 for(const ch of a.channels){const v=values(g,a.samplers[ch.sampler].output);out[ch.target.node+':'+ch.target.path]=v[last?v.length-1:0];}return out;}
const dur=(g,name)=>{const a=g.j.animations.find(x=>x.name===name);return Math.max(...a.samplers.map(s=>g.j.accessors[s.input].max[0]));};
const qclose=(a,b)=>{const d=Math.abs(a[0]*b[0]+a[1]*b[1]+a[2]*b[2]+a[3]*b[3]);return d>1-2e-6;};
const figures=()=>fs.readdirSync(DIR).filter(x=>x.endsWith('.glb')).map(x=>x.slice(0,-4));

test('every figure that has the floor poses carries the ten sit-down / stand-up clips (and nobody else); crowd.js lists them; the editors never offer them',()=>{
 let n=0;for(const f of figures()){const g=glb(f),names=(g.j.animations||[]).map(a=>a.name);
  if(!names.includes('floor-kneel')){for(const c of MOVES)assert.ok(!names.includes(c),f+' should not have '+c);continue;}
  n++;for(const c of MOVES){assert.ok(names.includes(c),f+' '+c);assert.ok(C.clips[f].includes(c),f+' crowd.js lists '+c);}}
 assert.ok(n>=60,'figures: '+n);assert.deepEqual(C.FLOOR_MOVES,MOVES);
 for(const k of ['vr-companion-f','vr-companion-ava','npc-kai','npc-zane','npc-dax','studio-warrior','npc-blackrock-robe'])for(const c of MOVES)assert.ok(!(C.clips[k]||[]).includes(c),k);
 for(const c of MOVES){assert.ok(SP.CLIP_LIST.includes(c),'Reverie and Lace list '+c);assert.doesNotMatch(c,SP.BANNED);}
 // not choosable: the gestures / Doing lists filter them out; the loops stay
 const iris=NG.clipsFor('iris');if(iris.ok){assert.ok(!iris.clips.some(c=>MOVES.includes(c.id)),'never a "Doing" / gesture choice');}
 const inv=JSON.parse(read('void_runner_admin_inventory.json'));assert.doesNotMatch(JSON.stringify(inv.npcGestures||{}),/floor-[a-z]+-(down|up)/,'not in the server\'s gesture lists');
 assert.doesNotMatch(read('void_runner_live_content.py'),/floor-[a-z]+-(down|up)/,'not a cast clip');assert.doesNotMatch(read('void-runner/mission-mechanics.js'),/floor-[a-z]+-(down|up)/);
 const lib=JSON.parse(read('tools/animation-pipeline/clips.json')).clips;for(const c of MOVES)assert.equal(lib[c].source,'pose','a Blender rebuild skips '+c);
 const idx=JSON.parse(read('void-runner/npc-clip-index.json'));assert.ok(idx.files['npc-cook-old'].clips.some(c=>c[0]==='floor-kneel-up'),'the clip index is current');
 assert.doesNotMatch(read('tools/animation-pipeline/make_floor_poses.py'),/import (requests|urllib)|https?:/,'no outside service');});

test('seamless: each -down starts on the idle and ends on the loop\'s first frame, each -up starts on it and ends on the idle; lengths as the runtime expects',()=>{
 const py=read('tools/animation-pipeline/make_floor_poses.py'),M={};
 for(const m of py.match(/MOVES = \{[^}]+\}/)[0].matchAll(/'([a-z-]+)': \((-?[\d.]+), ([\d.]+)\)/g))M[m[1]]={d:+m[2],hb:+m[3]};
 const T={};for(const m of py.match(/TRANS = \{[^}]+\}/)[0].matchAll(/'(floor-[a-z-]+)': \('([a-z-]+)', ([\d.]+)\)/g))T[m[1]]={move:m[2],dur:+m[3]};
 assert.equal(Object.keys(T).length,10);for(const [k,v] of Object.entries(M)){assert.equal(SP.FLOOR_MOVE[k].d,v.d,k+' d');assert.equal(SP.FLOOR_MOVE[k].hb,v.hb,k+' hb');}
 for(const [c,t] of Object.entries(T)){const dir=c.includes('-up')?'up':'down';assert.equal(SP.FLOOR_MOVE[t.move][dir],t.dur,c+' length');}
 let checked=0;
 for(const f of figures()){const g=glb(f);if(!g.j.animations||!g.j.animations.some(a=>a.name==='floor-kneel'))continue;checked++;
  const N=g.j.nodes,H=N.findIndex(n=>n.name==='mixamorig:Hips'),rest=i=>N[i].rotation||[0,0,0,1],restT=N[H].translation||[0,0,0],idle=frame(g,'idle',false);
  const want=(fr,key)=>{if(fr[key])return fr[key];const [node,p]=key.split(':');return p==='rotation'?rest(+node):restT;};
  for(const c of MOVES){const loop=c.replace(/-(down|up)(-hi)?$/,''),L=frame(g,loop,false),a=frame(g,c,false),z=frame(g,c,true),down=c.includes('-down');
   const ends=down?[[a,idle,'start on the idle'],[z,L,'end on '+loop]]:[[a,L,'start on '+loop],[z,idle,'end on the idle']];
   for(const [got,ref,what] of ends)for(const key of Object.keys(got)){const v=want(ref,key),w=got[key];
    if(key.endsWith('rotation'))assert.ok(qclose(w,v),f+' '+c+' '+what+': node '+N[+key.split(':')[0]].name+' '+w.map(x=>x.toFixed(4))+' vs '+v.map(x=>x.toFixed(4)));
    else assert.ok(Math.hypot(w[0]-v[0],w[1]-v[1],w[2]-v[2])<1e-4,f+' '+c+' '+what+': hips '+w+' vs '+v);}
   // every joint the loop moves (but the fingers, which keep what the clip before left) is in the transition
   for(const key of Object.keys(L))if(!/Hand(Thumb|Index|Middle|Ring|Pinky)/.test(N[+key.split(':')[0]].name))assert.ok(a[key],f+' '+c+' moves '+key);
   assert.ok(Math.abs(dur(g,c)-SP.FLOOR_MOVE[c.replace(/^floor-|-(down|up)/g,'')][down?'down':'up'])<1e-3,f+' '+c+' length');}}
 assert.ok(checked>=60,'checked '+checked);});

const runTo=(s,plan,ctx,stop,max=4000,dt=1/30)=>{const log=[];for(let i=0;i<max;i++){s=SP.routineStep(s,dt,()=>.5,{...SP.config,sit:[3,3]},{plan,...ctx});log.push({mode:s.mode,clip:s.clip,once:s.once,after:s.after,x:s.x,z:s.z,lift:s.lift||0});if(stop&&stop(s,log))break;}return {s,log};};
const modes=log=>log.map(l=>l.mode).filter((m,i,a)=>m!==a[i-1]);

test('the routine: walk onto the cushion, the -down clip once then the pose, the -up clip once, walk off; origin and lift move with the clip, no jumps',()=>{
 const has=()=>true;
 for(const [id,act,pose] of [['under-tea-room-cushion-c-w','sit-kneel','kneel'],['under-tea-room-cushion-c-s','sit-cross','cross'],['under-tea-room-cushion-a-e','sit-knees','knees'],
  ['under-sleeping-room-cot-2','sit-knees','knees'],['under-sleeping-room-cot-1','sit-cross','cross'],['under-alcove-3-bench-up','sit-knees','knees']]){
  const seat=U.seatsAll().find(s=>s.id===id),f=SP.standOf(seat),hi=seat.h>SP.RAISED,mv=SP.FLOOR_MOVE[pose+(hi?'-hi':'')],down='floor-'+pose+'-down'+(hi?'-hi':''),up='floor-'+pose+'-up'+(hi?'-hi':'');
  const plan={key:'k'+id+act,mode:'stay',x:f.x,z:f.z,yaw:0,actions:[act]};
  const {log}=runTo({mode:'plan-go',x:f.x+.9,z:f.z+.4,yaw:0,left:0,clip:'idle'},plan,{has},(s,l)=>{const u=l.findIndex(q=>q.mode==='floor-up');return u>=0&&l.length>u+150;});
  const seq=modes(log);assert.ok(seq.join(' ').includes('floor-turn floor-down sit floor-up floor-out'),id+': '+seq.join(' '));
  const i0=log.findIndex(l=>l.mode==='floor-down'),i1=log.findIndex(l=>l.mode==='sit'),i2=log.findIndex(l=>l.mode==='floor-up'),i3=log.findIndex((l,i)=>i>i2&&l.mode!=='floor-up');
  assert.equal(log[i0].clip,down);assert.ok(log[i0].once&&log[i0].after==='floor-'+pose,'the -down plays once, then the pose');assert.equal(log[i1].clip,'floor-'+pose);
  assert.equal(log[i2].clip,up);assert.ok(log[i2].once&&log[i2].after==='idle','the -up plays once');
  assert.ok(Math.abs((i1-i0)/30-mv.down)<.1&&Math.abs((i3-i2)/30-mv.up)<.1,id+' the routine waits the clip\'s length');
  // where she stands before (S) and sits (O): S = d in front of O along the seat's way; the lift h - hb at S, h seated
  const O=SP.along(seat,-SP.FLOOR_BACK[pose]),S=SP.along(seat,-SP.FLOOR_BACK[pose]+mv.d);
  assert.ok(Math.hypot(log[i0].x-S.x,log[i0].z-S.z)<.02,id+' starts at S');assert.ok(Math.hypot(log[i1].x-O.x,log[i1].z-O.z)<.02,id+' seated at O');
  assert.ok(Math.abs(log[i0].lift-Math.max(0,seat.h-mv.hb))<.02,id+' standing lift '+log[i0].lift);assert.ok(Math.abs(log[i1].lift-seat.h)<1e-6,id+' seated at the seat\'s top');
  assert.ok(Math.abs(log[i0-1].lift-log[i0].lift)<.03,id+': already up on the cushion before the clip (stepped on): '+log[i0-1].lift+' -> '+log[i0].lift);
  for(let i=Math.max(1,i0-40);i<Math.min(log.length,i3+40);i++){const a=log[i-1],b=log[i];assert.ok(Math.hypot(b.x-a.x,b.z-a.z)<.06,id+' no jump at '+i+' '+b.mode);assert.ok(Math.abs(b.lift-a.lift)<.05,id+' no lift jump at '+i+' '+a.mode+'->'+b.mode+' '+a.lift+'->'+b.lift);}
  // root motion r = smoothstep(k): mid-clip she is half-way
  const mid=log[i0+Math.round(mv.down*15)];const half=SP.along(seat,-SP.FLOOR_BACK[pose]+mv.d*.5);assert.ok(Math.hypot(mid.x-half.x,mid.z-half.z)<.03,id+' half-way at half time');
  if(hi)assert.ok(Math.abs(mid.lift-(seat.h-mv.hb*.5))<.02,id+' lifted half of hb at half time');
  // off again: the lift back to 0 within a second of walking
  // off again: from a dais, a cot or a bench out to its stand point on the floor (a plain cushion: she stays on it, her plan point is its middle)
  if(Array.isArray(seat.stand)){const k=log.findIndex((l,i)=>i>i3&&l.mode!=='floor-out');assert.ok(k>0&&log[k].lift<1e-6&&Math.hypot(log[k].x-f.x,log[k].z-f.z)<.05,id+' back on the floor at the stand point: '+(k>0&&log[k].lift));}}
 // no kneeling on a raised seat (no seat offers it), so no clip for it
 assert.equal(SP.floorClip({step:{h:.44},pose:'kneel'},'down'),null);assert.equal(SP.floorClip({step:{h:.12},pose:'cross'},'up'),'floor-cross-up');assert.equal(SP.floorClip({step:{h:.46},pose:'knees'},'down'),'floor-knees-down-hi');});

test('a figure without the clips: the cross-fade as before; the chair at a stool: unchanged',()=>{
 const seat=U.seatsAll().find(s=>s.id==='under-tea-room-cushion-c-w'),f=SP.standOf(seat),plan={key:'old',mode:'stay',x:f.x,z:f.z,yaw:0,actions:['sit-kneel']};
 for(const ctx of [{},{has:c=>!/-(down|up)/.test(c)}]){const {log}=runTo({mode:'plan-go',x:f.x+.9,z:f.z,yaw:0,left:0,clip:'idle'},plan,ctx,(s,l)=>l.some(q=>q.mode==='floor-out')&&s.mode==='walk');
  const seq=modes(log).join(' ');assert.ok(seq.includes('floor-in floor-turn sit floor-out'),seq);assert.ok(!/floor-down|floor-up/.test(seq));assert.ok(!log.some(l=>/-(down|up)/.test(l.clip)));}
 const st=U.seatsAll().find(x=>x.id==='under-mahjong-stool-e-w'),sf=SP.standOf(st),p2={key:'stool',mode:'stay',x:sf.x,z:sf.z,yaw:0,actions:['sit']};
 const {log}=runTo({mode:'plan-go',x:sf.x,z:sf.z+1,yaw:0,left:0,clip:'idle',seatBack:.1},p2,{has:()=>true},null,1500);const seq=modes(log).join(' ');
 assert.ok(['chair-in','settle','sit-down','sit','stand-up','step-off'].every(x=>seq.includes(x)),seq);assert.ok(!/floor-/.test(seq));
 const sd=log.find(l=>l.mode==='sit-down');assert.equal(sd.clip,'sit-enter');});

test('the runtimes play the clip once and hand the figure\'s clip list to the routine',()=>{
 const sp=read('void-runner/ncz-street-pair.js'),made=read('void-runner/npc-made.js');
 assert.match(sp,/has:c=>!!her\.anim&&her\.anim\.has\(c\)/);assert.match(sp,/playOnce\(s\.clip,s\.after\|\|/);
 assert.match(made,/has:c=>!!p\.anim&&!!p\.anim\.has&&p\.anim\.has\(c\)/);assert.match(made,/if\(p\.s\.once&&p\.s\.after&&p\.anim\.playOnce\)p\.anim\.playOnce\(clip,p\.s\.after\)/);
 assert.match(read('void-runner-sw.js').split('\n')[3],/^const BUILD='\d{4}-\d{2}-\d{2}-[a-z0-9-]+';$/);
 assert.equal(read('void-runner.html'),read('static/void-runner.html'));});
