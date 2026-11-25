/* Passing a checkpoint (docs/development/NEOCHINATOWN_QUARTERS.md, CHECKPOINTS.md). The rules and rectangles are ncz-quarters.js; the buildings and doors are
   ncz-gates.js. This file is what happens when someone stands in a lane.

   A lane is a room with a door at each end. The exchange of one quarter for the next happens in the MIDDLE of the room and only while every door of the
   quarter's gates is shut:
     IDLE -> ENTRY_DOOR_OPEN (someone is in the lane) -> ENTRY_DOOR_CLOSING (they reached the middle: the doors are told to close) -> SECURED (the door sensors
     report every door shut) -> SCAN (the beams sweep the room, live) -> EXCHANGE (the picture is held while the next quarter replaces this one; the beams keep
     sweeping across it) -> READY -> EXIT_DOOR_OPEN (the beams finish, the far door opens) -> COMPLETE.     Anything that goes wrong ends in RECOVERY: the
     player is put back and the door behind them opens. Nobody is trapped.
   A checkpoint INSIDE a quarter (both ends in the same quarter) runs the same sequence without the exchange.
   The scan is a picture only: nothing is searched, nothing is taken, everyone passes (contraband is not decided).
   Nothing on screen says anything about loading; there is no bar and no text. A screen reader is told "Security scan".
   Cabs use the same exchange through ride(): road-taxi.js drives the cab into a bay and hands over.
   create(deps) has no browser dependencies and is unit-tested with fakes (tests/ncz-gate-transit.test.cjs); the wiring at the bottom connects it to the game. */
