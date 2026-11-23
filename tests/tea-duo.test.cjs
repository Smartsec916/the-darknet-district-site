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
test('the lines are the owner\'s, each with his recording; nothing written or generated',()=>{
 const man=JSON.parse(read('void-runner/assets/audio/voice/extra/tea-duo.json'));
 for(const id of T.MEMBERS){assert.equal(T.LINES[id].length,5);
  for(const [k,l] of T.LINES[id].entries()){const e=man.lines[id+'-greet-'+(k+1)];assert.ok(e,id+k);assert.equal(e.text,l.text);assert.equal(e.speaker,id);assert.equal(e.file,'extra/tea-duo/'+l.file);assert.equal(e.duration,l.duration);
   const f=fs.readFileSync(R('void-runner/assets/audio/voice/'+e.file));assert.equal(crypto.createHash('sha256').update(f).digest('hex'),e.hash,'unchanged from the package');assert.ok(f.slice(0,3).toString()==='ID3'||f[0]===0xff);
   assert.ok(/\[[a-z]+\]/.test(l.text)||l.text.length>0);}}
 assert.equal(T.LINES.nomi[0].text,"[surprised] Oh! There's someone here!");assert.equal(T.LINES.se7en[0].text,"[surprised] Oh! Nomi, you didn't tell me we had company!");
 assert.equal(Object.keys(man.lines).length,10);assert.equal(T.strip('[excited] Well, hello there, handsome! [giggles] We don\'t get many.'),"Well, hello there, handsome! We don't get many.");
 const vc=read('void-runner/voice-clips.js');assert.match(vc,/extra\/tea-duo\.json/);assert.match(vc,/extra\\\/tea-duo\\\/\[a-z0-9-\]\+\\\.mp3/);
});
test('the models are never in the public repository',()=>{
 const tracked=execFileSync('git',['ls-files'],{cwd:R('.'),encoding:'utf8'}).split('\n');
 assert.deepEqual(tracked.filter(f=>/npc-(nomi|se7en)\.(vrpak|glb)|nomi.*\.glb|se7en.*\.glb|\.vrcompanion$/i.test(f)),[]);
 const ig=read('.gitignore');for(const m of ['npc-nomi','npc-se7en'])assert.ok(ig.includes('void-runner/assets/models/crowd/'+m+'.vrpak'));
 for(const id of T.MEMBERS)assert.equal(T.PEOPLE[id].file,'assets/models/crowd/'+T.PEOPLE[id].model+'.vrpak');
 const C=require('../void-runner/crowd.js');for(const m of ['npc-nomi','npc-se7en']){for(const c of ['idle','sit','talk','walk','sit-enter','sit-exit'])assert.ok(C.clips[m].includes(c),m+' '+c);assert.ok(!C.clips[m].some(c=>/^floor-/.test(c)));}
});
const lines=T.linesOf(),input=(o)=>({inside:true,present:true,blocked:false,playing:false,now:0,lines,members:T.MEMBERS,...o});
// a whole visit: the sounding of each line lasts its recorded length
function visit(opts={}){let s=null,t=1000,spoken=[],end=0,active=null;const log=[];
 for(let i=0;i<4000&&spoken.length<12;i++){t+=100;const playing=!!active&&t<end;if(active&&!playing)active=null;
  const r=A.roomDuoStep(s,input({now:t,playing,...opts}));s=r.state;
  if(r.line){assert.equal(active,null,'a line started while another still sounded');const info=T.lineInfo(r.line.speaker,r.line.text);spoken.push({...r.line,at:t,end:t+info.duration*1000});active=r.line;end=t+info.duration*1000;}}
 return {spoken,state:s};}
test('Nomi, Se7en, Nomi, Se7en ... one at a time, each after the last recording ended, with a pause',()=>{
 const {spoken}=visit();assert.equal(spoken.length,10);assert.deepEqual(spoken.map(x=>x.speaker),['nomi','se7en','nomi','se7en','nomi','se7en','nomi','se7en','nomi','se7en']);
 assert.equal(spoken[0].text,T.LINES.nomi[0].text);assert.equal(spoken[9].text,T.LINES.se7en[4].text,'ends on Se7en\'s last greeting');
 for(let i=1;i<spoken.length;i++){assert.ok(spoken[i].at>=spoken[i-1].end,'no overlap');assert.ok(spoken[i].at-spoken[i-1].end>=T.PAUSE-100,'a short natural pause');}
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
 const again=A.roomDuoStep(A.roomDuoStep(back.state,input({now:64000,inside:false})).state,input({now:1000+T.COOLDOWN+1000}));assert.deepEqual(again.state.queue.length,10);
 const absent=A.roomDuoStep(null,input({now:1000,present:false}));assert.deepEqual(absent.state.queue,[],'nobody there, nothing to say');
});
test('each player has their own state: a second player entering does not restart the first\'s',()=>{
 const a=A.roomDuoStep(null,input({now:1000})),b=A.roomDuoStep(null,input({now:9000}));
 const a2=A.roomDuoStep(a.state,input({now:1800}));assert.equal(a2.line.speaker,'nomi');assert.equal(a.state.queue.length,10);assert.equal(b.state.queue.length,10);
 const a3=A.roomDuoStep(a2.state,input({now:9100,playing:false}));assert.equal(a3.state.queue.length,9,'player A\'s visit just goes on');
 assert.ok(read('void-runner/tea-duo.js').includes('duo=r.state'),'one state per game (per player)');
});
test('the runtime is wired in: loaded after the underground, listening to the voice player, other conversations hold it, no other companion touched',()=>{
 const html=read('void-runner.html');assert.ok(html.indexOf('tea-duo.js')>html.indexOf('ncz-underground-integration.js'));assert.equal(html.split('tea-duo.js').length,2);
 assert.equal(fs.readFileSync(R('static/void-runner.html'),'utf8'),html);
 assert.match(read('void-runner-sw.js').split('\n')[3],/^const BUILD='\d{4}-\d{2}-\d{2}-[a-z0-9-]+';\r?$/);
 const src=read('void-runner/tea-duo.js');for(const k of ['roomDuoStep','VoidVoiceClips','nearBlocked','clearRoomLine','speech','under-sleeping-room'.replace(/-/g,'-')])assert.ok(src.includes(k),k);
 for(const f of ['void-runner/vr-companions.js']){const s=read(f);assert.ok(!/id:'nomi'|id:'se7en'/.test(s),'not in the VR roster');}
});
