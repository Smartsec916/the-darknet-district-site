/* Reusable security actors built from Babylon primitives: the security robot, the patrol drone and the security camera (docs/development/CORPORATE.md).
   Browser only. Each builder returns an object with a root TransformNode and the few parts that move; the pure rules that decide where they go and what they see are in
   corporate-security.js. Robots are PASSIVE: nothing here shoots. `hooks` on the security object (see corporate-security.js on()) is where later missions attach escalation.
   Merged by material (a robot is about ten meshes), shared materials, no real lights. */
(function(root){
 'use strict';
 function kit(B,scene,own){
  const cache=new Map();
  const M=(name,hex,em,spec=.12)=>{const k=name+hex+em;if(cache.has(k))return cache.get(k);const m=new B.StandardMaterial('act-'+name,scene);m.diffuseColor=B.Color3.FromHexString(hex);m.specularColor=new B.Color3(spec,spec,spec*1.1);m.specularPower=24;if(em)m.emissiveColor=B.Color3.FromHexString(em);own.push(m);cache.set(k,m);return m;};
  const G=(name,hex,k=1)=>{const key='g'+name+hex+k;if(cache.has(key))return cache.get(key);const m=new B.StandardMaterial('act-'+name,scene);m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.emissiveColor=B.Color3.FromHexString(hex).scale(k);m.disableLighting=true;own.push(m);cache.set(key,m);return m;};
  return {M,G};
 }
 const merge=(B,parts,parent,name)=>{const groups=new Map();for(const p of parts){if(!groups.has(p.material))groups.set(p.material,[]);groups.get(p.material).push(p);}
  for(const [mat,list] of groups){const m=list.length>1?B.Mesh.MergeMeshes(list,true,true,undefined,false,false):list[0];if(m){m.name=name;m.parent=parent;m.material=mat;m.isPickable=false;}}};

 // ---- Security robot: bulky humanoid, matte black segmented armour, rounded faceless helmet, red/pink eyes, small orange chest light, side hoses, back antenna, rifle held low ----
 function buildRobot({B,scene,parent,own,id,x=0,z=0,yaw=0}){
  const {M,G}=kit(B,scene,own),armor=M('armor','#0c0d10',null,.08),seg=M('seg','#17191d',null,.14),worn=M('worn','#202328','#050607',.2),cableM=M('cable','#050506',null,.05),rifleM=M('rifle','#08090a',null,.18),
   eye=G('eye','#ff2a5a',1.1),chest=G('chest','#ff8a1f',1),tip=G('tip','#ff2a2a',1);
  const rootN=new B.TransformNode('robot-'+id,scene);rootN.parent=parent;rootN.position.set(x,0,z);rootN.rotation.y=yaw;
  const parts=[];const box=(w,h,d,px,py,pz,mat,rx=0,rz=0)=>{const m=B.MeshBuilder.CreateBox('rb',{width:w,height:h,depth:d},scene);m.position.set(px,py,pz);m.rotation.x=rx;m.rotation.z=rz;m.material=mat;parts.push(m);return m;};
  const cyl=(dia,h,px,py,pz,mat,rx=0,rz=0)=>{const m=B.MeshBuilder.CreateCylinder('rb',{diameter:dia,height:h,tessellation:10},scene);m.position.set(px,py,pz);m.rotation.x=rx;m.rotation.z=rz;m.material=mat;parts.push(m);return m;};
  for(const s of [-1,1]){box(.24,.82,.28,s*.18,.45,0,armor);box(.28,.22,.3,s*.18,.62,.03,seg);box(.27,.12,.42,s*.18,.07,.05,worn);box(.2,.3,.22,s*.18,.9,0,seg);}   // legs, knee guards, boots, thighs
  box(.6,.26,.36,0,1.04,0,worn);box(.66,.3,.4,0,1.3,0,armor);box(.62,.26,.42,0,1.56,.01,seg);box(.7,.2,.36,0,1.74,0,armor);   // pelvis, stacked torso plates (segmented)
  box(.1,.1,.05,.14,1.45,.22,chest);box(.5,.05,.04,0,1.34,.21,worn);box(.5,.05,.04,0,1.62,.23,worn);
  for(const s of [-1,1]){box(.34,.2,.38,s*.5,1.76,0,seg);box(.3,.14,.34,s*.52,1.65,0,armor);box(.16,.42,.17,s*.52,1.4,.04,worn);box(.15,.34,.16,s*.5,1.12,.2,armor,-.9);box(.12,.12,.12,s*.48,1.05,.36,worn);}   // pauldrons, arms, forearms, hands
  box(.5,.56,.22,0,1.5,-.3,worn);cyl(.025,.7,.16,2.12,-.34,seg);box(.04,.04,.04,.16,2.48,-.34,tip);cyl(.05,.5,-.18,1.9,-.3,worn,0,.2);   // backpack, antenna with a red tip
  box(.08,.09,.9,.28,1.04,.42,rifleM,.12);box(.09,.14,.2,.28,.97,.14,rifleM,.12);box(.05,.05,.22,.28,1.07,.92,rifleM,.12);   // rifle, held low across the body
  merge(B,parts,rootN,'robot-body');
  // side hoses: dark tubes from the backpack down each side of the waist
  for(const s of [-1,1]){const path=[new B.Vector3(s*.22,1.55,-.3),new B.Vector3(s*.42,1.4,-.2),new B.Vector3(s*.42,1.15,.02),new B.Vector3(s*.3,.98,.12)];const t=B.MeshBuilder.CreateTube('robot-hose',{path,radius:.025,tessellation:6},scene);t.material=cableM;t.parent=rootN;t.isPickable=false;}
  // head: a rounded faceless helmet on a neck, with a dark band and two small red/pink eyes. It turns on its own node (scanning).
  const head=new B.TransformNode('robot-head',scene);head.parent=rootN;head.position.set(0,1.98,0);
  const hp=[];const hm=(mesh,mat,px,py,pz)=>{mesh.material=mat;mesh.parent=head;mesh.position.set(px,py,pz);mesh.isPickable=false;hp.push(mesh);return mesh;};
  const helmet=hm(B.MeshBuilder.CreateSphere('robot-helmet',{diameterX:.34,diameterY:.4,diameterZ:.38,segments:12},scene),armor,0,.1,0);
  hm(B.MeshBuilder.CreateBox('robot-visor',{width:.3,height:.09,depth:.06},scene),worn,0,.08,.17);hm(B.MeshBuilder.CreateBox('robot-neck',{width:.2,height:.14,depth:.2},scene),seg,0,-.1,0);
  const eyes=[-1,1].map(s=>hm(B.MeshBuilder.CreateBox('robot-eye',{width:.07,height:.035,depth:.02},scene),eye,s*.075,.085,.205));
  const light=B.MeshBuilder.CreateBox('robot-chest-light',{width:.1,height:.1,depth:.05},scene);light.material=chest;light.parent=rootN;light.position.set(.14,1.45,.23);light.isPickable=false;
  return {id,root:rootN,head,eyes,light,pos:{x,z},yaw,headYaw:0,
   place(px,pz,by){rootN.position.set(px,0,pz);rootN.rotation.y=by;this.pos.x=px;this.pos.z=pz;this.yaw=by;},
   look(worldYaw){head.rotation.y=worldYaw-rootN.rotation.y;},
   dispose(){rootN.dispose(false,true);}};
 }

 // ---- Patrol drone: a small body, four spinning rotors, blinking navigation lights, a downward sensor eye and a soft pool of light on the ground ----
 function buildDrone({B,scene,parent,own,id,y=10}){
  const {M,G}=kit(B,scene,own),body=M('drone','#14161a','#06070a',.25),arm=M('drone-arm','#0c0d10',null,.1),redL=G('nav-red','#ff2a2a',1),grnL=G('nav-green','#39ff9c',1),whtL=G('nav-white','#e8f6ff',1),eye=G('drone-eye','#ff2a5a',1);
  const rootN=new B.TransformNode('drone-'+id,scene);rootN.parent=parent;
  const part=(mesh,mat,px,py,pz)=>{mesh.material=mat;mesh.parent=rootN;mesh.position.set(px,py,pz);mesh.isPickable=false;return mesh;};
  part(B.MeshBuilder.CreateCylinder('drone-body',{diameter:.55,height:.16,tessellation:12},scene),body,0,0,0);part(B.MeshBuilder.CreateBox('drone-belly',{width:.3,height:.1,depth:.34},scene),arm,0,-.1,0);
  const rotors=[];for(const [px,pz] of [[.4,.4],[-.4,.4],[.4,-.4],[-.4,-.4]]){const a=part(B.MeshBuilder.CreateBox('drone-arm',{width:.05,height:.04,depth:.05},scene),arm,px*.55,0,pz*.55);a.scaling.set(Math.hypot(px,pz)*8,1,1);a.rotation.y=-Math.atan2(pz,px);
   const r=part(B.MeshBuilder.CreateDisc('drone-rotor',{radius:.17,tessellation:14},scene),arm,px,.07,pz);r.rotation.x=Math.PI/2;r.material=arm;const rm=new B.StandardMaterial('drone-rotor',scene);rm.diffuseColor=new B.Color3(.05,.06,.07);rm.alpha=.35;rm.backFaceCulling=false;own.push(rm);r.material=rm;rotors.push(r);}
  const lights=[part(B.MeshBuilder.CreateBox('drone-nav',{width:.07,height:.05,depth:.07},scene),redL,-.3,.02,0),part(B.MeshBuilder.CreateBox('drone-nav',{width:.07,height:.05,depth:.07},scene),grnL,.3,.02,0),part(B.MeshBuilder.CreateBox('drone-nav',{width:.07,height:.05,depth:.07},scene),whtL,0,.02,-.3)];
  part(B.MeshBuilder.CreateDisc('drone-eye',{radius:.06,tessellation:10},scene),eye,0,-.16,0).rotation.x=Math.PI/2;
  // the sensor pool on the ground (additive, soft): follows the drone, so players can read where it is looking
  const pool=new B.DynamicTexture('drone-pool',{width:64,height:64},scene,false);own.push(pool);{const g=pool.getContext(),rg=g.createRadialGradient(32,32,2,32,32,32);rg.addColorStop(0,'rgba(120,230,255,.55)');rg.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle='#000';g.fillRect(0,0,64,64);g.fillStyle=rg;g.fillRect(0,0,64,64);pool.update();}
  const pm=new B.StandardMaterial('drone-pool',scene);pm.diffuseColor=B.Color3.Black();pm.specularColor=B.Color3.Black();pm.emissiveTexture=pool;pm.disableLighting=true;pm.alphaMode=B.Engine.ALPHA_ADD;pm.alpha=.4;pm.disableDepthWrite=true;own.push(pm);
  const spot=B.MeshBuilder.CreateGround('drone-spot',{width:11,height:11},scene);spot.material=pm;spot.parent=parent;spot.isPickable=false;
  let h=0;
  return {id,root:rootN,y,place(px,pz,heading,t,dt){h=h===0?heading:h;const d=((heading-h+Math.PI*3)%(Math.PI*2))-Math.PI;h+=d*Math.min(1,dt*2.4);rootN.position.set(px,y+Math.sin(t*1.3+px*.1)*.18,pz);rootN.rotation.y=h;rootN.rotation.z=-d*.25;spot.position.set(px,.06,pz);
    for(const r of rotors)r.rotation.y+=dt*60;const k=Math.floor(t*1.8)%2;lights[0].isVisible=k===0;lights[1].isVisible=k===1;lights[2].isVisible=Math.floor(t*3.6)%6===0;},
   dispose(){rootN.dispose(false,true);spot.dispose();}};
 }

 // ---- Security camera: a housing on a bracket with a head that sweeps, a red indicator and a floor footprint of its detection cone ----
 function buildCamera({B,scene,parent,own,cam}){
  const {M,G}=kit(B,scene,own),body=M('cam','#16181c','#07080a',.3),dark=M('cam-dark','#0b0c0f',null,.1),led=G('cam-led','#ff2a2a',1);
  const rootN=new B.TransformNode('camera-'+cam.id,scene);rootN.parent=parent;rootN.position.set(cam.x,cam.y||5,cam.z);
  const part=(mesh,mat,px,py,pz,par)=>{mesh.material=mat;mesh.parent=par||rootN;mesh.position.set(px,py,pz);mesh.isPickable=false;return mesh;};
  part(B.MeshBuilder.CreateBox('cam-mount',{width:.26,height:.26,depth:.12},scene),dark,0,0,0);part(B.MeshBuilder.CreateBox('cam-arm',{width:.07,height:.07,depth:.4},scene),dark,0,-.05,.2);
  const head=new B.TransformNode('cam-head',scene);head.parent=rootN;head.position.set(0,-.12,.4);
  part(B.MeshBuilder.CreateBox('cam-housing',{width:.2,height:.18,depth:.5},scene),body,0,0,.05,head);part(B.MeshBuilder.CreateCylinder('cam-lens',{diameter:.12,height:.1,tessellation:12},scene),dark,0,0,.32,head).rotation.x=Math.PI/2;
  const dot=part(B.MeshBuilder.CreateBox('cam-led',{width:.05,height:.05,depth:.05},scene),led,.09,.11,-.05,head);
  // the detection cone's footprint on the ground: a disc sector (additive, low alpha) that turns with the head. Gaps between sweeps are the blind spots.
  const arc=Math.min(.98,(cam.fov*2)/(Math.PI*2)),sector=B.MeshBuilder.CreateDisc('cam-cone',{radius:cam.range,arc,tessellation:22},scene);sector.parent=parent;sector.position.set(cam.x,.07,cam.z);sector.rotation.x=Math.PI/2;sector.isPickable=false;
  const cm=new B.StandardMaterial('cam-cone',scene);cm.diffuseColor=B.Color3.Black();cm.specularColor=B.Color3.Black();cm.emissiveColor=new B.Color3(.5,.07,.1);cm.disableLighting=true;cm.alpha=.08;cm.backFaceCulling=false;cm.disableDepthWrite=true;cm.alphaMode=B.Engine.ALPHA_ADD;own.push(cm);sector.material=cm;
  return {id:cam.id,root:rootN,head,dot,sector,cone:cm,
   aim(yaw,seen){head.rotation.y=yaw-0;sector.rotation.y=yaw+cam.fov-Math.PI/2;cm.alpha=seen?.26:.08;},
   blink(t,seen){dot.isVisible=seen?true:Math.floor(t*1.4)%3!==0;},
   dispose(){rootN.dispose(false,true);sector.dispose();}};
 }
 const api={buildRobot,buildDrone,buildCamera,merge,kit};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.VoidCorporateActors=api;
})(typeof globalThis!=='undefined'?globalThis:this);
