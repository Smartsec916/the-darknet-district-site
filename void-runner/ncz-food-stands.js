/* One working street-food counter in each NeoChinatown quarter. The Port counter in
   the parked rebuild takes this one's place if that rebuild is enabled later. */
(function(root){
 'use strict';
 const STANDS={
  port:{name:'Docklight Noodles',x:35.5,z:-87.8,yaw:0,food:'NOODLES',accent:'#df9b5a',look:'communion-tech'},
  oldtown:{name:'Lantern Kitchen',x:68.4,z:-87,yaw:Math.PI/2,food:'HOT NOODLES',accent:'#d58165',look:'ncz-neon'},
  avenue:{name:'Jade Circuit Dumplings',x:110,z:-16.8,yaw:Math.PI,food:'DUMPLINGS',accent:'#8dc6af',look:'fixer-01'},
  'far-south':{name:'Southline Broth',x:53.6,z:-155,yaw:-Math.PI/2,food:'BROTH',accent:'#d0a66c',look:'runner-02'},
  outskirts:{name:'Last Light Rice & Tea',x:86,z:-237,yaw:Math.PI/2,food:'RICE / TEA',accent:'#b6a786',look:'fixer-01'}
 };
 const world=(s,x,z)=>[s.x+Math.cos(s.yaw)*x+Math.sin(s.yaw)*z,s.z-Math.sin(s.yaw)*x+Math.cos(s.yaw)*z];
 const front=s=>world(s,0,-2.15);
 const prompt=q=>{const s=STANDS[q];if(!s)return null;const [x,z]=front(s);return {id:'food-stand-'+q,label:'TALK TO '+s.name.toUpperCase()+' VENDOR',position:[x,1.7,z],action:'ncz-food-vendor',quarter:q,range:2.5};};
 const seats=q=>{const s=STANDS[q];if(!s)return [];return [-1.35,-.45,.45,1.35].map((offset,i)=>{const [x,z]=world(s,offset,-1.55);return {id:'food-seat-'+q+'-'+i,quarter:q,seat:i,occupied:i===3,x,z,yaw:s.yaw+Math.atan2(-offset,1.9)};});};
 const seatPrompts=q=>seats(q).filter(s=>!s.occupied).map(s=>({id:s.id,label:'SIT AT '+STANDS[q].name.toUpperCase(),position:[s.x,1.7,s.z],action:'ncz-food-seat',quarter:q,seat:s.seat,range:1.6}));
 const solids=q=>{const s=STANDS[q];if(!s)return [];const across=Math.abs(Math.sin(s.yaw))>.5;return [{id:'food-cart-'+q,position:[s.x,.78,s.z],size:across?[1.3,1.56,3.62]:[3.62,1.56,1.3]},...seats(q).map((p,i)=>({id:p.id+'-solid',position:[p.x,.29,p.z],size:[.48,.58,.48]}))];};
 const order={port:'Hot noodles. Watch your step on the pad.',oldtown:'Fresh noodles. The alley crowd likes extra chili.',avenue:'Dumplings are ready. Eat before the checkpoint queue.',
  'far-south':'Broth is hot. South Gate workers get the first pot.',outskirts:'Rice and tea. The stove runs while the fuel lasts.'};
 const active=new Map();
 const greet=q=>active.get(q)?.greet();
 function build({B,scene,parent,quarter,quality,instance}){
  const s=STANDS[quarter];if(!s||quarter==='port'&&root.VoidPort?.enabled)return null;
  const node=new B.TransformNode('food-stand-'+quarter,scene);node.parent=parent;node.position.set(s.x,0,s.z);node.rotation.y=s.yaw;
  const made=[],materials=[],textures=[],low=quality==='low';
  function material(name,color,rough=.75,metal=0){const m=new B.PBRMaterial('food-'+quarter+'-'+name,scene);m.albedoColor=B.Color3.FromHexString(color);m.roughness=rough;m.metallic=metal;materials.push(m);return m;}
  const steel=material('steel','#7d8584',.47,.68),paint=material('paint',quarter==='outskirts'?'#596363':'#505b60',.7,.35),rubber=material('rubber','#141b1d',.9),wood=material('wood','#59483c',.9),food=material('food','#b98d5a',.86),ceramic=material('ceramic','#b4b7ac',.55),accent=material('accent',s.accent,.6,.13);
  // Oxidation, scuffs and cleaning streaks keep the metal from reading as a flat box.
  const wear=new B.DynamicTexture('food-wear-'+quarter,{width:256,height:256},scene,true),wg=wear.getContext();let seed=quarter.length*7919+17;const rnd=()=>((seed=seed*16807%2147483647)-1)/2147483646;
  wg.fillStyle='#e5e5e0';wg.fillRect(0,0,256,256);for(let i=0;i<800;i++){const x=rnd()*256,y=rnd()*256;wg.fillStyle=i%3?'rgba(25,28,29,'+(.02+rnd()*.08)+')':'rgba(255,255,255,'+(.02+rnd()*.08)+')';wg.fillRect(x,y,.5+rnd()*12,.5+rnd()*2);}for(let i=0;i<35;i++){wg.strokeStyle='rgba(28,31,31,'+(.04+rnd()*.1)+')';wg.lineWidth=.5+rnd();wg.beginPath();const x=rnd()*256,y=rnd()*256;wg.moveTo(x,y);wg.lineTo(x+(rnd()-.5)*65,y+(rnd()-.5)*8);wg.stroke();}wear.update();textures.push(wear);paint.albedoTexture=wear;steel.albedoTexture=wear;
  function keep(mesh,m,p){mesh.parent=node;mesh.position.set(...p);mesh.material=m;mesh.isPickable=false;mesh.receiveShadows=true;made.push(mesh);return mesh;}
  const box=(n,w,h,d,p,m)=>keep(B.MeshBuilder.CreateBox('food-'+n,{width:w,height:h,depth:d},scene),m,p);
  const cyl=(n,r,h,p,m,t=12)=>keep(B.MeshBuilder.CreateCylinder('food-'+n,{diameter:r*2,height:h,tessellation:t},scene),m,p);
  // Cart body: recessed work bay, drain lip, guarded burners, service shelf and canopy.
  box('chassis',3.55,.16,1.25,[0,.52,0],steel);box('lower-cabinet',3.38,.64,.95,[0,.88,.12],paint);
  box('worktop',3.62,.075,1.32,[0,1.25,0],steel);box('counter-front',3.55,.5,.08,[0,1.03,-.67],wood);
  box('service-lip',3.59,.04,.17,[0,1.28,-.7],accent);
  for(const x of [-1.42,1.42]){cyl('wheel',.28,.12,[x,.28,.55],rubber,16).rotation.z=Math.PI/2;cyl('axle',.08,.15,[x,.28,.55],steel,12).rotation.z=Math.PI/2;
   box('post',.055,1.68,.055,[x,2.13,.48],steel);box('canopy-arm',.055,.055,1.18,[x,2.9,-.05],steel);}
  box('roof',3.78,.095,1.63,[0,2.96,-.12],paint);box('rain-gutter',3.8,.08,.09,[0,2.94,-.96],steel);
  for(let i=-5;i<=5;i++){box('roof-rib',.025,.025,1.55,[i*.35,3.02,-.12],steel);}
  box('splashback',3.45,.38,.07,[0,1.45,.57],paint);box('shelf',3.1,.05,.22,[0,1.86,.44],steel);
  for(const x of [-.82,-.17,.52]){cyl('pan',.19,.11,[x,1.37,.17],rubber);cyl('pot',.145,.25,[x,1.52,.17],steel);cyl('lid',.16,.025,[x,1.66,.17],paint);}
  for(let i=0;i<4;i++){cyl('bowl',.115,.09,[-.96+i*.27,1.34,-.35],ceramic);cyl('serving',.08,.035,[-.96+i*.27,1.4,-.35],food);}
  for(let i=0;i<3;i++){box('supply-crate',.39,.22,.34,[.2+i*.43,.72,-.07],wood);box('crate-lid',.4,.025,.35,[.2+i*.43,.84,-.07],paint);}
  for(const seat of seats(quarter)){const x=[-1.35,-.45,.45,1.35][seat.seat];cyl('stool-foot',.23,.035,[x,.035,-1.55],rubber);cyl('stool-post',.055,.48,[x,.28,-1.55],steel);cyl('stool-seat',.25,.08,[x,.56,-1.55],seat.occupied?wood:paint,16);}
  // Small practical lamp, no outline glow. Shared sign texture is readable at player height.
  const lamp=new B.StandardMaterial('food-'+quarter+'-lamp',scene);lamp.emissiveColor=B.Color3.FromHexString('#e8b477').scale(.55);lamp.diffuseColor=B.Color3.FromHexString('#75664e');materials.push(lamp);
  box('task-lamp',.48,.07,.11,[0,2.7,-.47],lamp);
  const sign=new B.DynamicTexture('food-'+quarter+'-menu',{width:512,height:128},scene,true);const g=sign.getContext();g.fillStyle='#161d1d';g.fillRect(0,0,512,128);g.fillStyle=s.accent;g.fillRect(0,0,512,7);g.textAlign='center';g.textBaseline='middle';
  let nameSize=40;do{g.font='bold '+nameSize+'px sans-serif';if(g.measureText(s.name.toUpperCase()).width<=470)break;nameSize-=2;}while(nameSize>24);
  g.fillStyle='#f2e8d8';g.fillText(s.name.toUpperCase(),256,45);g.fillStyle=s.accent;g.font='bold 25px sans-serif';g.fillText(s.food,256,96);sign.update();textures.push(sign);
  const signMat=new B.StandardMaterial('food-'+quarter+'-sign',scene);signMat.diffuseTexture=sign;signMat.emissiveTexture=sign;signMat.emissiveColor=new B.Color3(.22,.22,.22);signMat.backFaceCulling=false;materials.push(signMat);
  keep(B.MeshBuilder.CreatePlane('food-menu-'+quarter,{width:2.45,height:.61,sideOrientation:B.Mesh.DOUBLESIDE},scene),signMat,[0,2.54,-.53]);
  const steam=[];if(!low){const puff=new B.DynamicTexture('food-puff-'+quarter,{width:32,height:32},scene,true);const pg=puff.getContext(),grad=pg.createRadialGradient(16,16,1,16,16,16);grad.addColorStop(0,'rgba(255,255,255,.6)');grad.addColorStop(1,'rgba(255,255,255,0)');pg.fillStyle=grad;pg.fillRect(0,0,32,32);puff.update();textures.push(puff);for(const x of [-.17,.52]){const ps=new B.ParticleSystem('food-steam-'+quarter,24,scene);ps.particleTexture=puff;ps.emitter=node;ps.minEmitBox=new B.Vector3(x-.08,1.72,.09);ps.maxEmitBox=new B.Vector3(x+.08,1.75,.25);ps.color1=new B.Color4(.6,.68,.67,.11);ps.color2=new B.Color4(.55,.6,.6,.04);ps.colorDead=new B.Color4(.55,.6,.6,0);ps.minSize=.12;ps.maxSize=.32;ps.minLifeTime=.7;ps.maxLifeTime=1.5;ps.emitRate=7;ps.direction1=new B.Vector3(-.05,.22,-.04);ps.direction2=new B.Vector3(.08,.4,.05);ps.minEmitPower=.2;ps.maxEmitPower=.5;ps.updateSpeed=.03;ps.start();steam.push(ps);}}
  let vendor=null,customer=null,anim=null,elapsed=0,pose=0,disposed=false;
  const cast=[s.look,'ncz-neon','fixer-01','runner-02','communion-tech'];
  function spawn(){if(vendor||!instance||disposed)return;for(const look of cast){try{vendor=instance('crowd:'+look,node);if(vendor){vendor.position.set(0,.55,.35);vendor.rotation.y=Math.PI;vendor.metadata={...vendor.metadata,foodVendor:quarter};anim=root.VoidCrowd?.animate?.(vendor,look,'idle')||null;break;}}catch{}}}
  function spawnCustomer(){if(customer||!instance||disposed)return;const look='fixer-01';try{customer=instance('crowd:'+look,node);if(customer){customer.position.set(1.35,-.25,-1.55);customer.rotation.y=0;customer.metadata={...customer.metadata,foodCustomer:quarter};for(const g of customer.metadata.animationGroups||[])g.stop();
    // The stock sit clip leaves this particular street figure upright on a stool. Hold a seated leg pose instead.
    const bend={LeftUpLeg:-1.15,RightUpLeg:-1.15,LeftLeg:1.3,RightLeg:1.3};for(const joint of customer.getDescendants(false))for(const [name,angle] of Object.entries(bend))if(joint.name.endsWith('mixamorig:'+name)&&joint.rotationQuaternion)joint.rotationQuaternion.multiplyInPlace(B.Quaternion.RotationAxis(B.Axis.X,angle));
   }}catch{}}
  function tick(dt){if(disposed)return;elapsed+=dt;if(elapsed>.5){if(!vendor)spawn();if(!customer)spawnCustomer();}if(vendor){pose-=dt;if(pose<=0){pose=5+(quarter.length%3);anim?.play?.('idle');}}}
  function respond(){if(!vendor)return;pose=3;anim?.play?.('talk');}
  function dispose(){disposed=true;if(active.get(quarter)===api)active.delete(quarter);vendor?.dispose(false,false);customer?.dispose(false,false);for(const p of steam){p.stop();p.dispose(false);}for(const m of made)m.dispose();for(const t of textures)t.dispose();for(const m of materials)m.dispose();node.dispose();}
  const api={tick,dispose,node,greet:respond,get vendor(){return vendor;},get customer(){return customer;}};active.set(quarter,api);return api;
 }
 const api={STANDS,world,front,prompt,seats,seatPrompts,solids,order,build,greet};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VoidFoodStands=api;
})(globalThis);
