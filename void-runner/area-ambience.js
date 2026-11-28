/* Environmental sound (the owner, 15 Nov 2026): recorded ambience for each area, on top of the area's music.
   - Beds: what a whole area sounds like (rain and the far city on the street, dripping in the alley, ventilation inside the District, wind at the temple,
     the hum of the corporate plaza). They fade in and out as you move; nothing restarts at a doorway.
   - Emitters: sounds that come from a place (the arcade machines, the shop terminals, the VR rigs, the bar's neon, the security scanner, the neon over the
     District door). They get louder as you walk up and sit to the left or right of you.
   - Footsteps: recorded steps for the floor you are on (wet street, metal, concrete), for you and for the people near you (footsteps.js).
   - A lock clunk when you pass through the security vestibule.
   Everything plays on the game's Ambient channel (steps and the lock on Effects), so the Ambient and Effects volume sliders and mute apply, and none of it
   touches the Music or Voice channels. Files: void-runner/assets/audio/ambience (made with ElevenLabs; see LICENSES.md there). They are fetched only when the
   area that uses them is entered. In a sleeping pod, in VR and with sound off everything fades out.
   Pure rules (which beds, which floor, how loud and how far left/right) are tested in Node (tests/area-ambience.test.cjs). */
(function(root){
 'use strict';
 const DIR='void-runner/assets/audio/ambience/',STEP_COUNT=6;
 const inside={'vent-hum':.34};
 // area (the music director's style id) -> {loop: level}
 const BEDS={
  neochinatown:{'rain-street':.5,'city-distant':.55},
  alley:{'rain-street':.3,'alley-drip':.8,'city-distant':.3},
  milked:{'vent-hum':.22},
  'district-entry':{'vent-hum':.3},
  'district-hall':inside,'district-store':{'vent-hum':.24},'district-bar':{'vent-hum':.24},'district-vr':{'vent-hum':.28},'district-arcade':{'vent-hum':.22},'district-rest':{'vent-hum':.3},
  'district-terrace':{'rain-street':.42,'city-distant':.5},
  corporate:{'corporate-plaza':.6},
  temple:{'temple-wind':.6}
 };
 const beds=area=>BEDS[area]||{};
 const indoorRainGain=.25;
 function bedLevel(area,name,location){
  const level=beds(area)[name]||0;
  const indoors=location&&(location.apartment||location.area==='interior'||location.quarter==='underground');
  return name==='rain-street'&&indoors&&area!=='district-terrace'?level*indoorRainGain:level;
 }
 // the floor underfoot, by area
 const SURFACE={neochinatown:'wet',alley:'wet','district-terrace':'wet','district-entry':'metal',corporate:'metal',temple:'stone'};
 const surface=area=>area?SURFACE[area]||'concrete':null;
 /* How each floor's recorded steps are played: which recordings, how loud (times the usual level), how fast, and how much of the top is taken off (a low-pass in Hz, 0 for none).
    Stone (the Temple, 18 Nov 2026): the concrete recordings, softer and a little lower, with the click taken off: the owner wanted the Temple's steps a little quieter. */
 const STEPS={wet:{files:'wet',gain:1,rate:1,lowpass:0},metal:{files:'metal',gain:1,rate:1,lowpass:0},concrete:{files:'concrete',gain:1,rate:1,lowpass:0},stone:{files:'concrete',gain:.6,rate:.88,lowpass:2200}};
 const stepSet=s=>s?STEPS[s]||STEPS.concrete:null;
 /* The player's own step on floor s: {file, level, rate, lowpass}. pick in [0,1) chooses the recording, jitter in [0,1) varies the pitch a little. */
 function ownStepSound(s,run,pick=0,jitter=.5){const k=stepSet(s);if(!k)return null;return {file:'steps-'+k.files+'-'+(1+Math.min(STEP_COUNT-1,Math.floor(pick*STEP_COUNT))),level:(run?.5:.3)*k.gain,rate:(.92+jitter*.16)*k.rate,lowpass:k.lowpass};}
 /* The area to use for the floor when the music's report of where the player is has gone stale (a panel open over the game, pod music playing): a place that is its
    own walking location (the Temple, the Corporate District) is known from the location alone. */
 const placeArea=loc=>loc&&(loc.temple?'temple':loc.corporate?'corporate':null)||null;
 /* Sounds with a place. `plan` is in District plan metres (the same numbers the District's rooms use); `street` is in street metres. */
 const EMITTERS=[
  {id:'arcade',loop:'arcade-floor',plan:[-9.4,62],range:13,gain:.7},
  {id:'counter',loop:'terminal-hum',plan:[10.2,46.6],range:8,gain:.5},
  {id:'vr-rigs',loop:'terminal-hum',plan:[-6.2,36],range:7,gain:.4},
  {id:'bar-neon',loop:'neon-buzz',plan:[10,36.2],range:6,gain:.32},
  {id:'scanner',loop:'scanner-sweep',plan:[0,23],range:7.5,gain:.42},
  {id:'door-neon',loop:'neon-buzz',street:[126.9,-60.9],range:7,gain:.4}
 ];
 const isInterior=area=>!!area&&area.startsWith('district-')&&area!=='district-terrace';
 const isStreet=area=>area==='neochinatown'||area==='alley';
 const emittersFor=area=>EMITTERS.filter(e=>e.plan?isInterior(area):isStreet(area));
 /* How a sound at (dx, dz) from you is heard when you face `yaw` (forward is (sin yaw, cos yaw)): level 0..1 falling to nothing at `range`, pan -1 (left) .. 1 (right). */
 function heard(dx,dz,yaw,range){const d=Math.hypot(dx,dz);if(!(d<range))return {level:0,pan:0};const k=1-d/range,side=d<.3?0:(dx*Math.cos(yaw)-dz*Math.sin(yaw))/d;
  return {level:k*k,pan:Math.max(-1,Math.min(1,side))*Math.min(1,d/2)};}
 // A lock clunk when you go between the vestibule and what is on either side of it.
 const lockBetween=(from,to)=>!!from&&!!to&&from!==to&&(from==='district-entry'||to==='district-entry')&&[from,to].every(a=>a==='district-entry'||a==='district-hall'||a==='alley'||a==='neochinatown');
 const pure={DIR,BEDS,SURFACE,STEPS,EMITTERS,STEP_COUNT,beds,bedLevel,surface,stepSet,ownStepSound,placeArea,emittersFor,heard,lockBetween};
 if(typeof module!=='undefined'&&module.exports){module.exports=pure;return;}
 if(typeof document==='undefined')return;

 let ctx=null,lastArea=null;const buffers=new Map(),loading=new Set(),bedVoices=new Map(),emitterVoices=new Map();
 // A decoded file, or null while it is on its way (asked for once; a file that fails is not asked for again this visit).
 function buffer(name){if(buffers.has(name))return buffers.get(name);if(loading.has(name))return null;loading.add(name);const c=ctx;
  fetch(DIR+name+'.ogg').then(r=>r.ok?r.arrayBuffer():Promise.reject(new Error(String(r.status)))).then(b=>c.decodeAudioData(b)).then(b=>{if(c===ctx)buffers.set(name,b);loading.delete(name);}).catch(()=>{buffers.set(name,null);});
  return null;}
 function voice(bus,name,panned){const b=buffer(name);if(!b)return null;const src=ctx.createBufferSource(),gain=ctx.createGain();src.buffer=b;src.loop=true;gain.gain.value=0;src.connect(gain);
  let pan=null;if(panned&&ctx.createStereoPanner){pan=ctx.createStereoPanner();gain.connect(pan);pan.connect(bus.node);}else gain.connect(bus.node);
  src.start(0,Math.random()*b.duration);return {src,gain,pan,level:0};}
 function setLevel(v,level,seconds){if(Math.abs(level-v.level)<.004)return;v.level=level;v.gain.gain.setTargetAtTime(level,ctx.currentTime,seconds/3);}
 function reset(c){ctx=c;buffers.clear();loading.clear();bedVoices.clear();emitterVoices.clear();lastArea=null;}
 function oneShot(busName,name,level,rate,lowpass){const bus=root.VoidAudio?.bus?.(busName);if(!bus||bus.context!==ctx||ctx.state!=='running')return false;const b=buffer(name);if(!b)return false;
  const src=ctx.createBufferSource(),gain=ctx.createGain();src.buffer=b;src.playbackRate.value=rate||1;gain.gain.value=level;let lp=null;
  if(lowpass>0){lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=lowpass;lp.Q.value=.5;src.connect(lp);lp.connect(gain);}else src.connect(gain);
  gain.connect(bus.node);src.onended=()=>{try{gain.disconnect();lp?.disconnect();}catch{}};src.start();return true;}
 // Where the player is, as music-integration.js last reported it (stale after two seconds: the game is not running its frames).
 function where(){const a=root.VoidMusicArea;return a&&performance.now()-a.at<2000&&root.VoidAudio?.settings?.enabled?a:null;}
 function tick(){
  const bus=root.VoidAudio?.bus?.('ambient');if(!bus)return;if(bus.context!==ctx)reset(bus.context);if(ctx.state!=='running')return;
  const a=where(),area=a?a.area:null,share=a?Math.max(0,Math.min(1,a.city==null?1:a.city)):0,want=area?beds(area):{};
  const location=typeof walkingLocation==='undefined'?null:walkingLocation;
  // beds: the area's own, scaled by how much of the city is left around you (nothing inside the nightclub)
  for(const name of new Set([...Object.keys(want),...bedVoices.keys()])){const target=bedLevel(area,name,location)*share;let v=bedVoices.get(name);
   if(!v){if(!(target>0))continue;v=voice(bus,name,false);if(!v)continue;bedVoices.set(name,v);}setLevel(v,target,2.4);}
  // emitters: by distance and side
  const N=root.VoidNeoChinatown,active=area&&N?emittersFor(area):[];
  for(const e of EMITTERS){let level=0,pan=0;
   if(active.includes(e)){const p=e.plan?N.toWorld(e.plan[0],e.plan[1]):e.street,h=heard(p[0]-a.x,p[1]-a.z,a.yaw||0,e.range);level=h.level*e.gain*share;pan=h.pan;}
   let v=emitterVoices.get(e.id);if(!v){if(!(level>0))continue;v=voice(bus,e.loop,true);if(!v)continue;emitterVoices.set(e.id,v);}
   setLevel(v,level,.5);if(v.pan&&level>0)v.pan.pan.setTargetAtTime(pan,ctx.currentTime,.08);}
  // the floor's steps and the lock, fetched as soon as the area is known
  const s=stepSet(surface(area||stepArea()));if(s)for(let i=1;i<=STEP_COUNT;i++)buffer('steps-'+s.files+'-'+i);
  if(isInterior(area)||isStreet(area))buffer('door-lock');
  if(lockBetween(lastArea,area))oneShot('effects','door-lock',.5);
  if(area)lastArea=area;else if(!a)lastArea=null;
 }
 setInterval(tick,100);
 // A recorded step for the floor the player is on (null until its files have arrived: the caller falls back to its own sound).
 function stepBuffer(c){const s=stepSet(surface(where()?.area||stepArea()));if(!s||c!==ctx)return null;return buffers.get('steps-'+s.files+'-'+(1+Math.floor(Math.random()*STEP_COUNT)))||null;}
 // The area for the floor underfoot: the music's report of where the player is, else (stale) the walking location itself when it is a place of its own.
 function stepArea(){try{return where()?.area||(typeof mode!=='undefined'&&typeof walkingLocation!=='undefined'&&mode==='walking'&&root.VoidAudio?.settings?.enabled?placeArea(walkingLocation):null);}catch{return null;}}
 // The player's own step. True when a recording was played.
 function ownStep(run){const k=ownStepSound(surface(stepArea()),run,Math.random(),Math.random());if(!k||!ctx)return false;return oneShot('effects',k.file,k.level,k.rate,k.lowpass);}
 root.VoidAmbience={...pure,stepBuffer,ownStep,get playing(){return {beds:[...bedVoices].filter(([,v])=>v.level>0).map(([k])=>k),emitters:[...emitterVoices].filter(([,v])=>v.level>0).map(([k])=>k)};}};
})(typeof globalThis!=='undefined'?globalThis:this);
