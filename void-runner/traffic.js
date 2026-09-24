/* Ambient contacts have inertial paths, never steering toward the player. */
(function(root){
 const config={emptyChance:.5,maxContacts:3};
 const definitions={courier:{model:'courier',relationship:'neutral',role:'courier',behavior:'crossing',speed:[18,32],lifetime:[14,26],spawn:{distance:[250,630],altitude:[65,165]},marker:'contact'},transport:{model:'shuttle',relationship:'neutral',role:'transport',behavior:'crossing',speed:[10,20],lifetime:[20,35],spawn:{distance:[350,750],altitude:[80,180]},marker:'contact'}};
 const range=(rng,bounds)=>bounds[0]+rng()*(bounds[1]-bounds[0]);
 const behaviors={crossing:(rng,{side,speed})=>({x:-side*speed,y:(rng()-.5)*5,z:(rng()-.5)*speed})};
 function create(rng=Math.random,combat=false){
  const contacts=[];
  if(combat||rng()<config.emptyChance)return {contacts,clock:0};
  const count=1+Math.floor(rng()*config.maxContacts);
  for(let i=0;i<count;i++){
   const def=Object.values(definitions)[Math.floor(rng()*Object.keys(definitions).length)];
   if(def.relationship!=='neutral'||!behaviors[def.behavior])continue;
   const side=rng()<.5?-1:1,speed=def.speed[0]+rng()*(def.speed[1]-def.speed[0]);
   contacts.push({relationship:'neutral',traffic:true,className:def.model,role:def.role,behavior:def.behavior,marker:def.marker,size:1+rng(),x:side*(180+rng()*180),y:(rng()<.5?-1:1)*range(rng,def.spawn.altitude),z:range(rng,def.spawn.distance),velocity:behaviors[def.behavior](rng,{side,speed}),age:0,delay:i*(2+rng()*3),lifetime:range(rng,def.lifetime),warp:0,dead:false});
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
