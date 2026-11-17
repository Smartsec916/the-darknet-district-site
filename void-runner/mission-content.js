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
   Content shape: {format:'darknet-district-mission-content',version:1,beginner?:[...],registry?:{...},lines?:[...],trees?:[...],names?:{...}}. Unknown fields are refused, never ignored. */
(function(root){
 'use strict';
 const FORMAT='darknet-district-mission-content',VERSION=1;
 const ID=/^[a-z][a-z0-9-]{0,79}$/,TAGS=/<[^>]*>|[\u0000-\u0008\u000b\u000c\u000e-\u001f]/;
 // The events the beginner runner fires (beginner-integration.js); the same list as the Developer Studio (admin/studio-model.js EVENTS, checked by a test).
 const EVENTS=['v1-open','keymap-seen','talk-admin','talk-iris','visit-bar','visit-shop','use-terminal','board-ship','launch','warp-meridian','dock-meridian'];
 const TYPES=['main','side','cargo','campaign','tutorial','bounty','station'],AWARDS=['ship'],DESTINATIONS=['earth','meridian'];
 const SPEAKERS=['Admin','Iris','Landing terminal','You','Bartender'];   // the beginner campaign's on-screen speakers (studio-model.js SPEAKERS)
 const LIMIT={lineEdits:600,missions:40,objectives:20,lines:12,text:500,title:60,description:600,registry:60,credits:100000};
 const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
 const plain=(v,max)=>typeof v==='string'&&v.trim().length>0&&v.length<=max&&!TAGS.test(v);
 const keysOk=(o,allowed)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).every(k=>allowed.includes(k));
 /* Strict check of a content record. ctx: {speakers:Set of extra speaker names (registry display names), registryIds:Set, interactions:Set (optional)}.
    Returns {ok, errors:[plain text]}; a record with any error is never applied. */
 function check(content,ctx={}){
  const errors=[],err=t=>errors.push(t),speakers=new Set([...SPEAKERS,...(ctx.speakers||[])]);
  if(!keysOk(content,['format','version','beginner','registry','lines','note','trees','names']))return {ok:false,errors:['The content record has an unknown shape.']};
  if(content.format!==FORMAT||content.version!==VERSION)err('Unknown content format or version.');
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
 const DRAFT=/^draft-[a-z0-9][a-z0-9-]{0,53}$/,STEP_KINDS=['talk','go','arrive','deliver','buy'],UNLOCKS=['credits','flag','location','ship','tree'],FLAGNAME=/^[a-zA-Z][a-zA-Z0-9_-]{0,47}$/;
 const treeFlag=id=>'mt_'+id,linkFlag=id=>'ts_'+id;
 /* Trees another tree starts (a "start tree" unlock): their first mission waits until the link fires (story.flags.ts_<tree id>). */
 const linked=trees=>new Set((trees||[]).flatMap(t=>(t.missions||[]).flatMap(m=>(m.unlocks||[]).filter(u=>u&&u.kind==='tree').map(u=>u.id))));
 /* ctx: givers (Map id → {canTalk}), places (Set), items (Set: buyable module ids), locations (Set), ships (Map id → {premium}), registryIds (Set: ids a draft id may not take). */
 function checkTrees(trees,ctx,err){
  if(!Array.isArray(trees)||trees.length>10){err('New trees have an unknown shape (10 at most).');return;}
  const tids=new Set(),mids=new Set(),all=new Set(trees.map(t=>t&&t.id));let total=0;
  const npcOk=id=>typeof id==='string'&&(!ctx.givers||(ctx.givers.get(id)||{}).canTalk===true);
  const speakerOk=id=>id==='You'||(typeof id==='string'&&(!ctx.givers||ctx.givers.has(id)));
  const lines=(ls,w)=>{if(ls==null)return;if(!Array.isArray(ls)||ls.length>LIMIT.lines){err(w+': too many lines.');return;}for(const l of ls){if(!keysOk(l,['who','text'])||!plain(l.text,LIMIT.text))err(w+': a line must be plain text (500 characters at most).');else if(!speakerOk(l.who))err(w+': speaker "'+l.who+'" is not a known NPC.');}};
  for(const t of trees){const tw=(t&&t.id)||'(tree)';
   if(!keysOk(t,['id','name','note','missions'])){err(tw+': unknown fields in a tree.');continue;}
   if(!DRAFT.test(t.id||''))err(tw+': a new tree id must start with draft-.');if(tids.has(t.id))err(tw+': duplicate tree id.');tids.add(t.id);
   if(!plain(t.name,LIMIT.title))err(tw+': the tree needs a name (60 characters at most).');
   if(t.note!=null&&!(typeof t.note==='string'&&t.note.length<=300&&!TAGS.test(t.note)))err(tw+': the note must be plain text (300 characters at most).');
   if(!Array.isArray(t.missions)||!t.missions.length||t.missions.length>20){err(tw+': a tree needs 1 to 20 missions.');continue;}
   for(const m of t.missions){total++;const w=tw+' / '+((m&&m.id)||'?');
    if(!keysOk(m,['id','title','type','giver','description','rewards','offer','objectives','ending','unlocks'])){err(w+': unknown fields in a mission.');continue;}
    if(!DRAFT.test(m.id||''))err(w+': a new mission id must start with draft- (60 characters at most).');if(mids.has(m.id)||(ctx.registryIds&&ctx.registryIds.has(m.id)))err(w+': duplicate mission id.');mids.add(m.id);
    if(!plain(m.title,LIMIT.title))err(w+': a title is required (60 characters at most, no HTML).');if(!TYPES.includes(m.type))err(w+': unknown mission type.');
    if(!npcOk(m.giver))err(w+': the giver must be an NPC the game has a TALK prompt for.');
    if(m.description!=null&&!(typeof m.description==='string'&&m.description.length<=LIMIT.description&&!TAGS.test(m.description)))err(w+': the description must be plain text (600 characters at most).');
    if(m.rewards!=null&&!(Number.isInteger(m.rewards)&&m.rewards>=0&&m.rewards<=LIMIT.credits))err(w+': credits must be a whole number between 0 and 100000.');
    lines(m.offer,w);
    if(!Array.isArray(m.objectives)||!m.objectives.length||m.objectives.length>LIMIT.objectives){err(w+': a mission needs 1 to 20 steps.');continue;}
    const oids=new Set();
    for(const o of m.objectives){const ow=w+' / '+((o&&o.id)||'?');
     if(!keysOk(o,['id','label','kind','npc','place','item','say','early'])){err(ow+': unknown fields in a step.');continue;}
     if(!ID.test(o.id||'')||o.id==='turn-in')err(ow+': step id must be lowercase letters, digits and hyphens.');if(oids.has(o.id))err(ow+': duplicate step id.');oids.add(o.id);
     if(!plain(o.label,LIMIT.text))err(ow+': the step needs a label (plain text).');
     if(!STEP_KINDS.includes(o.kind))err(ow+': the game cannot run this kind of step yet (needs a code change).');
     else if(o.kind==='talk'||o.kind==='deliver'){if(!npcOk(o.npc))err(ow+': who the step happens with must be an NPC the game has a TALK prompt for.');}
     else if(o.kind==='go'){if(typeof o.place!=='string'||(ctx.places&&!ctx.places.has(o.place)))err(ow+': unknown place "'+o.place+'".');}
     else if(o.kind==='arrive'){if(typeof o.place!=='string'||(ctx.locations&&!ctx.locations.has(o.place)))err(ow+': "'+o.place+'" is not a place a ship can fly to.');}
     else if(o.kind==='buy'){if(typeof o.item!=='string'||(ctx.items&&!ctx.items.has(o.item)))err(ow+': "'+o.item+'" is not an item a store sells.');}
     lines(o.say,ow);lines(o.early,ow);}
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
     if(u.kind==='tree'&&(typeof u.id!=='string'||!all.has(u.id)||u.id===t.id))err(uw+': "'+u.id+'" is not another of the new trees being sent.');}}
   }}
  if(total>40)err('New trees hold '+total+' missions; 40 at most (each one is a record in every player’s save).');
 }
 /* The places and NPCs a mission touches (for reachability and draft play). */
 function treeTouches(m){const npcs=new Set([m.giver]),places=new Set();for(const o of m.objectives||[]){if(o.npc)npcs.add(o.npc);if(o.place)places.add(o.place);}if(m.ending&&m.ending.npc)npcs.add(m.ending.npc);return {npcs:[...npcs].filter(Boolean),places:[...places]};}
 /* The VoidMissions record for a tree mission (what the V1 Mission Log shows). env.givers: roster list (say names, layout ids and places). */
 function treeDefinition(t,m,i,givers){const g=id=>(givers||[]).find(x=>x.id===id)||null,name=id=>(g(id)||{}).name||id;
  const objectives=m.objectives.map(o=>{const x={id:o.id,label:o.label},who=o.npc&&g(o.npc);if(o.kind==='arrive')x.destination=o.place;if(who&&who.layout)x.interaction=who.layout;const loc=who&&who.enter&&who.enter.location;if(loc)x.destination=loc;return x;});
  if(m.ending&&m.ending.npc){const who=g(m.ending.npc),x={id:'turn-in',label:m.ending.label||('Hand in to '+name(m.ending.npc))};if(who&&who.layout)x.interaction=who.layout;if(who&&who.enter&&who.enter.location)x.destination=who.enter.location;objectives.push(x);}
  return {title:m.title,type:m.type,description:m.description||'',giver:name(m.giver),source:'owner-tree',ownerTree:t.id,rewards:m.rewards||null,prerequisites:i?[t.missions[i-1].id]:[],objectives};}
 /* Applies one unlock to a campaign state. Returns a plain description, or null when nothing changed. */
 function unlockNow(s,u,env,Camp){
  if(u.kind==='credits'){s.credits=(s.credits||0)+u.amount;return '+'+u.amount+' credits';}
  if(u.kind==='flag'){s.story.flags['mf_'+u.id]=u.value;return null;}
  if(u.kind==='location'){const U=env.U;if(U&&U.discover){const known=(s.universe.discoveredLocations||[]).includes(u.id);U.discover(s,u.id);return known?null:'NEW PLACE · '+((U.locations&&U.locations[u.id]&&U.locations[u.id].name)||u.id);}return null;}
  if(u.kind==='ship'&&Camp&&Camp.awardStarterShip){const had=(s.ownedShips||[]).includes(u.id)&&s.story.flags.starterShipAwarded===true;Camp.awardStarterShip(s);if(u.id!=='starter'&&Camp.giveShip)Camp.giveShip(s,u.id);return had?null:'SHIP ACQUIRED';}
  if(u.kind==='tree'){if(s.story.flags[linkFlag(u.id)]===true)return null;s.story.flags[linkFlag(u.id)]=true;const t=(env.trees||[]).find(x=>x.id===u.id);return 'NEW STORY · '+((t&&t.name)||u.id);}
  return null;}
 const treeLive=s=>!!(s&&s.universe&&s.story&&s.story.flags&&s.story.flags.missionPool==='closed');
 /* Something happened: ev {type:'talk', npcs:[roster ids]} | {type:'place', places:[ids]} | {type:'buy', item}. Runs the owner's trees in order: a tree's next mission is offered
    when its giver is talked to; its steps complete in order; it ends when the last step is done, or at the hand-in NPC. Pays once (story.flags.mt_<id>). Never repeats anything.
    Returns {tree, mission, offered, objective, lines, early, completed, reward, notes}. */
 function treeEvent(s,env,ev,Missions,Camp){
  const out={tree:null,mission:null,offered:false,objective:null,lines:[],early:null,completed:false,reward:0,notes:[]};
  if(!treeLive(s)||!env||!Array.isArray(env.trees)||!env.trees.length||!ev)return out;
  const npcs=ev.npcs||[],places=ev.places||[],speak=ls=>(ls||[]).map(l=>({who:l.who==='You'?'You':((env.givers||[]).find(g=>g.id===l.who)||{}).say||l.who,text:l.text}));
  const gated=linked(env.trees),open=t=>!gated.has(t.id)||s.story.flags[linkFlag(t.id)]===true;
  const hit=o=>(o.kind==='talk'||o.kind==='deliver')?ev.type==='talk'&&npcs.includes(o.npc):(o.kind==='go'||o.kind==='arrive')?ev.type==='place'&&places.includes(o.place):o.kind==='buy'?ev.type==='buy'&&ev.item===o.item:false;
  const settle=(m,stepId)=>{const rec=s.universe.missions[m.id];for(const u of m.unlocks||[])if((u.when||'complete')===stepId){const n=unlockNow(s,u,env,Camp);if(n)out.notes.push(n);}
   if(rec&&rec.completed&&s.story.flags[treeFlag(m.id)]!==true){s.story.flags[treeFlag(m.id)]=true;out.completed=true;if(m.rewards>0){s.credits=(s.credits||0)+m.rewards;out.reward=m.rewards;}
    for(const u of m.unlocks||[])if((u.when||'complete')==='complete'){const n=unlockNow(s,u,env,Camp);if(n)out.notes.push(n);}}};
  for(const t of env.trees){if(!open(t))continue;
   for(const m of t.missions){
    const rec=s.universe.missions&&s.universe.missions[m.id];
    if(rec&&rec.completed)continue;
    if(!rec||!rec.acquired){
     if(ev.type==='talk'&&npcs.includes(m.giver)&&Missions.acquire(s,m.id)){Missions.track(s,m.id,Camp);Object.assign(out,{tree:t.id,mission:m.id,offered:true,lines:speak(m.offer)});return out;}
     break;}
    const next=m.objectives.find(o=>rec.objectives[o.id]!==true);
    if(next){
     if(hit(next)){if(!Missions.complete(s,m.id,next.id,Camp))break;Object.assign(out,{tree:t.id,mission:m.id,objective:next.id,lines:speak(next.say)});settle(m,next.id);return out;}
     const later=ev.type==='talk'&&m.objectives.find(o=>rec.objectives[o.id]!==true&&o!==next&&hit(o)&&(o.early||[]).length);
     if(later){Object.assign(out,{tree:t.id,mission:m.id,early:speak(later.early)});return out;}
     break;}
    if(m.ending&&m.ending.npc&&ev.type==='talk'&&npcs.includes(m.ending.npc)){if(!Missions.complete(s,m.id,'turn-in',Camp))break;Object.assign(out,{tree:t.id,mission:m.id,objective:'turn-in',lines:speak(m.ending.say)});settle(m,'turn-in');return out;}
    break;}}
  return out;
 }
 /* Does a tree mission want this NPC right now (so the interaction should go to the tree rather than to what the NPC normally does)? */
 function treeWants(s,env,npcs){if(!treeLive(s)||!env||!env.trees)return false;const recs=s.universe.missions||{},gated=linked(env.trees);
  for(const t of env.trees)if(!gated.has(t.id)||s.story.flags[linkFlag(t.id)]===true)for(const m of t.missions){const rec=recs[m.id];if(rec&&rec.completed)continue;
   if(!rec||!rec.acquired){if(npcs.includes(m.giver))return true;break;}
   const rest=m.objectives.filter(o=>rec.objectives[o.id]!==true),talks=o=>(o.kind==='talk'||o.kind==='deliver')&&npcs.includes(o.npc);
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
  env.trees=clone((content&&content.trees)||[]);env.names=clone((content&&content.names)||{});
  if(env.Missions)for(const t of env.trees)t.missions.forEach((m,i)=>env.Missions.define(m.id,treeDefinition(t,m,i,env.givers)));
  if(env.trees.length)out.applied.push('new trees: '+env.trees.map(t=>t.name+' ('+t.missions.length+')').join(', '));if(Object.keys(env.names).length)out.applied.push(Object.keys(env.names).length+' tree name(s)');
  return out;
 }
 /* A line about to be shown ({who,text}) → the edited line, or the same object when nothing applies. */
 function mapLine(env,l){if(!l||!env||!env.lineMap||!env.lineMap.size||typeof l.text!=='string')return l;const to=env.lineMap.get(who(l.who)+'|'+l.text);return to==null?l:{...l,text:to,edited:true};}
 /* Builds content from the owner's drafts. studio: the Developer Studio's local draft {missions:[...]} (beginner campaign); local: Mission Editor edits {missions:{key:edit}}. */
 const strip=m=>{const r={id:m.id,title:m.title,type:m.type};for(const k of ['giver','description','destination','prerequisites'])if(m[k]!=null)r[k]=clone(m[k]);if(m.rewards!=null)r.rewards=Number(m.rewards)||0;
  r.objectives=(m.objectives||[]).map(o=>{const x={id:o.id,label:o.label,on:o.on};for(const k of ['requires','interaction','destination','award','say','early'])if(o[k]!=null&&!(Array.isArray(o[k])&&!o[k].length))x[k]=clone(o[k]);if(x.requires)x.requires=x.requires.slice();return x;});return r;};
 /* ---- new trees in the owner's draft → content. Only what the game can run is sent: in each tree, the missions in order up to the first one that cannot run yet. */
 const said=(ls,who)=>(ls||[]).filter(l=>l&&typeof l.text==='string'&&l.text.trim()).map(l=>({who:l.who||who||'You',text:l.text.trim()}));
 const SUPPORTED_UNLOCK=u=>UNLOCKS.includes(u.kind)&&(u.kind!=='ship'||['starter','ship2'].includes(u.id));
 function treeStrip(m){const r={id:m.id,title:String(m.title||'').trim(),type:m.type||'side',giver:m.giver};if(m.description)r.description=m.description;if(Number(m.rewards)>0)r.rewards=Math.floor(Number(m.rewards));
  const offer=said(m.offer,m.giver);if(offer.length)r.offer=offer;
  r.objectives=(m.objectives||[]).map(o=>{const x={id:o.id,label:String(o.label||'').trim(),kind:o.kind};for(const k of ['npc','place','item'])if(o[k]!=null&&o[k]!=='')x[k]=o[k];const sy=said(o.say,o.npc||m.giver),ea=said(o.early,o.npc||m.giver);if(sy.length)x.say=sy;if(ea.length)x.early=ea;return x;});
  if(m.ending&&(m.ending.npc||m.ending.place||said(m.ending.say,m.giver).length)){const e={};if(m.ending.npc)e.npc=m.ending.npc;if(m.ending.place)e.place=m.ending.place;if(m.ending.label&&m.ending.label.trim())e.label=m.ending.label.trim();const sy=said(m.ending.say,m.ending.npc||m.giver);if(sy.length)e.say=sy;r.ending=e;}
  const un=(m.unlocks||[]).filter(SUPPORTED_UNLOCK).map(u=>{const x={kind:u.kind};for(const k of ['id','amount','value','when'])if(u[k]!=null&&u[k]!=='')x[k]=u[k];if(x.when==='complete')delete x.when;return x;});if(un.length)r.unlocks=un;
  return r;}
 /* Why a draft mission cannot run in the game yet (plain words; empty = it can). givers: roster list; items: buyable ids (Set). */
 function treeBlockers(m,givers,items){const out=[],g=id=>(givers||[]).find(x=>x.id===id),can=id=>{const x=g(id);return !!(x&&x.canTalk&&x.draft);},nm=id=>(g(id)||{}).name||id||'nobody';
  if(!String(m.title||'').trim())out.push('it needs a name');
  if(!m.giver)out.push('nobody gives it yet');else if(!can(m.giver))out.push(nm(m.giver)+' cannot hand over a mission in the game today ('+((g(m.giver)||{}).why||'no TALK prompt')+')');
  if(!(m.objectives||[]).length)out.push('it has no steps');
  for(const [i,o] of (m.objectives||[]).entries()){const w='step '+(i+1);
   if(!STEP_KINDS.includes(o.kind)){out.push(w+' ('+(o.kind||'no kind')+') needs a code change');continue;}
   if(!String(o.label||'').trim())out.push(w+' needs “what the player must do”');
   if((o.kind==='talk'||o.kind==='deliver')&&!can(o.npc))out.push(w+': '+(o.npc?nm(o.npc)+' cannot be talked to in the game today':'choose who it happens with'));
   if((o.kind==='go'||o.kind==='arrive')&&!o.place)out.push(w+': choose the place');if(o.kind==='buy'&&(!o.item||(items&&!items.has(o.item))))out.push(w+': choose an item a store sells');}
  if(m.ending&&m.ending.npc&&!can(m.ending.npc))out.push('the hand-in NPC '+nm(m.ending.npc)+' cannot be talked to in the game today');
  return out;}
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
  const names=Object.fromEntries(Object.entries((local&&local.names)||{}).filter(([id,n])=>ID.test(id)&&typeof n==='string'&&n.trim()).map(([id,n])=>[id,n.trim().slice(0,60)]));if(Object.keys(names).length)out.names=names;
  if(note)out.note=String(note).slice(0,500);
  return out;
 }
 const empty=c=>!c||(!c.beginner&&!c.registry&&!(c.lines&&c.lines.length)&&!(c.trees&&c.trees.length)&&!(c.names&&Object.keys(c.names).length));
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
 const api={FORMAT,VERSION,EVENTS,TYPES,SPEAKERS,LIMIT,DRAFT,STEP_KINDS,UNLOCKS,check,apply,mapLine,who,snapshot,fromDrafts,notApplied,changes,warnings,migrate,empty,strip,clone,
  treeStrip,treeBlockers,treesContent,treeDefinition,treeEvent,treeWants,treeTouches,treeFlag,linkFlag,linked,unlockNow};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VoidMissionContent=api;
})(typeof globalThis!=='undefined'?globalThis:this);
