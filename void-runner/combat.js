/* Cockpit integration. Test access is session-only and never saved as ownership. */
const missileState={ownsMissileLauncher:false,equipped:false,missilesLoaded:0,missileCapacity:0,type:'standard'};
let enemyMissiles=[],warningClock=0;
let missiles=[],missileCooldown=0,missileLock=VoidTargeting.fresh(),devMissileTrial=false;
function resetMissileFlight(){
 missiles=[];enemyMissiles=[];warningClock=0;missileCooldown=0;missileLock=VoidTargeting.fresh();
 missileButton.classList.add('hidden');
 const testing=devMissileTrial&&VoidDevTools.authorized&&trialGear==='missile';
 const owns=state.creditGear.includes('launcher'),equipped=owns&&state.loadout.missile==='launcher',capacity=VoidShips.get(state).missile.capacity;
 Object.assign(missileState,{ownsMissileLauncher:testing||owns,equipped:testing||equipped,missilesLoaded:testing?12:equipped?capacity:0,missileCapacity:testing?12:owns?capacity:0});
}
function fireMissile(){
 if(mode!=='play')return;
 // Recheck the current geometry on input, not just the previous animation frame.
 VoidTargeting.step(missileLock,enemies,flightPoint,W,H,0,missileBalance(),VoidMissiles.ready(missileState));
 const missile=VoidMissiles.launch(missileState,missileLock,flightBasis(),missileBalance(),missileCooldown);
 if(!missile)return;missiles.push(missile);missileCooldown=missileBalance().missileCooldown;missileLock=VoidTargeting.fresh();VoidAudio.event('missile',VoidShips.get(state));
}
canvas.addEventListener('contextmenu',event=>{if(mode==='play')event.preventDefault();});
canvas.addEventListener('pointerdown',event=>{if(mode==='play'&&event.button===2){event.preventDefault();fireMissile();}});
const missileButton=document.createElement('button');missileButton.id='missile-fire';missileButton.textContent='MISSILE';missileButton.className='hidden';missileButton.setAttribute('aria-label','Fire locked missile');document.getElementById('touch-controls').append(missileButton);
missileButton.addEventListener('pointerdown',event=>{event.preventDefault();fireMissile();});
function stepMissileCombat(dt,velocity){
 const wasLocked=missileLock.progress>=1;
 missileCooldown=Math.max(0,missileCooldown-dt);
 VoidTargeting.step(missileLock,enemies,flightPoint,W,H,dt,missileBalance(),VoidMissiles.ready(missileState));
 if(!wasLocked&&missileLock.progress>=1)VoidAudio.event('lock',VoidShips.get(state));
 stepEnemyMissiles(dt,velocity);
 for(const m of missiles)VoidMissiles.step(m,dt,velocity,missileBalance(),enemies,(e,damage)=>{burst(m,'#ffcd83');hitEnemy(e,damage);});
 missiles=missiles.filter(m=>!m.dead);
 missileButton.classList.toggle('hidden',!missileState.ownsMissileLauncher);missileButton.disabled=missileLock.progress<1||missileCooldown>0||!VoidMissiles.ready(missileState);
}
function drawMissiles(){for(const m of missiles){const p=flightPoint(m),q=flightPoint({x:m.x-m.direction.x*5,y:m.y-m.direction.y*5,z:m.z-m.direction.z*5});if(p.z>1&&q.z>1){ctx.strokeStyle='#ffcf83';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.fillStyle='#fff3d6';ctx.fillRect(p.x-2,p.y-2,4,4);}}}
function drawMissileReticle(){
 if(!missileState.ownsMissileLauncher||!missileState.equipped)return;
 const target=missileLock.target,locked=missileLock.progress>=1,radius=Math.min(W,H)*missileBalance().missileLockRadius,x=W*.5,y=H*.44;
 ctx.save();ctx.strokeStyle=locked?'#ffd084':'#87dcc6';ctx.fillStyle=ctx.strokeStyle;ctx.lineWidth=1;ctx.globalAlpha=.65;ctx.setLineDash([3,12]);ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
 if(target&&!target.dead){const p=flightPoint(target),r=Math.max(16,Math.min(65,p.s*target.size*2.8));
  if(p.z>1){if(locked)ctx.strokeRect(p.x-r,p.y-r,2*r,2*r);else for(const sx of [-1,1])for(const sy of [-1,1]){ctx.beginPath();ctx.moveTo(p.x+sx*(r-7),p.y+sy*r);ctx.lineTo(p.x+sx*r,p.y+sy*r);ctx.lineTo(p.x+sx*r,p.y+sy*(r-7));ctx.stroke();}
   ctx.font='10px Consolas';ctx.textAlign='center';ctx.fillText(locked?'LOCK':Math.round(missileLock.progress*100)+'%',p.x,p.y-r-7);
   ctx.beginPath();ctx.arc(x,y,radius,-Math.PI/2,-Math.PI/2+Math.PI*2*missileLock.progress);ctx.stroke();
  }
 }
 ctx.font='10px Consolas';ctx.textAlign='center';ctx.fillText(!missileState.missilesLoaded?'EMPTY':missileCooldown>0?'COOLDOWN':locked?'LOCK / FIRE':'',x,y+radius+14);ctx.restore();
}

function missileBalance(){const m=VoidShips.get(state).missile;return {...VOID_BALANCE,missileDamage:VOID_BALANCE.missileDamage*m.damage,missileLockTime:VOID_BALANCE.missileLockTime*m.lock,missileCooldown:VOID_BALANCE.missileCooldown*m.cooldown};}
function launchEnemyMissile(e){enemyMissiles.push({x:e.x,y:e.y,z:e.z,direction:{...e.pilot.heading},life:6,distance:0,damage:VOID_BALANCE.missileDamage,target:{x:0,y:0,z:0,size:.85}});VoidAudio.event('warning',VoidShips.get(state));}
function stepEnemyMissiles(dt,velocity){
 const balance={...VOID_BALANCE,missileSpeed:55,missileTurnRate:.6};
 for(const m of enemyMissiles)VoidMissiles.step(m,dt,velocity,balance,[m.target],(_,damage)=>hurt(damage));enemyMissiles=enemyMissiles.filter(m=>!m.dead);
 warningClock=Math.max(0,warningClock-dt);if(warningClock===0&&enemies.some(e=>e.pilot?.lock>.05)){VoidAudio.event('warning',VoidShips.get(state));warningClock=2;}
}
function drawEnemyLockWarning(){
 for(const m of enemyMissiles){const p=flightPoint(m);if(p.z>1){ctx.fillStyle='#ff745f';ctx.fillRect(p.x-3,p.y-3,6,6);}else cockpitArrow(m,'MISSILE','#ff745f');}
 const locking=enemies.some(e=>e.pilot?.lock>.05);if(!locking&&!enemyMissiles.length)return;
 ctx.save();ctx.font='12px Consolas';ctx.textAlign='center';ctx.fillStyle='#ff9869';ctx.fillText(enemyMissiles.length?'MISSILE LOCKED / INCOMING':'LOCK WARNING',W*.5,H*.22);ctx.restore();
}
