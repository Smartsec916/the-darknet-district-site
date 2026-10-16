/* Campaign mission state and navigation. Existing progression flags remain the
   authority for tutorial actions; the log never infers them from later travel. */
(function(root){
 const U=typeof module!=='undefined'?require('./universe.js'):root.VoidUniverse;
 const P=typeof module!=='undefined'?require('./progression.js'):root.VoidProgression;
 // Ground lessons on Vesper. Optional practice is listed but never blocks the ship.
 const ground=[
  ['recording','Play Elias’s recording'],['receive-gun','Receive Elias’s pistol from Mara'],
  ['move','Move through the workshop'],['look','Look around'],['sprint','Run',false],['jump','Jump',false],
  ['draw','Draw the pistol'],['aim','Aim down the sights'],['fire','Fire at a can'],['reload','Reload'],
  ['groundCombat','Knock down four practice cans']
 ];
 // The Vesper practice circuit. It is flown before the Meridian run and is separate from it.
 const training=[
  ['board','Board the Kestrel'],['throttle','Use throttle and braking'],
  ['steer','Pitch and yaw the ship'],['roll','Roll the ship'],['navigation','Align with the training beacon'],
  ['jumpTravel','Complete a short in-system jump'],['dock','Land the Kestrel']
 ];
 const station=[
  ['shipInventory','Inspect your ship inventory at the maintenance terminal'],['hangar','Open hangar maintenance'],
  ['moduleInstalled','Install the Ward cooling loop'],['vendor','Visit the ship outfitter'],
  ['modulePurchased','Buy a ship module'],['purchasedInstalled','Install the module you bought']
 ];
 const combat=[
  ['laserCombat','Fire your lasers in combat'],['missileSelected','Claim and install Rook’s missile launcher'],
  ['targetSelected','Select a hostile target'],['missileLocked','Acquire a missile lock'],['missileFired','Fire a locked missile']
 ];
 const objectives=list=>list.map(([id,label,required])=>({id,label:required===false?label+' (optional)':label,...(required===false?{required:false}:{})}));
 const trainingIds=training.map(([id])=>id),groundIds=ground.map(([id])=>id),stationIds=station.map(([id])=>id),combatIds=combat.map(([id])=>id);
 const tutorials=['ground-training','flight-training','first-station','combat-qualification'];
 const definitions={
  'ground-training':{title:'GROUND TRAINING',type:'tutorial',description:'Mara walks you through Elias’s workshop and his old pistol.',giver:'Mara',source:'story',start:'vesper',end:'vesper',destination:'vesper',objectives:objectives(ground)},
  'flight-training':{title:'FLIGHT TRAINING',type:'tutorial',description:'One practice circuit over Vesper: get a feel for the Kestrel, jump to the training beacon and land back on Mara’s pad.',giver:'Mara',source:'story',start:'vesper',end:'vesper',destination:'vesper',completion:{event:'training-actions'},objectives:objectives(training)},
  'meet-rook':{title:'CARGO DELIVERY / MEET ROOK',type:'main',description:'Take the Kestrel to Meridian Station and meet Rook to begin the cargo campaign.',giver:'Mara',source:'story',start:'vesper',end:'meridian',destination:'meridian',interaction:'rook',objectives:[
   {id:'instructions',label:'Receive Mara’s instructions'}, {id:'travel',label:'Travel to Meridian Station'},
   {id:'dock',label:'Dock at Meridian Station'}, {id:'enter',label:'Enter the station'},
   {id:'locate',label:'Locate Rook'}, {id:'speak',label:'Speak with Rook'}]},
  'first-station':{title:'FIRST STATION / OUTFITTING',type:'tutorial',description:'Learn the hangar maintenance terminal and the ship outfitter. Any station with a hangar will do.',giver:'Rook',source:'story',objectives:objectives(station)},
  'combat-qualification':{title:'COMBAT QUALIFICATION',type:'tutorial',description:'Rook wants proof you can defend a hold. After two combat runs, claim the launcher voucher at the outfitter.',giver:'Rook',source:'story',objectives:objectives(combat)},
  'legal-run':{title:'AN HONEST LIVING',type:'cargo',description:'Deliver water filtration parts to Kepler.',giver:'Rook',destination:'kepler',rewards:350,objectives:[{id:'arrive',label:'Deliver the filters and dock at Kepler'}]},
  'return':{title:'BACK TO THE DEAD CHANNEL',type:'main',description:'Return to Meridian with the completed delivery.',giver:'Rook',destination:'meridian',objectives:[{id:'arrive',label:'Dock at Meridian Station'}]},
  'illegal-run':{title:'NO QUESTIONS ASKED',type:'cargo',description:'Deliver unregistered memory wafers to Rusthaven.',giver:'Rook',destination:'rusthaven',rewards:800,objectives:[{id:'arrive',label:'Deliver the wafers and dock at Rusthaven'}]},
  'meet-admin':{title:'MEET ADMIN',type:'main',description:'Find Rook’s contact in NeoChinatown, Tessaly.',giver:'Rook',source:'story',start:'meridian',end:'earth',completion:{event:'talk',interaction:'admin'},destination:'earth',interaction:'tdd',objectives:[{id:'meet-admin',label:'Find Admin at The Darknet District, NeoChinatown'}]},
  // The District's faction deliveries. After handing over the cargo the goal moves back to Iris.
  'admin-sealed-cargo-01':{title:'DON’T ASK QUESTIONS',type:'cargo',description:'A sealed container from Admin for Rook at Meridian. It stays sealed.',giver:'The Darknet District',source:'story',start:'earth',end:'meridian',destination:'meridian',interaction:'rook',rewards:1800,objectives:[{id:'arrive',label:'Fly the crate to Meridian, Erebus System'},{id:'deliver',label:'Hand the crate to Rook'}]},
  'communion-delivery':{title:'COMMUNION DELIVERY',type:'cargo',description:'Advanced electronics and research equipment for Dr. Elara Voss at The Vigil, Cantor System. Payment is collected at The Darknet District.',giver:'The Darknet District',source:'story',start:'earth',end:'earth',destination:'vigil',interaction:'elara',rewards:1200,after:{deliver:{destination:'earth',interaction:'district-iris'}},objectives:[{id:'arrive',label:'Fly the cargo to The Vigil, Cantor System'},{id:'deliver',label:'Deliver the equipment to Dr. Elara Voss'},{id:'payment',label:'Return to The Darknet District and collect payment'}]},
  'order-delivery':{title:'NATURAL ORDER DELIVERY',type:'cargo',description:'Mechanical components and industrial supplies for Marcus Vale at Holdfast, Garrow System. Payment is collected at The Darknet District.',giver:'The Darknet District',source:'story',start:'earth',end:'earth',destination:'holdfast',interaction:'marcus',rewards:1200,after:{deliver:{destination:'earth',interaction:'district-iris'}},objectives:[{id:'arrive',label:'Fly the cargo to Holdfast, Garrow System'},{id:'deliver',label:'Deliver the components to Marcus Vale'},{id:'payment',label:'Return to The Darknet District and collect payment'}]},
  // Iris's follow-up contracts (doc 09).
  'communion-supply':{title:'COMMUNION SUPPLY CONTRACT',type:'cargo',description:'Advanced processing modules, high-precision sensor assemblies and specialized research electronics for Dr. Elara Voss at The Vigil, Cantor System. Payment is collected from Iris at The Darknet District.',giver:'Iris',source:'story',start:'earth',end:'earth',destination:'vigil',interaction:'elara',rewards:1500,after:{deliver:{destination:'earth',interaction:'district-iris'}},objectives:[{id:'arrive',label:'Fly the cargo to The Vigil, Cantor System'},{id:'deliver',label:'Deliver the shipment to Dr. Elara Voss'},{id:'payment',label:'Return to The Darknet District and collect payment'}]},
  'order-supply':{title:'NATURAL ORDER SUPPLY CONTRACT',type:'cargo',description:'Industrial control assemblies, heavy-duty mechanical components, and replacement machinery and repair equipment for Marcus Vale at Holdfast, Garrow System. Payment is collected from Iris at The Darknet District.',giver:'Iris',source:'story',start:'earth',end:'earth',destination:'holdfast',interaction:'marcus',rewards:1500,after:{deliver:{destination:'earth',interaction:'district-iris'}},objectives:[{id:'arrive',label:'Fly the cargo to Holdfast, Garrow System'},{id:'deliver',label:'Deliver the shipment to Marcus Vale'},{id:'payment',label:'Return to The Darknet District and collect payment'}]},
  // Homeworld missions: placeholders awaiting David's design. No destination, rewards or completion.
  // Homeworld deliveries and planetary work (doc 10). Objectives can name their own place and interaction.
  'communion-origin-mission-01':{title:'DELIVERY TO THE NEXUS',type:'cargo',description:'Dr. Elara Voss is sending supplies down to the Communion homeworld. Deliver them to Dr. Adrian Kess on The Nexus, Cantor System.',giver:'Dr. Elara Voss',source:'story',start:'vigil',end:'nexus',destination:'nexus',interaction:'kess',objectives:[{id:'cargo',label:'Collect the shipment from Dr. Elara Voss',destination:'vigil',interaction:'elara'},{id:'arrive',label:'Fly the shipment to The Nexus'},{id:'deliver',label:'Deliver it to Dr. Adrian Kess'}]},
  'natural-order-origin-mission-01':{title:'DELIVERY TO THE NATURAL ORDER HOMEWORLD',type:'cargo',description:'Marcus Vale is sending supplies down to the Natural Order homeworld. Deliver them to Daniel Mercer, Garrow System.',giver:'Marcus Vale',source:'story',start:'holdfast',end:'order-homeworld',destination:'order-homeworld',interaction:'mercer',objectives:[{id:'cargo',label:'Collect the shipment from Marcus Vale',destination:'holdfast',interaction:'marcus'},{id:'arrive',label:'Fly the shipment to the Natural Order homeworld'},{id:'deliver',label:'Deliver it to Daniel Mercer'}]},
  'communion-restoration-01':{title:'HELPING HANDS',type:'side',description:'Dr. Adrian Kess needs help keeping The Nexus running: medical supplies, a damaged relay junction and a power terminal. Reward: a Communion Targeting Scanner.',giver:'Dr. Adrian Kess',source:'story',start:'nexus',end:'nexus',destination:'nexus',interaction:'kess',objectives:[{id:'supplies-collect',label:'Collect medical supplies from the storage depot',interaction:'nexus-depot'},{id:'supplies',label:'Deliver the supplies to the aid station',interaction:'nexus-aid'},{id:'repair',label:'Repair the damaged relay junction',interaction:'nexus-relay'},{id:'power',label:'Restore the power distribution terminal',interaction:'nexus-power'},{id:'return',label:'Return to Dr. Adrian Kess',interaction:'kess'}]},
  'natural-order-agriculture-01':{title:'KEEPING THINGS RUNNING',type:'side',description:'Daniel Mercer needs farm equipment delivered, food moved to the distribution point and a solar installation repaired. Reward: Natural Order Maneuvering Thrusters.',giver:'Daniel Mercer',source:'story',start:'order-homeworld',end:'order-homeworld',destination:'order-homeworld',interaction:'mercer',objectives:[{id:'equipment-collect',label:'Collect farm equipment from the supply depot',interaction:'order-depot'},{id:'equipment',label:'Deliver the equipment to the farm',interaction:'order-farm'},{id:'food-collect',label:'Collect food crates from the granary',interaction:'order-granary'},{id:'food',label:'Take the food to the distribution point',interaction:'order-market'},{id:'solar-collect',label:'Collect replacement parts from the workshop',interaction:'order-workshop'},{id:'solar',label:'Repair the damaged solar installation',interaction:'order-solar'},{id:'return',label:'Return to Daniel Mercer',interaction:'mercer'}]}
 };
 // Auto-tracking picks the first active mission in this order.
 const priority=['ground-training','flight-training','meet-rook','first-station','legal-run','return','illegal-run','combat-qualification'];
 const safeId=id=>typeof id==='string'&&/^[a-z][a-z0-9-]{0,79}$/.test(id);
 const flightTrainingDone=s=>s.story?.flags?.flightTrainingComplete===true;
 const pastWorkshop=s=>s.quest!=='inheritance';
 const pastMeridianArrival=s=>!['inheritance','arrival'].includes(s.quest);
 const pastFirstOffer=s=>!['inheritance','arrival','legal-offer'].includes(s.quest);
 function define(id,definition){if(!safeId(id)||!definition||!['tutorial','main','side','cargo','campaign','bounty','station'].includes(definition.type)||!Array.isArray(definition.objectives)||!definition.objectives.length||!definition.objectives.every(o=>safeId(o.id)&&typeof o.label==='string'))return false;definitions[id]={...definition,objectives:definition.objectives.map(o=>({...o}))};return true;}
 function records(s){return s.universe.missions??={};}
 function available(s,id){const d=definitions[id];if(!d)return true;const requirements=d.prerequisites||[];return requirements.every(key=>s.universe?.missions?.[key]?.completed===true)&&Object.entries(d.storyFlags||{}).every(([key,value])=>s.story?.flags?.[key]===value)&&Object.entries(d.factionFlags||{}).every(([key,value])=>(s.progression?.reputation?.[key]||0)>=value)&&(!d.availability?.locations||d.availability.locations.includes(s.location));}
 function acquire(s,id){if(!safeId(id)||(!records(s)[id]&&!available(s,id)))return null;const entries=records(s);return entries[id]??={acquired:true,completed:false,objectives:{}};}
 function finish(s,id,entry){
  if(entry.completed&&s.universe.trackedMission===id){s.universe.trackedMission=null;s.universe.autoTrack=true;}
 }
 function complete(s,id,objective='arrive',C){
  const definition=description(s,C,id);
  // Placeholder missions (awaiting design) can never be completed.
  if(tutorials.includes(id)||definition.placeholder||!definition.objectives.some(o=>o.id===objective))return false;
  const entry=acquire(s,id);if(!entry)return false;
  if(entry.objectives[objective]===true)return false;
  entry.objectives[objective]=true;
  entry.completed=definition.objectives.filter(o=>o.required!==false).every(o=>entry.objectives[o.id]===true);
  finish(s,id,entry);
  return true;
 }
 // Copies progression flags into a tutorial entry; the flags stay authoritative.
 function mirror(s,id,ids,value,done){
  const entry=acquire(s,id);if(!entry)return;
  entry.objectives={};for(const key of ids)if(value(key))entry.objectives[key]=true;
  const was=entry.completed;entry.completed=done(entry);
  if(entry.completed&&!was)finish(s,id,entry);
 }
 function sync(s,C){
  if(!s?.universe)return [];
  const entries=records(s),p=s.progression,f=p?.flags||{};
  // A pilot who declined Mara's lessons gets no tutorial entries unless they already had them.
  const declined=s.story?.flags?.tutorialSkipped===true&&!entries['ground-training'];
  if(!declined&&p&&(p.opening?.pistol||p.personal?.weapon==='ward-pistol'||f.board||pastWorkshop(s))){
   const v1=p.opening?.version!==2;
   mirror(s,'ground-training',groundIds,id=>id==='recording'?(v1||p.opening.hologram===true||p.opening.pistol===true):id==='receive-gun'?(p.opening?.pistol===true||p.personal?.weapon==='ward-pistol'):id==='groundCombat'?(f.groundCombat===true||f.shootingTutorialComplete===true||p.opening?.cans?.length>=4):f[id]===true,()=>P.groundDone(s)||pastWorkshop(s));
   // Older saves already hold a single combined entry; its flags carry over unchanged.
   if((P.groundDone(s)||pastWorkshop(s))&&(f.maraShipHandoff||f.board||pastWorkshop(s)||entries['flight-training']))mirror(s,'flight-training',trainingIds,id=>f[id]===true,()=>trainingIds.every(id=>f[id]===true));
  }
  if(p&&(flightTrainingDone(s)||pastWorkshop(s))){
   const cargo=acquire(s,'meet-rook');
   cargo.objectives.instructions=true;
   if(pastWorkshop(s)&&(s.location==='meridian'||s.quest!=='arrival'))cargo.objectives.travel=true;
   if(pastMeridianArrival(s))cargo.objectives.dock=true;
   if(s.story?.flags?.rookIntroduced||['legal-run','return','illegal-offer','illegal-run','open'].includes(s.quest)){
    cargo.objectives.enter=true;cargo.objectives.locate=true;cargo.objectives.speak=true;
   }
   const was=cargo.completed;cargo.completed=definitions['meet-rook'].objectives.every(o=>cargo.objectives[o.id]);
   if(cargo.completed&&!was)finish(s,'meet-rook',cargo);
  }
  if(p&&(pastMeridianArrival(s)||stationIds.some(id=>f[id]===true)))mirror(s,'first-station',stationIds,id=>f[id]===true,()=>stationIds.every(id=>f[id]===true));
  if(p&&(pastFirstOffer(s)||combatIds.some(id=>f[id]===true)))mirror(s,'combat-qualification',combatIds,id=>f[id]===true,()=>combatIds.every(id=>f[id]===true));
  const flight=C?.missionFlight?.({...s,destination:null});
  if(flight&&!['transit','training'].includes(flight.kind)&&flight.id!=='prologue-missiles'&&(flight.id||s.quest)!=='arrival')acquire(s,flight.id||s.quest);
  if(s.universe.freeTravel)acquire(s,'meet-admin');
  for(const id of s.universe.completedObjectives||[])if(safeId(id)&&!['arrival','inheritance'].includes(id)&&!tutorials.includes(id)){
   const entry=acquire(s,id);entry.completed=true;
   entry.objectives[id==='meet-admin'?'meet-admin':'arrive']=true;
  }
  const tracked=s.universe.trackedMission;
  if(tracked&&(!entries[tracked]?.acquired||entries[tracked].completed)){s.universe.trackedMission=null;s.universe.autoTrack=s.universe.autoTrack!==false||!!entries[tracked]?.completed;}
  if(s.universe.trackedMission===null&&s.universe.autoTrack!==false){
   const next=nextMission(s,C);if(next)s.universe.trackedMission=next;
  }
  return all(s,C);
 }
 function nextMission(s,C){
  // Placeholder missions are never picked automatically; the player can still track them by hand.
  const active=Object.entries(records(s)).filter(([id,entry])=>entry?.acquired&&!entry.completed&&!definitions[id]?.placeholder).map(([id])=>id);
  if(!active.length)return null;
  const rank=id=>{const i=priority.indexOf(id);return i>=0?i:id==='meet-admin'?priority.length+1:priority.length;};
  return active.sort((a,b)=>rank(a)-rank(b))[0];
 }
 function description(s,C,id){
  if(definitions[id])return definitions[id];
  const f=C?.missionFlight?.({...s,destination:null});
  const isCurrent=f&&f.kind!=='transit'&&(f.id||s.quest)===id;
  const contract=(C?.allContracts||C?.contracts)?.find?.(item=>item.id===id);
  const run=/^rook-run-(\d+)$/.exec(id);
  const title=isCurrent?f.name:run?'Rook freight run #'+run[1]:contract?.name||id.replace(/-/g,' ').toUpperCase();
  const destination=isCurrent?f.destination:contract?.destination;
  const cargo=isCurrent?f.cargo:contract?.cargo;
  return {title,type:cargo&&cargo!=='Empty hold'?'cargo':'campaign',description:contract?.briefing||((cargo&&cargo!=='Empty hold')?'Deliver '+cargo+' to '+(U.locations[destination]?.name||destination)+'.':'Travel to '+(U.locations[destination]?.name||destination||'the destination')+'.'),rewards:(isCurrent?f.reward:contract?.reward)||null,destination,source:'mission-terminal',giver:contract?.contact||'Campaign',start:contract?.start||null,end:destination,prerequisites:contract?.requires?[contract.requires]:[],availability:{},storyFlags:{},factionFlags:{},completion:{event:'dock',location:destination},objectives:[{id:'arrive',label:cargo&&cargo!=='Empty hold'?'Deliver '+cargo:'Reach the destination and dock'}]};
 }
 function all(s,C){
  if(!s?.universe)return [];
  return Object.entries(records(s)).filter(([,entry])=>entry?.acquired).map(([id,entry])=>{
   const def=description(s,C,id),objectives=def.objectives.map(objective=>({...objective,complete:entry.objectives?.[objective.id]===true}));
   // A finished objective can move the goal (a delivery returns the player to the District).
   const stage=Object.entries(def.after||{}).filter(([key])=>entry.objectives?.[key]===true).map(([,next])=>next).pop();const pendingStep=def.objectives.find(o=>o.required!==false&&entry.objectives?.[o.id]!==true);
   const complete=entry.completed===true||!tutorials.includes(id)&&objectives.filter(objective=>objective.required!==false).every(objective=>objective.complete);
   const destination=stage?.destination?stage.destination:pendingStep?.destination?pendingStep.destination:id==='flight-training'&&pastWorkshop(s)?C?.missionFlight?.({...s,destination:null})?.destination||def.destination:id==='meet-rook'&&entry.objectives?.dock?'meridian':def.destination;
   return {id,title:def.title,type:def.type,description:def.description||'',destination,rewards:def.rewards||null,interaction:stage?.interaction||pendingStep?.interaction||def.interaction,objectives,objective:objectives.find(objective=>objective.required!==false&&!objective.complete)?.label||'Complete',completed:complete,tracked:s.universe.trackedMission===id};
  });
 }
 function active(s,C){sync(s,C);return all(s,C).filter(mission=>!mission.completed);}
 function tracked(s,C){return active(s,C).find(mission=>mission.tracked)||null;}
 function track(s,id,C){sync(s,C);if(!all(s,C).some(mission=>mission.id===id&&!mission.completed))return false;s.universe.trackedMission=id;s.universe.trackingInitialized=true;s.universe.autoTrack=true;return true;}
 function untrack(s){s.universe.trackedMission=null;s.universe.trackingInitialized=true;s.universe.autoTrack=false;}
 // Station terminals that teach each First Station step.
 const stationTerminal={shipInventory:'maintenance',hangar:'maintenance',moduleInstalled:'maintenance',purchasedInstalled:'maintenance',vendor:'services',modulePurchased:'services'};
 function guidance(s,mission,inside){if(!mission||mission.completed)return null;
  const pending=mission.objectives.find(objective=>objective.required!==false&&!objective.complete)||mission.objectives.find(objective=>!objective.complete);
  if(mission.id==='meet-rook'&&inside&&s.location==='meridian')return {kind:'local',label:mission.objective,interaction:mission.interaction};
  if(mission.id==='ground-training')return pending?{kind:'instruction',label:pending.label}:null;
  if(mission.id==='first-station'){if(!pending)return null;return inside?{kind:'local',label:pending.label,interaction:stationTerminal[pending.id]}:{kind:'instruction',label:pending.label+' (any station hangar)'};}
  if(mission.id==='combat-qualification')return pending?{kind:'instruction',label:pending.label}:null;
  if(mission.id==='flight-training'){
   if(!pending)return null;
   if(pending.id==='board'&&inside)return {kind:'ship',label:pending.label,interaction:'board'};
   if(!['navigation','jumpTravel','dock'].includes(pending.id))return {kind:'instruction',label:pending.label};
   // Current scripted route is the navigable training objective, never proof of a maneuver.
   const destination=s.destination||s.travel?.destination||mission.destination;
   if(!destination)return {kind:'instruction',label:pending.label};
   if(inside)return {kind:'ship',label:pending.label,interaction:'board'};
   const hop=U.nextHop(s.location,destination);
   return {kind:'route',label:pending.label,destination:hop};
  }
  if(!mission.destination)return {kind:'instruction',label:mission.objective};
  if(inside){if(s.location!==mission.destination)return {kind:'ship',label:'YOUR SHIP / HANGAR',interaction:'board'};return {kind:'local',label:mission.objective,interaction:mission.interaction||'rook'};}
  const hop=U.nextHop(s.location,mission.destination);
  return {kind:U.route(s.location,hop).kind,label:(U.system(s.location)!==U.system(hop)?'INTERSTELLAR / ':'LOCAL / ')+(U.locations[hop]?.name||hop).toUpperCase(),destination:hop};
 }
 function metadata(s,C,id){return {availability:{},giver:null,source:null,start:null,end:null,prerequisites:[],storyFlags:{},factionFlags:{},completion:null,...description(s,C,id)};}
 const api={definitions,trainingIds,groundIds,stationIds,combatIds,tutorials,define,available,metadata,acquire,complete,sync,all,active,tracked,track,untrack,guidance,nextMission};
 if(typeof module!=='undefined')module.exports=api;else root.VoidMissions=api;
})(globalThis);
