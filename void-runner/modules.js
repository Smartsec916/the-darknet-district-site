/* MODULAR INTERIORS (the owner, 19 Nov 2026: "in the mission editor i need to be able to add locations by type: housing, commercial, other, office and commercial style
   hallways. i need an office building interior ... cubicles, desks, chairs, computers. a server room with server racks. the ability to connect these areas together so make
   sure they fit ... elevator ... like modules"; docs/development/MODULES.md). PURE DATA AND RULES: no rendering, no DOM, no network. Runs in the browser and in Node
   (tests/modules.test.cjs) and gives the server its copy through the admin inventory (tools/admin-inventory.cjs `modules`).
   THE STANDARD (every module fits every other)
     GRID 2 m. A module is w x d cells; its walls stand inside its own footprint (WALL 0.1 m on each side of a shared boundary: two modules side by side make one 0.2 m wall).
     A SOCKET is a door place: the middle of one cell on one edge ('s1' = the south edge, second cell from the west). Every door is the same: 1.2 m wide, 2.2 m high, an
     automatic sliding door in a steel frame with an access point beside it, the floor at 0 m everywhere. Two modules on the same floor whose sockets meet face to face are
     joined there (a "snap"); a door that meets another module's plain wall is refused, so are overlaps. Unused sockets are plain wall.
     GRID MODULES are placed on a floor's grid ({x, z} = the cell of the footprint's south-west corner, rot = quarter turns clockwise seen from above, floor = storey).
     PORTAL MODULES are the older housing interiors (the three city apartments, the two containers and their hallways, apartments.js): they keep their own rooms and are
     reached through a door that leads "elsewhere" (a short fade), as before. An ELEVATOR CAB on one floor is linked to the cabs on the other floors of the same location.
   LOCATION DATA (a mission's `apartments` list, mission-content.js and void_runner_live_content.py check it; an older entry {id, style, door, ...} stays valid as it was):
     {id, door, from?, entry:'<module>.<socket>' (the street door leads there), modules:[{id, type, x?, z?, rot?, floor?, lightsOff?, screenOff?, number?, items?}],
      links?:[{a:'<module>.<socket>', b:'<module>.<socket>'}] (doors that lead elsewhere: a hallway door to an apartment), locks?:['<module>.<socket>'] (locked until hacked)}
     Steps: 'apt-enter' {apt, mod?}, 'apt-use' {apt, mod, object}, 'hack' {ap:'<location>/<module>.<socket>'} (any module door, from either side).
   Rendering is module-build.js, the walking in and out module-integration.js. Nothing about a location is saved (like the apartments). */
