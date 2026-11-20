/* NEOCHINATOWN'S BACK ALLEYS (the owner, 20 Nov 2026: narrow alleys BEHIND the housing in three quarters, with fire escapes, windows into the apartment hallways, and open
   bays and yards for mission givers; "with a wider space": alleys about 5 m, bays about 8-10 x 12-16 m, yards about 12 x 12 m; "jump at the fire escape to climb").
   ONE FILE HOLDS WHERE THEY ARE AND THE RULES (pure: Node tests and the browser), and draws them (build()).
     PIECES     every alley, lane, bay and yard: a stable id (also its named place in the editor), its quarter, a readable name and its rectangles (world metres,
                x east, z north). The pieces are OPEN GROUND: neochinatown.js carves them out of the solid city blocks (collision and the plot buildings, which then
                show their back facades onto them), ncz-quarters.js counts them as the quarter's streets (the mission arrow routes through them), npc-areas.js makes
                them walkable for placed / routed NPCs only (the street crowd keeps to its pavement lanes and never comes in).
     MOUTHS     where an alley opens onto a street pavement (the shopfront row is cut there; nobody of the crowd stands in a mouth).
     FURNITURE  dumpsters, crates, pallets, loading docks, generators: placed by fixed rules from the pieces (a seeded generator, so the same every time), solid for the
                player (solids()) and obstacles for NPC placement and paths (obstacles()).
     ESCAPES    a metal fire escape on the alley wall behind every apartment-building street door (apartments.js DOORS, family city) whose building backs onto a piece
                (the wall straight behind the door within 15 m): a landing 3.2 m up with a window into that building's apartment HALLWAY, and a drop ladder hanging
                1.55 m off the ground. The player JUMPS at the ladder (standing at its foot, facing the wall) to grab it and climbs to the landing; on the landing,
                jump or walk off the ladder end to climb down (grab(), perch(), climbPose(): ncz-backalleys-integration.js runs them). The window opens only while one
                of the player's missions has an apartment on that street door and its "available from" step is reached (the street door's own rule); no hacking.
   Nothing here is saved. */
