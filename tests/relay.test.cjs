const test=require('node:test'),assert=require('node:assert/strict');
const R=require('../void-runner/relay.js'),content=require('../void-runner/relay-content.json');
// Test-only fixture lines. The shipped content file holds only David's approved scripts.
const seg=(id,kind,extra={})=>({id,kind,text:'Fixture line '+id+'.',...extra});
const fixture=[seg('n1','news'),seg('n2','news'),seg('f1','function'),seg('c1','communion'),seg('o1','natural-order'),seg('a1','ad',{speaker:'news-anchor'})];
const on=(system='erebus',extra={})=>({on:true,system,protected:false,priority:false,ended:false,...extra});
const seq=v=>()=>v;
function run(r,ctx,steps=40,dt=1){const acts=[];for(let i=0;i<steps;i++){const a=R.step(r,dt,ctx,fixture,seq(0));if(a)acts.push(a);}return acts;}

test('the shipped Relay content is valid and contains no invented lines',()=>{
  assert.deepEqual(R.validate(content),[]);assert.deepEqual(content.segments,[],'filled only from David’s scripts');
});
test('validation catches bad segments',()=>{
  const bad={segments:[seg('x','gossip'),seg('Bad Id','news'),seg('a2','ad'),{id:'t',kind:'news',text:''},seg('n1','news',{systems:['mars']}),seg('n1','news')]};
  const p=R.validate(bad).join('\n');for(const m of ['unknown kind','bad id','needs a speaker','text missing','unknown system','duplicate id'])assert.match(p,new RegExp(m));
});
test('faction and Function broadcasts are heard only in their own space',()=>{
  const ids=system=>R.eligible(fixture,{system}).map(s=>s.id).sort();
  assert.deepEqual(ids('erebus'),['a1','n1','n2']);
  assert.deepEqual(ids('sol'),['a1','f1','n1','n2']);
  assert.deepEqual(ids('communion'),['a1','c1','n1','n2']);
  assert.deepEqual(ids('natural-order'),['a1','n1','n2','o1']);
});
test('segments play with gaps and do not repeat back to back',()=>{
  const r=R.create();const plays=[];let ctx=on();
  for(let i=0;i<300;i++){const a=R.step(r,.5,ctx,fixture,Math.random);if(a?.type==='play')plays.push(a.segment.id);ctx={...on(),ended:r.state==='playing'};}
  assert(plays.length>5);for(let i=1;i<plays.length;i++)assert.notEqual(plays[i],plays[i-1]);
});
test('mission dialogue and combat cut a segment at once, and it comes back after',()=>{
  const r=R.create();const first=run(r,on(),5).find(a=>a.type==='play');assert(first);
  assert.deepEqual(R.step(r,.1,on('erebus',{priority:true}),fixture),{type:'stop',reason:'priority'});
  assert.equal(R.step(r,10,on('erebus',{priority:true}),fixture),null,'stays quiet while the priority lasts');
  const back=run(r,on(),10).find(a=>a.type==='play');assert.equal(back.segment.id,first.segment.id);
});
test('nothing plays inside The Darknet District premises or with the station off',()=>{
  const r=R.create();assert.deepEqual(run(r,on('sol',{protected:true})),[]);assert.deepEqual(run(r,{...on(),on:false}),[]);
  run(r,on(),5);assert.equal(r.state,'playing');assert.deepEqual(R.step(r,.1,on('sol',{protected:true}),fixture),{type:'stop',reason:'protected'});
});
test('an empty schedule stays quiet instead of inventing filler',()=>{
  const r=R.create();for(let i=0;i<50;i++)assert.equal(R.step(r,1,on(),[]),null);assert.equal(r.state,'idle');
});
