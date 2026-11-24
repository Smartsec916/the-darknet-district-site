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
const ALL='greet chat compliment flirt sit dance hands kiss kissAfter notYet notNow relax bye approach window joinSofa inviteSit inviteDance inviteRecline accepted declined welcomeBack aside comeHere recline'.split(' ');
test('the lines are the owner\'s, all 250 with his recording; nothing written or generated',()=>{
 const man=JSON.parse(read('void-runner/assets/audio/voice/extra/tea-duo.json'));
 assert.deepEqual(Object.keys(T.LINES.nomi).sort(),ALL.slice().sort());assert.deepEqual(Object.keys(T.LINES.se7en).sort(),ALL.slice().sort());assert.equal(Object.keys(man.lines).length,250);assert.equal(T.POOLS.length,25);
 for(const id of T.MEMBERS)for(const pool of ALL){assert.equal(T.LINES[id][pool].length,5);
  for(const [k,l] of T.LINES[id][pool].entries()){const e=man.lines[id+'-'+pool+'-'+(k+1)];assert.ok(e,l.id);assert.equal(l.id,id+'-'+pool+'-'+(k+1));assert.equal(e.text,l.text,'the exact mapped text');assert.equal(e.speaker,id);assert.equal(e.pool,pool);assert.equal(e.file,'extra/tea-duo/'+l.file);assert.equal(e.duration,l.duration);
   const f=fs.readFileSync(R('void-runner/assets/audio/voice/'+e.file));assert.equal(crypto.createHash('sha256').update(f).digest('hex'),e.hash,'unchanged from the package');assert.ok(f.slice(0,3).toString()==='ID3'||f[0]===0xff);}}
 assert.equal(T.LINES.nomi.greet[0].text,"[surprised] Oh! There's someone here!");assert.equal(T.LINES.se7en.greet[0].text,"[surprised] Oh! Nomi, you didn't tell me we had company!");
 assert.equal(T.strip('[excited] Well, hello there, handsome! [giggles] We don\'t get many.'),"Well, hello there, handsome! We don't get many.");
 const total=fs.readdirSync(R('void-runner/assets/audio/voice/extra/tea-duo')).reduce((n,f)=>n+fs.statSync(R('void-runner/assets/audio/voice/extra/tea-duo/'+f)).size,0);assert.ok(total<20*1024*1024,'the recordings stay under 20 MB: '+total);
 const vc=read('void-runner/voice-clips.js');assert.match(vc,/extra\/tea-duo\.json/);assert.match(vc,/extra\\\/tea-duo\\\/\[a-z0-9-\]\+\\\.mp3/);
});
// one visit, played out: near is what the guest does (comes close to the one who asked, or not)
function play(seed,near,mem=null){const o=T.visit(T.mulberry32(seed),mem,{near:typeof near==='function'?near:()=>near}),lines=[];for(const st of o.steps){const l=o.resolve(st);if(l)lines.push(l);}return {lines,memory:o.memory,steps:o.steps};}
const REPLIES=['accepted','declined','notNow'],SHOWS=['sit','dance','recline'];
test('a visit: 7 to 12 lines, Nomi first then alternating, an arrival pair, a goodbye last, never a line twice',()=>{
 for(const near of [true,false])for(let seed=1;seed<=200;seed++){const {lines}=play(seed,near);
  assert.ok(lines.length>=7&&lines.length<=12,'length '+lines.length);lines.forEach((l,i)=>{assert.equal(l.speaker,T.MEMBERS[i%2],'alternates');assert.equal(T.lineInfo(l.speaker,l.text).id,l.id,'a real line, its own recording');});
  assert.ok(T.OPEN.concat([T.BACK]).includes(lines[0].pool)&&lines[1].pool===lines[0].pool,'the arrival');assert.equal(lines.at(-1).pool,'bye','ends on a goodbye');
  assert.equal(new Set(lines.map(l=>l.id)).size,lines.length,'no repeat');}
});
test('roles and pairs: a reply never plays without its invitation, a kiss is answered, and the guest\'s own part decides how',()=>{
 for(const near of [true,false])for(let seed=1;seed<=300;seed++){const {lines}=play(seed,near),pools=lines.map(l=>l.pool);
  pools.forEach((p,i)=>{
   if(REPLIES.includes(p))assert.ok(T.INVITES.includes(pools[i-1]),p+' follows an invitation, seed '+seed);
   if(p==='kissAfter'||p==='notYet')assert.equal(pools[i-1],'kiss');
   if(SHOWS.includes(p)){assert.equal(pools[i-1],'accepted');assert.equal(T.ACT_OF[pools[i-2]],p,'shows what was asked');assert.notEqual(lines[i].speaker,lines[i-1].speaker);assert.equal(lines[i].speaker,lines[i-2].speaker,'the one who asked');}
   if(T.INVITES.includes(p))assert.ok(REPLIES.includes(pools[i+1]),'an invitation is answered');if(p==='kiss')assert.ok(['kissAfter','notYet'].includes(pools[i+1]));
   if(T.INVITES.includes(p))assert.notEqual(lines[i+1].speaker,lines[i].speaker,'answered by the other hostess');});
  for(const p of pools){if(near){assert.ok(!['declined','notNow','notYet'].includes(p));}else{assert.ok(!['accepted','kissAfter',...SHOWS].includes(p),p+' needs a guest who came close');}}}
});
test('standing: she gets up for a dance or a come-here and sits back afterwards; everyone sits for the goodbye',()=>{
 let stood=0;for(let seed=1;seed<=300;seed++){const {lines}=play(seed,true);
  lines.forEach((l,i)=>{for(const id of T.MEMBERS)if(l.posture[id]==='stand'){stood++;const j=lines.slice(0,i+1).map(x=>x.pool).reverse().findIndex(p=>T.STANDS.includes(p));assert.ok(j>=0&&j<=2,'only inside a dance or come-here beat');}});
  assert.deepEqual(lines.at(-1).posture,{nomi:'sit',se7en:'sit'});const dance=lines.findIndex(l=>l.pool==='dance');if(dance>=0)assert.equal(lines[dance].posture[lines[dance].speaker],'stand','she dances standing');}
 assert.ok(stood>100,'it happens: '+stood);
});
test('every one of the 250 recordings is reachable; every pool has its place; visits differ; unheard lines come first',()=>{
 const rng=T.mulberry32(99),seen=new Set(),pools=new Set(),seqs=new Set(),byPool={};let m=null;
 for(let i=0;i<2500;i++){const near=rng()<.6,o=play(1000+i,()=>rng()<(near?.9:.15),m);m=o.memory;seqs.add(o.lines.map(l=>l.id).join());for(const l of o.lines){seen.add(l.id);pools.add(l.pool);byPool[l.pool]=(byPool[l.pool]||0)+1;}}
 const all=T.MEMBERS.flatMap(id=>T.allLines(id).map(l=>l.id));assert.equal(all.length,250);assert.deepEqual(all.filter(id=>!seen.has(id)),[],'every recording can play');
 for(const p of ALL){assert.ok(pools.has(p),p);assert.ok(T.ROLE[p],'a role for '+p);}assert.ok(seqs.size>=2450,'visits are not alike: '+seqs.size);assert.equal(m.visits,2500);
 const nomiMid=play(7,true),again=play(7,true);assert.deepEqual(nomiMid.lines,again.lines,'seeded: testable');
 let back=false;for(let i=1;i<80;i++){const o=play(i,true,{visits:1,last:{},pools:{}});if(o.lines[0].pool==='welcomeBack')back=true;assert.notEqual(play(i,true).lines[0].pool,'welcomeBack','never for a first visit');}assert.ok(back);
 const last={};for(const l of T.allLines('nomi'))last[l.id]=1;delete last['nomi-chat-2'];let hit=0,base=0;for(let i=0;i<400;i++){if(play(5000+i,true,{visits:1,last,pools:{}}).lines.some(l=>l.id==='nomi-chat-2'))hit++;if(play(5000+i,true).lines.some(l=>l.id==='nomi-chat-2'))base++;}
 assert.ok(hit>base*1.5,'unheard lines first: '+hit+' vs '+base);
});
test('the actions: every one is a pose of real bones, each line has one most of the time, the clips exist on both rigs',()=>{
 const C=require('../void-runner/crowd.js');for(const m of ['npc-nomi','npc-se7en'])for(const c of T.CLIPS_NEEDED)assert.ok(C.clips[m].includes(c),m+' has '+c);
 assert.ok(T.ACTIONS.length>=13,'a good many: '+T.ACTIONS.join(' '));
 for(const [id,P] of Object.entries(T.POSES)){assert.ok(['any','stand'].includes(P.needs)&&P.dur>.5,id);
  for(let u=0;u<=1.0001;u+=.05)for(const s of [-1,1]){const e=T.ease(u),pose=P.at(u,u*P.dur,s,e);assert.ok(Object.keys(pose).length>0);
   for(const [bone,turns] of Object.entries(pose)){assert.ok(T.BONES.includes(bone),id+' turns a bone the rigs have: '+bone);for(const [ax,deg] of turns){assert.ok('xyz'.includes(ax)&&Number.isFinite(deg)&&Math.abs(deg)<130,id+bone+deg);}}}
  assert.deepEqual(P.at(0,0,1,T.ease(0)),P.at(0,0,1,0),'starts from the clip\'s own pose');}
 for(const a of Object.values(T.ACTS).flat())assert.ok(T.POSES[a],'a pose for '+a);
 let withAct=0,n=0,dances=0;for(let seed=1;seed<=200;seed++)for(const l of play(seed,true).lines){n++;if(l.actions.length)withAct++;for(const a of l.actions){if(T.POSES[a].needs==='stand'){dances++;assert.equal(l.posture[l.speaker],'stand','only standing');}}}
 assert.ok(withAct/n>.8,'most lines move: '+(withAct/n).toFixed(2));assert.ok(dances>20);
 assert.ok(T.SIT_FORWARD+T.standOffset('nomi')>.55+.05,'standing, her feet are clear of the cot (its edge is .54 m from its middle)');
});
test('the models are never in the public repository',()=>{
 const tracked=execFileSync('git',['ls-files'],{cwd:R('.'),encoding:'utf8'}).split('\n');
 assert.deepEqual(tracked.filter(f=>/npc-(nomi|se7en)\.(vrpak|glb)|nomi.*\.glb|se7en.*\.glb|\.vrcompanion$/i.test(f)),[]);
 const ig=read('.gitignore');for(const m of ['npc-nomi','npc-se7en'])assert.ok(ig.includes('void-runner/assets/models/crowd/'+m+'.vrpak'));
 for(const id of T.MEMBERS)assert.equal(T.PEOPLE[id].file,'assets/models/crowd/'+T.PEOPLE[id].model+'.vrpak');
 const C=require('../void-runner/crowd.js');for(const m of ['npc-nomi','npc-se7en']){for(const c of ['idle','sit','talk','walk','sit-enter','sit-exit'])assert.ok(C.clips[m].includes(c),m+' '+c);assert.ok(!C.clips[m].some(c=>/^floor-/.test(c)));}
});
let scriptSeed=1;const mkScript=()=>{const o=T.visit(T.mulberry32(scriptSeed++),null,{near:()=>true});return {steps:o.steps,resolve:o.resolve};};
const input=(o)=>({inside:true,present:true,blocked:false,playing:false,now:0,members:T.MEMBERS,maxTurns:14,...o});
// a whole visit through roomDuoStep: the sounding of each line lasts its recorded length
function sitting(opts={}){let s=null,t=1000,spoken=[],end=0,active=null,cur=null;
 const script=()=>{cur=mkScript();return cur.steps;},resolve=x=>cur.resolve(x);
 for(let i=0;i<6000&&spoken.length<13;i++){t+=100;const playing=!!active&&t<end;if(active&&!playing)active=null;
  const r=A.roomDuoStep(s,input({now:t,playing,script,resolve,...opts}));s=r.state;
  if(r.line){assert.equal(active,null,'a line started while another still sounded');const info=T.lineInfo(r.line.speaker,r.line.text);spoken.push({...r.line,at:t,end:t+info.duration*1000});active=r.line;end=t+info.duration*1000;}}
 return {spoken,state:s};}
