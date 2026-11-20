/* The mission arrow inside locations built from modules (night QA, 20 Nov 2026). A walker that follows the arrow (guide-route.js follower, its smoothed bearing) with the
   game's own collision (exploration-controller.js step, the cluster's walls, doors and furniture from modules.js layout) gets from the cluster's first door to the
   middle of every module of the cluster: through the room doors and the tunnel seams, round the gang checkpoint's fence and the tables. */
const test=require('node:test'),assert=require('node:assert/strict');
const G=require(process.env.GUIDE_ROUTE||'../void-runner/guide-route.js'),M=require('../void-runner/modules.js'),X=require('../void-runner/exploration-controller.js');
function walk(L,from,goal,box){const graph=G.modular(L.cluster,L.solids),f=G.follower(),p={x:from.x,z:from.z,yaw:0,y:1.7,eye:1.68,height:0},dt=.05,solids=L.solids.filter(s=>!(s.door||/^door:/.test(s.id||''))),loc={...L,solids};
 let best=1e9,bestT=0;for(let t=0;t<120;t+=dt){const o=f.update({graph,scene:'mod',area:'',quarter:'',player:{x:p.x,z:p.z},goal:{x:goal.x,y:1.7,z:goal.z},key:'k',dt});
  const gd=Math.hypot(goal.x-p.x,goal.z-p.z);if(gd<1.2||(box&&p.x>box[0]+.4&&p.x<box[1]-.4&&p.z>box[2]+.4&&p.z<box[3]-.4))return {ok:true};p.yaw=o.bearing;X.step(p,{x:0,z:1},dt,loc);if(gd<best-.2){best=gd;bestT=t;}if(t-bestT>6)return {ok:false,at:[+p.x.toFixed(2),+p.z.toFixed(2)],wp:o.waypoint.id};}
 return {ok:false,at:[p.x,p.z],why:'time'};}
for(const id of ['underground','tea-under','east-asian','tunnel-run','office-servers','office','pawn'])test('the arrow leads through every module of the template '+id,()=>{
 const loc={id:'L',door:'apt-avenue-n-16',...JSON.parse(JSON.stringify(M.TEMPLATES.find(t=>t.id===id).loc))},an=M.analyse(loc),bad=[];
 for(const c of an.clusters){const L=M.layout({loc,key:'k'},c.id);if(!L)continue;const mods=L.cluster.mods,start=L.cluster.doors.find(d=>d.kind==='entry'||d.kind==='portal')||null;
  // start just inside each module in turn and walk to every other module's middle (a free spot near it)
  // from just inside each door of module a (where a player stands after coming in) to module b: done once inside b (a "Go into" step), the goal being b's middle as
  // mission-guide.js gives it
  const rect=m=>[m.cx-m.w,m.cx+m.w,m.cz-m.d,m.cz+m.d],open={...L,solids:L.solids.filter(s=>!(s.door||/^door:/.test(s.id||'')))};
  for(const a of mods){const ra=rect(a),starts=L.cluster.doors.filter(d=>d.n&&(String(d.a).split('.')[0]===a.id||String(d.b).split('.')[0]===a.id)).map(d=>{for(const k of [1,-1]){const x=d.x+d.n[0]*k*.9,z=d.z+d.n[1]*k*.9;if(x>ra[0]&&x<ra[1]&&z>ra[2]&&z<ra[3]&&!X.blocked(x,z,open))return {x,z,door:d.id};}return null;}).filter(Boolean);
   for(const b of mods){if(a===b)continue;for(const s of starts){const r=walk(L,s,{x:b.cx,z:b.cz},rect(b));if(!r.ok)bad.push(a.id+' ('+s.door+') -> '+b.id+' '+JSON.stringify(r));}}}}
 assert.deepEqual(bad,[]);});
