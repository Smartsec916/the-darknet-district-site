/* Street gear (David, 15 Nov 2026: "Upgrade NPC graphics", two reference pictures of NeoChinatown people): the layered kit the references show on everyone and the
   plain character models lack. Each NPC gets its own mix of
     - a utility belt with a buckle and pouches,
     - a chest harness with a row of pouches,
     - a leg rig (two straps and a holster box) on one or both thighs,
     - knee pads,
     - a forearm bracer with a small lit screen,
     - goggles pushed up on the forehead,
   in dark webbing and gunmetal with one lit accent colour per person (magenta, cyan, acid green, red, amber or violet).
   How: nothing is modelled in a file. The gear is built here, in code, from the measurements of each character file (assets/models/gear/street-fit.json, made by
   tools/assets/gear/street_fit.py: joints, waist, ribs, thighs, knees, forearms, forehead), so it fits all 22 bodies, and it is skinned to the character's own skeleton
   (every vertex 100% to one joint), so it follows every animation with no extra clips. One NPC's whole kit is ONE mesh with ONE shared material (a tiny colour
   palette picks webbing, metal or the lit accent), so it costs one draw call per person.
   Who: every crowd figure (asset-pipeline.js VoidAssets.instance of a `crowd:` model): District residents, street walkers, the alley, the club, Milked, the Corporate
   District. A person's kit is decided by their id, so a named resident wears the same thing on every visit. Players choose their own gear in the creator and are not
   touched; VR companions are not touched.
   The pure part (what a person wears, and the geometry) runs in Node (tests/street-gear.test.cjs). */
