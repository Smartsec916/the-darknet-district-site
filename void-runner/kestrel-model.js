/* The Kestrel's exterior (the owner, 19 Nov 2026): the Meshy model made from the owner's reference sheet (docs/development/kestrel/), cut and set up in
   Blender (docs/development/MESHY_CHARACTERS.md, "The Kestrel"). The cockpit and cargo hold inside are unchanged (cockpit-overlay.js, the hangar rooms).
   assets/models/ships/kestrel.glb (kestrel-low.glb on Low: 1024 maps), in the code Kestrel's own frame and game units (babylon-renderer.js shipModel
   'starter'): nose +z, 4.4 long, the hull's sides at x about .75, the deck 1 unit below the origin where a landed ship stands at scale 2. Nodes: hull,
   gear_nose / gear_left / gear_right (each with its pivot where the leg meets the hull), exhaust_left / exhaust_right (the lit engine cores, own material
   `exhaust`), canopy (material `canopy_glass`), and empty nodes for the gun muzzles (muzzle_left / muzzle_right on the wing rails, muzzle_chin_left /
   muzzle_chin_right under the nose), the missile rails (missile_left / missile_right) and the engine centres (engine_left / engine_right, facing -z).
   If the file is missing or fails to load, shipModel builds the code Kestrel as before (the stand-in). dress() gives a copy its hooks on
   node.metadata.kestrel: setThrust(0..1) (the engines' glow; cold on a pad, warm idling, full burn), setGear(0..1) (1 down, 0 folded away),
   fitGround(y) (stretch the legs to a floor y in ship space, as landBoarding knows it), flash(side) (a muzzle flash), and the hook nodes. */
