/* Tessaly police patrols on Admin's sealed-cargo run (David's step 3, Option A: patrols you can
   avoid). The outbound jump drops out once at a patrol line while the drive recharges. Patrol
   cutters fly fixed loops; inside a cutter's scan range a scan meter fills, faster when closer.
   Scan range follows the player's own sensor signature (sensors.js), so going dark and easing off
   the throttle shrink it. A full meter brings a hail, and the player always chooses: comply (fine,
   crate seized), run (they chase until the jump) or talk (may work once). There is never a forced
   stop or inspection. Rules only; police-patrols.js draws and wires it into flight. */
(function(root){
 'use strict';
 const config={dropAt:.3,recharge:26,scanRange:78,fill:.38,decay:.12,fine:400,talkChance:.5,runRecharge:6,
  cruise:15,pursuit:38,standoff:28,turn:1.6,fireEvery:1.4,bolt:115,damage:7,shotRange:150,hitRadius:2.2,cleanup:2400};
 const mission='admin-sealed-cargo-01';
 const v=(x=0,y=0,z=0)=>({x,y,z}),add=(a,b,k=1)=>v(a.x+b.x*k,a.y+b.y*k,a.z+b.z*k),sub=(a,b)=>v(a.x-b.x,a.y-b.y,a.z-b.z),len=a=>Math.hypot(a.x,a.y,a.z);
 const unit=a=>{const l=len(a)||1;return v(a.x/l,a.y/l,a.z/l);};
 // Three loops around the drop point, laid out in the player's frame when the drop happens:
 // one across the route ahead and one on each flank. Each loop passes close to the start now and then.
 const loops=[{ahead:115,right:0,up:4,radius:70,speed:.2,phase:0},{ahead:40,right:58,up:-6,radius:50,speed:-.27,phase:2.2},{ahead:70,right:-62,up:10,radius:58,speed:.24,phase:4.1}];

 function due(s,current,route){return current?.id===mission&&s.contract===mission&&route?.phase==='warp'&&route.progress>=config.dropAt&&s.story?.flags?.sealedPatrol!==true;}
 function begin(s,route){s.story.flags.sealedPatrol=true;route.progress=config.dropAt;route.phase='align';route.aligned=0;route.recharge=config.recharge;}

 // World frame: the drop point is the origin; the player's position is integrated from its velocity.
 function create(basis={f:v(0,0,1),r:v(1,0,0),u:v(0,1,0)}){
  const ships=loops.map((l,i)=>{
   const center=add(add(add(v(),basis.f,l.ahead),basis.r,l.right),basis.u,l.up);
   return {id:'patrol-'+i,className:'police-cutter',relationship:'neutral',police:true,marker:'none',size:1.3,loop:{center,a:basis.f,b:basis.r,radius:l.radius,speed:l.speed,angle:l.phase},world:v(),velocity:v(),heading:basis.f,fire:1+i*.4,scanning:false};
  });
  const zone={state:'patrol',clock:0,player:v(),meter:0,ships,shots:[],events:[],talked:false,closest:Infinity,range:config.scanRange};
  for(const s of ships)place(s,0);
  return zone;
 }
 function place(s,dt){
  const l=s.loop;l.angle+=l.speed*dt;
  const at=add(add(l.center,l.a,Math.cos(l.angle)*l.radius),l.b,Math.sin(l.angle)*l.radius);
  // Direction of travel is the loop's tangent.
  const heading=unit(add(add(v(),l.a,-Math.sin(l.angle)*Math.sign(l.speed)),l.b,Math.cos(l.angle)*Math.sign(l.speed)));
  s.velocity=add(v(),heading,Math.abs(l.speed)*l.radius);s.heading=heading;s.world=at;
 }
 const relative=(z,p)=>sub(p,z.player);
 // Scan range for a given signature total (radar on, cruising: about 1.5 -> full range).
 function scanRange(signature){return config.scanRange*Math.sqrt(Math.max(.08,Number(signature)||0)/1.5);}

 function step(z,dt,playerVelocity=v(),signature=1.5,rng=Math.random){
  if(!z)return [];dt=Math.max(0,Math.min(.1,dt));z.clock+=dt;z.player=add(z.player,playerVelocity,dt);
  const range=z.range=scanRange(signature);let closest=Infinity;
  for(const s of z.ships){
   if(z.state==='pursuit'){
    // Chase: close on the player and fire, but they never ram.
    const to=relative(z,s.world),distance=len(to),want=unit(v(-to.x,-to.y,-to.z));
    s.heading=unit(add(s.heading,sub(want,s.heading),Math.min(1,config.turn*dt)));
    // Inside standoff range they hold station on the player instead of closing further.
    s.velocity=distance<config.standoff?v(playerVelocity.x,playerVelocity.y,playerVelocity.z):add(v(),s.heading,config.pursuit);s.world=add(s.world,s.velocity,dt);
    s.fire-=dt;
    if(s.fire<=0&&distance<config.shotRange){s.fire=config.fireEvery*(.8+rng()*.4);const lead=distance/config.bolt,aim=unit(sub(add(z.player,playerVelocity,lead*.8),s.world)),spread=.04;
     const d=unit(v(aim.x+(rng()-.5)*spread,aim.y+(rng()-.5)*spread,aim.z+(rng()-.5)*spread));
     z.shots.push({world:add(s.world,d,2.5),velocity:add(v(),d,config.bolt),life:config.shotRange/config.bolt,damage:config.damage});z.events.push({type:'fire',ship:s});}
    s.scanning=false;continue;
   }
   place(s,dt);
   const distance=len(relative(z,s.world));closest=Math.min(closest,distance);
   s.scanning=z.state==='patrol'&&distance<range;
  }
  z.closest=closest;
  if(z.state==='patrol'){
   const near=z.ships.filter(s=>s.scanning).map(s=>len(relative(z,s.world)));
   if(near.length){const d=Math.min(...near);z.meter=Math.min(1,z.meter+config.fill*(1+(1-d/range))*dt);}
   else z.meter=Math.max(0,z.meter-config.decay*dt);
   if(z.meter>=1){z.state='hail';z.events.push({type:'hail'});}
  }
  for(const q of z.shots){q.world=add(q.world,q.velocity,dt);q.life-=dt;if(len(relative(z,q.world))<config.hitRadius){q.life=0;z.events.push({type:'hit',damage:q.damage});}}
  z.shots=z.shots.filter(q=>q.life>0);
  z.ships=z.ships.filter(s=>len(relative(z,s.world))<config.cleanup);
  return z.events.splice(0);
 }
 // The player's answer to the hail. Returns what the game should do.
 function resolve(z,choice,rng=Math.random){
  if(!z||z.state!=='hail')return null;
  if(choice==='comply'){z.state='clear';z.meter=0;return {outcome:'seized',fine:config.fine};}
  if(choice==='run'){z.state='pursuit';return {outcome:'pursuit',recharge:config.runRecharge};}
  if(choice==='talk'&&!z.talked){z.talked=true;if(rng()<config.talkChance){z.state='clear';z.meter=0;return {outcome:'released'};}return {outcome:'refused'};}
  return null;
 }
 // Player-relative copies for the renderer and radar.
 function visible(z){return z?z.ships.map(s=>({id:s.id,className:s.className,relationship:'neutral',police:true,marker:'none',size:s.size,scanning:s.scanning,velocity:s.velocity,...relative(z,s.world)})):[];}
 function shots(z){return z?z.shots.map(q=>({...relative(z,q.world),vx:q.velocity.x,vy:q.velocity.y,vz:q.velocity.z,life:q.life})):[];}
 const api={config,mission,loops,due,begin,create,step,resolve,visible,shots,scanRange};
 if(typeof module!=='undefined')module.exports=api;else root.VoidPolicePatrol=api;
})(globalThis);
