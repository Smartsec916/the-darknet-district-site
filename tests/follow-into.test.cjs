/* FOLLOW INTO A PLACE (20 Nov 2026; the owner: "For the follow options if I add an apartment there should be an option to follow into the apartment"): npc-escort.js's
   pure rules (intoProblems, roomGraph / roomPath, crossing, insideDone, resumeInto, gridRoute, lead()'s "goes in first"), the mission check, insideNow / holdOf after the step,
   the save flag, and the browser files' wiring (source checks). */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const R=f=>path.resolve(__dirname,'..',f),E=require(R('void-runner/npc-escort.js')),M=require(R('void-runner/modules.js')),A=require(R('void-runner/apartments.js'));
const REV='grey-reverie',DOOR='apt-avenue-n-16',OT_DOOR='apt-main-w-96';
const office=()=>({id:'a1',door:DOOR,...JSON.parse(JSON.stringify(M.TEMPLATES.find(t=>t.id==='office-servers').loc))});
const flat=(door=DOOR)=>({id:'a2',style:'rundown',door,number:104});
const ctx=(apartments,steps)=>({area:'avenue',apartments,steps:steps||[]});
const step=(o)=>({id:'s2',kind:'follow-them',npc:REV,label:'Follow her',...o});

test('the place list: a follow step may end in an apartment or a room of a location (apt, mod); not both a spot and a place',()=>{
 assert.deepEqual(E.FIELDS['follow-them'],['to','apt','mod','wait','lost','ifLost']);assert.deepEqual(E.FIELDS['they-follow'],['to','apt','mod']);
 assert.deepEqual(E.problems(step({apt:'a2'}),ctx([flat()])),[]);
 assert.deepEqual(E.problems(step({kind:'they-follow',apt:'a1',mod:'servers'}),ctx([office()])),[]);
 assert.deepEqual(E.problems(step({apt:'a1'}),ctx([office()])),[],'anywhere inside');
 assert.match(E.problems(step({apt:'a2',to:{x:60,z:-6.4}}),ctx([flat()])).join(' '),/not both/);
 assert.match(E.problems(step({apt:'zz'}),ctx([flat()])).join(' '),/one of this mission’s places/);
 assert.match(E.problems(step({apt:'a2',mod:'office'}),ctx([flat()])).join(' '),/Only a location built from modules/);
 assert.match(E.problems(step({apt:'a1',mod:'nope'}),ctx([office()])).join(' '),/location’s rooms/);
 assert.match(E.problems(step({apt:'a1',mod:'lift2'}),ctx([office()])).join(' '),/elevator cab/);
 assert.match(E.problems(step({apt:'a2'}),ctx([{...flat(),door:undefined}])).join(' '),/no street door/);});
test('who: never the cat (greyed with the reason); Reverie and Lace never into a bar back room; the street door in her area; the place open by then',()=>{
 const cat=E.problems(step({npc:'street-cat',apt:'a2'}),ctx([flat()]));assert.match(cat.join(' '),/cat stays outside/);assert.equal(E.canInto('street-cat').ok,false);assert.equal(E.canInto(REV).ok,true);
 const bar={id:'a3',door:DOOR,...JSON.parse(JSON.stringify(M.TEMPLATES.find(t=>t.id==='bar').loc))};
 assert.deepEqual(E.problems(step({apt:'a3',mod:'bar'}),ctx([bar])),[]);const pit={id:'a4',door:DOOR,...JSON.parse(JSON.stringify(M.TEMPLATES.find(t=>t.id==='fight-pit').loc))};assert.match(E.problems(step({apt:'a4',mod:'pit'}),ctx([pit])).join(' '),/fight pit/);assert.match(E.problems(step({apt:'a3'}),ctx([bar])).join(' '),/^$/);
 assert.deepEqual(E.problems(step({apt:'a2'}),ctx([flat(OT_DOOR)])),[],'(escort across, 20 Nov 2026) a door in Old Town: she walks there through the North Gate');
 assert.match(E.problems(step({npc:'street-cat',kind:'they-follow',to:{x:-2.7,z:-80}}),ctx([])).join(' '),/cat never goes inside or down into the tunnels/);
 assert.deepEqual(E.problems(step({apt:'a2'}),{...ctx([flat(OT_DOOR)]),area:'oldtown'}),[]);
 const steps=[{id:'s1',kind:'talk'},{id:'s2',kind:'follow-them'},{id:'s3',kind:'apt-enter'}];
 assert.match(E.problems(step({apt:'a2'}),ctx([{...flat(),from:'s3'}],steps)).join(' '),/opens later/);assert.deepEqual(E.problems(step({apt:'a2'}),ctx([{...flat(),from:'s2'}],steps)),[]);
 assert.deepEqual(E.needs(step({}),ctx([flat()])).map(n=>n.key),['step-spot']);assert.deepEqual(E.needs(step({apt:'zz'}),ctx([flat()])).map(n=>n.key),['step-into']);
 const inv=E.inventory();assert.equal(inv.into.doorAreas[DOOR],'avenue');assert.deepEqual(inv.into.adultRooms,['fight-pit']);assert.equal(inv.npcs['street-cat'].into,false);assert.equal(inv.npcs[REV].youthful,true);});
