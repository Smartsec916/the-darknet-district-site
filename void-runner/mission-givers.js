/* MISSION GIVERS AND PLACES (pure data and rules: browser and Node tests; no network, no DOM). Used by the Mission Editor (giver and target pickers, "can this be
   played or published") and by the content adapter at play time (which interaction belongs to which NPC, where a "go to" place is). Every entry here is a FACT read from
   the game's own code (the source is named on each line); nothing here moves an NPC, gives anyone a new place or line, or decides story. Placing an earlier character in the
   District is the owner's story decision: this file only says where each character is today.
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
  'milked-eva':{name:'Eva',group:D,say:'milked-eva',where:'Milked reception, Far South (milked-integration.js: Eva). Main Street south through the South Gate.',targets:[{action:'milked-eva'}],layout:'milked-eva',enter:AREA.milked,players:true,draft:true,
   note:'Draft play starts on Far South’s street; walk into Milked. Her voice is a provisional placeholder.'},
  'milked-fish':{name:'Fish',group:D,say:'milked-fish',where:'Milked, Far South (milked-integration.js: Fish).',targets:[{action:'milked-fish'}],layout:'milked-fish',enter:AREA.milked,players:true,draft:true,note:'Draft play starts on Far South’s street; walk into Milked. Provisional voice.'},
  'zen-zephyr':{name:'Zen Zephyr',group:D,say:'zen-zephyr',where:'Zen Zephyr’s Temple, past the East Gate (temple.js: SPEAK WITH ZEN ZEPHYR).',targets:[{action:'temple-monk'}],enter:AREA.temple,players:true,draft:true,
   note:'Reached by road taxi (60 CR) or on foot through the East Gate from The Avenue. Draft play starts on The Avenue. No registered voice.'},
  // The V1's translation (Mission 003, 17 Nov 2026): a line by `v1-translator` straight after another speaker's line is that line's English translation: shown under it as
  // V1 TRANSLATION and played over it IN THE SPEAKER'S OWN VOICE (the owner's standard; live-content.js, voice-clips.js, extra/manifest.json translations). Not a person.
  'v1-translator':{name:'V1 translation',group:D,kind:'device',say:'v1-translator',where:'The player\u2019s V1 device: translates what is said in another language, in the speaker\u2019s own voice.',targets:[],players:false,draft:false,
   why:'Not a person: use it only for a line straight after another speaker\u2019s line in another language (the translation, spoken in that speaker\u2019s own voice).'},
  // Juno Vex (the owner's Mission 002, 17 Nov 2026): the person Admin wants photographed. She sits alone at NULL's bar (ncz-nightclub.js); the V1 camera names her. Nobody talks to her.
  'juno-vex':{name:'Juno Vex',group:D,say:'Juno Vex',where:'NULL, at the bar talking with Halden Reyes, checking her device (ncz-nightclub.js).',targets:[],photo:true,place:'null',players:false,draft:false,
   why:'No TALK prompt: she is someone to photograph (Mission 002), not to talk to.'},
  // Halden Reyes (the owner, 17 Nov 2026, APPROVED): the well-dressed corporate man Juno is talking with at NULL's bar; Mission 002's photo must show them both. No dialogue.
  'halden-reyes':{name:'Halden Reyes',group:D,say:'Halden Reyes',where:'NULL, at the bar talking with Juno Vex (ncz-nightclub.js).',targets:[],photo:true,place:'null',players:false,draft:false,
   why:'No TALK prompt: he is someone to photograph (Mission 002), not to talk to.'},
  // The Awakening continuation (the owner's spec, 20 Nov 2026): people a mission places itself (mission.cast, mission-mechanics.js), shown only to the player doing it.
  // Their words are the owner's (Missions 004 and 007); nobody talks to them (no TALK prompt): they are overheard, watched, followed and photographed.
  'tea-associate-1':{name:'Associate 1',group:D,say:'Associate 1',where:'The underground tea house (under-tea-room), placed by Mission 004 (mission cast).',targets:[],photo:true,place:'under-tea-room',players:false,draft:false,why:'No TALK prompt: overheard in Mission 004.'},
  'tea-associate-2':{name:'Associate 2',group:D,say:'Associate 2',where:'The underground tea house (under-tea-room), placed by Mission 004 (mission cast).',targets:[],photo:true,place:'under-tea-room',players:false,draft:false,why:'No TALK prompt: overheard in Mission 004.'},
  'blackrock-associate':{name:'Blackrock associate',group:D,say:'Blackrock associate',where:'The underground fight pit (under-fight-pit), then Far South, placed by Mission 007 (mission cast).',targets:[],photo:true,place:'under-fight-pit',players:false,draft:false,why:'No TALK prompt: watched, photographed and followed in Mission 007.'},
  'blackrock-entrance':{name:'Commercial back entrance',group:D,kind:'thing',say:'Commercial back entrance',where:'No. 166, Main Street (Far South): the back entrance the Blackrock associate goes into (Mission 007; a marker the V1 camera identifies).',targets:[],photo:true,place:'far-south',players:false,draft:false,why:'A doorway, not a person: something to photograph.'},
  // The six Blackrock members (the owner, 20 Nov 2026: their ElevenLabs voices chosen, tools/audio/revoice-engines.json), listed so the NPCs tab shows their voices.
  'robed-1':{name:'Blackrock Member 1',group:D,say:'robed-1',where:'The Blackrock Cult Room (cult-room.js): robed figure 1, seen only through the hacked camera feed (Mission 010). Voice: Blackrock Member 1 (Jacob L.), chosen by the owner 20 Nov 2026.',targets:[],players:false,draft:false,why:'Seen only on a camera feed: no TALK prompt.'},
  'robed-2':{name:'Blackrock Member 2',group:D,say:'robed-2',where:'The Blackrock Cult Room (cult-room.js): robed figure 2, seen only through the hacked camera feed (Mission 010). Voice: Blackrock Member 2 (Edward Sterling), chosen by the owner 20 Nov 2026.',targets:[],players:false,draft:false,why:'Seen only on a camera feed: no TALK prompt.'},
  'robed-3':{name:'Blackrock Member 3',group:D,say:'robed-3',where:'The Blackrock Cult Room (cult-room.js): robed figure 3, seen only through the hacked camera feed (Mission 010). Voice: Blackrock Member 3 (Cole), chosen by the owner 20 Nov 2026.',targets:[],players:false,draft:false,why:'Seen only on a camera feed: no TALK prompt.'},
  'robed-4':{name:'Blackrock Member 4',group:D,say:'robed-4',where:'The Blackrock Cult Room (cult-room.js): robed figure 4, seen only through the hacked camera feed (Mission 010). Voice: Blackrock Member 4 (Alex), chosen by the owner 20 Nov 2026.',targets:[],players:false,draft:false,why:'Seen only on a camera feed: no TALK prompt.'},
  'robed-5':{name:'Blackrock Member 5',group:D,say:'robed-5',where:'The Blackrock Cult Room (cult-room.js): robed figure 5, seen only through the hacked camera feed (Mission 010). Voice: Blackrock Member 5 (Dean), chosen by the owner 20 Nov 2026.',targets:[],players:false,draft:false,why:'Seen only on a camera feed: no TALK prompt.'},
  'robed-6':{name:'Blackrock Member 6',group:D,say:'robed-6',where:'The Blackrock Cult Room (cult-room.js): robed figure 6, seen only through the hacked camera feed (Mission 010). Voice: Blackrock Member 6 (Gareth), chosen by the owner 20 Nov 2026.',targets:[],players:false,draft:false,why:'Seen only on a camera feed: no TALK prompt.'},
  // Reverie and Lace (the owner, 18 Nov 2026: mission givers in the editor): the Avenue's street pair (ncz-street-pair.js), one out at a time on one UTC clock
  // for everyone. `shift`: a mission they give is offered only while that one is actually out (onDuty below; mission-content.js). Ordinary street residents.
  'grey-reverie':{name:'Reverie',group:D,say:'grey-reverie',where:'The Avenue (or wherever Developer Tools > NPCs places her), the north pavement by the LAUNDRY and REPAIR shopfronts (ncz-street-pair.js: TALK TO REVERIE, while she is out).',targets:[{action:'street-pair',character:'grey-reverie'}],layout:'street-pair-grey-reverie',enter:AREA.street('avenue'),players:true,draft:true,shift:{hours:[0,12],arrive:90},
   note:'Placeholder name. No voice: her lines are text. Draft play puts her on the street at any hour.'},
  'ethereal-lace':{name:'Lace',group:D,say:'ethereal-lace',where:'The Avenue (or wherever Developer Tools > NPCs places her), the north pavement by the LAUNDRY and REPAIR shopfronts (ncz-street-pair.js: TALK TO LACE, while she is out).',targets:[{action:'street-pair',character:'ethereal-lace'}],layout:'street-pair-ethereal-lace',enter:AREA.street('avenue'),players:true,draft:true,shift:{hours:[12,24],arrive:90},
   note:'Placeholder name. No voice: her lines are text. Draft play puts her on the street at any hour.'},
  // The street cat (the owner, 18 Nov 2026: "add the cat as an npc and giver"): out whenever the Avenue is (no shift; it lives there). PET THE CAT (ncz-street-pair.js) offers
  // its missions; with none it only looks up at the player (text only, no voice, no lore).
  'street-cat':{name:'Street cat',group:D,say:'street-cat',where:'The Avenue (or wherever Developer Tools > NPCs places it), the north pavement by the LAUNDRY door (ncz-street-pair.js: PET THE CAT; it goes to whichever of Reverie and Lace is out).',targets:[{action:'street-cat',character:'street-cat'}],layout:'street-cat',enter:AREA.street('avenue'),players:true,draft:true,
   note:'No voice and no lines of its own: with no mission it only looks up at the player (“The cat looks up at you.”, text only).'},
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
  {id:'enter',name:'Enter a place',supported:true,needs:'region',note:'Done while the player is inside the place (places.js; a player already inside when the step starts counts). Use “say it as a Comms call” for a call that arrives as they walk in.'},
  {id:'leave',name:'Leave a place',supported:true,needs:'region',note:'Done while the player is outside the place.'},
  {id:'photo',name:'Photograph someone',supported:true,needs:'subject',note:'Done when the player takes a photo with the V1 camera that really shows them: in the frame, roughly centred, within 15 m, nothing in the way, taken during this step.'},
  {id:'send-photo',name:'Send a photo to someone',supported:true,needs:'recipient',note:'In Messages: the player opens the recipient’s conversation, ATTACH, picks the photo, SEND. Only a photo of the chosen person taken during this mission counts. “What is said” is the reply to the right photo; the second set of lines is the reply to any other photo (unlimited tries, no fail). Photos stay on the player’s computer; only what was checked when the photo was taken is used.'},
  {id:'message',name:'The notification arrives',supported:true,note:'Completes by itself as the mission’s notification reaches the device (see “How this mission starts”). Only for a mission that starts by notification. No reply is needed.'},
  {id:'await-call',name:'Wait for their call',supported:true,note:'Completes by itself right after the step before it (Mission 003: “Await Fish’s response” ends the mission). The call itself comes from a later mission, started BY COMMS CALL with the trigger “After in-game time”.'},
  {id:'hear',name:'Hear what they say',supported:true,note:'The lines below are shown right after the talk step before it; the step is done when the player closes that conversation.'},
  // follow / lead / shared-cab (npc-escort.js, 19 Nov 2026): only with a character who can walk with the player (npc-paths.js MOVABLE: Reverie, Lace, the street cat)
  {id:'follow-them',name:'Follow them (they lead the way)',supported:true,needs:'escort',note:'The person walks to the spot you pick on the map and the player follows. They wait (turned to the player) if the player falls behind more than the distance you set, and walk on when the player catches up; if the player goes much further you choose: they stop and wait, or the mission fails (and can be taken again). Done when both are at the spot. Only people who can walk with the player (Reverie, Lace, the street cat).'},
  {id:'they-follow',name:'They follow you',supported:true,needs:'escort',note:'The person follows the player (about 2 metres behind, walking or running to keep up; the cat at its own pace) to the spot you pick on the map. Done when both are there. Only people who can walk with the player.'},
  {id:'their-cab',name:'They call a cab, you ride together',supported:true,needs:'cab',note:'The person walks to the kerb and calls a street taxi to the stop you choose; the player boards with them (BOARD TAXI, normal fare). Both get out at the stop; done then. Only Reverie or Lace (the cat does not ride in cabs), and only the stops in the quarter where she is placed (The Avenue unless placed elsewhere).'},
  {id:'shared-cab',name:'You call a cab, they ride along',supported:true,needs:'cab',note:'The person follows the player; when the player calls a street taxi to the stop you choose, they get in too, and both get out there; done then. A cab to another stop: they stay. Only Reverie or Lace, only the stops in the quarter where she is placed.'},
  // animation between steps (npc-gestures.js, 19 Nov 2026: the owner "can't add animations anywhere between the steps")
  {id:'anim',name:'Someone plays an animation',supported:true,needs:'anim',note:'The person you choose does the animation (a shrug, a laugh, looking about …) where they stand, as soon as the step before is done and the conversation is closed; the mission then waits the seconds you set (0 to 30) and goes on to the next step. Only animations that person really has.'},
  // mission apartments (apartments.js, 19 Nov 2026: "in the mission editor add 'instance an apartment'"): the apartment is added under "Apartments for this mission"
  {id:'apt-enter',name:'Go into an apartment',supported:true,needs:'apt',note:'Done while the player is inside one of this mission’s apartments (through its street door, then its door in the hallway). A player already inside when the step starts counts.'},
  {id:'apt-use',name:'Use something in an apartment',supported:true,needs:'apt',note:'Done when the player uses the thing you choose in that apartment: the computer, the utility panel, the safe, the vending machine, the closet or the light switch (E). For now each shows a short description; the gameplay behind them comes later.'},
  {id:'hack',name:'Hack the access point',supported:true,needs:'ap',note:'Every apartment door has an access point (a card reader with a small screen) beside it. The player presses E at the one you choose and holds on for the seconds you set while a progress bar runs (a stand-in for a hacking minigame later). Options: fail if they walk away, open that door for them for the rest of the mission, and an item they must carry (the hacking device is reserved; it is not sold anywhere yet).'},
  // zones in the mission timeline (the owner, 19 Nov 2026: "let me change a room or area from friendly to hostile in the mission timeline"; zones.js)
  {id:'zone',name:'Change zone (Friendly / Neutral / Hostile)',supported:true,needs:'zone',note:'Done by itself the moment it is reached: from then the room, location or city area you choose is Friendly, Neutral or Hostile until the step you choose is done (or until the mission ends; then it is back to its normal zone). The corner chip changes at once if the player is there. “Bring in the armed people placed there”: the enemies you placed in that room appear only now.'},
  // the reusable mechanics of the Awakening continuation (mission-mechanics.js, 20 Nov 2026)
  {id:'observe',name:'Watch someone (stay near them)',supported:true,needs:'observe',note:'Done once the player has stayed within the distance of that person for the seconds you set (and, with “too close”, never nearer: nearer and they notice; the count starts again). The person can be someone placed for this mission (People for this mission), someone the V1 camera identifies, or an NPC.'},
  {id:'overhear',name:'Overhear a conversation (eavesdrop)',supported:true,needs:'observe',note:'While the player stays within the distance (and not too close) the lines play as overheard subtitles, one by one. Walking away pauses it; too close: “they noticed you”, it starts again once the player backs off. Done when the last line is heard. Unlimited tries.'},
  {id:'sneak',name:'Sneak past the guards',supported:true,needs:'apt',note:'Reach the room (or use the thing) you choose in a place of this mission without being seen by its armed people (put them in a Neutral room so they do not shoot). Seen: SPOTTED, the player is put back outside the street door and tries again. “Without being seen” on other steps uses the same rule.'},
  {id:'collect',name:'Copy evidence to the V1',supported:true,needs:'evidence',note:'The document window opens when the player uses the thing you choose (a computer, a panel …), with COPY TO V1. The item is kept in the V1 Mission Log under the mission.'},
  {id:'report',name:'Report / send evidence to someone',supported:true,needs:'recipient',note:'The player presses REPORT on the mission in the V1 Mission Log (only with the evidence you list, and only inside the place you name when it is a hand-over in person). What is said is their reply: a Comms call, a message, or in person.'},
  {id:'call',name:'They call (a callback)',supported:true,needs:'lines',note:'Done by itself right after the step before it (after its delay: a timed callback). The lines arrive as an incoming Comms call (or a message) from that NPC.'},
  {id:'wait-game',name:'Wait in-game time',supported:true,needs:'minutes',note:'Waits the in-game minutes you set (12 in-game minutes are about a minute of play), counted from when this step starts; the player can explore or play other missions meanwhile.'},
  {id:'feed',name:'Watch a remote camera feed',supported:true,needs:'feed',note:'A camera feed of this mission, opened from the V1 (OPEN REMOTE FEED on the mission’s card). Stages: opened, watched to the end, recorded, saved. Closing or a reload never loses it: it can be opened again until it is saved.'},
  {id:'tail',name:'Follow someone at a distance',supported:true,needs:'observe',note:'Someone placed for this mission walks their route; the player keeps between “too close” and “lost beyond”. Lost or noticed: they go back to the start and the step starts again.'},
  {id:'apt-leave',name:'Leave a place of this mission',supported:true,needs:'apt',note:'Done once the player is out of that place (back on the street).'},
  {id:'flight',name:'Flight: board, take off, jump, dock',supported:true,needs:'stage',note:'The game’s own flight: board the ship at the pad, take off, make the jump (toward the place you choose), dock.'},
  {id:'v1-app',name:'Open an app on the V1',supported:true,needs:'app',note:'Done when the player opens the app you choose on the V1 (its tile glows in mission yellow). For tutorials: “Open your V1 and select the Ship Loadout app.”'},
  {id:'fight',name:'Win a fight',supported:false},{id:'scan',name:'Scan with WarFlying',supported:false},{id:'escort',name:'Escort someone',supported:false},
  {id:'pickup',name:'Pick something up in the world',supported:false},
  // mission timers (the owner, 19 Nov 2026: "mission timers. set the amount of time between actions, lines, etc")
  // ACCEPT / DENY anywhere in a mission (the owner, 19 Nov 2026): the mission waits for the player's answer (mission-content.js ASK_STEP)
  {id:'ask',name:'Ask the player: ACCEPT or DENY',supported:true,needs:'question',note:'The mission stops and asks the player your question with two buttons (your words; default ACCEPT and DENY). ACCEPT goes on to the next step (it can cost credits, once). DENY does what you choose: end the mission (it goes back to its giver), skip ahead to a later step, go back to an earlier step, or start another tree.'},
  {id:'wait',name:'Wait (a number of seconds)',supported:true,needs:'seconds',note:'The mission waits the seconds you set (1 to 600), then goes on to the next step. Optionally only while the player stays within a distance of someone. The clock stops in the pause menu, conversations and the KeyMap, and carries on after a reload.'}];
 /* What a mission can make available. supported: applied by the game when the mission (or the step named in `when`) is done. */
 const UNLOCK_KINDS=[
  {id:'credits',name:'Credits',supported:true},
  {id:'flag',name:'Story flag',supported:true,note:'Saved as story.flags.mf_<name> so it can never overwrite one of the game’s own flags.'},
  {id:'location',name:'Open route / place',supported:true,note:'The place and its system are added to what the player knows (universe.js discover); with a ship it is offered as a flight destination.'},
  {id:'ship',name:'Give the player a ship',supported:true,note:'The ship becomes the player’s (campaign.js awardStarterShip opens the pad, boarding and free travel; another hull is added as if bought: giveShip). It comes with its missile launcher fitted, a full rack of M1 missiles, and the Ship Loadout app on the player’s V1 (ordnance.js grant). A paid hull (Spectre) is never given.'},
  {id:'missiles',name:'Missiles (M1 or M2)',supported:true,note:'Rounds for the ship’s missile rack: M1 (standard, agile) or M2 (heavy, turns slowly), 1 to 30. Only as many as fit the rack are kept (Kestrel: 6 M1, 3 M2). Given to a player with no ship yet, they wait until the ship comes (its first rack is full anyway). Admin sells more once the player has a ship.'},
  {id:'item',name:'Store item (and its store)',supported:false,why:'No store reads a per-player list of unlocked items yet: the outfitter sells every listed module to everyone and Admin’s counter sells only the scrambler.'},
  {id:'gate',name:'Area or gate opens',supported:false,why:'Checkpoint gates are open or shut for everyone (ncz-quarters.js GATES); there is no per-player gate state.'},
  {id:'reputation',name:'Reputation with an NPC or a faction',supported:true,note:'An NPC: their standing with the player (story.relationships, -100 to 100). A faction: the faction standing (progression.reputation). Paid once with the mission.'},
  {id:'contact',name:'Add to the V1 contacts',supported:true,note:'The NPC is listed in the V1 (Social, PEOPLE YOU KNOW) from then on: story.flags.v1Contacts. Once only.'},
  {id:'follow',name:'Follow their Social profile',supported:true,note:'The player follows the NPC on Social (FOLLOWING), as if they had pressed FOLLOW: story.flags.socialFollowing. Only NPCs with a Social profile (district-people.js). Once only.'},
  {id:'nav-coords',name:'Unlock all nav coordinates',supported:true,note:'The flight Map app gets every location: a warp marker to every place in the system the player flies in, and to every other system they can reach (every Erebus and Tessaly System place becomes known; faction systems stay as their own story opened them). Before this a new pilot sees only the markers on the way to the mission (nav-coords.js). The V1 shows “NAV DATA RECEIVED”. Once only; nothing to choose.'},
  {id:'contract-flag',name:'Shared game flag',supported:true,note:'A flag other parts of the game read by its exact name (only the ones the game knows: rook-first-delivery-done, set when the first delivery to Rook is done). Once.'},
  {id:'evidence',name:'Evidence item',supported:true,note:'One of the missions’ evidence items (a document or recording) is added to the player’s V1, once.'},
  {id:'tree',name:'Start tree',supported:true,note:'Another of your trees starts: its first mission becomes available (its giver offers it). A tree that some link starts waits for that link.'},
  {id:'mission',name:'Another mission opens',supported:true,note:'Missions in a tree run in order: finishing one opens the next.'}];
 /* How a mission starts (the owner, 17 Nov 2026: "either have Missions start by notification or in person"). */
 const START_HOW=[{id:'person',name:'IN PERSON: the giver offers it when the player talks to them'},{id:'person-accept',name:'IN PERSON, ACCEPT / DENY: the giver offers it and the player chooses (DENY: offered again later unless set otherwise)'},{id:'notification',name:'BY NOTIFICATION: it arrives on the player’s device'}];
 const START_CHANNELS=[{id:'messages',name:'MESSAGES',note:'A text in the V1 Messages app (INBOX). No reply is needed.'},
  {id:'comms',name:'COMMS CALL',note:'A call in the Comms app: the sender and the words as a transcript. The voice plays only if a recorded clip exists for that exact line (nothing is generated).'},
  {id:'notify',name:'NOTIFICATION ONLY',note:'A banner on the screen, then the Mission Log. Nothing is kept in Messages or Comms.'}];
 const START_WHEN=[{id:'pod-exit',name:'First exit from the Sleeping Pod',note:'Also a character who left the pod before this mission existed: on their next pod exit.'},{id:'after-mission',name:'After a mission is completed'},
  {id:'place',name:'Entering a place'},{id:'leave',name:'Leaving a place'},{id:'flag',name:'A story flag is set'},
  {id:'near',name:'When walked near',note:'The mission starts when the player comes within this many metres of the person chosen (1 to 30; 5 if not set), without talking to them. Measured from where their TALK prompt is, so it follows people who move (Reverie and Lace). Checked four times a second while the player walks: never in a conversation, a cutscene, the character creator, the pod or the KeyMap. Once only; the missions before it in the tree must be done.'},
  {id:'game-time',name:'After in-game time',note:'N in-game hours / minutes after a mission is completed. The in-game clock runs 12 in-game minutes for every real minute of walking or flight with the game on screen (not menus, pause, conversations, a hidden tab or time offline): 6 in-game hours is about 30 minutes of play. Kept in the save, so it carries on after a reload or on another computer (game-clock.js).'}];
 /* "When walked near": the distance in metres (NEAR.min..NEAR.max, NEAR.def when not set). */
 const NEAR={min:1,max:30,def:5};
 const nearMetres=v=>{const n=typeof v==='string'&&v.trim()!==''?Number(v):v;return typeof n==='number'&&Number.isFinite(n)?Math.min(NEAR.max,Math.max(NEAR.min,Math.round(n*10)/10)):NEAR.def;};
 /* Givers with a shift (Reverie, Lace): are they out on the street at this moment (ms, UTC)? The street pair's own rule (ncz-street-pair.js onStreet: hours, and nobody
    for the first `arrive` seconds of a shift) when it is loaded; else the same rule from the shift here. Everyone else: always. */
 const SP=()=>typeof module!=='undefined'&&module.exports?require('./ncz-street-pair.js'):root.VoidStreetPair;
 // ms: the STREET clock (ncz-street-pair.js streetTime: the real time, or the simulated one of a draft test). streetTime(realMs) maps a real moment onto it.
 const streetTime=ms=>{const S=SP();return S&&S.streetTime?S.streetTime(ms??Date.now()):(ms??Date.now());};
 function onDuty(g,ms=streetTime()){const sh=g&&g.shift;if(!sh)return true;const S=SP();if(S&&S.onStreet){const w=S.onStreet(ms);return !!w&&w.id===g.id;}
  const d=new Date(ms),h=d.getUTCHours(),start=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate(),h<12?0:12);return h>=sh.hours[0]&&h<sh.hours[1]&&ms-start>=(sh.arrive||0)*1000;}
 const hh=h=>String(h%24).padStart(2,'0')+':00';
 function shiftText(g,ms=streetTime()){const sh=g&&g.shift;if(!sh)return '';const on=onDuty(g,ms),d=new Date(ms),h=d.getUTCHours(),next=h<sh.hours[0]?sh.hours[0]:sh.hours[0]+24;
  return 'Only while '+g.name+' is out on the street: '+hh(sh.hours[0])+' to '+hh(sh.hours[1])+' UTC every day (the first '+Math.round((sh.arrive||0)/60*10)/10+' minutes of a shift nobody is out yet). Her missions are offered only then: talking to her, or walking near her. '+(on?'She is out now.':'She is not out now (next shift from '+hh(next)+' UTC).');}
 const FLAG_PREFIX='mf_',FLAG=/^[a-zA-Z][a-zA-Z0-9_-]{0,47}$/;
 const nameOf=(id,reg,people,story,temple)=>reg[id]?.displayName||FACTS[id]?.name||people.get(id)?.name||story[id]?.name||(temple&&temple.id===id?temple.name:'')||id;
 /* Every registered NPC (voice registry, District residents, story characters, the temple's monk) with where they are today. src: {registry, people (district-people NPCS), story (characters), temple (MODEL)} */
 function roster(src={}){
  const reg=(src.registry&&src.registry.npcs)||{},people=new Map((src.people||[]).map(n=>[n.id,n])),story=src.story||{},temple=src.temple||null;
  // mission givers made in the editor (npc-made.js: content.characters, placed by content.npcs); an id the game already uses is never taken over (a made name card does not count)
  const MD=typeof module!=='undefined'&&module.exports?require('./npc-made.js'):root.VoidMadeNPCs,known=new Set([...Object.keys(FACTS),...Object.keys(reg),...people.keys(),...Object.keys(story).filter(id=>!story[id].made),...(temple?[temple.id]:[])]);
  const made=MD&&src.characters?MD.giverFacts(Object.fromEntries(Object.entries(src.characters).filter(([id])=>!known.has(id))),src.npcs||{}):{};
  const ids=[...new Set([...known,...Object.keys(made)])];
  const out=[];
  for(const id of ids){if(['news-anchor','commercial-announcer','the-function'].includes(id)||(reg[id]&&reg[id].broadcast))continue;
   const f=FACTS[id]||made[id],p=people.get(id),name=made[id]?made[id].name:nameOf(id,reg,people,story,temple),voice=reg[id]?{voice:reg[id].voice,status:reg[id].status}:null;
   let e;
   if(f)e={...f};
   else if(/^vr-/.test(id))e={group:D,where:'The District’s VR booths (vr-companions.js).',targets:[],players:false,draft:false,why:COMPANION};
   else if(p)e={group:D,where:(p.place||'The Darknet District')+' (district-people.js).',targets:[],players:false,draft:false,why:RESIDENT};
   else e={group:E,where:'Not placed in any scene the editor knows of.',targets:[],players:false,draft:false,why:'No TALK prompt for this character anywhere in the game (needs a code change).'};
   const canTalk=e.targets.length>0;
   out.push({id,name,say:/^[a-zA-Z][\w-]{0,63}$/.test(e.say||'')?e.say:id,kind:e.kind||'person',group:e.group,groupText:e.group===D?'in the current District game':'earlier character (not in the District today)',where:e.where,targets:e.targets,layout:e.layout||null,enter:e.enter||null,
    canTalk,players:!!(canTalk&&e.players),draft:!!(canTalk&&e.draft),photo:!!(e.photo||p),place:e.place||null,shift:e.shift?{hours:e.shift.hours.slice(),arrive:e.shift.arrive||0}:null,reach:e.reach||(e.group===D&&canTalk?'In the current District game.':''),why:e.why||'',note:e.note||'',voice,...(e.made?{made:true,role:e.role||'',model:e.model||null}:{}),
    sources:[e.made&&'content.characters (made in the editor)',reg[id]&&'npc-voice-registry.json',p&&'district-people.js',story[id]&&'story-content.js',temple&&temple.id===id&&'temple.js'].filter(Boolean)});}
  const rank=g=>g.group===D?0:1;
  return out.sort((a,b)=>rank(a)-rank(b)||(b.id==='admin')-(a.id==='admin')||(b.id==='iris')-(a.id==='iris')||a.name.localeCompare(b.name));
 }
 /* Plain words for the picker and the check screen. */
 function status(g){if(!g)return 'Not a known NPC.';
  if(!g.canTalk)return g.why||'Cannot be talked to in the game today (needs a code change).';
  const at=g.enter&&g.enter.location,play=g.draft?'A draft with them can be played now'+(g.group===E&&at?' (draft play starts at '+((PLACE.get(at)||{}).name||at)+')':'')+'.':'A draft with them cannot be played yet.';
  const pub=g.players?'Players can reach them today.'+(g.group===E&&g.reach?' '+g.reach:''):'Players cannot reach them today. '+(g.reach||'Their place is not open to a District player.');
  return (g.group===E?'Earlier character: '+g.where+' ':'')+play+' '+pub+(g.shift?' '+shiftText(g):'');}
 /* Which roster ids answer an interaction (action, and the clicked figure's character id for station people). */
 function whoAt(list,action,character){const out=[];for(const g of list)if(g.targets.some(t=>t.action===action&&(!t.character||t.character===character)))out.push(g.id);return out;}
 /* Which places the player is in right now. w: walkingLocation id, quarter: story.flags.quarter, location: state.location, docked: walking or docked at a station. */
 function placesNow({walk,area,quarter,location,docked}){const out=[];for(const p of PLACES){if(p.walk&&p.walk===walk&&(!p.area||p.area===area)&&(!p.quarter||p.quarter===quarter))out.push(p.id);else if(p.location&&p.location===location&&docked)out.push(p.id);}return out;}
 /* Every place id a mission may name: the "go to" places above and the named places of places.js (System > Planet > City > Area > Exact location). */
 const PL=()=>typeof module!=='undefined'&&module.exports?require('./places.js'):root.VoidPlaces;
 function placeIds(){const out=new Set(PLACES.map(p=>p.id));for(const id of (PL()&&PL().IDS)||[])if(!(PL().BY.get(id)||{}).group)out.add(id);return out;}
 /* Who a photo step can name: people the V1 camera identifies (the District's residents, Juno Vex). */
 const photoSubjects=list=>(list||[]).filter(g=>g.photo);
 const FACTIONS=['civilian','pirate','erebus-local','sol-local','communion','natural-order','neutral'];
 /* Items a "buy" step can name: modules a store actually sells (progression.js modules: not a reward, not switched off, with a vendor). */
 function buyable(modules){return Object.fromEntries(Object.entries(modules||{}).filter(([,m])=>m&&!m.reward&&m.available!==false&&(m.vendor===undefined||m.vendor)).map(([id,m])=>[id,m.name+' ('+((m.vendor||'outfitter')==='admin'?'Admin’s counter':'ship outfitter')+')']));}
 const api={NEAR,nearMetres,streetTime,onDuty,shiftText,START_HOW,START_CHANNELS,START_WHEN,FACTS,PLACES,PLACE,STEP_KINDS,UNLOCK_KINDS,FLAG_PREFIX,FLAG,FACTIONS,roster,status,whoAt,placesNow,placeIds,photoSubjects,buyable};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VoidMissionGivers=api;
})(typeof globalThis!=='undefined'?globalThis:this);
