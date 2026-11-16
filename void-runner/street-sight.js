/* Street sight (16 Nov 2026, docs/development/OUTDOOR_PERFORMANCE.md): outdoors in NeoChinatown, most of the animated people in a heavy view stand behind a building
   (measured: 47 drawn from the District's street door, 4 of them in sight). The graphics card is still asked to draw them and the processor still animates them,
   because nothing tells the engine a city block is in the way. This module does, cheaply and without looking at any geometry:
     - SIGHT. The streets are a handful of rectangles (neochinatown.js `streets`, plus NULL's floor, whose doorway is open) and everything else is a 30 m high city
       block. A person is in sight when the straight line from the camera to them stays inside those rectangles, each widened by `margin` so that people are shown
       a little BEFORE a corner really uncovers them. Anyone within `near` metres is always shown, and so is everyone when the camera is high (a cab in the air) or
       is not standing in a street at all.
     - HYSTERESIS. A person is shown the moment they are in sight and hidden only after `hideAfter` seconds out of it, so nobody flickers at a corner.
     - HIDDEN means not drawn and not animated. Where they are (their walk along the pavement, their routine) keeps running in ncz-nightlife.js and the others.
     - DISTANCE. People in sight but far away have their animation worked out every 2nd or 3rd frame (crowd.js `lod`), and their eyes, eyebrows and eyelashes
       (three of a kit figure's eight pieces, a pixel or less at that range) are not drawn. Both thresholds follow the camera's zoom.
   Who: only the street's own ambient people (ncz-nightlife.js, ncz-alley.js, the five standing crew, NULL's people). Other players, companions and anything else are
   never touched. The camera app's name tags do their own wall test and read `isEnabled()`, which this never changes.
   The rule is pure and runs in Node (tests/street-sight.test.cjs); the part that hides figures runs in the browser, started by neochinatown.js for the street only. */
