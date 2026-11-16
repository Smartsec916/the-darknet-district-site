/* The remade Port quarter of NeoChinatown: its plan (16 Nov 2026, docs/development/NEOCHINATOWN_REMAKE.md).
   PURE DATA AND RULES: no rendering. Runs in the browser (VoidPortData) and in Node (tests/ncz-port.test.cjs). ncz-port.js builds what is described here;
   neochinatown.js layout('street','port') adds `solids()` to the quarter's collision and cuts the public toilet out of the city block with `carve()`.
   World metres, x east, z north. The walkable Port is unchanged from ncz-quarters.js: the pad yard [13,37.5] x [-106,-86] and the lane [37.5,44] x [-107,-92]
   up to Port Customs. The only new floor is the public toilet north of the lane. */
(function(root){
 'use strict';
 const YARD=[13,37.5,-106,-86],LANE=[37.5,44,-107,-92],DECK=[15,33,-104,-88];   // DECK: the raised landing deck (the ship stands on it)
 /* The public toilet: one small room behind the wall at the lane's north end. room: its floor. door: the gap in the front wall (x from, to). */
 const WC={room:[38.3,43.7,-91.5,-86.3],front:[-92,-91.5],door:[38.65,39.95],height:2.75,
  screen:[40.15,40.29,-91.5,-89.6],                       // a privacy wall inside the door: nothing of the room shows from the lane
  stalls:[{x:[39.5,40.9],door:'shut'},{x:[40.9,42.3],door:'ajar'},{x:[42.3,43.7],door:'open'}],stallZ:-87.9,
  counter:[43.15,43.7,-91.3,-88.6],                       // the sinks
  floorSpot:[41.9,-90.7,1.9],slumpStall:1};               // where someone may lie (x, z, heading) and which stall someone may be slumped in
 // Things standing in the yard and the lane that a walker cannot pass through: [id, x0, x1, z0, z1]. Each is drawn by ncz-port.js in exactly this place.
 const BLOCKS=[
  ['booth',35.25,37.4,-105.9,-103.65],          // the ground control / customs booth in the yard's south-east corner (the landing terminal stands at its north side)
  ['terminal',35.15,36.05,-103.3,-102.7],
  ['fuel',16.3,19.5,-87.75,-86.2],              // the fuel bowser against the north wall
  ['loader',18.3,21.6,-105.85,-104.35],         // the cargo tug against the south wall
  ['crates-s',24.3,26.9,-105.85,-104.6],
  ['dumpster',29.3,32.2,-105.85,-104.45],
  ['crates-w1',13.15,14.4,-102.8,-100.4],
  ['crates-w2',13.15,14.4,-93.6,-91.2],
  ['stall',33.75,37.35,-88.35,-86.15],          // the food stall in the north-east nook
  ['stool-1',34.35,34.75,-89.2,-88.8],['stool-2',35.35,35.75,-89.2,-88.8],['stool-3',36.35,36.75,-89.2,-88.8],
  ['scooter',31.75,33.45,-87.0,-86.35],
  ['vending',40.55,42.75,-92.85,-92.02],        // two machines against the toilet's front wall
  ['mast-sw',13.25,13.75,-105.75,-105.25],['mast-nw',13.25,13.75,-86.75,-86.25],['mast-se',34.55,35.05,-105.75,-105.25],
  ['bollard-1',33.45,33.75,-100.15,-99.85],['bollard-2',33.45,33.75,-93.15,-92.85],['bollard-3',33.45,33.75,-90.65,-90.35],
  ['barrier-1',14.2,14.7,-100.2,-98.2],['barrier-2',19.9,20.4,-88.3,-86.5]];
 const H=7.2;
 const solid=(id,x0,x1,z0,z1,h=H)=>({id:'port-'+id,port:true,position:[(x0+x1)/2,h/2,(z0+z1)/2],size:[x1-x0,h,z1-z0]});
 /* Cut the rectangle `hole` out of a list of solids: every solid it overlaps is replaced by the up to four boxes around the hole. */
 function cut(list,[hx0,hx1,hz0,hz1]){const out=[];
  for(const s of list){const [cx,,cz]=s.position,[w,h,d]=s.size,x0=cx-w/2,x1=cx+w/2,z0=cz-d/2,z1=cz+d/2;
   if(s.door||hx0>=x1||hx1<=x0||hz0>=z1||hz1<=z0){out.push(s);continue;}
   const part=(k,a,b,c,e)=>{if(b-a>.01&&e-c>.01)out.push({...s,id:s.id+'~'+k,position:[(a+b)/2,s.position[1],(c+e)/2],size:[b-a,h,e-c]});};
   part('w',x0,Math.min(x1,hx0),z0,z1);part('e',Math.max(x0,hx1),x1,z0,z1);const a=Math.max(x0,hx0),b=Math.min(x1,hx1);part('s',a,b,z0,Math.min(z1,hz0));part('n',a,b,Math.max(z0,hz1),z1);}
  return out;}
 // The toilet's own walls and fittings.
 function wcSolids(){const W=WC,out=[],[rx0,rx1,rz0,rz1]=W.room;
  out.push(solid('wc-screen',...W.screen));
  for(const st of W.stalls)out.push(solid('wc-part-'+st.x[0],st.x[0]-.04,st.x[0]+.04,W.stallZ,rz1));
  W.stalls.forEach((st,i)=>{out.push(solid('wc-pan-'+i,(st.x[0]+st.x[1])/2-.25,(st.x[0]+st.x[1])/2+.25,rz1-.75,rz1));
   if(st.door==='shut')out.push(solid('wc-door-'+i,st.x[0],st.x[1],W.stallZ-.04,W.stallZ+.04));
   else{out.push(solid('wc-jamb-'+i,st.x[0],st.x[0]+.3,W.stallZ-.04,W.stallZ+.04));out.push(solid('wc-jamb2-'+i,st.x[1]-.2,st.x[1],W.stallZ-.04,W.stallZ+.04));}});
  out.push(solid('wc-front-stall',rx0,W.stalls[0].x[0],W.stallZ-.04,W.stallZ+.04));   // the cleaner's cupboard west of the stalls is shut
  out.push(solid('wc-counter',...W.counter));void rx1;void rz0;return out;}
 /* The Port's collision on top of the city's: the toilet cut out of the block north of the lane, then everything that stands in the yard. */
 function carve(solids){let list=cut(solids,WC.room);list=cut(list,[WC.door[0],WC.door[1],WC.front[0],WC.front[1]]);return list;}
 const solids=()=>[...BLOCKS.map(([id,x0,x1,z0,z1])=>solid(id,x0,x1,z0,z1)),...wcSolids()];
 const apply=list=>[...carve(list),...solids()];
 const inWC=(x,z,m=0)=>x>=WC.room[0]-m&&x<=WC.room[1]+m&&z>=WC.front[0]-m&&z<=WC.room[3]+m;

 /* MOUNTS: where an advertisement or information screen can hang (for the screens work; ncz-port.js hangs an unlit frame at each and builds no content).
    position: the centre of the picture; size [w,h] metres; ry: the rotation.y of a Babylon plane that faces the street from there; normal: the way it faces. */
 const MOUNTS=[
  {id:'port-north-tower',position:[27.4,15.2,-86.35],size:[6.4,9.6],ry:0,normal:[0,-1],note:'the tall face over the yard\'s north wall; seen from the whole yard'},
  {id:'port-west-wall',position:[13.45,11.4,-99.5],size:[4.8,7.2],ry:-Math.PI/2,normal:[1,0],note:'the west wall over the cargo doors; seen on the walk from the lane'},
  {id:'port-bridge',position:[40.75,12.0,-107.78],size:[5.2,2.9],ry:Math.PI,normal:[0,1],note:'the bridge over Port Customs, facing the Port; a wide banner format'},
  {id:'port-lane-east',position:[43.55,8.6,-97.5],size:[3.2,4.8],ry:Math.PI/2,normal:[-1,0],note:'the lane\'s east wall over the taxi stop'},
  {id:'port-south-roof',position:[19.5,17.2,-106.6],size:[8,4.5],ry:Math.PI,normal:[0,1],note:'a roof frame on the south block; seen from the deck and from a ship'}];
 /* FRONTAGES: ground-floor fronts kept free for a later entertainment venue (David, 16 Nov 2026: each quarter gets entertainment; nothing is built in the Port
    yet). from/to are the ends of the front on the street line; they are plain shuttered units for now. */
 const FRONTAGES=[
  {id:'port-venue-north',wall:'yard-north',from:[23,-86],to:[31.6,-86],normal:[0,-1],width:8.6,note:'two shuttered units under the north tower: the widest front in the Port'},
  {id:'port-venue-south',wall:'yard-south',from:[13,-106],to:[17.8,-106],normal:[0,1],width:4.8,note:'a single shuttered unit in the south-west corner: a small bar-sized front'}];
 // Housing entrances (doors that do not open): [id, wall, unit number].
 const HOUSING=[['north-a','yard-north','12'],['west-a','yard-west','7'],['lane-a','lane-east','44'],['stub-a','yard-stub','3'],['south-a','yard-south','28']];
 const FOOD={rect:[33.75,37.35,-88.35,-86.15],counterZ:-88.2,stools:[[34.55,-89],[35.55,-89],[36.55,-89]],vendor:[35.6,-87.2,Math.PI],customer:[35.55,-89.02,0]};
 /* Is someone in the toilet on this visit? Seeded by the day and the visit so it is "sometimes, not always": about three visits in five.
    Returns null, or {where:'stall'|'floor', look: an index into the caller's cast}. */
 function passedOut(day,visit){let s=(Math.floor(day)*7919+Math.floor(visit)*104729+13)%2147483647;const r=()=>((s=s*16807%2147483647)-1)/2147483646;r();r();r();const a=r();if(a>.6)return null;return {where:r()<.55?'stall':'floor',look:Math.floor(r()*1000)};}
 /* WALLS: every street wall of the Port, for the gap check (tests/ncz-port-browser.cjs and the shared ray-grid check). A wall runs from a to b on the street
    line; normal points out of it into the street; it must be closed (something drawn within `depth` metres behind the line) from the ground up to `height`.
    OPENINGS: the intentional holes in those walls. Each names its wall, the span along the wall measured from a (from, to), its height, and how far behind
    the line it must still be closed (`depth`: the room or lane behind it), so an opening is checked too, just deeper. */
 const WALLS=[
  {id:'yard-west',a:[13,-106],b:[13,-86],normal:[1,0],height:20,depth:1.2},
  {id:'yard-north',a:[13,-86],b:[37.5,-86],normal:[0,-1],height:17,depth:1.2},
  {id:'yard-stub',a:[37.5,-86],b:[37.5,-92],normal:[-1,0],height:22,depth:1.2},
  {id:'lane-north',a:[37.5,-92],b:[44,-92],normal:[0,-1],height:22,depth:1.2},
  {id:'lane-east',a:[44,-92],b:[44,-107],normal:[-1,0],height:24,depth:1.2},
  {id:'customs',a:[44,-107],b:[37.5,-107],normal:[0,1],height:17,depth:1.6},        // the gatehouse (ncz-gates.js) and the bridge over it
  {id:'yard-south',a:[37.5,-106],b:[13,-106],normal:[0,1],height:15,depth:1.2}];
 const OPENINGS=[
  {id:'wc-door',wall:'lane-north',from:WC.door[0]-37.5,to:WC.door[1]-37.5,height:2.3,depth:6.4,note:'the public toilet\'s doorway: the room behind it is 5.7 m deep and closed'},
  {id:'customs-bay',wall:'customs',from:44-43.8,to:44-40.9,height:3.8,depth:6.6,note:'Port Customs, vehicle bay: a shutter stands 0.35 m inside; beyond it the room is 6 m long'},
  {id:'customs-foot',wall:'customs',from:44-40.5,to:44-37.8,height:3.05,depth:6.6,note:'Port Customs, walkers\' door'}];
 const api={YARD,LANE,DECK,WC,BLOCKS,MOUNTS,FRONTAGES,HOUSING,FOOD,WALLS,OPENINGS,H,cut,carve,solids,apply,inWC,passedOut};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VoidPortData=api;
})(typeof globalThis!=='undefined'?globalThis:this);
