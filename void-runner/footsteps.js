/* Footsteps you can place by ear (David, 15 Nov 2026): other players and NPCs who are walking near you make steps that come from where they are, fade with
   distance, and are louder and quicker when they run. Your own steps are louder when you run (babylon-integration.js).
   - Who: every figure the scene is moving (crowd figures, named residents, other players). Nothing is asked of the multiplayer server: a figure's speed is
     measured from how far it moved on screen, so a running player sounds like running without any new network field.
   - Sound: one short soft thud made in code (no audio file), played through a Web Audio panner at the figure's feet on the effects channel, so the game's
     Effects volume and mute apply. Only the nearest few movers are voiced, and nothing runs while nobody near you is moving.
   Pure rules (cadence, loudness, who is voiced) are tested in Node (tests/footsteps.test.cjs). */
(function(root){
 'use strict';
 const config={range:16,maxVoices:5,walk:{every:.52,gain:.32},run:{every:.3,gain:.62},runSpeed:4.6,minSpeed:.45,ref:1.6,rolloff:1.4};
 /* speed (m/s) -> null when standing, else {every (seconds between steps), gain, run}. */
 function gait(speed){if(!(speed>=config.minSpeed))return null;const run=speed>=config.runSpeed,g=run?config.run:config.walk;
  // a slow walk steps a little slower; a sprint a little faster
  const k=run?Math.min(1.25,speed/5.6):Math.max(.7,Math.min(1.2,speed/1.5));return {every:g.every/k,gain:g.gain,run};}
 /* Of the movers [{id, dist, speed}], the ones to voice: moving, in range, nearest first, at most maxVoices. */
 function audible(list){return (list||[]).filter(m=>m.dist<=config.range&&gait(m.speed)).sort((a,b)=>a.dist-b.dist).slice(0,config.maxVoices);}
 const pure={config,gait,audible};
 if(typeof module!=='undefined'&&module.exports){module.exports=pure;return;}
 if(typeof document==='undefined')return;

 let thud=null,thudCtx=null,candidates=[],scanAt=0;const track=new Map();   // node -> {x,z,speed,next}
 const scene=()=>root.VoidBabylon?.scene||null;
 function buffer(ctx){if(thud&&thudCtx===ctx)return thud;const n=Math.floor(ctx.sampleRate*.09),b=ctx.createBuffer(1,n,ctx.sampleRate),d=b.getChannelData(0);let q=9973,lp=0;
  for(let i=0;i<n;i++){q=(q*1103515245+12345)&0x7fffffff;const noise=q/0x3fffffff-1,env=Math.exp(-i/(ctx.sampleRate*.018));lp+=(noise-lp)*.18;d[i]=(lp*.9+Math.sin(i/ctx.sampleRate*2*Math.PI*78)*.5)*env;}
  thud=b;thudCtx=ctx;return b;}
 function listener(ctx,cam){const p=cam.globalPosition,f=cam.getForwardRay(1).direction,L=ctx.listener,t=ctx.currentTime;
  if(L.positionX){L.positionX.setTargetAtTime(p.x,t,.03);L.positionY.setTargetAtTime(p.y,t,.03);L.positionZ.setTargetAtTime(-p.z,t,.03);L.forwardX.setTargetAtTime(f.x,t,.03);L.forwardY.setTargetAtTime(0,t,.03);L.forwardZ.setTargetAtTime(-f.z,t,.03);L.upX.value=0;L.upY.value=1;L.upZ.value=0;}
  else{L.setPosition?.(p.x,p.y,-p.z);L.setOrientation?.(f.x,0,-f.z,0,1,0);}}
 function play(bus,x,z,g){const ctx=bus.context,src=ctx.createBufferSource(),gain=ctx.createGain(),pan=ctx.createPanner();src.buffer=buffer(ctx);src.playbackRate.value=.9+Math.random()*.25;gain.gain.value=g;
  pan.panningModel='HRTF';pan.distanceModel='inverse';pan.refDistance=config.ref;pan.maxDistance=config.range*1.5;pan.rolloffFactor=config.rolloff;
  if(pan.positionX){pan.positionX.value=x;pan.positionY.value=.1;pan.positionZ.value=-z;}else pan.setPosition?.(x,.1,-z);
  src.connect(gain);gain.connect(pan);pan.connect(bus.node);src.onended=()=>{try{pan.disconnect();gain.disconnect();}catch{}};src.start();}
 const isFigure=n=>!!n&&!n.isDisposed()&&n.isEnabled()&&(/^remote-player:/.test(n.name)||/^npc-/.test(n.name)||!!(n.metadata&&(n.metadata.crowd||n.metadata.character||n.metadata.club)));
 let last=0;
 function tick(){
  const now=performance.now(),dt=(now-last)/1000;if(dt<.1)return;last=now;if(dt>1)return;   // ten times a second; a long pause (tab hidden) is skipped, not caught up
  const sc=scene(),cam=sc?.activeCamera;if(!cam||typeof mode==='undefined'||mode!=='walking'||typeof walker==='undefined'||!walker)return;
  if(now-scanAt>2000){scanAt=now;candidates=sc.transformNodes.filter(isFigure);for(const n of [...track.keys()])if(!candidates.includes(n))track.delete(n);}
  const movers=[];
  for(const n of candidates){if(n.isDisposed()||!n.isEnabled())continue;const p=n.getAbsolutePosition(),d=Math.hypot(p.x-cam.globalPosition.x,p.z-cam.globalPosition.z);
   let t=track.get(n);if(!t){t={x:p.x,z:p.z,speed:0,next:0};track.set(n,t);continue;}
   const v=Math.hypot(p.x-t.x,p.z-t.z)/dt;t.speed=v>12?0:t.speed*.5+v*.5;t.x=p.x;t.z=p.z;   // a jump (teleport, a figure put back) is not a step
   if(d<=config.range)movers.push({id:n,dist:d,speed:t.speed,x:p.x,z:p.z});}
  const voiced=pure.audible(movers);if(!voiced.length)return;
  const bus=root.VoidAudio?.bus?.('effects');if(!bus||bus.context.state!=='running')return;listener(bus.context,cam);
  for(const m of voiced){const t=track.get(m.id),g=pure.gait(m.speed);t.next-=dt;if(t.next<=0){t.next=g.every;play(bus,m.x,m.z,g.gain);}}
 }
 setInterval(tick,50);
 root.VoidFootsteps={...pure,get tracked(){return track.size;}};
})(typeof globalThis!=='undefined'?globalThis:this);
