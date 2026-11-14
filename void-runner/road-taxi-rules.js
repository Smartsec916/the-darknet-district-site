/* Street taxis in NeoChinatown. Pure rules: no rendering, no clock, no network.
   The sky cabs (taxi-rules.js, city-taxi.js) still fly to the painted zones. These drive the roads.
   Destinations: REGISTRY below is the only list. Each id must already be a taxi zone in neochinatown.js
   that is not a placeholder district. A new stop is one new line here, once that zone exists.
   Fares use the sky-cab formula (taxi-rules.js). The charge is recorded in story.flags.roadTaxiTrip
   so it never collides with a sky-cab fare, and a reload refunds it once. */
(function(root){
 'use strict';
 const node=typeof module!=='undefined';
 const N=node?require('./neochinatown.js'):root.VoidNeoChinatown;
 const Fares=node?require('./taxi-rules.js'):root.VoidTaxiRules;
 // Add a destination by appending the id of a taxi zone that already exists. Do not invent places.
 const REGISTRY=['main','avenue','alley-mouth','passage'];
 const FLAG='roadTaxiTrip';
 const SPEC={length:4.4,width:1.9,nose:2.2,cruise:8,accel:7,brake:16,gap:2.6,look:0.45,hold:120,playerR:0.5,taxiR:2.3};
 const DRIVE=['avenue','avenueWest','avenueEast','main','mainSouth','road','passage'];
 const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);

 function stops(){
  const zones=N.taxiZones||[],out=[];
  for(const id of REGISTRY){
   const z=zones.find(x=>x.id===id);
   if(!z||z.district)continue;
   if((N.districts||[]).some(d=>d.placeholder&&(d.id===z.id||d.id===z.district)))continue;
   out.push({id:z.id,label:z.name,position:[z.position[0],z.position[1]]});
  }
  return out;
 }
 function availability(s,ctx={}){
  if(!s||s.location!=='earth')return {ok:false,reason:ctx.inSpace?'No taxis drive in space.':'No street taxi service operates here.'};
  if(!ctx.onFoot)return {ok:false,reason:'Taxis pick up on foot, in the city.'};
  if(ctx.area&&ctx.area!=='street')return {ok:false,reason:'Street taxis stay on the roads. Step outside first.'};
  if(ctx.combat)return {ok:false,reason:'No cab will come in while there is fighting.'};
  if(ctx.busy)return {ok:false,reason:'Try again in a moment.'};
  if(ctx.trip)return {ok:false,reason:'A taxi is already on its way.'};
  if(s.story?.flags?.taxiBlocked)return {ok:false,reason:'Taxi service is suspended for this mission.'};
  return {ok:true,network:'NeoChinatown street taxis'};
 }
 const cost=(from,to)=>Fares.cost(from,to);
 function destinations(s,ctx){
  const player=ctx&&ctx.player;if(!player)return [];
  return stops().map(d=>{const fare=cost(player,d.position),here=Math.hypot(player[0]-d.position[0],player[1]-d.position[1])<18;
   if(here)return {...d,fare,ok:false,reason:'Already there.'};
   const afford=!s||s.credits>=fare;
   return {...d,fare,ok:!!afford,reason:afford?null:'Not enough credits ('+fare+' CR).'};});
 }
 function charge(s,dest,price){if(!s?.story?.flags||s.story.flags[FLAG]||s.credits<price)return 0;s.credits-=price;s.story.flags[FLAG]=dest+':'+price;return price;}
 function arrive(s){if(s?.story?.flags)delete s.story.flags[FLAG];}
 function recover(s){const m=/^[a-z-]+:(\d{1,4})$/.exec(String(s?.story?.flags?.[FLAG]||''));if(!m)return 0;delete s.story.flags[FLAG];const back=Number(m[1]);s.credits+=back;return back;}

 function line(a,b){const n=Math.max(1,Math.round(dist(a,b)/6)),pts=[];for(let i=0;i<=n;i++){const k=i/n;pts.push({x:a.x+(b.x-a.x)*k,z:a.z+(b.z-a.z)*k});}return pts;}
 function arc(cx,cz,r,a0,a1,steps){const pts=[];for(let i=0;i<=steps;i++){const a=a0+(a1-a0)*i/steps;pts.push({x:cx+r*Math.cos(a),z:cz+r*Math.sin(a)});}return pts;}
 function pathLength(pts){let n=0;for(let i=1;i<pts.length;i++)n+=dist(pts[i-1],pts[i]);return n;}
 function pointAlong(pts,s,closed){
  const L=pathLength(pts);if(!(L>0))return {x:pts[0].x,z:pts[0].z,yaw:0,s:0};
  let d=closed?((s%L)+L)%L:Math.max(0,Math.min(L,s)),acc=0;
  for(let i=1;i<pts.length;i++){const seg=dist(pts[i-1],pts[i]);
   if(d<=seg+1e-6||i===pts.length-1){const k=seg?Math.max(0,Math.min(1,d/seg)):0,x=pts[i-1].x+(pts[i].x-pts[i-1].x)*k,z=pts[i-1].z+(pts[i].z-pts[i-1].z)*k;
    return {x,z,yaw:Math.atan2(pts[i].x-pts[i-1].x,pts[i].z-pts[i-1].z),s:closed?((s%L)+L)%L:Math.min(L,acc+d)};}
   d-=seg;acc+=seg;}
  return {x:pts[pts.length-1].x,z:pts[pts.length-1].z,yaw:0,s:L};
 }
 function projectPath(pts,p){
  let best=null,acc=0;
  for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],vx=b.x-a.x,vz=b.z-a.z,l2=vx*vx+vz*vz;let k=l2?((p.x-a.x)*vx+(p.z-a.z)*vz)/l2:0;k=Math.max(0,Math.min(1,k));
   const x=a.x+vx*k,z=a.z+vz*k,dd=Math.hypot(p.x-x,p.z-z),s=acc+Math.sqrt(l2)*k;
   if(!best||dd<best.d)best={x,z,d:dd,s,i};acc+=Math.sqrt(l2);}
  return best;
 }
 function slicePoly(pts,a,b){
  const L=pathLength(pts);a=Math.max(0,Math.min(L,a));b=Math.max(0,Math.min(L,b));if(b<a){const t=a;a=b;b=t;}
  const out=[pointAlong(pts,a,false)];let acc=0;
  for(let i=1;i<pts.length;i++){acc+=dist(pts[i-1],pts[i]);if(acc>a+0.02&&acc<b-0.02)out.push({x:pts[i].x,z:pts[i].z});}
  const end=pointAlong(pts,b,false);if(dist(out[out.length-1],end)>0.02)out.push({x:end.x,z:end.z});return out;
 }
 function buildNetwork(){
  const S=N.streets,ave=[S.avenueWest,S.avenue,S.avenueEast],mains=[S.main,S.mainSouth];
  const xMin=Math.min(...ave.map(r=>r[0])),xMax=Math.max(...ave.map(r=>r[1])),zc=(S.avenue[2]+S.avenue[3])/2,offA=3.2,inset=8;
  const xW=xMin+inset,xE=xMax-inset,ebZ=zc-offA,wbZ=zc+offA,xc=(S.main[0]+S.main[1])/2,offM=2.2,nbX=xc+offM,sbX=xc-offM;
  const zSouth=Math.min(...mains.map(r=>r[2]))+inset,road=S.road,passage=S.passage,zRoad=(road[2]+road[3])/2,xPass=(passage[0]+passage[1])/2;
  const padZone=N.taxiZones.find(z=>z.id==='passage'),padZ=padZone?padZone.position[1]:(passage[2]+passage[3])/2;
  const P={wEb:{x:xW,z:ebZ},jEb:{x:sbX,z:ebZ},jNb:{x:nbX,z:ebZ},eEb:{x:xE,z:ebZ},eWb:{x:xE,z:wbZ},jWbN:{x:nbX,z:wbZ},jWb:{x:sbX,z:wbZ},wWb:{x:xW,z:wbZ},
   sbRoad:{x:sbX,z:zRoad},sSb:{x:sbX,z:zSouth},sNb:{x:nbX,z:zSouth},nbRoad:{x:nbX,z:zRoad},roadMouth:{x:road[1],z:zRoad},roadWest:{x:xPass,z:zRoad},pad:{x:xPass,z:padZ}};
  const edges=[
   {id:'eb-w',a:'wEb',b:'jEb',pts:line(P.wEb,P.jEb)},{id:'eb-j',a:'jEb',b:'jNb',pts:line(P.jEb,P.jNb)},{id:'eb-e',a:'jNb',b:'eEb',pts:line(P.jNb,P.eEb)},
   {id:'uturn-e',a:'eEb',b:'eWb',pts:arc(xE,zc,offA,-Math.PI/2,Math.PI/2,8)},
   {id:'wb-e',a:'eWb',b:'jWbN',pts:line(P.eWb,P.jWbN)},{id:'wb-j',a:'jWbN',b:'jWb',pts:line(P.jWbN,P.jWb)},{id:'wb-w',a:'jWb',b:'wWb',pts:line(P.jWb,P.wWb)},
   {id:'uturn-w',a:'wWb',b:'wEb',pts:arc(xW,zc,offA,Math.PI/2,Math.PI*3/2,8)},
   {id:'sb-n',a:'jEb',b:'sbRoad',pts:line(P.jEb,P.sbRoad)},{id:'sb-s',a:'sbRoad',b:'sSb',pts:line(P.sbRoad,P.sSb)},
   {id:'uturn-s',a:'sSb',b:'sNb',pts:arc(xc,zSouth,offM,Math.PI,Math.PI*2,6)},
   {id:'nb-s',a:'sNb',b:'nbRoad',pts:line(P.sNb,P.nbRoad)},{id:'nb-n',a:'nbRoad',b:'jNb',pts:line(P.nbRoad,P.jNb)},
   {id:'to-road',a:'sbRoad',b:'roadMouth',pts:line(P.sbRoad,P.roadMouth)},{id:'road',a:'roadMouth',b:'roadWest',pts:line(P.roadMouth,P.roadWest)},
   {id:'passage',a:'roadWest',b:'pad',pts:line(P.roadWest,P.pad)},
   {id:'passage-back',a:'pad',b:'roadWest',pts:line(P.pad,P.roadWest)},{id:'road-back',a:'roadWest',b:'roadMouth',pts:line(P.roadWest,P.roadMouth)},
   {id:'from-road',a:'roadMouth',b:'nbRoad',pts:line(P.roadMouth,P.nbRoad)},
   {id:'wb-to-sb',a:'jWb',b:'jEb',pts:line(P.jWb,P.jEb)},{id:'nb-to-wb',a:'jNb',b:'jWbN',pts:line(P.jNb,P.jWbN)}
  ];
  const by=Object.fromEntries(edges.map(e=>[e.id,e]));
  const loop=[];
  for(const id of ['eb-w','sb-n','sb-s','uturn-s','nb-s','nb-n','eb-e','uturn-e','wb-e','wb-j','wb-w','uturn-w']){
   const pts=by[id].pts;for(let i=loop.length?1:0;i<pts.length;i++)loop.push(pts[i]);}
  return {nodes:P,edges,loop,drive:DRIVE};
 }
 let NET=null;
 const network=()=>NET||(NET=buildNetwork());

 function snap(net,p){
  let best=null;
  for(const e of net.edges){const hit=projectPath(e.pts,p);if(!hit)continue;const len=pathLength(e.pts);
   if(!best||hit.d<best.d)best={edge:e,x:hit.x,z:hit.z,d:hit.d,s:hit.s,len,along:hit.s};}
  return best;
 }
 function routeTo(net,from,B){
  const A=snap(net,from);if(!A||!B)return [{x:from.x,z:from.z},{x:B?.x??from.x,z:B?.z??from.z}];
  if(A.edge===B.edge&&B.along+0.05>=A.along)return slicePoly(A.edge.pts,A.along,B.along);
  const adj={};
  const add=(u,v,cost,poly)=>{(adj[u]||(adj[u]=[])).push({v,cost,poly});};
  for(const e of net.edges)add(e.a,e.b,pathLength(e.pts),e.pts);
  add(B.edge.a,'END',B.along,slicePoly(B.edge.pts,0,B.along));
  const startNext=[{v:A.edge.b,cost:Math.max(0,A.len-A.along),poly:slicePoly(A.edge.pts,A.along,A.len)}];
  const next=u=>u==='START'?startNext:(adj[u]||[]);
  const best={START:0},prev={},unvis=new Set(['START','END',...Object.keys(net.nodes)]);
  while(unvis.size){let u=null,bd=Infinity;for(const k of unvis){const d=best[k];if(d!==undefined&&d<bd){bd=d;u=k;}}
   if(u==null)break;unvis.delete(u);if(u==='END')break;
   for(const hop of next(u)){const nd=bd+hop.cost;if(nd<(best[hop.v]??Infinity)){best[hop.v]=nd;prev[hop.v]={u,poly:hop.poly};}}}
  if(best.END===undefined)return [{x:from.x,z:from.z},{x:B.x,z:B.z}];
  const polys=[];let cur='END';
  while(cur!=='START'){const p=prev[cur];if(!p)return [{x:from.x,z:from.z},{x:B.x,z:B.z}];polys.push(p.poly);cur=p.u;}
  polys.reverse();const out=[];
  for(const poly of polys)for(const q of poly)if(!out.length||dist(out[out.length-1],q)>0.05)out.push({x:q.x,z:q.z});
  if(out.length<2)out.push({x:B.x,z:B.z});
  return out;
 }
 // A stop painted in the middle of a road is equally close to both lanes. Drive to whichever lane is the shorter trip.
 function route(net,from,to){
  const snaps=[];
  for(const e of net.edges){const hit=projectPath(e.pts,to);if(!hit)continue;snaps.push({edge:e,x:hit.x,z:hit.z,d:hit.d,s:hit.s,along:hit.s,len:pathLength(e.pts)});}
  if(!snaps.length)return [{x:from.x,z:from.z},{x:to.x,z:to.z}];
  snaps.sort((a,b)=>a.d-b.d);const limit=snaps[0].d+4;let best=null,cost=Infinity;
  for(const B of snaps){if(B.d>limit)break;const path=routeTo(net,from,B),len=pathLength(path);if(len<cost){cost=len;best=path;}}
  return best;
 }
 function rewind(snapHit,metres){const back=Math.max(0,snapHit.along-metres),p=pointAlong(snapHit.edge.pts,back,false);return {...snapHit,x:p.x,z:p.z,along:back,s:back};}

 function targetSpeed(taxi,obstacles){
  const yaw=taxi.yaw||0,fx=Math.sin(yaw),fz=Math.cos(yaw);let cap=taxi.cruise??SPEC.cruise;
  for(const o of obstacles||[]){const dx=o.x-taxi.x,dz=o.z-taxi.z,along=dx*fx+dz*fz,lateral=Math.abs(dx*fz-dz*fx),r=o.r??SPEC.playerR;
   if(along<=0||lateral>SPEC.width/2+r+SPEC.look)continue;
   const clear=along-SPEC.nose-r-SPEC.gap;
   if(clear<=0)cap=0;else cap=Math.min(cap,Math.sqrt(2*SPEC.brake*clear));}
  return cap;
 }
 function blockedAhead(x,z,yaw,obstacles){
  const fx=Math.sin(yaw),fz=Math.cos(yaw);
  for(const o of obstacles||[]){const dx=o.x-x,dz=o.z-z,along=dx*fx+dz*fz,lateral=Math.abs(dx*fz-dz*fx),r=o.r??SPEC.playerR;
   if(along>0&&lateral<=SPEC.width/2+r+0.05&&along<SPEC.nose+r+0.25)return true;}
  return false;
 }
 function follow(taxi,dt,obstacles){
  dt=Math.max(0,Math.min(.1,dt||0));
  if(taxi.phase==='waiting'||taxi.phase==='arrived'){taxi.speed=0;if(taxi.phase==='waiting')taxi.wait=(taxi.wait||0)+dt;taxi.blockedFor=0;return taxi;}
  const cap=targetSpeed(taxi,obstacles),rate=cap<taxi.speed-0.01?SPEC.brake:SPEC.accel;
  taxi.speed=Math.max(0,taxi.speed+Math.sign(cap-taxi.speed)*Math.min(Math.abs(cap-taxi.speed),rate*dt));
  if(taxi.speed<0.05)taxi.speed=0;
  const end=taxi.pathLen||pathLength(taxi.path||[]);
  let ns=(taxi.s||0)+taxi.speed*dt;if(!taxi.loop)ns=Math.min(end,ns);
  const p=pointAlong(taxi.path,ns,!!taxi.loop);
  if(taxi.speed>0&&blockedAhead(p.x,p.z,p.yaw,obstacles)){taxi.speed=0;taxi.blockedFor=(taxi.blockedFor||0)+dt;return taxi;}
  taxi.s=taxi.loop?((ns%end)+end)%end:ns;taxi.x=p.x;taxi.z=p.z;taxi.yaw=p.yaw;
  taxi.blockedFor=cap===0&&taxi.speed===0?(taxi.blockedFor||0)+dt:0;
  if(!taxi.loop&&end-taxi.s<=0.35)taxi.speed=0;
  return taxi;
 }
 function blockedByPlayer(taxi,player){
  if(!player)return false;const fx=Math.sin(taxi.yaw||0),fz=Math.cos(taxi.yaw||0),dx=player.x-taxi.x,dz=player.z-taxi.z,along=dx*fx+dz*fz,lateral=Math.abs(dx*fz-dz*fx);
  return along>0&&along<SPEC.nose+SPEC.playerR+SPEC.gap+3&&lateral<SPEC.width/2+SPEC.playerR+SPEC.look;
 }
 function assignPath(taxi,pts,phase){
  const path=pts&&pts.length?pts.slice():[{x:taxi.x,z:taxi.z}];
  if(dist(path[0],taxi)>0.4)path.unshift({x:taxi.x,z:taxi.z});
  if(path.length<2)path.push({x:taxi.x+Math.sin(taxi.yaw||0)*0.2,z:taxi.z+Math.cos(taxi.yaw||0)*0.2});
  taxi.path=path;taxi.pathLen=pathLength(path);taxi.s=0;taxi.loop=false;taxi.phase=phase;taxi.blockedFor=0;
 }
 function enterCruise(world,taxi,s){
  const loop=world.net.loop,L=pathLength(loop),at=pointAlong(loop,s||0,true);
  taxi.phase='cruise';taxi.loop=true;taxi.path=loop;taxi.pathLen=L;taxi.s=at.s;taxi.x=at.x;taxi.z=at.z;taxi.yaw=at.yaw;taxi.speed=SPEC.cruise;taxi.wait=0;taxi.blockedFor=0;
 }
 function createTraffic(count,seed){
  const net=network(),L=pathLength(net.loop),n=Math.max(1,count|0),taxis=[];
  for(let i=0;i<n;i++){const s=(i+0.2)*L/n,at=pointAlong(net.loop,s,true);
   taxis.push({id:'cab-'+(i+1),x:at.x,z:at.z,yaw:at.yaw,speed:SPEC.cruise,s,phase:'cruise',loop:true,path:net.loop,pathLen:L,wait:0,blockedFor:0});}
  return {net,taxis,job:null,seed:seed||1};
 }
 function release(world,cab){
  if(world.job&&world.job.cab===cab)world.job.released=true;
  const back=projectPath(world.net.loop,cab);
  if(back.d>4)assignPath(cab,route(world.net,cab,{x:back.x,z:back.z}),'rejoin');
  else enterCruise(world,cab,back.s);
 }
 function stepWorld(world,dt,player){
  dt=Math.max(0,Math.min(.1,dt||0));const riding=!!player?.riding;
  for(const t of world.taxis){const obs=[];if(player&&!riding)obs.push({x:player.x,z:player.z,r:SPEC.playerR});
   for(const o of world.taxis)if(o!==t)obs.push({x:o.x,z:o.z,r:SPEC.taxiR});follow(t,dt,obs);}
  for(const t of world.taxis)if(t.phase==='rejoin'&&t.pathLen-t.s<=0.45){const back=projectPath(world.net.loop,t);enterCruise(world,t,back.s);}
  const job=world.job;if(!job||job.released)return world;const cab=job.cab;
  if(cab.phase==='to-pickup'){const remain=cab.pathLen-cab.s,playerBlock=player&&!riding&&blockedByPlayer(cab,player);
   if(remain<=0.45||(playerBlock&&cab.blockedFor>0.35)){cab.phase='waiting';cab.speed=0;cab.wait=0;job.phase='waiting';}}
  else if(cab.phase==='waiting'){if(cab.wait>=SPEC.hold)release(world,cab);}
  else if(cab.phase==='to-dest'&&cab.pathLen-cab.s<=0.45){cab.phase='arrived';cab.speed=0;job.phase='arrived';}
  return world;
 }
 function hail(world,s,player,destId,ctx){
  const c=Object.assign({onFoot:true,area:'street',player:[player.x,player.z]},ctx||{});
  if(world.job&&!world.job.released)c.trip=true;
  const a=availability(s,c);if(!a.ok)return {ok:false,reason:a.reason};
  const dest=destinations(s,c).find(d=>d.id===destId);
  if(!dest)return {ok:false,reason:'That stop is not on the street network.'};
  if(!dest.ok)return {ok:false,reason:dest.reason};
  let pick=snap(world.net,player);if(!pick||pick.d>50)return {ok:false,reason:'No road close enough for a pickup.'};
  if(pick.d<2.2)pick=rewind(pick,6);
  let best=null,bd=Infinity,bestPath=null;
  for(const t of world.taxis){if(t.phase!=='cruise')continue;const path=route(world.net,t,{x:pick.x,z:pick.z}),len=pathLength(path);if(len<bd){bd=len;best=t;bestPath=path;}}
  if(!best)return {ok:false,reason:'No taxi is free.'};
  assignPath(best,bestPath,'to-pickup');
  world.job={cab:best,dest,fare:dest.fare,phase:'to-pickup',charged:false,released:false,pickup:{x:pick.x,z:pick.z}};
  return {ok:true,fare:dest.fare,taxi:best.id,pickup:world.job.pickup};
 }
 function board(world,s){
  const job=world.job;if(!job||job.released||job.cab.phase!=='waiting')return {ok:false,reason:'The taxi is not waiting.'};
  const paid=charge(s,job.dest.id,job.fare);if(!paid)return {ok:false,reason:'Not enough credits.'};
  job.charged=true;
  assignPath(job.cab,route(world.net,job.cab,{x:job.dest.position[0],z:job.dest.position[1]}),'to-dest');job.phase='to-dest';
  return {ok:true,paid};
 }
 function exitRide(world,s){
  const job=world.job;if(!job||job.released||job.cab.phase!=='arrived')return {ok:false,reason:'The taxi has not arrived.'};
  const doors=doorPoints(job.cab);arrive(s);release(world,job.cab);return {ok:true,doors};
 }
 function cancel(world){
  const job=world.job;if(!job||job.released||job.charged||!['to-pickup','waiting'].includes(job.cab.phase))return {ok:false,reason:'This taxi can no longer be cancelled.'};
  release(world,job.cab);return {ok:true};
 }
 function doorPoints(taxi){
  const yaw=taxi.yaw||0,fx=Math.sin(yaw),fz=Math.cos(yaw),rx=fz,rz=-fx;
  return [{x:taxi.x+rx*1.8,z:taxi.z+rz*1.8},{x:taxi.x-rx*1.8,z:taxi.z-rz*1.8},{x:taxi.x-fx*2.8,z:taxi.z-fz*2.8}];
 }
 function seatPoint(taxi){
  const yaw=taxi.yaw||0,fx=Math.sin(yaw),fz=Math.cos(yaw),rx=fz,rz=-fx;
  return {x:taxi.x+rx*0.42+fx*0.35,y:1.08,z:taxi.z+rz*0.42+fz*0.35,yaw};
 }
 function onRoad(x,z,margin){
  const m=margin||0,S=N.streets;
  return DRIVE.some(id=>{const r=S[id];return r&&x>=r[0]-m&&x<=r[1]+m&&z>=r[2]-m&&z<=r[3]+m;});
 }

 const api={REGISTRY,FLAG,SPEC,DRIVE,stops,availability,destinations,cost,charge,arrive,recover,network,route,pathLength,pointAlong,projectPath,targetSpeed,follow,createTraffic,stepWorld,hail,board,exitRide,cancel,doorPoints,seatPoint,onRoad,snap};
 if(node)module.exports=api;else root.VoidRoadTaxiRules=api;
})(typeof globalThis!=='undefined'?globalThis:this);
