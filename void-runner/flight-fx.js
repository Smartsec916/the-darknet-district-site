/* Flight weapon visuals in the Babylon space view (the owner, 19 Nov 2026: "Upgrade laser cannon graphics", "a missile animation").
   babylon-renderer.js renderFlight calls VoidFlightFx.render(kit, snapshot) each frame; when it draws, the old stretched-sphere bolts and missiles are not drawn.
   - Pulse bolts: a thin hot core inside a soft additive glow, oriented along their flight; enemy bolts are red. Muzzle flashes at the Kestrel's two guns
     (from the cockpit they sit low on either side), shield flicker on a shielded target, sparks from VoidCombatEffects 'impact'.
   - Missiles: a dark metal body with a fin ring, a flickering motor flame and a smoke trail (puffs that start hot and turn to grey smoke; positions are kept by
     combat.js missileTrail and move with the world like everything in flight); launch flash at the wing rail it left from (left and right in turn).
   Colours follow the art direction: pale, slightly cool energy and warm motor light, no saturated neon. Instanced; the trail is capped per quality tier. */
(function(root){
 'use strict';
 let kit=null,parts=null;const flashes=[],shields=[];
 const CAP={low:90,medium:200,high:300,ultra:320};
 function radial(B,scene,name,stops){const t=new B.DynamicTexture(name,{width:64,height:64},scene,false),g=t.getContext(),r=g.createRadialGradient(32,32,0,32,32,32);for(const [o,c] of stops)r.addColorStop(o,c);g.fillStyle=r;g.fillRect(0,0,64,64);t.hasAlpha=true;t.update();return t;}
 function glowMat(B,scene,name,hex,alpha,tex){const m=new B.StandardMaterial(name,scene);m.disableLighting=true;m.emissiveColor=tex?new B.Color3(1,1,1):B.Color3.FromHexString(hex);m.diffuseColor=new B.Color3(0,0,0);m.alpha=alpha;m.alphaMode=B.Engine.ALPHA_ADD;if(tex){m.diffuseTexture=tex;m.opacityTexture=tex;m.useAlphaFromDiffuseTexture=true;}m.backFaceCulling=false;return m;}
 function build(k){const {B,scene,root:parent}=k,mk=(mesh,mat)=>{mesh.material=mat;mesh.parent=parent;mesh.isVisible=false;mesh.isPickable=false;return mesh;};
  const axisZ=m=>{m.rotation.x=Math.PI/2;m.bakeCurrentTransformIntoVertices();return m;};
  const p={pools:{}};
  p.src={
   core:mk(axisZ(B.MeshBuilder.CreateCylinder('fx-bolt-core',{height:1,diameter:1,tessellation:6},scene)),glowMat(B,scene,'fx-bolt-core','#e9fbff',1)),
   glow:mk(axisZ(B.MeshBuilder.CreateCylinder('fx-bolt-glow',{height:1,diameterTop:.55,diameterBottom:1,tessellation:8},scene)),glowMat(B,scene,'fx-bolt-glow','#5dbde6',.42)),
   hcore:mk(axisZ(B.MeshBuilder.CreateCylinder('fx-hbolt-core',{height:1,diameter:1,tessellation:6},scene)),glowMat(B,scene,'fx-hbolt-core','#ffe3d6',1)),
   hglow:mk(axisZ(B.MeshBuilder.CreateCylinder('fx-hbolt-glow',{height:1,diameter:1,tessellation:8},scene)),glowMat(B,scene,'fx-hbolt-glow','#d8432f',.45)),
   body:null,flame:null,flash:null,shield:null,puff:[]};
  // missile: body, nose and four fins merged into one mesh (dark gunmetal, lit by the scene)
  {const metal=new B.StandardMaterial('fx-missile-metal',scene);metal.diffuseColor=B.Color3.FromHexString('#6c7177');metal.specularColor=new B.Color3(.5,.5,.55);metal.emissiveColor=B.Color3.FromHexString('#24272b');
   const body=axisZ(B.MeshBuilder.CreateCylinder('fx-m-body',{height:1.1,diameter:.13,tessellation:10},scene)),nose=axisZ(B.MeshBuilder.CreateCylinder('fx-m-nose',{height:.26,diameterTop:0,diameterBottom:.13,tessellation:10},scene));nose.position.z=.68;nose.bakeCurrentTransformIntoVertices();
   const band=axisZ(B.MeshBuilder.CreateCylinder('fx-m-band',{height:.06,diameter:.142,tessellation:10},scene));band.position.z=.32;band.bakeCurrentTransformIntoVertices();
   const fins=[0,1,2,3].map(i=>{const f=B.MeshBuilder.CreateBox('fx-m-fin',{width:.012,height:.2,depth:.22},scene);f.position.set(0,.1,-.44);f.bakeCurrentTransformIntoVertices();f.rotation.z=i*Math.PI/2+Math.PI/4;f.bakeCurrentTransformIntoVertices();return f;});
   const merged=B.Mesh.MergeMeshes([body,nose,band,...fins],true,true);merged.name='fx-missile';p.src.body=mk(merged,metal);}
  p.flameTex=radial(B,scene,'fx-flame',[[0,'#fffaf0ff'],[.18,'#ffe2b0f0'],[.45,'#ff9a4a80'],[1,'#ff6a2000']]);
  p.src.flame=mk(B.MeshBuilder.CreatePlane('fx-flame',{size:1},scene),glowMat(B,scene,'fx-flame-m','#ffffff',1,p.flameTex));p.src.flame.billboardMode=B.Mesh.BILLBOARDMODE_ALL;
  p.flashTex=radial(B,scene,'fx-muzzle',[[0,'#ffffffff'],[.2,'#dff6ffe8'],[.5,'#8ccfff66'],[1,'#5aaee800']]);
  p.src.flash=mk(B.MeshBuilder.CreatePlane('fx-flash',{size:1},scene),glowMat(B,scene,'fx-flash-m','#ffffff',1,p.flashTex));p.src.flash.billboardMode=B.Mesh.BILLBOARDMODE_ALL;
  p.src.shield=mk(B.MeshBuilder.CreateSphere('fx-shield',{diameter:1,segments:10},scene),glowMat(B,scene,'fx-shield-m','#6fc6ee',.22));
  // smoke: four fading greys and one hot bucket, all soft round puffs
  const smokeTex=radial(B,scene,'fx-smoke',[[0,'#c9c6c2b0'],[.5,'#8d8a8760'],[1,'#5a585600']]),hotTex=radial(B,scene,'fx-hot',[[0,'#fff1d8ff'],[.35,'#ffb46acc'],[1,'#ff7a3000']]);
  [.6,.42,.26,.12].forEach((a,i)=>{const m=new B.StandardMaterial('fx-smoke-'+i,scene);m.diffuseTexture=smokeTex;m.opacityTexture=smokeTex;m.emissiveColor=B.Color3.FromHexString('#a6a29c');m.disableLighting=true;m.alpha=a;m.backFaceCulling=false;const s=mk(B.MeshBuilder.CreatePlane('fx-puff-'+i,{size:1},scene),m);s.billboardMode=B.Mesh.BILLBOARDMODE_ALL;p.src.puff.push(s);});
  {const s=mk(B.MeshBuilder.CreatePlane('fx-puff-hot',{size:1},scene),glowMat(B,scene,'fx-puff-hot-m','#ffffff',.9,hotTex));s.billboardMode=B.Mesh.BILLBOARDMODE_ALL;p.src.hot=s;}
  return p;}
 function pool(name,src,i){const list=parts.pools[name]??=[];if(!list[i]){const m=src.createInstance(name+'-'+i);m.parent=kit.root;m.isPickable=false;if(src.billboardMode)m.billboardMode=src.billboardMode;list.push(m);}const m=list[i];m.setEnabled(true);return m;}
 function hideFrom(name,n){for(const m of (parts.pools[name]||[]).slice(n))m.setEnabled(false);}
 const up={x:0,y:1,z:0};
 function orient(m,dir){const d=kit.vector(dir);if(d.lengthSquared()<1e-8)return;m.lookAt(m.position.add(d));}
 function bolts(name,list,core,glow,len,width,glowW){let n=0;for(const o of list){const dir={x:o.vx||0,y:o.vy||0,z:o.vz??1};const speed=Math.hypot(dir.x,dir.y,dir.z)||1,l=Math.min(len,speed*.016);
   const c=pool(name+'c',core,n),g=pool(name+'g',glow,n);for(const m of [c,g]){m.position.copyFrom(kit.vector({x:o.x-dir.x/speed*l*.5,y:o.y-dir.y/speed*l*.5,z:o.z-dir.z/speed*l*.5}));orient(m,dir);}
   c.scaling.set(width,width,l);g.scaling.set(glowW,glowW,l*1.25);n++;}hideFrom(name+'c',n);hideFrom(name+'g',n);}
 // world-anchored offsets on the ship (they follow the cockpit's basis)
 const onShip=(b,r,u,f)=>({x:b.r.x*r+b.u.x*u+b.f.x*f,y:b.r.y*r+b.u.y*u+b.f.y*f,z:b.r.z*r+b.u.z*u+b.f.z*f});
 function render(k,snap){
  if(!k?.scene||!k.B)return false;
  if(!parts||kit?.scene!==k.scene||parts.src.core.isDisposed()){kit=k;parts=build(k);}kit=k;
  const B=k.B,b=snap.basis,t=snap.time||0;
  bolts('pb',snap.bullets||[],parts.src.core,parts.src.glow,3.2,.045,.32);
  bolts('hb',snap.hostile||[],parts.src.hcore,parts.src.hglow,2.6,.05,.36);
  // missiles (the player's and the enemies')
  let n=0;for(const m of snap.missiles||[]){const d=m.direction||{x:0,y:0,z:1},body=pool('mb',parts.src.body,n),fl=pool('mf',parts.src.flame,n);
   body.position.copyFrom(k.vector(m));orient(body,d);const heavy=m.type==='m2';body.scaling.setAll(heavy?2.1:1.6);
   const flick=.8+.25*Math.sin(t*61+n*2.3)+.12*Math.sin(t*137+n);fl.position.copyFrom(k.vector({x:m.x-d.x*(heavy?1.3:1),y:m.y-d.y*(heavy?1.3:1),z:m.z-d.z*(heavy?1.3:1)}));fl.scaling.setAll((heavy?2:1.5)*flick);n++;}
  hideFrom('mb',n);hideFrom('mf',n);
  // smoke trail
  const cap=CAP[k.quality]||200,trail=(snap.trails||[]).slice(-cap),counts=[0,0,0,0,0];
  for(const q of trail){const a=q.age/q.life,hot=q.age<.07,bucket=hot?4:Math.min(3,Math.floor(a*4)),src=hot?parts.src.hot:parts.src.puff[bucket],m=pool('tp'+bucket,src,counts[bucket]++);
   m.position.copyFrom(k.vector(q));const s=q.size*(hot?1.1:1+a*3.2);m.scaling.setAll(s);}
  for(let i=0;i<5;i++)hideFrom('tp'+i,counts[i]);
  // muzzle and rail flashes
  for(let i=flashes.length-1;i>=0;i--){flashes[i].age+=snap.dt||1/60;if(flashes[i].age>flashes[i].life)flashes.splice(i,1);}
  let f=0;for(const x of flashes){const m=pool('fl',parts.src.flash,f++),k01=1-x.age/x.life;m.position.copyFrom(k.vector(onShip(b,x.r,x.u,x.f)));m.scaling.setAll(x.size*(.6+.6*k01));m.visibility=k01;}hideFrom('fl',f);
  // shield flicker round a shielded target
  for(let i=shields.length-1;i>=0;i--){shields[i].age+=snap.dt||1/60;if(shields[i].age>.18||shields[i].e.dead)shields.splice(i,1);}
  let s=0;for(const x of shields){const m=pool('sh',parts.src.shield,s++);m.position.copyFrom(k.vector(x.e));m.scaling.setAll((x.e.size||1)*3.4);m.visibility=(1-x.age/.18)*(.6+.4*Math.sin(t*90));}hideFrom('sh',s);
  diag.bolts=(snap.bullets||[]).length;diag.missiles=n;diag.puffs=trail.length;diag.flashes=f;diag.frames++;
  return true;}
 const diag={bolts:0,missiles:0,puffs:0,flashes:0,frames:0,muzzles:0,launches:0,impacts:0};
 root.VoidFlightFx={render,diag,
  // the two pulse cannons (low on either side of the canopy from the pilot's seat)
  muzzle(){diag.muzzles++;for(const side of [-1,1])flashes.push({r:.7*side,u:-.32,f:1.5,size:.75,age:0,life:.07});if(flashes.length>24)flashes.splice(0,flashes.length-24);},
  launch(m){diag.launches++;flashes.push({r:1.55*(m?.side||1),u:-.55,f:1.4,size:1.6,age:0,life:.16});},
  impact(e,shielded){diag.impacts++;if(shielded&&e)shields.push({e,age:0});},
  reset(){flashes.length=0;shields.length=0;}};
})(globalThis);
