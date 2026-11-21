/* Cockpit integration. Test access is session-only and never saved as ownership. */
Object.assign(missileState,{ownsMissileLauncher:false,equipped:false,missilesLoaded:0,missileCapacity:0,type:'standard'});
let enemyMissiles=[],warningClock=0,warningStage='none';
let missiles=[],missileLock=VoidTargeting.fresh(),devMissileTrial=false;
let selectedTarget=null,targetSelection=false,lockEnabled=true;
function selectCombatTarget(action){
 const choices=enemies.filter(VoidStory.hostile).sort((a,b)=>FM.length(a)-FM.length(b));
 if(action==='clear'){selectedTarget=null;targetSelection=true;lockEnabled=false;missileLock=VoidTargeting.fresh();return;}
 if(action==='lock'){lockEnabled=true;if(!selectedTarget)targetSelection=false;missileLock=VoidTargeting.fresh();return;}
 const index=choices.indexOf(selectedTarget),delta=action==='previous'?-1:1;
 selectedTarget=action==='nearest'?choices[0]:choices[(index+delta+choices.length)%choices.length];
 targetSelection=true;lockEnabled=true;missileLock=VoidTargeting.fresh();VoidAudio.event('cycle');
}
function lockCandidates(){if(selectedTarget?.dead)selectedTarget=null;return !lockEnabled?[]:targetSelection?(selectedTarget?[selectedTarget]:[]):enemies.filter(e=>!globalThis.VoidFlightSkirmish?.lineBlocked(e));}
function missileStatus(){
 if(!missileState.ownsMissileLauncher)return 'NO LAUNCHER';if(!missileState.equipped)return 'NOT EQUIPPED';if(!missileState.missilesLoaded)return 'EMPTY · REARM AT DOCK';if(missileCooldown>0)return 'RELOADING';
 if(!lockEnabled)return 'LOCK OFF';const e=selectedTarget||missileLock.target;
 if(e&&FM.length(e)>missileBalance().missileRange)return 'OUT OF RANGE';
 if(missileLock.progress>=1)return 'MISSILE LOCK';if(missileLock.target)return 'ACQUIRING '+Math.round(missileLock.progress*100)+'%';
 return missileLock.available||e?'TARGET AVAILABLE · ALIGN':'NO VALID TARGET';
}
const missileHud=document.createElement('div');missileHud.className='missile-status';missileHud.id='missile-status';document.body.append(missileHud);
// Two missile types (ordnance.js): M1 (agile, standard) and M2 (heavy). The selected type fires; the Switch key / mouse wheel changes it.
const missileTypeName=t=>(globalThis.VoidOrdnance?.TYPES?.[t]?.name)||'M1';
function rackText(){const r=missileState.rack;if(!r)return 'MISSILES '+missileState.missilesLoaded+' / '+missileState.missileCapacity;return ['m1','m2'].filter(t=>r[t]?.capacity>0).map(t=>(t===missileState.type?'▶ ':'')+missileTypeName(t)+' '+r[t].loaded+'/'+r[t].capacity).join(' · ');}
function updateMissileHud(){missileHud.innerHTML='<strong>'+rackText()+' · '+VoidInput.label(VoidInput.bindings.missile)+(missileState.rack?' · SWITCH '+VoidInput.label(VoidInput.bindings.missileSwitch||'KeyZ'):'')+'</strong>'+missileStatus()+(selectedTarget?'<br>TARGET '+escapeText(VoidStoryContent.ships[selectedTarget.contentId]?.displayName||selectedTarget.className||'HOSTILE')+' · '+Math.round(FM.length(selectedTarget))+'u':'');}
function resetMissileFlight(){
 selectedTarget=null;targetSelection=false;lockEnabled=true;
 missiles=[];enemyMissiles=[];missileTrail=[];railSide=1;warningClock=0;warningStage='none';missileCooldown=0;missileLock=VoidTargeting.fresh();
 missileButton.classList.add('hidden');globalThis.VoidFlightFx?.reset();
 Object.assign(missileState,VoidFlightCraft.missiles());
 if(missileState.rack)missileState.rack=JSON.parse(JSON.stringify(missileState.rack));
 updateMissileHud();
}
// The selected type: missilesLoaded / missileCapacity follow it; the rack keeps both counts.
function switchMissile(to){
 const r=missileState.rack;if(mode!=='play'||!r)return false;const next=to||(missileState.type==='m2'?'m1':'m2');if(!r[next]?.capacity||next===missileState.type&&!to){VoidAudio.event('dry');return false;}
 r[missileState.type||'m1'].loaded=missileState.missilesLoaded;missileState.type=next;missileState.missilesLoaded=missileState.equipped?r[next].loaded:0;missileState.missileCapacity=r[next].capacity;
 if(!devMissileTrial&&!globalThis.VoidFlightSkirmish?.active&&globalThis.VoidOrdnance?.select(state,next))save();
 VoidAudio.event('cycle');updateMissileHud();return true;
}
const campaignMissileFireConsequences=C.missileFireConsequences(()=>state,()=>save());
let missileTrail=[],railSide=1;
const flightCombatLog=[];function combatLog(kind,detail){flightCombatLog.push({kind,t:typeof time!=='undefined'?time:0,...detail});if(flightCombatLog.length>80)flightCombatLog.shift();}
globalThis.VoidFlightCombat={get log(){return flightCombatLog;},get missiles(){return missiles;},get lock(){return missileLock;},get state(){return missileState;},switchMissile:(...a)=>switchMissile(...a),get trail(){return missileTrail;}};
function fireMissile(consequences=campaignMissileFireConsequences){
 if(mode!=='play')return;
 if(globalThis.VoidFlightSkirmish?.active)consequences=null;
 // Recheck the current geometry on input, not just the previous animation frame.
 VoidTargeting.step(missileLock,lockCandidates(),flightPoint,W,H,0,missileBalance(),VoidMissiles.ready(missileState));
 // Locked: a guided round. No lock: it is fired straight ahead (dumb-fire), unguided.
 const type=missileState.type||'m1',locked=missileLock.progress>=1&&!!missileLock.target,O=globalThis.VoidOrdnance,ship=(globalThis.VoidFlightCraft?.ship()||VoidShips.get(state));
 const spec=O&&missileState.rack?O.spec(type,VOID_BALANCE,ship):{};if(spec.damage!=null)spec.damage*=missileBalance().missileDamage/Math.max(.01,VOID_BALANCE.missileDamage*(ship.missile?.damage||1));   // a developer balance multiplier carried over
 railSide=-railSide;const origin={right:1.55*railSide,up:-.55,forward:1.2};   // the Kestrel's wing rails, left and right in turn (kestrel-model.js missile_left / missile_right)
 const missile=VoidMissiles.launch(missileState,locked?missileLock:VoidTargeting.fresh(),flightBasis(),missileBalance(),missileCooldown,{...spec,origin,dumb:!locked});
 if(!missile){updateMissileHud();VoidAudio.event('dry');return;}missile.side=railSide;if(missile.target){const b=flightBasis(),k=(x,y,z)=>{const n=Math.hypot(x,y,z)||1;return {x:x/n,y:y/n,z:z/n};};missile.direction=k(b.f.x+b.r.x*.09*railSide-b.u.x*.07,b.f.y+b.r.y*.09*railSide-b.u.y*.07,b.f.z+b.r.z*.09*railSide-b.u.z*.07);}missiles.push(missile);   // a guided round leaves the rail outward and down, then turns onto its targetif(missileState.rack)missileState.rack[type].loaded=missileState.missilesLoaded;
 combatLog('launch',{type,guided:!!missile.target,target:missile.target?.className||null});
 // Preserve trial isolation and persist before cooldown, lock reset, audio and HUD.
 if(!devMissileTrial)consequences?.fired?.(missileState.missilesLoaded,type);
 missileCooldown=missileBalance().missileCooldown;missileLock=VoidTargeting.fresh();VoidAudio.event('missile',ship,missile,flightBasis());globalThis.VoidFlightFx?.launch(missile);updateMissileHud();
}
canvas.addEventListener('contextmenu',event=>{if(mode==='play')event.preventDefault();});
canvas.addEventListener('pointerdown',event=>{if(mode==='play'&&event.button===2){event.preventDefault();fireMissile();}});
canvas.addEventListener('wheel',event=>{if(mode==='play'&&missileState.rack){event.preventDefault();switchMissile();}},{passive:false});
const missileButton=document.createElement('button');missileButton.id='missile-fire';missileButton.textContent='MISSILE';missileButton.className='hidden';missileButton.setAttribute('aria-label','Fire missile (guided when locked)');document.getElementById('touch-controls').append(missileButton);
missileButton.addEventListener('pointerdown',event=>{event.preventDefault();fireMissile();});
function stepMissileCombat(dt,velocity){
 const wasLocked=missileLock.progress>=1;
 missileCooldown=Math.max(0,missileCooldown-dt);
 VoidTargeting.step(missileLock,lockCandidates(),flightPoint,W,H,dt,missileBalance(),VoidMissiles.ready(missileState));
 if(!wasLocked&&missileLock.progress>=1){VoidAudio.event('lock',(globalThis.VoidFlightCraft?.ship()||VoidShips.get(state)));combatLog('lock',{target:missileLock.target?.className||null});}
 globalThis.VoidFlightSfx?.lockTone(!VoidMissiles.ready(missileState)||missileCooldown>0?'off':missileLock.progress>=1?'locked':missileLock.target?'seeking':'off',missileLock.progress);
 stepEnemyMissiles(dt,velocity);
 for(const m of missiles){const from={x:m.x,y:m.y,z:m.z},wasLost=m.lost;
  VoidMissiles.step(m,dt,velocity,missileBalance(),enemies,(e,damage,direct)=>{if(direct)combatLog('hit',{type:m.type||'m1',target:e.className,damage:Math.round(damage*10)/10,age:Math.round(m.age*100)/100});hitEnemy(e,damage);});
  if(!wasLost&&m.lost)combatLog('lost',{type:m.type||'m1',target:m.target?.className||null,age:Math.round(m.age*100)/100});
  if(!m.dead&&globalThis.VoidFlightSkirmish?.blocksSegment(from,m,1)){m.dead=true;m.detonated={x:m.x,y:m.y,z:m.z,hit:false};}
  if(m.dead&&m.detonated){const big=m.type==='m2';VoidCombatEffects.explode(m.detonated,big?'large':'missile');VoidAudio.event('explosion',(globalThis.VoidFlightCraft?.ship()||VoidShips.get(state)),m.detonated,flightBasis());if(!m.detonated.hit)combatLog('miss',{type:m.type||'m1',lost:!!m.lost,age:Math.round(m.age*100)/100});}
  // exhaust trail: a puff every 25 ms where the motor was (moves with the world like everything else in flight)
  if(!m.dead){m.puff=(m.puff||0)-dt;if(m.puff<=0){m.puff=.025;missileTrail.push({x:m.x-m.direction.x*.6,y:m.y-m.direction.y*.6,z:m.z-m.direction.z*.6,age:0,life:m.type==='m2'?2.4:1.8,size:m.type==='m2'?1.3:.95,heavy:m.type==='m2'});}}}
 for(const p of missileTrail){p.age+=dt;p.x-=velocity.x*dt;p.y-=velocity.y*dt;p.z-=velocity.z*dt;}
 missileTrail=missileTrail.filter(p=>p.age<p.life);if(missileTrail.length>320)missileTrail.splice(0,missileTrail.length-320);
 missiles=missiles.filter(m=>!m.dead);
 missileButton.classList.toggle('hidden',!missileState.ownsMissileLauncher);missileButton.disabled=missileCooldown>0||!VoidMissiles.ready(missileState);
 updateMissileHud();
}
// The Babylon view draws missiles in 3D (flight-fx.js); this is the 2D fallback only.
function drawMissiles(){for(const m of missiles){const p=flightPoint(m),q=flightPoint({x:m.x-m.direction.x*5,y:m.y-m.direction.y*5,z:m.z-m.direction.z*5});if(p.z>1&&q.z>1){ctx.strokeStyle='#d9d2c4';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.fillStyle='#fff3d6';ctx.fillRect(p.x-2,p.y-2,4,4);}}}
/* Lock-on HUD: the seeker circle in front; a target inside it is acquired over the lock time: four brackets close in and turn onto it (with the seeking tone),
   then a solid box and LOCK (the locked tone). The selected target (Next / Previous / Nearest) is marked even outside the circle. */
