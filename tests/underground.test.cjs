// The tunnel network under NeoChinatown (void-runner/ncz-underground.js, the owner 20 Nov 2026): one connected network joining the three stair doors, the fight pit off
// the way of everything else, the tea room with the sleeping room behind it, placement rules for people, the mission arrow from the street down into it, multiplayer levels.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const U=require('../void-runner/ncz-underground.js'),M=require('../void-runner/modules.js'),BA=require('../void-runner/ncz-backalleys.js'),Q=require('../void-runner/ncz-quarters.js');
const A=require('../void-runner/npc-areas.js'),E=require('../void-runner/npc-escort.js'),GR=require('../void-runner/guide-route.js'),N=require('../void-runner/neochinatown.js'),X=require('../void-runner/exploration-controller.js'),PL=require('../void-runner/places.js');
const ROOT=path.join(__dirname,'..');
const IDS=['under-checkpoint-avenue','under-avenue-passage','under-trunk-north','under-alcove-1','under-food-stall','under-alcove-2','under-mahjong','under-checkpoint-oldtown','under-oldtown-passage',
 'under-trunk-south','under-alcove-3','under-tea-room','under-sleeping-room','under-alcove-4','under-fight-pit-passage','under-fight-pit','under-alcove-5','under-alcove-6','under-checkpoint-farsouth','under-farsouth-passage'];

test('the place ids are stable and every module belongs to one place; the module sizes are modules.js\'s own',()=>{
 assert.deepEqual(U.PLACES.map(p=>p.id),IDS,'ids never change once published (missions name them)');
 for(const p of U.PLACES)assert.ok(p.mods.length&&p.name,p.id);
 for(const m of U.MODS){assert.ok(U.PLACE_OF[m.id],m.id);const t=M.TYPES[m.type];assert.ok(t&&t.underground,m.type);assert.deepEqual(U.SIZE[m.type],[t.w,t.d],m.type);}
 assert.ok(U.PLACES.filter(p=>p.kind==='alcove').length>=4&&U.PLACES.filter(p=>p.kind==='alcove').length<=6,'four to six alcoves');
 for(const [id,type] of [['under-tea-room','tea-under'],['under-sleeping-room','flophouse'],['under-fight-pit','fight-pit'],['under-mahjong','mahjong'],['under-food-stall','food-stall']])assert.ok(U.placeById(id).mods.some(m=>U.MODS.find(x=>x.id===m).type===type),id);
 assert.equal(U.PLACES.filter(p=>p.kind==='checkpoint').length,3);for(const p of U.PLACES.filter(p=>p.kind==='checkpoint'))assert.equal(U.MODS.find(m=>m.id===p.mods[0]).type,'gang-vestibule');});

test('one network: one cluster of modules, no overlaps, no door into a wall, every module reachable; the walk graph is connected',()=>{
 const an=U.analysis();assert.equal(an.clusters.length,1,'everything is built together');
 assert.deepEqual(an.problems.filter(p=>!/choose the entrance|12 modules|grid/.test(p)),[]);
 const g=U.graph(),adj=new Map(g.nodes.map(n=>[n,new Set()]));for(const [a,b] of g.edges){adj.get(a).add(b);adj.get(b).add(a);}
 const seen=new Set(['street:under-avenue']),todo=['street:under-avenue'];while(todo.length){for(const v of adj.get(todo.pop()))if(!seen.has(v)){seen.add(v);todo.push(v);}}
 assert.equal(seen.size,g.nodes.length,'every place and all three stair doors are joined');
 for(const e of U.ENTRANCES)for(const f of U.ENTRANCES)if(e!==f)assert.ok(U.path('street:'+e.id,'street:'+f.id),e.id+' to '+f.id);
 // the tea room's back door opens into the sleeping room
 assert.ok(g.edges.some(([a,b])=>[a,b].sort().join()===['under-sleeping-room','under-tea-room'].join()));
 const tea=an.snaps.find(s=>/^(tea|flop)\./.test(s.a)&&/^(tea|flop)\./.test(s.b));assert.ok(tea&&[tea.a,tea.b].includes('tea.n1')&&[tea.a,tea.b].includes('flop.s1'),'the hidden back door (n1) meets the sleeping room\'s door');});

