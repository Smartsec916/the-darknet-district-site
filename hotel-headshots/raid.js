/* Deterministic police pursuit across hotel floors; no rendering dependencies. */
(function(root){
'use strict';const R=typeof module==='object'&&module.exports?require('./rules.js'):root.HotelRules;
function create(){const maps=Array.from({length:5},(_,i)=>R.level(i));return {elapsed:0,shots:[],serial:0,maps,officers:maps[0].exits.map((e,i)=>{const p=e.id==='front'?[15,0]:e.id==='pool'?[15,27]:e.id==='east-emergency'?[30,25]:[2,0];return {id:i,entry:e.id,floor:0,x:R.world(p[0]),z:R.world(p[1]),stair:i===0||i===3?'west':'east',route:[],repath:0,delay:i*.3,aim:0,cooldown:0,yaw:0,walk:0};})};}
function step(raid,dt,floor,player,currentMap){
 raid.elapsed+=dt;raid.maps[floor]=currentMap;let fired=0,hit=false;
 for(const o of raid.officers){o.delay-=dt;if(o.delay>0)continue;const map=raid.maps[o.floor];
  // Officers breach each ground-floor entrance, then use ordinary room/stair navigation.
  if(o.floor===0){const entry=map.exits.find(e=>e.id===o.entry),door=map.doors.find(d=>d.x===entry.point[0]&&d.z===entry.point[1]);door.open=true;}
  const same=o.floor===floor,stairs=map.stairways.find(s=>s.id===o.stair),dest=same?player:{x:R.world((o.floor<floor?stairs.up:stairs.down)[0]),z:R.world((o.floor<floor?stairs.up:stairs.down)[1])};
  const dist=Math.hypot(dest.x-o.x,dest.z-o.z),sees=same&&dist<22&&R.sight(map,o,player);
  o.cooldown-=dt;o.aim=sees?o.aim+dt:0;
  if(sees&&o.aim>.8&&o.cooldown<=0&&dist>.01){o.cooldown=.85;raid.shots.push({id:raid.serial++,floor:o.floor,x:o.x,z:o.z,dx:(player.x-o.x)/dist,dz:(player.z-o.z)/dist,life:1.2});fired++;}
  if(!same&&dist<.5){o.floor+=o.floor<floor?1:-1;const landing=raid.maps[o.floor].stairways.find(s=>s.id===o.stair).landing;o.x=R.world(landing[0]);o.z=R.world(landing[1]);o.delay=.65;o.repath=0;o.route=[];o.aim=0;continue;}
  o.repath-=dt;if(o.repath<=0){o.route=R.path(map,o,dest);o.repath=.4;}
  while(o.route.length&&Math.hypot(o.route[0].x-o.x,o.route[0].z-o.z)<.18)o.route.shift();
  const target=sees||R.sight(map,o,dest)?dest:o.route[0];if(!target)continue;
  for(const d of map.doors)if(!d.open&&Math.hypot(R.world(d.x)-o.x,R.world(d.z)-o.z)<3&&Math.hypot(R.world(d.x)-target.x,R.world(d.z)-target.z)<1)d.open=true;
  const dx=target.x-o.x,dz=target.z-o.z,d=Math.hypot(dx,dz);o.yaw=Math.atan2(dx,dz);
  if(d>.1&&(!sees||dist>6)){const travel=Math.min(d,4.8*dt),mx=dx/d*travel,mz=dz/d*travel;if(R.fits(map,o.x+mx,o.z,.24))o.x+=mx;if(R.fits(map,o.x,o.z+mz,.24))o.z+=mz;o.walk+=dt*10;}
 }
 for(let i=raid.shots.length-1;i>=0;i--){const s=raid.shots[i],a={x:s.x,z:s.z},length=55*dt,b={x:s.x+s.dx*length,z:s.z+s.dz*length};s.life-=dt;
  const t=Math.max(0,Math.min(1,((player.x-a.x)*s.dx+(player.z-a.z)*s.dz)/Math.max(.0001,length))),near={x:a.x+s.dx*length*t,z:a.z+s.dz*length*t};
  if(s.floor===floor&&Math.hypot(player.x-near.x,player.z-near.z)<.38&&R.sight(currentMap,a,near)){hit=true;s.life=0;}
  if(!R.sight(raid.maps[s.floor],a,b))s.life=0;s.x=b.x;s.z=b.z;if(s.life<=0)raid.shots.splice(i,1);
 }
 return {fired,hit};
}
const api={create,step};if(typeof module==='object'&&module.exports)module.exports=api;else root.HotelRaid=api;
})(globalThis);
