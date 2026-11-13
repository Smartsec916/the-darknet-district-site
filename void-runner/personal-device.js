/* V1 personal holographic device: the screen (browser only; phones never download it). Rules and saved state are in device-v1.js.
   L opens and closes it. It does NOT change the game's mode: the world, other players and NPCs keep running; only YOUR movement is held. The mouse is free over
   the device and dragging the world outside it looks around. It is a read-and-act layer over systems that already exist (Mission Log, conversation history,
   the Relay news archive, District chat, the explored map); it keeps no messages, accounts or profiles of its own. Camera and Gallery are placeholders. */
(function(root){
 'use strict';
 const D=root.VoidDeviceV1;if(!D)return;
 const MOVE=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight','ControlLeft','ControlRight','KeyC','Space','KeyQ','KeyR','KeyX','KeyE','KeyF','KeyG']);
  const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));   // own escaper: attributes need quotes escaped too
 const reduced=()=>dev.settings.motion==='reduced'||dev.settings.motion==='auto'&&root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 let el=null,body=null,open=false,expanded=false,dev=D.restore({}),stack=[],held=new Set(),suppressed=new Set(),mapTimer=0,loadTimer=0,chip=null;
 const sources=new Map();   // portrait key -> source, filled while rendering a profile

 const CSS=`#personal-device{position:fixed;top:54px;right:12px;bottom:12px;width:max(430px,calc(50vw - 12px));z-index:44;display:none;flex-direction:column;box-sizing:border-box;color:#d9fbff;font:13px/1.5 ui-monospace,Consolas,monospace;
 background:linear-gradient(160deg,rgba(3,12,20,.95),rgba(4,8,16,.96));border:1px solid rgba(88,255,225,.45);box-shadow:0 0 28px rgba(56,232,255,.18),inset 0 0 40px rgba(56,232,255,.05);clip-path:polygon(0 0,calc(100% - 22px) 0,100% 22px,100% 100%,22px 100%,0 calc(100% - 22px))}
#personal-device.open{display:flex}#personal-device.expanded{width:calc(100vw - 24px);top:12px}
#personal-device.fx::before{content:'';position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(255,255,255,.035) 0 1px,transparent 1px 3px);animation:pd-scan 7s linear infinite;z-index:3}
#personal-device.worn::after{content:'';position:absolute;inset:0;pointer-events:none;z-index:3;background:radial-gradient(ellipse at 15% 90%,rgba(255,200,120,.05),transparent 40%),radial-gradient(ellipse at 90% 8%,rgba(255,63,180,.05),transparent 35%)}
@keyframes pd-scan{to{background-position:0 60px}}@keyframes pd-in{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:none}}@keyframes pd-bar{from{transform:translateX(-100%)}to{transform:translateX(0)}}
#personal-device.open.anim{animation:pd-in .22s ease-out}
#personal-device .pd-head{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid rgba(88,255,225,.25);background:rgba(56,232,255,.05)}
#personal-device .pd-brand{font-size:20px;font-weight:700;letter-spacing:.14em;color:#58ffe1;text-shadow:0 0 8px rgba(88,255,225,.6)}#personal-device .pd-tag{font-size:10px;letter-spacing:.12em;color:#8fb3bd;flex:1}
#personal-device button{font:inherit;font-size:12px;letter-spacing:.06em;color:#d9fbff;background:rgba(10,24,34,.9);border:1px solid rgba(56,232,255,.4);padding:6px 10px;cursor:pointer;min-height:30px}
#personal-device button:hover,#personal-device button:focus-visible{outline:2px solid #38e8ff;outline-offset:1px;background:rgba(20,50,66,.95)}
#personal-device button[aria-pressed=true]{background:#0f4a52;border-color:#58ffe1}#personal-device button[disabled]{opacity:.45;cursor:not-allowed}
#personal-device .pd-nav{display:flex;gap:8px;padding:6px 14px;align-items:center;border-bottom:1px solid rgba(88,255,225,.12);min-height:44px}#personal-device .pd-title{flex:1;letter-spacing:.14em;color:#ff7ac9}
#personal-device .pd-load{height:3px;background:transparent;overflow:hidden;position:relative}#personal-device .pd-load i{position:absolute;inset:0;background:linear-gradient(90deg,transparent,#58ffe1,transparent);transform:translateX(-100%)}
#personal-device .pd-load.on i{animation:pd-bar var(--pd-ms,.3s) ease-out forwards}
#personal-device .pd-main:focus{outline:none}#personal-device .pd-main{flex:1 1 0;min-height:0;overflow:auto;padding:14px;position:relative;z-index:1}#personal-device .pd-head,#personal-device .pd-nav,#personal-device .pd-load{position:relative;z-index:2;flex:none}
#personal-device .pd-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:10px}
#personal-device .pd-app{display:flex;flex-direction:column;align-items:center;gap:4px;padding:14px 6px;min-height:92px}
#personal-device .pd-glyph{font-size:26px;color:#58ffe1;line-height:1}#personal-device .pd-sub{font-size:9px;color:#8fb3bd;letter-spacing:.1em}
#personal-device h2{margin:14px 0 6px;font-size:11px;letter-spacing:.18em;color:#ff3fb4;border-bottom:1px solid rgba(255,63,180,.25);padding-bottom:3px}
#personal-device .pd-card{border-left:2px solid #38e8ff;background:rgba(255,255,255,.04);padding:8px 10px;margin:6px 0}#personal-device .pd-card h3{margin:0 0 3px;font-size:13px;color:#58ffe1}
#personal-device .pd-card.done{border-left-color:#8fb3bd;opacity:.8}#personal-device .pd-note{color:#8fb3bd;font-size:11px}
#personal-device .pd-empty{padding:26px 14px;text-align:center;color:#8fb3bd;border:1px dashed rgba(88,255,225,.3)}
#personal-device .pd-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}#personal-device input[type=text]{font:inherit;color:#fff;background:#04070a;border:1px solid #38e8ff;padding:6px 8px;width:100%;box-sizing:border-box}
#personal-device .pd-line{padding:2px 7px;border-left:2px solid #38e8ff;margin:2px 0;word-break:break-word;background:rgba(255,255,255,.03)}#personal-device .pd-line b{color:#58ffe1;margin-right:6px}
#personal-device .pd-prof{display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap}#personal-device .pd-portrait{width:112px;height:112px;object-fit:cover;border:1px solid rgba(88,255,225,.5);background:#050b12;flex:none}
#personal-device .pd-sil{width:112px;height:112px;border:1px dashed rgba(88,255,225,.4);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#6c8a93;font-size:9px;text-align:center;flex:none}
#personal-device canvas.pd-map{display:block;width:100%;height:auto;aspect-ratio:10/7;background:#03080d;border:1px solid rgba(88,255,225,.3)}
#personal-device .relay-archive details{margin:6px 0;padding:6px 10px;border-left:2px solid #d9a441;background:#ffffff08}#personal-device .relay-archive summary{cursor:pointer}#personal-device .relay-archive h2{margin-top:0}
#personal-device .relay-archive .tag{display:inline-block;margin-right:6px;padding:0 6px;font:11px monospace;letter-spacing:.06em;border:1px solid #58ffe155;color:#9ff}
#personal-device .mission-entry{border-left:2px solid #38e8ff;background:#ffffff08;padding:6px 10px;margin:6px 0}
#pd-chip{position:fixed;right:24px;top:154px;z-index:43;display:none;font:11px ui-monospace,Consolas,monospace;letter-spacing:.1em;color:#58ffe1;background:rgba(3,12,20,.8);border:1px solid rgba(88,255,225,.45);padding:5px 9px;cursor:pointer}
#pd-chip.on{display:block}#pd-chip:hover,#pd-chip:focus-visible{outline:2px solid #38e8ff}
@media(max-width:700px){#personal-device{width:calc(100vw - 24px)}}`;

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

 // ---- Apps ----
 const APP_VIEW={
  missions(){
   const s=state_(),V=root.VoidMissions;let list=[];try{list=s&&V?V.sync(s,C):[];}catch{}
   const card=m=>'<article class="pd-card '+(m.completed?'done':'')+'"><h3>'+esc(m.title)+' <small>'+(m.completed?'COMPLETE':m.tracked?'TRACKED':'ACTIVE')+'</small></h3><p>'+esc(m.description)+'</p><div class="pd-note">'+esc(String(m.type||'').toUpperCase())
    +(m.destination?' · '+esc(C.stations?.[m.destination]?.name||m.destination):'')+'</div>'+(m.completed?'':'<button type="button" data-'+(m.tracked?'untrack':'track')+'="'+esc(m.id)+'">'+(m.tracked?'STOP TRACKING':'TRACK')+'</button>')+'</article>';
   const active=list.filter(m=>!m.completed),done=list.filter(m=>m.completed);
   return (active.length?active.map(card).join(''):'<div class="pd-empty">No active missions.<br>Missions appear here when someone in the District offers you work.</div>')+(done.length?'<h2>COMPLETED</h2>'+done.map(card).join(''):'');
  },
  messages(){
   const r=rp(),sub=stack[1]||'chat';
   const tabs='<div class="pd-tabs"><button type="button" data-sub="chat" aria-pressed="'+(sub==='chat')+'">DISTRICT CHAT</button><button type="button" data-sub="talk" aria-pressed="'+(sub==='talk')+'">CONVERSATIONS</button><button type="button" data-sub="dm" aria-pressed="'+(sub==='dm')+'">PRIVATE</button></div>';
   if(sub==='dm')return tabs+'<div class="pd-empty">Private messages between players are not available yet.<br>They need a server feature that has not been approved or built. Nothing is stored on this device.</div>';
   if(sub==='talk'){
    let rows=[];try{rows=root.VoidConversationHistory?.read(localStorage,uid())||[];}catch{}
    return tabs+(rows.length?rows.slice(-40).reverse().map(m=>'<div class="pd-line"><b>'+esc(m.name)+'</b><span class="pd-note">'+esc(new Date(m.at).toLocaleString())+'</span><div>'+esc(m.text)+'</div></div>').join(''):'<div class="pd-empty">No conversations yet. People you talk to appear here.</div>');
   }
   const lines=root.VoidDistrictChat?.lines||[],online=!!r?.connected,can=online&&r.features.chat;
   return tabs+'<div class="pd-note">Everyone in the District interior can read this.'+(online?'':' You are not connected to the District server right now.')+'</div>'
    +'<div data-chatlog data-n="'+lines.length+'">'+(lines.length?lines.slice(-40).map(l=>'<div class="pd-line">'+(l.name?'<b>'+esc(l.name)+'</b>':'')+esc(l.text)+'</div>').join(''):'<div class="pd-empty">No chat yet.</div>')+'</div>'
    +'<form data-chatform style="margin-top:8px"><input type="text" maxlength="200" autocomplete="off" aria-label="Chat message" placeholder="'+(can?'Say something (no links)':'Chat needs a registered account and a connection')+'"'+(can?'':' disabled')+'></form>';
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
   const l=D.storeListing(dev);
   return '<div class="pd-note">Apps for the V1.</div>'+l.rows.map(r=>'<article class="pd-card"><h3>'+esc(r.title)+' <small>'+esc(r.status.toUpperCase())+(r.placeholder?' · PLACEHOLDER':'')+'</small></h3><div class="pd-note">'+esc(r.note)+'</div></article>').join('')
    +'<div class="pd-empty" style="margin-top:10px">No additional apps are available yet. New apps will appear here when they are released.</div>';
  },
  settings(){
   const S=dev.settings,def=D.DEVICES[dev.model],opt=(k,v,label)=>'<button type="button" data-set="'+k+'" data-value="'+v+'" aria-pressed="'+(S[k]===v)+'">'+label+'</button>';
   return '<h2>INTERFACE</h2><div class="pd-note">Animation</div><div class="pd-tabs">'+opt('motion','auto','FOLLOW SYSTEM')+opt('motion','full','FULL')+opt('motion','reduced','REDUCED')+'</div>'
    +'<div class="pd-note">Scanlines</div><div class="pd-tabs">'+opt('scan','1','ON')+opt('scan','0','OFF')+'</div><div class="pd-note">Opens at</div><div class="pd-tabs">'+opt('size','half','HALF SCREEN')+opt('size','expanded','EXPANDED')+'</div>'
    +'<h2>DEVICE</h2><div class="pd-card"><h3>'+esc(def.name)+'</h3><div class="pd-note">'+esc(def.tagline)+' · generation '+def.generation+'</div></div>'
    +'<h2>INSTALLED APPS</h2>'+dev.apps.map(a=>'<div class="pd-line">'+esc(D.APPS[a].title)+'</div>').join('')
    +'<div class="pd-note" style="margin-top:8px">These settings change only this device. Game settings (graphics, controls, audio) stay in the main menu.</div>';
  }
 };

 // ---- Shell ----
 function build(){
  const st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);
  el=document.createElement('section');el.id='personal-device';el.setAttribute('role','dialog');el.setAttribute('aria-label','V1 personal device');
  el.innerHTML='<div class="pd-head"><span class="pd-brand">V1</span><span class="pd-tag"></span><button type="button" data-do="expand" aria-label="Expand device"></button><button type="button" data-do="close" aria-label="Close device">CLOSE · L</button></div>'
   +'<div class="pd-nav"><button type="button" data-do="back" aria-label="Back">◀ BACK</button><span class="pd-title"></span></div><div class="pd-load"><i></i></div><div class="pd-main" tabindex="-1"></div>';
  document.body.appendChild(el);body=el.querySelector('.pd-main');
  el.addEventListener('click',onClick);
  el.addEventListener('submit',e=>{const f=e.target.closest('[data-chatform]');if(!f)return;e.preventDefault();const i=f.querySelector('input'),t=i.value.trim();if(t&&rp()?.sendChat(t))i.value='';});
  el.addEventListener('keydown',e=>{if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))e.stopPropagation();});   // typing stays in the box: no movement, no shortcuts
  chip=document.createElement('button');chip.id='pd-chip';chip.type='button';chip.textContent='V1 · L';chip.setAttribute('aria-label','Open the V1 device');chip.addEventListener('click',()=>toggle());document.body.appendChild(chip);
 }
 function loadingBar(ms){const bar=el.querySelector('.pd-load');if(reduced()){return;}bar.style.setProperty('--pd-ms',ms+'ms');bar.classList.remove('on');void bar.offsetWidth;bar.classList.add('on');clearTimeout(loadTimer);loadTimer=setTimeout(()=>bar.classList.remove('on'),ms+40);}
 function render(opts={}){
  if(!el||!open)return;
  const app=stack[0],def=D.DEVICES[dev.model];
  el.querySelector('.pd-tag').textContent=def.tagline;el.classList.toggle('expanded',expanded);el.classList.toggle('fx',dev.settings.scan==='1'&&!reduced());el.classList.add('worn');
  el.querySelector('[data-do=expand]').textContent=expanded?'COLLAPSE':'EXPAND';el.querySelector('[data-do=expand]').setAttribute('aria-label',expanded?'Collapse device':'Expand device');
  el.querySelector('[data-do=back]').hidden=!app;el.querySelector('.pd-title').textContent=app?D.APPS[app].title:'HOME';
  if(opts.bar)loadingBar(app?def.ui.appOpenMs:def.ui.tabMs);
  const top=body.scrollTop;
  if(!app)body.innerHTML='<div class="pd-grid">'+def.apps.map(id=>{const a=D.APPS[id];return '<button type="button" class="pd-app" data-app="'+id+'" aria-label="'+esc(a.title)+(a.state==='placeholder'?' (placeholder)':'')+'"><span class="pd-glyph" aria-hidden="true">'+esc(a.glyph)+'</span><span>'+esc(a.title)+'</span><span class="pd-sub">'+(a.state==='placeholder'?'COMING LATER':'')+'</span></button>';}).join('')+'</div><div class="pd-note" style="margin-top:12px">'+esc(def.tagline)+'</div>';
  else{try{body.innerHTML=APP_VIEW[app]();}catch(e){body.innerHTML='<div class="pd-empty">This app could not be shown.</div>';}}
  body.scrollTop=opts.keepScroll?top:0;
  hydratePortraits();if(app==='map')drawMap();
 }
 function onClick(e){
  const t=e.target.closest('button');if(!t)return;
  if(t.dataset.app){stack=[t.dataset.app];render({bar:true});return;}
  if(t.dataset.do==='close')return setOpen(false);
  if(t.dataset.do==='back')return back();
  if(t.dataset.do==='expand'){expanded=!expanded;render();return;}
  if(t.dataset.sub){stack=[stack[0],t.dataset.sub];render({bar:true});return;}
  if(t.dataset.openProfile){stack=['social',t.dataset.openProfile];render({bar:true});return;}
  if(t.dataset.track||t.dataset.untrack){const s=state_(),V=root.VoidMissions;try{if(t.dataset.track)V.track(s,t.dataset.track,C);else V.untrack(s);if(typeof save==='function')save();}catch{}render({keepScroll:true});return;}
  if(t.dataset.set){dev.settings[t.dataset.set]=t.dataset.value;if(t.dataset.set==='size')expanded=t.dataset.value==='expanded';commit();render({keepScroll:true});return;}
  if(t.dataset.act==='block'||t.dataset.act==='report'){
   const pk=String(t.dataset.profile||'').replace(/^player:/,''),r=rp();if(!r)return;const peer=r.peers.find(p=>p.id===pk);
   if(t.dataset.act==='block'&&peer){r.setIgnore(pk,'block',peer.name);stack=['social'];render();return;}
   if(t.dataset.act==='report'){const box=body.querySelector('[data-report]');if(box&&!box.firstChild){box.innerHTML='<select aria-label="Reason" style="font:inherit;background:#04070a;color:#d9fbff;border:1px solid #38e8ff"><option value="harassment">HARASSMENT</option><option value="spam">SPAM</option><option value="inappropriate">INAPPROPRIATE</option><option value="cheating">CHEATING</option><option value="other">OTHER</option></select> <button type="button" data-send-report="'+esc(pk)+'">SEND REPORT</button>';}return;}
  }
  if(t.dataset.sendReport){const sel=body.querySelector('[data-report] select');rp()?.report(t.dataset.sendReport,sel?.value||'other','');const box=body.querySelector('[data-report]');if(box)box.textContent='Report sent. Thank you.';}
 }
 function back(){if(stack.length>1&&stack[0]!=='messages'){stack.pop();render();return true;}   // tabs inside Messages are not history: Back goes home
  if(stack.length){stack=[];render({bar:true});return true;}setOpen(false);return false;}

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
   expanded=dev.settings.size==='expanded';stack=[];open=true;
   walkingKeys?.clear?.();try{clearInput?.();}catch{}for(const c of held)if(MOVE.has(c))suppressed.add(c);   // keys already held do nothing until released and pressed again
   document.exitPointerLock?.();el.classList.add('open');el.classList.toggle('anim',!reduced());chip.classList.remove('on');render({bar:true});
   setTimeout(()=>el.querySelector('.pd-main')?.focus({preventScroll:true}),0);
  }else{
   open=false;el.classList.remove('open');commit();walkingKeys?.clear?.();for(const c of held)if(MOVE.has(c))suppressed.add(c);
   try{canvas?.focus?.();}catch{}
  }
  return true;
 }
 const toggle=()=>setOpen(!open);
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
 // A live look at chat and profiles while the device is open (cheap: only when a screen that shows them is up)
 setInterval(()=>{if(!open)return;const a=stack[0];if(a==='messages'&&(stack[1]||'chat')==='chat'){const log=body.querySelector('[data-chatlog]');if(log&&!body.querySelector('input:focus')){const n=(root.VoidDistrictChat?.lines||[]).length;if(String(n)!==log.dataset.n){log.dataset.n=String(n);render({keepScroll:true});}}}},1500);

 // Esc is also the game's Pause key and the controls layer hears it first: while the device is open, Pause (and losing focus) must not open the game menu.
 if(typeof openGameMenu==='function'){const gameMenu=openGameMenu;openGameMenu=function(){if(open)return;return gameMenu.apply(this,arguments);};}
 // The L key now opens the V1 on foot and in stations; in flight the older Mission Log keeps working unchanged.
 if(typeof openMissionLog==='function'){const legacy=openMissionLog;openMissionLog=function(){if(open||onFootOrDock()){toggle();return;}return legacy.apply(this,arguments);};}
 root.VoidPersonalDevice={get isOpen(){return open;},get expanded(){return expanded;},open:()=>setOpen(true),close:()=>setOpen(false),toggle,get app(){return stack[0]||null;},get suppressed(){return [...suppressed];},get device(){return dev;},APP_VIEW};
})(globalThis);
