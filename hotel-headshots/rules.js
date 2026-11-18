/* HOTEL HEADSHOTS — deterministic rules shared by the browser and Node tests. */
(function(root){
 'use strict';
 const SIZE=21,TILE=2.4,MAX_AMMO=48;
 const DIFFICULTIES={casual:{speed:.78,theft:140,count:.8},standard:{speed:1,theft:220,count:1},checkout:{speed:1.18,theft:320,count:1.25}};
 const THEMES=[
  {name:'Reception',subtitle:'WELCOME. YOUR WALLET IS EXPECTED.',wall:'#202630',carpet:'#272033',accent:'#ff4ca8',count:4},
  {name:'Guest Rooms',subtitle:'DO NOT DISTURB. THEY WILL ANYWAY.',wall:'#202a31',carpet:'#172b32',accent:'#57e7ed',count:7},
  {name:'Pool & Spa',subtitle:'COMPLIMENTARY TOWELS. COMPULSORY FEES.',wall:'#193335',carpet:'#20383c',accent:'#58efb9',count:10},
  {name:'Luxury Suites',subtitle:'LUXURY IS A REGISTERED TRADEMARK.',wall:'#2c2138',carpet:'#2a2036',accent:'#ba7dff',count:13},
  {name:'Penthouse',subtitle:'LAST STOP. KEEP THE CHANGE.',wall:'#242a38',carpet:'#1c2634',accent:'#ff648f',count:16}
 ];
 function level(index){
  const grid=Array.from({length:SIZE},(_,z)=>Array.from({length:SIZE},(_,x)=>x===0||z===0||x===SIZE-1||z===SIZE-1?'#':'.'));
  const doors=[],props=[],refills=[[2,7],[18,15]],spawns=[],roomLabels=[];
  const wall=(x1,z1,x2,z2,gaps=[])=>{for(let z=z1;z<=z2;z++)for(let x=x1;x<=x2;x++)if(!gaps.some(p=>p[0]===x&&p[1]===z))grid[z][x]='#';};
  const door=(x,z)=>{grid[z][x]='D';doors.push({x,z,open:false});};
  const prop=(kind,x,z)=>{props.push({kind,x,z});if(['desk','couch','bed','bar','pool','tub'].includes(kind))grid[z][x]='F';};
  if(index===0){
   wall(1,4,19,4,[[10,4]]);door(10,4);
   wall(5,10,5,17,[[5,13]]);wall(15,10,15,17,[[15,13]]);
   prop('desk',10,7);prop('couch',6,8);prop('couch',14,8);prop('couch',8,12);prop('couch',12,12);
   prop('bar',17,11);roomLabels.push(['RECEPTION',10,9],['LOUNGE',10,15]);
  }else if(index===1){
   for(const x of [6,14])wall(x,3,x,17,[[x,5],[x,11],[x,16]]);
   for(const z of [8,14]){wall(1,z,5,z);wall(15,z,19,z);}
   for(const x of [6,14])for(const z of [5,11,16])door(x,z);
   for(const x of [3,17])for(const z of [6,12,17]){prop('bed',x,z);prop('bath',x,z-2);roomLabels.push([String(200+x+z),x,z-1]);}
   wall(9,8,11,8,[[10,8]]);wall(9,14,11,14,[[10,14]]);
  }else if(index===2){
   for(let z=7;z<=12;z++)for(let x=7;x<=13;x++)grid[z][x]='F';props.push({kind:'pool',x:10,z:9.5});
   for(const x of [5,15])for(const z of [7,10,13])prop('lounger',x,z);
   prop('tub',3,12);prop('tub',17,12);prop('bar',10,16);
   wall(1,5,5,5,[[3,5]]);wall(15,5,19,5,[[17,5]]);door(3,5);door(17,5);
   roomLabels.push(['POOL / SPA',10,6],['CHANGING',3,4],['COCKTAILS',10,15]);
  }else if(index===3){
   wall(5,4,5,17,[[5,7],[5,15]]);wall(15,4,15,17,[[15,7],[15,15]]);
   wall(6,10,14,10,[[7,10],[13,10]]);wall(10,4,10,9,[[10,6]]);wall(10,11,10,17,[[10,14]]);
   for(const p of [[5,7],[5,15],[15,7],[15,15],[10,6],[10,14]])door(...p);
   for(const x of [3,17]){prop('bed',x,9);prop('bath',x,12);prop('couch',x,16);}
   prop('couch',8,7);prop('couch',12,13);roomLabels.push(['SUITE 401',3,6],['PRIVATE LOUNGE',12,16]);
  }else{
   wall(1,6,8,6,[[4,6]]);wall(12,6,19,6,[[16,6]]);door(4,6);door(16,6);
   wall(6,8,6,15,[[6,11]]);wall(14,8,14,15,[[14,11]]);
   wall(1,17,19,17,[[9,17],[10,17],[11,17]]);
   prop('bar',10,8);prop('couch',9,12);prop('couch',11,12);prop('bed',3,13);prop('bath',17,13);
   roomLabels.push(['THE PENTHOUSE',10,5],['ROOFTOP / EXIT',10,18]);
  }
  // An unobstructed east stairwell links every floor; the descent is at the entry landing.
  for(let z=17;z<=19;z++)for(let x=17;x<=19;x++)grid[z][x]='.';
  for(let z=1;z<=3;z++)for(let x=8;x<=12;x++)grid[z][x]='.';
  for(const [x,z] of refills)grid[z][x]='.';
  for(let z=6;z<18;z+=2)for(let x=2;x<19;x+=3)if(grid[z][x]==='.'&&Math.hypot(x-10,z-2)>6)spawns.push([x,z]);
  return {index,theme:THEMES[index],grid,doors,props,refills,spawns,roomLabels,start:[10,2],stairs:[18,19],down:[10,1]};
 }
 const cell=v=>Math.floor(v/TILE+.5),world=v=>v*TILE;
 function blocked(map,x,z,doors=true){const c=map.grid[z]?.[x];return !c||c==='#'||c==='F'||(c==='D'&&doors&&!map.doors.find(d=>d.x===x&&d.z===z)?.open);}
 function fits(map,x,z,r=.28){return [[-r,-r],[-r,r],[r,-r],[r,r]].every(([dx,dz])=>!blocked(map,cell(x+dx),cell(z+dz)));}
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
 const api={SIZE,TILE,MAX_AMMO,DIFFICULTIES,THEMES,level,cell,world,blocked,fits,path,sight,newRun,pay,steal,hit,advance,leaderboard};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.HotelRules=api;
})(typeof globalThis!=='undefined'?globalThis:this);
