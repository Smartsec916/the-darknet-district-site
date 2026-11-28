const test=require('node:test');
const assert=require('node:assert/strict');
const engine=require('../void-runner/chance-encounter.js');
const seed=require('../void-runner/chance-encounter-seed.json');
const crossing=require('../void-runner/chance-crossing.js');

test('sound validation names an imported cue with a volume above full',()=>{
 const cue={src:'imported:'+'a'.repeat(64),name:'taxi.mp3',when:'start',offset:1,volume:2,loop:true,stop:'scope'};
 assert.deepEqual(engine.soundProblems({soundCues:[cue]}),['Sound effect 1 (taxi.mp3). Set Volume to 0–1 (1 is full volume).']);
 cue.volume=1;
 assert.deepEqual(engine.soundProblems({soundCues:[cue]}),[]);
});

test('a section preview validates its action and branch cues without blocking on other sections',()=>{
 const cue={src:'imported:'+'a'.repeat(64),name:'effect.mp3',when:'start',offset:1,volume:1,loop:true,stop:'scope'};
 const child={id:'branch_child',soundCues:[{...cue,volume:2}]};
 const branch={actions:[child.id],chance:10};
 const arrival={id:'arrival',soundCues:[cue],branches:[branch]};
 const graph={soundCues:[{...cue,src:''}],sectionSounds:{free:[{...cue,volume:2}]},dialogue:[arrival,child]};
 const byId=new Map(graph.dialogue.map(row=>[row.id,row]));
 assert.match(engine.previewSoundProblems(graph,'opening',[arrival],byId)[0],/Set Volume/);
 child.soundCues[0].volume=1;
 assert.deepEqual(engine.previewSoundProblems(graph,'opening',[arrival],byId),[]);
 assert.equal(engine.soundProblems(graph).length,2);
});

test('encounter captions and their timing leave out delivery tags',()=>{
 const text='[whispers] Keep the lights low while we wait here [pause], and listen. [sighs]';
 const spoken='Keep the lights low while we wait here, and listen.';
 assert.equal(engine.spokenText(text),spoken);
 assert.equal(engine.lineSeconds({text}).seconds,engine.lineSeconds({text:spoken}).seconds);
 assert.equal(engine.lineSeconds({text,recording:{duration:4}}).seconds,4);
 assert.equal(engine.spokenText('Check panel [2].'),'Check panel [2].');
 assert.equal(engine.spokenText('[sighs]'),'');
});

test('a delayed taxi must travel through the crossing before the card drops',()=>{
 const taxi={s:96,pathLen:100},plan={start:96,distance:8,taxi};
 assert.equal(crossing.crossingProgress(plan),0);
 taxi.s=0;assert.equal(crossing.crossingProgress(plan),.5);
 taxi.s=5;assert.equal(crossing.crossingProgress(plan),1);
});

test('the tire squeal starts just before impact at the current taxi speed',()=>{
 const plan={distance:20,taxi:{speed:10}};
 assert.equal(crossing.tireSquealDue(plan,.8),false);
 assert.equal(crossing.tireSquealDue(plan,.9),true);
 assert.equal(crossing.tireSquealDue(plan,1),false);
 plan.taxi.speed=3;
 assert.equal(crossing.tireSquealDue(plan,.9),false);
});

test('all apartment choices are reachable after the crossing and drop',()=>{
 for(const [label,end] of [['Free Lace','rescued'],['Be Kade Mercer','cancel'],['Leave','leave']]){
  const run=engine.createRun(seed);
  for(const id of ['crossing','approach','stumble','drop','flat']){
   assert.equal(run.node.id,id);run.step();
  }
  assert.equal(run.node.id,'lace');
  assert.throws(()=>run.step('unavailable'));
  run.step(label);
  if(run.node.kind!=='end')run.step();
  assert.equal(run.node.id,end);
  assert.equal(run.step(),null);
 }
 assert.equal(seed.dialogue.length,8);
 assert.ok(seed.dialogue.every(line=>line.text===''));
});

test('private runs can start from a node and cancel independently',()=>{
 const first=engine.createRun(seed,'drop'),second=engine.createRun(seed);
 first.stop();assert.equal(first.step(),null);
 assert.equal(second.node.id,'crossing');
 assert.throws(()=>engine.createRun(seed,'missing'));
});

