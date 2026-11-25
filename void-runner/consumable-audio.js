// Connect temporarily between one source bus and its destination. Preview uses its own source.
(function(root){
 'use strict';
 function attach(context,source,destination){
  const c=context,low=c.createBiquadFilter(),high=c.createBiquadFilter(),dry=c.createGain(),mix=c.createGain(),delay=c.createDelay(2),feedback=c.createGain(),wet=c.createGain(),reverb=c.createConvolver(),room=c.createGain();
  const pan=c.createStereoPanner?.()||c.createGain(),drive=c.createWaveShaper(),driveMix=c.createGain();
  low.type='lowpass';high.type='highpass';low.frequency.value=Math.min(22000,c.sampleRate/2);high.frequency.value=10;
  wet.gain.value=room.gain.value=feedback.gain.value=driveMix.gain.value=0;
  const impulse=c.createBuffer(2,Math.round(c.sampleRate*1.1),c.sampleRate);
  for(let n=0;n<2;n++){const a=impulse.getChannelData(n);for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*Math.pow(1-i/a.length,3);}
  reverb.buffer=impulse;const curve=Float32Array.from({length:512},(_,i)=>Math.tanh(2.7*(i/511*2-1)));drive.curve=curve;
  source.disconnect(destination);source.connect(high);high.connect(low);low.connect(dry);dry.connect(mix);
  low.connect(delay);delay.connect(feedback);feedback.connect(delay);delay.connect(wet);wet.connect(mix);
  low.connect(reverb);reverb.connect(room);room.connect(mix);low.connect(drive);drive.connect(driveMix);driveMix.connect(mix);mix.connect(pan);pan.connect(destination);
  const set=(p,v)=>{if(p&&Math.abs(p.value-v)>.0001)p.setTargetAtTime(v,c.currentTime,.035);};
  const noise=c.createBufferSource(),noiseGain=c.createGain(),air=c.createBiquadFilter();air.type='bandpass';noiseGain.gain.value=0;
  const samples=c.createBuffer(1,c.sampleRate,c.sampleRate),mono=samples.getChannelData(0);for(let i=0;i<mono.length;i++)mono[i]=Math.random()*2-1;
  noise.buffer=samples;noise.loop=true;noise.connect(air);air.connect(noiseGain);noiseGain.connect(mix);noise.start();
  // Overlapping delay ramps transpose the wet signal without changing game time or voice playback speed.
  const shifted=c.createGain();shifted.gain.value=0;shifted.connect(mix);const voices=[];
  for(const phase of [0,.5]){const line=c.createDelay(.16),level=c.createGain();low.connect(line);line.connect(level);level.connect(shifted);voices.push({line,level,phase});}
  const heart=c.createOscillator(),heartGain=c.createGain();heart.frequency.value=59;heartGain.gain.value=0;heart.connect(heartGain);heartGain.connect(mix);heart.start();
  let nextBeat=0;
  function apply(frame){
   let lp=Math.min(22000,c.sampleRate/2),hp=10,echo=0,fb=0,dt=.15,rv=0,d=0,p=0,pulse=1,noiseLevel=0,noiseHz=700,semi=0,volume=1,heartbeat=0,bpm=72;
   for(const [type,entries] of frame.effects)for(const {params:v,weight:w,time:t} of entries){
    if(type==='audioFilter'){lp=Math.min(lp,lp*Math.pow(Math.min(lp,v.lowpass)/lp,w));hp=Math.max(hp,10*Math.pow(Math.max(10,v.highpass)/10,w));}
    if(type==='audioEcho'){echo=Math.max(echo,v.mix*w);fb=Math.max(fb,Math.min(.75,v.feedback*w));dt=v.delay;rv=Math.max(rv,v.reverb*w);}
    if(type==='audioDistortion')d=Math.max(d,v.drive*v.mix*w);
    if(type==='audioPitch')semi=(v.semitones+Math.sin(t)*v.wobble)*w;
    if(type==='audioWhispers'){noiseLevel+=v.level*w*(.4+.4*Math.sin(t*(2+v.density*5)))*.12;noiseHz=1200+v.pitch*1200;}
    if(type==='audioVolume')volume*=1+(v.gain-1)*w;
    if(type==='audioHeartbeat'){heartbeat=Math.max(heartbeat,w*v.level);bpm=v.bpm;}
    if(type==='audioAmbient'){noiseLevel+=v.level*w*.1;noiseHz=200+v.style*220;}
    if(type==='audioPan'){p+=Math.sin(t*v.rate*6.283)*v.depth*w;pulse-=.35*v.pulse*w*(.5+.5*Math.sin(t*v.pulseRate*6.283));}
   }
   const now=c.currentTime;
   if(heartbeat){nextBeat=Math.max(nextBeat,now);while(nextBeat<now+.36){
    for(const offset of [0,.14]){const t=nextBeat+offset,gain=heartGain.gain;gain.setValueAtTime(0,t);gain.linearRampToValueAtTime(heartbeat*(offset?.065:.1),t+.014);gain.linearRampToValueAtTime(0,t+.105);}
    nextBeat+=60/bpm;
   }}else{heartGain.gain.cancelScheduledValues(now);heartGain.gain.value=0;nextBeat=now;}
   set(noiseGain.gain,Math.min(.15,noiseLevel));set(air.frequency,noiseHz);
   const ratio=Math.pow(2,semi/12),period=.09/Math.max(.03,Math.abs(1-ratio)),start=c.currentTime;
   for(const {line,level,phase} of voices){
    const span=.4,steps=64,gain=new Float32Array(steps),times=new Float32Array(steps);
    for(let i=0;i<steps;i++){const ph=((start+span*i/(steps-1))/period+phase)%1;gain[i]=Math.sin(ph*Math.PI)**2;times[i]=.005+.09*(semi>0?1-ph:ph);}
    for(const [param,values] of [[line.delayTime,times],[level.gain,gain]]){param.cancelScheduledValues(start);param.setValueCurveAtTime(values,start,span);}
   }
   set(shifted.gain,semi?1:0);set(low.frequency,lp);set(high.frequency,Math.min(hp,lp*.9));set(delay.delayTime,dt);set(feedback.gain,fb);set(wet.gain,echo*.55);set(room.gain,rv*.45);set(driveMix.gain,d*.65);set(dry.gain,semi?0:1-d*.5);set(pan.pan,Math.max(-1,Math.min(1,p)));set(mix.gain,Math.min(1.5,volume*Math.max(.3,pulse)));
  }
  function dispose(){heart.stop();heart.disconnect();heartGain.disconnect();noise.stop();for(const n of [noise,noiseGain,air,shifted,...voices.flatMap(v=>[v.line,v.level])])n.disconnect();source.disconnect(high);source.connect(destination);for(const n of [low,high,dry,mix,delay,feedback,wet,reverb,room,pan,drive,driveMix])n.disconnect();}
  return {apply,dispose};
 }
 // Only observe running doses. A reconnect cannot replay a past expiration.
 function cues(play){
  const voices=new Map();
  function stopAll(){for(const v of voices.values())v.loop?.pause();voices.clear();}
  function tick(rows,now){
   const seen=new Set();
   for(const row of rows){
    const d=row.definition,key=row.item+'/'+row.startedAt,until=row.until;
    if(!d||now<row.startedAt||now>=until||(!d.loopSound&&!d.expireSound))continue;
    seen.add(key);const v=voices.get(key);
    if(v){v.until=until;continue;}
    voices.set(key,{loop:d.loopSound?play(d.loopSound,true):null,end:d.expireSound,until});
   }
   for(const [key,v] of voices)if(!seen.has(key)){
    v.loop?.pause();voices.delete(key);if(v.end&&now>=v.until&&now-v.until<1.5)play(v.end,false);
   }
  }
  return {tick,stopAll};
 }
 function playAsset(src,loop=false){
  if(!/^assets\/audio\/[a-z0-9_/-]+\.(mp3|ogg|wav|m4a)$/i.test(src))return null;
  const voice=new Audio('void-runner/'+src);voice.loop=loop;voice.volume=.45;voice.play().catch(()=>{});return voice;
 }
 root.VoidConsumableAudio={attach,cues,playAsset};
})(globalThis);
