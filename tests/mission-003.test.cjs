/* Mission 003 — Corporate Connections (the owner's mission, APPROVED 17 Nov 2026): the data and its order in the Awakening tree, the owner's words verbatim, the recorded
   clips matching their lines, the in-person briefing with ACCEPT / NOT NOW, Milked, Eva (the staff-only door flag), Fish (contact and follow, once), the mission ending,
   the ACTIVE PLAYTIME timer (counts only while active, persists in the save, the follow-up fires once), the "after active play" trigger, and saves. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p);
const fresh=()=>{for(const k of Object.keys(require.cache))if(k.includes('void-runner'+path.sep))delete require.cache[k];};
function env(){fresh();
 const M=require(R('void-runner/mission-log.js')),B=require(R('void-runner/beginner.js')),C=require(R('void-runner/campaign.js')),U=require(R('void-runner/universe.js')),MC=require(R('void-runner/mission-content.js')),G=require(R('void-runner/mission-givers.js')),MS=require(R('void-runner/main-story.js')),PT=require(R('void-runner/playtime.js')),DP=require(R('void-runner/district-people.js'));
 B.register(M);
 const givers=G.roster({registry:JSON.parse(fs.readFileSync(R('tools/audio/npc-voice-registry.json'),'utf8')),people:DP.npcs(),story:require(R('void-runner/story-content.js')).characters,temple:require(R('void-runner/temple.js')).MODEL});
 const e={B,Missions:M,U,givers};MC.snapshot(e);MC.apply(null,e);return {e,M,B,C,U,MC,G,MS,PT,DP};}
const ID='m003-corporate-connections',M2='m002-eyes-on-the-street';
const ev=(x,s,e)=>x.MC.treeEvent(s,x.e,e,x.M,x.C);
const talk=(x,s,npc)=>ev(x,s,{type:'talk',npcs:[npc]});
const place=(x,s,...places)=>ev(x,s,{type:'place',places,at:Date.UTC(2026,10,17,14)});
const extra=()=>JSON.parse(fs.readFileSync(R('void-runner/assets/audio/voice/extra/manifest.json'),'utf8')).lines;
/* A player who finished Missions 001 and 002 (Mission 002 played through: NULL, the photo of Juno and Halden, sent to Admin, back to Admin). */
function after002(x){const s=x.C.startDistrictCampaign(x.C.fresh());s.story.flags.appearanceOffered=true;s.story.flags.podWakePending=false;
 ev(x,s,{type:'pod-exit',at:Date.UTC(2026,10,17,12)});talk(x,s,'admin');talk(x,s,'admin');ev(x,s,{type:'accept',mission:M2});place(x,s,'null');
 ev(x,s,{type:'photo',subjects:['juno-vex','halden-reyes']});ev(x,s,{type:'send-photo',to:'admin',photo:{subjects:[{id:'juno-vex',valid:true},{id:'halden-reyes',valid:true}],during:[M2+'/photograph'],place:'null',at:1}});
 talk(x,s,'admin');assert.equal(s.universe.missions[M2].completed,true,'002 done');return s;}
const BRIEF=['I did some digging. Halden Reyes has ties to an arms dealer who works closely with The Function.','I know an intel broker named Fish. She\'s a close friend of mine and works over at Milked. She might be able to tell us more.',
 'Head over there and let the receptionist, Eva, know you\'re there to see Fish.','And tell Eva I said hi.'];
const ZH='给我一点时间调查一下。如果有什么消息，我会给你打电话。',EN='Give me some time to work on it. I\'ll call you if anything comes up.';

