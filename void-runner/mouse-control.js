/* First-person mouse (the owner's editor brief, part 7 and 8). One owner for pointer lock in the walking modes:
   the click that captures the mouse never fires, Esc (the browser releasing the lock) pauses, closing a
   dialogue or menu takes the mouse back, and the wheel cycles the weapons you own. Flight is untouched. */
(function(){
 const fps=()=>mode==='walking'||mode==='skirmish-fps';
 const mouse=()=>globalThis.VoidControls?.deviceClass!=='touch-first'&&!!canvas.requestPointerLock;
 const locked=()=>document.pointerLockElement===canvas;
 const conversationOpen=()=>!!document.querySelector('#screen.conversation-live,#trade-window,#personal-device.open');   // a conversation or the trade window needs the cursor
 // If the browser refuses pointer lock (embedded frame, policy), clicks behave normally again.
 let unavailable=false,swallowing=false,failures=0;
 function lock(){
  if(!fps()||!mouse()||locked()||unavailable||conversationOpen())return;   // never capture the mouse while a conversation, the trade window, chat or the V1 device needs the cursor
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
 // The game itself releases the mouse too (every E interaction does, and so does leaving the Sleeping Pod, where the mouse is held on the pod's own view rather than the canvas: that used to count as Esc and opened the menu). Only a release the game didn't ask for is Esc.
 let gameReleased=false;const release=document.exitPointerLock?.bind(document);
 if(release)document.exitPointerLock=function(){if(document.pointerLockElement)gameReleased=true;return release();};
 document.addEventListener('pointerlockchange',()=>{
  if(locked()){failures=0;gameReleased=false;return;}
  if(document.pointerLockElement){if(fps())document.exitPointerLock();return;}   // the mouse was taken by some other screen (the Sleeping Pod's view): not an Esc. If the pod has since been left, hand the mouse back to the game.
  if(gameReleased){gameReleased=false;if(!conversationOpen())reacquire();return;} // keep the cursor free over a conversation
  if(!fps()||conversationOpen())return;
  walkingKeys?.clear?.();
  // Clicking out of the browser (another window or app) also releases the mouse. That is not Esc: stay in the game, nothing opens, and a click on the game takes the mouse back (the owner, 17 Nov 2026). Focus is checked a moment later because the browser reports the release and the lost focus in either order.
  const t0=performance.now();setTimeout(()=>{if(locked()||!fps())return;const now=performance.now();if(away||document.hidden||!document.hasFocus()||now-t0>600||now-lastAway<1500){hint(true);return;}if(typeof openGameMenu==='function')openGameMenu();},120);
 });
 let away=false,lastAway=-1e9;
 addEventListener('blur',()=>{away=true;lastAway=performance.now();});addEventListener('focus',()=>{away=false;lastAway=performance.now();});
 // Switching browser tabs is not Esc either (the owner, 18 Nov 2026: only Esc opens the menu). A hidden tab can hold the timer above until the player comes back, when the page looks focused again: so any tab switch or focus change within 1.5 s of the release, or a timer that ran late, counts as leaving, never as Esc.
 document.addEventListener('visibilitychange',()=>{lastAway=performance.now();});
 // A quiet line in the middle of the screen while the game is waiting for a click to take the mouse back.
 let tip=null;
 function hint(on){if(on&&!tip){tip=document.createElement('div');tip.id='resume-hint';tip.textContent='CLICK TO RETURN TO THE GAME';tip.style.cssText='position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);padding:10px 18px;background:rgba(5,10,14,.78);border:1px solid rgba(94,242,214,.55);color:#5ef2d6;font:600 13px/1.2 monospace;letter-spacing:.18em;pointer-events:none;z-index:40';document.body.appendChild(tip);}if(tip)tip.hidden=!on;}
 document.addEventListener('pointerlockchange',()=>{if(locked())hint(false);});
 setInterval(()=>{if(tip&&!tip.hidden&&(!fps()||conversationOpen()))hint(false);},500);

 // Closing a dialogue, menu or panel with a click or key returns to play: take the mouse straight back.
 const reacquire=()=>setTimeout(()=>{if(fps()&&!locked()&&!conversationOpen())lock();},0);
 document.addEventListener('click',e=>{if(e.target!==canvas&&e.target.closest?.('button')&&!conversationOpen())reacquire();});
 addEventListener('keyup',e=>{if(['Enter','Space','Escape'].includes(e.code)&&!conversationOpen())reacquire();});


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
  if(!fps()||e.target.closest?.('#screen:not(.hidden),#mission-log,.settings-panel,#dev-balance,#personal-device'))return;
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
  // Dialogue, menus and panels always get the cursor back.
  if(locked()&&!play)document.exitPointerLock?.();
  chip.hidden=!(play&&c)||!!globalThis.VoidVR?.active;
  if(c){const cur=c.current(),list=available(c);chip.classList.toggle('fresh',performance.now()<flashUntil);
   chip.innerHTML=list.map(w=>'<span class="'+(w.id===cur?'on':'')+'">'+w.name+'</span>').join('')+(list.length>1?'<i>WHEEL</i>':'');}
  // Stations and planets show the same first-person pistol as Vesper (which draws its own).
  if(mode==='walking'&&walkingLocation&&walkingLocation.kind!=='workshop'&&typeof groundState!=='undefined')VoidBabylon.handWeapon?.(groundState.drawn,groundState.aim,!!groundState.reload);
  else if(mode!=='walking')VoidBabylon.handWeapon?.(false);
 }
 requestAnimationFrame(frame);
 globalThis.VoidMouse={get frames(){return frames;},get lastError(){return lastError;},lock,locked,select,cycle,weapons,get unavailable(){return unavailable;},set unavailable(v){unavailable=!!v;}};
})();
