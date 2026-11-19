/* The Mission Editor's Blocks view (the owner, 19 Nov 2026: "in blocks … color coded based on who and what type") and ACCEPT / DENY anywhere in a mission.
   mission-blocks.js maps the editor's draft mission to a timeline and back with NO second format: form -> blocks -> form leaves every mission identical (the shipped
   storyline, the wizard's missions, fixtures with every kind of step, rewards at steps, apartments, costs and asks). Positions carry meaning (a reward under a step is given at
   that step). mission-content.js: the step kind 'ask' (checked, stripped for the game, required fields for Guide me) and its runtime (askNow, ask-yes / ask-no: the price
   once, DENY ends / skips / goes back / starts another tree). Load order and hooks. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p);
const fresh=()=>{for(const k of Object.keys(require.cache))if(k.includes('void-runner'+path.sep))delete require.cache[k];};
const MB=()=>require(R('void-runner/mission-blocks.js'));
const same=(a,b,w)=>assert.equal(JSON.stringify(a),JSON.stringify(b),w);
function env(){fresh();
 const M=require(R('void-runner/mission-log.js')),B=require(R('void-runner/beginner.js')),C=require(R('void-runner/campaign.js')),U=require(R('void-runner/universe.js')),MC=require(R('void-runner/mission-content.js')),G=require(R('void-runner/mission-givers.js'));
 B.register(M);const givers=G.roster({registry:JSON.parse(fs.readFileSync(R('tools/audio/npc-voice-registry.json'),'utf8')),people:require(R('void-runner/district-people.js')).npcs(),story:require(R('void-runner/story-content.js')).characters,temple:require(R('void-runner/temple.js')).MODEL});
 const e={B,Missions:M,U,givers};MC.snapshot(e);MC.apply(null,e);return {e,M,C,MC,G};}
const ctx=x=>({givers:new Map(x.e.givers.map(g=>[g.id,g])),places:x.G.placeIds()});
const doc=(x,...trees)=>({format:x.MC.FORMAT,version:x.MC.VERSION,trees});
const use=(x,...trees)=>{const d=doc(x,...trees),c=x.MC.check(d,ctx(x));assert.deepEqual(c.errors,[]);x.MC.apply(d,x.e,ctx(x));};
const player=(x,credits=0)=>{const s=x.C.startDistrictCampaign(x.C.fresh());s.story.flags.appearanceOffered=true;s.story.flags.podWakePending=false;s.credits=credits;return s;};
const ev=(x,s,e)=>x.MC.treeEvent(s,x.e,e,x.M,x.C);
/* A fixture with every kind of step and every place a block can sit. */
function rich(){return {id:'draft-all-m1',number:90,title:'Everything',type:'side',giver:'iris',description:'All of it.',rewards:100,seq:9,
 offer:[{who:'',text:'Offer.'},{who:'You',text:'Me?'}],start:{how:'person',accept:true,yes:'OK',deny:'never',denySay:[{who:'',text:'Fine.'}]},
 apartments:[{id:'a1',style:'normal',door:'',from:'s2'},{id:'a2',style:'luxury',door:''}],
 objectives:[{id:'s1',label:'Talk',kind:'talk',npc:'iris',place:'',item:'',say:[{who:'',text:'Hi.',anim:'shrug',wait:2},{who:'You',text:'Hey.'},{who:'admin',text:'Hello both.'}],early:[{who:'',text:'Too soon.'}]},
  {id:'s2',label:'Go',kind:'go',place:'port',say:[],delay:5},{id:'s3',label:'',kind:'anim',npc:'iris',clip:'look',hold:2},{id:'s4',label:'',kind:'wait',hold:30,near:5,npc:'iris'},
  {id:'s5',label:'Decide',kind:'ask',npc:'',question:'Go on?',yes:'YES',deny:'skip',goto:'s7',price:20,say:[{who:'',text:'Good.'}],denySay:[{who:'You',text:'No.'}]},
  {id:'s6',label:'Photo',kind:'photo',npc:'juno-vex',subjects:['juno-vex','halden-reyes'],say:[]},{id:'s7',label:'Send',kind:'send-photo',npc:'iris',subject:'juno-vex',say:[],wrong:[{who:'',text:'Wrong.'}],via:'messages'},
  {id:'s8',label:'Fight',kind:'fight',npc:'iris',strange:{keep:true}},{id:'s9',label:'Hack',kind:'hack',ap:'a1/hall',hold:5,stay:false}],
 ending:{npc:'admin',place:'',label:'',say:[{who:'',text:'Done.'}]},choices:[{id:'choice-1',label:'later',next:''}],cost:{amount:50,when:'s2'},
 unlocks:[{kind:'credits',amount:10},{kind:'flag',id:'x',value:true,when:'s1'},{kind:'credits',amount:5,when:'gone-step'},{kind:'contact',id:'iris',when:'s9'},{kind:'credits',amount:1,when:'complete'}]};}

