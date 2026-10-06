/* Bounded, renderer-independent station activity controller. No Campaign writes. */
(function(root){
 const config={speed:1.05,minDwell:7,maxDwell:18,idleChance:.25,idleCooldown:8,conversationChance:.25,conversationSeconds:12};
 function blocked(p,layout){return Math.abs(p.x)>layout.bounds[0]-.5||p.z<19||p.z>layout.bounds[1]-1||layout.solids.some(s=>!s.open&&s.kind!=='seat'&&Math.abs(p.x-s.position[0])<s.size[0]/2+.25&&Math.abs(p.z-s.position[2])<s.size[2]/2+.25);}
 function clear(a,b,layout){const d=Math.hypot(b.x-a.x,b.z-a.z);for(let t=0;t<=d;t+=.2)if(blocked({x:a.x+(b.x-a.x)*t/(d||1),z:a.z+(b.z-a.z)*t/(d||1)},layout))return false;return !blocked(b,layout);}
 function route(a,b,layout){if(clear(a,b,layout))return [b];const key=p=>p.x+','+p.z,start={x:Math.round(a.x),z:Math.round(a.z)},goal={x:Math.round(b.x),z:Math.round(b.z)},queue=[start],seen=new Map([[key(start),null]]);let found=null;
  for(let i=0;i<queue.length&&i<4000;i++){const p=queue[i];if(Math.hypot(p.x-goal.x,p.z-goal.z)<1.1&&clear(p,b,layout)){found=p;break;}for(const [x,z]of [[1,0],[-1,0],[0,1],[0,-1]]){const n={x:p.x+x,z:p.z+z};if(!seen.has(key(n))&&clear(p,n,layout)){seen.set(key(n),p);queue.push(n);}}}
  if(!found)return [];const out=[b];for(let p=found;p;p=seen.get(key(p)))out.unshift(p);if(!clear(a,out[0],layout))return [];return out;
 }
 function create(layout,count=6,random=Math.random){return {layout,random,time:0,actors:Array.from({length:count},(_,i)=>({id:i,x:-3+i,z:24+i*1.5,yaw:0,state:'idle',timer:i*1.7,path:[],point:null,partner:null,gesture:null,gestureClock:config.idleCooldown+i}))};}
 function release(a){a.point=null;a.partner=null;a.path=[];a.state='idle';a.timer=2;}
 function step(world,dt){dt=Math.max(0,Math.min(.1,dt));world.time+=dt;const {actors,layout,random}=world;
  for(const a of actors){
   a.timer-=dt;a.gestureClock-=dt;if(a.gestureClock<=0){a.gesture=random()<config.idleChance?['device','look','shift'][Math.floor(random()*3)]:null;a.gestureClock=config.idleCooldown+random()*8;}
   if(a.path.length){a.state='walk';const p=a.path[0],dx=p.x-a.x,dz=p.z-a.z,d=Math.hypot(dx,dz),move=Math.min(d,config.speed*dt);a.yaw=Math.atan2(dx,dz);a.x+=dx/(d||1)*move;a.z+=dz/(d||1)*move;if(d<.12)a.path.shift();if(!a.path.length){a.state=a.partner!==null?'waiting':a.point.activities[Math.floor(random()*a.point.activities.length)];a.yaw=a.point.facing;a.timer=config.minDwell+random()*(config.maxDwell-config.minDwell);}continue;}
   if(a.partner!==null){const b=actors[a.partner];if(b.path.length){a.timer=config.conversationSeconds;continue;}a.state='talk';a.yaw=Math.atan2(b.x-a.x,b.z-a.z);if(a.timer<=0){release(b);release(a);}continue;}
   if(a.timer>0)continue;
   if(random()<config.conversationChance){const b=actors.find(b=>b!==a&&b.partner===null&&!b.path.length);const pa=layout.activityPoints.find(p=>p.id==='chat-a'),pb=layout.activityPoints.find(p=>p.id==='chat-b');if(b&&pa&&pb&&!actors.some(c=>c.point===pa||c.point===pb)){const ap=route(a,{x:pa.position[0],z:pa.position[2]},layout),bp=route(b,{x:pb.position[0],z:pb.position[2]},layout);if(ap.length&&bp.length){a.partner=b.id;b.partner=a.id;a.point=pa;b.point=pb;a.path=ap;b.path=bp;a.timer=b.timer=config.conversationSeconds;continue;}}}
   const points=layout.activityPoints.filter(p=>!p.activities.includes('talk')&&!actors.some(b=>b!==a&&b.point===p));const p=points[Math.floor(random()*points.length)];if(!p){release(a);continue;}const path=route(a,{x:p.position[0],z:p.position[2]},layout);if(path.length){a.point=p;a.path=path;}else release(a);
  }
 }
 const api={config,create,step,route,blocked};if(typeof module!=='undefined')module.exports=api;else root.VoidStationActivities=api;
})(globalThis);
