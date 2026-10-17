const test=require('node:test'),assert=require('node:assert/strict');
const R=require('../void-runner/relay.js'),content=require('../void-runner/relay-content.json'),X=require('../void-runner/warflying-scan.js');
// Test-only fixture lines. The shipped content file holds only David's scripts.
const seg=(id,kind,extra={})=>({id,kind,text:'Fixture line '+id+'.',...extra});
const fixture=[seg('n1','news'),seg('n2','news'),seg('f1','function'),seg('c1','communion'),seg('o1','natural-order'),seg('a1','ad')];
const on=(system='erebus',extra={})=>({on:true,system,protected:false,priority:false,ended:false,...extra});
const seq=v=>()=>v;
function run(r,ctx,steps=40,dt=1,c=fixture,rs=null){const acts=[];for(let i=0;i<steps;i++){const a=R.step(r,dt,ctx,c,seq(0),rs);if(a)acts.push(a);}return acts;}
// A small world: one developing story with three perspectives, a private event, a game-triggered event.
const world={
 events:[
  {id:'outage',summary:'A relay outage near a corridor.',confirmed:['Ships lost contact.'],unknown:['The cause.'],occurs:{at:10}},
  {id:'secret',summary:'Something nobody saw.',visibility:'private',occurs:{at:0}},
  {id:'leak',summary:'Something seen later.',visibility:{flag:'evidenceSent'},occurs:{at:0}},
  {id:'delivery',summary:'Aid reached a colony.',occurs:{story:{type:'missionComplete',subject:'aid-01'}}}
 ],
 segments:[
  seg('outage-breaking','breaking',{event:'outage',headline:'Outage reported',standing:'unverified'}),
  seg('outage-communion','communion',{event:'outage',headline:'Communion blames sabotage',standing:'propaganda',systems:['erebus']}),
  seg('outage-order','natural-order',{event:'outage',headline:'Order: build what you can repair',standing:'opinion',systems:['erebus']}),
  seg('outage-update','news',{event:'outage',stage:2,after:30,headline:'Outage: investigators report'}),
  seg('secret-report','news',{event:'secret',headline:'Secret'}),
  seg('leak-report','news',{event:'leak',headline:'Leak'}),
  seg('delivery-report','news',{event:'delivery',headline:'Aid delivered'}),
  seg('ad-x','ad',{headline:'Buy things'}),seg('ad-y','police',{headline:'Join up'}),
  seg('wf','warflying',{trigger:'warflying-one-point',text:'{NAME} INTO {RANK} PLACE!',headline:'{name} moves into {rank} place'})
 ]
};
const mins=m=>m*60;

