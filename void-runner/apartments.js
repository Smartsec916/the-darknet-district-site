/* MISSION-INSTANCED APARTMENTS (the owner, 19 Nov 2026: "create me 3 apartment interiors ... instead of creating apartments for all NPCs I'm creating this as instances I can add
   for missions"; docs/development/APARTMENTS.md). PURE DATA AND RULES: no rendering, no DOM, no network. Runs in the browser and in Node (tests/apartments.test.cjs) and gives the
   server its copy through the admin inventory (tools/admin-inventory.cjs `apartments`).
   WHAT IT HOLDS
     STYLES     rundown | normal | luxury: one apartment interior and one hallway each (apartment-build.js draws them, all the same size)
     DOORS      the apartment-building doors along NeoChinatown's street frontages: derived from the street edges neochinatown.js builds its shopfronts on (EDGES, a copy
                the tests compare with the source). A door stands in the 1.5 m gap the shopfront row leaves every 7 m, and only where nothing else is: never in a street
                join, at a gate, at NULL, at Milked's frontage, in front of the District or its terrace, next to a taxi post or street furniture read from the built scenes
                (npc-areas.js obstacles). Each has a stable id (street, side, metres along), a quarter, a style (by quarter) and a house number.
     APT / HALL the two interiors in LOCAL metres (x east, z north; the apartment's entry door on its south wall, the hallway's street door at its west end), placed in
                the world at ORIGIN, far outside the city, so nothing in the city (places, maps, walkers) ever overlaps them.
   MISSION DATA (mission-content.js checks it, void_runner_live_content.py checks the same): a tree mission may carry
     apartments:[{id, style, door, number?, from?, items?}]   id: a short name used by its steps (a1, safehouse ...); style: STYLES; door: a DOORS id; number: the number
                on the hallway door (1-9999; empty: the building's own); from: 'start' (default) or a step id: the door opens from the moment that step is the one in
                progress (or from the mission's start) until the mission ends. items: [{type, label, x, z, y?}] placed in the apartment (data model for later; the
                game shows each as a small marked case with its label).
   and two step kinds: 'apt-enter' {apt} (done while the player is inside that apartment) and 'apt-use' {apt, object} (done when the player uses that object in it:
   OBJECTS). Instances are private: one player's mission opens the door for that player only; other players see the street door locked (remote-players.js
   keeps nobody in an apartment visible). Nothing about an apartment is saved: the interior is not a save location (every login wakes in the Sleeping Pod). */