(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports;
 const AP=()=>{try{return node?require('./apartments.js'):root.VoidApartments;}catch{return null;}};
 const EXP=()=>{try{return node?require('./exploration-controller.js'):root.VoidExplorer;}catch{return null;}};   // the walk's own collision (blocked / free), for spawns
 const GRID=2,WALL=.1,DOOR={w:1.2,h:2.2,clear:1.04,frame:.08},SPAN=24,FLOORS=[-3,9],LIMIT={modules:12,items:20,links:12,locks:12,label:60};
 const MOD_ID=/^[a-z][a-z0-9-]{0,11}$/,REF=/^([a-z][a-z0-9-]{0,11})\.([a-z0-9-]{1,10})$/,ORIGIN=[600,600];
 const r2=v=>Math.round(v*100)/100;
 const CATS=[{id:'housing',name:'Housing'},{id:'various',name:'Various'},{id:'office',name:'Office'},{id:'server',name:'Server room'},{id:'hallway',name:'Hallways'},{id:'elevator',name:'Elevator'},{id:'other',name:'Other'}];
 const STYLE_NAMES={corp:'corporate',back:'back of house',tech:'technical',clinic:'clinical',kitchen:'kitchen',den:'warm wood',garage:'garage',pit:'raw concrete',gang:'gang checkpoint',tunnel:'service tunnel',legacy:'apartment set'};
 const O=(id,label,name)=>({id,label,name:name||label.toLowerCase()});
 const LIGHTS=O('lights','LIGHTS','the light switch');
 // ---------------------------------------------------------------- the module types
 const TYPES={};
 function T(id,o){const sockets=(o.sockets||'').split(' ').filter(Boolean).map(t=>({id:t,edge:t[0],cell:+t.slice(1)}));TYPES[id]={id,furn:[],inter:[],lights:[],objects:[],...o,sockets};}
 /* OFFICE FLOOR, 12 m x 10 m: a cross of aisles (east-west z -1..1, north-south x -4..-2) between the four doors; ten cubicles (desk, two screens, chair, 1.25 m fabric
    partitions), the manager's glass office in the north-east corner (desk, computer, credenza, safe), a meeting nook in the south-east (table, chairs, wall display),
    a copier, filing cabinets, a water cooler, plants; a suspended ceiling with light panels; windows on the north wall when nothing stands there. */
 const CUBES=[[-5.9,-4,1,2.9,'e'],[-5.9,-4,2.9,4.8,'e'],[-5.9,-4,-2.9,-1,'e'],[-5.9,-4,-4.8,-2.9,'e'],[-2,-.1,1,2.9,'w'],[-2,-.1,2.9,4.8,'w'],[-.1,1.8,1,2.9,'e'],[-.1,1.8,2.9,4.8,'e'],[-2,-.1,-2.9,-1,'w'],[-2,-.1,-4.8,-2.9,'w']];
 function cubeSolids(c,k){const [x0,x1,z0,z1,o]=c,desk=o==='e'?[x0,x0+.76]:[x1-.76,x1];return [[desk[0],desk[1],z0+.03,z1-.03,1.25,'cube-'+k+'-desk'],[x0,x1,z0-.03,z0+.03,1.25,'cube-'+k+'-s'],[x0,x1,z1-.03,z1+.03,1.25,'cube-'+k+'-n']];}
 const MGR={x:[2.8,5.9],z:[1.2,4.9],gap:[2.6,3.7],desk:[3.8,5.2,3,3.75],cred:[3.4,5.6,4.45,4.9],safe:[5.3,5.9,1.3,1.85]},MEET={table:[3.6,5.2,-3.6,-2.6],screen:{x:5.9,z:-3.1,w:1.6}};
 T('office-floor',{cat:'office',style:'corp',name:'Office floor',note:'Ten cubicles with computers, a manager’s glass office, a meeting nook, copier, plants.',w:6,d:5,ceil:2.9,sockets:'s1 n1 w2 e2',screen:true,windows:'n',
  objects:[O('computer','DESK COMPUTER','a desk computer'),O('manager-pc','MANAGER’S COMPUTER','the manager’s computer'),O('safe','SAFE','the manager’s safe'),O('printer','COPIER','the copier'),O('screen','MEETING SCREEN','the meeting screen (on / off)'),LIGHTS],
  furn:[...CUBES.flatMap(cubeSolids),[2.77,2.83,1.2,MGR.gap[0],2.4,'mgr-w1'],[2.77,2.83,MGR.gap[1],4.9,2.4,'mgr-w2'],[2.8,5.9,1.17,1.23,2.4,'mgr-s'],[...MGR.desk,.76,'mgr-desk'],[...MGR.cred,.8,'credenza'],[...MGR.safe,.7,'safe'],
   [...MEET.table,.75,'meet-table'],[.3,1.2,-1.9,-1.25,1.05,'copier'],[0,1.8,-4.9,-4.35,1.3,'files'],[2.2,2.6,-4.85,-4.45,1.2,'cooler'],[2.15,2.6,-2.6,-2.15,1,'plant-a'],[3.05,3.5,4.4,4.85,1,'plant-b']],
  inter:[...CUBES.map((c,k)=>({id:'pc-'+k,label:'DESK COMPUTER',pos:[c[4]==='e'?c[0]+.75:c[1]-.75,1.15,(c[2]+c[3])/2],object:'computer',range:1.4})),
   {id:'manager-pc',label:'MANAGER’S COMPUTER',pos:[4.5,1.15,2.85],object:'manager-pc',range:1.5},{id:'safe',label:'SAFE',pos:[5.55,.9,2.05],object:'safe',range:1.3},
   {id:'printer',label:'COPIER',pos:[.75,1.1,-1.1],object:'printer',range:1.4},{id:'screen',label:'TURN SCREEN OFF',pos:[5.6,1.5,-3.1],object:'screen',range:2.6}],
  sw:[-3.85,'s'],lights:[[-3,2.6,0,'#dfe8f0',1.5,13],[3.6,2.6,-.2,'#e8ecf0',1.2,11]],plan:{cubes:CUBES,mgr:MGR,meet:MEET}});
 /* SERVER ROOM, 8 m x 8 m, 3 m high: a raised floor; three rows of six racks with status LEDs (a cold aisle down the middle, a hot aisle), ladder cable trays over the rows,
    two cooling units, a UPS cabinet, fire-suppression cylinders, a console with a terminal. Racks, the core rack, the terminal and the cooling unit can be used (stubs for
    later hacking). */
 const ROWS=[[-3.1,-2,'e'],[0,1.1,'w'],[2.1,3.2,'w']],RACK={z0:-.2,n:6,w:.6};
 T('server-room',{cat:'server',style:'tech',name:'Server room',note:'Three rows of server racks with status LEDs, cable trays, a raised floor, cooling units and a terminal.',w:4,d:4,ceil:3,sockets:'s1 n1 e1',screen:true,
  objects:[O('rack','SERVER RACK','a server rack'),O('core','CORE RACK','the core rack'),O('terminal','TERMINAL','the terminal'),O('cooling','COOLING UNIT','the cooling unit'),LIGHTS],
  furn:[...ROWS.map((r,k)=>[r[0],r[1],RACK.z0,RACK.z0+RACK.n*RACK.w,2.1,'rack-row-'+k]),[-3.9,-2.3,-3.9,-3.1,1.9,'crac'],[1.2,3,-3.9,-3.3,.76,'console'],[3.25,3.9,-2.7,-1.9,1.8,'ups'],[-3.9,-3.45,-2.6,-1.6,1.5,'tanks']],
  inter:[{id:'rack-w',label:'SERVER RACK',pos:[-1.85,1.3,.7],object:'rack',range:1.3},{id:'rack-e',label:'SERVER RACK',pos:[1.95,1.3,.7],object:'rack',range:1.3},
   {id:'core',label:'CORE RACK',pos:[-.15,1.3,1.9],object:'core',range:1.3},{id:'terminal',label:'TERMINAL',pos:[2.1,1.15,-3.2],object:'terminal',range:1.5},{id:'cooling',label:'COOLING UNIT',pos:[-3.1,1.2,-2.95],object:'cooling',range:1.4}],
  sw:[.6,'s'],lights:[[-1,2.75,1.6,'#bcd8ff',1.4,10],[1.6,2.75,-2.2,'#d8e4f0',1,8]],plan:{rows:ROWS,rack:RACK,core:{row:1,i:3}}});
 // ELEVATOR: a 2 m x 2 m cab (brushed steel, handrail, a button for every other floor of the location, a floor display), and the LOBBY (stone floor, wood panels, the cab door
 // with its call panel, a building directory, a bench, plants). Riding: the cab doors close, a short fade, the same cab on the chosen floor.
 T('elevator',{cat:'elevator',style:'corp',name:'Elevator cab',note:'A lift car. Put one on each floor (same place) and they link up; the buttons inside take the player between floors.',w:1,d:1,ceil:2.5,sockets:'s0',cab:true,spawn:[0,.15,Math.PI],lights:[[0,2.25,.2,'#fff0dc',.8,4]]});
 T('elevator-lobby',{cat:'elevator',style:'corp',name:'Elevator lobby',note:'A small lobby: the lift door (north), a building directory, a bench, plants.',w:3,d:2,ceil:3,sockets:'n1 s1 w0 e0',
  objects:[O('directory','BUILDING DIRECTORY','the building directory'),LIGHTS],furn:[[1.2,2.5,1.5,1.9,.45,'bench'],[-2.8,-2.25,1.3,1.85,1,'plant-a'],[2.35,2.85,-1.9,-1.62,1,'plant-b']],
  inter:[{id:'directory',label:'BUILDING DIRECTORY',pos:[2.75,1.5,.55],object:'directory',range:1.6}],sw:[-.95,'s'],lights:[[0,2.7,0,'#ffe2c0',1.3,9]]});
 // HALLWAYS: 2 m x 8 m, doors at both ends and two on each side.
 const hallInter=()=>[];
 T('hall-office',{cat:'hallway',style:'corp',name:'Office hallway',note:'Carpet, wood and painted panels, a light line in the ceiling, a plant.',w:1,d:4,ceil:2.7,sockets:'s0 n0 w1 e1 w2 e2',
  objects:[LIGHTS],furn:[[.5,.88,2.05,2.45,1,'plant']],inter:hallInter(),sw:[-3,'w'],lights:[[0,2.45,-1.2,'#ffe8cc',1.2,9]]});
 T('hall-commercial',{cat:'hallway',style:'back',name:'Commercial hallway',note:'Back of house: painted block walls, sealed concrete, pipes, caged tubes, stacked crates.',w:1,d:4,ceil:2.8,sockets:'s0 n0 w1 e1 w2 e2',
  objects:[O('panel','ELECTRICAL PANEL','the electrical panel'),LIGHTS],furn:[[.45,.9,2.05,2.65,.95,'crates']],inter:[{id:'panel',label:'ELECTRICAL PANEL',pos:[-.75,1.4,3.1],object:'panel',range:1.3}],sw:[-3,'w'],lights:[[0,2.5,-1,'#d8f0e0',1.1,9]]});
 // VARIOUS (were COMMERCIAL until 20 Nov 2026; the type ids are unchanged): three 6 m x 6 m back rooms (doors in the middle of each wall; the corners are furnished, the middle stays clear).
 T('shop-back',{cat:'various',style:'back',name:'Shop back room',note:'A stockroom: steel shelving with stock, a pallet, a desk with the stock terminal, a safe, a mop sink.',w:3,d:3,ceil:2.8,sockets:'s1 n1 w1 e1',
  objects:[O('computer','STOCK TERMINAL','the stock terminal'),O('safe','SAFE','the safe'),O('shelves','SHELVES','the shelves'),LIGHTS],
  furn:[[-2.9,-.9,2.45,2.9,2,'shelf-n'],[-2.9,-2.45,.9,2.45,2,'shelf-w'],[1,2.4,1.2,2.6,1.1,'pallet'],[-2.9,-2.3,-2.9,-2.3,.9,'sink'],[-2.9,-2.45,-2.2,-.9,2,'shelf-sw'],[1,2.6,-2.9,-2.3,.76,'desk'],[2.35,2.9,-2.2,-1.65,.7,'safe']],
  inter:[{id:'computer',label:'STOCK TERMINAL',pos:[1.8,1.15,-2.2],object:'computer',range:1.4},{id:'safe',label:'SAFE',pos:[2.2,.9,-1.9],object:'safe',range:1.3},{id:'shelves',label:'SHELVES',pos:[-2.15,1.3,1.7],object:'shelves',range:1.5}],
  sw:[-.95,'s'],lights:[[0,2.5,0,'#ffe0b0',1.3,10]]});
 T('bar-back',{cat:'various',style:'back',name:'Bar back room',note:'Kegs on their lines, crates and bottle shelving, the bar office desk with a CCTV monitor, a safe, a glass washer.',w:3,d:3,ceil:2.8,sockets:'s1 n1 w1 e1',screen:true,
  objects:[O('computer','OFFICE COMPUTER','the bar office computer'),O('safe','SAFE','the safe'),O('kegs','KEG COOLER','the kegs'),O('screen','CCTV MONITOR','the CCTV monitor (on / off)'),LIGHTS],
  furn:[[-2.9,-1.2,1.5,2.9,1,'kegs'],[1,2.9,2.45,2.9,2,'bottles'],[2.3,2.9,1,2.3,.9,'crates'],[-2.9,-2.3,-2.6,-1,.76,'desk'],[2.35,2.9,-2.9,-2.35,.75,'safe'],[1,2.2,-2.9,-2.35,.9,'washer']],
  inter:[{id:'computer',label:'OFFICE COMPUTER',pos:[-2.2,1.15,-1.8],object:'computer',range:1.4},{id:'safe',label:'SAFE',pos:[2.6,.9,-2.15],object:'safe',range:1.3},{id:'kegs',label:'KEG COOLER',pos:[-1.3,1,2.1],object:'kegs',range:1.5},
   {id:'screen',label:'TURN SCREEN OFF',pos:[-2.6,1.8,-1.8],object:'screen',range:1.8}],sw:[-.95,'s'],lights:[[0,2.5,0,'#ffc890',1.3,10]]});
 T('clinic',{cat:'various',style:'clinic',name:'Street clinic',note:'An exam bed under a surgical lamp, a vitals monitor, a medicine cabinet and fridge, a counter with a sink, a med terminal.',w:3,d:3,ceil:2.7,sockets:'s1 n1 w1 e1',screen:true,
  objects:[O('terminal','MED TERMINAL','the med terminal'),O('cabinet','MEDICINE CABINET','the medicine cabinet'),O('fridge','MED FRIDGE','the med fridge'),O('screen','VITALS MONITOR','the vitals monitor (on / off)'),LIGHTS],
  furn:[[-2.6,-.9,1.6,2.4,.7,'bed'],[1.1,2.9,2.45,2.9,2,'cabinet'],[2.4,2.9,1.1,2.1,1.6,'fridge'],[-2.9,-2.3,-2.8,-1,.9,'counter'],[1.1,2.7,-2.9,-2.3,.76,'desk']],
  inter:[{id:'terminal',label:'MED TERMINAL',pos:[1.9,1.15,-2.2],object:'terminal',range:1.4},{id:'cabinet',label:'MEDICINE CABINET',pos:[1.9,1.3,2.2],object:'cabinet',range:1.4},{id:'fridge',label:'MED FRIDGE',pos:[2.2,1.2,1.6],object:'fridge',range:1.3},
   {id:'screen',label:'TURN SCREEN OFF',pos:[-.55,1.55,2.5],object:'screen',range:1.8}],sw:[-.95,'s'],lights:[[0,2.45,0,'#e8f4ff',1.4,10]]});
 /* VARIOUS (the owner, 20 Nov 2026: "can you make me more and place all of them in Various filter?"): small businesses and back-street rooms, each 6 m x 6 m (8 m x 8 m for the
    fight pit, 4 m x 4 m for the shrine) with a door in the middle of each wall (the pit: second cell); corners furnished, the middle clear. `say`: what using a thing says
    (module-integration.js); `opens`: an object that opens a panel (pawn-shop.js); `spots`: standing places for people the owner places later ([x, z, yaw], local metres). */
 const PI=Math.PI,VAR=(id,o)=>T(id,{cat:'various',w:3,d:3,ceil:2.8,sockets:'s1 n1 w1 e1',sw:[-.95,'s'],...o});
 /* SEATS IN ROOMS (21 Nov 2026, the owner: kneeling, cross-legged and knees-to-chest poses; "make sitting work" at the mahjong stools): `sits` [name, x, z, yaw (the way
    a sitter faces: 0 = +z, PI/2 = +x), h (the seat's top above the room floor), poses, stand] in the module's own metres. poses: 'chair' (the sit-down / sit / stand-up
    clips at ledge height; an 8th value `back` puts the seated origin that far in front of the seat's middle) and the floor poses 'kneel', 'cross', 'knees' (crowd.js FLOOR, posed by code). stand: [x, z] where a person stands before sitting (walkable);
    none: 0.41 m in front for a chair, the seat itself for the floor. module-build.js draws the cushions and stools from the same numbers. */
 const FLOOR_POSES=['kneel','cross','knees'];
 // the cushions round a low table (module-build.js lowTable: 0.35 m out from each edge, 0.09 m thick on y0): sides from 's', 'n', 'w', 'e' -> sits
 function cushionSits(pre,[x0,x1,z0,z1],y0,sides,stand){const xc=(x0+x1)/2,zc=(z0+z1)/2,at={s:[xc,z0-.35,0],n:[xc,z1+.35,PI],w:[x0-.35,zc,PI/2],e:[x1+.35,zc,-PI/2]};
  return sides.map(k=>{const [x,z,yaw]=at[k],sd=typeof stand==='function'?stand(k,x,z):null;return [pre+'-'+k,+x.toFixed(3),+z.toFixed(3),yaw,+(y0+.09).toFixed(3),FLOOR_POSES.slice(),sd];});}
 // the mahjong parlour's stools: four round each square table, 0.3 m out from the edge; the ones people sit on stand 0.55 m out (room to stand between stool and table)
 const MJ_TABLES=[['sw',-2.5,-1.3,-2.4,-1.2],['nw',-2.5,-1.3,1,2.2],['e',1.2,2.4,-.6,.6]],MJ_SEATED={sw:['e'],nw:['s','e'],e:['w','n','s']},MJ_OUT=.55,MJ_H=.48,MJ_BACK=.37;   // MJ_BACK: a sitter's origin goes this far in front of the stool's middle (the sit clip's hips sit that far behind it)
 const MJ_STOOLS=MJ_TABLES.flatMap(([id,x0,x1,z0,z1])=>{const xc=(x0+x1)/2,zc=(z0+z1)/2,hs=(x1-x0)/2;return [['s',0,-1],['n',0,1],['w',-1,0],['e',1,0]].map(([k,sx,sz])=>{const seat=MJ_SEATED[id].includes(k),d=hs+(seat?MJ_OUT:.3);
  return {id:id+'-'+k,x:+(xc+sx*d).toFixed(3),z:+(zc+sz*d).toFixed(3),yaw:+Math.atan2(-sx,-sz).toFixed(4),seat};});});
 // the sleeping room's cots (module-build.js flophouse): sitting on the mattress, back to the wall, facing the aisle; one steps in from the aisle
 const COT_LAYOUT=[[-1,-1],[-1,1],[1,-1],[1,1]].map(([sx,sz],k)=>{const za=sz>0?.18:-2.78,zb=sz>0?2.78:-.18,zc=(za+zb)/2,cx=sx*2.28;return {id:'cot-'+(k+1),curtain:'curtain-'+(k+1),sx,sz,za,zb,zc,cx,width:1.08,depth:2.16,xi:sx*.92,open:k===1||k===2};});
 const COTS=COT_LAYOUT.map(c=>[c.id,c.cx,c.zc,c.sx>0?-PI/2:PI/2,.54,['knees','cross'],[c.sx*1.22,c.zc]]);
 VAR('pawn-back',{style:'back',name:'Pawn shop back room',note:'A broker’s back room: a padlocked storage cage of tagged goods, the buying counter behind a steel grille with an item scanner, an appraisal desk, a safe.',
  objects:[O('counter','SELL ITEMS','the buying counter (sell items)'),O('scanner','ITEM SCANNER','the item scanner'),O('cage','STORAGE CAGE','the storage cage'),O('computer','APPRAISAL TERMINAL','the appraisal terminal'),O('safe','SAFE','the safe'),LIGHTS],
  furn:[[-2.9,-1,1.2,2.9,2.2,'cage'],[1,2.9,2.3,2.9,1,'counter'],[2.3,2.9,.9,1.9,.9,'screens'],[-2.9,-2.45,-2.4,-.9,2,'shelf'],[1,2.6,-2.9,-2.3,.76,'desk'],[2.35,2.9,-2.2,-1.65,.72,'safe']],
  inter:[{id:'counter',label:'SELL ITEMS',pos:[1.4,1.05,2.1],object:'counter',range:1.3},{id:'scanner',label:'ITEM SCANNER',pos:[2.3,1.05,2.1],object:'scanner',range:1},{id:'cage',label:'STORAGE CAGE',pos:[-1.9,1.2,1.05],object:'cage',range:1.4},
   {id:'computer',label:'APPRAISAL TERMINAL',pos:[1.8,1.15,-2.2],object:'computer',range:1.4},{id:'safe',label:'SAFE',pos:[2.2,.9,-1.9],object:'safe',range:1.3}],opens:{counter:'pawn'},
  say:{scanner:'ITEM SCANNER: a flatbed reader for serials and ownership chips. The last scan reads “REGISTERED OWNER: —”.',cage:'STORAGE CAGE: padlocked mesh. Tagged goods on the shelves, each with a date and a number.',computer:'APPRAISAL TERMINAL: tickets, loan dates, and a column headed “do not sell back”.'},
  lights:[[0,2.5,0,'#ffd8a0',1.25,10]]});
 VAR('noodle-kitchen',{style:'kitchen',ceil:2.7,name:'Noodle kitchen',note:'A cramped kitchen: a wok range under its hood, steam, a prep table, the walk-in cooler door, sacks of rice and flour, the order screen and terminal.',screen:true,
  objects:[O('stove','WOK RANGE','the wok range'),O('cooler','WALK-IN COOLER','the walk-in cooler'),O('prep','PREP TABLE','the prep table'),O('computer','ORDER TERMINAL','the order terminal'),O('screen','ORDER SCREEN','the order screen (on / off)'),LIGHTS],
  furn:[[-2.9,-.9,2.25,2.9,.9,'range'],[1.5,2.9,1.1,2.9,2.7,'cooler'],[-2.9,-2.2,-2.6,-1,.9,'prep'],[.9,2.4,-2.9,-2.3,.7,'sacks'],[2.3,2.9,-2,-1,.95,'orders']],
  inter:[{id:'stove',label:'WOK RANGE',pos:[-1.9,1.1,2.05],object:'stove',range:1.4},{id:'cooler',label:'WALK-IN COOLER',pos:[1.35,1.2,2],object:'cooler',range:1.3},{id:'prep',label:'PREP TABLE',pos:[-2,1,-1.8],object:'prep',range:1.3},
   {id:'computer',label:'ORDER TERMINAL',pos:[2.1,1.15,-1.2],object:'computer',range:1.2},{id:'screen',label:'TURN SCREEN OFF',pos:[2.6,1.7,-1.75],object:'screen',range:1.6}],
  say:{stove:'WOK RANGE: three burners, one still ticking warm. Oil on everything.',cooler:'WALK-IN COOLER: a heavy latch, frost round the seal. Inside: noodles, broth in buckets, crates with no labels.',prep:'PREP TABLE: a cleaver, a board worn into a dip, scallions, a tub of dough.',computer:'ORDER TERMINAL: tonight’s tickets, a delivery list, and one order paid three times over.'},
  lights:[[-1,2.4,1.2,'#ffcf98',1.3,9],[1,2.4,-1.4,'#e8eef0',.9,8]]});
 VAR('repair-shop',{style:'back',name:'Electronics repair workshop',note:'Two benches with soldering stations, a magnifier lamp and gutted devices, a wall of parts drawers, a scope, shelves of jobs waiting, a terminal and a safe.',screen:true,
  objects:[O('bench','SOLDERING STATION','the soldering station'),O('drawers','PARTS DRAWERS','the parts drawers'),O('computer','DIAGNOSTIC TERMINAL','the diagnostic terminal'),O('screen','SCOPE','the scope (on / off)'),O('safe','SAFE','the safe'),LIGHTS],
  furn:[[-2.9,-1,2.2,2.9,.9,'bench-n'],[-2.9,-2.25,-2.6,-.9,.9,'bench-w'],[1,2.9,2.45,2.9,1.8,'drawers'],[2.45,2.9,.9,2.3,2,'shelf'],[1,2.6,-2.9,-2.3,.76,'desk'],[2.35,2.9,-2.2,-1.65,.72,'safe']],
  inter:[{id:'bench',label:'SOLDERING STATION',pos:[-1.9,1.05,2],object:'bench',range:1.4},{id:'drawers',label:'PARTS DRAWERS',pos:[1.9,1.2,2.25],object:'drawers',range:1.3},{id:'computer',label:'DIAGNOSTIC TERMINAL',pos:[1.8,1.15,-2.2],object:'computer',range:1.4},
   {id:'screen',label:'TURN SCREEN OFF',pos:[-2.1,1.1,-1.8],object:'screen',range:1.4},{id:'safe',label:'SAFE',pos:[2.2,.9,-1.9],object:'safe',range:1.3}],
  say:{bench:'SOLDERING STATION: the iron is still warm. A phone board in the clamp, half its chips lifted.',drawers:'PARTS DRAWERS: hundreds of small drawers, hand-labelled. Resistors, screws, salvaged camera modules.',computer:'DIAGNOSTIC TERMINAL: a queue of repair jobs, and a folder of device unlock tools.'},
  lights:[[-1.2,2.5,1,'#f0e8d8',1.2,9],[1.4,2.5,-1.4,'#ffd8a8',.8,7]]});
 VAR('implant-shop',{style:'clinic',ceil:2.7,name:'Cyberware workshop',note:'A backstreet implant bench: a reclining chair under a ceiling tool arm, a scan monitor, a parts fridge, a bench with a prosthetic arm on its stand, a terminal and a safe.',screen:true,
  objects:[O('chair','IMPLANT CHAIR','the implant chair'),O('bench','PARTS BENCH','the parts bench'),O('fridge','PARTS FRIDGE','the parts fridge'),O('terminal','IMPLANT TERMINAL','the implant terminal'),O('screen','SCAN MONITOR','the scan monitor (on / off)'),O('safe','SAFE','the safe'),LIGHTS],
  furn:[[-2.4,-1,.9,2.6,1,'chair'],[.9,2.2,2.45,2.9,.9,'bench'],[2.3,2.9,1.1,2.4,1.9,'fridge'],[-2.9,-2.3,-2.6,-1,.9,'counter'],[1,2.6,-2.9,-2.3,.76,'desk'],[2.35,2.9,-2.2,-1.65,.72,'safe']],
  inter:[{id:'chair',label:'IMPLANT CHAIR',pos:[-.95,.9,1.2],object:'chair',range:1.3},{id:'bench',label:'PARTS BENCH',pos:[1.55,1.05,2.25],object:'bench',range:1.2},{id:'fridge',label:'PARTS FRIDGE',pos:[2.15,1.2,1.75],object:'fridge',range:1.2},
   {id:'terminal',label:'IMPLANT TERMINAL',pos:[1.8,1.15,-2.2],object:'terminal',range:1.4},{id:'screen',label:'TURN SCREEN OFF',pos:[-1.6,1.7,2.75],object:'screen',range:1.8},{id:'safe',label:'SAFE',pos:[2.2,.9,-1.9],object:'safe',range:1.3}],
  say:{chair:'IMPLANT CHAIR: worn padding, wrist straps, a tool arm folded overhead. Clean, for this street.',bench:'PARTS BENCH: a prosthetic forearm on its stand, its cover off. Trays of connectors and tiny screws.',fridge:'PARTS FRIDGE: sealed implant boxes and gel packs, serial numbers scratched off.',terminal:'IMPLANT TERMINAL: fitting records under first names only, and a firmware folder called “unofficial”.'},
  lights:[[-1.6,2.45,1.6,'#e8f4ff',1.3,9],[1.4,2.45,-1.2,'#dfe8f0',.9,8]]});
 VAR('laundry-back',{style:'back',name:'Laundromat back room',note:'Industrial washers and stacked dryers, laundry carts, a folding table with stacks, an office desk and the change safe.',
  objects:[O('washers','WASHERS','the washers'),O('dryers','DRYERS','the dryers'),O('table','FOLDING TABLE','the folding table'),O('computer','OFFICE COMPUTER','the office computer'),O('safe','CHANGE SAFE','the change safe'),LIGHTS],
  furn:[[-2.9,-.9,2.15,2.9,1.3,'washers'],[.9,2.9,2.15,2.9,1.9,'dryers'],[-2.9,-2.1,-2.6,-1,.9,'table'],[1.9,2.7,-2,-1.1,1,'carts'],[.95,2.2,-2.9,-2.3,.76,'desk'],[2.35,2.9,-2.9,-2.35,.72,'safe']],
  inter:[{id:'washers',label:'WASHERS',pos:[-1.9,1.1,1.95],object:'washers',range:1.4},{id:'dryers',label:'DRYERS',pos:[1.9,1.2,1.95],object:'dryers',range:1.4},{id:'table',label:'FOLDING TABLE',pos:[-1.9,1,-1.8],object:'table',range:1.3},
   {id:'computer',label:'OFFICE COMPUTER',pos:[1.6,1.15,-2.2],object:'computer',range:1.3},{id:'safe',label:'CHANGE SAFE',pos:[2.6,.9,-2.2],object:'safe',range:1.2}],
  say:{washers:'WASHERS: one mid-cycle, one with an OUT OF ORDER card taped on, one locked with a bag still inside.',dryers:'DRYERS: warm, lint everywhere. One drum holds something that is not laundry.',table:'FOLDING TABLE: stacks of folded work clothes with tickets pinned on, and a pile of uniforms from a company that is not on any ticket.',computer:'OFFICE COMPUTER: the books, the machine takings, and a spreadsheet of “pickups” with no laundry on it.'},
  lights:[[0,2.5,0,'#e8ecd8',1.25,10]]});
 VAR('tea-room',{style:'den',ceil:2.6,name:'Tea house private room',note:'A quiet, worn private room: dark wood, backlit paper sliding screens, tatami mats, two low tables with floor cushions, paper lanterns, a tea station with kettle and cups, an alcove with a bonsai.',
  objects:[O('tea','TEA STATION','the tea station'),O('table','LOW TABLE','the low table'),O('alcove','ALCOVE','the alcove'),O('safe','STRONGBOX','the strongbox'),LIGHTS],
  furn:[[-2.3,-1.1,1.1,2.3,.4,'table-n'],[-2.3,-1.1,-2.3,-1.1,.4,'table-s'],[2.35,2.9,.9,2.6,.85,'tea'],[2.35,2.9,-2.6,-1.1,.5,'alcove']],
  inter:[{id:'tea',label:'TEA STATION',pos:[2.15,1,1.75],object:'tea',range:1.3},{id:'table',label:'LOW TABLE',pos:[-.9,.6,1.7],object:'table',range:1.3},{id:'alcove',label:'ALCOVE',pos:[2.15,1.2,-1.4],object:'alcove',range:1.2},{id:'safe',label:'STRONGBOX',pos:[2.2,.7,-2.2],object:'safe',range:1.1}],
  say:{tea:'TEA STATION: a dented kettle still warm, cups upside down on a cloth, tins with faded labels.',table:'LOW TABLE: two cups, one untouched. A ring where a third stood.',alcove:'ALCOVE: a bonsai in a cracked pot, an ink painting of mountains, the paper browned at the edges.',safe:'STRONGBOX: lacquered wood over steel, a brass lock. Locked.'},
  sits:[...cushionSits('cushion-n',[-2.3,-1.1,1.1,2.3],.03,['s','n','w','e']),...cushionSits('cushion-s',[-2.3,-1.1,-2.3,-1.1],.03,['s','n','w','e'])],
  lights:[[-1.7,2.2,1.7,'#ffc890',1.4,9],[1.2,2.2,-1.2,'#ffb878',1.1,8]]});
 VAR('card-room',{style:'den',ceil:2.7,name:'Card room',note:'A gambling den: a felt card table under a low lamp with chips and cards, chairs, a worn sofa, a bar cart, the lookout monitor on a desk, a cash safe.',screen:true,
  objects:[O('table','CARD TABLE','the card table'),O('cart','BAR CART','the bar cart'),O('screen','LOOKOUT MONITOR','the lookout monitor (on / off)'),O('safe','CASH SAFE','the cash safe'),LIGHTS],
  furn:[[-.9,.9,-.55,.55,.78,'table'],[-2.9,-2.1,1,2.6,.85,'sofa'],[2.1,2.8,1.8,2.6,.95,'cart'],[1,2.6,-2.9,-2.3,.76,'desk'],[-2.9,-2.35,-2.9,-2.35,.72,'safe']],
  inter:[{id:'table',label:'CARD TABLE',pos:[0,.95,-.75],object:'table',range:1.3},{id:'cart',label:'BAR CART',pos:[1.9,1,2],object:'cart',range:1.2},{id:'screen',label:'TURN SCREEN OFF',pos:[1.8,1.15,-2.2],object:'screen',range:1.4},{id:'safe',label:'CASH SAFE',pos:[-2.2,.9,-2.2],object:'safe',range:1.2}],
  say:{table:'CARD TABLE: a hand left face down, chips stacked by colour, an ashtray. Nobody is collecting the pot.',cart:'BAR CART: cheap spirits poured into expensive bottles.',safe:'CASH SAFE: a keypad, a smear of fingerprints on four of the keys. Locked.'},
  spots:[['dealer',0,.95,PI],['lookout',1.8,-1.7,PI]],lights:[[0,1.6,0,'#ffd090',1.8,9],[-2,2.3,2,'#ff9a60',1,7]]});
 VAR('tattoo',{style:'den',ceil:2.7,name:'Tattoo parlour',note:'A tattoo chair under an articulated lamp, the ink station with its rows of bottles, flash boards of original designs, a waiting bench, the booking terminal and a safe.',
  objects:[O('chair','TATTOO CHAIR','the tattoo chair'),O('ink','INK STATION','the ink station'),O('flash','FLASH BOARDS','the flash boards'),O('computer','BOOKING TERMINAL','the booking terminal'),O('safe','SAFE','the safe'),LIGHTS],
  furn:[[-2.4,-1,1.1,2.5,.9,'chair'],[1,2.4,2.4,2.9,.95,'ink'],[2.4,2.9,.9,2.1,.45,'bench'],[-2.9,-2.3,-2.6,-1,.9,'counter'],[1,2.6,-2.9,-2.3,.76,'desk'],[2.35,2.9,-2.2,-1.65,.72,'safe']],
  inter:[{id:'chair',label:'TATTOO CHAIR',pos:[-.95,.9,1.6],object:'chair',range:1.3},{id:'ink',label:'INK STATION',pos:[1.7,1.05,2.2],object:'ink',range:1.2},{id:'flash',label:'FLASH BOARDS',pos:[2.2,1.6,1.5],object:'flash',range:1.4},
   {id:'computer',label:'BOOKING TERMINAL',pos:[1.8,1.15,-2.2],object:'computer',range:1.4},{id:'safe',label:'SAFE',pos:[2.2,.9,-1.9],object:'safe',range:1.3}],
  say:{chair:'TATTOO CHAIR: fresh film on the padding, the lamp still angled where the last client lay.',ink:'INK STATION: rows of bottles, a machine on its cradle, gloves, a roll of film.',flash:'FLASH BOARDS: sheets of designs, pinned and re-pinned: stars, waves, flowers, knives, a lot of eyes.',computer:'BOOKING TERMINAL: appointments under nicknames, deposits paid in cash, one booking marked “cover-up, urgent”.'},
  lights:[[-1.6,2.45,1.7,'#fff2dc',1.6,9],[1.4,2.45,-1.3,'#ffc890',1.2,8]]});
 VAR('radio-booth',{style:'back',ceil:2.6,name:'Pirate radio booth',note:'Egg-crate foam on the walls, a mixing desk with a microphone on its boom, the ON AIR light, transmitter racks, a worn couch, record shelves and the playout computer.',screen:true,
  objects:[O('desk','MIXING DESK','the mixing desk'),O('mic','MICROPHONE','the microphone'),O('racks','TRANSMITTER RACK','the transmitter rack'),O('computer','PLAYOUT COMPUTER','the playout computer'),O('screen','BROADCAST MONITOR','the broadcast monitor (on / off)'),LIGHTS],
  furn:[[-2.7,-.9,2,2.9,.8,'desk'],[1.7,2.9,2.1,2.9,1.9,'racks'],[-2.9,-2.2,-2.6,-1,.8,'couch'],[2.45,2.9,-2.6,-1,1.6,'records'],[.9,1.9,-2.9,-2.4,.76,'table']],
  inter:[{id:'desk',label:'MIXING DESK',pos:[-1.9,1,1.8],object:'desk',range:1.3},{id:'mic',label:'MICROPHONE',pos:[-1.05,1.35,1.85],object:'mic',range:1},{id:'racks',label:'TRANSMITTER RACK',pos:[2.2,1.3,1.9],object:'racks',range:1.3},
   {id:'computer',label:'PLAYOUT COMPUTER',pos:[1.4,1.15,-2.2],object:'computer',range:1.3},{id:'screen',label:'TURN SCREEN OFF',pos:[-2.6,1.7,1.1],object:'screen',range:1.4}],
  say:{desk:'MIXING DESK: faders taped with handwritten labels, a cue sheet with the times crossed out.',mic:'MICROPHONE: the pop filter is split, the boom arm held with tape. The ON AIR light is off.',racks:'TRANSMITTER RACK: a homemade exciter, an amplifier with a fan that rattles, coax going up through the ceiling.',computer:'PLAYOUT COMPUTER: a playlist, a folder of station idents, and a list of frequencies that keep moving.'},
  lights:[[-1.6,2.3,1.6,'#ffb080',1,8],[1.5,2.3,-1.5,'#c8d0ff',.7,7]]});
 VAR('scooter-bay',{style:'garage',ceil:3,name:'Scooter garage',note:'A small bay: a scooter up on a scissor lift, a red tool chest under a pegboard, oil drums on a spill tray, a workbench with a vice and a diagnostic laptop, a stack of tyres.',
  objects:[O('lift','SCOOTER LIFT','the scooter on its lift'),O('chest','TOOL CHEST','the tool chest'),O('drums','OIL DRUMS','the oil drums'),O('computer','DIAGNOSTIC LAPTOP','the diagnostic laptop'),LIGHTS],
  furn:[[-2.6,-1,.9,2.7,1.2,'lift'],[2.2,2.9,1.1,2.3,1.1,'chest'],[1.5,2.8,-2.8,-1.5,.95,'drums'],[-2.9,-2.25,-2.6,-1,.9,'bench'],[-2.2,-1.4,-2.9,-2.2,.8,'tyres']],
  inter:[{id:'lift',label:'SCOOTER LIFT',pos:[-.85,1,1.8],object:'lift',range:1.3},{id:'chest',label:'TOOL CHEST',pos:[2,1.1,1.7],object:'chest',range:1.2},{id:'drums',label:'OIL DRUMS',pos:[1.3,1,-2],object:'drums',range:1.3},{id:'computer',label:'DIAGNOSTIC LAPTOP',pos:[-2.05,1.15,-1.8],object:'computer',range:1.3}],
  say:{lift:'SCOOTER LIFT: a delivery scooter up on the lift, side panel off, its ID plate unscrewed.',chest:'TOOL CHEST: sockets in the wrong drawers, a torque wrench, a tin of mismatched bolts.',drums:'OIL DRUMS: two full, one empty, one that sloshes too lightly for its weight.',computer:'DIAGNOSTIC LAPTOP: a scooter’s fault log, and a tool for rewriting its owner record.'},
  lights:[[-1.5,2.7,1.5,'#e8eef0',1.3,10],[1.5,2.7,-1.5,'#ffd8a8',1,9]]});
 VAR('shrine-room',{style:'den',w:2,d:2,ceil:2.5,sockets:'s0 w0 e1',sw:[.3,'s'],name:'Shrine room',note:'A small, quiet shrine behind a shop: a low altar with offerings, candles, incense smoke, paper charm strips, a worn floor mat, warm low light.',
  objects:[O('altar','ALTAR','the altar'),O('incense','INCENSE','the incense burner'),O('candles','CANDLES','the candle stand'),O('charms','CHARM STRIPS','the paper charm strips'),LIGHTS],
  furn:[[-1.5,.5,1.4,1.9,.75,'altar'],[-1.9,-1.6,.1,1.3,1.6,'charms'],[1.3,1.9,-1.9,-1.2,1,'candles']],
  inter:[{id:'altar',label:'ALTAR',pos:[-.8,.9,1.15],object:'altar',range:1.2},{id:'incense',label:'INCENSE',pos:[.1,.9,1.2],object:'incense',range:1},{id:'candles',label:'CANDLES',pos:[1.1,1,-1.5],object:'candles',range:1.2},{id:'charms',label:'CHARM STRIPS',pos:[-1.4,1.3,.7],object:'charms',range:1.2}],
  say:{altar:'ALTAR: fruit, a bowl of rice, a cup of tea gone cold, coins, a folded note nobody should read.',incense:'INCENSE: three sticks burning down in a bowl of ash. The smoke hangs under the ceiling.',candles:'CANDLES: a rack of small candles, most lit, wax over everything.',charms:'CHARM STRIPS: paper strips, brush marks faded past reading, tied with red thread.'},
  lights:[[-.5,2,.8,'#ffb060',.9,6]]});
 /* THE UNDERGROUND (the owner, 20 Nov 2026: "eventually I want underground locations", "underground will have a security vestibule, but guarded by gangs, not guards", "the
    underground tunnels will be linked together"): a fight pit below the street, a gang checkpoint, a stairwell between floors, and service-tunnel pieces. How a player gets
    there (which street door) is the owner's choice; linking tunnels of different locations into one network is a later feature (docs/development/AI_HANDOFF.md). */
 VAR('fight-pit',{underground:true,style:'pit',w:4,d:4,ceil:3.4,sockets:'s1 n1 w1 e1',sw:[-2.2,'s'],name:'Underground fight pit',note:'UNDERGROUND. A room in the tunnels (join it to a tunnel): a chain-link ring on a stained mat under hanging work lights, standing room round it, concrete steps along one wall, the betting counter behind a grille.',
  objects:[O('ring','RING','the ring'),O('betting','BETTING COUNTER','the betting counter'),O('board','ODDS BOARD','the odds board'),LIGHTS],
  furn:[[-1.95,-1.85,-1.95,1.95,2.1,'fence-w'],[1.85,1.95,-1.95,1.95,2.1,'fence-e'],[-1.95,1.95,1.85,1.95,2.1,'fence-n'],[-1.95,-.6,-1.95,-1.85,2.1,'fence-s1'],[.6,1.95,-1.95,-1.85,2.1,'fence-s2'],[-3.9,-3.1,.2,3.6,.9,'steps'],[2.9,3.9,1.4,3.9,2.2,'betting'],[2.5,3.9,-3.9,-2.9,.9,'barrels']],
  inter:[{id:'ring',label:'RING',pos:[0,1.1,-2.3],object:'ring',range:1.4},{id:'betting',label:'BETTING COUNTER',pos:[2.6,1.1,2.4],object:'betting',range:1.3},{id:'board',label:'ODDS BOARD',pos:[2.6,1.9,1.4],object:'board',range:1.6}],
  say:{ring:'RING: chain-link on scaffold poles, the mat patched with tape, dark stains scrubbed half away.',betting:'BETTING COUNTER: a grille, a slot for chips and cash, a ledger chained to the counter. Closed between fights.',board:'ODDS BOARD: chalked names wiped out and rewritten. Tonight’s card is blank.'},
  spots:[['host',0,-2.4,PI],['corner-a',-2.6,0,PI/2],['corner-b',2.6,0,-PI/2]],lights:[[0,2.9,0,'#ffe6c0',2.2,13],[2.8,2.6,2.6,'#ffb070',1.1,7]]});
 T('gang-vestibule',{underground:true,cat:'hallway',style:'gang',w:2,d:3,ceil:2.6,sockets:'s0 n0 e2',sw:[-1.95,'w'],name:'Gang checkpoint (vestibule)',note:'UNDERGROUND. The first room past the steel door at the foot of an alley stairwell, run by a gang: heavy steel doors with eye slots, a chain-link pass-through, a battered table with a cash box and a scanner wand, stools, a CCTV monitor on a crate, graffiti and bare bulbs. Room for two or three doormen.',screen:true,
  objects:[O('table','CHECKPOINT TABLE','the checkpoint table'),O('cashbox','CASH BOX','the cash box'),O('wand','SCANNER WAND','the scanner wand'),O('screen','CCTV MONITOR','the CCTV monitor (on / off)'),LIGHTS],
  furn:[[-.06,.06,-1.6,1.6,2.2,'fence'],[.25,1.25,-.6,.6,.75,'table'],[1.2,1.9,-2.9,-2.2,.9,'crate']],
  inter:[{id:'table',label:'CHECKPOINT TABLE',pos:[-.35,1,0],object:'table',range:1.2},{id:'cashbox',label:'CASH BOX',pos:[.75,.9,-.85],object:'cashbox',range:1},{id:'wand',label:'SCANNER WAND',pos:[.6,.9,.85],object:'wand',range:1},{id:'screen',label:'TURN SCREEN OFF',pos:[1.55,1.2,-1.95],object:'screen',range:1.4}],
  say:{table:'CHECKPOINT TABLE: a pass-through in the fence, a scarred table, a list of names with half of them crossed out.',cashbox:'CASH BOX: a dented tin with a padlock. The door fee goes in here.',wand:'SCANNER WAND: a cheap metal-detector wand, the grip wrapped in tape.'},
  spots:[['door-1',-1.3,1.2,0],['door-2',1.55,0,-PI/2],['door-3',-1,-1.3,0]],lights:[[-.9,2.3,0,'#ffcf90',1.1,8]]});
 T('stairwell',{underground:true,cat:'hallway',style:'tunnel',w:2,d:3,ceil:3,sockets:'s0 w0 e0',cab:true,stairs:true,arrive:[0,-1.7],name:'Stairwell (between floors)',note:'UNDERGROUND. Concrete stairs up and down. Put one on each floor (same place) and they link up, like an elevator: the stairs take the player between floors. Doors on the south half.',objects:[LIGHTS],
  furn:[[-1.9,-.25,-.5,2.9,1.1,'flight-up'],[.25,1.9,-.5,2.9,1.1,'flight-down'],[-.25,.25,-.5,2.9,1.1,'divider']],sw:[-1.4,'w'],lights:[[0,2.7,-1.4,'#ffd8a0',1.1,8]]});
 /* TUNNEL TUBES (the owner: "just make them repeatable so the tunnel [is] placed in the correct format"): every tube piece has the same cross-section (2 m wide, 2.6 m
    high, floor at 0, the drainage channel on the centre line, pipes at the same heights on both walls, one cable tray on the ceiling's centre line) and is symmetric left
    to right, so pieces join end to end in any number and either way round, and turn at the junction. Two tube pieces joined end to end have no wall and no door between
    them (layout: `seam`): the tunnel runs straight through. Lamps hang every 2 m, at the middle of each cell. */
 const TUBE=(id,o)=>T(id,{cat:'hallway',style:'tunnel',underground:true,tube:true,w:1,ceil:2.6,...o});
 TUBE('tunnel-short',{d:1,sockets:'s0 n0',name:'Service tunnel, 7 ft',note:'UNDERGROUND. A 7 ft piece of service tunnel. Joins end to end with any tunnel piece, seamlessly.',objects:[LIGHTS],sw:[0,'w'],lights:[[0,2,0,'#ffd8a0',1.1,7]]});
 TUBE('tunnel-mid',{d:2,sockets:'s0 n0',name:'Service tunnel, 13 ft',note:'UNDERGROUND. A 13 ft piece of service tunnel. Joins end to end with any tunnel piece, seamlessly.',objects:[LIGHTS],sw:[-1,'w'],lights:[[0,2,0,'#ffd8a0',1.1,8]]});
 TUBE('tunnel',{d:3,sockets:'s0 n0',name:'Service tunnel, 20 ft',note:'UNDERGROUND. An old service tunnel, 20 ft: wet concrete, pipe runs, a cable tray, caged lamps, a drainage channel, puddles, graffiti. Joins end to end with any tunnel piece, seamlessly.',
  objects:[O('panel','JUNCTION BOX','the junction box'),LIGHTS],furn:[[-.9,-.72,.4,1.3,1.6,'junction']],inter:[{id:'panel',label:'JUNCTION BOX',pos:[-.55,1.3,.85],object:'panel',range:1.2}],sw:[-2.2,'w'],lights:[[0,2,0,'#ffd8a0',1.2,9]]});
 TUBE('tunnel-junction',{d:1,sockets:'s0 n0 w0 e0',name:'Service tunnel junction (corner / T / cross)',note:'UNDERGROUND. A 7 ft tunnel junction with four openings: join two for a corner, three for a T, four for a crossing (unused ones are plain wall). Seamless with the tunnel pieces.',
  objects:[],lights:[[0,2,0,'#ffcf90',1,6]]});
 /* The UNDERGROUND TEA ROOM (the owner: "an underground tea room would be cool too"; a front door and a back door on opposite walls; "the back door must NOT be visible
    from the seating area"): the back door opens into a service nook behind a full-height partition; the nook reaches the room round the end of the partition and behind a
    folding screen (an L-shaped passage), so no seat looks at it. */
 T('tea-under',{cat:'various',style:'tunnel',underground:true,ownLamps:true,w:3,d:3,ceil:3.2,sockets:'s1 n1',sw:[-.95,'s'],name:'Underground tea room',note:'UNDERGROUND. A tea room in a converted tunnel chamber: a raw concrete vault and pipes over a warm dark-wood interior, backlit paper screens, a tatami dais with low tables and cushions, a tea station (an island with the kettle, cups and a lucky cat; the host stands behind it, between it and the partition), lanterns. Front door (south) and back door (north) join tunnel pieces; the back door is hidden in a service nook behind a partition and a folding screen.',
  objects:[O('tea','TEA STATION','the tea station'),O('table','LOW TABLE','the low table'),O('safe','STRONGBOX','the strongbox'),LIGHTS],
  furn:[[-2.9,-1.1,-2.5,1.3,.15,'dais'],[-2.9,1.15,1.5,1.6,2.3,'partition'],[-.8,1,.2,.7,.85,'tea'],[2.2,2.9,.85,.95,1.7,'screen'],[1.2,2.2,-2.2,-1,.4,'table-e'],[2.4,2.9,-2.9,-2.4,.9,'bonsai'],[-2.9,-2.4,1.7,2.9,1.8,'shelves'],[2.2,2.9,2.5,2.9,.9,'sink']],
  inter:[{id:'tea',label:'TEA STATION',pos:[.1,1,-.05],object:'tea',range:1.3},{id:'table',label:'LOW TABLE',pos:[-1,.6,-.3],object:'table',range:1.3},{id:'safe',label:'STRONGBOX',pos:[-2.2,1,2.3],object:'safe',range:1.2}],
  say:{tea:'TEA STATION: a kettle on a hot plate, cups drying on a cloth, tins of leaves. A pipe overhead ticks as it cools.',table:'LOW TABLE: cups for four, a game board left mid-play.',safe:'STRONGBOX: on the service-nook shelf, lacquered wood over steel. Locked.'},
  plan:{seats:[[-2,-1.5],[-2,.4],[1.7,-1.6]],passage:[[0,2.3],[1.7,2],[1.6,1.2],[1.4,.4]]},
  // the cushions: on the dais (west; one steps up from the aisle at x -0.75, clear of the dais and the tea station: both are furniture) the two tables' outer sides, never two backs together or a back to the wall; the east table's four
  sits:[...cushionSits('cushion-a',[-2.4,-1.6,-1.95,-1.05],.18,['s','e'],(k,x,z)=>[-.75,z]),...cushionSits('cushion-b',[-2.4,-1.6,-.15,.75],.18,['s','e','n'],(k,x,z)=>[-.75,k==='e'?-.3:k==='s'?-.75:z]),...cushionSits('cushion-c',[1.2,2.2,-2.2,-1],.03,['s','n','w','e'])],
  spots:[['host',.1,1.1,PI],['front-door',1,-2.3,0],['back-door',-1,2.3,PI/2]],lights:[[-1.6,2.4,-.6,'#ffc890',1.5,9],[1.4,2.4,-.2,'#ffb878',1.2,8]]});
 /* THE UNDERGROUND, EAST ASIAN SET (the owner, 20 Nov 2026: "lantern tunnel. mahjong. a small sleeping room with bed divided by curtains. underground food stall."):
    converted tunnel chambers where raw concrete and pipes show round warm wood, lanterns and cloth. The lantern tunnel pieces are tubes like the plain ones (the same
    cross-section, seamless with them), only dressed. Generic designs: no real brands, no readable writing, no religious symbols. */
 TUBE('tunnel-lantern',{d:3,dress:'lantern',sockets:'s0 n0',name:'Lantern tunnel, 20 ft',note:'UNDERGROUND. A service tunnel dressed with strings of paper lanterns, hanging cloth banners and small wall shrines. Same cross-section as the plain tunnel: mixes freely with it in a run.',
  objects:[O('shrine','WALL SHRINE','the wall shrine'),LIGHTS],inter:[{id:'shrine',label:'WALL SHRINE',pos:[.6,1.3,-1.5],object:'shrine',range:1.2}],say:{shrine:'WALL SHRINE: a niche in the concrete, a stub of candle, a cup of rice, a paper charm gone soft with damp.'},sw:[-2.2,'w'],lights:[[0,2,0,'#ffb070',1.2,9]]});
 TUBE('tunnel-lantern-junction',{d:1,dress:'lantern',sockets:'s0 n0 w0 e0',name:'Lantern tunnel junction (corner / T / cross)',note:'UNDERGROUND. The tunnel junction dressed with lanterns and a banner. Seamless with every tunnel piece.',objects:[],lights:[[0,2,0,'#ffb070',1,6]]});
 const UG=(id,o)=>T(id,{cat:'various',style:'tunnel',underground:true,ownLamps:true,w:3,d:3,sockets:'s1 n1',sw:[-.95,'s'],...o});
 UG('mahjong',{ceil:3,name:'Mahjong parlour',note:'UNDERGROUND. A low-lit parlour in a tunnel chamber: three square game tables with tiles and stools, a cashier nook, smoke haze, a cloth curtain inside the front door. Front and back doors join tunnel pieces.',
  objects:[O('table','GAME TABLE','a game table'),O('cashier','CASHIER','the cashier nook'),O('safe','CASH DRAWER','the cash drawer'),LIGHTS],
  furn:[[-2.5,-1.3,-2.4,-1.2,.76,'table-sw'],[-2.5,-1.3,1,2.2,.76,'table-nw'],[1.2,2.4,-.6,.6,.76,'table-e'],[1.6,2.9,1.6,2.9,1.05,'cashier'],[2.2,2.9,-2.9,-2.2,1.2,'shelf']],
  inter:[{id:'table',label:'GAME TABLE',pos:[-1,.9,1.6],object:'table',range:1.3},{id:'table2',label:'GAME TABLE',pos:[.9,.9,0],object:'table',range:1.2},{id:'cashier',label:'CASHIER',pos:[1.4,1.1,2.2],object:'cashier',range:1.2},{id:'safe',label:'CASH DRAWER',pos:[2.2,1.1,1.4],object:'safe',range:1}],
  say:{table:'GAME TABLE: tiles face down in walls of four, a dish of chips, a cold cup of tea. A game left mid-hand.',cashier:'CASHIER: a hatch, a calculator, a ledger in a hand nobody else can read.',safe:'CASH DRAWER: locked, and chained to the counter.'},
  // one steps up beside the stool (0.55 m to its side: the table leaves no room to stand in front of it until one is there), then in front of it to sit down
  stools:MJ_STOOLS,sits:MJ_STOOLS.filter(t=>t.seat).map(t=>['stool-'+t.id,t.x,t.z,t.yaw,MJ_H,['chair'],[+(t.x+Math.cos(t.yaw)*.55).toFixed(3),+(t.z-Math.sin(t.yaw)*.55).toFixed(3)],MJ_BACK]),
  spots:[['cashier',2.25,2.3,-PI*3/4],['dealer',-1.9,-.9,PI],['door',.9,-2.3,0]],lights:[[-1.9,2.2,-.6,'#ffc890',1.7,9],[1.4,2.2,.6,'#ffb878',1.4,8]]});
 UG('flophouse',{ceil:2.8,name:'Underground sleeping room',note:'UNDERGROUND. A cheap flophouse in a tunnel chamber: four cots, each in its own nook behind cloth curtains on rails, worn blankets, a locker and a dim bulb per nook, pipes overhead. Front and back doors join tunnel pieces.',
  objects:[O('cot','COT','a cot'),O('locker','LOCKER','a locker'),O('curtain','CURTAIN','a curtain'),LIGHTS],
  furn:COT_LAYOUT.map(c=>[c.cx-c.width/2,c.cx+c.width/2,c.zc-c.depth/2,c.zc+c.depth/2,.54,c.id]),
  inter:COT_LAYOUT.flatMap((c,k)=>[{id:k===1?'cot':c.id,label:'COT',pos:[c.sx*1.68,.65,c.zc],object:'cot',range:1.1},{id:k===3?'curtain':c.curtain,curtain:c.curtain,label:'DRAW CURTAIN',pos:[c.xi,1.35,c.zc],object:'curtain',range:1.1},{id:k===2?'locker':'locker-'+c.id,label:'UNDER-BED LOCKER',pos:[c.sx*1.7,.25,c.zc-c.sz*.65],object:'locker',range:1.1}]),
  say:{cot:'COT: a worn mattress, a folded blanket and a pillow.',locker:'LOCKER: a low storage box tucked beneath the bed.',curtain:'CURTAIN: heavy cloth on rings.'},
  sits:COTS,
  // Named, unobstructed floor anchors for the Tea Room's two visiting androids.
  // These are placement targets only; character models and dialogue remain separately published.
  spots:[['keeper',0,-2.2,0],['nomi',-.62,-1.05,0],['se7en',.62,1.05,Math.PI]],lights:[[0,2.4,-1.2,'#ffc890',1.4,8],[0,2.4,1.4,'#ffb878',1.2,8]]});
 UG('food-stall',{w:2,d:2,ceil:2.8,sockets:'s0 n0',sw:[-1.6,'s'],name:'Underground food stall',note:'UNDERGROUND. A small food counter in a tunnel nook: a steaming wok and stock pot, a menu board of pictures (no writing), three stools at the counter, a cooler, hanging lanterns, a cook’s spot behind the counter. The aisle runs between its two doors.',
  objects:[O('counter','FOOD COUNTER','the food counter'),O('stove','WOK STATION','the wok station'),O('cooler','COOLER','the cooler'),O('menu','MENU BOARD','the menu board'),LIGHTS],
  furn:[[.1,.7,-1.5,1.5,1,'counter'],[1.3,1.9,-1.4,.6,.9,'stove'],[1.3,1.9,1,1.9,1.8,'cooler']],
  inter:[{id:'counter',label:'FOOD COUNTER',pos:[-.25,1.05,.2],object:'counter',range:1.2},{id:'stove',label:'WOK STATION',pos:[.85,1.1,-.8],object:'stove',range:1.4},{id:'cooler',label:'COOLER',pos:[.9,1.2,1.45],object:'cooler',range:1.3},{id:'menu',label:'MENU BOARD',pos:[1.7,1.85,-.4],object:'menu',range:2.2}],
  say:{counter:'FOOD COUNTER: a steel top worn bright, chopsticks in a tin, a jar of chilli oil, a bell.',stove:'WOK STATION: a wok spitting over a blue flame, a stock pot that has been simmering for days.',cooler:'COOLER: drinks, eggs, a tray of something wrapped in paper.',menu:'MENU BOARD: pictures of bowls with prices in chalk. The cook points at the one you want.'},
  spots:[['cook',1,0,-PI/2]],lights:[[.6,2.3,0,'#ffc890',1.6,8]]});
 T('tunnel-chamber',{underground:true,ownLamps:true,cat:'hallway',style:'tunnel',w:2,d:2,ceil:3,sockets:'s0 s1 n0 n1 w0 w1 e0 e1',name:'Tunnel chamber',note:'UNDERGROUND. A wider 13 ft x 13 ft tunnel chamber: a sump with a pump, a valve wheel, pipe runs, cable trays, two openings on each side.',
  objects:[O('valve','VALVE','the valve'),O('pump','SUMP PUMP','the sump pump'),LIGHTS],furn:[[-.35,.35,-.35,.35,.9,'pump']],inter:[{id:'pump',label:'SUMP PUMP',pos:[0,1,-.6],object:'pump',range:1.2},{id:'valve',label:'VALVE',pos:[1.7,1.2,1.7],object:'valve',range:1.2}],
  say:{pump:'SUMP PUMP: it coughs, runs, stops. The water in the sump does not go down.'},sw:[-1,'s'],lights:[[0,2.6,0,'#ffd8a0',1.2,8]]});
 // OTHER: a storage room (4 m x 4 m) and a maintenance corridor (2 m x 6 m).
 T('storage',{cat:'other',style:'back',name:'Storage room',note:'Shelving with boxes, lockers, a breaker panel.',w:2,d:2,ceil:2.6,sockets:'s0 n1 w0 e1',
  objects:[O('lockers','LOCKERS','the lockers'),O('panel','BREAKER PANEL','the breaker panel'),LIGHTS],furn:[[-1.9,-.2,1.45,1.9,2,'shelf-n'],[-1.9,-1.45,.1,1.45,2,'shelf-w'],[1.45,1.9,-1.9,-.1,1.9,'lockers'],[.1,1.3,-1.9,-1.45,.8,'boxes']],
  inter:[{id:'lockers',label:'LOCKERS',pos:[1.3,1.3,-1],object:'lockers',range:1.3},{id:'panel',label:'BREAKER PANEL',pos:[.7,1.5,-1.75],object:'panel',range:1.3}],sw:[-1.75,'s'],lights:[[0,2.3,0,'#e0e8d8',1,7]]});
 T('maint-corridor',{cat:'other',style:'tech',name:'Maintenance corridor',note:'Pipe runs, a valve manifold, a junction panel, grating, caged lamps.',w:1,d:3,ceil:2.5,sockets:'s0 n0 w1 e1',
  objects:[O('panel','JUNCTION PANEL','the junction panel'),O('valve','VALVE','the valve'),LIGHTS],furn:[[.62,.9,-2.6,-1.6,1.4,'manifold'],[-.9,-.72,-2.4,-1.4,1.8,'junction']],
  inter:[{id:'panel',label:'JUNCTION PANEL',pos:[-.55,1.3,-1.9],object:'panel',range:1.3},{id:'valve',label:'VALVE',pos:[.45,1.2,-2.1],object:'valve',range:1.3}],sw:[2,'w'],lights:[[0,2.2,-1.4,'#ffd8a0',1.4,7],[0,2.2,1.6,'#ffcf90',1.1,6]]});
 // HOUSING and their hallways: the existing apartments (apartments.js), as portal modules. Their own rooms and doors; reached through a door that leads elsewhere.
 const LEGACY=[['rundown','Rundown apartment','Rundown hallway'],['normal','Normal apartment','Ordinary hallway'],['luxury','Luxury apartment','Luxury hallway'],['container-rundown','Container — rundown','Container hallway (rundown)'],['container-regular','Container — regular','Container hallway (regular)']];
 for(const [st,n,h] of LEGACY){const cont=st.startsWith('container-');
  T('apt-'+st,{cat:'housing',style:'legacy',name:n,note:'The '+n.toLowerCase()+' from the apartment set: bed, couch, bathroom, computer, safe, closet, vending machine.',portal:true,legacy:{part:'flat',style:st},sockets:'entry',screen:st!=='luxury',family:cont?'container':'city'});
  T('hall-'+st,{cat:'hallway',style:'legacy',name:h,note:(cont?'Four':'Ten')+' numbered apartment doors and a street door. Link one of its doors to an apartment.',portal:true,legacy:{part:'hall',style:st},sockets:['street',...Array.from({length:cont?4:10},(_,i)=>'d'+i)].join(' '),family:cont?'container':'city'});}
 for(const t of Object.values(TYPES))if(t.portal)for(const s of t.sockets)s.edge=null;
 const TYPE_IDS=Object.keys(TYPES);
 /* The objects of a type ("Use something in ..."): a legacy apartment has the apartment set's own (apartments.js OBJECTS, the screen only where there is one). */
 function objectsOf(type){const t=TYPES[type];if(!t)return [];if(t.legacy){if(t.legacy.part!=='flat')return [];const X=AP();return ((X&&X.OBJECTS)||[]).filter(o=>o.id==='screen'?t.screen:true).map(o=>({id:o.id,label:o.label,name:o.name}));}return t.objects;}
 // The inside of a type, in local metres (x east, z north, centred): [x0, x1, z0, z1].
 function bounds(type){const t=TYPES[type];if(!t)return null;if(t.legacy){const X=AP(),G=X&&X.geo(t.legacy.style);if(!G)return [-4,4,-5,5];const R=t.legacy.part==='hall'?G.HALL:G.APT;return [R.x[0],R.x[1],R.z[0],R.z[1]];}const W=t.w*GRID/2,D=t.d*GRID/2;return [-W+WALL,W-WALL,-D+WALL,D-WALL];}

 // ---------------------------------------------------------------- placing on the grid
 const NORMAL={n:[0,1],s:[0,-1],e:[1,0],w:[-1,0]},TURN={n:'e',e:'s',s:'w',w:'n'},OPP={n:'s',s:'n',e:'w',w:'e'},TANGENT={n:[1,0],s:[1,0],e:[0,1],w:[0,1]};
 // a quarter turn clockwise seen from above (north up): local +x goes to -z, +z to +x (Babylon's rotation.y = rot * PI/2 does the same)
 const rotP=(rot,x,z)=>{const c=[1,0,-1,0][rot],s=[0,1,0,-1][rot];return [r2(x*c+z*s)+0,r2(-x*s+z*c)+0];};
 const turnEdge=(e,rot)=>{for(let i=0;i<rot;i++)e=TURN[e];return e;};
 function sockLocal(t,s){const W=t.w*GRID,D=t.d*GRID,o=GRID*(s.cell+.5);return s.edge==='s'?[-W/2+o,-D/2]:s.edge==='n'?[-W/2+o,D/2]:s.edge==='w'?[-W/2,-D/2+o]:[W/2,-D/2+o];}
 const ROT=r=>((Math.round(Number(r)||0)%4)+4)%4;
 /* A grid module placed: footprint (cells), centre (metres on its floor's grid), rotation. */
 function place(m){const t=TYPES[m&&m.type];if(!t||t.portal)return null;const rot=ROT(m.rot),w=rot%2?t.d:t.w,d=rot%2?t.w:t.d,x=m.x|0,z=m.z|0;return {id:m.id,type:m.type,t,rot,x,z,w,d,floor:m.floor|0,cx:(x+w/2)*GRID,cz:(z+d/2)*GRID,m};}
 function sockWorld(p,s){const l=sockLocal(p.t,s),r=rotP(p.rot,l[0],l[1]);return {x:r2(p.cx+r[0]),z:r2(p.cz+r[1]),edge:turnEdge(s.edge,p.rot)};}
 const toWorld=(p,x,z)=>{const r=rotP(p.rot,x,z);return [r2(p.cx+r[0]),r2(p.cz+r[1])];};
 function boxWorld(p,[x0,x1,z0,z1]){const a=toWorld(p,x0,z0),b=toWorld(p,x1,z1);return [Math.min(a[0],b[0]),Math.max(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[1],b[1])];}
 const inFoot=(p,x,z)=>x>p.x*GRID+1e-6&&x<(p.x+p.w)*GRID-1e-6&&z>p.z*GRID+1e-6&&z<(p.z+p.d)*GRID-1e-6;
 const parseRef=r=>{const m=typeof r==='string'?REF.exec(r):null;return m?{mod:m[1],sock:m[2]}:null;};
 /* ANALYSE a location: placed modules, the snaps (doors two modules share), portal links, the elevator shaft, the clusters built together, the doors, the problems.
    Pure and cheap; the editor, the checks and the game all use it. */
 function analyse(loc){const out={placed:[],portal:[],byId:{},snaps:[],links:[],doors:[],clusters:[],problems:[],cabs:[],sockUse:{}};const mods=Array.isArray(loc&&loc.modules)?loc.modules:[];
  for(const m of mods){if(!m||typeof m!=='object'||!TYPES[m.type]||typeof m.id!=='string')continue;if(out.byId[m.id])continue;const t=TYPES[m.type];out.byId[m.id]={m,t};if(t.portal)out.portal.push(m);else{const p=place(m);out.placed.push(p);out.byId[m.id].p=p;if(t.cab)out.cabs.push(p);}}
  const P=out.problems,nameOf=id=>{const b=out.byId[id];return '“'+id+'” ('+((b&&b.t.name)||'?')+')';};
  // overlaps (same floor)
  for(let i=0;i<out.placed.length;i++)for(let j=i+1;j<out.placed.length;j++){const a=out.placed[i],b=out.placed[j];if(a.floor!==b.floor)continue;if(a.x<b.x+b.w&&b.x<a.x+a.w&&a.z<b.z+b.d&&b.z<a.z+a.d)P.push('modules '+nameOf(a.id)+' and '+nameOf(b.id)+' overlap on floor '+a.floor+'.');}
  // sockets: snaps where two meet face to face; a door into another module's wall is refused
  const at=new Map(),world={};for(const p of out.placed)for(const s of p.t.sockets){const w=sockWorld(p,s),k=p.floor+':'+Math.round(w.x*10)+','+Math.round(w.z*10);world[p.id+'.'+s.id]={...w,floor:p.floor};if(!at.has(k))at.set(k,[]);at.get(k).push({p,s,w});}
  for(const list of at.values()){if(list.length<2)continue;for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){const a=list[i],b=list[j];if(a.p.id!==b.p.id&&OPP[a.w.edge]===b.w.edge){const ra=a.p.id+'.'+a.s.id,rb=b.p.id+'.'+b.s.id;if(out.sockUse[ra]||out.sockUse[rb])continue;out.sockUse[ra]=rb;out.sockUse[rb]=ra;out.snaps.push({a:ra,b:rb,floor:a.p.floor,x:a.w.x,z:a.w.z,edge:a.w.edge});}}}
  for(const p of out.placed)for(const s of p.t.sockets){const ref=p.id+'.'+s.id;if(out.sockUse[ref])continue;const w=world[ref],n=NORMAL[w.edge],q=[w.x+n[0]*.5,w.z+n[1]*.5];
   const hit=out.placed.find(o=>o!==p&&o.floor===p.floor&&inFoot(o,q[0],q[1]));if(hit)P.push('door '+s.id+' of '+nameOf(p.id)+' opens into a wall of '+nameOf(hit.id)+': turn or move one of them so the doors meet.');}
  // portal links (explicit)
  const links=Array.isArray(loc&&loc.links)?loc.links:[];
  for(const l of links){const a=parseRef(l&&l.a),b=parseRef(l&&l.b);if(!a||!b){P.push('a connection names a door that does not exist.');continue;}
   const ok=r=>{const B=out.byId[r.mod];return B&&B.t.sockets.some(s=>s.id===r.sock);};if(!ok(a)||!ok(b)){P.push('a connection names a door that does not exist ('+l.a+' to '+l.b+').');continue;}
   if(a.mod===b.mod){P.push('a connection joins a module to itself ('+l.a+').');continue;}
   const ta=out.byId[a.mod].t,tb=out.byId[b.mod].t;if(!ta.portal&&!tb.portal){P.push('connect '+nameOf(a.mod)+' and '+nameOf(b.mod)+' by placing them side by side (their doors meet), not with a connection.');continue;}
   if(out.sockUse[l.a]||out.sockUse[l.b]){P.push('door '+(out.sockUse[l.a]?l.a:l.b)+' is used twice.');continue;}
   for(const r of [[l.a,a],[l.b,b]]){const B=out.byId[r[1].mod];if(B.p){const w=world[r[0]],n=NORMAL[w.edge],q=[w.x+n[0]*.5,w.z+n[1]*.5];if(out.placed.some(o=>o!==B.p&&o.floor===B.p.floor&&inFoot(o,q[0],q[1])))P.push('door '+r[0]+' leads elsewhere but another module stands in front of it.');}}
   out.sockUse[l.a]=l.b;out.sockUse[l.b]=l.a;out.links.push({a:l.a,b:l.b});}
  // the elevator shaft: one cab per floor; every cab reaches every other
  const floors={};for(const c of out.cabs){if(floors[c.floor])P.push('two elevator cabs (or stairwells) on floor '+c.floor+': one per floor (they are the same lift or stair).');else floors[c.floor]=c;}
  if(out.cabs.length===1)P.push((out.cabs[0].t&&out.cabs[0].t.stairs?'the stairwell ':'the elevator ')+nameOf(out.cabs[0].id)+' needs a second '+(out.cabs[0].t&&out.cabs[0].t.stairs?'stairwell':'cab')+' on another floor (same place), so it has somewhere to go.');
  for(const c of out.cabs)if(!out.sockUse[c.id+'.s0'])P.push('the elevator cab '+nameOf(c.id)+' has to open onto a lobby, a hallway or a room (its door meets nothing).');
  // the entry (the street door leads there)
  const e=parseRef(loc&&loc.entry);
  if(mods.length){if(!e||!out.byId[e.mod]||!out.byId[e.mod].t.sockets.some(s=>s.id===e.sock))P.push('choose the entrance: the door of a module the street door leads to.');
   else if(out.sockUse[loc.entry])P.push('the entrance '+loc.entry+' is already a door between two modules: choose a free door.');
   else if(out.byId[e.mod].t.cab)P.push('the street door cannot lead straight into an elevator cab.');
   else{const B=out.byId[e.mod];if(B.p){const w=world[loc.entry],n=NORMAL[w.edge],q=[w.x+n[0]*.5,w.z+n[1]*.5];if(out.placed.some(o=>o!==B.p&&o.floor===B.p.floor&&inFoot(o,q[0],q[1])))P.push('the entrance '+loc.entry+' faces another module: choose an outside door.');}
}}
  // doors: every snap, link and the entry, with a stable id
  const canon=(a,b)=>a<b?a+'|'+b:b+'|'+a;
  for(const s of out.snaps)out.doors.push({id:canon(s.a,s.b),kind:'snap',a:s.a,b:s.b,floor:s.floor,x:s.x,z:s.z,edge:s.edge});
  for(const l of out.links)out.doors.push({id:canon(l.a,l.b),kind:'portal',a:l.a,b:l.b});
  if(e&&out.byId[e.mod]&&!out.sockUse[loc.entry])out.doors.push({id:'street|'+loc.entry,kind:'entry',a:loc.entry,b:null});
  // more ways out to the street (only the shared tunnel network under the city has them, ncz-underground.js: one per stairwell; never in a mission's location)
  for(const x of Array.isArray(loc&&loc.exits)?loc.exits:[]){const r=parseRef(x);if(r&&out.byId[r.mod]&&!out.sockUse[x]&&x!==loc.entry){out.sockUse[x]='street';out.doors.push({id:'street|'+x,kind:'entry',a:x,b:null});}}
  out.world=world;
  // clusters: modules built together (snapped, same floor); a portal module is a cluster of its own
  const parent={};const find=x=>parent[x]===x?x:(parent[x]=find(parent[x]));for(const id of Object.keys(out.byId))parent[id]=id;for(const s of out.snaps){const a=find(parseRef(s.a).mod),b=find(parseRef(s.b).mod);if(a!==b)parent[b]=a;}
  const groups=new Map();for(const id of Object.keys(out.byId)){const r=find(id);if(!groups.has(r))groups.set(r,[]);groups.get(r).push(id);}
  let ci=0;for(const ids of groups.values()){const f=out.byId[ids[0]].p?out.byId[ids[0]].p.floor:null;out.clusters.push({id:'c'+(ci++),mods:ids,floor:f,portal:!out.byId[ids[0]].p});}
  out.clusterOf=id=>out.clusters.find(c=>c.mods.includes(id))||null;
  // reachable from the entrance (doors, links, the elevator)
  if(e&&out.byId[e.mod]){const adj={};const join=(a,b)=>{(adj[a]=adj[a]||[]).push(b);(adj[b]=adj[b]||[]).push(a);};for(const s of out.snaps)join(parseRef(s.a).mod,parseRef(s.b).mod);for(const l of out.links)join(parseRef(l.a).mod,parseRef(l.b).mod);
   for(const a of out.cabs)for(const b of out.cabs)if(a!==b&&a.floor!==b.floor)join(a.id,b.id);const seen=new Set([e.mod]),q=[e.mod];while(q.length){const x=q.shift();for(const y of adj[x]||[])if(!seen.has(y)){seen.add(y);q.push(y);}}
   for(const id of Object.keys(out.byId))if(!seen.has(id))P.push('module '+nameOf(id)+' cannot be reached from the entrance: join it with a door, a connection or the elevator.');}
  return out;}
 // The door a reference belongs to (either side), or null.
 function doorOf(an,ref){return an.doors.find(d=>d.a===ref||d.b===ref)||null;}
 // The floors an elevator reaches (sorted) and the cab on each.
 const cabFloors=an=>an.cabs.map(c=>c.floor).sort((a,b)=>a-b);
 const floorName=f=>f===0?'GROUND':f<0?'B'+(-f):String(f);

 // ---------------------------------------------------------------- checks (plain words; empty = fine)
 const plain=(v,max)=>typeof v==='string'&&v.trim().length>0&&v.length<=max&&!/[<>]/.test(v);
 const keysOk=(o,keys)=>!!o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).every(k=>keys.includes(k));
 const LOC_KEYS=['id','door','from','entry','modules','links','locks'],MOD_KEYS=['id','type','x','z','rot','floor','lightsOff','screenOff','number','items'];
 const isLocation=a=>!!a&&typeof a==='object'&&Array.isArray(a.modules);
 /* Problems with one location (a mission's apartments entry that has modules). doorFamily: the street door's family ('city', 'container', 'office', 'commercial') or null. */
 function problems(loc,doorFamily,shapeOnly){const out=[];if(!keysOk(loc,LOC_KEYS)){out.push('it has unknown fields.');return out;}
  const mods=loc.modules;if(!mods.length||mods.length>LIMIT.modules){out.push('a location has 1 to '+LIMIT.modules+' modules.');return out;}
  const ids=new Set();let items=0;
  for(const m of mods){const w='module “'+((m&&m.id)||'?')+'”';if(!keysOk(m,MOD_KEYS)){out.push(w+' has unknown fields.');continue;}
   if(typeof m.id!=='string'||!MOD_ID.test(m.id))out.push(w+': its name is lowercase letters, digits and hyphens (12 at most), starting with a letter.');else if(ids.has(m.id))out.push(w+': two modules have the same name.');ids.add(m.id);
   const t=TYPES[m.type];if(!t){out.push(w+': choose a module type.');continue;}
   if(t.portal){if(['x','z','rot','floor'].some(k=>m[k]!=null))out.push(w+': '+t.name+' is reached through a connection, it has no place on the grid.');}
   else{for(const k of ['x','z'])if(!(Number.isInteger(m[k])&&m[k]>=0&&m[k]<=SPAN))out.push(w+': its place on the grid is a whole number of cells from 0 to '+SPAN+'.');
    if(m.rot!=null&&!(Number.isInteger(m.rot)&&m.rot>=0&&m.rot<=3))out.push(w+': its turn is 0 to 3 quarter turns.');if(m.floor!=null&&!(Number.isInteger(m.floor)&&m.floor>=FLOORS[0]&&m.floor<=FLOORS[1]))out.push(w+': its floor is a whole number from '+FLOORS[0]+' to '+FLOORS[1]+'.');
    const p=place(m);if(p&&(p.x+p.w>SPAN||p.z+p.d>SPAN))out.push(w+': it does not fit on the '+SPAN+' x '+SPAN+' grid.');}
   for(const k of ['lightsOff','screenOff'])if(m[k]!=null&&typeof m[k]!=='boolean')out.push(w+': “'+(k==='lightsOff'?'lights start':'screen starts')+'” is on or off.');
   if(m.screenOff!=null&&!t.screen)out.push(w+': '+t.name+' has no screen to switch.');
   if(m.number!=null&&!(Number.isInteger(m.number)&&m.number>=1&&m.number<=9999&&t.legacy&&t.legacy.part==='flat'))out.push(w+': only an apartment has a number on its door (1 to 9999).');
   if(m.items!=null){if(!Array.isArray(m.items)){out.push(w+': placed items are a list.');continue;}const b=bounds(m.type);
    for(const it of m.items){items++;if(!keysOk(it,['type','label','x','z','y'])||!ITEM_TYPES.includes(it.type)||!plain(it.label,LIMIT.label)){out.push(w+': a placed item needs a type and a short label (60 characters, plain text).');continue;}
     const num=v=>typeof v==='number'&&Number.isFinite(v);if(!num(it.x)||!num(it.z)||it.x<b[0]+.1||it.x>b[1]-.1||it.z<b[2]+.1||it.z>b[3]-.1)out.push(w+': a placed item must be inside the module (x '+r2(b[0]+.1)+'..'+r2(b[1]-.1)+', z '+r2(b[2]+.1)+'..'+r2(b[3]-.1)+').');
     if(it.y!=null&&!(num(it.y)&&it.y>=0&&it.y<=2.6))out.push(w+': a placed item’s height is 0 to 8.5 ft.');}}}
  if(items>LIMIT.items)out.push('a location has at most '+LIMIT.items+' placed items.');
  if(loc.links!=null&&(!Array.isArray(loc.links)||loc.links.length>LIMIT.links||loc.links.some(l=>!keysOk(l,['a','b']))))out.push('connections are a list of door pairs (at most '+LIMIT.links+').');
  if(loc.locks!=null&&(!Array.isArray(loc.locks)||loc.locks.length>LIMIT.locks||loc.locks.some(r=>typeof r!=='string')))out.push('locked doors are a list (at most '+LIMIT.locks+').');
  if(out.length)return out;
  const an=analyse(loc);if(!shapeOnly)out.push(...an.problems);else out.push(...an.problems.filter(p=>!/entrance|cannot be reached|needs a second (cab|stairwell)|meets nothing/.test(p)));
  for(const r of loc.locks||[]){const d=doorOf(an,r);if(!d)out.push('locked door '+r+': choose a door between two modules (or a connection).');else if(d.kind==='entry')out.push('locked door '+r+': the street door is locked by its own access point (a hack step on the street door).');}
  // the street door: an older housing hallway or apartment as the entrance keeps its own kind of door (a container behind a container door)
  if(!shapeOnly&&doorFamily){const e=parseRef(loc.entry),B=e&&an.byId[e.mod];if(B&&B.t.family&&(B.t.family==='container')!==(doorFamily==='container'))out.push(B.t.family==='container'?'a container hallway or apartment goes behind a container door in The Outskirts.':'a city hallway or apartment goes behind a city street door (any part of town, an office or shop entrance too), not a container in The Outskirts.');}   // any city style behind any city door (the owner, 20 Nov 2026); The Outskirts: the containers only
  return out;}
 const ITEM_TYPES=['loot','mission-item','note','other'];
 // A door reference a hack may name: any door of the location (either side), the entrance included.
 function hackable(loc,ref){if(!isLocation(loc))return false;const an=analyse(loc),d=doorOf(an,ref);return !!d&&!seamless(an,d);}   // a seam between two tunnel tubes is not a door
 // The content export (mission-content.js treeStrip): only the known fields.
 function strip(loc){const x={id:loc.id,door:loc.door||''};if(loc.from&&loc.from!=='start')x.from=loc.from;if(typeof loc.entry==='string')x.entry=loc.entry;
  x.modules=(loc.modules||[]).slice(0,LIMIT.modules).filter(m=>m&&TYPES[m.type]&&MOD_ID.test(m.id||'')).map(m=>{const y={id:m.id,type:m.type};const t=TYPES[m.type];if(!t.portal){y.x=m.x|0;y.z=m.z|0;if(ROT(m.rot))y.rot=ROT(m.rot);if(m.floor)y.floor=m.floor|0;}
   if(m.lightsOff===true)y.lightsOff=true;if(m.screenOff===true&&t.screen)y.screenOff=true;if(Number.isInteger(m.number)&&t.legacy&&t.legacy.part==='flat')y.number=m.number;
   const its=(m.items||[]).filter(i=>i&&ITEM_TYPES.includes(i.type)&&plain(i.label,LIMIT.label)).slice(0,LIMIT.items).map(i=>{const z={type:i.type,label:i.label.trim(),x:r2(Number(i.x)||0),z:r2(Number(i.z)||0)};if(Number.isFinite(i.y))z.y=r2(i.y);return z;});if(its.length)y.items=its;return y;});
  const links=(loc.links||[]).filter(l=>l&&REF.test(l.a||'')&&REF.test(l.b||'')).slice(0,LIMIT.links).map(l=>({a:l.a,b:l.b}));if(links.length)x.links=links;
  const locks=(loc.locks||[]).filter(r=>REF.test(r||'')).slice(0,LIMIT.locks);if(locks.length)x.locks=locks;return x;}

 // ---------------------------------------------------------------- the editor's helpers
 /* Where a new module of `type` goes so that one of its doors meets the free door `target` ('<module>.<socket>'): tries its doors and its four turns, the first that fits
    (no overlap, no door into a wall). Returns {x, z, rot, floor, sock} or null. For a portal type: null (it is connected with a link). */
 function attach(loc,type,target){const t=TYPES[type];if(!t||t.portal)return null;const an=analyse(loc),r=parseRef(target),B=r&&an.byId[r.mod];if(!B||!B.p||an.sockUse[target])return null;const w=an.world[target],want=OPP[w.edge];
  for(let rot=0;rot<4;rot++)for(const s of t.sockets){if(turnEdge(s.edge,rot)!==want)continue;const l=sockLocal(t,s),o=rotP(rot,l[0],l[1]),cx=w.x-o[0],cz=w.z-o[1],W=rot%2?t.d:t.w,D=rot%2?t.w:t.d,x=cx/GRID-W/2,z=cz/GRID-D/2;
   if(Math.abs(x-Math.round(x))>1e-6||Math.abs(z-Math.round(z))>1e-6)continue;const c={id:'tmp-new-x',type,x:Math.round(x),z:Math.round(z),rot,floor:B.p.floor};if(c.x<0||c.z<0||c.x+W>SPAN||c.z+D>SPAN)continue;
   const test={...loc,modules:[...loc.modules,c]},a2=analyse(test);if(a2.problems.some(p=>/overlap|opens into a wall/.test(p)&&p.includes('tmp-new-x')))continue;if(a2.sockUse['tmp-new-x.'+s.id]!==target)continue;return {x:c.x,z:c.z,rot,floor:c.floor,sock:s.id};}
  return null;}
 /* A free spot for a first module (or one that is not attached yet): the middle of the grid, else anywhere it does not overlap. */
 function freeSpot(loc,type,floor){const t=TYPES[type];if(!t||t.portal)return null;const f=floor|0;for(const [x,z] of [[10,10],[6,6],[14,6],[6,14],[14,14],[2,2],[18,2],[2,18],[18,18]]){if(x+t.w>SPAN||z+t.d>SPAN)continue;const c={id:'tmp-new-x',type,x,z,rot:0,floor:f};
   const a2=analyse({...loc,modules:[...(loc.modules||[]),c]});if(!a2.problems.some(p=>/overlap|opens into a wall/.test(p)&&p.includes('tmp-new-x')))return {x,z,rot:0,floor:f};}return null;}
 // The free doors of the location (for "attach to" and the entrance), per module.
 function freeSockets(loc){const an=analyse(loc),out=[];for(const [id,B] of Object.entries(an.byId))for(const s of B.t.sockets){const ref=id+'.'+s.id;if(an.sockUse[ref]||ref===loc.entry)continue;
   if(B.p){const w=an.world[ref],n=NORMAL[w.edge],q=[w.x+n[0]*.5,w.z+n[1]*.5];if(an.placed.some(o=>o!==B.p&&o.floor===B.p.floor&&inFoot(o,q[0],q[1])))continue;}out.push({ref,mod:id,sock:s.id,edge:B.p?an.world[ref].edge:null,portal:!B.p});}return out;}
 const newId=(loc,type)=>{const base=({'office-floor':'office','server-room':'servers','elevator':'lift','elevator-lobby':'lobby','hall-office':'hall','hall-commercial':'hall','shop-back':'shop','bar-back':'bar','clinic':'clinic','storage':'store','maint-corridor':'maint','pawn-back':'pawn','noodle-kitchen':'kitchen','repair-shop':'repair','implant-shop':'cyber','laundry-back':'laundry','tea-room':'tea','card-room':'cards','tattoo':'tattoo','radio-booth':'radio','scooter-bay':'garage','shrine-room':'shrine','fight-pit':'pit','gang-vestibule':'gate','stairwell':'stairs','tunnel':'tunnel','tunnel-short':'tunnel','tunnel-mid':'tunnel','tunnel-junction':'junction','tunnel-chamber':'chamber','tea-under':'tearoom','tunnel-lantern':'lanterns','tunnel-lantern-junction':'junction','mahjong':'mahjong','flophouse':'sleep','food-stall':'stall'}[type])||(TYPES[type]&&TYPES[type].legacy?(TYPES[type].legacy.part==='hall'?'hall':'flat'):'room');
  const ids=new Set((loc.modules||[]).map(m=>m.id));if(!ids.has(base))return base;let n=2;while(ids.has(base+n))n++;return base+n;};
 /* Add a module to a location (the editor's "Add a location > category > module"): attached to the free door `to` when given (or the first free door that fits),
    a second elevator cab on another floor, or a portal module connected to a free portal door. Returns {ok, loc, id, why}. */
 function addModule(loc,type,opts={}){const t=TYPES[type];if(!t)return {ok:false,why:'Unknown module.'};const L={...loc,modules:[...(loc.modules||[])],links:[...(loc.links||[])]};if(L.modules.length>=LIMIT.modules)return {ok:false,why:'A location has at most '+LIMIT.modules+' modules.'};
  const id=opts.id||newId(L,type);
  if(t.portal){const flat=t.legacy.part==='flat',own=id+'.'+(flat?'entry':'street');L.modules.push({id,type});if(L.modules.length===1){L.entry=own;delete L.links;return {ok:true,loc:L,id};}
   const free=freeSockets({...L,modules:L.modules.slice(0,-1)}).filter(f=>f.ref!==L.entry);
   const pick=(opts.to&&free.find(f=>f.ref===opts.to))||(flat?free.find(f=>f.portal&&/^d\d+$/.test(f.sock))||free.find(f=>!f.portal):free.find(f=>f.portal&&f.sock==='entry')||free.find(f=>!f.portal));
   if(!pick){if(!L.links.length)delete L.links;return {ok:true,loc:L,id,why:'Added: connect one of its doors to another module’s free door.'};}
   L.links.push(flat||!pick.portal?{a:pick.ref,b:own}:{a:id+'.d0',b:pick.ref});return {ok:true,loc:L,id};}
  if(t.cab&&opts.floor!=null){const an=analyse(L),c=an.cabs[0];if(c){L.modules.push({id,type,x:c.x,z:c.z,rot:c.rot,floor:opts.floor|0});return {ok:true,loc:L,id};}}
  if(!L.modules.length){const s=freeSpot(L,type,opts.floor||0);L.modules.push({id,type,...s});L.entry=id+'.'+t.sockets[0].id;delete L.links;return {ok:true,loc:L,id};}
  const free=freeSockets(L).filter(f=>!f.portal&&f.ref!==L.entry&&(opts.floor==null||analyse(L).byId[f.mod].p.floor===(opts.floor|0)));const order=opts.to?[free.find(f=>f.ref===opts.to)].filter(Boolean):free;
  for(const f of order){const a=attach(L,type,f.ref);if(a){L.modules.push({id,type,x:a.x,z:a.z,rot:a.rot,floor:a.floor});if(!L.links.length)delete L.links;return {ok:true,loc:L,id};}}
  const s=freeSpot(L,type,opts.floor||0);if(!s)return {ok:false,why:'No room left on that floor.'};L.modules.push({id,type,...s});if(!L.links.length)delete L.links;return {ok:true,loc:L,id,why:'There was no free door it fits: it is placed on its own. Move or turn it until its door meets another.'};}
 /* Remove a module: its connections, locks and the entrance (if it was there) go with it. */
 function removeModule(loc,id){const L={...loc,modules:(loc.modules||[]).filter(m=>m.id!==id)};L.links=(loc.links||[]).filter(l=>!l.a.startsWith(id+'.')&&!l.b.startsWith(id+'.'));if(!L.links.length)delete L.links;
  L.locks=(loc.locks||[]).filter(r=>!r.startsWith(id+'.'));if(!L.locks.length)delete L.locks;if(typeof L.entry==='string'&&L.entry.startsWith(id+'.')){const f=freeSockets(L)[0];L.entry=f?f.ref:'';}return L;}
 /* TEMPLATES ("Make a mission" and the editor's quick start): ready-made locations that fit and pass the checks. */
 const TEMPLATES=[
  {id:'office',name:'Office (hallway and office floor)',loc:{entry:'hall.s0',modules:[{id:'hall',type:'hall-office',x:5,z:0},{id:'office',type:'office-floor',x:4,z:4}]}},
  {id:'office-servers',name:'Office with a server room downstairs (elevator)',loc:{entry:'hall.s0',modules:[{id:'hall',type:'hall-office',x:5,z:0},{id:'office',type:'office-floor',x:4,z:4},{id:'lift',type:'elevator',x:10,z:6,rot:1},{id:'lift2',type:'elevator',x:10,z:6,rot:1,floor:-1},{id:'servers',type:'server-room',x:6,z:5,floor:-1}]}},
  {id:'shop',name:'Shop back room',loc:{entry:'hall.s0',modules:[{id:'hall',type:'hall-commercial',x:5,z:0},{id:'shop',type:'shop-back',x:4,z:4}]}},
  {id:'bar',name:'Bar back room',loc:{entry:'hall.s0',modules:[{id:'hall',type:'hall-commercial',x:5,z:0},{id:'bar',type:'bar-back',x:4,z:4}]}},
  {id:'clinic',name:'Street clinic',loc:{entry:'hall.s0',modules:[{id:'hall',type:'hall-commercial',x:5,z:0},{id:'clinic',type:'clinic',x:4,z:4}]}},
  {id:'pawn',name:'Pawn shop back room (sell items)',loc:{entry:'hall.s0',modules:[{id:'hall',type:'hall-commercial',x:5,z:0},{id:'pawn',type:'pawn-back',x:4,z:4}]}},
  {id:'kitchen',name:'Noodle kitchen',loc:{entry:'hall.s0',modules:[{id:'hall',type:'hall-commercial',x:5,z:0},{id:'kitchen',type:'noodle-kitchen',x:4,z:4}]}},
  {id:'repair',name:'Electronics repair workshop',loc:{entry:'hall.s0',modules:[{id:'hall',type:'hall-commercial',x:5,z:0},{id:'repair',type:'repair-shop',x:4,z:4}]}},
  {id:'cyber',name:'Cyberware workshop',loc:{entry:'hall.s0',modules:[{id:'hall',type:'hall-commercial',x:5,z:0},{id:'cyber',type:'implant-shop',x:4,z:4}]}},
  {id:'laundry',name:'Laundromat back room',loc:{entry:'hall.s0',modules:[{id:'hall',type:'hall-commercial',x:5,z:0},{id:'laundry',type:'laundry-back',x:4,z:4}]}},
  {id:'tea',name:'Tea house private room',loc:{entry:'hall.s0',modules:[{id:'hall',type:'hall-commercial',x:5,z:0},{id:'tea',type:'tea-room',x:4,z:4}]}},
  {id:'cards',name:'Card room',loc:{entry:'hall.s0',modules:[{id:'hall',type:'hall-commercial',x:5,z:0},{id:'cards',type:'card-room',x:4,z:4}]}},
  {id:'tattoo',name:'Tattoo parlour',loc:{entry:'hall.s0',modules:[{id:'hall',type:'hall-commercial',x:5,z:0},{id:'tattoo',type:'tattoo',x:4,z:4}]}},
  {id:'radio',name:'Pirate radio booth',loc:{entry:'hall.s0',modules:[{id:'hall',type:'hall-commercial',x:5,z:0},{id:'radio',type:'radio-booth',x:4,z:4}]}},
  {id:'garage',name:'Scooter garage',loc:{entry:'hall.s0',modules:[{id:'hall',type:'hall-commercial',x:5,z:0},{id:'garage',type:'scooter-bay',x:4,z:4}]}},
  {id:'shrine',name:'Shrine room behind a shop',loc:{entry:'hall.s0',modules:[{id:'hall',type:'hall-commercial',x:5,z:0},{id:'shrine',type:'shrine-room',x:5,z:4}]}},
  {id:'fight-pit',name:'Underground: fight pit off a tunnel (preview)',loc:{entry:'tunnel.n0',modules:[{id:'tunnel',type:'tunnel',x:5,z:4,floor:-1},{id:'pit',type:'fight-pit',x:4,z:0,floor:-1}]}},
  {id:'tea-under',name:'Underground: tunnel run with a tea room off a T-junction (preview)',loc:{entry:'run.s0',modules:[{id:'run',type:'tunnel',x:10,z:10,floor:-1},{id:'junction',type:'tunnel-junction',x:10,z:13,floor:-1},{id:'run2',type:'tunnel-mid',x:10,z:14,floor:-1},{id:'spur',type:'tunnel-short',x:11,z:13,rot:1,floor:-1},{id:'tearoom',type:'tea-under',x:12,z:12,rot:1,floor:-1}]}},
  {id:'east-asian',name:'Underground: lantern tunnel, mahjong parlour, food stall, sleeping room (preview)',loc:{entry:'lanterns.s0',modules:[{id:'lanterns',type:'tunnel-lantern',x:10,z:10,floor:-1},{id:'junction',type:'tunnel-lantern-junction',x:10,z:13,floor:-1},{id:'north',type:'tunnel-mid',x:10,z:14,floor:-1},{id:'mahjong',type:'mahjong',x:9,z:16,floor:-1},{id:'east',type:'tunnel-short',x:11,z:13,rot:1,floor:-1},{id:'stall',type:'food-stall',x:12,z:12,rot:1,floor:-1},{id:'west',type:'tunnel-mid',x:8,z:13,rot:1,floor:-1},{id:'sleep',type:'flophouse',x:5,z:12,rot:1,floor:-1}]}},
  {id:'tunnel-run',name:'Underground: a long tunnel run with a T and a corner (preview)',loc:{entry:'t1.s0',modules:[{id:'t1',type:'tunnel',x:10,z:10,floor:-1},{id:'t2',type:'tunnel-short',x:10,z:13,floor:-1},{id:'t3',type:'tunnel-lantern',x:10,z:14,floor:-1},{id:'tee',type:'tunnel-junction',x:10,z:17,floor:-1},{id:'branch',type:'tunnel-short',x:9,z:17,rot:1,floor:-1},{id:'t4',type:'tunnel',x:10,z:18,floor:-1},{id:'corner',type:'tunnel-lantern-junction',x:10,z:21,floor:-1},{id:'t5',type:'tunnel-mid',x:11,z:21,rot:1,floor:-1}]}},
  {id:'underground',name:'Underground: stairs down, gang checkpoint, tunnel, fight pit (preview)',loc:{entry:'hall.s0',modules:[{id:'hall',type:'hall-commercial',x:5,z:6},{id:'stairs',type:'stairwell',x:5,z:10},{id:'stairs2',type:'stairwell',x:5,z:10,floor:-1},{id:'gate',type:'gang-vestibule',x:5,z:7,floor:-1},{id:'tunnel',type:'tunnel',x:5,z:4,floor:-1},{id:'pit',type:'fight-pit',x:4,z:0,floor:-1}]}},
  {id:'storage',name:'Storage behind a maintenance corridor',loc:{entry:'maint.s0',modules:[{id:'maint',type:'maint-corridor',x:5,z:0},{id:'store',type:'storage',x:5,z:3}]}}];
 const template=(id,extra={})=>{const t=TEMPLATES.find(x=>x.id===id);return t?JSON.parse(JSON.stringify({...t.loc,...extra})):null;};
 /* MIGRATION: an older apartment entry {id, style, door, number?, from?, locked?, screenOff?, lightsOff?, items?} as a location of two portal modules (its hallway and
    the apartment behind the hallway door it has now), and its steps' access points ('<id>/hall' -> '<id>/hall.d<slot>', '<id>/entry' -> '<id>/flat.entry'; a "use" step names the
    flat). The older shape stays valid everywhere: this is for the editor's CONVERT TO MODULES button and the tests. */
 function fromApartment(a,missionId){const X=AP();const slot=X?(X.slotsFor([{key:(missionId||'')+'/'+a.id}],a.style)[(missionId||'')+'/'+a.id]||0):0;
  const flat={id:'flat',type:'apt-'+a.style};if(Number.isInteger(a.number))flat.number=a.number;if(a.lightsOff===true)flat.lightsOff=true;if(a.screenOff===true)flat.screenOff=true;if(Array.isArray(a.items)&&a.items.length)flat.items=a.items.map(i=>({...i}));
  const loc={id:a.id,door:a.door||'',entry:'hall.street',modules:[{id:'hall',type:'hall-'+a.style},flat],links:[{a:'hall.d'+slot,b:'flat.entry'}]};if(a.from&&a.from!=='start')loc.from=a.from;if(a.locked===true)loc.locks=['hall.d'+slot];return {loc,ap:{[a.id+'/hall']:a.id+'/hall.d'+slot,[a.id+'/entry']:a.id+'/flat.entry'}};}
 function migrateMission(m){const out=JSON.parse(JSON.stringify(m));let changed=false;const map={};out.apartments=(out.apartments||[]).map(a=>{if(isLocation(a)||!a||!a.style)return a;const r=fromApartment(a,out.id);Object.assign(map,r.ap);changed=true;return r.loc;});
  for(const o of out.objectives||[]){if(!o)continue;if(o.kind==='hack'&&map[o.ap])o.ap=map[o.ap];const a=(out.apartments||[]).find(x=>x&&x.id===o.apt);if(a&&isLocation(a)&&(o.kind==='apt-use'||o.kind==='apt-enter')&&!o.mod&&a.modules.some(x=>x.id==='flat'))o.mod='flat';}
  return changed?out:m;}

 // ---------------------------------------------------------------- the walking area (one cluster: the modules built together)
 /* layout(inst, clusterId, opts) -> the location record the game walks in (like apartments.js layout): id 'neochinatown' (never a save location), private, apartment
    and modular flags, solids (walls with door gaps, furniture, closed doors), interactions (objects, light switches, access points, exits, elevator buttons, items),
    spawn, and `cluster` (the placed modules and doors module-build.js draws). inst: an apartmentsNow() entry {key, mission, id, door, loc, hacked}. */
 const box=(x0,x1,z0,z1,id,h=2.4,y0=0)=>({id,position:[r2((x0+x1)/2),r2(y0+h/2),r2((z0+z1)/2)],size:[r2(x1-x0),r2(h),r2(z1-z0)]});
 /* A SEAM: two tunnel tubes joined end to end (no wall, no door between them: the tunnel runs straight through). */
 const seamless=(an,d)=>!!d&&d.kind==='snap'&&!!d.b&&[d.a,d.b].every(r=>{const b=an.byId[parseRef(r).mod];return !!(b&&b.t.tube);});
 function lockedNow(inst,an,d){const locks=(inst.loc&&inst.loc.locks)||[],hacked=inst.hacked||[];if(!locks.includes(d.a)&&!locks.includes(d.b))return false;return !(hacked.includes(d.a)||(d.b&&hacked.includes(d.b)));}
 function layout(inst,cid,opts={}){const loc=inst.loc,an=analyse(loc),cl=an.clusters.find(c=>c.id===cid)||an.clusterOf(parseRef(loc.entry)?.mod)||an.clusters[0];if(!cl)return null;
  if(cl.portal)return legacyLayout(inst,an,cl,opts);
  const ps=cl.mods.map(id=>an.byId[id].p);let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9;for(const p of ps){x0=Math.min(x0,p.x*GRID);x1=Math.max(x1,(p.x+p.w)*GRID);z0=Math.min(z0,p.z*GRID);z1=Math.max(z1,(p.z+p.d)*GRID);}
  const off=Array.isArray(opts.offset)?[opts.offset[0],opts.offset[1]]:[r2(ORIGIN[0]-(x0+x1)/2),r2(ORIGIN[1]-(z0+z1)/2)],W=(x,z)=>[r2(x+off[0]),r2(z+off[1])];
  const solids=[],interactions=[],doors=[],mods=[];const mine=new Set(cl.mods);
  for(const p of ps){const t=p.t,mm=p.m,id=p.id;const open=[];   // the door gaps in this module's walls: every socket that is a door
   for(const s of t.sockets){const ref=id+'.'+s.id;const d=doorOf(an,ref);if(d)open.push({s,d,ref});}
   // walls: four edges, each split around its door gaps (local, then to the world)
   const B=bounds(p.type),hw=t.w*GRID/2,hd=t.d*GRID/2;
   for(const e of ['s','n','w','e']){if(open.some(o=>o.s.edge===e&&seamless(an,o.d)))continue;   // a seam: no wall on that end
    const gaps=open.filter(o=>o.s.edge===e).map(o=>{const c=sockLocal(t,o.s);return (e==='s'||e==='n')?c[0]:c[1];}).sort((a,b)=>a-b);const along=(e==='s'||e==='n')?[-hw,hw]:[-hd,hd];let a=along[0];
    const seg=(u0,u1)=>{if(u1-u0<.01)return;const bx=e==='s'?[u0,u1,-hd,-hd+WALL]:e==='n'?[u0,u1,hd-WALL,hd]:e==='w'?[-hw,-hw+WALL,u0,u1]:[hw-WALL,hw,u0,u1];const wb=boxWorld(p,bx),q=W(wb[0],wb[2]),q2=W(wb[1],wb[3]);solids.push(box(q[0],q2[0],q[1],q2[1],'wall-'+id+'-'+e+'-'+solids.length,t.ceil));};
    for(const g of gaps){seg(a,g-DOOR.clear/2);a=g+DOOR.clear/2;}seg(a,along[1]);}
   for(const f of t.furn){const wb=boxWorld(p,f),q=W(wb[0],wb[2]),q2=W(wb[1],wb[3]);solids.push(box(q[0],q2[0],q[1],q2[1],id+'-'+f[5],Math.max(.4,f[4])));}
   const at=(x,y,z)=>{const w=toWorld(p,x,z),q=W(w[0],w[1]);return [q[0],y,q[1]];};
   for(const it of t.inter)interactions.push({id:id+'-'+it.id,label:it.label,position:at(...it.pos),action:'mod-use',mod:id,object:it.object,...(it.curtain?{curtain:it.curtain}:{}),range:it.range||1.4});
   if(t.sw){const [u,e]=t.sw,pt=e==='s'?[u,-hd+WALL+.08]:e==='n'?[u,hd-WALL-.08]:e==='w'?[-hw+WALL+.08,u]:[hw-WALL-.08,u];interactions.push({id:id+'-lights',label:'LIGHTS',position:at(pt[0],1.45,pt[1]),action:'mod-use',mod:id,object:'lights',range:1.3});}
   (mm.items||[]).forEach((it,k)=>interactions.push({id:id+'-item-'+k,label:'LOOK: '+String(it.label||'item').toUpperCase().slice(0,40),position:at(it.x,Number.isFinite(it.y)?it.y+.2:1.1,it.z),action:'mod-item',mod:id,index:k,range:1.3}));
   if(t.cab){const fl=cabFloors(an).filter(f=>f!==p.floor);fl.forEach((f,k)=>interactions.push(t.stairs?{id:id+'-floor-'+f,label:'STAIRS · '+(f<p.floor?'DOWN':'UP')+' TO '+floorName(f),position:at(f<p.floor?1.05+.25*k:-1.05-.25*k,1.2,-.8),action:'mod-elev',mod:id,floor:f,range:1.3}:{id:id+'-floor-'+f,label:'ELEVATOR · FLOOR '+floorName(f),position:at(.8,1.05+.2*k,-.42),action:'mod-elev',mod:id,floor:f,range:1.2}));}   // a stairwell: down at the foot of the east flight, up at the west one
   mods.push({id,type:p.type,cx:W(p.cx,p.cz)[0],cz:W(p.cx,p.cz)[1],rot:p.rot,w:p.w,d:p.d,floor:p.floor,ceil:t.ceil,lightsOff:mm.lightsOff===true,screenOff:mm.screenOff===true,items:(mm.items||[]).map(i=>({...i})),
    open:open.map(o=>o.s.id),seam:open.filter(o=>seamless(an,o.d)).map(o=>o.s.edge),edges:edgeInfo(an,p)});}
  // doors: a snap inside this cluster (drawn once), the entrance and links that leave it (each with a dark vestibule behind)
  for(const d of an.doors){const ra=parseRef(d.a),rb=d.b&&parseRef(d.b);const inA=mine.has(ra.mod),inB=rb&&mine.has(rb.mod);if(!inA&&!inB)continue;
   const side=inA?d.a:d.b,sp=an.byId[parseRef(side).mod].p,w=an.world[side],q=W(w.x,w.z),n=NORMAL[w.edge],tg=TANGENT[w.edge],locked=lockedNow(inst,an,d);
   const leads=d.kind==='snap'&&inA&&inB?null:d.kind==='entry'?'street':(inA?d.b:d.a);
   const rec={id:d.id,kind:leads?(leads==='street'?'entry':'portal'):'snap',a:d.a,b:d.b,side,x:q[0],z:q[1],edge:w.edge,n,tg,locked,leads,floor:sp.floor};if(leads&&leads!=='street'){const ob=an.byId[parseRef(leads).mod];if(ob)rec.leadsType=ob.m.type;}/* what is through it (module-build.js shows its picture in the doorway) */if(seamless(an,d)){rec.seam=true;rec.locked=false;doors.push(rec);continue;}doors.push(rec);   // a seam: nothing to draw, nothing in the way
   {const sx=tg[0]?DOOR.clear/2:.05,sz=tg[1]?DOOR.clear/2:.05;solids.push({...box(q[0]-sx,q[0]+sx,q[1]-sz,q[1]+sz,'door:'+d.id,2.2),open:false,door:d.id});}
   // access points: on each side that is in this cluster
   for(const r of [d.a,d.b]){if(!r)continue;const pr=parseRef(r);if(!mine.has(pr.mod))continue;const pw=an.world[r],pn=NORMAL[pw.edge],pt=TANGENT[pw.edge],P0=W(pw.x,pw.z),inner=(pw.edge==='s'||pw.edge==='n'?an.byId[pr.mod].p.w:an.byId[pr.mod].p.d)*GRID/2;
    const off2=Math.min(.85,inner-WALL-.12),pos=[r2(P0[0]+pt[0]*off2-pn[0]*.16),1.4,r2(P0[1]+pt[1]*off2-pn[1]*.16)];rec.ap=rec.ap||{};rec.ap[r]=pos;
    interactions.push({id:'ap-'+r,label:'ACCESS POINT',position:pos,action:'apt-ap',ap:inst.id+'/'+r,mission:inst.mission,range:1}); }
   if(leads){const vx=[q[0]+n[0]*.05,q[0]+n[0]*1.1],vz=[q[1]+n[1]*.05,q[1]+n[1]*1.1];   // the vestibule: walls left and right and at the back
    const A0=[Math.min(...vx),Math.max(...vx)],B0=[Math.min(...vz),Math.max(...vz)];
    if(tg[0]){solids.push(box(q[0]-.75,q[0]-.55,B0[0],B0[1],'vest-'+d.id+'-1'),box(q[0]+.55,q[0]+.75,B0[0],B0[1],'vest-'+d.id+'-2'),box(q[0]-.75,q[0]+.75,n[1]>0?B0[1]:B0[0]-.2,n[1]>0?B0[1]+.2:B0[0],'vest-'+d.id+'-3'));}
    else{solids.push(box(A0[0],A0[1],q[1]-.75,q[1]-.55,'vest-'+d.id+'-1'),box(A0[0],A0[1],q[1]+.55,q[1]+.75,'vest-'+d.id+'-2'),box(n[0]>0?A0[1]:A0[0]-.2,n[0]>0?A0[1]+.2:A0[0],q[1]-.75,q[1]+.75,'vest-'+d.id+'-3'));}
    const lbl=leads==='street'?'EXIT TO THE STREET':'DOOR';interactions.push({id:'exit-'+d.id,label:lbl,position:[r2(q[0]-n[0]*.55),1.6,r2(q[1]-n[1]*.55)],action:leads==='street'?'mod-exit':'mod-portal',door:d.id,range:1.4});}
   else if(locked)interactions.push({id:'door-'+d.id,label:'DOOR · LOCKED (ACCESS POINT)',position:[r2(q[0]-n[0]*.5),1.6,r2(q[1]-n[1]*.5)],action:'mod-door',door:d.id,range:1.3});}
  // spawn: from the street at the entrance, from a portal at that door, by elevator in the cab
  let spawn=null,yaw=0;const from=opts.from;
  const atDoor=r=>{const dd=doors.find(x=>x.a===r||x.b===r);if(!dd)return null;const n=NORMAL[an.world[r].edge];return {spawn:[r2(dd.x-n[0]*1.25),1.7,r2(dd.z-n[1]*1.25)],yaw:Math.atan2(-n[0],-n[1])};};
  if(from&&from.cab){const c=ps.find(p=>p.t.cab);if(c){const q=W(c.cx,c.cz),ar=c.t.arrive||[0,.25],f=toWorld(c,ar[0],ar[1]);const s=W(f[0],f[1]);spawn=[s[0],1.7,s[1]];const n=NORMAL[turnEdge('s',c.rot)];yaw=Math.atan2(n[0],n[1]);}}
  else if(from&&from.ref){const a=atDoor(from.ref);if(a){spawn=a.spawn;yaw=a.yaw;}}
  if(!spawn){const a=atDoor(loc.entry)||doors.filter(x=>!x.seam).map(x=>atDoor(x.side)).find(Boolean)||{spawn:[ps[0]?W(ps[0].cx,ps[0].cz)[0]:ORIGIN[0],1.7,ps[0]?W(ps[0].cx,ps[0].cz)[1]:ORIGIN[1]],yaw:0};spawn=a.spawn;yaw=a.yaw;}   // a cluster entered with no door of its own named: its first door, else its first module's middle (never the location's far-off origin)
  // never ON furniture or a wall (the owner, 20 Nov 2026, "stuck in a housing room"): 1.25 m in from a door can land on furniture standing close inside it (the tea room's back
  // door opens into a nook behind a partition); then the nearest place the player can stand, first along the line in from the door, then anywhere near (tests/interior-spawns.test.cjs)
  {const X=EXP();if(X&&X.blocked(spawn[0],spawn[2],{bounds:[700,700],solids})){const n=[Math.sin(yaw),Math.cos(yaw)];let ok=null;for(let k=1.15;k>=.55&&!ok;k-=.1){const q=[r2(spawn[0]-n[0]*(1.25-k)),r2(spawn[2]-n[1]*(1.25-k))];if(!X.blocked(q[0],q[1],{bounds:[700,700],solids}))ok=q;}
   if(!ok){const f=X.free(spawn[0],spawn[2],{bounds:[700,700],solids},3);if(f.moved)ok=[r2(f.x),r2(f.z)];}if(ok){spawn=[ok[0],1.7,ok[1]];}}}
  const name=[...new Set(ps.map(p=>p.t.name))].slice(0,3).join(' · ').toUpperCase();
  return {id:'neochinatown',name,kind:'city',apartment:true,modular:true,private:true,part:'modular',area:'module',style:dominant(ps),bounds:[700,700],spawn,yaw,color:'#0e0f12',music:'earth',solids,interactions,signs:[],
   cluster:{id:cl.id,floor:cl.floor,mods,doors,offset:off,floors:cabFloors(an)},inst:inst.key,apt:{mission:inst.mission,id:inst.id},door:inst.door};}
 const dominant=ps=>{const k={};for(const p of ps)k[p.t.style]=(k[p.t.style]||0)+p.w*p.d;return Object.entries(k).sort((a,b)=>b[1]-a[1])[0][0];};
 // per edge: is there a module beyond it (no windows), which sockets are doors
 function edgeInfo(an,p){const out={};for(const e of ['n','s','e','w']){const we=turnEdge(e,p.rot),n=NORMAL[we];const t=p.t,hw=t.w*GRID/2,hd=t.d*GRID/2;let blocked=false;
   const samples=(e==='n'||e==='s')?Array.from({length:t.w},(_,i)=>[-hw+GRID*(i+.5),e==='n'?hd:-hd]):Array.from({length:t.d},(_,i)=>[e==='e'?hw:-hw,-hd+GRID*(i+.5)]);
   for(const [lx,lz] of samples){const w=toWorld(p,lx,lz),q=[w[0]+n[0]*.5,w[1]+n[1]*.5];if(an.placed.some(o=>o!==p&&o.floor===p.floor&&inFoot(o,q[0],q[1])))blocked=true;}out[e]={neighbour:blocked};}return out;}
 /* A portal module's walking area: the older apartment set's own layout (apartments.js), with its doors wired to the location (hallway doors linked to apartments,
    the street door, the apartment's entry). */
 function legacyLayout(inst,an,cl,opts){const X=AP();if(!X)return null;const id=cl.mods[0],B=an.byId[id],L=B.t.legacy,st=L.style,m=B.m;
  const def=X.layout(L.part==='hall'?'hall':'flat',st,{items:m.items||[]});def.modular=true;def.legacyPart=L.part;def.modId=id;def.inst=inst.key;def.apt={mission:inst.mission,id:inst.id};def.door=inst.door;def.cluster={id:cl.id,mods:[{id,type:B.m.type}],doors:[],legacy:true};
  const ref=s=>id+'.'+s;const leadOf=r=>{const d=doorOf(an,r);if(!d)return null;return d.kind==='entry'?'street':(d.a===r?d.b:d.a);};
  def.interactions=def.interactions.map(i=>{if(i.action==='apt-hall-exit')return {...i,action:leadOf(ref('street'))==='street'?'mod-exit':'mod-portal',door:(doorOf(an,ref('street'))||{}).id};if(i.action==='apt-exit')return {...i,action:leadOf(ref('entry'))==='street'?'mod-exit':'mod-portal',door:(doorOf(an,ref('entry'))||{}).id};
   if(i.action==='apt-hall-door'){const d=doorOf(an,ref('d'+i.slot));return d?{...i,action:'mod-portal',door:d.id}:{...i,action:'mod-door',door:null};}return i;});   // the apartment's own objects and items keep their handlers (apartment-integration.js; the use carries def.modId)
  if(L.part==='hall'){const G=X.geo(st);def.open=[];for(const sl of G.HALL.slots){const d=doorOf(an,ref('d'+sl.i));const lead=d&&leadOf(ref('d'+sl.i)),lb=lead&&parseRef(lead),tm=lb&&an.byId[lb.mod];
    if(d){def.open.push({slot:sl.i,number:(tm&&tm.m.number)||null,key:inst.key+'|'+d.id,locked:lockedNow(inst,an,d),id:inst.id,mission:inst.mission,door:d.id});def.cluster.doors.push({id:d.id,slot:sl.i,locked:lockedNow(inst,an,d)});}
    const w=X.world([sl.x-.75,1.4,sl.z>0?(G.container?.55:.62):(G.container?-.55:-.62)]);def.interactions.push({id:'hall-ap-'+sl.i,label:'ACCESS POINT',position:w,action:'apt-ap',ap:inst.id+'/'+ref('d'+sl.i),mission:inst.mission,range:1});}
   const ds=doorOf(an,ref('street'));if(ds)def.cluster.doors.push({id:ds.id,street:true,locked:false});def.street=inst.door;}
  else{const G=X.geo(st),ap=G.AP;def.interactions.push({id:'apt-ap',label:'ACCESS POINT',position:X.world([ap.x,1.4,ap.z+.45]),action:'apt-ap',ap:inst.id+'/'+ref('entry'),mission:inst.mission,range:1});def.items=m.items||[];def.screenOff=m.screenOff===true;def.lightsOff=m.lightsOff===true;
   const de=doorOf(an,ref('entry'));if(de)def.cluster.doors.push({id:de.id,entry:true,locked:lockedNow(inst,an,de)});}
  const from=opts.from;if(L.part==='hall'&&from&&from.ref){const k=/^.*\.d(\d+)$/.exec(from.ref);if(k){const f=X.hallFront(+k[1],st);def.spawn=f.spawn;def.yaw=f.yaw;}}
  return def;}
 // Which cluster a door leads into, and from where the player arrives (for the game's transitions).
 function across(inst,doorId,fromSide){const an=analyse(inst.loc),d=an.doors.find(x=>x.id===doorId);if(!d||d.kind==='entry')return null;const other=d.a===fromSide?d.b:d.b===fromSide?d.a:null;const r=other||d.b;const c=an.clusterOf(parseRef(r).mod);return c?{cluster:c.id,ref:r}:null;}
 function clusterAtFloor(inst,floor){const an=analyse(inst.loc),c=an.cabs.find(x=>x.floor===floor);return c?an.clusterOf(c.id).id:null;}

 // ---------------------------------------------------------------- the admin inventory (what the server checks a location against)
 function inventory(){return {grid:GRID,span:SPAN,floors:FLOORS.slice(),limit:{...LIMIT},door:{...DOOR},categories:CATS.map(c=>c.id),itemTypes:ITEM_TYPES.slice(),
  types:Object.fromEntries(TYPE_IDS.map(id=>{const t=TYPES[id];return [id,{cat:t.cat,name:t.name,w:t.w||null,d:t.d||null,ceil:t.ceil||null,portal:!!t.portal,cab:!!t.cab,screen:!!t.screen,family:t.family||null,legacy:t.legacy?{...t.legacy}:null,stairs:!!t.stairs,underground:!!t.underground,spots:(t.spots||[]).map(x=>x[0]),sits:(t.sits||[]).map(x=>({name:x[0],poses:x[5].slice()})),
   sockets:t.sockets.map(s=>({id:s.id,edge:s.edge,cell:Number.isFinite(s.cell)?s.cell:null})),objects:objectsOf(id).map(o=>o.id),bounds:bounds(id).map(r2)}];}))};}
 /* SLIDING DOORS AND PEOPLE (20 Nov 2026: "room sliding doors only open for the player, so NPCs pass through closed doors"): a door opens while the player OR any NPC
    (a placed or mission person, the street pair, made givers, people walking with the player indoors) is within `range` metres of its middle, as the street doors do for
    residents (apartment-integration.js nearNpc). Never a door to the street (shut: it fades instead); a locked door stays locked (the slider ignores it). */
 const DOOR_NPC_RANGE=1.6;
 function doorWanted(rec,player,people,range=1.8,npcRange=DOOR_NPC_RANGE){if(!rec||rec.shut)return false;const near=(q,r)=>!!q&&Number.isFinite(q.x)&&Number.isFinite(q.z)&&(rec.x-q.x)**2+(rec.z-q.z)**2<r*r;return near(player,range)||(people||[]).some(q=>near(q,npcRange));}
 const api={FLOOR_POSES,MJ_STOOLS,COT_LAYOUT,GRID,WALL,DOOR,SPAN,doorWanted,DOOR_NPC_RANGE,FLOORS,LIMIT,ORIGIN,CATS,STYLE_NAMES,TYPES,TYPE_IDS,MOD_ID,REF,ITEM_TYPES,TEMPLATES,NORMAL,TANGENT,OPP,
  objectsOf,bounds,place,sockLocal,sockWorld,rotP,turnEdge,toWorld,boxWorld,parseRef,analyse,doorOf,cabFloors,floorName,isLocation,problems,hackable,strip,attach,freeSpot,freeSockets,newId,addModule,removeModule,template,fromApartment,migrateMission,
  layout,lockedNow,across,clusterAtFloor,inventory};
 if(node){module.exports=api;return;}
 root.VoidModules=Object.assign(root.VoidModules||{},api);
})(typeof globalThis!=='undefined'?globalThis:this);