test('form -> blocks -> form leaves every mission identical (shipped storyline, new drafts, the wizard, a fixture with everything)',()=>{const B=MB(),list=[];
 for(const t of require(R('void-runner/main-story.js')).trees())list.push(...t.missions);
 const T=require(R('void-runner/mission-trees.js')),tr={id:'draft-x',missions:[]};list.push(T.addMission(tr,{giver:'iris'}),rich(),{id:'bare',objectives:[{id:'a',kind:'go'}]},{id:'empty-unlocks',objectives:[{id:'a',kind:'go'}],unlocks:[],apartments:[]});
 const W=require(R('void-runner/editor-wizard.js'));for(const tp of W.TEMPLATES){const a=W.fresh(tp.id);a.giver='iris';a.title='T '+tp.id;for(const s of a.steps){s.npc='iris';s.place='port';s.label='x';}const d={trees:[]};const r=W.build(d,a,{T,number:50});list.push(r.mission);}
 for(const m of list){const before=JSON.stringify(m),y=B.fromBlocks(B.toBlocks(m),m);same(y,m,m.id);assert.equal(JSON.stringify(m),before,'the mission itself is not changed: '+m.id);}
 assert.ok(list.length>=10);});

test('the timeline: START, steps in order, apartments and rewards where they happen, END, rewards when done; a step the view cannot show is kept',()=>{const B=MB(),m=rich(),bl=B.toBlocks(m).blocks.map(b=>b.bid);
 assert.deepEqual(bl,['start','apt:a2','step:s1','unlock:1','step:s2','apt:a1','step:s3','step:s4','step:s5','step:s6','step:s7','step:s8','step:s9','unlock:3','end','unlock:0','unlock:2','unlock:4']);
 assert.equal(B.typeOf(m.objectives[7]),'other','a fight step: Form view only');assert.equal(B.typeOf(m.objectives[4]),'ask');assert.equal(B.typeOf(m.objectives[3]),'time');assert.equal(B.typeOf(m.objectives[1]),'action');
 assert.equal(B.stepWho(m.objectives[1],m),'You','the player goes');assert.equal(B.stepWho(m.objectives[2],m),'iris');assert.equal(B.stepWho(m.objectives[4],m),'iris','the giver asks by default');
 const p=B.problems(m,[]);assert.ok(p.get('unlock:2'),'a reward at a step that is gone is flagged, not dropped');});

