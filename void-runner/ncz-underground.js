/* THE UNDERGROUND: ONE TUNNEL NETWORK UNDER NEOCHINATOWN (the owner, 20 Nov 2026: "all three entrances connect into one network. add the fighting pit but make it so that npc can
   walk to every other area without having to walk through the fighting pit area. add the tea room with the sleeping room connected to the back of it. the mahjong parlour.
   the food stall. maybe small alcoves along the way with seats, lights, etc."). ONE FILE HOLDS THE LAYOUT, THE PLACES AND THE RULES (pure: Node tests and the browser) and
   draws the network (build(): the modules' own 3D, module-build.js, plus the alcoves' dressing).
     WHAT IT IS  a quarter of the NeoChinatown street of its own (ncz-quarters.js `underground`; walkingLocation id 'neochinatown', area 'street', quarter 'underground'): a
                 SHARED PUBLIC place like the streets (not a mission location), entered through the steel door at the foot of any of the three alley stairwells
                 (ncz-backalleys.js UNDERGROUND_ENTRANCES) and left by the same door. Only this network is built in that quarter (neochinatown.js hands the build over).
     WHERE       in TRUE world metres under the city (x east, z north), the floor 3 m below the street (Y), the same depth as the stairwells' landings. The 2 m module grid is
                 offset (OFF) so the Old Town and Far South checkpoint doors stand exactly where their stair doors are; the Avenue's is 1.1 m short of it (one 2 m grid cannot
                 meet all three; its exit door's dark vestibule fills the gap). The trunk runs north-south 3 m west of the city's west edge (x -3.7..-1.7), clear of every
                 walkable street rectangle of the quarters above, so a point is never in two areas (tests/underground.test.cjs).
     HOW         the existing underground modules (modules.js): tunnel tubes (seamless), junctions, lantern tunnels, the gang checkpoint, the tea room, the sleeping room,
                 mahjong, the food stall, the fight pit, as ONE module location ({modules, exits}) laid out by modules.js layout() with a fixed grid offset.
     PLACES      stable ids (the editor's place list, mission steps, "Giver waits at"): PLACES below. The fight pit is a dead end off its own passage: no way between any
                 two other places passes through it (graph(); tested).
     NPCs        placed and routed people only (no street crowd): npc-areas.js area `underground` (walk(), obstacles(), the pit adults-only like NULL).
   Nothing here is saved beyond the quarter flag the street already keeps (story.flags.quarter). */