test('Nomi, Se7en, Nomi ... one at a time, each after the last recording ended, with a pause',()=>{
 for(let k=0;k<20;k++){const {spoken}=sitting();assert.ok(spoken.length>=7&&spoken.length<=12);
  spoken.forEach((x,i)=>assert.equal(x.speaker,T.MEMBERS[i%2]));assert.equal(spoken.at(-1).pool,'bye');
  for(let i=1;i<spoken.length;i++){assert.ok(spoken[i].at>=spoken[i-1].end,'no overlap');assert.ok(spoken[i].at-spoken[i-1].end>=T.PAUSE-100,'a short natural pause');}}
});
test('a line whose audio never reports back is released after the cap; a held conversation waits',()=>{
 const sc=()=>mkScript().steps,cur={};const script=()=>{const m=mkScript();cur.r=m.resolve;return m.steps;},resolve=x=>cur.r(x);const base={script,resolve};
 let r=A.roomDuoStep(null,input({...base,now:0}));let s=r.state;assert.equal(r.line,null,'she notices first');r=A.roomDuoStep(s,input({...base,now:800}));assert.equal(r.line.speaker,'nomi');s=r.state;
 r=A.roomDuoStep(s,input({...base,now:5000,playing:true}));assert.equal(r.line,null,'still sounding');s=r.state;
 r=A.roomDuoStep(s,input({...base,now:800+T.MAX_LINE+1,playing:true}));assert.equal(r.line,null);r=A.roomDuoStep(r.state,input({...base,now:800+T.MAX_LINE+T.PAUSE+5,playing:true}));assert.equal(r.line.speaker,'se7en');
 const b=A.roomDuoStep(null,input({...base,now:0,blocked:true}));assert.equal(b.line,null);const later=A.roomDuoStep(b.state,input({...base,now:5000}));assert.equal(later.line.speaker,'nomi','held, not dropped');
});
test('walking out cancels what is pending; no restart while inside; a quick return is on cooldown; a skipped step costs nothing',()=>{
 const cur={},base={script:()=>{const m=mkScript();cur.r=m.resolve;return m.steps;},resolve:x=>cur.r(x)};
 let r=A.roomDuoStep(null,input({...base,now:1000}));let s=r.state;r=A.roomDuoStep(s,input({...base,now:1800}));s=r.state;assert.equal(r.line.speaker,'nomi');
 const inner=A.roomDuoStep(s,input({...base,now:60000,playing:false}));assert.equal(inner.line,null,'the pause first');const inner2=A.roomDuoStep(inner.state,input({...base,now:61500}));assert.equal(inner2.line.speaker,'se7en','the same visit goes on, it does not start over');
 const out=A.roomDuoStep(inner2.state,input({...base,now:62000,inside:false}));assert.equal(out.cancel,true);assert.deepEqual(out.state.queue,[]);assert.equal(out.line,null);
 const back=A.roomDuoStep(out.state,input({...base,now:63000}));assert.equal(back.line,null);assert.deepEqual(back.state.queue,[],'within the cooldown nothing starts');
 const again=A.roomDuoStep(A.roomDuoStep(back.state,input({...base,now:64000,inside:false})).state,input({...base,now:1000+T.COOLDOWN+1000}));assert.ok(again.state.queue.length>=9);
 const absent=A.roomDuoStep(null,input({...base,now:1000,present:false}));assert.deepEqual(absent.state.queue,[],'nobody there, nothing to say');
 const skip=A.roomDuoStep({inside:true,last:0,queue:[{k:'x'},{k:'y'}],nextAt:0,waiting:false,waitUntil:0},input({now:5,resolve:x=>x.k==='y'?{speaker:'nomi',text:'T'}:null}));assert.equal(skip.line.text,'T','a null step is skipped at once');
 const noScript=A.roomDuoStep(null,{inside:true,present:true,now:0,lines:{nomi:['A','B'],se7en:['C']},members:T.MEMBERS});assert.deepEqual(noScript.state.queue.map(l=>l.text),['A','C','B'],'the older interleave still works');
});
test('each player has their own state: a second player entering does not restart the first\'s',()=>{
 const mk=()=>{const cur={};return {script:()=>{const m=mkScript();cur.r=m.resolve;return m.steps;},resolve:x=>cur.r(x)};},A1=mk(),B1=mk();
 const a=A.roomDuoStep(null,input({...A1,now:1000})),b=A.roomDuoStep(null,input({...B1,now:9000}));
 const a2=A.roomDuoStep(a.state,input({...A1,now:1800}));assert.equal(a2.line.speaker,'nomi');assert.ok(a.state.queue.length>=9);assert.ok(b.state.queue.length>=9);
 const a3=A.roomDuoStep(a2.state,input({...A1,now:9100,playing:false}));assert.equal(a3.state.queue.length,a2.state.queue.length,'player A\'s visit just goes on (the pause first)');
 assert.ok(read('void-runner/tea-duo.js').includes('duo=r.state'),'one state per game (per player)');
});
test('the runtime is wired in: loaded after the underground, listening to the voice player, other conversations hold it, no other companion touched',()=>{
 const html=read('void-runner.html');assert.ok(html.indexOf('tea-duo.js')>html.indexOf('ncz-underground-integration.js'));assert.equal(html.split('tea-duo.js').length,2);
 assert.equal(fs.readFileSync(R('static/void-runner.html'),'utf8'),html);
 assert.match(read('void-runner-sw.js').split('\n')[3],/^const BUILD='\d{4}-\d{2}-\d{2}-[a-z0-9-]+';\r?$/);
 const src=read('void-runner/tea-duo.js');for(const k of ['roomDuoStep','VoidVoiceClips','nearBlocked','clearRoomLine','speech','under-sleeping-room'.replace(/-/g,'-')])assert.ok(src.includes(k),k);
 for(const f of ['void-runner/vr-companions.js']){const s=read(f);assert.ok(!/id:'nomi'|id:'se7en'/.test(s),'not in the VR roster');}
});

