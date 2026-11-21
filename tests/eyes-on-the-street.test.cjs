/* Mission 002 — Eyes on the Street (the owner's own mission, APPROVED 17 Nov 2026): the place registry and its enter / leave events, the in-person offer with ACCEPT / NOT NOW,
   the Comms call on entering NULL, photo checks, sending the photo to Admin, the reward paid once, saves, the Mission Editor's new step / trigger / reward kinds, NULL's cast. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p);
const fresh=()=>{for(const k of Object.keys(require.cache))if(k.includes('void-runner'+path.sep))delete require.cache[k];};
function env({draft=false}={}){fresh();
 const M=require(R('void-runner/mission-log.js')),B=require(R('void-runner/beginner.js')),C=require(R('void-runner/campaign.js')),U=require(R('void-runner/universe.js')),MC=require(R('void-runner/mission-content.js')),G=require(R('void-runner/mission-givers.js')),MS=require(R('void-runner/main-story.js')),PL=require(R('void-runner/places.js'));
 B.register(M);
 const givers=G.roster({registry:JSON.parse(fs.readFileSync(R('tools/audio/npc-voice-registry.json'),'utf8')),people:require(R('void-runner/district-people.js')).npcs(),story:require(R('void-runner/story-content.js')).characters,temple:require(R('void-runner/temple.js')).MODEL});
 const e={B,Missions:M,U,givers};MC.snapshot(e);MC.apply(null,e);e.draft=draft;return {e,M,B,C,U,MC,G,MS,PL};}
const ID='m002-eyes-on-the-street';
const district=C=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.appearanceOffered=true;return s;};
const ev=(x,s,e)=>x.MC.treeEvent(s,x.e,e,x.M,x.C);
const talk=(x,s,npc)=>ev(x,s,{type:'talk',npcs:[npc]});
const place=(x,s,...places)=>ev(x,s,{type:'place',places,at:Date.UTC(2026,10,17,13)});
// a player who finished Mission 001
function after001(x){const s=district(x.C);s.story.flags.podWakePending=false;ev(x,s,{type:'pod-exit',at:Date.UTC(2026,10,17,12)});talk(x,s,'admin');assert.equal(s.universe.missions['m001-awakening'].completed,true);return s;}
const accepted=x=>{const s=after001(x);talk(x,s,'admin');ev(x,s,{type:'accept',mission:ID});return s;};
const photo=(subjects,during)=>({subjects:subjects.map(([id,valid])=>({id,valid})),during,place:'null',at:1});
const OFFER=['I heard you\'re looking for work.','Before I trust you with anything important, I need you to do a little reconnaissance.','Head outside. Across the street, you\'ll find a nightclub called NULL. There\'s someone hanging out in there I need you to take their picture so I can scrape it for more data','I\'ll mark their location'];
const CALL=['Your V1 has a camera. Press L to open your device, then select the Camera app.','Point it at the target. Your device should identify them automatically.','Left click will take a picture','You can also zoom with the camera by using the mouse wheel','Once you\'ve taken the photograph, open Messages, select my conversation, attach the photograph, and send it to me.','Nothing complicated. Just keep your eyes open.'];

// ---------------------------------------------------------------- the place registry
test('places: a hierarchy System > City > Area > place seeded from the game\'s own data; the District rooms match neochinatown.js',()=>{
 const {PL}=env(),N=require(R('void-runner/neochinatown.js')),Q=require(R('void-runner/ncz-quarters.js')),NC=require(R('void-runner/ncz-nightclub.js'));
 assert.deepEqual(PL.DISTRICT_DOOR,N.door,'the District frame is the one neochinatown.js uses');
 for(const id of ['tessaly','neochinatown','port','oldtown','avenue','far-south','outskirts','corporate','temple','district','district-pods','district-vr','district-arcade','district-store','district-bar','district-meeting','district-alley','null','null-entrance','milked','gate-customs','gate-north','gate-function','gate-east','gate-south','gate-far-south'])assert.ok(PL.node(id),id);
 assert.deepEqual(PL.path('null'),['tessaly','ncz-planet','neochinatown','oldtown','null']);   // the planet level since the naming pass (18 Nov 2026)assert.equal(PL.label('district-bar'),'Tessaly System › NeoChinatown › NeoChinatown › Old Town › The Darknet District › The Bar');
 assert.deepEqual(PL.node('null').rects,[NC.RECT],'NULL is the club\'s hall with its front (ncz-nightclub.js RECT)');assert.deepEqual(PL.node('far-south').rects.slice(0,1),Q.QUARTERS['far-south'].streets.slice(0,1));
 const at=(lx,lz)=>{const [x,z]=N.toWorld(lx,lz);return PL.at({scene:'neochinatown',x,z});};
 // rooms by the District's own plan (music-director.js zones say the same)
 assert.equal(at(10,35)[0],'district-bar');assert.equal(at(10,48)[0],'district-store');assert.equal(at(-10,36)[0],'district-vr');assert.equal(at(-6,62)[0],'district-arcade');assert.equal(at(0,74)[0],'district-pods');assert.equal(at(9,62)[0],'district-meeting');
 assert.equal(at(0,23)[0],'district-vestibule');assert.equal(N.zone({x:N.toWorld(10,35)[0],z:N.toWorld(10,35)[1]}).area,'district');
 assert.deepEqual(PL.at({scene:'neochinatown',x:30,z:-55}),['null-floor','null','oldtown','neochinatown','ncz-planet','tessaly']);assert.equal(PL.deepest({scene:'neochinatown',x:48,z:-58.5}),'null-entrance');
 assert.equal(PL.deepest({scene:'temple',x:5,z:5}),'temple-chamber');assert.ok(PL.at({scene:'temple',x:5,z:5}).includes('temple'),'a scene beyond a gate is its own area');assert.deepEqual(PL.at({scene:'meridian',x:30,z:-55}),[],'another scene is nowhere here');
 // the picker: every node once, the group heading not selectable
 const o=PL.options();assert.equal(o.length,PL.NODES.length);assert.equal(o.find(x=>x.id==='gates').selectable,false);assert.equal(o.find(x=>x.id==='null').depth,4);
 assert.deepEqual(PL.target('null'),[NC.DOOR.x+1.6,1.7,NC.DOOR.z],'the arrow leads to NULL\'s door');
 // an optional height range
 const n={id:'roof',scene:'neochinatown',rects:[[0,10,0,10]],y:[5,9]};PL.NODES.push(n);PL.BY.set('roof',n);assert.ok(PL.at({scene:'neochinatown',x:1,y:6,z:1}).includes('roof'));assert.ok(!PL.at({scene:'neochinatown',x:1,y:1,z:1}).includes('roof'));
});
test('places: enter / leave events per player: no repeats, nothing on a menu or transition, through the vestibule without flapping',()=>{
 const {PL}=env(),N=require(R('void-runner/neochinatown.js')),t=PL.tracker(),w=(lx,lz)=>{const [x,z]=N.toWorld(lx,lz);return {scene:'neochinatown',x,z};};
 let r=t.update(w(10,35));assert.deepEqual(r.entered.sort(),['district','district-bar','ncz-planet','neochinatown','oldtown','tessaly'].sort());assert.deepEqual(r.left,[]);
 r=t.update(w(10,36));assert.deepEqual([r.entered,r.left],[[],[]],'standing still in the bar fires nothing again');
 r=t.update(null);assert.deepEqual([r.entered,r.left],[[],[]],'a menu or a transition changes nothing');assert.ok(t.has('district-bar'));
 // walking out: hall, vestibule, alley, Main Street, NULL
 const walk=[w(0,40),w(0,23),{scene:'neochinatown',x:126.9,z:-58},{scene:'neochinatown',x:60,z:-58},{scene:'neochinatown',x:52,z:-58.5},{scene:'neochinatown',x:47,z:-58.5},{scene:'neochinatown',x:40,z:-56}];
 const log=[];for(const p of walk){r=t.update(p);log.push(...r.entered.map(x=>'+'+x),...r.left.map(x=>'-'+x));}
 assert.deepEqual(log,['+district-hall','-district-bar','+district-vestibule','-district-hall','+alley-district-door','+district-alley','-district-vestibule','-district','+main-null','-alley-district-door','-district-alley','+null-entrance','+null','+null-floor','-main-null','-null-entrance']);   // the named stretches of street since the naming pass
 assert.equal(log.filter(x=>x==='+oldtown'||x==='-oldtown').length,0,'Old Town is never left on the way: no flapping across the vestibule');
 assert.equal(log.filter(x=>x==='+null').length,1);r=t.update({scene:'neochinatown',x:35,z:-58});assert.deepEqual([r.entered,r.left],[[],[]]);
 r=t.update({scene:'neochinatown',x:60,z:-58});assert.deepEqual(r.left,['null-floor','null']);
});

// ---------------------------------------------------------------- the mission
test('Mission 002 data: the Awakening tree, the owner\'s words verbatim, number 2, ledger and manifest',()=>{
 const {MS,MC,G,e}=env(),man=JSON.parse(fs.readFileSync(R('void-runner/save-manifest.json'),'utf8'));
 assert.equal(MS.TREE.name,'Awakening');assert.equal(MS.TREE_ID,'main-storyline','the id never changes');assert.deepEqual(MS.TREE.missions.map(m=>m.id).slice(0,2),['m001-awakening',ID]);   // Mission 003 follows (tests/mission-003.test.cjs)
 assert.deepEqual(man.storyMissions.slice(0,2),['m001-awakening',ID]);assert.equal(man.missionNumbers[1],'m001-awakening');assert.equal(man.missionNumbers[2],ID);assert.equal(MS.label(2,'Eyes on the Street'),'Mission 002 — Eyes on the Street');
 const m=MS.EYES;assert.equal(m.title,'Eyes on the Street');assert.equal(m.giver,'admin');assert.deepEqual(m.start,{how:'person',accept:true,no:'NOT NOW'});assert.deepEqual(m.offer.map(l=>l.text),OFFER);
 assert.deepEqual(m.objectives.map(o=>o.kind),['enter','photo','send-photo','talk']);assert.deepEqual(m.objectives[0].say.map(l=>l.text),CALL);assert.equal(m.objectives[0].via,'comms');
 assert.equal(m.objectives[2].say[0].text,'Received. That\'s exactly what I needed. Come back when you\'re ready.');assert.equal(m.objectives[2].wrong[0].text,'That\'s not the person I\'m looking for. Check the description and try again.');
 assert.equal(m.objectives[3].say[0].text,'Not bad. You can follow instructions and keep a low profile. I might have more work for you.');assert.equal(m.rewards,100);assert.deepEqual(m.unlocks,[{kind:'reputation',id:'admin',amount:10}]);
 // the content check with the real lists (what the game and the server use)
 const ctx={givers:new Map(e.givers.map(g=>[g.id,g])),places:G.placeIds(),subjects:new Set(G.photoSubjects(e.givers).map(g=>g.id))};
 assert.deepEqual(MC.check({format:MC.FORMAT,version:MC.VERSION,trees:MC.treesContent(MS.trees(),{givers:e.givers}).trees},ctx).errors,[]);
 assert.ok(ctx.subjects.has('juno-vex'));assert.equal(e.givers.find(g=>g.id==='juno-vex').canTalk,false,'nobody talks to Juno');
});
test('the offer: after 001, Admin offers it in person; NOT NOW changes nothing and it comes back; ACCEPT logs and tracks it; never offered twice',()=>{
 const x=env(),s=district(x.C);s.story.flags.podWakePending=false;ev(x,s,{type:'pod-exit'});
 assert.equal(x.MC.treeWants(s,x.e,['admin']),true);const first=talk(x,s,'admin');assert.equal(first.mission,'m001-awakening','001 first');assert.equal(first.ask,undefined);
 const r=talk(x,s,'admin');assert.deepEqual(r.ask,{mission:ID,title:'Eyes on the Street',accept:'ACCEPT',decline:'NOT NOW'});assert.deepEqual(r.lines.map(l=>l.text),OFFER);assert.equal(r.lines[0].who,'Admin');
 assert.equal(s.universe.missions[ID],undefined,'nothing is taken before ACCEPT');assert.deepEqual(x.M.all(s,x.C).map(m=>m.title),['Awakening']);
 const d=ev(x,s,{type:'decline',mission:ID});assert.equal(d.declined,true);assert.equal(s.universe.missions[ID],undefined);
 const again=talk(x,s,'admin');assert.equal(again.ask.mission,ID,'declining returns later: the next talk offers it again');
 const a=ev(x,s,{type:'accept',mission:ID});assert.equal(a.offered,true);assert.equal(s.universe.trackedMission,ID);
 const log=x.M.all(s,x.C).find(m=>m.id===ID);assert.equal(log.title,'Eyes on the Street');assert.equal(log.number,2);assert.equal(log.objective,'Go to NULL, across the street.');assert.equal(log.tracked,true);
 assert.deepEqual(x.M.guidance(s,x.M.tracked(s,x.C),true),{kind:'local',label:'Go to NULL, across the street.',place:'null'},'the yellow arrow: to NULL (mission-guide.js leads out through the vestibule)');
 assert.equal(ev(x,s,{type:'accept',mission:ID}).offered,false,'accepting twice does nothing');const t=talk(x,s,'admin');assert.equal(t.ask,undefined,'never offered twice once accepted');
 assert.equal(x.MC.treeWants(s,x.e,['admin']),false,'Admin goes back to his usual business while the player is away');
});
test('step 1: entering NULL completes it, also when already inside; Admin\'s Comms call (the owner\'s lines) reaches the V1 once',()=>{
 const x=env(),s=accepted(x);
 assert.equal(place(x,s,'oldtown','district-alley').objective,null,'the street is not NULL');
 const r=place(x,s,'null','oldtown','neochinatown');assert.deepEqual(r.done,['enter-null']);assert.deepEqual(r.lines,[],'not a dialogue: a call');
 assert.equal(r.messages.length,1);const c=r.messages[0];assert.equal(c.channel,'comms');assert.equal(c.from,'admin');assert.equal(c.fromName,'Admin');assert.equal(c.header,'ADMIN // INCOMING CALL');assert.deepEqual(c.text.split('\n'),CALL);assert.equal(c.id,ID+'/enter-null');
 const calls=x.MC.inbox(s,x.e,'comms');assert.equal(calls[0].id,ID+'/enter-null');assert.equal(calls[0].read,false);assert.ok(x.MC.markRead(s,calls[0].id));assert.equal(x.MC.inbox(s,x.e,'comms')[0].read,true);
 assert.deepEqual(place(x,s,'null').messages,[],'no repeat');
 const log=x.M.all(s,x.C).find(m=>m.id===ID);assert.equal(log.objective,'Photograph the target.');assert.deepEqual(x.M.guidance(s,x.M.tracked(s,x.C),true),{kind:'local',label:'Photograph the target.',place:'null',target:'juno-vex'},'the arrow and the marker: Juno');
 // already inside when the step starts: the next place tick completes it
 const y=env(),t=after001(y);talk(y,t,'admin');ev(y,t,{type:'accept',mission:ID});assert.deepEqual(place(y,t,'null').done,['enter-null']);
 for(const [k,v] of Object.entries(s.story.flags))assert.ok(/^[a-zA-Z][\w-]{0,63}$/.test(k)&&(typeof v==='boolean'||typeof v==='string'&&v.length<=200||Number.isSafeInteger(v)),k);
});
test('photo checks: in the frame, roughly centred, within 15 m, not blocked; the camera keeps the result with the photo',()=>{
 const Cam=require(R('void-runner/device-camera.js')),Gal=require(R('void-runner/device-gallery.js')),W=1366,H=768,c={x:683,y:384,front:true,clear:true};
 assert.equal(Cam.judge({points:[c],W,H,dist:8}).valid,true);
 assert.equal(Cam.judge({points:[{...c,x:300}],W,H,dist:8}).valid,true,'generous: a third of the way in still counts');
 assert.equal(Cam.judge({points:[{...c,x:60}],W,H,dist:8}).why,'too near the edge of the frame');assert.equal(Cam.judge({points:[{...c,x:-50}],W,H,dist:8}).why,'not in the frame');
 assert.equal(Cam.judge({points:[c],W,H,dist:15.5}).why,'too far away');assert.equal(Cam.judge({points:[{...c,clear:false}],W,H,dist:8}).why,'something is in the way');
 assert.equal(Cam.judge({points:[{...c,clear:false},{...c,y:450,clear:true}],W,H,dist:8}).valid,true,'a clear chest is enough when the head is hidden');assert.equal(Cam.judge({points:[{...c,front:false}],W,H,dist:8}).valid,false,'behind the camera');
 const meta=Gal.cleanMeta({subjects:[{id:'juno-vex',name:'Juno Vex',valid:true,dist:7.34},{id:'<x>',valid:true},{id:'dj-vanta',valid:false,why:'too far away'}],place:'null',during:[ID+'/photograph','bad step'],at:5,extra:1});
 assert.deepEqual(meta,{subjects:[{id:'juno-vex',name:'Juno Vex',valid:true,dist:7.3},{id:'dj-vanta',name:'',valid:false,why:'too far away'}],place:'null',during:[ID+'/photograph'],at:5,device:'',postedBy:''});assert.equal(Gal.cleanMeta(null),null,'an older photo has no checks');
});
test('step 2: a valid capture of Juno AND Halden Reyes (the same photo) during the step completes it; Juno alone, him alone or others do not; what the camera records as "during"',()=>{
 const x=env(),s=accepted(x);place(x,s,'null');
 assert.deepEqual(x.MC.during(s,x.e),[ID+'/photograph']);
 assert.equal(ev(x,s,{type:'photo',subjects:['dj-vanta']}).objective,null,'someone else');assert.equal(ev(x,s,{type:'photo',subjects:[]}).objective,null,'a photo that does not really show her');
 assert.equal(ev(x,s,{type:'photo',subjects:['juno-vex']}).objective,null,'Juno alone (Halden out of the frame or blocked) is not enough');assert.equal(ev(x,s,{type:'photo',subjects:['halden-reyes','dj-vanta']}).objective,null,'Halden without her');
 const r=ev(x,s,{type:'photo',subjects:['halden-reyes','juno-vex']});assert.deepEqual(r.done,['photograph']);assert.deepEqual(x.MC.during(s,x.e),[ID+'/send-photo']);
 assert.equal(ev(x,s,{type:'photo',subjects:['juno-vex','halden-reyes']}).objective,null,'no repeat');
});
test('step 3: sending the photo to Admin; the wrong photo is refused (unlimited tries, no fail); the right one completes it once',()=>{
 const x=env(),s=accepted(x);place(x,s,'null');ev(x,s,{type:'photo',subjects:['juno-vex','halden-reyes']});
 const H=['halden-reyes',true],DURING=[ID+'/photograph'],wrong=[['wrong person',photo([['dj-vanta',true]],DURING)],['Juno alone',photo([['juno-vex',true]],DURING)],['Juno, Halden blocked',photo([['juno-vex',true],['halden-reyes',false]],DURING)],['Halden alone',photo([H],DURING)],['not really her',photo([['juno-vex',false],H],DURING)],['taken earlier',photo([['juno-vex',true],H],[ID+'/enter-null'])],['an old photo',{subjects:[{id:'juno-vex',valid:true},{id:'halden-reyes',valid:true}]}],['no checks',null]];
 for(const [why,p] of wrong){const r=ev(x,s,{type:'send-photo',to:'admin',photo:p});assert.equal(r.reply.ok,false,why);assert.equal(r.reply.lines[0].text,'That\'s not the person I\'m looking for. Check the description and try again.');assert.deepEqual(r.done,[]);}
 assert.equal(ev(x,s,{type:'send-photo',to:'iris',photo:photo([['juno-vex',true]],DURING)}).reply,undefined,'Iris is not waiting for it');
 const ok=ev(x,s,{type:'send-photo',to:'admin',photo:photo([['juno-vex',true],['dj-vanta',true],H],DURING)});assert.deepEqual(ok.done,['send-photo']);assert.equal(ok.reply.ok,true);assert.equal(ok.reply.lines[0].text,'Received. That\'s exactly what I needed. Come back when you\'re ready.');assert.deepEqual(ok.lines,[]);
 const again=ev(x,s,{type:'send-photo',to:'admin',photo:photo([['juno-vex',true],H],DURING)});assert.equal(again.reply,undefined,'no duplicate completion');assert.deepEqual(again.done,[]);
 assert.equal(x.MC.photoOk(photo([['juno-vex',true]],DURING),'juno-vex',x.MS.EYES),true,'one person still works for a one-person step');assert.equal(x.MC.photoOk(photo([['juno-vex',true]],DURING),['juno-vex','halden-reyes'],x.MS.EYES),false);
 assert.equal(x.MC.photoOk(photo([['juno-vex',true],H],DURING),['juno-vex','halden-reyes'],x.MS.EYES),true);assert.deepEqual(x.MC.photoNeed(x.MS.EYES.objectives[1]),['juno-vex','halden-reyes']);assert.deepEqual(x.MC.photoNeed(x.MS.EYES.objectives[2]),['juno-vex','halden-reyes']);
 assert.deepEqual(x.M.guidance(s,x.M.tracked(s,x.C),true),{kind:'local',label:'Return to Admin.',interaction:'admin'},'the arrow back to Admin');
});
test('step 4 and the reward: Admin\'s line, 100 credits and better standing with Admin, paid once; the save keeps it',()=>{
 const x=env(),s=accepted(x);place(x,s,'null');ev(x,s,{type:'photo',subjects:['juno-vex','halden-reyes']});ev(x,s,{type:'send-photo',to:'admin',photo:photo([['juno-vex',true],['halden-reyes',true]],[ID+'/photograph'])});
 const credits=s.credits,r=talk(x,s,'admin');
 assert.deepEqual(r.done,['return']);assert.equal(r.completed,true);assert.equal(r.lines[0].text,'Not bad. You can follow instructions and keep a low profile. I might have more work for you.');
 assert.equal(r.reward,100);assert.equal(s.credits,credits+100);assert.equal(s.story.relationships.admin,10);assert.deepEqual(r.notes,['BETTER STANDING WITH ADMIN']);
 assert.equal(s.story.flags['mt_'+ID],true);assert.equal(s.universe.trackedMission,null);
 for(let i=0;i<3;i++){talk(x,s,'admin');place(x,s,'null');}assert.equal(s.credits,credits+100,'paid once');assert.equal(s.story.relationships.admin,10);
 // the migration never pays it again either
 x.MC.migrate(s,[],x.B.flagOf,x.e.trees);assert.equal(s.credits,credits+100);
 const back=x.C.restore(JSON.stringify(s));assert.equal(back.universe.missions[ID].completed,true);assert.equal(back.story.relationships.admin,10);assert.equal(back.credits,credits+100);
 const loaded=x.C.restore(JSON.stringify(s));assert.equal(talk(x,loaded,'admin').reward,0,'not after a reload either');
});
test('a reload part-way keeps the step; the Comms call and records survive restore',()=>{
 const x=env(),s=accepted(x);place(x,s,'null');const back=x.C.restore(JSON.stringify(s));
 assert.equal(back.universe.trackedMission,ID);assert.deepEqual(back.universe.missions[ID].objectives,{'enter-null':true});assert.equal(x.MC.inbox(back,x.e,'comms').filter(m=>m.mission===ID).length,1);
});

// ---------------------------------------------------------------- reusable pieces (the Mission Editor's new kinds)
test('new reusable kinds: enter / leave a place (steps and triggers), photo and send-photo steps, reputation with an NPC or a faction, in-person accept',()=>{
 const x=env(),{MC,G}=x,ctx={givers:new Map(x.e.givers.map(g=>[g.id,g])),places:G.placeIds(),subjects:new Set(G.photoSubjects(x.e.givers).map(g=>g.id))};
 const story=MC.treesContent(x.MS.trees(),{givers:x.e.givers}).trees,doc=t=>({format:MC.FORMAT,version:MC.VERSION,trees:[...story,t]});
 const tree={id:'draft-kinds',name:'Kinds',missions:[{id:'draft-kinds-m1',number:47,title:'K',type:'side',giver:'iris',start:{how:'person',accept:true},objectives:[
  {id:'a',label:'Leave the bar',kind:'leave',place:'district-bar'},{id:'b',label:'Go into the arcade',kind:'enter',place:'district-arcade',via:'messages',say:[{who:'iris',text:'TEST message.'}]},
  {id:'c',label:'Photograph Rin',kind:'photo',npc:'rin-takeda'},{id:'d',label:'Send it to Iris',kind:'send-photo',npc:'iris',subject:'rin-takeda',say:[{who:'iris',text:'TEST ok.'}],wrong:[{who:'iris',text:'TEST no.'}]}],
  unlocks:[{kind:'reputation',id:'iris',amount:5},{kind:'reputation',id:'communion',amount:-3,when:'c'}]},
  {id:'draft-kinds-m2',number:48,title:'L',type:'side',giver:'admin',start:{how:'notification',channel:'notify',from:'admin',text:'TEST left.',when:{kind:'leave',place:'district'}},objectives:[{id:'a',label:'x',kind:'talk',npc:'admin'}]}]};
 assert.deepEqual(MC.check(doc(tree),ctx).errors,[]);
 const bad=[t=>{t.missions[0].objectives[0].place='atlantis';},t=>{t.missions[0].objectives[2].npc='admin-x';},t=>{t.missions[0].objectives[3].subject='nobody';},t=>{t.missions[0].objectives[2].subject='rin-takeda';},
  t=>{t.missions[0].objectives[0].wrong=[{who:'iris',text:'x'}];},t=>{t.missions[0].objectives[1].via='fax';},t=>{t.missions[0].objectives[1].say=[];},t=>{t.missions[0].unlocks[0].amount=0;},t=>{t.missions[0].unlocks[0].amount=500;},
  t=>{t.missions[0].unlocks[0].id='nobody';},t=>{t.missions[0].unlocks[1].id='player';},t=>{t.missions[0].start={how:'person',accept:'yes'};},t=>{t.missions[1].start.yes='ACCEPT';},/* labels need the ask (any start may ask since 19 Nov 2026) */t=>{t.missions[1].start.when={kind:'leave',place:'atlantis'};}];
 for(const f of bad){const t=MC.clone(tree);f(t);assert.equal(MC.check(doc(t),ctx).ok,false,f.toString());}
 // and they run
 MC.apply(doc(tree),x.e,ctx);const s=district(x.C);s.story.flags.podWakePending=false;ev(x,s,{type:'pod-exit'});talk(x,s,'admin');
 const ask=talk(x,s,'iris');assert.equal(ask.ask.mission,'draft-kinds-m1');ev(x,s,{type:'accept',mission:'draft-kinds-m1'});
 assert.deepEqual(place(x,s,'district-bar','district').done,[],'still in the bar');assert.deepEqual(place(x,s,'district-hall','district').done,['a']);
 const r=place(x,s,'district-arcade','district');assert.deepEqual(r.done,['b']);assert.equal(r.messages[0].channel,'messages');assert.equal(r.messages[0].header,'IRIS // MESSAGE');assert.equal(x.MC.inbox(s,x.e,'messages')[0].text,'TEST message.');
 ev(x,s,{type:'photo',subjects:['rin-takeda']});assert.equal(s.progression.reputation.communion,-3,'a faction: progression.reputation');
 const ok=ev(x,s,{type:'send-photo',to:'iris',photo:photo([['rin-takeda',true]],['draft-kinds-m1/c'])});assert.equal(ok.completed,true);assert.equal(s.story.relationships.iris,5);
 // the leave trigger fires on leaving (an edge), not for anyone who is simply elsewhere
 assert.equal(ev(x,s,{type:'place',places:['port'],left:[]}).offered,false);assert.equal(ev(x,s,{type:'place',places:['district-alley'],left:['district']}).offered,true);
 // the editor lists them
 assert.ok(['enter','leave','photo','send-photo'].every(k=>G.STEP_KINDS.find(s=>s.id===k).supported));assert.equal(G.UNLOCK_KINDS.find(u=>u.id==='reputation').supported,true);assert.ok(G.START_WHEN.some(w=>w.id==='leave'));assert.ok(G.START_HOW.some(h=>h.id==='person-accept'));
 assert.deepEqual(MC.treeBlockers({title:'x',giver:'iris',objectives:[{kind:'photo',label:'x'},{kind:'send-photo',label:'y',npc:'iris'},{kind:'enter',label:'z'}]},x.e.givers),['step 1: choose who is photographed','step 2: choose who must be in the photo','step 3: choose the place']);
});
test('server parity: the admin inventory lists the places, the people the camera identifies and the factions; clean_save needs nothing new',()=>{
 const inv=JSON.parse(fs.readFileSync(R('void_runner_admin_inventory.json'),'utf8')).missionEditor,{G,PL}=env();
 for(const id of ['null','null-entrance','district-bar','gate-north'])assert.ok(inv.places.includes(id),id);assert.ok(!inv.places.includes('gates'),'a group heading is not a place');
 assert.ok(inv.subjects.includes('juno-vex'));assert.deepEqual(inv.factions,G.FACTIONS);assert.ok(inv.stepKinds.includes('send-photo'));assert.ok(inv.unlockKinds.includes('reputation'));
 const py=fs.readFileSync(R('void_runner_progression.py'),'utf8');for(const f of G.FACTIONS)assert.ok(py.includes("'"+f+"'"),'the server keeps faction standing for '+f);
});
test('NULL: the cast per quality (the owner\'s table); Juno Vex and Halden Reyes are always there; no VIP pair or queue',()=>{
 const NC=require(R('void-runner/ncz-nightclub.js')),total=q=>{const c=NC.castCounts(q);return c.dancers+c.staff+c.guests+2;};
 assert.deepEqual(['low','medium','high','ultra'].map(total),[7,10,11,11]);
 const src=fs.readFileSync(R('void-runner/ncz-nightclub.js'),'utf8');assert.ok(!/spot\('(vip|queue)-/.test(src),'the VIP pair and the outside queue are gone');assert.ok(!/'fixer-01'.*CAST|CAST=\[[^\]]*'fixer-01'/.test(src),'no crowd figure shares Juno\'s look');
 const j=NC.JUNO;assert.deepEqual(j.appearance,{v:1,base:'female',look:'fixer-01',hair:'bob01',hairColor:'silver',clothingColor:'black',accessories:['gear-visor']});
 assert.ok(j.x>=NC.BUILT.solid[0].x0&&j.x<=NC.BUILT.solid[0].x1&&j.z<NC.BUILT.solid[0].z0,'on a stool at the bar');assert.ok(Math.abs(j.x-28.8)>3,'apart from the bar guests at the west end');
 const A=require(R('void-runner/character-appearance.js'));assert.equal(A.validate(j.appearance),true,'a look the character kit can build');
 // Halden Reyes: a man in the kit's suit (TRADER, no hat), tinted dark; beside Juno, 0.6 to 0.9 m, turned toward her (and she toward him)
 const h=NC.HALDEN,d=Math.hypot(h.x-j.x,h.z-j.z);assert.equal(A.validate(h.appearance),true);assert.equal(h.appearance.base,'male');assert.equal(h.appearance.look,'vesper-trader');assert.deepEqual(h.appearance.accessories,[]);
 assert.ok(d>=.6&&d<=.9,'close together: '+d);const facing=(yaw,fx,fz,tx,tz)=>Math.cos(yaw-Math.atan2(tx-fx,tz-fz));assert.ok(facing(h.yaw,h.x,h.z,j.x,j.z)>.9,'he faces her');assert.ok(facing(j.yaw,j.x,j.z,h.x,h.z)>.8,'she is turned toward him');
 assert.ok(h.cloth.every(c=>c<.6),'his suit is darker than the kit colour');assert.ok(!/CAST=\[[^\]]*'vesper-trader'/.test(src),'nobody in the crowd wears his look');
 assert.match(src,/spot\('bartender'[^;]*\{plain:true\}\)/);assert.match(src,/spot\('bar-guest-a'[^;]*\{plain:true\}\)/);assert.match(src,/spot\('bar-guest-b'[^;]*\{plain:true\}\)/);assert.match(src,/SUITED=\[[^\]]*'district-smuggler','vesper-trader'\]/);assert.match(src,/SUITED=\['npc-fixer','npc-office-m',/,'the street figures in suits (NPC upgrade) are kept from the plain spots too');
 assert.ok(NC.BEATS.some(b=>b[0]==='device')&&NC.BEATS.some(b=>b[0]==='talk'&&b[1]!=='talk')&&NC.BEATS.some(b=>b[1]==='talk'),'they take turns talking, and she still checks her device');
});
test('several people in one photo: the editor keeps them in `subjects`, the check accepts them, the draft runs them',()=>{
 const x=env(),{MC,G}=x,ctx={givers:new Map(x.e.givers.map(g=>[g.id,g])),places:G.placeIds(),subjects:new Set(G.photoSubjects(x.e.givers).map(g=>g.id))};
 assert.ok(ctx.subjects.has('halden-reyes'),'the camera identifies Halden Reyes');assert.equal(x.e.givers.find(g=>g.id==='halden-reyes').canTalk,false,'nobody talks to him');
 const story=MC.treesContent(x.MS.trees(),{givers:x.e.givers}).trees,doc=t=>({format:MC.FORMAT,version:MC.VERSION,trees:t?[...story,t]:story});
 const eyes=story[0].missions.find(m=>m.id===ID);assert.deepEqual(eyes.objectives[1].subjects,['juno-vex','halden-reyes'],'published with both');assert.deepEqual(eyes.objectives[2].subjects,['juno-vex','halden-reyes']);
 assert.equal(MC.check(doc(),ctx).ok,true,'the shipped tree passes');
 const tree={id:'draft-pair',name:'Pair',missions:[{id:'draft-pair-m1',number:49,title:'P',type:'side',giver:'iris',objectives:[{id:'p',label:'Photograph them',kind:'photo',npc:'rin-takeda',subjects:['rin-takeda','juno-vex']},{id:'s',label:'Send it',kind:'send-photo',npc:'iris',subject:'rin-takeda',subjects:['rin-takeda','juno-vex'],say:[{who:'iris',text:'TEST ok.'}]}]}]};
 assert.equal(MC.check(doc(tree),ctx).ok,true,JSON.stringify(MC.check(doc(tree),ctx).errors||''));
 for(const f of [o=>{o.subjects=['juno-vex','rin-takeda'];},o=>{o.subjects=['rin-takeda','nobody'];},o=>{o.subjects=['rin-takeda','rin-takeda'];},o=>{o.subjects=[];},o=>{o.subjects='rin-takeda';},o=>{o.subjects=Array(7).fill(0).map((_,i)=>'rin-takeda'+i);}]){const t=MC.clone(tree);f(t.missions[0].objectives[0]);assert.equal(MC.check(doc(t),ctx).ok,false,f.toString());}
 {const t=MC.clone(tree);t.missions[0].objectives.push({id:'t',label:'x',kind:'talk',npc:'iris',subjects:['iris']});assert.equal(MC.check(doc(t),ctx).ok,false,'only photo steps name several people');}
});
test('hints: the next thing to do, from the player\'s real state, the key from the binding; tagged for the Help switch',()=>{
 const src=fs.readFileSync(R('void-runner/mission-guide.js'),'utf8');assert.match(src,/hint\.dataset\.help='1'/);
 // the pure part, lifted out of the browser file
 const body=src.slice(src.indexOf(' function hintFor('),src.indexOf(' let shown=\'\';'));const hintFor=new Function(body+';return hintFor;')();
 const v=(o={})=>({step:{kind:'photo',npc:'juno-vex'},deviceOpen:false,app:null,thread:null,attach:{},camera:false,key:'K',name:id=>id==='admin'?'Admin':id,...o}),id=o=>hintFor(v(o)).id;
 assert.equal(hintFor(v()).text,'Press <b>K</b> to open your V1');assert.equal(id({deviceOpen:true}),'camera');assert.equal(id({camera:true}),'shoot');
 const sp={step:{kind:'send-photo',npc:'admin'}};assert.equal(id(sp),'open');assert.equal(id({...sp,deviceOpen:true}),'messages');assert.equal(id({...sp,deviceOpen:true,app:'messages'}),'thread');
 assert.equal(id({...sp,deviceOpen:true,app:'messages',thread:'admin'}),'attach');assert.equal(id({...sp,deviceOpen:true,app:'messages',thread:'admin',attach:{photo:'p1'}}),'send');
 assert.equal(hintFor(v({step:{kind:'talk'}})),null,'nothing for other steps');assert.equal(hintFor({}),null);
});
test('the game page loads the new files in order',()=>{
 const html=fs.readFileSync(R('void-runner.html'),'utf8'),i=f=>html.indexOf('void-runner/'+f);
 for(const f of ['talk-choice.js','places.js','mission-guide.js'])assert.ok(i(f)>0,f);
 assert.ok(i('conversation-ui.js')<i('talk-choice.js')&&i('talk-choice.js')<i('main-story.js')&&i('places.js')<i('mission-givers.js')&&i('live-content.js')<i('mission-guide.js')&&i('ncz-quarters.js')<i('places.js'));
 assert.equal(fs.readFileSync(R('static/void-runner.html'),'utf8'),html);
});
test('straight on to Mission 003: Admin\'s "I might have more work for you" is followed in the same conversation by the Corporate Connections offer (ACCEPT / NOT NOW); a save that already finished 002 gets the offer by talking to Admin',()=>{
 const x=env(),s=accepted(x);place(x,s,'null');ev(x,s,{type:'photo',subjects:['juno-vex','halden-reyes']});ev(x,s,{type:'send-photo',to:'admin',photo:photo([['juno-vex',true],['halden-reyes',true]],[ID+'/photograph'])});
 const C3='m003-corporate-connections',r=talk(x,s,'admin');
 assert.equal(r.mission,ID,'the completion is still reported for 002');assert.equal(r.completed,true);assert.equal(r.reward,100);
 assert.deepEqual(r.lines.map(l=>l.text),['Not bad. You can follow instructions and keep a low profile. I might have more work for you.',...x.MS.CORPORATE.offer.map(l=>l.text)],'the completion line, then 003\'s offer, only shipped lines');
 assert.ok(r.lines.every(l=>l.who==='Admin'));assert.deepEqual(r.ask,{mission:C3,title:'Corporate Connections',accept:'ACCEPT',decline:'NOT NOW'});assert.equal(s.universe.missions[C3],undefined,'nothing taken before ACCEPT');
 // NOT NOW: the next conversation offers it again; ACCEPT takes it
 ev(x,s,{type:'decline',mission:C3});const again=talk(x,s,'admin');assert.equal(again.ask.mission,C3);assert.equal(again.reward,0);assert.deepEqual(again.lines.map(l=>l.text),x.MS.CORPORATE.offer.map(l=>l.text));
 const acc=ev(x,s,{type:'accept',mission:C3});assert.equal(acc.offered,true);assert.equal(s.universe.missions[C3].acquired,true);assert.equal(s.universe.trackedMission,C3);
 // an existing save that finished 002 before this change (no offer was ever shown): talking to Admin offers 003
 const old=x.C.restore(JSON.stringify((()=>{const t=accepted(x);place(x,t,'null');ev(x,t,{type:'photo',subjects:['juno-vex','halden-reyes']});ev(x,t,{type:'send-photo',to:'admin',photo:photo([['juno-vex',true],['halden-reyes',true]],[ID+'/photograph'])});talk(x,t,'admin');ev(x,t,{type:'decline',mission:C3});return t;})()));
 assert.equal(old.universe.missions[ID].completed,true);assert.equal(x.MC.treeWants(old,x.e,['admin']),true,'Admin still has something for this player');const o=talk(x,old,'admin');assert.equal(o.ask.mission,C3);assert.equal(o.lines[0].text,x.MS.CORPORATE.offer[0].text);
 // Iris completing nothing never offers Admin's mission
 assert.equal(talk(x,old,'iris').ask,undefined);
});
