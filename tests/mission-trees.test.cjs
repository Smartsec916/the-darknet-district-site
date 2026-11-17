/* Mission Editor data: every mission tree in the game data is found, with its NPCs, lines, endings and unlocks; the content adapter applies, rolls back and migrates safely. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p),T=require(R('void-runner/mission-trees.js')),MC=require(R('void-runner/mission-content.js')),S=require(R('admin/studio-model.js'));
const fresh=()=>{for(const k of Object.keys(require.cache))if(k.includes('void-runner'+path.sep))delete require.cache[k];};
function sources(extra={}){fresh();return {missions:require(R('void-runner/mission-log.js')).definitions,beginner:require(R('void-runner/beginner.js')).MISSIONS,content:require(R('void-runner/content.js')),campaign:require(R('void-runner/campaign.js')),story:require(R('void-runner/story-content.js')),
 registry:JSON.parse(fs.readFileSync(R('tools/audio/npc-voice-registry.json'),'utf8')),manifest:JSON.parse(fs.readFileSync(R('void-runner/assets/audio/voice/manifest.json'),'utf8')),files:Object.fromEntries(T.FILES.map(f=>[f,fs.readFileSync(R(f),'utf8')])),
 modules:require(R('void-runner/progression.js')).modules,ships:require(R('void-runner/ships.js')).ships,locations:require(R('void-runner/universe.js')).locations,stores:S.STORES,...extra};}

test('every mission tree in the game data is listed, with its status, and no registry, contract or chapter mission is missing',()=>{
 const src=sources(),out=T.build(src),ids=out.trees.map(t=>t.id);
 assert.deepEqual(ids,['beginner','vesper-opening','sealed-cargo','communion','natural-order','rook-contracts','chapter-belt','chapter-lockdown','chapter-gate']);
 assert.equal(out.trees.find(t=>t.id==='beginner').status,'active');assert(out.trees.filter(t=>t.id!=='beginner').every(t=>t.status==='historical'));
 const listed=new Set(out.trees.flatMap(t=>t.missions.map(m=>m.id)));
 for(const id of Object.keys(src.missions))if(src.missions[id].beginner!==true)assert(listed.has(id),'registry mission '+id+' is listed');
 for(const m of src.beginner)assert(listed.has(m.id));for(const c of src.campaign.contracts)assert(listed.has(c.id));for(const c of src.content.missions)assert(listed.has(c.id));
 assert.equal(out.counts.missions,6+Object.keys(src.missions).length+src.campaign.contracts.length+src.content.missions.length);
 assert.equal(out.counts.trees,9);
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
 assert.deepEqual(out.trees.filter(t=>t.status==='draft').map(t=>t.id),['draft-studio','draft-server']);
 const r=T.refs(src),m=out.trees.flatMap(t=>t.missions).find(x=>x.id==='communion-delivery'),locked=m.scenes[0].lines[0],free=T.allLines(out.trees.flatMap(t=>t.missions).find(x=>x.id==='admin-sealed-cargo-01')).find(l=>l.editable==='local');
 assert.equal(T.validateEdit(m,{unlocks:[{kind:'item',id:'warflying-scrambler',store:'district-store'},{kind:'ship',id:'ship2'},{kind:'location',id:'holdfast'},{kind:'flag',id:'myFlag',value:true}],reputation:[{faction:'communion',amount:5}],credits:10},r).filter(i=>i.level==='error').length,0);
 const bad=T.validateEdit(m,{unlocks:[{kind:'item',id:'laser-sword',store:'district-store'},{kind:'ship',id:'x-wing'},{kind:'location',id:'atlantis'},{kind:'item',id:'cooling',store:'mall'}],reputation:[{faction:'empire',amount:5}],credits:-1,lines:{[locked.key]:'changed'}},r).filter(i=>i.level==='error').map(i=>i.text).join('\n');
 for(const t of ['laser-sword','x-wing','atlantis','mall','empire','Credits','David’s script'])assert(bad.includes(t),t);
 const sm=out.trees.flatMap(t=>t.missions).find(x=>x.id==='admin-sealed-cargo-01');const v=T.validateEdit(sm,{lines:{[free.key]:'New placeholder words.'}},r);assert(!v.some(i=>i.level==='error'));assert(v.some(i=>/voice clip out of date/.test(i.text)));
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
 const list=MC.notApplied({studio:{missions:[{title:'A',giver:'Admin',offer:[{who:'Admin',text:'x'}],choices:[{id:'a',label:'b'}],unlocks:[{item:'x',where:['everywhere']}]}]},local:{missions:{'registry:communion-delivery':{name:'COMMUNION DELIVERY',lines:{a:'b'},unlocks:[{kind:'ship',id:'ship2'}],reputation:[{faction:'communion',amount:1}],credits:5},'rook-contracts:medicine':{name:'Cold chain',title:'X'}}}});
 for(const t of ['does not speak','choices','store items','adapter','design note','reputation','campaign code','Contracts are flown'])assert(list.some(x=>x.includes(t)),t);
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
