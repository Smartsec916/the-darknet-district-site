/* NeoChinatown nightlife: people walking the sidewalks of Main Street, the avenue and the alley by the District,
   people standing about (small groups talking, couples, window-shoppers, people leaning on walls or smoking),
   a few of them drunk (about 8%, configurable): they stagger, sway, stop to steady themselves, lean on walls, laugh,
   and now and then mutter something. Passers-by glance, step round them, sometimes laugh. Sober friends sometimes
   walk a drunk home. Some walkers leave at a street's end and others turn up later, so no loop repeats for long.
   Everyone keeps to the sidewalk lanes (no new collision, nothing blocks a door, a taxi stand or the player).
   Density adapts: figures far from you are switched off, and if the frame rate drops the furthest people are hidden
   until it recovers (config.fps).
   Crowd looks and clips: crowd.js (MakeHuman CC0; drunk clips from the owner's Mixamo downloads).
   Pure planning runs in Node (tests/ncz-nightlife.test.cjs); the figures run in the browser (neochinatown.js).
   DRAFT: the drunks' remarks are Claude's placeholders for the owner's review. */
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
  fps:{low:45,high:56,step:4,recoverStep:2,every:2,warmup:3,minShare:.4,fade:.65},  // frame-rate governor: hide the furthest people below low, restore above high
  spacing:1.1,             // how close two people get before one steps round
  // Reading while walking (the owner, 18 Nov 2026: "If a NPC uses their V1 or V2 to look at something like the News they might run into things or each other").
  // Charming, not slapstick: per look at the V1 while walking, `bump` is the chance they walk into something (a person coming the other way if there is one, else the
  // shopfront at their shoulder); everyone reading notices people late (`notice` m instead of spacing+0.6) and sidesteps quickly: near misses. Never the player.
  distracted:{bump:.08,notice:.55,sidestep:4.5,stumbleFor:1.3,sorryFor:2.2,drift:1.6},
  // Monks (the owner, 18 Nov 2026: "Monk move slowly, they are never in a hurry, they walk steady and intentful. They can almost tell the future so instead of someone using
  // their V1 while walking might bump into them, the Monk senses it a mile away and steps to one side of the sidewalk"). A walker is a monk when tagged
  // VoidNPCDevice.tag(node,{monk:true}) or marked monk in its metadata. `speed`: their pace against the street's average walker (one steady pace, no hurrying);
  // `anim`: the walk clip's playback to match (no sliding feet); `sense`: how far ahead (m) they foresee anyone on a collision course (others notice at 1.7 m);
  // `clear`: the gap (m, across the sidewalk) they leave; `sidestep`: how fast (m/s) they drift aside; `hold`: seconds they stay aside once the other has passed; `turn`: turn rate.
  monk:{speed:.65,anim:.65,sense:9,clear:1.05,margin:.1,sidestep:.42,urgent:1.4,hold:1.4,turn:1.8,check:.5},
  // Where monks walk (the owner, 18 Nov 2026: "The closer you get to the Temple the more Monks there are compared to other NPCs"). A lone sober walker is a monk with the
  // chance monkShareAt gives at the spot they start: `min` far from the East Gate (Old Town, the city centre), rising smoothly to `max` within `near` m of `gate` (the East
  // Gate on the Avenue, the way up to the Temple), `far` m and beyond is `min`. Each monk keeps to the stretch of their lane near the Temple (monkRange): they come and go
  // through the gate's end of it. At the Temple itself most people are monks (temple-build.js).
  monkShare:{gate:[148,-12.5],near:14,far:100,min:.03,max:.7}};
 // Sidewalk lanes (NeoChinatown coordinates): a line to walk, the wall side (for leaning) and how lively it is.
 // Nightlife lanes may hold drunks; the avenue's quieter east end has fewer people.
 const NC=typeof module!=='undefined'?require('./ncz-nightclub.js'):root.VoidNightclub,club=!!NC&&NC.enabled();
 const lanes=[
  // Nobody leans on the club's front by its door (ncz-nightclub.js, local server only for now).
  {id:'main-west',a:[52.6,-121],b:[52.6,-22],wall:[-1,0],half:1,nightlife:true,weight:3,...(club?{noLean:[[-61,-55.6]]}:{})},
  {id:'main-east',a:[69.4,-121],b:[69.4,-22],wall:[1,0],half:1,nightlife:true,weight:3,noLean:[[-62.5,-54.5]]},   /* the alley mouth (Milked's side street and service alley moved to Far South on 16 Nov 2026: main-far-east) */
  {id:'alley',a:[73,-59.3],b:[117,-59.3],wall:[0,1],half:.6,nightlife:true,weight:0,noLean:[[0,999]]}   /* weight 0: nobody walks the alley now (the owner, Nov 2026: four people there at most; ncz-alley.js has them) */,
  {id:'avenue-north',a:[6,-6.6],b:[148,-6.6],wall:[0,1],half:1,nightlife:false,weight:2},
  {id:'avenue-south',a:[6,-18.4],b:[148,-18.4],wall:[0,-1],half:1,nightlife:true,weight:2,noLean:[[49,73]]}];
 // Spots no one stops or leans at: doors, the taxi zones' kerbs, the static crew.
 const keepClear=[[126.9,-61.9,3],[61,-100,4],[40,-12.5,4],[61,-66,4],[61,-182,4],[52.6,-40,1.5],[69.4,-78,1.5],[52.6,-100,1.5],[34,-6.6,1.5],[98,-18.4,1.5]];
 // The street's standing crew (neochinatown.js): walkers step round them.
 const standing=[[52.6,-40],[69.4,-78],[52.6,-100],[34,-6.6],[98,-18.4]];
 // Far South's two pavements: Main Street goes on south of the South Gate. Their share of the crowd is Old Town's (weights are counted against the lanes above, so the other quarters' crowds did not change).
 const farLanes=[
  {id:'main-far-west',a:[52.6,-131.6],b:[52.6,-216.4],wall:[-1,0],half:1,nightlife:true,weight:3},
  {id:'main-far-east',a:[69.4,-131.6],b:[69.4,-216.4],wall:[1,0],half:1,nightlife:true,weight:3,noLean:[[-175,-167.5],[-194.5,-189]]}];   /* the mouths of Milked's side street and service alley */
 const remarks=['Whoa. The pavement\'s moving again.','Have you seen my taxi? It was right… somewhere.','Love this city. Love it. Hate it. Love it.','One more noodle bar. Then home. Probably.','Is it Tuesday? Feels like a Tuesday.','I\'m fine. I\'m great. I\'m sitting down.'];
 // The lanes of one quarter (ncz-quarters.js): Main Street's stop short of the North Gate, the avenue's run between its two gates, the Port has none.
 // `share` is that quarter's part of the whole city's crowd, so the same number of people are spread over the three quarters as walked the one city.
 const CLIP={oldtown:{'main-west':[[52.6,-122.4],[52.6,-27.6]],'main-east':[[69.4,-122.4],[69.4,-27.6]],alley:null},'far-south':{'main-far-west':null,'main-far-east':null},outskirts:{},avenue:{'avenue-north':[[12.5,-6.6],[141.5,-6.6]],'avenue-south':[[12.5,-17.7],[141.5,-17.7]]},port:{}};
 function lanesFor(quarter){const c=CLIP[quarter];if(!c)return lanes;return [...lanes,...farLanes].filter(l=>l.id in c).map(l=>c[l.id]?{...l,a:c[l.id][0],b:c[l.id][1],...(l.id==='avenue-south'?{half:.6}:{})}:l);}   /* the avenue's south pavement keeps clear of the North Gate's doors and guards */
 const weightOf=ls=>ls.reduce((s,l)=>s+l.weight,0),share=quarter=>CLIP[quarter]?weightOf(lanesFor(quarter))/weightOf(lanes):1;
 const len=l=>Math.hypot(l.b[0]-l.a[0],l.b[1]-l.a[1]);
 // A point along a lane at distance t, pushed sideways by `side` metres (positive = toward the wall).
 function at(l,t,side=0){const L=len(l),k=Math.max(0,Math.min(1,t/L)),x=l.a[0]+(l.b[0]-l.a[0])*k,z=l.a[1]+(l.b[1]-l.a[1])*k;return [x+l.wall[0]*side,z+l.wall[1]*side];}
 const along=(l,p)=>{const L=len(l),ux=(l.b[0]-l.a[0])/L,uz=(l.b[1]-l.a[1])/L;return (p[0]-l.a[0])*ux+(p[1]-l.a[1])*uz;};
 const clearAt=p=>!keepClear.some(([x,z,r])=>Math.hypot(p[0]-x,p[1]-z)<r);
 const canLean=(l,t)=>{const p=at(l,t);const s=l.id.startsWith('main')?p[1]:p[0];return clearAt(p)&&!(l.noLean||[]).some(([a,b])=>s>a&&s<b);};
 // Who walks where: lanes weighted by liveliness, drunks only on nightlife lanes, some pairs.
 function plan(quality='medium',rnd=Math.random,cfg=config,quarter=null){
  if(quality==='ultra')quality='high';
  const all=lanes,part=share(quarter);{const lanes=lanesFor(quarter);if(!lanes.length||!weightOf(lanes))return [];
  const n=Math.round((cfg.walkers[quality]??cfg.walkers.medium)*part),people=[];if(!n)return people;void all;
  const total=lanes.reduce((s,l)=>s+l.weight,0),drunks=Math.max(n>=8?1:0,Math.round(n*cfg.drunkShare));
  const pickLane=(night)=>{const pool=lanes.filter(l=>!night||l.nightlife),w=pool.reduce((s,l)=>s+l.weight,0);let r=rnd()*w;for(const l of pool){r-=l.weight;if(r<=0)return l;}return pool[0];};
  let drunkPlaced=0;for(let i=0;i<n;i++){const drunk=drunkPlaced<drunks;if(drunk)drunkPlaced++;const l=pickLane(drunk),L=len(l),dir=rnd()<.5?1:-1,t=4+rnd()*(L-8);
   const p={id:'night-'+i,lane:l.id,t,dir,side:(rnd()-.5)*.8,drunk,speed:drunk?cfg.drunkSpeed[0]+rnd()*(cfg.drunkSpeed[1]-cfg.drunkSpeed[0]):cfg.speed[0]+rnd()*(cfg.speed[1]-cfg.speed[0])};people.push(p);
   // A sober friend helps some drunks along; some sober people walk in pairs.
   if(drunk&&rnd()<cfg.helpedShare&&i+1<n){people.push({...p,id:'night-'+(++i),drunk:false,friendOf:p.id,side:p.side-.7});}
   else if(!drunk&&rnd()<cfg.groupShare&&i+1<n){people.push({...p,id:'night-'+(++i),side:p.side+.75,speed:p.speed,pairOf:p.id});}}
  void total;
  // Monks: lone sober walkers, more of them toward the East Gate (config.monkShare). Each keeps to its stretch of lane (monkRange).
  {const ms=cfg.monkShare||config.monkShare;for(const p of people){if(p.drunk||p.pairOf||p.friendOf||people.some(o=>o.pairOf===p.id||o.friendOf===p.id))continue;const l=lanes.find(x=>x.id===p.lane),pos=at(l,p.t);
   if(unit('monk:'+p.id+':'+p.lane+':'+Math.round(p.t*10))<monkShareAt(pos[0],pos[1],ms)){p.monk=true;p.range=monkRange(l,p.t,ms);}}}
  // People standing about, on clear stretches of sidewalk (never at doors, taxi stands or the static crew).
  const counts=cfg.standers[quality]??cfg.standers.medium;let k=0;
  const spot=(wallSide)=>{for(let tries=0;tries<40;tries++){const l=pickLane(false),L=len(l),t=5+rnd()*(L-10),side=wallSide?l.half-.25:(rnd()-.5)*.6,p=at(l,t,side);
    if(clearAt(p)&&!people.some(o=>o.fixed&&Math.hypot(o.x-p[0],o.z-p[1])<4))return {l,t,side,p};}return null;};
  for(const [kind,n0] of Object.entries(counts))for(let i=0,n=Math.round(n0*part);i<n;i++){const s=spot(kind==='shop'||kind==='lean');if(!s)continue;
   const size=kind==='group'?2+(rnd()<.45?1:0):kind==='couple'?2:1,cx=s.p[0],cz=s.p[1];
   for(let j=0;j<size;j++){const a=size>1?j/size*Math.PI*2+rnd()*.4:0,x=cx+(size>1?Math.sin(a)*.55:0),z=cz+(size>1?Math.cos(a)*.55:0);
    // Groups face their middle; window-shoppers face the storefront; leaners face the street.
    const face=size>1?[cx,cz]:kind==='shop'?[x+s.l.wall[0]*2,z+s.l.wall[1]*2]:[x-s.l.wall[0]*2,z-s.l.wall[1]*2];
    people.push({id:'stand-'+(k++),fixed:true,kind,grp:size>1?kind+'-'+i+'-'+Math.round(cx):null,lane:s.l.id,t:s.t,side:s.side,x,z,face,clip:kind==='lean'?(rnd()<.5?'smoke':'idle'):kind==='shop'?(rnd()<.5?'watch':'idle'):'talk'});}}
  return people;}}
 /* What one distracted walk brings: 'bump' (they will walk into something) or null, and after how many seconds of reading a wall bump comes (if nobody is met first).
    Deterministic from the walker's id and how many times they have looked at their V1. */
 function distraction(id,n,cfg=config.distracted){let h=2166136261;for(const c of String(id)+':'+n){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}h^=h>>>13;h=Math.imul(h,3266489909);h^=h>>>16;const r=(h>>>0)/4294967296,r2=((Math.imul(h,2246822507)>>>0)%1000)/1000;
  return r<cfg.bump?{kind:'bump',at:2+r2*3}:null;}
 // ---- Monks (pure; tests/ncz-nightlife.test.cjs, tests/monks.test.cjs) ----
 // The share of walkers who are monks at (x,z): config.monkShare (more toward the East Gate and the Temple beyond it).
 function monkShareAt(x,z,c=config.monkShare){const d=Math.hypot(x-c.gate[0],z-c.gate[1]);let k=Math.max(0,Math.min(1,(c.far-d)/(c.far-c.near)));k=k*k*(3-2*k);return c.min+(c.max-c.min)*k;}
 // The stretch [from, to] (m along the lane) a monk who starts at t keeps to: around t, where the monk share is at least half of what it is at t (and never less than
 // 24 m long). Toward the gate it reaches the lane's end, so monks come and go through the gate; toward the city centre they turn back where monks thin out.
 function monkRange(l,t,c=config.monkShare){const L=len(l),s=u=>{const p=at(l,u);return monkShareAt(p[0],p[1],c);},thr=Math.min(s(t),Math.max(c.min,s(t)*.5))-1e-9;
  let a=t,b=t;while(a>1&&s(a-1)>=thr)a-=1;while(b<L-1&&s(b+1)>=thr)b+=1;a=Math.max(1,a);b=Math.min(L-1,b);
  while(b-a<24&&(a>1||b<L-1)){a=Math.max(1,a-1);b=Math.min(L-1,b+1);}return [a,b];}
 // A steady number in [0,1) from a string (who is a monk does not use the shared random sequence, so the rest of a plan is the same as before).
 function unit(str){let h=2166136261;for(const ch of String(str)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}h^=h>>>15;h=Math.imul(h,2246822507);h^=h>>>13;return (h>>>0)/4294967296;}
 // Is this figure a monk? Marked in its own or a parent's metadata ({monk:true} or npcDevice:{monk:true}), or tagged VoidNPCDevice.tag(node,{monk:true}).
 function isMonk(node,D=root.VoidNPCDevice){for(let n=node;n;n=n.parent){const m=n.metadata;if(m&&(m.monk||m.npcDevice?.monk))return true;}return !!D?._agent?.(node)?.monk;}
 // A monk's one steady pace (m/s): the street's average walker slowed by cfg.monk.speed. The same for every monk and every step.
 const monkSpeed=(cfg=config)=>cfg.monk.speed*(cfg.speed[0]+cfg.speed[1])/2;
 // Nobody bumps into a monk (and a monk never bumps into anyone).
 const bumpable=o=>!!o&&!o.monk;
 /* Foresight. me: {t, side, home, v, avoid} in lane terms (t along the lane, side across it, positive toward the wall, v signed speed along the lane); others: [{id, t, side, v}].
    Anyone closing on them within cfg.sense metres whose line comes within `clear` of theirs is a threat; returns {who, gap, side} (the side of the sidewalk to drift to:
    the one leaving the most room, kept if it is already enough, never past the lane's edges) or null when the way is clear. */
 function foresee(me,others,half,cfg=config.monk){const lo=-half+cfg.margin,hi=half-cfg.margin,lines=[me.side,me.home??me.side,...(me.avoid?[me.avoid.side]:[])];
  const threats=[];let first=null;
  for(const o of others){const gap=o.t-me.t;if(!gap||Math.abs(gap)>cfg.sense)continue;const closing=(me.v-o.v)*Math.sign(gap);if(closing<=.05)continue;
   if(!lines.some(s=>Math.abs(o.side-s)<cfg.clear))continue;threats.push(o);if(!first||Math.abs(gap)<Math.abs(first.t-me.t))first=o;}
  if(!first)return null;
  const gap=Math.abs(first.t-me.t),eta=gap/Math.max(.05,(me.v-first.v)*Math.sign(first.t-me.t));
  // Committed: the side already chosen for this same person is kept while it still leaves them room (no wavering from side to side).
  if(me.avoid&&me.avoid.who===first.id&&Math.abs(me.avoid.side-first.side)>=.8)return {who:first.id,gap,eta,side:me.avoid.side};
  // Otherwise the side that leaves the nearest one the most room, then the others.
  const room=c=>Math.min(...threats.map(o=>Math.abs(c-o.side))),keep=me.avoid?.side;
  const options=[...(keep!=null?[keep]:[]),lo,hi,Math.max(lo,Math.min(hi,me.side))].map(c=>Math.max(lo,Math.min(hi,c)));
  const score=c=>Math.min(Math.abs(c-first.side),cfg.clear)*10+Math.min(room(c),cfg.clear);
  const side=options.reduce((a,c)=>score(c)>score(a)+1e-6?c:a);
  return {who:first.id,gap,eta,side};}
 // One step of a monk across the sidewalk: foresee, drift calmly aside (eased, at most cfg.sidestep m/s), stay aside `hold` seconds after they pass, then drift home.
 function monkStep(me,others,half,dt,cfg=config.monk){const seen=foresee(me,others,half,cfg);
  if(seen){if(me.avoid?.who!==seen.who)me.sensed=(me.sensed||0)+1;me.avoid={side:seen.side,who:seen.who,hold:cfg.hold,gap:seen.gap,eta:seen.eta};}
  else if(me.avoid){me.avoid.hold-=dt;me.avoid.eta=null;if(me.avoid.hold<=0)me.avoid=null;}
  // Calm: at most cfg.sidestep m/s, unless someone is suddenly close (they come out of a doorway), then just enough to be aside a moment before they pass.
  const goal=me.avoid?me.avoid.side:(me.home??me.side),d=goal-me.side,need=me.avoid?.eta!=null?Math.abs(d)/Math.max(.35,me.avoid.eta-.6):0,rate=Math.min(cfg.urgent??1.4,Math.max(cfg.sidestep,need));
  const step=Math.min(rate*dt,Math.abs(d)*Math.min(1,dt*2.5)+(need>cfg.sidestep?rate*dt*.5:0));
  me.side=Math.max(-half+cfg.margin,Math.min(half-cfg.margin,me.side+Math.sign(d)*step));return seen;}

 // Hysteresis uses the main loop's measured frame intervals, never Babylon's unmaintained FPS counter.
 function createBudget(total,cfg=config.fps){let budget=total,warm=0,check=0;
  return {get value(){return budget;},step(dt,metrics){
   if(!metrics?.ready){warm=0;check=0;return budget;}
   warm+=dt;if(warm<(cfg.warmup??3))return budget;check-=dt;if(check>0)return budget;check=cfg.every;
   if(metrics.fps<cfg.low)budget=Math.max(Math.ceil(total*(cfg.minShare??.4)),budget-cfg.step);
   else if(metrics.fps>cfg.high)budget=Math.min(total,budget+(cfg.recoverStep??2));
   return budget;
  }};
 }
 // Browser: figures, routines and reactions.
 function start({B,scene,parent,quality,instance,animate=root.VoidCrowd?.animate,player=()=>typeof walker!=='undefined'?walker:null,say=t=>root.announce?.(t),cast=['ncz-neon','fixer-01','runner-02','communion-tech','district-resident','hacker-01','outlaw-01','district-smuggler'],drunkCast=['runner-02','ncz-neon'],monkCast=root.VoidCrowd?.monks||['npc-monk-elder','npc-monk-tech','npc-monk-grey'],rnd=Math.random,cfg=config,quarter=null}){
  const lanes=lanesFor(quarter);
  const people=plan(quality,rnd,cfg,quarter).map(p=>({...p,l:lanes.find(l=>l.id===p.lane),state:'walk',timer:stopIn(p),node:null,monkPlan:!!p.monk,monk:false,anim:null,look:null,react:0,sway:rnd()*6,yaw:0}));
  const byId=new Map(people.map(p=>[p.id,p]));let remarkCool=8,dealt=Math.floor(rnd()*8),disposed=false;
  const budget=createBudget(people.length,cfg.fps),gov={budget:people.length,fps:0,check:0},cam=()=>scene?.activeCamera?.globalPosition||null;
  function stopIn(p){const [a,b]=p.drunk?cfg.drunkStopEvery:cfg.stopEvery;return a+rnd()*(b-a);}
  // Figures appear as their looks finish downloading; until then the person is simply not there yet.
  function spawn(p){if(p.node||disposed)return;const looks=p.monkPlan?monkCast:p.drunk?drunkCast:cast;let node=null,look=null;   /* a monk waits for a monk's figure */
   // Try the next look; one still downloading is skipped for one that is ready.
   for(let i=0;i<looks.length&&!node;i++){look=looks[(dealt++)%looks.length];node=instance('crowd:'+look,parent);}if(!node)return;
   node.metadata={...node.metadata,crowd:look,nightlife:p.id,...(p.monkPlan?{monk:true}:{})};if(p.monkPlan){root.VoidNPCDevice?.tag?.(node,{monk:true});p.monkIn=0;}p.node=node;p.look=look;p.fade=0;p.parts=node.getChildMeshes().map(m=>[m,m.visibility]);for(const [m]of p.parts)m.visibility=0;
   enlistDevice(p);
   if(p.fixed){p.anim=animate(node,look,p.clip);node.position.set(p.x,0,p.z);node.rotation.y=p.yaw=Math.atan2(p.face[0]-p.x,p.face[1]-p.z);return;}
   p.anim=animate(node,look,p.drunk?'drunk-walk':'walk');place(p,0);}
  const has=(p,c)=>p.anim?.has?.(c);
  // Monks: spotted from their tag or metadata (checked every cfg.monk.check s, so a tag given at any time is honoured), then one slow steady pace and never drunk.
  function monkCheck(p,dt){p.monkIn=(p.monkIn??rnd()*cfg.monk.check)-dt;if(p.monkIn>0)return;p.monkIn=cfg.monk.check;const now=!!(p.monkPlan||isMonk(p.node));if(now===!!p.monk)return;p.monk=now;
   if(now){p.baseSpeed??=p.speed;p.speed=monkSpeed(cfg);p.drunk=false;p.friendOf=p.pairOf=null;p.homeSide=p.side;p.reading=false;p.plan=null;p.drifting=false;}else{p.speed=p.baseSpeed??p.speed;p.avoid=null;}}
  // Their walk clip plays slower to match the pace (crowd.js restarts a clip at its own speed, so this is set again whenever the walk is playing).
  function gait(p){const r=p.monk&&p.state==='walk'?cfg.monk.anim:null;if(r==null&&!p.gaitSet)return;for(const g of p.node.metadata?.animationGroups||[]){if(!g.isPlaying)continue;
    const walk=/walk$/.test(g.name.replace(/\.\d{3}$/,''));if(walk&&r!=null&&Math.abs(g.speedRatio-r)>.005)g.speedRatio=r;}p.gaitSet=r!=null;}
  // People check their V1 now and then (npc-device.js): who walks with whom, and whether they are walking now.
  function enlistDevice(p){const D=root.VoidNPCDevice;if(!D?.enlist)return;const mate=p.pairOf||p.friendOf||people.find(o=>o.pairOf===p.id||o.friendOf===p.id)?.id||(p.grp&&people.find(o=>o!==p&&o.grp===p.grp)?.id)||null;
   D.enlist(p.node,{kind:p.fixed?(p.kind==='shop'?'shop':'stander'):'walker',pair:mate,state:()=>({moving:!p.fixed&&p.state==='walk',can:!p.monk&&!p.drunk&&!p.away&&!p.hidden&&!byId.get(p.friendOf)?.drunk})});}
  const R=()=>root.VoidCrowdReact;
  function play(p,clip,alt='idle'){if(!p.anim)return;p.anim.play(has(p,clip)?clip:alt);}
  function place(p,dt){const sway=p.drunk&&p.state==='walk'?Math.sin(p.sway)*.32+Math.sin(p.sway*2.7)*.08:0,side=Math.max(-p.l.half,Math.min(p.l.half,p.side+sway));
   const [x,z]=p.state==='lean'?at(p.l,p.t,p.l.half+.05):at(p.l,p.t,side);const dx=x-p.node.position.x,dz=z-p.node.position.z;
   let want=p.state==='lean'?Math.atan2(-p.l.wall[0],-p.l.wall[1]):p.state==='walk'&&Math.hypot(dx,dz)>1e-4?Math.atan2(dx,dz):p.yaw;
   if(p.faceTo){want=Math.atan2(p.faceTo[0]-x,p.faceTo[1]-z);}
   const d=((want-p.yaw+Math.PI*3)%(Math.PI*2))-Math.PI;p.yaw+=d*Math.min(1,dt*(p.monk?cfg.monk.turn:p.drunk?2.5:5));p.node.position.set(x,0,z);p.node.rotation.y=p.yaw;}
  // Frame-rate governor and distance culling: the people nearest the camera stay; the rest are switched off.
  function density(dt){const c=cam(),metrics=root.VoidFrameMetrics?.stats;gov.fps=metrics?.fps||0;gov.budget=budget.step(Math.min((metrics?.interval||0)/1000,2),metrics);gov.check-=dt;
   if(c&&gov.check<=0){gov.check=.2;const zf=(root.VoidZoom?root.VoidZoom.now():1);   // zoomed with the camera app: far people count as near (zoom-detail.js)
    const shown=people.filter(p=>p.node&&!p.away).map(p=>({p,d:Math.hypot(p.node.position.x-c.x,p.node.position.z-c.z)})).sort((a,b)=>a.d-b.d);
    shown.forEach(({p,d},i)=>p.show=d*zf<cfg.showRadius&&(i<gov.budget||d*zf<10));
   }
   for(const p of people){if(!p.node)continue;const to=p.show&&!p.away?1:0;p.fade=Math.max(0,Math.min(1,(p.fade||0)+(to?1:-1)*dt/(cfg.fps.fade||.65)));
    const on=p.fade>0;if(p.node.isEnabled()!==on)p.node.setEnabled(on);p.anim?.setActive?.(on);p.hidden=!on;
    if(p.lastFade!==p.fade){for(const [m,v]of p.parts)m.visibility=v*p.fade;p.lastFade=p.fade;}
   }
  }
  function stats(){return {...stats_,people:people.length,walkers:people.filter(p=>!p.fixed).length,standing:people.filter(p=>p.fixed).length,spawned:people.filter(p=>p.node).length,
   shown:people.filter(p=>p.node&&!p.hidden&&!p.away).length,away:people.filter(p=>p.away).length,drunk:people.filter(p=>p.drunk).length,monks:people.filter(p=>p.monk).length,budget:gov.budget,fps:Math.round(gov.fps)};}
  // At a street's end some walkers leave (round the corner, into a doorway) and come back later on another street.
  function leave(p){p.away=cfg.awayFor[0]+rnd()*(cfg.awayFor[1]-cfg.awayFor[0]);p.node.setEnabled(false);}
  function comeBack(p){const pool=lanes.filter(l=>!p.drunk||l.nightlife);
   if(p.monkPlan&&p.range){const L=len(p.l),[a,b]=p.range;if(b>=L-1.5){p.dir=-1;p.t=L-1.2;}else if(a<=1.5){p.dir=1;p.t=1.2;}else{p.dir=rnd()<.5?1:-1;p.t=(a+b)/2;}   /* a monk comes back the way they went: through the gate's end of their stretch */
    p.away=0;p.state='walk';p.timer=stopIn(p);p.node.setEnabled(true);place(p,0);return;}
   p.l=pool[Math.floor(rnd()*pool.length)];const L=len(p.l);p.dir=rnd()<.5?1:-1;p.t=p.dir>0?1.2:L-1.2;p.away=0;p.state='walk';p.timer=stopIn(p);p.node.setEnabled(true);place(p,0);}
  /* A bump: into a person coming the other way (both stop, turn to each other, a word or a shrug, then carry on) or, with nobody met, the shopfront at their shoulder
     (a half-step back from the wall, a startled look). The hologram closes. Never the player (the player is never `o`). */
  const stats_={bumps:0,personBumps:0,misses:0,foreseen:0};
  function bump(p,o){const DC=cfg.distracted;stats_.bumps++;p.plan=null;p.drifting=false;root.VoidNPCDevice?.startle?.(p.node,{close:true});
   p.state='bump';p.timer=o?DC.sorryFor:DC.stumbleFor;p.backLeft=.22;p.jolt=0;
   if(o){stats_.personBumps++;p.faceTo=[o.node.position.x,o.node.position.z];o.state='bump';o.timer=DC.sorryFor;o.faceTo=[p.node.position.x,p.node.position.z];o.backLeft=.12;o.jolt=0;
    if(has(p,'shrug'))p.anim.playOnce('shrug','idle');else play(p,'talk');if(has(o,'shrug')&&rnd()<.5)o.anim.playOnce('shrug','idle');else play(o,'talk');p.bumped=o.id;o.bumped=p.id;}
   else{p.sideTo=p.l.half-.45;p.faceTo=null;play(p,has(p,'look')?'look':'watch','idle');p.bumped='wall';}}
  const hasCompanion=p=>people.some(o=>o.friendOf===p.id||o.pairOf===p.id);
  function tick(dt){if(disposed)return;const me=player();remarkCool-=dt;density(dt);
   for(const p of people){if(!p.node){if(rnd()<dt)spawn(p);continue;}
    if(p.fixed)continue;
    if(p.away){p.away-=dt;if(p.away<=0)comeBack(p);continue;}
    if(p.hidden)continue;
    monkCheck(p,dt);
    const far=me&&Math.hypot(p.node.position.x-me.x,p.node.position.z-me.z)*(root.VoidZoom?root.VoidZoom.now():1)>cfg.activeRadius;if(far)continue;
    p.timer-=dt;p.react=Math.max(0,p.react-dt);p.sway+=dt*(p.drunk?1.6:0);
    // A spectacle (VoidCrowdReact): stop and watch or film it; those who would rather not turn round and walk the other way.
    const react=R()?.reactionOf?.(p.node);
    if(react&&(react.mode==='film'||react.mode==='watch')){if(p.state!=='spectate'){p.state='spectate';play(p,'idle');}p.faceTo=[react.x,react.z];place(p,dt);continue;}
    if(p.state==='spectate'){p.state='walk';p.faceTo=null;p.timer=stopIn(p);play(p,p.drunk?'drunk-walk':'walk');}
    if(react&&react.mode==='leave'&&p.leftFrom!==react.event){p.leftFrom=react.event;const toward=(along(p.l,[react.x,react.z])-p.t)*p.dir>0;if(toward)p.dir*=-1;if(p.state!=='walk'){p.state='walk';p.faceTo=null;play(p,p.drunk?'drunk-walk':'walk');}}
    const lead=p.friendOf?byId.get(p.friendOf):p.pairOf?byId.get(p.pairOf):null;
    if(lead?.node){// Friends keep pace beside their friend, stop when they stop.
     p.t=lead.t-lead.dir*.2;p.dir=lead.dir;if(lead.state!=='walk'&&p.state==='walk'){p.state='wait';p.faceTo=[lead.node.position.x,lead.node.position.z];play(p,'talk');}
     if(lead.state==='walk'&&p.state!=='walk'){p.state='walk';p.faceTo=null;play(p,'walk');}place(p,dt);continue;}
    // after a bump: an eased half-step back (and away from the wall), a little jolt of the body
    if(p.state==='bump'){if(p.backLeft>0){const k=Math.min(p.backLeft,dt*.5);p.t-=p.dir*k;p.backLeft-=k;}if(p.sideTo!=null){p.side+=(p.sideTo-p.side)*Math.min(1,dt*5);}p.jolt+=dt;p.node.rotation.x=p.jolt<.6?-.07*Math.sin(p.jolt/.6*Math.PI):0;}
    else if(p.sideTo!=null||p.node.rotation.x){p.sideTo=null;p.node.rotation.x=0;}
    if(p.state==='walk'){
     // Reading their V1 while walking (npc-device.js): they notice people late and sidestep quickly (a near miss); now and then they walk into someone or the shopfront.
     const D=root.VoidNPCDevice,reading=!p.monk&&!!D?.distracted?.(p.node),DC=cfg.distracted;
     if(reading&&!p.reading){p.reading=true;p.looks=(p.looks||0)+1;p.plan=distraction(p.id,p.looks,DC);p.readFor=0;}else if(!reading&&p.reading){p.reading=false;p.plan=null;p.drifting=false;}
     if(reading){p.readFor+=dt;
      const meet=p.plan&&people.find(o=>o!==p&&o.node&&!o.away&&!o.hidden&&o.l===p.l&&o.state==='walk'&&!o.fixed&&bumpable(o)&&o.dir!==p.dir&&!o.friendOf&&!o.pairOf&&!o.drunk&&Math.abs(sideOf(p.l,o)-p.side)<.7&&(along(p.l,[o.node.position.x,o.node.position.z])-p.t)*p.dir>0&&(along(p.l,[o.node.position.x,o.node.position.z])-p.t)*p.dir<.5);
      if(meet){bump(p,meet);place(p,dt);continue;}
      if(p.plan&&p.readFor>p.plan.at){p.drifting=true;p.side+=(p.l.half-.05-p.side)*Math.min(1,dt*DC.drift);if(p.side>p.l.half-.15&&canLean(p.l,p.t)){bump(p,null);place(p,dt);continue;}}}
     // A monk sees anyone on a collision course far ahead and calmly drifts to one side of the sidewalk well before (cfg.monk); the other walks by without a reaction.
     if(p.monk)monkWay(p,me,dt);
     // Someone (or you) right ahead: step round, never through.
     const ahead=[...people.filter(o=>o!==p&&o.node&&o.l===p.l&&!o.friendOf&&!o.pairOf),...(me?[{node:{position:{x:me.x,z:me.z}},player:true}]:[]),...standing.map(([x,z])=>({node:{position:{x,z}}})),...people.filter(o=>o.fixed&&o.node&&o.l===p.l)].find(o=>{const s=along(p.l,[o.node.position.x,o.node.position.z])-p.t;return s*p.dir>0&&s*p.dir<(reading&&!o.player?DC.notice:cfg.spacing+.6)&&Math.abs(sideOf(p.l,o)-p.side)<.8;});
     if(ahead&&reading&&!ahead.player&&!ahead.monk&&!p.missed){p.missed=ahead;stats_.misses++;D?.startle?.(p.node,{close:false});}else if(!ahead)p.missed=null;
     if(p.monk){}else if(ahead)p.side+=(p.side>0?-1:1)*dt*(reading?DC.sidestep:1.5);else if(!p.drifting)p.side+=((p.homeSide??(p.homeSide=p.side))-p.side)*Math.min(1,dt*.5);
     p.side=Math.max(-p.l.half+.1,Math.min(p.l.half-.1,p.side));
     p.t+=p.dir*p.speed*dt*(p.monk?(ahead?.6:1):(ahead?.4:1)*(R()?.pace?.(p.node)??1));const L=len(p.l);
     if(p.monk&&p.range){const [a,b]=p.range;if((p.t<a&&p.dir<0&&a>1)||(p.t>b&&p.dir>0&&b<L-1)){p.dir*=-1;p.t=Math.max(a,Math.min(b,p.t));p.avoid=null;}}   /* a monk turns back where monks thin out (monkRange) */
     if(p.t<1||p.t>L-1){p.dir*=-1;p.t=Math.max(1,Math.min(L-1,p.t));
      if(!hasCompanion(p)&&rnd()<cfg.leaveShare){leave(p);continue;}}
     if(p.timer<=0&&p.monk)p.timer=stopIn(p);   /* a monk walks on with purpose: no loitering */
     if(p.timer<=0){const where=at(p.l,p.t);p.timer=cfg.stopFor[0]+rnd()*(cfg.stopFor[1]-cfg.stopFor[0]);
      if(p.drunk&&canLean(p.l,p.t)&&rnd()<.45){p.state='lean';p.timer=cfg.leanFor[0]+rnd()*(cfg.leanFor[1]-cfg.leanFor[0]);play(p,'drunk-idle');}
      else if(p.drunk){p.state='stop';play(p,rnd()<.5?'drunk-sway':'drunk-idle');if(rnd()<.35&&has(p,'laugh'))p.anim.playOnce('laugh','drunk-sway');}
      else if(clearAt(where)){p.state='stop';play(p,p.monk||rnd()<.5?'idle':'talk');}
      else p.timer=2;}
     // Passers-by react to a drunk close by: a glance, a step aside, sometimes a laugh.
     if(!p.drunk&&!p.monk&&!p.react){const d=people.find(o=>o.drunk&&o.node&&Math.hypot(o.node.position.x-p.node.position.x,o.node.position.z-p.node.position.z)<cfg.reactRadius);
      if(d){p.react=cfg.reactCooldown;p.side+=(sideOf(p.l,d)>p.side?-.5:.5);p.state='react';p.timer=1.6;p.faceTo=[d.node.position.x,d.node.position.z];if(has(p,'laugh')&&rnd()<.4)p.anim.playOnce('laugh','idle');else play(p,'watch','idle');}}}
    else if(p.timer<=0&&R()?.holds?.(p.node))p.timer=.5;   /* a photo or selfie being taken: they finish it first */
    else if(p.timer<=0){p.state='walk';p.faceTo=null;p.timer=stopIn(p);play(p,p.drunk?'drunk-walk':'walk');}
    // A drunk near you says something now and then.
    if(p.drunk&&me&&remarkCool<=0&&Math.hypot(p.node.position.x-me.x,p.node.position.z-me.z)<cfg.remarkRadius){remarkCool=cfg.remarkCooldown;say('A drunk passer-by: "'+remarks[Math.floor(rnd()*remarks.length)]+'"');}
    place(p,dt);gait(p);}}
  // The monk's view of their lane: walkers (with their speed along it), people standing, the street's crew and you; then one monkStep.
  function monkWay(p,me,dt){const l=p.l,others=[],v=o=>o.state==='walk'&&!o.away?o.dir*o.speed*(o.monk?1:(R()?.pace?.(o.node)??1)):0;
   for(const o of people)if(o!==p&&o.node&&!o.away&&!o.hidden&&o.l===l&&o.pairOf!==p.id&&o.friendOf!==p.id){const pos=[o.node.position.x,o.node.position.z];others.push({id:o.id,t:along(l,pos),side:sideOf(l,o),v:v(o)});}
   for(const [x,z] of standing){const o={node:{position:{x,z}}};const t=along(l,[x,z]);if(t>-2&&t<len(l)+2&&Math.abs(sideOf(l,o))<l.half+.6)others.push({id:'crew@'+x+','+z,t,side:sideOf(l,o),v:0});}
   if(me){const o={node:{position:{x:me.x,z:me.z}}},s=sideOf(l,o);if(Math.abs(s)<l.half+.6)others.push({id:'player',t:along(l,[me.x,me.z]),side:s,v:0});}
   const m={t:p.t,side:p.side,home:p.homeSide??(p.homeSide=p.side),v:p.dir*p.speed,avoid:p.avoid,sensed:p.sensed};monkStep(m,others,l.half,dt,cfg.monk);
   if(m.avoid&&!p.avoid)stats_.foreseen++;p.side=m.side;p.avoid=m.avoid;p.sensed=m.sensed;}
  function sideOf(l,o){const p=[o.node.position.x,o.node.position.z],L=len(l),ux=(l.b[0]-l.a[0])/L,uz=(l.b[1]-l.a[1])/L,t=along(l,p),bx=l.a[0]+ux*t,bz=l.a[1]+uz*t;return (p[0]-bx)*l.wall[0]+(p[1]-bz)*l.wall[1];}
  function dispose(){disposed=true;for(const p of people)p.node?.dispose(false,false);people.length=0;}
  // Everyone whose look is ready is made now, behind the loading screen (neochinatown.js prepare), instead of at random in the first second after the doors open;
  // each still starts unseen and fades in as before.
  function prewarm(){for(const p of people)if(!p.node)spawn(p);}
  // A figure's shaders differ while it fades (see-through) and once it is solid: both are compiled now, still behind the loading screen. `ready` waits for the scene.
  async function warm(ready){const all=people.filter(p=>p.parts);if(!all.length||typeof ready!=='function')return;const cap=q=>Promise.race([Promise.resolve(q).catch(()=>{}),new Promise(r=>setTimeout(r,5000))]);
   for(const k of [1,.5]){for(const p of all)for(const [m,v]of p.parts)m.visibility=v*k;scene.incrementRenderId();await cap(ready());if(disposed)return;}
   for(const p of all){for(const [m,v]of p.parts)m.visibility=v*(p.fade||0);p.lastFade=p.fade;}}
  return {tick,dispose,prewarm,warm,people,stats,config:cfg};}
 const api={distraction,isMonk,monkSpeed,monkShareAt,monkRange,bumpable,foresee,monkStep,config,lanes,farLanes,lanesFor,share,keepClear,standing,remarks,plan,at,canLean,start,createBudget};
 if(typeof module!=='undefined')module.exports=api;else root.VoidNightlife=api;
})(globalThis);
