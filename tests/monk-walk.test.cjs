// Monks on the street (ncz-nightlife.js cfg.monk): a slow steady pace, foresight of anyone on a collision course long before others would notice, a calm drift to one
// side of the sidewalk inside its edges, and nobody ever bumps into them.
const test=require('node:test'),assert=require('node:assert/strict'),N=require('../void-runner/ncz-nightlife.js');
const M=N.config.monk,avg=(N.config.speed[0]+N.config.speed[1])/2;
test('a monk walks at one slow, steady pace: about two thirds of the average walker, the walk clip slowed to match',()=>{
  const s=N.monkSpeed();assert.ok(s/avg>=.6&&s/avg<=.7,'pace factor '+(s/avg));assert.equal(N.monkSpeed(),s,'the same pace every time');
  assert.ok(s<N.config.speed[0],'slower than the slowest ordinary walker');assert.ok(Math.abs(M.anim-s/avg)<.05,'the walk clip plays at the same fraction (no sliding feet)');
  assert.ok(M.turn<5,'turns more slowly than other walkers');});
test('foresight: a reader coming the other way is sensed ~9 m off, far earlier than the 1.7 m others notice at',()=>{
  const me={t:0,side:0,home:0,v:N.monkSpeed()},at=gap=>N.foresee(me,[{id:'r',t:gap,side:.05,v:-1.3}],1);
  assert.ok(M.sense>=8&&M.sense>=4*(N.config.spacing+.6));assert.ok(at(8.5),'sensed at 8.5 m');assert.equal(at(M.sense+1),null,'not beyond the sense radius');
  assert.equal(N.foresee(me,[{id:'r',t:-3,side:0,v:-1.3}],1),null,'someone walking away is no threat');
  assert.equal(N.foresee({...me,side:.2,home:.2},[{id:'r',t:5,side:-.9,v:-1.3}],1),null,'someone already well to one side (over `clear` across) is no threat');
  const s=at(6);assert.ok(Math.abs(s.side-.05)>=.8,'drifts to the side that leaves the most room (past the .8 m a reader reacts to)');assert.ok(Math.abs(s.side)<=1-M.margin+1e-9,'never past the sidewalk edge');
  assert.ok(N.foresee(me,[{id:'r',t:-6,side:0,v:1.3}],1),'a faster reader coming up from behind is sensed too');});
test('a monk keeps the side they chose, and uses the lane edges of narrow pavements too',()=>{
  const me={t:0,side:.2,home:.2,v:.8,avoid:{side:-.9,who:'r',hold:1}};assert.equal(N.foresee(me,[{id:'r',t:5,side:.3,v:-1.2}],1).side,-.9);
  const narrow=N.foresee({t:0,side:0,home:0,v:.8},[{id:'r',t:5,side:0,v:-1.2}],.6);assert.ok(Math.abs(narrow.side)<=.6-M.margin+1e-9);});
// The whole meeting, step by step: a V1 reader walking straight down the monk's line, never looking up.
function meet({half=1,readerSide=0,monkSide=0,start=14,v=-1.3,dt=1/30}={}){const me={t:0,side:monkSide,home:monkSide,v:N.monkSpeed()},r={id:'reader',t:start,side:readerSide,v};
  const out={firstSense:null,minSep:Infinity,react:false,out:false,back:null};const DC=N.config.distracted;
  for(let time=0;time<25;time+=dt){const seen=N.monkStep(me,[r],half,dt);if(seen&&out.firstSense==null)out.firstSense=r.t-me.t;
   me.t+=me.v*dt;r.t+=r.v*dt;const gap=r.t-me.t,sep=Math.abs(r.side-me.side);
   if(Math.abs(gap)<.6)out.minSep=Math.min(out.minSep,sep);
   // the reader's own checks (ncz-nightlife.js): a near miss (within `notice` m and .8 m across) or a bump (.5 m, .7 m across)
   if(gap<0&&-gap<DC.notice&&sep<.8)out.react=true;if(Math.abs(me.side)>half-M.margin+1e-9)out.out=true;
   if(gap<-4&&out.back==null&&Math.abs(me.side-monkSide)<.05)out.back=time;}
  return {...out,me};}
test('the monk drifts aside well before; the reader passes without ever reacting, and the monk drifts back afterwards',()=>{
  for(const [readerSide,monkSide] of [[0,0],[.3,0],[-.4,.2],[.1,.35],[.85,.85]]){const m=meet({readerSide,monkSide});
   assert.ok(m.firstSense>=8,'sensed at '+m.firstSense);assert.ok(m.minSep>=.8,'passing gap '+m.minSep+' for '+readerSide+'/'+monkSide);assert.ok(!m.react,'the reader never notices');
   assert.ok(!m.out,'stays on the sidewalk');assert.ok(m.back!=null,'back on their line afterwards');}});
test('nobody bumps into a monk',()=>{assert.equal(N.bumpable({monk:true}),false);assert.equal(N.bumpable({monk:false}),true);
  // the reader whose look is set to bump never has the monk as a target: the meeting above never comes within the bump test's .7 m across
  const m=meet({readerSide:0,monkSide:0});assert.ok(m.minSep>=.7);});
test('a monk is anyone tagged monk (VoidNPCDevice.tag) or marked monk in their metadata',()=>{
  const parent={metadata:{monk:true}},child={parent,metadata:{crowd:'x'}};assert.ok(N.isMonk(child,null));assert.ok(N.isMonk({metadata:{npcDevice:{monk:true}}},null));
  const node={metadata:{crowd:'y'}};assert.ok(!N.isMonk(node,null));assert.ok(N.isMonk(node,{_agent:n=>n===node?{monk:true}:null}));assert.ok(!N.isMonk(node,{_agent:()=>({monk:false})}));});
test('a monk does not waver: once a side is chosen for someone it is kept while it leaves them room, even with people standing about',()=>{
  const me={t:0,side:0,home:0,v:N.monkSpeed()},r={id:'reader',t:9,side:.1,v:-1.3},lean={id:'lean',t:6,side:.75,v:0},kerb={id:'kerb',t:7,side:-.8,v:0};const sides=new Set();
  for(let i=0;i<120;i++){const seen=N.monkStep(me,[r,lean,kerb].filter(o=>(o.t-me.t)*1>-1),1,1/30);if(seen&&seen.who==='reader')sides.add(Math.sign(seen.side));me.t+=me.v/30;r.t+=r.v/30;}
  assert.ok(sides.size<=1,'one side for the reader');});
test('someone appearing close (out of a doorway) still gets room: the monk steps a little quicker, only then',()=>{
  const m=meet({start:4.2});assert.ok(m.minSep>=.8,'gap '+m.minSep);const calm=meet({start:14});assert.ok(calm.minSep>=.8);});
