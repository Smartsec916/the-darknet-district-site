/* VESPER TERRAIN: the land around the Ward Repair yard and along the road, drawn as streamed chunks (browser only; the heights are vesper-world.js height()).
   It replaced the single ring mesh (vesper-visuals.js mountainRing, inner 245 m, outer 1350 m) when the road was carried through the pass and on for kilometres:
   - A quadtree of square chunks over a 16 km square around Vesper. Every chunk is a 33 x 33 grid (17 x 17 on Low) with a skirt; the smallest chunks are 128 m
     (4 m between vertices) and each level up doubles. A chunk is split while the camera is within SPLIT x its size of it, so the ground under the player is
     always the finest and the far ranges are coarse; fog hides the rest.
   - NO LOADING PAUSE: chunks are generated a few rows at a time inside a per-frame time budget (BUDGET_MS), nearest first. A chunk is only swapped in when all four
     of its children are ready (the parent stays on screen until then), so the ground never has holes and the frame never waits for it.
   - The initial set around the camera is built at scene creation (inside the existing workshop loading card), so the first frame is complete.
   - Look: vertex colours from slope, height and what the road did to the ground (bench gravel, cut faces, fill), over a neutral grit texture tiled in world space.
     Inside the yard (r < 243 m) the chunks sink under the sand plane, so the yard's own ground is unchanged.
   - Chunks far from the road keep only their road-aware coarse heights: a coarse chunk near the road is pulled down to just under the road, so a distant road is
     never hidden inside a coarse hill (the near, fine chunks follow the land exactly). */
