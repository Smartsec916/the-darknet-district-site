/* MISSION CONTENT ADAPTER (pure rules: browser and Node tests; no network, no storage, no DOM).
   ONE adapter puts edited mission content over the shipped missions, used both by the Mission Editor's "PLAY THIS DRAFT" (owner only, a throwaway session)
   and by published live content (every player, fetched from the server by live-content.js). It never invents a second mission engine: it only rewrites the
   records the existing runners already read (void-runner/beginner.js MISSIONS for the beginner campaign, VoidMissions.definitions for the registry missions).
   What it can apply (everything else is listed by notApplied() in plain words, never faked):
     beginner  [mission records in the beginner.js / Studio shape]  titles, descriptions, steps (label, completion event, order/requires, place), what each NPC says
                                                                     when a step is done and the "too soon" line, the credits paid, the ship award, missions added
     registry  {id:{title,description,objectives:{id:label}}}         the V1 Mission Log text of the older registry missions (mission-log.js)
   Content shape: {format:'darknet-district-mission-content',version:1,beginner?:[...],registry?:{...}}. Unknown fields are refused, never ignored. */
(function(root){
 'use strict';
 const FORMAT='darknet-district-mission-content',VERSION=1;
 const ID=/^[a-z][a-z0-9-]{0,79}$/,TAGS=/<[^>]*>|[\u0000-\u0008\u000b\u000c\u000e-\u001f]/;
 // The events the beginner runner fires (beginner-integration.js); the same list as the Developer Studio (admin/studio-model.js EVENTS, checked by a test).
 const EVENTS=['v1-open','keymap-seen','talk-admin','talk-iris','visit-bar','visit-shop','use-terminal','board-ship','launch','warp-meridian','dock-meridian'];
 const TYPES=['main','side','cargo','campaign','tutorial','bounty','station'],AWARDS=['ship'],DESTINATIONS=['earth','meridian'];
 const SPEAKERS=['Admin','Iris','Landing terminal','You','Bartender'];   // the beginner campaign's on-screen speakers (studio-model.js SPEAKERS)
 const LIMIT={missions:40,objectives:20,lines:12,text:500,title:60,description:600,registry:60,credits:100000};
 const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
 const plain=(v,max)=>typeof v==='string'&&v.trim().length>0&&v.length<=max&&!TAGS.test(v);
 const keysOk=(o,allowed)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).every(k=>allowed.includes(k));
 /* Strict check of a content record. ctx: {speakers:Set of extra speaker names (registry display names), registryIds:Set, interactions:Set (optional)}.
    Returns {ok, errors:[plain text]}; a record with any error is never applied. */
 function check(content,ctx={}){
  const errors=[],err=t=>errors.push(t),speakers=new Set([...SPEAKERS,...(ctx.speakers||[])]);
  if(!keysOk(content,['format','version','beginner','registry','note']))return {ok:false,errors:['The content record has an unknown shape.']};
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
  return {ok:!errors.length,errors};
 }
 /* Shipped snapshot (taken once, before anything is applied): applying always starts from it, so a newer version or a rollback never stacks on an older one. */
 function snapshot(env){if(env.shipped)return env.shipped;env.shipped={beginner:clone(env.B?env.B.MISSIONS:[]),registry:clone(env.Missions?env.Missions.definitions:{})};return env.shipped;}
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
  return out;
 }
 /* Builds content from the owner's drafts. studio: the Developer Studio's local draft {missions:[...]} (beginner campaign); local: Mission Editor edits {missions:{key:edit}}. */
 const strip=m=>{const r={id:m.id,title:m.title,type:m.type};for(const k of ['giver','description','destination','prerequisites'])if(m[k]!=null)r[k]=clone(m[k]);if(m.rewards!=null)r.rewards=Number(m.rewards)||0;
  r.objectives=(m.objectives||[]).map(o=>{const x={id:o.id,label:o.label,on:o.on};for(const k of ['requires','interaction','destination','award','say','early'])if(o[k]!=null&&!(Array.isArray(o[k])&&!o[k].length))x[k]=clone(o[k]);if(x.requires)x.requires=x.requires.slice();return x;});return r;};
 function fromDrafts({studio,local,shippedBeginner,note}={}){
  const out={format:FORMAT,version:VERSION};
  if(studio&&Array.isArray(studio.missions)){const b=studio.missions.map(strip);if(!shippedBeginner||JSON.stringify(b)!==JSON.stringify((shippedBeginner||[]).map(strip)))out.beginner=b;}
  const reg={};
  for(const [key,e] of Object.entries((local&&local.missions)||{})){if(!key.startsWith('registry:'))continue;const id=key.slice(9),r={};
   if(e.title!=null)r.title=e.title;if(e.description!=null)r.description=e.description;if(e.steps&&Object.keys(e.steps).length)r.objectives=clone(e.steps);if(Object.keys(r).length)reg[id]=r;}
  if(Object.keys(reg).length)out.registry=reg;
  if(note)out.note=String(note).slice(0,500);
  return out;
 }
 const empty=c=>!c||(!c.beginner&&!c.registry);
 /* Edits in the drafts that the game cannot apply live (draft play and publishing alike), in plain words. */
 function notApplied({studio,local}={}){
  const out=[];
  for(const m of (studio&&studio.missions)||[]){
   if((m.offer||[]).length)out.push('"'+m.title+'": what '+(m.giver||'the giver')+' says when handing the mission over. The game does not speak these lines yet (the Studio stores them as a design note).');
   if((m.choices||[]).length)out.push('"'+m.title+'": the choices. The game does not offer mission choices yet.');
   if((m.unlocks||[]).length)out.push('"'+m.title+'": the store items. No store reads mission unlocks yet.');
  }
  for(const [key,e] of Object.entries((local&&local.missions)||{})){
   const name=e.name||key,reg=key.startsWith('registry:');
   if(e.lines&&Object.keys(e.lines).length)out.push(name+': '+Object.keys(e.lines).length+' changed NPC line(s). These lines are written inside the game code and have no adapter yet.');
   if(e.unlocks&&e.unlocks.length)out.push(name+': what becomes available (store items, ships, areas, flags). Unlocks are a design note until the game reads them.');
   if(e.reputation&&e.reputation.length)out.push(name+': reputation changes. The game has no mission reputation rewards yet.');
   if(e.credits!=null)out.push(name+': the credits. Payment for this mission is set in campaign code, not in the mission record.');
   if(e.endingNote)out.push(name+': the note about where the mission ends (a design note).');
   if(!reg&&!key.startsWith('beginner:')&&(e.title!=null||e.description!=null||(e.steps&&Object.keys(e.steps).length)))out.push(name+': title, description and step text. Contracts are flown, not tracked in the Mission Log, and have no adapter yet.');
  }
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
 function migrate(s,missions,flagOf=id=>'br_'+id){
  const acts=[];if(!s||!s.universe||!s.universe.missions||!Array.isArray(missions))return acts;
  const rec=s.universe.missions,by=new Map(missions.map(m=>[m.id,m]));
  for(const m of missions){const r=rec[m.id];if(!r||!r.acquired||r.completed)continue;
   if(m.objectives.length&&m.objectives.every(o=>r.objectives&&r.objectives[o.id]===true)){r.completed=true;acts.push('completed '+m.id);
    s.story=s.story||{};s.story.flags=s.story.flags||{};if(s.story.flags[flagOf(m.id)]!==true){s.story.flags[flagOf(m.id)]=true;if(Number(m.rewards)>0){s.credits=(s.credits||0)+Number(m.rewards);acts.push('paid '+m.rewards+' for '+m.id);}}
    if(s.universe.trackedMission===m.id)s.universe.trackedMission=null;}}
  // In a District campaign (closed mission pool) only beginner missions can be held, so a tracked id that is not in the list now is a removed beginner mission.
  const t=s.universe.trackedMission;if(t&&rec[t]&&!by.has(t)&&s.story&&s.story.flags&&s.story.flags.missionPool==='closed'){s.universe.trackedMission=null;acts.push('untracked removed mission '+t);}
  return acts;
 }
 const api={FORMAT,VERSION,EVENTS,TYPES,SPEAKERS,LIMIT,check,apply,snapshot,fromDrafts,notApplied,changes,warnings,migrate,empty,strip,clone};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VoidMissionContent=api;
})(typeof globalThis!=='undefined'?globalThis:this);
