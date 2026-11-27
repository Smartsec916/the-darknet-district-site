/* VESPER: the Ward Repair workshop's modelled exterior and the road out of the yard (docs/development/UNIVERSE_GRAPHICS_TRACKER.md, docs/development/VESPER_ROAD.md).
   opening-scene.js builds the authored workshop (collision, interactions, Mara, the range, the village) exactly as before and calls two hooks:
   - prune(): before its static meshes are merged. Removes the loose scatter stones and scrub that would sit on the road (every tier) and, when the workshop model
     has loaded (Medium and above), the plain fuel cylinder the modelled tank replaces. Nothing functional is touched; the fuel-tank solid stays.
   - dress(): after the shadow setup. Adds the workshop model (tools/assets/universe/build_vesper.py, assets/models/vesper/vesper-workshop.glb: cladding, pitched roof,
     roof plant, door barrel, flood lamps, generator, panels, nozzle, gantry with engine block, fuel tank, yard carts; inside: bridge crane, pendant lamps
     at the existing lights plus one over the back wall (its point light is added here), pegboard, shelving, compressor, air line, bins, lockers) on Medium and above, and the road on every tier:
     a compacted regolith track with tyre ruts, soft shoulders, a parking apron, reflector posts, blank route signs and an open gate (vesper-roadkit.glb pieces).
   The road part is pure and runs in Node too: VoidVesper.road (centre line, width, usable length, parking spot, groundAt()) is what a vehicle drives on.
   If a model fails to load nothing is hidden and the old visuals stay; the road needs no model (its posts and signs are skipped without the kit). */