test('the shipped Relay content is valid, and every report has a headline and a broadcaster',()=>{
  assert.deepEqual(R.validate(content),[]);
  for(const s of content.segments){assert.ok(s.headline,s.id);assert.ok(R.speakerOf(s),s.id);assert.ok(Array.isArray(s.lines),s.id);}
  const events=new Set(content.events.map(e=>e.id));for(const s of content.segments)if(s.event)assert.ok(events.has(s.event));
  // The Function may comment on an event, but never confirms it, and stays caption-only until David approves a voice.
  for(const s of content.segments.filter(s=>s.kind==='function'))assert.notEqual(s.standing,'confirmed',s.id);
  assert.equal(require('../tools/audio/npc-voice-registry.json').broadcast['the-function'].status,'unassigned');
});
test('validation catches bad reports and bad events',()=>{
  const bad={events:[{id:'e',summary:'x',occurs:{}},{id:'e',summary:'',occurs:{at:1}}],segments:[seg('x','gossip'),seg('Bad Id','news'),{id:'t',kind:'news',text:''},seg('n1','news',{systems:['mars']}),seg('n1','news'),
   seg('u','news',{event:'nope'}),seg('p','news',{perspective:'pirate'}),seg('s','news',{standing:'gossip'}),seg('g','warflying',{trigger:'nonsense'}),seg('h','news',{headline:'x'.repeat(91)})]};
  const p=R.validate(bad).join('\n');
  for(const m of ['unknown kind','bad id','text missing','unknown system','duplicate id','unknown event','unknown perspective','unknown standing','unknown trigger','headline too long','occurs needs','summary missing'])assert.match(p,new RegExp(m));
});
test('faction and Function broadcasts are heard only in their own space',()=>{
  const ids=system=>R.eligible(fixture,{system}).map(s=>s.id).sort();
  assert.deepEqual(ids('erebus'),['a1','n1','n2']);
  assert.deepEqual(ids('sol'),['a1','f1','n1','n2']);
  assert.deepEqual(ids('communion'),['a1','c1','n1','n2']);
  assert.deepEqual(ids('natural-order'),['a1','n1','n2','o1']);
});
test('reports play with gaps, rotate kinds and do not repeat back to back',()=>{
  const r=R.create();const plays=[];let ctx=on();
  for(let i=0;i<300;i++){const a=R.step(r,.5,ctx,fixture,Math.random);if(a?.type==='play')plays.push(a.segment.id);ctx={...on(),ended:r.state==='playing'};}
  assert(plays.length>5);for(let i=1;i<plays.length;i++)assert.notEqual(plays[i],plays[i-1]);
});
test('combat, mission dialogue and conversations cut a report at once, and it comes back after',()=>{
  const r=R.create();const first=run(r,on(),5).find(a=>a.type==='play');assert(first);
  assert.deepEqual(R.step(r,.1,on('erebus',{priority:true}),fixture),{type:'stop',reason:'priority'});
  assert.equal(R.step(r,10,on('erebus',{priority:true}),fixture),null,'stays quiet while the priority lasts');
  const back=run(r,on(),10).find(a=>a.type==='play');assert.equal(back.segment.id,first.segment.id);
});
test('nothing plays inside The Darknet District, with the station off, or without a satellite link',()=>{
  const r=R.create();assert.deepEqual(run(r,on('sol',{protected:true})),[]);assert.deepEqual(run(r,{...on(),on:false}),[]);assert.deepEqual(run(r,on('erebus',{offline:true})),[]);
  run(r,on(),5);assert.equal(r.state,'playing');assert.deepEqual(R.step(r,.1,on('sol',{protected:true}),fixture),{type:'stop',reason:'protected'});
  run(r,on(),8);assert.equal(r.state,'playing');assert.deepEqual(R.step(r,.1,on('erebus',{offline:true}),fixture),{type:'stop',reason:'offline'});
});
test('an empty schedule stays quiet instead of inventing filler',()=>{
  const r=R.create();for(let i=0;i<50;i++)assert.equal(R.step(r,1,on(),[]),null);assert.equal(r.state,'idle');
});