(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports;
 // [id, quarter, kind, name, rects, open side of a bay ('n'|'s'|'e'|'w': toward its alley)]
 const RAW=[
  // ---- The Avenue ----
  ['avenue-north-alley','avenue','alley','Avenue north back alley',[[17.1,21.9,-5,5],[45.1,49.9,-5,5],[17.1,49.9,0,5]]],
  ['avenue-north-yard','avenue','yard','Avenue north yard',[[17.1,29.1,0,12]]],
  ['avenue-north-bay','avenue','bay','Avenue north loading bay',[[33,47,5,14]],'s'],
  ['avenue-southwest-alley','avenue','alley','Avenue south-west back alley',[[10.4,15.1,-31,-20],[38,43,-31,-20],[10.4,43,-31,-26]]],
  ['avenue-southwest-bay','avenue','bay','Avenue south-west loading bay',[[15.5,29.5,-40,-31]],'n'],
  ['avenue-southwest-yard','avenue','yard','Avenue south-west yard',[[31,43,-38,-26]]],
  ['avenue-southeast-alley','avenue','alley','Avenue south-east back alley',[[80.2,84.8,-32,-20],[115.1,119.9,-32,-20],[80.2,119.9,-32,-27]]],
  ['avenue-southeast-bay','avenue','bay','Avenue south-east loading bay',[[88,102,-41,-32]],'n'],
  ['avenue-southeast-yard','avenue','yard','Avenue south-east yard',[[107.9,119.9,-38,-27]]],
  // ---- Old Town ----
  ['oldtown-null-alley','oldtown','alley','Old Town back alley behind NULL',[[43,51,-48.5,-44.4],[13,43,-48.5,-43.5],[13,18,-81.6,-43.5],[13,39,-81.6,-77.1],[39,51,-81.1,-77.1]]],
  ['oldtown-null-bay','oldtown','bay','Old Town loading bay west of NULL',[[4,13,-66,-52]],'e'],
  ['oldtown-null-yard','oldtown','yard','Old Town yard south-west of NULL',[[6,18,-81.6,-69.6]]],
  ['oldtown-north-alley','oldtown','alley','Old Town back alley to the District alley',[[71,114,-50,-45],[109.2,114,-55.5,-45]]],
  ['oldtown-north-yard','oldtown','yard','Old Town yard by the District alley',[[102,114,-50,-40]]],
  ['oldtown-terrace-lane','oldtown','lane','Old Town lane off the District alley',[[85.5,90.5,-87,-61.6]]],
  ['oldtown-terrace-alley','oldtown','alley','Old Town back alley north of the terrace',[[71,105.5,-92,-87]]],
  // (the terrace's own walls stand 3.5 m further south than its footprint, to z -119.9: neochinatown.js terrace-*; the alley south of it runs below them)
  ['oldtown-terrace-east-lane','oldtown','lane','Old Town lane east of the terrace',[[100.5,105.5,-125.1,-87]]],
  ['oldtown-terrace-south-alley','oldtown','alley','Old Town back alley south of the terrace',[[73.8,105.5,-125.1,-120.3],[73.8,78.4,-125.1,-114.6],[71,78.4,-119.6,-114.6]]],
  ['oldtown-terrace-yard','oldtown','yard','Old Town yard north of the terrace',[[80,92,-92,-80]]],
  ['oldtown-terrace-bay','oldtown','bay','Old Town loading bay north of the terrace',[[94,108,-87,-78]],'s'],
  // ---- Far South ----
  ['far-south-east-alley','far-south','alley','Far South east back alley (north)',[[71,102.5,-140,-135]]],
  ['far-south-east-alley-south','far-south','alley','Far South east back alley (south)',[[71,102.5,-158.5,-153.5]]],
  ['far-south-east-lane','far-south','lane','Far South east lane to Milked’s side street',[[97.5,102.5,-172,-135]]],
  ['far-south-east-yard','far-south','yard','Far South east yard',[[92,104,-142,-130]]],
  ['far-south-east-yard-south','far-south','yard','Far South east yard (south)',[[92,104,-162,-150]]],
  ['far-south-east-bay','far-south','bay','Far South east loading bay',[[80,94,-166,-158.5]],'n'],
  ['far-south-west-alley','far-south','alley','Far South west back alley',[[35,51,-175,-170],[35,40,-196,-170],[35,51,-196,-191]]],
  ['far-south-west-bay','far-south','bay','Far South west loading bay',[[26,35,-182,-170]],'e'],
  ['far-south-west-yard','far-south','yard','Far South west yard',[[28,40,-196,-184]]]];
 const PIECES=RAW.map(([id,quarter,kind,name,rects,open])=>({id,quarter,kind,name,rects:rects.map(r=>r.slice()),...(open?{open}:{}),at:[(rects[0][0]+rects[0][1])/2,(rects[0][2]+rects[0][3])/2]}));
 const QUARTERS=['avenue','oldtown','far-south'];
 // Other open ground the pieces join (neochinatown.js streets): a wall is wherever neither a piece nor one of these is on the other side.
 const STREETS={avenue:[2,152,-20,-5],main:[51,71,-124,-20],southGate:[51,71,-130,-124],farSouth:[51,71,-224,-130],alley:[71,136,-61.6,-55.5],milkedLane:[71,101,-174,-168.5],milkedAlley:[71,98.5,-193.5,-190]};
 // The pavement edges the alleys open onto (the shopfront building lines): axis of the line, its coordinate, and the direction from the street into the buildings.
 const EDGES=[{street:'avenue',axis:'z',at:-5,into:1},{street:'avenue',axis:'z',at:-20,into:-1},{street:'main',axis:'x',at:51,into:-1},{street:'main',axis:'x',at:71,into:1}];
 const inR=(r,x,z,m=0)=>x>r[0]-m&&x<r[1]+m&&z>r[2]-m&&z<r[3]+m;
 const list=q=>q?PIECES.filter(p=>p.quarter===q):PIECES.slice(),get=id=>PIECES.find(p=>p.id===id)||null;
 const rectsOf=q=>list(q).flatMap(p=>p.rects);
 const inPieces=(x,z,q,m=0)=>list(q).some(p=>p.rects.some(r=>inR(r,x,z,m)));
 const open=(x,z)=>inPieces(x,z)||Object.values(STREETS).some(r=>inR(r,x,z));
 const pieceAt=(x,z,q)=>list(q).find(p=>p.rects.some(r=>inR(r,x,z,1e-6)))||null;
 // The rectangles neochinatown.js adds to its streets (keys 'back-<piece>-<i>').
 const streetRects=()=>Object.fromEntries(PIECES.flatMap(p=>p.rects.map((r,i)=>['back-'+p.id+'-'+i,r.slice()])));
 /* ---- mouths: a piece rect side lying on a shopfront line ---- */
 const MOUTHS=[];for(const p of PIECES)for(const r of p.rects)for(const e of EDGES){if(e.axis==='z'){const side=e.into>0?r[2]:r[3];if(Math.abs(side-e.at)<1e-6&&r[1]>2&&r[0]<152)MOUTHS.push({piece:p.id,quarter:p.quarter,street:e.street,axis:'z',at:e.at,from:r[0],to:r[1],into:[0,e.into]});}
   else{const side=e.into>0?r[0]:r[1];if(Math.abs(side-e.at)<1e-6)MOUTHS.push({piece:p.id,quarter:p.quarter,street:e.street,axis:'x',at:e.at,from:r[2],to:r[3],into:[e.into,0]});}}
 // Is (x, z) on the pavement in front of an alley mouth (within m of its span, up to `depth` m out into the street)? The street crowd never stands there.
 function mouthAt(x,z,m=1,depth=4){for(const o of MOUTHS){const al=o.axis==='z'?x:z,ac=(o.axis==='z'?z:x)-o.at,out=-ac*(o.axis==='z'?o.into[1]:o.into[0]);if(al>o.from-m&&al<o.to+m&&out>-.5&&out<depth)return o;}return null;}
 // The parts of a run [lo, hi] along a shopfront line (axis, at) that are not an alley mouth (with a margin): neochinatown.js draws its shopfront panels only there.
 function cutRun(axis,at,lo,hi,m=.05){let parts=[[lo,hi]];for(const o of MOUTHS){if(o.axis!==axis||Math.abs(o.at-at)>.01)continue;const a=o.from-m,b=o.to+m;parts=parts.flatMap(([p,q])=>b<=p||a>=q?[[p,q]]:[[p,Math.min(q,a)],[Math.max(p,b),q]]).filter(([u,v])=>v-u>.05);}return parts;}
 /* Things hung on a street's building face (wall lamps, blade signs, light strips, washes, wall screens, cable ends) must stand on WALL: where an alley mouth cuts the
    face there is nothing behind them (tunnel entrances QA, 20 Nov 2026: teal light bars floated in the air at Far South's east alley mouth by door 135). A point counts as
    on a face when it is within 0.6 m of a mouth's shopfront line (either side). */
 const faceMouths=(x,z,half=0,m=0)=>MOUTHS.filter(o=>{const off=(o.axis==='z'?z:x)-o.at,al=o.axis==='z'?x:z;return Math.abs(off)<.6&&al+half>o.from-m&&al-half<o.to+m;});
 // clearFace(x, z, half, m): a thing `half` m wide each way along the face, moved the least along it so it keeps m clear of every mouth there -> [x, z] (as given when clear).
 function clearFace(x,z,half=0,m=.15){for(let k=0;k<4;k++){const o=faceMouths(x,z,half,m)[0];if(!o)break;const al=o.axis==='z'?x:z,a=o.from-m-half,b=o.to+m+half,n=Math.abs(al-a)<=Math.abs(b-al)?a:b;if(o.axis==='z')x=n;else z=n;}return [x,z];}
 // facePart(x, z, half, m): the part of a flat thing on the face (a wash, a panel; middle x, z) that is on wall -> {x, z, half} (moved and narrowed), or null if its middle is in a mouth.
 function facePart(x,z,half,m=.05){let lo=-half,hi=half,ax=null;for(const o of faceMouths(x,z,half,m)){const al=o.axis==='z'?x:z,a=o.from-m-al,b=o.to+m-al;if(a<=0&&b>=0)return null;ax=o.axis;if(a>0)hi=Math.min(hi,a);else lo=Math.max(lo,b);}
  if(hi-lo<.1)return null;const c=(lo+hi)/2;return {x:ax==='z'?x+c:x,z:ax==='x'?z+c:z,half:(hi-lo)/2};}
 /* ---- the ground: disjoint rectangles covering a quarter's pieces (no overlaps, so no z-fighting) ---- */
 function floors(q){const R=rectsOf(q),xs=[...new Set(R.flatMap(r=>[r[0],r[1]]))].sort((a,b)=>a-b),out=[];
  for(let i=0;i+1<xs.length;i++){const a=xs[i],b=xs[i+1];if(b-a<1e-6)continue;let iv=R.filter(r=>r[0]<=a+1e-6&&r[1]>=b-1e-6).map(r=>[r[2],r[3]]).sort((u,v)=>u[0]-v[0]);const m=[];for(const v of iv){const l=m[m.length-1];if(l&&v[0]<=l[1]+1e-6)l[1]=Math.max(l[1],v[1]);else m.push(v.slice());}
   for(const [z0,z1] of m){const prev=out.find(o=>Math.abs(o[1]-a)<1e-6&&Math.abs(o[2]-z0)<1e-6&&Math.abs(o[3]-z1)<1e-6);if(prev)prev[1]=b;else out.push([a,b,z0,z1]);}}
  return out;}
 /* ---- walls: the sides of the ground with solid city on the other side, as segments with the normal pointing INTO the open ground ---- */
 const wallCache={};
 function walls(q){if(wallCache[q])return wallCache[q];const out=[],S=.25;
  for(const f of floors(q))for(const side of ['s','n','w','e']){const alongX=side==='s'||side==='n',lo=alongX?f[0]:f[2],hi=alongX?f[1]:f[3],line=side==='s'?f[2]:side==='n'?f[3]:side==='w'?f[0]:f[1],n=side==='s'?[0,1]:side==='n'?[0,-1]:side==='w'?[1,0]:[-1,0];
   let run=null;const flush=()=>{if(run&&run[1]-run[0]>.4)out.push(alongX?{x0:run[0],x1:run[1],z0:line,z1:line,n}:{x0:line,x1:line,z0:run[0],z1:run[1],n});run=null;};
   for(let s=lo;s<hi-1e-6;s+=S){const t=Math.min(hi,s+S),c=(s+t)/2,px=alongX?c:line-n[0]*.05,pz=alongX?line-n[1]*.05:c,solid=!open(px,pz);if(solid){if(run)run[1]=t;else run=[s,t];}else flush();}flush();}
  return wallCache[q]=out;}
 /* ---- fire escapes: [street door id, wall point x, z, normal into the open ground] ---- */
 const ESC_RAW=[
  ['apt-avenue-n-23',23,0,[0,1]],['apt-avenue-n-30',30,0,[0,1]],['apt-avenue-n-37',37,0,[0,1]],['apt-avenue-n-44',44,0,[0,1]],
  ['apt-avenue-s-16',16,-26,[0,-1]],['apt-avenue-s-23',23,-26,[0,-1]],['apt-avenue-s-30',30,-26,[0,-1]],['apt-avenue-s-37',37,-26,[0,-1]],
  ['apt-avenue-s-86',86,-27,[0,-1]],['apt-avenue-s-93',93,-27,[0,-1]],['apt-avenue-s-100',100,-27,[0,-1]],['apt-avenue-s-107',107,-27,[0,-1]],['apt-avenue-s-114',114,-27,[0,-1]],
  ['apt-main-w-33',43,-33,[-1,0]],['apt-main-e-82',71+9,-82,[1,0]],['apt-main-e-68',85.5,-68,[1,0]],
  ['apt-main-w-176',40,-176,[-1,0]],['apt-main-w-183',40,-183,[-1,0]],['apt-main-w-190',40,-190,[-1,0]]];
 const ESC={H:3.2,depth:1.2,half:1.2,ladder:.85,ladderW:.5,ladderLow:1.55,footOut:1.75,grab:.95,face:.5,top:3.2*2,stand:[.45,.85]};
 // Which way along the wall the ladder end lies: toward the longer stretch of wall (away from a corner).
 function tangent(x,z,u,q){const t0=[u[1],-u[0]];let best=t0,bl=-1;for(const t of [t0,[-t0[0],-t0[1]]]){let l=0;for(let s=.25;s<6;s+=.25){if(open(x+t[0]*s-u[0]*.05,z+t[1]*s-u[1]*.05)||!inPieces(x+t[0]*s+u[0]*1.5,z+t[1]*s+u[1]*1.5,q))break;l=s;}if(l>bl){bl=l;best=t;}}return best;}
 const ESCAPES=ESC_RAW.map(([door,x,z,u])=>{const p=pieceAt(x+u[0]*.5,z+u[1]*.5),q=p?p.quarter:null,t=tangent(x,z,u,q);
  return {id:'fe-'+door.replace(/^apt-/,''),door,quarter:q,piece:p?p.id:null,x,z,u:u.slice(),t,foot:[x+u[0]*ESC.footOut+t[0]*ESC.ladder,z+u[1]*ESC.footOut+t[1]*ESC.ladder],window:[x+u[0]*.06,ESC.H+1.45,z+u[1]*.06]};});
 const escapesIn=q=>ESCAPES.filter(e=>!q||e.quarter===q),escapeFor=door=>ESCAPES.find(e=>e.door===door)||null;
 // The rule the list above follows (tests compare): a city apartment-building door whose wall straight behind it, within 15 m, is a piece's edge.
 function escapeRule(doors){const out=[];for(const d of doors||[]){if(d.family||!/^apt-/.test(d.id))continue;
   for(let k=.5;k<=15;k+=.25){const x=d.x+d.n[0]*k,z=d.z+d.n[1]*k;if(inPieces(x+d.n[0]*.1,z+d.n[1]*.1)){out.push({door:d.id,x:Math.round(x*4)/4,z:Math.round(z*4)/4,u:d.n.slice()});break;}if(open(x,z)&&k>1)break;}}return out;}
 /* GRAB (the owner: "jump at the fire escape to climb"): the player pressed jump; is he standing at the foot of a drop ladder, facing the wall? -> the escape or null. */
 function grab(p,q){if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.z))return null;if(p.height>.3)return null;const fx=Math.sin(p.yaw||0),fz=Math.cos(p.yaw||0);let best=null,bd=Infinity;
  for(const e of escapesIn(q)){const d=Math.hypot(p.x-e.foot[0],p.z-e.foot[1]);if(d>ESC.grab)continue;if(fx*-e.u[0]+fz*-e.u[1]<ESC.face)continue;if(d<bd){bd=d;best=e;}}return best;}
 /* On the landing: where the player may stand (local: along -half..+half, out stand[0]..stand[1]). perch(e, p) -> {x, z, off}: p clamped onto it; off = he walked off the ladder end. */
 function perch(e,p){const dx=p.x-e.x,dz=p.z-e.z,s=dx*e.t[0]+dz*e.t[1],o=dx*e.u[0]+dz*e.u[1],off=s>ESC.half+.05;const sc=Math.max(-ESC.half+.35,Math.min(ESC.half-.1,s)),oc=Math.max(ESC.stand[0],Math.min(ESC.stand[1],o));
  return {x:e.x+e.t[0]*sc+e.u[0]*oc,z:e.z+e.t[1]*sc+e.u[1]*oc,off};}
 /* The climb: k 0..1 up (down: 1..0). Grab the ladder at the foot, pull up rung by rung, step over onto the landing. -> {x, z, h} (h: the player's feet above the ground). */
 function climbPose(e,k){k=Math.max(0,Math.min(1,k));const at=(s,o)=>[e.x+e.t[0]*s+e.u[0]*o,e.z+e.t[1]*s+e.u[1]*o],L=ESC.ladder,a=.12,b=.86;
  if(k<a){const f=k/a,[x,z]=at(L,ESC.footOut-(ESC.footOut-1.45)*f);return {x,z,h:.35*Math.sin(f*Math.PI/2)};}
  if(k<b){const f=(k-a)/(b-a),[x,z]=at(L,1.45);return {x,z,h:.35+(ESC.H+.05-.35)*f+.06*Math.sin(f*Math.PI*9)};}
  const f=(k-b)/(1-b),[x,z]=at(L,1.45-(1.45-.7)*f);return {x,z,h:ESC.H+.05*(1-f)};}
 const CLIMB={up:1.7,down:1.3};
 /* ---- the window (the owner: no hacking; an apartment placed at that street door, its "available from" step reached) ---- */
 // open: the apartment instances open for the player now (apartments.js openNow / live-content.js apartments()): the one on this door, or null.
 const windowOpen=(door,openList)=>(openList||[]).find(a=>a&&a.door===door&&!a.modular)||null;
 /* ---- the underground entrances (the owner, 20 Nov 2026): one per quarter, in a yard, for the future tunnel network beneath the city (ONE connected underground area, a
    gang-run vestibule at each entrance: built separately). "Put the stairs down, then door": an OPEN concrete stairwell going down from the yard, railings round it at street
    level, a dim light, and the heavy steel door at the BOTTOM of the stairs (closed for now: no prompt). The player walks down (groundAt: the stairs' height under him);
    NPC placement keeps out of the whole stairwell (a placed spot has one fixed height, so a stair is not ground for them yet).
    Each: id, quarter, piece; top: the middle of the top step's edge [x, y, z]; bottom: the middle of the closed door at the foot of the stairs [x, y, z] (y = the landing's
    floor, DEPTH below the street); down: the direction the stairs go down; facing / yaw: the way the bottom door faces (back up the stairs; yaw = atan2(fx, fz));
    rect: the whole stairwell with its walls (world metres) and inner: its open floor. ---- */
 const UNDER={W:2.4,WALL:.25,STAIR:5,LAND:1.6,DEPTH:3,RAIL:1.05};
 // The owner's three spots (20 Nov 2026, circled on the v3 maps). An entry: [id, piece, top [x, z], down [dx, dz]]. Each stairwell lies against its yard's back wall(s), 2 cm in,
 // its open top facing the way in from the alley; it goes down WEST, so the door at the bottom faces east (back up the stairs) and a tunnel beyond it runs west, under the
 // buildings behind the yard and away from the street. Room to walk round it on the alley side and along the yard (tests/back-alleys.test.cjs).
 const UNDER_RAW=[
  ['under-avenue','avenue-north-yard',[23.97,10.53],[-1,0]],      // the yard's north-west corner (circled about x 20, z 11): x 17.12..23.97, z 9.08..11.98
  ['under-oldtown','oldtown-null-yard',[12.87,-73],[-1,0]],       // the yard's west side (circled about x 8, z -73): x 6.02..12.87, z -74.45..-71.55; the top step at the N-S alley
  ['under-farsouth','far-south-west-yard',[34.87,-187.5],[-1,0]]]; // the yard's west side (circled about x 30, z -187): x 28.02..34.87, z -188.95..-186.05; the top step at the N-S alley
 const UNDERGROUND_ENTRANCES=UNDER_RAW.map(([id,piece,top,d])=>{const p=PIECES.find(q=>q.id===piece),U=UNDER,L=U.STAIR+U.LAND,t=[-d[1],d[0]],P=(a,o)=>[top[0]+d[0]*a+t[0]*o,top[1]+d[1]*a+t[1]*o];
  const box=(a0,a1,o0,o1)=>{const A=P(a0,o0),B=P(a1,o1);return [Math.min(A[0],B[0]),Math.max(A[0],B[0]),Math.min(A[1],B[1]),Math.max(A[1],B[1])];};
  const b=P(L,0);return {id,quarter:p.quarter,piece,top:[top[0],0,top[1]],bottom:[b[0],-U.DEPTH,b[1]],down:d.slice(),across:t,facing:[-d[0],-d[1]],yaw:Math.atan2(-d[0],-d[1]),
   rect:box(0,L+U.WALL,-U.W/2-U.WALL,U.W/2+U.WALL),inner:box(0,L,-U.W/2,U.W/2),walls:[box(0,L+U.WALL,-U.W/2-U.WALL,-U.W/2),box(0,L+U.WALL,U.W/2,U.W/2+U.WALL),box(L,L+U.WALL,-U.W/2,U.W/2)],depth:U.DEPTH,closed:true};});
 // The ground's height under (x, z): the stairs and the landing of an underground entrance go below the street (negative); 0 everywhere else.
 function groundAt(x,z){for(const u of UNDERGROUND_ENTRANCES){if(!inR(u.inner,x,z))continue;const a=(x-u.top[0])*u.down[0]+(z-u.top[2])*u.down[1];return a<UNDER.STAIR?-UNDER.DEPTH*Math.max(0,a)/UNDER.STAIR:-UNDER.DEPTH;}return 0;}
 // a rectangle minus others (the ground with the stairwells cut out)
 function minus(r,holes){let parts=[r];for(const h of holes)parts=parts.flatMap(q=>{if(!(h[0]<q[1]&&h[1]>q[0]&&h[2]<q[3]&&h[3]>q[2]))return [q];const o=[];if(h[0]>q[0])o.push([q[0],h[0],q[2],q[3]]);if(h[1]<q[1])o.push([h[1],q[1],q[2],q[3]]);const x0=Math.max(q[0],h[0]),x1=Math.min(q[1],h[1]);if(h[2]>q[2])o.push([x0,x1,q[2],h[2]]);if(h[3]<q[3])o.push([x0,x1,h[3],q[3]]);return o;});return parts.filter(q=>q[1]-q[0]>1e-6&&q[3]-q[2]>1e-6);}
 /* ---- furniture ---- */
 function hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
 const rng=s=>{let v=(hash(s)%2147483646)+1;return ()=>((v=v*16807%2147483647)-1)/2147483646;};
 // the ground at the foot of each fire escape stays clear (where the player stands to jump, and under the landing)
 const escZone=e=>{const a=[e.x+e.t[0]*(-ESC.half-.3),e.z+e.t[1]*(-ESC.half-.3)],b=[e.x+e.t[0]*(ESC.half+.6)+e.u[0]*2.6,e.z+e.t[1]*(ESC.half+.6)+e.u[1]*2.6];return [Math.min(a[0],b[0]),Math.max(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[1],b[1])];};
 const mouthZone=o=>o.axis==='z'?[o.from-.6,o.to+.6,Math.min(o.at,o.at+o.into[1]*6),Math.max(o.at,o.at+o.into[1]*6)]:[Math.min(o.at,o.at+o.into[0]*6),Math.max(o.at,o.at+o.into[0]*6),o.from-.6,o.to+.6];
 const overlap=(a,b,m=0)=>a[0]<b[1]+m&&a[1]>b[0]-m&&a[2]<b[3]+m&&a[3]>b[2]-m;
 const KINDS={dumpster:{w:2.0,d:1.1,h:1.3,name:'a dumpster'},crates:{w:1.2,d:1.2,h:2.2,name:'a stack of crates'},crate:{w:1.1,d:1.1,h:1.1,name:'a crate'},pallets:{w:1.2,d:1.0,h:.7,name:'a stack of pallets'},
  generator:{w:1.8,d:1.0,h:1.4,name:'a generator'},drums:{w:1.3,d:.7,h:.95,name:'oil drums'},dock:{w:6,d:1.8,h:.95,name:'the loading dock'}};
 let FURN=null;const BACK={n:[0,1],s:[0,-1],e:[1,0],w:[-1,0]};   // a bay open toward n has its back wall on the south, facing north
 function furniture(q){if(!FURN){FURN=[];for(const qq of QUARTERS)FURN.push(...furnish(qq));}return q?FURN.filter(f=>f.quarter===q):FURN.slice();}
 const underZone=u=>{const r=u.rect,d=u.down;return [Math.min(r[0],r[0]-d[0]*2.2)-1.1,Math.max(r[1],r[1]-d[0]*2.2)+1.1,Math.min(r[2],r[2]-d[1]*2.2)-1.1,Math.max(r[3],r[3]-d[1]*2.2)+1.1];};   // the stairwell, the way onto its top step and a way round it
 // Where two pieces meet through a narrow opening (an alley running into a bay or a yard), the way through is kept clear like a mouth (night QA 20 Nov 2026: a dumpster stood in the 1.9 m
 // gap where the Avenue's north alley enters its loading bay, leaving 0.75 m, and the mission arrow pointed into it).
 const joinZones=q=>{const P=list(q),out=[];for(let i=0;i<P.length;i++)for(let j=i+1;j<P.length;j++)for(const a of P[i].rects)for(const b of P[j].rects){const x0=Math.max(a[0],b[0]),x1=Math.min(a[1],b[1]),z0=Math.max(a[2],b[2]),z1=Math.min(a[3],b[3]);
  if(x1<x0-.01||z1<z0-.01)continue;const tx=x1-x0<.05,tz=z1-z0<.05;if(!(tx||tz)||Math.max(x1-x0,z1-z0)>=4)continue;   // a narrow opening (an edge under 4 m); wide ones keep room beside their things
  out.push([x0-(tx?1.6:.3),x1+(tx?1.6:.3),z0-(tz?1.6:.3),z1+(tz?1.6:.3)]);}return out;};
 function furnish(q){const out=[],W=walls(q),zones=[...escapesIn(q).map(escZone),...MOUTHS.filter(o=>o.quarter===q).map(mouthZone),...UNDERGROUND_ENTRANCES.filter(u=>u.quarter===q).map(underZone),...joinZones(q)];
  // every quarter's pieces count for the "inside" test; a piece's own rectangles for where its things stand
  const inside=(r,own)=>[[r[0],r[2]],[r[1],r[2]],[r[0],r[3]],[r[1],r[3]],[(r[0]+r[1])/2,(r[2]+r[3])/2]].every(([x,z])=>own.some(R=>inR(R,x,z,-.02)));
  function tryPut(kind,p,wl,s,own,lane){const K=KINDS[kind],alongX=wl.z0===wl.z1,w=kind==='dock'?Math.min(6,(alongX?wl.x1-wl.x0:wl.z1-wl.z0)-5):K.w,d=K.d,n=wl.n;
   const c=alongX?[s,wl.z0+n[1]*(d/2+.05)]:[wl.x0+n[0]*(d/2+.05),s],r=alongX?[c[0]-w/2,c[0]+w/2,c[1]-d/2,c[1]+d/2]:[c[0]-d/2,c[0]+d/2,c[1]-w/2,c[1]+w/2];
   if(w<1||!inside(r,own))return null;for(const k of [-w/2+.1,0,w/2-.1]){const x=alongX?s+k:wl.x0-n[0]*.1,z=alongX?wl.z0-n[1]*.1:s+k;if(open(x,z))return null;}
   if(zones.some(Z=>overlap(r,Z,.2)))return null;if(out.some(f=>overlap(r,f.rect,.55)))return null;
   if(lane){const x=c[0]+n[0]*(d/2+lane),z=c[1]+n[1]*(d/2+lane);if(!inPieces(x,z,q))return null;}
   const f={id:p.id+'-'+kind+'-'+out.length,quarter:q,piece:p.id,kind,name:K.name,x:c[0],z:c[1],w:alongX?w:d,d:alongX?d:w,h:K.h,n:n.slice(),rect:r};out.push(f);return f;}
  const wallsOf=p=>W.filter(wl=>{const mx=(wl.x0+wl.x1)/2+wl.n[0]*.3,mz=(wl.z0+wl.z1)/2+wl.n[1]*.3;return p.rects.some(r=>inR(r,mx,mz));});
  for(const p of list(q)){const R=rng(p.id),ws=wallsOf(p),own=p.rects,len=wl=>wl.x1-wl.x0+wl.z1-wl.z0,pos=(wl,f)=>(wl.z0===wl.z1?wl.x0:wl.z0)+len(wl)*f;
   if(p.kind==='bay'){const bn=BACK[p.open]||[0,0],back=ws.filter(wl=>wl.n[0]===bn[0]&&wl.n[1]===bn[1]).sort((a,b)=>len(b)-len(a))[0]||ws.slice().sort((a,b)=>len(b)-len(a))[0];if(back)tryPut('dock',p,back,pos(back,.5),own);
    const sides=ws.filter(wl=>wl!==back&&len(wl)>3);for(const wl of sides){for(const f of [.25,.75])if(tryPut('dumpster',p,wl,pos(wl,f),own))break;}
    for(const wl of [back,...sides].filter(Boolean))for(const f of [.06,.94,.15,.85]){const k=R()<.5?'crates':'pallets';if(tryPut(k,p,wl,pos(wl,f),own))break;}
    if(sides[0])tryPut('drums',p,sides[0],pos(sides[0],.55),own);continue;}
   if(p.kind==='yard'){const ws2=ws.slice().sort((a,b)=>len(b)-len(a));let dump=0;for(const wl of ws2){for(const f of [.3,.6,.45,.75,.2])if(dump<2&&tryPut('dumpster',p,wl,pos(wl,f),own))dump++;}
    let c=0;for(const wl of ws2)for(const f of [.08,.92,.12,.88]){if(c>=2)break;if(tryPut(R()<.6?'crates':'pallets',p,wl,pos(wl,f),own))c++;}
    for(const wl of ws2.slice().reverse())if(tryPut('generator',p,wl,pos(wl,.5),own))break;for(const wl of ws2)if(tryPut('drums',p,wl,pos(wl,.4),own))break;continue;}
   // alleys and lanes: a dumpster every 13 m or so, sides alternating, a crate or drums now and then; always 3.4 m clear beside them
   for(const wl of ws){const L=len(wl);if(L<6)continue;for(let s=3.5+R()*3;s<L-3;s+=11+R()*5){const at=pos(wl,s/L),k=R();tryPut(k<.6?'dumpster':k<.8?'crate':'drums',p,wl,at,own,3.4);}}}
  return out;}
 // For the player's collision (neochinatown.js layout, the street).
 const solids=()=>[...furniture().map(f=>({id:'back-'+f.id,position:[f.x,f.h/2,f.z],size:[f.w,f.h,f.d]})),...UNDERGROUND_ENTRANCES.flatMap(u=>u.walls.map((w,i)=>({id:'back-'+u.id+'-wall-'+i,position:[(w[0]+w[1])/2,(UNDER.RAIL-UNDER.DEPTH)/2,(w[2]+w[3])/2],size:[w[1]-w[0],UNDER.RAIL+UNDER.DEPTH,w[3]-w[2]]})))];   // the stairwells' walls and railings (the stairs themselves are walked)
 // For NPC placement and paths (npc-areas.js): the furniture and the ground under each fire escape (where its drop ladder comes down).
 function obstacles(q){return [...furniture(q).map(f=>[f.rect[0],f.rect[1],f.rect[2],f.rect[3],f.name]),...UNDERGROUND_ENTRANCES.filter(u=>!q||u.quarter===q).map(u=>[u.rect[0],u.rect[1],u.rect[2],u.rect[3],'the stairs down to the tunnels']),
  ...escapesIn(q).map(e=>{const a=[e.x+e.t[0]*-ESC.half,e.z+e.t[1]*-ESC.half],b=[e.x+e.t[0]*ESC.half+e.u[0]*ESC.depth,e.z+e.t[1]*ESC.half+e.u[1]*ESC.depth];return [Math.min(a[0],b[0]),Math.max(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[1],b[1]),'a fire escape'];})];}
 /* ---- walkable ground for placed NPCs (npc-areas.js): each piece's rectangles, 0.4 m in from the walls; joins between rectangles; a step onto the pavement at each mouth ---- */
 function walk(q){const out=[],ins=.4,P=list(q);
  for(const p of P)for(const r of p.rects)out.push({x0:r[0]+ins,x1:r[1]-ins,z0:r[2]+ins,z1:r[3]-ins,name:p.name,piece:p.id,y:0});
  // joins: wherever two rectangles (of the quarter's pieces, or a piece and the District alley / Milked's side street) touch or overlap, a strip across the join
  const R=[...P.flatMap(p=>p.rects.map(r=>({r,name:p.name,piece:p.id}))),...[STREETS.alley,STREETS.milkedLane].map(r=>({r,name:null,street:true}))];
  for(let i=0;i<R.length;i++)for(let j=i+1;j<R.length;j++){const a=R[i].r,b=R[j].r,x0=Math.max(a[0],b[0]),x1=Math.min(a[1],b[1]),z0=Math.max(a[2],b[2]),z1=Math.min(a[3],b[3]);if(x1<x0-1e-6||z1<z0-1e-6)continue;if(R[i].street&&R[j].street)continue;
   const own=R[i].street?R[j]:R[i];if(x1-x0<1e-6&&z1-z0>1){out.push({x0:x0-.6,x1:x0+.6,z0:z0+ins,z1:z1-ins,name:own.name,piece:own.piece,y:0});}else if(z1-z0<1e-6&&x1-x0>1){out.push({x0:x0+ins,x1:x1-ins,z0:z0-.6,z1:z0+.6,name:own.name,piece:own.piece,y:0});}
   else if(x1-x0>1&&z1-z0>1)out.push({x0:x0+ins,x1:x1-ins,z0:z0+ins,z1:z1-ins,name:own.name,piece:own.piece,y:0});}
  // mouths: the alley side at road level, the pavement side on the slab (0.18 m)
  for(const o of MOUTHS.filter(o=>o.quarter===q)){const p=get(o.piece),a=o.from+ins,b=o.to-ins;if(o.axis==='z'){const s=o.into[1];out.push({x0:a,x1:b,z0:Math.min(o.at,o.at+s*.6),z1:Math.max(o.at,o.at+s*.6),name:p.name,piece:p.id,y:0},{x0:a,x1:b,z0:Math.min(o.at,o.at-s*1.1),z1:Math.max(o.at,o.at-s*1.1),name:p.name+' (mouth)',piece:p.id,y:.18});}
   else{const s=o.into[0];out.push({x0:Math.min(o.at,o.at+s*.6),x1:Math.max(o.at,o.at+s*.6),z0:a,z1:b,name:p.name,piece:p.id,y:0},{x0:Math.min(o.at,o.at-s*1.1),x1:Math.max(o.at,o.at-s*1.1),z0:a,z1:b,name:p.name+' (mouth)',piece:p.id,y:.18});}}
  return out;}
 // Named places (the editor's place list, the ChatGPT prompt): one per piece, near its middle. [{area, id, name, x, z}]
 const places=()=>PIECES.map(p=>{const r=p.rects.slice().sort((a,b)=>(b[1]-b[0])*(b[3]-b[2])-(a[1]-a[0])*(a[3]-a[2]))[0];return {area:p.quarter,id:p.id,name:p.name,x:(r[0]+r[1])/2,z:(r[2]+r[3])/2};});
 // Where a quarter's map view must reach (npc-areas.js views).
 const extent=q=>{const R=rectsOf(q);return R.length?[Math.min(...R.map(r=>r[0])),Math.max(...R.map(r=>r[1])),Math.min(...R.map(r=>r[2])),Math.max(...R.map(r=>r[3]))]:null;};

 /* ---------------- browser: the build ---------------- */
 function build({B=root.BABYLON,scene,parent,quality='medium',quarter=null,base=null}){
  const low=quality==='low',hi=quality==='high'||quality==='ultra',own=[],groups=new Map(),qs=quarter?[quarter]:QUARTERS,made={meshes:0,escapes:0,furniture:0,lamps:0};
  if(!B||!scene||!qs.some(q=>QUARTERS.includes(q)))return {stats:()=>made,dispose(){}};   // a quarter with no back alleys (the Port, the Outskirts): nothing to build (night QA: an empty floor mesh and its materials were made)
  const url=f=>{const p='assets/textures/ncz/'+f+'.jpg';try{return base?new URL(p,base).href:root.document?.currentScript?new URL(p,root.document.currentScript.src).href:'void-runner/'+p;}catch{return 'void-runner/'+p;}};
  const tex=(f,u=1,v=1)=>{const t=new B.Texture(url(f),scene,false,true);t.wrapU=t.wrapV=B.Texture.WRAP_ADDRESSMODE;t.uScale=u;t.vScale=v;own.push(t);return t;};
  const pbr=(name,c,{rough=.7,metal=.2,alb=null,nrm=null,alpha=1}={})=>{const m=new B.PBRMaterial('back-'+name,scene);m.albedoColor=B.Color3.FromHexString(c);m.roughness=rough;m.metallic=metal;if(alb)m.albedoTexture=alb;if(nrm&&!low){m.bumpTexture=nrm;m.bumpTexture.level=.7;}if(alpha<1){m.alpha=alpha;m.transparencyMode=2;}m.maxSimultaneousLights=4;own.push(m);return m;};
  const glow=(name,c,k=1)=>{const m=new B.StandardMaterial('back-glow-'+name,scene);m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.emissiveColor=B.Color3.FromHexString(c).scale(k);m.disableLighting=true;own.push(m);return m;};
  const canvas=(name,w,h,draw)=>{const t=new B.DynamicTexture('back-'+name,{width:w,height:h},scene,true);draw(t.getContext(),w,h);t.update();t.wrapU=t.wrapV=B.Texture.WRAP_ADDRESSMODE;own.push(t);return t;};
  const R=rng('back-alleys-'+(quarter||'all'));
  // ---- materials: wet concrete, dark steel, rust, painted dumpster steel, wood, corrugated shutters, sodium glass ----
  const floorM=pbr('floor','#6d6f72',{rough:.38,metal:.12,alb:tex('concrete-old-color'),nrm:tex('concrete-old-normal')});
  const steel=pbr('steel','#3a3d40',{rough:.55,metal:.85,alb:tex('metal-leaks-color',.5,.5)}),rust=pbr('rust','#7a6250',{rough:.75,metal:.45,alb:tex('metal-leaks-color')});
  const greenBin=pbr('bin-green','#3f5a48',{rough:.6,metal:.45,alb:tex('metal-leaks-color',.6,.6)}),blueBin=pbr('bin-blue','#3c4c66',{rough:.6,metal:.45,alb:tex('metal-leaks-color',.6,.6)});
  // a faint self-light from the city's haze, so wet concrete, steel and paint read in the dark (the same trick as the plot buildings' textures; no wash: albedo times a small colour)
  const haze=(m,k,tex=true)=>{if(tex&&m.albedoTexture)m.emissiveTexture=m.albedoTexture;m.emissiveColor=new B.Color3(k*.9,k,k*1.08);return m;};
  haze(floorM,.2);haze(steel,.12);haze(rust,.12);haze(greenBin,.14);haze(blueBin,.14);
  const black=pbr('black','#0b0c0e',{rough:.5,metal:.3}),bagM=pbr('bag','#0c0d10',{rough:.28,metal:.05}),concrete=pbr('dock','#77736c',{rough:.85,metal:0,alb:tex('concrete-mold-color'),nrm:tex('concrete-mold-normal')});
  const wood=pbr('wood','#ffffff',{rough:.9,metal:0,alb:canvas('wood',256,256,(g,w,h)=>{g.fillStyle='#6a5236';g.fillRect(0,0,w,h);for(let i=0;i<6;i++){const y=i*h/6;g.fillStyle='rgba(0,0,0,.35)';g.fillRect(0,y,w,3);for(let k=0;k<40;k++){g.fillStyle='rgba('+(R()<.5?'20,12,4,':'200,170,120,')+(.05+R()*.1)+')';g.fillRect(R()*w,y+R()*h/6,20+R()*80,1+R()*2);}}g.fillStyle='rgba(0,0,0,.4)';g.fillRect(0,0,10,h);g.fillRect(w-10,0,10,h);})});
  const shutters=['corrugated-rust','corrugated-green','corrugated-blue'].map(n=>haze(pbr('shutter-'+n,'#8a8a8a',{rough:.6,metal:.6,alb:tex(n+'-color',1,1),nrm:tex(n+'-normal')}),.14));haze(concrete,.14);haze(wood,.1);
  const hazard=pbr('hazard','#ffffff',{rough:.7,metal:.1,alb:canvas('hazard',256,32,(g,w,h)=>{g.fillStyle='#14120c';g.fillRect(0,0,w,h);g.fillStyle='#b8901c';for(let x=-h;x<w;x+=36){g.beginPath();g.moveTo(x,h);g.lineTo(x+18,h);g.lineTo(x+18+h,0);g.lineTo(x+h,0);g.fill();}for(let k=0;k<300;k++){g.fillStyle='rgba(0,0,0,'+R()*.6+')';g.fillRect(R()*w,R()*h,2+R()*6,1+R()*3);}})});
  const lens={sodium:glow('sodium','#ffab55',1.05),teal:glow('teal','#3fc8c0',.75),magenta:glow('magenta','#c8458f',.7),red:glow('red','#ff3030',1)};
  // the window into the hallway: a dim lit corridor seen through grimy glass and half-open blinds (emissive texture only: no emissiveColor on top, it would wash out)
  const winM=(()=>{const m=new B.StandardMaterial('back-window',scene);m.diffuseColor=B.Color3.Black();m.specularColor=new B.Color3(.25,.25,.25);m.emissiveTexture=canvas('window',128,160,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#3a2c1c');gr.addColorStop(1,'#140f0a');g.fillStyle=gr;g.fillRect(0,0,w,h);
   g.fillStyle='rgba(255,190,110,.45)';g.fillRect(w*.3,h*.12,w*.4,8);g.fillStyle='rgba(0,0,0,.55)';for(let y=10;y<h*.55;y+=9)g.fillRect(0,y,w,4);g.fillStyle='rgba(0,0,0,.35)';g.fillRect(w/2-2,0,4,h);for(let k=0;k<160;k++){g.fillStyle='rgba(20,16,10,'+R()*.35+')';g.fillRect(R()*w,R()*h,2+R()*5,2+R()*8);}});m.emissiveColor=B.Color3.Black();own.push(m);return m;})();
  const poster=pbr('posters','#ffffff',{rough:.85,metal:0,alb:canvas('posters',512,256,(g,w,h)=>{const C=['#7a2a2a','#2a4a6a','#6a5a2a','#3a3a3a','#5a2a5a','#2a5a4a','#8a6a3a','#2a2a4a'],T=['LOST','RENT','夜市','CLEAN WATER','WORK','禁止','FUNCTION SEES','NO TRESPASS'];
   for(let i=0;i<8;i++){const x=(i%4)*128,y=Math.floor(i/4)*128;g.fillStyle=C[i];g.fillRect(x+6,y+6,116,116);g.fillStyle='rgba(230,220,200,.65)';g.font='bold 20px Arial';g.fillText(T[i],x+12,y+40);for(let k=0;k<5;k++)g.fillRect(x+12,y+56+k*11,60+R()*40,4);
    for(let k=0;k<80;k++){g.fillStyle='rgba(15,12,8,'+R()*.6+')';g.fillRect(x+R()*128,y+R()*128,2+R()*10,2+R()*10);}g.clearRect(x+90+R()*30,y+100+R()*20,40,30);}})});
  poster.albedoTexture.hasAlpha=true;poster.useAlphaFromAlbedoTexture=true;poster.transparencyMode=1;poster.alphaCutOff=.3;
  const grime=(()=>{const t=canvas('grime',64,128,(g,w,h)=>{const gr=g.createLinearGradient(0,h,0,0);gr.addColorStop(0,'rgba(6,5,4,.85)');gr.addColorStop(.35,'rgba(10,8,6,.45)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);for(let k=0;k<30;k++){g.fillStyle='rgba(8,6,4,'+R()*.4+')';g.fillRect(R()*w,h*.3+R()*h*.7,1+R()*3,h);}});
   const m=pbr('grime','#ffffff',{rough:.4,metal:0,alb:t});m.albedoTexture.hasAlpha=true;m.useAlphaFromAlbedoTexture=true;m.transparencyMode=2;m.zOffset=-1;return m;})();
  const puddle=pbr('puddle','#1a2228',{rough:.03,metal:.3,alpha:.38});puddle.zOffset=-2;puddle.emissiveColor=new B.Color3(.05,.075,.085);   // wet: the sky's teal and the lamps, not a black hole
  // the light pools: one additive material (white falloff, coloured per vertex), kept out of the glow layer
  const poolTex=canvas('pool',128,128,(g,w,h)=>{const r=g.createRadialGradient(64,64,1,64,64,64);r.addColorStop(0,'#fff');r.addColorStop(.35,'rgba(255,255,255,.7)');r.addColorStop(.7,'rgba(255,255,255,.22)');r.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle='#000';g.fillRect(0,0,w,h);g.fillStyle=r;g.fillRect(0,0,w,h);});
  const poolM=(()=>{const m=new B.StandardMaterial('back-pool',scene);m.diffuseTexture=poolTex;m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.emissiveColor=B.Color3.White();m.disableLighting=true;m.alphaMode=B.Engine.ALPHA_ADD;m.alpha=.99;m.disableDepthWrite=true;m.backFaceCulling=false;own.push(m);return m;})();
  const COL={sodium:[1,.58,.24],teal:[.2,.62,.6],magenta:[.6,.2,.42]};
  const tint=(mesh,c,k)=>{const col=COL[c],n=mesh.getTotalVertices(),a=new Float32Array(n*4);for(let i=0;i<n;i++){a[i*4]=col[0]*k;a[i*4+1]=col[1]*k;a[i*4+2]=col[2]*k;a[i*4+3]=1;}mesh.setVerticesData(B.VertexBuffer.ColorKind,a,false,4);return mesh;};
  // ---- geometry: every part is merged with the others of its material at the end ----
  const put=(mesh,mat)=>{mesh.material=mat;mesh.isPickable=false;mesh.receiveShadows=false;if(!groups.has(mat))groups.set(mat,[]);groups.get(mat).push(mesh);return mesh;};
  const box=(w,h,d,x,y,z,mat,ry=0,rx=0,rz=0)=>{const t=(mat===steel||mat===rust||mat===concrete||mat===wood||shutters.includes(mat))?1.2:0;const m=t?B.MeshBuilder.CreateBox('back-part',{width:w,height:h,depth:d,faceUV:[[w,h],[w,h],[d,h],[d,h],[w,d],[w,d]].map(([a,b])=>new B.Vector4(0,0,Math.max(.1,a/t),Math.max(.1,b/t))),wrap:true},scene):B.MeshBuilder.CreateBox('back-part',{width:w,height:h,depth:d},scene);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);return put(m,mat);};
  const cyl=(r,h,x,y,z,mat,rx=0,rz=0,t=8,ry=0)=>{const m=B.MeshBuilder.CreateCylinder('back-cyl',{diameter:r*2,height:h,tessellation:t},scene);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);return put(m,mat);};
  const plane=(w,h,x,y,z,n,mat)=>{const m=B.MeshBuilder.CreatePlane('back-plane',{width:w,height:h},scene);m.position.set(x,y,z);m.rotation.y=Math.atan2(-n[0],-n[1]);return put(m,mat);};
  // (a light pool lies on the ground at 3 cm: none over a stairwell's open hole, where it would glow in mid-air; `deep` pools are the stairwells' own, on their landings)
  const pool=(c,x,z,w,d,k,deep=false)=>{if(!deep&&UNDERGROUND_ENTRANCES.some(u=>overlap([x-w/2,x+w/2,z-d/2,z+d/2],u.inner)))return null;const m=tint(B.MeshBuilder.CreateGround('back-pool',{width:w,height:d},scene),c,k*(low?.75:1));m.position.set(x,.03,z);return put(m,poolM);};
  const wash=(c,x,y,z,n,w,h,k)=>{if(low)return;const m=tint(B.MeshBuilder.CreatePlane('back-wash',{width:w,height:h},scene),c,k);m.position.set(x+n[0]*.1,y,z+n[1]*.1);m.rotation.y=Math.atan2(-n[0],-n[1]);put(m,poolM);};
  const tube=(pts,r,mat)=>put(B.MeshBuilder.CreateTube('back-cable',{path:pts.map(p=>new B.Vector3(...p)),radius:r,tessellation:4},scene),mat);
  const sag=(a,b,n,drop)=>{const pts=[];for(let i=0;i<=n;i++){const t=i/n;pts.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t-Math.sin(Math.PI*t)*drop,a[2]+(b[2]-a[2])*t]);}return pts;};
  // "along a wall": a box w wide (along), h high, d deep (out from the wall), its back against the wall at s along it
  const onWall=(wl,s,o)=>wl.z0===wl.z1?[s,wl.z0+wl.n[1]*o]:[wl.x0+wl.n[0]*o,s];
  const wbox=(wl,s,o,y,w,h,d,mat)=>{const [x,z]=onWall(wl,s,o);return wl.z0===wl.z1?box(w,h,d,x,y,z,mat):box(d,h,w,x,y,z,mat);};
  for(const q of qs){
   // ---- the ground: wet cracked concrete, a darker drain line down the middle of the narrow alleys, puddles ----
   {const pos=[],idx=[],uv=[],nrm=[];for(const f of floors(q).flatMap(f=>minus(f,UNDERGROUND_ENTRANCES.map(u=>u.inner)))){const k=pos.length/3;for(const [x,z] of [[f[0],f[2]],[f[1],f[2]],[f[1],f[3]],[f[0],f[3]]]){pos.push(x,.006,z);uv.push(x/3.5,z/3.5);nrm.push(0,1,0);}idx.push(k,k+2,k+1,k,k+3,k+2);}
    const m=new B.Mesh('back-floor-'+q,scene),vd=new B.VertexData();vd.positions=pos;vd.indices=idx;vd.uvs=uv;vd.normals=nrm;vd.applyToMesh(m);m.material=floorM;m.parent=parent;m.isPickable=false;m.receiveShadows=false;m.freezeWorldMatrix();own.push(m);made.meshes++;}
   if(!low)for(const p of list(q))for(const r of p.rects){const n=Math.max(1,Math.round((r[1]-r[0])*(r[3]-r[2])/45));for(let i=0;i<n;i++){const x=r[0]+1+R()*(r[1]-r[0]-2),z=r[2]+1+R()*(r[3]-r[2]-2);if(UNDERGROUND_ENTRANCES.some(u=>inR(u.rect,x,z,1.6)))continue;const d=B.MeshBuilder.CreateDisc('back-puddle',{radius:.5+R()*1.1,tessellation:9},scene);d.rotation.x=Math.PI/2;d.scaling.set(1+R()*.9,.6+R()*.5,1);d.position.set(x,.012,z);d.rotation.y=R()*3;put(d,puddle);}}
   // ---- the walls: grime along the foot, pipes and conduits, downpipes, vents, posters and tags, wall lamps ----
   const W=walls(q);let lampGap=4+R()*4;
   for(const wl of W){const L=wl.x1-wl.x0+wl.z1-wl.z0,s0=wl.z0===wl.z1?wl.x0:wl.z0,mid=s0+L/2,n=wl.n,[mx,mz]=onWall(wl,mid,.03);
    if(!low){const g=B.MeshBuilder.CreatePlane('back-grime',{width:L,height:1.2},scene);g.position.set(mx,.6,mz);g.rotation.y=Math.atan2(-n[0],-n[1]);put(g,grime);}
    if(L>5){const y=2.5+R()*.8;wbox(wl,mid,.16,y,L-.4,.16,.16,R()<.5?rust:steel);if(!low){for(let s=s0+1;s<s0+L-.5;s+=2.2)wbox(wl,s,.06,y,.06,.28,.14,black);if(R()<.6)wbox(wl,mid,.1,y+.45,L-.6,.07,.07,black);}}
    for(let s=s0+1.5+R()*3;s<s0+L-1;s+=6+R()*7){const [x,z]=onWall(wl,s,.12);if(R()<.6)cyl(.07,9,x,4.5,z,R()<.5?rust:steel);else if(!low)wbox(wl,s,.15,1.4+R()*2,.9,.6,.3,steel);}
    if(!low)for(let s=s0+1+R()*4;s<s0+L-1;s+=5+R()*6){if(R()<.55){const [x,z]=onWall(wl,s,.025),w=.6+R()*.4,m=B.MeshBuilder.CreatePlane('back-poster',{width:w,height:w*1.3,frontUVs:new B.Vector4((Math.floor(R()*4))/4,Math.floor(R()*2)/2,(Math.floor(R()*4)+1)/4,(Math.floor(R()*2)+1)/2)},scene);m.position.set(x,1.3+R()*1.1,z);m.rotation.y=Math.atan2(-n[0],-n[1]);m.rotation.z=(R()-.5)*.12;put(m,poster);}}
    // a wall lamp every 11 m or so: a caged housing on an arm, its lens, a pool on the ground and a wash on the wall (no real light)
    for(let s=s0+lampGap;s<s0+L-1;s+=8+R()*3){const c=R()<.78?'sodium':R()<.5?'teal':'magenta',y=c==='sodium'?3.6:2.9,[x,z]=onWall(wl,s,.3);wbox(wl,s,.12,y+.08,.08,.08,.36,black);wbox(wl,s,.32,y,.42,.16,.3,black);wbox(wl,s,.32,y-.09,.34,.03,.24,lens[c]);
     const [px,pz]=onWall(wl,s,2.2);pool(c,px,pz,6.5,6.5,c==='sodium'?1.25:.95);const [wx,wz]=onWall(wl,s,0);wash(c,wx,y-1,wz,n,5,3.8,.5);made.lamps++;lampGap=s-s0+8;}
    lampGap=Math.max(2,lampGap-L);}
   // cables strung across the narrow alleys and lanes, 5-7 m up, sagging
   if(!low)for(const p of list(q).filter(p=>p.kind!=='bay'))for(const r of p.rects){const w=r[1]-r[0],d=r[3]-r[2];if(Math.min(w,d)>6.5)continue;const alongX=w>d;for(let s=(alongX?r[0]:r[2])+3+R()*4;s<(alongX?r[1]:r[3])-2;s+=6+R()*6){const y=5+R()*2,a=alongX?[s,y,r[2]]:[r[0],y,s],b=alongX?[s+(R()-.5)*2,y+(R()-.5),r[3]]:[r[1],y+(R()-.5),s+(R()-.5)*2];tube(sag(a,b,8,.3+R()*.4),.016,black);if(hi&&R()<.5)tube(sag([a[0],a[1]+.3,a[2]],[b[0],b[1]+.3,b[2]],8,.5),.012,black);}}
   // ---- furniture ----
   for(const f of furniture(q)){made.furniture++;const n=f.n,alongX=f.w>=f.d===(n[1]!==0)||n[1]!==0,ry=n[1]!==0?0:Math.PI/2,A=n[1]!==0?f.w:f.d,D=n[1]!==0?f.d:f.w;   // A along the wall, D out from it
    const P=(a,o)=>n[1]!==0?[f.x+a,f.z+o*n[1]]:[f.x+o*n[0],f.z+a];
    if(f.kind==='dumpster'){const m=R()<.55?greenBin:blueBin;box(A,1.05,D,f.x,.62,f.z,m,ry);box(A+.08,.08,D+.08,f.x,1.17,f.z,black,ry);const [lx,lz]=P(0,D*.25);const open=R()<.3;box(A+.04,.05,D*.55,lx,1.24+(open?.18:0),lz,black,ry,open?(n[1]!==0?-.5*n[1]:0):0,open?(n[0]!==0?.5*n[0]:0):0);
     for(const a of [-A/2+.25,A/2-.25])for(const o of [-D/2+.2,D/2-.2]){const [x,z]=P(a,o);cyl(.07,.1,x,.07,z,black,0,Math.PI/2,6,ry);}const [hx,hz]=P(0,-D/2-.04);box(A*.8,.06,.06,hx,.9,hz,steel,ry);
     if(!low)for(let i=0;i<2+Math.floor(R()*3);i++){const [x,z]=P((R()-.5)*(A+1.2),D/2+.25+R()*.5),b=B.MeshBuilder.CreateSphere('back-bag',{diameter:.6+R()*.25,segments:6},scene);b.position.set(x,.22,z);b.scaling.y=.7;put(b,bagM);}}
    else if(f.kind==='crates'||f.kind==='crate'){const k=f.kind==='crate'?1:2+Math.floor(R()*2);for(let i=0;i<k;i++){const s=1.05-i*.08;box(s,s,s,f.x+(R()-.5)*.1,i*1.02+s/2,f.z+(R()-.5)*.1,wood,R()*.3);}}
    else if(f.kind==='pallets'){for(let i=0;i<5;i++)box(A,.12,D,f.x+(R()-.5)*.08,.06+i*.14,f.z+(R()-.5)*.08,wood,ry+(R()-.5)*.08);}
    else if(f.kind==='drums'){for(const a of [-.32,.32]){const [x,z]=P(a,0);cyl(.29,.9,x,.45,z,R()<.5?rust:blueBin,0,0,10);}}
    else if(f.kind==='generator'){box(A,1.2,D,f.x,.65,f.z,greenBin,ry);box(A+.06,.1,D+.06,f.x,.05,f.z,black,ry);const [vx,vz]=P(0,D/2+.01);box(A*.6,.5,.02,vx,.8,vz,black,ry);const [lx,lz]=P(A/2-.2,D/2+.02);box(.05,.05,.02,lx,1.05,lz,lens.red,ry);
     const [ex,ez]=P(A/2-.3,0);cyl(.06,.8,ex,1.6,ez,steel);}
    else if(f.kind==='dock'){box(A,f.h,D,f.x,f.h/2,f.z,concrete,ry);const [ex,ez]=P(0,D/2+.01);box(A,.18,.02,ex,f.h-.09,ez,hazard,ry);for(const a of [-A/2+.6,A/2-.6]){const [bx,bz]=P(a,D/2+.08);box(.3,.45,.16,bx,f.h-.3,bz,black,ry);}
     // the roller shutter over the dock, a sodium flood above it, a bollard each side
     const [sx,sz]=P(0,-D/2+.04),sm=shutters[Math.floor(R()*3)];box(A-.6,3.2,.06,sx,f.h+1.6,sz,sm,ry);const [hx,hz]=P(0,-D/2+.2);box(A-.3,.35,.4,hx,f.h+3.35,hz,steel,ry);
     const [fx,fz]=P(0,-D/2+.35);box(.6,.18,.4,fx,f.h+4,fz,black,ry);box(.5,.03,.3,fx,f.h+3.9,fz,lens.sodium,ry);const [px,pz]=P(0,D/2+2);pool('sodium',px,pz,7,7,1.1);const [wx,wz]=P(0,-D/2);wash('sodium',wx,f.h+2,wz,n,6,4,.4);made.lamps++;
     for(const a of [-A/2-.5,A/2+.5]){const [bx,bz]=P(a,D/2+.6);cyl(.11,1,bx,.5,bz,hazard,0,0,8);}}}
   // ---- fire escapes ----
   for(const e of escapesIn(q)){made.escapes++;const {H,depth,half,ladder,ladderW,ladderLow}=ESC,t=e.t,u=e.u,at=(s,o)=>[e.x+t[0]*s+u[0]*o,e.z+t[1]*s+u[1]*o],ry=u[1]!==0?0:Math.PI/2,along=(w,h,d)=>u[1]!==0?[w,h,d]:[d,h,w];
    const level=(Y,top)=>{const [cx,cz]=at(0,depth/2);box(...along(half*2,.05,depth),cx,Y,cz,steel);   // the grating
     for(const s of [-half,half]){const [x,z]=at(s,depth);cyl(.025,1,x,Y+.5,z,steel,0,0,6);const [x2,z2]=at(s,.02);cyl(.025,1,x2,Y+.5,z2,steel,0,0,6);const [bx,bz]=at(s,depth/2);box(...along(.04,.04,depth),bx,Y+1,bz,steel);box(...along(.04,.04,depth),bx,Y+.5,bz,steel);
      const [dx,dz]=at(s,depth*.55);const br=box(...along(.05,.05,Math.hypot(depth,.9)),dx,Y-.45,dz,steel);if(u[1]!==0)br.rotation.x=Math.atan2(.9,depth)*-u[1];else br.rotation.z=Math.atan2(.9,depth)*u[0];}
     const [rx,rz]=at(0,depth);box(...along(half*2,.04,.04),rx,Y+1,rz,steel);box(...along(half*2,.04,.04),rx,Y+.5,rz,steel);for(let s=-half+.3;s<half;s+=.3){const [x,z]=at(s,depth);box(.02,1,.02,x,Y+.5,z,steel);}
     // its window: frame, sill, the lit glass of the hallway behind
     const [wx,wz]=at(-.25,.06);box(...along(1.3,1.5,.1),wx,Y+1.45,wz,black);const [gx,gz]=at(-.25,.115);plane(1.1,1.3,gx,Y+1.45,gz,u,top?winM:winM);const [sx,sz]=at(-.25,.15);box(...along(1.4,.06,.2),sx,Y+.68,sz,steel);};
    level(H,true);if(!low)level(H*2,false);
    // stairs from the first landing up to the second (Medium and High)
    if(!low){const steps=11;for(let i=0;i<steps;i++){const f=i/steps,[x,z]=at(-half+.25+f*(half*2-.9),depth*.55);box(...along(.28,.04,.7),x,H+.2+f*(H-.2),z,steel);}const [ax,az]=at(-.1,depth*.55+.38);const sr=box(...along(Math.hypot(half*2-.9,H),.04,.04),ax,H+H/2+.6,az,steel);if(u[1]!==0)sr.rotation.z=Math.atan2(H,half*2-.9)*(t[0]>0?1:-1);else sr.rotation.x=-Math.atan2(H,half*2-.9)*(t[1]>0?1:-1);}
    // the drop ladder: two rails and rungs at the landing's outer edge, its foot hanging 1.55 m off the ground, a counterweight arm above
    {const [lx,lz]=at(ladder,depth+.04),top=H+1.1,len=top-ladderLow;for(const s of [-ladderW/2,ladderW/2]){const [x,z]=at(ladder+s,depth+.04);cyl(.02,len,x,ladderLow+len/2,z,steel,0,0,6);}for(let y=ladderLow+.1;y<top-.05;y+=.3)box(...along(ladderW,.025,.025),lx,y,lz,steel);
     const [cx,cz]=at(ladder,depth+.3);box(...along(.06,.06,.6),cx,top+.1,cz,black);cyl(.06,.25,cx,top-.05,cz,rust,0,0,8);}
    // a caged bulb on the wall over the landing (the window's own light), its pool on the ground below and a wash up the wall
    {const [bx,bz]=at(.75,.12);box(...along(.16,.2,.16),bx,H+2.45,bz,black);box(...along(.1,.1,.06),bx,H+2.35,bz+0,lens.sodium);const [px,pz]=at(0,1.6);pool('sodium',px,pz,4.5,4.5,.9);const [wx,wz]=at(0,0);wash('sodium',wx,H+1.2,wz,u,3.4,4.4,.42);made.lamps++;}
    // brackets bolted to the wall under the landing
    for(const s of [-half+.15,half-.15]){const [x,z]=at(s,.06);box(...along(.12,.25,.12),x,H-.15,z,rust);}
   }
  }
  // ---- the underground entrances: an open concrete stairwell going down, railings round it, the closed steel door at the bottom, a caged lamp over the door ----
  for(const u of UNDERGROUND_ENTRANCES.filter(u=>qs.includes(u.quarter))){const U=UNDER,d=u.down,t=u.across,L=U.STAIR+U.LAND,P=(a,o)=>[u.top[0]+d[0]*a+t[0]*o,u.top[2]+d[1]*a+t[1]*o],ry=d[0]!==0?Math.PI/2:0;
   const piece=(a0,a1,o0,o1,y0,y1,mat)=>{const [x,z]=P((a0+a1)/2,(o0+o1)/2),la=a1-a0,lo=o1-o0;return d[0]!==0?box(la,y1-y0,lo,x,(y0+y1)/2,z,mat):box(lo,y1-y0,la,x,(y0+y1)/2,z,mat);};
   const n=Math.round(U.DEPTH/.18),run=U.STAIR/n,B0=-U.DEPTH-.35;for(let i=0;i<n;i++){const top=-U.DEPTH*(i+1)/n;piece(i*run,(i+1)*run,-U.W/2,U.W/2,B0,top,concrete);piece(i*run,i*run+.04,-U.W/2,U.W/2,top-.02,top+.005,hazard);}   // steps, a worn nosing on each
   piece(U.STAIR,L,-U.W/2,U.W/2,B0,-U.DEPTH,concrete);   // the landing
   for(const s of [-1,1])piece(0,L+U.WALL,s<0?-U.W/2-U.WALL:U.W/2,s<0?-U.W/2:U.W/2+U.WALL,B0,.15,concrete);piece(L,L+U.WALL,-U.W/2,U.W/2,B0,.15,concrete);   // the walls, a kerb at street level
   // railings at street level: posts and two rails down both sides and across the far end
   for(const s of [-1,1]){const o=s*(U.W/2+U.WALL/2);for(let a=.1;a<=L+.2;a+=1.2)piece(a-.025,a+.025,o-.025,o+.025,.15,U.RAIL,steel);piece(0,L+U.WALL,o-.025,o+.025,U.RAIL-.05,U.RAIL,steel);piece(0,L+U.WALL,o-.02,o+.02,.6,.64,steel);}
   piece(L+U.WALL/2-.025,L+U.WALL/2+.025,-U.W/2-U.WALL,U.W/2+U.WALL,U.RAIL-.05,U.RAIL,steel);piece(L+U.WALL/2-.02,L+U.WALL/2+.02,-U.W/2-U.WALL,U.W/2+U.WALL,.6,.64,steel);
   // a handrail down the stairs on one side
   {const o=U.W/2-.08,[x0,z0]=P(0,o),[x1,z1]=P(U.STAIR,o),len=Math.hypot(U.STAIR,U.DEPTH),m=box(.05,.05,len,(x0+x1)/2,(-U.DEPTH)/2+.9,(z0+z1)/2,steel);m.rotation.y=Math.atan2(d[0],d[1]);m.rotation.x=Math.atan2(U.DEPTH,U.STAIR);}
   // the door at the bottom (closed): a heavy steel slab with braces in a black frame, on the end wall's inner face
   const F=L-.02;piece(F-.06,F,-.65,.65,-U.DEPTH,-U.DEPTH+2.25,rust);piece(F-.09,F,-.78,-.66,-U.DEPTH,-U.DEPTH+2.35,black);piece(F-.09,F,.66,.78,-U.DEPTH,-U.DEPTH+2.35,black);piece(F-.09,F,-.78,.78,-U.DEPTH+2.25,-U.DEPTH+2.37,black);
   for(const y of [.5,1.1,1.7])piece(F-.1,F-.06,-.6,.6,-U.DEPTH+y,-U.DEPTH+y+.08,steel);piece(F-.14,F-.06,.38,.46,-U.DEPTH+.95,-U.DEPTH+1.25,black);
   // the lamp over it: a caged housing, its dim sodium lens, a pool on the landing and a wash on the door; a sign scraped on the wall beside it
   piece(F-.3,F,-.18,.18,-U.DEPTH+2.55,-U.DEPTH+2.7,black);piece(F-.28,F-.04,-.14,.14,-U.DEPTH+2.52,-U.DEPTH+2.55,lens.sodium);{const [px,pz]=P(L-1,0),m=pool('sodium',px,pz,2.6,2.6,.8,true);m.position.y=-U.DEPTH+.02;const [wx,wz]=P(F,0);wash('sodium',wx,-U.DEPTH+1.5,wz,u.facing,2.4,2.6,.32);}
   {const [lx,lz]=P(-.05,U.W/2+U.WALL/2);box(.16,.16,.16,lx,U.RAIL+.12,lz,black);box(.1,.03,.1,lx,U.RAIL+.04,lz,lens.sodium);}   // a small lamp on the top railing
   if(!low){const [sx,sz]=P(U.STAIR+.4,-U.W/2+.02),m=B.MeshBuilder.CreatePlane('back-under-sign',{width:.55,height:.72,frontUVs:new B.Vector4(.75,.5,1,1)},scene);m.position.set(sx,-U.DEPTH+1.5,sz);m.rotation.y=Math.atan2(-t[0],-t[1]);put(m,poster);}
   made.underground=(made.underground||0)+1;}
  // ---- merge: one mesh per material ----
  for(const [mat,list_] of groups){if(!list_.length)continue;const mm=list_.length>1?B.Mesh.MergeMeshes(list_,true,true,undefined,false,false):list_[0];if(!mm)continue;mm.name='back-'+mat.name;mm.material=mat;mm.parent=parent;mm.isPickable=false;mm.receiveShadows=false;if(mat===poolM)mm.alphaIndex=2;mm.freezeWorldMatrix();own.push(mm);made.meshes++;}
  for(const g of (scene.effectLayers||[]).filter(l=>l.addExcludedMesh&&/glow/i.test(l.getClassName?.()||'')))for(const o of own)if(o.getTotalVertices&&!/back-glow/.test(o.material?.name||''))g.addExcludedMesh(o);
  return {stats:()=>({...made}),dispose(){for(const o of own.reverse())try{o.dispose();}catch{}own.length=0;groups.clear();}};}

 const api={PIECES,QUARTERS,STREETS,MOUTHS,faceMouths,clearFace,facePart,ESC,ESCAPES,CLIMB,KINDS,UNDER,UNDERGROUND_ENTRANCES,groundAt,minus,list,get,rectsOf,inPieces,pieceAt,open,streetRects,mouthAt,cutRun,floors,walls,escapesIn,escapeFor,escapeRule,grab,perch,climbPose,windowOpen,furniture,solids,obstacles,walk,places,extent,build};
 if(node)module.exports=api;else root.VoidBackAlleys=api;
})(typeof globalThis!=='undefined'?globalThis:this);
