/* The two checkpoints between NeoChinatown's street and the inside of Milked (docs/development/MILKED.md): the front security vestibule on the side street and
   the rear lobby on the service alley. They work the way The Darknet District's vestibule does (district-transition.js), with Milked's own look and wording.
   Each of the two rooms is built in both environments (milked-build.js), so the player stands in the same place before and after the exchange.

   The exchange happens in the MIDDLE of the room and only while EVERY door of Milked is shut, in either direction:
     IDLE -> ENTRY_DOOR_OPEN (the player is in the room) -> ENTRY_DOOR_CLOSING (the player reached the middle: the doors are told to close)
     -> SECURED (the door sensors report every door shut) -> CHECK_IN (the loading card covers the view, over a still of the room in the facing direction)
     -> DESTINATION_LOADING (the other environment replaces this one; the loader releases the old one first, so only one is ever loaded) -> DESTINATION_READY
     -> EXIT_DOOR_OPEN (the card clears, then the far door opens) -> COMPLETE.   Anything that goes wrong ends in RECOVERY: the player is put back, the door
     behind them opens, nobody is trapped.
   The doors are never trusted to a timer: the card appears only when the sensors say they are closed. In the street environment the inner doors cannot open at
   all and in the interior the outer doors cannot (VoidMilked.openable), so an outer and an inner door are never open together.
   Nothing is saved: the interior is not a save location. Every login wakes in the player's Sleeping Pod, and anything else that re-enters NeoChinatown uses the
   street, so a game saved inside Milked resumes outside it.
   create(deps) holds the orchestration and has no browser dependencies, so it is unit-tested with fakes (tests/milked-transition.test.cjs); the wiring at the
   bottom connects it to the game. The on-screen wording is provisional. */
