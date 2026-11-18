/* ZEN ZEPHYR'S TEMPLE, the Sanctum of the Circuit: a separate hilltop area far from the city. docs/development/TEMPLE.md.
   PURE DATA and rules (layout, collision, interactions, map model, the monk's replacement point); runs in Node and is unit-tested (tests/temple.test.cjs).
   The 3D build is temple-build.js; the wiring and the chat panel are temple-integration.js; the conversation is zen-chat.js; the way in and out is the East Gate on the Avenue, by road taxi or on foot (ncz-quarters.js, road-taxi.js, ncz-gate-transit.js).
   World metres in the area's OWN coordinates, x east, z north, centred on (0,0). Collision bounds |x|,|z| < 50. The city lies far below to the south-east.

   ==== WHERE TO CHANGE THINGS ====
   - Zen Zephyr's model: MODEL below (id 'zen-zephyr'). Package the real model with the usual private asset process, then set `asset` to its id: temple-build.js uses it when
     VoidAssets has it and falls back to the primitive monk. Nothing else needs to change (seat, facing and the interaction are here).
   - His lines: the owner's approved, voiced script (18 Nov 2026): tools/audio/zen-zephyr-script.json, written into zen-chat.js by tools/audio/zen-import.cjs. Never edit them by hand. */
(function(root){
 'use strict';
 const ID='temple',SPACE_FLAG='templeFog',BOUNDS=[50,50],FARE=60;
 const MODEL={id:'zen-zephyr',name:'Zen Zephyr',role:'MONK · SANCTUM OF THE CIRCUIT',asset:null,placeholder:'primitives',seat:[0,22],yaw:0,   /* turned 180 degrees so he faces away from the entrance (the owner, 18 Nov 2026) */ 
  look:'Silver head, closed eyes, dark robe with a mustard sash, mechanical details, teal chest lights, calm seated posture (the owner\'s brief; Origins scenes sanctum_discovery and zen_wisdom for mood).',
  note:'REPLACEMENT POINT: Zen Zephyr. Set `asset` to a packaged model id to replace the primitive monk.'};
 const ARRIVAL={spawn:[0,1.7,-38],yaw:0},CAB_PAD={x:0,z:-43},WALK_BACK={x:-8,z:-42};
 const HALL=[-18,18,-6,34],ENTRANCE={x:[-3.5,3.5],z:-6},DAIS={x:0,z:22,r:3.6},PLATEAU=[-48,48,-48,48];
 const T=.8,H=13;
 // Wall segments of the hall: [id, 'x'|'z', fixed coordinate, from, to, gaps]. The east wall has a big glass window (visual, solid) onto the city.
 const SEGMENTS=[['south','z',-6,-18,18,[[-3.5,3.5]]],['north','z',34,-18,18,[]],['west','x',-18,-6,34,[]],['east','x',18,-6,34,[]]];
 const cx=(x,z,w,d)=>[x-w/2,x+w/2,z-d/2,z+d/2];
 // Solid furniture: [id, rect, height]
 const PROPS=[
  ...[2,12,22,30].flatMap((z,i)=>[['pillar-w'+i,cx(-11,z,1.8,1.8),10],['pillar-e'+i,cx(11,z,1.8,1.8),10]]),
  ['dais',cx(DAIS.x,DAIS.z,DAIS.r*2,DAIS.r*2),.5],
  ['altar-1',cx(-7,12,1.2,1.2),1.3],['altar-2',cx(7,12,1.2,1.2),1.3],['altar-3',cx(-7,28,1.2,1.2),1.3],['altar-4',cx(7,28,1.2,1.2),1.3],
  ['incense-in-w',cx(-6,-2,.9,.9),1.1],['incense-in-e',cx(6,-2,.9,.9),1.1],
  ['brazier-1',cx(-9,-14,1,1),1.1],['brazier-2',cx(9,-14,1,1),1.1],['brazier-3',cx(-9,-24,1,1),1.1],['brazier-4',cx(9,-24,1,1),1.1],
  ['gate-w',cx(-4.8,-30,.9,.9),6],['gate-e',cx(4.8,-30,.9,.9),6],
  ['bench-1',cx(-30,-38,3,.8),.5],['bench-2',cx(30,-38,3,.8),.5],['overlook-rail',cx(42,-20,.5,14),1.1]];
 // The parapet round the plateau: you can see over it to the city, not fall off.
 const PARAPET=[[-48.5,48.5,47.5,48.5],[-48.5,48.5,-48.5,-47.5],[-48.5,-47.5,-48.5,48.5],[47.5,48.5,-48.5,48.5]];
 const ALTAR_TEXT=['DATA ALTAR 1 · the first prayer: "initialise".','DATA ALTAR 2 · a loop scrolls by, endless and calm.','DATA ALTAR 3 · a list of names, each followed by "remembered".','DATA ALTAR 4 · one line: "rest is a valid state".'];
 const INTERACTIONS=[
  {id:'temple-cab',label:'TAXI · RETURN TO NEOCHINATOWN',position:[CAB_PAD.x,1.7,CAB_PAD.z+3.4],action:'temple-cab',range:4},
  {id:'temple-walk',label:'EAST GATE · WALK TO NEOCHINATOWN',position:[WALK_BACK.x,1.7,WALK_BACK.z],action:'temple-walk',range:2.4},   // as the Corporate District's FUNCTION GATE prompt (16 Nov 2026)
  {id:'temple-monk',label:'SPEAK WITH ZEN ZEPHYR',position:[0,1.7,DAIS.z-DAIS.r-.9],action:'temple-monk',range:4.6},
  ...[[-7,12,0],[7,12,1],[-7,28,2],[7,28,3]].map(([x,z,i])=>({id:'temple-altar-'+(i+1),label:'DATA ALTAR',position:[x,1.7,z-(z<20?1.8:-1.8)],action:'temple-altar',altar:i,range:2.8})),
  {id:'temple-incense',label:'BLUE-FLAME INCENSE',position:[-9,1.7,-17],action:'temple-incense',range:4},
  {id:'temple-overlook',label:'OVERLOOK THE CITY',position:[40.6,1.7,-20],action:'temple-overlook',range:3.2}];
 const solids=()=>{const out=[];const box=(id,r,h)=>out.push({id,position:[(r[0]+r[1])/2,h/2,(r[2]+r[3])/2],size:[r[1]-r[0],h,r[3]-r[2]]});
  for(const [id,axis,c,a,b,gaps] of SEGMENTS){const spans=[];let from=a;for(const [g0,g1] of [...gaps].sort((p,q)=>p[0]-q[0])){if(g0>from)spans.push([from,g0]);from=Math.max(from,g1);}if(b>from)spans.push([from,b]);
   spans.forEach(([s0,s1],i)=>box('temple-wall-'+id+(spans.length>1?'-'+i:''),axis==='x'?[c-T/2,c+T/2,s0,s1]:[s0,s1,c-T/2,c+T/2],H));}
  for(const [id,r,h] of PROPS)box('temple-'+id,r,h);PARAPET.forEach((r,i)=>box('temple-parapet-'+i,r,1.2));return out;};
 // Can the monk see the player at (x,z)? Inside the hall, with no pillar between them (the low altars and the dais do not block a seated man's view). Used for his greeting.
 function seesMonk(x,z){const [hx0,hx1,hz0,hz1]=HALL;if(!(x>hx0+T/2&&x<hx1-T/2&&z>hz0+T/2&&z<hz1-T/2))return false;const sx=MODEL.seat[0],sz=MODEL.seat[1];
  for(const [id,r] of PROPS){if(!/^pillar/.test(id))continue;let t0=0,t1=1;const dx=sx-x,dz=sz-z;let hit=true;
   for(const [p,q] of [[-dx,x-r[0]],[dx,r[1]-x],[-dz,z-r[2]],[dz,r[3]-z]]){if(p===0){if(q<0){hit=false;break;}continue;}const u=q/p;if(p<0){if(u>t1){hit=false;break;}if(u>t0)t0=u;}else{if(u<t0){hit=false;break;}if(u<t1)t1=u;}}
   if(hit&&t0<=t1)return false;}
  return true;}
 function layout(){return {id:ID,name:'ZEN ZEPHYR TEMPLE',kind:'city',temple:true,mapSpace:ID,bounds:BOUNDS.slice(),spawn:ARRIVAL.spawn.slice(),yaw:ARRIVAL.yaw,color:'#0a141c',music:'earth',
  solids:solids(),interactions:INTERACTIONS.map(i=>({...i,position:i.position.slice()})),signs:[]};}
 // Named parts, used by the map and the tests.
 const PLACES=[
  {id:'temple-taxi',name:'Taxi stop',kind:'transit',x:CAB_PAD.x,z:CAB_PAD.z+2},{id:'temple-gate',name:'Courtyard gate',kind:'entrance',x:0,z:-30},{id:'temple-entrance',name:'Temple entrance',kind:'entrance',x:0,z:-6},
  {id:'temple-chamber',name:'Main chamber',kind:'service',x:0,z:6},{id:'temple-dais',name:'Zen Zephyr\'s dais',kind:'service',x:0,z:DAIS.z-DAIS.r-.9},
  {id:'temple-altar-1',name:'Data altar',kind:'service',x:-7,z:12},{id:'temple-altar-2',name:'Data altar',kind:'service',x:7,z:12},{id:'temple-altar-3',name:'Data altar',kind:'service',x:-7,z:28},{id:'temple-altar-4',name:'Data altar',kind:'service',x:7,z:28},
  {id:'temple-overlook-poi',name:'Overlook',kind:'service',x:40.6,z:-20}];
 const STREETS=[{id:'terrace',name:'Arrival terrace',rect:[-30,30,-47,-31],kind:'plaza'},{id:'path',name:'Approach',rect:[-3,3,-31,-6],kind:'street'},{id:'courtyard',name:'Courtyard',rect:[-20,20,-30,-6],kind:'plaza'},{id:'overlook',name:'Overlook',rect:[34,47,-30,-10],kind:'plaza'},{id:'chamber',name:'Main chamber',rect:[-17.6,17.6,-5.6,33.6],kind:'street'}];
 const BUILDINGS=[{id:'temple',name:'The Sanctum of the Circuit',rect:HALL}];
 function mapModel(){const rectOf=s=>({id:s.id,x0:s.position[0]-s.size[0]/2,x1:s.position[0]+s.size[0]/2,z0:s.position[2]-s.size[2]/2,z1:s.position[2]+s.size[2]/2});
  return {streets:STREETS,buildings:BUILDINGS,walls:{street:solids().filter(s=>/wall|dais|altar|gate/.test(s.id)).map(rectOf),interior:[]},pois:PLACES.map(p=>({...p,area:'street'})),vestibule:{x:ARRIVAL.spawn[0],z:ARRIVAL.spawn[2]},bounds:{x0:-50,x1:50,z0:-50,z1:50}};}
 const api={ID,SPACE_FLAG,BOUNDS,FARE,MODEL,ARRIVAL,CAB_PAD,WALK_BACK,HALL,ENTRANCE,DAIS,PLATEAU,SEGMENTS,PROPS,PARAPET,ALTAR_TEXT,INTERACTIONS,PLACES,STREETS,BUILDINGS,solids,layout,mapModel,seesMonk};
 const AM=typeof module==='object'&&module.exports?require('./area-map.js'):root.VoidAreaMap;
 if(AM)AM.register({id:ID,name:'Zen Zephyr Temple',flag:SPACE_FLAG,bounds:[-50,50,-50,50],cell:5,model:mapModel});
 if(typeof module==='object'&&module.exports)module.exports=api;else root.VoidTemple=Object.assign(root.VoidTemple||{},api);
})(typeof globalThis!=='undefined'?globalThis:this);
