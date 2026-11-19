/* HACKED CAMERA FEEDS (the Blackrock Cult Room, the owner, 19 Nov 2026). A "Hack the access point" step with a camera feed (feed: '<id>', the mission's feeds list) does
   not open a door: when the hack finishes the screen switches to that camera, a security camera in a top corner of the room, looking down. The view works like the V1's
   Camera App (its frame, corner brackets and centre reticle, timecode, zoom on the mouse wheel; no battery: a wired security camera) with a REC light: RECORDING IS AUTOMATIC. It starts as the feed comes up (the
   initiate already kneeling, just before the six enter) and stops by itself when the scene has ended (everyone gone, the door shut). The recording is saved in the V1
   Gallery as a video (WebM in this browser only, never uploaded: device-gallery.js addVideo) and the view returns to the player at once, where they stood.
   THE PLAYER IS SAFE: while the feed shows, the game's own update is not run (time stands still for the player and the world they are in; nothing can reach them) and
   their keys do nothing; only the wheel zooms. THE STEP COMPLETES when the recording is saved (mission event {type:'feed', ap, feed, mission}, live-content.js feedSaved).
   If the Gallery is full the scene still plays but the step waits: the player frees space and hacks the camera again.
   THE RECORDING: the game's canvas drawn each frame into a 960 x 540 picture with the camera's own burn-in (camera name, date and time, REC) and the words of any line
   (none while a line is still empty), captured with MediaRecorder at 24 frames a second; the bitrate is set from the scene's length so a file stays under the Gallery's
   48 MB cap. Lines with an imported voice file play through the game's voice system (voice-clips.js).
   Browser only. The Mission Editor's PREVIEW plays the same feed without recording (VoidCameraFeed.preview). */
