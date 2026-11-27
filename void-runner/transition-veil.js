/* TRANSITION VEIL: loading screens made as unnoticeable as practical (docs/development/VESPER_ROAD.md phase 6, docs/development/LOADING_TRANSITIONS.md).
   The owner (27 Nov 2026): "Try to do the same thing at all loading screens. Try to hide them so they aren't noticeable by the player."
   When the game goes from a place the player is in (walking, flying, riding a taxi, seated) to loading another (mode 'preparing' or 'preparing-flight'), the
   last picture the player saw stays on screen, unchanged, instead of the "PREPARING ENVIRONMENT" card or a dimmed city; when the new place is ready the old
   picture crossfades into it. A slow load (over GRACE_MS) still shows the card (its status line and CANCEL) over the held picture, dimmed, so nobody is left
   staring at a frozen frame without knowing why. A load that fails ends 'preparing' too, so its error card shows as before.
   - It never covers a transition that already has its own in-world presentation (door views, the tunnels' and modules' door fades, the District, Milked and
     gate walks, the planet landing sequence, the taxi): those elements are listed in OWN and the veil stays out of their way.
   - Presentation only: no mode, input, save or gameplay change. The held picture is a copy of the game's own canvas (#space), refreshed every few frames
     while the player is in a place, so it is the frame from just before the load.
   Pure decision (Node-tested): decide(state, now) -> 'hold' | 'release' | 'reveal-card' | null. */
(function(root){
 'use strict';
 const GRACE_MS=6000,FADE_S=.55,COPY_EVERY=3;
 const PLAYABLE=new Set(['walking','walking-info','play','road-taxi','food-seated','vr-seated']);
 const LOADING=new Set(['preparing','preparing-flight']);
 // transitions that already present themselves (their own veil, door view or sequence): the veil never covers them
 const OWN=['door-veil','mod-veil','under-veil','district-transition','milked-transition','gate-transit','landing-seq','road-taxi-chip'];
 // s: {mode, prev (mode last frame), holding, since (ms), own (a transition of its own is showing), revealed}
 function decide(s,now){
  if(s.holding){if(s.own||!LOADING.has(s.mode))return 'release';if(!s.revealed&&now-s.since>GRACE_MS)return 'reveal-card';return null;}
  if(LOADING.has(s.mode)&&PLAYABLE.has(s.prev)&&!s.own)return 'hold';
  return null;
 }
 const api={GRACE_MS,FADE_S,PLAYABLE,LOADING,OWN,decide};
 if(typeof module!=='undefined'&&module.exports){module.exports=api;return;}
 root.VoidTransitionVeil=api;const log=api.log=[];   // the last decisions (for tests and Dev Tools diagnostics)
 if(typeof document==='undefined')return;
 const veil=document.createElement('canvas');veil.id='transition-veil';veil.setAttribute('aria-hidden','true');
 veil.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:45;opacity:0;visibility:hidden';
 const css=document.createElement('style');css.textContent='body.veil-holding #screen .layout{visibility:hidden}';
 const copy=document.createElement('canvas');
 document.head.append(css);document.body.append(veil);
 const st={mode:'',prev:'',holding:false,since:0,own:false,revealed:false};let frame=0,hasCopy=false;
 // a door fade (always in the page, shown by its opacity) counts once it is fading in; a sequence shown by un-hiding counts from the moment it is un-hidden,
 // even while its own fade-in starts from 0 (so the veil never holds for even one frame over the vestibule, Milked, a gate, a landing or a taxi)
 const FADES=new Set(['door-veil','mod-veil','under-veil']);
 const ownShowing=()=>OWN.some(id=>{const el=document.getElementById(id);if(!el||el.hidden)return false;const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden')return false;return FADES.has(id)?parseFloat(cs.opacity||'1')>.05:true;});
 function snapshot(){const src=document.getElementById('space');if(!src||!src.width||!src.height)return false;if(copy.width!==src.width||copy.height!==src.height){copy.width=src.width;copy.height=src.height;}
  try{copy.getContext('2d').drawImage(src,0,0);hasCopy=true;}catch{hasCopy=false;}return hasCopy;}
 function hold(){if(!hasCopy)return;veil.width=copy.width;veil.height=copy.height;veil.getContext('2d').drawImage(copy,0,0);veil.style.transition='none';veil.style.visibility='visible';veil.style.opacity='1';
  st.holding=true;st.since=performance.now();st.revealed=false;document.body.classList.add('veil-holding');}
 function release(fade=true){st.holding=false;document.body.classList.remove('veil-holding');veil.style.transition=fade?'opacity '+FADE_S+'s ease':'none';veil.style.opacity='0';
  setTimeout(()=>{if(!st.holding)veil.style.visibility='hidden';},fade?FADE_S*1000+50:0);}
 function reveal(){st.revealed=true;document.body.classList.remove('veil-holding');veil.style.transition='opacity .8s ease';veil.style.opacity='.4';}
 function tick(){
  try{st.mode=typeof mode==='string'?mode:'';st.own=ownShowing();
   // keep a copy of the picture while the player is in a place (every few frames: the frame from just before a load)
   if(PLAYABLE.has(st.mode)&&!st.holding&&(++frame%COPY_EVERY===0))snapshot();
   const a=decide(st,performance.now());if(a==='hold')hold();else if(a==='release')release(!st.own);else if(a==='reveal-card')reveal();
   if(a){log.push({t:Math.round(performance.now()),action:a,mode:st.mode,prev:st.prev,own:st.own});if(log.length>40)log.shift();}
   st.prev=st.mode;}catch(e){console.warn('[transition veil]',e);}
  requestAnimationFrame(tick);}
 requestAnimationFrame(tick);
})(globalThis);