test('moving, adding, copying and deleting blocks: rewards follow their position, the order rules hold',()=>{const B=MB(),m=rich();
 // the flag given at s1 dragged below s2: now given at s2
 assert.equal(B.move(m,'unlock:1',B.toBlocks(m).blocks.findIndex(b=>b.bid==='step:s2')+1),'');assert.equal(m.unlocks[1].when,'s2');
 // below END: when the mission is done
 assert.equal(B.move(m,'unlock:1',B.toBlocks(m).blocks.length),'');assert.equal(m.unlocks[1].when,undefined);
 // above every step: refused with the reason
 assert.match(B.move(m,'unlock:1',1),/below a step/);assert.match(B.move(m,'step:s1',B.toBlocks(m).blocks.length),/above the END/);assert.match(B.move(m,'start',3),/do not move/);
 // a step moved: its cost and delay go with it, the reward under its old place stays there
 const r0=rich();assert.equal(B.move(r0,'step:s2',1),'');assert.deepEqual(r0.objectives.map(o=>o.id).slice(0,2),['s2','s1']);assert.equal(r0.cost.when,'s2');assert.equal(r0.unlocks[1].when,'s1');assert.equal(r0.apartments[0].from,'s1','the apartment stays where it was: now under s1');
 // add a reward at a gap: given at the step above
 const r1=rich(),at=B.toBlocks(r1).blocks.findIndex(b=>b.bid==='step:s3');const ins=B.insert(r1,at,{unlock:{kind:'credits',amount:7}});assert.ok(ins.ok);assert.deepEqual(r1.unlocks[r1.unlocks.length-1],{kind:'credits',amount:7,when:'s2'});
 // add a step: a fresh id, in place
 const st=B.stepFor('wait'),r2=rich();const i2=B.insert(r2,2,{step:st});assert.ok(i2.ok);assert.equal(r2.objectives[0].kind,'wait');assert.ok(!['s1','s2'].includes(r2.objectives[0].id));
 // copy: a new id right below; delete; the last step cannot go
 const r3=rich(),cp=B.duplicate(r3,'step:s1');assert.ok(cp.ok);assert.equal(r3.objectives[1].kind,'talk');assert.notEqual(r3.objectives[1].id,'s1');same(r3.objectives[1].say,r3.objectives[0].say);
 assert.equal(B.remove(r3,cp.bid),'');same(r3.objectives,rich().objectives);assert.match(B.remove({id:'x',objectives:[{id:'a',kind:'go'}]},'step:a'),/at least one step/);
 assert.match(B.duplicate(r3,'apt:a1').why,/own street door/);
 // ↑ ↓ skip a place a reward may not take
 const r4={id:'m',objectives:[{id:'a',kind:'go'},{id:'b',kind:'go'}],unlocks:[{kind:'credits',amount:1,when:'a'}]};assert.match(B.nudge(r4,'unlock:0',-1),/as high/);assert.equal(B.nudge(r4,'unlock:0',1),'');assert.equal(r4.unlocks[0].when,'b');});

test('colours: the player is blue, NPCs stable and distinct within a mission (none of them the player blue); lines grouped by who says them',()=>{const B=MB();
 assert.equal(B.whoColor('You'),B.PLAYER);assert.equal(B.whoColor('iris'),B.whoColor('iris'));assert.ok(!B.PALETTE.includes(B.PLAYER));
 const ids=['You','iris','admin','ethereal-lace','grey-reverie','street-cat','juno-vex','halden-reyes','zen-zephyr'],c=B.castColors(ids);assert.equal(c.get('You'),B.PLAYER);
 const npc=ids.slice(1).map(i=>c.get(i));assert.equal(new Set(npc).size,npc.length,'distinct while the palette lasts');
 for(const t of Object.values(B.TYPES))assert.ok(t.icon&&t.name,'every type has an icon and a word, not only a colour');
 const g=B.lineGroups([{who:'',text:'a'},{who:'',text:'b'},{who:'You',text:'c'},{who:'admin',text:'d'},{who:'',text:'e'}],'iris');
 assert.deepEqual(g.map(x=>[x.who,x.lines.map(l=>l.k)]),[['iris',[0,1]],['You',[2]],['admin',[3]],['iris',[4]]]);
 assert.deepEqual(B.cast(rich()).slice(0,3),['iris','You','admin']);
 assert.equal(B.autoLabel({kind:'talk',npc:'ethereal-lace'},{name:()=>'Lace'}),'Talk to Lace');assert.equal(B.stepFor('ask').label,'Decide');});

