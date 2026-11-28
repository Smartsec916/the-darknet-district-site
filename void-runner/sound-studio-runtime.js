/* Published location scores, environmental emitters and event recordings share the game's mixer. */
(function(root){
 'use strict';
 const base=()=> (root.VoidNetwork?.base||'')+'/api/void-runner/';
 const mediaUrl=src=>/^[a-f0-9]{64}$/.test(src)?base()+'studio/audio/media/'+src:'void-runner/'+src;
 const categories=['Music','Ambience','NPC voices','Footsteps','Weapons','Doors','Machinery','Spaceships','Vehicles','Holographic devices','Interface','Mission effects','Consumables','Cinematic soundtracks','Spatial sources'];
 const channels=['master','music','dialogue','effects','ambient','voice','cinematic','duck'];
 const empty=()=>({assets:[],locations:[],sources:[],events:[],mix:Object.fromEntries(channels.map(k=>[k,k==='duck'?.4:1]))});
 const hourMatches=(hour,start,end)=>start===end||(start<end?hour>=start&&hour<end:hour>=start||hour<end);
 function playlist(project,world){
  return project.locations.find(p=>world.areas.includes(p.area)&&hourMatches(world.hour,p.fromHour,p.toHour)&&(!p.mission||world.missions.includes(p.mission)));
 }
 function asset(id,src,name,category){return {id,src,name,category,tags:[],volume:1,start:0,end:0,loop:false,fadeIn:0,fadeOut:0,rate:1,pitch:0};}
 let project=empty(),loaded=false,active=null,nextAt=0,track=null,order=[],index=0,exhausted=false;
 const emitters=new Map(),resume=new Map(),effects=new Set();
 const limit=(v,min,max)=>Math.min(max,Math.max(min,v));
 // Two crossfaded delay lines transpose a streaming recording without moving its playback clock.
 function transpose(ctx,input,semitones){
  const span=.08,ratio=2**(semitones/12),period=span/Math.abs(1-ratio);
  const curve=ctx.createBuffer(2,2048,ctx.sampleRate);
  const delayCurve=curve.getChannelData(0),gainCurve=curve.getChannelData(1);
  for(let i=0;i<curve.length;i++){
   const phase=i/curve.length;
   delayCurve[i]=.005+span*(semitones>0?1-phase:phase);
   gainCurve[i]=Math.sin(phase*Math.PI)**2;
  }
  const output=ctx.createGain(),voices=[];
  for(const offset of [0,.5]){
   const clock=ctx.createBufferSource(),split=ctx.createChannelSplitter(2),delay=ctx.createDelay(.12),level=ctx.createGain();
   clock.buffer=curve;clock.loop=true;clock.playbackRate.value=curve.duration/period;
   delay.delayTime.value=0;level.gain.value=0;
   clock.connect(split);split.connect(delay.delayTime,0);split.connect(level.gain,1);
   input.connect(delay);delay.connect(level);level.connect(output);clock.start(ctx.currentTime,offset*curve.duration);
   voices.push({clock,split,delay,level});
  }
  return {output,dispose(){for(const v of voices){v.clock.stop();input.disconnect(v.delay);for(const n of Object.values(v))n.disconnect();}output.disconnect();}};
 }
 function player(a,channel,volume,options={}){
  const media=new Audio(),owner=root.VoidAudio?.connectMedia?.(media,channel);
  if(!owner)return null;
  const ctx=owner.context,g=owner.gain.gain;
  let closed=false,tail=null,ended=false,additional=null,objectUrl;
  media.crossOrigin='anonymous';media.preload='auto';
  media.preservesPitch=true;
  media.playbackRate=limit(a.rate,.25,4);
  let output=owner.gain,pitch;
  if(a.pitch){const bus=root.VoidAudio.bus(channel).node;output.disconnect(bus);pitch=transpose(ctx,output,a.pitch);output=pitch.output;output.connect(bus);}
  const level=limit(a.volume*volume,0,1);g.value=0;
  function dispose(){if(closed)return;closed=true;clearTimeout(tail);media.pause();media.removeAttribute('src');media.load();if(objectUrl)URL.revokeObjectURL(objectUrl);pitch?.dispose();owner.dispose();additional?.disconnect();}
  function fade(seconds){if(closed||tail)return;if(seconds<=0){dispose();return;}
   g.cancelScheduledValues(ctx.currentTime);g.setValueAtTime(g.value,ctx.currentTime);g.linearRampToValueAtTime(0,ctx.currentTime+seconds);tail=setTimeout(dispose,seconds*1000+30);}
  function start(){if(closed)return;media.currentTime=limit(options.seek??a.start,a.start,Math.max(a.start,(a.end||media.duration)-.02));
   const now=ctx.currentTime;g.cancelScheduledValues(now);g.setValueAtTime(0,now);g.linearRampToValueAtTime(level,now+Math.max(.01,a.fadeIn,options.fade||0));
   media.play().catch(failed);}
  function finish(){if(ended||closed)return;if(options.loop??a.loop){start();return;}ended=true;dispose();options.done?.();}
  function failed(){if(closed)return;ended=true;dispose();options.done?.();}
  media.addEventListener('loadedmetadata',start,{once:true});media.onended=finish;media.onerror=failed;
  if(options.blob)Promise.resolve().then(()=>options.blob()).then(blob=>{if(!closed)media.src=objectUrl=URL.createObjectURL(blob);}).catch(failed);
  else media.src=options.url||mediaUrl(a.src);
  media.ontimeupdate=()=>{const left=(a.end||media.duration)-media.currentTime;if(left<=.02)finish();
   else if(!tail&&a.fadeOut>0&&left<a.fadeOut)g.setTargetAtTime(level*left/a.fadeOut,ctx.currentTime,.05);};
  return {media,get remaining(){return ((a.end||media.duration)-media.currentTime)/media.playbackRate;},get ended(){return ended||closed;},fade,dispose,
   spatial(x,y,z,yaw,near,far,attenuation){const p=ctx.createPanner();p.panningModel='HRTF';p.distanceModel='inverse';p.refDistance=near;p.maxDistance=far;p.rolloffFactor=attenuation;
    p.setPosition(x,y,-z);p.setOrientation(Math.sin(yaw),0,-Math.cos(yaw));p.coneInnerAngle=180;p.coneOuterAngle=340;p.coneOuterGain=.35;
    output.disconnect();output.connect(p);p.connect(root.VoidAudio.bus(channel).node);additional=p;},
   level(multiplier){if(!closed&&!tail)g.setTargetAtTime(level*multiplier,ctx.currentTime,.12);}};
 }
 function stopPlaylist(){if(active?.resume)resume.set(active.id,{order:[...order],index,time:track?.media.currentTime});
  track?.fade(active?.crossfade||0);track=null;active=null;exhausted=false;nextAt=0;}
 function stop(){stopPlaylist();for(const src of emitters.values())src?.dispose();emitters.clear();for(const e of effects)e.dispose();effects.clear();}
 function apply(value){stop();resume.clear();project=value||empty();root.VoidAudio?.setStudioMix?.(project.mix);}
 function shuffled(p){const rows=[...p.tracks];if(p.shuffle)for(let i=rows.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[rows[i],rows[j]]=[rows[j],rows[i]];}return rows;}
 function update(world){
  if(!loaded&&root.VoidNetwork){loaded=true;root.VoidNetwork.request('studio/audio').then(r=>{if(r?.content)apply(r.content);}).catch(()=>{});}
  const selected=world.apartmentMusic?null:playlist(project,world),now=performance.now()/1000;
  let seek;
  if(active!==selected){stopPlaylist();active=selected;if(active){const saved=active.resume&&resume.get(active.id);order=saved?.order||shuffled(active);index=saved?.index||0;seek=saved?.time;}}
  function advance(){index++;if(index>=order.length){if(!active.loop){exhausted=true;return;}index=0;order=shuffled(active);}}
  if(active&&!exhausted){
   if(track&&(track.ended||(track.remaining<=active.crossfade&&!active.gap&&(index+1<order.length||active.loop)))){
    track.fade(active.crossfade);track=null;nextAt=now+active.gap;advance();
   }
   if(!track&&!exhausted&&now>=nextAt){const row=order[index],a=project.assets.find(a=>a.id===row?.asset);
    if(a)track=player(a,'music',row.volume,{seek,fade:active.crossfade,loop:false});
    if(!track)nextAt=now+1;}
  }
  spatial(world);return !!selected;
 }
 function spatial(world){
  if(!project.sources.length)return;
  const w=world.walker,cam=root.VoidBabylon?.scene?.activeCamera,ctx=root.VoidAudio?.bus?.('ambient')?.context;
  if(!ctx)return;
  if(w&&cam&&project.sources.length){const p=cam.globalPosition,f=cam.getForwardRay(1).direction;
   ctx.listener.setPosition(p.x,p.y,-p.z);ctx.listener.setOrientation(f.x,f.y,-f.z,0,1,0);}
  for(const s of project.sources){
   const on=w&&world.areas.includes(s.area)&&(!s.mission||world.missions.includes(s.mission))&&(s.environment==='both'||s.environment===world.environment)&&Math.hypot(s.x-w.x,s.z-w.z,s.y-(w.y||0))<=s.far;
   if(!on){emitters.get(s.id)?.dispose();emitters.delete(s.id);continue;}
   if(!emitters.has(s.id)){const a=project.assets.find(a=>a.id===s.asset),p=a&&player(a,'ambient',s.volume,{loop:s.loop});
    if(p){p.spatial(s.x,s.y,s.z,s.direction*Math.PI/180,s.near,s.far,s.attenuation);emitters.set(s.id,p);}}
   const blocked=s.occlusion&&root.VoidDeviceCamera?.sightBlocked?.(w.x,w.z,s.x,s.z,world.solids);
   emitters.get(s.id)?.level(blocked?.28:1);
  }
 }
 function event(id){const e=project.events.find(e=>e.id===id),a=e&&project.assets.find(a=>a.id===e.asset);if(!a)return false;
  for(const old of effects)if(old.ended)effects.delete(old);
  if(effects.size>=16)return false;
  const p=player(a,'effects',1,{loop:false,done:()=>effects.delete(p)});if(!p)return false;effects.add(p);return true;}
 const api={categories,channels,empty,asset,base,mediaUrl,playlist,hourMatches,transpose,player,apply,update,event,stop,get project(){return project;}};
 if(typeof module!=='undefined')module.exports=api;else root.VoidSoundStudio=api;
})(globalThis);
