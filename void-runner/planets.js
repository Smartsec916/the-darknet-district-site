/* Faction homeworlds (design doc 10): The Nexus (Communion, Cantor System) and the Natural Order
   homeworld (Garrow System; name pending). layout() is gameplay data (walls, interaction points);
   build() is presentation only. Both are focused, walkable landing areas around the ship's pad. */
(function(root){
 const W=(id,x1,z1,x2,z2,h=6)=>({id,position:[(x1+x2)/2,h/2,(z1+z2)/2],size:[Math.abs(x2-x1)||.4,h,Math.abs(z2-z1)||.4]});
 const T=(id,label,position,extra={})=>({id,label,position,action:'homeworld-task',range:3,...extra});
 const worlds={
  nexus:{location:'nexus',name:'THE NEXUS / CANTOR',color:'#8fd4ee',
   solids:[W('core',-14,30,14,44,30),W('depot',-25,-10,-17,-2,4),W('aid',14,-8,22,0,3.5),W('relay',-18,14,-14,18,3),W('power',14,16,18,20,3.5)],
   interactions:[
    {id:'kess',label:'TALK / DR. ADRIAN KESS',position:[5,1.7,-8],action:'homeworld-talk',character:'kess',range:3},
    T('nexus-depot','COLLECT MEDICAL SUPPLIES',[-16,1.7,-6],{when:{flags:{nexusSupplies:'todo'}}}),
    T('nexus-aid','DELIVER SUPPLIES TO THE AID STATION',[13,1.7,-4],{when:{flags:{nexusSupplies:'carrying'}}}),
    T('nexus-relay','REPAIR THE RELAY JUNCTION',[-13,1.7,16],{when:{flags:{nexusRepair:'todo'}}}),
    T('nexus-power','RESTORE THE POWER TERMINAL',[13,1.7,18],{when:{flags:{nexusPower:'todo'}}})]},
  'order-homeworld':{location:'order-homeworld',name:'NATURAL ORDER HOMEWORLD / GARROW',color:'#c9a24a',
   solids:[W('barn',-30,-14,-20,-2,7),W('silos',-26,8,-18,16,9),W('workshop',-10,24,-2,30,4),W('farmhouse',22,-14,30,-6,5),W('stalls',16,12,24,18,3)],
   interactions:[
    {id:'mercer',label:'TALK / DANIEL MERCER',position:[5,1.7,-8],action:'homeworld-talk',character:'mercer',range:3},
    T('order-depot','COLLECT FARM EQUIPMENT',[-19,1.7,-8],{when:{flags:{orderEquipment:'todo'}}}),
    T('order-farm','DELIVER EQUIPMENT TO THE FARM',[21,1.7,-4],{when:{flags:{orderEquipment:'carrying'}}}),
    T('order-granary','COLLECT FOOD CRATES',[-17,1.7,12],{when:{flags:{orderFood:'todo'}}}),
    T('order-market','DELIVER FOOD TO THE DISTRIBUTION POINT',[15,1.7,15],{when:{flags:{orderFood:'carrying'}}}),
    T('order-workshop','COLLECT REPLACEMENT SOLAR PARTS',[-6,1.7,22.5],{when:{flags:{orderSolar:'todo'}}}),
    T('order-solar','REPAIR THE SOLAR INSTALLATION',[10,1.7,24],{when:{flags:{orderSolar:'carrying'}}})]}
 };
 function layout(id){const w=worlds[id];if(!w)return null;
  return {id:'planet-'+id,location:w.location,name:w.name,kind:'planet',planet:id,bounds:[38,40],spawn:[0,1.7,-20],yaw:0,color:w.color,ship:'starter',
   solids:w.solids.map(s=>({...s,position:s.position.slice(),size:s.size.slice()})),
   interactions:[{id:'board',label:'BOARD YOUR SHIP',position:[-2,1.7,-25],action:'board',range:3.5},...w.interactions.map(i=>({...i,position:i.position.slice()}))],signs:[]};}

 function build(id,{scene,parent,quality,characterModel,shipModel,state}){
  const B=root.BABYLON,low=quality==='low',owned=[],textures=[],lights=[],staticMeshes=new Map(),moving=[];
  let seed=id==='nexus'?913:5501;const rand=()=>((seed=seed*16807%2147483647)-1)/2147483646;
  const previous={clear:scene.clearColor.clone(),fogMode:scene.fogMode,fogDensity:scene.fogDensity,fogColor:scene.fogColor.clone()};
  const sun=scene.getLightByName('sun'),ambient=scene.getLightByName('ambient'),lightState={sun:sun?.intensity,ambient:ambient?.intensity};
  // Daylight worlds need less exposure than the game's dark stations (as Vesper does).
  const ip=scene.imageProcessingConfiguration,look={exposure:ip.exposure,contrast:ip.contrast};ip.exposure=id==='nexus'?1.15:1;ip.contrast=1.1;
  const mats={};
  function mat(key,hex,{rough=.85,metal=.1,glow=null}={}){if(mats[key])return mats[key];const m=new B.PBRMaterial('hw-'+key,scene);m.albedoColor=B.Color3.FromHexString(hex);m.roughness=rough;m.metallic=metal;if(glow)m.emissiveColor=B.Color3.FromHexString(glow);owned.push(m);return mats[key]=m;}
  function glow(key,hex,k=1){if(mats[key])return mats[key];const m=new B.StandardMaterial('hw-'+key,scene);m.diffuseColor=B.Color3.Black();m.emissiveColor=B.Color3.FromHexString(hex).scale(k);m.disableLighting=true;owned.push(m);return mats[key]=m;}
  function put(mesh,m,p,merge=true){mesh.material=m;mesh.position.set(...p);mesh.parent=parent;mesh.isPickable=false;if(merge){if(!staticMeshes.has(m))staticMeshes.set(m,[]);staticMeshes.get(m).push(mesh);}return mesh;}
  const box=(n,s,p,m,merge=true)=>put(B.MeshBuilder.CreateBox(n,{width:s[0],height:s[1],depth:s[2]},scene),m,p,merge);
  const cyl=(n,r,h,p,m,merge=true,t=14,top=r)=>put(B.MeshBuilder.CreateCylinder(n,{diameterTop:top*2,diameterBottom:r*2,height:h,tessellation:t},scene),m,p,merge);
  function texture(name,w,h,draw){const t=new B.DynamicTexture('hw-'+name,{width:w,height:h},scene,true);draw(t.getContext(),w,h);t.update();textures.push(t);return t;}
  function screen(name,w,h,p,ry,draw,k=1){const t=texture(name,256,Math.round(256*h/w),draw),m=new B.StandardMaterial('hw-'+name,scene);m.diffuseColor=B.Color3.Black();m.emissiveTexture=t;m.disableLighting=true;m.emissiveColor=new B.Color3(k,k,k);owned.push(m);const mesh=B.MeshBuilder.CreatePlane(name,{width:w,height:h,sideOrientation:B.Mesh.DOUBLESIDE},scene);put(mesh,m,p,false);mesh.rotation.y=ry;return {mesh,mat:m};}
  const point=(p,c,i,r)=>{if(low)return;const l=new B.PointLight('hw-light',new B.Vector3(...p),scene);l.diffuse=B.Color3.FromHexString(c);l.intensity=i;l.range=r;l.parent=parent;lights.push(l);};
  const person=(name,p,kneel=false)=>{const n=characterModel(name,parent,p,true);if(kneel&&n){n.scaling.y=.66;}return n;};
  const flags=()=>state?.story?.flags||{};
  const ground=(hex,size=96)=>{const g=B.MeshBuilder.CreateGround('hw-ground',{width:size,height:size},scene);g.material=mat('ground',hex);g.parent=parent;g.isPickable=false;g.position.y=-.01;return g;};
  // The player's ship on its pad.
  cyl('pad',5,.12,[-4,.06,-29],mat('pad','#3a3f44',{rough:.6,metal:.4}),true,32);
  const ship=shipModel('starter','friendly',parent);if(ship){ship.position.set(-4,1.1,-29);ship.scaling.setAll(1.6);ship.rotation.y=.3;}
  let tick=()=>{};
  if(id==='nexus'){
   scene.clearColor=new B.Color4(.42,.5,.57,1);scene.fogMode=B.Scene.FOGMODE_EXP2;scene.fogDensity=.012;scene.fogColor=new B.Color3(.55,.62,.68);
   if(sun)sun.intensity=.7;if(ambient)ambient.intensity=.75;
   const tile=texture('nexus-plaza',512,512,(g,w,h)=>{g.fillStyle='#6d7a83';g.fillRect(0,0,w,h);g.strokeStyle='#5b6770';g.lineWidth=3;for(let i=0;i<=w;i+=64){g.beginPath();g.moveTo(i,0);g.lineTo(i,h);g.stroke();g.beginPath();g.moveTo(0,i);g.lineTo(w,i);g.stroke();}
    g.strokeStyle='#3f484f';g.lineWidth=2;for(let k=0;k<14;k++){let x=rand()*w,y=rand()*h;g.beginPath();g.moveTo(x,y);for(let j=0;j<5;j++){x+=(rand()-.5)*60;y+=(rand()-.5)*60;g.lineTo(x,y);}g.stroke();}});
   const plaza=ground('#6d7a83');const pm=new B.StandardMaterial('hw-plaza',scene);pm.diffuseTexture=tile;tile.uScale=tile.vScale=8;pm.specularColor=new B.Color3(.05,.05,.05);owned.push(pm);plaza.material=pm;
   const white=mat('nexus-shell','#d6dde2',{rough:.5,metal:.2}),grey=mat('nexus-grey','#8e9aa3',{rough:.6,metal:.3}),dark=mat('nexus-dark','#2b3238',{rough:.5,metal:.4}),cable=mat('cable','#1d2124',{rough:.7});
   const cyan=glow('nexus-cyan','#7fe6ff',1),dim=glow('nexus-dim','#24485a',1);
   // The Nexus core: a vast data centre, mostly dark, with a broken spire.
   box('core-hall',[28,22,14],[0,11,37],white);box('core-tier',[20,10,10],[0,27,37],white);
   for(let i=-3;i<=3;i++){box('core-seam',[.4,20,.2],[i*4,11,29.9],i%2?dim:cyan);box('core-window',[2.6,1.4,.2],[i*4,16,29.9],dark);}
   cyl('spire',4,34,[0,49,38],white,true,24,1.6);const cap=cyl('spire-break',1.8,8,[1.8,67,38],grey,false,16,.6);cap.rotation.z=.55;
   for(let i=0;i<5;i++){const p=box('pylon',[1.2,14+rand()*8,1.2],[-30+i*15,7,16+rand()*6],grey,false);if(i%2)p.rotation.z=(rand()-.5)*.5;}
   for(let i=0;i<7;i++){const c=cyl('ground-cable',.18,18+rand()*14,[-12+i*4,.15,18-rand()*6],cable,true,8);c.rotation.x=Math.PI/2;c.rotation.y=(rand()-.5)*.8;}
   // Shrine of dark terminals; people still kneel before them.
   const terminals=[];for(let i=0;i<3;i++){const x=-4+i*4;box('nexus-terminal',[1.8,3,.6],[x,1.5,15],dark);terminals.push(screen('nexus-screen-'+i,1.5,1.3,[x,2.1,14.68],Math.PI,(g,w,h)=>{g.fillStyle='#03080c';g.fillRect(0,0,w,h);g.fillStyle='#7fe6ff';g.font='bold 20px monospace';g.textAlign='center';g.fillText('NEXUS LINK',w/2,h*.38);g.fillStyle='#4a7a8a';g.font='16px monospace';g.fillText('— NO SIGNAL —',w/2,h*.62);},.8));}
   for(let i=0;i<7;i++)person('crew-pray'+i,[-6+i*2,0,11.5+Math.sin(i)*.6],true);
   // Disabled service robots; one still sorts debris, slowly.
   const robotMat=mat('robot','#c9d1d6',{rough:.4,metal:.6});const robot=(p,fallen,i)=>{const n=new B.TransformNode('robot-'+i,scene);n.parent=parent;n.position.set(...p);
    const parts=[box('robot-body',[.9,1.2,.6],[0,1.4,0],robotMat,false),box('robot-head',[.6,.45,.5],[0,2.3,0],robotMat,false),box('robot-visor',[.5,.12,.05],[0,2.32,.26],fallen?dark:cyan,false)];
    for(const s of [-1,1]){parts.push(box('robot-leg',[.25,.8,.3],[s*.25,.4,0],grey,false));parts.push(box('robot-arm',[.2,.9,.2],[s*.6,1.4,0],grey,false));}
    for(const m of parts)m.parent=n;if(fallen){n.rotation.z=1.45;n.position.y=.45;}return {n,arm:parts[parts.length-1]};};
   [[-24,0,4],[22,0,8],[-8,0,-14],[28,0,-14]].forEach((p,i)=>robot(p,i!==2,i));const worker=robot([-9,0,24],false,9);moving.push(worker);
   // Repair crew at the relay junction; recovery workers learning by hand.
   box('relay-box',[2.4,2.6,1.6],[-16,1.3,16],grey);const sparks=box('relay-spark',[.25,.25,.25],[-14.7,2.2,16],glow('spark','#fff2b0',1.4),false);
   person('crew-repair1',[-12,0,14]);person('crew-repair2',[-13,0,19]);box('toolbox',[.8,.4,.4],[-12.6,.2,15.6],mat('tool','#a8602a'));
   box('lesson-bench',[2.4,.9,1],[8,.45,6],grey);person('crew-teach',[7,0,7.2]);person('crew-learn',[9,0,7.2]);person('crew-wander1',[-3,0,-2]);person('crew-wander2',[20,0,22]);
   // Aid station, depot and power terminal.
   box('aid-floor',[8,.1,8],[18,.05,-4],white);box('aid-roof',[8.4,.3,8.4],[18,3.4,-4],white);for(const [x,z] of [[14,-8],[22,-8],[14,0],[22,0]])box('aid-post',[.2,3.4,.2],[x,1.7,z],grey);
   screen('aid-sign',3,1.2,[18,2.6,.05],Math.PI,(g,w,h)=>{g.fillStyle='#e8f6fb';g.fillRect(0,0,w,h);g.strokeStyle='#29a9cf';g.lineWidth=10;g.beginPath();g.arc(50,h/2,26,0,7);g.stroke();g.fillStyle='#164a5c';g.font='bold 28px sans-serif';g.fillText('AID STATION',94,h/2+10);},.9);
   for(let i=0;i<3;i++){box('cot',[1,.4,2.2],[16+i*2,.3,-6],mat('cot','#9fb5bf'));}person('crew-medic',[20,0,-2]);person('crew-patient',[16.5,0,-1.6]);
   for(let i=0;i<6;i++)box('depot-crate',[1.6,1.4,1.6],[-23+(i%3)*2.2,.7+(i>2?1.4:0),-8+(i%2)*1.8],i%2?white:grey);
   box('depot-frame',[8,4,8],[-21,2,-6],mat('depot','#9aa6ae',{rough:.6}));
   box('power-cabinet',[3,3.4,1.6],[16,1.7,18],grey);const power=screen('power-screen',2,1.2,[16,2.4,17.18],Math.PI,(g,w,h)=>{g.fillStyle='#06121a';g.fillRect(0,0,w,h);g.fillStyle='#7fe6ff';g.font='bold 22px monospace';g.fillText('GRID 04',12,40);g.fillStyle='#ffb04a';g.fillText('OFFLINE',12,80);},.15);
   // Kess's coordination post.
   box('kess-desk',[2.6,1,1.2],[5,.5,-6],white);screen('kess-holo',1.6,1,[5,1.8,-6.62],0,(g,w,h)=>{g.fillStyle='rgba(10,30,40,.9)';g.fillRect(0,0,w,h);g.strokeStyle='#7fe6ff';for(let i=0;i<6;i++){g.beginPath();g.moveTo(10,20+i*24);g.lineTo(60+rand()*170,20+i*24);g.stroke();}},.7);
   characterModel('kess',parent,[5,0,-8.6],false);
   point([0,8,14],'#7fe6ff',.8,22);point([18,3,-4],'#e8f6fb',.9,12);point([-16,3,16],'#fff2b0',.5,8);
   tick=time=>{const f=flags();
    terminals.forEach((t,i)=>{const on=Math.sin(time*3.1+i*2.3)+Math.sin(time*7.7+i)>1.2;t.mat.emissiveColor.set(on?.9:.25,on?.9:.25,on?.9:.25);});
    sparks.setEnabled(f.nexusRepair!=='done'&&Math.sin(time*23)>.4);
    const lit=f.nexusPower==='done';power.mat.emissiveColor.set(lit?.9:.15,lit?.9:.15,lit?.9:.15);
    worker.arm.rotation.x=Math.sin(time*.8)*.6;};
  }else{
   scene.clearColor=new B.Color4(.5,.66,.82,1);scene.fogMode=B.Scene.FOGMODE_EXP2;scene.fogDensity=.0028;scene.fogColor=new B.Color3(.6,.68,.74);
   if(sun)sun.intensity=1.15;if(ambient)ambient.intensity=.55;
   ground('#6a5236');const road=mat('road','#8f7a55'),wood=mat('wood','#7a5636'),red=mat('barn-red','#8a3b2a'),metal=mat('order-metal','#5f625f',{rough:.5,metal:.5}),panel=mat('solar','#1d2c44',{rough:.3,metal:.6});
   box('road-main',[6,.05,80],[0,.02,0],road);box('road-cross',[70,.05,5],[0,.02,6],road);
   // Fields: crop rows on both flanks and behind the solar array.
   const greens=[mat('crop-a','#3f7a1f'),mat('crop-b','#6f8f22'),mat('crop-c','#c49a2a')];
   for(const [x0,z0,w,d,c] of [[-36,-30,12,20,0],[24,-30,12,14,1],[-36,20,14,18,2],[26,22,12,16,0],[-14,32,24,6,1]])for(let r=0;r<w;r+=1.4)box('crop-row',[.7,.7,d],[x0+r,.35,z0+d/2],greens[c]);
   for(let i=0;i<9;i++){const p=cyl('irrigation',.16,22,[-30+i*1.4*0,.3,-4],metal,true,8);p.rotation.z=Math.PI/2;p.position.set(-30,.3,-30+i*3);}
   box('channel',[1.2,.04,40],[-23.5,.03,0],mat('water','#4f7f96',{rough:.1,metal:.2}));
   // Solar array; one installation damaged until repaired.
   const broken=[];for(let r=0;r<3;r++)for(let c=0;c<6;c++){const x=4+c*2.6,z=26+r*3.4,dmg=r===0&&c===2;box('solar-post',[.15,1.2,.15],[x,.6,z],metal);const p=box('solar-panel',[2.3,.08,1.5],[x,1.3,z],panel,!dmg);p.rotation.x=dmg?-1.1:-.5;if(dmg)broken.push(p);}
   const sparkle=box('solar-spark',[.2,.2,.2],[9.2,1.6,26],glow('spark','#fff2b0',1.4),false);
   // Barn depot, silos, workshop, farmhouse with tractor, and the distribution stalls.
   box('barn',[10,6,12],[-25,3,-8],red);const r1=box('barn-roof',[6.2,.3,12.4],[-27.2,6.9,-8],wood,false);r1.rotation.z=.6;const r2=box('barn-roof',[6.2,.3,12.4],[-22.8,6.9,-8],wood,false);r2.rotation.z=-.6;
   box('barn-door',[.2,4,5],[-19.9,2,-8],wood);for(let i=0;i<4;i++)box('equipment-crate',[1.2,1,1.2],[-18.4,.5,-11+i*1.4],metal);
   for(const z of [10,14])cyl('silo',2,9,[-22,4.5,z],mat('silo','#b9b5a6',{rough:.5,metal:.4}),true,18),cyl('silo-cap',2.1,1.5,[-22,9.75,z],metal,true,18,.3);
   for(let i=0;i<3;i++)box('food-crate',[1,.8,1],[-18.2,.4,10.5+i*1.3],wood);
   box('workshop',[8,4,6],[-6,2,27],wood);box('workbench',[3,.9,1],[-6,.45,23.6],wood);box('parts-rack',[2,2,.5],[-3.5,1,23.8],metal);
   box('farmhouse',[8,5,8],[26,2.5,-10],mat('house','#c8b48c'));box('farm-roof',[9,.4,9],[26,5.4,-10],red);
   for(let x=16;x<=34;x+=2)box('fence',[.15,1,.15],[x,.5,-2],wood);box('fence-rail',[18,.12,.1],[25,.8,-2],wood);
   const tractor=new B.TransformNode('tractor',scene);tractor.parent=parent;tractor.position.set(19,0,-7);for(const m of [box('tractor-body',[2.4,1.4,1.6],[0,1.2,0],mat('tractor','#a8602a'),false),box('tractor-cab',[1.2,1.2,1.4],[-.4,2.4,0],metal,false)])m.parent=tractor;
   for(const [x,z,r] of [[.9,.9,.7],[.9,-.9,.7],[-.8,.9,.5],[-.8,-.9,.5]]){const w=cyl('wheel',r,.4,[x,r,z],mat('tyre','#1e1e1c'),false,14);w.rotation.x=Math.PI/2;w.parent=tractor;}
   for(let i=0;i<3;i++){box('stall',[2.4,.9,1.6],[16+i*3,.45,15],wood);const a=box('awning',[2.6,.1,2],[16+i*3,2.4,15],[red,greens[1],mat('awning-blue','#4a6f8a')][i],false);a.rotation.x=.2;}
   // Mercer's cooperative post and people at work.
   box('coop-office',[5,3.4,4],[5,1.7,-4],mat('coop','#b7a682'));box('mercer-table',[2.4,.9,1],[5,.45,-6.4],wood);characterModel('mercer',parent,[5,0,-8.6],false);
   const hands=[];for(const [x,z] of [[-32,-22],[-29,-16],[28,-26],[30,-20],[-31,26],[29,28],[-10,34],[18,16],[-17,-12],[21,-6]])hands.push(person('crew-farm'+hands.length,[x,0,z]));
   point([5,4,-6],'#ffe1a8',.6,10);
   tick=time=>{const f=flags(),fixed=f.orderSolar==='done';for(const p of broken)p.rotation.x=fixed?-.5:-1.1;sparkle.setEnabled(!fixed&&Math.sin(time*19)>.5);
    hands.forEach((h,i)=>{if(h)h.rotation.x=Math.max(0,Math.sin(time*1.3+i))*.35;});};
  }
  for(const [m,list] of staticMeshes)if(list.length>1){const merged=B.Mesh.MergeMeshes(list,true,true,undefined,false,false);if(merged){merged.parent=parent;merged.material=m;merged.isPickable=false;}}
  return {tick,dispose(){for(const l of lights)l.dispose();for(const t of textures)t.dispose();for(const m of owned)m.dispose(false,true);scene.clearColor=previous.clear;scene.fogMode=previous.fogMode;scene.fogDensity=previous.fogDensity;scene.fogColor=previous.fogColor;if(sun&&lightState.sun!=null)sun.intensity=lightState.sun;if(ambient&&lightState.ambient!=null)ambient.intensity=lightState.ambient;ip.exposure=look.exposure;ip.contrast=look.contrast;}};
 }
 const api={worlds,layout,build};if(typeof module!=='undefined')module.exports=api;else root.VoidPlanets=api;
})(globalThis);
