/* Tessaly police patrols in flight (currently no run triggers them; see police-patrol.js). Rules live in police-patrol.js.
   The hail lines are Claude's UNREVIEWED placeholders for David to rewrite; the patrol is not voiced. */
(function(){
 const PP=VoidPolicePatrol;let zone=null,zoneRoute=null,hail=null;
 const css=document.createElement('style');
 css.textContent='#police-scan{position:fixed;top:150px;right:16px;z-index:30;width:min(300px,calc(100vw - 32px));padding:8px 12px;background:#07111ccc;border:1px solid #3a6ea8;color:#cfe3f7;font:12px/1.4 monospace;letter-spacing:.06em;text-align:center;pointer-events:none}'
  +'#police-scan .bar{height:6px;margin:6px 0;background:#13253a}#police-scan .fill{height:100%;background:#5aa0ff;transition:width .1s}#police-scan.hot .fill{background:#ff5a5a}#police-scan.chase{border-color:#ff5a5a}'
  +'#police-hail{position:fixed;left:50%;bottom:12vh;transform:translateX(-50%);z-index:40;width:min(560px,calc(100vw - 32px));padding:16px 18px;background:#08121df2;border:1px solid #4f8fd6;color:#e3edf7;font:15px/1.5 system-ui,sans-serif}'
  +'#police-hail .who{font:12px monospace;letter-spacing:.12em;color:#7fb4ff}#police-hail p{margin:8px 0 12px}#police-hail .you{color:#b8c4cf;font-style:italic}#police-hail button{display:block;width:100%;margin:6px 0 0;text-align:left}';
 document.head.append(css);
 const meter=document.createElement('div');meter.id='police-scan';meter.hidden=true;document.body.append(meter);
 const flags=()=>state.story.flags;
 function clear(){zone=null;zoneRoute=null;meter.hidden=true;closeHail();}

 // ---- The hail (UNREVIEWED placeholder dialogue) ----
 const lines={
  hail:'Freighter on the outbound lane, this is Tessaly patrol. Your cargo is reading irregular. Power down and stand by for inspection.',
  talk:'Routine freight. Medical seals. Open them and the whole load spoils.',
  released:'…Your paperwork had better be this good next time. Move along.',
  refused:'Nice try. Power down. Now.',
  seized:'Sensible. Fine logged, cargo impounded. You’re free to go.',
  run:'Freighter, cut your drive! All units, pursue.'
 };
 function closeHail(){hail?.remove();hail=null;}
 function showHail(text,options,you=''){
  closeHail();document.exitPointerLock?.();clearInput();
  hail=document.createElement('div');hail.id='police-hail';hail.setAttribute('role','dialog');
  hail.innerHTML='<div class="who">TESSALY PATROL · COMM CHANNEL</div>'+(you?'<p class="you">'+you+'</p>':'')+'<p>'+text+'</p>'+options.map((o,i)=>'<button data-choice="'+o.id+'"'+(o.quiet?' class="quiet"':'')+'>'+(i+1)+' · '+o.label+'</button>').join('');
  hail.addEventListener('click',e=>{const id=e.target.closest('button')?.dataset.choice;if(id)answer(id);});
  document.body.append(hail);
 }
 function options(){const fine=Math.min(state.credits,PP.config.fine);return [
  {id:'comply',label:'COMPLY · Pay the '+fine.toLocaleString()+' credit fine. The crate is impounded.'},
  {id:'run',label:'RUN · Spool the drive and jump. They will chase you.'},
  ...(zone.talked?[]:[{id:'talk',label:'TALK YOUR WAY OUT',quiet:true}])
 ];}
 function answer(choice){
  if(!zone||!hail)return;
  const r=PP.resolve(zone,choice);if(!r)return;
  if(r.outcome==='refused')return showHail(lines.refused,options(),lines.talk);
  closeHail();
  if(r.outcome==='released'){flags().sealedPatrolOutcome='released';save();announce('Released. The patrol waves you through. Wait for the drive, then align and jump.');return;}
  // Complying pays the fine; what happens to cargo is for the future police system to decide.
  if(r.outcome==='seized'){const paid=Math.min(state.credits,r.fine);state.credits-=paid;save();hud();announce('FINE PAID · '+paid.toLocaleString()+' credits.');return;}
  if(r.outcome==='pursuit'){zoneRoute.recharge=Math.min(zoneRoute.recharge||0,r.recharge);announce('PURSUIT · '+lines.run+' Drive spooling: align with your route and jump.');}
 }
 addEventListener('keydown',e=>{if(!hail||mode!=='play')return;const n=Number(e.key);const b=hail.querySelectorAll('button')[n-1];if(b){e.preventDefault();answer(b.dataset.choice);}},true);

 // ---- Flight ----
 const patrolUpdate=update;
 update=function(dt){
  const route=flight.route;if(hail)hail.hidden=mode!=='play';
  if(mode==='play'&&!zone&&PP.due(state,current,route)){
   PP.begin(state,route);state.travel=route;save();zone=PP.create(flightBasis());zoneRoute=route;
   globalThis.VoidAudio?.event('exit',VoidFlightCraft.ship());
   announce('WARP DROP · Tessaly patrol line. Drive recharging. Stay out of their scans: GO DARK and ease off the throttle to shrink your signature.');
  }
  // The flight holds still while the patrol waits for an answer.
  if(zone&&hail&&mode==='play'){meter.hidden=true;return;}
  patrolUpdate(dt);
  if(!zone)return;
  if(flight.route!==zoneRoute||!['play','pause','mission-log'].includes(mode)){clear();return;}
  if(zoneRoute.phase!=='align'){
   // The jump resumed: whoever was out there is left behind.
   if(zone.state==='pursuit'){flags().sealedPatrolOutcome='evaded';announce('Jump clean. The patrol lost you.');}
   else if(zone.state==='patrol')flags().sealedPatrolOutcome='avoided';
   save();clear();return;
  }
  if(mode!=='play'){meter.hidden=true;return;}
  const signature=globalThis.VoidFlightSensors?.state.signature?.total??1.5;
  for(const e of PP.step(zone,dt,flight.velocity||{x:0,y:0,z:0},signature)){
   if(e.type==='hail'){showHail(lines.hail,options());globalThis.VoidAudio?.event('charge',VoidFlightCraft.ship());}
   else if(e.type==='hit')hurt(e.damage);
   else if(e.type==='fire')globalThis.VoidAudio?.event('enemyFire',VoidFlightCraft.ship(),e.ship,flightBasis());
  }
  drawMeter();
 };
 function drawMeter(){
  if(!zone||zone.state==='clear'&&!(zoneRoute.recharge>0)){meter.hidden=true;return;}
  const drive=zoneRoute.recharge>0?'DRIVE '+Math.ceil(zoneRoute.recharge)+' s':'DRIVE READY · ALIGN AND JUMP';
  meter.hidden=false;meter.classList.toggle('chase',zone.state==='pursuit');meter.classList.toggle('hot',zone.meter>.6);
  if(zone.state==='pursuit'){meter.innerHTML='PATROL PURSUIT<div class="bar"><div class="fill" style="width:100%"></div></div>'+drive;return;}
  if(zone.state==='clear'){meter.innerHTML='CLEARED BY PATROL<div class="bar"><div class="fill" style="width:0"></div></div>'+drive;return;}
  const scanned=zone.ships.some(s=>s.scanning),dark=globalThis.VoidFlightSensors?.state.radar===false;
  meter.innerHTML='TESSALY PATROL LINE · '+(scanned?'SCANNING YOU':'UNDETECTED')+'<div class="bar"><div class="fill" style="width:'+Math.round(zone.meter*100)+'%"></div></div>'+drive+(dark?' · RUNNING DARK':' · GO DARK TO HIDE');
 }

 // Patrol cutters on the tactical display: blue, brighter while scanning.
 const patrolTactical=drawTactical;
 drawTactical=function(){
  patrolTactical();if(!zone||mode!=='play')return;
  const b=flightBasis(),x=W-115,y=H-130,r=78,scale=r/(globalThis.VoidFlightSensors?.range||240);ctx.save();
  for(const c of PP.visible(zone)){if(globalThis.VoidFlightSensors&&!VoidFlightSensors.visible({...c,signature:{total:1.5}}))continue;
   const px=x+Math.max(-r+4,Math.min(r-4,FM.dot(c,b.r)*scale)),py=y-Math.max(-r+4,Math.min(r-4,FM.dot(c,b.f)*scale));
   ctx.fillStyle=c.scanning?'#9cc8ff':'#4f86d6';ctx.fillRect(px-2.5,py-2.5,5,5);}
  ctx.restore();
 };
 const patrolSnapshot=migrationSnapshot;
 migrationSnapshot=function(){const s=patrolSnapshot();if(zone){s.ships=[...s.ships,...PP.visible(zone)];s.hostile=[...(s.hostile||[]),...PP.shots(zone)];}return s;};
 globalThis.VoidPolicePatrolState=()=>zone;
})();
