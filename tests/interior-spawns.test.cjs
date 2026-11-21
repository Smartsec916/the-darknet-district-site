/* NOBODY IS STUCK ON ARRIVAL (the owner, 20 Nov 2026: "look for reasons you might get stuck in a housing room and can't move once you enter. maybe stuck in the couch").
   For every interior the player can be put in (the five apartment styles and their two hallways with every slot's "in front of the door" point and the fire-escape window,
   every module type entered through each of its doors, the elevator and stairwell arrivals, every module template, the story missions' locations, the tunnel network's
   checkpoints and stair landings, the street doors' and fire escapes' points outside), the arrival point is checked with the walk's own collision (VoidExplorer.blocked,
   radius 0.38 m): the player's circle there overlaps no solid, he can walk at least 1.5 m from it, and he can walk to the way out (the exit prompt within its range).
   A flood fill on a 0.1 m grid with the four axis moves the walk makes; doors count as open (they open as the player comes near). Furniture or a door moved onto an
   arrival point fails here. Also: the walk lets a player who overlaps a solid walk out of it, and the quiet unstick puts a pinned player on free floor. */
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const R=p=>path.join(__dirname,'..',p);
const fresh=()=>{for(const k of Object.keys(require.cache))if(k.includes('void-runner'+path.sep))delete require.cache[k];};
const E=()=>require(R('void-runner/exploration-controller.js'));
const hits=(x,z,loc)=>loc.solids.filter(s=>!s.open&&Math.abs(x-s.position[0])<s.size[0]/2+E().radius&&Math.abs(z-s.position[2])<s.size[2]/2+E().radius).map(s=>s.id);
const opened=loc=>({...loc,solids:loc.solids.map(s=>s.door||/^door:/.test(s.id||'')?{...s,open:true}:s)});
/* Flood fill from p: how far the player can get (capped at `cap` m) and whether he reaches one of `goals` ([x, z, range]). */
function walk(loc,p,goals=[],cap=40){const X=E(),L=opened(loc),st=.1,seen=new Set(['0,0']),q=[[0,0]];let far=0,reached=!goals.length;
 for(let h=0;h<q.length;h++){const [i,j]=q[h],x=p[0]+i*st,z=p[1]+j*st;far=Math.max(far,Math.hypot(i,j)*st);
  if(!reached&&goals.some(g=>Math.hypot(g[0]-x,g[1]-z)<g[2]-.05))reached=true;if(reached&&far>=1.5&&!goals.length)break;if(reached&&far>=1.5)break;
  for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const ni=i+a,nj=j+b,k=ni+','+nj;if(seen.has(k)||Math.hypot(ni,nj)*st>cap)continue;if(X.blocked(p[0]+ni*st,p[1]+nj*st,L))continue;seen.add(k);q.push([ni,nj]);}}
 return {far,reached};}
const goalsOf=(loc,actions)=>loc.interactions.filter(i=>actions.includes(i.action)).map(i=>[i.position[0],i.position[2],i.range]);
function check(name,loc,spawn,actions,out){const h=hits(spawn[0],spawn[2],loc);if(h.length)out.push(name+': the arrival point ['+spawn[0]+', '+spawn[2]+'] is inside '+h.join(', '));
 else{const goals=actions?goalsOf(loc,actions):[];if(actions&&!goals.length){out.push(name+': no way out found ('+actions.join('/')+')');return;}const w=walk(loc,[spawn[0],spawn[2]],goals);
  if(w.far<1.5)out.push(name+': from the arrival point the player can only move '+w.far.toFixed(2)+' m');if(!w.reached)out.push(name+': the way out ('+actions.join('/')+') cannot be reached from the arrival point');}}