test('the fight pit is never on the way between two other places (the walk graph, and real NPC routes round it)',()=>{
 const g=U.graph(),pit='under-fight-pit',deg=g.edges.filter(e=>e.includes(pit)).length;assert.equal(deg,1,'the pit is a dead end with one way in');
 const others=g.nodes.filter(n=>n!==pit);
 for(const a of others)for(const b of others){if(a===b)continue;const p=U.path(a,b,pit);assert.ok(p,a+' to '+b+' without the pit');const full=U.path(a,b);assert.ok(!full.includes(pit),a+' to '+b+': the shortest way never goes through the pit');}
 // NPC routes (npc-escort.js route over npc-areas.js ground) between a spread of places: every step on walkable ground, never inside the pit
 const ar=A.get('underground'),pr=U.pit(),P=A.places().filter(p=>p.area==='underground');assert.ok(P.length>=15);
 const inW=(x,z)=>ar.walk.some(w=>!w.adult&&x>w.x0-.06&&x<w.x1+.06&&z>w.z0-.06&&z<w.z1+.06)&&!ar.obstacles.some(o=>x>o[0]-.1&&x<o[1]+.1&&z>o[2]-.1&&z<o[3]+.1);
 const pick=['under-checkpoint-avenue','under-checkpoint-oldtown','under-checkpoint-farsouth','under-tea-room','under-sleeping-room','under-mahjong','under-food-stall','under-alcove-3','under-alcove-6','under-fight-pit-passage'].map(id=>P.find(p=>p.id===id));
 for(const a of pick)for(const b of pick){if(a===b)continue;let prev=a;for(const q of E.route(a,b,'underground')){const d=Math.hypot(q.x-prev.x,q.z-prev.z),n=Math.max(1,Math.ceil(d/.1));
   for(let k=0;k<=n;k++){const x=prev.x+(q.x-prev.x)*k/n,z=prev.z+(q.z-prev.z)*k/n;assert.ok(inW(x,z),a.id+' to '+b.id+': off the ground at '+x.toFixed(2)+','+z.toFixed(2));assert.ok(!(x>pr[0]&&x<pr[1]&&z>pr[2]&&z<pr[3]),a.id+' to '+b.id+' goes into the pit');}prev=q;}}});

test('the player walks it: from each stair door to every place, room doors opening, never outside the network; the tea room\'s hidden passage is wide enough',()=>{
 const L=N.layout('street','underground');assert.equal(L.quarter,'underground');
 const opened=L.solids.filter(s=>s.door&&!String(s.door).startsWith('street|'));for(const s of opened)s.open=true;   // the sliding doors open for the player (module-build.js tick)
 try{for(const e of U.ENTRANCES){const a=U.arrive(e.id);assert.equal(X.blocked(a.spawn[0],a.spawn[2],L),false,e.id+' spawn');
   const G=.1,key=(i,j)=>i+':'+j,seen=new Set(),todo=[[Math.round(a.spawn[0]/G),Math.round(a.spawn[2]/G)]],hit=new Set();seen.add(key(...todo[0]));
   while(todo.length){const [i,j]=todo.pop(),x=i*G,z=j*G;const pl=U.placeAt(x,z);assert.ok(pl,e.id+': the walker got outside the network at '+x.toFixed(1)+','+z.toFixed(1));hit.add(pl);
    for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const k=key(i+di,j+dj);if(seen.has(k))continue;seen.add(k);if(!X.blocked((i+di)*G,(j+dj)*G,L))todo.push([i+di,j+dj]);}}
   assert.deepEqual([...hit].sort(),IDS.slice().sort(),e.id+': every place is reached on foot');}}
 finally{for(const s of opened)s.open=false;}});

test('the stair doors: down from each landing, up to the same landing; the checkpoint door stands where the stair door is (the Avenue\'s within 1.2 m)',()=>{
 const D=U.doors();assert.deepEqual(D.map(d=>d.id),BA.UNDERGROUND_ENTRANCES.map(u=>u.id));
 for(const d of D){assert.ok(d.city&&d.inside,d.id);const off=Math.hypot(d.city.x-d.inside.x,d.city.z-d.inside.z);assert.ok(off<=1.2,d.id+' '+off.toFixed(2));
  const up=U.leave(d.id),u=BA.UNDERGROUND_ENTRANCES.find(x=>x.id===d.id);assert.equal(up.quarter,u.quarter);assert.equal(BA.groundAt(up.spawn[0],up.spawn[2]),-3,'on the landing');
  const city=N.layout('street',u.quarter);assert.equal(X.blocked(up.spawn[0],up.spawn[2],city),false,d.id+' landing is open floor');assert.equal(Q.quarterAt(up.spawn[0],up.spawn[2]),u.quarter);
  const down=U.arrive(d.id);assert.equal(down.quarter,'underground');assert.equal(Q.quarterAt(down.spawn[0],down.spawn[2]),'underground');assert.ok(U.placeById(d.place).mods.includes(U.modAt(down.spawn[0],down.spawn[2]).id),'arrives in its checkpoint');}
 // the prompts: the stair door's on the street layout of its quarter (ncz-underground-integration.js adds it in the browser), the way up in the network
 const L=N.layout('street','underground');for(const e of U.ENTRANCES)assert.ok(L.interactions.some(i=>i.action==='under-up'&&i.entrance===e.id),e.id+' way up');
 assert.ok(fs.readFileSync(path.join(ROOT,'void-runner/ncz-underground-integration.js'),'utf8').includes("'GO DOWN INTO THE TUNNELS'"));});

