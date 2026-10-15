/* Music engine: performs music-score.js live with Web Audio. Notes are scheduled slightly ahead on
   the audio clock, styles crossfade, styles of one family share a transport so changes land on the
   beat, and an in-world speaker style (bar music) is mixed by distance. Output goes to VoidAudio's
   music channel, so the existing music volume, mute and suspend all apply. */
(function(root){
 const S=root.VoidMusicScore,mtof=m=>440*Math.pow(2,(m-69)/12),lookahead=.25,fade=3;
 let ctx=null,out=null,comp=null,noise=null,main=null,speakerInst=null,retiring=[],duck=1;
 // Deterministic variation: the same bar always plays the same way.
 const hash=(a,b)=>{let h=(a*374761393+b*668265263)|0;h=(h^(h>>>13))*1274126177;return ((h^(h>>>16))>>>0)/4294967296;};
 function ensure(){
  const bus=root.VoidAudio?.bus?.('music');if(!bus)return false;
  if(ctx===bus.context&&out)return true;
  // A new audio context starts clean: nothing from the old one may be revived.
  main=speakerInst=null;retiring=[];duck=1;
  ctx=bus.context;comp=ctx.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=4;
  out=ctx.createGain();out.gain.value=.7;out.connect(comp);comp.connect(bus.node);
  const b=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;noise=b;return true;
 }
 // ---- Instruments: each builds short-lived nodes for one note and cleans up when it ends ----
 function env(dest,t,attack,hold,release,peak){const g=ctx.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+attack);g.gain.setValueAtTime(peak,t+attack+hold);g.gain.exponentialRampToValueAtTime(.0001,t+attack+hold+release);g.connect(dest);return g;}
 function osc(type,freq,t,end,dest,detune=0){const o=ctx.createOscillator();o.type=type;o.frequency.setValueAtTime(freq,t);o.detune.value=detune;o.connect(dest);o.start(t);o.stop(end+.05);return o;}
 function lp(dest,f,q=.7){const n=ctx.createBiquadFilter();n.type='lowpass';n.frequency.value=f;n.Q.value=q;n.connect(dest);return n;}
 function noiseHit(dest,t,type,f,q,decay,vel){const s=ctx.createBufferSource();s.buffer=noise;const n=ctx.createBiquadFilter();n.type=type;n.frequency.value=f;n.Q.value=q;const g=env(dest,t,.002,0,decay,vel);s.connect(n);n.connect(g);s.start(t);s.stop(t+decay+.05);}
 const voices={
  pad(dest,t,notes,dur,vel,o){const g=env(dest,t,o.attack||2,Math.max(.1,dur-(o.attack||2)),2.5,vel),f=lp(g,o.cutoff||1000);for(const m of notes)for(const d of [-7,7])osc(o.wave||'sawtooth',mtof(m),t,t+dur+2.5,f,d);},
  strings(dest,t,notes,dur,vel){voices.pad(dest,t,notes,dur,vel,{wave:'sawtooth',cutoff:1400,attack:1.8});},
  choir(dest,t,notes,dur,vel){const g=env(dest,t,2.2,Math.max(.1,dur-2.2),2.5,vel);for(const [f,q,a] of [[700,6,1],[1220,8,.6],[2600,10,.3]]){const b=ctx.createBiquadFilter();b.type='bandpass';b.frequency.value=f;b.Q.value=q;const amp=ctx.createGain();amp.gain.value=a*3;b.connect(amp);amp.connect(g);for(const m of notes)for(const d of [-9,0,9])osc('sawtooth',mtof(m),t,t+dur+2.5,b,d);}},
  keys(dest,t,notes,dur,vel){const g=env(dest,t,.01,dur*.3,dur*.8,vel);for(const m of notes){osc('sine',mtof(m),t,t+dur*1.2,g);const p=env(g,t,.005,0,.4,.25);osc('sine',mtof(m)*4.01,t,t+.5,p);}},
  pluck(dest,t,m,vel,o={}){const g=env(dest,t,.004,0,o.decay||.6,vel),f=lp(g,o.cutoff||1800,2);osc(o.wave||'triangle',mtof(m),t,t+(o.decay||.6),f);},
  bell(dest,t,m,vel){const g=env(dest,t,.003,0,1.6,vel);osc('sine',mtof(m),t,t+1.7,g);const p=env(g,t,.002,0,.5,.35);osc('sine',mtof(m)*2.76,t,t+.6,p);},
  chip(dest,t,m,vel){const g=env(dest,t,.002,.04,.08,vel);osc('square',mtof(m),t,t+.15,lp(g,3200));},
  lead(dest,t,m,vel){const g=env(dest,t,.03,.25,.5,vel);osc('sawtooth',mtof(m),t,t+.8,lp(g,1600,4),5);},
  bass(dest,t,m,dur,vel,o={}){const g=env(dest,t,.005,dur*.5,dur*.6,vel);osc(o.wave||'sine',mtof(m),t,t+dur*1.2,lp(g,o.cutoff||600,1.5));},
  drone(dest,t,m,dur,vel){const g=env(dest,t,2,Math.max(.1,dur-2),3,vel);const f=lp(g,260);osc('sawtooth',mtof(m),t,t+dur+3,f,-4);osc('sine',mtof(m-12),t,t+dur+3,g);},
  kick(dest,t,vel,o={}){const g=env(dest,t,.002,0,.35,vel),k=ctx.createOscillator();k.frequency.setValueAtTime(120*(o.tone||1),t);k.frequency.exponentialRampToValueAtTime(42,t+.12);k.connect(g);k.start(t);k.stop(t+.4);},
  snare(dest,t,vel,o={}){noiseHit(dest,t,'bandpass',1800*(o.tone||1),.9,.16,vel);},
  clap(dest,t,vel){for(const d of [0,.012,.025])noiseHit(dest,t+d,'bandpass',1500,1.2,.09,vel*.6);},
  hat(dest,t,vel){noiseHit(dest,t,'highpass',7500,.7,.04,vel);},
  tom(dest,t,vel){const g=env(dest,t,.003,0,.3,vel),k=ctx.createOscillator();k.frequency.setValueAtTime(160,t);k.frequency.exponentialRampToValueAtTime(70,t+.25);k.connect(g);k.start(t);k.stop(t+.35);noiseHit(dest,t,'lowpass',900,.7,.05,vel*.3);},
  metal(dest,t,vel,seed){noiseHit(dest,t,'bandpass',900+seed*2400,22,.35,vel*4);},
  swell(dest,t,dur,vel){const s=ctx.createBufferSource();s.buffer=noise;s.loop=true;const b=ctx.createBiquadFilter();b.type='bandpass';b.Q.value=4;b.frequency.setValueAtTime(300,t);b.frequency.exponentialRampToValueAtTime(5000,t+dur);const g=env(dest,t,dur*.8,0,dur*.4,vel);s.connect(b);b.connect(g);s.start(t);s.stop(t+dur*1.3);}
 };
 // ---- One running style: its own gain for crossfading, its own place in the bar ----
 function play(style,layer,step,t){
  const inst=this,st=inst.style,sd=60/st.bpm/4,bar=Math.floor(step/16),s16=step%16,barLen=sd*16,deg=S.chord(st,bar),oct=layer.octave||0,dest=inst.bus,vel=layer.vel;
  if(layer.of&&bar%layer.of>=layer.bars)return;
  const chordStart=s16===0&&bar%(st.chordBars||1)===0,chordDur=barLen*(st.chordBars||1);
  const hit=p=>p&&p[s16]==='x'&&(!layer.chance||hash(step,layer.type.length)<layer.chance);
  switch(layer.type){
   case 'pad':if(chordStart)voices.pad(dest,t,S.triad(st,deg,oct),chordDur,vel,layer);break;
   case 'strings':case 'choir':case 'keys':if(chordStart)voices[layer.type](dest,t,S.triad(st,deg,oct),chordDur,vel);break;
   case 'drone':if(s16===0&&bar%4===0)voices.drone(dest,t,S.midi(st,0,-1),barLen*4,vel);break;
   case 'cluster':if(s16===0&&bar%layer.everyBars===0&&hash(bar,7)<(layer.chance||1))voices.pad(dest,t,[st.root-12,st.root-11,st.root-6],barLen*2,vel,{wave:'sawtooth',cutoff:500,attack:3});break;
   case 'bass':if(hit(layer.pattern))voices.bass(dest,t,S.midi(st,deg,oct),sd*1.8,vel,layer);break;
   case 'arp':if(s16%(layer.every||2)===0){const notes=S.triad(st,deg,oct);voices[layer.instrument||'pluck'](dest,t,notes[(step/(layer.every||2))%3|0],vel);}break;
   case 'motif':if(bar%layer.everyBars===0&&s16%(layer.space||4)===0){const i=s16/(layer.space||4);if(i<S.motif.length){const m=S.midi(st,S.motif[i],oct);layer.instrument==='keys'?voices.keys(dest,t,[m],sd*4,vel):voices[layer.instrument](dest,t,m,vel);}}break;
   case 'swell':if(s16===0&&bar%layer.everyBars===0)voices.swell(dest,t,barLen*layer.everyBars,vel);break;
   case 'metal':if(hit(layer.pattern))voices.metal(dest,t,vel,hash(step,3));break;
   default:if(hit(layer.pattern))voices[layer.type]?.(dest,t,vel,layer);
  }
 }
 function start(id,inherit){
  const style=S.styles[id];if(!style)return null;
  const bus=ctx.createGain();bus.gain.value=0;let node=bus;
  if(style.filter){const f=lp(out,style.filter);bus.connect(f);}else bus.connect(out);
  const inst={id,style,bus,gain:0,step:0,next:ctx.currentTime+.05,intensity:0,tension:0,audio:null,play};
  // Same family (e.g. District zones): keep the beat so the change lands musically.
  if(inherit&&inherit.style.family&&inherit.style.family===style.family&&inherit.style.bpm===style.bpm){inst.step=inherit.step;inst.next=inherit.next;}
  const file=S.files[id];
  if(file&&root.VoidAudio?.connectMedia){const a=new Audio(file);a.loop=true;a.preload='auto';const link=root.VoidAudio.connectMedia(a);if(link){link.gain.disconnect();link.gain.connect(bus);inst.audio={a,link};a.play().catch(()=>{});}}
  return inst;
 }
 function run(inst,now){
  if(inst.audio)return;
  const sd=60/inst.style.bpm/4,layers=S.layersFor(inst.style,inst.intensity,inst.tension);
  while(inst.next<now+lookahead){for(const l of layers)try{inst.play(inst.style,l,inst.step,inst.next);}catch{}inst.step++;inst.next+=sd;}
 }
 function level(inst,value,seconds){inst.gain=value;inst.bus.gain.setTargetAtTime(value*inst.style.gain,ctx.currentTime,seconds/3);}
 function dispose(inst){try{inst.bus.disconnect();inst.audio?.a.pause();inst.audio?.link.dispose();}catch{}}
 function retire(inst){if(!inst)return;level(inst,0,fade);inst.until=ctx.currentTime+fade+.5;retiring.push(inst);
  // Never let fading copies pile up if the state flickers: keep the newest few.
  while(retiring.length>4)dispose(retiring.shift());}
 // Coming back to a style that is still fading out brings it back instead of starting a second copy.
 function revive(id){const i=retiring.findIndex(inst=>inst.id===id);return i<0?null:retiring.splice(i,1)[0];}
 // target: {style, intensity, tension, duck, speaker:{style,level}}
 function update(target){
  if(!target||!ensure()||ctx.state!=='running')return;
  const now=ctx.currentTime;
  if(!main||main.id!==target.style){const old=main;main=revive(target.style)||start(target.style,old);retire(old);}
  if(!main)return;
  main.intensity=target.intensity;main.tension=target.tension;
  const sp=target.speaker;
  if(sp&&(!speakerInst||speakerInst.id!==sp.style)){retire(speakerInst);speakerInst=revive(sp.style)||start(sp.style,main);}
  if(!sp&&speakerInst){retire(speakerInst);speakerInst=null;}
  // Near the bar speakers the room score gives way to the speaker music.
  const near=sp?sp.level:0;
  level(main,1-near*.75,fade);
  if(speakerInst)level(speakerInst,near,1.5);
  const d=1-(target.duck||0);if(d!==duck){duck=d;out.gain.setTargetAtTime(.7*d,now,.4);}
  for(const inst of [main,speakerInst,...retiring])if(inst)run(inst,now);
  retiring=retiring.filter(inst=>{if(now<inst.until)return true;dispose(inst);return false;});
 }
 function stop(){for(const inst of [main,speakerInst,...retiring])if(inst)retire(inst);main=speakerInst=null;}
 const api={update,stop,voices,get current(){return main?.id||null;},get speaker(){return speakerInst?.id||null;}};
 root.VoidMusicEngine=api;
})(globalThis);
