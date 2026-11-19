/* Mission costs and ACCEPT / DENY (the owner, 19 Nov 2026: "can i do -100 credit option and add an accept or deny"). mission-content.js MONEY: a mission can cost the player
   credits (charged once at ACCEPT, or when a chosen step is done; never below 0; "You need N CR" when short; refund only if ticked), and any offer, in person or on the device,
   can ask ACCEPT / DENY with the owner's labels and what DENY does (again / never / start another mission). The wizard's "Player pays" and "Ask ACCEPT / DENY". */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p);
const fresh=()=>{for(const k of Object.keys(require.cache))if(k.includes('void-runner'+path.sep))delete require.cache[k];};
function env(){fresh();
 const M=require(R('void-runner/mission-log.js')),B=require(R('void-runner/beginner.js')),C=require(R('void-runner/campaign.js')),U=require(R('void-runner/universe.js')),MC=require(R('void-runner/mission-content.js')),G=require(R('void-runner/mission-givers.js')),MS=require(R('void-runner/main-story.js'));
 B.register(M);
 const givers=G.roster({registry:JSON.parse(fs.readFileSync(R('tools/audio/npc-voice-registry.json'),'utf8')),people:require(R('void-runner/district-people.js')).npcs(),story:require(R('void-runner/story-content.js')).characters,temple:require(R('void-runner/temple.js')).MODEL});
 const e={B,Missions:M,U,givers};MC.snapshot(e);MC.apply(null,e);return {e,M,C,MC,G,MS};}
const ev=(x,s,e)=>x.MC.treeEvent(s,x.e,e,x.M,x.C);
const player=(x,credits)=>{const s=x.C.startDistrictCampaign(x.C.fresh());s.story.flags.appearanceOffered=true;s.story.flags.podWakePending=false;s.credits=credits;return s;};
const ctx=x=>({givers:new Map(x.e.givers.map(g=>[g.id,g])),places:x.G.placeIds()});
const doc=(x,...trees)=>({format:x.MC.FORMAT,version:x.MC.VERSION,trees});
const use=(x,...trees)=>{const d=doc(x,...trees),c=x.MC.check(d,ctx(x));assert.deepEqual(c.errors,[]);x.MC.apply(d,x.e,ctx(x));};
const ID='draft-pass-m1';
const passTree=(extra={},start={})=>({id:'draft-pass',name:'Pass',missions:[{id:ID,number:61,title:'A pass for the gate',type:'side',giver:'iris',description:'Iris sells a gate pass.',
 start:{how:'person',accept:true,...start},offer:[{who:'iris',text:'A pass costs a hundred.'}],cost:{amount:100},objectives:[{id:'go',kind:'go',place:'port',label:'Go to the Port.'}],...extra}]});
const otherTree={id:'draft-other',name:'Other',missions:[{id:'draft-other-m1',number:62,title:'Plan B',type:'side',giver:'iris',offer:[{who:'iris',text:'Then try this.'}],objectives:[{id:'go',kind:'go',place:'port',label:'Go to the Port.'}]}]};
const talk=(x,s)=>ev(x,s,{type:'talk',npcs:['iris']});

test('ACCEPT charges the cost once: shown on the offer, taken at ACCEPT, never again (second ACCEPT, a reload, a removed record without a refund)',()=>{
 const x=env();use(x,passTree());const s=player(x,150);
 const r=talk(x,s);assert.deepEqual(r.ask,{mission:ID,title:'A pass for the gate',accept:'ACCEPT',decline:'DENY'});assert.equal(r.offer.cost,100);assert.equal(r.offer.costWhen,'accept');
 assert.equal(r.offer.afford,true);assert.equal(r.offer.need,0);assert.equal(r.offer.description,'Iris sells a gate pass.');assert.equal(s.credits,150,'nothing taken before ACCEPT');
 const a=ev(x,s,{type:'accept',mission:ID});assert.equal(a.offered,true);assert.equal(a.charged,100);assert.ok(a.notes.includes('−100 CREDITS'));assert.equal(s.credits,50);assert.equal(s.story.flags['mc_'+ID],100);
 assert.ok(s.universe.missions[ID].acquired);
 assert.equal(ev(x,s,{type:'accept',mission:ID}).charged,undefined);assert.equal(s.credits,50,'a second ACCEPT charges nothing');
 const again=JSON.parse(JSON.stringify(s));ev(x,again,{type:'accept',mission:ID});assert.equal(again.credits,50,'a reloaded save is not charged again');
 delete s.universe.missions[ID];const r2=ev(x,s,{type:'accept',mission:ID});assert.equal(r2.offered,true);assert.equal(s.credits,50,'charged once ever (the flag stays)');
 // the flag is something clean_save keeps: a story flag id and a safe integer
 assert.match('mc_'+ID,/^[a-zA-Z][\w-]{0,63}$/);assert.ok(Number.isSafeInteger(s.story.flags['mc_'+ID]));
});

