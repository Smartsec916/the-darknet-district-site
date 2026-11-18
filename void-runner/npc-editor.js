/* DEVELOPER TOOLS > NPCs (browser only; loaded on demand for a server-confirmed developer, with the Mission Editor whose draft it shares). The owner, 18 Nov 2026:
   "Another tab inside developer tools for editing NPCs, adding givers, a preview, NPC paths and actions", "can I maybe move the npc around on the map and save them in a
   location. If they have routes can I change them or make them stay?", "be able to add animations to them", "maybe be able to import new models, then place them in",
   "just have a cap on poly counts for each import", "also short description on things in the npc editor", and the old "All lines for an NPC" moved here ("Lines & voice").
   - The list: everyone the giver roster knows (voice registry, District residents, story characters, the monk), the street crowd's figures, and models imported here.
   - For one NPC: look (the model file), where they are, their voice (a registered Kokoro voice is READ-ONLY; an ElevenLabs voice can be chosen in Lines & voice: npc-voices.js), a 3D preview with their clips, MAKE GIVER (a new draft
     mission given by them: no lore, no lines are written), placement (only NPCs the editor can move: Reverie and Lace today; their own routine / stay at a spot / a route of
     points with actions from their own clip list), added animations (the shared library, allowed clips only), animation requests (exported for Claude/Codex; No AI models
     are marked local retarget only), and their lines and voice.
   - Placements are part of the Mission Editor's DRAFT (localStorage + the server copy), PLAY THIS DRAFT, and PUBLISH (content.npcs, checked by mission-content.js and the server).
   - IMPORT MODEL: a .glb / .gltf from this computer, read in this browser only (IndexedDB), never uploaded; a checklist with hard caps (npc-paths.js IMPORT); placed on the map
     and tried in a throwaway test session (LOCAL TEST ONLY); ADD TO THE GAME downloads the file and a package JSON for Claude/Codex to check, optimise and commit. */