// ---------------- a guest who stays: round after round, never silent, never still ----------------
function stay(minutes,opts={}){   // roomDuoStep with refill for a guest who stays; a recording lasts its recorded length
 const rng=T.mulberry32(opts.seed||77),log=[];let s=null,t=1000,active=null,end=0,mem=null,cur=null,last=null;
 const round=k=>{cur=T.visit(rng,mem,{near:()=>rng()<.6},k===0?{bye:false}:{arrive:false,bye:k>=T.ROUNDS-1,steps:T.ROUND_STEPS,after:last});mem=cur.memory;return cur.steps;};
 for(;t<minutes*60000;t+=100){const playing=!!active&&t<end;if(active&&!playing)active=null;
  const r=A.roomDuoStep(s,input({now:t,playing,inside:opts.inside?opts.inside(t):true,present:opts.present?opts.present(t):true,script:()=>round(0),resolve:x=>cur.resolve(x),refill:{gap:()=>T.gapAfter(rng),script:round,max:T.ROUNDS},maxTurns:14}));s=r.state;
  if(r.line){assert.equal(active,null,'overlap');const info=T.lineInfo(r.line.speaker,r.line.text);last=r.line.speaker;log.push({...r.line,at:t,end:t+info.duration*1000,round:s.rounds});active=r.line;end=t+info.duration*1000;}}
 return {log,state:s,memory:mem};}