// ---- Events, perspectives and the news state ----
test('events become public on time or from a game event; private events are never reported',()=>{
  const rs=R.fresh(),matches=w=>!!w?.flags?.evidenceSent&&false;
  assert.deepEqual(R.occur(rs,world,{clock:mins(5),matches}),[],'nothing before its time, nothing private');
  assert.deepEqual(R.occur(rs,world,{clock:mins(10),matches}),['outage']);
  assert.deepEqual(R.occur(rs,world,{clock:mins(11),story:{type:'missionComplete',subject:'other'},matches}),[]);
  assert.deepEqual(R.occur(rs,world,{clock:mins(12),story:{type:'missionComplete',subject:'aid-01'},matches}),['delivery']);
  assert.equal(rs.occurred.secret,undefined);assert.equal(rs.occurred.leak,undefined);
  const ids=R.eligible(world.segments,on('erebus',{clock:mins(12)}),rs,world).map(s=>s.id);
  assert.ok(!ids.includes('secret-report')&&!ids.includes('leak-report'));
  // Once the evidence is out (a story flag), the leaked event can be reported.
  assert.deepEqual(R.occur(rs,world,{clock:mins(13),matches:w=>!!w?.flags?.evidenceSent}),['leak']);
});
test('one event, several perspectives: every version points at the same record',()=>{
  const rs=R.fresh();R.occur(rs,world,{clock:mins(10)});
  const versions=R.eligible(world.segments,on('erebus',{clock:mins(10)}),rs,world).filter(s=>s.event==='outage');
  assert.deepEqual(versions.map(s=>R.perspectiveOf(s)).sort(),['communion','natural-order','neutral']);
  assert.deepEqual(versions.map(s=>s.standing).sort(),['opinion','propaganda','unverified']);
  assert.equal(world.events.find(e=>e.id==='outage').summary,'A relay outage near a corridor.','claims never rewrite the record');
});
test('breaking news is queued, waits through combat, survives a reload, then cuts into an ad',()=>{
  const rs=R.fresh(),r=R.create(),c={...world,segments:world.segments.filter(s=>!['outage-communion','outage-order'].includes(s.id))};
  // An ad is playing when the outage breaks.
  run(r,on('erebus',{clock:mins(9)}),5,1,c,rs);assert.equal(r.segment?.kind==='ad'||r.segment?.kind==='police',true);
  R.occur(rs,c,{clock:mins(10)});assert.deepEqual(rs.pending,['outage-breaking']);
  assert.deepEqual(R.step(r,.1,on('erebus',{clock:mins(10),priority:true}),c,seq(0),rs),{type:'stop',reason:'priority'},'combat first');
  for(let i=0;i<10;i++)R.step(r,1,on('erebus',{clock:mins(10),priority:true}),c,seq(0),rs);assert.deepEqual(rs.pending,['outage-breaking'],'still waiting');
  const back=R.restore(JSON.parse(JSON.stringify(rs)));assert.deepEqual(back.pending,['outage-breaking']);
  // Combat over; a routine report has just started; breaking news cuts in.
  const r2=R.create();r2.state='playing';r2.segment=c.segments.find(s=>s.id==='ad-x');
  const cut=R.step(r2,.1,on('erebus',{clock:mins(11)}),c,seq(0),back);assert.equal(cut.segment.id,'outage-breaking');assert.equal(cut.interrupting,'ad-x');
  assert.deepEqual(back.pending,[]);assert.equal(back.archive[back.archive.length-1].id,'outage-breaking');
});
test('breaking news never interrupts other breaking news',()=>{
  const rs=R.fresh();R.occur(rs,world,{clock:mins(10)});rs.pending=['outage-breaking'];
  const r=R.create();r.state='playing';r.segment={...world.segments[0],id:'other-breaking'};
  assert.equal(R.step(r,.1,on('erebus',{clock:mins(10)}),world,seq(0),rs),null);
});
test('a developing story moves on: once the update is due, the first report stops airing',()=>{
  const rs=R.fresh();R.occur(rs,world,{clock:mins(10)});
  const at=m=>R.eligible(world.segments,on('erebus',{clock:mins(m)}),rs,world).filter(s=>s.event==='outage').map(s=>s.id).sort();
  assert.deepEqual(at(20),['outage-breaking','outage-communion','outage-order']);
  assert.deepEqual(at(40),['outage-update']);assert.equal(R.stageOf(rs,world,'outage',mins(40)),2);
});
test('cooldowns: a news report airs once, an ad waits its cooldown, and both are remembered after a reload',()=>{
  const rs=R.fresh();R.occur(rs,world,{clock:mins(12),story:{type:'missionComplete',subject:'aid-01'}});
  const r=R.create();let ctx=on('erebus',{clock:mins(12)});const plays=[];
  for(let i=0;i<400;i++){const a=R.step(r,.5,ctx,world,Math.random,rs);if(a?.type==='play')plays.push(a.segment.id);ctx={...ctx,ended:r.state==='playing'};}
  assert.equal(plays.filter(id=>id==='delivery-report').length,1,'news once');
  assert.equal(plays.filter(id=>id==='ad-x').length,1,'the ad waits 30 minutes');
  const back=R.restore(JSON.parse(JSON.stringify(rs)));
  assert.ok(!R.eligible(world.segments,on('erebus',{clock:mins(13)}),back,world).some(s=>s.id==='ad-x'||s.id==='delivery-report'));
  assert.ok(R.eligible(world.segments,on('erebus',{clock:mins(12+31)}),back,world).some(s=>s.id==='ad-x'),'and comes back later');
  assert.ok(back.archive.some(a=>a.id==='delivery-report'));assert.ok(!back.archive.some(a=>a.id==='ad-x'),'ads are not archived');
});
test('saved news state is bounded and rejects junk',()=>{
  const raw={occurred:{ok:5,'Bad Id':1,neg:-1},heard:{x:'y'},archive:Array.from({length:200},(_,i)=>({id:'a'+i,clock:i,time:1,vars:{name:'GhostVector',evil:{}}})),pending:['a','a','b','Bad'],board:[{name:'X',points:1,rank:1},{name:5}],said:{'warflying-new-contender':true,x:1}};
  const rs=R.restore(raw);
  assert.deepEqual(rs.occurred,{ok:5});assert.deepEqual(rs.heard,{});assert.equal(rs.archive.length,R.config.archive);assert.deepEqual(rs.archive[0].vars,{name:'GhostVector'});
  assert.deepEqual(rs.pending,['a','b']);assert.equal(rs.board.length,1);assert.deepEqual(rs.said,{'warflying-new-contender':true});
  assert.deepEqual(R.restore(null),R.fresh());
});

