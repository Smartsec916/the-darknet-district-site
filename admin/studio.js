/* THE DARKNET DISTRICT // DEVELOPER STUDIO. Reuses the admin sign-in and the server's administrator check (GET /api/void-runner/developer/content, verified by the server). Everything it edits
   is a LOCAL DRAFT in this browser: nothing is published, no player save or live content is touched, and there is no GitHub token here. Rules and records: studio-model.js. */
import {auth,provider,onAuthStateChanged,signInWithPopup,signOut} from '../firebase-auth.js';
const $=id=>document.getElementById(id),S=window.StudioModel,B=window.VoidBeginner;
const el=(tag,text,cls,attrs)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;for(const [k,v] of Object.entries(attrs||{}))e.setAttribute(k,v);return e;};
const apiBase=['localhost','127.0.0.1'].includes(location.hostname)?'':'https://the-darknet-district-site.onrender.com';
const KEY='studio-drafts-v1';
let epoch=0,tab='dashboard',inventory=null,registry=null,selected=null,selectedDlg=null,draft=null,summaryText='',access=null;
const base=()=>S.clone(B.MISSIONS);
const interactions=new Set([...window.VoidNeoChinatown.layout('interior').interactions,...window.VoidNeoChinatown.layout('street').interactions].map(i=>i.id));
const loadDraft=()=>{try{const r=JSON.parse(localStorage.getItem(KEY)||'null');if(r&&Array.isArray(r.missions))return r;}catch{}return null;};
draft=(loadDraft()?.missions)||base();summaryText=loadDraft()?.summary||'';
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify({missions:draft,summary:summaryText,savedAt:new Date().toISOString()}));}catch{}};
const npcNames=()=>new Set(registry?Object.values(registry.npcs||{}).map(n=>n.displayName):[]);
const ctx=()=>({interactions,npcs:npcNames()});
const TABS=[['dashboard','Dashboard','working'],['missions','Missions','working'],['npcs','NPCs','partial'],['dialogue','Dialogue','working'],['characters','Characters','planned'],['animations','Animations','planned'],['locations','Locations & Maps','partial'],['assets','Asset Library','planned'],['stores','Stores & Items','planned'],['factions','Factions & Progression','planned'],['social','Social & V1','planned'],['settings','Settings & Publishing','working']];
const LABEL={working:'WORKING',partial:'PARTIAL · READ-ONLY',planned:'PLANNED'};
function status(t){$('status').textContent=t;}
$('signin').onclick=()=>signInWithPopup(auth,provider).catch(()=>status('Sign-in did not complete. Try again.'));
$('signout').onclick=()=>{epoch++;lock();signOut(auth).catch(()=>{});};
function lock(){$('studio').hidden=true;inventory=null;access=null;}
onAuthStateChanged(auth,async user=>{const g=++epoch;lock();$('signin').hidden=!!user;$('signout').hidden=!user;if(!user){status('Sign in to request administrator access. Permission is verified by the server; this page changes nothing in the live game.');return;}
 status('Verifying administrator access with the server...');
 try{const token=await user.getIdToken(true);if(g!==epoch)return;const r=await fetch(apiBase+'/api/void-runner/developer/content',{headers:{Authorization:'Bearer '+token,Accept:'application/json'},credentials:'omit',cache:'no-store'});if(g!==epoch)return;
  if(!r.ok){status(r.status===403||r.status===401?'This account is not an administrator. The Studio stays locked.':'The server could not confirm access ('+r.status+'). The Studio stays locked.');return;}
  inventory=await r.json();access={email:user.email?'signed in':'',at:new Date().toLocaleTimeString()};}catch{status('Could not reach the server. The Studio stays locked.');return;}
 try{registry=await (await fetch('../tools/audio/npc-voice-registry.json',{cache:'no-store'})).json();}catch{registry=null;}
 status('Administrator access confirmed by the server.');$('studio').hidden=false;drawTabs();draw();
});
function drawTabs(){const nav=$('tabs');nav.replaceChildren();for(const [id,label,st] of TABS){const b=el('button',undefined,'',{role:'tab','aria-selected':String(tab===id)});b.append(document.createTextNode(label),el('span',LABEL[st],'st '+st));b.onclick=()=>{tab=id;drawTabs();draw();};nav.appendChild(b);}}
function draw(){const p=$('panel');p.replaceChildren();({dashboard,missions,npcs,dialogue,locations,settings,planned})[['dashboard','missions','npcs','dialogue','locations','settings'].includes(tab)?tab:'planned'](p);}
// ---------------------------------------------------------------- Dashboard
function dashboard(p){
 p.append(el('h2','Dashboard'),el('p','What exists, what works, and what is only planned. Nothing on this page publishes anything.','note'));
 const issues=S.validate(draft,ctx()),errs=issues.filter(i=>i.level==='error').length,warns=issues.filter(i=>i.level==='warn').length,sim=S.simulate(draft);
 const c=el('div','','card');c.append(el('b','Beginner campaign (shipped definitions + your local draft)'),el('div','Missions: '+draft.length+' · validation: '+(errs?errs+' error(s)':'no errors')+(warns?', '+warns+' warning(s)':'')+' · simulated end to end: '+(sim.stuck.length?'STUCK at '+sim.stuck.join(', '):'every mission can be reached and finished'),errs||sim.stuck.length?'bad':'ok'));p.append(c);
 const inv=inventory?.summary||inventory?.counts||null;
 const c2=el('div','','card');c2.append(el('b','Existing content inventory (read from the server, read-only)'),el('div',inventory?('Source projections loaded: '+(Array.isArray(inventory.missions)?inventory.missions.length+' missions, ':'')+(Array.isArray(inventory.characters)?inventory.characters.length+' characters, ':'')+(Array.isArray(inventory.lines)?inventory.lines.length+' dialogue lines':'')):'not loaded'));p.append(c2);
 p.append(el('h3','Tools'));
 for(const [name,state,note,link] of [
  ['Mission editor (beginner campaign)','working','Edit, validate, simulate and export drafts of the six starter missions. Tab: Missions.'],
  ['Dialogue editor (beginner campaign)','working','Speakers, lines, the "too soon" branch and a flowchart. Tab: Dialogue.'],
  ['NPC view','partial','Voice registry, roles, interaction points and the missions each NPC gives. Metadata editing is planned.'],
  ['Locations view','partial','Every District and street interaction point and which objectives use it. Placement editing is planned.'],
  ['Content atlas, private drafts and release candidates (Stage 3)','working','The existing server-side tools for the archived mission and dialogue records (private drafts, history, release candidates). Publishing to the live game is NOT enabled.','void-runner.html'],
  ['Characters, Animations, Asset Library, Stores & Items, Factions & Progression, Social & V1','planned','Not built. Their tabs say what exists today and what is needed.']]){
  const d=el('div','','card'+(state==='planned'?' planned':''));d.append(el('b',name+' — '+LABEL[state]),el('div',note));if(link){const a=el('a','Open '+link);a.href=link;d.append(a);}p.append(d);}
}
// ---------------------------------------------------------------- Missions
function missions(p){
 p.append(el('h2','Missions'),el('p','Create and edit the beginner campaign. Changes are a local draft until a reviewed publish exists. The six shipped missions are the starting point; "Revert" returns to them.','note'));
 const cols=el('div','','cols'),list=el('div','','list'),form=el('div');cols.append(list,form);p.append(cols);
 for(const m of draft){const b=el('button',m.title+' · '+m.id,'',{'aria-pressed':String(selected===m.id)});b.onclick=()=>{selected=m.id;draw();};list.append(b);}
 const add=el('button','+ New mission');add.onclick=()=>{let n=draft.length+1,id;do{id='new-mission-'+n++;}while(draft.some(m=>m.id===id));draft.push({id,title:'NEW MISSION',type:'main',giver:'Admin',description:'',destination:'earth',rewards:0,prerequisites:draft.length?[draft[draft.length-1].id]:[],objectives:[{id:'step-one',label:'Describe the objective',on:'talk-admin',requires:[],interaction:'admin'}]});selected=id;persist();draw();};list.append(add);
 const m=draft.find(x=>x.id===selected);
 if(!m){form.append(el('p','Choose a mission on the left.','note'));}
 else{
  const f=(label,input)=>{const l=el('label',label);l.append(input);return l;};
  const bind=(input,key,num)=>{input.value=m[key]??'';input.oninput=()=>{m[key]=num?Number(input.value||0):input.value;persist();refresh();};return input;};
  const r1=el('div','','row');
  const idIn=el('input');idIn.value=m.id;idIn.onchange=()=>{const old=m.id;m.id=idIn.value.trim();for(const o of draft)o.prerequisites=(o.prerequisites||[]).map(x=>x===old?m.id:x);selected=m.id;persist();draw();};
  r1.append(f('ID (stable, lowercase-hyphen)',idIn),f('Title',bind(el('input'),'title')),f('Type',(()=>{const s=el('select');for(const t of S.TYPES)s.append(new Option(t,t));return bind(s,'type');})()),
   f('Mission giver',(()=>{const s=el('select');const names=[...new Set([...S.SPEAKERS.filter(x=>x!=='You'),...npcNames()])];if(m.giver&&!names.includes(m.giver))names.push(m.giver);for(const n of names)s.append(new Option(n,n));return bind(s,'giver');})()),
   f('Location',(()=>{const s=el('select');for(const [v,t] of [['earth','NeoChinatown'],['meridian','Meridian Station']])s.append(new Option(t,v));return bind(s,'destination');})()),f('Reward (credits)',bind(el('input'),'rewards',true)));
  form.append(r1,f('Description (shown in the V1 Mission Log)',bind(el('textarea'),'description')));
  const pr=el('div','','row');pr.append(el('b','Prerequisites (missions that must be finished first):'));for(const o of draft.filter(x=>x.id!==m.id)){const c=el('input','','',{type:'checkbox'});c.checked=(m.prerequisites||[]).includes(o.id);c.onchange=()=>{m.prerequisites=draft.filter(x=>x.id!==m.id).map(x=>x.id).filter(id=>id===o.id?c.checked:(m.prerequisites||[]).includes(id));persist();draw();};const l=el('label',o.id);l.style.flexDirection='row';l.prepend(c);pr.append(l);}form.append(pr);
  form.append(el('h3','Objectives'));const t=el('table');t.innerHTML='<tr><th>id</th><th>label (shown in the V1)</th><th>completes when</th><th>requires</th><th>interaction / waypoint</th><th></th></tr>';
  for(const o of m.objectives){const tr=el('tr');const cell=(child)=>{const td=el('td');td.append(child);tr.append(td);};
   const i=el('input');i.value=o.id;i.onchange=()=>{const old=o.id;o.id=i.value.trim();for(const x of m.objectives)x.requires=(x.requires||[]).map(r=>r===old?o.id:r);persist();draw();};cell(i);
   const l=el('input');l.value=o.label;l.oninput=()=>{o.label=l.value;persist();refresh();};cell(l);
   const e=el('select');e.append(new Option('(nothing yet)',''));for(const [k,v] of Object.entries(S.EVENTS))e.append(new Option(v,k));e.value=o.on||'';e.onchange=()=>{o.on=e.value||undefined;persist();refresh();};cell(e);
   const rq=el('input');rq.value=(o.requires||[]).join(',');rq.onchange=()=>{o.requires=rq.value.split(',').map(x=>x.trim()).filter(Boolean);persist();refresh();};cell(rq);
   const it=el('input');it.value=o.interaction||'';it.setAttribute('list','interactions');it.onchange=()=>{o.interaction=it.value.trim()||undefined;persist();refresh();};cell(it);
   const del=el('button','remove');del.onclick=()=>{m.objectives=m.objectives.filter(x=>x!==o);persist();draw();};cell(del);t.append(tr);}
  const dl=el('datalist','','',{id:'interactions'});for(const id of interactions)dl.append(new Option(id));form.append(t,dl);
  const ao=el('button','+ Objective');ao.onclick=()=>{m.objectives.push({id:'step-'+(m.objectives.length+1),label:'New objective',on:'talk-admin',requires:[],interaction:'admin'});persist();draw();};
  const rm=el('button','Delete mission');rm.onclick=()=>{if(!confirm('Delete "'+m.title+'" from the draft?'))return;draft=draft.filter(x=>x!==m);for(const o of draft)o.prerequisites=(o.prerequisites||[]).filter(x=>x!==m.id);selected=null;persist();draw();};
  form.append(el('div','','row'));form.lastChild.append(ao,rm);
 }
 const side=el('div');side.id='mission-side';form.append(side);
 function refresh(){side.replaceChildren();const issues=S.validate(draft,ctx());
  side.append(el('h3','Validation'));if(!issues.length)side.append(el('div','No problems found. Every reference resolves, every objective can be completed, the chain can start and finish.','ok'));for(const i of issues)side.append(el('div',i.where+' — '+i.text,'issue '+i.level));
  side.append(el('h3','Mission flow'));side.append(flowSvg());
  const sim=S.simulate(draft);side.append(el('h3','Preview: play the chain with its own events'),el('div',sim.stuck.length?'STUCK — cannot finish: '+sim.stuck.join(', '):'All '+sim.completed.length+' missions complete.',sim.stuck.length?'bad':'ok'));const pre=el('pre',sim.order.join('\n'));side.append(pre);
  side.append(el('h3','Draft status'));const ch=S.diff(base(),draft);side.append(el('div',ch.length?ch.length+' change(s) from the shipped definitions:':'Identical to the shipped definitions.'));for(const c of ch.slice(0,30))side.append(el('div','• '+c.summary,'issue'));
  const sm=el('textarea');sm.placeholder='Change summary (for the reviewer)';sm.value=summaryText;sm.oninput=()=>{summaryText=sm.value;persist();};side.append(sm);
  const row=el('div','','row'),ex=el('button','Export draft JSON'),rv=el('button','Revert to shipped'),pub=el('button','Publish to the live game');pub.disabled=true;pub.title='Disabled: needs server-side authorization, validation, rollback and an audit trail (see Settings & Publishing).';
  ex.onclick=()=>{const blob=new Blob([JSON.stringify(S.exportDraft(draft,summaryText,base()),null,1)],{type:'application/json'}),a=el('a');a.href=URL.createObjectURL(blob);a.download='studio-draft.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
  rv.onclick=()=>{if(!confirm('Discard your draft and return to the shipped missions?'))return;draft=base();summaryText='';selected=null;persist();draw();};row.append(ex,rv,pub);side.append(row);}
 refresh();
}
function flowSvg(){const f=S.flow(draft),W=190,H=64,GX=50,GY=18,rows=Math.max(1,...f.nodes.map(n=>n.row+1)),svg=document.createElementNS('http://www.w3.org/2000/svg','svg');const w=f.levels*(W+GX)+10,h=rows*(H+GY)+10;svg.setAttribute('viewBox','0 0 '+w+' '+h);svg.setAttribute('width',Math.min(w,900));svg.setAttribute('class','flow');svg.setAttribute('role','img');svg.setAttribute('aria-label','Mission flow: arrows run from a prerequisite to the mission it unlocks');
 const pos=id=>{const n=f.nodes.find(x=>x.id===id);return {x:5+n.level*(W+GX),y:5+n.row*(H+GY)};};
 for(const e of f.edges){const a=pos(e.from),b=pos(e.to),p=document.createElementNS(svg.namespaceURI,'path');p.setAttribute('class','e');p.setAttribute('d','M'+(a.x+W)+' '+(a.y+H/2)+'C'+(a.x+W+GX/2)+' '+(a.y+H/2)+' '+(b.x-GX/2)+' '+(b.y+H/2)+' '+b.x+' '+(b.y+H/2));svg.append(p);}
 for(const n of f.nodes){const p=pos(n.id),g=document.createElementNS(svg.namespaceURI,'g'),r=document.createElementNS(svg.namespaceURI,'rect');r.setAttribute('class','n');r.setAttribute('x',p.x);r.setAttribute('y',p.y);r.setAttribute('width',W);r.setAttribute('height',H);const m=draft.find(x=>x.id===n.id);
  const t1=document.createElementNS(svg.namespaceURI,'text');t1.setAttribute('x',p.x+8);t1.setAttribute('y',p.y+20);t1.textContent=(n.title||n.id).slice(0,24);const t2=document.createElementNS(svg.namespaceURI,'text');t2.setAttribute('x',p.x+8);t2.setAttribute('y',p.y+38);t2.textContent=(m.objectives||[]).length+' objectives · '+(Number(m.rewards)||0)+' cr';const t3=document.createElementNS(svg.namespaceURI,'text');t3.setAttribute('x',p.x+8);t3.setAttribute('y',p.y+54);t3.textContent=m.giver||'';g.append(r,t1,t2,t3);svg.append(g);}
 return svg;}
// ---------------------------------------------------------------- NPCs
function npcs(p){
 p.append(el('h2','NPCs'),el('p','Read-only view of the existing NPC identities (the voice registry) with the beginner missions each one gives and the District interaction points they use. Metadata editing is planned and will write to the same registry, never to a second identity list.','note'));
 if(!registry){p.append(el('div','The NPC voice registry could not be loaded.','bad'));return;}
 const t=el('table');t.innerHTML='<tr><th>id</th><th>name</th><th>role</th><th>voice</th><th>status</th><th>beginner missions</th><th>interaction point</th></tr>';
 const point={Admin:'admin',Iris:'district-iris',Bartender:'district-bar'};
 for(const [id,n] of Object.entries(registry.npcs||{})){const tr=el('tr'),giving=draft.filter(m=>m.giver===n.displayName).map(m=>m.id).join(', ');for(const v of [id,n.displayName,n.role,n.voice,n.status,giving||'—',point[n.displayName]||'—']){const td=el('td',String(v));tr.append(td);}t.append(tr);}
 p.append(t,el('p','Models and portraits: the portrait pipeline (V1 portraits, character creator catalog) exists, but Studio previews are planned.','note'));
}
// ---------------------------------------------------------------- Dialogue
function dialogue(p){
 p.append(el('h2','Dialogue'),el('p','Lines the beginner campaign speaks, by mission and objective. Speakers must be existing NPCs or on-screen speakers. New lines are shown as text (no new voice clips). The branch "too soon" is what a character says when the player arrives before an objective is ready.','note'));
 const cols=el('div','','cols'),list=el('div','','list'),form=el('div');cols.append(list,form);p.append(cols);
 if(!selectedDlg||!draft.some(m=>m.id===selectedDlg))selectedDlg=draft[0]?.id;
 for(const m of draft){const b=el('button',m.title,'',{'aria-pressed':String(selectedDlg===m.id)});b.onclick=()=>{selectedDlg=m.id;draw();};list.append(b);}
 const m=draft.find(x=>x.id===selectedDlg);if(!m)return;
 const names=[...new Set([...S.SPEAKERS,...npcNames()])];
 for(const o of m.objectives){
  form.append(el('h3',o.label+'  ('+(S.EVENTS[o.on]||'no event')+')'));
  for(const [key,title] of [['say','When completed'],['early','Too soon (before the objective is ready)']]){
   const box=el('div','','card');box.append(el('b',title));o[key]=o[key]||[];
   o[key].forEach((line,i)=>{const r=el('div','','row'),sp=el('select');for(const n of names)sp.append(new Option(n,n));if(!names.includes(line.who))sp.append(new Option(line.who+' (unknown)',line.who));sp.value=line.who;sp.onchange=()=>{line.who=sp.value;persist();draw();};const tx=el('input');tx.style.minWidth='420px';tx.value=line.text;tx.oninput=()=>{line.text=tx.value;persist();};const rm=el('button','remove');rm.onclick=()=>{o[key].splice(i,1);if(!o[key].length)delete o[key];persist();draw();};r.append(sp,tx,rm);box.append(r);});
   const a=el('button','+ line');a.onclick=()=>{o[key].push({who:'Admin',text:''});persist();draw();};box.append(a);form.append(box);}
 }
 form.append(el('h3','Flowchart'));const g=S.dialogueGraph(m),wrap=el('div','','dg');
 for(const n of g.nodes){const d=el('div','','dn'+(n.kind==='lines'?' lines':'')+(n.id.endsWith(':early')?' early':''));if(n.kind==='objective'){d.append(el('b',n.id),el('small',S.EVENTS[n.on]||'no event'),el('div',n.label));}else{for(const l of n.lines)d.append(el('div',l.who+': '+l.text));}
  const incoming=g.edges.filter(e=>e.to===n.id).map(e=>e.label+' ← '+e.from);if(incoming.length)d.append(el('small',incoming.join(' · ')));wrap.append(d);}
 form.append(wrap);
 const issues=S.validate(draft,ctx()).filter(i=>i.where.startsWith(m.id));form.append(el('h3','Validation'));if(!issues.length)form.append(el('div','No missing links or unknown speakers.','ok'));for(const i of issues)form.append(el('div',i.where+' — '+i.text,'issue '+i.level));
}
// ---------------------------------------------------------------- Locations
function locations(p){
 p.append(el('h2','Locations & Maps'),el('p','Read-only: the interaction points of The Darknet District and the NeoChinatown street (from the game layouts) and the objectives that use them. Placement editing is planned.','note'));
 const used={};for(const m of draft)for(const o of m.objectives)if(o.interaction)(used[o.interaction]??=[]).push(m.id+' / '+o.id);
 for(const area of ['interior','street']){p.append(el('h3',area==='interior'?'The Darknet District (interior)':'NeoChinatown street'));const t=el('table');t.innerHTML='<tr><th>id</th><th>label / action</th><th>position</th><th>used by</th></tr>';
  for(const i of window.VoidNeoChinatown.layout(area).interactions){const tr=el('tr');for(const v of [i.id,(i.label||'')+' · '+i.action,i.position.map(x=>Math.round(x)).join(', '),(used[i.id]||[]).join('; ')||'—'])tr.append(el('td',v));t.append(tr);}p.append(t);}
}
// ---------------------------------------------------------------- Settings & publishing
function settings(p){
 p.append(el('h2','Settings & Publishing'),el('p','Publishing is disabled. This is what must exist before it is switched on.','note'));
 for(const [name,ok,note] of [
  ['Server-verified authorization',true,'Studio data and drafts are behind the existing administrator check (VOID_ADMIN_UIDS, verified by the server on every call). The browser holds no GitHub or publishing credential.'],
  ['Validation before publish',true,'studio-model.js: references, requirements, chains, speakers, events, rewards. Runs on every edit.'],
  ['Draft → review → pull request workflow',false,'Not built. Planned: the server opens a pull request from an exported draft (server-side token only); David reviews and merges. Drafts are exported as JSON with a change list today.'],
  ['Rollback',false,'Not built. With pull requests, rollback is reverting the merge. The old Stage 3 release-candidate rollback (private) exists but is not connected to the live game.'],
  ['Audit trail',false,'Not built beyond the existing draft and release history. A publish must record who, what and when.'],
  ['Role separation (editor, publisher, reviewer)',false,'Today one allow-listed account can edit; a second reviewer is not enforced.']]){const c=el('div','','card'+(ok?'':' planned'));c.append(el('b',(ok?'READY — ':'NOT READY — ')+name),el('div',note));p.append(c);}
 p.append(el('h3','Developer test ship (game)'),el('div','In the game, Developer Tools → Test & Jump To → "NeoChinatown · new District campaign with a TEST SHIP" starts a throwaway session (never saved) with a real ship and travel unlocked. It is shown only to accounts the server confirms as developers.','card'));
 p.append(el('h3','Local drafts'),el('div','Drafts live in this browser only ('+KEY+'). Clearing site data removes them. Export JSON to keep or share one.','card'));
}
function planned(p){
 const info={characters:['Characters','The character creator catalog (void-runner/character-catalog.json) and looks already exist and are validated by the API and hub. A Studio editor would edit that catalog (never a second list). Not built.'],
  animations:['Animations','Clip lists live in tools/animation-pipeline/clips.json and the Blender pipeline. A Studio view would list clips per character and flag missing ones. Not built.'],
  assets:['Asset Library','Planned: a local indexing service restricted to localhost, with a configurable folder path (the previously named Windows download folder may have moved), license notes, and no upload of purchased assets to GitHub or extraction of large archives. This session could not see that folder. Not built.'],
  stores:['Stores & Items','Shared store inventory is code (progression.js, content.js). Not built.'],
  factions:['Factions & Progression','Factions and progression live in factions.js and progression.js. Not built.'],
  social:['Social & V1','V1 apps and the chat store are code; app records and news sources are not yet data. Not built.']}[tab]||[tab,'Not built.'];
 p.append(el('h2',info[0]),el('div','PLANNED — not built. '+info[1],'card planned'));
}
