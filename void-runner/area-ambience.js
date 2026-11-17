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
 // the floor underfoot, by area
 const SURFACE={neochinatown:'wet',alley:'wet','district-terrace':'wet','district-entry':'metal',corporate:'metal'};
 const surface=area=>area?SURFACE[area]||'concrete':null;
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
 const pure={DIR,BEDS,SURFACE,EMITTERS,STEP_COUNT,beds,surface,emittersFor,heard,lockBetween};
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
 function oneShot(busName,name,level,rate){const bus=root.VoidAudio?.bus?.(busName);if(!bus||bus.context!==ctx||ctx.state!=='running')return false;const b=buffer(name);if(!b)return false;
  const src=ctx.createBufferSource(),gain=ctx.createGain();src.buffer=b;src.playbackRate.value=rate||1;gain.gain.value=level;src.connect(gain);gain.connect(bus.node);src.onended=()=>{try{gain.disconnect();}catch{}};src.start();return true;}
 // Where the player is, as music-integration.js last reported it (stale after two seconds: the game is not running its frames).
 function where(){const a=root.VoidMusicArea;return a&&performance.now()-a.at<2000&&root.VoidAudio?.settings?.enabled?a:null;}
 function tick(){
  const bus=root.VoidAudio?.bus?.('ambient');if(!bus)return;if(bus.context!==ctx)reset(bus.context);if(ctx.state!=='running')return;
  const a=where(),area=a?a.area:null,share=a?Math.max(0,Math.min(1,a.city==null?1:a.city)):0,want=area?beds(area):{};
  // beds: the area's own, scaled by how much of the city is left around you (nothing inside the nightclub)
  for(const name of new Set([...Object.keys(want),...bedVoices.keys()])){const target=(want[name]||0)*share;let v=bedVoices.get(name);
   if(!v){if(!(target>0))continue;v=voice(bus,name,false);if(!v)continue;bedVoices.set(name,v);}setLevel(v,target,2.4);}
  // emitters: by distance and side
  const N=root.VoidNeoChinatown,active=area&&N?emittersFor(area):[];
  for(const e of EMITTERS){let level=0,pan=0;
   if(active.includes(e)){const p=e.plan?N.toWorld(e.plan[0],e.plan[1]):e.street,h=heard(p[0]-a.x,p[1]-a.z,a.yaw||0,e.range);level=h.level*e.gain*share;pan=h.pan;}
   let v=emitterVoices.get(e.id);if(!v){if(!(level>0))continue;v=voice(bus,e.loop,true);if(!v)continue;emitterVoices.set(e.id,v);}
   setLevel(v,level,.5);if(v.pan&&level>0)v.pan.pan.setTargetAtTime(pan,ctx.currentTime,.08);}
  // the floor's steps and the lock, fetched as soon as the area is known
  const s=surface(area);if(s)for(let i=1;i<=STEP_COUNT;i++)buffer('steps-'+s+'-'+i);
  if(isInterior(area)||isStreet(area))buffer('door-lock');
  if(lockBetween(lastArea,area))oneShot('effects','door-lock',.5);
  if(area)lastArea=area;else if(!a)lastArea=null;
 }
 setInterval(tick,100);
 // A recorded step for the floor the player is on (null until its files have arrived: the caller falls back to its own sound).
 function stepBuffer(c){const s=surface(where()?.area);if(!s||c!==ctx)return null;return buffers.get('steps-'+s+'-'+(1+Math.floor(Math.random()*STEP_COUNT)))||null;}
 // The player's own step. True when a recording was played.
 function ownStep(run){const s=surface(where()?.area);if(!s||!ctx)return false;return oneShot('effects','steps-'+s+'-'+(1+Math.floor(Math.random()*STEP_COUNT)),run?.5:.3,.92+Math.random()*.16);}
 root.VoidAmbience={...pure,stepBuffer,ownStep,get playing(){return {beds:[...bedVoices].filter(([,v])=>v.level>0).map(([k])=>k),emitters:[...emitterVoices].filter(([,v])=>v.level>0).map(([k])=>k)};}};
})(typeof globalThis!=='undefined'?globalThis:this);
