const test=require('node:test');
const assert=require('node:assert/strict');
const engine=require('../void-runner/chance-encounter.js');
const seed=require('../void-runner/chance-encounter-seed.json');
const crossing=require('../void-runner/chance-crossing.js');

test('a delayed taxi must travel through the crossing before the card drops',()=>{
 const taxi={s:96,pathLen:100},plan={start:96,distance:8,taxi};
 assert.equal(crossing.crossingProgress(plan),0);
 taxi.s=0;assert.equal(crossing.crossingProgress(plan),.5);
 taxi.s=5;assert.equal(crossing.crossingProgress(plan),1);
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
