/* EARLY ACCESS: other registered players in the District interior, with text chat (void-runner/district-chat.js).
   On the live site it connects to the ONE reviewed hub named by LIVE_HUB below (never an address, link or stored value) and only for a signed-in, registered
   (not anonymous) account, only in the District interior in walking mode; the player can switch it off in Settings > Multiplayer. Anywhere else, and whenever
   the hub is unreachable, nothing happens and the game plays exactly as single-player. The hub verifies the sign-in itself and may refuse the account.
   Local pages (localhost or 127.0.0.1): ?multiplayer=1 switches it on and ?hub=ws://127.0.0.1:PORT picks a local hub (tests).
   It reports only where THIS player is (x, z, facing); identity, character, name and animation all come from the hub. It never writes a save, never touches an
   NPC, and never runs for the VR rooms, the street, flight or combat. See docs/development/MULTIPLAYER_PROTOTYPE.md, HUB_RENDER_SETTINGS.md and MODERATION.md. */
(function(root){
 // The reviewed hub (Render service `district-hub`). Changing this is a deliberate, reviewed code change; empty would mean no option and no connection.
 const LIVE_HUB='wss://district-hub-mbo7.onrender.com';
 const LOCAL=/^(localhost|127\.0\.0\.1)$/,LIVE=/^(www\.)?thedarknetdistrict\.com$/,HUB_OK=/^wss:\/\/[a-z0-9-]{1,63}\.onrender\.com$/;
 const get=(storage,k)=>{try{return storage?.getItem?.(k)||null;}catch{return null;}};
 // Is the Settings option shown (and may the page connect at all)? Live: only with a configured, valid hub. Local: always.
 const available=(loc,liveHub=LIVE_HUB)=>{try{return LOCAL.test(loc.hostname)||(loc.protocol==='https:'&&LIVE.test(loc.hostname)&&HUB_OK.test(liveHub));}catch{return false;}};
 // Has the tester switched it on? (The Settings button stores this flag; on a local page ?multiplayer=1 does too.)
 const allowed=(loc,storage,liveHub=LIVE_HUB)=>{try{
  if(!available(loc,liveHub))return false;
  if(LOCAL.test(loc.hostname))return /[?&]multiplayer=1(&|$)/.test(loc.search||'')||get(storage,'tdd-multiplayer')==='1';
  return get(storage,'tdd-multiplayer')!=='0';}catch{return false;}};   // live site: ON for registered accounts unless the player switched it off in Settings
 const hubUrl=(loc,storage,liveHub=LIVE_HUB)=>{
  if(LOCAL.test(loc.hostname)){const q=/[?&]hub=([^&]+)/.exec(loc.search||'');const u=q?decodeURIComponent(q[1]):get(storage,'tdd-hub')||'ws://127.0.0.1:8787';return /^ws:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(u)?u:'ws://127.0.0.1:8787';}
  return available(loc,liveHub)?liveHub:'';
 };
 const clean=n=>typeof n==='string'&&/^[A-Za-z0-9_-]{3,24}$/.test(n)?n:'Guest';
 // What the Settings line says for each status the client can be in.
 const words=(st,signedIn)=>({'off':signedIn?'Off.':'Off. Sign in to your account first (Account, in the main menu).','in':'Connected. Other players in the District interior appear with name tags.',
  'connecting':'Connecting...','waking the server':'Waking the test server (it sleeps when idle and can take about a minute)...','sign in to join':'Sign in to your account first (Account, in the main menu).',
  'not on the test list':'Your account is not on the test list.','registered account required':'Multiplayer and chat need a registered account. Create one from the account menu.','create an account':'Multiplayer and chat need a registered account. Create one from the account menu.','checking account':'Checking your District account…','District handle required':'Choose a unique District handle below.','saved character required':'Create your character below.','District handle and character required':'Choose a handle and create your character below.','account verification unavailable':'Account verification is unavailable. Solo play continues; multiplayer will retry.','duplicate District handle':'That handle is already in use. Contact support if this is your account.','verified email required':'Please verify your email address to use multiplayer.','sign-in not accepted':'Your sign-in was not accepted. Sign in again.','replaced by another session':'This account joined from another window.',
  'server restarting':'The server is restarting; reconnecting...','offline':'Cannot reach the server; solo play continues while retrying.','no hub configured':'No multiplayer server is set up.'}[st]||(st?.startsWith('setup error:')?st.slice(13):st&&st.startsWith('refused')?'The server refused the connection.':'Off.'));
 if(typeof module!=='undefined')module.exports={allowed,available,hubUrl,clean,words,LIVE_HUB};
 if(typeof document==='undefined')return;
 const isLocalPage=LOCAL.test(root.location.hostname);
 let booted=false;
 function boot(){if(booted)return;booted=true;
 const ROOM='district-interior',SEND_MS=100,SMOOTH=12,ATTEMPT_MS=75000,TAG_RANGE=30;
 let features={trade:false,tradeSimulated:false,chat:false};const listeners=new Set(),chatListeners=new Set();
 const IGN='void-runner-chat-ignored:';let ignored=new Map(),ignoredNames=new Map();   // public id -> 'mute' | 'block' (kept for this account in this browser)
 const loadIgnored=()=>{try{const rows=JSON.parse(root.localStorage.getItem(IGN+(accountUid()||'guest'))||'[]').filter(x=>Array.isArray(x)&&/^[0-9a-f]{12}$/.test(x[0])&&['mute','block'].includes(x[1])).slice(0,100);ignored=new Map(rows.map(x=>[x[0],x[1]]));ignoredNames=new Map(rows.map(x=>[x[0],clean(x[2])]));}catch{ignored=new Map();ignoredNames=new Map();}};
 const saveIgnored=()=>{try{root.localStorage.setItem(IGN+(accountUid()||'guest'),JSON.stringify([...ignored].map(([id,m])=>[id,m,ignoredNames.get(id)||'Player'])));}catch{}};
 let selfId='';const emitChat=m=>{for(const fn of chatListeners)try{fn(m);}catch{}};
 let blockedUid=null,creatorOfferedUid=null,lastClose='',opening=false,ws=null,wantOn=true,retry=0,retryTimer=0,status='off',lastSend=0,connectedUid=null,wakeTimer=0;
 const traceLog=[],trace=m=>{traceLog.push(Math.round(performance.now())+' '+m);if(traceLog.length>60)traceLog.shift();};
 const peers=new Map();       // public id -> {node,ctrl,model,name,x,z,yaw,tx,tz,tyaw,clip,seen,off}
 // Paused in the District (the pause menu, Settings) still counts as being in the room: the avatar simply stands still for the others.
 const inRoom=()=>typeof walker!=='undefined'&&walker&&(mode==='walking'||mode==='menu')&&walkingLocation?.id==='neochinatown'&&walkingLocation.area==='interior';
 // The player's own Firebase sign-in. A local emulator token (tests) is honoured only on a local page.
 async function token(){try{if(isLocalPage){const t=get(root.localStorage,'tdd-dev-mp-token');if(t)return t;}return await root.VoidAccount?.user?.getIdToken?.()||null;}catch{return null;}}
 const accountUid=()=>root.VoidAccount?.user?.uid||null;

 // A name tag above the head: a billboard with the hub's name drawn on a canvas (text only, never markup). Disposed with the avatar.
 function makeTag(scene,parent,name){
  const B=root.BABYLON,dt=new B.DynamicTexture('remote-tag-tex',{width:256,height:64},scene,false),ctx=dt.getContext();
  ctx.clearRect(0,0,256,64);ctx.fillStyle='rgba(4,10,16,.72)';ctx.fillRect(0,8,256,48);ctx.strokeStyle='#5ff2ff';ctx.lineWidth=2;ctx.strokeRect(1,9,254,46);
  ctx.font='bold 26px monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#e8fbff';ctx.fillText(name,128,33,236);dt.hasAlpha=true;dt.update();
  const plane=B.MeshBuilder.CreatePlane('remote-tag',{width:.7,height:.175},scene),mat=new B.StandardMaterial('remote-tag-mat',scene);
  mat.disableLighting=true;mat.diffuseColor=B.Color3.Black();mat.emissiveTexture=dt;mat.opacityTexture=dt;mat.backFaceCulling=false;
  plane.material=mat;plane.parent=parent;plane.position.y=2.12;plane.billboardMode=B.Mesh.BILLBOARDMODE_ALL;plane.isPickable=false;
  plane.onDisposeObservable.add(()=>{dt.dispose();mat.dispose();});
  return plane;
 }
 function removePeer(id){const p=peers.get(id);if(!p)return;p.off?.();p.ctrl?.dispose?.();p.node?.dispose?.();peers.delete(id);}
 function clearPeers(){for(const id of [...peers.keys()])removePeer(id);}
 function place(p){
  const scene=root.VoidBabylon?.scene;if(!scene)return false;if(p.node&&!p.node.isDisposed())return true;
  // A player with a saved creator look (ids already checked by the hub, checked again here) is built by the assembler; anyone else uses the plain crowd model.
  if(p.appearance&&root.VoidCharacterAssembler&&root.VoidCharacterAppearance?.validate(p.appearance)){
   const parent=new root.BABYLON.TransformNode('remote-player:'+p.id,scene);p.node=parent;p.tag=makeTag(scene,parent,p.name);parent.position.set(p.x,walker.y-1.68,p.z);parent.rotation.y=p.yaw;p.shownClip=p.clip||'idle';
   root.VoidCharacterAssembler.build(p.appearance,parent,{scene,clip:p.shownClip}).then(ch=>{if(peers.get(p.id)!==p||parent.isDisposed()){ch.dispose();return;}p.ctrl=ch;p.char=ch;})
    .catch(()=>{if(peers.get(p.id)===p){p.appearance=null;parent.dispose();p.node=null;}});   // could not build it: fall back to the plain crowd model
   return true;
  }
  const parent=new root.BABYLON.TransformNode('remote-player:'+p.id,scene),made=root.VoidAssets.instance('crowd:'+p.model,parent);
  if(!made){parent.dispose();return false;}
  p.node=parent;p.ctrl=root.VoidCrowd.animate(made,p.model,p.clip||'idle');p.shownClip=p.clip||'idle';p.tag=makeTag(scene,parent,p.name);
  parent.position.set(p.x,walker.y-1.68,p.z);parent.rotation.y=p.yaw;return true;
 }
 function upsert(v){
  let p=peers.get(v.id);
  if(!p){p={id:v.id,name:clean(v.name),model:v.model,appearance:v.appearance||null,x:v.x,z:v.z,yaw:v.yaw,tx:v.x,tz:v.z,tyaw:v.yaw,clip:v.clip};peers.set(v.id,p);}
  else{p.tx=v.x;p.tz=v.z;p.tyaw=v.yaw;p.clip=v.clip;}
  (p.seen||(p.seen=new Set())).add(v.clip);   // every animation the hub has sent for this player (lets a test see short clips on a slow machine)
  if(ignored.get(v.id)==='block'){removePeer(v.id);return;}
  if(!place(p)&&!p.off&&root.VoidAssets.onLoaded)p.off=root.VoidAssets.onLoaded(id=>{if(id==='crowd:'+p.model&&peers.get(p.id)===p){place(p);p.off?.();p.off=null;}});
 }
 function onMessage(m){
  if(m.t==='welcome'){selfId=String(m.you||'');clearPeers();retry=0;status='in';clearTimeout(wakeTimer);features={trade:!!m.features?.trade,tradeSimulated:!!m.features?.tradeSimulated,chat:!!m.features?.chat};loadIgnored();for(const [id,mode] of ignored)if(ws?.readyState===1)ws.send(JSON.stringify({t:'ignore',id,on:true}));for(const v of m.peers)upsert(v);emitChat({t:'chat-status',on:features.chat});}
  else if(m.t==='chat'||m.t==='chat-refused'||m.t==='reported'||m.t==='report-refused'){if(m.t==='chat'&&ignored.has(m.id))return;emitChat(m);return;}
  else if(m.t==='trade'){for(const fn of listeners)try{fn(m);}catch{}return;}
  else if(m.t==='join')upsert(m.peer);
  else if(m.t==='state'){if(peers.has(m.id))upsert({...peers.get(m.id),...m});}
  else if(m.t==='look'){const p=peers.get(m.id),VA=root.VoidCharacterAppearance;if(p){const ok=!!VA&&VA.validate(m.appearance);p.appearance=ok?VA.normalize(m.appearance):null;p.model=ok?VA.CATALOG.looks[p.appearance.look].model:(['district-smuggler','district-resident'].includes(m.model)?m.model:p.model);
   if(p.char&&p.appearance&&root.VoidCharacterAppearance?.validate(p.appearance))p.char.set(p.appearance).catch(()=>{});
   else{p.ctrl?.dispose?.();p.ctrl=p.char=null;p.node?.dispose?.();p.node=null;place(p);}}}
  else if(m.t==='leave')removePeer(m.id);
  else if(m.t==='error'||m.t==='refused')status='refused: '+m.reason;
 }
 // Closing codes from the hub: 1012/1001 restarting (reconnect soon), 4001 replaced by another session of this account, 4401 sign-in not
 // accepted, 4403 not on the test list (no retry for those three), 4006 too many connections (retry slowly), anything else: back off and retry.
 const NO_RETRY=new Set([4001,4401,4403,4407,4408,4410,4411,4412,4414]);
 function scheduleRetry(code){
  if(!wantOn||NO_RETRY.has(code))return;
  const wait=code===1012||code===1001?600:code===4006?30000:Math.min(15000,1000*2**Math.min(retry++,4));
  retryTimer=setTimeout(connect,wait);
 }
 async function connect(){
  retryTimer=0;if(ws||opening||!wantOn||!inRoom())return;
  if(root.VoidAssets?.pending>0){retryTimer=setTimeout(connect,1000);return;}   // let the room finish loading first: a busy page answers the hub late
  const url=hubUrl(root.location,root.localStorage);if(!url){status='no hub configured';return;}
  opening=true;let tok;try{tok=await token();}finally{opening=false;}
  if(ws||!wantOn||!inRoom())return;
  if(!tok){status='sign in to join';retryTimer=setTimeout(connect,3000);return;}
  if(!isLocalPage&&root.VoidAccount?.user?.isAnonymous){status='create an account';retryTimer=setTimeout(connect,5000);return;}   // a registered account is required (the hub checks this too)
  if(!isLocalPage){const a=root.VoidAccount;
   if(!a?.profileReady||a.handle===undefined){status='checking account';retryTimer=setTimeout(connect,3000);return;}
   if(!a.handle||!a.character){status=!a.handle&&!a.character?'District handle and character required':!a.handle?'District handle required':'saved character required';
    if(!a.character&&mode==='walking'&&creatorOfferedUid!==a.user.uid){creatorOfferedUid=a.user.uid;
     Promise.resolve().then(()=>root.VoidCharacterCreator?.open?.({context:'multiplayer-setup'})).catch(()=>{});}
    retryTimer=setTimeout(connect,5000);return;}}
  status='connecting';connectedUid=accountUid();
  const sock=new WebSocket(url);ws=sock;trace('new socket');
  // A sleeping free host takes up to about a minute to wake: say so, and give each attempt that long.
  clearTimeout(wakeTimer);wakeTimer=setTimeout(()=>{if(ws===sock&&sock.readyState===0)status='waking the server';},3000);
  const giveUp=setTimeout(()=>{if(ws===sock&&sock.readyState===0){try{sock.close();}catch{}}},ATTEMPT_MS);
  sock.onopen=()=>{trace('open');clearTimeout(giveUp);sock.send(JSON.stringify({t:'hello',token:tok,room:ROOM}));};
  sock.onmessage=e=>{trace('message');try{onMessage(JSON.parse(e.data));}catch{}};
  sock.onclose=e=>{if(ws===sock){features={trade:false,tradeSimulated:false,chat:false};emitChat({t:'chat-status',on:false});for(const fn of listeners)try{fn({t:'trade',ev:'offline'});}catch{}}trace('close '+e.code+(ws===sock?'':' (stale)'));clearTimeout(giveUp);clearTimeout(wakeTimer);if(ws!==sock)return;   // a socket this client already gave up on says nothing about the current one
   ws=null;clearPeers();lastClose=e.code+(e.reason?' '+e.reason:'');
   status=e.code===4001?'replaced by another session':e.code===4401?'sign-in not accepted':e.code===4403?'not on the test list':e.code===4407?'registered account required':e.code===4408?'verified email required':e.code===4410?'District handle required':e.code===4411?'saved character required':e.code===4412?'duplicate District handle':e.code===4414?'District handle and character required':e.code===4413?'account verification unavailable':e.code===1012||e.code===1001?'server restarting':'offline';
   if(NO_RETRY.has(e.code)){wantOn=false;blockedUid=connectedUid;}   // stay quiet until the player signs in as someone else or calls reconnect()
   scheduleRetry(e.code);};
  sock.onerror=()=>{};
 }
 function disconnect(){clearTimeout(retryTimer);retryTimer=0;clearTimeout(wakeTimer);const s=ws;ws=null;if(s){try{if(s.readyState===1)s.send('{"t":"bye"}');s.close(1000);}catch{}}clearPeers();status='off';}

 function frame(now){
  requestAnimationFrame(frame);
  if(!inRoom()){if(ws||peers.size||retryTimer)disconnect();return;}   // anywhere but the District interior: no connection at all
  // Signing in as someone else (or out) ends the session; the next one is for the new account.
  if(!isLocalPage&&(ws||retryTimer)&&connectedUid!==accountUid()){disconnect();wantOn=true;retry=0;}
  if(!isLocalPage&&!wantOn&&!ws&&blockedUid!==accountUid()){wantOn=true;retry=0;}
  if(!ws&&wantOn&&!retryTimer)connect();
  if(ws?.readyState===1&&status==='in'&&now-lastSend>=SEND_MS){lastSend=now;ws.send(JSON.stringify({t:'state',x:+walker.x.toFixed(3),z:+walker.z.toFixed(3),yaw:+walker.yaw.toFixed(4)}));}
  const k=1-Math.exp(-SMOOTH*Math.min(.1,(now-(frame.last||now))/1000));frame.last=now;
  for(const p of peers.values()){
   if(!p.node||p.node.isDisposed()){p.node=null;place(p);if(!p.node)continue;}
   p.x+=(p.tx-p.x)*k;p.z+=(p.tz-p.z)*k;let d=p.tyaw-p.yaw;d=Math.atan2(Math.sin(d),Math.cos(d));p.yaw+=d*k;
   p.node.position.set(p.x,walker.y-1.68,p.z);p.node.rotation.y=p.yaw;
   if(p.tag)p.tag.isVisible=Math.hypot(p.x-walker.x,p.z-walker.z)<TAG_RANGE;
   if(p.char){const d=Math.hypot(p.x-walker.x,p.z-walker.z),far=root.VoidGraphics?.quality==='low'?8:14;p.char.setDetail(p.char.detailNear?d<far:d<far*.8);}   // face details only when close (distance-based rendering; hysteresis avoids flicker)   // no name tags across the whole hall
   if(p.shownClip!==p.clip){p.shownClip=p.clip;p.ctrl?.play(p.clip);}
  }
 }
 // A tab that sleeps or loses the network is dropped by the hub; when it wakes the socket closes and reconnects by itself.
 root.addEventListener('pagehide',()=>{if(ws?.readyState===1)try{ws.send('{"t":"bye"}');}catch{}});
 requestAnimationFrame(frame);
 root.VoidRemotePlayers={get status(){return status;},get lastClose(){return lastClose;},get socketState(){return ws?ws.readyState:-1;},get trace(){return traceLog.slice(-16);},get connected(){return status==='in';},
  get features(){return features;},get me(){return selfId;},
  // Trading hooks (void-runner/trade-window.js): subscribe to trade messages, send one, and ask who is close enough to trade with.
  onTrade(fn){listeners.add(fn);return ()=>listeners.delete(fn);},
  sendTrade(msg){if(ws?.readyState===1&&status==='in'&&features.trade&&msg&&msg.t==='trade'){ws.send(JSON.stringify(msg));return true;}return false;},
  nearest(maxMetres=3){let best=null;for(const p of peers.values()){if(!p.node||p.node.isDisposed())continue;const d=Math.hypot(p.x-walker.x,p.z-walker.z);if(d<=maxMetres&&(!best||d<best.dist))best={id:p.id,name:p.name,dist:d};}return best;},
  get peers(){return [...peers.values()].map(p=>({id:p.id,name:p.name,model:p.model,x:p.x,z:p.z,yaw:p.yaw,clip:p.clip,seen:[...(p.seen||[])],appearance:p.appearance||null,drawn:!!p.node&&!p.node.isDisposed(),tagged:!!p.node&&p.node.getChildMeshes().some(m=>m.name==='remote-tag')}));},
  // Tell the hub my saved look changed (after the wardrobe): it re-reads it from my account and tells nearby players.
  async refreshLook(){if(ws?.readyState===1&&status==='in'){const t=await token();if(t)ws.send(JSON.stringify({t:'refresh',token:t}));}},
  ...(isLocalPage?{_message:onMessage}:{}),
  // Text chat and moderation (void-runner/district-chat.js is the screen for these). Everything is checked again by the hub.
  onChat(fn){chatListeners.add(fn);return ()=>chatListeners.delete(fn);},
  sendChat(text){if(ws?.readyState===1&&status==='in'&&features.chat&&typeof text==='string'){ws.send(JSON.stringify({t:'chat',text:text.slice(0,800)}));return true;}return false;},
  get ignored(){if(!ignored.size)loadIgnored();return [...ignored].map(([id,m])=>[id,m,ignoredNames.get(id)||'Player']);},
  setIgnore(id,mode,name){if(!/^[0-9a-f]{12}$/.test(String(id)))return false;if(mode==='mute'||mode==='block'){ignored.set(id,mode);ignoredNames.set(id,clean(name||peers.get(id)?.name));}else{ignored.delete(id);ignoredNames.delete(id);mode=null;}saveIgnored();
   if(ws?.readyState===1)ws.send(JSON.stringify({t:'ignore',id,on:!!mode}));if(mode==='block')removePeer(id);return true;},
  report(id,reason,note){if(!(ws?.readyState===1&&status==='in'&&features.chat))return false;const m={t:'report',id,reason};if(typeof note==='string'&&note.trim())m.note=note.trim().slice(0,120);ws.send(JSON.stringify(m));return true;},
  disconnect(){wantOn=false;blockedUid=accountUid();disconnect();},reconnect(){wantOn=true;blockedUid=null;retry=0;clearTimeout(retryTimer);retryTimer=0;},
  setupError(message){status='setup error: '+String(message).slice(0,160);},hubUrl:()=>hubUrl(root.location,root.localStorage)};
 }
 // ---- Settings > Multiplayer test: a button instead of the browser console. The server's allow-list is the real gate; this only starts or stops asking. ----
 const on=()=>isLocalPage?get(root.localStorage,'tdd-multiplayer')==='1':get(root.localStorage,'tdd-multiplayer')!=='0';
 const setFlag=v=>{try{root.localStorage.setItem('tdd-multiplayer',v?'1':'0');}catch{}};
 const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function menuHtml(){
  const st=root.VoidRemotePlayers?.status||'off',signedIn=!!root.VoidAccount?.user;
  const a=root.VoidAccount,setup=on()&&a?.user&&!a.user.isAnonymous&&a.profileReady;
  return '<h2>Multiplayer test</h2><p>Early access: meet other registered players inside The Darknet District and chat with them (press Enter). You need a unique District handle and a saved character. It works only in the District interior; everywhere else, and whenever the server is unavailable, you play alone. Your saves are not touched. Real-money and item trading stay disabled.</p>'
   +'<p id="multiplayer-status" role="status">'+esc(words(on()?st:'off',signedIn))+'</p>'
   +(setup&&a.handle===null?'<label for="multiplayer-handle">District handle</label><input id="multiplayer-handle" maxlength="20" autocomplete="off" placeholder="Ghost_01"><button type="button" data-action="multiplayer-handle">CLAIM HANDLE</button>':'')
   +(setup&&!a.character?'<button type="button" data-action="multiplayer-character">CREATE CHARACTER</button>':'')
   +'<button type="button" data-action="multiplayer-toggle" id="multiplayer-toggle">'+(on()?'LEAVE MULTIPLAYER TEST':'JOIN MULTIPLAYER TEST')+'</button>';
 }
 function installMenu(){
  if(!available(root.location)||typeof settingsPage!=='function')return;
  const prior=settingsPage;
  settingsPage=function(...a){const r=prior.apply(this,a);screen.querySelector('.settings-panel')?.insertAdjacentHTML('beforeend',menuHtml());return r;};
  screen.addEventListener('click',e=>{
   const action=e.target.closest('button')?.dataset.action;
   if(action==='multiplayer-handle'){
    const value=screen.querySelector('#multiplayer-handle')?.value.trim();root.VoidAccount?.claimMultiplayerHandle?.(value)
     .then(()=>{root.VoidRemotePlayers?.reconnect();settingsPage();})
     .catch(error=>root.VoidRemotePlayers?.setupError?.(error.message||'Handle registration is unavailable.'));return;
   }
   if(action==='multiplayer-character'){root.VoidCharacterCreator?.open?.({context:'multiplayer-setup'});return;}
   if(action!=='multiplayer-toggle')return;
   if(on()){setFlag(false);root.VoidRemotePlayers?.disconnect();}
   else{setFlag(true);boot();root.VoidRemotePlayers?.reconnect();}
   settingsPage();   // redraw with the new state; the status line then follows as the connection comes up
   const t=setInterval(()=>{const el=document.getElementById('multiplayer-status');if(!el){clearInterval(t);return;}el.textContent=words(on()?root.VoidRemotePlayers?.status:'off',!!root.VoidAccount?.user);},1000);
  });
 }
 if(allowed(root.location,root.localStorage))boot();
 installMenu();
})(globalThis);
