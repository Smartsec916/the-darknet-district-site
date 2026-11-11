/* The security-door transition between NeoChinatown's street and The Darknet District's interior (docs/void-runner/environment-separation.md).
   Standing in the vestibule, the player is scanned (in) or cycled through the airlock (out) while the other environment replaces this one:
   the loader releases everything the old environment held before the new one is built, so only one is ever loaded.
   create(deps) holds the orchestration and has no browser dependencies, so it is unit-tested with fakes; the wiring at the bottom connects it to the game.
   The on-screen wording here is Claude-written and unreviewed (VOID_RUNNER_HANDOFF.md). */
(function(root){
 const TEXT={
  in:{kicker:'THE DARKNET DISTRICT',title:'SECURITY CHECKPOINT',steps:['OUTER DOORS CLOSING…','SECURITY SCAN','INNER DOORS OPENING'],min:2400},
  out:{kicker:'THE DARKNET DISTRICT',title:'SECURITY VESTIBULE',steps:['INNER DOORS CLOSING…','SECURITY SCAN COMPLETE','OUTER DOORS OPENING'],min:2000}};
 function create(d){
  const A=d.A,N=d.N;let busy=false,coolUntil=0;
  const wait=d.wait||(ms=>new Promise(r=>setTimeout(r,ms))),now=d.now||(()=>Date.now()),speed=()=>d.reducedMotion?.()?0.35:1;
  // direction: 'in' (street to interior) or 'out'. Resolves true when the player is standing in the other environment.
  async function go(direction){
   if(busy||now()<coolUntil||d.graphicsBusy?.()||d.mode()!=='walking')return false;
   const here=d.location()?.area;if(here!==(direction==='in'?'street':'interior'))return false;
   busy=true;const s=d.state(),w=d.walker(),from={spawn:[w.x,1.7,w.z],yaw:w.yaw},fromKey=direction==='in'?A.KEY.street:A.KEY.interior;
   const firstBadge=direction==='in'&&s.story.flags.districtBadge!==true,text=TEXT[direction];
   try{
    d.freeze();d.overlay.show(direction,text);
    const to=direction==='in'?{key:A.KEY.interior,spawn:from.spawn,yaw:from.yaw}:{key:A.KEY.street,...A.exitSpawn(N)};
    // The old environment is released and the new one built inside enterWalking; the scan runs at the same time and never ends before the load does.
    await Promise.all([d.enterWalking(to.key,{silent:true,spawn:to.spawn,yaw:to.yaw}),wait(text.min*speed())]);
    if(d.mode()!=='walking'||d.location()?.area!==(direction==='in'?'interior':'street'))throw new Error('The next area did not load.');
    const f=s.story.flags;if(direction==='in'){f.districtDoor=true;f.districtBadge=true;f.area='district';}else delete f.area;
    d.save();await d.afterLoad?.(direction);await d.overlay.hide();if(firstBadge)d.afterBadge?.();
    return true;
   }catch(error){
    d.warn?.(error);
    // Put the player back where they were, in the environment they left.
    try{await d.enterWalking(fromKey,{silent:true,spawn:from.spawn,yaw:from.yaw});}catch(e){d.warn?.(e);}
    await d.overlay.hide();d.announce?.('The door did not cycle. Try again.');return false;
   }finally{busy=false;coolUntil=now()+1500;}
  }
  // Called every frame: the vestibule edges start the transition by themselves.
  function tick(){
   if(busy||d.mode()!=='walking'||!d.walker())return false;const area=d.location()?.area,w=d.walker(),s=d.state();
   if(area==='street'&&A.enterTrigger(N,w,s))return go('in');
   if(area==='interior'&&A.exitTrigger(N,w))return go('out');
   return false;
  }
  return {go,tick,TEXT,get busy(){return busy;}};
 }
 const api={create,TEXT};
 if(typeof module==='object'&&module.exports){module.exports=api;return;}
 root.VoidDistrictTransition=api;
 if(typeof document==='undefined'||typeof VoidInteractions==='undefined'||!root.VoidDistrictArea||!root.VoidNeoChinatown)return;
 // ---- The overlay: a scan line sweeping over a checkpoint panel, or an airlock cycling bar ----
 const el=document.createElement('div');el.id='district-transition';el.hidden=true;el.setAttribute('role','status');el.setAttribute('aria-live','polite');document.body.append(el);
 const still=document.createElement('canvas');still.className='dt-scene';still.setAttribute('aria-hidden','true');el.append(still);
 let timers=[];const clear=()=>{timers.forEach(clearTimeout);timers=[];};
 const overlay={
  show(direction,t){clear();el.className='dt-'+direction;
   const source=document.getElementById('space');still.width=source?.width||innerWidth;still.height=source?.height||innerHeight;
   try{if(source)still.getContext('2d').drawImage(source,0,0,still.width,still.height);}catch{}
   el.replaceChildren(still);el.insertAdjacentHTML('beforeend','<div class="dt-beam" aria-hidden="true"></div><div class="dt-panel"><p class="dt-kicker">'+t.kicker+'</p><h2>'+t.title+'</h2><ul>'+t.steps.map(x=>'<li>'+x+'</li>').join('')+'</ul><div class="dt-bar" aria-hidden="true"><i style="animation-duration:'+t.min+'ms"></i></div></div>');
   el.hidden=false;void el.offsetWidth;el.classList.add('on');
   const lis=[...el.querySelectorAll('li')];lis.forEach((li,i)=>timers.push(setTimeout(()=>{lis.forEach(x=>x.classList.remove('now'));li.classList.add('now');el.setAttribute('aria-label',li.textContent);},i*t.min/lis.length*(root.matchMedia?.('(prefers-reduced-motion: reduce)').matches?0.35:1))));},
  hide(){clear();el.classList.remove('on');return new Promise(r=>setTimeout(()=>{el.hidden=true;el.replaceChildren(still);r();},450));}};
 const ctl=create({A:root.VoidDistrictArea,N:root.VoidNeoChinatown,
  state:()=>state,walker:()=>walker,mode:()=>mode,location:()=>walkingLocation,graphicsBusy:()=>VoidGraphics.busy,
  enterWalking:(key,opts)=>enterWalking(key,opts),
  freeze:()=>{mode='preparing';clearInput();walkingKeys.clear();document.exitPointerLock?.();},
  save:()=>save(),announce:m=>announce(m),warn:e=>console.warn('[District transition]',e),
  reducedMotion:()=>root.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  afterLoad:direction=>{if(direction==='in')return VoidBabylon.district?.doors?.cycleIn?.();},
  afterBadge:()=>{if(typeof districtBadgeIssued==='function')districtBadgeIssued();else resumeWalking();},
  overlay});
 root.VoidDistrict=ctl;
 // The scanner: from the street it starts the checkpoint; anywhere else it keeps its original behaviour.
 const original=VoidInteractions.handlers.get('district-scan');
 VoidInteractions.register('district-scan',(...a)=>{if(walkingLocation?.area==='street'){ctl.go('in');return;}return original?.(...a);});
 (function frame(){try{ctl.tick();}catch(e){console.warn('[District transition]',e);}requestAnimationFrame(frame);})();
})(typeof globalThis!=='undefined'?globalThis:this);
