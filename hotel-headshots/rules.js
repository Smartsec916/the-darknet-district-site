/* HOTEL HEADSHOTS: deterministic rules shared by the browser and Node tests. */
(function(root){
 'use strict';
 const SIZE=31,TILE=2.4,MAX_AMMO=48;
 const DIFFICULTIES={casual:{speed:.78,theft:140,count:.8},standard:{speed:1,theft:220,count:1},checkout:{speed:1.18,theft:320,count:1.25}};
 const THEMES=[
  {name:'Reception',subtitle:'WELCOME. YOUR WALLET IS EXPECTED.',wall:'#202630',carpet:'#272033',accent:'#ff4ca8',count:10},
  {name:'Guest Rooms',subtitle:'DO NOT DISTURB. THEY WILL ANYWAY.',wall:'#202a31',carpet:'#172b32',accent:'#57e7ed',count:14},
  {name:'Pool & Spa',subtitle:'COMPLIMENTARY TOWELS. COMPULSORY FEES.',wall:'#193335',carpet:'#20383c',accent:'#58efb9',count:18},
  {name:'Luxury Suites',subtitle:'LUXURY IS A REGISTERED TRADEMARK.',wall:'#2c2138',carpet:'#2a2036',accent:'#ba7dff',count:22},
  {name:'Penthouse',subtitle:'LAST STOP. KEEP THE CHANGE.',wall:'#242a38',carpet:'#1c2634',accent:'#ff648f',count:26}
 ];
 function level(index){
  const grid=Array.from({length:SIZE},(_,z)=>Array.from({length:SIZE},(_,x)=>x===0||z===0||x===SIZE-1||z===SIZE-1?'#':'.'));
  const doors=[],props=[],refills=[[11,3],[18,15],[23,27]],spawns=[],roomLabels=[],rooms=[],obstacles=[];
  const wall=(x1,z1,x2,z2)=>{for(let z=z1;z<=z2;z++)for(let x=x1;x<=x2;x++)grid[z][x]='#';};
  const door=(x,z,label)=>{grid[z][x]='D';doors.push({x,z,label,open:false});};
  const prop=(kind,x,z,extra={})=>{props.push({kind,x,z,...extra});if(['desk','couch','bed','bar','tub','dining-table','buffet','room-desk'].includes(kind))grid[z][x]='F';};
  // Front lobby, a longitudinal hall, and a double-loaded cross corridor.
  wall(1,6,29,6);door(15,6,'GUEST WING');
  const columns=index===3?[[1,13],[17,23],[25,29]]:index===4?[[1,13],[17,29]]:index===2?[[1,6],[8,13],[17,29]]:[[1,6],[8,13],[17,23],[25,29]];
  for(const [row,z0,z1,entryZ] of [[0,7,12,13],[1,18,23,17]])for(const [x0,x1] of columns){
   wall(x0-1,z0-1,x0-1,z1+1);wall(x1+1,z0-1,x1+1,z1+1);wall(x0,z1+1,x1,z1+1);wall(x0,z0-1,x1,z0-1);
   const dx=x1-1;door(dx,entryZ,'ROOM '+((index+1)*100+rooms.length+1));
   const bx=x0+1,bz=z0+1;wall(x0+2,z0,x0+2,z0+2);wall(x0,z0+3,x0+2,z0+3);door(x0+1,z0+3,'BATHROOM');
   prop('bath',bx,bz);const bed=[x1-1,z1-1];prop('bed',...bed);
   const room={id:rooms.length,number:(index+1)*100+rooms.length+1,bounds:[x0,z0,x1,z1],door:[dx,entryZ],bed,bath:[bx,bz],bedside:[bed[0],bed[1]+1],awake:[x1,z1]};rooms.push(room);
   room.window={x:x1+.48,z:z0+3};room.bathDoor=[x0+1,z0+3];room.furniture={nightstands:[[bed[0]-1,bed[1]],[bed[0]+1,bed[1]]],desk:[x1,z0+1],chair:[x1,z0+1.32],tv:[x1+.45,z0+1]};
   for(const point of room.furniture.nightstands){prop('nightstand',...point,{room:room.id});obstacles.push({x:world(point[0])+(point[0]<bed[0]?1.05:-1.05),z:world(point[1])+.45,hx:.34,hz:.35});}
   prop('room-desk',...room.furniture.desk,{room:room.id});prop('room-tv',...room.furniture.tv,{room:room.id});
   roomLabels.push(['ROOM '+room.number,dx,entryZ]);
   if(x1-x0>7)prop('couch',x1-3,z1-1);
  }
  // Rear pool is reached through its own door, never through a guest bedroom.
  wall(1,24,29,24);door(15,24,index===4?'ROOFTOP POOL':'POOL / SPA');
  wall(26,25,26,29);door(26,27,'STAIRWELL');
  const pool={bounds:index===2?[4,26,13,28]:[6,26,12,28],zone:[1,25,25,29],exit:[15,26],edge:[13,27]};
  pool.edge=[pool.bounds[2]+1,27];pool.exit=[pool.bounds[2]+2,27];
  for(let z=pool.bounds[1];z<=pool.bounds[3];z++)for(let x=pool.bounds[0];x<=pool.bounds[2];x++)grid[z][x]='W';
  props.push({kind:'pool',x:(pool.bounds[0]+pool.bounds[2])/2,z:27,width:(pool.bounds[2]-pool.bounds[0]+1)*TILE,depth:3*TILE});
  prop('bar',20,28);prop('lounger',3,26);prop('lounger',3,28);prop('lounger',17,28);
  if(index===2)prop('tub',22,26);
  prop('desk',12,4);prop('couch',5,3);
  const dining=index===0?{bounds:[20,1,29,5],seats:[[22,4],[24,4]],stands:[[23,4],[25,4]]}:null;
  if(dining){wall(19,1,19,1);wall(19,5,19,5);for(const x of [22,24])prop('dining-table',x,3);prop('buffet',28,1);roomLabels.push(['NIGHT BITES',25,1]);}else prop('couch',23,3);
  if(index===4){prop('bar',23,5);roomLabels.push(['PENTHOUSE LOUNGE',20,3]);}
  if(index===1)prop('couch',3,15);
  if(index===3)prop('couch',27,15);
  roomLabels.push(['FRONT LOBBY',15,4],['GUEST CORRIDOR',15,15],['POOL / SPA',19,26]);
  for(let z=7;z<24;z++)for(let x=1;x<30;x++)if(grid[z][x]==='.'&&(z===15||x===15))spawns.push([x,z]);
  return {index,theme:THEMES[index],grid,doors,props,refills,spawns,roomLabels,rooms,pool,dining,obstacles,start:[12,2],stairs:[28,28],down:[15,2],reception:[12,4],receptionNPC:[11.65,4.65]};
 }
 function inside(bounds,p){const x=cell(p.x),z=cell(p.z);return x>=bounds[0]&&x<=bounds[2]&&z>=bounds[1]&&z<=bounds[3];}
 function residents(map,count){return Array.from({length:count},(_,i)=>{const room=map.rooms[i%map.rooms.length];let role,point;
  if(i<2){role='sleep';point=room.bed;}else if(i===2){role='bathroom';point=room.bath;}else if(i===3){role='room';point=room.awake;}else if(i===4||i===5){role='swim';point=[map.pool.bounds[0]+1+(i-4)*2,27];}else if(map.dining&&(i===6||i===7)){role='diner';point=map.dining.seats[i-6];}else if(i%3===0){role='room';point=room.awake;}else{role='hall';point=map.spawns[(i*7+map.index*3)%map.spawns.length];}
  return {id:i,role,room:room.id,x:world(point[0]),z:world(point[1]),style:i%6,wakeDuration:i%2?.45:2.6,wakeRemaining:0,activity:role==='diner'?'eating':role==='sleep'?'sleep':role==='swim'?'swim':role==='hall'?'wander':'idle',guardStyle:i%3};});}
 const cell=v=>Math.floor(v/TILE+.5),world=v=>v*TILE;
 function blocked(map,x,z,doors=true){const c=map.grid[z]?.[x];return !c||c==='#'||(c==='F'||c==='W')||(c==='D'&&doors&&!map.doors.find(d=>d.x===x&&d.z===z)?.open);}
 function fits(map,x,z,r=.28){return !(map.obstacles||[]).some(o=>Math.abs(x-o.x)<o.hx+r&&Math.abs(z-o.z)<o.hz+r)&&[[-r,-r],[-r,r],[r,-r],[r,r]].every(([dx,dz])=>!blocked(map,cell(x+dx),cell(z+dz)));}
 function path(map,from,to){
  const sx=cell(from.x),sz=cell(from.z),tx=cell(to.x),tz=cell(to.z),start=sz*SIZE+sx,end=tz*SIZE+tx;
  if(blocked(map,tx,tz,false))return [];
  const prev=new Map([[start,-1]]),queue=[start];
  for(let i=0;i<queue.length;i++){const n=queue[i];if(n===end)break;const x=n%SIZE,z=Math.floor(n/SIZE);for(const [a,b] of [[x+1,z],[x-1,z],[x,z+1],[x,z-1]]){const k=b*SIZE+a;if(!blocked(map,a,b,false)&&!prev.has(k)){prev.set(k,n);queue.push(k);}}}
  if(!prev.has(end))return [];const route=[];for(let k=end;k!==start;k=prev.get(k))route.unshift({x:world(k%SIZE),z:world(Math.floor(k/SIZE))});return route;
 }
 function sight(map,a,b){const dist=Math.hypot(b.x-a.x,b.z-a.z),steps=Math.ceil(dist/.3);for(let i=1;i<steps;i++){const f=i/steps;if(blocked(map,cell(a.x+(b.x-a.x)*f),cell(a.z+(b.z-a.z)*f)))return false;}return true;}
 function newRun(difficulty='standard'){return {difficulty:DIFFICULTIES[difficulty]?difficulty:'standard',floor:0,money:10250,ammo:MAX_AMMO,repelled:0,paid:false,ended:false,won:false,time:0};}
 function pay(run){if(run.paid||run.ended)return false;run.money=10000;run.paid=true;return true;}
 function steal(run){if(!run.paid||run.ended)return 0;const amount=Math.min(run.money,DIFFICULTIES[run.difficulty].theft+run.floor*45);run.money-=amount;if(!run.money)run.ended=true;return amount;}
 function hit(npc,part){if(npc.retreat)return 0;const damage=part==='head'?100:part==='arm'?15:50;npc.resistance=Math.max(0,npc.resistance-damage);if(npc.resistance===0)npc.retreat=true;return damage;}
 function advance(run,direction){if(!run.paid||run.ended)return false;if(direction<0){run.floor=Math.max(0,run.floor-1);return true;}if(run.floor===4){run.ended=true;run.won=true;}else run.floor++;return true;}
 function leaderboard(entries,result){return [...(Array.isArray(entries)?entries:[]).filter(e=>e&&Number.isFinite(e.money)&&e.money>=0&&e.money<=10000&&Object.hasOwn(DIFFICULTIES,e.difficulty)).slice(0,20),...(result?.won?[{money:result.money,difficulty:result.difficulty,time:Math.round(result.time),date:new Date().toISOString().slice(0,10)}]:[])].sort((a,b)=>b.money-a.money||a.time-b.time).slice(0,10);}
 const api={SIZE,TILE,MAX_AMMO,DIFFICULTIES,THEMES,level,inside,residents,cell,world,blocked,fits,path,sight,newRun,pay,steal,hit,advance,leaderboard};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.HotelRules=api;
})(typeof globalThis!=='undefined'?globalThis:this);
