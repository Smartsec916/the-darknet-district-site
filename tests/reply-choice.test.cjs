/* A PLAYER REPLY THAT IS A CHOICE, AND "WALK NEAR THE GIVER" AS ITS OWN WAY OF STARTING (the owner, 19 Nov 2026: "in player reply add the accept or deny option, credit
   changes if accepted. also i don't see the when the player walks closer to the giver option").
   mission-content.js CHOICE (checked, published, expanded into inline "Ask the player" steps, run: credits once, every DENY), mission-blocks.js START_MODES /
   startMode / setStartMode (the Form view, the Blocks view and the wizard share them), the Blocks <-> Form round trip, the wizard's walk-near starts. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p);
const fresh=()=>{for(const k of Object.keys(require.cache))if(k.includes('void-runner'+path.sep))delete require.cache[k];};
function env(){fresh();
 const M=require(R('void-runner/mission-log.js')),B=require(R('void-runner/beginner.js')),C=require(R('void-runner/campaign.js')),U=require(R('void-runner/universe.js')),MC=require(R('void-runner/mission-content.js')),G=require(R('void-runner/mission-givers.js'));
 B.register(M);const givers=G.roster({registry:JSON.parse(fs.readFileSync(R('tools/audio/npc-voice-registry.json'),'utf8')),people:require(R('void-runner/district-people.js')).npcs(),story:require(R('void-runner/story-content.js')).characters,temple:require(R('void-runner/temple.js')).MODEL});
 const e={B,Missions:M,U,givers};MC.snapshot(e);MC.apply(null,e);return {e,M,C,MC,G};}
const ctx=x=>({givers:new Map(x.e.givers.map(g=>[g.id,g])),places:x.G.placeIds()});
/* The owner's draft (Mission Editor shape) -> published content -> the game. */
const use=(x,...trees)=>{const c=x.MC.treesContent(trees,{givers:x.e.givers});assert.deepEqual(c.skipped,[]);const d={format:x.MC.FORMAT,version:x.MC.VERSION,trees:c.trees},chk=x.MC.check(d,ctx(x));assert.deepEqual(chk.errors,[]);x.MC.apply(d,x.e,ctx(x));return d;};
const errs=(x,...trees)=>x.MC.check({format:x.MC.FORMAT,version:x.MC.VERSION,trees},ctx(x)).errors;   // the content as sent (publishing cleans labels first; the server checks the same)
const player=(x,credits=0)=>{const s=x.C.startDistrictCampaign(x.C.fresh());s.story.flags.appearanceOffered=true;s.story.flags.podWakePending=false;s.credits=credits;return s;};
const ev=(x,s,e)=>x.MC.treeEvent(s,x.e,e,x.M,x.C);
const ID='draft-rc-m1';
function mk(choice,{where='say',extra={},text='Sure.'}={}){const say=[{who:'iris',text:'Want a job? I pay up front.'},{who:'You',text,choice},{who:'iris',text:'Then go.'}];
 const talk={id:'talk',kind:'talk',npc:'iris',label:'Talk to Iris.'},m={id:ID,number:81,title:'A reply',type:'side',giver:'iris',objectives:[talk,{id:'go',kind:'go',place:'port',label:'Go to the Port.'},{id:'last',kind:'talk',npc:'iris',label:'Back to Iris.'}],...extra};
 if(where==='say')talk.say=say;else m.offer=say;return {id:'draft-rc',name:'Reply',missions:[m]};}
const OTHER={id:'draft-other',name:'Other',missions:[{id:'draft-other-m1',number:82,title:'Plan B',type:'side',giver:'iris',objectives:[{id:'go',kind:'go',place:'port',label:'Go.'}]}]};
const NEAR={start:{how:'notification',channel:'notify',from:'iris',header:'',text:'Iris waves you over.',when:{kind:'near',npc:'iris',distance:5}}};
const reach=(x,s)=>{assert.equal(ev(x,s,{type:'talk',npcs:['iris']}).offered,true);return ev(x,s,{type:'talk',npcs:['iris']});};   // offered in person, then the talk step