test('dangling links, accidental cycles and duplicate choice labels block publication',()=>{
 for(const breakGraph of [
  g=>{g.nodes[0].edges[0].to='missing';},
  g=>{g.nodes[4].edges[0].to='approach';},
  g=>{g.nodes[5].edges[1].label='Free Lace';}
 ]){
  const draft=structuredClone(seed);breakGraph(draft);assert.ok(engine.validate(draft).length);
 }
});

test('existing Dropped Cardkey graphs gain one editable waiting line and can keep it silent',()=>{
 const graph=engine.withWaitingDialogue(seed);
 const line=graph.dialogue.find(row=>row.id==='lace_wait_01');
 assert.equal(line.delay,12);
 assert.equal(line.speaker,'lace');
 assert.ok(line.text);
 assert.equal(seed.dialogue.some(row=>row.id===line.id),false);
 line.text='';
 assert.equal(engine.withWaitingDialogue(graph),graph);
 const other={...seed,id:'another-encounter'};
 assert.equal(engine.withWaitingDialogue(other),other);
});

test('playlist bounds, branch odds, nested passes and return paths',()=>{
 const graph=structuredClone(seed);
 const rows=graph.dialogue.slice(0,3);
 for(const row of rows){row.text=row.id;row.repeatSpeech=true;}
 rows[1].playlistStart=true;rows[2].playlistEnd=true;
 const {before,cycle,after}=engine.playlist(rows);
 assert.deepEqual(before,[rows[0]]);assert.deepEqual(cycle,rows.slice(1));assert.deepEqual(after,[]);
 const action=id=>({id,text:id,speaker:'lace'});
 graph.dialogue.push(action('branch_first'),action('branch_second'),action('branch_nested'));
 rows[1].branches=[{chance:25,actions:['branch_first'],passes:2},{chance:50,actions:['branch_second']}];
 graph.dialogue.at(-3).branches=[{chance:100,actions:['branch_nested'],passes:0}];
 assert.deepEqual(engine.validate(graph),[]);
 assert.equal(engine.chooseBranch(rows[1],0).actions[0],'branch_first');
 assert.equal(engine.chooseBranch(rows[1],.25).actions[0],'branch_second');
 assert.equal(engine.chooseBranch(rows[1],.75),null);
 graph.dialogue.at(-1).branches=[{chance:100,actions:['branch_first']}];
 assert.ok(engine.validate(graph).length);
});

test('explicit playlists reroll in place, play each branch in full, and take later branches independently',async()=>{
 const row=(id,extra={})=>({id,text:id,...extra});
 const a=row('a',{mainPlaylist:'main_1',mainPasses:2});
 const b=row('b',{mainPlaylist:'main_1',mainPasses:2,branches:[{chance:50,completion:'reroll',actions:['x','y']}]});
 const c=row('c',{mainPlaylist:'main_1',mainPasses:2,branches:[{chance:0,completion:'reroll',actions:['x']},{chance:100,completion:'next',actions:['z']}]});
 const extra=row('extra'),x=row('x'),y=row('y'),z=row('z');
 const sequence=[],rolls=[.1,.49,.5,.999,.9,.1],events=[];
 await engine.runPlaylist([a,extra,b,c],new Map([x,y,z].map(row=>[row.id,row])),{
  signal:new AbortController().signal,random:()=>rolls.shift(),pause:async()=>{},
  play:async row=>sequence.push(row.id),observe:event=>events.push(event)
 });
 assert.deepEqual(sequence,['a','b','x','y','x','y','c','z','a','b','c','z','extra']);
 assert.equal(events.filter(event=>event.mode==='reroll').length,2);
 assert.deepEqual(events.filter(event=>event.type==='roll').map(event=>event.branch?.chance),[50,50,undefined,100,undefined,100]);
});

