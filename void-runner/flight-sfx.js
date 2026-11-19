/* Flight sound (the owner, 19 Nov 2026: "Add sound effects to flying"). Everything is synthesized here with WebAudio: no recorded or bought files.
   It plays through ship-audio.js's EFFECTS channel, so the game's master / effects volume and mute apply; sounds from a place in space are panned and
   fade with distance (VoidAudio.spatial). Layers: the engine (a rumble and a turbine whine that follow the throttle, louder on the drive / boost),
   lasers, missile launch and motor, the lock tones (a seeking beep that speeds up, then a solid tone while locked), hits on shields and hulls,
   explosions, the player's own shield / hull hits and the lock / missile warnings. VoidFlightSfx.log / counts record what was asked for (tests:
   a headless browser cannot listen). Outside flight VoidAudio's own small tones are unchanged. */
(function(root){
 'use strict';
 const A=root.VoidAudio;if(!A||root.VoidFlightSfx)return;
 const log=[],counts={};let ctx=null,bus=null,noiseBuf=null,engine=null,lockNode=null,beepAt=0;
 const note=(name,extra)=>{counts[name]=(counts[name]||0)+1;log.push({name,at:Date.now(),...(extra||{})});if(log.length>300)log.shift();};
 const flying=()=>{try{return typeof mode!=='undefined'&&(mode==='play'||mode==='pause');}catch{return false;}};
 function ready(){const b=A.bus('effects');if(!b)return false;if(b.context!==ctx){ctx=b.context;bus=b.node;noiseBuf=null;engine=null;lockNode=null;}return ctx.state==='running';}
 function noise(){if(noiseBuf)return noiseBuf;const n=ctx.sampleRate*2;noiseBuf=ctx.createBuffer(1,n,ctx.sampleRate);const d=noiseBuf.getChannelData(0);let seed=91731;for(let i=0;i<n;i++){seed=seed*16807%2147483647;d[i]=seed/2147483647*2-1;}return noiseBuf;}
 // An output with distance and pan; null when it is too far to hear.
 function out(position,basis,level){const s=position?A.spatial(position,basis):{volume:1,pan:0};if(s.volume<.002)return null;const g=ctx.createGain();g.gain.value=level*s.volume;const p=ctx.createStereoPanner?.();if(p){p.pan.value=s.pan;g.connect(p);p.connect(bus);}else g.connect(bus);setTimeout(()=>{try{g.disconnect();p?.disconnect();}catch{}},4000);return g;}
 function env(param,t,attack,peak,decay){param.setValueAtTime(.0001,t);param.exponentialRampToValueAtTime(Math.max(.0002,peak),t+attack);param.exponentialRampToValueAtTime(.0001,t+attack+decay);}
 function tone(dest,type,f0,f1,dur,peak,delay=0,attack=.004){const t=ctx.currentTime+delay,o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);env(g.gain,t,attack,peak,dur);o.connect(g);g.connect(dest);o.start(t);o.stop(t+attack+dur+.05);o.onended=()=>{o.disconnect();g.disconnect();};}
 function hiss(dest,kind,f0,f1,dur,peak,delay=0,attack=.004,q=.8){const t=ctx.currentTime+delay,s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=noise();s.loop=true;f.type=kind;f.Q.value=q;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(Math.max(30,f1),t+attack+dur);env(g.gain,t,attack,peak,dur);s.connect(f);f.connect(g);g.connect(dest);s.start(t,Math.random()*1.5);s.stop(t+attack+dur+.05);s.onended=()=>{s.disconnect();f.disconnect();g.disconnect();};}
 const SFX={
  // pulse cannon: a bright descending zap with a short click at the muzzle
  laser(o){const d=out(null,null,.55);if(!d)return;tone(d,'square',1750,420,.085,.05);tone(d,'sawtooth',880,190,.11,.035,.004);hiss(d,'highpass',5200,2600,.035,.05);},
  enemyFire(o){const d=out(o.position,o.basis,.6);if(!d)return;tone(d,'sawtooth',760,180,.14,.05);hiss(d,'bandpass',2400,900,.05,.03);},
  // missile: ignition thump, then the motor's roar and whoosh as it pulls away
  missile(o){const d=out(o.position,o.basis,.9);if(!d)return;tone(d,'sine',140,48,.22,.16);hiss(d,'lowpass',3800,700,.05,.22,0,.003,.5);hiss(d,'bandpass',1400,380,1.15,.12,.04,.08,1.2);tone(d,'sawtooth',95,58,1,.025,.05,.1);},
  // a lock is made: two quick rising notes (the solid tone follows from lockTone)
  lock(){const d=out(null,null,.5);if(!d)return;tone(d,'sine',1320,1320,.06,.07);tone(d,'sine',1760,1760,.09,.07,.075);},
  cycle(){const d=out(null,null,.45);if(!d)return;tone(d,'triangle',1100,900,.035,.05);},
  dry(){const d=out(null,null,.45);if(!d)return;tone(d,'square',180,120,.05,.04);hiss(d,'bandpass',900,600,.03,.04);},
  // a laser bolt landing: a metallic tick on the hull, a glassy ring on a shield
  hit(o){const d=out(o.position,o.basis,.8);if(!d)return;hiss(d,'highpass',4200,1800,.06,.09);tone(d,'triangle',2400,700,.07,.04);},
  shieldHit(o){const d=out(o.position,o.basis,.8);if(!d)return;tone(d,'sine',620,980,.18,.05);hiss(d,'bandpass',1800,4200,.16,.05,0,.01,3);},
  explosion(o){const d=out(o.position,o.basis,1);if(!d)return;tone(d,'sine',90,28,.9,.3,0,.004);hiss(d,'lowpass',2600,60,1.5,.32,0,.004,.4);hiss(d,'bandpass',600,120,.8,.12,.05,.02,.7);},
  // the player's own ship hit: shield crackle, or a hull crunch with a low thud
  shield(){const d=out(null,null,.8);if(!d)return;hiss(d,'bandpass',3200,1100,.24,.13,0,.004,2.2);tone(d,'triangle',320,170,.2,.05);},
  hull(){const d=out(null,null,.9);if(!d)return;tone(d,'square',72,38,.3,.09);hiss(d,'lowpass',1400,90,.4,.24,0,.003,.6);},
  warning(){const d=out(null,null,.5);if(!d)return;tone(d,'square',880,880,.1,.04);tone(d,'square',660,660,.1,.04,.16);},
  incoming(){const d=out(null,null,.6);if(!d)return;for(let i=0;i<3;i++)tone(d,'square',1250,1250,.06,.055,i*.11);},
  boost(){const d=out(null,null,.8);if(!d)return;hiss(d,'lowpass',260,2600,.55,.18,0,.12,.9);tone(d,'sawtooth',70,190,.6,.04,0,.1);},
  warp(){const d=out(null,null,.6);if(!d)return;hiss(d,'bandpass',200,3000,1.2,.12,0,.3,1.5);tone(d,'sine',60,240,1.3,.08,0,.3);},
  exit(){const d=out(null,null,.6);if(!d)return;hiss(d,'lowpass',3000,200,.8,.12,0,.01,.6);tone(d,'sine',240,60,.7,.07);},
  charge(){const d=out(null,null,.5);if(!d)return;tone(d,'sine',70,320,1,.05,0,.2);}
 };
 const FLIGHT_ONLY=new Set(['laser','enemyFire','missile','hit','shieldHit','incoming','warning','boost','warp','exit','charge','shield','hull']);
 const event=A.event;
 A.event=function(name,ship,position,basis){
  if(SFX[name]&&(flying()||FLIGHT_ONLY.has(name)&&name!=='hull'&&name!=='shield')){note(name);if(ready()){try{SFX[name]({ship,position,basis});}catch{}}return;}
  return event.apply(this,arguments);
 };
 // Engine: rumble (noise through a low-pass) and a turbine whine, both following the throttle; the drive (boost) opens them up. Built once per audio context.
 function buildEngine(){const s=ctx.createBufferSource(),lp=ctx.createBiquadFilter(),rg=ctx.createGain(),w=ctx.createOscillator(),bp=ctx.createBiquadFilter(),wg=ctx.createGain(),w2=ctx.createOscillator(),w2g=ctx.createGain();
  s.buffer=noise();s.loop=true;lp.type='lowpass';lp.frequency.value=140;lp.Q.value=.7;rg.gain.value=0;s.connect(lp);lp.connect(rg);rg.connect(bus);s.start();
  w.type='sawtooth';w.frequency.value=180;bp.type='bandpass';bp.Q.value=4;bp.frequency.value=600;wg.gain.value=0;w.connect(bp);bp.connect(wg);wg.connect(bus);w.start();
  w2.type='sine';w2.frequency.value=55;w2g.gain.value=0;w2.connect(w2g);w2g.connect(bus);w2.start();
  return {lp,rg,w,bp,wg,w2,w2g,level:0};}
 let lastLevel=0;
 const update=A.update;
 A.update=function(ship,throttle,turn,phase,active){
  const r=update.apply(this,arguments);
  try{if(!ready())return r;engine??=buildEngine();const t=ctx.currentTime,boost=(()=>{try{return typeof driveTime!=='undefined'&&driveTime>0;}catch{return false;}})();
   const th=Math.max(0,Math.min(1.4,throttle||0)),on=active&&flying()?1:0,warp=phase==='warp'?1:0,lvl=on*(.35+th*.45+(boost?.35:0));
   engine.lp.frequency.setTargetAtTime(110+th*380+(boost?500:0)+warp*900,t,.15);engine.rg.gain.setTargetAtTime(lvl*.11,t,.2);
   engine.w.frequency.setTargetAtTime((ship?.audio?.frequency||42)*(3.2+th*2.6+(boost?1.6:0)+turn*.4)*(warp?1.8:1),t,.18);engine.bp.frequency.setTargetAtTime(500+th*900+(boost?700:0),t,.2);engine.wg.gain.setTargetAtTime(lvl*.018,t,.2);
   engine.w2.frequency.setTargetAtTime((ship?.audio?.frequency||42)*(1+th*.6),t,.2);engine.w2g.gain.setTargetAtTime(lvl*.05,t,.2);
   engine.level=lvl;lastLevel=lvl;}catch{}
  return r;
 };
 /* Lock tones (called every flight frame): 'seeking' beeps faster as the lock builds; 'locked' is a steady tone; 'off' is silent. */
 let lockState='off';
 function lockTone(status,progress=0){
  if(status!==lockState){note('lock-'+status);lockState=status;}
  if(!ready())return;const t=ctx.currentTime;
  if(!lockNode){const o=ctx.createOscillator(),f=ctx.createBiquadFilter(),g=ctx.createGain();o.type='square';o.frequency.value=1480;f.type='lowpass';f.frequency.value=2600;g.gain.value=0;o.connect(f);f.connect(g);g.connect(bus);o.start();lockNode={o,g};}
  lockNode.g.gain.setTargetAtTime(status==='locked'&&flying()?.022:0,t,.02);
  if(status==='seeking'&&flying()&&t>=beepAt){const d=out(null,null,.5);if(d)tone(d,'square',980,980,.045,.05);beepAt=t+Math.max(.08,.34-.26*progress);}
 }
 // Leaving flight stops the engine layers and the lock tone at once.
 setInterval(()=>{if(!ctx||flying())return;try{const t=ctx.currentTime;if(engine){engine.rg.gain.setTargetAtTime(0,t,.1);engine.wg.gain.setTargetAtTime(0,t,.1);engine.w2g.gain.setTargetAtTime(0,t,.1);}if(lockNode)lockNode.g.gain.setTargetAtTime(0,t,.05);lockState='off';}catch{}},250);
 root.VoidFlightSfx={SFX,lockTone,get log(){return log;},get counts(){return counts;},get engineLevel(){return lastLevel;},get lockState(){return lockState;},get running(){return !!ctx&&ctx.state==='running';},reset(){log.length=0;for(const k of Object.keys(counts))delete counts[k];}};
})(globalThis);