test('rooms: the way from the street door to the server room (doorways, then the elevator); an older apartment is hallway then apartment',()=>{
 const g=E.roomGraph(office());assert.equal(g.entry,'hall');assert.deepEqual(E.roomPath(g,'hall','servers').map(p=>p.room+':'+p.edge.kind),['office:snap','lift:snap','lift2:lift','servers:snap']);
 assert.equal(g.clusters.hall,g.clusters.lift);assert.notEqual(g.clusters.lift,g.clusters.servers);assert.deepEqual(E.roomPath(g,'servers','servers'),[]);
 const l=E.roomGraph(flat());assert.equal(l.legacy,true);assert.equal(E.destOf(l,{}),'flat');assert.equal(E.destOf(g,{mod:'servers'}),'servers');assert.equal(E.destOf(g,{}),null);});
test('the cross-scene state machine: she comes through the door behind the player, rides the elevator with them, waits, or the mission fails',()=>{
 assert.deepEqual(E.crossing({kind:'they-follow',herIn:true,dist:4.8}),{go:'with',delay:2});
 assert.deepEqual(E.crossing({kind:'they-follow',herIn:true,dist:0.5}),{go:'with',delay:.8});
 assert.deepEqual(E.crossing({kind:'they-follow',herIn:true,dist:300}),{go:'with',delay:6},'they-follow: always comes');
 assert.deepEqual(E.crossing({kind:'follow-them',herIn:true,dist:1.2,cab:true,inCab:true}),{go:'ride',delay:0});
 assert.deepEqual(E.crossing({kind:'follow-them',herIn:true,dist:50,set:{lost:40}}),{go:'stay',delay:0});
 assert.deepEqual(E.crossing({kind:'follow-them',herIn:true,dist:50,set:{lost:40,ifLost:'fail'}}),{go:'fail',delay:0});
 assert.deepEqual(E.crossing({kind:'follow-them',herIn:false,dist:2}),{go:'stay',delay:0},'she is not where the player left (she went ahead)');
 const me={inside:true,scene:'c:c1',room:'servers'},her={inside:true,here:true,scene:'c:c1',room:'servers'};
 assert.equal(E.insideDone({dest:'servers',me,her}),true);assert.equal(E.insideDone({dest:'servers',me,her:{...her,here:false}}),false,'still coming through the door');
 assert.equal(E.insideDone({dest:'servers',me:{...me,room:'lift2'},her}),false);assert.equal(E.insideDone({dest:null,me:{...me,room:'lift2'},her}),true,'anywhere inside');
 assert.equal(E.insideDone({dest:'servers',me,her:{...her,scene:'c:c0'}}),false);});
test('reload safety: story.flags.npcEsc carries "in" while she is inside; a reload starts the step again at the street door',()=>{
 const v=E.encode({key:'draft-x-m1/s2',phase:'in',x:0,z:0,w:'in'});assert.equal(v,'draft-x-m1/s2|in|0.0|0.0|in');assert.ok(v.length<200);
 const d=E.decode(v);assert.equal(d.w,'in');assert.equal(E.decode('draft-x-m1/s2|walk|1.0|2.0').w,undefined,'older flags unchanged');
 const D=E.doorAt(DOOR);assert.ok(D&&D.front&&D.inside);assert.deepEqual(E.resumeInto(d,D),{x:D.front.x,z:D.front.z,phase:'there',unarmed:false});assert.equal(E.resumeInto(E.decode('k|walk|1|2'),D),null);
 // the save server accepts it (story.flags: strings up to 200 characters)
 assert.ok(typeof v==='string'&&v.length<=200);});
