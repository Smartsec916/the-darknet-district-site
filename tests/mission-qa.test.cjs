/* Mission system QA pass (19 Nov 2026): regressions for the bugs found while building and playing missions in a browser (docs/development/AI_HANDOFF.md, "Mission
   system QA"). The browser walk is tests/mission-qa-browser.cjs. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p),read=p=>fs.readFileSync(R(p),'utf8');
const fresh=()=>{for(const k of Object.keys(require.cache))if(k.includes('void-runner'+path.sep))delete require.cache[k];};

test('the Form view checks do not ask for words the game does not need (ask, wait, animation steps), but still do for a talk step',()=>{
 fresh();const T=require(R('void-runner/mission-trees.js')),S=require(R('admin/studio-model.js'));
 const d={trees:[]},t=T.newTree(d.trees,{name:'QA tree'});d.trees.push(t);const m=T.addMission(t,{giver:'admin'});m.title='QA';
 Object.assign(m.objectives[0],{kind:'ask',label:'',question:'Ready?'});
 for(const [kind,extra] of [['wait',{hold:2}],['anim',{npc:'ethereal-lace',clip:'shrug'}],['talk',{npc:'iris'}]]){const o=T.addStep(m);Object.assign(o,{kind,label:''},extra);}
 const bad=T.validateTree(t,{givers:[{id:'admin',name:'Admin',players:true},{id:'iris',name:'Iris',players:true},{id:'ethereal-lace',name:'Lace',players:true}],studio:S}).filter(i=>/needs a label/.test(i.text));
 assert.deepEqual(bad.map(i=>i.where.split(' / ').pop()),[m.objectives[3].id],'only the talk step needs its words');
});

test('apartment and location steps carry their target to the guide arrow (VoidMissions guidance), not the "rook" fallback',()=>{
 fresh();const M=require(R('void-runner/mission-log.js')),MC=require(R('void-runner/mission-content.js'));
 const m={id:'draft-qa-m1',title:'QA',type:'side',giver:'admin',apartments:[{id:'a1',style:'normal',door:'apt-main-w-82'}],objectives:[
  {id:'s1',label:'Hack it',kind:'hack',ap:'a1/hall'},{id:'s2',label:'Go in',kind:'apt-enter',apt:'a1'},{id:'s3',label:'Use the computer',kind:'apt-use',apt:'a1',object:'computer'}]};
 const t={id:'draft-qa',missions:[m]},def=MC.treeDefinition(t,m,0,[{id:'admin',name:'Admin',layout:'admin',enter:{walk:true}}]);
 assert.deepEqual(def.objectives.map(o=>o.apt),[{m:m.id,a:null,kind:'hack',ap:'a1/hall'},{m:m.id,a:'a1',kind:'apt-enter'},{m:m.id,a:'a1',kind:'apt-use',object:'computer'}]);
 assert.ok(M.define(m.id,def));const s={location:'earth',universe:{missions:{[m.id]:{acquired:true,completed:false,objectives:{s1:true}}},trackedMission:m.id,trackingInitialized:true}};
 const live=M.all(s,{}).find(x=>x.id===m.id),g=M.guidance(s,live,true);
 assert.equal(g.interaction,undefined,'no stray interaction');assert.deepEqual(g.apt,{m:m.id,a:'a1',kind:'apt-enter'});
});

test('a giver made in the editor is a target for the arrow (no fixed TALK spot), for a step and for the hand-in',()=>{
 fresh();const M=require(R('void-runner/mission-log.js')),MC=require(R('void-runner/mission-content.js'));
 const m={id:'draft-qa-m2',title:'QA',type:'side',giver:'vela',objectives:[{id:'s1',label:'Talk to Vela',kind:'talk',npc:'vela'}],ending:{npc:'vela'}},givers=[{id:'vela',name:'Vela',made:true,layout:null,enter:{walk:'sacramento',quarter:'oldtown'}}];
 const def=MC.treeDefinition({id:'draft-qa',missions:[m]},m,0,givers);assert.deepEqual(def.objectives.map(o=>[o.made,o.interaction]),[['vela',undefined],['vela',undefined]]);
 assert.ok(M.define(m.id,def));const s={location:'earth',universe:{missions:{[m.id]:{acquired:true,completed:false,objectives:{}}},trackedMission:m.id,trackingInitialized:true}};
 const g=M.guidance(s,M.all(s,{}).find(x=>x.id===m.id),true);assert.equal(g.made,'vela');assert.equal(g.interaction,undefined);
});

test('inside a location built from modules the arrow routes through the doorways between rooms (guide-route.js modular), and apartments point straight',()=>{
 fresh();const Mo=require(R('void-runner/modules.js')),G=require(R('void-runner/guide-route.js'));
 const loc={id:'hq',door:'biz-avenue-n-13',...Mo.template('office-servers')},an=Mo.analyse(loc),inst={key:'m/hq',mission:'m',id:'hq',door:loc.door,modular:true,loc,hacked:[]};
 const def=Mo.layout(inst,an.clusterOf('hall').id,{}),graph=G.graphFor('neochinatown',null,def);assert.ok(graph&&graph.regions.length===def.cluster.mods.length,'one region per module');
 assert.ok(graph.portals.length>=1,'doorways between modules are portals');
 const hall=def.cluster.mods.find(x=>x.id==='hall'),use=def.interactions.find(i=>i.action==='mod-use'&&i.mod!=='hall'&&G.regionAt(graph,i.position[0],i.position[2])!=='mod:hall');assert.ok(use,'something to use in another room');
 const route=G.plan(graph,{x:hall.cx,z:hall.cz},{x:use.position[0],y:1.2,z:use.position[2]});
 assert.ok(route.length>=2&&route[0].kind==='door','the first waypoint is a doorway, not the goal through the wall');
 for(const w of route.filter(w=>w.kind==='door'))assert.ok(def.cluster.doors.some(d=>Math.hypot(d.x-w.x,d.z-w.z)<.01),'every door waypoint is a real door');
 assert.equal(G.graphFor('neochinatown',null,{id:'neochinatown',apartment:true,part:'hall'}),null,'an apartment hallway: straight');
 assert.ok(G.graphFor('neochinatown',null,{id:'neochinatown',area:'street'}),'the street keeps its graph');
});

test('source guards: the wizard reads the chosen person from the event; a used choice window leaves no buttons; the mid-mission question ignores hidden ones; the Form view redraws ask fields',()=>{
 const eh=read('void-runner/editor-home.js');assert.ok(!/sel\.onchange=\(\)=>\{s\.npc=sel\.value;s\.(spot|clip)/.test(eh),'no handler reads `sel` after it is set to null');assert.ok(/s\.npc=e\.target\.value;s\.clip=''/.test(eh)&&/s\.npc=e\.target\.value;s\.spot=''/.test(eh));
 const tc=read('void-runner/talk-choice.js');assert.match(tc,/function clear\(\)\{try\{screen\.querySelectorAll\('\[data-talk-choice\],\[data-talk-offer\]'\)/);assert.match(tc,/done=true;clear\(\);/);
 assert.match(read('void-runner/live-content.js'),/\[data-talk-choice\]'\)\]\.some\(n=>n\.getClientRects\(\)\.length\)\)return;/);
 assert.match(read('void-runner/mission-editor.js'),/askFields\(\{t,m,o,eo:\(fn,redraw=true\)=>eo\(fn,redraw\)/);
});
