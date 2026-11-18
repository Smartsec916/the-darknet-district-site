/* THE PLACE REGISTRY (pure data and rules: browser and Node tests; no DOM). Named places a mission step or trigger can name ("Enter / leave a place"), a photo's
   LOCATION (device-gallery.js METADATA) and the Mission Editor's place pickers, arranged the way the owner picks them: System > Planet > City > Area > Exact location
   (the owner, 17-18 Nov 2026: "every location needs a name whether it's just an area, venue, etc").
   LEVELS: system, planet, city, area, venue (a building with rooms: The Darknet District, NULL, Milked), place (an exact location). An exact location may hold smaller
   exact locations (a shopfront on a stretch of street, a taxi stop): the smallest one a point is in wins.
   THE NAMING PASS (18 Nov 2026): every walkable spot of NeoChinatown's quarters, the District, NULL, Milked, the gates, the Corporate District, the Temple and the VR rooms
   resolves to a named exact location (tests/places-names.test.cjs grid-samples them). Names come from the game's own data and signs where there are any (`src` says where);
   a spot the game does not name has a short descriptive WORKING name with `proposed:true` (not canon: the owner names it; review sheet docs/development/LOCATION_NAMES.md).
   The planet: universe.js shows 'NeoChinatown' for the planet (id 'earth'); its real name is not settled, so the planet node uses that display name and is PROPOSED.
   Every shape is read from data the game already has (ncz-quarters.js streets and gates, neochinatown.js the District's own plan, ncz-nightclub.js NULL, milked.js Milked,
   ncz-containers.js Kai's home, corporate.js and temple.js streets), in WORLD metres (x east, z north). A place is a rect [x0,x1,z0,z1] or a union of rects, with an
   optional y range, inside one walking scene (`scene`: walkingLocation.id), or a whole scene (`whole`). `fallback`: named for whatever of its parent no sibling covers.
   The District's rooms are written in the District's own plan (local metres, door at 0,20) and turned into world metres once, with the same half turn neochinatown.js uses
   (a test checks DISTRICT_DOOR against it). Shopfronts: SHOPFRONTS below (the neon shop signs neochinatown.js puts up, read from the built city; the sign's own words).
   at(point) -> every place the point is in, with all their parents (a player in NULL's bar is also in NULL, Old Town, NeoChinatown and Tessaly).
   chain(id) -> "Bar · The Darknet District · Old Town · NeoChinatown · Tessaly System" (most specific first; a repeated name is shown once).
   tracker() -> per player enter / leave events: update(point) returns {entered, left, inside}; nothing fires twice; a point not in a walking scene (a menu, the pod card,
   a transition) changes nothing, so going through a vestibule never fires a leave and an enter again.
   IDS NEVER CHANGE once published (missions name them); a name can change freely. */