test('explicit branch completion can replay, continue, restart, or jump to a selected action',async()=>{
 for(const [mode,expected] of [
  ['replay',['a','b','c','x','c','d']],
  ['next',['a','b','c','x','d']],
  ['start',['a','b','c','x','a','b','c','d']],
  ['action',['a','b','c','x','b','c','d']]
 ]){
  const x={id:'x'},log=[],returns=[],rolls=[0,.9];
  const rows=['a','b','c','d'].map(id=>({id,mainPlaylist:'main_1',mainPasses:1}));
  rows[2].branches=[{chance:50,completion:mode,returnAction:'b',actions:['x']}];
  await engine.runPlaylist(rows,new Map([['x',x]]),{
   signal:new AbortController().signal,random:()=>rolls.shift(),pause:async()=>{},
   play:async row=>log.push(row.id),observe:event=>{if(event.type==='return')returns.push(event.target?.id);}
  });
  assert.deepEqual(log,expected,mode);
  assert.deepEqual(returns,[expected[4]],mode);
 }
});

test('100 percent rerolls yield to a browser task and cancel without overlapping actions',async()=>{
 const controller=new AbortController(),sequence=[];
 const c={id:'a',mainPlaylist:'main_1',mainPasses:1,branches:[{chance:100,completion:'reroll',actions:['x','y']}]};
 const byId=new Map(['x','y'].map(id=>[id,{id}]));
 let playing=false;
 const running=engine.runPlaylist([c],byId,{
  signal:controller.signal,random:()=>.999,
  play:async row=>{
   assert.equal(playing,false);playing=true;sequence.push(row.id);
   await Promise.resolve();playing=false;
  },
  pause:()=>new Promise(resolve=>setImmediate(resolve))
 });
 setImmediate(()=>controller.abort());
 await assert.rejects(running,{name:'AbortError'});
 assert.deepEqual(sequence,['a','x','y']);
});

test('finished bounded and nested branches restart the active main cycle and release their controls',async()=>{
 const source=require('node:fs').readFileSync(require.resolve('../void-runner/chance-encounter-game.js'),'utf8');
 for(const nested of [false,true]){
  const log=[],buttons=new Set(),controller=new AbortController();
  const document={body:{append:button=>buttons.add(button)},createElement:()=>({style:{},remove(){buttons.delete(this);}}),
   addEventListener(){},removeEventListener(){}};
  const context={VoidChanceEncounter:engine,AbortController,document,addEventListener(){},setInterval(){},
   setTimeout:fn=>setImmediate(fn),clearTimeout:clearImmediate};
  require('node:vm').runInNewContext(source.replace('root.VoidEncounterGame={','root.VoidEncounterGame={lines,'),context);
  const row=(id,text,extra={})=>({id,text,speaker:'lace',...extra});
  const mainBranch={chance:100,passes:2,actions:['branch_skip','branch_b','branch_c','branch_out'],startAction:'branch_b',endAction:'branch_c'};
  const dialogue=[
   row('lace_free_00','intro'),row('lace_free_01','first',{repeatSpeech:true}),
   row('lace_free_02','roll',{repeatSpeech:true,branches:[mainBranch]}),row('lace_free_03','last',{repeatSpeech:true}),
   row('branch_skip','excluded'),row('branch_b','B'),row('branch_c','C'),row('branch_out','excluded')
  ];
  if(nested){
   dialogue[6].branches=[{chance:100,passes:2,actions:['branch_inner'],startAction:'branch_inner',endAction:'branch_inner'}];
   dialogue.push(row('branch_inner','inner'));
  }
  const done=context.VoidEncounterGame.lines({graph:{dialogue},signal:controller.signal},'free',null,controller.signal,line=>{
   const text=line.split(' ').at(-1);log.push(text);
   if(log.length>20||text==='first'&&log.length>2)controller.abort();
  });
  await assert.rejects(done,{name:'AbortError'});
  assert.deepEqual(log,nested?['intro','first','roll','B','C','inner','inner','first']:['intro','first','roll','B','C','B','C','first']);
  assert.equal(buttons.size,0);
 }
});