test('a reply choice becomes an inline "Ask the player" step after its step: the line before is its question, the lines after follow the buttons',()=>{
 const x=env();use(x,mk({credits:100,noText:'No thanks.',yesSay:[{who:'iris',text:'Here.'}],deny:'continue'}));
 const m=x.e.trees.find(t=>t.id==='draft-rc').missions[0];assert.deepEqual(m.objectives.map(o=>o.id),['talk','talk-c1','go','last']);
 const a=m.objectives[1];assert.equal(a.kind,'ask');assert.equal(a.inline,true);assert.equal(a.question,'Want a job? I pay up front.');assert.equal(a.npc,'iris');assert.equal(a.gain,100);
 assert.deepEqual(a.say.map(l=>l.text),['Sure.','Here.','Then go.']);assert.deepEqual(a.denySay.map(l=>l.text),['No thanks.','Then go.']);
 assert.deepEqual(m.objectives[0].say.map(l=>l.text),['Want a job? I pay up front.'],'the talk step keeps the lines before the choice');
 // no choice: the mission is unchanged; two choices in one conversation: two steps in order
 const two=mk({},{});two.missions[0].objectives[0].say.push({who:'iris',text:'One more thing.'},{who:'You',text:'',choice:{credits:-20}});const y=env();use(y,two);
 const m2=y.e.trees.find(t=>t.id==='draft-rc').missions[0];assert.deepEqual(m2.objectives.map(o=>o.id),['talk','talk-c1','talk-c2','go','last']);assert.deepEqual(m2.objectives[1].say.map(l=>l.text),['Sure.','Then go.','One more thing.']);assert.equal(m2.objectives[2].price,20);
 assert.equal(y.MC.expandChoices(m2.objectives[0]),m2.objectives[0],'nothing to expand');});

test('ACCEPT gives the credits once; the conversation goes on with the lines after it',()=>{
 const x=env();use(x,mk({credits:100,yesSay:[{who:'iris',text:'Here.'}]}));const s=player(x,5);let r=reach(x,s);
 assert.deepEqual(r.lines.map(l=>l.text),['Want a job? I pay up front.']);const a=x.MC.askNow(s,x.e);assert.equal(a.length,1);assert.equal(a[0].inline,true);assert.equal(a[0].gain,100);assert.equal(a[0].mission,ID);
 r=ev(x,s,{type:'ask-yes',step:a[0].key});assert.equal(r.gained,100);assert.equal(s.credits,105);assert.ok(r.notes.includes('+100 CREDITS'));assert.deepEqual(r.lines.map(l=>[l.who,l.text]),[['You','Sure.'],['Iris','Here.'],['Iris','Then go.']]);
 assert.equal(s.universe.missions[ID].objectives['talk-c1'],true);assert.equal(x.MC.askNow(s,x.e).length,0);
 // never twice: a second answer (a reload, a double click) gives nothing more
 assert.equal(ev(x,s,{type:'ask-yes',step:a[0].key}).gained,undefined);assert.equal(s.credits,105);assert.equal(s.story.flags[x.MC.askGainFlag(ID,'talk-c1')],100);
 assert.equal(ev(x,s,{type:'place',places:['port']}).objective,'go','the mission goes on');});

test('Player pays: greyed while short, never below 0, charged once',()=>{
 const x=env();use(x,mk({credits:-40}));const s=player(x,10);reach(x,s);let a=x.MC.askNow(s,x.e)[0];assert.equal(a.price,40);assert.equal(a.afford,false);assert.equal(a.need,40);
 let r=ev(x,s,{type:'ask-yes',step:a.key});assert.equal(r.need,40);assert.equal(s.credits,10);assert.notEqual(s.universe.missions[ID].objectives['talk-c1'],true);
 s.credits=50;r=ev(x,s,{type:'ask-yes',step:a.key});assert.equal(r.charged,40);assert.equal(s.credits,10);r=ev(x,s,{type:'ask-yes',step:a.key});assert.equal(r.charged,undefined);assert.equal(s.credits,10);});

test('every DENY: end, continue, skip ahead, back to this step, start another tree; no credits on DENY',()=>{
 let x=env(),s,r,k=ID+'/talk-c1';
 use(x,mk({credits:100,noText:'No.'}));s=player(x);reach(x,s);r=ev(x,s,{type:'ask-no',step:k});assert.equal(r.ended,true);assert.equal(s.credits,0);assert.equal(s.universe.missions[ID],undefined);assert.deepEqual(r.lines.map(l=>l.text),['No.']);
 assert.equal(ev(x,s,{type:'talk',npcs:['iris']}).offered,true,'offered again');
 x=env();use(x,mk({credits:100,deny:'continue',noSay:[{who:'iris',text:'Suit yourself.'}]}));s=player(x);reach(x,s);r=ev(x,s,{type:'ask-no',step:k});assert.equal(r.deny,'continue');assert.equal(s.credits,0);
 assert.deepEqual(r.lines.map(l=>l.text),['Suit yourself.','Then go.']);assert.equal(s.universe.missions[ID].objectives['talk-c1'],true);assert.equal(ev(x,s,{type:'place',places:['port']}).objective,'go');
 x=env();use(x,mk({deny:'skip',goto:'last'}));s=player(x);reach(x,s);r=ev(x,s,{type:'ask-no',step:k});assert.deepEqual(r.skipped,['go']);assert.equal(ev(x,s,{type:'talk',npcs:['iris']}).completed,true);
 x=env();use(x,mk({deny:'back',goto:'talk'}));s=player(x);reach(x,s);r=ev(x,s,{type:'ask-no',step:k});assert.equal(r.back,'talk');assert.notEqual(s.universe.missions[ID].objectives.talk,true);
 r=ev(x,s,{type:'talk',npcs:['iris']});assert.equal(r.objective,'talk');assert.equal(x.MC.askNow(s,x.e).length,1,'asked again after the talk');
 x=env();use(x,mk({deny:'tree',denyStart:'draft-other-m1'}),OTHER);s=player(x);reach(x,s);r=ev(x,s,{type:'ask-no',step:k});assert.equal(r.started,'draft-other-m1');});

