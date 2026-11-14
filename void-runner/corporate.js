/* CORPORATE DISTRICT: a separate area about 1.8 km from central NeoChinatown, reached only by sky cab (sky-cab.js). docs/development/CORPORATE.md.
   This file is PURE DATA and rules (layout, collision, cover, light zones, security placement, map model); it runs in Node and is unit-tested (tests/corporate.test.cjs).
   The 3D build is corporate-build.js; the game wiring is corporate-integration.js. Names here are neutral placeholders: no corporation, brand or story has been decided.
   World metres in the area's OWN coordinates, x east, z north, centred on (0,0). The collision bounds are the square |x|,|z| < 100. */
(function(root){
 'use strict';
 const ID='corporate',SPACE_FLAG='corpFog',BOUNDS=[100,100];
 const DISTANCE_M=1800,FARE=60;   // about 1.8 km from central NeoChinatown; the existing maximum fare
 const ARRIVAL={spawn:[0,1.7,-14],yaw:0},CAB_PAD={x:0,z:-19};
 // City blocks: [x0,x1,z0,z1], height, name. North row z 26..88, south row z -88..-26. The main boulevard runs east-west between them (z -26..26 is boulevard and plazas).
 const BLOCKS=[
  {id:'n1',rect:[-96,-58,26,88],h:66,name:'Service tower'},{id:'n2',rect:[-44,-8,26,88],h:92,name:'Glass tower'},{id:'n3',rect:[8,52,26,88],h:118,name:'Headquarters tower'},{id:'n4',rect:[66,96,26,88],h:78,name:'Tower'},
  {id:'s1',rect:[-96,-62,-88,-26],h:54,name:'Loading block'},{id:'s2',rect:[-58,-20,-88,-26],h:78,name:'Operations block'},{id:'s3',rect:[-8,30,-88,-26],h:60,name:'Block'},{id:'s4',rect:[34,62,-88,-26],h:48,name:'Block'},{id:'s5',rect:[66,96,-88,-26],h:64,name:'Block'}];
 // The perimeter: an embankment wall all round (the area is a walled pocket of the city; beyond it is only the distant skyline).
 const PERIMETER=[[-100,100,96,100],[-100,100,-100,-96],[-100,-96,-100,100],[96,100,-100,100]];
 // Street spaces the player walks (for the map and the tests). Everything outside blocks and the perimeter is open.
 const STREETS=[
  {id:'boulevard',name:'Main Boulevard',rect:[-96,96,-12,12],kind:'street'},{id:'north-plaza',name:'North Plaza',rect:[-96,96,12,26],kind:'plaza'},{id:'south-plaza',name:'South Plaza',rect:[-96,96,-26,-12],kind:'plaza'},
  {id:'cross-west',name:'West Cross Street',rect:[-58,-44,26,88],kind:'street'},{id:'cross-checkpoint',name:'Checkpoint Street',rect:[-8,8,26,88],kind:'street'},{id:'cross-east',name:'East Cross Street',rect:[52,66,26,88],kind:'street'},
  {id:'north-road',name:'North Service Road',rect:[-96,96,88,96],kind:'street'},
  {id:'alley-a',name:'Narrow Alley A',rect:[-62,-58,-88,-26],kind:'alley'},{id:'alley-b',name:'Narrow Alley B',rect:[30,34,-88,-26],kind:'alley'},{id:'alley-c',name:'Narrow Alley C',rect:[62,66,-88,-26],kind:'alley'},
  {id:'south-street',name:'South Street',rect:[-20,-8,-88,-26],kind:'street'},{id:'back-alley',name:'Back Alley',rect:[-96,96,-96,-88],kind:'alley'}];
 // Elevated walkways (visual; clear of the player's head): from, to, height, width.
 const WALKWAYS=[{id:'w1',a:[-8,60],b:[8,60],y:15,w:3.2,axis:'x'},{id:'w2',a:[-58,46],b:[-44,46],y:19,w:3,axis:'x'},{id:'w3',a:[-76,-26],b:[-76,26],y:21,w:3.4,axis:'z'},{id:'w4',a:[52,52],b:[66,52],y:24,w:3,axis:'x'}];
 const cx=(x,z,w,d)=>[x-w/2,x+w/2,z-d/2,z+d/2];
 // Cover and street furniture that stops movement and blocks sight: [id, rect, height]
 const PROPS=[
  ['dumpster-1',cx(-72,-94.6,3,1.6),1.5],['dumpster-2',cx(-26,-94.6,3,1.6),1.5],['dumpster-3',cx(18,-94.6,3,1.6),1.5],['dumpster-4',cx(58,-94.6,3,1.6),1.5],
  ['crates-1',cx(-52,-90.2,1.8,1.8),1.5],['crates-2',cx(4,-91.4,1.8,1.8),1.5],['crates-3',cx(44,-90.4,2.4,1.6),1.2],['crates-4',cx(-86,-91.2,2,2),1.6],['crates-5',cx(76,-92,1.8,1.8),1.5],
  ['alley-crates',cx(-59.4,-42,1.4,1.4),1.3],['alley-dumpster',cx(-60.6,-64,1.6,2.4),1.4],['alley-b-crates',cx(31,-50,1.4,1.6),1.3],['alley-c-dumpster',cx(64.6,-58,1.6,2.4),1.4],
  ['planter-1',cx(-30,16,5,1.4),1],['planter-2',cx(-30,-16,5,1.4),1],['planter-3',cx(22,-16,5,1.4),1],['planter-4',cx(60,16,5,1.4),1],['planter-5',cx(-8,16,5,1.4),1],['planter-6',cx(70,-16,5,1.4),1],
  ['kiosk-1',cx(-44,8,2.2,2.2),2.6],['kiosk-2',cx(46,-8,2.2,2.2),2.6],['bench-1',cx(-14,17.5,3,.8),.5],['bench-2',cx(14,-17.5,3,.8),.5],
  ['booth',[-8,-4.6,42.5,46.5],3],['gate-arm',[-4.6,4.5,43.8,44.2],1.2],['hq-bollard-1',cx(26,20,.6,.6),1],['hq-bollard-2',cx(34,20,.6,.6),1]];
 // Doors in the block faces. All locked in this release; they are the places future missions can open. kind: guarded | service | bay | break-in
 const DOORS=[
  {id:'hq',name:'Headquarters entrance',kind:'guarded',rect:[27,33,25.8,26.2],pos:[30,24],face:'s',locked:true},
  {id:'service-n1',name:'Service entrance',kind:'service',rect:[-79,-75,25.8,26.2],pos:[-77,24],face:'s',locked:true},
  {id:'bay-1',name:'Loading bay 1',kind:'bay',rect:[-90,-82,-88.2,-87.8],pos:[-86,-90],face:'n',locked:true},{id:'bay-2',name:'Loading bay 2',kind:'bay',rect:[-76,-68,-88.2,-87.8],pos:[-72,-90],face:'n',locked:true},
  {id:'back-door',name:'Maintenance door (back alley)',kind:'break-in',rect:[-41.2,-38.8,-88.2,-87.8],pos:[-40,-90],face:'n',locked:true},
  {id:'bay-3',name:'Loading bay 3',kind:'bay',rect:[48,56,-88.2,-87.8],pos:[52,-90],face:'n',locked:true}];
 // Where light falls (most specific first). light 0..1 scales how visible the player is; covered: under a walkway or roof, out of sight of cameras.
 const ZONES=[
  {id:'under-w1',rect:[-8,8,56,64],light:.5,covered:true},{id:'under-w2',rect:[-58,-44,43,49],light:.5,covered:true},{id:'under-w3',rect:[-79,-73,-26,26],light:.5,covered:true},{id:'under-w4',rect:[52,66,49,55],light:.5,covered:true},
  {id:'recess-back-door',rect:[-42.5,-37.5,-90,-88],light:.15},{id:'recess-bay-1',rect:[-90,-82,-90,-88],light:.2},{id:'recess-bay-2',rect:[-76,-68,-90,-88],light:.2},{id:'recess-bay-3',rect:[48,56,-90,-88],light:.2},
  {id:'lamp-back-door',rect:[-37.5,-30,-96,-88],light:.8},
  {id:'hq-front',rect:[10,50,10,26],light:1},{id:'checkpoint',rect:[-8,8,36,52],light:1},{id:'cab-pad',rect:[-8,8,-26,-12],light:.9},
  {id:'cross-west',rect:[-58,-44,26,88],light:.5},{id:'cross-east',rect:[52,66,26,88],light:.5},{id:'cross-checkpoint-far',rect:[-8,8,52,88],light:.45},{id:'cross-checkpoint-near',rect:[-8,8,26,36],light:.75},
  {id:'alley-a',rect:[-62,-58,-88,-26],light:.2},{id:'alley-b',rect:[30,34,-88,-26],light:.2},{id:'alley-c',rect:[62,66,-88,-26],light:.2},{id:'south-street',rect:[-20,-8,-88,-26],light:.4},
  {id:'back-alley',rect:[-96,96,-96,-88],light:.3},{id:'north-road',rect:[-96,96,88,96],light:.35},
  {id:'boulevard',rect:[-96,96,-26,26],light:.85}];
 // Security placement, in priority order: the first `counts(quality)` of each are used (see corporate-security.js).
 const GUARDS=[
  {id:'guard-hq-w',x:24.5,z:22.5,yaw:Math.PI,scan:.5,period:11,range:18,fov:.95,entrance:'hq'},{id:'guard-hq-e',x:35.5,z:22.5,yaw:Math.PI,scan:.5,period:13,range:18,fov:.95,entrance:'hq'},
  {id:'guard-checkpoint',x:2.5,z:46.8,yaw:Math.PI,scan:.35,period:10,range:16,fov:.9,entrance:'checkpoint'},{id:'guard-service',x:-73.5,z:23,yaw:Math.PI,scan:.6,period:12,range:14,fov:.9,entrance:'service'},
  {id:'guard-patrol',path:[[-40,20],[0,20],[0,14],[-40,14]],speed:1.2,range:14,fov:.9},{id:'guard-alley',path:[[-35,-92],[35,-92]],speed:1.1,range:14,fov:.9,offset:30}];
 const CAMERAS=[
  {id:'cam-hq',x:30,z:26.4,y:6.5,yaw:Math.PI,sweep:.75,period:9,phase:0,range:28,fov:.45},{id:'cam-checkpoint',x:-6.4,z:46.6,y:5,yaw:Math.PI/2,sweep:.6,period:8,phase:1,range:15,fov:.45},
  {id:'cam-back-door',x:-34,z:-88.4,y:5,yaw:-Math.PI/2,sweep:.35,period:10,phase:0,range:20,fov:.4},{id:'cam-plaza-east',x:60,z:25.6,y:7,yaw:Math.PI,sweep:.8,period:12,phase:2,range:26,fov:.45},
  {id:'cam-south-plaza',x:11,z:-26.4,y:7,yaw:0,sweep:.9,period:14,phase:0,range:26,fov:.45},{id:'cam-service',x:-71,z:26.4,y:6,yaw:Math.PI,sweep:.6,period:9,phase:3,range:20,fov:.45},
  {id:'cam-alley-a',x:-60,z:-23.6,y:5,yaw:Math.PI,sweep:.12,period:7,phase:0,range:16,fov:.3},{id:'cam-back-east',x:80,z:-88.4,y:5,yaw:-Math.PI/2,sweep:.5,period:11,phase:1,range:26,fov:.4}];
 const DRONES=[
  {id:'drone-boulevard',path:[[-70,0],[70,0],[70,8],[-70,8]],speed:6,y:11,under:9,range:12},{id:'drone-hq',path:[[10,18],[50,18],[50,6],[10,6]],speed:5,y:9,under:9,range:12},
  {id:'drone-checkpoint',path:[[0,30],[0,84]],speed:5,y:12,under:9,range:12},{id:'drone-back-alley',path:[[-80,-92],[80,-92]],speed:7,y:10,under:9,range:12,offset:40}];
 // Places a guard challenges the player ("State your business."): near a protected entrance. Passive: a line of text, nothing else.
 const ENTRANCES=[{id:'hq',x:30,z:22,radius:9,text:'State your business.',guard:'guard-hq-w'},{id:'checkpoint',x:3,z:44,radius:8,text:'State your business.',guard:'guard-checkpoint'},{id:'service',x:-77,z:22,radius:6,text:'State your business.',guard:'guard-service'}];
 const solids=()=>{
  const out=[];const box=(id,r,h)=>out.push({id,position:[(r[0]+r[1])/2,h/2,(r[2]+r[3])/2],size:[r[1]-r[0],h,r[3]-r[2]]});
  for(const b of BLOCKS)box('corp-block-'+b.id,b.rect,30);PERIMETER.forEach((r,i)=>box('corp-perimeter-'+i,r,14));
  for(const [id,r,h] of PROPS)box('corp-'+id,r,h);for(const d of DOORS)box('corp-door-'+d.id,d.rect,3.2);
  return out;};
 // Everything that blocks sight: the same boxes (a camera cannot see through a dumpster or a building).
 const coverBoxes=()=>[...BLOCKS.map(b=>b.rect),...PERIMETER,...PROPS.map(p=>p[1])];
 const INTERACTIONS=[
  {id:'corp-cab',label:'CALL RETURN SKY CAB',position:[CAB_PAD.x,1.7,CAB_PAD.z+1.6],action:'corp-cab',range:4},
  {id:'corp-hq-door',label:'HEADQUARTERS ENTRANCE',position:[30,1.7,24.4],action:'corp-door',door:'hq',range:3},
  {id:'corp-service-door',label:'SERVICE ENTRANCE',position:[-77,1.7,24.4],action:'corp-door',door:'service-n1',range:3},
  {id:'corp-back-door',label:'MAINTENANCE DOOR',position:[-40,1.7,-89.4],action:'corp-door',door:'back-door',range:2.6},
  {id:'corp-bay-1',label:'LOADING BAY',position:[-86,1.7,-89.4],action:'corp-door',door:'bay-1',range:3},{id:'corp-bay-2',label:'LOADING BAY',position:[-72,1.7,-89.4],action:'corp-door',door:'bay-2',range:3},
  {id:'corp-bay-3',label:'LOADING BAY',position:[52,1.7,-89.4],action:'corp-door',door:'bay-3',range:3},
  {id:'corp-checkpoint',label:'SECURITY CHECKPOINT',position:[-2,1.7,41.6],action:'corp-checkpoint',range:3.4}];
 // The location definition the game's walking system loads (enterWalking('corporate')).
 function layout(){return {id:ID,name:'CORPORATE DISTRICT',kind:'city',corporate:true,bounds:BOUNDS.slice(),spawn:ARRIVAL.spawn.slice(),yaw:ARRIVAL.yaw,color:'#0b1a20',music:'earth',
  solids:solids(),interactions:INTERACTIONS.map(i=>({...i,position:i.position.slice()})),signs:[]};}
 // The V1 map's model of this area (same shape as district-map.js model()): streets and alleys, buildings, guarded and service entrances, the taxi stop.
 function mapModel(){
  const rectOf=s=>({id:s.id,x0:s.position[0]-s.size[0]/2,x1:s.position[0]+s.size[0]/2,z0:s.position[2]-s.size[2]/2,z1:s.position[2]+s.size[2]/2});
  const kindOf={guarded:'guard',service:'service',bay:'service','break-in':'service'};
  const pois=[{id:'corp-taxi',name:'Sky cab stop',kind:'transit',area:'street',x:CAB_PAD.x,z:CAB_PAD.z},
   ...DOORS.map(d=>({id:'corp-'+d.id,name:d.name+(d.kind==='guarded'?' (guarded)':''),kind:kindOf[d.kind]||'service',area:'street',x:d.pos[0],z:d.pos[1]})),
   {id:'corp-checkpoint-poi',name:'Security checkpoint (guarded)',kind:'guard',area:'street',x:0,z:44}];
  return {streets:STREETS.map(s=>({id:s.id,name:s.name,rect:s.rect,kind:s.kind})),buildings:BLOCKS.map(b=>({id:b.id,name:b.name,rect:b.rect})),walls:{street:solids().filter(s=>/corp-(door|booth|gate)/.test(s.id)||/corp-block/.test(s.id)).map(rectOf),interior:[]},
   pois,vestibule:{x:ARRIVAL.spawn[0],z:ARRIVAL.spawn[2]},bounds:{x0:-100,x1:100,z0:-100,z1:100}};
 }
 const api={ID,SPACE_FLAG,BOUNDS,DISTANCE_M,FARE,ARRIVAL,CAB_PAD,BLOCKS,PERIMETER,STREETS,WALKWAYS,PROPS,DOORS,ZONES,GUARDS,CAMERAS,DRONES,ENTRANCES,INTERACTIONS,solids,coverBoxes,layout,mapModel};
 // The V1 map's space for this area (area-map.js): district-map.js draws it with the saved fog.
 const AM=typeof module==='object'&&module.exports?require('./area-map.js'):root.VoidAreaMap;
 if(AM)AM.register({id:ID,name:'Corporate District',flag:SPACE_FLAG,bounds:[-100,100,-100,100],cell:8,model:mapModel});
 if(typeof module==='object'&&module.exports)module.exports=api;else root.VoidCorporate=Object.assign(root.VoidCorporate||{},api);
})(typeof globalThis!=='undefined'?globalThis:this);