// ---- WarFlying commentary uses the real leaderboard ----
test('WarFlying moments come only from real leaderboard changes, and change nobody’s points',()=>{
  const board=(clock,pts)=>X.leaderboard(clock,pts,'YOU').map(r=>({name:r.name,points:r.points,rank:r.rank,player:r.player}));
  assert.deepEqual(R.moments(board(0,0),board(0,0)),[],'no change, no commentary');
  assert.deepEqual(R.moments(board(0,0),board(0,1)).map(m=>m.trigger),['warflying-new-contender'],'your first point');
  // You lead RiftRunner; RiftRunner's next point passes you.
  const before=board(0,7),after=board(90*60,7);const m=R.moments(before,after);
  const rift=m.find(x=>x.trigger==='warflying-one-point');assert.ok(rift);assert.equal(rift.vars.name,'RiftRunner');assert.deepEqual(rift.vars,{name:'RiftRunner',NAME:'RIFTRUNNER',RANK:'FIFTH',rank:'fifth'});assert.equal(m.length,1,'nobody else changed rank');
  assert.deepEqual(board(90*60,7),after,'reading the board changes nothing');
  const s=world.segments.find(x=>x.id==='wf');assert.deepEqual(R.render(s,rift.vars),['RIFTRUNNER INTO '+rift.vars.RANK+' PLACE!']);
  // A triggered report airs only with its moment.
  assert.ok(!R.eligible(world.segments,on('erebus'),R.fresh(),world).some(x=>x.id==='wf'));
  assert.ok(R.eligible(world.segments,on('erebus',{moment:rift}),R.fresh(),world).some(x=>x.id==='wf'));
});
test('a live leaderboard moment airs before routine programming, but never before breaking news',()=>{
  const rs=R.fresh();R.occur(rs,world,{clock:mins(12),story:{type:'missionComplete',subject:'aid-01'}});delete rs.occurred.outage;rs.pending=[];
  const moment={trigger:'warflying-one-point',vars:{name:'RiftRunner',NAME:'RIFTRUNNER',RANK:'FIFTH',rank:'fifth'}};
  for(let i=0;i<20;i++){const r=R.create();assert.equal(R.step(r,5,on('erebus',{clock:mins(12),moment}),world,Math.random,rs).segment.id,'wf');}
  R.occur(rs,world,{clock:mins(12)});rs.occurred.outage=mins(12);rs.pending=['outage-breaking'];
  assert.equal(R.step(R.create(),5,on('erebus',{clock:mins(12),moment}),world,Math.random,rs).segment.id,'outage-breaking');
});
test('station screens read the same records as the radio',()=>{
  const rs=R.fresh();R.occur(rs,world,{clock:mins(10)});
  const r=R.create();const a=R.step(r,5,on('erebus',{clock:mins(10),now:1}),world,seq(0),rs);assert.equal(a.segment.id,'outage-breaking');
  const lines=R.headlines(rs,world,on('erebus',{clock:mins(10)}),5);
  assert.equal(lines[0].headline,'Outage reported');assert.equal(lines[0].event,'outage');
  assert.ok(lines.every(h=>!h.event||rs.occurred[h.event]!==undefined),'screens never show an event the public does not know about');
});
