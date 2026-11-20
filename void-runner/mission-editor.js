/* DEVELOPER TOOLS > MISSION EDITOR (browser only; loaded on demand when the tab is opened by a server-confirmed developer; UI visibility is not authorization,
   every private read and write is checked by the API). The owner asked for it on 17 Nov 2026: every mission tree, the NPCs in it, what each NPC says, what has to be done,
   where it ends, and what becomes available; plus every NPC's lines outside missions. Data: mission-trees.js (read-only extraction). Edits: the owner's DRAFT, saved as
   he types (this browser; the beginner campaign in the Content Studio's own draft so both tools edit one draft). PLAY THIS DRAFT uses the same adapter as publishing
   (mission-content.js) in a throwaway test session (dev-test.js). PUBLISH TO ALL PLAYERS and RE-VOICE go through owner-only server routes that are off until switched on. */
(function(root){
 'use strict';
 const DTX=()=>typeof VoidDevTools!=='undefined'?VoidDevTools:null;   // dev-tools.js declares it with const (not a window property)
 const T=()=>root.VoidMissionTrees,MC=()=>root.VoidMissionContent,SM=()=>root.StudioModel,G=()=>root.VoidMissionGivers,MS=()=>root.VoidMainStory;
 const KEY='mission-editor-drafts-v1',STUDIO='studio-drafts-v1',RETURN='mission-editor-return';
 const el=(tag,text,cls,attrs)=>{const e=document.createElement(tag);if(text!==undefined&&text!==null)e.textContent=text;if(cls)e.className=cls;for(const [k,v] of Object.entries(attrs||{}))e.setAttribute(k,v);return e;};
 const btn=(text,fn,cls,attrs)=>{const b=el('button',text,cls,{type:'button',...(attrs||{})});b.onclick=e=>{e.preventDefault();fn(e);};return b;};
 /* SHORT HELP (the owner, 18 Nov 2026: "give me a short description on things in the editor so I have an idea how each setting works"): one or two plain lines
    under each setting (small grey text); a select also shows what the chosen option does, and its "?" lists every option. */
 const HELP={
  number:'The mission’s number, shown as “Mission 004 — Name” in the V1. A number is used once only, never again, even after its mission is removed.',
  title:'The name the player sees in the V1 Mission Log and in the NEW MISSION notice. E.g. “Eyes on the Street”.',
  rewards:'Credits paid to the player once, when the mission is done. 0 = nothing. E.g. 100.',
  description:'The longer text under the name in the V1 Mission Log, read while the mission is on.',
  category:'A short label shown with the mission in the Mission Log, e.g. “Main storyline” or “Side job”. Only a label: it changes nothing else.',
  objective:'The one-line headline in the Mission Log, e.g. “Photograph Juno Vex”. Left empty, the Log shows the current step instead.',
  location:'A label for the Mission Log (where the mission happens). It does NOT move anyone and does not start anything: people stay where the game puts them. To make Reverie or Lace wait somewhere, use “Giver waits at”.',
  giver:'Who offers the mission (only people with a TALK prompt in the game). Changing the giver also moves the offer lines to the new giver.',
  type:'What kind of mission it is (main, side, cargo …), for sorting in the Mission Log. It does not change how it plays.',
  offer:'What the giver says when offering it, one line per box. Text only (no voice) until it is recorded.',
  steps:'What the player has to do, in order. Each step starts when the one before it is done; the yellow arrow leads to it.',
  label:'How the V1 Mission Log shows this step while the player is on it, e.g. “Talk to Lace on The Avenue”.',
  ending:'Optional: someone the player must go back to at the end (an extra “Hand in to …” step). Nobody: the mission ends with its last step.',
  endingLabel:'How the Mission Log shows the hand-in step. Empty: “Hand in to <name>”.',
  branches:'A design note for later: the game does not offer mission choices yet, so missions run in order.',
  unlocks:'What the player gets or what opens, when the mission is done or at a step: credits, a story flag, a new place, a ship, a V1 contact, a Social follow, another tree.',
  sender:'Who the message, call or banner is from (their name is shown with it).',header:'The top line of the message or banner, e.g. ADMIN // INCOMING MESSAGE.',body:'The words of the message, call or banner.',
  distance:'How close the player must walk to that person, in metres (1 to 30). 5 m is a few steps away.',flag:'A story flag and the value it must have. Another mission sets it with the unlock “Story flag” (e.g. mf_metLace = true).',
  hours:'How long after the chosen mission is done, in IN-GAME time (12 in-game minutes pass for every real minute of play).',afterMission:'The mission that must be finished first.',
  waitAt:'Pick the area on the map (anywhere green in the city or inside the District; never Milked, NULL, the District bar or the VR area). While this mission waits to be offered (and she is out on her shift), she goes to this spot (in another area she is simply there from the start of her shift) and waits there with her normal routine: stands, looks about, checks her V1 (and sits if the spot is just in front of a ledge). Once it is accepted or done she goes back to her usual walk. Not set: she keeps her usual walk.',
  play:'Tries this mission in a throwaway test session. Your real save is never touched; LEAVE DRAFT brings you back here.',
  playStart:'PLAY FROM THE START OF THIS TREE: a throwaway test session with the whole tree reset (no mission of it started, its story flags, follow / lead / cab steps, timers and apartments cleared), beginning with the first mission exactly as a player meets it: its giver to talk to, its message, banner or walked-near start. Finish it and the next mission comes as it would for a player. Your real save is never touched; LEAVE DRAFT brings you back here.'};
 const HELP_START={person:'The giver offers it when the player walks up and presses TALK. E.g. Admin offers it as soon as you talk to him at the counter.',
  'person-accept':'The giver offers it and the player chooses ACCEPT or DENY (the buttons and what DENY does are set below). By default DENY changes nothing: the next talk offers it again.',
  near:'No talking needed: when the player walks within the distance below (5 m if not set) of the giver, the mission starts by itself: a short banner shows, it goes into the Mission Log, and the giver says what you write for the offer. Nothing to press.',
  'near-accept':'When the player walks within the distance below of the giver, the giver offers it and the player chooses ACCEPT or DENY. Nothing starts until ACCEPT.',
  messages:'It arrives as a text in the V1 Messages app when the trigger below happens. No conversation needed.',comms:'It arrives as a call in the V1 Comms app (the words show as a transcript) when the trigger below happens.',
  notify:'Only a banner on the screen, then it is in the Mission Log. Nothing is kept in Messages or Comms.'};
 const HELP_WHEN={'pod-exit':'When the player first leaves their Sleeping Pod (EXIT POD). E.g. Admin’s first message.','after-mission':'As soon as the mission you pick is finished.',
  place:'As the player walks into the place you pick, e.g. into NULL.',leave:'As the player walks out of the place you pick.',flag:'When a story flag gets the value you set (another mission’s unlock sets it).',
  near:'When the player walks within the distance you set of that person, without talking. Follows people who move (Reverie, Lace).',
  'game-time':'A while after a mission is done, in IN-GAME time: 6 in-game hours is about 30 minutes of play.'};
 const HELP_STEP={talk:'Done when the player talks to that person (walks up, presses TALK). The lines below are said then.',go:'Done when the player reaches that area, e.g. The Avenue.',
  arrive:'Done when the player has flown there and docked (needs a ship and the place open for travel).',deliver:'Done when the player talks to the recipient after the earlier steps (no real parcel).',
  buy:'Done when the player buys that item at the outfitter or Admin’s counter.','pod-exit':'Done when the player leaves their Sleeping Pod (EXIT POD).',enter:'Done while the player is inside that place (already being inside counts).',
  leave:'Done when the player is outside that place.',photo:'Done when the player takes a V1 photo that clearly shows that person (in frame, within 15 m, nothing in the way).',
  'send-photo':'Done when the player sends the right photo to that person in V1 Messages (unlimited tries).',message:'Done by itself as the mission’s notification arrives (only for a mission that starts by notification).',
  'await-call':'Done by itself right after the step before it; the call itself comes from a later mission.',hear:'Shows the giver’s lines right after the talk step before it; done when the player closes the conversation.',
  'follow-them':'The person walks to the spot you pick on the map and the player follows; they wait when the player falls behind. Done when both are at the spot.','they-follow':'The person follows the player to the spot you pick on the map. Done when both are there.',
  'their-cab':'The person calls a street taxi to the stop you choose; the player boards with them. Done when both get out at the stop.','shared-cab':'The person gets into the player’s taxi to the stop you choose. Done when both get out at the stop.',
  'apt-enter':'Done while the player is inside one of this mission’s apartments (add it under “Apartments for this mission” above the steps).','apt-use':'Done when the player uses the thing you choose in that apartment (E): computer, utility panel, safe, vending machine, closet or light switch.',
  hack:'Done when the player hacks the access point beside the door you choose (E, then a progress bar for the seconds you set).'};
 const HELP_APT='Put an apartment behind a street door for THIS mission only. Pick its style, then its street door (click a door on the map or choose it from the list). The player who has this mission finds that door open: it leads into a hallway of that style, and one of the hallway’s doors (the number you give, or the building’s own) leads into the apartment. Everyone else finds the door locked. It is open from the mission’s start (or from the step you choose) until the mission ends. A mission can have up to 4.';
 const HELP_VIA={talk:'The lines show in the conversation window when the step is done (the player is with them).',comms:'The NPC calls the player’s V1 (Comms app) as the step is done: the words as a transcript.',messages:'The NPC texts the player’s V1 Messages as the step is done.'};
 const hint=(text,attrs)=>el('span',text,'me-help',attrs);
 /* The chosen option's help under a select, and a "?" that lists every option's help. */
 function optHelp(sel,map,label){const span=hint('',{'data-me-help-for':sel.getAttribute('aria-label')||''}),upd=()=>{span.textContent=map[sel.value]||'';};upd();sel.addEventListener('change',upd);
  const d=el('details','','me-help-all');d.append(el('summary','?','',{title:'What each choice means','aria-label':'What each choice means: '+(label||sel.getAttribute('aria-label')||'')}));const ul=el('ul');
  for(const o of sel.options)if(o.value&&map[o.value]){const li=el('li');li.append(el('b',o.textContent.replace(/ — needs a code change$/,'')+': '),document.createTextNode(map[o.value]));ul.append(li);}d.append(ul);return [d,span];}
 const read=(k,fallback,where=root.localStorage)=>{try{const v=JSON.parse(where.getItem(k)||'null');return v??fallback;}catch{return fallback;}};
 const write=(k,v,where=root.localStorage)=>{try{where.setItem(k,JSON.stringify(v));return true;}catch{return false;}};
 const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
 let built=null,index=null,refs=null,src=null,clipKeys=new Set(),host=null,headNode=null,loading=null,status='',givers=[],items=new Set(),stale=false;
 const ui={mode:'trees',tree:'main-storyline',mission:null,step:null,npc:'admin',flow:false,check:null};
 const server={roles:null,live:null,queue:null,drafts:null,note:{}};
 // ---------------------------------------------------------------- drafts (saved on every edit)
 /* The draft. The main storyline is always in it: until the owner edits it, the shipped tree (main-story.js) is shown; his first edit saves his copy. */
 function local(){const raw=readDraft(),d=raw&&raw.version===1?{missions:{},lines:{},played:{},trees:[],names:{},retiredNumbers:[],npcs:{},animRequests:[],voices:{},looks:{},characters:{},...raw}:{version:1,missions:{},lines:{},played:{},trees:[],names:{},retiredNumbers:[],npcs:{},animRequests:[],voices:{},looks:{},characters:{}};
  const S=MS();if(S){const own=d.trees.find(t=>t.id===S.TREE_ID);if(!own)d.trees.unshift(S.trees()[0]);
   // A copy saved before a shipped mission existed (Mission 002, 17 Nov 2026) gets that mission, where it stands in the shipped tree, unless its number was removed in the draft.
   // The tree's old default name "Main storyline" becomes "Awakening" (the owner calls it the Awakening Tree; the id never changes). Saved with the next edit.
   else{if(own.name===S.OLD_NAME)own.name=S.TREE.name;S.trees()[0].missions.forEach((m,i)=>{if(!own.missions.some(x=>x.id===m.id)&&!(d.retiredNumbers||[]).includes(m.number))own.missions.splice(Math.min(i,own.missions.length),0,m);});
   // A step still holding lines the owner later changed in the shipped game (002's call, before the zoom line) takes the shipped text; his own edits are kept.
   if(S.refreshShipped)S.refreshShipped(own);}}
  return d;}
 // ---- mission numbers: the ledgers (shipped, published), every number in the draft, and numbers retired in the draft are all "used"; the next free one is one past them all.
 const serverNumbers=()=>Object.fromEntries(Object.entries(server.live?.numbers||{}).map(([k,v])=>[Number(k),v]));
 const ledger=()=>({...(MS()?.NUMBERS||{}),...serverNumbers()});
 function nextFree(d=local()){return MS().nextNumber(d.trees,ledger(),Object.fromEntries((d.retiredNumbers||[]).map(n=>[n,'retired'])));}
 const numLabel=(n,t)=>MS()?MS().label(n,t):t;
 /* Missions made before numbers existed get the next free numbers, in order (once, saved). */
 function numberAll(){const d=local();let changed=false;for(const t of d.trees)for(const m of t.missions)if(!Number.isInteger(m.number)){m.number=nextFree(d);changed=true;}if(changed)saveLocal(d);return changed;}
 /* Every save is one step of the session's UNDO (editor-home.js; Developer Tools > UNDO / Ctrl+Z): the stored text before and after. */
 const rawOf=k=>{try{return root.localStorage.getItem(k);}catch{return null;}};
 const undoRecord=(k,before)=>{try{root.VoidEditorHome?.record(k,before,rawOf(k));}catch{}};
 function saveLocal(d){syncMade(d);const before=rawOf(KEY);d.version=1;d.savedAt=new Date().toISOString();if(!write(KEY,d))storageProblem='Your draft could NOT be saved in this browser (storage full or blocked). Press EXPORT MY EDITS now to keep a file, then free some space (or allow site storage) and edit again.';else{storageProblem='';undoRecord(KEY,before);}scheduleServer();}
 /* UNDO / REDO put a stored draft back (editor-home.js): never recorded again, saved to the server copy like any edit. */
 function restoreRaw(k,raw){if(k!==KEY&&k!==STUDIO)return false;try{if(raw==null)root.localStorage.removeItem(k);else root.localStorage.setItem(k,raw);}catch{return false;}stale=true;if(k===KEY)syncMade();if(k===KEY)scheduleServer();return true;}
 /* Drafts are never discarded silently: a draft this version cannot read is copied to a backup key first, and the editor says so. */
 let storageProblem='',backupNote='';
 function readDraft(){let raw=null;try{raw=root.localStorage.getItem(KEY);}catch{return null;}if(raw==null)return null;
  try{const d=JSON.parse(raw);if(d&&typeof d==='object'&&d.version===1)return d;}catch{}
  const bk=KEY+'.backup-'+Date.now();try{if(!Object.keys(root.localStorage).some(k=>k.startsWith(KEY+'.backup-')&&root.localStorage.getItem(k)===raw))root.localStorage.setItem(bk,raw);}catch{}
  backupNote='A draft in this browser could not be read; it was kept unchanged under '+bk+' (nothing was deleted). EXPORT it from the browser\'s storage or ask Claude/Codex to restore it.';return null;}
 // ---- the server copy of the whole draft (Stage 3B private draft "mission-editor-workspace"; the owner, 17 Nov 2026: a cleared browser must not lose his trees)
 const WS='mission-editor-workspace',ws={state:'unknown',revision:0,savedAt:null,timer:0,conflict:null,note:''};
 const bundle=()=>{const d=local(),x={version:1,savedAt:d.savedAt||new Date().toISOString(),missions:d.missions,lines:d.lines,played:d.played,names:d.names,npcs:d.npcs||{},animRequests:d.animRequests||[],voices:d.voices||{},looks:d.looks||{},clips:d.clips||{},...(d.characters&&Object.keys(d.characters).length?{characters:d.characters}:{}),retiredNumbers:d.retiredNumbers||[],trees:d.trees.filter(t=>!(t.shipped&&t.id===MS()?.TREE_ID&&JSON.stringify(t)===JSON.stringify(MS().trees()[0])))};const st=studio();if(st)x.studio=st;return x;};
 const wsDoc=b=>({schemaVersion:1,kind:'workspace',adapter:'mission-editor',sourceKey:WS,baseRevision:0,data:{id:WS,title:'Mission Editor workspace',bundle:b}});
 const wsOn=()=>!!(server.roles?.roles?.editor&&server.roles.roles.draftsEnabled);
 function scheduleServer(){if(!wsOn()||ws.conflict)return;clearTimeout(ws.timer);ws.state='pending';showServerState();ws.timer=setTimeout(()=>{saveServer();},5000);}
 async function saveServer(){clearTimeout(ws.timer);if(!wsOn()||ws.conflict)return;ws.state='saving';showServerState();
  try{const rec=await call('developer/drafts/'+WS,{revision:ws.revision,document:wsDoc(bundle())});ws.revision=rec.revision;ws.savedAt=Date.now();ws.state='saved';ws.note='';}
  catch(e){if(e.status===409){await loadServer(true);}else if(e.status===413){ws.state='too-big';ws.note='Your draft is too big for the server copy (96 KB at most). It is still saved in this browser; EXPORT MY EDITS keeps a file.';}else{ws.state='off';}}
  showServerState();}
 const treesOf=b=>(b&&b.trees||[]).filter(t=>!t.shipped).length;
 /* On open: an empty (or older) browser draft takes the server copy; a newer server copy over a browser draft with content is never applied silently: both are shown. */
 async function loadServer(afterConflict){if(!wsOn()){ws.state='off';return;}
  let rec=null;try{rec=await call('developer/drafts/'+WS);}catch(e){if(e.status===404){ws.state=afterConflict?'off':'none';if(!afterConflict)scheduleServer();return;}ws.state='off';return;}
  ws.revision=rec.revision||0;const b=rec.document&&rec.document.data&&rec.document.data.bundle;if(!b){ws.state='saved';return;}
  const raw=readDraft(),empty=!raw||(!(raw.trees||[]).some(t=>!t.shipped)&&!Object.keys(raw.missions||{}).length&&!Object.keys(raw.lines||{}).length&&!Object.keys(raw.names||{}).length&&!Object.keys(raw.npcs||{}).length&&!Object.keys(raw.voices||{}).length&&!Object.keys(raw.looks||{}).length&&!Object.keys(raw.clips||{}).length&&!Object.keys(raw.characters||{}).length);
  const serverAt=Date.parse(b.savedAt||'')||0,localAt=Date.parse((raw&&raw.savedAt)||'')||0;
  if(empty&&!afterConflict){useServer(b,rec.updatedAt);return;}
  if(serverAt>localAt||afterConflict){ws.conflict={server:b,serverAt,local:raw,localAt,revision:rec.revision};ws.state='conflict';return;}
  ws.savedAt=(rec.updatedAt||0)*1000;ws.state='saved';if(localAt>serverAt)scheduleServer();}
 function useServer(b,at){const d={version:1,missions:b.missions||{},lines:b.lines||{},played:b.played||{},names:b.names||{},npcs:b.npcs||{},animRequests:b.animRequests||[],voices:b.voices||{},looks:b.looks||{},clips:b.clips||{},characters:b.characters||{},retiredNumbers:b.retiredNumbers||[],trees:b.trees||[],savedAt:b.savedAt};write(KEY,d);if(b.studio)write(STUDIO,b.studio);
  ws.state='saved';ws.savedAt=(at||0)*1000||Date.now();ws.conflict=null;status='Restored your drafts from the server (saved '+new Date(Date.parse(b.savedAt)||Date.now()).toLocaleString()+').';stale=true;syncMade();}
 function serverLine(){if(ws.conflict){const c=ws.conflict;return 'Your drafts on the server and in this browser differ.';}
  return ws.state==='saved'?'Saved on the server · '+new Date(ws.savedAt||Date.now()).toLocaleTimeString():ws.state==='pending'||ws.state==='saving'?'Saving to the server…':ws.state==='too-big'?ws.note:ws.state==='none'?'Saving to the server…':'Server copy not available — drafts are only in this browser';}
 function showServerState(){const n=host&&host.querySelector('[data-me-server-copy]');if(n){n.textContent=serverLine();n.className='me-small '+(ws.state==='saved'?'me-ok':'me-warn');}}
 function conflictBox(){const c=ws.conflict,box=el('section','','me-check',{'data-me-conflict':'1'});box.append(el('h4','Two copies of your drafts'),el('p','The server copy and this browser’s copy differ. Nothing was overwritten. Choose which one to keep; the other stays readable as an older server revision or in EXPORT MY EDITS.','me-warn'));
  const r=el('div','','me-row');r.append(btn('USE THE SERVER COPY (saved '+new Date(c.serverAt||0).toLocaleString()+', '+treesOf(c.server)+' tree(s) of yours)',()=>{exportEdits();useServer(c.server,c.serverAt/1000);ws.revision=c.revision;draw();},'',{'data-me-use-server':'1'}),
   btn('KEEP THIS BROWSER’S COPY (saved '+(c.localAt?new Date(c.localAt).toLocaleString():'unknown')+', '+treesOf(c.local)+' tree(s) of yours)',()=>{ws.conflict=null;ws.revision=c.revision;status='Kept this browser’s copy; it replaces the server copy (the older one stays as a server revision).';saveServer();draw();},'',{'data-me-keep-local':'1'}));box.append(r);return box;}
 const shipped=()=>root.VoidLiveContent?.env?.shipped||{beginner:root.VoidBeginner?.MISSIONS||[],registry:root.VoidMissions?.definitions||{}};
 function studio(){const d=read(STUDIO,null);return d&&Array.isArray(d.missions)?d:null;}
 function studioEnsure(){return studio()||{missions:clone(shipped().beginner),summary:'',savedAt:new Date().toISOString()};}
 function saveStudio(d){const before=rawOf(STUDIO);d.savedAt=new Date().toISOString();if(write(STUDIO,d))undoRecord(STUDIO,before);}
 function editOf(key){return local().missions[key]||{};}
 function setEdit(key,fn,name){const d=local(),e=d.missions[key]||{};fn(e);e.name=name||e.name;for(const k of Object.keys(e))if(e[k]==null||(typeof e[k]==='object'&&!Array.isArray(e[k])&&!Object.keys(e[k]).length)||(Array.isArray(e[k])&&!e[k].length))delete e[k];
  if(Object.keys(e).filter(k=>k!=='name').length)d.missions[key]=e;else delete d.missions[key];saveLocal(d);}
 /* MISSION GIVERS MADE IN THE EDITOR (npc-made.js, Developer Tools > NPCs > Create a mission giver): the draft's characters join the giver roster at once (a draft giver)
    and are movable (npc-paths.js setMade: their placement uses the NPCs tab's map). One that is not finished yet (no name, no place ...) is listed but cannot give a
    mission yet, with the plain reason (mission-content.js madeNeeds). Run on every save, UNDO and load. */
 function syncMade(d){if(!src)return;d=d||local();const X=root.VoidNPCPaths;try{X?.setMade?.(d.characters||{});}catch{}
  const list=G().roster({registry:src.registry,people:src.people,story:root.VoidStoryContent?.characters||{},temple:src.temple,characters:d.characters||{},npcs:d.npcs||{}});
  for(const g of list)if(g.made){const n=MC().madeNeeds?MC().madeNeeds(d,list,g.id):[];if(n.length){g.canTalk=false;g.draft=false;g.players=false;g.why='not finished yet: '+n[0].replace(/^[^:]+: /,'');}}
  givers=list;src.givers=givers;stale=true;}
 // ---------------------------------------------------------------- loading the game data
 const getJSON=async(url)=>{try{const r=await fetch(url,{cache:'no-cache'});return r.ok?await r.json():null;}catch{return null;}};
 const getText=async(url)=>{try{const r=await fetch(url,{cache:'no-cache'});return r.ok?await r.text():null;}catch{return null;}};
 async function load(){
  const files={};await Promise.all(T().FILES.concat(['void-runner/story-content.js']).map(async f=>{const t=await getText(f);if(t!=null)files[f]=t;}));
  const [registry,manifest,extraManifest,enginesFile]=await Promise.all([getJSON('tools/audio/npc-voice-registry.json'),getJSON('void-runner/assets/audio/voice/manifest.json'),getJSON('void-runner/assets/audio/voice/extra/manifest.json'),getJSON('tools/audio/revoice-engines.json')]);
  const sh=shipped();src={missions:sh.registry,beginner:sh.beginner,content:root.VoidContent,campaign:root.VoidCampaign||root.C,story:root.VoidStoryContent,registry,manifest,extraManifest,enginesFile,engines:enginesFile&&enginesFile.characters||null,files,milked:root.VoidMilked,
   modules:root.VoidProgression?.modules,ships:root.VoidShips?.ships,locations:root.VoidUniverse?.locations,stores:SM().STORES,people:root.VoidDistrictPeople?.npcs?.()||[],temple:root.VoidTemple?.MODEL||{id:'zen-zephyr',name:'Zen Zephyr'}};
  syncMade();items=new Set(Object.keys(G().buyable(src.modules)));
  clipKeys=new Set([...Object.values(manifest?.lines||{}),...Object.values(extraManifest?.lines||{})].map(l=>l.speaker+'|'+l.text));
  rebuild();refs=T().refs(src);
  await refreshServer();await loadServer();if(numberAll())rebuild();else if(stale)rebuild();
 }
 function rebuild(){const d=local();built=T().build({...src,voices:d.voices||{},studioDraft:studio(),serverDrafts:server.drafts,ownerTrees:d.trees,names:d.names});index=T().lineIndex(built);stale=false;}
 /* Every PLAY / PLAY THIS DRAFT / PLAY FROM HERE / Test my mission / JUMP THERE / publish check starts here (19 Nov 2026 fix: a PLAY pressed straight after typing in a step
    checked the tree drawn before the typing and said "step 1 needs what the player must do"): the field being typed in hands over its value (its change event),
    the waiting Guide me pass runs now, and the trees are rebuilt from the saved draft, so the check sees exactly what was typed. */
 function fresh(){try{const a=root.document&&document.activeElement;if(a&&host&&host.contains(a)&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))a.blur();}catch{}if(src)rebuild();if(guideT){clearTimeout(guideT);guideT=0;guideNow();}}
 async function call(path,body){const r=typeof VoidDevTools!=='undefined'?VoidDevTools.request:null;if(!r)throw new Error('Sign in again.');return r(path,body);}
 async function refreshServer(){
  const tries=[['roles','developer/drafts/schema'],['live','developer/live-content'],['queue','developer/revoice']];
  await Promise.all(tries.map(async([k,p])=>{try{server[k]=await call(p);server.note[k]='';}catch(e){server[k]=null;server.note[k]=e.status===404?'off':e.status===403?'not-authorized':e.status===503?'off':'unreachable';}}));
  // Lines recorded since they were queued (their clip now ships with the game) are marked done in the queue.
  const shipped_=(server.queue?.items||[]).filter(q=>q.status==='queued'&&q.engine==='kokoro'&&clipKeys.has(q.who+'|'+q.text)).map(q=>q.id);
  if(shipped_.length){try{server.queue=await call('developer/revoice/done',{ids:shipped_});}catch{}}
  if(server.roles?.roles?.editor&&server.roles.roles.draftsEnabled){try{server.drafts=((await call('developer/drafts')).drafts||[]).filter(x=>x.id!==WS);}catch{server.drafts=null;}}
  rebuild();
 }
 // ---------------------------------------------------------------- what is shown and how edits are stored
 const findMission=key=>{for(const t of built.trees)for(const m of t.missions)if(m.key===key)return {tree:t,mission:m};return null;};
 const lineEdit=l=>l.kind==='beginner'?null:local().lines[l.ref]||null;
 const shownText=l=>{const e=lineEdit(l);return e?e.to:l.text;};
 function setLine(l,text,unlocked){
  if(l.kind==='beginner'){const st=studioEnsure(),[mid,oid,kind,k]=l.key.slice(9).split('/'),m=st.missions.find(x=>x.id===mid),o=m&&m.objectives.find(x=>x.id===oid);if(o&&o[kind]&&o[kind][k]){o[kind][k].text=text;saveStudio(st);}return;}
  if(l.kind==='tree'){const [mid,a,b,c]=l.key.slice(5).split('/');editTree(treeOf(mid),t=>{const m=t.missions.find(x=>x.id===mid);if(!m)return;const list=a==='offer'?m.offer:a==='ending'?m.ending.say:(m.objectives.find(o=>o.id===a)||{})[b];const k=Number(a==='offer'||a==='ending'?b:c);if(list&&list[k])list[k].text=text;});return;}
  if(l.kind==='design'){const st=studioEnsure(),mid=l.key.slice(9).split('/')[0],m=st.missions.find(x=>x.id===mid),k=Number(l.key.split('/').pop());if(m&&m.offer&&m.offer[k]){m.offer[k].text=text;saveStudio(st);}return;}
  const d=local(),prev=d.lines[l.ref]||{};if(text===l.text&&!(unlocked??prev.unlocked))delete d.lines[l.ref];else d.lines[l.ref]={who:l.who,from:l.text,to:text,adapter:l.adapter,source:l.source,...((unlocked??prev.unlocked)?{unlocked:true}:{})};saveLocal(d);}
 const V=()=>root.VoidNPCVoices;
 const voiceNow=id=>V()?V().current(id,{registry:src&&src.registry,engines:src&&src.engines,voices:local().voices}):{kind:'none'};
 const canVoice=l=>!!(l&&l.who!=='player'&&(l.voice||voiceNow(l.who).kind==='elevenlabs'));
 /* ElevenLabs voice tags (19 Nov 2026): what a voice is sent (npc-voices.js speakText: tags kept only for a model that reads them), so adding or changing a tag is a
    change only for those voices; players see the line without them (sh). */
 const sayKey=(who,t)=>V()?V().speakText(t,voiceNow(who)):String(t||''),sh=t=>V()?V().strip(t):t;
 const queueItem=(who,text)=>{const k=sayKey(who,text);return (server.queue?.items||[]).find(q=>q.who===who&&(q.speak||q.text)===k)||null;};
 const TAG_HELP='You can add ElevenLabs voice tags like [whispers] or [laughs]. Players never see them; only ElevenLabs voices use them.';
 function tagNotes(t,who,name){const X=V();if(!X||!t||!String(t).includes('['))return [];const out=X.tagProblems(t);if(!out.length&&who&&who!=='player'&&who!=='You'){const w=X.tagWarning(t,voiceNow(who),name);if(w)out.push(w);}return out;}
 const tagNoteEl=(t,who,name)=>{const n=tagNotes(t,who,name);return el('p',n.join(' '),'me-small me-warn',{'data-me-tag-note':'1',...(n.length?{}:{hidden:''})});};
 const tagNoteSet=(node,t,who,name)=>{const n=tagNotes(t,who,name);node.textContent=n.join(' ');node.hidden=!n.length;};
 function voiceState(l){const t=shownText(l),edited=sayKey(l.who,t)!==sayKey(l.who,l.text),q=queueItem(l.who,t);
  if(l.who==='player')return {text:'the player’s own line (not voiced)',cls:'muted'};
  if(l.needsVoice){if(q)return q.status==='done'?{text:'re-voiced',cls:'ok'}:{text:'queued for voice',cls:'warn'};return t.trim()?{text:'needs voice (text only until recorded)',cls:'warn',revoice:canVoice(l)}:{text:'empty: a placeholder, not spoken',cls:'muted'};}
  if(edited&&clipKeys.has(l.who+'|'+sh(t))&&!(V()&&V().hasTags(t)&&V().readsTags(voiceNow(l.who))))return {text:'re-voiced',cls:'ok'};
  if(q)return q.status==='done'?{text:'re-voiced',cls:'ok'}:q.engine==='elevenlabs'?{text:'waiting for ElevenLabs re-voice (needs approval)',cls:'warn'}:{text:'queued for re-voice',cls:'warn'};
  if(edited&&l.recorded)return {text:'voice clip out of date: text only until re-voiced',cls:'bad',revoice:true};
  if(edited)return {text:'text only',cls:'muted',revoice:canVoice(l)};
  return l.recorded?{text:'voice clip recorded'+(l.clip?.engine==='elevenlabs'?' (ElevenLabs)':''),cls:'ok'}:{text:'text only (no voice clip)',cls:'muted'};}
 // Imported voice files (voice-imports.js, 19 Nov 2026): a line's own imported file wins over any recorded clip; words changed since the import are flagged.
 {const base=voiceState;voiceState=function(l){const r=l&&clipRec(lineKey(l)),x=r&&VI()?VI().status(r,shownText(l)):null;return x?{text:x.text,cls:x.cls,revoice:x.state==='changed'?base(l).revoice:false,imported:x.state}:base(l);};}
 // ---------------------------------------------------------------- rendering
 function render(panel,head){
  host=panel;headNode=head;
  if(!built){panel.innerHTML='';panel.append(head(),el('p','Loading every mission tree from the game data…','dev-note'));loading=loading||load().then(()=>{restoreReturn();draw();}).catch(e=>{panel.append(el('p','The Mission Editor could not load ('+e.message+'). Check your connection, then press CLOSE and open Developer tools again. Your draft is safe in this browser.','me-bad'));});return;}
  draw();
 }
 function restoreReturn(){const r=read(RETURN,null,root.sessionStorage);if(!r)return;try{root.sessionStorage.removeItem(RETURN);}catch{}Object.assign(ui,{mode:'trees',tree:r.tree||ui.tree,mission:r.mission||null,step:r.step||null});status='Back from your draft play. Your draft is saved and waiting'+(r.mission?' on this mission':'')+'.';}
 function draw(){
  if(!host||!built)return;if(stale)rebuild();const keepY=host.scrollTop;host.innerHTML='';host.append(headNode());
  const root_=el('div','','me-root',{id:'me-root'});host.append(root_);root_.addEventListener('input',()=>{syncPlay(root_);guideSoon();});root_.addEventListener('change',()=>{syncPlay(root_);guideSoon();});
  root_.append(howBox());
  {const sc=el('p','','me-small',{'data-me-server-copy':'1',role:'status'});root_.append(sc);setTimeout(showServerState,0);}
  for(const t of [storageProblem,backupNote])if(t)root_.append(el('p',t,'me-bad',{'data-me-storage-problem':'1'}));
  if(ws.conflict)root_.append(conflictBox());
  // One-time note (17 Nov 2026): the owner made his own tree "Awakening" before Mission 001 shipped. It is never deleted or merged for him.
  if(local().trees.some(t=>t.id==='draft-awakening')&&!read('mission-editor-note-awakening',false)){const n=el('div','','me-check',{'data-me-awakening-note':'1'});n.append(el('p','Mission 001 — Awakening is now in Main storyline. Your draft \'Awakening\' is separate; delete it if you no longer need it.'),btn('OK',()=>{write('mission-editor-note-awakening',true);draw();}));root_.append(n);}
  const modes=el('nav','','me-modes',{'aria-label':'Mission Editor views'});for(const [id,name] of [['trees','Mission trees'],['npcs','All lines for an NPC'],['publish','Publish & versions']]){const b=btn(name,()=>{if(id==='npcs'){openNpcTab(ui.npc);return;}ui.mode=id;ui.check=null;draw();},ui.mode===id?'on':'',{'data-me-mode':id,'aria-pressed':String(ui.mode===id)});modes.append(b);}
  {const g=root.VoidEditorGuide;if(g)modes.append(g.toggle(()=>guideNow()));}
  root_.append(modes);if(status)root_.append(el('p',status,'me-status',{role:'status',id:'me-status'}));
  if(ui.mode==='npcs'){ui.mode='trees';openNpcTab(ui.npc);return;}else if(ui.mode==='publish')publishView(root_);else treeView(root_);
  host.scrollTop=keepY;setTimeout(guideNow,0);
 }
 function howBox(){const pubOn=!!server.live?.enabled,box=el('details','','me-how',{'aria-label':'How edits reach the live game'});box.open=!!ui.howOpen;box.ontoggle=()=>{ui.howOpen=box.open;};
  box.append(el('summary','How your edits reach the game: saved as a DRAFT as you type · PLAY THIS DRAFT never touches your real save · PUBLISH TO ALL PLAYERS: '+(pubOn?'ON':'OFF on the server')+' · RE-VOICE queue: '+(server.queue?'ON':'OFF on the server')+'  (click for details)'));
  const ul=el('ul');
  ul.append(el('li','Every edit is saved as a DRAFT as you type (in this browser). Nobody else sees it.'));
  ul.append(el('li','PLAY THIS DRAFT tries your draft in a throwaway test session. Your real save is never touched; LEAVE DRAFT brings you back here with the draft intact.'));
  ul.append(el('li',pubOn?'PUBLISH TO ALL PLAYERS is switched on: after a check screen, your draft goes to every player the next time their game loads. UNDO puts the previous version back.':'PUBLISH TO ALL PLAYERS is switched OFF on the server ('+(server.note.live==='not-authorized'?'this account is not the configured content editor':'waiting for you to switch it on')+'). Until then edits stay drafts.'));
  ul.append(el('li',server.queue?'RE-VOICE adds a changed line to the re-voice queue; you record it on your PC (Kokoro) or, for Admin, in ElevenLabs once approved.':'RE-VOICE queue: switched off on the server. Changed lines are shown as text until re-voiced.'));
  ul.append(el('li','Lines marked “needs a code change” are kept in your draft and in EXPORT MY EDITS for Claude or Codex to apply.'));
  box.append(ul);return box;}
 // ---------------- trees
 function treeView(root_){
  const cols=el('div','','me-cols');const side=el('aside','','me-side',{'aria-label':'Mission trees'});
  const groups=[['active','ACTIVE in the current game'],['historical','HISTORICAL (not reachable in the current game)'],['draft','DRAFTS'],['archived','Removed from the game (archived)']];
  side.append(el('p',built.counts.trees+' trees · '+built.counts.missions+' missions · '+built.counts.lines+' lines ('+built.counts.locked+' from your scripts)','me-small'));
  side.append(btn('+ NEW MISSION TREE',()=>{ui.newTree=true;root.VoidEditorGuide?.focusNext();draw();},ui.newTree?'on':'',{'data-me-new-tree':'1'}));
  for(const [st,name] of groups){const ts=built.trees.filter(t=>t.status===st);if(!ts.length)continue;
   // Archived trees sit in one collapsed group (open while one of them is shown): readable and copyable, never in the game.
   let box=side;if(st==='archived'){const d=el('details','','me-archived',{'data-me-archived':'1'});d.open=!!ui.archivedOpen||ts.some(t=>t.id===ui.tree);d.ontoggle=()=>{ui.archivedOpen=d.open;};d.append(el('summary',name+' ('+ts.length+')','me-group'),el('p','Not in the game. Kept so you can read them and copy them into a new tree.','me-small'));side.append(d);box=d;}
   else side.append(el('h4',name,'me-group'));
   for(const t of ts){const b=btn(t.title+' ('+t.missions.length+')',()=>{ui.tree=t.id;ui.mission=null;ui.step=null;ui.newTree=false;draw();},ui.tree===t.id?'on':'',{'data-me-tree':t.id});box.append(b);
    if(ui.tree===t.id)for(const m of t.missions){const mb=btn(m.title+(editCount(m)?' ✎':''),()=>{ui.mission=m.key;ui.step=null;draw();},'me-mission'+(ui.mission===m.key?' on':''),{'data-me-mission':m.key});box.append(mb);}}}
  const t=built.trees.find(x=>x.id===ui.tree)||built.trees[0];const main=el('div','','me-main');
  if(ui.newTree){main.append(newTreeForm());cols.append(side,main);root_.append(cols);return;}
  if(t.ownerTree){main.append(ownerTreePanel(t));cols.append(side,main);root_.append(cols);if(ui.mission){const target=root_.querySelector('[data-me-tree-mission="'+CSS.escape(ui.mission.replace(/^tree:/,''))+'"]');if(target&&ui.scrollTo)setTimeout(()=>target.scrollIntoView({block:'start'}),0);ui.scrollTo=false;}return;}
  main.append(el('h3',t.title),el('p',t.statusText,'me-badge me-'+t.status),el('p',t.note,'dev-note'),el('p','Source: '+t.source,'me-small'));
  if(t.archived){const r=el('div','','me-row',{'data-me-archived-tree':t.id});r.append(el('b','NOT IN THE GAME','me-bad'),btn('COPY THIS TREE INTO A NEW TREE',()=>copyInto(t.missions,t.title),'',{'data-me-copy-tree':t.id}));main.append(r);}
  {const r=el('div','','me-row');const i=el('input','','',{'aria-label':'Tree name','data-me-rename':t.id,placeholder:t.originalTitle,maxlength:'60'});i.value=t.title;i.oninput=()=>{const d=local();T().renameTree(d,t.id,i.value,t.originalTitle);saveLocal(d);stale=true;setStatus('Draft saved. Tree name: “'+(i.value.trim()||t.originalTitle)+'” (the id '+t.id+' never changes).');};
   r.append(el('b','Tree name'),i,el('span','id '+t.id+' (never changes)'+(t.title!==t.originalTitle?' · was “'+t.originalTitle+'”':''),'me-small'));main.append(r);}
  main.append(npcTable(t));
  if(t.id==='beginner'||t.id==='draft-studio'){const sw=el('div','','me-row');sw.append(btn(ui.flow?'Back to the step editor':'Flow chart (same as the Content Studio)',()=>{ui.flow=!ui.flow;draw();},'',{'data-me-flow':'1'}));main.append(sw);
   if(ui.flow&&root.StudioFlow){const box=el('div','','me-flow');main.append(box);flowChart(box);cols.append(side,main);root_.append(cols);return;}}
  const m=t.missions.find(x=>x.key===ui.mission)||t.missions[0];if(m){ui.mission=m.key;if(t.archived){const r=el('div','','me-row');r.append(btn('COPY THIS MISSION INTO A NEW TREE',()=>copyInto([m],m.title),'',{'data-me-copy-mission':m.key}));main.append(r);}main.append(missionPanel(t,m));}
  cols.append(side,main);root_.append(cols);
  if(ui.step){const target=root_.querySelector('[data-me-step="'+CSS.escape(ui.step)+'"]');if(target)setTimeout(()=>target.scrollIntoView({block:'center'}),0);}
 }
 function flowChart(box){
  let draft=studioEnsure().missions;const npcNames=()=>new Set(Object.values(src.registry?.npcs||{}).map(n=>n.displayName));
  const interactions=new Set([...(root.VoidNeoChinatown?.layout('interior').interactions||[]),...(root.VoidNeoChinatown?.layout('street').interactions||[])].map(i=>i.id));
  root.StudioFlow.board(box,{draft:()=>draft,setDraft:v=>{draft=v;},persist:()=>{const st=studioEnsure();st.missions=draft;saveStudio(st);rebuild();},redraw:()=>draw(),npcNames,ctx:()=>({interactions,npcs:npcNames()}),base:()=>clone(shipped().beginner),summary:()=>studio()?.summary||'',resetSummary:()=>{}});
 }
 /* An archived tree or mission → a new draft tree (the archived one never changes). */
 function copyInto(ms,name){const d=local();const t=T().copyToTree(d.trees,ms,{name:('Copy of '+name).slice(0,60),givers,next:nextFree(d)});d.trees.push(t);saveLocal(d);stale=true;ui.tree=t.id;ui.mission=null;status='Copied into your new tree “'+t.name+'” ('+t.id+'). It is a draft: not in the game until you publish it. Check each step’s NPC.';draw();}
 // no status line on screen yet: add one in place (a full redraw here took the typing focus away after the first character typed in a freshly drawn editor)
 const setStatus=t=>{status=t;const s_=host&&host.querySelector('#me-status');if(s_){s_.textContent=t;return;}const m=host&&host.querySelector('#me-root > .me-modes');if(m)m.after(el('p',t,'me-status',{role:'status',id:'me-status'}));else if(host)draw();};
 // ---------------- the owner's NEW trees
 const treeOf=mid=>(local().trees||[]).find(t=>t.missions.some(m=>m.id===mid))?.id;
 function editTree(id,fn,redraw){const d=local(),t=(d.trees||[]).find(x=>x.id===id);if(!t)return;fn(t,d);saveLocal(d);stale=true;if(redraw)draw();else setStatus('Draft saved.');}
 const giver=id=>givers.find(g=>g.id===id)||null;
 const PLACE_ENTER=id=>{const p=G().PLACE.get(id);if(!p){const n=root.VoidPlaces?.node(id);return n&&n.enter?{...n.enter}:null;}if(p.location)return {location:p.location};if(p.area==='interior')return {walk:'darknet-district'};if(p.quarter)return {walk:'sacramento',quarter:p.quarter};return {walk:'sacramento',quarter:id==='milked'?'far-south':'avenue'};};
 /* The NPC picker: every registered NPC, grouped "in the current District game" and "earlier characters (not in the District today)". */
 function npcSelect(value,on,{label,empty,attrs}={}){const sel=el('select','','',{'aria-label':label||'NPC',...(attrs||{})});sel.append(new Option(empty||'— choose —',''));
  for(const [grp,name] of [['district','In the current District game'],['earlier','Earlier characters (not in the District today)']]){const og=el('optgroup','',null,{label:name});
   for(const g of givers.filter(x=>x.group===grp))og.append(new Option(g.name+(g.name.toLowerCase()!==g.id?' ('+g.id+')':'')+(!g.canTalk?' — cannot be talked to yet':!g.players?' — players cannot reach today':''),g.id));sel.append(og);}
  sel.value=value||'';sel.onchange=()=>on(sel.value);return sel;}
 function placeSelect(value,on,label,flights,attrs){const sel=el('select','','',{'aria-label':label||'Place',...(attrs||{})});sel.append(new Option('— choose a place —',''));for(const p of G().PLACES.filter(p=>!flights||p.location))sel.append(new Option((refs.locations[p.id]||p.name)+(p.players?'':' — players cannot reach today'),p.id));
  if(!flights&&root.VoidPlaces){const og=el('optgroup','',null,{label:'Named places (System › Planet › City › Area › Venue › Exact location)'});for(const o of root.VoidPlaces.options())if(o.selectable&&!G().PLACE.has(o.id)){const opt=new Option(placeText(o,2),o.id);opt.title=o.label;og.append(opt);}sel.append(og);}
  sel.value=value||'';sel.onchange=()=>on(sel.value);return sel;}
 /* The place registry by hierarchy (places.js): System › Planet › City › Area › Venue › Exact location (18 Nov 2026: every walkable spot is named). For "Enter / leave a
    place" steps and triggers. Each option shows its level and, for a working name not yet chosen by the owner, "(working name)"; hovering shows the whole chain, and the
    chosen place's whole chain is the select's tooltip. */
 const placeText=(o,k)=>'\u00a0'.repeat(o.depth*k)+o.name+' · '+(((root.VoidPlaces?.LEVELS||[]).find(l=>l.id===o.level)||{}).name||o.level).toLowerCase()+(o.proposed?' (working name)':'');
 function regionSelect(value,on,label,attrs){const sel=el('select','','',{'aria-label':label||'Place',...(attrs||{})});sel.append(new Option('— choose a place —',''));
  for(const o of (root.VoidPlaces?.options()||[])){const opt=new Option(o.selectable?placeText(o,3):'\u00a0'.repeat(o.depth*3)+o.name+' ('+(o.level==='system'?'system':'group')+')',o.id);opt.title=o.label;if(!o.selectable)opt.disabled=true;sel.append(opt);}
  const tip=()=>{sel.title=root.VoidPlaces?.label?.(sel.value)||'';};sel.value=value||'';tip();sel.onchange=()=>{tip();on(sel.value);};return sel;}
 /* One or more people who must ALL be in the same photo (Mission 002: Juno Vex and Halden Reyes): a tick box per person the camera identifies. The first ticked is the
    step's main person (npc / subject: the arrow leads to them); with two or more the step keeps the list in `subjects`. */
 function subjectsPicker(list,on,label,attrs){const box=el('span','','me-subjects',{role:'group','aria-label':label||'Who must be in the photo',...(attrs||{})}),cur=(list||[]).filter(Boolean);
  for(const g of G().photoSubjects(givers)){const l=el('label','','me-small'),c=el('input','','',{type:'checkbox',value:g.id,'data-me-subject':g.id});c.checked=cur.includes(g.id);
   c.onchange=()=>on(c.checked?[...cur.filter(x=>x!==g.id),g.id]:cur.filter(x=>x!==g.id));l.title=g.where||'';l.append(c,' '+g.name);box.append(l);}
  if(cur.length>1)box.append(el('span','· all of them in the same photo','me-small'));return box;}
 const photoPeople=o=>Array.isArray(o.subjects)&&o.subjects.length?o.subjects:[o.kind==='photo'?o.npc:o.subject].filter(Boolean);
 const setPhotoPeople=(x,list,key)=>{x[key]=list[0]||'';if(list.length>1)x.subjects=list.slice();else delete x.subjects;};
 function itemSelect(value,on,attrs){const sel=el('select','','',{'aria-label':'Item to buy',...(attrs||{})});sel.append(new Option('— choose an item a store sells —',''));for(const [id,n] of Object.entries(G().buyable(src.modules)))sel.append(new Option(n,id));sel.value=value||'';sel.onchange=()=>on(sel.value);return sel;}
 function newTreeForm(){const box=el('section','','me-mission-panel',{'data-me-new-tree-form':'1'});box.append(el('h3','New mission tree'),el('p','A new tree is your DRAFT: nobody else sees it. Its id is made from the first name you give it (draft-…) and never changes; you can rename the tree any time.','dev-note'));
  const name=el('input','','',{'aria-label':'New tree name',placeholder:'Tree name (your words)',maxlength:'60','data-me-new-name':'1'}),note=el('textarea','','',{'aria-label':'Short note',placeholder:'Short note (optional)',rows:'2','data-me-new-note':'1'});
  const l1=el('label','','me-field');l1.append(el('span','Name'),name);const l2=el('label','','me-field');l2.append(el('span','Short note'),note);box.append(l1,l2);
  const row=el('div','','me-row');row.append(btn('CREATE TREE',()=>{if(!name.value.trim()){setStatus('Give the tree a name first: type it in the Name box, then press CREATE TREE.');return;}const d=local();const t=T().newTree(d.trees,{name:name.value,note:note.value});d.trees.push(t);saveLocal(d);stale=true;ui.newTree=false;ui.tree=t.id;ui.mission=null;status='Created “'+t.name+'” ('+t.id+'). Add its first mission.';root.VoidEditorGuide?.focusNext();draw();},'',{'data-me-create-tree':'1'}),btn('CANCEL',()=>{ui.newTree=false;draw();}));box.append(row);return box;}
 function capabilityBox(raw){const c=T().capability(raw,{givers,items,trees:local().trees}),box=el('section','','me-check',{'data-me-capability':'1'});box.append(el('h4','What this tree can do today'));
  const ul=el('ul');ul.append(el('li','Draft and EXPORT MY EDITS: always (saved in this browser as you type).'));
  ul.append(el('li','PLAY THIS DRAFT: '+(c.total?c.play+' of '+c.total+' mission(s) can be played now.':'add a mission first.')));
  ul.append(el('li','PUBLISH TO ALL PLAYERS: '+(c.total?c.publish+' of '+c.total+' mission(s) would reach players':'nothing yet')+(server.live?.enabled?'.':' (publishing is switched OFF on the server until you switch it on).')));
  ul.append(el('li','The game can run: steps “talk to”, “go to a place”, “enter / leave a place”, “fly to / arrive at”, “deliver to”, “buy an item”, “photograph someone”, “send a photo to someone” and “wait for their call”; lines said in person, as a Comms call or as a message; unlocks: credits, story flags, open route / place, grant ship, start tree, reputation with an NPC or a faction, add to the V1 contacts, follow on Social; starting in person (with or without ACCEPT / NOT NOW) or by notification (also “after in-game time”). Everything else is kept in your draft and marked “needs a code change”.'));box.append(ul);
  for(const x of c.skipped)box.append(el('p','• “'+x.title+'” '+(x.partial?'':'cannot run yet: ')+x.why.join('; ')+'.','me-warn'));
  if((local().trees||[]).some(x=>x.id!==raw.id&&x.missions.some(m=>(m.unlocks||[]).some(u=>u.kind==='tree'&&u.id===raw.id))))box.append(el('p','This tree is started by a link from another tree: its first mission waits for that link.','me-small'));
  for(const x of c.unreachable)box.append(el('p','⚠ '+x.name+': '+x.status,'me-warn',{'data-me-unreachable':x.id}));
  return box;}
 function ownerTreePanel(t){const d=local(),raw=d.trees.find(x=>x.id===t.id),box=el('div','','',{'data-me-owner-tree':t.id});
  box.append(el('h3',t.title),el('p',t.story?t.statusText+' · the main storyline':t.statusText+' · your new tree','me-badge me-'+(t.story?'active':'draft')),el('p','Id '+t.id+' (never changes). Missions run in the order listed: finishing one opens the next, given by its own giver (or started by its own trigger).','me-small'));
  if(t.story)box.append(el('p','This tree is in the game for every player. Your edits here are a DRAFT (this browser) until you publish them; PLAY THIS DRAFT tries them first.','dev-note'));
  if(raw.missions.length){const r=el('div','','me-row me-actions',{'data-me-tree-start-row':t.id});r.append(startBtn(raw),hint(HELP.playStart));box.append(r);}
  const g=el('div','','me-grid'),nm=el('input','','',{'aria-label':'Tree name','data-me-rename':t.id,maxlength:'60'});nm.value=raw.name;nm.oninput=()=>editTree(t.id,x=>{x.name=nm.value;});
  const f1=el('label','','me-field');f1.append(el('span','Tree name'),nm);const st=el('label','','me-field');st.append(el('span','Status'),el('b',t.story?'ACTIVE (in the game)':'DRAFT'));g.append(f1,st);box.append(g);
  const note=el('textarea','','',{'aria-label':'Short note',rows:'2',placeholder:'Short note (optional)'});note.value=raw.note||'';note.oninput=()=>editTree(t.id,x=>{x.note=note.value.slice(0,300);});const f2=el('label','','me-field');f2.append(el('span','Short note'),note);box.append(f2);
  box.append(capabilityBox(raw),treeLinks(raw));
  if(raw.missions.length&&root.StudioFlow){const fl=el('div','','me-flow');fl.append(root.StudioFlow.svg(raw.missions.map((m,i)=>({id:m.id,title:m.title||'(no name yet)',prerequisites:i?[raw.missions[i-1].id]:[],objectives:m.objectives,rewards:m.rewards,giver:(giver(m.giver)||{}).name||'no giver yet'}))));box.append(el('h4','Flow chart (same model as the Content Studio)'),fl);}
  box.append(npcTable(t));
  const issues=T().validateTree(raw,{givers,items,refs,studio:SM(),trees:d.trees});
  raw.missions.forEach((m,i)=>box.append(treeMissionCard(t,raw,m,i,issues)));
  const row=el('div','','me-row me-actions');row.append(btn('+ NEW MISSION',()=>{let id;const n=nextFree();editTree(t.id,x=>{const m=T().addMission(x,{giver:x.missions.length?x.missions[x.missions.length-1].giver:''});m.number=n;id=m.id;},false);ui.mission='tree:'+id;ui.scrollTo=true;status='New mission: Mission '+MS().pad(n)+' (the next free number).';root.VoidEditorGuide?.focusNext();draw();},'',{'data-me-add-mission':'1'}),
   btn('EXPORT MY EDITS',exportEdits),t.story?btn('PUT BACK THE SHIPPED VERSION',()=>{if(!confirm('Throw away your draft edits to the main storyline and show the shipped version again?'))return;const d2=local();d2.trees=d2.trees.filter(x=>x.id!==t.id);saveLocal(d2);stale=true;draw();},'me-x',{'data-me-reset-story':'1'}):btn('DELETE THIS TREE',()=>{if(!confirm('Delete your tree “'+raw.name+'” and all its missions from the draft?'))return;const d2=local();const gone=(d2.trees.find(x=>x.id===t.id)||{missions:[]}).missions.map(m=>m.number).filter(Number.isInteger);d2.retiredNumbers=[...new Set([...(d2.retiredNumbers||[]),...gone])];d2.trees=d2.trees.filter(x=>x.id!==t.id);saveLocal(d2);stale=true;ui.tree='main-storyline';draw();},'me-x'));
  box.append(row);return box;}
 /* Links between trees (“start tree” unlocks): what this tree leads to and what starts it. */
 function treeLinks(raw){const all=local().trees||[],name=id=>((all.find(x=>x.id===id)||{}).name||id),box=el('section','','me-check',{'data-me-links':raw.id});box.append(el('h4','Links to other trees'));
  const out=[],inn=[];for(const m of raw.missions)for(const u of m.unlocks||[])if(u.kind==='tree')out.push('leads to tree “'+name(u.id)+'” from “'+(m.title||m.id)+'”'+(u.when&&u.when!=='complete'?', at step '+u.when:', when it is done'));
  for(const x of all)if(x.id!==raw.id)for(const m of x.missions)for(const u of m.unlocks||[])if(u.kind==='tree'&&u.id===raw.id)inn.push('started by tree “'+(x.name||x.id)+'” from “'+(m.title||m.id)+'”'+(u.when&&u.when!=='complete'?', at step '+u.when:', when it is done'));
  if(!out.length&&!inn.length)box.append(el('p','None. Add “Start tree” under “What becomes available” to link a mission or a step to another of your trees.','me-small'));
  for(const x of inn)box.append(el('p','← '+x,'',{'data-me-started-by':'1'}));for(const x of out)box.append(el('p','→ '+x,'',{'data-me-leads-to':'1'}));
  if(inn.length)box.append(el('p','This tree’s first mission waits until one of those links fires; then its giver offers it.','me-small'));
  // a small map of every new tree and its links
  const edges=all.flatMap(x=>x.missions.flatMap(m=>(m.unlocks||[]).filter(u=>u.kind==='tree').map(u=>[x.id,u.id])));if(edges.length){const map=el('p','','me-small',{'data-me-tree-map':'1'});map.textContent='Map: '+[...new Set(edges.map(([a,b])=>name(a)+' → '+name(b)))].join('   ·   ');box.append(map);}
  return box;}
 /* ANIMATIONS (npc-gestures.js): the clips a character can really play, as a dropdown. who: the speaker (an NPC id); value: the clip chosen (or none). */
 const NGS=()=>root.VoidNPCGestures;
 function animPick(who,value,on,attrs,none){const A=NGS(),r=A?A.clipsFor(who,{plan:((local().npcs)||{})[who]||null}):{ok:false,why:'The animation tools could not load. Reload the page.',clips:[]};
  const sel=el('select','','',{'aria-label':'Animation',...(attrs||{})});sel.append(new Option(r.ok?(none||'— nothing (their usual behaviour) —'):'— no animations for this character —',''));
  const grp=(src,label)=>{const cs=r.clips.filter(c=>c.source===src);if(!cs.length)return;const og=el('optgroup','',null,{label});for(const c of cs)og.append(new Option(c.name,c.id));sel.append(og);};
  grp('own','Their own animations');grp('library','Animation library');grp('added','Added in Developer tools > NPCs');
  if(value&&!r.clips.some(c=>c.id===value))sel.append(new Option((A?A.nameOf(value):value)+' — this character cannot play it',value));
  sel.value=value||'';if(!r.ok&&!value)sel.disabled=true;sel.onchange=()=>on(sel.value||null);return {sel,r};}
 const WAIT_STEP_HELP='A pause in the mission: it goes on to the next step after that many seconds (1 to 600). With a distance and a person, the time counts only while the player stays that close to them (for example “stay with Iris for 30 seconds”). The clock stops in the pause menu, conversations and the KeyMap, and carries on after a reload.';
 const DELAY_HELP='Optional: how long after the step before is done this step begins (0 to 600 seconds; 0 = at once). Until then this step’s person does not react and its lines are not said. The clock stops in the pause menu, conversations and the KeyMap.';
 const waitWords=o=>{const n=Number.isInteger(o.hold)?o.hold:10;return 'The mission waits '+secWords(n)+(o.near&&o.npc?' while the player stays within '+o.near+' m of '+((giver(o.npc)||{}).name||o.npc):o.near?' (choose who the player stays near)':'')+'.';};
 const ANIM_STEP_HELP='An animation between steps: as soon as the step before is done (and the conversation is closed), this person does the animation where they stand, and the mission waits the seconds you set before the next step starts (0: it goes straight on). Use it for a pause in the story, for example Iris shrugs and then sends the player off.';
 /* MISSION TIMERS (mission-content.js TIME): small number boxes with the time in plain words. */
 const TIME_HELP='Timing (optional): “wait before” pauses the conversation (it shows “…”) before this line appears; “show for” makes the conversation go on by itself after that many seconds instead of waiting for the player to press CONTINUE (never past ACCEPT / DENY).';
 const secWords=n=>n+' second'+(n===1?'':'s');
 const lineTimeWords=l=>{const a=[];a.push(l.wait>0?'waits '+secWords(l.wait)+' before':'shows straight away');a.push(l.show>0?'goes on by itself after '+secWords(l.show):'waits for CONTINUE');if(l.anim&&l.animFor>0)a.push('animation '+secWords(l.animFor));return 'Timing: '+a.join(' · ');};
 function numBox(label,value,lo,hi,on,attrs,placeholder){const w=el('label','','me-small me-num');const i=el('input','','',{type:'number',min:String(lo),max:String(hi),step:'1',size:'4','aria-label':label,...(placeholder?{placeholder}:{}),...(attrs||{})});i.value=value==null||value===''?'':String(value);
  i.oninput=()=>{const t=i.value.trim(),n=parseInt(t,10);on(t===''||!Number.isFinite(n)?null:Math.max(lo,Math.min(hi,n)));};w.append(document.createTextNode(label+' '),i);return w;}
 const LINES_HELP='Write the conversation in order: + ADD A LINE FOR … adds what the character says, + ADD A PLAYER LINE adds the player’s reply (shown as “You” in the conversation window; the player has no voice, so it is text only). “Who says it” changes the speaker of any line.';
 const ANIM_HELP='Pick an animation and the character does it while this line is on screen (a shrug, a laugh, looking about …), then goes back to what they were doing. Only animations this character really has are listed; more can be added in Developer tools > NPCs > Add animation (Reverie and Lace).';
 function linesEditor(t,m,lines,keyBase,defWho,title,opt={}){const box=el('div','','me-scene',{'data-me-lines':keyBase});box.append(el('h5',title));if(lines.length)box.append(hint(TAG_HELP,{'data-me-tag-help':'1'}));
  const defName=(giver(defWho)||{}).name||'the NPC';
  lines.forEach((l,k)=>{const you=l.who==='You',row=el('div','','me-line'+(you?' me-line-player':''),{'data-me-tline':keyBase+'/'+k,'data-me-line-who':you?'player':'npc'});const who=el('div','','me-who');
   const ws=npcSelect(l.who||defWho||'',v=>editTree(t.id,x=>{const L=pick(x);if(!L||!L[k])return;L[k].who=v;if(v!=='You')delete L[k].choice;const sp=v||defWho;if(L[k].anim&&(v==='You'||(NGS()&&NGS().problem(sp,L[k].anim,{plan:((local().npcs)||{})[sp]||null}))))delete L[k].anim;},true),{label:'Who says it',empty:'(the '+(defWho?'NPC of this part: '+defName:'giver')+')'});ws.prepend(new Option('You (the player)','You'));ws.value=l.who||'';who.append(ws);
   const g=giver(l.who||defWho),vn=g?voiceNow(g.id):{kind:'none'};who.append(el('span',you?'the player · text only (the player has no voice)':vn.kind==='elevenlabs'?'ElevenLabs voice '+vn.name:g&&g.voice?'registered voice '+g.voice.voice+' (read-only)':'no voice yet','me-small'));row.append(who);
   const ch=you&&opt.choice&&!opt.nested&&l.choice&&typeof l.choice==='object'?l.choice:null;
   const body=el('div','','me-say'),ta=el('textarea','','',{'aria-label':ch?'The player’s reply when they press '+(ch.yes||'ACCEPT'):you?'The player’s line':'Line',rows:'2',placeholder:ch?'(optional: what the player says when they press '+(ch.yes||'ACCEPT')+')':you?'(what the player says back)':'(empty: a placeholder; write the line yourself)'});ta.value=l.text||'';const tn=tagNoteEl(l.text,g&&g.id||(you?'You':''),g&&g.name);
   const tags=el('div','','me-tags');const ph=!!MS()?.isPlaceholder(l.text);if(MS()?.isProposed?.(l.text))tags.append(el('span','PROPOSED: Claude’s draft, waiting for your approval (text only, not recorded). Edit it or keep it.','me-vs me-warn',{'data-me-proposed':'1'}));
   const chipOf=tx=>MS()?.isPlaceholder(tx)?['PLACEHOLDER for you: shown only here and in draft play; live players never see it','bad']:!String(tx||'').trim()?['empty: a placeholder, not spoken','muted']:you?['the player’s line (text only)','muted']:['needs voice (text only until recorded)','warn'];
   const [c0,k0]=chipOf(l.text),chip=el('span',c0,'me-vs me-'+k0,{...(ph?{'data-me-placeholder':'1'}:{}),'data-me-line-state':'1'});tags.append(chip);
   ta.oninput=()=>{editTree(t.id,x=>{const L=pick(x);if(L&&L[k])L[k].text=ta.value.slice(0,500);});tagNoteSet(tn,ta.value,g&&g.id||(you?'You':''),g&&g.name);const [c1,k1]=chipOf(ta.value);chip.textContent=c1;chip.className='me-vs me-'+k1;};body.append(ta,tn);
   if(g&&(g.voice||vn.kind==='elevenlabs')&&(l.text||'').trim()&&!you)tags.append(btn('RE-VOICE',()=>revoice([{who:g.id,ref:'tree:'+m.id+'/'+keyBase+'/'+k,key:'tree:'+m.id+'/'+keyBase+'/'+k,kind:'tree',text:l.text,voice:g.voice,source:'mission editor new tree',mission:'tree:'+m.id}],{key:'tree:'+m.id}),'',server.queue?{}:{disabled:'',title:'The re-voice queue is switched off on the server.'}));
   tags.append(btn('▲',()=>editTree(t.id,x=>{const L=pick(x);if(L&&k>0)[L[k-1],L[k]]=[L[k],L[k-1]];},true),'',{'aria-label':'Move line up',...(k?{}:{disabled:''})}),btn('▼',()=>editTree(t.id,x=>{const L=pick(x);if(L&&k<L.length-1)[L[k+1],L[k]]=[L[k],L[k+1]];},true),'',{'aria-label':'Move line down',...(k<lines.length-1?{}:{disabled:''})}));
   tags.append(btn('×',()=>editTree(t.id,x=>{const L=pick(x);if(L)L.splice(k,1);},true),'me-x',{'aria-label':'Remove line'}));body.append(tags);
   // While saying this, <NPC> does: … (npc-gestures.js)
   if(!you&&g&&!opt.noAnim){const ar=el('div','','me-row me-line-anim',{'data-me-line-anim':keyBase+'/'+k}),{sel,r}=animPick(g.id,l.anim,v=>editTree(t.id,x=>{const L=pick(x);if(!L||!L[k])return;if(v)L[k].anim=v;else delete L[k].anim;status=v?'While saying this line, '+g.name+' does: '+NGS().nameOf(v)+'. PLAY THIS DRAFT shows it.':'No animation on this line.';},true),{'data-me-line-anim-pick':keyBase+'/'+k});
    ar.append(el('span','While saying this, '+g.name+' does:','me-small'),sel);if(!r.ok)ar.append(el('span',r.why,'me-small me-muted'));else if(lines.findIndex(x=>x&&x.who!=='You')===k)ar.append(hint(ANIM_HELP,{'data-me-anim-help':'1'}));body.append(ar);}
   {const d=el('details','','me-line-time',{'data-me-line-time':keyBase+'/'+k}),sm=el('summary',lineTimeWords(l));d.open=!!(l.wait||l.show||l.animFor);d.append(sm);const cur={...l};
    const set=(f,v)=>{if(v==null||v===0&&f!=='wait')delete cur[f];else cur[f]=v;if(f==='wait'&&!v)delete cur.wait;sm.textContent=lineTimeWords(cur);editTree(t.id,x=>{const L=pick(x);if(!L||!L[k])return;if(cur[f]==null)delete L[k][f];else L[k][f]=cur[f];});};
    d.append(numBox('Wait before this line',l.wait||0,0,60,v=>set('wait',v),{'data-me-line-wait':keyBase+'/'+k}),el('span','s','me-small'),numBox('· show for',l.show||'',1,60,v=>set('show',v),{'data-me-line-show':keyBase+'/'+k},'—'),el('span','s then continue (empty: the player presses CONTINUE)','me-small'));
    if(!you&&l.anim)d.append(numBox('· animation lasts',l.animFor||'',1,30,v=>set('animFor',v),{'data-me-line-animfor':keyBase+'/'+k},'auto'),el('span','s (empty: about as long as the line)','me-small'));
    d.append(hint(TIME_HELP));body.append(d);}
   if(g&&!you){const key='tree:'+m.id+'/'+keyBase+'/'+k,ib=importBox(key,g.id,()=>ta.value);body.append(ib);ta.addEventListener('input',()=>ib.refresh());}   // IMPORT VOICE FILE (voice-imports.js)
   // A player reply as a choice: ACCEPT / DENY buttons, credits if accepted, what DENY does, the lines after each (mission-blocks-view.js choiceFields, shared with the Blocks view)
   if(you&&opt.choice&&!opt.nested&&root.VoidMissionBlocksView){const ys=(ch&&ch.yes)||'ACCEPT',ns=(ch&&ch.no)||'DENY';if(ch)ta.before(el('span','Your reply when they press '+ys+' (optional):','me-small'));
    body.append(root.VoidMissionBlocksView.choiceFields({t,m,line:l,ref:keyBase+'/'+k,i:keyBase==='offer'?-1:m.objectives.findIndex(o=>o&&o.id===keyBase.split('/')[0]),kit:blocksKit,
     set:(fn,redraw=true)=>editTree(t.id,x=>{const L=pick(x);if(L&&L[k])fn(L[k]);},redraw),after:b=>linesEditor(t,m,(ch&&ch[b])||[],keyBase+'/'+k+'/'+b,defWho,b==='yesSay'?'After '+ys+', said next (optional)':'After '+ns+', said next (optional)',{nested:true})}));}
   row.append(body);box.append(row);});
  // keyBase: 'offer', 'deny', 'ending', '<step>/<set>', and the lines after a player's choice '<…>/<line index>/yesSay' or '…/noSay' (mission-content.js CHOICE)
  const pick=x=>{const mm=x.missions.find(y=>y.id===m.id);if(!mm)return null;const p=keyBase.split('/');let L;if(p[0]==='offer'){L=mm.offer=mm.offer||[];p.splice(0,1);}else if(p[0]==='deny'){mm.start=mm.start&&mm.start.how?mm.start:{how:'person'};L=(mm.start.denySay=mm.start.denySay||[]);p.splice(0,1);}
   else if(p[0]==='ending'){L=(mm.ending.say=mm.ending.say||[]);p.splice(0,1);}else{const oo=mm.objectives.find(o=>o.id===p[0]);if(!oo)return undefined;if(!Array.isArray(oo[p[1]]))oo[p[1]]=[];L=oo[p[1]];p.splice(0,2);}
   if(p.length===2){const l=L[Number(p[0])];if(!l||!l.choice||typeof l.choice!=='object')return null;if(!Array.isArray(l.choice[p[1]]))l.choice[p[1]]=[];return l.choice[p[1]];}return L;};
  const full=lines.length>=12,add=(w,what)=>editTree(t.id,x=>{const L=pick(x);if(L&&L.length<12)L.push({who:w,text:''});status=what;},true);
  const row=el('div','','me-row me-add-lines');row.append(btn('+ ADD A LINE FOR '+(defWho?defName.toUpperCase():'THE NPC'),()=>add('','New line for '+defName+': type it in the new box.'),'',{'data-me-add-npc-line':keyBase,...(full?{disabled:'',title:'12 lines at most here.'}:{})}),
   btn('+ ADD A PLAYER LINE',()=>add('You','New player line: type what the player says back.'),'',{'data-me-add-player-line':keyBase,...(full||opt.noPlayer?{disabled:'',title:opt.noPlayer||'12 lines at most here.'}:{})}));
  box.append(row);box.append(hint(opt.noPlayer?opt.noPlayer:LINES_HELP,{'data-me-lines-help':keyBase}));return box;}
 function treeMissionCard(t,raw,m,i,issues){const card=el('article','','me-mission-panel',{'data-me-tree-mission':m.id}),ed=(fn,redraw)=>editTree(t.id,x=>{const mm=x.missions.find(y=>y.id===m.id);if(mm)fn(mm,x);},redraw);
  const head=el('div','','me-row');head.append(el('b',Number.isInteger(m.number)?numLabel(m.number,m.title||'(no name yet)'):'MISSION '+(i+1)+' · '+(m.title||'(no name yet)'),'',{'data-me-mission-label':m.id}),el('span','id '+m.id+' (never changes)','me-small'),
   btn('▲',()=>editTree(t.id,x=>T().moveMission(x,m.id,-1),true),'',{'aria-label':'Move up',...(i?{}:{disabled:''})}),btn('▼',()=>editTree(t.id,x=>T().moveMission(x,m.id,1),true),'',{'aria-label':'Move down',...(i<raw.missions.length-1?{}:{disabled:''})}),
   btn('REMOVE MISSION',()=>{if(!confirm('Remove “'+(m.title||m.id)+'” from your tree?'+(Number.isInteger(m.number)?' Its number, '+MS().pad(m.number)+', is never given to another mission.':'')))return;editTree(t.id,(x,d)=>{if(Number.isInteger(m.number))d.retiredNumbers=[...new Set([...(d.retiredNumbers||[]),m.number])];T().removeMission(x,m.id);},true);},'me-x'));card.append(head);
  // the mission number: set or renumber (with a warning); numbers are unique and never reused
  {const nr=el('div','','me-row',{'data-me-number':m.id}),inp=el('input','','',{'aria-label':'Mission number',inputmode:'numeric',maxlength:'3',size:'4','data-me-number-input':m.id});inp.value=Number.isInteger(m.number)?MS().pad(m.number):'';
   nr.append(el('b','Mission number'),inp,btn(Number.isInteger(m.number)?'RENUMBER':'SET NUMBER',()=>{const n=parseInt(inp.value,10),d=local(),used=new Map();for(const [k,v] of Object.entries(ledger()))used.set(Number(k),v);for(const tt of d.trees)for(const mm of tt.missions)if(Number.isInteger(mm.number))used.set(mm.number,mm.id);for(const r of d.retiredNumbers||[])if(!used.has(r))used.set(r,'(removed)');
    if(!(n>=1&&n<=999)){setStatus('A mission number is a whole number from 001 to 999. Type one in the box (for example '+MS().pad(nextFree())+', the next free number), then press the button again.');return;}if(n===m.number)return;if(used.has(n)&&used.get(n)!==m.id){setStatus('Mission '+MS().pad(n)+' is already used by '+used.get(n)+'. A number is never reused, even after a mission is removed. The next free number is '+MS().pad(nextFree(d))+'.');return;}
    if(Number.isInteger(m.number)&&!confirm('Renumber Mission '+MS().pad(m.number)+' as Mission '+MS().pad(n)+'?\n\nNumbers are permanent: '+MS().pad(m.number)+' will never be given to another mission. Players who have seen “Mission '+MS().pad(m.number)+'” will see the new number after you publish.'))return;
    const d2=local();T().setNumber(d2,m.id,n);saveLocal(d2);stale=true;status='Mission '+MS().pad(n)+' — '+(m.title||m.id)+'.';draw();},'',{'data-me-renumber':m.id}),el('span','Shown as “'+numLabel(Number.isInteger(m.number)?m.number:nextFree(),m.title||'Name')+'”. Unique; never reused once used. The id '+m.id+' stays the same.','me-small'));card.append(nr);}
  const field=(label,value,on,area,attrs,help)=>{const l=el('label','','me-field');l.append(el('span',label));const inp=el(area?'textarea':'input','','',attrs||{});inp.value=value??'';inp.oninput=()=>{on(inp.value);guideSoon();};l.append(inp);if(help)l.append(hint(help));return l;};
  card.append(hint(HELP.number));
  const g=el('div','','me-grid');g.append(field('Mission name',m.title,v=>ed(x=>{x.title=v.slice(0,60);}),false,{'data-me-field':'title',placeholder:'(your words)',maxlength:'60'},HELP.title),creditsPanel(t,m,ed));card.append(g);
  card.append(field('Description (the V1 Mission Log shows it)',m.description,v=>ed(x=>{x.description=v.slice(0,600);}),true,{placeholder:'(your words)'},HELP.description));
  {const g2=el('div','','me-grid');g2.append(field('Type (shown in the Mission Log)',m.category||'',v=>ed(x=>{x.category=v.slice(0,60);}),false,{'data-me-field':'category',placeholder:'e.g. Main storyline / Introduction',maxlength:'60'},HELP.category),field('Objective (the Mission Log headline)',m.objective||'',v=>ed(x=>{x.objective=v.slice(0,200);}),false,{'data-me-field':'objective',placeholder:'(empty: the current step)',maxlength:'200'},HELP.objective));card.append(g2);
   const lr=el('div','','me-row');lr.append(el('b','Location'),placeSelect(m.location||'',v=>ed(x=>{x.location=v;}),'Mission location'),hint(HELP.location,{'data-me-help-location':'1'}));card.append(lr);}
  const gr=el('div','','me-row');gr.append(el('b','Giver'),npcSelect(m.giver,v=>ed(x=>{const old=x.giver;x.giver=v;for(const l of x.offer||[])if(l&&old&&l.who===old)l.who=v;},true),{label:'Who gives this mission',attrs:{'data-me-giver':m.id}}));const gv=giver(m.giver);
  gr.append(el('span',gv?G().status(gv):'Choose who gives it.',gv&&gv.draft&&gv.players?'me-ok':'me-warn',{'data-me-giver-status':m.id}),hint(HELP.giver));card.append(gr);
  if(m.giver&&gv)card.append(voicePanel(m.giver,{compact:true}));   // the giver's voice (queue item 0b)
  if(root.VoidNPCPaths?.MOVABLE?.[m.giver])card.append(waitAtPanel(t,m,ed));
  card.append(startPanel(t,m,ed));   // right under Giver: how this mission starts
  const ty=el('select','','',{'aria-label':'Mission type'});for(const x of SM().TYPES)ty.append(new Option(x,x));ty.value=m.type||'side';ty.onchange=()=>ed(x=>{x.type=ty.value;});const tr=el('div','','me-row');tr.append(el('span','Type','me-small'),ty,hint(HELP.type));card.append(tr);
  // BLOCKS VIEW (mission-blocks-view.js, 19 Nov 2026): the same mission as a timeline of blocks; the Form view's offer, apartments, steps, ending, branches and unlocks are its blocks
  const MBV=root.VoidMissionBlocksView,bv=!!(MBV&&MBV.on(m.id));if(MBV)head.after(MBV.toggle(m.id,()=>draw()));
  if(bv)card.append(MBV.view({t,raw,m,ed,issues,kit:blocksKit}));else{
  {const nr=root.VoidMissionBlocks.startMode(m);if(!(m.start&&m.start.how==='notification')||nr==='near'||nr==='near-accept'){card.append(linesEditor(t,m,m.offer,'offer',m.giver,nr==='near'||nr==='near-accept'?'What '+(gv?gv.name:'the giver')+' says when the player walks near':'What '+(gv?gv.name:'the giver')+' says when offering it',{choice:MC().choiceOk(m,null)}));card.append(hint(HELP.offer));}}
  card.append(aptPanel(t,m,ed));   // apartment instances (apartments.js): always shown; "Loading the street doors…" while the door list is not ready (aptReady)
  card.append(el('h4','What needs to be done (steps, in order)'),hint(HELP.steps));
  m.objectives.forEach((o,k)=>card.append(treeStepRow(t,raw,m,o,k,ed)));
  card.append(btn('+ STEP',()=>{root.VoidEditorGuide?.focusNext();ed(x=>T().addStep(x),true);},'',{'data-me-add-step':m.id}));
  // ending
  const end=el('section','','me-end');end.append(el('h4','Where the mission ends'),hint(HELP.ending));const er=el('div','','me-row');
  er.append(el('span','Hand in to','me-small'),npcSelect(m.ending.npc,v=>ed(x=>{x.ending.npc=v;},true),{label:'Hand-in NPC',empty:'— nobody: it ends when the last step is done —',attrs:{'data-me-ending':m.id}}),el('span','at','me-small'),placeSelect(m.ending.place,v=>ed(x=>{x.ending.place=v;}),'Ending place'));end.append(er);
  if(m.ending.npc){end.append(field('Hand-in step in the Mission Log',m.ending.label,v=>ed(x=>{x.ending.label=v.slice(0,200);}),false,{placeholder:'(empty: “Hand in to '+((giver(m.ending.npc)||{}).name||'')+'”)'}));end.append(linesEditor(t,m,m.ending.say||[],'ending',m.ending.npc,'What is said at the hand-in'));}
  card.append(end);
  // branches
  const br=el('section','','me-end');br.append(el('h4','Branches'),hint(HELP.branches),el('p','Needs a code change: the game does not offer mission choices yet. Kept in your draft as a design note; missions run in order.','me-small me-warn'));
  (m.choices||[]).forEach((c,k)=>{const r=el('div','','me-row');const lab=el('input','','',{'aria-label':'Choice',placeholder:'What the player chooses (your words)'});lab.value=c.label||'';lab.oninput=()=>ed(x=>{x.choices[k].label=lab.value.slice(0,200);});
   const nx=el('select','','',{'aria-label':'Leads to'});nx.append(new Option('leads to: not decided',''));for(const y of raw.missions.filter(y=>y.id!==m.id))nx.append(new Option('leads to: '+(y.title||y.id),y.id));nx.value=c.next||'';nx.onchange=()=>ed(x=>{x.choices[k].next=nx.value;});
   r.append(lab,nx,btn('×',()=>ed(x=>{x.choices.splice(k,1);},true),'me-x'));br.append(r);});
  br.append(btn('+ BRANCH',()=>ed(x=>{x.choices=x.choices||[];let n=x.choices.length+1;while(x.choices.some(c=>c.id==='choice-'+n))n++;x.choices.push({id:'choice-'+n,label:'',next:''});},true)));card.append(br);
  card.append(treeUnlocks(t,m,ed));const fu=followups(m);if(fu)card.append(fu);}
  if(root.VoidZoneEditor)card.append(root.VoidZoneEditor.missionPanel(m,ed));   // zones and armed people (zone-editor.js): in both the Blocks and the Form view
  // checks and actions
  const mine=issues.filter(x=>x.where===m.id||x.where===m.title||String(x.where).startsWith(m.id+' /')||String(x.where).startsWith((m.title||'\u0000')+' /'));
  const val=el('section','','me-issues');val.append(el('h4','Checks'));if(!mine.length)val.append(el('p','No problems found.','me-ok'));for(const x of mine)val.append(el('p',x.text,x.level==='error'?'me-bad':'me-warn'));card.append(val);
  const block=MC().treeBlockers(m,givers,items),act=el('div','','me-row me-actions');
  act.append(btn('PLAY THIS DRAFT',()=>play('tree:'+m.id,null),'me-play',{'data-me-play':'tree:'+m.id,...(block.length?{disabled:'',title:'Cannot be played yet: '+block.join('; ')}:{})}),startBtn(raw),hint(HELP.play));card.append(act);
  if(block.length)card.append(el('p','Cannot be played or published yet: '+block.join('; ')+'.','me-small me-warn'));
  return card;}
 /* HOW THIS MISSION STARTS (the owner, 17 Nov 2026: "either have Missions start by notification or in person"): in person (the giver offers it), or by notification:
    channel (Messages, Comms call, notification only), sender, header, body, and the trigger (first pod exit, after a mission, entering a place, a story flag). */
 function startPanel(t,m,ed){const st=m.start||{how:'person'},by=st.how==='notification',box=el('section','','me-end me-start',{'data-me-start':m.id});box.append(el('h4','How this mission starts'));
  const set=(fn,redraw)=>ed(x=>{x.start=x.start&&x.start.how?x.start:{how:'person'};fn(x.start,x);},redraw);
  // One plain choice (the owner): Starts: In person / By Messages / By Comms call / Notification only.
  // "Walk near the giver" is its own choice here (19 Nov 2026: the owner could not find it under Notification only › Trigger): mission-blocks.js START_MODES / setStartMode,
  // the same list as the Blocks view's Start block; the data is the "When walked near" trigger it always was.
  const MBk=root.VoidMissionBlocks,mode=MBk.startMode(m),near=mode==='near'||mode==='near-accept',how=el('div','','me-row'),sel=el('select','','',{'aria-label':'Starts','data-me-starts':m.id});for(const x of MBk.START_MODES)sel.append(new Option(x.name,x.id));
  sel.value=mode;sel.onchange=()=>ed(x=>{MBk.setStartMode(x,sel.value);},true);   // the ACCEPT / DENY settings follow a change of channel (19 Nov 2026: not the question implied by "In person, asking": a device start without it starts by itself)
  how.append(el('b','Starts:'),sel,...optHelp(sel,HELP_START,'Starts'),el('span',near?(st.accept===true?'The giver offers it as the player walks near; the player chooses '+(st.yes||'ACCEPT')+' or '+(st.no||'DENY')+'.':'Starts automatically as the player walks near.'):by?((G().START_CHANNELS.find(c=>c.id===st.channel)||{}).note||''):st.accept===true?'The giver offers it; the player chooses '+(st.yes||'ACCEPT')+' or '+(st.no||'DENY')+'. Once accepted it is never offered again.':'The giver offers it when the player talks to them.','me-small'));box.append(how);
  box.append(askPanel(t,m,ed));   // "Ask the player: ACCEPT or DENY" for every way of starting (19 Nov 2026)
  if(!by){box.append(el('p','Then it is in the Mission Log and tracked. What the giver says when offering it is further down.','me-small'));return box;}
  const r2=el('div','','me-row');r2.append(el('b','Sender'),npcSelect(st.from||'',v=>set(x=>{x.from=v;},true),{label:'Sender',attrs:{'data-me-start-from':m.id}}),hint(HELP.sender));box.append(r2);
  const hl=el('label','','me-field');hl.append(el('span','Header'+(st.channel==='notify'?' (optional)':'')));const hi=el('input','','',{'aria-label':'Header',maxlength:'80','data-me-start-header':m.id,placeholder:'e.g. ADMIN // INCOMING MESSAGE'});hi.value=st.header||'';hi.oninput=()=>{set(x=>{x.header=hi.value.slice(0,80);});guideSoon();};hl.append(hi,hint(HELP.header));
  const tl=el('label','','me-field');tl.append(el('span','Body'));const ta=el('textarea','','',{'aria-label':'Body',rows:'3',maxlength:'500','data-me-start-text':m.id,placeholder:'(your words)'});ta.value=st.text||'';ta.oninput=()=>{set(x=>{x.text=ta.value.slice(0,500);});guideSoon();};tl.append(ta,hint(HELP.body));box.append(hl,tl);
  const w=st.when||{kind:'pod-exit'},wk=el('select','','',{'aria-label':'Trigger','data-me-start-when':m.id});for(const x of G().START_WHEN)wk.append(new Option(x.name,x.id));wk.value=w.kind||'pod-exit';wk.onchange=()=>set((x,mm)=>{x.when={kind:wk.value,...(wk.value==='flag'?{flag:'',value:true}:{}),...(wk.value==='game-time'?{value:360}:{}),...(wk.value==='near'?{npc:mm.giver||'',distance:G().NEAR.def}:{})};if(wk.value==='near'&&w.kind!=='near'&&x.accept===true&&!askCustom(x)&&!payAtAccept(mm))delete x.accept;},true);   // walked near: automatic by default (the owner, 19 Nov 2026)
  const r3=el('div','','me-row');r3.append(el('b','Trigger'),wk,...optHelp(wk,HELP_WHEN,'Trigger'));
  if(w.kind==='after-mission'||w.kind==='game-time'){const ms=el('select','','',{'aria-label':'After which mission','data-me-start-mission':m.id});ms.append(new Option('— choose a mission —',''));for(const tt of local().trees)for(const mm of tt.missions)if(mm.id!==m.id)ms.append(new Option(numLabel(mm.number,mm.title||mm.id)+' ('+(tt.name||tt.id)+')',mm.id));ms.value=w.mission||'';ms.onchange=()=>set(x=>{x.when={...x.when,kind:w.kind,mission:ms.value};},true);r3.append(ms);}
  // "After in-game time": N in-game hours and minutes after that mission is done (game-clock.js; stored as in-game minutes)
  if(w.kind==='game-time'){const v=Number.isInteger(w.value)?w.value:360,hi=el('input','','',{'aria-label':'In-game hours',inputmode:'numeric',size:'3',maxlength:'3','data-me-start-hours':m.id}),mi=el('input','','',{'aria-label':'In-game minutes',inputmode:'numeric',size:'2',maxlength:'2','data-me-start-minutes':m.id});
   hi.value=String(Math.floor(v/60));mi.value=String(v%60);const upd=()=>set(x=>{const h=parseInt(hi.value,10)||0,mn=parseInt(mi.value,10)||0;x.when={...x.when,value:h*60+mn};});hi.oninput=upd;mi.oninput=upd;hi.title=mi.title=HELP.hours;
   r3.append(hi,el('span','in-game hours','me-small'),mi,el('span','in-game minutes after it (about '+Math.round((root.VoidClock?.realMinutes?.(v))??v/12)+' minutes of play)','me-small'));}
  if(w.kind==='place'||w.kind==='leave')r3.append(regionSelect(w.place||'',v=>set(x=>{x.when={kind:w.kind,place:v};},true),w.kind==='leave'?'Place left':'Place entered',{'data-me-start-place':m.id}));
  if(w.kind==='flag'){const fi=el('input','','',{'aria-label':'Story flag','data-me-start-flag':m.id,placeholder:'story flag name, e.g. mf_metRook'});fi.value=w.flag||'';fi.oninput=()=>{set(x=>{x.when={...x.when,flag:fi.value.trim().slice(0,64)};});guideSoon();};fi.title=HELP.flag;
   const fv=el('input','','',{'aria-label':'Flag value',placeholder:'true'});fv.value=w.value===undefined?'true':String(w.value);fv.oninput=()=>set(x=>{const v=fv.value.trim();x.when={...x.when,value:v==='true'?true:v==='false'?false:/^-?\d+$/.test(v)?Number(v):v.slice(0,200)};});r3.append(fi,el('span','=','me-small'),fv,hint(HELP.flag));}
  // "When walked near" (18 Nov 2026): who (default: the giver) and how close, in metres (1..30, default 5)
  if(w.kind==='near'){const who=w.npc||m.giver||'',N=G().NEAR,di=el('input','','',{type:'number',min:String(N.min),max:String(N.max),step:'0.5','aria-label':'Distance in metres','data-me-start-distance':m.id,style:'width:5em'});
   di.value=String(G().nearMetres(w.distance));di.onchange=()=>{const v=G().nearMetres(di.value);di.value=String(v);set(x=>{x.when={...x.when,kind:'near',distance:v};});};
   di.title=HELP.distance;r3.append(el('span','within','me-small'),di,el('span','metres of','me-small'),npcSelect(who,v=>set(x=>{x.when={...x.when,kind:'near',npc:v};},true),{label:'Who the player walks near',attrs:{'data-me-start-near':m.id}}));
   const ng=giver(who);if(ng&&!ng.canTalk)r3.append(el('span','⚠ '+ng.name+' has no TALK prompt, so there is nothing to measure from.','me-small me-warn'));if(ng&&ng.shift)r3.append(el('span',G().shiftText(ng),'me-small me-warn',{'data-me-near-shift':m.id}));r3.append(nearMode(m,set));}
  const wn=(G().START_WHEN.find(x=>x.id===w.kind)||{}).note;if(wn)r3.append(el('span',wn,'me-small'));box.append(r3);
  box.append(el('p','When the trigger happens, the notification arrives on the player’s device with the device’s notification sound (and a banner while the V1 is closed), the mission goes into the Mission Log and is tracked. Text only: no voice is generated.','me-small'));
  return box;}
 /* "When walked near" starts by itself unless it asks (the owner, 19 Nov 2026: "'When walked near' still needs a click option by the player, even though i want it to start
    automatically"): one plain line under the trigger, with a button to switch. A cost at ACCEPT always asks. */
 const payAtAccept=m=>{const c=MC().costOf(m);return !!(c&&c.when==='accept');},askCustom=st=>!!st&&MC().ASK_KEYS.some(k=>st[k]!=null);
 function nearMode(m,set){const st=m.start||{},on=st.accept===true,pay=payAtAccept(m),box=el('div','','me-row me-near-mode',{'data-me-near-mode':m.id,'data-me-near-auto':String(!on)});
  box.append(el('b',on?'Asks '+(st.yes||'ACCEPT')+' / '+(st.no||'DENY'):'Starts automatically — no click',on?'me-warn':'me-ok'),el('span',on?(pay?'The player pays '+MC().costOf(m).amount+' CR when accepting, so the offer must ask.':'Walking near shows the offer; the mission starts only when the player presses '+(st.yes||'ACCEPT')+'.'):'Walking near starts the mission at once: a notification shows and it goes into the Mission Log. Nothing to press.','me-small'));
  if(!pay)box.append(btn(on?'START AUTOMATICALLY INSTEAD':'ASK ACCEPT / DENY INSTEAD',()=>set(x=>{if(on){delete x.accept;for(const k of MC().ASK_KEYS)delete x[k];}else x.accept=true;},true),'',{'data-me-near-switch':m.id}));
  return box;}
 /* CREDITS AND ACCEPT / DENY (the owner, 19 Nov 2026: "can i do -100 credit option and add an accept or deny"). Credits are one signed number shown as
    "Player gets" / "Player pays" (mission-content.js signed / setSigned: rewards, or cost {amount, when, refund}); the rules are mission-content.js MONEY. */
 const HELP_MONEY={gets:'Credits paid to the player once, when the mission is done. 0 = nothing. E.g. 100.',
  pays:'Credits the player PAYS (for example 100 for a pass). Taken once and never below 0: if the player has less, ACCEPT is greyed with “You need 100 CR” and the mission does not start.',
  when:'When they pay: as they press ACCEPT (the offer shows the cost), or when a step is done (that step waits until they have the credits).',
  refund:'“Refund if abandoned” gives the credits back if the player abandons the mission (off unless you tick it; the game has no abandon button for these missions yet).',
  ask:'The player sees the mission’s name, its short description and the cost or reward, then chooses. Nothing is taken until they accept. Works for every way of starting.',
  labels:'The words on the two buttons, 20 letters at most. Empty: ACCEPT and DENY.',
  deny:{again:'Today’s behaviour: an offer in person comes again the next time the player talks to them; a message, call, banner or walk-near comes again after the next Sleeping Pod exit.',pod:'It comes again after the player next leaves their Sleeping Pod. Meanwhile a giver who waits at a spot for it goes about her own routine.',after:'It comes again after that many minutes of play (1 to 120; only while the player is in the world, not in menus or conversations; a reload keeps the count). A walk-near offer also needs the player to walk out of its distance and come back. Meanwhile a giver who waits at a spot for it goes about her own routine, then walks back to it (never popping in or out in front of the player). In PLAY THIS DRAFT, SKIP THE WAIT in the banner ends the wait at once.',never:'It is never offered again (removed). Missions after it in this tree will not come either. A giver who waited at a spot for it goes back to her own routine, out of the player’s sight.',start:'Another mission starts instead: the first mission of another of your trees (if that one asks too, it is offered straight away).'},
  denySay:'Optional: what is said after DENY, in your own words. Empty: nothing is said.'};
 // The question that "Player pays … when they press ACCEPT" turned on by itself (this session): turned off again when that cost goes, so a walked-near or device start is automatic again.
 const forcedAsk=new Set();
 function forceAsk(x){x.start=x.start&&x.start.how?x.start:{how:'person'};if(x.start.accept!==true)forcedAsk.add(x.id);x.start.accept=true;}
 function unforceAsk(x){if(!forcedAsk.has(x.id))return;forcedAsk.delete(x.id);if(x.start&&!askCustom(x.start)){delete x.start.accept;}}
 function creditsPanel(t,m,ed){const X=MC(),v=X.signed(m),pays=v<0,box=el('div','','me-field me-credits',{'data-me-credits':m.id});box.append(el('span','Credits'));
  const row=el('div','','me-row'),dir=el('select','','',{'aria-label':'Player gets or pays','data-me-credits-dir':m.id});dir.append(new Option('Player gets','gets'),new Option('Player pays','pays'));dir.value=pays?'pays':'gets';
  const inp=el('input','','',{'aria-label':'Credits','data-me-field':'rewards',inputmode:'numeric',size:'7',maxlength:'6'});inp.value=String(Math.abs(v));
  const put=x=>{let n=Math.min(X.MONEY.max,Math.abs(parseInt(inp.value,10)||0));if(dir.value==='pays'&&!n)n=100;X.setSigned(x,dir.value==='pays'?-n:n);
   if(x.cost&&(x.cost.when||'accept')==='accept')forceAsk(x);else unforceAsk(x);};   // paying at ACCEPT needs the question
  dir.onchange=()=>ed(put,true);inp.oninput=()=>{ed(put);guideSoon();};inp.onchange=()=>ed(put,true);
  row.append(dir,inp,el('span','CR','me-small'));box.append(row,hint(pays?HELP_MONEY.pays:HELP_MONEY.gets));
  if(pays){const c=m.cost||{},when=c.when||'accept',w=el('select','','',{'aria-label':'When the player pays','data-me-cost-when':m.id});w.append(new Option('when they press '+((m.start&&m.start.yes)||'ACCEPT'),'accept'));m.objectives.forEach((o,k)=>w.append(new Option('when step '+(k+1)+' is done: '+String(o.label||o.id).slice(0,40),o.id)));w.value=when;
   w.onchange=()=>ed(x=>{x.cost={...(x.cost||{}),when:w.value};if(w.value!=='accept'){delete x.cost.refund;unforceAsk(x);}else forceAsk(x);},true);
   const r2=el('div','','me-row');r2.append(el('span','Charged','me-small'),w);
   if(when==='accept'){const cb=el('input','','',{type:'checkbox','data-me-cost-refund':m.id});cb.checked=c.refund===true;cb.onchange=()=>ed(x=>{x.cost={...(x.cost||{})};if(cb.checked)x.cost.refund=true;else delete x.cost.refund;},true);const lb=el('label','','me-small');lb.append(cb,document.createTextNode(' refund if abandoned'));r2.append(lb);}
   box.append(r2,hint(HELP_MONEY.when+' '+HELP_MONEY.refund));}
  return box;}
 function askPanel(t,m,ed){const st=m.start||{how:'person'},on=st.accept===true,box=el('div','','me-ask',{'data-me-ask':m.id}),pay=MC().costOf(m);
  const set=(fn,redraw)=>ed(x=>{x.start=x.start&&x.start.how?x.start:{how:'person'};fn(x.start,x);},redraw);
  const cb=el('input','','',{type:'checkbox','data-me-ask-on':m.id,'aria-label':'Ask the player: ACCEPT or DENY'});cb.checked=on;if(on&&pay&&pay.when==='accept'){cb.disabled=true;cb.title='The player pays when accepting, so the offer must ask.';}
  cb.onchange=()=>set(x=>{if(cb.checked)x.accept=true;else{delete x.accept;for(const k of MC().ASK_KEYS)delete x[k];}},true);
  const lb=el('label','','me-row');lb.append(cb,el('b','Ask the player: ACCEPT or DENY'));box.append(lb,hint(HELP_MONEY.ask+(on&&pay&&pay.when==='accept'?' (Always on here: the player pays when accepting.)':'')));
  if(!on)return box;
  const lab=(k,ph)=>{const i=el('input','','',{'aria-label':ph+' button label',['data-me-ask-'+k]:m.id,maxlength:'20',size:'10',placeholder:ph});i.value=st[k]||'';i.oninput=()=>set(x=>{const v=i.value.slice(0,20);if(v.trim())x[k]=v;else delete x[k];});return i;};
  const r=el('div','','me-row');r.append(el('span','Buttons','me-small'),lab('yes','ACCEPT'),lab('no','DENY'));box.append(r,hint(HELP_MONEY.labels));
  const dn=el('select','','',{'aria-label':'What happens on DENY','data-me-ask-deny':m.id});const byNote=st.how==='notification';for(const [v,n] of [['after','Offer again after a number of minutes'],['again',byNote?'Offer again after the next pod exit':'Offer again the next time they talk to them'],...(byNote?[]:[['pod','Offer again after the next pod exit']]),['never','Never offer again (remove it)'],['start','Start another mission']])dn.append(new Option(n,v));dn.value=byNote&&st.deny==='pod'?'again':st.deny||'again';
  dn.onchange=()=>set(x=>{if(dn.value==='again')delete x.deny;else x.deny=dn.value;if(dn.value!=='start')delete x.denyStart;if(dn.value==='after')x.denyMinutes=Number.isInteger(x.denyMinutes)?x.denyMinutes:MC().DENY_MIN.def;else delete x.denyMinutes;},true);
  const r2=el('div','','me-row');r2.append(el('b','On DENY'),dn,...optHelp(dn,HELP_MONEY.deny,'What happens on DENY'));
  if(st.deny==='after'){const D=MC().DENY_MIN;r2.append(numBox('Offer again after',MC().denyMinutes(st.denyMinutes),D.min,D.max,v=>set(x=>{x.denyMinutes=Number.isInteger(v)?Math.max(D.min,Math.min(D.max,v)):D.def;}),{'data-me-ask-deny-minutes':m.id}),el('span','minutes of play'+(byNote&&(st.when||{}).kind==='near'?' (and the player walks away and comes back)':''),'me-small'));}
  if(st.deny==='start'){const ms=el('select','','',{'aria-label':'Mission started on DENY','data-me-ask-deny-start':m.id});ms.append(new Option('— choose a mission —',''));
   for(const tt of local().trees)if(tt.id!==t.id&&tt.missions&&tt.missions[0])ms.append(new Option(numLabel(tt.missions[0].number,tt.missions[0].title||tt.missions[0].id)+' (first of '+(tt.name||tt.id)+')',tt.missions[0].id));
   ms.value=st.denyStart||'';ms.onchange=()=>set(x=>{if(ms.value)x.denyStart=ms.value;else delete x.denyStart;},true);r2.append(ms);}
  box.append(r2,linesEditor(t,m,st.denySay||[],'deny',st.how==='notification'?st.from:m.giver,'What is said after DENY (optional)'),hint(HELP_MONEY.denySay));
  return box;}
 /* ---- APARTMENTS (apartments.js): "Instance an apartment" in a mission; steps "Go into apartment X", "Use something in apartment X", "Hack the access point" ---- */
 const APX=()=>root.VoidApartments;
 const aptName=a=>(a.id||'?')+' · '+(Array.isArray(a.modules)?'location ('+a.modules.length+' module'+(a.modules.length===1?'':'s')+')':((APX().STYLES.find(s=>s.id===a.style)||{}).name||a.style||'no style'))+(a.door?' · '+((APX().door(a.door)||{}).name||a.door):' · no door yet');
 const MED=()=>root.VoidModuleEditor;   // locations built from modules (modules.js, module-editor.js)
 function aptSelect(m,value,on,attrs){const sel=el('select','','',{'aria-label':'Which apartment',...(attrs||{})});sel.append(new Option((m.apartments||[]).length?'— choose the apartment —':'— add an apartment above first —',''));for(const a of m.apartments||[])sel.append(new Option(aptName(a),a.id));sel.value=value||'';sel.onchange=()=>on(sel.value||undefined);return sel;}
 const QNAME={avenue:'The Avenue',oldtown:'Old Town','far-south':'Far South',port:'The Port',outskirts:'The Outskirts'};
 function doorSelect(value,on,attrs,empty,style,pick){const X=APX(),cont=style!=null&&!!X.isContainer?.(style),sel=el('select','','',{'aria-label':'Street door',...(attrs||{})});sel.append(new Option(empty||(cont?'— choose a container in The Outskirts —':'— choose a street door —'),''));
  // a container style only behind an Outskirts container door, a city style only behind a city door (style null: every door, e.g. for a hack step)
  for(const q of ['avenue','oldtown','far-south','port','outskirts']){const g=document.createElement('optgroup');g.label=QNAME[q];for(const d of X.doorsIn(q)){if(style!=null&&(d.family==='container')!==cont)continue;g.append(new Option(d.name+' ('+((X.STYLES.find(t=>t.id===d.style)||{}).name||d.style)+(d.family==='container'?'':' building')+')',d.id));}if(g.children.length)sel.append(g);}
  sel.value=value||'';sel.onchange=()=>on(sel.value||'');const ME=root.VoidModuleEditor;return pick&&ME&&ME.doorPick?ME.doorPick(sel,pick):sel;}   // with the street map of numbered doors (module-editor.js doorPick)
 /* "Go into" / "Use something" (the owner, 19 Nov 2026: "I won't remember this. Can it be in a drop-down?"): ONE list of this mission's places by their real names and
    types (mission-blocks.js placeOptions: "Office floor (No. 13, The Avenue, offices)", "Server room (…)", "Rundown apartment 104 (…)"); the step's words are made from the
    choice ("Go into the office floor", "Use the server rack in the server room") and follow it while they are automatic; the owner's own words are kept. */
 const BK=()=>root.VoidMissionBlocks;
 function placeRow(m,o,eo){const B=BK(),k=o.kind,list=B.placeOptions(m,k),cur=B.placeValue(o),out=[];
  const sel=el('select','','',{'aria-label':k==='apt-use'?'Where it is':'Which place','data-me-step-apt':o.id});sel.append(new Option(list.length?'— choose the place —':'— add a location or an apartment first —',''));
  for(const p of list)sel.append(new Option(p.label,p.value));if(cur&&!list.some(p=>p.value===cur))sel.append(new Option(cur+' (not in this mission any more)',cur));sel.value=cur;
  sel.onchange=()=>eo(x=>B.rewordAfter(x,m,y=>B.placeSet(y,sel.value,m)),true);out.push(el('span',k==='apt-use'?'in':'into','me-small'),sel);
  if(k==='apt-use'){const p=list.find(x=>x.value===cur),ob=el('select','','',{'aria-label':'What is used','data-me-step-object':o.id});ob.append(new Option(p?'— choose what is used —':'— choose the place first —',''));
   for(const x of (p&&p.objects)||[])ob.append(new Option(x.name,x.id));ob.value=o.object||'';ob.onchange=()=>eo(x=>B.rewordAfter(x,m,y=>{if(ob.value)y.object=ob.value;else delete y.object;}),true);out.push(el('span','use','me-small'),ob);}
  return out;}
 /* "Use the automatic words": shown while the step's words are the owner's own and differ from the words its place would give. */
 function autoWordsBtn(m,o,eo){const B=BK(),w=B.placeWords(o,m);
  const b=btn('USE THE AUTOMATIC WORDS',()=>eo(x=>{const v=B.placeWords(x,m);if(v)x.label=v;},true),'me-small',{'data-me-auto-words':o.id,title:w?'Replace the words with: '+w:'Choose the place first'});
  b.refresh=label=>{b.hidden=!w||String(label||'').trim()===w;};b.refresh(o.label);return b;}
 function hackRow(m,o,eo){const X=APX(),out=[],sel=el('select','','',{'aria-label':'Which access point','data-me-step-ap':o.id});sel.append(new Option('— choose the access point —',''));
  for(const p of BK().hackOptions(m))sel.append(new Option(p.label,p.ap));   // this mission's doors by their real names (mission-blocks.js hackOptions)
  const g=document.createElement('optgroup');g.label='Any street door';for(const d of X.doors())g.append(new Option(d.name+' · '+QNAME[d.quarter],d.id));sel.append(g);sel.value=o.ap||'';sel.onchange=()=>eo(x=>BK().rewordAfter(x,m,y=>{if(sel.value)y.ap=sel.value;else delete y.ap;}),true);
  out.push(el('span','hack','me-small'),sel,numBox('Seconds the hack takes',Number.isInteger(o.hold)?o.hold:X.HACK.def,X.HACK.min,X.HACK.max,v=>eo(x=>{x.hold=v||X.HACK.def;}),{'data-me-step-hold':o.id}),el('span','s','me-small'));
  const cb=(label,key,def,attr)=>{const l=el('label','','me-small');const i=el('input','','',{type:'checkbox',[attr]:o.id});i.checked=o[key]==null?def:o[key]===true;i.onchange=()=>eo(x=>{if(i.checked===def)delete x[key];else x[key]=i.checked;});l.append(i,document.createTextNode(' '+label));return l;};
  out.push(cb('fails if they walk away','stay',true,'data-me-step-stay'),cb('opens that door for them','unlock',!o.feed,'data-me-step-unlock'));
  if(root.VoidCultRoomEditor)out.push(...root.VoidCultRoomEditor.stepFeed(m,o,eo,blocksKit));   // a hacked camera feed (cult-room-editor.js)
  const ns=el('select','','',{'aria-label':'Player needs','data-me-step-needs':o.id});ns.append(new Option('Player needs: nothing',''));for(const [id,it] of Object.entries(root.VoidProgression?.personalItems||{}))ns.append(new Option('Player needs: '+it.name+(it.sold===false?' (not sold anywhere yet)':''),id));ns.value=o.needs||'';ns.onchange=()=>eo(x=>{if(ns.value)x.needs=ns.value;else delete x.needs;});out.push(ns);
  return out;}
 /* The street doors come from apartments.js, pure data (the street edges, ncz-quarters.js gates and stops, npc-areas.js obstacles): no scene is needed. If a script is
    missing (an old cached page, a failed load) the panel still shows, says "Loading the street doors…", loads what is missing and redraws (the owner, 19 Nov 2026: "i also
    don't see the apartment add in mission editor"). */
 const aptReady=()=>{const X=APX();if(!X||typeof X.doors!=='function'||!X.STYLES||!X.LIMIT)return false;try{return X.doors().length>0;}catch{return false;}};
 let aptLoad=null,aptFail='';
 function aptEnsure(){if(aptReady())return Promise.resolve(true);
  return aptLoad??=[['VoidQuarters','void-runner/ncz-quarters.js'],['VoidContainers','void-runner/ncz-containers.js'],['VoidNPCAreas','void-runner/npc-areas.js'],['VoidApartments','void-runner/apartments.js'],['VoidModules','void-runner/modules.js']].reduce((p,[g,src])=>p.then(()=>root[g]&&(g!=='VoidApartments'||typeof root[g].doors==='function')?null:new Promise(ok=>{const sc=document.createElement('script');sc.src=src;sc.onload=ok;sc.onerror=()=>{aptFail=src;ok();};document.head.append(sc);})),Promise.resolve())
   .then(()=>{const r=aptReady();if(!r)aptLoad=null;return r;});}
 function aptPanel(t,m,ed){const X=APX(),box=el('section','','me-end',{'data-me-apt-panel':m.id});box.append(el('h4','Apartments for this mission'),hint(HELP_APT));
  if(!aptReady()){box.append(el('p',aptFail?'The street doors could not load ('+aptFail+'). Check your connection, then press CLOSE and open Developer tools again. Your apartments are kept in the draft.':'Loading the street doors…','me-small'+(aptFail?' me-warn':''),{'data-me-apt-loading':m.id}),
    btn('+ INSTANCE AN APARTMENT',()=>{},'',{'data-me-apt-add':m.id,disabled:'',title:'Wait a moment: the street doors are loading.'}));
   if(!aptFail)aptEnsure().then(ok=>{if(ok&&host&&host.querySelector('[data-me-apt-loading]'))draw();else if(!ok&&host&&!aptFail){aptFail='the door list is empty';draw();}});return box;}
  const ea=(id,fn,redraw)=>ed(x=>{const a=(x.apartments||[]).find(y=>y.id===id);if(a)fn(a,x);},redraw);
  (m.apartments||[]).forEach((a,k)=>{if(Array.isArray(a.modules)){if(MED())box.append(MED().card({m,a,k,ed,doorSelect,jump:inside=>jumpApt(m,a,inside)}));else box.append(el('p','Location '+a.id+': the location editor is loading…','me-small'));return;}
   const sec=el('div','','me-step',{'data-me-apt':a.id}),r1=el('div','','me-row');
   const nm=el('input','','',{'aria-label':'Apartment name (used by its steps)',size:'10',maxlength:'24','data-me-apt-name':a.id,'data-me-apt-adv':'1'});nm.value=a.id;nm.onchange=()=>{const v=nm.value.trim().toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/^[^a-z]+/,'').slice(0,24);if(!v||v===a.id||(m.apartments||[]).some(y=>y.id===v)){nm.value=a.id;return;}ed(x=>{const y=x.apartments.find(z=>z.id===a.id);if(y)y.id=v;for(const o of x.objectives||[]){if(o.apt===a.id)o.apt=v;if(typeof o.ap==='string'&&o.ap.startsWith(a.id+'/'))o.ap=v+o.ap.slice(a.id.length);}},true);};
   const st=el('select','','',{'aria-label':'Apartment style','data-me-apt-style':a.id});for(const s of X.STYLES)st.append(new Option(s.name,s.id));st.value=a.style||'normal';st.onchange=()=>ea(a.id,y=>{y.style=st.value;if(!X.AD_SCREEN.styles.includes(y.style))delete y.screenOff;const dd=X.door(y.door);if(dd&&(dd.family==='container')!==!!X.isContainer(y.style))y.door='';},true);   // a door of the other kind is cleared (container styles: Outskirts doors only)
   r1.append(el('b','APARTMENT '+(k+1)),nm,st,el('span','behind','me-small'),doorSelect(a.door,v=>ea(a.id,y=>{y.door=v;const d=X.door(v);if(d&&!y.styleSet)y.style=y.style||d.style;},true),{'data-me-apt-door':a.id},null,a.style||'normal',{key:m.id+'/'+a.id,used:MED()?MED().usedDoors(m,a):{}}),
    btn('×',()=>{if(!confirm('Remove apartment “'+a.id+'” from this mission? Its steps will need another apartment.'))return;ed(x=>{x.apartments=(x.apartments||[]).filter(y=>y.id!==a.id);if(!x.apartments.length)delete x.apartments;},true);},'me-x',{'aria-label':'Remove apartment'}));sec.append(r1);
   const d=a.door?X.door(a.door):null;if(d&&d.style!==a.style)sec.append(el('p','That door is in a '+d.style+' part of town; a '+a.style+' apartment behind it is allowed.','me-small'));
   const r2=el('div','','me-row');r2.append(numBox('Number on its door in the hallway',a.number||'',1,9999,v=>ea(a.id,y=>{if(v)y.number=v;else delete y.number;}),{'data-me-apt-number':a.id},'(the building’s own)'));
   const fr=el('select','','',{'aria-label':'Available from','data-me-apt-from':a.id});fr.append(new Option('from the mission’s start','start'));for(const o of m.objectives||[])fr.append(new Option('from step: '+(o.label||o.id).slice(0,40),o.id));fr.value=a.from||'start';fr.onchange=()=>ea(a.id,y=>{if(fr.value==='start')delete y.from;else y.from=fr.value;},true);
   const lk=el('label','','me-small');const lki=el('input','','',{type:'checkbox','data-me-apt-locked':a.id});lki.checked=a.locked===true;lki.onchange=()=>ea(a.id,y=>{if(lki.checked)y.locked=true;else delete y.locked;});lk.append(lki,document.createTextNode(' its hallway door is locked until the player hacks its access point'));
   r2.append(el('span','open','me-small'),fr,el('span','until the mission ends','me-small'),lk);sec.append(r2);
   {const r4=el('div','','me-row'),onoff=(label,key,attrs)=>{const q=el('select','','',{'aria-label':label,...attrs});q.append(new Option(label+': On','on'),new Option(label+': Off','off'));q.value=a[key]===true?'off':'on';q.onchange=()=>ea(a.id,y=>{if(q.value==='off')y[key]=true;else delete y[key];});return q;};
    r4.append(onoff('Lights start','lightsOff',{'data-me-apt-lights':a.id}));if(X.AD_SCREEN.styles.includes(a.style||'normal'))r4.append(onoff('Screen starts','screenOff',{'data-me-apt-screen':a.id}));r4.append(hint('The player can still switch them in the game (the light switch by the door; the screen itself).'));sec.append(r4);}
   const r3=el('div','','me-row');r3.append(btn('JUMP TO THE DOOR',()=>jumpApt(m,a,false),'',{'data-me-apt-jump':a.id,...(a.door?{}:{disabled:''})}),btn('JUMP INSIDE',()=>jumpApt(m,a,true),'',{'data-me-apt-inside':a.id,...(a.door?{}:{disabled:''})}),hint('A throwaway test session: nothing is saved. Inside, every object can be tried; a step only completes in PLAY THIS DRAFT.'));sec.append(r3);
   // the map: every apartment door of the chosen area; a click picks the nearest door
   if(root.VoidNPCMap){const markers=X.doors().filter(dd=>(dd.family==='container')===!!X.isContainer(a.style||'normal')).map(dd=>({id:dd.id,x:dd.x,z:dd.z,color:dd.id===a.door?'#ffb347':'#7fd4ff',label:dd.id===a.door?dd.name:'',ghost:dd.id!==a.door}));const say=el('span',a.door?'Chosen: '+((X.door(a.door)||{}).name):'Click a door (the blue marks) to choose it.','me-small',{'data-me-apt-map-note':a.id});
    try{const map=root.VoidNPCMap.create({markers,area:d?{avenue:'avenue',oldtown:'oldtown','far-south':'far-south',port:'port',outskirts:'outskirts'}[d.quarter]:X.isContainer(a.style||'normal')?'outskirts':'oldtown',onPick:(x,z)=>{const n=X.nearestDoor(x,z,10,X.isContainer(a.style||'normal')?'container':'city');if(!n){say.textContent='No apartment door within 10 m of that spot. Click nearer a blue mark.';return;}ea(a.id,y=>{y.door=n.id;},true);}});map.el.dataset.meAptMap=a.id;sec.append(map.el,say);}catch(e){sec.append(el('p','The map could not be drawn here; choose the door from the list.','me-small me-warn'));}}
   // placed items: the data is kept and checked; the game shows each as a small marked case (picking up comes later)
   const it=el('div','','me-row',{'data-me-apt-items':a.id,'data-me-apt-adv':'1'});it.append(el('b','Items (coming later)'),el('span',(a.items||[]).length?(a.items.map(i=>i.label+' ('+i.type+')').join(', ')):'none yet','me-small'));
   const ty=el('select','','',{'aria-label':'Item type'});for(const ti of X.ITEM_TYPES)ty.append(new Option(ti.name,ti.id));const lb=el('input','','',{'aria-label':'Item label',placeholder:'label (e.g. Data shard)',maxlength:'60',size:'14'});
   it.append(ty,lb,btn('+ ITEM (on the desk)',()=>{const v=lb.value.trim().slice(0,60);if(!v)return;ea(a.id,y=>{y.items=[...(y.items||[]),{type:ty.value,label:v,x:-2.6+((y.items||[]).length%4)*.25,z:-.9}].slice(0,X.LIMIT.items);},true);}),btn('CLEAR ITEMS',()=>ea(a.id,y=>{delete y.items;},true),'me-x'));sec.append(it);
   box.append(sec);});
  if((m.apartments||[]).some(a=>a&&a.style&&!Array.isArray(a.modules))&&root.VoidModules)box.append(btn('CONVERT THESE APARTMENTS TO MODULES',()=>{if(!confirm('Turn this mission’s apartments into locations built from modules (a hallway module and the apartment, connected)? Its steps keep working: their access points are renamed to the new doors.'))return;ed(x=>{const y=root.VoidModules.migrateMission(x);for(const k of Object.keys(x))delete x[k];Object.assign(x,y);},true);},'',{'data-me-apt-convert':m.id}),hint('Optional: the older apartments keep working as they are.'));
  if(root.VoidCultRoomEditor)for(const f of m.feeds||[])box.append(root.VoidCultRoomEditor.card({m,f,ed,kit:blocksKit}));   // camera-feed-only rooms (Other: the Blackrock cult room)
  if((m.apartments||[]).length<X.LIMIT.perMission&&MED()){box.append(el('h5','Add a location (housing, various, office, server room, hallways and the underground, elevator, other)'));box.append(MED().picker(null,type=>MED().create(m,type,ed,t=>{status=t;}),{'data-me-loc-add':m.id}));}
  if((m.apartments||[]).length<X.LIMIT.perMission)box.append(btn('+ INSTANCE AN APARTMENT',()=>ed(x=>{const ids=new Set((x.apartments||[]).map(a=>a.id));let n=1;while(ids.has('a'+n))n++;x.apartments=[...(x.apartments||[]),{id:'a'+n,style:'normal',door:''}];},true),'',{'data-me-apt-add':m.id}));
  return box;}
 async function jumpApt(m,a,inside){const X=APX(),d=X.door(a.door);if(!d||!root.VoidDevTest?.session)return;fresh();const content=draftContent(),c=MC().check(content,checkCtx());
  write(RETURN,{tree:ui.tree,mission:ui.mission,step:null,npc:null,at:Date.now()},root.sessionStorage);
  const modular=Array.isArray(a.modules)&&!!root.VoidModules;
  const inst=modular?{key:m.id+'/'+a.id,mission:m.id,id:a.id,door:d.id,modular:true,loc:root.VoidModules.strip(a),hacked:[],title:m.title||m.id}:{key:m.id+'/'+a.id,mission:m.id,id:a.id,style:a.style||d.style,door:d.id,number:Number.isInteger(a.number)?a.number:null,items:a.items||[],locked:false,screenOff:a.screenOff===true,lightsOff:a.lightsOff===true,title:m.title||m.id};
  const r=await root.VoidDevTest.session({banner:'VIEWING: '+(inside?'apartment '+a.id:d.name)+' — not your real save',leave:'LEAVE',kind:'draft',apply:()=>{if(c.ok)root.VoidLiveContent?.useDraft(content);},
   build:()=>{const C=root.C||root.VoidCampaign,st=C.startDistrictCampaign(C.fresh());st.story.flags.podWakePending=false;st.story.flags.appearanceOffered=true;st.universe.trackedMission=null;return st;},
   enter:async()=>{state.location='earth';X.setPreview(inst);const yaw=Math.atan2(d.n[0],d.n[1]);await enterWalking(VoidDistrictArea.KEY.street,{silent:true,quarter:d.quarter,spawn:[d.front[0]-d.n[0]*1.2,1.7,d.front[1]-d.n[1]*1.2],yaw});
    if(inside&&modular){await root.VoidModules.enter(d,inst);}else if(inside){await X.enterHall(d,[inst]);await X.enterFlat(inst);}},
   message:()=>'VIEWING · '+(inside?'inside apartment '+a.id:d.name)+' (the door is open for this test) · nothing is saved'});
  if(r&&r.error){status=r.error;draw();}return r;}
 function treeStepRow(t,raw,m,o,k,ed){const sb=el('section','','me-step',{'data-me-tstep':o.id,'data-me-step':o.id}),eo=(fn,redraw)=>ed(x=>{const oo=x.objectives.find(y=>y.id===o.id);if(!oo)return;const MB=root.VoidMissionBlocks,lab=y=>MB?MB.autoLabel(y,{name:id=>(giver(id)||{}).name||id,place:id=>((G().PLACE.get(id)||{}).name)||root.VoidPlaces?.node?.(id)?.name||id}):'',was=redraw?lab(oo):null;fn(oo,x);if(redraw&&(!String(oo.label||'').trim()||oo.label===was)){const l=lab(oo);if(l)oo.label=l;}},redraw);   // a new kind, person or place fills in “what the player must do” as the Blocks view does (the owner's own words are kept)
  const head=el('div','','me-row');head.append(el('b','STEP '+(k+1)+' · '+o.id));
  const kind=el('select','','',{'aria-label':'Kind of step','data-me-kind':o.id});for(const x of G().STEP_KINDS)kind.append(new Option(x.name+(x.supported?'':' — needs a code change'),x.id));kind.value=o.kind||'talk';kind.onchange=()=>eo(x=>{const was=BK().wordsAuto(x,m)&&!!BK().placeWords(x,m);x.kind=kind.value;if(was){const w=BK().placeWords(x,m);if(w)x.label=w;}},true);/* words made from the place follow the new kind */head.append(kind,...optHelp(kind,HELP_STEP,'Kind of step'));
  const st=G().STEP_KINDS.find(x=>x.id===o.kind);
  if(o.kind==='talk'||o.kind==='deliver')head.append(npcSelect(o.npc,v=>eo(x=>{x.npc=v;},true),{label:'Who it happens with',attrs:{'data-me-step-npc':o.id}}));
  else if(o.kind==='go')head.append(placeSelect(o.place,v=>eo(x=>{x.place=v;},true),'Place to go to',false,{'data-me-step-place':o.id}));else if(o.kind==='arrive')head.append(placeSelect(o.place,v=>eo(x=>{x.place=v;},true),'Place to fly to',true,{'data-me-step-place':o.id}));else if(o.kind==='buy')head.append(itemSelect(o.item,v=>eo(x=>{x.item=v;},true),{'data-me-step-item':o.id}));
  else if(o.kind==='hear')head.append(npcSelect(o.npc,v=>eo(x=>{x.npc=v;},true),{label:'Who is heard',empty:'(the giver)',attrs:{'data-me-step-npc':o.id}}));
  else if(o.kind==='enter'||o.kind==='leave')head.append(regionSelect(o.place,v=>eo(x=>{x.place=v;},true),o.kind==='enter'?'Place to enter':'Place to leave',{'data-me-step-place':o.id}));
  else if(o.kind==='photo')head.append(el('span','showing','me-small'),subjectsPicker(photoPeople(o),v=>eo(x=>setPhotoPeople(x,v,'npc'),true),'Who is photographed',{'data-me-step-subject':o.id}));
  else if(o.kind==='send-photo')head.append(el('span','to','me-small'),npcSelect(o.npc,v=>eo(x=>{x.npc=v;},true),{label:'Who the photo is sent to',attrs:{'data-me-step-npc':o.id}}),el('span','showing','me-small'),subjectsPicker(photoPeople(o),v=>eo(x=>setPhotoPeople(x,v,'subject'),true),'Who must be in the photo',{'data-me-step-subject':o.id}));
  else if(EX()&&EX().IDS.includes(o.kind))head.append(el('span','with','me-small'),escortWho(o,eo));
  else if(o.kind==='anim'){head.append(npcSelect(o.npc,v=>eo(x=>{x.npc=v;if(x.clip&&NGS()&&NGS().problem(v,x.clip,{plan:((local().npcs)||{})[v]||null}))delete x.clip;},true),{label:'Who plays the animation',attrs:{'data-me-step-npc':o.id}}));
   if(o.npc){const {sel,r}=animPick(o.npc,o.clip,v=>eo(x=>{if(v)x.clip=v;else delete x.clip;},true),{'data-me-step-clip':o.id},'— choose the animation —');head.append(el('span','plays','me-small'),sel);if(!r.ok)head.append(el('span',r.why,'me-warn'));}
   const hd=el('input','','',{type:'number',min:'0',max:'30',step:'1',size:'3','aria-label':'Seconds the mission waits','data-me-step-hold':o.id});hd.value=String(Number.isInteger(o.hold)?o.hold:3);hd.oninput=()=>{const n=parseInt(hd.value,10);eo(x=>{x.hold=Number.isFinite(n)?Math.max(0,Math.min(30,n)):3;});};
   head.append(el('span','and the mission waits','me-small'),hd,el('span','seconds','me-small'));}
  else if(o.kind==='wait'){const hd=el('input','','',{type:'number',min:'1',max:'600',step:'1',size:'4','aria-label':'Seconds to wait','data-me-step-hold':o.id});hd.value=String(Number.isInteger(o.hold)?o.hold:10);
   const words=el('span',waitWords(o),'me-small',{'data-me-wait-words':o.id});hd.oninput=()=>{const n=parseInt(hd.value,10);eo(x=>{x.hold=Number.isFinite(n)?Math.max(1,Math.min(600,n)):10;words.textContent=waitWords(x);});};
   const nr=el('input','','',{type:'number',min:'1',max:'50',step:'1',size:'3','aria-label':'Only while the player stays within (metres)',placeholder:'—','data-me-step-near':o.id});nr.value=Number.isInteger(o.near)?String(o.near):'';
   nr.oninput=()=>{const n=parseInt(nr.value,10);eo(x=>{if(Number.isFinite(n)&&n>0)x.near=Math.min(50,n);else delete x.near;words.textContent=waitWords(x);});};
   head.append(el('span','Wait','me-small'),hd,el('span','seconds · only while the player stays within','me-small'),nr,el('span','m of','me-small'),npcSelect(o.npc,v=>eo(x=>{x.npc=v;},true),{label:'Who the player stays near',empty:'— anyone / anywhere —',attrs:{'data-me-step-npc':o.id}}),words);}
  else if(o.kind==='zone'&&root.VoidZoneEditor)head.append(...root.VoidZoneEditor.stepFields(m,o,eo));   // "Change zone" (zone-editor.js)
  else if(o.kind==='apt-enter'||o.kind==='apt-use')head.append(...placeRow(m,o,eo));   // the place by its real name; the words follow it (placeRow)
  else if(o.kind==='hack')head.append(...hackRow(m,o,eo));
  else if(o.kind==='ask'&&root.VoidMissionBlocksView)head.append(...root.VoidMissionBlocksView.askFields({t,m,o,eo:(fn,redraw=true)=>eo(fn,redraw),kit:blocksKit}));   // ACCEPT / DENY in the middle of a mission (the same fields as its block)
  else if(o.kind==='pod-exit')head.append(el('span','Done when the player leaves the Sleeping Pod (EXIT POD).','me-small'));
  else if(o.kind==='message')head.append(el('span',m.start&&m.start.how==='notification'?'Done as the notification reaches the device (text: “How this mission starts” above).':'Needs the mission to start by notification.',m.start&&m.start.how==='notification'?'me-small':'me-warn'));
  else head.append(el('span','Needs a code change: the game cannot run this kind of step yet. It stays in your draft.','me-warn'));
  const blocked=MC().treeBlockers(m,givers,items).length>0;
  head.append(btn('▲',()=>ed(x=>T().moveStep(x,o.id,-1),true),'',{'aria-label':'Move step up',...(k?{}:{disabled:''})}),btn('▼',()=>ed(x=>T().moveStep(x,o.id,1),true),'',{'aria-label':'Move step down',...(k<m.objectives.length-1?{}:{disabled:''})}),
   btn('×',()=>ed(x=>T().removeStep(x,o.id),true),'me-x',{'aria-label':'Remove step',...(m.objectives.length>1?{}:{disabled:''})}),btn('PLAY THIS DRAFT FROM HERE',()=>play('tree:'+m.id,o.id),'me-play',{'data-me-play':'tree:'+m.id+'#'+o.id,...(blocked?{disabled:''}:{})}));
  sb.append(head);if(st&&st.note)sb.append(el('p',st.note,'me-small'));if(EX()&&EX().IDS.includes(o.kind))sb.append(escortPanel(m,o,eo));
  const l=el('label','','me-field');l.append(el('span','What the player must do (V1 Mission Log)'));const inp=el('input','','',{placeholder:o.kind==='anim'?'(empty: “Watch”; shown in the Mission Log for those seconds)':o.kind==='wait'?'(empty: “Wait”; shown in the Mission Log while it waits)':'(your words)','data-me-label':o.id,maxlength:'500'});inp.value=o.label||'';inp.oninput=()=>{eo(x=>{x.label=inp.value.slice(0,500);});l.querySelector('[data-me-auto-words]')?.refresh?.(inp.value);guideSoon();};l.append(inp);if(['apt-enter','apt-use','hack'].includes(o.kind))l.append(autoWordsBtn(m,o,eo));l.append(hint(HELP.label));sb.append(l);
  // how "what is said" reaches the player: the conversation window, a Comms call, or a message (Mission 002: Admin calls as the player walks into NULL)
  if(o.kind==='anim')sb.append(hint(ANIM_STEP_HELP,{'data-me-anim-step-help':o.id}));if(o.kind==='wait')sb.append(hint(WAIT_STEP_HELP,{'data-me-wait-step-help':o.id}));
  {const dr=el('div','','me-row',{'data-me-step-delay-row':o.id}),words=el('span',o.delay>0?'This step starts '+secWords(o.delay)+' after the step before it is done.':'Starts as soon as the step before it is done.','me-small');
   dr.append(numBox('Delay before this step starts',o.delay||0,0,600,v=>{eo(x=>{if(v)x.delay=v;else delete x.delay;});words.textContent=v?'This step starts '+secWords(v)+' after the step before it is done.':'Starts as soon as the step before it is done.';},{'data-me-step-delay':o.id}),el('span','s','me-small'),words);sb.append(dr,hint(DELAY_HELP));}
  // The V1 app to highlight during this step (optional; 20 Nov 2026): its tile glows in the mission yellow when the player opens the V1 ("ADMIN: OPEN CAMERA").
  if(!['anim','wait','ask'].includes(o.kind)){const ar=el('div','','me-row'),as=el('select','','',{'aria-label':'V1 app to highlight','data-me-step-app':o.id}),AP=(globalThis.VoidDeviceV1&&globalThis.VoidDeviceV1.APPS)||{};as.append(new Option('Automatic (a photo step: Camera; sending a photo: Messages; otherwise none)',''));for(const id of (MC().STEP_APPS||[]))as.append(new Option((AP[id]&&AP[id].title)||id.toUpperCase(),id));
   as.value=o.app||'';as.onchange=()=>eo(x=>{if(as.value)x.app=as.value;else delete x.app;},true);ar.append(el('b','V1 app to highlight'),as,el('span','When the player opens the V1 during this step, this app’s tile glows yellow.','me-small'));sb.append(ar);}
  if(!['message','pod-exit','hear','send-photo','await-call','anim','wait','ask'].includes(o.kind)){const vr=el('div','','me-row'),vs=el('select','','',{'aria-label':'How it is said','data-me-step-via':o.id});for(const [v,n] of [['talk','In person (the conversation window)'],['comms','As a Comms call (on the V1)'],['messages','As a message (V1 Messages)']])vs.append(new Option(n,v));
   vs.value=o.via||'talk';vs.onchange=()=>eo(x=>{if(vs.value==='talk')delete x.via;else x.via=vs.value;},true);vr.append(el('b','How it is said'),vs,...optHelp(vs,HELP_VIA,'How it is said'),el('span',o.via&&o.via!=='talk'?'All the lines come from one NPC, who calls or writes as the step is done. Text only until recorded.':'','me-small'));sb.append(vr);}
  const sayWho=o.kind==='photo'?m.giver:o.npc||m.giver;
  const dev=o.via==='comms'||o.via==='messages'||o.kind==='send-photo';
  if(o.kind==='ask')sb.append(linesEditor(t,m,o.denySay||[],o.id+'/denySay',sayWho,'What is said after DENY (optional)'));
  if(o.kind!=='message'&&o.kind!=='pod-exit'&&o.kind!=='anim'&&o.kind!=='wait')sb.append(linesEditor(t,m,o.say||[],o.id+'/say',sayWho,o.kind==='ask'?'What is said after ACCEPT (optional)':o.kind==='hear'?'What they say (shown right after the talk step; this step is done when the player closes it)':o.kind==='send-photo'?'Reply to the right photo (in Messages)':'What is said when this step is done',dev?{noPlayer:o.kind==='send-photo'?'A reply in Messages comes from one character: no player lines or animations here.':'A Comms call or a message comes from one character: no player lines here (choose “In person” for a back-and-forth).',noAnim:true}:{choice:MC().choiceOk(m,o)}));
  if(o.kind==='send-photo')sb.append(linesEditor(t,m,o.wrong||[],o.id+'/wrong',o.npc||m.giver,'Reply to any other photo (the player can try again as often as they like)',{noPlayer:'A reply in Messages comes from one character: no player lines or animations here.',noAnim:true}));
  if(o.kind==='talk'||o.kind==='deliver')sb.append(linesEditor(t,m,o.early||[],o.id+'/early',o.npc||m.giver,'If the player comes too soon'));
  return sb;}
 /* Follow-ups that start counting when this mission is done (main-story.js FOLLOWUPS; Mission 003: Fish's call). The wait is IN-GAME time (game-clock.js); the call is a
    STUB until the owner writes it. Shows where this browser's player stands now and the in-game time it is due (Developer Tools). */
 function followups(m){const list=(MS()?.FOLLOWUPS||[]).filter(x=>x.after===m.id);if(!list.length)return null;const box=el('section','','me-end',{'data-me-followups':m.id});box.append(el('h4','Follow-up (after in-game time)'));
  const now=root.VoidLiveContent?.gameClock?.()||{minutes:0,now:null,followups:[]},hm=v=>Math.floor(v/60)+' h '+String(Math.floor(v%60)).padStart(2,'0')+' min';
  for(const x of list){const st=now.followups.find(y=>y.event===x.event)||{};
   box.append(el('p',(x.note||x.event)+' Becomes due '+hm(x.gameMinutes)+' of IN-GAME time after this mission is done (the in-game clock runs 12 minutes for every real minute of walking or flight; about '+Math.round(x.gameMinutes/12)+' minutes of play). Event: '+x.event+'. Status: '+(x.status==='stub'?'STUB, waiting for your script: nothing reaches the player when it is due.':x.status||''),'me-small'));
   box.append(el('p','This player now: '+(st.fired?'DUE at '+(st.dueAt||'?')+' (fired once; never again)':st.started?hm(st.elapsed||0)+' of in-game time since the mission; due at '+(st.dueAt||'?')+' ('+hm(st.remaining||0)+' to go)':'not started (the mission is not done in this save)')+' · in-game time now '+((now.now&&now.now.label)||'?')+'.','me-small',{'data-me-followup-status':x.event}));}
  box.append(el('p','To make the call itself: add a mission that starts “By Comms call”, from Fish, with the trigger “After in-game time”, this mission and the hours.','me-small'));return box;}
 function treeUnlocks(t,m,ed){const box=el('section','','me-unlocks');box.append(el('h4','What becomes available'),hint(HELP.unlocks));const UK=G().UNLOCK_KINDS,when=u=>!u.when||u.when==='complete'?'when the mission is done':'at step '+u.when;
  const text=u=>u.kind==='tree'?'start tree “'+(((local().trees||[]).find(x=>x.id===u.id)||{}).name||u.id)+'”':u.kind==='credits'?u.amount+' credits':u.kind==='flag'?'story flag mf_'+u.id+' = '+u.value:u.kind==='location'?(refs.locations[u.id]||u.id):u.kind==='ship'?(refs.ships[u.id]||u.id):u.kind==='item'?(refs.items[u.id]||u.id)+' at '+(refs.stores[u.store]||u.store):u.kind==='reputation'?'standing with '+((giver(u.id)||{}).name||((root.VoidFactions?.factions||{})[u.id]||{}).name||u.id)+' '+(u.amount>0?'+':'')+u.amount:u.kind==='gate'?'gate '+u.id:u.kind==='mission'?'the next mission in this tree':u.kind==='contact'?((giver(u.id)||{}).name||u.id)+' added to the V1 contacts':u.kind==='follow'?'follow '+((giver(u.id)||{}).name||u.id)+' on Social':u.kind==='missiles'?u.amount+' × '+(((root.VoidOrdnance?.TYPES||{})[u.id]||{}).title||u.id)+' missiles':u.kind==='nav-coords'?'every location on the flight Map':u.id;
  for(const [i,u] of (m.unlocks||[]).entries()){const k=UK.find(x=>x.id===u.kind)||{},ok=k.supported&&(u.kind!=='ship'||!(root.VoidShips?.ships?.[u.id]||{}).premium),r=el('div','','me-row',{'data-me-unlock':u.kind});
   r.append(el('span',(k.name||u.kind)+': '+text(u)+' · '+when(u)),el('span',ok?'the game applies it':'needs a code change'+(k.why?': '+k.why:u.kind==='ship'?': a paid hull is never given':''),ok?'me-ok me-small':'me-warn me-small'),btn('×',()=>ed(x=>{x.unlocks.splice(i,1);},true),'me-x',{'aria-label':'Remove'}));box.append(r);}
  box.append(el('p','Next mission: '+((()=>{const raw=local().trees.find(x=>x.id===t.id),j=raw?raw.missions.findIndex(x=>x.id===m.id):-1,n=raw&&raw.missions[j+1];return n?(n.title||n.id)+' opens when this one is done':'none (the last mission in this tree)';})()),'me-small'));
  const add=el('div','','me-row me-add'),kindSel=el('select','','',{'aria-label':'Kind of unlock','data-me-unlock-kind':m.id});for(const k of UK.filter(x=>x.id!=='mission'))kindSel.append(new Option(k.name+(k.supported?'':' — needs a code change'),k.id));
  const idSel=el('select','','',{'aria-label':'Which','data-me-unlock-id':m.id}),storeSel=el('select','','',{'aria-label':'Store'}),valIn=el('input','','',{'aria-label':'Value','data-me-unlock-value':m.id}),whenSel=el('select','','',{'aria-label':'When'});
  for(const [k,n] of Object.entries(refs.stores))storeSel.append(new Option(n,k));whenSel.append(new Option('when the mission is done','complete'));for(const o of m.objectives)whenSel.append(new Option('at step: '+(o.label||o.id).slice(0,40),o.id));
  const gates=(root.VoidQuarters?.GATES||[]).map(g=>[g.id,(g.name||g.id)+(g.shut?' (shut)':'')]);
  const ships=Object.fromEntries(Object.entries(root.VoidShips?.ships||{}).map(([id,x])=>[id,x.name+(x.premium?' — a paid purchase, never given by a mission':'')])),otherTrees=Object.fromEntries((local().trees||[]).filter(x=>x.id!==t.id).map(x=>[x.id,x.name||x.id]));
  const people=Object.fromEntries(givers.filter(g=>g.group==='district'&&g.kind!=='device'&&g.kind!=='machine').map(g=>[g.id,g.name]));
  const standing=Object.fromEntries([...givers.filter(g=>g.group==='district'||g.canTalk).map(g=>[g.id,g.name+' (NPC)']),...G().FACTIONS.map(f=>[f,((root.VoidFactions?.factions||{})[f]||{}).name||f])]);
  const fill=()=>{idSel.replaceChildren();const k=kindSel.value,list=k==='item'?refs.items:k==='ship'?ships:k==='location'?refs.locations:k==='reputation'?standing:k==='contact'||k==='follow'?people:k==='gate'?Object.fromEntries(gates):k==='tree'?otherTrees:k==='missiles'?Object.fromEntries(Object.entries(root.VoidOrdnance?.TYPES||{}).map(([id,x])=>[id,x.title])):{};for(const [id,n] of Object.entries(list))idSel.append(new Option(n+' ('+id+')',id));
   idSel.hidden=['flag','credits','nav-coords'].includes(k);storeSel.hidden=k!=='item';valIn.hidden=!['flag','credits','reputation','missiles'].includes(k);valIn.placeholder=k==='flag'?'flag name (letters, digits, - _)':k==='missiles'?'how many (1 to 30)':'amount';};
  kindSel.onchange=fill;fill();const ukHelp=Object.fromEntries(UK.map(k=>[k.id,k.note||k.why||'']));
  add.append(kindSel,...optHelp(kindSel,ukHelp,'Kind of unlock'),idSel,storeSel,valIn,whenSel,btn('+ ADD',()=>{const k=kindSel.value,v=valIn.value.trim(),n=parseInt(v,10);ed(x=>{x.unlocks=x.unlocks||[];const u=k==='nav-coords'?{kind:k}:k==='credits'?{kind:k,amount:Number.isFinite(n)?n:0}:k==='flag'?{kind:k,id:v,value:true}:k==='reputation'||k==='missiles'?{kind:k,id:idSel.value,amount:Number.isFinite(n)?n:0}:{kind:k,id:idSel.value,...(k==='item'?{store:storeSel.value}:{})};if(whenSel.value!=='complete')u.when=whenSel.value;x.unlocks.push(u);},true);},'',{'data-me-unlock-add':m.id}));
  box.append(add);return box;}
 function npcTable(t){const box=el('section','','me-npcs');box.append(el('h4','NPCs in this tree ('+t.npcs.length+')'));const tb=el('table','','me-table');tb.innerHTML='<tr><th>NPC</th><th>Part in this tree</th><th>Registered voice (read-only)</th><th>Re-voice engine</th></tr>';
  for(const n of t.npcs){const tr=el('tr');const b=btn(n.name,()=>openNpcTab(n.id),'me-link',{'data-me-npc-link':n.id,title:'Open '+n.name+' in Developer Tools › NPCs (lines and voice, placement, preview)'});const td=el('td');td.append(b);tr.append(td,el('td',n.roles.join(', ')),el('td',n.voice?n.voice.voice+' · '+n.voice.status:'not in the voice registry (on-screen text only)'),el('td',n.engine?(n.engine.engine==='elevenlabs'?'ElevenLabs · '+n.engine.voice.split(' - ')[0]:'Kokoro'):'—'));tb.append(tr);}
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
  {const ap=el('section','','me-end',{'data-me-apt-other':m.key});ap.append(el('h4','Apartments for this mission'),el('p','This mission is from the older game data, which cannot hold apartments. Apartments go into the missions of your own trees and the Main storyline (“Apartments for this mission”, above each mission’s steps). To give this one an apartment, copy it into a new tree of yours:','me-small'),
    btn('COPY THIS MISSION INTO A NEW TREE',()=>copyInto([m],m.title),'',{'data-me-apt-copy':m.key}));box.append(ap);}
  const out=T().allLines(m).filter(l=>voiceState(l).revoice);act.append(btn('RE-VOICE ALL OUT-OF-DATE LINES IN THIS MISSION ('+out.length+')',()=>revoice(out,m),'',out.length&&server.queue?{}:{disabled:''}));
  if(m.server&&server.roles?.roles?.editor&&server.roles.roles.draftsEnabled)act.append(btn('SAVE AS PRIVATE SERVER DRAFT',()=>serverDraft(m)));
  act.append(btn('EXPORT MY EDITS',exportEdits),btn('REVERT THIS MISSION',()=>{if(!confirm('Throw away your edits to "'+m.title+'"?'))return;revertMission(m);draw();}));
  box.append(act);if(!playable(m))box.append(el('p',playable(m,true),'me-small'));
  const not=MC().notApplied({studio:studio(),local:local(),givers,items});if(not.length){const d=el('details','','me-npc-group',{'data-me-not-applied':'1'});d.append(el('summary',not.length+' edit(s) in your draft will NOT show when you play or publish it (click to see which)'));for(const t of not)d.append(el('p','• '+t,'me-small'));box.append(d);}
  return box;
 }
 function groupByScene(lines){const out=[];for(const l of lines){const t=l.scene||'';let g=out.find(x=>x.title===t);if(!g){g={title:t,lines:[],meta:{}};out.push(g);}g.lines.push(l);}return out;}
 function sceneBlock(title,lines,meta){const box=el('div','','me-scene');if(title)box.append(el('h5',title+(meta&&meta.shared?' (shared with the other arc)':'')+(meta&&meta.partial?' · some lines are built by code and not listed':'')));for(const l of lines)box.append(lineRow(l));return box;}
 function lineRow(l){
  const row=el('div','','me-line',{'data-me-line':l.ref||l.key});const t=shownText(l),e=lineEdit(l),vs=voiceState(l);
  const who=el('div','','me-who');who.append(el('b',l.name),el('span',l.voice?'voice '+l.voice.voice+' ('+l.voice.status+')':'no registered voice','me-small'));row.append(who);
  const body=el('div','','me-say'),player=l.who==='player';const unlocked=!player&&(!l.locked||(e&&e.unlocked));
  const ta=el('textarea','','',{'aria-label':'What '+l.name+' says',rows:String(Math.min(4,Math.ceil(t.length/90)||1))});ta.value=t;ta.disabled=!unlocked;const tn=tagNoteEl(t,l.who,l.name);ta.oninput=()=>{setLine(l,ta.value);const s=row.querySelector('.me-vs');const v=voiceState(l);if(s){s.textContent=v.text;s.className='me-vs me-'+v.cls;}tagNoteSet(tn,ta.value,l.who,l.name);};body.append(ta,tn);
  const tags=el('div','','me-tags');
  if(l.locked)tags.append(el('span',unlocked?'Your script — unlocked for your edit':l.lock,'me-lock'));
  if(l.placeholder)tags.append(el('span','Claude’s placeholder (not your words)','me-warn'));
  if(l.kind==='design')tags.append(el('span','design note: the game does not speak it yet','me-warn'));
  if(player)tags.append(el('span','the player’s own words: shown for context, not edited here','me-small'));else tags.append(el('span',l.adapter==='code-change'?'can be edited after the next update (needs a code change)':l.adapter==='records'?'shows in the game (mission records)':'shows in the game when played or published','me-small'));
  tags.append(el('span',vs.text,'me-vs me-'+vs.cls));
  if(l.locked&&!unlocked&&!player)tags.append(btn('UNLOCK TO EDIT MY SCRIPT',()=>{if(!confirm('This is your own script ('+l.lock.replace('Your script — locked ','')+'). Edit it here?'))return;setLine(l,t,true);draw();}));
  if(vs.revoice)tags.append(btn('RE-VOICE',()=>revoice([l]),'',server.queue?{}:{disabled:'',title:'The re-voice queue is switched off on the server.'}));
  if(e)tags.append(btn('UNDO EDIT',()=>{const d=local();delete d.lines[l.ref];saveLocal(d);draw();}));
  if(!player&&lineKey(l)&&l.kind!=='beginner'&&l.kind!=='design'){const ib=importBox(lineKey(l),l.who,()=>ta.value,{onChange:()=>{const s=row.querySelector('.me-vs'),v=voiceState(l);if(s){s.textContent=v.text;s.className='me-vs me-'+v.cls;}}});ta.addEventListener('input',()=>ib.refresh());body.append(tags,ib);row.append(body);return row;}   // IMPORT VOICE FILE (voice-imports.js)
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
 /* LINES AND VOICE for one NPC (moved here from the Mission Editor's old "All lines for an NPC" view on 18 Nov 2026; Developer Tools > NPCs shows it as that NPC's
    "Lines & voice"). Every line the NPC says in a mission (grouped by tree and mission, with a button to open that mission) and outside missions; the registered voice
    is shown read-only (voices are never changed here); RE-VOICE queues a changed line. Search filters the lines. Works for an NPC with no lines at all. */
 function linesFor(id){if(!built)return null;const g=giver(id),ids=[id,g&&g.say].filter(Boolean);return (built.npcs||[]).find(x=>ids.includes(x.id))||null;}
 function linesView(root_,id,opt={}){
  if(!built){root_.append(el('p','Loading the lines…','dev-note'));return;}
  const n=linesFor(id),g=giver(id),q=String(opt.search||'').trim().toLowerCase(),has=l=>!q||String(shownText(l)).toLowerCase().includes(q)||String(l.missionTitle||l.where||l.group||'').toLowerCase().includes(q);
  const reg=src.registry?.npcs?.[id]||(g&&src.registry?.npcs?.[g.say]);
  root_.append(el('p',(reg?'Registered voice (read-only): '+reg.voice+' · '+reg.status:'Not in the voice registry: their lines are on-screen text only.')+(n&&n.engine?' · Re-voice engine: '+(n.engine.engine==='elevenlabs'?'ElevenLabs, '+n.engine.voice+' ('+n.engine.note+')':'Kokoro on your PC (generate.py --from-queue)'):''),'dev-note',{'data-npc-voice':id}));
  root_.append(hint(TAG_HELP,{'data-me-tag-help':'1'}));
  root_.append(hint('A registered Kokoro voice is locked and never changed here (an ElevenLabs voice for new lines is chosen in the Voice box). Editing a line here changes what is shown; a recorded line is text only until it is re-voiced (RE-VOICE adds it to the queue you record on your PC).'));
  const inM=(n?n.inMissions:[]).filter(has),out=(n?n.outside:[]).filter(has),total=n?n.inMissions.length+n.outside.length:0;
  const stale=[...inM,...out].filter(l=>voiceState(l).revoice),bar=el('div','','me-row');
  if(server.queue)bar.append(btn('DOWNLOAD THE RE-VOICE QUEUE (for generate.py --from-queue)',downloadQueue));bar.append(btn('RE-VOICE ALL OUT-OF-DATE LINES ('+stale.length+')',()=>revoice(stale),'',stale.length&&server.queue?{}:{disabled:'',title:server.queue?'Nothing out of date.':'The re-voice queue is switched off on the server.'}));root_.append(bar);
  root_.append(el('p',total+' line(s) in all · '+(n?n.inMissions.length:0)+' in missions · '+(n?n.outside.length:0)+' outside missions'+(q?' · '+(inM.length+out.length)+' match “'+opt.search+'”':''),'me-small',{'data-npc-line-count':id}));
  root_.append(el('h4','In missions ('+inM.length+')'));
  const byTree=new Map();for(const l of inM){const k=l.treeTitle+' › '+l.missionTitle;if(!byTree.has(k))byTree.set(k,[]);byTree.get(k).push(l);}
  for(const [k,ls] of byTree){const d=el('details','','me-npc-group');d.open=inM.length<40||!!q;const sm=el('summary',k+' ('+ls.length+')');d.append(sm);
   const l0=ls[0],key=l0&&(findMission(l0.mission)?l0.mission:findMission('tree:'+l0.mission)?'tree:'+l0.mission:null);if(key)d.append(btn('OPEN THIS MISSION',()=>{const f=findMission(key);Object.assign(ui,{mode:'trees',tree:f.tree.id,mission:key,step:null,scrollTo:true});if(DTX()){VoidDevTools.tab='missions';VoidDevTools.render();}},'',{'data-npc-open-mission':key}));
   const ws=new Map();for(const l of ls){if(!ws.has(l.where))ws.set(l.where,[]);ws.get(l.where).push(l);}for(const [w,ll] of ws){d.append(el('h5',w));for(const l of ll)d.append(lineRow(l));}root_.append(d);}
  if(!inM.length)root_.append(el('p',q?'No mission line matches.':'No lines in missions yet. Give them a mission with MAKE GIVER, or name them in a step.','me-small'));
  root_.append(el('h4','Outside missions ('+out.length+')'));
  const groups=new Map();for(const l of out){const gg=l.group||'Other lines';if(!groups.has(gg))groups.set(gg,[]);groups.get(gg).push(l);}
  for(const [gg,ls] of groups){const d=el('details','','me-npc-group');d.open=ls.length<20||!!q;d.append(el('summary',gg+' ('+ls.length+')'));for(const l of ls)d.append(lineRow(l));root_.append(d);}
  // the street pair's one neutral line with no mission (ncz-street-pair.js GREETING: in the code, text only)
  const gr=root.VoidStreetPair?.GREETING?.[id];if(gr&&gr.length){const d=el('div','','me-scene',{'data-npc-greeting':id});d.append(el('h5','When there is no mission for the player (placeholder in the game’s code)'));for(const t of gr)d.append(el('p','“'+t+'” · text only, no voice · needs a code change to edit','me-small'));root_.append(d);}
  if(!out.length&&!(gr&&gr.length))root_.append(el('p',q?'No other line matches.':'No lines outside missions.','me-small'));}
 // ---------------- IMPORT VOICE FILE (the owner, 19 Nov 2026: type the line, make the voice in ElevenLabs, import the file here). voice-imports.js holds the rules.
 /* The draft keeps a record per line (local().clips[lineKey]: who, text at import, hash, type, duration, bytes, name); the audio stays in this browser (IndexedDB) until
    PUBLISH uploads it. Changing the words afterwards flags the line ("text changed since the voice was imported") and the file is not used for the new words. */
 const VI=()=>root.VoidVoiceImports;
 const lineKey=l=>!l?null:l.kind==='tree'&&l.key?l.key:l.ref||null;
 const clipRec=k=>k?(local().clips||{})[k]||null:null;
 function treeLineText(key){const [mid,a,b,c]=key.slice(5).split('/');const m=(local().trees||[]).flatMap(t=>t.missions).find(x=>x.id===mid);if(!m)return undefined;
  if(a==='feed'){const f=(m.feeds||[]).find(x=>x.id===b),bt=f&&f.scene&&Array.isArray(f.scene.beats)?f.scene.beats[Number(c)]:null;return bt&&bt.act==='line'?String(bt.text||''):undefined;}   // a camera feed's line (cult-room-editor.js)
  const list=a==='offer'?m.offer:a==='deny'?(m.start||{}).denySay:a==='ending'?(m.ending||{}).say:((m.objectives||[]).find(o=>o.id===a)||{})[b],l=list&&list[Number(a==='offer'||a==='ending'||a==='deny'?b:c)];return l?String(l.text||''):undefined;}
 function clipTextOf(key){if(String(key).startsWith('tree:'))return treeLineText(key);const l=index&&index.get(key);return l?shownText(l):undefined;}
 function setClip(key,rec){const d=local();d.clips=d.clips||{};if(rec)d.clips[key]=rec;else delete d.clips[key];saveLocal(d);}
 const IMPORT_HELP='Made the line in ElevenLabs? Download it (MP3 is best) and press IMPORT VOICE FILE. Players then hear your file for exactly these words. 40 seconds at most; a big file is made smaller for you.';
 function importBox(key,who,textNow,opt={}){const I=VI(),box=el('div','','me-import',{'data-me-import':key});box.refresh=()=>{};if(!I)return box;
  const draw_=()=>{box.replaceChildren();const rec=clipRec(key),now=String(textNow()||''),row=el('div','','me-row');
   const input=el('input','','',{type:'file',accept:'audio/*,.mp3,.wav,.ogg,.opus,.m4a,.webm',hidden:'','data-me-import-file':key,'aria-label':'Voice file'}),msg=el('p','','me-small',{'data-me-import-msg':key,role:'status'});
   input.onchange=async()=>{const f=input.files&&input.files[0];input.value='';if(!f)return;const words=String(textNow()||'').trim();if(!words){msg.className='me-small me-bad';msg.textContent='Write what they say first, then import the voice file for those words.';return;}
    msg.className='me-small';const r=await I.prepare(f,t=>{msg.textContent=t;});if(!r.ok){msg.className='me-small me-bad';msg.textContent=r.why;return;}
    const kept=await I.store(r.hash,r.type,r.data,r.duration);setClip(key,I.record({who,text:words,hash:r.hash,type:r.type,duration:r.duration,bytes:r.bytes,name:r.name,reencoded:r.reencoded}));
    status='Voice file imported ('+r.duration.toFixed(1)+' s'+(r.reencoded?', made smaller for you: Ogg Opus, '+Math.round(r.bytes/1024)+' KB':'')+'). PLAY THIS DRAFT uses it now; PUBLISH sends it to players. UNDO takes it back.'+(kept?'':' This browser’s site storage is blocked, so the file is only kept until you reload: publish before you close the game.');
    draw_();if(opt.onChange)opt.onChange();const st=document.querySelector('#me-status,#npc-root .me-status');if(st)st.textContent=status;};
   if(!rec){row.append(btn('IMPORT VOICE FILE',()=>input.click(),'',{'data-me-import-btn':key,title:'Pick an audio file you made for this line (MP3, WAV or OGG; M4A or WEBM if your browser plays them).'}),input);box.append(row,hint(IMPORT_HELP),msg);box.refresh=()=>{};return;}
   const st=I.status(rec,now),chip=el('span',st.text,'me-vs me-'+st.cls,{'data-me-import-status':st.state});
   const info=el('span',rec.name+' · '+rec.duration.toFixed(1)+' s · '+Math.max(1,Math.round(rec.bytes/1024))+' KB'+(rec.reencoded?' · made smaller (Ogg Opus)':''),'me-small',{'data-me-import-info':key});
   let audio=null;const play=btn('▶ PLAY',async()=>{try{if(audio){audio.pause();audio=null;play.textContent='▶ PLAY';return;}const data=await I.getData(rec.hash);audio=new Audio(URL.createObjectURL(new Blob([data],{type:rec.type})));audio.onended=()=>{play.textContent='▶ PLAY';URL.revokeObjectURL(audio.src);audio=null;};play.textContent='■ STOP';await audio.play();}catch{msg.className='me-small me-bad';msg.textContent='The file could not be played here. Import it again (REPLACE).';}},'',{'data-me-import-play':key});
   row.append(chip,info,play,btn('REPLACE',()=>input.click(),'',{'data-me-import-replace':key}),btn('REMOVE',()=>{setClip(key,null);status='Imported voice file removed from this line (UNDO puts it back).';draw_();if(opt.onChange)opt.onChange();},'me-x',{'data-me-import-remove':key}),input);
   box.append(row,msg);I.available(rec.hash).then(a=>{if(!a&&st.state==='ok'){const m2=I.status(rec,now,{available:false});chip.textContent=m2.text;chip.className='me-vs me-'+m2.cls;chip.dataset.meImportStatus=m2.state;}}).catch(()=>{});
   box.refresh=()=>{const s2=I.status(clipRec(key),String(textNow()||''));if(s2&&s2.state!==chip.dataset.meImportStatus){chip.textContent=s2.text;chip.className='me-vs me-'+s2.cls;chip.dataset.meImportStatus=s2.state;if(opt.onChange)opt.onChange();}};};
  draw_();return box;}
 // ---------------- VOICE (queue item 0b, approved 18 Nov 2026): the current voice, and an ElevenLabs voice chosen by pasting its link or ID plus a name (npc-voices.js).
 /* Never generates audio, never asks for or keeps an API key, never lists the owner's ElevenLabs library: the choice is draft content (published like missions, checked by the
    server); lines RE-VOICEd for that character wait in the re-voice queue until the owner approves the spend. Registered Kokoro voices stay read-only. */
 function setVoice(id,v){const d=local();d.voices=d.voices||{};if(v)d.voices[id]=v;else delete d.voices[id];saveLocal(d);rebuild();}
 function voiceLines(id){const n=linesFor(id),v=voiceNow(id);return n?[...n.inMissions,...n.outside].filter(l=>l.who!=='player').map(l=>V()?V().speakText(shownText(l),v):shownText(l)):[];}   // as they are sent (voice tags only for a model that reads them)
 /* One line at the top of an NPC's page: "Voice: ElevenLabs — name (model) · LISTEN ON ELEVENLABS ↗" and where it comes from (npc-voices.js summary). No network. */
 function voiceSummary(id){const X=V(),p=el('p','','me-voice-sum',{'data-voice-summary':id});p.append(el('b','Voice: '));if(!X){p.append('—');return p;}const s=X.summary(voiceNow(id));p.dataset.voiceKind=s.kind;p.append(document.createTextNode(s.text));
  if(s.kind==='elevenlabs'){p.append(' · ',el('a','LISTEN ON ELEVENLABS ↗','me-link',{href:s.url,target:'_blank',rel:'noopener noreferrer','data-voice-summary-listen':s.voiceId,title:'Opens the voice’s page on elevenlabs.io. Listening there costs nothing.'}),el('span',' · '+s.fromText,'me-small',{'data-voice-summary-from':s.from}));}
  return p;}
 function voicePanel(id,opt={}){const box=el('section','','me-check me-voice',{'data-voice-panel':id}),redraw=opt.redraw||draw,say=opt.say||(t=>{status=t;}),X=V();box.append(el(opt.compact?'h5':'h4','Voice'));
  if(!X){box.append(el('p','The voice tools could not load. Reload the page.','me-bad'));return box;}
  const no=X.refusal(id,src&&src.registry);if(no){box.append(el('p',no,'me-warn',{'data-voice-refused':id}));return box;}
  const cur=voiceNow(id),name=(giver(id)||{}).name||id,p=el('p','','',{'data-voice-current':cur.kind});
  if(cur.kind==='elevenlabs'){p.append(el('b','ElevenLabs: '),document.createTextNode(cur.name+' ('+X.modelLabel(cur.model)+')'+(cur.chosen?' · chosen '+cur.chosen.replace(/ \(.*$/,''):'')+(cur.from==='editor'?' · your choice in this draft (PUBLISH keeps it)':' · set in the re-voice file')),document.createTextNode(' '));
   const a=el('a','Listen on ElevenLabs ↗','me-link',{href:X.listenUrl(cur.voiceId),target:'_blank',rel:'noopener noreferrer','data-voice-listen':cur.voiceId,title:'Opens the voice’s page on elevenlabs.io. Listening there costs nothing.'});p.append(a);box.append(p);
   if(DTX()?.mode==='advanced')box.append(el('p','Voice ID '+cur.voiceId,'me-small'));
   box.append(hint(cur.kokoro?'Lines already recorded keep their Kokoro voice ('+cur.kokoro.voice+', locked). New or changed lines you RE-VOICE are recorded with this ElevenLabs voice once you approve the spend.':'Lines you RE-VOICE are recorded with this voice once you approve the spend.'));}
  else if(cur.kind==='kokoro'){p.append(el('b','Kokoro (free, on your PC): '),document.createTextNode(cur.voice+' · '+cur.status+' · read-only (locked in the voice registry)'));box.append(p);}
  else{p.append(el('b','No voice yet: '),document.createTextNode(name+'’s lines are on-screen text only. Choose an ElevenLabs voice below to have them recorded.'));box.append(p);}
  if(X.note(id))box.append(el('p',X.note(id),'me-small me-warn',{'data-voice-street':id}));
  const mdl=cur.kind==='elevenlabs'?cur.model:null,est=X.estimate(voiceLines(id),mdl),queued=(server.queue?.items||[]).filter(q=>q.who===id&&q.status==='queued'),qe=X.estimate(queued.map(q=>q.speak||q.text),mdl);
  if(mdl){const ms=el('select','','',{'aria-label':'ElevenLabs model','data-voice-model':id});for(const [k,mm] of Object.entries(X.MODELS))ms.append(new Option(mm.label+' · about '+mm.rate+' credit'+(mm.rate===1?'':'s')+' per character (estimate)',k));ms.value=mdl;
   const md=el('p',X.MODELS[mdl].text,'me-small',{'data-voice-model-text':id});ms.onchange=()=>{const v=(local().voices||{})[id];if(cur.from==='editor'&&v)setVoice(id,{...v,model:ms.value});else{const r=X.make(id,cur.voiceId,String(cur.name).replace(/\s*[(,].*$/,'').slice(0,X.LIMIT.name)||'ElevenLabs voice',{registry:src&&src.registry,model:ms.value});if(!r.ok){say(r.why);redraw();return;}setVoice(id,r.voice);}say('Model for '+name+': '+X.MODELS[ms.value].label+'. Saved in your draft (UNDO takes it back).');redraw();};
   const w=el('label','','me-field');w.append(el('span','ElevenLabs model'),ms,md);box.append(w);}
  const ep=el('p','Re-voicing all of '+name+'’s lines: '+est.lines+' line(s) · '+est.chars.toLocaleString()+' characters · about '+est.credits.toLocaleString()+' ElevenLabs credits'+(mdl?' with '+X.MODELS[mdl].label.replace(/ \(.*$/,'')+' (an estimate).':' (Flash / Turbo: about '+est.fast.toLocaleString()+').')+(server.queue?' Waiting in the re-voice queue now: '+qe.lines+' line(s), about '+qe.credits.toLocaleString()+' credits.':''),'me-small',{'data-voice-estimate':String(est.chars)});
  box.append(ep,hint(est.text));
  const d=el('details','','me-voice-pick',{'data-voice-choose':id});d.open=!!opt.open||ui.voiceOpen===id;d.ontoggle=()=>{ui.voiceOpen=d.open?id:(ui.voiceOpen===id?null:ui.voiceOpen);};d.append(el('summary',cur.kind==='elevenlabs'&&cur.from==='editor'?'Change the ElevenLabs voice':'Choose an ElevenLabs voice'));
  const li=el('input','','',{'aria-label':'ElevenLabs voice link or ID',placeholder:'https://elevenlabs.io/voices/… or the 20-character voice ID','data-voice-input':id,maxlength:'300',autocomplete:'off',spellcheck:'false'}),ni=el('input','','',{'aria-label':'Name of the voice',placeholder:'What you call it, e.g. Gravel street vendor','data-voice-name':id,maxlength:String(X.LIMIT.name)});
  const fl=(label,inp,h)=>{const w=el('label','','me-field');w.append(el('span',label),inp,hint(h));return w;};
  const msg=el('p','','me-small',{'data-voice-check':id,role:'status'});
  const check=()=>{msg.replaceChildren();if(!li.value.trim()){msg.className='me-small';msg.textContent='';return;}const r=X.parse(li.value);msg.className='me-small '+(r.ok?'me-ok':'me-bad');if(r.ok){msg.append('✓ Voice ID '+r.id+' ',el('a','Listen on ElevenLabs ↗','me-link',{href:X.listenUrl(r.id),target:'_blank',rel:'noopener noreferrer','data-voice-listen-new':r.id}));}else msg.textContent=r.why;};
  li.oninput=check;
  const save=btn('USE THIS VOICE',()=>{const r=X.make(id,li.value,ni.value,{registry:src&&src.registry,model:mdl||undefined});if(!r.ok){msg.className='me-small me-bad';msg.textContent=r.why;return;}setVoice(id,r.voice);ui.voiceOpen=null;say('Voice for '+name+': '+r.voice.name+' (ElevenLabs). Saved in your draft (UNDO takes it back). Nothing was generated or paid: RE-VOICE puts their lines in the queue.');redraw();},'me-play',{'data-voice-save':id});
  d.append(hint('1. In ElevenLabs, open the voice and copy the link of its page (or its voice ID). 2. Paste it here and give it a name. 3. USE THIS VOICE. Your ElevenLabs account and key are never used here, and nothing is recorded or paid: lines you RE-VOICE wait in the queue until you approve the spend; then Claude records them.'),
   fl('ElevenLabs voice link or ID',li,'A link like elevenlabs.io/voices/AbCdEf… or just the ID (20 letters and digits).'),msg,fl('Name',ni,'Your own name for it, shown here and in the voices file (60 characters at most).'));
  const r=el('div','','me-row me-actions');r.append(save);
  if(cur.kind==='elevenlabs'&&cur.from==='editor')r.append(btn('REMOVE MY CHOICE',()=>{setVoice(id,null);say('Removed your voice choice for '+name+' (UNDO puts it back).');redraw();},'me-x',{'data-voice-remove':id,title:'Back to '+(voiceNow(id).kind==='none'?'no voice':'the voice they had before')+'.'}));
  d.append(r);box.append(d);
  if(!opt.compact){const n=Object.keys(local().voices||{}).length,ex=el('div','','me-row');ex.append(btn('DOWNLOAD THE VOICES FILE (revoice-engines.json)',()=>downloadVoices(),'',{'data-voice-export':'1'}),hint('Every ElevenLabs voice in the game’s re-voice file plus your '+n+' choice(s), in the same format as tools/audio/revoice-engines.json. Send it to Claude or Codex to keep it in the game files; publishing also carries your choices.'));box.append(ex);}
  return box;}
 function downloadVoices(){const data=V().exportEngines(local().voices||{},src&&src.enginesFile);const a=el('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,1)+'\n'],{type:'application/json'}));a.download='revoice-engines.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);return data;}
 // ---------------- open Developer Tools > NPCs on one NPC
 function openNpcTab(id){if(typeof VoidDevTools==='undefined')return;VoidDevTools.npcFocus=id||null;VoidDevTools.tab='npcs';VoidDevTools.render();}
 // ---------------- "Giver waits at" (Reverie, Lace): a spot on the map, checked against where she can walk
 const compass=y=>{if(!Number.isFinite(y))return '';const d=((y*180/Math.PI)%360+360)%360,names=['north (the shop wall)','north-east','east','south-east','south (the road)','south-west','west','north-west'];return names[Math.round(d/45)%8];};
 function waitAtPanel(t,m,ed){const X=root.VoidNPCPaths,g=giver(m.giver)||{name:m.giver},w=m.waitAt||null,probs=w?X.waitAtProblems(m.giver,w):[],box=el('section','','me-end me-wait',{'data-me-wait-at':m.id});
  box.append(el('h4','Giver waits at'),hint(HELP.waitAt));
  const r=el('div','','me-row');r.append(el('b',w?'Spot: x '+w.x.toFixed(1)+', z '+w.z.toFixed(1)+' · facing '+compass(w.yaw):'Not set: '+g.name+' keeps her usual walk.',w&&!probs.length?'me-ok':'',{'data-me-wait-text':m.id}));
  if(w){r.append(btn('CLEAR (HER USUAL WALK)',()=>ed(x=>{delete x.waitAt;},true),'me-x',{'data-me-wait-clear':m.id}),btn('JUMP THERE',()=>jumpTo(w.x,w.z,m.giver,g.name+' waits here'),'',{'data-me-wait-jump':m.id,title:'Opens a throwaway test session in the spot’s area, standing a few steps from the spot (your real save is never touched).'}));
   for(const f of [['N',0],['E',Math.PI/2],['S',Math.PI],['W',-Math.PI/2]])r.append(btn('face '+f[0],()=>ed(x=>{x.waitAt={...x.waitAt,yaw:Math.round(f[1]*100)/100};},true),'',{'aria-label':'Face '+compass(f[1])}));}
  box.append(r);for(const p of probs)box.append(el('p','⚠ '+p,'me-bad'));
  if(root.VoidNPCMap){const live=root.VoidStreetPair?.live?.(),markers=[];
   for(const tt of local().trees)for(const mm of tt.missions)if(mm.id!==m.id&&mm.giver===m.giver&&mm.waitAt)markers.push({id:'o-'+mm.id,x:mm.waitAt.x,z:mm.waitAt.z,yaw:mm.waitAt.yaw,ghost:true,color:'#c08aff',label:(mm.title||mm.id)+' (another mission)'});
   if(live&&live.her)markers.push({id:'live',x:live.her.x,z:live.her.z,ghost:true,color:'#ffd34d',label:(giver(live.her.id)||{}).name+' now'});
   if(w)markers.push({id:'wait',x:w.x,z:w.z,yaw:Number.isFinite(w.yaw)?w.yaw:Math.PI,color:'#ff8ad8',label:g.name+' waits here',drag:true,facing:true,bad:probs.length>0});
   const put=(x,z)=>{const p=X.snap(m.giver,{x,z});ed(mm=>{mm.waitAt={x:p.x,z:p.z,yaw:mm.waitAt&&Number.isFinite(mm.waitAt.yaw)?mm.waitAt.yaw:Math.round(Math.PI*100)/100};},true);};
   const map=root.VoidNPCMap.create({npc:m.giver,markers,center:w?w.x:null,selected:'wait',onPick:put,onDrag:(id,x,z)=>{if(id==='wait')put(x,z);},onFacing:(id,yaw)=>{if(id==='wait')ed(mm=>{mm.waitAt={...mm.waitAt,yaw};},true);}});
   map.el.dataset.meWaitMap=m.id;box.append(map.el);}
  return box;}
 // ---------------- FOLLOW / LEAD / SHARED-CAB steps (npc-escort.js, queue item 3): who walks with the player, the spot on the map or the cab stop, and the distances
 const EX=()=>root.VoidNPCEscort;
 // where she is placed for a mission (npc-escort.js placedArea: where she waits for it, else her all-day placement in this draft, else The Avenue)
 const escArea=(m,id)=>{const E=EX();if(!E||!E.placedArea)return 'avenue';E.draftPlans=()=>local().npcs||{};return E.placedArea(id,{waitAt:m&&m.giver===id?m.waitAt:null});};
 /* Who: everyone the editor knows, but only people who can walk with the player can be chosen; the rest are greyed with the reason. */
 function escortWho(o,eo){const E=EX(),sel=el('select','','',{'aria-label':'Who walks with the player','data-me-step-npc':o.id});sel.append(new Option('— choose who —',''));
  const ok=givers.filter(g=>E.can(g.id,o.kind).ok),no=givers.filter(g=>!E.can(g.id,o.kind).ok&&g.group==='district');for(const g of ok)sel.append(new Option(g.name,g.id));
  if(no.length){const og=el('optgroup','',null,{label:'Cannot walk with the player yet'});for(const g of no){const op=new Option(g.name+' — '+E.can(g.id,o.kind).why.split(':')[0],g.id);op.disabled=true;op.title=E.can(g.id,o.kind).why;og.append(op);}sel.append(og);}
  sel.value=o.npc&&E.can(o.npc,o.kind).ok?o.npc:'';if(o.npc&&!sel.value){const op=new Option((giver(o.npc)||{name:o.npc}).name+' (cannot do this step)',o.npc);op.disabled=true;sel.append(op);sel.value=o.npc;}
  sel.title='Only people whose walking the game controls (Reverie, Lace, the street cat) can walk with the player. Others are greyed with the reason.';sel.onchange=()=>eo(x=>{x.npc=sel.value;if(E.CAB.has(x.kind)&&x.stop&&!E.stopOk(x.npc,x.stop,escArea(null,x.npc)))delete x.stop;},true);return sel;}
 function escortPanel(m,o,eo){const E=EX(),X=root.VoidNPCPaths,box=el('section','','me-end me-esc',{'data-me-esc':o.id}),who=giver(o.npc)||{name:o.npc||'they'},c=o.npc?E.can(o.npc,o.kind):{ok:false,why:'Choose who walks with the player first.'};
  box.append(el('h4',E.SPOT.has(o.kind)?'Where they go':'The cab ride'));if(!c.ok){box.append(el('p','⚠ '+c.why,'me-warn',{'data-me-esc-why':o.id}));return box;}
  const area=escArea(m,o.npc),AN=(root.VoidNPCAreas?.get(area)||{name:'The Avenue'}).name;box.append(el('p',who.name+' is placed in '+AN+' for this mission (where she waits for it, else her placement in Developer Tools > NPCs): the step happens there.','me-small',{'data-me-esc-area':o.id}));
  const ectx={area,apartments:m.apartments||[],steps:m.objectives||[]};
  for(const p of E.problems(o,ectx).filter(p=>!/Pick the spot|Choose the cab/.test(p)))box.append(el('p','⚠ '+p,'me-bad'));
  if(E.SPOT.has(o.kind))box.append(intoRow(m,o,eo,who));
  if(E.SPOT.has(o.kind)&&(o.apt!=null||o.mod!=null)){box.append(el('p',o.kind==='follow-them'?who.name+' walks to the place’s street door, goes in first when the player is close, and leads the way inside, room to room (through doorways and in the elevator). Done when both are inside the room you chose.':'The player walks to the place’s street door and goes in; '+who.name+' comes in behind them and follows them inside, room to room (through doorways and in the elevator). Done when both are inside the room you chose.','me-small',{'data-me-esc-into-help':o.id}));
   box.append(el('p','If the player leaves the place during the step, '+who.name+' comes back out behind them'+(o.kind==='follow-them'?' (unless the player went further than “lost”: then the setting below applies)':'')+'. After the step '+who.name+' stays in that room until the mission is over.','me-small'));}
  if(E.SPOT.has(o.kind)&&o.apt==null&&o.mod==null){const t=o.to;box.append(el('p',t?'Spot: x '+t.x.toFixed(1)+', z '+t.z.toFixed(1)+'. Click the map to move it, or drag the pink marker.':'Click the map to pick the spot '+(o.kind==='follow-them'?who.name+' walks to (the player follows).':'the player leads '+who.name+' to.'),t?'me-ok me-small':'me-small',{'data-me-esc-text':o.id}));
   if(t&&X)box.append(btn('JUMP THERE',()=>jumpTo(t.x,t.z,o.npc,who.name+': the spot of “'+(o.label||o.id)+'”'),'',{'data-me-esc-jump':o.id,title:'Opens a throwaway test session in the spot’s area, a few steps from the spot (your real save is never touched).'}));
   if(root.VoidNPCMap&&X){const live=root.VoidStreetPair?.live?.(),markers=[];if(live&&live.her&&live.her.id===o.npc)markers.push({id:'live',x:live.her.x,z:live.her.z,ghost:true,color:'#ffd34d',label:who.name+' now'});
    if(t)markers.push({id:'to',x:t.x,z:t.z,color:'#ff8ad8',label:o.kind==='follow-them'?who.name+' leads the player here':'the player leads '+who.name+' here',drag:true,bad:E.problems(o,{area}).length>0});
    const put=(x,z)=>{const p=X.snap(o.npc,{x,z});eo(oo=>{oo.to={x:p.x,z:p.z};},true);guideSoon();};
    const map=root.VoidNPCMap.create({npc:o.npc,markers,center:t?t.x:null,selected:'to',area,lock:area,onPick:put,onDrag:(id,x,z)=>{if(id==='to')put(x,z);}});map.el.dataset.meEscMap=o.id;box.append(map.el);}
   if(o.kind==='follow-them')box.append(escDistances(m,o,eo,who));
   box.append(el('p','Multiplayer: only the player doing this mission is followed or led; other players see '+who.name+' as usual.','me-small'));}
  if(E.SPOT.has(o.kind)&&(o.apt!=null||o.mod!=null)){if(o.kind==='follow-them')box.append(escDistances(m,o,eo,who));box.append(el('p','Multiplayer: the place is private to the player doing this mission (each player has their own copy); other players see '+who.name+' on the street as usual.','me-small'));}
  else if(E.SPOT.has(o.kind)){}
  else{const r=el('div','','me-row'),sel=el('select','','',{'aria-label':'Cab stop','data-me-esc-stop':o.id});sel.append(new Option('— choose the stop —',''));
   for(const s of E.stops(o.npc,area)){const op=new Option(s.name+(s.ok?'':' — not possible'),s.id);if(!s.ok){op.disabled=true;op.title=s.why;}sel.append(op);}sel.value=o.stop||'';sel.onchange=()=>{eo(oo=>{oo.stop=sel.value||undefined;if(!oo.stop)delete oo.stop;},true);guideSoon();};
   r.append(el('b','To'),sel);box.append(r);const bad=E.stops(o.npc,area).filter(s=>!s.ok&&!s.far);if(bad.length)box.append(el('p','Greyed: '+bad[0].why.replace(/ to [^.]*\./,' there.'),'me-small',{'data-me-esc-greyed':o.id}));
   box.append(el('p',o.kind==='their-cab'?who.name+' waits until the player is near, walks to the kerb and calls the cab. The player boards with BOARD TAXI and pays the normal fare (your developer account rides free).':'The player calls the taxi (CALL A TAXI or G) to this stop; '+who.name+' gets in as it waits, and both get out there. The normal fare.','me-small'));}
  return box;}
 /* "Waits when the player is more than … metres behind", "The player is lost beyond … metres" and what happens then (a follow-them step, to a spot or into a place). */
 function escDistances(m,o,eo,who){const E=EX(),frag=el('div','','',{'data-me-esc-dist':o.id});const S=E.settings(o),L=E.LIMIT,r=el('div','','me-row'),num=(key,lim,label,help)=>{const i=el('input','','',{type:'number',min:String(lim[0]),max:String(lim[1]),step:'1','aria-label':label,['data-me-esc-'+key]:o.id,style:'width:5em',title:help});i.value=String(S[key]);
      i.onchange=()=>{const v=Math.round(Math.max(lim[0],Math.min(lim[1],Number(i.value)||S[key])));i.value=String(v);eo(oo=>{oo[key]=v;},true);};return i;};
    r.append(el('b','Waits when the player is more than'),num('wait',L.wait,'Waits when the player is this many metres behind','If the player falls this far behind, '+who.name+' stops, turns and waits; they walk on when the player catches up. '+L.wait[0]+' to '+L.wait[1]+' m, usually 8.'),el('span','metres behind','me-small'));frag.append(r);
    const r2=el('div','','me-row');r2.append(el('b','The player is lost beyond'),num('lost',L.lost,'The player is lost beyond this many metres','Further than this from '+who.name+' counts as lost. '+L.lost[0]+' to '+L.lost[1]+' m, usually 40.'),el('span','metres. Then:','me-small'));
    const fl=el('select','','',{'aria-label':'If the player gets lost','data-me-esc-iflost':o.id});for(const x of E.IF_LOST)fl.append(new Option(x.name,x.id));fl.value=S.ifLost;fl.onchange=()=>eo(oo=>{oo.ifLost=fl.value;},true);r2.append(fl);frag.append(r2);
    frag.append(hint('“They stop and wait”: '+who.name+' waits where they are until the player comes back. “The mission fails”: the player is told, and the mission goes back to '+((giver(m.giver)||{}).name||'the giver')+', who offers it again.'));
  return frag;}
 /* WHERE TO (20 Nov 2026, the owner: "if I add an apartment there should be an option to follow into the apartment"): a spot on the street, or one of this mission's places
    by the same names as the "Go into" step (mission-blocks.js placeOptions): "Rundown apartment 104 (…)", "Server room (…)", "Anywhere inside (…)". The cat: greyed. */
 function intoRow(m,o,eo,who){const E=EX(),B=BK(),r=el('div','','me-row'),sel=el('select','','',{'aria-label':'Where to','data-me-esc-into':o.id}),c=E.canInto?E.canInto(o.npc):{ok:true};
  sel.append(new Option(o.kind==='follow-them'?'A spot on the street (pick it on the map)':'A spot on the street (pick it on the map)',''));const list=B?B.placeOptions(m,'apt-enter'):[];
  const g=document.createElement('optgroup');g.label=list.length?(o.kind==='follow-them'?'Into a place of this mission (she leads the player in)':'Into a place of this mission (the player brings them in)'):'Into a place: add a location or an apartment to this mission first';
  for(const p of list){const op=new Option((o.kind==='follow-them'?'Follow '+who.name+' into: ':'Bring '+who.name+' into: ')+p.label,'in:'+p.value);if(!c.ok){op.disabled=true;op.title=c.why;}g.append(op);}if(!list.length){const op=new Option('(no places yet)','');op.disabled=true;g.append(op);}sel.append(g);
  const cur=o.apt!=null?'in:'+B.placeValue(o):'';if(cur&&![...sel.options].some(x=>x.value===cur))sel.append(new Option(cur.slice(3)+' (not in this mission any more)',cur));sel.value=cur;
  sel.title='Where the step ends: a spot on the street, or inside one of this mission’s places (an apartment, or a room of a location built from modules). The same list as the “Go into” step.';
  sel.onchange=()=>{const v=sel.value;eo(x=>{const was=!String(x.label||'').trim()||x.label===intoWords(x,m,who);if(v.startsWith('in:')){B.placeSet(x,v.slice(3),m);delete x.to;}else{delete x.apt;delete x.mod;}if(was){const w=intoWords(x,m,who);if(w)x.label=w;}},true);guideSoon();};
  r.append(el('b','Where to'),sel);if(!c.ok)r.append(el('span',c.why,'me-small',{'data-me-esc-into-why':o.id}));return r;}
 /* The Mission Log words of a follow step into a place: "Follow Reverie into the server room", "Bring Lace into apartment 104". */
 function intoWords(o,m,who){if(o.apt==null)return '';const B=BK(),p=B&&B.placeOptions(m,'apt-enter').find(x=>x.value===B.placeValue(o));if(!p)return '';const n=p.any?p.noun:(/^(apartment |the )/i.test(p.noun)?p.noun:'the '+p.noun);return (o.kind==='follow-them'?'Follow ':'Bring ')+who.name+' into '+n;}
 // ---------------- JUMP THERE: a throwaway test session on The Avenue, a few steps from a spot (the draft applied, so placements and waits show)
 /* opts (NPCs tab): {npcs: {id: plan}} tried in place of the draft's own (a pasted behaviour recipe before it is saved), minute: the in-game time of day to start at (a daily schedule). */
 async function jumpTo(x,z,npc,label,back,opts={}){if(!root.VoidDevTest?.session)return;fresh();const content=draftContent();if(opts.npcs)content.npcs={...(content.npcs||{}),...opts.npcs};const c=MC().check(content,checkCtx());
  write(back||RETURN,{tree:ui.tree,mission:ui.mission,step:null,npc:npc||null,at:Date.now()},root.sessionStorage);
  const r=await root.VoidDevTest.session({banner:'VIEWING: '+(label||'a spot')+' — not your real save',leave:'LEAVE',kind:'draft',
   apply:()=>{if(c.ok)root.VoidLiveContent?.useDraft(content);},
   build:()=>{jumpTo.notes=streetClock([npc]);const C=root.C||root.VoidCampaign,st=C.startDistrictCampaign(C.fresh());st.story.flags.podWakePending=false;st.story.flags.appearanceOffered=true;st.universe.trackedMission=null;
    if(Number.isFinite(opts.minute)){const GC=root.VoidClock;if(GC){const m=((Math.floor(opts.minute)%1440)+1440)%1440,t=(m-GC.START_MIN%1440+1440)%1440;if(t>0)st.story.flags[GC.FLAG]=t;}}return st;},
   clock:clockText,enter:async()=>{state.location='earth';
    // the area of the spot (npc-areas.js): a street quarter or the District interior; the player stands a few steps away on ground they can walk, facing it
    const AR=root.VoidNPCAreas,a=AR&&AR.areaOf({x,z})||'avenue',w=AR?AR.enter(a):{walk:'sacramento',quarter:'avenue'};
    if(w.walk==='darknet-district'){state.story.flags.area='district';state.story.flags.districtBadge=true;await enterWalking(VoidDistrictArea.KEY.interior,{silent:true});}
    else{delete state.story.flags.area;await enterWalking(VoidDistrictArea.KEY.street,{silent:true,quarter:w.quarter});}
    let at=a==='avenue'?{x,z:Math.max(-16,z-3.4)}:null;if(!at&&AR){for(const r of [3.4,2.4,4.4])for(let k=0;k<12&&!at;k++){const t=k/12*Math.PI*2,q={x:x+Math.sin(t+Math.PI)*r,z:z+Math.cos(t+Math.PI)*r},c=AR.check(q,a);if(c.ok&&c.area===a)at=q;}}
    try{if(at){walker.x=at.x;walker.z=at.z;walker.yaw=Math.atan2(x-at.x,z-at.z);}}catch{}},
   message:()=>'VIEWING · '+(label||'the spot')+(c.ok?'':' · your draft has problems, so it is not applied: '+c.errors.slice(0,2).join(' · '))+' · nothing is saved'+((jumpTo.notes||[]).length?' · '+jumpTo.notes.join(' '):'')});
  if(r&&r.error){status=r.error;draw();}return r;}
 // ---------------- "Guide me": the next required box (the same rules as the play / publish check: mission-content.js treeNeeds)
 const NEED_SEL={title:m=>'[data-me-field="title"]',giver:m=>'[data-me-giver="'+CSS.escape(m.id)+'"]','start-from':m=>'[data-me-start-from="'+CSS.escape(m.id)+'"]','start-header':m=>'[data-me-start-header="'+CSS.escape(m.id)+'"]','start-text':m=>'[data-me-start-text="'+CSS.escape(m.id)+'"]',
  'start-mission':m=>'[data-me-start-mission="'+CSS.escape(m.id)+'"]','start-place':m=>'[data-me-start-place="'+CSS.escape(m.id)+'"]','start-flag':m=>'[data-me-start-flag="'+CSS.escape(m.id)+'"]','start-near':m=>'[data-me-start-near="'+CSS.escape(m.id)+'"]','start-ask':m=>'[data-me-ask-on="'+CSS.escape(m.id)+'"]','start-deny':m=>'[data-me-ask-deny-start="'+CSS.escape(m.id)+'"]','cost-when':m=>'[data-me-cost-when="'+CSS.escape(m.id)+'"]',
  'add-step':m=>'[data-me-add-step="'+CSS.escape(m.id)+'"]',kind:(m,o)=>'[data-me-kind="'+CSS.escape(o)+'"]','step-npc':(m,o)=>'[data-me-step-npc="'+CSS.escape(o)+'"]','step-place':(m,o)=>'[data-me-step-place="'+CSS.escape(o)+'"]','step-item':(m,o)=>'[data-me-step-item="'+CSS.escape(o)+'"]','step-clip':(m,o)=>'[data-me-step-clip="'+CSS.escape(o)+'"]',
  'step-subject':(m,o)=>'[data-me-step-subject="'+CSS.escape(o)+'"]',label:(m,o)=>'[data-me-label="'+CSS.escape(o)+'"]',say:(m,o)=>'[data-me-tstep="'+CSS.escape(o)+'"] textarea',ending:m=>'[data-me-ending="'+CSS.escape(m.id)+'"]','wait-at':m=>'[data-me-wait-at="'+CSS.escape(m.id)+'"] canvas','step-spot':(m,o)=>'[data-me-esc-map="'+CSS.escape(o)+'"] canvas','step-stop':(m,o)=>'[data-me-esc-stop="'+CSS.escape(o)+'"]','step-into':(m,o)=>'[data-me-esc-into="'+CSS.escape(o)+'"]',
  'step-apt':(m,o)=>'[data-me-step-apt="'+CSS.escape(o)+'"]','step-object':(m,o)=>'[data-me-step-object="'+CSS.escape(o)+'"]','step-mod':(m,o)=>'[data-me-step-mod="'+CSS.escape(o)+'"]','step-ap':(m,o)=>'[data-me-step-ap="'+CSS.escape(o)+'"]','step-question':(m,o)=>'[data-me-step-question="'+CSS.escape(o)+'"]','step-goto':(m,o)=>'[data-me-step-goto="'+CSS.escape(o)+'"]','step-deny-start':(m,o)=>'[data-me-step-deny-start="'+CSS.escape(o)+'"]','line-choice-goto':(m,o)=>'[data-me-tree-mission="'+CSS.escape(m.id)+'"] [data-me-line-choice-goto^="'+CSS.escape(o||'offer')+'/"]','line-choice-tree':(m,o)=>'[data-me-tree-mission="'+CSS.escape(m.id)+'"] [data-me-line-choice-tree^="'+CSS.escape(o||'offer')+'/"]','apt-door':m=>'[data-me-apt-panel="'+CSS.escape(m.id)+'"] select[data-me-apt-door]'};
 let guideT=0;function guideSoon(){clearTimeout(guideT);guideT=setTimeout(()=>{guideT=0;guideNow();},350);}
 /* The PLAY buttons of the shown tree follow the saved draft at once, on every keystroke (not after Guide me's pause): filled in since the card was drawn, PLAY works now;
    emptied, it is greyed with the reason (the same check as play and publish: mission-content.js treeNeeds). */
 function syncPlay(sc){if(!sc||ui.mode!=='trees')return;const raw=local().trees.find(x=>x.id===ui.tree);if(!raw)return;
  for(const m of raw.missions){const b=MC().treeBlockers(m,givers,items);for(const p of sc.querySelectorAll('[data-me-play^="tree:'+CSS.escape(m.id)+'"]')){const k=p.getAttribute('data-me-play');if(k!=='tree:'+m.id&&!k.startsWith('tree:'+m.id+'#'))continue;
   if(b.length){p.disabled=true;if(k==='tree:'+m.id)p.title='Cannot be played yet: '+b.join('; ');}else if(p.disabled){p.disabled=false;p.removeAttribute('title');}}}
  {const f=startOf(raw),b=f?MC().treeBlockers(f,givers,items):['no mission yet'];for(const p of sc.querySelectorAll('[data-me-play-start="'+CSS.escape(raw.id)+'"]'))p.disabled=b.length>0;}}
 function guideNow(){const Gd=root.VoidEditorGuide;if(!Gd||!host||!built)return null;const sc=host.querySelector('#me-root');if(!sc)return null;
  if(ui.mode!=='trees'){Gd.clear(sc);return null;}
  if(ui.newTree){const nm=sc.querySelector('[data-me-new-name]');return Gd.show(sc,nm&&!nm.value.trim()?[{sel:'[data-me-new-name]',text:'the tree’s name'}]:[],{done:{sel:'[data-me-create-tree]',text:'CREATE TREE'}});}
  const raw=local().trees.find(x=>x.id===ui.tree);if(!raw||!sc.querySelector('[data-me-owner-tree]')){Gd.clear(sc);return null;}
  const needs=[];if(!String(raw.name||'').trim())needs.push({sel:'[data-me-rename="'+CSS.escape(raw.id)+'"]',text:'the tree’s name'});
  if(!raw.missions.length)needs.push({sel:'[data-me-add-mission]',text:'add its first mission (+ NEW MISSION)'});
  syncPlay(sc);let doneM=null;for(const m of raw.missions){const list=MC().treeNeeds(m,givers,items);if(!list.length){if(!doneM||'tree:'+m.id===ui.mission)doneM=m;continue;}
   for(const n of list){const f=NEED_SEL[n.field];if(f)needs.push({sel:'[data-me-tree-mission="'+CSS.escape(m.id)+'"] '+f(m,n.step),text:n.text});}}
  return Gd.show(sc,needs,{done:doneM?{sel:'[data-me-play="tree:'+CSS.escape(doneM.id)+'"]',text:'PLAY THIS DRAFT'}:null,box:sc.querySelector('[data-me-owner-tree]')});}
 // ---------------- RE-VOICE (owner-only server queue; nothing is generated in the browser or on the server)
 async function revoice(lines,m){
  const items=lines.filter(l=>l.who!=='player'&&(l.voice||canVoice(l))).map(l=>{const v=(local().voices||{})[l.who],x={ref:l.ref||l.key,who:l.who,text:shownText(l),from:l.text,mission:m?.key||l.mission||'',source:l.source||''};if(v&&V()&&V().clean(v)){x.voiceId=v.voiceId;x.voiceName=v.name;x.model=V().modelOf(v);}return x;});   // a voice chosen in the editor goes with the line (the server checks it)
  if(!items.length)return;try{server.queue=await call('developer/revoice',{items});status=items.length+' line(s) added to the re-voice queue.';}catch(e){status='Re-voice queue: '+e.message;}draw();}
 async function serverDraft(m){
  const id=('me-'+m.id).slice(0,64);try{const tpl=(await call('developer/drafts/template?kind=mission&source='+encodeURIComponent(m.server))).document,e=editOf(m.key);
   if(e.title)tpl.data.title=e.title;if(e.description!=null)tpl.data.description=e.description;for(const o of tpl.data.objectives)if(e.steps&&e.steps[o.id])o.label=e.steps[o.id];
   const rw=tpl.data.rewards.filter(r=>r.type!=='credits');if(e.credits!=null)rw.unshift({type:'credits',amount:e.credits});else rw.unshift(...tpl.data.rewards.filter(r=>r.type==='credits'));for(const x of e.reputation||[])rw.push({type:'reputation',faction:x.faction,amount:x.amount});tpl.data.rewards=rw;
   let revision=0;try{revision=(await call('developer/drafts/'+id)).revision||0;}catch{}
   const rec=await call('developer/drafts/'+id,{revision,document:tpl});status='Saved as private server draft '+id+' (revision '+rec.revision+'). Lines and unlocks stay in your local draft (the server draft holds the mission text and rewards).';}
  catch(e){status='Server draft not saved: '+e.message;}draw();}
 function downloadQueue(){const a=el('a');a.href=URL.createObjectURL(new Blob([JSON.stringify({format:'mission-editor-revoice-queue',exportedAt:new Date().toISOString(),items:server.queue?.items||[]},null,1)],{type:'application/json'}));a.download='mission-editor-revoice-queue.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
 function exportEdits(){const data={format:'darknet-district-mission-editor-export',version:1,exportedAt:new Date().toISOString(),note:'Owner draft. Lines marked "needs a code change" are for Claude or Codex to apply in the source.',
   content:MC().fromDrafts({studio:studio(),local:local(),shippedBeginner:shipped().beginner,givers,items,clipText:clipTextOf}),notApplied:MC().notApplied({studio:studio(),local:local(),givers,items}),local:local(),studio:studio()};
  const a=el('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,1)],{type:'application/json'}));a.download='mission-editor-draft.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
 // ---------------- PLAY THIS DRAFT
 function playable(m,why){if(['beginner','registry'].includes(m.engine)&&!m.draftOnly||m.engine==='beginner')return why?'':true;
  if(m.engine==='tree'){const b=MC().treeBlockers(m.raw,givers,items);return why?(b.length?'Cannot be played yet: '+b.join('; ')+'.':''):!b.length;}
  return why?(m.engine==='contract'?'Not playable as a draft yet: contracts are flown from the contract board and have no draft adapter.':m.engine==='data'?'Not playable: this mission is inactive data; nothing in the game starts it yet.':'Not playable from here.'):false;}
 const STAGE={'ground-training':['inheritance','vesper'],'flight-training':['inheritance','vesper'],'meet-rook':['arrival','meridian'],'first-station':['legal-offer','meridian'],'combat-qualification':['legal-offer','meridian'],'legal-run':['legal-run','meridian'],'return':['return','kepler'],'illegal-run':['illegal-run','meridian'],'meet-admin':['open','earth']};
 function draftContent(){return MC().fromDrafts({studio:studio(),local:local(),shippedBeginner:shipped().beginner,note:'draft play',givers,items,clipText:clipTextOf});}
 function checkCtx(){return {registry:src.registry,speakers:new Set(Object.values(src.registry?.npcs||{}).map(n=>n.displayName)),registryIds:new Set(Object.keys(shipped().registry).filter(id=>shipped().registry[id]?.beginner!==true)),
  registryObjectives:Object.fromEntries(Object.entries(shipped().registry).map(([id,d])=>[id,new Set((d.objectives||[]).map(o=>o.id))])),lines:new Set(index.keys()),
  givers:new Map(givers.map(g=>[g.id,g])),places:G().placeIds(),subjects:new Set(G().photoSubjects(givers).map(g=>g.id)),items,locations:new Set(Object.keys(refs.locations)),treeIds:new Set(built.trees.map(t=>t.id)),numbers:serverNumbers()};}
 /* A throwaway District campaign for a new tree's mission: the beginner campaign is marked done (so it does not compete for Admin and Iris), the tree's earlier missions are
    done, and, when starting from a step, this mission is taken and its earlier steps done. Where: next to the giver (or the NPC or place of the step). */
 function treeState(mid,stepId){
  const M=root.VoidMissions,C=root.C||root.VoidCampaign,U=root.VoidUniverse,env=root.VoidLiveContent.env,s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;s.story.flags.appearanceOffered=true;s.universe.trackedMission=null;
  const t=(env.trees||[]).find(x=>x.missions.some(y=>y.id===mid));if(!t)throw new Error('This mission is not in the draft that was applied.');
  const i=t.missions.findIndex(y=>y.id===mid),m=t.missions[i];
  // a tree that another tree starts: the links to it have fired
  for(const x of env.trees)for(const p of x.missions)for(const u of p.unlocks||[])if(u.kind==='tree'&&u.id===t.id)s.story.flags[MC().linkFlag(t.id)]=true;
  const done=(p,ids)=>{for(const u of p.unlocks||[])if(ids.includes(u.when||'complete'))MC().unlockNow(s,u,env,C);};
  for(const p of t.missions.slice(0,i)){M.acquire(s,p.id);for(const o of M.definitions[p.id].objectives)M.complete(s,p.id,o.id,C);s.story.flags[MC().treeFlag(p.id)]=true;done(p,[...M.definitions[p.id].objectives.map(o=>o.id),'complete']);}
  let where=(giver(m.giver)||{}).enter;const notes=[];
  // A mission that starts when the player leaves the Sleeping Pod: draft play starts in the pod (EXIT POD starts it).
  const w=m.start&&m.start.how==='notification'&&!stepId?m.start.when||{}:null;
  if(w&&w.kind==='pod-exit'){s.story.flags.podWakePending=true;where={walk:'darknet-district'};}
  else if(w&&(w.kind==='place'||w.kind==='leave')&&w.place)where=PLACE_ENTER(w.place)||where;
  else if(w&&w.kind==='near'&&(w.npc||m.giver)){where=(giver(w.npc||m.giver)||{}).enter||where;notes.push('Walk up to '+((giver(w.npc||m.giver)||{}).name||'them')+' (within '+G().nearMetres(w.distance)+' m) to start it.');}
  else if(w&&w.kind==='flag'&&w.flag){s.story.flags[w.flag]=w.value===undefined?true:w.value;notes.push('Draft play sets the story flag '+w.flag+' so it starts.');}
  else if(w&&w.kind==='after-mission'&&w.mission){M.acquire(s,w.mission);for(const o of ((M.definitions[w.mission]||{}).objectives||[]))M.complete(s,w.mission,o.id,C);if(s.universe.missions[w.mission])s.universe.missions[w.mission].completed=true;notes.push('Draft play marks the mission it follows as done.');}
  if(stepId){M.acquire(s,m.id);M.track(s,m.id,C);const k=Math.max(0,m.objectives.findIndex(o=>o.id===stepId));for(const o of m.objectives.slice(0,k))M.complete(s,m.id,o.id,C);done(m,m.objectives.slice(0,k).map(o=>o.id));const o=m.objectives[k];
   where=o.kind==='arrive'?{walk:'sacramento',quarter:'port'}:o.kind==='photo'?PLACE_ENTER((giver(o.npc)||{}).place)||where:o.kind==='send-photo'?where:o.npc?(giver(o.npc)||{}).enter:o.place?PLACE_ENTER(o.place):where;
   if(o.kind==='send-photo')notes.push('Sending needs a photo taken during this mission: play from the photo step to take one.');}
  // Reverie, Lace and the cat may be placed in any area (npc-areas.js): draft play of a mission she gives starts where she waits for it, else where her placement puts her
  {const AR=root.VoidNPCAreas,X=root.VoidNPCPaths,id=m.giver;if(AR&&X&&X.MOVABLE[id]&&where&&where.walk==='sacramento'&&where.quarter==='avenue'){const np=(draftContent().npcs||{})[id],t=m.waitAt||(np&&np.mode==='stay'?np:np&&np.mode==='path'?np.points[0]:null),a=t&&AR.areaOf(t);
   if(a&&a!=='avenue'){where=AR.enter(a);notes.push('Draft play starts in '+AR.get(a).name+', where '+((giver(id)||{}).name||id)+' is placed.');}}}
  // Reverie and Lace take turns on one UTC street clock: the test runs at a time the first one it uses is really out (a simulated street clock; throwaway session only)
  {const nw=(m.start&&m.start.when)||{};notes.push(...streetClock([m.giver,nw.kind==='near'?nw.npc:null,...m.objectives.flatMap(o=>[o.npc,...(o.subjects||[])]),m.ending&&m.ending.npc]));}
  if(where&&where.location){C.awardStarterShip(s);U.discover(s,where.location);s.location=where.location;notes.push('Draft play starts at '+((G().PLACE.get(where.location)||{}).name||where.location)+' with a test ship.');}
  M.sync(s,C);return {state:s,where:where||{walk:'darknet-district'},notes};}
 /* The street clock of a test (the owner, 19 Nov 2026: "If I test with REVERIE or LACE make it the time they are actually there"): a test that involves Reverie or Lace
    runs on a simulated street clock inside her shift (ncz-street-pair.js testClock: the first one used; never in the 90 s handover), so the pair, the cat, Milked's
    Studio 1 and her missions agree. Set in the session's build (dev-test.js clears it at the start of every session; leaving reloads the page). Returns the notice. */
 function streetClock(ids){const S=root.VoidStreetPair;if(!S||!S.testClock)return [];const tc=S.testClock(ids);S.simulate(tc?tc.ms:null);return tc?[tc.note]:[];}
 // The draft banner shows both clocks: the street (UTC, the pair's shift) and the in-game day (game-clock.js: schedules).
 function clockText(){const S=root.VoidStreetPair,GC=root.VoidClock;let t='';if(S&&S.streetTime)t='Street '+S.utcLabel(S.streetTime())+' UTC'+(S.simulated()?' (test)':'');
  try{if(GC&&state)t+=(t?' · ':'')+'In-game '+GC.now(state).label;}catch{}return t;}
 async function enterTree(w){
  if(w.walk==='darknet-district'){state.location='earth';await enterWalking(VoidDistrictArea.KEY.interior,{silent:true,...VoidDistrictArea.resume(state,VoidNeoChinatown)});}
  else if(w.walk==='sacramento'){state.location='earth';delete state.story.flags.area;await enterWalking(VoidDistrictArea.KEY.street,{silent:true,quarter:w.quarter});}
  else if(w.location==='vesper')await worldEnterWalking('vesper');else{state.location=w.location;await dock();}}
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
 /* PLAY FROM THE START OF THIS TREE (the owner, 19 Nov 2026: "play draft from the beginning of the tree"): the tree's first mission played with nothing of the tree done.
    treeState() builds a brand-new campaign (C.fresh()), so no mission of the tree is started and none of its story flags, follow / lead / cab flags, step timers or
    apartment hacks exist; play() also clears what the running game keeps in memory (live-content.js / apartment-integration.js resetRun). The first mission then starts
    the way a player meets it (its giver, its message / banner / walked-near / pod-exit trigger) and the tree engine offers the next missions as each is finished. */
 const startOf=raw=>raw&&raw.missions&&raw.missions[0]||null;
 function startBtn(raw){const f=startOf(raw),b=f?MC().treeBlockers(f,givers,items):['the tree has no mission yet'];
  return btn('PLAY FROM THE START OF THIS TREE',()=>playStart(raw.id),'me-play',{'data-me-play-start':raw.id,...(b.length?{disabled:'',title:'Cannot be played yet: '+(f?'its first mission, '+(f.title||f.id)+', ':'')+b.join('; ')}:{title:'Starts a practice game with the whole tree reset, at the first mission ('+(f.title||f.id)+').'})});}
 function playStart(treeId){fresh();const raw=(local().trees||[]).find(x=>x.id===treeId),f=startOf(raw);if(!f){status='This tree has no mission yet: press + NEW MISSION first.';draw();return null;}
  return play('tree:'+f.id,null,{tree:raw});}
 async function play(key,stepId,opt={}){
  fresh();const f=findMission(key);if(!f)return;const m=f.mission;if(!playable(m)){status=playable(m,true);draw();return;}const whole=opt.tree||null,tname=whole?(whole.name||whole.id):'';
  const content=draftContent(),c=MC().check(content,checkCtx());if(!c.ok){status='Fix these first (Guide me highlights each box), then press PLAY again: '+c.errors.slice(0,4).join(' · ');draw();return;}
  const not=MC().notApplied({studio:studio(),local:local(),givers,items});
  const d=local();d.played[m.key]=new Date().toISOString();saveLocal(d);if(wsOn())await saveServer();   // the server copy is up to date before the page reloads
  write(RETURN,{tree:f.tree.id,mission:m.key,step:stepId||null,at:Date.now()},root.sessionStorage);
  const env=root.VoidLiveContent?.env;
  const r=await root.VoidDevTest.session({banner:(whole?'PLAYING DRAFT TREE FROM THE START: '+tname:'PLAYING DRAFT: '+m.title)+' — not your real save',leave:'LEAVE DRAFT',kind:'draft',
   apply:()=>{root.VoidLiveContent?.useDraft(content);try{root.VoidLiveContent?.resetRun?.();root.VoidApartments?.resetRun?.();root.VoidModules?.resetRun?.();}catch{}},clock:clockText,
   build:()=>{const x=m.engine==='tree'?treeState(m.id,stepId):m.engine==='beginner'?beginnerState(m.id,stepId):registryState(m.id,stepId);play.notes=x.notes||[];play.where=x.where;return x.state;},
   enter:async()=>{const w=play.where;if(m.engine==='tree')return enterTree(w);if(w==='interior'||w==='earth'){state.location='earth';await enterWalking(VoidDistrictArea.KEY.interior,{silent:true,...VoidDistrictArea.resume(state,VoidNeoChinatown)});}
    else if(w==='street'){state.location='earth';delete state.story.flags.area;await enterWalking(VoidDistrictArea.KEY.street,{silent:true,quarter:'port'});}
    else if(w==='vesper')await worldEnterWalking('vesper');else{state.location=w;await dock();}},
   message:()=>'DRAFT · '+(whole?'tree '+tname+' from the start (every mission of it reset) · first: '+m.title:m.title)+(stepId?' · from step '+stepId:'')+(m.engine==='tree'&&!stepId?(m.raw&&m.raw.start&&m.raw.start.how==='notification'?' · it starts by notification: '+((G().START_WHEN.find(x=>x.id===(m.raw.start.when||{}).kind)||{}).name||'its trigger').toLowerCase():' · talk to '+(giver(m.giver)||{}).name+' to get it'):'')+' · nothing is saved'+(not.length?' · '+not.length+' edit(s) cannot show (listed in the Mission Editor)':'')+((play.notes||[]).length?' · '+play.notes.join(' '):'')});
  if(r&&r.error){status=r.error;try{root.sessionStorage.removeItem(RETURN);}catch{}draw();}
 }
 // ---------------- PUBLISH TO ALL PLAYERS (server-verified owner only; the server keeps every version)
 function publishView(root_){
  const live=server.live,content=draftContent(),ctx=checkCtx(),c=MC().check(content,ctx),not=MC().notApplied({studio:studio(),local:local(),givers,items});
  root_.append(el('h3','Publish & versions'));
  if(!live){root_.append(el('p',server.note.live==='not-authorized'?'Publishing is only for the configured content editor account. The server did not confirm this account.':'Publishing is switched OFF on the server (or the server could not be reached). Nothing can reach players from here until you switch it on. Your draft is safe.','me-warn',{'data-me-publish-off':'1'}));}
  else root_.append(el('p','Live now: '+(live.version?'version '+live.version+' (published '+new Date(live.publishedAt*1000).toLocaleString()+')':'the shipped missions (nothing published yet)')+'.','dev-note'));
  // the check screen
  const chk=el('section','','me-check',{'aria-label':'Check before publishing','id':'me-check'});chk.append(el('h4','Check before publishing'));
  const shippedB=shipped().beginner.map(MC().strip),nextB=content.beginner||shippedB;
  chk.append(el('h5','Problems that block publishing ('+(c.errors.length+(ui.check?.errors||[]).length)+')'));for(const t of [...c.errors,...(ui.check?.errors||[])])chk.append(el('p',t,'me-bad'));if(!c.errors.length&&!(ui.check?.errors||[]).length)chk.append(el('p','None.','me-ok'));
  const ch=MC().changes(shippedB,nextB),regN=Object.keys(content.registry||{}).length,linesN=(content.lines||[]).length;
  chk.append(el('h5','What changes for players'));if(!ch.length&&!regN&&!linesN&&!(content.trees||[]).length&&!Object.keys(content.names||{}).length)chk.append(el('p','Nothing: your draft matches the shipped missions.','me-small'));
  for(const x of ch)chk.append(el('p','• '+x.text));if(regN)chk.append(el('p','• Mission Log text of '+regN+' older mission(s): '+Object.keys(content.registry).join(', ')+'.'));if(linesN)chk.append(el('p','• '+linesN+' changed NPC line(s), shown as text until re-voiced.'));{const tn=(content.trees||[]).reduce((n,t)=>n+t.missions.length,0),nn=Object.keys(content.names||{}).length;if(tn)chk.append(el('p','• '+tn+' mission(s) in '+(content.trees||[]).length+' tree(s) (the Main storyline is always sent), listed below.'));if(nn)chk.append(el('p','• '+nn+' tree name(s).'));}
  const w=MC().warnings(shippedB,nextB);chk.append(el('h5','Players part-way through ('+w.length+')'));if(!w.length)chk.append(el('p','No saved progress is affected.','me-small'));for(const t of w)chk.append(el('p','⚠ '+t,'me-warn'));
  const outOfDate=(content.lines||[]).filter(l=>index.get(l.who+'|'+l.from)?.recorded);if(outOfDate.length)chk.append(el('p','⚠ '+outOfDate.length+' line(s) have a recorded voice clip that no longer matches: voice clip out of date, text only until re-voiced.','me-warn'));
  {const cl=content.clips||[],stale=Object.keys(local().clips||{}).length-cl.length;if(cl.length)chk.append(el('p','• '+cl.length+' imported voice file(s): players hear your file for those lines (uploaded when you publish; '+Math.round(cl.reduce((n,c)=>n+c.bytes,0)/1024)+' KB in all).','',{'data-me-publish-clips':String(cl.length)}));if(stale>0)chk.append(el('p','⚠ '+stale+' imported voice file(s) are not sent: their line’s words changed since the import (REPLACE the file, or put the words back).','me-warn',{'data-me-publish-clips-stale':String(stale)}));}
  const nt=content.trees||[],nn=nt.flatMap(t=>t.missions.map(m=>({t,m})));
  {const nums=nn.filter(({m})=>Number.isInteger(m.number)).sort((a,b)=>a.m.number-b.m.number),probs=MS().numberProblems(nt,ledger()),box=el('div','',null,{'data-me-numbers':String(nums.length)});box.append(el('h5','Mission numbers ('+nums.length+')'));
   for(const {t,m} of nums)box.append(el('p','• '+numLabel(m.number,m.title)+' · '+t.name+' · id '+m.id+(ledger()[m.number]===m.id?'':' · new number'),'',{'data-me-number-row':m.id}));for(const p of probs)box.append(el('p','⚠ '+p,'me-bad'));
   box.append(el('p','Numbers are unique and never reused: every number the game has shipped or published stays taken, even after its mission is removed. The next free number is '+MS().pad(nextFree())+'.','me-small'));chk.append(box);}
  chk.append(el('h5','Missions in trees ('+nn.length+')',null,{'data-me-new-missions':String(nn.length)}));if(!nn.length)chk.append(el('p','None.','me-small'));
  for(const {t,m} of nn)chk.append(el('p','• '+t.name+' › '+numLabel(m.number,m.title)+' ('+m.id+') · given by '+((giver(m.giver)||{}).name||m.giver)+' · '+m.objectives.length+' step(s)'+(m.rewards?' · '+m.rewards+' credits':''),'',{'data-me-new-mission':m.id}));
  const far=[...new Set(nn.flatMap(({m})=>MC().treeTouches(m).npcs))].map(giver).filter(g=>g&&!g.players);chk.append(el('h5','New givers players cannot reach in the current game ('+far.length+')'));if(!far.length)chk.append(el('p','None: every NPC in your new missions can be reached by a District player today.','me-small'));
  for(const g of far)chk.append(el('p','⚠ '+g.name+': '+G().status(g),'me-warn',{'data-me-far':g.id}));
  const names=Object.entries(content.names||{});if(names.length){chk.append(el('h5','Tree names ('+names.length+')'));for(const [id,n] of names)chk.append(el('p','• '+id+' is shown as “'+n+'” (its id never changes).','me-small'));}
  if(nn.length)chk.append(el('p','New missions are ordinary mission records in each player’s save (and a story flag mt_<id> when paid); the cloud save already accepts them. Players who are part-way through a new mission when it is changed or removed keep their record; a removed one is untracked.','me-small'));
  if(not.length){chk.append(el('h5','Edits that will NOT reach players (kept in your draft)'));for(const t of not)chk.append(el('p','• '+t,'me-small'));}
  const note=el('input','','',{'aria-label':'Change note',placeholder:'What changed (shown in the version list)',maxlength:'200'});note.value=ui.note||'';note.oninput=()=>{ui.note=note.value;};chk.append(note);
  // the draft changed since this check screen was drawn (another tab, UNDO, a field still being typed in): show the new check instead of sending what is not on screen
  const changedSince=()=>{fresh();if(JSON.stringify(draftContent())===JSON.stringify(content))return false;status='Your draft changed since this check screen was drawn. It has been checked again: look it over, then press the button again.';ui.check=null;draw();return true;};
  const blocked=!live||!live.enabled||c.errors.length||(ui.check?.errors||[]).length||MC().empty(content);
  const row=el('div','','me-row');row.append(btn('ASK THE SERVER TO CHECK',async()=>{if(changedSince())return;try{ui.check=await call('developer/live-content/check',{content});status=ui.check.ok?'The server checked the draft: no problems.':'The server found problems.';}catch(e){status='Server check: '+e.message;}draw();},'',live?{}:{disabled:''}));
  row.append(btn('PUBLISH TO ALL PLAYERS',async()=>{if(changedSince())return;if(!confirm('Publish your draft to every player now? You can undo it afterwards.'))return;try{if((content.clips||[]).length){const u=await VI().upload(call,content.clips,t=>{status=t;const n=host&&host.querySelector('#me-status');if(n)n.textContent=t;});if(u.uploaded)status=u.uploaded+' voice file(s) uploaded.';}const rec=await call('developer/live-content/publish',{expected:live.version||0,content:{...content,note:(ui.note||'').slice(0,200)||undefined}});status='Published version '+rec.version+'. Players get it the next time the game loads.';await refreshServer();}catch(e){status='Not published: '+e.message;}draw();},'me-publish',{'data-me-publish':'1',...(blocked?{disabled:''}:{})}));
  chk.append(row);root_.append(chk);
  // versions
  const vs=el('section','','me-versions');vs.append(el('h4','Published versions'));const hist=(live&&live.history)||[];if(!hist.length)vs.append(el('p','None yet.','me-small'));
  const tb=el('table','','me-table');if(hist.length){tb.innerHTML='<tr><th>Version</th><th>When</th><th>What</th><th>Note</th></tr>';for(const h of hist.slice().reverse()){const tr=el('tr');tr.append(el('td',String(h.version)+(h.version===live.version?' (live)':'')),el('td',new Date(h.at*1000).toLocaleString()),el('td',h.action==='rollback'?'Undo: back to version '+h.from:h.action==='publish'?'Published':h.action),el('td',h.note||''));tb.append(tr);}vs.append(tb);}
  if(live&&live.enabled&&live.version)vs.append(btn('UNDO: PUT THE PREVIOUS VERSION BACK',async()=>{if(!confirm('Put the previous published version back for every player?'))return;try{const rec=await call('developer/live-content/rollback',{expected:live.version});status='Version '+rec.version+' is live: '+(rec.content?'the content of version '+rec.from:'the shipped missions')+'.';await refreshServer();}catch(e){status='Undo failed: '+e.message;}draw();},'',{'data-me-undo':'1'}));
  root_.append(vs);
 }
 /* What the Blocks view (mission-blocks-view.js) uses from here: the Form view's own pickers and boxes, so both views edit the same data in the same way. */
 const blocksKit={el,btn,hint,optHelp,HELP,HELP_STEP,npcSelect,placeSelect,regionSelect,itemSelect,subjectsPicker,animPick,numBox,escortWho,escortPanel,hackRow,aptSelect,placeRow,autoWordsBtn,doorSelect,importBox,aptReady,aptEnsure,giver,voiceNow,local,editTree,guideSoon,play,jumpApt,numLabel,secWords,lineTimeWords,waitWords,
  get givers(){return givers;},get items(){return items;},get refs(){return refs;},status:t=>setStatus(t),draw:()=>draw(),G,MC,EX:()=>EX(),NGS,fresh,blockers:m=>MC().treeBlockers(m,givers,items),needs:m=>MC().treeNeeds(m,givers,items)};
 /* What Developer Tools > NPCs uses from here: the same draft, the same lines and voice view, the same play and check, the same help style. */
 const shared={el,btn,hint,optHelp,HELP,local,saveLocal,restoreRaw,KEY,STUDIO,
  // the beginner layer (editor-home.js): jump to a view, add the wizard's mission, play a tree mission, what blocks one
  goto(o){Object.assign(ui,{check:null,newTree:false,...o});},
  addWizardMission(make){const d=local();const r=make(d,{T:T(),number:nextFree(d),givers});saveLocal(d);stale=true;Object.assign(ui,{mode:'trees',tree:r.tree.id,mission:'tree:'+r.mission.id,step:null,scrollTo:true,newTree:false});return {tree:r.tree.id,mission:r.mission.id};},
  playTree(id,step){return play('tree:'+id,step||null);},playStart,fresh,blocksKit,
  blockers:m=>MC().treeBlockers(m,givers,items),get items(){return items;},giver,get givers(){return givers;},get built(){return built;},get src(){return src;},get server(){return server;},linesFor,linesView,lineRow,revoice,downloadQueue,voicePanel,setVoice,downloadVoices,voiceNow,voiceSummary,
  ensure:()=>built?Promise.resolve():(loading=loading||load()),draftContent,checkCtx,jumpTo,openNpcTab,compass,exportEdits,saveServer,wsOn:()=>wsOn(),T,MC,G,nextFree,
  addGiverMission(npc,treeId){const d=local();let t=d.trees.find(x=>x.id===treeId);if(!t){t=T().newTree(d.trees,{name:'Missions from '+((giver(npc)||{}).name||npc),note:''});d.trees.push(t);}const m=T().addMission(t,{giver:npc});m.number=nextFree(d);saveLocal(d);stale=true;
   Object.assign(ui,{mode:'trees',tree:t.id,mission:'tree:'+m.id,step:null,scrollTo:true,newTree:false});root.VoidEditorGuide?.focusNext();return {tree:t.id,mission:m.id};}};
 root.VoidMissionEditor={shared,guideNow,fresh,get serverCopy(){return {...ws,timer:undefined};},saveServer,loadServer,render,get built(){return built;},reload:async()=>{built=null;loading=null;},draftContent,local,studio,play,playStart,refreshServer,get status(){return status;},get server(){return server;}};
})(globalThis);