(function(root){
 const TEXT={
  front:{in:{kicker:'MILKED · VISITOR CHECK-IN',title:'WELCOME IN',steps:['STREET DOORS SEALED','CHECKING YOU IN','WARMING UP THE STUDIOS','INNER DOORS OPENING'],min:1800},
   out:{kicker:'MILKED · FRONT DOORS',title:'GOOD NIGHT',steps:['INNER DOORS SEALED','SIGNING YOU OUT','THE SIDE STREET','STREET DOORS OPENING'],min:1500}},
  rear:{in:{kicker:'MILKED · STAFF AND DELIVERIES',title:'REAR LOBBY',steps:['ALLEY DOOR SEALED','CHECKING YOU IN','WARMING UP THE STUDIOS','INNER DOORS OPENING'],min:1800},
   out:{kicker:'MILKED · REAR EXIT',title:'GOOD NIGHT',steps:['INNER DOORS SEALED','SIGNING YOU OUT','THE SERVICE ALLEY','ALLEY DOOR OPENING'],min:1500}}};
 const STATES=['IDLE','ENTRY_DOOR_OPEN','ENTRY_DOOR_CLOSING','SECURED','CHECK_IN','DESTINATION_LOADING','DESTINATION_READY','EXIT_DOOR_OPEN','COMPLETE','RECOVERY'],SEAL_MS=9000;
 function create(d){
  const M=d.M;let busy=false,coolUntil=0,phase='IDLE',armed=true,sealed=null,walkingIn=null,lastGate=null;const history=[];
  const wait=d.wait||(ms=>new Promise(r=>setTimeout(r,ms))),sleep=d.sleep||(ms=>new Promise(r=>setTimeout(r,ms))),now=d.now||(()=>Date.now()),speed=()=>d.reducedMotion?.()?0.35:1;
  const set=p=>{if(phase!==p){phase=p;history.push(p);if(history.length>40)history.shift();d.onState?.(p);}};
  const doors=()=>{try{return d.doors?.()||null;}catch{return null;}};
  const areaOf=()=>d.location()?.area===M.AREA?'interior':d.location()?.area==='street'?'street':null;
  // direction: 'in' (street to interior) or 'out'. Resolves true when the player is standing in the other environment.
  async function go(direction){
   if(busy||now()<coolUntil||d.graphicsBusy?.()||d.mode()!=='walking')return false;
   if(areaOf()!==(direction==='in'?'street':'interior'))return false;
   const gate=M.gateAt(d.walker());if(!gate)return false;
   const entryDoor=direction==='in'?gate.outer:gate.inner[0],exitDoors=direction==='in'?gate.inner:[gate.outer];
   // With real doors the checkpoint works only from the middle of the room.
   if(doors()&&!M.atCentre(gate,d.walker())){d.announce?.('Step into the middle of the '+gate.name.toLowerCase()+'.');return false;}
   busy=true;lastGate=gate.id;const text=TEXT[gate.id][direction];let from=null,frozen=false,shown=false;
   try{
    // 1. Seal: every door is told to close; wait for the sensors. The player may still walk; stepping back out of the room calls it off.
    set('ENTRY_DOOR_CLOSING');const dr=doors();
    if(dr){dr.secure(true);let until=now()+SEAL_MS,told=false,last=dr.openness?.()??null;
     while(!dr.closed()){
      if(d.mode()!=='walking'||!d.walker()||M.gateAt(d.walker())!==gate){dr.secure(false);set('IDLE');return false;}
      // The limit is on doors that have STOPPED moving, not on the clock alone: on a slow machine the doors close slowly, and that is not a fault.
      const open=dr.openness?.()??null;if(open!==null&&last!==null&&open<last-.001){last=open;until=now()+SEAL_MS;}
      if(now()>until){dr.release(entryDoor);set('RECOVERY');armed=false;d.announce?.('The doors could not seal. Step out and walk in again.');return false;}
      if(!told){told=true;d.announce?.(gate.name+': the doors are closing.');}
      await sleep(80);}
     if(d.mode()!=='walking'||!d.walker()){dr.secure(false);set('IDLE');return false;}}
    sealed=dr?.state?.()||null;   // what the door sensors said at the moment the room was declared sealed (kept for diagnostics and tests)
    set('SECURED');
    // 2. The card: only now is the view covered. The player keeps their exact place and facing through the exchange.
    const w=d.walker();from={spawn:[w.x,1.7,w.z],yaw:w.yaw};
    d.freeze();frozen=true;set('CHECK_IN');d.overlay.show(direction,text,gate.id);shown=true;d.overlay.step?.(1);
    // 3. Load. The old environment is released and the new one built inside enterWalking; the card never clears before the load does.
    set('DESTINATION_LOADING');d.overlay.step?.(2);
    const key=direction==='in'?M.KEY:d.streetKey();
    await Promise.all([d.enterWalking(key,{silent:true,spawn:from.spawn,yaw:from.yaw}),wait(text.min*speed())]);
    if(d.mode()!=='walking'||areaOf()!==(direction==='in'?'interior':'street'))throw new Error('The next area did not load.');
    // 4. Ready: wait until the new environment's doors exist (on the street the building streams in on the first frames); they start sealed, so nothing
    //    opens while the card clears.
    set('DESTINATION_READY');let nd=doors();for(let i=0;!nd&&i<150;i++){await sleep(80);nd=doors();}
    nd?.secure(true);d.overlay.step?.(3);await d.afterLoad?.(direction);await d.overlay.hide();shown=false;
    // 5. The far doors open; the one behind stays shut (it cannot open in this environment at all).
    set('EXIT_DOOR_OPEN');if(nd){nd.secure(false);for(const id of exitDoors)nd.release(id);}armed=false;set('COMPLETE');
    return true;
   }catch(error){
    set('RECOVERY');d.warn?.(error);
    // Put the player back where they were, in the environment they left, with the door they came through open.
    if(from){try{await d.enterWalking(direction==='in'?d.streetKey():M.KEY,{silent:true,spawn:from.spawn,yaw:from.yaw});}catch(e){d.warn?.(e);}}
    try{let back=doors();for(let i=0;!back&&i<60;i++){await sleep(80);back=doors();}back?.release(entryDoor);}catch{}
    if(shown)await d.overlay.hide();armed=false;
    d.announce?.(frozen?'The doors could not complete the transfer. The door behind you is open.':'The door is not available right now.');return false;
   }finally{busy=false;coolUntil=now()+1500;}
  }
  // Called every frame. Standing in the middle of the vestibule or the lobby starts the checkpoint by itself; after a transfer (or a failure) the player must
  // leave the room before it will start again, so nobody is sent straight back.
  function tick(){
   if(busy)return false;if(d.mode()!=='walking'||!d.walker()){walkingIn=null;return false;}const area=areaOf(),w=d.walker();
   if(!area){walkingIn=null;return false;}
   const gate=M.gateAt(w);
   // A player who APPEARS in the room (a place that has just loaded, a closed menu) has not walked in: the checkpoint waits until they have stepped out once.
   if(walkingIn!==area){walkingIn=area;if(gate)armed=false;}
   if(!gate){armed=true;if(phase!=='IDLE')set('IDLE');return false;}
   if(phase==='IDLE')set('ENTRY_DOOR_OPEN');
   if(!armed||!M.atCentre(gate,w))return false;
   return go(area==='street'?'in':'out');
  }
  return {go,tick,TEXT,STATES,get busy(){return busy;},get state(){return phase;},get armed(){return armed;},get sealed(){return sealed;},get gate(){return lastGate;},get history(){return history.slice();}};
 }
 const api={create,TEXT,STATES};
 if(typeof module==='object'&&module.exports){module.exports=api;return;}
 root.VoidMilkedTransition=api;
 if(typeof document==='undefined'||typeof VoidInteractions==='undefined'||!root.VoidMilked||!root.VoidDistrictArea)return;
 /* ---- The loading card: Milked's own. The room as it was the moment the doors sealed (a still, in the direction the player faces), under the pink logo
    with its white droplets, a slow green line and a short list of what is really happening. No progress bar and no percentage: the lines change when the
    real steps happen. If the still cannot be taken, the painted backdrop underneath shows instead. ---- */
 const css=document.createElement('style');css.textContent=`
#milked-transition{position:fixed;inset:0;z-index:60;display:grid;place-items:center;opacity:0;transition:opacity .4s ease;pointer-events:all;cursor:wait;overflow:hidden;
 background:radial-gradient(60% 50% at 28% 62%,rgba(255,63,180,.22),transparent 70%),radial-gradient(50% 45% at 78% 30%,rgba(57,255,156,.13),transparent 70%),linear-gradient(180deg,#0b0910,#050407);font-family:"Arial Black",Arial,Helvetica,sans-serif;color:#f4f8ff}
#milked-transition[hidden]{display:none}#milked-transition.on{opacity:1}
#milked-transition .mt-scene{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:brightness(.62) saturate(1.1) blur(1.5px)}
#milked-transition .mt-shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,5,12,.72),rgba(8,5,12,.18) 38%,rgba(8,5,12,.2) 60%,rgba(8,5,12,.86))}
#milked-transition .mt-bar{position:absolute;left:0;right:0;height:3px;background:#ff3fb4;box-shadow:0 0 18px 3px rgba(255,63,180,.7)}#milked-transition .mt-bar.t{top:0}#milked-transition .mt-bar.b{bottom:0}
#milked-transition .mt-line{position:absolute;top:0;bottom:0;width:2px;left:-2px;background:#39ff9c;box-shadow:0 0 16px 2px rgba(57,255,156,.65);animation:mt-pass 2.6s ease-in-out infinite alternate}
#milked-transition .mt-logo{position:absolute;top:9vh;left:0;right:0;display:flex;justify-content:center;align-items:center;gap:.5em;font-size:min(9vw,84px);letter-spacing:.06em;color:#ff8ad2;-webkit-text-stroke:2px #ff3fb4;text-shadow:0 0 26px rgba(255,63,180,.85),0 0 60px rgba(255,63,180,.4)}
#milked-transition .mt-drops{position:relative;width:.9em;height:.9em;display:inline-block}
#milked-transition .mt-drops i{position:absolute;background:#fff;border-radius:0 55% 55% 55%;transform:rotate(45deg);box-shadow:0 0 14px rgba(255,255,255,.8);animation:mt-drip 2.2s ease-in-out infinite}
#milked-transition .mt-drops i:nth-child(1){width:.42em;height:.42em;left:.06em;top:.34em}#milked-transition .mt-drops i:nth-child(2){width:.24em;height:.24em;left:.56em;top:.1em;animation-delay:.3s}#milked-transition .mt-drops i:nth-child(3){width:.18em;height:.18em;left:.66em;top:.62em;animation-delay:.6s}
#milked-transition .mt-card{position:absolute;left:50%;bottom:9vh;transform:translateX(-50%);width:min(520px,86vw);padding:18px 24px 16px;border-top:1px solid rgba(255,63,180,.6);border-bottom:1px solid rgba(57,255,156,.45);background:rgba(10,7,14,.7);text-align:left;font-family:ui-monospace,Consolas,monospace}
#milked-transition .mt-kicker{margin:0 0 2px;font-size:11px;letter-spacing:.24em;color:#39ff9c}
#milked-transition h2{margin:0 0 12px;font:900 22px "Arial Black",Arial,sans-serif;letter-spacing:.12em;color:#ffd3ee}
#milked-transition ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr 1fr;gap:4px 18px}
#milked-transition li{font-size:12px;letter-spacing:.1em;padding:3px 0;opacity:.3;transition:opacity .25s}
#milked-transition li.now{opacity:1;color:#fff}#milked-transition li.done{opacity:.7;color:#9af5c8}
#milked-transition li::before{content:"";display:inline-block;width:8px;height:8px;margin-right:10px;border-radius:0 55% 55% 55%;transform:rotate(45deg);background:rgba(255,255,255,.35)}
#milked-transition li.done::before{background:#39ff9c}#milked-transition li.now::before{background:#ff3fb4;box-shadow:0 0 8px #ff3fb4;animation:mt-pulse 1s ease-in-out infinite}
@keyframes mt-pass{from{left:6vw}to{left:94vw}}@keyframes mt-pulse{50%{opacity:.35}}@keyframes mt-drip{50%{transform:rotate(45deg) translate(.035em,.035em)}}
@media (prefers-reduced-motion:reduce){#milked-transition{transition:none}#milked-transition .mt-line{display:none}#milked-transition .mt-drops i,#milked-transition li.now::before{animation:none}}`;
 document.head.append(css);
 const el=document.createElement('div');el.id='milked-transition';el.hidden=true;el.setAttribute('role','status');el.setAttribute('aria-live','polite');document.body.append(el);
 const still=document.createElement('canvas');still.className='mt-scene';still.setAttribute('aria-hidden','true');el.append(still);
 const overlay={
  show(direction,t,gate){el.className='mt-'+direction+' mt-'+gate;
   const source=document.getElementById('space');still.width=source?.width||innerWidth;still.height=source?.height||innerHeight;
   // draw the game's picture in the same task as a render, so the buffer still holds the frame
   try{root.VoidBabylon?.scene?.render?.();}catch{}
   try{const g=still.getContext('2d');g.clearRect(0,0,still.width,still.height);if(source)g.drawImage(source,0,0,still.width,still.height);}catch{}
   el.replaceChildren(still);el.insertAdjacentHTML('beforeend','<div class="mt-shade" aria-hidden="true"></div><div class="mt-line" aria-hidden="true"></div><div class="mt-bar t" aria-hidden="true"></div><div class="mt-bar b" aria-hidden="true"></div><div class="mt-logo" aria-hidden="true">MILKED<span class="mt-drops"><i></i><i></i><i></i></span></div><div class="mt-card"><p class="mt-kicker">'+t.kicker+'</p><h2>'+t.title+'</h2><ul>'+t.steps.map(x=>'<li>'+x+'</li>').join('')+'</ul></div>');
   el.hidden=false;void el.offsetWidth;el.classList.add('on');overlay.step(0);},
  step(i){const lis=[...el.querySelectorAll('li')];lis.forEach((li,k)=>{li.classList.toggle('done',k<i);li.classList.toggle('now',k===i);});if(lis[i])el.setAttribute('aria-label',lis[i].textContent);},
  hide(){el.classList.remove('on');return new Promise(r=>setTimeout(()=>{el.hidden=true;el.replaceChildren(still);r();},450));}};
 const ctl=create({M:root.VoidMilked,
  walker:()=>walker,mode:()=>mode,location:()=>walkingLocation,graphicsBusy:()=>VoidGraphics.busy,streetKey:()=>root.VoidDistrictArea.KEY.street,
  // the doors of whichever build is live: the interior environment's own, or the street's streamed building
  doors:()=>walkingLocation?.area===root.VoidMilked.AREA?(VoidBabylon.zone?.area===root.VoidMilked.AREA?VoidBabylon.zone.doors:null):root.VoidNeoChinatown?.city?.live?.get('milked')?.doors||null,
  enterWalking:(key,opts)=>enterWalking(key,opts),
  freeze:()=>{mode='preparing';clearInput();walkingKeys.clear();document.exitPointerLock?.();},
  announce:m=>announce(m),warn:e=>console.warn('[Milked doors]',e),
  reducedMotion:()=>root.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  overlay});
 root.VoidMilkedGate=ctl;
 (function frame(){try{ctl.tick();}catch(e){console.warn('[Milked doors]',e);}requestAnimationFrame(frame);})();
})(typeof globalThis!=='undefined'?globalThis:this);
