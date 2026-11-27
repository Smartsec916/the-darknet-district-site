/* VESPER WORLD: the shape of the land the Vesper road runs through (pure: browser and Node; docs/development/VESPER_ROAD.md).
   The owner (27 Nov 2026): "Make the road go between two of the highpoints. Change the terrain so it looks like a natural pass ... go many miles like this around mountains."
   - ROUTE: the road's control points (Catmull-Rom, Vesper's walking frame in metres: x east, z north). The first stretch (out of the Ward Repair yard to x 400) is the road
     as it was; from there it climbs east-south-east to the pass between the two high points of the first range (PEAKS) and on beyond it.
   - PROFILE: the road's height along its length. Flat at SURFACE_Y on the walkable yard stretch, then the natural ground under the line, smoothed and held to MAX_GRADE
     (the utility vehicle climbs it in any gear; 9 % leaves margin under the 10-12 % the brief allows). Where the land is higher than that the road runs in a cutting,
     where it is lower on a low embankment.
   - height(x, z): the terrain. The old horizon terrain (vesper-visuals.js baseHeight) with the two high points raised a little so they read as the peaks either side of
     the pass, and a valley carved along the road: a flat bench under the carriageway and shoulders, then cut or fill banks that blend into the natural slope (wider and
     gentler through the pass so it reads as a saddle, not a trench). Inside the yard (r <= YARD_R) the ground stays flat at -0.035 as it was.
   - walkable(x, z, r): the walking / driving corridor along the road beyond the yard's rectangle (the layout's own bounds still hold the yard exactly as before).
   - nearest(x, z): the nearest centre-line point, through a coarse spatial index (the road is kilometres long; a linear search per terrain vertex is too slow).
   Nothing here touches Babylon. vesper.js (the road surface and its kit) and vesper-terrain.js (the streamed terrain mesh) draw what this describes. */
