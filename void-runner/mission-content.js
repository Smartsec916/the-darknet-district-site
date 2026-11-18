/* MISSION CONTENT ADAPTER (pure rules: browser and Node tests; no network, no storage, no DOM).
   ONE adapter puts edited mission content over the shipped missions, used both by the Mission Editor's "PLAY THIS DRAFT" (owner only, a throwaway session)
   and by published live content (every player, fetched from the server by live-content.js). It never invents a second mission engine: it only rewrites the
   records the existing runners already read (void-runner/beginner.js MISSIONS for the beginner campaign, VoidMissions.definitions for the registry missions).
   What it can apply (everything else is listed by notApplied() in plain words, never faked):
     beginner  [mission records in the beginner.js / Studio shape]  titles, descriptions, steps (label, completion event, order/requires, place), what each NPC says
                                                                     when a step is done and the "too soon" line, the credits paid, the ship award, missions added
     registry  {id:{title,description,objectives:{id:label}}}         the V1 Mission Log text of the older registry missions (mission-log.js)
     lines     [{who,from,to}]                                         any NPC line shown through the dialogue window (scenes.js talk() → renderLine()): the line whose
                                                                     speaker and words match `from` is shown as `to`. Its recorded voice clip no longer matches, so it is
                                                                     shown as text (the game's existing behaviour for a line without a clip) until it is re-voiced.
     trees     [{id,name,note,missions:[...]}]                         the owner's NEW mission trees (ids start with draft-). Each mission is given by an NPC the game has a TALK
                                                                     prompt for; its steps are talk / go to a place / deliver / buy; it ends with a hand-in NPC (optional); its
                                                                     unlocks are credits, story flags (mf_<name>), places that open, the courier hull. Missions run in order.
                                                                     They are ordinary mission records (universe.missions) plus story.flags.mt_<id>, which clean_save() accepts.
     names     {treeId:name}                                           display names of trees (renames; ids never change).
   THE MAIN STORYLINE (main-story.js) is a SHIPPED tree run by the same tree engine: content.trees may carry an edited copy (same id, main-storyline), which replaces
   the shipped one; without it the shipped tree runs. Its missions may start by notification (HOW A MISSION STARTS, below) instead of being
   offered by the giver, and have three more step kinds: 'pod-exit', 'message' (the mission's notification arrives; automatic) and 'hear' (the giver's lines after a talk step;
   done when the conversation closes).
   HOW A MISSION STARTS (the owner, 17 Nov 2026: "either have Missions start by notification or in person"): start {how:'person'} (default: the giver offers it when
   talked to) or {how:'notification', channel:'messages'|'comms'|'notify', from:<NPC>, header, text, when:{kind:'pod-exit'|'after-mission'|'place'|'flag', mission|place|flag,value}}:
   the mission arrives on the player's device when `when` happens (Messages: a text in the V1 inbox; Comms: a call with its transcript; notify: a banner only). MISSION NUMBERS: every tree mission may carry `number` (1-999, shown "Mission 001 — Name"); numbers are unique and never reused (main-story.js
   NUMBERS and the server's published ledger). Story-tree missions must have one. Lines that are placeholders ("[Write ...") are shown only in draft play.
   EYES ON THE STREET (Mission 002, 17 Nov 2026) added reusable pieces: an in-person start with ACCEPT / NOT NOW (start {how:'person', accept:true}: the offer is shown with
   a choice; nothing is taken until ACCEPT; a player who declines gets the offer again next time), step kinds 'enter' / 'leave' (a place from places.js: done while the
   player is inside / outside it, so a player already inside when the step starts is counted), 'photo' (a capture whose photo really shows the NPC: device-camera.js
   judges it at the moment of capture) and 'send-photo' (a photo of `subject`, taken during this mission, sent in Messages to `npc`; `say` is the reply to the right photo,
   `wrong` to any other; unlimited tries), a step's lines delivered `via` 'comms' or 'messages' instead of the dialogue window, a 'leave' trigger, and the unlock
   'reputation' (id: an NPC → story.relationships[id], or a faction → progression.reputation[id]; amount -100..100; both are kept by clean_save()).
   Content shape: {format:'darknet-district-mission-content',version:1,beginner?:[...],registry?:{...},lines?:[...],trees?:[...],names?:{...}}. Unknown fields are refused, never ignored. */
