/* KEYMAP: the in-game keyboard and mouse reference. Shows ONLY keys that do something, in their real keyboard positions, for the context the player is in
   (on foot, on foot with the camera raised, flying) and, on its own tab, the keys of the Sleeping Pod. Beside the keys is a drawn mouse with what each part does.
   Pure rules (browser and Node tests) are at the top; the overlay is browser-only at the bottom.
   Nothing is guessed: the customisable actions come from VoidInput.bindings (so a player's own bindings are shown), and the fixed on-foot keys are listed once, here, each with the
   source file that handles it; tests/keymap.test.cjs checks every entry against that source so this list cannot drift away from the code unnoticed.
   The toggle is the "keymap" action in input.js (default K). Seen-once state: story.flags.keymapSeen (a boolean; no new save field type, no backend). */
(function(root){
 'use strict';
 const SEEN='keymapSeen';
 // Fixed on-foot keys (not rebindable today). `src`: the file whose key handling this entry mirrors.
 const FIXED_WALKING=[
  {codes:['KeyW'],label:'Forward',src:'babylon-integration.js'},{codes:['KeyA'],label:'Left',src:'babylon-integration.js'},{codes:['KeyS'],label:'Back',src:'babylon-integration.js'},{codes:['KeyD'],label:'Right',src:'babylon-integration.js'},
  {codes:['ShiftLeft','ShiftRight'],label:'Run',src:'babylon-integration.js'},{codes:['KeyC','ControlLeft','ControlRight'],label:'Crouch',src:'babylon-integration.js'},
  {codes:['KeyE'],label:'Use',src:'babylon-integration.js'},{codes:['Space'],label:'Jump',src:'prologue-integration.js'},{codes:['KeyR'],label:'Reload',src:'prologue-integration.js'},
  {codes:['KeyI'],label:'Inventory',src:'prologue-integration.js'},{codes:['Digit1','KeyH'],label:'Draw / holster',src:'prologue-integration.js'},
  {codes:['KeyB'],label:'Camera',src:'device-camera.js'},{codes:['KeyG'],label:'Taxi',src:'road-taxi.js'},{codes:['Digit2'],label:'Rifle',src:'mouse-control.js'}
 ];
 /* Keys that only do something in a situation. `when` names the option that must be true for the key to be drawn:
    armed (the player owns a weapon), rifle (owns the rifle), chat / trade (connected to other players with that feature), camera (the camera is raised). */
 const WHEN={Reload:'armed','Draw / holster':'armed',Rifle:'rifle'};
 const SITUATIONAL=[
  {codes:['Enter'],label:'Messages',when:'chat',src:'district-chat.js'},
  {codes:['KeyT'],label:'Trade',when:'trade',src:'trade-window.js'},{codes:['KeyY'],label:'Accept trade',when:'trade',src:'trade-window.js'},{codes:['KeyN'],label:'Decline trade',when:'trade',src:'trade-window.js'},
  {codes:['KeyF'],label:'Follow person',when:'camera',src:'device-camera.js'}
 ];
 // The Sleeping Pod (world-integration.js): lying in the pod only these keys do anything.
 const POD=[{codes:['KeyE'],label:'Exit pod',src:'world-integration.js'},{codes:['KeyV'],label:'Vending',src:'world-integration.js'},{codes:['KeyQ'],label:'Look at controls (not needed)',src:'world-integration.js'},
  {codes:['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'],label:'Look',src:'world-integration.js'}];
 const CONTEXTS=[['walking','ON FOOT'],['camera','CAMERA'],['pod','SLEEPING POD'],['flight','FLIGHT']];
 /* The mouse, part by part, in a context. null: that part does nothing there (it is drawn dim, with no label). Sources: mouse-control.js (the first click holds the mouse; the
    wheel changes weapon), prologue-integration.js (left fires, right aims), device-camera.js (left takes a photo, the wheel zooms), world-integration.js (the pod), game.js (flight). */
 function mouse(context,opts={}){
  if(context==='flight')return {move:'Aim',left:'Fire (hold)',right:null,wheel:null};
  if(context==='pod')return {move:'Look around',left:'Use the music player, light panel, vending unit or sign under the pointer. Anywhere else: hold the mouse (Esc frees it)',right:null,wheel:'Scroll the music player\'s song list'};
  if(context==='camera')return {move:'Look around',left:'Take a photo',right:null,wheel:'Zoom in / out'};
  return {move:'Look around',left:opts.armed?'Fire (weapon drawn). First click: hold the mouse':'First click: hold the mouse (Esc frees it)',right:opts.armed?'Aim':null,wheel:opts.armed?'Change weapon':null};
 }
 const WALKING_BOUND={cursor:'Hold for cursor',missionLog:'V1 device',personalHud:'Terminal',pause:'Pause',keymap:'KeyMap'};   // actions the player can rebind (input.js)
 const FLIGHT_LABEL={cursor:'Hold for cursor',pitchUp:'Pitch up',pitchDown:'Pitch down',yawLeft:'Yaw left',yawRight:'Yaw right',rollLeft:'Roll left',rollRight:'Roll right',throttleUp:'Thrust +',throttleDown:'Brake',boost:'Drive',warp:'Hold to spool warp',fire:'Fire',missile:'Missile',missileSwitch:'M1 / M2',nearest:'Target',next:'Next',previous:'Previous',clear:'Clear',lock:'Lock',missionLog:'Mission log',personalHud:'Terminal',pause:'Pause',keymap:'KeyMap'};
 const ALIASES={pitchUp:['ArrowUp'],pitchDown:['ArrowDown'],yawLeft:['ArrowLeft'],yawRight:['ArrowRight'],throttleUp:['ShiftRight']};   // input.js: arrows and right Shift work while the action is on its default key
 const DEFAULTS={cursor:'AltLeft',pitchUp:'KeyW',pitchDown:'KeyS',yawLeft:'KeyA',yawRight:'KeyD',rollLeft:'KeyQ',rollRight:'KeyR',throttleUp:'ShiftLeft',throttleDown:'KeyX',boost:'KeyE',warp:'KeyJ',fire:'Space',missile:'KeyF',missileSwitch:'KeyZ',nearest:'KeyT',next:'Tab',previous:'KeyG',clear:'KeyC',lock:'KeyB',missionLog:'KeyL',personalHud:'KeyP',pause:'Escape',keymap:'KeyK'};
 // Standard (ANSI) keyboard: key -> [x, row, width] in key units. Only keys that have an action are ever drawn; their positions relative to each other are the real ones.
 const POS={Escape:[0,0,1],Backquote:[0,1,1],Digit1:[1,1,1],Digit2:[2,1,1],Digit3:[3,1,1],Digit4:[4,1,1],Digit5:[5,1,1],Digit6:[6,1,1],Digit7:[7,1,1],Digit8:[8,1,1],Digit9:[9,1,1],Digit0:[10,1,1],Minus:[11,1,1],Equal:[12,1,1],Backspace:[13,1,2],
  Tab:[0,2,1.5],KeyQ:[1.5,2,1],KeyW:[2.5,2,1],KeyE:[3.5,2,1],KeyR:[4.5,2,1],KeyT:[5.5,2,1],KeyY:[6.5,2,1],KeyU:[7.5,2,1],KeyI:[8.5,2,1],KeyO:[9.5,2,1],KeyP:[10.5,2,1],BracketLeft:[11.5,2,1],BracketRight:[12.5,2,1],
  KeyA:[1.75,3,1],KeyS:[2.75,3,1],KeyD:[3.75,3,1],KeyF:[4.75,3,1],KeyG:[5.75,3,1],KeyH:[6.75,3,1],KeyJ:[7.75,3,1],KeyK:[8.75,3,1],KeyL:[9.75,3,1],Semicolon:[10.75,3,1],Quote:[11.75,3,1],Enter:[12.75,3,2.25],
  ShiftLeft:[0,4,2.25],KeyZ:[2.25,4,1],KeyX:[3.25,4,1],KeyC:[4.25,4,1],KeyV:[5.25,4,1],KeyB:[6.25,4,1],KeyN:[7.25,4,1],KeyM:[8.25,4,1],Comma:[9.25,4,1],Period:[10.25,4,1],Slash:[11.25,4,1],ShiftRight:[12.25,4,2.75],
  ControlLeft:[0,5,1.25],AltLeft:[2.5,5,1.25],Space:[3.75,5,6.25],AltRight:[10,5,1.25],ControlRight:[12.5,5,1.25],ArrowLeft:[15.25,5,1],ArrowDown:[16.25,5,1],ArrowRight:[17.25,5,1],ArrowUp:[16.25,4,1]};
 const CAP={ShiftLeft:'Shift',ShiftRight:'Shift',ControlLeft:'Ctrl',ControlRight:'Ctrl',AltLeft:'Alt',AltRight:'Alt',Escape:'Esc',Space:'Space',Enter:'Enter',Tab:'Tab',Backspace:'Bksp',ArrowUp:'↑',ArrowDown:'↓',ArrowLeft:'←',ArrowRight:'→',Backquote:'`',Minus:'-',Equal:'=',BracketLeft:'[',BracketRight:']',Semicolon:';',Quote:"'",Comma:',',Period:'.',Slash:'/'};
 const cap=code=>CAP[code]||String(code).replace(/^Key/,'').replace(/^Digit/,'');

 /* What each key does in a context. bindings: VoidInput.bindings (the player's own). opts.chat: the District chat is available (Enter opens Messages there). */
 function entries(context,bindings,opts={}){
  const b={...DEFAULTS,...(bindings||{})},out=[];
  if(context==='flight'){
   for(const id of Object.keys(FLIGHT_LABEL)){out.push({code:b[id],label:FLIGHT_LABEL[id],action:id,fixed:false});
    if(b[id]===DEFAULTS[id])for(const a of ALIASES[id]||[])out.push({code:a,label:FLIGHT_LABEL[id],action:id,fixed:true});}
   return out;
  }
  if(context==='pod'){for(const f of POD)for(const code of f.codes)out.push({code,label:f.label,action:f.label,fixed:true});return out;}
  const camera=context==='camera',o={...opts,camera};
  for(const f of FIXED_WALKING){if(WHEN[f.label]&&!o[WHEN[f.label]])continue;for(const code of f.codes)out.push({code,label:camera&&f.label==='Camera'?'Camera away':f.label,action:f.label,fixed:true});}
  for(const [id,label] of Object.entries(WALKING_BOUND))out.push({code:b[id],label,action:id,fixed:false});
  for(const f of SITUATIONAL)if(o[f.when])for(const code of f.codes)out.push({code,label:f.label,action:f.label==='Messages'?'messages':f.label,fixed:true});
  if(opts.voiceKey)out.push({code:opts.voiceKey,label:'Talk (hold)',action:'voice',fixed:false});   // district-voice.js: push to talk, on the key the player chose in the V1
  return out;
 }
 /* Positions the keys that have an action (cropped to the area they occupy, relative positions kept) and reports any key given two different jobs. */
 function place(list){
  const byCode=new Map();for(const e of list){if(!POS[e.code])continue;const k=byCode.get(e.code)||{code:e.code,labels:[],actions:[]};if(!k.labels.includes(e.label)){k.labels.push(e.label);k.actions.push(e.action);}byCode.set(e.code,k);}
  const keys=[...byCode.values()].map(k=>({code:k.code,cap:cap(k.code),label:k.labels.join(' / '),actions:k.actions,x:POS[k.code][0],row:POS[k.code][1],w:POS[k.code][2],conflict:k.labels.length>1}));
  if(!keys.length)return {keys,width:0,height:0,conflicts:[]};
  const x0=Math.min(...keys.map(k=>k.x)),r0=Math.min(...keys.map(k=>k.row));
  for(const k of keys){k.x-=x0;k.row-=r0;}
  return {keys,width:Math.max(...keys.map(k=>k.x+k.w)),height:Math.max(...keys.map(k=>k.row))+1,conflicts:keys.filter(k=>k.conflict).map(k=>({code:k.code,cap:k.cap,labels:k.label.split(' / ')}))};
 }
 const toggleHint=bindings=>'To hide the KeyMap Press '+cap((bindings&&bindings.keymap)||DEFAULTS.keymap);
 /* First pod exit: the player just got out of the Sleeping Pod (pod-waking -> walking), is not in the character creator, and has never seen the KeyMap. */
 const shouldAutoShow=(flags,prevMode,mode,creatorOpen)=>prevMode==='pod-waking'&&mode==='walking'&&!creatorOpen&&!(flags&&flags[SEEN]===true);
 const api={SEEN,FIXED_WALKING,SITUATIONAL,POD,WHEN,CONTEXTS,WALKING_BOUND,FLIGHT_LABEL,ALIASES,DEFAULTS,POS,cap,entries,place,mouse,toggleHint,shouldAutoShow};
 if(typeof module!=='undefined'&&module.exports){module.exports=api;return;}
 root.VoidKeyMap=api;
 if(typeof document==='undefined')return;

 // ---- Overlay (browser only) ----
 const MODES=new Set(['walking','dock','play']);   // where the key works: on foot, in a station, in flight
 let el=null,open=false,context='walking',prevMode='',manualContext=false;
 const input=()=>root.VoidInput;
 const bindings=()=>input()?.bindings||DEFAULTS;
 const ctxFor=()=>typeof mode!=='undefined'&&mode==='play'?'flight':root.VoidDeviceCamera?.active?'camera':'walking';
 const typing=t=>/INPUT|TEXTAREA|SELECT/.test(t?.tagName||'')||!!t?.isContentEditable;
 const chatOn=()=>{try{return !!root.VoidRemotePlayers?.connected&&!!root.VoidRemotePlayers.features.chat&&typeof walkingLocation!=='undefined'&&walkingLocation?.id==='neochinatown'&&walkingLocation.area==='interior';}catch{return false;}};
 const mk=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
 // What the player has and where they are, for the keys that only work in a situation.
 const situation=()=>{const o={chat:chatOn()};try{const p=typeof state!=='undefined'?state?.progression?.personal:null;o.armed=!!p?.weapon;o.rifle=p?.weapon==='rifle';}catch{}
  try{const rp=root.VoidRemotePlayers;o.trade=!!rp?.connected&&!!rp.features?.trade;}catch{}
  try{const v=root.VoidVoice?.settings;if(v?.enabled&&v.mode==='ptt'&&POS[v.pttKey])o.voiceKey=v.pttKey;}catch{}return o;};
 // The drawn mouse: two buttons, the wheel and the body (movement). A part with no action in this context stays dim and gets no label.
 function mouseMap(m){
  const box=mk('div','km-mouse-map');box.setAttribute('role','group');box.setAttribute('aria-label','Mouse');const on=k=>m[k]?' class="on"':'';
  box.innerHTML='<svg viewBox="0 0 80 130" aria-hidden="true"><path data-part="left"'+on('left')+' d="M39 2H38A36 36 0 0 0 2 38V55H39Z"/><path data-part="right"'+on('right')+' d="M41 2H42A36 36 0 0 1 78 38V55H41Z"/>'
   +'<path data-part="move"'+on('move')+' d="M2 58H78V92A36 36 0 0 1 42 128H38A36 36 0 0 1 2 92Z"/><rect data-part="wheel"'+on('wheel')+' x="34" y="13" width="12" height="27" rx="6"/>'
   +(m.move?'<g class="arrows"><path d="M40 74l6 8h-12z"/><path d="M40 112l6-8h-12z"/><path d="M21 93l8-6v12z"/><path d="M59 93l-8-6v12z"/></g>':'')+'</svg>';
  for(const [part,title] of [['wheel','WHEEL'],['left','LEFT BUTTON'],['right','RIGHT BUTTON'],['move','MOVE']]){if(!m[part])continue;const l=mk('div','km-ml km-ml-'+part);l.dataset.part=part;l.append(mk('b','',title),mk('span','',m[part]));box.appendChild(l);}
  return box;
 }
 function build(){
  el=mk('section','');el.id='keymap';el.setAttribute('role','dialog');el.setAttribute('aria-label','KeyMap');el.hidden=true;
  el.innerHTML='<div class="km-panel"><div class="km-head"><b class="km-title">KEYMAP</b><div class="km-tabs" role="tablist"></div><button type="button" class="km-close" data-km="close" aria-label="Close KeyMap"></button></div><p class="km-hint" role="status"></p><div class="km-body"><div class="km-stage"></div></div><div class="km-foot"></div></div>';
  document.body.appendChild(el);
  el.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.km==='close')show(false);else if(b.dataset.ctx){context=b.dataset.ctx;manualContext=true;render();}});
 }
 function render(){
  if(!el)return;const b=bindings(),sit=situation(),list=entries(context,b,sit),p=place(list),vw=Math.max(320,innerWidth),MOUSE_W=330,
   beside=Math.floor((vw*.96-40-MOUSE_W)/Math.max(p.width,1)),side=beside>=44,   // the mouse stands beside the keys when the window is wide enough for readable keys, and under them otherwise
   u=Math.max(30,Math.min(60,side?beside:Math.floor((vw*.92-48)/Math.max(p.width,1)))),rowH=Math.round(u*.95);
  el.querySelector('.km-hint').textContent=toggleHint(b);
  el.querySelector('.km-close').textContent='CLOSE · '+cap(b.keymap||'KeyK');
  const tabs=el.querySelector('.km-tabs');tabs.textContent='';
  for(const [id,label] of CONTEXTS){const t=mk('button','',label);t.type='button';t.dataset.ctx=id;t.setAttribute('aria-pressed',String(context===id));t.setAttribute('role','tab');tabs.appendChild(t);}
  const stage=el.querySelector('.km-stage');stage.textContent='';stage.style.width=Math.round(p.width*u)+'px';stage.style.height=Math.round(p.height*rowH)+'px';stage.style.setProperty('--u',u+'px');
  p.keys.forEach((k,i)=>{const d=mk('div','km-key'+(k.conflict?' conflict':''));d.style.cssText='left:'+Math.round(k.x*u)+'px;top:'+Math.round(k.row*rowH)+'px;width:'+Math.round(k.w*u-5)+'px;height:'+(rowH-5)+'px;--i:'+i;
   d.title=k.cap+' — '+k.label;d.append(mk('span','km-cap',k.cap),mk('span','km-act',k.label));stage.appendChild(d);});
  const body=el.querySelector('.km-body');body.querySelector('.km-mouse-map')?.remove();body.classList.toggle('stacked',!side);body.appendChild(mouseMap(mouse(context,sit)));
  const foot=el.querySelector('.km-foot');foot.textContent='';
  if(context==='flight')foot.appendChild(mk('div','km-note','FLIGHT CONTROLS · arrow keys and right Shift also work while the action is on its default key'));
  else if(context==='pod')foot.appendChild(mk('div','km-note','SLEEPING POD · these keys work while you are lying in a pod. The KeyMap itself opens once you are out.'));
  else{const more=[];if(!sit.armed)more.push('with a weapon: 1 or H draw / holster, R reload, right button aim, wheel change weapon');
   if(!sit.chat)more.push('with other players in the District: Enter messages');if(!sit.trade)more.push('next to another player: T trade');if(!sit.voiceKey)more.push('with voice switched on in the V1: hold your talk key');
   if(context==='walking')more.unshift('with the camera raised (B): see the CAMERA tab');
   if(more.length)foot.appendChild(mk('div','km-note','NOT SHOWN UNTIL THEY WORK · '+more.join(' · ')));}
  if(p.conflicts.length)foot.appendChild(mk('div','km-warn','Shared keys: '+p.conflicts.map(c=>c.cap+' = '+c.labels.join(' and ')).join('; ')+'. Change one in the main menu, Keybindings.'));
 }
 function show(v,opts={}){
  v=!!v&&MODES.has(typeof mode!=='undefined'?mode:'');if(v===open)return open;
  if(!el&&v)build();if(!el)return false;open=v;
  if(v){if(!manualContext||opts.reset)context=ctxFor();render();el.hidden=false;el.classList.remove('in');void el.offsetWidth;el.classList.add('in');markSeen();}
  else el.hidden=true;
  return open;
 }
 function markSeen(){try{const s=typeof state!=='undefined'?state:null;if(s?.story?.flags&&s.story.flags[SEEN]!==true){s.story.flags[SEEN]=true;if(typeof save==='function')save();}}catch{}}
 addEventListener('keydown',e=>{
  const code=bindings().keymap||'KeyK';
  if(e.code!==code||e.repeat||e.ctrlKey||e.metaKey||e.altKey||typing(e.target))return;
  if(!MODES.has(typeof mode!=='undefined'?mode:'')||root.VoidPersonalDevice?.isOpen||root.VoidCharacterCreator?.isOpen)return;
  e.preventDefault();e.stopImmediatePropagation();show(!open);
 },true);
 // Housekeeping (cheap, 3 times a second): the first-exit trigger, and hiding the overlay when something else takes over the screen.
 setInterval(()=>{
  const m=typeof mode!=='undefined'?mode:'',creator=!!root.VoidCharacterCreator?.isOpen;
  try{if(shouldAutoShow(typeof state!=='undefined'?state?.story?.flags:null,prevMode,m,creator))show(true,{reset:true});}catch{}
  prevMode=m;
  if(open&&(!MODES.has(m)||creator||root.VoidPersonalDevice?.isOpen))show(false);
  else if(open&&!manualContext&&ctxFor()!==context){context=ctxFor();render();}
 },300);
 addEventListener('resize',()=>{if(open)render();});
 root.VoidKeyMapUI={get open(){return open;},show,get context(){return context;}};
})(globalThis);