(function(root){
 'use strict';
 const DTX=()=>typeof VoidDevTools!=='undefined'?VoidDevTools:null;   // dev-tools.js declares it with const (not a window property)
 const S=()=>root.VoidMissionEditor.shared,X=()=>root.VoidNPCPaths,RETURN='npc-editor-return';
 const ADV='npc-editor-advanced';const advanced=()=>{try{return root.localStorage.getItem(ADV)==='1';}catch{return false;}};
 const ui={id:null,search:'',lineSearch:'',group:null,preview:null,previewFor:null,previewNote:'',importing:false,start:true,undo:null};
 let host=null,headNode=null,status='',imports=[],importsLoaded=false;
 const el=(...a)=>S().el(...a),btn=(...a)=>S().btn(...a),hint=(t,a)=>S().hint(t,a);
 const HELP={
  list:'Everyone the game knows. Pick a name to see their look, where they are, their voice, their lines and (for some) where they stand or walk.',
  search:'Type part of a name or an id to shorten the list.',
  look:'The model file the game draws them with (assets/models/crowd/…). Licensed models are kept outside the public files.',
  where:'Where the game puts them today, in its own code.',
  voice:'The voice they speak with. A registered Kokoro voice is locked and never changed here; you can choose an ElevenLabs voice for new or changed lines in “Lines & voice”.',
  preview:'A turntable view of their model with every clip in its file. Drag to turn it, scroll to zoom. Nothing changes in the game.',
  clips:'Plays one of the clips (animations) the model really has.',
  giver:'Starts a new draft mission given by this NPC, in the tree you pick, and opens it in the Mission Editor. Nothing is written for them: you add the lines.',
  place:'Where they are in the game. “Let her do her usual thing”: what she does now. “Keep her at one spot”: she stands where you put her on the map (drag her; turn her with the round handle) and does the things you tick. “Make her walk a route”: she walks your points in order, does what each point says, then starts again.',
  stay:'The things she does at the spot, one after another (a few seconds each). “Sit on the ledge” needs the spot just in front of a ledge.',
  route:'Click the green pavement to add a point at the end; drag a numbered point to move it. Each point: what she does there and for how long. After the last point she walks back to the first.',
  action:'What she does when she reaches this point. Only clips her own model has; never anything from the clubs.',
  seconds:'How long she does it, 1 to 120 seconds.',
  play:'Tries the placement in a throwaway test session on The Avenue, with her out whatever the hour. Your real save is never touched; LEAVE brings you back here.',
  anim:'Every animation in the game, by kind. The ones she can use are listed (her own rig takes them, and they follow her content rule); tick one to add it to the things she can do in a spot or a route. “Try it” plays it on the 3D preview first. Tick “also show…” to see the rest and why not; “Request it” asks for an offline retarget.',
  request:'Ask for an animation that is not available yet (e.g. “leaning on the wall, arms crossed”). The list is downloaded and sent to Claude or Codex, who retarget it onto her rig on your PC. Licensed No AI models are marked “local retarget only”: never Meshy or any AI tool.',
  lines:'Every line this NPC says, in missions and outside them. Edit a line here or in the Mission Editor; RE-VOICE queues it for recording.',
  lineSearch:'Type words to show only the lines that contain them.',
  import:'Load a .glb (or a self-contained .gltf) from your computer to look at it and try it on The Avenue. It stays in this browser only: nothing is uploaded and it is not in the live game.',
  check:'What the game needs from a street NPC. Red: refused (over a hard limit). Amber: allowed, but someone should reduce it before it goes in the game.',
  licence:'Required before it can be sent: where the model is from, its licence, and whether that licence forbids AI tools (No AI). A licensed or unknown model never goes into the public files by itself.',
  addToGame:'Downloads the model file and a small package file (name, placement, clips, licence). Send both to Claude or Codex: they check the licence, reduce it if needed, rig or retarget it and add it to the game.',
  crowd:'An anonymous street figure: the street picks people from this pool, so there is no single person to move yet.'};
 // ---------------------------------------------------------------- who is in the list
 const people=()=>root.VoidDistrictPeople?.npcs?.()||root.VoidDistrictPeople?.NPCS||[];
 function lookOf(id){const M=X().MOVABLE[id];if(M)return M.asset;const p=people().find(n=>n.id===id);if(p)return p.model||p.own||p.figure||p.look||null;
  const MM=root.VoidMilked?.MODELS||{};for(const k in MM)if(MM[k].id===id)return MM[k].asset||MM[k].look||null;if(root.VoidTemple?.MODEL?.id===id)return root.VoidTemple.MODEL.asset||null;return null;}
 const clipsOf=asset=>(root.VoidCrowd?.clips?.[asset]||[]).slice();
 function entries(){const g=S().givers||[],out=[];
  for(const x of g){const mv=!!X().MOVABLE[x.id];out.push({id:x.id,name:x.name,kind:'roster',group:mv?'move':x.canTalk&&x.group==='district'?'givers':x.group==='district'?'district':'earlier',giver:x,look:lookOf(x.id)});}
  for(const look of Object.keys(root.VoidCrowd?.street||{}))out.push({id:'crowd:'+look,name:'Street figure '+look.replace(/^npc-/,''),kind:'crowd',group:'crowd',look});
  for(const r of imports)out.push({id:'import:'+r.id,name:r.name||r.fileName,kind:'import',group:'import',rec:r});
  return out;}
 const GROUPS=[['move','Can be moved: stay at a spot or walk a route'],['givers','Give missions (have a TALK prompt)'],['district','In the District (no TALK prompt yet)'],['import','Imported models (local test only, not in the live game)'],['crowd','Street crowd (anonymous figures)'],['earlier','Earlier characters (not in the District today)']];
 // ---------------------------------------------------------------- imported models (this browser only: IndexedDB)
 const DB='void-npc-imports',ST='models';
 function db(){return new Promise((ok,fail)=>{try{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{r.result.createObjectStore(ST,{keyPath:'id'});};r.onsuccess=()=>ok(r.result);r.onerror=()=>fail(r.error);}catch(e){fail(e);}});}
 async function dbAll(){try{const d=await db();return await new Promise((ok,fail)=>{const q=d.transaction(ST).objectStore(ST).getAll();q.onsuccess=()=>ok(q.result||[]);q.onerror=()=>fail(q.error);});}catch{return [];}}
 async function dbPut(rec){const d=await db();await new Promise((ok,fail)=>{const t=d.transaction(ST,'readwrite');t.objectStore(ST).put(rec);t.oncomplete=ok;t.onerror=()=>fail(t.error);});}
 async function dbDel(id){const d=await db();await new Promise((ok,fail)=>{const t=d.transaction(ST,'readwrite');t.objectStore(ST).delete(id);t.oncomplete=ok;t.onerror=()=>fail(t.error);});}
 async function loadImports(){imports=(await dbAll()).sort((a,b)=>(a.createdAt||'').localeCompare(b.createdAt||''));importsLoaded=true;}
 // ---------------------------------------------------------------- the draft (shared with the Mission Editor)
 const plan=id=>(S().local().npcs||{})[id]||null;
 function setPlan(id,p){const d=S().local();d.npcs=d.npcs||{};const c=p?X().clean(p):null;if(c)d.npcs[id]=c;else delete d.npcs[id];S().saveLocal(d);}
 // ---------------------------------------------------------------- render
 function render(panel,head){host=panel;headNode=head;
  if(!S()?.built){panel.innerHTML='';panel.append(head(),el('p','Loading the NPCs from the game data…','dev-note'));Promise.all([S().ensure(),loadImports()]).then(()=>{restore();draw();}).catch(e=>{panel.append(el('p','The NPCs tab could not load ('+e.message+'). Check your connection, then press CLOSE and open Developer tools again. Your draft is safe in this browser.','me-bad'));});return;}
  if(!importsLoaded){loadImports().then(draw);}
  restore();draw();}
 function restore(){let r=null;try{r=JSON.parse(root.sessionStorage.getItem(RETURN)||'null');root.sessionStorage.removeItem(RETURN);}catch{}if(r&&r.npc){ui.id=r.npc;status='Back from the test session. Your draft is saved.';}
  const f=DTX()?.npcFocus;if(f){ui.id=f;DTX().npcFocus=null;}}
 function draw(){if(!host)return;const keep=host.scrollTop;if(ui.preview&&ui.previewFor!==ui.id){ui.preview.dispose();ui.preview=null;ui.previewFor=null;}
  const pv=ui.preview?ui.preview.canvas.parentElement:null;
  host.innerHTML='';host.append(headNode());const r=el('div','','me-root npc-root',{id:'npc-root'});host.append(r);
  const top=el('div','','me-row');top.append(el('b','NPCs'),hint('Look at every NPC, preview them, see their lines and voice, give them missions, and move the ones the game lets you move. Every change is part of your Mission Editor DRAFT: PLAY THIS DRAFT to try it, PUBLISH (Mission Editor › Publish & versions) to send it to players.'));
  if(root.VoidEditorGuide)top.append(root.VoidEditorGuide.toggle(()=>guideNow()));r.append(top);
  {const adv=el('label','','eg-switch',{title:'Shows the internal names (ids) the game uses. You never need them to make things.'}),c=el('input','','',{type:'checkbox','data-npc-advanced':'1'});c.checked=advanced();c.onchange=()=>{try{root.localStorage.setItem(ADV,c.checked?'1':'0');}catch{}draw();};adv.append(c,document.createTextNode('Advanced (show internal names)'));top.append(adv);}
  if(status){const st=el('p',status,'me-status',{role:'status'});if(ui.undo){st.append(' ',btn('UNDO',async()=>{const u=ui.undo;ui.undo=null;status='Undone.';await u();draw();},'',{'data-npc-undo':'1'}));}r.append(st);}
  r.append(startCard());
  const cols=el('div','','me-cols');const side=el('aside','','me-side',{'aria-label':'NPCs'});const main=el('div','','me-main');cols.append(side,main);r.append(cols);
  side.append(hint(HELP.list));const q=el('input','','',{'aria-label':'Find an NPC',placeholder:'Find (name or id)','data-npc-search':'1'});q.value=ui.search;q.oninput=()=>{ui.search=q.value;listInto(list);};side.append(q,hint(HELP.search));
  side.append(btn('+ IMPORT MODEL',()=>importPick(),'',{'data-npc-import':'1',title:HELP.import}));
  const list=el('div','','npc-list');side.append(list);listInto(list);
  const all=entries();const e=all.find(x=>x.id===ui.id)||all.find(x=>x.group==='move')||all[0];if(e){ui.id=e.id;detail(main,e,pv);}
  host.scrollTop=keep;setTimeout(guideNow,0);}
 /* "What do you want to do?" (the owner: make it for someone who has never done it): big choices that open the right screen. */
 function startCard(){const d=el('details','','npc-start',{'data-npc-start':'1'});d.open=ui.start;d.ontoggle=()=>{ui.start=d.open;};d.append(el('summary','What do you want to do?'));const grid=el('div','','npc-cards');
  const pick=(id,fn)=>()=>{ui.id=id;ui.start=false;status='';if(fn)fn();draw();setTimeout(()=>{const t=host.querySelector(fn&&fn.focus||'[data-npc-facts]');t&&t.scrollIntoView({block:'start'});},50);};
  const first=x=>entries().find(e=>e.group===x)||{};const rev='grey-reverie';
  const card=(icon,title,text,go,attrs)=>{const b=btn('',go,'npc-card',attrs);b.append(el('span',icon,'npc-card-icon',{'aria-hidden':'true'}),el('b',title),el('span',text,'me-small'));grid.append(b);};
  const stay=()=>{if(!plan(rev)||plan(rev).mode!=='stay')setPlan(rev,{...(plan(rev)&&plan(rev).anims?{anims:plan(rev).anims}:{}),mode:'stay',x:100,z:-6.4,yaw:Math.PI,actions:X().STAY_DEFAULT.slice()});};stay.focus='[data-npc-place]';
  const route=()=>{if(!plan(rev)||plan(rev).mode!=='path')setPlan(rev,{...(plan(rev)&&plan(rev).anims?{anims:plan(rev).anims}:{}),mode:'path',points:[]});root.VoidEditorGuide?.focusNext();};route.focus='[data-npc-place]';
  const look=()=>{};look.focus='[data-npc-preview]';const lines=()=>{};lines.focus='[data-npc-lines]';const giv=()=>{};giv.focus='[data-npc-giver]';
  card('📍','Move a character to a spot','Pick where Reverie (or Lace) stands and what she does there.',pick(rev,stay),{'data-npc-start-card':'stay'});
  card('🚶','Make a character walk a route','Click points on the street; she walks them in order.',pick(rev,route),{'data-npc-start-card':'route'});
  card('💬','Give a character a mission','Choose who hands it out; the Mission Editor opens with it ready to fill in.',pick((first('givers').id)||'admin',giv),{'data-npc-start-card':'giver'});
  card('👀','Look at a character in 3D','Turn them around and play their animations.',pick(ui.id||rev,look),{'data-npc-start-card':'look'});
  card('📝','See what a character says','Every line, in missions and outside them, and their voice (choose an ElevenLabs voice there).',pick(ui.id||'admin',lines),{'data-npc-start-card':'lines'});
  card('📦','Bring in a new 3D model','Load a model file from your computer and try it on the street (only you see it).',()=>{ui.start=false;importPick();},{'data-npc-start-card':'import'});
  d.append(grid);return d;}
 function listInto(list){list.replaceChildren();const q=ui.search.trim().toLowerCase(),all=entries().filter(x=>!q||x.name.toLowerCase().includes(q)||x.id.toLowerCase().includes(q));
  for(const [g,name] of GROUPS){const xs=all.filter(x=>x.group===g);if(!xs.length)continue;const d=el('details','','npc-group',{'data-npc-group':g});d.open=g!=='crowd'&&g!=='earlier'||!!q||xs.some(x=>x.id===ui.id);d.append(el('summary',name+' ('+xs.length+')','me-group'));
   for(const x of xs){const plan_=x.kind==='roster'&&plan(x.id);d.append(btn(x.name+(plan_?' ✎':''),()=>{ui.id=x.id;ui.start=false;status='';draw();},'me-mission'+(ui.id===x.id?' on':''),{'data-npc':x.id,...(advanced()?{title:x.id}:{})}));}list.append(d);}
  if(!all.length)list.append(el('p','Nobody has that name. Try fewer letters, or clear the box to see everyone.','me-small'));}
 // ---------------------------------------------------------------- one NPC
 function detail(main,e,pv){
  main.append(el('h3',e.name));if(advanced())main.append(el('p','id '+e.id,'me-small',{'data-npc-id':e.id}));if(e.kind==='import')main.append(el('p','LOCAL TEST ONLY: not in the live game','me-warn'));
  if(e.kind==='import')return importDetail(main,e.rec,pv);
  const g=e.giver,asset=e.look,clips=clipsOf(asset);
  const facts=el('section','','me-check',{'data-npc-facts':e.id});facts.append(el('h4','About'));
  const row=(k,v,h)=>{const p=el('p');p.append(el('b',k+': '),document.createTextNode(v||'—'));facts.append(p);if(h)facts.append(hint(h));};
  row('Look (model)',asset?asset+(clips.length?' · '+clips.length+' clips':''):'no crowd model (drawn by its own scene code)',HELP.look);
  if(e.kind==='crowd'){row('Where','The street picks figures from this pool (crowd.js, ncz-nightlife.js).',HELP.crowd);}
  else{const live=root.VoidStreetPair?.live?.(),lh=live&&live.her&&live.her.id===e.id?' · in this game now at x '+live.her.x.toFixed(1)+', z '+live.her.z.toFixed(1)+' ('+(live.her.mode||'')+')':'';row('Where',(g.where||'')+lh,HELP.where);
   const reg=S().src?.registry?.npcs?.[e.id],vn=S().voiceNow?S().voiceNow(e.id):{kind:'none'};row('Voice',vn.kind==='elevenlabs'?'ElevenLabs: '+vn.name+(reg?' (recorded lines: Kokoro '+reg.voice+', locked)':''):reg?reg.voice+' · '+reg.status+' (Kokoro, locked)':'no voice yet (their lines are text)',HELP.voice);
   row('Missions',g.canTalk?(g.players?'Can give missions; players can reach them today.':'Can give missions in a draft; players cannot reach them today.'):'Cannot give missions yet: '+(g.why||'no TALK prompt')+'.');
   if(g.shift)facts.append(el('p',S().G().shiftText(g),'me-small me-warn'));}
  main.append(facts);
  previewBox(main,e,asset,clips,pv);
  if(e.kind!=='import')main.append((()=>{const b=el('section','','me-check',{'data-npc-appearance':e.id});b.append(el('h4','Appearance (coming next)'),hint('Changing their colours, hiding or adding pieces of clothing and saving named looks is planned next (approved). Nothing here changes their look yet.'));return b;})());
  if(e.kind==='roster'){giverBox(main,e);placeBox(main,e,clips);animBox(main,e,asset);requestBox(main,e,asset);linesBox(main,e);}
  else if(e.kind==='crowd')animBox(main,e,asset);
  else requestBox(main,e,asset);}
 // ---- the 3D preview
 function previewBox(main,e,asset,clips,pv,file){const box=el('section','','me-check',{'data-npc-preview':e.id});box.append(el('h4','Preview'),hint(HELP.preview));
  const stage=pv||el('div','','npc-preview');box.append(stage);
  const cl=el('div','','me-row',{'data-npc-clips':e.id});box.append(cl,hint(HELP.clips));
  const note=el('p',ui.previewNote||'','me-small',{'data-npc-preview-note':'1'});box.append(note);
  const fill=names=>{cl.replaceChildren();for(const c of names){const short=c.replace(/^.*?-(?=[a-z-]+$)/,'');cl.append(btn(c.replace(/\.\d{3}$/,''),()=>{ui.preview?.play(c);for(const b of cl.children)b.classList.toggle('on',b===event.target);},ui.preview?.current===c?'on':'',{'data-npc-clip':c}));}};
  if(ui.preview&&ui.previewFor===e.id){fill(ui.preview.clips);}
  else{const go=btn('Show me in 3D',async()=>{go.disabled=true;note.textContent='Loading the model…';try{ui.preview?.dispose();ui.preview=root.VoidNPCPreview.mount(stage);ui.previewFor=e.id;
    const info=await ui.preview.show(file?{file,buffer:file.buffer}:{asset});ui.previewNote=info?'Loaded: '+info.triangles.toLocaleString('en')+' triangles · '+ui.preview.clips.length+' clips in the file.':'';note.textContent=ui.previewNote;fill(ui.preview.clips);go.remove();if(file&&e.onInfo)e.onInfo(info);}
    catch(err){note.textContent='No preview: '+(/HTTP 404|unavailable/.test(String(err&&err.message))?'this model file is not in the public files here (a licensed model is published with the live site only; the game still shows it there).':err.message);go.disabled=false;}},'',{'data-npc-preview-go':e.id});
   if(asset||file)cl.append(go);else note.textContent='No model file to preview (this person is drawn by their scene’s own code).';
   if(clips.length&&!file)box.append(el('p','Clips in their file (crowd.js): '+clips.join(', '),'me-small'));}
  main.append(box);}
 // ---- make giver
 function giverBox(main,e){const g=e.giver,box=el('section','','me-check',{'data-npc-giver':e.id});box.append(el('h4','Give a mission'),hint(HELP.giver));
  const d=S().local(),own=(d.trees||[]).filter(t=>!t.shipped&&/^draft-/.test(t.id)),sel=el('select','','',{'aria-label':'Which tree','data-npc-giver-tree':e.id});
  for(const t of own)sel.append(new Option(t.name||t.id,t.id));sel.append(new Option('a new tree “Missions from '+g.name+'”',''));
  const mine=[];for(const t of d.trees||[])for(const m of t.missions)if(m.giver===e.id)mine.push(m.title||m.id);
  const r=el('div','','me-row');r.append(el('span','in','me-small'),sel,btn('Give them a mission',()=>{const x=S().addGiverMission(e.id,sel.value);status='';DTX().tab='missions';DTX().render();},'',{'data-npc-make-giver':e.id,...(g.canTalk&&g.draft?{}:{disabled:'',title:g.why||'No TALK prompt in the game yet.'})}));box.append(r);
  if(!(g.canTalk&&g.draft))box.append(el('p','Not possible yet: '+(g.why||'they have no TALK prompt in the game')+'.','me-small me-warn'));
  box.append(el('p',mine.length?'Already gives in your draft: '+mine.join(', ')+'.':'Gives no mission in your draft yet.','me-small'));main.append(box);}
 // ---- placement (stay / route / own routine)
 function placeBox(main,e,clips){const id=e.id,M=X().MOVABLE[id],box=el('section','','me-check',{'data-npc-place':id});box.append(el('h4','Where they are in the game'),hint(HELP.place));
  if(!M){const why=e.giver.group==='earlier'?'Not in the District today.':/district-people|District/.test(e.giver.where||'')?'Placed by the District’s own room code (a fixed spot in a building).':e.giver.where?'Placed by its scene’s own code ('+e.giver.where.replace(/\s*\(.*$/,'')+').':'No figure in the walking game.';
   box.append(el('p','Cannot be moved from here yet: '+why+' Today only Reverie and Lace can be moved (their walking code follows a plan).','me-small me-warn',{'data-npc-place-locked':id}));main.append(box);return;}
  const p=plan(id),mode=p&&p.mode!=='original'?p.mode:'own',acts=X().actionsFor(id,p&&p.anims||[]),probs=p?X().planProblems(id,p):[];
  const modes=el('div','','me-row');for(const [m_,name] of [['own','Let her do her usual thing'],['stay','Keep her at one spot'],['path','Make her walk a route']])modes.append(btn(name,()=>{
    if(m_==='own'){const before=p;setPlan(id,p&&p.anims?{mode:'original',anims:p.anims}:null);if(before&&before.mode!=='original'){status='She is back to her usual thing.';ui.undo=()=>setPlan(id,before);}}
    else if(m_==='stay'){const s0=root.VoidStreetPair?.SEAT||{x:104.4,z:-5.9};setPlan(id,{...(p&&p.anims?{anims:p.anims}:{}),mode:'stay',x:p&&p.mode==='stay'?p.x:s0.x,z:p&&p.mode==='stay'?p.z:-6.4,yaw:p&&p.mode==='stay'?p.yaw:Math.PI,actions:p&&p.mode==='stay'?p.actions:X().STAY_DEFAULT.slice()});}
    else{setPlan(id,{...(p&&p.anims?{anims:p.anims}:{}),mode:'path',points:p&&p.mode==='path'?p.points:[]});root.VoidEditorGuide?.focusNext();}
    draw();},mode===m_?'on':'',{'data-npc-mode':m_,'aria-pressed':String(mode===m_)}));
  box.append(modes,hint(mode==='own'?'She does what the game has her do now: walks her stretch of the Avenue, sits on the ledges, plays with the cat.':mode==='stay'?HELP.stay:HELP.route));
  const markers=[],live=root.VoidStreetPair?.live?.();if(live&&live.her&&live.her.id===id)markers.push({id:'live',x:live.her.x,z:live.her.z,ghost:true,color:'#ffd34d',label:M.name+' now'});
  for(const t of S().local().trees||[])for(const m of t.missions)if(m.giver===id&&m.waitAt)markers.push({id:'w-'+m.id,x:m.waitAt.x,z:m.waitAt.z,yaw:m.waitAt.yaw,ghost:true,color:'#c08aff',label:'waits for “'+(m.title||m.id)+'”'});
  if(mode==='stay')markers.push({id:'stay',x:p.x,z:p.z,yaw:p.yaw,color:'#ff8ad8',label:M.name+' stays here',drag:true,facing:true,bad:X().spotProblems(id,p).length>0});
  const route=mode==='path'?p.points.map((q,i)=>({...q,bad:X().spotProblems(id,q).length>0})):[],routeBad=mode==='path'?p.points.map((q,i)=>X().legProblems(id,q,p.points[(i+1)%p.points.length]).length?i:-1).filter(i=>i>=0):[];
  const map=root.VoidNPCMap.create({npc:id,markers,route,routeBad,selected:'stay',center:mode==='stay'?p.x:mode==='path'&&p.points.length?p.points[0].x:null,
   onPick:(x,z)=>{if(mode==='stay'){const s_=X().snap(id,{x,z});setPlan(id,{...p,x:s_.x,z:s_.z});draw();}else if(mode==='path'){const s_=X().snap(id,{x,z});setPlan(id,{...p,points:[...p.points,{x:s_.x,z:s_.z,action:'look',seconds:5}]});draw();}},
   onDrag:(mid,x,z)=>{if(mid==='stay'){const s_=X().snap(id,{x,z});setPlan(id,{...p,x:s_.x,z:s_.z});draw();}},onFacing:(mid,yaw)=>{if(mid==='stay'){setPlan(id,{...p,yaw});draw();}},
   onPoint:mode==='path'?(i,x,z)=>{const s_=X().snap(id,{x,z}),pts=p.points.slice();pts[i]={...pts[i],x:s_.x,z:s_.z};setPlan(id,{...p,points:pts});draw();}:null});
  map.el.dataset.npcMap=id;box.append(map.el);
  if(mode==='stay'){const r=el('div','','me-row');r.append(el('b','Spot: x '+p.x.toFixed(1)+', z '+p.z.toFixed(1)+' · facing '+S().compass(p.yaw)));for(const f of [['N',0],['E',Math.PI/2],['S',Math.PI],['W',-Math.PI/2]])r.append(btn('face '+f[0],()=>{setPlan(id,{...p,yaw:Math.round(f[1]*100)/100});draw();}));box.append(r);
   const ab=el('div','','me-subjects',{role:'group','aria-label':'What she does there','data-npc-stay-actions':id});for(const a of acts.filter(a=>!a.path)){const l=el('label','','me-small',{title:a.help}),c=el('input','','',{type:'checkbox',value:a.id,'data-npc-act':a.id});c.checked=p.actions.includes(a.id);
    c.onchange=()=>{const list=c.checked?[...p.actions,a.id]:p.actions.filter(x=>x!==a.id);setPlan(id,{...p,actions:list});draw();};l.append(c,' '+a.name);ab.append(l);}box.append(el('b','What she does there'),ab,hint(HELP.stay));}
  if(mode==='path'){const tb=el('table','','me-table',{'data-npc-route':id});tb.innerHTML='<tr><th>#</th><th>Where</th><th>Does</th><th>Seconds</th><th></th></tr>';
   p.points.forEach((q,i)=>{const tr=el('tr','','',{'data-npc-point':String(i)}),as=el('select','','',{'aria-label':'Action at point '+(i+1),'data-npc-point-action':String(i)});for(const a of acts)as.append(new Option(a.name,a.id));as.value=q.action;as.title=(acts.find(a=>a.id===q.action)||{}).help||'';
    as.onchange=()=>{const pts=p.points.slice();pts[i]={...q,action:as.value};setPlan(id,{...p,points:pts});draw();};
    const sec=el('input','','',{type:'number',min:'1',max:'120',step:'1','aria-label':'Seconds at point '+(i+1),'data-npc-point-seconds':String(i),style:'width:5em'});sec.value=String(q.seconds||5);sec.disabled=q.action==='walk-on';sec.title=HELP.seconds;sec.onchange=()=>{const pts=p.points.slice();pts[i]={...q,seconds:Math.max(1,Math.min(120,Math.round(+sec.value||5)))};setPlan(id,{...p,points:pts});draw();};
    const td=(...n)=>{const c=el('td');c.append(...n);return c;};
    tr.append(td(el('b',String(i+1))),td(el('span','x '+q.x.toFixed(1)+', z '+q.z.toFixed(1),X().spotProblems(id,q).length?'me-bad':'me-small')),td(as),td(sec),td(btn('▲',()=>{if(!i)return;const pts=p.points.slice();[pts[i-1],pts[i]]=[pts[i],pts[i-1]];setPlan(id,{...p,points:pts});draw();},'',{'aria-label':'Move point up',...(i?{}:{disabled:''})}),btn('×',()=>{const before=p;setPlan(id,{...p,points:p.points.filter((_,k)=>k!==i)});status='Point '+(i+1)+' removed.';ui.undo=()=>setPlan(id,before);draw();},'me-x',{'aria-label':'Remove point '+(i+1)})));tb.append(tr);});
   box.append(tb,hint(HELP.action));if(!p.points.length)box.append(el('p','No points yet — click a spot on the green pavement to start. Then click again for the next point (at least two).','me-small me-warn',{'data-npc-empty':'1'}));}
  for(const pr of probs)box.append(el('p','⚠ '+pr,'me-bad',{'data-npc-problem':'1'}));
  const act=el('div','','me-row me-actions');act.append(btn('PLAY THIS DRAFT',()=>playNpc(e),'me-play',{'data-npc-play':id,...(probs.length?{disabled:'',title:'Fix the problems first.'}:{})}),hint(HELP.play));box.append(act);
  main.append(box);}
 // ---- add animation: every clip in the game, grouped, searchable; usable ones can be tried and added, the rest say why (npc-paths.js libraryOffer, npc-clip-index.json)
 function animBox(main,e,asset){const id=e.id,mv=!!X().MOVABLE[id],box=el('section','','me-check',{'data-npc-anims':id});box.append(el('h4','Add animation'),hint(HELP.anim));
  if(!root.VoidNPCClipIndex){box.append(el('p','Reading the list of every animation in the game…','me-small'));fetch('void-runner/npc-clip-index.json',{cache:'no-cache'}).then(r=>r.json()).then(j=>{root.VoidNPCClipIndex=j;draw();}).catch(()=>{});main.append(box);return;}
  if(!mv){box.append(el('p','Only characters the editor can move (Reverie and Lace today) can use added animations in the game.','me-small me-warn'));main.append(box);return;}
  const p=plan(id),have=new Set((p&&p.anims)||[]),offer=X().libraryOffer(id),q=String(ui.animSearch||'').toLowerCase(),show=ui.animAll?offer:offer.filter(o=>o.ok||have.has(o.id));
  const bar=el('div','','me-row'),s_=el('input','','',{'aria-label':'Find an animation',placeholder:'Find an animation (e.g. wave, dance, laugh)','data-npc-anim-search':'1'});s_.value=ui.animSearch||'';s_.onchange=()=>{ui.animSearch=s_.value;draw();};
  const all=el('label','','me-small'),ac=el('input','','',{type:'checkbox','data-npc-anim-all':'1'});ac.checked=!!ui.animAll;ac.onchange=()=>{ui.animAll=ac.checked;draw();};all.append(ac,' also show the ones she cannot use, and why');
  bar.append(s_,all);box.append(bar,el('p',offer.filter(o=>o.ok).length+' animations she can use · '+offer.length+' in the game · '+have.size+' added','me-small',{'data-npc-anim-count':id}));
  const byCat=new Map();for(const o of show){if(q&&!(o.title+' '+o.source+' '+o.category).toLowerCase().includes(q))continue;if(!byCat.has(o.category))byCat.set(o.category,[]);byCat.get(o.category).push(o);}
  if(!byCat.size)box.append(el('p','Nothing matches. Try another word, or tick “also show the ones she cannot use”.','me-small'));
  for(const [cat,list] of byCat){const d=el('details','','me-npc-group',{'data-npc-anim-cat':cat});d.open=!!q||byCat.size<4||list.some(o=>have.has(o.id));d.append(el('summary',cat+' ('+list.length+')'));
   for(const o of list.slice(0,q?120:60)){const r=el('div','','me-row',{'data-npc-anim':o.id}),c=el('input','','',{type:'checkbox','aria-label':'Add '+o.title});c.checked=have.has(o.id);c.disabled=!o.ok&&!have.has(o.id);
    c.onchange=()=>{const cur=plan(id)||{mode:'original'},lst=c.checked?[...new Set([...(cur.anims||[]),o.id])].slice(0,8):(cur.anims||[]).filter(x=>x!==o.id),nx={...cur,anims:lst};if(!lst.length)delete nx.anims;const before=cur;setPlan(id,nx.mode==='original'&&!lst.length?null:nx);status=c.checked?'Added “'+o.title+'”: it is now in her list of things to do.':'Removed “'+o.title+'”.';ui.undo=()=>setPlan(id,before.mode==='original'&&!(before.anims||[]).length?null:before);draw();};
    r.append(c,el('span',o.title,o.ok?'':'me-small'),el('span',o.ok?(o.status==='library'?'animation library':'works on her rig'):o.why,o.ok?'me-ok me-small':'me-small me-warn'));
    if(o.ok)r.append(btn('Try it',async()=>{if(!ui.preview||ui.previewFor!==id){status='Press “Show me in 3D” first (above), then try again.';draw();return;}const res=await ui.preview.tryLibrary(o.id,asset);status=res.ok?'Playing “'+o.title+'” on the preview.':res.why;draw();},'',{'data-npc-anim-try':o.id}));
    else r.append(btn('Request it',()=>{ui.requestText=o.title+' ('+o.source+')';draw();setTimeout(()=>host.querySelector('[data-npc-request-text]')?.focus(),30);},'',{'data-npc-anim-request':o.id}));d.append(r);}
   if(list.length>(q?120:60))d.append(el('p','… and '+(list.length-(q?120:60))+' more: type in the box to find one.','me-small'));box.append(d);}
  main.append(box);}
 // ---- request animation (exported list; never published)
 function requestBox(main,e,asset){const box=el('section','','me-check',{'data-npc-requests':e.id});box.append(el('h4','Request an animation'),hint(HELP.request));
  const all=S().local().animRequests||[],mine=all.filter(r=>r.npc===e.id);const r=el('div','','me-row'),inp=el('input','','',{'aria-label':'Animation wanted',placeholder:'What you want her / him to do, e.g. “leaning on the wall, arms crossed”',maxlength:'300','data-npc-request-text':e.id,style:'min-width:24em'});if(ui.requestText){inp.value=ui.requestText;ui.requestText='';}
  r.append(inp,btn('ADD REQUEST',()=>{if(!inp.value.trim()){status='Describe the animation first.';draw();return;}const d=S().local();d.animRequests=[...(d.animRequests||[]),X().request(e.id,asset,inp.value)].slice(-100);S().saveLocal(d);status='Request added. DOWNLOAD REQUESTS gives the list to send.';draw();},'',{'data-npc-request-add':e.id}),
   btn('DOWNLOAD REQUESTS ('+all.length+')',()=>download('npc-animation-requests.json',{format:'darknet-district-animation-requests',version:1,exportedAt:new Date().toISOString(),note:'For Claude/Codex: retarget each onto the named rig with tools/animation-pipeline. route local-retarget-only = a licensed No AI model: never Meshy or any AI tool.',requests:all}),'',all.length?{'data-npc-request-download':'1'}:{disabled:''}));box.append(r);
  if(X().noAI(asset,e.id))box.append(el('p','Licensed No AI model: a request is a local retarget on your PC only (Blender), never Meshy or any AI tool.','me-small me-warn'));
  mine.forEach((q,i)=>{const row=el('div','','me-row',{'data-npc-request':String(i)});row.append(el('span','• '+q.want+' · '+(q.route==='local-retarget-only'?'local retarget only':'retarget or library'),'me-small'),btn('×',()=>{const d=S().local();d.animRequests=(d.animRequests||[]).filter(x=>x!==d.animRequests.find(y=>y.at===q.at&&y.npc===q.npc));S().saveLocal(d);draw();},'me-x',{'aria-label':'Remove request'}));box.append(row);});
  main.append(box);}
 // ---- lines & voice (the old "All lines for an NPC")
 function linesBox(main,e){const box=el('section','','me-check',{'data-npc-lines':e.id});box.append(el('h4','Lines & voice'),hint(HELP.lines));if(S().voicePanel)box.append(S().voicePanel(e.id,{redraw:draw,say:t=>{status=t;}}));
  const q=el('input','','',{'aria-label':'Find in the lines',placeholder:'Find words in the lines','data-npc-line-search':'1'});q.value=ui.lineSearch;const inner=el('div');
  q.oninput=()=>{ui.lineSearch=q.value;inner.replaceChildren();S().linesView(inner,e.id,{search:ui.lineSearch});};box.append(q,hint(HELP.lineSearch),inner);S().linesView(inner,e.id,{search:ui.lineSearch});main.append(box);}
 const download=(name,data)=>{const a=document.createElement('a');a.href=URL.createObjectURL(data instanceof Blob?data:new Blob([JSON.stringify(data,null,1)],{type:'application/json'}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500);};
 // ---------------------------------------------------------------- import a model (this browser only)
 function importPick(){const f=document.createElement('input');f.type='file';f.accept='.glb,.gltf,model/gltf-binary,model/gltf+json';f.dataset.npcImportFile='1';f.style.display='none';document.body.append(f);
  f.onchange=async()=>{const file=f.files&&f.files[0];f.remove();if(file)await importFile(file);};f.click();}
 async function importFile(file){const ext=(file.name.match(/\.[a-z0-9]+$/i)||[''])[0].toLowerCase();if(!X().IMPORT.exts.includes(ext)){status='Only .glb or .gltf files can be imported.';draw();return null;}
  if(file.size>X().IMPORT.maxBytes){status='This file is '+(file.size/1048576).toFixed(1)+' MB; the limit is '+(X().IMPORT.maxBytes/1048576).toFixed(0)+' MB. Reduce it in Blender, or send it to Claude/Codex.';draw();return null;}
  const rec={id:'imp-'+Date.now().toString(36),name:file.name.replace(/\.[^.]+$/,'').slice(0,60),fileName:file.name,type:file.type||'model/gltf-binary',bytes:file.size,blob:file,createdAt:new Date().toISOString(),licence:{source:'',type:'',noAI:null},placement:null,info:null};
  await dbPut(rec);await loadImports();ui.id='import:'+rec.id;status='Imported '+file.name+' (in this browser only). Press SHOW 3D PREVIEW to run the checklist.';root.VoidEditorGuide?.focusNext();draw();return rec;}
 async function saveRec(rec){await dbPut(rec);await loadImports();}
 function importDetail(main,rec,pv){
  main.append(el('p','LOCAL TEST ONLY · not in the live game · kept in this browser · '+rec.fileName+' · '+(rec.bytes/1048576).toFixed(1)+' MB','me-warn',{'data-npc-local-only':'1'}),hint(HELP.import));
  const file=rec.blob;const e={id:'import:'+rec.id,onInfo:async info=>{rec.info={triangles:info.triangles,bytes:rec.bytes,textures:info.textures,bones:info.bones,clips:ui.preview.clips,height:info.height};await saveRec(rec);draw();}};
  previewBox(main,e,null,[],pv,file);
  const ck=el('section','','me-check',{'data-npc-checklist':rec.id});ck.append(el('h4','Checklist'),hint(HELP.check));
  const verdict=rec.info?X().importCheck(rec.info):null;
  if(!verdict)ck.append(el('p','Press SHOW 3D PREVIEW to measure the model.','me-small me-warn'));else for(const it of verdict.items)ck.append(el('p',(it.level==='ok'?'✓ ':it.level==='warn'?'△ ':'✗ ')+it.text,it.level==='ok'?'me-ok':it.level==='warn'?'me-warn':'me-bad',{'data-npc-check':it.level}));
  main.append(ck);
  const nm=el('section','','me-check');const ni=el('input','','',{'aria-label':'Name of the model','data-npc-import-name':rec.id,maxlength:'60'});ni.value=rec.name||'';ni.onchange=async()=>{rec.name=ni.value.trim().slice(0,60);await saveRec(rec);draw();};
  const l=el('label','','me-field');l.append(el('span','Name'),ni,hint('What you call it (shown in the list and in the package).'));nm.append(l);main.append(nm);
  const refused=verdict&&!verdict.ok;
  // placement (local test)
  const clips=(rec.info&&rec.info.clips)||[],bx=el('section','','me-check',{'data-npc-place':'import:'+rec.id});bx.append(el('h4','Where it stands in the test'),hint('Put it on The Avenue’s north pavement for a local test: STAY HERE at a spot doing its own clips, or a ROUTE of points. Only in a throwaway test session in this browser.'));
  if(refused)bx.append(el('p','Refused: it is over a hard limit (see the checklist), so it cannot be tried.','me-bad'));
  else{const p=rec.placement,mode=p?p.mode:'none',modes=el('div','','me-row');
   for(const [m_,n] of [['stay','STAY HERE'],['path','ROUTE']])modes.append(btn(n,async()=>{rec.placement=m_==='stay'?{mode:'stay',x:p&&p.x||100,z:p&&p.z||-6.4,yaw:p&&Number.isFinite(p.yaw)?p.yaw:Math.PI,actions:[clips.find(c=>/idle/.test(c))||clips[0]||'wait']}:{mode:'path',points:p&&p.points||[]};await saveRec(rec);draw();},mode===m_?'on':'',{'data-npc-mode':m_}));bx.append(modes);
   if(p){const markers=p.mode==='stay'?[{id:'stay',x:p.x,z:p.z,yaw:p.yaw,color:'#7fe0ff',label:rec.name,drag:true,facing:true}]:[];
    const put=async(x,z,i)=>{const s_={x:Math.round(Math.max(X().AVENUE_NORTH.x0,Math.min(X().AVENUE_NORTH.x1,x))*10)/10,z:Math.round(Math.max(X().AVENUE_NORTH.z0,Math.min(X().AVENUE_NORTH.z1,z))*10)/10};if(p.mode==='stay')Object.assign(p,s_);else if(i==null)p.points.push({...s_,action:clips[0]||'wait',seconds:5});else Object.assign(p.points[i],s_);await saveRec(rec);draw();};
    const map=root.VoidNPCMap.create({npc:null,markers,route:p.mode==='path'?p.points:[],selected:'stay',onPick:(x,z)=>put(x,z),onDrag:(m,x,z)=>put(x,z),onFacing:async(m,yaw)=>{p.yaw=yaw;await saveRec(rec);draw();},onPoint:p.mode==='path'?(i,x,z)=>put(x,z,i):null});map.el.dataset.npcMap='import';bx.append(map.el);
    const opts=['wait',...clips];if(p.mode==='stay'){const s_=el('select','','',{'aria-label':'Clip it plays','data-npc-import-clip':'1'});for(const c of opts)s_.append(new Option(c,c));s_.value=p.actions[0];s_.onchange=async()=>{p.actions=[s_.value];await saveRec(rec);};const r=el('div','','me-row');r.append(el('b','Plays'),s_,hint('One of the clips in its own file.'));bx.append(r);}
    else p.points.forEach((q,i)=>{const r=el('div','','me-row',{'data-npc-point':String(i)}),s_=el('select','','',{'aria-label':'Clip at point '+(i+1)});for(const c of opts)s_.append(new Option(c,c));s_.value=q.action;s_.onchange=async()=>{q.action=s_.value;await saveRec(rec);};
     const sec=el('input','','',{type:'number',min:'1',max:'120',style:'width:5em','aria-label':'Seconds'});sec.value=String(q.seconds||5);sec.onchange=async()=>{q.seconds=Math.max(1,Math.min(120,Math.round(+sec.value||5)));await saveRec(rec);};
     r.append(el('b',String(i+1)),el('span','x '+q.x.toFixed(1)+', z '+q.z.toFixed(1),'me-small'),s_,sec,btn('×',async()=>{p.points.splice(i,1);await saveRec(rec);draw();},'me-x'));bx.append(r);});
    const probs=X().importPlanProblems(p,clips);for(const pr of probs)bx.append(el('p','⚠ '+pr,'me-bad',{'data-npc-problem':'1'}));
    const a=el('div','','me-row me-actions');a.append(btn('PLAY THIS DRAFT (LOCAL TEST)',()=>playNpc({id:'import:'+rec.id,kind:'import',rec}),'me-play',{'data-npc-play':'import:'+rec.id,...(probs.length||!rec.info?{disabled:''}:{})}),hint(HELP.play+' The model appears only in that test.'));bx.append(a);}}
  main.append(bx);
  // licence and the package
  const lic=el('section','','me-check',{'data-npc-licence':rec.id});lic.append(el('h4','Add to the game'),hint(HELP.licence));
  const L=rec.licence||(rec.licence={source:'',type:'',noAI:null});
  const f=(label,key,ph)=>{const i=el('input','','',{'aria-label':label,'data-npc-lic':key,placeholder:ph,maxlength:key==='source'?'300':'120'});i.value=L[key]||'';i.onchange=async()=>{L[key]=i.value.trim();await saveRec(rec);draw();};const w=el('label','','me-field');w.append(el('span',label),i);return w;};
  lic.append(f('Where it is from','source','e.g. made in Meshy by me / CGTrader item 12345 / Sketchfab link'),f('Licence type','type','e.g. my own work / Royalty Free / CC-BY 4.0'));
  const ai=el('div','','me-row',{'data-npc-lic':'noAI'});ai.append(el('b','No AI licence?'));for(const [v,n] of [[true,'YES (No AI)'],[false,'NO']])ai.append(btn(n,async()=>{L.noAI=v;await saveRec(rec);draw();},L.noAI===v?'on':'',{'data-npc-noai':String(v),'aria-pressed':String(L.noAI===v)}));ai.append(hint('Yes if its licence forbids AI tools or AI training. Then it is only ever processed on your PC (Blender), never with Meshy or any AI tool.'));lic.append(ai);
  const ready=rec.info&&!refused&&L.source&&L.type&&(L.noAI===true||L.noAI===false)&&rec.name;
  const r=el('div','','me-row me-actions');r.append(btn('ADD TO THE GAME (DOWNLOAD THE PACKAGE)',()=>{download(rec.fileName,rec.blob);download((rec.name||'model').replace(/[^\w-]+/g,'-')+'-package.json',packageOf(rec));status='Downloaded '+rec.fileName+' and its package. Send both to Claude or Codex.';draw();},'me-play',{'data-npc-add-to-game':rec.id,...(ready?{}:{disabled:'',title:'Fill in the name and the licence questions first (and the checklist must pass).'})}),hint(HELP.addToGame));lic.append(r);
  lic.append(btn('Delete this model (from this browser)',async()=>{if(!confirm('Delete '+rec.fileName+' from this browser? You can press UNDO straight after.'))return;const keep=rec;await dbDel(rec.id);await loadImports();ui.id=null;status='Deleted '+keep.fileName+'.';ui.undo=async()=>{await dbPut(keep);await loadImports();ui.id='import:'+keep.id;};draw();},'me-x',{'data-npc-import-delete':rec.id}));
  main.append(lic);}
 function packageOf(rec){const I=rec.info||{};return {format:'darknet-district-npc-import',version:1,exportedAt:new Date().toISOString(),name:rec.name,fileName:rec.fileName,
  model:{triangles:I.triangles|0,bytes:rec.bytes|0,textures:I.textures||[],joints:(I.bones||[]).length,bones:(I.bones||[]).slice(0,80),clips:I.clips||[],height:Number.isFinite(I.height)?Math.round(I.height*100)/100:null},
  caps:{maxTriangles:X().IMPORT.maxTriangles,target:X().IMPORT.target,maxBytes:X().IMPORT.maxBytes,texWarn:X().IMPORT.texWarn},checklist:I.triangles!=null?X().importCheck(I).items:[],
  placement:rec.placement||null,licence:{source:rec.licence?.source||'',type:rec.licence?.type||'',noAI:rec.licence?.noAI},
  note:'Local test import from Developer Tools > NPCs. Not in the live game. Check the licence before committing; a licensed or unknown-licence model never goes into the public repository; a No AI model is processed locally only (never Meshy or any AI tool).'};}
 // ---------------------------------------------------------------- PLAY THIS DRAFT for a placement (and the local test of an imported model)
 async function playNpc(e){const Sx=S();try{root.sessionStorage.setItem(RETURN,JSON.stringify({npc:e.id,at:Date.now()}));}catch{}
  if(e.kind!=='import'){const p=plan(e.id),t=p&&p.mode==='stay'?p:p&&p.mode==='path'&&p.points[0]?p.points[0]:root.VoidStreetPair?.SEAT||{x:104,z:-6};return Sx.jumpTo(t.x,t.z,e.id,(X().MOVABLE[e.id]||{}).name+(p&&p.mode==='path'?' walks your route':p&&p.mode==='stay'?' stays at your spot':''),RETURN);}
  const rec=e.rec,p=rec.placement,t=p.mode==='stay'?p:p.points[0];const r=await Sx.jumpTo(t.x,t.z,null,rec.name+' (local test only)',RETURN);if(r&&r.started)setTimeout(()=>spawn(rec).catch(err=>{try{announce('The imported model could not be shown: '+err.message);}catch{}}),400);}
 /* The imported model in the test session: loaded from this browser into the game's scene, scaled to a person's height if it is far off, and moved by a small loop. */
 async function spawn(rec){const B=root.BABYLON,scene=root.VoidBabylon?.scene;if(!scene)throw new Error('no scene');await root.VoidNPCPreview.loaders();const buf=await rec.blob.arrayBuffer(),ext=/\.gltf$/i.test(rec.fileName)?'.gltf':'.glb';
  const c=await B.SceneLoader.LoadAssetContainerAsync('',ext==='.gltf'?new TextDecoder().decode(buf):new Uint8Array(buf),scene,null,ext);c.addAllToScene();const n=new B.TransformNode('npc-import-'+rec.id,scene);
  for(const m of c.meshes)if(!m.parent)m.parent=n;for(const t of c.transformNodes)if(!t.parent)t.parent=n;for(const m of c.meshes){m.isPickable=false;if(m.material&&m.material.maxSimultaneousLights>8)m.material.maxSimultaneousLights=8;}
  const h=rec.info&&rec.info.height;if(h&&(h<1.3||h>2.3))n.scaling.scaleInPlace(1.75/h);const groups=c.animationGroups;for(const g of groups)g.stop();const play=name=>{for(const g of groups)g.stop();const g=groups.find(x=>x.name===name||x.name.endsWith('-'+name));if(g)g.start(true);};
  const p=rec.placement,Y=.18;let i=0,left=0,doing=false;root.VoidNPCEditor.spawned={id:rec.id,node:n};
  if(p.mode==='stay'){n.position.set(p.x,Y,p.z);n.rotation.y=p.yaw||0;play(p.actions[0]);return n;}
  n.position.set(p.points[0].x,Y,p.points[0].z);const walk=groups.find(g=>/walk/.test(g.name));
  scene.onBeforeRenderObservable.add(()=>{if(n.isDisposed())return;const dt=Math.min(.1,scene.getEngine().getDeltaTime()/1000),q=p.points[i];if(doing){left-=dt;if(left<=0){doing=false;i=(i+1)%p.points.length;if(walk)play(walk.name);}return;}
   const dx=q.x-n.position.x,dz=q.z-n.position.z,d=Math.hypot(dx,dz);if(d<.05){doing=true;left=q.seconds||5;play(q.action);return;}const v=Math.min(d,1*dt);n.position.x+=dx/d*v;n.position.z+=dz/d*v;n.rotation.y=Math.atan2(dx,dz);});
  if(walk)play(walk.name);return n;}
 // ---------------------------------------------------------------- "Guide me" for this tab (the same rules as the checks: npc-paths.js)
 function guideNow(){const Gd=root.VoidEditorGuide,sc=host&&host.querySelector('#npc-root');if(!Gd||!sc)return null;const all=entries(),e=all.find(x=>x.id===ui.id);if(!e){Gd.clear(sc);return null;}const needs=[];
  if(e.kind==='roster'&&X().MOVABLE[e.id]){const p=plan(e.id);if(p&&p.mode==='path'){if(p.points.length<2)needs.push({sel:'[data-npc-map] canvas',text:p.points.length?'click the pavement for the next point (at least 2)':'click the pavement for the first point'});
    p.points.forEach((q,i)=>{if(X().spotProblems(e.id,q).length)needs.push({sel:'[data-npc-point="'+i+'"] td:nth-child(2) span',text:'move point '+(i+1)+' onto the green pavement'});});}
   if(p&&p.mode==='stay'){if(!p.actions.length)needs.push({sel:'[data-npc-stay-actions] input',text:'tick at least one thing she does there'});if(X().spotProblems(e.id,p).length)needs.push({sel:'[data-npc-map] canvas',text:'put the spot on the green pavement'});}
   return Gd.show(sc,needs,{done:p?{sel:'[data-npc-play="'+CSS.escape(e.id)+'"]',text:'PLAY THIS DRAFT'}:null,box:sc.querySelector('[data-npc-place]')});}
  if(e.kind==='import'){const r=e.rec,L=r.licence||{};if(!r.info)needs.push({sel:'[data-npc-preview-go]',text:'show the preview (it runs the checklist)'});if(!String(r.name||'').trim())needs.push({sel:'[data-npc-import-name]',text:'give it a name'});
   if(r.info&&!X().importCheck(r.info).ok){Gd.clear(sc);return null;}
   if(!r.placement)needs.push({sel:'[data-npc-place] [data-npc-mode]',text:'choose STAY HERE or ROUTE'});else if(r.placement.mode==='path'&&r.placement.points.length<2)needs.push({sel:'[data-npc-map] canvas',text:'click the pavement for the route points'});
   if(!L.source)needs.push({sel:'[data-npc-lic="source"]',text:'where the model is from'});if(!L.type)needs.push({sel:'[data-npc-lic="type"]',text:'the licence type'});if(L.noAI!==true&&L.noAI!==false)needs.push({sel:'[data-npc-noai="true"]',text:'answer “No AI licence?”'});
   return Gd.show(sc,needs,{done:{sel:'[data-npc-add-to-game]',text:'ADD TO THE GAME'},box:sc.querySelector('[data-npc-licence]')});}
  Gd.clear(sc);return null;}
 root.VoidNPCEditor={render,draw,guideNow,importFile,packageOf,spawn,get ui(){return ui;},get imports(){return imports;},lookOf,entries,HELP,spawned:null};
})(globalThis);