test('Mission 003 data: right after Eyes on the Street in the Awakening tree, number 3, the owner\'s words verbatim, ledger and manifest, no reward',()=>{
 const {MS,MC,G,e}=env(),man=JSON.parse(fs.readFileSync(R('void-runner/save-manifest.json'),'utf8'));
 assert.deepEqual(MS.TREE.missions.map(m=>m.id),['m001-awakening',M2,ID]);assert.equal(MS.NUMBERS[3],ID);assert.equal(man.missionNumbers[3],ID);assert.ok(man.storyMissions.includes(ID));
 const m=MS.CORPORATE;assert.equal(m.number,3);assert.equal(m.title,'Corporate Connections');assert.equal(MS.label(3,m.title),'Mission 003 — Corporate Connections');assert.equal(m.giver,'admin');
 assert.deepEqual(m.start,{how:'person',accept:true},'in person with ACCEPT / NOT NOW, as 002');assert.deepEqual(m.offer.map(l=>l.text),BRIEF);assert.ok(m.offer.every(l=>l.who==='admin'));
 assert.deepEqual(m.objectives.map(o=>[o.id,o.kind]),[['travel-milked','enter'],['speak-eva','talk'],['meet-fish','talk'],['await-fish','await-call']]);assert.equal(m.objectives[0].place,'milked');
 const eva=m.objectives[1].say;assert.deepEqual(eva.slice(-2).map(l=>[l.who,l.text]),[['milked-eva','Oh, Admin! Tell him I said hi, too.'],['milked-eva','Fish is through the staff-only door. You\'ll find her in her office.']]);
 const fish=m.objectives[2].say;assert.deepEqual(fish.slice(1).map(l=>[l.who,l.text]),[['milked-fish',ZH],['v1-translator',EN]]);
 assert.equal(m.rewards,undefined,'no reward (the owner specified none)');assert.deepEqual(m.unlocks.map(u=>u.kind),['flag','contact','follow']);assert.deepEqual(m.unlocks[0],{kind:'flag',id:'milkedStaff',value:true,when:'speak-eva'});
 // the PROPOSED drafts: marked, short, non-explicit, never recorded
 const drafts=[...eva.slice(0,5),fish[0]].map(l=>l.text);assert.ok(drafts.every(MS.isProposed),'every drafted line is marked PROPOSED');assert.equal(MS.PROPOSED.length,6);
 for(const t of [...BRIEF,ZH,EN,'Oh, Admin! Tell him I said hi, too.'])assert.equal(MS.isProposed(t),false,'the owner\'s own words are not drafts');
 for(const t of MS.PROPOSED){assert.ok(t.length<=120,t);assert.ok(!/\b(sex|sperm|semen|naked|nude|porn|cum|ejaculat)/i.test(t),'tasteful: '+t);}
 const clips=new Set(Object.values(extra()).map(l=>l.text));for(const t of MS.PROPOSED)assert.ok(!clips.has(t),'a draft is text only: '+t);
 // the content check with the real lists (the game and the server use the same)
 const ctx={givers:new Map(e.givers.map(g=>[g.id,g])),places:G.placeIds(),subjects:new Set(G.photoSubjects(e.givers).map(g=>g.id))};
 assert.deepEqual(MC.check({format:MC.FORMAT,version:MC.VERSION,trees:MC.treesContent(MS.trees(),{givers:e.givers}).trees},ctx).errors,[]);
 assert.equal(require(R('void-runner/milked.js')).MISSION.number,null,'the old Milked draft no longer carries 3');
});