function drawMissileReticle(){
 if(!missileState.ownsMissileLauncher||!missileState.equipped)return;
 if(!enemies.some(VoidStory.hostile))return;   // a quiet route: no seeker circle cluttering the view
 const target=missileLock.target,locked=missileLock.progress>=1,radius=Math.min(W,H)*missileBalance().missileLockRadius,x=W*.5,y=H*.44,seek='#d8c9a3',hot='#ff6a55';
 ctx.save();ctx.lineWidth=1;ctx.strokeStyle=seek;ctx.fillStyle=seek;ctx.globalAlpha=.45;ctx.setLineDash([2,10]);ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
 for(const a of [0,1,2,3]){const t=a*Math.PI/2;ctx.beginPath();ctx.moveTo(x+Math.cos(t)*(radius-6),y+Math.sin(t)*(radius-6));ctx.lineTo(x+Math.cos(t)*(radius+4),y+Math.sin(t)*(radius+4));ctx.stroke();}
 const sel=selectedTarget&&!selectedTarget.dead&&selectedTarget!==target?selectedTarget:null;
 if(sel){const p=flightPoint(sel),r=Math.max(14,Math.min(60,p.s*sel.size*2.6));if(p.z>1){ctx.globalAlpha=.8;ctx.setLineDash([4,4]);ctx.strokeRect(p.x-r,p.y-r,2*r,2*r);ctx.setLineDash([]);ctx.font='10px Consolas';ctx.textAlign='center';ctx.fillText('TGT · '+Math.round(FM.length(sel))+'u',p.x,p.y+r+12);ctx.globalAlpha=1;}}
 if(target&&!target.dead){const p=flightPoint(target),r=Math.max(16,Math.min(65,p.s*target.size*2.8));
  if(p.z>1){const k=missileLock.progress,c=locked?hot:seek;ctx.strokeStyle=c;ctx.fillStyle=c;ctx.lineWidth=locked?2:1.5;
   if(locked){const pulse=1+.06*Math.sin(time*18);ctx.strokeRect(p.x-r*pulse,p.y-r*pulse,2*r*pulse,2*r*pulse);ctx.beginPath();ctx.moveTo(p.x,p.y-r*.45);ctx.lineTo(p.x+r*.45,p.y);ctx.lineTo(p.x,p.y+r*.45);ctx.lineTo(p.x-r*.45,p.y);ctx.closePath();ctx.stroke();}
   else{const rr=r*(2.3-1.3*k),turn=(1-k)*Math.PI/2,arm=Math.max(6,rr*.35);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(turn);for(const sx of [-1,1])for(const sy of [-1,1]){ctx.beginPath();ctx.moveTo(sx*(rr-arm),sy*rr);ctx.lineTo(sx*rr,sy*rr);ctx.lineTo(sx*rr,sy*(rr-arm));ctx.stroke();}ctx.restore();}
   ctx.font=(locked?'bold 12px':'10px')+' Consolas';ctx.textAlign='center';ctx.fillText(locked?'LOCK':'SEEK '+Math.round(k*100)+'%',p.x,p.y-r-8);ctx.font='10px Consolas';ctx.fillText(Math.round(FM.length(target))+'u',p.x,p.y+r+14);
   ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,radius+5,-Math.PI/2,-Math.PI/2+Math.PI*2*k);ctx.stroke();ctx.lineWidth=1;
  }
 }
 ctx.strokeStyle=seek;ctx.fillStyle=locked?hot:seek;ctx.font='10px Consolas';ctx.textAlign='center';
 const type=missileTypeName(missileState.type),label=!missileState.missilesLoaded?type+' EMPTY':missileCooldown>0?type+' RELOADING':locked?type+' · LOCK · FIRE':type+' · '+(target?'ACQUIRING':'NO LOCK · DUMB-FIRE');
 ctx.fillText(label,x,y-radius-12);ctx.restore();   // above the circle: the objective line sits below it
}