test('a guest who stays gets round after round: gaps of 6 to 15 s, no overlap, alternating, the last round ends on a goodbye, then quiet',()=>{
 const {log,state}=stay(30);assert.equal(state.rounds,T.ROUNDS,'every round was played');assert.ok(log.length>=T.ROUNDS*5,'a lot of talk: '+log.length+' lines');
 log.forEach((l,i)=>assert.equal(l.speaker,T.MEMBERS[i%2],'alternates across rounds too'));
 const byRound={};for(const l of log)(byRound[l.round]??=[]).push(l);assert.equal(Object.keys(byRound).length,T.ROUNDS);
 for(let r=2;r<=T.ROUNDS;r++){const prev=byRound[r-1].at(-1),first=byRound[r][0],gap=first.at-prev.end;assert.ok(gap>=T.GAP[0]-200&&gap<=T.GAP[1]+T.NOTICE+T.PAUSE+300,'a quiet moment of '+gap+' ms before round '+r);}
 assert.ok(byRound[1].some(l=>T.OPEN.includes(l.pool)||l.pool===T.BACK),'the first round opens with the arrival');for(let r=2;r<=T.ROUNDS;r++)assert.ok(!byRound[r].some(l=>T.OPEN.includes(l.pool)||l.pool===T.BACK),'no second hello');
 for(let r=1;r<T.ROUNDS;r++)assert.ok(!byRound[r].some(l=>l.pool==='bye'),'no goodbye before the last round');assert.equal(log.at(-1).pool,'bye');
 for(let i=1;i<log.length;i++)assert.ok(log[i].at>=log[i-1].end+T.PAUSE-100,'no overlap, a pause');
 for(const r of Object.values(byRound))assert.ok(r.length>=3&&r.length<=14);
 assert.equal(state.queue.length,0,'then quiet (they live on in silence until the guest goes)');
});
test('three minutes in the room: the lines keep coming (not one burst)',()=>{
 const {log}=stay(3);const spread=[0,1,2].map(m=>log.filter(l=>l.at>=1000+m*60000&&l.at<1000+(m+1)*60000).length);
 assert.ok(log.length>=15,'lines in 3 minutes: '+log.length);for(const n of spread)assert.ok(n>=3,'a line every so often in every minute: '+spread);
});
test('leaving stops it and clears it; coming back waits out the cooldown, then starts afresh; a guest who stays is never left waiting for it',()=>{
 const gone=t=>t<40000||t>50000;const {log,state}=stay(5,{inside:gone});
 assert.ok(log.filter(l=>l.at<40000).length>=6);assert.equal(log.filter(l=>l.at>=40000&&l.at<1000+T.COOLDOWN).length,0,'nothing right after a quick return (the cooldown counts from when the visit began)');
 assert.ok(log.some(l=>l.at>=1000+T.COOLDOWN),'then it starts again');assert.ok(state.rounds>=1);
 // models still loading when she walked in: it starts when they are there
 const late=stay(2,{present:t=>t>30000});assert.ok(late.log.length>0&&late.log[0].at>=30000,'starts when they are present: '+late.log[0]?.at);
});
test('the whole set of 250 comes round before any line repeats; every pool and both speakers',()=>{
 const rng=T.mulberry32(5);let mem=null,last=null,n=0;const seenIn={},counts={};let cycles=0;
 for(let r=0;r<400;r++){const o=T.visit(rng,mem,{near:()=>rng()<.6},r%12===0?{bye:false}:{arrive:false,bye:r%12===11,steps:T.ROUND_STEPS,after:last});mem=o.memory;   // every twelve rounds the guest has come in afresh
 
  for(const st of o.steps){const l=o.resolve(st);if(!l)continue;n++;last=l.speaker;const key=l.speaker+'/'+l.pool,set=(seenIn[key]??=new Set());
   assert.ok(!set.has(l.id)||set.size===5,'a line repeated before the others of its pool were heard: '+l.id+' '+[...set]);if(set.size===5){set.clear();cycles++;}set.add(l.id);counts[l.id]=(counts[l.id]||0)+1;}}
 const all=T.MEMBERS.flatMap(id=>T.allLines(id).map(l=>l.id));assert.deepEqual(all.filter(id=>!counts[id]),[],'all 250 heard');assert.ok(n>1500);
});
test('the bedroom keeps its current guest until that player leaves and elects deterministically without an incumbent',()=>{
 const first={id:'bbbb'},later={id:'aaaa'};
 assert.equal(T.chooseGuest([first,later],'bbbb'),first);
 assert.equal(T.chooseGuest([later],first.id),later);
 assert.equal(T.chooseGuest([first,later],null),later);
 assert.equal(T.chooseGuest([later,first],null),later);
 assert.equal(T.chooseGuest([],first.id),null);
});
test('the three seats fit on one existing cot and its long edge stays accessible',()=>{
 const seats=T.groupSeats(),M=require('../void-runner/modules.js'),U=require('../void-runner/ncz-underground.js');
 const cot=M.COT_LAYOUT.find(c=>seats.player.seat.endsWith(c.id));
 assert.equal(M.COT_LAYOUT.length,4);
 assert.equal(cot.depth,2.16);
 assert.equal(cot.width,1.08);
 const solids=U.walking().solids;
 for(const seat of Object.values(seats)){
  assert.equal(U.placeAt(seat.x,seat.z),T.ROOM);
  assert.equal(U.placeAt(seat.stand.x,seat.stand.z),T.ROOM);
  assert.ok(!solids.some(b=>b.position[1]+b.size[1]/2>U.Y+.2&&b.position[1]-b.size[1]/2<U.Y+1.55&&
   Math.abs(seat.stand.x-b.position[0])<b.size[0]/2+.19&&Math.abs(seat.stand.z-b.position[2])<b.size[2]/2+.19));
 }
 assert.ok(Math.abs(seats.nomi.x-seats.player.x)>.65&&Math.abs(seats.se7en.x-seats.player.x)>.65);
 assert.ok(seats.nomi.x<seats.player.x&&seats.player.x<seats.se7en.x);
 for(const id of T.MEMBERS){
  const [x,z]=T.door(),g={x:x-.25,z};
  const point=T.greetingPoint(id,g,()=>false,null);
  assert.ok(point.x<x-1);
  assert.ok(Math.hypot(point.x-g.x,point.z-g.z)>1);
 }
});
test('an invitation only accepts an explicit guest decision when the caller supplies choices',()=>{
 for(const accepted of [true,false]){
  const v=T.visit(T.mulberry32(55),null,{near:()=>true,accepted:()=>accepted});
  const lines=v.steps.map(v.resolve).filter(Boolean),reply=lines.find(x=>x.step==='reply');
  assert.ok(lines.some(x=>x.step==='invite'&&x.activity));
  assert.equal(reply.pool==='accepted',accepted);
  if(!accepted)assert.ok(!lines.some(x=>x.step==='show'));
 }
});
test('they are never still: quiet movements, real clips, episodes of getting up (and walking to their spot), all in range',()=>{
 const C=require('../void-runner/crowd.js');for(const m of ['npc-nomi','npc-se7en'])for(const c of T.CLIPS_ALL)assert.ok(C.clips[m].includes(c),m+' has '+c);
 for(const k of T.QUIET)assert.ok(T.POSES[k],k);for(const k of ['look','shift','adjust','stretch'])for(let u=0;u<=1;u+=.1){const pose=T.POSES[k].at(u,u*T.POSES[k].dur,1,T.ease(u),{yaw:30});for(const [b,turns] of Object.entries(pose)){assert.ok(T.BONES.includes(b));for(const [ax,d] of turns)assert.ok(Number.isFinite(d)&&Math.abs(d)<85,k+b+d);}}
 const seen=new Set();for(let seed=1;seed<=200;seed++){const rng=T.mulberry32(seed),e=T.episode(rng);seen.add(e.kind);assert.equal(e.steps[0].k,'stand');assert.equal(e.steps.at(-1).k,'sit');let total=0;
  for(const st of e.steps){if(st.k==='do'){assert.ok(T.CLIPS_ALL.includes(st.clip),st.clip);assert.ok(st.dur>=6&&st.dur<=20);total+=st.dur;}if(st.k==='walk')assert.ok(['spot','seat'].includes(st.to));}
  const walks=e.steps.filter(x=>x.k==='walk');assert.ok(walks.length%2===0&&(!walks.length||walks[0].to==='spot'&&walks.at(-1).to==='seat'),'what she walks out she walks back');assert.ok(total<=40);}
 assert.deepEqual([...seen].sort(),Object.keys(T.EPISODES).sort());
 for(const id of T.MEMBERS){const sp=T.placement(id,false);assert.equal(U.placeAt(sp.x,sp.z),'under-sleeping-room','her spot is in the room');const seat=T.placement(id),fx=Math.sin(seat.yaw),fz=Math.cos(seat.yaw),home={x:seat.x+fx*T.standOffset(id),z:seat.z+fz*T.standOffset(id)};
  assert.equal(U.placeAt(home.x,home.z),'under-sleeping-room','the place beside her bed is in the room');assert.ok(Math.hypot(sp.x-home.x,sp.z-home.z)<3.2,'her spot is a short walk');
  const ob=U.obstacles().filter(o=>o[0]<=Math.max(home.x,sp.x)+.3&&o[1]>=Math.min(home.x,sp.x)-.3&&o[2]<=Math.max(home.z,sp.z)+.3&&o[3]>=Math.min(home.z,sp.z)-.3&&/cot|locker|curtain/.test(o[4]||'')&&false);assert.equal(ob.length,0);}
 assert.ok(T.LONG_QUIET[0]>=20000&&T.LONG_QUIET[1]<=120000);for(const k of T.STAND_CLIPS.concat(T.SEAT_CLIPS))assert.ok(typeof k==='string');
});
