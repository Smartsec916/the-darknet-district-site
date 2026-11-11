/* Builds a player character in the scene from an appearance (character-appearance.js). BROWSER ONLY.
   What is really swapped at runtime, and what is not (see docs/development/CHARACTER_CREATOR.md):
     - REAL: hairstyle (any of nine, re-fitted onto the body's head), hair colour, outfit colour, accessories on/off, standard height.
     - NOT SWAPPABLE: outfit and shoes. They are part of each complete character file (the body under them is cut away), so a "look" is a whole file.
   Every character uses the same 52-joint skeleton and clips, so the existing animation code (VoidCrowd.animate) drives them unchanged.
   Never loads anything but ids from the catalog; paths are built here from fixed folders.                                                                          */
(function(root){
 'use strict';
 const A=root.VoidCharacterAppearance,F=root.VoidCharacterFit,CAT=A&&A.CATALOG;
 const CROWD='assets/models/crowd/',PARTS='assets/models/parts/',TINT_GAIN=1.5;
 const once=(map,key,make)=>{if(!map.has(key)){const p=make();map.set(key,p);p.catch(()=>map.delete(key));}return map.get(key);};
 const looks=new Map(),hairParts=new Map(),greys=new Map(),fits=new Map();let bindP=null;

 function bindData(){return bindP||(bindP=fetch(new URL('void-runner/'+PARTS+'bind-data.json',document.baseURI||location.href)).then(r=>{if(!r.ok)throw Error('bind data HTTP '+r.status);return r.json();}).catch(e=>{bindP=null;throw e;}));}
 function ensureLook(model,scene){
  const id='crowd:'+model;if(root.VoidAssets.container(id))return Promise.resolve(id);
  return once(looks,model,()=>root.VoidAssets.load(id,{src:CROWD+model+'.glb',background:true},scene).then(()=>id));
 }
 function ensureHairPart(style,scene){
  return once(hairParts,style,()=>root.VoidAssets.loadContainer({src:PARTS+CAT.hair[style].part},scene,null,'hair:'+style).then(c=>{
   const mesh=c.meshes.find(m=>m.name==='hair-'+style&&m.getTotalVertices()>0);if(!mesh)throw Error('hair part has no mesh');return {container:c,mesh};}));
 }
 // A grey, detail-keeping copy of a texture (average brightness = 1/TINT_GAIN) so a colour can be multiplied onto it and still read as that colour.
 function greyOf(tex,scene){
  return once(greys,tex.uniqueId,async()=>{
   const size=tex.getSize(),w=size.width,h=size.height,px=new Uint8Array((await tex.readPixels()).buffer.slice(0)),out=new Uint8Array(px.length);
   const lums=[];for(let i=0;i<px.length;i+=4)if(px[i+3]>128)lums.push(.2126*px[i]+.7152*px[i+1]+.0722*px[i+2]);
   lums.sort((x,y)=>x-y);const avg=(lums.length?lums[lums.length>>1]:128)||128;   // the MEDIAN, so a few bright trims do not darken the whole garment
   for(let i=0;i<px.length;i+=4){const l=(.2126*px[i]+.7152*px[i+1]+.0722*px[i+2])/avg*255/TINT_GAIN*.85,g=Math.max(0,Math.min(255,l));out[i]=out[i+1]=out[i+2]=g;out[i+3]=px[i+3];}
   const t=root.BABYLON.RawTexture.CreateRGBATexture(out,w,h,scene,true,false,root.BABYLON.Texture.TRILINEAR_SAMPLINGMODE);
   t.hasAlpha=tex.hasAlpha;t.wrapU=tex.wrapU;t.wrapV=tex.wrapV;t.name='grey:'+tex.name;
   scene.onDisposeObservable.addOnce(()=>{t.dispose();greys.delete(tex.uniqueId);});
   return t;
  });
 }
 // Fit result per hairstyle and body, cached: {positions, normals} as Float32Array in the body's bind pose.
 function fitted(style,model,part,bind){
  const key=style+'|'+model;if(fits.has(key))return fits.get(key);
  const B=root.BABYLON,m=part.mesh,p=bind.parts[style],body=bind.bodies[model],f=F.headFit(p.headDims,body.headDims);
  if(f.mismatch>F.FIT_LIMIT)throw Error('hairstyle does not fit this body');
  const weights=m.getVerticesData(B.VertexBuffer.MatricesWeightsKind),idx=m.getVerticesData(B.VertexBuffer.MatricesIndicesKind);
  const r=F.refit({positions:Array.from(m.getVerticesData(B.VertexBuffer.PositionKind)),normals:Array.from(m.getVerticesData(B.VertexBuffer.NormalKind)),joints:Array.from(idx),weights:Array.from(weights)},p.ibm,body.ibm,f.scale);
  const out={positions:Float32Array.from(r.positions),normals:Float32Array.from(r.normals)};fits.set(key,out);return out;
 }
 const hexColor=hex=>root.BABYLON.Color3.FromHexString(hex).toLinearSpace().scale(TINT_GAIN);

 /* build(appearance, parent, {scene, clip}) -> Promise<character>. character: {node, appearance, set(a), play(clip), meshes(), dispose(), ready}. */
 async function build(appearance,parent,opts={}){
  const B=root.BABYLON,scene=opts.scene||parent.getScene();let a=A.normalize(appearance),clip=opts.clip||'idle',disposed=false,seq=0;
  let near=true,st=null;   // {look, model, node, made, ctrl, hairMesh, tinted:[{mesh,orig,mat}], key}
  // glTF material ids in the catalog include the model prefix, but the exported
  // mesh names often do not (female_sportsuit01 versus district_resident.female_sportsuit01).
  const meshByName=(s,name)=>{const prefix='crowd:'+s.model+'-',short=name.split('.').at(-1);return s.node.getChildMeshes().find(m=>m.name===prefix+name||m.name===prefix+short);};
  async function makeLook(){
   const look=CAT.looks[a.look];await ensureLook(look.model,scene);if(disposed)return null;
   const holder=new B.TransformNode('character:'+a.look,scene);holder.parent=parent;
   const made=root.VoidAssets.instance('crowd:'+look.model,holder);if(!made){holder.dispose();throw Error('model not available');}
   const bind=await bindData();made.scaling.setAll(A.heightScale(look.base,bind.bodies[look.model].topY));   // ONE uniform scale: standard height, never a stretch
   const s={look:a.look,lookDef:look,model:look.model,holder,node:made,made,ctrl:root.VoidCrowd.animate(made,look.model,clip),hairMesh:null,tinted:new Map(),hair:null};
   return s;
  }
  function untint(s,mesh){const t=s.tinted.get(mesh);if(t){mesh.material=t.orig;t.mat.dispose();s.tinted.delete(mesh);}}
  async function tint(s,mesh,hex){
   if(!mesh)return;
   if(!hex){untint(s,mesh);return;}
   let t=s.tinted.get(mesh);
   if(!t){const orig=mesh.material;if(!orig||!orig.albedoTexture)return;const mat=orig.clone(orig.name+'-tint');mat.albedoTexture=await greyOf(orig.albedoTexture,scene);t={orig,mat};s.tinted.set(mesh,t);mesh.material=mat;}
   t.mat.albedoColor=hexColor(hex);
  }
  async function apply(){
   const my=++seq;
   if(!st||st.look!==a.look){
    const old=st;st=null;if(old){destroy(old);}
    const s=await makeLook();if(!s)return;if(my!==seq||disposed){destroy(s);return;}st=s;
   }
   const s=st,look=s.lookDef,CATH=CAT.hair;
   faceDetail(s);
   // accessories (meshes that belong to the look): shown only when chosen
   for(const [kind,names] of Object.entries(look.accessories))for(const n of names){const m=meshByName(s,n);if(m)m.setEnabled(a.accessories.includes(kind));}
   // hair
   const native=meshByName(s,look.nativeHair);
   if(a.hair==='native'){if(s.hairMesh){untint(s,s.hairMesh);s.hairMesh.dispose();s.hairMesh=null;s.hair=null;}native?.setEnabled(true);}
   else if(a.hair==='none'){if(s.hairMesh){untint(s,s.hairMesh);s.hairMesh.dispose();s.hairMesh=null;s.hair=null;}native?.setEnabled(false);}
   else if(s.hair!==a.hair){
    const [part,bind]=await Promise.all([ensureHairPart(a.hair,scene),bindData()]);if(my!==seq||disposed)return;
    const fit=fitted(a.hair,s.model,part,bind);
    if(s.hairMesh){untint(s,s.hairMesh);s.hairMesh.dispose();}
    const bodyMesh=meshByName(s,s.lookDef.body)||s.node.getChildMeshes().find(m=>m.skeleton),m=part.mesh.clone('hair:'+a.hair,null);
    m.makeGeometryUnique();m.setVerticesData(B.VertexBuffer.PositionKind,fit.positions,true);m.setVerticesData(B.VertexBuffer.NormalKind,fit.normals,true);
    m.skeleton=bodyMesh.skeleton;m.parent=native?native.parent:bodyMesh.parent;m.alwaysSelectAsActiveMesh=true;m.setEnabled(true);m.refreshBoundingInfo?.();
    native?.setEnabled(false);s.hairMesh=m;s.hair=a.hair;
   }
   await tint(s,a.hair==='native'?native:a.hair==='none'?null:s.hairMesh,a.hairColor?CAT.hairColors.find(c=>c.id===a.hairColor).hex:null);
   if(my!==seq||disposed)return;
   await tint(s,meshByName(s,look.outfit),a.clothingColor?CAT.clothingColors.find(c=>c.id===a.clothingColor).hex:null);
  }
  // Eyebrows and eyelashes (2 of about 9 draw calls, a few hundred triangles) cannot be seen from across a room: hidden beyond a distance, shown again when close.
  const faceDetail=s=>{for(const m of s.holder.getChildMeshes())if(/\.(eyebrow001|eyelashes01)$/.test(m.name))m.setEnabled(near);};
  function destroy(s){for(const m of [...s.tinted.keys()])untint(s,m);s.hairMesh?.dispose();s.ctrl?.dispose?.();s.holder.dispose();}
  const api={
   get appearance(){return a;},get node(){return st?.holder||null;},get ready(){return !!st;},
   async set(next){if(!A.validate(next))return false;a=A.normalize(next);await apply();return true;},
   setDetail(isNear){if(isNear!==near){near=isNear;if(st)faceDetail(st);}},
   get detailNear(){return near;},
   play(c){clip=c;st?.ctrl?.play?.(c);},
   meshes(){return st?st.holder.getChildMeshes():[];},
   dispose(){disposed=true;seq++;if(st){destroy(st);st=null;}}
  };
  await apply();return api;
 }
 root.VoidCharacterAssembler={build,ensureLook,ensureHairPart,bindData,clearCaches(){hairParts.clear();looks.clear();fits.clear();}};
})(globalThis);