(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports;
 const QT=()=>node?require('./ncz-quarters.js'):root.VoidQuarters;
 const NA=()=>{try{return node?require('./npc-areas.js'):root.VoidNPCAreas;}catch{return null;}};
 const BAL=()=>{try{return node?require('./ncz-backalleys.js'):root.VoidBackAlleys;}catch{return null;}};
 const STYLES=[
  {id:'rundown',name:'Rundown apartment',hall:'Rundown hallway',note:'Grime, peeling panels, a flickering tube, a mattress on pallets, clutter, cheap neon.'},
  {id:'normal',name:'Normal apartment',hall:'Ordinary hallway',note:'A tidy, compact flat: holo-frame, plants, standard fixtures.'},
  {id:'luxury',name:'Luxury apartment',hall:'Luxury hallway',note:'Premium materials, a window wall over the skyline, ambient strip lighting, art and a bar.'}];
 // THE OUTSKIRTS' CONTAINER APARTMENTS (the owner, 19 Nov 2026: "one more set of apartments, a smaller hallway for it maybe 4 doors, with 2 styles ... Rundown and regular.
 // These will be using shipping containers for The Outskirts"): two joined 40-foot containers inside, a four-door container hallway, and doors in the container homes'
 // fronts along the edge of the yard. A container style only goes behind an Outskirts door, a city style only behind a city door.
 STYLES.push({id:'container-rundown',name:'Container — rundown',hall:'Container hallway (rundown)',container:true,note:'Rust, patched insulation, a mattress, a tarp, scavenged parts.'},
  {id:'container-regular',name:'Container — regular',hall:'Container hallway (regular)',container:true,note:'A clean painted container: insulated panels, tidy compact fittings.'});
 const CONTAINER_STYLES=['container-rundown','container-regular'],isContainer=s=>CONTAINER_STYLES.includes(s);
 const STYLE_IDS=STYLES.map(s=>s.id);
 // What the player can use in every apartment (a step "Use something in apartment X" names one).
 const OBJECTS=[{id:'computer',name:'the computer',label:'COMPUTER'},{id:'panel',name:'the utility panel',label:'UTILITY PANEL'},{id:'safe',name:'the safe',label:'SAFE'},
  {id:'vending',name:'the vending machine',label:'VENDING'},{id:'screen',name:'the ad screen (on / off)',label:'SCREEN',styles:['rundown','normal']},{id:'closet',name:'the closet',label:'CLOSET'},{id:'lights',name:'the light switch',label:'LIGHTS'}];
 const OBJECT_IDS=OBJECTS.map(o=>o.id);
 /* ACCESS POINTS (the owner, 19 Nov 2026: "put a access point at each door for later hacking missions"): a small wall panel beside every apartment door. Its id is the door's:
    a street door's id ('apt-main-w-98'), or '<apartment>/hall' (that apartment's door in the hallway) and '<apartment>/entry' (inside the apartment, by its entry door).
    A step "Hack the access point" (kind 'hack': ap, hold = seconds 2..30, stay = cancel if the player walks away, unlock = that door opens for this player for the rest
    of the mission, needs = an item the player must carry: progression.js personalItems, e.g. the reserved 'hacking-device'). An apartment with locked:true keeps its
    hallway door locked until its '<apartment>/hall' access point is hacked. */
 const HACK={min:2,max:30,def:5};
 const P_=()=>{try{return node?require('./progression.js'):root.VoidProgression;}catch{return null;}};
 const itemIds=()=>Object.keys((P_()&&P_().personalItems)||{'ward-kit':1,'hacking-device':1});
 // (modules.js: a location's door is '<location>/<module>.<socket>', either side of it; a street door may also be an office or shop entrance 'biz-...')
 function apOf(id){if(typeof id!=='string'||!id)return null;const m=/^([a-z][a-z0-9-]{0,23})\/(hall|entry)$/.exec(id);if(m)return {apt:m[1],part:m[2]};const k=/^([a-z][a-z0-9-]{0,23})\/([a-z][a-z0-9-]{0,11})\.([a-z0-9-]{1,10})$/.exec(id);if(k)return {apt:k[1],mod:k[2],sock:k[3]};return /^(apt|biz)-[a-z]+-[nsew]-\d{1,3}$/.test(id)?{door:id}:null;}
 const MOD=()=>{try{return node?require('./modules.js'):root.VoidModules;}catch{return null;}};
 const isLoc=a=>!!a&&typeof a==='object'&&Array.isArray(a.modules);
 const ITEM_TYPES=[{id:'loot',name:'Loot'},{id:'mission-item',name:'Mission item'},{id:'note',name:'Note / data'},{id:'other',name:'Other'}];
 const LIMIT={perMission:4,items:20,label:60,number:9999};
 const INST_ID=/^[a-z][a-z0-9-]{0,23}$/;
 const STREET_NAMES={avenue:'The Avenue',main:'Main Street',road:'the access road',passage:'the Port passage',yard:'The Outskirts',corp:'the Corporate District back alley'};
 /* OFFICE AND SHOP ENTRANCES (modules.js locations; the owner, 19 Nov 2026: "office building interior ... commercial"): a door in the middle of a plain shopfront, half way
    between two apartment doors, where nothing else is. Offices on the Avenue's corporate west end toward the Function Gate (family 'office'), shops' back entrances in Old Town
    and Far South (family 'commercial'). Ids 'biz-<street>-<side>-<metres along>'. A location may go behind any street door; the older apartments only behind 'city' or
    'container' doors. */
 const BIZ_EVERY={office:2,commercial:3};
 const CT=()=>{try{return node?require('./ncz-containers.js'):root.VoidContainers;}catch{return null;}};

 // ---------------------------------------------------------------- the street doors
 // Street edges, outward normal into the buildings, gaps where another street joins: the same list neochinatown.js build() lays its shopfronts on (tests compare them).
 // (The landing pad's walls carry no shopfronts, so no doors; the Outskirts' homes are shipping containers with their own doors.)
 const EDGES=[
  {street:'avenue',a:[2,-5],b:[152,-5],n:[0,1],gaps:[]},{street:'avenue',a:[2,-20],b:[152,-20],n:[0,-1],gaps:[[51,71]]},
  {street:'main',a:[51,-124],b:[51,-20],n:[-1,0],gaps:[[-121,-116]]},{street:'main',a:[71,-124],b:[71,-20],n:[1,0],gaps:[[-61.6,-55.5]]},
  {street:'road',a:[13,-116],b:[51,-116],n:[0,1],gaps:[[37.5,44]]},{street:'road',a:[13,-121],b:[51,-121],n:[0,-1],gaps:[]},
  {street:'passage',a:[37.5,-116],b:[37.5,-106],n:[-1,0],gaps:[]},{street:'passage',a:[44,-116],b:[44,-92],n:[1,0],gaps:[]},
  {street:'main',a:[51,-218],b:[51,-130],n:[-1,0],gaps:[]},{street:'main',a:[71,-218],b:[71,-130],n:[1,0],gaps:[[-174,-168.5],[-193.5,-190]]}];
 const SEG=7,GAP_MARGIN=2.1;   // a shopfront every 7 m (neochinatown.js); a door keeps 2.1 m from a street join (the join's own 1.5 m margin plus the door's half width)
 // Places a door never goes, in world metres [x0,x1,z0,z1]: in use, or someone else's frontage. (The gates come from ncz-quarters.js GATES.)
 const KEEP_OUT=[
  {rect:[18,51,-68.5,-48.5],why:'NULL (the club and its door)'},{rect:[39,51,-76.6,-49.4],why:'the apartment block over the street stalls (Block A)'},
  {rect:[71,101,-197,-165],why:'Milked: its frontage, side street and service alley'},{rect:[78,98,-190,-174],why:'Milked'},
  {rect:[109.4,144.4,-120.4,-61.6],why:'The Darknet District'},{rect:[78.4,99.4,-116.4,-95.4],why:'the District’s terrace'}];
 const inRect=(r,x,z,m=0)=>x>=r[0]-m&&x<=r[1]+m&&z>=r[2]-m&&z<=r[3]+m;
 const sideOf=n=>n[0]<0?'w':n[0]>0?'e':n[1]>0?'n':'s';
 const faceInto=n=>n[1]>0?0:n[1]<0?Math.PI:n[0]>0?Math.PI/2:-Math.PI/2;   // a plane's front is -z: this turns it to face back into the street
 const r2=v=>Math.round(v*100)/100;
 // Why a candidate door spot is refused ('' = it is free). p: the point on the building line; e: its edge.
 function blockedWhy(e,p,noMouth){
  const c=e.n[0]?p[1]:p[0];if(e.gaps.some(([g0,g1])=>c>g0-GAP_MARGIN&&c<g1+GAP_MARGIN))return 'a street joins here';
  for(const k of KEEP_OUT){if(inRect(k.rect,p[0],p[1],1.6))return k.why;for(const d of [3,6,9])if(inRect(k.rect,p[0]+e.n[0]*d,p[1]+e.n[1]*d))return k.why+' (behind it)';}
  if(!noMouth){const X=BAL();if(X&&X.mouthAt&&X.mouthAt(p[0],p[1],.7,1))return 'a back alley opens here';}   // the back alleys' mouths (ncz-backalleys.js, 20 Nov 2026)
 const Q=QT();for(const g of (Q&&Q.GATES)||[])if(inRect(g.rect,p[0],p[1],2.2))return g.name;
  for(const cp of (Q&&Q.CALL_POINTS)||[])if(cp.post&&Math.hypot(cp.post[0]-p[0],cp.post[1]-p[1])<2.6)return 'a taxi post';
  const A=NA();if(A){for(const id of A.IDS||[]){const ar=A.get(id);for(const o of [...((ar&&(ar.addressObstacles||ar.obstacles))||[]),...((ar&&ar.legacy)||[])]){if(o[4]==='a wall')continue;
   const cx=Math.max(o[0],Math.min(p[0],o[1])),cz=Math.max(o[2],Math.min(p[1],o[3])),across=e.n[0]?Math.abs(cx-p[0]):Math.abs(cz-p[1]),along=e.n[0]?Math.abs(cz-p[1]):Math.abs(cx-p[0]);
   if(across<1.3&&along<.9)return o[4];}}}
  return '';}
 // The style a building has by where it stands (the owner's quarters): rundown out at the Port and in Far South, ordinary in Old Town and on most of the Avenue,
 // luxury on the Avenue's west end toward the Function Gate and the Corporate District. A mission may still put any style behind any door.
 function styleAt(q,x){if(q==='far-south'||q==='port'||q==='outskirts')return 'rundown';if(q==='avenue'&&x<60)return 'luxury';return 'normal';}
 let cache=null;
 function doors(){if(cache)return cache;const out=[],Q=QT();
  for(const e of EDGES){const len=Math.hypot(e.b[0]-e.a[0],e.b[1]-e.a[1]);
   for(let s=SEG;s<len-.8;s+=SEG){const t=s/len,p=[e.a[0]+(e.b[0]-e.a[0])*t,e.a[1]+(e.b[1]-e.a[1])*t];if(blockedWhy(e,p))continue;
    const side=sideOf(e.n),along=Math.round(Math.abs(e.n[0]?p[1]:p[0])),front=[r2(p[0]-e.n[0]*1.25),r2(p[1]-e.n[1]*1.25)],q=(Q&&Q.quarterAt(front[0],front[1]))||null;if(!q)continue;
    let num=along;if((side==='e'||side==='n')!==(num%2===1))num+=1;   // west and south sides even, east and north sides odd
    out.push({id:'apt-'+e.street+'-'+side+'-'+along,street:e.street,side,x:r2(p[0]),z:r2(p[1]),n:e.n.slice(),ry:faceInto(e.n),front,quarter:q,style:styleAt(q,p[0]),number:num,
     name:'No. '+num+', '+(STREET_NAMES[e.street]||e.street)});}}
  out.push(...containerDoors(),...bizDoors(Q),...CORP_DOORS.map(d=>({...d,n:d.n.slice(),front:d.front.slice()})));if(Q&&CT()&&out.length)cache=out;return out;}
 /* THE CORPORATE DISTRICT'S MAINTENANCE DOOR (20 Nov 2026, the owner's Mission 009: "use an existing available mission entrance in the Corporate District"): the locked
    MAINTENANCE DOOR on the back alley (corporate.js corp-back-door, its keypad and camera) as a mission entrance: a location may stand behind it like behind any office door.
    scene 'corporate': the Corporate District's own scene builds the door (corporate-integration.js routes its prompt to the hack and to the location); never a street door. */
 const CORP_DOORS=[{id:'biz-corp-s-40',street:'corp',side:'s',x:-40,z:-88,n:[0,1],ry:0,front:[-40,-89.25],quarter:'corporate',scene:'corporate',style:'office',number:40,family:'office',name:'Maintenance door, back alley (Corporate District)'}];
 function bizDoors(Q){const out=[];if(!Q)return out;const n={office:0,commercial:0};
  for(const e of EDGES){const len=Math.hypot(e.b[0]-e.a[0],e.b[1]-e.a[1]);
   for(let s=SEG/2;s<len-1.5;s+=SEG){const t=s/len,p=[e.a[0]+(e.b[0]-e.a[0])*t,e.a[1]+(e.b[1]-e.a[1])*t],why=blockedWhy(e,p,true);if(why)continue;const mouth=!!blockedWhy(e,p);const front=[r2(p[0]-e.n[0]*1.25),r2(p[1]-e.n[1]*1.25)],q=Q.quarterAt(front[0],front[1]);
    const fam=q==='avenue'&&p[0]<60&&e.street==='avenue'?'office':(q==='oldtown'||q==='far-south')&&e.street==='main'?'commercial':null;if(!fam)continue;if((n[fam]++)%BIZ_EVERY[fam])continue;if(mouth)continue;   // a back alley's mouth still counts as a place in the row (20 Nov 2026), so every office and shop door keeps its id
    const side=sideOf(e.n),along=Math.round(Math.abs(e.n[0]?p[1]:p[0]));let num=along;if((side==='e'||side==='n')!==(num%2===1))num+=1;
    out.push({id:'biz-'+e.street+'-'+side+'-'+along,street:e.street,side,x:r2(p[0]),z:r2(p[1]),n:e.n.slice(),ry:faceInto(e.n),front,quarter:q,style:fam,number:num,family:fam,
     name:'No. '+num+', '+(STREET_NAMES[e.street]||e.street)+(fam==='office'?' (offices)':' (shop, back entrance)')});}}
  return out;}   // kept only once the quarters and the containers are known (ncz-quarters.js, ncz-containers.js): an early call never freezes a short list
 /* The Outskirts' doors: one in the yard-facing front of every container on the edge of the yard (the west and east rows, the south row, the two lane ends): evenly one per
    container, at the other end of the front from its own side door (ncz-containers.js), never Kai Kryptos' home, never a container with a deck and stairs on that front, never
    in the yard's middle or a lane. family 'container'; styles alternate rundown / regular; reach: how far the collision of a stacked container stands out (its upper levels). */
 let ySolids=null;
 function clearAt(x,z,own){const C=CT();if(!ySolids)ySolids=C.solids();for(const so of ySolids){if(so.id===own)continue;if(Math.abs(x-so.position[0])<so.size[0]/2+.5&&Math.abs(z-so.position[2])<so.size[2]/2+.5)return false;}
  const A=NA(),ar=A&&A.get&&A.get('outskirts');for(const o of (ar&&(ar.addressObstacles||ar.obstacles))||[])if(x>o[0]-.45&&x<o[1]+.45&&z>o[2]-.45&&z<o[3]+.45)return false;return true;}
 function containerDoors(){const C=CT();if(!C||!C.PLAN)return [];const out=[],Q=QT(),hw=C.CW/2;
  C.PLAN.forEach((c,i)=>{const n=i+1,edge=c.axis==='x'?c.z<-255:(c.x<40||c.x>88);if(!edge||c.flag==='kai'||c.flag==='deck'||c.levels[0].sideDoor===undefined)return;
   const s=c.axis==='x'?1:(c.x<61?1:-1),nv=c.axis==='x'?[0,-1]:[-s,0],reach=c.stack>1?.6:0;
   // along the front: the first place whose doorway and the ground in front of it are clear (other containers' collision, crates read from the built scene); never on its own side door
   let x=0,z=0,front=null;for(const off of [1.3,2,.4,2.5,-.2,-2,-2.5]){if(c.levels[0].sideDoor&&Math.abs(off+1.3)<1.15)continue;const px=c.axis==='x'?c.x+off:c.x+s*hw,pz=c.axis==='x'?c.z+s*hw:c.z+off,f=[r2(px-nv[0]*(1.25+reach)),r2(pz-nv[1]*(1.25+reach))];
    if(clearAt(f[0],f[1],c.id)){x=px;z=pz;front=f;break;}}
   if(!front)return;const q=(Q&&Q.quarterAt(front[0],front[1]))||'outskirts';
   out.push({id:'apt-yard-'+sideOf(nv)+'-'+n,street:'yard',side:sideOf(nv),x:r2(x),z:r2(z),n:nv,ry:faceInto(nv),front,quarter:q,style:n%2?'container-rundown':'container-regular',number:n,reach,family:'container',container:c.id,
    name:'Container '+n+', The Outskirts'});});
  return out;}
 const door=id=>doors().find(d=>d.id===id)||null;
 const doorsIn=q=>doors().filter(d=>d.quarter===q);
 // The door nearest a map click (within `max` metres), for the editor's map picker.
 function pickupPosition(location,player,id){
  const d=door(id);
  if(!d||location?.area!=='street'||location.quarter!==d.quarter||!player||
     !Number.isFinite(player.x)||!Number.isFinite(player.z)||Math.hypot(player.x-d.x,player.z-d.z)>=5)return null;
  return {area:'street',quarter:d.quarter,x:player.x,z:player.z};
 }
 function nearestDoor(x,z,max=12,family=null){let best=null,bd=max;for(const d of doors()){if(family&&(d.family||'city')!==family)continue;const k=Math.hypot(d.x-x,d.z-z);if(k<bd){bd=k;best=d;}}return best;}

 // ---------------------------------------------------------------- the interiors (local metres; world = ORIGIN + local)
 const ORIGIN=[600,600],BOUNDS=[700,700],CEIL=2.8,HALL_CEIL=2.7;
 /* ONE TIMING FOR EVERY SLIDING DOOR (street doors, hallway and apartment doors, module doors, the tunnels' doors; apartment-build.js slider, door-views.js pass):
    open: seconds to slide open (eased); hold: how long it stays open after nobody allowed is near (it never closes while the player is in the doorway: he is always near);
    wait: from E (or the walk-in) to the fade, so the door is open and the next place shows in the doorway first; fadeIn / fadeOut: the short black fade over the swap. */
 const DOOR={open:.6,hold:1.5,wait:.62,fadeIn:.18,fadeOut:.32};
 // The apartment: 8 m x 10 m inside, a bathroom in the north-east corner, the entry door in the middle of the south wall.
 const APT={w:8,d:10,x:[-4,4],z:[-5,5],door:{x:0,z:-5,w:1},bath:{x:[1.4,4],z:[2.2,5],door:[2.5,3.3]},spawn:[-.3,-3.85],yaw:0};   // spawn: in the 1.4 m between the entry door and the couch / low table, clear of both (it was [0,-3.55]: inside the couch's and the table's collision, the player could not move; tests/interior-spawns.test.cjs)
 // Furniture common to all three styles (same places, so a mission's placed items fit any style). [x0,x1,z0,z1,height]
 const FURN={bed:[2,4,-1.6,.1,.55],nightstand:[3.45,4,.25,.75,.55],closet:[-4,-3.35,-4.7,-2.9,2.2],safe:[-4,-3.45,-2.8,-2.25,.62],desk:[-4,-3.3,-1.7,-.1,.76],
  vending:[-4,-3.15,1.25,2.35,1.95],storage:[-4,-3.4,3.65,4.95,1.9],toilet:[3.45,4,2.55,3.15,.45],couch:[.35,1.2,-3.7,-1.85,.45],table:[-.75,-.05,-3.25,-2.3,.42],shower:[2.9,4,4,5,2.1],sink:[1.5,1.95,3.2,3.9,.85]};
 // Seats on the couch (local [x, z, yaw facing]): for NPCs later (and a sit prompt when the game has one for the player).
 const SEATS=[[.72,-3.3,-Math.PI/2],[.72,-2.25,-Math.PI/2]];
 // The advertisement screen on the wall across from the couch (rundown and normal only; the owner, 19 Nov 2026): the city's own ad feed (ad-screens.js), on by default,
 // switched off and on by the player (TURN SCREEN OFF / ON). slot: a stable id per style, for missions later.
 const AD_SCREEN={x:-4,y:1.38,z:-2.3,w:.62,styles:['rundown','normal','container-rundown','container-regular'],slot:{rundown:'apt-rundown-adscreen',normal:'apt-normal-adscreen','container-rundown':'apt-container-rundown-adscreen','container-regular':'apt-container-regular-adscreen'}};
 const SCREEN_STYLES=AD_SCREEN.styles;
 const PANEL={x:-2,z:-5,y:1.45},SWITCH={x:.95,z:-5,y:1.35};
 // The interactions in the apartment (action names apartment-integration.js handles). position: local [x, y, z].
 const APT_INTERACTIONS=[
  {id:'apt-exit',label:'LEAVE THE APARTMENT',position:[0,1.7,-4.45],action:'apt-exit',range:1.6},
  {id:'apt-lights',label:'LIGHTS',position:[SWITCH.x,1.5,-4.55],action:'apt-use',object:'lights',range:1.3},
  {id:'apt-panel',label:'UTILITY PANEL',position:[PANEL.x,1.5,-4.55],action:'apt-use',object:'panel',range:1.4},
  {id:'apt-closet',label:'CLOSET',position:[-3,1.4,-3.8],action:'apt-use',object:'closet',range:1.6},
  {id:'apt-safe',label:'SAFE',position:[-3.1,1,-2.52],action:'apt-use',object:'safe',range:1.4},
  {id:'apt-computer',label:'COMPUTER',position:[-2.95,1.4,-.9],action:'apt-use',object:'computer',range:1.6},
  {id:'apt-screen',label:'TURN SCREEN OFF',position:[-3.45,1.35,-2.3],action:'apt-use',object:'screen',range:2.2,styles:AD_SCREEN.styles},
  {id:'apt-vending',label:'VENDING',position:[-2.75,1.5,1.8],action:'apt-use',object:'vending',range:1.6}];   // no kitchen (the owner, 19 Nov 2026): a food and drinks vending machine instead
 // The hallway: 22 m x 2.5 m, the street door at the west end, five apartment doors on each side.
 const HALL={x:[-11,11],z:[-1.25,1.25],street:{x:-11,z:0},spawn:[-9.55,0],yaw:Math.PI/2,slots:[-7,-3,1,5,9].flatMap((x,i)=>[{x,z:1.25,side:'n',i:i*2},{x,z:-1.25,side:'s',i:i*2+1}]).sort((a,b)=>a.i-b.i)};
 const slotNumber=(i,style)=>isContainer(style)?1+i:101+i;
 // ---- the container apartment: two joined 40-foot containers (12.2 m x 4.7 m inside), the entry in the south wall, a wet room at the east end ----
 const CAPT={w:12.2,d:4.7,x:[-6.1,6.1],z:[-2.35,2.35],door:{x:-4.5,z:-2.35,w:1},bath:{x:[3.7,6.1],z:[-2.35,2.35],door:[-1.9,-1]},spawn:[-4.5,-.95],yaw:0};
 const CFURN={bed:[1.4,3.6,.8,2.35,.5],nightstand:[1,1.4,1.9,2.35,.5],closet:[-6.1,-5.45,.2,2,2.1],safe:[-6.1,-5.55,-.55,.05,.6],desk:[1.2,2.6,-2.35,-1.7,.76],vending:[-3.9,-2.85,1.6,2.35,1.9],
  storage:[-2.6,-1.7,1.95,2.35,1.8],toilet:[5.5,6.05,-2.05,-1.45,.45],shower:[4.9,6.1,1,2.35,2.1],sink:[3.8,4.25,1.65,2.3,.85],couch:[-1.3,.6,1.65,2.35,.45],table:[-.9,.2,.65,1.3,.42]};
 const CSEATS=[[-.85,1.95,Math.PI],[.15,1.95,Math.PI]];
 const CAD_SCREEN={x:-.35,y:1.38,z:-2.35,w:.62,wall:'s'},CPANEL={x:-3.3,z:-2.35,y:1.45},CSWITCH={x:-3.75,z:-2.35,y:1.35},CAP={x:-5.35,y:1.38,z:-2.35};
 const CAPT_INTERACTIONS=[
  {id:'apt-exit',label:'LEAVE THE APARTMENT',position:[-4.5,1.7,-1.9],action:'apt-exit',range:1.5},
  {id:'apt-lights',label:'LIGHTS',position:[CSWITCH.x,1.5,-1.95],action:'apt-use',object:'lights',range:1.3},
  {id:'apt-panel',label:'UTILITY PANEL',position:[CPANEL.x,1.5,-1.95],action:'apt-use',object:'panel',range:1.4},
  {id:'apt-closet',label:'CLOSET',position:[-5.05,1.4,1.1],action:'apt-use',object:'closet',range:1.6},
  {id:'apt-safe',label:'SAFE',position:[-5.15,1,-.25],action:'apt-use',object:'safe',range:1.4},
  {id:'apt-computer',label:'COMPUTER',position:[1.9,1.4,-1.3],action:'apt-use',object:'computer',range:1.6},
  {id:'apt-screen',label:'TURN SCREEN OFF',position:[-.35,1.35,-1.5],action:'apt-use',object:'screen',range:2.2},
  {id:'apt-vending',label:'VENDING',position:[-3.35,1.5,1.2],action:'apt-use',object:'vending',range:1.6}];
 // ---- the container hallway: joined containers, 13 m x 2.36 m, the street door at the west end, four apartment doors ----
 const CHALL={x:[-6.5,6.5],z:[-1.18,1.18],street:{x:-6.5,z:0},spawn:[-5.05,0],yaw:Math.PI/2,slots:[{x:-2.2,z:1.18,side:'n',i:0},{x:-2.2,z:-1.18,side:'s',i:1},{x:2.8,z:1.18,side:'n',i:2},{x:2.8,z:-1.18,side:'s',i:3}]};
 const CCEIL=2.45,CHALL_CEIL=2.4;
 /* The geometry of a style: the city's set or the containers'. */
 function geo(style){return isContainer(style)?{container:true,APT:CAPT,FURN:CFURN,SEATS:CSEATS,AD_SCREEN:CAD_SCREEN,PANEL:CPANEL,SWITCH:CSWITCH,AP:CAP,APT_INTERACTIONS:CAPT_INTERACTIONS,HALL:CHALL,CEIL:CCEIL,HALL_CEIL:CHALL_CEIL,hallExit:[-5.95,1.7,0]}
  :{container:false,APT,FURN,SEATS,AD_SCREEN,PANEL,SWITCH,AP:{x:-.85,y:1.38,z:-5},APT_INTERACTIONS,HALL,CEIL,HALL_CEIL,hallExit:[-10.45,1.7,0]};}
 // Collision boxes (local): the walls outside the room, the bathroom's two partitions, the furniture.
 const box=(x0,x1,z0,z1,id,h=2.4)=>({id,position:[(x0+x1)/2,h/2,(z0+z1)/2],size:[x1-x0,h,z1-z0]});
 function aptSolids(style){const G=geo(style),APT=G.APT,FURN=G.FURN,T=.3,[X0,X1]=APT.x,[Z0,Z1]=APT.z,B=APT.bath;if(G.container)return [box(X0-T,X1+T,Z0-T,Z0,'apt-wall-s'),box(X0-T,X1+T,Z1,Z1+T,'apt-wall-n'),box(X0-T,X0,Z0,Z1,'apt-wall-w'),box(X1,X1+T,Z0,Z1,'apt-wall-e'),
   box(B.x[0]-.06,B.x[0]+.06,B.z[0],B.door[0],'apt-bath-w1'),box(B.x[0]-.06,B.x[0]+.06,B.door[1],B.z[1],'apt-bath-w2'),...Object.entries(FURN).map(([k,f])=>box(f[0],f[1],f[2],f[3],'apt-'+k,Math.max(.4,f[4])))];
  const out=[box(X0-T,X1+T,Z0-T,Z0,'apt-wall-s'),box(X0-T,X1+T,Z1,Z1+T,'apt-wall-n'),box(X0-T,X0,Z0,Z1,'apt-wall-w'),box(X1,X1+T,Z0,Z1,'apt-wall-e'),
   box(B.x[0]-.06,B.x[0]+.06,B.z[0],B.z[1],'apt-bath-w'),box(B.x[0],B.door[0],B.z[0]-.06,B.z[0]+.06,'apt-bath-s1'),box(B.door[1],B.x[1],B.z[0]-.06,B.z[0]+.06,'apt-bath-s2')];
  for(const [k,f] of Object.entries(FURN))out.push(box(f[0],f[1],f[2],f[3],'apt-'+k,Math.max(.4,f[4])));return out;}
 function hallSolids(style){const H=geo(style).HALL,T=.3,[X0,X1]=H.x,[Z0,Z1]=H.z;return [box(X0-T,X1+T,Z0-T,Z0,'hall-wall-s'),box(X0-T,X1+T,Z1,Z1+T,'hall-wall-n'),box(X0-T,X0,Z0,Z1,'hall-wall-w'),box(X1,X1+T,Z0,Z1,'hall-wall-e')];}
 const W=(p)=>[p[0]+ORIGIN[0],p[1],p[2]+ORIGIN[1]];
 const worldSolid=s=>({...s,position:W(s.position),size:s.size.slice()});
 /* The location records the game walks in (VoidExplorationData.locations[key]): id stays 'neochinatown' (the save location never changes, as with Milked) and
    `private` keeps the player out of the shared street room. key: 'apt-hall-<style>' / 'apt-<style>'. */
 const keyOf=(part,style)=>(part==='hall'?'apt-hall-':'apt-')+style;
 function layout(part,style,opts={}){const st=STYLE_IDS.includes(style)?style:'normal',hall=part==='hall',name=hall?STYLES.find(s=>s.id===st).hall:STYLES.find(s=>s.id===st).name;
  const G=geo(st),HALL=G.HALL,APT=G.APT;
  const interactions=hall?[{id:'hall-exit',label:G.container?'EXIT TO THE YARD':'EXIT TO THE STREET',position:W(G.hallExit),action:'apt-hall-exit',range:1.6},
    ...HALL.slots.map(sl=>({id:'hall-door-'+sl.i,label:'APARTMENT '+slotNumber(sl.i,st),position:W([sl.x,1.7,sl.z>0?(G.container?.6:.7):(G.container?-.6:-.7)]),action:'apt-hall-door',slot:sl.i,range:1.35}))]
   :[...G.APT_INTERACTIONS.filter(i=>!i.styles||i.styles.includes(st)).map(i=>{const x={...i,position:W(i.position)};delete x.styles;return x;}),...(opts.items||[]).map((it,k)=>({id:'apt-item-'+k,label:'LOOK: '+String(it.label||'item').toUpperCase().slice(0,40),position:W([it.x,1.1,it.z]),action:'apt-item',index:k,range:1.3}))];
  const sp=hall?HALL.spawn:APT.spawn;
  return {id:'neochinatown',name:name.toUpperCase(),kind:'city',apartment:true,private:true,part:hall?'hall':'flat',style:st,area:hall?'apartment-hall':'apartment',bounds:BOUNDS.slice(),
   spawn:[sp[0]+ORIGIN[0],1.7,sp[1]+ORIGIN[1]],yaw:hall?HALL.yaw:APT.yaw,color:'#121016',music:'earth',container:G.container,solids:(hall?hallSolids(st):aptSolids(st)).map(worldSolid),interactions,signs:[]};}
 // Where the player stands in the hallway in front of slot i (coming out of an apartment), facing across the corridor.
 const hallFront=(i,style)=>{const H=geo(style).HALL,s=H.slots[i]||H.slots[0];return {spawn:[s.x+ORIGIN[0],1.7,(s.z>0?.4:-.4)+ORIGIN[1]],yaw:s.z>0?Math.PI:0};};
 // Which hallway slot an instance's door is: a stable pick from its mission and id, the next free one when two instances share a street door.
 function hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
 function slotsFor(list,style){const N=geo(style||(list&&list[0]&&list[0].style)).HALL.slots.length,used=new Set(),out={};for(const a of list||[])if(Number.isInteger(a.residenceSlot)&&a.residenceSlot>=0&&a.residenceSlot<N&&!used.has(a.residenceSlot)){used.add(a.residenceSlot);out[a.key||a.id]=a.residenceSlot;}for(const a of list||[]){if(Object.hasOwn(out,a.key||a.id))continue;let i=hash(a.key||((a.mission||'')+'/'+(a.id||a.apt||'')))%N;for(let k=0;k<N&&used.has(i);k++)i=(i+1)%N;used.add(i);out[a.key||a.id]=i;}return out;}
 const residenceKey=(door,slot)=>'residence/'+door+'/'+slot;
 const ACCESS_MODES=['public','locked','mission','item','device','hack'];
 function validAccess(a){return a==null||!!(a&&typeof a==='object'&&!Array.isArray(a)&&Object.keys(a).every(k=>['mode','value'].includes(k))&&ACCESS_MODES.includes(a.mode)&&(['public','locked','hack'].includes(a.mode)?a.value==null||a.value==='':a.mode==='device'?['v1','v2','v3'].includes(a.value):a.mode==='item'?itemIds().includes(a.value):typeof a.value==='string'&&/^[a-z][a-z0-9-]{1,59}$/.test(a.value)));}
 function accessKey(door,slot){return 'apt-access-'+hash(door).toString(36)+'-'+(slot==null?'street':slot);}
 function accessAllows(a,s,key,device){if(!validAccess(a))return false;if(!a||a.mode==='public')return true;if(a.mode==='locked')return false;if(a.mode==='item')return (s?.progression?.personal?.items||[]).includes(a.value);if(a.mode==='device')return device===a.value;if(a.mode==='hack')return s?.story?.flags?.[key]===true;const m=s?.universe?.missions?.[a.value];return !!(m?.acquired||m?.completed);}
 function accessRules(rows){const explicit=rows.filter(Boolean);if(!explicit.length)return {mode:'public'};const first=explicit[0];return explicit.every(a=>a.mode===first.mode&&(a.value||'')===(first.value||''))?first:{mode:'locked'};}
 function residenceSpot(style,i){const g=geo(style),spots=[];for(let z=g.APT.z[0]+.9;z<g.APT.z[1]-.7;z+=.85)for(let x=g.APT.x[0]+.7;x<g.APT.x[1]-.7;x+=.85){if(Math.hypot(x-g.APT.spawn[0],z-g.APT.spawn[1])<1.5||Object.values(g.FURN).some(f=>x>f[0]-.45&&x<f[1]+.45&&z>f[2]-.45&&z<f[3]+.45)||x>g.APT.bath.x[0]-.5&&z>g.APT.bath.z[0]-.5)continue;spots.push([x,z]);}return spots.sort((a,b)=>Math.hypot(a[0],a[1])-Math.hypot(b[0],b[1]))[i]||null;}
 function residenceInstances(chars,lookup=door){const out=new Map(),street=new Map();for(const [id,c] of Object.entries(chars||{})){const r=c?.residence,d=r&&lookup(r.door);if(!d||!['city','container',undefined].includes(d.family)||!STYLE_IDS.includes(d.style)||!Number.isInteger(r.slot)||r.slot<0||r.slot>=geo(d.style).HALL.slots.length)continue;const key=residenceKey(d.id||r.door,r.slot);if(!out.has(key))out.set(key,{key,id:'residence-'+r.slot,mission:null,door:r.door,style:d.style,number:slotNumber(r.slot,d.style),residenceSlot:r.slot,locked:false,items:[],residents:[],rules:[]});const h=out.get(key);h.residents.push(id);h.rules.push(r.apartmentAccess);if(!street.has(r.door))street.set(r.door,[]);street.get(r.door).push(r.streetAccess);}return [...out.values()].map(h=>{const {rules,...rest}=h;return {...rest,apartmentAccess:accessRules(rules),streetAccess:accessRules(street.get(h.door))};});}
 function mergeResidenceInstances(missions,homes){const out=[...(missions||[])];for(const h of homes||[]){const same=out.filter(a=>a.door===h.door);if(same.some(a=>a.modular||a.style!==h.style)||same.length>=geo(h.style).HALL.slots.length)continue;out.push(h);}return out;}
 // Mission apartments occupy dynamically allocated hallway slots, so reserve the entire building, even before the mission starts.
 function addressRegistry(trees,characters){const result=new Map(),row=id=>{if(!result.has(id))result.set(id,{door:id,missions:[],apartments:[],residents:[]});return result.get(id);};for(const t of trees||[])for(const m of t?.missions||[]){const ids=new Set();for(const a of m.apartments||[]){if(!a?.door)continue;ids.add(a.door);const r=row(a.door),numbers=isLoc(a)?a.modules.filter(x=>Number.isInteger(x.number)).map(x=>x.number):Number.isInteger(a.number)?[a.number]:[];const existing=r.apartments.find(x=>x.mission===m.id&&x.id===a.id);if(existing){existing.numbers=[...new Set([...existing.numbers,...numbers])];}else r.apartments.push({mission:m.id,id:a.id,title:m.title||m.id,numbers:[...new Set(numbers)],modular:isLoc(a)});}for(const o of m.objectives||[]){const p=o?.kind==='hack'&&apOf(o.ap);if(p?.door)ids.add(p.door);}for(const id of ids){const r=row(id);if(!r.missions.some(x=>x.id===m.id))r.missions.push({id:m.id,title:m.title||m.id});}}for(const [id,c] of Object.entries(characters||{})){const r=c?.residence;if(r?.door&&Number.isInteger(r.slot)){const x=row(r.door);x.residents.push({id,name:c.name||id,slot:r.slot});}}
  for(const t of trees||[])for(const m of t?.missions||[]){
   const involved=new Set([m.giver,...(m.objectives||[]).map(o=>o?.npc),...(m.cast||[]).map(c=>c?.id)]);
   for(const id of involved){
    const home=characters?.[id]?.residence;
    if(!home?.door||!Number.isInteger(home.slot))continue;
    const r=row(home.door);
    if(r.missions.some(x=>x.id===m.id))continue;
    const associated=r.associatedMissions||=[];
    if(!associated.some(x=>x.id===m.id))associated.push({id:m.id,title:m.title||m.id});
   }
  }
  return result;}

 const entranceLegend={
  mission:{label:'Mission or reservation',colors:['#f4ca43']},
  npc:{label:'NPC residence',colors:['#479eff']},
  player:{label:'Player housing',colors:['#58ca81']},
  shared:{label:'NPC and player housing',colors:['#479eff','#58ca81']},
  commercial:{label:'Commercial property',colors:['#f19c48']},
  available:{label:'Available entrance',colors:['#98a3ae']}
 };
 function entranceType(d,row,players=[]){
  if(row?.missions?.length||row?.associatedMissions?.length)return 'mission';
  if(row?.residents?.length)return players.length?'shared':'npc';
  if(players.length)return 'player';
  return ['office','commercial'].includes(d.family)?'commercial':'available';
 }
 function interiorDoors(trees){
  const records=new Map(),modules=MOD();
  if(!modules)return records;
  for(const t of trees||[])for(const mission of t.missions||[])for(const loc of mission.apartments||[]){
   if(!isLoc(loc)||!loc.door)continue;
   for(const door of modules.analyse(loc).doors){
    if(door.kind==='entry')continue;
    const id=['interior',loc.door,mission.id,loc.id,door.id].join('/');
    records.set(id,{id,entrance:loc.door,mission:mission.id,location:loc.id,door:door.id,name:door.a+' ↔ '+door.b});
   }
  }
  return records;
 }
 function editorDoorPoint(d,point=[d.x,d.z]){
  const areas=node?require('./npc-areas.js'):root.VoidNPCAreas;
  const shift=areas?.SCENE_SHIFT?.[d.scene];
  return {x:point[0]+(shift?.x||0),z:point[1]+(shift?.z||0)};
 }
 function propertyRecord(d,row,players=[]){
  const residential=!['office','commercial'].includes(d.family);
  const units=residential?geo(d.style).HALL.slots.map(({i})=>{
   const number=slotNumber(i,d.style);
   return {id:residenceKey(d.id,i),slot:i,number,
    residents:(row?.residents||[]).filter(r=>r.slot===i),
    players:players.filter(r=>r.slot===i),
    reservations:(row?.apartments||[]).filter(a=>a.numbers.includes(number))};
  }):[];
  return {door:d.id,building:'building/'+d.id,hall:residential?'hall/'+d.id:null,kind:entranceType(d,row,players),units,
   reserved:!!row?.missions?.length,missions:[...(row?.missions||[]),...(row?.associatedMissions||[]).filter(m=>!row?.missions?.some(x=>x.id===m.id))],apartments:row?.apartments||[],residents:row?.residents||[]};
 }
 // Shared read-only address lookup. Neither editor needs to initialize the other.
 async function readAddressRegistry({shipped=[],cached={},readLive,readDraft,readLocal,readProperties,companions={}}={}){
  const trees=[...shipped,...(cached.trees||[])],characters={...(cached.characters||{})};let complete=true;
  const missionSources=new Map(),doorSources=new Map();
  const record=(items,source)=>{for(const tree of items)for(const m of tree.missions||[]){
   if(!missionSources.has(m.id))missionSources.set(m.id,new Set());
   missionSources.get(m.id).add(source);
   for(const id of addressRegistry([{missions:[m]}],{}).keys()){
    const key=id+'/'+m.id;
    if(!doorSources.has(key))doorSources.set(key,new Set());
    doorSources.get(key).add(source);
   }
  }};
  record(trees,'Published');
  const add=(d,source)=>{if(!d)return;record(d.trees||[],source);trees.push(...(d.trees||[]));Object.assign(characters,d.characters||{});};
  try{const live=await readLive();if(!live||live.degraded)complete=false;add(live?.content,'Published');}catch{complete=false;}
  if(readDraft)try{const rec=await readDraft();add(rec?.document?.data?.bundle,'Draft');}catch(e){if(e?.status!==404)complete=false;}
  if(readLocal)try{const d=readLocal();if(d&&d.version!==1)throw Error('Unrecognized draft');add(d,'Local draft');}catch{complete=false;}
  Object.assign(characters,companions);
  const rows=addressRegistry(trees,characters);
  if(readProperties)try{
   const assignments=await readProperties();
   for(const [unit,player] of Object.entries(assignments.units)){
    const [,door,slot]=unit.split('/');
    if(!rows.has(door))rows.set(door,{door,missions:[],apartments:[],residents:[]});
    const row=rows.get(door);(row.players||=[]).push({slot:Number(slot),name:player.name});
   }
  }catch{complete=false;}
  return {rows,complete,missionSources,doorSources,trees};
 }

 // ---------------------------------------------------------------- mission data: checks and the instances open now
 const plain=(v,max)=>typeof v==='string'&&v.trim().length>0&&v.length<=max&&!/[<>]/.test(v);
 const keysOk=(o,keys)=>!!o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).every(k=>keys.includes(k));
 const AX=APT.x,AZ=APT.z;
 /* Problems with a mission's apartments (plain words, empty = fine). m: the mission; doorIds: Set of known door ids (the admin inventory's list on the server). */
 function problems(m,doorIds){const out=[],list=(m&&m.apartments)==null?[]:m.apartments;
  if(!Array.isArray(list)||list.length>LIMIT.perMission){out.push('a mission has at most '+LIMIT.perMission+' apartments.');return out;}
  const ids=new Set(),oids=new Set((m.objectives||[]).map(o=>o&&o.id)),known=doorIds||new Set(doors().map(d=>d.id));
  for(const a of list){const w='apartment “'+((a&&a.id)||'?')+'”';
   if(isLoc(a)){const wl='location “'+(a.id||'?')+'”';if(typeof a.id!=='string'||!INST_ID.test(a.id))out.push(wl+': its name must be lowercase letters, digits and hyphens (24 at most), starting with a letter.');else if(ids.has(a.id))out.push(wl+': two apartments of one mission have the same name.');ids.add(a.id);
    if(typeof a.door!=='string'||!known.has(a.door))out.push(wl+': choose a street door (on the map or from the list).');if(a.from!=null&&a.from!=='start'&&!oids.has(a.from))out.push(wl+': “available from” must be the mission’s start or one of its steps.');
    const M=MOD(),dd=typeof a.door==='string'&&known.has(a.door)?door(a.door):null;if(M)for(const p of M.problems(a,dd?(dd.family||'city'):null))out.push(wl+': '+p);else out.push(wl+': locations cannot be checked here.');continue;}
   if(!keysOk(a,['id','style','door','number','from','items','locked','screenOff','lightsOff'])){out.push(w+' has unknown fields.');continue;}
   if(typeof a.id!=='string'||!INST_ID.test(a.id))out.push(w+': its name must be lowercase letters, digits and hyphens (24 at most), starting with a letter.');else if(ids.has(a.id))out.push(w+': two apartments of one mission have the same name.');ids.add(a.id);
   if(!STYLE_IDS.includes(a.style))out.push(w+': choose a style (rundown, normal, luxury, or a container style for The Outskirts).');
   else if(typeof a.door==='string'&&known.has(a.door)){const dd=door(a.door);if(dd&&(dd.family==='container')!==isContainer(a.style))out.push(w+': '+(isContainer(a.style)?'a container apartment goes behind a door in The Outskirts.':'a city apartment goes behind a city street door, not a container in The Outskirts.'));
    else if(dd&&(dd.family==='office'||dd.family==='commercial'))out.push(w+': an apartment goes behind an apartment-building door, not an office or shop entrance (build a location there instead).');}
   if(typeof a.door!=='string'||!known.has(a.door))out.push(w+': choose a street door (on the map or from the list).');
   if(a.number!=null&&!(Number.isInteger(a.number)&&a.number>=1&&a.number<=LIMIT.number))out.push(w+': the number on its door is a whole number from 1 to 9999.');
   for(const k of ['screenOff','lightsOff'])if(a[k]!=null&&typeof a[k]!=='boolean')out.push(w+': “'+(k==='screenOff'?'screen starts':'lights start')+'” is on or off.');
   if(a.screenOff!=null&&!SCREEN_STYLES.includes(a.style))out.push(w+': only the rundown and normal apartments have an ad screen.');
   if(a.locked!=null&&typeof a.locked!=='boolean')out.push(w+': “hallway door locked until hacked” is yes or no.');
   if(a.from!=null&&a.from!=='start'&&!oids.has(a.from))out.push(w+': “available from” must be the mission’s start or one of its steps.');
   if(a.items!=null){if(!Array.isArray(a.items)||a.items.length>LIMIT.items)out.push(w+': at most '+LIMIT.items+' placed items.');
    else for(const it of a.items){if(!keysOk(it,['type','label','x','z','y'])||!ITEM_TYPES.some(t=>t.id===it.type)||!plain(it.label,LIMIT.label)){out.push(w+': a placed item needs a type and a short label (60 characters, plain text).');continue;}
     const num=v=>typeof v==='number'&&Number.isFinite(v),GA=geo(a.style).APT,ax=GA.x,az=GA.z;if(!num(it.x)||!num(it.z)||it.x<ax[0]+.2||it.x>ax[1]-.2||it.z<az[0]+.2||it.z>az[1]-.2)out.push(w+': a placed item must be inside the apartment (x '+(ax[0]+.2)+'..'+(ax[1]-.2)+', z '+(az[0]+.2)+'..'+(az[1]-.2)+').');
     if(it.y!=null&&!(num(it.y)&&it.y>=0&&it.y<=2.4))out.push(w+': a placed item’s height is 0 to 7.9 ft.');}}}
  const seen=new Set();for(const a of list){if(a&&typeof a.door==='string'){if(seen.has(a.door))out.push('two apartments of one mission use the same street door ('+a.door+').');seen.add(a.door);}}
  for(const o of m.objectives||[]){if(!o||(o.kind!=='apt-enter'&&o.kind!=='apt-use'))continue;if(!ids.has(o.apt))out.push('step '+o.id+': choose one of this mission’s apartments.');
   const la=list.find(x=>x&&x.id===o.apt);if(isLoc(la)){const mm=o.mod!=null?la.modules.find(x=>x&&x.id===o.mod):null;if(o.mod!=null&&!mm)out.push('step '+o.id+': choose one of the location’s rooms (modules).');
    if(o.kind==='apt-use'){if(o.mod==null)out.push('step '+o.id+': choose the room (module) where something is used.');else if(mm){const M=MOD(),objs=M?M.objectsOf(mm.type):[];if(!objs.some(x=>x.id===o.object))out.push('step '+o.id+': choose what is used ('+(objs.map(x=>x.name).join(', ')||'nothing can be used there')+').');}}
    if(o.kind==='apt-enter'&&o.object!=null)out.push('step '+o.id+': only a “use something” step names an object.');continue;}
   if(o.mod!=null)out.push('step '+o.id+': only a location built from modules has rooms to choose.');
   if(o.kind==='apt-use'&&!OBJECT_IDS.includes(o.object))out.push('step '+o.id+': choose what is used (computer, utility panel, safe, vending machine, closet or light switch).');
   if(o.kind==='apt-use'&&o.object==='screen'){const a=list.find(x=>x&&x.id===o.apt);if(a&&!SCREEN_STYLES.includes(a.style))out.push('step '+o.id+': the '+a.style+' apartment has no ad screen.');}
   if(o.kind==='apt-enter'&&o.object!=null)out.push('step '+o.id+': only a “use something” step names an object.');}
  for(const o of m.objectives||[])if(o&&o.kind!=='apt-enter'&&o.kind!=='apt-use'&&(o.apt!=null||o.object!=null||o.mod!=null)&&!((o.kind==='follow-them'||o.kind==='they-follow')&&o.object==null)&&!['sneak','collect','apt-leave'].includes(o.kind))out.push('step '+o.id+': only an apartment step names an apartment.');   // sneak / collect / leave name a place too (mission-mechanics.js checks them)   // a follow step may go into a place (npc-escort.js intoProblems checks it)
  const items=new Set(itemIds());
  for(const o of m.objectives||[]){if(!o)continue;if(o.kind!=='hack'){if(['ap','stay','unlock','needs'].some(k=>o[k]!=null))out.push('step '+o.id+': only a “hack the access point” step names an access point.');continue;}
   const p=apOf(o.ap);if(!p)out.push('step '+o.id+': choose the access point to hack (a street door, or an apartment’s hallway door or entry).');else if(p.door&&!known.has(p.door))out.push('step '+o.id+': that street door does not exist.');else if(p.apt&&!ids.has(p.apt))out.push('step '+o.id+': choose one of this mission’s apartments.');
   else if(p.apt){const la=list.find(x=>x&&x.id===p.apt);if(p.mod&&!(isLoc(la)&&MOD()&&MOD().hackable(la,p.mod+'.'+p.sock)))out.push('step '+o.id+': choose a door of that location (a door between two rooms, a connection or its entrance).');else if(p.part&&isLoc(la))out.push('step '+o.id+': choose one of the location’s doors.');}
   if(o.hold!=null&&!(Number.isInteger(o.hold)&&o.hold>=HACK.min&&o.hold<=HACK.max))out.push('step '+o.id+': the hack takes a whole number of seconds from '+HACK.min+' to '+HACK.max+'.');
   for(const k of ['stay','unlock'])if(o[k]!=null&&typeof o[k]!=='boolean')out.push('step '+o.id+': “'+(k==='stay'?'fails if the player walks away':'opens the door')+'” is yes or no.');
   if(o.needs!=null&&!items.has(o.needs))out.push('step '+o.id+': the player can only need an item the game has ('+[...items].join(', ')+').');}
  return out;}
 /* The apartment instances open for this player now: [{key ('<mission>/<id>'), mission, id, style, door, number, items, title}]. A tree mission that is taken and not
    done; from 'start' (default) or from the moment the step named in `from` is reached (every step before it done) until the mission ends. Draft play uses the same rule. */
 function openNow(s,trees){const out=[];if(!s||!s.universe||!Array.isArray(trees))return out;const recs=s.universe.missions||{};
  for(const t of trees)for(const m of (t&&t.missions)||[]){if(!Array.isArray(m.apartments)||!m.apartments.length)continue;const rec=recs[m.id];if(!rec||!rec.acquired||rec.completed)continue;
   const done=(rec.objectives)||{};for(const a of m.apartments){if(!a||!a.door)continue;const M=MOD();
    if(a.from&&a.from!=='start'){const k=(m.objectives||[]).findIndex(o=>o.id===a.from);if(k<0)continue;if(!(m.objectives||[]).slice(0,k).every(o=>done[o.id]===true))continue;}
    if(isLoc(a)){if(!M)continue;const hk=(m.objectives||[]).filter(o=>o.kind==='hack'&&(o.feed?o.unlock===true:o.unlock!==false)&&done[o.id]===true&&typeof o.ap==='string'&&o.ap.startsWith(a.id+'/')&&o.ap.includes('.')).map(o=>o.ap.slice(a.id.length+1));
     out.push({key:m.id+'/'+a.id,mission:m.id,id:a.id,door:a.door,modular:true,loc:M.strip(a),hacked:hk,title:m.title||m.id});continue;}
    const hacked=(m.objectives||[]).some(o=>o.kind==='hack'&&(o.feed?o.unlock===true:o.unlock!==false)&&o.ap===a.id+'/hall'&&done[o.id]===true);
    out.push({key:m.id+'/'+a.id,mission:m.id,id:a.id,style:a.style,door:a.door,number:Number.isInteger(a.number)?a.number:null,locked:a.locked===true&&!hacked,screenOff:a.screenOff===true,lightsOff:a.lightsOff===true,items:Array.isArray(a.items)?a.items.map(i=>({...i})):[],title:m.title||m.id});}}
  return out;}
 /* Street doors a hack opened for this player (a taken, unfinished mission whose hack step on that door is done, with unlock not switched off): [{door, mission}]. */
 function hackedDoors(s,trees){const out=[];if(!s||!s.universe||!Array.isArray(trees))return out;const recs=s.universe.missions||{};
  for(const t of trees)for(const m of (t&&t.missions)||[]){const rec=recs[m.id];if(!rec||!rec.acquired||rec.completed)continue;for(const o of m.objectives||[]){const p=o.kind==='hack'&&(o.feed?o.unlock===true:o.unlock!==false)&&(rec.objectives||{})[o.id]===true?apOf(o.ap):null;if(p&&p.door)out.push({door:p.door,mission:m.id});}}
  return out;}
 /* The hack steps in progress now: [{key, mission, step, ap, hold, stay, unlock, needs}]: the access point the player may hack (live-content.js / apartment-integration.js). */
 /* The street doors IN USE for this player (the owner, 20 Nov 2026: "doors on the streets without anything placed on them shouldn't show the option to open it when walking by"):
    a mission that is taken and not done has an apartment or a location on it (whether its "available from" step is reached or not), a hack step aims at it (its access point),
    or a hack opened it. Only these show their prompts (the door, its access point) and their fire escape window. -> Set of street door ids. */
 function doorsInUse(s,trees){const out=new Set();if(!s||!s.universe||!Array.isArray(trees))return out;const recs=s.universe.missions||{};
  for(const t of trees)for(const m of (t&&t.missions)||[]){const rec=recs[m.id];if(!rec||!rec.acquired||rec.completed)continue;for(const a of m.apartments||[])if(a&&typeof a.door==='string')out.add(a.door);
   for(const o of m.objectives||[]){const p=o&&o.kind==='hack'?apOf(o.ap):null;if(p&&p.door)out.add(p.door);}}
  return out;}
 function hacksNow(s,trees){const out=[];if(!s||!s.universe||!Array.isArray(trees))return out;const recs=s.universe.missions||{};
  for(const t of trees)for(const m of (t&&t.missions)||[]){const rec=recs[m.id];if(!rec||!rec.acquired||rec.completed)continue;const o=(m.objectives||[]).find(x=>(rec.objectives||{})[x.id]!==true);
   if(o&&o.kind==='hack'&&o.ap){const x={key:m.id+'/'+o.id,mission:m.id,step:o.id,ap:o.ap,hold:Number.isInteger(o.hold)?o.hold:HACK.def,stay:o.stay!==false,unlock:(o.feed?o.unlock===true:o.unlock!==false)};if(o.needs)x.needs=o.needs;if(o.feed)x.feed=o.feed;out.push(x);}}
  return out;}
 const onDoor=(list,doorId)=>(list||[]).filter(a=>a.door===doorId);
 // The content export (mission-content.js treeStrip): only the known fields, numbers rounded.
 function strip(list){if(!Array.isArray(list))return null;const out=[];for(const a of list.slice(0,LIMIT.perMission)){if(isLoc(a)){if(a.door&&INST_ID.test(a.id||'')&&MOD())out.push(MOD().strip(a));continue;}if(!a||!INST_ID.test(a.id||'')||!STYLE_IDS.includes(a.style)||!a.door)continue;const x={id:a.id,style:a.style,door:a.door};
  if(Number.isInteger(a.number)&&a.number>=1&&a.number<=LIMIT.number)x.number=a.number;if(a.locked===true)x.locked=true;if(a.screenOff===true&&SCREEN_STYLES.includes(a.style))x.screenOff=true;if(a.lightsOff===true)x.lightsOff=true;if(a.from&&a.from!=='start')x.from=a.from;
  const its=(a.items||[]).filter(i=>i&&ITEM_TYPES.some(t=>t.id===i.type)&&plain(i.label,LIMIT.label)).slice(0,LIMIT.items).map(i=>{const y={type:i.type,label:i.label.trim(),x:r2(Number(i.x)||0),z:r2(Number(i.z)||0)};if(Number.isFinite(i.y))y.y=r2(i.y);return y;});if(its.length)x.items=its;out.push(x);}
  return out.length?out:null;}
 // The admin inventory: what the server checks a published mission against.
 function inventory(){return {hack:{...HACK},items:itemIds(),styles:STYLE_IDS.slice(),objects:OBJECT_IDS.slice(),itemTypes:ITEM_TYPES.map(t=>t.id),limit:{...LIMIT},bounds:{x:AX.slice(),z:AZ.slice()},boundsByStyle:Object.fromEntries(STYLE_IDS.map(st=>[st,{x:geo(st).APT.x.slice(),z:geo(st).APT.z.slice()}])),containerStyles:CONTAINER_STYLES.slice(),screenStyles:SCREEN_STYLES.slice(),
  doors:Object.fromEntries(doors().map(d=>[d.id,{quarter:d.quarter,style:d.style,number:d.number,x:d.x,z:d.z,family:d.family||'city'}]))};}
 const PATCH_SHIFT={open:600,breakStart:840,breakEnd:900,close:120,x:49.8,z:-79.9,yaw:Math.PI*.5,greetingCooldown:60};
 const api={PATCH_SHIFT,DOOR,CONTAINER_STYLES,isContainer,geo,containerDoors,CAPT,CFURN,CHALL,STYLES,STYLE_IDS,OBJECTS,OBJECT_IDS,ITEM_TYPES,LIMIT,INST_ID,EDGES,KEEP_OUT,SEG,ORIGIN,BOUNDS,CEIL,HALL_CEIL,APT,FURN,SEATS,AD_SCREEN,PANEL,SWITCH,HALL,APT_INTERACTIONS,STREET_NAMES,
  HACK,apOf,hackedDoors,hacksNow,doorsInUse,itemIds,blockedWhy,styleAt,doors,door,doorsIn,pickupPosition,nearestDoor,keyOf,layout,hallFront,slotsFor,slotNumber,residenceKey,residenceSpot,residenceInstances,mergeResidenceInstances,addressRegistry,ACCESS_MODES,validAccess,accessAllows,accessKey,problems,openNow,onDoor,strip,inventory,world:W,
  readAddressRegistry,interiorDoors,editorDoorPoint,propertyRecord,entranceType,entranceLegend,reset(){cache=null;}};
 if(node){module.exports=api;return;}
 root.VoidApartments=Object.assign(root.VoidApartments||{},api);
})(typeof globalThis!=='undefined'?globalThis:this);
