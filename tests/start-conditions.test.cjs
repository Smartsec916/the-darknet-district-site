/* "…and only when": extra start conditions (start-conditions.js, the owner, 20 Nov 2026: "can you add a secondary trigger … if a secondary isn't set it will just go off
   the first trigger"). Every condition kind, the checks (game; the server's are tests/test_start_conditions.py with the same messages), the tree engine waiting for the
   conditions (walk near with "no other people within 6 m" waits while someone stands by the giver, starts once they leave), a one-moment trigger remembered until its
   conditions hold, nothing changed without conditions, the editor helpers (and the "Shared game flag" reward the Form view's + ADD makes). */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p);
const fresh=()=>{for(const k of Object.keys(require.cache))if(k.includes('void-runner'+path.sep))delete require.cache[k];};
function env(){fresh();
 const M=require(R('void-runner/mission-log.js')),B=require(R('void-runner/beginner.js')),C=require(R('void-runner/campaign.js')),U=require(R('void-runner/universe.js')),MC=require(R('void-runner/mission-content.js')),G=require(R('void-runner/mission-givers.js')),MS=require(R('void-runner/main-story.js'));
 B.register(M);
 const givers=G.roster({registry:JSON.parse(fs.readFileSync(R('tools/audio/npc-voice-registry.json'),'utf8')),people:require(R('void-runner/district-people.js')).npcs(),story:require(R('void-runner/story-content.js')).characters,temple:require(R('void-runner/temple.js')).MODEL});
 const e={B,Missions:M,U,givers};MC.snapshot(e);MC.apply(null,e);return {e,M,C,MC,G,MS,SC:require(R('void-runner/start-conditions.js'))};}
const at=(h,m=0)=>Date.UTC(2026,10,20,h,m,0);
const ev=(x,s,e)=>x.MC.treeEvent(s,x.e,e,x.M,x.C);
const player=x=>{const s=x.C.startDistrictCampaign(x.C.fresh());s.story.flags.appearanceOffered=true;s.story.flags.podWakePending=false;return s;};
const ctx=x=>({givers:new Map(x.e.givers.map(g=>[g.id,g])),places:x.G.placeIds()});
const doc=(x,...trees)=>({format:x.MC.FORMAT,version:x.MC.VERSION,trees});
const use=(x,...trees)=>{const d=doc(x,...trees);assert.deepEqual(x.MC.check(d,ctx(x)).errors,[]);x.MC.apply(d,x.e,ctx(x));x.e.trees=x.e.trees.filter(t=>trees.some(y=>y.id===t.id));};   // only these trees (the shipped storyline starts on the pod exit too)
const tree=(start,id='draft-only')=>({id,name:'Only',missions:[{id:id+'-m1',number:77,title:'Quiet word',type:'side',giver:'admin',start,offer:[{who:'admin',text:'Not here. Not now.'}],objectives:[{id:'go',kind:'go',place:'port',label:'Go to the Port.'}]}]});
const near=only=>({how:'notification',channel:'notify',from:'admin',text:'Over here.',when:{kind:'near',npc:'admin',distance:4},...(only?{only}:{})});
/* A world the tests set by hand (live-content.js measures the real one). */
const world=(o={})=>({others:(id,m,crowd)=>o.others?o.others(id,m,crowd):0,players:()=>o.players??0,places:()=>o.places||[],onFoot:()=>o.onFoot!==false,drawn:()=>!!o.drawn,zone:()=>o.zone||'friendly'});

