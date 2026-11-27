/* The Mission giver creator (the owner, 19 Nov 2026: "a mission giver creator. i can select any npc, create their look based on what's available for that model, give them a
   device model (ie V1), a ship, other items (gun, hacking device, etc), place them in the world for a mission"). content.characters[id] (npc-made.js) placed by content.npcs[id]:
   checked by the game (mission-content.js check) and the server (void_runner_live_content.py), movable (npc-paths.js setMade), givers with a TALK prompt (mission-givers.js
   roster), only in the world while their mission is active when set, and "adult (18+)" opens the adult venues (npc-areas.js), never on Reverie's or Lace's model. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p);
const fresh=()=>{for(const k of Object.keys(require.cache))if(k.includes('void-runner'+path.sep))delete require.cache[k];};
function env(){fresh();
 const M=require(R('void-runner/mission-log.js')),B=require(R('void-runner/beginner.js')),C=require(R('void-runner/campaign.js')),U=require(R('void-runner/universe.js')),MC=require(R('void-runner/mission-content.js')),G=require(R('void-runner/mission-givers.js'));
 B.register(M);
 const givers=G.roster({registry:JSON.parse(fs.readFileSync(R('tools/audio/npc-voice-registry.json'),'utf8')),people:require(R('void-runner/district-people.js')).npcs(),story:require(R('void-runner/story-content.js')).characters,temple:require(R('void-runner/temple.js')).MODEL});
 const e={B,Missions:M,U,givers};MC.snapshot(e);MC.apply(null,e);return {e,M,C,MC,G,X:require(R('void-runner/npc-paths.js')),MD:require(R('void-runner/npc-made.js')),A:require(R('void-runner/npc-areas.js'))};}
const ev=(x,s,e)=>x.MC.treeEvent(s,x.e,e,x.M,x.C);
test('residence hours support overnight schedules and always home',()=>{const {MD}=env(),r={door:'apt-avenue-n-16',slot:0,mode:'schedule',from:'20:00',to:'08:00'};assert.equal(MD.residenceAtHome(r,23*60),true);assert.equal(MD.residenceAtHome(r,7*60),true);assert.equal(MD.residenceAtHome(r,8*60),false);assert.equal(MD.residenceAtHome({...r,mode:'always'},12*60),true);assert.equal(MD.validResidence({...r,to:'20:00'}),false);});
const player=x=>{const s=x.C.startDistrictCampaign(x.C.fresh());s.story.flags.appearanceOffered=true;s.story.flags.podWakePending=false;return s;};
const ctx=x=>({givers:new Map(x.e.givers.map(g=>[g.id,g])),places:x.G.placeIds()});
const KARA={name:'Kara Voss',role:'a fixer (placeholder)',model:'npc-courier',device:'v3',ship:'ship2',items:[{id:'ward-pistol',show:true}],look:{colour:{'*':{tint:'#aa2233'}}}};
const OLDTOWN={mode:'stay',x:52.5,z:-90,yaw:Math.PI/2,actions:['idle','look']};
const tree=(giver,extra={})=>[{id:'draft-kara',name:'Kara',missions:[{id:'draft-kara-m1',number:81,title:'A job from Kara',type:'side',giver,offer:[{who:giver,text:'I have work.'}],objectives:[{id:'go',kind:'go',place:'port',label:'Go to the Port.'}],...extra}]}];
const doc=(x,{characters={'kara-voss':KARA},npcs={'kara-voss':OLDTOWN},trees=tree('kara-voss')}={})=>({format:x.MC.FORMAT,version:x.MC.VERSION,characters,npcs,trees});

test('a made giver: checked, movable, in the roster with a TALK prompt, offers her mission and the registration is put back after a check',()=>{
 const x=env(),d=doc(x);assert.deepEqual(x.MC.check(d,ctx(x)).errors,[]);assert.equal(x.X.MOVABLE['kara-voss'],undefined,'a check leaves the registry as it was');
 const r=x.MC.apply(d,x.e,ctx(x));assert.deepEqual(r.refused,[]);assert.ok(x.X.MOVABLE['kara-voss']&&x.X.MOVABLE['kara-voss'].made);
 const g=x.e.givers.find(y=>y.id==='kara-voss');assert.ok(g&&g.canTalk&&g.players&&g.made);assert.deepEqual(g.targets,[{action:'made-npc',character:'kara-voss'}]);assert.deepEqual(g.enter,{walk:'sacramento',quarter:'oldtown'});
 assert.deepEqual(x.G.whoAt(x.e.givers,'made-npc','kara-voss'),['kara-voss']);
 const s=player(x),o=ev(x,s,{type:'talk',npcs:['kara-voss']});assert.ok(o.offered,'talking to her offers the mission');assert.equal(o.lines[0].who,'kara-voss','the speaker is her id (the dialogue window shows her name card)');
 const P=x.X.planNow('kara-voss',{plan:x.e.npcPlans['kara-voss']});assert.equal(P.area,'oldtown');
 // a new version without her: she is gone from the roster and the registry
 x.MC.apply({format:x.MC.FORMAT,version:x.MC.VERSION},x.e,ctx(x));assert.ok(!x.e.givers.some(y=>y.made));assert.equal(x.X.MOVABLE['kara-voss'],undefined);});

test('the checks: name, model, device, ship, items (shown only where a prop exists), placement, ids the game uses, a mission that would hide its own giver',()=>{
 const x=env(),err=o=>x.MC.check(doc(x,o),ctx(x)).errors.join(' | ');
 assert.match(err({characters:{'kara-voss':{...KARA,name:''}}}),/name is needed/);
 assert.match(err({characters:{'kara-voss':{...KARA,model:'npc-street-cat'}}}),/choose the model/);
 assert.match(err({characters:{'kara-voss':{...KARA,device:'v9'}}}),/V1, V2, V3/);
 assert.match(err({characters:{'kara-voss':{...KARA,ship:'ufo'}}}),/not a ship/);
 assert.match(err({characters:{'kara-voss':{...KARA,items:[{id:'red-dot',show:true}]}}}),/cannot be shown/);
 assert.match(err({characters:{'kara-voss':{...KARA,items:[{id:'banana'}]}}}),/not an item/);
 assert.match(err({npcs:{}}),/put them somewhere/);
 assert.match(err({characters:{admin:KARA},npcs:{admin:OLDTOWN},trees:tree('admin')}),/already used/);
 assert.match(err({characters:{'kara-voss':{...KARA,when:{mission:'draft-kara-m1'}}}}),/cannot be the one who offers it/);
 assert.match(err({characters:{'kara-voss':{...KARA,when:{mission:'draft-nope'}}}}),/not in your missions/);
 assert.match(err({characters:{'kara-voss':{...KARA,model:'studio-warrior',look:{gear:['gear-visor']}}}}),/licensed model gets nothing added/);
 assert.match(err({characters:{'kara-voss':{...KARA,model:'studio-warrior',look:undefined,device:undefined}},npcs:{'kara-voss':{mode:'path',points:[{x:52.5,z:-90,action:'wait',seconds:3},{x:52.5,z:-80,action:'wait',seconds:3}]}}}),/no walking animation/);});

test('a made NPC can exist only during published schedule blocks',()=>{
 const x=env(),id='kara-voss',plan={mode:'original',tier:1,schedule:[
  {...OLDTOWN,from:'08:00',to:'12:00'},
  {mode:'stay',from:'12:00',to:'14:00',x:103.5,z:-6.4,yaw:0,actions:['idle'],cross:true},
 ]};
 const d=doc(x,{npcs:{[id]:plan},trees:[]});
 assert.deepEqual(x.MC.check(d,ctx(x)).errors,[]);
 assert.deepEqual(x.MC.apply(d,x.e,ctx(x)).refused,[]);
 assert.equal(x.X.planNow(id,{plan:x.e.npcPlans[id],minute:7*60}),null);
 assert.ok(x.X.planNow(id,{plan:x.e.npcPlans[id],minute:13*60}).crossings.avenue.entry);
});

test('when they are there: always, only while a mission is active, or from one of its steps',()=>{
 const x=env(),c={...KARA,when:{mission:'draft-a',step:'two'}},t=[{id:'draft-t',missions:[{id:'draft-a',objectives:[{id:'one'},{id:'two'}]}]}];
 const s={universe:{missions:{}},story:{flags:{}}};assert.equal(x.MD.exists(KARA,s,t),true);assert.equal(x.MD.exists(c,s,t),false);
 s.universe.missions['draft-a']={acquired:true,completed:false,objectives:{}};assert.equal(x.MD.exists(c,s,t),false);assert.equal(x.MD.exists({...KARA,when:{mission:'draft-a'}},s,t),true);
 s.universe.missions['draft-a'].objectives.one=true;assert.equal(x.MD.exists(c,s,t),true);s.universe.missions['draft-a'].completed=true;assert.equal(x.MD.exists(c,s,t),false);});

test('adult (18+): only then the adult venues; never on Reverie’s or Lace’s model; never the pod room or the Milked studios',()=>{
 const x=env(),NULLFLOOR={mode:'stay',x:30,z:-55,yaw:0,actions:['idle']},err=o=>x.MC.check(doc(x,o),ctx(x)).errors.join(' | ');
 assert.match(err({npcs:{'kara-voss':NULLFLOOR}}),/NULL/);
 assert.equal(err({characters:{'kara-voss':{...KARA,adult:true}},npcs:{'kara-voss':NULLFLOOR}}),'');
 assert.match(err({characters:{'kara-voss':{...KARA,model:'npc-grey-reverie',adult:true}},npcs:{'kara-voss':NULLFLOOR}}),/model/i);
 const A=x.A,ad={adult:true,made:true};assert.equal(A.check({x:81,z:-180},null,undefined,ad).ok,true,'Milked reception');assert.equal(A.check({x:87,z:-178},null,undefined,ad).ok,false,'a Milked studio');
 const pods=A.get('district').no.find(n=>/Pod/.test(n.name));assert.equal(A.check({x:(pods.x0+pods.x1)/2,z:(pods.z0+pods.z1)/2},null,undefined,ad).ok,false,'the pod room');
 for(const n of ['the bar','the VR play area','the arcade room']){const w=A.get('district').walk.find(v=>v.adult&&v.name===n);const p={x:(w.x0+w.x1)/2,z:(w.z0+w.z1)/2};assert.equal(A.check(p,null,undefined,ad).ok,true,n);assert.equal(A.check(p).ok,false,n);}
 assert.equal(A.check({x:81.75,z:-173}).ok,false);assert.equal(A.check({x:81.75,z:-173},null,undefined,ad).ok,true,'Milked’s front doorway');
 const X=x.X;X.setMade({rev:{name:'R',model:'npc-ethereal-lace',adult:true}});assert.ok(!X.MOVABLE.rev||!X.MOVABLE.rev.adult||!x.MD.modelOf('npc-ethereal-lace'));assert.equal(X.planProblems('rev',NULLFLOOR).length>0,true);X.setMade({});
 assert.equal(A.here('milked').join(),'milked');assert.deepEqual(A.enter('milked'),{walk:'milked'});});

test('drafts: only finished characters are sent (with their placement); an unfinished one is said in plain words; the id comes from the name',()=>{
 const x=env(),local={trees:tree('kara-voss'),characters:{'kara-voss':KARA,'half-done':{name:'Half',model:'npc-courier'}},npcs:{'kara-voss':OLDTOWN}};x.X.setMade(local.characters);
 const c=x.MC.fromDrafts({local,givers:x.e.givers});assert.deepEqual(Object.keys(c.characters),['kara-voss']);assert.deepEqual(Object.keys(c.npcs),['kara-voss']);
 assert.ok(x.MC.notApplied({local,givers:x.e.givers}).some(t=>/Half/.test(t)&&/put them somewhere/.test(t)));
 {const l2={...local,npcs:{'kara-voss':{...OLDTOWN,actions:['idle','idle-shift']}}};assert.match(x.MC.madeNeeds(l2,x.e.givers,'kara-voss').join(),/idle-shift/,'a thing her model cannot do keeps her out');assert.deepEqual(Object.keys(x.MC.madeReady(l2,x.e.givers)),[]);}
 assert.equal(x.MD.idFor('Kara Voss!'),'kara-voss');assert.equal(x.MD.idFor('Kara Voss',new Set(['kara-voss'])),'kara-voss-2');assert.equal(x.MD.idFor('  '),'giver');
 assert.ok(x.MD.models().some(m=>m.asset==='npc-courier'&&m.group==='street'));assert.ok(!x.MD.models().some(m=>m.asset==='npc-street-cat'));
 assert.ok(x.MD.items().find(i=>i.id==='ward-pistol').show==='hip');assert.ok(x.MD.ships().some(s=>s.id==='ship2'));});

test('cab rides stay Reverie’s and Lace’s; follow / lead steps work with a made character',()=>{
 const x=env(),E=require(R('void-runner/npc-escort.js'));x.X.setMade({'kara-voss':KARA});
 assert.equal(E.can('kara-voss','follow-them').ok,true);assert.equal(E.can('kara-voss','they-follow').ok,true);assert.equal(E.can('kara-voss','their-cab').ok,false);assert.match(E.can('kara-voss','shared-cab').why,/unavailable for created characters/);x.X.setMade({});});

test('the page and the editor: the script after the street pair and Milked, the creator in the NPCs tab and on the Start page, the admin inventory',()=>{
 const html=fs.readFileSync(R('void-runner.html'),'utf8'),at=f=>html.indexOf('void-runner/'+f+'"');assert.ok(at('npc-made.js')>at('ncz-street-pair.js')&&at('npc-made.js')>at('milked-build.js')&&at('npc-made.js')<at('neochinatown.js'));
 assert.equal(fs.readFileSync(R('static/void-runner.html'),'utf8'),html);
 const ed=fs.readFileSync(R('void-runner/npc-editor.js'),'utf8'),home=fs.readFileSync(R('void-runner/editor-home.js'),'utf8');assert.match(ed,/Create a mission giver/);assert.match(ed,/This character is an adult \(18\+\)/);assert.match(home,/'giver','people','Create a mission giver'/);
 const inv=JSON.parse(fs.readFileSync(R('void_runner_admin_inventory.json'),'utf8')).madeCharacters;assert.ok(inv.models['npc-courier'].movable.actions.includes('idle'));assert.ok(inv.reserved.includes('admin'));assert.equal(inv.models['npc-grey-reverie'],undefined);
 assert.equal(inv.items['ward-pistol'].show,'hip');});


test('deleting a created NPC cleans owned records and protects shared dependencies',()=>{
 const M=require(R('void-runner/npc-made.js')),d={characters:{a:{},b:{relationships:[{target:'a'}]}},trees:[{id:'job',missions:[{giver:'a'}]}],voices:{a:1,b:2},clips:{x:{who:'a'},y:{who:'b'}},animRequests:[{npc:'a'},{npc:'b'}],interactions:{a:{talk:'Hi'}},npcs:{a:{}},looks:{shared:{}}};
 assert.equal(M.deleteCharacter(d,'a'),false);
 d.trees=[];assert.equal(M.deleteCharacter(d,'a'),false);
 delete d.characters.b.relationships;assert.equal(M.deleteCharacter(d,'a'),true);
 assert.deepEqual(d.voices,{b:2});assert.deepEqual(d.clips,{y:{who:'b'}});assert.deepEqual(d.animRequests,[{npc:'b'}]);assert.deepEqual(d.interactions,{});assert.deepEqual(d.npcs,{});assert.deepEqual(d.looks,{shared:{}});
});
