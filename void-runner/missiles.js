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
 /* o (optional, ordnance.js spec + launch point): {type,damage,turn,speed,blast,fuse,seeker,lifetime,range,origin:{right,up,forward},dumb}. dumb: fired with no lock, unguided. */
 function launch(s,lock,basis,balance,cooldown,o={}){
  const guided=o.dumb!==true&&balance.missileRequiresLock!==false;if(o.dumb===true&&(!ready(s)||cooldown>0))return null;
  if(!ready(s)||cooldown>0||(guided&&(lock.progress<1||!lock.target))||lock.target?.dead||((lock.target?.relationship||lock.target?.allegiance)&&(lock.target.relationship||lock.target.allegiance)!=='hostile')||(lock.target&&Math.hypot(lock.target.x,lock.target.y,lock.target.z)>balance.missileRange))return null;
  s.missilesLoaded--;const g=o.origin||{right:1.4,up:.6,forward:0},at=k=>basis.r[k]*g.right+basis.u[k]*g.up+basis.f[k]*(g.forward||0);
  const m={x:at('x'),y:at('y'),z:at('z'),direction:{...basis.f},target:guided?lock.target:null,life:o.lifetime??balance.missileLifetime,distance:0,damage:o.damage??balance.missileDamage,age:0};
  for(const k of ['type','turn','speed','blast','fuse','seeker','range','lead','splashCurve','impactStyle','launchSound','impactSound'])if(o[k]!=null)m[k]=o[k];return m;
 }
 /* Guidance with a turn-rate limit (m.turn rad/s) and a seeker cone (m.seeker): a target that turns outside the cone is lost and the round flies on (a miss).
    m.fuse: proximity fuse distance; m.blast: blast radius, ships inside it take falloff damage. m.detonated is set where it went off (for the explosion). */
 function step(m,dt,velocity,balance,enemies,hit){
  const from={x:m.x,y:m.y,z:m.z};m.life-=dt;m.age=(m.age||0)+dt;
  if(m.target&&!m.target.dead&&!m.lost){const to={x:m.target.x-m.x,y:m.target.y-m.y,z:m.target.z-m.z};
   if(m.seeker&&Math.acos(M.clamp(M.dot(M.unit(m.direction),M.unit(to)),-1,1))>m.seeker)m.lost=true;
   else{let aim=to;if(m.lead&&m.seen&&dt>0){const v={x:(m.target.x-m.seen.x)/dt,y:(m.target.y-m.seen.y)/dt,z:(m.target.z-m.seen.z)/dt},go=Math.min(3,M.length(to)/(m.speed??balance.missileSpeed));aim={x:to.x+v.x*go,y:to.y+v.y*go,z:to.z+v.z*go};}   // lead: aim where the target will be (a typed round; enemy rounds chase)
    m.direction=turn(m.direction,aim,(m.turn??balance.missileTurnRate)*dt);}
   if(m.lead)m.seen={x:m.target.x,y:m.target.y,z:m.target.z};}
  const distance=(m.speed??balance.missileSpeed)*dt;m.distance+=distance;
  for(const axis of ['x','y','z'])m[axis]+=m.direction[axis]*distance-velocity[axis]*dt;
  const hostile=e=>!e.dead&&(!(e.relationship||e.allegiance)||(e.relationship||e.allegiance)==='hostile');
  for(const e of enemies)if(hostile(e)&&M.segmentHit(from,m,e,Math.max(e.size*2.1,e===m.target&&!m.lost?m.fuse||0:0))){
   m.dead=true;m.detonated={x:m.x,y:m.y,z:m.z,hit:true};hit(e,m.damage,true);
   if(m.blast>0)for(const o of enemies)if(o!==e&&hostile(o)){const d=Math.hypot(o.x-m.x,o.y-m.y,o.z-m.z);if(d<m.blast+o.size)hit(o,m.damage*(typeof module!=='undefined'?require('./equipment-profiles.js'):root.VoidEquipmentProfiles).splash(d/(m.blast+o.size),m.splashCurve),false);}
   break;}
  if(!m.dead&&(m.life<=0||m.distance>=(m.range??balance.missileRange))){m.dead=true;m.detonated={x:m.x,y:m.y,z:m.z,hit:false};}
 }
 const api={ready,turn,launch,step};if(typeof module!=='undefined')module.exports=api;else root.VoidMissiles=api;
})(globalThis);