test('on the street: she walks to the door, goes in first when the player is near (enter -> in), never "done" at the door; they-follow is not done at the door',()=>{
 const D=E.doorAt(DOOR),st={x:D.front.x-6,z:D.front.z,yaw:0,phase:'walk'},me={x:D.front.x-8,z:D.front.z};let evs=[];
 for(let i=0;i<400;i++){const ev=E.lead(st,{me:{x:st.x-2,z:st.z},to:D.front,door:D.inside,set:{},dt:.05,area:'avenue'});if(ev)evs.push(ev);if(st.phase==='in')break;}
 assert.ok(evs.includes('enter')&&evs.includes('in'),evs.join(','));assert.ok(!evs.includes('done'));assert.ok(Math.hypot(st.x-D.inside.x,st.z-D.inside.z)<.05);
 const u={x:D.front.x,z:D.front.z,yaw:0,phase:'there',unarmed:true};assert.equal(E.lead(u,{me:{x:D.front.x,z:D.front.z},to:D.front,door:D.inside,set:{},dt:.1}),null,'just back out: she waits until the player has walked off and come back');
 E.lead(u,{me:{x:D.front.x-7,z:D.front.z},to:D.front,door:D.inside,set:{wait:8},dt:.1});assert.equal(u.unarmed,false);
 const f={x:D.front.x-1,z:D.front.z,yaw:0,phase:'follow'},tr={pts:[{x:D.front.x-1,z:D.front.z},{x:D.front.x,z:D.front.z}],shifted:0};
 for(let i=0;i<20;i++)assert.notEqual(E.follow(f,{me:D.front,trail:tr,to:D.front,door:D.inside,dt:.1,set:{}}),'done');void me;});
test('inside: a walk around the furniture through the doorway (gridRoute on the office location), never through a solid; lead() takes a given route',()=>{
 const loc=office(),inst={key:'m/a1',mission:'m',id:'a1',loc,hacked:[]},def=M.layout(inst,M.analyse(loc).clusterOf('hall').id,{});
 const hall=def.cluster.mods.find(m=>m.id==='hall'),off=def.cluster.mods.find(m=>m.id==='office'),a={x:hall.cx,z:hall.cz},b=E.freeSpot({x:off.cx,z:off.cz},def.solids,.45);
 const r=E.gridRoute(a,b,def.solids);assert.ok(r&&r.length>=1);const pts=[a,...r];const S=def.solids.filter(s=>!s.door);
 for(let i=1;i<pts.length;i++){const p=pts[i-1],q=pts[i],n=Math.ceil(Math.hypot(q.x-p.x,q.z-p.z)/.1);for(let t=0;t<=n;t++){const x=p.x+(q.x-p.x)*t/n,z=p.z+(q.z-p.z)*t/n;assert.ok(!S.some(s=>Math.abs(x-s.position[0])<s.size[0]/2+.25&&Math.abs(z-s.position[2])<s.size[2]/2+.25),'clear of '+x.toFixed(2)+','+z.toFixed(2));}}
 assert.ok(Math.hypot(r[r.length-1].x-b.x,r[r.length-1].z-b.z)<.05);
 const st={x:a.x,z:a.z,yaw:0,phase:'ready'};for(let i=0;i<600&&st.phase!=='there';i++)E.lead(st,{me:{x:st.x,z:st.z-1},to:b,set:{},dt:.05,route:r,routeKey:'k',noDone:true});
 assert.equal(st.phase,'there');assert.ok(Math.hypot(st.x-b.x,st.z-b.z)<.05);});
// the mission engine: the check accepts the step, escortNow carries the place, after the step she stays inside (insideNow, holdOf)
function engine(){const MC=require(R('void-runner/mission-content.js')),C=require(R('void-runner/campaign.js')),G=require(R('void-runner/mission-givers.js'));
 const givers=G.roster({registry:JSON.parse(fs.readFileSync(R('tools/audio/npc-voice-registry.json'),'utf8')),people:require(R('void-runner/district-people.js')).npcs(),story:require(R('void-runner/story-content.js')).characters,temple:require(R('void-runner/temple.js')).MODEL});
 const m={id:'draft-in-m1',number:90,title:'In',type:'side',giver:REV,offer:[{who:REV,text:'Come with me.'}],apartments:[flat()],objectives:[{id:'s1',kind:'talk',npc:REV,label:'Talk to Reverie'},{id:'s2',kind:'follow-them',npc:REV,apt:'a2',label:'Follow Reverie into apartment 104'},{id:'s3',kind:'talk',npc:REV,label:'Talk to her inside'}]};
 return {MC,C,G,givers,m,trees:[{id:'draft-in',name:'In',missions:[m]}]};}
