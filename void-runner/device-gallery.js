/* The device's Gallery (David, 15 Nov 2026): photos taken with the camera (left mouse button while the viewfinder is up).
   - Each photo takes PHOTO_PCT (1%) of the device's storage, on top of the system apps and any installed apps, so a stock V1 (75% used) holds 25.
   - Every photo keeps the name tags of the players and residents who were in the frame: drawn into the picture, and listed with it.
   - A photo can be deleted, or posted to the News app's PEOPLE feed (and taken down again).
   - Photos live in THIS browser only (IndexedDB). Nothing is uploaded: a post is seen by its owner, not yet by other players (that needs a server feature).
   Residents post too: NPC_POSTS are pictures taken in the game with this same camera (void-runner/art/news), with the tags of who is in them.
   Each photo also keeps what the camera judged at the moment it was taken (Mission 002, 17 Nov 2026: meta {subjects:[{id,name,valid,dist,why}], place, during, at}):
   who it really shows, where it was taken (places.js), and which mission steps were in progress. Missions use only that (cleanMeta); the picture stays here.
   Pure helpers run in Node (tests/device-gallery.test.cjs). */
(function(root){
 'use strict';
 const PHOTO_PCT=1,WIDTH=960,DB='void-runner-gallery',STORE='photos';
 const text=(v,n)=>String(v??'').replace(/[\u0000-\u001f\u007f<>]/g,'').replace(/\s+/g,' ').trim().slice(0,n);
 /* How many photos fit: what the device has left after its apps, at PHOTO_PCT each. usedByApps: percent used by the system and installed apps. */
 const capacity=usedByApps=>Math.max(0,Math.floor((100-Math.max(0,Math.min(100,Number(usedByApps)||0)))/PHOTO_PCT));
 const usedPct=count=>Math.max(0,Math.round((Number(count)||0)*PHOTO_PCT));
 /* The tags kept with a photo: name and role of each person in the frame, without duplicates, at most 24. */
 function cleanTags(list){const out=[],seen=new Set();for(const t of list||[]){const name=text(t&&t.name,40);if(!name||seen.has(name.toLowerCase()))continue;seen.add(name.toLowerCase());out.push({name,role:text(t.role,40),kind:t.kind==='player'?'player':'npc'});if(out.length>=24)break;}return out;}
 /* The checks kept with a photo, cleaned (closed shape, short ids and text only). Missing or broken: null (an older photo: it counts for nothing). */
 const ID=/^[a-z][a-z0-9-]{0,63}$/,STEP=/^[a-z][a-z0-9-]{0,79}\/[a-z][a-z0-9-]{0,79}$/;
 function cleanMeta(m){if(!m||typeof m!=='object'||!Array.isArray(m.subjects))return null;
  const subjects=m.subjects.filter(x=>x&&ID.test(x.id||'')).slice(0,24).map(x=>({id:x.id,name:text(x.name,40),valid:x.valid===true,...(Number.isFinite(x.dist)?{dist:Math.round(x.dist*10)/10}:{}),...(x.why?{why:text(x.why,60)}:{})}));
  return {subjects,place:ID.test(m.place||'')?m.place:null,during:(Array.isArray(m.during)?m.during:[]).filter(x=>typeof x==='string'&&STEP.test(x)).slice(0,20),at:Number.isFinite(m.at)?m.at:0};}
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
 const pure={PHOTO_PCT,WIDTH,capacity,usedPct,cleanTags,cleanMeta,placeName,NPC_POSTS,peopleFeed,ago};
 if(typeof module!=='undefined'&&module.exports){module.exports=pure;return;}
 if(typeof document==='undefined')return;

 // ---- browser ----
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let photos=[],db=null,loaded=false;const urls=new Map(),listeners=new Set();
 const changed=()=>{for(const f of listeners)try{f();}catch{}};
 function openDb(){return new Promise(res=>{try{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>{r.result.createObjectStore(STORE,{keyPath:'id'});};r.onsuccess=()=>res(r.result);r.onerror=()=>res(null);}catch{res(null);}});}
 const tx=(mode,fn)=>new Promise(res=>{if(!db)return res(null);try{const t=db.transaction(STORE,mode),rq=fn(t.objectStore(STORE));t.oncomplete=()=>res(rq?.result??true);t.onerror=t.onabort=()=>res(null);}catch{res(null);}});
 const ready=(async()=>{db=await openDb();const all=await tx('readonly',s=>s.getAll());if(Array.isArray(all))photos=all.filter(p=>p&&p.id&&p.blob).sort((a,b)=>b.at-a.at);loaded=true;changed();})();
 const urlOf=p=>{if(!urls.has(p.id))urls.set(p.id,URL.createObjectURL(p.blob));return urls.get(p.id);};
 const appsPct=device=>{try{const D=root.VoidDeviceV1,st=D.storage(device);return st.usedPct-usedPct(photos.length);}catch{return 75;}};
 const room=device=>Math.max(0,capacity(appsPct(device))-photos.length);
 /* Keep a new photo. -> the stored record, or null when the device is full. */
 async function add(device,{blob,tags,area,zoom,meta}){
  if(!blob||room(device)<=0)return null;
  const p={id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),at:Date.now(),place:placeName(area),tags:cleanTags(tags),zoom:Number(zoom)||1,postedAt:0,blob,meta:cleanMeta(meta)};
  photos.unshift(p);await tx('readwrite',s=>s.put(p));changed();return p;
 }
 async function remove(id){const i=photos.findIndex(p=>p.id===id);if(i<0)return false;photos.splice(i,1);const u=urls.get(id);if(u){URL.revokeObjectURL(u);urls.delete(id);}await tx('readwrite',s=>s.delete(id));changed();return true;}
 async function post(id,on){const p=photos.find(x=>x.id===id);if(!p)return false;p.postedAt=on?Date.now():0;await tx('readwrite',s=>s.put(p));changed();return true;}
 const tagLine=tags=>tags&&tags.length?'<div class="pd-phototags">'+tags.map(t=>'<span>'+esc(t.name)+(t.role?' <small>'+esc(t.role)+'</small>':'')+'</span>').join('')+'</div>':'<div class="pd-note">Nobody tagged in this picture.</div>';
 /* The Gallery app. sub: undefined (the grid) or a photo id (one photo). */
 function view(device,sub){
  if(!loaded)return '<div class="pd-empty">Opening the gallery…</div>';
  const cap=capacity(appsPct(device)),head='<div class="pd-stat"><span>PHOTOS: '+photos.length+' / '+cap+'</span><span>EACH PHOTO: '+PHOTO_PCT+'% OF STORAGE</span></div>';
  if(sub){const p=photos.find(x=>x.id===sub);if(!p)return '<div class="pd-empty">That photo is gone.</div>';
   return '<article class="pd-photo"><img alt="Photo taken at '+esc(p.place)+'" src="'+esc(urlOf(p))+'"><div class="pd-note">'+esc(p.place)+' · '+esc(new Date(p.at).toLocaleString())+(p.zoom>1?' · '+p.zoom+'x':'')+'</div>'+tagLine(p.tags)
    +'<div class="pd-row"><button type="button" data-photo-post="'+esc(p.id)+'" data-on="'+(p.postedAt?'0':'1')+'">'+(p.postedAt?'TAKE DOWN FROM NEWS':'POST TO NEWS')+'</button><button type="button" data-photo-del="'+esc(p.id)+'">DELETE</button></div>'
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