test('every recorded clip of Mission 003 matches its line exactly, with the speaker ids the dialogue uses; the translation pairing',()=>{
 const {MS}=env(),L=extra(),m=MS.CORPORATE;
 BRIEF.forEach((t,i)=>{const c=L['admin-m003-brief-'+(i+1)];assert.equal(c.text,t);assert.equal(c.speaker,'admin');assert.equal(c.voiceId,'DMyrgzQFny3JI1Y1paM5');});
 assert.deepEqual([L['eva-m003-hi'].text,L['eva-m003-staff-door'].text],m.objectives[1].say.slice(-2).map(l=>l.text));assert.equal(L['eva-m003-hi'].speaker,'milked-eva');assert.equal(L['eva-m003-hi'].voiceId,'gJx1vCzNCD1EQHT212Ls');
 assert.equal(L['fish-m003-zh'].text,ZH);assert.equal(L['fish-m003-zh'].speaker,'milked-fish');assert.equal(L['fish-m003-zh'].voiceId,'ggacvEjbmpoSuEinfFWs');
 assert.equal(L['fish-m003-en'].text,EN);assert.equal(L['fish-m003-en'].speaker,'milked-fish');assert.equal(L['fish-m003-en'].voiceId,'ggacvEjbmpoSuEinfFWs','the translation in Fish\'s OWN voice (the owner\'s standard)');assert.equal(L['translator-m003-fish-en'],undefined);
 const man=JSON.parse(fs.readFileSync(R('void-runner/assets/audio/voice/extra/manifest.json'),'utf8')),w={...man.translations['milked-fish'],...L['fish-m003-zh'].with};
 assert.equal(w.id,'fish-m003-en');assert.ok(w.offset>=.6&&w.offset<=.9,'the translation starts 0.6-0.9 s later');assert.ok(Math.abs(w.gain-.7)<.05,'the Mandarin at about 70%');
 // ONE setting per character (the owner may pick Fish's own voice speaking English): the voice, its live effect, the timing; the clip file is swappable in its own entry
 assert.deepEqual(Object.keys(man.translations),['milked-fish']);assert.equal(w.voiceId,'ggacvEjbmpoSuEinfFWs');assert.equal(w.effect,'device');assert.equal(man.cast,undefined,'no separate translator voice');assert.equal(L['fish-m003-zh'].with.offset,undefined,'not repeated per line');
 assert.equal(L['fish-m003-en'].file,'extra/fish-m003-en.ogg');assert.ok(!fs.existsSync(R('void-runner/assets/audio/voice/extra/translator-m003-fish-en.ogg')));assert.match(fs.readFileSync(R('void-runner/voice-clips.js'),'utf8'),/translations\[line\.speaker\]/);
 for(const id of ['admin-m003-brief-1','admin-m003-brief-2','admin-m003-brief-3','admin-m003-brief-4','eva-m003-hi','eva-m003-staff-door','fish-m003-zh','fish-m003-en'])assert.ok(fs.statSync(R('void-runner/assets/audio/voice/'+L[id].file)).size>1000,id);
 // milked.js names Eva and Fish exactly as the clips do
 const MK=require(R('void-runner/milked.js'));assert.equal(MK.MODELS.eva.id,'milked-eva');assert.equal(MK.MODELS.fish.id,'milked-fish');
 const vc=fs.readFileSync(R('void-runner/voice-clips.js'),'utf8');assert.match(vc,/line\.with/);assert.match(vc,/function device\(/);
 // the voices are recorded where the editor and the re-voice queue read them
 const T=require(R('void-runner/mission-trees.js')),j=JSON.parse(fs.readFileSync(R('tools/audio/revoice-engines.json'),'utf8')).characters;for(const id of ['milked-eva','milked-fish'])assert.equal(T.VOICE_ENGINES[id].voiceId,j[id].voiceId,id);
});

test('the flow: briefing in person (ACCEPT / NOT NOW), Milked, Eva (staff door), Fish (contact and follow, once), the mission ends; no reward',()=>{
 const x=env(),s=after002(x),credits=s.credits;
 let r=talk(x,s,'admin');assert.deepEqual(r.lines.map(l=>l.text),BRIEF);assert.equal(r.ask.mission,ID);assert.equal(s.universe.missions[ID],undefined,'nothing taken before ACCEPT');
 r=ev(x,s,{type:'decline',mission:ID});assert.equal(r.declined,true);r=talk(x,s,'admin');assert.equal(r.ask.mission,ID,'offered again after NOT NOW');
 r=ev(x,s,{type:'accept',mission:ID});assert.equal(r.offered,true);assert.equal(s.universe.trackedMission,ID);
 // the definition the Mission Log and the arrow read: the place, then Eva and Fish by their Milked interactions
 const d=x.M.definitions[ID];assert.equal(d.objectives[0].place,'milked');assert.equal(d.objectives[1].interaction,'milked-eva');assert.equal(d.objectives[2].interaction,'milked-fish');
 assert.equal(talk(x,s,'milked-eva').objective,null,'Eva has nothing before Milked is reached');
 r=place(x,s,'far-south','milked');assert.deepEqual(r.done,['travel-milked']);
 assert.equal(s.story.flags.mf_milkedStaff,undefined,'the staff door is still locked');
 r=talk(x,s,'milked-eva');assert.deepEqual(r.done,['speak-eva']);assert.equal(s.story.flags.mf_milkedStaff,true,'Eva lets the player through');
 assert.deepEqual(r.lines.slice(-2).map(l=>l.text),['Oh, Admin! Tell him I said hi, too.','Fish is through the staff-only door. You\'ll find her in her office.']);assert.equal(r.lines[3].who,'You');
 r=talk(x,s,'milked-fish');assert.deepEqual(r.done,['meet-fish','await-fish']);assert.equal(r.completed,true);assert.equal(r.reward,0);assert.equal(s.credits,credits);
 assert.deepEqual(r.lines.map(l=>l.who),['You','milked-fish','v1-translator']);assert.deepEqual(r.notes,['FISH ADDED TO CONTACTS','FOLLOWING FISH ON SOCIAL']);
 assert.equal(s.story.flags.v1Contacts,'milked-fish');assert.ok(x.DP.isFollowing(s.story.flags,'n:milked-fish'));assert.equal(s.story.flags['mt_'+ID],true);assert.equal(s.universe.trackedMission,null);
 // once: talking again, a reload, the migration change nothing
 for(let i=0;i<3;i++){talk(x,s,'milked-fish');talk(x,s,'milked-eva');place(x,s,'milked');}
 assert.equal(s.story.flags.v1Contacts,'milked-fish');assert.equal(x.DP.readFollowing(s.story.flags).filter(f=>f.key==='n:milked-fish').length,1,'followed once, never unfollowed by a repeat');
 const back=x.C.restore(JSON.stringify(s));assert.equal(back.universe.missions[ID].completed,true);assert.equal(back.story.flags.v1Contacts,'milked-fish');assert.equal(back.story.flags.mf_milkedStaff,true);
 // the V1 lists Fish as a contact only once she was added (not just by meeting her)
 const H=require(R('void-runner/hud-data.js'));assert.ok(H.contacts(s).some(c=>c.id==='milked-fish'&&c.name==='Fish'));const met={...s,story:{...s.story,met:['milked-fish'],flags:{}}};assert.ok(!H.contacts(met).some(c=>c.id==='milked-fish'));
 // a player who already follows Fish keeps following her (the unlock never toggles her off)
 const y=env(),t=after002(y);y.DP.toggleFollow(t.story.flags,{kind:'npc',id:'milked-fish'});talk(y,t,'admin');ev(y,t,{type:'accept',mission:ID});place(y,t,'milked');talk(y,t,'milked-eva');talk(y,t,'milked-fish');assert.ok(y.DP.isFollowing(t.story.flags,'n:milked-fish'));
});

test('each player\'s progress is their own (multiplayer): two saves never share a step, a flag or a contact',()=>{
 const x=env(),a=after002(x),b=after002(x);talk(x,a,'admin');ev(x,a,{type:'accept',mission:ID});place(x,a,'milked');talk(x,a,'milked-eva');
 assert.equal(a.story.flags.mf_milkedStaff,true);assert.equal(b.story.flags.mf_milkedStaff,undefined);assert.equal(b.universe.missions[ID],undefined);
 assert.equal(talk(x,b,'milked-eva').objective,null,'b has not accepted');assert.equal(b.story.flags.v1Contacts,undefined);
});

test('ACTIVE PLAYTIME: counts only while active (visible, in play), never in menus, pause, a hidden tab or offline; persists; the follow-up fires once',()=>{
 const {PT,MS,C}=env(),s=C.startDistrictCampaign(C.fresh()),f=s.story.flags,clock=PT.clock();
 // active or not
 assert.equal(PT.active({visible:true,mode:'walking'}),true);assert.equal(PT.active({visible:true,mode:'dialogue'}),true);assert.equal(PT.active({visible:true,mode:'play'}),true);
 for(const v of [{visible:false,mode:'walking'},{visible:true,mode:'menu'},{visible:true,mode:'pause'},{visible:true,mode:'walking',podCard:true},{visible:true,mode:'character-creator'},{visible:true,mode:'loading'}])assert.equal(PT.active(v),false,JSON.stringify(v));
 // counting: whole seconds go into the save; a long gap (offline, asleep) counts 5 s at most
 for(let i=0;i<10;i++)clock.add(s,.25,true);assert.equal(f.playSec,2);clock.add(s,3,false);assert.equal(f.playSec,2,'inactive time never counts');
 clock.add(s,3600,true);assert.equal(f.playSec,7,'a gap counts MAX_STEP at most');assert.ok(Number.isSafeInteger(f.playSec));
 // the follow-up: the clock starts when Mission 003 completes (its stamp), 15 minutes by default (one constant), fires once
 const F=MS.FOLLOWUPS;assert.deepEqual(F.map(x=>[x.event,x.after,x.minutes,x.from,x.status]),[['fish-followup-due',ID,15,'milked-fish','stub']]);
 assert.deepEqual(PT.fire(s,F),[],'not before the mission is done');assert.equal(PT.status(s,F)[0].started,false);
 s.universe.missions[ID]={acquired:true,completed:true,objectives:{}};PT.stamp(s,ID);assert.equal(f['pc_'+ID],7);
 for(let i=0;i<14*60;i++)clock.add(s,1,true);assert.deepEqual(PT.fire(s,F),[]);assert.equal(PT.status(s,F)[0].remaining,60);
 for(let i=0;i<120;i++)clock.add(s,1,false);assert.deepEqual(PT.fire(s,F),[],'two minutes in a menu changed nothing');
 for(let i=0;i<60;i++)clock.add(s,1,true);const due=PT.fire(s,F);assert.equal(due.length,1);assert.equal(due[0].event,'fish-followup-due');assert.equal(f['ev_fish-followup-due'],true);
 assert.deepEqual(PT.fire(s,F),[],'never twice');for(let i=0;i<600;i++)clock.add(s,1,true);assert.deepEqual(PT.fire(s,F),[]);
 // persists: the counter, the stamp and the fired flag are plain story flags (a reload, another device through the cloud save)
 const back=C.restore(JSON.stringify(s));assert.equal(back.story.flags.playSec,f.playSec);assert.equal(back.story.flags['ev_fish-followup-due'],true);assert.deepEqual(PT.fire(back,F),[]);
 // mid-way through a reload: the time already played is kept
 const t=C.startDistrictCampaign(C.fresh());t.universe.missions[ID]={acquired:true,completed:true,objectives:{}};const c1=PT.clock();for(let i=0;i<600;i++)c1.add(t,1,true);PT.stamp(t,ID);for(let i=0;i<400;i++)c1.add(t,1,true);
 const u=C.restore(JSON.stringify(t)),c2=PT.clock();assert.equal(PT.since(u,ID),400);for(let i=0;i<499;i++)c2.add(u,1,true);assert.deepEqual(PT.fire(u,F),[]);c2.add(u,1,true);assert.equal(PT.fire(u,F).length,1);
 // a mission completed before the stamp existed starts its clock the first time it is checked
 const v=C.startDistrictCampaign(C.fresh());v.story.flags.playSec=1000;v.universe.missions[ID]={acquired:true,completed:true,objectives:{}};assert.equal(PT.since(v,ID),0);assert.equal(v.story.flags['pc_'+ID],1000);
});

test('the reusable trigger "after active play": a mission started by Comms call N minutes of active play after another; checked in the game and on the server',()=>{
 const x=env(),{MC,MS,G}=x;
 const tree={id:'draft-fish',name:'Fish',missions:[{id:'draft-fish-m1',number:9,title:'Fish calls',type:'side',giver:'milked-fish',start:{how:'notification',channel:'comms',from:'milked-fish',header:'FISH // INCOMING CALL',text:'Test call.',when:{kind:'playtime',mission:ID,value:15}},
  objectives:[{id:'call',kind:'message',label:'Fish calls.'},{id:'meet',kind:'talk',npc:'milked-fish',label:'See Fish.'}]}]};
 const ctx={givers:new Map(x.e.givers.map(g=>[g.id,g])),places:G.placeIds()},doc=t=>({format:MC.FORMAT,version:MC.VERSION,trees:[...MC.treesContent(MS.trees(),{givers:x.e.givers}).trees,t]});
 assert.deepEqual(MC.check(doc(tree),ctx).errors,[]);
 for(const v of [0,1441,'15',2.5]){const b=JSON.parse(JSON.stringify(tree));b.missions[0].start.when.value=v;assert.ok(MC.check(doc(b),ctx).errors.length,String(v));}
 const b=JSON.parse(JSON.stringify(tree));b.missions[0].start.when.mission='nowhere';assert.ok(MC.check(doc(b),ctx).errors.length);
 assert.ok(G.START_WHEN.some(w=>w.id==='playtime'),'listed in the editor\'s trigger list');assert.ok(MC.WHEN.includes('playtime'));
 // runs: nothing until 15 active minutes after Mission 003; then the call arrives once
 MC.apply({format:MC.FORMAT,version:MC.VERSION,trees:[tree]},x.e);const s=after002(x);talk(x,s,'admin');ev(x,s,{type:'accept',mission:ID});place(x,s,'milked');talk(x,s,'milked-eva');talk(x,s,'milked-fish');
 assert.equal(s.universe.missions[ID].completed,true);assert.equal(Number.isSafeInteger(s.story.flags['pc_'+ID]),true,'stamped at completion');
 assert.equal(place(x,s,'milked').offered,false);s.story.flags.playSec=(s.story.flags['pc_'+ID]||0)+15*60-1;assert.equal(place(x,s,'milked').offered,false);
 s.story.flags.playSec++;const r=place(x,s,'milked');assert.equal(r.offered,true);assert.equal(r.messages[0].channel,'comms');assert.equal(r.messages[0].from,'milked-fish');assert.equal(place(x,s,'milked').offered,false,'once');
});

test('the Milked staff-only door, the guide route to Eva and Fish, and the place target',()=>{
 const MK=require(R('void-runner/milked.js')),GR=require(R('void-runner/guide-route.js')),P=require(R('void-runner/places.js')),E=require(R('void-runner/exploration-controller.js'));
 const L=MK.layout(),sd=L.solids.find(s=>s.staff);assert.equal(sd.id,'milked-staff-door');assert.equal(E.blocked(MK.STAFF_DOOR.x,MK.STAFF_DOOR.z,L),true,'locked');sd.open=true;assert.equal(E.blocked(MK.STAFF_DOOR.x,MK.STAFF_DOOR.z,L),false,'open for a granted player');
 assert.equal(MK.staffAccess({mf_milkedStaff:true}),true);assert.equal(MK.staffAccess({mf_milkedStaff:'yes'}),false);
 const t=P.target('milked');assert.ok(MK.VESTIBULE[0]<t[0]&&t[0]<MK.VESTIBULE[1]&&MK.VESTIBULE[2]<t[2]&&t[2]<MK.VESTIBULE[3],'the arrow leads to the front vestibule');
 const g=GR.graphFor('neochinatown'),pos=id=>MK.INTERACTIONS.find(i=>i.id===id).position,ids=(f,p)=>GR.plan(g,f,{x:p[0],z:p[2]}).map(w=>w.id);
 assert.deepEqual(ids({x:MK.DOOR.x,z:MK.DOOR.z+6},pos('milked-eva')),['milked-door>','milked-inner-door>','goal'],'street to Eva: the front doors');
 assert.deepEqual(ids({x:MK.DOOR.x,z:MK.DOOR.z-4.5},pos('milked-fish')).filter(w=>!w.endsWith('+')),['milked-side-door>','milked-staff-door>','milked-office-door>','goal'],'reception to Fish: the side door, the staff-only door, the office door');
 const N=require(R('void-runner/neochinatown.js'));assert.ok(!N.layout('street').solids.some(s=>s.staff),'the street layout is unchanged');
});