test('in TRUE world metres under the city: no tunnel ground meets any street area above, the floor is 3 m down, the trunk runs north-south on the west side',()=>{
 const ar=A.get('underground');assert.equal(U.Y,-3);for(const w of ar.walk)assert.equal(w.y,-3);
 for(const a of A.list().filter(a=>a.id!=='underground'&&a.scene==='street'))for(const w of a.walk)for(const v of ar.walk)assert.ok(!(w.x0<v.x1&&w.x1>v.x0&&w.z0<v.z1&&w.z1>v.z0),'tunnel ground '+v.name+' overlaps '+a.id+' '+w.name);
 for(const q of Q.IDS.filter(q=>q!=='underground'))for(const r of [...Q.QUARTERS[q].streets,...(Q.QUARTERS[q].places||[])])for(const m of U.MODS){const g=U.ground(m);assert.ok(!(r[0]<g[1]&&r[1]>g[0]&&r[2]<g[3]&&r[3]>g[2]),m.id+' meets a '+q+' street');}
 const trunk=U.MODS.filter(m=>['under-trunk-north','under-trunk-south'].includes(U.PLACE_OF[m.id])).map(U.footprint);assert.ok(trunk.every(r=>r[0]===trunk[0][0]&&r[1]===trunk[0][1]),'one straight column');
 assert.ok(Math.max(...trunk.map(r=>r[3]))>5&&Math.min(...trunk.map(r=>r[2]))<-184,'from under the Avenue to under Far South');assert.ok(trunk[0][1]<2,'west of every street');});

test('people: walkable for Reverie, Lace and young made characters everywhere but the fight pit; adults may go in; no crowd; zones stay friendly',()=>{
 const tea=U.placeById('under-tea-room').at,pit=U.placeById('under-fight-pit').rects[0],pc={x:(pit[0]+pit[1])/2+1.3,z:(pit[2]+pit[3])/2+1.3};
 for(const p of A.places().filter(p=>p.area==='underground')){const c=A.check(p);assert.ok(c.ok,p.id+': '+c.why);assert.equal(c.area,'underground');assert.equal(A.groundY(p),-3);}
 assert.ok(!A.places().some(p=>p.id==='under-fight-pit'),'the pit is not offered as a spot to everyone');
 const c=A.check(pc);assert.equal(c.ok,false);assert.equal(c.kind,'rule');assert.match(c.why,/fight pit/);assert.equal(A.check(pc,null,undefined,{adult:true}).ok,true,'an adult made character may stand there');
 assert.deepEqual(E.ADULT_ROOMS,['fight-pit'],'the module rule is the same room');
 assert.deepEqual(A.enter('underground'),{walk:'sacramento',quarter:'underground'});assert.deepEqual(A.here('street','underground'),['underground']);
 // the street crowd never comes down: the nightlife crowd is started by the city build only, which the underground's build replaces
 const src=fs.readFileSync(path.join(ROOT,'void-runner/neochinatown.js'),'utf8');assert.match(src,/QK==='underground'&&UGM\(\)\)\{[^]*?nightlife:null/);
 // the server's copy (admin inventory) has the area, its pit rule and its adult ground
 const inv=JSON.parse(fs.readFileSync(path.join(ROOT,'void_runner_admin_inventory.json'),'utf8')),ia=inv.npcPaths.areas.areas.find(a=>a.id==='underground');
 assert.ok(ia&&ia.walk.length&&ia.no.some(n=>n.rule&&n.adult)&&ia.adultWalk.length,'admin inventory regenerated');
 // alcove seats are data for the placement tools
 assert.equal(U.SEATS.length,6);for(const s of U.SEATS)assert.ok(U.placeAt(s.x,s.z)===s.place);
 assert.ok(tea);});

