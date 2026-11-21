/* The personal holographic device: V1. PURE RULES (no engine, no network, no clock): the device and app registries, what is saved, map exploration, the shared
   NPC/player profile view-model and the portrait cache key. Runs in the browser and in Node tests. The screen is void-runner/personal-device.js.
   Design notes (docs/development/V1_DEVICE.md):
   - V1 is the only device. DEVICES is the extension point: a later model is another entry with its own apps, look and limits. Nothing about progression,
     prices or unlocks for later models is decided here.
   - Everything the device remembers lives in story.flags (booleans, short strings and safe integers are what the cloud save validator accepts), so
     existing saves load unchanged and nothing needs a new database. A new device keeps identity, contacts, messages, missions and installed apps because
     none of them are stored per device. */
(function(root){
 'use strict';
 const ASSET_VERSION=5;   // bump when portrait framing or lighting changes, or when an NPC model or outfit is updated: every cached portrait is then redrawn
 const DEVICES={
  v1:{id:'v1',generation:1,name:'V1',tagline:'PERSONAL DEVICE · MODEL V1',
   apps:['missions','messages','comms','social','news','map','camera','gallery','store','device','settings'],
   // The camera (device-camera.js): a live viewfinder. `zooms` is the zoom array every model shares; `maxZoom` is how far THIS model reaches (a V2 can raise it).
   camera:{enabled:true,id:'CAM 01',zooms:[1,1.5,2,3,4],maxZoom:2,iso:320},
   // Interface timing, in milliseconds (a later model changes these numbers and nothing else). The starter V1 is deliberately a little slow: a short loading card is shown
   // before a screen appears. It is cosmetic and asynchronous: it never blocks the game loop, networking or message delivery. appOpenMs: opening an app from home;
   // homeMs: going back to home; tabMs: switching inside an app; startupMs: the first opening after the page loads. 0 turns a delay off (reduced motion does this too).
   ui:{halfWidth:.5,expandedWidth:.96,appOpenMs:320,homeMs:180,tabMs:160,startupMs:600,maxMs:600},
   // Storage is a defined baseline of the stock model, NOT a measurement of this computer or browser. The nine system apps are part of it. A future optional app costs
   // its own `storagePct` (in STORE_EXTRA) on top, and the total is capped at 100.
   storage:{baseUsedPct:75}
  },
  /* V3 // SHADOW (the owner, 15 Nov 2026): the device Dax carries, bought from Admin. Faster than the V1; the same interface drawn like an old monochrome green monitor
     (device-v1.css, [data-device=v3]); its camera is in the wearer's eye and zooms to 4. No player can get one yet: nothing sells or grants it. */
  v3:{id:'v3',generation:3,name:'V3 // SHADOW',tagline:'PERSONAL DEVICE · MODEL V3 // SHADOW',theme:'mono-green',
   apps:['missions','messages','comms','social','news','map','camera','gallery','store','device','settings'],
   camera:{enabled:true,id:'EYE 01',zooms:[1,1.5,2,3,4],maxZoom:4,iso:800,eye:true},
   ui:{halfWidth:.5,expandedWidth:.96,appOpenMs:90,homeMs:60,tabMs:50,startupMs:220,maxMs:600},
   storage:{baseUsedPct:75}
  }
 };
 // state: 'ready' (works), 'placeholder' (shows what is coming, does nothing yet), kind of limits are written in `note`
 const APPS={
  missions:{id:'missions',title:'MISSION LOG',glyph:'M',state:'ready',note:'Your missions and tracking.'},
  messages:{id:'messages',title:'MESSAGES',glyph:'@',state:'ready',note:'District chat and conversations. Private messages to other players are not available yet.'},
  comms:{id:'comms',title:'COMMS',glyph:'C',state:'ready',note:'Voice: talk to the people near you. Off until you switch it on.'},
  social:{id:'social',title:'SOCIAL',glyph:'S',state:'ready',note:'People you know and other players.'},
  news:{id:'news',title:'NEWS',glyph:'N',state:'ready',note:'Reports you have received.'},
  map:{id:'map',title:'MAP',glyph:'+',state:'ready',note:'Places you have explored.'},
  camera:{id:'camera',title:'CAMERA',glyph:'O',state:'ready',note:'A live viewfinder with name tags and zoom. Nothing is captured or stored yet.'},
  gallery:{id:'gallery',title:'GALLERY',glyph:'G',state:'ready',note:'Photos you have taken with the camera.'},
  store:{id:'store',title:'APP STORE',glyph:'A',state:'ready',note:'Apps for this device.'},
  device:{id:'device',title:'MY DEVICE',glyph:'D',state:'ready',note:'This device: its model, storage and built-in apps.'},   // shown as MY V1, MY V2... (appTitle)
  settings:{id:'settings',title:'SETTINGS',glyph:'*',state:'ready',note:'Device preferences.'},
  // optional apps (installed from the App Store; listed in STORE_EXTRA)
  warflying:{id:'warflying',title:'WARFLYING',glyph:'W',state:'ready',note:'Listens for nearby frequencies and logs them for the WarFlying leaderboard.'},
  // granted, not bought: the Ship Loadout app arrives with a ship (ordnance.js grant sets story.flags.loadoutApp; ship-loadout.js draws it). Takes no storage.
  loadout:{id:'loadout',title:'SHIP LOADOUT',glyph:'L',state:'ready',note:'Your ship: its slots, lasers, missiles and upgrades.'}
 };
 // Apps a player could install later. Intentionally empty: no purchases, prices or unlocks exist yet.
 // Apps a player can install: {id,title,generation,note,storagePct}. An app runs on every model of its generation or later (V1, V2, V3 // Shadow...).
 // WarFlying (the owner, 15 Nov 2026): the scanner is an app on the personal device now, no longer a module fitted to a ship. Free; takes 15% of storage.
 const STORE_EXTRA=[{id:'warflying',title:'WARFLYING',generation:1,storagePct:15,note:'Scans for nearby frequencies and logs them. Press SUBMIT SCANS to send what you log to the WarFlying leaderboard. Does not work inside The Darknet District, which is shielded.'}];
 // Which in-game model draws each named NPC's portrait: {npcId: 'crowd-look-id'}. EMPTY on purpose: the game does not yet say which crowd model is which named
 // character, and a guessed face would be wrong. An entry here makes that NPC's portrait appear (and regenerate whenever ASSET_VERSION or the model changes).
 const NPC_MODELS={};
 const DEFAULT_SETTINGS={motion:'auto',scan:'1',size:'half'};   // motion: auto (follow the system), full, reduced
 const SETTING_VALUES={motion:['auto','full','reduced'],scan:['0','1'],size:['half','expanded']};
 const KEY={serial:'deviceSerial',model:'deviceModel',version:'deviceVersion',apps:'deviceApps',settings:'deviceSettings',map:'deviceMap'};

 // ---- What is saved (in story.flags) ----
 function parseSettings(text){
  const out={...DEFAULT_SETTINGS};
  if(typeof text!=='string')return out;
  for(const part of text.slice(0,200).split(';')){const [k,v]=part.split('=');if(Object.prototype.hasOwnProperty.call(SETTING_VALUES,k)&&SETTING_VALUES[k].includes(v))out[k]=v;}
  return out;
 }
 const settingsText=s=>Object.keys(SETTING_VALUES).map(k=>k+'='+(SETTING_VALUES[k].includes(s[k])?s[k]:DEFAULT_SETTINGS[k])).join(';');
 // Apps a game event puts on the device (never from the App Store, never from the saved app list): the Ship Loadout app with a ship.
 const GRANTED={loadout:f=>f.loadoutApp===true};
 function restore(flags){
  flags=flags&&typeof flags==='object'?flags:{};
  const model=DEVICES[flags[KEY.model]]?flags[KEY.model]:'v1',def=DEVICES[model];
  const optional=a=>STORE_EXTRA.some(x=>x.id===a&&x.generation<=def.generation);   // an optional app that really exists is kept; anything else is dropped
  const asked=typeof flags[KEY.apps]==='string'?flags[KEY.apps].split(',').filter(a=>(def.apps.includes(a)||optional(a))&&APPS[a]):[];
  const apps=[...new Set([...def.apps,...asked.filter(a=>!GRANTED[a]),...Object.keys(GRANTED).filter(a=>GRANTED[a](flags))])];   // the built-in apps are always installed; an unknown name is ignored, never trusted
  return {model,version:1,apps,settings:parseSettings(flags[KEY.settings]),map:{interior:String(flags[KEY.map+'Interior']||'').replace(/[^0-9a-f]/g,'').slice(0,60),street:String(flags[KEY.map+'Street']||'').replace(/[^0-9a-f]/g,'').slice(0,60)}};
 }
 function write(flags,device){
  flags[KEY.model]=device.model;flags[KEY.version]=1;flags[KEY.apps]=device.apps.join(',').slice(0,200);flags[KEY.settings]=settingsText(device.settings);
  flags[KEY.map+'Interior']=device.map.interior;flags[KEY.map+'Street']=device.map.street;return flags;
 }

 // ---- Storage, App Store view and timing ----
 const clampPct=n=>Math.max(0,Math.min(100,Math.round(n)));
 /* Stock V1: 11 system apps, 0 optional apps, 75% used / 25% available. Only optional apps that are actually installed add to the baseline. */
 function storage(device){
  const def=DEVICES[device.model]||DEVICES.v1,optional=device.apps.filter(a=>!def.apps.includes(a)),
   extra=optional.reduce((t,a)=>t+(Number((STORE_EXTRA.find(x=>x.id===a)||{}).storagePct)||0),0),
   photos=Math.max(0,Number(arguments[1]??(typeof globalThis!=='undefined'&&globalThis.VoidGallery?(globalThis.VoidGallery.units??globalThis.VoidGallery.count):0))||0),   // each photo in the Gallery takes 1% (device-gallery.js)
   used=clampPct(def.storage.baseUsedPct+extra+photos);
  return {model:def.name,systemApps:def.apps.length,optionalApps:optional.length,usedPct:used,availablePct:100-used,baselinePct:def.storage.baseUsedPct};
 }
 /* What an app is called on THIS device: the device app carries the model's name (MY V1 on a V1, MY V2 on a V2). */
 function appTitle(id,device){const def=DEVICES[device&&device.model]||DEVICES.v1;return id==='device'?'MY '+def.name:(APPS[id]||{}).title||'';}
 /* Install or remove an optional app. Returns the new app list, or null when it cannot be done (unknown app, wrong generation, no room, a built-in app). */
 function install(device,id){const def=DEVICES[device.model]||DEVICES.v1,x=STORE_EXTRA.find(e=>e.id===id);if(!x||!APPS[id]||x.generation>def.generation||device.apps.includes(id))return null;if(storage(device).usedPct+(Number(x.storagePct)||0)>100)return null;return [...device.apps,id];}
 function uninstall(device,id){const def=DEVICES[device.model]||DEVICES.v1;if(def.apps.includes(id)||!device.apps.includes(id))return null;return device.apps.filter(a=>a!==id);}
 function storeListing(device){
  const def=DEVICES[device.model]||DEVICES.v1,rows=def.apps.map(id=>({id,title:appTitle(id,device),status:device.apps.includes(id)?'installed':'available',compatible:true,note:APPS[id].note,placeholder:APPS[id].state==='placeholder',system:true}));
  const extra=STORE_EXTRA.map(x=>({id:x.id,title:x.title,storagePct:Number(x.storagePct)||0,status:device.apps.includes(x.id)?'installed':x.generation>def.generation?'locked':'available',compatible:x.generation<=def.generation,note:x.note||'',placeholder:false,system:false}));
  for(const x of extra)rows.push(x);
  return {rows,system:rows.filter(r=>r.system),installed:extra.filter(r=>r.status==='installed'),available:extra.filter(r=>r.status!=='installed'),more:STORE_EXTRA.length>0,storage:storage(device)};
 }
 /* How long a transition shows its loading card. kind: 'open' (home -> app), 'home', 'tab', 'startup'. Configurable per model; 0 when `still` (reduced motion). */
 function delayMs(device,kind,still){
  const u=(DEVICES[device.model]||DEVICES.v1).ui,ms=({open:u.appOpenMs,home:u.homeMs,tab:u.tabMs,startup:u.startupMs})[kind];
  return still||!Number.isFinite(ms)?0:Math.max(0,Math.min(u.maxMs||600,Math.round(ms)));
 }

 // ---- Map exploration: a grid over the area's real geometry; a cell is "explored" once the player has been near it ----
 const CELL=6,RADIUS=7,MAX_CELLS=240;   // the save keeps at most 60 hex characters (240 cells) per area; a large area gets larger cells
 function extent(layout){
  let x0=Infinity,x1=-Infinity,z0=Infinity,z1=-Infinity;
  const add=(x,z)=>{x0=Math.min(x0,x);x1=Math.max(x1,x);z0=Math.min(z0,z);z1=Math.max(z1,z);};
  for(const s of layout.solids||[]){add(s.position[0]-s.size[0]/2,s.position[2]-s.size[2]/2);add(s.position[0]+s.size[0]/2,s.position[2]+s.size[2]/2);}
  for(const i of layout.interactions||[])add(i.position[0],i.position[2]);
  if(layout.spawn)add(layout.spawn[0],layout.spawn[2]);
  if(!isFinite(x0))return null;
  x0-=CELL;z0-=CELL;x1+=CELL;z1+=CELL;
  const cell=Math.max(CELL,Math.ceil(Math.sqrt((x1-x0)*(z1-z0)/MAX_CELLS*1.1)));
  return {x0,z0,x1,z1,cell};
 }
 const dims=e=>({cols:Math.max(1,Math.ceil((e.x1-e.x0)/e.cell)),rows:Math.max(1,Math.ceil((e.z1-e.z0)/e.cell))});
 const cellOf=(e,x,z)=>{const d=dims(e),c=Math.floor((x-e.x0)/e.cell),r=Math.floor((z-e.z0)/e.cell);return c<0||r<0||c>=d.cols||r>=d.rows?-1:r*d.cols+c;};
 function decode(hex,count){const bits=new Uint8Array(count);for(let i=0;i<count;i++){const n=parseInt(hex[i>>2]||'0',16);bits[i]=(n>>(3-(i&3)))&1;}return bits;}
 function encode(bits){let s='';for(let i=0;i<bits.length;i+=4){let n=0;for(let k=0;k<4;k++)n=(n<<1)|(bits[i+k]||0);s+=n.toString(16);}return s.replace(/0+$/,'');}
 /* Marks cells near (x,z). Returns the new hex string (or the same one when nothing changed). */
 function explore(hex,e,x,z){
  const d=dims(e),count=d.cols*d.rows;if(count>MAX_CELLS)return hex;
  const bits=decode(hex,count),reach=Math.max(RADIUS,e.cell*.8);let changed=false;
  for(let r=0;r<d.rows;r++)for(let c=0;c<d.cols;c++){if(bits[r*d.cols+c])continue;const cx=e.x0+(c+.5)*e.cell,cz=e.z0+(r+.5)*e.cell;if(Math.hypot(cx-x,cz-z)<=reach){bits[r*d.cols+c]=1;changed=true;}}
  return changed?encode(bits):hex;
 }
 const explored=(hex,e,x,z)=>{const d=dims(e),i=cellOf(e,x,z);return i>=0&&decode(hex,d.cols*d.rows)[i]===1;};
 /* What the map may show: walls that touch an explored cell, and places (interactions) standing in an explored cell. Nothing else. */
 function visible(hex,layout){
  const e=extent(layout);if(!e)return {extent:null,solids:[],places:[]};const d=dims(e),bits=decode(hex,d.cols*d.rows);
  const seen=(x,z)=>{const i=cellOf(e,x,z);return i>=0&&bits[i]===1;};
  const solids=(layout.solids||[]).filter(s=>seen(s.position[0],s.position[2])).map(s=>({id:s.id,x:s.position[0],z:s.position[2],w:s.size[0],d:s.size[2]}));
  const places=(layout.interactions||[]).filter(i=>seen(i.position[0],i.position[2])).map(i=>({id:i.id,label:i.label,x:i.position[0],z:i.position[2]}));
  return {extent:e,solids,places};
 }

 // ---- Shared NPC and player profile (one view-model, one presentation) ----
 const HANDLE=/^[A-Za-z0-9_]{3,20}$/;
 function hash(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h.toString(36);}
 const stable=v=>Array.isArray(v)?'['+v.map(stable).join(',')+']':v&&typeof v==='object'?'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}':JSON.stringify(v);
 /* The portrait is a picture of ONE character in ONE look. Its key changes whenever the look or the asset version changes, so a stale picture can never be shown
    for a different look or a different character. `look`: a validated creator appearance (players), or {model} for an NPC. */
 function portraitKey(kind,id,look,assetVersion=ASSET_VERSION){
  return kind+':'+String(id).slice(0,64)+':'+hash(stable(look||null))+':a'+assetVersion;
 }
 /* kind 'player': {uid?, handle, appearance, bio}.  kind 'npc': {id, name, bio, place, affiliation, learned:[...], model}.
    Only whitelisted public fields come out. A player's account id and email are never part of the result (the key uses the public id). */
 function profile(kind,data,ctx={}){
  if(kind==='player'){
   const handle=HANDLE.test(String(data.handle||''))?data.handle:null,publicId=String(data.publicId||data.id||'').replace(/[^0-9a-f]/g,'').slice(0,12);
   const look=data.appearance||null;
   return {key:'player:'+(publicId||'local'),kind:'player',name:handle||'Unregistered visitor',subtitle:(handle?'@'+handle:'Not signed in')+(data.jobs?' · '+String(data.jobs).slice(0,80):''),bio:String(data.bio||'District visitor').slice(0,200),
    facts:[],places:[],portrait:{key:portraitKey('player',publicId||'local',look),source:look?{type:'appearance',appearance:look}:null,state:look?'ready':'unavailable'},
    actions:[{id:'message',label:'MESSAGE',enabled:false,reason:'Private messages are not available yet.'},{id:'block',label:'BLOCK',enabled:!!ctx.canBlock,reason:ctx.canBlock?'':'Block in the District chat panel.'},{id:'report',label:'REPORT',enabled:!!ctx.canReport,reason:ctx.canReport?'':'Report in the District chat panel.'}]};
  }
  const learned=Array.isArray(data.learned)?data.learned.map(String).slice(0,8):[];
  return {key:'npc:'+String(data.id||'').slice(0,40),kind:'npc',name:String(data.name||'Unknown').slice(0,60),subtitle:data.affiliation?String(data.affiliation).slice(0,60):'',bio:String(data.bio||'').slice(0,200),
   facts:learned,places:data.place?[String(data.place).slice(0,100)]:[],portrait:data.appearance?{key:portraitKey('npc',data.id||'',data.appearance),source:{type:'appearance',appearance:data.appearance,resident:true},state:'ready'}:{key:portraitKey('npc',data.id||'',data.model?{model:data.model}:null),source:data.model?{type:'model',model:data.model}:null,state:data.model?'ready':'unavailable'},
   actions:[{id:'talk',label:'CONVERSATION',enabled:!!data.here,reason:data.here?'':'Talk to them in person.'}]};
 }
 /* NOTIFICATION SOUNDS per device tier (the owner, 17 Nov 2026: "We need a notification sound too. Maybe different for every device V1, V2, V3 // Shadow"; "V3 is Shadow.
    It's the V3 // Shadow"). Three tiers: v1, v2, v3 (the device model 'v3', "V3 // SHADOW"). Only the V1 is in a player's hands; V2 and V3 are data only (no UI).
    Files: void-runner/assets/audio/ui/ (ElevenLabs Sound Effects on the owner's paid plan; LICENSES.md there). The owner's picks: V1 confirmed; V3 his choice; V2 is a
    PLACEHOLDER until the V2 exists. A model without its own row uses the V1's. A missing file plays nothing (personal-device.js). */
 const NOTIFY={v1:{name:'V1',sound:'void-runner/assets/audio/ui/device-v1-notify.ogg'},v2:{name:'V2',placeholder:true,sound:'void-runner/assets/audio/ui/device-v2-notify.ogg'},
  v3:{name:'V3 // SHADOW',sound:'void-runner/assets/audio/ui/device-v3-notify.ogg'}};
 const notifyTier=model=>NOTIFY[model]?model:'v1';
 /* DEVICE ID (the owner, 18 Nov 2026: a photo's metadata shows "the device ID on the person who took it"). Shown as V<generation>-XXXX-XXXX, e.g. "V1-7F3A-91C2".
    The 8 hex digits (story.flags.deviceSerial, a short string the cloud save already accepts) are made ONCE per campaign from a hash of a one-time random number,
    the campaign's epoch and, when signed in, the account id; the random number is thrown away, so the ID can never be turned back into the account, the email or the
    handle, and nobody can check a guessed account against it. It stays the same across reloads and computers (it is in the save); a new campaign gets a new one.
    The ID is the ONLY link from a photo to whoever took it (the owner: "the person who took it remains anonymous. Although there will be ways to track it later"):
    tracing an ID back to a person is a FUTURE gameplay mechanic, not built. A later model keeps the serial and shows its own prefix (V3-...). */
 const SERIAL=/^[0-9a-f]{8}$/;
 function fnv(text,h=2166136261){for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}return h>>>0;}
 /* The serial for a new device: seed = {account (optional), epoch, nonce (random)}. Two rounds of FNV-1a so every input bit spreads. */
 function makeSerial(seed){const s=seed||{},base=String(s.nonce||'')+'|'+String(s.epoch||'')+'|'+String(s.account||'');return (fnv('void-device|'+base,fnv(base))>>>0).toString(16).padStart(8,'0');}
 /* Reads the serial from the flags, creating it (seed: {account, epoch}; a random nonce is always added) when missing or malformed. Returns the serial. */
 function ensureSerial(flags,seed){if(!flags||typeof flags!=='object')return null;if(!SERIAL.test(flags[KEY.serial]||''))flags[KEY.serial]=makeSerial({...(seed||{}),nonce:Math.random().toString(36).slice(2)+Date.now().toString(36)});return flags[KEY.serial];}
 const prefixOf=model=>'V'+((DEVICES[model]||DEVICES.v1).generation||1);
 /* "V1-7F3A-91C2" for a serial and model; null when the serial is missing or malformed. */
 const deviceId=(serial,model)=>SERIAL.test(serial||'')?prefixOf(model)+'-'+serial.slice(0,4).toUpperCase()+'-'+serial.slice(4).toUpperCase():null;
 const DEVICE_ID=/^V\d-[0-9A-F]{4}-[0-9A-F]{4}$/;
 /* MISSION APP HINTS (the owner, 20 Nov 2026: Admin's call says "Press L to open your device, then select the Camera app", and L opened Comms). The V1 app a mission
    step wants the player to open: the step's own `app` (set in the Mission Editor, optional), or what its kind implies (a photo step: Camera; sending a photo:
    Messages). null: none. The home screen highlights that tile (personal-device.js) in the mission yellow. Future steps (a camera feed, a hacking tool) name theirs. */
 const STEP_APPS=['camera','gallery','messages','map','missions','comms','social','news','store','warflying','loadout'];
 const STEP_APP_BY_KIND={photo:'camera','send-photo':'messages',report:'missions',feed:'missions'};   // report / feed: their buttons are on the mission's card in the Mission Log (Awakening QA 20 Nov 2026)
 const stepApp=step=>!step||typeof step!=='object'?null:STEP_APPS.includes(step.app)?step.app:STEP_APP_BY_KIND[step.kind]||null;
 /* The hint over the highlighted tile: "ADMIN: OPEN CAMERA" (who: the mission giver's name, optional). */
 function appGoal(step,who,device){const app=stepApp(step);if(!app||!APPS[app])return null;const t=appTitle(app,device);return {app,title:t,text:(who?String(who).toUpperCase().slice(0,40)+': ':'')+'OPEN '+t};}
 /* Where the V1 opens when a notification is waiting: on that notification's app, EXCEPT a Comms call: the call carries on in the call bar at the top of the V1 and the
    V1 opens on its home (the apps), so "open your device, then select the Camera app" works as said. null: the home screen. */
 const openTarget=note=>!note||!note.app||note.app==='comms'?null:{app:note.app,sub:note.sub||null};
 /* The line of a call on screen now (its live subtitle in the call bar): lines appear 2.2 s apart from 0.4 s, as in the Comms transcript. -1: still connecting. */
 const CALL_LINE={first:400,every:2200};
 const callLine=(count,elapsedMs)=>count>0&&elapsedMs>=CALL_LINE.first?Math.min(count-1,Math.floor((elapsedMs-CALL_LINE.first)/CALL_LINE.every)):-1;
 /* Which waiting Comms message rings as the call (Awakening QA 20 Nov 2026): the OLDEST unread one that came in after the last call the player heard; one left unread
 before that is a missed call: it stays unread in Comms but does not ring later (an unanswered Mission 002 call rang after Fish's Mission 004 call). list: newest first. */
 const nextCall=list=>{const ls=Array.isArray(list)?list:[],heard=ls.filter(m=>m&&m.read).reduce((a,m)=>Math.max(a,Number(m.at)||0),0);let pick=null;for(const m of ls)if(m&&!m.read&&(Number(m.at)||0)>=heard)pick=m;return pick;};
 const api={STEP_APPS,stepApp,appGoal,openTarget,CALL_LINE,callLine,nextCall,NOTIFY,notifyTier,SERIAL,DEVICE_ID,makeSerial,ensureSerial,deviceId,prefixOf,ASSET_VERSION,DEVICES,APPS,STORE_EXTRA,NPC_MODELS,KEY,DEFAULT_SETTINGS,SETTING_VALUES,restore,write,parseSettings,settingsText,storage,storeListing,install,uninstall,appTitle,delayMs,CELL,RADIUS,extent,explore,explored,visible,encode,decode,hash,portraitKey,profile,HANDLE};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VoidDeviceV1=api;
})(typeof globalThis!=='undefined'?globalThis:this);
