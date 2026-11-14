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
 const ASSET_VERSION=1;   // bump when portrait framing or lighting changes, or when an NPC model or outfit is updated: every cached portrait is then redrawn
 const DEVICES={
  v1:{id:'v1',generation:1,name:'V1',tagline:'PERSONAL DEVICE · MODEL V1',
   apps:['missions','messages','social','news','map','camera','gallery','store','settings'],
   camera:{enabled:false},                       // the camera is a placeholder in V1
   // Interface timing, in milliseconds (a later model changes these numbers and nothing else). The starter V1 is deliberately a little slow: a short loading card is shown
   // before a screen appears. It is cosmetic and asynchronous: it never blocks the game loop, networking or message delivery. appOpenMs: opening an app from home;
   // homeMs: going back to home; tabMs: switching inside an app; startupMs: the first opening after the page loads. 0 turns a delay off (reduced motion does this too).
   ui:{halfWidth:.5,expandedWidth:.96,appOpenMs:320,homeMs:180,tabMs:160,startupMs:600,maxMs:600},
   // Storage is a defined baseline of the stock model, NOT a measurement of this computer or browser. The nine system apps are part of it. A future optional app costs
   // its own `storagePct` (in STORE_EXTRA) on top, and the total is capped at 100.
   storage:{baseUsedPct:75}
  }
 };
 // state: 'ready' (works), 'placeholder' (shows what is coming, does nothing yet), kind of limits are written in `note`
 const APPS={
  missions:{id:'missions',title:'MISSION LOG',glyph:'M',state:'ready',note:'Your missions and tracking.'},
  messages:{id:'messages',title:'MESSAGES',glyph:'@',state:'ready',note:'District chat and conversations. Private messages to other players are not available yet.'},
  social:{id:'social',title:'SOCIAL',glyph:'S',state:'ready',note:'People you know and other players.'},
  news:{id:'news',title:'NEWS',glyph:'N',state:'ready',note:'Reports you have received.'},
  map:{id:'map',title:'MAP',glyph:'+',state:'ready',note:'Places you have explored.'},
  camera:{id:'camera',title:'CAMERA',glyph:'O',state:'placeholder',note:'Not available in this model yet.'},
  gallery:{id:'gallery',title:'GALLERY',glyph:'G',state:'placeholder',note:'Photos will appear here when the camera exists.'},
  store:{id:'store',title:'APP STORE',glyph:'A',state:'ready',note:'Apps for this device.'},
  settings:{id:'settings',title:'SETTINGS',glyph:'*',state:'ready',note:'Device preferences.'}
 };
 // Apps a player could install later. Intentionally empty: no purchases, prices or unlocks exist yet.
 const STORE_EXTRA=[];   // each future entry: {id,title,generation,note,storagePct}
 // Which in-game model draws each named NPC's portrait: {npcId: 'crowd-look-id'}. EMPTY on purpose: the game does not yet say which crowd model is which named
 // character, and a guessed face would be wrong. An entry here makes that NPC's portrait appear (and regenerate whenever ASSET_VERSION or the model changes).
 const NPC_MODELS={};
 const DEFAULT_SETTINGS={motion:'auto',scan:'1',size:'half'};   // motion: auto (follow the system), full, reduced
 const SETTING_VALUES={motion:['auto','full','reduced'],scan:['0','1'],size:['half','expanded']};
 const KEY={model:'deviceModel',version:'deviceVersion',apps:'deviceApps',settings:'deviceSettings',map:'deviceMap'};

 // ---- What is saved (in story.flags) ----
 function parseSettings(text){
  const out={...DEFAULT_SETTINGS};
  if(typeof text!=='string')return out;
  for(const part of text.slice(0,200).split(';')){const [k,v]=part.split('=');if(Object.prototype.hasOwnProperty.call(SETTING_VALUES,k)&&SETTING_VALUES[k].includes(v))out[k]=v;}
  return out;
 }
 const settingsText=s=>Object.keys(SETTING_VALUES).map(k=>k+'='+(SETTING_VALUES[k].includes(s[k])?s[k]:DEFAULT_SETTINGS[k])).join(';');
 function restore(flags){
  flags=flags&&typeof flags==='object'?flags:{};
  const model=DEVICES[flags[KEY.model]]?flags[KEY.model]:'v1',def=DEVICES[model];
  const optional=a=>STORE_EXTRA.some(x=>x.id===a&&x.generation<=def.generation);   // an optional app that really exists is kept; anything else is dropped
  const asked=typeof flags[KEY.apps]==='string'?flags[KEY.apps].split(',').filter(a=>(def.apps.includes(a)||optional(a))&&APPS[a]):[];
  const apps=[...new Set([...def.apps,...asked])];   // the built-in apps are always installed; an unknown name is ignored, never trusted
  return {model,version:1,apps,settings:parseSettings(flags[KEY.settings]),map:{interior:String(flags[KEY.map+'Interior']||'').replace(/[^0-9a-f]/g,'').slice(0,60),street:String(flags[KEY.map+'Street']||'').replace(/[^0-9a-f]/g,'').slice(0,60)}};
 }
 function write(flags,device){
  flags[KEY.model]=device.model;flags[KEY.version]=1;flags[KEY.apps]=device.apps.join(',').slice(0,200);flags[KEY.settings]=settingsText(device.settings);
  flags[KEY.map+'Interior']=device.map.interior;flags[KEY.map+'Street']=device.map.street;return flags;
 }

 // ---- Storage, App Store view and timing ----
 const clampPct=n=>Math.max(0,Math.min(100,Math.round(n)));
 /* Stock V1: 9 system apps, 0 optional apps, 75% used / 25% available. Only optional apps that are actually installed add to the baseline. */
 function storage(device){
  const def=DEVICES[device.model]||DEVICES.v1,optional=device.apps.filter(a=>!def.apps.includes(a)),
   extra=optional.reduce((t,a)=>t+(Number((STORE_EXTRA.find(x=>x.id===a)||{}).storagePct)||0),0),used=clampPct(def.storage.baseUsedPct+extra);
  return {model:def.name,systemApps:def.apps.length,optionalApps:optional.length,usedPct:used,availablePct:100-used,baselinePct:def.storage.baseUsedPct};
 }
 function storeListing(device){
  const def=DEVICES[device.model]||DEVICES.v1,rows=def.apps.map(id=>({id,title:APPS[id].title,status:device.apps.includes(id)?'installed':'available',compatible:true,note:APPS[id].note,placeholder:APPS[id].state==='placeholder',system:true}));
  const extra=STORE_EXTRA.map(x=>({id:x.id,title:x.title,status:device.apps.includes(x.id)?'installed':x.generation>def.generation?'locked':'available',compatible:x.generation<=def.generation,note:x.note||'',placeholder:false,system:false}));
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
   return {key:'player:'+(publicId||'local'),kind:'player',name:handle||'Unregistered visitor',subtitle:handle?'@'+handle:'Not signed in',bio:String(data.bio||'District visitor').slice(0,200),
    facts:[],places:[],portrait:{key:portraitKey('player',publicId||'local',look),source:look?{type:'appearance',appearance:look}:null,state:look?'ready':'unavailable'},
    actions:[{id:'message',label:'MESSAGE',enabled:false,reason:'Private messages are not available yet.'},{id:'block',label:'BLOCK',enabled:!!ctx.canBlock,reason:ctx.canBlock?'':'Block in the District chat panel.'},{id:'report',label:'REPORT',enabled:!!ctx.canReport,reason:ctx.canReport?'':'Report in the District chat panel.'}]};
  }
  const learned=Array.isArray(data.learned)?data.learned.map(String).slice(0,8):[];
  return {key:'npc:'+String(data.id||'').slice(0,40),kind:'npc',name:String(data.name||'Unknown').slice(0,60),subtitle:data.affiliation?String(data.affiliation).slice(0,60):'',bio:String(data.bio||'').slice(0,200),
   facts:learned,places:data.place?[String(data.place).slice(0,100)]:[],portrait:{key:portraitKey('npc',data.id||'',data.model?{model:data.model}:null),source:data.model?{type:'model',model:data.model}:null,state:data.model?'ready':'unavailable'},
   actions:[{id:'talk',label:'CONVERSATION',enabled:!!data.here,reason:data.here?'':'Talk to them in person.'}]};
 }
 const api={ASSET_VERSION,DEVICES,APPS,STORE_EXTRA,NPC_MODELS,KEY,DEFAULT_SETTINGS,SETTING_VALUES,restore,write,parseSettings,settingsText,storage,storeListing,delayMs,CELL,RADIUS,extent,explore,explored,visible,encode,decode,hash,portraitKey,profile,HANDLE};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VoidDeviceV1=api;
})(typeof globalThis!=='undefined'?globalThis:this);