test('apartments: every style, its hallway, every slot\'s door front and the fire-escape window: clear floor, room to move, the way out reachable',()=>{
 fresh();const A=require(R('void-runner/apartments.js')),out=[];
 for(const st of A.STYLE_IDS){const flat=A.layout('flat',st),hall=A.layout('hall',st),G=A.geo(st);
  check(st+' apartment',flat,flat.spawn,['apt-exit'],out);check(st+' hallway (from the street)',hall,hall.spawn,['apt-hall-exit'],out);
  for(const sl of G.HALL.slots){const f=A.hallFront(sl.i,st);check(st+' hallway in front of door '+sl.i,hall,f.spawn,['apt-hall-exit'],out);}
  if(!G.container){const w=[A.ORIGIN[0]+G.HALL.x[1]-1.45,1.7,A.ORIGIN[1]];check(st+' hallway (in through the fire-escape window)',hall,w,['apt-hall-exit'],out);}
  // mission items are looked at, never stood on: they add prompts, no collision
  const withItems=A.layout('flat',st,{items:[{type:'loot',label:'x',x:A.geo(st).APT.spawn[0],z:A.geo(st).APT.spawn[1]}]});assert.equal(withItems.solids.length,flat.solids.length,'items add no collision');}
 assert.deepEqual(out,[]);
 // the spawn stays clear of the couch and the table that stand just inside the entry door (the trap found 20 Nov 2026)
 const f=A.layout('flat','luxury');assert.deepEqual(hits(f.spawn[0],f.spawn[2],f),[]);
});

test('the window\'s way in (ncz-backalleys-integration.js) is the point checked above',()=>{
 const s=require('node:fs').readFileSync(R('void-runner/ncz-backalleys-integration.js'),'utf8');assert.match(s,/def\.spawn=\[A\.ORIGIN\[0\]\+H\.x\[1\]-1\.45,1\.7,A\.ORIGIN\[1\]\]/);
});

test('modules: every type entered through each of its doors, elevator and stairwell arrivals, every template, the story missions\' locations',()=>{
 fresh();const M=require(R('void-runner/modules.js')),out=[];const EXITS=['mod-exit','mod-portal','mod-elev','apt-exit','apt-hall-exit'];
 const inst=loc=>({key:'m/'+loc.id,mission:'m',id:loc.id,door:loc.door||'',modular:true,loc,hacked:[]});
 for(const id of M.TYPE_IDS){const t=M.TYPES[id];if(t.portal||t.cab)continue;
  for(const s of t.sockets){const loc={id:'x',door:'',entry:'m.'+s.id,modules:[{id:'m',type:id,x:10,z:10}]},L=M.layout(inst(loc),null,{});if(!L){out.push(id+'.'+s.id+': no layout');continue;}
   check(id+' entered through '+s.id,L,L.spawn,EXITS,out);}}
 // the cabs: an elevator over two lobbies, a stairwell over two corridors (arrivals by lift / stairs)
 let cabs=0;for(const [cab,room] of [['elevator','elevator-lobby'],['stairwell','tunnel'],['stairwell','tunnel-junction']]){assert.ok(M.TYPES[cab]&&M.TYPES[room],cab+' / '+room);
  const mods=[];const loc={id:'c',door:'',modules:mods};for(const fl of [0,-1]){mods.push({id:'cab'+fl,type:cab,x:10,z:10,floor:fl});
   const att=M.attach({...loc,modules:mods.slice()},room,'cab'+fl+'.s0');assert.ok(att,room+' fits the '+cab);mods.push({id:'r'+fl,type:room,x:att.x,z:att.z,rot:att.rot,floor:fl});}
  const an=M.analyse(loc);loc.entry=M.TYPES[room].sockets.map(s=>'r0.'+s.id).find(r=>!an.sockUse[r]);assert.ok(loc.entry);
  for(const f of [0,-1]){cabs++;const cid=M.clusterAtFloor(inst(loc),f);if(!cid)continue;const L=M.layout(inst(loc),cid,{from:{cab:true}});check(cab+' ('+room+') arrival on floor '+f,L,L.spawn,EXITS,out);}}assert.equal(cabs,6);
 // every template and every story location: every cluster, arriving through every one of its doors, by the cab, or with no door named
 const locs=[];for(let i=0;i<M.TEMPLATES.length;i++){const tp=M.template(i)||M.template(M.TEMPLATES[i].id);if(tp)locs.push(['template '+(M.TEMPLATES[i].id||i),{id:'t'+i,door:'',...tp}]);}
 const MS=require(R('void-runner/main-story.js'));const seen=new Set();const scan=(o,p,d=0)=>{if(!o||typeof o!=='object'||d>8)return;if(Array.isArray(o.apartments))for(const a of o.apartments)if(M.isLocation(a)&&!seen.has(JSON.stringify(a))){seen.add(JSON.stringify(a));locs.push([p+' '+a.id,a]);}for(const k of Object.keys(o))scan(o[k],p,d+1);};
 for(const k of Object.keys(MS))scan(MS[k],k);
 assert.ok(locs.length>=10,'templates and story locations: '+locs.length);
 for(const [name,loc] of locs){const an=M.analyse(loc),I=inst(loc);for(const cl of an.clusters){const froms=[{}];for(const d of an.doors)for(const r of [d.a,d.b])if(r&&cl.mods.includes(M.parseRef(r).mod))froms.push({ref:r});if(cl.mods.some(id=>an.byId[id].t.cab))froms.push({cab:true});
  for(const f of froms){const L=M.layout(I,cl.id,{from:f});if(!L)continue;check(name+' / '+cl.mods.join('+')+' '+JSON.stringify(f),L,L.spawn,EXITS,out);}}}
 assert.deepEqual(out,[]);
});

