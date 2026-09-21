/* Optional Web Audio / speech synthesis. No network, assets or gameplay timing dependencies. */
(function(root){
 const key='void-runner-audio-v1',defaults={master:.6,effects:.45,voice:.8,voiceEnabled:false,enabled:false};
 const profiles={rook:{pitch:.75,rate:.92,volume:.85,variant:0},mara:{pitch:1.1,rate:1,volume:.85,variant:1},elias:{pitch:.8,rate:.85,volume:.75,variant:2},iona:{pitch:1.02,rate:1.08,volume:.8,variant:3},sol:{pitch:.96,rate:.95,volume:.8,variant:4},nyx:{pitch:.9,rate:1.02,volume:.8,variant:5}};
 function clean(raw){const s={...defaults};for(const k of ['master','effects','voice'])if(Number.isFinite(raw?.[k]))s[k]=Math.max(0,Math.min(1,raw[k]));for(const k of ['enabled','voiceEnabled'])if(typeof raw?.[k]==='boolean')s[k]=raw[k];return s;}
 let settings={...defaults};try{settings=clean(JSON.parse(root.localStorage?.getItem(key)||'null'));}catch{}
 let context,engine,gain,sub,subGain,speaking=false,speechTimer,token=0,activated=false;
 function cancel(){token++;speaking=false;clearTimeout(speechTimer);try{root.speechSynthesis?.cancel();}catch{}}
 function set(values){settings=clean({...settings,...values});try{root.localStorage?.setItem(key,JSON.stringify(settings));}catch{}if(!settings.voiceEnabled||!settings.enabled)cancel();if(gain&&!settings.enabled)gain.gain.setTargetAtTime(0,context.currentTime,.03);return settings;}
 function ensureContext(){if(!settings.enabled||!activated)return;try{const Audio=root.AudioContext||root.webkitAudioContext;if(!Audio)return;context??=new Audio();}catch{}}
 function unlock(){activated=true;ensureContext();try{if(context?.state==='suspended')context.resume()?.catch(()=>{});}catch{}}
 function tone(freq,duration,type='sine',volume=.025){if(!settings.enabled)return;ensureContext();if(!context||context.state!=='running')return;try{const o=context.createOscillator(),g=context.createGain(),now=context.currentTime;o.type=type;o.frequency.setValueAtTime(freq,now);o.frequency.exponentialRampToValueAtTime(Math.max(20,freq*.4),now+duration);g.gain.setValueAtTime(Math.max(.00001,volume*settings.master*settings.effects*(speaking?.35:1)),now);g.gain.exponentialRampToValueAtTime(.00001,now+duration);o.connect(g);g.connect(context.destination);o.onended=()=>{o.disconnect();g.disconnect();};o.start();o.stop(now+duration);}catch{}}
 function event(name,ship){const base=ship?.audio.frequency||42;const events={laser:[base*12,.08,'sawtooth',.035],missile:[base*3,.3,'sawtooth',.04],shield:[260,.15,'triangle',.04],hull:[55,.22,'square',.03],lock:[440,.18,'triangle',.025],warning:[150,.2,'square',.02],charge:[90,.5,'triangle',.03],warp:[base*6,.7,'sawtooth',.035],exit:[base*4,.4,'triangle',.03]};if(events[name])tone(...events[name]);}
 function update(ship,throttle,turn,phase,active){
  if(!settings.enabled||!active){if(gain)gain.gain.setTargetAtTime(0,context.currentTime,.08);if(subGain)subGain.gain.setTargetAtTime(0,context.currentTime,.08);return;}
  ensureContext();if(!context||context.state!=='running')return;
  try{if(!engine){engine=context.createOscillator();sub=context.createOscillator();gain=context.createGain();subGain=context.createGain();gain.gain.value=subGain.gain.value=0;engine.connect(gain);sub.connect(subGain);gain.connect(context.destination);subGain.connect(context.destination);engine.start();sub.start();}
   const p=ship.audio,now=context.currentTime,warp=phase==='warp'?2.2:1;engine.type=p.wave;sub.type='sawtooth';engine.frequency.setTargetAtTime(p.frequency*(1+throttle*.8+turn*.12)*warp,now,.12);sub.frequency.setTargetAtTime(p.frequency*.51,now,.2);
   const v=settings.master*settings.effects*(speaking?.25:1)*(.008+throttle*.012);gain.gain.setTargetAtTime(v,now,.12);subGain.gain.setTargetAtTime(v*p.roughness,now,.12);
  }catch{}
 }
 function speak(id,text){
  cancel();if(!settings.enabled||!settings.voiceEnabled||!root.speechSynthesis||!root.SpeechSynthesisUtterance)return false;
  try{const p=profiles[id]||profiles.rook,u=new root.SpeechSynthesisUtterance(text),voices=root.speechSynthesis.getVoices().filter(v=>/^en(?:-|_)/i.test(v.lang));const local=voices.filter(v=>v.localService),pool=(local.length?local:voices).sort((a,b)=>a.lang.localeCompare(b.lang)||a.name.localeCompare(b.name));u.voice=pool.length?pool[p.variant%pool.length]:null;u.lang=u.voice?.lang||'en-US';u.pitch=p.pitch;u.rate=p.rate;u.volume=settings.master*settings.voice*p.volume;speaking=true;const current=token;const finish=()=>{if(current===token){speaking=false;clearTimeout(speechTimer);}};u.onend=u.onerror=finish;root.speechSynthesis.speak(u);speechTimer=setTimeout(()=>{if(current===token)cancel();},Math.min(45000,5000+text.length*100));return true;}catch{speaking=false;return false;}
 }
 const api={defaults,profiles,clean,get settings(){return settings;},set,unlock,tone,event,update,speak,cancel};if(typeof module!=='undefined')module.exports=api;else root.VoidAudio=api;
})(globalThis);
