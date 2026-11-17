/* MILKED: a small adult livestreaming production studio (NOT a nightclub, clinic, laboratory or public venue) on a quiet side street off Main Street, NeoChinatown.
   docs/development/MILKED.md has the design. The building only makes broadcasts: members watch from home, and nothing is collected and no procedure of any kind
   happens here. Every performer is an adult and everything shown is clothed and non-explicit.
   PURE DATA first (names, rooms, walls, interactions, places, the inactive mission): runs in Node and is unit-tested (tests/milked.test.cjs).
   The Babylon presentation is milked-build.js. Since 16 Nov 2026 the INSIDE is its own environment (location key 'milked'), reached through the front security
   vestibule or the rear lobby, exactly as The Darknet District is reached through its vestibule (milked-transition.js). The street scene builds only the shell,
   the vestibule and the rear lobby (streamed in at about 90 m, disposed beyond about 140 m by neochinatown.js streamDistricts).

   ==== WHERE TO CHANGE THINGS ====
   - Fish's name:            CONFIG.FISH_NAME below (the only place it is written).
   - Eva's model:            MODELS.eva  (milked-eva; separate from the VR companion Eva)  -> set `asset` to a packaged model id; until then the `look` is a clothed crowd model.
   - Fish's model:           MODELS.fish (milked-fish) -> same.
   - The four dancers:       STUDIOS below (one per studio: `look` is a clothed crowd figure, `clips` its own dance, `library` the shared-library clip used when that file is installed).
   - Dialogue (provisional): DIALOGUE below.  Nothing here is approved canon until the owner approves it.
   - The inactive mission:   MISSION below (data only; nothing registers it with VoidMissions). */
