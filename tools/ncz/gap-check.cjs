/* NeoChinatown building-gap check: the pure parts (David, 16 Nov 2026). No rendering: the browser script tests/ncz-gaps-browser.cjs casts the rays this file lays out
   and gives each hit back to classify(). Unit-tested in tests/ncz-gap-check.test.cjs. Used for any quarter: the quarter's streets, its openings and the exclusion rules
   are parameters, so a rebuilt quarter (the Port's own builder) can be checked the same way.

   The idea. A quarter's streets are rectangles. Wherever the edge of a street is not another street of the quarter, a gate or a declared opening, a building must
   stand: that edge is an EXPECTED WALL. From the street, short level rays are cast at that wall in a close grid. A ray that reaches the wall line and travels on past
   the expected wall depth without meeting a building piece has found a gap. */
'use strict';
const EPS=1e-6;
// What a ray may NOT count as a building. Each rule is tried against the mesh's name and its material's name.
const EXCLUDE=[
 {why:'collision or invisible',test:h=>h.visible===false||h.enabled===false||h.visibility<.5},
 {why:'see-through',test:h=>h.alpha<.5},
 {why:'sign, advertisement or decal',re:/sign|neon|billboard|(^|-)ad(-|$)|poster|kiosk|banner|decal|graffiti|plate|logo|screen|campaign/i},
 {why:'light, glow or weather',re:/glow|pool|puddle|haze|fog|steam|smoke|rain|beam|shaft|flare|halo|lamp|lantern|light|lane-mark|sky|star/i},
 {why:'person, vehicle or drone',re:/crowd|npc|guard|player|avatar|walker|runner|street-gear|ironeye|drone|cab|taxi|ship|figure|skeleton/i},
 {why:'loose street furniture',re:/awning|cable|wire|bin|crate|cone|barrier|bollard|kerb|sidewalk|pipe-run/i}];
function excluded(hit,rules=EXCLUDE){const text=(hit.name||'')+' '+(hit.material||'');for(const r of rules){if(r.test?r.test(hit):r.re.test(text))return r.why;}return null;}
// Interval arithmetic on one axis: [a,b] minus every interval in `cuts`.
function subtract(a,b,cuts){let parts=[[a,b]];for(const [c0,c1] of cuts){const next=[];for(const [p0,p1] of parts){if(c1<=p0+EPS||c0>=p1-EPS){next.push([p0,p1]);continue;}if(c0>p0+EPS)next.push([p0,c0]);if(c1<p1-EPS)next.push([c1,p1]);}parts=next;}return parts.filter(([p0,p1])=>p1-p0>EPS);}
/* The expected walls of a quarter. streets: [[x0,x1,z0,z1],...] the open ground. openings: [{id,rect:[x0,x1,z0,z1]}] ground just outside a street edge where NO wall is
   expected (a gate's building, a doorway, an alley mouth into another quarter). Returns [{street,side,axis,fixed,from,to,n:[nx,nz]}]: a face runs along `axis`
   ('x' or 'z') at the fixed coordinate of the other axis, from `from` to `to`; n points out of the street, into the building. */
function wallFaces(streets,openings=[],touch=.6){const faces=[];
 streets.forEach((r,si)=>{const [x0,x1,z0,z1]=r;
  for(const [side,axis,fixed,a,b,n] of [['w','z',x0,z0,z1,[-1,0]],['e','z',x1,z0,z1,[1,0]],['s','x',z0,x0,x1,[0,-1]],['n','x',z1,x0,x1,[0,1]]]){
   // what lies just outside this edge: another street of the quarter, or an opening
   const cuts=[],probe=fixed+(n[0]||n[1])*touch;
   for(const o of [...streets.filter((_,k)=>k!==si).map(rect=>({rect})),...openings]){const [a0,a1,b0,b1]=o.rect,[f0,f1,l0,l1]=axis==='z'?[a0,a1,b0,b1]:[b0,b1,a0,a1];if(probe>=f0-EPS&&probe<=f1+EPS)cuts.push([l0,l1]);}
   for(const [from,to] of subtract(a,b,cuts))faces.push({street:si,side,axis,fixed,from,to,n});}});
 return faces;}
