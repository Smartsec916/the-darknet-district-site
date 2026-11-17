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
 /* The website playlist is available here as requested. Licensing questions remain recorded in docs/development/MUSIC_LICENSING.md.
    The audio files are the website's own files in attached_assets/ (none are copied). */
 const WEBSITE_PLAYLIST=true;
 const siteOn=()=>{try{return WEBSITE_PLAYLIST||root.localStorage.getItem('darknet-pod-music-site')==='1'||/[?&]sitemusic=1(&|$)/.test(root.location.search);}catch(e){return WEBSITE_PLAYLIST;}};
 const DB='darknet-pod-music',STORE='songs',KEEP_FLAG='darknet-pod-music-keep',KEEP_LIMIT=500*1024*1024,BANDS=24,ROWS=12;
 const lists={website:PL.createPlaylist(),mine:PL.createPlaylist()};
 lists.website.add(root.DistrictMusicCatalog.filter(song=>song.published).map(song=>({name:song.title+'.mp3',size:0,lastModified:0,url:song.url})));
 let source=siteOn()?'website':'mine',audio=null,link=null,analyser=null,freq=null,volume=.8,objectUrl=null,loadedKey=null,failures=0,status='',keeping=false,keptBytes=0,order=0,restored=false,ticker=0,panelReturn='game';
 const LIGHTS=['rest','reading','music'];
 const podSettings=Array.from({length:10},(_,i)=>{try{const data=JSON.parse(root.localStorage.getItem('darknet-pod-controls-'+(i+1))||'null');return {volume:Number.isFinite(data?.volume)?Math.max(0,Math.min(1,data.volume)):.8,lighting:LIGHTS.includes(data?.lighting)?data.lighting:'rest'};}catch{return {volume:.8,lighting:'rest'};}});
 const activePod=()=>Math.max(1,Math.min(10,Number(typeof state!=='undefined'&&state?.story?.flags?.activePod)||1));
 const setting=()=>podSettings[activePod()-1];
 const keepSetting=()=>{try{root.localStorage.setItem('darknet-pod-controls-'+activePod(),JSON.stringify(setting()));}catch{}};
 const positions={website:0,mine:0},levels=new Float32Array(BANDS),peaks=new Float32Array(BANDS);
 const podPlayback=Array.from({length:10},()=>({source,website:{id:null,position:0},mine:{id:null,position:0}}));let selectedPod=1;
 function enterPod(index){
  if(!Number.isInteger(index)||index<1||index>10)return false;
  const old=podPlayback[selectedPod-1];old.source=source;old[source].id=lists[source].currentId;old[source].position=audio&&loadedKey?audio.currentTime||0:positions[source];
  if(audio)audio.pause();selectedPod=index;const next=podPlayback[index-1];source=next.source;
  for(const key of ['website','mine']){if(next[key].id&&lists[key].find(next[key].id))lists[key].select(next[key].id);else lists[key].deselect();positions[key]=next[key].position;}
  loadedKey=null;volume=podSettings[index-1].volume;if(audio)audio.volume=volume;restore();return true;
 }
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
 function say(text){status=text||'';statusAt=Date.now();}
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
 let pending=false,statusAt=0;
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

 // The player's controls are drawn and clicked on the pod's own wall screen (pod-player-ui.js, world-integration.js): there is no pop-up panel. The screen polls state() a few times a second.
 function render(){}
 function fileInput(){
  let el=byId('pod-music-input');if(el)return el;
  el=document.createElement('input');el.type='file';el.id='pod-music-input';el.multiple=true;el.hidden=true;el.accept='audio/*,.mp3,.wav,.ogg,.oga,.m4a,.aac,.flac,.opus';el.setAttribute('aria-label','Choose songs from your computer');
  el.addEventListener('change',()=>{addFiles(el.files);el.value='';});document.body.appendChild(el);return el;
 }
 const api={
  get playing(){return isPlaying();},get element(){return audio;},get source(){return source;},get volume(){return volume;},get lighting(){return setting().lighting;},get activePod(){return activePod();},get selectedPod(){return selectedPod;},lightingFor(index){return podSettings[index-1]?.lighting||'rest';},get status(){return status;},lists,
  /* Smoothed bass / mid / high energy (0 to 1) for lighting that follows the music; all zero when nothing plays and the columns have settled. */
  levels(){const lv=bands(),third=BANDS/3,out={bass:0,mid:0,high:0};for(let b=0;b<BANDS;b++)out[b<third?'bass':b<third*2?'mid':'high']+=lv[b]/third;out.on=out.bass+out.mid+out.high>.002;return out;},
  /* The pod's wall controls (clicked from inside the pod): volume 0..1, a lighting preset, and stop. */
  setVolume(v){volume=Math.max(0,Math.min(1,Number(v)||0));setting().volume=volume;keepSetting();if(audio)audio.volume=volume;render();},
  setLighting(x){if(!LIGHTS.includes(x))return false;setting().lighting=x;keepSetting();render();return true;},
  stop(){if(audio&&loadedKey){audio.pause();audio.currentTime=0;positions[source]=0;render();}},
  /* What the wall player's buttons call (the same moves the pop-up's buttons made). */
  playIndex(i){const l=lists[source],t=l.tracks[i];if(t&&l.select(t.id))load(0);},
  toggleShuffle(){const l=lists[source];l.setShuffle(!l.shuffle);say('Shuffle '+(l.shuffle?'on.':'off.'));render();},
  cycleRepeat(){const l=lists[source],m=l.cycleRepeat();say(m==='off'?'Repeat off: the list stops after the last song.':m==='all'?'Repeat all: the list starts again after the last song.':'Repeat one: the current song plays again when it ends.');render();},
  removeAt(i){const t=lists.mine.tracks[i];if(t&&source==='mine')removeTrack(t.id);},
  chooseFiles(){fileInput().click();},
  get keeping(){return keeping;},
  drawScreen,bands,addFiles,toggle,next:()=>advance(false),previous,switchSource,clearMine,removeTrack,setKeeping,restore,enterPod,
  state(){const t=current(),l=lists[source];return {source,playing:isPlaying(),title:t?t.label:'',shuffle:l.shuffle,repeat:l.repeat,mine:lists.mine.tracks.map(x=>x.label),website:lists.website.size,position:audio?audio.currentTime:0,volume,status:Date.now()-statusAt<6000?status:'',list:l.tracks.map(x=>({label:x.label,failed:!!x.failed})),index:l.tracks.findIndex(x=>x.id===l.currentId),count:l.size,keeping};},
  /* Called every frame by the game's music integration: the music belongs to the District, so it pauses when the player leaves it. */
  update(){if(audio&&!audio.paused){const inside=typeof state!=='undefined'&&state?.story?.flags?.podWakePending===true&&typeof walkingLocation!=='undefined'&&walkingLocation?.area==='interior';if(!inside){positions[source]=audio.currentTime||0;audio.pause();}}}
 };
 root.VoidPodMusic=api;
 root.addEventListener('pagehide',()=>{if(objectUrl)root.URL.revokeObjectURL(objectUrl);});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
