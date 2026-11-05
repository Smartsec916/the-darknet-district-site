/* OPTIONAL, OFF BY DEFAULT: other players in the District interior (two-player test).
   It does nothing unless a tester has switched it on, and then only in the District interior:
     - on a local address (localhost or 127.0.0.1): add ?multiplayer=1 (or the local flag tdd-multiplayer=1), hub on a local ws:// address;
     - on the live site: ONLY a browser where the tester has set BOTH local flags tdd-multiplayer=1 and tdd-hub=wss://<name>.onrender.com.
       A link or address can never switch it on there, so a crafted link cannot point a player's sign-in at someone else's server.
   It reports only where THIS player is (x, z, facing) and draws the others the hub reports with the existing District crowd models and
   clips. Identity, character, name and animation all come from the hub, which verifies the player's own Firebase sign-in; nothing here
   names an account. It never writes a save, never touches an NPC, and never runs for the VR rooms, the street, flight or combat.
   See docs/development/MULTIPLAYER_PROTOTYPE.md and HUB_DEPLOYMENT.md. */
(function(root){
 const LOCAL=/^(localhost|127\.0\.0\.1)$/,LIVE=/^(www\.)?thedarknetdistrict\.com$/;
 const get=(storage,k)=>{try{return storage?.getItem?.(k)||null;}catch{return null;}};
 const allowed=(loc,storage)=>{try{
  if(LOCAL.test(loc.hostname))return /[?&]multiplayer=1(&|$)/.test(loc.search||'')||get(storage,'tdd-multiplayer')==='1';
  return loc.protocol==='https:'&&LIVE.test(loc.hostname)&&get(storage,'tdd-multiplayer')==='1';}catch{return false;}};
 // Local pages may use a local hub (address bar or local flag). The live site uses only the tester's own stored hub, and only an onrender.com one.
 const hubUrl=(loc,storage)=>{
  if(LOCAL.test(loc.hostname)){const q=/[?&]hub=([^&]+)/.exec(loc.search||'');const u=q?decodeURIComponent(q[1]):get(storage,'tdd-hub')||'ws://127.0.0.1:8787';return /^ws:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(u)?u:'ws://127.0.0.1:8787';}
  const u=get(storage,'tdd-hub');return u&&/^wss:\/\/[a-z0-9-]{1,63}\.onrender\.com$/.test(u)?u:'';
 };
 const clean=n=>typeof n==='string'&&/^[A-Za-z0-9_-]{3,24}$/.test(n)?n:'Guest';
 if(typeof module!=='undefined')module.exports={allowed,hubUrl,clean};
 if(typeof document==='undefined'||!allowed(root.location,root.localStorage))return;
 const ROOM='district-interior',SEND_MS=100,SMOOTH=12,ATTEMPT_MS=75000,isLocalPage=LOCAL.test(root.location.hostname);
 let blockedUid=null,lastClose='',opening=false,ws=null,wantOn=true,retry=0,retryTimer=0,status='off',lastSend=0,connectedUid=null,wakeTimer=0;
 const traceLog=[],trace=m=>{traceLog.push(Math.round(performance.now())+' '+m);if(traceLog.length>60)traceLog.shift();};
 const peers=new Map();       // public id -> {node,ctrl,model,name,x,z,yaw,tx,tz,tyaw,clip,seen,off}
 const inRoom=()=>typeof walker!=='undefined'&&walker&&mode==='walking'&&walkingLocation?.id==='neochinatown'&&walkingLocation.area==='interior';
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
  const parent=new root.BABYLON.TransformNode('remote-player:'+p.id,scene),made=root.VoidAssets.instance('crowd:'+p.model,parent);
  if(!made){parent.dispose();return false;}
  p.node=parent;p.ctrl=root.VoidCrowd.animate(made,p.model,p.clip||'idle');p.shownClip=p.clip||'idle';makeTag(scene,parent,p.name);
  parent.position.set(p.x,walker.y-1.68,p.z);parent.rotation.y=p.yaw;return true;
 }
 function upsert(v){
  let p=peers.get(v.id);
  if(!p){p={id:v.id,name:clean(v.name),model:v.model,x:v.x,z:v.z,yaw:v.yaw,tx:v.x,tz:v.z,tyaw:v.yaw,clip:v.clip};peers.set(v.id,p);}
  else{p.tx=v.x;p.tz=v.z;p.tyaw=v.yaw;p.clip=v.clip;}
  (p.seen||(p.seen=new Set())).add(v.clip);   // every animation the hub has sent for this player (lets a test see short clips on a slow machine)
  if(!place(p)&&!p.off&&root.VoidAssets.onLoaded)p.off=root.VoidAssets.onLoaded(id=>{if(id==='crowd:'+p.model&&peers.get(p.id)===p){place(p);p.off?.();p.off=null;}});
 }
 function onMessage(m){
  if(m.t==='welcome'){clearPeers();retry=0;status='in';clearTimeout(wakeTimer);for(const v of m.peers)upsert(v);}
  else if(m.t==='join')upsert(m.peer);
  else if(m.t==='state'){if(peers.has(m.id))upsert({...peers.get(m.id),...m});}
  else if(m.t==='leave')removePeer(m.id);
  else if(m.t==='error'||m.t==='refused')status='refused: '+m.reason;
 }
 // Closing codes from the hub: 1012/1001 restarting (reconnect soon), 4001 replaced by another session of this account, 4401 sign-in not
 // accepted, 4403 not on the test list (no retry for those three), 4006 too many connections (retry slowly), anything else: back off and retry.
 const NO_RETRY=new Set([4001,4401,4403]);
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
  status='connecting';connectedUid=accountUid();
  const sock=new WebSocket(url);ws=sock;trace('new socket');
  // A sleeping free host takes up to about a minute to wake: say so, and give each attempt that long.
  clearTimeout(wakeTimer);wakeTimer=setTimeout(()=>{if(ws===sock&&sock.readyState===0)status='waking the server';},3000);
  const giveUp=setTimeout(()=>{if(ws===sock&&sock.readyState===0){try{sock.close();}catch{}}},ATTEMPT_MS);
  sock.onopen=()=>{trace('open');clearTimeout(giveUp);sock.send(JSON.stringify({t:'hello',token:tok,room:ROOM}));};
  sock.onmessage=e=>{trace('message');try{onMessage(JSON.parse(e.data));}catch{}};
  sock.onclose=e=>{trace('close '+e.code+(ws===sock?'':' (stale)'));clearTimeout(giveUp);clearTimeout(wakeTimer);if(ws!==sock)return;   // a socket this client already gave up on says nothing about the current one
   ws=null;clearPeers();lastClose=e.code+(e.reason?' '+e.reason:'');
   status=e.code===4001?'replaced by another session':e.code===4401?'sign-in not accepted':e.code===4403?'not on the test list':e.code===1012||e.code===1001?'server restarting':'offline';
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
   if(p.shownClip!==p.clip){p.shownClip=p.clip;p.ctrl?.play(p.clip);}
  }
 }
 // A tab that sleeps or loses the network is dropped by the hub; when it wakes the socket closes and reconnects by itself.
 root.addEventListener('pagehide',()=>{if(ws?.readyState===1)try{ws.send('{"t":"bye"}');}catch{}});
 requestAnimationFrame(frame);
 root.VoidRemotePlayers={get status(){return status;},get lastClose(){return lastClose;},get socketState(){return ws?ws.readyState:-1;},get trace(){return traceLog.slice(-16);},get connected(){return status==='in';},
  get peers(){return [...peers.values()].map(p=>({id:p.id,name:p.name,model:p.model,x:p.x,z:p.z,yaw:p.yaw,clip:p.clip,seen:[...(p.seen||[])],drawn:!!p.node&&!p.node.isDisposed(),tagged:!!p.node&&p.node.getChildMeshes().some(m=>m.name==='remote-tag')}));},
  disconnect(){wantOn=false;blockedUid=accountUid();disconnect();},reconnect(){wantOn=true;retry=0;clearTimeout(retryTimer);retryTimer=0;},hubUrl:()=>hubUrl(root.location,root.localStorage)};
})(globalThis);