(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports;
 const QT=node?require('./ncz-quarters.js'):root.VoidQuarters,NC=node?require('./ncz-nightclub.js'):root.VoidNightclub,MK=node?require('./milked.js'):root.VoidMilked;
 const CT=node?require('./ncz-containers.js'):root.VoidContainers,CO=node?require('./corporate.js'):root.VoidCorporate,TP=node?require('./temple.js'):root.VoidTemple;
 // neochinatown.js DOOR: the District door in world metres; local (x,z) -> world (DOOR.x-x, DOOR.z+20-z), a half turn (its own inverse).
 const DISTRICT_DOOR={x:126.9,z:-61.9};
 const local=([x0,x1,z0,z1])=>[DISTRICT_DOOR.x-x1,DISTRICT_DOOR.x-x0,DISTRICT_DOOR.z+20-z1,DISTRICT_DOOR.z+20-z0];
 const localPoint=(x,z)=>[DISTRICT_DOOR.x-x,DISTRICT_DOOR.z+20-z];
 const LEVELS=[{id:'system',name:'System'},{id:'planet',name:'Planet'},{id:'city',name:'City'},{id:'area',name:'Area'},{id:'venue',name:'Venue'},{id:'place',name:'Exact location'}];
 const LEVEL_INDEX=Object.fromEntries(LEVELS.map((l,i)=>[l.id,i]));
 const Q=id=>(QT&&QT.QUARTERS[id])||{streets:[],places:[]};
 const street={walk:'sacramento'},inDistrict={walk:'darknet-district'},S=q=>({...street,quarter:q});
 const DISTRICT=[109.4,144.4,-120.4,-61.6],ALLEY=[71,136,-61.6,-55.5],TERRACE=[78.4,99.4,-116.4,-95.4];
 const HALL=(NC&&NC.HALL)||[18,50,-68.5,-48.5],CLUB=(NC&&NC.RECT)||[18,51,-68.5,-48.5],ENTRY=(NC&&NC.ENTRY&&NC.ENTRY.rect)||[46,51,-59.7,-57.3],DOOR=(NC&&NC.DOOR)||{x:50.5,z:-58.5};
 const MKR=id=>((MK&&MK.ROOMS)||[]).find(r=>r.id===id)||null;
 const KAI=CT&&CT.KAI_HOME?CT.KAI_HOME.door:{x:80.78,z:-235};
 const CORP=id=>((CO&&CO.STREETS)||[]).find(s=>s.id===id)||null,TEMP=id=>((TP&&TP.STREETS)||[]).find(s=>s.id===id)||null;
 const around=(x,z,dx,dz)=>[x-dx,x+dx,z-dz,z+dz];
 const P=(o)=>({level:'place',...o});
 /* id, name, level, parent, scene (walkingLocation.id), rects (world metres), whole, y (optional), enter (where draft play puts a player), target (where the guide arrow
    leads), proposed (a working name, not canon), src (where an existing name comes from), where (a plain description for the owner's review sheet), fallback. */
 const NODES=[
  {id:'tessaly',name:'Tessaly System',level:'system',parent:null,system:'sol',src:'universe.js (system "sol")',where:'The star system.'},
  {id:'ncz-planet',name:'NeoChinatown',level:'planet',parent:'tessaly',location:'earth',proposed:true,src:'universe.js shows "NeoChinatown" for the planet (id earth)',where:'The planet. Its own name is not settled: the city\'s name stands in.'},
  {id:'neochinatown',name:'NeoChinatown',level:'city',parent:'ncz-planet',location:'earth',scenes:['neochinatown','corporate','temple'],src:'universe.js, signs',where:'The city.'},
  // ---- areas: the quarters (ncz-quarters.js) and the scenes beyond the gates ----
  {id:'port',name:'The Port',level:'area',parent:'neochinatown',scene:'neochinatown',rects:[...Q('port').streets],enter:S('port'),src:'ncz-quarters.js',where:'The landing pad and the passage north of Port Customs.'},
  {id:'oldtown',name:'Old Town',level:'area',parent:'neochinatown',scene:'neochinatown',rects:[...Q('oldtown').streets,...(Q('oldtown').places||[]),HALL,ENTRY],enter:S('oldtown'),note:'Main Street, the alley, the access road; the District and NULL stand in it.',src:'ncz-quarters.js',where:'Main Street between the North and South Gates, the alley, the access road; the District and NULL.'},
  {id:'avenue',name:'The Avenue',level:'area',parent:'neochinatown',scene:'neochinatown',rects:[...Q('avenue').streets],enter:S('avenue'),src:'ncz-quarters.js',where:'The wide road across the top, Function Gate to East Gate.'},
  {id:'far-south',name:'Far South',level:'area',parent:'neochinatown',scene:'neochinatown',rects:[...Q('far-south').streets,...(Q('far-south').places||[])],enter:S('far-south'),src:'ncz-quarters.js',where:'Main Street south of the South Gate: Milked, its side street and service alley.'},
  {id:'outskirts',name:'The Outskirts',level:'area',parent:'neochinatown',scene:'neochinatown',rects:[...Q('outskirts').streets],enter:S('outskirts'),src:'ncz-quarters.js',where:'Past the Far South Gate: container homes on gravel.'},
  {id:'corporate',name:'The Corporate District',level:'area',parent:'neochinatown',scene:'corporate',whole:true,enter:S('avenue'),note:'Its own scene, through the Function Gate.',src:'corporate.js, gate sign',where:'Its own scene, through the Function Gate.'},
  {id:'temple',name:'Zen Zephyr’s Temple',level:'area',parent:'neochinatown',scene:'temple',whole:true,enter:S('avenue'),note:'Its own scene, through the East Gate.',src:'temple.js',where:'Its own hilltop scene, through the East Gate.'},
  {id:'gates',name:'Gates and checkpoints',level:'area',parent:'neochinatown',scene:'neochinatown',group:true,src:'ncz-quarters.js',where:'The six checkpoint buildings between the quarters.'},
  {id:'vr',name:'VR',level:'area',parent:'neochinatown',group:true,src:'the owner ("each VR room under VR")',where:'The simulations entered from the District\'s VR play area.'},
  // ---- The Port ----
  P({id:'landing-pad',name:'Landing pad',parent:'port',scene:'neochinatown',rects:[[13,37.5,-106,-86]],enter:S('port'),src:'neochinatown.js (landing-pad)',where:'The pad itself, west of the passage.'}),
  P({id:'landing-terminal',name:'Landing terminal',parent:'landing-pad',scene:'neochinatown',rects:[[33.5,37.5,-105,-101]],enter:S('port'),src:'terminal screen "LANDING TERMINAL"',where:'The terminal at the pad\'s south-east corner.'}),
  P({id:'port-passage',name:'The passage by the landing pad',parent:'port',scene:'neochinatown',rects:[[37.5,44,-107,-92]],enter:S('port'),src:'neochinatown.js (old taxi zone name)',where:'The passage from Port Customs north to the pad.'}),
  P({id:'stop-port',name:'Taxi stop · The Port',parent:'port-passage',scene:'neochinatown',rects:[[40.5,44,-101,-97]],enter:S('port'),src:'ncz-quarters.js STOPS',where:'The taxi pole on the passage.'}),
  // ---- Old Town ----
  P({id:'main-north',name:'Main Street — north end',parent:'oldtown',scene:'neochinatown',rects:[[51,71,-47,-26]],enter:S('oldtown'),proposed:true,where:'Main Street from the North Gate down to just before NULL.'}),
  P({id:'main-null',name:'Main Street — outside NULL',parent:'oldtown',scene:'neochinatown',rects:[[51,71,-72,-47]],enter:S('oldtown'),proposed:true,where:'Main Street in front of NULL, where the District alley opens on the east side.'}),
  P({id:'stop-alley-mouth',name:'Taxi stop · NULL / the alley',parent:'main-null',scene:'neochinatown',rects:[[57,71,-70,-62]],enter:S('oldtown'),src:'ncz-quarters.js STOPS',where:'The taxi pole south of the alley mouth.'}),
  P({id:'main-middle',name:'Main Street — middle',parent:'oldtown',scene:'neochinatown',rects:[[51,71,-108,-72]],enter:S('oldtown'),proposed:true,where:'Main Street between NULL and the south end, with the Main Street taxi stop.'}),
  P({id:'stop-main',name:'Taxi stop · Main Street',parent:'main-middle',scene:'neochinatown',rects:[[57,71,-104,-96]],enter:S('oldtown'),src:'ncz-quarters.js STOPS',where:'The taxi pole on Main Street\'s east side.'}),
  P({id:'main-south',name:'Main Street — south end',parent:'oldtown',scene:'neochinatown',rects:[[51,71,-124,-108]],enter:S('oldtown'),proposed:true,where:'Main Street\'s south end, up to the South Gate; the access road joins on the west.'}),
  P({id:'main-road-corner',name:'Main Street / access road corner',parent:'main-south',scene:'neochinatown',rects:[[51,56,-121,-116]],enter:S('oldtown'),proposed:true,where:'Where the access road meets Main Street.'}),
  P({id:'access-road',name:'Access road',parent:'oldtown',scene:'neochinatown',rects:[[13,51,-121,-116]],enter:S('oldtown'),proposed:true,where:'The road west from Main Street towards the Port passage.'}),
  P({id:'customs-approach',name:'Passage to Port Customs',parent:'oldtown',scene:'neochinatown',rects:[[37.5,44,-116,-113]],enter:S('oldtown'),proposed:true,where:'The short passage from the access road up to Port Customs.'}),
  P({id:'district-alley',name:'The District alley',parent:'oldtown',scene:'neochinatown',rects:[ALLEY],enter:S('oldtown'),src:'places.js (Mission 002), music zone "alley"',where:'The alley east off Main Street to the District\'s door.'}),
  P({id:'alley-district-door',name:'Outside the District door',parent:'district-alley',scene:'neochinatown',rects:[[118,136,-61.6,-55.5]],enter:S('oldtown'),src:'map point "Darknet District entrance"',where:'The alley\'s east end, at the District\'s door and its taxi pole.'}),
  // The Darknet District (a venue): its rooms in the District's own plan
  {id:'district',name:'The Darknet District',level:'venue',parent:'oldtown',scene:'neochinatown',rects:[DISTRICT],enter:inDistrict,target:localPoint(0,30),src:'signs, universe.js',where:'The building at the alley\'s east end.'},
  P({id:'district-vestibule',name:'The District security vestibule',parent:'district',scene:'neochinatown',rects:[local([-3,3,20,26])],enter:inDistrict,src:'places.js, map "Security vestibule"',where:'Between the street door and the inner door.'}),
  P({id:'district-hall',name:'The District hallway',parent:'district',scene:'neochinatown',rects:[local([-3,3,26,70.5])],enter:inDistrict,src:'places.js',where:'The long hallway from the vestibule to the pod room.'}),
  P({id:'district-pods',name:'Sleeping Pod room',parent:'district',scene:'neochinatown',rects:[local([-17,17,70.5,78.3])],enter:inDistrict,src:'pod prompts "SLEEPING POD"',where:'The back room: the ten pods, the wardrobe, the stairs.'}),
  P({id:'district-vr',name:'VR play area',parent:'district',scene:'neochinatown',rects:[local([-17,-3,28,44])],enter:inDistrict,src:'places.js, prompt "ACCESS VR EXPERIENCES"',where:'First room on the left: the booths and the VR terminal.'}),
  P({id:'district-vending',name:'Vending alcove',parent:'district',scene:'neochinatown',rects:[local([-7,-3,46.5,52.5])],enter:inDistrict,src:'neochinatown.js, prompt "VENDING MACHINES"',where:'The small alcove on the left with the three machines.'}),
  P({id:'district-arcade',name:'The Arcade',parent:'district',scene:'neochinatown',rects:[local([-10.5,-3,57.5,66.5])],enter:inDistrict,src:'places.js, arcade cabinets',where:'The small room on the left with five cabinets.'}),
  P({id:'district-store',name:'The Store (Admin and Iris)',parent:'district',scene:'neochinatown',rects:[local([3,17,43,53])],enter:inDistrict,src:'places.js, prompt "BROWSE THE SHOP"',where:'Second room on the right: Admin and Iris at the counter.'}),
  P({id:'district-bar',name:'The Bar',parent:'district',scene:'neochinatown',rects:[local([3,17,28,42])],enter:inDistrict,src:'universe.js "bar", prompt "TALK TO THE BARTENDER"',where:'First room on the right: the bar and the oxygen bar.'}),
  P({id:'district-meeting',name:'The meeting room',parent:'district',scene:'neochinatown',rects:[local([3,15,56,69])],enter:inDistrict,src:'places.js',where:'Third room on the right, its door kept shut unless Admin opens it.'}),
  P({id:'district-terrace',name:'Smoking terrace',parent:'district',scene:'neochinatown',rects:[TERRACE],enter:inDistrict,src:'map building "Smoking terrace"',where:'The open roof up the stairs from the pod room.'}),
  // NULL (a venue): the hall with its entry passage
  {id:'null',name:'NULL',level:'venue',parent:'oldtown',scene:'neochinatown',rects:[CLUB],enter:S('oldtown'),target:[DOOR.x+1.6,1.7,DOOR.z],note:'The nightclub across Main Street: the hall, entry passage included (ncz-nightclub.js RECT).',src:'club sign "NULL"',where:'The nightclub on Main Street\'s west side.'},
  P({id:'null-entrance',name:'NULL entrance',parent:'null',scene:'neochinatown',rects:[ENTRY],enter:S('oldtown'),target:[DOOR.x+1.6,1.7,DOOR.z],src:'places.js (Mission 002)',where:'The entry passage from Main Street.'}),
  P({id:'null-floor',name:'Main floor',parent:'null',scene:'neochinatown',rects:[CLUB],fallback:true,enter:S('oldtown'),src:'the owner\'s list (entrance, main floor, bar, DJ, VIP)',where:'The dance floor and the tables: the club apart from the bar, the DJ and the VIP corner.'}),
  P({id:'null-bar',name:'Bar',parent:'null',scene:'neochinatown',rects:[[26,37,-53.5,-48.5]],enter:S('oldtown'),src:'ncz-nightclub.js (bar, bartender)',where:'Along the north wall; Juno Vex sits at its east end.'}),
  P({id:'null-dj',name:'DJ booth',parent:'null',scene:'neochinatown',rects:[[19,27,-62,-55]],enter:S('oldtown'),src:'ncz-nightclub.js (DJ desk)',where:'The DJ desk and riser at the west end.'}),
  P({id:'null-vip',name:'VIP corner',parent:'null',scene:'neochinatown',rects:[[34,42,-68.5,-64.5]],enter:S('oldtown'),src:'ncz-nightclub.js (VIP corner)',where:'The sofa and table on the south wall.'}),
  // ---- The Avenue ----
  P({id:'avenue-west',name:'The Avenue — west end',parent:'avenue',scene:'neochinatown',rects:[[10,51,-20,-5]],enter:S('avenue'),proposed:true,where:'From the Function Gate to the North Gate junction.'}),
  P({id:'stop-function-gate',name:'Taxi stop · Function Gate',parent:'avenue-west',scene:'neochinatown',rects:[[17,23,-10,-5]],enter:S('avenue'),src:'ncz-quarters.js STOPS',where:'The taxi pole near the Function Gate.'}),
  P({id:'stop-avenue',name:'Taxi stop · The Avenue',parent:'avenue-west',scene:'neochinatown',rects:[[37,43,-10,-5]],enter:S('avenue'),src:'ncz-quarters.js STOPS',where:'The taxi pole west of the North Gate.'}),
  P({id:'avenue-north-gate',name:'The Avenue — at the North Gate',parent:'avenue',scene:'neochinatown',rects:[[51,71,-20,-5]],enter:S('avenue'),proposed:true,where:'Where the North Gate opens onto the Avenue.'}),
  P({id:'avenue-middle',name:'The Avenue — middle',parent:'avenue',scene:'neochinatown',rects:[[71,115,-20,-5]],enter:S('avenue'),proposed:true,where:'The Avenue east of the North Gate.'}),
  P({id:'avenue-east',name:'The Avenue — east end',parent:'avenue',scene:'neochinatown',rects:[[115,144,-20,-5]],enter:S('avenue'),proposed:true,where:'The Avenue up to the East Gate.'}),
  P({id:'stop-east-gate',name:'Taxi stop · East Gate',parent:'avenue-east',scene:'neochinatown',rects:[[131,137,-10,-5]],enter:S('avenue'),src:'ncz-quarters.js STOPS',where:'The taxi pole near the East Gate.'}),
  // ---- Far South ----
  P({id:'fs-north',name:'Far South Main Street — north end',parent:'far-south',scene:'neochinatown',rects:[[51,71,-150,-130]],enter:S('far-south'),proposed:true,where:'Main Street just south of the South Gate.'}),
  P({id:'fs-middle',name:'Far South Main Street — middle',parent:'far-south',scene:'neochinatown',rects:[[51,71,-165,-150]],enter:S('far-south'),proposed:true,where:'Main Street between the South Gate and Milked.'}),
  P({id:'milked-corner',name:'Milked corner',parent:'far-south',scene:'neochinatown',rects:[[51,71,-195,-165]],enter:S('far-south'),src:'ncz-quarters.js STOPS (taxi stop name)',where:'Main Street in front of Milked, where its side street and service alley open.'}),
  P({id:'stop-milked',name:'Taxi stop · Milked corner',parent:'milked-corner',scene:'neochinatown',rects:[[57,71,-186,-178]],enter:S('far-south'),src:'ncz-quarters.js STOPS',where:'The taxi pole on the east side.'}),
  P({id:'fs-south',name:'Far South Main Street — south end',parent:'far-south',scene:'neochinatown',rects:[[51,71,-218,-195]],enter:S('far-south'),proposed:true,where:'Main Street down to the Far South Gate.'}),
  P({id:'milked-lane',name:'Milked side street',parent:'far-south',scene:'neochinatown',rects:[(MK&&MK.LANE)||[71,101,-174,-168.5]],enter:S('far-south'),proposed:true,where:'The quiet dead-end side street to Milked\'s front door.'}),
  P({id:'milked-alley',name:'Milked service alley',parent:'far-south',scene:'neochinatown',rects:[(MK&&MK.ALLEY)||[71,98.5,-193.5,-190]],enter:S('far-south'),src:'milked.js "rear door (service alley)"',where:'The alley behind Milked, at its rear door.'}),
  // Milked (a venue): its rooms (milked.js ROOMS, the game's own names)
  {id:'milked',name:'Milked',level:'venue',parent:'far-south',scene:'neochinatown',rects:[(MK&&MK.FOOTPRINT)||[78,98,-190,-174]],enter:S('far-south'),target:MK&&MK.VESTIBULE?[(MK.VESTIBULE[0]+MK.VESTIBULE[1])/2,(MK.VESTIBULE[2]+MK.VESTIBULE[3])/2]:undefined,note:'The arrow leads to the front vestibule (Mission 003: walking in completes “Travel to Milked”).',src:'sign "MILKED"',where:'The studio building off Far South\'s Main Street.'},
  ...[['vestibule','Security vestibule','Inside the front door.'],['reception','Reception','Eva\'s desk and the waiting area.'],['hallway','Studio hallway','Between the four studios; the STAFF ONLY door at its far end.'],
   ['studio-1','Studio 1','Studio, north-west (closed).'],['studio-2','Studio 2','Studio, north-east (closed).'],['studio-3','Studio 3','Studio, south-west (closed).'],['studio-4','Studio 4','Studio, south-east (closed).'],
   ['office','Fish\'s office','Fish\'s office, staff only.'],['staff-corridor','Staff corridor','From the STAFF ONLY door to the rear lobby.'],['rear-lobby','Rear lobby','Inside the rear door from the service alley.'],
   ['rear-corridor','Rear corridor','Along the back of the building.'],['dressing-a','Dressing room A','Behind reception.'],['dressing-b','Dressing room B','Behind reception (closed).'],
   ['restroom-1','Staff restroom 1','Staff restroom (closed).'],['restroom-2','Staff restroom 2','Staff restroom (closed).']]
   .map(([id,name,where])=>{const r=MKR(id);return P({id:'milked-'+id,name:(r&&r.name&&id!=='restroom-1'&&id!=='restroom-2')?r.name:name,parent:'milked',scene:'neochinatown',rects:r?[r.rect]:[],enter:S('far-south'),src:'milked.js ROOMS',where});}),
  // ---- The Outskirts ----
  P({id:'outskirts-north',name:'Container yard — north',parent:'outskirts',scene:'neochinatown',rects:[[36,92,-237,-224]],enter:S('outskirts'),proposed:true,where:'The gravel hub just inside the Far South Gate.'}),
  P({id:'kai-home',name:'Kai Kryptos’ home',parent:'outskirts-north',scene:'neochinatown',rects:[[KAI.x-3,KAI.x,KAI.z-2,KAI.z+2]],enter:S('outskirts'),src:'ncz-containers.js KAI_HOME',where:'In front of the door of the container reserved for Kai (east side of the hub).'}),
  P({id:'outskirts-south',name:'Container yard — south',parent:'outskirts',scene:'neochinatown',rects:[[36,92,-260,-237]],enter:S('outskirts'),proposed:true,where:'The winding walkways at the back of the hub.'}),
  P({id:'outskirts-west-lane',name:'West lane',parent:'outskirts',scene:'neochinatown',rects:[[20,36,-250,-240]],enter:S('outskirts'),proposed:true,where:'The lane west off the hub, ending at a container.'}),
  P({id:'outskirts-east-lane',name:'East lane',parent:'outskirts',scene:'neochinatown',rects:[[92,108,-248,-240]],enter:S('outskirts'),proposed:true,where:'The lane east off the hub, ending at a container.'}),
  // ---- the gates (ncz-quarters.js GATES: their own names and codes) ----
  ...((QT&&QT.GATES)||[]).map(g=>P({id:'gate-'+g.id.replace(/-gate$/,''),name:g.name+' ('+g.code+')',parent:'gates',scene:'neochinatown',rects:[g.rect],enter:S((g.ends.hi&&g.ends.hi.quarter)||(g.ends.lo&&g.ends.lo.quarter)||'avenue'),src:'gate sign "'+g.sign+'"',where:'Checkpoint between '+[g.ends.lo,g.ends.hi].map(e=>e.quarter?(Q(e.quarter).name||e.quarter):e.scene==='corporate'?'the Corporate District':'the Temple').join(' and ')+'.'})),
  // ---- The Corporate District (corporate.js STREETS: the map's own names) ----
  ...((CO&&CO.STREETS)||[]).map(s=>P({id:'corp-'+s.id,name:s.name,parent:'corporate',scene:'corporate',rects:[s.rect],enter:S('avenue'),src:'corporate.js map',where:'A '+s.kind+' of the Corporate District.'})),
  P({id:'corp-taxi',name:'Taxi pad',parent:'corp-south-plaza',scene:'corporate',rects:[[-4,4,-21,-15]],enter:S('avenue'),src:'prompt "TAXI · RETURN TO NEOCHINATOWN"',where:'Where the taxi sets down and the walk to the Function Gate starts.'}),
  P({id:'corp-function-gate',name:'Function Gate (walk to NeoChinatown)',parent:'corp-south-plaza',scene:'corporate',rects:[[-4,4,-26,-21]],enter:S('avenue'),src:'prompt "FUNCTION GATE · WALK TO NEOCHINATOWN"',where:'The way back on foot.'}),
  P({id:'corp-checkpoint',name:'Security checkpoint',parent:'corp-cross-checkpoint',scene:'corporate',rects:[[-8,8,36,46]],enter:S('avenue'),src:'prompt "SECURITY CHECKPOINT"',where:'The checkpoint on Checkpoint Street.'}),
  P({id:'corp-hq-entrance',name:'Headquarters entrance',parent:'corp-north-plaza',scene:'corporate',rects:[[26,34,20,26]],enter:S('avenue'),src:'prompt "HEADQUARTERS ENTRANCE"',where:'The guarded door of the headquarters tower.'}),
  // ---- Zen Zephyr's Temple (temple.js STREETS and PLACES: the map's own names) ----
  P({id:'temple-grounds',name:'Temple grounds',parent:'temple',scene:'temple',rects:[(TP&&TP.PLATEAU)||[-48,48,-48,48]],fallback:true,enter:S('avenue'),proposed:true,where:'The rest of the hilltop plateau inside the parapet.'}),
  ...((TP&&TP.STREETS)||[]).map(s=>P({id:'temple-'+s.id,name:s.name,parent:'temple',scene:'temple',rects:[s.rect],enter:S('avenue'),src:'temple.js map',where:'Part of the Temple grounds ('+s.kind+').'})),
  P({id:'temple-taxi',name:'Taxi stop',parent:'temple-terrace',scene:'temple',rects:[[-4,4,-45,-38]],enter:S('avenue'),src:'temple.js map "Taxi stop"',where:'Where the taxi sets down.'}),
  P({id:'temple-gate',name:'Courtyard gate',parent:'temple-path',scene:'temple',rects:[[-3,3,-31,-29]],enter:S('avenue'),src:'temple.js map "Courtyard gate"',where:'The gate between the terrace and the courtyard.'}),
  P({id:'temple-dais',name:'Zen Zephyr’s dais',parent:'temple-chamber',scene:'temple',rects:[[-4,4,15.5,19.5]],enter:S('avenue'),src:'temple.js map',where:'In front of the monk\'s dais.'}),
  ...[[-7,12],[7,12],[-7,28],[7,28]].map(([x,z],i)=>P({id:'temple-altar-'+(i+1),name:'Data altar '+(i+1),parent:'temple-chamber',scene:'temple',rects:[z<20?[x-1.5,x+1.5,z-3,z-.6]:[x-1.5,x+1.5,z+.6,z+3]],enter:S('avenue'),src:'altar text "DATA ALTAR '+(i+1)+'"',where:'Beside data altar '+(i+1)+'.'})),
  // ---- VR: each simulation is a room (scene) of its own, entered from the District's VR play area ----
  P({id:'vr-suite',name:'Play in a Bedroom',parent:'vr',scene:'vr-suite',whole:true,src:'VR menu title',where:'The bedroom suite simulation.'}),
  P({id:'vr-tropical',name:'Tropical Escape',parent:'vr',scene:'vr-tropical',whole:true,src:'VR menu title',where:'The beach simulation.'}),
  P({id:'vr-forest',name:'Relax in a Forest',parent:'vr',scene:'vr-forest',whole:true,src:'VR menu title',where:'The forest simulation.'}),
  P({id:'vr-combat',name:'Combat Simulator',parent:'vr',scene:'vr-combat',whole:true,src:'VR title',where:'The combat range (not listed in the VR menu).'})];
 /* SHOPFRONTS: the neon shop signs neochinatown.js puts up along Main Street, the Avenue and Far South (their places are decided by the city's fixed random sequence;
    read from the built city, 18 Nov 2026, tests/places-names.test.cjs checks their number and words against shopSigns). [sign words, x, z, street side]:
    the place is the 7 m of pavement in front of the sign. A shopfront is a facade (no interior yet). */
 const SHOPFRONTS=[['DRAGON NOODLES',12.5,-5.25,'n'],['ELECTRONICS',26.5,-5.25,'n'],['PHARMACY 24H',33.5,-5.25,'n'],['TEA HOUSE',54.5,-5.25,'n'],['TACOS · 24H',61.5,-5.25,'n'],['RAMEN · BAR',68.5,-5.25,'n'],['REPAIR · 修理',75.5,-5.25,'n'],['LAUNDRY',103.5,-5.25,'n'],['BIO-CLINIC',124.5,-5.25,'n'],['CHAI · 茶',131.5,-5.25,'n'],['DRAGON NOODLES',26.5,-19.75,'s'],['ELECTRONICS',40.5,-19.75,'s'],['PHARMACY 24H',47.5,-19.75,'s'],['TEA HOUSE',75.5,-19.75,'s'],['TACOS · 24H',89.5,-19.75,'s'],['RAMEN · BAR',96.5,-19.75,'s'],['REPAIR · 修理',103.5,-19.75,'s'],['LAUNDRY',110.5,-19.75,'s'],['BIO-CLINIC',124.5,-19.75,'s'],['CHAI · 茶',138.5,-19.75,'s'],['DRAGON NOODLES',51.25,-113.5,'w'],['ELECTRONICS',51.25,-92.5,'w'],['PHARMACY 24H',51.25,-85.5,'w'],['TEA HOUSE',51.25,-71.5,'w'],['TACOS · 24H',51.25,-43.5,'w'],['RAMEN · BAR',51.25,-36.5,'w'],['REPAIR · 修理',51.25,-29.5,'w'],['LAUNDRY',70.75,-120.5,'e'],['BIO-CLINIC',70.75,-85.5,'e'],['CHAI · 茶',70.75,-78.5,'e'],['NOODLES',70.75,-71.5,'e'],['NIGHT MARKET',70.75,-64.5,'e'],['DRAGON NOODLES',70.75,-50.5,'e'],['ELECTRONICS',70.75,-36.5,'e'],['PHARMACY 24H',70.75,-29.5,'e'],['TACOS · 24H',51.25,-214.5,'w'],['RAMEN · BAR',51.25,-200.5,'w'],['REPAIR · 修理',51.25,-165.5,'w'],['LAUNDRY',51.25,-158.5,'w'],['BIO-CLINIC',51.25,-151.5,'w'],['CHAI · 茶',51.25,-144.5,'w'],['NOODLES',51.25,-137.5,'w'],['NIGHT MARKET',51.25,-132,'w'],['DRAGON NOODLES',70.75,-214.5,'e'],['ELECTRONICS',70.75,-207.5,'e'],['PHARMACY 24H',70.75,-186.5,'e'],['TEA HOUSE',70.75,-179.5,'e'],['TACOS · 24H',70.75,-151.5,'e'],['RAMEN · BAR',70.75,-144.5,'e'],['REPAIR · 修理',70.75,-132,'e']];
 const shopRect=(x,z,side)=>side==='w'?[x,x+3,z-3.5,z+3.5]:side==='e'?[x-3,x,z-3.5,z+3.5]:side==='s'?[x-3.5,x+3.5,z,z+3]:[x-3.5,x+3.5,z-3,z];
 const BY=new Map(NODES.map(n=>[n.id,n]));
 const inRect=([x0,x1,z0,z1],x,z)=>x>=x0&&x<=x1&&z>=z0&&z<=z1;
 SHOPFRONTS.forEach(([word,x,z,side],i)=>{const r=shopRect(x,z,side),cx=(r[0]+r[1])/2,cz=(r[2]+r[3])/2;
  const host=NODES.find(n=>n.level==='place'&&n.parent!=='gates'&&n.scene==='neochinatown'&&!n.fallback&&n.rects&&n.rects.some(q=>inRect(q,cx,cz))&&BY.get(n.parent)&&BY.get(n.parent).level==='area');
  if(!host)return;const q=BY.get(host.parent);
  const n=P({id:'shop-'+String(i+1).padStart(2,'0'),name:word+' shopfront',parent:host.id,scene:'neochinatown',rects:[r],enter:S(q.id),src:'shop sign "'+word+'"',shop:true,
   where:'Shopfront on '+host.name+', '+({w:'west',e:'east',n:'north',s:'south'})[side]+' side (a facade; no interior).'});NODES.push(n);BY.set(n.id,n);});
 const IDS=NODES.map(n=>n.id);
 const area=r=>(r[1]-r[0])*(r[3]-r[2]);
 const has=(n,p)=>{if(!n||n.group||!p)return false;if(n.whole)return p.scene===n.scene;if(n.scene&&n.scene!==p.scene)return false;if(!n.rects||!n.rects.length)return false;
  if(n.y&&Number.isFinite(p.y)&&(p.y<n.y[0]||p.y>n.y[1]))return false;return n.rects.some(r=>inRect(r,p.x,p.z));};
 const parents=id=>{const out=[];let n=BY.get(id);while(n&&n.parent){out.push(n.parent);n=BY.get(n.parent);}return out;};
 // How tightly a node holds a point: the smallest of its rects that contains it (a whole scene counts as endless).
 const fit=(n,p)=>n.whole?Infinity:Math.min(...n.rects.filter(r=>inRect(r,p.x,p.z)).map(area));
 /* Every place a point is in, deepest first (then a named spot before a fallback, then the smaller one), with their parents. point: {scene, x, y?, z}. */
 function at(p){if(!p||typeof p.scene!=='string'||!Number.isFinite(p.x)||!Number.isFinite(p.z))return [];const hit=NODES.filter(n=>has(n,p)),out=new Set();
  hit.sort((a,b)=>parents(b.id).length-parents(a.id).length||(a.fallback?1:0)-(b.fallback?1:0)||fit(a,p)-fit(b,p));
  for(const n of hit){out.add(n.id);for(const q of parents(n.id))out.add(q);}return [...out];}
 /* The deepest named place a point is in (for a photo's location). */
 function deepest(p){const list=at(p);return list.length?list[0]:null;}
 const path=id=>[...parents(id).reverse(),id].filter(x=>BY.has(x));
 const label=id=>path(id).map(x=>BY.get(x).name).join(' › ');
 /* A photo's location: most specific first, joined with ' · '; a name repeated by its parent (planet and city) is shown once. Unknown id: ''. */
 const chain=id=>BY.has(id)?path(id).reverse().map(x=>BY.get(x).name).filter((n,i,a)=>i===0||n!==a[i-1]).join(' · '):'';
 const name=id=>(BY.get(id)||{}).name||id;
 /* The tree for a picker: [{node, children:[...]}], in the order above. */
 function tree(){const kids=id=>NODES.filter(n=>n.parent===id).map(n=>({node:n,children:kids(n.id)}));return kids(null);}
 /* A flat list for a <select>: [{id, name, depth, label, level, proposed, selectable}] (a group heading and the system are not selectable). */
 function options(){const out=[];const walk=(list,d)=>{for(const x of list){out.push({id:x.node.id,name:x.node.name,depth:d,label:label(x.node.id),level:x.node.level,proposed:!!x.node.proposed,selectable:!x.node.group&&x.node.level!=='system'});walk(x.children,d+1);}};walk(tree(),0);return out;}
 /* Where the guide arrow leads for a place: its target point, or the middle of its first rect (world metres, y 1.7). */
 function target(id){const n=BY.get(id);if(!n)return null;if(n.target)return n.target.length===3?n.target.slice():[n.target[0],1.7,n.target[1]];if(n.rects&&n.rects.length){const r=n.rects[0];return [(r[0]+r[1])/2,1.7,(r[2]+r[3])/2];}return null;}
 const within=(id,ancestor)=>id===ancestor||parents(id).includes(ancestor);
 /* Enter / leave events for one player. */
 function tracker(){let inside=new Set(),started=false;
  return {
   update(p){if(!p||typeof p.scene!=='string')return {entered:[],left:[],inside:[...inside]};const now=new Set(at(p)),entered=[...now].filter(x=>!inside.has(x)),left=[...inside].filter(x=>!now.has(x));inside=now;started=true;return {entered,left,inside:[...now]};},
   get inside(){return [...inside];},get started(){return started;},has:id=>inside.has(id),reset(){inside=new Set();started=false;}};}
 const api={LEVELS,LEVEL_INDEX,NODES,IDS,BY,DISTRICT_DOOR,SHOPFRONTS,at,deepest,path,label,chain,name,tree,options,target,within,parents,tracker,node:id=>BY.get(id)||null};
 if(node)module.exports=api;else root.VoidPlaces=api;
})(typeof globalThis!=='undefined'?globalThis:this);