test('cannot afford: ACCEPT is greyed (offer.afford false, need N), an ACCEPT anyway is refused and starts nothing; credits never go below 0',()=>{
 const x=env();use(x,passTree());const s=player(x,40);
 const r=talk(x,s);assert.equal(r.offer.afford,false);assert.equal(r.offer.need,100);
 const a=ev(x,s,{type:'accept',mission:ID});assert.equal(a.need,100);assert.equal(a.offered,false);assert.equal(s.universe.missions[ID],undefined);assert.equal(s.credits,40);assert.equal(s.story.flags['mc_'+ID],undefined);
 s.credits=100;assert.equal(ev(x,s,{type:'accept',mission:ID}).offered,true);assert.equal(s.credits,0,'exactly enough leaves 0');
 const m={id:'x',cost:{amount:50}},t={credits:20,story:{flags:{}}};assert.equal(x.MC.charge(t,m),0);assert.equal(t.credits,20,'charge() never goes below 0');
});

test('DENY outcomes: again (asked again next talk; the owner\'s DENY lines), never (never again, the tree stops), start another mission (started, or offered when it asks)',()=>{
 let x=env();use(x,passTree({},{yes:'BUY PASS',no:'NO THANKS',denySay:[{who:'iris',text:'Suit yourself.'}]}));let s=player(x,500);
 let r=talk(x,s);assert.equal(r.ask.accept,'BUY PASS');assert.equal(r.ask.decline,'NO THANKS');
 let d=ev(x,s,{type:'decline',mission:ID});assert.equal(d.declined,true);assert.equal(d.deny,'again');assert.deepEqual(d.lines.map(l=>l.text),['Suit yourself.']);assert.equal(s.credits,500);
 assert.equal(s.story.flags['md_'+ID],undefined);assert.equal(talk(x,s).ask.mission,ID,'offered again');
 x=env();use(x,passTree({},{deny:'never'}));s=player(x,500);talk(x,s);ev(x,s,{type:'decline',mission:ID});assert.equal(s.story.flags['md_'+ID],'never');
 assert.equal(talk(x,s).ask,undefined,'never offered again');assert.equal(ev(x,s,{type:'accept',mission:ID}).offered,false,'and cannot be accepted');
 x=env();use(x,passTree({},{deny:'start',denyStart:'draft-other-m1'}),otherTree);s=player(x,500);talk(x,s);d=ev(x,s,{type:'decline',mission:ID});
 assert.equal(d.started,'draft-other-m1');assert.ok(s.universe.missions['draft-other-m1'].acquired);assert.ok(d.notes.includes('NEW MISSION · Plan B'));assert.equal(s.credits,500);
 // the other mission asks too: it is offered straight away instead
 x=env();const o2=JSON.parse(JSON.stringify(otherTree));o2.missions[0].start={how:'person',accept:true};use(x,passTree({},{deny:'start',denyStart:'draft-other-m1'}),o2);s=player(x,500);talk(x,s);
 d=ev(x,s,{type:'decline',mission:ID});assert.equal(d.ask.mission,'draft-other-m1');assert.deepEqual(d.lines.map(l=>l.text),['Then try this.']);assert.equal(s.universe.missions['draft-other-m1'],undefined);
});