(function(root){
 const MODEL={id:'ship:starter',src:q=>'assets/models/ships/'+(q==='low'?'kestrel-low':'kestrel')+'.glb'};
 const GLOW={cold:.06,idle:.32,burn:1},LIFT=[.24,.23,.21];
 const def=q=>({src:MODEL.src(q),scale:1,yaw:0,model:'Kestrel',license:'Own (Meshy, the owner’s plan)'});
 // Every place that shows the Kestrel loads this file with the room (babylon-renderer.js): shipModel then draws it, else the code ship.
 function register(assets,q){if(assets?.models?.ships)assets.models.ships.starter=def(q);return assets?.models?.ships?.starter;}
 const definitions=q=>({[MODEL.id]:def(q)});
 // How far a leg is stretched to stand on a floor: from where it meets the hull (attach) down to its wheel (foot), within reason.
 function gearScale(attach,foot,ground){const span=attach-foot;if(!(span>1e-3))return 1;return Math.max(.7,Math.min(1.45,(attach-ground)/span));}
 const glowAt=t=>Math.max(0,Math.min(1.4,t));
 const HOOKS=['gear_nose','gear_left','gear_right','exhaust_left','exhaust_right','canopy','hull','muzzle_left','muzzle_right','muzzle_chin_left','muzzle_chin_right','missile_left','missile_right','engine_left','engine_right'];
 function dress(node,{scene,landed=false,allegiance='friendly'}={}){
  const B=root.BABYLON;if(!node||!B)return node;scene=scene||node.getScene();
  const all=node.getDescendants(false),find=k=>all.find(n=>n.name===MODEL.id+'-'+k||n.name.endsWith('-'+k)||n.name===k);
  const hooks=Object.fromEntries(HOOKS.map(k=>[k,find(k)]).filter(([,n])=>n));
  for(const m of node.getChildMeshes(false)){m.isPickable=false;m.receiveShadows=false;}
  // Each copy gets its own exhaust material, so one ship's burn never lights another's.
  const own=[],hot=allegiance==='hostile'?new B.Color3(1,.42,.3):new B.Color3(1,.55,.18);let exhaust=null;
  for(const k of ['exhaust_left','exhaust_right'])for(const mesh of [hooks[k],...(hooks[k]?.getChildMeshes?.(false)||[])].filter(m=>m?.material)){
   if(!exhaust){exhaust=mesh.material.clone('kestrel-exhaust-'+node.uniqueId);own.push(exhaust);if('albedoColor' in exhaust){exhaust.albedoColor=B.Color3.Black();exhaust.metallic=0;exhaust.roughness=1;}exhaust.disableLighting=true;}
   mesh.material=exhaust;}
  for(const mesh of node.getChildMeshes(false)){const mat=mesh.material;if(!mat)continue;mat.maxSimultaneousLights=Math.min(8,mat.maxSimultaneousLights||4);
   // As the code ship did (its landing-pad note): the pad is seen from below in a dark street, so the paint keeps a little of its own colour in shade.
   if(/kestrel_hull|canopy_glass/.test(mat.name)&&!mat.metadata?.kestrelLift&&mat.albedoTexture&&'emissiveTexture' in mat){mat.metadata={...(mat.metadata||{}),kestrelLift:true};mat.emissiveTexture=mat.albedoTexture;mat.emissiveColor=/canopy/.test(mat.name)?new B.Color3(.05,.06,.07):new B.Color3(LIFT[0],LIFT[1],LIFT[2]);}
   if(/canopy_glass/.test(mat.name)&&'roughness' in mat){mat.roughness=.12;mat.metallic=.2;if(mat.clearCoat){mat.clearCoat.isEnabled=true;mat.clearCoat.intensity=.7;mat.clearCoat.roughness=.05;}}}
  // The wing-rail muzzles and the chin guns: a small additive flash each, hidden until flash().
  const flashMat=new B.StandardMaterial('kestrel-muzzle-flash-'+node.uniqueId,scene);flashMat.emissiveColor=new B.Color3(1,.62,.26);flashMat.diffuseColor=B.Color3.Black();flashMat.specularColor=B.Color3.Black();flashMat.disableLighting=true;flashMat.alphaMode=B.Engine.ALPHA_ADD;flashMat.alpha=0;own.push(flashMat);
  const flashes=['muzzle_left','muzzle_right','muzzle_chin_left','muzzle_chin_right'].filter(k=>hooks[k]).map(k=>{const f=B.MeshBuilder.CreateSphere('kestrel-flash-'+k,{diameter:.26,segments:6},scene);f.parent=hooks[k];f.scaling.z=1.8;f.material=flashMat;f.isPickable=false;f.setEnabled(false);return {k,f,t:0};});
  const gear=['gear_nose','gear_left','gear_right'].map(k=>hooks[k]).filter(Boolean).map(n=>{if(n.rotationQuaternion){n.rotation=n.rotationQuaternion.toEulerAngles();n.rotationQuaternion=null;}return {n,y:n.scaling.y,rx:n.rotation.x,fit:1};});
  let thrust=landed?GLOW.cold:GLOW.idle,gearDown=1;
  const api={hooks,muzzles:flashes.map(f=>hooks[f.k]),missiles:['missile_left','missile_right'].map(k=>hooks[k]).filter(Boolean),engines:['engine_left','engine_right'].map(k=>hooks[k]).filter(Boolean),
   // the lit core: a dim ember when cold, a hot core that widens toward the nozzle's lip at full burn
   setThrust(t){thrust=glowAt(t);if(exhaust){exhaust.emissiveColor=hot.scale(.04+1.45*Math.pow(thrust,1.15));if('emissiveIntensity' in exhaust)exhaust.emissiveIntensity=1;}
    for(const k of ['exhaust_left','exhaust_right'])if(hooks[k]){const r=.62+.38*Math.min(1,thrust);hooks[k].scaling.x=hooks[k].scaling.y=r;}return thrust;},
   thrust:()=>thrust,
   // 1: legs down; 0: folded up into the hull (hidden once folded, so nothing pokes through)
   setGear(f){gearDown=Math.max(0,Math.min(1,f));for(const g of gear){g.n.setEnabled(gearDown>.03);g.n.scaling.y=g.y*g.fit*(.15+.85*gearDown);g.n.rotation.x=g.rx+(1-gearDown)*1.2;}return gearDown;},
   gear:()=>gearDown,
   // groundY in ship space (the space landBoarding measures in): stretch each leg so its wheel meets the floor.
   fitGround(groundY){const inv=B.Matrix.Invert(node.computeWorldMatrix(true));for(const g of gear){g.n.computeWorldMatrix(true);const meshes=g.n.getChildMeshes?g.n.getChildMeshes(false):[];if(!meshes.length)continue;
     let lo=Infinity;for(const m of meshes){m.computeWorldMatrix(true);const bb=m.getBoundingInfo().boundingBox;for(const v of bb.vectorsWorld)lo=Math.min(lo,B.Vector3.TransformCoordinates(v,inv).y);}
     const at=B.Vector3.TransformCoordinates(g.n.getAbsolutePosition(),inv).y;g.fit*=gearScale(at,lo,groundY);g.n.scaling.y=g.y*g.fit;}return gear.map(g=>g.fit);},
   flash(side){for(const f of flashes)if(side==null||f.k.includes(side)){f.t=.07;f.f.setEnabled(true);}}};
  const tick=scene.onBeforeRenderObservable.add(()=>{let any=false;const dt=Math.min(.1,(scene.getEngine().getDeltaTime()||16)/1000);for(const f of flashes)if(f.t>0){f.t-=dt;any=true;if(f.t<=0)f.f.setEnabled(false);{const r=.7+Math.random()*.6;f.f.scaling.set(r,r,r*1.8);}}flashMat.alpha=any?.95:0;});
  node.onDisposeObservable.addOnce(()=>{scene.onBeforeRenderObservable.remove(tick);for(const m of own)m.dispose();});
  api.setThrust(thrust);
  node.metadata={...(node.metadata||{}),kestrel:api,model:'kestrel',landed:!!landed,placeholder:false};
  return node;
 }
 const api={MODEL,GLOW,HOOKS,definitions,register,gearScale,dress};
 if(typeof module!=='undefined')module.exports=api;else root.VoidKestrel=api;
})(globalThis);