(function(root){
 'use strict';
 const ACCENTS=[[1,.16,.72],[.1,.9,1],[.62,1,.12],[1,.14,.16],[1,.62,.08],[.62,.3,1]],CELLS=16,STRAP=0,PLATE=1,GLOW=2,MATTE=8;   /* palette cells: webbing, metal, six lit accents (2..7), the same six as unlit cloth (8..13) */
 const hash=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return h;};
 // a repeatable 0..1 for a person and a question
 const roll=(seed,salt)=>(hash(seed+'/'+salt)%10007)/10007;
 const HATS=new Set(['district-smuggler','order-farmhand','vesper-trader']),SKIP=/^vr-companion/;
 /* People with a kit of their own (David's reference pictures), keyed by who they are. Admin (three pictures, 15 Nov 2026): an older man in a dark utility jacket with
    amber panels and an amber-lit collar, a chest rig and a belt; David prefers him WITHOUT eyewear, so he never gets goggles. Iris keeps her own cyan. */
 const KITS={admin:{belt:true,pouches:2,harness:true,thighs:'',knees:false,bracer:'',goggles:false,jacket:true,accent:4},
  iris:{belt:true,pouches:2,harness:false,thighs:'',knees:false,bracer:'R',goggles:false,jacket:false,accent:1}};
 /* What a person wears: {belt, pouches (2..4), harness, thighs ('', 'L', 'R', 'LR'), knees, bracer ('', 'L', 'R'), goggles, accent (0..5)}. */
 function loadout(seed,look,body){
  if(KITS[seed])return {...KITS[seed]};
  const r=k=>roll(seed,k),skirt=!!body?.skirt,t=r('thigh');
  return {belt:r('belt')<.92,pouches:2+Math.floor(r('pouches')*3),harness:r('harness')<.55,thighs:skirt?'':t<.3?'L':t<.6?'R':t<.75?'LR':'',knees:!skirt&&r('knees')<.35,
   bracer:r('bracer')<.34?'L':r('bracer')<.68?'R':'',goggles:!HATS.has(look)&&r('goggles')<.3,jacket:false,accent:hash(seed+'/accent')%ACCENTS.length};
 }
 // ---- geometry: points are in the character file's own space (x = the character's left, y up, z forward) ----
 const add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],mul=(a,k)=>[a[0]*k,a[1]*k,a[2]*k],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],
  len=a=>Math.hypot(a[0],a[1],a[2]),norm=a=>mul(a,1/(len(a)||1)),lerp=(a,b,t)=>add(a,mul(sub(b,a),t));
 /* A frame: origin o and three unit axes. Local (x, y, z) -> o + x*ax + y*ay + z*az. `up` is the direction the part's own "up" runs (a leg: toward the hip). */
 function frame(o,up){const ay=norm(up);let az=[0,0,1];const d=az[0]*ay[0]+az[1]*ay[1]+az[2]*ay[2];az=norm(sub(az,mul(ay,d)));return {o,ax:cross(ay,az),ay,az};}
 const UPRIGHT=o=>({o,ax:[1,0,0],ay:[0,1,0],az:[0,0,1]});
 function mesh(){return {positions:[],normals:[],uvs:[],indices:[],bone:[],bones:[]};}
 function writer(m,f,bone,cell){
  let bi=m.bones.indexOf(bone);if(bi<0){bi=m.bones.length;m.bones.push(bone);}
  const P=p=>add(add(add(f.o,mul(f.ax,p[0])),mul(f.ay,p[1])),mul(f.az,p[2])),N=n=>norm(add(add(mul(f.ax,n[0]),mul(f.ay,n[1])),mul(f.az,n[2])));
  function quad(a,b,c,d,n,cl=cell){const i=m.positions.length/3,nn=N(n);for(const p of [a,b,c,d]){const w=P(p);m.positions.push(w[0],w[1],w[2]);m.normals.push(nn[0],nn[1],nn[2]);m.uvs.push((cl+.5)/CELLS,.5);m.bone.push(bi);}m.indices.push(i,i+1,i+2,i,i+2,i+3);}
  // a box: centre c, size s (x, y, z), turned by `yaw` about its own up axis
  function box(c,s,yaw=0,cl=cell){const hx=s[0]/2,hy=s[1]/2,hz=s[2]/2,co=Math.cos(yaw),si=Math.sin(yaw),R=p=>[c[0]+p[0]*co+p[2]*si,c[1]+p[1],c[2]-p[0]*si+p[2]*co],Rn=n=>[n[0]*co+n[2]*si,n[1],-n[0]*si+n[2]*co];
   const v=(x,y,z)=>R([x*hx,y*hy,z*hz]);
   quad(v(-1,-1,1),v(1,-1,1),v(1,1,1),v(-1,1,1),Rn([0,0,1]),cl);quad(v(1,-1,-1),v(-1,-1,-1),v(-1,1,-1),v(1,1,-1),Rn([0,0,-1]),cl);
   quad(v(1,-1,1),v(1,-1,-1),v(1,1,-1),v(1,1,1),Rn([1,0,0]),cl);quad(v(-1,-1,-1),v(-1,-1,1),v(-1,1,1),v(-1,1,-1),Rn([-1,0,0]),cl);
   quad(v(-1,1,1),v(1,1,1),v(1,1,-1),v(-1,1,-1),[0,1,0],cl);quad(v(-1,-1,-1),v(1,-1,-1),v(1,-1,1),v(-1,-1,1),[0,-1,0],cl);}
  // a band round the up axis: an ellipse (centre cx, cz; radii rx, rz) from angle a0 to a1 (degrees; 0 = forward, 90 = toward +x), from y0 to y1, `thick` thick. Outer face, top and bottom.
  function band(cx,cz,rx,rz,a0,a1,y0,y1,thick,steps=12,cl=cell){const pt=(t,k)=>[cx+(rx+k)*Math.sin(t),cz+(rz+k)*Math.cos(t)];
   for(let i=0;i<steps;i++){const t0=(a0+(a1-a0)*i/steps)*Math.PI/180,t1=(a0+(a1-a0)*(i+1)/steps)*Math.PI/180,tm=(t0+t1)/2,o0=pt(t0,thick),o1=pt(t1,thick),i0=pt(t0,0),i1=pt(t1,0),n=[Math.sin(tm)/Math.max(rx,1e-6),0,Math.cos(tm)/Math.max(rz,1e-6)];
    quad([o0[0],y0,o0[1]],[o1[0],y0,o1[1]],[o1[0],y1,o1[1]],[o0[0],y1,o0[1]],n,cl);
    quad([o0[0],y1,o0[1]],[o1[0],y1,o1[1]],[i1[0],y1,i1[1]],[i0[0],y1,i0[1]],[0,1,0],cl);quad([i0[0],y0,i0[1]],[i1[0],y0,i1[1]],[o1[0],y0,o1[1]],[o0[0],y0,o0[1]],[0,-1,0],cl);}}
  // a point on the ellipse and the yaw that faces outward there
  const at=(cx,cz,rx,rz,deg,out=0)=>{const t=deg*Math.PI/180;return {x:cx+(rx+out)*Math.sin(t),z:cz+(rz+out)*Math.cos(t),yaw:Math.atan2(Math.sin(t)/Math.max(rx,1e-6),Math.cos(t)/Math.max(rz,1e-6))};};
  return {quad,box,band,at};
 }
 /* The whole kit of one person as one mesh. body: that character file's entry in street-fit.json. Returns {positions, normals, uvs, indices, bone (per vertex: index into bones), bones (joint names), parts}. */
 function build(body,wear){
  const m=mesh(),J=body.joints,u=body.height/1.8,A=GLOW+wear.accent,parts=[];
  if(wear.belt){const w=body.waist,cz=(w.front+w.back)/2,rx=w.halfW+.004*u,rz=(w.front-w.back)/2+.004*u,g=writer(m,UPRIGHT([J.Hips[0],w.y,0]),'Hips',STRAP);parts.push('belt');
   g.band(0,cz,rx,rz,0,360,-.022*u,.022*u,.008*u,16);
   const b=g.at(0,cz,rx,rz,0,.012*u);g.box([b.x,0,b.z],[.058*u,.05*u,.012*u],b.yaw,PLATE);g.box([b.x,0,b.z+.007*u],[.03*u,.008*u,.003*u],b.yaw,A);
   const spots=[[48,.07,.095,.04],[-52,.06,.08,.036],[128,.075,.1,.042],[-135,.065,.09,.04]].slice(0,wear.pouches);
   for(const [deg,pw,ph,pd] of spots){const p=g.at(0,cz,rx,rz,deg,.008*u+pd*u/2);g.box([p.x,-.03*u,p.z],[pw*u,ph*u,pd*u],p.yaw);g.box([p.x,.006*u,p.z],[pw*u*1.04,.02*u,pd*u*1.06],p.yaw,PLATE);}
   const tag=g.at(0,cz,rx,rz,48,.008*u+.041*u);g.box([tag.x,-.035*u,tag.z],[.02*u,.03*u,.003*u],tag.yaw,A);}
  if(wear.harness){const r=body.ribs,cz=(r.front+r.back)/2,rx=r.halfW+.004*u,rz=(r.front-r.back)/2+.004*u,g=writer(m,UPRIGHT([J.Spine1[0],r.y,0]),'Spine1',STRAP);parts.push('harness');
   g.band(0,cz,rx,rz,0,360,-.016*u,.016*u,.006*u,16);
   for(const deg of [-30,0,30]){const p=g.at(0,cz,rx,rz,deg,.006*u+.014*u);g.box([p.x,-.045*u,p.z],[.05*u,.085*u,.028*u],p.yaw);g.box([p.x,-.012*u,p.z],[.053*u,.018*u,.031*u],p.yaw,PLATE);}
   const t=g.at(0,cz,rx,rz,30,.006*u+.03*u);g.box([t.x,-.05*u,t.z],[.026*u,.012*u,.003*u],t.yaw,A);
   const k=g.at(0,cz,rx,rz,180,.006*u+.012*u);g.box([k.x,0,k.z],[.11*u,.07*u,.02*u],k.yaw,PLATE);g.box([k.x,0,k.z-.011*u],[.06*u,.006*u,.003*u],k.yaw,A);}
  for(const [S,sx] of [['Left',1],['Right',-1]]){const L=body[S],hip=J[S+'UpLeg'],knee=J[S+'Leg'],foot=J[S+'Foot'],elbow=J[S+'ForeArm'],hand=J[S+'Hand'],letter=S[0];
   if(wear.thighs.includes(letter)){const o=add(lerp(hip,knee,.32),L.thigh.c),g=writer(m,frame(o,sub(hip,knee)),S+'UpLeg',STRAP),r=L.thigh.r+.004*u;parts.push('thigh_'+letter);
    g.band(0,0,r,r,0,360,.07*u,.095*u,.005*u,12);g.band(0,0,r*.94,r*.94,0,360,-.085*u,-.06*u,.005*u,12);
    const p=g.at(0,0,r,r,sx*88,.005*u+.02*u);g.box([p.x,.005*u,p.z],[.085*u,.185*u,.04*u],p.yaw,PLATE);g.box([p.x,.06*u,p.z],[.09*u,.03*u,.045*u],p.yaw);
    const q=g.at(0,0,r,r,sx*88,.005*u+.042*u);g.box([q.x,-.02*u,q.z],[.012*u,.09*u,.003*u],q.yaw,A);}
   if(wear.knees){const o=add(knee,L.knee.c),g=writer(m,frame(o,sub(knee,foot)),S+'Leg',PLATE),r=L.knee.r+.006*u;parts.push('knee_'+letter);
    g.band(0,0,r,r,-62,62,-.075*u,.012*u,.014*u,8);g.band(0,0,r,r,62,298,-.04*u,-.02*u,.004*u,8,STRAP);
    const p=g.at(0,0,r,r,0,.016*u);g.box([p.x,-.03*u,p.z],[.035*u,.008*u,.003*u],p.yaw,A);}
   if(wear.bracer===letter){const o=add(lerp(elbow,hand,.55),L.forearm.c),f=frame(o,sub(elbow,hand)),g=writer(m,f,S+'ForeArm',PLATE),r=L.forearm.r+.004*u;parts.push('bracer_'+letter);
    g.band(0,0,r,r,0,360,-.065*u,.065*u,.007*u,10);g.band(0,0,r+.007*u,r+.007*u,0,360,.05*u,.062*u,.003*u,10,STRAP);
    // the screen sits on the side of the forearm that faces up in the rest pose (the back of the arm when it hangs)
    const deg=f.ax[1]>0?90:-90,p=g.at(0,0,r,r,deg,.007*u+.006*u);g.box([p.x,-.005*u,p.z],[.05*u,.075*u,.012*u],p.yaw,STRAP);
    const s=g.at(0,0,r,r,deg,.007*u+.0125*u);g.box([s.x,-.005*u,s.z],[.038*u,.058*u,.002*u],s.yaw,A);}}
  if(wear.jacket&&body.chest&&body.neck){const c=body.chest,cz=(c.front+c.back)/2,rx=c.halfW+.006*u,rz=(c.front-c.back)/2+.006*u,g=writer(m,UPRIGHT([J.Spine2[0],c.y,0]),'Spine2',MATTE+wear.accent);parts.push('jacket');
   // the yoke: a coloured panel on each side of the upper chest, with a dark seam under it and a small radio on the left
   for(const sgn of [1,-1]){g.band(0,cz,rx,rz,sgn*16,sgn*62,-.02*u,.05*u,.006*u,5);g.band(0,cz,rx+.002*u,rz+.002*u,sgn*14,sgn*64,-.03*u,-.02*u,.006*u,5,STRAP);}
   const rd=g.at(0,cz,rx,rz,40,.006*u+.012*u);g.box([rd.x,-.075*u,rd.z],[.04*u,.075*u,.022*u],rd.yaw,STRAP);g.box([rd.x,-.05*u,rd.z+.012*u],[.012*u,.006*u,.002*u],rd.yaw,A);
   // the collar: raised behind the neck, open at the front, lit on the inside
   const n=body.neck,nz=(n.front+n.back)/2,nrx=n.halfW+.03*u,nrz=(n.front-n.back)/2+.03*u,k=writer(m,UPRIGHT([J.Neck[0],n.y,0]),'Neck',STRAP);
   k.band(0,nz,nrx,nrz,78,282,-.02*u,.062*u,.008*u,12);k.band(0,nz,nrx-.006*u,nrz-.006*u,84,276,-.012*u,.054*u,.004*u,12,A);}
  if(wear.goggles){const b=body.brow,cz=(b.front+b.back)/2,rx=b.halfW+.005*u,rz=(b.front-b.back)/2+.005*u,g=writer(m,UPRIGHT([J.Head[0],b.y,0]),'Head',STRAP);parts.push('goggles');
   g.band(0,cz,rx,rz,0,360,-.012*u,.012*u,.005*u,14);
   for(const deg of [-24,24]){const p=g.at(0,cz,rx,rz,deg,.005*u+.012*u);g.box([p.x,0,p.z],[.052*u,.04*u,.026*u],p.yaw,PLATE);const l=g.at(0,cz,rx,rz,deg,.005*u+.0255*u);g.box([l.x,0,l.z],[.04*u,.028*u,.002*u],l.yaw,A);}}
  return {...m,parts};
 }
 const wants=look=>!!look&&!SKIP.test(look);
 const pure={ACCENTS,CELLS,HATS,KITS,hash,loadout,build,wants};
 if(typeof module!=='undefined'&&module.exports){module.exports=pure;return;}
 if(typeof document==='undefined')return;

 const config={enabled:true};let fitP=null,count=0;const materials=new WeakMap();
 const fit=()=>fitP||(fitP=fetch(new URL('void-runner/assets/models/gear/street-fit.json',document.baseURI||location.href)).then(r=>{if(!r.ok)throw Error('street fit HTTP '+r.status);return r.json();}).catch(e=>{fitP=null;throw e;}));
 // One material for everyone's gear in a scene: a strip of colours (webbing, metal, then the six accents), and the same strip lit for the accents only.
 function material(scene){const B=root.BABYLON;let m=materials.get(scene);if(m&&!m._street_gone)return m;
  const base=new Uint8Array(CELLS*4),glow=new Uint8Array(CELLS*4),set=(a,i,c)=>{a[i*4]=c[0];a[i*4+1]=c[1];a[i*4+2]=c[2];a[i*4+3]=255;};
  set(base,STRAP,[16,16,19]);set(base,PLATE,[44,47,54]);set(glow,STRAP,[0,0,0]);set(glow,PLATE,[0,0,0]);
  ACCENTS.forEach((c,i)=>{set(base,GLOW+i,[10,10,10]);set(glow,GLOW+i,c.map(v=>Math.round(v*255)));set(base,MATTE+i,c.map(v=>Math.round(v*150)));set(glow,MATTE+i,[0,0,0]);});
  const tex=d=>{const t=B.RawTexture.CreateRGBATexture(d,CELLS,1,scene,false,false,B.Texture.NEAREST_SAMPLINGMODE);t.wrapU=t.wrapV=B.Texture.CLAMP_ADDRESSMODE;return t;};
  m=new B.PBRMaterial('street-gear',scene);m.albedoTexture=tex(base);m.emissiveTexture=tex(glow);m.emissiveColor=new B.Color3(1,1,1);m.emissiveIntensity=1.6;m.metallic=.35;m.roughness=.5;
  m.backFaceCulling=false;m.twoSidedLighting=true;m.onDisposeObservable.add(()=>{m._street_gone=true;});materials.set(scene,m);return m;}
 const boneIndex=(sk,name)=>sk.bones.findIndex(b=>b.name==='mixamorig:'+name||b.name.endsWith('mixamorig:'+name));
 /* Dress one figure. node: the figure's top node; look: its character file; seed: who it is. Returns the gear mesh, or null (unknown file, nothing to wear, no skeleton). */
 async function dress(node,look,seed){
  const B=root.BABYLON;if(!config.enabled||!B||!wants(look)||!node||node.isDisposed())return null;
  const data=await fit().catch(()=>null),body=data?.bodies?.[look];if(!body||node.isDisposed())return null;
  const skinned=node.getChildMeshes().filter(x=>x.skeleton&&x.getTotalVertices()>0);if(!skinned.length)return null;
  const bodyMesh=skinned.reduce((a,b)=>b.getTotalVertices()>a.getTotalVertices()?b:a),sk=bodyMesh.skeleton,wear=loadout(seed,look,body),g=build(body,wear);if(!g.indices.length)return null;
  const idx=g.bones.map(n=>boneIndex(sk,n));if(idx.some(i=>i<0))return null;
  const n=g.positions.length/3,mi=new Float32Array(n*4),mw=new Float32Array(n*4);for(let i=0;i<n;i++){mi[i*4]=idx[g.bone[i]];mw[i*4]=1;}
  const scene=node.getScene(),me=new B.Mesh('street-gear:'+seed,scene),vd=new B.VertexData();
  vd.positions=g.positions;vd.normals=g.normals;vd.uvs=g.uvs;vd.indices=g.indices;vd.matricesIndices=mi;vd.matricesWeights=mw;vd.applyToMesh(me);
  me.skeleton=sk;me.numBoneInfluencers=1;me.parent=bodyMesh.parent;me.position.copyFrom(bodyMesh.position);me.scaling.copyFrom(bodyMesh.scaling);
  if(bodyMesh.rotationQuaternion)me.rotationQuaternion=bodyMesh.rotationQuaternion.clone();else me.rotation.copyFrom(bodyMesh.rotation);
  me.material=material(scene);me.isPickable=false;me.receiveShadows=false;me.setBoundingInfo(bodyMesh.getBoundingInfo());me.layerMask=bodyMesh.layerMask;me.renderingGroupId=bodyMesh.renderingGroupId;
  me.metadata={streetGear:{seed,look,parts:g.parts,accent:wear.accent}};count++;me.onDisposeObservable.add(()=>{count--;});
  return me;}
 // Every crowd figure is dressed as it is made. Who it is (metadata.character) is written by the scene just after the copy is made, so the dressing waits a moment for it.
 const A=root.VoidAssets;
 if(A&&typeof A.instance==='function'){const original=A.instance;let anon=0;
  A.instance=function(id,parent,only){const node=original.apply(this,arguments);
   if(node&&typeof id==='string'&&id.startsWith('crowd:')&&!only){const look=id.slice(6),n=++anon;
    setTimeout(()=>{if(node.isDisposed())return;
     // A figure put together by the character assembler (parent "character:<look>") is a player, another player or a portrait, and keeps what its owner chose,
     // unless it stands for a named member of staff (Admin, Iris), who has a kit of their own.
     if(/^character:/.test(parent?.name||'')){const staff=parent.parent?.metadata?.character;if(KITS[staff])dress(node,look,staff).catch(()=>{});return;}
     const who=node.metadata?.character||node.metadata?.id||'walker-'+n;dress(node,look,KITS[who]?who:look+':'+who).catch(()=>{});},0);}
   return node;};}
 root.VoidStreetGear={...pure,config,dress,get dressed(){return count;}};
})(typeof globalThis!=='undefined'?globalThis:this);
