/* Realistic CC0 MakeHuman guests. Rendering and hit volumes follow the same skeleton. */
(function(root){
'use strict';
const B=root.BABYLON, V=(x,y,z)=>new B.Vector3(x,y,z);
const FILES=['guest-a.glb','guest-b.glb','guest-c.glb'];
const SWIM=['#ac315c','#277f96','#b28a37','#525dba','#cf663f','#34816b'];
function sample(track,time){const keys=track.keys;if(!keys.length)return null;const frame=keys[0].frame+(time*track.fps)%Math.max(.001,keys[keys.length-1].frame-keys[0].frame);let lo=0,hi=keys.length-1;while(hi-lo>1){const m=(lo+hi)>>1;if(keys[m].frame<=frame)lo=m;else hi=m;}const a=keys[lo],b=keys[hi],w=Math.max(0,Math.min(1,(frame-a.frame)/Math.max(.001,b.frame-a.frame)));return a.value.w!==undefined?B.Quaternion.Slerp(a.value,b.value,w):B.Vector3.Lerp(a.value,b.value,w);}
function tracks(group){return new Map((group?.targetedAnimations||[]).filter(t=>['position','rotationQuaternion','scaling'].includes(t.animation.targetProperty)).map(t=>[t.target.name.split(':').pop()+'/'+t.animation.targetProperty,{target:t.target,property:t.animation.targetProperty,keys:t.animation.getKeys(),fps:t.animation.framePerSecond}]));}
function prepare(scene,shadow){
 const containers=[];let failed=null;
 const ready=Promise.all(FILES.map(f=>B.SceneLoader.LoadAssetContainerAsync('assets/',f,scene))).then(a=>{if(scene.isDisposed){a.forEach(c=>c.dispose());return false;}containers.push(...a);return true;}).catch(e=>{failed=e;throw e;});
 scene.onDisposeObservable.add(()=>containers.forEach(c=>c.dispose()));
 function person(id,x,z,style=0,reception=false){
  const node=new B.TransformNode('adult guest '+id,scene);node.position=V(x,0,z);
  const view={node,hitMeshes:[],guard:0,phase:style,loaded:false,blend:0,time:style*.37,walkTime:style*.2,animate(){}};
  ready.then(()=>{if(scene.isDisposed||node.isDisposed())return;
   const source=containers[style%3],entry=source.instantiateModelsToScene(n=>id+'::'+n,false,{doNotInstantiate:true});
   const body=new B.TransformNode('guest model '+id,scene);body.parent=node;body.rotation.y=Math.PI;
   for(const r of entry.rootNodes){r.parent=body;r.setEnabled(true);}
   const meshList=entry.rootNodes.flatMap(n=>n.getChildMeshes());
   for(const mesh of meshList){mesh.isPickable=false;mesh.receiveShadows=true;if(shadow)shadow.addShadowCaster(mesh);if(mesh.material?.name.includes('hotel_swimwear')){mesh.material=mesh.material.clone('swimwear '+id);mesh.material.albedoColor=B.Color3.FromHexString(SWIM[style%6]);mesh.material.roughness=.72;}if(mesh.material&&'maxSimultaneousLights' in mesh.material)mesh.material.maxSimultaneousLights=6;}
   // MPFB bodies are exported in metres. Normalize variants, then retain modest adult build variation.
   const bounds=entry.rootNodes[0].getHierarchyBoundingVectors(true);const height=bounds.max.y-bounds.min.y;
   const scale=1.76/height;body.scaling=V(scale,scale,scale);body.position.y=-bounds.min.y*scale;
   node.scaling=V([1,.96,1.03,1.04,1, .97][style%6],[1,.98,1.025,1.01,1,.99][style%6],1);
   const groups=entry.animationGroups;groups.forEach(g=>g.stop());
   const group=name=>groups.find(g=>g.name.split('::').pop()===name)||groups.find(g=>g.name.endsWith(name));
   const idle=tracks(group('idle')),walk=tracks(group('walk')),guards=['guard','guard-palms','guard-cross'].map(name=>tracks(group(name)));
   const boneNodes=new Map();for(const skeleton of entry.skeletons)for(const bone of skeleton.bones){const n=bone.getTransformNode();if(n)boneNodes.set(bone.name.split(':').pop(),n);}
   const get=name=>boneNodes.get(name);
   const hidden=new B.StandardMaterial('hit volumes '+id,scene);hidden.alpha=0;hidden.disableLighting=true;
   function proxy(part,name,diameter){const m=B.MeshBuilder.CreateSphere('hit '+name,{diameter:1,segments:8},scene);m.material=hidden;m.parent=node;m.isPickable=true;m.metadata={npc:id,part};m.scaling=V(diameter,diameter,diameter);view.hitMeshes.push(m);return m;}
   const heads=proxy('head','head',.25),torso=proxy('torso','torso',.34),pelvis=proxy('torso','hips',.32);
   const limbs=[];for(const side of ['Left','Right'])for(const [a,b,width,part] of [['Arm','ForeArm',.11,'arm'],['ForeArm','Hand',.09,'arm'],['Hand','HandMiddle1',.10,'arm'],['UpLeg','Leg',.17,'torso'],['Leg','Foot',.12,'torso']])limbs.push({a:side+a,b:side+b,width,mesh:proxy(part,side+a,width)});
   function local(name){const n=get(name);if(!n)return V(0,0,0);n.computeWorldMatrix(true);return B.Vector3.TransformCoordinates(n.getAbsolutePosition(),node.getWorldMatrix().clone().invert());}
   function span(mesh,a,b,width){const direction=b.subtract(a),length=direction.length();mesh.position.copyFrom(a.add(b).scale(.5));mesh.scaling.set(width,length+width*.4,width);mesh.rotationQuaternion=B.Quaternion.FromUnitVectorsToRef(B.Axis.Y,direction.normalize(),mesh.rotationQuaternion||B.Quaternion.Identity());}
   const spoon=new B.TransformNode('dining spoon '+id,scene);spoon.parent=node;const steel=new B.StandardMaterial('utensil '+id,scene);steel.diffuseColor=new B.Color3(.5,.56,.6);const handle=B.MeshBuilder.CreateCylinder('spoon handle',{height:.15,diameter:.012,tessellation:8},scene),bowl=B.MeshBuilder.CreateSphere('spoon bowl',{diameter:1,segments:8},scene);bowl.scaling.set(.035,.055,.012);bowl.position.y=.09;for(const mesh of [handle,bowl]){mesh.parent=spoon;mesh.material=steel;mesh.isPickable=false;}spoon.setEnabled(false);
   const baseY=body.position.y;view.activity??={kind:'stand',progress:0};view.guardStyle=style%3;
   view.animate=function(dt,speed,shield){node.position.y=0;const activity=this.activity||{},kind=activity.kind||'stand',sleep=kind==='sleep'?1:kind==='waking'?Math.max(0,1-(activity.progress||0)*2):0,swim=kind==='swim'||kind==='exit-pool'?1:kind==='climb'?1-(activity.progress||0):0;body.rotation.x=-Math.PI/2*Math.max(sleep,swim);body.position.y=baseY;body.position.z=-.85*Math.max(sleep,swim);node.position.y=(kind==='waking'?.98*Math.min(1,2-2*(activity.progress||0)):sleep*.98)+swim*.06;const guard=guards[this.guardStyle%3];this.guard+=(Number(shield)-this.guard)*Math.min(1,dt*12);this.blend+=(Math.min(1,speed/.6)-this.blend)*Math.min(1,dt*10);this.time+=dt;this.walkTime+=dt*Math.max(.35,speed/1.45);
    for(const [key,track] of idle){let value=sample(track,this.time);const walking=walk.get(key);if(walking){const w=sample(walking,this.walkTime);value=value.w!==undefined?B.Quaternion.Slerp(value,w,this.blend):B.Vector3.Lerp(value,w,this.blend);}const guarded=guard.get(key);if(guarded&&/(Arm|Hand|Shoulder)/.test(key)){const g=sample(guarded,0);value=value.w!==undefined?B.Quaternion.Slerp(value,g,this.guard):B.Vector3.Lerp(value,g,this.guard);}track.target[track.property].copyFrom(value);}
    const seated=kind==='eating'?1:kind==='rising'?Math.max(0,1-(activity.progress||0)*2):0;
    if(seated){body.position.y=baseY-.47*seated;node.computeWorldMatrix(true);
     // Aim the actual skeleton in world space so limbs and hit volumes share the seated pose.
     const aim=(name,child,direction)=>{const a=get(name),b=get(child);if(!a?.rotationQuaternion||!b)return;a.computeWorldMatrix(true);b.computeWorldMatrix(true);const inverse=a.parent.computeWorldMatrix(true).clone().invert(),current=B.Vector3.TransformNormal(b.getAbsolutePosition().subtract(a.getAbsolutePosition()),inverse).normalize(),target=B.Vector3.TransformNormal(direction,inverse).normalize(),delta=B.Quaternion.FromUnitVectorsToRef(current,target,B.Quaternion.Identity()),q=delta.multiply(a.rotationQuaternion);a.rotationQuaternion.copyFrom(B.Quaternion.Slerp(a.rotationQuaternion,q,seated));a.computeWorldMatrix(true);};
     for(const side of ['Left','Right']){aim(side+'UpLeg',side+'Leg',V(0,-.12,-1));aim(side+'Leg',side+'Foot',V(0,-1,0));}
     const bite=(Math.sin(this.time*2.1)+1)/2;
     aim('LeftArm','LeftForeArm',V(-.12,-.7,-.6));aim('LeftForeArm','LeftHand',V(.1,.1,-1));
     aim('RightArm','RightForeArm',V(.1,-.7,-.55));aim('RightForeArm','RightHand',V(-.25,.15+bite*1.7,-1+bite*.9));
    }
    if(sleep){const breath=Math.sin(this.time*1.5)*.012;const chest=get('Spine2');if(chest?.rotationQuaternion)chest.rotationQuaternion.multiplyInPlace(B.Quaternion.RotationAxis(B.Axis.X,breath));}
    if(swim){for(const [side,phase] of [['Left',0],['Right',Math.PI]]){const arm=get(side+'Arm'),leg=get(side+'UpLeg');if(arm?.rotationQuaternion)arm.rotationQuaternion.multiplyInPlace(B.Quaternion.RotationAxis(B.Axis.X,Math.sin(this.time*3+phase)*1.1*swim));if(leg?.rotationQuaternion)leg.rotationQuaternion.multiplyInPlace(B.Quaternion.RotationAxis(B.Axis.X,Math.sin(this.time*5+phase)*.18*swim));}}
    if(kind==='climb'){for(const side of ['Left','Right']){const arm=get(side+'Arm'),leg=get(side+'Leg');if(arm?.rotationQuaternion)arm.rotationQuaternion.multiplyInPlace(B.Quaternion.RotationAxis(B.Axis.X,.8));if(leg?.rotationQuaternion)leg.rotationQuaternion.multiplyInPlace(B.Quaternion.RotationAxis(B.Axis.X,.7*Math.sin(Math.PI*(activity.progress||0))));}}
    node.computeWorldMatrix(true);for(const n of boneNodes.values())n.computeWorldMatrix(true);
    spoon.setEnabled(kind==='eating');if(kind==='eating')spoon.position.copyFrom(local('RightHand'));
    const h=local('Head');heads.position.copyFrom(h.add(V(0,.09*(1-Math.max(sleep,swim)),.09*Math.max(sleep,swim))));heads.scaling.set(.23,.29,.24);
    span(torso,local('Hips').add(V(0,.12,0)),local('Neck'),.34);pelvis.position.copyFrom(local('Hips'));pelvis.scaling.set(.34,.26,.24);
    for(const l of limbs)span(l.mesh,local(l.a),local(l.b),l.width);
   };
   view.loaded=true;view.body=body;view.meshes=meshList;view.bones=boneNodes;view.animate(0,0,false);
  }).catch(e=>{failed=e;});
  return view;
 }
 return {ready,person,get error(){return failed;}};
}
root.HotelCharacters={prepare};
})(globalThis);
