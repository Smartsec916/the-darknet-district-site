/* V1 personal holographic device: the screen (browser only; phones never download it). Rules and saved state are in device-v1.js.
   L opens and closes it. It does NOT change the game's mode: the world, other players and NPCs keep running; only YOUR movement is held. The mouse is free over
   the device and dragging the world outside it looks around. It is a read-and-act layer over systems that already exist (Mission Log, conversation history,
   the Relay news archive, District chat, the explored map); it keeps no messages, accounts or profiles of its own. Camera and Gallery are placeholders.
   Its look is void-runner/device-v1.css (scoped to #personal-device). Transition timing comes from DEVICES.v1.ui in device-v1.js. */
(function(root){
 'use strict';
 const D=root.VoidDeviceV1;if(!D)return;
 const MOVE=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight','ControlLeft','ControlRight','KeyC','Space','KeyQ','KeyR','KeyX','KeyE','KeyF','KeyG']);
  const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));   // own escaper: attributes need quotes escaped too
 const reduced=()=>dev.settings.motion==='reduced'||dev.settings.motion==='auto'&&root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 // One icon per app, drawn the same way (24x24, thin line). Kept here, as inline SVG: no image files to load.
 const ICON={missions:'<path d="M6 4h12v16H6z"/><path d="M9 9h6M9 13h6M9 17h3"/>',messages:'<path d="M4 5h16v11h-9l-4 4v-4H4z"/><path d="M8 9.5h8M8 12.5h5"/>',social:'<circle cx="9" cy="9" r="3"/><circle cx="17" cy="10" r="2.2"/><path d="M3.5 19c.6-3.6 3-5 5.5-5s4.900 1.400 5.500 5"/><path d="M15 14.300c2.600-.4 4.600.9 5.200 4.200"/>',
  news:'<path d="M4 5h12v14H6a2 2 0 0 1-2-2z"/><path d="M16 9h4v8a2 2 0 0 1-2 2"/><path d="M7 8.500h6M7 12h6M7 15.500h3"/>',map:'<path d="M12 21s6.500-5.700 6.500-10.500a6.500 6.500 0 0 0-13 0C5.500 15.300 12 21 12 21z"/><circle cx="12" cy="10.500" r="2.300"/>',
  camera:'<path d="M4 8h3.500l1.500-2h6l1.500 2H20v11H4z"/><circle cx="12" cy="13.500" r="3.500"/>',gallery:'<path d="M4 5h16v14H4z"/><circle cx="9" cy="10" r="1.600"/><path d="M4 17l5-4.500 3.500 3 3-2.500L20 16"/>',
  store:'<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>',device:'<path d="M7 3h10v18H7z"/><path d="M10 6h4M11 18h2"/>',comms:'<path d="M12 4a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V7a3 3 0 0 0-3-3z"/><path d="M6 11.500a6 6 0 0 0 12 0M12 17.500V21M9 21h6"/>',warflying:'<path d="M12 20v-8"/><circle cx="12" cy="10" r="1.6"/><path d="M8.500 13.500a5 5 0 0 1 0-7M15.500 6.500a5 5 0 0 1 0 7M6 16a8.500 8.500 0 0 1 0-12M18 4a8.500 8.500 0 0 1 0 12"/>',settings:'<path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h11M19 17h1"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="17" r="2"/>'};
 const icon=id=>'<svg class="pd-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+(ICON[id]||'')+'</svg>';
 // The homepage navigation button frame (home-navigation.css): panel, rail and one small accent tick, stretched to the tile.
 const FRAME='<svg class="pd-frame" viewBox="0 0 180 48" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path class="pd-panel" d="M10 .5H179.5V37.5L169.5 47.5H.5V10Z"/><path class="pd-rail" d="M16 4H47M1 19V33M133 44H161"/><path class="pd-accent" d="M171 5H175V14"/></svg>';
 let el=null,body=null,open=false,expanded=false,dev=D.restore({}),stack=[],held=new Set(),suppressed=new Set(),mapTimer=0,loadTimer=0,chip=null,navTimer=0,navSeq=0,busy=false,booted=false,launchTimer=0,pending=null,wantFocus=false,readSeq=0,dividerSeq=null,wasViewing=false,playersSig='',reporting='';
 const chat=()=>root.VoidDistrictChat||null;
 const sources=new Map();   // portrait key -> source, filled while rendering a profile

 const state_=()=>typeof state!=='undefined'?state:null;
 const onFootOrDock=()=>typeof mode!=='undefined'&&(mode==='walking'||mode==='dock');
 const commit=()=>{try{const s=state_();if(s?.story?.flags){D.write(s.story.flags,dev);if(typeof save==='function')save();}}catch{}};

 // ---- Shared profile component (NPCs and players are drawn by the same code) ----
 function portraitHtml(p){
  if(p.portrait.state!=='ready'||!root.VoidDevicePortraits)return '<div class="pd-sil" role="img" aria-label="Portrait unavailable"><svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true"><circle cx="24" cy="17" r="8" fill="none" stroke="currentColor"/><path d="M8 44c2-12 10-16 16-16s14 4 16 16" fill="none" stroke="currentColor"/></svg>PORTRAIT UNAVAILABLE</div>';
  sources.set(p.portrait.key,p.portrait);
  return '<img class="pd-portrait" alt="Portrait of '+esc(p.name)+'" data-pk="'+esc(p.portrait.key)+'" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" width="112" height="112">';
 }
 /* Achievements on a profile (David, 15 Nov 2026): three shown, the hardest (and anything bought with real money) first; VIEW ALL opens the rest, and the list can be put
    in order of most recent, difficulty or type. A resident's come from district-people.js; a player's come from the server's verified records, which do not exist yet,
    so players show none for now (achievements.js: the browser never grants one). */
 const achView=new Map();   // profile key -> {open, sort}
 function achievementsHtml(p){const A=root.VoidAchievements,P=DP();if(!A?.profileList||p.kind!=='npc')return '';const held=P?.achievementsOf?.(p.key.slice(4))||[];if(!held.length)return '';
  const v=achView.get(p.key)||{open:false,sort:'featured'},list=A.profileList(held,v.sort),shown=v.open?list:list.slice(0,A.SHOWN),day=t=>t?new Date(t).toISOString().slice(0,10):'';
  return '<div class="pd-ach"><h4>ACHIEVEMENTS · '+list.length+'</h4>'
   +(v.open?'<label class="pd-achsort">ORDER <select data-ach-sort="'+esc(p.key)+'">'+A.SORTS.map(([id,label])=>'<option value="'+id+'"'+(id===v.sort?' selected':'')+'>'+esc(label)+'</option>').join('')+'</select></label>':'')
   +shown.map(a=>'<div class="pd-achrow"><b>'+esc(a.icon||'◆')+'</b><div><strong>'+esc(a.name)+'</strong><small><span class="pd-stars" role="img" aria-label="Difficulty '+a.difficulty+' of 5">'+A.stars(a.difficulty)+'</span>'+(a.paid?' · Real purchase':'')+' · '+esc(a.category)+(a.at?' · '+day(a.at):'')+'</small></div></div>').join('')
   +(list.length>A.SHOWN?'<button type="button" class="pd-achmore" data-ach-more="'+esc(p.key)+'" aria-expanded="'+v.open+'">'+(v.open?'SHOW FEWER ▴':'VIEW ALL '+list.length+' ▾')+'</button>':'')+'</div>';}
 function profileCard(p,opts={}){
  return '<article class="pd-card"><div class="pd-prof">'+portraitHtml(p)+'<div style="flex:1;min-width:150px"><h3>'+esc(p.name)+'</h3>'+(p.subtitle?'<div class="pd-note">'+esc(p.subtitle)+'</div>':'')+'<p>'+esc(p.bio)+'</p>'
   +(p.facts.length?'<ul>'+p.facts.map(f=>'<li>'+esc(f)+'</li>').join('')+'</ul>':'')+achievementsHtml(p)+(p.places.length?'<div class="pd-note">Last known: '+p.places.map(esc).join(' · ')+'</div>':'')
   +'<div class="pd-tabs" style="margin-top:6px">'+p.actions.map(a=>'<button type="button" data-act="'+esc(a.id)+'" data-profile="'+esc(p.key)+'"'+(a.enabled?'':' disabled title="'+esc(a.reason)+'"')+'>'+esc(a.label)+'</button>').join('')+'</div>'
   +(opts.extra||'')+'</div></div></article>';
 }
 function hydratePortraits(){
  if(!body||!root.VoidDevicePortraits)return;
  for(const img of body.querySelectorAll('img[data-pk]')){const src=sources.get(img.dataset.pk);if(!src)continue;
   root.VoidDevicePortraits.request(src).then(url=>{if(url&&img.isConnected&&img.dataset.pk===src.key)img.src=url;else if(!url&&img.isConnected){const d=document.createElement('div');d.className='pd-sil';d.setAttribute('role','img');d.setAttribute('aria-label','Portrait unavailable');d.textContent='PORTRAIT UNAVAILABLE';img.replaceWith(d);}}).catch(()=>{});}
 }

 // ---- Data adapters (read existing systems; nothing is copied or duplicated) ----
 const uid=()=>root.VoidAccount?.user?.uid||'guest';
 const rp=()=>root.VoidRemotePlayers;
 function myProfile(){
  if(flags_()?.playingAs==='admin'&&DP()?.npc('admin')){const n=DP().npc('admin'),p=D.profile('player',{handle:'Admin',publicId:rp()?.me||'',appearance:n.appearance,bio:n.bio,jobs:DP().jobsText(n.jobs)});p.subtitle='Admin · '+DP().jobsText(n.jobs);return p;}   // a developer playing as Admin: Admin's own record
  const A=root.VoidCharacterCreator?.stored?.()||null,h=root.VoidAccount?.handle;   // no saved look: the portrait says unavailable, never a guess
  const f=flags_(),about=f?cleanAbout(f.profileAbout):'',mine=D.profile('player',{handle:typeof h==='string'?h:null,publicId:rp()?.me||'',appearance:A,bio:about||'This is you.',jobs:DP()&&f?DP().jobsText(DP().readJobs(f)):''});
  try{mine.facts=(root.VoidLocalProgress?.profileLines()||[]).slice(0,12);}catch{}   // progress counted in this browser (local-progress.js): your own profile only; achievements proper need server records
  return mine;
 }
 function npcContacts(){
  const H=root.VoidHudData,s=state_();if(!H||!s)return [];
  return H.contacts(s).map(c=>D.profile('npc',{id:c.id,name:c.name,bio:c.place,place:c.place,here:c.here,learned:[c.channel],model:(D.NPC_MODELS||{})[c.id]||null}));
 }
 /* District residents (district-people.js): the named NPCs who are where you are, listed beside real players. Their portrait is the figure the scene really
    shows (its look is read from the scene when it is loaded), so a face is never guessed. */
 const DP=()=>root.VoidDistrictPeople||null;
 function areasHere(){const out=[];try{const wl=typeof walkingLocation!=='undefined'?walkingLocation:null;if(wl?.id==='neochinatown'&&typeof walker!=='undefined'&&walker){if(wl.area==='interior')out.push('interior');else if(root.VoidNightclub?.inside?.(walker))out.push('club');}}catch{}return out;}
 function sceneLook(crew){try{const sc=root.VoidBabylon?.scene,hit=n=>n.metadata&&n.metadata.crowd&&(n.metadata.character===crew||n.metadata.club===crew),n=sc?.transformNodes.find(hit)||sc?.meshes.find(hit);return n?n.metadata.crowd:null;}catch{return null;}}
 function residentProfile(n,here){const P=DP(),live=n.live==='dax'?root.VoidDax?.where:null;   /* Dax moves about on her own: her profile says where she is now */
  return D.profile('npc',{id:n.id,name:n.name,affiliation:P.jobsText(n.jobs),bio:n.bio,place:live?live.place:n.place,here:false,appearance:n.model?null:n.appearance||null,model:n.model||(n.appearance?null:(n.crew&&sceneLook(n.crew))||n.look||null)});}
 function residents(onlyHere=true){const P=DP();if(!P)return [];const a=areasHere();const me=flags_()?.playingAs;return P.NPCS.filter(n=>n.id!==me&&(!onlyHere||a.includes(n.area))).map(n=>residentProfile(n));}   /* a developer playing as Admin is not also listed as a resident */
 const flags_=()=>state_()?.story?.flags||null;
 const cleanAbout=v=>String(v??'').replace(/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069<>]/g,'').replace(/\s+/g,' ').trim().slice(0,120);
 function profileEditor(){
  const P=DP(),f=flags_();if(!P||!f)return '';const mine=P.readJobs(f);
  const pick=(n,label)=>'<label class="pd-jobsel"><span>'+label+'</span><select data-jobsel="'+n+'" aria-label="'+label+'"><option value="">NONE</option>'+P.JOBS.map(j=>'<option value="'+esc(j.id)+'"'+(mine[n]===j.id?' selected':'')+'>'+esc(j.label.toUpperCase())+'</option>').join('')+'</select></label>';
  return '<div class="pd-jobs"><h2>WHAT YOU DO</h2><div class="pd-note">Choose one or two jobs. Kept in your save and shown on your profile here. Other players cannot see it yet.</div><div class="pd-jobrow">'+pick(0,'JOB')+pick(1,'SECOND JOB')+'</div>'
   +'<h2>ABOUT YOU</h2><form data-aboutform class="pd-compose"><input type="text" maxlength="120" autocomplete="off" aria-label="About you" placeholder="A line about your character (120 characters)" value="'+esc(cleanAbout(f.profileAbout))+'"><button type="submit">SAVE</button></form></div>';
 }
 /* Following: chosen with the camera (device-camera.js) or a profile's FOLLOW button; kept in the save (district-people.js). */
 const followKey=p=>p.kind==='npc'?'n:'+p.key.slice(4):'p:'+p.key.slice(7);
 function followButton(p){const P=DP(),f=flags_();if(!P||!f)return '';const k=followKey(p),on=P.isFollowing(f,k);if(p.kind==='player'&&!D.HANDLE.test(p.name))return '';
  return '<div class="pd-tabs" style="margin-top:6px"><button type="button" data-follow="'+esc(k)+'" data-name="'+esc(p.name)+'" aria-pressed="'+on+'">'+(on?'FOLLOWING · UNFOLLOW':'FOLLOW')+'</button></div>';}
 function following(){const P=DP(),f=flags_();if(!P||!f)return [];const near=nearbyPlayers();
  return P.readFollowing(f).map(x=>{if(x.kind==='npc'){const n=P.npc(x.id);return n?{...x,profile:residentProfile(n)}:null;}const pr=near.find(p=>p.key==='player:'+x.id);return {...x,profile:pr||null};}).filter(Boolean).reverse();}
 function nearbyPlayers(){
  const r=rp();if(!r?.connected)return [];
  return r.peers.map(p=>{const d=distanceTo(p),pr=D.profile('player',{handle:p.name,publicId:p.id,appearance:p.appearance||null,bio:d==null?'In the District right now.':'In the same place as you, '+distText(d)+'.'},{canBlock:true,canReport:true});pr.dist=d;return pr;}).sort((a,b)=>(a.dist??0)-(b.dist??0));
 }


 // ---- Messages: the District chat on screen (the session's messages live in district-chat.js) ----
 const clock=t=>{try{return new Date(t).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});}catch{return '';}};
 function chatLogHtml(){
  const ls=(chat()?.lines||[]).slice(-60);if(!ls.length)return '<div class="pd-empty">No messages yet this session.</div>';
  let out='',marked=false;
  for(const l of ls){
   if(!marked&&dividerSeq!=null&&l.seq>dividerSeq&&l.kind==='chat'){out+='<div class="pd-newline" role="separator">NEW</div>';marked=true;}
   out+=l.kind==='sys'?'<div class="pd-msg sys">'+esc(l.text)+'</div>':'<div class="pd-msg '+(l.kind==='me'?'me':'')+'"><div class="pd-msg-h"><b>'+esc(l.name)+(l.kind==='me'?' (you)':'')+'</b><time>'+esc(clock(l.at))+'</time></div><div>'+esc(l.text)+'</div></div>';
  }
  return out;
 }
 /* How far away another player is, in metres. Inside The Darknet District everyone is simply "here", so no distance is shown; on the street, in NULL and
    everywhere else the list says how far each person is (David, 15 Nov 2026). null = not shown. */
 function distanceTo(p){try{if(areasHere().includes('interior')||typeof walker==='undefined'||!walker||!Number.isFinite(p.x)||!Number.isFinite(p.z))return null;return Math.round(Math.hypot(p.x-walker.x,p.z-walker.z));}catch{return null;}}
 const distText=d=>d==null?'':d<1000?d+' m away':(d/1000).toFixed(1)+' km away';
 const REASONS=[['harassment','HARASSMENT'],['spam','SPAM'],['inappropriate','INAPPROPRIATE'],['cheating','CHEATING'],['other','OTHER']];
 function playerRows(){
  const r=rp(),rows=(r?.connected?r.peers:[]).map(p=>({id:p.id,name:p.name,here:true,dist:distanceTo(p)}));
  rows.sort((a,b)=>(a.dist??0)-(b.dist??0));   // nearest first where distance is shown
  for(const [id,,name] of (r?.ignored||[]))if(!rows.some(x=>x.id===id))rows.push({id,name,here:false});   // a blocked player's character is hidden, so they stay listed to be unblocked
  return rows;
 }
 const playersSigNow=()=>playerRows().map(x=>x.id+x.name+(x.dist==null?'':':'+Math.round(x.dist/5))).join('|')+JSON.stringify(rp()?.ignored||[])+'|'+areasHere().join(',');
 function playersHtml(){
  const r=rp(),ign=new Map((r?.ignored||[]).map(([id,m,name])=>[id,{m,name}])),rows=playerRows();playersSig=playersSigNow();
  const note=chat()?.note,keys=new Map();try{const near=nearbyPlayers();for(const p of (r?.connected?r.peers:[])){const k='player:'+String(p.id).replace(/[^0-9a-f]/g,'').slice(0,12);if(near.some(n=>n.key===k))keys.set(p.id,k);}}catch{}
  const res=residents(),resRow=p=>'<article class="pd-card"><div class="pd-prof pd-mini">'+portraitHtml(p)+'<div style="flex:1;min-width:150px"><h3>'+esc(p.name)+' <small>RESIDENT</small></h3><div class="pd-note">'+esc(p.subtitle||'')+'</div><div class="pd-tabs" style="margin:6px 0 0"><button type="button" data-open-profile="'+esc(p.key)+'">PROFILE</button></div></div></div></article>';
  const list=rows.length?rows.map(p=>{const m=ign.get(p.id)?.m;return '<article class="pd-card"><h3>'+esc(p.name)+(m?' <small>['+m.toUpperCase()+']</small>':'')+(p.here?'':' <small>(not in view)</small>')+(p.dist!=null?' <small>'+esc(distText(p.dist).toUpperCase())+'</small>':'')+'</h3><div class="pd-tabs">'
    +'<button type="button" data-ig="'+(m==='mute'?'unmute':'mute')+'" data-id="'+esc(p.id)+'" data-name="'+esc(p.name)+'">'+(m==='mute'?'UNMUTE':'MUTE')+'</button>'
    +'<button type="button" data-ig="'+(m==='block'?'unblock':'block')+'" data-id="'+esc(p.id)+'" data-name="'+esc(p.name)+'">'+(m==='block'?'UNBLOCK':'BLOCK')+'</button>'
    +(p.here?'<button type="button" data-rep-open="'+esc(p.id)+'">REPORT</button>':'')+(p.here&&keys.get(p.id)?'<button type="button" data-open-profile="'+esc(keys.get(p.id))+'">PROFILE</button>':'')+'</div>'
    +(reporting===p.id?'<div class="pd-report"><select aria-label="Reason">'+REASONS.map(([v,l])=>'<option value="'+v+'">'+l+'</option>').join('')+'</select><input type="text" maxlength="120" aria-label="Report note" placeholder="What happened? (optional)"><button type="button" data-rep-send="'+esc(p.id)+'">SEND REPORT</button></div>':'')+'</article>';}).join(''):'<div class="pd-empty">'+(r?.connected?'Nobody else is here right now.':'Not connected to the District server.')+'</div>';
  return '<div class="pd-note">Mute hides a player\'s chat. Block also hides their character. Both are kept on this device. You can also type /mute NAME or /block NAME in the chat.</div>'
   +(note?'<div class="pd-card" role="status">'+esc(note)+'</div>':'')+'<h2>PLAYERS</h2>'+list+(res.length?'<h2>'+esc((DP().AREAS[areasHere()[0]]||'HERE').toUpperCase())+' · RESIDENTS</h2>'+res.map(resRow).join(''):'')
   +'<div class="pd-note" style="margin-top:8px">Reports go to the District server\'s log for review. They are not kept as a permanent case file.</div>';
 }
 const unreadText=n=>n>99?'99+':String(n);
 /* The chat counts as "being looked at" only while the V1 is open, not mid-transition, on Messages > District chat. Looking at it reads everything that was waiting. */
 const viewingNow=()=>open&&!busy&&stack[0]==='messages'&&(stack[1]||'chat')==='chat';
 const topSeq=()=>{const ls=chat()?.lines||[];return ls.length?ls[ls.length-1].seq:0;};
 function syncViewing(){
  const v=viewingNow(),C_=chat();
  if(v&&!wasViewing)dividerSeq=readSeq;   // the NEW marker goes before what arrived since the player last looked
  if(v||wasViewing)readSeq=topSeq();
  if(!v)dividerSeq=null;
  wasViewing=v;C_?.setViewing(v);
 }
 function updateBadges(){
  const n=chat()?.unread||0;
  if(chip){chip.textContent=n?'V1 · L · '+unreadText(n)+' NEW':'V1 · L';chip.classList.toggle('unread',n>0);chip.setAttribute('aria-label',n?'Open the V1 device. '+n+' unread message'+(n===1?'':'s'):'Open the V1 device');}
  if(!body)return;
  const tile=body.querySelector('[data-app=messages] .pd-badge');if(tile){tile.hidden=!n;tile.textContent=n?unreadText(n):'';}
  const tb=body.querySelector('[data-tabbadge=chat]');if(tb){tb.hidden=!n;tb.textContent=n?unreadText(n):'';}
 }
 function onChatChange(){
  if(open&&!busy&&viewingNow()){   // redraw only the message list so what the player is typing is never disturbed
   const log=body.querySelector('[data-chatlog]');
   if(log){const near=log.scrollHeight-log.scrollTop-log.clientHeight<40;log.innerHTML=chatLogHtml();if(near)log.scrollTop=log.scrollHeight;}
   readSeq=topSeq();
  }else if(open&&!busy&&stack[0]==='messages'&&stack[1]==='players'&&!body.querySelector('input:focus'))render({keepScroll:true});   // a refused report or a command's answer
  updateBadges();
 }

 /* The News feed's adverts: the goods the District store stocks (the list the shop shelves are drawn from), read once; and a seed that changes each time the app is opened. */
 let storeNames=null,feedSeed=1,rebinding=false;
 try{fetch(new URL('void-runner/assets/textures/store/store-atlas.json',document.baseURI||location.href)).then(r=>r.ok?r.json():null).then(j=>{if(j&&typeof j==='object')storeNames=j;}).catch(()=>{});}catch{}
 // ---- Apps ----
 const APP_VIEW={
  missions(){
   const s=state_(),V=root.VoidMissions;let list=[];try{list=s&&V?V.sync(s,C):[];}catch{}
   const steps=m=>{const o=(m.objectives||[]).filter(x=>x.required!==false),n=o.filter(x=>x.complete).length;return {n,total:o.length};};
   const card=m=>{const p=steps(m),rew=Number(m.rewards)>0?m.rewards+' credits':null;return '<article class="pd-card '+(m.completed?'done':'')+'"><h3>'+esc(m.title)+' <small>'+(m.completed?'COMPLETE':m.tracked?'TRACKED':'ACTIVE')+'</small></h3><p>'+esc(m.description)+'</p><div class="pd-note">'+esc(String(m.type||'').toUpperCase())
    +(m.destination?' · '+esc(C.stations?.[m.destination]?.name||m.destination):'')+(p.total?' · '+p.n+' OF '+p.total+' STEPS':'')+(rew?' · REWARD '+esc(rew):'')+'</div>'
    +(m.completed?'':(m.objective?'<div class="pd-obj"><b>OBJECTIVE</b> '+esc(m.objective)+'</div>':'')+'<ul class="pd-steps">'+(m.objectives||[]).map(o=>'<li class="'+(o.complete?'on':'')+'">'+(o.complete?'✓ ':'○ ')+esc(o.label)+'</li>').join('')+'</ul>')
    +(m.completed?'':'<button type="button" data-'+(m.tracked?'untrack':'track')+'="'+esc(m.id)+'">'+(m.tracked?'STOP TRACKING':'TRACK')+'</button>')+'</article>';};
   const active=list.filter(m=>!m.completed),done=list.filter(m=>m.completed);
   return (active.length?active.map(card).join(''):'<div class="pd-empty">No active missions.<br>Missions appear here when someone in the District offers you work.</div>')+(done.length?'<h2>COMPLETED</h2>'+done.map(card).join(''):'');
  },
  messages(){
   const r=rp(),C_=chat(),sub=stack[1]||'chat',un=C_?.unread||0;
   const tab=(id,label,badge)=>'<button type="button" data-sub="'+id+'" aria-pressed="'+(sub===id)+'">'+label+(badge?'<span class="pd-badge pd-inline" data-tabbadge="'+id+'">'+badge+'</span>':'')+'</button>';
   const tabs='<div class="pd-tabs">'+tab('chat','DISTRICT CHAT',un?(un>99?'99+':un):'')+tab('players','PLAYERS','')+tab('talk','CONVERSATIONS','')+tab('dm','PRIVATE','')+'</div>';
   if(sub==='dm')return tabs+'<div class="pd-empty"><b>PRIVATE MESSAGES</b><br>Not available yet.<br>They need a server feature (delivery, blocking checks, storage) that has not been built or approved. Planned for a later phase. Nothing is stored on this device.</div>';
   if(sub==='players')return tabs+playersHtml();
   if(sub==='talk'){
    let rows=[];try{rows=root.VoidConversationHistory?.read(localStorage,uid())||[];}catch{}
    return tabs+'<div class="pd-note">People you have talked to in this browser. Not synced.</div>'+(rows.length?rows.slice(-40).reverse().map(m=>'<div class="pd-line"><b>'+esc(m.name)+'</b><span class="pd-note">'+esc(new Date(m.at).toLocaleString())+'</span><div>'+esc(m.text)+'</div></div>').join(''):'<div class="pd-empty">No conversations yet. People you talk to appear here.</div>');
   }
   const online=!!r?.connected,can=online&&r.features.chat,here=online?(r.peers.length+1):0;
   return tabs+'<div class="pd-chat-head"><b>DISTRICT CHAT</b><span class="pd-note">'+(online?here+' in the District interior':'OFFLINE')+'</span></div>'
    +'<div class="pd-note">Everyone in the District interior can read this. Messages are kept for this session only.'+(online?'':' You are not connected to the District server right now.')+'</div>'
    +'<div class="pd-chatlog" data-chatlog role="log" aria-live="polite">'+chatLogHtml()+'</div><div class="pd-note" data-chathint></div>'
    +'<form data-chatform class="pd-compose"><input type="text" maxlength="200" autocomplete="off" aria-label="Chat message" placeholder="'+(can?'Say something to the District (no links)':'Chat needs a registered account and a connection')+'"'+(can?'':' disabled')+'><button type="submit"'+(can?'':' disabled')+'>SEND</button></form>';
  },
  social(){
   const sel=stack[1];
   if(sel){const mine=myProfile(),all=[mine,...residents(false),...npcContacts(),...nearbyPlayers()],p=all.find(x=>x.key===sel);if(p)return profileCard(p,{extra:(p.key!==mine.key?followButton(p):'')+(p.kind==='player'&&p.key!==mine.key?'<div data-report></div>':'')})+(p.key===mine.key?profileEditor():'');}
   const me=myProfile(),here=residents(),hk=new Set(here.map(x=>x.key)),npcs=npcContacts().filter(x=>!hk.has(x.key)),pl=nearbyPlayers();
   const fol=following(),folRow=f=>f.profile?row(f.profile):'<article class="pd-card"><h3>'+esc(f.name)+' <small>PLAYER · NOT HERE NOW</small></h3><div class="pd-tabs" style="margin:6px 0 0"><button type="button" data-follow="'+esc(f.key)+'" data-name="'+esc(f.name)+'">UNFOLLOW</button></div></article>';
   const row=p=>'<article class="pd-card"><div class="pd-prof">'+portraitHtml(p)+'<div style="flex:1"><h3>'+esc(p.name)+'</h3><div class="pd-note">'+esc(p.subtitle||p.bio)+(p.dist!=null?' · '+esc(distText(p.dist)):'')+'</div><button type="button" data-open-profile="'+esc(p.key)+'">PROFILE</button></div></div></article>';
   return '<h2>YOU</h2>'+row(me)+'<h2>FOLLOWING</h2>'+(fol.length?fol.map(folRow).join(''):'<div class="pd-empty">Nobody yet. Open the Camera, put the crosshair on someone or their tag, and press F.</div>')+'<h2>PEOPLE YOU KNOW</h2>'+(npcs.length?npcs.map(row).join(''):'<div class="pd-empty">Nobody yet. People you meet appear here.</div>')
    +(here.length?'<h2>RESIDENTS HERE</h2>'+here.map(row).join(''):'')+'<h2>PLAYERS HERE NOW</h2>'+(pl.length?pl.map(row).join(''):'<div class="pd-empty">'+(rp()?.connected?'No other players nearby.':'Not connected to the District server.')+'</div>')
    +'<div class="pd-note" style="margin-top:10px">Friends and player discovery are not available yet.</div>';
  },
  news(){return newsView(newsOld());},
  newsOld_(){
   const R=root.VoidRelayRadio;let html='';try{html=R?.archiveSection?.()||'';}catch{}
   const head=html?'<div class="pd-note">From THE RELAY. Only what you have actually heard is listed. Sponsored lines are the adverts on the screens around you.</div>':'';
   // adverts mixed in among the reports, in a new order each time the app is opened
   let ads=[];try{const F=root.VoidNewsFeed,s=state_();if(F){const store=[];for(const k of Object.keys(storeNames||{}))for(const c of storeNames[k].cells||[])if(c.name&&!store.includes(c.name))store.push(c.name);
    const tpl=document.createElement('template');tpl.innerHTML=html;const sec=tpl.content.querySelector('.relay-archive'),blocks=sec?[...sec.children].filter(e=>e.matches('article,details')):[];
    ads=F.feed(F.adverts({brands:root.VoidAds?.brands,relay:R?.content?.segments,store,flags:s?.story?.flags,completed:s?.universe?.completedObjectives||[]}),blocks.length,feedSeed);
    const card=a=>'<aside class="pd-ad" aria-label="Advertisement"><small>SPONSORED · '+esc(a.sponsor)+'</small><b>'+esc(a.title)+'</b><span>'+esc(a.text)+'</span>'+(a.link?'<a href="'+esc(a.link)+'" target="_blank" rel="noopener">VIEW IN THE STORE</a>':'')+'</aside>';
    if(sec&&blocks.length){for(let i=ads.length-1;i>=0;i--){const {ad,slot}=ads[i],el=document.createElement('div');el.innerHTML=card(ad);const at=blocks[slot]||null;if(at)at.before(el.firstChild);else sec.append(el.firstChild);}return head+tpl.innerHTML;}
    return head+(html||'<div class="pd-empty">No news received yet.<br>Reports appear here after you hear them on the Relay.</div>')+(ads.length?'<h2>SPONSORED</h2>'+ads.map(x=>card(x.ad)).join(''):'');}}catch{}
   return html?head+html:'<div class="pd-empty">No news received yet.<br>Reports appear here after you hear them on the Relay.</div>';
  },
  map(){
   const wl=typeof walkingLocation!=='undefined'?walkingLocation:null;
   if(!wl||(wl.id!=='neochinatown'&&!wl.mapSpace)||!wl.solids)return '<div class="pd-empty">No map is available for this place yet.<br>Maps exist for The Darknet District, NeoChinatown, the Corporate District and the Zen Zephyr Temple.</div>';
   const area=wl.area==='interior'?'interior':'street';
   // The city map (district-map.js): generated from the game's own layout, with zoom, pan, places and a waypoint. The older "explored areas" picture stays as the fallback.
   if(root.VoidDistrictMap?.mount)return '<div class="pd-note">'+(wl.mapSpace?(root.VoidAreaMap?.get(wl.mapSpace)?.name||'AREA').toUpperCase():area==='interior'?'THE DARKNET DISTRICT':'NEOCHINATOWN')+' · '+(wl.mapSpace?'area map · unexplored places are hidden':'city navigation')+'</div><div data-district-map></div>';
   return '<div class="pd-note">'+(area==='interior'?'THE DARKNET DISTRICT':'NEOCHINATOWN')+' · only places you have explored are shown.</div><canvas class="pd-map" width="800" height="560" data-map aria-label="Map of explored areas"></canvas><div data-places></div>';
  },
  camera(){return '<div class="pd-empty"><b>CAMERA</b><br>The viewfinder opens over the world.<br>Left mouse button takes a photo; photos are kept in the Gallery.</div>';},
  gallery(){return root.VoidGallery?root.VoidGallery.view(dev,stack[1]):'<div class="pd-empty"><b>GALLERY</b><br>The gallery is not available.</div>';},
  /* The App Store is empty until David adds apps (15 Nov 2026): the device's own details moved to MY V1 (the `device` app). */
  store(){
   const l=D.storeListing(dev),st=l.storage;
   const card=r=>{const on=r.status==='installed',room=st.availablePct>=r.storagePct;return '<article class="pd-card"><h3>'+icon(r.id)+' '+esc(r.title)+' <small>'+(on?'INSTALLED':r.status==='locked'?'NEEDS A NEWER DEVICE':'FREE')+'</small></h3><p>'+esc(r.note)+'</p><div class="pd-note">Uses '+r.storagePct+'% of storage · '+st.availablePct+'% available on this '+esc(st.model)+'</div><div class="pd-tabs" style="margin:6px 0 0">'
     +(on?'<button type="button" data-open-app="'+esc(r.id)+'">OPEN</button><button type="button" data-uninstall="'+esc(r.id)+'">UNINSTALL</button>':'<button type="button" data-install="'+esc(r.id)+'"'+(r.status==='locked'||!room?' disabled':'')+'>'+(room?'INSTALL':'NOT ENOUGH STORAGE')+'</button>')+'</div></article>';};
   const all=[...l.available,...l.installed];
   return all.length?'<h2>APPS</h2>'+all.map(card).join(''):'<div class="pd-empty">No apps available yet.</div>';
  },
  /* Comms: voice with the people near you (district-voice.js). Off until ENABLE is pressed; DISABLE disconnects. */
  comms(){
   const V=root.VoidVoice,r=rp();if(!V)return '<div class="pd-empty">Voice is not available in this build.</div>';
   const S=V.settings,st=V.status,on=S.enabled,ok=!!r?.connected&&!!r.features?.voice;
   const line=!on?'OFF':st==='on'?(S.muted?'ON · MICROPHONE MUTED':V.talking?'ON · MICROPHONE LIVE':S.mode==='ptt'?'ON · HOLD '+V.keyLabel(S.pttKey)+' TO TALK':'ON · OPEN MICROPHONE'):st==='connecting'?'CONNECTING…':st==='error'?'PROBLEM':'WAITING';
   const press=(k,v,label,cur)=>'<button type="button" data-voice-set="'+k+'" data-value="'+v+'" aria-pressed="'+(cur===v)+'">'+label+'</button>';
   const peers=(r?.connected?r.peers:[]),speaking=new Set(V.speaking);
   const who=peers.length?peers.map(p=>{const own=S.players[p.id]||{vol:1,muted:false},d=distanceTo(p);return '<article class="pd-card"><h3>'+esc(p.name)+(speaking.has(p.id)?' <small class="pd-speaking">SPEAKING</small>':'')+(d!=null?' <small>'+esc(distText(d).toUpperCase())+'</small>':'')+'</h3><div class="pd-voicerow"><label>VOLUME<input type="range" min="0" max="2" step="0.1" value="'+own.vol+'" data-voice-player="'+esc(p.id)+'" aria-label="Volume of '+esc(p.name)+'"></label>'
     +'<button type="button" data-voice-mute="'+esc(p.id)+'" aria-pressed="'+!!own.muted+'">'+(own.muted?'UNMUTE VOICE':'MUTE VOICE')+'</button><button type="button" data-ig="block" data-id="'+esc(p.id)+'" data-name="'+esc(p.name)+'">BLOCK</button><button type="button" data-rep-open="'+esc(p.id)+'">REPORT</button></div></article>';}).join(''):'<div class="pd-empty">'+(r?.connected?'Nobody else is in this place right now.':'Not connected to other players.')+'</div>';
   return '<section class="pd-storage"><div class="pd-stat"><span>VOICE</span><span>'+esc(line)+'</span></div>'
    +'<div class="pd-note" style="margin-top:6px">'+(on?(V.note?esc(V.note):'You hear the people in the same place as you, from where they stand. Walls muffle them.'):'Voice is off. Nothing is sent or heard until you enable it. Your microphone is asked for only then. Nothing is recorded.')+(!ok&&!on?' '+(r?.connected?'Voice needs an account secured with an email or Google, and a server that carries voice.':'You are not connected to other players right now.'):'')+'</div>'
    +'<div class="pd-tabs" style="margin:10px 0 0"><button type="button" data-voice="'+(on?'off':'on')+'" class="'+(on?'':'pd-hot')+'">'+(on?'DISABLE VOICE':'ENABLE VOICE')+'</button>'+(on?'<button type="button" data-voice-set="muted" data-value="'+(S.muted?'0':'1')+'" aria-pressed="'+S.muted+'">'+(S.muted?'UNMUTE MICROPHONE':'MUTE MICROPHONE')+'</button>':'')+'</div></section>'
    +'<h2>HOW YOU TALK</h2><div class="pd-tabs">'+press('mode','ptt','PUSH TO TALK',S.mode)+press('mode','open','OPEN MICROPHONE',S.mode)+'<button type="button" data-voice-key>'+(rebinding?'PRESS A KEY…':'TALK KEY: '+esc(V.keyLabel(S.pttKey))+' · CHANGE')+'</button></div>'
    +'<h2>SOUND</h2><div class="pd-voicerow"><label>VOICE VOLUME<input type="range" min="0" max="1.5" step="0.05" value="'+S.volume+'" data-voice-volume aria-label="Voice volume"></label></div>'
    +'<div class="pd-jobrow"><label class="pd-jobsel"><span>MICROPHONE</span><select data-voice-device="mic" aria-label="Microphone"><option value="">DEFAULT</option></select></label><label class="pd-jobsel"><span>SPEAKER</span><select data-voice-device="speaker" aria-label="Speaker"><option value="">DEFAULT</option></select></label></div>'
    +'<h2>PEOPLE IN THIS PLACE</h2>'+who
    +'<div class="pd-note" style="margin-top:8px">Private and group calls are not available yet. Voice is never recorded. Muting or blocking someone in Messages silences their voice too.</div>';
  },
  /* WarFlying (the optional app): switch the scanner on and off, see what is logged, send it to the leaderboard. Rules and scanning: warflying-scanner.js. */
  warflying(){
   const W=root.VoidWarFlying,X=root.VoidWarFlyingScanner,s=state_();if(!W||!X||!s?.warflying)return '<div class="pd-empty">WarFlying is not available right now.</div>';
   const sum=W.summary(s.warflying),on=X.installed,sh=X.shielded,link=X.link(),can=root.VoidComms.canUpload(link),busy_=!!X.transfer;
   const stateLine=!on?'INACTIVE':sh?'ACTIVE · SHIELDED HERE':'ACTIVE · SCANNING NEARBY FREQUENCIES';
   const board=X.leaderboard(),recent=X.recent();
   return '<section class="pd-storage"><div class="pd-stat"><span>WARFLYING</span><span>'+stateLine+'</span></div>'
    +(sh?'<div class="pd-note" style="margin-top:6px">The Darknet District interior is shielded from frequency scans. Nothing is heard in here; it will listen again outside.</div>':'')
    +'<div class="pd-tabs" style="margin:10px 0 0"><button type="button" data-wf="'+(on?'off':'on')+'" aria-pressed="'+on+'">'+(on?'DEACTIVATE':'ACTIVATE')+'</button></div></section>'
    +'<h2>LOGGED</h2><dl class="pd-kv"><dt>POINTS</dt><dd>'+sum.points+'</dd><dt>FREQUENCIES IDENTIFIED</dt><dd>'+sum.discoveries+'</dd><dt>WAITING TO SEND</dt><dd>'+sum.pending+'</dd></dl>'
    +'<div class="pd-tabs" style="margin:10px 0 0"><button type="button" class="'+(sum.pending?'pd-hot':'')+'" data-wf="send"'+(!sum.pending||!can||busy_?' disabled':'')+'>SEND DATA TO WARFLYING LEADERBOARD</button></div>'
    +'<div class="pd-note">'+(busy_?'Sending now…':!sum.pending?'Nothing waiting to send.':can?sum.pending+' logged '+(sum.pending===1?'frequency is':'frequencies are')+' ready to send.':'Cannot send from here ('+esc(root.VoidComms.labels[link.state]||'no link')+(link.reason==='premises'?': no uploads inside The Darknet District':'')+'). Your log is kept.')+'</div>'
    +'<h2>LEADERBOARD</h2>'+board.map(r=>'<div class="pd-line"><b>'+r.rank+'</b>'+esc(r.name)+(r.player?' (you)':'')+' · '+r.points+'</div>').join('')
    +'<h2>RECENT DISCOVERIES</h2>'+(recent.length?recent.map(r=>'<div class="pd-line">+1 · '+esc(r.text)+' · '+esc(r.place)+'</div>').join(''):'<div class="pd-empty">None yet. Activate the scanner and travel.</div>');
  },
  device(){
   const l=D.storeListing(dev),st=l.storage,row=(r,tag)=>'<div class="pd-sys">'+icon(r.id)+'<span>'+esc(r.title)+'</span><em>'+esc(tag)+'</em></div>';
   return '<h2>STORAGE</h2><section class="pd-storage" aria-label="Device storage"><div class="pd-stat"><span>STORAGE USED: '+st.usedPct+'%</span><span>STORAGE AVAILABLE: '+st.availablePct+'%</span></div>'
    +'<div class="pd-bar" role="img" aria-label="'+st.usedPct+' percent of storage used"><i style="width:'+st.usedPct+'%"></i></div>'
    +'<dl class="pd-kv"><dt>DEVICE MODEL</dt><dd>'+esc(st.model)+'</dd><dt>SYSTEM APPS</dt><dd>'+st.systemApps+'</dd><dt>ADDITIONAL APPS INSTALLED</dt><dd>'+st.optionalApps+'</dd></dl>'
    +'<div class="pd-note" style="margin-top:8px">The stock '+esc(st.model)+' ships with its system apps taking '+st.baselinePct+'% of storage. This is the model\'s defined baseline, not a measurement of your computer. Each optional app you install will add its own share.</div></section>'
    +'<h2>SYSTEM APPS</h2>'+l.system.map(r=>row(r,r.placeholder?'PREINSTALLED · COMING LATER':'PREINSTALLED')).join('')
    +'<h2>INSTALLED APPS</h2>'+(l.installed.length?l.installed.map(r=>row(r,'INSTALLED')).join(''):'<div class="pd-empty">No additional apps installed.</div>');
  },
  settings(){
   const S=dev.settings,def=D.DEVICES[dev.model],st=D.storage(dev),opt=(k,v,label)=>'<button type="button" data-set="'+k+'" data-value="'+v+'" aria-pressed="'+(S[k]===v)+'">'+label+'</button>';
   return '<h2>INTERFACE</h2><div class="pd-note">Animation</div><div class="pd-tabs">'+opt('motion','auto','FOLLOW SYSTEM')+opt('motion','full','FULL')+opt('motion','reduced','REDUCED')+'</div>'
    +'<div class="pd-note">Scanlines</div><div class="pd-tabs">'+opt('scan','1','ON')+opt('scan','0','OFF')+'</div><div class="pd-note">Opens at</div><div class="pd-tabs">'+opt('size','half','HALF SCREEN')+opt('size','expanded','EXPANDED')+'</div>'
    +'<h2>DEVICE INFORMATION</h2><div class="pd-card"><h3>'+esc(def.name)+'</h3><div class="pd-note">'+esc(def.tagline)+' · generation '+def.generation+'</div>'
    +'<dl class="pd-kv"><dt>MODEL</dt><dd>'+esc(st.model)+'</dd><dt>SYSTEM APPS</dt><dd>'+st.systemApps+'</dd><dt>STOCK STORAGE USAGE</dt><dd>'+st.baselinePct+'%</dd><dt>AVAILABLE STORAGE</dt><dd>'+(100-st.baselinePct)+'% before optional installations</dd>'
    +'<dt>ADDITIONAL APPS INSTALLED</dt><dd>'+st.optionalApps+'</dd></dl></div>'
    +'<div class="pd-note" style="margin-top:8px">These settings change only this device. Game settings (graphics, controls, audio) stay in the main menu.</div>';
  }
 };

 // ---- Shell ----
 function build(){
  el=document.createElement('section');el.id='personal-device';el.setAttribute('role','dialog');el.setAttribute('aria-label','V1 personal device');
  el.innerHTML='<div class="pd-head"><span class="pd-brand">V1</span><span class="pd-tag"></span><button type="button" data-do="expand" aria-label="Expand device"></button><button type="button" data-do="close" aria-label="Close device">CLOSE · L</button></div>'
   +'<div class="pd-nav"><button type="button" data-do="back" aria-label="Back">◀ BACK</button><span class="pd-title"></span></div><div class="pd-load"><i></i></div><div class="pd-main" tabindex="-1"></div>';
  document.body.appendChild(el);body=el.querySelector('.pd-main');
  el.addEventListener('click',onClick);
  el.addEventListener('input',e=>{const t=e.target,V=root.VoidVoice;if(!V)return;if(t.matches?.('input[data-voice-volume]'))V.set('volume',t.value);else if(t.matches?.('input[data-voice-player]'))V.setPlayer(t.dataset.voicePlayer,{vol:t.value});});
  el.addEventListener('change',e=>{const t=e.target;if(t.matches?.('select[data-ach-sort]')){const k=t.dataset.achSort,v=achView.get(k)||{open:true,sort:'featured'};achView.set(k,{...v,sort:t.value});render();return;}if(t.matches?.('select[data-voice-device]')){root.VoidVoice?.set(t.dataset.voiceDevice,t.value);return;}if(!t.matches?.('select[data-jobsel]'))return;const P=DP(),f=flags_();if(!P||!f)return;const picks=[...body.querySelectorAll('select[data-jobsel]')].map(x=>x.value).filter(Boolean);P.writeJobs(f,picks);try{if(typeof save==='function')save();}catch{}render({keepScroll:true});});
  el.addEventListener('submit',e=>{const ab=e.target.closest('[data-aboutform]');if(ab){e.preventDefault();const fl=flags_();if(fl){const v=cleanAbout(ab.querySelector('input').value);if(v)fl.profileAbout=v;else delete fl.profileAbout;try{if(typeof save==='function')save();}catch{}render({keepScroll:true});}return;}
   const f=e.target.closest('[data-chatform]');if(!f)return;e.preventDefault();const i=f.querySelector('input'),t=i.value.trim();if(!t)return;const res=chat()?.submit(t)||{ok:false,text:'Chat is not available.'};
   if(res.ok){i.value='';if(res.players)go(['messages','players'],'tab','LOADING');}else{const h=body.querySelector('[data-chathint]');if(h)h.textContent=res.text||'';}});
  el.addEventListener('keydown',e=>{if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))e.stopPropagation();});   // typing stays in the box: no movement, no shortcuts
  chip=document.createElement('button');chip.id='pd-chip';chip.type='button';chip.textContent='V1 · L';updateBadges();chip.setAttribute('aria-label','Open the V1 device');chip.addEventListener('click',()=>toggle());document.body.appendChild(chip);
 }
 function loadingBar(ms){const bar=el.querySelector('.pd-load');if(!ms)return;bar.style.setProperty('--pd-ms',ms+'ms');bar.classList.remove('on');void bar.offsetWidth;bar.classList.add('on');clearTimeout(loadTimer);loadTimer=setTimeout(()=>bar.classList.remove('on'),ms+40);}
 const label=()=>stack[0]?D.appTitle(stack[0],dev):'HOME';
 function chrome(){   // header, title and back button: these change at once, only the content waits
  const def=D.DEVICES[dev.model],app=stack[0];
  el.querySelector('.pd-brand').textContent=def.name.split(' ')[0];el.querySelector('.pd-tag').textContent=def.tagline;el.classList.toggle('expanded',expanded);el.classList.toggle('fx',dev.settings.scan==='1'&&!reduced());el.classList.toggle('pd-still',reduced());
  el.querySelector('[data-do=expand]').textContent=expanded?'COLLAPSE':'EXPAND';el.querySelector('[data-do=expand]').setAttribute('aria-label',expanded?'Collapse device':'Expand device');
  el.querySelector('[data-do=back]').hidden=!app;el.querySelector('.pd-title').textContent=label();
 }
 /* News filters (David, 15 Nov 2026): ALL, BROADCASTS (what was heard on the Relay), COMMERCE (the adverts), PEOPLE (pictures posted by residents and by you). */
 const NEWS_FILTERS=[['all','ALL'],['broadcasts','BROADCASTS'],['commerce','COMMERCE'],['people','PEOPLE']];let newsFilter='all';
 const newsOld=()=>APP_VIEW.newsOld_();
 setTimeout(()=>{try{root.VoidGallery?.onChange(()=>{if(open&&!busy&&stack[0]==='gallery')render({keepScroll:true});});}catch{}},0);
 function newsView(old){
  const bar='<div class="pd-newsfilter" role="group" aria-label="Show">'+NEWS_FILTERS.map(([k,l])=>'<button type="button" data-news-filter="'+k+'" aria-pressed="'+(newsFilter===k)+'">'+l+'</button>').join('')+'</div>';
  let people='';try{const h=root.VoidAccount?.handle;people=root.VoidGallery?.peopleHtml(typeof h==='string'&&h?h:'You',id=>DP()?.npc(id)?.name)||'';}catch{}
  const tpl=document.createElement('template');tpl.innerHTML=old;const ads=[...tpl.content.querySelectorAll('.pd-ad')],hasReports=!!tpl.content.querySelector('.relay-archive article,.relay-archive details');
  if(newsFilter==='people')return bar+(people||'<div class="pd-empty">Nobody has posted a picture yet.</div>');
  if(newsFilter==='commerce')return bar+(ads.length?ads.map(a=>a.outerHTML).join(''):'<div class="pd-empty">No adverts right now.</div>');
  if(newsFilter==='broadcasts'){for(const a of ads)a.remove();for(const h of tpl.content.querySelectorAll('h2'))if(/SPONSORED/.test(h.textContent))h.remove();return bar+(hasReports?tpl.innerHTML:'<div class="pd-empty">No news received yet.<br>Reports appear here after you hear them on the Relay.</div>');}
  return bar+(people?'<h2>PEOPLE</h2>'+people:'')+old;
 }
 function render(opts={}){
  if(!el||!open||busy)return;   // while a transition card is showing nothing else redraws the screen
  const app=stack[0],def=D.DEVICES[dev.model];chrome();syncViewing();
  const top=body.scrollTop;
  if(!app){const st=D.storage(dev);body.innerHTML='<div class="pd-home"><div class="pd-grid">'+dev.apps.filter(id=>D.APPS[id]).map((id,i)=>{const a=D.APPS[id],off=a.state==='placeholder';return '<button type="button" class="pd-app'+(off?' off':'')+'" data-app="'+id+'" style="--i:'+i+'" aria-label="'+esc(D.appTitle(id,dev))+(off?' (not available yet)':'')+'">'+FRAME+'<span class="pd-index" aria-hidden="true">'+String(i+1).padStart(2,'0')+'</span>'+(id==='messages'?'<span class="pd-badge" hidden></span>':'')+icon(id)+'<span class="pd-name">'+esc(D.appTitle(id,dev))+'</span><span class="pd-sub">'+(off?'COMING LATER':'')+'</span></button>';}).join('')+'</div><div class="pd-home-foot"><div class="pd-storage pd-mini" aria-label="Device storage"><div class="pd-stat"><span>STORAGE USED: '+st.usedPct+'%</span><span>AVAILABLE: '+st.availablePct+'%</span></div><div class="pd-bar"><i style="width:'+st.usedPct+'%"></i></div></div><div class="pd-foot">'+esc(def.tagline)+'</div></div></div>';}
  else{try{body.innerHTML=APP_VIEW[app]();}catch(e){body.innerHTML='<div class="pd-empty">This app could not be shown.</div>';}}
  body.scrollTop=opts.keepScroll?top:0;
  hydratePortraits();if(app==='map')drawMap();if(app==='comms')fillVoiceDevices();
  if(app==='messages'&&(stack[1]||'chat')==='chat'){const log=body.querySelector('[data-chatlog]');if(log)log.scrollTop=log.scrollHeight;if(wantFocus){wantFocus=false;const i=body.querySelector('[data-chatform] input:not([disabled])');if(i)setTimeout(()=>i.focus(),0);}}
  updateBadges();
 }
 /* Moves to another screen. The new screen's title shows at once; its content appears after the model's transition delay (a loading card, driven by a timer: nothing blocks).
    Only the LATEST request counts: clicking again, going back or closing cancels the one in flight, so transitions never pile up. */
 function go(next,kind,text){if(next[0]==='camera'&&root.VoidDeviceCamera){setOpen(false);if(!root.VoidDeviceCamera.start(dev))try{announce('The camera works while you are on foot.');}catch{}return;}   /* the camera is a viewfinder over the world, not a page in the panel */
 if(next[0]==='news'&&stack[0]!=='news')feedSeed=(Date.now()^(Math.random()*1e9))>>>0;
  stack=next;const seq=++navSeq,ms=D.delayMs(dev,kind,reduced());clearTimeout(navTimer);busy=false;
  if(!el||!open){syncViewing();return;}
  if(!ms){render();return;}
  chrome();busy=true;syncViewing();loadingBar(ms);
  body.innerHTML='<div class="pd-boot" role="status"><b>'+esc(text||'OPENING '+label())+'</b><small>'+esc(D.DEVICES[dev.model].tagline)+'</small><div class="pd-boot-bar" style="--pd-ms:'+ms+'ms"><i></i></div></div>';
  navTimer=setTimeout(()=>{if(seq!==navSeq)return;busy=false;if(open)render();},ms);
 }
 function onClick(e){
  {const more=e.target.closest?.('[data-ach-more]');if(more){const k=more.dataset.achMore,v=achView.get(k)||{open:false,sort:'featured'};achView.set(k,{...v,open:!v.open});render();return;}}
  const t=e.target.closest('button');if(!t)return;
  if(t.dataset.newsFilter){newsFilter=t.dataset.newsFilter;render();return;}
  if(t.dataset.photo){go(['gallery',t.dataset.photo],'tab','OPENING PHOTO');return;}
  if(t.dataset.photoDel){if(t.dataset.sure!=='1'){t.dataset.sure='1';t.textContent='DELETE THIS PHOTO? PRESS AGAIN';return;}root.VoidGallery?.remove(t.dataset.photoDel).then(()=>{if(open&&stack[0]==='gallery'){stack=['gallery'];render();}});return;}
  if(t.dataset.photoPost){root.VoidGallery?.post(t.dataset.photoPost,t.dataset.on==='1').then(()=>{if(open&&stack[0]==='gallery')render({keepScroll:true});});return;}
  if(t.dataset.app){if(busy)return;if(!reduced()){t.classList.add('launching');t.style.setProperty('--pd-ms',D.delayMs(dev,'open',false)+'ms');}go([t.dataset.app],'open');return;}
  if(t.dataset.do==='close')return setOpen(false);
  if(t.dataset.do==='back')return back();
  if(t.dataset.do==='expand'){expanded=!expanded;render({keepScroll:true});if(busy)chrome();return;}
  if(t.dataset.sub){if(t.getAttribute('aria-pressed')==='true')return;go([stack[0],t.dataset.sub],'tab','LOADING');return;}
  if(t.dataset.ig){const r=rp();if(r){r.setIgnore(t.dataset.id,t.dataset.ig==='mute'?'mute':t.dataset.ig==='block'?'block':null,t.dataset.name);}render({keepScroll:true});return;}
  if(t.dataset.repOpen){reporting=reporting===t.dataset.repOpen?'':t.dataset.repOpen;chat()?.clearNote();render({keepScroll:true});return;}
  if(t.dataset.repSend){const box=t.closest('.pd-report'),ok=rp()?.report(t.dataset.repSend,box.querySelector('select').value,box.querySelector('input').value);reporting='';render({keepScroll:true});if(!ok){const n=document.createElement('div');n.className='pd-card';n.setAttribute('role','status');n.textContent='Could not send the report right now.';body.prepend(n);}return;}
  if(t.dataset.openProfile){go(['social',t.dataset.openProfile],'tab','LOADING PROFILE');return;}
  if(t.dataset.voice){const V=root.VoidVoice;if(V){(t.dataset.voice==='on'?V.enable():V.disable()).finally?.(()=>{if(open&&stack[0]==='comms')render({keepScroll:true});});}render({keepScroll:true});return;}
  if(t.dataset.voiceSet){root.VoidVoice?.set(t.dataset.voiceSet,t.dataset.voiceSet==='muted'?t.dataset.value==='1':t.dataset.value);render({keepScroll:true});return;}
  if(t.dataset.voiceKey!==undefined){rebinding=true;render({keepScroll:true});const grab=ev=>{ev.preventDefault();ev.stopImmediatePropagation();removeEventListener('keydown',grab,true);rebinding=false;if(ev.code!=='Escape')root.VoidVoice?.set('pttKey',ev.code);if(open&&stack[0]==='comms')render({keepScroll:true});};addEventListener('keydown',grab,true);return;}
  if(t.dataset.voiceMute){const V=root.VoidVoice,id=t.dataset.voiceMute;if(V)V.setPlayer(id,{muted:!(V.settings.players[id]?.muted)});render({keepScroll:true});return;}
  if(t.dataset.install||t.dataset.uninstall){const id=t.dataset.install||t.dataset.uninstall,apps=t.dataset.install?D.install(dev,id):D.uninstall(dev,id);if(apps){dev.apps=apps;if(t.dataset.uninstall&&id==='warflying')root.VoidWarFlyingScanner?.setActive(false);commit();}render({keepScroll:true});return;}
  if(t.dataset.openApp){go([t.dataset.openApp],'open');return;}
  if(t.dataset.wf){const X=root.VoidWarFlyingScanner;if(X){if(t.dataset.wf==='send')X.upload(true);else X.setActive(t.dataset.wf==='on');}render({keepScroll:true});setTimeout(()=>{if(open&&stack[0]==='warflying')render({keepScroll:true});},1500);return;}
  if(t.dataset.follow){const P=DP(),f=flags_();if(P&&f){const [kind,id]=t.dataset.follow.split(':');P.toggleFollow(f,kind==='n'?{kind:'npc',id}:{kind:'player',id,name:t.dataset.name});try{if(typeof save==='function')save();}catch{}render({keepScroll:true});}return;}
  if(t.dataset.track||t.dataset.untrack){const s=state_(),V=root.VoidMissions;try{if(t.dataset.track)V.track(s,t.dataset.track,C);else V.untrack(s);if(typeof save==='function')save();}catch{}render({keepScroll:true});return;}
  if(t.dataset.set){dev.settings[t.dataset.set]=t.dataset.value;if(t.dataset.set==='size')expanded=t.dataset.value==='expanded';commit();render({keepScroll:true});return;}
  if(t.dataset.act==='block'||t.dataset.act==='report'){
   const pk=String(t.dataset.profile||'').replace(/^player:/,''),r=rp();if(!r)return;const peer=r.peers.find(p=>p.id===pk);
   if(t.dataset.act==='block'&&peer){r.setIgnore(pk,'block',peer.name);go(['social'],'tab','LOADING');return;}
   if(t.dataset.act==='report'){const box=body.querySelector('[data-report]');if(box&&!box.firstChild){box.innerHTML='<select aria-label="Reason"><option value="harassment">HARASSMENT</option><option value="spam">SPAM</option><option value="inappropriate">INAPPROPRIATE</option><option value="cheating">CHEATING</option><option value="other">OTHER</option></select> <button type="button" data-send-report="'+esc(pk)+'">SEND REPORT</button>';}return;}
  }
  if(t.dataset.sendReport){const sel=body.querySelector('[data-report] select');rp()?.report(t.dataset.sendReport,sel?.value||'other','');const box=body.querySelector('[data-report]');if(box)box.textContent='Report sent. Thank you.';}
 }
 // Comms: the device lists are asked from the browser after the screen is drawn (names appear once the microphone has been allowed).
 function fillVoiceDevices(){const V=root.VoidVoice;if(!V||!body)return;V.devices().then(d=>{for(const [kind,list] of [['mic',d.mics],['speaker',d.speakers]]){const sel=body.querySelector('select[data-voice-device='+kind+']');if(!sel||!sel.isConnected)continue;for(const x of list){if(!x.id||x.id==='default')continue;const o=document.createElement('option');o.value=x.id;o.textContent=x.label.slice(0,60);sel.appendChild(o);}sel.value=V.settings[kind]||'';}}).catch(()=>{});}
 function back(){if(stack.length>1&&stack[0]!=='messages'){go(stack.slice(0,-1),'tab','LOADING');return true;}   // tabs inside Messages are not history: Back goes home
  if(stack.length){go([],'home','RETURNING HOME');return true;}setOpen(false);return false;}

 // ---- Map drawing: only explored walls and places, in the District's own orientation (door at the top, deeper = lower) ----
 function drawMap(){
  const city=body.querySelector('[data-district-map]');if(city){if(city.firstChild)root.VoidDistrictMap.refresh();else root.VoidDistrictMap.mount(city);return;}
  const cv=body.querySelector('canvas[data-map]'),wl=typeof walkingLocation!=='undefined'?walkingLocation:null;if(!cv||!wl||typeof walker==='undefined'||!walker)return;
  const area=wl.area==='interior'?'interior':'street',N=root.VoidNeoChinatown,to=(x,z)=>N?.toWorld?N.toWorld(x,z):[x,z];   // half turn: maps world to the district frame and back
  const layout={solids:wl.solids||[],interactions:wl.interactions||[],spawn:wl.spawn||null},ext=D.extent(layout);if(!ext)return;
  const vis=D.visible(dev.map[area],layout),ctx=cv.getContext('2d'),W=cv.width,H=cv.height;
  // district frame bounds from the real extent corners
  const corners=[[ext.x0,ext.z0],[ext.x1,ext.z0],[ext.x0,ext.z1],[ext.x1,ext.z1]].map(c=>to(c[0],c[1])),lx0=Math.min(...corners.map(c=>c[0])),lx1=Math.max(...corners.map(c=>c[0])),lz0=Math.min(...corners.map(c=>c[1])),lz1=Math.max(...corners.map(c=>c[1]));
  const k=Math.min(W/(lx1-lx0),H/(lz1-lz0)),ox=(W-(lx1-lx0)*k)/2,oz=(H-(lz1-lz0)*k)/2,P=(wx,wz)=>{const l=to(wx,wz);return [ox+(l[0]-lx0)*k,oz+(l[1]-lz0)*k];};
  ctx.fillStyle='#03080d';ctx.fillRect(0,0,W,H);ctx.strokeStyle='rgba(88,255,225,.08)';ctx.lineWidth=1;
  for(let x=Math.ceil(lx0/10)*10;x<lx1;x+=10){const a=ox+(x-lx0)*k;ctx.beginPath();ctx.moveTo(a,0);ctx.lineTo(a,H);ctx.stroke();}for(let z=Math.ceil(lz0/10)*10;z<lz1;z+=10){const a=oz+(z-lz0)*k;ctx.beginPath();ctx.moveTo(0,a);ctx.lineTo(W,a);ctx.stroke();}
  ctx.fillStyle='rgba(56,232,255,.28)';ctx.strokeStyle='rgba(88,255,225,.8)';
  for(const s of vis.solids){const a=P(s.x-s.w/2,s.z-s.d/2),b=P(s.x+s.w/2,s.z+s.d/2),x=Math.min(a[0],b[0]),y=Math.min(a[1],b[1]),w=Math.max(2,Math.abs(a[0]-b[0])),h=Math.max(2,Math.abs(a[1]-b[1]));ctx.fillRect(x,y,w,h);ctx.strokeRect(x,y,w,h);}
  ctx.font='bold 13px monospace';
  for(const p of vis.places){const q=P(p.x,p.z);ctx.fillStyle='#ff3fb4';ctx.beginPath();ctx.arc(q[0],q[1],5,0,7);ctx.fill();}
  const me=P(walker.x,walker.z),fx=-Math.sin(walker.yaw),fz=-Math.cos(walker.yaw);   // facing, in the district frame
  ctx.fillStyle='#58ffe1';ctx.beginPath();ctx.moveTo(me[0]+fx*14,me[1]+fz*14);ctx.lineTo(me[0]-fz*7-fx*6,me[1]+fx*7-fz*6);ctx.lineTo(me[0]+fz*7-fx*6,me[1]-fx*7-fz*6);ctx.closePath();ctx.fill();
  const list=body.querySelector('[data-places]');if(list)list.innerHTML='<h2>PLACES YOU HAVE FOUND</h2>'+(vis.places.length?vis.places.map(p=>'<div class="pd-line">'+esc(String(p.label||p.id).toLowerCase().replace(/^./,c=>c.toUpperCase()))+'</div>').join(''):'<div class="pd-note">None yet. Walk around to explore.</div>');
 }
 function exploreTick(){
  const wl=typeof walkingLocation!=='undefined'?walkingLocation:null;if(!wl||wl.id!=='neochinatown'||typeof walker==='undefined'||!walker||!(typeof mode!=='undefined'&&mode==='walking'))return;
  const s=state_();if(!s?.story?.flags)return;if(!dev.loaded){dev=D.restore(s.story.flags);dev.loaded=true;}
  const area=wl.area==='interior'?'interior':'street',ext=D.extent({solids:wl.solids||[],interactions:wl.interactions||[],spawn:wl.spawn||null});if(!ext)return;
  const next=D.explore(dev.map[area],ext,walker.x,walker.z);
  if(next!==dev.map[area]){dev.map[area]=next;D.write(s.story.flags,dev);}   // stored in the save in memory now; written to disk by the game's normal saving
 }

 // ---- Open, close, keys ----
 function setOpen(v){
  if(v===open)return;
  if(v){
   if(!onFootOrDock())return false;
   if(!el)build();const s=state_();dev=D.restore(s?.story?.flags||{});dev.loaded=true;
   expanded=dev.settings.size==='expanded';stack=[];open=true;busy=false;clearTimeout(navTimer);navSeq++;
   walkingKeys?.clear?.();try{clearInput?.();}catch{}for(const c of held)if(MOVE.has(c))suppressed.add(c);   // keys already held do nothing until released and pressed again
   document.exitPointerLock?.();el.dataset.device=dev.model;el.classList.add('open');el.classList.toggle('anim',!reduced());chip.classList.remove('on');
   if(pending){const q=pending;pending=null;booted=true;go(q.sub?[q.app,q.sub]:[q.app],'open');}
   else if(!booted){booted=true;go([],'startup','V1 STARTING');}else render();   // the first opening after the page loads shows a short start-up card
   setTimeout(()=>{if(!el.querySelector('input:focus'))el.querySelector('.pd-main')?.focus({preventScroll:true});},0);
  }else{
   open=false;busy=false;clearTimeout(navTimer);navSeq++;syncViewing();el.classList.remove('open');commit();walkingKeys?.clear?.();for(const c of held)if(MOVE.has(c))suppressed.add(c);
   try{canvas?.focus?.();}catch{}
  }
  return true;
 }
 const toggle=()=>setOpen(!open);
 /* Opens the V1 straight onto an app (and a tab inside it): Enter in the District uses this for the chat, the multiplayer status chip uses it for the Players list. */
 function openApp(app,sub,opts={}){
  if(!D.APPS[app]||D.APPS[app].state!=='ready'||!onFootOrDock())return false;
  wantFocus=!!opts.focus;
  if(!open){pending={app,sub:sub||null};return setOpen(true)!==false;}
  go(sub?[app,sub]:[app],'open');return true;
 }
 addEventListener('keydown',e=>{
  held.add(e.code);
  const code=e.code,typing=/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName||'');
  if(!open){
   if(suppressed.has(code)){e.stopImmediatePropagation();return;}   // a key held across the device: ignored until released
   return;
  }
  if(code==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(typing&&e.target.value){e.target.value='';return;}back();return;}
  if(code===(root.VoidInput?.bindings?.missionLog||'KeyL')&&!typing&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)setOpen(false);return;}
  if(typing)return;   // the input's own handler keeps the key inside the box
  if(MOVE.has(code))suppressed.add(code);
  if(code!=='Tab')e.stopImmediatePropagation();   // the game never sees the key (a button still activates: its default action is not cancelled)
 },true);
 addEventListener('keyup',e=>{held.delete(e.code);suppressed.delete(e.code);},true);
 addEventListener('blur',()=>{held.clear();suppressed.clear();});

 // Gamepad / virtual stick movement is held while the device is open
 try{const ax=root.VoidInput?.axes;if(ax)for(const k of ['moveX','moveZ']){let v=ax[k]||0;Object.defineProperty(ax,k,{configurable:true,enumerable:true,get(){return open?0:v;},set(n){v=n;}});}}catch{}

 function frame(){
  if(!el&&onFootOrDock()&&typeof state!=='undefined'&&state?.story)build();
  if(!el)return;
  if(open&&!onFootOrDock())setOpen(false);   // a conversation, the pod card or a menu took over
  const show=!open&&typeof mode!=='undefined'&&mode==='walking'&&!root.VoidCharacterCreator?.isOpen;chip.classList.toggle('on',show);
  if(open&&stack[0]==='map')drawMap();
 }
 setInterval(frame,500);mapTimer=setInterval(exploreTick,1000);
 root.VoidVoice?.onChange?.(()=>{if(open&&!busy&&stack[0]==='comms'&&!rebinding&&!body.querySelector('input:active,select:focus'))render({keepScroll:true});});
 // The Players list follows who comes and goes while it is on screen (only when it really changed and nothing is being typed)
 setInterval(()=>{if(!open||busy||stack[0]!=='messages'||stack[1]!=='players'||body.querySelector('input:focus,select:focus'))return;if(playersSigNow()!==playersSig)render({keepScroll:true});},1500);

 // Esc is also the game's Pause key and the controls layer hears it first: while the device is open, Pause (and losing focus) must not open the game menu.
 if(typeof openGameMenu==='function'){const gameMenu=openGameMenu;openGameMenu=function(){if(open)return;return gameMenu.apply(this,arguments);};}
 // The L key now opens the V1 on foot and in stations; in flight the older Mission Log keeps working unchanged.
 if(typeof openMissionLog==='function'){const legacy=openMissionLog;openMissionLog=function(){if(open||onFootOrDock()){toggle();return;}return legacy.apply(this,arguments);};}
 try{chat()?.onChange(onChatChange);}catch{}
 root.VoidPersonalDevice={get isOpen(){return open;},get expanded(){return expanded;},open:()=>setOpen(true),close:()=>setOpen(false),toggle,get app(){return stack[0]||null;},get sub(){return stack[1]||null;},openApp,get busy(){return busy;},get suppressed(){return [...suppressed];},get device(){return dev;},APP_VIEW};
})(globalThis);