test('the mission check accepts a follow step into a place; escortNow names the place and its street door; after the step she stays in that room until the mission is done',()=>{
 const {MC,C,givers,m,trees}=engine();const content=MC.fromDrafts({local:{trees},givers});const chk=MC.check(content,{givers:new Map(givers.map(g=>[g.id,g]))});assert.ok(chk.ok,chk.errors&&chk.errors.join(' | '));
 assert.deepEqual(A.problems(m),[],'apartments.js lets a follow step name a place');
 const bad=JSON.parse(JSON.stringify(trees));bad[0].missions[0].objectives[1].npc='street-cat';assert.match(MC.notApplied({local:{trees:bad},givers}).join(' '),/cat stays outside/,'the cat: the mission stays in the draft, with the reason');
 const env={trees:MC.storyTrees?MC.storyTrees(content.trees||trees):trees,givers};const s=C.startDistrictCampaign(C.fresh());s.universe.missions={'draft-in-m1':{acquired:true,objectives:{s1:true}}};
 const e=MC.escortNow(s,{...env,trees})[REV];assert.equal(e.apt,'a2');assert.equal(e.door,DOOR);assert.equal(e.loc,'draft-in-m1/a2');
 s.universe.missions['draft-in-m1'].objectives.s2=true;assert.deepEqual(MC.escortNow(s,{...env,trees}),{});const ins=MC.insideNow(s,{...env,trees})[REV];assert.equal(ins.loc,'draft-in-m1/a2');assert.equal(ins.step,'draft-in-m1/s2');
 assert.deepEqual(MC.waitingAt(s,{...env,trees})[REV].inside,{apt:'a2',mod:null,step:'draft-in-m1/s2'});
 s.universe.missions['draft-in-m1'].completed=true;assert.deepEqual(MC.insideNow(s,{...env,trees}),{},'back to her routine once the mission is done');});
test('wiring: the indoor controller is loaded after the module wiring; plans() keeps her off the street while inside; the street figures pass the door; the editor lists the places',()=>{
 const html=fs.readFileSync(R('void-runner.html'),'utf8'),i=f=>html.indexOf('void-runner/'+f+'"');assert.ok(i('npc-escort-indoors.js')>i('module-integration.js')&&i('module-integration.js')>0);
 assert.equal(html,fs.readFileSync(R('static/void-runner.html'),'utf8'));
 for(const f of ['npc-escort-indoors.js','live-content.js','ncz-street-pair.js','npc-made.js','mission-editor.js','editor-home.js','editor-wizard.js'])assert.doesNotThrow(()=>new vm.Script(fs.readFileSync(R('void-runner/'+f),'utf8')),f);
 const lc=fs.readFileSync(R('void-runner/live-content.js'),'utf8');assert.match(lc,/if\(D&&I&&I\.away&&I\.away\(e\.key\)\)/);assert.match(lc,/door:D&&fin\?\{\.\.\.D\.inside\}:null/);assert.match(lc,/MC\.insideNow/);
 for(const f of ['ncz-street-pair.js','npc-made.js'])assert.match(fs.readFileSync(R('void-runner/'+f),'utf8'),/door:P\.door\|\|null/);
 const ind=fs.readFileSync(R('void-runner/npc-escort-indoors.js'),'utf8');assert.match(ind,/X\.build=b1/);assert.match(ind,/E\(\)\.crossing\(/);assert.match(ind,/E\(\)\.insideDone\(/);assert.match(ind,/near\?\.\(true\)/,'doors open for her');
 const ed=fs.readFileSync(R('void-runner/mission-editor.js'),'utf8');assert.match(ed,/data-me-esc-into/);assert.match(ed,/'step-into':/);
 const W=require(R('void-runner/editor-wizard.js'));const a=W.fresh('talk');a.giver=REV;a.apt={style:'rundown',door:DOOR};a.steps=[{kind:'follow-them',npc:REV,spot:'in:a1',label:'Follow',auto:false}];
 assert.deepEqual(W.problems(a,'steps',{givers:[]}).filter(p=>/Step 1/.test(p)),[]);});
