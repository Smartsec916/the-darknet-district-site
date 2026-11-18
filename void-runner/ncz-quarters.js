/* NeoChinatown's four quarters and the checkpoints between them (the owner's map A, 16 Nov 2026; Far South added the same day, docs/development/NEOCHINATOWN_QUARTERS.md).
   PURE RULES: no rendering, no clock, no network. Runs in the browser and in Node (tests/ncz-quarters.test.cjs).

   The outdoor city is one coordinate space (world metres, x east, z north) cut into four quarters. Only one is built at a time:
     port       The Port       the landing pad and the north part of the passage
     oldtown    Old Town       Main Street, the alley, NULL, the District's door, the access road
     avenue     The Avenue     the wide road across the top, between the Function Gate and the East Gate
     far-south  Far South      Main Street's second stretch, south of the South Gate: Milked, its side street and its service alley (the owner, 16 Nov 2026)
     outskirts  The Outskirts  past the Far South Gate: a rundown residential area of makeshift shipping-container homes on gravel walkways; the paved road ends at the gate
   A checkpoint (a "gate") is a small building standing in the street. It is built in BOTH quarters it joins, in the same place, so the player stands in the
   same room before and after the exchange (the way the District's vestibule and Milked's work). Each lane of a gate is a room with a door at each end; in any
   one quarter only the door on that quarter's side can open, so the two doors are never open together.
     A1 customs   Port Customs    Old Town <-> The Port        walkers and taxis   private guards
     A2 north     North Gate      Old Town <-> The Avenue      walkers and taxis   private guards
     A3 function  Function Gate   The Avenue <-> the Corporate District (its own scene)   walkers and taxis   The Function (silent stand-in robots)
     A4 east      East Gate       The Avenue <-> the Zen Zephyr Temple (its own scene)    walkers and taxis   private guards   (walkers' lane added 16 Nov 2026)
     A5 south     South Gate      Old Town <-> Far South       walkers and taxis   private guards   (opened 16 Nov 2026; it was shut)
     A6 far-south-gate  Far South Gate   Far South <-> The Outskirts   WALKERS ONLY (one pedestrian lane, no vehicle bay, no taxi)   private guards   (live since stage 2, 16 Nov 2026)
   NOT DECIDED, so not here: contraband, what happens when caught, bribes, shielding. The scan is a picture only and always lets the player through.
   Saves: nothing new is required. story.flags.quarter ('oldtown' | 'avenue'; absent = the Port) says which quarter an outdoor player was last in. */
