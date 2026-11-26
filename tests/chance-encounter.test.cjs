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
