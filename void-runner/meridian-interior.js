/* Meridian's shared walkable plan, fittings and tagged activity points, in metres.
   Plan (David's top-down reference, 2026-10-18): HANGAR → HANGAR DOOR → NARROW CORRIDOR → BAR / SEATING.
   Walking in from the hangar (+z), the corridor is only a little wider than its door. Off its left side
   are the living area (stacked sleeping pods, lockers, washroom) and then the store. At the far end the
   corridor opens into one social hall: the Dead Channel bar along the left wall, seating across from it,
   observation windows on the right and at the end. The hangar keeps its ship, boarding and docking.
   `furniture`, `walls` and `floors` tell the art, fit-out and dressing passes (meridian-art.js,
   babylon-renderer.js, meridian-interior-kit.js) where things are, so they follow this plan. */
(function(root){
 // Room extents (x across, z forward from the hangar). Heights are ceiling heights.
 const R={
  hangar:{x0:-18,x1:18,z0:-26,z1:4,h:9},
  corridor:{x0:-2.2,x1:2.2,z0:4,z1:40,h:3.6},
  living:{x0:-15,x1:-2.2,z0:4,z1:22.5,h:3.6},
  store:{x0:-13,x1:-2.2,z0:22.5,z1:33.7,h:3.6},
  hall:{x0:-16,x1:16,z0:40,z1:62,h:5}
 };
 const openings={door:{width:3.2},living:[10.5,13.5],store:[25.5,30.5]};
 function layout(ship='starter'){
  const shell=[],solids=[],interactions=[],signs=[],activityPoints=[],walls=[],floors=[];
  function add(id,size,position,kind='hull',collision=true){const p={id,size,position,kind};shell.push(p);if(collision)solids.push(p);return p;}
  function sign(id,text,position,rotation=0){signs.push({id,text,position,color:'#d9b776',...(rotation?{rotation}:{})});}
  // A wall run along x or z at height h. normal: the side it is seen from (for the dressing pass).
  function wall(id,a,b,fixed,axis,h,normal,room,t=.4){
   const len=Math.abs(b-a),mid=(a+b)/2;
   if(axis==='z')add(id,[t,h,len],[fixed+(normal==='+x'?-t/2:t/2),h/2,mid]);else add(id,[len,h,t],[mid,h/2,fixed+(normal==='+z'?-t/2:t/2)]);
   walls.push({id,axis,fixed,from:Math.min(a,b),to:Math.max(a,b),h,normal,room});
  }
  // ---- The hangar (unchanged footprint): side walls, the mouth's jambs and header ----
  for(const side of [-1,1]){add('hangar-wall',[.6,9,30],[side*18,4.5,-11]);add('hangar-door-jamb',[8,9,.6],[side*14,4.5,-26]);}
  add('hangar-header',[20,2,.6],[0,8,-26]);
  walls.push({id:'hangar-side',axis:'z',fixed:17.7,from:-25.7,to:3.7,h:9,normal:'-x',room:'hangar'},{id:'hangar-side',axis:'z',fixed:-17.7,from:-25.7,to:3.7,h:9,normal:'+x',room:'hangar'},
   {id:'hangar-jamb',axis:'x',fixed:-25.7,from:10.3,to:17.7,h:9,normal:'+z',room:'hangar'},{id:'hangar-jamb',axis:'x',fixed:-25.7,from:-17.7,to:-10.3,h:9,normal:'+z',room:'hangar'});
  // The hangar's back wall, with the station door in the middle.
  const half=openings.door.width/2;
  for(const side of [-1,1]){add('hangar-back-wall',[18-half,9,.6],[side*(half+(18-half)/2),4.5,4]);walls.push({id:'hangar-back',axis:'x',fixed:3.7,from:side<0?-17.7:half,to:side<0?-half:17.7,h:9,normal:'-z',room:'hangar'});}
  add('hangar-door-lintel',[openings.door.width,9-3.4,.6],[0,3.4+(9-3.4)/2,4],'hull',false);
  const door=add('crew-pressure-door',[openings.door.width,3.4,.25],[0,1.7,4],'door');door.open=false;
  interactions.push({id:'crew-pressure-door',action:'station-door',door:'crew-pressure-door',label:'OPEN / CLOSE STATION DOOR',position:[0,1.6,3.5],range:2.8});
  sign('crew-pressure-door-sign','MERIDIAN / STATION',[0,4.6,3.6]);

  // ---- The narrow corridor: solid outer (right) wall with portholes; living area and store open off the left ----
  const C=R.corridor;
  wall('corridor-wall-right',4.3,40,C.x1,'z',C.h,'-x','corridor');
  wall('corridor-wall-left',4.3,openings.living[0],C.x0,'z',C.h,'+x','corridor');
  wall('corridor-wall-left',openings.living[1],openings.store[0],C.x0,'z',C.h,'+x','corridor');
  wall('corridor-wall-left',openings.store[1],40,C.x0,'z',C.h,'+x','corridor');
  add('corridor-lintel',[.4,C.h-3.4,openings.living[1]-openings.living[0]],[C.x0-.2,3.4+(C.h-3.4)/2,(openings.living[0]+openings.living[1])/2],'hull',false);
  const quarters=add('quarters-door',[.25,3.4,openings.living[1]-openings.living[0]],[C.x0-.2,1.7,(openings.living[0]+openings.living[1])/2],'door');quarters.open=false;
  interactions.push({id:'quarters-door',door:'quarters-door',action:'station-door',label:'OPEN / CLOSE LIVING AREA',position:[-1.5,1.6,12],range:2.8});
  // Portholes along the outer wall (visual glass set into the solid wall).
  const portholes=[9,16,23,30,36];
  for(const z of portholes)add('corridor-porthole',[.08,.9,1.4],[C.x1-.02,1.75,z],'glass',false);
  // ---- Living area: sleeping pods stacked along the hangar-side wall, lockers, a washroom corner ----
  const L=R.living;
  wall('living-outer-wall',4.3,22.5,L.x0,'z',L.h,'+x','living');
  wall('living-store-wall',L.x0,C.x0,22.5,'x',L.h,'-z','living');
  walls.push({id:'living-hangar-side',axis:'x',fixed:4.3,from:L.x0,to:C.x0,h:L.h,normal:'+z',room:'living'});
  // ---- Store ----
  const S=R.store;
  wall('store-outer-wall',22.7,33.7,S.x0,'z',S.h,'+x','store');
  wall('store-end-wall',S.x0,C.x0,33.7,'x',S.h,'-z','store');
  walls.push({id:'store-living-side',axis:'x',fixed:22.9,from:S.x0,to:C.x0,h:S.h,normal:'+z',room:'store'});
  // The gap behind the store (between its outer wall and the living area's line) is closed off.
  add('store-gap-fill',[2,S.h,11.2],[-14,S.h/2,28.1],'hull');
  // The corridor's left wall seen from inside the living area and the store (dressing only).
  for(const [from,to,room] of [[4.3,openings.living[0],'living'],[openings.living[1],22.5,'living'],[22.9,openings.store[0],'store'],[openings.store[1],33.7,'store']])walls.push({id:'corridor-wall-inside',axis:'z',fixed:C.x0-.4,from,to,h:C.h,normal:'-x',room});
  // ---- The social hall: entry wall either side of the corridor, bar wall, window walls ----
  const H=R.hall;
  wall('hall-entry-wall',H.x0,C.x0,40,'x',H.h,'+z','hall');wall('hall-entry-wall',C.x1,H.x1,40,'x',H.h,'+z','hall');
  add('hall-entry-lintel',[C.x1-C.x0,H.h-C.h,.4],[0,C.h+(H.h-C.h)/2,40.2],'hull',false);
  wall('hall-bar-wall',40,62,H.x0,'z',H.h,'+x','hall');
  // Starboard observation windows (seating side) and the aft window across the hall's end.
  add('observation-sill',[.6,1.1,22],[16.3,.55,51]);add('observation-lintel',[.6,1.6,22],[16.3,4.2,51],'hull');add('observation-glass',[.12,2.3,22],[16.3,2.25,51],'glass');
  add('aft-window-sill',[32,1,.6],[0,.5,62.3]);add('aft-window',[32,2.4,.12],[0,2.2,62.3],'glass');add('aft-lintel',[32,1.6,.6],[0,4.2,62.3]);
  walls.push({id:'hall-window-frame',axis:'z',fixed:16,from:40,to:62,h:H.h,normal:'-x',room:'hall',window:true},{id:'hall-aft-frame',axis:'x',fixed:62,from:H.x0,to:H.x1,h:H.h,normal:'-z',room:'hall',window:true});
  for(const [id,r] of Object.entries(R)){const w=r.x1-r.x0,d=r.z1-r.z0;add(id+'-floor',[w,.4,d],[(r.x0+r.x1)/2,-.2,(r.z0+r.z1)/2],'floor',false);add(id+'-roof',[w,.4,d],[(r.x0+r.x1)/2,r.h,(r.z0+r.z1)/2],'hull',false);floors.push({id,...r});}

  const furniture={pods:[],bunks:[],basins:[],toilets:[],stools:[],tables:[],sofas:[],lockers:[],
   bar:{x:-10.5,z:51,length:14,backX:-15.6},store:{x:-6.2,z:28,length:5,shelves:[24.6,27.6,30.6],shelfX:-12.4},
   terminal:{x:2,z:20,facing:-Math.PI/2},portholes,
   lights:[[-9,13],[-8,28],[-10.5,51],[9,51]],
   plants:[[-15.1,41,1],[15.1,61.1,.9],[-15.1,61.1,1],[3.2,41,.8],[-3.2,41,.8],[1.6,5,.7]]};
  // Sleeping pods: two tiers of five, ends against the hangar-side wall, hatches facing into the room.
  for(let i=0;i<5;i++)for(const level of [0,1]){const x=-13.9+i*1.6;furniture.pods.push({id:'pod-'+(i*2+level+1),x,z:5.75,level,y:level?1.62:.3,facing:Math.PI});}
  add('pod-bank',[8.2,2.9,2.5],[-10.7,1.45,5.6],'frame');
  for(let i=0;i<4;i++)for(const level of [0,1]){const z=8.6+i*1.6;furniture.pods.push({id:'pod-'+(11+i*2+level),x:-13.75,z,level,y:level?1.62:.3,facing:Math.PI/2});}
  add('pod-bank-2',[2.5,2.9,6.6],[-13.75,1.45,11],'frame');
  for(const z of [15.2,16.4,17.6]){add('locker',[.8,2.2,1],[-14.4,1.1,z],'panel');furniture.lockers.push({x:-14.4,z,facing:Math.PI/2});}
  // Washroom along the store-side wall: two stalls and two basins with mirrors.
  for(const x of [-14.6,-13.2,-11.8])add('stall-partition',[.1,2.3,1.9],[x,1.15,21.3]);
  for(const x of [-13.9,-12.5]){add('sanitary-fixture',[.65,.55,.9],[x,.275,21.75],'ceramic');furniture.toilets.push({x,z:21.75});}
  for(const x of [-9.6,-7.8]){add('washbasin',[1.4,.8,.7],[x,.4,21.85],'ceramic');add('mirror',[1.3,1.1,.05],[x,1.75,22.27],'glass',false);furniture.basins.push({x,z:21.85,facing:-1});}

  // ---- Store: counter parallel to the corridor, stock shelves on the back wall ----
  add('shop-counter',[1.2,1.15,furniture.store.length],[furniture.store.x,.575,furniture.store.z],'counter');
  for(const z of furniture.store.shelves){add('supply-shelf',[.6,2.6,2.6],[furniture.store.shelfX,1.3,z],'frame');for(let j=0;j<3;j++)add('supply-case',[.5,.45,.7],[furniture.store.shelfX+.1,.5+j*.7,z],'panel',false);}

  // ---- The Dead Channel: counter along the hall's left wall, back bar behind, stools in front ----
  const B=furniture.bar;
  add('bar-counter',[1.2,1.15,B.length],[B.x,.575,B.z],'counter');add('bar-back',[.5,2.8,B.length],[B.backX,1.4,B.z],'panel');
  for(let i=0;i<14;i++)add('bottle',[.15,.35+(i%3)*.09,.15],[B.backX+.3,1.8,B.z-B.length/2+.6+i*.98],i%2?'amber':'teal',false);
  for(let i=0;i<6;i++){const z=B.z-5.5+i*2.2;add('bar-stool',[.65,.55,.65],[-8.7,.275,z],'seat');furniture.stools.push({x:-8.7,z});activityPoints.push({id:'bar-'+i,position:[-8.7,0,z],facing:-Math.PI/2,activities:['sit','drink'],animation:'seated',seat:true});}

  // ---- Seating across from the bar: tables with chairs, and sofas under the windows ----
  for(const z of [45,51,57]){const x=8.5;add('lounge-table',[2.2,.12,1.2],[x,.8,z],'panel');add('table-pedestal',[.35,.8,.35],[x,.4,z],'frame');furniture.tables.push({x,z});
   for(const s of [-1,1]){add('lounge-chair',[.7,.16,.7],[x+s*1.6,.5,z],'seat');add('chair-back',[.14,.8,.7],[x+s*1.93,.7,z],'seat');activityPoints.push({id:'seat-'+z+'-'+s,position:[x+s*1.6,0,z],facing:-s*Math.PI/2,activities:['sit','drink','device'],animation:'seated',seat:true});}}
  for(const z of [46,56]){add('lounge-sofa',[1,.45,3.2],[15.1,.225,z],'seat');add('sofa-back',[.3,.9,3.2],[15.65,.6,z],'seat');furniture.sofas.push({x:15.1,z,length:3.2,facing:-Math.PI/2});
   for(const dz of [-.8,.8])activityPoints.push({id:'sofa-'+z+'-'+dz,position:[14.75,0,z+dz],facing:-Math.PI/2,activities:['sit','talk-seated'],animation:'seated',seat:true});}

  solids.push({id:'ship',size:[7,4,11],position:[-7,2,-9]});
  for(const [x,z,s] of furniture.plants)solids.push({id:'planter',size:[.75*s,1,.75*s],position:[x,.5,z]});
  interactions.push({id:'board',action:'board',label:'BOARD YOUR SHIP',position:[-2,1.7,-14],range:3.5},
   {id:'services',action:'services',label:'SHIP OUTFITTER',position:[-4.6,1.7,28],range:3},
   {id:'jobs',action:'jobs',label:'MISSION TERMINAL',position:[1.3,1.7,20],range:2.5},
   {id:'meridian-pod',action:'meridian-pod',label:'REST IN A SLEEP POD',position:[-10.7,1.7,7.8],range:3},
   {id:'rook',action:'talk',character:'rook',label:'TALK / ROOK',position:[-5.6,1.7,44],range:3},
   {id:'nyx',action:'talk',character:'nyx',label:'TALK / NYX',position:[-7.6,1.7,51],visualPosition:[-13,1.7,51],range:3});
  sign('quarters','LIVING AREA',[-2.05,2.95,12],-Math.PI/2);sign('supply','SUPPLIES',[-2.05,2.95,28],-Math.PI/2);
  sign('lounge','DEAD CHANNEL',[0,3,39.6]);
  // Ambient activity points: windows face outward, the terminal faces its screen, chats face each other.
  for(const [id,x,z,facing,activities]of [
   ['window-hall-1',15.2,42.5,Math.PI/2,['window']],['window-hall-2',15.2,51,Math.PI/2,['window']],['window-hall-3',15.2,60.2,Math.PI/2,['window']],
   ['window-aft-1',-3,61.2,0,['window']],['window-aft-2',4,61.2,0,['window']],
   ['window-corridor-1',1.5,16,Math.PI/2,['window']],['window-corridor-2',1.5,30,Math.PI/2,['window']],
   ['terminal',1.2,20,Math.PI/2,['terminal']],['shelves',-10.8,27.6,-Math.PI/2,['browse']],['lockers',-13.4,16.4,-Math.PI/2,['terminal']],
   ['drinks',-8.7,57.8,-Math.PI/2,['get-drink']],['chat-a',2.5,45,0,['talk']],['chat-b',2.5,47,Math.PI,['talk']],
   ['idle-hall',-2,53,Math.PI/2,['idle']],['idle-corridor',0,34,0,['idle']]])activityPoints.push({id,position:[x,0,z],facing,activities,animation:activities[0]});
  // Approved 3D props (model-registry.js) dressing the fittings in place. Visual only: the collision solids
  // above are unchanged. A group's procedural pieces are hidden only if all of its models loaded.
  const props=[
   {model:'crate-large',position:[16.3,0,-18.6],yaw:Math.PI/2,group:'hangar-cargo',replaces:['cargo-crate']},
   {model:'crate',position:[14.2,0,-18.3],yaw:.08,group:'hangar-cargo'},{model:'crate',position:[14.2,1.5,-18.3],yaw:-.12,group:'hangar-cargo'},
   {model:'crate',position:[14.3,0,-16.4],yaw:.2,group:'hangar-cargo'},
   {model:'barrel',position:[12.8,0,-15],yaw:.4,group:'hangar-cargo'},{model:'barrel-closed',position:[13.6,0,-14.1],yaw:1.1,group:'hangar-cargo'},
   ...furniture.store.shelves.map(z=>({model:'shelves-tall',position:[furniture.store.shelfX-.2,0,z],yaw:Math.PI/2,group:'supplies',replaces:['supply-shelf','supply-case']})),
   ...furniture.lockers.map(l=>({model:'locker',position:[l.x,0,l.z],yaw:-Math.PI/2,group:'lockers',replaces:['locker']})),
   {model:'desk',position:[furniture.store.x,0,furniture.store.z-1.3],yaw:-Math.PI/2,group:'outfitter',replaces:['shop-counter']},{model:'desk',position:[furniture.store.x,0,furniture.store.z+1.3],yaw:-Math.PI/2,group:'outfitter'},
   ...furniture.toilets.map(t=>({model:'toilet',position:[t.x,0,21.9],yaw:Math.PI,group:'quarters-toilets',replaces:['sanitary-fixture']})),
   ...furniture.basins.map(b=>({model:'basin',position:[b.x,.1,22.05],yaw:Math.PI,group:'quarters-basins',replaces:['washbasin']})),
   ...furniture.stools.map(s=>({model:'bar-stool',position:[s.x,0,s.z],yaw:Math.PI/2,group:'bar-stools',replaces:['bar-stool']}))
  ];
  return {id:'meridian',name:'MERIDIAN STATION',kind:'station',bounds:[18,64],spawn:[0,1.7,-17],ship,color:'#505962',shell,solids,interactions,signs,activityPoints,props,furniture,walls,floors,rooms:R};
 }
 const api={layout,rooms:R};if(typeof module!=='undefined')module.exports=api;else root.VoidMeridianInterior=api;
})(globalThis);
