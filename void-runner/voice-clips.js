/* Recorded NPC dialogue (Kokoro-82M, rendered offline by tools/audio/generate.py). Each fixed line
   has a stable id in assets/audio/voice/manifest.json. Clips load on demand, play on the voice
   channel, and lines without a clip fall back to the browser voice. Iris gets a faint synthetic
   colour and Elias a hologram tone, both applied live so the recordings stay clean. */
(function(root){
 /* Live voice effects, as numbers (tests/zen-chat.test.cjs reads them in Node). android: Iris. monk: Zen Zephyr (the owner, 18 Nov 2026: a [meditative] delivery and a
    MORE digital sound than "slightly synthetic"): a 90 Hz high-pass, a 10-bit crush mixed in, a slow flanger and a short metallic echo; the recording itself stays clean.
    ZEN_STRENGTH scales every wet part of his effect at once (0 = the clean recording, 1 = the chain the owner heard as an ffmpeg preview, more = harsher). */
 const ZEN_STRENGTH=1;
 const PRESETS={
  android:{dry:.86,shelfHz:5500,shelfDb:2.5,combMs:2.3,combFeedback:.22,combMix:.1,chorusMs:12,chorusDepthMs:1.2,chorusHz:.6,chorusMix:.07},
  monk:{strength:ZEN_STRENGTH,highpassHz:90,crushBits:10,crushMix:.25,flangerMs:2,flangerDepthMs:1.5,flangerFeedback:.2,flangerHz:.25,flangerMix:.5,echoMs:18,echoDecay:.18,level:1.9}};   // level: his overall loudness (the owner, 18 Nov 2026: "make his voice louder"; about +5.6 dB, a limiter stops it clipping)
 if(typeof module==='object'&&module.exports&&typeof document==='undefined'){module.exports={PRESETS,ZEN_STRENGTH};return;}
 const base=new URL('assets/audio/voice/',document.currentScript?.src||location.href);
 const alias={Admin:'admin',Iris:'iris',Bartender:'bartender','Arcade attendant':'attendant'};
 let manifest=null,lookup=new Map(),source=null,source2=null,stopTimer=null,seq=0;const cache=new Map(),extraById=new Map(),extraCast={},translations={};
 fetch(new URL('manifest.json',base)).then(r=>r.ok?r.json():null).then(m=>{if(!m)return;manifest=m;
  for(const [id,l] of Object.entries(m.lines))lookup.set(l.speaker+'|'+l.text,{id,...l});}).catch(()=>{});
 /* A few lines voiced outside the Kokoro pipeline (ElevenLabs, rendered once and stored): extra/manifest.json. Same lookup, same playback, same live effects. */
 // A line may carry `with` {id} (Mission 003: Fish's Mandarin line): the extra clip `id` (the V1's English translation, in her own voice) starts `offset` seconds after it, at full volume,
 // while this one plays at `gain`: both stay audible, like a real-time translator. offset, gain and the translation's live effect are ONE setting per speaker
 // (extra/manifest.json translations[speaker]; `with` may override them); the translation clip's file can be swapped in its own entry. `cast` gives a speaker a live effect.
 fetch(new URL('extra/manifest.json',base)).then(r=>r.ok?r.json():null).then(m=>{if(!m)return;Object.assign(extraCast,m.cast||{});Object.assign(translations,m.translations||{});for(const [id,l] of Object.entries(m.lines||{}))if(/^extra\/[a-z0-9-]+\.ogg$/.test(l.file)){const e={id:'extra:'+id,...l};extraById.set(id,e);lookup.set(l.speaker+'|'+l.text,e);}
  // (21 Nov 2026) the same speaker saying the TRANSLATION's words (Mission 004: Fish's Comms calls are written in the owner's English) plays the original with its translation over it
  for(const e of extraById.values()){const w=e.with&&extraById.get(e.with.id);if(w&&w.speaker===e.speaker&&w.text!==e.text)lookup.set(e.speaker+'|'+w.text,{...e,shown:w.text});}}).catch(()=>{});
 // The owner's own recordings of Nomi and Se7en (their .vrcompanion packages; tea-duo.js plays them): MP3 files as supplied, listed in extra/tea-duo.json. Same lookup, same playback.
 fetch(new URL('extra/tea-duo.json',base)).then(r=>r.ok?r.json():null).then(m=>{if(!m)return;for(const [id,l] of Object.entries(m.lines||{}))if(/^extra\/tea-duo\/[a-z0-9-]+\.mp3$/i.test(l.file)){const e={id:'extra:'+id,...l};extraById.set(id,e);lookup.set(l.speaker+'|'+l.text,e);}}).catch(()=>{});
 const districtExchanges=fetch(new URL('../../../pixel-neon-dialogue.json',base)).then(response=>{
  if(!response.ok)throw Error('District dialogue '+response.status);
  return response.json();
 }).then(exchanges=>{
  for(const exchange of exchanges)for(const line of exchange.lines){
   if(!/^pn-[a-z0-9-]+$/.test(line.id))throw Error('Invalid District recording id');
   lookup.set(line.speaker+'|'+line.text,{...line,file:'extra/pixel-neon/'+line.id+'.mp3'});
  }
  return exchanges;
 }).catch(error=>{console.warn('[District dialogue]',error.message);return [];});
 const key=(who,text)=>(alias[who]||root.VoidVRCompanions?.voiceOf?.(who)?.characterId||who)+'|'+text;
 // Imported voice files (voice-imports.js, Developer Tools, 19 Nov 2026) override any recorded clip for that exact line text; same playback, same live effects.
 const imported=(who,text,ordinary)=>{const I=root.VoidVoiceImports;return I&&I.find?I.find(who,text,ordinary):null;};
 const importLine=(im,who)=>({id:'import:'+im.hash,speaker:manifest?.cast?.[im.who]||extraCast[im.who]?im.who:key(who,'').slice(0,-1),imported:im});
 function has(who,text,ordinary){return !!imported(who,text,ordinary)||lookup.has(key(who,text));}
 async function clip(context,line){
  if(cache.has(line.id))return cache.get(line.id);
  if(line.imported){const data=await context.decodeAudioData(await root.VoidVoiceImports.load(line.imported));cache.set(line.id,data);if(cache.size>40)cache.delete(cache.keys().next().value);return data;}
  const response=await fetch(new URL(line.file,base));if(!response.ok)throw Error('Voice clip '+response.status);
  const data=await context.decodeAudioData(await response.arrayBuffer());
  cache.set(line.id,data);if(cache.size>40)cache.delete(cache.keys().next().value);return data;
 }
 // Iris: ~95% natural. A faint short comb resonance, a soft high sheen and a tiny chorus; no vocoder.
 function android(ctx,input,output){const P=PRESETS.android;
  const dry=ctx.createGain();dry.gain.value=P.dry;input.connect(dry);
  const shelf=ctx.createBiquadFilter();shelf.type='highshelf';shelf.frequency.value=P.shelfHz;shelf.gain.value=P.shelfDb;dry.connect(shelf);shelf.connect(output);
  const comb=ctx.createDelay(.05);comb.delayTime.value=P.combMs/1000;const fb=ctx.createGain();fb.gain.value=P.combFeedback;const wet=ctx.createGain();wet.gain.value=P.combMix;
  input.connect(comb);comb.connect(fb);fb.connect(comb);comb.connect(wet);wet.connect(output);
  const chorus=ctx.createDelay(.05);chorus.delayTime.value=P.chorusMs/1000;const lfo=ctx.createOscillator(),depth=ctx.createGain();lfo.frequency.value=P.chorusHz;depth.gain.value=P.chorusDepthMs/1000;lfo.connect(depth);depth.connect(chorus.delayTime);lfo.start();
  const cw=ctx.createGain();cw.gain.value=P.chorusMix;input.connect(chorus);chorus.connect(cw);cw.connect(output);return [lfo];
 }
 // Zen Zephyr: PRESETS.monk. The high-passed voice goes out clean, plus (each scaled by strength) the bit-crushed copy, the flanged copy and the 18 ms echo.
 function monk(ctx,input,output){const P=PRESETS.monk,k=Math.max(0,P.strength);
  const out=ctx.createGain();out.gain.value=P.level||1;const lim=ctx.createDynamicsCompressor();lim.threshold.value=-3;lim.knee.value=0;lim.ratio.value=20;lim.attack.value=.003;lim.release.value=.1;out.connect(lim);lim.connect(output);
  const hp=ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=P.highpassHz;input.connect(hp);
  const dry=ctx.createGain();dry.gain.value=1-Math.min(.6,P.crushMix*k);hp.connect(dry);dry.connect(out);
  const crush=ctx.createWaveShaper(),steps=Math.pow(2,P.crushBits-1),curve=new Float32Array(4096);for(let i=0;i<curve.length;i++){const x=i/(curve.length-1)*2-1;curve[i]=Math.round(x*steps)/steps;}crush.curve=curve;
  const cw=ctx.createGain();cw.gain.value=P.crushMix*k;hp.connect(crush);crush.connect(cw);cw.connect(out);
  const fl=ctx.createDelay(.05);fl.delayTime.value=(P.flangerMs+P.flangerDepthMs/2)/1000;const lfo=ctx.createOscillator(),depth=ctx.createGain();lfo.frequency.value=P.flangerHz;depth.gain.value=P.flangerDepthMs/2000;lfo.connect(depth);depth.connect(fl.delayTime);lfo.start();
  const ffb=ctx.createGain();ffb.gain.value=P.flangerFeedback;fl.connect(ffb);ffb.connect(fl);const fw=ctx.createGain();fw.gain.value=P.flangerMix*k;hp.connect(fl);fl.connect(fw);fw.connect(out);
  const echo=ctx.createDelay(.1);echo.delayTime.value=P.echoMs/1000;const ew=ctx.createGain();ew.gain.value=P.echoDecay*k;hp.connect(echo);echo.connect(ew);ew.connect(out);
  const trim=1/(1+P.flangerMix*k*.5+P.echoDecay*k*.5);if(trim<1)output.gain.value*=trim;return [lfo];
 }
 // Elias: an archived hologram recording; band-limited with a slight flicker.
 function hologram(ctx,input,output){
  const hp=ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=240;const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=4800;
  const trem=ctx.createGain();trem.gain.value=.94;const lfo=ctx.createOscillator(),depth=ctx.createGain();lfo.frequency.value=7;depth.gain.value=.05;lfo.connect(depth);depth.connect(trem.gain);lfo.start();
  input.connect(hp);hp.connect(lp);lp.connect(trem);trem.connect(output);return [lfo];
 }
 // A V1 translation (spoken in the speaker's own voice, in English): a SUBTLE device colour, a little band-limited with a touch of presence; no hiss.
 function device(ctx,input,output){
  const hp=ctx.createBiquadFilter();hp.type='highpass';hp.frequency.value=170;const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=8000;
  const peak=ctx.createBiquadFilter();peak.type='peaking';peak.frequency.value=2400;peak.gain.value=1.5;peak.Q.value=.9;input.connect(hp);hp.connect(lp);lp.connect(peak);peak.connect(output);return [];
 }
 const effectOf=(ctx,name,input,output)=>name==='android'?android(ctx,input,output):name==='monk'?monk(ctx,input,output):name==='hologram'?hologram(ctx,input,output):name==='radio'?radio(ctx,input,output):name==='device'?device(ctx,input,output):(input.connect(output),[]);
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
 function cancel(){seq++;clearTimeout(stopTimer);try{source?.stop();}catch{}try{source2?.stop();}catch{}source=null;source2=null;}
 // now: the line being said ({who, text, ended, endedAt}): a Comms call with recorded lines (personal-device.js) moves on when its line has been heard.
 let now=null;
 async function speak(o){const job={who:o&&o.characterId,text:o&&o.text,ended:false,endedAt:0};now=job;try{return await speakOne(o);}finally{job.ended=true;job.endedAt=performance.now();}}
 async function speakOne({characterId,text,bus,ordinary}){
  cancel();const mine=seq,im=imported(characterId,text,ordinary),line=im?importLine(im,characterId):lookup.get(key(characterId,text));if(!line||!bus)throw Error('No recorded line');
  // The conversation's line this recording is for (scenes.js speakLine): told when it starts and ends, so a walking conversation moves on when it has been heard.
  const v=typeof speech!=='undefined'&&speech&&speech.lines[speech.index]?.text===text?speech.voice:null,play={};
  const ctx=bus.context,data=await clip(ctx,line);if(mine!==seq)return;const cast=manifest?.cast?.[line.speaker]||extraCast[line.speaker]||{};
  // the translation that plays over this line (loaded first, so the two start on time)
  const effect2=p=>'effect' in tset?tset.effect:(manifest?.cast?.[p.line.speaker]||extraCast[p.line.speaker]||{}).effect;
  let pair=null;const w=line.with&&extraById.get(line.with.id),tset={...(translations[line.speaker]||{}),...(line.with||{})};if(w){try{pair={line:w,data:await clip(ctx,w)};}catch{pair=null;}if(mine!==seq)return;}
  const playing=ctx.createBufferSource();playing.buffer=data;source=playing;
  const input=ctx.createGain(),out=ctx.createGain();out.connect(bus);playing.connect(input);if(pair)input.gain.value=Number.isFinite(tset.gain)?tset.gain:.7;
  const extra=effectOf(ctx,cast.effect,input,out);
  let second=null,extra2=[];if(pair){second=ctx.createBufferSource();second.buffer=pair.data;source2=second;const in2=ctx.createGain();second.connect(in2);extra2=effectOf(ctx,effect2(pair),in2,out);}
  const offset=pair?Math.max(0,Number(tset.offset)||0):0,total=pair?Math.max(data.duration,offset+pair.data.duration):data.duration;
  // Subtitles reveal in step with the recording.
  if(typeof speech!=='undefined'&&speech&&speech.lines[speech.index]?.text===text)speech.rate=Math.max(20,text.length/Math.max(.5,data.duration-.15));
  const ends=[new Promise(resolve=>{playing.onended=resolve;})];if(second)ends.push(new Promise(resolve=>{second.onended=resolve;}));
  const t0=ctx.currentTime+.02,wall=performance.now()+20;playing.start(t0);if(second)second.start(t0+offset);
  // what started when (ctx time and page time): the browser test checks the translator's offset from these
  const rec={primary:{id:line.id,speaker:line.speaker,...(line.imported?{imported:line.imported.src}:{}),gain:input.gain.value,at:t0,wall,duration:data.duration}};if(second)rec.secondary={id:pair.line.id,speaker:pair.line.speaker,gain:1,at:t0+offset,wall:wall+offset*1000,offset,duration:pair.data.duration,effect:effect2(pair)||null};
  played.push(rec);if(played.length>20)played.shift();
  if(v)Object.assign(v,{play,started:true,ended:false,startedAt:performance.now(),duration:total});
  await Promise.all(ends);
  if(v&&v.play===play)Object.assign(v,{ended:true,endedAt:performance.now()});
  for(const o of [...extra,...extra2])try{o.stop();}catch{}out.disconnect();if(source===playing)source=null;if(source2===second)source2=null;
 }
 const played=[];
 // duration: seconds the recorded line lasts with its translation over it (0 until its clip has loaded once). foreign: the original words a translated recording says
 // ({text, translation}) when the line asked for is its translation, else null: a Comms call shows them as the original and V1 TRANSLATION (personal-device.js).
 function duration(who,text){const l=lookup.get(key(who,text)),d=l&&cache.get(l.id);if(!d)return 0;const w=l.with&&extraById.get(l.with.id),pd=w&&cache.get(w.id),t={...(translations[l.speaker]||{}),...(l.with||{})};return pd?Math.max(d.duration,Math.max(0,Number(t.offset)||0)+pd.duration):d.duration;}
 function foreign(who,text){const l=lookup.get(key(who,text));return l&&l.shown===text&&l.text!==text?{text:l.text,translation:text}:null;}
 root.VoidVoiceClips={districtExchanges,has,speak,cancel,broadcast,PRESETS,duration,foreign,get now(){return now;},get count(){return lookup.size;},get played(){return played.slice();},pairOf:(who,text)=>{const l=lookup.get(key(who,text));return l&&l.with?{...(translations[l.speaker]||{}),...l.with}:null;},get translations(){return JSON.parse(JSON.stringify(translations));}};
 root.VoidAudio?.setVoiceProvider?.(root.VoidVoiceClips);
 // Replay the current line on demand.
 const voicedRender=renderLine;
 renderLine=function(){if(speech)speech.rate=null;voicedRender();const line=speech?.lines[speech.index];if(line&&line.who!=='pilot')screen.querySelector('.speech-controls')?.insertAdjacentHTML('afterbegin','<button data-action="speech-replay" class="quiet" title="Replay line">REPLAY ↺</button>');};
 screen.addEventListener('click',e=>{if(e.target.closest('button')?.dataset.action!=='speech-replay'||!speech)return;speakLine();});
})(globalThis);
