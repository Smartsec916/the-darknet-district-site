/* Cockpit integration. Test access is session-only and never saved as ownership. */
const missileState={ownsMissileLauncher:false,equipped:false,missilesLoaded:0,missileCapacity:0,type:'standard'};
let missiles=[],missileCooldown=0,missileLock=VoidTargeting.fresh(),devMissileTrial=false;
function resetMissileFlight(){
 missiles=[];missileCooldown=0;missileLock=VoidTargeting.fresh();
 missileButton.classList.add('hidden');
 const testing=devMissileTrial&&VoidDevTools.authorized&&trialGear==='missile';
 Object.assign(missileState,{ownsMissileLauncher:testing,equipped:testing,missilesLoaded:testing?12:0,missileCapacity:testing?12:0});
}
function fireMissile(){
 if(mode!=='play')return;
 // Recheck the current geometry on input, not just the previous animation frame.
 VoidTargeting.step(missileLock,enemies,flightPoint,W,H,0,VOID_BALANCE,VoidMissiles.ready(missileState));
 const missile=VoidMissiles.launch(missileState,missileLock,flightBasis(),VOID_BALANCE,missileCooldown);
 if(!missile)return;missiles.push(missile);missileCooldown=VOID_BALANCE.missileCooldown;missileLock=VoidTargeting.fresh();tone(170,.2,'sawtooth');
}
canvas.addEventListener('contextmenu',event=>{if(mode==='play')event.preventDefault();});
canvas.addEventListener('pointerdown',event=>{if(mode==='play'&&event.button===2){event.preventDefault();fireMissile();}});
const missileButton=document.createElement('button');missileButton.id='missile-fire';missileButton.textContent='MISSILE';missileButton.className='hidden';missileButton.setAttribute('aria-label','Fire locked missile');document.getElementById('touch-controls').append(missileButton);
missileButton.addEventListener('pointerdown',event=>{event.preventDefault();fireMissile();});
function stepMissileCombat(dt,velocity){
 missileCooldown=Math.max(0,missileCooldown-dt);
 VoidTargeting.step(missileLock,enemies,flightPoint,W,H,dt,VOID_BALANCE,VoidMissiles.ready(missileState));
 for(const m of missiles)VoidMissiles.step(m,dt,velocity,VOID_BALANCE,enemies,(e,damage)=>{burst(m,'#ffcd83');hitEnemy(e,damage);});
 missiles=missiles.filter(m=>!m.dead);
 missileButton.classList.toggle('hidden',!missileState.ownsMissileLauncher);missileButton.disabled=missileLock.progress<1||missileCooldown>0||!VoidMissiles.ready(missileState);
}
function drawMissiles(){for(const m of missiles){const p=flightPoint(m),q=flightPoint({x:m.x-m.direction.x*5,y:m.y-m.direction.y*5,z:m.z-m.direction.z*5});if(p.z>1&&q.z>1){ctx.strokeStyle='#ffcf83';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.fillStyle='#fff3d6';ctx.fillRect(p.x-2,p.y-2,4,4);}}}
function drawMissileReticle(){
 if(!missileState.ownsMissileLauncher||!missileState.equipped)return;
 const radius=Math.min(W,H)*VOID_BALANCE.missileLockRadius,x=W/2,y=H*.44;
 ctx.save();ctx.strokeStyle=missileLock.progress>=1?'#ffcc70':missileLock.target?'#ffdba9':'#769d9e';ctx.fillStyle=ctx.strokeStyle;ctx.lineWidth=1;ctx.setLineDash([5,5]);ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,radius,-Math.PI/2,-Math.PI/2+Math.PI*2*missileLock.progress);ctx.stroke();ctx.textAlign='center';ctx.font='11px Consolas';ctx.fillText(`${missileState.missilesLoaded?missileLock.status:'EMPTY'} / ${missileState.missilesLoaded}${missileCooldown>0?' / COOLDOWN':missileLock.progress>=1?' / RIGHT CLICK':''}`,x,y+radius+19);ctx.restore();
}