(function(root){
 'use strict';
 const V=typeof module!=='undefined'?require('./vesper-visuals.js'):root.VoidVesperVisuals;
 const WORKSHOP={id:'vesper:workshop',src:'assets/models/vesper/vesper-workshop.glb'},KIT={id:'vesper:roadkit',src:'assets/models/vesper/vesper-roadkit.glb'};
 // Meshes the workshop model replaces (names from opening-scene.js): the plain fuel cylinder and its cap. The 5 x 5 m 'fuel-tank' solid is layout data and stays.
 const REPLACED=new Set(['fuel-drum','fuel-cap']);
 // Loose dressing that may be cleared off the road surface (non-solid scatter; opening-scene.js places it at random).
 const SCATTER=new Set(['apron-stone','dry-scrub','desert-scrub','village-rock','outcrop']);

 /* ---------------- the road (pure) ----------------
    Control points in Vesper's walking frame (metres; the workshop's open front is at z=1, x -13..13). It leaves the front apron east of the shop, passes north of
    the shooting range (its berm reaches z ~4.5), opens a parking apron beside the yard, goes through an open gate at x~50 and runs east across the flats toward
    the far ranges, between the butte clusters (bearing ~97 deg from the workshop). It is walkable and drivable up to the layout's x bound (opening-data.js
    bounds[0]); beyond that it is scenery that follows the drawn terrain and narrows into the haze. */
 const CONTROL=[[14,5],[22,6.5],[30,8.5],[40,11],[52,12.5],[66,12.5],[82,10.5],[100,7],[125,3],[155,-2],[190,-7],[228,-11],[270,-16],[330,-23],[400,-33],[480,-45],[560,-58],[640,-72],[720,-88],[770,-97]];
 const WIDTH=7,SURFACE_Y=.02,SHOULDER=1.6,FAR_LIFT=.12,X_LIMIT=232,TAPER=140;
 // Clear, flat parking apron beside the road, north of it, east of the Kestrel pad: kept free of props (a parked vehicle goes here).
 const PARKING={center:[38,17.5],size:[8,5],yaw:Math.PI/2};
 let line=null;
 function catmull(p0,p1,p2,p3,t){const t2=t*t,t3=t2*t;return [0,1].map(k=>.5*(2*p1[k]+(-p0[k]+p2[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t2+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t3));}
 // Dense centre line: [{x, z, s (metres from the start), tx, tz (unit tangent)}], about every 1.5 m.
 function centreline(){if(line)return line;const P=CONTROL,pts=[];
  for(let i=0;i<P.length-1;i++){const p0=P[Math.max(0,i-1)],p1=P[i],p2=P[i+1],p3=P[Math.min(P.length-1,i+2)],n=Math.max(2,Math.ceil(Math.hypot(p2[0]-p1[0],p2[1]-p1[1])/1.5));for(let k=0;k<n;k++)pts.push(catmull(p0,p1,p2,p3,k/n));}
  pts.push(P[P.length-1].slice());let s=0;line=pts.map((p,i)=>{if(i)s+=Math.hypot(p[0]-pts[i-1][0],p[1]-pts[i-1][1]);const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)],l=Math.hypot(b[0]-a[0],b[1]-a[1])||1;return {x:p[0],z:p[1],s,tx:(b[0]-a[0])/l,tz:(b[1]-a[1])/l};});return line;}
 const total=()=>centreline()[centreline().length-1].s;
 // Arc length where the centre line reaches the walkable x bound; the vehicle's usable stretch.
 function usableLength(xLimit=X_LIMIT){const L=centreline();for(let i=1;i<L.length;i++)if(L[i].x>=xLimit){const a=L[i-1],b=L[i],f=(xLimit-a.x)/(b.x-a.x);return a.s+(b.s-a.s)*f;}return total();}
 // Nearest centre-line point: {s, x, z, tx, tz, offset (signed: + is left of travel, i.e. the -tz,+tx side), distance}.
 function nearest(x,z){const L=centreline();let best=null;for(let i=0;i<L.length-1;i++){const a=L[i],b=L[i+1],dx=b.x-a.x,dz=b.z-a.z,l2=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/l2)),px=a.x+dx*t,pz=a.z+dz*t,d=Math.hypot(x-px,z-pz);
   if(!best||d<best.distance){const l=Math.sqrt(l2),tx=dx/l,tz=dz/l;best={s:a.s+(b.s-a.s)*t,x:px,z:pz,tx,tz,offset:(x-px)*-tz+(z-pz)*tx,distance:d};}}return best;}
 const halfWidthAt=s=>{const end=total();return WIDTH/2*(s>end-TAPER?Math.max(.15,(end-s)/TAPER):1);};
 function onRoad(x,z){const n=nearest(x,z);return n.distance<=halfWidthAt(n.s);}
 function onParking(x,z){const [cx,cz]=PARKING.center,[w,d]=PARKING.size;return Math.abs(x-cx)<=w/2&&z>=cz-d/2-2.2&&z<=cz+d/2;}
 // Height of the road surface on its centre line at arc length s (flat yard: SURFACE_Y; out on the terrain: the highest drawn ground across its width, plus a lift).
 function roadY(s,quality='medium'){const L=centreline(),f=L.findIndex(p=>p.s>=s),p=L[f<0?L.length-1:f];if(Math.hypot(p.x,p.z)<=V.terrainGrid(quality).inner-WIDTH)return SURFACE_Y;
  const nx=-p.tz,nz=p.tx,h=halfWidthAt(s);return Math.max(V.meshHeight(p.x,p.z,quality),V.meshHeight(p.x+nx*h,p.z+nz*h,quality),V.meshHeight(p.x-nx*h,p.z-nz*h,quality))+FAR_LIFT;}
 // The ground a wheel or a foot stands on at (x, z): the road or parking surface where they are, otherwise the drawn terrain (flat 0 in the yard and the walkable flats).
 function groundAt(x,z,quality='medium'){const r=Math.hypot(x,z),inner=V.terrainGrid(quality).inner;if(r<=inner-WIDTH)return onRoad(x,z)||onParking(x,z)?SURFACE_Y:0;
  const n=nearest(x,z);if(n.distance<=halfWidthAt(n.s))return roadY(n.s,quality);return V.meshHeight(x,z,quality);}
 const road={WIDTH,SURFACE_Y,SHOULDER,X_LIMIT,CONTROL,PARKING,centreline,total,usableLength,nearest,onRoad,onParking,roadY,groundAt,halfWidthAt};

 /* ---------------- browser presentation ---------------- */
 const api={road,WORKSHOP,KIT,REPLACED};
 api.models=quality=>({...(quality!=='low'?{[WORKSHOP.id]:{src:WORKSHOP.src,scale:1}}:{}),[KIT.id]:{src:KIT.src,scale:1}});
 // Before the merge: drop scatter off the road and parking, and the meshes the workshop model replaces (only if it loaded).
 api.prune=({staticMeshes,quality})=>{
  const has=quality!=='low'&&!!root.VoidAssets?.container?.(WORKSHOP.id),drop=new Set();
  for(const m of staticMeshes){if(SCATTER.has(m.name)){const p=m.position,n=nearest(p.x,p.z),r=(m.getBoundingInfo?.().boundingSphere.radiusWorld||1);if(n.distance<=halfWidthAt(n.s)+SHOULDER+r||onParking(p.x,p.z))drop.add(m);}else if(has&&REPLACED.has(m.name))drop.add(m);}
  for(let i=staticMeshes.length-1;i>=0;i--)if(drop.has(staticMeshes[i]))staticMeshes.splice(i,1);
  for(const m of drop)m.dispose();return drop.size;
 };
 api.dress=({scene,parent,quality,shadow})=>{
  const B=root.BABYLON;if(!B||!parent)return null;const owned=[],nodes=[];
  let model=null;if(quality!=='low'){model=root.VoidAssets?.instance?.(WORKSHOP.id,parent)||null;if(model){model.name='vesper-workshop-model';const back=new B.PointLight('vesper-backwall-lamp',new B.Vector3(.5,3.95,-20.4),scene);back.diffuse=B.Color3.FromHexString('#ffc884');back.intensity=30;back.range=11;back.parent=parent;owned.push(back);for(const m of model.getChildMeshes(false)){m.isPickable=false;m.checkCollisions=false;m.receiveShadows=true;if(shadow&&m.getTotalVertices()>0)shadow.addShadowCaster(m,false);}}else console.warn('[VOID Vesper] workshop model unavailable; the plain exterior stays');}
  try{nodes.push(...buildRoad({B,scene,parent,quality,owned}));}catch(e){console.warn('[VOID Vesper] road skipped',e.message);}
  // The utility vehicle (vehicle.js, VoidVehicle.configure) follows the road and terrain height; its parking spot and drivable area stay its own (owner decision).
  try{root.VoidVehicle?.configure?.('vesper',{groundHeight:(x,z)=>road.groundAt(x,z,quality)});}catch(e){console.warn('[VOID Vesper] vehicle ground not set',e.message);}
  return {model,dispose(){for(const n of nodes)n.dispose(false,false);for(const o of owned)o.dispose();}};
 };
 function roadTexture(B,scene,quality){
  const W=256,H=1024,t=new B.DynamicTexture('vesper-road-albedo',{width:W,height:H},scene,true),g=t.getContext();let seed=4021;const rand=()=>((seed=seed*16807%2147483647)-1)/2147483646;
  // u across the carriageway (0 = left edge, 1 = right edge), v along it (one tile = 14 m). Compacted regolith: grey-brown fines, embedded gravel, two polished ruts.
  g.fillStyle='#7f6a55';g.fillRect(0,0,W,H);
  for(let i=0;i<46;i++){const x=rand()*W,y=rand()*H,r=20+rand()*90,f=g.createRadialGradient(x,y,0,x,y,r),c=rand()>.5?'60,48,38':'150,128,104';f.addColorStop(0,'rgba('+c+',.22)');f.addColorStop(1,'rgba('+c+',0)');g.fillStyle=f;g.fillRect(x-r,y-r,r*2,r*2);}
  for(const u of [.27,.73]){const x=u*W;for(let y=0;y<H;y+=2){const w=18+6*Math.sin(y*.013+u*9);const gr=g.createLinearGradient(x-w,0,x+w,0);gr.addColorStop(0,'rgba(52,42,34,0)');gr.addColorStop(.5,'rgba(52,42,34,.34)');gr.addColorStop(1,'rgba(52,42,34,0)');g.fillStyle=gr;g.fillRect(x-w,y,w*2,2);}
   for(let y=0;y<H;y+=7){g.fillStyle='rgba(30,25,21,'+(.12+rand()*.1)+')';g.fillRect(x-9+rand()*2,y,18,2);}}
  for(let i=0;i<(quality==='low'?5000:14000);i++){const x=rand()*W,y=rand()*H,inRut=Math.min(Math.abs(x/W-.27),Math.abs(x/W-.73))<.07,s=inRut?1:1+rand()*2.5;g.fillStyle=rand()>.55?'rgba(200,180,150,'+(.15+rand()*.3)+')':'rgba(35,28,22,'+(.15+rand()*.3)+')';g.fillRect(x,y,s,s);}
  for(let i=0;i<26;i++){const x=rand()*W,y=rand()*H;g.strokeStyle='rgba(40,32,26,.25)';g.lineWidth=1;g.beginPath();g.moveTo(x,y);for(let k=0;k<5;k++)g.lineTo(x+rand()*30-15,y+k*14+rand()*8);g.stroke();}
  t.update();t.wrapU=B.Texture.CLAMP_ADDRESSMODE;t.wrapV=B.Texture.WRAP_ADDRESSMODE;t.anisotropicFilteringLevel=quality==='low'?4:8;return t;
 }
 function shoulderTexture(B,scene){const t=new B.DynamicTexture('vesper-road-shoulder',{width:64,height:256},scene,true),g=t.getContext();let seed=77;const rand=()=>((seed=seed*16807%2147483647)-1)/2147483646;
  // u 0 = outer edge (fades into the sand), u 1 = road edge (loose gravel berm).
  const gr=g.createLinearGradient(0,0,64,0);gr.addColorStop(0,'rgba(140,112,84,0)');gr.addColorStop(.55,'rgba(128,104,80,.55)');gr.addColorStop(1,'rgba(112,92,72,.9)');g.fillStyle=gr;g.fillRect(0,0,64,256);
  for(let i=0;i<900;i++){const x=Math.pow(rand(),.6)*64,y=rand()*256;g.fillStyle='rgba('+(rand()>.5?'190,170,140':'40,32,26')+','+(x/64*.6)+')';g.fillRect(x,y,1+rand()*2,1+rand()*2);}
  t.update();t.hasAlpha=true;t.wrapU=B.Texture.CLAMP_ADDRESSMODE;t.wrapV=B.Texture.WRAP_ADDRESSMODE;return t;}
 function buildRoad({B,scene,parent,quality,owned}){
  const low=quality==='low',L=centreline(),end=total(),nodes=[],step=low?2:1;
  const pts=L.filter((p,i)=>i%step===0||i===L.length-1);
  const mat=new B.PBRMaterial('vesper-road',scene);mat.albedoTexture=roadTexture(B,scene,quality);mat.roughness=.96;mat.metallic=0;mat.environmentIntensity=.5;mat.zOffset=-2;mat.backFaceCulling=false;owned.push(mat,mat.albedoTexture);
  const smat=new B.PBRMaterial('vesper-road-shoulder',scene);smat.albedoTexture=shoulderTexture(B,scene);smat.useAlphaFromAlbedoTexture=true;smat.transparencyMode=B.PBRMaterial.PBRMATERIAL_ALPHABLEND;smat.roughness=1;smat.metallic=0;smat.environmentIntensity=.5;smat.zOffset=-1;smat.backFaceCulling=false;owned.push(smat,smat.albedoTexture);
  const ground=(x,z)=>Math.hypot(x,z)<=V.terrainGrid(quality).inner?.008:V.meshHeight(x,z,quality)+.05;
  // carriageway: one strip of quads, surface at roadY across its width
  const P=[],U=[],I=[],S1=[],S1u=[],S1i=[];
  pts.forEach((p,k)=>{const nx=-p.tz,nz=p.tx,h=halfWidthAt(p.s),y=roadY(p.s,quality),v=p.s/14;
   P.push(p.x+nx*h,y,p.z+nz*h,p.x-nx*h,y,p.z-nz*h);U.push(0,v,1,v);
   if(k){const a=(k-1)*2;I.push(a,a+2,a+1,a+1,a+2,a+3);}
   // shoulders: from the road edge down to the ground, fading out
   for(const side of [1,-1]){const ex=p.x+nx*h*side,ez=p.z+nz*h*side,ox=p.x+nx*(h+SHOULDER)*side,oz=p.z+nz*(h+SHOULDER)*side;S1.push(ex,y-.004,ez,ox,ground(ox,oz),oz);S1u.push(1,v*3.5,0,v*3.5);}
   if(k){const b=(k-1)*4;S1i.push(b,b+4,b+1,b+1,b+4,b+5,b+2,b+6,b+3,b+3,b+6,b+7);}});
  const mesh=(name,positions,uvs,indices,m)=>{const me=new B.Mesh(name,scene),vd=new B.VertexData(),normals=[];B.VertexData.ComputeNormals(positions,indices,normals);for(let i=1;i<normals.length;i+=3)if(normals[i]<0){normals[i-1]*=-1;normals[i]*=-1;normals[i+1]*=-1;}Object.assign(vd,{positions,uvs,indices,normals});vd.applyToMesh(me);me.parent=parent;me.material=m;me.isPickable=false;me.receiveShadows=true;me.alwaysSelectAsActiveMesh=false;nodes.push(me);return me;};
  mesh('vesper-road-surface',P,U,I,mat);mesh('vesper-road-shoulders',S1,S1u,S1i,smat).sideOrientation=B.Mesh.DOUBLESIDE;
  // parking apron: a flat gravel pad joined to the road's north edge
  {const [cx,cz]=PARKING.center,[w,d]=PARKING.size,n=nearest(cx,cz-d/2),edge=n.z+halfWidthAt(n.s)*n.tx-.3,x0=cx-w/2,x1=cx+w/2,z0=Math.min(edge,cz-d/2),z1=cz+d/2;
   mesh('vesper-road-parking',[x0,SURFACE_Y-.002,z0,x1,SURFACE_Y-.002,z0,x1,SURFACE_Y-.002,z1,x0,SURFACE_Y-.002,z1],[0,z0/14,1.1,z0/14,1.1,z1/14,0,z1/14],[0,2,1,0,3,2],mat);
   // soft gravel edges on its three open sides (the fourth joins the road)
   const E=[],Eu=[],Ei=[],y=SURFACE_Y-.004,o=SHOULDER,strip=(ax,az,bx,bz,ox,oz)=>{const k=E.length/3;E.push(ax,y,az,bx,y,bz,bx+ox,.008,bz+oz,ax+ox,.008,az+oz);Eu.push(1,0,1,1,0,1,0,0);Ei.push(k,k+1,k+2,k,k+2,k+3);};
   strip(x0,z0,x0,z1,-o,0);strip(x1,z0,x1,z1,o,0);strip(x0,z1,x1,z1,0,o);mesh('vesper-road-parking-edge',E,Eu,Ei,smat).sideOrientation=B.Mesh.DOUBLESIDE;}
  // kit pieces: reflector posts, blank signs, the open gate (thin instances, one draw call per piece part)
  const kit=root.VoidAssets?.instance?.(KIT.id,parent);
  if(kit){const pieces={};for(const n of kit.getDescendants(false))for(const key of ['kit_post','kit_sign','kit_gate','kit_block'])if(n.name.endsWith(key))pieces[key]=n;
   parent.computeWorldMatrix(true);const inv=parent.getWorldMatrix().clone().invert(),parts={};
   for(const [key,node] of Object.entries(pieces)){parts[key]=[node,...node.getChildMeshes(false)].filter(m=>m.getTotalVertices?.()>0).map(src=>{src.computeWorldMatrix(true);const rel=src.getWorldMatrix().multiply(inv),vd=B.VertexData.ExtractFromMesh(src,true,true);vd.transform(rel);
     if(rel.determinant()<0)for(let i=0;i<vd.indices.length;i+=3){const t=vd.indices[i+1];vd.indices[i+1]=vd.indices[i+2];vd.indices[i+2]=t;}
     const m=new B.Mesh('vesper-'+key,scene);vd.applyToMesh(m);m.material=src.material;m.parent=parent;m.isPickable=false;m.receiveShadows=true;m.alwaysSelectAsActiveMesh=true;nodes.push(m);return m;});}
   kit.dispose(false,false);
   const place=(key,x,y,z,yaw)=>{for(const m of parts[key]||[])m.thinInstanceAdd(B.Matrix.Compose(B.Vector3.One(),B.Quaternion.RotationYawPitchRoll(yaw,0,0),new B.Vector3(x,y,z)),false);};
   const at=s=>{let i=L.findIndex(p=>p.s>=s);if(i<0)i=L.length-1;return L[i];};
   // posts: both edges, every 24 m from the gate out to the usable end, then every 48 m into the distance (fewer on Low)
   const gateS=nearest(50,12.4).s,usable=usableLength(),gap=low?48:24;
   for(let s=gateS+12;s<end-TAPER*.6;s+=s<usable?gap:gap*2){const p=at(s),h=halfWidthAt(p.s)+.7,y=roadY(p.s,quality)-.02,yaw=Math.atan2(p.tx,p.tz);for(const side of [1,-1]){const x=p.x-p.tz*h*side,z=p.z+p.tx*h*side;place('kit_post',x,Math.max(y,ground(x,z)-.05),z,yaw);}}
   // the gate at x~50: pivot post on the north edge, boom raised (open), hut beside it off the road
   {const p=at(gateS),nx=-p.tz,nz=p.tx,h=halfWidthAt(p.s)+.4;place('kit_gate',p.x+nx*h,0,p.z+nz*h,Math.atan2(-nx,-nz));
    for(const d of [-3.2,3.2])place('kit_block',p.x+nx*(h+.2)+p.tx*d*1.5,0,p.z+nz*(h+.2)+p.tz*d*1.5,Math.atan2(p.tx,p.tz));}
   // blank route signs (no text: sign wording is the owner's call): one leaving the gate, one at the edge of the walkable flats, facing outbound traffic
   for(const s of [gateS+30,usable-20]){const p=at(s),h=halfWidthAt(p.s)+2.2;place('kit_sign',p.x+p.tz*h,roadY(p.s,quality)-.02,p.z-p.tx*h,Math.atan2(-p.tx,-p.tz));}
   for(const list of Object.values(parts))for(const m of list){if(!m.thinInstanceCount)m.setEnabled(false);else m.thinInstanceBufferUpdated('matrix');m.thinInstanceRefreshBoundingInfo?.(false);}
  }
  return nodes;
 }
 if(typeof module!=='undefined')module.exports=api;else root.VoidVesper=api;
})(globalThis);
