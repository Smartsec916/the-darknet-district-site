/* Recorded NPC dialogue (Kokoro-82M, rendered offline by tools/audio/generate.py). Each fixed line
   has a stable id in assets/audio/voice/manifest.json. Clips load on demand, play on the voice
   channel, and lines without a clip fall back to the browser voice. Iris gets a faint synthetic
   colour and Elias a hologram tone, both applied live so the recordings stay clean. */
(function(root){
 const base=new URL('assets/audio/voice/',document.currentScript?.src||location.href);
 const alias={Admin:'admin',Iris:'iris',Bartender:'bartender','Arcade attendant':'attendant'};
 let manifest=null,lookup=new Map(),source=null,stopTimer=null,seq=0;const cache=new Map();
 fetch(new URL('manifest.json',base)).then(r=>r.ok?r.json():null).then(m=>{if(!m)return;manifest=m;
  for(const [id,l] of Object.entries(m.lines))lookup.set(l.speaker+'|'+l.text,{id,...l});}).catch(()=>{});
 /* A few lines voiced outside the Kokoro pipeline (ElevenLabs, rendered once and stored): extra/manifest.json. Same lookup, same playback, same live effects. */
 fetch(new URL('extra/manifest.json',base)).then(r=>r.ok?r.json():null).then(m=>{if(!m)return;for(const [id,l] of Object.entries(m.lines||{}))if(/^extra\/[a-z0-9-]+\.ogg$/.test(l.file))lookup.set(l.speaker+'|'+l.text,{id:'extra:'+id,...l});}).catch(()=>{});
 const key=(who,text)=>(alias[who]||root.VoidVRCompanions?.voiceOf?.(who)?.characterId||who)+'|'+text;
 function has(who,text){return lookup.has(key(who,text));}
 async function clip(context,line){
  if(cache.has(line.id))return cache.get(line.id);
  const response=await fetch(new URL(line.file,base));if(!response.ok)throw Error('Voice clip '+response.status);
  const data=await context.decodeAudioData(await response.arrayBuffer());
  cache.set(line.id,data);if(cache.size>40)cache.delete(cache.keys().next().value);return data;
 }
 // Iris: ~95% natural. A faint short comb resonance, a soft high sheen and a tiny chorus; no vocoder.
 function android(ctx,input,output){
  const dry=ctx.createGain();dry.gain.value=.86;input.connect(dry);
  const shelf=ctx.createBiquadFilter();shelf.type='highshelf';shelf.frequency.value=5500;shelf.gain.value=2.5;dry.connect(shelf);shelf.connect(output);
  const comb=ctx.createDelay(.05);comb.delayTime.value=.0023;const fb=ctx.createGain();fb.gain.value=.22;const wet=ctx.createGain();wet.gain.value=.1;
  input.connect(comb);comb.connect(fb);fb.connect(comb);comb.connect(wet);wet.connect(output);
  const chorus=ctx.createDelay(.05);chorus.delayTime.value=.012;const lfo=ctx.createOscillator(),depth=ctx.createGain();lfo.frequency.value=.6;depth.gain.value=.0012;lfo.connect(depth);depth.connect(chorus.delayTime);lfo.start();
  const cw=ctx.createGain();cw.gain.value=.07;input.connect(chorus);chorus.connect(cw);cw.connect(output);return [lfo];
 }
 // Elias: an archived hologram recording; band-limited with a slight flicker.
 function hologram(ctx,input,output){
  const hp=ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=240;const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=4800;
  const trem=ctx.createGain();trem.gain.value=.94;const lfo=ctx.createOscillator(),depth=ctx.createGain();lfo.frequency.value=7;depth.gain.value=.05;lfo.connect(depth);depth.connect(trem.gain);lfo.start();
  input.connect(hp);hp.connect(lp);lp.connect(trem);trem.connect(output);return [lfo];
 }
 // Relay broadcasts: a transmission band with light grit and a faint carrier hiss, applied live so
 // the recording (the broadcaster's voice) stays clean.
 function radio(ctx,input,output){
  const hp=ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=320;const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=3400;
  const peak=ctx.createBiquadFilter();peak.type='peaking';peak.frequency.value=1700;peak.gain.value=3;peak.Q.value=.8;
  const grit=ctx.createWaveShaper(),curve=new Float32Array(256);for(let i=0;i<256;i++){const x=i/127.5-1;curve[i]=Math.tanh(x*1.6)/Math.tanh(1.6);}grit.curve=curve;
  input.connect(hp);hp.connect(lp);lp.connect(peak);peak.connect(grit);grit.connect(output);
  const noise=ctx.createBufferSource(),buffer=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate),d=buffer.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
  noise.buffer=buffer;noise.loop=true;const hiss=ctx.createBiquadFilter();hiss.type='bandpass';hiss.frequency.value=2600;const level=ctx.createGain();level.gain.value=.012;
  noise.connect(hiss);hiss.connect(level);level.connect(output);noise.start();return [noise];
 }
 // Plays one Relay line on the given bus node; returns {done, stop} or null when it has no recording.
 function broadcast(speaker,text,bus){
  const line=lookup.get(speaker+'|'+text);if(!line||!bus)return null;
  let playing=null,stopped=false,duration=0,startedAt=null;
  const done=(async()=>{
   const ctx=bus.context,data=await clip(ctx,line);if(stopped)return;duration=data.duration;
   playing=ctx.createBufferSource();playing.buffer=data;const input=ctx.createGain(),out=ctx.createGain();out.connect(bus);playing.connect(input);
   const extra=radio(ctx,input,out);await new Promise(resolve=>{playing.onended=resolve;playing.start();startedAt=ctx.currentTime;});
   for(const o of extra)try{o.stop();}catch{}out.disconnect();
  })();
  // duration: the recording's length in seconds once it has loaded (0 until then); progress: 0..1 how far through it the sound is. A screen shows the
  // words in step with these (ad-screens.js).
  return {done,stop(){stopped=true;try{playing?.stop();}catch{}},get duration(){return duration;},get progress(){return startedAt===null||!duration?0:Math.min(1,(bus.context.currentTime-startedAt)/duration);}};
 }
 // seq: a clip still loading when the next line (or a cancel) comes is dropped instead of playing over it.
 function cancel(){seq++;clearTimeout(stopTimer);try{source?.stop();}catch{}source=null;}
 async function speak({characterId,text,bus}){
  cancel();const mine=seq,line=lookup.get(key(characterId,text));if(!line||!bus)throw Error('No recorded line');
  // The conversation's line this recording is for (scenes.js speakLine): told when it starts and ends, so a walking conversation moves on when it has been heard.
  const v=typeof speech!=='undefined'&&speech&&speech.lines[speech.index]?.text===text?speech.voice:null,play={};
  const ctx=bus.context,data=await clip(ctx,line);if(mine!==seq)return;const cast=manifest?.cast?.[line.speaker]||{};
  const playing=ctx.createBufferSource();playing.buffer=data;source=playing;
  const input=ctx.createGain(),out=ctx.createGain();out.connect(bus);playing.connect(input);
  const extra=cast.effect==='android'?android(ctx,input,out):cast.effect==='hologram'?hologram(ctx,input,out):cast.effect==='radio'?radio(ctx,input,out):(input.connect(out),[]);
  // Subtitles reveal in step with the recording.
  if(typeof speech!=='undefined'&&speech&&speech.lines[speech.index]?.text===text)speech.rate=Math.max(20,text.length/Math.max(.5,data.duration-.15));
  await new Promise(resolve=>{playing.onended=resolve;playing.start();if(v)Object.assign(v,{play,started:true,ended:false,startedAt:performance.now(),duration:data.duration});});
  if(v&&v.play===play)Object.assign(v,{ended:true,endedAt:performance.now()});
  for(const o of extra)try{o.stop();}catch{}out.disconnect();if(source===playing)source=null;
 }
 root.VoidVoiceClips={has,speak,cancel,broadcast,get count(){return lookup.size;}};
 root.VoidAudio?.setVoiceProvider?.(root.VoidVoiceClips);
 // Replay the current line on demand.
 const voicedRender=renderLine;
 renderLine=function(){if(speech)speech.rate=null;voicedRender();const line=speech?.lines[speech.index];if(line&&line.who!=='pilot')screen.querySelector('.speech-controls')?.insertAdjacentHTML('afterbegin','<button data-action="speech-replay" class="quiet" title="Replay line">REPLAY ↺</button>');};
 screen.addEventListener('click',e=>{if(e.target.closest('button')?.dataset.action!=='speech-replay'||!speech)return;speakLine();});
})(globalThis);