test('ACCEPT / DENY on the device (a Messages offer): asked while its trigger holds without blocking other trees; DENY waits for the next pod exit; ACCEPT charges and files the message',()=>{
 const x=env();const t=passTree({},{how:'notification',channel:'messages',from:'iris',header:'IRIS // OFFER',text:'Want a pass? 100 CR.',when:{kind:'flag',flag:'mf_pass',value:true}});delete t.missions[0].offer;use(x,t);
 const s=player(x,300);assert.equal(ev(x,s,{type:'place',places:[]}).prompt,undefined,'trigger not met');s.story.flags.mf_pass=true;
 let r=ev(x,s,{type:'place',places:[]});assert.equal(r.prompt.ask.mission,ID);assert.equal(r.prompt.offer.cost,100);assert.deepEqual(r.prompt.lines.map(l=>l.text),['IRIS // OFFER: Want a pass? 100 CR.']);assert.equal(r.mission,null,'it does not take the event');
 ev(x,s,{type:'decline',mission:ID});assert.equal(s.story.flags['md_'+ID],'later');assert.equal(ev(x,s,{type:'place',places:[]}).prompt,undefined,'not again before the next pod exit');
 ev(x,s,{type:'pod-exit'});assert.equal(s.story.flags['md_'+ID],undefined,'the pod exit clears it');r=ev(x,s,{type:'place',places:[]});assert.equal(r.prompt.ask.mission,ID,'offered again after the pod exit');
 const a=ev(x,s,{type:'accept',mission:ID});assert.equal(a.offered,true);assert.equal(a.how,'notification');assert.equal(s.credits,200);assert.equal(a.messages[0].text,'Want a pass? 100 CR.');
 assert.equal(x.MC.inbox(s,x.e,'messages')[0].mission,ID);
});

test('a cost at a step: the step waits until the player has the credits ("need"), then charges once; refund if abandoned only when ticked',()=>{
 let x=env();use(x,passTree({cost:{amount:80,when:'go'}},{}));let s=player(x,30);talk(x,s);ev(x,s,{type:'accept',mission:ID});assert.equal(s.credits,30,'nothing at ACCEPT');
 let r=ev(x,s,{type:'place',places:['port']});assert.equal(r.need,80);assert.notEqual(s.universe.missions[ID].objectives.go,true);
 s.credits=90;r=ev(x,s,{type:'place',places:['port']});assert.equal(r.objective,'go');assert.equal(r.charged,80);assert.equal(s.credits,10);
 // refund
 x=env();use(x,passTree({cost:{amount:100,refund:true}}));s=player(x,100);talk(x,s);ev(x,s,{type:'accept',mission:ID});assert.equal(s.credits,0);
 assert.equal(x.MC.abandon(s,x.e,ID),100);assert.equal(s.credits,100);assert.equal(s.universe.missions[ID],undefined);assert.equal(x.MC.abandon(s,x.e,ID),0,'once');
 ev(x,s,{type:'accept',mission:ID});assert.equal(s.credits,0,'accepting again after a refund charges again');
 x=env();use(x,passTree());s=player(x,100);talk(x,s);ev(x,s,{type:'accept',mission:ID});assert.equal(x.MC.abandon(s,x.e,ID),0,'no refund unless ticked');assert.equal(s.credits,0);
});

test('validation (client): ranges, labels, when, refund, the question needed for a cost at ACCEPT, DENY outcomes',()=>{
 const x=env(),ok=d=>x.MC.check(d,ctx(x)).ok;
 assert.ok(ok(doc(x,passTree({},{yes:'X'.repeat(20)}))));assert.ok(ok(doc(x,passTree({},{deny:'start',denyStart:'draft-other-m1'}),otherTree)));
 const bad=[[{cost:{amount:0}}],[{cost:{amount:100001}}],[{cost:{amount:-5}}],[{cost:{amount:10,when:'nope'}}],[{cost:{amount:10,when:'go',refund:true}}],[{cost:{amount:10,extra:1}}],
  [{},{accept:false}],[{},{yes:'X'.repeat(21)}],[{},{no:'<b>no</b>'}],[{},{deny:'maybe'}],[{},{deny:'start',denyStart:ID}],[{},{denyStart:'draft-other-m1'}],[{rewards:-100}]];
 for(const [m,st] of bad)assert.equal(ok(doc(x,passTree(m,st||{}),otherTree)),false,JSON.stringify([m,st]));
 // labels without the question; a step cost needs no question
 const t=passTree({cost:{amount:10,when:'go'}});t.missions[0].start={how:'person',yes:'OK'};assert.equal(ok(doc(x,t)),false);t.missions[0].start={how:'person'};assert.equal(ok(doc(x,t)),true);
 // every start that presents an offer may ask
 for(const ch of ['messages','comms','notify'])assert.ok(ok(doc(x,passTree({offer:undefined},{how:'notification',channel:ch,from:'iris',header:'H',text:'T',when:{kind:'near',npc:'iris'}}))),ch);
});

