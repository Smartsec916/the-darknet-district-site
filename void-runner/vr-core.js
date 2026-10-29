/* The Darknet District's VR arcade (David's brief, 2026-10-27): a reusable simulation framework.
   - Experiences register with VoidVR.register({id,title,description,status,station,options,layout(opts),build(ctx)}).
     Each is a walkable location (the game's own first-person controller, collision and E-interactions), built only
     when launched and disposed on exit.
   - Launch: the terminal's opaque menu → the booth's NPC steps aside → you take the station → the world dissolves into
     digital fragments (a screen-space effect that also hides loading) → the simulation assembles around you.
   - Isolation: nothing inside counts. Saving is paused for the session, and ammunition, credits and inventory are put
     back on exit. A reload during VR resumes at the terminal (story.flags.vrReturn).
   - Exit: the EXIT VR chip, Backspace, Esc (VR menu) or the controller's View button. You return to the terminal. */
(function(){
 const registry=new Map(),order=[];
 let lastToggle=0,session=null,busy=false,overlay=null,menu=null,chip=null,pauseMenu=null,saveBlocked=false;
 const esc=s=>escapeText(String(s??''));
 const N=()=>globalThis.VoidNeoChinatown;
 // Terminal and booth positions, in the District's own plan (neochinatown.js turns them into the world).
 const TERMINAL=[-6.2,36],BOOTHS=[{z:32.4,name:'NEON STRIKE'},{z:39.6,name:'SKYLINE SOCIAL'}];
 function register(exp){if(!registry.has(exp.id))order.push(exp.id);registry.set(exp.id,exp);}
 // ---- Isolation: what a session may never change ----
 function snapshot(){return {ground:{...groundState},power:{...weaponBank}};}
 function restore(runtime){state=VoidSimulationEffects.end()||state;Object.assign(groundState,runtime.ground);Object.assign(weaponBank,runtime.power);}
 const baseSave=save;save=function(...a){if(saveBlocked)return false;return baseSave.apply(this,a);};
 // ---- Procedural ambience: wind, water, waves, birds, gulls and soft pads. No audio files. ----
 const audio={ctx:null,master:null,layers:[],timers:new Set(),nodes:new Set(),generation:0};
 function later(fn,ms){const generation=audio.generation,t=setTimeout(()=>{audio.timers.delete(t);if(generation===audio.generation&&audio.master)fn();},ms);audio.timers.add(t);return t;}
 function audioNode(ctx,name){const n=ctx[name]();audio.nodes.add(n);if(name==='createOscillator'||name==='createBufferSource')n.addEventListener('ended',()=>{audio.nodes.delete(n);n.disconnect();},{once:true});return n;}
 function endAudio(source,...nodes){source.addEventListener('ended',()=>{for(const n of nodes){n.disconnect();audio.nodes.delete(n);}},{once:true});}
 function audioStart(spec){audioStop();if(globalThis.VoidAudio?.settings?.enabled===false)return;
  try{const A=globalThis.AudioContext||globalThis.webkitAudioContext;audio.ctx=audio.ctx||new A();const c=audio.ctx;c.resume?.();
   audio.master=audioNode(c,'createGain');audio.master.gain.value=0;audio.master.connect(c.destination);audio.master.gain.linearRampToValueAtTime(.55*(globalThis.VoidAudio?.settings?.volume??1),c.currentTime+2.5);
   const noise=()=>{const b=c.createBuffer(1,c.sampleRate*2,c.sampleRate),d=b.getChannelData(0);let last=0;for(let i=0;i<d.length;i++){const w=Math.random()*2-1;last=(last+.02*w)/1.02;d[i]=w*.5+last*3;}const s=audioNode(c,'createBufferSource');s.buffer=b;s.loop=true;s.start();return s;};
   const filtered=(type,freq,q,gain)=>{const s=noise(),f=audioNode(c,'createBiquadFilter'),g=audioNode(c,'createGain');f.type=type;f.frequency.value=freq;f.Q.value=q;g.gain.value=gain;s.connect(f);f.connect(g);g.connect(audio.master);audio.layers.push({stop:()=>s.stop(),gain:g});return g;};
   const lfo=(param,rate,depth,base)=>{const o=audioNode(c,'createOscillator'),g=audioNode(c,'createGain');o.frequency.value=rate;g.gain.value=depth;o.connect(g);g.connect(param);param.value=base;o.start();audio.layers.push({stop:()=>o.stop()});};
   const named={};
   if(spec.wind){const g=filtered('bandpass',420,.6,spec.wind);lfo(g.gain,.07,spec.wind*.6,spec.wind);named.wind=g;}
   if(spec.leaves){const g=filtered('highpass',3200,.4,spec.leaves);lfo(g.gain,.13,spec.leaves*.8,spec.leaves*.4);named.leaves=g;}
   if(spec.water)named.water=filtered('bandpass',900,.35,0);
   if(spec.waves){const g=filtered('lowpass',520,.3,spec.waves);lfo(g.gain,.11,spec.waves*.85,spec.waves);named.waves=g;}
   if(spec.hum){const o=audioNode(c,'createOscillator'),g=audioNode(c,'createGain');o.type='sawtooth';o.frequency.value=55;const f=audioNode(c,'createBiquadFilter');f.type='lowpass';f.frequency.value=180;g.gain.value=spec.hum;o.connect(f);f.connect(g);g.connect(audio.master);o.start();audio.layers.push({stop:()=>o.stop()});}
   if(spec.pad)named.pad=pad(spec.pad);
   const chirp=(base,len)=>{const o=audioNode(c,'createOscillator'),g=audioNode(c,'createGain'),t=c.currentTime;o.type='sine';o.frequency.setValueAtTime(base,t);o.frequency.exponentialRampToValueAtTime(base*(1.3+Math.random()*.6),t+len*.5);o.frequency.exponentialRampToValueAtTime(base*.9,t+len);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05*(named.birdLevel??1),t+.01);g.gain.exponentialRampToValueAtTime(.0005,t+len);o.connect(g);g.connect(audio.master);o.start(t);o.stop(t+len+.05);endAudio(o,g);};
   const schedule=(fn,min,max)=>{const tick=()=>{fn();later(tick,min+Math.random()*(max-min));};later(tick,min);};
   if(spec.birds)schedule(()=>{const n=2+Math.floor(Math.random()*4),base=2400+Math.random()*2200;for(let i=0;i<n;i++)later(()=>chirp(base*(1+Math.random()*.15),.09+Math.random()*.08),i*120);},1500,5200);
   if(spec.gulls)schedule(()=>{for(let i=0;i<3;i++)later(()=>chirp(1100+Math.random()*300,.35),i*260);},6000,14000);
   audio.named=named;
  }catch(e){console.warn('[VOID VR audio]',e.message);}}
 // A slow chord pad: the suite's music presets.
 const padChords={lounge:[220,277.2,329.6,415.3],velvet:[196,246.9,293.7,369.9],midnight:[174.6,220,261.6,329.6]};
 function pad(preset){const c=audio.ctx,g=audioNode(c,'createGain'),f=audioNode(c,'createBiquadFilter');f.type='lowpass';f.frequency.value=900;g.gain.value=.05;f.connect(g);g.connect(audio.master);const osc=(padChords[preset]||padChords.lounge).flatMap(fr=>[0,4].map(d=>{const o=audioNode(c,'createOscillator');o.type='triangle';o.frequency.value=fr;o.detune.value=d;o.connect(f);o.start();return o;}));audio.layers.push({stop:()=>{osc.forEach(o=>o.stop());for(const n of [g,f]){n.disconnect();audio.nodes.delete(n);}},pad:true});return {gain:g,osc};}
 function setPad(preset){if(!audio.ctx)return;for(const l of audio.layers.filter(l=>l.pad)){l.stop();l.dead=true;}audio.layers=audio.layers.filter(l=>!l.dead);if(preset&&preset!=='off')audio.named.pad=pad(preset);}
 function audioLevel(name,v,ramp=.4){const g=audio.named?.[name],node=g?.gain instanceof AudioParam?g:g?.gain;if(node&&audio.ctx)node.gain.linearRampToValueAtTime(v,audio.ctx.currentTime+ramp);}
 function sfx(freq,len,type='square',vol=.06){if(!audio.ctx||!audio.master)return;const c=audio.ctx,o=audioNode(c,'createOscillator'),g=audioNode(c,'createGain'),t=c.currentTime;o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(40,freq*.4),t+len);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0005,t+len);o.connect(g);g.connect(audio.master);o.start(t);o.stop(t+len+.02);endAudio(o,g);}
 function audioStop(){audio.generation++;for(const t of audio.timers)clearTimeout(t);audio.timers.clear();for(const l of audio.layers)try{l.stop();}catch{}audio.layers=[];try{audio.master?.disconnect();}catch{}audio.master=null;audio.named={};for(const n of audio.nodes)try{n.disconnect();}catch{}audio.nodes.clear();}
 // ---- Digital transition: the frame breaks into glowing cells, a data void, then the new world assembles ----
 function makeOverlay(){overlay=document.createElement('canvas');overlay.id='vr-transition';overlay.width=innerWidth;overlay.height=innerHeight;document.body.append(overlay);return overlay;}
 function transition(dir,title,wait){return new Promise(resolve=>{
  const o=overlay||makeOverlay(),g=o.getContext('2d'),W2=o.width=innerWidth,H2=o.height=innerHeight,cell=Math.max(18,Math.round(W2/56)),cols=Math.ceil(W2/cell),rows=Math.ceil(H2/cell);
  const snap=document.createElement('canvas');snap.width=W2;snap.height=H2;const copy=()=>{try{snap.getContext('2d').drawImage(canvas,0,0,W2,H2);}catch{}};copy();
  const delays=Array.from({length:cols*rows},(_,i)=>{const x=i%cols,y=Math.floor(i/cols),d=Math.hypot(x/cols-.5,y/rows-.5);return d*.9+Math.random()*.35;});
  const streams=Array.from({length:Math.ceil(cols/2)},(_,i)=>({x:i*cell*2+Math.random()*cell,y:Math.random()*H2,v:120+Math.random()*260}));
  let start=performance.now(),waitDone=!wait,minHold=dir==='hold'?600:0;if(wait)Promise.resolve(wait).then(()=>waitDone=true,()=>waitDone=true);
  const reduced=typeof reducedMotion!=='undefined'&&reducedMotion,dur=reduced?.45:1.25;
  function frame(now){const t=(now-start)/1000;g.fillStyle='#02060a';g.fillRect(0,0,W2,H2);
   // The void: a cyan grid, falling data and a scan line.
   g.strokeStyle='rgba(95,242,255,.12)';g.lineWidth=1;for(let x=0;x<W2;x+=cell*2){g.beginPath();g.moveTo(x,0);g.lineTo(x,H2);g.stroke();}for(let y=0;y<H2;y+=cell*2){g.beginPath();g.moveTo(0,y);g.lineTo(W2,y);g.stroke();}
   g.font=Math.round(cell*.62)+'px Consolas,monospace';for(const s of streams){s.y=(s.y+s.v/60)%(H2+60);for(let k=0;k<8;k++){g.fillStyle='rgba(95,242,255,'+(.5-k*.06)+')';g.fillText(Math.random()<.5?'0':'1',s.x,s.y-k*cell*.7);}}
   const scan=(t*.8%1)*H2;g.fillStyle='rgba(95,242,255,.25)';g.fillRect(0,scan,W2,2);
   if(dir==='in')copy();
   if(dir!=='hold'&&!reduced){for(let i=0;i<delays.length;i++){const x=(i%cols)*cell,y=Math.floor(i/cols)*cell;let k=Math.min(1,Math.max(0,(t-delays[i]*dur*.7)/(dur*.35)));if(dir==='in')k=1-k;
     if(k>=1)continue;const s=1-k,lift=k*cell*1.6;g.globalAlpha=1-k*.85;g.drawImage(snap,x,y,cell,cell,x+cell*(1-s)/2,y+cell*(1-s)/2-lift,cell*s,cell*s);g.globalAlpha=1;if(k>0){g.strokeStyle='rgba(95,242,255,'+(1-k)+')';g.strokeRect(x+cell*(1-s)/2,y+cell*(1-s)/2-lift,cell*s,cell*s);}}}
   else if(dir!=='hold'){const a=dir==='in'?Math.min(1,t/dur):1-Math.min(1,t/dur);g.globalAlpha=a;g.drawImage(snap,0,0);g.globalAlpha=1;}
   g.fillStyle='#5ff2ff';g.font='bold 15px Consolas,monospace';g.textAlign='center';g.fillText(dir==='in'?'SIMULATION ONLINE':dir==='hold'?'INITIALIZING · '+title:'DISCONNECTING · '+title,W2/2,H2-48);g.textAlign='left';
   const done=dir==='hold'?waitDone&&t*1000>=minHold:t>=dur+(reduced?0:.25);
   if(!done&&t<45)requestAnimationFrame(frame);else{if(dir==='in'){o.remove();overlay=null;}resolve(waitDone);}}
  requestAnimationFrame(frame);});}
 // ---- Terminal menu (opaque) ----
 function openMenu(){if(busy||session||menu)return;mode='vr-menu';clearInput();walkingKeys?.clear?.();document.exitPointerLock?.();
  menu=document.createElement('section');menu.id='vr-menu';menu.setAttribute('role','dialog');menu.setAttribute('aria-label','VR experiences');document.body.append(menu);renderMenu();}
 let menuPage={view:'list'};
 // Experiences marked listed:false (the Combat Simulator, for now) keep their code but are not offered.
 const listed=()=>order.map(id=>registry.get(id)).filter(e=>e.listed!==false);
 function renderMenu(){if(!menu)return;const exps=listed();
  if(menuPage.view==='pick')return renderPicker();
  if(menuPage.view==='list')menu.innerHTML='<div class="vr-head"><b>DARKNET DISTRICT · VR ARCADE</b><span>Choose a simulation. Nothing inside counts out here: no credits, ammunition or injuries carry over.</span><button type="button" data-vr="close">CLOSE · ESC</button></div><div class="vr-grid">'+
   exps.map(e=>'<article class="vr-card'+(e.status!=='ready'?' vr-soon':'')+'">'+(e.preview?'<img alt="" src="'+esc(e.preview)+'">':'<div class="vr-preview" style="background:'+esc(e.tint||'#0b2a31')+'"></div>')+'<h2>'+esc(e.title)+'</h2><p>'+esc(e.description)+'</p>'+
    (e.status==='ready'?'<button type="button" data-vr="pick:'+esc(e.id)+'">'+(e.options||e.picker?'CHOOSE →':'LAUNCH →')+'</button>':'<p class="vr-tag">IN DEVELOPMENT · NOT YET PLAYABLE</p>')+'</article>').join('')+'</div>';
  else{const e=registry.get(menuPage.id),opt=e.options;
   menu.innerHTML='<div class="vr-head"><b>'+esc(e.title.toUpperCase())+'</b><span>'+esc(opt.prompt)+'</span><button type="button" data-vr="back">← BACK</button></div><div class="vr-grid">'+
    opt.choices.map(c=>'<article class="vr-card">'+(c.preview?'<img alt="" src="'+esc(c.preview)+'">':'')+'<h2>'+esc(c.label)+'</h2><p>'+esc(c.description||'')+'</p><button type="button" data-vr="launch:'+esc(e.id)+':'+esc(c.id)+'">LAUNCH →</button></article>').join('')+'</div>';}
  menu.querySelector('button')?.focus();}
 // A step-by-step picker (Play in a Bedroom: sex, then a gallery of companion models). Each step's choices come
 // from the experience; a final step is chosen, then confirmed. Unusable choices show why and can't be picked.
 function renderPicker(){const e=registry.get(menuPage.id),steps=e.picker.steps,i=menuPage.step,step=steps[i],last=i===steps.length-1,choices=step.choices(menuPage.picks);
  const sel=menuPage.selected,card=c=>'<article class="vr-card vr-choice'+(c.usable===false?' vr-soon':'')+(last&&sel===c.id?' vr-selected':'')+'" data-choice="'+esc(c.id)+'">'+
   (c.preview?'<img alt="" src="'+esc(c.preview)+'" onerror="this.replaceWith(Object.assign(document.createElement(\'div\'),{className:\'vr-preview\'}))">':'<div class="vr-preview" style="background:'+esc(c.tint||'#0b2a31')+'"></div>')+
   '<h2>'+esc(c.label)+(last&&sel===c.id?' <span class="vr-check">✓ SELECTED</span>':'')+'</h2><p>'+esc(c.description||'')+'</p>'+
   (c.usable===false?'<p class="vr-tag">'+esc(c.reason||'Not available.')+'</p>':'<button type="button" data-vr="choose:'+esc(c.id)+'">'+(last?(sel===c.id?'SELECTED':'SELECT'):'NEXT →')+'</button>')+'</article>';
  menu.innerHTML='<div class="vr-head"><b>'+esc(e.title.toUpperCase())+' · '+esc(step.title||'')+'</b><span>'+esc(step.prompt)+'</span><button type="button" data-vr="back">← BACK</button></div>'+
   (choices.length?'<div class="vr-grid">'+choices.map(card).join('')+'</div>':'<p class="vr-empty">No companions are available in this category yet.</p>')+
   (last?'<div class="vr-confirm"><button type="button" data-vr="confirm"'+(sel?'':' disabled')+'>'+(sel?'ENTER VR WITH '+esc((choices.find(c=>c.id===sel)||{}).label||'').toUpperCase()+' →':'SELECT A COMPANION')+'</button></div>':'');
  (menu.querySelector('[data-vr="confirm"]:not([disabled])')||menu.querySelector('[data-vr^="choose:"]')||menu.querySelector('button'))?.focus();}
 function openPicker(e){menuPage={view:'pick',id:e.id,step:0,picks:[],selected:null};renderMenu();Promise.resolve(e.picker.prepare?.()).then(()=>{if(menu&&menuPage.view==='pick')renderMenu();});}
 function closeMenu(){if(!menu)return;menu.remove();menu=null;menuPage={view:'list'};if(mode==='vr-menu')resumeWalking();}
 document.addEventListener('click',e=>{const b=e.target.closest('[data-vr]');if(!b)return;const a=b.dataset.vr;e.stopPropagation();
  if(a==='close')return closeMenu();
  if(a==='back'){if(menuPage.view==='pick'&&menuPage.step>0){menuPage.step--;menuPage.picks.pop();menuPage.selected=null;}else menuPage={view:'list'};return renderMenu();}
  if(a.startsWith('pick:')){const exp=registry.get(a.slice(5));if(!exp||exp.listed===false)return;if(exp.picker)return openPicker(exp);if(exp.options){menuPage={view:'options',id:exp.id};return renderMenu();}return launch(exp.id,{});}
  if(a.startsWith('choose:')&&menuPage.view==='pick'){const id=a.slice(7),e=registry.get(menuPage.id),step=e.picker.steps[menuPage.step],c=step.choices(menuPage.picks).find(x=>x.id===id);if(!c||c.usable===false)return;
   if(menuPage.step<e.picker.steps.length-1){menuPage.picks.push(id);menuPage.step++;menuPage.selected=null;}else menuPage.selected=id;return renderMenu();}
  if(a==='confirm'&&menuPage.view==='pick'&&menuPage.selected){const e=registry.get(menuPage.id);return launch(e.id,e.picker.options([...menuPage.picks,menuPage.selected]));}
  if(a.startsWith('launch:')){const [,id,choice]=a.split(':');return launch(id,{choice});}
  if(a==='exit')return exit();if(a==='resume')return closePause();
  if(a.startsWith('opt:')){const [,key,val]=a.split(':');session?.world?.setOption?.(key,val);session.settings[key]=val;return renderPause();}},true);
 // ---- Launch ----
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 async function launch(id,opts){
  const exp=registry.get(id);if(!exp||exp.status!=='ready'||busy||session||!walker||walkingLocation?.id!=='neochinatown')return false;if(exp.listed===false&&!opts?.allowHidden)return false;
  // A picked option that can't load (missing or incompatible model) is refused here, before anything changes.
  if(exp.validate&&!exp.validate(opts||{})){announce('That choice is not available right now.');return false;}
  busy=true;menu?.remove();menu=null;menuPage={view:'list'};mode='vr-transition';clearInput();walkingKeys?.clear?.();document.exitPointerLock?.();
  const booth=exp.station??1,b=BOOTHS[booth],n=N();
  // The booth's player steps aside; you take the station and face the rig.
  n?.booths?.stepAside(booth);
  const from={x:walker.x,z:walker.z,yaw:walker.yaw},[bx,bz]=n.toWorld(-12.6,b.z);
  for(let i=0;i<=36;i++){const k=i/36,e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;walker.x=from.x+(bx-from.x)*e;walker.z=from.z+(bz-from.z)*e;walker.yaw=from.yaw+((Math.atan2(bx-from.x,bz-from.z)-from.yaw+Math.PI*3)%(Math.PI*2)-Math.PI)*Math.min(1,e*1.6);await wait(30);}
  const raw=snapshot();state.story.flags.vrReturn=true;baseSave();const simulation=VoidSimulationEffects.begin(state);state=simulation.state;saveBlocked=true;
  session={id,exp,opts,raw,booth,settings:{...(exp.defaults||{})},world:null,ammo:{ammo:12,reserve:999}};
  // A simulation that needs a sidearm lends one (the snapshot puts the real kit back on exit).
  if(exp.weapon&&!state.progression.personal.weapon)state.progression.personal.weapon='ward-pistol';
  try{audioStart({});
  await transition('out',exp.title.toUpperCase());
  const def=exp.layout(opts);def.vr=id;def.kind='vr';
  const loading=VoidBabylon.prepareRoom(def);let ok=true;
  try{await transition('hold',exp.title.toUpperCase(),loading);await loading;}catch(e){ok=false;console.error('[VOID VR load]',e);}
  if(!ok){await recover('That simulation could not load. You are back at the terminal.');return false;}
  walker={x:def.spawn[0],y:def.spawn[1],z:def.spawn[2],yaw:def.yaw||0,pitch:0};walkingLocation=def;resumeWalking();document.body.classList.add('vr-session');
  audioStart(exp.ambience?.(opts)||{});for(const [key,val] of Object.entries(session.settings))session.world?.setOption?.(key,val);session.world?.onEnter?.();showChip();
  await transition('in',exp.title.toUpperCase());busy=false;announce(exp.title+' · Esc for the VR menu · Backspace to exit');return true;
  }catch(error){console.error('[VOID VR session]',error);await recover('That simulation could not load. You are back at the terminal.');return false;}
 }
 // ---- Exit: back to the terminal, everything as it was ----
 async function exit(){
  if(!session||busy)return false;busy=true;closePause(true);hideChip();mode='vr-transition';clearInput();walkingKeys?.clear?.();document.exitPointerLock?.();
  const title=session.exp.title.toUpperCase();try{session.world?.onExit?.();await transition('out',title);}finally{audioStop();try{await back();}finally{busy=false;}}return true;}
 async function back(){document.body.classList.remove('vr-session');const s=session;restore(s.raw);session=null;saveBlocked=false;delete state.story.flags.vrReturn;walkingLocation=walker=null;
  const loading=enterWalking('sacramento');await transition('hold','THE DARKNET DISTRICT',loading);atTerminal();baseSave();await transition('in','THE DARKNET DISTRICT');}
 async function recover(message){document.body.classList.remove('vr-session');audioStop();hideChip();const s=session;if(s){restore(s.raw);session=null;}saveBlocked=false;delete state.story.flags.vrReturn;walkingLocation=walker=null;
  try{await enterWalking('sacramento');atTerminal();baseSave();}catch{}overlay?.remove();overlay=null;busy=false;announce(message);}
 function atTerminal(){const n=N();if(!walker||!n)return;const [x,z]=n.toWorld(TERMINAL[0]+1.2,TERMINAL[1]);walker.x=x;walker.z=z;const [bx,bz]=n.toWorld(-12.6,36);walker.yaw=Math.atan2(bx-x,bz-z);walker.pitch=0;resumeWalking();}
 // A reload during VR: the save is the one from before the session, so put the player back at the terminal.
 const vrEnter=enterWalking;enterWalking=async function(id){const r=await vrEnter(id);if(!session&&!busy&&state?.story?.flags?.vrReturn&&walkingLocation?.id==='neochinatown'){delete state.story.flags.vrReturn;atTerminal();baseSave();announce('You take off the VR headset at the arcade terminal.');}return r;};
 // ---- In-session UI: the EXIT VR chip and the VR menu (Esc) ----
 function showChip(){hideChip();chip=document.createElement('div');chip.id='vr-chip';chip.innerHTML='<span>VR · '+esc(session.exp.title.toUpperCase())+'</span><button type="button" data-vr="exit">EXIT VR · BACKSPACE</button>';document.body.append(chip);}
 function hideChip(){chip?.remove();chip=null;}
 function openPause(){if(!session||busy||pauseMenu)return;session.returnMode=mode;mode='vr-pause';clearInput();walkingKeys?.clear?.();document.exitPointerLock?.();pauseMenu=document.createElement('section');pauseMenu.id='vr-menu';pauseMenu.className='vr-pause';document.body.append(pauseMenu);renderPause();}
 function renderPause(){if(!pauseMenu)return;const opts=session.exp.settings||[];
  pauseMenu.innerHTML='<div class="vr-head"><b>VR · '+esc(session.exp.title.toUpperCase())+'</b><span>Simulation controls. Nothing here affects the real world.</span><button type="button" data-vr="resume">RESUME · ESC</button></div>'+
   opts.map(o=>'<div class="vr-setting"><h2>'+esc(o.label)+'</h2><div>'+o.values.map(([v,l])=>'<button type="button" data-vr="opt:'+esc(o.key)+':'+esc(v)+'"'+(session.settings[o.key]===v?' aria-pressed="true"':'')+'>'+esc(l)+'</button>').join('')+'</div></div>').join('')+
   '<div class="vr-setting"><button type="button" class="vr-exit" data-vr="exit">EXIT VR → BACK TO THE TERMINAL</button></div>';pauseMenu.querySelector('button')?.focus();}
 function closePause(silent){if(!pauseMenu)return;pauseMenu.remove();pauseMenu=null;if(!silent&&session)resumeWalking();}
 // Esc in a simulation releases the mouse; the browser's release opens the VR menu instead of the game menu.
 const vrGameMenu=openGameMenu;openGameMenu=function(...a){if(session&&!busy){if(performance.now()-lastToggle>=150){lastToggle=performance.now();openPause();}return;}return vrGameMenu.apply(this,a);};
 addEventListener('keydown',e=>{if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
  if(menu&&e.code==='Escape'){e.preventDefault();e.stopPropagation();return menuPage.view==='list'?closeMenu():(menuPage={view:'list'},renderMenu());}
  if(!session)return;
  if(e.code==='Backspace'&&!busy){e.preventDefault();e.stopPropagation();return exit();}
  // One press, one toggle (a key press can reach here twice: directly and through the game menu's Esc handling).
  if(e.code==='Escape'){e.preventDefault();e.stopPropagation();if(performance.now()-lastToggle<150)return;lastToggle=performance.now();return pauseMenu?closePause():openPause();}
 },true);
 // A world's own overlay (the range's scoreboard), drawn over the view.
 const vrDraw=draw;draw=function(){vrDraw();if(session&&!busy&&['walking','vr-seated'].includes(mode))try{session.world?.overlay?.(ctx,W,H);}catch{}};
 let prevView=false;
 const vrUpdate=update;update=function(dt){vrUpdate(dt);
  let pad=null;try{pad=[...(navigator.getGamepads?.()||[])].find(p=>p&&p.connected!==false);}catch{}const view=!!pad?.buttons?.[8]?.pressed;if(view&&!prevView&&session&&!busy)exit();prevView=view;
  if(session){trackedWalkWaypoint=null;if(mode==='walking')session.world?.update?.(dt);}};
 // Pistol inside a simulation: simulated ammunition, never the real magazine, and the world decides what was hit.
 const realPistol=pistolAction;pistolAction=function(action){if(!session)return realPistol.apply(this,arguments);
  const before=session.ammo.ammo;realPistol(action,session.ammo,{ammunitionChanged(){},mark(){}});
  if(action==='fire'&&session.ammo.ammo<before){const dir={x:Math.sin(walker.yaw)*Math.cos(walker.pitch),y:-Math.sin(walker.pitch),z:Math.cos(walker.yaw)*Math.cos(walker.pitch)};session.world?.onFire?.({x:walker.x,y:walker.y,z:walker.z},dir);sfx(880,.12,'square',.05);}};
 const realReload=finishPistolReload;finishPistolReload=function(){if(!session)return realReload.apply(this,arguments);return realReload(session.ammo,{ammunitionChanged(){},mark(){}});};
 VoidInteractions.register('district-vr',()=>openMenu());
 VoidInteractions.register('vr-act',({item})=>{session?.world?.interact?.(item);});
 // ---- Seats: sit (lower view, mouse to look), stand with E, Space or any movement key ----
 function sit(seat){if(!session)return;session.seat={...seat,before:{x:walker.x,z:walker.z,y:walker.y}};mode='vr-seated';clearInput();walkingKeys?.clear?.();walker.x=seat.x;walker.z=seat.z;walker.y=seat.eye||1.15;walker.yaw=seat.yaw;walker.pitch=seat.pitch||0;announce((seat.text||'You sit down.')+' E or Space to stand.');}
 function stand(){if(!session?.seat)return;const b=session.seat.before;walker.x=b.x;walker.z=b.z;walker.y=1.7;session.seat=null;session.world?.onStand?.();resumeWalking();}
 addEventListener('mousemove',e=>{if(mode!=='vr-seated')return;walker.yaw+=e.movementX*.003;walker.pitch=Math.max(-1.2,Math.min(1.2,walker.pitch+e.movementY*.003));});
 addEventListener('keydown',e=>{if(mode!=='vr-seated')return;if(['KeyE','Space','KeyW','KeyA','KeyS','KeyD','Enter'].includes(e.code)){e.preventDefault();e.stopPropagation();stand();}},true);
 // ---- Called by the renderer (prepareRoom) to build a world, and each frame through the room's tick ----
 async function buildWorld(def,ctx){const exp=registry.get(def.vr);const world=await exp.build({...ctx,opts:session?.opts||{},settings:session?.settings||{},api});if(session)session.world=world;return world;}
 const audioSet=(key,val)=>{if(audio.named)audio.named[key]=val;};
 const api={register,launch,exit,openMenu,sit,stand,sfx,audioLevel,audioSet,setPad,transition,buildWorld,get active(){return !!session;},get debug(){return {session:!!session,busy,pauseMenu:!!pauseMenu,menu:!!menu,overlay:!!overlay,page:{...menuPage},audio:{nodes:audio.nodes.size,timers:audio.timers.size}};},listed,get busy(){return busy;},get session(){return session;},registry,order};
 globalThis.VoidVR=api;
})();