(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports;
 const V=node?require('./vesper-visuals.js'):root.VoidVesperVisuals;
 const SITES=(node?require('./vesper-sites-data.js'):root.VoidVesperSitesData)||{};   // the sites' flat pads (village, ...): generated with their models
 const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};

 /* ---------------- the route ----------------
    The yard stretch (first 6 points) is the original road. Then the original line toward the foothills as far as x 560, and from there a new line to the pass:
    the saddle of the first range at about (995, -205), between the north peak (1025, 55) and the south peak (1165, -495) of the old terrain (both ~215 m; the
    saddle's natural crest is ~85 m). Beyond the pass: the plateau east of the ridge. Later points (the long road) are appended in order. */
 const CONTROL=[[14,5],[22,6.5],[30,8.5],[40,11],[52,12.5],[66,12.5],[82,10.5],[100,7],[125,3],[155,-2],[190,-7],[228,-11],[270,-16],[330,-23],[400,-33],[480,-45],[560,-60],
  [640,-82],[715,-112],[790,-145],[862,-176],[925,-198],[985,-210],[1045,-214],[1105,-207],[1170,-196],[1240,-190],
  // the long road (phase 2): east and north-east for about 8 km along the valleys between the ranges (tools/assets/vesper/plan_route.cjs, A* over the natural land;
  // edited by hand where the village stands so its street runs due east for ~120 m: x 1790..1850, z 664)
  [1326,-117],[1497,-78],[1598,45],[1589,214],[1569,362],[1546,466],[1676,602],[1730,660],[1790,664],[1850,664],[1910,670],[1975,722],[2040,768],[2114,783],[2288,838],[2386,977],[2429,1146],[2560,1172],[2702,1062],[2852,998],[2968,885],[3058,748],[3195,658],[3357,626],[3529,672],[3686,718],[3872,732],[4038,797],[4160,915],[4242,1086],[4352,1217],[4517,1289],[4691,1329],[4854,1378],[5031,1372],[5194,1374],[5348,1468],[5483,1555],[5522,1706],[5458,1860],[5482,2035],[5543,2188],[5680,2280],[5846,2334],[6012,2348],[6168,2303],[6337,2314],[6438,2448],[6532,2582],[6691,2609],[6863,2620],[7023,2660],[7192,2692],[7311,2700],
  // the road's end (phase 5): down into the flat basin under the cliff, past the guard shack and through the facility's gateway (vesper-sites-data.js 'facility')
  [7372,2701],[7432,2700],[7470,2700]];
 const PEAKS=[{x:1025,z:55,lift:42,r:95},{x:1165,z:-495,lift:42,r:110}];   // the two high points either side of the pass (raised so they frame it)
 const PASS={x:995,z:-208,r:260,rx:300,rz:150,floor:38,keep:.2};                // the saddle: the ridge is lowered toward `floor` here (broad across the ridge, narrow along it), and the road's banks are widest and gentlest
 const WIDTH=7,SURFACE_Y=.02,SHOULDER=1.6,X_LIMIT=232,TAPER=12,END_FLAT=60,MAX_GRADE=.09,YARD_R=245,FLOOR=.03;
 const WALK_MARGIN=4;            // how far beyond the shoulder a person may walk off the road edge (the bench is flat for 1 m past the shoulder, then the bank rises)

 function catmull(p0,p1,p2,p3,t){const t2=t*t,t3=t2*t;return [0,1].map(k=>.5*(2*p1[k]+(-p0[k]+p2[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t2+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t3));}
 let line=null;
 // Dense centre line: [{x, z, s, tx, tz}], about every 1.5 m (the same sampling the yard road always used, so its first 221 m are unchanged).
 function centreline(){if(line)return line;const P=CONTROL,pts=[];
  for(let i=0;i<P.length-1;i++){const p0=P[Math.max(0,i-1)],p1=P[i],p2=P[i+1],p3=P[Math.min(P.length-1,i+2)],n=Math.max(2,Math.ceil(Math.hypot(p2[0]-p1[0],p2[1]-p1[1])/1.5));for(let k=0;k<n;k++)pts.push(catmull(p0,p1,p2,p3,k/n));}
  pts.push(P[P.length-1].slice());let s=0;line=pts.map((p,i)=>{if(i)s+=Math.hypot(p[0]-pts[i-1][0],p[1]-pts[i-1][1]);const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)],l=Math.hypot(b[0]-a[0],b[1]-a[1])||1;return {x:p[0],z:p[1],s,tx:(b[0]-a[0])/l,tz:(b[1]-a[1])/l};});return line;}
 const total=()=>{const L=centreline();return L[L.length-1].s;};
 function usableYard(xLimit=X_LIMIT){const L=centreline();for(let i=1;i<L.length;i++)if(L[i].x>=xLimit){const a=L[i-1],b=L[i],f=(xLimit-a.x)/(b.x-a.x);return a.s+(b.s-a.s)*f;}return total();}
 const halfWidthAt=s=>{const end=total();return WIDTH/2*(s>end-TAPER?Math.max(.5,(end-s)/TAPER):1);};

 /* ---------------- spatial index ----------------
    Chunks of 8 centre-line segments with their bounding boxes; a 32 m grid lists the chunks within INFL metres of each cell. A query checks only the chunks of its
    cell, nearest bounding box first, and skips a chunk whose box is farther than the best point found so far. */
 const CELL=32,CHUNK=8,INFL=190;
 let index=null;
 function buildIndex(){const L=centreline(),chunks=[],cells=new Map();
  for(let i=0;i<L.length-1;i+=CHUNK){const j=Math.min(L.length-1,i+CHUNK);let x0=Infinity,x1=-Infinity,z0=Infinity,z1=-Infinity;for(let k=i;k<=j;k++){const p=L[k];x0=Math.min(x0,p.x);x1=Math.max(x1,p.x);z0=Math.min(z0,p.z);z1=Math.max(z1,p.z);}
   const c={i,j,x0,x1,z0,z1};chunks.push(c);const cx0=Math.floor((x0-INFL)/CELL),cx1=Math.floor((x1+INFL)/CELL),cz0=Math.floor((z0-INFL)/CELL),cz1=Math.floor((z1+INFL)/CELL);
   for(let a=cx0;a<=cx1;a++)for(let b=cz0;b<=cz1;b++){const key=a*100003+b;let list=cells.get(key);if(!list)cells.set(key,list=[]);list.push(chunks.length-1);}}
  return index={chunks,cells};}
 // Nearest centre-line point: {s, x, z, tx, tz, offset (+ left of travel), distance, i (segment), t}; null when the road is farther than INFL (index) and far is not set.
 function nearest(x,z,far){const I=index||buildIndex(),L=centreline(),list=I.cells.get(Math.floor(x/CELL)*100003+Math.floor(z/CELL));
  let best=null,bd=Infinity;const scan=k=>{const c=I.chunks[k],dx=Math.max(c.x0-x,0,x-c.x1),dz=Math.max(c.z0-z,0,z-c.z1);if(dx*dx+dz*dz>=bd*bd)return;
   for(let i=c.i;i<c.j;i++){const a=L[i],b=L[i+1],ex=b.x-a.x,ez=b.z-a.z,l2=ex*ex+ez*ez||1,t=Math.max(0,Math.min(1,((x-a.x)*ex+(z-a.z)*ez)/l2)),px=a.x+ex*t,pz=a.z+ez*t,d=Math.hypot(x-px,z-pz);
    if(d<bd){bd=d;const l=Math.sqrt(l2),tx=ex/l,tz=ez/l;best={s:a.s+(b.s-a.s)*t,x:px,z:pz,tx,tz,offset:(x-px)*-tz+(z-pz)*tx,distance:d,i,t};}}};
  if(list)for(const k of list)scan(k);else if(far)for(let k=0;k<I.chunks.length;k++)scan(k);
  return best;}

 /* ---------------- the base land ---------------- */
 // The old horizon terrain plus the two high points (a smooth dome each, so the summits stand a little above the ridge that joins them).
 function baseHeight(x,z){let h=V.baseHeight(x,z);{const w=Math.exp(-(((x-PASS.x)/PASS.rx)**2+((z-PASS.z)/PASS.rz)**2));if(w>.002&&h>PASS.floor)h-=(h-PASS.floor)*w*(1-PASS.keep);}for(const p of PEAKS){const d2=((x-p.x)**2+(z-p.z)**2)/(p.r*p.r);if(d2<9)h+=p.lift*Math.exp(-d2*1.4);}return h;}

 /* ---------------- the road's height ---------------- */
 let profile=null;
 function buildProfile(){const L=centreline(),n=L.length,u=usableYard(),raw=new Float64Array(n),E=new Float64Array(n);
  for(let i=0;i<n;i++){const p=L[i];raw[i]=p.s<=u?SURFACE_Y:Math.max(SURFACE_Y,baseHeight(p.x,p.z));}
  // Gaussian smoothing (sigma 70 m) of the natural ground, then the grade limit both ways, then a light smoothing (sigma 14 m) that keeps the grade.
  // each sample weighted by the length of road it stands for (the samples are 1.2-2.3 m apart), so the smoothing never steepens the grade
  const ds=L.map((p,i)=>((L[Math.min(n-1,i+1)].s-L[Math.max(0,i-1)].s)/2)||.75);
  const gauss=(src,sigma)=>{const out=new Float64Array(n);for(let i=0;i<n;i++){if(L[i].s<=u){out[i]=SURFACE_Y;continue;}let w=0,v=0;for(let k=i;k>=0&&L[i].s-L[k].s<sigma*3;k--){const q=Math.exp(-((L[i].s-L[k].s)**2)/(2*sigma*sigma))*ds[k];w+=q;v+=q*src[k];}
    for(let k=i+1;k<n&&L[k].s-L[i].s<sigma*3;k++){const q=Math.exp(-((L[k].s-L[i].s)**2)/(2*sigma*sigma))*ds[k];w+=q;v+=q*src[k];}out[i]=v/w;}return out;};
  const S=gauss(raw,45);E.set(S);
  for(let pass=0;pass<3;pass++){for(let i=1;i<n;i++){const ds=L[i].s-L[i-1].s;E[i]=Math.min(E[i-1]+MAX_GRADE*ds,Math.max(E[i-1]-MAX_GRADE*ds,E[i]));}
   for(let i=n-2;i>=0;i--){const ds=L[i+1].s-L[i].s;E[i]=Math.min(E[i+1]+MAX_GRADE*ds,Math.max(E[i+1]-MAX_GRADE*ds,E[i]));}
   for(let i=0;i<n&&L[i].s<=u;i++)E[i]=SURFACE_Y;}
  const F=gauss(E,14);for(let i=0;i<n;i++)F[i]=Math.max(SURFACE_Y,F[i]);
  // the road's end runs level for END_FLAT metres through the facility's gateway into its yard (the guard shack and the barrier stand on the level), the
  // descent before it held to the same grade limit (a deeper cut on the last ridge if need be)
  {const endY=F[n-1];for(let i=n-1;i>=0&&L[n-1].s-L[i].s<=END_FLAT;i--)F[i]=endY;for(let i=n-2;i>=0;i--){const ds=L[i+1].s-L[i].s;F[i]=Math.min(F[i],F[i+1]+MAX_GRADE*ds*.97);}}
  return profile=F;}
 // Road surface height at arc length s (or at a nearest() result).
 function roadY(s){const L=centreline(),E=profile||buildProfile();if(s<=0)return E[0];if(s>=L[L.length-1].s)return E[E.length-1];
  let lo=0,hi=L.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(L[m].s<=s)lo=m;else hi=m;}const f=(s-L[lo].s)/((L[hi].s-L[lo].s)||1);return E[lo]+(E[hi]-E[lo])*f;}
 const roadYAt=n=>{const E=profile||buildProfile();return E[n.i]+(E[n.i+1]-E[n.i])*n.t;};
 function grade(s,ds=6){return (roadY(s+ds)-roadY(s-ds))/(2*ds);}

 /* ---------------- the carved terrain ---------------- */
 // Width of the flat bench under the road (carriageway + shoulders + 1 m), and the bank that blends it into the natural ground (wider for a deeper cut or fill;
 // through the pass wider still and gentler, so the saddle reads as a broad col).
 const benchAt=s=>halfWidthAt(s)+SHOULDER+1;
 function bankAt(x,z,delta){const p=Math.exp(-(((x-PASS.x)**2+(z-PASS.z)**2)/(PASS.r*PASS.r))*2);return Math.min(90,(16+1.25*delta)*(1-p)+(34+1.9*delta)*p);}   // capped: a very deep cut keeps a steep rock face rather than reaching across the inside of a bend
 /* A site's pad (vesper-sites-data.js zone.pad, in the site's metres): the land inside it is levelled to the road's height like the road's bench, blending back to the
    natural ground over PAD_BLEND metres outside it. padAt: 0 inside a pad, rising to 1 at PAD_BLEND outside it (1: no pad here). */
 const PAD_BLEND=24;let pads=null;
 function sitePads(){if(pads)return pads;pads=Object.values(SITES).map(d=>{const z=d.zone,[ox,oz]=z.origin,r=z.pad,n=nearest(ox,oz,true);
   return {ox,oz,rect:[r[0]+ox,r[1]+ox,r[2]+oz,r[3]+oz],blend:z.padBlend||PAD_BLEND,flat:z.padMode==='flat'?(n?roadYAt(n):0):null,y:n?roadYAt(n):0,cut:z.cut||null};});return pads;}
 // padAt(x, z): {t, pad}: t 0 inside the nearest pad, 1 at its blend distance or farther (no pad: t 1)
 function padAt(x,z){let best={t:1,pad:null};for(const p of sitePads()){const r=p.rect,dx=Math.max(r[0]-x,0,x-r[1]),dz=Math.max(r[2]-z,0,z-r[3]);if(dx<p.blend&&dz<p.blend){const t=smooth(0,p.blend,Math.hypot(dx,dz));if(t<best.t)best={t,pad:p};}}return best;}
 /* A site's cut (the mine portal): from the portal line (local z >= cut.z0) into the mountain the land is at least `cover` metres above the site's floor, rising
    `rise` per metre inward and falling off `falloff` per metre beyond the portal's half width, so the adit always has rock over it and the face around the
    portal is a steep cut (its headwall and wing walls stand in the cut; vesper-terrain.js leaves the cell in front of the headwall open: zone.hole). */
 function cutAt(x,z,h){for(const p of sitePads()){const c=p.cut;if(!c)continue;const lx=x-p.ox,lz=z-p.oz;if(lz<c.z0||lz>c.z0+200||Math.abs(lx)>120)continue;
   const v=p.y+c.cover+c.rise*(lz-c.z0)-c.falloff*Math.max(0,lx<c.x[0]?c.x[0]-lx:lx-c.x[1]);if(v>h)h=v;}return h;}
 // info (optional): filled with {d: distance to the road's centre line (Infinity when far), e: the road's height there, bench, natural (the uncarved height)}.
 function height(x,z,info){const r=Math.hypot(x,z);if(r<=YARD_R){if(info){info.d=Infinity;info.e=0;info.bench=0;info.natural=-.035;}return -.035;}
  let h=baseHeight(x,z);const n=nearest(x,z);
  if(info){info.natural=h;info.d=n?n.distance:Infinity;info.e=n?roadYAt(n):0;info.bench=n?benchAt(n.s):0;}
  // the sites' pads and cuts first (on the natural land), then the road's bench and banks, so the road always wins where they meet
  {const P=padAt(x,z);if(P.pad){const target=(P.pad.flat!=null?P.pad.flat:n?roadYAt(n):P.pad.y)-FLOOR;h=target+(h-target)*P.t;}}
  h=cutAt(x,z,h);
  if(n){const e=roadYAt(n)-FLOOR,b0=benchAt(n.s);if(n.distance<b0+INFL){const t=n.distance<=b0?0:smooth(b0,b0+bankAt(x,z,Math.abs(h-e)),n.distance);h=e+(h-e)*t;}}
  if(r<YARD_R+22)h=-.035+(h+.035)*smooth(YARD_R,YARD_R+22,r);
  return Math.max(-.035,h);}
 // The ground a wheel or a foot stands on: the road surface on the carriageway, the terrain elsewhere (the yard: flat 0, the road and parking at SURFACE_Y; vesper.js).
 function groundAt(x,z){const n=nearest(x,z);if(n&&n.distance<=halfWidthAt(n.s))return roadYAt(n);return Math.max(0,height(x,z));}

 /* ---------------- where a person may walk and a vehicle may drive ----------------
    The yard is the layout's rectangle (opening-data.js bounds, unchanged). Beyond it: the road corridor (carriageway, shoulders and WALK_MARGIN of the bench and
    bank foot), from the yard's edge to the end of the road. r: the walker's or a wheel circle's radius (the circle must fit inside). Technical reason: the terrain
    off the road is steep mountain with no collision of its own; the corridor keeps people and the truck on ground that is built and drawn for them. */
 const corridorHalf=s=>halfWidthAt(s)+SHOULDER+WALK_MARGIN;
 function walkable(x,z,r=0){const n=nearest(x,z);if(!n||n.s<usableYard()-30)return false;return n.distance+r<=corridorHalf(n.s);}

 // Axis-aligned rectangles [x0,x1,z0,z1] covering the corridor between arc lengths s0 and s1 (for places.js: a named stretch of the road), about every `step` metres.
 function corridorRects(s0,s1,step=30){const L=centreline(),out=[];for(let a=Math.max(0,s0);a<Math.min(total(),s1);a+=step){const pts=L.filter(p=>p.s>=a&&p.s<=Math.min(s1,a+step));if(!pts.length)continue;
   const h=corridorHalf(a);out.push([Math.min(...pts.map(p=>p.x))-h,Math.max(...pts.map(p=>p.x))+h,Math.min(...pts.map(p=>p.z))-h,Math.max(...pts.map(p=>p.z))+h].map(v=>Math.round(v*10)/10));}return out;}
 // An approach point on the road at arc length s: [x, eye height above the ground, z] and the yaw that faces along the road (a guide arrow target, a draft-play spawn).
 function approach(s,eye=1.7){const L=centreline(),p=L.find(q=>q.s>=s)||L[L.length-1];return {point:[Math.round(p.x*10)/10,Math.round((groundAt(p.x,p.z)+eye)*100)/100,Math.round(p.z*10)/10],yaw:Math.round(Math.atan2(p.tx,p.tz)*1000)/1000};}
 const api={CONTROL,PEAKS,PASS,WIDTH,SURFACE_Y,SHOULDER,X_LIMIT,MAX_GRADE,YARD_R,WALK_MARGIN,FLOOR,centreline,total,usableYard,halfWidthAt,nearest,baseHeight,roadY,roadYAt,grade,height,groundAt,walkable,corridorHalf,benchAt,padAt,cutAt,sitePads,corridorRects,approach,
  _reset(){line=null;index=null;profile=null;pads=null;}};
 if(node)module.exports=api;else root.VoidVesperWorld=api;
})(globalThis);
