/* Crosswalks (void-runner/crosswalks.js; the owner, 20 Nov 2026: "Another thing NeoChinaTown needs are crosswalks"): where they are, that nobody is placed on them, that the
   street walkers, a mission character's walk and the mission arrow cross there, and that the road taxis stop for somebody on one. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const V=f=>require(path.join(__dirname,'..','void-runner',f));
const X=V('crosswalks.js'),A=V('npc-areas.js'),E=V('npc-escort.js'),R=V('guide-route.js'),T=V('road-taxi-rules.js'),N=V('ncz-nightlife.js'),Q=V('ncz-quarters.js');

test('every junction, gate and long stretch has one; each lies on the carriageway of its quarter, between the kerbs',()=>{
 assert.deepEqual([...new Set(X.list().map(c=>c.quarter))].sort(),['avenue','far-south','oldtown']);
 for(const c of X.list()){const [x0,x1,z0,z1]=c.rect,S=X.ROADS[c.road];assert.ok(x1>x0&&z1>z0,c.id);
  for(const [x,z] of [[x0,z0],[x1,z1],[(x0+x1)/2,(z0+z1)/2]]){assert.ok(Q.inQuarter(c.quarter,x,z,.01),c.id+' in its quarter');const k=A.check({x:(x0+x1)/2,z:(z0+z1)/2});assert.equal(k.ok,false,c.id+' is not a place to stand');}
  assert.ok(c.ends.every(([x,z])=>X.sideOf(S,{x,z})!==0),c.id+' ends on the pavements');}
 // Main Street (Old Town and Far South) and the Avenue: no stretch of more than 40 m without a crossing
 for(const id of ['main-ot','main-fs','avenue']){const at=X.list().filter(c=>c.road===id).map(c=>c.at).sort((a,b)=>a-b);for(let i=1;i<at.length;i++)assert.ok(at[i]-at[i-1]<=40,id+' gap '+at[i-1]+'..'+at[i]);}
 for(const k of ['ot-north-gate','ot-alley','ot-south','av-function','av-north-w','av-north-e','av-east','fs-south-gate','fs-far-gate'])assert.ok(X.get(k)?.signal,k+' has signal posts');});

test('nobody is placed on a crossing or a signal post; the posts are obstacles; the kerbs are kept clear by the walkers',()=>{
 for(const c of X.list()){for(let x=c.rect[0]+.2;x<c.rect[1];x+=.7)for(let z=c.rect[2]+.2;z<c.rect[3];z+=.7)assert.equal(A.check({x,z}).ok,false,c.id+' '+x+','+z);
  for(const p of c.posts){assert.equal(A.check({x:p.p[0],z:p.p[1]},null,0).ok,false);const a=A.get(c.quarter==='far-south'?'far-south':c.quarter);assert.ok(a.obstacles.some(o=>o[4]==='a crosswalk signal post'&&p.p[0]>o[0]&&p.p[0]<o[1]&&p.p[1]>o[2]&&p.p[1]<o[3]),c.id+' post is an obstacle');}
  for(const e of c.ends)assert.equal(N.clearAt(e),false,c.id+' kerb kept clear');}});

test('crossing(): the cheapest crossing between two pavements, with a preference that wins ties; nothing on the same side or off the street',()=>{
 const p=X.crossing({x:52.6,z:-80},{x:69.4,z:-90});assert.equal(p.c.id,'ot-mid');assert.equal(p.from,-1);assert.deepEqual([p.entry.x,p.exit.x],[53.4,68.6]);
 assert.equal(X.crossing({x:52.6,z:-80},{x:52.6,z:-30}),null);assert.equal(X.crossing({x:52.6,z:-80},{x:61,z:-80}),null,'a goal on the road');assert.equal(X.crossing({x:100,z:-58.5},{x:52.6,z:-80}),null,'not on the street');
 assert.equal(X.crossing({x:30,z:-18.4},{x:60,z:-6.6}).c.id,'av-north-w');
 const tie={x:52.6,z:-73.3},far={x:69.4,z:-73.3};const a=X.crossing(tie,far).c.id,b=a==='ot-alley'?'ot-mid':'ot-alley';assert.equal(X.crossing(tie,far,{prefer:new Set([b])}).c.id,b);
 assert.equal(X.crossing({x:61,z:-58.5},{x:52.6,z:-80}).exit.x,53.4,'on the stripes: only the far kerb is left');assert.equal(X.crossing({x:61,z:-58.5},{x:52.6,z:-80},{onRoad:false}),null);});

test('a road taxi slows and stops short of a crossing with somebody on it (the player or anyone marked), and drives on when it is clear',()=>{
 const run=(peds,player)=>{const w=T.createTraffic(1,1,'oldtown'),t=w.taxis[0];const s=t.path.findIndex(()=>true);void s;
  // put the cab southbound in the west lane at z -40, cruising, the alley's crossing (z -57..-60) 17 m ahead
  const L=T.pathLength(w.net.loop);let best=0,bd=1e9;for(let k=0;k<L;k+=.25){const q=T.pointAlong(w.net.loop,k,true);const d=Math.hypot(q.x-58.8,q.z+40)+(Math.abs(Math.sin(q.yaw))>.1||Math.cos(q.yaw)>0?99:0);if(d<bd){bd=d;best=k;}}
  Object.assign(t,{s:best,...T.pointAlong(w.net.loop,best,true),speed:8});for(let i=0;i<120;i++)T.stepWorld(w,1/30,player,peds);return t;};
 const free=run([],null);assert.ok(free.z<-62,'no one there: drives over ('+free.z.toFixed(1)+')');
 const npc=run([{x:64,z:-58.5}],null);assert.ok(npc.z>-57-.4&&npc.z<-50&&npc.speed<.1,'stops for a walker on the far half ('+npc.z.toFixed(2)+')');
 const me=run([],{x:55,z:-58.4,riding:false});assert.ok(me.z>-57-.4&&me.speed<.1,'stops for the player ('+me.z.toFixed(2)+')');
 const kerb=run([{x:52.6,z:-58.5}],null);assert.ok(kerb.z<-62,'somebody waiting on the pavement does not stop traffic');
 // the cab never stops ON the stripes
 assert.ok(npc.z-2.2>-57,'nose short of the paint');
 assert.equal(X.clearToCross(X.get('ot-alley'),[{x:58.8,z:-50,yaw:Math.PI,speed:8}]),false);assert.equal(X.clearToCross(X.get('ot-alley'),[{x:58.8,z:-50,yaw:0,speed:8}]),true);});

test('a mission character crosses on the stripes (npc-escort.js walkRoute), and the arrow routes over the crossing (guide-route.js)',()=>{
 const r=E.route({x:52.6,z:-80},{x:69.4,z:-70},'oldtown');const onRoad=[];let prev={x:52.6,z:-80};
 for(const q of r){for(let k=0;k<=20;k++){const x=prev.x+(q.x-prev.x)*k/20,z=prev.z+(q.z-prev.z)*k/20;if(x>54.2&&x<67.8)onRoad.push(X.at(x,z,'oldtown',.3)?.id||'none');}prev=q;}
 assert.ok(onRoad.length&&onRoad.every(id=>id!=='none'),'every step over the road is on a crossing: '+[...new Set(onRoad)]);
 const G=R.graphFor('neochinatown'),ids=R.plan(G,{x:52.6,z:-80},{x:69.4,z:-70}).map(w=>w.id);assert.deepEqual(ids,['xw:ot-mid:+:in','xw:ot-mid:+:out','goal']);
 assert.deepEqual(R.plan(G,{x:61,z:-75},{x:61,z:-95}).map(w=>w.id),['goal'],'walking along the road: no crossing');});

test('the street walkers have crossings on their lanes in each quarter; the dashes stop at them; the game loads the file before the walkers',()=>{
 for(const q of ['oldtown','avenue','far-south'])assert.ok(N.crossingsFor(N.lanesFor(q),q).length>=4,q);
 assert.equal(N.config.crossShare>0&&N.config.crossShare<1,true);
 assert.equal(X.skipMark(61,-58.5),true);assert.equal(X.skipMark(61,-75),false);
 for(const f of ['void-runner.html','static/void-runner.html']){const h=fs.readFileSync(path.join(__dirname,'..',f),'utf8');assert.ok(h.indexOf('void-runner/crosswalks.js')>0&&h.indexOf('void-runner/crosswalks.js')<h.indexOf('void-runner/ncz-nightlife.js'));}
 const src=fs.readFileSync(path.join(__dirname,'..','void-runner','neochinatown.js'),'utf8');assert.match(src,/VoidCrosswalks\.build\(/);
 X.mark('a',1,2,1000);X.mark('b',3,4,1600);assert.deepEqual(X.peds(1800),[{x:3,z:4}]);});
