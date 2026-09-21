/* Skill changes steering and decisions, not hull. Stable states replace frame-by-frame jitter. */
(function(root){
 const M=typeof module!=='undefined'?require('./cockpit-math.js'):root.VoidCockpitMath;
 const missiles=typeof module!=='undefined'?require('./missiles.js'):root.VoidMissiles;
 const tiers={
  rookie:{reaction:.8,accuracy:.55,lead:.15,turn:.55,speed:21,evasion:.3,range:65,reposition:3.2,defensive:2,missileAvoidance:.3,fireCone:.82,lockTime:3.5},
  trained:{reaction:.4,accuracy:.78,lead:.6,turn:.95,speed:26,evasion:.65,range:55,reposition:2.5,defensive:2.5,missileAvoidance:.7,fireCone:.88,lockTime:2.8},
  elite:{reaction:.18,accuracy:.94,lead:.95,turn:1.4,speed:31,evasion:1,range:48,reposition:1.8,defensive:3,missileAvoidance:1,fireCone:.92,lockTime:2.1}
 };
 function init(e,tier='rookie',index=0){e.pilot={tier:tiers[tier]?tier:'rookie',state:'attack',timer:0,decision:0,side:index%2?1:-1,variant:index%3,heading:M.unit(e.velocity&&M.length(e.velocity)>.1?e.velocity:{x:-e.x,y:-e.y,z:-e.z}),speed:20,lock:0,missileCooldown:5};return e.pilot;}
 function step(e,dt,context){
  const p=e.pilot||init(e),t=tiers[p.tier],distance=M.length(e),toward=M.unit({x:-e.x,y:-e.y,z:-e.z});
  p.timer=Math.max(0,p.timer-dt);p.decision-=dt;p.missileCooldown=Math.max(0,p.missileCooldown-dt);
  if(p.decision<=0){
   p.decision=t.reaction;
   const threatened=context.missileThreat||(context.lockThreat&&t.missileAvoidance>=.6)||(context.underFire&&t.evasion>=.6);
   let next=p.state;
   if(distance>220)next='reposition';
   else if(threatened&&p.timer<=0)next='evade';
   else if(e.armor/e.maxArmor<.24&&p.timer<=0&&p.state!=='retreat')next='retreat';
   else if(distance<22&&p.state==='attack')next='pass';
   else if(p.timer<=0)next=(p.state==='pass'||p.state==='retreat'||p.state==='evade')?'reposition':'attack';
   if(next!==p.state){p.state=next;p.timer=next==='evade'?t.defensive:t.reposition;}
  }
  let aim={...toward},wanted=t.speed;
  if(p.state==='attack'){
   const lead=distance/55*t.lead;
   aim=M.unit({x:-e.x+context.velocity.x*lead,y:-e.y+context.velocity.y*lead,z:-e.z+context.velocity.z*lead});
   // Flank aim is fixed by pilot identity, never random jitter.
   if(p.variant===1&&distance>t.range){aim=M.unit({x:aim.x+context.right.x*.35*p.side,y:aim.y,z:aim.z+context.right.z*.35*p.side});}
   wanted=distance<t.range?t.speed*.6:t.speed*(context.shieldsDown?1.1:1);
  }else if(p.state==='pass')aim=p.heading;
  else if(p.state==='retreat')aim={x:-toward.x,y:-toward.y,z:-toward.z};
  else if(p.state==='evade')aim=M.unit({x:-toward.z*p.side,y:.5*Math.sin(e.age*2),z:toward.x*p.side});
  else aim=M.unit({x:-e.x-context.forward.x*35,y:-e.y,z:-e.z-context.forward.z*35});
  if(distance>260)aim=toward;
  p.heading=missiles.turn(p.heading,aim,t.turn*dt);p.speed+=(wanted-p.speed)*(1-Math.exp(-dt*2));
  if(e.generator)p.speed=0;
  e.velocity={x:p.heading.x*p.speed,y:p.heading.y*p.speed,z:p.heading.z*p.speed};
  const facing=M.dot(p.heading,toward),offensive=p.state==='attack'||p.state==='reposition';
  p.canFire=offensive&&distance<165&&facing>t.fireCone;
  p.lock=e.heavy&&p.canFire&&distance<130&&p.missileCooldown<=0?Math.min(1,p.lock+dt/t.lockTime):Math.max(0,p.lock-dt*2);
  return p;
 }
 const api={tiers,init,step};if(typeof module!=='undefined')module.exports=api;else root.VoidEnemyPilots=api;
})(globalThis);