test('every condition kind, true and false',()=>{
 const {SC}=env(),s={credits:250,story:{flags:{shipAccess:'none',mf_x:true,off:false}},universe:{missions:{'draft-a-m1':{acquired:true,completed:true},'draft-b-m1':{acquired:true}}}};
 const ok=(c,q={})=>SC.check([c],s,{who:'admin',street:at(12),world:world(),...q}).ok;
 const crowdSeen=[];const busy=world({others:(id,m,crowd)=>{crowdSeen.push([id,m,crowd]);return crowd?2:0;}});
 assert.equal(ok({kind:'alone',distance:6,crowd:true}),true);assert.equal(ok({kind:'alone',distance:6,crowd:true},{world:busy}),false);assert.equal(ok({kind:'alone',distance:6,crowd:false},{world:busy}),true,'only placed people count');
 assert.deepEqual(crowdSeen,[['admin',6,true],['admin',6,false]]);assert.equal(ok({kind:'alone',npc:'iris',distance:6},{world:world({others:id=>id==='iris'?1:0})}),false,'measured from the person named');
 assert.equal(ok({kind:'alone',distance:6},{world:world({others:()=>null})}),false,'the person not in this scene: not met');assert.equal(ok({kind:'alone',distance:6},{world:null}),false,'no world: not met');
 assert.equal(ok({kind:'players',distance:10}),true);assert.equal(ok({kind:'players',distance:10},{world:world({players:1})}),false);
 assert.equal(ok({kind:'time',from:'20:00',to:'04:00'},{street:at(23,30)}),true);assert.equal(ok({kind:'time',from:'20:00',to:'04:00'},{street:at(3,59)}),true);assert.equal(ok({kind:'time',from:'20:00',to:'04:00'},{street:at(4)}),false);
 assert.equal(ok({kind:'time',from:'09:00',to:'17:00'},{street:at(12)}),true);assert.equal(ok({kind:'time',from:'09:00',to:'17:00'},{street:at(8,59)}),false);
 assert.equal(ok({kind:'place',place:'underground'},{world:world({places:['under-tea-room','underground']})}),true);assert.equal(ok({kind:'place',place:'underground'}),false);
 assert.equal(ok({kind:'place',place:'port'},{places:['port'],world:null}),true,'the event’s own places');
 assert.equal(ok({kind:'mission',mission:'draft-a-m1',done:true}),true);assert.equal(ok({kind:'mission',mission:'draft-b-m1',done:true}),false);assert.equal(ok({kind:'mission',mission:'draft-b-m1',done:false}),true);assert.equal(ok({kind:'mission',mission:'nope',done:false}),true);
 assert.equal(ok({kind:'flag',flag:'mf_x',set:true}),true);assert.equal(ok({kind:'flag',flag:'off',set:true}),false);assert.equal(ok({kind:'flag',flag:'off',set:false}),true);assert.equal(ok({kind:'flag',flag:'none',set:false}),true);
 assert.equal(ok({kind:'credits',amount:250}),true);assert.equal(ok({kind:'credits',amount:251}),false);
 assert.equal(ok({kind:'ship',has:true}),false);assert.equal(ok({kind:'ship',has:false}),true);s.story.flags.shipAccess='granted';assert.equal(ok({kind:'ship',has:true}),true);
 assert.equal(ok({kind:'on-foot'}),true);assert.equal(ok({kind:'on-foot'},{world:world({onFoot:false})}),false);
 assert.equal(ok({kind:'holstered'}),true);assert.equal(ok({kind:'holstered'},{world:world({drawn:true})}),false);
 assert.equal(ok({kind:'zone',zone:'friendly'}),true);assert.equal(ok({kind:'zone',zone:'hostile'}),false);assert.equal(ok({kind:'zone',zone:'hostile'},{world:world({zone:'hostile'})}),true);
 assert.equal(SC.check([],s,{}).ok,true,'an empty list is met');
 for(const k of SC.IDS)assert.deepEqual(SC.problems([{...SC.fresh(k),...(k==='place'?{place:'port'}:k==='mission'?{mission:'draft-a-m1'}:k==='flag'?{flag:'mf_x'}:{})}]),[],k+': a fresh condition (blanks filled) is valid');
});

