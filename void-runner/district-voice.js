/* Proximity voice (LiveKit), first stage (the owner, 15 Nov 2026). OFF until the player switches it on in the Comms app; switching it off disconnects.
   - The player hears the people in the same place: each voice comes from where that player's character stands, fades with distance, and is muffled and
     quieter when a wall is between you (the place's own collision boxes). Nobody is heard through The Darknet District's security doors, because the street
     and the interior are different places with different voice rooms (the hub decides the room; a VR session has its own).
   - Push-to-talk (a key the player can change) or an open microphone; mute; microphone and speaker choice; overall and per-player volume; per-player mute.
     A player you have muted or blocked in Messages is silent here too.
   - Microphone only: this code never asks for a camera or the screen, records nothing and transcribes nothing. Echo cancellation, noise suppression and
     automatic gain are requested from the browser.
   - The LiveKit client library is loaded only when voice is switched on; the access token comes from the hub (tools/district-hub/voice.cjs), is short-lived,
     and names one room. No key or secret is in this file.
   Not built yet: private and group calls, ringing, voice in the hub's reports, usage metering, character voice transformation.
   Pure rules (how loud by distance, settings) run in Node: tests/district-voice.test.cjs. */
(function(root){
 'use strict';
 const KEY='tdd-voice-v1',SDK='vendor/livekit-client-2.24.1.umd.js';
 const config={full:2.5,silent:32,curve:1.6,wallGain:.22,wallHz:900,openHz:20000,tickMs:100};
 const DEFAULTS={enabled:false,mode:'ptt',pttKey:'KeyV',muted:false,volume:1,mic:'',speaker:'',players:{}};
 /* 0..1: full within `full` metres, falling away to nothing at `silent`. */
 function loudness(dist){if(!(dist>=0))return 0;if(dist<=config.full)return 1;if(dist>=config.silent)return 0;const k=1-(dist-config.full)/(config.silent-config.full);return Math.pow(k,config.curve);}
 /* What one remote voice should be: {gain, hz}. vol: that player's own volume (0..2); muted: by the listener; blocked: a wall between. */
 function mix({dist,vol=1,muted=false,blocked=false,master=1}){if(muted)return {gain:0,hz:config.openHz};const g=loudness(dist)*Math.max(0,Math.min(2,vol))*Math.max(0,Math.min(1.5,master));return {gain:blocked?g*config.wallGain:g,hz:blocked?config.wallHz:config.openHz};}
 function cleanSettings(raw){const o={...DEFAULTS,players:{}};if(!raw||typeof raw!=='object')return o;
  o.enabled=false;   // never restored as on: voice starts only when the player presses ENABLE in this visit
  if(raw.mode==='open'||raw.mode==='ptt')o.mode=raw.mode;if(/^(Key[A-Z]|Digit[0-9]|Backquote|CapsLock|AltLeft|AltRight|ControlRight|Mouse[3-4])$/.test(String(raw.pttKey)))o.pttKey=raw.pttKey;
  o.muted=raw.muted===true;if(Number.isFinite(raw.volume))o.volume=Math.max(0,Math.min(1.5,raw.volume));
  for(const k of ['mic','speaker'])if(typeof raw[k]==='string'&&raw[k].length<200)o[k]=raw[k];
  if(raw.players&&typeof raw.players==='object')for(const [id,p] of Object.entries(raw.players).slice(0,200))if(/^[0-9a-f]{12}$/.test(id)&&p&&typeof p==='object')o.players[id]={vol:Number.isFinite(p.vol)?Math.max(0,Math.min(2,p.vol)):1,muted:p.muted===true};
  return o;}
 const pure={config,DEFAULTS,loudness,mix,cleanSettings};
 if(typeof module!=='undefined'&&module.exports){module.exports=pure;return;}
 if(typeof document==='undefined')return;

 const rp=()=>root.VoidRemotePlayers||null;
 let settings=cleanSettings((()=>{try{return JSON.parse(root.localStorage.getItem(KEY)||'null');}catch{return null;}})());
 const persist=()=>{try{root.localStorage.setItem(KEY,JSON.stringify({...settings,enabled:false}));}catch{}};
 let status='off',note='',room=null,roomName=null,talking=false,pttDown=false,connecting=false,sdkLoading=null,chip=null,seq=0;
 const voices=new Map();   // identity -> {gain, filter, panner, source, audio, track}
 const speaking=new Set(),listeners=new Set();
 const emit=()=>{for(const f of listeners)try{f();}catch{}paintChip();};
 const setStatus=(s,n='')=>{status=s;note=n;emit();};

 function loadSdk(){if(root.LivekitClient)return Promise.resolve(root.LivekitClient);if(sdkLoading)return sdkLoading;
  sdkLoading=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=new URL('void-runner/'+SDK,document.baseURI||location.href).href;s.onload=()=>root.LivekitClient?resolve(root.LivekitClient):reject(new Error('The voice library did not load.'));s.onerror=()=>{sdkLoading=null;reject(new Error('The voice library could not be downloaded.'));};document.head.appendChild(s);});
  return sdkLoading;}
 const bus=()=>root.VoidAudio?.bus?.('voice')||null;

 function attach(identity,track){
  detach(identity);const b=bus();if(!b)return;const ctx=b.context,ms=new MediaStream([track.mediaStreamTrack]);
  // Chrome only delivers a remote WebRTC track to Web Audio while it is also attached to a media element; that element stays silent.
  const audio=new Audio();audio.muted=true;audio.srcObject=ms;audio.play?.().catch(()=>{});
  const source=ctx.createMediaStreamSource(ms),gain=ctx.createGain(),filter=ctx.createBiquadFilter(),panner=ctx.createPanner();gain.gain.value=0;filter.type='lowpass';filter.frequency.value=config.openHz;
  panner.panningModel='HRTF';panner.distanceModel='linear';panner.refDistance=1;panner.maxDistance=10000;panner.rolloffFactor=0;   // distance is done by `gain` (walls and per-player volume included); the panner only gives direction
  source.connect(gain);gain.connect(filter);filter.connect(panner);panner.connect(b.node);voices.set(identity,{gain,filter,panner,source,audio,track});
 }
 function detach(identity){const v=voices.get(identity);if(!v)return;voices.delete(identity);try{v.source.disconnect();v.gain.disconnect();v.filter.disconnect();v.panner.disconnect();v.audio.srcObject=null;}catch{}speaking.delete(identity);}
 function listener(ctx){try{const cam=root.VoidBabylon?.scene?.activeCamera;if(!cam)return;const p=cam.globalPosition,f=cam.getForwardRay(1).direction,L=ctx.listener,t=ctx.currentTime;
  if(L.positionX){L.positionX.setTargetAtTime(p.x,t,.03);L.positionY.setTargetAtTime(p.y,t,.03);L.positionZ.setTargetAtTime(-p.z,t,.03);L.forwardX.setTargetAtTime(f.x,t,.03);L.forwardY.setTargetAtTime(0,t,.03);L.forwardZ.setTargetAtTime(-f.z,t,.03);}
  else{L.setPosition?.(p.x,p.y,-p.z);L.setOrientation?.(f.x,0,-f.z,0,1,0);}}catch{}}

 async function connect(){
  if(connecting||!settings.enabled)return;const r=rp();if(!r?.connected||!r.features?.voice){setStatus('waiting',r?.connected?'Voice is not available for this account or on this server.':'Not connected to other players yet.');return;}
  connecting=true;const my=++seq;setStatus('connecting');
  try{
   const LK=await loadSdk(),t=await r.voiceToken();if(my!==seq||!settings.enabled)return;
   await leave(false);
   const rm=new LK.Room({adaptiveStream:false,dynacast:false,audioCaptureDefaults:{echoCancellation:true,noiseSuppression:true,autoGainControl:true,...(settings.mic?{deviceId:settings.mic}:{})}});
   rm.on(LK.RoomEvent.TrackSubscribed,(track,pub,participant)=>{if(track.kind==='audio')attach(participant.identity,track);emit();});
   rm.on(LK.RoomEvent.TrackUnsubscribed,(track,pub,participant)=>{detach(participant.identity);emit();});
   rm.on(LK.RoomEvent.ParticipantDisconnected,participant=>{detach(participant.identity);emit();});
   rm.on(LK.RoomEvent.ActiveSpeakersChanged,list=>{speaking.clear();for(const p of list)speaking.add(p.identity);emit();});
   rm.on(LK.RoomEvent.Disconnected,()=>{if(room===rm){room=null;roomName=null;for(const id of [...voices.keys()])detach(id);talking=false;if(settings.enabled)setStatus('waiting','Voice disconnected. It will reconnect.');}});
   await rm.connect(t.url,t.token,{autoSubscribe:true});
   if(my!==seq||!settings.enabled){rm.disconnect();return;}
   room=rm;roomName=r.room;setStatus('on');await applyMic();
  }catch(e){if(my===seq)setStatus('error',String(e?.message||e).slice(0,140));}
  finally{connecting=false;}
 }
 async function leave(report=true){const rm=room;room=null;roomName=null;talking=false;for(const id of [...voices.keys()])detach(id);if(rm){try{await rm.disconnect();}catch{}}if(report)setStatus('off');}
 const wantMic=()=>!!room&&!settings.muted&&(settings.mode==='open'||pttDown);
 async function applyMic(){if(!room)return;const on=wantMic();try{await room.localParticipant.setMicrophoneEnabled(on);talking=on;note='';}
  catch(e){talking=false;note=/denied|NotAllowed/i.test(String(e))?'Microphone permission was refused. Allow the microphone for this site to talk.':'The microphone could not be opened.';}emit();}

 function tick(){
  if(!settings.enabled)return;const r=rp();
  if(!room){if(!connecting&&r?.connected&&r.features?.voice&&status!=='error')connect();return;}
  if(!r?.connected){leave(false).then(()=>setStatus('waiting','Not connected to other players.'));return;}
  if(r.room&&roomName&&r.room!==roomName&&!connecting){connect();return;}   // walked into another place: its voice room
  const b=bus();if(!b)return;listener(b.context);
  const peers=new Map((r.peers||[]).map(p=>[p.id,p])),ign=new Map((r.ignored||[]).map(([id,m])=>[id,m])),solids=typeof walkingLocation!=='undefined'&&walkingLocation?walkingLocation.solids:null,me=typeof walker!=='undefined'?walker:null,t=b.context.currentTime;
  for(const [id,v] of voices){const p=peers.get(id),own=settings.players[id]||{};let m={gain:0,hz:config.openHz};
   if(p&&me&&Number.isFinite(p.x)){const d=Math.hypot(p.x-me.x,p.z-me.z),blocked=!!root.VoidDeviceCamera?.sightBlocked?.(me.x,me.z,p.x,p.z,solids);m=mix({dist:d,vol:own.vol??1,muted:own.muted===true||ign.has(id),blocked,master:settings.volume});
    if(v.panner.positionX){v.panner.positionX.setTargetAtTime(p.x,t,.05);v.panner.positionY.setTargetAtTime(1.6,t,.05);v.panner.positionZ.setTargetAtTime(-p.z,t,.05);}else v.panner.setPosition?.(p.x,1.6,-p.z);}
   v.gain.gain.setTargetAtTime(m.gain,t,.08);v.filter.frequency.setTargetAtTime(m.hz,t,.1);}
 }
 setInterval(tick,config.tickMs);

 // Push-to-talk: hold the key (not while typing). The key is the player's choice (Comms app).
 const typing=e=>{const el=e.target;return !!(el&&(el.tagName==='INPUT'||el.tagName==='TEXTAREA'||el.tagName==='SELECT'||el.isContentEditable));};
 addEventListener('keydown',e=>{if(!settings.enabled||settings.mode!=='ptt'||e.code!==settings.pttKey||e.repeat||typing(e))return;pttDown=true;applyMic();});
 addEventListener('keyup',e=>{if(e.code!==settings.pttKey||!pttDown)return;pttDown=false;applyMic();});
 addEventListener('blur',()=>{if(pttDown){pttDown=false;applyMic();}});
 addEventListener('pagehide',()=>{leave(false);});

 // A small indicator while voice is on: your microphone state and who is speaking.
 function paintChip(){
  if(!chip){const css=document.createElement('style');css.textContent='#voice-chip{position:fixed;left:32px;bottom:64px;z-index:131;padding:5px 10px;font:11px/1.3 ui-monospace,Consolas,monospace;letter-spacing:.1em;color:#c9fffa;background:rgba(6,14,20,.82);border:1px solid #38808b;pointer-events:none;max-width:320px}#voice-chip[hidden]{display:none}#voice-chip.live{border-color:#9dff5a;color:#9dff5a}#voice-chip small{display:block;opacity:.8;letter-spacing:.06em}';document.head.appendChild(css);
   chip=document.createElement('div');chip.id='voice-chip';chip.hidden=true;chip.setAttribute('role','status');document.body.appendChild(chip);}
  const show=settings.enabled&&status!=='off';chip.hidden=!show;if(!show)return;const r=rp(),names=[...speaking].map(id=>(r?.peers||[]).find(p=>p.id===id)?.name).filter(Boolean).slice(0,3);
  chip.classList.toggle('live',talking);chip.textContent=status==='on'?(settings.muted?'MIC MUTED':talking?'MIC LIVE':settings.mode==='ptt'?'VOICE ON · HOLD '+keyLabel(settings.pttKey)+' TO TALK':'MIC OPEN'):status==='connecting'?'VOICE CONNECTING…':'VOICE · '+(note||'waiting');
  if(names.length){const s=document.createElement('small');s.textContent='speaking: '+names.join(', ');chip.appendChild(s);}
 }
 const keyLabel=code=>String(code).replace(/^Key|^Digit/,'').replace('Backquote','`').toUpperCase();

 const api={...pure,keyLabel,
  get settings(){return settings;},get status(){return status;},get note(){return note;},get talking(){return talking;},get speaking(){return [...speaking];},get connectedRoom(){return roomName;},
  onChange(fn){listeners.add(fn);return ()=>listeners.delete(fn);},
  async enable(){if(settings.enabled)return;settings.enabled=true;emit();await connect();},
  async disable(){settings.enabled=false;seq++;pttDown=false;await leave(true);},
  set(key,value){if(key==='mode'&&(value==='ptt'||value==='open'))settings.mode=value;else if(key==='muted')settings.muted=!!value;else if(key==='volume')settings.volume=Math.max(0,Math.min(1.5,Number(value)||0));
   else if(key==='pttKey'){const c=cleanSettings({pttKey:value});if(c.pttKey===value)settings.pttKey=value;}
   else if(key==='mic'){settings.mic=String(value||'').slice(0,200);if(room)room.switchActiveDevice?.('audioinput',settings.mic||'default').catch(()=>{});}
   else if(key==='speaker'){settings.speaker=String(value||'').slice(0,200);try{const ctx=bus()?.context;if(ctx?.setSinkId)ctx.setSinkId(settings.speaker||'').catch(()=>{});}catch{}}
   persist();applyMic();emit();},
  setPlayer(id,patch){if(!/^[0-9a-f]{12}$/.test(String(id)))return;const cur=settings.players[id]||{vol:1,muted:false};settings.players[id]={vol:patch.vol!==undefined?Math.max(0,Math.min(2,Number(patch.vol)||0)):cur.vol,muted:patch.muted!==undefined?!!patch.muted:cur.muted};persist();emit();},
  async devices(){try{const list=await navigator.mediaDevices.enumerateDevices();return {mics:list.filter(d=>d.kind==='audioinput').map(d=>({id:d.deviceId,label:d.label||'Microphone'})),speakers:list.filter(d=>d.kind==='audiooutput').map(d=>({id:d.deviceId,label:d.label||'Speaker'}))};}catch{return {mics:[],speakers:[]};}}
 };
 root.VoidVoice=api;
})(typeof globalThis!=='undefined'?globalThis:this);