test('drafts to content: cost and the ACCEPT / DENY settings travel (defaults left out); signed credits for the editor; Guide me asks for the question',()=>{
 const x=env(),MC=x.MC,m={id:ID,title:'T',type:'side',giver:'iris',rewards:0,start:{how:'person',accept:true,yes:' BUY ',no:'',deny:'again',denySay:[{who:'',text:' Fine. '},{who:'',text:''}]},cost:{amount:100,when:'accept',refund:true},objectives:[{id:'go',kind:'go',place:'port',label:'Go'}]};
 const r=MC.treeStrip(m);assert.deepEqual(r.start,{how:'person',accept:true,yes:'BUY',denySay:[{who:'iris',text:'Fine.'}]});assert.deepEqual(r.cost,{amount:100,refund:true});
 const n=MC.treeStrip({...m,start:{how:'notification',channel:'notify',from:'iris',text:'x',when:{kind:'pod-exit'},accept:true,deny:'never'},cost:{amount:5,when:'go'}});assert.equal(n.start.accept,true);assert.equal(n.start.deny,'never');assert.deepEqual(n.cost,{amount:5,when:'go'});
 const e={rewards:50};assert.equal(MC.signed(e),50);MC.setSigned(e,-100);assert.deepEqual(e,{rewards:0,cost:{amount:100,when:'accept'}});assert.equal(MC.signed(e),-100);MC.setSigned(e,-999999);assert.equal(e.cost.amount,100000);MC.setSigned(e,30);assert.deepEqual(e,{rewards:30});
 const g=x.e.givers;assert.ok(MC.treeNeeds({...m,start:{how:'person'}},g).some(z=>z.field==='start-ask'));assert.ok(!MC.treeNeeds(m,g).some(z=>z.field==='start-ask'));
 assert.ok(MC.treeNeeds({...m,start:{how:'person',accept:true,deny:'start'}},g).some(z=>z.field==='start-deny'));
});

test('the wizard: "Player pays" makes a cost at ACCEPT and always asks; "Ask ACCEPT / DENY" yes works for every start; problems in plain words',()=>{
 fresh();const W=require(R('void-runner/editor-wizard.js')),T=require(R('void-runner/mission-trees.js'));
 const a=W.fresh('talk');Object.assign(a,{giver:'iris',start:'person',pays:true,rewards:0,title:'Pay up'});a.steps[0].npc='iris';a.steps[0].label='Talk to Iris';
 assert.ok(W.problems(a,'reward').some(p=>/how much the player pays/.test(p)));a.rewards=100;assert.deepEqual(W.problems(a,'reward'),[]);assert.equal(W.asks(a),true);
 let d={trees:[]},{mission:m}=W.build(d,a,{T,number:70});assert.deepEqual(m.cost,{amount:100,when:'accept'});assert.equal(m.rewards,0);assert.deepEqual(m.start,{how:'person',accept:true});
 const b=W.fresh('talk');Object.assign(b,{giver:'iris',start:'messages',message:{header:'',text:'Hi'},ask:true,rewards:50,title:'Ask'});b.steps[0].npc='iris';b.steps[0].label='Talk';
 d={trees:[]};m=W.build(d,b,{T,number:71}).mission;assert.equal(m.start.how,'notification');assert.equal(m.start.accept,true);assert.equal(m.rewards,50);assert.equal(m.cost,undefined);
 const c=W.fresh('talk');Object.assign(c,{giver:'iris',start:'person',rewards:50});d={trees:[]};m=W.build(d,c,{T,number:72}).mission;assert.equal(m.start,undefined,'no question unless asked');
});

test('server parity: void_runner_live_content.py / void_runner_drafts.py know the same fields; clean_save keeps credits 0..100,000,000 and the flags',()=>{
 const py=fs.readFileSync(R('void_runner_live_content.py'),'utf8'),dr=fs.readFileSync(R('void_runner_drafts.py'),'utf8'),api=fs.readFileSync(R('void_runner_api.py'),'utf8');
 assert.match(py,/MONEY_MAX, LABEL_MAX = 100000, 20/);assert.match(py,/ASK_KEYS = \['yes', 'no', 'deny', 'denyStart', 'denySay'\]/);assert.match(py,/'waitAt', 'cost'(, 'apartments')?(, 'feeds')?(, 'combat')?\]/);assert.match(dr,/workspace_money_problems/);
 assert.match(api,/not 0 <= v <= 100_000_000/);
 const MC=require(R('void-runner/mission-content.js'));assert.equal(MC.MONEY.max,100000);assert.equal(MC.MONEY.label,20);assert.deepEqual(MC.ASK_KEYS,['yes','no','deny','denyStart','denySay']);
});
