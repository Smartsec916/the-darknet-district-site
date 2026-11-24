/* Player lines and animations in the Mission Editor (the owner, 19 Nov 2026: "after I create a voice line, i can not create the line for the player. i also can't add
   animations anywhere between the steps"). A back-and-forth (NPC line, the player's line 'You', NPC line) plays in order; an NPC line may carry `anim` (a clip that NPC
   really has: npc-gestures.js); a step of kind 'anim' plays a clip and is done when the game reports it ({type:'anim'}). Checked by the game (mission-content.js check). */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p);
const fresh=()=>{for(const k of Object.keys(require.cache))if(k.includes('void-runner'+path.sep))delete require.cache[k];};
function env(){fresh();
 const M=require(R('void-runner/mission-log.js')),B=require(R('void-runner/beginner.js')),C=require(R('void-runner/campaign.js')),U=require(R('void-runner/universe.js')),MC=require(R('void-runner/mission-content.js')),G=require(R('void-runner/mission-givers.js'));
 B.register(M);
 const givers=G.roster({registry:JSON.parse(fs.readFileSync(R('tools/audio/npc-voice-registry.json'),'utf8')),people:require(R('void-runner/district-people.js')).npcs(),story:require(R('void-runner/story-content.js')).characters,temple:require(R('void-runner/temple.js')).MODEL});
 const e={B,Missions:M,U,givers};MC.snapshot(e);MC.apply(null,e);return {e,M,C,MC,G};}
const ev=(x,s,e)=>x.MC.treeEvent(s,x.e,e,x.M,x.C);
const player=x=>{const s=x.C.startDistrictCampaign(x.C.fresh());s.story.flags.appearanceOffered=true;s.story.flags.podWakePending=false;return s;};
const ctx=x=>({givers:new Map(x.e.givers.map(g=>[g.id,g])),places:x.G.placeIds()});
const doc=(x,trees,npcs)=>({format:x.MC.FORMAT,version:x.MC.VERSION,trees,...(npcs?{npcs}:{})});
const ID='draft-chat-m1';
const chat=(objectives,offer)=>[{id:'draft-chat',name:'Chat',missions:[{id:ID,number:71,title:'A word with Iris',type:'side',giver:'admin',offer:offer||[{who:'admin',text:'Go and see Iris.'}],objectives}]}];
const talkIris={id:'iris',kind:'talk',npc:'iris',label:'Talk to Iris',say:[{who:'iris',text:'You again.'},{who:'You',text:'Admin sent me.'},{who:'iris',text:'Of course he did.',anim:'shrug'}]};

test('a back-and-forth plays in order: the NPC, the player ("You", no animation, no voice), the NPC with her shrug',()=>{
 const x=env(),d=doc(x,chat([talkIris,{id:'go',kind:'go',place:'port',label:'Go to the Port.'}]));assert.deepEqual(x.MC.check(d,ctx(x)).errors,[]);x.MC.apply(d,x.e,ctx(x));const s=player(x);
 assert.ok(ev(x,s,{type:'talk',npcs:['admin']}).offered);
 const r=ev(x,s,{type:'talk',npcs:['iris']});assert.equal(r.objective,'iris');
 assert.deepEqual(r.lines.map(l=>[l.who,l.text,l.anim||null]),[['Iris','You again.',null],['You','Admin sent me.',null],['Iris','Of course he did.','shrug']]);
 assert.equal(r.lines[2].npc,'iris','the animation names the speaker by id (to find her figure)');assert.equal(r.lines[1].npc,undefined);
});

test('the editor keeps the animation in the content it sends; a player line never carries one',()=>{
 const x=env(),c=x.MC.fromDrafts({local:{trees:chat([{...talkIris,say:[{who:'',text:'Hi.',anim:'look'},{who:'You',text:'Hello.',anim:'shrug'}]}])},givers:x.e.givers});
 const say=c.trees[0].missions[0].objectives[0].say;assert.deepEqual(say,[{who:'iris',text:'Hi.',anim:'look'},{who:'You',text:'Hello.'}]);
});

