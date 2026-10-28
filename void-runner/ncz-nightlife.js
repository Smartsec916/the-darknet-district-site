/* NeoChinatown nightlife: people walking the sidewalks of Main Street, the avenue and the alley by the District,
   people standing about (small groups talking, couples, window-shoppers, people leaning on walls or smoking),
   a few of them drunk (about 8%, configurable): they stagger, sway, stop to steady themselves, lean on walls, laugh,
   and now and then mutter something. Passers-by glance, step round them, sometimes laugh. Sober friends sometimes
   walk a drunk home. Some walkers leave at a street's end and others turn up later, so no loop repeats for long.
   Everyone keeps to the sidewalk lanes (no new collision, nothing blocks a door, a taxi stand or the player).
   Density adapts: figures far from you are switched off, and if the frame rate drops the furthest people are hidden
   until it recovers (config.fps).
   Crowd looks and clips: crowd.js (MakeHuman CC0; drunk clips from David's Mixamo downloads).
   Pure planning runs in Node (tests/ncz-nightlife.test.cjs); the figures run in the browser (neochinatown.js).
   DRAFT: the drunks' remarks are Claude's placeholders for David's review. */
(function(root){
 // Settings: how many people, how many drunk, how often things happen.
 const config={
  walkers:{high:44,medium:28,low:12},
  // People standing about: groups of 2-3 talking, couples, window-shoppers, people leaning or smoking on a wall.
  standers:{high:{group:7,couple:4,shop:7,lean:6},medium:{group:4,couple:3,shop:4,lean:4},low:{group:2,couple:1,shop:1,lean:1}},
  leaveShare:.5,           // share of walkers who leave at a street's end (and return elsewhere later)
  awayFor:[6,25],
  drunkShare:.08,          // share of walkers who are drunk (nightlife lanes only)
  groupShare:.2,           // share who walk in a pair
  helpedShare:.5,          // share of drunks walking with a sober friend
  speed:[1.05,1.45],drunkSpeed:[.45,.7],
  stopEvery:[9,18],drunkStopEvery:[6,12],stopFor:[2.5,6],leanFor:[6,11],
  reactRadius:2.6,reactCooldown:10,remarkRadius:5,remarkCooldown:28,
  activeRadius:140,        // beyond this from you, walkers pause (cheap)
  showRadius:90,           // beyond this from the camera, figures are switched off entirely
  fps:{low:45,high:56,step:4,every:2},  // frame-rate governor: hide the furthest people below low, restore above high
  spacing:1.1};            // how close two people get before one steps round
 // Sidewalk lanes (NeoChinatown coordinates): a line to walk, the wall side (for leaning) and how lively it is.
 // Nightlife lanes may hold drunks; the avenue's quieter east end has fewer people.
 const lanes=[
  {id:'main-west',a:[52.6,-121],b:[52.6,-22],wall:[-1,0],half:1,nightlife:true,weight:3},
  {id:'main-east',a:[69.4,-121],b:[69.4,-22],wall:[1,0],half:1,nightlife:true,weight:3,noLean:[[-62.5,-54.5]]},
  {id:'alley',a:[73,-59.3],b:[117,-59.3],wall:[0,1],half:.6,nightlife:true,weight:2,noLean:[[0,999]]},
  {id:'avenue-north',a:[6,-6.6],b:[148,-6.6],wall:[0,1],half:1,nightlife:false,weight:2},
  {id:'avenue-south',a:[6,-18.4],b:[148,-18.4],wall:[0,-1],half:1,nightlife:true,weight:2,noLean:[[49,73]]}];
 // Spots no one stops or leans at: doors, the taxi zones' kerbs, the static crew.
 const keepClear=[[126.9,-61.9,3],[61,-100,4],[40,-12.5,4],[61,-66,4],[52.6,-40,1.5],[69.4,-78,1.5],[52.6,-100,1.5],[34,-6.6,1.5],[98,-18.4,1.5]];
 // The street's standing crew (neochinatown.js): walkers step round them.
 const standing=[[52.6,-40],[69.4,-78],[52.6,-100],[34,-6.6],[98,-18.4]];
 const remarks=['Whoa. The pavement\'s moving again.','Have you seen my taxi? It was right… somewhere.','Love this city. Love it. Hate it. Love it.','One more noodle bar. Then home. Probably.','Is it Tuesday? Feels like a Tuesday.','I\'m fine. I\'m great. I\'m sitting down.'];
 const len=l=>Math.hypot(l.b[0]-l.a[0],l.b[1]-l.a[1]);
 // A point along a lane at distance t, pushed sideways by `side` metres (positive = toward the wall).
 function at(l,t,side=0){const L=len(l),k=Math.max(0,Math.min(1,t/L)),x=l.a[0]+(l.b[0]-l.a[0])*k,z=l.a[1]+(l.b[1]-l.a[1])*k;return [x+l.wall[0]*side,z+l.wall[1]*side];}
 const along=(l,p)=>{const L=len(l),ux=(l.b[0]-l.a[0])/L,uz=(l.b[1]-l.a[1])/L;return (p[0]-l.a[0])*ux+(p[1]-l.a[1])*uz;};
 const clearAt=p=>!keepClear.some(([x,z,r])=>Math.hypot(p[0]-x,p[1]-z)<r);
 const canLean=(l,t)=>{const p=at(l,t);const s=l.id.startsWith('main')?p[1]:p[0];return clearAt(p)&&!(l.noLean||[]).some(([a,b])=>s>a&&s<b);};
 // Who walks where: lanes weighted by liveliness, drunks only on nightlife lanes, some pairs.
 function plan(quality='medium',rnd=Math.random,cfg=config){
  const n=cfg.walkers[quality]??cfg.walkers.medium,people=[];if(!n)return people;
  const total=lanes.reduce((s,l)=>s+l.weight,0),drunks=Math.max(n>=8?1:0,Math.round(n*cfg.drunkShare));
  const pickLane=(night)=>{const pool=lanes.filter(l=>!night||l.nightlife),w=pool.reduce((s,l)=>s+l.weight,0);let r=rnd()*w;for(const l of pool){r-=l.weight;if(r<=0)return l;}return pool[0];};
  let drunkPlaced=0;for(let i=0;i<n;i++){const drunk=drunkPlaced<drunks;if(drunk)drunkPlaced++;const l=pickLane(drunk),L=len(l),dir=rnd()<.5?1:-1,t=4+rnd()*(L-8);
   const p={id:'night-'+i,lane:l.id,t,dir,side:(rnd()-.5)*.8,drunk,speed:drunk?cfg.drunkSpeed[0]+rnd()*(cfg.drunkSpeed[1]-cfg.drunkSpeed[0]):cfg.speed[0]+rnd()*(cfg.speed[1]-cfg.speed[0])};people.push(p);
   // A sober friend helps some drunks along; some sober people walk in pairs.
   if(drunk&&rnd()<cfg.helpedShare&&i+1<n){people.push({...p,id:'night-'+(++i),drunk:false,friendOf:p.id,side:p.side-.7});}
   else if(!drunk&&rnd()<cfg.groupShare&&i+1<n){people.push({...p,id:'night-'+(++i),side:p.side+.75,speed:p.speed,pairOf:p.id});}}
  void total;
  // People standing about, on clear stretches of sidewalk (never at doors, taxi stands or the static crew).
  const counts=cfg.standers[quality]??cfg.standers.medium;let k=0;
  const spot=(wallSide)=>{for(let tries=0;tries<40;tries++){const l=pickLane(false),L=len(l),t=5+rnd()*(L-10),side=wallSide?l.half-.25:(rnd()-.5)*.6,p=at(l,t,side);
    if(clearAt(p)&&!people.some(o=>o.fixed&&Math.hypot(o.x-p[0],o.z-p[1])<4))return {l,t,side,p};}return null;};
  for(const [kind,n] of Object.entries(counts))for(let i=0;i<n;i++){const s=spot(kind==='shop'||kind==='lean');if(!s)continue;
   const size=kind==='group'?2+(rnd()<.45?1:0):kind==='couple'?2:1,cx=s.p[0],cz=s.p[1];
   for(let j=0;j<size;j++){const a=size>1?j/size*Math.PI*2+rnd()*.4:0,x=cx+(size>1?Math.sin(a)*.55:0),z=cz+(size>1?Math.cos(a)*.55:0);
    // Groups face their middle; window-shoppers face the storefront; leaners face the street.
    const face=size>1?[cx,cz]:kind==='shop'?[x+s.l.wall[0]*2,z+s.l.wall[1]*2]:[x-s.l.wall[0]*2,z-s.l.wall[1]*2];
    people.push({id:'stand-'+(k++),fixed:true,kind,lane:s.l.id,t:s.t,side:s.side,x,z,face,clip:kind==='lean'?(rnd()<.5?'smoke':'idle'):kind==='shop'?(rnd()<.5?'watch':'idle'):'talk'});}}
  return people;}

 // Browser: figures, routines and reactions.
 function start({B,scene,parent,quality,instance,animate=root.VoidCrowd?.animate,player=()=>typeof walker!=='undefined'?walker:null,say=t=>root.announce?.(t),cast=['ncz-neon','fixer-01','runner-02','communion-tech','district-resident','hacker-01','outlaw-01','district-smuggler'],drunkCast=['runner-02','ncz-neon'],rnd=Math.random,cfg=config}){
  const people=plan(quality,rnd,cfg).map(p=>({...p,l:lanes.find(l=>l.id===p.lane),state:'walk',timer:stopIn(p),node:null,anim:null,look:null,react:0,sway:rnd()*6,yaw:0}));
  const byId=new Map(people.map(p=>[p.id,p]));let remarkCool=8,dealt=Math.floor(rnd()*8),disposed=false;
  const gov={budget:people.length,fps:60,check:cfg.fps.every},cam=()=>scene?.activeCamera?.globalPosition||null;
  function stopIn(p){const [a,b]=p.drunk?cfg.drunkStopEvery:cfg.stopEvery;return a+rnd()*(b-a);}
  // Figures appear as their looks finish downloading; until then the person is simply not there yet.
  function spawn(p){if(p.node||disposed)return;const looks=p.drunk?drunkCast:cast;let node=null,look=null;
   // Try the next look; one still downloading is skipped for one that is ready.
   for(let i=0;i<looks.length&&!node;i++){look=looks[(dealt++)%looks.length];node=instance('crowd:'+look,parent);}if(!node)return;
   node.metadata={...node.metadata,crowd:look,nightlife:p.id};p.node=node;p.look=look;
   if(p.fixed){p.anim=animate(node,look,p.clip);node.position.set(p.x,0,p.z);node.rotation.y=p.yaw=Math.atan2(p.face[0]-p.x,p.face[1]-p.z);return;}
   p.anim=animate(node,look,p.drunk?'drunk-walk':'walk');place(p,0);}
  const has=(p,c)=>p.anim?.has?.(c);
  function play(p,clip,alt='idle'){if(!p.anim)return;p.anim.play(has(p,clip)?clip:alt);}
  function place(p,dt){const sway=p.drunk&&p.state==='walk'?Math.sin(p.sway)*.32+Math.sin(p.sway*2.7)*.08:0,side=Math.max(-p.l.half,Math.min(p.l.half,p.side+sway));
   const [x,z]=p.state==='lean'?at(p.l,p.t,p.l.half+.05):at(p.l,p.t,side);const dx=x-p.node.position.x,dz=z-p.node.position.z;
   let want=p.state==='lean'?Math.atan2(-p.l.wall[0],-p.l.wall[1]):p.state==='walk'&&Math.hypot(dx,dz)>1e-4?Math.atan2(dx,dz):p.yaw;
   if(p.faceTo){want=Math.atan2(p.faceTo[0]-x,p.faceTo[1]-z);}
   const d=((want-p.yaw+Math.PI*3)%(Math.PI*2))-Math.PI;p.yaw+=d*Math.min(1,dt*(p.drunk?2.5:5));p.node.position.set(x,0,z);p.node.rotation.y=p.yaw;}
  // Frame-rate governor and distance culling: the people nearest the camera stay; the rest are switched off.
  function density(dt){const c=cam(),engineFps=scene?.getEngine?.().getFps?.();gov.fps+=((engineFps||(dt>0?1/dt:60))-gov.fps)*Math.min(1,dt*2);gov.check-=dt;
   if(gov.check<=0){gov.check=cfg.fps.every;if(gov.fps<cfg.fps.low)gov.budget=Math.max(Math.ceil(people.length*.4),gov.budget-cfg.fps.step);else if(gov.fps>cfg.fps.high)gov.budget=Math.min(people.length,gov.budget+cfg.fps.step);}
   if(!c)return;const shown=people.filter(p=>p.node&&!p.away).map(p=>({p,d:Math.hypot(p.node.position.x-c.x,p.node.position.z-c.z)})).sort((a,b)=>a.d-b.d);
   shown.forEach(({p,d},i)=>{const on=d<cfg.showRadius&&i<gov.budget;if(p.node.isEnabled()!==on)p.node.setEnabled(on);p.hidden=!on;});}
  function stats(){return {people:people.length,walkers:people.filter(p=>!p.fixed).length,standing:people.filter(p=>p.fixed).length,spawned:people.filter(p=>p.node).length,
   shown:people.filter(p=>p.node&&!p.hidden&&!p.away).length,away:people.filter(p=>p.away).length,drunk:people.filter(p=>p.drunk).length,budget:gov.budget,fps:Math.round(gov.fps)};}
  // At a street's end some walkers leave (round the corner, into a doorway) and come back later on another street.
  function leave(p){p.away=cfg.awayFor[0]+rnd()*(cfg.awayFor[1]-cfg.awayFor[0]);p.node.setEnabled(false);}
  function comeBack(p){const pool=lanes.filter(l=>!p.drunk||l.nightlife);p.l=pool[Math.floor(rnd()*pool.length)];const L=len(p.l);p.dir=rnd()<.5?1:-1;p.t=p.dir>0?1.2:L-1.2;p.away=0;p.state='walk';p.timer=stopIn(p);p.node.setEnabled(true);place(p,0);}
  const hasCompanion=p=>people.some(o=>o.friendOf===p.id||o.pairOf===p.id);
  function tick(dt){if(disposed)return;const me=player();remarkCool-=dt;density(dt);
   for(const p of people){if(!p.node){if(rnd()<dt)spawn(p);continue;}
    if(p.fixed)continue;
    if(p.away){p.away-=dt;if(p.away<=0)comeBack(p);continue;}
    if(p.hidden)continue;
    const far=me&&Math.hypot(p.node.position.x-me.x,p.node.position.z-me.z)>cfg.activeRadius;if(far)continue;
    p.timer-=dt;p.react=Math.max(0,p.react-dt);p.sway+=dt*(p.drunk?1.6:0);
    const lead=p.friendOf?byId.get(p.friendOf):p.pairOf?byId.get(p.pairOf):null;
    if(lead?.node){// Friends keep pace beside their friend, stop when they stop.
     p.t=lead.t-lead.dir*.2;p.dir=lead.dir;if(lead.state!=='walk'&&p.state==='walk'){p.state='wait';p.faceTo=[lead.node.position.x,lead.node.position.z];play(p,'talk');}
     if(lead.state==='walk'&&p.state!=='walk'){p.state='walk';p.faceTo=null;play(p,'walk');}place(p,dt);continue;}
    if(p.state==='walk'){
     // Someone (or you) right ahead: step round, never through.
     const ahead=[...people.filter(o=>o!==p&&o.node&&o.l===p.l&&!o.friendOf&&!o.pairOf),...(me?[{node:{position:{x:me.x,z:me.z}},player:true}]:[]),...standing.map(([x,z])=>({node:{position:{x,z}}})),...people.filter(o=>o.fixed&&o.node&&o.l===p.l)].find(o=>{const s=along(p.l,[o.node.position.x,o.node.position.z])-p.t;return s*p.dir>0&&s*p.dir<cfg.spacing+.6&&Math.abs(sideOf(p.l,o)-p.side)<.8;});
     if(ahead)p.side+=(p.side>0?-1:1)*dt*1.5;else p.side+=((p.homeSide??(p.homeSide=p.side))-p.side)*Math.min(1,dt*.5);
     p.side=Math.max(-p.l.half+.1,Math.min(p.l.half-.1,p.side));
     p.t+=p.dir*p.speed*dt*(ahead?.4:1);const L=len(p.l);if(p.t<1||p.t>L-1){p.dir*=-1;p.t=Math.max(1,Math.min(L-1,p.t));
      if(!hasCompanion(p)&&rnd()<cfg.leaveShare){leave(p);continue;}}
     if(p.timer<=0){const where=at(p.l,p.t);p.timer=cfg.stopFor[0]+rnd()*(cfg.stopFor[1]-cfg.stopFor[0]);
      if(p.drunk&&canLean(p.l,p.t)&&rnd()<.45){p.state='lean';p.timer=cfg.leanFor[0]+rnd()*(cfg.leanFor[1]-cfg.leanFor[0]);play(p,'drunk-idle');}
      else if(p.drunk){p.state='stop';play(p,rnd()<.5?'drunk-sway':'drunk-idle');if(rnd()<.35&&has(p,'laugh'))p.anim.playOnce('laugh','drunk-sway');}
      else if(clearAt(where)){p.state='stop';play(p,rnd()<.5?'talk':'idle');}
      else p.timer=2;}
     // Passers-by react to a drunk close by: a glance, a step aside, sometimes a laugh.
     if(!p.drunk&&!p.react){const d=people.find(o=>o.drunk&&o.node&&Math.hypot(o.node.position.x-p.node.position.x,o.node.position.z-p.node.position.z)<cfg.reactRadius);
      if(d){p.react=cfg.reactCooldown;p.side+=(sideOf(p.l,d)>p.side?-.5:.5);p.state='react';p.timer=1.6;p.faceTo=[d.node.position.x,d.node.position.z];if(has(p,'laugh')&&rnd()<.4)p.anim.playOnce('laugh','idle');else play(p,'watch','idle');}}}
    else if(p.timer<=0){p.state='walk';p.faceTo=null;p.timer=stopIn(p);play(p,p.drunk?'drunk-walk':'walk');}
    // A drunk near you says something now and then.
    if(p.drunk&&me&&remarkCool<=0&&Math.hypot(p.node.position.x-me.x,p.node.position.z-me.z)<cfg.remarkRadius){remarkCool=cfg.remarkCooldown;say('A drunk passer-by: "'+remarks[Math.floor(rnd()*remarks.length)]+'"');}
    place(p,dt);}}
  function sideOf(l,o){const p=[o.node.position.x,o.node.position.z],L=len(l),ux=(l.b[0]-l.a[0])/L,uz=(l.b[1]-l.a[1])/L,t=along(l,p),bx=l.a[0]+ux*t,bz=l.a[1]+uz*t;return (p[0]-bx)*l.wall[0]+(p[1]-bz)*l.wall[1];}
  function dispose(){disposed=true;for(const p of people)p.node?.dispose(false,true);people.length=0;}
  return {tick,dispose,people,stats,config:cfg};}
 const api={config,lanes,keepClear,standing,remarks,plan,at,canLean,start};
 if(typeof module!=='undefined')module.exports=api;else root.VoidNightlife=api;
})(globalThis);
