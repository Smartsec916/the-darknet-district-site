// Nomi and Se7en in the underground sleeping room (void-runner/tea-duo.js): seats, floor, the owner's own lines and recordings, the alternating exchange.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const R=f=>path.join(__dirname,'..',f),read=f=>fs.readFileSync(R(f),'utf8');
const T=require('../void-runner/tea-duo.js'),U=require('../void-runner/ncz-underground.js'),M=require('../void-runner/modules.js'),A=require('../void-runner/npc-advanced-interactions.js');

test('both start seated on the two beds whose curtains are open, Nomi on the one nearer the door',()=>{
 const s=T.seating(),open=M.COT_LAYOUT.filter(c=>c.open).map(c=>'under-sleeping-room-'+c.id);
 assert.equal(open.length,2);assert.deepEqual([s.nomi.id,s.se7en.id].sort(),open.slice().sort());
 const d=T.door(),dist=c=>Math.hypot(c.x-d[0],c.z-d[1]);assert.ok(dist(s.nomi)<dist(s.se7en));
 assert.equal(U.placeAt(d[0]-.3,d[1]),'under-sleeping-room');assert.equal(U.placeAt(d[0]+.3,d[1]),'under-tea-room','the door is the wall shared with the tea room');
 for(const id of T.MEMBERS){const p=T.placement(id);assert.equal(p.pose,'sit');assert.equal(p.y,U.Y);assert.equal(U.placeAt(p.x,p.z),'under-sleeping-room');
  const cot=s[id];assert.ok(Math.hypot(p.x-cot.x,p.z-cot.z)<.5,'on her own cot');assert.equal(p.yaw,cot.yaw,'facing the aisle');}
 assert.ok(Math.abs(Math.abs(s.nomi.yaw-s.se7en.yaw)-Math.PI)<1e-3,'they face each other across the aisle');
 assert.notEqual(s.nomi.id,s.se7en.id);
});
test('the standing spots (PR #512) are the fallback; no Tao, nobody in the tea room, the VR room or the fight pit',()=>{
 const st=T.MEMBERS.map(id=>T.placement(id,false));
 for(const p of st){assert.equal(p.pose,'stand');assert.equal(U.placeAt(p.x,p.z),'under-sleeping-room');}
 assert.ok(Math.hypot(st[0].x-st[1].x,st[0].z-st[1].z)>1.5);
 const fl=M.TYPES.flophouse;assert.equal(fl.spots.some(x=>x[0]==='tao'),false);assert.deepEqual(T.MEMBERS,['nomi','se7en']);
 for(const id of T.MEMBERS){assert.ok(T.PEOPLE[id].adult);assert.ok(!/reverie|lace|cat/.test(T.PEOPLE[id].model));}
 const src=read('void-runner/tea-duo.js');assert.ok(!/tao/i.test(src.replace(/\/\*[\s\S]*?\*\//,'')),'no Tao');assert.ok(!/fight-pit|VoidVRCompanions\.(register|list)/.test(src));
});
test('the floor lift puts the lowest point on the floor, once (an absolute height, never added to)',()=>{
 assert.ok(Math.abs(T.floorLift(-3.952,-2.049,-3)-.952)<1e-9);assert.equal(T.floorLift(0,1.8,0),0);assert.equal(T.floorLift(NaN,1,0),0);assert.equal(T.floorLift(2,1,0),0);
 const C=require('../void-runner/vr-companions.js');for(const [a,b,f] of [[-.95,.95,0],[-3.95,-2.05,-3]])assert.equal(T.floorLift(a,b,f),C.floorOffset(a,b,f),'the same rule as the VR companions (PR #512)');
 const src=read('void-runner/tea-duo.js');assert.match(src,/asset\.position\.y=0;/);assert.match(src,/asset\.position\.y=floorLift\(/);assert.ok(!/asset\.position\.(y\+=|addInPlace)/.test(src));
});
const USED=['greet','approach','welcomeBack','chat','compliment','flirt','relax','window','aside','bye'];
test('the lines are the owner\'s, each with his recording; nothing written or generated',()=>{
 const man=JSON.parse(read('void-runner/assets/audio/voice/extra/tea-duo.json'));
 assert.deepEqual(Object.keys(T.LINES.nomi),USED);assert.deepEqual(Object.keys(T.LINES.se7en),USED);assert.equal(Object.keys(man.lines).length,100);
 const SKIPPED='sit dance hands kiss kissAfter notYet notNow joinSofa inviteSit inviteDance inviteRecline accepted declined comeHere recline'.split(' ');
 for(const e of Object.values(man.lines))assert.ok(!SKIPPED.includes(e.pool),'a touch, kiss or invitation pool is not published');
 for(const id of T.MEMBERS)for(const pool of USED){assert.equal(T.LINES[id][pool].length,5);
  for(const [k,l] of T.LINES[id][pool].entries()){const e=man.lines[id+'-'+pool+'-'+(k+1)];assert.ok(e,l.id);assert.equal(l.id,id+'-'+pool+'-'+(k+1));assert.equal(e.text,l.text,'the exact mapped text');assert.equal(e.speaker,id);assert.equal(e.pool,pool);assert.equal(e.file,'extra/tea-duo/'+l.file);assert.equal(e.duration,l.duration);
   const f=fs.readFileSync(R('void-runner/assets/audio/voice/'+e.file));assert.equal(crypto.createHash('sha256').update(f).digest('hex'),e.hash,'unchanged from the package');assert.ok(f.slice(0,3).toString()==='ID3'||f[0]===0xff);}}
 assert.equal(T.LINES.nomi.greet[0].text,"[surprised] Oh! There's someone here!");assert.equal(T.LINES.se7en.greet[0].text,"[surprised] Oh! Nomi, you didn't tell me we had company!");
 assert.equal(T.strip('[excited] Well, hello there, handsome! [giggles] We don\'t get many.'),"Well, hello there, handsome! We don't get many.");
 const total=fs.readdirSync(R('void-runner/assets/audio/voice/extra/tea-duo')).reduce((n,f)=>n+fs.statSync(R('void-runner/assets/audio/voice/extra/tea-duo/'+f)).size,0);assert.ok(total<8*1024*1024,'the recordings stay under 8 MB');
 const vc=read('void-runner/voice-clips.js');assert.match(vc,/extra\/tea-duo\.json/);assert.match(vc,/extra\\\/tea-duo\\\/\[a-z0-9-\]\+\\\.mp3/);
});
test('a visit: 6 to 8 lines, Nomi first then alternating, an arrival pair, a goodbye last, never a line twice, pools varied',()=>{
 for(let seed=1;seed<=200;seed++){const rng=T.mulberry32(seed),{script}=T.visit(rng,null);
  assert.ok(script.length>=6&&script.length<=8,'length '+script.length);script.forEach((l,i)=>{assert.equal(l.speaker,T.MEMBERS[i%2]);assert.ok(T.lineInfo(l.speaker,l.text),'a real line');assert.equal(T.lineInfo(l.speaker,l.text).id,l.id);});
  assert.ok(T.OPEN.includes(script[0].pool)&&script[1].pool===script[0].pool,'the arrival');assert.equal(script.at(-1).pool,'bye','ends on a goodbye');
  assert.equal(new Set(script.map(l=>l.id)).size,script.length,'no repeat');
  for(let i=2;i<script.length-1;i++){assert.ok(T.MIDDLE.includes(script[i].pool));assert.notEqual(script[i].pool,script[i-1].pool);if(i>=3)assert.notEqual(script[i].pool,script[i-2].pool);}}
});
test('every pool turns up; different visits differ; lines not heard lately come first; the memory is per session',()=>{
 const rng=T.mulberry32(42);let m=null;const seen=new Set(),seqs=new Set(),ids=new Map();
 for(let i=0;i<60;i++){const o=T.visit(rng,m);m=o.memory;o.script.forEach(l=>{seen.add(l.pool);ids.set(l.id,(ids.get(l.id)||0)+1);});seqs.add(o.script.map(l=>l.id).join());}
 for(const pool of USED)assert.ok(seen.has(pool),'pool '+pool+' appears');assert.ok(seqs.size>=58,'visits are not alike: '+seqs.size);assert.equal(m.visits,60);
 assert.ok(ids.size>=90,'most of the 100 recordings are heard: '+ids.size);
 const nomiMid=T.visit(T.mulberry32(7),null),again=T.visit(T.mulberry32(7),null);assert.deepEqual(nomiMid.script,again.script,'seeded: testable');
 // a repeat visitor (this game has seen them) can be welcomed back, never a first one
 let back=false;for(let i=1;i<80;i++){const o=T.visit(T.mulberry32(i),{visits:1,last:{},pools:{}});if(o.script[0].pool==='welcomeBack')back=true;assert.notEqual(T.visit(T.mulberry32(i),null).script[0].pool,'welcomeBack');}assert.ok(back);
 // recency: with every other line just heard, an unheard one is far likelier
 const last={};for(const l of T.allLines('nomi'))last[l.id]=1;delete last['nomi-chat-2'];let hit=0;for(let i=0;i<300;i++){const o=T.visit(T.mulberry32(1000+i),{visits:1,last,pools:{}});if(o.script.some(l=>l.id==='nomi-chat-2'))hit++;}
 let base=0;for(let i=0;i<300;i++){if(T.visit(T.mulberry32(1000+i),null).script.some(l=>l.id==='nomi-chat-2'))base++;}assert.ok(hit>base*1.8,'unheard lines first: '+hit+' vs '+base);
});
test('the models are never in the public repository',()=>{
 const tracked=execFileSync('git',['ls-files'],{cwd:R('.'),encoding:'utf8'}).split('\n');
 assert.deepEqual(tracked.filter(f=>/npc-(nomi|se7en)\.(vrpak|glb)|nomi.*\.glb|se7en.*\.glb|\.vrcompanion$/i.test(f)),[]);
 const ig=read('.gitignore');for(const m of ['npc-nomi','npc-se7en'])assert.ok(ig.includes('void-runner/assets/models/crowd/'+m+'.vrpak'));
 for(const id of T.MEMBERS)assert.equal(T.PEOPLE[id].file,'assets/models/crowd/'+T.PEOPLE[id].model+'.vrpak');
 const C=require('../void-runner/crowd.js');for(const m of ['npc-nomi','npc-se7en']){for(const c of ['idle','sit','talk','walk','sit-enter','sit-exit'])assert.ok(C.clips[m].includes(c),m+' '+c);assert.ok(!C.clips[m].some(c=>/^floor-/.test(c)));}
});
let scriptSeed=1;const input=(o)=>({inside:true,present:true,blocked:false,playing:false,now:0,script:()=>T.visit(T.mulberry32(scriptSeed++),null).script,members:T.MEMBERS,maxTurns:12,...o});
// a whole visit: the sounding of each line lasts its recorded length
function visit(opts={}){let s=null,t=1000,spoken=[],end=0,active=null;const log=[];
 for(let i=0;i<4000&&spoken.length<9;i++){t+=100;const playing=!!active&&t<end;if(active&&!playing)active=null;
  const r=A.roomDuoStep(s,input({now:t,playing,...opts}));s=r.state;
  if(r.line){assert.equal(active,null,'a line started while another still sounded');const info=T.lineInfo(r.line.speaker,r.line.text);spoken.push({...r.line,at:t,end:t+info.duration*1000});active=r.line;end=t+info.duration*1000;}}
 return {spoken,state:s};}
test('Nomi, Se7en, Nomi ... one at a time, each after the last recording ended, with a pause',()=>{
 for(let k=0;k<20;k++){const {spoken}=visit();assert.ok(spoken.length>=6&&spoken.length<=8);
  spoken.forEach((x,i)=>assert.equal(x.speaker,T.MEMBERS[i%2]));assert.equal(spoken.at(-1).pool,'bye');
  for(let i=1;i<spoken.length;i++){assert.ok(spoken[i].at>=spoken[i-1].end,'no overlap');assert.ok(spoken[i].at-spoken[i-1].end>=T.PAUSE-100,'a short natural pause');}}
});
test('a line whose audio never reports back is released after the cap; a held conversation waits',()=>{
 let r=A.roomDuoStep(null,input({now:0}));let s=r.state;assert.equal(r.line,null,'she notices first');r=A.roomDuoStep(s,input({now:800}));assert.equal(r.line.speaker,'nomi');s=r.state;
 r=A.roomDuoStep(s,input({now:5000,playing:true}));assert.equal(r.line,null,'still sounding');s=r.state;
 r=A.roomDuoStep(s,input({now:800+T.MAX_LINE+1,playing:true}));assert.equal(r.line,null);r=A.roomDuoStep(r.state,input({now:800+T.MAX_LINE+T.PAUSE+5,playing:true}));assert.equal(r.line.speaker,'se7en');
 const b=A.roomDuoStep(null,input({now:0,blocked:true}));assert.equal(b.line,null);const later=A.roomDuoStep(b.state,input({now:5000}));assert.equal(later.line.speaker,'nomi','held, not dropped');
});
test('walking out cancels what is pending; no restart while inside; a quick return is on cooldown',()=>{
 let r=A.roomDuoStep(null,input({now:1000}));let s=r.state;r=A.roomDuoStep(s,input({now:1800}));s=r.state;assert.equal(r.line.speaker,'nomi');
 const inner=A.roomDuoStep(s,input({now:60000,playing:false}));assert.equal(inner.line,null,'the pause first');const inner2=A.roomDuoStep(inner.state,input({now:61500}));assert.equal(inner2.line.speaker,'se7en','the same visit goes on, it does not start over');
 const out=A.roomDuoStep(inner2.state,input({now:62000,inside:false}));assert.equal(out.cancel,true);assert.deepEqual(out.state.queue,[]);assert.equal(out.line,null);
 const back=A.roomDuoStep(out.state,input({now:63000}));assert.equal(back.line,null);assert.deepEqual(back.state.queue,[],'within the cooldown nothing starts');
 const again=A.roomDuoStep(A.roomDuoStep(back.state,input({now:64000,inside:false})).state,input({now:1000+T.COOLDOWN+1000}));assert.ok(again.state.queue.length>=6);
 const absent=A.roomDuoStep(null,input({now:1000,present:false}));assert.deepEqual(absent.state.queue,[],'nobody there, nothing to say');
 const noScript=A.roomDuoStep(null,{inside:true,present:true,now:0,lines:{nomi:['A','B'],se7en:['C']},members:T.MEMBERS});assert.deepEqual(noScript.state.queue.map(l=>l.text),['A','C','B'],'the older interleave still works');
});
test('each player has their own state: a second player entering does not restart the first\'s',()=>{
 const a=A.roomDuoStep(null,input({now:1000})),b=A.roomDuoStep(null,input({now:9000}));
 const a2=A.roomDuoStep(a.state,input({now:1800}));assert.equal(a2.line.speaker,'nomi');assert.ok(a.state.queue.length>=6);assert.ok(b.state.queue.length>=6);
 const a3=A.roomDuoStep(a2.state,input({now:9100,playing:false}));assert.equal(a3.state.queue.length,a.state.queue.length-1,'player A\'s visit just goes on');
 assert.ok(read('void-runner/tea-duo.js').includes('duo=r.state'),'one state per game (per player)');
});
test('the runtime is wired in: loaded after the underground, listening to the voice player, other conversations hold it, no other companion touched',()=>{
 const html=read('void-runner.html');assert.ok(html.indexOf('tea-duo.js')>html.indexOf('ncz-underground-integration.js'));assert.equal(html.split('tea-duo.js').length,2);
 assert.equal(fs.readFileSync(R('static/void-runner.html'),'utf8'),html);
 assert.match(read('void-runner-sw.js').split('\n')[3],/^const BUILD='\d{4}-\d{2}-\d{2}-[a-z0-9-]+';\r?$/);
 const src=read('void-runner/tea-duo.js');for(const k of ['roomDuoStep','VoidVoiceClips','nearBlocked','clearRoomLine','speech','under-sleeping-room'.replace(/-/g,'-')])assert.ok(src.includes(k),k);
 for(const f of ['void-runner/vr-companions.js']){const s=read(f);assert.ok(!/id:'nomi'|id:'se7en'/.test(s),'not in the VR roster');}
});
