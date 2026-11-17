/* DEVELOPER TOOLS > MISSION EDITOR (browser only; loaded on demand when the tab is opened by a server-confirmed developer; UI visibility is not authorization,
   every private read and write is checked by the API). David asked for it on 17 Nov 2026: every mission tree, the NPCs in it, what each NPC says, what has to be done,
   where it ends, and what becomes available; plus every NPC's lines outside missions. Data: mission-trees.js (read-only extraction). Edits: the owner's DRAFT, saved as
   he types (this browser; the beginner campaign in the Content Studio's own draft so both tools edit one draft). PLAY THIS DRAFT uses the same adapter as publishing
   (mission-content.js) in a throwaway test session (dev-test.js). PUBLISH TO ALL PLAYERS and RE-VOICE go through owner-only server routes that are off until switched on. */
(function(root){
 'use strict';
 const T=()=>root.VoidMissionTrees,MC=()=>root.VoidMissionContent,SM=()=>root.StudioModel;
 const KEY='mission-editor-drafts-v1',STUDIO='studio-drafts-v1',RETURN='mission-editor-return';
 const el=(tag,text,cls,attrs)=>{const e=document.createElement(tag);if(text!==undefined&&text!==null)e.textContent=text;if(cls)e.className=cls;for(const [k,v] of Object.entries(attrs||{}))e.setAttribute(k,v);return e;};
 const btn=(text,fn,cls,attrs)=>{const b=el('button',text,cls,{type:'button',...(attrs||{})});b.onclick=e=>{e.preventDefault();fn(e);};return b;};
 const read=(k,fallback,where=root.localStorage)=>{try{const v=JSON.parse(where.getItem(k)||'null');return v??fallback;}catch{return fallback;}};
 const write=(k,v,where=root.localStorage)=>{try{where.setItem(k,JSON.stringify(v));return true;}catch{return false;}};
 const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
 let built=null,index=null,refs=null,src=null,host=null,headNode=null,loading=null,status='';
 const ui={mode:'trees',tree:'beginner',mission:null,step:null,npc:'admin',flow:false,check:null};
 const server={roles:null,live:null,queue:null,drafts:null,note:{}};
 // ---------------------------------------------------------------- drafts (saved on every edit)
 function local(){const d=read(KEY,null);return d&&d.version===1?{missions:{},lines:{},played:{},...d}:{version:1,missions:{},lines:{},played:{}};}
 function saveLocal(d){d.version=1;d.savedAt=new Date().toISOString();write(KEY,d);}
 const shipped=()=>root.VoidLiveContent?.env?.shipped||{beginner:root.VoidBeginner?.MISSIONS||[],registry:root.VoidMissions?.definitions||{}};
 function studio(){const d=read(STUDIO,null);return d&&Array.isArray(d.missions)?d:null;}
 function studioEnsure(){return studio()||{missions:clone(shipped().beginner),summary:'',savedAt:new Date().toISOString()};}
 function saveStudio(d){d.savedAt=new Date().toISOString();write(STUDIO,d);}
 function editOf(key){return local().missions[key]||{};}
 function setEdit(key,fn,name){const d=local(),e=d.missions[key]||{};fn(e);e.name=name||e.name;for(const k of Object.keys(e))if(e[k]==null||(typeof e[k]==='object'&&!Array.isArray(e[k])&&!Object.keys(e[k]).length)||(Array.isArray(e[k])&&!e[k].length))delete e[k];
  if(Object.keys(e).filter(k=>k!=='name').length)d.missions[key]=e;else delete d.missions[key];saveLocal(d);}
 // ---------------------------------------------------------------- loading the game data
 const getJSON=async(url)=>{try{const r=await fetch(url,{cache:'no-cache'});return r.ok?await r.json():null;}catch{return null;}};
 const getText=async(url)=>{try{const r=await fetch(url,{cache:'no-cache'});return r.ok?await r.text():null;}catch{return null;}};
 async function load(){
  const files={};await Promise.all(T().FILES.concat(['void-runner/story-content.js']).map(async f=>{const t=await getText(f);if(t!=null)files[f]=t;}));
  const [registry,manifest,extraManifest]=await Promise.all([getJSON('tools/audio/npc-voice-registry.json'),getJSON('void-runner/assets/audio/voice/manifest.json'),getJSON('void-runner/assets/audio/voice/extra/manifest.json')]);
  const sh=shipped();src={missions:sh.registry,beginner:sh.beginner,content:root.VoidContent,campaign:root.VoidCampaign||root.C,story:root.VoidStoryContent,registry,manifest,extraManifest,files,milked:root.VoidMilked,
   modules:root.VoidProgression?.modules,ships:root.VoidShips?.ships,locations:root.VoidUniverse?.locations,stores:SM().STORES};
  rebuild();refs=T().refs(src);
  await refreshServer();
 }
 function rebuild(){built=T().build({...src,studioDraft:studio(),serverDrafts:server.drafts});index=T().lineIndex(built);}
 async function call(path,body){const r=typeof VoidDevTools!=='undefined'?VoidDevTools.request:null;if(!r)throw new Error('Sign in again.');return r(path,body);}
 async function refreshServer(){
  const tries=[['roles','developer/drafts/schema'],['live','developer/live-content'],['queue','developer/revoice']];
  await Promise.all(tries.map(async([k,p])=>{try{server[k]=await call(p);server.note[k]='';}catch(e){server[k]=null;server.note[k]=e.status===404?'off':e.status===403?'not-authorized':e.status===503?'off':'unreachable';}}));
  if(server.roles?.roles?.editor&&server.roles.roles.draftsEnabled){try{server.drafts=(await call('developer/drafts')).drafts||[];}catch{server.drafts=null;}}
  rebuild();
 }
 // ---------------------------------------------------------------- what is shown and how edits are stored
 const findMission=key=>{for(const t of built.trees)for(const m of t.missions)if(m.key===key)return {tree:t,mission:m};return null;};
 const lineEdit=l=>l.kind==='beginner'?null:local().lines[l.ref]||null;
 const shownText=l=>{const e=lineEdit(l);return e?e.to:l.text;};
 function setLine(l,text,unlocked){
  if(l.kind==='beginner'){const st=studioEnsure(),[mid,oid,kind,k]=l.key.slice(9).split('/'),m=st.missions.find(x=>x.id===mid),o=m&&m.objectives.find(x=>x.id===oid);if(o&&o[kind]&&o[kind][k]){o[kind][k].text=text;saveStudio(st);}return;}
  if(l.kind==='design'){const st=studioEnsure(),mid=l.key.slice(9).split('/')[0],m=st.missions.find(x=>x.id===mid),k=Number(l.key.split('/').pop());if(m&&m.offer&&m.offer[k]){m.offer[k].text=text;saveStudio(st);}return;}
  const d=local(),prev=d.lines[l.ref]||{};if(text===l.text&&!(unlocked??prev.unlocked))delete d.lines[l.ref];else d.lines[l.ref]={who:l.who,from:l.text,to:text,adapter:l.adapter,source:l.source,...((unlocked??prev.unlocked)?{unlocked:true}:{})};saveLocal(d);}
 const queueItem=(who,text)=>(server.queue?.items||[]).find(q=>q.who===who&&q.text===text)||null;
 function voiceState(l){const t=shownText(l),edited=t!==l.text,q=queueItem(l.who,t);
  if(l.who==='player')return {text:'the player’s own line (not voiced)',cls:'muted'};
  if(q)return q.status==='done'?{text:'re-voiced',cls:'ok'}:q.engine==='elevenlabs'?{text:'waiting for ElevenLabs re-voice (needs approval)',cls:'warn'}:{text:'queued for re-voice',cls:'warn'};
  if(edited&&l.recorded)return {text:'voice clip out of date: text only until re-voiced',cls:'bad',revoice:true};
  if(edited)return {text:'text only',cls:'muted',revoice:!!l.voice};
  return l.recorded?{text:'voice clip recorded'+(l.clip?.engine==='elevenlabs'?' (ElevenLabs)':''),cls:'ok'}:{text:'text only (no voice clip)',cls:'muted'};}
 // ---------------------------------------------------------------- rendering
 function render(panel,head){
  host=panel;headNode=head;
  if(!built){panel.innerHTML='';panel.append(head(),el('p','Loading every mission tree from the game data…','dev-note'));loading=loading||load().then(()=>{restoreReturn();draw();}).catch(e=>{panel.append(el('p','The Mission Editor could not load: '+e.message,'me-bad'));});return;}
  draw();
 }
 function restoreReturn(){const r=read(RETURN,null,root.sessionStorage);if(!r)return;try{root.sessionStorage.removeItem(RETURN);}catch{}Object.assign(ui,{mode:'trees',tree:r.tree||ui.tree,mission:r.mission||null,step:r.step||null});status='Back from your draft play. Your draft is saved and waiting'+(r.mission?' on this mission':'')+'.';}
 function draw(){
  if(!host||!built)return;const keepY=host.scrollTop;host.innerHTML='';host.append(headNode());
  const root_=el('div','','me-root',{id:'me-root'});host.append(root_);
  root_.append(howBox());
  const modes=el('nav','','me-modes',{'aria-label':'Mission Editor views'});for(const [id,name] of [['trees','Mission trees'],['npcs','All lines for an NPC'],['publish','Publish & versions']]){const b=btn(name,()=>{ui.mode=id;ui.check=null;draw();},ui.mode===id?'on':'',{'data-me-mode':id,'aria-pressed':String(ui.mode===id)});modes.append(b);}
  root_.append(modes);if(status)root_.append(el('p',status,'me-status',{role:'status',id:'me-status'}));
  if(ui.mode==='npcs')npcView(root_);else if(ui.mode==='publish')publishView(root_);else treeView(root_);
  host.scrollTop=keepY;
 }
 function howBox(){const pubOn=!!server.live?.enabled,box=el('details','','me-how',{'aria-label':'How edits reach the live game'});box.open=!!ui.howOpen;box.ontoggle=()=>{ui.howOpen=box.open;};
  box.append(el('summary','How your edits reach the game: saved as a DRAFT as you type · PLAY THIS DRAFT never touches your real save · PUBLISH TO ALL PLAYERS: '+(pubOn?'ON':'OFF on the server')+' · RE-VOICE queue: '+(server.queue?'ON':'OFF on the server')+'  (click for details)'));
  const ul=el('ul');
  ul.append(el('li','Every edit is saved as a DRAFT as you type (in this browser). Nobody else sees it.'));
  ul.append(el('li','PLAY THIS DRAFT tries your draft in a throwaway test session. Your real save is never touched; LEAVE DRAFT brings you back here with the draft intact.'));
  ul.append(el('li',pubOn?'PUBLISH TO ALL PLAYERS is switched on: after a check screen, your draft goes to every player the next time their game loads. UNDO puts the previous version back.':'PUBLISH TO ALL PLAYERS is switched OFF on the server ('+(server.note.live==='not-authorized'?'this account is not the configured content editor':'waiting for David to switch it on')+'). Until then edits stay drafts.'));
  ul.append(el('li',server.queue?'RE-VOICE adds a changed line to the re-voice queue; David records it on his PC (Kokoro) or, for Admin, in ElevenLabs once approved.':'RE-VOICE queue: switched off on the server. Changed lines are shown as text until re-voiced.'));
  ul.append(el('li','Lines marked “needs a code change” are kept in your draft and in EXPORT MY EDITS for Claude or Codex to apply.'));
  box.append(ul);return box;}
 // ---------------- trees
 function treeView(root_){
  const cols=el('div','','me-cols');const side=el('aside','','me-side',{'aria-label':'Mission trees'});
  const groups=[['active','ACTIVE in the current game'],['historical','HISTORICAL (not reachable in the current game)'],['draft','DRAFTS']];
  side.append(el('p',built.counts.trees+' trees · '+built.counts.missions+' missions · '+built.counts.lines+' lines ('+built.counts.locked+' from David’s scripts)','me-small'));
  for(const [st,name] of groups){const ts=built.trees.filter(t=>t.status===st);if(!ts.length)continue;side.append(el('h4',name,'me-group'));
   for(const t of ts){const b=btn(t.title+' ('+t.missions.length+')',()=>{ui.tree=t.id;ui.mission=null;ui.step=null;draw();},ui.tree===t.id?'on':'',{'data-me-tree':t.id});side.append(b);
    if(ui.tree===t.id)for(const m of t.missions){const mb=btn(m.title+(editCount(m)?' ✎':''),()=>{ui.mission=m.key;ui.step=null;draw();},'me-mission'+(ui.mission===m.key?' on':''),{'data-me-mission':m.key});side.append(mb);}}}
  const t=built.trees.find(x=>x.id===ui.tree)||built.trees[0];const main=el('div','','me-main');
  main.append(el('h3',t.title),el('p',t.statusText,'me-badge me-'+t.status),el('p',t.note,'dev-note'),el('p','Source: '+t.source,'me-small'));
  main.append(npcTable(t));
  if(t.id==='beginner'||t.id==='draft-studio'){const sw=el('div','','me-row');sw.append(btn(ui.flow?'Back to the step editor':'Flow chart (same as the Content Studio)',()=>{ui.flow=!ui.flow;draw();},'',{'data-me-flow':'1'}));main.append(sw);
   if(ui.flow&&root.StudioFlow){const box=el('div','','me-flow');main.append(box);flowChart(box);cols.append(side,main);root_.append(cols);return;}}
  const m=t.missions.find(x=>x.key===ui.mission)||t.missions[0];if(m){ui.mission=m.key;main.append(missionPanel(t,m));}
  cols.append(side,main);root_.append(cols);
  if(ui.step){const target=root_.querySelector('[data-me-step="'+CSS.escape(ui.step)+'"]');if(target)setTimeout(()=>target.scrollIntoView({block:'center'}),0);}
 }
 function flowChart(box){
  let draft=studioEnsure().missions;const npcNames=()=>new Set(Object.values(src.registry?.npcs||{}).map(n=>n.displayName));
  const interactions=new Set([...(root.VoidNeoChinatown?.layout('interior').interactions||[]),...(root.VoidNeoChinatown?.layout('street').interactions||[])].map(i=>i.id));
  root.StudioFlow.board(box,{draft:()=>draft,setDraft:v=>{draft=v;},persist:()=>{const st=studioEnsure();st.missions=draft;saveStudio(st);rebuild();},redraw:()=>draw(),npcNames,ctx:()=>({interactions,npcs:npcNames()}),base:()=>clone(shipped().beginner),summary:()=>studio()?.summary||'',resetSummary:()=>{}});
 }
 function npcTable(t){const box=el('section','','me-npcs');box.append(el('h4','NPCs in this tree ('+t.npcs.length+')'));const tb=el('table','','me-table');tb.innerHTML='<tr><th>NPC</th><th>Part in this tree</th><th>Registered voice (read-only)</th><th>Re-voice engine</th></tr>';
  for(const n of t.npcs){const tr=el('tr');const b=btn(n.name,()=>{ui.mode='npcs';ui.npc=n.id;draw();},'me-link');const td=el('td');td.append(b);tr.append(td,el('td',n.roles.join(', ')),el('td',n.voice?n.voice.voice+' · '+n.voice.status:'not in the voice registry (on-screen text only)'),el('td',n.engine?(n.engine.engine==='elevenlabs'?'ElevenLabs · '+n.engine.voice.split(' - ')[0]:'Kokoro'):'—'));tb.append(tr);}
  box.append(tb);return box;}
 function editCount(m){const e=editOf(m.key);let n=Object.keys(e).filter(k=>!['name'].includes(k)).length;for(const l of T().allLines(m))if(l.kind!=='beginner'&&lineEdit(l))n++;return n;}
 function missionPanel(t,m){
  const box=el('article','','me-mission-panel',{'data-me-key':m.key});const isB=m.engine==='beginner',e=editOf(m.key),st=isB?studioEnsure():null,rec=isB?st.missions.find(x=>x.id===m.id):null;
  const field=(label,value,on,area)=>{const l=el('label','','me-field');l.append(el('span',label));const i=el(area?'textarea':'input');i.value=value??'';i.oninput=()=>{on(i.value);status='Draft saved.';const s=host.querySelector('#me-status');if(s)s.textContent=status;};l.append(i);return l;};
  const editable=['beginner','registry','contract','data'].includes(m.engine);
  box.append(el('h3',m.title),el('p',(m.type||'')+' · giver: '+(m.giverName||'—')+(m.destination?' · goes to '+m.destination:'')+(m.draftOnly?' · DRAFT ONLY (not in the game)':''),'me-small'));
  const played=local().played[m.key];if(played)box.append(el('p','Last played as a draft: '+new Date(played).toLocaleString(),'me-small',{'data-me-played':'1'}));
  if(editable){const g=el('div','','me-grid');
   g.append(field('Mission name',isB?rec?.title:e.title??m.title,v=>{if(isB){const s=studioEnsure();const r=s.missions.find(x=>x.id===m.id);if(r){r.title=v;saveStudio(s);}}else setEdit(m.key,x=>{x.title=v===m.title?null:v;},m.title);}));
   g.append(field('Credits paid',String(isB?(rec?.rewards??0):e.credits??m.credits),v=>{const n=v===''?null:Number(v);if(isB){const s=studioEnsure();const r=s.missions.find(x=>x.id===m.id);if(r){r.rewards=Number.isFinite(n)?n:0;saveStudio(s);}}else setEdit(m.key,x=>{x.credits=n===m.credits||v===''?null:n;},m.title);}));
   box.append(g,field('Description (the V1 Mission Log shows it)',isB?rec?.description:e.description??m.description,v=>{if(isB){const s=studioEnsure();const r=s.missions.find(x=>x.id===m.id);if(r){r.description=v;saveStudio(s);}}else setEdit(m.key,x=>{x.description=v===m.description?null:v;},m.title);},true));}
  // what is said when the mission is offered
  if(m.offer.length){box.append(el('h4','What is said when the mission is offered'));for(const sc of groupByScene(m.offer))box.append(sceneBlock(sc.title,sc.lines,sc.meta));}
  // steps
  box.append(el('h4','What needs to be done (steps)'));
  for(const s of m.steps){const sb=el('section','','me-step'+(ui.step===s.id?' on':''),{'data-me-step':s.id});
   const head=el('div','','me-row');head.append(el('b','STEP · '+s.id));if(s.where)head.append(el('span','where: '+s.where,'me-small'));if(s.event)head.append(el('span','completes when: '+(SM().EVENTS[s.event]||s.event),'me-small'));if(s.optional)head.append(el('span','optional','me-small'));
   head.append(btn('PLAY THIS DRAFT FROM HERE',()=>play(m.key,s.id),'me-play',{'data-me-play':m.key+'#'+s.id,...(playable(m)?{}:{disabled:'',title:playable(m,true)})}));sb.append(head);
   if(editable)sb.append(field('What the player must do',isB?(rec?.objectives.find(o=>o.id===s.id)?.label):(e.steps&&e.steps[s.id])??s.label,v=>{if(isB){const st2=studioEnsure();const o=st2.missions.find(x=>x.id===m.id)?.objectives.find(o=>o.id===s.id);if(o){o.label=v;saveStudio(st2);}}else setEdit(m.key,x=>{x.steps=x.steps||{};if(v===s.label)delete x.steps[s.id];else x.steps[s.id]=v;},m.title);}));
   if(s.lines.length){sb.append(el('h5',isB?'What is said when this step is done':'Lines at this step'));for(const sc of groupByScene(s.lines))sb.append(sceneBlock(sc.title,sc.lines,sc.meta));}
   if(s.early.length){sb.append(el('h5','If the player comes too soon'));sb.append(sceneBlock('',s.early,{}));}
   box.append(sb);}
  // other scenes (afterwards etc.)
  const placed=new Set([...m.offer,...m.steps.flatMap(s=>[...s.lines,...s.early])].map(l=>l.key));
  for(const sc of m.scenes){const rest=sc.lines.filter(l=>!placed.has(l.key));if(rest.length){box.append(el('h4',sc.slot==='after'?'Afterwards':sc.slot==='payment'?'Collecting payment':'Scene'));box.append(sceneBlock(sc.title,rest,sc));}}
  // ending
  const end=el('section','','me-end');end.append(el('h4','Where the mission ends'),el('p',m.ending.text));for(const b of m.ending.branches)end.append(el('p','Branch: '+b.text+(b.source?' ('+b.source+')':''),'me-small'));
  if(m.ending.next.length)end.append(el('p','Leads to: '+m.ending.next.join(', '),'me-small'));
  if(editable&&!isB)end.append(field('Your note on the ending (design note)',e.endingNote||'',v=>setEdit(m.key,x=>{x.endingNote=v||null;},m.title),true));box.append(end);
  box.append(unlockBlock(m,e,editable&&!isB));
  // checks and actions
  const issues=missionIssues(m);const val=el('section','','me-issues');val.append(el('h4','Checks'));if(!issues.length)val.append(el('p','No problems found.','me-ok'));for(const i of issues)val.append(el('p',i.text,i.level==='error'?'me-bad':'me-warn'));box.append(val);
  const act=el('div','','me-row me-actions');
  act.append(btn('PLAY THIS DRAFT',()=>play(m.key,null),'me-play',{'data-me-play':m.key,...(playable(m)?{}:{disabled:'',title:playable(m,true)})}));
  const out=T().allLines(m).filter(l=>voiceState(l).revoice);act.append(btn('RE-VOICE ALL OUT-OF-DATE LINES IN THIS MISSION ('+out.length+')',()=>revoice(out,m),'',out.length&&server.queue?{}:{disabled:''}));
  if(m.server&&server.roles?.roles?.editor&&server.roles.roles.draftsEnabled)act.append(btn('SAVE AS PRIVATE SERVER DRAFT',()=>serverDraft(m)));
  act.append(btn('EXPORT MY EDITS',exportEdits),btn('REVERT THIS MISSION',()=>{if(!confirm('Throw away your edits to "'+m.title+'"?'))return;revertMission(m);draw();}));
  box.append(act);if(!playable(m))box.append(el('p',playable(m,true),'me-small'));
  return box;
 }
 function groupByScene(lines){const out=[];for(const l of lines){const t=l.scene||'';let g=out.find(x=>x.title===t);if(!g){g={title:t,lines:[],meta:{}};out.push(g);}g.lines.push(l);}return out;}
 function sceneBlock(title,lines,meta){const box=el('div','','me-scene');if(title)box.append(el('h5',title+(meta&&meta.shared?' (shared with the other arc)':'')+(meta&&meta.partial?' · some lines are built by code and not listed':'')));for(const l of lines)box.append(lineRow(l));return box;}
 function lineRow(l){
  const row=el('div','','me-line',{'data-me-line':l.ref||l.key});const t=shownText(l),e=lineEdit(l),vs=voiceState(l);
  const who=el('div','','me-who');who.append(el('b',l.name),el('span',l.voice?'voice '+l.voice.voice+' ('+l.voice.status+')':'no registered voice','me-small'));row.append(who);
  const body=el('div','','me-say');const unlocked=!l.locked||(e&&e.unlocked);
  const ta=el('textarea','','',{'aria-label':'What '+l.name+' says',rows:String(Math.min(4,Math.ceil(t.length/90)||1))});ta.value=t;ta.disabled=!unlocked;ta.oninput=()=>{setLine(l,ta.value);const s=row.querySelector('.me-vs');const v=voiceState(l);if(s){s.textContent=v.text;s.className='me-vs me-'+v.cls;}};body.append(ta);
  const tags=el('div','','me-tags');
  if(l.locked)tags.append(el('span',unlocked?'David’s script — unlocked for your edit':l.lock,'me-lock'));
  if(l.placeholder)tags.append(el('span','Claude’s placeholder (not David’s words)','me-warn'));
  if(l.kind==='design')tags.append(el('span','design note: the game does not speak it yet','me-warn'));
  tags.append(el('span',l.adapter==='code-change'?'can be edited after the next update (needs a code change)':l.adapter==='records'?'shows in the game (mission records)':'shows in the game when played or published','me-small'));
  tags.append(el('span',vs.text,'me-vs me-'+vs.cls));
  if(l.locked&&!unlocked)tags.append(btn('UNLOCK TO EDIT MY SCRIPT',()=>{if(!confirm('This is your own script ('+l.lock.replace('David’s script — locked ','')+'). Edit it here?'))return;setLine(l,t,true);draw();}));
  if(vs.revoice)tags.append(btn('RE-VOICE',()=>revoice([l]),'',server.queue?{}:{disabled:'',title:'The re-voice queue is switched off on the server.'}));
  if(e)tags.append(btn('UNDO EDIT',()=>{const d=local();delete d.lines[l.ref];saveLocal(d);draw();}));
  body.append(tags);row.append(body);return row;}
 function unlockBlock(m,e,editable){const box=el('section','','me-unlocks');box.append(el('h4','What becomes available'));
  const when=u=>u.when==='complete'?'when the mission is done':u.when==='accept'?'when it is accepted':u.when==='after'?'afterwards':u.when==='offer'?'when it is offered':'at step '+u.when;
  const kind={item:'Store item',ship:'Ship',location:'Place opens',flag:'Story flag',credits:'Credits',mission:'Mission opens',travel:'Travel','design-item':'Store item (Studio design note)'};
  const list=el('ul','','me-unlock-list');if(!m.unlocks.length)list.append(el('li','Nothing in the game data.','me-small'));
  for(const u of m.unlocks)list.append(el('li',(kind[u.kind]||u.kind)+': '+(u.kind==='location'?(refs.locations[u.id]||u.id):u.name)+(u.store&&refs.stores[u.store]?' · at '+refs.stores[u.store]:u.store==='reward'?' · given as a reward':'')+' · '+when(u)+(u.note?' — '+u.note:'')+' ('+u.source+')'));
  box.append(list);
  if(editable){box.append(el('h5','Your additions (draft; the game does not act on them until an adapter exists)'));
   for(const [i,u] of (e.unlocks||[]).entries()){const r=el('div','','me-row');r.append(el('span',(kind[u.kind]||u.kind)+': '+(u.kind==='item'?(refs.items[u.id]||u.id)+' at '+(refs.stores[u.store]||u.store):u.kind==='flag'?u.id+' = '+u.value:(refs[u.kind+'s']?.[u.id]||u.id))+' · '+when(u)));r.append(btn('×',()=>{setEdit(m.key,x=>{x.unlocks=(x.unlocks||[]).filter((_,k)=>k!==i);},m.title);draw();},'me-x',{'aria-label':'Remove'}));box.append(r);}
   for(const [i,x] of (e.reputation||[]).entries()){const r=el('div','','me-row');r.append(el('span','Reputation: '+refs.factions[x.faction]+' '+(x.amount>0?'+':'')+x.amount));r.append(btn('×',()=>{setEdit(m.key,y=>{y.reputation=(y.reputation||[]).filter((_,k)=>k!==i);},m.title);draw();},'me-x'));box.append(r);}
   const add=el('div','','me-row me-add');const kindSel=el('select','','',{'aria-label':'Kind'});for(const [k,n] of [['item','Store item'],['ship','Ship'],['location','Place opens'],['flag','Story flag'],['reputation','Reputation']])kindSel.append(new Option(n,k));
   const idSel=el('select','','',{'aria-label':'Which'}),storeSel=el('select','','',{'aria-label':'Store'}),valIn=el('input','','',{'aria-label':'Value',placeholder:'flag name / amount'}),whenSel=el('select','','',{'aria-label':'When'});
   for(const [k,n] of Object.entries(refs.stores))storeSel.append(new Option(n,k));whenSel.append(new Option('when the mission is done','complete'));for(const s of m.steps)whenSel.append(new Option('at step: '+s.label.slice(0,40),s.id));
   const fill=()=>{idSel.replaceChildren();const k=kindSel.value,src2=k==='item'?refs.items:k==='ship'?refs.ships:k==='location'?refs.locations:k==='reputation'?refs.factions:{};for(const [id,n] of Object.entries(src2))idSel.append(new Option(n+' ('+id+')',id));idSel.hidden=k==='flag';storeSel.hidden=k!=='item';valIn.hidden=!['flag','reputation'].includes(k);};
   kindSel.onchange=fill;fill();
   add.append(kindSel,idSel,storeSel,valIn,whenSel,btn('+ ADD',()=>{const k=kindSel.value;setEdit(m.key,x=>{if(k==='reputation')(x.reputation=x.reputation||[]).push({faction:idSel.value,amount:parseInt(valIn.value,10)||0});else (x.unlocks=x.unlocks||[]).push(k==='flag'?{kind:'flag',id:valIn.value.trim(),value:true,when:whenSel.value}:{kind:k,id:idSel.value,...(k==='item'?{store:storeSel.value}:{}),when:whenSel.value});},m.title);draw();}));
   box.append(add);}
  return box;}
 function missionIssues(m){
  const out=[];
  if(m.engine==='beginner'){const st=studioEnsure();const all=SM().validate(st.missions,{npcs:new Set(Object.values(src.registry?.npcs||{}).map(n=>n.displayName))});for(const i of all)if(i.where===m.id||i.where.startsWith(m.id+' /'))out.push({level:i.level,text:i.where+' — '+i.text});}
  else out.push(...T().validateEdit(m,editOf(m.key),refs));
  const refsHere=new Set(T().allLines(m).map(l=>l.ref)),edits=Object.fromEntries(Object.entries(local().lines).filter(([r])=>refsHere.has(r)));out.push(...T().validateLines(edits,index));
  return out;}
 function revertMission(m){if(m.engine==='beginner'){const st=studioEnsure(),i=st.missions.findIndex(x=>x.id===m.id),orig=shipped().beginner.find(x=>x.id===m.id);if(i>=0&&orig){st.missions[i]=clone(orig);saveStudio(st);}}
  const d=local();delete d.missions[m.key];for(const l of T().allLines(m))if(l.ref&&d.lines[l.ref])delete d.lines[l.ref];saveLocal(d);rebuild();}
 // ---------------- all lines for an NPC
 function npcView(root_){
  const n=built.npcs.find(x=>x.id===ui.npc)||built.npcs[0];ui.npc=n.id;
  const pick=el('div','','me-row');const sel=el('select','','',{'aria-label':'Character','data-me-npc':'1'});for(const x of built.npcs)sel.append(new Option(x.name+' ('+(x.counts.inMissions+x.counts.outside)+' lines)',x.id));sel.value=n.id;sel.onchange=()=>{ui.npc=sel.value;draw();};pick.append(el('b','All lines for '),sel);root_.append(pick);
  root_.append(el('p',(n.voice?'Registered voice (read-only): '+n.voice.voice+' · '+n.voice.status:'Not in the voice registry.')+(n.engine?' · Re-voice engine: '+(n.engine.engine==='elevenlabs'?'ElevenLabs, '+n.engine.voice+' ('+n.engine.note+')':'Kokoro on David’s PC (generate.py --from-queue)'):''),'dev-note'));
  const out=[...n.inMissions,...n.outside].filter(l=>voiceState(l).revoice);root_.append(btn('RE-VOICE ALL OUT-OF-DATE LINES FOR '+n.name.toUpperCase()+' ('+out.length+')',()=>revoice(out),'',out.length&&server.queue?{}:{disabled:''}));
  root_.append(el('h4','In missions ('+n.inMissions.length+')'));
  const byTree=new Map();for(const l of n.inMissions){const k=l.treeTitle+' › '+l.missionTitle;if(!byTree.has(k))byTree.set(k,[]);byTree.get(k).push(l);}
  for(const [k,ls] of byTree){const d=el('details','','me-npc-group');d.open=n.inMissions.length<40;d.append(el('summary',k+' ('+ls.length+')'));const ws=new Map();for(const l of ls){if(!ws.has(l.where))ws.set(l.where,[]);ws.get(l.where).push(l);}for(const [w,ll] of ws){d.append(el('h5',w));for(const l of ll)d.append(lineRow(l));}root_.append(d);}
  root_.append(el('h4','Outside missions ('+n.outside.length+')'));
  const groups=new Map();for(const l of n.outside){const g=l.group||'Other lines';if(!groups.has(g))groups.set(g,[]);groups.get(g).push(l);}
  for(const [g,ls] of groups){const d=el('details','','me-npc-group');d.open=ls.length<20;d.append(el('summary',g+' ('+ls.length+')'));for(const l of ls)d.append(lineRow(l));root_.append(d);}
  if(!n.outside.length&&!n.inMissions.length)root_.append(el('p','No lines found for this character.','dev-note'));
 }
 // ---------------- RE-VOICE (owner-only server queue; nothing is generated in the browser or on the server)
 async function revoice(lines,m){
  const items=lines.filter(l=>l.who!=='player'&&l.voice).map(l=>({ref:l.ref||l.key,who:l.who,text:shownText(l),from:l.text,mission:m?.key||l.mission||'',source:l.source||''}));
  if(!items.length)return;try{server.queue=await call('developer/revoice',{items});status=items.length+' line(s) added to the re-voice queue.';}catch(e){status='Re-voice queue: '+e.message;}draw();}
 async function serverDraft(m){
  const id=('me-'+m.id).slice(0,64);try{const tpl=(await call('developer/drafts/template?kind=mission&source='+encodeURIComponent(m.server))).document,e=editOf(m.key);
   if(e.title)tpl.data.title=e.title;if(e.description!=null)tpl.data.description=e.description;for(const o of tpl.data.objectives)if(e.steps&&e.steps[o.id])o.label=e.steps[o.id];
   const rw=tpl.data.rewards.filter(r=>r.type!=='credits');if(e.credits!=null)rw.unshift({type:'credits',amount:e.credits});else rw.unshift(...tpl.data.rewards.filter(r=>r.type==='credits'));for(const x of e.reputation||[])rw.push({type:'reputation',faction:x.faction,amount:x.amount});tpl.data.rewards=rw;
   let revision=0;try{revision=(await call('developer/drafts/'+id)).revision||0;}catch{}
   const rec=await call('developer/drafts/'+id,{revision,document:tpl});status='Saved as private server draft '+id+' (revision '+rec.revision+'). Lines and unlocks stay in your local draft (the server draft holds the mission text and rewards).';}
  catch(e){status='Server draft not saved: '+e.message;}draw();}
 function exportEdits(){const data={format:'darknet-district-mission-editor-export',version:1,exportedAt:new Date().toISOString(),note:'Owner draft. Lines marked "needs a code change" are for Claude or Codex to apply in the source.',
   content:MC().fromDrafts({studio:studio(),local:local(),shippedBeginner:shipped().beginner}),notApplied:MC().notApplied({studio:studio(),local:local()}),local:local(),studio:studio()};
  const a=el('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,1)],{type:'application/json'}));a.download='mission-editor-draft.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
 // ---------------- PLAY THIS DRAFT
 function playable(m,why){if(['beginner','registry'].includes(m.engine)&&!m.draftOnly||m.engine==='beginner')return why?'':true;
  return why?(m.engine==='contract'?'Not playable as a draft yet: contracts are flown from the contract board and have no draft adapter.':m.engine==='data'?'Not playable: this mission is inactive data; nothing in the game starts it yet.':'Not playable from here.'):false;}
 const STAGE={'ground-training':['inheritance','vesper'],'flight-training':['inheritance','vesper'],'meet-rook':['arrival','meridian'],'first-station':['legal-offer','meridian'],'combat-qualification':['legal-offer','meridian'],'legal-run':['legal-run','meridian'],'return':['return','kepler'],'illegal-run':['illegal-run','meridian'],'meet-admin':['open','earth']};
 function draftContent(){return MC().fromDrafts({studio:studio(),local:local(),shippedBeginner:shipped().beginner,note:'draft play'});}
 function checkCtx(){return {speakers:new Set(Object.values(src.registry?.npcs||{}).map(n=>n.displayName)),registryIds:new Set(Object.keys(shipped().registry).filter(id=>shipped().registry[id]?.beginner!==true)),
  registryObjectives:Object.fromEntries(Object.entries(shipped().registry).map(([id,d])=>[id,new Set((d.objectives||[]).map(o=>o.id))])),lines:new Set(index.keys())};}
 function beginnerState(mid,stepId){
  const B=root.VoidBeginner,M=root.VoidMissions,C=root.C||root.VoidCampaign,s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;
  const doAll=(m,upto)=>{for(const o of m.objectives.slice(0,upto)){M.complete(s,m.id,o.id,C);if(o.award==='ship')C.awardStarterShip(s);}};
  for(const m of B.MISSIONS){if(m.id===mid)break;M.acquire(s,m.id);doAll(m,m.objectives.length);s.story.flags[B.flagOf(m.id)]=true;s.credits=(s.credits||0)+(Number(m.rewards)||0);}
  const m=B.byId[mid];M.acquire(s,mid);const i=stepId?Math.max(0,m.objectives.findIndex(o=>o.id===stepId)):0;doAll(m,i);M.track(s,mid,C);M.sync(s,C);
  const step=m.objectives[i]||m.objectives[0],street=['terminal','board'].includes(step.interaction)||['use-terminal','board-ship','launch','warp-meridian','dock-meridian'].includes(step.on);
  return {state:s,where:street?'street':'interior'};}
 function registryState(mid,stepId){
  const C=root.C||root.VoidCampaign,M=root.VoidMissions,d=M.definitions[mid],[stage,loc]=STAGE[mid]||['open',d.start||d.destination||'earth'];
  const s=root.VoidDevTest.build({location:loc,stage,kit:true});s.story.flags.metAdmin=true;s.story.flags.metIris=true;const notes=[];
  try{const fd=Object.values(C.factionDeliveries||{}).find(x=>x.id===mid),sd=Object.values(C.supplyDeliveries||{}).find(x=>x.id===mid);
   if(fd)C.acceptFaction(s,fd.faction);else if(sd){for(const x of Object.values(C.factionDeliveries))s.story.flags[x.flag]='paid';s.story.flags.factionsVisited=true;C.acceptSupply(s,sd.faction);}
   else if(C.sealedCargo&&mid===C.sealedCargo.id)C.acceptSealed(s);}catch{}
  if(!M.acquire(s,mid))notes.push('The game could not start "'+d.title+'" directly at this point; you are at its place and story stage.');
  M.track(s,mid,C);const i=stepId?Math.max(0,(d.objectives||[]).findIndex(o=>o.id===stepId)):0;for(const o of (d.objectives||[]).slice(0,i))M.complete(s,mid,o.id,C);M.sync(s,C);
  return {state:s,where:loc,notes};}
 async function play(key,stepId){
  const f=findMission(key);if(!f)return;const m=f.mission;if(!playable(m)){status=playable(m,true);draw();return;}
  const content=draftContent(),c=MC().check(content,checkCtx());if(!c.ok){status='Fix these first: '+c.errors.slice(0,4).join(' · ');draw();return;}
  const not=MC().notApplied({studio:studio(),local:local()});
  const d=local();d.played[m.key]=new Date().toISOString();saveLocal(d);
  write(RETURN,{tree:f.tree.id,mission:m.key,step:stepId||null,at:Date.now()},root.sessionStorage);
  const env=root.VoidLiveContent?.env;
  const r=await root.VoidDevTest.session({banner:'PLAYING DRAFT: '+m.title+' — not your real save',leave:'LEAVE DRAFT',kind:'draft',
   apply:()=>{root.VoidLiveContent?.useDraft(content);},
   build:()=>{const x=m.engine==='beginner'?beginnerState(m.id,stepId):registryState(m.id,stepId);play.notes=x.notes||[];play.where=x.where;return x.state;},
   enter:async()=>{const w=play.where;if(w==='interior'||w==='earth'){state.location='earth';await enterWalking(VoidDistrictArea.KEY.interior,{silent:true,...VoidDistrictArea.resume(state,VoidNeoChinatown)});}
    else if(w==='street'){state.location='earth';delete state.story.flags.area;await enterWalking(VoidDistrictArea.KEY.street,{silent:true,quarter:'port'});}
    else if(w==='vesper')await worldEnterWalking('vesper');else{state.location=w;await dock();}},
   message:'DRAFT · '+m.title+(stepId?' · from step '+stepId:'')+' · nothing is saved'+(not.length?' · '+not.length+' edit(s) cannot show (listed in the Mission Editor)':'')+((play.notes||[]).length?' · '+play.notes.join(' '):'')});
  if(r&&r.error){status=r.error;try{root.sessionStorage.removeItem(RETURN);}catch{}draw();}
 }
 // ---------------- PUBLISH TO ALL PLAYERS (server-verified owner only; the server keeps every version)
 function publishView(root_){
  const live=server.live,content=draftContent(),ctx=checkCtx(),c=MC().check(content,ctx),not=MC().notApplied({studio:studio(),local:local()});
  root_.append(el('h3','Publish & versions'));
  if(!live){root_.append(el('p',server.note.live==='not-authorized'?'Publishing is only for the configured content editor account. The server did not confirm this account.':'Publishing is switched OFF on the server (or the server could not be reached). Nothing can reach players from here until David switches it on. Your draft is safe.','me-warn',{'data-me-publish-off':'1'}));}
  else root_.append(el('p','Live now: '+(live.version?'version '+live.version+' (published '+new Date(live.publishedAt*1000).toLocaleString()+')':'the shipped missions (nothing published yet)')+'.','dev-note'));
  // the check screen
  const chk=el('section','','me-check',{'aria-label':'Check before publishing','id':'me-check'});chk.append(el('h4','Check before publishing'));
  const shippedB=shipped().beginner.map(MC().strip),nextB=content.beginner||shippedB;
  chk.append(el('h5','Problems that block publishing ('+(c.errors.length+(ui.check?.errors||[]).length)+')'));for(const t of [...c.errors,...(ui.check?.errors||[])])chk.append(el('p',t,'me-bad'));if(!c.errors.length&&!(ui.check?.errors||[]).length)chk.append(el('p','None.','me-ok'));
  const ch=MC().changes(shippedB,nextB),regN=Object.keys(content.registry||{}).length,linesN=(content.lines||[]).length;
  chk.append(el('h5','What changes for players'));if(!ch.length&&!regN&&!linesN)chk.append(el('p','Nothing: your draft matches the shipped missions.','me-small'));
  for(const x of ch)chk.append(el('p','• '+x.text));if(regN)chk.append(el('p','• Mission Log text of '+regN+' older mission(s): '+Object.keys(content.registry).join(', ')+'.'));if(linesN)chk.append(el('p','• '+linesN+' changed NPC line(s), shown as text until re-voiced.'));
  const w=MC().warnings(shippedB,nextB);chk.append(el('h5','Players part-way through ('+w.length+')'));if(!w.length)chk.append(el('p','No saved progress is affected.','me-small'));for(const t of w)chk.append(el('p','⚠ '+t,'me-warn'));
  const outOfDate=(content.lines||[]).filter(l=>index.get(l.who+'|'+l.from)?.recorded);if(outOfDate.length)chk.append(el('p','⚠ '+outOfDate.length+' line(s) have a recorded voice clip that no longer matches: voice clip out of date, text only until re-voiced.','me-warn'));
  if(not.length){chk.append(el('h5','Edits that will NOT reach players (kept in your draft)'));for(const t of not)chk.append(el('p','• '+t,'me-small'));}
  const note=el('input','','',{'aria-label':'Change note',placeholder:'What changed (shown in the version list)',maxlength:'200'});note.value=ui.note||'';note.oninput=()=>{ui.note=note.value;};chk.append(note);
  const blocked=!live||!live.enabled||c.errors.length||(ui.check?.errors||[]).length||MC().empty(content);
  const row=el('div','','me-row');row.append(btn('ASK THE SERVER TO CHECK',async()=>{try{ui.check=await call('developer/live-content/check',{content});status=ui.check.ok?'The server checked the draft: no problems.':'The server found problems.';}catch(e){status='Server check: '+e.message;}draw();},'',live?{}:{disabled:''}));
  row.append(btn('PUBLISH TO ALL PLAYERS',async()=>{if(!confirm('Publish your draft to every player now? You can undo it afterwards.'))return;try{const rec=await call('developer/live-content/publish',{expected:live.version||0,content:{...content,note:(ui.note||'').slice(0,200)||undefined}});status='Published version '+rec.version+'. Players get it the next time the game loads.';await refreshServer();}catch(e){status='Not published: '+e.message;}draw();},'me-publish',{'data-me-publish':'1',...(blocked?{disabled:''}:{})}));
  chk.append(row);root_.append(chk);
  // versions
  const vs=el('section','','me-versions');vs.append(el('h4','Published versions'));const hist=(live&&live.history)||[];if(!hist.length)vs.append(el('p','None yet.','me-small'));
  const tb=el('table','','me-table');if(hist.length){tb.innerHTML='<tr><th>Version</th><th>When</th><th>What</th><th>Note</th></tr>';for(const h of hist.slice().reverse()){const tr=el('tr');tr.append(el('td',String(h.version)+(h.version===live.version?' (live)':'')),el('td',new Date(h.at*1000).toLocaleString()),el('td',h.action==='rollback'?'Undo: back to version '+h.from:h.action==='publish'?'Published':h.action),el('td',h.note||''));tb.append(tr);}vs.append(tb);}
  if(live&&live.enabled&&live.version)vs.append(btn('UNDO: PUT THE PREVIOUS VERSION BACK',async()=>{if(!confirm('Put the previous published version back for every player?'))return;try{const rec=await call('developer/live-content/rollback',{expected:live.version});status='Version '+rec.version+' is live: '+(rec.content?'the content of version '+rec.from:'the shipped missions')+'.';await refreshServer();}catch(e){status='Undo failed: '+e.message;}draw();},'',{'data-me-undo':'1'}));
  root_.append(vs);
 }
 root.VoidMissionEditor={render,get built(){return built;},reload:async()=>{built=null;loading=null;},draftContent,local,studio,play,refreshServer,get status(){return status;},get server(){return server;}};
})(globalThis);
