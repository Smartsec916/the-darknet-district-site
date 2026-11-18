/* The device's Gallery (the owner, 15 Nov 2026): photos taken with the camera (left mouse button while the viewfinder is up).
   - Each photo takes PHOTO_PCT (1%) of the device's storage, on top of the system apps and any installed apps, so a stock V1 (75% used) holds 25.
   - Every photo keeps the name tags of the players and residents who were in the frame: drawn into the picture, and listed with it.
   - A photo can be deleted, or posted to the News app's PEOPLE feed (and taken down again).
   - Photos live in THIS browser only (IndexedDB). Nothing is uploaded: a post is seen by its owner, not yet by other players (that needs a server feature).
   Residents post too: NPC_POSTS are pictures taken in the game with this same camera (void-runner/art/news), with the tags of who is in them.
   Each photo also keeps what the camera judged at the moment it was taken (Mission 002, 17 Nov 2026: meta {subjects:[{id,name,valid,dist,why}], place, during, at}):
   who it really shows, where it was taken (places.js), and which mission steps were in progress. Missions use only that (cleanMeta); the picture stays here.
   METADATA (the owner, 18 Nov 2026): with a photo open, METADATA shows TAGGED (who the camera identified and how), LOCATION (places.js, most specific first),
   DEVICE ID (the photographer's device: device-v1.js deviceId) and TAKEN (the in-game time). The photographer stays ANONYMOUS: no handle, account or player id is kept
   with a photo; the device ID is the only link (tracing it back to a person is a future gameplay mechanic). FIELDS is the list of rows: a later field is one more entry.
   `postedBy` is the hook for "posted online by <handle>" (empty: nothing sets it yet; it shows only when set).
   FRESH START (the owner, 18 Nov 2026): this update deletes every photo taken before it, once, for every player (DB_VERSION 2: upgrade() clears the photos store and
   touches nothing else; photos never left the browser, so there is nothing in the cloud save to delete).
   Pure helpers run in Node (tests/device-gallery.test.cjs). */
