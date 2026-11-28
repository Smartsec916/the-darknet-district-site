/* Stable location IDs and route policy shared by campaign, saves and HUD. */
(function(root){
 const progression=typeof module!=='undefined'?require('./progression.js'):root.VoidProgression;
 const systems={erebus:{name:'Erebus System',hub:'meridian',ownerFaction:null,securityFaction:'erebus-local',populationPool:[],shopPool:[],missionPool:[]},sol:{name:'Tessaly System',hub:'sol-belt',ownerFaction:null,securityFaction:'sol-local',populationPool:[],shopPool:[],missionPool:[]},
  // Faction territory. Each system opens when the player accepts its District delivery.
  communion:{name:'Cantor System',hub:'vigil',ownerFaction:'communion',securityFaction:'communion',populationPool:[],shopPool:[],missionPool:[]},'natural-order':{name:'Garrow System',hub:'holdfast',ownerFaction:'natural-order',securityFaction:'natural-order',populationPool:[],shopPool:[],missionPool:[]},
  // Stale System (owner's request 27 Nov 2026): one location, Low Quay. Not discovered by any story step; reached with the Dev Tools jump until a mission opens it.
  stale:{name:'Stale System',hub:'low-quay',ownerFaction:null,securityFaction:'neutral',populationPool:[],shopPool:[],missionPool:[]}};
 const locations={
  vesper:{system:'erebus',surface:true,name:'Vesper',district:'WARD FREIGHT WORKSHOP',color:'#c2a584',bar:'Workshop'},
  meridian:{system:'erebus'},kepler:{system:'erebus'},rusthaven:{system:'erebus'},foundry:{system:'erebus'},
  'sol-belt':{system:'sol',name:'Tessaly Belt Anchorage',district:'TESSALY / ASTEROID BELT',color:'#8dbea9',bar:'Belt Canteen'},
  earth:{system:'sol',surface:true,name:'NeoChinatown',district:'TESSALY / CITY LANDING',color:'#9b7bff',bar:'The Darknet District'},
  mars:{system:'sol',surface:true,name:'Vantor / Underground City',district:'TESSALY / SUBSURFACE ACCESS',color:'#ba6847',bar:'Transit Canteen'},
  vigil:{system:'communion',name:'The Vigil',district:'CANTOR / COMMUNION STATION',color:'#9fd2ec',bar:'Refectory',ownerFaction:'communion',securityFaction:'communion'},
  holdfast:{system:'natural-order',name:'Holdfast',district:'GARROW / NATURAL ORDER OUTPOST',color:'#d08a3c',bar:'Mess Hall',ownerFaction:'natural-order',securityFaction:'natural-order'},
  // Faction homeworlds (doc 10): open when the homeworld offer is accepted. The Natural Order world has no name yet.
  nexus:{system:'communion',name:'The Nexus',district:'CANTOR / COMMUNION HOMEWORLD',color:'#8fd4ee',bar:'Aid Station',ownerFaction:'communion',securityFaction:'communion',planet:true},
  // Low Quay: a landing pad raised on viaducts over dark water at the edge of a quay city (void-runner/low-quay.js). Always night. District text PROPOSED.
  'low-quay':{system:'stale',surface:true,name:'Low Quay',district:'STALE / QUAY LANDING',color:'#5fb4c8',bar:'Quay Canteen',ownerFaction:null,securityFaction:'neutral'},
  'order-homeworld':{system:'natural-order',name:'Natural Order Homeworld',district:'GARROW / NATURAL ORDER HOMEWORLD (NAME PENDING)',color:'#c9a24a',bar:'Cooperative Hall',ownerFaction:'natural-order',securityFaction:'natural-order',planet:true}
 };
 // Flight destinations retain their save IDs. Planet and settlement IDs identify geography
 // independently of the pad that the pilot targets or the name an editor displays.
 const planets={
  vesper:{name:'Vesper',pad:'vesper',settlement:'Ward Freight Workshop',facility:'Workshop Yard',facilityProvisional:true,orbital:'vesper-relay'},
  'cinder-ring':{name:'Cinder Ring',provisional:true,pad:'cinder-landing',settlement:'Ring Survey Site',settlementProvisional:true,facility:'Survey Landing',facilityProvisional:true,orbital:'meridian'},
  servo:{name:'Servo',pad:'earth',settlement:'NeoChinatown',facility:'The Port — Pad 01',orbital:'servo-orbital'},
  vantor:{name:'Vantor',pad:'mars',settlement:'Underground City',facility:'Pressure Control Landing Pad',facilityProvisional:true,orbital:'vantor-relay'},
  nexus:{name:'The Nexus',pad:'nexus',settlement:'Fractured Circuit',settlementProvisional:true,facility:'Synapse Port',facilityProvisional:true,orbital:'vigil'},
  'order-homeworld':{name:'Eden Prime',provisional:true,pad:'order-homeworld',settlement:'Haven’s Reach',settlementProvisional:true,facility:'Harvest Landing',facilityProvisional:true,orbital:'holdfast'}
 };
 Object.assign(locations,{
  'vesper-relay':{system:'erebus',name:'Vesper Relay',type:'station',placeholder:true},
  'servo-orbital':{system:'sol',name:'Servo Orbital Exchange',type:'station',placeholder:true},
  'vantor-relay':{system:'sol',name:'Vantor Relay',type:'station',placeholder:true},
  'cinder-landing':{system:'erebus',name:'Survey Landing',surface:true,placeholder:true}
 });
 const bearings={vesper:-105,meridian:-64,kepler:35,rusthaven:-20,foundry:70,'vesper-relay':6,'cinder-landing':100,
  earth:-64,mars:35,'sol-belt':-20,'servo-orbital':6,'vantor-relay':70,nexus:35,vigil:-64,holdfast:-64,'order-homeworld':35,
  'erebus-arrival':128,'sol-arrival':158,'communion-arrival':188,'natural-order-arrival':218,'low-quay':35,'stale-arrival':248};
 for(const [id,world] of Object.entries(planets)){
  world.settlementId=id+'-settlement';world.facilityId=id+'-pad';
  const pad=locations[world.pad],station=locations[world.orbital];
  world.system=pad.system;
  pad.parentPlanet=id;pad.type='pad';station.parentPlanet=id;
 }
 for(const [id,region] of Object.entries(systems)){
  region.arrival=id+'-arrival';
  locations[region.arrival]={name:region.name+' Arrival',system:id,type:'arrival',color:'#abc4d1',
   ownerFaction:region.ownerFaction,securityFaction:region.securityFaction};
 }
 for(const [id,place] of Object.entries(locations)){
  place.bearing=bearings[id]*Math.PI/180;
  place.testable=true;place.status=place.placeholder?'Functional placeholder':'Existing';
  if(place.placeholder)place.awaiting=['custom assets','NPCs','missions'];
  place.missionDestination=place.type!=='arrival'&&!place.placeholder;
  place.type??=id==='sol-belt'?'anchorage':'station';
  if(place.placeholder)place.color??='#a9b8bd';
 }
 for(const location of Object.values(locations)){location.ownerFaction??=null;location.securityFaction??=location.system==='sol'?'sol-local':'erebus-local';}
 function system(id){return locations[id]?.system||'erebus';}
 // Planetside locations (on the ground, not docked in space): departures from them warp up into the sky.
 function planetside(id){const l=locations[id];return !!(l&&(l.surface||l.planet));}
 // Risk increases by region and is sampled reproducibly for the same route and campaign checkpoint.
 const threatBands={sol:{tier:0,chance:.20,enemies:1},erebus:{tier:1,chance:.38,enemies:2},communion:{tier:2,chance:.62,enemies:3},'natural-order':{tier:2,chance:.62,enemies:3},stale:{tier:3,chance:.80,enemies:4}};
 function routeThreat(origin,destination,completed=0){
  const band=threatBands[system(destination)]||threatBands.sol;
  const routeKey=origin+'>'+destination+'#'+Math.max(0,Math.floor(completed||0));
  let hash=2166136261;
  for(const char of routeKey)hash=Math.imul(hash^char.charCodeAt(0),16777619);
  hash=Math.imul(hash^(hash>>>16),0x45d9f3b);
  const encounter=((hash^(hash>>>16))>>>0)/4294967296<band.chance;
  return {tier:band.tier,enemies:route(origin,destination).interdiction&&encounter?band.enemies:0};
 }
 function route(a,b){const interstellar=system(a)!==system(b);return {kind:interstellar?'interstellar':'local',seconds:progression.tuning.jump[interstellar?'interstellar':'local'],interdiction:!interstellar};}
 function fresh(){return {currentSystem:'erebus',discoveredSystems:['erebus'],discoveredLocations:['vesper','meridian'],visitedLocations:['vesper'],missionLogUnlocked:false,freeTravel:false,trackedMission:null,trackingInitialized:false,autoTrack:true,missions:{},completedObjectives:[],station:null};}
 function restore(raw={},state={}){const out={...fresh()},valid=xs=>Array.isArray(xs)?[...new Set(xs.filter(x=>Object.hasOwn(locations,x)))]:[];
  out.currentSystem=system(state.location);out.discoveredLocations=[...new Set([...out.discoveredLocations,...valid(raw.discoveredLocations),state.location].filter(Boolean))];out.visitedLocations=[...new Set([...out.visitedLocations,...valid(raw.visitedLocations),state.location].filter(Boolean))];
  // Earlier saves already received Rook's voucher; migrate its world unlock once.
  out.missionLogUnlocked=raw.missionLogUnlocked===true||state.progression?.opening?.pistol===true||state.missileOfferSeen===true||state.quest!=='inheritance';out.freeTravel=state.progression?state.progression.completed===true||raw.freeTravel===true:out.missionLogUnlocked;
  out.trackedMission=typeof raw.trackedMission==='string'?raw.trackedMission:null;
  out.trackingInitialized=raw.trackingInitialized===true||out.trackedMission!==null;
  // Only an explicit Untrack turns off automatic tracking of the next mission.
  out.autoTrack=raw.autoTrack!==false;
  for(const [id,entry] of Object.entries(raw.missions||{}).slice(0,100))if(/^[a-z][a-z0-9-]{0,79}$/.test(id)&&entry?.acquired===true){
   const objectives={};for(const [key,value] of Object.entries(entry.objectives||{}).slice(0,100))if(/^[a-z][a-z0-9-]{0,79}$/.test(key)&&value===true)objectives[key]=true;
   out.missions[id]={acquired:true,completed:entry.completed===true,objectives};
  }
  out.completedObjectives=Array.isArray(raw.completedObjectives)?raw.completedObjectives.filter(x=>typeof x==='string'&&x.length<80).slice(0,200):[];
  if(state.quest==='open')out.discoveredLocations=[...new Set([...out.discoveredLocations,'kepler','rusthaven','foundry'])];
  if(out.freeTravel)out.discoveredLocations=[...new Set([...out.discoveredLocations,'sol-belt','earth','mars'])];
  // Known systems follow known locations, so a newly opened faction system survives a reload.
  out.discoveredSystems=[...new Set(['erebus',...(out.freeTravel?['sol']:[]),...out.discoveredLocations.map(system)])];
  if(raw.station?.location===state.location)out.station={location:state.location};return out;
 }
 function unlock(s){const travel=s.progression?.completed===true||s.progression?.flags?.missileFired===true||s.missileOfferSeen===true||s.universe?.freeTravel===true;s.universe=restore({...s.universe,missionLogUnlocked:true,freeTravel:travel},s);if(travel&&!s.universe.trackingInitialized&&!s.universe.trackedMission)s.universe.trackedMission='meet-admin';}
 function visit(s){const u=s.universe;u.currentSystem=system(s.location);for(const key of ['visitedLocations','discoveredLocations'])if(!u[key].includes(s.location))u[key].push(s.location);if(!u.discoveredSystems.includes(u.currentSystem))u.discoveredSystems.push(u.currentSystem);u.station=locations[s.location]?.type==='arrival'?null:{location:s.location};}
 function discover(s,id){const u=s.universe;if(!Object.hasOwn(locations,id))return false;if(!u.discoveredLocations.includes(id))u.discoveredLocations.push(id);if(!u.discoveredSystems.includes(system(id)))u.discoveredSystems.push(system(id));return true;}
 function destinations(s){const u=s.universe||fresh();const here=system(s.location);
  const local=u.discoveredLocations.filter(id=>id!==s.location&&system(id)===here&&locations[id]?.type!=='arrival');
  const reachable=new Set(u.discoveredLocations.map(system));
  return [...new Set(local),...[...reachable].filter(id=>id!==here).map(id=>systems[id].arrival)];}
 function nextHop(origin,target){return system(origin)===system(target)?target:systems[system(target)].arrival;}
 const api={systems,locations,planets,system,planetside,route,routeThreat,threatBands,fresh,restore,unlock,visit,discover,destinations,nextHop};if(typeof module!=='undefined')module.exports=api;else root.VoidUniverse=api;
})(globalThis);