(function(root){
 'use strict';
 /* WHERE IT STANDS (the owner, 16 Nov 2026: "I want Milked moved to the next area. Nothing changed on the exterior or interior of Milked, just moved.").
    Everything below is written in the building's OWN frame, exactly as it was drawn and built (the numbers in docs/development/MILKED.md before the move).
    OFFSET carries the whole building, both environments (the street side and the inside), by ONE rigid translation [dx, dz] metres to where it stands in the
    city: Far South, the second stretch of Main Street (ncz-quarters.js). No mirror, no turn, no change of any offset to Main Street: the same side of the street,
    the same distance from it, the same doors. Every name this file exports (FOOTPRINT, DOOR, solids(), PLACES, gateAt, layout() ...) is in WORLD metres, so
    the street, the map, the taxis, the doors and multiplayer all read where Milked really is. milked-build.js draws in the building's own frame, under a node moved by
    OFFSET (LOCAL below), so not one number inside the build changed. To move it again, change OFFSET and nothing else (then the street data in neochinatown.js and
    ncz-quarters.js that places the quarter around it). */
 const OFFSET=[0,-100];
 const CONFIG={NAME:'MILKED',TAGLINE:'LIVE · PRIVATE · ADULTS ONLY',BUSINESS:'small adult livestreaming production studio',NIGHTCLUB:false,ON_SITE_COLLECTION:false,
  FISH_NAME:'Fish',      // <<< Fish's display name. Change it here and nowhere else.
  EVA_NAME:'Eva',PROVISIONAL:true};
 // Replacement points for the two characters. `look` is the clothed placeholder crowd model used today. To use a real model, package it with the usual private asset
 // process, then set `asset` to its id: create() uses it when VoidAssets has it and falls back to `look` when it does not.
 const MODELS={
  eva:{id:'milked-eva',name:CONFIG.EVA_NAME,role:'RECEPTION · MILKED',look:'ncz-neon',asset:null,clips:['talk','idle'],at:[81.3,-81.32],face:[81.3,-78],note:'REPLACEMENT POINT: Milked Eva (not the VR companion Eva).'},
  fish:{id:'milked-fish',name:CONFIG.FISH_NAME,role:'OFFICE · MILKED',look:'npc-fish',asset:null,clips:['watch','idle'],at:[95.6,-76.9],face:[98,-76.9],note:'Her own model since 16 Nov 2026 (void-runner/assets/models/crowd/npc-fish.glb: Meshy, from a concept she and the owner approved).'}};
 // Provisional placeholder lines. Eva's background follows Origins (livestream performer, neural-network engineer, built Iris with the player's character).
 const DIALOGUE={
  eva:{greeting:['Welcome to Milked. We are a small broadcast studio. Everything made here goes out live to members who watch from home.',
   'Nothing but broadcasting happens in this building. The rest of the service is private, at the member\'s own address.',
   'Yes, I perform on camera. Some nights I still do. The channel pays for the part of my life I actually care about.',
   'I build neural networks. This place has good bandwidth, thick walls and very few questions.',
   'The studios are through the door beside my desk. You can watch from the hallway windows. Please do not knock on the glass. Fish is in the office at the back.']},
  fish:{greeting:['Office. Mind the cables.','Four studios, fixed cameras, nobody behind them. I run every camera from this desk.',
   'Eva runs the front and the technical side. I keep the lights on and the paperwork honest.']}};
 // MISSION 3: data only, INACTIVE. Nothing registers it with VoidMissions and nothing starts it; the beginner missions are untouched. Needs the owner's approval to activate.
 // number: none. This inactive draft once carried 3 as a placeholder; Mission 003 is the owner's Corporate Connections (main-story.js, 17 Nov 2026), and numbers are never shared.
 const MISSION={id:'meet-eva-milked',number:null,title:'MEET EVA AT MILKED',active:false,status:'inactive',approval:'PROPOSED (placeholder data, not approved canon)',giver:null,npc:'milked-eva',location:'milked',
  objective:'Travel to Milked, on the side street off Main Street, and talk to Eva at reception.',steps:[{id:'arrive',text:'Reach Milked (the side street off the east side of Main Street, or take a taxi).'},{id:'reception',text:'Talk to Eva at the reception desk.'}],
  dialogue:['eva.greeting'],reward:null};

 // ---- Geometry (world metres, x east, z north). FOOTPRINT is the whole business: a 20 m by 16 m infill in the block east of Main Street. ----
 // LANE is the quiet side street its front door opens onto (a dead end off Main Street); ALLEY is the service alley behind it, which also runs back to Main Street.
 const FOOTPRINT=[78,98,-90,-74],LANE=[71,101,-74,-68.5],ALLEY=[71,98.5,-93.5,-90];
 const DOOR={x:81.75,z:-74,half:1,height:2.7},INNER={x:81.75,z:-77,half:1,height:2.5},REAR={x:94.75,z:-90,half:.7,height:2.3};
 const VESTIBULE=[79.75,83.75,-77,-74],HALL=[85.5,93.5,-82.8,-80.8];
 /* The STAFF ONLY door at the far (east) end of the studio hallway, into the staff corridor and Fish's office. Locked for a player until Eva grants access (Mission 003:
    story.flags.mf_milkedStaff, set by the mission's 'flag' unlock). The rear lobby (from the service alley) is the staff and deliveries entrance and is not changed. */
 const STAFF_DOOR={id:'milked-staff-door',x:93.5,z:-81.8,half:.65},STAFF_FLAG='mf_milkedStaff';
 const staffAccess=flags=>!!flags&&typeof flags==='object'&&flags[STAFF_FLAG]===true;   // flags: the player's story flags (read only: nothing here writes to the save)
 // The rear lobby: a small airlock between the staff area and the service alley. Its two inner doors lead to the staff corridor (north) and the rear corridor (west).
 const LOBBY=[93.5,96,-90,-87.4],LOBBY_N={x:94.75,z:-87.4,half:.7,height:2.2},LOBBY_W={x:93.5,z:-89,half:.65,height:2.2};
 /* The five real doors. Each has a collision box (in solids(), id = the door's id) that is in place whenever the door is less than 80% open. `side` says which
    environment may open it: the street opens only the two outer doors, the interior only the three inner ones, so an outer and an inner door are never open
    together and the only way through is the checkpoint in the middle (milked-transition.js). axis 'x': the leaves slide along x (the door is in a z wall). */
 const DOORS=[
  {id:'milked-door',gate:'front',side:'street',axis:'x',x:DOOR.x,z:DOOR.z,half:DOOR.half,height:DOOR.height,leaves:2,reach:2.6},
  {id:'milked-inner-door',gate:'front',side:'interior',axis:'x',x:INNER.x,z:INNER.z,half:INNER.half,height:INNER.height,leaves:2,reach:2.6},
  {id:'milked-rear-door',gate:'rear',side:'street',axis:'x',x:REAR.x,z:REAR.z,half:REAR.half,height:REAR.height,leaves:1,reach:2.4},
  {id:'milked-lobby-north',gate:'rear',side:'interior',axis:'x',x:LOBBY_N.x,z:LOBBY_N.z,half:LOBBY_N.half,height:LOBBY_N.height,leaves:1,reach:2.3},
  {id:'milked-lobby-west',gate:'rear',side:'interior',axis:'z',x:LOBBY_W.x,z:LOBBY_W.z,half:LOBBY_W.half,height:LOBBY_W.height,leaves:1,reach:2.3}];
 /* The two checkpoints. `zone` is the whole floor between the doors (leaving it re-arms the checkpoint); `centre` is where a player must stand for the doors to
    seal: clear of every doorway, so no door is held open by the player. Rectangles are [x0, x1, z0, z1]. */
 const GATES={
  front:{id:'front',name:'Security vestibule',zone:[VESTIBULE[0]+.12,VESTIBULE[1]-.12,VESTIBULE[2]+.12,VESTIBULE[3]-.12],centre:[80.3,83.2,-76.15,-74.85],outer:'milked-door',inner:['milked-inner-door']},
  rear:{id:'rear',name:'Rear lobby',zone:[LOBBY[0]+.12,LOBBY[1]-.12,LOBBY[2]+.12,LOBBY[3]-.12],centre:[94.25,95.5,-89.15,-88.25],outer:'milked-rear-door',inner:['milked-lobby-north','milked-lobby-west']}};
 // The environment key (VoidExplorationData.locations.milked) and the `area` its location record carries. The street keeps NeoChinatown's own key.
 const KEY='milked',AREA='milked';
 // The nearest taxi stop is on Main Street ("Milked corner", ncz-quarters.js STOPS): the side street is too narrow for a cab.
 const TAXI={id:'milked',position:[61,-82],heading:0};
 const T=.24,H=6,CEIL=3.2;
 // Wall segments: [id, 'x'|'z', fixed coordinate, from, to, gaps]. A 'x' wall runs north-south at x = fixed; a 'z' wall runs east-west at z = fixed.
 const SEGMENTS=[
  ['front','z',-74,78,98,[[DOOR.x-DOOR.half,DOOR.x+DOOR.half]]],['rear','z',-90,78,98,[[REAR.x-REAR.half,REAR.x+REAR.half]]],['west','x',78,-90,-74,[]],['east','x',98,-90,-74,[]],
  ['vest-west','x',VESTIBULE[0],VESTIBULE[2],-74,[]],['vest-east','x',VESTIBULE[1],VESTIBULE[2],-74,[]],['vest-inner','z',INNER.z,VESTIBULE[0],VESTIBULE[1],[[INNER.x-INNER.half,INNER.x+INNER.half]]],
  ['reception-south','z',-82.8,78,85.5,[]],['reception-east','x',85.5,-88,-74,[[-82.45,-81.15]]],
  ['hall-north','z',-80.8,85.5,93.5,[]],['hall-south','z',-82.8,85.5,93.5,[]],['studio-1|2','x',89.5,-80.8,-74,[]],['studio-3|4','x',89.5,-88,-82.8,[]],
  ['staff-west','x',93.5,LOBBY_N.z,-74,[[-82.45,-81.15]]],['rear-corridor','z',-88,78,93.5,[[79.3,80.6]]],['dressing-a|b','x',81.75,-88,-82.8,[]],
  ['office-south','z',-79.6,93.5,98,[[94.1,95.4]]],
  ['lobby-north','z',LOBBY_N.z,93.5,96,[[LOBBY_N.x-LOBBY_N.half,LOBBY_N.x+LOBBY_N.half]]],['lobby-east','x',96,-90,LOBBY_N.z,[]],['lobby-west','x',93.5,-90,LOBBY_N.z,[[LOBBY_W.z-LOBBY_W.half,LOBBY_W.z+LOBBY_W.half]]],
  ['restroom-west','x',96,LOBBY_N.z,-81,[]],['restroom-north','z',-81,96,98,[]],['restroom-mid','z',-84.5,96,98,[]],['restroom-south','z',-88,96,98,[]]];
 // Furniture and equipment that blocks movement: [id, x0, x1, z0, z1, height]
 const FURNITURE=[
  ['reception-desk',79.6,83,-81,-80.2,1.1],['desk-return-w',79.6,79.9,-82.68,-81,1.1],['desk-return-e',82.7,83,-82.68,-81,1.1],['reception-bench',83.95,85.3,-74.9,-74.3,.5],['reception-planter',78.3,79.1,-75.1,-74.3,1],['reception-shelves',78.14,78.6,-80,-76.4,2],
  // the shopfront stands half a metre proud of the old wall, so the doors sit in a recess
  ['front-clad-w',78,80.55,-73.9,-73.5,6],['front-clad-e',82.95,98,-73.9,-73.5,6],['front-bamboo',83.85,84.55,-73.5,-72.95,1.6],
  ['office-desk',96.5,97.3,-78.4,-75.4,.8],['office-shelf',95.85,97.35,-74.6,-74.2,1.6],['office-couch',93.8,95.5,-75.1,-74.3,.8],['office-case',93.7,94.3,-77.6,-76.6,.7],['staff-lockers',93.62,94.05,-87.1,-83.7,2],
  ['dressing-counter',78.4,81.4,-83.45,-82.92,.8],['dressing-rail',78.15,78.6,-87.4,-84.6,1.7],['corridor-cases',78.2,79,-89.8,-88.3,1],['corridor-cart',81.6,82.7,-89.85,-89.2,.9],
  ['alley-dumpster',86,88,-91.15,-90.15,1.3],['alley-crates',96.7,98.3,-93.35,-92.2,1.2]];
 // Rooms: the registry the map, the tests and the editor read. zone: public, studios, staff. `closed` rooms are seen (through a window) or signed, never entered.
 const ROOMS=[
  {id:'vestibule',name:'Security vestibule',zone:'public',rect:VESTIBULE},
  {id:'reception',name:'Reception',zone:'public',rect:[78,85.5,-82.8,-74]},
  {id:'hallway',name:'Studio hallway',zone:'studios',rect:HALL},
  {id:'studio-1',name:'Studio 1',zone:'studios',rect:[85.5,89.5,-80.8,-74],kind:'studio',closed:true},
  {id:'studio-2',name:'Studio 2',zone:'studios',rect:[89.5,93.5,-80.8,-74],kind:'studio',closed:true},
  {id:'studio-3',name:'Studio 3',zone:'studios',rect:[85.5,89.5,-88,-82.8],kind:'studio',closed:true},
  {id:'studio-4',name:'Studio 4',zone:'studios',rect:[89.5,93.5,-88,-82.8],kind:'studio',closed:true},
  {id:'office',name:CONFIG.FISH_NAME+'\'s office',zone:'staff',rect:[93.5,98,-79.6,-74]},
  {id:'staff-corridor',name:'Staff corridor',zone:'staff',rect:[93.5,96,-87.4,-79.6]},
  {id:'rear-lobby',name:'Rear lobby',zone:'staff',rect:LOBBY},
  {id:'rear-corridor',name:'Rear corridor',zone:'staff',rect:[78,93.5,-90,-88]},
  {id:'dressing-a',name:'Dressing room A',zone:'staff',rect:[78,81.75,-88,-82.8]},
  {id:'dressing-b',name:'Dressing room B',zone:'staff',rect:[81.75,85.5,-88,-82.8],closed:true},
  {id:'restroom-1',name:'Staff restroom',zone:'staff',rect:[96,98,-84.5,-81],closed:true},
  {id:'restroom-2',name:'Staff restroom',zone:'staff',rect:[96,98,-88,-84.5],closed:true}];
 // The four livestream studios. Each has exactly one adult dancer (a clothed crowd figure), its own lighting and its own set. `window` and `door` are the spans
 // (along x) of the observation window and the closed studio door in the hallway wall. `clips` are the look's own clips, tried in order; `library` is a clip from
 // the shared animation library (anim-library.js), used instead when that licensed file is installed.
 const STUDIOS=[
  {n:1,room:'studio-1',light:'pink',theme:'velvet',window:[86,88.4],door:[88.55,89.35],dancer:{id:'milked-dancer-1',look:'district-resident',clips:['dance','idle'],library:'ac-sensual-dance-3'}},
  {n:2,room:'studio-2',light:'green',theme:'fern',window:[90,92.4],door:[92.55,93.35],dancer:{id:'milked-dancer-2',look:'vr-companion-f',clips:['slow-dance','dance','idle'],library:'ac-sensual-movement-1'}},
  {n:3,room:'studio-3',light:'mixed',theme:'arcade',window:[86.6,89],door:[85.65,86.45],dancer:{id:'milked-dancer-3',look:'vr-companion-m',clips:['dance-samba','dance','idle'],library:'ac-stand-curve-2'}},
  {n:4,room:'studio-4',light:'mixed',theme:'mirror',window:[90.6,93],door:[89.65,90.45],dancer:{id:'milked-dancer-4',look:'vr-player-b',clips:['dance','idle'],library:'ac-stand-curve-3'}}];
 // Everything the player can use. Handlers are registered by milked-integration.js.
 const INTERACTIONS=[
  {id:'milked-intercom',label:'VISITOR CHECK-IN',position:[80.2,1.7,-75.5],action:'milked-intercom',range:1.5,both:true},
  {id:'milked-eva',label:'TALK TO '+CONFIG.EVA_NAME.toUpperCase(),position:[81.3,1.7,-80.1],action:'milked-eva',range:3},
  {id:'milked-security',label:'SECURITY MONITORS',position:[84.3,1.7,-82.1],action:'milked-security',range:1.8},
  ...STUDIOS.map(s=>({id:'milked-studio-'+s.n,label:'STUDIO '+s.n+' · OBSERVATION WINDOW',position:[(s.window[0]+s.window[1])/2,1.7,s.n<3?-81.35:-82.25],action:'milked-studio',studio:s.n,range:1.25})),
  {id:'milked-fish',label:'TALK TO '+CONFIG.FISH_NAME.toUpperCase(),position:[95.5,1.7,-76.5],action:'milked-fish',range:2.4},
  {id:'milked-cameras',label:'REMOTE CAMERA CONTROLS',position:[96.3,1.7,-78.7],action:'milked-cameras',range:1.5},
  {id:'milked-dressing-b',label:'DRESSING ROOM B',position:[83.6,1.7,-88.4],action:'milked-dressing',range:1.5},
  {id:'milked-restroom',label:'STAFF RESTROOMS',position:[95.6,1.7,-84.5],action:'milked-restroom',range:1.6}];
 // Names for the V1 Map (district-map.js reads these). x, z are where the pin goes.
 const PLACES=[
  {id:'milked-entrance',name:CONFIG.NAME+' · entrance',kind:'shop',x:DOOR.x,z:DOOR.z+1.4},
  {id:'milked-reception',name:CONFIG.NAME+' · reception',kind:'service',x:81.6,z:-79},
  {id:'milked-studios',name:CONFIG.NAME+' · studio hallway',kind:'service',x:89.5,z:-81.8},
  {id:'milked-office',name:CONFIG.NAME+' · '+CONFIG.FISH_NAME+'\'s office',kind:'service',x:95.75,z:-77},
  {id:'milked-rear-door',name:CONFIG.NAME+' · rear door (service alley)',kind:'service',x:REAR.x,z:REAR.z-1.2}];
 const BOUNDS={rect:FOOTPRINT};

 // ---- the building's own frame: tests and the 3D build use these (LOCAL below) ----
 const inRect=([x0,x1,z0,z1],x,z)=>x>=x0&&x<=x1&&z>=z0&&z<=z1;
 const inside=p=>!!p&&p.x>FOOTPRINT[0]+.1&&p.x<FOOTPRINT[1]-.1&&p.z>FOOTPRINT[2]+.1&&p.z<FOOTPRINT[3]-.1;
 const distance=(x,z)=>Math.hypot(Math.max(FOOTPRINT[0]-x,0,x-FOOTPRINT[1]),Math.max(FOOTPRINT[2]-z,0,z-FOOTPRINT[3]));
 const roomAt=(x,z)=>ROOMS.filter(r=>inRect(r.rect,x,z)).sort((a,b)=>(a.rect[1]-a.rect[0])*(a.rect[3]-a.rect[2])-(b.rect[1]-b.rect[0])*(b.rect[3]-b.rect[2]))[0]||null;
 const spansOf=([,,,a,b,gaps])=>{const spans=[];let from=a;for(const [g0,g1] of [...gaps].sort((p,q)=>p[0]-q[0])){if(g0>from)spans.push([from,g0]);from=Math.max(from,g1);}if(b>from)spans.push([from,b]);return spans;};
 function solidsLocal(){
  const out=[];
  for(const seg of SEGMENTS){const [id,axis,c]=seg,spans=spansOf(seg);
   spans.forEach(([s0,s1],i)=>out.push({id:'milked-wall-'+id+(spans.length>1?'-'+i:''),position:axis==='x'?[c,H/2,(s0+s1)/2]:[(s0+s1)/2,H/2,c],size:axis==='x'?[T,H,s1-s0]:[s1-s0,H,T]}));}
  for(const [id,x0,x1,z0,z1,h] of FURNITURE)out.push({id:'milked-'+id,position:[(x0+x1)/2,h/2,(z0+z1)/2],size:[x1-x0,h,z1-z0]});
  // the doors: shut until the door control (milked-build.js) opens them
  for(const d of DOORS)out.push({id:d.id,door:true,position:[d.x,d.height/2,d.z],size:d.axis==='x'?[d.half*2,d.height,T]:[T,d.height,d.half*2]});
  return out;}
 // The staff-only door at the far end of the studio hallway (Mission 003, 17 Nov 2026): locked (solid) until Eva lets this player through (story flag STAFF_FLAG);
 // milked-build.js opens it, per player, only for a player who has that flag. Only the interior has it (the street never reaches that part of the building).
 const staffSolidLocal=()=>({id:STAFF_DOOR.id,staff:true,position:[STAFF_DOOR.x,1.1,STAFF_DOOR.z],size:[T,2.2,STAFF_DOOR.half*2]});
 const gateAtLocal=p=>{if(!p)return null;for(const g of Object.values(GATES))if(inRect(g.zone,p.x,p.z))return g;return null;};
 // Which doors an environment may open ('street' or the interior).
 const openable=(d,area)=>d.side===(area===AREA?'interior':'street');
 const LOCAL={STAFF_DOOR,CONFIG,MODELS,FOOTPRINT,LANE,ALLEY,DOOR,INNER,REAR,VESTIBULE,HALL,LOBBY,LOBBY_N,LOBBY_W,DOORS,GATES,TAXI,SEGMENTS,FURNITURE,ROOMS,STUDIOS,INTERACTIONS,PLACES,KEY,AREA,T,H,CEIL,spansOf,inside,distance,roomAt,solids:solidsLocal};

 // ---- the same things in WORLD metres: what the rest of the game reads ----
 const [OX,OZ]=OFFSET;
 const R=r=>[r[0]+OX,r[1]+OX,r[2]+OZ,r[3]+OZ],P=o=>({...o,x:o.x+OX,z:o.z+OZ}),local=p=>p?{...p,x:p.x-OX,z:p.z-OZ}:p;
 const WFOOTPRINT=R(FOOTPRINT),WLANE=R(LANE),WALLEY=R(ALLEY),WDOOR=P(DOOR),WINNER=P(INNER),WREAR=P(REAR),WVESTIBULE=R(VESTIBULE),WHALL=R(HALL),WLOBBY=R(LOBBY),WLOBBY_N=P(LOBBY_N),WLOBBY_W=P(LOBBY_W);
 const WDOORS=DOORS.map(P),WGATES=Object.fromEntries(Object.entries(GATES).map(([k,g])=>[k,{...g,inner:g.inner.slice(),zone:R(g.zone),centre:R(g.centre)}]));
 const WTAXI={...TAXI,position:[TAXI.position[0]+OX,TAXI.position[1]+OZ]};
 const WSEGMENTS=SEGMENTS.map(([id,axis,c,a,b,gaps])=>axis==='x'?[id,axis,c+OX,a+OZ,b+OZ,gaps.map(([g0,g1])=>[g0+OZ,g1+OZ])]:[id,axis,c+OZ,a+OX,b+OX,gaps.map(([g0,g1])=>[g0+OX,g1+OX])]);
 const WFURNITURE=FURNITURE.map(([id,x0,x1,z0,z1,h])=>[id,x0+OX,x1+OX,z0+OZ,z1+OZ,h]);
 const WROOMS=ROOMS.map(r=>({...r,rect:R(r.rect)}));
 const WSTUDIOS=STUDIOS.map(s=>({...s,window:s.window.map(v=>v+OX),door:s.door.map(v=>v+OX)}));
 const WMODELS=Object.fromEntries(Object.entries(MODELS).map(([k,m])=>[k,{...m,at:[m.at[0]+OX,m.at[1]+OZ],face:[m.face[0]+OX,m.face[1]+OZ]}]));
 const WINTERACTIONS=INTERACTIONS.map(i=>({...i,position:[i.position[0]+OX,i.position[1],i.position[2]+OZ]}));
 const WPLACES=PLACES.map(P);
 const WBOUNDS={rect:WFOOTPRINT};
 // Queries take a world point.
 const winside=p=>inside(local(p));
 const wdistance=(x,z)=>distance(x-OX,z-OZ);
 const wroomAt=(x,z)=>{const r=roomAt(x-OX,z-OZ);return r?WROOMS.find(q=>q.id===r.id):null;};
 const gateAt=p=>{const g=gateAtLocal(local(p));return g?WGATES[g.id]:null;};
 const atCentre=(g,p)=>!!g&&!!p&&inRect(g.centre,p.x,p.z);
 const solids=()=>solidsLocal().map(s=>({...s,position:[s.position[0]+OX,s.position[1],s.position[2]+OZ],size:s.size.slice()}));
 // The street environment keeps only what can be reached from the street (the check-in reader in the vestibule); the interior has everything.
 const interactions=area=>WINTERACTIONS.filter(i=>area!=='street'||i.both).map(i=>({...i,position:i.position.slice()}));
 /* The interior as a place of its own. It keeps NeoChinatown's id and world coordinates, so the map, the music zone, the camera's place label and multiplayer
    presence all carry on unchanged; `area` tells the street systems (taxis, street life) that this is indoors. A save made in here stores nothing of it:
    every login wakes in the player's Sleeping Pod, and anything that re-enters NeoChinatown uses the street. */
 const staffSolid=()=>{const x=staffSolidLocal();return {...x,position:[x.position[0]+OX,x.position[1],x.position[2]+OZ]};};
 function layout(){return {id:'neochinatown',name:CONFIG.NAME,kind:'city',milked:true,area:AREA,bounds:[260,270],spawn:[WDOOR.x,1.7,-78.6+OZ],yaw:Math.PI,color:'#17141c',music:'earth',solids:[...solids(),staffSolid()],interactions:interactions(AREA),signs:[]};}
 /* A position from a save or a link made BEFORE the move (the District's old street): where that point is now. Anything inside the building's old block (its footprint,
    the side street and the service alley, with a margin) goes with it, by OFFSET; anything else stays. Returns [x, z] or null when the point was not Milked's. */
 const OLD_BLOCK=[FOOTPRINT[0]-1,Math.max(LANE[1],ALLEY[1])+1,FOOTPRINT[2]-4,LANE[3]+1];
 const fromOld=(x,z)=>inRect(OLD_BLOCK,x,z)?[x+OX,z+OZ]:null;

 const api={STAFF_DOOR:P(STAFF_DOOR),STAFF_FLAG,staffAccess,staffSolid,OFFSET,LOCAL,OLD_BLOCK,fromOld,CONFIG,MODELS:WMODELS,DIALOGUE,MISSION,FOOTPRINT:WFOOTPRINT,LANE:WLANE,ALLEY:WALLEY,DOOR:WDOOR,INNER:WINNER,REAR:WREAR,VESTIBULE:WVESTIBULE,HALL:WHALL,LOBBY:WLOBBY,LOBBY_N:WLOBBY_N,LOBBY_W:WLOBBY_W,DOORS:WDOORS,GATES:WGATES,KEY,AREA,T,H,CEIL,spansOf,gateAt,atCentre,openable,layout,TAXI:WTAXI,SEGMENTS:WSEGMENTS,FURNITURE:WFURNITURE,ROOMS:WROOMS,STUDIOS:WSTUDIOS,INTERACTIONS:WINTERACTIONS,PLACES:WPLACES,BOUNDS:WBOUNDS,inside:winside,distance:wdistance,roomAt:wroomAt,solids,interactions};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VoidMilked=api;
})(typeof globalThis!=='undefined'?globalThis:this);