(function(root){
 'use strict';
 const PHOTO_PCT=1,WIDTH=960,DB='void-runner-gallery',STORE='photos',DB_VERSION=2;
 const DV=typeof module!=='undefined'&&module.exports?require('./device-v1.js'):root.VoidDeviceV1;
 /* The one-time fresh start: run by indexedDB's upgrade (it runs once per browser, when the stored version is older). Creates the store when missing and, coming from
    version 1 (the photos taken before this update), empties it. Only the photos store of the Gallery's own database is ever touched. -> what it did. */
 function upgrade(db,tx,oldVersion){const has=db.objectStoreNames.contains(STORE);if(!has){db.createObjectStore(STORE,{keyPath:'id'});return 'created';}
  if(oldVersion>=1&&oldVersion<DB_VERSION){tx.objectStore(STORE).clear();return 'cleared';}return 'kept';}
 const text=(v,n)=>String(v??'').replace(/[\u0000-\u001f\u007f<>]/g,'').replace(/\s+/g,' ').trim().slice(0,n);
 /* How many photos fit: what the device has left after its apps, at PHOTO_PCT each. usedByApps: percent used by the system and installed apps. */
 const capacity=usedByApps=>Math.max(0,Math.floor((100-Math.max(0,Math.min(100,Number(usedByApps)||0)))/PHOTO_PCT));
 const usedPct=count=>Math.max(0,Math.round((Number(count)||0)*PHOTO_PCT));
 /* How the camera identified someone (kept with each tag): a District resident (district-people.js), a person a scene registers (VoidPhotoSubjects), another player's device. */
 const VIA={resident:'District resident registry',subject:'Camera identification',player:'Their device (another player)'};
 /* The tags kept with a photo: name and role of each person in the frame, without duplicates, at most 24. */
 function cleanTags(list){const out=[],seen=new Set();for(const t of list||[]){const name=text(t&&t.name,40);if(!name||seen.has(name.toLowerCase()))continue;seen.add(name.toLowerCase());out.push({name,role:text(t.role,40),kind:t.kind==='player'?'player':'npc',...(VIA[t.via]?{via:t.via}:{})});if(out.length>=24)break;}return out;}
 /* The checks kept with a photo, cleaned (closed shape, short ids and text only). Missing or broken: null (an older photo: it counts for nothing). */
 const ID=/^[a-z][a-z0-9-]{0,63}$/,STEP=/^[a-z][a-z0-9-]{0,79}\/[a-z][a-z0-9-]{0,79}$/;
 function cleanMeta(m){if(!m||typeof m!=='object'||!Array.isArray(m.subjects))return null;
  const subjects=m.subjects.filter(x=>x&&ID.test(x.id||'')).slice(0,24).map(x=>({id:x.id,name:text(x.name,40),valid:x.valid===true,...(Number.isFinite(x.dist)?{dist:Math.round(x.dist*10)/10}:{}),...(x.why?{why:text(x.why,60)}:{})}));
  return {subjects,place:ID.test(m.place||'')?m.place:null,during:(Array.isArray(m.during)?m.during:[]).filter(x=>typeof x==='string'&&STEP.test(x)).slice(0,20),at:Number.isFinite(m.at)?m.at:0,
    ...(Number.isSafeInteger(m.gameMin)&&m.gameMin>=0?{gameMin:m.gameMin,gameTime:/^\d\d:\d\d · DAY \d{1,6}$/.test(m.gameTime||'')?m.gameTime:''}:{}),   // the in-game time it was taken (game-clock.js)
   device:DV&&DV.DEVICE_ID.test(m.device||'')?m.device:'',   // the photographer's device ID (never a handle or an account id)
   postedBy:DV&&DV.HANDLE.test(m.postedBy||'')?m.postedBy:''};}   // hook: "posted online by <handle>" (nothing sets it yet)
 /* METADATA rows for a photo. ctx.placeLabel(id) -> the location chain, most specific first. A field with `optional` shows only when it has a value. */
 const FIELDS=[
  {id:'tagged',label:'TAGGED',rows:p=>{const subj=new Map(((p.meta&&p.meta.subjects)||[]).map(x=>[x.name.toLowerCase(),x]));return (p.tags||[]).map(t=>{const x=subj.get(t.name.toLowerCase());
    return {name:t.name,role:t.role||'',how:VIA[t.via]||(t.kind==='player'?VIA.player:VIA.resident),detail:x?(x.valid?'clear shot':x.why||'')+(Number.isFinite(x.dist)?' · '+x.dist+' m':''):''};});}},
  {id:'location',label:'LOCATION',value:(p,c)=>p.meta&&p.meta.place&&c.placeLabel?c.placeLabel(p.meta.place)||'':''},
  {id:'device',label:'DEVICE ID',value:p=>(p.meta&&p.meta.device)||''},
  {id:'taken',label:'TAKEN',value:p=>(p.meta&&p.meta.gameTime)||''},
  {id:'postedBy',label:'POSTED ONLINE BY',optional:true,value:p=>p.meta&&p.meta.postedBy?'@'+p.meta.postedBy:''}];
 function metadata(p,ctx={}){return FIELDS.map(f=>f.rows?{id:f.id,label:f.label,rows:f.rows(p)}:{id:f.id,label:f.label,value:f.value(p,ctx),optional:!!f.optional}).filter(f=>!f.optional||f.value);}
 const AREAS={neochinatown:'NeoChinatown',alley:'NeoChinatown · the alley',milked:'Milked',corporate:'Corporate District',temple:'Zen Zephyr Temple','district-entry':'The Darknet District · entrance','district-hall':'The Darknet District · hallway',
  'district-store':'The Darknet District · store','district-bar':'The Darknet District · bar','district-vr':'The Darknet District · VR','district-arcade':'The Darknet District · arcade','district-rest':'The Darknet District · sleeping pods','district-terrace':'The Darknet District · terrace',club:'NULL'};
 const placeName=area=>AREAS[area]||(String(area||'').startsWith('district')?'The Darknet District':'NeoChinatown');
 /* Pictures residents have posted. `by` is a district-people.js id; `tags` are the people in the picture. Taken in the game with the camera; no captions are invented. */
 const NPC_POSTS=[
  {id:'npc-post-null-1',by:'lumi-ashby',place:'NULL',image:'void-runner/art/news/null-floor.jpg',hoursAgo:3,tags:[{name:'DJ Vanta',role:'DJ',kind:'npc'}]},
  {id:'npc-post-bar-1',by:'nyx-district',place:'The Darknet District · bar',image:'void-runner/art/news/district-bar.jpg',hoursAgo:7,tags:[{name:'Nyx',role:'Bartender',kind:'npc'},{name:'Rin Takeda',role:'Influencer',kind:'npc'}]},
  {id:'npc-post-arcade-1',by:'dax',place:'The Darknet District · arcade',image:'void-runner/art/news/district-arcade.jpg',hoursAgo:11,tags:[{name:'Kei Navarro',role:'Courier',kind:'npc'}]},
  {id:'npc-post-null-2',by:'dj-vanta',place:'NULL',image:'void-runner/art/news/null-booth.jpg',hoursAgo:26,tags:[]}
 ];
 /* The PEOPLE feed, newest first: the player's own posted photos and the residents' pictures. mine: [{id,at,place,tags,postedAt}], now: ms. */
 function peopleFeed(mine,now,me){
  const out=[];for(const p of mine||[])if(p&&p.postedAt)out.push({id:'me:'+p.id,photo:p.id,by:me||'You',mine:true,place:p.place||'',tags:p.tags||[],at:p.postedAt});
  for(const n of NPC_POSTS)out.push({id:n.id,npc:n.by,image:n.image,place:n.place,tags:n.tags||[],at:now-n.hoursAgo*3600000});
  return out.sort((a,b)=>b.at-a.at);
 }
 const ago=(at,now)=>{const m=Math.max(0,Math.round((now-at)/60000));return m<1?'just now':m<60?m+' min ago':m<1440?Math.round(m/60)+' h ago':Math.round(m/1440)+' d ago';};
 const pure={PHOTO_PCT,WIDTH,DB,STORE,DB_VERSION,VIA,FIELDS,upgrade,metadata,capacity,usedPct,cleanTags,cleanMeta,placeName,NPC_POSTS,peopleFeed,ago};
 if(typeof module!=='undefined'&&module.exports){module.exports=pure;return;}
 if(typeof document==='undefined')return;

 // ---- browser ----
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let photos=[],db=null,loaded=false;const urls=new Map(),listeners=new Set();
 const changed=()=>{for(const f of listeners)try{f();}catch{}};
 function openDb(){return new Promise(res=>{try{const r=indexedDB.open(DB,DB_VERSION);r.onupgradeneeded=e=>{try{upgrade(r.result,r.transaction,e.oldVersion||0);}catch{}};r.onsuccess=()=>res(r.result);r.onerror=()=>res(null);}catch{res(null);}});}
 const tx=(mode,fn)=>new Promise(res=>{if(!db)return res(null);try{const t=db.transaction(STORE,mode),rq=fn(t.objectStore(STORE));t.oncomplete=()=>res(rq?.result??true);t.onerror=t.onabort=()=>res(null);}catch{res(null);}});
 const ready=(async()=>{db=await openDb();const all=await tx('readonly',s=>s.getAll());if(Array.isArray(all))photos=all.filter(p=>p&&p.id&&p.blob).sort((a,b)=>b.at-a.at);loaded=true;changed();})();
 const urlOf=p=>{if(!urls.has(p.id))urls.set(p.id,URL.createObjectURL(p.blob));return urls.get(p.id);};
 const appsPct=device=>{try{const D=root.VoidDeviceV1,st=D.storage(device);return st.usedPct-usedPct(photos.length);}catch{return 75;}};
 const room=device=>Math.max(0,capacity(appsPct(device))-photos.length);
 /* Keep a new photo. -> the stored record, or null when the device is full. */
 async function add(device,{blob,tags,area,zoom,meta}){
  if(!blob||room(device)<=0)return null;
  const p={id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),at:Date.now(),place:(meta&&meta.place&&root.VoidPlaces?.name?.(meta.place))||placeName(area),tags:cleanTags(tags),zoom:Number(zoom)||1,postedAt:0,blob,meta:cleanMeta(meta)};
  photos.unshift(p);await tx('readwrite',s=>s.put(p));changed();return p;
 }
 async function remove(id){const i=photos.findIndex(p=>p.id===id);if(i<0)return false;photos.splice(i,1);const u=urls.get(id);if(u){URL.revokeObjectURL(u);urls.delete(id);}await tx('readwrite',s=>s.delete(id));changed();return true;}
 async function post(id,on){const p=photos.find(x=>x.id===id);if(!p)return false;p.postedAt=on?Date.now():0;await tx('readwrite',s=>s.put(p));changed();return true;}
 const tagLine=tags=>tags&&tags.length?'<div class="pd-phototags">'+tags.map(t=>'<span>'+esc(t.name)+(t.role?' <small>'+esc(t.role)+'</small>':'')+'</span>').join('')+'</div>':'<div class="pd-note">Nobody tagged in this picture.</div>';
 /* The Gallery app. sub: undefined (the grid) or a photo id (one photo). */
 /* The places chain for a photo's metadata: "Bar · The Darknet District · Old Town · NeoChinatown · Tessaly System". */
 const placeLabel=id=>{try{return root.VoidPlaces?.chain?.(id)||'';}catch{return '';}};
 function metaHtml(p){
  const rows=metadata(p,{placeLabel}),v=x=>x?esc(x):'—';
  return '<section class="pd-meta" aria-label="Photo metadata"><h2>METADATA</h2><dl class="pd-kv">'+rows.map(f=>'<dt>'+esc(f.label)+'</dt><dd data-meta="'+esc(f.id)+'">'+(f.rows?(f.rows.length?f.rows.map(t=>'<div class="pd-meta-tag"><b>'+esc(t.name)+'</b>'+(t.role?' <small>'+esc(t.role)+'</small>':'')+'<br><small>'+esc(t.how)+(t.detail?' · '+esc(t.detail):'')+'</small></div>').join(''):'Nobody tagged'):v(f.value))+'</dd>').join('')+'</dl></section>';}
 function view(device,sub,panel){
  if(!loaded)return '<div class="pd-empty">Opening the gallery…</div>';
  const cap=capacity(appsPct(device)),head='<div class="pd-stat"><span>PHOTOS: '+photos.length+' / '+cap+'</span><span>EACH PHOTO: '+PHOTO_PCT+'% OF STORAGE</span></div>';
  if(sub){const p=photos.find(x=>x.id===sub);if(!p)return '<div class="pd-empty">That photo is gone.</div>';
   if(panel==='meta')return '<article class="pd-photo"><img alt="Photo taken at '+esc(p.place)+'" src="'+esc(urlOf(p))+'">'+metaHtml(p)+'</article>';
   return '<article class="pd-photo"><img alt="Photo taken at '+esc(p.place)+'" src="'+esc(urlOf(p))+'"><div class="pd-note">'+esc(p.place)+' · '+esc(p.meta&&p.meta.gameTime?p.meta.gameTime:new Date(p.at).toLocaleString())+(p.zoom>1?' · '+p.zoom+'x':'')+'</div>'+tagLine(p.tags)
    +'<div class="pd-row"><button type="button" data-photo-meta="'+esc(p.id)+'">METADATA</button><button type="button" data-photo-post="'+esc(p.id)+'" data-on="'+(p.postedAt?'0':'1')+'">'+(p.postedAt?'TAKE DOWN FROM NEWS':'POST TO NEWS')+'</button><button type="button" data-photo-del="'+esc(p.id)+'">DELETE</button></div>'
    +(p.postedAt?'<div class="pd-note">Posted to News · People. For now only you can see your posts: showing them to other players needs a server feature that is not built.</div>':'')+'</article>';}
  if(!photos.length)return head+'<div class="pd-empty"><b>GALLERY</b><br>No photos yet.<br>Raise the camera (B) and press the left mouse button to take one.</div>';
  return head+'<div class="pd-photogrid">'+photos.map(p=>'<button type="button" data-photo="'+esc(p.id)+'" aria-label="Photo taken at '+esc(p.place)+'"><img alt="" loading="lazy" src="'+esc(urlOf(p))+'">'+(p.postedAt?'<i>POSTED</i>':'')+'</button>').join('')+'</div>';
 }
 /* The News app's PEOPLE posts as cards. me: the player's shown name. names: id -> resident's name. */
 function peopleHtml(me,nameOf){
  const now=Date.now(),list=peopleFeed(photos,now,me);
  return list.map(x=>{const src=x.mine?(()=>{const p=photos.find(q=>q.id===x.photo);return p?urlOf(p):'';})():x.image,who=x.mine?x.by:(nameOf?.(x.npc)||x.npc);
   return '<article class="pd-post" data-news-kind="people"><header><b>'+esc(who)+'</b><small>'+esc(x.place)+' · '+esc(ago(x.at,now))+'</small></header><img alt="Picture posted by '+esc(who)+'" loading="lazy" src="'+esc(src)+'">'+(x.tags.length?tagLine(x.tags):'')+'</article>';}).join('');
 }
 root.VoidGallery={...pure,ready,add,remove,post,view,peopleHtml,room,onChange(f){listeners.add(f);},get count(){return photos.length;},get photos(){return photos.map(p=>({id:p.id,at:p.at,place:p.place,tags:p.tags,postedAt:p.postedAt,meta:p.meta||null}));},meta:id=>{const p=photos.find(x=>x.id===id);return p&&p.meta?JSON.parse(JSON.stringify(p.meta)):null;},url:id=>{const p=photos.find(x=>x.id===id);return p?urlOf(p):'';}};
})(typeof globalThis!=='undefined'?globalThis:this);
