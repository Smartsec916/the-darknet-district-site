/* STREET GLOW: a little more coloured light where NeoChinatown is dark (the owner, 18 Nov 2026: "lets add a little more colored lights to NeoChinaTown where dark.
   I also noticed The Outskirts are dark too"). Art direction: docs/VOID_RUNNER_ART_DIRECTION.md (PERMANENT DIRECTION): motivated, practical sources that belong to the
   street, pools of light with shadow between them, accent not outline, no wash.
   - Main Street, the Avenue and Far South: wherever a 7 m stretch of pavement has no light pool of the city's own within reach (shop-sign spill, wall lamps), one
     fixture is put up there: a strip light under the awning, a vending machine set into the shop wall, a short row of hanging paper lanterns, or a small neon tube
     sign. Strings of paper lanterns hang across the street where its middle is darkest.
   - The Outskirts: makeshift light, placed by hand among the containers: sodium work lamps, string lights, two more fire barrels and a few flickering tubes.
   NO REAL LIGHTS: every source is an unlit emissive mesh with a soft additive pool on the ground (and a faint wash on the wall behind), merged into one mesh per
   colour, so a quarter costs a handful of draw calls whatever the number of fixtures. Low keeps the fixtures and their ground pools, drops the wall washes, the
   flicker and the lanterns across the street.
   PURE PART (Node, tests/ncz-street-glow.test.cjs): COLORS, FRONTS, OUTSKIRTS, plan({quarter, lit, quality}). BROWSER PART: start({B, scene, parent, quality, quarter, lit})
   -> {tick(dt), stats(), dispose()}. Started by neochinatown.js with the street, after the city's own pools are known. No collision, no interaction, no save state. */
