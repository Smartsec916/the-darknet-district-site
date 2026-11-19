/* When a denied offer comes back, and "Go into" steps by the place's real name (the owner, 19 Nov 2026). mission-content.js deny 'after' (denyMinutes, minutes of play;
   a walked-near offer also needs the player to walk out of its distance and back), 'pod' (after the next Sleeping Pod exit), 'never' (removed); existing missions ('again')
   keep what they did. "Giver waits at" is not used while a denied offer waits. mission-blocks.js placeOptions / placeWords / wordsAuto / rewordAfter; the wizard's room choice. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p);
const fresh=()=>{for(const k of Object.keys(require.cache))if(k.includes('void-runner'+path.sep))delete require.cache[k];};
function env(){fresh();
 const M=require(R('void-runner/mission-log.js')),B=require(R('void-runner/beginner.js')),C=require(R('void-runner/campaign.js')),U=require(R('void-runner/universe.js')),MC=require(R('void-runner/mission-content.js')),G=require(R('void-runner/mission-givers.js'));
 B.register(M);
 const givers=G.roster({registry:JSON.parse(fs.readFileSync(R('tools/audio/npc-voice-registry.json'),'utf8')),people:require(R('void-runner/district-people.js')).npcs(),story:require(R('void-runner/story-content.js')).characters,temple:require(R('void-runner/temple.js')).MODEL});
 const e={B,Missions:M,U,givers};MC.snapshot(e);MC.apply(null,e);return {e,M,C,MC,G};}
const ev=(x,s,e)=>x.MC.treeEvent(s,x.e,e,x.M,x.C);
const player=x=>{const s=x.C.startDistrictCampaign(x.C.fresh());s.story.flags.appearanceOffered=true;s.story.flags.podWakePending=false;s.credits=100;return s;};
const ctx=x=>({givers:new Map(x.e.givers.map(g=>[g.id,g])),places:x.G.placeIds()});
const doc=(x,...trees)=>({format:x.MC.FORMAT,version:x.MC.VERSION,trees});
const use=(x,...trees)=>{const d=doc(x,...trees),c=x.MC.check(d,ctx(x));assert.deepEqual(c.errors,[]);x.MC.apply(d,x.e,ctx(x));};
const ID='draft-near-m1';
const nearTree=(st={},extra={})=>({id:'draft-near',name:'Near',missions:[{id:ID,number:71,title:'Walk-by job',type:'side',giver:'admin',
 start:{how:'notification',channel:'notify',from:'admin',text:'Got work.',when:{kind:'near',npc:'admin',distance:5},accept:true,...st},objectives:[{id:'go',kind:'go',place:'port',label:'Go to the Port.'}],...extra}]});
const near=(x,s,d)=>ev(x,s,{type:'near',near:{admin:d}});

test('walked-near DENY "after N minutes": not offered during the wait (minutes of play), then only after walking out of the distance and back',()=>{
 const x=env(),{MC}=x;use(x,nearTree({deny:'after',denyMinutes:1}));const s=player(x);
 assert.ok(near(x,s,3).prompt,'offered when walked near');
 const d=ev(x,s,{type:'decline',mission:ID});assert.equal(d.declined,true);assert.equal(d.deny,'after');assert.equal(d.denyWait,1);assert.equal(s.story.flags['md_'+ID],60);
 assert.equal(near(x,s,3).prompt,undefined,'not offered while the wait runs');
 assert.deepEqual(MC.denyWaits(s,x.e).map(w=>[w.mission,w.left,w.near]),[[ID,60,true]]);
 assert.deepEqual(MC.denyTick(s,x.e,59.9),[]);assert.equal(s.story.flags['md_'+ID],1,'whole seconds only');
 assert.deepEqual(MC.denyTick(s,x.e,1),[ID]);assert.equal(s.story.flags['md_'+ID],'away');
 assert.equal(near(x,s,3).prompt,undefined,'still standing within the distance: not yet');
 assert.deepEqual(MC.denyRearm(s,x.e,{admin:4}),[],'within 5 m');assert.deepEqual(MC.denyRearm(s,x.e,{admin:9}),[ID],'walked out');
 assert.equal(s.story.flags['md_'+ID],undefined);assert.ok(near(x,s,3).prompt,'walked back: offered again');
 assert.ok(Number.isSafeInteger(60)&&typeof 'away'==='string','flags stay safe integers or short strings');});

test('the wait survives a reload (the seconds are in story.flags) and SKIP THE WAIT ends it at once; a non-near offer comes straight back',()=>{
 const x=env(),{MC}=x;use(x,nearTree({deny:'after',denyMinutes:10}));let s=player(x);near(x,s,3);ev(x,s,{type:'decline',mission:ID});MC.denyTick(s,x.e,30);
 s=JSON.parse(JSON.stringify(s));assert.equal(s.story.flags['md_'+ID],570);
 assert.deepEqual(MC.denyTick(s,x.e,0,true),[ID]);assert.equal(s.story.flags['md_'+ID],'away');
 const y=env();use(y,nearTree({deny:'after',denyMinutes:2,when:{kind:'place',place:'port'}}));const t=player(y),at=()=>ev(y,t,{type:'place',places:['port']});assert.ok(at().prompt);ev(y,t,{type:'decline',mission:ID});
 ev(y,t,{type:'pod-exit'});assert.equal(at().prompt,undefined,'a pod exit does not end a minutes wait');y.MC.denyTick(t,y.e,120);assert.equal(t.story.flags['md_'+ID],undefined);assert.ok(at().prompt);});

test('DENY "never" removes it; "pod" waits for the next pod exit; existing missions (no setting) keep today\'s behaviour',()=>{
 let x=env();use(x,nearTree({deny:'never'}));let s=player(x);near(x,s,3);ev(x,s,{type:'decline',mission:ID});assert.equal(s.story.flags['md_'+ID],'never');
 x.MC.denyTick(s,x.e,99999);ev(x,s,{type:'pod-exit'});x.MC.denyRearm(s,x.e,{admin:50});assert.equal(near(x,s,3).prompt,undefined,'never again');
 x=env();use(x,nearTree());s=player(x);near(x,s,3);const d=ev(x,s,{type:'decline',mission:ID});assert.equal(d.deny,'again');assert.equal(d.denyWait,'pod');assert.equal(s.story.flags['md_'+ID],'later');
 assert.equal(near(x,s,3).prompt,undefined);ev(x,s,{type:'pod-exit'});assert.ok(near(x,s,3).prompt,'after the pod exit, as before');
 // in person: 'again' = the next talk (unchanged); 'pod' and 'after' work for it too
 const person=st=>({id:'draft-p',name:'P',missions:[{id:'draft-p-m1',number:72,title:'Ask',type:'side',giver:'iris',start:{how:'person',accept:true,...st},offer:[{who:'iris',text:'Job?'}],objectives:[{id:'go',kind:'go',place:'port',label:'Go.'}]}]});
 const talk=(x,s)=>ev(x,s,{type:'talk',npcs:['iris']});
 x=env();use(x,person({}));s=player(x);talk(x,s);ev(x,s,{type:'decline',mission:'draft-p-m1'});assert.ok(talk(x,s).ask,'again: the next talk');
 x=env();use(x,person({deny:'pod'}));s=player(x);talk(x,s);ev(x,s,{type:'decline',mission:'draft-p-m1'});assert.equal(talk(x,s).ask,undefined);ev(x,s,{type:'pod-exit'});assert.ok(talk(x,s).ask);
 x=env();use(x,person({deny:'after',denyMinutes:5}));s=player(x);talk(x,s);ev(x,s,{type:'decline',mission:'draft-p-m1'});assert.equal(talk(x,s).ask,undefined);x.MC.denyTick(s,x.e,300);assert.equal(s.story.flags['md_draft-p-m1'],undefined);assert.ok(talk(x,s).ask);});

test('the checks: minutes only with "after", 1 to 120; the export keeps them (default 10)',()=>{
 const x=env(),{MC}=x,errs=st=>MC.check(doc(x,nearTree(st)),ctx(x)).errors.join(' ');
 assert.equal(errs({deny:'after',denyMinutes:120}),'');assert.equal(errs({deny:'pod'}),'');assert.match(errs({deny:'after',denyMinutes:0}),/1 to 120/);assert.match(errs({deny:'after',denyMinutes:121}),/1 to 120/);
 assert.match(errs({deny:'never',denyMinutes:5}),/1 to 120/);assert.match(errs({deny:'later'}),/unknown/);
 const m=nearTree({deny:'after'}).missions[0];assert.equal(MC.treeStrip(m).start.denyMinutes,10);assert.equal(MC.treeStrip(nearTree({deny:'after',denyMinutes:3}).missions[0]).start.denyMinutes,3);
 assert.equal(MC.treeStrip(nearTree({}).missions[0]).start.deny,undefined,'an existing mission is sent as it was');});

test('"Giver waits at" is not used while a denied offer waits (she goes about her routine) or after "never"; it is used again when the offer comes back',()=>{
 const x=env(),{MC}=x;const tr=st=>({id:'draft-street',name:'Street',missions:[{id:'draft-street-m1',number:41,title:'A favour',type:'side',giver:'grey-reverie',start:{how:'person',accept:true,...st},offer:[{who:'grey-reverie',text:'Got a minute?'}],objectives:[{id:'go',kind:'go',place:'port',label:'Go.'}],waitAt:{x:104.4,z:-5.9,yaw:3.14}}]});
 MC.apply(doc(x,tr({deny:'after',denyMinutes:2})),x.e,ctx(x));const s=player(x);assert.ok(MC.waitingAt(s,x.e)['grey-reverie']);
 ev(x,s,{type:'decline',mission:'draft-street-m1'});assert.deepEqual(MC.waitingAt(s,x.e),{},'during the wait: her own routine');
 MC.denyTick(s,x.e,120);assert.ok(MC.waitingAt(s,x.e)['grey-reverie'],'back at her spot for the offer');
 MC.apply(doc(x,tr({deny:'never'})),x.e,ctx(x));const t=player(x);ev(x,t,{type:'decline',mission:'draft-street-m1'});assert.deepEqual(MC.waitingAt(t,x.e),{},'never: back to her routine for good');});

test('"Go into" / "Use" / "Hack" by the place\'s real name; the words follow the place while automatic and the owner\'s own words stay',()=>{fresh();
 const B=require(R('void-runner/mission-blocks.js')),M=require(R('void-runner/modules.js')),X=require(R('void-runner/apartments.js'));
 const od=X.doors().find(d=>d.family==='office'),rd=X.doors().find(d=>d.style==='rundown'),cd=X.doors().find(d=>d.family==='container');
 const m={apartments:[{id:'l1',door:od.id,...M.template('office-servers')},{id:'a1',style:'rundown',door:rd.id,number:104},{id:'a2',style:'container-regular',door:cd.id}]};
 const labels=B.placeOptions(m,'apt-enter').map(p=>p.label);
 assert.ok(labels.some(l=>/^Office floor \(No\. \d+, The Avenue, offices\)$/.test(l)),labels.join(' | '));assert.ok(labels.some(l=>/^Server room \(/.test(l)));assert.ok(labels.includes('Elevator cab, floor B1 ('+od.name.replace(' (offices)',', offices')+')'));
 assert.ok(labels.some(l=>/^Rundown apartment 104 \(/.test(l)));assert.ok(labels.some(l=>/^Container apartment, regular \(/.test(l)));
 assert.ok(!B.placeOptions(m,'apt-use').some(p=>p.value==='l1'),'Use needs a room');
 const o={kind:'apt-enter',label:'Go into the apartment'};assert.equal(B.wordsAuto(o,m),true,'the older fixed words count as automatic');
 B.rewordAfter(o,m,y=>B.placeSet(y,'l1/office',m));assert.deepEqual([o.apt,o.mod,o.label],['l1','office','Go into the office floor']);
 B.rewordAfter(o,m,y=>B.placeSet(y,'l1/servers',m));assert.equal(o.label,'Go into the server room','automatic words follow');
 o.label='Sneak into the basement';B.rewordAfter(o,m,y=>B.placeSet(y,'a1',m));assert.equal(o.label,'Sneak into the basement','own words kept');assert.equal(o.mod,undefined);assert.equal(B.placeWords(o,m),'Go into apartment 104');
 const u={kind:'apt-use',label:''};B.rewordAfter(u,m,y=>{B.placeSet(y,'l1/servers',m);y.object='rack';});assert.equal(u.label,'Use the server rack in the server room');
 B.rewordAfter(u,m,y=>B.placeSet(y,'l1/office',m));assert.equal(u.object,undefined,'the office has no rack');assert.equal(u.label,'Use something on the office floor');
 const h={kind:'hack',ap:'l1/hall.n0'};assert.equal(B.placeWords(h,m),'Hack the access point at the door between the office hallway and the office floor');
 assert.ok(B.hackOptions(m).some(p=>p.ap==='l1/servers.e1'&&/^Server room: its door to the elevator cab, floor B1/.test(p.label)));
 // the wizard: an office template, the room chosen, the words and the built step
 const W=require(R('void-runner/editor-wizard.js')),a={...W.fresh('go'),apt:{template:'office-servers',door:od.id},steps:[{kind:'apt-enter',npc:'',place:'',label:'',auto:true,mod:'servers'}]};
 assert.ok(W.aptChoices(a).some(p=>p.value==='a1/office'));W.relabel(a,{apt:W.aptRecord(a,true)});assert.equal(a.steps[0].label,'Go into the server room');
 const T=require(R('void-runner/mission-trees.js'));a.giver='admin';a.title='Office';const {mission:bm}=W.build({version:1,trees:[]},a,{T,number:409});const so=bm.objectives.find(y=>y.kind==='apt-enter');
 assert.deepEqual([so.apt,so.mod,so.label],['a1','servers','Go into the server room']);});