test('the ask step: checked like the server, stripped for the game, Guide me fields',()=>{const x=env(),MC=x.MC;
 const tr=(q,extra={})=>({id:'draft-ask',name:'Ask',missions:[{id:'draft-ask-m1',number:71,title:'A question',type:'side',giver:'iris',objectives:[{id:'talk',kind:'talk',npc:'iris',label:'Talk.'},{id:'q',kind:'ask',label:'Decide',question:'Go?',...q},{id:'go',kind:'go',place:'port',label:'Go.'}],...extra}]});
 const other={id:'draft-other',name:'Other',missions:[{id:'draft-other-m1',number:72,title:'B',type:'side',giver:'iris',objectives:[{id:'go',kind:'go',place:'port',label:'Go.'}]}]};
 const errs=(q,extra)=>MC.check(doc(x,tr(q,extra),other),ctx(x)).errors;
 assert.deepEqual(errs({}),[]);assert.deepEqual(errs({deny:'skip',goto:'go',price:5,yes:'YES',no:'NO',say:[{who:'iris',text:'Ok.'}],denySay:[{who:'You',text:'No.'}]}),[]);assert.deepEqual(errs({deny:'back',goto:'talk'}),[]);assert.deepEqual(errs({deny:'tree',denyStart:'draft-other-m1'}),[]);
 for(const q of [{question:''},{deny:'skip',goto:'talk'},{deny:'back',goto:'go'},{deny:'tree'},{goto:'go'},{price:0},{price:100001},{yes:'X'.repeat(21)},{deny:'maybe'},{via:'comms'},{question:'[Whispers] hi'}])assert.ok(errs(q).length,JSON.stringify(q));
 assert.ok(errs({deny:'back',goto:'talk'},{unlocks:[{kind:'credits',amount:5,when:'talk'}]}).some(e=>/each time/.test(e)),'going back would pay twice');
 const t2=tr({});t2.missions[0].objectives[2].question='Why?';assert.ok(MC.check(doc(x,t2),ctx(x)).errors.some(e=>/only an “Ask the player”/.test(e)));
 // the editor's draft -> the game's content
 const st=MC.treeStrip({id:'m',title:'T',giver:'iris',objectives:[{id:'q',kind:'ask',label:'',npc:'',question:' Go? ',yes:'',no:'NOPE',deny:'skip',goto:'z',denyStart:'x',price:7,say:[{who:'',text:'Ok'}],denySay:[{who:'',text:''}],early:[{who:'',text:'x'}]}]}).objectives[0];
 assert.deepEqual(st,{id:'q',label:'Decide',kind:'ask',question:'Go?',no:'NOPE',deny:'skip',goto:'z',price:7,say:[{who:'iris',text:'Ok'}]});
 const needs=MC.treeNeeds({title:'T',giver:'iris',objectives:[{id:'a',kind:'ask',question:'',deny:'skip'},{id:'b',kind:'ask',question:'Q',deny:'tree'}]},x.e.givers,null);
 assert.deepEqual(needs.filter(n=>n.step).map(n=>n.field),['step-question','step-goto','step-deny-start']);});

