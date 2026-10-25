/* Ambient contacts have inertial paths, never steering toward the player.
   Ports are busy: most traffic arrives at, leaves or crosses the landing area. Open space is sparse and random.
   New contacts enter far off or out of warp, so nothing pops in beside the player. */
(function(root){
 const config={emptyChance:0,maxContacts:3,port:{seed:[2,4],max:5,delay:[2.5,7]},quiet:{seed:[1,2],max:2,delay:[8,18]},open:{max:2,delay:[9,26],distance:[260,520]},warpIn:1.2,mouth:8,clearance:60};
 const definitions={courier:{model:'courier',relationship:'neutral',role:'courier',behavior:'crossing',speed:[18,32],lifetime:[14,26],spawn:{distance:[90,170],altitude:[5,18]},marker:'contact'},transport:{model:'shuttle',relationship:'neutral',role:'transport',behavior:'crossing',speed:[10,20],lifetime:[20,35],spawn:{distance:[120,210],altitude:[8,25]},marker:'contact'}};
 const range=(rng,bounds)=>bounds[0]+rng()*(bounds[1]-bounds[0]);
 const behaviors={crossing:(rng,{side,speed})=>({x:-side*speed,y:(rng()-.5)*5,z:(rng()-.5)*speed})};
 const unit=v=>{const n=Math.hypot(v.x,v.y,v.z)||1;return {x:v.x/n,y:v.y/n,z:v.z/n};};
 const add=(a,b,s=1)=>({x:a.x+b.x*s,y:a.y+b.y*s,z:a.z+b.z*s});
 // A random direction leaning toward axis; spread 0 is the axis itself, 1 is roughly a hemisphere.
 const around=(rng,axis,spread)=>unit(add(unit(axis),unit({x:rng()-.5,y:rng()-.5,z:rng()-.5}),spread));
 const pick=rng=>{const list=Object.values(definitions).filter(d=>d.relationship==='neutral'&&behaviors[d.behavior]);return list[Math.min(list.length-1,Math.floor(rng()*list.length))];};
 const defaultPort={landing:{x:0,y:4,z:-15},out:{x:0,y:0,z:1}};
 function contact(rng,def,role,start,destination,extra={}){
  const speed=range(rng,def.speed),length=Math.hypot(destination.x-start.x,destination.y-start.y,destination.z-start.z)||1;
  const velocity=Object.fromEntries(['x','y','z'].map(axis=>[axis,(destination[axis]-start[axis])/length*speed]));
  return {relationship:'neutral',traffic:true,className:def.model,role,behavior:'route',marker:def.marker,size:1+rng(),...start,destination,velocity,age:0,delay:0,lifetime:length/speed,warp:0,dead:false,...extra};
 }
 function port(rng,area,seeded){
  const out=area.out,mouth=add(area.landing,out,config.mouth),roll=rng(),def=pick(rng);
  const side=unit(Math.abs(out.y)>.9?{x:1,y:0,z:0}:{x:out.z,y:0,z:-out.x}),sign=rng()<.5?-1:1;
  // Arrivals come in from the open side of the port and disappear into it.
  if(roll<.45)return contact(rng,def,'cargo arrival',add(mouth,around(rng,out,.9),seeded?range(rng,[60,260]):range(rng,[160,300])),mouth,{docking:true,warpIn:!seeded});
  // Departures leave the mouth and jump. While the player is still in the mouth, none launch through them;
  // ones already under way are well clear and off to one side.
  const playerInMouth=Math.hypot(mouth.x,mouth.y,mouth.z)<config.clearance;
  if(roll<.8&&(seeded||!playerInMouth)){const start=seeded?add(add(mouth,out,range(rng,[60,160])),side,sign*range(rng,[15,40])):mouth;return contact(rng,def,'civilian departure',start,add(start,around(rng,out,.8),range(rng,[160,320])));}
  // Transfers cross the approach lane close to the port.
  const lane=add(mouth,out,range(rng,[25,110]));
  const start=add(add(lane,side,-sign*range(rng,[120,220])),{x:0,y:1,z:0},(rng()-.5)*30);
  return contact(rng,def,'mining transfer',start,add(start,side,sign*range(rng,[240,420])),{warpIn:!seeded});
 }
 // Open space: a lone ship drops out of warp far off, passes at a random distance and jumps away.
 function open(rng){
  const def=pick(rng),start=add({x:0,y:0,z:0},unit({x:rng()-.5,y:(rng()-.5)*.5,z:rng()-.5}),range(rng,config.open.distance));
  const pass={x:(rng()-.5)*260,y:(rng()-.5)*80,z:(rng()-.5)*260},heading=unit(add(pass,start,-1));
  return contact(rng,def,def.model==='shuttle'?'civilian transit':'courier transit',start,add(start,heading,range(rng,[420,800])),{warpIn:true});
 }
 function spawn(rng,area,seeded){return area.landing?port(rng,area,seeded):open(rng);}
 // Where traffic gathers: a port (landing point plus the direction its approach opens toward) or open space.
 function locate(area,options={}){
  const where=options.landing?{port:options.port||'port',landing:{...options.landing},out:unit(options.out||defaultPort.out),quiet:!!options.quiet}:{port:null,landing:null,out:null,quiet:false};
  const changed=where.port!==area.port;Object.assign(area,where);return changed;
 }
 // A quiet port (Vesper) sees only a couple of ships at a time.
 const pace=area=>area.landing?(area.quiet?config.quiet:config.port):config.open;
 function seed(rng,area){const count=Math.round(range(rng,pace(area).seed));for(let i=0;i<count;i++)area.contacts.push(spawn(rng,area,true));}
 function create(rng=Math.random,combat=false,options={port:'origin',...defaultPort}){
  const area={contacts:[],clock:0,next:0,port:null,landing:null,out:null};locate(area,options);
  if(combat||rng()<config.emptyChance)return area;
  if(area.landing)seed(rng,area);
  area.next=range(rng,pace(area).delay);
  return area;
 }
 // Hostile activity, warp and interdictions clear traffic; it returns gradually afterwards, never all at once.
 function hold(area,rng=Math.random,options={}){area.contacts=[];if(!area.held){area.held=true;area.next=area.clock+range(rng,pace({landing:options.landing,quiet:options.quiet}).delay);}}
 function step(area,dt,playerVelocity={x:0,y:0,z:0},options=null){
  area.clock+=dt;area.held=false;
  if(options?.rng){
   // Arriving at a new port finds it already busy; open space and returning traffic trickle in.
   if(locate(area,options)&&area.landing){seed(options.rng,area);area.next=area.clock+range(options.rng,pace(area).delay);}
   const mode=pace(area);
   if(area.clock>=area.next){if(area.contacts.length<mode.max)area.contacts.push(spawn(options.rng,area,false));area.next=area.clock+range(options.rng,mode.delay);}
  }
  for(const e of area.contacts){
   // Subtract player translation even before entering view; no player-relative formation.
   for(const axis of ['x','y','z'])e[axis]-=(playerVelocity[axis]||0)*dt;
   if(area.clock<e.delay)continue;
   e.age+=dt;
   if(e.docking&&e.age>=e.lifetime){e.dead=true;continue;}
   const leaving=Math.min(1,Math.max(0,(e.age-e.lifetime)/1.5));
   e.warp=Math.max(leaving,e.warpIn?Math.max(0,1-e.age/config.warpIn):0);
   for(const axis of ['x','y','z'])e[axis]+=e.velocity[axis]*dt*(1+leaving*45);
   if(leaving>=1||Math.hypot(e.x,e.y,e.z)>2400)e.dead=true;
  }
  area.contacts=area.contacts.filter(e=>!e.dead);
 }
 function visible(area){return area.contacts.filter(e=>area.clock>=e.delay);}
 const api={config,definitions,behaviors,create,step,hold,locate,visible};if(typeof module!=='undefined')module.exports=api;else root.VoidTraffic=api;
})(globalThis);
