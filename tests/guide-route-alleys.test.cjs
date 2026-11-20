/* The mission arrow in the back alleys, bays and yards (night QA, 20 Nov 2026). A walker that simply follows the arrow (guide-route.js follower, its smoothed
   bearing, walking pace) from street points and alley places to every other alley place and fire-escape foot of the same quarter must arrive, and every step it
   takes must stay on that quarter's walkable streets (the street rects the arrow routes over): no corner cut through a building, no turn back the way it came. */
const test=require('node:test'),assert=require('node:assert/strict');
const G=require(process.env.GUIDE_ROUTE||'../void-runner/guide-route.js'),QT=require('../void-runner/ncz-quarters.js'),BA=require('../void-runner/ncz-backalleys.js');
const graph=G.graphFor('neochinatown');
function walk(q,from,goal){const f=G.follower(),p={x:from[0],z:from[1]},dt=.1,rects=QT.QUARTERS[q].streets,off=[];let back=0,prev=null;
 for(let t=0;t<400;t+=dt){const o=f.update({graph,scene:'neochinatown',area:'street',quarter:q,player:{x:p.x,z:p.z},goal:{x:goal[0],y:1.7,z:goal[1]},key:'k',dt});
  if(Math.hypot(goal[0]-p.x,goal[1]-p.z)<1.4)return {ok:true,off,back};
  const v=Math.min(3.9*dt,Math.hypot(o.waypoint.x-p.x,o.waypoint.z-p.z)+.05);p.x+=Math.sin(o.bearing)*v;p.z+=Math.cos(o.bearing)*v;
  if(!rects.some(r=>p.x>=r[0]-.45&&p.x<=r[1]+.45&&p.z>=r[2]-.45&&p.z<=r[3]+.45))off.push([+p.x.toFixed(1),+p.z.toFixed(1)]);
  if(prev!==null&&t>1&&Math.abs(G.wrap(o.raw-prev))>2.6)back++;prev=o.raw;}   // (a start on the very edge of two overlapping streets may first turn once)
 return {ok:false,off,back,at:[p.x,p.z]};}
for(const q of ['avenue','oldtown','far-south'])test('the arrow keeps to the alleys and streets of '+q,()=>{
 const pts=[...BA.places().filter(p=>p.area===q).map(p=>({id:p.id,at:[p.x,p.z]})),...BA.ESCAPES.filter(e=>e.quarter===q).map(e=>({id:e.id,at:e.foot}))];
 const street={avenue:[[60,-12],[100,-12]],oldtown:[[61,-70],[61,-110],[100,-58]],'far-south':[[61,-150],[61,-200]]}[q].map((at,i)=>({id:'street-'+i,at}));
 const bad=[];for(const a of [...street,...pts])for(const b of pts){if(a===b)continue;const r=walk(q,a.at,b.at);if(!r.ok||r.off.length||r.back)bad.push(a.id+' -> '+b.id+': '+JSON.stringify({ok:r.ok,off:r.off.slice(0,3),back:r.back}));}
 assert.deepEqual(bad,[]);});
test('a walk from street to street never cuts through Milked (its front and rear doors cost extra); a goal inside still goes in',()=>{
 const ids=(from,goal)=>G.plan(graph,{...from,quarter:'far-south'},goal).map(w=>w.id);
 for(const id of ['far-south-east-lane','far-south-east-yard','far-south-east-alley-south'])assert.ok(!ids({x:84.8,z:-191.8},(BA.places().find(p=>p.id===id))).some(i=>i.startsWith('milked-')),id);
 const MK=require('../void-runner/milked.js'),rec=(MK.ROOMS||[]).find(r=>r.id==='reception').rect;assert.ok(ids({x:61,z:-160},{x:(rec[0]+rec[1])/2,z:(rec[2]+rec[3])/2}).includes('milked-door>'));});
test('a goal that moves into another street (a person walking round a corner) or a player who leaves the goal street gets the route again, not a straight line',()=>{
 const f=G.follower(),u=(px,pz,gx,gz)=>f.update({graph,scene:'neochinatown',area:'street',quarter:'avenue',player:{x:px,z:pz},goal:{x:gx,y:1.7,z:gz},key:'her',dt:.1});
 for(let k=0;k<5;k++)u(40.5,.5,40,1.5);assert.equal(f.last.waypoint.id,'goal');   // beside her in the alley behind the Avenue
 for(let k=0;k<40;k++)u(40.5,.5,38.2,-6.6);   // she walked out to the Avenue's pavement: the way is out of the alley's mouth, not through the buildings
 assert.notEqual(f.last.waypoint.id,'goal');assert.ok(f.last.waypoint.x>44,JSON.stringify(f.last.waypoint));
 const g=G.follower();for(let k=0;k<5;k++)g.update({graph,scene:'neochinatown',area:'street',quarter:'avenue',player:{x:40,z:8},goal:{x:40,y:1.7,z:10},key:'bay',dt:.1});
 g.update({graph,scene:'neochinatown',area:'street',quarter:'avenue',player:{x:60,z:-12},goal:{x:40,y:1.7,z:10},key:'bay',dt:.1});assert.notEqual(g.last.waypoint.id,'goal');});
