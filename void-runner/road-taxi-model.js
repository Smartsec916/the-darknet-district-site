/* The road taxi's model (16 Nov 2026; David: "The taxi graphic needs updating"). One loader for every road cab that is drawn: the cabs that drive
   (road-taxi.js asks dress(cab, scene) for each one it builds) and the parked cabs at the Corporate District's and the Temple's stops (park()).
   The model is assets/models/ncz-kit/ncz-road-taxi.glb (Meshy, made from a concept drawn for this game: an original design, no real make; the only word on
   it is TAXI). About 20,000 triangles, one material. Low quality, or a file that does not load, keeps the built box cab exactly as it was.
   Nothing about the taxis' rules, stops, fares, prompts or keys is here or changed: this file only decides what a cab looks like. */
(function(root){
 'use strict';
 const SRC='assets/models/ncz-kit/ncz-road-taxi.glb',LENGTH=4.45;   // metres nose to tail (the box cab is 4.2 long and 1.85 wide: the same road space)
 const B=()=>root.BABYLON,low=()=>(root.VoidGraphics?.quality||'medium')==='low';
 const loads=new WeakMap();   // scene -> Promise<{container, fit}>
 /* Which way round the file is: the model's nose points along +x in the file. FLIP turns it end for end if a regenerated model comes out the other way. */
 const FLIP=false;
 function load(scene){let p=loads.get(scene);if(p)return p;
  p=root.VoidAssets.loadContainer({src:SRC},scene,null,'road-taxi-model').then(c=>{const b=B();
   for(const m of c.materials){if('usePhysicalLightFalloff' in m){m.usePhysicalLightFalloff=false;m.maxSimultaneousLights=6;m.environmentIntensity=.7;m.directIntensity=1.3;
     // a little of itself shows in the dark (the street's haze), and the paint is wet: a clear coat on top (Medium and up; this file is not loaded on Low)
     if(m.albedoTexture&&!m.emissiveTexture){m.emissiveTexture=m.albedoTexture;m.emissiveColor=new b.Color3(.2,.2,.21);}
     if(m.clearCoat){m.clearCoat.isEnabled=true;m.clearCoat.intensity=.55;m.clearCoat.roughness=.12;}}}
   scene.onDisposeObservable.addOnce(()=>{try{c.dispose();}catch{}});return c;});
  loads.set(scene,p);p.catch(()=>{});return p;}
 const glow=(scene,name,hex,k=1)=>{const b=B(),m=new b.StandardMaterial('road-taxi-model-'+name,scene);m.diffuseColor=b.Color3.Black();m.specularColor=b.Color3.Black();m.emissiveColor=b.Color3.FromHexString(hex).scale(k);m.disableLighting=true;return m;};
 /* Hang a copy of the model on `holder` (a node at road level whose +z is the cab's forward), `length` metres long, wheels on the road. Returns a promise. */
 function attach(scene,holder,length=LENGTH){return load(scene).then(c=>{const b=B();if(holder.isDisposed())return null;
   const inst=c.instantiateModelsToScene(n=>'road-taxi-model-'+n,false,{doNotInstantiate:true}),fit=new b.TransformNode('road-taxi-model-fit',scene);
   root.VoidAssets.ownInstance?.(inst,fit);for(const r of inst.rootNodes)r.parent=fit;fit.computeWorldMatrix(true);for(const m of fit.getChildMeshes())m.computeWorldMatrix(true);
   let v=fit.getHierarchyBoundingVectors(true);const sx=v.max.x-v.min.x,sz=v.max.z-v.min.z,alongX=sx>=sz,k=length/Math.max(sx,sz);
   // turn the long side to +z, centre it, stand the wheels on y 0
   fit.rotation.y=alongX?(FLIP?Math.PI/2:-Math.PI/2):(FLIP?Math.PI:0);fit.scaling.setAll(k);fit.computeWorldMatrix(true);for(const m of fit.getChildMeshes())m.computeWorldMatrix(true);v=fit.getHierarchyBoundingVectors(true);
   fit.position.set(-(v.min.x+v.max.x)/2,-v.min.y,-(v.min.z+v.max.z)/2);fit.parent=holder;
   const w=(alongX?sz:sx)*k,h=(v.max.y-v.min.y),made=[fit],mats=[];
   for(const m of fit.getChildMeshes()){m.isPickable=false;m.receiveShadows=false;m.alwaysSelectAsActiveMesh=false;}
   // lamps that really glow: two headlight bars, a tail-light bar, and the roof sign's faces
   const head=glow(scene,'head','#f2f7ff',1.2),tail=glow(scene,'tail','#ff2a22',1.1),sign=glow(scene,'sign','#ffffff',1);mats.push(head,tail,sign);
   const st=new b.DynamicTexture('road-taxi-model-sign',{width:256,height:80},scene,true),g=st.getContext();g.fillStyle='#f2b01e';g.fillRect(0,0,256,80);g.fillStyle='#fff4c4';g.fillRect(6,6,244,68);g.fillStyle='#14110a';g.font='bold 58px Arial,Helvetica,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('TAXI',128,43);st.update();sign.emissiveTexture=st;sign.emissiveColor=b.Color3.Black();mats.push(st);
   const part=(name,size,p,m)=>{const x=b.MeshBuilder.CreateBox('road-taxi-model-'+name,{width:size[0],height:size[1],depth:size[2]},scene);x.material=m;x.parent=holder;x.position.set(p[0],p[1],p[2]);x.isPickable=false;made.push(x);return x;};
   const L=length/2;for(const s of [-1,1])part('head',[w*.2,.05,.04],[s*w*.3,h*.43,L-.03],head);part('tail',[w*.74,.05,.04],[0,h*.56,-L+.02],tail);
   // what a passenger sees: the model is a closed shell with nothing inside, so a dashboard, a windscreen frame and a roof lining are built in
   const trim=new b.StandardMaterial('road-taxi-model-trim',scene);trim.diffuseColor=new b.Color3(.05,.055,.06);trim.specularColor=new b.Color3(.1,.1,.12);trim.emissiveColor=new b.Color3(.02,.022,.025);mats.push(trim);
   const meter=glow(scene,'meter','#ffb347',.9);mats.push(meter);
   part('dash',[w*.82,.16,.42],[0,h*.63,L*.36],trim);part('cowl',[w*.82,.05,.5],[0,h*.69,L*.42],trim);part('meter',[.16,.07,.02],[w*.02,h*.72,L*.27],meter);part('wheel',[.3,.3,.04],[-w*.22,h*.68,L*.22],trim).rotation.x=.4;
   for(const s of [-1,1]){const a=part('pillar',[.07,h*.36,.07],[s*w*.4,h*.86,L*.3],trim);a.rotation.x=-.75;part('sill',[.06,.12,L*.9],[s*w*.43,h*.62,-L*.12],trim);}
   part('lining',[w*.8,.03,L*.75],[0,h*.985,-L*.14],trim);part('header',[w*.82,.07,.07],[0,h*.955,L*.2],trim);
   holder.onDisposeObservable.addOnce(()=>{for(const m of mats){try{m.dispose();}catch{}}});
   return {fit,made,width:w,height:h,sign};});}
 /* A cab that drives (road-taxi.js): the box cab stays as built until the model is ready, then its parts are hidden (they keep moving: the door and the
    wheels are still animated by road-taxi.js, unseen). A cab on Low, or whose model fails, is left alone. */
 /* PARKED (16 Nov 2026): the modelled cab has not yet been checked in the running game, so it is switched OFF and every cab is the built one. */
 const api={enabled:false};
 function dress(cab,scene){if(!api.enabled||!cab?.root||low()||!root.VoidAssets?.loadContainer)return false;
  attach(scene,cab.root).then(r=>{if(!r||cab.root.isDisposed())return;for(const p of cab.parts)p.isVisible=false;cab.model=r;}).catch(e=>console.info('[Taxi] model not available; the built cab is used ('+(e?.message||e)+')'));return true;}
 /* A parked cab at (x,z) heading yaw: the model if it can be had, otherwise fallback() (the builder's own box cab) is called. Returns true when the model was asked for. */
 function park({scene,parent,x,z,yaw=0,length=4.7,fallback}){if(!api.enabled||low()||!root.VoidAssets?.loadContainer){fallback?.();return false;}
  const b=B(),holder=new b.TransformNode('road-taxi-parked',scene);holder.parent=parent;holder.position.set(x,0,z);holder.rotation.y=yaw;
  attach(scene,holder,length).catch(e=>{console.info('[Taxi] model not available; the built cab is used ('+(e?.message||e)+')');try{if(!holder.isDisposed()){holder.dispose();fallback?.();}}catch{}});return true;}
 root.VoidRoadTaxiModel=Object.assign(api,{dress,park,attach,SRC,LENGTH});
})(typeof globalThis!=='undefined'?globalThis:this);