const missileDifficulty={easy:{time:.75,radius:1.25},normal:{time:1,radius:1},hard:{time:1.2,radius:.85}};
function missileBalance(){const m=(globalThis.VoidFlightCraft?.ship()||VoidShips.get(state)).missile,base=globalThis.VoidFlightCraft?.missileBalance()||{...VOID_BALANCE,missileDamage:VOID_BALANCE.missileDamage*m.damage,missileLockTime:VOID_BALANCE.missileLockTime*m.lock,missileCooldown:VOID_BALANCE.missileCooldown*m.cooldown};const difficulty=missileDifficulty[globalThis.VoidFlightSkirmish?.active?.selected?.difficulty]||missileDifficulty.normal;return {...base,missileLockTime:base.missileLockTime*difficulty.time,missileLockRadius:base.missileLockRadius*difficulty.radius};}
function launchEnemyMissile(e){enemyMissiles.push({x:e.x,y:e.y,z:e.z,direction:{...e.pilot.heading},life:6,distance:0,damage:VOID_BALANCE.missileDamage,target:{x:0,y:0,z:0,size:.85}});}
function stepEnemyMissiles(dt,velocity){
 const balance={...VOID_BALANCE,missileSpeed:55,missileTurnRate:.6};
 for(const m of enemyMissiles){const from={x:m.x,y:m.y,z:m.z};VoidMissiles.step(m,dt,velocity,balance,[m.target],(_,damage)=>hurt(damage));if(!m.dead&&globalThis.VoidFlightSkirmish?.blocksSegment(from,m,1)){m.dead=true;VoidCombatEffects.explode(m,'impact');}}enemyMissiles=enemyMissiles.filter(m=>!m.dead);
 const stage=enemyMissiles.length?'incoming':enemies.some(e=>e.pilot?.lock>.05)?'acquiring':'none';
 warningClock=Math.max(0,warningClock-dt);
 if(stage!==warningStage){warningStage=stage;warningClock=0;}
 if(stage!=='none'&&warningClock===0){VoidAudio.event(stage==='incoming'?'incoming':'warning',(globalThis.VoidFlightCraft?.ship()||VoidShips.get(state)));warningClock=stage==='incoming'?3:2.5;}
}
function drawEnemyLockWarning(){
 for(const e of enemies.filter(e=>!e.dead&&e.pilot?.lock>.05)){const p=flightPoint(e);if(p.z<=1||p.x<20||p.x>W-20||p.y<20||p.y>H-20)cockpitArrow(e,'LOCK SOURCE','#ffbc76');}
 for(const m of enemyMissiles){const p=flightPoint(m);if(p.z>1){ctx.fillStyle='#ff745f';ctx.fillRect(p.x-3,p.y-3,6,6);}else cockpitArrow(m,'MISSILE','#ff745f');}
 const locking=enemies.some(e=>e.pilot?.lock>.05);if(!locking&&!enemyMissiles.length)return;
 ctx.save();ctx.font='bold 14px Consolas';ctx.textAlign='center';ctx.fillStyle=enemyMissiles.length?'#ff6b61':'#ffbc76';ctx.shadowColor='#000';ctx.shadowBlur=8;ctx.fillText(enemyMissiles.length?'MISSILE INCOMING':'LOCK WARNING',W*.5,H*.22);ctx.restore();
}
