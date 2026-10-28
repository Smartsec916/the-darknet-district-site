/* Shared building blocks for the VR arcade's worlds (vr-core.js). Everything a world makes is tracked here and
   disposed together; lighting, fog and exposure are restored as they were. Assets: void-runner/assets/vr/ (CC0,
   docs/VOID_RUNNER_ASSET_LICENSES.md). */
(function(){
 const base=new URL('assets/vr/',document.currentScript.src).href;
 function kit(ctx){
  const B=BABYLON,scene=ctx.scene,parent=ctx.parent,particlesBefore=new Set(ctx.scene.particleSystems),owned=[],containers=[],tickers=[],ip=scene.imageProcessingConfiguration;
  const sun=scene.getLightByName('sun'),amb=scene.getLightByName('ambient');
  const saved={clear:scene.clearColor.clone(),fogMode:scene.fogMode,fogDensity:scene.fogDensity,fogColor:scene.fogColor.clone(),exposure:ip.exposure,contrast:ip.contrast,env:scene.environmentIntensity,
   sun:sun&&{i:sun.intensity,d:sun.diffuse.clone(),dir:sun.direction?.clone()},amb:amb&&{i:amb.intensity,d:amb.diffuse.clone(),g:amb.groundColor?.clone()}};
  const own=x=>{owned.push(x);return x;};
  const k={B,scene,parent,base,own,
   // Daylight, fog and exposure for this world. sunDir points from the sun toward the ground.
   light({clear=[.5,.6,.7],fog=[.6,.7,.8],fogDensity=.006,sunColor=[1,.95,.85],sunIntensity=1.2,sunDir=[-.4,-1,.3],sky=[.8,.85,.95],ground=[.3,.28,.22],ambient=.75,exposure=1.05,contrast=1.08,env=1}={}){
    scene.clearColor=new B.Color4(...clear,1);scene.fogMode=B.Scene.FOGMODE_EXP2;scene.fogDensity=fogDensity;scene.fogColor=new B.Color3(...fog);
    ip.exposure=exposure;ip.contrast=contrast;scene.environmentIntensity=env;k.look={exposure,contrast};
    if(sun){sun.intensity=sunIntensity;sun.diffuse=new B.Color3(...sunColor);if(sun.direction)sun.direction=new B.Vector3(...sunDir).normalize();}
    if(amb){amb.intensity=ambient;amb.diffuse=new B.Color3(...sky);if(amb.groundColor)amb.groundColor=new B.Color3(...ground);}},
   texture(name,scale=1){const t=own(new B.Texture(base+'textures/'+name+'.jpg',scene));t.uScale=t.vScale=scale;t.wrapU=t.wrapV=B.Texture.WRAP_ADDRESSMODE;return t;},
   material(name,{color,normal,scale=1,hex='#ffffff',spec=.08,emissive}={}){const m=own(new B.StandardMaterial('vr-'+name,scene));m.diffuseColor=B.Color3.FromHexString(hex);m.specularColor=new B.Color3(spec,spec,spec);
    if(color)m.diffuseTexture=k.texture(color,scale);if(normal)m.bumpTexture=k.texture(normal,scale);if(emissive)m.emissiveColor=B.Color3.FromHexString(emissive);return m;},
   glow(name,hex,level=1){const m=own(new B.StandardMaterial('vr-'+name,scene));m.diffuseColor=B.Color3.Black();m.emissiveColor=B.Color3.FromHexString(hex).scale(level);m.disableLighting=true;return m;},
   // A painted texture (canvas), tracked for disposal.
   paint(name,w,h,draw,alpha=false){const t=own(new B.DynamicTexture('vr-'+name,{width:w,height:h},scene,true));const g=t.getContext();draw(g,w,h);t.update();t.hasAlpha=alpha;return t;},
   sky(name,rotation=0){const d=new B.PhotoDome('vr-sky',base+'sky/'+name+'.jpg',{resolution:48,size:1800},scene);d.mesh.parent=parent;d.rotation.y=rotation;d.mesh.applyFog=false;if(d.material)d.material.fogEnabled=false;own(d);return d;},
   mesh(m,material,p=[0,0,0],r){m.material=material;m.parent=parent;m.position.set(...p);if(r)m.rotation.y=r;m.isPickable=false;return m;},
   box(name,s,p,mat,r){return k.mesh(B.MeshBuilder.CreateBox('vr-'+name,{width:s[0],height:s[1],depth:s[2]},scene),mat,p,r);},
   cyl(name,d,h,p,mat,t=16,top){return k.mesh(B.MeshBuilder.CreateCylinder('vr-'+name,{diameterTop:top??d,diameterBottom:d,height:h,tessellation:t},scene),mat,p);},
   // Models: loaded into containers this world owns (disposed with it).
   async model(name){const c=await VoidAssets.loadContainer({src:'assets/vr/models/'+name+'.glb'},scene,ctx.task,'vr:'+name);containers.push(c);return c;},
   // One copy of a model, placed. s: uniform scale.
   place(container,p,r=0,s=1){const inst=container.instantiateModelsToScene(n=>'vr-'+n,false,{doNotInstantiate:true});const n=new B.TransformNode('vr-model',scene);n.parent=parent;for(const r0 of inst.rootNodes)r0.parent=n;n.position.set(...p);n.rotation.y=r;n.scaling.setAll(s);
    for(const m of n.getChildMeshes())m.isPickable=false;return n;},
   // Many copies of a model drawn as thin instances (one draw per part). items: [{p:[x,y,z], r, s}].
   scatter(container,items){if(!items.length)return [];const inst=container.instantiateModelsToScene(n=>'vr-'+n,false,{doNotInstantiate:true});const out=[];
    for(const r0 of inst.rootNodes){r0.computeWorldMatrix(true);for(const m of r0.getChildMeshes(false)){if(!m.getTotalVertices())continue;m.computeWorldMatrix(true);m.setParent(null);m.makeGeometryUnique();m.bakeCurrentTransformIntoVertices();
      const buf=new Float32Array(items.length*16);items.forEach((it,i)=>B.Matrix.Compose(new B.Vector3(it.s||1,it.s||1,it.s||1),B.Quaternion.RotationYawPitchRoll(it.r||0,0,0),new B.Vector3(...it.p)).copyToArray(buf,i*16));
      m.thinInstanceSetBuffer('matrix',buf,16);m.thinInstanceRefreshBoundingInfo(true);m.parent=parent;m.isPickable=false;out.push(m);}r0.dispose();}return out;},
   // Each frame: fn(dt, time).
   every(fn){tickers.push(fn);},
   // A leaf-cluster card: many leaves painted on a transparent canvas.
   leafTexture(name,palette,{count=420,size=[10,22],needle=false}={}){return k.paint(name,512,512,(g,W,H)=>{g.clearRect(0,0,W,H);
     for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*W*.46,x=W/2+Math.cos(a)*r,y=H/2+Math.sin(a)*r*.9,c=palette[Math.floor(Math.random()*palette.length)],l=size[0]+Math.random()*(size[1]-size[0]);
      g.save();g.translate(x,y);g.rotate(Math.random()*Math.PI*2);const gr=g.createLinearGradient(-l,0,l,0);gr.addColorStop(0,c[0]);gr.addColorStop(1,c[1]);g.fillStyle=gr;g.beginPath();
      if(needle){g.rect(-l,-1.2,l*2,2.4);}else{g.ellipse(0,0,l,l*.42,0,0,Math.PI*2);}g.fill();if(!needle){g.strokeStyle='rgba(0,0,0,.18)';g.lineWidth=1;g.beginPath();g.moveTo(-l,0);g.lineTo(l,0);g.stroke();}g.restore();}},true);},
   // Alpha-tested foliage material (no sorting problems, both sides).
   foliage(name,tex,hex='#ffffff'){const m=own(new B.StandardMaterial('vr-'+name,scene));m.diffuseTexture=tex;m.useAlphaFromDiffuseTexture=true;m.transparencyMode=B.Material.MATERIAL_ALPHATEST;m.alphaCutOff=.45;m.backFaceCulling=false;m.diffuseColor=B.Color3.FromHexString(hex);m.specularColor=new B.Color3(.05,.06,.04);return m;},
   // A tileable water normal map from summed waves, and a water material that scrolls it.
   water(name,{hex='#1d4a50',alpha=.82,sky,scale=4,reflect=.45,spec=.9}={}){const t=k.paint(name+'-normal',256,256,(g,W,H)=>{const img=g.createImageData(W,H),h=(x,y)=>Math.sin(x*Math.PI*2*3/W+y*Math.PI*2*2/H)*.5+Math.sin(x*Math.PI*2*5/W-y*Math.PI*2*4/H)*.3+Math.sin(y*Math.PI*2*7/H+x*Math.PI*2/W)*.2;
     for(let y=0;y<H;y++)for(let x=0;x<W;x++){const dx=h(x+1,y)-h(x-1,y),dy=h(x,y+1)-h(x,y-1),n=Math.hypot(dx,dy,.5),i=(y*W+x)*4;img.data[i]=128+dx/n*127;img.data[i+1]=128+dy/n*127;img.data[i+2]=128+.5/n*127;img.data[i+3]=255;}g.putImageData(img,0,0);});
    t.uScale=t.vScale=scale;t.wrapU=t.wrapV=B.Texture.WRAP_ADDRESSMODE;const m=own(new B.StandardMaterial('vr-'+name,scene));m.diffuseColor=B.Color3.FromHexString(hex);m.bumpTexture=t;m.specularColor=new B.Color3(spec,spec,spec);m.specularPower=96;m.alpha=alpha;
    if(sky){const r=own(new B.Texture(base+'sky/'+sky+'.jpg',scene));r.coordinatesMode=B.Texture.EQUIRECTANGULAR_MODE;m.reflectionTexture=r;m.reflectionTexture.level=reflect;}
    k.every(dt=>{t.uOffset+=dt*.018;t.vOffset+=dt*.011;});return m;},
   // Ground that follows a height function, with its walk height for the camera.
   terrain(name,size,div,height,material){const g=B.MeshBuilder.CreateGround('vr-'+name,{width:size,height:size,subdivisions:div,updatable:true},scene);const p=g.getVerticesData(B.VertexBuffer.PositionKind);
    for(let i=0;i<p.length;i+=3)p[i+1]=height(p[i],p[i+2]);g.updateVerticesData(B.VertexBuffer.PositionKind,p);const n=[];B.VertexData.ComputeNormals(p,g.getIndices(),n);g.updateVerticesData(B.VertexBuffer.NormalKind,n);k.mesh(g,material);return g;},
   // Merge meshes that share a material (fewer draw calls).
   merge(list,material){const m=B.Mesh.MergeMeshes(list,true,true,undefined,false,false);if(m){m.material=material;m.parent=parent;m.isPickable=false;}return m;},
   tick(time){const dt=k.last==null?0:Math.min(.1,Math.max(0,time-k.last));k.last=time;if(k.look){if(ip.exposure!==k.look.exposure)ip.exposure=k.look.exposure;if(ip.contrast!==k.look.contrast)ip.contrast=k.look.contrast;}for(const f of tickers)f(dt,time);},
   dispose(){for(const p of [...scene.particleSystems])if(!particlesBefore.has(p))p.dispose();for(const c of containers)c.dispose();for(const x of owned)try{x.dispose();}catch{}scene.clearColor=saved.clear;scene.fogMode=saved.fogMode;scene.fogDensity=saved.fogDensity;scene.fogColor=saved.fogColor;ip.exposure=saved.exposure;ip.contrast=saved.contrast;scene.environmentIntensity=saved.env;
    if(sun&&saved.sun){sun.intensity=saved.sun.i;sun.diffuse=saved.sun.d;if(saved.sun.dir)sun.direction=saved.sun.dir;}if(amb&&saved.amb){amb.intensity=saved.amb.i;amb.diffuse=saved.amb.d;if(saved.amb.g)amb.groundColor=saved.amb.g;}}};
  return k;}
 // A seat or spot to interact with: an interaction for the layout.
 const spot=(id,label,x,z,range=2.4)=>({id:'vr-'+id,label,position:[x,1.7,z],action:'vr-act',range});
 globalThis.VoidVRKit={kit,spot};
})();