(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports;
 const MOD=()=>{try{return node?require('./modules.js'):root.VoidModules||null;}catch{return null;}};
 const BAL=()=>{try{return node?require('./ncz-backalleys.js'):root.VoidBackAlleys||null;}catch{return null;}};
 const ID='underground',NAME='The Underground',Y=-3,OFF=[.27,-.5],GRID=2,TRUNK=-2;
 const cx=i=>GRID*i+OFF[0],cz=j=>GRID*j+OFF[1];   // a grid cell's west / south edge in world metres
 // module sizes in cells (w across x, d along z, before turning); tests check them against modules.js TYPES
 const SIZE={'tunnel':[1,3],'tunnel-lantern':[1,3],'tunnel-mid':[1,2],'tunnel-short':[1,1],'tunnel-junction':[1,1],'tunnel-lantern-junction':[1,1],'gang-vestibule':[2,3],'food-stall':[2,2],'mahjong':[3,3],'tea-under':[3,3],'flophouse':[3,3],'fight-pit':[4,4]};
 /* ---- the places: id (stable), name, kind, and (filled below) the modules they are made of ---- */
 const PLACES=[
  ['under-checkpoint-avenue','Tunnel checkpoint under the Avenue','checkpoint'],['under-avenue-passage','Passage from the Avenue stairs','passage'],
  ['under-trunk-north','North trunk tunnel','trunk'],['under-alcove-1','Alcove by the vending machine','alcove'],['under-food-stall','Underground food stall','room'],
  ['under-alcove-2','Alcove with the wall shrine','alcove'],['under-mahjong','Mahjong parlour','room'],
  ['under-checkpoint-oldtown','Tunnel checkpoint under Old Town','checkpoint'],['under-oldtown-passage','Passage from the Old Town stairs','passage'],
  ['under-trunk-south','South trunk tunnel','trunk'],['under-alcove-3','Alcove with the old TV','alcove'],['under-tea-room','Underground tea room','room'],
  ['under-sleeping-room','Sleeping room behind the tea room','room'],['under-alcove-4','Alcove by the drinks cooler','alcove'],
  ['under-fight-pit-passage','Passage to the fight pit','passage'],['under-fight-pit','Fight pit','room'],['under-alcove-5','Alcove by the valve wheel','alcove'],
  ['under-alcove-6','Alcove with the lantern','alcove'],
  ['under-checkpoint-farsouth','Tunnel checkpoint under Far South','checkpoint'],['under-farsouth-passage','Passage from the Far South stairs','passage']].map(([id,name,kind])=>({id,name,kind,mods:[]}));
 const placeById=id=>PLACES.find(p=>p.id===id)||null;
 /* ---- the modules: {id, type, x, z (cell of the footprint's south-west corner), rot (quarter turns clockwise), floor 0} ---- */
 const MODS=[],PLACE_OF={};
 const put=(id,type,x,z,rot,place)=>{MODS.push({id,type,x,z,rot:rot||0,floor:0});PLACE_OF[id]=place;placeById(place).mods.push(id);};
 let nT=0;
 // a straight tube run over cells a..b (inclusive) of one row (axis 'x') or column (axis 'z'): 6 m pieces, then 4 m / 2 m to fit
 function run(place,axis,fixed,a,b,lantern){let c=a;while(c<=b){const left=b-c+1,d=left===4?2:left>=3?3:left,type=d===3?(lantern?'tunnel-lantern':'tunnel'):d===2?'tunnel-mid':'tunnel-short',id='t'+(++nT);
   if(axis==='z')put(id,type,fixed,c,0,place);else put(id,type,c,fixed,1,place);c+=d;}}
 const LANTERN=[[-17,-8],[-33,-23],[-57,-47]];   // the trunk's lantern stretches: round the food stall, the mahjong parlour and the tea room
 const lit=j=>LANTERN.some(([lo,hi])=>j>=lo&&j<=hi);
 // the trunk's junctions, north to south: [row, place, what hangs off it]
 const JUNCTIONS=[[2,'under-trunk-north','avenue'],[-4,'under-trunk-north','alcove-1:w'],[-12,'under-trunk-north','food'],[-20,'under-trunk-north','alcove-2:e'],[-28,'under-trunk-north','mahjong'],
  [-36,'under-trunk-north','oldtown'],[-44,'under-trunk-south','alcove-3:w'],[-52,'under-trunk-south','tea'],[-62,'under-trunk-south','alcove-4:e'],[-70,'under-trunk-south','pit'],
  [-80,'under-trunk-south','alcove-5:w'],[-87,'under-trunk-south','alcove-6:e'],[-93,'under-trunk-south','farsouth']];
 JUNCTIONS.forEach(([j,place,what],k)=>{put('j'+(k+1),lit(j)?'tunnel-lantern-junction':'tunnel-junction',TRUNK,j,0,place);
  const next=JUNCTIONS[k+1];if(next){const lo=next[0]+1,hi=j-1;if(lo<=hi){// the run between this junction and the next, cut where a lantern stretch starts or ends
    let a=lo;for(let c=lo;c<=hi+1;c++){if(c===hi+1||lit(c)!==lit(a)){run(c>-37&&a>-37?'under-trunk-north':'under-trunk-south','z',TRUNK,a,c-1,lit(a));a=c;}}}}
  const al=/^alcove-(\d):([we])$/.exec(what);if(al)put('al'+al[1],'tunnel-short',al[2]==='w'?TRUNK-1:TRUNK+1,j,al[2]==='w'?1:3,'under-alcove-'+al[1]);});
 // the three ways in: a passage east from the trunk to a corner under the checkpoint (or beside it), then the gang checkpoint with its outer door (e2) facing the stair door
 run('under-avenue-passage','x',2,TRUNK+1,5,false);put('ja','tunnel-junction',6,2,0,'under-avenue-passage');put('ck-av','gang-vestibule',6,3,0,'under-checkpoint-avenue');
 run('under-oldtown-passage','x',-36,TRUNK+1,0,false);put('jo','tunnel-junction',1,-36,0,'under-oldtown-passage');put('ck-ot','gang-vestibule',1,-39,0,'under-checkpoint-oldtown');
 run('under-farsouth-passage','x',-93,TRUNK+1,11,false);put('jf','tunnel-junction',12,-93,0,'under-farsouth-passage');put('ck-fs','gang-vestibule',12,-96,0,'under-checkpoint-farsouth');
 // the rooms, all west of the trunk, their front doors on it (turned so the front door faces east)
 put('food','food-stall',-4,-12,3,'under-food-stall');
 put('mj','mahjong',-5,-29,3,'under-mahjong');
 put('tea','tea-under',-5,-53,3,'under-tea-room');put('flop','flophouse',-8,-53,3,'under-sleeping-room');   // the sleeping room's front door meets the tea room's hidden back door
 put('pp','tunnel',-5,-70,1,'under-fight-pit-passage');put('pit','fight-pit',-9,-71,0,'under-fight-pit');   // the fight pit: a dead end at the end of its own passage
 /* ---- the entrances: the stairwell (ncz-backalleys.js) and the checkpoint behind its door ---- */
 const ENTRANCES=[{id:'under-avenue',vest:'ck-av',quarter:'avenue',place:'under-checkpoint-avenue',name:'the Avenue (north yard)'},{id:'under-oldtown',vest:'ck-ot',quarter:'oldtown',place:'under-checkpoint-oldtown',name:'Old Town (the yard by NULL)'},
  {id:'under-farsouth',vest:'ck-fs',quarter:'far-south',place:'under-checkpoint-farsouth',name:'Far South (the west yard)'}];
 /* ---- footprints (world metres) ---- */
 function footprint(m){const s=SIZE[m.type],odd=(m.rot|0)%2,w=odd?s[1]:s[0],d=odd?s[0]:s[1];return [cx(m.x),cx(m.x+w),cz(m.z),cz(m.z+d)];}
 const modById=id=>MODS.find(m=>m.id===id)||null;
 for(const p of PLACES){p.rects=p.mods.map(id=>footprint(modById(id)));const r=p.rects[0];p.at=[(r[0]+r[1])/2,(r[2]+r[3])/2];}
 const inR=(r,x,z,m=0)=>x>r[0]-m&&x<r[1]+m&&z>r[2]-m&&z<r[3]+m;
 const rects=()=>MODS.map(footprint);
 const modAt=(x,z,m=0)=>MODS.find(q=>inR(footprint(q),x,z,m))||null;
 const placeAt=(x,z)=>{const q=modAt(x,z,1e-6);return q?PLACE_OF[q.id]:null;};
 const inside=(x,z,m=0)=>!!modAt(x,z,m);
 const extent=()=>{let a=[1e9,-1e9,1e9,-1e9];for(const r of rects())a=[Math.min(a[0],r[0]),Math.max(a[1],r[1]),Math.min(a[2],r[2]),Math.max(a[3],r[3])];return a;};
 /* ---- the alcoves: what stands in each (local metres of the 2 m tube piece: z -1 is its back wall, +1 opens onto the trunk; x across) ----
    furniture [x0, x1, z0, z1, height, name] is solid for the player and an obstacle for NPCs; `seat` is where a person sits on it (local x, z, facing yaw, seat height). */
 const KIT={bench:{furn:[.5,.9,-.8,.45,.5,'a bench'],seat:[.62,-.15,-Math.PI/2,.46]},crates:{furn:[.45,.9,-.85,-.05,.55,'crates to sit on'],seat:[.6,-.45,-Math.PI/2,.55]},
  vending:{furn:[-.5,.32,-.95,-.3,1.95,'a vending machine']},cooler:{furn:[-.5,.25,-.95,-.4,1.45,'a drinks cooler']},tv:{furn:[-.45,.15,-.95,-.4,.55,'a crate with an old TV']},
  noodles:{furn:[-.55,-.1,-.95,-.55,.35,'a pile of noodle cups']},valve:{furn:[-.6,-.1,-.95,-.75,1.4,'a valve manifold']},shrine:{},graffiti:{},lamp:{},lantern:{},pipes:{}};
 const ALCOVES=[{n:1,kit:['bench','vending','lamp','graffiti']},{n:2,kit:['crates','shrine','lantern','noodles']},{n:3,kit:['bench','tv','lamp','graffiti']},
  {n:4,kit:['crates','cooler','lantern','graffiti']},{n:5,kit:['bench','valve','lamp','pipes']},{n:6,kit:['bench','shrine','lantern','noodles']}].map(a=>({...a,id:'under-alcove-'+a.n,mod:'al'+a.n}));
 // local (x, z) of a tube piece -> world: the module's turn (modules.js rotP: rot 1 sends local -z to the west, rot 3 to the east)
 function localToWorld(m,x,z){const s=SIZE[m.type],odd=m.rot%2,w=(odd?s[1]:s[0])*GRID,d=(odd?s[0]:s[1])*GRID,ccx=cx(m.x)+w/2,ccz=cz(m.z)+d/2,c=[1,0,-1,0][m.rot],sn=[0,1,0,-1][m.rot];return [ccx+x*c+z*sn,ccz-x*sn+z*c];}
 /* A facing in a module's own frame -> the world's (yaw 0 = +z, PI/2 = +x): the module's turn adds rot quarter turns (localToWorld). (20 Nov 2026: the spots and
    seats subtracted them, so every turned module's people and seats faced the wrong way.) */
 const turnYaw=(yaw,rot)=>{const a=yaw+(rot|0)*Math.PI/2,t=Math.atan2(Math.sin(a),Math.cos(a));return +(Math.abs(t+Math.PI)<1e-9?Math.PI:t).toFixed(4)||0;};
 const localBox=(m,[x0,x1,z0,z1])=>{const a=localToWorld(m,x0,z0),b=localToWorld(m,x1,z1);return [Math.min(a[0],b[0]),Math.max(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[1],b[1])];};
 const alcoveFurniture=()=>ALCOVES.flatMap(a=>{const m=modById(a.mod);return a.kit.filter(k=>KIT[k].furn).map(k=>{const f=KIT[k].furn;return {id:a.id+'-'+k,place:a.id,rect:localBox(m,f),h:f[4],name:f[5]};});});
 const SEATS=ALCOVES.flatMap(a=>{const m=modById(a.mod);return a.kit.filter(k=>KIT[k].seat).map(k=>{const s=KIT[k].seat,[x,z]=localToWorld(m,s[0],s[1]);return {id:a.id+'-seat',place:a.id,x:+x.toFixed(2),z:+z.toFixed(2),yaw:turnYaw(s[2],m.rot),h:s[3]};});});
 /* ---- the module location, its analysis and its walking layout (modules.js; lazy: in the browser modules.js loads after this file) ---- */
 const LOC={id:ID,entry:'none.x',exits:ENTRANCES.map(e=>e.vest+'.e2'),modules:MODS.map(m=>({...m}))};
 let AN=null,LAY=null;
 const ready=()=>!!(MOD()&&MOD().analyse);
 function analysis(){if(!AN){const M=MOD();if(!M)return null;AN=M.analyse(LOC);}return AN;}
 /* The walking layout of the whole network: {solids, interactions, cluster, spawn, yaw}. Built once (the door solids are shared with the 3D build, which opens them). */
 function walking(){if(LAY)return LAY;const M=MOD(),an=analysis();if(!M||!an)return null;
  const cl=an.clusterOf('j1');const def=M.layout({loc:LOC,key:'underground',id:ID,mission:null,hacked:[]},cl.id,{offset:OFF});
  const exits=new Map(ENTRANCES.map(e=>['street|'+e.vest+'.e2',e]));
  for(const d of def.cluster.doors){delete d.ap;if(exits.has(d.id)){d.shut=true;d.entrance=exits.get(d.id).id;}}
  const say=(type,obj)=>{const t=M.TYPES[type]||{};return (t.say&&t.say[obj])||null;};
  const inter=[];for(const i of def.interactions){
   if(i.action==='mod-exit'){const e=exits.get(i.door);if(e)inter.push({id:'under-up-'+e.id,label:'GO UP THE STAIRS TO THE STREET',position:[i.position[0],Y+1.6,i.position[2]],action:'under-up',entrance:e.id,door:i.door,range:1.6});continue;}
   if(i.action==='mod-use'&&i.object!=='lights'){const m=modById(i.mod),text=m&&say(m.type,i.object);if(text)inter.push({id:'under-'+i.id,label:i.label,position:[i.position[0],Y+i.position[1],i.position[2]],action:'under-look',text,place:PLACE_OF[i.mod],range:i.range});}}
  const solids=def.solids.map(s=>({...s,position:[s.position[0],s.position[1]+Y,s.position[2]]}));
  // the alcoves' furniture
  for(const f of alcoveFurniture())solids.push({id:'under-'+f.id,position:[(f.rect[0]+f.rect[1])/2,Y+f.h/2,(f.rect[2]+f.rect[3])/2],size:[f.rect[1]-f.rect[0],f.h,f.rect[3]-f.rect[2]]});
  // the module build reads the door solids by id (the same objects open and close for the walk)
  const doorSolid=new Map(solids.filter(s=>s.door).map(s=>[s.door,s]));
  LAY={solids,interactions:inter,cluster:def.cluster,doorSolid,style:'tunnel'};return LAY;}
 /* The checkpoint door of an entrance underground: {x, z} of its middle, the way into the network (n: west), spawn inside facing west. */
 function inside_(e){const w=walking();if(!w)return null;const d=w.cluster.doors.find(x=>x.entrance===e.id);if(!d)return null;return {x:d.x,z:d.z,spawn:[+(d.x-1.25).toFixed(2),1.7,d.z],yaw:-Math.PI/2};}
 const entrance=id=>ENTRANCES.find(e=>e.id===id)||null;
 /* Coming down: where the player stands in the network after the stair door at the foot of entrance `id` ({spawn, yaw, quarter:'underground'}). */
 function arrive(id){const e=entrance(id),i=e&&inside_(e);return i?{quarter:ID,spawn:i.spawn,yaw:i.yaw,entrance:id}:null;}
 /* Going up: where the player stands at the foot of the stairs in the city ({quarter, spawn, yaw}: on the landing, facing up the stairs). */
 function leave(id){const e=entrance(id),B=BAL(),u=e&&B&&B.UNDERGROUND_ENTRANCES.find(x=>x.id===id);if(!u)return null;const f=u.facing;return {quarter:u.quarter,spawn:[+(u.bottom[0]+f[0]*.95).toFixed(2),1.7,+(u.bottom[2]+f[1]*.95).toFixed(2)],yaw:u.yaw,entrance:id};}
 /* The city door (the foot of the stairs) and the checkpoint door for each entrance, for the editor, the arrow and the tests. */
 function doors(){const B=BAL();return ENTRANCES.map(e=>{const u=B&&B.UNDERGROUND_ENTRANCES.find(x=>x.id===e.id),i=inside_(e);return {id:e.id,quarter:e.quarter,place:e.place,name:e.name,city:u?{x:u.bottom[0],z:u.bottom[2],yaw:u.yaw}:null,inside:i?{x:i.x,z:i.z}:null};});}
 /* ---- the walk graph: places joined where their modules meet through a door or an open tunnel seam ---- */
 function graph(){const an=analysis();if(!an)return null;const M=MOD(),nodes=PLACES.map(p=>p.id),edges=[];const seen=new Set();
  for(const s of an.snaps){const a=PLACE_OF[M.parseRef(s.a).mod],b=PLACE_OF[M.parseRef(s.b).mod];if(!a||!b||a===b)continue;const k=a<b?a+'|'+b:b+'|'+a;if(seen.has(k))continue;seen.add(k);edges.push([a,b]);}
  for(const e of ENTRANCES)edges.push(['street:'+e.id,e.place]);return {nodes:[...nodes,...ENTRANCES.map(e=>'street:'+e.id)],edges};}
 // the places on the shortest way from a to b (breadth first; `avoid`: a place never stepped into), or null
 function path(a,b,avoid){const g=graph();if(!g)return null;const adj=new Map(g.nodes.map(n=>[n,[]]));for(const [u,v] of g.edges){adj.get(u).push(v);adj.get(v).push(u);}
  const prev=new Map([[a,null]]),q=[a];while(q.length){const u=q.shift();if(u===b)break;for(const v of adj.get(u)||[]){if(prev.has(v)||v===avoid)continue;prev.set(v,u);q.push(v);}}
  if(!prev.has(b))return null;const out=[];for(let u=b;u!==null;u=prev.get(u))out.unshift(u);return out;}
 /* ---- for npc-areas.js: walkable ground (0.4 m in from the walls, open across tunnel seams, a strip through every door), floors, furniture, the fight pit (adults only) ---- */
 function walk(){const w=walking();if(!w)return [];const M=MOD(),out=[],ins=.4;
  for(const m of w.cluster.mods){const fp=[m.cx-m.w,m.cx+m.w,m.cz-m.d,m.cz+m.d],seam=new Set((m.seam||[]).map(e=>M.turnEdge(e,m.rot))),p=PLACE_OF[m.id],pl=placeById(p);
   out.push({x0:fp[0]+(seam.has('w')?0:ins),x1:fp[1]-(seam.has('e')?0:ins),z0:fp[2]+(seam.has('s')?0:ins),z1:fp[3]-(seam.has('n')?0:ins),name:pl.name,place:p,y:Y,adult:p==='under-fight-pit'});}
  for(const d of w.cluster.doors){if(d.seam||d.leads)continue;const a=M.parseRef(d.a).mod,b=d.b&&M.parseRef(d.b).mod,pa=PLACE_OF[a],pb=b&&PLACE_OF[b],own=pa==='under-fight-pit'||pb==='under-fight-pit',p=pa;const t=.32,n=.6;
   out.push(d.tg[0]?{x0:d.x-t,x1:d.x+t,z0:d.z-n,z1:d.z+n,name:placeById(p).name+' (doorway)',place:p,y:Y,adult:own}:{x0:d.x-n,x1:d.x+n,z0:d.z-t,z1:d.z+t,name:placeById(p).name+' (doorway)',place:p,y:Y,adult:own});}
  return out.map(r=>({...r,x0:+r.x0.toFixed(3),x1:+r.x1.toFixed(3),z0:+r.z0.toFixed(3),z1:+r.z1.toFixed(3)}));}
 function obstacles(){const w=walking();if(!w)return [];const out=[];for(const s of w.solids){if(/^(wall-|door:|vest-)/.test(s.id))continue;const [x,,z]=s.position,[sx,,sz]=s.size;
   const m=modAt(x,z),name=s.id.startsWith('under-')?(alcoveFurniture().find(f=>'under-'+f.id===s.id)||{}).name||'furniture':'the '+String(s.id).replace(/^[a-z0-9]+-/,'').replace(/-/g,' ')+(m?' ('+placeById(PLACE_OF[m.id]).name+')':'');
   out.push([+(x-sx/2).toFixed(3),+(x+sx/2).toFixed(3),+(z-sz/2).toFixed(3),+(z+sz/2).toFixed(3),name]);}return out;}
 const PIT=()=>placeById('under-fight-pit').rects[0];
 /* Named places for npc-areas.js places() (the ChatGPT prompt, the editor's spot list): a spot near the middle of each place. */
 function places(){return PLACES.map(p=>{const r=p.rects[p.kind==='trunk'?Math.floor(p.rects.length/2):p.rects.length-1]||p.rects[0];return {id:p.id,name:p.name,area:ID,x:(r[0]+r[1])/2,z:(r[2]+r[3])/2};});}
 /* Spots for people the owner places later (modules.js spots: doormen, the tea room host, the cook ...), in world metres, by place. Data only. */
 function spots(){const M=MOD();if(!M)return [];const out=[];for(const m of MODS){const t=M.TYPES[m.type];for(const [name,x,z,yaw] of (t&&t.spots)||[]){const [wx,wz]=localToWorld(m,x,z);out.push({id:PLACE_OF[m.id]+'/'+name,place:PLACE_OF[m.id],x:+wx.toFixed(2),z:+wz.toFixed(2),yaw:turnYaw(yaw||0,m.rot)});}}return out;}
 /* ---- for the mission arrow (guide-route.js): one region per module, a portal at every door and tunnel seam, and one at each stair door to the city ---- */
 // the network's ground for "which part am I in" (the arrow, the quarter): each module's footprint, the checkpoints 0.3 m short of their outer (east) wall, which stands
 // where the stairwell's end wall does, at the edge of the yard above
 const ground=m=>{const r=footprint(m);return m.type==='gang-vestibule'?[r[0],r[1]-.3,r[2],r[3]]:r;};
 function regions(){return MODS.map(m=>({id:'ug:'+m.id,rects:[ground(m)],quarter:ID}));}
 function portals(){const w=walking();if(!w)return [];const M=MOD(),out=[];
  for(const d of w.cluster.doors){const a=M.parseRef(d.a).mod;if(d.leads){const e=ENTRANCES.find(x=>x.vest===a),u=BAL()&&BAL().UNDERGROUND_ENTRANCES.find(x=>x.id===e.id);if(!u)continue;
    out.push({id:'stairs:'+e.id,a:'q:'+e.quarter,b:'ug:'+a,x:u.bottom[0],z:u.bottom[2],nx:-u.facing[0],nz:-u.facing[1],half:1.1,stairs:e.id});continue;}
   const b=M.parseRef(d.b).mod,n=d.n;// d.n points out of d.side's module
   const from=M.parseRef(d.side).mod,to=from===a?b:a;out.push({id:'ug-door:'+d.id,a:'ug:'+from,b:'ug:'+to,x:d.x,z:d.z,nx:n[0],nz:n[1],half:d.seam?.9:.52});}
  return out;}
 /* ---- the 3D (browser): the modules (module-build.js, as one network) and the alcoves' dressing ---- */
 function build({scene,parent,quality}){const B=root.BABYLON,M=MOD(),w=walking();if(!B||!M||!M.build||!w)return null;const low=quality==='low';
  const base=new B.TransformNode('underground-root',scene);base.parent=parent;base.position.y=Y;
  const def={modular:true,network:true,cluster:w.cluster,solids:w.solids,style:'tunnel',dress:k=>dress(k)};
  function dress(k){const {S,box2,cyl,plane,graffiti,bulb,lantern,lampOf,paperOf,signTex,P,crate,decal,puddleMat,stainMat,pipeM}=k;const H=Math.PI/2,Ch=2.6;
   for(const a of ALCOVES){k.at(a.mod);const lamp=lampOf(a.mod);
    for(const it of a.kit){const f=KIT[it].furn;
     if(it==='bench'){box2(k.darkWood(),f[0]+.02,f[1]-.02,.42,.47,f[2]+.05,f[3]-.05);for(const z of [f[2]+.12,f[3]-.12])box2(S.dark,f[0]+.06,f[1]-.06,0,.42,z-.03,z+.03);box2(k.darkWood(),f[1]-.06,f[1]-.02,.6,.95,f[2]+.05,f[3]-.05);}
     else if(it==='crates'){if(low)box2(S.cardboard,f[0],f[1],0,f[4],f[2],f[3]);else{crate((f[0]+f[1])/2,f[2]+.2,.1,.5);crate((f[0]+f[1])/2,f[3]-.22,-.08,.5);}box2(P('cushion',{c:'#5a2a22',rough:1}),f[0]+.05,f[1]-.05,f[4],f[4]+.05,f[2]+.05,f[3]-.05);}
     else if(it==='vending'){box2(S.dark,f[0],f[1],0,f[4],f[2],f[3]);box2(P('vend-glow',{em:'#3a8aa0',unlit:true}),f[0]+.08,f[1]-.25,.75,1.75,f[3],f[3]+.01);box2(P('vend-panel',{em:'#c8a050',unlit:true}),f[1]-.2,f[1]-.06,1.1,1.5,f[3],f[3]+.01);box2(S.black,f[0]+.08,f[1]-.25,.2,.45,f[3],f[3]+.02);for(let y=.95;y<1.7;y+=.2)box2(S.dark,f[0]+.08,f[1]-.25,y,y+.03,f[3]+.01,f[3]+.02);for(let x=f[0]+.16;x<f[1]-.3;x+=.12)box2(S.dark,x,x+.015,.75,1.75,f[3]+.01,f[3]+.02);}
     else if(it==='cooler'){box2(S.gun,f[0],f[1],0,f[4],f[2],f[3]);box2(P('cooler-glow',{em:'#3e6670',unlit:true}),f[0]+.06,f[1]-.06,.15,f[4]-.18,f[3],f[3]+.01);for(let y=.35;y<f[4]-.2;y+=.32)box2(S.steel,f[0]+.08,f[1]-.08,y,y+.02,f[3]+.01,f[3]+.02);}
     else if(it==='tv'){box2(S.rust,f[0],f[1],0,.5,f[2],f[3]);box2(S.plastic,f[0]+.05,f[1]-.05,.5,.9,f[2]+.03,f[3]-.05);box2(P('tv-glow',{em:'#4a6a8a',unlit:true}),f[0]+.1,f[1]-.1,.56,.84,f[3]-.05,f[3]-.04);cyl(S.black,.01,.25,[(f[0]+f[1])/2,1.02,(f[2]+f[3])/2],5,0,.4);}
     else if(it==='noodles'){for(let i=0;i<7;i++){const x=f[0]+.08+(i%3)*.14,z=f[2]+.08+Math.floor(i/3)%2*.14,y=Math.floor(i/6)*.11;cyl(P('cup',{c:'#d8cdb8',rough:.6}),.1,.11,[x,.055+y,z],8,0,0,.08);}box2(S.cardboard,f[0],f[1],0,.04,f[2],f[3]);}
     else if(it==='valve'){box2(pipeM('#4a4e4a'),f[0],f[1],.1,f[4],f[2],f[2]+.12);cyl(S.red,.4,.04,[(f[0]+f[1])/2,1.15,f[2]+.2],16,H);cyl(pipeM('#5a5e5a'),.12,1.3,[(f[0]+f[1])/2,.65,f[2]+.1],10);}
     else if(it==='shrine'){box2(S.wood,-.35,.35,1.18,1.22,-.98,-.78);box2(S.red,-.12,.12,1.22,1.45,-.97,-.92);for(const x of [-.25,.22])cyl(P('candle',{em:'#ffb050',unlit:true}),.04,.07,[x,1.26,-.86],6);cyl(S.white,.08,.05,[0,1.245,-.85],10);}
     else if(it==='graffiti')graffiti(a.n%4,1.2,.8,-.88,1.5,0,-H);
     else if(it==='lamp'){box2(S.black,-.12,.12,2.05,2.25,-.97,-.85);box2(lamp,-.07,.07,2.07,2.12,-.9,-.84);}
     else if(it==='lantern')lantern(-.3,-.35,1.85,Ch,paperOf(a.mod),.32);
     else if(it==='pipes'){for(const y of [1.6,1.75])cyl(pipeM('#5a5246'),.09,1.9,[-.86,y,0],10,H);}}
    decal(puddleMat(),.8,.5,.1,.3);decal(stainMat(),.6,.5,-.3,-.6);}
   // wayfinding stencils where a passage leaves the trunk (plain words: the quarter above)
   const sign=(modId,text,x,z,ry)=>{k.at(modId);plane(P('stencil-'+text,{dyn:signTex(text,'#d8cfae','#1a1a18',512,96,'bold 46px monospace'),unlit:true}),1.05,.2,[x,1.95,z],ry);};
   sign('j1','↗ THE AVENUE',-.97,0,-H);sign('j6','→ OLD TOWN',-.97,0,-H);sign('j13','↘ FAR SOUTH',-.97,0,-H);sign('j10','← PIT',.97,0,H);k.at(null);}
  const h=M.build({scene,parent:base,quality,def});if(!h){base.dispose();return null;}
  return {...h,moduleDoors:h.doors,quarter:ID,gates:null,doors:null,streetPair:null,nightlife:null,dispose(){try{h.dispose();}catch{}try{base.dispose(false,true);}catch{}}};}
 const api={ground,ID,NAME,Y,OFF,GRID,TRUNK,SIZE,PLACES,MODS,PLACE_OF,ENTRANCES,ALCOVES,KIT,SEATS,LOC,cx,cz,footprint,rects,extent,modAt,placeAt,inside,ready,analysis,walking,arrive,leave,doors,graph,path,walk,obstacles,places,spots,regions,portals,alcoveFurniture,localToWorld,turnYaw,pit:PIT,build,
  placeById,get:placeById};
 if(node)module.exports=api;else root.VoidUnderground=api;
})(typeof globalThis!=='undefined'?globalThis:this);
