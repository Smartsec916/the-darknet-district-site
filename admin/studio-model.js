/* DEVELOPER STUDIO: the shared record model and its rules (pure: browser and Node tests; no network, no secrets).
   One record model, with stable ids, for the content the Studio edits today:
     mission   {id,title,type,giver,description,destination,rewards,prerequisites[],objectives[{id,label,on,requires[],interaction,destination,award,say[],early[]}]}
     (NPCs and dialogue lines are VIEWS of the same records: an NPC is a speaker or giver id from the existing voice registry; a dialogue line is {who,text} inside an objective.)
   The Studio never invents a second identity system: speakers must exist in tools/audio/npc-voice-registry.json (or be the game's own on-screen speakers listed in `SPEAKERS`).
   DRAFTS are local to the browser until a reviewed publish exists (pull-request workflow, not built yet). Nothing here changes the live game. */
(function(root){
 'use strict';
 const EVENTS={'v1-open':'The V1 is opened','keymap-seen':'The KeyMap has been shown','talk-admin':'Interact with Admin','talk-iris':'Interact with Iris','visit-bar':'Interact with the bar','visit-shop':'Interact with the shop','use-terminal':'Use the Landing Terminal on the street','board-ship':'Board the ship in flight mode','launch':'Depart the pad (flight)','warp-meridian':'Jump toward Meridian','dock-meridian':'Dock at Meridian Station'};
 const SPEAKERS=['Admin','Iris','Landing terminal','You','Bartender'];   // on-screen speakers the beginner campaign uses; named NPCs come from the voice registry
 const ID=/^[a-z][a-z0-9-]{0,79}$/,TYPES=['main','side','cargo','campaign','tutorial','bounty','station'];
 const clone=v=>JSON.parse(JSON.stringify(v));
 /* ctx: {interactions:Set, npcs:Set(of ids/display names), missions: other mission ids that exist (for reference checks)} */
 function validate(missions,ctx={}){
  const issues=[],add=(level,where,text)=>issues.push({level,where,text}),ids=new Set();
  const interactions=ctx.interactions||new Set(),speakers=new Set([...SPEAKERS,...(ctx.npcs||[])]);
  for(const m of missions){
   const w=m.id||'(no id)';
   if(!ID.test(m.id||''))add('error',w,'Mission id must be lowercase letters, digits and hyphens (the save validator requires this).');
   if(ids.has(m.id))add('error',w,'Duplicate mission id.');ids.add(m.id);
   if(!m.title||m.title.length>60)add('error',w,'Title is required (60 characters at most).');
   if(!m.description)add('warn',w,'No description: the V1 Mission Log shows it.');
   if(!TYPES.includes(m.type))add('error',w,'Unknown mission type "'+m.type+'".');
   if(m.rewards!=null&&(!Number.isFinite(Number(m.rewards))||Number(m.rewards)<0||Number(m.rewards)>100000))add('error',w,'Reward must be credits between 0 and 100000.');
   if(m.giver&&!speakers.has(m.giver))add('warn',w,'Giver "'+m.giver+'" is not a known NPC or speaker.');
   if(!Array.isArray(m.objectives)||!m.objectives.length)add('error',w,'A mission needs at least one objective.');
   const oids=new Set();
   for(const o of m.objectives||[]){
    const ow=w+' / '+(o.id||'?');
    if(!ID.test(o.id||''))add('error',ow,'Objective id must be lowercase letters, digits and hyphens.');if(oids.has(o.id))add('error',ow,'Duplicate objective id.');oids.add(o.id);
    if(!o.label)add('error',ow,'Objective needs a label (shown in the V1).');
    if(o.on&&!EVENTS[o.on])add('error',ow,'Unknown completion event "'+o.on+'". Known: '+Object.keys(EVENTS).join(', ')+'.');
    if(!o.on)add('warn',ow,'No completion event: nothing in the game can complete this objective.');
    for(const r of o.requires||[])if(!(m.objectives||[]).some(x=>x.id===r))add('error',ow,'Requires "'+r+'", which is not an objective of this mission.');
    if(o.interaction&&interactions.size&&!interactions.has(o.interaction)&&o.interaction!=='board')add('error',ow,'Interaction "'+o.interaction+'" does not exist in the District or the street.');
    for(const l of [...(o.say||[]),...(o.early||[])]){if(!l.text)add('error',ow,'A dialogue line has no text.');if(!speakers.has(l.who))add('error',ow,'Speaker "'+l.who+'" is not a known NPC or speaker.');}
   }
   // an objective whose requirements form a cycle can never be completed
   const reach=(id,seen=new Set())=>{if(seen.has(id))return false;seen.add(id);const o=(m.objectives||[]).find(x=>x.id===id);return !o||(o.requires||[]).every(r=>reach(r,new Set(seen)));};
   for(const o of m.objectives||[])if(o.id&&!reach(o.id))add('error',w+' / '+o.id,'Its requirements loop back to itself: it can never be completed.');
   for(const p of m.prerequisites||[])if(!missions.some(x=>x.id===p)&&!(ctx.otherMissions||new Set()).has(p))add('error',w,'Prerequisite "'+p+'" does not exist.');
  }
  // chains: a prerequisite cycle means the chain can never start
  const by=new Map(missions.map(m=>[m.id,m]));
  const loop=(id,seen=[])=>{if(seen.includes(id))return true;const m=by.get(id);return !!m&&(m.prerequisites||[]).some(p=>loop(p,[...seen,id]));};
  for(const m of missions)if(loop(m.id))add('error',m.id,'Prerequisites form a loop: this mission can never start.');
  const starts=missions.filter(m=>!(m.prerequisites||[]).length);if(missions.length&&starts.length!==1)add(starts.length?'warn':'error','chain',starts.length?'More than one mission can start first ('+starts.map(m=>m.id).join(', ')+').':'No mission can start: every mission has a prerequisite.');
  return issues;
 }
 /* Layered layout for the mission-flow view: a mission sits one level after its latest prerequisite. */
 function flow(missions){
  const by=new Map(missions.map(m=>[m.id,m])),level=new Map();
  const lv=(id,seen=new Set())=>{if(level.has(id))return level.get(id);if(seen.has(id))return 0;seen.add(id);const m=by.get(id);const v=m&&(m.prerequisites||[]).length?1+Math.max(...m.prerequisites.map(p=>lv(p,seen))):0;level.set(id,v);return v;};
  for(const m of missions)lv(m.id);
  const cols=[];for(const m of missions){(cols[level.get(m.id)]??=[]).push(m.id);}
  const nodes=missions.map(m=>({id:m.id,title:m.title,level:level.get(m.id),row:cols[level.get(m.id)].indexOf(m.id)})),edges=[];
  for(const m of missions)for(const p of m.prerequisites||[])if(by.has(p))edges.push({from:p,to:m.id});
  return {nodes,edges,levels:cols.length};
 }
 /* Dialogue graph for one mission: objective nodes, the lines they speak when completed, and the "too soon" branch when the event arrives before the requirements are met. */
 function dialogueGraph(mission){
  const nodes=[],edges=[];
  for(const o of mission.objectives||[]){
   nodes.push({id:o.id,kind:'objective',label:o.label,on:o.on});
   if((o.say||[]).length){nodes.push({id:o.id+':say',kind:'lines',lines:o.say});edges.push({from:o.id,to:o.id+':say',label:'completed'});}
   if((o.early||[]).length){nodes.push({id:o.id+':early',kind:'lines',lines:o.early});edges.push({from:o.id,to:o.id+':early',label:'too soon'});}
   for(const r of o.requires||[])edges.push({from:r,to:o.id,label:'requires'});
  }
  return {nodes,edges};
 }
 /* Which events does the game fire, and which objectives can therefore be completed? (a missing link would strand the player) */
 function reachable(missions){const out=[];for(const m of missions)for(const o of m.objectives||[])if(!o.on||!EVENTS[o.on])out.push(m.id+' / '+o.id);return out;}
 // Draft = a set of field changes against the shipped definitions. Plain JSON; safe to export and review.
 function diff(base,draft){
  const changes=[],byB=new Map(base.map(m=>[m.id,m])),byD=new Map(draft.map(m=>[m.id,m]));
  for(const [id,m] of byD){const b=byB.get(id);if(!b){changes.push({id,kind:'added',summary:'New mission "'+m.title+'"'});continue;}
   for(const k of ['title','type','giver','description','destination','rewards']){if(JSON.stringify(b[k]??null)!==JSON.stringify(m[k]??null))changes.push({id,kind:'changed',field:k,from:b[k]??null,to:m[k]??null,summary:id+' · '+k+': '+JSON.stringify(b[k]??null)+' → '+JSON.stringify(m[k]??null)});}
   if(JSON.stringify(b.prerequisites||[])!==JSON.stringify(m.prerequisites||[]))changes.push({id,kind:'changed',field:'prerequisites',summary:id+' · prerequisites: '+(b.prerequisites||[]).join(',')+' → '+(m.prerequisites||[]).join(',')});
   if(JSON.stringify(b.objectives)!==JSON.stringify(m.objectives))changes.push({id,kind:'changed',field:'objectives',summary:id+' · objectives or dialogue changed ('+(b.objectives||[]).length+' → '+(m.objectives||[]).length+' objectives)'});}
  for(const id of byB.keys())if(!byD.has(id))changes.push({id,kind:'removed',summary:'Mission "'+id+'" removed'});
  return changes;
 }
 /* Export format for review and a later pull-request publish. A digest lets a reviewer see an exported file was not edited by hand. */
 function exportDraft(draft,summary,base){return {format:'darknet-district-studio-draft',version:1,createdAt:new Date().toISOString(),summary:String(summary||'').slice(0,500),changes:diff(base,draft).map(c=>c.summary),missions:draft,status:'DRAFT · not published'};}
 // Steps the campaign with its own events in order: proves every mission can be reached and finished (used as the Studio's preview).
 function simulate(missions){
  const done=new Set(),order=[],stuck=[];let progress=true;
  while(progress){progress=false;for(const m of missions){if(done.has(m.id)||!(m.prerequisites||[]).every(p=>done.has(p)))continue;const ok=new Set();let inner=true;
   while(inner){inner=false;for(const o of m.objectives||[])if(!ok.has(o.id)&&o.on&&EVENTS[o.on]&&(o.requires||[]).every(r=>ok.has(r))){ok.add(o.id);inner=true;order.push(m.id+' / '+o.id+'  ← '+EVENTS[o.on]);}}
   if((m.objectives||[]).every(o=>ok.has(o.id))){done.add(m.id);progress=true;}else stuck.push(m.id);}}
  return {completed:[...done],order,stuck:missions.filter(m=>!done.has(m.id)).map(m=>m.id)};
 }
 const api={EVENTS,SPEAKERS,ID,TYPES,clone,validate,flow,dialogueGraph,reachable,diff,exportDraft,simulate};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.StudioModel=api;
})(typeof globalThis!=='undefined'?globalThis:this);
