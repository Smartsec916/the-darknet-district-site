/* First-person mouse (David's editor brief, part 7 and 8). One owner for pointer lock in the walking modes:
   the click that captures the mouse never fires, Esc (the browser releasing the lock) pauses, closing a
   dialogue or menu takes the mouse back, and the wheel cycles the weapons you own. Flight is untouched. */
(function(){
 const fps=()=>mode==='walking'||mode==='skirmish-fps';
 const mouse=()=>globalThis.VoidControls?.deviceClass!=='touch-first'&&!!canvas.requestPointerLock;
 const locked=()=>document.pointerLockElement===canvas;
 // If the browser refuses pointer lock (embedded frame, policy), clicks behave normally again.
 let unavailable=false,swallowing=false,failures=0;
 function lock(){
  if(!fps()||!mouse()||locked()||unavailable)return;
  try{const r=canvas.requestPointerLock();r?.catch?.(failed);}catch{failed();}
 }
 // Three refusals in a row (not just the browser's short pause after Esc) and the game stops asking.
 function failed(){if(++failures>=3)unavailable=true;}
 document.addEventListener('pointerlockerror',failed);

 // The capturing click: swallowed before the game's own fire handlers see it (capture phase on window).
 for(const type of ['mousedown','mouseup','click'])addEventListener(type,e=>{
  if(e.target!==canvas)return;
  if(type==='mousedown'){
   if(!fps()||!mouse()||locked()||unavailable||e.button!==0){swallowing=false;return;}
   swallowing=true;e.preventDefault();e.stopImmediatePropagation();lock();return;
  }
  if(swallowing){e.stopImmediatePropagation();if(type==='click')swallowing=false;}
 },{capture:true});

 // The lock went away while still in play: the player pressed Esc (or the browser took the mouse). Pause.
 document.addEventListener('pointerlockchange',()=>{
  if(locked()){failures=0;return;}
  if(fps()&&typeof openGameMenu==='function'){walkingKeys?.clear?.();openGameMenu();}
 });

 // Closing a dialogue, menu or panel with a click or key returns to play: take the mouse straight back.
 const reacquire=()=>setTimeout(()=>{if(fps()&&!locked())lock();},0);
 document.addEventListener('click',e=>{if(e.target!==canvas&&e.target.closest?.('button'))reacquire();});
 addEventListener('keyup',e=>{if(['Enter','Space','Escape'].includes(e.code))reacquire();});

 // "Click to control" while the mouse is free in play.
 const hint=document.createElement('div');hint.id='mouse-capture-hint';hint.hidden=true;hint.setAttribute('role','status');
 hint.innerHTML='<b>CLICK TO CONTROL</b><span>Esc releases the mouse</span>';document.body.append(hint);

 // ---- Weapon selection: Unarmed, Ward pistol, Rifle (the rifle slot waits for a rifle to exist and be owned) ----
 const campaign={
  current:()=>groundState.drawn?(state.progression.personal.weapon||'unarmed'):'unarmed',
  owns:id=>id==='unarmed'||state.progression.personal.weapon===id||(state.progression.personal.weapons||[]).includes(id),
  select:id=>{const want=id!=='unarmed';if(want&&state.progression.personal.weapon!==id)return false;if(groundState.drawn!==want)groundAction('draw');return true;}
 };
 const skirmish={
  current:()=>VoidSkirmish.active?.drawn?(VoidSkirmish.active.weapon||'ward-pistol'):'unarmed',
  owns:id=>id==='unarmed'||id===(VoidSkirmish.active?.weapon||'ward-pistol'),
  select:id=>{const s=VoidSkirmish.active;if(!s)return false;const want=id!=='unarmed';if(s.drawn!==want)VoidSkirmish.action('draw',true);return true;}
 };
 const weapons=[{id:'unarmed',name:'UNARMED',key:'KeyH'},{id:'ward-pistol',name:'WARD PISTOL',key:'Digit1'},{id:'rifle',name:'RIFLE',key:'Digit2'}];
 const context=()=>mode==='skirmish-fps'?skirmish:mode==='walking'&&state?.progression?.personal?campaign:null;
 const available=c=>weapons.filter(w=>c.owns(w.id));
 function select(id){const c=context();if(!c||!c.owns(id)||c.current()===id)return false;const ok=c.select(id);if(ok)flash();return ok;}
 function cycle(step){const c=context();if(!c)return;const list=available(c);if(list.length<2)return;const i=Math.max(0,list.findIndex(w=>w.id===c.current()));select(list[(i+step+list.length)%list.length].id);}
 let wheel=0,lastStep=0;
 addEventListener('wheel',e=>{
  if(!fps()||e.target.closest?.('#screen:not(.hidden),#mission-log,.settings-panel,#dev-balance'))return;
  e.preventDefault();wheel+=e.deltaY;const now=performance.now();
  if(Math.abs(wheel)>=40&&now-lastStep>140){cycle(wheel>0?1:-1);wheel=0;lastStep=now;}
 },{passive:false});
 // 2 picks the rifle when there is one. 1 and H keep their existing draw / holster toggle.
 addEventListener('keydown',e=>{if(!fps()||e.repeat||e.code!=='Digit2'||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(select('rifle'))e.preventDefault();});

 const chip=document.createElement('div');chip.id='weapon-select-hud';chip.hidden=true;document.body.append(chip);
 let flashUntil=0;function flash(){flashUntil=performance.now()+1200;}
 let frames=0,lastError=null;
 function frame(){requestAnimationFrame(frame);frames++;try{draw();}catch(e){lastError=e.message;}}
 function draw(){
  const c=context(),play=fps();
  hint.hidden=!(play&&mouse()&&!locked()&&!unavailable);
  // Dialogue, menus and panels always get the cursor back.
  if(locked()&&!play)document.exitPointerLock?.();
  chip.hidden=!(play&&c);
  if(c){const cur=c.current(),list=available(c);chip.classList.toggle('fresh',performance.now()<flashUntil);
   chip.innerHTML=list.map(w=>'<span class="'+(w.id===cur?'on':'')+'">'+w.name+'</span>').join('')+(list.length>1?'<i>WHEEL</i>':'');}
  // Stations and planets show the same first-person pistol as Vesper (which draws its own).
  if(mode==='walking'&&walkingLocation&&walkingLocation.kind!=='workshop'&&typeof groundState!=='undefined')VoidBabylon.handWeapon?.(groundState.drawn,groundState.aim,!!groundState.reload);
  else if(mode!=='walking')VoidBabylon.handWeapon?.(false);
 }
 requestAnimationFrame(frame);
 globalThis.VoidMouse={get frames(){return frames;},get lastError(){return lastError;},lock,locked,select,cycle,weapons,get unavailable(){return unavailable;},set unavailable(v){unavailable=!!v;}};
})();
