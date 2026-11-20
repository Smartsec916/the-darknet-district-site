/* Follow / lead / shared-cab mission steps (queue item 3, approved 18 Nov 2026; built 19 Nov 2026): void-runner/npc-escort.js (the pure rules: follow-them's wait /
   resume / lost / fail, they-follow's trail and catch-up, the cab boarding rules), the step kinds in mission-content.js (check, the escort events, the mission failing,
   escortNow, export), the Make a mission wizard, the save flag and the server's copy of the rules (admin inventory npcEscort). */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p);
const fresh=()=>{for(const k of Object.keys(require.cache))if(k.includes('void-runner'+path.sep))delete require.cache[k];};
function env(){fresh();
 const M=require(R('void-runner/mission-log.js')),B=require(R('void-runner/beginner.js')),C=require(R('void-runner/campaign.js')),U=require(R('void-runner/universe.js')),MC=require(R('void-runner/mission-content.js')),G=require(R('void-runner/mission-givers.js')),MS=require(R('void-runner/main-story.js'));
 B.register(M);
 const givers=G.roster({registry:JSON.parse(fs.readFileSync(R('tools/audio/npc-voice-registry.json'),'utf8')),people:require(R('void-runner/district-people.js')).npcs(),story:require(R('void-runner/story-content.js')).characters,temple:require(R('void-runner/temple.js')).MODEL});
 const e={B,Missions:M,U,givers};MC.snapshot(e);MC.apply(null,e);return {e,M,C,MC,G,MS};}
const E=()=>require(R('void-runner/npc-escort.js'));
const ev=(x,s,e)=>x.MC.treeEvent(s,x.e,e,x.M,x.C);
const player=x=>{const s=x.C.startDistrictCampaign(x.C.fresh());s.story.flags.appearanceOffered=true;s.story.flags.podWakePending=false;return s;};
const doc=(x,...trees)=>({format:x.MC.FORMAT,version:x.MC.VERSION,trees:[...x.MC.treesContent(x.MS.trees(),{givers:x.e.givers}).trees,...trees]});
const ctx=x=>({givers:new Map(x.e.givers.map(g=>[g.id,g])),places:x.G.placeIds()});
const run=(fn,st,inp,secs,dt=.1,each)=>{const evs=[];for(let t=0;t<secs;t+=dt){if(each)each(t,st,inp);const e=fn(st,{...inp,dt});if(e)evs.push(e);}return evs;};
const tree=(o,giver='grey-reverie')=>({id:'draft-walk',name:'Walk',missions:[{id:'draft-walk-m1',number:61,title:'Walk with me',type:'side',giver,offer:[{who:giver,text:'Come on.'}],
 objectives:[{id:'walk',label:'Walk with them',...o}]}]});

test('who can do these steps: path-capable NPCs only; the cat walks but does not ride; cab stops only where she can exist (The Avenue), far places greyed',()=>{
 fresh();const X=E();
 for(const k of X.IDS){assert.equal(X.can('grey-reverie',k).ok,true);assert.equal(X.can('ethereal-lace',k).ok,true);assert.equal(X.can('admin',k).ok,false);assert.match(X.can('admin',k).why,/cannot walk with the player yet/);}
 assert.equal(X.can('street-cat','follow-them').ok,true);assert.equal(X.can('street-cat','they-follow').ok,true);assert.equal(X.can('street-cat','their-cab').ok,false);assert.match(X.can('street-cat','shared-cab').why,/does not ride in cabs/);
 const st=X.stops('grey-reverie');assert.deepEqual(st.filter(s=>s.ok).map(s=>s.id),['avenue','function-gate','east-gate']);
 for(const s of st.filter(s=>!s.ok))assert.ok(s.why&&s.why.length>10,s.id);assert.match(st.find(s=>s.id==='corporate').why,/stays in the city/);assert.match(st.find(s=>s.id==='main').why,/placed in The Avenue/);
 assert.deepEqual(X.stops('street-cat').filter(s=>s.ok),[]);
 // settings: defaults 8 / 40 / pause, clamped, lost always beyond wait
 assert.deepEqual(X.settings({}),{wait:8,lost:40,ifLost:'pause'});assert.deepEqual(X.settings({wait:99,lost:1,ifLost:'fail'}),{wait:30,lost:40,ifLost:'fail'});
});