test('the ask at runtime: the mission waits; ACCEPT charges the price once and goes on; DENY ends, skips ahead, goes back or starts another tree',()=>{
 const x=env(),mk=(q,extra={})=>({id:'draft-ask',name:'Ask',missions:[{id:'draft-ask-m1',number:71,title:'A question',type:'side',giver:'iris',rewards:10,objectives:[{id:'talk',kind:'talk',npc:'iris',label:'Talk.'},{id:'q',kind:'ask',label:'Decide',question:'Go?',...q},{id:'mid',kind:'talk',npc:'admin',label:'Admin.'},{id:'last',kind:'talk',npc:'iris',label:'Iris again.'}],...extra}]});
 const other={id:'draft-other',name:'Other',missions:[{id:'draft-other-m1',number:72,title:'Plan B',type:'side',giver:'iris',objectives:[{id:'go',kind:'go',place:'port',label:'Go.'}]}]};
 const ID='draft-ask-m1',K=ID+'/q',to=(s)=>{ev(x,s,{type:'talk',npcs:['iris']});ev(x,s,{type:'talk',npcs:['iris']});};   // offered, then the talk step
 // ACCEPT with a price
 use(x,mk({price:30,yes:'I WILL',say:[{who:'iris',text:'Good.'}]}),other);let s=player(x,20);to(s);
 let a=x.MC.askNow(s,x.e);assert.equal(a.length,1);assert.deepEqual({key:a[0].key,yes:a[0].ask.accept,no:a[0].ask.decline,price:a[0].price,afford:a[0].afford,need:a[0].need,q:a[0].lines[0].text},{key:K,yes:'I WILL',no:'DENY',price:30,afford:false,need:30,q:'Go?'});
 assert.equal(ev(x,s,{type:'talk',npcs:['admin']}).objective,null,'the mission waits at the question');
 let r=ev(x,s,{type:'ask-yes',step:K});assert.equal(r.need,30);assert.equal(s.credits,20);assert.notEqual(s.universe.missions[ID].objectives.q,true,'too few credits: nothing happens');
 s.credits=100;r=ev(x,s,{type:'ask-yes',step:K});assert.equal(r.charged,30);assert.equal(s.credits,70);assert.equal(s.universe.missions[ID].objectives.q,true);assert.deepEqual(r.lines.map(l=>l.text),['Good.']);
 assert.equal(x.MC.askNow(s,x.e).length,0);assert.equal(ev(x,s,{type:'ask-yes',step:K}).charged,undefined,'charged once');assert.equal(s.story.flags[x.MC.askPriceFlag(ID,'q')],30);
 // DENY: end (the mission goes back to its giver)
 use(x,mk({denySay:[{who:'You',text:'No way.'}]}),other);s=player(x);to(s);r=ev(x,s,{type:'ask-no',step:K});assert.equal(r.ended,true);assert.equal(r.deny,'end');assert.equal(s.universe.missions[ID],undefined);assert.deepEqual(r.lines.map(l=>[l.who,l.text]),[['You','No way.']]);
 assert.equal(ev(x,s,{type:'talk',npcs:['iris']}).offered,true,'offered again');
 // DENY: skip ahead (the steps between give nothing)
 use(x,mk({deny:'skip',goto:'last'},{unlocks:[{kind:'credits',amount:99,when:'mid'}]}),other);s=player(x);to(s);r=ev(x,s,{type:'ask-no',step:K});assert.deepEqual(r.skipped,['mid']);
 assert.equal(s.universe.missions[ID].objectives.mid,true);assert.equal(s.credits,0,'a skipped step gives nothing');r=ev(x,s,{type:'talk',npcs:['iris']});assert.equal(r.objective,'last');assert.equal(r.completed,true);
 // DENY: back (the talk step is to be done again, then the question again)
 use(x,mk({deny:'back',goto:'talk'}),other);s=player(x);to(s);r=ev(x,s,{type:'ask-no',step:K});assert.equal(r.back,'talk');assert.notEqual(s.universe.missions[ID].objectives.talk,true);
 assert.equal(x.MC.askNow(s,x.e).length,0);ev(x,s,{type:'talk',npcs:['iris']});assert.equal(x.MC.askNow(s,x.e).length,1,'asked again after the talk');
 // DENY: start another tree
 use(x,mk({deny:'tree',denyStart:'draft-other-m1'}),other);s=player(x);to(s);r=ev(x,s,{type:'ask-no',step:K});assert.equal(r.ended,true);assert.equal(r.started,'draft-other-m1');assert.ok(s.universe.missions['draft-other-m1'].acquired);
 // a delay before the question holds it
 use(x,mk({delay:5}),other);s=player(x);to(s);assert.equal(x.MC.askNow(s,x.e).length,0,'not while its delay runs');});

test('load order, hooks and the page: the blocks scripts load before the Mission Editor; the stylesheet is on the page; the wizard opens Blocks',()=>{
 const dt=fs.readFileSync(R('void-runner/dev-tools.js'),'utf8'),ed=fs.readFileSync(R('void-runner/mission-editor.js'),'utf8'),home=fs.readFileSync(R('void-runner/editor-home.js'),'utf8'),html=fs.readFileSync(R('void-runner.html'),'utf8');
 const i=f=>dt.indexOf("'void-runner/"+f+"'");assert.ok(i('mission-blocks.js')>0&&i('mission-blocks.js')<i('mission-blocks-view.js')&&i('mission-blocks-view.js')<i('mission-editor.js'));
 assert.match(html,/href="void-runner\/mission-blocks\.css"/);assert.equal(html,fs.readFileSync(R('static/void-runner.html'),'utf8'));
 assert.match(ed,/MBV\.view\(\{t,raw,m,ed,issues,kit:blocksKit\}\)/);assert.match(ed,/'step-question':/);assert.match(ed,/askFields\(/);assert.match(home,/openBlocks\(r\.mission\)/);
 const v=fs.readFileSync(R('void-runner/mission-blocks-view.js'),'utf8');assert.doesNotMatch(v,/<header|'header'/,'no <header> (the front page hides every header)');
 assert.ok(require(R('void-runner/mission-content.js')).STEP_KINDS.includes('ask'));assert.ok(require(R('void-runner/mission-givers.js')).STEP_KINDS.some(k=>k.id==='ask'&&k.supported));});
