/* The security checkpoint between NeoChinatown's street and The Darknet District's interior (docs/void-runner/environment-separation.md,
   docs/development/VESTIBULE_CHECKPOINT.md). The vestibule exists in both environments, so the player stands in the same place before and after.

   The exchange happens in the MIDDLE of the vestibule and only while BOTH doors are shut, in either direction:
     IDLE -> ENTRY_DOOR_OPEN (the player is in the vestibule) -> ENTRY_DOOR_CLOSING (the player reached the middle: both doors are told to close)
     -> VESTIBULE_SECURED (the door sensors report both shut) -> SECURITY_SCAN (the scan covers the view) -> DESTINATION_LOADING (the other environment
     replaces this one; the loader releases the old one first, so only one is ever loaded) -> DESTINATION_READY -> EXIT_DOOR_OPEN (the scan clears, then the
     far door opens) -> COMPLETE.   Anything that goes wrong ends in RECOVERY: the player is put back, the door behind them opens, nobody is trapped.
   The doors are never trusted to a timer: the scan starts only when the sensors say both are closed. In each environment the door to the other side cannot be
   opened at all (neochinatown.js), so the two doors are never open together.
   create(deps) holds the orchestration and has no browser dependencies, so it is unit-tested with fakes; the wiring at the bottom connects it to the game.
   The on-screen wording here is Claude-written and unreviewed (VOID_RUNNER_HANDOFF.md). */