(function(root){
 'use strict';
 const STATES=['IDLE','ENTRY_DOOR_OPEN','ENTRY_DOOR_CLOSING','SECURED','SCAN','EXCHANGE','READY','EXIT_DOOR_OPEN','COMPLETE','RECOVERY'],SEAL_MS=9000,SCAN_MS=1500,CLEAR_MS=650;
 function create(d){
  const Q=d.Q;let busy=false,coolUntil=0,phase='IDLE',armed=true,walkingIn=null,lastLane=null,lastSwapMs=null,entered=null;const history=[],deferred=[];
  const sleep=d.sleep||(ms=>new Promise(r=>setTimeout(r,ms))),now=d.now||(()=>Date.now()),speed=()=>d.reducedMotion?.()?0.4:1;
  const set=p=>{if(phase!==p){phase=p;history.push(p);if(history.length>40)history.shift();d.onState?.(p);}};
  // Social arrivals are provisional until the scanner has cleared and the exit door has opened.
  function deferExchange(lane,fn){if(!busy||phase!=='EXCHANGE'||lastLane!==lane||typeof fn!=='function')return false;deferred.push(fn);return true;}
  function complete(){set('COMPLETE');for(const fn of deferred.splice(0)){try{fn();}catch(e){try{d.warn?.(e);}catch{}}}}
  const gates=()=>{try{return d.gates?.()||null;}catch{return null;}};
  const here=()=>{const l=d.location();return l&&l.id==='neochinatown'&&l.area==='street'?(Q.valid(l.quarter)||null):null;};
  // Wait for every door to report shut. `still`: the player (or cab) is still where they must be; if not, the checkpoint is called off.
  async function seal(g,still,name,entryDoor){
   g.doors.secure(true);let until=now()+SEAL_MS,told=false,last=g.doors.openness?.()??null;
   while(!g.doors.closed()){
    if(!still()){g.doors.secure(false);return 'left';}
    const open=g.doors.openness?.()??null;if(open!==null&&last!==null&&open<last-.001){last=open;until=now()+SEAL_MS;}
    if(now()>until){g.doors.secure(false);if(entryDoor)g.doors.release(entryDoor);return 'stuck';}
    if(!told){told=true;d.announce?.(name+': the doors are closing.');}
    await sleep(80);}
   return 'sealed';}
  /* The exchange itself, for a walker or a cab. opts: {lane (key), to:{quarter|scene}, spawn, yaw, exitDoor (id in the new quarter), after(async, once the new
     place stands), hold:true to keep the exit door open (a cab's shutter)}. The caller has already sealed the doors and run the live scan. */
  async function exchange(o){
   const t0=now();d.freeze?.();d.overlay.show();
   const target=o.to.scene?{key:d.sceneKey(o.to.scene),spawn:o.spawn,yaw:o.yaw}:{key:d.streetKey(),spawn:o.spawn,yaw:o.yaw,quarter:o.to.quarter};
   await d.enterWalking(target.key,{silent:true,spawn:target.spawn,yaw:target.yaw,quarter:target.quarter,gateLane:o.lane});
   const l=d.location();
   if(o.to.scene?l?.id!==d.sceneId(o.to.scene):!(l?.id==='neochinatown'&&l.area==='street'&&l.quarter===o.to.quarter))throw new Error('The next area did not load.');
   lastSwapMs=now()-t0;
   // The new quarter's own copy of this gate: its doors start sealed (ncz-gates.js reads `busy`), and its scanner takes over the sweep.
   let ng=null;if(!o.to.scene){ng=gates();for(let i=0;!ng&&i<150;i++){await sleep(80);ng=gates();}ng?.doors.secure(true);ng?.scan(o.lane,true);}
   set('READY');await o.after?.(ng);await d.overlay.hide();
   if(ng){await sleep(CLEAR_MS*speed());ng.scan(o.lane,false);ng.doors.secure(false);if(o.exitDoor){if(o.hold)ng.doors.hold(o.exitDoor,true);else ng.doors.release(o.exitDoor);}}
   set('EXIT_DOOR_OPEN');return ng;}
  // On foot. Resolves true when the player is through (standing in the next quarter or place, or past an inside checkpoint's scan).
  async function go(){
   if(busy||now()<coolUntil||d.graphicsBusy?.()||d.mode()!=='walking')return false;
   const q=here(),w=d.walker();if(!q||!w)return false;const lane=Q.laneAt(w,q);if(!lane||lane.kind!=='foot')return false;
   const g=gates();if(!g)return false;
   if(!Q.atCentre(lane,w)){d.announce?.('Step into the middle of the checkpoint.');return false;}
   const G=Q.gate(lane.gate),inside=Q.internal(G),entry=inside?(entered&&entered.lane===lane.key?entered.end:'lo'):Q.endOf(G,q),exit=Q.other(entry),to=G.ends[exit];
   busy=true;lastLane=lane.key;let from=null,frozen=false,shown=false;
   try{
    set('ENTRY_DOOR_CLOSING');
    const r=await seal(g,()=>d.mode()==='walking'&&!!d.walker()&&Q.laneAt(d.walker(),q)===lane,G.name,lane.doors[entry].id);
    if(r==='left'){set('IDLE');return false;}
    if(r==='stuck'){set('RECOVERY');armed=false;d.announce?.('The doors could not seal. Step out and walk in again.');return false;}
    set('SECURED');
    // The scan: live, in the room, before anything else happens.
    set('SCAN');g.scan(lane.key,true);await sleep(SCAN_MS*speed());
    if(d.mode()!=='walking'||!d.walker()){g.scan(lane.key,false);g.doors.secure(false);set('IDLE');return false;}
    if(inside||!to||(!to.quarter&&!to.scene)){   // a checkpoint inside a quarter: scanned, then the far door opens. Nothing is exchanged.
     await sleep(SCAN_MS*.6*speed());g.scan(lane.key,false);g.doors.secure(false);g.doors.release(lane.doors[exit].id);armed=false;set('EXIT_DOOR_OPEN');set('COMPLETE');return true;}
    const w2=d.walker();from={spawn:[w2.x,1.7,w2.z],yaw:w2.yaw,quarter:q};
    set('EXCHANGE');frozen=true;shown=true;
    const arrive=to.scene?d.sceneArrival(to.scene):{spawn:from.spawn,yaw:from.yaw};
    await exchange({lane:lane.key,to,spawn:arrive.spawn,yaw:arrive.yaw,exitDoor:lane.doors[exit].id});shown=false;
    d.save?.();armed=false;complete();return true;
   }catch(error){
    set('RECOVERY');d.warn?.(error);
    if(from){try{await d.enterWalking(d.streetKey(),{silent:true,spawn:from.spawn,yaw:from.yaw,quarter:from.quarter});}catch(e){d.warn?.(e);}}
    try{let back=gates();for(let i=0;!back&&i<60;i++){await sleep(80);back=gates();}back?.scan(lane.key,false);back?.doors.secure(false);back?.doors.release(lane.doors[entry].id);}catch{}
    if(shown)await d.overlay.hide();armed=false;
    d.announce?.(frozen?'The checkpoint could not let you through. The door behind you is open.':'The checkpoint is not available right now.');return false;
   }finally{deferred.length=0;busy=false;coolUntil=now()+1500;}
  }
  /* A cab standing in a bay with its passenger. o: {lane (key), from (quarter), to {quarter|scene}, spawn, yaw (the rider's seat, or the far place's
     arrival), after(gates) (road-taxi.js puts the cab and the rider back), still()}. Resolves true when the cab is on the other side with its door ahead open. */
  async function ride(o){
   if(busy)return false;const g=gates(),lane=Q.lane(o.lane);if(!g||!lane)return false;const G=Q.gate(lane.gate),entry=Q.endOf(G,o.from),exit=Q.other(entry);
   const rider=d.walker(),origin={quarter:o.from,spawn:[rider.x,1.7,rider.z],yaw:rider.yaw};
   busy=true;lastLane=lane.key;let shown=false;
   try{
    set('ENTRY_DOOR_CLOSING');g.doors.hold(lane.doors[entry].id,false);
    const r=await seal(g,o.still||(()=>true),G.name,null);if(r!=='sealed'){set('RECOVERY');return false;}
    set('SECURED');set('SCAN');g.scan(lane.key,true);await sleep(SCAN_MS*1.2*speed());
    set('EXCHANGE');shown=true;
    await exchange({lane:lane.key,to:o.to,spawn:o.spawn,yaw:o.yaw,exitDoor:o.to.scene?null:lane.doors[exit].id,hold:true,after:o.after});shown=false;
    d.save?.();complete();return true;
   }catch(error){
    set('RECOVERY');d.warn?.(error);
    if(shown){
     try{await d.enterWalking(d.streetKey(),{...origin,silent:true});}catch(e){d.warn?.(e);}
     try{await d.overlay.hide();}catch{}
    }
    const back=gates();back?.scan(lane.key,false);back?.doors.secure(false);back?.doors.release(lane.doors[entry].id);
    return false;
   }
   finally{deferred.length=0;busy=false;coolUntil=now()+1500;}
  }
  /* Coming back from a place beyond a gate (the Corporate District, the Temple). by: 'foot' (the player appears in the gate's foot lane) or 'cab' (in the bay,
     riding; o.after puts the cab there). The city-side door opens when the scan clears. */
  async function arrive(o){
   if(busy)return false;const G=Q.gate(o.gate);if(!G)return false;const q=['lo','hi'].map(e=>G.ends[e]?.quarter).find(Boolean),side=Q.endOf(G,q);
   const lane=Q.lanesOf(G.id).find(l=>l.kind===(o.by==='cab'?'bay':'foot'));if(!lane)return false;
   busy=true;lastLane=lane.key;let shown=false;const back=d.walker()?{spawn:[d.walker().x,1.7,d.walker().z],yaw:d.walker().yaw,key:d.location()?.id}:null;
   try{set('EXCHANGE');shown=true;
    const yaw=Q.yawInto(G.id,q);
    await exchange({lane:lane.key,to:{quarter:q},spawn:o.spawn||[lane.mid[0],1.7,lane.mid[1]],yaw:o.yaw??yaw,exitDoor:lane.doors[side].id,hold:o.by==='cab',after:o.after});shown=false;
    d.save?.();armed=false;complete();return true;
   }catch(error){set('RECOVERY');d.warn?.(error);
    if(back?.key){try{await d.enterWalking(d.sceneKey(back.key),{silent:true,spawn:back.spawn,yaw:back.yaw});}catch(e){d.warn?.(e);}}
    if(shown)try{await d.overlay.hide();}catch{}d.announce?.('The gate is not available right now.');return false;}
   finally{deferred.length=0;busy=false;coolUntil=now()+1500;}
  }
  // Every frame: standing in the middle of a foot lane starts the checkpoint by itself. After a pass (or a failure) the player must leave the lane first.
  function tick(){
   if(busy)return false;if(d.mode()!=='walking'||!d.walker()){walkingIn=null;return false;}const q=here(),w=d.walker();
   if(!q){walkingIn=null;return false;}
   const lane=Q.laneAt(w,q);
   // Someone who APPEARS in a lane (the place has just loaded) has not walked in: wait until they have stepped out once.
   if(walkingIn!==q){walkingIn=q;if(lane)armed=false;}
   if(!lane||lane.kind!=='foot'){armed=true;entered=null;if(phase!=='IDLE')set('IDLE');return false;}
   if(!entered||entered.lane!==lane.key){const dl=Math.hypot(w.x-lane.doors.lo.x,w.z-lane.doors.lo.z),dh=Math.hypot(w.x-lane.doors.hi.x,w.z-lane.doors.hi.z);entered={lane:lane.key,end:dl<=dh?'lo':'hi'};}
   if(phase==='IDLE')set('ENTRY_DOOR_OPEN');
   if(!armed||!Q.atCentre(lane,w))return false;
   return go();
  }
  return {go,ride,arrive,tick,deferExchange,STATES,get busy(){return busy;},get state(){return phase;},get armed(){return armed;},get lane(){return lastLane;},get lastSwapMs(){return lastSwapMs;},get history(){return history.slice();}};
 }
 /* Which quarter an entry to the street lands in: the one asked for, else the one the spawn point stands in, else the one the save remembers (the Port when
    it remembers none: that is where the street has always put a player with no position). */
 function resolve(Q,options,s){const o=options||{};if(Q.valid(o.quarter))return o.quarter;if(o.spawn){const t=Q.settle(o.spawn,Q.resumeQuarter(s));if(t)return t.quarter;}return Q.resumeQuarter(s);}
 const api={create,resolve,STATES,SCAN_MS};
 if(typeof module==='object'&&module.exports){module.exports=api;return;}
 root.VoidGateTransitRules=api;
 if(typeof document==='undefined'||!root.VoidQuarters||!root.VoidNeoChinatown||!root.VoidDistrictArea||typeof enterWalking==='undefined')return;
 const Q=root.VoidQuarters,N=root.VoidNeoChinatown,KEY=root.VoidDistrictArea.KEY.street;

 // ---- Entering the street: one location record, re-laid for the quarter being entered (its gates' walls and doors, its spawn) ----
 function lay(q){const def=VoidExplorationData.locations[KEY];if(!def)return null;const l=N.layout('street',q);Object.assign(def,{quarter:l.quarter,quarterName:l.quarterName,spawn:l.spawn,yaw:l.yaw,solids:l.solids,interactions:l.interactions});return def;}
 const streetEnter=enterWalking;
 enterWalking=async function(id,options){
  if(id===KEY){const q=resolve(Q,options,typeof state!=='undefined'?state:null);lay(q);if(options&&'quarter' in options){options={...options};delete options.quarter;}
   // a position from before Milked moved, or on a street that is gone, is put somewhere safe in that quarter (ncz-quarters.js settle)
   if(options&&options.spawn){const t=Q.settle(options.spawn,q);if(t&&t.moved){options={...options};if(t.quarter===q)options.spawn=t.spawn;else delete options.spawn;}}}
  // Anywhere that is not this city or one of its two far districts (a station, another world, a simulation): the next arrival here is by ship, at the Port.
  else{try{const d=VoidExplorationData.locations[id];if(d&&d.id!=='neochinatown'&&!d.corporate&&!d.temple&&d.kind!=='vr')Q.remember(state,null);}catch{}}
  const r=await streetEnter(id,options);
  try{if(mode==='walking'&&walkingLocation?.id==='neochinatown'&&walkingLocation.area==='street')Q.remember(state,walkingLocation.quarter);}catch{}
  return r;};
 lay(Q.DEFAULT);

 // ---- The picture held during the exchange: the room as it was, with the scanner's beams still crossing it. No words, no bar. ----
 const css=document.createElement('style');css.textContent=`
#gate-transit{position:fixed;inset:0;z-index:60;opacity:0;transition:opacity .28s ease;pointer-events:all;overflow:hidden;background:#04070a}
#gate-transit[hidden]{display:none}#gate-transit.on{opacity:1}
#gate-transit .gt-scene{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
#gate-transit .gt-tint{position:absolute;inset:0;background:radial-gradient(120% 90% at 50% 55%,rgba(40,255,180,.05),rgba(2,8,8,.34));mix-blend-mode:screen}
#gate-transit .gt-sweep{position:absolute;left:0;right:0;height:16vh;top:-16vh;background:linear-gradient(180deg,rgba(70,255,190,0),rgba(70,255,190,.10) 42%,rgba(200,255,236,.85) 50%,rgba(70,255,190,.10) 58%,rgba(70,255,190,0));mix-blend-mode:screen;animation:gt-down 1.9s cubic-bezier(.45,0,.55,1) infinite alternate}
#gate-transit .gt-sweep.b{animation-duration:2.7s;animation-delay:-.9s;opacity:.6}
#gate-transit .gt-pass{position:absolute;top:0;bottom:0;width:12vw;left:-12vw;background:linear-gradient(90deg,rgba(70,255,190,0),rgba(70,255,190,.08) 40%,rgba(200,255,236,.7) 50%,rgba(70,255,190,.08) 60%,rgba(70,255,190,0));mix-blend-mode:screen;animation:gt-across 2.3s cubic-bezier(.45,0,.55,1) infinite alternate}
#gate-transit .gt-grid{position:absolute;inset:0;background:repeating-linear-gradient(90deg,rgba(90,255,200,.05) 0 1px,transparent 1px 34px);mix-blend-mode:screen;animation:gt-flicker 3.1s steps(6) infinite}
#gate-transit .gt-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
@keyframes gt-down{from{top:-16vh}to{top:100vh}}@keyframes gt-across{from{left:-12vw}to{left:100vw}}@keyframes gt-flicker{50%{opacity:.55}}
@media (prefers-reduced-motion:reduce){#gate-transit{transition:none}#gate-transit .gt-sweep,#gate-transit .gt-pass,#gate-transit .gt-grid{animation:none;display:none}}`;
 document.head.append(css);
 const el=document.createElement('div');el.id='gate-transit';el.hidden=true;el.setAttribute('role','status');el.setAttribute('aria-live','polite');document.body.append(el);
 const still=document.createElement('canvas');still.className='gt-scene';still.setAttribute('aria-hidden','true');
 const overlay={
  show(){const source=document.getElementById('space');still.width=source?.width||innerWidth;still.height=source?.height||innerHeight;
   try{root.VoidBabylon?.scene?.render?.();}catch{}   // draw the game's picture in the same task as a render, so the buffer still holds the frame
   try{const g=still.getContext('2d');g.clearRect(0,0,still.width,still.height);if(source)g.drawImage(source,0,0,still.width,still.height);}catch{}
   el.replaceChildren(still);el.insertAdjacentHTML('beforeend','<div class="gt-tint" aria-hidden="true"></div><div class="gt-grid" aria-hidden="true"></div><div class="gt-sweep" aria-hidden="true"></div><div class="gt-sweep b" aria-hidden="true"></div><div class="gt-pass" aria-hidden="true"></div><span class="gt-sr">Security scan</span>');
   el.hidden=false;void el.offsetWidth;el.classList.add('on');},
  hide(){el.classList.remove('on');return new Promise(r=>setTimeout(()=>{el.hidden=true;el.replaceChildren();r();},300));}};
 const sceneOf={corporate:()=>root.VoidCorporate,temple:()=>root.VoidTemple};
 const ctl=create({Q,
  walker:()=>walker,mode:()=>mode,location:()=>walkingLocation,graphicsBusy:()=>VoidGraphics.busy,
  gates:()=>walkingLocation?.id==='neochinatown'&&walkingLocation.area==='street'&&VoidBabylon.district?.quarter===walkingLocation.quarter?VoidBabylon.district.gates:null,
  enterWalking:(key,opts)=>enterWalking(key,opts),streetKey:()=>KEY,sceneKey:s=>s,sceneId:s=>s,
  sceneArrival:s=>{const A=sceneOf[s]?.()?.ARRIVAL;return A?{spawn:A.spawn.slice(),yaw:A.yaw}:{spawn:[0,1.7,0],yaw:0};},
  freeze:()=>{mode='preparing';clearInput();walkingKeys.clear();document.exitPointerLock?.();},
  save:()=>{try{save();}catch{}},announce:m=>announce(m),warn:e=>console.warn('[Checkpoint]',e),
  reducedMotion:()=>root.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  overlay});
 root.VoidGateTransit=ctl;
 (function frame(){try{ctl.tick();}catch(e){console.warn('[Checkpoint]',e);}requestAnimationFrame(frame);})();

 // ---- Old saves: the sky cabs are gone. A fare paid for a flight that never landed comes back once; their records are dropped. ----
 let migrated=null;const upd=update;update=function(dt){upd(dt);
  try{if(typeof state!=='undefined'&&state?.story?.flags&&migrated!==state){migrated=state;const f=state.story.flags;if(f.taxiTrip!==undefined||f.skyCabTrip!==undefined||f.cabReturn!==undefined||typeof f.deviceWaypoint==='string'&&f.deviceWaypoint.startsWith('taxi-')||f[Q.FLAG]!==undefined&&!Q.valid(f[Q.FLAG])){
    const back=Q.migrateSave(state);try{save();hud();}catch{}if(back>0)announce('Sky cabs no longer fly. Your interrupted trip was refunded: '+back+' CR.');}}}catch{}};
})(typeof globalThis!=='undefined'?globalThis:this);