test('the tunnel network: each checkpoint arrival and each stair landing; the street doors\' and fire escapes\' points outside',()=>{
 fresh();const U=require(R('void-runner/ncz-underground.js')),NC=require(R('void-runner/neochinatown.js')),BA=require(R('void-runner/ncz-backalleys.js')),A=require(R('void-runner/apartments.js')),QT=require(R('void-runner/ncz-quarters.js')),out=[];
 const UL=NC.layout('street','underground');for(const e of U.ENTRANCES){const a=U.arrive(e.id);check('tunnels: in at '+e.id,UL,a.spawn,['under-up'],out);
  const l=U.leave(e.id);const city=NC.layout('street',l.quarter);check('tunnels: up the stairs at '+e.id,city,l.spawn,null,out);}
 const cities={};const city=q=>cities[q]||(cities[q]=NC.layout('street',q));
 for(const q of Object.keys(QT.QUARTERS)){if(q==='underground')continue;for(const e of BA.escapesIn(q)||[])check('fire escape '+e.id+' (out of the hallway window)',city(q),[e.foot[0],1.7,e.foot[1]],null,out);}
 for(const d of A.doors()){if(!d.front||!QT.QUARTERS[d.quarter])continue;check('street door '+d.id+' (back out of the building)',city(d.quarter),[d.front[0],1.7,d.front[1]],null,out);}
 assert.deepEqual(out,[]);
});

test('the walk: a player overlapping a solid walks out of it (never further in); the quiet unstick only when pinned',()=>{
 fresh();const X=E();const loc={bounds:[50,50],solids:[{id:'couch',position:[.775,.2,-2.775],size:[.85,.4,1.85]},{id:'wall',position:[0,1,3],size:[10,2,.3]}]};
 const p={x:0,z:-3.55,yaw:0,vx:0,vz:0};assert.ok(X.blocked(p.x,p.z,loc),'starts overlapping the couch');
 const into={...p};for(let i=0;i<30;i++)X.step(into,{x:1,z:0},1/60,loc);assert.ok(into.x<=p.x+1e-9,'never further into it');
 for(let i=0;i<30;i++)X.step(p,{x:-1,z:0},1/60,loc);assert.ok(p.x<-.1&&!X.blocked(p.x,p.z,loc),'walked out of it');
 // pushing into a wall from outside: no tunnelling, and the unstick never fires (the other directions are open)
 const q={x:0,z:2.4,yaw:0,vx:0,vz:0};for(let i=0;i<300;i++){X.step(q,{x:0,z:1},1/60,loc);assert.equal(X.watch(q,{x:0,z:1},1/60,loc),false);}assert.ok(q.z<3-.15-.38+1e-6,'held by the wall');
 // pinned between solids on every side: after 2 s of pressing a key he is put on the nearest free spot
 const box={bounds:[50,50],solids:[{id:'a',position:[0,1,0],size:[1.2,2,1.2]}]},r={x:0,z:0,yaw:0,vx:0,vz:0};let moved=false;
 for(let i=0;i<150&&!moved;i++){X.step(r,{x:0,z:0},1/60,box);moved=X.watch(r,{x:.0001,z:1},1/60,box);}
 assert.ok(moved,'unstuck after about 2 s');assert.equal(X.blocked(r.x,r.z,box),false);
 const f=X.free(0,0,box);assert.ok(f.moved&&!X.blocked(f.x,f.z,box)&&f.distance<1.1);
});
