/* Ownership is external. Ammo and equipped state never grant a launcher. */
(function(root){
 const M=typeof module!=='undefined'?require('./cockpit-math.js'):root.VoidCockpitMath;
 function ready(s){return s.ownsMissileLauncher===true&&s.equipped===true&&Number.isSafeInteger(s.missileCapacity)&&Number.isSafeInteger(s.missilesLoaded)&&s.missileCapacity>0&&s.missilesLoaded>0&&s.missilesLoaded<=s.missileCapacity;}
 function turn(from,to,limit){
  const a=M.unit(from),b=M.unit(to),angle=Math.acos(M.clamp(M.dot(a,b),-1,1));if(angle<=limit)return b;
  let tangent=M.unit({x:b.x-a.x*Math.cos(angle),y:b.y-a.y*Math.cos(angle),z:b.z-a.z*Math.cos(angle)});
  if(M.length(tangent)<.5){const axis=Math.abs(a.x)<.9?{x:1,y:0,z:0}:{x:0,y:1,z:0};tangent=M.unit({x:axis.x-a.x*M.dot(axis,a),y:axis.y-a.y*M.dot(axis,a),z:axis.z-a.z*M.dot(axis,a)});}
  return {x:a.x*Math.cos(limit)+tangent.x*Math.sin(limit),y:a.y*Math.cos(limit)+tangent.y*Math.sin(limit),z:a.z*Math.cos(limit)+tangent.z*Math.sin(limit)};
 }
 function launch(s,lock,basis,balance,cooldown){
  if(!ready(s)||cooldown>0||lock.progress<1||!lock.target||lock.target.dead||((lock.target.relationship||lock.target.allegiance)&&(lock.target.relationship||lock.target.allegiance)!=='hostile')||Math.hypot(lock.target.x,lock.target.y,lock.target.z)>balance.missileRange)return null;
  s.missilesLoaded--;return {x:basis.r.x*1.4+basis.u.x*.6,y:basis.r.y*1.4+basis.u.y*.6,z:basis.r.z*1.4+basis.u.z*.6,direction:{...basis.f},target:lock.target,life:balance.missileLifetime,distance:0,damage:balance.missileDamage};
 }
 function step(m,dt,velocity,balance,enemies,hit){
  const from={x:m.x,y:m.y,z:m.z};m.life-=dt;
  if(m.target&&!m.target.dead)m.direction=turn(m.direction,{x:m.target.x-m.x,y:m.target.y-m.y,z:m.target.z-m.z},balance.missileTurnRate*dt);
  const distance=balance.missileSpeed*dt;m.distance+=distance;
  for(const axis of ['x','y','z'])m[axis]+=m.direction[axis]*distance-velocity[axis]*dt;
  for(const e of enemies)if(!e.dead&&(!(e.relationship||e.allegiance)||(e.relationship||e.allegiance)==='hostile')&&M.segmentHit(from,m,e,e.size*2.1)){hit(e,m.damage);m.dead=true;break;}
  if(m.life<=0||m.distance>=balance.missileRange)m.dead=true;
 }
 const api={ready,turn,launch,step};if(typeof module!=='undefined')module.exports=api;else root.VoidMissiles=api;
})(globalThis);
