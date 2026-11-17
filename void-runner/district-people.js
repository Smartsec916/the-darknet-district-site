/* Who is in The Darknet District: the named residents (NPCs) that the V1 lists beside real players, and the jobs a person can show on a profile.
   Pure data and small helpers; runs in the browser and in Node (tests/district-people.test.cjs). No network, no storage: a player's chosen jobs are kept in the
   save's story.flags.profileJobs (a short string), and are NOT yet sent to other players (the District server accepts no profile fields).
   To add a resident: add a line to NPCS with the id the scene uses for that figure (`crew`), a fixed crowd `look` or a creator `appearance`, and the `area`
   they are in ('interior' = inside the District, 'club' = NULL nightclub). The V1's Players list and Social app pick it up from here.
   DRAFT: every name, job and line below except Admin, Iris and Nyx was written by Claude on the owner's request (15 Nov 2026) and is his to change. */
(function(root){
 'use strict';
 // Jobs: the owner's list first (Smuggler .. Mechanic), then additions for him to keep or cut.
 const JOBS=[['smuggler','Smuggler'],['pirate','Pirate'],['mercenary','Mercenary'],['merchant','Merchant'],['influencer','Influencer'],['dancer','Dancer'],['dj','DJ'],['mechanic','Mechanic'],
  ['bounty-hunter','Bounty Hunter'],['courier','Courier'],['pilot','Pilot'],['hacker','Hacker'],['fixer','Fixer'],['info-broker','Info Broker'],['entrepreneur','Entrepreneur'],['bartender','Bartender'],['bodyguard','Bodyguard'],
  ['medic','Medic'],['salvager','Salvager'],['miner','Miner'],['engineer','Engineer'],['explorer','Explorer'],['racer','Racer'],['gambler','Gambler'],['musician','Musician'],
  ['street-vendor','Street Vendor'],['chef','Chef'],['tattoo-artist','Tattoo Artist'],['bouncer','Bouncer'],['vr-athlete','VR Athlete'],['companion','Companion'],['scavenger','Scavenger'],['drifter','Drifter']]
  .map(([id,label])=>({id,label}));
 const JOB=new Map(JOBS.map(j=>[j.id,j])),MAX_JOBS=2,FLAG='profileJobs';
 const jobLabel=id=>JOB.get(id)?.label||'';
 // Any input (a stored string, a list, junk) -> at most MAX_JOBS known job ids, no repeats, in the order given.
 function cleanJobs(v){const list=Array.isArray(v)?v:typeof v==='string'?v.split(','):[],out=[];for(const x of list){const id=String(x).trim();if(JOB.has(id)&&!out.includes(id))out.push(id);if(out.length>=MAX_JOBS)break;}return out;}
 const jobsText=ids=>cleanJobs(ids).map(jobLabel).join(' · ');
 const readJobs=flags=>cleanJobs(flags&&flags[FLAG]);
 function writeJobs(flags,ids){const c=cleanJobs(ids);if(!flags)return c;if(c.length)flags[FLAG]=c.join(',');else delete flags[FLAG];return c;}
 function toggleJob(ids,id){const c=cleanJobs(ids);if(!JOB.has(id))return c;if(c.includes(id))return c.filter(x=>x!==id);return c.length>=MAX_JOBS?c:[...c,id];}

 const AREAS={interior:'The Darknet District',club:'NULL nightclub, NeoChinatown',milked:'Milked, Far South'};
 const NPCS=[
  /* `model`: the character's own model file (assets/models/crowd/<model>.glb), drawn in the scene and in the profile picture instead of the creator look in `appearance`,
     which stays as the fallback if the file cannot be loaded. `scale` brings the file to the game's standard height. */
  {id:'admin',achievements:[['district-first-visit','2026-01-04']],name:'Admin',jobs:['merchant','mercenary'],area:'interior',place:'The Darknet District store',bio:'Runs the District store.',model:'npc-admin',scale:.99,
   appearance:{v:1,base:'male',look:'district-smuggler',hair:'short03',hairColor:'silver',clothingColor:'graphite',accessories:[]}},
  {id:'iris',achievements:[['district-first-visit','2026-01-04']],name:'Iris',jobs:['merchant','info-broker'],area:'interior',place:'The Darknet District store',bio:'Works the store counter beside Admin.',model:'npc-iris',scale:.99,
   appearance:{v:1,base:'female',look:'fixer-01',hair:'bob02',hairColor:'silver',clothingColor:'black',accessories:['gear-collar','gear-shoulders','gear-chest']}},
  /* Nyx (the owner, 16 Nov 2026: "The bartender NPC needs upgrading"): her own model, made with Meshy from his picture of her behind the oxygen bar. She has no creator look: if the file cannot be
     loaded the scene shows the plain stand-in figure she had before (neochinatown.js), never another character. */
  {id:'nyx-district',achievements:[['district-first-visit','2026-02-11']],name:'Nyx',jobs:['bartender'],area:'interior',place:'The bar and oxygen lounge',bio:'Behind the bar.',model:'npc-nyx',scale:1},
  {id:'rin-takeda',own:'npc-rin',achievements:[['district-first-visit','2026-06-30']],crew:'crew-bar1',look:'district-resident',name:'Rin Takeda',jobs:['influencer'],area:'interior',place:'The bar and oxygen lounge',bio:'Usually at the bar.'},
  {id:'jonah-pike',own:'npc-jonah',achievements:[['district-first-visit','2026-03-08'],['rook-three-runs','2026-08-15']],crew:'crew-bar2',look:'outlaw-01',name:'Jonah Pike',jobs:['smuggler'],area:'interior',place:'The bar and oxygen lounge',bio:'Keeps to the back of the lounge.'},
  {id:'sable-quon',own:'npc-sable',achievements:[['district-first-visit','2026-05-21'],['blackout-score','2026-09-03']],crew:'crew-vr-watch',look:'hacker-01',name:'Sable Quon',jobs:['influencer','hacker'],area:'interior',place:'VR play area',bio:'Watches the VR booths.'},
  {id:'cade-moreno',achievements:[['district-first-visit','2026-04-17'],['blackout-score','2026-07-29']],crew:'vr-player-a',look:'vr-player-a',name:'Cade Moreno',jobs:['mercenary','vr-athlete'],area:'interior',place:'VR play area, booth one',bio:'In the shooter booth most nights.'},
  {id:'lumi-ashby',achievements:[['district-first-visit','2026-07-06'],['tropical-100-fish','2026-10-28']],crew:'vr-player-b',look:'vr-player-b',name:'Lumi Ashby',jobs:['dancer','influencer'],area:'interior',place:'VR play area, booth two',bio:'In the social booth: dancing, eating, talking to someone only they can see.'},
  {id:'kei-navarro',own:'npc-kei',achievements:[['district-first-visit','2026-08-01']],crew:'crew-hall-talk1',look:'district-smuggler',name:'Kei Navarro',jobs:['courier'],area:'interior',place:'The hallway',bio:'Talking in the hallway.'},
  {id:'mags-oduya',own:'npc-mags',achievements:[['district-first-visit','2026-02-27']],crew:'crew-hall-talk2',look:'district-resident',name:'Mags Oduya',jobs:['mechanic'],area:'interior',place:'The hallway',bio:'Talking in the hallway.'},
  {id:'tavi-rourke',own:'npc-tavi',achievements:[['district-first-visit','2026-09-12']],crew:'crew-hall-talk3',look:'hacker-01',name:'Tavi Rourke',jobs:['influencer'],area:'interior',place:'The hallway',bio:'Hangs about near the bar door.'},
  {id:'bishop-hale',own:'npc-bishop',achievements:[['district-first-visit','2026-03-19']],crew:'crew-hall-watch1',look:'outlaw-01',name:'Bishop Hale',jobs:['bodyguard'],area:'interior',place:'The hallway',bio:'Watches the hallway by the arcade.'},
  /* Dax (the owner, 15 Nov 2026): there is only one. Her model is a licensed one drawn by dax.js, which also says where she is at any moment (`live`); her profile picture is a
     labelled silhouette until one is made from her own model. DRAFT: the line about her is Claude's. */
  {id:'dax',achievements:[['arcade-top-blackout-protocol','2026-10-19'],['arcade-top-corporate-zombies','2026-11-02'],['arcade-top-underground-overdrive','2026-11-13'],['rook-three-runs','2026-09-27']],name:'Dax',jobs:['bounty-hunter','mercenary'],area:'interior',place:'Comes and goes',bio:'Bounty hunter. Watches more than she talks.',device:'v3',live:'dax'},
  {id:'dj-vanta',crew:'dj',name:'DJ Vanta',jobs:['dj'],area:'club',place:'NULL nightclub, NeoChinatown',bio:'Plays the desk at NULL.'},
  /* Fish (Mission 003 — Corporate Connections, 17 Nov 2026): the player follows her Social profile and has her as a V1 contact after meeting her. Her figure in Milked is drawn by
     milked-build.js (this entry draws nothing); her picture is her own model. Job tag Entrepreneur and bio in her own words, both the owner's, 18 Nov 2026: they hide her intel work. */
  {id:'milked-fish',name:'Fish',jobs:['entrepreneur'],area:'milked',place:'Milked, Far South',bio:'I\'m a dancer and the CEO at Milked',model:'npc-fish'}
 ].map(n=>Object.freeze({...n,jobs:cleanJobs(n.jobs)}));
 /* A resident's achievements (the owner, 15 Nov 2026: "some NPCs will have Achievements, although most will be easy ones"; Dax holds every arcade high score and three
    cargo runs for Rook). Each is [achievement id, the day it was earned]. They are part of who the resident is, not earned in play. DRAFT: which resident has which, and the
    dates, are Claude's except Dax's list. Returns [{id, at}] for achievements.js profileList(). */
 const achievementsOf=id=>((NPCS.find(n=>n.id===id)||{}).achievements||[]).map(([a,day])=>({id:a,at:Date.parse(day+'T12:00:00Z')||0}));
 const BY_ID=new Map(NPCS.map(n=>[n.id,n])),BY_CREW=new Map(NPCS.filter(n=>n.crew).map(n=>[n.crew,n]));
 const npc=id=>BY_ID.get(id)||null;
 const npcs=area=>area?NPCS.filter(n=>n.area===area):NPCS.slice();
 // The fixed look of a named resident's figure, so the same person has the same face on every visit (crowd.js asks here before dealing a random look).
 /* `own`: a resident's own model (assets/models/crowd/<own>.glb, made with Meshy: docs/development/MESHY_CHARACTERS.md). It is who they are in the scene and in their
    profile picture; `look` is the crowd figure they had before, kept as a record. */
 const lookFor=crewId=>{const n=BY_CREW.get(crewId);return n?n.own||n.look||null:null;};
 /* Following (the owner, 15 Nov 2026): people a player chose to follow, by aiming the V1 camera at them. Kept in the save as one short string
    (story.flags.socialFollowing): 'n:<resident id>' or 'p:<public player id>:<handle>', comma separated, newest last, oldest dropped when it would pass 200 characters. */
 const FOLLOW_FLAG='socialFollowing',FOLLOW_KEY=/^(n:[a-z][a-z0-9-]{0,39}|p:[0-9a-f]{1,12}:[A-Za-z0-9_]{3,20})$/;
 function readFollowing(flags){const out=[];for(const part of String(flags&&flags[FOLLOW_FLAG]||'').split(',')){if(!FOLLOW_KEY.test(part)||out.some(f=>f.key===part.split(':').slice(0,2).join(':')))continue;const [kind,id,name]=part.split(':');
   if(kind==='n'){const n=BY_ID.get(id);if(n)out.push({key:'n:'+id,kind:'npc',id,name:n.name});}else out.push({key:'p:'+id,kind:'player',id,name});}return out;}
 const followPart=f=>f.kind==='npc'?'n:'+f.id:'p:'+f.id+':'+f.name;
 function writeFollowing(flags,list){let l=list.slice();while(l.length&&l.map(followPart).join(',').length>200)l.shift();if(l.length)flags[FOLLOW_FLAG]=l.map(followPart).join(',');else delete flags[FOLLOW_FLAG];return l;}
 /* who: {kind:'npc', id} or {kind:'player', id (public id), name (handle)}. Returns true when now following, false when unfollowed or refused. */
 function toggleFollow(flags,who){if(!flags||!who)return false;const part=who.kind==='npc'?'n:'+who.id:'p:'+String(who.id).replace(/[^0-9a-f]/g,'').slice(0,12)+':'+who.name;if(!FOLLOW_KEY.test(part)||(who.kind==='npc'&&!BY_ID.has(who.id)))return false;
  const key=part.split(':').slice(0,2).join(':'),l=readFollowing(flags);if(l.some(f=>f.key===key)){writeFollowing(flags,l.filter(f=>f.key!==key));return false;}
  const [kind,id,name]=part.split(':');l.push(kind==='n'?{key,kind:'npc',id,name:BY_ID.get(id).name}:{key,kind:'player',id,name});writeFollowing(flags,l);return true;}
 const isFollowing=(flags,key)=>readFollowing(flags).some(f=>f.key===key);
 /* House rule (the owner, 15 Nov 2026): the District is shielded, and scanning inside it is rude. When someone comes in with the WarFlying app ACTIVE, Admin or Iris
    notices, walks over and tells them to deactivate it. Admin goes half the time and Iris the other half; if Admin is not in the District, Iris always goes.
    DRAFT: the two lines are Claude's wording of the owner's instruction ("tell them it's rude and to Deactivate it in the App"). They are voiced with ElevenLabs
    (the owner, 15 Nov 2026) and the recordings are kept in the game's assets. */
 const ETIQUETTE={noticeAfter:2.5,speed:1.5,stopAt:1.7,talkFor:7,
  // who says it and the words (spoken with a stored recording: assets/audio/voice/extra; the caption is `who: text`)
  spoken:{admin:['Admin','Scanning in here is rude. Open WarFlying on your device and deactivate it.'],iris:['Iris','You are scanning inside the District. That is rude. Deactivate WarFlying in the app.']},   /* [speaker, words]: kept as a pair so the Kokoro line extractor does not take these for its own lines */
  lines:{admin:'Admin: Scanning in here is rude. Open WarFlying on your device and deactivate it.',iris:'Iris: You are scanning inside the District. That is rude. Deactivate WarFlying in the app.'},
  // who goes: r is a random number 0..1
  who(adminHere,irisHere,r){return adminHere&&irisHere?(r<.5?'admin':'iris'):irisHere?'iris':adminHere?'admin':null;},
  /* The way out from behind the shop counter (District plan metres: counter x 6..14 at z 47.2, the shop opens onto the hallway at x 3) to a point by the player:
     round the nearer end of the counter, across the shop floor to the hallway, then along it. Returns [[x,z],...] not including the start. */
  path(from,to){const end=from[0]<10?4.9:15.1,p=[[end,from[1]],[end,45.4],[2.2,45.4]],tx=Math.max(-2.2,Math.min(2.2,to[0])),inHall=Math.abs(to[0])<=3.2;
   if(inHall){p.push([tx,to[1]]);}else{p.push([Math.max(-1.5,Math.min(1.5,to[0])),to[1]],[to[0],to[1]]);}return p;}};
 const api={achievementsOf,ETIQUETTE,FOLLOW_FLAG,readFollowing,toggleFollow,isFollowing,JOBS,MAX_JOBS,FLAG,AREAS,NPCS,jobLabel,cleanJobs,jobsText,readJobs,writeJobs,toggleJob,npc,npcs,lookFor};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VoidDistrictPeople=api;
})(typeof globalThis!=='undefined'?globalThis:this);