test('follow them: starts when the player comes near, waits when they fall behind, walks on when they catch up, done when both are at the spot',()=>{
 fresh();const X=E(),to={x:110,z:-6.4},st={x:90,z:-6.6,yaw:0},me={x:80,z:-10},inp={me,to,set:{wait:8,lost:40}};
 assert.deepEqual(run(X.lead,st,inp,2),[],'the player is 10 m away: she waits ready');assert.equal(st.phase,'ready');assert.equal(st.x,90);
 me.x=86;me.z=-6.6;let evs=run(X.lead,st,inp,1);assert.deepEqual(evs,['walk']);assert.ok(st.x>90&&st.clip==='walk');
 evs=run(X.lead,st,inp,10);assert.ok(evs.includes('wait'),'player stood still: she stops');assert.equal(st.phase,'wait');assert.equal(st.clip,'idle');const at=st.x;
 run(X.lead,st,inp,3);assert.equal(st.x,at,'she stays while waiting');
 me.x=at-6;run(X.lead,st,inp,.5);assert.equal(st.phase,'wait','within wait but not caught up yet (resumes inside 60%)');
 me.x=at-3;evs=run(X.lead,st,inp,.5);assert.deepEqual(evs,['walk']);
 evs=run(X.lead,st,inp,40,.1,(t,s)=>{me.x=Math.max(me.x,s.x-4);});assert.ok(evs.includes('there'));assert.equal(st.phase,'there');assert.ok(Math.hypot(st.x-to.x,st.z-to.z)<.05,'at the spot');
 me.x=to.x-1;me.z=to.z;evs=run(X.lead,st,inp,.2);assert.deepEqual(evs,['done']);
 // her walk stays on the walking line between the spots (clear of the kerb furniture)
 assert.deepEqual(X.route({x:90,z:-6.2},{x:110,z:-7}),[{x:90,z:-6.6},{x:110,z:-6.6},{x:110,z:-7}]);
});

test('follow them: a lost player pauses her (and she resumes) or fails the step, as the owner chose',()=>{
 fresh();const X=E(),to={x:130,z:-6.4};
 const mk=ifLost=>{const st={x:90,z:-6.6,yaw:0},me={x:88,z:-6.6};run(X.lead,st,{me,to,set:{wait:8,lost:40,ifLost}},2);return {st,me};};
 {const {st,me}=mk('pause');me.x=40;const evs=run(X.lead,st,{me,to,set:{wait:8,lost:40,ifLost:'pause'}},1);assert.deepEqual(evs,['paused']);
  me.x=st.x-10;assert.deepEqual(run(X.lead,st,{me,to,set:{wait:8,lost:40,ifLost:'pause'}},1),[],'still too far to resume');me.x=st.x-3;assert.deepEqual(run(X.lead,st,{me,to,set:{wait:8,lost:40,ifLost:'pause'}},.2),['walk']);}
 {const {st,me}=mk('fail');me.x=30;const evs=run(X.lead,st,{me,to,set:{wait:8,lost:40,ifLost:'fail'}},1);assert.deepEqual(evs,['failed']);assert.equal(X.lead(st,{me:{x:st.x,z:st.z},to,dt:.1}),null,'failed stays failed');}
 {const st={x:90,z:-6.6,yaw:0};assert.deepEqual(run(X.lead,st,{me:{x:20,z:-6},to,set:{ifLost:'fail'}},3),[],'never fails before the player has come to her');}
});

