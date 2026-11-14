/* KEYMAP: the in-game keyboard reference. Shows ONLY keys that do something, in their real keyboard positions, for the context the player is in (on foot, or flying).
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
  {codes:['KeyI'],label:'Inventory',src:'prologue-integration.js'},{codes:['Digit1','KeyH'],label:'Draw / holster',src:'prologue-integration.js'}
 ];
 const WALKING_BOUND={missionLog:'V1 device',personalHud:'Terminal',pause:'Pause',keymap:'KeyMap'};   // actions the player can rebind (input.js)
 const FLIGHT_LABEL={pitchUp:'Pitch up',pitchDown:'Pitch down',yawLeft:'Yaw left',yawRight:'Yaw right',rollLeft:'Roll left',rollRight:'Roll right',throttleUp:'Thrust +',throttleDown:'Brake',boost:'Drive',fire:'Fire',missile:'Missile',nearest:'Target',next:'Next',previous:'Previous',clear:'Clear',lock:'Lock',missionLog:'Mission log',personalHud:'Terminal',pause:'Pause',keymap:'KeyMap'};
 const ALIASES={pitchUp:['ArrowUp'],pitchDown:['ArrowDown'],yawLeft:['ArrowLeft'],yawRight:['ArrowRight'],throttleUp:['ShiftRight']};   // input.js: arrows and right Shift work while the action is on its default key
 const DEFAULTS={pitchUp:'KeyW',pitchDown:'KeyS',yawLeft:'KeyA',yawRight:'KeyD',rollLeft:'KeyQ',rollRight:'KeyR',throttleUp:'ShiftLeft',throttleDown:'KeyX',boost:'KeyE',fire:'Space',missile:'KeyF',nearest:'KeyT',next:'Tab',previous:'KeyG',clear:'KeyC',lock:'KeyB',missionLog:'KeyL',personalHud:'KeyP',pause:'Escape',keymap:'KeyK'};
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
  for(const f of FIXED_WALKING)for(const code of f.codes)out.push({code,label:f.label,action:f.label,fixed:true});
  for(const [id,label] of Object.entries(WALKING_BOUND))out.push({code:b[id],label,action:id,fixed:false});
  if(opts.chat)out.push({code:'Enter',label:'Messages',action:'messages',fixed:true});
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
 const api={SEEN,FIXED_WALKING,WALKING_BOUND,FLIGHT_LABEL,ALIASES,DEFAULTS,POS,cap,entries,place,toggleHint,shouldAutoShow};
 if(typeof module!=='undefined'&&module.exports){module.exports=api;return;}
 root.VoidKeyMap=api;
 if(typeof document==='undefined')return;

 // ---- Overlay (browser only) ----
 const MODES=new Set(['walking','dock','play']);   // where the key works: on foot, in a station, in flight
 let el=null,open=false,context='walking',prevMode='',manualContext=false;
 const input=()=>root.VoidInput;
 const bindings=()=>input()?.bindings||DEFAULTS;
 const ctxFor=()=>typeof mode!=='undefined'&&mode==='play'?'flight':'walking';
 const typing=t=>/INPUT|TEXTAREA|SELECT/.test(t?.tagName||'')||!!t?.isContentEditable;
 const chatOn=()=>{try{return !!root.VoidRemotePlayers?.connected&&!!root.VoidRemotePlayers.features.chat&&typeof walkingLocation!=='undefined'&&walkingLocation?.id==='neochinatown'&&walkingLocation.area==='interior';}catch{return false;}};
 const mk=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
 function build(){
  el=mk('section','');el.id='keymap';el.setAttribute('role','dialog');el.setAttribute('aria-label','KeyMap');el.hidden=true;
  el.innerHTML='<div class="km-head"><b class="km-title">KEYMAP</b><div class="km-tabs" role="tablist"></div><button type="button" class="km-close" data-km="close" aria-label="Close KeyMap"></button></div><p class="km-hint" role="status"></p><div class="km-stage"></div><div class="km-foot"></div>';
  document.body.appendChild(el);
  el.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.km==='close')show(false);else if(b.dataset.ctx){context=b.dataset.ctx;manualContext=true;render();}});
 }
 function render(){
  if(!el)return;const b=bindings(),list=entries(context,b,{chat:chatOn()}),p=place(list),vw=Math.max(320,innerWidth),u=Math.max(30,Math.min(60,Math.floor((vw*.92-48)/Math.max(p.width,1)))),rowH=Math.round(u*.95);
  el.querySelector('.km-hint').textContent=toggleHint(b);
  el.querySelector('.km-close').textContent='CLOSE · '+cap(b.keymap||'KeyK');
  const tabs=el.querySelector('.km-tabs');tabs.textContent='';
  for(const [id,label] of [['walking','ON FOOT'],['flight','FLIGHT']]){const t=mk('button','',label);t.type='button';t.dataset.ctx=id;t.setAttribute('aria-pressed',String(context===id));t.setAttribute('role','tab');tabs.appendChild(t);}
  const stage=el.querySelector('.km-stage');stage.textContent='';stage.style.width=Math.round(p.width*u)+'px';stage.style.height=Math.round(p.height*rowH)+'px';stage.style.setProperty('--u',u+'px');
  p.keys.forEach((k,i)=>{const d=mk('div','km-key'+(k.conflict?' conflict':''));d.style.cssText='left:'+Math.round(k.x*u)+'px;top:'+Math.round(k.row*rowH)+'px;width:'+Math.round(k.w*u-5)+'px;height:'+(rowH-5)+'px;--i:'+i;
   d.title=k.cap+' — '+k.label;d.append(mk('span','km-cap',k.cap),mk('span','km-act',k.label));stage.appendChild(d);});
  const foot=el.querySelector('.km-foot');foot.textContent='';
  if(context==='walking'){foot.appendChild(mk('div','km-mouse','MOUSE · look around · left click: fire (weapon drawn) · right click: aim'));}
  else foot.appendChild(mk('div','km-mouse','FLIGHT CONTROLS · arrow keys and right Shift also work while the action is on its default key'));
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