test('bad data is refused in plain words (game; the server says the same: test_start_conditions.py)',()=>{
 const {SC}=env(),P=(l,c)=>SC.problems(l,c);
 assert.deepEqual(P('x'),['the extra conditions must be a list.']);
 assert.deepEqual(P(Array(7).fill({kind:'on-foot'})),['at most 6 extra conditions.']);
 assert.deepEqual(P([{kind:'teleport'}]),['condition 1: unknown kind of condition.']);
 assert.deepEqual(P([{kind:'on-foot',distance:3}]),['condition 1: has fields it does not use.']);
 assert.deepEqual(P([{kind:'alone',distance:0}]),['condition 1: “no other people near” needs a distance from 1 to 30 metres.']);
 assert.deepEqual(P([{kind:'alone',distance:6,crowd:'yes'}]),['condition 1: “count the street crowd” must be yes or no.']);
 assert.deepEqual(P([{kind:'alone',distance:6,npc:'ghost'}],{person:id=>id==='admin'}),['condition 1: must name someone the game has a TALK prompt for (or leave it as the giver).']);
 assert.deepEqual(P([{kind:'players',distance:51}]),['condition 1: “no other players near” needs a distance from 1 to 50 metres.']);
 assert.deepEqual(P([{kind:'time',from:'8:00',to:'10:00'}]),['condition 1: the times must be written hh:mm (00:00 to 23:59).']);
 assert.deepEqual(P([{kind:'time',from:'10:00',to:'10:00'}]),['condition 1: the start and end times must differ.']);
 assert.deepEqual(P([{kind:'place',place:'atlantis'}],{places:new Set(['port'])}),['condition 1: choose the place the player must be in.']);
 assert.deepEqual(P([{kind:'mission',mission:'draft-x',done:1}],{missions:new Set(['draft-y'])}),['condition 1: choose a mission that exists.','condition 1: “finished / not finished” must be yes or no.']);
 assert.deepEqual(P([{kind:'flag',flag:'1bad',set:true}]),['condition 1: the story flag needs a name (letters, digits, - or _).']);
 assert.deepEqual(P([{kind:'credits',amount:1.5}]),['condition 1: the credits must be a whole number from 1 to 10000000.']);
 assert.deepEqual(P([{kind:'ship',has:'no'}]),['condition 1: “has a ship / has none” must be yes or no.']);
 assert.deepEqual(P([{kind:'zone',zone:'red'}]),['condition 1: choose Friendly, Neutral or Hostile.']);
 // through the mission check (and the start's own words)
 const x=env(),bad=tree(near([{kind:'alone',distance:99}]));assert.deepEqual(x.MC.check(doc(x,bad),ctx(x)).errors.filter(e=>/only when/.test(e)).length,1);
 assert.match(x.MC.check(doc(x,bad),ctx(x)).errors.find(e=>/only when/.test(e)),/and only when, condition 1: “no other people near” needs a distance from 1 to 30 metres\./);
 assert.ok(x.MC.check(doc(x,tree({how:'person',only:[{kind:'mission',mission:'draft-nowhere-m1'}]})),ctx(x)).errors.some(e=>/choose a mission that exists/.test(e)));
 assert.deepEqual(x.MC.check(doc(x,tree({how:'person',only:[{kind:'time',from:'20:00',to:'04:00'}]})),ctx(x)).errors,[],'in person with conditions: no "notification fields" complaint');
});

test('walk near + "no other people within 6 m": waits while someone stands by the giver, starts as soon as they leave',()=>{
 const x=env();use(x,tree(near([{kind:'alone',distance:6,crowd:true}])));let crowd=1;x.e.world=()=>world({others:(id,m)=>id==='admin'&&m===6?crowd:0});
 const s=player(x);
 for(let k=0;k<5;k++){const r=ev(x,s,{type:'near',near:{admin:3}});assert.equal(r.offered,false,'someone is by the giver');}
 assert.equal(s.universe.missions['draft-only-m1'],undefined,'nothing taken');assert.equal(s.story.flags['mq_draft-only-m1'],undefined,'walk near is checked again by itself: no mark');
 assert.equal(x.MC.onlyNow(s,x.e)[0].ok,false);assert.deepEqual(x.MC.onlyNow(s,x.e)[0].each,[{kind:'alone',ok:false}]);
 crowd=0;assert.equal(ev(x,s,{type:'near',near:{admin:9}}).offered,false,'out of range: the trigger itself is not met');
 const r=ev(x,s,{type:'near',near:{admin:3}});assert.equal(r.offered,true,'they left: it starts');assert.equal(r.mission,'draft-only-m1');assert.deepEqual(r.lines.map(l=>l.text),['Not here. Not now.']);
 assert.equal(s.universe.missions['draft-only-m1'].acquired,true);assert.deepEqual(x.MC.onlyNow(s,x.e),[]);
});

