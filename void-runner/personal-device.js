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
  store:'<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>',settings:'<path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h11M19 17h1"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="17" r="2"/>'};
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
 function profileCard(p,opts={}){
  return '<article class="pd-card"><div class="pd-prof">'+portraitHtml(p)+'<div style="flex:1;min-width:150px"><h3>'+esc(p.name)+'</h3>'+(p.subtitle?'<div class="pd-note">'+esc(p.subtitle)+'</div>':'')+'<p>'+esc(p.bio)+'</p>'
   +(p.facts.length?'<ul>'+p.facts.map(f=>'<li>'+esc(f)+'</li>').join('')+'</ul>':'')+(p.places.length?'<div class="pd-note">Last known: '+p.places.map(esc).join(' · ')+'</div>':'')
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
  const A=root.VoidCharacterCreator?.stored?.()||null,h=root.VoidAccount?.handle;   // no saved look: the portrait says unavailable, never a guess
  const mine=D.profile('player',{handle:typeof h==='string'?h:null,publicId:rp()?.me||'',appearance:A,bio:'This is you.'});
  try{mine.facts=(root.VoidLocalProgress?.profileLines()||[]).slice(0,12);}catch{}   // progress counted in this browser (local-progress.js): your own profile only; achievements proper need server records
  return mine;
 }
 function npcContacts(){
  const H=root.VoidHudData,s=state_();if(!H||!s)return [];
  return H.contacts(s).map(c=>D.profile('npc',{id:c.id,name:c.name,bio:c.place,place:c.place,here:c.here,learned:[c.channel],model:(D.NPC_MODELS||{})[c.id]||null}));
 }
 function nearbyPlayers(){
  const r=rp();if(!r?.connected)return [];
  return r.peers.map(p=>D.profile('player',{handle:p.name,publicId:p.id,appearance:p.appearance||null,bio:'In the District right now.'},{canBlock:true,canReport:true}));
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
 const REASONS=[['harassment','HARASSMENT'],['spam','SPAM'],['inappropriate','INAPPROPRIATE'],['cheating','CHEATING'],['other','OTHER']];
 function playerRows(){
  const r=rp(),rows=(r?.connected?r.peers:[]).map(p=>({id:p.id,name:p.name,here:true}));
  for(const [id,,name] of (r?.ignored||[]))if(!rows.some(x=>x.id===id))rows.push({id,name,here:false});   // a blocked player's character is hidden, so they stay listed to be unblocked
  return rows;
 }
 const playersSigNow=()=>playerRows().map(x=>x.id+x.name).join('|')+JSON.stringify(rp()?.ignored||[]);
 function playersHtml(){
  const r=rp(),ign=new Map((r?.ignored||[]).map(([id,m,name])=>[id,{m,name}])),rows=playerRows();playersSig=playersSigNow();
  const note=chat()?.note;
  const list=rows.length?rows.map(p=>{const m=ign.get(p.id)?.m;return '<article class="pd-card"><h3>'+esc(p.name)+(m?' <small>['+m.toUpperCase()+']</small>':'')+(p.here?'':' <small>(not in view)</small>')+'</h3><div class="pd-tabs">'
    +'<button type="button" data-ig="'+(m==='mute'?'unmute':'mute')+'" data-id="'+esc(p.id)+'" data-name="'+esc(p.name)+'">'+(m==='mute'?'UNMUTE':'MUTE')+'</button>'
    +'<button type="button" data-ig="'+(m==='block'?'unblock':'block')+'" data-id="'+esc(p.id)+'" data-name="'+esc(p.name)+'">'+(m==='block'?'UNBLOCK':'BLOCK')+'</button>'
    +(p.here?'<button type="button" data-rep-open="'+esc(p.id)+'">REPORT</button>':'')+'</div>'
    +(reporting===p.id?'<div class="pd-report"><select aria-label="Reason">'+REASONS.map(([v,l])=>'<option value="'+v+'">'+l+'</option>').join('')+'</select><input type="text" maxlength="120" aria-label="Report note" placeholder="What happened? (optional)"><button type="button" data-rep-send="'+esc(p.id)+'">SEND REPORT</button></div>':'')+'</article>';}).join(''):'<div class="pd-empty">'+(r?.connected?'Nobody else is here right now.':'Not connected to the District server.')+'</div>';
  return '<div class="pd-note">Mute hides a player\'s chat. Block also hides their character. Both are kept on this device. You can also type /mute NAME or /block NAME in the chat.</div>'
   +(note?'<div class="pd-card" role="status">'+esc(note)+'</div>':'')+list
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
   if(sel){const all=[myProfile(),...npcContacts(),...nearbyPlayers()],p=all.find(x=>x.key===sel);if(p)return profileCard(p,{extra:p.kind==='player'&&p.key!==myProfile().key?'<div data-report></div>':''});}
   const me=myProfile(),npcs=npcContacts(),pl=nearbyPlayers();
   const row=p=>'<article class="pd-card"><div class="pd-prof">'+portraitHtml(p)+'<div style="flex:1"><h3>'+esc(p.name)+'</h3><div class="pd-note">'+esc(p.subtitle||p.bio)+'</div><button type="button" data-open-profile="'+esc(p.key)+'">PROFILE</button></div></div></article>';
   return '<h2>YOU</h2>'+row(me)+'<h2>PEOPLE YOU KNOW</h2>'+(npcs.length?npcs.map(row).join(''):'<div class="pd-empty">Nobody yet. People you meet appear here.</div>')
    +'<h2>IN THE DISTRICT NOW</h2>'+(pl.length?pl.map(row).join(''):'<div class="pd-empty">'+(rp()?.connected?'No other players nearby.':'Not connected to the District server.')+'</div>')
    +'<div class="pd-note" style="margin-top:10px">Friends and player discovery are not available yet.</div>';
  },
  news(){
   const R=root.VoidRelayRadio;let html='';try{html=R?.archiveSection?.()||'';}catch{}
   return html?'<div class="pd-note">From THE RELAY. Only what you have actually heard is listed.</div>'+html:'<div class="pd-empty">No news received yet.<br>Reports appear here after you hear them on the Relay.</div>';
  },
  map(){
   const wl=typeof walkingLocation!=='undefined'?walkingLocation:null;
   if(!wl||wl.id!=='neochinatown'||!wl.solids)return '<div class="pd-empty">No map is available for this place yet.<br>Maps exist for The Darknet District and NeoChinatown.</div>';
   const area=wl.area==='interior'?'interior':'street';
   // The city map (district-map.js): generated from the game's own layout, with zoom, pan, places and a waypoint. The older "explored areas" picture stays as the fallback.
   if(root.VoidDistrictMap?.mount)return '<div class="pd-note">'+(area==='interior'?'THE DARKNET DISTRICT':'NEOCHINATOWN')+' · city navigation</div><div data-district-map></div>';
   return '<div class="pd-note">'+(area==='interior'?'THE DARKNET DISTRICT':'NEOCHINATOWN')+' · only places you have explored are shown.</div><canvas class="pd-map" width="800" height="560" data-map aria-label="Map of explored areas"></canvas><div data-places></div>';
  },
  camera(){return '<div class="pd-empty"><b>CAMERA</b><br>Not available in the V1 model yet.<br>Nothing is captured, stored or sent.</div>';},
  gallery(){return '<div class="pd-empty"><b>GALLERY</b><br>No photos. Photos will be kept here once the camera exists.</div>';},
  store(){
   const l=D.storeListing(dev),st=l.storage,row=(r,tag)=>'<div class="pd-sys">'+icon(r.id)+'<span>'+esc(r.title)+'</span><em>'+esc(tag)+'</em></div>';
   return '<h2>STORAGE</h2><section class="pd-storage" aria-label="Device storage"><div class="pd-stat"><span>STORAGE USED: '+st.usedPct+'%</span><span>STORAGE AVAILABLE: '+st.availablePct+'%</span></div>'
    +'<div class="pd-bar" role="img" aria-label="'+st.usedPct+' percent of storage used"><i style="width:'+st.usedPct+'%"></i></div>'
    +'<dl class="pd-kv"><dt>DEVICE MODEL</dt><dd>'+esc(st.model)+'</dd><dt>SYSTEM APPS</dt><dd>'+st.systemApps+'</dd><dt>ADDITIONAL APPS INSTALLED</dt><dd>'+st.optionalApps+'</dd></dl>'
    +'<div class="pd-note" style="margin-top:8px">The stock V1 ships with its system apps taking '+st.baselinePct+'% of storage. This is the model\'s defined baseline, not a measurement of your computer. Each optional app you install will add its own share.</div></section>'
    +'<h2>SYSTEM APPS</h2>'+l.system.map(r=>row(r,r.placeholder?'PREINSTALLED · COMING LATER':'PREINSTALLED')).join('')
    +'<h2>INSTALLED APPS</h2>'+(l.installed.length?l.installed.map(r=>row(r,'INSTALLED')).join(''):'<div class="pd-empty">No additional apps installed.</div>')
    +'<h2>AVAILABLE APPS</h2>'+(l.available.length?l.available.map(r=>row(r,r.status.toUpperCase())).join(''):'<div class="pd-empty">No downloadable apps are available yet.<br>New apps will appear here when they are released.</div>');
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
  el.addEventListener('submit',e=>{const f=e.target.closest('[data-chatform]');if(!f)return;e.preventDefault();const i=f.querySelector('input'),t=i.value.trim();if(!t)return;const res=chat()?.submit(t)||{ok:false,text:'Chat is not available.'};
   if(res.ok){i.value='';if(res.players)go(['messages','players'],'tab','LOADING');}else{const h=body.querySelector('[data-chathint]');if(h)h.textContent=res.text||'';}});
  el.addEventListener('keydown',e=>{if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))e.stopPropagation();});   // typing stays in the box: no movement, no shortcuts
  chip=document.createElement('button');chip.id='pd-chip';chip.type='button';chip.textContent='V1 · L';updateBadges();chip.setAttribute('aria-label','Open the V1 device');chip.addEventListener('click',()=>toggle());document.body.appendChild(chip);
 }
 function loadingBar(ms){const bar=el.querySelector('.pd-load');if(!ms)return;bar.style.setProperty('--pd-ms',ms+'ms');bar.classList.remove('on');void bar.offsetWidth;bar.classList.add('on');clearTimeout(loadTimer);loadTimer=setTimeout(()=>bar.classList.remove('on'),ms+40);}
 const label=()=>stack[0]?D.APPS[stack[0]].title:'HOME';
 function chrome(){   // header, title and back button: these change at once, only the content waits
  const def=D.DEVICES[dev.model],app=stack[0];
  el.querySelector('.pd-tag').textContent=def.tagline;el.classList.toggle('expanded',expanded);el.classList.toggle('fx',dev.settings.scan==='1'&&!reduced());el.classList.toggle('pd-still',reduced());
  el.querySelector('[data-do=expand]').textContent=expanded?'COLLAPSE':'EXPAND';el.querySelector('[data-do=expand]').setAttribute('aria-label',expanded?'Collapse device':'Expand device');
  el.querySelector('[data-do=back]').hidden=!app;el.querySelector('.pd-title').textContent=label();
 }
 function render(opts={}){
  if(!el||!open||busy)return;   // while a transition card is showing nothing else redraws the screen
  const app=stack[0],def=D.DEVICES[dev.model];chrome();syncViewing();
  const top=body.scrollTop;
  if(!app){const st=D.storage(dev);body.innerHTML='<div class="pd-home"><div class="pd-grid">'+def.apps.map((id,i)=>{const a=D.APPS[id],off=a.state==='placeholder';return '<button type="button" class="pd-app'+(off?' off':'')+'" data-app="'+id+'" style="--i:'+i+'" aria-label="'+esc(a.title)+(off?' (not available yet)':'')+'">'+FRAME+'<span class="pd-index" aria-hidden="true">'+String(i+1).padStart(2,'0')+'</span>'+(id==='messages'?'<span class="pd-badge" hidden></span>':'')+icon(id)+'<span class="pd-name">'+esc(a.title)+'</span><span class="pd-sub">'+(off?'COMING LATER':'')+'</span></button>';}).join('')+'</div><div class="pd-home-foot"><div class="pd-storage pd-mini" aria-label="Device storage"><div class="pd-stat"><span>STORAGE USED: '+st.usedPct+'%</span><span>AVAILABLE: '+st.availablePct+'%</span></div><div class="pd-bar"><i style="width:'+st.usedPct+'%"></i></div></div><div class="pd-foot">'+esc(def.tagline)+'</div></div></div>';}
  else{try{body.innerHTML=APP_VIEW[app]();}catch(e){body.innerHTML='<div class="pd-empty">This app could not be shown.</div>';}}
  body.scrollTop=opts.keepScroll?top:0;
  hydratePortraits();if(app==='map')drawMap();
  if(app==='messages'&&(stack[1]||'chat')==='chat'){const log=body.querySelector('[data-chatlog]');if(log)log.scrollTop=log.scrollHeight;if(wantFocus){wantFocus=false;const i=body.querySelector('[data-chatform] input:not([disabled])');if(i)setTimeout(()=>i.focus(),0);}}
  updateBadges();
 }
 /* Moves to another screen. The new screen's title shows at once; its content appears after the model's transition delay (a loading card, driven by a timer: nothing blocks).
    Only the LATEST request counts: clicking again, going back or closing cancels the one in flight, so transitions never pile up. */
 function go(next,kind,text){
  stack=next;const seq=++navSeq,ms=D.delayMs(dev,kind,reduced());clearTimeout(navTimer);busy=false;
  if(!el||!open){syncViewing();return;}
  if(!ms){render();return;}
  chrome();busy=true;syncViewing();loadingBar(ms);
  body.innerHTML='<div class="pd-boot" role="status"><b>'+esc(text||'OPENING '+label())+'</b><small>'+esc(D.DEVICES[dev.model].tagline)+'</small><div class="pd-boot-bar" style="--pd-ms:'+ms+'ms"><i></i></div></div>';
  navTimer=setTimeout(()=>{if(seq!==navSeq)return;busy=false;if(open)render();},ms);
 }
 function onClick(e){
  const t=e.target.closest('button');if(!t)return;
  if(t.dataset.app){if(busy)return;if(!reduced()){t.classList.add('launching');t.style.setProperty('--pd-ms',D.delayMs(dev,'open',false)+'ms');}go([t.dataset.app],'open');return;}
  if(t.dataset.do==='close')return setOpen(false);
  if(t.dataset.do==='back')return back();
  if(t.dataset.do==='expand'){expanded=!expanded;render({keepScroll:true});if(busy)chrome();return;}
  if(t.dataset.sub){if(t.getAttribute('aria-pressed')==='true')return;go([stack[0],t.dataset.sub],'tab','LOADING');return;}
  if(t.dataset.ig){const r=rp();if(r){r.setIgnore(t.dataset.id,t.dataset.ig==='mute'?'mute':t.dataset.ig==='block'?'block':null,t.dataset.name);}render({keepScroll:true});return;}
  if(t.dataset.repOpen){reporting=reporting===t.dataset.repOpen?'':t.dataset.repOpen;chat()?.clearNote();render({keepScroll:true});return;}
  if(t.dataset.repSend){const box=t.closest('.pd-report'),ok=rp()?.report(t.dataset.repSend,box.querySelector('select').value,box.querySelector('input').value);reporting='';render({keepScroll:true});if(!ok){const n=document.createElement('div');n.className='pd-card';n.setAttribute('role','status');n.textContent='Could not send the report right now.';body.prepend(n);}return;}
  if(t.dataset.openProfile){go(['social',t.dataset.openProfile],'tab','LOADING PROFILE');return;}
  if(t.dataset.track||t.dataset.untrack){const s=state_(),V=root.VoidMissions;try{if(t.dataset.track)V.track(s,t.dataset.track,C);else V.untrack(s);if(typeof save==='function')save();}catch{}render({keepScroll:true});return;}
  if(t.dataset.set){dev.settings[t.dataset.set]=t.dataset.value;if(t.dataset.set==='size')expanded=t.dataset.value==='expanded';commit();render({keepScroll:true});return;}
  if(t.dataset.act==='block'||t.dataset.act==='report'){
   const pk=String(t.dataset.profile||'').replace(/^player:/,''),r=rp();if(!r)return;const peer=r.peers.find(p=>p.id===pk);
   if(t.dataset.act==='block'&&peer){r.setIgnore(pk,'block',peer.name);go(['social'],'tab','LOADING');return;}
   if(t.dataset.act==='report'){const box=body.querySelector('[data-report]');if(box&&!box.firstChild){box.innerHTML='<select aria-label="Reason"><option value="harassment">HARASSMENT</option><option value="spam">SPAM</option><option value="inappropriate">INAPPROPRIATE</option><option value="cheating">CHEATING</option><option value="other">OTHER</option></select> <button type="button" data-send-report="'+esc(pk)+'">SEND REPORT</button>';}return;}
  }
  if(t.dataset.sendReport){const sel=body.querySelector('[data-report] select');rp()?.report(t.dataset.sendReport,sel?.value||'other','');const box=body.querySelector('[data-report]');if(box)box.textContent='Report sent. Thank you.';}
 }
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
   document.exitPointerLock?.();el.classList.add('open');el.classList.toggle('anim',!reduced());chip.classList.remove('on');
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
 // The Players list follows who comes and goes while it is on screen (only when it really changed and nothing is being typed)
 setInterval(()=>{if(!open||busy||stack[0]!=='messages'||stack[1]!=='players'||body.querySelector('input:focus,select:focus'))return;if(playersSigNow()!==playersSig)render({keepScroll:true});},1500);

 // Esc is also the game's Pause key and the controls layer hears it first: while the device is open, Pause (and losing focus) must not open the game menu.
 if(typeof openGameMenu==='function'){const gameMenu=openGameMenu;openGameMenu=function(){if(open)return;return gameMenu.apply(this,arguments);};}
 // The L key now opens the V1 on foot and in stations; in flight the older Mission Log keeps working unchanged.
 if(typeof openMissionLog==='function'){const legacy=openMissionLog;openMissionLog=function(){if(open||onFootOrDock()){toggle();return;}return legacy.apply(this,arguments);};}
 try{chat()?.onChange(onChatChange);}catch{}
 root.VoidPersonalDevice={get isOpen(){return open;},get expanded(){return expanded;},open:()=>setOpen(true),close:()=>setOpen(false),toggle,get app(){return stack[0]||null;},get sub(){return stack[1]||null;},openApp,get busy(){return busy;},get suppressed(){return [...suppressed];},get device(){return dev;},APP_VIEW};
})(globalThis);
