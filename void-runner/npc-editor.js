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
 const ui={look:{},block:{},area:{},recipe:{},clock:{},id:null,search:'',lineSearch:'',group:null,preview:null,previewFor:null,previewNote:'',importing:false,start:true,undo:null};
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
  place:'Where they are in the game. Pick the AREA on the map first (The Avenue, Old Town, Far South, The Outskirts, The Port or inside The Darknet District): she can be put anywhere green; red places (Milked, NULL, the District bar, the VR area) are never used for her. “Let her do her usual thing”: what she does now (on The Avenue). “Keep her at one spot”: she stands where you put her on the map (drag her; turn her with the round handle) and does the things you tick. “Make her walk a route”: she walks your points in order, does what each point says, then starts again.',
  stay:'The things she does at the spot, one after another (a few seconds each). “Sit — pose: …” needs the spot where one steps onto a seat: chair at a ledge, bench, crates or mahjong stool; kneel, cross-legged or knees to chest at a tea room cushion; cross-legged or knees to chest on a sleeping-room cot; knees to chest sideways along an alcove bench.',
  route:'Click the green ground to add a point at the end (a route stays in one area: it cannot go through the gates; give another area its own time block); drag a numbered point to move it. Each point: what she does there and for how long. After the last point she walks back to the first.',
  action:'What she does when she reaches this point. Only clips her own model has; never anything from the clubs.',
  seconds:'How long she does it, 1 to 120 seconds.',
  play:'Tries the placement in a throwaway test session in the area of her spot, with her out whatever the hour. Your real save is never touched; LEAVE brings you back here.',
  anim:'Every animation in the game, by kind. The ones she can use are listed (her own rig takes them, and they follow her content rule); tick one to add it to the things she can do in a spot or a route. “Try it” plays it on the 3D preview first. Tick “also show…” to see the rest and why not; “Request it” asks for an offline retarget.',
  request:'Ask for an animation that is not available yet (e.g. “leaning on the wall, arms crossed”). The list is downloaded and sent to Claude or Codex, who retarget it onto her rig on your PC. Licensed No AI models are marked “local retarget only”: never Meshy or any AI tool.',
  lines:'Every line this NPC says, in missions and outside them. Edit a line here or in the Mission Editor; RE-VOICE queues it for recording.',
  lineSearch:'Type words to show only the lines that contain them.',
  import:'Load a .glb, self-contained .gltf or Companion Studio .vrcompanion package from your computer to try the character on The Avenue. Companion packages keep their personality and recorded voices in a private draft. Import stores the model in this browser.',
  check:'What the game needs from a street NPC. Red: refused (over a hard limit). Amber: allowed, but someone should reduce it before it goes in the game.',
  licence:'Required before it can be sent: where the model is from, its licence, and whether that licence forbids AI tools (No AI). A licensed or unknown model never goes into the public files by itself.',
  addToGame:'Downloads the model and its integration package. For a .vrcompanion import it also includes an updated companion transfer with the current personality, voices and separate motion files. Send all files to Claude or Codex for licensed asset integration; this button does not publish.',
  crowd:'An anonymous street figure: the street picks people from this pool, so there is no single person to move yet.',
  looks:'Change how they look without touching the model file: hide an accessory, recolour their clothes, add pieces from the character creator (only on figures built like the creator’s), and save it as a named look. A look belongs to the model: everyone the game draws with this model can wear it. Every change is part of your DRAFT (UNDO works); PLAY THIS DRAFT shows it in the street.',
  lookPick:'Which saved look you are changing. “As made” is the model exactly as it is in the file (it cannot be changed). + NEW LOOK starts a new one from “as made”.',
  parts:'Separate pieces of the model you can take off (accessories and hair). Clothing that covers the body, the body and the face always stay.',
  colour:'Pick a colour and the clothes take it, keeping their own light and dark. A figure made in one piece is recoloured as a whole, but its skin keeps its own tone.',
  colourAdv:'Hue turns every colour round the colour wheel; saturation makes it duller (left) or stronger (right); brightness makes it darker or lighter. Used when no colour is picked above.',
  pieces:'Gear and hairstyles from the character creator. They fit only figures built on the creator’s skeleton, so most NPCs cannot take them.',
  schedule:'Give parts of the in-game day something different to do: for example 08:00–12:00 walk a route, 12:00–13:00 sit on the ledge, 20:00–02:00 stay at one spot. Outside every time block the placement above applies. A block may run past midnight; blocks cannot overlap; 8 at most. Tier 1 stays in one area. Tier 2 or 3 may walk through the gates into a later block.',
  tryTime:'Slide to a time of day to see what the schedule does then. PLAY THIS DRAFT AT THIS TIME starts a throwaway test session with the game’s clock set to that time.',
  chatgpt:'Say in your own words what this character should do, and let ChatGPT write it as a “behaviour recipe”: plain data the editor checks (never a program). Only places in the city’s walkable areas (never Milked, NULL, the District bar or the VR area) and actions they really have are accepted.',
  paste:'Paste ChatGPT’s answer. The editor finds the recipe in it, checks every field and says in plain words what to fix. Nothing in it is ever run as code.',
  wear:'Which look the game uses for everyone drawn with this model: none (as made), one of your looks, or a mix (each person keeps one of your looks).'};
 // ---------------------------------------------------------------- who is in the list
 const people=()=>root.VoidDistrictPeople?.npcs?.()||root.VoidDistrictPeople?.NPCS||[];
 function lookOf(id){const M=X().MOVABLE[id];if(M)return M.asset;const p=people().find(n=>n.id===id);if(p)return p.model||p.own||p.figure||p.look||null;
  const MM=root.VoidMilked?.MODELS||{};for(const k in MM)if(MM[k].id===id)return MM[k].asset||MM[k].look||null;if(root.VoidTemple?.MODEL?.id===id)return root.VoidTemple.MODEL.asset||null;return null;}
 const clipsOf=asset=>(root.VoidCrowd?.clips?.[asset]||[]).slice();
 function entries(){const g=S().givers||[],out=[];
  for(const x of g){const mv=!!X().MOVABLE[x.id];out.push({id:x.id,name:x.name,kind:'roster',made:!!x.made,group:x.made?'made':mv?'move':x.canTalk&&x.group==='district'?'givers':x.group==='district'?'district':'earlier',giver:x,look:lookOf(x.id)});}
  for(const look of Object.keys(root.VoidCrowd?.street||{}))out.push({id:'crowd:'+look,name:'Street figure '+look.replace(/^npc-/,''),kind:'crowd',group:'crowd',look});
  {const C=root.VoidCrowd||{},seen=new Set([...Object.keys(C.street||{}),...out.map(x=>x.look).filter(Boolean)]);for(const look of Object.keys(C.clips||{}))if(!seen.has(look)){seen.add(look);out.push({id:'crowd:'+look,name:'Figure '+look+(/^vr-companion|^studio-/.test(look)?' (licensed)':' (other places)'),kind:'crowd',group:'crowd',look});}}   // every other crowd model (the older multi-part figures: their accessories can be hidden; some take the creator's pieces)
  for(const r of imports)out.push({id:'import:'+r.id,name:r.name||r.fileName,kind:'import',group:'import',rec:r});
  return out;}
 const GROUPS=[['made','Made by you (mission givers you created)'],['move','Movement-controlled: stay, route and supported follow actions'],['givers','Walking TALK available (in-person missions)'],['district','District NPCs (device-started missions; no walking TALK yet)'],['import','Imported models (local test only, not in the live game)'],['crowd','Street crowd (anonymous figures)'],['earlier','Earlier / travel-location characters']];
 // ---------------------------------------------------------------- imported models (this browser only: IndexedDB)
 const DB='void-npc-imports',ST='models';
 function db(){return new Promise((ok,fail)=>{try{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{r.result.createObjectStore(ST,{keyPath:'id'});};r.onsuccess=()=>ok(r.result);r.onerror=()=>fail(r.error);}catch(e){fail(e);}});}
 async function dbAll(){try{const d=await db();return await new Promise((ok,fail)=>{const q=d.transaction(ST).objectStore(ST).getAll();q.onsuccess=()=>ok(q.result||[]);q.onerror=()=>fail(q.error);});}catch{return [];}}
 async function dbPut(rec){const d=await db();await new Promise((ok,fail)=>{const t=d.transaction(ST,'readwrite');t.objectStore(ST).put(rec);t.oncomplete=ok;t.onerror=()=>fail(t.error);});}
 async function dbDel(id){const d=await db();await new Promise((ok,fail)=>{const t=d.transaction(ST,'readwrite');t.objectStore(ST).delete(id);t.oncomplete=ok;t.onerror=()=>fail(t.error);});}
 async function loadImports(){imports=(await dbAll()).sort((a,b)=>(a.createdAt||'').localeCompare(b.createdAt||''));importsLoaded=true;}
 // ---------------------------------------------------------------- the draft (shared with the Mission Editor)
 const plan=id=>(S().local().npcs||{})[id]||null;
 /* keep: a new plan without a `schedule` field keeps the daily schedule already there (the mode buttons, the map and the animation ticks never drop it); keep:false writes p exactly. */
 function setPlan(id,p,{keep=true}={}){const d=S().local();d.npcs=d.npcs||{};const old=d.npcs[id];if(keep&&old&&Array.isArray(old.schedule)&&old.schedule.length&&!(p&&'schedule' in p))p=p?{...p,schedule:old.schedule}:{mode:'original',...(old.anims?{anims:old.anims}:{}),schedule:old.schedule};
  const c=p?X().clean(p):null;if(c)d.npcs[id]=c;else delete d.npcs[id];S().saveLocal(d);}
 /* The time block being edited on the map (Daily schedule: EDIT ON THE MAP), or null for the all-day plan. */
 const blockOf=id=>{const p=plan(id),i=ui.block[id];return p&&Array.isArray(p.schedule)&&Number.isInteger(i)&&p.schedule[i]?i:null;};
 const curPlan=id=>{const p=plan(id),i=blockOf(id);if(i==null)return p;const {from,to,name,...b}=p.schedule[i];return b.mode==='original'?null:b;};
 // ---------------------------------------------------------------- render
 function render(panel,head){host=panel;headNode=head;
  if(!S()?.built){panel.innerHTML='';panel.append(head(),el('p','Loading the NPCs from the game data…','dev-note'));Promise.all([S().ensure(),loadImports()]).then(()=>{restore();draw();}).catch(e=>{panel.append(el('p','The NPCs tab could not load ('+e.message+'). Check your connection, then press CLOSE and open Developer tools again. Your draft is safe in this browser.','me-bad'));});return;}
  if(!importsLoaded){loadImports().then(draw);}
  restore();draw();}
 function restore(){let r=null;try{r=JSON.parse(root.sessionStorage.getItem(RETURN)||'null');root.sessionStorage.removeItem(RETURN);}catch{}if(r&&r.npc){ui.id=r.npc;status='Back from the test session. Your draft is saved.';}
  const f=DTX()?.npcFocus;if(f){ui.id=f;ui.make=null;ui.start=false;DTX().npcFocus=null;}}
 function draw(){if(!host)return;const keep=host.scrollTop;if(ui.make)ui.id=ui.make.step===0?(ui.make.model?'model:'+ui.make.model:'make:'):(ui.make.id||'make:');if(ui.preview&&ui.previewFor!==ui.id){ui.preview.dispose();ui.preview=null;ui.previewFor=null;}
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
  if(ui.make){makeView(main,pv);}else{const all=entries();const e=all.find(x=>x.id===ui.id)||all.find(x=>x.group==='move')||all[0];if(e){ui.id=e.id;detail(main,e,pv);}}
  host.scrollTop=keep;setTimeout(guideNow,0);}
 /* "What do you want to do?" (the owner: make it for someone who has never done it): big choices that open the right screen. */
 function startCard(){const d=el('details','','npc-start',{'data-npc-start':'1'});d.open=ui.start;d.ontoggle=()=>{ui.start=d.open;};d.append(el('summary','What do you want to do?'));const grid=el('div','','npc-cards');
  const pick=(id,fn)=>()=>{ui.id=id;ui.start=false;status='';if(fn)fn();draw();setTimeout(()=>{const t=host.querySelector(fn&&fn.focus||'[data-npc-facts]');t&&t.scrollIntoView({block:'start'});},50);};
  const first=x=>entries().find(e=>e.group===x)||{};const rev='grey-reverie';
  const card=(icon,title,text,go,attrs)=>{const b=btn('',go,'npc-card',attrs);b.append(el('span',icon,'npc-card-icon',{'aria-hidden':'true'}),el('b',title),el('span',text,'me-small'));grid.append(b);};
  const stay=()=>{if(!plan(rev)||plan(rev).mode!=='stay')setPlan(rev,{...(plan(rev)&&plan(rev).anims?{anims:plan(rev).anims}:{}),mode:'stay',x:100,z:-6.4,yaw:Math.PI,actions:stayDefault(rev)});};stay.focus='[data-npc-place]';
  const route=()=>{if(!plan(rev)||plan(rev).mode!=='path')setPlan(rev,{...(plan(rev)&&plan(rev).anims?{anims:plan(rev).anims}:{}),mode:'path',points:[]});root.VoidEditorGuide?.focusNext();};route.focus='[data-npc-place]';
  const look=()=>{};look.focus='[data-npc-preview]';const lines=()=>{};lines.focus='[data-npc-lines]';const giv=()=>{};giv.focus='[data-npc-giver]';
  card('📍','Move a character to a spot','Pick where Reverie (or Lace) stands and what she does there.',pick(rev,stay),{'data-npc-start-card':'stay'});
  card('🚶','Make a character walk a route','Click points on the street; she walks them in order.',pick(rev,route),{'data-npc-start-card':'route'});
  const beh=()=>{};beh.focus='[data-npc-behaviour]';const sched=()=>{};sched.focus='[data-npc-schedule]';
  card('🕒','Give a character a daily schedule','Different things at different hours of the in-game day (a walk in the morning, a seat at lunch …).',pick(rev,sched),{'data-npc-start-card':'schedule'});
  card('🤖','Describe it to ChatGPT','Copy a ready-made prompt, say what you want in words, paste ChatGPT’s answer back: the editor checks it and shows it on the map.',pick(rev,beh),{'data-npc-start-card':'chatgpt'});
  card('💬','Give a character a mission','Choose who hands it out; the Mission Editor opens with it ready to fill in.',pick((first('givers').id)||'admin',giv),{'data-npc-start-card':'giver'});
  card('👀','Look at a character in 3D','Turn them around and play their animations.',pick(ui.id||rev,look),{'data-npc-start-card':'look'});
  card('📝','See what a character says','Every line, in missions and outside them, and their voice (choose an ElevenLabs voice there).',pick(ui.id||'admin',lines),{'data-npc-start-card':'lines'});
  card('🧑','Create a mission giver','A new character, step by step: model, name, look, device, ship, items, voice, animations and a place in the world.',()=>{startMake();draw();},{'data-npc-start-card':'make'});
  card('📦','Bring in a new 3D model','Load a model file from your computer and try it on the street (only you see it).',()=>{ui.start=false;importPick();},{'data-npc-start-card':'import'});
  d.append(grid);return d;}
 function listInto(list){list.replaceChildren();const q=ui.search.trim().toLowerCase(),all=entries().filter(x=>!q||x.name.toLowerCase().includes(q)||x.id.toLowerCase().includes(q));
  for(const [g,name] of GROUPS){const xs=all.filter(x=>x.group===g);if(!xs.length)continue;const d=el('details','','npc-group',{'data-npc-group':g});d.open=g!=='crowd'&&g!=='earlier'||!!q||xs.some(x=>x.id===ui.id);d.append(el('summary',name+' ('+xs.length+')','me-group'));
   for(const x of xs){const plan_=x.kind==='roster'&&plan(x.id),vb=x.kind==='roster'&&S().voiceNow&&root.VoidNPCVoices?root.VoidNPCVoices.summary(S().voiceNow(x.id)):null,b=btn(x.name+(plan_?' ✎':''),()=>{ui.id=x.id;ui.start=false;status='';draw();},'me-mission'+(ui.id===x.id?' on':''),{'data-npc':x.id,...(advanced()?{title:x.id}:{})});if(vb&&vb.badge==='EL')b.append(el('span','EL','npc-vbadge',{'data-npc-voice-badge':x.id,title:'ElevenLabs voice: '+vb.name+' ('+vb.modelLabel+')'}));d.append(b);}list.append(d);}
  if(!all.length)list.append(el('p','Nobody has that name. Try fewer letters, or clear the box to see everyone.','me-small'));}
 // ---------------------------------------------------------------- one NPC
 function detail(main,e,pv){
  main.append(el('h3',e.name));if(advanced())main.append(el('p','id '+e.id,'me-small',{'data-npc-id':e.id}));if(e.kind==='import')main.append(el('p','LOCAL TEST ONLY: not in the live game','me-warn'));
  if(e.kind==='import')return importDetail(main,e.rec,pv);
  const g=e.giver,asset=e.look,clips=clipsOf(asset);
  const facts=el('section','','me-check',{'data-npc-facts':e.id});facts.append(el('h4','About'));
  const row=(k,v,h)=>{const p=el('p');p.append(el('b',k+': '),document.createTextNode(v||'—'));facts.append(p);if(h)facts.append(hint(h));};
  row('Look (model)',asset?asset+(clips.length?' · '+clips.length+' clips':''):'no crowd model (drawn by its own scene code)',HELP.look);
  {const trees=(root.VoidLiveContent&&root.VoidLiveContent.env&&root.VoidLiveContent.env.trees&&root.VoidLiveContent.env.trees.length?root.VoidLiveContent.env.trees:(root.VoidMainStory?root.VoidMainStory.trees():[])),uses=[];for(const t of trees)for(const m of t.missions||[])for(const c of m.cast||[])if(c&&(c.id===e.id||(c.name&&c.name===e.name)))uses.push((m.title||m.id)+': '+(root.VoidPlaces?.node?.(c.place)?.name||c.place)+(c.from?' from step '+c.from:'')+(c.until?' until '+c.until:'')+(c.route?' (walks a route)':''));if(uses.length)row('Placed by missions',uses.join(' · ')+'. Change where they stand, what they do, their route and when they appear under the mission’s “People for this mission” (Mission Editor).',null);}   // placed by a mission (mission-mechanics.js cast, 20 Nov 2026)
  if(e.kind==='crowd'){row('Where','The street picks figures from this pool (crowd.js, ncz-nightlife.js).',HELP.crowd);}
  else{const live=root.VoidStreetPair?.live?.(),lh=live&&live.her&&live.her.id===e.id?' · in this game now at x '+live.her.x.toFixed(1)+', z '+live.her.z.toFixed(1)+' ('+(live.her.mode||'')+')':'';row('Where',(g.where||'')+lh,HELP.where);
   const reg=S().src?.registry?.npcs?.[e.id];if(S().voiceSummary){facts.append(S().voiceSummary(e.id));if(reg)facts.append(el('p','Recorded lines: Kokoro '+reg.voice+' · '+reg.status+' (locked)','me-small'));facts.append(hint(HELP.voice));}else row('Voice',reg?reg.voice+' (Kokoro, locked)':'—',HELP.voice);
   row('Missions',g.canTalk?(g.players?'In-person or device-started missions; players can reach them today.':'In-person or device-started missions in a draft; players cannot reach them today.'):'Device-started missions (Messages / Comms / notification) are supported. In-person offers still need a TALK prompt: '+(g.why||'none exists')+'.');
   if(g.shift)facts.append(el('p',S().G().shiftText(g),'me-small me-warn'));}
  main.append(facts);
  previewBox(main,e,asset,clips,pv);
  if(e.made){madeBox(main,e);charLookBox(main,e,asset);}else if(e.kind!=='import')appearanceBox(main,e,asset);
  if(e.kind==='roster'){if(g?.canTalk){interactionBox(main,e);
   main.append(btn('Vendor settings',()=>{const tools=DTX();tools.catalogNpc={id:e.id,name:g.say||e.name||e.id};tools.open('items');}));
  }giverBox(main,e);placeBox(main,e,clips);if(X().MOVABLE[e.id]){scheduleBox(main,e);behaviourBox(main,e);}if(!(X().MOVABLE[e.id]||{}).cat)animBox(main,e,asset);requestBox(main,e,asset);linesBox(main,e);}
  else if(e.kind==='crowd')animBox(main,e,asset);
  else requestBox(main,e,asset);}
 function interactionBox(main,e){const box=el('section','','me-check',{'data-npc-interactions':e.id}),r=S().local().interactions?.[e.id]||{};box.append(el('h4','Conversations & Interactions'),hint('Ordinary dialogue, not a mission. Up to 100 alternatives per dialogue box, 500 characters per line. Mission dialogue takes priority. Save to your draft and use PLAY THIS DRAFT to test.'));
  const field=(label,key,max,area=true)=>{const w=el('label','','me-field'),i=el(area?'textarea':'input','','',{'aria-label':label,maxlength:String(max)});i.value=r[key]||'';w.append(el('span',label),i);box.append(w);return i;};
  const near=field('Approach greetings (one alternative per line)','near',50100),talk=field('TALK dialogue (one alternative per line)','talk',50100),choice=field('Optional player response button','choice',60,false),reply=field('NPC replies (one alternative per line)','reply',50100);
  const number=(label,key,min,max,def,step)=>{const w=el('label','','me-field'),i=el('input','','',{type:'number',min:String(min),max:String(max),step:String(step),'aria-label':label});i.value=String(r[key]??def);w.append(el('span',label),i);box.append(w);return i;};
  const distance=number('Greeting distance (metres)','distance',1,8,3,.5),cooldown=number('Greeting cooldown (seconds, after leaving range)','cooldown',5,600,60,1),note=el('p','','me-small'),roomRead=advancedRoomBox(box,r),socialRead=advancedSocialBox(box,r);box.append(btn('SAVE INTERACTION',()=>{const v={distance:Number(distance.value),cooldown:Number(cooldown.value)};for(const [k,i] of Object.entries({near,talk,choice,reply}))if(i.value.trim())v[k]=i.value.trim();const room=roomRead(),social=socialRead(),advanced={};if(room)advanced.room=room;if(social.follow)advanced.follow=social.follow;if(social.group)advanced.group=social.group;if(Object.keys(advanced).length)v.advanced=advanced;const leadOk=!advanced.follow||advanced.follow.role!=='lead'||leadSpotOk(e.id,advanced.follow);if(!v.near&&!v.talk&&!v.advanced||!leadOk||!!v.choice!==!!v.reply||v.choice&&!v.talk||!distance.checkValidity()||!cooldown.checkValidity()||S().MC().interactionProblems({[e.id]:v},null,new Set(root.VoidPlaces?.IDS||[])).length||Object.values(v).some(x=>typeof x==='string'&&/<[^>]*>|[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(x))){note.textContent=leadOk?'Enter a greeting, TALK line, room, follow or group setting; a response button requires both a TALK line and reply. Use valid distances and cooldowns, at most 100 alternatives per box and 500 characters per line.':'That destination is not somewhere this NPC can walk. Pick a place on walkable ground.';return;}const d=S().local(),old=d.interactions?.[e.id];const kept=(old?.clips||[]).filter(c=>S().MC().interactionRows(e.id,v).some(x=>x.text===c.text));if(kept.length)v.clips=kept;d.interactions={...(d.interactions||{}),[e.id]:v};S().saveLocal(d);note.textContent='Saved to your draft. No mission created.';draw();}),btn('REMOVE INTERACTION',()=>{if(!confirm('Remove the ordinary dialogue for '+e.name+'?'))return;const d=S().local();if(d.interactions)delete d.interactions[e.id];S().saveLocal(d);draw();}),note);const home=X().homeOf?.(e.id),p=plan(e.id),at=p?.mode==='stay'?p:p?.mode==='path'?p.points?.[0]:home;if(at)box.append(btn('TEST NEAR THIS NPC',()=>S().jumpTo(at.x,at.z,e.id,e.name+' interaction',RETURN)));box.append(btn('PUBLISH ONLY THIS INTERACTION',async()=>{const value=S().local().interactions?.[e.id]||null;if(!confirm(value?'Publish only the saved ordinary interaction for '+e.name+'? No missions will be changed.':'Remove the published ordinary interaction for '+e.name+'? No missions will be changed.'))return;try{await S().publishInteraction(e.id,value);note.textContent='Published this interaction only.';}catch(x){note.textContent='Not published: '+x.message;}}));box.append(interactionAudio(e,r));main.append(box);}
 function leadSpotOk(id,follow){const t=root.VoidPlaces?.target?.(follow?.place);if(!t)return false;const A=root.VoidNPCAreas,M=root.VoidNPCPaths?.MOVABLE?.[id],raw={x:t[0],z:t[2]};return !!A?.nearest?.(raw,A.areaOf(raw),8,{adult:!!M?.adult,made:!!M?.made});}
 function advancedSocialBox(box,r){const d=el('details','','me-check',{'data-npc-advanced-social':'1'}),oldF=r.advanced?.follow||{},oldG=r.advanced?.group||{},P=root.VoidPlaces;d.open=!!(oldF.role||oldG.id);d.append(el('summary','Advanced · follow, lead and groups'),hint('Optional. They follow you, or lead you to a place, using the existing walk and obstacle routing. Mission escort and mission dialogue take priority and send them back. A linked group speaks one at a time. Each player keeps their own copy; other players are not moved.'));const role=el('select','','',{'aria-label':'Follow or lead'});for(const [id,name] of [['','Disabled'],['follow','They follow you'],['lead','They lead you to a place']]){const o=el('option',name);o.value=id;role.append(o);}role.value=oldF.role||'';const roleLab=el('label','','me-field');roleLab.append(el('span','Follow or lead'),role);d.append(roleLab);const place=el('select','','',{'aria-label':'Lead destination'});const put=(id,name)=>{const o=el('option',name);o.value=id;place.append(o);};put('','Choose a place');for(const o of P?.options?.()||[]){const n=P.node(o.id);if(o.id==='district-pods'||!o.selectable||!n?.rects?.length||!['place','venue','area'].includes(o.level))continue;put(o.id,o.label);}if(oldF.place&&![...place.options].some(o=>o.value===oldF.place))put(oldF.place,P?.label?.(oldF.place)||oldF.place);place.value=oldF.place||'';const placeLab=el('label','','me-field');placeLab.append(el('span','Destination, required when they lead'),place);d.append(placeLab);const text=(label,value,area=true,max=area?50100:60)=>{const w=el('label','','me-field'),i=el(area?'textarea':'input','','',{'aria-label':label,maxlength:String(max)});i.value=value||'';w.append(el('span',label),i);d.append(w);return i;};const invite=text('Invitation',oldF.invite),accept=text('Accept button',oldF.accept,false),decline=text('Decline button',oldF.decline,false),arrive=text('Arrival line',oldF.arrive),cancel=text('Cancel line',oldF.cancel),wait=el('input','','',{type:'number',min:'5',max:'120',step:'1','aria-label':'Invitation wait'});wait.value=String(oldF.maxWait??30);const waitLab=el('label','','me-field');waitLab.append(el('span','Invitation wait (seconds)'),wait);d.append(waitLab);d.append(el('h5','Linked group'));const gid=text('Group id, the same on every member',oldG.id,false,80),order=el('select','','',{'aria-label':'Group speaking order'});for(const [id,name] of [['alternate','Take turns'],['authored','Authored order']]){const o=el('option',name);o.value=id;order.append(o);}order.value=oldG.order==='authored'?'authored':'alternate';const orderLab=el('label','','me-field');orderLab.append(el('span','Speaking order'),order);d.append(orderLab);const members=text('Members, including this NPC, one id per line',(oldG.members||[]).join('\n')),lines=text('This NPC’s lines in the group',oldG.lines),cool=el('input','','',{type:'number',min:'5',max:'600',step:'1','aria-label':'Group cooldown'});cool.value=String(oldG.cooldown??20);const coolLab=el('label','','me-field');coolLab.append(el('span','Group cooldown (seconds)'),cool);d.append(coolLab);box.append(d);return ()=>{const out={};if(role.value){const follow={role:role.value,invite:invite.value.trim(),accept:accept.value.trim(),decline:decline.value.trim(),maxWait:Number(wait.value)};if(place.value)follow.place=place.value;if(arrive.value.trim())follow.arrive=arrive.value.trim();if(cancel.value.trim())follow.cancel=cancel.value.trim();out.follow=follow;}const ids=members.value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);if(gid.value.trim()||ids.length||lines.value.trim())out.group={id:gid.value.trim(),members:ids,order:order.value,cooldown:Number(cool.value),lines:lines.value.trim()};return out;};}
 function advancedRoomBox(box,r){const d=el('details','','me-check',{'data-npc-advanced-room':'1'}),old=r.advanced?.room||{},P=root.VoidPlaces;d.open=!!r.advanced;d.append(el('summary','Advanced · room dialogue'),hint('Optional: dialogue when the player enters or leaves a named room. Visit timing is measured per player; timed departure dialogue overrides the general departure line. Use a room with the NPC actually present.'));const lab=el('label','','me-field'),sel=el('select','','',{'aria-label':'Room trigger location'});const put=(id,name)=>{const o=el('option',name);o.value=id;sel.append(o);};put('','Disabled');for(const o of P?.options?.()||[]){const n=P.node(o.id);if(o.selectable&&(!o.proposed||root.VoidUnderground?.placeById?.(o.id))&&n?.scene&&(n.rects?.length||n.whole)&&['place','venue'].includes(o.level))put(o.id,o.label);}if(old.id&&!Array.from(sel.options).some(o=>o.value===old.id))put(old.id,P?.label?.(old.id)||old.id);sel.value=old.id||'';lab.append(el('span','Room'),sel);d.append(lab);const fields={};for(const [key,label] of [['enter','Entering the room'],['exit','Leaving the room'],['shortVisit','Leaving after a short visit'],['longVisit','Leaving after a long visit']]){const w=el('label','','me-field'),i=el('textarea','','',{'aria-label':label,maxlength:'50100'});i.value=old[key]||'';w.append(el('span',label),i);d.append(w);fields[key]=i;}const numeric=(label,key,def)=>{const w=el('label','','me-field'),i=el('input','','',{type:'number',min:'5',max:'600',step:'1','aria-label':label});i.value=String(old[key]??def);w.append(el('span',label),i);d.append(w);return i;};const cooldown=numeric('Room trigger cooldown (seconds)','cooldown',60),long=numeric('Long visit threshold (seconds)','longSeconds',30);box.append(d);return ()=>{if(!sel.value)return null;const out={id:sel.value,cooldown:Number(cooldown.value)};for(const [key,i] of Object.entries(fields))if(i.value.trim())out[key]=i.value.trim();if(out.shortVisit||out.longVisit)out.longSeconds=Number(long.value);return out;};}
 function interactionAudio(e,r){const box=el('section','','me-check'),I=root.VoidVoiceImports,rows=S().MC().interactionRows(e.id,r),note=el('p','','me-small');box.append(el('h5','Interaction audio — Eleven v4'),hint('Save dialogue first. Generate or import recordings for these exact lines; tags affect audio only. Publishing this interaction includes its recordings.'));if(!I||!rows.length)return box;
  const voice=S().voiceNow(e.id),tags=new Map(),controls=new Map(),current=()=>S().local().interactions?.[e.id],match=row=>S().MC().interactionRows(e.id,current()).some(x=>x.text===row.text),rec=row=>(current()?.clips||[]).find(c=>c.text===row.text);
  let busy=false;const status=()=>{for(const row of rows)controls.get(row.text).textContent=rec(row)?'Recorded':'No audio';};const store=async(row,file)=>{if(!match(row))throw Error('Dialogue changed. Save and reopen the NPC.');const p=await I.prepare(file,t=>note.textContent=t);if(!p.ok)throw Error(p.why);if(!await I.store(p.hash,p.type,p.data,p.duration))throw Error('Audio storage is unavailable.');const d=S().local(),v=d.interactions?.[e.id];if(!match(row))throw Error('Dialogue changed.');const c={who:e.id,text:row.text,hash:p.hash,type:p.type,duration:p.duration,bytes:p.bytes};d.interactions[e.id]={...v,clips:[...(v.clips||[]).filter(x=>x.text!==row.text),c]};S().saveLocal(d);status();};
  const run=async(work,fn)=>{if(busy)return;busy=true;let n=0;try{for(const row of work){await fn(row);note.textContent=++n+' of '+work.length+' recordings saved.';}}catch(err){note.textContent=n+' saved. Stopped: '+err.message;}finally{busy=false;}};
  const bulk=el('input','','',{type:'file',multiple:'',accept:'audio/*,.mp3,.wav,.ogg',hidden:''});bulk.onchange=()=>{const files=[...bulk.files],map=new Map();bulk.value='';for(const f of files){const stem=f.name.replace(/\.[^.]+$/,'');const row=rows.find(x=>x.file===stem);if(!row||map.has(row.text)){note.textContent='Unmatched or duplicate filename: '+f.name+'. Use the downloaded filename list.';return;}map.set(row.text,f);}run(rows.filter(x=>map.has(x.text)&&!rec(x)),row=>store(row,map.get(row.text)));};
  const generate=work=>{if(voice.kind!=='elevenlabs'||!voice.voiceId){note.textContent='Choose an ElevenLabs voice in Lines & voice first.';return;}if(busy)return;const dev=DTX();if(typeof dev?.request!=='function'){note.textContent='Sign in again to generate audio.';return;}const jobs=work.map(row=>{const t=tags.get(row.text).value.trim();return {row,spoken:(t?(t.startsWith('[')?t:'['+t+']')+' ':'')+row.text};});if(!jobs.length){note.textContent='All selected lines already have audio.';return;}if(jobs.some(j=>j.spoken.length>700||root.VoidNPCVoices?.tagProblems(j.spoken).length)){note.textContent='Use valid lowercase delivery tags and keep tagged lines below 700 characters.';return;}if(!confirm('Generate '+jobs.length+' recordings using '+voice.name+' and Eleven v4 ('+jobs.reduce((n,j)=>n+j.spoken.length,0)+' input characters)? ElevenLabs credits will be used. Existing selected recordings will be replaced.'))return;run(jobs,async({row,spoken})=>{if(!match(row))throw Error('Dialogue changed.');const response=await dev.request('developer/companion-voice',{voiceId:voice.voiceId,text:spoken});const bytes=Uint8Array.from(atob(response.audio),c=>c.charCodeAt(0));await store(row,new File([bytes],row.file+'.mp3',{type:'audio/mpeg'}));});};
  box.append(el('p',voice.kind==='elevenlabs'?'Voice: '+voice.name+' · Eleven v4':'Choose an ElevenLabs voice in Lines & voice to generate audio.'),btn('DOWNLOAD AUDIO FILENAME LIST',()=>download(e.id+'-interaction-audio.txt',new Blob([rows.map(x=>x.file+'.mp3 — '+x.text).join('\n')],{type:'text/plain'}))),btn('BULK IMPORT AUDIO',()=>bulk.click()),bulk,btn('GENERATE MISSING AUDIO — ELEVEN V4',()=>generate(rows.filter(x=>!rec(x)))),btn('REGENERATE ALL AUDIO — ELEVEN V4',()=>generate(rows)),note);
  for(const row of rows){const item=el('details'),tag=el('input','','',{placeholder:'[warmly], [whispers]','aria-label':'Delivery tags'}),state=el('span','','me-small'),file=el('input','','',{type:'file',accept:'audio/*,.mp3,.wav,.ogg',hidden:''});tags.set(row.text,tag);controls.set(row.text,state);file.onchange=()=>{const f=file.files[0];file.value='';if(f)run([row],x=>store(x,f));};item.append(el('summary',row.pool+' · '+row.text),state,tag,btn('GENERATE THIS LINE',()=>generate([row])),btn('IMPORT / REPLACE AUDIO',()=>file.click()),file,btn('PLAY AUDIO',async()=>{try{const c=rec(row);if(!c)throw Error('No recording yet.');const data=await I.getData(c.hash);const url=URL.createObjectURL(new Blob([data],{type:c.type})),a=new Audio(url);a.onended=()=>URL.revokeObjectURL(url);await a.play();}catch(x){note.textContent=x.message;}}),btn('REMOVE AUDIO',()=>{if(busy)return;const d=S().local(),v=d.interactions?.[e.id];if(!v)return;d.interactions[e.id]={...v,clips:(v.clips||[]).filter(c=>c.text!==row.text)};S().saveLocal(d);status();}));box.append(item);}status();return box;
 }
 // ---- the 3D preview
 function previewBox(main,e,asset,clips,pv,file){const box=el('section','','me-check',{'data-npc-preview':e.id});box.append(el('h4','Preview'),hint(HELP.preview));
  const stage=pv||el('div','','npc-preview');box.append(stage);
  const cl=el('div','','me-row',{'data-npc-clips':e.id});box.append(cl,hint(HELP.clips));
  const note=el('p',ui.previewNote||'','me-small',{'data-npc-preview-note':'1'});box.append(note);
  const fill=names=>{cl.replaceChildren();cl.append(el('b',names.length+' animation clips available in this preview','me-small',{'data-npc-clip-count':String(names.length)}));for(const c of names){const button=btn(c.replace(/\.\d{3}$/,''),()=>{ui.preview?.play(c);for(const b of cl.querySelectorAll('[data-npc-clip]'))b.classList.toggle('on',b===button);},ui.preview?.current===c?'on':'',{'data-npc-clip':c});cl.append(button);}};
  if(ui.preview&&ui.previewFor===e.id){fill(ui.preview.clips);}
  else{const go=btn('Show me in 3D',async()=>{go.disabled=true;note.textContent='Loading the model…';try{ui.preview?.dispose();ui.preview=root.VoidNPCPreview.mount(stage);ui.previewFor=e.id;
    const info=await ui.preview.show(file?{file,buffer:file.buffer}:{asset});ui.previewNote=info?'Loaded: '+info.triangles.toLocaleString('en')+' triangles · '+ui.preview.clips.length+' clips in the file.':'';note.textContent=ui.previewNote;fill(ui.preview.clips);go.remove();if(file&&e.onInfo)e.onInfo(info);host.querySelector('[data-npc-appearance]')?.refill?.();}
    catch(err){note.textContent='No preview: '+(/HTTP 404|unavailable/.test(String(err&&err.message))?'this model file is not in the public files here (a licensed model is published with the live site only; the game still shows it there).':err.message);go.disabled=false;}},'',{'data-npc-preview-go':e.id});
   if(asset||file)cl.append(go);else note.textContent='No model file to preview (this person is drawn by their scene’s own code).';
   if(clips.length&&!file)box.append(el('p','Clips in their file (crowd.js): '+clips.join(', '),'me-small'));}
  main.append(box);}
 // ---- APPEARANCE (queue item 0c, approved 18 Nov 2026): looks per model file, from what the loaded file supports (npc-looks.js). Saved in the DRAFT (content.looks).
 const NL=()=>root.VoidNPCLooks,caps={};
 const entryOf=asset=>(S().local().looks||{})[asset]||null;
 function setEntry(asset,en,say){const d=S().local();d.looks=d.looks||{};if(en&&(en.looks.length||(en.use&&en.use!=='original')))d.looks[asset]=en;else delete d.looks[asset];S().saveLocal(d);if(say)status=say;draw();}
 const editing=asset=>{const en=entryOf(asset),id=ui.look&&ui.look[asset];return en&&en.looks.find(l=>l.id===id)||null;};
 function editLook(asset,fn,say){const en=JSON.parse(JSON.stringify(entryOf(asset)||{looks:[],use:'original'})),l=en.looks.find(x=>x.id===(ui.look||{})[asset]);if(!l)return;fn(l,en);
  for(const k of ['hide','gear'])if(l[k]&&!l[k].length)delete l[k];if(l.colour&&!Object.keys(l.colour).length)delete l.colour;if(!l.hair)delete l.hair;setEntry(asset,en,say);}
 async function capsOf(asset){if(caps[asset])return caps[asset];const c=ui.preview&&ui.preview.container;if(!c)return null;let data={};try{data=await NL().loadData();}catch{}return caps[asset]=NL().capabilities(asset,NL().metaFromContainer(c),data);}
 function appearanceBox(main,e,asset){const box=el('section','','me-check',{'data-npc-appearance':e.id});box.append(el('h4','Appearance'),hint(HELP.looks));main.append(box);
  if(!asset||!NL()){box.append(el('p','No model file to change: this person is drawn by their scene’s own code.','me-small'));return;}
  if(NL().LICENSED.test(asset))box.append(el('p','A licensed model: you can recolour it and hide its accessories; nothing is added to it, and its file is never sent to any AI tool.','me-small me-warn'));
  if(NL().STREET.includes(asset))box.append(el('p','Reverie and Lace stay in ordinary street clothing: you can change their colours only.','me-small me-warn'));
  const users=entries().filter(x=>x.look===asset&&x.id!==e.id).map(x=>x.name);box.append(el('p','A look belongs to the model “'+asset+'”'+(users.length?': '+users.slice(0,4).join(', ')+(users.length>4?' and others':'')+' use it too.':'.'),'me-small'));
  const body=el('div','','',{'data-npc-look-body':asset});box.append(body);
  {const sr=el('div','','me-row');sr.append(btn('SEE IT ON THE STREET',()=>S().jumpTo(100,-8,e.id,'your NPC looks',RETURN),'',{'data-npc-look-street':asset,title:'A throwaway test session on The Avenue with your draft applied. Your real save is never touched; LEAVE brings you back.'}),hint('Plays your draft on The Avenue (your real save is never touched; LEAVE brings you back).'));box.append(sr);}
  box.refill=async()=>{body.replaceChildren();if(!(ui.preview&&ui.previewFor===e.id&&ui.preview.container)){body.append(btn('Show me in 3D to change the look',()=>{const g=host.querySelector('[data-npc-preview-go]');if(g){g.click();g.scrollIntoView({block:'center'});}},'',{'data-npc-look-start':asset}));return;}
   body.append(el('p','Reading what this model supports…','me-small'));const c=await capsOf(asset);body.replaceChildren();if(!c){body.append(el('p','The model could not be read.','me-bad'));return;}lookUI(body,e,asset,c);};
  box.refill();}
 function lookUI(body,e,asset,c){const en=entryOf(asset)||{looks:[],use:'original'},cur=editing(asset),L=NL(),adv=advanced();ui.preview?.look(asset,cur);
  // which look
  const r=el('div','','me-row');const sel=el('select','','',{'aria-label':'Which look','data-npc-look-pick':asset});sel.append(new Option('As made (the model file)',''));for(const l of en.looks)sel.append(new Option(l.name,l.id));sel.value=cur?cur.id:'';
  sel.onchange=()=>{ui.look=ui.look||{};ui.look[asset]=sel.value||null;status='';draw();};r.append(el('b','Look: '),sel);
  r.append(btn('+ NEW LOOK',()=>{if(en.looks.length>=L.LIMIT.looks){status='A model can have '+L.LIMIT.looks+' looks at most: delete one first.';draw();return;}const n=JSON.parse(JSON.stringify(en));let i=n.looks.length+1;while(n.looks.some(l=>l.id==='look-'+i))i++;n.looks.push({id:'look-'+i,name:'Look '+i});ui.look=ui.look||{};ui.look[asset]='look-'+i;setEntry(asset,n,'New look “Look '+i+'” started from the model as made. Change it below; it is saved in your draft.');},'',{'data-npc-look-new':asset}));
  if(cur){r.append(btn('RESET TO ORIGINAL',()=>editLook(asset,l=>{delete l.hide;delete l.colour;delete l.gear;delete l.hair;},'“'+cur.name+'” is back to the model as made (UNDO brings your changes back).'),'',{'data-npc-look-reset':asset}),
   btn('DELETE THIS LOOK',()=>{const n=JSON.parse(JSON.stringify(en));n.looks=n.looks.filter(l=>l.id!==cur.id);if(n.use===cur.id||(n.use==='mix'&&!n.looks.length))n.use='original';ui.look[asset]=null;setEntry(asset,n,'Look “'+cur.name+'” deleted (UNDO brings it back).');},'',{'data-npc-look-delete':asset}));}
  body.append(r,hint(HELP.lookPick));
  if(!cur){body.append(el('p',en.looks.length?'Pick one of your looks above to change it, or start a new one.':'Press + NEW LOOK to start. The model as made never changes.','me-small'));}
  else{const nm=el('input','','',{'aria-label':'Name of the look','data-npc-look-name':asset,maxlength:String(L.LIMIT.name)});nm.value=cur.name;nm.onchange=()=>{const v=nm.value.trim();if(!v||/[<>]/.test(v)){nm.value=cur.name;return;}editLook(asset,l=>{l.name=v;},'Renamed to “'+v+'”.');};
   const nr=el('div','','me-row');nr.append(el('span','Name','me-small'),nm);body.append(nr);
   lookSections(body,asset,c,cur,(fn,say)=>editLook(asset,fn,say));}
  // (d) who wears it
  const wr=el('div','','npc-look-sec',{'data-npc-look-wear':asset});wr.append(el('b','Which look the game uses'),hint(HELP.wear));
  const opt=(v,text,dis)=>{const lab=el('label','','me-check-row'),rb=el('input','','',{type:'radio',name:'npc-look-use-'+asset,value:v,'data-npc-look-use':v});rb.checked=(en.use||'original')===v;rb.disabled=!!dis;rb.onchange=()=>{const n=JSON.parse(JSON.stringify(en));n.use=v;setEntry(asset,n,v==='original'?'The game shows the model as made.':v==='mix'?'Everyone with this model wears one of your looks (each person keeps theirs).':'Everyone with this model wears “'+(en.looks.find(l=>l.id===v)||{}).name+'”.');};lab.append(rb,document.createTextNode(' '+text));wr.append(lab);};
  opt('original','As made (no look)');for(const l of en.looks)opt(l.id,'Everyone wears “'+l.name+'”');opt('mix','A mix of my looks (each person keeps one)',en.looks.length<1);
  {const probs=L.problems({[asset]:en});if(probs.length)wr.append(el('p','Problems: '+probs.join(' '),'me-bad'));}
  wr.append(el('p','SEE IT ON THE STREET (or PLAY THIS DRAFT) shows it in the game; PUBLISH (Mission Editor › Publish & versions) sends it to every player. The model file never changes.','me-small'));body.append(wr);}

 /* The parts, colours and creator pieces of one look (shared by a model's looks and a made character's own look). edit(fn(look), say) saves the change. */
 function lookSections(body,asset,c,cur,edit){const L=NL(),adv=advanced();
   // (a) parts
   const pa=el('div','','npc-look-sec',{'data-npc-look-parts':asset});pa.append(el('b','Parts you can take off'),hint(HELP.parts));const hid=new Set(cur.hide||[]),open=c.groups.filter(g=>g.hideable),locked=c.groups.filter(g=>!g.hideable);
   if(!open.length)pa.append(el('p',c.street?'Reverie and Lace keep every part.':'Nothing to take off: this model is made in one piece (or its pieces are all clothing, body or face, which always stay).','me-small'));
   for(const g of open){const lab=el('label','','me-check-row'),cb=el('input','','',{type:'checkbox','data-npc-look-part':g.id});cb.checked=!g.names.every(n=>hid.has(n));cb.onchange=()=>edit(l=>{const h=new Set(l.hide||[]);for(const n of g.names)cb.checked?h.delete(n):h.add(n);l.hide=[...h];if(l.hair&&!L.HAIR[l.hair].hatOk&&c.hair.hats.some(x=>!h.has(x)))delete l.hair;},(cb.checked?'Showing ':'Hiding ')+g.label.toLowerCase()+'.');
    lab.append(cb,document.createTextNode(' Show: '+g.label+(adv?' ('+g.names.join(', ')+')':'')));pa.append(lab);}
   if(locked.length&&open.length)pa.append(adv?el('p','Always stay: '+locked.map(g=>g.label+' ('+g.why+')').join('; '),'me-small'):el('p','Clothing that covers the body, the body and the face always stay.','me-small'));body.append(pa);
   // (b) colour
   const co=el('div','','npc-look-sec',{'data-npc-look-colours':asset});co.append(el('b','Colours'),hint(HELP.colour));const cc=(root.VoidCharacterAppearance?.CATALOG?.clothingColors)||[];
   for(const t of c.colours){const now=(cur.colour||{})[t.key]||null,row=el('div','','me-row',{'data-npc-look-colour':t.key});row.append(el('span',t.label+(adv&&t.key!=='*'?' ('+t.key+')':''),'me-small'));
    const set=(v,say)=>edit(l=>{l.colour=l.colour||{};if(v)l.colour[t.key]=v;else delete l.colour[t.key];},say);
    for(const sw of cc){const b=btn('',()=>set({tint:sw.hex},t.label+': '+sw.label.toLowerCase()+'.'),'npc-swatch'+(now&&now.tint===sw.hex?' on':''),{title:sw.label,'aria-label':sw.label,'data-npc-look-swatch':sw.id,style:'background:'+sw.hex+';width:22px;height:22px;min-width:22px;padding:0;border-radius:50%'});row.append(b);}
    const pick=el('input','','npc-look-picker',{type:'color','aria-label':'Pick any colour for '+t.label,'data-npc-look-picker':t.key});pick.value=now&&now.tint||'#808080';pick.onchange=()=>set({...(now&&now.bright!=null?{bright:now.bright}:{}),tint:pick.value},t.label+': '+pick.value+'.');row.append(pick);
    if(now)row.append(btn('Reset colour',()=>set(null,t.label+': back to the model’s own colour.'),'',{'data-npc-look-colour-reset':t.key}));co.append(row);
    if(adv){const sl=(k,lab,min,max,step,def)=>{const s=el('input','','',{type:'range',min:String(min),max:String(max),step:String(step),'aria-label':lab+' for '+t.label,'data-npc-look-slider':k});s.value=String(now&&now[k]!=null?now[k]:def);s.onchange=()=>set({...(now||{}),[k]:Number(s.value)},t.label+': '+lab.toLowerCase()+' '+s.value+'.');const w=el('label','','me-small');w.append(document.createTextNode(lab+' '),s);return w;};
     const ar=el('div','','me-row');ar.append(sl('hue','Hue',-180,180,5,0),sl('sat','Saturation',0,2,.05,1),sl('bright','Brightness',.4,1.6,.05,1));co.append(ar);}}
   if(adv)co.append(hint(HELP.colourAdv));body.append(co);
   // (c) pieces
   const pc=el('div','','npc-look-sec',{'data-npc-look-pieces':asset});pc.append(el('b','Add pieces from the character creator'),hint(HELP.pieces));
   if(!c.gear.ok)pc.append(el('p','Not possible on this model: '+c.gear.why,'me-small me-warn',{'data-npc-look-pieces-locked':asset}));
   const gr=el('div','','me-row');for(const [id,g] of Object.entries(L.GEAR)){const lab=el('label','','me-check-row'+(c.gear.ok?'':' me-disabled')),cb=el('input','','',{type:'checkbox','data-npc-look-gear':id});cb.checked=(cur.gear||[]).includes(id);if(!c.gear.ok){cb.disabled=true;lab.title=c.gear.why;}
    cb.onchange=()=>edit(l=>{const s=new Set(l.gear||[]);cb.checked?s.add(id):s.delete(id);l.gear=[...s];},(cb.checked?'Added ':'Removed ')+g.label.toLowerCase()+'.');lab.append(cb,document.createTextNode(' '+g.label));gr.append(lab);}pc.append(gr);
   const hs=el('select','','',{'aria-label':'Hairstyle','data-npc-look-hair':asset});hs.append(new Option('Their own hair',''));const hat=c.hair.hats.some(h=>!(cur.hide||[]).includes(h));
   for(const [id,h] of Object.entries(L.HAIR)){const o=new Option(h.label+(hat&&!h.hatOk?' (hide the hat first)':''),id);o.disabled=hat&&!h.hatOk;hs.append(o);}hs.value=cur.hair||'';if(!c.hair.ok){hs.disabled=true;hs.title=c.hair.why;}
   hs.onchange=()=>edit(l=>{l.hair=hs.value||null;},hs.value?'Hairstyle: '+L.HAIR[hs.value].label.toLowerCase()+'.':'Their own hair again.');const hr=el('div','','me-row');hr.append(el('span','Hairstyle','me-small'),hs);pc.append(hr);body.append(pc);}
 // ---------------------------------------------------------------- CREATE A MISSION GIVER (the owner, 19 Nov 2026; npc-made.js): a new character, step by step
 /* The draft's content.characters[id]; where they stand is the ordinary placement (content.npcs[id]) of "Where they are in the game" below. Every change is one UNDO step. */
 const MD=()=>root.VoidMadeNPCs;
 /* A new stay's things to do: the ordinary standing routine, only what this character can do (a made character's model may lack some clips or a device). */
 function stayDefault(id){const ok=new Set(X().actionsFor(id,(plan(id)||{}).anims||[]).map(a=>a.id)),l=X().STAY_DEFAULT.filter(a=>ok.has(a));return l.length?l:['idle'].filter(a=>ok.has(a)).concat(ok.has('idle')?[]:['wait']);}
 const madeOf=id=>((S().local().characters)||{})[id]||null;
 function editMade(id,fn,say){const d=S().local();d.characters=d.characters||{};const c=JSON.parse(JSON.stringify(d.characters[id]||{}));fn(c);const x=MD().clean(c);if(x)d.characters[id]=x;S().saveLocal(d);if(say)status=say;draw();}
 const MAKE=[['model','Model'],['name','Name'],['look','Look'],['device','Device'],['ship','Ship'],['items','Items'],['voice','Voice'],['anims','Animations'],['place','Place'],['done','Done']];
 const MHELP={model:'Pick the 3D model your new character is made from: any person the game already has. Street people are the safest choice. A licensed model can only be recoloured and have accessories hidden (its licence), and it is never sent to any AI tool. Press “Show me in 3D” to look at it.',
  name:'Their name, in your own words (this is what players see). The short role line is optional and only for you and the editor (it is never said in the game). The internal id is made from the name.',
  adult:'Tick only for a grown-up character. Only characters marked adult (18+) may be placed in the adult places (Milked’s side street, service alley and reception, NULL, the District bar, the VR area, the arcade, the smoking terrace). Reverie’s and Lace’s models can never be marked adult.',
  look:'Change how this one character looks: hide accessories, recolour clothes, add creator pieces where the model allows. It changes only this character, never other people drawn with the same model.',
  device:'The device they carry and how they use it in the street: V1 (teal hologram), V2 (another colour), V3 // SHADOW (streamed into the eye: the left eye glows a little while they use it), or none.',
  ship:'A ship they own, for your missions (for example a mission that needs “their ship”). It is data only: no new ship appears in the world.',
  items:'What they carry. Tick “visible on them” where the game can show it cheaply (a holstered pistol on the hip, a small lit device in the hand); everything else is data for your missions.',
  voice:'Their voice for new lines: an ElevenLabs voice (link or ID and model), or none (their lines show as text). You can import a voice file for each line as usual.',
  anims:'Extra animations they can use at a spot or a route point, from the clips their model can play.',
  place:'Put them in the world for your mission: pick the area on the map, then keep them at one spot or make them walk a route (a daily schedule is in the NPC list later). Then choose when they are there.',
  when:'Always: they are in the world all the time. Or only while one of your missions is in progress (optionally from one of its steps), so they appear just for it.',
  done:'Your character is in your DRAFT now and already listed as a mission giver. Give them a mission, then PLAY THIS DRAFT to talk to them. Nothing reaches players until you PUBLISH.'};
 function startMake(){ui.make={step:0,id:null,model:null,name:'',role:'',adult:false,tried:false};ui.start=false;status='';ui.id='make:';}
 function makeView(main,pv){const m=ui.make,id=m.id,c=id?madeOf(id):null,stp=MAKE[m.step][0];
  const top=el('div','','me-row eh-wtop',{'data-npc-make':stp});top.append(el('b','Create a mission giver'),el('span','Step '+(m.step+1)+' of '+MAKE.length,'me-small'));
  const bar=el('div','','eh-progress',{role:'progressbar','aria-valuemin':'1','aria-valuemax':String(MAKE.length),'aria-valuenow':String(m.step+1),'aria-label':'Step '+(m.step+1)+' of '+MAKE.length});const fill=el('span');fill.style.width=Math.round((m.step+1)/MAKE.length*100)+'%';bar.append(fill);top.append(bar);
  top.append(btn('Close',()=>{const was=id;ui.make=null;ui.id=was||null;status=was?'Your character is saved in your draft; find them under “Made by you”.':'';draw();},'me-x',{'data-npc-make-close':'1'}));main.append(top);
  const chips=el('div','','me-row',{role:'group','aria-label':'Steps'});MAKE.forEach(([k,n],i)=>chips.append(btn((i+1)+'. '+n,()=>{if(!id&&i>1)return;m.step=i;m.tried=false;draw();},i===m.step?'on':'',{'data-npc-make-step':k,'aria-pressed':String(i===m.step),...(!id&&i>1?{disabled:'',title:'Give them a name first.'}:{})})));main.append(chips);
  const box=el('section','','me-check',{'data-npc-make-page':stp});box.append(el('h4',MAKE[m.step][1]),hint(MHELP[stp]));main.append(box);
  const e=id?entries().find(x=>x.id===id):null,asset=c?c.model:m.model,clips=clipsOf(asset);
  const needs=()=>{const out=[],cc=m.id?madeOf(m.id):null;if(stp==='model'&&!m.model)out.push('pick a model');if(stp==='name'&&!String(cc?cc.name:m.name).trim())out.push('type their name');if(stp==='place'&&m.id&&!plan(m.id))out.push('put them somewhere: “Keep her at one spot” or “Make her walk a route”');return out;};
  if(stp==='model'){pickModel(box,m.model,a=>{m.model=a;ui.id='model:'+a;if(id)editMade(id,x=>{x.model=a;if(!MD().adultAllowed(a))delete x.adult;},'Model: '+a+'.');else draw();setTimeout(()=>host.querySelector('[data-npc-preview-go]')?.click(),30);});
   if(m.model)previewBox(main,{id:ui.id},m.model,clips,pv);}
  else if(stp==='name')nameStep(box,m,c);
  else if(stp==='look'&&e)charLookBox(main,e,asset,true);
  else if(stp==='device')deviceStep(box,id);else if(stp==='ship')shipStep(box,id);else if(stp==='items')itemsStep(box,id);
  else if(stp==='voice'&&e)linesBox(main,e);
  else if(stp==='anims'&&e){previewBox(main,e,asset,clips,pv);animBox(main,e,asset);}
  else if(stp==='place'&&e){placeBox(main,e,clips);whenStep(main,id);}
  else if(stp==='done'&&e){const left=root.VoidMissionContent?.madeNeeds?.(S().local(),S().givers,id)||[];
   box.append(el('p',left.length?'Not finished yet: '+left.map(x=>x.replace(/^[^:]+: /,'')).join(' '):'Ready: '+c.name+' is a mission giver in your draft.',left.length?'me-warn':'me-ok',{'data-npc-make-ready':left.length?'0':'1'}));
   box.append(summary(c));giverBox(main,e);
   const r=el('div','','me-row me-actions');r.append(btn('SEE THEM IN THE NPC LIST',()=>{ui.make=null;ui.id=id;draw();},'',{'data-npc-make-finish':'1'}),btn('CREATE ANOTHER',()=>{startMake();draw();},'',{'data-npc-make-again':'1'}));main.append(r);}
  const need=needs();if(m.tried&&need.length)main.append(el('p','Before you go on: '+need.join('; ')+'.','me-bad',{role:'alert','data-npc-make-need':'1'}));
  const nav=el('div','','me-row eh-nav');nav.append(btn('BACK',()=>{if(m.step>0){m.step--;m.tried=false;}draw();},'',{'data-npc-make-back':'1',...(m.step?{}:{disabled:''})}));
  if(stp!=='done')nav.append(btn('NEXT',()=>{const nd=host.querySelector('[data-npc-make-name]');if(nd&&!m.id)m.name=nd.value;if(needs().length){m.tried=true;draw();return;}if(stp==='name'&&!id){if(!makeCreate(m))return;}m.step++;m.tried=false;draw();},'eh-primary me-play',{'data-npc-make-next':'1'}));main.append(nav);}
 function pickModel(box,cur,on){const sel=el('select','','',{'aria-label':'Model','data-npc-make-model':'1'});sel.append(new Option('— choose a model —',''));const G=MD().GROUPS;
  for(const g of Object.keys(G)){const og=document.createElement('optgroup');og.label=G[g];for(const x of MD().models().filter(x=>x.group===g))og.append(new Option(x.label+(advanced()?' ('+x.asset+')':'')+(x.walk?'':' — stands only (no walk)'),x.asset));sel.append(og);}
  sel.value=cur||'';sel.onchange=()=>{if(sel.value)on(sel.value);};const r=el('div','','me-row');r.append(el('b','Made from: '),sel);box.append(r);
  const md=cur&&MD().modelOf(cur);if(md){box.append(el('p',md.clips.length+' animations in its file'+(md.walk?'':'; it has no walk, so it can only stay at one spot')+'.','me-small'));if(md.licensed)box.append(el('p','A licensed model: recolour and hide accessories only; nothing is added; never any AI tool (its licence).','me-small me-warn'));}}
 function nameStep(box,m,c){const nm=el('input','','',{'aria-label':'Their name','data-npc-make-name':'1',maxlength:String(MD().LIMIT.name),placeholder:'e.g. the name you give them'});nm.value=c?c.name:m.name;
  const save=()=>{const v=nm.value.trim();if(c){if(v&&v!==c.name&&!/[<>]/.test(v))editMade(m.id,x=>{x.name=v;},'Renamed to “'+v+'”.');}else m.name=nm.value;};nm.oninput=()=>{if(!c)m.name=nm.value;idl.textContent=advanced()?'id: '+(c?m.id:MD().idFor(nm.value,taken())):'';};nm.onchange=save;
  const rl=el('input','','',{'aria-label':'Short role line (optional)','data-npc-make-role':'1',maxlength:String(MD().LIMIT.role),placeholder:'optional, e.g. a fixer from Old Town (only for you)'});rl.value=c?c.role||'':m.role;rl.onchange=()=>{if(c)editMade(m.id,x=>{x.role=rl.value.trim();},'Role line saved.');else m.role=rl.value;};
  const idl=el('span',advanced()?'id: '+(c?m.id:MD().idFor(m.name,taken())):'','me-small',{'data-npc-make-id':'1'});
  const r1=el('label','','me-field');r1.append(el('span','Name (required)'),nm,idl);const r2=el('label','','me-field');r2.append(el('span','Role line (optional)'),rl);box.append(r1,r2);adultBox(box,m.id,m);}
 function adultBox(box,id,m){const c=id?madeOf(id):null,model=c?c.model:m&&m.model,ok=model&&MD().adultAllowed(model);const lab=el('label','','me-check-row'+(ok?'':' me-disabled')),cb=el('input','','',{type:'checkbox','data-npc-make-adult':'1'});cb.checked=!!(c?c.adult:m&&m.adult);cb.disabled=!ok;
  cb.onchange=()=>{if(c)editMade(id,x=>{if(cb.checked)x.adult=true;else delete x.adult;},cb.checked?'Marked adult (18+): the adult places can be used for them.':'Not marked adult: the adult places are closed to them again.');else m.adult=cb.checked;};
  lab.append(cb,document.createTextNode(' This character is an adult (18+)'));box.append(lab,hint(ok?MHELP.adult:'Reverie’s and Lace’s models read youthful: a character made from them can never be marked adult.'));
  if(c&&!c.adult&&plan(id)&&X().planProblems(id,plan(id)).some(t=>/adult/.test(t)))box.append(el('p','Their place is in an adult place: tick the box, or move them.','me-bad'));}
 const taken=()=>new Set([...(S().givers||[]).map(g=>g.id),...Object.keys(S().local().characters||{})]);
 function makeCreate(m){const name=String(m.name||'').trim();if(!name||/[<>]/.test(name)){m.tried=true;draw();return false;}const id=MD().idFor(name,taken());
  const d=S().local();d.characters=d.characters||{};const c=MD().clean({name,model:m.model,...(String(m.role||'').trim()?{role:m.role}:{}),...(m.adult&&MD().adultAllowed(m.model)?{adult:true}:{})});d.characters[id]=c;S().saveLocal(d);
  m.id=id;ui.id=id;status='“'+name+'” is made and saved in your draft. Now their look.';return true;}
 function radios(box,attr,list,cur,on){const g=el('div','','me-subjects',{role:'radiogroup'});for(const [v,t,h] of list){const l=el('label','','me-check-row',{title:h||''}),r=el('input','','',{type:'radio',name:attr,value:v,[attr]:v});r.checked=(cur||'')===v;r.onchange=()=>on(v);l.append(r,document.createTextNode(' '+t));if(h)l.append(el('span',' — '+h,'me-small'));g.append(l);}box.append(g);}
 function deviceStep(box,id){const c=madeOf(id)||{};radios(box,'data-npc-make-device',[['','None (no device)'],...Object.entries(MD().DEVICES).map(([k,v])=>[k,v.name,v.help])],c.device,v=>editMade(id,x=>{if(v)x.device=v;else delete x.device;},v?'Device: '+MD().DEVICES[v].name+'.':'No device.'));}
 function shipStep(box,id){const c=madeOf(id)||{};radios(box,'data-npc-make-ship',[['','None'],...MD().ships().map(s=>[s.id,s.name+(advanced()?' ('+s.id+')':''),s.premium?'a paid hull: fine as their ship, never given to a player by a mission':''])],c.ship,v=>editMade(id,x=>{if(v)x.ship=v;else delete x.ship;},v?'Their ship: '+(MD().ships().find(s=>s.id===v)||{}).name+'.':'No ship.'));}
 function itemsStep(box,id){const c=madeOf(id)||{},have=new Map((c.items||[]).map(i=>[i.id,i])),all=MD().items(),kinds=[...new Set(all.map(i=>i.kind))];
  if(!all.some(i=>i.id==='hacking-device'))box.append(el('p','A hacking device is not in the game yet: it appears in this list once it is added (and can then be shown in their hand).','me-small me-warn',{'data-npc-make-no-hacking':'1'}));
  for(const k of kinds){const d=el('details','','me-npc-group',{'data-npc-make-kind':k});d.open=k==='weapon'||k==='item'||all.filter(i=>i.kind===k).some(i=>have.has(i.id));d.append(el('summary',k.charAt(0).toUpperCase()+k.slice(1)+'s'));
   for(const i of all.filter(x=>x.kind===k)){const r=el('div','','me-row',{'data-npc-make-item':i.id}),cb=el('input','','',{type:'checkbox','aria-label':'Carries '+i.name,'data-npc-make-item-on':i.id});cb.checked=have.has(i.id);cb.disabled=!have.has(i.id)&&have.size>=MD().LIMIT.items;
    cb.onchange=()=>editMade(id,x=>{const l=(x.items||[]).filter(y=>y.id!==i.id);if(cb.checked)l.push(i.show?{id:i.id,show:true}:{id:i.id});x.items=l;if(!l.length)delete x.items;},(cb.checked?'Carries ':'No longer carries ')+i.name+'.');
    r.append(cb,el('span',i.name));if(i.show){const sl=el('label','','me-small'),sc=el('input','','',{type:'checkbox','data-npc-make-item-show':i.id});sc.checked=!!(have.get(i.id)||{}).show;sc.disabled=!have.has(i.id);
     sc.onchange=()=>editMade(id,x=>{x.items=(x.items||[]).map(y=>y.id===i.id?(sc.checked?{id:i.id,show:true}:{id:i.id}):y);},sc.checked?i.name+' is visible on them ('+MD().SHOW_TEXT[i.show]+').':i.name+' is carried out of sight.');sl.append(sc,' visible on them ('+MD().SHOW_TEXT[i.show]+')');r.append(sl);}
    else r.append(el('span','data only','me-small'));d.append(r);}box.append(d);}
  box.append(el('p',have.size+' of '+MD().LIMIT.items+' items at most.','me-small'));}
 function whenStep(main,id){const c=madeOf(id)||{},box=el('section','','me-check',{'data-npc-make-when':id});box.append(el('h4','When are they there?'),hint(MHELP.when));
  const ms=[];for(const t of S().local().trees||[])for(const mm of t.missions||[])ms.push({id:mm.id,title:(mm.title||mm.id)+' ('+(t.name||t.id)+')',steps:(mm.objectives||[]).map(o=>({id:o.id,label:o.label||o.id}))});
  const sel=el('select','','',{'aria-label':'When they are there','data-npc-make-when-mission':id});sel.append(new Option('Always (all the time)',''));for(const x of ms)sel.append(new Option('Only while this mission is in progress: '+x.title,x.id));sel.value=c.when?c.when.mission:'';
  sel.onchange=()=>editMade(id,x=>{if(sel.value)x.when={mission:sel.value};else delete x.when;},sel.value?'They are there only while that mission is in progress.':'They are always there.');box.append(sel);
  const cur=c.when&&ms.find(x=>x.id===c.when.mission);if(cur){const st=el('select','','',{'aria-label':'From which step','data-npc-make-when-step':id});st.append(new Option('from the start of the mission',''));for(const o of cur.steps)st.append(new Option('from the step “'+o.label+'”',o.id));st.value=c.when.step||'';
   st.onchange=()=>editMade(id,x=>{x.when=st.value?{mission:cur.id,step:st.value}:{mission:cur.id};},'Saved.');box.append(st);}
  adultBox(box,id);main.append(box);}
 function summary(c){const ul=el('ul','','me-small',{'data-npc-make-summary':'1'}),it=new Map(MD().items().map(i=>[i.id,i.name]));
  for(const t of ['Name: '+c.name+(c.role?' — '+c.role:''),'Model: '+(MD().modelOf(c.model)||{label:c.model}).label+(c.adult?' · adult (18+)':''),'Look: '+(c.look?'changed':'as made'),'Device: '+(c.device?MD().DEVICES[c.device].name:'none'),'Ship: '+(c.ship?(MD().ships().find(s=>s.id===c.ship)||{}).name:'none'),
   'Items: '+((c.items||[]).map(i=>it.get(i.id)+(i.show?' (visible)':'')).join(', ')||'none'),'There: '+(c.when?'only during a mission':'always')])ul.append(el('li',t));return ul;}
 /* The made character's own box in the NPC list: everything the creator set, changed in place. */
 function madeBox(main,e){const id=e.id,c=madeOf(id);if(!c)return;const box=el('section','','me-check',{'data-npc-made':id});box.append(el('h4','Mission giver made by you'),hint('Everything you chose in the creator. Change it here or step by step.'));
  box.append(summary(c));const r=el('div','','me-row');
  r.append(btn('CHANGE STEP BY STEP',()=>{ui.make={step:1,id,model:c.model,name:c.name,role:c.role||'',adult:!!c.adult,tried:false};ui.id=id;draw();},'',{'data-npc-made-edit':id}),
   btn('DELETE THIS CHARACTER',()=>{if(!confirm('Delete '+c.name+' from your draft? UNDO (top right) brings them back.'))return;const d=S().local();delete d.characters[id];if(d.npcs)delete d.npcs[id];if(d.voices)delete d.voices[id];S().saveLocal(d);ui.id=null;status=c.name+' was deleted from your draft (UNDO brings them back). Missions they gave keep their text.';draw();},'me-x',{'data-npc-made-delete':id}));
  box.append(r);const left=root.VoidMissionContent?.madeNeeds?.(S().local(),S().givers,id)||[];if(left.length)box.append(el('p','Not in the game yet: '+left.map(x=>x.replace(/^[^:]+: /,'')).join(' '),'me-warn',{'data-npc-made-needs':id}));
  const dv=el('div');dv.append(el('b','Device'));deviceStep(dv,id);const sh=el('div');sh.append(el('b','Ship'));shipStep(sh,id);const its=el('details','','me-npc-group');its.append(el('summary','Items'));itemsStep(its,id);box.append(dv,sh,its);
  main.append(box);whenStep(main,id);}
 /* This character's own look (content.characters[id].look), with the appearance editor's parts, colours and pieces. */
 function charLookBox(main,e,asset,inWizard){const id=e.id,box=el('section','','me-check',{'data-npc-appearance':id});box.append(el('h4','Their look'),hint(MHELP.look));main.append(box);
  if(!asset||!NL()){box.append(el('p','No model.','me-small'));return;}if(NL().LICENSED.test(asset))box.append(el('p','A licensed model: recolour and hide accessories only; nothing is added; never any AI tool.','me-small me-warn'));
  const body=el('div','','',{'data-npc-look-body':asset});box.append(body);if(inWizard)previewBox(main,e,asset,clipsOf(asset),ui.preview&&ui.previewFor===id?ui.preview.canvas.parentElement:null);
  const edit=(fn,say)=>editMade(id,x=>{const l=JSON.parse(JSON.stringify(x.look||{}));fn(l);for(const k of ['hide','gear'])if(l[k]&&!l[k].length)delete l[k];if(l.colour&&!Object.keys(l.colour).length)delete l.colour;if(!l.hair)delete l.hair;delete l.id;delete l.name;if(Object.keys(l).length)x.look=l;else delete x.look;},say);
  box.refill=async()=>{body.replaceChildren();if(!(ui.preview&&ui.previewFor===id&&ui.preview.container)){body.append(btn('Show me in 3D to change the look',()=>{const g=host.querySelector('[data-npc-preview-go]');if(g){g.click();g.scrollIntoView({block:'center'});}},'',{'data-npc-look-start':asset}));return;}
   body.append(el('p','Reading what this model supports…','me-small'));const cp=await capsOf(asset);body.replaceChildren();if(!cp){body.append(el('p','The model could not be read.','me-bad'));return;}
   const c=madeOf(id)||{},cur={id:'own',name:c.name,...(c.look||{})};ui.preview?.look(asset,cur);lookSections(body,asset,cp,cur,edit);
   const rr=el('div','','me-row');rr.append(btn('BACK TO THE MODEL AS MADE',()=>edit(l=>{for(const k of Object.keys(l))delete l[k];},'Their look is back to the model as made (UNDO brings it back).'),'',{'data-npc-look-reset':asset}));body.append(rr);};
  box.refill();}
 // ---- make giver
 function giverBox(main,e){const g=e.giver,box=el('section','','me-check',{'data-npc-giver':e.id});box.append(el('h4','Give a mission'),hint(HELP.giver));
  const d=S().local(),own=(d.trees||[]).filter(t=>!t.shipped&&/^draft-/.test(t.id)),sel=el('select','','',{'aria-label':'Which tree','data-npc-giver-tree':e.id});
  for(const t of own)sel.append(new Option(t.name||t.id,t.id));sel.append(new Option('a new tree “Missions from '+g.name+'”',''));
  const mine=[];for(const t of d.trees||[])for(const m of t.missions)if(m.giver===e.id)mine.push(m.title||m.id);
  const r=el('div','','me-row');r.append(el('span','in','me-small'),sel,btn('Give them a mission',()=>{S().addGiverMission(e.id,sel.value,{notification:!g.canTalk});status='';DTX().tab='missions';DTX().render();},'',{'data-npc-make-giver':e.id,title:g.canTalk?'Creates an in-person mission. You can change its start mode in the Mission Editor.':'Creates a notification-started mission because this NPC has no walking TALK prompt.'}));box.append(r);
  if(!g.canTalk)box.append(el('p','No walking TALK prompt: the new mission starts as a device notification. You can use this NPC for Messages, Comms, notifications, lines and other supported mission roles without changing their default scene behavior.','me-small me-warn'));
  box.append(el('p',mine.length?'Already gives in your draft: '+mine.join(', ')+'.':'Gives no mission in your draft yet.','me-small'));main.append(box);}
 // ---- placement (stay / route / own routine)
 function placeBox(main,e,clips){const id=e.id,M=X().MOVABLE[id],box=el('section','','me-check',{'data-npc-place':id});box.append(el('h4','Where they are in the game'),hint(M?.placementOnly?'Place Dax in the District. She uses the route or spot you publish, or waits at her hallway post if no routine is configured.':HELP.place));
  if(!M){const why=e.giver.group==='earlier'?'Not in the District today.':/district-people|District/.test(e.giver.where||'')?'Placed by the District’s own room code (a fixed spot in a building).':e.giver.where?'Placed by its scene’s own code ('+e.giver.where.replace(/\s*\(.*$/,'')+').':'No figure in the walking game.';
   box.append(el('p','Cannot be moved from here yet: '+why+' Today only Reverie, Lace and the street cat can be moved (their walking code follows a plan).','me-small me-warn',{'data-npc-place-locked':id}));main.append(box);return;}
  const whole=plan(id),bi=blockOf(id),p=curPlan(id),mode=p&&p.mode!=='original'?p.mode:'own',acts=X().actionsFor(id,whole&&whole.anims||[]),probs=whole?X().planProblems(id,whole):[],she=M.it?'it':'she',her=M.it?'its':'her';
  // put: write the all-day plan, or the time block being edited (Daily schedule)
  const put=o=>{if(bi==null)return setPlan(id,o);const w=plan(id),sch=w.schedule.slice(),b=sch[bi],{anims,schedule,...rest}=o||{mode:'original'};sch[bi]={from:b.from,to:b.to,...(b.name?{name:b.name}:{}),...rest};setPlan(id,{...w,schedule:sch});};
  if(whole&&Array.isArray(whole.schedule)&&whole.schedule.length){const sel=el('div','','me-row npc-editing',{role:'group','aria-label':'Which part of the day you are changing','data-npc-editing':id});sel.append(el('b','Changing: '));
   sel.append(btn('All day (outside the time blocks)',()=>{ui.block[id]=null;draw();},bi==null?'on':'',{'data-npc-edit-block':'all','aria-pressed':String(bi==null)}));
   whole.schedule.forEach((b,k)=>sel.append(btn(b.from+'–'+b.to+(b.name?' '+b.name:''),()=>{ui.block[id]=k;draw();},bi===k?'on':'',{'data-npc-edit-block':String(k),'aria-pressed':String(bi===k)})));
   box.append(sel,hint(bi==null?'You are changing what '+she+' does outside every time block. Pick a time block to change that part of the day instead.':'You are changing the time block '+whole.schedule[bi].from+'–'+whole.schedule[bi].to+'. The map and the buttons below now set what '+she+' does then.'));}
  const modes=el('div','','me-row');for(const [m_,name] of [...(M.made?[]:[['own',M.placementOnly?'Clear placement to hallway default':'Let '+her+' do '+her+' usual thing']]),['stay','Keep '+(M.it?'it':'her')+' at one spot'],['path','Make '+(M.it?'it':'her')+' walk a route']])modes.append(btn(name,()=>{
    if(m_==='own'){const before=whole;put(p&&p.anims?{mode:'original',anims:p.anims}:null);if(before&&before.mode!=='original'){status=M.placementOnly?'Dax is back at her hallway post.':'She is back to her usual thing.';ui.undo=()=>setPlan(id,before,{keep:false});}}
    else if(m_==='stay'){const s0=M.placementOnly?M.home:root.VoidStreetPair?.SEAT||{x:104.4,z:-6.4};put({...(p&&p.anims?{anims:p.anims}:{}),mode:'stay',x:p&&p.mode==='stay'?p.x:s0.x,z:p&&p.mode==='stay'?p.z:(M.placementOnly?s0.z:-6.4),yaw:p&&p.mode==='stay'?p.yaw:(M.placementOnly?s0.yaw:Math.PI),actions:p&&p.mode==='stay'?p.actions:stayDefault(id)});}
    else{put({...(p&&p.anims?{anims:p.anims}:{}),mode:'path',points:p&&p.mode==='path'?p.points:[]});root.VoidEditorGuide?.focusNext();}
    draw();},mode===m_?'on':'',{'data-npc-mode':m_,'aria-pressed':String(mode===m_)}));
  box.append(modes,hint(mode==='own'&&M.placementOnly?'No routine configured. Dax waits at her hallway post.':mode==='own'&&M.made?'Not in the world yet: press “Keep her at one spot” (then click the map) or “Make her walk a route”. Pick the area on the map first.':mode==='own'?(M.it?'It does what the game has it do now: goes to whichever of Reverie and Lace is out, rubs round her legs, sits by her; with neither out it potters about by the LAUNDRY door.':'She does what the game has her do now: walks her stretch of the Avenue, sits on the ledges, plays with the cat.'):mode==='stay'?HELP.stay:HELP.route));
  const markers=[],live=root.VoidStreetPair?.live?.();if(live&&live.her&&live.her.id===id)markers.push({id:'live',x:live.her.x,z:live.her.z,ghost:true,color:'#ffd34d',label:M.name+' now'});
  for(const t of S().local().trees||[])for(const m of t.missions)if(m.giver===id&&m.waitAt)markers.push({id:'w-'+m.id,x:m.waitAt.x,z:m.waitAt.z,yaw:m.waitAt.yaw,ghost:true,color:'#c08aff',label:'waits for “'+(m.title||m.id)+'”'});
  if(mode==='stay')markers.push({id:'stay',x:p.x,z:p.z,yaw:p.yaw,color:'#ff8ad8',label:M.name+' stays here',drag:true,facing:true,bad:X().spotProblems(id,p).length>0});
  const route=mode==='path'?p.points.map((q,i)=>({...q,bad:X().spotProblems(id,q).length>0})):[],routeBad=mode==='path'?p.points.map((q,i)=>X().legProblems(id,q,p.points[(i+1)%p.points.length]).length?i:-1).filter(i=>i>=0):[];
  const map=root.VoidNPCMap.create({npc:id,markers,route,routeBad,selected:'stay',lock:mode==='path'&&p.points.length&&root.VoidNPCAreas?root.VoidNPCAreas.areaOf(p.points[0]):null,area:ui.area[id]||null,onArea:a=>{ui.area[id]=a;},center:mode==='stay'?p.x:mode==='path'&&p.points.length?p.points[0].x:null,
   onPick:(x,z)=>{if(mode==='stay'){const s_=X().snap(id,{x,z});put({...p,x:s_.x,z:s_.z});draw();}else if(mode==='path'){const s_=X().snap(id,{x,z});put({...p,points:[...p.points,{x:s_.x,z:s_.z,action:'look',seconds:5}]});draw();}},
   onDrag:(mid,x,z)=>{if(mid==='stay'){const s_=X().snap(id,{x,z});put({...p,x:s_.x,z:s_.z});draw();}},onFacing:(mid,yaw)=>{if(mid==='stay'){put({...p,yaw});draw();}},
   onPoint:mode==='path'?(i,x,z)=>{const s_=X().snap(id,{x,z}),pts=p.points.slice();pts[i]={...pts[i],x:s_.x,z:s_.z};put({...p,points:pts});draw();}:null});
  map.el.dataset.npcMap=id;box.append(map.el);
  if(mode==='stay'){const r=el('div','','me-row');r.append(el('b','Spot: x '+p.x.toFixed(1)+', z '+p.z.toFixed(1)+' · facing '+S().compass(p.yaw)));for(const f of [['N',0],['E',Math.PI/2],['S',Math.PI],['W',-Math.PI/2]])r.append(btn('face '+f[0],()=>{put({...p,yaw:Math.round(f[1]*100)/100});draw();}));box.append(r);
   const ab=el('div','','me-subjects',{role:'group','aria-label':'What she does there','data-npc-stay-actions':id});for(const a of acts.filter(a=>!a.path)){const l=el('label','','me-small',{title:a.help}),c=el('input','','',{type:'checkbox',value:a.id,'data-npc-act':a.id});c.checked=p.actions.includes(a.id);
    c.onchange=()=>{const list=c.checked?[...p.actions,a.id]:p.actions.filter(x=>x!==a.id);put({...p,actions:list});draw();};l.append(c,' '+a.name);ab.append(l);}box.append(el('b','What '+she+' does there'),ab,hint(HELP.stay));
   {const sp=X().seatPoses?X().seatPoses(p):null;if(sp)box.append(el('p','Pose at this seat: '+sp.poses.map(q=>q.name+(acts.some(a=>a.id===q.action)?'':' (not in '+her+' file)')).join(' / ')+'. Tick the matching “Sit — pose: …” above.','me-small',{'data-npc-seat-poses':sp.poses.map(q=>q.pose).join(' ')}));}}
  if(mode==='path'){const tb=el('table','','me-table',{'data-npc-route':id});tb.innerHTML='<tr><th>#</th><th>Where</th><th>Does</th><th>Seconds</th><th></th></tr>';
   p.points.forEach((q,i)=>{const tr=el('tr','','',{'data-npc-point':String(i)}),as=el('select','','',{'aria-label':'Action at point '+(i+1),'data-npc-point-action':String(i)});for(const a of acts)as.append(new Option(a.name,a.id));as.value=q.action;as.title=(acts.find(a=>a.id===q.action)||{}).help||'';
    as.onchange=()=>{const pts=p.points.slice();pts[i]={...q,action:as.value};put({...p,points:pts});draw();};
    const sec=el('input','','',{type:'number',min:'1',max:'120',step:'1','aria-label':'Seconds at point '+(i+1),'data-npc-point-seconds':String(i),style:'width:5em'});sec.value=String(q.seconds||5);sec.disabled=q.action==='walk-on';sec.title=HELP.seconds;sec.onchange=()=>{const pts=p.points.slice();pts[i]={...q,seconds:Math.max(1,Math.min(120,Math.round(+sec.value||5)))};put({...p,points:pts});draw();};
    const td=(...n)=>{const c=el('td');c.append(...n);return c;};
    tr.append(td(el('b',String(i+1))),td(el('span','x '+q.x.toFixed(1)+', z '+q.z.toFixed(1),X().spotProblems(id,q).length?'me-bad':'me-small')),td(as),td(sec),td(btn('▲',()=>{if(!i)return;const pts=p.points.slice();[pts[i-1],pts[i]]=[pts[i],pts[i-1]];put({...p,points:pts});draw();},'',{'aria-label':'Move point up',...(i?{}:{disabled:''})}),btn('×',()=>{const before=whole;put({...p,points:p.points.filter((_,k)=>k!==i)});status='Point '+(i+1)+' removed.';ui.undo=()=>setPlan(id,before,{keep:false});draw();},'me-x',{'aria-label':'Remove point '+(i+1)})));tb.append(tr);});
   box.append(tb,hint(HELP.action));if(!p.points.length)box.append(el('p','No points yet — pick the area on the map, then click a spot on the green ground to start. Then click again for the next point (at least two).','me-small me-warn',{'data-npc-empty':'1'}));}
  for(const pr of probs)box.append(el('p','⚠ '+pr,'me-bad',{'data-npc-problem':'1'}));
  const act=el('div','','me-row me-actions');act.append(btn('PLAY THIS DRAFT',()=>playNpc(e),'me-play',{'data-npc-play':id,...(probs.length?{disabled:'',title:'Fix the problems first.'}:{})}),hint(HELP.play));box.append(act);
  main.append(box);}
 // ---- DAILY SCHEDULE (queue item 1): time blocks on the in-game clock (npc-paths.js scheduleProblems / blockAt); each block is a stay, a route or "the usual thing",
 // changed on the map above with EDIT ON THE MAP. Reverie and Lace keep their real-time street shift: a schedule says what she does while she is out.
 const BLOCK_COLOURS=['#ff8ad8','#58ffe1','#f2b33d','#9d8cff','#7dff8a','#ff9a5c','#5cb8ff','#e0e070'];
 function gameNow(){try{return typeof state!=='undefined'&&state&&root.VoidClock?root.VoidClock.now(state):null;}catch{return null;}}
 function freeSlot(sch){for(let h=8;h<32;h++){const f=(h%24)*60,ok=[...Array(60).keys()].every(k=>X().blockAt(sch,(f+k)%1440)<0);if(ok)return {from:X().hhmm(f),to:X().hhmm(f+60)};}return null;}
 function scheduleBox(main,e){const id=e.id,M=X().MOVABLE[id];if(!M)return;const box=el('section','','me-check',{'data-npc-schedule':id});box.append(el('h4','Daily schedule'),hint(HELP.schedule));
  const whole=plan(id),sch=whole&&Array.isArray(whole.schedule)?whole.schedule:[],she=M.it?'it':'she',adv=advanced(),tier=whole&&whole.tier||1;
  const tierRow=el('div','','me-row',{'data-npc-tier':id});const tierSel=el('select','','',{'aria-label':'Character tier','data-npc-tier-select':id});
  for(const [v,t] of [['1','Tier 1 — stays in one area'],['2','Tier 2 — may walk through the gates'],['3','Tier 3 — may walk through the gates']])tierSel.append(new Option(t,v));tierSel.value=String(tier);
  tierSel.onchange=()=>{const w=plan(id)||{mode:'original'},n={...w},t=+tierSel.value;if(t>=2){n.tier=t;if(!n.awareness)n.awareness={sight:40,fov:120,hear:{walk:20,sprint:40,combat:60}};}else{delete n.tier;delete n.awareness;}setPlan(id,n,{keep:false});};tierRow.append(el('b','Tier: '),tierSel);if(!M.placementOnly)box.append(tierRow);
  if(tier>=2&&!M.placementOnly){const aw=whole&&whole.awareness||{sight:40,fov:120,hear:{walk:20,sprint:40,combat:60}},hear=aw.hear||{walk:20,sprint:40,combat:60};
   const put=next=>{const w=plan(id)||{mode:'original'};setPlan(id,{...w,awareness:next},{keep:false});};
   const num=(key,label,val,set)=>{const i=el('input','','',{type:'number',min:'10',max:'160',step:'1','aria-label':label,'data-npc-aware':key,style:'width:4.2em'});i.value=String(val);i.onchange=()=>set(+i.value);return i;};
   const row=el('div','','me-row',{'data-npc-awareness':id});row.append(el('b','Notice: '),num('sight','Sight in feet',aw.sight,v=>put({...aw,sight:v,hear})),document.createTextNode(' ft sight, '),num('fov','Field of view in degrees',aw.fov,v=>put({...aw,fov:v,hear})),document.createTextNode('° view. Hearing '),num('walk','Hearing a walk, in feet',hear.walk,v=>put({...aw,hear:{...hear,walk:v}})),document.createTextNode(' / '),num('sprint','Hearing a sprint, in feet',hear.sprint,v=>put({...aw,hear:{...hear,sprint:v}})),document.createTextNode(' / '),num('combat','Hearing combat, in feet',hear.combat,v=>put({...aw,hear:{...hear,combat:v}})),document.createTextNode(' ft (walk / sprint / combat).'));box.append(row,el('p','Sight stops at a wall. Hearing does not look through it. Tier 1 ignores this record.','me-small'));}
  const setSch=(list,say,undoable)=>{const before=plan(id);const w=plan(id)||{mode:'original'};setPlan(id,{...w,schedule:list},{keep:false});if(say)status=say;if(undoable)ui.undo=()=>setPlan(id,before,{keep:false});if(!list.length)ui.block[id]=null;draw();};
  if(M.placementOnly)box.append(el('p','Dax’s published schedule uses UTC so players see the same routine. Draft previews can start at a selected time.','me-small'));
  else if(M.cat)box.append(el('p','The cat is out whenever the street is (day and night). The game’s own clock decides which time block it follows.','me-small'));
  else box.append(el('p',S().G().shiftText((S().givers||[]).find(g=>g.id===id)||{})+' While she is out, the game’s own clock (an in-game day passes in 2 hours of play) decides which time block she follows.','me-small me-warn'));
  const utcMinute=Math.floor(Date.now()/60000)%1440,gn=M.placementOnly?{time:X().hhmm(utcMinute),minuteOfDay:utcMinute}:gameNow();if(gn){const k=X().blockAt(sch,gn.minuteOfDay);box.append(el('p',(M.placementOnly?'Current UTC: ':'In your game now: ')+gn.time+' — '+(k>=0?'time block '+sch[k].from+'–'+sch[k].to+(sch[k].name?' “'+sch[k].name+'”':''):'outside every time block (all day)')+'.','me-small',{'data-npc-clock-now':'1'}));}
  // the timeline: 24 hours, each block a coloured bar (a block past midnight is drawn in two parts); click a bar to change that block on the map
  const tl=el('div','','npc-timeline',{'data-npc-timeline':id,role:'group','aria-label':'The day from 00:00 to 24:00'});for(let h=0;h<=24;h+=3){const t=el('span',String(h).padStart(2,'0')+':00','npc-tick');t.style.left=(h/24*100)+'%';tl.append(t);}
  sch.forEach((b,k)=>{const f=X().toMin(b.from),t=X().toMin(b.to);if(f==null||t==null||f===t)return;const parts=f<t?[[f,t]]:[[f,1440],[0,t]];
   for(const [a,z] of parts){const bar=btn(b.name||b.from+'–'+b.to,()=>{ui.block[id]=k;draw();setTimeout(()=>host.querySelector('[data-npc-place]')?.scrollIntoView({block:'start'}),50);},'npc-bar'+(blockOf(id)===k?' on':''),{'data-npc-bar':String(k),title:b.from+'–'+b.to+(b.name?' '+b.name:'')+': click to change it on the map'});
    bar.style.left=(a/1440*100)+'%';bar.style.width=Math.max(.8,(z-a)/1440*100)+'%';bar.style.background=BLOCK_COLOURS[k%BLOCK_COLOURS.length];tl.append(bar);}});
  box.append(tl);
  if(!sch.length)box.append(el('p','No time blocks: '+she+' does the same all day (the placement above). + ADD A TIME BLOCK to give part of the day something else.','me-small',{'data-npc-no-schedule':'1'}));
  const tb=el('table','','me-table',{'data-npc-blocks':id});if(sch.length){tb.innerHTML='<tr><th></th><th>From</th><th>To</th><th>What '+she+' does</th><th>Name</th><th></th></tr>';}
  sch.forEach((b,k)=>{const tr=el('tr','','',{'data-npc-block':String(k)}),td=(...n)=>{const c=el('td');c.append(...n);return c;};
   const sw=el('span','','npc-swatch-dot');sw.style.background=BLOCK_COLOURS[k%BLOCK_COLOURS.length];
   const time=(key,label)=>{const i=el('input','','',{type:'time',step:'900','aria-label':label+' of time block '+(k+1),'data-npc-block-time':key+':'+k});i.value=b[key]||'';i.onchange=()=>{if(!X().HHMM.test(i.value))return;const list=sch.slice();list[k]={...b,[key]:i.value};setSch(list);};return i;};
   const what=el('select','','',{'aria-label':'What '+she+' does in time block '+(k+1),'data-npc-block-mode':String(k)});for(const [v,t] of [['original',M.placementOnly?'hallway default':M.it?'its usual thing':'her usual thing'],['stay','stay at one spot'],['path','walk a route']])what.append(new Option(t,v));what.value=b.mode;
   what.onchange=()=>{const list=sch.slice(),head={from:b.from,to:b.to,...(b.name?{name:b.name}:{})},s0=M.placementOnly?M.home:{x:(root.VoidStreetPair?.SEAT||{x:104.4}).x,z:-6.1,yaw:Math.PI};
    list[k]=what.value==='original'?{...head,mode:'original'}:what.value==='stay'?{...head,mode:'stay',x:s0.x,z:s0.z,yaw:s0.yaw,actions:M.cat?X().CAT_STAY.slice():stayDefault(id)}:{...head,mode:'path',points:[]};ui.block[id]=what.value==='original'?ui.block[id]:k;setSch(list);};
   const nm=el('input','','',{'aria-label':'Name of time block '+(k+1),'data-npc-block-name':String(k),placeholder:'e.g. Morning walk',maxlength:'40',style:'width:10em'});nm.value=b.name||'';
   nm.onchange=()=>{const v=nm.value.trim(),list=sch.slice();if(v&&!X().NAME_OK.test(v)){status='A name may use letters, numbers and simple punctuation only.';draw();return;}const nb={...b};if(v)nb.name=v;else delete nb.name;list[k]=nb;setSch(list);};
   const cross=el('label','','me-small',{'data-npc-block-cross':String(k)});const cx=el('input','','',{type:'checkbox','aria-label':'Walk through the gates into time block '+(k+1)});cx.checked=b.cross===true;cx.disabled=b.mode==='original';
   cx.onchange=()=>{const list=sch.slice(),nb={...b};if(cx.checked)nb.cross=true;else delete nb.cross;list[k]=nb;setSch(list);};cross.append(cx,document.createTextNode(' Walk through the gates'));
   const edit=btn(blockOf(id)===k?'CHANGING ON THE MAP':'EDIT ON THE MAP',()=>{ui.block[id]=k;draw();setTimeout(()=>host.querySelector('[data-npc-place]')?.scrollIntoView({block:'start'}),50);},blockOf(id)===k?'on':'',{'data-npc-block-edit':String(k),title:'Changes this time block with the map and buttons in “Where they are in the game”.',...(b.mode==='original'?{disabled:''}:{})});
   const rm=btn('×',()=>{ui.block[id]=null;setSch(sch.filter((_,q)=>q!==k),'Time block '+b.from+'–'+b.to+' removed.',true);},'me-x',{'aria-label':'Remove time block '+(k+1),'data-npc-block-remove':String(k)});
   tr.append(td(sw),td(time('from','Start')),td(time('to','End')),td(what),td(nm,...(M.placementOnly?[]:[cross])),td(edit,rm));tb.append(tr);});
  if(sch.length)box.append(tb);
  for(const pr of X().scheduleProblems(id,sch.length?sch:null,whole&&whole.anims,tier,whole))box.append(el('p','⚠ '+pr.replace(M.name+': ',''),'me-bad',{'data-npc-schedule-problem':'1'}));
  const row=el('div','','me-row');row.append(btn('+ ADD A TIME BLOCK',()=>{const f=freeSlot(sch);if(!f||sch.length>=X().LIMIT.blocks){status=sch.length>=X().LIMIT.blocks?'A schedule has '+X().LIMIT.blocks+' time blocks at most.':'There is no free hour left in the day: shorten a time block first.';draw();return;}
    const s0=M.placementOnly?M.home:{x:(root.VoidStreetPair?.SEAT||{x:104.4}).x,z:-6.1,yaw:Math.PI};setSch([...sch,{...f,mode:'stay',x:s0.x,z:s0.z,yaw:s0.yaw,actions:M.cat?X().CAT_STAY.slice():stayDefault(id)}],'Time block '+f.from+'–'+f.to+' added: change its times, what '+she+' does, and its spot on the map.');ui.block[id]=sch.length;draw();},'',{'data-npc-block-add':id,title:'Adds the next free hour of the day (from 08:00). Change its times and what '+she+' does.'}));
  if(sch.length)row.append(btn('REMOVE THE SCHEDULE',()=>setSch([],'The daily schedule was removed.',true),'me-x',{'data-npc-schedule-clear':id}));box.append(row);
  // try a time: which block applies, and play the draft at that in-game time
  const tr=el('div','','me-row',{'data-npc-try-time':id}),m0=Number.isFinite(ui.clock[id])?ui.clock[id]:gn?gn.minuteOfDay:480,rg=el('input','','',{type:'range',min:'0',max:'1425',step:'15','aria-label':'Try a time of day','data-npc-try-range':id});rg.value=String(m0);
  const say=el('span','','me-small',{'aria-live':'polite','data-npc-try-say':id});const upd=()=>{const m=+rg.value,k=X().blockAt(sch,m),b=k>=0?sch[k]:null;ui.clock[id]=m;say.textContent='At '+X().hhmm(m)+' '+she+(b?' follows time block '+(k+1)+' ('+b.from+'–'+b.to+(b.name?' “'+b.name+'”':'')+')':' does the all-day plan')+(root.VoidNPCBehaviour?': '+root.VoidNPCBehaviour.describe(id,b||whole):'')+'.';};rg.oninput=upd;upd();
  const probs=whole?X().planProblems(id,whole):[];
  tr.append(el('b','Try a time:'),rg,say,btn('PLAY THIS DRAFT AT THIS TIME',()=>playNpc(e,{minute:+rg.value}),'me-play',{'data-npc-play-at':id,...(probs.length?{disabled:'',title:'Fix the problems first.'}:{})}));box.append(tr,hint(HELP.tryTime));
  main.append(box);}
 // ---- DESCRIBE IT TO CHATGPT (queue item 1): copy a self-contained prompt; paste ChatGPT's JSON recipe; checked, previewed on the map and in a draft play, then saved
 // into the same placement as the route editor. The paste is only ever read with JSON.parse and compared with fixed lists (npc-behaviour.js): nothing in it runs.
 function behaviourBox(main,e){const id=e.id,M=X().MOVABLE[id],NB=root.VoidNPCBehaviour;if(!M||!NB)return;const box=el('section','','me-check',{'data-npc-behaviour':id});box.append(el('h4','Describe it to ChatGPT'),hint(HELP.chatgpt));
  const st=ui.recipe[id]=ui.recipe[id]||{text:'',res:null,show:'all'},whole=plan(id),anims=whole&&whole.anims||[];
  const steps=el('ol','','me-small');for(const t of ['Press COPY CHATGPT PROMPT.','Open ChatGPT, paste it, and write at the end what you want (for example: “mornings she walks from the tea house to the laundry and back; at lunch she sits on her ledge; at night she watches the street by the chai shop”).','Copy ChatGPT’s whole answer, paste it in the box below and press CHECK IT.','Look at the preview (the map and PLAY IT), then press USE THIS BEHAVIOUR.'])steps.append(el('li',t));box.append(steps);
  const pr=NB.prompt(id,{anims});const row=el('div','','me-row');const shown=el('textarea','','',{readonly:'','aria-label':'The ChatGPT prompt','data-npc-prompt-text':id,rows:'6',style:'width:100%;display:none'});shown.value=pr;
  row.append(btn('COPY CHATGPT PROMPT',async()=>{let ok=false;try{await root.navigator.clipboard.writeText(pr);ok=true;}catch{}if(!ok){shown.style.display='block';shown.focus();shown.select();try{ok=document.execCommand('copy');}catch{}}status=ok?'The prompt is copied. Paste it into ChatGPT and add what you want at the end.':'Your browser did not let the editor copy it: the prompt is shown below, selected. Press Ctrl+C to copy it.';draw();},'me-play',{'data-npc-copy-prompt':id}),
   btn('SHOW THE PROMPT',()=>{shown.style.display=shown.style.display==='none'?'block':'none';},'',{'data-npc-show-prompt':id}));box.append(row,shown);
  const ta=el('textarea','','',{'aria-label':'Paste ChatGPT’s answer here','data-npc-paste':id,rows:'7',placeholder:'Paste ChatGPT’s answer here (the whole answer is fine: the editor finds the JSON in it).',style:'width:100%',spellcheck:'false'});ta.value=st.text;ta.oninput=()=>{st.text=ta.value;};
  box.append(el('b','Paste behaviour'),ta,hint(HELP.paste));
  const go=el('div','','me-row');go.append(btn('CHECK IT',()=>{st.text=ta.value;st.res=NB.read(st.text,id,{anims});st.show='all';status=st.res.ok?'The recipe is fine: look at the preview below.':'The recipe has problems: see the list below.';draw();},'',{'data-npc-check':id}),
   btn('CLEAR',()=>{st.text='';st.res=null;draw();},'me-x',{'data-npc-paste-clear':id}));box.append(go);
  const r=st.res;if(r){if(!r.ok){const ul=el('ul','','',{'data-npc-recipe-problems':id});for(const t of r.problems)ul.append(el('li','⚠ '+t,'me-bad'));box.append(el('p','Not used: fix these (or ask ChatGPT to fix them: paste this list back to it).','me-warn'),ul);}
   else{const pv=el('div','','',{'data-npc-recipe-preview':id});pv.append(el('b','Preview'));const ul=el('ul','','me-small');for(const t of r.summary)ul.append(el('li',t));pv.append(ul);
    const sch=r.plan.schedule||[],sel=el('div','','me-row');sel.append(el('span','Show on the map: ','me-small'));
    for(const [k,label] of [['all','All day'],...sch.map((b,i)=>[String(i),b.from+'–'+b.to+(b.name?' '+b.name:'')])])sel.append(btn(label,()=>{st.show=k;draw();},st.show===k?'on':'',{'data-npc-recipe-show':k,'aria-pressed':String(st.show===k)}));pv.append(sel);
    const a=st.show==='all'?r.plan:sch[+st.show]||r.plan,markers=[],route=[];if(a.mode==='stay')markers.push({id:'r',x:a.x,z:a.z,yaw:a.yaw,color:'#7dff8a',label:M.name+' (pasted)'});if(a.mode==='path')route.push(...a.points.map(q=>({...q})));
    const map=root.VoidNPCMap.create({npc:id,markers,route,center:a.mode==='stay'?a.x:a.mode==='path'?a.points[0].x:null});map.el.dataset.npcRecipeMap=id;pv.append(map.el);
    if(a.mode==='original')pv.append(el('p','In this part of the day '+(M.it?'it does its':'she does her')+' usual thing (nothing to show on the map).','me-small'));
    const minute=st.show==='all'?null:X().toMin(sch[+st.show].from);
    const act=el('div','','me-row me-actions');act.append(btn('PLAY IT (DRAFT, NOT SAVED)',()=>playNpc(e,{plan:r.plan,...(minute!=null?{minute}:{})}),'',{'data-npc-recipe-play':id,title:'A throwaway test session with this behaviour'+(minute!=null?' at '+X().hhmm(minute)+' in-game':'')+'. Nothing is saved.'}),
     btn('USE THIS BEHAVIOUR',()=>{const before=plan(id);setPlan(id,{...r.plan,...(anims.length?{anims}:{}),schedule:r.plan.schedule||[]},{keep:false});ui.block[id]=null;st.res=null;st.text='';status='Saved into your draft: '+M.name+' now follows the pasted behaviour. PLAY THIS DRAFT to try it; PUBLISH sends it to players.';ui.undo=()=>setPlan(id,before,{keep:false});draw();},'me-play',{'data-npc-recipe-use':id}));
    pv.append(act,hint('USE THIS BEHAVIOUR replaces '+(M.it?'its':'her')+' placement and daily schedule in your draft (UNDO puts the old one back).'));box.append(pv);}}
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
 function rosterPersonality(e,current){
  const details=el('details','','me-check');
  const area=el('textarea','','',{'aria-label':'NPC personality JSON',rows:'10'});
  area.value=JSON.stringify(current||{about:'',personality:{},dialogue:{}},null,2);
  const message=el('p','','me-small',{role:'status'});
  details.append(el('summary','Edit NPC personality JSON'),area,message,btn('SAVE PERSONALITY JSON',async()=>{
   try{
    await ensureCompanionImporter();
    const profile=root.VoidVRCompanionStudio.profile(JSON.parse(area.value)),d=S().local();
    const character=d.characters?.[e.id];
    if(!character||!root.VoidMadeNPCs.validProfile(profile))throw Error('Use a valid personality profile for this world NPC.');
    d.characters[e.id]={...character,companionProfile:profile};
    S().saveLocal(d);
    status='Saved personality for '+e.name+' in the mission draft.';
    draw();
   }catch(err){message.textContent=err.message;}
  },'me-play'));
  return details;
 }
 function linesBox(main,e){const box=el('section','','me-check',{'data-npc-lines':e.id});box.append(el('h4','Lines & voice'),hint(HELP.lines));const own=S().local().characters?.[e.id],cp=own?.companionProfile;if(own?.relationships?.length){const rel=el('details');rel.append(el('summary','Transferred relationships'));for(const r of own.relationships)rel.append(el('p',r.target+' · '+r.type+' · '+r.activity+' · '+r.distance+' m'),...r.lines.map(t=>el('p',t)));box.append(rel);}if(cp){const profile=el('details');profile.append(el('summary','Transferred companion personality'),el('p',cp.about||'No description'),el('p','Walking speed and conversation initiative apply outside missions. Other traits are available as authoring reference.'));for(const [k,v] of Object.entries(cp.personality))profile.append(el('p',k+': '+v));for(const [k,v] of Object.entries(cp.dialogue)){if(v.length)profile.append(el('h5',k),...v.map(t=>el('p',t)));}box.append(profile);}if(own)box.append(rosterPersonality(e,cp));if(S().voicePanel)box.append(S().voicePanel(e.id,{redraw:draw,say:t=>{status=t;}}));
  const q=el('input','','',{'aria-label':'Find in the lines',placeholder:'Find words in the lines','data-npc-line-search':'1'});q.value=ui.lineSearch;const inner=el('div');
  q.oninput=()=>{ui.lineSearch=q.value;inner.replaceChildren();S().linesView(inner,e.id,{search:ui.lineSearch});};box.append(q,hint(HELP.lineSearch),inner);S().linesView(inner,e.id,{search:ui.lineSearch});main.append(box);}
 const download=(name,data)=>{const a=document.createElement('a');a.href=URL.createObjectURL(data instanceof Blob?data:new Blob([JSON.stringify(data,null,1)],{type:'application/json'}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500);};
 // ---------------------------------------------------------------- import a model (this browser only)
 function importPick(){const f=document.createElement('input');f.type='file';f.accept='.glb,.gltf,.vrcompanion,model/gltf-binary,model/gltf+json';f.dataset.npcImportFile='1';f.style.display='none';document.body.append(f);
  f.onchange=async()=>{const file=f.files&&f.files[0];f.remove();if(file)await importFile(file);};f.click();}
 // Load editor-only scripts once, even when more than one control needs them.
 const scriptLoads=new Map(),activeVoiceBatches=new Set();
 async function loadImportTools(...tools){
  for(const [prop,name] of tools){
   if(root[prop])continue;
   if(!scriptLoads.has(prop))scriptLoads.set(prop,new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src=name;
    script.onload=()=>root[prop]?resolve():reject(Error('Missing editor tool: '+name));
    script.onerror=()=>reject(Error('Could not load '+name));
    document.head.append(script);
   }));
   try{await scriptLoads.get(prop);}catch(err){scriptLoads.delete(prop);throw err;}
  }
 }
 async function ensureCompanionImporter(){
  await loadImportTools(['VoidVRCompanionStudio','void-runner/vr-companion-studio.js'],['VoidNPCCompanionImport','void-runner/npc-companion-import.js']);
  return root.VoidNPCCompanionImport;
 }
 async function loadVoiceBatch(){
  await ensureCompanionImporter();
  await loadImportTools(['VoidNPCVoices','void-runner/npc-voices.js'],['VoidNPCVoiceBatch','void-runner/npc-voice-batch.js']);
 }
 async function importFile(file){
  const ext=(file.name.match(/\.[a-z0-9]+$/i)||[''])[0].toLowerCase(),transfer=ext==='.vrcompanion';
  if(!transfer&&!X().IMPORT.exts.includes(ext)){status='Only .glb, .gltf or .vrcompanion files can be imported.';draw();return null;}
  let model=file, companion=null, original=null, modelName=file.name;
  try{
   if(transfer){
    const inspected=await(await ensureCompanionImporter()).inspect(file);
    model=inspected.model;original=file;modelName=inspected.id+'.glb';
    companion={id:inspected.id,name:inspected.name,sex:inspected.sex,about:inspected.about,
     personality:inspected.personality,dialogue:inspected.dialogue,worldBehavior:inspected.worldBehavior,
     relationships:inspected.relationships,residence:inspected.residence,roomPlan:inspected.roomPlan,
     voices:inspected.voices,motions:inspected.motions,
     animationNames:inspected.animationNames,warnings:inspected.warnings,voiceSelection:inspected.voiceSelection,
     dialogueLineCount:inspected.dialogueLineCount,recordedLineCount:inspected.recordedLineCount,
     missingVoiceLines:inspected.missingVoiceLines};
   }
   if(model.size>X().IMPORT.maxBytes)throw Error('Model exceeds the '+(X().IMPORT.maxBytes/1048576).toFixed(0)+' MB limit. Reduce it in Blender.');
   X().importDocument(await model.arrayBuffer(),transfer?'.glb':ext);
  }catch(err){status='Import refused: '+err.message;draw();return null;}
  const rec={id:'imp-'+crypto.randomUUID(),name:(companion?.name||file.name.replace(/\.[^.]+$/,'')).slice(0,60),
   fileName:modelName,sourceFileName:file.name,type:model.type||'model/gltf-binary',bytes:model.size,
   blob:model,transferBlob:original,companion,createdAt:new Date().toISOString(),
   licence:{source:'',type:'',noAI:null},placement:null,info:null};
  try{await dbPut(rec);await loadImports();}catch(err){status='Could not save the local import: '+err.message;draw();return null;}
  ui.id='import:'+rec.id;
  status='Imported '+file.name+' privately. Press SHOW 3D PREVIEW to check its model and animations.';
  root.VoidEditorGuide?.focusNext();draw();return rec;
 }
 async function saveRec(rec){await dbPut(rec);imports=imports.map(item=>item.id===rec.id?rec:item);}
 function useImportedProfile(companion){
  const characters=S().local().characters||{};
  const ids=Object.keys(characters);
  if(!ids.length)return null;
  const pane=el('details','','me-check');
  const select=el('select','','',{'aria-label':'World NPC for imported profile'});
  select.append(new Option('Choose a world NPC',''));
  for(const id of ids)select.append(new Option(characters[id].name,id));
  const message=el('p','','me-small',{role:'status'});
  const apply=btn('COPY PERSONALITY AND RECORDINGS TO DRAFT',async()=>{
   const id=select.value;
   if(!id){message.textContent='Choose an existing world NPC.';return;}
   if(!root.confirm('Replace the personality and dialogue pools for '+characters[id].name+' in your mission draft? Their existing recordings and model will be kept.'))return;
   apply.disabled=true;
   try{
    const profile=root.VoidVRCompanionStudio.profile(companion);
    if(!root.VoidMadeNPCs.validProfile(profile))throw Error('This personality is invalid for a world NPC.');
    await loadImportTools(['VoidVoiceImports','void-runner/voice-imports.js']);
    const V=root.VoidVoiceImports,active=new Set(Object.values(profile.dialogue).flat()),prepared=[];
    const existing=new Set(Object.values(S().local().clips||{}).map(r=>V.keyOf(r.who,r.text)));
    const seen=new Set();
    for(const voice of companion.voices||[]){
     const text=voice.record?.text,key=V.keyOf(id,text);
     if(!active.has(text)||existing.has(key)||seen.has(key))continue;
     const clip=await V.prepare(new File([voice.blob],voice.record.name||'companion-audio',{type:voice.record.type||''}));
     if(!clip.ok)throw Error(clip.why);
     prepared.push(V.record({...clip,who:id,text}));
     if(!await V.store(clip.hash,clip.type,clip.data,clip.duration))throw Error('Audio storage is unavailable.');
     seen.add(key);
    }
    const draft=S().local(),character=draft.characters?.[id];
    if(!character)throw Error('This world NPC was removed from the draft.');
    const clips={...draft.clips},kept=new Set(Object.values(clips).map(r=>V.keyOf(r.who,r.text)));
    for(const recording of prepared){
     const key=V.keyOf(id,recording.text);
     if(!kept.has(key))clips['companion-profile:'+key]=recording;
    }
    if(Object.keys(clips).length>V.LIMIT.clips)throw Error('This would exceed the draft recording limit.');
    draft.characters[id]={...character,companionProfile:profile};
    draft.clips=clips;
    S().saveLocal(draft);
    message.textContent='Saved in your draft. Test the world NPC in draft play or use Publish & versions to release the changes.';
   }catch(err){message.textContent=err.message;}
   finally{apply.disabled=false;}
  },'me-play');
  pane.append(el('summary','Use this profile on an existing world NPC'),select,apply,message);
  return pane;
 }
 function importDetail(main,rec,pv){
  main.append(el('p','LOCAL TEST ONLY · not in the live game · kept in this browser · '+rec.fileName+' · '+(rec.bytes/1048576).toFixed(1)+' MB','me-warn',{'data-npc-local-only':'1'}),hint(HELP.import));
  if(rec.companion){
   const p=rec.companion,summary=el('section','','me-check',{'data-npc-companion-profile':'1'});
   summary.append(el('h4','Imported companion profile'),el('p',p.about||'No personality description','me-small'),
    el('p',Object.values(p.dialogue||{}).reduce((n,arr)=>n+arr.length,0)+' dialogue entries · '+(p.recordedLineCount||0)+' recorded lines · '+(p.missingVoiceLines||[]).length+' missing voice lines','me-small'),
    el('p',(p.animationNames||[]).length+' model animations · '+(p.motions||[]).length+' companion motion files','me-small'));
   for(const warning of p.warnings||[])summary.append(el('p',warning,'me-warn'));
   if(p.motions?.length){
    const motions=el('select','','',{'aria-label':'Companion transfer animation'});
    p.motions.forEach((motion,i)=>motions.append(new Option(motion.name,String(i))));
    const motionStatus=el('p','','me-small',{role:'status'});
    summary.append(motions,btn('PREVIEW TRANSFER ANIMATION',async()=>{
     try{
      if(!ui.preview||ui.previewFor!=='import:'+rec.id)throw Error('Show the character in 3D first.');
      const motion=p.motions[Number(motions.value)],library='local-motion-'+rec.id+'-'+motions.value;
      const gltf=X().importDocument(await motion.blob.arrayBuffer(),'.glb');
      if(!gltf.skins?.length||!gltf.animations?.some(clip=>clip.name===motion.clip&&clip.channels?.length))throw Error('The motion has no matching rigged clip.');
      root.VoidAnimLibrary.registerLocal(library,motion.blob,[{id:library,clip:motion.clip,title:motion.name}]);
      const result=await ui.preview.tryLibrary(library,'import-preview',library);
      motionStatus.textContent=result.ok?'Playing '+motion.name:result.why;
     }catch(err){motionStatus.textContent=err.message;}
    }),motionStatus);
   }
   const audio=el('details','','me-check');
   audio.append(el('summary','Recorded dialogue'));
   const available=(p.voices||[]).filter(v=>Object.values(p.dialogue||{}).some(lines=>lines.includes(v.record?.text)));
   if(available.length){
    const clips=el('select','','',{'aria-label':'Recorded companion line'});
    available.forEach((v,i)=>clips.append(new Option(v.record.text,String(i))));
    const playbackStatus=el('p','','me-small',{role:'status'});
    audio.append(clips,btn('PLAY RECORDING',async()=>{
     try{
      const voice=available[Number(clips.value)];
      const url=URL.createObjectURL(new Blob([voice.blob],{type:voice.record.type||voice.blob.type}));
      const player=new Audio(url),release=()=>URL.revokeObjectURL(url);
      player.onended=player.onerror=release;
      try{await player.play();}catch(err){release();throw err;}
      playbackStatus.textContent='Playing recording.';
     }catch(err){playbackStatus.textContent=err.message;}
    }),playbackStatus);
   }else audio.append(el('p','No recordings match the current dialogue.'));
   summary.append(audio);
   summary.append(el('p','Personality, recordings and motion attachments are stored privately in this browser. ElevenLabs generation below requires an authorized developer and an explicit confirmation. Publishing remains a separate step.','me-small'));
   const detail=el('details','','me-check',{'data-npc-companion-personality':'1'});
   detail.append(el('summary','Edit personality and dialogue JSON (local draft)'));
   const area=el('textarea','','',{'aria-label':'Personality JSON',rows:'12','data-npc-personality-json':'1'});
   area.value=JSON.stringify({about:p.about||'',personality:p.personality||{},dialogue:p.dialogue||{}},null,2);
   detail.append(area,hint('Paste the ChatGPT JSON here, then validate and save. This edits only this private model draft. Existing recordings are kept; changed dialogue lines are marked missing.'));
   const importError=el('p','','me-bad',{'data-npc-personality-error':'1'});detail.append(importError);
   const row=el('div','','me-row me-actions');
   row.append(btn('COPY CHATGPT PROMPT',async()=>{
    try{
     await ensureCompanionImporter();
     const studio=root.VoidVRCompanionStudio;
     const template={about:'600 characters maximum',personality:Object.fromEntries(Object.entries(studio.ranges).map(([k,v])=>[k,v[0]])),dialogue:Object.fromEntries(studio.pools.map(k=>[k,[]]))};
     const prompt='Create a personality and dialogue for a Void Runner NPC named '+rec.name+'. Return ONLY a JSON object matching this template. Include 3–5 concise, non-explicit lines in each dialogue pool. Keep the description below 600 characters, all numeric settings within the documented ranges, and respect declined invitations. Adapt the personality to my instructions.\\nBehavior ranges: '+JSON.stringify(studio.ranges)+'\\nTemplate: '+JSON.stringify(template,null,2);
     await navigator.clipboard.writeText(prompt);status='Copied the ChatGPT personality prompt for '+rec.name+'.';
    }catch(err){status='Could not copy the prompt: '+err.message;}draw();
   },'',{'data-npc-personality-prompt':'1'}));
   row.append(btn('VALIDATE & IMPORT JSON',async()=>{
    if(activeVoiceBatches.has(rec.id)){importError.textContent='Wait for voice generation to finish.';return;}
    try{
     await ensureCompanionImporter();
     const profile=root.VoidVRCompanionStudio.profile(JSON.parse(area.value));
     const all=[...new Set(Object.values(profile.dialogue).flat())];
     const recorded=new Set((rec.companion.voices||[]).map(v=>v.record?.text).filter(t=>all.includes(t)));
     Object.assign(rec.companion,profile,{dialogueLineCount:all.length,recordedLineCount:recorded.size,
      missingVoiceLines:all.filter(line=>!recorded.has(line))});
     await saveRec(rec);
     status='Saved personality JSON for '+rec.name+' in this browser only; '+rec.companion.missingVoiceLines.length+' voice lines need recording.';
     draw();
    }catch(err){importError.textContent='Personality JSON not imported: '+err.message;}
   },'me-play',{'data-npc-personality-import':'1'}));
   detail.append(row);summary.append(detail);
   // Private batch preparation: no paid ElevenLabs generation occurs in the browser.
   const voiceBox=el('details','','me-check',{'data-npc-voice-batch':'1'});
   voiceBox.append(el('summary','Voices · ElevenLabs missing-line batch'));
   const voiceId=el('input','','',{'aria-label':'ElevenLabs voice ID (20 characters)',maxlength:'20',placeholder:'ElevenLabs voice ID'});
   voiceId.value=p.voiceSelection?.voiceId||'';
   const selection=()=>({kind:'elevenlabs',voiceId:voiceId.value.trim(),model:'eleven_v4'});
   voiceBox.append(el('p','Select an ElevenLabs voice ID for Eleven v4. Preview shows the lines without recordings and the estimated cost.','me-small'),voiceId);
   const voiceStatus=el('p','','me-small',{'data-npc-voice-batch-status':'1'});
   voiceBox.append(btn('PREVIEW MISSING VOICES',async()=>{
    try{
     if(activeVoiceBatches.has(rec.id))return;
     await loadVoiceBatch();
     if(activeVoiceBatches.has(rec.id))return;
     const voice=selection();
     const planned=root.VoidNPCVoiceBatch.plan(p,{id:p.id,recordings:(p.voices||[]).map(v=>v.record),voice});
     if(!planned.canGenerate)throw Error('Enter a valid 20-character ElevenLabs voice ID.');
     p.voiceSelection=voice;
     await saveRec(rec);
     voiceStatus.textContent=planned.existing+' existing · '+planned.missing+' missing of '+planned.total+
      ' unique lines · estimated '+planned.estimate.credits+' credits (actual billing may differ). No voices have been generated.';
    }catch(err){voiceStatus.textContent='Cannot preview voice batch: '+err.message;}
   },'',{'data-npc-voice-batch-preview':'1'}),voiceStatus);
   // Generate only on an explicit, owner-confirmed click. The backend holds the ElevenLabs key.
   // Each successful line is saved immediately, so a failed batch can resume missing-only.
   voiceBox.append(btn('GENERATE ALL MISSING VOICES',async()=>{
    if(activeVoiceBatches.has(rec.id))return;
    const dev=DTX();
    if(!dev?.authorized||typeof dev.request!=='function'){voiceStatus.textContent='Developer authentication is required.';return;}
    activeVoiceBatches.add(rec.id);
    voiceId.disabled=true;
    try{
     await loadVoiceBatch();
     await loadImportTools(['VoidVoiceImports','void-runner/voice-imports.js']);
     const voice=selection();
     const current=()=>root.VoidNPCVoiceBatch.plan(rec.companion,{id:rec.companion.id,
      recordings:(rec.companion.voices||[]).map(v=>v.record),voice});
     const preview=current();
     if(!preview.canGenerate)throw Error('Enter a valid 20-character ElevenLabs voice ID.');
     if(!preview.missing){voiceStatus.textContent='Every dialogue line already has a recording.';return;}
     if(!root.confirm('Generate '+preview.missing+' missing ElevenLabs recordings for '+rec.name+
      '? Estimated '+preview.estimate.credits+' credits; actual credits depend on your ElevenLabs plan. Existing recordings will not be replaced.'))return;
     let saved=0;
     try{
      for(const job of preview.jobs){
       if(!DTX()?.authorized||DTX()?.request!==dev.request)throw Error('Developer session changed; batch stopped.');
       const now=current();
       if(!now.jobs.some(x=>x.text===job.text))continue;
       if(!Object.values(rec.companion.dialogue||{}).flat().includes(job.text))throw Error('Dialogue changed; batch stopped.');
       if(job.speakText.length>700)throw Error('One dialogue line exceeds the 700-character generation limit.');
       voiceStatus.textContent='Generating '+(saved+1)+' of '+preview.missing+' missing voice lines…';
       const output=await dev.request('developer/companion-voice',{voiceId:voice.voiceId,text:job.speakText});
       if(!DTX()?.authorized||DTX()?.request!==dev.request)throw Error('Developer session changed; batch stopped.');
       const bytes=Uint8Array.from(atob(output.audio||''),c=>c.charCodeAt(0));
       const file=new File([bytes],job.id+'.mp3',{type:'audio/mpeg'});
       const prepared=await root.VoidVoiceImports.prepare(file);
       if(!prepared.ok||!await root.VoidVoiceImports.store(prepared.hash,prepared.type,prepared.data,prepared.duration))
        throw Error('Generated audio could not be stored; the batch was stopped.');
       if(!current().jobs.some(x=>x.text===job.text))continue;
       const voices=[...(rec.companion.voices||[]),{
        record:root.VoidVoiceImports.record({...prepared,who:rec.companion.id,text:job.text}),
        blob:new Blob([prepared.data],{type:prepared.type})
       }];
       const updatedCount=root.VoidNPCVoiceBatch.plan(rec.companion,{
        id:rec.companion.id,recordings:voices.map(v=>v.record),voice
       });
       const companion={...rec.companion,voices,voiceSelection:voice,recordedLineCount:updatedCount.existing,
        missingVoiceLines:updatedCount.jobs.map(line=>line.text)};
       await saveRec({...rec,companion});
       Object.assign(rec.companion,companion);
       imports=imports.map(item=>item.id===rec.id?rec:item);
       saved++;
      }
      const remaining=current().missing;
      voiceStatus.textContent=saved+' recordings generated and saved privately. '+remaining+' lines still missing. Use the normal package/publish workflow to make voices available to players.';
     }catch(err){voiceStatus.textContent=saved+' saved. Batch stopped: '+err.message;}
    }catch(err){voiceStatus.textContent='Could not generate: '+err.message;}
    finally{activeVoiceBatches.delete(rec.id);voiceId.disabled=false;}
   },'me-play',{'data-npc-voice-batch-generate':'1'}));
   voiceBox.append(el('p','Eleven v4 uses the existing developer-authorized voice endpoint. This generates and saves private recordings only; publishing NPC assets and voice clips is still a separate approval step.','me-warn'));
   summary.append(voiceBox);
   const world=useImportedProfile(p);if(world)summary.append(world);
   main.append(summary);
  }
  const file=rec.blob;const e={id:'import:'+rec.id,onInfo:async info=>{rec.info={triangles:info.triangles,bytes:rec.bytes,textures:info.textures,bones:info.bones,rest:info.rest,clips:info.clips,height:info.height};await saveRec(rec);draw();}};
  previewBox(main,e,null,[],pv,file);
  const ck=el('section','','me-check',{'data-npc-checklist':rec.id});ck.append(el('h4','Checklist'),hint(HELP.check));
  const verdict=rec.info?X().importCheck(rec.info):null;
  if(!verdict)ck.append(el('p','Press SHOW 3D PREVIEW to measure the model.','me-small me-warn'));else for(const it of verdict.items)ck.append(el('p',(it.level==='ok'?'✓ ':it.level==='warn'?'△ ':'✗ ')+it.text,it.level==='ok'?'me-ok':it.level==='warn'?'me-warn':'me-bad',{'data-npc-check':it.level}));
  main.append(ck);
  const compatible=el('section','','me-check');compatible.append(el('h4','Compatible game animations (preview)'),hint('Candidates are matched by skeleton and rest pose. Try each on the preview before using it. Nothing is published.'));
  if(!rec.info?.rest)compatible.append(el('p','Show the model in 3D to scan its skeleton.','me-small'));
  else if(!root.VoidNPCClipIndex){const load=btn('SCAN GAME ANIMATIONS',async()=>{load.disabled=true;try{const r=await fetch('void-runner/npc-clip-index.json',{cache:'no-cache'});if(!r.ok)throw new Error('HTTP '+r.status);root.VoidNPCClipIndex=await r.json();draw();}catch(err){status='Could not read animation index: '+err.message;draw();}});compatible.append(load);}
  else{const offers=X().importClips(rec.info),select=el('select','','',{'aria-label':'Compatible game animation'});for(const o of offers)select.append(new Option(o.name+' — '+o.asset,o.id));const result=el('p',offers.length+' compatible candidates (runtime confirmation required).','me-small');compatible.append(result,select,btn('TRY ANIMATION',async()=>{if(!ui.preview||ui.previewFor!==e.id){result.textContent='Show me in 3D first.';return;}const r=await ui.preview.tryLibrary(select.value,e.id);result.textContent=r.ok?'Preview passed: '+select.value:r.why;},'',offers.length?{}:{disabled:''}));}
  main.append(compatible);
  const nm=el('section','','me-check');const ni=el('input','','',{'aria-label':'Name of the model','data-npc-import-name':rec.id,maxlength:rec.companion?'40':'60'});ni.value=rec.name||'';ni.onchange=async()=>{rec.name=ni.value.trim().slice(0,rec.companion?40:60);if(rec.companion)rec.companion.name=rec.name;await saveRec(rec);draw();};
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
  const r=el('div','','me-row me-actions');r.append(btn('ADD TO THE GAME (DOWNLOAD THE PACKAGE)',async()=>{
   try{
    let companionExport=null;
    if(rec.transferBlob){
     const importer=await ensureCompanionImporter();
     companionExport=await importer.repack(rec.transferBlob,{...rec.companion,name:rec.name});
    }
    download(rec.fileName,rec.blob);
    if(companionExport)download(rec.sourceFileName,companionExport);
    download((rec.name||'model').replace(/[^\w-]+/g,'-')+'-package.json',packageOf(rec));
    status='Downloaded model, '+(companionExport?'updated companion transfer with current voices and personality, and ':'')+'integration package. No character was published.';
   }catch(err){status='Cannot export companion package: '+err.message;}
   draw();
  },'me-play',{'data-npc-add-to-game':rec.id,...(ready?{}:{disabled:'',title:'Fill in the name and the licence questions first (and the checklist must pass).'})}),hint(HELP.addToGame));lic.append(r);
  lic.append(btn('Delete this model (from this browser)',async()=>{if(!confirm('Delete '+rec.fileName+' from this browser? You can press UNDO straight after.'))return;const keep=rec;await dbDel(rec.id);await loadImports();ui.id=null;status='Deleted '+keep.fileName+'.';ui.undo=async()=>{await dbPut(keep);await loadImports();ui.id='import:'+keep.id;};draw();},'me-x',{'data-npc-import-delete':rec.id}));
  main.append(lic);}
 function packageOf(rec){const I=rec.info||{};return {format:'darknet-district-npc-import',version:1,exportedAt:new Date().toISOString(),name:rec.name,fileName:rec.fileName,
  model:{triangles:I.triangles|0,bytes:rec.bytes|0,textures:I.textures||[],joints:(I.bones||[]).length,bones:(I.bones||[]).slice(0,80),clips:I.clips||[],height:Number.isFinite(I.height)?Math.round(I.height*100)/100:null},
  caps:{maxTriangles:X().IMPORT.maxTriangles,target:X().IMPORT.target,maxBytes:X().IMPORT.maxBytes,texWarn:X().IMPORT.texWarn},checklist:I.triangles!=null?X().importCheck(I).items:[],
  companion:rec.companion?{id:rec.companion.id,about:rec.companion.about,personality:rec.companion.personality,dialogue:rec.companion.dialogue,dialogueLineCount:rec.companion.dialogueLineCount,recordedLineCount:rec.companion.recordedLineCount,missingVoiceLines:rec.companion.missingVoiceLines,originalPackage:rec.sourceFileName,voiceAndMotionFiles:'Included only in original .vrcompanion transfer'}:null,
  placement:rec.placement||null,licence:{source:rec.licence?.source||'',type:rec.licence?.type||'',noAI:rec.licence?.noAI},
  note:'Local test import from Developer Tools > NPCs. Not in the live game. Check the licence before committing; a licensed or unknown-licence model never goes into the public repository; a No AI model is processed locally only (never Meshy or any AI tool).'};}
 // ---------------------------------------------------------------- PLAY THIS DRAFT for a placement (and the local test of an imported model)
 /* opts: {plan} a placement to try instead of the draft's (a pasted recipe, not saved yet); {minute} the in-game time of day to start at (default: the block being edited). */
 async function playNpc(e,opts={}){const Sx=S();try{root.sessionStorage.setItem(RETURN,JSON.stringify({npc:e.id,at:Date.now()}));}catch{}
  if(e.kind!=='import'){const whole=opts.plan||plan(e.id),bi=opts.plan?null:blockOf(e.id),minute=Number.isFinite(opts.minute)?opts.minute:bi!=null?X().toMin(whole.schedule[bi].from):null;
   let p=whole;if(whole&&Array.isArray(whole.schedule)&&Number.isFinite(minute)){const k=X().blockAt(whole.schedule,minute);if(k>=0)p=whole.schedule[k];}
   const M=X().MOVABLE[e.id]||{},t=p&&p.mode==='stay'?p:p&&p.mode==='path'&&p.points[0]?p.points[0]:M.home||root.VoidStreetPair?.SEAT||{x:104,z:-6};
   const pet=e.id===root.VoidStreetPair?.CAT_ID;
   return Sx.jumpTo(t.x,t.z,pet?null:e.id,M.name+(p&&p.mode==='path'?' walks your route':p&&p.mode==='stay'?' stays at your spot':'')+(Number.isFinite(minute)?' · in-game '+X().hhmm(minute):''),RETURN,{...(opts.plan?{npcs:{[e.id]:opts.plan}}:{}),...(Number.isFinite(minute)?{minute}:{})});}
  const rec=e.rec,p=rec.placement,t=p.mode==='stay'?p:p.points[0];const r=await Sx.jumpTo(t.x,t.z,null,rec.name+' (local test only)',RETURN);if(r&&r.started)setTimeout(()=>spawn(rec).catch(err=>{try{announce('The imported model could not be shown: '+err.message);}catch{}}),400);}
 /* The imported model in the test session: loaded from this browser into the game's scene, scaled to a person's height if it is far off, and moved by a small loop. */
 async function spawn(rec){const B=root.BABYLON,scene=root.VoidBabylon?.scene;if(!scene)throw new Error('no scene');await root.VoidNPCPreview.loaders();const buf=await rec.blob.arrayBuffer(),ext=/\.gltf$/i.test(rec.fileName)?'.gltf':'.glb';
  X().importDocument(buf,ext);const c=await B.SceneLoader.LoadAssetContainerAsync('',ext==='.gltf'?new TextDecoder().decode(buf):new Uint8Array(buf),scene,null,ext);c.addAllToScene();const n=new B.TransformNode('npc-import-'+rec.id,scene);
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
  if(e.kind==='roster'&&X().MOVABLE[e.id]){const p=curPlan(e.id),w=plan(e.id);if(w&&Array.isArray(w.schedule))w.schedule.forEach((b,k)=>{if(X().toMin(b.from)==null||X().toMin(b.to)==null)needs.push({sel:'[data-npc-block-time="from:'+k+'"]',text:'give time block '+(k+1)+' its times'});});if(p&&p.mode==='path'){if(p.points.length<2)needs.push({sel:'[data-npc-map] canvas',text:p.points.length?'click the pavement for the next point (at least 2)':'click the pavement for the first point'});
    p.points.forEach((q,i)=>{if(X().spotProblems(e.id,q).length)needs.push({sel:'[data-npc-point="'+i+'"] td:nth-child(2) span',text:'move point '+(i+1)+' onto the green ground'});});}
   if(p&&p.mode==='stay'){if(!p.actions.length)needs.push({sel:'[data-npc-stay-actions] input',text:'tick at least one thing she does there'});if(X().spotProblems(e.id,p).length)needs.push({sel:'[data-npc-map] canvas',text:'put the spot on the green ground'});}
   return Gd.show(sc,needs,{done:p||w?{sel:'[data-npc-play="'+CSS.escape(e.id)+'"]',text:'PLAY THIS DRAFT'}:null,box:sc.querySelector('[data-npc-place]')});}
  if(e.kind==='import'){const r=e.rec,L=r.licence||{};if(!r.info)needs.push({sel:'[data-npc-preview-go]',text:'show the preview (it runs the checklist)'});if(!String(r.name||'').trim())needs.push({sel:'[data-npc-import-name]',text:'give it a name'});
   if(r.info&&!X().importCheck(r.info).ok){Gd.clear(sc);return null;}
   if(!r.placement)needs.push({sel:'[data-npc-place] [data-npc-mode]',text:'choose STAY HERE or ROUTE'});else if(r.placement.mode==='path'&&r.placement.points.length<2)needs.push({sel:'[data-npc-map] canvas',text:'click the pavement for the route points'});
   if(!L.source)needs.push({sel:'[data-npc-lic="source"]',text:'where the model is from'});if(!L.type)needs.push({sel:'[data-npc-lic="type"]',text:'the licence type'});if(L.noAI!==true&&L.noAI!==false)needs.push({sel:'[data-npc-noai="true"]',text:'answer “No AI licence?”'});
   return Gd.show(sc,needs,{done:{sel:'[data-npc-add-to-game]',text:'ADD TO THE GAME'},box:sc.querySelector('[data-npc-licence]')});}
  Gd.clear(sc);return null;}
 root.VoidNPCEditor={startMake:()=>{startMake();if(host&&!host.hidden&&DTX()?.tab==='npcs')draw();},make:()=>ui.make,render,draw,guideNow,importFile,packageOf,spawn,get ui(){return ui;},get imports(){return imports;},lookOf,entries,HELP,spawned:null};
})(globalThis);