test('they follow you: along the player\'s trail about 2 m behind, running when far, caught up only when far and off-screen; the cat at its own pace; done at the spot',()=>{
 fresh();const X=E(),tr={pts:[],shifted:0},st={x:100,z:-6.6,yaw:0},me={x:103,z:-6.6},to={x:60,z:-6.4};
 let evs=run(X.follow,st,{me,trail:tr,to,seen:true},.2);assert.deepEqual(evs,['follow']);
 // the player walks west along the pavement at 1.3 m/s
 run(X.follow,st,{me,trail:tr,to,seen:true},6,.1,()=>{me.x-=.13;X.trailPush(tr,me);});let d=Math.hypot(me.x-st.x,me.z-st.z);assert.ok(d>1.5&&d<2.8,'about 2 m behind a slow walk ('+d.toFixed(2)+')');assert.equal(st.clip,'walk');
 // the player's own walk (3.9 m/s): she runs and stays close
 let ran=false;run(X.follow,st,{me,trail:tr,to,seen:true},3,.05,(t,s)=>{me.x-=.195;X.trailPush(tr,me);if(s.clip==='run')ran=true;});d=Math.hypot(me.x-st.x,me.z-st.z);assert.ok(ran,'she runs to keep up');assert.ok(d>1.5&&d<3.2,'about 2 m behind a walking player ('+d.toFixed(2)+')');
 // a jump far away while she is on screen: no teleport; off-screen: put 3 m behind
 const x0=st.x;me.x-=30;X.trailPush(tr,{x:me.x+15,z:me.z});X.trailPush(tr,me);evs=run(X.follow,st,{me,trail:tr,to,seen:true},.1);assert.ok(!evs.includes('caught-up'));assert.ok(Math.abs(st.x-x0)<1);
 evs=run(X.follow,st,{me,trail:tr,to,seen:false},.1);assert.deepEqual(evs,['caught-up']);assert.ok(Math.abs(Math.hypot(me.x-st.x,me.z-st.z)-3)<.2,'3 m behind');
 me.x=to.x;me.z=to.z;X.trailPush(tr,me);evs=run(X.follow,st,{me,trail:tr,to,seen:true},5);assert.ok(evs.includes('done'));
 // the cat: slower, closer
 const c={x:100,z:-6.6,yaw:0},t2={pts:[],shifted:0},m2={x:101,z:-6.6};run(X.follow,c,{me:m2,trail:t2,seen:true,cat:true},.1);let top=0;
 run(X.follow,c,{me:m2,trail:t2,seen:true,cat:true},6,.1,(t,s)=>{m2.x-=.2;X.trailPush(t2,m2);top=Math.max(top,s.speed);});assert.ok(top<=X.SPEED.catDash+1e-9&&top>0,'cat speed '+top);assert.ok(Math.hypot(m2.x-c.x,m2.z-c.z)>2,'the cat lags at its own pace');
});

test('cab rules: she calls it from the kerb when the player is near, gets in, both ride, both get out at the stop; a cab that leaves without the player: she calls again',()=>{
 fresh();const X=E(),st={x:100,z:-6.6,yaw:0},me={x:120,z:-6.6},job={id:'cab-1:east-gate',phase:'to-pickup',dest:'east-gate',cab:{x:100,z:-12.5,yaw:Math.PI/2},doors:[{x:100,z:-10.7},{x:100,z:-14.3}]};
 const inp=()=>({kind:'their-cab',stop:'east-gate',me,walking:true,riding:false,job:null,set:{}});
 assert.deepEqual(run(X.cab,st,inp(),1),[],'player far: she waits');me.x=104;
 let evs=run(X.cab,st,inp(),5);assert.deepEqual(evs,['kerb','hail']);assert.ok(st.z<-7&&st.z>-7.4,'at the kerb');
 let wanted=0;run(X.cab,st,inp(),5,.1,(t,s)=>{});evs=[];for(let i=0;i<60;i++){const e=X.cab(st,{...inp(),dt:.1});if(st.want==='hail')wanted++;if(e)evs.push(e);}assert.ok(wanted>=1,'asks road-taxi.js to call the cab');
 // the cab is on its way, then waits with its door open: she walks to the door and gets in
 evs=run(X.cab,st,{...inp(),job},1);assert.deepEqual(evs,[],'on its way');job.phase='waiting';evs=run(X.cab,st,{...inp(),job},8);assert.deepEqual(evs,['to-cab','in-cab']);assert.equal(st.clip,'sit');
 // the player boards (BOARD TAXI): both ride; the cab arrives; the player steps out (the job is released): she is out too, then done
 job.phase='to-dest';evs=run(X.cab,st,{...inp(),job,riding:true,walking:false},2);assert.deepEqual(evs,[]);job.phase='arrived';run(X.cab,st,{...inp(),job,riding:true,walking:false},.3);
 evs=run(X.cab,st,{...inp(),job:null,riding:false,walking:true},.3);assert.deepEqual(evs,['out','done']);
 // the cab gives up waiting (the player never boarded): she gets out and calls again
 const s2={x:100,z:-6.6,yaw:0},j2={...job,phase:'waiting'};me.x=103;run(X.cab,s2,{...inp(),job:j2},14);assert.equal(s2.phase,'in-cab');
 evs=run(X.cab,s2,{...inp(),job:null},.2);assert.deepEqual(evs,['kerb']);assert.equal(s2.arrived,false);
});