test('with no conditions the start is exactly as before (an empty list too)',()=>{
 for(const only of [undefined,[]]){const x=env();use(x,tree(near(only)));x.e.world=()=>{throw new Error('the world is not asked without conditions');};const s=player(x);
  assert.equal(ev(x,s,{type:'near',near:{admin:3}}).offered,true);assert.equal(x.MC.onlyNow(s,x.e).length,0);
  const st=x.MC.treesContent([tree(near(only))],{givers:x.e.givers}).trees[0].missions[0].start;assert.equal('only' in st,false,'nothing in the published copy');}
});

test('a one-moment trigger (pod exit) whose conditions fail is remembered and starts on a later event once they hold',()=>{
 const x=env();use(x,tree({how:'notification',channel:'messages',from:'admin',header:'ADMIN',text:'Come by.',when:{kind:'pod-exit'},only:[{kind:'credits',amount:500},{kind:'holstered'}]}));
 let drawn=true;x.e.world=()=>world({drawn});const s=player(x);s.credits=100;
 assert.equal(ev(x,s,{type:'pod-exit'}).offered,false);assert.equal(s.story.flags['mq_draft-only-m1'],true,'remembered');
 assert.equal(ev(x,s,{type:'place',places:[]}).offered,false,'still short of credits');
 s.credits=600;assert.equal(ev(x,s,{type:'place',places:[]}).offered,false,'the weapon is out');
 drawn=false;const r=ev(x,s,{type:'place',places:[]});assert.equal(r.offered,true,'both true: it starts on the next event');assert.equal(r.messages.length,1,'its message arrives');
 assert.equal(s.story.flags['mq_draft-only-m1'],undefined,'the mark is removed');
 // without the pod exit first, a place event never starts it
 const x2=env();use(x2,tree({how:'notification',channel:'messages',from:'admin',header:'ADMIN',text:'Come by.',when:{kind:'pod-exit'},only:[{kind:'credits',amount:1}]}));const s2=player(x2);s2.credits=10;
 assert.equal(ev(x2,s2,{type:'place',places:[]}).offered,false);assert.equal(ev(x2,s2,{type:'pod-exit'}).offered,true);
});

test('in person: the giver offers it only while the conditions hold (time of day, another mission finished); the next talk checks again',()=>{
 const x=env();use(x,tree({how:'person',accept:true,only:[{kind:'time',from:'20:00',to:'04:00'},{kind:'flag',flag:'mf_ready',set:true}]}));const s=player(x);
 assert.equal(ev(x,s,{type:'talk',npcs:['admin'],at:at(12)}).ask,undefined,'midday: no offer');
 assert.equal(ev(x,s,{type:'talk',npcs:['admin'],at:at(22)}).ask,undefined,'night, but the flag is not set');
 s.story.flags.mf_ready=true;const r=ev(x,s,{type:'talk',npcs:['admin'],at:at(22)});assert.equal(r.ask.mission,'draft-only-m1');
 assert.equal(ev(x,s,{type:'accept',mission:'draft-only-m1',at:at(22)}).offered,true);
 const st=x.MC.treesContent([tree({how:'person',accept:true,only:[{kind:'time',from:'20:00',to:'04:00'},{kind:'flag',flag:'mf_ready'}]})],{givers:x.e.givers}).trees[0].missions[0].start;assert.deepEqual(st.only,[{kind:'time',from:'20:00',to:'04:00'},{kind:'flag',flag:'mf_ready',set:true}],'the published copy keeps the conditions (defaults filled)');
});

test('a walked-near offer that asks ACCEPT / DENY: no prompt while a player stands by the giver; the zone and on-foot conditions use the game’s world',()=>{
 const x=env();use(x,tree({...near([{kind:'players',distance:10},{kind:'on-foot'},{kind:'zone',zone:'friendly'}]),accept:true}));let o={players:1};x.e.world=()=>world(o);const s=player(x);
 assert.equal(ev(x,s,{type:'near',near:{admin:2}}).prompt,undefined);o={players:0,onFoot:false};assert.equal(ev(x,s,{type:'near',near:{admin:2}}).prompt,undefined);
 o={players:0,zone:'neutral'};assert.equal(ev(x,s,{type:'near',near:{admin:2}}).prompt,undefined);o={};assert.equal(ev(x,s,{type:'near',near:{admin:2}}).prompt.ask.mission,'draft-only-m1');
});

