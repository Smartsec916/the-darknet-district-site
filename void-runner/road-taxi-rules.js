/* Street taxis in NeoChinatown. Pure rules: no rendering, no clock, no network.
   Since the quarters (16 Nov 2026; ncz-quarters.js) these are the ONLY taxis: the sky cabs are gone. A cab drives the roads of the quarter it is in. A trip to
   another quarter, to the Corporate District or to the Zen Zephyr Temple goes THROUGH the checkpoints: the cab drives into a gate's vehicle bay, the gate
   exchanges one quarter for the next around it (ncz-gate-transit.js), and it drives on.
   Destinations: the kerbside stops and the two far places in ncz-quarters.js (STOPS, FAR) are the only list. Do not invent places.
   Fares: 12 CR plus 0.05 CR a metre, 60 CR at most; the Corporate District and the Temple are 60 CR with the ride back included. The charge is recorded in
   story.flags.roadTaxiTrip until the trip ends, and a reload refunds it once. */
(function(root){
 'use strict';
 const node=typeof module!=='undefined';
 const Q=node?require('./ncz-quarters.js'):root.VoidQuarters;
 const fare={base:12,perMetre:.05,max:60};
 const REGISTRY=Q.STOPS.map(s=>s.id);
 const FLAG='roadTaxiTrip';
 // Free rides on the owner's developer account only (the owner, 18 Nov 2026: "for now ... just for my dev account", to get around while testing). VoidDevTools.authorized is set only after the server accepts the developer request; everyone else pays as before.
 const free=()=>typeof VoidDevTools!=='undefined'&&VoidDevTools?.authorized===true;   // dev-tools.js declares VoidDevTools as a top-level const (not on window)
 const SPEC={length:4.4,width:1.9,nose:2.2,cruise:8,accel:7,brake:16,gap:2.6,look:0.45,hold:120,playerR:0.5,taxiR:2.3};
 const DRIVE=['avenue','main','road','passage','southGate','farSouth'];
 const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);

 function stops(quarter){return Q.STOPS.filter(s=>!quarter||s.quarter===quarter).map(s=>({id:s.id,label:s.name,position:[s.position[0],s.position[1]],quarter:s.quarter}));}
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
 const cost=(from,to)=>free()?0:Math.min(fare.max,Math.round(fare.base+fare.perMetre*Math.hypot(from[0]-to[0],from[1]-to[1])));
 const gateNames=legs=>legs.map(l=>Q.gate(l.gate).name).join(', then ');
 // Every place a cab goes from here: the stops of all three quarters and the two places beyond the gates. ctx: {player:[x,z], quarter}.
 function destinations(s,ctx){
  const player=ctx&&ctx.player;if(!player)return [];const quarter=Q.valid(ctx.quarter)||Q.quarterAt(player[0],player[1])||null;
  const row=(d,price,legs,here)=>{if(here)return {...d,fare:price,legs,ok:false,reason:'Already there.'};if(!legs)return {...d,fare:price,legs:null,ok:false,reason:'No road from here.'};
   const afford=!s||s.credits>=price,via=legs.length?'Through '+gateNames(legs)+'.':null;return {...d,fare:price,legs,via,ok:!!afford,reason:afford?null:'Not enough credits ('+price+' CR).'};};
  return [...stops().map(d=>row(d,cost(player,d.position),quarter?Q.gatesBetween(quarter,d.quarter):null,d.quarter===quarter&&Math.hypot(player[0]-d.position[0],player[1]-d.position[1])<18)),
   ...Q.FAR.map(f=>row({id:f.id,label:f.name,scene:f.scene,far:true,blurb:'The ride back is included.'},free()?0:f.fare,quarter?Q.gatesBetween(quarter,f.id):null,false))];
 }
 function charge(s,dest,price){if(!s?.story?.flags||s.story.flags[FLAG])return 0;if(free()){s.story.flags[FLAG]=dest+':0';return true;}if(s.credits<price)return 0;s.credits-=price;s.story.flags[FLAG]=dest+':'+price;return price;}
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
/* The lanes of one quarter. Nodes are named points; an edge runs one way from a to b. Edges that START in a gate's bay are listed before the ones that end
    there, so a cab standing in a bay is taken to be on its way out. bays: lane key -> the point a cab stops at. rank: where a quarter with no through road
    keeps its cab. loop: the circuit the ambient cabs drive. */
 function buildNetwork(quarter){
  const q=Q.valid(quarter)||'oldtown',bay=key=>{const l=Q.lane(key);return {x:l.mid[0],z:l.mid[1]};},poly=(...pts)=>{const out=[];pts.forEach((p,i)=>{if(i){const seg=line(pts[i-1],p);for(let k=out.length?1:0;k<seg.length;k++)out.push(seg[k]);}});return out;};
  let P,edges,loopIds=[],rank=null;const bays={};
  if(q==='outskirts')return {quarter:q,nodes:{},edges:[],loop:[],bays,rank:null,drive:DRIVE,none:true};   // no road and no taxi beyond the Far South Gate (walkers only)
  if(q==='port'){const b=bay('customs:bay'),x=b.x,top={x,z:-95.5};bays['customs:bay']=b;P={bay:b,top};rank={x,z:-95.5,yaw:Math.PI};
   edges=[{id:'from-customs',a:'bay',b:'top',pts:line(b,top)},{id:'to-customs',a:'top',b:'bay',pts:line(top,b)}];}
  else if(q==='oldtown'){const xc=61,off=2.2,sbX=xc-off,nbX=xc+off,zTop=-31.5,zRoad=-118.5,zSouth=-119.6,c=bay('customs:bay'),bn=bay('north:bay-n'),bs=bay('north:bay-s'),sn=bay('south:bay-n'),ss=bay('south:bay-s');
   Object.assign(bays,{'customs:bay':c,'north:bay-n':bn,'north:bay-s':bs,'south:bay-n':sn,'south:bay-s':ss});
   P={tSb:{x:sbX,z:zTop},tNb:{x:nbX,z:zTop},sbRoad:{x:sbX,z:zRoad},sSb:{x:sbX,z:zSouth},sNb:{x:nbX,z:zSouth},nbRoad:{x:nbX,z:zRoad},roadMouth:{x:51,z:zRoad},roadWest:{x:c.x,z:zRoad},customs:c,bayN:bn,bayS:bs,bayN5:sn,bayS5:ss};
   edges=[{id:'from-north',a:'bayS',b:'tSb',pts:line(bs,P.tSb)},{id:'from-south',a:'bayN5',b:'sNb',pts:line(sn,P.sNb)},{id:'from-customs',a:'customs',b:'roadWest',pts:line(c,P.roadWest)},
    {id:'sb',a:'tSb',b:'sbRoad',pts:line(P.tSb,P.sbRoad)},{id:'sb-s',a:'sbRoad',b:'sSb',pts:line(P.sbRoad,P.sSb)},{id:'uturn-s',a:'sSb',b:'sNb',pts:arc(xc,zSouth,off,Math.PI,Math.PI*2,6)},
    {id:'nb-s',a:'sNb',b:'nbRoad',pts:line(P.sNb,P.nbRoad)},{id:'nb',a:'nbRoad',b:'tNb',pts:line(P.nbRoad,P.tNb)},{id:'uturn-n',a:'tNb',b:'tSb',pts:arc(xc,zTop,off,0,Math.PI,6)},
    {id:'to-road',a:'sbRoad',b:'roadMouth',pts:line(P.sbRoad,P.roadMouth)},{id:'road',a:'roadMouth',b:'roadWest',pts:line(P.roadMouth,P.roadWest)},{id:'road-back',a:'roadWest',b:'roadMouth',pts:line(P.roadWest,P.roadMouth)},{id:'from-road',a:'roadMouth',b:'nbRoad',pts:line(P.roadMouth,P.nbRoad)},
    {id:'to-customs',a:'roadWest',b:'customs',pts:line(P.roadWest,c)},{id:'to-north',a:'tNb',b:'bayN',pts:line(P.tNb,bn)},{id:'to-south',a:'sSb',b:'bayS5',pts:line(P.sSb,ss)}];   // the South Gate (A5, z -130..-124) opened on 16 Nov 2026: Main Street goes on into Far South
   loopIds=['sb','sb-s','uturn-s','nb-s','nb','uturn-n'];}
  else if(q==='far-south'){const xc=61,off=2.2,sbX=xc-off,nbX=xc+off,zTop=-134,zEnd=-212,ss=bay('south:bay-s'),sn=bay('south:bay-n');   // Main Street's second stretch: the South Gate at its north end, the (shut) Far South Gate beyond zEnd
   Object.assign(bays,{'south:bay-s':ss,'south:bay-n':sn});
   P={tSb:{x:sbX,z:zTop},tNb:{x:nbX,z:zTop},sSb:{x:sbX,z:zEnd},sNb:{x:nbX,z:zEnd},bayS:ss,bayN:sn};
   edges=[{id:'from-gate',a:'bayS',b:'tSb',pts:line(ss,P.tSb)},{id:'sb',a:'tSb',b:'sSb',pts:line(P.tSb,P.sSb)},{id:'uturn-s',a:'sSb',b:'sNb',pts:arc(xc,zEnd,off,Math.PI,Math.PI*2,6)},{id:'nb',a:'sNb',b:'tNb',pts:line(P.sNb,P.tNb)},
    {id:'uturn-n',a:'tNb',b:'tSb',pts:arc(xc,zTop,off,0,Math.PI,6)},{id:'to-gate',a:'tNb',b:'bayN',pts:line(P.tNb,sn)}];
   loopIds=['sb','uturn-s','nb','uturn-n'];}
  else{const zc=-12.5,off=3.2,ebZ=zc-off,wbZ=zc+off,xW=17,xE=137,bn=bay('north:bay-n'),bs=bay('north:bay-s'),bf=bay('function:bay'),be=bay('east:bay');
   Object.assign(bays,{'north:bay-n':bn,'north:bay-s':bs,'function:bay':bf,'east:bay':be});
   P={wEb:{x:xW,z:ebZ},jS:{x:bs.x,z:ebZ},jN:{x:bn.x,z:ebZ},eEb:{x:xE,z:ebZ},eWb:{x:xE,z:wbZ},jNw:{x:bn.x,z:wbZ},wWb:{x:xW,z:wbZ},bayN:bn,bayS:bs,bayF:bf,bayE:be};
   edges=[{id:'from-south',a:'bayN',b:'jN',pts:line(bn,P.jN)},{id:'from-function',a:'bayF',b:'wEb',pts:poly(bf,{x:11.5,z:bf.z},{x:14.6,z:ebZ},P.wEb)},{id:'from-east',a:'bayE',b:'eWb',pts:poly(be,{x:142.5,z:be.z},{x:139.4,z:wbZ},P.eWb)},
    {id:'eb-w',a:'wEb',b:'jS',pts:line(P.wEb,P.jS)},{id:'eb-j',a:'jS',b:'jN',pts:line(P.jS,P.jN)},{id:'eb-e',a:'jN',b:'eEb',pts:line(P.jN,P.eEb)},{id:'uturn-e',a:'eEb',b:'eWb',pts:arc(xE,zc,off,-Math.PI/2,Math.PI/2,8)},
    {id:'wb-e',a:'eWb',b:'jNw',pts:line(P.eWb,P.jNw)},{id:'wb-w',a:'jNw',b:'wWb',pts:line(P.jNw,P.wWb)},{id:'uturn-w',a:'wWb',b:'wEb',pts:arc(xW,zc,off,Math.PI/2,Math.PI*3/2,8)},
    {id:'nb-to-wb',a:'jN',b:'jNw',pts:line(P.jN,P.jNw)},
    {id:'to-south',a:'jS',b:'bayS',pts:line(P.jS,bs)},{id:'to-function',a:'wWb',b:'bayF',pts:line(P.wWb,bf)},{id:'to-east',a:'eEb',b:'bayE',pts:line(P.eEb,be)}];
   loopIds=['eb-w','eb-j','eb-e','uturn-e','wb-e','wb-w','uturn-w'];}
  const by=Object.fromEntries(edges.map(e=>[e.id,e])),loop=[];
  for(const id of loopIds){const pts=by[id].pts;for(let i=loop.length?1:0;i<pts.length;i++)loop.push(pts[i]);}
  return {quarter:q,nodes:P,edges,loop,bays,rank,drive:DRIVE};
 }
 const NETS={};
 const network=quarter=>{const q=Q.valid(quarter)||'oldtown';return NETS[q]||(NETS[q]=buildNetwork(q));};

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
  if(taxi.phase==='waiting'||taxi.phase==='arrived'||taxi.phase==='parked'||taxi.phase==='in-bay'){taxi.speed=0;if(taxi.phase==='waiting')taxi.wait=(taxi.wait||0)+dt;taxi.blockedFor=0;return taxi;}
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
 const park=(world,t)=>{const r=world.net.rank;Object.assign(t,{x:r.x,z:r.z,yaw:r.yaw,speed:0,s:0,phase:'parked',loop:false,path:[{x:r.x,z:r.z},{x:r.x+Math.sin(r.yaw)*.2,z:r.z+Math.cos(r.yaw)*.2}],pathLen:.2,wait:0,blockedFor:0});};
 // The cabs of one quarter. A quarter with a circuit has `count` cabs driving it; one without (the Port) keeps a single cab at its rank.
 function createTraffic(count,seed,quarter){
  const net=network(quarter),taxis=[],world={net,quarter:net.quarter,taxis,job:null,seed:seed||1};
  if(net.none)return world;
  if(!net.loop.length){const t={id:'cab-1'};park(world,t);taxis.push(t);return world;}
  const L=pathLength(net.loop),n=Math.max(1,count|0);
  for(let i=0;i<n;i++){const s=(i+0.2)*L/n,at=pointAlong(net.loop,s,true);
   taxis.push({id:'cab-'+(i+1),x:at.x,z:at.z,yaw:at.yaw,speed:SPEC.cruise,s,phase:'cruise',loop:true,path:net.loop,pathLen:L,wait:0,blockedFor:0});}
  return world;
 }
 function release(world,cab){
  if(world.job&&world.job.cab===cab)world.job.released=true;
  if(!world.net.loop.length){const r=world.net.rank;if(dist(cab,r)<.6)park(world,cab);else assignPath(cab,route(world.net,cab,r),'rejoin');return;}
  const back=projectPath(world.net.loop,cab);
  if(back.d>4)assignPath(cab,route(world.net,cab,{x:back.x,z:back.z}),'rejoin');
  else enterCruise(world,cab,back.s);
 }
 /* Crosswalks (crosswalks.js, 20 Nov 2026): a cab slows and stops short of a crossing ahead with somebody on it: the player on foot, or anyone in `peds` ({x, z}: the street's
    walkers and mission characters, crosswalks.js peds()). */
 const XW=()=>node?require('./crosswalks.js'):root.VoidCrosswalks;
 function stepWorld(world,dt,player,peds){
  dt=Math.max(0,Math.min(.1,dt||0));const riding=!!player?.riding,X=XW(),walkers=[...(player&&!riding?[{x:player.x,z:player.z}]:[]),...(peds||[])];
  for(const t of world.taxis){const obs=[];if(player&&!riding)obs.push({x:player.x,z:player.z,r:SPEC.playerR});if(X&&walkers.length&&t.phase!=='waiting')obs.push(...X.yieldTo(t,walkers,world.quarter,SPEC));
   for(const o of world.taxis)if(o!==t)obs.push({x:o.x,z:o.z,r:SPEC.taxiR});follow(t,dt,obs);}
  for(const t of world.taxis)if(t.phase==='rejoin'&&t.pathLen-t.s<=0.45){if(!world.net.loop.length)park(world,t);else{const back=projectPath(world.net.loop,t);enterCruise(world,t,back.s);}}
  const job=world.job;if(!job||job.released)return world;const cab=job.cab;
  if(cab.phase==='to-pickup'){const remain=cab.pathLen-cab.s,playerBlock=player&&!riding&&blockedByPlayer(cab,player);
   if(remain<=0.45||(playerBlock&&cab.blockedFor>0.35)){cab.phase='waiting';cab.speed=0;cab.wait=0;job.phase='waiting';}}
  else if(cab.phase==='waiting'){if(cab.wait>=SPEC.hold)release(world,cab);}
  else if(cab.phase==='to-dest'&&cab.pathLen-cab.s<=0.45){cab.speed=0;cab.phase=job.phase=job.via?'in-bay':'arrived';}
  return world;
 }
 const PICKUP_REACH=80;
 function hail(world,s,player,destId,ctx){
  const c=Object.assign({onFoot:true,area:'street',player:[player.x,player.z],quarter:world.quarter},ctx||{});
  if(world.job&&!world.job.released)c.trip=true;
  const a=availability(s,c);if(!a.ok)return {ok:false,reason:a.reason};
  const dest=destinations(s,c).find(d=>d.id===destId);
  if(!dest)return {ok:false,reason:'That stop is not on the street network.'};
  if(!dest.legs&&dest.ok)return {ok:false,reason:'No road from here.'};
  if(!dest.ok)return {ok:false,reason:dest.reason};
  // How far from a road a cab can still be called. 80 m covers the whole alley, so a cab can be called from The Darknet District's door (57 m from Main Street); it was 50,
  // which refused every call made there (found 16 Nov 2026). The cab waits on the road; `walk` tells the caller how far away that is.
  let pick=snap(world.net,player);if(!pick||pick.d>PICKUP_REACH)return {ok:false,reason:'No road close enough for a pickup.'};const walk=Math.round(pick.d);
  if(pick.d<2.2)pick=rewind(pick,6);
  let best=null,bd=Infinity,bestPath=null;
  for(const t of world.taxis){if(!['cruise','parked','rejoin'].includes(t.phase))continue;   /* a cab on its way back to the circuit or the rank is free too */const path=route(world.net,t,{x:pick.x,z:pick.z}),len=pathLength(path);if(len<bd){bd=len;best=t;bestPath=path;}}
  if(!best)return {ok:false,reason:'No taxi is free.'};
  assignPath(best,bestPath,'to-pickup');
  world.job={cab:best,dest,fare:dest.fare,legs:(dest.legs||[]).slice(),via:null,phase:'to-pickup',charged:false,released:false,pickup:{x:pick.x,z:pick.z}};
  return {ok:true,fare:dest.fare,taxi:best.id,pickup:world.job.pickup,walk};
 }
 function board(world,s){
  const job=world.job;if(!job||job.released||job.cab.phase!=='waiting')return {ok:false,reason:'The taxi is not waiting.'};
  const paid=charge(s,job.dest.id,job.fare);if(!paid)return {ok:false,reason:'Not enough credits.'};
  job.charged=true;
  drive(world,job);
  return {ok:true,paid};
 }
 // The next stretch of a paid trip: to the bay of the next gate on the way, or (none left) to the stop itself.
 function drive(world,job){
  const leg=job.legs[0];
  if(leg){const lane=Q.bayFor(leg.gate,world.quarter),p=world.net.bays[lane.key];job.via={gate:leg.gate,lane:lane.key,from:world.quarter,to:leg.to?{quarter:leg.to}:{scene:leg.scene}};
   assignPath(job.cab,route(world.net,job.cab,p),'to-dest');}
  else{job.via=null;assignPath(job.cab,route(world.net,job.cab,{x:job.dest.position[0],z:job.dest.position[1]}),'to-dest');}
  job.phase='to-dest';return job;
 }
 // What a trip carries through a gate: everything but the cab (each quarter has its own).
 function carry(job){return {dest:job.dest,fare:job.fare,legs:job.legs.slice(1),through:job.via};}
 /* The far side of a gate: the trip goes on in the quarter that has just been built. `world` is that quarter's traffic; one of its cabs becomes the trip's
    cab, standing in the same bay, pointing into the quarter. trip: from carry(), or {dest, fare:0, legs:[], through:{gate,lane}} for the included ride back. */
 function resume(world,trip){
  const lane=Q.lane(trip.through.lane),p=world.net.bays[lane.key];if(!p)return null;
  const cab=world.taxis.find(t=>t.phase==='parked')||world.taxis[world.taxis.length-1];
  Object.assign(cab,{x:p.x,z:p.z,yaw:Q.yawInto(trip.through.gate,world.quarter),speed:0,s:0,loop:false,wait:0,blockedFor:0});
  world.job={cab,dest:trip.dest,fare:trip.fare,legs:trip.legs.slice(),via:null,phase:'to-dest',charged:true,released:false,pickup:{x:p.x,z:p.z}};
  drive(world,world.job);return world.job;
 }
 // The ride back from a far place: it starts in that place's gate and ends at the stop just inside it.
 function returnTrip(farId){const f=Q.far(farId);if(!f)return null;const st=stops().find(s=>s.id===f.returnStop),lane=Q.bayFor(f.gate,f.from);return {dest:st,fare:0,legs:[],through:{gate:f.gate,lane:lane.key}};}
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
  return {x:taxi.x+rx*0.42-fx*0.35,y:1.56,z:taxi.z+rz*0.42-fz*0.35,yaw};   // the eye of a passenger on the minivan's middle row, right seat (road-taxi-van.js)
 }
 /* A companion's seat (a mission's follow / shared-cab step, npc-escort.js): beside the passenger, on the other side of the cab. y is where her figure stands (the seated clip
    puts her hips about half a metre up, so she sits low in the cab like the passenger). */
 function companionSeat(taxi){
  const yaw=taxi.yaw||0,fx=Math.sin(yaw),fz=Math.cos(yaw),rx=fz,rz=-fx;
  return {x:taxi.x-rx*0.42-fx*0.1,y:0.3,z:taxi.z-rz*0.42-fz*0.1,yaw};   // her root on the middle row's left seat: the sit clip puts the hips 0.54 m up and 0.35 m back of it; the cushion is 0.84 m up
 }
 function onRoad(x,z,margin){
  const m=margin||0,S=Q.S;
  return DRIVE.some(id=>{const r=S[id];return r&&x>=r[0]-m&&x<=r[1]+m&&z>=r[2]-m&&z<=r[3]+m;});
 }

 const api={fare,REGISTRY,FLAG,SPEC,PICKUP_REACH,DRIVE,drive,carry,resume,returnTrip,stops,availability,destinations,cost,charge,arrive,recover,network,route,pathLength,pointAlong,projectPath,targetSpeed,follow,createTraffic,stepWorld,hail,board,exitRide,cancel,doorPoints,seatPoint,companionSeat,onRoad,snap};
 if(node)module.exports=api;else root.VoidRoadTaxiRules=api;
})(typeof globalThis!=='undefined'?globalThis:this);