(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports;
 const MK=node?require('./milked.js'):root.VoidMilked,NC=node?require('./ncz-nightclub.js'):root.VoidNightclub;
 // Streets as neochinatown.js has them (tests check these against it).
 const S={avenue:[2,152,-20,-5],main:[51,71,-124,-20],alley:[71,136,-61.6,-55.5],road:[13,51,-121,-116],passage:[37.5,44,-116,-92],pad:[13,37.5,-106,-86],southGate:[51,71,-130,-124],farSouth:[51,71,-224,-130],outskirts:[36,92,-260,-224],outskirtsWest:[20,36,-250,-240],outskirtsEast:[92,108,-248,-240]};
 const DISTRICT=[109.4,144.4,-120.4,-61.6],TERRACE=[78.4,99.4,-116.4,-95.4];
 const WALL_H=7.2,DOOR_T=.3;
 /* A gate. rect: the ground it stands on. axis: the direction of travel ('z': north-south, 'x': east-west). ends.lo / ends.hi: what lies beyond the end with
    the smaller / larger coordinate along that axis: a quarter of this city, or another scene. lanes: v is the span ACROSS the direction of travel. */
 const GATES=[
  {id:'customs',code:'A1',name:'Port Customs',sign:'CUSTOMS',guard:'private',rect:[37.5,44,-113,-107],axis:'z',ends:{lo:{quarter:'oldtown'},hi:{quarter:'port'}},
   lanes:[{id:'foot',kind:'foot',v:[37.8,40.5]},{id:'bay',kind:'bay',v:[40.9,43.8]}]},
  {id:'north',code:'A2',name:'North Gate',sign:'NORTH GATE',guard:'private',rect:[51,71,-26,-20],axis:'z',ends:{lo:{quarter:'oldtown'},hi:{quarter:'avenue'}},bridge:true,
   lanes:[{id:'foot-w',kind:'foot',v:[51.3,54.3]},{id:'bay-s',kind:'bay',v:[57,60.6],heading:'lo'},{id:'bay-n',kind:'bay',v:[61.4,65],heading:'hi'},{id:'foot-e',kind:'foot',v:[67.7,70.7]}]},
  {id:'function',code:'A3',name:'Function Gate',sign:'FUNCTION GATE',guard:'function',rect:[2,10,-20,-5],axis:'x',ends:{lo:{scene:'corporate'},hi:{quarter:'avenue'}},
   lanes:[{id:'foot',kind:'foot',v:[-19.7,-16.7]},{id:'bay',kind:'bay',v:[-11.2,-7.4]}]},
  {id:'east',code:'A4',name:'East Gate',sign:'EAST GATE',guard:'private',rect:[144,152,-20,-5],axis:'x',ends:{lo:{quarter:'avenue'},hi:{scene:'temple'}},
   lanes:[{id:'bay',kind:'bay',v:[-17.6,-13.8]},{id:'foot',kind:'foot',v:[-8.3,-5.3]}]},
  // A5 opened on 16 Nov 2026 (it was a shut wall at z -124..-122.4): Main Street goes on south into Far South. Built like the North Gate, without the bridge.
  {id:'south',code:'A5',name:'South Gate',sign:'SOUTH GATE',guard:'private',rect:[51,71,-130,-124],axis:'z',ends:{lo:{quarter:'far-south'},hi:{quarter:'oldtown'}},
   lanes:[{id:'foot-w',kind:'foot',v:[51.3,54.3]},{id:'bay-s',kind:'bay',v:[57,60.6],heading:'lo'},{id:'bay-n',kind:'bay',v:[61.4,65],heading:'hi'},{id:'foot-e',kind:'foot',v:[67.7,70.7]}]},
  // A6 (the owner, 16 Nov 2026): past it is The Outskirts. The road stops at the checkpoint, so it is a PEDESTRIAN vestibule only: one walkers' lane, no vehicle bay, and no taxi goes through (it is not in LINKS).
  {id:'far-south-gate',code:'A6',name:'Far South Gate',sign:'FAR SOUTH GATE',guard:'private',rect:[51,71,-224,-218],axis:'z',ends:{lo:{quarter:'outskirts'},hi:{quarter:'far-south'}},
   lanes:[{id:'foot',kind:'foot',v:[59.5,62.5]}]}];
 const gate=id=>GATES.find(g=>g.id===id)||null;
 const gateRect=id=>gate(id).rect;
 const QUARTERS={
  port:{id:'port',name:'The Port',spawn:[31,1.7,-96],yaw:2.44,streets:[S.pad,[37.5,44,-107,-92]],gates:['customs']},
  oldtown:{id:'oldtown',name:'Old Town',spawn:[126.9,1.7,-59.3],yaw:-Math.PI/2,
   streets:[[51,71,-124,-26],S.alley,S.road,[37.5,44,-116,-113],...(NC?[NC.RECT]:[])],places:[DISTRICT,TERRACE],gates:['customs','north','south']},
  avenue:{id:'avenue',name:'The Avenue',spawn:[69.2,1.7,-16.6],yaw:0,streets:[[10,144,-20,-5]],gates:['north','function','east']},
  // Far South (the owner, 16 Nov 2026): Main Street's second stretch. Milked, its side street and its service alley moved here, whole (milked.js OFFSET).
  'far-south':{id:'far-south',name:'Far South',spawn:[61,1.7,-140],yaw:Math.PI,streets:[[51,71,-218,-130],MK.LANE,MK.ALLEY],places:[MK.FOOTPRINT],gates:['south','far-south-gate']},
  // The Outskirts (the owner, 16 Nov 2026): gravel walkways and container homes. A compact hub with two lanes that end at containers; walkers only.
  outskirts:{id:'outskirts',name:'The Outskirts',spawn:[61,1.7,-229],yaw:Math.PI,streets:[S.outskirts,S.outskirtsWest,S.outskirtsEast],gates:['far-south-gate']}};
 const IDS=Object.keys(QUARTERS),DEFAULT='port';
 const valid=q=>IDS.includes(q)?q:null;
 const inRect=([x0,x1,z0,z1],x,z,m=0)=>x>=x0-m&&x<=x1+m&&z>=z0-m&&z<=z1+m;
 const rectDist=([x0,x1,z0,z1],x,z)=>Math.hypot(Math.max(x0-x,0,x-x1),Math.max(z0-z,0,z-z1));
 // Every rectangle that belongs to a quarter: its streets, its buildings with their own walls, and the gates standing at its edges.
 const region=q=>{const Q=QUARTERS[q];return Q?[...Q.streets,...(Q.places||[]),...Q.gates.map(gateRect)]:[];};
 const REGION=Object.fromEntries(IDS.map(q=>[q,region(q)]));
 /* ADDING A CHECKPOINT (the owner, 16 Nov 2026: more may come, as gameplay): one entry is the whole definition. Put it in GATES above, or call define() with it.
      id, code, name, sign (the word on the building), guard ('private' | 'function' | null), rect [x0,x1,z0,z1], axis ('z' | 'x'),
      ends {lo:{quarter|scene}, hi:{quarter|scene}} (what it connects; the SAME quarter at both ends makes a checkpoint inside a quarter: both doors work
      and nothing is exchanged), lanes [{id, kind:'foot'|'bay', v:[from,to], heading?}], and optionally shut, bridge, fortified, height.
    The building, its doors, scanner, guards, signs, collision and the walk-through are all made from that entry. */
 function define(g){if(!g||!g.id||gate(g.id))return false;GATES.push(g);LANES.push(...lanes(g));for(const e of ['lo','hi']){const q=g.ends?.[e]?.quarter;if(QUARTERS[q]&&!QUARTERS[q].gates.includes(g.id)){QUARTERS[q].gates.push(g.id);REGION[q]=region(q);}}return true;}
 const inQuarter=(q,x,z,m=0)=>!!REGION[q]&&REGION[q].some(r=>inRect(r,x,z,m));
 const distanceTo=(q,x,z)=>REGION[q]?Math.min(...REGION[q].map(r=>rectDist(r,x,z))):Infinity;
 // Which quarter a point is in. A point inside a gate belongs to both of its quarters; `prefer` settles it (the quarter the asker is in).
 function quarterAt(x,z,prefer){if(prefer&&inQuarter(prefer,x,z))return prefer;for(const q of IDS){const Q=QUARTERS[q];if([...Q.streets,...(Q.places||[])].some(r=>inRect(r,x,z)))return q;}for(const q of IDS)if(inQuarter(q,x,z))return q;return null;}
 /* What a quarter's build keeps (neochinatown.js asks for every piece it is about to make).
    detail: street furniture, signs, lamps, cables, kiosks: only what stands in the quarter or on its walls.
    building: the city blocks: those within sight of the quarter (45 m), and everything outside the old neighbourhood (the outer ring and the megacity, the shared backdrop). */
 const CORE=[-6,160,-270,2],DETAIL_MARGIN=2.6,BUILDING_MARGIN=45;
 const keepDetail=(q,x,z)=>!REGION[q]||inQuarter(q,x,z,DETAIL_MARGIN);
 const keepBuilding=(q,x,z)=>!REGION[q]||!inRect(CORE,x,z)||distanceTo(q,x,z)<=BUILDING_MARGIN;

 // ---- Gate geometry ----
 // u runs along the direction of travel, v across it. world(g,u,v) -> [x,z].
 const span=g=>g.axis==='z'?{u0:g.rect[2],u1:g.rect[3],v0:g.rect[0],v1:g.rect[1]}:{u0:g.rect[0],u1:g.rect[1],v0:g.rect[2],v1:g.rect[3]};
 const world=(g,u,v)=>g.axis==='z'?[v,u]:[u,v];
 const boxUV=(g,u0,u1,v0,v1)=>{const [xa,za]=world(g,u0,v0),[xb,zb]=world(g,u1,v1);return {x0:Math.min(xa,xb),x1:Math.max(xa,xb),z0:Math.min(za,zb),z1:Math.max(za,zb)};};
 const doorId=(g,l,end)=>'gate-'+g.id+'-'+l.id+'-'+end;
 const INSET=.35;   // how far inside the gate's end a door stands
 /* The lanes of a gate as rooms. Each: {gate, id, kind, key, rect [x0,x1,z0,z1], zone (the floor between the doors), centre (where a walker, or a cab's middle,
    must be for the doors to seal), doors:{lo,hi} each {id, x, z, half, height, axis ('x': the leaves slide along x)}, mid [x,z]}. */
 function lanes(g){if(g.shut)return [];   // a shut gate is one wall: its lanes are defined (so that opening it is one word) but nothing of them is built or walkable
  const s=span(g),mid=(s.u0+s.u1)/2;
  return g.lanes.map(l=>{const [v0,v1]=l.v,vc=(v0+v1)/2,foot=l.kind==='foot',half=foot?Math.min(1.05,(v1-v0)/2-.25):(v1-v0)/2-.15,height=foot?2.6:3.3,
    door=(end,u)=>{const [x,z]=world(g,u,vc);return {id:doorId(g,l,end),end,x,z,half,height,axis:g.axis==='z'?'x':'z',kind:l.kind};},
    r=boxUV(g,s.u0,s.u1,v0,v1),zn=boxUV(g,s.u0+INSET+.25,s.u1-INSET-.25,v0+.1,v1-.1),reach=foot?1.25:.7,c=boxUV(g,mid-reach,mid+reach,v0+.25,v1-.25),[mx,mz]=world(g,mid,vc);
   return {gate:g.id,id:l.id,kind:l.kind,key:g.id+':'+l.id,heading:l.heading||null,rect:[r.x0,r.x1,r.z0,r.z1],zone:[zn.x0,zn.x1,zn.z0,zn.z1],centre:[c.x0,c.x1,c.z0,c.z1],mid:[mx,mz],
    doors:{lo:door('lo',s.u0+INSET),hi:door('hi',s.u1-INSET)}};});}
 const LANES=GATES.flatMap(lanes);
 const lane=key=>LANES.find(l=>l.key===key)||null;
 const lanesOf=id=>LANES.filter(l=>l.gate===id);
 // Which end of a gate faces a quarter ('lo' | 'hi'), and what is beyond the other end.
 const endOf=(g,q)=>g.ends.lo?.quarter===q?'lo':g.ends.hi?.quarter===q?'hi':null;
 // Every end of a gate that faces quarter q: one for a gate at the quarter's edge, both for a checkpoint that stands INSIDE the quarter (no area changes there).
 const sidesOf=(g,q)=>['lo','hi'].filter(e=>g.ends[e]?.quarter===q);
 const internal=g=>!!g.ends.lo?.quarter&&g.ends.lo.quarter===g.ends.hi?.quarter;
 const other=end=>end==='lo'?'hi':'lo';
 const beyond=(g,q)=>{const e=endOf(g,q);return e?g.ends[other(e)]:null;};
 // The gates a quarter touches, and the lane a walker is standing in (null in the street).
 const gatesOf=q=>(QUARTERS[q]?.gates||[]).map(gate);
 function laneAt(p,q){const x=p.x??p[0],z=p.z??p[2]??p[1];for(const l of LANES){if(q&&!QUARTERS[q].gates.includes(l.gate))continue;if(inRect(l.zone,x,z))return l;}return null;}
 const atCentre=(l,p)=>inRect(l.centre,p.x??p[0],p.z??p[2]??p[1]);
 // A door may open in quarter q only if it is on q's side of its gate.
 const openable=(l,end,q)=>{const g=gate(l.gate);return g.ends[end]?.quarter===q;};
 // Where a player appears when a place beyond a gate sends them back on foot (the middle of the foot lane), facing into the city.
 function footArrival(gateId,q){const g=gate(gateId),l=lanesOf(gateId).find(x=>x.kind==='foot');if(!g||!l)return null;const e=endOf(g,q),toward=e==='lo'?-1:1,yaw=g.axis==='z'?(toward>0?0:Math.PI):(toward>0?Math.PI/2:-Math.PI/2);return {spawn:[l.mid[0],1.7,l.mid[1]],yaw,lane:l.key};}
 // The middle of a taxi bay and the way a cab points when it is heading out of the gate into quarter q.
 function bayPoint(gateId,laneId){const l=lane(gateId+':'+(laneId||'bay'))||lanesOf(gateId).find(x=>x.kind==='bay');return l?{x:l.mid[0],z:l.mid[1],lane:l.key}:null;}
 const yawInto=(gateId,q)=>{const g=gate(gateId),e=endOf(g,q),toward=e==='lo'?-1:1;return g.axis==='z'?(toward>0?0:Math.PI):(toward>0?Math.PI/2:-Math.PI/2);};

 /* Collision for one quarter: every gate at its edge as walls with a room per lane, and a door solid at each end of each lane (shut until the build opens it;
    the far one never opens here). A shut gate is one wall. Ids are stable: 'gate-<gate>-<lane>-<lo|hi>' for doors. */
 function solids(q){const out=[],Q=QUARTERS[q];if(!Q)return out;
  for(const g of gatesOf(q)){const s=span(g);
   const wallBox=(id,u0,u1,v0,v1)=>{if(u1-u0<.02||v1-v0<.02)return;const b=boxUV(g,u0,u1,v0,v1);out.push({id,gate:g.id,position:[(b.x0+b.x1)/2,WALL_H/2,(b.z0+b.z1)/2],size:[b.x1-b.x0,WALL_H,b.z1-b.z0]});};
   if(g.shut){wallBox('gate-'+g.id+'-wall',s.u0,s.u1,s.v0,s.v1);continue;}
   // solid between the lanes, the whole depth of the gate
   const ls=g.lanes.slice().sort((a,b)=>a.v[0]-b.v[0]);let v=s.v0,k=0;
   for(const l of ls){wallBox('gate-'+g.id+'-core-'+(k++),s.u0,s.u1,v,l.v[0]);v=l.v[1];}wallBox('gate-'+g.id+'-core-'+k,s.u0,s.u1,v,s.v1);
   for(const l of lanesOf(g.id))for(const end of ['lo','hi']){const d=l.doors[end],along=d.axis==='x';
    // door leaves, then the jambs either side of the doorway inside the lane
    out.push({id:d.id,gate:g.id,lane:l.key,door:true,end,open:false,position:[d.x,d.height/2+.05,d.z],size:along?[d.half*2,d.height+.1,DOOR_T]:[DOOR_T,d.height+.1,d.half*2]});
    const [v0,v1]=g.lanes.find(x=>x.id===l.id).v,u=g.axis==='z'?d.z:d.x,vc=(v0+v1)/2;
    wallBox(d.id+'-jamb-a',u-DOOR_T/2,u+DOOR_T/2,v0,vc-d.half);wallBox(d.id+'-jamb-b',u-DOOR_T/2,u+DOOR_T/2,vc+d.half,v1);}}
  return out;}

 // ---- Road taxis ----
 // Kerbside stops (the only places a cab sets down) and the two places beyond the gates. Ids 'main', 'avenue', 'alley-mouth', 'passage' and 'milked' are the
 // ones the game already used (map pins and saved waypoints keep working).
 const STOPS=[
  {id:'passage',name:'The Port',quarter:'port',position:[42.35,-99],heading:0,post:[43.55,-99,-Math.PI/2]},
  {id:'main',name:'Main Street',quarter:'oldtown',position:[61,-100],heading:0,post:[68.3,-100,-Math.PI/2]},
  {id:'milked',name:'Milked corner',quarter:'far-south',position:[61,-182],heading:0,post:[68.3,-182,-Math.PI/2]},   // moved with Milked, 100 m south (it was at z -82 in Old Town)
  {id:'alley-mouth',name:'NULL / the alley',quarter:'oldtown',position:[61,-66],heading:0,post:[68.3,-66,-Math.PI/2]},
  {id:'avenue',name:'The Avenue',quarter:'avenue',position:[40,-12.5],heading:Math.PI/2,post:[40,-7.7,0]},
  {id:'function-gate',name:'Function Gate',quarter:'avenue',position:[20,-12.5],heading:Math.PI/2,post:[20,-7.7,0]},
  {id:'east-gate',name:'East Gate',quarter:'avenue',position:[134,-12.5],heading:Math.PI/2,post:[134,-7.7,0]}];
 /* Where a taxi can be called by walking up and pressing the use key (the owner, 16 Nov 2026: "Couldn't figure out how to call a taxi"). post: [x, z, turn] of the pole with
    the TAXI plate: one on the pavement at every stop, and one by The Darknet District's door, where no road runs (a cab called there waits at the alley's mouth). */
 const CALL_POINTS=[...STOPS.map(s=>({id:s.id,quarter:s.quarter,post:s.post,stop:s.id})),{id:'district-door',quarter:'oldtown',post:[122.4,-61.15,Math.PI/2],stop:null}];
 const CALL_LABEL='CALL A TAXI',CALL_REACH=.75,CALL_RANGE=2.6;
 // The prompts for one quarter: each stands a step out from its post, on the walkable side.
 function callPrompts(q){return CALL_POINTS.filter(c=>c.quarter===q).map(c=>{const [x,z,t]=c.post,out=c.stop?stop(c.stop).position:[x,z+1];const d=Math.hypot(out[0]-x,out[1]-z)||1;
  return {id:'taxi-call-'+c.id,label:CALL_LABEL,position:[x+(out[0]-x)/d*CALL_REACH,1.7,z+(out[1]-z)/d*CALL_REACH],action:'road-taxi-call',range:CALL_RANGE};});}
 const FAR_FARE=60;
 const FAR=[{id:'corporate',name:'Corporate District',scene:'corporate',gate:'function',from:'avenue',fare:FAR_FARE,returnStop:'function-gate'},
  {id:'temple',name:'Zen Zephyr Temple',scene:'temple',gate:'east',from:'avenue',fare:FAR_FARE,returnStop:'east-gate'}];
 const REMOVED_STOPS=['corporate','containers'];   // sky-cab landing zones that no longer exist (a saved map waypoint on one is cleared)
 const stop=id=>STOPS.find(s=>s.id===id)||null,far=id=>FAR.find(f=>f.id===id)||null;
 // The gates a trip passes, in order: from a quarter to another quarter or to a far place. [] when it stays in one quarter; null when there is no way.
 const LINKS={port:[['customs','oldtown']],oldtown:[['customs','port'],['north','avenue'],['south','far-south']],avenue:[['north','oldtown']],'far-south':[['south','oldtown']]};   // (no link through A6: it is walkers only, no taxi goes to The Outskirts)
 function gatesBetween(from,to){if(!valid(from))return null;const f=far(to);const goal=f?f.from:to;if(!valid(goal))return null;
  const seen=new Set([from]),queue=[[from,[]]];let path=null;
  while(queue.length){const [q,p]=queue.shift();if(q===goal){path=p;break;}for(const [g,n] of LINKS[q]||[])if(!seen.has(n)){seen.add(n);queue.push([n,[...p,{gate:g,from:q,to:n}]]);}}
  if(!path)return null;if(f)path=[...path,{gate:f.gate,from:f.from,to:null,scene:f.scene}];return path;}
 // The bay a cab uses in a gate when it leaves quarter `from` through it (two-bay gates keep one for each direction).
 function bayFor(gateId,from){const g=gate(gateId),e=endOf(g,from),out=e?other(e):null,ls=lanesOf(gateId).filter(l=>l.kind==='bay');return ls.find(l=>l.heading===out)||ls[0]||null;}

 // ---- Saves ----
 const FLAG='quarter';
 // The quarter an outdoor player resumes in: the saved one, or the Port (where the street has always put a player with no position).
 const resumeQuarter=s=>valid(s?.story?.flags?.[FLAG])||DEFAULT;
 function remember(s,q){const f=s?.story?.flags;if(!f)return;if(valid(q)&&q!==DEFAULT)f[FLAG]=q;else delete f[FLAG];}
 /* Where a player appears when a save, a link or a script places them at `spawn` ([x, y, z]) and the point may be from BEFORE Milked moved (16 Nov 2026), or on a street that
    no longer exists. A point that is inside a quarter stays as it is. Otherwise:
      - a point in Milked's old block (its footprint, its side street, its service alley: milked.js fromOld) goes with Milked, by its OFFSET, into Far South; one that falls inside the
        building (a player who was INSIDE Milked) is put outside its front door, on the side street, so nobody is placed inside a wall;
      - any other point is moved to the nearest open street of `saved` (the quarter the save remembers, else the Port), a metre in from the edge.
    Returns {quarter, spawn, moved}. No save stores a street position today (every login wakes in the Sleeping Pod), so this guards anything that ever hands one over. */
 function settle(spawn,saved){if(!spawn||spawn.length<3)return null;const [x,y,z]=spawn;let q=quarterAt(x,z);if(q)return {quarter:q,spawn:spawn.slice(),moved:false};
  const m=MK&&MK.fromOld?MK.fromOld(x,z):null;
  if(m){let [nx,nz]=m;if(MK.inside({x:nx,z:nz})){nx=MK.DOOR.x;nz=MK.DOOR.z+1.4;}return {quarter:'far-south',spawn:[nx,y,nz],moved:true};}
  const home=valid(saved)||DEFAULT;let best=null;
  for(const r of QUARTERS[home].streets){const px=Math.max(r[0]+1,Math.min(r[1]-1,x)),pz=Math.max(r[2]+1,Math.min(r[3]-1,z)),d=Math.hypot(px-x,pz-z);if(!best||d<best.d)best={d,p:[px,pz]};}
  return best?{quarter:home,spawn:[best.p[0],y,best.p[1]],moved:true}:{quarter:home,spawn:QUARTERS[home].spawn.slice(),moved:true};}
 /* Old saves: the sky cabs are gone. A fare recorded for a flight in progress comes back once; the records are dropped; a map waypoint on a removed
    landing zone is cleared. Returns the credits refunded. */
 function migrateSave(s){const f=s?.story?.flags;if(!f)return 0;let back=0;
  for(const k of ['taxiTrip','skyCabTrip']){const m=/^[a-z-]{1,24}:(\d{1,4})$/.exec(String(f[k]||''));if(m){const n=Number(m[1]);if(n>0&&n<=60)back+=n;}delete f[k];}
  delete f.cabReturn;
  if(typeof f.deviceWaypoint==='string'&&REMOVED_STOPS.some(id=>f.deviceWaypoint==='taxi-'+id))delete f.deviceWaypoint;
  if(f[FLAG]!==undefined&&!valid(f[FLAG]))delete f[FLAG];
  if(back&&typeof s.credits==='number')s.credits+=back;return back;}

 /* A fortified gate's two corner pylons (ncz-gates.js), as [from, to] spans ACROSS the gate. Each stands at its edge of the gate, 1.5 m wide, but never over a
    lane's opening: where the outer core beside a lane is narrower than that (the East and Function Gates' walkers' lanes run 0.3 m from the gate's edge), the
    pylon stands from the lane's wall outward instead, into the building row beside the gate. (The East Gate's foot lane was half hidden inside its pylon, 18 Nov 2026.) */
 function pylons(g,w=1.5){const s=span(g),ls=(g.lanes||[]).slice().sort((a,b)=>a.v[0]-b.v[0]),first=ls[0],last=ls[ls.length-1];
  const lo=first&&first.v[0]-s.v0<w?[first.v[0]-w,first.v[0]]:[s.v0,s.v0+w],hi=last&&s.v1-last.v[1]<w?[last.v[1],last.v[1]+w]:[s.v1-w,s.v1];return [lo,hi];}
 const api={S,lanesOfGate:lanes,pylons,settle,QUARTERS,IDS,DEFAULT,GATES,LANES,STOPS,CALL_POINTS,CALL_LABEL,callPrompts,FAR,FAR_FARE,REMOVED_STOPS,FLAG,WALL_H,DOOR_T,valid,gate,lane,lanesOf,gatesOf,region,inQuarter,distanceTo,quarterAt,keepDetail,keepBuilding,
  span,world,endOf,sidesOf,internal,define,other,beyond,laneAt,atCentre,openable,footArrival,bayPoint,bayFor,yawInto,solids,stop,far,gatesBetween,resumeQuarter,remember,migrateSave};
 if(node)module.exports=api;else root.VoidQuarters=api;
})(typeof globalThis!=='undefined'?globalThis:this);