test('shared cab: she follows; she gets in only a cab to her stop (another stop: a notice), or as the player boards nearby; both get out there',()=>{
 fresh();const X=E(),tr={pts:[],shifted:0},st={x:100,z:-6.6,yaw:0},me={x:101,z:-6.6},base={kind:'shared-cab',stop:'avenue',me,trail:tr,walking:true,riding:false,seen:true,set:{}};
 let evs=run(X.cab,st,{...base,job:null},.5);assert.deepEqual(evs,['follow']);
 const wrong={id:'c:east-gate',phase:'waiting',dest:'east-gate',cab:{x:100,z:-12.5,yaw:0},doors:[{x:101.8,z:-12.5},{x:98.2,z:-12.5}]};
 evs=run(X.cab,st,{...base,job:wrong},2);assert.deepEqual(evs,['wrong-stop']);assert.equal(st.phase,'follow');
 evs=run(X.cab,st,{...base,job:wrong,riding:true},1);assert.equal(st.phase,'follow','she never rides to another stop');
 const right={...wrong,id:'c:avenue',dest:'avenue'};evs=run(X.cab,st,{...base,job:right},10);assert.deepEqual(evs,['to-cab','in-cab']);
 // the player boards before she reached the door: she gets in too (within 40 m)
 const s2={x:100,z:-6.6,yaw:0};run(X.cab,s2,{...base,job:null},.3);evs=run(X.cab,s2,{...base,job:{...right,phase:'to-dest'},riding:true},.2);assert.deepEqual(evs,['in-cab']);
 const s3={x:100,z:-6.6,yaw:0};run(X.cab,s3,{...base,job:null},.3);s3.x=s3.f.x=20;evs=run(X.cab,s3,{...base,job:{...right,phase:'to-dest'},riding:true},.2);assert.notEqual(s3.phase,'in-cab','too far away: she does not ride');
});