test('the mission arrow routes from the street down the stairs, through the tunnels and back up',()=>{
 const G=GR.graphFor('neochinatown');
 const goal=U.placeById('under-tea-room').at;
 for(const [q,from] of [['avenue',{x:25,z:6}],['oldtown',{x:15,z:-75}],['far-south',{x:36,z:-190}]]){const r=GR.plan(G,{...from,quarter:q},{x:goal[0],z:goal[1]});assert.ok(r.some(w=>/^stairs:/.test(w.id)),q+': down a stairwell');assert.ok(r.some(w=>/tea\.s1/.test(w.id)),q+': in through the tea room\'s front door');}
 const up=GR.plan(G,{x:goal[0],z:goal[1],quarter:'underground'},{x:61,z:-160});assert.ok(up.some(w=>w.id==='stairs:under-farsouth<'),'up the Far South stairs to Far South\'s Main Street');
 const pitGoal=U.placeById('under-sleeping-room').at,r2=GR.plan(G,{x:-2.7,z:-150,quarter:'underground'},{x:pitGoal[0],z:pitGoal[1]});assert.ok(!r2.some(w=>/pit\./.test(w.id)),'never through the pit');
 // a follower walking the arrow's waypoints from the Old Town yard reaches the sleeping room's region
 const f=GR.follower();let p={x:15,z:-75};const t={x:pitGoal[0],z:pitGoal[1]};let out=null;
 for(let i=0;i<4000;i++){out=f.update({graph:G,scene:'neochinatown',area:'street',quarter:Q.quarterAt(p.x,p.z)||'oldtown',player:p,goal:t,key:'k',dt:.05});if(out.final&&Math.hypot(t.x-p.x,t.z-p.z)<.5)break;
  const w=out.waypoint;if(/^stairs:/.test(w.id)&&Math.hypot(w.x-p.x,w.z-p.z)<1.2){const e=w.id.slice(7,-1),a=w.id.endsWith('>')?U.arrive(e):U.leave(e);p={x:a.spawn[0],z:a.spawn[2]};continue;}   // the door's prompt
  const d=Math.hypot(w.x-p.x,w.z-p.z),s=Math.min(.25,d);p={x:p.x+(w.x-p.x)/(d||1)*s,z:p.z+(w.z-p.z)/(d||1)*s};}
 assert.ok(Math.hypot(t.x-p.x,t.z-p.z)<.6,'reached the sleeping room ('+p.x.toFixed(1)+','+p.z.toFixed(1)+')');});

test('places, multiplayer and the build wiring',()=>{
 for(const id of IDS){const n=PL.node(id);assert.ok(n,id);assert.match(PL.chain(id),/The Underground · NeoChinatown/);}
 const t=U.placeById('under-tea-room').at;assert.equal(PL.at({scene:'neochinatown',x:t[0],z:t[1]})[0],'under-tea-room');
 // multiplayer: the network shares the street's hub room; a player down there reports x + 2000, inside the hub's bounds for that room
 const rp=fs.readFileSync(path.join(ROOT,'void-runner/remote-players.js'),'utf8'),hub=require('../tools/district-hub/protocol.cjs'),room=hub.ROOMS['neochinatown-street'],ex=U.extent();
 const shift=+/UNDER_SHIFT=(\d+)/.exec(rp)[1];assert.ok(ex[0]+shift>room.x[0]&&ex[1]+shift<room.x[1]&&ex[1]<shift/2,'shifted x stays in the room and apart from the city');assert.ok(Q.QUARTERS.underground&&!Q.QUARTERS.underground.gates.length);
 const html=fs.readFileSync(path.join(ROOT,'void-runner.html'),'utf8'),i0=html.indexOf('ncz-underground.js'),i1=html.indexOf('ncz-underground-integration.js');
 assert.ok(i0>html.indexOf('ncz-backalleys.js')&&i0<html.indexOf('npc-areas.js')&&i0<html.indexOf('ncz-quarters.js'),'loaded before the areas and the quarters');assert.ok(i1>html.indexOf('ncz-backalleys-integration.js')&&i1<html.indexOf('ncz-gate-transit.js'));
 assert.match(fs.readFileSync(path.join(ROOT,'void-runner-sw.js'),'utf8').split('\n')[3],/^const BUILD='\d{4}-\d{2}-\d{2}-[a-z0-9-]+';$/);});
