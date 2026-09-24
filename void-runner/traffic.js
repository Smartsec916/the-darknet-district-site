/* Ambient contacts have inertial paths, never steering toward the player. */
(function(root){
 const config={emptyChance:0,maxContacts:3};
 const definitions={courier:{model:'courier',relationship:'neutral',role:'courier',behavior:'crossing',speed:[18,32],lifetime:[14,26],spawn:{distance:[90,170],altitude:[5,18]},marker:'contact'},transport:{model:'shuttle',relationship:'neutral',role:'transport',behavior:'crossing',speed:[10,20],lifetime:[20,35],spawn:{distance:[120,210],altitude:[8,25]},marker:'contact'}};
 const range=(rng,bounds)=>bounds[0]+rng()*(bounds[1]-bounds[0]);
 const behaviors={crossing:(rng,{side,speed})=>({x:-side*speed,y:(rng()-.5)*5,z:(rng()-.5)*speed})};
 function create(rng=Math.random,combat=false){
  const contacts=[];
  if(combat||rng()<config.emptyChance)return {contacts,clock:0};
  const count=config.maxContacts;
  for(let i=0;i<count;i++){
   const def=Object.values(definitions)[Math.floor(rng()*Object.keys(definitions).length)];
   if(def.relationship!=='neutral'||!behaviors[def.behavior])continue;
   const side=rng()<.5?-1:1,speed=def.speed[0]+rng()*(def.speed[1]-def.speed[0]);
   const start={x:side*(25+rng()*35),y:(rng()<.5?-1:1)*range(rng,def.spawn.altitude),z:range(rng,def.spawn.distance)};
   const destination=i===0?{x:0,y:4,z:-25}:i===1?{x:-side*100,y:15,z:240}:{x:-side*90,y:-18,z:190};
   const length=Math.hypot(destination.x-start.x,destination.y-start.y,destination.z-start.z);
   const velocity=Object.fromEntries(['x','y','z'].map(axis=>[axis,(destination[axis]-start[axis])/length*speed]));
   contacts.push({relationship:'neutral',traffic:true,className:def.model,role:i===0?'cargo arrival':i===1?'civilian departure':'mining transfer',behavior:'route',marker:def.marker,size:1+rng(),...start,destination,velocity,age:0,delay:i*.7,lifetime:length/speed,warp:0,dead:false});
  }
  return {contacts,clock:0};
 }
 function step(area,dt,playerVelocity={x:0,y:0,z:0}){
  area.clock+=dt;
  for(const e of area.contacts){
   // Subtract player translation even before entering view; no player-relative formation.
   for(const axis of ['x','y','z'])e[axis]-=(playerVelocity[axis]||0)*dt;
   if(area.clock<e.delay)continue;
   e.age+=dt;
   e.warp=Math.min(1,Math.max(0,(e.age-e.lifetime)/1.5));
   for(const axis of ['x','y','z'])e[axis]+=e.velocity[axis]*dt*(1+e.warp*45);
   if(e.warp>=1||Math.hypot(e.x,e.y,e.z)>2400)e.dead=true;
  }
  area.contacts=area.contacts.filter(e=>!e.dead);
 }
 function visible(area){return area.contacts.filter(e=>area.clock>=e.delay);}
 const api={config,definitions,behaviors,create,step,visible};if(typeof module!=='undefined')module.exports=api;else root.VoidTraffic=api;
})(globalThis);