(function(root){
 'use strict';
 const MS=typeof module!=='undefined'&&module.exports?require('./main-story.js'):root.VoidMainStory;
 const PL=typeof module!=='undefined'&&module.exports?require('./places.js'):root.VoidPlaces;
 const GC=typeof module!=='undefined'&&module.exports?require('./game-clock.js'):root.VoidClock;
 const DPL=()=>typeof module!=='undefined'&&module.exports?require('./district-people.js'):root.VoidDistrictPeople;
 const GVS=()=>typeof module!=='undefined'&&module.exports?require('./mission-givers.js'):root.VoidMissionGivers;
 const NPX=()=>typeof module!=='undefined'&&module.exports?require('./npc-paths.js'):root.VoidNPCPaths;
 const NPV=()=>typeof module!=='undefined'&&module.exports?require('./npc-voices.js'):root.VoidNPCVoices;
 const NPL=()=>typeof module!=='undefined'&&module.exports?require('./npc-looks.js'):root.VoidNPCLooks;   // NPC looks (Developer Tools > NPCs > Appearance)   // ElevenLabs voice choices (Developer Tools > NPCs, giver card)   // NPC placement, paths and "Giver waits at" (Developer Tools > NPCs)
 /* "When walked near" (the owner, 18 Nov 2026): when:{kind:'near', npc (default: the giver), distance (metres, 1..30, default 5)}. The game measures the player's distance to that
    person's TALK prompt (live-content.js, four times a second) and sends {type:'near', near:{<npc>: metres}}; the mission starts once, in tree order. */
 const NEAR={min:1,max:30,def:5},nearMetres=v=>{const G=GVS();if(G&&G.nearMetres)return G.nearMetres(v);return typeof v==='number'&&Number.isFinite(v)?Math.min(NEAR.max,Math.max(NEAR.min,v)):NEAR.def;};
 /* Every "when walked near" trigger in the trees: [{tree, mission, npc, metres}] (the game watches only these people). */
 function nearList(trees){const out=[];for(const t of trees||[])for(const m of (t&&t.missions)||[]){const st=m&&m.start,w=st&&st.how==='notification'&&st.when;if(w&&w.kind==='near'&&(w.npc||m.giver))out.push({tree:t.id,mission:m.id,npc:w.npc||m.giver,metres:nearMetres(w.distance)});}return out;}
 /* Is the player near enough? d: metres to that person (Infinity / undefined: not in this scene). */
 const nearHit=(d,metres)=>typeof d==='number'&&Number.isFinite(d)&&d<=nearMetres(metres);
 const FORMAT='darknet-district-mission-content',VERSION=1;
 const ID=/^[a-z][a-z0-9-]{0,79}$/,TAGS=/<[^>]*>|[\u0000-\u0008\u000b\u000c\u000e-\u001f]/;
 // The events the beginner runner fires (beginner-integration.js); the same list as the Developer Studio (admin/studio-model.js EVENTS, checked by a test).
 const EVENTS=['v1-open','keymap-seen','talk-admin','talk-iris','visit-bar','visit-shop','use-terminal','board-ship','launch','warp-meridian','dock-meridian'];
 const TYPES=['main','side','cargo','campaign','tutorial','bounty','station'],AWARDS=['ship'],DESTINATIONS=['earth','meridian'];
 const SPEAKERS=['Admin','Iris','Landing terminal','You','Bartender'];   // the beginner campaign's on-screen speakers (studio-model.js SPEAKERS)
 const LIMIT={lineEdits:600,missions:40,objectives:20,lines:12,text:500,title:60,description:600,registry:60,credits:100000,subjects:6};
 const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
 const plain=(v,max)=>typeof v==='string'&&v.trim().length>0&&v.length<=max&&!TAGS.test(v);
 const keysOk=(o,allowed)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).every(k=>allowed.includes(k));
 /* Strict check of a content record. ctx: {speakers:Set of extra speaker names (registry display names), registryIds:Set, interactions:Set (optional)}.
    Returns {ok, errors:[plain text]}; a record with any error is never applied. */
 function check(content,ctx={}){
  const errors=[],err=t=>errors.push(t),speakers=new Set([...SPEAKERS,...(ctx.speakers||[])]);
  if(!keysOk(content,['format','version','beginner','registry','lines','note','trees','names','npcs','voices','looks']))return {ok:false,errors:['The content record has an unknown shape.']};
  if(content.format!==FORMAT||content.version!==VERSION)err('Unknown content format or version.');
  if(content.npcs!=null){const X=NPX();if(!X)err('NPC placements cannot be checked here.');else for(const p of X.checkAll(content.npcs))err(p);}
  if(content.looks!=null){const L=NPL();if(!L)err('NPC looks cannot be checked here.');else for(const p of L.problems(content.looks,{inventory:ctx.lookInventory}))err(p);}
  if(content.voices!=null){const V=NPV();if(!V)err('Voice choices cannot be checked here.');else for(const p of V.problems(content.voices,{registry:ctx.registry}))err(p);}
  if(content.note!=null&&!(typeof content.note==='string'&&content.note.length<=500&&!TAGS.test(content.note)))err('The change note must be plain text (500 characters at most).');
  if(content.beginner!=null){
   const list=content.beginner;
   if(!Array.isArray(list)||!list.length||list.length>LIMIT.missions)err('The beginner campaign needs between 1 and '+LIMIT.missions+' missions.');
   else{
    const ids=new Set();
    for(const m of list){
     const w=(m&&m.id)||'(no id)';
     if(!keysOk(m,['id','title','type','giver','description','destination','rewards','prerequisites','objectives'])){err(w+': unknown fields in a mission.');continue;}
     if(!ID.test(m.id||''))err(w+': mission id must be lowercase letters, digits and hyphens.');if(ids.has(m.id))err(w+': duplicate mission id.');ids.add(m.id);
     if(!plain(m.title,LIMIT.title))err(w+': a title is required (60 characters at most, no HTML).');
     if(!TYPES.includes(m.type))err(w+': unknown mission type.');
     if(m.giver!=null&&!speakers.has(m.giver))err(w+': giver "'+m.giver+'" is not a known NPC or speaker.');
     if(m.description!=null&&!(typeof m.description==='string'&&m.description.length<=LIMIT.description&&!TAGS.test(m.description)))err(w+': the description must be plain text (600 characters at most).');
     if(m.destination!=null&&!DESTINATIONS.includes(m.destination))err(w+': unknown location "'+m.destination+'".');
     if(m.rewards!=null&&!(Number.isInteger(m.rewards)&&m.rewards>=0&&m.rewards<=LIMIT.credits))err(w+': credits must be a whole number between 0 and 100000.');
     if(m.prerequisites!=null&&!(Array.isArray(m.prerequisites)&&m.prerequisites.every(p=>ID.test(p))))err(w+': prerequisites must be mission ids.');
     if(!Array.isArray(m.objectives)||!m.objectives.length||m.objectives.length>LIMIT.objectives){err(w+': a mission needs 1 to 20 steps.');continue;}
     const oids=new Set();
     for(const o of m.objectives){
      const ow=w+' / '+((o&&o.id)||'?');
      if(!keysOk(o,['id','label','on','requires','interaction','destination','award','say','early'])){err(ow+': unknown fields in a step.');continue;}
      if(!ID.test(o.id||''))err(ow+': step id must be lowercase letters, digits and hyphens.');if(oids.has(o.id))err(ow+': duplicate step id.');oids.add(o.id);
      if(!plain(o.label,LIMIT.text))err(ow+': the step needs a label (plain text).');
      if(!EVENTS.includes(o.on))err(ow+': nothing in the game can complete this step (unknown or missing completion event).');
      if(o.requires!=null&&!(Array.isArray(o.requires)&&o.requires.every(r=>ID.test(r))))err(ow+': "requires" must list step ids.');
      if(o.interaction!=null&&!(typeof o.interaction==='string'&&/^[a-z][a-z0-9-]{0,60}$/.test(o.interaction)&&(!ctx.interactions||ctx.interactions.has(o.interaction)||o.interaction==='board')))err(ow+': unknown place "'+o.interaction+'".');
      if(o.destination!=null&&!DESTINATIONS.includes(o.destination))err(ow+': unknown location.');
      if(o.award!=null&&!AWARDS.includes(o.award))err(ow+': the only award the game can give at a step is the ship.');
      for(const k of ['say','early']){const lines=o[k];if(lines==null)continue;
       if(!Array.isArray(lines)||lines.length>LIMIT.lines){err(ow+': too many lines.');continue;}
       for(const l of lines){if(!keysOk(l,['who','text'])||!plain(l.text,LIMIT.text))err(ow+': a line must be plain text (500 characters at most).');else if(!speakers.has(l.who))err(ow+': speaker "'+l.who+'" is not a known NPC or speaker.');}}
     }
     for(const o of m.objectives)for(const r of (o&&o.requires)||[])if(!oids.has(r))err(w+' / '+o.id+': requires "'+r+'", which is not a step of this mission.');
     const loop=(id,seen)=>{if(seen.has(id))return true;const o=m.objectives.find(x=>x.id===id);return !!o&&(o.requires||[]).some(r=>loop(r,new Set([...seen,id])));};
     for(const o of m.objectives)if(o&&o.id&&loop(o.id,new Set()))err(w+' / '+o.id+': its requirements loop back to itself.');
    }
    for(const m of list)for(const p of (m&&m.prerequisites)||[])if(!ids.has(p))err((m.id||'?')+': prerequisite "'+p+'" does not exist.');
    const by=new Map(list.map(m=>[m&&m.id,m])),loop=(id,seen)=>{if(seen.includes(id))return true;const m=by.get(id);return !!m&&(m.prerequisites||[]).some(p=>loop(p,[...seen,id]));};
    for(const m of list)if(m&&loop(m.id,[]))err((m.id||'?')+': prerequisites form a loop.');
    if(list.filter(m=>m&&!(m.prerequisites||[]).length).length!==1)err('Exactly one beginner mission must be able to start first.');
   }
  }
  if(content.registry!=null){
   const reg=content.registry;
   if(!keysOk(reg,Object.keys(reg||{}))||Array.isArray(reg)||Object.keys(reg).length>LIMIT.registry)err('Registry edits have an unknown shape.');
   else for(const [id,e] of Object.entries(reg)){
    if(!ID.test(id)||(ctx.registryIds&&!ctx.registryIds.has(id))){err('"'+id+'" is not an existing registry mission.');continue;}
    if(!keysOk(e,['title','description','objectives'])){err(id+': unknown fields.');continue;}
    if(e.title!=null&&!plain(e.title,LIMIT.title))err(id+': the title must be plain text (60 characters at most).');
    if(e.description!=null&&!(typeof e.description==='string'&&e.description.length<=LIMIT.description&&!TAGS.test(e.description)))err(id+': the description must be plain text.');
    if(e.objectives!=null){if(!keysOk(e.objectives,Object.keys(e.objectives||{}))||Array.isArray(e.objectives))err(id+': step labels have an unknown shape.');
     else for(const [oid,label] of Object.entries(e.objectives)){if(!ID.test(oid)||(ctx.registryObjectives&&!(ctx.registryObjectives[id]||new Set()).has(oid)))err(id+': "'+oid+'" is not one of its steps.');if(!plain(label,LIMIT.text))err(id+' / '+oid+': the label must be plain text.');}}
   }
  }
  if(content.lines!=null){
   if(!Array.isArray(content.lines)||content.lines.length>LIMIT.lineEdits)err('Line edits have an unknown shape (at most '+LIMIT.lineEdits+').');
   else{const seen=new Set();for(const l of content.lines){if(!keysOk(l,['who','from','to'])||!/^[a-z][a-z0-9-]{0,40}$/.test(l.who||'')||!plain(l.from,LIMIT.text)||!plain(l.to,LIMIT.text)){err('A changed line must name a speaker and be plain text (500 characters at most).');continue;}
    if(l.who==='player')err('The player’s own lines are not changed here.');const k=l.who+'|'+l.from;if(seen.has(k))err('The same line is changed twice.');seen.add(k);if(ctx.lines&&!ctx.lines.has(k))err('“'+l.from.slice(0,40)+'…” is not a line in the game.');}}
  }
  if(content.names!=null){const n=content.names;if(!n||typeof n!=='object'||Array.isArray(n)||Object.keys(n).length>60)err('Tree names have an unknown shape.');
   else for(const [id,name] of Object.entries(n)){if(!ID.test(id)||(ctx.treeIds&&!ctx.treeIds.has(id)&&!(content.trees||[]).some(t=>t&&t.id===id)))err('"'+id+'" is not a mission tree.');if(!plain(name,LIMIT.title))err('A tree name must be plain text (60 characters at most).');}}
  if(content.trees!=null)checkTrees(content.trees,ctx,err);
  return {ok:!errors.length,errors};
 }
 // ---------------------------------------------------------------- the owner's new trees
 const DRAFT=/^draft-[a-z0-9][a-z0-9-]{0,53}$/,STEP_KINDS=['talk','go','arrive','deliver','buy','pod-exit','message','hear','enter','leave','photo','send-photo','await-call'],HOW=['person','notification'],CHANNELS=['messages','comms','notify'],WHEN=['pod-exit','after-mission','place','leave','flag','game-time','near'],AUTO=['message','await-call'],STORY_FLAG=/^[a-zA-Z][\w-]{0,63}$/,UNLOCKS=['credits','flag','location','ship','tree','reputation','contact','follow'],FLAGNAME=/^[a-zA-Z][a-zA-Z0-9_-]{0,47}$/;
 const VIA=['talk','comms','messages'],FACTIONS=['civilian','pirate','erebus-local','sol-local','communion','natural-order','neutral'];   // factions a reputation unlock may name (factions.js, without 'player'; void_runner_progression.py keeps the same list)
 const treeFlag=id=>'mt_'+id,linkFlag=id=>'ts_'+id;
 // Ids: an owner tree starts with draft-; a shipped story tree is listed in main-story.js. Story missions: m<NNN>-<name> or <story tree>-m<n> (made by the editor).
 const STORY=new Set((MS&&MS.STORY_TREES)||[]),STORY_MISSION=/^(m\d{3}-[a-z0-9][a-z0-9-]{0,50}|main-storyline-m\d{1,3})$/;
 const treeIdOk=id=>typeof id==='string'&&(DRAFT.test(id)||STORY.has(id)),missionIdOk=id=>typeof id==='string'&&(DRAFT.test(id)||STORY_MISSION.test(id));
 const placeholder=t=>!!(MS&&MS.isPlaceholder(t));
 // Players never see mission numbers (the owner, 17 Nov 2026: "I want it to be just 'Awakening' in Mission logs. Mission 001 is the backend numbering system").
 // The number stays in the data (definition.number) for the Mission Editor, Developer Tools and the server; everything a player sees uses the name.
 const titleOf=m=>m.title;
 const devLabel=m=>MS?MS.label(m.number,m.title):m.title;
 /* How a mission starts (closed shape). In person needs nothing else; by notification needs a channel, a sender, the text (a header for Messages and Comms) and a trigger. */
 function checkStart(st,w,ctx,err,speakerOk,trees){
  if(!keysOk(st,['how','channel','from','header','text','when','accept'])||!HOW.includes(st.how)){err(w+': unknown way of starting.');return;}
  if(st.accept!=null&&(typeof st.accept!=='boolean'||st.how!=='person'))err(w+': only a mission offered in person can be accepted or declined.');
  if(st.how==='person'){if(Object.keys(st).some(k=>k!=='how'&&k!=='accept'))err(w+': a mission given in person has no notification fields.');return;}
  if(!CHANNELS.includes(st.channel))err(w+': unknown notification channel.');
  if(typeof st.from!=='string'||st.from==='You'||!speakerOk(st.from))err(w+': the notification must come from a known NPC.');
  if(st.channel!=='notify'&&!plain(st.header,80))err(w+': the notification needs a header (plain text, 80 characters at most).');else if(st.header!=null&&!plain(st.header,80))err(w+': the header must be plain text (80 characters at most).');
  if(!plain(st.text,LIMIT.text))err(w+': the notification needs its text (plain text, 500 characters at most).');
  const x=st.when;if(!keysOk(x,['kind','mission','place','flag','value','npc','distance'])||!WHEN.includes(x.kind)){err(w+': the notification needs a trigger it knows.');return;}
  // "after N in-game hours / minutes" (Mission 003, 17 Nov 2026): value = IN-GAME minutes (1..10080, a week) after the mission named here was completed (game-clock.js)
  if(x.kind==='game-time'&&!(Number.isInteger(x.value)&&x.value>=1&&x.value<=10080))err(w+': “after in-game time” needs a whole number of in-game minutes from 1 to 10080 (a week).');
  if(x.kind==='after-mission'||x.kind==='game-time'){const ids=new Set([...(trees||[]).flatMap(t=>((t&&t.missions)||[]).map(y=>y&&y.id)),...(ctx.registryIds||[]),...((MS&&MS.MISSION_IDS)||[])]);/* the shipped story's missions always exist */if(typeof x.mission!=='string'||!ID.test(x.mission)||(trees&&!ids.has(x.mission)))err(w+': “after mission” must name a mission that exists.');}
  if(x.kind!=='near'&&(x.npc!=null||x.distance!=null))err(w+': only “when walked near” names a person and a distance.');
  if(x.kind==='near'){if(x.npc!=null&&(typeof x.npc!=='string'||(ctx.givers&&!(ctx.givers.get(x.npc)||{}).canTalk)))err(w+': “when walked near” must name someone the game has a TALK prompt for.');
   if(x.distance!=null&&!(typeof x.distance==='number'&&Number.isFinite(x.distance)&&x.distance>=NEAR.min&&x.distance<=NEAR.max))err(w+': “when walked near” needs a distance from 1 to 30 metres.');}
  if((x.kind==='place'||x.kind==='leave')&&(typeof x.place!=='string'||(ctx.places&&!ctx.places.has(x.place))))err(w+': unknown trigger place "'+x.place+'".');
  if(x.kind==='flag'){if(!STORY_FLAG.test(x.flag||''))err(w+': the trigger flag must be a story flag name (letters, digits, - or _).');if(!(typeof x.value==='boolean'||(typeof x.value==='string'&&x.value.length<=200&&!TAGS.test(x.value))||Number.isSafeInteger(x.value)))err(w+': the trigger flag value must be true/false, a number or short text.');}}
 /* Trees another tree starts (a "start tree" unlock): their first mission waits until the link fires (story.flags.ts_<tree id>). */
 const linked=trees=>new Set((trees||[]).flatMap(t=>(t.missions||[]).flatMap(m=>(m.unlocks||[]).filter(u=>u&&u.kind==='tree').map(u=>u.id))));
 /* ctx: givers (Map id → {canTalk}), places (Set), items (Set: buyable module ids), locations (Set), ships (Map id → {premium}), registryIds (Set: ids a draft id may not take). */
 function checkTrees(trees,ctx,err){
  if(!Array.isArray(trees)||trees.length>10){err('New trees have an unknown shape (10 at most).');return;}
  const tids=new Set(),mids=new Set(),all=new Set(trees.map(t=>t&&t.id));let total=0;
  const npcOk=id=>typeof id==='string'&&(!ctx.givers||(ctx.givers.get(id)||{}).canTalk===true);
  const speakerOk=id=>id==='You'||(typeof id==='string'&&(!ctx.givers||ctx.givers.has(id)));
  const subjectOk=id=>typeof id==='string'&&/^[a-z][a-z0-9-]{0,40}$/.test(id)&&(!ctx.subjects||ctx.subjects.has(id));
  const lines=(ls,w)=>{if(ls==null)return;if(!Array.isArray(ls)||ls.length>LIMIT.lines){err(w+': too many lines.');return;}for(const l of ls){if(!keysOk(l,['who','text'])||!plain(l.text,LIMIT.text))err(w+': a line must be plain text (500 characters at most).');else if(!speakerOk(l.who))err(w+': speaker "'+l.who+'" is not a known NPC.');}};
  for(const t of trees){const tw=(t&&t.id)||'(tree)';
   if(!keysOk(t,['id','name','note','missions'])){err(tw+': unknown fields in a tree.');continue;}
   if(!treeIdOk(t.id))err(tw+': a new tree id must start with draft-.');if(tids.has(t.id))err(tw+': duplicate tree id.');tids.add(t.id);
   if(!plain(t.name,LIMIT.title))err(tw+': the tree needs a name (60 characters at most).');
   if(t.note!=null&&!(typeof t.note==='string'&&t.note.length<=300&&!TAGS.test(t.note)))err(tw+': the note must be plain text (300 characters at most).');
   if(!Array.isArray(t.missions)||!t.missions.length||t.missions.length>20){err(tw+': a tree needs 1 to 20 missions.');continue;}
   for(const m of t.missions){total++;const w=tw+' / '+((m&&m.id)||'?');
    if(!keysOk(m,['id','number','title','type','category','giver','location','start','objective','description','rewards','offer','objectives','ending','unlocks','waitAt'])){err(w+': unknown fields in a mission.');continue;}
    if(m.waitAt!=null){const X=NPX();for(const p of X?X.waitAtProblems(m.giver,m.waitAt):['“Giver waits at” cannot be checked here.'])err(w+': '+p);}
    if(!missionIdOk(m.id))err(w+': a new mission id must start with draft- (60 characters at most).');
    if(m.number!=null&&!(Number.isInteger(m.number)&&m.number>=1&&m.number<=999))err(w+': a mission number must be a whole number from 001 to 999.');
    if(m.number==null&&STORY.has(t.id))err(w+': every mission in the main storyline needs a mission number.');
    if(m.start!=null)checkStart(m.start,w,ctx,err,speakerOk,trees);
    if(m.category!=null&&!plain(m.category,LIMIT.title))err(w+': the mission type label must be plain text (60 characters at most).');
    if(m.objective!=null&&!plain(m.objective,200))err(w+': the objective must be plain text (200 characters at most).');
    if(m.location!=null&&(typeof m.location!=='string'||(ctx.places&&!ctx.places.has(m.location))))err(w+': unknown location "'+m.location+'".');if(mids.has(m.id)||(ctx.registryIds&&ctx.registryIds.has(m.id)))err(w+': duplicate mission id.');mids.add(m.id);
    if(!plain(m.title,LIMIT.title))err(w+': a title is required (60 characters at most, no HTML).');if(!TYPES.includes(m.type))err(w+': unknown mission type.');
    if(!npcOk(m.giver))err(w+': the giver must be an NPC the game has a TALK prompt for.');
    if(m.description!=null&&!(typeof m.description==='string'&&m.description.length<=LIMIT.description&&!TAGS.test(m.description)))err(w+': the description must be plain text (600 characters at most).');
    if(m.rewards!=null&&!(Number.isInteger(m.rewards)&&m.rewards>=0&&m.rewards<=LIMIT.credits))err(w+': credits must be a whole number between 0 and 100000.');
    lines(m.offer,w);
    if(!Array.isArray(m.objectives)||!m.objectives.length||m.objectives.length>LIMIT.objectives){err(w+': a mission needs 1 to 20 steps.');continue;}
    const oids=new Set();
    for(const o of m.objectives){const ow=w+' / '+((o&&o.id)||'?');
     if(!keysOk(o,['id','label','kind','npc','place','item','say','early','subject','subjects','wrong','via'])){err(ow+': unknown fields in a step.');continue;}
     if(!ID.test(o.id||'')||o.id==='turn-in')err(ow+': step id must be lowercase letters, digits and hyphens.');if(oids.has(o.id))err(ow+': duplicate step id.');oids.add(o.id);
     if(!plain(o.label,LIMIT.text))err(ow+': the step needs a label (plain text).');
     if(!STEP_KINDS.includes(o.kind))err(ow+': the game cannot run this kind of step yet (needs a code change).');
     else if(o.kind==='talk'||o.kind==='deliver'){if(!npcOk(o.npc))err(ow+': who the step happens with must be an NPC the game has a TALK prompt for.');}
     else if(o.kind==='go'){if(typeof o.place!=='string'||(ctx.places&&!ctx.places.has(o.place)))err(ow+': unknown place "'+o.place+'".');}
     else if(o.kind==='arrive'){if(typeof o.place!=='string'||(ctx.locations&&!ctx.locations.has(o.place)))err(ow+': "'+o.place+'" is not a place a ship can fly to.');}
     else if(o.kind==='buy'){if(typeof o.item!=='string'||(ctx.items&&!ctx.items.has(o.item)))err(ow+': "'+o.item+'" is not an item a store sells.');}
     else if(o.kind==='message'){if(!(m.start&&m.start.how==='notification'))err(ow+': a “notification arrives” step needs the mission to start by notification.');}
     else if(o.kind==='hear'){if(o.npc!=null&&o.npc!==''&&!npcOk(o.npc))err(ow+': who is heard must be an NPC the game has a TALK prompt for.');}
     else if(o.kind==='await-call'){if(o.npc!=null&&o.npc!==''&&!speakerOk(o.npc))err(ow+': who will call must be a known NPC.');}
     else if(o.kind==='enter'||o.kind==='leave'){if(typeof o.place!=='string'||(ctx.places&&!ctx.places.has(o.place)))err(ow+': unknown place "'+o.place+'".');}
     else if(o.kind==='photo'){if(!subjectOk(o.npc))err(ow+': choose someone the V1 camera can identify.');}
     else if(o.kind==='send-photo'){if(typeof o.npc!=='string'||o.npc==='You'||!speakerOk(o.npc))err(ow+': the photo must be sent to a known NPC.');if(!subjectOk(o.subject))err(ow+': choose who must be in the photo (someone the V1 camera can identify).');}
     if(o.subject!=null&&o.kind!=='send-photo')err(ow+': only a “send a photo” step names who must be in the photo.');
     if(o.subjects!=null){const one=o.kind==='photo'?o.npc:o.subject;if(o.kind!=='photo'&&o.kind!=='send-photo')err(ow+': only a photo step or a “send a photo” step names several people.');else if(!Array.isArray(o.subjects)||!o.subjects.length||o.subjects.length>LIMIT.subjects||new Set(o.subjects).size!==o.subjects.length||!o.subjects.every(subjectOk)||o.subjects[0]!==one)err(ow+': the people in the photo must be 1 to '+LIMIT.subjects+' different people the V1 camera can identify, the first one chosen above.');}
     if(o.wrong!=null&&o.kind!=='send-photo')err(ow+': only a “send a photo” step has a reply for the wrong photo.');
     if(o.via!=null){if(!VIA.includes(o.via))err(ow+': unknown way of saying the lines.');else if(o.via!=='talk'&&!((o.say||[]).length&&o.say.every(l=>l&&l.who!=='You'&&l.who===o.say[0].who)))err(ow+': a Comms call or a message needs its lines, all from one NPC.');}
     lines(o.say,ow);lines(o.early,ow);lines(o.wrong,ow);}
    if(m.ending!=null){if(!keysOk(m.ending,['npc','place','label','say']))err(w+': the ending has unknown fields.');else{
     if(m.ending.npc!=null&&!npcOk(m.ending.npc))err(w+': the hand-in NPC must be an NPC the game has a TALK prompt for.');
     if(m.ending.place!=null&&typeof m.ending.place!=='string')err(w+': unknown ending place.');if(m.ending.label!=null&&!plain(m.ending.label,LIMIT.text))err(w+': the hand-in label must be plain text.');lines(m.ending.say,w+' / ending');}}
    if(m.unlocks!=null){if(!Array.isArray(m.unlocks)||m.unlocks.length>20)err(w+': too many unlocks.');else for(const u of m.unlocks){const uw=w+' / unlock';
     if(!keysOk(u,['kind','id','amount','value','when'])||!UNLOCKS.includes(u.kind)){err(uw+': the game cannot apply this kind of unlock yet (needs a code change).');continue;}
     if(u.when!=null&&u.when!=='complete'&&!oids.has(u.when))err(uw+': "'+u.when+'" is not a step of this mission.');
     if(u.kind==='credits'&&!(Number.isInteger(u.amount)&&u.amount>0&&u.amount<=LIMIT.credits))err(uw+': credits must be a whole number between 1 and 100000.');
     if(u.kind==='flag'){if(!FLAGNAME.test(u.id||''))err(uw+': a story flag name must be letters, digits, - or _ (48 at most).');if(!(typeof u.value==='boolean'||(typeof u.value==='string'&&u.value.length<=200&&!TAGS.test(u.value))||Number.isSafeInteger(u.value)))err(uw+': a story flag value must be true/false, a number or short text.');}
     if(u.kind==='location'&&(typeof u.id!=='string'||(ctx.locations&&!ctx.locations.has(u.id))))err(uw+': unknown place "'+u.id+'".');
     if(u.kind==='ship'&&(typeof u.id!=='string'||(ctx.ships?!ctx.ships.has(u.id)||ctx.ships.get(u.id).premium:!['starter','ship2'].includes(u.id))))err(uw+': only a ship from the ship list that is not a paid purchase can be given.');
     if(u.kind==='tree'&&(typeof u.id!=='string'||!all.has(u.id)||u.id===t.id))err(uw+': "'+u.id+'" is not another of the new trees being sent.');
     if((u.kind==='contact'||u.kind==='follow')&&(typeof u.id!=='string'||!/^[a-z][a-z0-9-]{0,39}$/.test(u.id)||u.id==='You'||!speakerOk(u.id)))err(uw+': a contact or a follow must name a known NPC.');
     if(u.kind==='reputation'){if(typeof u.id!=='string'||!(FACTIONS.includes(u.id)||(ctx.givers?ctx.givers.has(u.id):/^[a-z][a-z0-9-]{0,40}$/.test(u.id))))err(uw+': reputation must name an NPC or a faction.');if(!(Number.isInteger(u.amount)&&u.amount!==0&&Math.abs(u.amount)<=100))err(uw+': a reputation change must be a whole number from -100 to 100 (not 0).');}}}
   }}
  if(total>40)err('New trees hold '+total+' missions; 40 at most (each one is a record in every player’s save).');
  if(MS)for(const p of MS.numberProblems(trees,{...MS.NUMBERS,...(ctx.numbers||{})}))err(p);
 }
 /* The places and NPCs a mission touches (for reachability and draft play). */
 function treeTouches(m){const npcs=new Set([m.giver]),places=new Set();for(const o of m.objectives||[]){if(o.npc)npcs.add(o.npc);if(o.place)places.add(o.place);}if(m.ending&&m.ending.npc)npcs.add(m.ending.npc);return {npcs:[...npcs].filter(Boolean),places:[...places]};}
 /* The VoidMissions record for a tree mission (what the V1 Mission Log shows). env.givers: roster list (say names, layout ids and places). */
 function treeDefinition(t,m,i,givers){const g=id=>(givers||[]).find(x=>x.id===id)||null,name=id=>(g(id)||{}).name||id;
  // An NPC who stands in NeoChinatown (the District, the street) is at 'earth', so the Mission Log's guidance and waypoint lead to them (as the beginner campaign's did).
  const at=who=>who&&who.enter?(who.enter.location||(who.enter.walk?'earth':null)):null;
  const objectives=m.objectives.map(o=>{const x={id:o.id,label:o.label},who=o.npc&&o.kind!=='photo'&&o.kind!=='send-photo'&&g(o.npc);if(o.kind==='arrive')x.destination=o.place;if(who&&who.layout)x.interaction=who.layout;const loc=at(who);if(loc)x.destination=loc;
   // a place step (and a photo step: the arrow and the marker lead to the person in the photo) is guided in NeoChinatown (places.js target; mission-log.js guidance)
   if(o.kind==='enter'||o.kind==='leave'||o.kind==='go'&&PL&&PL.BY.has(o.place)){x.place=o.place;if(PL&&PL.within(o.place,'neochinatown'))x.destination='earth';}
   if(o.kind==='photo'){const sub=g(o.npc);x.target=o.npc;if(sub&&sub.place)x.place=sub.place;x.destination='earth';}
   return x;});
  if(m.ending&&m.ending.npc){const who=g(m.ending.npc),x={id:'turn-in',label:m.ending.label||('Hand in to '+name(m.ending.npc))};if(who&&who.layout)x.interaction=who.layout;if(at(who))x.destination=at(who);objectives.push(x);}
  const extra={};if(Number.isInteger(m.number))extra.number=m.number;for(const k of ['category','location','objective'])if(m[k])extra[k]=m[k];if(m.start&&m.start.how==='notification')extra.start={how:'notification',channel:m.start.channel,from:m.start.from};
  return {title:titleOf(m),name:m.title,devLabel:devLabel(m),type:m.type,description:m.description||'',giver:name(m.giver),source:STORY.has(t.id)?'main-story':'owner-tree',ownerTree:t.id,rewards:m.rewards||null,prerequisites:i?[t.missions[i-1].id]:[],objectives,...extra};}
 /* Applies one unlock to a campaign state. Returns a plain description, or null when nothing changed. */
 function unlockNow(s,u,env,Camp){
  if(u.kind==='credits'){s.credits=(s.credits||0)+u.amount;return '+'+u.amount+' credits';}
  if(u.kind==='flag'){s.story.flags['mf_'+u.id]=u.value;return null;}
  if(u.kind==='location'){const U=env.U;if(U&&U.discover){const known=(s.universe.discoveredLocations||[]).includes(u.id);U.discover(s,u.id);return known?null:'NEW PLACE · '+((U.locations&&U.locations[u.id]&&U.locations[u.id].name)||u.id);}return null;}
  if(u.kind==='ship'&&Camp&&Camp.awardStarterShip){const had=(s.ownedShips||[]).includes(u.id)&&s.story.flags.starterShipAwarded===true;Camp.awardStarterShip(s);if(u.id!=='starter'&&Camp.giveShip)Camp.giveShip(s,u.id);return had?null:'SHIP ACQUIRED';}
  if(u.kind==='reputation'){const n=Math.trunc(u.amount)||0,cl=v=>Math.max(-100,Math.min(100,v));if(!n)return null;
   if(FACTIONS.includes(u.id)){s.progression=s.progression||{};s.progression.reputation=s.progression.reputation||{};s.progression.reputation[u.id]=cl((Number(s.progression.reputation[u.id])||0)+n);}
   else{s.story.relationships=s.story.relationships||{};s.story.relationships[u.id]=cl((Number(s.story.relationships[u.id])||0)+n);}
   const who=((env.givers||[]).find(g=>g.id===u.id)||{}).name||u.id;return (n>0?'BETTER':'WORSE')+' STANDING WITH '+String(who).toUpperCase();}
  // The V1 (Mission 003): a contact in the player's device (story.flags.v1Contacts, comma separated ids; hud-data.js lists them) and a follow on Social (district-people.js).
  if(u.kind==='contact'){const who=((env.givers||[]).find(g=>g.id===u.id)||{}).name||u.id,list=String(s.story.flags.v1Contacts||'').split(',').filter(Boolean);if(list.includes(u.id))return null;
   list.push(u.id);while(list.join(',').length>200)list.shift();s.story.flags.v1Contacts=list.join(',');return String(who).toUpperCase()+' ADDED TO CONTACTS';}
  if(u.kind==='follow'){const P=DPL(),who=((env.givers||[]).find(g=>g.id===u.id)||{}).name||u.id;if(!P||!P.isFollowing||P.isFollowing(s.story.flags,'n:'+u.id))return null;return P.toggleFollow(s.story.flags,{kind:'npc',id:u.id})?'FOLLOWING '+String(who).toUpperCase()+' ON SOCIAL':null;}
  if(u.kind==='tree'){if(s.story.flags[linkFlag(u.id)]===true)return null;s.story.flags[linkFlag(u.id)]=true;const t=(env.trees||[]).find(x=>x.id===u.id);return 'NEW STORY · '+((t&&t.name)||u.id);}
  return null;}
 const treeLive=s=>!!(s&&s.universe&&s.story&&s.story.flags&&s.story.flags.missionPool==='closed');
 /* Something happened: ev {type:'talk', npcs:[roster ids]} | {type:'place', places:[ids]} | {type:'buy', item} | {type:'pod-exit'} | {type:'heard', mission}. Runs the trees in order:
    a tree's next mission is offered when its giver is talked to (or, when it starts by notification, when its trigger happens: the device receives it); its steps complete in order;
    'message' steps ("the notification arrives") complete by themselves right after the step before them;
    a 'hear' step after a talk step shows its lines and is done when that conversation closes (ev 'heard'), or at once when it has no lines to show.
    It ends when the last step is done, or at the hand-in NPC. Pays once (story.flags.mt_<id>). Never repeats anything. Placeholder lines are shown only in draft play (env.draft).
    Returns {tree, mission, offered, objective, done:[step ids], lines, early, completed, reward, notes, messages:[...], hear:{mission,step}|null}. */
 /* Is this photo good for a "send a photo" step? Its metadata (device-camera.js, judged at the moment of capture) must show `subject` as valid, and it must have been taken
    during this mission: while the mission's own photo step of that subject was the step in progress (or, with no such step, while any step of this mission was).
    photo: {subjects:[{id, valid}], during:['<mission>/<step>', ...]}. Older photos, and photos of anyone else, never count. */
 /* Who must be in the photo of a photo / send-a-photo step: `subjects` (several people, all in the SAME photo, each judged valid on its own), else the one person (npc / subject). */
 const photoNeed=o=>{if(!o)return [];if(Array.isArray(o.subjects)&&o.subjects.length)return [...new Set(o.subjects)];const one=o.kind==='photo'?o.npc:o.subject;return one?[one]:[];};
 function photoOk(photo,subject,m){if(!photo||!Array.isArray(photo.subjects)||!Array.isArray(photo.during))return false;const need=(Array.isArray(subject)?subject:[subject]).filter(Boolean);
  if(!need.length||!need.every(id=>photo.subjects.some(x=>x&&x.id===id&&x.valid===true)))return false;
  const ps=(m.objectives||[]).find(x=>x.kind==='photo'&&need.every(id=>photoNeed(x).includes(id)))||(m.objectives||[]).find(x=>x.kind==='photo'&&photoNeed(x).includes(need[0]));return ps?photo.during.includes(m.id+'/'+ps.id):photo.during.some(k=>typeof k==='string'&&k.startsWith(m.id+'/'));}
 /* What a camera capture counts for right now: the step in progress of every active tree mission ('<mission>/<step>'). */
 function during(s,env){const out=[];if(!treeLive(s)||!env||!Array.isArray(env.trees))return out;for(const t of env.trees)for(const m of t.missions||[]){const rec=s.universe.missions&&s.universe.missions[m.id];if(!rec||!rec.acquired||rec.completed)continue;const o=m.objectives.find(x=>rec.objectives[x.id]!==true);if(o)out.push(m.id+'/'+o.id);}return out;}
 const stepMessage=(m,o,gv,at,read)=>{const from=(o.say.find(l=>l&&l.who!=='You')||{}).who,name=gv(from).name||from;return {id:m.id+'/'+o.id,mission:m.id,number:m.number,title:titleOf(m),channel:o.via,from,fromName:name,header:String(name).toUpperCase()+' // '+(o.via==='comms'?'INCOMING CALL':'MESSAGE'),text:o.say.filter(l=>l&&l.who!=='You').map(l=>l.text).join('\n'),at,...(read==null?{}:{read})};};
 const msgFlag=(mid,sid)=>'v1m_'+String(mid).slice(0,40)+'_'+String(sid).slice(0,18),readFlag=(mid,sid)=>'v1r_'+String(mid).slice(0,40)+'_'+String(sid).slice(0,18);
 function treeEvent(s,env,ev,Missions,Camp){
  const out={tree:null,mission:null,offered:false,objective:null,done:[],lines:[],early:null,completed:false,reward:0,notes:[],messages:[],hear:null};
  if(!treeLive(s)||!env||!Array.isArray(env.trees)||!env.trees.length||!ev)return out;
  const npcs=ev.npcs||[],places=ev.places||[],gv=id=>(env.givers||[]).find(g=>g.id===id)||{};
  const speak=ls=>(ls||[]).filter(l=>env.draft||!placeholder(l.text)).map(l=>({who:l.who==='You'?'You':gv(l.who).say||l.who,text:l.text}));
  const gated=linked(env.trees),open=t=>!gated.has(t.id)||s.story.flags[linkFlag(t.id)]===true;
  const hit=(o,m)=>(o.kind==='talk'||o.kind==='deliver')?ev.type==='talk'&&npcs.includes(o.npc):(o.kind==='go'||o.kind==='arrive'||o.kind==='enter')?ev.type==='place'&&places.includes(o.place):o.kind==='leave'?ev.type==='place'&&!places.includes(o.place):o.kind==='buy'?ev.type==='buy'&&ev.item===o.item:o.kind==='pod-exit'?ev.type==='pod-exit'
   :o.kind==='photo'?ev.type==='photo'&&photoNeed(o).length>0&&photoNeed(o).every(id=>(ev.subjects||[]).includes(id)):o.kind==='send-photo'?ev.type==='send-photo'&&ev.to===o.npc&&photoOk(ev.photo,photoNeed(o),m):false;
  const settle=(m,stepId)=>{const rec=s.universe.missions[m.id];for(const u of m.unlocks||[])if((u.when||'complete')===stepId){const n=unlockNow(s,u,env,Camp);if(n)out.notes.push(n);}
   if(rec&&rec.completed&&s.story.flags[treeFlag(m.id)]!==true){s.story.flags[treeFlag(m.id)]=true;out.completed=true;if(GC)GC.stamp(s,m.id);/* the in-game wait of "after N in-game hours" starts here */if(m.rewards>0){s.credits=(s.credits||0)+m.rewards;out.reward=m.rewards;}
    for(const u of m.unlocks||[])if((u.when||'complete')==='complete'){const n=unlockNow(s,u,env,Camp);if(n)out.notes.push(n);}}};
  const step=(t,m,o)=>{if(!Missions.complete(s,m.id,o.id,Camp))return false;Object.assign(out,{tree:t.id,mission:m.id,objective:o.id});out.done.push(o.id);
   if(o.kind==='send-photo')out.reply={to:o.npc,ok:true,lines:speak(o.say)};   // the reply to the right photo comes back in Messages
   else if(o.via==='comms'||o.via==='messages')sendLines(m,o);else out.lines.push(...speak(o.say));settle(m,o.id);return true;};
  // A step's lines that reach the device instead of the dialogue window (a Comms call or a message from the NPC who says them): kept like a start notification.
  const sendLines=(m,o)=>{const ls=speak(o.say);if(!ls.length)return;const at=Math.floor((ev.at||Date.now())/1000);if(!Number.isSafeInteger(s.story.flags[msgFlag(m.id,o.id)]))s.story.flags[msgFlag(m.id,o.id)]=at;
   out.messages.push(stepMessage(m,o,gv,at));};
  // A mission that starts by notification: its notification reaches the device (story.flags v1m_<mission>_start = the time, seconds; Messages and Comms keep it).
  const notify=(t,m)=>{const st=m.start,at=Math.floor((ev.at||Date.now())/1000);if(!Number.isSafeInteger(s.story.flags[msgFlag(m.id,'start')]))s.story.flags[msgFlag(m.id,'start')]=at;
   out.messages.push({id:m.id+'/start',mission:m.id,number:m.number,title:titleOf(m),channel:st.channel,from:st.from,fromName:gv(st.from).name||st.from,header:st.header||'',text:st.text,at});};
  // Is this the moment the mission starts? In person: the giver is talked to. By notification: its trigger.
  // A giver with a shift (Reverie, Lace) offers a mission only while she is out on the street (mission-givers.js onDuty; never refused in draft play: it puts her out)
  const duty=id=>{const g=gv(id);if(!g.shift||env.draft)return true;const G=GVS();return !G||!G.onDuty||G.onDuty(g,ev.at||Date.now());};
  const startsNow=m=>{const st=m.start;if(!st||st.how!=='notification')return ev.type==='talk'&&npcs.includes(m.giver)&&duty(m.giver);const w=st.when||{};
   if(w.kind==='near'){const id=w.npc||m.giver;return ev.type==='near'&&!!ev.near&&nearHit(ev.near[id],w.distance)&&duty(id);}
   if(w.kind==='pod-exit')return ev.type==='pod-exit';if(w.kind==='place')return ev.type==='place'&&places.includes(w.place);if(w.kind==='leave')return ev.type==='place'&&(ev.left||[]).includes(w.place);
   if(w.kind==='after-mission')return !!(s.universe.missions&&s.universe.missions[w.mission]&&s.universe.missions[w.mission].completed===true);if(w.kind==='game-time')return !!(GC&&GC.due(s,w.mission,w.value));if(w.kind==='flag')return s.story.flags[w.flag]===w.value;return false;};
  // After a step: the automatic steps that follow it (messages) complete at once.
  const auto=(t,m)=>{const rec=s.universe.missions[m.id];for(const o of m.objectives){if(rec.objectives[o.id]===true)continue;if(!AUTO.includes(o.kind))break;if(!step(t,m,o))break;}};
  // After a talk step: a 'hear' step next shows its lines (done when the conversation closes), or is done at once when nothing can be shown.
  const hearNext=(t,m)=>{const rec=s.universe.missions[m.id],o=m.objectives.find(x=>rec.objectives[x.id]!==true);if(!o||o.kind!=='hear')return;const ls=speak(o.say);
   if(ls.length){out.lines.push(...ls);out.hear={mission:m.id,step:o.id};}else if(out.lines.length)out.hear={mission:m.id,step:o.id};   // the talk step's own lines are the introduction: done when they close
   else if(step(t,m,o))auto(t,m);};
  /* Straight on (the owner, 18 Nov 2026: after Admin's "I might have more work for you" he expected the next mission's offer): when talking to someone completes a mission and the
     tree's next mission is offered in person, with ACCEPT / NOT NOW, by someone in this same conversation, its offer follows in the same window. Nothing is taken until ACCEPT
     (out.ask; out.mission stays the completed one, so its MISSION COMPLETE notice and reward are reported as before). NOT NOW: the next conversation offers it again. */
  const chain=(t,m)=>{if(ev.type!=='talk'||!out.completed||out.hear||out.ask||!out.lines.length)return;   /* only after a line that closes the mission (Mission 001's unwritten introduction says nothing, so it stays as it was) */
   const n=t.missions[t.missions.indexOf(m)+1];if(!n||!(n.start&&n.start.how!=='notification'&&n.start.accept===true))return;
   const r=s.universe.missions&&s.universe.missions[n.id];if(r&&(r.acquired||r.completed))return;if(!startsNow(n)||!Missions.available(s,n.id))return;const ls=speak(n.offer);if(!ls.length)return;
   out.ask={mission:n.id,title:titleOf(n),accept:'ACCEPT',decline:'NOT NOW'};out.next=n.id;out.lines.push(...ls);};
  for(const t of env.trees){if(!open(t))continue;
   for(const m of t.missions){
    const rec=s.universe.missions&&s.universe.missions[m.id];
    if(rec&&rec.completed)continue;
    if(!rec||!rec.acquired){
     const byNote=!!(m.start&&m.start.how==='notification'),asks=!byNote&&!!(m.start&&m.start.accept===true);
     // In person with ACCEPT / NOT NOW: talking to the giver shows the offer and asks; nothing is taken until ACCEPT ('accept' event). NOT NOW changes nothing, so the
     // next conversation offers it again. Once accepted the mission has a record and is never offered again.
     if(asks){
      if(ev.type==='accept'&&ev.mission===m.id&&Missions.acquire(s,m.id)){Missions.track(s,m.id,Camp);Object.assign(out,{tree:t.id,mission:m.id,offered:true,how:'person'});return out;}
      if(ev.type==='decline'&&ev.mission===m.id){Object.assign(out,{tree:t.id,mission:m.id,declined:true});return out;}
      if(startsNow(m)&&Missions.available(s,m.id)){Object.assign(out,{tree:t.id,mission:m.id,ask:{mission:m.id,title:titleOf(m),accept:'ACCEPT',decline:'NOT NOW'}});out.lines.push(...speak(m.offer));return out;}
      break;}
     if(startsNow(m)&&Missions.acquire(s,m.id)){Missions.track(s,m.id,Camp);Object.assign(out,{tree:t.id,mission:m.id,offered:true,how:byNote?'notification':'person'});if(byNote)notify(t,m);else out.lines.push(...speak(m.offer));
      const first=m.objectives[0];if(byNote&&first&&hit(first,m))step(t,m,first);if(byNote)auto(t,m);return out;}   // started by its trigger: a first step that is the trigger itself (leave the pod, go to the place) is done
     break;}
    const next=m.objectives.find(o=>rec.objectives[o.id]!==true);
    if(next){
     if(ev.type==='send-photo'&&next.kind==='send-photo'&&ev.to===next.npc&&!photoOk(ev.photo,photoNeed(next),m)){Object.assign(out,{tree:t.id,mission:m.id,reply:{to:next.npc,ok:false,lines:speak(next.wrong)}});return out;}   // the wrong photo: the reply says so; no fail, unlimited tries
     if(ev.type==='heard'&&next.kind==='hear'&&(!ev.mission||ev.mission===m.id)){if(step(t,m,next))auto(t,m);return out;}
     if(next.kind==='hear'&&ev.type==='talk'&&(npcs.includes(next.npc||m.giver))){Object.assign(out,{tree:t.id,mission:m.id});if(!speak(next.say).length){const k=m.objectives.indexOf(next),prev=m.objectives[k-1];if(prev)out.lines.push(...speak(prev.say));}hearNext(t,m);return out;}   // came back after a closed conversation
     if(AUTO.includes(next.kind)){auto(t,m);if(out.done.length)return out;}
     if(hit(next,m)){if(!step(t,m,next))break;auto(t,m);if(next.kind==='talk'||next.kind==='deliver')hearNext(t,m);chain(t,m);return out;}
     const later=ev.type==='talk'&&m.objectives.find(o=>rec.objectives[o.id]!==true&&o!==next&&hit(o,m)&&(o.early||[]).length);
     if(later){Object.assign(out,{tree:t.id,mission:m.id,early:speak(later.early)});return out;}
     break;}
    if(m.ending&&m.ending.npc&&ev.type==='talk'&&npcs.includes(m.ending.npc)){if(!Missions.complete(s,m.id,'turn-in',Camp))break;Object.assign(out,{tree:t.id,mission:m.id,objective:'turn-in'});out.done.push('turn-in');out.lines.push(...speak(m.ending.say));settle(m,'turn-in');chain(t,m);return out;}
    break;}}
  return out;
 }
 /* What missions have sent to this player's device (newest first): Messages (channel 'messages') and Comms calls ('comms'); a banner-only notification keeps nothing.
    read: story.flags v1r_<mission>_start. channel: only that channel. */
 function inbox(s,env,channel){const out=[];if(!s||!s.universe||!s.story||!s.story.flags||!env||!Array.isArray(env.trees))return out;const gv=id=>(env.givers||[]).find(g=>g.id===id)||{};
  for(const t of env.trees)for(const m of t.missions||[]){const rec=s.universe.missions&&s.universe.missions[m.id],st=m.start;if(!rec||!rec.acquired||!st||st.how!=='notification'||st.channel==='notify'||(channel&&st.channel!==channel))continue;
   out.push({id:m.id+'/start',mission:m.id,number:m.number,title:titleOf(m),channel:st.channel,from:st.from,fromName:gv(st.from).name||st.from,header:st.header||'',text:st.text,at:Number(s.story.flags[msgFlag(m.id,'start')])||0,read:s.story.flags[readFlag(m.id,'start')]===true});}
  // lines a step sent as a Comms call or a message (Mission 002's call on entering NULL)
  for(const t of env.trees)for(const m of t.missions||[]){const rec=s.universe.missions&&s.universe.missions[m.id];if(!rec||!rec.acquired)continue;
   for(const o of m.objectives||[]){if((o.via!=='comms'&&o.via!=='messages')||(channel&&o.via!==channel)||rec.objectives[o.id]!==true||!Number.isSafeInteger(s.story.flags[msgFlag(m.id,o.id)])||!(o.say||[]).length)continue;
    out.push(stepMessage(m,o,gv,Number(s.story.flags[msgFlag(m.id,o.id)])||0,s.story.flags[readFlag(m.id,o.id)]===true));}}
  return out.sort((a,b)=>b.at-a.at);}
 function markRead(s,id){const [mid,sid]=String(id||'').split('/');if(!mid||!sid||!s||!s.story||!s.story.flags)return false;if(s.story.flags[readFlag(mid,sid)]===true)return false;s.story.flags[readFlag(mid,sid)]=true;return true;}
 /* "GIVER WAITS AT" (the owner approved it for Reverie and Lace, 18 Nov 2026): the spots where a giver should wait now, one per giver: the first mission of an open tree
    that is waiting to be offered by her (not taken, not done, every mission before it done), offered in person or "when walked near" her, with a waitAt. */
 function waitingAt(s,env){const out={};if(!treeLive(s)||!env||!Array.isArray(env.trees))return out;const recs=s.universe.missions||{},gated=linked(env.trees);
  for(const t of env.trees){if(gated.has(t.id)&&s.story.flags[linkFlag(t.id)]!==true)continue;for(const m of t.missions||[]){const rec=recs[m.id];if(rec&&rec.completed)continue;
   if(!rec||!rec.acquired){const st=m.start,w=st&&st.how==='notification'?st.when||{}:null,byHer=!st||st.how!=='notification'||(w&&w.kind==='near'&&(w.npc||m.giver)===m.giver);
    if(m.waitAt&&byHer&&!out[m.giver])out[m.giver]={...m.waitAt,mission:m.id};}
   break;}}
  return out;}
 /* Does a tree mission want this NPC right now (so the interaction should go to the tree rather than to what the NPC normally does)? */
 function treeWants(s,env,npcs){if(!treeLive(s)||!env||!env.trees)return false;const recs=s.universe.missions||{},gated=linked(env.trees);
  for(const t of env.trees)if(!gated.has(t.id)||s.story.flags[linkFlag(t.id)]===true)for(const m of t.missions){const rec=recs[m.id];if(rec&&rec.completed)continue;
   if(!rec||!rec.acquired){if(!(m.start&&m.start.how==='notification')&&npcs.includes(m.giver))return true;break;}
   const rest=m.objectives.filter(o=>rec.objectives[o.id]!==true),talks=o=>(o.kind==='talk'||o.kind==='deliver'||o.kind==='hear')&&npcs.includes(o.npc||(o.kind==='hear'?m.giver:''));
   if(rest.length&&(talks(rest[0])||rest.some(o=>talks(o)&&(o.early||[]).length)))return true;if(!rest.length&&m.ending&&npcs.includes(m.ending.npc))return true;break;}
  return false;}
 // Speaker names as the scripts write them ('Admin', 'pilot', 'elara') → the voice registry's ids.
 const ALIAS={you:'player',pilot:'player',player:'player','arcade attendant':'attendant','landing terminal':'landing-terminal'};
 const who=w=>{const l=String(w||'').toLowerCase();return ALIAS[l]||l.replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');};
 /* Shipped snapshot (taken once, before anything is applied): applying always starts from it, so a newer version or a rollback never stacks on an older one. */
 function snapshot(env){if(env.shipped)return env.shipped;env.lineMap=env.lineMap||new Map();env.shipped={beginner:clone(env.B?env.B.MISSIONS:[]),registry:clone(env.Missions?env.Missions.definitions:{})};return env.shipped;}
 /* Puts content over the shipped missions in place (the runners hold references to these objects). content=null restores the shipped missions.
    env: {B:VoidBeginner, Missions:VoidMissions}. Returns {applied:[...], refused:[...]}; a record that fails check() changes nothing. */
 function apply(content,env,ctx={}){
  const out={applied:[],refused:[]};const base=snapshot(env);
  if(content!=null){const c=check(content,ctx);if(!c.ok){out.refused=c.errors;return out;}}
  if(env.B){
   const list=clone(content&&content.beginner?content.beginner:base.beginner);
   env.B.MISSIONS.splice(0,env.B.MISSIONS.length,...list);for(const k of Object.keys(env.B.byId))delete env.B.byId[k];for(const m of env.B.MISSIONS)env.B.byId[m.id]=m;
   if(env.Missions){for(const id of Object.keys(env.Missions.definitions))if(env.Missions.definitions[id]&&env.Missions.definitions[id].beginner===true&&!env.B.byId[id])delete env.Missions.definitions[id];env.B.register(env.Missions);}
   if(content&&content.beginner)out.applied.push('beginner campaign: '+list.length+' missions');
  }
  if(env.Missions){
   for(const [id,def] of Object.entries(base.registry))if(def&&def.beginner!==true&&env.Missions.definitions[id])env.Missions.definitions[id]=clone(def);
   for(const [id,e] of Object.entries((content&&content.registry)||{})){const d=env.Missions.definitions[id];if(!d||d.beginner===true)continue;
    if(e.title!=null)d.title=e.title;if(e.description!=null)d.description=e.description;for(const o of d.objectives||[])if(e.objectives&&e.objectives[o.id]!=null)o.label=e.objectives[o.id];out.applied.push('mission log text: '+id);}
  }
  env.lineMap=new Map();for(const l of (content&&content.lines)||[])env.lineMap.set(l.who+'|'+l.from,l.to);if(content&&content.lines&&content.lines.length)out.applied.push(content.lines.length+' changed line(s)');
  if(env.Missions){for(const id of Object.keys(env.Missions.definitions))if(env.Missions.definitions[id]&&env.Missions.definitions[id].ownerTree)delete env.Missions.definitions[id];}
  env.voices=clone((content&&content.voices)||{});if(content&&content.voices&&Object.keys(content.voices).length)out.applied.push(Object.keys(content.voices).length+' voice choice(s) for re-voicing');
  env.looks=clone((content&&content.looks)||{});if(content&&content.looks&&Object.keys(content.looks).length)out.applied.push(Object.keys(content.looks).length+' NPC look setting(s)');
  env.npcPlans=clone((content&&content.npcs)||{});if(content&&content.npcs&&Object.keys(content.npcs).length)out.applied.push(Object.keys(content.npcs).length+' NPC placement(s)');
  env.trees=storyTrees((content&&content.trees)||[]);env.names=clone((content&&content.names)||{});
  if(env.Missions)for(const t of env.trees)t.missions.forEach((m,i)=>env.Missions.define(m.id,treeDefinition(t,m,i,env.givers)));
  if(env.trees.length)out.applied.push('new trees: '+env.trees.map(t=>t.name+' ('+t.missions.length+')').join(', '));if(Object.keys(env.names).length)out.applied.push(Object.keys(env.names).length+' tree name(s)');
  return out;
 }
 /* The trees that run: the shipped story trees (an edited copy in the content replaces the one with the same id), then the content's other trees. */
 function storyTrees(list){const own=clone(list||[]),shipped=MS?MS.trees():[];return [...shipped.map(t=>own.find(x=>x.id===t.id)||t),...own.filter(x=>!shipped.some(t=>t.id===x.id))].map(t=>{const x={...t};delete x.status;delete x.shipped;delete x.seq;return x;});}
 /* A line about to be shown ({who,text}) → the edited line, or the same object when nothing applies. */
 function mapLine(env,l){if(!l||!env||!env.lineMap||!env.lineMap.size||typeof l.text!=='string')return l;const to=env.lineMap.get(who(l.who)+'|'+l.text);return to==null?l:{...l,text:to,edited:true};}
 /* Builds content from the owner's drafts. studio: the Developer Studio's local draft {missions:[...]} (beginner campaign); local: Mission Editor edits {missions:{key:edit}}. */
 const strip=m=>{const r={id:m.id,title:m.title,type:m.type};for(const k of ['giver','description','destination','prerequisites'])if(m[k]!=null)r[k]=clone(m[k]);if(m.rewards!=null)r.rewards=Number(m.rewards)||0;
  r.objectives=(m.objectives||[]).map(o=>{const x={id:o.id,label:o.label,on:o.on};for(const k of ['requires','interaction','destination','award','say','early'])if(o[k]!=null&&!(Array.isArray(o[k])&&!o[k].length))x[k]=clone(o[k]);if(x.requires)x.requires=x.requires.slice();return x;});return r;};
 /* ---- new trees in the owner's draft → content. Only what the game can run is sent: in each tree, the missions in order up to the first one that cannot run yet. */
 const said=(ls,who)=>(ls||[]).filter(l=>l&&typeof l.text==='string'&&l.text.trim()).map(l=>({who:l.who||who||'You',text:l.text.trim()}));
 const SUPPORTED_UNLOCK=u=>UNLOCKS.includes(u.kind)&&(u.kind!=='ship'||['starter','ship2'].includes(u.id));
 function treeStrip(m){const r={id:m.id,title:String(m.title||'').trim(),type:m.type||'side',giver:m.giver};if(Number.isInteger(m.number))r.number=m.number;for(const k of ['category','location','objective'])if(typeof m[k]==='string'&&m[k].trim())r[k]=m[k].trim();if(m.start&&m.start.how==='notification'){const st=m.start,w=st.when||{},x={how:'notification',channel:st.channel||'messages',from:st.from||m.giver,text:String(st.text||'').trim()};if(String(st.header||'').trim())x.header=String(st.header).trim();
   const wk={kind:w.kind||'pod-exit'};if(wk.kind==='after-mission'||wk.kind==='game-time')wk.mission=w.mission;if(wk.kind==='game-time')wk.value=w.value;if(wk.kind==='near'){wk.npc=w.npc||m.giver;wk.distance=nearMetres(w.distance);}if(wk.kind==='place'||wk.kind==='leave')wk.place=w.place;if(wk.kind==='flag'){wk.flag=w.flag;wk.value=w.value===undefined?true:w.value;}x.when=wk;r.start=x;}else if(m.start&&m.start.how==='person'&&m.start.accept===true)r.start={how:'person',accept:true};if(m.description)r.description=m.description;if(Number(m.rewards)>0)r.rewards=Math.floor(Number(m.rewards));
  {const X=NPX(),wa=X&&m.waitAt&&X.MOVABLE[m.giver]?X.cleanWait(m.waitAt):null;if(wa)r.waitAt=wa;}   // "Giver waits at" (Reverie, Lace)
  const offer=said(m.offer,m.giver);if(offer.length)r.offer=offer;
  r.objectives=(m.objectives||[]).map(o=>{const x={id:o.id,label:String(o.label||'').trim(),kind:o.kind};for(const k of ['npc','place','item'])if(o[k]!=null&&o[k]!=='')x[k]=o[k];if(o.kind==='send-photo'&&o.subject)x.subject=o.subject;if((o.kind==='photo'||o.kind==='send-photo')&&Array.isArray(o.subjects)&&o.subjects.length>1)x.subjects=o.subjects.slice(0,LIMIT.subjects);
   const who=o.kind==='photo'?m.giver:o.npc||m.giver,sy=said(o.say,who),ea=said(o.early,who),wr=o.kind==='send-photo'?said(o.wrong,who):[];if(sy.length)x.say=sy;if(ea.length)x.early=ea;if(wr.length)x.wrong=wr;if((o.via==='comms'||o.via==='messages')&&sy.length)x.via=o.via;return x;});
  if(m.ending&&(m.ending.npc||m.ending.place||said(m.ending.say,m.giver).length)){const e={};if(m.ending.npc)e.npc=m.ending.npc;if(m.ending.place)e.place=m.ending.place;if(m.ending.label&&m.ending.label.trim())e.label=m.ending.label.trim();const sy=said(m.ending.say,m.ending.npc||m.giver);if(sy.length)e.say=sy;r.ending=e;}
  const un=(m.unlocks||[]).filter(SUPPORTED_UNLOCK).map(u=>{const x={kind:u.kind};for(const k of ['id','amount','value','when'])if(u[k]!=null&&u[k]!=='')x[k]=u[k];if(x.when==='complete')delete x.when;return x;});if(un.length)r.unlocks=un;
  return r;}
 /* Why a draft mission cannot run in the game yet (plain words; empty = it can). givers: roster list; items: buyable ids (Set). */
 /* What a draft mission still needs before it can run, as {text (plain words), field (which input: the editor's "next required input" guide highlights it), step (the step id)}.
    treeBlockers is the same list as plain words, so the guide and the play / publish check never disagree. */
 function treeNeeds(m,givers,items){const out=[],g=id=>(givers||[]).find(x=>x.id===id),can=id=>{const x=g(id);return !!(x&&x.canTalk&&x.draft);},nm=id=>(g(id)||{}).name||id||'nobody',need=(text,field,step)=>out.push(step?{text,field,step}:{text,field});
  if(!String(m.title||'').trim())need('it needs a name','title');
  if(!m.giver)need('nobody gives it yet','giver');else if(!can(m.giver))need(nm(m.giver)+' cannot hand over a mission in the game today ('+((g(m.giver)||{}).why||'no TALK prompt')+')','giver');
  if(m.start&&m.start.how==='notification'){const st=m.start,w=st.when||{};if(!st.from)need('choose who the notification is from','start-from');if(st.channel!=='notify'&&!String(st.header||'').trim())need('the notification needs a header','start-header');if(!String(st.text||'').trim())need('the notification needs its text','start-text');
   if(w.kind==='after-mission'&&!w.mission)need('choose the mission it follows','start-mission');if((w.kind==='place'||w.kind==='leave')&&!w.place)need('choose the place that starts it','start-place');if(w.kind==='flag'&&!w.flag)need('name the story flag that starts it','start-flag');
   if(w.kind==='near'){const who=w.npc||m.giver;if(!who)need('choose who the player walks near','start-near');else if(!can(who))need(nm(who)+' cannot be walked near in the game today (no TALK prompt to measure from)','start-near');}}
  if(!(m.objectives||[]).length)need('it has no steps','add-step');
  for(const [i,o] of (m.objectives||[]).entries()){const w='step '+(i+1),id=o.id;
   if(!STEP_KINDS.includes(o.kind)){need(w+' ('+(o.kind||'no kind')+') needs a code change','kind',id);continue;}
   if((o.kind==='talk'||o.kind==='deliver')&&!can(o.npc))need(w+': '+(o.npc?nm(o.npc)+' cannot be talked to in the game today':'choose who it happens with'),'step-npc',id);
   if((o.kind==='go'||o.kind==='arrive')&&!o.place)need(w+': choose the place','step-place',id);if(o.kind==='buy'&&(!o.item||(items&&!items.has(o.item))))need(w+': choose an item a store sells','step-item',id);
   if(o.kind==='message'&&!(m.start&&m.start.how==='notification'))need(w+': “the notification arrives” needs the mission to start by notification','kind',id);
   if((o.kind==='enter'||o.kind==='leave')&&!o.place)need(w+': choose the place','step-place',id);
   if(o.kind==='photo'&&!o.npc)need(w+': choose who is photographed','step-subject',id);
   if(o.kind==='send-photo'){if(!o.npc)need(w+': choose who the photo is sent to','step-npc',id);if(!o.subject)need(w+': choose who must be in the photo','step-subject',id);}
   if(!String(o.label||'').trim())need(w+' needs “what the player must do”','label',id);
   if((o.via==='comms'||o.via==='messages')&&!said(o.say,'x').length)need(w+': a Comms call or a message needs its lines','say',id);}
  if(m.ending&&m.ending.npc&&!can(m.ending.npc))need('the hand-in NPC '+nm(m.ending.npc)+' cannot be talked to in the game today','ending');
  {const X=NPX();if(X&&m.waitAt)for(const p of X.waitAtProblems(m.giver,m.waitAt))need('“Giver waits at”: '+p,'wait-at');}
  return out;}
 function treeBlockers(m,givers,items){return treeNeeds(m,givers,items).map(x=>x.text);}
 function treesContent(trees,{givers,items}={}){const out=[],skipped=[];
  for(const t of trees||[]){const ms=[];for(const m of t.missions||[]){const b=treeBlockers(m,givers,items);if(b.length){skipped.push({tree:t.id,mission:m.id,title:m.title||'(no name)',why:b});for(const r of (t.missions||[]).slice(t.missions.indexOf(m)+1))skipped.push({tree:t.id,mission:r.id,title:r.title||'(no name)',why:['an earlier mission in this tree cannot run yet']});break;}ms.push(treeStrip(m));}
   if(ms.length){const x={id:t.id,name:String(t.name||'').trim()||t.id,missions:ms};if(t.note&&t.note.trim())x.note=t.note.trim().slice(0,300);out.push(x);}}
  // a link to a tree that is not sent is dropped (and said)
  const sent=new Set(out.map(t=>t.id));for(const t of out)for(const m of t.missions)if(m.unlocks){const keep=m.unlocks.filter(u=>u.kind!=='tree'||(sent.has(u.id)&&u.id!==t.id));if(keep.length<m.unlocks.length)skipped.push({tree:t.id,mission:m.id,title:m.title,why:['its “start tree” link points to a tree that cannot run yet (the link is left out)'],partial:true});if(keep.length)m.unlocks=keep;else delete m.unlocks;}
  return {trees:out,skipped};}
 function fromDrafts({studio,local,shippedBeginner,note,givers,items}={}){
  const out={format:FORMAT,version:VERSION};
  if(studio&&Array.isArray(studio.missions)){const b=studio.missions.map(strip);if(!shippedBeginner||JSON.stringify(b)!==JSON.stringify((shippedBeginner||[]).map(strip)))out.beginner=b;}
  const reg={};
  for(const [key,e] of Object.entries((local&&local.missions)||{})){if(!key.startsWith('registry:'))continue;const id=key.slice(9),r={};
   if(e.title!=null)r.title=e.title;if(e.description!=null)r.description=e.description;if(e.steps&&Object.keys(e.steps).length)r.objectives=clone(e.steps);if(Object.keys(r).length)reg[id]=r;}
  if(Object.keys(reg).length)out.registry=reg;
  const lines=Object.entries((local&&local.lines)||{}).filter(([,e])=>e&&e.adapter==='talk'&&typeof e.to==='string'&&e.to!==e.from).map(([ref,e])=>({who:ref.split('|')[0],from:e.from,to:e.to}));if(lines.length)out.lines=lines;
  const tc=treesContent((local&&local.trees)||[],{givers,items});if(tc.trees.length)out.trees=tc.trees;
  {const X=NPX(),np={};for(const [id,p] of Object.entries((local&&local.npcs)||{})){const c=X&&X.MOVABLE[id]?X.clean(p):null;if(c)np[id]=c;}if(Object.keys(np).length)out.npcs=np;}   // Developer Tools > NPCs
  {const V=NPV(),vs={};for(const [id,v] of Object.entries((local&&local.voices)||{})){const c=V&&!V.refusal(id)?V.clean(v):null;if(c)vs[id]=c;}if(Object.keys(vs).length)out.voices=vs;}   // ElevenLabs voice choices
  {const L=NPL(),lk={};for(const [a,e] of Object.entries((local&&local.looks)||{})){const c=L?L.clean(a,e):null;if(c)lk[a]=c;}if(Object.keys(lk).length)out.looks=lk;}   // NPC looks
  const names=Object.fromEntries(Object.entries((local&&local.names)||{}).filter(([id,n])=>ID.test(id)&&typeof n==='string'&&n.trim()).map(([id,n])=>[id,n.trim().slice(0,60)]));if(Object.keys(names).length)out.names=names;
  if(note)out.note=String(note).slice(0,500);
  return out;
 }
 const empty=c=>!c||(!c.beginner&&!c.registry&&!(c.lines&&c.lines.length)&&!(c.trees&&c.trees.length)&&!(c.names&&Object.keys(c.names).length)&&!(c.npcs&&Object.keys(c.npcs).length)&&!(c.voices&&Object.keys(c.voices).length)&&!(c.looks&&Object.keys(c.looks).length));
 /* Edits in the drafts that the game cannot apply live (draft play and publishing alike), in plain words. */
 function notApplied({studio,local,givers,items}={}){
  const out=[];
  for(const x of treesContent((local&&local.trees)||[],{givers,items}).skipped)out.push(x.partial?'New mission "'+x.title+'": '+x.why.join('; ')+'.':'New mission "'+x.title+'": cannot be played or published yet: '+x.why.join('; ')+'. It stays in your draft.');
  for(const t of (local&&local.trees)||[])for(const m of t.missions||[]){const n='"'+(m.title||m.id)+'"';
   if((m.choices||[]).length)out.push(n+': the branches (choices). The game does not offer mission choices yet (needs a code change); missions in a tree run in order.');
   for(const u of m.unlocks||[])if(!SUPPORTED_UNLOCK(u))out.push(n+': '+({item:'the store item',gate:'the gate',reputation:'the reputation change',ship:'the paid ship (never given by a mission)'}[u.kind]||u.kind)+' unlock (needs a code change).');
   const empty=[...(m.offer||[]),...(m.objectives||[]).flatMap(o=>[...(o.say||[]),...(o.early||[])]),...((m.ending&&m.ending.say)||[])].filter(l=>!l||!String(l.text||'').trim()).length;
   if(empty)out.push(n+': '+empty+' empty line(s) are placeholders and are not spoken.');}
  for(const m of (studio&&studio.missions)||[]){
   if((m.offer||[]).length)out.push('"'+m.title+'": what '+(m.giver||'the giver')+' says when handing the mission over. The game does not speak these lines yet (the Studio stores them as a design note).');
   if((m.choices||[]).length)out.push('"'+m.title+'": the choices. The game does not offer mission choices yet.');
   if((m.unlocks||[]).length)out.push('"'+m.title+'": the store items. No store reads mission unlocks yet.');
  }
  for(const [key,e] of Object.entries((local&&local.missions)||{})){
   const name=e.name||key,reg=key.startsWith('registry:');
   if(e.unlocks&&e.unlocks.length)out.push(name+': what becomes available (store items, ships, areas, flags). Unlocks are a design note until the game reads them.');
   if(e.reputation&&e.reputation.length)out.push(name+': reputation changes. The game has no mission reputation rewards yet.');
   if(e.credits!=null)out.push(name+': the credits. Payment for this mission is set in campaign code, not in the mission record.');
   if(e.endingNote)out.push(name+': the note about where the mission ends (a design note).');
   if(!reg&&!key.startsWith('beginner:')&&(e.title!=null||e.description!=null||(e.steps&&Object.keys(e.steps).length)))out.push(name+': title, description and step text. Contracts are flown, not tracked in the Mission Log, and have no adapter yet.');
  }
  for(const [ref,e] of Object.entries((local&&local.lines)||{}))if(e&&e.adapter!=='talk'&&e.to!==e.from)out.push('“'+String(e.to).slice(0,50)+'…” ('+ref.split('|')[0]+'): can be edited after the next update (needs a code change). It is kept in your draft and in the export for Claude or Codex.');
  return out;
 }
 /* What changes for players, and what needs care for players who are part-way through (pure). before/after: lists of beginner missions. */
 function changes(before,after){
  const out=[],by=new Map((before||[]).map(m=>[m.id,m])),now=new Map((after||[]).map(m=>[m.id,m]));
  for(const m of after||[]){const b=by.get(m.id);if(!b){out.push({kind:'added',mission:m.id,text:'New mission "'+m.title+'".'});continue;}
   if(b.title!==m.title)out.push({kind:'text',mission:m.id,text:'"'+b.title+'" is renamed "'+m.title+'".'});
   if((b.description||'')!==(m.description||''))out.push({kind:'text',mission:m.id,text:'"'+m.title+'": new description.'});
   if((Number(b.rewards)||0)!==(Number(m.rewards)||0))out.push({kind:'reward',mission:m.id,text:'"'+m.title+'": credits '+(Number(b.rewards)||0)+' → '+(Number(m.rewards)||0)+'.'});
   for(const o of m.objectives){const x=(b.objectives||[]).find(y=>y.id===o.id);if(!x){out.push({kind:'step-added',mission:m.id,step:o.id,text:'"'+m.title+'": new step "'+o.label+'".'});continue;}
    if(x.label!==o.label)out.push({kind:'text',mission:m.id,step:o.id,text:'"'+m.title+'": step "'+x.label+'" now reads "'+o.label+'".'});
    if(x.on!==o.on)out.push({kind:'event',mission:m.id,step:o.id,text:'"'+m.title+'": step "'+o.label+'" is now completed by a different action.'});
    if(JSON.stringify(x.requires||[])!==JSON.stringify(o.requires||[]))out.push({kind:'order',mission:m.id,step:o.id,text:'"'+m.title+'": the order of steps changed around "'+o.label+'".'});
    for(const k of ['say','early'])if(JSON.stringify(x[k]||[])!==JSON.stringify(o[k]||[]))out.push({kind:'lines',mission:m.id,step:o.id,text:'"'+m.title+'": what is said '+(k==='say'?'when':'too early at')+' "'+o.label+'" changed.'});}
   for(const x of b.objectives||[])if(!m.objectives.some(o=>o.id===x.id))out.push({kind:'step-removed',mission:m.id,step:x.id,text:'"'+m.title+'": step "'+x.label+'" is removed.'});
  }
  for(const b of before||[])if(!now.has(b.id))out.push({kind:'removed',mission:b.id,text:'Mission "'+b.title+'" is removed.'});
  return out;
 }
 /* Warnings for players with saved progress (what migrate() does about each, in plain words). */
 function warnings(before,after){
  const w=[];for(const c of changes(before,after)){
   if(c.kind==='removed')w.push(c.text+' Players who are on it or finished it keep their record; a player who was on it moves on to the next mission they have not finished.');
   if(c.kind==='step-removed')w.push(c.text+' Players who already did it keep the tick; a player for whom it was the last step left gets the mission completed and paid as normal.');
   if(c.kind==='step-added')w.push(c.text+' Players who already finished this mission are not asked to do it; players who are part-way through will need to do it.');
   if(c.kind==='event')w.push(c.text+' Players who already did that step keep it.');
   if(c.kind==='reward')w.push(c.text+' Players who already finished it are not paid again or charged back.');
  }
  return w;
 }
 /* Safe progress mapping after content changes (never deletes anything from a save). s: a campaign state; missions: the beginner missions now in force; B: VoidBeginner-like {flagOf}.
    Returns the list of actions taken. Rules: records of removed missions/steps are kept; an in-progress mission whose remaining steps are all done is completed and paid once,
    exactly as the runner would have done; a tracked mission that no longer exists is untracked (the runner offers and tracks the next one). */
 function migrate(s,missions,flagOf=id=>'br_'+id,trees=null){
  const acts=[];if(!s||!s.universe||!s.universe.missions||!Array.isArray(missions))return acts;
  const rec=s.universe.missions,by=new Map(missions.map(m=>[m.id,m]));
  for(const m of missions){const r=rec[m.id];if(!r||!r.acquired||r.completed)continue;
   if(m.objectives.length&&m.objectives.every(o=>r.objectives&&r.objectives[o.id]===true)){r.completed=true;acts.push('completed '+m.id);
    s.story=s.story||{};s.story.flags=s.story.flags||{};if(s.story.flags[flagOf(m.id)]!==true){s.story.flags[flagOf(m.id)]=true;if(Number(m.rewards)>0){s.credits=(s.credits||0)+Number(m.rewards);acts.push('paid '+m.rewards+' for '+m.id);}}
    if(s.universe.trackedMission===m.id)s.universe.trackedMission=null;}}
  // In a District campaign (closed mission pool) only beginner missions can be held, so a tracked id that is not in the list now is a removed beginner mission.
  const t=s.universe.trackedMission;if(t&&rec[t]&&!by.has(t)&&!(trees||[]).some(x=>x.missions.some(m=>m.id===t))&&s.story&&s.story.flags&&s.story.flags.missionPool==='closed'){s.universe.trackedMission=null;acts.push('untracked removed mission '+t);}
  return acts;
 }
 const api={NEAR,nearMetres,nearList,nearHit,VIA,FACTIONS,photoOk,photoNeed,during,HOW,CHANNELS,WHEN,inbox,markRead,storyTrees,FORMAT,VERSION,EVENTS,TYPES,SPEAKERS,LIMIT,DRAFT,STEP_KINDS,UNLOCKS,check,apply,mapLine,who,snapshot,fromDrafts,notApplied,changes,warnings,migrate,empty,strip,clone,
  waitingAt,treeNeeds,treeStrip,treeBlockers,treesContent,treeDefinition,treeEvent,treeWants,treeTouches,treeFlag,linkFlag,linked,unlockNow};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VoidMissionContent=api;
})(typeof globalThis!=='undefined'?globalThis:this);