test('the offer: a choice in what she says in person, or when the player walks near (she speaks as the mission starts)',()=>{
 let x=env();use(x,mk({credits:100},{where:'offer'}));let s=player(x),r=ev(x,s,{type:'talk',npcs:['iris']});assert.equal(r.offered,true);assert.deepEqual(r.lines.map(l=>l.text),['Want a job? I pay up front.']);
 let a=x.MC.askNow(s,x.e);assert.equal(a[0].step,'offer-c1');ev(x,s,{type:'ask-yes',step:a[0].key});assert.equal(s.credits,100);
 x=env();use(x,mk({credits:100},{where:'offer',extra:NEAR}));s=player(x);r=ev(x,s,{type:'near',near:{iris:3}});assert.equal(r.offered,true);assert.deepEqual(r.lines.map(l=>l.text),['Want a job? I pay up front.'],'she speaks as the player walks near');
 a=x.MC.askNow(s,x.e);assert.equal(a.length,1);r=ev(x,s,{type:'ask-yes',step:a[0].key});assert.equal(s.credits,100);assert.deepEqual(r.lines.map(l=>l.text),['Sure.','Then go.']);
 // walked near and asking: the offer lines follow the notification's words in the ACCEPT / DENY window
 x=env();const t=mk({},{extra:{...NEAR,start:{...NEAR.start,accept:true}}});t.missions[0].offer=[{who:'iris',text:'Got a minute?'}];use(x,t);s=player(x);r=ev(x,s,{type:'near',near:{iris:3}});assert.deepEqual(r.prompt.lines.map(l=>l.text),['Iris waves you over.','Got a minute?']);});

test('checks: where a choice may be, its credits, button words and DENY targets (the same as the server); Guide me fields',()=>{
 const x=env();
 for(const c of [{credits:0},{credits:100001},{yes:'X'.repeat(21)},{deny:'maybe'},{deny:'skip'},{deny:'skip',goto:'talk'},{deny:'back',goto:'go'},{goto:'go'},{deny:'tree'},{bad:1}])assert.notDeepEqual(errs(x,mk(c),OTHER),[],JSON.stringify(c));
 assert.deepEqual(errs(x,mk({deny:'back',goto:'talk'})),[]);assert.deepEqual(errs(x,mk({},{text:''})),[],'the reply on ACCEPT may be empty');
 assert.notDeepEqual(errs(x,mk({},{where:'offer',extra:{start:{how:'person',accept:true}}})),[],'the offer asks itself');
 const vt=mk({});vt.missions[0].objectives[0].via='comms';vt.missions[0].objectives[0].say=[{who:'iris',text:'x'}];vt.missions[0].objectives[0].early=[{who:'You',text:'x',choice:{}}];assert.notDeepEqual(errs(x,vt),[],'not in “too soon” lines');
 assert.ok(errs(x,mk({deny:'back',goto:'talk'},{extra:{unlocks:[{kind:'credits',amount:5,when:'talk'}]}})).some(e=>/each time/.test(e)));
 const n=x.MC.treeNeeds(mk({deny:'skip'}).missions[0],x.e.givers,null).filter(z=>/choice/.test(z.field));assert.deepEqual(n.map(z=>[z.field,z.step]),[['line-choice-goto','talk']]);
 assert.deepEqual(x.MC.treeNeeds(mk({deny:'tree'},{where:'offer'}).missions[0],x.e.givers,null).filter(z=>/choice/.test(z.field)).map(z=>z.field),['line-choice-tree']);
 // an "Ask the player" step: gain and "just go on"
 const q={id:'draft-ask',name:'Ask',missions:[{id:'draft-ask-m1',number:83,title:'Ask',type:'side',giver:'iris',objectives:[{id:'q',kind:'ask',label:'Decide',question:'Take it?',gain:50,deny:'continue'},{id:'go',kind:'go',place:'port',label:'Go.'}]}]};
 assert.deepEqual(errs(x,q),[]);q.missions[0].objectives[0].price=5;assert.notDeepEqual(errs(x,q),[]);});

