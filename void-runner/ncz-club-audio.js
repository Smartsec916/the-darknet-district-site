/* NeoChinatown nightclub sound: the club's own soundtrack, placed in the world.
   Outside, the music leaks through the walls (bass only) and out of the open door (brighter, only in front of it) and is
   gone beyond `maxDistance`. Walking in, the city's music crossfades away while the club's low-pass opens, its speakers
   take over (spatial, with a little room reverb) and the club murmur comes up; leaving reverses it. One generated song
   (or a recorded file, music-score.js `files.nightclub`) plays continuously through all of it.
   The rules (where the player stands -> gains, cut-offs, zone) are plain functions and run in Node
   (tests/ncz-club-audio.test.cjs); the Web Audio graph below is built on the game's one audio context. The music engine
   (music-engine.js worldSource) plays the song and keeps its place while nothing is listening. */
(function(root){
 'use strict';
 const NC=typeof module!=='undefined'?require('./ncz-nightclub.js'):root.VoidNightclub;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
 // Everything adjustable lives here. Metres, hertz, seconds; gains are linear.
 const config={
  style:'nightclub',            // a style in music-score.js; give it a recorded track with VoidMusicScore.files.nightclub
  crossfade:2.5,                // seconds to cross between the street and the club, either way
  maxDistance:60,               // outside, the club is silent beyond this many metres
  refDistance:3,                // outside, full volume (for the leaking paths) within this many metres
  wallLoss:.2,                  // share of the music that gets through the walls
  doorLoss:.75,                 // share that gets through the open doorway, in front of it
  closedDoor:.05,               // ... and when the door is shut (the model has not streamed in yet)
  wallCutoff:240,               // walls pass bass only
  doorCutoff:[1000,4500],       // the doorway: muffled at a glancing angle, brighter straight on
  interiorCutoff:[600,20000],   // low-pass at the door -> fully open deep inside
  speaker:{ref:4,rolloff:.6,share:1.5}, // inside: each stack is positional; `share` is divided between them
  bed:.28,                      // inside: a non-positional share so the song is audible everywhere
  reverb:{seconds:1.5,wet:.22},
  murmur:.3,                    // club crowd murmur (ambient bus), only inside
  cityAmbience:.12,             // how much of the street's ambient bed is left inside
  level:.9,                     // club master level
  panning:'equalpower',         // 'HRTF' is better with headphones and costs more
  suspendMargin:6,              // beyond maxDistance + this (and not inside) nothing is scheduled
  idleDispose:20                // seconds away from the city before the graph is torn down
 };
 const HALL=NC.HALL,DOOR=NC.DOOR,FRONT=NC.RECT[1];

 // ---- Rules (pure) ----------------------------------------------------------
 // How far inside the club the player is, 0 (street) to 1 (past the first few metres of the hall).
 function insideTarget(x,z){
  if(x<HALL[0]||x>HALL[1]||z<HALL[2]||z>HALL[3])return 0;
  return smooth(.2,3.5,HALL[1]-x);
 }
 function zoneOf(x,z){
  if(x>=HALL[0]&&x<=HALL[1]&&z>=HALL[2]&&z<=HALL[3])return HALL[1]-x<4?'entrance':'interior';
  return Math.hypot(Math.max(x-FRONT,0),z-DOOR.z)<6&&x>=HALL[1]?'entrance':'exterior';
 }
 // Outside the club: where the sound comes from and how much of it gets through each way.
 function exterior(x,z,open,cfg=config){
  const d=NC.distance(x,z),dn=clamp(d/cfg.maxDistance,0,1);
  const wallAt=[clamp(x,HALL[0],HALL[1]),clamp(z,HALL[2],HALL[3])];
  const vx=x-FRONT,vz=z-DOOR.z,vd=Math.hypot(vx,vz),cosA=vd>.01?vx/vd:1;
  // The doorway is 2.4 m wide and 1 m deep: only a listener roughly in front of it hears through it.
  const align=x<FRONT?0:clamp((cosA-.3)/.7,0,1);
  return {distance:d,audible:d<cfg.maxDistance,
   wall:{x:wallAt[0],z:wallAt[1],gain:cfg.wallLoss,cutoff:Math.max(110,cfg.wallCutoff*(1-.55*dn))},
   door:{x:FRONT+.3,z:DOOR.z,align,gain:cfg.doorLoss*(open?1:cfg.closedDoor/cfg.doorLoss)*Math.pow(align,1.2),cutoff:lerp(cfg.doorCutoff[0],cfg.doorCutoff[1],align)*(1-.55*dn)}};
 }
 // What the Web Audio panner does with distance, for the tests and for the flatness check.
 const linear=(d,ref,max)=>clamp(1-(clamp(d,ref,max)-ref)/(max-ref),0,1);
 const inverse=(d,ref,rolloff)=>ref/(ref+rolloff*(Math.max(d,ref)-ref));
 // The song's level at a spot inside: every speaker stack and the DJ desk plus the non-positional bed.
 function interiorLevel(x,z,cfg=config){
  const list=NC.emitters(),share=cfg.speaker.share/list.length;
  return cfg.bed+list.reduce((sum,e)=>sum+share*inverse(Math.hypot(x-e.x,1.7-e.y,z-e.z),cfg.speaker.ref,cfg.speaker.rolloff),0);
 }
 // The state carried between frames is only the smoothed "inside" factor, so quick moves and reversals stay continuous.
 const create=()=>({inside:0});
 function advance(state,x,z,dt,cfg=config){
  const tau=Math.max(.05,cfg.crossfade/3);state.inside+=(insideTarget(x,z)-state.inside)*(1-Math.exp(-Math.max(0,dt)/tau));
  if(state.inside<.001)state.inside=0;else if(state.inside>.999)state.inside=1;return state;
 }
 // Equal-power crossfade: city and club never add up louder than either alone.
 function mix(inside,cfg=config){
  const a=inside*Math.PI/2,city=Math.cos(a);
  return {city:city<.01?0:city,interior:Math.sin(a),exterior:city<.01?0:city,
   cutoff:cfg.interiorCutoff[0]*Math.pow(cfg.interiorCutoff[1]/cfg.interiorCutoff[0],inside),
   reverb:inside,murmur:inside*cfg.murmur,ambient:lerp(1,cfg.cityAmbience,inside)};
 }

 // ---- Web Audio (browser) ---------------------------------------------------
 let graph=null,state=create(),idle=0,last=null;
 const audioPos=(x,y,z)=>[x,y,-z]; // Web Audio is right-handed with -z ahead: the game's north (+z) becomes -z, so east stays on the right.
 function setPos(p,x,y,z){const [a,b,c]=audioPos(x,y,z);if(p.positionX){p.positionX.value=a;p.positionY.value=b;p.positionZ.value=c;}else p.setPosition?.(a,b,c);}
 function build(){
  const E=root.VoidMusicEngine,A=root.VoidAudio,ctx=E?.context?.(),music=A?.bus?.('music'),ambient=A?.bus?.('ambient');
  if(!ctx||ctx.state!=='running'||!music||music.context!==ctx||!ambient)return null;
  const cfg=config,own=[],g=(v=1)=>{const n=ctx.createGain();n.gain.value=v;own.push(n);return n;},lp=f=>{const n=ctx.createBiquadFilter();n.type='lowpass';n.frequency.value=f;n.Q.value=.7;own.push(n);return n;};
  const panner=(x,y,z,model,ref,max,rolloff)=>{const p=ctx.createPanner();p.panningModel=cfg.panning;p.distanceModel=model;p.refDistance=ref;p.maxDistance=max;p.rolloffFactor=rolloff;p.coneInnerAngle=360;setPos(p,x,y,z);own.push(p);return p;};
  const out=g(cfg.level),tap=g(),source=E.worldSource(cfg.style,tap);if(!source)return null;out.connect(music.node);
  // Outside: two ways out of the building.
  const extGain=g(1),paths={};extGain.connect(out);
  paths.wall=panner(0,2.5,0,'linear',cfg.refDistance,cfg.maxDistance,1);paths.door=panner(FRONT+.3,1.7,DOOR.z,'linear',cfg.refDistance,cfg.maxDistance,1);
  const ext={};for(const id of ['wall','door']){ext[id]={lp:lp(cfg.wallCutoff),gain:g(0)};tap.connect(ext[id].lp);ext[id].lp.connect(ext[id].gain);ext[id].gain.connect(paths[id]);paths[id].connect(extGain);}
  // Inside: every speaker stack and the DJ desk play the same signal; the bed and a short reverb fill the room.
  const intGain=g(0),intLP=lp(cfg.interiorCutoff[0]),list=NC.emitters(),share=cfg.speaker.share/list.length;intGain.connect(out);tap.connect(intLP);
  for(const e of list){const eg=g(share),p=panner(e.x,e.y,e.z,'inverse',cfg.speaker.ref,200,cfg.speaker.rolloff);intLP.connect(eg);eg.connect(p);p.connect(intGain);}
  const bed=g(cfg.bed);intLP.connect(bed);bed.connect(intGain);
  const conv=ctx.createConvolver(),len=Math.floor(ctx.sampleRate*cfg.reverb.seconds),imp=ctx.createBuffer(2,len,ctx.sampleRate);
  for(let c=0;c<2;c++){const d=imp.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3);}
  conv.buffer=imp;own.push(conv);const send=g(1),wet=g(0);intLP.connect(send);send.connect(conv);conv.connect(wet);wet.connect(intGain);
  // Crowd murmur on the ambient bus, only inside.
  const nb=ctx.createBuffer(1,ctx.sampleRate*4,ctx.sampleRate),nd=nb.getChannelData(0);let acc=0;for(let i=0;i<nd.length;i++){acc=(acc+.02*(Math.random()*2-1))/1.02;nd[i]=acc*3.2;}
  const ns=ctx.createBufferSource();ns.buffer=nb;ns.loop=true;const band=ctx.createBiquadFilter();band.type='bandpass';band.frequency.value=430;band.Q.value=.6;const murmur=g(0);ns.connect(band);band.connect(murmur);murmur.connect(ambient.node);ns.start();
  return {ctx,source,out,ext,paths,intGain,extGain,intLP,wet,murmur,ns,own,
   dispose(){try{source.dispose();ns.stop();}catch(e){/* already stopped */}for(const n of own)try{n.disconnect();}catch(e){/* gone */}try{murmur.disconnect();}catch(e){/* gone */}root.VoidAudio?.trim?.('ambient',1);}};
 }
 function setListener(ctx,x,z,yaw){
  const L=ctx.listener,[px,py,pz]=audioPos(x,1.7,z),fx=Math.sin(yaw),fz=-Math.cos(yaw),t=ctx.currentTime;
  if(L.positionX){L.positionX.setTargetAtTime(px,t,.03);L.positionY.setTargetAtTime(py,t,.03);L.positionZ.setTargetAtTime(pz,t,.03);
   L.forwardX.setTargetAtTime(fx,t,.03);L.forwardY.setTargetAtTime(0,t,.03);L.forwardZ.setTargetAtTime(fz,t,.03);L.upX.value=0;L.upY.value=1;L.upZ.value=0;}
  else{L.setPosition?.(px,py,pz);L.setOrientation?.(fx,0,fz,0,1,0);}
 }
 function put(param,v,ctx,tau=.08){param.setTargetAtTime(v,ctx.currentTime,tau);}
 // Called every frame by music-integration.js. Returns what the music engine needs (`city`: the street music's share).
 function update({active,dt=.016,walker,doorOpen=false}={}){
  if(!active||!walker||!NC.enabled()){
   // Away from the club's city: stop scheduling at once, tear everything down after a while.
   if(graph){graph.source.suspend();root.VoidAudio?.trim?.('ambient',1);idle+=dt;if(idle>config.idleDispose){graph.dispose();graph=null;}}
   state=create();return {city:1,zone:'none',inside:0};
  }
  idle=0;const cfg=config,{x,z,yaw=0}=walker;
  advance(state,x,z,dt,cfg);const m=mix(state.inside,cfg),zone=zoneOf(x,z),ext=exterior(x,z,doorOpen,cfg);
  if(!graph)try{graph=build();}catch(error){graph=null;if(!update.warned){update.warned=true;console.warn('[VOID club audio]',error.message);}}
  if(graph){
   const c=graph.ctx,far=ext.distance>cfg.maxDistance+cfg.suspendMargin&&state.inside===0;
   if(far)graph.source.suspend();else graph.source.resume();
   setListener(c,x,z,yaw);
   setPos(graph.paths.wall,ext.wall.x,2.5,ext.wall.z);
   put(graph.ext.wall.gain.gain,ext.wall.gain*m.exterior,c);put(graph.ext.wall.lp.frequency,ext.wall.cutoff,c);
   put(graph.ext.door.gain.gain,ext.door.gain*m.exterior,c);put(graph.ext.door.lp.frequency,ext.door.cutoff,c);
   put(graph.intGain.gain,m.interior,c);put(graph.intLP.frequency,m.cutoff,c,.2);put(graph.wet.gain,cfg.reverb.wet*m.reverb,c);
   put(graph.murmur.gain,m.murmur,c,.3);root.VoidAudio?.trim?.('ambient',m.ambient);
  }
  last={zone,inside:state.inside,city:m.city,exterior:ext,mix:m,suspended:graph?.source.suspended??null,step:graph?.source.step??null};
  return {city:m.city,zone,inside:state.inside};
 }
 function dispose(){graph?.dispose();graph=null;state=create();idle=0;root.VoidAudio?.trim?.('ambient',1);}
 const api={config,insideTarget,zoneOf,exterior,interiorLevel,linear,inverse,create,advance,mix,update,dispose,debug:()=>last,get graph(){return graph;}};
 if(typeof module!=='undefined')module.exports=api;else root.VoidClubAudio=api;
})(globalThis);
