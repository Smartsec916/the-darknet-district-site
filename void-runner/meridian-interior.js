/* Meridian's shared walkable plan, fittings and tagged activity points, in metres.
   Plan (David, 2026-10-17): through the hangar's pressure door, the corridor has a door on the left
   into the crew quarters (bunks, toilet stalls, washbasins). The long concourse beyond has the store
   on the left and the Dead Channel bar at the far end on the left, each a recessed room with its own
   entrance, and seating across from the bar
   along the windows on the right. `furniture` lists where the detailed fittings go, so the art and
   fit-out passes (meridian-art.js, babylon-renderer.js) follow this plan instead of their own numbers. */
(function(root){
 function layout(ship='starter'){
  const shell=[],solids=[],interactions=[],signs=[],activityPoints=[];
  function add(id,size,position,kind='hull',collision=true){const p={id,size,position,kind};shell.push(p);if(collision)solids.push(p);return p;}
  function sign(id,text,position,rotation=0){signs.push({id,text,position,color:'#d9b776',...(rotation?{rotation}:{})});}
  function door(id,x,z,label,width=4){const d=add(id,[width,3.4,.25],[x,1.7,z],'door');d.open=false;interactions.push({id,action:'station-door',door:id,label:'OPEN / CLOSE '+label,position:[x,1.6,z-.5],range:2.8});sign(id+'-sign',label,[x,4,z-.3]);return d;}
  for(const side of [-1,1]){
   add('hangar-wall',[.6,9,30],[side*18,4.5,-11]);add('hangar-door-jamb',[8,9,.6],[side*14,4.5,-26]);add('hangar-corridor-wall',[14,9,.6],[side*11,4.5,4]);
   add('commerce-entry-wall',[14,6,.6],[side*11,3,18]);
  }
  // Corridor: the starboard wall is solid; the port wall has the crew quarters door.
  add('corridor-wall',[.6,5,14],[4,2.5,11]);solids.push({id:'outside-corridor',size:[14,20,13],position:[11,0,11]});
  add('corridor-wall',[.6,5,5],[-4,2.5,6.5]);add('corridor-wall',[.6,5,5],[-4,2.5,15.5]);add('quarters-door-lintel',[.6,1.6,4],[-4,4.2,11],'hull',false);
  const quarters=add('quarters-door',[.25,3.4,4],[-4,1.7,11],'door');quarters.open=false;
  interactions.push({id:'quarters-door',door:'quarters-door',action:'station-door',label:'OPEN / CLOSE CREW QUARTERS',position:[-3.3,1.6,11],range:2.8});
  // Crew quarters: one room beside the corridor, behind the hangar's back wall.
  add('quarters-outer-wall',[.6,5,14],[-18,2.5,11]);
  // Concourse: a solid port wall behind the store and bar; windows along the whole starboard side.
  add('concourse-port-wall',[.6,6,48],[-18,3,42]);
  // The store and the bar are recessed rooms off the hall (David, 2026-10-17): a partition at x -7 with a wide
  // entrance to each (store z 29–37, bar z 45–55), and a wall between them at z 42.
  add('store-front-wall',[.4,6,10.7],[-7,3,23.65]);add('store-front-wall',[.4,6,5],[-7,3,39.5]);
  add('bar-front-wall',[.4,6,3],[-7,3,43.5]);add('bar-front-wall',[.4,6,10.7],[-7,3,60.35]);
  add('store-bar-wall',[10.6,6,.4],[-12.5,3,42]);
  for(const [z,len] of [[33,8],[50,10]])add('recess-header',[.4,1.2,len],[-7,5.4,z],'hull',false);
  add('observation-sill',[.6,1.1,48],[18,.55,42]);add('observation-lintel',[.6,2,48],[18,5,42]);add('observation-glass',[.12,2.9,48],[18,2.55,42],'glass');
  add('hangar-header',[20,2,.6],[0,8,-26]);
  for(const [id,w,d,x,z,h]of [['hangar',36,30,0,-11,9],['connector',8,14,0,11,5],['quarters',14,14,-11,11,5],['concourse',36,48,0,42,6]]){add(id+'-floor',[w,.4,d],[x,-.2,z],'floor',false);add(id+'-roof',[w,.4,d],[x,h,z],'hull',false);}
  add('aft-window-sill',[36,1,1],[0,.5,66]);add('aft-window',[36,3,.12],[0,2.5,66],'glass');add('aft-lintel',[36,2,1],[0,5,66]);
  door('crew-pressure-door',0,4,'CONCOURSE',7.4);

  // ---- Crew quarters: bunks along the outer wall, two toilet stalls, washbasins and lockers ----
  const furniture={bunks:[],basins:[],toilets:[],stools:[],tables:[],lockers:[],bar:{x:-11.5,z:56,length:12,backX:-17.2},store:{x:-12.5,z:33,length:6,shelves:[28.5,31.5,34.5,37.5]},lights:[[-12.5,56],[-11,33],[12.5,55],[-11,11]]};
  for(const z of [6.4,9.6,12.8]){add('bunk-frame',[4,.45,1.8],[-15.6,.225,z],'frame');add('bunk-mattress',[3.6,.2,1.6],[-15.6,.55,z],'seat');furniture.bunks.push({x:-15.6,z,head:-1});}
  for(const x of [-17.1,-16]){add('locker',[1,2.3,1],[x,1.15,17.1],'panel');furniture.lockers.push({x,z:17.1});}
  for(const x of [-13.2,-10.8,-8.4])add('stall-partition',[.12,2.3,2.2],[x,1.15,16.6]);
  for(const x of [-12,-9.6]){add('sanitary-fixture',[.65,.55,.9],[x,.275,17.15],'ceramic');furniture.toilets.push({x,z:17.15});}
  for(const x of [-9.5,-7.1]){add('washbasin',[1.4,.8,.7],[x,.4,4.75],'ceramic');add('mirror',[1.6,1.2,.05],[x,1.8,4.35],'glass');furniture.basins.push({x,z:4.75,facing:1});}

  // ---- The store (port side, mid-concourse): a counter parallel to the wall, shelving behind ----
  add('shop-counter',[1.2,1.15,6],[-12.5,.575,33],'counter');
  for(const z of furniture.store.shelves){add('supply-shelf',[.6,2.6,3],[-16,1.3,z],'frame');for(let j=0;j<3;j++)add('supply-case',[.5,.45,.7],[-15.9,.5+j*.7,z],'panel',false);}

  // ---- The Dead Channel (port side, far end): counter along the wall, stools facing it ----
  add('bar-counter',[1.2,1.15,12],[-11.5,.575,56],'counter');add('bar-back',[.5,2.8,12],[-17.2,1.4,56],'panel');
  for(let i=0;i<12;i++)add('bottle',[.15,.35+(i%3)*.09,.15],[-16.9,1.8,50.9+i*.93],i%2?'amber':'teal',false);
  for(let i=0;i<4;i++){const z=51.5+i*3;add('bar-stool',[.65,.55,.65],[-9.6,.275,z],'seat');furniture.stools.push({x:-9.6,z});activityPoints.push({id:'bar-'+i,position:[-9.6,0,z],facing:-Math.PI/2,activities:['sit','drink'],animation:'seated'});}

  // ---- Seating across from the bar, along the starboard windows ----
  for(const z of [49,53,57,61]){const x=12.5;add('lounge-table',[2.2,.12,1.2],[x,.8,z],'panel');add('table-pedestal',[.35,.8,.35],[x,.4,z],'frame');furniture.tables.push({x,z});
   for(const s of [-1,1]){add('lounge-chair',[.7,.16,.7],[x+s*1.6,.5,z],'seat');add('chair-back',[.14,.8,.7],[x+s*1.93,.7,z],'seat');activityPoints.push({id:'seat-'+x+'-'+z+'-'+s,position:[x+s*1.6,0,z],facing:-s*Math.PI/2,activities:['sit','drink'],animation:'seated'});}}

  for(let z=20;z<65;z+=4){add('floor-seam',[35,.012,.035],[0,.012,z],'frame',false);add('overhead-beam',[35,.2,.3],[0,5.7,z],'frame',false);for(const s of [-1,1])add('ceiling-conduit',[.15,.18,4],[s*4,5.7,z],'amber',false);add('window-mullion',[.28,4,.3],[17.7,2.7,z],'frame',false);}
  for(let z=21;z<65;z+=8)add('route-strip',[.08,.02,4],[0,.025,z],'teal',false);
  solids.push({id:'ship',size:[7,4,11],position:[-7,2,-9]});
  interactions.push({id:'board',action:'board',label:'BOARD YOUR SHIP',position:[-2,1.7,-14],range:3.5},{id:'services',action:'services',label:'SHIP OUTFITTER',position:[-9.6,1.7,33],range:3},{id:'jobs',action:'jobs',label:'MISSION TERMINAL',position:[-4,1.7,31],range:3},{id:'rook',action:'talk',character:'rook',label:'TALK / ROOK',position:[-8.4,1.7,48.6],range:3},{id:'nyx',action:'talk',character:'nyx',label:'TALK / NYX',position:[-9.2,1.7,57],visualPosition:[-14.3,1.7,57],range:3});
  sign('concourse','MERIDIAN / CREW CONCOURSE',[0,4.8,18.5]);sign('supply','SUPPLIES / OUTFITTER',[-6.75,4.25,33],-Math.PI/2);sign('lounge','THE DEAD CHANNEL / LOUNGE',[-6.75,4.25,50],-Math.PI/2);sign('quarters','CREW QUARTERS / RESTROOMS',[-3.65,4.25,11],-Math.PI/2);sign('return','HANGAR H01 / RETURN TO SHIP',[0,4,19]);
  for(const [id,x,z,facing,activities]of [['window-aft',16.4,27,Math.PI/2,['window']],['window-right',16.4,39,Math.PI/2,['window']],['terminal',-4,30,0,['terminal']],['drinks',-9.6,63,-Math.PI/2,['get-drink']],['chat-a',-2,38,0,['talk']],['chat-b',-2,40,Math.PI,['talk']],['idle-a',3,44,0,['idle']],['idle-b',-3,54,Math.PI,['idle']]])activityPoints.push({id,position:[x,0,z],facing,activities,animation:activities[0]});
  // Approved 3D props (model-registry.js) dressing existing fittings in place. Visual only: the
  // collision solids above are unchanged. A group's procedural pieces are hidden only if all of its
  // models loaded; otherwise the procedural fittings stay.
  const props=[
   {model:'crate-large',position:[16.3,0,-18.6],yaw:Math.PI/2,group:'hangar-cargo',replaces:['cargo-crate']},
   {model:'crate',position:[14.2,0,-18.3],yaw:.08,group:'hangar-cargo'},{model:'crate',position:[14.2,1.5,-18.3],yaw:-.12,group:'hangar-cargo'},
   {model:'crate',position:[14.3,0,-16.4],yaw:.2,group:'hangar-cargo'},
   {model:'barrel',position:[12.8,0,-15],yaw:.4,group:'hangar-cargo'},{model:'barrel-closed',position:[13.6,0,-14.1],yaw:1.1,group:'hangar-cargo'},
   ...furniture.store.shelves.map(z=>({model:'shelves-tall',position:[-16.2,0,z],yaw:Math.PI/2,group:'supplies',replaces:['supply-shelf','supply-case']})),
   ...furniture.lockers.map(l=>({model:'locker',position:[l.x,0,l.z],yaw:Math.PI,group:'lockers',replaces:['locker']})),
   {model:'desk',position:[-12.5,0,31.55],yaw:-Math.PI/2,group:'outfitter',replaces:['shop-counter']},{model:'desk',position:[-12.5,0,34.4],yaw:-Math.PI/2,group:'outfitter'},
   // Crew quarters and bar furniture (Ultimate House Interior Pack). The art pass skips its own versions of these when they load.
   ...furniture.bunks.map(b=>({model:'bunk',position:[-16.6,0,b.z],yaw:Math.PI/2,group:'quarters-beds',replaces:['bunk-frame','bunk-mattress']})),
   ...furniture.toilets.map(t=>({model:'toilet',position:[t.x,0,17.3],yaw:Math.PI,group:'quarters-toilets',replaces:['sanitary-fixture']})),
   ...furniture.basins.map(b=>({model:'basin',position:[b.x,.1,4.55],yaw:b.facing>0?0:Math.PI,group:'quarters-basins',replaces:['washbasin']})),
   ...furniture.stools.map(s=>({model:'bar-stool',position:[s.x,0,s.z],yaw:Math.PI/2,group:'bar-stools',replaces:['bar-stool']}))
  ];
  return {id:'meridian',name:'MERIDIAN STATION',kind:'station',bounds:[18,66],spawn:[0,1.7,-17],ship,color:'#505962',shell,solids,interactions,signs,activityPoints,props,furniture};
 }
 const api={layout};if(typeof module!=='undefined')module.exports=api;else root.VoidMeridianInterior=api;
})(globalThis);