test('animations are checked: only clips the speaker really has; never on the player; Reverie and Lace casual only; the cat none; added NPCs-tab clips count',()=>{
 const x=env(),err=(objs,npcs)=>x.MC.check(doc(x,chat(objs),npcs),ctx(x)).errors.join(' | ');
 assert.match(err([{...talkIris,say:[{who:'iris',text:'Hm.',anim:'dance-samba'}]}]),/not an animation this character can play/);
 assert.match(err([{...talkIris,say:[{who:'You',text:'Hm.',anim:'shrug'}]}]),/player’s own line has no animation/);
 assert.match(err([{...talkIris,say:[{who:'iris',text:'Hm.',anim:'<b>'}]}]),/unknown name/);
 const N=require(R('void-runner/npc-gestures.js'));
 const rev=N.clipsFor('tea-host').clips.map(c=>c.id);assert.ok(rev.includes('look'));assert.ok(!rev.some(c=>/^walk|^run|^sit|sensual|kiss|samba/.test(c)),rev.join());
 assert.equal(N.clipsFor('street-cat').ok,false);assert.match(N.problem('street-cat','idle'),/cat/);
 assert.equal(N.clipsFor('You').ok,false);assert.ok(N.clipsFor('admin').clips.some(c=>c.id==='shrug'));assert.ok(N.clipsFor('bartender').clips.some(c=>c.id==='wipe'),'the District bartender is Nyx');
 assert.equal(N.clipsFor('milked-eva').ok,false,'a shared street figure is not one person');
 const added='npc-admin/talk';assert.ok(N.problem('tea-host',added),'shared clip requires assignment');assert.equal(N.problem('tea-host',added,{plan:{mode:'original',anims:[added]}}),'');
 const rv=[{id:'rv',kind:'talk',npc:'tea-host',label:'Talk to Reverie',say:[{who:'tea-host',text:'Hey.',anim:added}]}];
 assert.ok(err(rv));assert.equal(err(rv,{'tea-host':{mode:'original',anims:[added]}}),'');
});

test('an animation step: offered by the wizard and the step list, plays when it is the step in progress, done by the game\'s report after its seconds',()=>{
 const x=env(),G=x.G;assert.ok(G.STEP_KINDS.find(k=>k.id==='anim').supported);assert.ok(x.MC.STEP_KINDS.includes('anim'));
 const W=require(R('void-runner/editor-wizard.js'));assert.ok(W.STEPS.some(k=>k.id==='anim'));
 const objs=[talkIris,{id:'shrug',kind:'anim',npc:'iris',clip:'shrug',hold:2,label:'Watch Iris'},{id:'go',kind:'go',place:'port',label:'Go to the Port.'}],d=doc(x,chat(objs));
 assert.deepEqual(x.MC.check(d,ctx(x)).errors,[]);x.MC.apply(d,x.e,ctx(x));const s=player(x);ev(x,s,{type:'talk',npcs:['admin']});
 assert.deepEqual(x.MC.animNow(s,x.e),[],'not before its turn');ev(x,s,{type:'talk',npcs:['iris']});
 assert.deepEqual(x.MC.animNow(s,x.e),[{key:ID+'/shrug',mission:ID,step:'shrug',npc:'iris',clip:'shrug',hold:2}]);
 assert.equal(ev(x,s,{type:'anim',step:ID+'/other'}).objective,null,'another step id does nothing');
 const r=ev(x,s,{type:'anim',step:ID+'/shrug'});assert.equal(r.objective,'shrug');assert.deepEqual(x.MC.animNow(s,x.e),[]);
 assert.equal(s.universe.missions[ID].objectives.go,undefined,'the next step is in progress');
 const bad=e=>x.MC.check(doc(x,chat([{id:'a',kind:'anim',npc:'iris',clip:'shrug',label:'x',...e}])),ctx(x)).errors.join(' | ');
 assert.match(bad({hold:31}),/0 to 30/);assert.match(bad({clip:'walk'}),/not an animation/);assert.match(bad({npc:'You'}),/who plays/);assert.match(bad({say:[{who:'iris',text:'x'}]}),/no lines/);
 assert.match(x.MC.check(doc(x,chat([{...talkIris,clip:'shrug'}])),ctx(x)).errors.join(),/only an animation step/);
 // the editor's needs: who and which clip; the label may stay empty (it becomes "Watch")
 const needs=x.MC.treeBlockers({title:'T',giver:'admin',objectives:[{id:'a',kind:'anim',npc:'iris',label:''}]},x.e.givers);assert.deepEqual(needs,['step 1: choose the animation']);
 const c=x.MC.fromDrafts({local:{trees:chat([{id:'a',kind:'anim',npc:'iris',clip:'shrug',label:''}])},givers:x.e.givers});assert.deepEqual(c.trees[0].missions[0].objectives[0],{id:'a',label:'Watch',kind:'anim',npc:'iris',clip:'shrug',hold:3});
});

