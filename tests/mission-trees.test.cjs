/* Mission Editor data: every mission tree in the game data is found, with its NPCs, lines, endings and unlocks; the content adapter applies, rolls back and migrates safely. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p),T=require(R('void-runner/mission-trees.js')),MC=require(R('void-runner/mission-content.js')),S=require(R('admin/studio-model.js'));
const fresh=()=>{for(const k of Object.keys(require.cache))if(k.includes('void-runner'+path.sep))delete require.cache[k];};
function sources(extra={}){fresh();return {missions:require(R('void-runner/mission-log.js')).definitions,beginner:require(R('void-runner/beginner.js')).MISSIONS,content:require(R('void-runner/content.js')),campaign:require(R('void-runner/campaign.js')),story:require(R('void-runner/story-content.js')),
 registry:JSON.parse(fs.readFileSync(R('tools/audio/npc-voice-registry.json'),'utf8')),manifest:JSON.parse(fs.readFileSync(R('void-runner/assets/audio/voice/manifest.json'),'utf8')),files:Object.fromEntries(T.FILES.map(f=>[f,fs.readFileSync(R(f),'utf8')])),
 extraManifest:JSON.parse(fs.readFileSync(R('void-runner/assets/audio/voice/extra/manifest.json'),'utf8')),milked:require(R('void-runner/milked.js')),modules:require(R('void-runner/progression.js')).modules,ships:require(R('void-runner/ships.js')).ships,locations:require(R('void-runner/universe.js')).locations,stores:S.STORES,...extra};}

test('every mission tree in the game data is listed, with its status, and no registry, contract or chapter mission is missing',()=>{
 const src=sources(),out=T.build(src),ids=out.trees.map(t=>t.id);
 assert.deepEqual(ids,['beginner','vesper-opening','sealed-cargo','communion','natural-order','rook-contracts','chapter-belt','chapter-lockdown','chapter-gate','district-drafts']);
 assert.equal(out.trees.find(t=>t.id==='district-drafts').status,'draft');assert.equal(out.trees.find(t=>t.id==='district-drafts').missions[0].id,src.milked.MISSION.id);
 assert.equal(out.trees.find(t=>t.id==='beginner').status,'active');assert(out.trees.filter(t=>!['beginner','district-drafts'].includes(t.id)).every(t=>t.status==='historical'));
 const listed=new Set(out.trees.flatMap(t=>t.missions.map(m=>m.id)));
 for(const id of Object.keys(src.missions))if(src.missions[id].beginner!==true)assert(listed.has(id),'registry mission '+id+' is listed');
 for(const m of src.beginner)assert(listed.has(m.id));for(const c of src.campaign.contracts)assert(listed.has(c.id));for(const c of src.content.missions)assert(listed.has(c.id));
 assert.equal(out.counts.missions,6+Object.keys(src.missions).length+src.campaign.contracts.length+src.content.missions.length+1);
 assert.equal(out.counts.trees,10);
});
test('every scene anchor still exists in its script (a changed script fails here instead of silently losing lines)',()=>{
 for(const sc of T.SCENES){const text=fs.readFileSync(R(sc.file),'utf8');assert(text.includes(sc.from),sc.file+' has '+sc.from);const r=T.sceneLines(text,sc);assert(r&&r.lines.length>0,sc.title+' has lines');}
});
test('NPCs per tree come from the voice registry, read-only, with the voices registered there',()=>{
 const src=sources(),out=T.build(src),by=id=>out.trees.find(t=>t.id===id);
 const com=by('communion').npcs.map(n=>n.id);for(const id of ['admin','iris','elara','kess'])assert(com.includes(id),id);
 const no=by('natural-order').npcs.map(n=>n.id);for(const id of ['admin','iris','marcus','mercer'])assert(no.includes(id),id);
 assert.deepEqual(by('beginner').npcs.map(n=>n.id).sort(),['admin','bartender','iris','landing-terminal']);
 for(const t of out.trees)for(const n of t.npcs)if(n.registered)assert.deepEqual(n.voice,{voice:src.registry.npcs[n.id].voice,status:src.registry.npcs[n.id].status});
 const elara=by('communion').npcs.find(n=>n.id==='elara');assert(elara.roles.includes('you deliver to them'));
});
test('David’s scripts are locked; Claude’s UNREVIEWED placeholder lines and the old opening are editable drafts',()=>{
 const out=T.build(sources()),m=id=>out.trees.flatMap(t=>t.missions).find(x=>x.id===id);
 const admin=m('communion-delivery').scenes.find(s=>s.doc==='05');assert(admin.lines.length>10&&admin.lines.every(l=>l.locked&&/David’s script — locked/.test(l.lock)));
 assert(admin.lines.some(l=>l.text.startsWith('Ah, you must be the pilot Rook sent.')));
 const sealed=m('admin-sealed-cargo-01').scenes.find(s=>s.title.startsWith('Admin offers'));assert(sealed.lines.every(l=>!l.locked&&l.placeholder&&l.editable==='local'));
 const wf=m('admin-sealed-cargo-01').scenes.find(s=>s.doc==='12');assert(wf.lines.every(l=>l.locked));
 const kess=m('communion-restoration-01').scenes[0];assert(kess.lines.some(l=>l.placeholder&&!l.locked&&/As promised, the scanner/.test(l.text)),'the UNREVIEWED reward line is not David’s');
 assert(T.allLines(m('ground-training')).every(l=>!l.locked));
 const b=T.allLines(m('district-errand'));assert(b.length&&b.every(l=>l.editable==='studio'&&!l.locked));
 const rec=m('communion-delivery').scenes.flatMap(s=>s.lines).filter(l=>l.recorded);assert(rec.length>20,'voice clips are recognised');
});
test('steps, endings and unlocks come from the data (store items, ships, places, flags, credits)',()=>{
 const out=T.build(sources()),m=id=>out.trees.flatMap(t=>t.missions).find(x=>x.id===id);
 assert.deepEqual(m('first-ship').unlocks.filter(u=>['ship','travel'].includes(u.kind)).map(u=>u.kind+':'+u.id),['ship:starter','travel:free-travel']);
 assert.equal(m('district-errand').credits,100);assert(m('district-errand').unlocks.some(u=>u.kind==='flag'&&u.id==='br_district-errand'));
 assert(/Iris at The Darknet District/.test(m('district-errand').ending.text));assert.deepEqual(m('district-errand').ending.next,['job-worth-taking']);
 const cd=m('communion-delivery');assert.equal(cd.credits,1200);assert(cd.unlocks.some(u=>u.kind==='location'&&u.id==='vigil'));assert(cd.unlocks.some(u=>u.kind==='mission'&&u.id==='communion-supply'));
 assert(/collect payment from Iris/.test(cd.ending.text));assert(cd.ending.branches.length===1);
 assert(m('communion-restoration-01').unlocks.some(u=>u.kind==='item'&&u.id==='communion-scanner'));assert(m('natural-order-agriculture-01').unlocks.some(u=>u.kind==='item'&&u.id==='order-thrusters'));
 assert(m('admin-sealed-cargo-01').unlocks.some(u=>u.kind==='item'&&u.id==='warflying-scrambler'&&u.store==='district-store'));
 assert(m('combat-qualification').unlocks.some(u=>u.id==='launcher'&&u.store==='station-outfitter'));
 assert(m('belt-1').unlocks.some(u=>u.kind==='mission'&&u.id==='belt-2'));
});
test('drafts appear as draft trees; edits are validated against the real items, ships, places, stores and locks',()=>{
 const src=sources(),studio={missions:[...S.clone(src.beginner),{id:'new-mission-1',title:'NEW',type:'main',giver:'Admin',prerequisites:['first-departure'],objectives:[{id:'step-1',label:'x',on:'talk-admin'}]}]};
 const out=T.build({...src,studioDraft:studio,serverDrafts:[{id:'me-flight',title:'Flight',kind:'mission',revision:2}]});
 assert.deepEqual(out.trees.filter(t=>t.status==='draft').map(t=>t.id),['district-drafts','draft-studio','draft-server']);
 const r=T.refs(src),m=out.trees.flatMap(t=>t.missions).find(x=>x.id==='communion-delivery'),locked=m.scenes[0].lines[0],free=T.allLines(out.trees.flatMap(t=>t.missions).find(x=>x.id==='admin-sealed-cargo-01')).find(l=>l.editable==='local');
 assert.equal(T.validateEdit(m,{unlocks:[{kind:'item',id:'warflying-scrambler',store:'district-store'},{kind:'ship',id:'ship2'},{kind:'location',id:'holdfast'},{kind:'flag',id:'myFlag',value:true}],reputation:[{faction:'communion',amount:5}],credits:10},r).filter(i=>i.level==='error').length,0);
 const bad=T.validateEdit(m,{unlocks:[{kind:'item',id:'laser-sword',store:'district-store'},{kind:'ship',id:'x-wing'},{kind:'location',id:'atlantis'},{kind:'item',id:'cooling',store:'mall'}],reputation:[{faction:'empire',amount:5}],credits:-1},r).filter(i=>i.level==='error').map(i=>i.text).join('\n');
 for(const t of ['laser-sword','x-wing','atlantis','mall','empire','Credits'])assert(bad.includes(t),t);

});
// ---------------- content adapter (draft play and publishing) ----------------
function env(){fresh();const M=require(R('void-runner/mission-log.js')),B=require(R('void-runner/beginner.js')),C=require(R('void-runner/campaign.js'));B.register(M);return {B,Missions:M,C};}
test('apply puts edited lines, steps and rewards over the shipped beginner records in place; null rolls back to the shipped records',()=>{
 const e=env(),ref=e.B.MISSIONS,shipped=MC.clone(e.B.MISSIONS),edited=MC.clone(shipped);
 edited[1].objectives[2].say[0].text='TEST LINE: good eyes.';edited[1].rewards=150;edited[1].objectives[0].label='Have a look at the bar';
 const content=MC.fromDrafts({studio:{missions:edited},shippedBeginner:shipped});assert(content.beginner);
 const r=MC.apply(content,e);assert.deepEqual(r.refused,[]);assert.equal(e.B.MISSIONS,ref,'same array object (the runner keeps it)');
 assert.equal(e.B.byId['district-errand'].objectives[2].say[0].text,'TEST LINE: good eyes.');assert.equal(e.Missions.definitions['district-errand'].objectives[0].label,'Have a look at the bar');
 // the runner itself uses the edited data
 const s=e.C.startDistrictCampaign(e.C.fresh());s.story.flags.podWakePending=false;for(const id of ['first-contact']){e.Missions.acquire(s,id);for(const o of e.B.byId[id].objectives)e.Missions.complete(s,id,o.id,e.C);s.story.flags['br_'+id]=true;}
 e.B.offer(s,e.Missions,e.C);e.B.event(s,'visit-bar',e.Missions,e.C);e.B.event(s,'visit-shop',e.Missions,e.C);const out=e.B.event(s,'talk-iris',e.Missions,e.C);
 assert.equal(out.lines[0].text,'TEST LINE: good eyes.');assert.equal(out.reward,150);
 MC.apply(null,e);assert.deepEqual(e.B.MISSIONS,shipped);assert.equal(e.Missions.definitions['district-errand'].objectives[0].label,shipped[1].objectives[0].label);
 // a second version replaces the first, never stacks on it
 const v2=MC.clone(shipped);v2[0].title='HELLO';MC.apply(MC.fromDrafts({studio:{missions:v2},shippedBeginner:shipped}),e);assert.equal(e.B.byId['district-errand'].objectives[2].say[0].text,shipped[1].objectives[2].say[0].text);assert.equal(e.B.byId['first-contact'].title,'HELLO');
});
test('registry text edits reach the Mission Log; added and removed beginner missions re-register',()=>{
 const e=env(),shipped=MC.clone(e.B.MISSIONS),list=MC.clone(shipped).slice(0,5);list.push({id:'draft-step',title:'EXTRA',type:'main',giver:'Iris',rewards:5,prerequisites:['first-ship'],objectives:[{id:'go',label:'Talk to Iris',on:'talk-iris'}]});
 const c=MC.fromDrafts({studio:{missions:list},local:{missions:{'registry:legal-run':{title:'AN HONEST DAY',steps:{arrive:'Bring the filters to Kepler'}}}},shippedBeginner:shipped});
 const r=MC.apply(c,e,{registryIds:new Set(Object.keys(e.Missions.definitions))});assert.deepEqual(r.refused,[]);
 assert.equal(e.Missions.definitions['legal-run'].title,'AN HONEST DAY');assert.equal(e.Missions.definitions['legal-run'].objectives[0].label,'Bring the filters to Kepler');
 assert(e.Missions.definitions['draft-step']&&!e.Missions.definitions['first-departure'],'the removed mission is no longer registered');
 MC.apply(null,e);assert.equal(e.Missions.definitions['legal-run'].title,'AN HONEST LIVING');assert(e.Missions.definitions['first-departure']&&!e.Missions.definitions['draft-step']);
});
test('check refuses unknown fields, HTML, unknown events, speakers, loops and unknown registry missions; a refused record changes nothing',()=>{
 const e=env(),shipped=MC.clone(e.B.MISSIONS),bad=[];
 const mk=f=>{const l=MC.clone(shipped).map(MC.strip);f(l);return {format:MC.FORMAT,version:1,beginner:l};};
 bad.push(mk(l=>{l[0].objectives[0].on='teleport';}),mk(l=>{l[0].title='<b>x</b>';}),mk(l=>{l[0].objectives[2].say[0].who='Darth';}),mk(l=>{l[0].evil=1;}),mk(l=>{l[1].prerequisites=['district-errand'];}),mk(l=>{l[2].objectives[1].requires=['return'];l[2].objectives[2].requires=['deliver'];}),mk(l=>{l[0].objectives[0].award='spectre';}),mk(l=>{l[0].rewards=1e9;}));
 bad.push({format:MC.FORMAT,version:1,registry:{'no-such':{title:'x'}}},{format:'x',version:1},{format:MC.FORMAT,version:1,script:'alert(1)'});
 for(const c of bad){assert.equal(MC.check(c,{registryIds:new Set(Object.keys(e.Missions.definitions))}).ok,false,JSON.stringify(c).slice(0,120));const r=MC.apply(c,e,{registryIds:new Set(Object.keys(e.Missions.definitions))});assert(r.refused.length);assert.deepEqual(e.B.MISSIONS,shipped);}
 assert.deepEqual(MC.EVENTS,Object.keys(S.EVENTS),'the same completion events as the Studio');assert.deepEqual(MC.SPEAKERS,S.SPEAKERS);
});
test('notApplied lists, in plain words, every kind of edit the game cannot apply live',()=>{
 const list=MC.notApplied({studio:{missions:[{title:'A',giver:'Admin',offer:[{who:'Admin',text:'x'}],choices:[{id:'a',label:'b'}],unlocks:[{item:'x',where:['everywhere']}]}]},local:{lines:{'admin|Scanning in here is rude. Open WarFlying on your device and deactivate it.':{from:'Scanning in here is rude. Open WarFlying on your device and deactivate it.',to:'No scanning.',adapter:'code-change'}},missions:{'registry:communion-delivery':{name:'COMMUNION DELIVERY',unlocks:[{kind:'ship',id:'ship2'}],reputation:[{faction:'communion',amount:1}],credits:5},'rook-contracts:medicine':{name:'Cold chain',title:'X'}}}});
 for(const t of ['does not speak','choices','store items','needs a code change','design note','reputation','campaign code','Contracts are flown'])assert(list.some(x=>x.includes(t)),t);
});
test('warnings and migration: removed steps and missions never break or wipe a save; an unfinishable mission is completed and paid once',()=>{
 const e=env(),shipped=MC.clone(e.B.MISSIONS),after=MC.clone(shipped);after[1].objectives=after[1].objectives.filter(o=>o.id!=='report');after.splice(5,1);
 const w=MC.warnings(shipped,after);assert(w.some(x=>/step "Report back to Iris" is removed/.test(x)));assert(w.some(x=>/Mission "FIRST DEPARTURE" is removed/.test(x)));
 const s=e.C.startDistrictCampaign(e.C.fresh());s.universe.missions={'first-contact':{acquired:true,completed:true,objectives:{v1:true,controls:true,speak:true}},'district-errand':{acquired:true,completed:false,objectives:{bar:true,shop:true}}};s.story.flags['br_first-contact']=true;s.universe.trackedMission='district-errand';const credits=s.credits;
 const acts=MC.migrate(s,after);assert(acts.includes('completed district-errand'));assert.equal(s.credits,credits+100);assert.equal(s.story.flags['br_district-errand'],true);
 assert.deepEqual(s.universe.missions['district-errand'].objectives,{bar:true,shop:true},'nothing is deleted');
 assert.deepEqual(MC.migrate(s,after),[],'idempotent: never paid twice');
 const s2=e.C.startDistrictCampaign(e.C.fresh());s2.universe.missions={'first-departure':{acquired:true,completed:false,objectives:{launch:true}}};s2.universe.trackedMission='first-departure';
 assert(MC.migrate(s2,after).includes('untracked removed mission first-departure'));assert(s2.universe.missions['first-departure'],'the record of a removed mission is kept');
});
test('All lines for an NPC: every one of Admin’s voiced lines is found (in missions by scene, or outside), Admin first, ElevenLabs engine recorded; every voiced speaker is listed',()=>{
 const src=sources(),out=T.build(src),admin=out.npcs[0];assert.equal(admin.id,'admin');assert.equal(admin.engine.engine,'elevenlabs');assert.equal(admin.engine.voiceId,'DMyrgzQFny3JI1Y1paM5');
 const refs=new Set([...admin.inMissions,...admin.outside].map(l=>l.ref));
 for(const l of Object.values(src.manifest.lines))if(l.speaker==='admin')assert(refs.has('admin|'+l.text),'Admin line listed: '+l.text.slice(0,50));
 for(const l of Object.values(src.extraManifest.lines))if(l.speaker==='admin')assert(admin.outside.some(x=>x.text===l.text&&x.adapter==='code-change'&&x.clip&&x.clip.engine==='elevenlabs'));
 assert(admin.inMissions.every(l=>['talk','records'].includes(l.adapter)),'every Admin mission line can be overridden live');
 const speakers=new Set(out.npcs.map(n=>n.id));for(const l of Object.values(src.manifest.lines))if(!/relay-content/.test(l.source))assert(speakers.has(l.speaker),l.speaker);
 assert(!out.npcs.some(n=>['news-anchor','commercial-announcer'].includes(n.id)),'Relay broadcasts are not listed');
 assert(out.npcs.find(n=>n.id==='milked-fish').outside.length===3);
 const idx=T.lineIndex(out),locked=admin.inMissions.find(l=>l.locked),free=admin.inMissions.find(l=>!l.locked&&l.adapter==='talk');
 assert.equal(T.validateLines({[locked.ref]:{to:'Mine now.'}},idx).filter(i=>i.level==='error').length,1,'a locked line needs an unlock');
 const ok=T.validateLines({[locked.ref]:{to:'Mine now.',unlocked:true},[free.ref]:{to:'Also mine.'}},idx);assert.equal(ok.filter(i=>i.level==='error').length,0);assert(ok.some(i=>/voice clip out of date/.test(i.text)));
});
test('line adapter: an edited line replaces the shown words for its speaker only; content checks lines against the game',()=>{
 const e=env(),line='Always got work. Just depends on where you’re willing to go.';
 const c=MC.fromDrafts({local:{lines:{['admin|'+line]:{from:line,to:'Work? Always.',adapter:'talk'},'admin|x':{from:'x',to:'y',adapter:'code-change'}}}});
 assert.deepEqual(c.lines,[{who:'admin',from:line,to:'Work? Always.'}]);
 assert(MC.check(c,{lines:new Set(['admin|'+line])}).ok);assert(!MC.check({...c,lines:[{who:'admin',from:'not in game',to:'z'}]},{lines:new Set(['admin|'+line])}).ok);
 assert(!MC.check({...c,lines:[{who:'admin',from:line,to:'<script>'}]}).ok);
 MC.apply(c,e);assert.equal(MC.mapLine(e,{who:'Admin',text:line}).text,'Work? Always.');assert.equal(MC.mapLine(e,{who:'Iris',text:line}).text,line);
 MC.apply(null,e);assert.equal(MC.mapLine(e,{who:'Admin',text:line}).text,line,'rollback restores the shipped line');
});
test('re-voice engines: the editor and the server read the same table; no registered voice is changed',()=>{
 const j=JSON.parse(fs.readFileSync(R('tools/audio/revoice-engines.json'),'utf8')).characters;
 for(const [id,e] of Object.entries(j))for(const k of ['engine','voice','voiceId'])assert.equal(T.VOICE_ENGINES[id][k],e[k],id+' '+k);
 assert.deepEqual(Object.keys(T.VOICE_ENGINES).sort(),Object.keys(j).sort());
 const reg=JSON.parse(fs.readFileSync(R('tools/audio/npc-voice-registry.json'),'utf8'));assert.equal(reg.npcs.admin.voice,'am_michael','the registry’s Admin entry is unchanged');
});
// ---------------- the owner's NEW trees (create, rename, missions, givers, adapter, saves) ----------------
const G=require(R('void-runner/mission-givers.js'));
function roster(){const src=sources();return G.roster({registry:src.registry,people:require(R('void-runner/district-people.js')).npcs(),story:src.story.characters,temple:require(R('void-runner/temple.js')).MODEL});}
const buyable=()=>new Set(Object.keys(G.buyable(require(R('void-runner/progression.js')).modules)));
function sampleTree(){const d={trees:[]};const t=T.newTree(d.trees,{name:'My Test Tree!',note:'note'});d.trees.push(t);const m=T.addMission(t,{giver:'admin'});m.title='FIRST';Object.assign(m.objectives[0],{kind:'talk',npc:'iris',label:'Talk to Iris'});
 m.unlocks.push({kind:'flag',id:'testFlag',value:true},{kind:'credits',amount:40},{kind:'location',id:'vigil'});return {d,t,m};}
test('new trees: draft- ids that never change, renames are display names only, missions and steps can be added, removed and reordered',()=>{
 const {d,t,m}=sampleTree();assert.equal(t.id,'draft-my-test-tree');assert.equal(m.id,'draft-my-test-tree-m1');assert.equal(t.status,'draft');
 assert.equal(T.newTree(d.trees,{name:'my test tree'}).id,'draft-my-test-tree-2','a second tree with the same name gets its own id');
 T.renameTree(d,t.id,'Another name');assert.equal(t.name,'Another name');assert.equal(t.id,'draft-my-test-tree');
 T.renameTree(d,'vesper-opening','Old opening','Vesper opening and Rook’s first jobs');assert.deepEqual(d.names,{'vesper-opening':'Old opening'});T.renameTree(d,'vesper-opening','Vesper opening and Rook’s first jobs','Vesper opening and Rook’s first jobs');assert.deepEqual(d.names,{});
 const m2=T.addMission(t,{giver:'iris'}),m3=T.addMission(t);assert.deepEqual(t.missions.map(x=>x.id),[m.id,m2.id,m3.id]);T.removeMission(t,m2.id);const m4=T.addMission(t);assert.equal(m4.id,'draft-my-test-tree-m4','ids are never reused');
 assert(T.moveMission(t,m4.id,-1));assert.deepEqual(t.missions.map(x=>x.id),[m.id,m4.id,m3.id]);assert(!T.moveMission(t,m.id,-1));
 const s2=T.addStep(m);assert.equal(s2.id,'step-2');T.moveStep(m,s2.id,-1);assert.equal(m.objectives[0].id,'step-2');assert(T.removeStep(m,'step-2'));assert(!T.removeStep(m,'step-1'),'a mission keeps at least one step');
 const src=sources(),out=T.build({...src,ownerTrees:d.trees,names:{'vesper-opening':'Old opening'},givers:roster()});
 assert.equal(out.trees.find(x=>x.id==='vesper-opening').title,'Old opening');assert.equal(out.trees.find(x=>x.id==='vesper-opening').originalTitle,'Vesper opening and Rook’s first jobs');
 const mine=out.trees.find(x=>x.id===t.id);assert.equal(mine.status,'draft');assert.equal(mine.ownerTree,true);assert.equal(mine.missions[0].giverName,'Admin');assert(mine.npcs.some(n=>n.id==='iris'));
});
test('new trees are validated with the Studio model and the real registries; what cannot run is said in plain words',()=>{
 const {t,m}=sampleTree(),givers=roster(),items=buyable(),r=T.refs(sources());
 assert.equal(T.validateTree(t,{givers,items,refs:r,studio:S}).filter(i=>i.level==='error').length,0);
 m.objectives[0].kind='fight';m.unlocks.push({kind:'item',id:'warflying-module',store:'district-store'},{kind:'ship',id:'ship2'},{kind:'location',id:'atlantis'});m.giver='rin-takeda';m.title='';
 const all=T.validateTree(t,{givers,items,refs:r,studio:S}),txt=all.map(i=>i.text).join('\n');
 for(const s of ['needs a code change','Unknown place "atlantis"','Cannot be played or published yet','cannot hand over a mission','Title is required'])assert(txt.includes(s),s);
 const cap=T.capability(t,{givers,items});assert.equal(cap.play,0);assert.equal(cap.draft,true);assert.equal(cap.export,true);assert(cap.skipped[0].why.some(w=>/step 1 \(fight\) needs a code change/.test(w)));
});
test('the giver roster lists every registered NPC, grouped, with where they are today; only NPCs with a TALK prompt can give missions',()=>{
 const g=roster(),by=id=>g.find(x=>x.id===id),reg=sources().registry.npcs;
 for(const id of Object.keys(reg))if(!reg[id].broadcast)assert(by(id),'registry NPC listed: '+id);
 for(const n of require(R('void-runner/district-people.js')).npcs())assert(by(n.id),'District resident listed: '+n.id);
 for(const id of ['admin','iris','bartender','milked-eva','milked-fish','zen-zephyr'])assert.equal(by(id).group,'district',id);
 for(const id of ['rook','mara','elias','elara','marcus','kess','mercer','iona','sol','nyx'])assert.equal(by(id).group,'earlier',id);
 assert(by('admin').players&&by('admin').draft);assert(by('rook').draft&&by('rook').players,'Meridian is reached after the beginner campaign');assert(!by('elara').players&&by('elara').draft);
 assert(!by('rin-takeda').canTalk&&!by('vr-ava').canTalk&&!by('elias').canTalk,'figures, companions and a recording cannot give missions');
 assert(!g.some(x=>['news-anchor','commercial-announcer'].includes(x.id)),'broadcast voices are not givers');
 // every TALK target named here exists in the game's own layouts and handlers
 const files=['neochinatown.js','meridian-interior.js','station-layouts.js','planets.js','milked-integration.js','temple.js','opening-data.js'].map(f=>fs.readFileSync(R('void-runner/'+f),'utf8')).join('\n');
 for(const x of g)for(const t of x.targets){assert(files.includes("'"+t.action+"'")||files.includes('action:\''+t.action),x.id+' action '+t.action);if(t.character&&!['elara','marcus'].includes(t.character))assert(files.includes("'"+t.character+"'"),x.id+' character '+t.character);}
 assert.deepEqual(G.placesNow({walk:'neochinatown',area:'street',quarter:'far-south'}),['far-south']);assert.deepEqual(G.placesNow({walk:'neochinatown',area:'interior'}),['district']);assert.deepEqual(G.placesNow({location:'meridian',docked:true}),['meridian']);
 assert.deepEqual(G.whoAt(g,'talk','rook'),['rook']);assert.deepEqual(G.whoAt(g,'district-bar'),['bartender','nyx-district']);
});
test('adapter: a new tree is checked, applied, run step by step (talk, go, buy, deliver, hand-in), pays once, and rolls back',()=>{
 const e=env(),givers=roster(),items=buyable(),U=require(R('void-runner/universe.js'));e.U=U;e.givers=givers;MC.snapshot(e);
 const {d,t,m}=sampleTree(),m2=T.addMission(t,{giver:'iris'});m2.title='SECOND';m2.rewards=25;Object.assign(m2.objectives[0],{kind:'go',place:'port',label:'Go to the Port'});
 const s2=T.addStep(m2,{kind:'buy'});Object.assign(s2,{item:'warflying-module',label:'Buy a WarFlying Module'});const s3=T.addStep(m2,{kind:'deliver'});Object.assign(s3,{npc:'landing-terminal',label:'Deliver',early:[{who:'',text:'TEST: too soon'}]});
 m2.ending={npc:'iris',place:'district',label:'',say:[{who:'',text:'TEST: thanks'}]};
 const c=MC.fromDrafts({local:d,givers,items});assert.deepEqual(c.trees[0].missions.map(x=>x.id),[m.id,m2.id]);
 const ctx={givers:new Map(givers.map(g=>[g.id,g])),places:new Set(G.PLACES.map(p=>p.id)),items,locations:new Set(Object.keys(U.locations))};
 assert.deepEqual(MC.check(c,ctx).errors,[]);assert.deepEqual(MC.apply(c,e,ctx).refused,[]);
 assert.equal(e.Missions.definitions[m2.id].ownerTree,t.id);assert.deepEqual(e.Missions.definitions[m2.id].prerequisites,[m.id]);assert.equal(e.Missions.definitions[m2.id].objectives.at(-1).id,'turn-in');
 const s=e.C.startDistrictCampaign(e.C.fresh());s.story.flags.podWakePending=false;const credits=s.credits;
 assert.equal(MC.treeEvent(s,e,{type:'talk',npcs:['iris']},e.Missions,e.C).mission,null,'mission 2 waits for mission 1');
 let r=MC.treeEvent(s,e,{type:'talk',npcs:['admin']},e.Missions,e.C);assert(r.offered);assert.equal(s.universe.trackedMission,m.id);
 r=MC.treeEvent(s,e,{type:'talk',npcs:['iris']},e.Missions,e.C);assert(r.completed);assert.equal(s.story.flags.mf_testFlag,true);assert.equal(s.credits,credits+40);assert(s.universe.discoveredLocations.includes('vigil'));assert.equal(s.story.flags['mt_'+m.id],true);
 assert.equal(MC.treeEvent(s,e,{type:'talk',npcs:['iris']},e.Missions,e.C).offered,true,'Iris offers the second mission');
 assert.equal(MC.treeEvent(s,e,{type:'talk',npcs:['landing-terminal']},e.Missions,e.C).early[0].text,'TEST: too soon','a later step answers with its too-soon line');
 assert.equal(MC.treeEvent(s,e,{type:'buy',item:'warflying-module'},e.Missions,e.C).objective,null,'steps run in order');
 assert.equal(MC.treeEvent(s,e,{type:'place',places:['port']},e.Missions,e.C).objective,'step-1');assert.equal(MC.treeEvent(s,e,{type:'buy',item:'warflying-module'},e.Missions,e.C).objective,'step-2');
 assert.equal(MC.treeEvent(s,e,{type:'talk',npcs:['landing-terminal']},e.Missions,e.C).objective,'step-3');assert(MC.treeWants(s,e,['iris']));
 r=MC.treeEvent(s,e,{type:'talk',npcs:['iris']},e.Missions,e.C);assert.equal(r.objective,'turn-in');assert(r.completed);assert.equal(r.reward,25);assert.equal(r.lines[0].text,'TEST: thanks');
 const after=s.credits;assert.equal(MC.treeEvent(s,e,{type:'talk',npcs:['iris']},e.Missions,e.C).completed,false);assert.equal(s.credits,after,'never paid twice');
 // a campaign that is not a District campaign is never touched
 const old=e.C.fresh();assert.equal(MC.treeEvent(old,e,{type:'talk',npcs:['admin']},e.Missions,e.C).mission,null);
 MC.apply(null,e);assert(!e.Missions.definitions[m.id],'rollback removes the new missions');assert.deepEqual(e.trees,[]);
});
test('adapter refuses unknown kinds, givers without a TALK prompt, non-draft ids, unknown places and items; only runnable missions are sent',()=>{
 const givers=roster(),items=buyable(),ctx={givers:new Map(givers.map(g=>[g.id,g])),places:new Set(G.PLACES.map(p=>p.id)),items,locations:new Set(Object.keys(require(R('void-runner/universe.js')).locations))};
 const base=()=>MC.clone(MC.fromDrafts({local:sampleTree().d,givers,items}));
 const bad=[c=>{c.trees[0].missions[0].objectives[0].kind='fight';},c=>{c.trees[0].missions[0].giver='rin-takeda';},c=>{c.trees[0].id='my-tree';},c=>{c.trees[0].missions[0].id='first';},c=>{c.trees[0].missions[0].objectives[0]={id:'s',label:'x',kind:'go',place:'atlantis'};},
  c=>{c.trees[0].missions[0].objectives[0]={id:'s',label:'x',kind:'buy',item:'communion-scanner'};},c=>{c.trees[0].missions[0].unlocks=[{kind:'item',id:'warflying-module'}];},c=>{c.trees[0].missions[0].unlocks=[{kind:'ship',id:'ship3'}];},c=>{c.trees[0].missions[0].unlocks=[{kind:'tree',id:'draft-nowhere'}];},c=>{c.trees[0].missions[0].objectives[0]={id:'s',label:'x',kind:'arrive',place:'district'};},c=>{c.trees[0].missions[0].evil=1;},c=>{c.names={beginner:'<b>x</b>'};},c=>{c.trees[0].missions[0].offer=[{who:'darth',text:'x'}];}];
 for(const f of bad){const c=base();f(c);assert.equal(MC.check(c,ctx).ok,false,f.toString());}
 const {d,m}=sampleTree();const m2=T.addMission(d.trees[0],{giver:'rin-takeda'});m2.title='CANNOT';const m3=T.addMission(d.trees[0],{giver:'admin'});m3.title='AFTER';Object.assign(m3.objectives[0],{kind:'talk',npc:'admin',label:'x'});
 const c=MC.fromDrafts({local:d,givers,items});assert.deepEqual(c.trees[0].missions.map(x=>x.id),[m.id],'missions after one that cannot run are held back');
 const not=MC.notApplied({local:d,givers,items}).join('\n');assert(/CANNOT.*cannot be played or published yet/.test(not));assert(/AFTER.*an earlier mission in this tree cannot run yet/.test(not));
});
test('saves: new mission records and flags pass the save rules; a removed tree mission is untracked, never deleted',()=>{
 const e=env(),{d,m}=sampleTree(),s=e.C.startDistrictCampaign(e.C.fresh());assert(/^[a-z][a-z0-9-]{0,79}$/.test(m.id));assert(/^[a-zA-Z][\w-]{0,63}$/.test(MC.treeFlag(m.id)));assert(/^[a-zA-Z][\w-]{0,63}$/.test('mf_'+'x'.repeat(48)));
 for(const g of roster())assert(/^[a-zA-Z][\w-]{0,63}$/.test(g.say),'speaker id is a safe story id: '+g.say);
 s.universe.missions[m.id]={acquired:true,completed:false,objectives:{}};s.universe.trackedMission=m.id;
 assert.deepEqual(MC.migrate(s,e.B.MISSIONS,e.B.flagOf,[{missions:[{id:m.id}]}]),[],'a live tree mission stays tracked');
 assert(MC.migrate(s,e.B.MISSIONS,e.B.flagOf,[]).includes('untracked removed mission '+m.id));assert(s.universe.missions[m.id],'the record is kept');
});
test('the server reads the same lists (admin inventory) as the editor and the game',()=>{
 const inv=JSON.parse(fs.readFileSync(R('void_runner_admin_inventory.json'),'utf8')).missionEditor,g=roster();
 assert.deepEqual(Object.keys(inv.givers).sort(),g.map(x=>x.id).sort());for(const x of g)assert.equal(inv.givers[x.id].canTalk,x.canTalk,x.id);
 assert.deepEqual(inv.places,G.PLACES.map(p=>p.id));assert.deepEqual(inv.items.sort(),[...buyable()].sort());assert.deepEqual(inv.stepKinds,MC.STEP_KINDS);assert.deepEqual(inv.unlockKinds,MC.UNLOCKS);
});
test('David’s chain: an Admin tree grants a ship and opens a route, the player flies to Rook, and meeting Rook starts a Rook tree',()=>{
 const e=env(),givers=roster(),items=buyable(),U=require(R('void-runner/universe.js')),Sh=require(R('void-runner/ships.js'));e.U=U;e.givers=givers;MC.snapshot(e);
 const d={trees:[]},a=T.newTree(d.trees,{name:'District start'});d.trees.push(a);const b=T.newTree(d.trees,{name:'Rook'});d.trees.push(b);
 const a1=T.addMission(a,{giver:'admin'});a1.title='A1';Object.assign(a1.objectives[0],{kind:'talk',npc:'iris',label:'Talk to Iris'});
 const fly=T.addStep(a1,{kind:'arrive'});Object.assign(fly,{place:'meridian',label:'Fly to Meridian'});const meet=T.addStep(a1,{kind:'talk'});Object.assign(meet,{npc:'rook',label:'Find Rook'});
 a1.unlocks.push({kind:'ship',id:'ship2',when:'step-1'},{kind:'location',id:'kepler',when:'step-1'},{kind:'tree',id:b.id,when:meet.id});
 const b1=T.addMission(b,{giver:'rook'});b1.title='B1';Object.assign(b1.objectives[0],{kind:'arrive',place:'kepler',label:'Fly to Kepler'});
 assert.equal(T.validateTree(a,{givers,items,refs:T.refs(sources()),studio:S,trees:d.trees}).filter(i=>i.level==='error').length,0);
 const capA=T.capability(a,{givers,items,trees:d.trees});assert.equal(capA.play,1);assert.deepEqual(capA.skipped,[],'the link to tree B is kept when both trees are looked at together');
 const c=MC.fromDrafts({local:d,givers,items}),ctx={givers:new Map(givers.map(g=>[g.id,g])),places:new Set(G.PLACES.map(p=>p.id)),items,locations:new Set(Object.keys(U.locations)),ships:new Map(Object.entries(Sh.ships))};
 assert.deepEqual(MC.check(c,ctx).errors,[]);MC.apply(c,e,ctx);
 const s=e.C.startDistrictCampaign(e.C.fresh());s.story.flags.podWakePending=false;
 assert.equal(MC.treeEvent(s,e,{type:'talk',npcs:['rook']},e.Missions,e.C).mission,null,'the Rook tree waits for its link');assert(!MC.treeWants(s,e,['rook']));
 MC.treeEvent(s,e,{type:'talk',npcs:['admin']},e.Missions,e.C);const r=MC.treeEvent(s,e,{type:'talk',npcs:['iris']},e.Missions,e.C);
 assert(Sh.hasShip(s),'the ship grant opens the pad (awardStarterShip)');assert.deepEqual(s.ownedShips,['starter','ship2']);assert(s.shipLoadouts.ship2,'the granted hull has its loadout');assert.equal(s.universe.freeTravel,true);
 assert(s.universe.discoveredLocations.includes('kepler')&&s.universe.discoveredSystems.includes(U.system('kepler')),'the route opens');assert(r.notes.includes('SHIP ACQUIRED'));
 assert.equal(MC.treeEvent(s,e,{type:'place',places:['port']},e.Missions,e.C).objective,null);s.location='meridian';
 assert.equal(MC.treeEvent(s,e,{type:'place',places:G.placesNow({location:'meridian',docked:true})},e.Missions,e.C).objective,fly.id,'arriving at Meridian completes the flight step');
 const met=MC.treeEvent(s,e,{type:'talk',npcs:G.whoAt(givers,'talk','rook')},e.Missions,e.C);assert.equal(met.objective,meet.id);assert(met.completed);assert.equal(s.story.flags['ts_'+b.id],true,'meeting Rook fires the link');
 const o=MC.treeEvent(s,e,{type:'talk',npcs:['rook']},e.Missions,e.C);assert(o.offered);assert.equal(o.mission,b1.id,'Rook now offers the first mission of his tree');
 // the save rules accept what the chain wrote
 for(const k of Object.keys(s.story.flags))assert(/^[a-zA-Z][\w-]{0,63}$/.test(k),k);assert(s.ownedShips.every(x=>['starter','ship2','ship3'].includes(x)));
 // a link to a tree that cannot run is left out (and said); the rest still runs
 b1.giver='rin-takeda';const c2=MC.fromDrafts({local:d,givers,items});assert.deepEqual(c2.trees.map(t=>t.id),[a.id]);assert(!JSON.stringify(c2).includes('"tree"'));assert(MC.notApplied({local:d,givers,items}).some(t=>/start tree/.test(t)));
});