(function(root){
 'use strict';
 if(typeof document==='undefined')return;
 const CR=()=>root.VoidCultRoom,BLD=()=>root.VoidCultRoomBuild,G=()=>root.VoidGallery;
 const OUT={w:960,h:540,fps:24},MIN_BPS=450000,MAX_BPS=1600000;
 let F=null,hooked=false,speed=1;
 const css=document.createElement('style');css.textContent='#cam-feed{position:fixed;inset:0;z-index:90;pointer-events:none;font:13px/1.35 ui-monospace,Consolas,monospace;color:#d8e6dc;text-shadow:0 0 3px #000}#cam-feed[hidden]{display:none}'
  +'#cam-feed .cf-tl{position:absolute;left:5.6vmin;top:4.6vmin}#cam-feed .cf-tr{position:absolute;right:5.6vmin;top:4.6vmin;text-align:right}#cam-feed .cf-bl{position:absolute;left:5.6vmin;bottom:4.6vmin}#cam-feed .cf-br{position:absolute;right:5.6vmin;bottom:4.6vmin;text-align:right}'
  +'#cam-feed .cf-rec{color:#ff4040;font-weight:700}#cam-feed .cf-rec i{display:inline-block;width:10px;height:10px;border-radius:50%;background:#ff3030;margin-right:6px;animation:cfblink 1s steps(2) infinite}@keyframes cfblink{50%{opacity:.15}}'
  +'#cam-feed .cf-say{position:absolute;left:50%;bottom:11vh;transform:translateX(-50%);max-width:70vw;text-align:center;font:15px/1.4 ui-monospace,Consolas,monospace;background:rgba(0,0,0,.55);padding:6px 12px;border-radius:3px}#cam-feed .cf-say:empty{display:none}'
  +'#cam-feed .cf-msg{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);font:700 18px/1.4 ui-monospace,Consolas,monospace;letter-spacing:.14em;background:rgba(0,0,0,.7);padding:10px 18px;border:1px solid rgba(220,235,225,.5)}#cam-feed .cf-msg:empty{display:none}'
  +'#cam-feed .cf-scan{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.18) 0 1px,transparent 1px 3px);mix-blend-mode:multiply}';
 document.head.append(css);
 let el=null;const $=k=>el.querySelector('[data-cf='+k+']');
 function build(){el=document.createElement('div');el.id='cam-feed';el.hidden=true;el.setAttribute('role','img');el.setAttribute('aria-label','Hacked security camera feed');
  const corner=c=>'<i class="pc-corner '+c+'"></i>';reticleCss();
  el.innerHTML='<div class="cf-scan"></div><div class="pc-frame">'+corner('tl')+corner('tr')+corner('bl')+corner('br')+'<i class="pc-edge t"></i><i class="pc-edge b"></i></div><div class="pc-aperture">'+corner('tl')+corner('tr')+corner('bl')+corner('br')+'<i class="pc-cross"></i></div>'   // the V1 Camera App's own frame and reticle (device-camera.js build)
   +'<div class="cf-tl"><div data-cf="cam">CAM B2-07 · SUB-LEVEL 2</div><div data-cf="date"></div></div>'
   +'<div class="cf-tr"><div class="cf-rec" data-cf="rec"><i></i>REC <b data-cf="rect">00:00:00</b></div><div>SIGNAL <b>HIJACKED</b></div></div>'
   +'<div class="cf-bl"><div>Zoom <b data-cf="zoom">1x</b></div><div>WHEEL · ZOOM &nbsp; RECORDING STOPS BY ITSELF</div></div>'
   +'<div class="cf-br"><div data-cf="tc">00:00:00:00</div><div>FPS : <b data-cf="fps">0</b></div></div><div class="cf-say" data-cf="say"></div><div class="cf-msg" data-cf="msg"></div>';
  document.body.append(el);}
 /* THE RETICLE (the owner, 19 Nov 2026: "put the reticle on the camera view just like the camera"): the V1 Camera App's frame (corner brackets, edge ticks) and centre
    aperture with its crosshair, the same markup as device-camera.js, styled by the Camera App's own rules in device-v1.css, copied here at run time from '#pd-camera'
    to '#cam-feed' (so a change to the Camera App's look changes this too). On screen only: like the Camera App's photos, the saved recording does not carry it. */
 function reticleCss(){if(document.getElementById('cam-feed-reticle'))return;const out=[];
  for(const sh of document.styleSheets){let rules;try{rules=sh.cssRules;}catch{continue;}for(const r of rules||[]){const sel=r.selectorText;if(!sel||!sel.includes('#pd-camera'))continue;
   const parts=sel.split(',').map(x=>x.trim()).filter(x=>x.startsWith('#pd-camera')&&!x.includes('[data-device'));if(!parts.length)continue;const vars=r.style.getPropertyValue('--pd-edge-hi');
   if(/pc-(frame|corner|edge|aperture|cross)/.test(sel))out.push(parts.join(',').replace(/#pd-camera/g,'#cam-feed')+'{'+r.style.cssText+'}');
   else if(vars&&parts.includes('#pd-camera'))out.push('#cam-feed{'+[...r.style].filter(k=>k.startsWith('--')).map(k=>k+':'+r.style.getPropertyValue(k)).join(';')+'}');}}
  const st=document.createElement('style');st.id='cam-feed-reticle';st.textContent=out.join('\n')+'\n@keyframes pc-pulse{50%{opacity:.6}}';document.head.append(st);}
 const two=n=>String(Math.floor(n)).padStart(2,'0'),hms=s=>two(s/3600)+':'+two(s/60%60)+':'+two(s%60);
 // ---- the game loop: while a feed shows, the player's world does not update and is not drawn (draw / update are game.js functions, wrapped once) ----
 function hook(){if(hooked)return true;if(typeof draw!=='function'||typeof update!=='function')return false;const od=draw,ou=update;
  draw=function(){if(F){try{frame();}catch(e){console.error('[camera feed]',e);end(null);}return;}return od.apply(this,arguments);};
  update=function(){if(F)return;return ou.apply(this,arguments);};hooked=true;return true;}
 // everything on screen but the game's canvas is hidden while the feed shows (the HUD, prompts, the mission tracker), then put back as it was
 function hideOthers(cv){const out=[];let n=cv;if(!n||!n.parentElement)return out;while(n&&n!==document.body&&n.parentElement){for(const s of n.parentElement.children){if(s===n||s===el||s.tagName==='SCRIPT'||s.tagName==='STYLE')continue;out.push([s,s.style.visibility]);s.style.visibility='hidden';}n=n.parentElement;}return out;}
 const keyBlock=e=>{if(!F)return;e.preventDefault();e.stopImmediatePropagation();};
 function onWheel(e){if(!F)return;e.preventDefault();e.stopImmediatePropagation();const z=CR().ROOM.camera.zooms,now=performance.now();F.wacc+=e.deltaY;if(Math.abs(F.wacc)<40||now-F.wlast<110)return;F.zi=Math.max(0,Math.min(z.length-1,F.zi+(F.wacc<0?1:-1)));F.wacc=0;F.wlast=now;F.room.camera.fov=CR().ROOM.camera.fov/z[F.zi];$('zoom').textContent=z[F.zi]+'x';}
 function dateLine(){try{if(root.VoidClock&&typeof state!=='undefined'&&state)return root.VoidClock.now(state).label;}catch{}return new Date().toISOString().slice(0,19).replace('T',' ');}
 /* Play a feed. o: {scene (the mission's timeline), room, record (default true), label, onSaved}. -> Promise of {saved: record|null, why}. */
 function start(o={}){if(F)return Promise.resolve({saved:null,why:'busy'});if(!hook())return Promise.resolve({saved:null,why:'the game is not ready'});
  const C=CR(),Bd=BLD();if(!C||!Bd||!root.BABYLON)return Promise.resolve({saved:null,why:'the camera feed could not load'});
  const main=root.VoidBabylon?.scene,engine=main?main.getEngine():null;if(!engine)return Promise.resolve({saved:null,why:'the 3D view is not running'});
  if(!el)build();
  return new Promise(done=>{const room=Bd.create(engine,{scene:o.scene,quality:root.VoidBabylon?.quality});const cv=engine.getRenderingCanvas();
   F={o,room,engine,cv,t:0,last:performance.now(),zi:0,wacc:0,wlast:0,done,rec:null,chunks:[],poster:null,ending:false,cs:room.compiled,spoken:new Set(),hidden:hideOthers(document.getElementById('space')||cv),startedAt:0,lastHud:0};
   try{document.exitPointerLock?.();}catch{}
   el.hidden=false;$('zoom').textContent='1x';$('msg').textContent='CONNECTING TO CAM B2-07…';$('say').textContent='';$('rec').style.visibility=o.record===false?'hidden':'visible';document.body.classList.add('cam-feed-on');
   addEventListener('keydown',keyBlock,{capture:true});addEventListener('keyup',keyBlock,{capture:true});addEventListener('wheel',onWheel,{passive:false,capture:true});
   F.comp=document.createElement('canvas');F.comp.width=OUT.w;F.comp.height=OUT.h;F.g=F.comp.getContext('2d');
   const go=()=>{if(!F)return;$('msg').textContent='';F.last=performance.now();F.live=true;if(o.record!==false)F.rec=recorder();};
   room.loaded.then(()=>{if(room.failed){$('msg').textContent='NO SIGNAL';setTimeout(()=>end(null,'the figures could not load'),1500);return;}setTimeout(go,600);});});}
 function recorder(){const s=F.comp.captureStream?F.comp.captureStream(OUT.fps):null;if(!s||typeof MediaRecorder==='undefined')return null;
  const type=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(t=>MediaRecorder.isTypeSupported?.(t))||'';const dur=Math.max(10,F.cs.dur/speed),cap=(G()?.VIDEO?.maxBytes||48e6)*8*.82/dur;
  const bps=Math.round(Math.max(MIN_BPS,Math.min(MAX_BPS,cap)));let r;try{r=new MediaRecorder(s,{...(type?{mimeType:type}:{}),videoBitsPerSecond:bps});}catch{return null;}
  r.ondataavailable=e=>{if(e.data&&e.data.size)F&&F.chunks.push(e.data);};r.start(1000);F.startedAt=performance.now();F.bps=bps;return r;}
 // the burn-in the recording carries (the on-screen overlay is the DOM above)
 function burn(g,t){const W=OUT.w,H=OUT.h;g.fillStyle='rgba(0,0,0,.09)';for(let y=0;y<H;y+=3)g.fillRect(0,y,W,1);
  g.font='bold 15px ui-monospace,Consolas,monospace';g.textBaseline='top';g.fillStyle='rgba(0,0,0,.5)';g.fillRect(14,12,300,40);g.fillStyle='#dfe9e2';g.fillText('CAM B2-07  SUB-LEVEL 2',22,16);g.font='13px ui-monospace,Consolas,monospace';g.fillText(F.date,22,34);
  g.fillStyle='rgba(0,0,0,.5)';g.fillRect(W-150,12,136,22);g.fillStyle=(t*2|0)%2?'#ff4040':'#7a2020';g.beginPath();g.arc(W-138,23,5,0,7);g.fill();g.fillStyle='#ff6a6a';g.font='bold 14px ui-monospace,Consolas,monospace';g.fillText('REC '+hms(t),W-126,16);
  const say=CR().lineAt(F.cs,F.t);if(say.length){g.font='15px ui-monospace,Consolas,monospace';const txt=say.map(l=>l.name.toUpperCase()+': '+l.text).join('   ');const w=Math.min(W-40,g.measureText(txt).width+24);g.fillStyle='rgba(0,0,0,.6)';g.fillRect((W-w)/2,H-58,w,28);g.fillStyle='#e8eee8';g.textAlign='center';g.fillText(txt,W/2,H-52,W-60);g.textAlign='left';}
  g.globalAlpha=.06;for(let i=0;i<60;i++){g.fillStyle=Math.random()<.5?'#fff':'#000';g.fillRect(Math.random()*W,Math.random()*H,2,2);}g.globalAlpha=1;}
 function frame(){const now=performance.now(),dt=Math.min(.1,(now-F.last)/1000);F.last=now;
  if(F.live&&!F.ending)F.t+=dt*speed;
  F.room.tick(F.t);F.room.scene.render();
  try{if(typeof ctx!=='undefined'&&typeof W!=='undefined'){ctx.clearRect(0,0,W,H);ctx.drawImage(F.cv,0,0,W,H);}}catch{}   // the game shows its 3D through the #space canvas (babylon-integration.js draw)
  if(!F.live)return;
  // lines: an imported (or recorded) voice for these exact words plays once, as the line starts
  for(const e of F.cs.events){if(e.type!=='line'||!e.text||F.spoken.has(e)||F.t<e.t)continue;F.spoken.add(e);try{const V=root.VoidVoiceClips;if(V?.has?.(e.who,e.text))V.speak({characterId:e.who,text:e.text});}catch{}}
  if(!F.date||now-F.lastHud>400){F.date=dateLine();F.lastHud=now;$('date').textContent=F.date;$('rect').textContent=hms(F.t);$('fps').textContent=String(Math.round(F.engine.getFps()));const say=CR().lineAt(F.cs,F.t);$('say').textContent=say.map(l=>l.name+': '+l.text).join('  ·  ');}
  $('tc').textContent=hms(F.t)+':'+two((F.t%1)*24);
  if(F.rec||F.o.record!==false){const g=F.g;g.drawImage(F.cv,0,0,OUT.w,OUT.h);burn(g,F.t);if(!F.poster&&F.t>=Math.min(F.cs.dur*.3,(F.cs.events.find(e=>e.type==='line')||{t:F.cs.dur*.3}).t+.5))F.comp.toBlob(b=>{if(F)F.poster=b;},'image/jpeg',.8);}
  if(F.t>=F.cs.dur&&!F.ending){F.ending=true;finish();}}
 async function finish(){const f=F;let saved=null,why='';
  if(f.rec){const stopped=new Promise(r=>{f.rec.onstop=r;});try{f.rec.stop();}catch{}await stopped;const blob=new Blob(f.chunks,{type:(f.rec.mimeType||'video/webm').split(';')[0]});
   const secs=f.cs.dur/speed,dev=(()=>{try{return root.VoidDeviceV1.restore((typeof state!=='undefined'&&state)?.story?.flags||{});}catch{return null;}})();
   let meta=null;try{meta={subjects:[],place:null,during:root.VoidLiveContent?.during?.()||[],at:Date.now(),device:root.VoidDeviceId?.now?.()||''};const c=root.VoidClock;if(c&&typeof state!=='undefined'&&state){meta.gameMin=c.minutes(state);meta.gameTime=c.now(state).label;}}catch{}
   try{saved=await G()?.addVideo?.(dev,{blob,poster:f.poster,duration:Math.max(1,secs),place:'Security camera · CAM B2-07',label:f.o.label||'',meta});}catch{saved=null;}
   why=saved?'':G()&&G().room&&G().room(dev)<(G().VIDEO_PCT||5)?'V1 STORAGE FULL':blob.size>(G()?.VIDEO?.maxBytes||48e6)?'THE RECORDING IS TOO LARGE':'THE RECORDING COULD NOT BE SAVED';
   $('rec').style.visibility='hidden';$('msg').textContent=saved?'RECORDING SAVED · V1 GALLERY':why;await new Promise(r=>setTimeout(r,saved?1600:2600));}
  else if(f.o.record!==false){why='THIS BROWSER CANNOT RECORD VIDEO';$('msg').textContent=why;await new Promise(r=>setTimeout(r,2000));}
  end(saved,why);}
 function end(saved,why){const f=F;if(!f)return;F=null;try{f.rec&&f.rec.state!=='inactive'&&f.rec.stop();}catch{}try{f.room.dispose();}catch{}
  for(const [n,v] of f.hidden)n.style.visibility=v;el.hidden=true;$('msg').textContent='';document.body.classList.remove('cam-feed-on');
  removeEventListener('keydown',keyBlock,{capture:true});removeEventListener('keyup',keyBlock,{capture:true});removeEventListener('wheel',onWheel,{capture:true});
  f.done({saved:saved||null,why:why||''});if(saved&&f.o.onSaved)try{f.o.onSaved(saved);}catch{}}
 F=null;
 // ---- missions: a hack step with a camera feed plays the feed; the saved recording completes the step ----
 function feedOf(job){const env=root.VoidLiveContent?.env;const trees=(env&&env.trees)||[];for(const t of trees)for(const m of t.missions||[])if(m.id===job.mission){const f=(m.feeds||[]).find(x=>x.id===job.feed);return f?{f,m}:null;}return null;}
 function install(){const LC=root.VoidLiveContent;if(!LC||LC.__cameraFeed)return !!LC;const orig=LC.hack;
  LC.hack=job=>{if(job&&job.feed){const x=feedOf(job);if(!x){try{announce('CAMERA: no signal.');}catch{}return null;}
    start({scene:x.f.scene,room:x.f.room,label:x.m.title||'',onSaved:()=>{try{LC.feedSaved?.(job);}catch{}}}).then(r=>{if(!r.saved&&r.why)try{announce('CAMERA FEED: '+r.why.toLowerCase()+'. '+(r.why==='V1 STORAGE FULL'?'Delete photos in the Gallery, then hack the camera again.':'Hack the camera again.'));}catch{}});return {feed:true};}
   return orig(job);};LC.__cameraFeed=true;return true;}
 const wait=setInterval(()=>{if(install())clearInterval(wait);},300);
 root.VoidCameraFeed={start,preview:scene=>start({scene,record:false}),end:()=>end(null,'stopped'),install,get active(){return !!F;},get time(){return F?F.t:0;},get duration(){return F?F.cs.dur:0;},get recording(){return !!(F&&F.rec);},get room(){return F?F.room:null;},
  get speed(){return speed;},set speed(v){speed=Math.max(.25,Math.min(40,Number(v)||1));},OUT};   // speed: for tests and the editor's quick look only (the real feed plays at 1)
})(globalThis);