test('editor helpers: the sentence, changing how it starts keeps the conditions, blocks round trip, the save flag is accepted',()=>{
 const x=env(),{SC}=x,MB=require(R('void-runner/mission-blocks.js')),m=tree(near([{kind:'alone',distance:6,crowd:true}])).missions[0];m.giver='tea-host';m.start.when.npc='tea-host';
 const names={person:id=>id==='tea-host'?'the Tea Room Host':id};
 assert.equal(SC.sentence(m,names),'Starts when you walk within 4 m of the Tea Room Host, and only when no other people are within 6 m of the Tea Room Host. If they are not true at that moment, it waits and starts as soon as they are.');
 assert.equal(SC.sentence({giver:'admin',start:{how:'person'}},{person:()=>'Admin'}),'Starts when the player talks to Admin.');
 assert.match(SC.sentence({giver:'admin',start:{how:'person',only:[{kind:'credits',amount:5},{kind:'ship',has:false},{kind:'on-foot'}]}},{person:()=>'Admin'}),/only when the player has at least 5 credits, the player has no ship and the player is on foot .* waits for the next talk\.$/);
 for(const mode of ['person','person-accept','messages','near-accept','near']){MB.setStartMode(m,mode);assert.deepEqual(m.start.only,[{kind:'alone',distance:6,crowd:true}],mode);}
 const t={id:'draft-only',name:'Only',missions:[m]};const back=MB.fromBlocks(MB.toBlocks(m),m);assert.deepEqual(back.start.only,m.start.only);
 assert.match('mq_'+'draft-x'.repeat(20).slice(0,61),/^[a-zA-Z][\w-]{0,63}$/,'the waiting mark is a story flag name clean_save accepts');assert.equal(x.MC.armFlag('a'.repeat(80)).length,64);void t;
});

test('the Form view’s + ADD for a “Shared game flag” makes a reward the checks accept (value true, a flag the game knows)',()=>{
 const x=env(),MB=require(R('void-runner/mission-blocks.js')),t=tree({how:'person'});
 const u=MB.newUnlock('contract-flag',{id:x.MC.CONTRACT_FLAGS[0],value:''});assert.deepEqual(u,{kind:'contract-flag',id:'rook-first-delivery-done',value:true});
 t.missions[0].unlocks=[u];assert.deepEqual(x.MC.check(doc(x,t),ctx(x)).errors,[]);
 t.missions[0].unlocks=[{kind:'contract-flag',id:'rook-first-delivery-done'}];assert.ok(x.MC.check(doc(x,t),ctx(x)).errors.some(e=>/shared game flag/.test(e)),'the old shape (no value) was refused');
 assert.deepEqual(MB.newUnlock('flag',{value:' metRook '}),{kind:'flag',id:'metRook',value:true});assert.deepEqual(MB.newUnlock('credits',{value:'250'}),{kind:'credits',amount:250});
 assert.deepEqual(MB.newUnlock('item',{id:'x',store:'s'}),{kind:'item',id:'x',store:'s'});assert.deepEqual(MB.newUnlock('missiles',{id:'m1',value:'6'}),{kind:'missiles',id:'m1',amount:6});
 const src=fs.readFileSync(R('void-runner/mission-editor.js'),'utf8');assert.match(src,/VoidMissionBlocks\.newUnlock\(k,/,'the Form view uses it');assert.match(src,/k==='contract-flag'\?Object\.fromEntries\(\(MC\(\)\.CONTRACT_FLAGS/,'and lists the flags');
});

test('load order: start-conditions.js before mission-content.js; the editor panel is in both views; the wizard points to it',()=>{
 const html=fs.readFileSync(R('void-runner.html'),'utf8');const a=html.indexOf('void-runner/start-conditions.js'),b=html.indexOf('void-runner/mission-content.js');assert.ok(a>0&&a<b);
 assert.match(fs.readFileSync(R('void-runner/mission-blocks-view.js'),'utf8'),/kit\.onlyPanel\(m,/);assert.match(fs.readFileSync(R('void-runner/mission-editor.js'),'utf8'),/const blocksKit=\{onlyPanel,/);
 assert.match(fs.readFileSync(R('void-runner/editor-home.js'),'utf8'),/data-eh-only-note/);assert.match(fs.readFileSync(R('void-runner/live-content.js'),'utf8'),/env\.world=\(\)=>/);
});