(function(root){
 'use strict';
 // The existing palette (neochinatown.js signs and washes): magenta, cyan, amber, teal; sodium and warm bulbs for the Outskirts' makeshift light.
 const COLORS={magenta:'#ff4fc8',cyan:'#38e8ff',amber:'#ffb050',teal:'#2fd6b8',sodium:'#ff9a3a',bulb:'#ffc87a',paper:'#ff6a4a'};
 /* The street faces with a 3 m pavement in front (the same walls neochinatown.js lines with shopfronts): a point on the wall, the direction along it (t), the normal
    into the street (n), its length, and where it is open (side streets, gates, NULL's and Milked's fronts) as [from, to] along t's axis. Pavement top: 0.18 m. */
 const FRONTS=[
  {id:'avenue-s',quarter:'avenue',x:2,z:-20.12,tx:1,tz:0,nx:0,nz:1,len:150,open:[[0,12],[49,73],[142,152]]},
  {id:'avenue-n',quarter:'avenue',x:2,z:-4.88,tx:1,tz:0,nx:0,nz:-1,len:150,open:[[0,12],[142,152]]},
  {id:'main-w',quarter:'oldtown',x:50.88,z:-124,tx:0,tz:1,nx:1,nz:0,len:104,open:[[-124,-112],[-121,-116],[-70,-47],[-29,-20]]},
  {id:'main-e',quarter:'oldtown',x:71.12,z:-124,tx:0,tz:1,nx:-1,nz:0,len:104,open:[[-124,-119],[-63.5,-53.5],[-29,-20]]},
  {id:'farsouth-w',quarter:'far-south',x:50.88,z:-218,tx:0,tz:1,nx:1,nz:0,len:88,open:[[-218,-213],[-135,-130]]},
  {id:'farsouth-e',quarter:'far-south',x:71.12,z:-218,tx:0,tz:1,nx:-1,nz:0,len:88,open:[[-218,-213],[-176,-166.5],[-195.5,-188],[-135,-130]]}];
 // Across the street: lantern strings between the facing walls (street, axis, from, to, step).
 const ACROSS=[{quarter:'oldtown',axis:'z',a:51,b:71,from:-114,to:-30,step:12},{quarter:'far-south',axis:'z',a:51,b:71,from:-208,to:-138,step:12},{quarter:'avenue',axis:'x',a:-19.9,b:-5.1,from:16,to:140,step:14}];
 /* The Outskirts (ncz-containers.js PLAN: the hub x 36..92, z -260..-224; the west lane ends at the container at x 22.5, the east lane at x 105.5).
    lamp: a sodium work lamp (pole or clamped to a container) [x, y, z, pool size]; string: bulbs between two points [[x,y,z],[x,y,z], colour];
    fire: a barrel fire [x, z]; tube: a bare fluorescent tube on a wall [x, y, z, facing ('n'|'s'|'e'|'w'), colour]. */
 const OUTSKIRTS={
  lamps:[[24.1,2.6,-243,7,'w'],[103.9,2.6,-245.5,7,'e'],[70,3.2,-230,8,'pole'],[86.5,3.2,-241,8,'pole'],[46.5,2.7,-253.4,7,'pole'],[31,3,-241,6,'pole']],
  strings:[[[39.6,2.8,-231.5],[61,4.05,-232.2],'bulb'],[[61,4.05,-232.2],[88.5,2.9,-232.5],'bulb'],[[48.6,2.8,-241.7],[64.8,2.6,-241.6],'teal'],[[66.6,2.4,-246.4],[88.5,2.7,-251],'bulb'],
   [[42.5,2.5,-256.7],[86,2.5,-256.7],'bulb'],[[25,2.6,-240.6],[35.6,2.8,-240.6],'magenta'],[[93,2.7,-240.6],[103.4,2.6,-240.6],'bulb']],
  fires:[[27.8,-248.4],[100.6,-247.2],[79.5,-229]],
  tubes:[[51.5,2.3,-256.74,'n','teal'],[76,2.2,-246.76,'n','cyan'],[80.76,2.1,-235,'w','magenta'],[39.44,2.2,-229.5,'e','teal'],[57.7,2.3,-256.74,'n','cyan']]};
 const KINDS=['strip','lanterns','vending','strip','tube','strip','vending','lanterns'];
 const PAVE=3,TOP=.18,STEP=7,DARK=5;
 const hash=(...a)=>{let h=2166136261;for(const v of a){h^=Math.round(v*100);h=Math.imul(h,16777619)>>>0;}h^=h>>>15;h=Math.imul(h,2246822507)>>>0;h^=h>>>13;return h>>>0;};
 const onWall=(f,s)=>[f.x+f.tx*s,f.z+f.tz*s];
 const isOpen=(f,c)=>f.open.some(([a,b])=>c>a-1&&c<b+1);
 /* plan({quarter, lit, quality}) -> fixtures. quarter null = the whole city. lit: [[x, z], ...] the city's own light pools (neochinatown.js). */
 function plan({quarter=null,lit=[],quality='medium'}={}){
  const low=quality==='low',out=[],mine=[],near=(x,z,r,list=lit)=>list.some(([a,b])=>Math.hypot(a-x,b-z)<r),want=q=>!quarter||quarter===q;
  for(const f of FRONTS){if(!want(f.quarter))continue;
   for(let s=STEP/2;s<f.len-1;s+=STEP){const w=onWall(f,s),c=f.tx?w[0]:w[1];if(isOpen(f,c))continue;
    const p=[w[0]+f.nx*PAVE/2,w[1]+f.nz*PAVE/2];if(near(p[0],p[1],DARK)||near(p[0],p[1],DARK,mine))continue;
    const h=hash(p[0],p[1]),kind=KINDS[h%KINDS.length],color=kind==='lanterns'?(h>>>4)%2?'paper':'amber':['magenta','cyan','amber','teal'][(h>>>3)%4];
    out.push({kind,front:f.id,quarter:f.quarter,x:w[0],z:w[1],nx:f.nx,nz:f.nz,tx:f.tx,tz:f.tz,color});mine.push(p);}}
  if(!low)for(const a of ACROSS){if(!want(a.quarter))continue;for(let c=a.from;c<=a.to;c+=a.step){const mid=a.axis==='z'?[(a.a+a.b)/2,c]:[c,(a.a+a.b)/2];if(near(mid[0],mid[1],7))continue;
   const ends=a.axis==='z'?[[a.a,c],[a.b,c]]:[[c,a.a],[c,a.b]];out.push({kind:'across',quarter:a.quarter,ends,color:hash(c)%3?'paper':'amber'});}}
  if(want('outskirts')){for(const [x,y,z,size,mount] of OUTSKIRTS.lamps)out.push({kind:'worklamp',quarter:'outskirts',x,y,z,size,mount,color:'sodium'});
   for(const [a,b,color] of OUTSKIRTS.strings)out.push({kind:'string',quarter:'outskirts',a,b,color});
   for(const [x,z] of OUTSKIRTS.fires)out.push({kind:'fire',quarter:'outskirts',x,z,color:'sodium'});
   for(const [x,y,z,face,color] of OUTSKIRTS.tubes)out.push({kind:'tube-bare',quarter:'outskirts',x,y,z,face,color,flicker:!low});}
  return out;}
 const api={COLORS,FRONTS,ACROSS,OUTSKIRTS,plan,config:{DARK,STEP,PAVE,TOP}};
 if(typeof module!=='undefined'&&module.exports){module.exports=api;return;}

 /* ---------------- browser ---------------- */
 function start({B=root.BABYLON,scene,parent,quality='medium',quarter=null,lit=[]}){
  const low=quality==='low',fixtures=plan({quarter,lit:lit.slice(),quality}),own=[],groups=new Map(),flick=[],fires=[];
  const hex=c=>B.Color3.FromHexString(COLORS[c]||c);
  // one unlit emissive material per colour (the glow), one additive pool material per colour
  const glowMats={},darkMat=(()=>{const m=new B.StandardMaterial('ncz-glow-housing',scene);m.diffuseColor=new B.Color3(.05,.055,.06);m.specularColor=new B.Color3(.12,.12,.13);own.push(m);return m;})();
  // one glow material per colour; ONE additive material for every pool and wash (white falloff, coloured per vertex), kept out of the glow layer
  const glowMat=c=>{if(glowMats[c])return glowMats[c];const m=new B.StandardMaterial('ncz-glow-'+c,scene);m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.emissiveColor=hex(c).scale(1.1);m.disableLighting=true;own.push(m);return glowMats[c]=m;};
  const poolTex=(()=>{const t=new B.DynamicTexture('ncz-glow-pool',{width:128,height:128},scene,true),g=t.getContext(),r=g.createRadialGradient(64,64,1,64,64,64);
   r.addColorStop(0,'#fff');r.addColorStop(.35,'rgba(255,255,255,.72)');r.addColorStop(.7,'rgba(255,255,255,.26)');r.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle='#000';g.fillRect(0,0,128,128);g.fillStyle=r;g.fillRect(0,0,128,128);t.update();own.push(t);return t;})();
  const newPool=name=>{const m=new B.StandardMaterial(name,scene);m.diffuseTexture=poolTex;m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.emissiveColor=B.Color3.White();m.disableLighting=true;m.alphaMode=B.Engine.ALPHA_ADD;m.alpha=.99;m.disableDepthWrite=true;m.backFaceCulling=false;own.push(m);return m;},poolAll=newPool('ncz-glow-pool');
  // the fires share one breathing material pair, the flickering tubes another (a few draw calls, not one per fixture)
  let fireTop=null,firePool=null,flickGlow=null,flickPool=null;
  const poolKey=new Set();
  const tint=(mesh,c,k)=>{k*=low?.72:1;const col=hex(c),n=mesh.getTotalVertices(),a=new Float32Array(n*4);for(let i=0;i<n;i++){a[i*4]=col.r*k;a[i*4+1]=col.g*k;a[i*4+2]=col.b*k;a[i*4+3]=1;}mesh.setVerticesData(B.VertexBuffer.ColorKind,a,false,4);return mesh;};
  const put=(mesh,mat,key=mat)=>{mesh.material=mat;mesh.isPickable=false;mesh.receiveShadows=false;if(!groups.has(key))groups.set(key,{mat,list:[]});groups.get(key).list.push(mesh);return mesh;};
  const box=(w,h,d,x,y,z,mat,key)=>{const m=B.MeshBuilder.CreateBox('ncz-glow-part',{width:w,height:h,depth:d},scene);m.position.set(x,y,z);return put(m,mat,key);};
  const pool=(c,x,y,z,w,d,k,key,mat)=>{const m=tint(B.MeshBuilder.CreateGround('ncz-glow-pool',{width:w,height:d},scene),c,k);m.position.set(x,y,z);poolKey.add(key||mat||poolAll);return put(m,mat||poolAll,key||mat);};
  // a wall wash: a vertical additive plane just off the wall, facing the street (skipped on Low)
  const wash=(c,x,y,z,nx,nz,w,h,k,key)=>{if(low)return null;const m=tint(B.MeshBuilder.CreatePlane('ncz-glow-wash',{width:w,height:h},scene),c,k);m.position.set(x+nx*.12,y,z+nz*.12);m.rotation.y=Math.atan2(-nx,-nz);poolKey.add(key||poolAll);return put(m,poolAll,key);};
  const sphere=(r,x,y,z,mat,key,seg=4)=>{const m=B.MeshBuilder.CreateSphere('ncz-glow-bulb',{diameter:r*2,segments:seg},scene);m.position.set(x,y,z);return put(m,mat,key);};
  const cyl=(r,h,x,y,z,mat,key,t=8)=>{const m=B.MeshBuilder.CreateCylinder('ncz-glow-cyl',{diameter:r*2,height:h,tessellation:t},scene);m.position.set(x,y,z);return put(m,mat,key);};
  const sag=(a,b,n,drop)=>{const pts=[];for(let i=0;i<=n;i++){const t=i/n;pts.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t-Math.sin(Math.PI*t)*drop,a[2]+(b[2]-a[2])*t]);}return pts;};
  const wire=(pts,key)=>{const m=B.MeshBuilder.CreateTube('ncz-glow-wire',{path:pts.map(p=>new B.Vector3(...p)),radius:.012,tessellation:3},scene);return put(m,darkMat,key);};
  const counts={};
  for(const f of fixtures){counts[f.kind]=(counts[f.kind]||0)+1;const c=f.color,y0=TOP;
   // the point at a distance `d` out from the wall, `s` along it
   const at=(s,d)=>[f.x+f.tx*s+f.nx*d,f.z+f.tz*s+f.nz*d],along=(w,d,h)=>f.tx?[w,h,d]:[d,h,w];
   if(f.kind==='strip'){   // a strip light under the awning's front edge (the awning: 3.4 m up, 1.2 m deep from 0 to 1.2 m out)
    const [x,z]=at(0,1.05);box(...along(4.6,.05,.035),x,3.31,z,glowMat(c));box(...along(4.8,.07,.06),x,3.35,z,darkMat);
    const [px,pz]=at(0,1.5);pool(c,px,y0+.012,pz,f.tx?5.6:3.2,f.tx?3.2:5.6,1.15);wash(c,...at(0,0).flatMap((v,i)=>i?[1.9,v]:[v]),f.nx,f.nz,5.2,3,.42);}
   else if(f.kind==='vending'){   // a vending machine set into the shop wall: dark body, a lit front, a pool on the pavement in front of it
    const [x,z]=at(0,.16);box(...along(.95,1.9,.32),x,y0+.95,z,darkMat);const [fx,fz]=at(0,.33);box(...along(.68,1.25,.02),fx,y0+1.15,fz,glowMat(c));box(...along(.68,.12,.02),fx,y0+1.95,fz,glowMat(c));
    const [px,pz]=at(0,1.1);pool(c,px,y0+.012,pz,3,3,1.25);wash(c,...at(0,0).flatMap((v,i)=>i?[1.2,v]:[v]),f.nx,f.nz,2.6,2.6,.4);}
   else if(f.kind==='lanterns'){   // a row of paper lanterns hanging from the awning's edge
    for(const s of [-1.8,-.6,.6,1.8]){const [x,z]=at(s,1.1);cyl(.16,.34,x,2.86,z,glowMat(c),undefined,8);box(.02,.36,.02,x,3.18,z,darkMat);}
    const [px,pz]=at(0,1.6);pool(c,px,y0+.012,pz,f.tx?5.8:3.4,f.tx?3.4:5.8,1.05);wash(c,...at(0,0).flatMap((v,i)=>i?[2.6,v]:[v]),f.nx,f.nz,5,2.6,.36);}
   else if(f.kind==='tube'){   // a small neon tube sign on the wall above the awning
    const [x,z]=at(0,.08),g=glowMat(c);box(...along(1.6,.045,.045),x,4.15,z,g);box(...along(1.6,.045,.045),x,4.75,z,g);box(...along(.045,.6,.045),x+(f.tx?-.78:0),4.45,z+(f.tz?-.78:0),g);box(...along(.045,.6,.045),x+(f.tx?.78:0),4.45,z+(f.tz?.78:0),g);
    const [px,pz]=at(0,1.3);pool(c,px,y0+.012,pz,f.tx?4.4:2.8,f.tx?2.8:4.4,.8);wash(c,...at(0,0).flatMap((v,i)=>i?[4.4,v]:[v]),f.nx,f.nz,3.6,3,.36);}
   else if(f.kind==='across'){   // a string of paper lanterns across the street, 6 m up, sagging a little
    const [a,b]=f.ends,A=[a[0],6.3,a[1]],Bp=[b[0],6.3,b[1]],pts=sag(A,Bp,16,.7);wire(pts);
    for(let i=2;i<=14;i+=2){const p=pts[i];cyl(.2,.42,p[0],p[1]-.3,p[2],glowMat(i%4?c:'magenta'),undefined,8);}
    const m=pts[8];pool(c,m[0],.03,m[2],7,7,.34);}
   else if(f.kind==='worklamp'){   // sodium work lamp: on a pole, or clamped to a container wall, angled down; a warm pool on the gravel
    const g=glowMat('sodium');if(f.mount==='pole'){cyl(.045,f.y,f.x,f.y/2,f.z,darkMat,undefined,6);box(.5,.14,.32,f.x,f.y,f.z,darkMat);box(.4,.04,.24,f.x,f.y-.08,f.z,g);pool('sodium',f.x,.065,f.z,f.size,f.size,1);}
    else{const d=f.mount==='w'?1:-1;box(.28,.22,.36,f.x+d*.16,f.y,f.z,darkMat);box(.04,.18,.3,f.x+d*.31,f.y-.02,f.z,g);pool('sodium',f.x+d*2.2,.065,f.z,f.size,f.size,1);
     const m=B.MeshBuilder.CreatePlane('ncz-glow-wash',{width:3.4,height:3},scene);m.position.set(f.x+d*.05,f.y-.6,f.z);m.rotation.y=d>0?-Math.PI/2:Math.PI/2;if(!low)put(tint(m,'sodium',.35),poolAll);else m.dispose();}}
   else if(f.kind==='string'){   // string lights: small bulbs every 0.7 m on a sagging wire
    const len=Math.hypot(f.b[0]-f.a[0],f.b[2]-f.a[2]),n=Math.max(4,Math.round(len/.7)),pts=sag(f.a,f.b,n,Math.min(.9,len*.04));wire(pts);const g=glowMat(c);
    for(let i=1;i<n;i++){const p=pts[i];sphere(.045,p[0],p[1]-.06,p[2],g,undefined,3);}
    for(let i=0;i<=n;i+=Math.max(3,Math.round(n/4))){const p=pts[i];if(i>0&&i<n)pool(c,p[0],.065,p[2],3.6,3.6,.42);}}
   else if(f.kind==='fire'){   // a fire barrel: a lit top and a pool that breathes
    if(!fireTop){fireTop=new B.StandardMaterial('ncz-glow-fire',scene);fireTop.diffuseColor=B.Color3.Black();fireTop.emissiveColor=hex('#ff7a22');fireTop.disableLighting=true;own.push(fireTop);firePool=newPool('ncz-glow-fire-pool');fires.push({top:fireTop,pool:firePool,phase:0});}
    cyl(.32,.85,f.x,.43,f.z,darkMat,undefined,10);cyl(.28,.04,f.x,.86,f.z,fireTop,fireTop,10);pool('#ff8a30',f.x,.065,f.z,5.4,5.4,.95,firePool,firePool);}
   else if(f.kind==='tube-bare'){   // a bare fluorescent tube on a container wall; the teal ones flicker
    const fl=f.flicker&&c==='teal';if(fl&&!flickGlow){flickGlow=glowMat(c).clone('ncz-glow-flicker');own.push(flickGlow);flickPool=newPool('ncz-glow-flicker-pool');flick.push({glow:flickGlow,pool:flickPool,base:flickGlow.emissiveColor.clone(),alpha:flickPool.alpha,next:1.5,off:0,seed:1});}
    const n={n:[0,-1],s:[0,1],e:[1,0],w:[-1,0]}[f.face]||[0,1],g=fl?flickGlow:glowMat(c),pk=fl?flickPool:poolAll;
    box(...(n[0]?[.05,.05,1.3]:[1.3,.05,.05]),f.x+n[0]*.06,f.y,f.z+n[1]*.06,g);pool(c,f.x+n[0]*1.6,.065,f.z+n[1]*1.6,3.6,3.6,.65,pk,pk);
    if(!low){const w=B.MeshBuilder.CreatePlane('ncz-glow-wash',{width:2.8,height:2.6},scene);w.position.set(f.x+n[0]*.04,f.y-.4,f.z+n[1]*.04);w.rotation.y=Math.atan2(-n[0],-n[1]);put(tint(w,c,.45),pk);}}}
  // merge each group into one mesh
  const meshes=[],pools=[];for(const [key,{mat,list}] of groups){let m=list.length>1?B.Mesh.MergeMeshes(list,true,true,undefined,false,false):list[0];if(!m)continue;m.name=(typeof key==='string'?'ncz-glow-'+key:mat.name)+'-merged';m.material=mat;m.parent=parent;m.isPickable=false;m.freezeWorldMatrix?.();meshes.push(m);if(poolKey.has(key))pools.push(m);}
  const unglow=()=>{for(const l of scene.effectLayers||[])if(l.getClassName?.()==='GlowLayer')for(const m of pools)l.addExcludedMesh(m);};unglow();let unglowAt=0;
  let time=0;
  function tick(dt){time+=dt;if(time>unglowAt){unglowAt=time+3;unglow();}
   for(const f of fires){const k=.78+.14*Math.sin(time*7.3+f.phase)+.08*Math.sin(time*13.1+f.phase*3);f.pool.alpha=.99*k;f.top.emissiveColor.set(1*k,.48*k,.13*k);}
   for(const f of flick){if(f.off>0){f.off-=dt;if(f.off<=0){f.glow.emissiveColor.copyFrom(f.base);f.pool.alpha=f.alpha;}}else if(time>f.next){f.off=.04+Math.random()*.1;f.next=time+(f.seed%2?.3+Math.random()*.6:2+Math.random()*5);f.glow.emissiveColor.scaleToRef(.08,f.glow.emissiveColor);f.pool.alpha=f.alpha*.1;}}}
  return {fixtures,meshes,tick,stats:()=>({fixtures:fixtures.length,counts:{...counts},meshes:meshes.length,materials:own.filter(o=>o instanceof B.Material).length,lights:0,flicker:flick.length,fires:fires.length}),
   dispose(){for(const m of meshes)m.dispose();for(const o of own)o.dispose();meshes.length=0;}};}
 api.start=start;
 root.VoidStreetGlow=api;
})(typeof globalThis!=='undefined'?globalThis:this);