(function(root){
 'use strict';
 const config={enabled:true,
  margin:1.5,        // metres each street is widened by for the sight test (shows people early at corners)
  spread:.5,         // a person is half this wide each side: a line to either shoulder also counts
  near:8,            // always shown within this many metres
  hideAfter:.75,     // seconds out of sight before a person is hidden
  eyeMax:3.4,        // camera higher than this (a cab in the air): everyone is shown
  frustum:2.5,       // metres outside the camera's view before a person's animation pauses
  anim:[[24,2],[48,3]],   // beyond 24 m animation is worked out every 2nd frame, beyond 48 m every 3rd
  detail:[30,34],    // face pieces are dropped beyond 34 m and come back inside 30 m
  detailParts:/eyebrow|eyelash|low-poly/i};
 const neo=()=>typeof module==='object'&&module.exports?require('./neochinatown.js'):root.VoidNeoChinatown;
 /* The rectangles a sight line may pass through, [x0,x1,z0,z1]: every street, and NULL (its doorway on Main Street is open and its people are part of the street). */
 function open(N=neo()){const out=Object.values(N.streets).map(r=>r.slice());if(N.footprints.club)out.push(N.footprints.club.slice());return out;}
 const within=(rects,x,z,m=0)=>rects.some(r=>x>=r[0]-m&&x<=r[1]+m&&z>=r[2]-m&&z<=r[3]+m);
 /* True when the whole segment a->b lies inside the union of the rectangles (each widened by m): the part of the segment inside each rectangle is an interval,
    and the intervals must cover it from end to end. Exact, and a few dozen multiplications. */
 function clear(rects,ax,az,bx,bz,m=0){
  const dx=bx-ax,dz=bz-az,spans=[];
  for(const r of rects){let t0=0,t1=1,ok=true;
   for(const [p,d,lo,hi] of [[ax,dx,r[0]-m,r[1]+m],[az,dz,r[2]-m,r[3]+m]]){
    if(Math.abs(d)<1e-9){if(p<lo||p>hi){ok=false;break;}continue;}
    let a=(lo-p)/d,b=(hi-p)/d;if(a>b){const s=a;a=b;b=s;}if(a>t0)t0=a;if(b<t1)t1=b;if(t0>t1){ok=false;break;}}
   if(ok)spans.push([t0,t1]);}
  spans.sort((p,q)=>p[0]-q[0]);let reach=0;
  for(const [a,b] of spans){if(a>reach+1e-6)return false;if(b>reach)reach=b;}
  return reach>=1-1e-6;
 }
 /* Can the camera at eye {x,y,z} see a person standing at {x,z}? Errs on the side of yes. */
 function sees(rects,eye,p,cfg=config){
  if(!cfg.enabled||eye.y>cfg.eyeMax)return true;
  const dx=p.x-eye.x,dz=p.z-eye.z,d=Math.hypot(dx,dz);if(d<cfg.near)return true;
  if(!within(rects,eye.x,eye.z,cfg.margin)||!within(rects,p.x,p.z,cfg.margin))return true;   // someone (or the camera) not in a street: no opinion, so shown
  if(clear(rects,eye.x,eye.z,p.x,p.z,cfg.margin))return true;
  const sx=-dz/d*cfg.spread,sz=dx/d*cfg.spread;
  return clear(rects,eye.x,eye.z,p.x+sx,p.z+sz,cfg.margin)||clear(rects,eye.x,eye.z,p.x-sx,p.z-sz,cfg.margin);
 }
 /* Hysteresis for one person: s={hidden,lost}. Shown at once when seen; hidden after cfg.hideAfter seconds unseen. Returns s.hidden. */
 function track(s,seen,dt,cfg=config){if(seen){s.lost=0;s.hidden=false;}else{s.lost+=dt;if(s.lost>=cfg.hideAfter)s.hidden=true;}return s.hidden;}
 // How often a person this far away has their animation worked out: 1 every frame, 2 every 2nd, 3 every 3rd.
 function rate(dist,cfg=config){let n=1;for(const [d,k] of cfg.anim)if(dist>d)n=k;return n;}
 // Whether the face pieces are dropped at this distance, given whether they are now (two thresholds, so they do not blink at the line).
 const dropDetail=(was,dist,cfg=config)=>was?dist>cfg.detail[0]:dist>cfg.detail[1];
 // The street's own ambient people, by the marks their makers leave on them.
 const ambient=m=>!!m&&!!(m.nightlife||m.alley||m.club||(m.ambient&&/^crew-/.test(m.character||'')));
 const pure={config,open,within,clear,sees,track,rate,dropDetail,ambient};
 if(typeof module==='object'&&module.exports){module.exports=pure;return;}

 /* start({scene}) -> {tick(), stats(), dispose()}. Call tick once a frame after the people have been moved. */
 function start({scene,B=root.BABYLON,crowd=root.VoidCrowd,cfg=config,now=()=>performance.now()}){
  const rects=open(),states=new WeakMap(),ours=new WeakSet(),all=new Set(),ref=Math.tan(1.05/2);let disposed=false,frame=0,last=null,count={people:0,hidden:0,paused:0,slowed:0,plain:0};
  // Draw or do not draw a figure's pieces. Only pieces this module hid are ever switched back on; pieces added while hidden (gear arrives a moment after a figure) are caught by the periodic repaint.
  function paint(node,s){
   for(const m of node.getChildMeshes()){const off=s.hidden||(s.plain&&(cfg.detailParts.test(m.name)||cfg.detailParts.test(m.material?.name||'')));
    if(off){if(m.isVisible){m.isVisible=false;ours.add(m);}}else if(ours.has(m)){m.isVisible=true;ours.delete(m);}}
   s.painted=frame;}
  function tick(){
   if(disposed||!crowd?.figures)return;const cam=scene.activeCamera;if(!cam)return;frame++;
   const t=now(),dt=last===null?0:Math.min(1,Math.max(0,(t-last)/1000));last=t;
   const eye=cam.globalPosition,on=cfg.enabled,planes=B.Frustum.GetPlanes(cam.getTransformationMatrix()),zoom=Math.tan((cam.fov||1.05)/2)/ref,c={people:0,hidden:0,paused:0,slowed:0,plain:0};
   for(const f of crowd.figures()){const node=f.node;if(!node||node.isDisposed?.()||!ambient(node.metadata))continue;
    let s=states.get(f);if(!s){s={hidden:false,lost:0,plain:false,applied:false,wasPlain:false,painted:0,salt:all.size};states.set(f,s);all.add(f);}
    if(!node.isEnabled()){f.lod?.(1,dt);continue;}   // switched off by its owner (too far, round a corner, the frame-rate governor): nothing to add
    c.people++;const p=node.getAbsolutePosition(),d=Math.hypot(p.x-eye.x,p.z-eye.z);
    track(s,sees(rects,eye,p,cfg),dt,cfg);
    s.plain=on&&!s.hidden&&dropDetail(s.plain,d*zoom,cfg);
    if(s.hidden!==s.applied||s.plain!==s.wasPlain||((s.hidden||s.plain)&&(frame+s.salt)%45===0)){paint(node,s);s.applied=s.hidden;s.wasPlain=s.plain;}
    // Animation: none while hidden or well outside the camera's view; every 2nd or 3rd frame far away.
    let view=!s.hidden;
    if(view&&on&&d>4)for(const pl of planes)if(pl.normal.x*p.x+pl.normal.y*(p.y+1)+pl.normal.z*p.z+pl.d<-cfg.frustum){view=false;break;}
    f.setCulled?.(!view);const n=view&&on?rate(d*zoom,cfg):1;f.lod?.(n,dt);
    if(s.hidden)c.hidden++;else if(!view)c.paused++;else if(n>1)c.slowed++;if(s.plain)c.plain++;}
   count=c;
  }
  function dispose(){if(disposed)return;disposed=true;
   for(const f of all){const s=states.get(f),node=f.node;if(!s||!node||node.isDisposed?.())continue;s.hidden=s.plain=false;try{paint(node,s);f.setCulled?.(false);f.lod?.(1,0);}catch{}}all.clear();}
  return {tick,dispose,stats:()=>({...count}),hidden:()=>[...all].filter(f=>states.get(f)?.hidden&&!f.node.isDisposed?.()).map(f=>f.node),rects,config:cfg};
 }
 root.VoidStreetSight={...pure,start};
})(typeof globalThis!=='undefined'?globalThis:this);