test('mission content: the four step kinds are checked (who, spot, distances, stop), run by events, and a lost player with "fails" sends the mission back',t=>{const realNow=Date.now;Date.now=()=>Date.UTC(2026,10,19,3,0);t.after(()=>{Date.now=realNow;});   // Reverie's shift (00-12 UTC): the result must not depend on the hour the test runs
 const x=env(),{MC}=x;
 const good=[{kind:'follow-them',npc:'grey-reverie',to:{x:110,z:-6.4},wait:8,lost:40,ifLost:'fail'},{kind:'they-follow',npc:'street-cat',to:{x:60,z:-6.4}},{kind:'their-cab',npc:'ethereal-lace',stop:'east-gate'},{kind:'shared-cab',npc:'grey-reverie',stop:'avenue'}];
 for(const o of good)assert.deepEqual(MC.check(doc(x,tree(o)),ctx(x)).errors,[],o.kind);
 const bad=[[{kind:'follow-them',npc:'admin',to:{x:110,z:-6.4}},/cannot walk with the player/],[{kind:'follow-them',npc:'grey-reverie',to:{x:110,z:-14}},/the road/],[{kind:'follow-them',npc:'grey-reverie',to:{x:110,z:-6.4},wait:50},/3 to 30/],
  [{kind:'follow-them',npc:'grey-reverie',to:{x:110,z:-6.4},wait:20,lost:15},/further than/],[{kind:'they-follow',npc:'grey-reverie',to:{x:110,z:-6.4},stop:'avenue'},/no stop setting/],[{kind:'their-cab',npc:'street-cat',stop:'avenue'},/does not ride in cabs/],
  [{kind:'their-cab',npc:'grey-reverie',stop:'corporate'},/stays in the city/],[{kind:'shared-cab',npc:'grey-reverie',stop:'main'},/placed in The Avenue/],[{kind:'talk',npc:'admin',stop:'avenue'},/only a follow/],[{kind:'follow-them',npc:'grey-reverie',to:{x:110,z:-6.4},ifLost:'run'},/stop and wait/]];
 for(const [o,re] of bad){const errs=MC.check(doc(x,tree(o)),ctx(x)).errors;assert.ok(errs.some(e=>re.test(e)),o.kind+': '+errs.join(' | '));}
 // what is still missing (Guide me / the play check)
 const need=o=>MC.treeNeeds({...tree(o).missions[0]},x.e.givers).filter(n=>n.step==='walk').map(n=>n.field);
 assert.deepEqual(need({kind:'follow-them'}),['step-npc']);assert.deepEqual(need({kind:'follow-them',npc:'grey-reverie'}),['step-spot']);assert.deepEqual(need({kind:'their-cab',npc:'grey-reverie'}),['step-stop']);assert.deepEqual(need(good[0]),[]);
 // export keeps the settings (and only its own)
 const st=MC.treeStrip(tree({...good[0],stop:'x'}).missions[0]).objectives[0];assert.deepEqual({to:st.to,wait:st.wait,lost:st.lost,ifLost:st.ifLost,stop:st.stop},{to:{x:110,z:-6.4},wait:8,lost:40,ifLost:'fail',stop:undefined});
 // running: offered by Reverie, the escort step is in progress, the 'escort' event completes it
 MC.apply({format:MC.FORMAT,version:MC.VERSION,trees:[tree(good[0])]},x.e);x.e.draft=true;const s=player(x);
 assert.equal(ev(x,s,{type:'talk',npcs:['grey-reverie']}).offered,true);
 assert.deepEqual(MC.escortNow(s,x.e),{'grey-reverie':{key:'draft-walk-m1/walk',mission:'draft-walk-m1',step:'walk',kind:'follow-them',npc:'grey-reverie',to:{x:110,z:-6.4},wait:8,lost:40,ifLost:'fail'}});
 assert.equal(ev(x,s,{type:'escort',step:'other/walk'}).objective,null,'another step id: nothing');
 // failed: the mission goes back to waiting; she offers it again
 s.story.flags.npcEsc='draft-walk-m1/walk|paused|100.0|-6.6';const f=ev(x,s,{type:'escort-fail',step:'draft-walk-m1/walk'});assert.equal(f.failed,true);assert.equal(s.universe.missions['draft-walk-m1'],undefined);assert.equal(s.story.flags.npcEsc,undefined);
 assert.deepEqual(MC.escortNow(s,x.e),{});assert.equal(ev(x,s,{type:'talk',npcs:['grey-reverie']}).offered,true,'offered again');
 const r=ev(x,s,{type:'escort',step:'draft-walk-m1/walk'});assert.deepEqual(r.done,['walk']);assert.equal(r.completed,true);assert.deepEqual(MC.escortNow(s,x.e),{});
});