test('Blocks <-> Form: a choice is kept exactly through the timeline',()=>{
 fresh();const MB=require(R('void-runner/mission-blocks.js')),t=mk({credits:-30,yes:'PAY',noText:'No.',deny:'continue',yesSay:[{who:'iris',text:'Good.'}]}),m=t.missions[0],before=JSON.stringify(m);
 assert.equal(JSON.stringify(MB.fromBlocks(MB.toBlocks(m),JSON.parse(before))),before);assert.equal(MB.lineSets(m.objectives[0],m)[0].choice,true);
 assert.equal(MB.lineSets({kind:'talk',via:'comms'},m)[0].choice,false);});

test('How it starts: one list (walk near is its own choice), read back from the stored data; the stored shapes are the ones the editor always made',()=>{
 fresh();const MB=require(R('void-runner/mission-blocks.js'));assert.deepEqual(MB.START_MODES.map(x=>x.id),['person','person-accept','near','near-accept','messages','comms','notify']);
 const m={giver:'iris',start:{how:'person'}};assert.equal(MB.startMode(m),'person');
 MB.setStartMode(m,'near');assert.deepEqual(m.start,{how:'notification',from:'iris',header:'',text:'',channel:'notify',when:{kind:'near',npc:'iris',distance:5}});assert.equal(MB.startMode(m),'near');
 m.start.text='Hi.';m.start.when.distance=8;MB.setStartMode(m,'near-accept');assert.equal(m.start.accept,true);assert.equal(m.start.text,'Hi.');assert.equal(m.start.when.distance,8,'the distance is kept');assert.equal(MB.startMode(m),'near-accept');
 m.start.no='LATER';MB.setStartMode(m,'near');assert.equal(m.start.accept,undefined);assert.equal(m.start.no,undefined,'automatic: no ACCEPT / DENY settings left');
 MB.setStartMode(m,'notify');assert.equal(m.start.when.kind,'pod-exit');assert.equal(MB.startMode(m),'notify');
 MB.setStartMode(m,'person-accept');assert.deepEqual(m.start,{how:'person',accept:true});
 const p={giver:'iris',cost:{amount:50,when:'accept'},start:{how:'person'}};MB.setStartMode(p,'near');assert.equal(p.start.accept,true,'paying at ACCEPT always asks');assert.equal(MB.startMode(p),'near-accept');
 // a walk-near start made by the older editor (Notification only › When walked near) reads as walk near; one by Messages stays Messages
 assert.equal(MB.startMode({start:{how:'notification',channel:'notify',when:{kind:'near'}}}),'near');assert.equal(MB.startMode({start:{how:'notification',channel:'messages',when:{kind:'near'}}}),'messages');
 // the editors use it
 const ed=fs.readFileSync(R('void-runner/mission-editor.js'),'utf8'),bv=fs.readFileSync(R('void-runner/mission-blocks-view.js'),'utf8');assert.match(ed,/MBk\.setStartMode\(x,sel\.value\)/);assert.match(bv,/data-mb-start-mode/);assert.match(bv,/MB\.setStartMode\(x,sel\.value\)/);
 assert.match(ed,/'line-choice-goto':/);assert.match(ed,/VoidMissionBlocksView\.choiceFields\(/);assert.match(bv,/choiceFields\(\{t:c\.t/);});

test('the wizard: walk near (automatic) and walk near with ACCEPT / DENY, with a distance',()=>{
 fresh();const W=require(R('void-runner/editor-wizard.js')),T=require(R('void-runner/mission-trees.js'));assert.ok(W.STARTS.some(s=>s.id==='near'&&/automatically/.test(s.title)));assert.ok(W.STARTS.some(s=>s.id==='near-accept'));
 const ctx={givers:[{id:'iris',name:'Iris',canTalk:true,draft:true},{id:'remote',name:'Remote NPC',canTalk:false,draft:false}]};
 for(const [start,ask] of [['near',false],['near-accept',true]]){const a=W.fresh('talk');Object.assign(a,{giver:'iris',start,title:'T',distance:9,message:{header:'',text:'Hi.'}});for(const st of a.steps){st.npc='iris';st.label='x';}
  assert.deepEqual(W.problems(a,'start',ctx),[]);const {mission:m}=W.build({trees:[]},a,{T,number:60});assert.equal(m.start.when.kind,'near');assert.equal(m.start.when.distance,9);assert.equal(m.start.accept===true,ask);
  assert.match(W.problems({...a,giver:'remote'},'start',ctx).join(' '),/real walking-game interaction/);assert.deepEqual(W.problems({...a,giver:'remote',start:'messages'},'start',ctx),[]);}
 const a=W.fresh('talk');Object.assign(a,{giver:'iris',start:'near-accept',message:{header:'',text:''}});assert.equal(W.problems(a,'start',ctx).length,1,'the banner words');});
