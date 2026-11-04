/* Sleeping pod music: the wall screen in the District's sleeping-pod room and the player behind it.
   Two sources share one player: the Darknet District website playlist (its own songs, streamed from the site) and "My music", songs the player picks
   from their own computer. Picked songs are played through private object URLs and never leave this browser: no request, no upload, no copy in the
   repository. Optionally ("Keep my songs in this browser") copies are kept in browser storage on this device only.
   The sound goes through the game's own music channel (VoidAudio.connectMedia), so the game's music volume, mute and suspend apply, and an analyser on
   that channel drives the wall screen's LED spectrum. The playing music replaces the city score while the player is in the District.
   Nothing here touches the network except streaming the website playlist's own files, and nothing is saved in the campaign: it is invisible to multiplayer.
   The rules for what plays next are in pod-playlist.js (pure, unit tested). */
(function(root){
 'use strict';
 const PL=root.PodPlaylist;
 const SITE=['Android Love','Cyber Silence (Extended) (2)','CyberLoom (Extended)','Eclipse','Eternal Paradox','Fuck the System  (2.0)','Ghost 1.0','Psychedelic Upgrade','Pulse (Extended)','RetroVibe (Extended)','Upgrades (Extended Mix)','Vaporia','Yearning Pulse 02 (Cover) (1)','Это всё дерьмо 3.0','谢谢你送来的猫咪','Nexus DataCore (Cover)','Meta Mist (2.0)','Sheep','Nights in Chongqing 3.0','MetaMist','SexBot (Cover)','Sanctum of the Circuit','The City (Cover)_1749857657755','The City (Extended)_1749857657712','Synthetic Touch','Synthetic Touch (Her) (02) (Cover)','BlackRock Leash (Cover)_1754669325561'];
 const DB='darknet-pod-music',STORE='songs',KEEP_FLAG='darknet-pod-music-keep',KEEP_LIMIT=500*1024*1024,BANDS=24,ROWS=12;
 const lists={website:PL.createPlaylist(),mine:PL.createPlaylist()};
 lists.website.add(SITE.map(n=>({name:n.replace(/_\d{10,}$/,'')+'.mp3',size:0,lastModified:0,url:'attached_assets/'+encodeURIComponent(n).replace(/%20/g,' ')+'.mp3'})));
 let source='website',audio=null,link=null,analyser=null,freq=null,volume=.8,objectUrl=null,loadedKey=null,failures=0,status='',keeping=false,keptBytes=0,order=0,restored=false,ticker=0;
 const positions={website:0,mine:0},levels=new Float32Array(BANDS),peaks=new Float32Array(BANDS);
 const byId=id=>document.getElementById(id);
 const esc=t=>typeof escapeText==='function'?escapeText(t):String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const current=()=>lists[source].find(lists[source].currentId);
 const isPlaying=()=>!!audio&&!audio.paused&&!audio.ended&&!!audio.src;

 // ── Browser-local storage (opt-in): the song files, in IndexedDB on this device. Never sent anywhere. ──
 function openDb(){return new Promise((ok,no)=>{if(!root.indexedDB)return no(Error('no IndexedDB'));const r=root.indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE,{keyPath:'key'});r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);});}
 function tx(mode,fn){return openDb().then(db=>new Promise((ok,no)=>{const t=db.transaction(STORE,mode),req=fn(t.objectStore(STORE));t.oncomplete=()=>{db.close();ok(req&&req.result);};t.onerror=t.onabort=()=>{db.close();no(t.error);};}));}
 const store={all:()=>tx('readonly',s=>s.getAll()).then(r=>(r||[]).sort((a,b)=>a.order-b.order)),put:row=>tx('readwrite',s=>{s.put(row);}),del:key=>tx('readwrite',s=>{s.delete(key);}),clear:()=>tx('readwrite',s=>{s.clear();})};
 const keepFlag=v=>{try{if(v===undefined)return root.localStorage.getItem(KEEP_FLAG)==='1';if(v)root.localStorage.setItem(KEEP_FLAG,'1');else root.localStorage.removeItem(KEEP_FLAG);}catch(e){/* blocked: nothing is kept */}return !!v;};
 function keepTrack(t){
  if(t.kept||!t.file)return;
  if(keptBytes+t.file.size>KEEP_LIMIT){say('Not kept: "'+t.label+'" is over the '+Math.round(KEEP_LIMIT/1048576)+' MB limit for saved songs. It still plays this visit.');return;}
  store.put({key:t.key,name:t.name,size:t.size,lastModified:t.lastModified,order:order++,file:t.file}).then(()=>{t.kept=true;keptBytes+=t.file.size;}).catch(()=>say('Could not keep "'+t.label+'" in this browser (storage full or blocked). It still plays this visit.'));
 }
 function setKeeping(on){
  keeping=on;keepFlag(on);
  if(on){root.navigator?.storage?.persist?.().catch(()=>{});lists.mine.tracks.forEach(keepTrack);say('Your songs are kept in this browser on this device. They are never uploaded.');}
  else{store.clear().catch(()=>{});lists.mine.tracks.forEach(t=>{t.kept=false;});keptBytes=0;say('Saved copies removed from this browser. Your list stays until you leave the game.');}
 }
 function restore(){
  if(restored)return;restored=true;if(!keepFlag())return;keeping=true;
  store.all().then(rows=>{const r=lists.mine.add(rows.map(x=>({name:x.name,size:x.size,lastModified:x.lastModified,file:x.file,kept:true})));rows.forEach(x=>{keptBytes+=x.size;order=Math.max(order,x.order+1);});if(r.added.length)say('Restored '+r.added.length+(r.added.length===1?' song':' songs')+' kept in this browser.');render();}).catch(()=>{keeping=false;});
 }

 // ── The player ──
 function say(text){status=text||'';const el=byId('pod-music-status');if(el)el.textContent=status;}
 function ensureAudio(){
  if(audio)return !!link;
  audio=new Audio();audio.preload='auto';audio.volume=volume;
  link=root.VoidAudio?.connectMedia?.(audio,'music')||null;
  if(link){try{analyser=link.context.createAnalyser();analyser.fftSize=1024;analyser.smoothingTimeConstant=.55;link.gain.connect(analyser);freq=new Uint8Array(analyser.frequencyBinCount);}catch(e){analyser=null;}}
  audio.addEventListener('ended',()=>{if(!pending&&loadedKey)advance(true);}); // after Clear or Remove no song is loaded: a late ended event must not change the message
  audio.addEventListener('error',onError);
  audio.addEventListener('playing',()=>{failures=0;render();});
  audio.addEventListener('pause',()=>render());
  if(!link)say('Audio is not available (check Settings, Audio).');
  return !!link;
 }
 let pending=false;
 function load(seek){
  const t=current();if(!t||!ensureAudio())return false;
  if(source==='mine'){if(objectUrl)root.URL.revokeObjectURL(objectUrl);objectUrl=root.URL.createObjectURL(t.file);audio.src=objectUrl;}else audio.src=t.url;
  loadedKey=source+':'+t.id;audio.volume=volume;
  if(seek>0)audio.addEventListener('loadedmetadata',()=>{audio.currentTime=seek;},{once:true});
  audio.play().catch(e=>{if(e&&e.name==='NotAllowedError')say('Press play to start the music.');}); // a file that cannot be decoded is reported by the error handler, not here
  render();return true;
 }
 function start(){const l=lists[source];if(!l.size){say(source==='mine'?'Add songs first.':'No songs.');return;}if(l.currentId===null)l.next(false);load(0);}
 function toggle(){
  if(!ensureAudio())return;const t=current();
  if(!t||loadedKey!==source+':'+t.id){if(!t)return start();return load(positions[source]);}
  if(audio.paused)audio.play().catch(()=>{});else audio.pause();render();
 }
 function advance(auto){const l=lists[source],id=l.next(!!auto);if(id===null){if(auto){audio.pause();say('End of the list.');render();}return;}load(0);}
 function previous(){const l=lists[source];if(audio&&audio.currentTime>3&&loadedKey===source+':'+l.currentId){audio.currentTime=0;return;}if(l.previous()!==null)load(0);}
 function onError(){
  const l=lists[source],t=current();if(!t||!loadedKey)return;t.failed=true;failures++;
  if(failures>=l.size){audio.pause();say(source==='mine'?'None of these files could be played in this browser.':'The website songs could not be loaded.');render();return;}
  say('Could not play "'+t.label+'". Skipping it.');advance(true);
 }
 function switchSource(next){
  if(next===source)return;
  if(audio&&loadedKey)positions[source]=audio.currentTime||0;if(audio)audio.pause();
  source=next;if(source==='mine')restore();render();
 }
 function canPlay(f){const type=PL.MIME_BY_EXTENSION[PL.extensionOf(f.name)]||f.type||'';try{return !type||new Audio().canPlayType(type)!=='';}catch(e){return true;}}
 function addFiles(files){
  const picked=[...(files||[])],bad=[],cannot=[],ok=[];
  for(const f of picked){if(!PL.isAudioFile(f))bad.push(f.name);else if(!canPlay(f))cannot.push(f.name);else ok.push({name:f.name,size:f.size,lastModified:f.lastModified,file:f});}
  const idle=source!=='mine'||!isPlaying(),r=lists.mine.add(ok),parts=[];
  if(r.added.length)parts.push('Added '+r.added.length+(r.added.length===1?' song.':' songs.'));
  if(r.skipped)parts.push(r.skipped+' already in the list.');
  if(bad.length)parts.push('Skipped '+bad.length+' that '+(bad.length===1?'is':'are')+' not audio: '+bad.slice(0,3).join(', ')+(bad.length>3?'…':'')+'.');
  if(cannot.length)parts.push('This browser cannot play: '+cannot.slice(0,3).join(', ')+(cannot.length>3?'…':'')+'.');
  if(!picked.length)parts.push('No files chosen.');
  say(parts.join(' '));
  if(keeping)r.added.forEach(keepTrack);
  if(r.added.length&&idle){if(source!=='mine'&&audio)audio.pause();source='mine';lists.mine.select(r.added[0].id);load(0);}else render();
 }
 function removeTrack(id){
  const l=lists.mine,t=l.find(id),wasPlaying=id===l.currentId&&isPlaying(),out=l.remove(id);if(!out.removed)return;
  if(keeping&&t&&t.kept){store.del(t.key).catch(()=>{});keptBytes-=t.file.size;}
  if(out.wasCurrent){if(objectUrl){root.URL.revokeObjectURL(objectUrl);objectUrl=null;}loadedKey=null;if(audio)audio.pause();if(out.replacement&&wasPlaying&&source==='mine')load(0);}
  say('Removed "'+(t?t.label:'song')+'".');render();
 }
 function clearMine(){
  const l=lists.mine,n=l.size;if(!n)return;l.clear();if(objectUrl){root.URL.revokeObjectURL(objectUrl);objectUrl=null;}
  if(source==='mine'&&audio){audio.pause();loadedKey=null;}if(keeping){store.clear().catch(()=>{});keptBytes=0;}
  say('Playlist cleared ('+n+(n===1?' song':' songs')+').');render();
 }

 // ── Spectrum: the same LED columns as the website's sleeping pod ──
 let bandsAt=0;
 function bands(){
  const now=performance.now();if(now-bandsAt<30)return levels;const dt=Math.min(.1,(now-bandsAt)/1000||.03);bandsAt=now;
  const live=analyser&&isPlaying();if(live)analyser.getByteFrequencyData(freq);
  const ny=link?.context?.sampleRate/2||24000,n=freq?freq.length:1,ka=1-Math.exp(-dt/.04),kr=1-Math.exp(-dt/.18);
  for(let b=0;b<BANDS;b++){
   let target=0;
   if(live){const f0=60*Math.pow(14000/60,b/BANDS),f1=60*Math.pow(14000/60,(b+1)/BANDS),lo=Math.max(0,Math.floor(f0/ny*n)),hi=Math.max(lo+1,Math.ceil(f1/ny*n));let sum=0,max=0;for(let k=lo;k<hi&&k<n;k++){sum+=freq[k];if(freq[k]>max)max=freq[k];}const v=(.5*sum/(hi-lo)+.5*max)/255;target=Math.min(1,Math.pow(v,1.2)*(.95+.55*b/(BANDS-1)));}
   levels[b]+=(target-levels[b])*(target>levels[b]?ka:kr);if(levels[b]<.002)levels[b]=0;
   if(levels[b]>=peaks[b])peaks[b]=levels[b];else peaks[b]=Math.max(0,peaks[b]-1.2*dt);
  }
  return levels;
 }
 function led(g,x,y,w,h){
  const lv=bands(),cw=w/BANDS,rh=h/ROWS;
  for(let b=0;b<BANDS;b++){const lit=lv[b]*ROWS,peak=Math.min(ROWS-1,Math.floor(peaks[b]*ROWS));for(let r=0;r<ROWS;r++){
   const a=Math.max(.12,Math.min(1,(lit-r)*2)),c=r<7?'53,255,120':r<10?'255,226,74':'255,61,79';g.fillStyle='rgba('+c+','+((lit-r<=0&&peaks[b]>.02&&r===peak)?.95:a).toFixed(2)+')';g.fillRect(x+b*cw+1,y+h-(r+1)*rh+1,cw-2,rh-2);}}
 }
 const clock=s=>PL.formatTime(s);
 /* The wall screen (neochinatown.js owns the mesh and calls this a few times a second while the player is near). */
 function drawScreen(g,W,H,t){
  g.fillStyle='#04070a';g.fillRect(0,0,W,H);g.strokeStyle='rgba(47,224,196,.6)';g.lineWidth=3;g.strokeRect(5,5,W-10,H-10);
  g.fillStyle='#2fe0c4';g.font='bold 26px monospace';g.fillText('POD MUSIC',20,38);g.fillStyle='#ff3fb4';g.fillRect(20,44,70,3);
  g.textAlign='right';g.fillStyle='#8fcfc2';g.font='17px monospace';g.fillText(source==='mine'?'MY MUSIC':'WEBSITE PLAYLIST',W-20,34);g.textAlign='left';
  const tr=current(),shown=tr?tr.label:(source==='mine'?'NO SONGS YET':'PRESS E TO CHOOSE');
  g.fillStyle='#e6fff7';g.font='bold 22px monospace';let name=shown.toUpperCase();while(name.length>3&&g.measureText(name).width>W-40)name=name.slice(0,-2);if(name.length<shown.length)name=name.trimEnd()+'…';g.fillText(name,20,84);
  const dur=audio&&isFinite(audio.duration)?audio.duration:0,pos=audio&&loadedKey?audio.currentTime||0:0;
  g.fillStyle='rgba(47,224,196,.2)';g.fillRect(20,100,W-40,6);g.fillStyle='#35ff8f';g.fillRect(20,100,dur?(W-40)*Math.min(1,pos/dur):0,6);
  g.fillStyle='#8fcfc2';g.font='17px monospace';g.fillText(clock(pos)+' / '+clock(dur),20,128);g.textAlign='right';g.fillText((isPlaying()?'PLAYING':audio&&loadedKey?'PAUSED':'STOPPED')+(lists[source].shuffle?'  SHUFFLE':'')+(lists[source].repeat!=='off'?'  REPEAT '+lists[source].repeat.toUpperCase():''),W-20,128);g.textAlign='left';
  g.fillStyle='#03090a';g.fillRect(20,140,W-40,90);led(g,24,144,W-48,82);
  const pulse=.55+.45*Math.sin(t*4);g.fillStyle='rgba(232,251,255,'+pulse.toFixed(2)+')';g.font='bold 20px monospace';g.fillText('[E] OPEN THE PLAYER',20,H-24);
 }

 // ── The panel (opened with E at the wall screen) ──
 function css(){
  /* #pod-music has bottom padding so the whole panel can scroll clear of the game footer, which is fixed to the bottom of the window */
  if(byId('pod-music-style'))return;const s=document.createElement('style');s.id='pod-music-style';
  s.textContent='#pod-music{display:grid;gap:10px;max-width:640px;padding-bottom:96px}#pod-music .row{display:flex;flex-wrap:wrap;gap:8px}#pod-music button.on{background:#35ff8f;color:#03130c}#pod-music canvas{width:100%;height:70px;background:#03090a;border:1px solid rgba(47,224,196,.35)}#pod-music .now{color:#e6fff7;font-weight:700;min-height:1.4em}#pod-music .bar{height:10px;background:rgba(47,224,196,.2);cursor:pointer}#pod-music .bar i{display:block;height:100%;width:0;background:#35ff8f}#pod-music ol{list-style:none;margin:0;padding:0;max-height:150px;overflow:auto;border:1px solid rgba(47,224,196,.3)}#pod-music li{display:flex;border-bottom:1px solid rgba(47,224,196,.12)}#pod-music li.cur{background:rgba(53,255,143,.16)}#pod-music li.bad span{color:#ff8a9a;text-decoration:line-through}#pod-music li button{border:0;background:none;color:inherit;font:inherit;text-align:left;cursor:pointer;padding:6px 8px}#pod-music li .go{flex:1;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}#pod-music .note,#pod-music .keep{font-size:12px;opacity:.8;margin:0}#pod-music .status{min-height:1.4em;margin:0;font-size:13px}#pod-music input[type=range]{flex:1;min-width:120px}';
  document.head.appendChild(s);
 }
 function body(){
  const l=lists[source],t=current(),tracks=l.tracks,mine=source==='mine';
  const b=(label,action,on,disabled)=>'<button data-action="pod-music:'+action+'" class="quiet'+(on?' on':'')+'"'+(on===true||on===false?' aria-pressed="'+on+'"':'')+(disabled?' disabled':'')+'>'+label+'</button>';
  const items=tracks.map((x,i)=>'<li class="'+(x.id===l.currentId?'cur ':'')+(x.failed?'bad':'')+'"><button class="go" data-action="pod-music:play:'+x.id+'" aria-label="Play '+esc(x.label)+'"><b>'+String(i+1).padStart(2,'0')+'</b> <span>'+esc(x.label)+'</span></button>'+(mine?'<button data-action="pod-music:remove:'+x.id+'" aria-label="Remove '+esc(x.label)+'">×</button>':'')+'</li>').join('');
  return '<div id="pod-music"><canvas id="pod-music-spectrum" width="480" height="70" aria-label="Audio spectrum"></canvas>'
   +'<div class="row" role="group" aria-label="Music source">'+b('Website playlist','source:website',!mine)+b('My music','source:mine',mine)+'</div>'
   +'<div class="now" id="pod-music-now">'+(t?esc(t.label):mine?'No songs yet':'Choose a song')+'</div>'
   +'<div class="bar" id="pod-music-seek" role="progressbar" aria-label="Playback position"><i id="pod-music-bar"></i></div><div id="pod-music-time">0:00 / 0:00</div>'
   +'<div class="row">'+b('⏮ Previous','prev')+b(isPlaying()?'⏸ Pause':'▶ Play','toggle')+b('Next ⏭','next')+b('Shuffle','shuffle',l.shuffle)+b('Repeat: '+l.repeat,'repeat',l.repeat!=='off')+'</div>'
   +'<div class="row"><label for="pod-music-volume">Volume</label><input type="range" id="pod-music-volume" min="0" max="100" value="'+Math.round(volume*100)+'"></div>'
   +(mine?'<div class="row">'+b('Add songs','add')+b('Clear playlist','clear',undefined,!tracks.length)+'</div>':'')
   +(tracks.length?'<ol aria-label="'+(mine?'My music':'Website playlist')+'">'+items+'</ol>':(mine?'<p class="note">No songs yet. Choose Add songs to pick MP3, WAV, OGG or M4A files from your computer.</p>':''))
   +'<p class="status" id="pod-music-status" role="status" aria-live="polite">'+esc(status)+'</p>'
   +(mine?'<p class="note">Your songs play in this browser only and are never uploaded, and nobody else can hear them. After you reload the game the list is empty, because a browser does not let a page reopen files you chose earlier.</p><label class="keep"><input type="checkbox" data-pod-keep '+(keeping?'checked':'')+'> Keep my songs in this browser. Copies are saved on this device only, never sent anywhere, and removed when you untick this, remove them or clear your site data.</label>':'')
   +'</div>';
 }
 const open_=()=>!!document.getElementById('pod-music')&&typeof mode!=='undefined'&&mode==='equipment';
 let lastHtml=null;
 // The panel is rebuilt only when what it shows has changed: a rebuild between a button press and its release would lose the click.
 function render(){
  if(!open_())return;const html=body();if(html===lastHtml){live();return;}lastHtml=html;
  const scroll=document.querySelector('#pod-music ol'),top=scroll?scroll.scrollTop:0;
  panel('SLEEPING POD / MUSIC','Pod <em>music.</em>',html,button('RETURN TO GAMEPLAY','progress-return',true));
  const ol=document.querySelector('#pod-music ol');if(ol)ol.scrollTop=top;live();
 }
 function live(){
  const el=byId('pod-music-spectrum');if(!el)return;const g=el.getContext('2d');g.clearRect(0,0,el.width,el.height);led(g,2,2,el.width-4,el.height-4);
  const dur=audio&&isFinite(audio.duration)?audio.duration:0,pos=audio&&loadedKey?audio.currentTime||0:0;
  const bar=byId('pod-music-bar'),time=byId('pod-music-time');if(bar)bar.style.width=(dur?Math.min(100,pos/dur*100):0)+'%';if(time)time.textContent=clock(pos)+' / '+clock(dur);
 }
 function open(){
  css();restore();
  hud();clearInput();walkingKeys.clear();document.exitPointerLock?.();mode='equipment';view='equipment';
  lastHtml=body();panel('SLEEPING POD / MUSIC','Pod <em>music.</em>',lastHtml,button('RETURN TO GAMEPLAY','progress-return',true));live();
  clearInterval(ticker);ticker=setInterval(()=>{if(!open_()){clearInterval(ticker);ticker=0;return;}live();},70);
 }
 function fileInput(){
  let el=byId('pod-music-input');if(el)return el;
  el=document.createElement('input');el.type='file';el.id='pod-music-input';el.multiple=true;el.hidden=true;el.accept='audio/*,.mp3,.wav,.ogg,.oga,.m4a,.aac,.flac,.opus';el.setAttribute('aria-label','Choose songs from your computer');
  el.addEventListener('change',()=>{addFiles(el.files);el.value='';});document.body.appendChild(el);return el;
 }
 if(typeof screen!=='undefined'&&screen&&screen.addEventListener){
  screen.addEventListener('click',e=>{
   const seek=e.target.closest&&e.target.closest('#pod-music-seek');
   if(seek&&audio&&isFinite(audio.duration)&&loadedKey){const r=seek.getBoundingClientRect();audio.currentTime=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width))*audio.duration;live();return;}
   const a=e.target.closest&&e.target.closest('button')?.dataset.action;if(!a||!a.startsWith('pod-music:'))return;
   const [,cmd,arg]=a.split(':'),l=lists[source];
   if(cmd==='source')switchSource(arg);else if(cmd==='toggle'){toggle();render();}else if(cmd==='next'){if(l.size)advance(false);}else if(cmd==='prev'){if(l.size)previous();}
   else if(cmd==='shuffle'){l.setShuffle(!l.shuffle);say('Shuffle '+(l.shuffle?'on.':'off.'));render();}
   else if(cmd==='repeat'){const m=l.cycleRepeat();say(m==='off'?'Repeat off: the list stops after the last song.':m==='all'?'Repeat all: the list starts again after the last song.':'Repeat one: the current song plays again when it ends.');render();}
   else if(cmd==='play'){if(l.select(arg))load(0);}
   else if(cmd==='add')fileInput().click();else if(cmd==='remove')removeTrack(arg);else if(cmd==='clear')clearMine();
  });
  screen.addEventListener('input',e=>{if(e.target.id==='pod-music-volume'){volume=Math.max(0,Math.min(1,Number(e.target.value)/100));if(audio)audio.volume=volume;}});
  screen.addEventListener('change',e=>{if(e.target.matches&&e.target.matches('[data-pod-keep]')){setKeeping(e.target.checked);render();}});
 }
 if(root.VoidInteractions)root.VoidInteractions.register('district-pod-music',open);

 const api={
  get playing(){return isPlaying();},get element(){return audio;},get source(){return source;},get volume(){return volume;},get status(){return status;},lists,
  /* Smoothed bass / mid / high energy (0 to 1) for lighting that follows the music; all zero when nothing plays and the columns have settled. */
  levels(){const lv=bands(),third=BANDS/3,out={bass:0,mid:0,high:0};for(let b=0;b<BANDS;b++)out[b<third?'bass':b<third*2?'mid':'high']+=lv[b]/third;out.on=out.bass+out.mid+out.high>.002;return out;},
  open,drawScreen,bands,addFiles,toggle,next:()=>advance(false),previous,switchSource,clearMine,removeTrack,setKeeping,restore,
  state(){const t=current();return {source,playing:isPlaying(),title:t?t.label:'',shuffle:lists[source].shuffle,repeat:lists[source].repeat,mine:lists.mine.tracks.map(x=>x.label),website:lists.website.size,position:audio?audio.currentTime:0,volume,status};},
  /* Called every frame by the game's music integration: the music belongs to the District, so it pauses when the player leaves it. */
  update(){if(audio&&!audio.paused){const where=typeof walkingLocation!=='undefined'&&walkingLocation&&walkingLocation.id==='neochinatown'&&walkingLocation.area!=='street'&&typeof walker!=='undefined'&&walker;/* area is set only where the street and the District interior are separate builds */if(!where){positions[source]=audio.currentTime||0;audio.pause();}}}
 };
 root.VoidPodMusic=api;
 root.addEventListener('pagehide',()=>{if(objectUrl)root.URL.revokeObjectURL(objectUrl);});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
