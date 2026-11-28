/* LOW QUAY (Stale System; the owner's request, 27 Nov 2026; concept image docs/development/universe-graphics/lowquay-reference.png). Always night.
   A landing pad raised on concrete viaduct piers over dark water, six ship berths with a terminal at each, a small high-speed rail station on the pad, a long viaduct with
   the rail line to a security vestibule and a tunnel, and a pedestrian-only quay city (no roads, no vehicles) reached only by the train.
   It is a planet-style landing area (the same slot as The Nexus in planets.js): VoidPlanets.layout / build are wrapped for the id 'low-quay', so dock() (homeworld-scenes.js)
   walks into 'planet-low-quay'. Nothing from NeoChinatown (earth) is used. Text on signs is the owner's (LOW QUAY, LOW QUAY LANDING, HIGH-SPEED RAIL); the rest is generic and PROPOSED.
   Repetition is the budget: one pier, one deck segment, one rail segment, one pole, one lamp ... each built once and instanced along the line. Pure data and rules are at the top
   (Node-testable); the Babylon build is below. */
(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports;
 const ID='low-quay',TERMINAL_ID='lowquay:terminal',TERMINAL_SRC='assets/models/low-quay/quay-terminal.glb';
 // ---- the layout (metres; +z runs from the pad to the city; the water is at WY, the tarmac at 0) ----
 const WY=-9,SEG=24,CX=9,TRACKS=[6,12],CITY_Y=8.6,STAIRS=[300,318];   // the quay city stands on a terrace CITY_Y above the viaduct; the subway station is under it
 const Z={padA:-452,padB:-376,stA:-376,stB:-330,vestA:152,vestB:166,tunB:247,hallA:248,hallB:300,cityB:456};
 const BOUNDS=[64,456],SPAWN=[0,1.7,-423];
 // Six berths: two rows of three. The player's ship stands where the pad's existing landing spot is (the first berth of the front row, centre column).
 const BERTHS=[[-26,-437],[-4,-437],[18,-437],[-26,-409],[-4,-409],[18,-409]],HOME_BERTH=1,PARKED=[0,4,5];
 const TERMINAL_AT=BERTHS.map(([x,z])=>({x:x+9.7,z:z-6}));
 // Pedestrian-only city blocks: [x0,x1,z0,z1,height]. Alleys between them are 4 m; the canal runs x -40..-30 with a path each side, one footbridge.
 const BLOCKS=[
  [-26,-15,332,354,26],[-10,6,332,354,34],[10,24,332,354,22],[28,46,332,354,40],[50,62,332,354,30],[30,62,300,322,18],
  [-26,-15,358,384,38],[-10,4,358,384,48],[8,22,358,384,30],[26,44,358,384,44],[48,62,358,384,36],
  [-26,-15,388,410,32],[-10,2,388,410,52],[6,20,388,410,28],[24,40,388,410,42],[44,62,388,416,34],
  [32,48,420,456,56],[52,62,420,456,40],   // the main alley (x -15..-10, low-quay-court.js) runs north from the stairs to the food court (x -30..26, z 412..456)
  [-62,-44,304,334,24],[-62,-44,346,376,36],[-62,-44,380,412,28],[-62,-44,416,456,42]];
 const CONTAINERS=[[-35,-383],[-28,-383],[-35,-389],[28,-383],[34,-383],[34,-388],[-36,-444],[-36,-450]];
 const TOWERS=[[33,-398],[-36,-440]];
 const solids=()=>{const S=[],W=(id,x0,x1,z0,z1,h=6)=>S.push({id,position:[(x0+x1)/2,h/2,(z0+z1)/2],size:[x1-x0,h,z1-z0]});
  // the pad's sides, the station and the line (the player never reaches the water or the tracks)
  W('pad-w',-64,-40,Z.padA,Z.padB);W('pad-e',40,64,Z.padA,Z.padB);W('st-w',-64,-16,Z.padB,Z.stB);W('st-tracks',3.5,64,Z.padB,Z.stB);
  W('station',-16,-6,-372,-338,7);W('causeway',-64,64,Z.stB,Z.hallA);
  // berth terminals, containers and the floodlight towers
  TERMINAL_AT.forEach((t,i)=>W('terminal-'+i,t.x-.5,t.x+.5,t.z-.5,t.z+.5,1.2));
  CONTAINERS.forEach(([x,z],i)=>W('container-'+i,x-3,x+3,z-1.2,z+1.2,2.6));TOWERS.forEach(([x,z],i)=>W('tower-'+i,x-.8,x+.8,z-.8,z+.8,20));
  // the city hall (arrival station), then the water either side and the canal
  W('hall-w',-18,-16,Z.hallA,Z.hallB,7);W('hall-front',-18,3.5,Z.hallA-1,Z.hallA+1,7);W('hall-tracks',3.5,18.5,Z.hallA,Z.hallB,7);W('hall-e',18.5,19.5,Z.hallA,Z.hallB,7);
  W('hall-back-w',-18,-14,Z.hallB-1,STAIRS[1],7);W('hall-back-e',0,3.5,Z.hallB-1,STAIRS[1],7);W('terrace-w',-30,-18,Z.hallA,Z.hallB);W('hall-mid',3.5,19.5,Z.hallB,STAIRS[1]);
  W('quay-edge-w',-64,-18,STAIRS[0],STAIRS[1]);W('quay-edge-e',19.5,64,STAIRS[0],STAIRS[1]);   // the city level ends at the stairwell: no walking off the terrace edge over the station
  W('water-w',-64,-30,Z.hallA,Z.hallB);W('water-e',19.5,64,Z.hallA,Z.hallB);W('canal-a',-40,-30,300,336);W('canal-b',-40,-30,344,Z.cityB);
  // the PLUG & PLAY nightclub is the ground floor of one block (low-quay-club.js): its walls, doorway, glass and furniture instead of the block's box
  const CO=court();if(CO)S.push(...CO.solids());   // the food court's railings, stalls and tables (low-quay-court.js)
  const CL=club();BLOCKS.forEach((b,i)=>{if(!(CL&&CL.isClubBlock(b)))W('block-'+i,b[0],b[1],b[2],b[3],b[4]);});if(CL)S.push(...CL.solids());
  return S;};
 const club=()=>node?require('./low-quay-club.js'):root.VoidLowQuayClub,court=()=>node?require('./low-quay-court.js'):root.VoidLowQuayCourt;
 const interactions=()=>[
  {id:'board',label:'BOARD YOUR SHIP',position:[-2,1.7,-432],action:'board',range:3.5,when:{notFlags:{shipAccess:'none'}}},
  ...TERMINAL_AT.map((t,i)=>({id:'quay-terminal-'+i,label:'ACCESS BERTH TERMINAL',position:[t.x-1.3,1.7,t.z],action:'quay-terminal',berth:i,range:2.6})),
  {id:'quay-train-pad',label:'BOARD HIGH-SPEED RAIL',position:[2.4,1.7,-353],action:'quay-train',at:'pad',range:3.2},
  {id:'quay-train-city',label:'BOARD HIGH-SPEED RAIL',position:[2.4,1.7,275],action:'quay-train',at:'city',range:3.2}];
 function layout(){return {id:'planet-'+ID,location:ID,name:'LOW QUAY / STALE',kind:'planet',planet:ID,mapSpace:ID,bounds:BOUNDS.slice(),spawn:SPAWN.slice(),yaw:0,color:'#5fb4c8',ship:'starter',solids:solids(),interactions:interactions(),signs:[]};}
 const MAP_BOUNDS=[-82,95,Z.padA-12,Z.cityB+12];
 function mapModel(){
  const [pad,station]=interactions().filter(p=>p.action==='quay-train');
  const door=club()?.DOOR;
  const point=(id,name,kind,x,z,note)=>({id,name,kind,area:'street',x,z,note});
  const pois=[point('low-quay-landing','Low Quay Landing','transit',SPAWN[0],SPAWN[2]),
   point(pad.id,'Landing Pad Rail Stop','transit',pad.position[0],pad.position[2],'Board here for the city station.'),
   point(station.id,'High-Speed Rail Station','transit',station.position[0],station.position[2],'The city platform is below the quay. Take the stairs to reach the city.'),
   point('low-quay-stairs','Quay Stairs','service',-7,STAIRS[1],'Connects the underground station and the city terrace.')];
  if(door)pois.push(point('low-quay-plug-play','Plug & Play','shop',door.x,door.z,'Enter from the west alley. From the landing pad, take high-speed rail into the city first.'));
  const [x0,x1,z0,z1]=MAP_BOUNDS;
  return {bounds:{x0,x1,z0,z1},pois,walls:{street:[]},
   streets:[{name:'Low Quay Landing',rect:[-40,40,Z.padA,Z.padB]},
    {name:'Landing platform',rect:[-16,3.5,Z.stA,Z.stB]},
    {name:'City platform',rect:[-16,3.5,Z.hallA,Z.hallB]},
    {name:'Quay stairs',rect:[-14,0,...STAIRS]},
    {name:'West quay',rect:[-64,-40,STAIRS[1],Z.cityB]},
    {name:'City terrace',rect:[-30,64,STAIRS[1],Z.cityB]},
    {name:'Footbridge',rect:[-40,-30,336,344]}],
   buildings:BLOCKS.map(b=>({rect:b.slice(0,4),featured:!!club()?.isClubBlock(b)})),
   rail:TRACKS.map(x=>[[x,pad.position[2]],[x,station.position[2]]])};
 }
 const mapSpace={id:ID,name:'Low Quay',bounds:MAP_BOUNDS,publicMap:true,model:mapModel};
 /* The berth terminals ask for the player's ship (the existing board flow, babylon-integration.js 'board' -> leaveWalking, is unchanged). Pure rule: what a terminal does.
    shipAccess 'none' = the new-campaign state, no ship yet (the same flag that hides BOARD YOUR SHIP at NeoChinatown). Messages are PROPOSED wording. */
 const MESSAGES={none:'No ship is registered to you.',here:'Your ship is already at this berth.',calling:'Calling your ship to this berth.',arrived:'Your ship is at this berth. Board it when ready.'};
 function plan({shipAccess,at,target,craftAt=PARKED}){
  if(shipAccess==='none')return {kind:'none',message:MESSAGES.none};
  if(!Number.isInteger(target)||target<0||target>=BERTHS.length)return {kind:'none',message:MESSAGES.none};
  if(target===at)return {kind:'here',message:MESSAGES.here};
  return {kind:'move',from:at,to:target,swap:craftAt.includes(target)?target:null,message:MESSAGES.calling};}
 // walk height: the stairs from the station to the quay (by z); on the quay, x too: the food court's walkway and its two flights (low-quay-court.js heightAt), and in
 // PLUG & PLAY the stage deck and the steps down from its rear doorway (low-quay-club.js heightAt)
 const groundHeight=(z,x)=>z<=STAIRS[0]?0:z<STAIRS[1]?CITY_Y*(z-STAIRS[0])/(STAIRS[1]-STAIRS[0]):CITY_Y+(x!=null&&court()?court().heightAt(x,z):0)+(x!=null&&club()?.inside(x,z)?club().heightAt(x,z):0);
 const api={groundHeight,CITY_Y,STAIRS,ID,WY,SEG,CX,TRACKS,Z,BOUNDS,SPAWN,BERTHS,HOME_BERTH,PARKED,TERMINAL_AT,BLOCKS,MESSAGES,TERMINAL_ID,TERMINAL_SRC,solids,interactions,layout,plan,mapSpace,live:null};
 api.models=(location,quality)=>location===ID?{[TERMINAL_ID]:{src:TERMINAL_SRC,scale:1},...(club()?.models()||{})}:{};
  // ---- wiring (also in Node, so the tests see the layout) ----
 api.build=build;
 const P=node?require('./planets.js'):root.VoidPlanets;
 if(P){P.worlds[ID]={location:ID,name:'LOW QUAY / STALE',color:'#5fb4c8',solids:[],interactions:[]};
  const layout0=P.layout,build0=P.build;P.layout=id=>id===ID?layout():layout0(id);P.build=(id,c)=>id===ID?build(c):build0(id,c);}
 if(node){module.exports=api;return;}

 // ================= browser: the build =================
 const rnd=seed=>()=>((seed=seed*16807%2147483647)-1)/2147483646;
 function build(ctx){
  const B=root.BABYLON,{scene,quality,shipModel,state}=ctx,world=new B.TransformNode('lq-world',scene),parent=(world.parent=ctx.parent,world),low=quality==='low',high=quality==='high'||quality==='ultra',owned=[],textures=[],lights=[];
  const r=rnd(4177),prev={clear:scene.clearColor.clone(),fogMode:scene.fogMode,fogDensity:scene.fogDensity,fogColor:scene.fogColor.clone()};
  const sun=scene.getLightByName('sun'),ambient=scene.getLightByName('ambient'),saved={sun:sun&&{i:sun.intensity,d:sun.direction.clone(),c:sun.diffuse.clone(),s:sun.specular.clone()},amb:ambient&&{i:ambient.intensity,d:ambient.diffuse.clone(),g:ambient.groundColor.clone()}};
  const ip=scene.imageProcessingConfiguration,look={exposure:ip.exposure,contrast:ip.contrast};
  const C=h=>B.Color3.FromHexString(h);
  const FOG='#080d17';scene.clearColor=new B.Color4(.03,.045,.08,1);scene.fogMode=B.Scene.FOGMODE_EXP2;scene.fogDensity=.0011;scene.fogColor=C(FOG);ip.exposure=1.45;ip.contrast=1.12;
  if(sun){sun.direction=new B.Vector3(-.25,-.5,-.82).normalize();sun.diffuse=C('#7f95cc');sun.specular=C('#8fa6d8');sun.intensity=.7;}
  if(ambient){ambient.intensity=1;ambient.diffuse=C('#55638c');ambient.groundColor=C('#2a2018');}
  // ---- materials and textures ----
  const mats={};
  function mat(key,hex,o={}){if(mats[key])return mats[key];const m=new B.StandardMaterial('lq-'+key,scene);m.diffuseColor=C(hex);m.specularColor=B.Color3.White().scale(o.spec??.1);m.specularPower=o.pow||32;if(o.em)m.emissiveColor=C(o.em);if(o.alpha!=null){m.alpha=o.alpha;}m.maxSimultaneousLights=8;if(o.two)m.backFaceCulling=false;owned.push(m);return mats[key]=m;}
  function glow(key,hex,k=1){if(mats[key])return mats[key];const m=new B.StandardMaterial('lq-'+key,scene);m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.emissiveColor=C(hex).scale(k);m.disableLighting=true;owned.push(m);return mats[key]=m;}
  function tex(name,w,h,draw,alpha=false){const t=new B.DynamicTexture('lq-'+name,{width:w,height:h},scene,true);const g=t.getContext();if(alpha)g.clearRect(0,0,w,h);draw(g,w,h);t.hasAlpha=alpha;t.update();textures.push(t);return t;}
  function sprite(key,t,add=true,two=true){if(mats[key])return mats[key];const m=new B.StandardMaterial('lq-'+key,scene);m.diffuseTexture=t;m.emissiveTexture=t;m.useAlphaFromDiffuseTexture=true;m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();m.disableLighting=true;m.backFaceCulling=!two?true:false;if(add)m.alphaMode=B.Engine.ALPHA_ADD;m.disableDepthWrite=true;m.fogEnabled=false;owned.push(m);return mats[key]=m;}
  const noise=(g,w,h,n,a,col='255,255,255')=>{for(let i=0;i<n;i++){g.fillStyle='rgba('+col+','+(Math.random()*a)+')';g.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*3,1+Math.random()*3);}};
  // ---- kit machinery: parts per material are merged once, then instanced ----
  const kits=[],hide=m=>{m.isVisible=false;m.isPickable=false;m.parent=parent;return m;};
  // done(): a lone part is baked so it keeps its offset in the kit (an instance's position replaces the mesh's own)
  function K(){const parts=new Map();const add=(mk,m)=>{m.material=mk;(parts.get(mk)||parts.set(mk,[]).get(mk)).push(m);return m;};
   return {box(mk,w,h,d,x,y,z,ry=0,rx=0,rz=0){const m=B.MeshBuilder.CreateBox('p',{width:w,height:h,depth:d},scene);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);return add(mk,m);},
    cyl(mk,rad,h,x,y,z,t=10,rx=0,rz=0,top){const m=B.MeshBuilder.CreateCylinder('p',{diameterBottom:rad*2,diameterTop:(top??rad)*2,height:h,tessellation:t},scene);m.position.set(x,y,z);m.rotation.set(rx,0,rz);return add(mk,m);},
    plane(mk,w,h,x,y,z,ry=0,rx=0,uv){const m=B.MeshBuilder.CreatePlane('p',{width:w,height:h,sideOrientation:B.Mesh.DOUBLESIDE,frontUVs:uv,backUVs:uv},scene);m.position.set(x,y,z);m.rotation.set(rx,ry,0);return add(mk,m);},
    done(name){const out=[];for(const [mk,list] of parts){const m=list.length>1?B.Mesh.MergeMeshes(list,true,true,undefined,false,false):list[0];if(!m)continue;if(list.length===1)m.bakeCurrentTransformIntoVertices();m.name=name;m.material=mk;out.push(hide(m));}parts.clear();kits.push(...out);return out;}};}
  const frozen=[];   // every placed instance: frozen, and re-frozen when the world is lifted or lowered for the stairs (tick)
  const place=(kit,x,y,z,ry=0,sx=1,sy=1,sz=1)=>{for(const m of kit){const i=m.createInstance(m.name+'-i');i.position.set(x,y,z);i.rotation.y=ry;i.scaling.set(sx,sy,sz);i.parent=parent;i.isPickable=false;i.freezeWorldMatrix();frozen.push(i);}};
  // static (merged once) parts: the pad deck, station, towers, city
  const S=K();
  // ---- materials ----
  const conc=mat('conc','#7a766e',{spec:.06}),concD=mat('concD','#4a4843',{spec:.04}),dark=mat('dark','#17191d',{spec:.2}),steel=mat('steel','#6b7076',{spec:.5,pow:48}),paint=mat('paint','#d9d5c9',{spec:.35});
  const amber=glow('amber','#ffb347',1.15),warm=glow('warm','#ff9a3c',1),cool=glow('cool','#22c6c0',1),blue=glow('blue','#52a8ff',1.1),red=glow('red','#ff3a28',1.2),green=glow('green','#3dff7a',1),yel=glow('yel','#e8b422',.95);
  const hazard=mat('hazard','#d6a018',{spec:.1}),glass=mat('glass','#2a5568',{alpha:.28,two:true,spec:.9,pow:96,em:'#0a1c26'});
  // ---- the pad deck: wet tarmac with the berth bays drawn on it ----
  const PAD={x0:-40,x1:40,z0:Z.padA,z1:Z.padB},padRes=high?2048:1024;
  const padTex=tex('pad',padRes,padRes,(g,w,h)=>{const px=x=>(x-PAD.x0)/(PAD.x1-PAD.x0)*w,pz=z=>(1-(z-PAD.z0)/(PAD.z1-PAD.z0))*h,sx=w/80,sz=h/76;
   g.fillStyle='#2b2d32';g.fillRect(0,0,w,h);noise(g,w,h,w*5,.09);noise(g,w,h,w*2,.07,'0,0,0');
   g.strokeStyle='rgba(0,0,0,.45)';g.lineWidth=2;for(let x=PAD.x0+8;x<PAD.x1;x+=8){g.beginPath();g.moveTo(px(x),0);g.lineTo(px(x),h);g.stroke();}for(let z=PAD.z0+8;z<PAD.z1;z+=8){g.beginPath();g.moveTo(0,pz(z));g.lineTo(w,pz(z));g.stroke();}
   for(let i=0;i<26;i++){const x=Math.random()*w,y=Math.random()*h,rad=30+Math.random()*80,gr=g.createRadialGradient(x,y,0,x,y,rad);gr.addColorStop(0,'rgba(120,150,190,.18)');gr.addColorStop(1,'rgba(120,150,190,0)');g.fillStyle=gr;g.fillRect(x-rad,y-rad,rad*2,rad*2);}
   g.strokeStyle='#d9a920';g.lineWidth=.36*sx;g.strokeRect(px(PAD.x0+.9),pz(PAD.z1-.9),(PAD.x1-PAD.x0-1.8)*sx,(PAD.z1-PAD.z0-1.8)*sz);
   // the repeated bay marking: a ring, four corner brackets and a centre cross, once per berth
   for(const [bx,bz] of BERTHS){g.lineWidth=.3*sx;g.beginPath();g.ellipse(px(bx),pz(bz),7.4*sx,7.4*sz,0,0,7);g.stroke();
    for(const [a,b] of [[-1,-1],[1,-1],[1,1],[-1,1]]){const cx=px(bx+a*8.6),cy=pz(bz+b*8.6);g.beginPath();g.moveTo(cx-a*3*sx,cy);g.lineTo(cx,cy);g.lineTo(cx,cy-b*3*sz);g.stroke();}
    g.lineWidth=.22*sx;g.beginPath();g.moveTo(px(bx-1.4),pz(bz));g.lineTo(px(bx+1.4),pz(bz));g.moveTo(px(bx),pz(bz-1.4));g.lineTo(px(bx),pz(bz+1.4));g.stroke();}
   // taxi lane: dashed centre line between the rows and to the station platform
   g.lineWidth=.2*sx;g.setLineDash([2.2*sx,2.2*sx]);g.beginPath();g.moveTo(px(-36),pz(-423));g.lineTo(px(36),pz(-423));g.moveTo(px(-5),pz(-423));g.lineTo(px(-5),pz(-378));g.stroke();g.setLineDash([]);
   g.fillStyle='rgba(217,169,32,.8)';for(const t of TERMINAL_AT)g.fillRect(px(t.x-1.6),pz(t.z+1.6),3.2*sx,3.2*sz*.18);});
  const padMat=new B.StandardMaterial('lq-pad',scene);padMat.diffuseTexture=padTex;padMat.specularColor=new B.Color3(.55,.58,.64);padMat.specularPower=40;padMat.maxSimultaneousLights=8;owned.push(padMat);
  const pad=B.MeshBuilder.CreateGround('lq-pad',{width:PAD.x1-PAD.x0,height:PAD.z1-PAD.z0},scene);pad.position.set(0,.006,(PAD.z0+PAD.z1)/2);pad.material=padMat;pad.parent=parent;pad.isPickable=false;
  // ---- the water (always night): dark, with a slow ripple bump so the moon and lamps glint ----
  const bump=tex('ripple',256,256,(g,w,h)=>{const img=g.createImageData(w,h),f=(x,y)=>Math.sin(x*.19)+Math.sin(y*.23+x*.07)+Math.sin((x+y)*.11)+Math.sin(x*.41-y*.33)*.5;
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){const dx=f(x+1,y)-f(x-1,y),dy=f(x,y+1)-f(x,y-1),i=(y*w+x)*4;img.data[i]=128+dx*22;img.data[i+1]=128+dy*22;img.data[i+2]=235;img.data[i+3]=255;}g.putImageData(img,0,0);});
  const waterMat=new B.StandardMaterial('lq-water',scene);waterMat.diffuseColor=C('#05101a');waterMat.specularColor=new B.Color3(.9,.95,1);waterMat.specularPower=120;waterMat.emissiveColor=C('#050b14');waterMat.maxSimultaneousLights=8;
  if(!low){waterMat.bumpTexture=bump;bump.uScale=bump.vScale=90;waterMat.bumpTexture.level=.7;}owned.push(waterMat);
  const water=B.MeshBuilder.CreateGround('lq-water',{width:2300,height:2300},scene);water.position.y=WY;water.material=waterMat;water.parent=parent;water.isPickable=false;
  // ---- the sky: a dark dome with cloud, and the moon behind the cloud over the city ----
  const skyTex=tex('sky',1024,512,(g,w,h)=>{g.translate(0,h);g.scale(1,-1);   // drawn zenith-first; the sphere's V runs from the top pole, so the canvas is flipped
   const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#03050b');gr.addColorStop(.3,'#080d1a');gr.addColorStop(.45,'#151d36');gr.addColorStop(.5,'#2a2650');gr.addColorStop(.55,'#151d36');gr.addColorStop(1,'#05070d');g.fillStyle=gr;g.fillRect(0,0,w,h);
   for(let i=0;i<260;i++){const x=Math.random()*w,y=Math.random()*h*.7,rad=30+Math.random()*90,a=.07+Math.random()*.12,gg=g.createRadialGradient(x,y,0,x,y,rad);gg.addColorStop(0,'rgba(70,80,115,'+(a*1.6)+')');gg.addColorStop(1,'rgba(70,80,115,0)');g.save();g.scale(1,.35);g.fillStyle=gg;g.fillRect(x-rad,(y-rad)/.35,rad*2,rad*2/.35);g.restore();}
   g.fillStyle='rgba(255,255,255,.6)';for(let i=0;i<120;i++){g.fillRect(Math.random()*w,Math.random()*h*.45,1,1);}});
  const skyMat=new B.StandardMaterial('lq-sky',scene);skyMat.emissiveTexture=skyTex;skyMat.diffuseColor=B.Color3.Black();skyMat.specularColor=B.Color3.Black();skyMat.disableLighting=true;skyMat.backFaceCulling=false;skyMat.fogEnabled=false;owned.push(skyMat);
  const dome=B.MeshBuilder.CreateSphere('lq-sky',{diameter:2400,segments:16,sideOrientation:B.Mesh.BACKSIDE},scene);dome.material=skyMat;dome.infiniteDistance=true;dome.parent=parent;dome.isPickable=false;dome.alwaysSelectAsActiveMesh=true;
  const moonTex=tex('moon',256,256,(g,w,h)=>{const gl=g.createRadialGradient(128,128,10,128,128,128);gl.addColorStop(0,'rgba(150,175,235,.45)');gl.addColorStop(.35,'rgba(120,140,190,.14)');gl.addColorStop(1,'rgba(120,140,190,0)');g.fillStyle=gl;g.fillRect(0,0,w,h);g.fillStyle='#a9bff0';g.beginPath();g.arc(128,128,17,0,7);g.fill();g.fillStyle='rgba(60,70,95,.5)';g.beginPath();g.arc(121,123,5,0,7);g.arc(134,134,4,0,7);g.fill();},true);
  const moon=B.MeshBuilder.CreatePlane('lq-moon',{size:260},scene);moon.material=sprite('moon',moonTex,false);moon.billboardMode=B.Mesh.BILLBOARDMODE_ALL;moon.position.set(100,165,700);moon.scaling.setAll(.6);moon.infiniteDistance=true;moon.parent=parent;moon.isPickable=false;   // the moon stays inside the sky dome (radius 1200)
  // ---- the distant lit skyline across the water: a few billboards, never geometry ----
  const skylineTex=(name,seed,withSign)=>tex(name,2048,512,(g,w,h)=>{const rr=rnd(seed);g.clearRect(0,0,w,h);const hz=g.createLinearGradient(0,h*.35,0,h);hz.addColorStop(0,'rgba(60,40,110,0)');hz.addColorStop(1,'rgba(150,60,190,.34)');g.fillStyle=hz;g.fillRect(0,h*.35,w,h*.65);
   const NEON=['#ff3fb4','#33d6ff','#9b6bff','#27e1b5','#ff7a3a'];let x=0;while(x<w){const bw=18+rr()*52,c=(x/w),bh=70+rr()*130+Math.max(0,Math.sin(c*Math.PI*1.1)*210)*rr()+(Math.abs(c-.72)<.14?120:0),top=h-bh;
    const gr=g.createLinearGradient(0,top,0,h);gr.addColorStop(0,'#0b0e1d');gr.addColorStop(1,'#16152c');g.fillStyle=gr;g.fillRect(x,top,bw,bh);
    for(let wy=top+6;wy<h-4;wy+=7)for(let wx=x+3;wx<x+bw-3;wx+=6)if(rr()<.42){g.fillStyle=rr()<.55?'rgba(255,205,130,.75)':rr()<.5?'rgba(130,220,255,.7)':'rgba(255,120,200,.65)';g.fillRect(wx,wy,3,3);}
    if(rr()<.3){const nc=NEON[(rr()*5)|0];g.fillStyle=nc;g.fillRect(x+bw*.4,top+10,Math.max(3,bw*.14),bh*.35);g.globalAlpha=.25;g.fillRect(x+bw*.4-4,top+6,Math.max(3,bw*.14)+8,bh*.35+8);g.globalAlpha=1;}
    if(rr()<.12&&bh>200){g.strokeStyle=rr()<.5?'#ffb347':'#ff4fc0';g.lineWidth=3;g.beginPath();g.ellipse(x+bw/2,top+30,bw*.9,6,0,0,7);g.stroke();}
    if(rr()<.2){g.fillStyle='#222';g.fillRect(x+bw/2-1,top-26,2,26);g.fillStyle='#f33';g.fillRect(x+bw/2-1,top-28,2,2);}x+=bw+rr()*4;}
   if(!withSign)return;
   // the owner's lit LOW QUAY sign with the wave mark, on the waterfront
   const sx=w*.74,sy=h-160;g.fillStyle='#10132a';g.fillRect(sx-110,sy-30,260,110);g.fillStyle='#ff9ad2';g.font='bold 44px sans-serif';g.textAlign='center';g.fillText('LOW QUAY',sx+20,sy+14,240);g.fillStyle='#ff3f9e';g.fillRect(sx-70,sy+26,180,44);g.strokeStyle='#ffd0ea';g.lineWidth=4;for(let k=0;k<2;k++){g.beginPath();for(let q=0;q<=60;q++){const xx=sx-50+q*2,yy=sy+40+k*14+Math.sin(q*.3)*4;q?g.lineTo(xx,yy):g.moveTo(xx,yy);}g.stroke();}},true);
  const skyline=skylineTex('skyline',91,true),skyMatB=sprite('skyline',skyline,false,false),skyMatS=sprite('skyline-side',skylineTex('skyline-side',57,false),false,false);
  for(const [x,z,ry,wid] of [[0,760,0,1500],[-820,560,-.97,820],[820,560,.97,820]]){const p=B.MeshBuilder.CreatePlane('lq-skyline',{width:wid,height:wid*.25},scene);p.material=x?skyMatS:skyMatB;p.position.set(x,WY+wid*.125,z);p.rotation.y=ry;p.parent=parent;p.isPickable=false;}
  const reflTex=tex('reflect',1024,256,(g,w,h)=>{g.save();g.translate(0,h);g.scale(w/2048,-h/512*1);g.drawImage(skyline.getContext().canvas,0,0);g.restore();g.globalCompositeOperation='destination-in';const m=g.createLinearGradient(0,h,0,0);m.addColorStop(0,'rgba(0,0,0,.0)');m.addColorStop(.1,'rgba(0,0,0,.55)');m.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=m;g.fillRect(0,0,w,h);g.globalCompositeOperation='source-over';},true);
  if(!low){const p=B.MeshBuilder.CreateGround('lq-reflect',{width:1500,height:300},scene);p.material=sprite('reflect',reflTex,true);p.position.set(0,WY+.06,760-150);p.parent=parent;p.isPickable=false;}
  // pier up-light glow, a gradient quad
  const glowTex=tex('glow',64,128,(g,w,h)=>{const gr=g.createLinearGradient(0,h,0,0);gr.addColorStop(0,'rgba(255,170,70,.95)');gr.addColorStop(.5,'rgba(255,150,60,.28)');gr.addColorStop(1,'rgba(255,140,50,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);},true);
  const glowMat=sprite('glowUp',glowTex,true),streakTex=tex('streak',32,128,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(255,170,80,.7)');gr.addColorStop(1,'rgba(255,150,60,0)');g.fillStyle=gr;g.fillRect(w*.3,0,w*.4,h);},true),streakMat=sprite('streak',streakTex,true);
  const poolTex=tex('pool',128,128,(g,w,h)=>{const gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(255,170,70,.42)');gr.addColorStop(1,'rgba(255,140,50,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);},true),poolMat=sprite('pool',poolTex,true);

  // ---- ONE PIER (instanced under the causeway and around the pad edge) ----
  const pk=K();pk.box(conc,4.4,5.6,4.8,0,-5.7,0);pk.box(concD,12.6,1.5,5.6,0,-2.15,0);pk.box(conc,13.2,.4,6.1,0,-1.6,0);pk.box(concD,6.4,1.2,7,0,-9,0);pk.box(conc,5,.4,5.6,0,-8.2,0);
  pk.box(concD,.3,5,4.9,2.3,-5.7,0);pk.box(concD,.3,5,4.9,-2.3,-5.7,0);
  for(const sx of [-1,1])for(const sz of [-1,1])pk.box(amber,.34,.22,.34,sx*2.5,-8,sz*1.6);
  for(const sx of [-1,1])pk.box(amber,.34,.22,.34,sx*5.4,-2.9,0);
  const gk=K();for(const sx of [-1,1]){gk.plane(glowMat,3.2,5.4,sx*2.28,-5.6,0,sx*Math.PI/2);}gk.plane(glowMat,3.4,5.4,0,-5.6,2.45,0);gk.plane(glowMat,3.4,5.4,0,-5.6,-2.45,Math.PI);
  const pier=pk.done('pier'),pierGlow=gk.done('pier-glow');
  const sk=K();sk.plane(streakMat,1.4,10,0,0,0,0,Math.PI/2);const streak=sk.done('streak');
  // banner (the owner's text and wave mark)
  const bannerTex=tex('banner',256,640,(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle='#1b2a52';g.beginPath();g.moveTo(8,0);g.lineTo(w-8,0);g.lineTo(w-8,h-120);g.lineTo(w/2,h-8);g.lineTo(8,h-120);g.closePath();g.fill();g.strokeStyle='rgba(180,200,240,.35)';g.lineWidth=5;g.stroke();
   g.fillStyle='#9fc0ff';g.font='bold 74px sans-serif';g.textAlign='center';g.fillText('LOW',w/2,150,w-44);g.fillText('QUAY',w/2,235,w-44);g.strokeStyle='#9fc0ff';g.lineWidth=9;for(let k=0;k<3;k++){g.beginPath();for(let q=0;q<=50;q++){const x=60+q*2.7,y=330+k*40+Math.sin(q*.4)*11;q?g.lineTo(x,y):g.moveTo(x,y);}g.stroke();}},true);
  const bannerMat=new B.StandardMaterial('lq-banner',scene);bannerMat.diffuseTexture=bannerTex;bannerMat.useAlphaFromDiffuseTexture=true;bannerMat.emissiveColor=new B.Color3(.22,.24,.3);bannerMat.specularColor=B.Color3.Black();bannerMat.backFaceCulling=false;owned.push(bannerMat);
  const bk=K();bk.plane(bannerMat,1.7,4.25,0,0,0);const banner=bk.done('banner');
  // ---- ONE DECK SEGMENT, ONE RAIL SEGMENT, ONE POLE, ONE PARAPET (instanced along the line) ----
  const dk=K();dk.box(concD,14,1.4,SEG,0,-.7,0);dk.box(conc,14.4,.35,SEG,0,-1.55,0);dk.cyl(steel,.2,SEG,-6.3,-1.0,0,8,Math.PI/2);dk.cyl(steel,.14,SEG,5.8,-1.05,0,8,Math.PI/2);
  const deck=dk.done('deck');
  const rk=K();for(const tx of [-3,3]){rk.box(dark,2.6,.14,SEG,tx,.07,0);for(const o of [-.72,.72])rk.box(steel,.1,.17,SEG,tx+o,.22,0);}rk.box(blue,.07,.07,SEG,-5.9,.13,0);rk.box(blue,.07,.07,SEG,5.9,.13,0);
  const rail=rk.done('rail');
  const tk=K();tk.box(steel,.26,6.6,.26,6.3,3.3,0);tk.box(steel,3.5,.2,.2,4.55,6.15,0);tk.box(warm,.34,.14,.34,3.0,5.95,0);tk.box(dark,.07,.07,SEG,3,5.75,0);tk.box(dark,.05,.05,SEG,3,6.05,0);
  const pole=tk.done('pole');
  const ek=K();ek.box(concD,.5,1.1,SEG,0,.55,0);ek.box(steel,.14,.08,SEG,0,1.12,0);for(const z of [-9,-3,3,9]){ek.box(steel,.12,.5,.12,0,1.35,z);ek.box(amber,.24,.22,.24,0,1.7,z);}
  const edge=ek.done('edge');
  // ---- the segments along the line ----
  const NSEG=26,segZ=k=>Z.stA+SEG/2+SEG*k;
  for(let k=0;k<NSEG;k++){const z=segZ(k);place(deck,CX,0,z);}
  for(let k=0;k<NSEG+2;k++){const z=segZ(k);place(rail,CX,0,z);place(pole,CX,0,z);place(pole,CX,0,z,Math.PI);}
  for(let k=0;k<=NSEG;k++){const z=Z.stA+SEG*k;place(pier,CX,0,z);place(pierGlow,CX,0,z);if(!low){place(streak,CX-5.4,WY+.08,z);place(streak,CX+5.4,WY+.08,z);}
   if(k%2===0&&k>0&&k<NSEG){place(banner,CX-2.35,-5.4,z+0,Math.PI/2);place(banner,CX+2.35,-5.4,z,-Math.PI/2);}}
  for(let k=0;k<NSEG;k++){const z=segZ(k);if(z<Z.vestA-12||k<2){place(edge,CX-6.75,0,z);place(edge,CX+6.75,0,z,Math.PI);}}
  // the pad's own piers (the same pier), its perimeter railing and lamp posts
  for(const z of [-446,-412,-382])for(const x of [-34,-17,0,17,34]){place(pier,x,0,z,0);if(z===-446||x===-34||x===34)place(pierGlow,x,0,z);}
  for(const x of [-34,0,34]){place(banner,x,-5.4,-448.55,0);}
  const fk=K();fk.box(concD,SEG+3,1.5,1.4,0,-.75,0);const fascia=fk.done('fascia');
  S.box(concD,80.6,1.5,1.2,0,-.75,Z.padA-.1);S.box(concD,1.2,1.5,PAD.z1-PAD.z0,-40.1,-.75,(PAD.z0+PAD.z1)/2);S.box(concD,1.2,1.5,PAD.z1-PAD.z0,40.1,-.75,(PAD.z0+PAD.z1)/2);S.box(conc,81,.5,2,0,-1.55,Z.padA-.1);
  S.box(concD,80,1.4,PAD.z1-PAD.z0,0,-.7,(PAD.z0+PAD.z1)/2-0.001);
  const lamp=K();lamp.box(steel,.1,1.05,.1,0,.52,0);lamp.box(amber,.22,.2,.22,0,1.15,0);const lampKit=lamp.done('lamp');
  const lampSpots=[];for(let x=-38;x<=38;x+=5)lampSpots.push([x,Z.padA+.5]);for(let z=Z.padA+5;z<Z.padB-6;z+=5){lampSpots.push([-39.5,z],[39.5,z]);}for(let x=-39;x<=-17;x+=5)lampSpots.push([x,Z.padB-.5]);for(let x=18;x<=39;x+=5)lampSpots.push([x,Z.padB-.5]);
  for(const [x,z] of lampSpots)place(lampKit,x,0,z);
  S.box(hazard,80,.07,.07,0,1.0,Z.padA+.5);S.box(hazard,.07,.07,PAD.z1-PAD.z0,-39.5,1.0,(PAD.z0+PAD.z1)/2);S.box(hazard,.07,.07,PAD.z1-PAD.z0,39.5,1.0,(PAD.z0+PAD.z1)/2);
  // ---- the station platform and the line's deck at the pad ----
  S.box(concD,19.6,1.44,Z.stB-Z.stA,-6.2,-.68,(Z.stA+Z.stB)/2);S.box(yel,.3,.04,Z.stB-Z.stA,3.1,.06,(Z.stA+Z.stB)/2);S.box(hazard,.1,.12,Z.stB-Z.stA,-15.9,.5,(Z.stA+Z.stB)/2);   // the platform reaches to within a step of the train
  for(let z=Z.stA+3;z<Z.stB;z+=6){place(lampKit,-15.6,0,z);}
  // ---- THE STATION: a small curved-glass hall with a lit interior, a canopy, a mast and the owner's signs ----
  const st=S,stz=(Z.stA+Z.stB)/2-3;
  st.box(concD,11,4.2,34,-10.5,2.1,stz);st.box(dark,11.4,.5,34.4,-10.5,4.45,stz);
  const hall=B.MeshBuilder.CreateCylinder('lq-hall',{diameter:10.4,height:33,tessellation:22,arc:.5,sideOrientation:B.Mesh.DOUBLESIDE},scene);hall.rotation.x=-Math.PI/2;hall.position.set(-10.5,4.7,stz);hall.material=glass;hall.parent=parent;hall.isPickable=false;
  const wTex=tex('stationwin',512,128,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#c96a24');gr.addColorStop(.35,'#8a4a1c');gr.addColorStop(1,'#2a1a12');g.fillStyle=gr;g.fillRect(0,0,w,h);
   for(let x=20;x<w;x+=90){const lg=g.createRadialGradient(x,6,0,x,6,60);lg.addColorStop(0,'rgba(255,190,110,.55)');lg.addColorStop(1,'rgba(255,170,90,0)');g.fillStyle=lg;g.fillRect(x-60,0,120,70);}
   g.fillStyle='rgba(18,14,16,.85)';g.fillRect(0,h*.72,w,h*.28);g.fillStyle='rgba(60,40,30,.9)';g.fillRect(30,h*.6,150,h*.14);g.fillRect(300,h*.62,120,h*.12);g.fillStyle='rgba(70,140,190,.7)';g.fillRect(40,h*.36,40,h*.16);g.fillRect(330,h*.38,34,h*.14);
   g.fillStyle='rgba(16,14,18,.9)';for(let x=0;x<=w;x+=64)g.fillRect(x,0,5,h);g.fillRect(0,h*.28,w,3);});
  const wMat=new B.StandardMaterial('lq-stwin',scene);wMat.diffuseColor=B.Color3.Black();wMat.emissiveTexture=wTex;wMat.disableLighting=true;wMat.specularColor=B.Color3.Black();owned.push(wMat);
  const wp=(w,h,x,y,z,ry)=>{const p=B.MeshBuilder.CreatePlane('lq-stwin',{width:w,height:h},scene);p.material=wMat;p.position.set(x,y,z);p.rotation.y=ry;p.parent=parent;p.isPickable=false;};
  wp(9.6,2.6,-10.5,1.8,Z.stA+2.95,0);wp(30,2.8,-4.92,2.1,stz,-Math.PI/2);
  const sign=(key,w,h,draw,x,y,z,ry,glowk=1)=>{const t=tex(key,512,Math.round(512*h/w),draw);const m=new B.StandardMaterial('lq-'+key,scene);m.diffuseColor=B.Color3.Black();m.emissiveTexture=t;m.disableLighting=true;m.specularColor=B.Color3.Black();t.level=glowk;owned.push(m);const p=B.MeshBuilder.CreatePlane('lq-'+key,{width:w,height:h},scene);p.material=m;p.position.set(x,y,z);p.rotation.y=ry;p.parent=parent;p.isPickable=false;return p;};
  sign('sign-landing',6.4,2.0,(g,w,h)=>{g.fillStyle='#0d1624';g.fillRect(0,0,w,h);g.strokeStyle='#ffab3d';g.lineWidth=5;g.strokeRect(6,6,w-12,h-12);g.fillStyle='#ffc266';g.font='bold 92px sans-serif';g.textAlign='center';g.fillText('LOW QUAY',w/2,h*.46,w-44);g.font='bold 78px sans-serif';g.fillText('LANDING',w/2,h*.88,w-44);},-10.5,6.9,Z.stA+3.6,0,1);
  sign('sign-rail',5.2,1.0,(g,w,h)=>{g.fillStyle='#0b2a4e';g.fillRect(0,0,w,h);g.strokeStyle='#58b0ff';g.lineWidth=6;g.strokeRect(5,5,w-10,h-10);g.fillStyle='#8fcaff';g.font='bold 74px sans-serif';g.textAlign='center';g.fillText('HIGH-SPEED RAIL',w/2,h*.7,w-44);},-10.5,3.65,Z.stA+2.93,0,1.05);
  sign('sign-rail-side',5.2,1.0,(g,w,h)=>{g.fillStyle='#0b2a4e';g.fillRect(0,0,w,h);g.strokeStyle='#58b0ff';g.lineWidth=6;g.strokeRect(5,5,w-10,h-10);g.fillStyle='#8fcaff';g.font='bold 74px sans-serif';g.textAlign='center';g.fillText('HIGH-SPEED RAIL',w/2,h*.7,w-44);},-4.8,4.2,stz+8,-Math.PI/2,1.05);
  // mast
  st.cyl(steel,.22,7,-10.5,10.6,stz+8,8);st.box(red,.3,.3,.3,-10.5,14.3,stz+8);st.box(steel,2.4,.12,.12,-10.5,13,stz+8);st.box(steel,.12,.12,1.8,-10.5,12.2,stz+8);
  // canopy over the platform
  st.box(dark,8.6,.35,34,-1.2,4.6,stz);for(const z of [-18,-9,0,9,18])st.box(steel,.3,4.4,.3,2.9,2.2,stz+z);
  st.box(cool,.4,.06,34,2.2,4.38,stz);st.box(cool,.4,.06,34,-3.6,4.38,stz);
  // ---- THE TRAIN (one hollow car, built once, in two cars with a nose at each end; it is also the ride) ----
  const makeTrain=(x,z)=>{const trainRoot=new B.TransformNode('lq-train',scene);trainRoot.parent=parent;
  const T=K(),white=mat('trainWhite','#e6ebf0',{spec:.6,pow:64}),seat=mat('seat','#27364f',{spec:.1}),cab=mat('cab','#0e1620',{spec:.9,pow:100,em:'#0a1018'});
  const CL=17,CW=3.3,carZ=[-9,9];
  for(const cz of carZ){T.box(white,CW,.2,CL,0,.35,cz);T.box(white,CW,.18,CL,0,3.45,cz);
   for(const sx of [-1,1]){T.box(white,.12,.85,CL,sx*(CW/2-.06),.88,cz);T.box(white,.12,.85,CL,sx*(CW/2-.06),3.05,cz);T.box(blue,.05,.1,CL,sx*(CW/2+.015),.62,cz);
    for(let i=-3;i<=3;i++)T.box(white,.14,1.55,.22,sx*(CW/2-.07),1.97,cz+i*2.3);
    for(let i=-3;i<=4;i++){T.box(seat,.5,.5,.5,sx*1.12,.85,cz-8+i*2.1);T.box(seat,.14,.8,.5,sx*1.32,1.3,cz-8+i*2.1);}
    T.box(glass,.04,1.55,CL,sx*(CW/2-.02),1.97,cz);}
   T.box(blue,.22,.04,CL-1,0,3.34,cz);}
  T.box(white,CW,3.3,.3,0,1.9,-17.9);T.box(white,CW,3.3,.3,0,1.9,17.9);
  const tm=T.done('train');
  const nose=B.MeshBuilder.CreateCylinder('lq-nose',{diameterBottom:CW,diameterTop:.35,height:7,tessellation:20},scene);   // a tapered nose that starts at the car's end wall (nothing of it inside the car)nose.material=white;
  for(const m of tm){m.isVisible=true;m.parent=trainRoot;}
  nose.position.set(0,1.95,0);nose.isVisible=false;nose.parent=parent;kits.push(nose);
  for(const sgn of [-1,1]){const n=nose.createInstance('lq-nose-i');n.position.set(0,1.9,sgn*(17.9+3.5));n.rotation.x=sgn*Math.PI/2;n.parent=trainRoot;const cabWin=B.MeshBuilder.CreateBox('lq-cab',{width:2.5,height:.8,depth:.4},scene);cabWin.material=cab;cabWin.position.set(0,2.55,sgn*20.2);cabWin.rotation.x=sgn*.42;cabWin.scaling.set(.95,1,2.4);cabWin.parent=trainRoot;
   const hl=B.MeshBuilder.CreateBox('lq-hl',{width:2.2,height:.12,depth:.1},scene);hl.material=sgn>0?amber:red;hl.position.set(0,1.25,sgn*22.4);hl.scaling.x=.6;hl.parent=trainRoot;}
  trainRoot.position.set(x,.2,z);return trainRoot;};   // the car floor sits above the rail heads
  const trainRoot=makeTrain(TRACKS[0],-353),train2=makeTrain(TRACKS[1],-320);   // the second train, on the other track, runs along the line for life
  // ---- floodlight towers (one ring of lamps each), containers, berth craft ----
  const tw=K();tw.box(concD,2.4,1,2.4,0,.5,0);tw.cyl(steel,.55,21,0,11.5,0,12);tw.cyl(dark,3.2,.5,0,22,0,18);tw.cyl(steel,3.3,.16,0,23.1,0,18,0,0,3);
  for(let i=0;i<10;i++){const a=i/10*Math.PI*2;tw.box(amber,.9,.35,.5,Math.sin(a)*3,21.55,Math.cos(a)*3,a);}tw.box(red,.3,.3,.3,0,23.6,0);tw.box(steel,.3,.8,.3,.0,10,.6);
  const tower=tw.done('tower');TOWERS.forEach(([x,z])=>place(tower,x,0,z));
  const ck=K();const cA=mat('contA','#c98a1c',{spec:.1}),cB=mat('contB','#35506a',{spec:.1}),cK=K();
  ck.box(cA,6,2.6,2.4,0,1.3,0);for(let i=-2;i<=2;i++)ck.box(concD,.12,2.5,2.5,i*1.1,1.3,0);ck.box(dark,6.05,.15,2.45,0,2.65,0);const contA=ck.done('containerA');
  cK.box(cB,6,2.6,2.4,0,1.3,0);for(let i=-2;i<=2;i++)cK.box(concD,.12,2.5,2.5,i*1.1,1.3,0);cK.box(dark,6.05,.15,2.45,0,2.65,0);const contB=cK.done('containerB');
  CONTAINERS.forEach(([x,z],i)=>place(i%3===1?contB:contA,x,0,z,0));
  place(contA,-28,2.6,-383,0);place(contB,34,2.6,-383,0);
  const hullA=mat('craftA','#8a8f96',{spec:.5,pow:48}),hullB=mat('craftB','#35405a',{spec:.5,pow:48});
  const craftKits=[];for(const hull of [hullA,hullB]){const body=B.MeshBuilder.CreateSphere('lq-craft',{diameterX:6,diameterY:2.4,diameterZ:12,segments:14},scene);body.position.y=2.5;body.material=hull;
   const wing=B.MeshBuilder.CreateBox('lq-craft',{width:11,height:.3,depth:3.5},scene);wing.position.set(0,2.2,-1.2);wing.material=hull;const fin=B.MeshBuilder.CreateBox('lq-craft',{width:.3,height:2.6,depth:2.6},scene);fin.position.set(0,4,-5);fin.material=hull;
   const cp=B.MeshBuilder.CreateSphere('lq-craft',{diameterX:2.6,diameterY:1.4,diameterZ:3.6,segments:10},scene);cp.position.set(0,3.2,3.6);cp.material=mat('cab','#0e1620',{spec:.9,pow:100,em:'#0a1018'});
   const parts=[body,wing,fin].map(m=>{m.material=hull;return m;});const merged=B.Mesh.MergeMeshes(parts,true,true,undefined,false,false);merged.material=hull;hide(merged);hide(cp);
   const lights=[[-5.3,2.2,-1.2,red],[5.3,2.2,-1.2,green]].map(([x,y,z,m])=>{const b=B.MeshBuilder.CreateBox('lq-craft',{size:.3},scene);b.position.set(x,y,z);b.material=m;return hide(b);});
   const legs=[[-1.8,1,2],[1.8,1,2],[0,1,-3.6]].map(([x,y,z])=>{const l=B.MeshBuilder.CreateCylinder('lq-craft',{diameter:.3,height:2,tessellation:6},scene);l.position.set(x,y,z);l.material=steel;return l;});const lm=B.Mesh.MergeMeshes(legs,true,true,undefined,false,false);lm.material=steel;hide(lm);
   craftKits.push([merged,cp,...lights,lm]);}
  // other pilots' craft at the parked berths: the same ship class as the player's (instances of the loaded model); the simple hull above only if that model is missing
  const parkedShip=()=>{try{const m=shipModel('starter','neutral',parent,{landed:true});if(m){m.scaling.setAll(1.6);return m;}}catch{}return null;};
  const crafts=PARKED.map((bi,n)=>{const [bx,bz]=BERTHS[bi];const real=parkedShip();const kit=craftKits[n%2];const nodes=real?[real]:kit.map(m=>{const i=m.createInstance('lq-craft-i');i.parent=parent;i.isPickable=false;return i;});const place2=(x,z,ry)=>{for(const i of nodes){i.position.set(x,real?1.1:0,z);i.rotation.y=ry;}};place2(bx,bz,[.4,-.3,.9][n]);return {berth:bi,nodes,move:place2};});
  // ---- berth terminals (the Blender model, instanced) ----
  const termNodes=[];const placeTerminal=(t,i)=>{let n=null;try{n=root.VoidAssets?.instance?.(TERMINAL_ID,parent);}catch{n=null;}
   if(!n){n=new B.TransformNode('lq-terminal-stand-in',scene);n.parent=parent;const p=B.MeshBuilder.CreateBox('lq-term',{width:.3,height:1.1,depth:.25},scene);p.material=steel;p.position.y=.55;p.parent=n;const sc=B.MeshBuilder.CreateBox('lq-term',{width:.8,height:.55,depth:.1},scene);sc.material=mat('termScreen','#143c40',{em:'#1c8f86'});sc.position.set(0,1.3,0);sc.rotation.x=-.42;sc.parent=n;}
   n.position.set(t.x,0,t.z);n.rotation.y=-Math.PI/2;termNodes.push(n);};
  TERMINAL_AT.forEach(placeTerminal);
  // the player's ship stands at its berth (none in a new campaign with no ship, as at NeoChinatown)
  let ship=null,at=HOME_BERTH;const flags=()=>state?.story?.flags||{};
  if(flags().shipAccess!=='none'){ship=shipModel('starter','friendly',parent,{landed:true});if(ship){const [bx,bz]=BERTHS[HOME_BERTH];ship.position.set(bx,1.1,bz);ship.scaling.setAll(1.6);ship.rotation.y=.3;}}
  const homeCraft=crafts.find(c=>c.berth===HOME_BERTH);if(homeCraft&&ship)homeCraft.nodes.forEach(n=>n.setEnabled(false));
  // ---- lights: the tower, the station and the canopy (not on Low) ----
  // ---- lights: one pool of six point lights moved to the zone the player is in (the pad, the station under the quay, the quay), so no more than eight lights ever reach a material (not on Low) ----
  const ZL={pad:[[[33,19,-398],'#ffa640',1.5,75],[[-36,19,-440],'#ffa640',1.3,70],[[-10.5,3.4,stz],'#ff8a30',1,26],[[-1,4.1,stz],'#3a9cff',.7,24],[[-4,9,-423],'#ff9a3c',1,60],[[9,4,-300],'#ff9a3c',.8,45]],
   hall:[[[-9,4.4,262],'#ff9a3c',1,24],[[-9,4.4,288],'#ff9a3c',1,24],[[10,4.4,262],'#3a9cff',.7,22],[[10,4.4,290],'#3a9cff',.7,22],[[-8,6,310],'#ff7a22',1,20],[[9,5,200],'#ff7a22',.5,30]],
   club:[[[35.9,CITY_Y+3.9,371],'#ff2d96',2.4,12],[[29.6,CITY_Y+3.2,364],'#ffa25a',1.5,10],[[29.6,CITY_Y+3.2,377.5],'#ffa25a',1.5,10],[[39.4,CITY_Y+2.6,361.6],'#ff3fa6',1.4,8],[[36.1,CITY_Y+2.8,380.8],'#ff7a3a',1.6,8],[[41.8,CITY_Y+2.6,374],'#b44dff',1.3,9]],   // PLUG & PLAY (low-quay-club.js): the VR bedroom's rose mood; stage, dining, alcove, kitchen, backstage
   court:[[[-24,CITY_Y+3.4,436],'#ff5a2a',1.4,16],[[20,CITY_Y+3.4,436],'#ff3fa6',1.3,16],[[-2,CITY_Y+3.4,449],'#ffae5c',1.4,16],[[-10,CITY_Y+6.5,426],'#9a4dff',1.1,20],[[8,CITY_Y+6.5,440],'#ff7a3a',1.1,20],[[-12.5,CITY_Y+3,400],'#b0156e',.9,14]],   // the food court and the alley's end (low-quay-court.js)
   city:[[[-8,CITY_Y+3,322],'#ff8a30',1,24],[[-20,CITY_Y+5,345],'#ffa640',1,32],[[15,CITY_Y+5,370],'#ff3fa6',.8,32],[[-35,CITY_Y+3,392],'#25c9c2',.8,32],[[25,CITY_Y+5,410],'#ff7a22',.9,32],[[-5,CITY_Y+5,440],'#ffa640',.9,32]]};
  if(!low)for(let k=0;k<6;k++){const l=new B.PointLight('lq-light',B.Vector3.Zero(),scene);l.parent=parent;lights.push(l);}
  const quayBlend=()=>(scene.meshes.filter(m=>{let p=m.parent;while(p&&p!==world)p=p.parent;if(p!==world||/lq-(skyline|reflect|moon|sky)/.test(m.name)||!(m.position.z>150||/court-steam/.test(m.name)))return false;   /* the skyline, its reflection and the moon stay */if(m.sourceMesh)return true;const mt=m.material;return !!mt&&(mt.alphaMode===B.Engine.ALPHA_ADD||mt.alpha<1||!!mt.opacityTexture||!!mt.useAlphaFromDiffuseTexture);}));
  let zone=null;const zoneOf=(z,x=0)=>z<150?'pad':z<312?'hall':club()?.inside(x,z)?'club':court()?.inCourt(x,z)?'court':'city',setZone=zn=>{if(zn===zone)return;const was=zone;zone=zn;if(was==null||(was==='pad')!==(zn==='pad'))for(const m of quayBlend())m.setEnabled(zn!=='pad');   // from the pad (800 m off) the quay's small placed pieces and glows (shopfronts, units, lamps, washes, steam) are specks: off; its buildings stay
   const inClub=zn==='club';if(ambient){ambient.diffuse=C(inClub?'#5a2a5c':'#55638c');ambient.groundColor=C(inClub?'#2a0c22':'#2a2018');ambient.intensity=inClub?.9:1;}if(sun)sun.intensity=inClub?.1:.7;   // indoors at the club: no moonlight, a plum fill
   ZL[zn].forEach(([p,hex,i,range],k)=>{const l=lights[k];if(!l)return;l.position.set(...p);l.diffuse=C(hex);l.specular=C(hex).scale(.5);l.intensity=i;l.range=range;});};setZone('pad');
  for(const [x,z] of [...TOWERS,[-10.5,stz+6]]){const p=B.MeshBuilder.CreateGround('lq-pool',{width:44,height:44},scene);p.material=poolMat;p.position.set(x,.03,z);p.parent=parent;p.isPickable=false;}
  // ---- security vestibule, tunnel (the rail ride), then the city ----
  const city=root.VoidLowQuayCity?.build?root.VoidLowQuayCity.build({B,scene,parent,quality,K,place,mat,glow,tex,sprite,owned,textures,hide,C,S,lampKit,pole,rail,deck,pier,pierGlow,edge,streak,banner,conc,concD,dark,steel,amber,warm,cool,blue,red,green,yel,hazard,glass,Z,TRACKS,CX,SEG,WY,BLOCKS,r,CITY_Y,waterMat,STAIRS}):null;
  // ---- finish: merge the static parts ----
  S.done('static').forEach(m=>{m.isVisible=true;});
  zone=null;setZone('pad');   // again now that the quay is built (its small pieces start off: the player arrives on the pad)   // kits are hidden sources for instancing; the static merge is drawn itself
  const ripple={t:0};
  // ---- the ride ----
  let ride=null,craftSwap=null,flight=null;const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
  const train1=trainRoot,trainZ={pad:-353,city:275},trainAt={v:'pad'};
  api.live={
   ride(from){if(ride)return false;const dir=from==='pad'?1:-1,z0=trainZ[from],z1=trainZ[from==='pad'?'city':'pad'];ride={t:0,dur:17,dir,z0,z1,from,started:performance.now(),last:null};
    ride.yaw=dir>0?0:Math.PI;if(typeof walker!=='undefined'&&walker){walker.yaw=ride.yaw;walker.pitch=0;}return true;},
   rideState:()=>ride,
   riding:()=>!!ride,
   callShip(target){if(flight)return null;const p=plan({shipAccess:flags().shipAccess,at,target,craftAt:crafts.map(c=>c.berth)});if(p.kind!=='move'||!ship)return p;
    const board=(root.walkingLocation||walkingLocation)?.interactions?.find(i=>i.id==='board'||i.action==='board');ship.computeWorldMatrix(true);
    const inv=ship.getWorldMatrix().clone().invert(),local=board?B.Vector3.TransformCoordinates(new B.Vector3(board.position[0],ship.position.y-.1,board.position[2]),inv):null;
    const [fx,fz]=BERTHS[at],[tx,tz]=BERTHS[target],swap=crafts.find(c=>c.berth===target);
    flight={t:0,dur:3.6,fx,fz,tx,tz,y0:ship.position.y,yaw0:ship.rotation.y,yaw1:ship.rotation.y+(Math.random()-.5)*.5,board,local,target,swap,from:at,fromHome:crafts.find(c=>c.berth===at)};
    if(board)board.position=[tx+2,1.7,tz+5];return p;}};   // the board prompt waits at the new berth (set exactly when the ship lands)
  api.live.berth=()=>at;
  function tick(time){
   const now=performance.now();
   if(waterMat.bumpTexture){bump.uOffset=(time*.004)%1;bump.vOffset=(time*.0025)%1;}
   // the second train, looping, and the berth hop
   train2.position.z=-320+((time*30)%470);
   const wz=typeof walker!=='undefined'&&walker?walker.z:-423,wx=typeof walker!=='undefined'&&walker?walker.x:0,gh=groundHeight(wz,wx);setZone(zoneOf(wz,typeof walker!=='undefined'&&walker?walker.x:0));
   if(Math.abs(parent.position.y+gh)>1e-4){parent.position.y=-gh;parent.computeWorldMatrix(true);for(const f of frozen)f.freezeWorldMatrix();}   // the player's eye height is fixed: the world moves down as he climbs
   if(flight){const f=flight;f.t+=Math.min(.1,(f.last==null?0:(now-f.last)/1000));f.last=now;const k=Math.min(1,f.t/f.dur),e=ease(k),lift=Math.sin(Math.min(1,k*1.0)*Math.PI);
    ship.position.set(f.fx+(f.tx-f.fx)*e,f.y0+lift*5,f.fz+(f.tz-f.fz)*e);ship.rotation.y=f.yaw0+(f.yaw1-f.yaw0)*e;
    if(k>=1){if(f.swap){const [sx,sz]=BERTHS[f.from];f.swap.move(sx,sz,.4);f.swap.berth=f.from;f.swap.nodes.forEach(n=>n.setEnabled(true));}
     at=f.target;ship.position.y=f.y0;ship.computeWorldMatrix(true);if(f.board&&f.local){const w=B.Vector3.TransformCoordinates(f.local,ship.getWorldMatrix());f.board.position=[w.x,1.7,w.z];}else if(f.board)f.board.position=[BERTHS[at][0]+2,1.7,BERTHS[at][1]+5];
     if(typeof announce==='function')announce(MESSAGES.arrived);flight=null;}
    else if(f.swap&&k>.5){f.swap.nodes.forEach(n=>n.setEnabled(false));}}
   if(ride){const R=ride;R.t+=Math.min(.1,R.last==null?0:(now-R.last)/1000);R.last=now;const k=Math.min(1,R.t/R.dur),z=R.z0+(R.z1-R.z0)*ease(k);
    train1.position.z=z;
    if(typeof walker!=='undefined'&&walker){walker.x=TRACKS[0];walker.z=z+R.dir*9;}
    if(k>=1){ride=null;const toCity=R.dir>0;if(typeof walker!=='undefined'&&walker){walker.x=0;walker.z=R.z1;walker.yaw=toCity?0:Math.PI;walker.pitch=0;}if(typeof announce==='function')announce(toCity?'You have arrived at the city centre.':'You have arrived at the landing pad.');}}
   city?.tick?.(time);
  }
  return {tick,dispose(){for(const l of lights)l.dispose();for(const t of textures)t.dispose();for(const m of owned)m.dispose(false,true);for(const m of kits)m.dispose();api.live=null;
   scene.clearColor=prev.clear;scene.fogMode=prev.fogMode;scene.fogDensity=prev.fogDensity;scene.fogColor=prev.fogColor;ip.exposure=look.exposure;ip.contrast=look.contrast;
   if(sun&&saved.sun){sun.intensity=saved.sun.i;sun.direction=saved.sun.d;sun.diffuse=saved.sun.c;sun.specular=saved.sun.s;}if(ambient&&saved.amb){ambient.intensity=saved.amb.i;ambient.diffuse=saved.amb.d;ambient.groundColor=saved.amb.g;}}};
 }
 if(typeof document!=='undefined'){const wait=setInterval(()=>{if(typeof VoidInteractions==='undefined'||!VoidInteractions.register||typeof announce==='undefined')return;clearInterval(wait);
  VoidInteractions.register('quay-terminal',({item,resume})=>{const live=api.live;const p=live?live.callShip(item.berth):plan({shipAccess:state?.story?.flags?.shipAccess,at:HOME_BERTH,target:item.berth});announce((p||{message:MESSAGES.calling}).message);resume();});
  VoidInteractions.register('quay-train',({item,resume})=>{const live=api.live;if(live&&live.ride(item.at))announce('High-speed rail departing.');resume();});},300);}
 if(node)module.exports=api;else root.VoidLowQuay=api;
})(globalThis);
