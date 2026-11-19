/* The Blackrock Cult Room (19 Nov 2026): the editable scene timeline (cult-room.js), the choreography maths (the six spaced exactly 60 degrees apart, reaching their places
   together; the exit line with the initiate first and even gaps), the hack step with a camera feed (done when the recording is saved), the Gallery's videos, the page's
   scripts and the robed figure's model and clips. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p),read=p=>fs.readFileSync(R(p),'utf8');
const fresh=()=>{for(const k of Object.keys(require.cache))if(k.includes('void-runner'+path.sep))delete require.cache[k];};
const CR=()=>require(R('void-runner/cult-room.js'));
const near=(a,b,e=1e-3)=>Math.abs(a-b)<=e;
const ang=a=>{while(a>Math.PI)a-=2*Math.PI;while(a<-Math.PI)a+=2*Math.PI;return a;};

test('the six places: on one circle round the initiate, exactly 60 degrees apart, each facing the centre',()=>{
 const C=CR();for(const r of [2,2.6,3.4]){const s=C.circleSpots(6,r);assert.equal(s.length,6);
  for(const p of s){assert.ok(near(Math.hypot(p.x,p.z),r,.002),'on the circle');const toC=Math.atan2(-p.x,-p.z);assert.ok(Math.abs(ang(p.yaw-toC))<.01,'faces the centre');}
  const phis=s.map(p=>Math.atan2(p.x,p.z)).sort((a,b)=>a-b);for(let i=0;i<6;i++){const d=ang(phis[(i+1)%6]-phis[i]);assert.ok(near(Math.abs(d)<1e-6?0:((d+2*Math.PI)%(2*Math.PI)),Math.PI/3,.002),'60 degrees apart');}
  assert.ok(near(C.lineGap(r),r*Math.PI/3),'the entry gap is one sixth of the circle');}
});

test('the entry: one line through the door, equal gaps, the same speed, all six on their own places at the same moment',()=>{
 const C=CR(),cs=C.compile(C.defaultScene()),enter=C.SIX.map(id=>cs.tracks[id].find(s=>s.type==='path'));
 assert.ok(enter.every(Boolean));const t1=enter[0].t1;assert.ok(enter.every(s=>near(s.t1,t1)&&near(s.t0,enter[0].t0)),'they start and stop together');
 assert.ok(enter.every(s=>near(s.speed,C.DEF.speed)),'the slow processional speed');
 for(let k=1;k<6;k++)assert.ok(near(enter[k-1].s0-enter[k].s0,C.lineGap(C.DEF.radius)),'equal gaps in the line');
 const ends=C.SIX.map(id=>C.poseAt(cs,id,t1+.5));for(const p of ends)assert.ok(near(Math.hypot(p.x,p.z),C.DEF.radius,.02),'stopped on the circle');
 const ph=ends.map(p=>Math.atan2(p.x,p.z)).sort((a,b)=>a-b);for(let i=0;i<5;i++)assert.ok(near(ph[i+1]-ph[i],Math.PI/3,.01),'evenly spaced');
 // in the line, nobody comes closer than the gap to the one in front (no overtaking, no bunching)
 for(let t=enter[0].t0;t<t1;t+=1){const ps=C.SIX.map(id=>C.poseAt(cs,id,t)).filter(p=>p.visible);for(let i=0;i<ps.length;i++)for(let j=i+1;j<ps.length;j++)assert.ok(Math.hypot(ps[i].x-ps[j].x,ps[i].z-ps[j].z)>1.2,'apart at '+t.toFixed(0)+' s');}
 // the walk clip plays at speed / stride: the feet stay on the floor
 const w=C.poseAt(cs,'robed-1',enter[0].t0+5);assert.equal(w.clip,'walk');assert.ok(near(w.rate,C.DEF.speed/C.STRIDE));assert.ok(w.rate<.6,'well below a normal walk');
});

test('synchronised turns, the initiate kneels, rises, walks to the altar, takes the card; the exit: the initiate first, then the six in an even line; the door closes; the end',()=>{
 const C=CR(),sc=C.defaultScene(),cs=C.compile(sc);assert.deepEqual(cs.problems,[]);
 assert.equal(C.poseAt(cs,'initiate',1).clip,'kneel');assert.ok(near(C.poseAt(cs,'initiate',1).x,0)&&near(C.poseAt(cs,'initiate',1).z,0),'kneeling at the centre');assert.ok(near(C.poseAt(cs,'initiate',1).yaw,0),'facing the owl');
 const turns=C.SIX.map(id=>cs.tracks[id].filter(s=>s.type==='turn'));for(const k of [0,1])assert.ok(turns.every(l=>near(l[k].t0,turns[0][k].t0)&&near(l[k].t1,turns[0][k].t1)),'turn '+(k+1)+' together');
 const tOwl=turns[0][1].t1+.1;for(const id of C.SIX)assert.ok(Math.abs(C.poseAt(cs,id,tOwl).yaw)<.02,id+' faces the owl');
 const card=cs.events.find(e=>e.type==='card');const ip=C.poseAt(cs,'initiate',card.t);assert.ok(ip.z>4,'at the altar');assert.ok(ip.clip!=='kneel');
 const order=cs.events.find(e=>e.type==='order').order;assert.equal(order[0],'initiate','the initiate leads');assert.equal(new Set(order).size,7);
 // a while into the exit, everyone in the room is in one line on the way to the door, in that order, gaps no smaller than 1.2 m
 const ex=cs.events.find(e=>e.type==='order').t;for(const t of [ex+30,ex+40]){const ps=order.map(id=>({id,...C.poseAt(cs,id,t)})).filter(p=>p.visible&&Math.abs(p.x)<.01);for(let i=1;i<ps.length;i++)assert.ok(ps[i].z>ps[i-1].z+1.2,'in order with a gap');}
 const end=cs.dur;for(const id of C.ACTORS)assert.equal(C.poseAt(cs,id,end).visible,false,id+' has left');assert.equal(C.doorAt(cs,end),0,'the door is shut');
 assert.ok(cs.dur>120&&cs.dur<300,'about three minutes');
});

test('no invented lines: every line slot starts empty (silence, nothing shown), with a speaker; the owner\'s choreography order',()=>{
 const C=CR(),sc=C.defaultScene(),lines=sc.beats.filter(b=>b.act==='line');
 assert.ok(lines.length>=8);assert.ok(lines.every(b=>b.text===''),'empty');assert.ok(lines.every(b=>C.SPEAKERS.includes(b.who)));
 const cs=C.compile(sc);for(const e of cs.events.filter(e=>e.type==='line'))assert.deepEqual(C.lineAt(cs,e.t+.5),[],'nothing shown for an empty line');
 const acts=sc.beats.map(b=>b.act).filter(a=>a!=='pause'&&a!=='door'&&a!=='line');assert.deepEqual(acts,['enter','turn','rise','turn','walk','card','anim','exit']);
 const sc2=JSON.parse(JSON.stringify(sc));sc2.beats.find(b=>b.act==='line').text='Words the owner wrote.';const c2=C.compile(sc2),e=c2.events.find(x=>x.type==='line'&&x.text);assert.deepEqual(C.lineAt(c2,e.t+.5),[{who:'robed-1',name:'Robed figure 1',text:'Words the owner wrote.'}]);
 assert.ok(e.dur>=2,'a written line lasts long enough to read');
});

test('scene problems in plain words; the server repeats the rules',()=>{
 const C=CR(),bad=(beats,re)=>{const p=C.sceneProblems({beats});assert.ok(p.some(x=>re.test(x)),JSON.stringify(p));};
 bad([{act:'rise'},{act:'rise'}],/not kneeling/);bad([{act:'line',who:'robed-1',text:''}],/not in the room/);bad([{act:'card'}],/walk to the altar first/);bad([{act:'exit'}],/enter first/);
 bad([{act:'enter'},{act:'enter'}],/already in the room/);bad([{act:'line',who:'initiate',text:'<b>x</b>'}],/plain text/);bad([{act:'pause'}],/how long/);bad([{act:'dance'}],/unknown kind/);
 bad([{act:'pause',secs:2,extra:1}],/unknown fields/);bad([{act:'line',who:'initiate',anim:'shock'}],/kneeling/);bad([{act:'enter'},{act:'rise'},{act:'exit'},{act:'line',who:'initiate'}],/everyone has left/);
 assert.deepEqual(C.sceneProblems({radius:9,beats:[{act:'pause',secs:1}]}),['the circle radius is 2 to 3.4 m.']);
 const py=read('void_runner_live_content.py');assert.match(py,/def feed_scene_problems/);assert.match(py,/def feed_problems/);assert.match(py,/'apartments', 'feeds'\]/);assert.match(py,/'needs', 'feed', \*ASK_STEP_KEYS/);
 assert.match(read('void_runner_drafts.py'),/feed_shape_problems/);
 const inv=JSON.parse(read('void_runner_admin_inventory.json'));assert.deepEqual(inv.feeds,C.inventory(),'the admin inventory is current');
});

function env(){fresh();
 const M=require(R('void-runner/mission-log.js')),B=require(R('void-runner/beginner.js')),C=require(R('void-runner/campaign.js')),U=require(R('void-runner/universe.js')),MC=require(R('void-runner/mission-content.js')),G=require(R('void-runner/mission-givers.js'));
 B.register(M);const givers=G.roster({registry:JSON.parse(read('tools/audio/npc-voice-registry.json')),people:require(R('void-runner/district-people.js')).npcs(),story:require(R('void-runner/story-content.js')).characters,temple:require(R('void-runner/temple.js')).MODEL});
 const e={B,Missions:M,U,givers};MC.snapshot(e);MC.apply(null,e);return {e,M,C,MC,G};}
const ID='draft-cult-m1';
const tree=(objectives,feeds)=>[{id:'draft-cult',name:'The camera',missions:[{id:ID,number:73,title:'The camera',type:'side',giver:'admin',offer:[{who:'admin',text:'There is a camera.'}],objectives,...(feeds?{feeds}:{})}]}];

test('a hack step with a camera feed: listed under Other, checked, sent to the game; the hack alone does not complete it, the saved recording does',()=>{
 const x=env(),CRM=CR(),feeds=[{id:'cam1',room:'blackrock-cult',scene:CRM.defaultScene()}],objs=[{id:'cam',kind:'hack',ap:'apt-main-w-96',feed:'cam1',label:'Hack the camera feed'},{id:'t',kind:'talk',npc:'iris',label:'Tell Iris'}];
 assert.ok(CRM.FEED_ROOMS.some(r=>r.id==='blackrock-cult'&&r.cat==='other'),'listed under Other');
 const d={format:x.MC.FORMAT,version:x.MC.VERSION,trees:tree(objs,feeds)},ctx={givers:new Map(x.e.givers.map(g=>[g.id,g])),places:x.G.placeIds()};assert.deepEqual(x.MC.check(d,ctx).errors,[]);
 const bad={format:x.MC.FORMAT,version:x.MC.VERSION,trees:tree([{...objs[0],feed:'nope'}],feeds)};assert.ok(x.MC.check(bad,ctx).errors.some(e=>/camera feeds/.test(e)));
 const sent=x.MC.fromDrafts({local:{trees:tree(objs,feeds)},givers:x.e.givers}).trees[0].missions[0];assert.equal(sent.feeds[0].room,'blackrock-cult');assert.equal(sent.objectives[0].feed,'cam1');
 x.MC.apply(d,x.e,ctx);const s=x.C.startDistrictCampaign(x.C.fresh());s.story.flags.appearanceOffered=true;s.story.flags.podWakePending=false;
 const ev=e=>x.MC.treeEvent(s,x.e,e,x.M,x.C);ev({type:'talk',npcs:['admin']});
 const job=x.MC.hacksNow(s,x.e)[0];assert.equal(job.feed,'cam1');assert.equal(job.unlock,false,'a camera hack opens no door unless asked');
 assert.equal(ev({type:'hack',ap:'apt-main-w-96',mission:ID}).objective,null,'the hack alone does not complete it');assert.deepEqual(x.MC.hackedNow(s,x.e),[]);
 assert.equal(ev({type:'feed',ap:'apt-main-w-96',feed:'other',mission:ID}).objective,null,'another feed does not count');
 assert.equal(ev({type:'feed',ap:'apt-main-w-96',feed:'cam1',mission:ID}).objective,'cam','the saved recording completes it');
});

test('the Gallery keeps videos: 5% each, a size and length cap; never posted; not offered as photos',()=>{
 fresh();const G=require(R('void-runner/device-gallery.js'));
 assert.equal(G.unitsOf([{kind:'video'},{},{}]),7);assert.equal(G.VIDEO_PCT,5);assert.ok(G.videoOk(20e6,190));assert.ok(!G.videoOk(G.VIDEO.maxBytes+1,60));assert.ok(!G.videoOk(1e6,0));assert.equal(G.clock(189),'3:09');
 const src=read('void-runner/device-gallery.js');assert.match(src,/async function addVideo/);assert.match(src,/if\(!p\|\|p\.kind==="video"\)return false/,'not posted');assert.match(src,/photos\.filter\(p=>p\.kind!=='video'\)/,'not offered as photos');
 assert.match(read('void-runner/device-v1.js'),/VoidGallery\.units\?\?/,'storage counts a video as 5%');
});

test('the page loads the scripts in order; the editor loads the scene editor; the robed figure has its clips; the owl is the owner\'s art; recording is automatic and local',()=>{
 const html=read('void-runner.html'),i=n=>html.indexOf('void-runner/'+n+'"');assert.equal(html,read('static/void-runner.html'));
 for(const n of ['cult-room.js','cult-room-build.js','camera-feed.js'])assert.ok(i(n)>0,n);assert.ok(i('modules.js')<i('cult-room.js')&&i('cult-room.js')<i('mission-content.js'));assert.ok(i('live-content.js')<i('camera-feed.js')&&i('cult-room-build.js')<i('camera-feed.js'));
 assert.match(read('void-runner/dev-tools.js'),/'void-runner\/module-editor.js','void-runner\/cult-room-editor.js'/);
 const glb=fs.readFileSync(R('void-runner/assets/models/crowd/npc-blackrock-robe.glb')),n=glb.readUInt32LE(12),J=JSON.parse(glb.slice(20,20+n).toString());
 assert.deepEqual(J.animations.map(a=>a.name).sort(),['idle','kneel','laugh','read','rise','shock','stand','talk','walk']);assert.equal(J.skins.length,1);assert.equal(J.skins[0].joints.length,24);assert.ok(glb.length<4e6);
 for(const c of CR().CLIPS)assert.ok(J.animations.some(a=>a.name===c),c);
 assert.ok(fs.statSync(R('void-runner/art/blackrock/owl-stencil.webp')).size<400000);
 const cf=read('void-runner/camera-feed.js');assert.match(cf,/MediaRecorder/);assert.match(cf,/addVideo/);assert.doesNotMatch(cf,/fetch\(|XMLHttpRequest|sendBeacon/,'the recording is never uploaded');
 assert.match(read('void-runner/live-content.js'),/type:'feed'/);assert.match(read('void-runner-sw.js'),/const BUILD='2026-11-19-blackrock-cult-1'/);
});
