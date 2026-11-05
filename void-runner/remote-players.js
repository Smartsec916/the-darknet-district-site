/* DEVELOPMENT ONLY: other players in the District interior (local two-player prototype).
   Needs a local address (localhost or 127.0.0.1) AND ?multiplayer=1 (or the local flag tdd-multiplayer=1); for players it does not exist.
   It reports only where THIS player is (x, z, facing) to the local dev hub, and draws the other players the hub reports, using the
   existing District crowd models and clips. Identity, character and animation all come from the hub; nothing here names an account.
   It never writes a save, never touches an NPC, and never runs for the VR rooms. See docs/development/MULTIPLAYER_PROTOTYPE.md. */
(function(root){
 const allowed=(loc,storage)=>{try{return /^(localhost|127\.0\.0\.1)$/.test(loc.hostname)&&(/[?&]multiplayer=1(&|$)/.test(loc.search||'')||storage?.getItem?.('tdd-multiplayer')==='1');}catch{return false;}};
 const hubUrl=(loc,storage)=>{const q=/[?&]hub=([^&]+)/.exec(loc.search||'');const u=q?decodeURIComponent(q[1]):storage?.getItem?.('tdd-hub')||'ws://127.0.0.1:8787';return /^ws:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(u)?u:'ws://127.0.0.1:8787';};
 if(typeof module!=='undefined')module.exports={allowed,hubUrl};
 if(typeof document==='undefined'||!allowed(root.location,root.localStorage))return;
 const ROOM='district-interior',SEND_MS=100,SMOOTH=12;
 let opening=false,lastClose='',ws=null,wantOn=true,retry=0,retryTimer=0,status='off',joinedAt=0,lastSend=0,seq=0;
 const peers=new Map();       // public id -> {node,ctrl,model,x,z,yaw,tx,tz,tyaw,clip,placed,pending}
 const inRoom=()=>typeof walker!=='undefined'&&walker&&mode==='walking'&&walkingLocation?.id==='neochinatown'&&walkingLocation.area==='interior';
 // Development sign-in: a token for a LOCAL EMULATOR account supplied by the test (or a dev who signed in locally).
 async function token(){try{const t=root.localStorage.getItem('tdd-dev-mp-token');if(t)return t;return await root.VoidAccount?.user?.getIdToken?.();}catch{return null;}}

 function removePeer(id){const p=peers.get(id);if(!p)return;p.off?.();p.ctrl?.dispose?.();p.node?.dispose?.();peers.delete(id);}
 function clearPeers(){for(const id of [...peers.keys()])removePeer(id);}
 function place(p){
  const scene=root.VoidBabylon?.scene;if(!scene||p.node&&!p.node.isDisposed())return !!p.node;
  const parent=new root.BABYLON.TransformNode('remote-player:'+p.id,scene),made=root.VoidAssets.instance('crowd:'+p.model,parent);
  if(!made){parent.dispose();return false;}
  p.node=parent;p.ctrl=root.VoidCrowd.animate(made,p.model,p.clip||'idle');p.shownClip=p.clip||'idle';
  parent.position.set(p.x,walker.y-1.68,p.z);parent.rotation.y=p.yaw;return true;
 }
 function upsert(v){
  let p=peers.get(v.id);
  if(!p){p={id:v.id,name:v.name,model:v.model,x:v.x,z:v.z,yaw:v.yaw,tx:v.x,tz:v.z,tyaw:v.yaw,clip:v.clip};peers.set(v.id,p);}
  else{p.tx=v.x;p.tz=v.z;p.tyaw=v.yaw;p.clip=v.clip;}
  (p.seen||(p.seen=new Set())).add(v.clip);   // every animation the hub has sent for this player (lets a test see short clips on a slow machine)
  if(!place(p)&&!p.off&&root.VoidAssets.onLoaded)p.off=root.VoidAssets.onLoaded(id=>{if(id==='crowd:'+p.model&&peers.get(p.id)===p){place(p);p.off?.();p.off=null;}});
 }
 function onMessage(m){
  if(m.t==='welcome'){clearPeers();retry=0;status='in';for(const v of m.peers)upsert(v);}
  else if(m.t==='join')upsert(m.peer);
  else if(m.t==='state'){if(peers.has(m.id))upsert({...peers.get(m.id),...m});}
  else if(m.t==='leave')removePeer(m.id);
  else if(m.t==='error'||m.t==='refused')status='refused: '+m.reason;
 }
 async function connect(){
  retryTimer=0;if(ws||opening||!wantOn||!inRoom())return;
  opening=true;                       // one attempt at a time: frame() can run again while the token is being fetched
  let tok;try{tok=await token();}finally{opening=false;}
  if(ws||!wantOn||!inRoom())return;
  if(!tok){status='no dev token';retryTimer=setTimeout(connect,3000);return;}
  status='connecting';
  const sock=new WebSocket(hubUrl(root.location,root.localStorage));ws=sock;
  sock.onopen=()=>sock.send(JSON.stringify({t:'hello',token:tok,room:ROOM}));
  sock.onmessage=e=>{try{onMessage(JSON.parse(e.data));}catch{}};
  sock.onclose=e=>{if(ws!==sock)return;   // a socket this client already gave up on says nothing about the current one
   ws=null;clearPeers();lastClose=e.code+(e.reason?' '+e.reason:'');status=e.code===4001?'replaced by another session':'offline';
   if(wantOn&&e.code!==4001&&e.code!==4401){retry=Math.min(retry+1,5);retryTimer=setTimeout(connect,Math.min(15000,1000*2**(retry-1)));}};
  sock.onerror=()=>{};
 }
 function disconnect(){clearTimeout(retryTimer);const s=ws;ws=null;if(s){try{if(s.readyState===1)s.send('{"t":"bye"}');s.close(1000);}catch{}}clearPeers();status='off';}

 function frame(now){
  requestAnimationFrame(frame);
  const here=inRoom();
  if(!here){if(ws||peers.size)disconnect();return;}
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
 root.VoidRemotePlayers={get status(){return status;},get lastClose(){return lastClose;},get connected(){return status==='in';},
  get peers(){return [...peers.values()].map(p=>({id:p.id,name:p.name,model:p.model,x:p.x,z:p.z,yaw:p.yaw,clip:p.clip,seen:[...(p.seen||[])],drawn:!!p.node&&!p.node.isDisposed()}));},
  disconnect(){wantOn=false;disconnect();},reconnect(){wantOn=true;retry=0;clearTimeout(retryTimer);retryTimer=0;},hubUrl:()=>hubUrl(root.location,root.localStorage)};
})(globalThis);