(function(root){
 const TEXT={
  in:{kicker:'THE DARKNET DISTRICT · ENTRY CHECKPOINT',title:'SECURITY SCAN',steps:['VESTIBULE SEALED','IDENTITY SCAN','PREPARING THE DISTRICT','CLEARED · INNER DOORS OPENING'],min:2400},
  out:{kicker:'THE DARKNET DISTRICT · EXIT CHECKPOINT',title:'SECURITY SCAN',steps:['VESTIBULE SEALED','EXIT SCAN','PREPARING NEOCHINATOWN','CLEARED · OUTER DOORS OPENING'],min:2000}};
 const STATES=['IDLE','ENTRY_DOOR_OPEN','ENTRY_DOOR_CLOSING','VESTIBULE_SECURED','SECURITY_SCAN','DESTINATION_LOADING','DESTINATION_READY','EXIT_DOOR_OPEN','COMPLETE','RECOVERY'];
 const DOOR={outer:'district-door',inner:'district-inner-door'},SEAL_MS=9000;
 function create(d){
  const A=d.A,N=d.N;let busy=false,coolUntil=0,phase='IDLE',armed=true,sealed=null;const history=[];
  const wait=d.wait||(ms=>new Promise(r=>setTimeout(r,ms))),sleep=d.sleep||(ms=>new Promise(r=>setTimeout(r,ms))),now=d.now||(()=>Date.now()),speed=()=>d.reducedMotion?.()?0.35:1;
  const set=p=>{if(phase!==p){phase=p;history.push(p);if(history.length>40)history.shift();d.onState?.(p);}};
  const doors=()=>{try{return d.doors?.()||null;}catch{return null;}};
  // direction: 'in' (street to interior) or 'out'. Resolves true when the player is standing in the other environment.
  async function go(direction){
   if(busy||now()<coolUntil||d.graphicsBusy?.()||d.mode()!=='walking')return false;
   const here=d.location()?.area;if(here!==(direction==='in'?'street':'interior'))return false;
   const entryDoor=direction==='in'?DOOR.outer:DOOR.inner,exitDoor=direction==='in'?DOOR.inner:DOOR.outer;
   // With real doors the checkpoint works only from the middle of the vestibule.
   if(doors()&&!A.centre(N,d.walker())){d.announce?.('Step into the middle of the security vestibule.');return false;}
   busy=true;const s=d.state(),text=TEXT[direction];let from=null,frozen=false,shown=false;
   const firstBadge=direction==='in'&&s.story.flags.districtBadge!==true;
   try{
    // 1. Seal: both doors are told to close; wait for the sensors. The player may still walk; stepping back out of the vestibule calls it off.
    set('ENTRY_DOOR_CLOSING');const dr=doors();
    if(dr){dr.secure(true);let until=now()+SEAL_MS,told=false,last=dr.openness?.()??null;
     while(!dr.closed()){
      if(d.mode()!=='walking'||!d.walker()||!A.inVestibule(N,d.walker())){dr.secure(false);set('IDLE');return false;}
      // The limit is on doors that have STOPPED moving, not on the clock alone: on a slow machine the doors close slowly, and that is not a fault.
      const open=dr.openness?.()??null;if(open!==null&&last!==null&&open<last-.001){last=open;until=now()+SEAL_MS;}
      if(now()>until){dr.release(entryDoor);set('RECOVERY');armed=false;d.announce?.('The checkpoint could not seal its doors. Step out and walk in again.');return false;}
      if(!told){told=true;d.announce?.('Security checkpoint: the doors are closing.');}
      await sleep(80);}
     if(d.mode()!=='walking'||!d.walker()){dr.secure(false);set('IDLE');return false;}}
    sealed=dr?.state?.()||null;   // what the door sensors said at the moment the vestibule was declared sealed (kept for diagnostics and tests)
    set('VESTIBULE_SECURED');
    // 2. Scan: only now is the view covered. The player keeps their exact place and facing through the exchange.
    const w=d.walker();from={spawn:[w.x,1.7,w.z],yaw:w.yaw};
    d.freeze();frozen=true;set('SECURITY_SCAN');d.overlay.show(direction,text);shown=true;d.overlay.step?.(1);
    // 3. Load. The old environment is released and the new one built inside enterWalking; the scan never ends before the load does.
    set('DESTINATION_LOADING');d.overlay.step?.(2);
    const to={key:direction==='in'?A.KEY.interior:A.KEY.street,spawn:from.spawn,yaw:from.yaw};
    await Promise.all([d.enterWalking(to.key,{silent:true,spawn:to.spawn,yaw:to.yaw}),wait(text.min*speed())]);
    if(d.mode()!=='walking'||d.location()?.area!==(direction==='in'?'interior':'street'))throw new Error('The next area did not load.');
    // 4. Ready: the new environment's doors start sealed, so nothing opens while the scan clears.
    set('DESTINATION_READY');const nd=doors();nd?.secure(true);
    const f=s.story.flags;if(direction==='in'){f.districtDoor=true;f.districtBadge=true;f.area='district';}else delete f.area;
    d.save();d.overlay.step?.(3);await d.afterLoad?.(direction);await d.overlay.hide();shown=false;
    // 5. The far door opens; the one behind stays shut (it cannot open in this environment at all).
    set('EXIT_DOOR_OPEN');nd?.release(exitDoor);armed=false;set('COMPLETE');if(firstBadge)d.afterBadge?.();
    return true;
   }catch(error){
    set('RECOVERY');d.warn?.(error);
    // Put the player back where they were, in the environment they left, with the door they came through open.
    if(from){try{await d.enterWalking(direction==='in'?A.KEY.street:A.KEY.interior,{silent:true,spawn:from.spawn,yaw:from.yaw});}catch(e){d.warn?.(e);}}
    try{doors()?.release(entryDoor);}catch{}
    if(shown)await d.overlay.hide();armed=false;
    d.announce?.(frozen?'The checkpoint could not complete the transfer. The door behind you is open.':'The checkpoint is not available right now.');return false;
   }finally{busy=false;coolUntil=now()+1500;}
  }
  // Called every frame. Standing in the middle of the vestibule starts the checkpoint by itself; after a transfer (or a failure) the player must
  // leave the vestibule before it will start again, so nobody is sent straight back.
  function tick(){
   if(busy||d.mode()!=='walking'||!d.walker())return false;const area=d.location()?.area,w=d.walker();
   if(area!=='street'&&area!=='interior')return false;
   if(!A.inVestibule(N,w)){armed=true;if(phase!=='IDLE')set('IDLE');return false;}
   if(phase==='IDLE')set('ENTRY_DOOR_OPEN');
   if(!armed||!A.centre(N,w))return false;
   return go(area==='street'?'in':'out');
  }
  return {go,tick,TEXT,STATES,get busy(){return busy;},get state(){return phase;},get armed(){return armed;},get sealed(){return sealed;},get history(){return history.slice();}};
 }
 const api={create,TEXT,STATES};
 if(typeof module==='object'&&module.exports){module.exports=api;return;}
 root.VoidDistrictTransition=api;
 if(typeof document==='undefined'||typeof VoidInteractions==='undefined'||!root.VoidDistrictArea||!root.VoidNeoChinatown)return;
 // ---- The scan: the vestibule as it was the moment the doors sealed, dimmed, under sweeping beams and a status column. No progress bar: the lines
 // change when the real steps happen, and the sweep runs for as long as the load takes. ----
 const el=document.createElement('div');el.id='district-transition';el.hidden=true;el.setAttribute('role','status');el.setAttribute('aria-live','polite');document.body.append(el);
 const still=document.createElement('canvas');still.className='dt-scene';still.setAttribute('aria-hidden','true');el.append(still);
 const overlay={
  show(direction,t){el.className='dt-'+direction;
   const source=document.getElementById('space');still.width=source?.width||innerWidth;still.height=source?.height||innerHeight;
   try{if(source)still.getContext('2d').drawImage(source,0,0,still.width,still.height);}catch{}
   el.replaceChildren(still);el.insertAdjacentHTML('beforeend','<div class="dt-beam" aria-hidden="true"></div><div class="dt-beam dt-beam2" aria-hidden="true"></div><div class="dt-frame" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="dt-panel"><p class="dt-kicker">'+t.kicker+'</p><h2>'+t.title+'</h2><ul>'+t.steps.map(x=>'<li>'+x+'</li>').join('')+'</ul><div class="dt-bar" aria-hidden="true"><i></i></div></div>');
   el.hidden=false;void el.offsetWidth;el.classList.add('on');overlay.step(0);},
  step(i){const lis=[...el.querySelectorAll('li')];lis.forEach((li,k)=>{li.classList.toggle('done',k<i);li.classList.toggle('now',k===i);});if(lis[i])el.setAttribute('aria-label',lis[i].textContent);},
  hide(){el.classList.remove('on');return new Promise(r=>setTimeout(()=>{el.hidden=true;el.replaceChildren(still);r();},450));}};
 const ctl=create({A:root.VoidDistrictArea,N:root.VoidNeoChinatown,
  state:()=>state,walker:()=>walker,mode:()=>mode,location:()=>walkingLocation,graphicsBusy:()=>VoidGraphics.busy,
  doors:()=>VoidBabylon.district?.doors,
  enterWalking:(key,opts)=>enterWalking(key,opts),
  freeze:()=>{mode='preparing';clearInput();walkingKeys.clear();document.exitPointerLock?.();},
  save:()=>save(),announce:m=>announce(m),warn:e=>console.warn('[District checkpoint]',e),
  reducedMotion:()=>root.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  afterBadge:()=>{if(typeof districtBadgeIssued==='function')districtBadgeIssued();else resumeWalking();},
  overlay});
 root.VoidDistrict=ctl;
 // The scanner by the door: it starts the checkpoint too (from the middle of the vestibule); anywhere else it keeps its original behaviour.
 const original=VoidInteractions.handlers.get('district-scan');
 VoidInteractions.register('district-scan',(...a)=>{if(walkingLocation?.area==='street'){ctl.go('in');return;}return original?.(...a);});
 (function frame(){try{ctl.tick();}catch(e){console.warn('[District checkpoint]',e);}requestAnimationFrame(frame);})();
})(typeof globalThis!=='undefined'?globalThis:this);
