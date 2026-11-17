/* Mission 001 — Awakening (David's own mission, APPROVED 17 Nov 2026), mission numbers, and the removal of every older mission from the District game. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p);
const fresh=()=>{for(const k of Object.keys(require.cache))if(k.includes('void-runner'+path.sep))delete require.cache[k];};
function env({draft=false}={}){fresh();
 const M=require(R('void-runner/mission-log.js')),B=require(R('void-runner/beginner.js')),C=require(R('void-runner/campaign.js')),U=require(R('void-runner/universe.js')),MC=require(R('void-runner/mission-content.js')),G=require(R('void-runner/mission-givers.js')),MS=require(R('void-runner/main-story.js'));
 B.register(M);
 const givers=G.roster({registry:JSON.parse(fs.readFileSync(R('tools/audio/npc-voice-registry.json'),'utf8')),people:require(R('void-runner/district-people.js')).npcs(),story:require(R('void-runner/story-content.js')).characters,temple:require(R('void-runner/temple.js')).MODEL});
 const e={B,Missions:M,U,givers};MC.snapshot(e);MC.apply(null,e);e.draft=draft;return {e,M,B,C,U,MC,G,MS};}
const district=C=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.appearanceOffered=true;return s;};   // a new character, in the pod (podWakePending)
const exitPod=(x,s)=>{s.story.flags.podWakePending=false;return x.MC.treeEvent(s,x.e,{type:'pod-exit',at:Date.UTC(2026,10,17,12)},x.M,x.C);};
const talk=(x,s,npc)=>x.MC.treeEvent(s,x.e,{type:'talk',npcs:[npc]},x.M,x.C);
const ADMIN_TEXT='You\'re awake. Good.\nWhen you\'re ready, come find me. We need to talk.';

// ---------------------------------------------------------------- numbering
test('mission numbers: the shipped ledger matches the save manifest; "Mission 001 — Awakening"; next number; never reused',()=>{
 const {MS}=env(),man=JSON.parse(fs.readFileSync(R('void-runner/save-manifest.json'),'utf8'));
 assert.deepEqual(Object.fromEntries(Object.entries(MS.NUMBERS).map(([k,v])=>[String(k),v])),man.missionNumbers,'main-story.js NUMBERS = save-manifest.json missionNumbers');
 assert.deepEqual(man.storyMissions,MS.MISSION_IDS);assert.deepEqual(man.storyTrees,MS.STORY_TREES);
 assert.equal(MS.label(1,'Awakening'),'Mission 001 — Awakening');assert.equal(MS.label(42,'X'),'Mission 042 — X');assert.equal(MS.pad(7),'007');
 assert.equal(MS.AWAKENING.id,'m001-awakening');assert.equal(MS.AWAKENING.number,1);
 assert.equal(MS.nextNumber(MS.trees(),MS.NUMBERS),2);
 assert.equal(MS.nextNumber([],MS.NUMBERS,{5:'retired'}),6,'a retired number is never handed out again');
 const t=(id,n)=>({id,missions:[{id:id+'-m1',number:n,title:'x'}]});
 assert.equal(MS.numberProblems([t('draft-a',2),t('draft-b',2)]).length,1,'duplicates refused');
 assert.match(MS.numberProblems([t('draft-a',1)])[0],/never reused/,'001 belongs to Mission 001');
 assert.match(MS.numberProblems([t('draft-a',3)],{...MS.NUMBERS,3:'draft-gone-m1'})[0],/already used by "draft-gone-m1"/,'a removed mission keeps its number');
 assert.deepEqual(MS.numberProblems([...MS.trees(),t('draft-a',2)]),[]);
});
test('the content check: numbers unique and never reused, the main storyline needs numbers, new fields and step kinds are closed',()=>{
 const x=env(),{MC,MS}=x,ctx={givers:new Map(x.e.givers.map(g=>[g.id,g])),places:new Set(x.G.PLACES.map(p=>p.id))};
 const doc=trees=>({format:MC.FORMAT,version:MC.VERSION,trees});
 const story=MC.treesContent(MS.trees(),{givers:x.e.givers}).trees;assert.equal(story.length,1);assert.equal(story[0].missions[0].number,1);assert.deepEqual(story[0].missions[0].start,{how:'notification',channel:'comms',from:'admin',text:ADMIN_TEXT,header:'ADMIN // INCOMING MESSAGE',when:{kind:'pod-exit'}});
 assert.deepEqual(MC.check(doc(story),ctx).errors,[]);
 const st=c=>c[0].missions[0].start;
 const bad=[c=>{delete c[0].missions[0].number;},c=>{c[0].missions[0].number=0;},c=>{c[0].missions[0].location='atlantis';},
  c=>{st(c).how='telepathy';},c=>{st(c).channel='fax';},c=>{st(c).header='';},c=>{st(c).text='<b>hi</b>';},c=>{st(c).from='darth';},c=>{st(c).when={kind:'moon'};},c=>{st(c).when={kind:'place',place:'atlantis'};},
  c=>{st(c).when={kind:'after-mission',mission:'nowhere'};},c=>{st(c).when={kind:'flag',flag:'bad flag!',value:true};},c=>{c[0].missions[0].start={how:'person',channel:'messages'};},
  c=>{c[0].missions[0].start={how:'person'};},   // a "notification arrives" step needs a notification start
  c=>{c[0].missions[0].objectives[1].message={from:'admin',header:'H',text:'T'};},
  c=>{c[0].id='story';},c=>{c[0].missions[0].id='awakening';},c=>{c.push({id:'draft-x',name:'X',missions:[{id:'draft-x-m1',number:1,title:'X',type:'side',giver:'admin',objectives:[{id:'s',label:'x',kind:'talk',npc:'iris'}]}]});}];
 for(const f of bad){const c=MC.clone(story);f(c);assert.equal(MC.check(doc(c),ctx).ok,false,f.toString());}
 const ok=MC.clone(story);ok.push({id:'draft-x',name:'X',missions:[{id:'draft-x-m1',number:2,title:'X',type:'side',giver:'admin',objectives:[{id:'s',label:'x',kind:'talk',npc:'iris'}]}]});
 assert.deepEqual(MC.check(doc(ok),ctx).errors,[]);
 for(const when of [{kind:'after-mission',mission:'m001-awakening'},{kind:'place',place:'port'},{kind:'flag',flag:'mf_seen',value:true},{kind:'pod-exit'}]){const c=MC.clone(ok);c[1].missions[0].start={how:'notification',channel:'comms',from:'iris',header:'IRIS // CALL',text:'TEST call.',when};assert.deepEqual(MC.check(doc(c),ctx).errors,[],JSON.stringify(when));}
 {const c=MC.clone(ok);c[1].missions[0].start={how:'notification',channel:'notify',from:'iris',text:'TEST banner.',when:{kind:'pod-exit'}};assert.deepEqual(MC.check(doc(c),ctx).errors,[],'a banner needs no header');}
 assert.equal(MC.check(doc(ok),{...ctx,numbers:{2:'draft-old-m1'}}).ok,false,'a number the server has published for another mission is refused');
});

// ---------------------------------------------------------------- Mission 001
test('Mission 001 starts on the first EXIT POD: a Comms call, Mission Log "Awakening" (players never see the number), objective "Locate Admin", tracked, guidance to Admin',()=>{
 const x=env(),s=district(x.C);
 assert.equal(talk(x,s,'admin').mission,null,'Admin does not offer it: it starts at the pod');assert.equal(x.MC.treeWants(s,x.e,['admin']),false);
 const r=exitPod(x,s);
 assert.equal(r.offered,true);assert.equal(r.mission,'m001-awakening');assert.deepEqual(r.done,['exit-pod','message']);
 assert.equal(r.messages.length,1);assert.equal(r.messages[0].header,'ADMIN // INCOMING MESSAGE');assert.equal(r.messages[0].text,ADMIN_TEXT);assert.equal(r.messages[0].fromName,'Admin');
 assert.deepEqual(r.lines,[],'no dialogue: the message is the opening');
 assert.equal(s.universe.trackedMission,'m001-awakening');
 const log=x.M.all(s,x.C);assert.equal(log.length,1);const m=log[0];
 assert.equal(m.title,'Awakening','players see the name only');assert.equal(m.number,1,'the number stays in the data');assert.equal(x.M.definitions['m001-awakening'].devLabel,'Mission 001 — Awakening','developer tools show it');assert.equal(r.messages[0].title,'Awakening','nor in the call');assert.equal(m.objective,'Locate Admin');assert.equal(m.category,'Main storyline / Introduction');assert.equal(m.location,'district');assert.equal(m.tracked,true);
 assert.deepEqual(m.objectives.map(o=>[o.label,o.complete]),[['Exit the Sleeping Pod.',true],['Receive Admin\'s message.',true],['Find and speak with Admin.',false],['Receive an introduction to The Darknet District.',false]]);
 assert.equal(m.destination,'earth');assert.equal(m.interaction,'admin');
 assert.deepEqual(x.M.guidance(s,m,true),{kind:'local',label:'Locate Admin',interaction:'admin'},'the existing guidance leads to Admin at the counter');
 assert.equal(x.MC.treeWants(s,x.e,['admin']),true);assert.equal(x.MC.treeWants(s,x.e,['iris']),false);
 // the V1 inbox keeps it
 assert.equal(r.how,'notification');assert.equal(r.messages[0].channel,'comms','David: it comes through Comms');
 const box=x.MC.inbox(s,x.e);assert.equal(box.length,1);assert.equal(box[0].read,false);assert.equal(box[0].text,ADMIN_TEXT);assert.equal(box[0].at,Math.floor(Date.UTC(2026,10,17,12)/1000));
 assert.equal(x.MC.markRead(s,box[0].id),true);assert.equal(x.MC.inbox(s,x.e)[0].read,true);assert.equal(x.MC.markRead(s,box[0].id),false);
 // every flag the mission writes is a safe story flag
 for(const [k,v] of Object.entries(s.story.flags))assert.match(k,/^[a-zA-Z][\w-]{0,63}$/,k),assert.ok(typeof v==='boolean'||typeof v==='string'&&v.length<=200||Number.isSafeInteger(v),k);
});
test('Mission 001 never starts twice: later pod exits and reloads change nothing',()=>{
 const x=env(),s=district(x.C);exitPod(x,s);const before=JSON.stringify(s.universe.missions);
 for(let i=0;i<3;i++){s.story.flags.podWakePending=true;const r=exitPod(x,s);assert.equal(r.offered,false);assert.deepEqual(r.messages,[]);}
 assert.equal(JSON.stringify(s.universe.missions),before);
 const back=x.C.restore(JSON.stringify(s));assert.equal(back.universe.trackedMission,'m001-awakening');assert.deepEqual(back.universe.missions['m001-awakening'].objectives,{'exit-pod':true,message:true});
 assert.equal(exitPod(x,back).offered,false,'not after a reload either');
});
test('live players: talking to Admin completes Mission 001 without showing the placeholder; no reward',()=>{
 const x=env(),s=district(x.C);exitPod(x,s);const credits=s.credits;
 assert.equal(talk(x,s,'iris').mission,null,'Iris is not part of it');
 const r=talk(x,s,'admin');
 assert.deepEqual(r.done,['speak','introduction']);assert.equal(r.completed,true);assert.deepEqual(r.lines,[],'the placeholder line is never shown to live players');assert.equal(r.hear,null);
 assert.equal(r.reward,0);assert.equal(s.credits,credits,'no reward (none specified)');assert.deepEqual(r.notes,[]);
 assert.equal(s.universe.missions['m001-awakening'].completed,true);assert.equal(s.story.flags['mt_m001-awakening'],true);assert.equal(s.universe.trackedMission,null);
 assert.equal(x.M.all(s,x.C)[0].completed,true);assert.equal(x.M.all(s,x.C)[0].objective,'Complete');
 const again=talk(x,s,'admin');assert.equal(again.mission,null,'Admin goes back to what he normally does');assert.equal(x.MC.treeWants(s,x.e,['admin']),false);
});
test('draft play: Admin\'s Mission 001 lines (the placeholder for now) are shown, and closing them completes the mission',()=>{
 const x=env({draft:true}),s=district(x.C);exitPod(x,s);
 const r=talk(x,s,'admin');assert.deepEqual(r.done,['speak']);assert.equal(r.completed,false);
 assert.deepEqual(r.lines,[{who:'Admin',text:'[David: write Admin\'s introduction to The Darknet District here]'}]);assert.deepEqual(r.hear,{mission:'m001-awakening',step:'introduction'});
 // closing the window without the 'heard' event (a reload): talking again shows the lines again
 const again=talk(x,s,'admin');assert.equal(again.lines.length,1);assert.deepEqual(again.hear,r.hear);
 const h=x.MC.treeEvent(s,x.e,{type:'heard',mission:'m001-awakening'},x.M,x.C);assert.deepEqual(h.done,['introduction']);assert.equal(h.completed,true);
});
test('David\'s lines, once written and published, are shown to live players and then complete the mission',()=>{
 const x=env(),{MC,MS}=x,story=MS.trees();story[0].missions[0].objectives[2].say=[{who:'admin',text:'TEST: the District line one.'},{who:'admin',text:'TEST: line two.'}];
 const c={format:MC.FORMAT,version:MC.VERSION,trees:MC.treesContent(story,{givers:x.e.givers}).trees};assert.deepEqual(MC.apply(c,x.e,{givers:new Map(x.e.givers.map(g=>[g.id,g]))}).refused,[]);
 const s=district(x.C);exitPod(x,s);const r=talk(x,s,'admin');assert.equal(r.lines.length,2);assert.equal(r.lines[0].text,'TEST: the District line one.');assert.equal(r.completed,false);
 assert.equal(MC.treeEvent(s,x.e,{type:'heard'},x.M,x.C).completed,true);
 // the edited message text reaches the V1
 const st2=MS.trees();st2[0].missions[0].start.text='TEST: edited message.';MC.apply({format:MC.FORMAT,version:MC.VERSION,trees:MC.treesContent(st2,{givers:x.e.givers}).trees},x.e,{});
 const s2=district(x.C);assert.equal(exitPod(x,s2).messages[0].text,'TEST: edited message.');
});
test('a character who left the pod before Mission 001 existed (with beginner progress) loads clean and gets it on the next pod exit',()=>{
 const x=env(),s=district(x.C);s.story.flags.podWakePending=false;   // exited long ago
 for(const id of ['first-contact','district-errand'])s.universe.missions[id]={acquired:true,completed:id==='first-contact',objectives:{v1:true,bar:true}};
 s.story.flags['br_first-contact']=true;s.universe.trackedMission='district-errand';s.credits=640;x.C.awardStarterShip(s);
 const loaded=x.C.restore(JSON.stringify(s));
 assert.equal(loaded.universe.trackedMission,null,'the removed mission is untracked');assert.equal(loaded.credits,640);assert.ok(loaded.ownedShips.includes('starter'),'items and ships are kept');
 assert.equal(loaded.universe.missions['district-errand'].acquired,true,'the old record is kept (old ids still load)');
 assert.deepEqual(x.M.all(loaded,x.C),[],'nothing old is shown');
 x.MC.migrate(loaded,[],x.B.flagOf,x.e.trees);assert.equal(loaded.credits,640,'no old reward is paid by the migration');
 loaded.story.flags.podWakePending=true;   // every login wakes in the pod
 const r=exitPod(x,loaded);assert.equal(r.offered,true);assert.equal(r.messages.length,1);assert.deepEqual(x.M.all(loaded,x.C).map(m=>m.title),['Awakening']);
});

// ---------------------------------------------------------------- how missions start
function treeWith(x,missions){const {MC}=x,c={format:MC.FORMAT,version:MC.VERSION,trees:[...MC.treesContent(x.MS.trees(),{givers:x.e.givers}).trees,{id:'draft-test',name:'Test',missions}]};
 const r=MC.apply(c,x.e,{givers:new Map(x.e.givers.map(g=>[g.id,g])),places:new Set(x.G.PLACES.map(p=>p.id))});assert.deepEqual(r.refused,[]);}
const side=(id,extra)=>({id,number:Number(id.slice(-1))+1,title:'TEST '+id,type:'side',giver:'iris',objectives:[{id:'s1',label:'Talk to Iris',kind:'talk',npc:'iris'}],...extra});
test('in person: the giver offers the mission when talked to (the existing behaviour), then it is logged and tracked',()=>{
 const x=env();treeWith(x,[side('draft-test-m1',{offer:[{who:'iris',text:'TEST offer.'}]})]);const s=district(x.C);exitPod(x,s);talk(x,s,'admin');
 const r=talk(x,s,'iris');assert.equal(r.offered,true);assert.equal(r.how,'person');assert.deepEqual(r.messages,[]);assert.equal(r.lines[0].text,'TEST offer.');assert.equal(s.universe.trackedMission,'draft-test-m1');
 assert.deepEqual(x.M.all(s,x.C).filter(m=>!m.completed).map(m=>m.title),['TEST draft-test-m1']);
 const m=x.M.tracked(s,x.C);assert.deepEqual(x.M.guidance(s,m,true),{kind:'local',label:'Talk to Iris',interaction:'district-iris'},'a tracked tree mission feeds the guidance arrow (to the NPC of the current step)');
 x.M.untrack(s);assert.equal(x.M.tracked(s,x.C),null,'STOP TRACKING: nothing to guide to');
});
test('by notification: after a mission completes, entering a place, a story flag; Comms and banner-only channels',()=>{
 const n=(when,channel='comms')=>({start:{how:'notification',channel,from:'iris',header:channel==='notify'?undefined:'IRIS // CALL',text:'TEST: '+when.kind,when}});
 const x=env();treeWith(x,[side('draft-test-m1',n({kind:'after-mission',mission:'m001-awakening'}))]);const s=district(x.C);exitPod(x,s);
 assert.equal(x.MC.treeEvent(s,x.e,{type:'place',places:['district']},x.M,x.C).offered,false,'not before Mission 001 is done');
 talk(x,s,'admin');const r=x.MC.treeEvent(s,x.e,{type:'place',places:[]},x.M,x.C);assert.equal(r.offered,true);assert.equal(r.messages[0].channel,'comms');assert.equal(r.messages[0].text,'TEST: after-mission');
 assert.equal(s.universe.trackedMission,'draft-test-m1');assert.equal(x.MC.inbox(s,x.e,'comms').length,2,'Admin\'s call and this call');assert.equal(x.MC.inbox(s,x.e,'messages').length,0);
 assert.equal(x.MC.treeWants(s,x.e,['iris']),true,'then it runs as usual');
 const y=env();treeWith(y,[side('draft-test-m1',n({kind:'place',place:'port'},'notify'))]);const t=district(y.C);exitPod(y,t);talk(y,t,'admin');
 assert.equal(y.MC.treeEvent(t,y.e,{type:'place',places:['oldtown']},y.M,y.C).offered,false);const p=y.MC.treeEvent(t,y.e,{type:'place',places:['port']},y.M,y.C);assert.equal(p.offered,true);assert.equal(p.messages[0].channel,'notify');
 assert.deepEqual(y.MC.inbox(t,y.e,'notify'),[],'a banner keeps nothing in Messages or Comms');assert.equal(y.MC.treeWants(t,y.e,['iris']),true);
 const z=env();treeWith(z,[side('draft-test-m1',n({kind:'flag',flag:'mf_ready',value:true},'messages'))]);const u=district(z.C);exitPod(z,u);talk(z,u,'admin');
 assert.equal(z.MC.treeEvent(u,z.e,{type:'place',places:[]},z.M,z.C).offered,false);assert.equal(z.MC.treeEvent(u,z.e,{type:'talk',npcs:['iris']},z.M,z.C).offered,false,'talking to the giver does not start a notification mission');
 u.story.flags.mf_ready=true;assert.equal(z.MC.treeEvent(u,z.e,{type:'place',places:[]},z.M,z.C).offered,true);assert.equal(z.MC.inbox(u,z.e,'messages').length,1);
});
test('device notification sounds: one per tier (V1, V2, V3 // SHADOW), V1 in the game, files present, a model without its own row uses the V1 sound',()=>{
 const D=require(R('void-runner/device-v1.js'));assert.deepEqual(Object.keys(D.NOTIFY),['v1','v2','v3']);assert.deepEqual(Object.values(D.NOTIFY).map(t=>t.name),['V1','V2','V3 // SHADOW']);assert.equal(D.NOTIFY.v2.placeholder,true);
 for(const id of Object.keys(D.NOTIFY))if(D.DEVICES[id])assert.equal(D.DEVICES[id].name,D.NOTIFY[id].name,'the tier is named as the device: '+id);assert.ok(!fs.existsSync(R('void-runner/assets/audio/ui/device-shadow-notify.ogg')),'no separate SHADOW tier');
 for(const t of Object.values(D.NOTIFY)){assert.match(t.sound,/^void-runner\/assets\/audio\/ui\/device-[a-z0-9]+-notify\.ogg$/);assert.ok(fs.existsSync(R(t.sound)),t.sound);}
 assert.equal(D.notifyTier('v1'),'v1');assert.equal(D.notifyTier('v9'),'v1');assert.match(fs.readFileSync(R('void-runner/assets/audio/ui/LICENSES.md'),'utf8'),/device-v1-notify\.ogg/);
});

// ---------------------------------------------------------------- removal
test('removed from the District game: the beginner campaign, Rook\'s board, faction deliveries, contracts and the Milked draft',()=>{
 const x=env(),s=district(x.C);s.story.flags.podWakePending=false;
 for(const id of [...x.B.MISSIONS.map(m=>m.id),'meet-rook','legal-run','admin-sealed-cargo-01','communion-delivery','order-delivery','communion-supply','rook-run-1','belt-1'])assert.equal(x.M.acquire(s,id),null,id);
 assert.equal(x.B.offer(s,x.M,x.C),null);assert.equal(x.C.accept(s,'rook-run'),false);assert.equal(x.C.accept(s,'communion-delivery'),false);assert.equal(x.C.accept(s,'belt-1'),false);
 const milked=require(R('void-runner/milked.js'));assert.notEqual(milked.MISSION.active,true,'the Milked draft stays inactive data');
 x.C.awardStarterShip(s);assert.deepEqual(x.M.all(x.M.sync(s,x.C)&&s,x.C),[],'nothing is shown, even with a ship');
 // an old (open pool) campaign is untouched
 const old=x.C.fresh();assert.ok(x.M.acquire(old,'legal-run')||true);assert.equal(x.M.live(old,'legal-run'),true);
 // nothing gives a ship now: the main storyline grants none
 const t=district(x.C);exitPod(x,t);talk(x,t,'admin');assert.equal(require(R('void-runner/ships.js')).hasShip(t),false);
});
test('the game page loads main-story.js before the mission adapter; the service worker build is bumped',()=>{
 const html=fs.readFileSync(R('void-runner.html'),'utf8');assert.ok(html.indexOf('void-runner/main-story.js')>0&&html.indexOf('void-runner/main-story.js')<html.indexOf('void-runner/mission-content.js'));
 assert.equal(fs.readFileSync(R('static/void-runner.html'),'utf8'),html);
 assert.match(fs.readFileSync(R('void-runner-sw.js'),'utf8'),/const BUILD='2026-11-17-mission-001-\d+'/);
});