/* The rays for one face. step: metres between columns; heights: eye levels; standoff: how far out in the street a ray starts (kept inside the street by the caller's
   `room`); depth: how far behind the wall line a building piece may stand and still count. margin: left clear at each end of a face (corners belong to both faces). */
function rayGrid(face,{step=.2,heights=[.6,1.4,2.2,3.6,5,6.4],standoff=3,depth=1,margin=.4,room=null}={}){const rays=[],so=Math.max(.6,room?Math.min(standoff,room):standoff);
 for(let t=face.from+margin;t<=face.to-margin+EPS;t+=step)for(const y of heights){const [wx,wz]=face.axis==='z'?[face.fixed,t]:[t,face.fixed];
  rays.push({origin:[wx-face.n[0]*so,y,wz-face.n[1]*so],dir:[face.n[0],0,face.n[1]],wallAt:so,length:so+depth,along:t,y,wall:[wx,wz]});}
 return rays;}
/* What one ray found. hits: everything the ray met within its length, nearest first, each {name, material, distance, visible, enabled, visibility, alpha}.
   'wall': a building piece within the expected depth. 'gap': nothing but excluded things (or nothing at all). */
function classify(ray,hits,rules=EXCLUDE){const skipped=[];for(const h of hits||[]){if(h.distance>ray.length+EPS)break;const why=excluded(h,rules);if(why){skipped.push({name:h.name,why});continue;}return {result:'wall',by:h.name,material:h.material||null,distance:h.distance,skipped};}
 return {result:'gap',skipped};}
// Runs of neighbouring flagged columns on a face, so a report says "a gap 1.5 m wide at z -52" instead of listing rays. column: {along, gaps (count), rows}.
function runs(columns,step=.2,minShare=.5){const out=[];let cur=null;for(const c of columns.slice().sort((p,q)=>p.along-q.along)){const bad=c.rows&&c.gaps/c.rows>=minShare;if(bad){if(cur&&c.along-cur.to<=step*1.5){cur.to=c.along;cur.rays+=c.gaps;}else{cur={from:c.along,to:c.along,rays:c.gaps};out.push(cur);}}}
 return out.map(r=>({from:+(r.from-step/2).toFixed(2),to:+(r.to+step/2).toFixed(2),width:+(r.to-r.from+step).toFixed(2),rays:r.rays}));}
/* The building plots that should stand behind a face. blocks: the city blocks ([{position:[x,y,z], size:[w,h,d]}], neochinatown.js layout solids 'city-block-*'); each is
   cut into plots of up to `plot` metres the way the street's builder cuts them. Returns [{block, rect:[x0,x1,z0,z1], from, to}] for the plots that touch the face. */
function plotsBehind(face,blocks,plot=12){const out=[],probe=face.fixed+(face.n[0]||face.n[1])*.3;
 for(const b of blocks){const [cx,,cz]=b.position,[w,,d]=b.size,X0=cx-w/2,Z0=cz-d/2,nx=Math.ceil(w/plot),nz=Math.ceil(d/plot);
  for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const x0=X0+w*i/nx,x1=X0+w*(i+1)/nx,z0=Z0+d*j/nz,z1=Z0+d*(j+1)/nz,[f0,f1,l0,l1]=face.axis==='z'?[x0,x1,z0,z1]:[z0,z1,x0,x1];
   if(probe<f0-EPS||probe>f1+EPS)continue;const from=Math.max(l0,face.from),to=Math.min(l1,face.to);if(to-from>.05)out.push({block:b.id||null,rect:[x0,x1,z0,z1].map(v=>+v.toFixed(2)),from:+from.toFixed(2),to:+to.toFixed(2)});}}
 return out.sort((p,q)=>p.from-q.from);}
module.exports={EXCLUDE,excluded,subtract,wallFaces,rayGrid,classify,runs,plotsBehind};
