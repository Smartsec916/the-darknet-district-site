/* A primary click on the game view captures the pointer without firing. */
(function(){
 const fps=()=>mode==='walking'||mode==='skirmish-fps';
 const locked=()=>document.pointerLockElement===canvas;
 let unavailable=false,swallowing=false;
 function lock(){
  if(!VoidInputState.current.pointerLock||locked()||unavailable||!canvas.requestPointerLock)return;
  try{VoidInputState.capture(canvas)?.catch?.(error=>{if(error.name==='NotSupportedError')unavailable=true;});}catch{}
 }
 for(const type of ['mousedown','mouseup','click'])addEventListener(type,e=>{
  if(e.target!==canvas)return;
  if(type==='mousedown'){
   swallowing=false;
   if(VoidInputState.current.name==='feed'||!VoidInputState.current.pointerLock||locked()||unavailable||!canvas.requestPointerLock||e.button!==0||e.sourceCapabilities?.firesTouchEvents)return;
   swallowing=true;e.preventDefault();e.stopImmediatePropagation();lock();return;
  }
  if(swallowing){e.stopImmediatePropagation();if(type==='click')swallowing=false;}
 },true);
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
 const weapons=[{id:'unarmed',name:'UNARMED',key:'KeyH'},{id:'ward-pistol',name:'WARD PISTOL',key:'Digit1'},{id:'base-pistol',name:'PISTOL',key:'Digit1'},{id:'rifle',name:'RIFLE',key:'Digit2'}];
 const context=()=>mode==='skirmish-fps'?skirmish:mode==='walking'&&state?.progression?.personal?campaign:null;
 const available=c=>weapons.filter(w=>c.owns(w.id));
 function select(id){const c=context();if(!c||!c.owns(id)||c.current()===id)return false;const ok=c.select(id);if(ok)flash();return ok;}
 function cycle(step){const c=context();if(!c)return;const list=available(c);if(list.length<2)return;const i=Math.max(0,list.findIndex(w=>w.id===c.current()));select(list[(i+step+list.length)%list.length].id);}
 let wheel=0,lastStep=0;
 addEventListener('wheel',e=>{
  if(!fps()||!VoidInputState.current.movement||e.target.closest?.('#screen:not(.hidden),#mission-log,.settings-panel,#dev-balance,#personal-device'))return;
  e.preventDefault();wheel+=e.deltaY;const now=performance.now();
  if(Math.abs(wheel)>=40&&now-lastStep>140){cycle(wheel>0?1:-1);wheel=0;lastStep=now;}
 },{passive:false});
 // 2 picks the rifle when there is one. 1 and H keep their existing draw / holster toggle.
 addEventListener('keydown',e=>{if(!fps()||!VoidInputState.current.movement||e.repeat||e.code!=='Digit2'||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;if(select('rifle'))e.preventDefault();});

 const chip=document.createElement('div');chip.id='weapon-select-hud';chip.hidden=true;document.body.append(chip);
 let flashUntil=0;function flash(){flashUntil=performance.now()+1200;}
 let frames=0,lastError=null;
 function frame(){requestAnimationFrame(frame);frames++;try{draw();}catch(e){lastError=e.message;}}
 function draw(){
  const c=context(),play=fps();
  // Dialogue, menus and panels always get the cursor back.

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
