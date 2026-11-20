/* The Awakening continuation (the owner's spec, 20 Nov 2026): Missions 004-011 and the First Cargo Delivery tree (012), played through the mission engine from a fresh
   character and from a character who has just finished Mission 003; the owner's words verbatim; reloads in the middle; the reward and the Kestrel once only; the cargo
   tree's unlock; the ledger and the save manifest. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p);
const fresh=()=>{for(const k of Object.keys(require.cache))if(k.includes('void-runner'+path.sep))delete require.cache[k];};
function env(){fresh();
 const M=require(R('void-runner/mission-log.js')),B=require(R('void-runner/beginner.js')),C=require(R('void-runner/campaign.js')),U=require(R('void-runner/universe.js')),MC=require(R('void-runner/mission-content.js')),G=require(R('void-runner/mission-givers.js')),MS=require(R('void-runner/main-story.js')),GC=require(R('void-runner/game-clock.js')),DP=require(R('void-runner/district-people.js')),MM=require(R('void-runner/mission-mechanics.js'));
 B.register(M);
 const givers=G.roster({registry:JSON.parse(fs.readFileSync(R('tools/audio/npc-voice-registry.json'),'utf8')),people:DP.npcs(),story:require(R('void-runner/story-content.js')).characters,temple:require(R('void-runner/temple.js')).MODEL});
 const e={B,Missions:M,U,givers};MC.snapshot(e);MC.apply(null,e);return {e,M,B,C,U,MC,G,MS,GC,MM};}
const ev=(x,s,e)=>x.MC.treeEvent(s,x.e,e,x.M,x.C);
const talk=(x,s,npc)=>ev(x,s,{type:'talk',npcs:[npc]});
const place=(x,s,places,extra={})=>ev(x,s,{type:'place',places,...extra});
const step=(x,s,m)=>{const d=x.MS[m]||null,id=d?d.id:m,r=s.universe.missions[id];if(!r)return null;const mm=x.e.trees.flatMap(t=>t.missions).find(y=>y.id===id);return (mm.objectives.find(o=>r.objectives[o.id]!==true)||{}).id||'(done)';};
const reload=(x,s)=>x.C.restore(JSON.stringify(s));
const passTime=(s,min)=>{s.story.flags.gameMin=(Number(s.story.flags.gameMin)||0)+min;};
const done=(s,id)=>!!(s.universe.missions[id]&&s.universe.missions[id].completed);
/* Missions 001 to 003 played through (the player's real path). */
function through003(x,s){ev(x,s,{type:'pod-exit',at:Date.UTC(2026,10,20,12)});talk(x,s,'admin');talk(x,s,'admin');ev(x,s,{type:'accept',mission:'m002-eyes-on-the-street'});place(x,s,['null']);
 ev(x,s,{type:'photo',subjects:['juno-vex','halden-reyes']});ev(x,s,{type:'send-photo',to:'admin',photo:{subjects:[{id:'juno-vex',valid:true},{id:'halden-reyes',valid:true}],during:['m002-eyes-on-the-street/photograph'],place:'null',at:1}});
 talk(x,s,'admin');ev(x,s,{type:'accept',mission:'m003-corporate-connections'});place(x,s,['milked']);talk(x,s,'milked-eva');talk(x,s,'milked-fish');
 assert.ok(done(s,'m003-corporate-connections'),'003 done');return s;}