(function(root){
 'use strict';
 if(typeof document==='undefined')return;
 const ROOT={x0:-8192,z0:-8192,size:16384},SPLIT=1.15,KEEP_S=25,FAR=3700;
 function smooth(a,b,x){const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);}
 function create({scene,parent,quality,camera}){
  const B=root.BABYLON,W=root.VoidVesperWorld,V=root.VoidVesperVisuals;if(!B||!W)return null;
  const low=quality==='low',N=low?32:64,LEAF=256,BUDGET=low?3:4.5;
  const mat=new B.PBRMaterial('vesper-terrain-chunks',scene);mat.albedoColor=B.Color3.White();mat.roughness=.96;mat.metallic=0;mat.environmentIntensity=.6;mat.backFaceCulling=true;
  const tex=V.surfaceTexture(B,scene,'terrain-grit','soil','#d9d2c7',quality);tex.uScale=tex.vScale=1;mat.albedoTexture=tex;
  const nodes=new Map(),queue=[];let job=null,frame=0,stats={chunks:0,shown:0,built:0,ms:0,maxMs:0};
  const key=(l,i,j)=>l+':'+i+':'+j;
  function get(l,i,j){const k=key(l,i,j);let n=nodes.get(k);if(!n){const size=ROOT.size/2**l;n={k,l,i,j,size,x0:ROOT.x0+i*size,z0:ROOT.z0+j*size,mesh:null,used:0,queued:false,shown:false};nodes.set(k,n);}return n;}
  const kids=n=>[get(n.l+1,n.i*2,n.j*2),get(n.l+1,n.i*2+1,n.j*2),get(n.l+1,n.i*2,n.j*2+1),get(n.l+1,n.i*2+1,n.j*2+1)];
  let cam={x:0,y:2,z:0};
  const dist=n=>{const dx=Math.max(n.x0-cam.x,0,cam.x-(n.x0+n.size)),dz=Math.max(n.z0-cam.z,0,cam.z-(n.z0+n.size));return Math.hypot(dx,dz,Math.max(0,cam.y-150));};
  const want=n=>n.size>LEAF&&dist(n)<SPLIT*n.size;

  // ---- one chunk's mesh, built a few rows per call (a generator) ----
  function* make(n){
   const t0=performance.now();const sp=n.size/N,G=N+3,H=new Float32Array(G*G),D=new Float32Array(G*G),E=new Float32Array(G*G),NAT=new Float32Array(G*G),info={};
   const coarse=sp>=8;
   for(let r=0;r<G;r++){for(let c=0;c<G;c++){const x=n.x0+(c-1)*sp,z=n.z0+(r-1)*sp,R=Math.hypot(x,z);let h=W.height(x,z,info);
     if(coarse&&info.d<info.bench+sp*1.2)h=Math.min(h,Math.max(info.e-.45,-.03));
     if(R<W.YARD_R-2)h=-.6;   // under the yard's sand plane
     H[r*G+c]=h;D[r*G+c]=info.d;E[r*G+c]=info.e;NAT[r*G+c]=info.natural;}
    yield;}
   const V1=N+1,count=V1*V1+4*V1,pos=new Float32Array(count*3),nor=new Float32Array(count*3),col=new Float32Array(count*4),uv=new Float32Array(count*2);
   let v=0;const put=(x,y,z,nx,ny,nz,c)=>{pos.set([x,y,z],v*3);nor.set([nx,ny,nz],v*3);col.set(c,v*4);uv.set([x/7,z/7],v*2);v++;};
   const colors=[];
   for(let r=0;r<V1;r++){if(r%8===7)yield;for(let c=0;c<V1;c++){const g=(r+1)*G+(c+1),h=H[g],x=n.x0+c*sp,z=n.z0+r*sp;
    let nx=H[g-1]-H[g+1],nz=H[g-G]-H[g+G],ny=2*sp;const l=Math.hypot(nx,ny,nz);nx/=l;ny/=l;nz/=l;
    const slope=smooth(.55,.9,1-ny),d=D[g],e=E[g],cut=NAT[g]-h,grain=.92+.16*((Math.sin(x*.37+z*.11)*Math.sin(z*.29-x*.07))*.5+.5);
    const band=Math.sin(h*.38+Math.sin(x*.01)*3+Math.cos(z*.013)*3),strata=1+.12*band*slope,varnish=1-.28*smooth(30,140,h)*slope;
    let cr=(.80*(1-slope)+.62*slope)*grain*strata*varnish,cg=(.62*(1-slope)+.37*slope)*grain*strata*varnish,cb=(.45*(1-slope)+.26*slope)*grain*strata*varnish;
    // the road's bench: compacted, darker gravel; a cutting's face: paler broken rock and scree at its foot; a fill bank: loose spoil
    const bench=1-smooth(W.benchAt(0),W.benchAt(0)+5,d);
    if(d<60){const nearRoad=1-smooth(6,14,d);if(cut>1.5){const k=smooth(1.5,8,cut)*(1-smooth(30,60,d));cr=cr*(1-k)+.66*k*grain;cg=cg*(1-k)+.58*k*grain;cb=cb*(1-k)+.50*k*grain;}
     else if(cut<-1){const k=smooth(1,5,-cut)*(1-smooth(20,45,d));cr=cr*(1-k)+.70*k*grain;cg=cg*(1-k)+.55*k*grain;cb=cb*(1-k)+.42*k*grain;}
     const k=Math.max(bench,nearRoad*.6);cr=cr*(1-k)+.58*k*grain;cg=cg*(1-k)+.49*k*grain;cb=cb*(1-k)+.40*k*grain;}
    put(x,h,z,nx,ny,nz,[Math.min(1,cr),Math.min(1,cg),Math.min(1,cb),1]);}}
   // skirt: a copy of the border pulled down, so a coarser neighbour never shows a crack
   const drop=2+sp*.8,border=[];for(let c=0;c<V1;c++)border.push(c);for(let r=1;r<V1;r++)border.push(r*V1+N);for(let c=N-1;c>=0;c--)border.push(N*V1+c);for(let r=N-1;r>0;r--)border.push(r*V1);
   const skirt0=v;for(const b of border){put(pos[b*3],pos[b*3+1]-drop,pos[b*3+2],nor[b*3],nor[b*3+1],nor[b*3+2],[col[b*4]*.8,col[b*4+1]*.8,col[b*4+2]*.8,1]);}
   const idx=[];for(let r=0;r<N;r++)for(let c=0;c<N;c++){const a=r*V1+c,b=a+V1;idx.push(a,a+1,b,a+1,b+1,b);}
   for(let k=0;k<border.length;k++){const a=border[k],b=border[(k+1)%border.length],sa=skirt0+k,sb=skirt0+(k+1)%border.length;idx.push(a,sa,b,b,sa,sb,a,b,sa,b,sb,sa);}
   yield;
   const mesh=new B.Mesh('vesper-terrain-'+n.k,scene),vd=new B.VertexData();vd.positions=pos.subarray(0,v*3);vd.normals=nor.subarray(0,v*3);vd.colors=col.subarray(0,v*4);vd.uvs=uv.subarray(0,v*2);vd.indices=idx;vd.applyToMesh(mesh,false);
   mesh.parent=parent;mesh.material=mat;mesh.isPickable=false;mesh.receiveShadows=false;mesh.setEnabled(false);mesh.freezeWorldMatrix();mesh.doNotSyncBoundingInfo=true;
   n.mesh=mesh;stats.built++;stats.chunks++;const ms=performance.now()-t0;stats.ms+=ms;return mesh;
  }
  function request(n){if(n.mesh||n.queued)return;n.queued=true;queue.push(n);}
  function work(budget){const end=performance.now()+budget;
   while(performance.now()<end){
    if(!job){queue.sort((a,b)=>(a.l-b.l)||dist(a)-dist(b));let n=null;while(queue.length&&!n){const q=queue.shift();if(frame-q.used<3||q.l<2)n=q;else q.queued=false;}if(!n)return;job={n,gen:make(n)};}
    const t0=performance.now();const r=job.gen.next();stats.maxMs=Math.max(stats.maxMs,performance.now()-t0);if(r.done){job.n.queued=false;job=null;}
   }}
  // ---- selection: what is drawn this frame ----
  // beyond the camera's far plane (babylon-renderer.js maxZ 3500) nothing is drawn, so chunks wholly past FAR are neither built nor shown
  function select(){const shown=[];const visit=n=>{if(n.l>0&&dist(n)>FAR)return true;n.used=frame;if(!n.mesh){request(n);return false;}
    if(want(n)){const k=kids(n);let ready=true;for(const c of k){if(dist(c)>FAR)continue;c.used=frame;if(!c.mesh){request(c);ready=false;}}if(ready){for(const c of k)visit(c);return true;}}
    shown.push(n);return true;};
   visit(get(0,0,0));
   for(const n of nodes.values())if(n.shown&&!shown.includes(n)){n.shown=false;n.mesh?.setEnabled(false);}
   for(const n of shown)if(!n.shown){n.shown=true;n.mesh.setEnabled(true);}
   stats.shown=shown.length;}
  // drop chunks unused for a while (memory), never the top two levels (the fallback under everything)
  function evict(){for(const [k,n] of nodes)if(n.mesh&&!n.shown&&n.l>1&&frame-n.used>60*KEEP_S){n.mesh.dispose();n.mesh=null;stats.chunks--;}}
  function setCam(p){if(p)cam={x:p.x,y:p.y,z:p.z};}
  // the first picture: build everything the camera needs now, without a budget (inside the scene's loading card)
  function prepare(p){setCam(p);for(let guard=0;guard<40;guard++){frame++;select();if(!queue.length&&!job)break;work(1e9);}select();}
  prepare(camera?.position||{x:-3,y:1.7,z:-17});
  // ---- talus: fallen rock at the foot of the road's cuttings and scattered down their faces (thin instances, one host per 400 m of road so the far ones are culled) ----
  const rocks=[],rockMat=new B.PBRMaterial('vesper-talus-rock',scene);rockMat.albedoColor=B.Color3.FromHexString('#8c6c55');rockMat.roughness=.95;rockMat.metallic=0;rockMat.environmentIntensity=.5;
  try{const shapes=[0,1,2].map(k=>{const m=V.boulder(B,scene,'vesper-talus-src-'+k,1,17+k*31,low?'low':'medium');m.material=rockMat;m.isPickable=false;m.setEnabled(false);rocks.push(m);return m;});
   const L=W.centreline(),info={};let seed=9001;const rand=()=>((seed=seed*16807%2147483647)-1)/2147483646;const start=W.usableYard()+20,stepS=low?9:5;let host=null,hostEnd=-1,li=0;
   for(let s=start;s<W.total()-20;s+=stepS){
    if(s>hostEnd){host=shapes.map((m,k)=>{const c=m.clone('vesper-talus-'+Math.round(s)+'-'+k);c.setEnabled(true);c.parent=parent;rocks.push(c);return c;});hostEnd=s+400;}
    while(li<L.length-1&&L[li].s<s)li++;const q=L[li];
    for(const side of [1,-1]){if(rand()<.35)continue;const d=W.benchAt(q.s)+3.2+Math.pow(rand(),1.6)*14,x=q.x-q.tz*d*side,z=q.z+q.tx*d*side,h=W.height(x,z,info),cut=info.natural-h;
     if(cut<2.5&&rand()>.12)continue;const size=(.25+Math.pow(rand(),2.2)*(cut>8?2.2:1.1));
     host[Math.floor(rand()*3)].thinInstanceAdd(B.Matrix.Compose(new B.Vector3(size*(.8+rand()*.5),size*(.6+rand()*.5),size*(.8+rand()*.5)),B.Quaternion.RotationYawPitchRoll(rand()*6.28,(rand()-.5)*.4,(rand()-.5)*.4),new B.Vector3(x,h-size*.12,z)),false);}}
   for(const m of rocks)if(m.thinInstanceCount){m.thinInstanceBufferUpdated('matrix');m.thinInstanceRefreshBoundingInfo(false);}else if(m.parent===parent)m.setEnabled(false);
  }catch(e){console.warn('[VOID Vesper] talus skipped',e.message);}
  return root.VoidVesperTerrain.last={
   material:mat,stats,
   tick(p){frame++;setCam(p);select();work(BUDGET);if(frame%120===0)evict();},
   prepare,
   // every chunk the camera needs right now is built (for tests: a zone swap that is complete)
   get settled(){return !queue.length&&!job;},
   dispose(){for(const n of nodes.values())n.mesh?.dispose();nodes.clear();for(const m of rocks)m.dispose();rockMat.dispose();mat.dispose();tex.dispose();}
  };
 }
 root.VoidVesperTerrain={create,ROOT,SPLIT};
})(globalThis);