test('save flag, wizard steps, the editor and the server copy of the rules',()=>{
 fresh();const X=E();
 const v=X.encode({key:'draft-walk-m1/walk',phase:'paused',x:100.04,z:-6.6});assert.equal(v,'draft-walk-m1/walk|paused|100.0|-6.6');assert.ok(v.length<200);assert.deepEqual(X.decode(v),{key:'draft-walk-m1/walk',phase:'paused',x:100,z:-6.6});
 assert.match(X.FLAG,/^[a-zA-Z][\w-]{0,63}$/,'a story flag name clean_save() accepts');assert.equal(X.decode(42),null);
 // the wizard offers the four kinds; build() makes the same step the editor makes
 const W=require(R('void-runner/editor-wizard.js')),T=require(R('void-runner/mission-trees.js'));for(const k of X.IDS)assert.ok(W.STEPS.some(s=>s.id===k),k);
 const spot=X.spots('grey-reverie')[0];assert.ok(spot&&/^Outside /.test(spot.name));
 const a=W.fresh('talk');a.giver='grey-reverie';a.title='Walk';a.steps=[{kind:'follow-them',npc:'grey-reverie',spot:spot.id,label:'Follow Reverie',auto:false},{kind:'their-cab',npc:'grey-reverie',stop:'east-gate',label:'',auto:true}];
 const x=env(),wctx={givers:x.e.givers,places:x.G.placeIds()};W.relabel(a,{name:id=>(x.e.givers.find(g=>g.id===id)||{}).name});assert.equal(a.steps[1].label,'Ride a cab with Reverie');assert.deepEqual(W.problems(a,'steps',wctx),[]);
 a.steps[1].stop='corporate';assert.match(W.problems(a,'steps',wctx).join(' '),/greyed stops are not possible/);a.steps[1].stop='east-gate';
 const b=W.fresh('talk');b.steps=[{kind:'they-follow',npc:'admin',spot:'',label:'x'}];assert.match(W.problems(b,'steps',wctx).join(' '),/cannot walk with the player yet/);
 const d={trees:[]},{mission}=W.build(d,a,{T:require(R('void-runner/mission-trees.js')),number:77});assert.deepEqual(mission.objectives.map(o=>[o.kind,o.npc,o.to||o.stop]),[['follow-them','grey-reverie',{x:spot.x,z:spot.z}],['their-cab','grey-reverie','east-gate']]);
 assert.deepEqual(x.MC.treeNeeds(mission,x.e.givers).filter(n=>/step/.test(n.field)),[]);
 // the step kinds are listed for the editor (supported) and for the server
 const G=require(R('void-runner/mission-givers.js'));for(const k of X.IDS){const s=G.STEP_KINDS.find(y=>y.id===k);assert.ok(s&&s.supported&&s.note,k);}
 const inv=JSON.parse(fs.readFileSync(R('void_runner_admin_inventory.json'),'utf8'));assert.deepEqual(inv.npcEscort,JSON.parse(JSON.stringify(X.inventory())),'run node tools/admin-inventory.cjs');for(const k of X.IDS)assert.ok(inv.missionEditor.stepKinds.includes(k));
 // the game loads npc-escort.js after npc-paths.js and before mission-content.js; road taxis offer a companion seat and a cab called for her
 const html=fs.readFileSync(R('void-runner.html'),'utf8'),i=html.indexOf('void-runner/npc-paths.js'),j=html.indexOf('void-runner/npc-escort.js'),k=html.indexOf('void-runner/mission-content.js');assert.ok(i>0&&j>i&&k>j);
 const RT=require(R('void-runner/road-taxi-rules.js')),cab={x:100,z:-12.5,yaw:Math.PI/2},a1=RT.seatPoint(cab),a2=RT.companionSeat(cab);assert.ok(Math.hypot(a1.x-a2.x,a1.z-a2.z)>.7,'beside the passenger, not on them');
 assert.match(fs.readFileSync(R('void-runner/road-taxi.js'),'utf8'),/function hailFor\(at,destId,who\)/);
 // the street pair runs the plan, and only for the local player (walker)
 const sp=fs.readFileSync(R('void-runner/ncz-street-pair.js'),'utf8');
 // her shift (one street clock): never brought out off-shift; a started step keeps the one who is out until it ends; the step starts only while she is on duty
 assert.match(sp,/const out=\(\)=>\{const o=onStreet\(now\(\),cfg\);if\(her&&\(!o\|\|o\.id!==her\.p\.id\)\)\{const P=planOf\(her\.p\.id\);if\(P&&\(P\.mode==='escort'\|\|P\.why==='mission'\)\)return her\.p;\}return o;\};/);assert.doesNotMatch(sp,/VoidStreetPair\?\.force/);
 assert.match(fs.readFileSync(R('void-runner/live-content.js'),'utf8'),/G\.onDuty\(g\);\}catch\{\}if\(on\|\|\(saved&&saved\.key===e\.key\)\|\|\(planCache\[id\]&&planCache\[id\]\.why==='mission'&&livePos\(id\)\)\)escOn\.add/);assert.match(sp,/function escTick/);assert.match(sp,/P\.mode==='escort'/);assert.doesNotMatch(sp.slice(sp.indexOf('function escTick'),sp.indexOf('// ---- the cat ----')),/remote-player/);
});