const newChar=x=>{const s=x.C.startDistrictCampaign(x.C.fresh());s.story.flags.appearanceOffered=true;s.story.flags.podWakePending=false;return s;};
const K=(m,o)=>m+'/'+o;
/* 004 to 012, with a reload after every mission and in the middle of several. Returns the state. */
function play(x,s0){let s=s0;const id=n=>x.MS['M0'+String(n).padStart(2,'0')].id;
 // 004: Fish's call 6 in-game hours after 003 (nothing before that)
 place(x,s,['far-south']);assert.equal(s.universe.missions[id(4)],undefined,'Fish has not called yet');passTime(s,359);place(x,s,['far-south']);assert.equal(s.universe.missions[id(4)],undefined,'not before 6 in-game hours');
 passTime(s,2);const call=place(x,s,['far-south']);assert.equal(call.offered,true);assert.equal(call.messages[0].channel,'comms');assert.equal(call.messages[0].text,x.MS.FISH_CALL.join('\n'),'Fish\'s words verbatim');
 assert.equal(step(x,s,'M004'),'travel');s=reload(x,s);
 const iris=place(x,s,['underground','under-tea-room']);assert.equal(iris.messages[0].from,'iris');assert.match(iris.messages[0].text,/^Fish brought me up to speed\./);
 assert.equal(ev(x,s,{type:'overhear',step:K(id(4),'overhear')}).objective,null,'events in the wrong order do nothing');
 ev(x,s,{type:'observe',step:K(id(4),'locate')});ev(x,s,{type:'observe',step:K(id(4),'blend-in')});s=reload(x,s);
 const oh=ev(x,s,{type:'overhear',step:K(id(4),'overhear')});assert.ok(oh.notes.some(n=>/^EVIDENCE/.test(n)),'the conversation is kept as evidence');assert.ok(x.MM.hasEvidence(s,'tea-talk'));
 const rep=ev(x,s,{type:'report',step:K(id(4),'report')});assert.equal(rep.completed,true);assert.equal(rep.messages[0].from,'milked-fish');assert.match(rep.messages[0].text,/^Fifty-one percent\?/);s=reload(x,s);
 // 005: Iris calls; the apartment; the hack; the computer; COPY TO V1; out; report to Admin
 const i5=place(x,s,['avenue']);assert.equal(i5.offered,true);assert.match(i5.messages[0].text,/^Fish sent me the address\./);place(x,s,['avenue']);assert.equal(step(x,s,'M005'),'find-105');
 place(x,s,['avenue'],{apt:id(5)+'/reyes',mod:'hall'});assert.equal(step(x,s,'M005'),'hack-door');
 ev(x,s,{type:'hack',ap:'reyes/hall.d0',mission:id(5)});place(x,s,['avenue'],{apt:id(5)+'/reyes',mod:'flat'});ev(x,s,{type:'apt-use',mission:id(5),apt:'reyes',object:'computer',mod:'flat'});
 assert.equal(step(x,s,'M005'),'copy');s=reload(x,s);ev(x,s,{type:'collect',step:K(id(5),'copy')});assert.ok(['br-proposal','reyes-message','reyes-calendar'].every(e=>x.MM.hasEvidence(s,e)));
 place(x,s,['avenue']);assert.equal(step(x,s,'M005'),'send');assert.equal(ev(x,s,{type:'report',step:K(id(5),'send')}).completed,true);
 // 006: the office, the guard (sneak), the documents, the three calls (callbacks after their delays)
 place(x,s,['avenue']);assert.ok(s.universe.missions[id(6)]);place(x,s,['avenue'],{apt:id(6)+'/veyra',mod:'lobby'});place(x,s,['avenue'],{apt:id(6)+'/veyra',mod:'hall'});
 place(x,s,['avenue'],{apt:id(6)+'/veyra',mod:'office'});assert.equal(step(x,s,'M006'),'manager-pc');ev(x,s,{type:'apt-use',mission:id(6),apt:'veyra',object:'manager-pc',mod:'office'});
 ev(x,s,{type:'collect',step:K(id(6),'download')});ev(x,s,{type:'collect',step:K(id(6),'documents')});const out6=place(x,s,['avenue']);assert.equal(out6.messages.length,1,'Admin calls as the player leaves');
 assert.equal(step(x,s,'M006'),'iris-call','the next call waits for its delay');for(const t of x.MC.timersNow(s,x.e))x.MC.timerSet(s,t,0);ev(x,s,{type:'timer'});for(const t of x.MC.timersNow(s,x.e))x.MC.timerSet(s,t,0);ev(x,s,{type:'timer'});
 assert.ok(done(s,id(6)),'006 done');s=reload(x,s);
 // 007: the fight pit, Juno, the meeting, the photo, the tail, the entrance, report
 const i7=place(x,s,['underground']);assert.match(i7.messages[0].text,/^Juno's already inside\./);place(x,s,['underground','under-fight-pit']);
 ev(x,s,{type:'observe',step:K(id(7),'find-juno')});ev(x,s,{type:'overhear',step:K(id(7),'observe')});ev(x,s,{type:'photo',subjects:['blackrock-associate']});s=reload(x,s);
 assert.equal(step(x,s,'M007'),'follow');ev(x,s,{type:'tail',step:K(id(7),'follow')});ev(x,s,{type:'observe',step:K(id(7),'see-entrance')});ev(x,s,{type:'photo',subjects:['blackrock-entrance']});
 assert.equal(ev(x,s,{type:'report',step:K(id(7),'send-location')}).completed,true);
 // 008: the contractor's office: hack the street door, the terminals, the junction panel, the records
 place(x,s,['far-south']);ev(x,s,{type:'observe',step:K(id(8),'locate')});ev(x,s,{type:'hack',ap:'biz-main-w-166',mission:id(8)});place(x,s,['far-south'],{apt:id(8)+'/contractor',mod:'shop'});
 ev(x,s,{type:'apt-use',mission:id(8),apt:'contractor',object:'computer',mod:'shop'});ev(x,s,{type:'apt-use',mission:id(8),apt:'contractor',object:'panel',mod:'maint'});ev(x,s,{type:'collect',step:K(id(8),'destination')});ev(x,s,{type:'collect',step:K(id(8),'records')});
 const out8=place(x,s,['far-south']);assert.equal(out8.completed,true);assert.match(out8.messages[0].text,/^BR-04\. That's our camera\./);
 // 009: the Corporate District
 const t9=place(x,s,['corporate']);assert.match(t9.messages.map(m=>m.text).join('\n'),/The camera feed is on a private network/);ev(x,s,{type:'observe',step:K(id(9),'locate')});ev(x,s,{type:'hack',ap:'biz-corp-s-40',mission:id(9)});
 place(x,s,['corporate'],{apt:id(9)+'/facility',mod:'servers'});place(x,s,['corporate'],{apt:id(9)+'/facility',mod:'servers'});assert.equal(step(x,s,'M009'),'core','sneaking in and entering the server room: two place ticks');s=reload(x,s);
 ev(x,s,{type:'apt-use',mission:id(9),apt:'facility',object:'core',mod:'servers'});ev(x,s,{type:'hack',ap:'facility/servers.s1',mission:id(9)});ev(x,s,{type:'apt-use',mission:id(9),apt:'facility',object:'terminal',mod:'servers'});
 const link=ev(x,s,{type:'apt-use',mission:id(9),apt:'facility',object:'core',mod:'servers'});assert.match(link.messages[0].text,/^That's it\./);assert.equal(place(x,s,['corporate']).completed,true);
 // 010: the camera comes online after a short in-game wait; the feed's stages; a reload in the middle loses nothing
 place(x,s,['avenue']);assert.equal(s.universe.missions[id(10)],undefined,'not online yet');passTime(s,60);const on=place(x,s,['avenue']);assert.equal(on.messages[0].header,'BLACKROCK CAMERA BR-04 — NOW ONLINE');
 ev(x,s,{type:'feed-stage',mission:id(10),feed:'br-04',stage:'open'});s=reload(x,s);assert.equal(step(x,s,'M010'),'observe','the feed closed early (a reload): it can be opened again');
 ev(x,s,{type:'feed-stage',mission:id(10),feed:'br-04',stage:'open'});assert.equal(step(x,s,'M010'),'observe','opening again does not skip watching it');
 const saved=ev(x,s,{type:'feed-stage',mission:id(10),feed:'br-04',stage:'saved'});assert.ok(saved.done.includes('observe')&&saved.done.includes('record')&&saved.done.includes('save'),'saved completes the stages before it');assert.ok(x.MM.hasEvidence(s,'induction-rec'));
 for(const t of x.MC.timersNow(s,x.e))x.MC.timerSet(s,t,0);const call10=ev(x,s,{type:'timer'});assert.equal(call10.messages[0].text.split('\n')[0],'Tell me you recorded that.');
 assert.equal(place(x,s,['district']).completed,true);
 // 011: the meeting room, the hand-over, the sale (in-game wait), Admin's call, the reward and the Kestrel (once), the cargo tree
 place(x,s,['district']);place(x,s,['district','district-meeting']);const credits0=s.credits;
 const hand=ev(x,s,{type:'report',step:K(id(11),'deliver')});assert.equal(hand.lines[0].text,'Fifty-one percent of the company, and a public scandal to make sure he never walks away.');
 assert.equal(ev(x,s,{type:'game-wait',step:K(id(11),'await-sale')}).objective,null,'the sale takes in-game time');
 const w=x.MC.mechanicsNow(s,x.e).find(y=>y.kind==='wait-game');assert.equal(w.wait.left,120);passTime(s,120);assert.equal(x.MC.mechanicsNow(s,x.e).find(y=>y.kind==='wait-game').wait.due,true);s=reload(x,s);
 const call11=ev(x,s,{type:'game-wait',step:K(id(11),'await-sale')});assert.equal(call11.messages[0].text,'Come see me when you\'ve got a minute. I\'ve got some good news.');
 const r1=talk(x,s,'admin');assert.equal(r1.hear.step,'reward');assert.equal(s.credits,credits0,'not paid before the line');
 const r2=ev(x,s,{type:'heard',mission:id(11)});assert.equal(s.credits,credits0+x.MS.REWARD,'paid');assert.equal(r2.hear.step,'kestrel');const ships0=s.ownedShips.slice();
 const r3=ev(x,s,{type:'heard',mission:id(11)});assert.ok(r3.notes.includes('SHIP ACQUIRED')||s.ownedShips.includes('starter'));assert.equal(s.story.flags.shipAccess,'granted');assert.equal(r3.hear.step,'instructions');
 const r4=ev(x,s,{type:'heard',mission:id(11)});assert.equal(r4.completed,true);assert.equal(s.story.flags['ts_first-cargo-delivery'],true,'the cargo tree is unlocked');
 assert.equal(s.ownedShips.filter(v=>v==='starter').length,1,'one Kestrel');s=reload(x,s);
 // nothing pays twice: more talks, events and reloads
 const c1=s.credits;for(let i=0;i<3;i++){talk(x,s,'admin');ev(x,s,{type:'heard',mission:id(11)});}s=reload(x,s);assert.equal(s.credits,c1);assert.equal(s.ownedShips.filter(v=>v==='starter').length,1);
 // 012: the first cargo delivery
 place(x,s,['district']);assert.equal(s.universe.missions[x.MS.M012.id].acquired,true,'012 arrives (Iris\'s call) once 011 is done');assert.equal(step(x,s,'M012'),'loadout');
 assert.equal(place(x,s,['port','landing-pad']).objective,null,'the Port waits until the Ship Loadout app has been opened');const lo=ev(x,s,{type:'v1-app',app:'loadout'});assert.equal(lo.objective,'loadout');assert.match(lo.messages[0].text,/review your ship's equipment/);
 place(x,s,['port']);const pad=place(x,s,['port','landing-pad']);assert.equal(pad.messages[0].text.split('\n')[0],x.MS.IRIS_OK.there);ev(x,s,{type:'flight',stage:'board'});
 for(let i=0;i<4;i++){for(const t of x.MC.timersNow(s,x.e))x.MC.timerSet(s,t,0);ev(x,s,{type:'timer'});}assert.equal(step(x,s,'M012'),'set-course','the cockpit walkthrough: four short calls, then the course');
 ev(x,s,{type:'flight',stage:'launch'});ev(x,s,{type:'flight',stage:'jump',place:'meridian'});const dk=place(x,s,['meridian']);assert.equal(dk.messages[0].text,x.MS.IRIS_OK.nicely+'\n'+x.MS.IRIS_OK.rook);
 assert.equal(step(x,s,'M012'),'meet-rook');const c2=s.credits;talk(x,s,'rook');ev(x,s,{type:'heard',mission:x.MS.M012.id});assert.ok(done(s,x.MS.M012.id));assert.equal(s.credits,c2+500,'Rook pays once');assert.equal(s.story.flags['rook-first-delivery-done'],true,'the shared flag for the flight Map and Rook\'s cargo board');assert.equal(x.M.definitions[x.MS.M012.id].destination,'meridian','the first delivery keeps Meridian as its destination');
 return s;}
test('from a character who has just finished Mission 003: 004 to 012 in order, with reloads; rewards and the Kestrel once',()=>{const x=env(),s=through003(x,newChar(x));const out=play(x,s);
 assert.deepEqual(['m004-a-promising-investment','m011-leverage','m012-first-cargo-delivery'].map(id=>done(out,id)),[true,true,true]);});
test('from a fresh character: 001 to 012 (the same path; nothing from the new missions comes early)',()=>{const x=env(),s=newChar(x);
 ev(x,s,{type:'pod-exit',at:Date.UTC(2026,10,20,12)});passTime(s,2000);place(x,s,['far-south']);assert.equal(s.universe.missions['m004-a-promising-investment'],undefined,'no Fish call before 003');
 through003(x,s);play(x,s);});
test('an older player who owns the Kestrel and another ship keeps both; nothing is reset or duplicated by Mission 011',()=>{const x=env(),s=through003(x,newChar(x));
 x.C.awardStarterShip(s);x.C.giveShip(s,'ship2');s.activeShip='ship2';const before=JSON.stringify(s.ownedShips);
 const u=x.MS.M011.unlocks.find(y=>y.kind==='ship');assert.deepEqual(u,{kind:'ship',id:'starter',when:'kestrel'});
 for(let i=0;i<3;i++)x.C.awardStarterShip(s);assert.equal(JSON.stringify(s.ownedShips),before);assert.equal(s.activeShip,'ship2','the active ship is kept');});
test('the owner\'s words verbatim (a sample of every mission), PROPOSED placeholders only in the cargo tree, the ledger and the manifest',()=>{const x=env(),MS=x.MS;
 assert.deepEqual(Object.keys(MS.NUMBERS).map(Number),[1,2,3,4,5,6,7,8,9,10,11,12]);
 const man=JSON.parse(fs.readFileSync(R('void-runner/save-manifest.json'),'utf8'));for(const [n,id] of Object.entries(MS.NUMBERS)){assert.equal(man.missionNumbers[n],id);assert.ok(man.storyMissions.includes(id));}assert.deepEqual(man.storyTrees,['main-storyline','first-cargo-delivery']);
 assert.deepEqual([MS.M004,MS.M005,MS.M006,MS.M007,MS.M008,MS.M009,MS.M010,MS.M011].map(m=>m.title),['A Promising Investment','Behind Closed Doors','Hostile Takeover','The House Always Wins','Private Network','Ghost in the Network','The Price of Admission','Leverage']);
 const all=JSON.stringify([MS.M004,MS.M005,MS.M006,MS.M007,MS.M008,MS.M009,MS.M010,MS.M011]);
 for(const t of ['Has he agreed to the percentage?','Status: Pending admission','Induction documentation: Mandatory audiovisual recording','We don\'t want a repeat of the last induction.','Scheduled activation: Next approved induction','Get somewhere safe. When that camera comes online, I want you to record everything.','It isn\'t stupidity. It\'s the price of membership.','Congratulations. You\'re a runner now.'])assert.ok(all.includes(JSON.stringify(t).slice(1,-1)),t);
 assert.ok(!/PROPOSED/.test(all),'no placeholders in the owner\'s missions');for(const o of MS.M012.objectives)for(const l of o.say||[])assert.ok(MS.isProposedCargo(l.text)||MS.isApprovedCargo(l.text),'cargo lines: the owner\'s or marked for approval: '+l.text);
 assert.ok(MS.M012.start.text.startsWith(MS.IRIS_OK.congrats));assert.deepEqual(MS.M012.objectives.map(o=>o.kind),['message','v1-app','enter','enter','flight','call','call','call','call','flight','flight','arrive','talk','hear']);assert.equal(MS.M012.objectives[1].app,'loadout','the Ship Loadout tile glows');
 // the ritual: the existing choreography (the same beats, in the same order); only line slots carry words
 const C=require(R('void-runner/cult-room.js')),def=C.defaultScene().beats.filter(b=>b.act!=='line'),rit=MS.RITUAL.beats.filter(b=>b.act!=='line');assert.deepEqual(rit,def,'the movements are the existing sequence');
 assert.deepEqual(MS.RITUAL.beats.filter(b=>b.act==='line'&&b.text).map(b=>b.who).join(','),'robed-all,initiate,robed-all,initiate,robed-all,robed-all,robed-all,robed-all,initiate,robed-all,initiate');
 assert.ok(MS.RITUAL.beats.some(b=>b.text==='Fucking dogs!?'&&b.who==='initiate'),'Halden\'s line exactly as the owner wrote it');assert.deepEqual(C.sceneProblems(MS.RITUAL),[]);
 assert.equal(MS.REWARD,25000);assert.ok(MS.M011.unlocks.some(u=>u.kind==='credits'&&u.amount===MS.REWARD&&u.when==='reward'),'one editable number');
 assert.equal(MS.FOLLOWUPS[0].gameMinutes,MS.M004.start.when.value,'the same 6 in-game hours as the old stub');});
test('every new mission round-trips through the Mission Editor\'s export (treesContent) unchanged in what the game runs',()=>{const x=env();
 const sent=x.MC.treesContent(x.MS.trees(),{givers:x.e.givers}),ids=sent.trees.flatMap(t=>t.missions.map(m=>m.id));assert.deepEqual(sent.skipped,[]);
 assert.equal(ids.length,12);const m4=sent.trees[0].missions[3];assert.deepEqual(m4.cast,x.MS.M004.cast);assert.deepEqual(m4.evidence,x.MS.M004.evidence);assert.deepEqual(m4.objectives.find(o=>o.id==='overhear').near,6);
 const m11=sent.trees[0].missions[10];assert.equal(m11.objectives.find(o=>o.id==='await-sale').minutes,120);assert.deepEqual(m11.unlocks.find(u=>u.kind==='credits'),{kind:'credits',amount:25000,when:'reward'});});
test('the flight Map and Rook after the real Mission 012: route-only to Meridian during the delivery, then Rook\'s coordinates and his side-mission board (nav-coords.js)',()=>{
 const x=env(),N=require(R('void-runner/nav-coords.js')),s=play(x,through003(x,newChar(x)));
 assert.equal(s.story.flags.navCoords,false,'the Kestrel came with a route-only Map');
 const r=reload(x,s);assert.equal(r.story.flags.navCoords,false,'reloading after the trip to Meridian does not upgrade it');
 r.location='earth';assert.deepEqual(N.markers(r,[{id:'m',destination:'meridian'}]),['meridian'],'a mission to Meridian from NeoChinatown: only its warp marker');
 r.location='meridian';assert.equal(x.C.rookOpen(r),true,'Mission 012 opened Rook\'s side missions');const board=x.C.rookBoard(r);assert.ok(board.length>=3);
 assert.equal(N.grant(r,'rook'),true);assert.equal(N.mode(r,[]),'full');assert.ok(x.C.accept(r,'rook-job:routine'));assert.ok(x.M.track(r,x.C.rookRun(r).id,x.C));assert.equal(x.M.tracked(r,x.C).type,'side');});
