/* MISSION GIVERS AND PLACES (pure data and rules: browser and Node tests; no network, no DOM). Used by the Mission Editor (giver and target pickers, "can this be
   played or published") and by the content adapter at play time (which interaction belongs to which NPC, where a "go to" place is). Every entry here is a FACT read from
   the game's own code (the source is named on each line); nothing here moves an NPC, gives anyone a new place or line, or decides story. Placing an earlier character in the
   District is David's story decision: this file only says where each character is today.
   An NPC can give a mission or be the person a step happens with only if the game has a TALK prompt for them (`targets`: the interaction action, and for station people the
   character id). `district` = in the current District game (NeoChinatown and the places a District player walks to); everyone else is an earlier character.
   `players`: whether an ordinary District player can reach them today. `draft`: whether PLAY THIS DRAFT can start next to them (the same places Test & Jump To can open). */
(function(root){
 'use strict';
 const D='district',E='earlier';
 const AREA={district:{walk:'darknet-district'},street:q=>({walk:'sacramento',quarter:q}),milked:{walk:'sacramento',quarter:'far-south'},temple:{walk:'sacramento',quarter:'avenue'},station:id=>({location:id})};
 /* id: the voice registry id (tools/audio/npc-voice-registry.json) or, for people only listed elsewhere, that list's id. say: the speaker name the dialogue window shows. */
 const FACTS={
  admin:{name:'Admin',group:D,say:'Admin',where:'The Darknet District, at the store counter (neochinatown.js: SPEAK WITH ADMIN).',targets:[{action:'admin'}],layout:'admin',enter:AREA.district,players:true,draft:true,
   note:'His prompt is hidden while the story flag adminOccupied is set (Play as Admin uses it).'},
  iris:{name:'Iris',group:D,say:'Iris',where:'The Darknet District, at the store counter beside Admin (neochinatown.js: SPEAK WITH IRIS).',targets:[{action:'district-iris'}],layout:'district-iris',enter:AREA.district,players:true,draft:true,
   note:'The in-game Iris only; the website chatbot is separate.'},
  bartender:{name:'District bartender',group:D,say:'Bartender',where:'The Darknet District bar and oxygen lounge (neochinatown.js: TALK TO THE BARTENDER). The figure behind the bar is Nyx (district-people.js).',targets:[{action:'district-bar'}],layout:'district-bar',enter:AREA.district,players:true,draft:true},
  'nyx-district':{name:'Nyx',group:D,say:'Bartender',where:'Behind the District bar (district-people.js). The same TALK TO THE BARTENDER prompt as the District bartender in the voice list.',targets:[{action:'district-bar'}],layout:'district-bar',enter:AREA.district,players:true,draft:true},
  attendant:{name:'Arcade attendant',group:D,say:'Arcade attendant',where:'The Darknet District VR booths. Today the ACCESS VR EXPERIENCES prompt opens the VR menu (vr-core.js); the attendant only speaks if that menu is missing (prologue-integration.js).',targets:[],players:false,draft:false,
   why:'The VR prompt opens the VR menu, not a conversation (needs a code change to talk to the attendant).'},
  'landing-terminal':{name:'Landing terminal',group:D,kind:'machine',say:'Landing terminal',where:'The Landing Terminal on the street by Pad 01, The Port (neochinatown.js: terminal).',targets:[{action:'terminal'}],layout:'terminal',enter:AREA.street('port'),players:true,draft:true,
   note:'A machine, not a person: fine as the place a step happens, odd as a mission giver.'},
  'milked-eva':{name:'Eva',group:D,say:'milked-eva',where:'Milked reception, Far South (milked-integration.js: Eva). Main Street south through the South Gate.',targets:[{action:'milked-eva'}],enter:AREA.milked,players:true,draft:true,
   note:'Draft play starts on Far South’s street; walk into Milked. Her voice is a provisional placeholder.'},
  'milked-fish':{name:'Fish',group:D,say:'milked-fish',where:'Milked, Far South (milked-integration.js: Fish).',targets:[{action:'milked-fish'}],enter:AREA.milked,players:true,draft:true,note:'Draft play starts on Far South’s street; walk into Milked. Provisional voice.'},
  'zen-zephyr':{name:'Zen Zephyr',group:D,say:'zen-zephyr',where:'Zen Zephyr’s Temple, past the East Gate (temple.js: SPEAK WITH ZEN ZEPHYR).',targets:[{action:'temple-monk'}],enter:AREA.temple,players:true,draft:true,
   note:'Reached by road taxi (60 CR) or on foot through the East Gate from The Avenue. Draft play starts on The Avenue. No registered voice.'},
  // ---- earlier characters (not in the District today) ----
  rook:{name:'Rook',group:E,say:'rook',where:'Meridian Station, the Dead Channel bar (meridian-interior.js: TALK / ROOK).',targets:[{action:'talk',character:'rook'}],layout:'rook',enter:AREA.station('meridian'),players:false,draft:true,
   reach:'Not in the District. Since the missions were removed (17 Nov 2026) nothing gives a District player a ship, so nobody reaches Meridian until a mission grants a ship (GRANT SHIP). Talking to him otherwise runs his older freight conversation.'},
  nyx:{name:'Nyx',group:E,say:'nyx',where:'Meridian Station, the Dead Channel bar (meridian-interior.js: TALK / NYX).',targets:[{action:'talk',character:'nyx'}],layout:'nyx',enter:AREA.station('meridian'),players:false,draft:true,
   reach:'Not in the District. Reached at Meridian once a mission grants a ship (GRANT SHIP).'},
  mara:{name:'Mara',group:E,say:'mara',where:'Vesper, the Ward Freight workshop of the old opening (opening-data.js, station-layouts.js).',targets:[{action:'talk',character:'mara'},{action:'opening-mara'}],enter:AREA.station('vesper'),players:false,draft:true,
   reach:'Not in the District. Vesper is on a District campaign’s list of known places, so a player with a ship (once a mission grants one) can fly there; what she says there today is her old opening scene. Not checked with a draft mission in a browser.'},
  elias:{name:'Elias Ward',group:E,kind:'recording',say:'elias',where:'Vesper: an archived recording (PLAY ARCHIVE), not a person.',targets:[],players:false,draft:false,why:'A recording cannot hand over a mission (needs a code change).'},
  elara:{name:'Dr. Elara Voss',group:E,say:'Dr. Elara Voss',where:'The Vigil, Cantor System (station-layouts.js: TALK / DR. ELARA VOSS).',targets:[{action:'talk',character:'elara'}],layout:'elara',enter:AREA.station('vigil'),players:false,draft:true,
   reach:'The Vigil is only discovered by the old Communion delivery. A mission unlock "open route / place: The Vigil" would let players fly there.'},
  marcus:{name:'Marcus Vale',group:E,say:'Marcus Vale',where:'Holdfast, Garrow System (station-layouts.js: TALK / MARCUS VALE).',targets:[{action:'talk',character:'marcus'}],layout:'marcus',enter:AREA.station('holdfast'),players:false,draft:true,
   reach:'Holdfast is only discovered by the old Natural Order delivery. An "open route / place: Holdfast" unlock would open it.'},
  kess:{name:'Dr. Adrian Kess',group:E,say:'Dr. Adrian Kess',where:'The Nexus, the Communion homeworld (planets.js: TALK / DR. ADRIAN KESS).',targets:[{action:'homeworld-talk',character:'kess'}],layout:'kess',enter:AREA.station('nexus'),players:false,draft:true,
   reach:'Only the old homeworld run opens it. Draft play docks there as Test & Jump To does; not checked with a draft mission.'},
  mercer:{name:'Daniel Mercer',group:E,say:'Daniel Mercer',where:'The Natural Order homeworld, Garrow (planets.js: TALK / DANIEL MERCER).',targets:[{action:'homeworld-talk',character:'mercer'}],layout:'mercer',enter:AREA.station('order-homeworld'),players:false,draft:true,
   reach:'Only the old homeworld run opens it. Not checked with a draft mission.'},
  iona:{name:'Iona Vale',group:E,say:'iona',where:'Rusthaven Port (station-layouts.js: TALK / IONA).',targets:[{action:'talk',character:'iona'}],layout:'iona',enter:AREA.station('rusthaven'),players:false,draft:true,
   reach:'Rusthaven is not on a District campaign’s list of known places. An "open route / place: Rusthaven Port" unlock would open it.'},
  sol:{name:'Dr. Sol',group:E,say:'sol',where:'Kepler, the clinic network’s station (station-layouts.js: TALK / DR. SOL).',targets:[{action:'talk',character:'sol'}],layout:'sol',enter:AREA.station('kepler'),players:false,draft:true,
   reach:'Kepler is not on a District campaign’s list of known places. An "open route / place: Kepler" unlock would open it.'}};
 const RESIDENT='Stands in the District as a figure but has no TALK prompt (needs a code change before a mission can start with them).';
 const COMPANION='A VR companion: talks only inside a VR experience, not in the walking game (needs a code change to give missions).';
 /* "Go to" places a step can ask for. walk/area: the walking scene (walkingLocation.id and .area); quarter: walkingLocation.quarter on the street; location: the save location (stations).
    (The `enter` of a giver above is different: the key enterWalking() is called with to put a draft player there.) */
 const PLACES=[
  {id:'district',name:'Inside The Darknet District',walk:'neochinatown',area:'interior',district:true,players:true},
  {id:'port',name:'The Port (NeoChinatown street)',walk:'neochinatown',area:'street',quarter:'port',district:true,players:true},
  {id:'oldtown',name:'Old Town (NeoChinatown street)',walk:'neochinatown',area:'street',quarter:'oldtown',district:true,players:true},
  {id:'avenue',name:'The Avenue (NeoChinatown street)',walk:'neochinatown',area:'street',quarter:'avenue',district:true,players:true},
  {id:'far-south',name:'Far South (NeoChinatown street)',walk:'neochinatown',area:'street',quarter:'far-south',district:true,players:true},
  {id:'outskirts',name:'The Outskirts',walk:'neochinatown',area:'street',quarter:'outskirts',district:true,players:true},
  {id:'milked',name:'Inside Milked',walk:'neochinatown',area:'milked',district:true,players:true},
  {id:'temple',name:'Zen Zephyr’s Temple',walk:'temple',district:true,players:true},
  {id:'corporate',name:'The Corporate District',walk:'corporate',district:true,players:true},
  {id:'meridian',name:'Meridian Station',location:'meridian',players:false,note:'needs a ship: once a mission grants one (GRANT SHIP)'},
  {id:'vesper',name:'Vesper',location:'vesper',players:false,note:'known to every District campaign; needs a ship (once a mission grants one)'},
  ...Object.entries({'kepler': 'Kepler', 'rusthaven': 'Rusthaven Port', 'foundry': 'Foundry', 'sol-belt': 'Tessaly Belt Anchorage', 'mars': 'Vantor', 'vigil': 'The Vigil', 'holdfast': 'Holdfast', 'nexus': 'The Nexus', 'order-homeworld': 'The Natural Order homeworld'}).map(([id,name])=>({id,name,location:id,players:false,note:'only once something opens it (an “open route / place” unlock does)'}))];
 const PLACE=new Map(PLACES.map(p=>[p.id,p]));
 /* What a step can ask for. supported: the game can run it today (draft play and publish). The others are listed so the owner can plan them; they say "needs a code change". */
 const STEP_KINDS=[
  {id:'talk',name:'Talk to someone',supported:true,needs:'npc'},
  {id:'go',name:'Go to a place',supported:true,needs:'place'},
  {id:'arrive',name:'Fly to / arrive at a place',supported:true,needs:'location',note:'Completes when the player is docked or walking at that place. The flight is the game’s own: board at Pad 01 (The Port), line up on the marker, jump, dock. It needs a ship (GRANT SHIP) and the place open for travel.'},
  {id:'deliver',name:'Deliver to someone',supported:true,needs:'npc',note:'Completes when you talk to the recipient after the earlier steps. The parcel is not an inventory item.'},
  {id:'buy',name:'Buy an item',supported:true,needs:'item',note:'Completes when the item is bought at the outfitter or Admin’s counter (progression.js buy).'},
  {id:'pod-exit',name:'Leave the Sleeping Pod',supported:true,note:'Completes when the player leaves their Sleeping Pod (EXIT POD). A mission that starts by notification on “first exit from the Sleeping Pod” completes it as it starts.'},
  {id:'message',name:'The notification arrives',supported:true,note:'Completes by itself as the mission’s notification reaches the device (see “How this mission starts”). Only for a mission that starts by notification. No reply is needed.'},
  {id:'hear',name:'Hear what they say',supported:true,note:'The lines below are shown right after the talk step before it; the step is done when the player closes that conversation.'},
  {id:'fight',name:'Win a fight',supported:false},{id:'scan',name:'Scan with WarFlying',supported:false},{id:'escort',name:'Escort someone',supported:false},
  {id:'pickup',name:'Pick something up in the world',supported:false},{id:'wait',name:'Wait / come back later',supported:false}];
 /* What a mission can make available. supported: applied by the game when the mission (or the step named in `when`) is done. */
 const UNLOCK_KINDS=[
  {id:'credits',name:'Credits',supported:true},
  {id:'flag',name:'Story flag',supported:true,note:'Saved as story.flags.mf_<name> so it can never overwrite one of the game’s own flags.'},
  {id:'location',name:'Open route / place',supported:true,note:'The place and its system are added to what the player knows (universe.js discover); with a ship it is offered as a flight destination.'},
  {id:'ship',name:'Grant ship',supported:true,note:'The ship becomes the player’s (campaign.js awardStarterShip opens the pad, boarding and free travel; another hull is added as if bought: giveShip). A paid hull (Spectre) is never given.'},
  {id:'item',name:'Store item (and its store)',supported:false,why:'No store reads a per-player list of unlocked items yet: the outfitter sells every listed module to everyone and Admin’s counter sells only the scrambler.'},
  {id:'gate',name:'Area or gate opens',supported:false,why:'Checkpoint gates are open or shut for everyone (ncz-quarters.js GATES); there is no per-player gate state.'},
  {id:'reputation',name:'Reputation',supported:false,why:'The game has no faction reputation for the player.'},
  {id:'tree',name:'Start tree',supported:true,note:'Another of your trees starts: its first mission becomes available (its giver offers it). A tree that some link starts waits for that link.'},
  {id:'mission',name:'Another mission opens',supported:true,note:'Missions in a tree run in order: finishing one opens the next.'}];
 /* How a mission starts (David, 17 Nov 2026: "either have Missions start by notification or in person"). */
 const START_HOW=[{id:'person',name:'IN PERSON: the giver offers it when the player talks to them'},{id:'notification',name:'BY NOTIFICATION: it arrives on the player’s device'}];
 const START_CHANNELS=[{id:'messages',name:'MESSAGES',note:'A text in the V1 Messages app (INBOX). No reply is needed.'},
  {id:'comms',name:'COMMS CALL',note:'A call in the Comms app: the sender and the words as a transcript. The voice plays only if a recorded clip exists for that exact line (nothing is generated).'},
  {id:'notify',name:'NOTIFICATION ONLY',note:'A banner on the screen, then the Mission Log. Nothing is kept in Messages or Comms.'}];
 const START_WHEN=[{id:'pod-exit',name:'First exit from the Sleeping Pod',note:'Also a character who left the pod before this mission existed: on their next pod exit.'},{id:'after-mission',name:'After a mission is completed'},
  {id:'place',name:'Entering a place or quarter'},{id:'flag',name:'A story flag is set'}];
 const FLAG_PREFIX='mf_',FLAG=/^[a-zA-Z][a-zA-Z0-9_-]{0,47}$/;
 const nameOf=(id,reg,people,story,temple)=>reg[id]?.displayName||FACTS[id]?.name||people.get(id)?.name||story[id]?.name||(temple&&temple.id===id?temple.name:'')||id;
 /* Every registered NPC (voice registry, District residents, story characters, the temple's monk) with where they are today. src: {registry, people (district-people NPCS), story (characters), temple (MODEL)} */
 function roster(src={}){
  const reg=(src.registry&&src.registry.npcs)||{},people=new Map((src.people||[]).map(n=>[n.id,n])),story=src.story||{},temple=src.temple||null;
  const ids=[...new Set([...Object.keys(FACTS),...Object.keys(reg),...people.keys(),...Object.keys(story),...(temple?[temple.id]:[])])];
  const out=[];
  for(const id of ids){if(['news-anchor','commercial-announcer','the-function'].includes(id)||(reg[id]&&reg[id].broadcast))continue;
   const f=FACTS[id],p=people.get(id),name=nameOf(id,reg,people,story,temple),voice=reg[id]?{voice:reg[id].voice,status:reg[id].status}:null;
   let e;
   if(f)e={...f};
   else if(/^vr-/.test(id))e={group:D,where:'The District’s VR booths (vr-companions.js).',targets:[],players:false,draft:false,why:COMPANION};
   else if(p)e={group:D,where:(p.place||'The Darknet District')+' (district-people.js).',targets:[],players:false,draft:false,why:RESIDENT};
   else e={group:E,where:'Not placed in any scene the editor knows of.',targets:[],players:false,draft:false,why:'No TALK prompt for this character anywhere in the game (needs a code change).'};
   const canTalk=e.targets.length>0;
   out.push({id,name,say:/^[a-zA-Z][\w-]{0,63}$/.test(e.say||'')?e.say:id,kind:e.kind||'person',group:e.group,groupText:e.group===D?'in the current District game':'earlier character (not in the District today)',where:e.where,targets:e.targets,layout:e.layout||null,enter:e.enter||null,
    canTalk,players:!!(canTalk&&e.players),draft:!!(canTalk&&e.draft),reach:e.reach||(e.group===D&&canTalk?'In the current District game.':''),why:e.why||'',note:e.note||'',voice,
    sources:[reg[id]&&'npc-voice-registry.json',p&&'district-people.js',story[id]&&'story-content.js',temple&&temple.id===id&&'temple.js'].filter(Boolean)});}
  const rank=g=>g.group===D?0:1;
  return out.sort((a,b)=>rank(a)-rank(b)||(b.id==='admin')-(a.id==='admin')||(b.id==='iris')-(a.id==='iris')||a.name.localeCompare(b.name));
 }
 /* Plain words for the picker and the check screen. */
 function status(g){if(!g)return 'Not a known NPC.';
  if(!g.canTalk)return g.why||'Cannot be talked to in the game today (needs a code change).';
  const at=g.enter&&g.enter.location,play=g.draft?'A draft with them can be played now'+(g.group===E&&at?' (draft play starts at '+((PLACE.get(at)||{}).name||at)+')':'')+'.':'A draft with them cannot be played yet.';
  const pub=g.players?'Players can reach them today.'+(g.group===E&&g.reach?' '+g.reach:''):'Players cannot reach them today. '+(g.reach||'Their place is not open to a District player.');
  return (g.group===E?'Earlier character: '+g.where+' ':'')+play+' '+pub;}
 /* Which roster ids answer an interaction (action, and the clicked figure's character id for station people). */
 function whoAt(list,action,character){const out=[];for(const g of list)if(g.targets.some(t=>t.action===action&&(!t.character||t.character===character)))out.push(g.id);return out;}
 /* Which places the player is in right now. w: walkingLocation id, quarter: story.flags.quarter, location: state.location, docked: walking or docked at a station. */
 function placesNow({walk,area,quarter,location,docked}){const out=[];for(const p of PLACES){if(p.walk&&p.walk===walk&&(!p.area||p.area===area)&&(!p.quarter||p.quarter===quarter))out.push(p.id);else if(p.location&&p.location===location&&docked)out.push(p.id);}return out;}
 /* Items a "buy" step can name: modules a store actually sells (progression.js modules: not a reward, not switched off, with a vendor). */
 function buyable(modules){return Object.fromEntries(Object.entries(modules||{}).filter(([,m])=>m&&!m.reward&&m.available!==false&&(m.vendor===undefined||m.vendor)).map(([id,m])=>[id,m.name+' ('+((m.vendor||'outfitter')==='admin'?'Admin’s counter':'ship outfitter')+')']));}
 const api={START_HOW,START_CHANNELS,START_WHEN,FACTS,PLACES,PLACE,STEP_KINDS,UNLOCK_KINDS,FLAG_PREFIX,FLAG,roster,status,whoAt,placesNow,buyable};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VoidMissionGivers=api;
})(typeof globalThis!=='undefined'?globalThis:this);
