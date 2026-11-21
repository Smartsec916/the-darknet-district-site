/* "When walked near" starts by itself (the owner, 19 Nov 2026: "'When walked near' still needs a click option by the player, even though i want it to start automatically").
   With ACCEPT / DENY off, walking near starts the mission at once (no offer window, nothing to press: only the notification); with it on, or when the player pays at ACCEPT,
   walking near shows the offer and nothing starts until ACCEPT. The wizard makes walked-near missions automatic unless asked or paid; in-person starts are unchanged. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p);
const fresh=()=>{for(const k of Object.keys(require.cache))if(k.includes('void-runner'+path.sep))delete require.cache[k];};
function env(){fresh();
 const M=require(R('void-runner/mission-log.js')),B=require(R('void-runner/beginner.js')),C=require(R('void-runner/campaign.js')),U=require(R('void-runner/universe.js')),MC=require(R('void-runner/mission-content.js')),G=require(R('void-runner/mission-givers.js')),MS=require(R('void-runner/main-story.js'));
 B.register(M);
 const givers=G.roster({registry:JSON.parse(fs.readFileSync(R('tools/audio/npc-voice-registry.json'),'utf8')),people:require(R('void-runner/district-people.js')).npcs(),story:require(R('void-runner/story-content.js')).characters,temple:require(R('void-runner/temple.js')).MODEL});
 const e={B,Missions:M,U,givers};MC.snapshot(e);MC.apply(null,e);return {e,M,C,MC,G,MS};}
const ev=(x,s,e)=>x.MC.treeEvent(s,x.e,e,x.M,x.C);
const player=x=>{const s=x.C.startDistrictCampaign(x.C.fresh());s.story.flags.appearanceOffered=true;s.story.flags.podWakePending=false;s.credits=500;return s;};
const ctx=x=>({givers:new Map(x.e.givers.map(g=>[g.id,g])),places:x.G.placeIds()});
const doc=(x,...trees)=>({format:x.MC.FORMAT,version:x.MC.VERSION,trees:[...x.MC.treesContent(x.MS.trees(),{givers:x.e.givers}).trees,...trees]});
const tree=(channel,extra={},cost)=>({id:'draft-walk',name:'Walk',missions:[{id:'draft-walk-m1',number:44,title:'Walk up',type:'side',giver:'admin',description:'Walk up to Admin.',
 start:{how:'notification',channel,from:'admin',header:'TEST',text:'Over here.',when:{kind:'near',npc:'admin',distance:5},...extra},...(cost?{cost}:{}),rewards:cost?0:50,objectives:[{id:'see',kind:'talk',npc:'iris',label:'Talk to Iris.'}]}]});
const use=(x,t)=>{assert.deepEqual(x.MC.check(doc(x,t),ctx(x)).errors,[]);x.MC.apply({format:x.MC.FORMAT,version:x.MC.VERSION,trees:[t]},x.e);};

for(const channel of ['messages','comms','notify'])test('walked near, ACCEPT / DENY off ('+channel+'): the mission starts at once, with no offer to press',()=>{
 const x=env();use(x,tree(channel));const s=player(x);
 const r=ev(x,s,{type:'near',near:{admin:3}});
 assert.equal(r.offered,true);assert.equal(r.mission,'draft-walk-m1');assert.equal(r.prompt,undefined,'no ACCEPT / DENY window');assert.equal(r.ask,undefined);
 assert.equal(s.universe.missions['draft-walk-m1'].acquired,true);assert.equal(s.universe.trackedMission,'draft-walk-m1');assert.equal(r.messages[0].channel,channel,'only the notification');assert.equal(s.credits,500);
});

test('walked near, ACCEPT / DENY on: the offer is shown and nothing starts until ACCEPT; DENY changes nothing',()=>{
 const x=env();use(x,tree('notify',{accept:true}));const s=player(x);
 let r=ev(x,s,{type:'near',near:{admin:3}});assert.equal(r.prompt.ask.mission,'draft-walk-m1');assert.equal(r.offered,false);assert.equal(s.universe.missions['draft-walk-m1'],undefined);
 r=ev(x,s,{type:'accept',mission:'draft-walk-m1'});assert.equal(r.offered,true);assert.equal(s.universe.missions['draft-walk-m1'].acquired,true);
});

test('walked near, the player pays at ACCEPT: always asks, charged once on ACCEPT',()=>{
 const x=env();use(x,tree('notify',{accept:true},{amount:100}));const s=player(x);
 const r=ev(x,s,{type:'near',near:{admin:3}});assert.equal(r.prompt.offer.cost,100);assert.equal(s.universe.missions['draft-walk-m1'],undefined);assert.equal(s.credits,500);
 assert.equal(ev(x,s,{type:'accept',mission:'draft-walk-m1'}).charged,100);assert.equal(s.credits,400);
 // a cost at ACCEPT without the question is refused (editor, wizard and server agree)
 const bad=tree('notify',{},{amount:100});assert.ok(x.MC.check(doc(x,bad),ctx(x)).errors.some(e=>/must ask/.test(e)));
});

test('in person is unchanged: talking offers it (with or without ACCEPT / DENY); walking near does nothing',()=>{
 const x=env(),t=tree('notify');t.missions[0].start={how:'person'};t.missions[0].offer=[{who:'admin',text:'A job.'}];use(x,t);const s=player(x);
 assert.equal(ev(x,s,{type:'near',near:{admin:1}}).offered,false);assert.equal(s.universe.missions['draft-walk-m1'],undefined);
 assert.equal(ev(x,s,{type:'talk',npcs:['admin']}).offered,true);
 const y=env(),u=tree('notify');u.missions[0].start={how:'person',accept:true};u.missions[0].offer=[{who:'admin',text:'A job.'}];use(y,u);const s2=player(y);
 assert.equal(ev(y,s2,{type:'talk',npcs:['admin']}).ask.mission,'draft-walk-m1');assert.equal(s2.universe.missions['draft-walk-m1'],undefined);
});

test('the wizard: "when the player walks near them" is automatic unless the owner says Yes to ACCEPT / DENY or the player pays',()=>{
 fresh();const W=require(R('void-runner/editor-wizard.js')),T=require(R('void-runner/mission-trees.js'));
 const make=o=>{const a=W.fresh('talk');Object.assign(a,{giver:'admin',start:'near',message:{header:'',text:'Over here.'},rewards:50},o);a.steps[0].npc='iris';return W.build({trees:[]},a,{T,number:80}).mission;};
 let m=make({});assert.equal(m.start.when.kind,'near');assert.equal(m.start.accept,undefined,'automatic by default');assert.equal(W.asks(W.fresh('talk')),false);
 m=make({ask:true});assert.equal(m.start.accept,true,'the owner said Yes');
 m=make({pays:true,rewards:100});assert.equal(m.start.accept,true,'paying at ACCEPT always asks');assert.deepEqual(m.cost,{amount:100,when:'accept'});
});