test('timeline animation playback uses the speed of each action', async () => {
 const source=require('node:fs').readFileSync(require.resolve('../void-runner/chance-encounter-game.js'),'utf8');
 const context={VoidChanceEncounter:engine,performance,addEventListener(){},setInterval(){}};
 require('node:vm').runInNewContext(source.replace('root.VoidEncounterGame={','root.VoidEncounterGame={lines,'),context);
 const speeds=[];
 const clip={name:'lace-gesture',start(loop,speed){speeds.push(speed);}};
 const dialogue=[2,0.5,undefined].map((animationSpeed,i)=>({
  id:'lace_free_'+i,text:'',animation:'gesture',animationSpeed
 }));
 const signal=new AbortController().signal;
 await context.VoidEncounterGame.lines({graph:{dialogue},signal,lace:{made:{metadata:{animationGroups:[clip]}}}},'free',null,signal,()=>{});
 assert.deepEqual(speeds,[2,0.5,1]);
});

test('timing counts delays, concurrent speech and animation, and repeat gaps',()=>{
 const a={id:'a',text:'Talk',recording:{duration:2},animation:'walk',animationSeconds:8,animationSpeed:2,delay:1};
 const part={before:[],cycle:[a],after:[]};
 assert.deepEqual(engine.lineSeconds(a),{seconds:5,unknown:false,variable:false});
 assert.equal(engine.timing(part,2).seconds,10.25);
 assert.equal(engine.timing(part,0).loop,true);
 assert.equal(engine.timing(part,0,undefined,false,60).variable,true);
 assert.equal(engine.timing(part,0,undefined,false,100).loop,false);
});

test('sound cues overlap and stop on their scope, encounter, or timer',()=>{
 let time=0,next=0;
 const jobs=new Map(),voices=[];
 const timers={setTimeout(fn,delay){jobs.set(++next,{at:time+delay,fn});return next;},clearTimeout(id){jobs.delete(id);}};
 const timeline=engine.soundTimeline(cue=>{
  const voice={type:cue.stop,ended:false,dispose(){this.ended=true;}};
  voices.push(voice);return voice;
 },timers);
 const advance=ms=>{
  const until=time+ms;
  for(;;){
   const due=[...jobs.entries()].filter(([,job])=>job.at<=until).sort((a,b)=>a[1].at-b[1].at)[0];
   if(!due)break;
   jobs.delete(due[0]);time=due[1].at;due[1].fn();
  }
  time=until;
 };
 const cue=(changes={})=>({src:'assets/audio/ambience/door-lock.ogg',when:'start',offset:0,volume:1,loop:true,...changes});
 const end=timeline.open([cue({stop:'scope'}),cue({stop:'encounter'}),cue({stop:'seconds',seconds:2,offset:.5}),cue({when:'end',loop:false})]);
 advance(500);
 assert.equal(voices.filter(v=>!v.ended).length,3);
 end();
 assert.deepEqual(voices.map(v=>v.ended),[true,false,false,false]);
 advance(2000);
 assert.deepEqual(voices.map(v=>v.ended),[true,false,true,false]);
 timeline.finish();
 assert.deepEqual(voices.map(v=>v.ended),[true,true,true,false]);
 timeline.dispose();assert.ok(voices.every(v=>v.ended));
});

test('main playlist continuation rolls after each complete pass', async () => {
 for (const [chance, rolls, expectedPasses] of [
  [0, [0, 0.9], 2],
  [30, [0.3, 0.29], 2],
  [50, [0.75, 0.49], 2],
  [100, [0.99], 1]
 ]) {
  const controller = new AbortController();
  const settings = {mainPlaylist:'main_test', mainPasses:0, mainContinueChance:chance};
  const rows = [{id:'first', ...settings}, {id:'last', ...settings}, {id:'next'}];
  const played = [];
  let rollIndex = 0;
  const run = engine.runPlaylist(rows, new Map(), {
   signal:controller.signal,
   play:row => played.push(row.id),
   random:() => rolls[rollIndex++],
   pause:() => {
    if (chance === 0 && rollIndex === rolls.length) controller.abort();
   }
  });
  if (chance === 0) await assert.rejects(run, {name:'AbortError'});
  else await run;
  const expected = Array.from({length:expectedPasses}, () => ['first', 'last']).flat();
  if (chance > 0) expected.push('next');
  assert.deepEqual(played, expected);
  assert.equal(rollIndex, rolls.length);
 }
});
