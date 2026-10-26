/* On-foot markers and optional Guidance (David's editor brief, parts 4 and 6).
   Markers: the tracked objective (coloured by mission type, with its distance), a "!" over people who have work
   or payment for you, and quiet labels on shops and terminals close by. They show with Guidance on or off.
   Guidance: pick a topic in the menu; a small card shows the next step for where you actually are, and the place
   to go is highlighted. It only shows things: it never grants items, credits or mission progress. */
(function(){
 const typeColor={main:'#f2b33d',cargo:'#38e8ff',side:'#c39bff',tutorial:'#7fb2e5',campaign:'#f2b33d',bounty:'#ff6b5b',station:'#9fe3c9'};
 const services={services:'OUTFITTER',maintenance:'HANGAR',jobs:'JOBS','meridian-pod':'PODS','district-pod':'PODS','district-shop':'SHOP','district-vending':'VENDING',terminal:'TERMINAL','personal-shop':'SHOP'};
 const flags=()=>state?.story?.flags||{};
 const safe=f=>{try{return f();}catch{return false;}};

 // Who has something for you right now (work to offer, a delivery to take, payment to hand over).
 function hasWork(item){
  const C=globalThis.VoidCampaign,f=flags(),id=item.character||item.id;if(!C||!state)return false;
  const D=C.factionDeliveries||{},S=C.supplyDeliveries||{},stage=k=>safe(()=>C.factionStage(state,k)),supply=k=>safe(()=>C.supplyStage(state,k)),origin=k=>safe(()=>C.originState(state,k));
  switch(id){
   // Rook: an opening offer, pay he owes, or a board job that fits the hold (not while carrying other cargo).
   case 'rook':return ['legal-offer','illegal-offer'].includes(state.quest)||!!safe(()=>C.rookOwed(state))||(state.quest==='open'&&!state.contract&&!!safe(()=>C.rookBoard(state).some(j=>j.units<=C.holdFree(state))))||(state.missileUnlocked&&!state.missileOfferSeen)||safe(()=>C.sealedDeliverable(state));
   case 'admin':{const offers=safe(()=>C.factionOffers(state))||[];return (offers.length&&(!f.factionIntro||offers.length===2))||(safe(()=>C.sealedOffered(state))&&!state.contract)||(f.sealedCargo==='delivered'&&f.warflyingIntro!==true);}
   case 'district-iris':return Object.keys(D).some(k=>stage(k)==='delivered')||Object.keys(S).some(k=>supply(k)==='delivered')||(!!f.factionFirst&&(safe(()=>C.factionOffers(state))||[]).length>0)||(safe(()=>C.supplyOffers(state))||[]).length>0;
   case 'elara':case 'marcus':{const k=id==='elara'?'communion':'natural-order';return stage(k)==='accepted'||supply(k)==='accepted'||['offered','accepted'].includes(origin(k));}
   case 'kess':case 'mercer':{const k=id==='kess'?'communion':'natural-order',w=safe(()=>C.workState(state,k));return origin(k)==='loaded'||w==='offered'||(w==='accepted'&&safe(()=>C.workReady(state,k)));}
   case 'sol':return (typeof solHandover!=='undefined'&&!!solHandover)||(state.quest==='open'&&!state.contract);
   case 'iona':return state.quest==='open'&&!state.contract;
  }
  return false;
 }

 // ---- Guidance topics. Each returns the step for the player's real state: {text, target?: action or id, done?} ----
 const key=id=>globalThis.VoidInput?.label?.(VoidInput.bindings[id])||'?';
 const here=action=>walkingLocation?.interactions?.some(i=>i.action===action||i.id===action);
 const at=(action,text,away)=>here(action)?{text,target:action}:{text:away||text+' (at any station)'};
 const topics=[
  {id:'movement',title:'Basic movement',steps:()=>({text:'WASD to move · mouse to look · Shift to run · Space to jump · C to crouch · E to use what the prompt shows.'})},
  {id:'weapons',title:'Using weapons',steps:()=>({text:'Mouse wheel or 1 draws the pistol, H holsters it · right mouse to aim · left mouse to fire · R to reload.'})},
  {id:'mission-log',title:'The Mission Log',steps:()=>({text:'Press L to open the Mission Log. Track a mission to follow its marker; untrack to hide it. L closes the log.'})},
  {id:'npcs',title:'Finding people',steps:()=>{const m=VoidMissions.tracked(state,C),g=m&&VoidMissions.guidance(state,m,true);if(g?.interaction&&here(g.interaction))return {text:'Follow the marker to '+(walkingLocation.interactions.find(i=>i.id===g.interaction||i.action===g.interaction)?.label||'them').replace(/^TALK \/ /,'')+'. A yellow ! means someone has work or payment for you.',target:g.interaction};
   return {text:'Track a mission (L) and follow its marker. A yellow ! over someone means they have work or payment for you.'};}},
  {id:'buy',title:'Buying equipment',steps:()=>at('services','Buy ship equipment at the Ship Outfitter. What you buy goes to your equipment; fit it at Hangar / Maintenance.')},
  {id:'install',title:'Installing ship modules',steps:()=>{const fitted=Object.values(state.progression?.equipment?.installed?.[state.activeShip]||{}),waiting=(state.progression?.equipment?.owned||[]).some(id=>!fitted.includes(id));
   return waiting?at('maintenance','Open Hangar / Maintenance: READY TO INSTALL lists what you own but have not fitted. One click installs it.'):at('services','Nothing waiting to fit. Buy a module at the Ship Outfitter first.');}},
  {id:'launcher',title:'Missile launcher',steps:()=>{
   if(!state.creditGear?.includes('launcher')){if(!state.missileUnlocked)return {text:'Rook gives you a free launcher voucher after two combat runs. Fly two contracts, then come back.'};return at('services','Collect the free missile launcher at the Ship Outfitter (Rook’s voucher).');}
   if(state.loadout?.missile!=='launcher')return at('maintenance','Fit the launcher at Hangar / Maintenance: it is under READY TO INSTALL.');
   return {text:'Launcher fitted ✓. In flight: '+key('nearest')+' targets the nearest hostile, keep it in the ring until LOCKED, then '+key('missile')+' or right mouse fires.',done:true};}},
  {id:'targeting',title:'Targeting and missiles',steps:()=>({text:'In flight: '+key('nearest')+' nearest hostile · '+key('next')+' next · '+key('previous')+' previous · '+key('clear')+' clear. Hold the target in the ring until LOCKED, then '+key('missile')+' fires a missile.'})},
  {id:'flying',title:'Flying the ship',steps:()=>({text:key('throttleUp')+' thrust · '+key('throttleDown')+' brake · '+key('pitchUp')+'/'+key('pitchDown')+' pitch · '+key('yawLeft')+'/'+key('yawRight')+' yaw · '+key('rollLeft')+'/'+key('rollRight')+' roll · Space fires lasers.'})},
  {id:'travel',title:'Travelling between systems',steps:()=>({text:'Track a mission with a destination (L). In flight, turn toward the yellow navigation marker and hold the nose on it to jump.'})}
 ];
 const topic=()=>flags().guidanceOff===true?null:topics.find(t=>t.id===flags().guideTopic)||null;
 const card=document.createElement('aside');card.id='guidance-card';card.hidden=true;card.setAttribute('role','status');document.body.append(card);
 card.addEventListener('click',e=>{if(e.target.closest('[data-guide-close]')){delete state.story.flags.guideTopic;save();}});

 // ---- Drawing ----
 function project(p,h){const s=globalThis.VoidBabylon?.scene,cam=s?.activeCamera,B=globalThis.BABYLON;if(!cam||!B)return null;const v=new B.Vector3(p[0],h,p[2]);if(B.Vector3.TransformCoordinates(v,cam.getViewMatrix()).z<.4)return null;const sp=B.Vector3.Project(v,B.Matrix.Identity(),s.getTransformMatrix(),cam.viewport.toGlobal(W,H));return sp.x<-40||sp.x>W+40||sp.y<-40||sp.y>H+40?null:sp;}
 function diamond(x,y,r,fill,glyph){ctx.save();ctx.translate(x,y);ctx.shadowColor='#000';ctx.shadowBlur=8;ctx.fillStyle=fill;ctx.strokeStyle='#0b0f17';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(r,0);ctx.lineTo(0,r);ctx.lineTo(-r,0);ctx.closePath();ctx.stroke();ctx.fill();ctx.shadowBlur=0;if(glyph){ctx.fillStyle='#0b0f17';ctx.font='bold '+Math.round(r*1.15)+'px Consolas, monospace';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(glyph,0,1);}ctx.restore();}
 function label(x,y,text,color){ctx.save();ctx.font='bold 11px Consolas, monospace';ctx.textAlign='center';ctx.shadowColor='#000';ctx.shadowBlur=6;ctx.fillStyle=color;ctx.fillText(text,x,y);ctx.restore();}
  function drawMarkers(){
  if(mode!=='walking'||!walker||!walkingLocation?.interactions){card.hidden=true;return;}
  const tracked=safe(()=>VoidMissions.tracked(state,C)),color=typeColor[tracked?.type]||typeColor.main,goal=typeof trackedWalkWaypoint!=='undefined'?trackedWalkWaypoint:null,t=performance.now()/1000,guide=topic(),step=guide&&safe(()=>guide.steps());
  for(const item of walkingLocation.interactions){
   const p=item.visualPosition||item.position,d=Math.hypot(p[0]-walker.x,p[2]-walker.z),person=!!item.character;
   const isGoal=goal&&(goal===item||(goal.position[0]===item.position[0]&&goal.position[2]===item.position[2])),isGuide=step?.target&&(item.action===step.target||item.id===step.target);
   if(!isGoal&&!isGuide&&d>(person?32:14))continue;
   const sp=project(p,person?2.35:2.15);if(!sp)continue;const r=Math.max(7,Math.min(13,180/Math.max(d,1)));
   if(isGuide){const pulse=.5+.5*Math.sin(t*5);ctx.save();ctx.strokeStyle='rgba(127,240,255,'+(.55+.4*pulse)+')';ctx.lineWidth=3;ctx.beginPath();ctx.arc(sp.x,sp.y,r+8+pulse*4,0,Math.PI*2);ctx.stroke();ctx.restore();label(sp.x,sp.y-r-14,'GUIDE · '+Math.round(d)+' m','#7ff0ff');}
   if(isGoal){diamond(sp.x,sp.y,r+2,color,'');label(sp.x,sp.y+r+16,Math.round(d)+' m',color);}
   else if(person&&hasWork(item))diamond(sp.x,sp.y,r,'#ffd23f','!');
   else if(!person&&services[item.action]&&d<=14)label(sp.x,sp.y,services[item.action],'rgba(200,220,230,.75)');
  }
  // Guidance card.
  card.hidden=!step;if(step){const html='<b>GUIDE · '+guide.title.toUpperCase()+'</b><p>'+escapeText(step.text)+'</p><button type="button" data-guide-close>CLOSE GUIDE</button>';if(card.dataset.html!==html){card.innerHTML=html;card.dataset.html=html;}card.classList.toggle('done',!!step.done);}
 }
 const markersDraw=globalThis.draw;globalThis.draw=function(){markersDraw();try{drawMarkers();}catch{}};

 // ---- Guidance menu (from the game menu) ----
 function page(){const f=flags(),on=f.guidanceOff!==true;
  menuShell('guidance','<section class="settings-panel">'+button('BACK','menu-back',true)+'<h1 tabindex="-1">Guidance</h1><p>Optional help for what you are doing now. Pick a topic: a small card shows the next step and the place to go is highlighted. Mission markers show either way.</p>'
   +button(on?'GUIDANCE: ON':'GUIDANCE: OFF','guide-toggle',!on)+'<div class="guide-topics">'+topics.map(t=>button((f.guideTopic===t.id&&on?'● ':'')+t.title.toUpperCase(),'guide-topic:'+t.id,!(f.guideTopic===t.id&&on),!on)).join('')+'</div>'
   +(f.guideTopic?button('STOP CURRENT GUIDE','guide-stop',true):'')+'</section>');}
 document.addEventListener('click',e=>{const a=e.target.closest('button')?.dataset.action;if(!a||!state?.story)return;
  if(a==='menu-guidance')return page();
  if(a==='guide-toggle'){state.story.flags.guidanceOff=state.story.flags.guidanceOff===true?false:true;save();return page();}
  if(a==='guide-stop'){delete state.story.flags.guideTopic;save();return page();}
  if(a.startsWith('guide-topic:')){state.story.flags.guideTopic=a.slice(12);state.story.flags.guidanceOff=false;save();if(VoidMenu.returnTo){VoidMenu.returnTo();return;}return page();}});
 globalThis.VoidGuidance={topics,topic,hasWork,page};
})();
