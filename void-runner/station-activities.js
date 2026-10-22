/* Bounded, renderer-independent station activity controller. No Campaign writes.
   Each crew member picks a free activity point, walks there along a collision-free path, and stays a
   while. Seats add a sit-down on arrival and a stand-up before leaving, so the renderer can play those
   moves instead of snapping. Doors are passable (the renderer slides them open as people approach), at
   most a couple of people watch the windows at once, and walkers give way instead of passing through
   each other. */
(function(root){
 const config={speed:1.05,minDwell:15,maxDwell:36,idleChance:.25,idleCooldown:8,conversationChance:.25,conversationSeconds:12,
  sitDown:1.6,standUp:1.6,maxAtWindows:2,personal:.75,yieldMax:1.5};
 // States in which the figure is seated (the renderer keeps it in the seat).
 const seated=new Set(['sit','drink','device','talk-seated','sit-down','stand']);
 function blocked(p,layout){return Math.abs(p.x)>layout.bounds[0]-.5||p.z<(layout.npcMinZ??5)||p.z>layout.bounds[1]-1||layout.solids.some(s=>!s.open&&s.kind!=='seat'&&s.kind!=='door'&&Math.abs(p.x-s.position[0])<s.size[0]/2+.25&&Math.abs(p.z-s.position[2])<s.size[2]/2+.25);}
 function clear(a,b,layout){const d=Math.hypot(b.x-a.x,b.z-a.z);for(let t=0;t<=d;t+=.2)if(blocked({x:a.x+(b.x-a.x)*t/(d||1),z:a.z+(b.z-a.z)*t/(d||1)},layout))return false;return !blocked(b,layout);}
 function route(a,b,layout){if(clear(a,b,layout))return [b];const key=p=>p.x+','+p.z,start={x:Math.round(a.x),z:Math.round(a.z)},goal={x:Math.round(b.x),z:Math.round(b.z)},queue=[start],seen=new Map([[key(start),null]]);let found=null;
  for(let i=0;i<queue.length&&i<6000;i++){const p=queue[i];if(Math.hypot(p.x-goal.x,p.z-goal.z)<1.1&&clear(p,b,layout)){found=p;break;}for(const [x,z]of [[1,0],[-1,0],[0,1],[0,-1]]){const n={x:p.x+x,z:p.z+z};if(!seen.has(key(n))&&clear(p,n,layout)){seen.set(key(n),p);queue.push(n);}}}
  if(!found)return [];const out=[b];for(let p=found;p;p=seen.get(key(p)))out.unshift(p);if(!clear(a,out[0],layout))return [];return out;
 }
 function create(layout,count=6,random=Math.random){const actors=crew(layout,count);if(layout.staffPoints?.length){const [x,z]=layout.staffStart;actors.push({id:'bartender',staff:true,x,z,yaw:Math.PI/2,state:'wipe',timer:4,path:[],point:null,partner:null,gesture:null,gestureClock:1e9,settle:0,next:null,rising:0,yielded:0,served:{}});}return {layout,random,time:0,actors};}
 function crew(layout,count){return Array.from({length:count},(_,i)=>({id:i,x:(i%2?.8:-.8),z:(layout.npcStart??30)+i*3.5,yaw:0,state:'idle',timer:i*1.7,path:[],point:null,partner:null,gesture:null,gestureClock:config.idleCooldown+i,settle:0,next:null,rising:0,yielded:0}));}
 function release(a){a.point=null;a.partner=null;a.path=[];a.state='idle';a.timer=2;}
 const isWindow=p=>p?.activities.includes('window');
 // Starts walking to p. From a seat, the figure stands up first.
 function go(a,p,path){const wasSeated=a.point?.seat&&seated.has(a.state);a.point=p;a.path=path;if(wasSeated){a.rising=config.standUp;a.state='stand';}}
 function arrive(a,random){
  const activity=a.point.activities[Math.floor(random()*a.point.activities.length)];
  a.yaw=a.point.facing;a.timer=config.minDwell+random()*(config.maxDwell-config.minDwell);
  if(a.partner!==null){a.state='waiting';return;}
  if(a.point.seat){a.state='sit-down';a.settle=config.sitDown;a.next=activity;}else a.state=activity;
 }
 function step(world,dt){dt=Math.max(0,Math.min(.1,dt));world.time+=dt;const {actors,layout,random}=world;
  for(const a of actors){
   if(a.staff){staffStep(world,a,dt);continue;}
   a.timer-=dt;a.gestureClock-=dt;if(a.gestureClock<=0){a.gesture=random()<config.idleChance?['device','look','shift'][Math.floor(random()*3)]:null;a.gestureClock=config.idleCooldown+random()*8;}
   // Short transitions: standing up from a seat, sitting down on arrival.
   if(a.rising>0){a.rising=Math.max(0,a.rising-dt);a.state='stand';continue;}
   if(a.settle>0){a.settle=Math.max(0,a.settle-dt);if(!a.settle){a.state=a.next;a.next=null;}continue;}
   if(a.path.length){
    const p=a.path[0],dx=p.x-a.x,dz=p.z-a.z,d=Math.hypot(dx,dz);
    // Give way to someone close ahead (for a moment; then carry on, so nobody is stuck for good).
    const ahead=actors.some(b=>b!==a&&Math.hypot(b.x-a.x,b.z-a.z)<config.personal&&((b.x-a.x)*dx+(b.z-a.z)*dz)>0);
    if(ahead&&a.yielded<config.yieldMax){a.yielded+=dt;a.state='idle';continue;}
    a.yielded=0;a.state='walk';const move=Math.min(d,config.speed*dt);a.yaw=Math.atan2(dx,dz);a.x+=dx/(d||1)*move;a.z+=dz/(d||1)*move;if(d<.12)a.path.shift();if(!a.path.length)arrive(a,random);continue;
   }
   if(a.partner!==null){const b=actors[a.partner];if(b.path.length){a.timer=config.conversationSeconds;continue;}a.state='talk';a.yaw=Math.atan2(b.x-a.x,b.z-a.z);if(a.timer<=0){release(b);release(a);}continue;}
   if(a.timer>0)continue;
   if(random()<config.conversationChance){const b=actors.find(b=>b!==a&&!b.staff&&b.partner===null&&!b.path.length&&!b.rising&&!b.settle);const pa=layout.activityPoints.find(p=>p.id==='chat-a'),pb=layout.activityPoints.find(p=>p.id==='chat-b');if(b&&pa&&pb&&!actors.some(c=>c.point===pa||c.point===pb)){const ap=route(a,{x:pa.position[0],z:pa.position[2]},layout),bp=route(b,{x:pb.position[0],z:pb.position[2]},layout);if(ap.length&&bp.length){a.partner=b.id;b.partner=a.id;go(a,pa,ap);go(b,pb,bp);a.timer=b.timer=config.conversationSeconds;continue;}}}
   // A free point; the windows only while fewer than maxAtWindows people are at or heading to one.
   const watching=actors.filter(b=>b!==a&&!b.staff&&isWindow(b.point)).length;
   const points=layout.activityPoints.filter(p=>!p.activities.includes('talk')&&p!==a.point&&!actors.some(b=>b!==a&&b.point===p)&&(!isWindow(p)||watching<config.maxAtWindows));
   const p=points[Math.floor(random()*points.length)];if(!p){release(a);continue;}const path=route(a,{x:p.position[0],z:p.position[2]},layout);if(path.length)go(a,p,path);else release(a);
  }
 }
 // The bartender: serves whoever has sat at the bar and not been served lately, otherwise polishes glasses, pours or
 // reaches to the back shelf. Stays behind the bar. Each serving: walk over, talk, then pour.
 function staffStep(world,a,dt){const {actors,layout,random}=world;a.timer-=dt;
  if(a.path.length){const p=a.path[0],dx=p.x-a.x,dz=p.z-a.z,d=Math.hypot(dx,dz),move=Math.min(d,config.speed*.9*dt);a.state='walk';a.yaw=Math.atan2(dx,dz);a.x+=dx/(d||1)*move;a.z+=dz/(d||1)*move;if(d<.12)a.path.shift();
   if(!a.path.length){a.yaw=a.point.facing;a.state=a.point.activities[Math.floor(random()*a.point.activities.length)];a.timer=a.state==='serve'?7+random()*4:a.state==='shelf'?5+random()*4:10+random()*10;}return;}
  if(a.state==='serve'&&a.timer<=0){a.state='pour';a.timer=2.5+random()*2;return;}
  if(a.timer>0)return;
  const t=world.time,waiting=layout.staffPoints.find(p=>p.stool&&actors.some(b=>!b.staff&&b.point?.id===p.stool&&seated.has(b.state)&&b.state!=='sit-down'&&b.state!=='stand')&&!(a.served[p.stool]>t-90));
  const near=q=>Math.hypot(q.position[0]-a.x,q.position[2]-a.z),pool=waiting?[waiting]:layout.staffPoints.filter(p=>!p.stool&&p!==a.point).sort((p,q)=>near(p)-near(q)).slice(0,3);const p=pool[Math.floor(random()*pool.length)];if(!p)return;
  if(p.stool)a.served[p.stool]=t;const path=route(a,{x:p.position[0],z:p.position[2]},layout);if(path.length){a.point=p;a.path=path;}else a.timer=3;}
 const api={config,seated,create,step,route,blocked};if(typeof module!=='undefined')module.exports=api;else root.VoidStationActivities=api;
})(globalThis);