test('existing content still checks and plays (lines without a speaker id fall back to the part\'s NPC; old lines without animations unchanged)',()=>{
 const x=env(),c=x.MC.fromDrafts({local:{trees:chat([{id:'t',kind:'talk',npc:'iris',label:'Talk',say:[{who:'',text:'Hi.'}]}])},givers:x.e.givers});
 assert.deepEqual(c.trees[0].missions[0].objectives[0].say,[{who:'iris',text:'Hi.'}]);assert.deepEqual(x.MC.check(c,ctx(x)).errors,[]);
});

test('the admin inventory lists each character\'s clips for the server, and the crowd controller can play a clip for a while (perform)',()=>{
 fresh();const inv=require(R('tools/admin-inventory.cjs')).build();const g=inv.missionEditor.gestures;
 assert.deepEqual(g.iris.clips.slice().sort(),['floor-cross','floor-kneel','floor-knees','idle','look','shrug','talk']);   // the floor poses (21 Nov 2026)assert.ok(!g['street-cat']);assert.ok(inv.missionEditor.stepKinds.includes('anim'));
 assert.ok(!g['tea-host'].clips.some(c=>/^walk|^run|^sit/.test(c)));
 const src=fs.readFileSync(R('void-runner/crowd.js'),'utf8');assert.match(src,/function perform\(name,/);assert.match(src,/if\(perf\)\{perf\.wanted=name;return;\}/,'the scene\'s own play() waits while a mission clip plays');
 const html=fs.readFileSync(R('void-runner.html'),'utf8');assert.ok(html.indexOf('npc-gestures.js')>html.indexOf('npc-paths.js')&&html.indexOf('npc-gestures.js')<html.indexOf('mission-content.js'));
});

/* Mission timers (the owner, 19 Nov 2026: "mission timers. set the amount of time between actions, lines, etc"). */
test('line timers travel with the line (wait before, show for, animation length); the player\'s line is marked never voiced',()=>{
 const x=env(),say=[{who:'iris',text:'One.'},{who:'You',text:'Hm.',wait:3},{who:'iris',text:'Two.',show:4,anim:'shrug',animFor:2}],d=doc(x,chat([{...talkIris,say}]));
 assert.deepEqual(x.MC.check(d,ctx(x)).errors,[]);x.MC.apply(d,x.e,ctx(x));const s=player(x);ev(x,s,{type:'talk',npcs:['admin']});const r=ev(x,s,{type:'talk',npcs:['iris']});
 assert.deepEqual(r.lines.map(l=>[l.who,l.wait||0,l.show||0,l.animFor||0,!!l.player]),[['Iris',0,0,0,false],['You',3,0,0,true],['Iris',0,4,2,false]]);
 const c=x.MC.fromDrafts({local:{trees:chat([{...talkIris,say:[{who:'',text:'A.',wait:0,show:null},{who:'',text:'B.',wait:'3',animFor:5}]}])},givers:x.e.givers});
 assert.deepEqual(c.trees[0].missions[0].objectives[0].say,[{who:'iris',text:'A.'},{who:'iris',text:'B.',wait:3}],'empty or zero timings are left out; an animation time needs an animation');
 const bad=l=>x.MC.check(doc(x,chat([{...talkIris,say:[{who:'iris',text:'x',...l}]}])),ctx(x)).errors.join(' | ');
 assert.match(bad({wait:61}),/0 to 60/);assert.match(bad({show:0}),/1 to 60/);assert.match(bad({wait:1.5}),/0 to 60/);assert.match(bad({animFor:2}),/only a line with an animation/);assert.match(bad({anim:'shrug',animFor:31}),/1 to 30/);
});

test('a delay before a step: nothing about the step happens until the countdown (kept in story.flags) reaches 0; then it runs as usual and the flag goes',()=>{
 const x=env(),objs=[{id:'go',kind:'go',place:'port',label:'Go to the Port.'},{...talkIris,delay:5}],d=doc(x,chat(objs));assert.deepEqual(x.MC.check(d,ctx(x)).errors,[]);x.MC.apply(d,x.e,ctx(x));
 const s=player(x);ev(x,s,{type:'talk',npcs:['admin']});ev(x,s,{type:'place',places:['port']});
 let t=x.MC.timersNow(s,x.e);assert.deepEqual(t.map(y=>[y.kind,y.left,y.total]),[['delay',5,5]]);
 assert.equal(ev(x,s,{type:'talk',npcs:['iris']}).objective,null,'Iris does not react while the delay runs');
 x.MC.timerSet(s,t[0],2.2);assert.equal(s.story.flags[t[0].flag],3,'whole seconds, rounded up');
 const again=JSON.parse(JSON.stringify(s));assert.equal(x.MC.timersNow(again,x.e)[0].left,3,'a reload resumes the countdown');
 x.MC.timerSet(s,t[0],0);assert.deepEqual(x.MC.timersNow(s,x.e),[]);ev(x,s,{type:'timer'});
 const r=ev(x,s,{type:'talk',npcs:['iris']});assert.equal(r.objective,'iris');assert.equal(s.story.flags[t[0].flag],undefined,'removed when the step is done');
 assert.match(x.MC.check(doc(x,chat([{...talkIris,delay:601}])),ctx(x)).errors.join(),/0 to 600/);
});

test('a wait step: N seconds (optionally only near someone), done by the game\'s report; offered in the step list and the wizard',()=>{
 const x=env();assert.ok(x.G.STEP_KINDS.find(k=>k.id==='wait').supported);const W=require(R('void-runner/editor-wizard.js'));assert.ok(W.STEPS.some(k=>k.id==='wait'&&k.needs==='seconds'));
 const objs=[talkIris,{id:'stay',kind:'wait',hold:30,npc:'iris',near:5,label:'Stay with Iris'},{id:'go',kind:'go',place:'port',label:'Go to the Port.'}],d=doc(x,chat(objs));
 assert.deepEqual(x.MC.check(d,ctx(x)).errors,[]);x.MC.apply(d,x.e,ctx(x));const s=player(x);ev(x,s,{type:'talk',npcs:['admin']});ev(x,s,{type:'talk',npcs:['iris']});
 const t=x.MC.timersNow(s,x.e);assert.deepEqual(t.map(y=>[y.kind,y.left,y.npc,y.near]),[['wait',30,'iris',5]]);
 assert.equal(ev(x,s,{type:'wait',step:ID+'/stay'}).objective,'stay');assert.deepEqual(x.MC.timersNow(s,x.e),[]);
 const bad=o=>x.MC.check(doc(x,chat([{id:'w',kind:'wait',label:'x',...o}])),ctx(x)).errors.join(' | ');
 assert.match(bad({hold:0}),/1 to 600/);assert.match(bad({hold:601}),/1 to 600/);assert.match(bad({hold:5,near:5}),/stay near/);assert.match(bad({hold:5,npc:'iris',near:51}),/1 to 50/);assert.match(bad({hold:5,npc:'iris'}),/only with a distance/);
 const c=x.MC.fromDrafts({local:{trees:chat([{id:'w',kind:'wait',hold:12,npc:'iris',label:''}])},givers:x.e.givers});assert.deepEqual(c.trees[0].missions[0].objectives[0],{id:'w',label:'Wait',kind:'wait',hold:12});
});
