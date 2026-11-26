/* The space-station kit (docs/development/STATION_GRAPHICS.md): modelled wall, ceiling, deck, door, window, furniture and hull pieces
   (tools/assets/station-kit/build_station_kit.py, built in Blender) laid over the stations' existing plan. PRESENTATION ONLY: the walkable
   plan, every collision solid, interaction, door and activity point stay exactly as meridian-interior.js and station-layouts.js define them.
   Every piece comes from ONE file (assets/models/station-kit/station-kit.glb); its faces name shared materials (st_hull, st_wall, ...) and
   the game makes one material per name from assets/textures/station. All copies of the pieces in one room (or one hull section) are baked
   into a single mesh per material, so a station is a few dozen draw calls. If the file or a picture cannot be loaded, nothing is added and
   the older dressing (meridian-interior-kit.js, meridian-kitbash.js) is used instead.
   The pure parts (plans, identity, the GLB reader) also run in Node for the tests. */
(function(root){
 'use strict';
 const base=typeof document!=='undefined'&&document.currentScript?new URL('.',document.currentScript.src):null;
 const FILE='assets/models/station-kit/station-kit.glb',TEX='assets/textures/station/',SHARED='assets/textures/district-interior/';
 // Walls are DARK and the lamps light them (the owner, 26 Nov 2026: "make the walls dark then use lights to light it up").
 // Each station keeps its own identity (station-layouts.js palettes): hull tint, interior wall tint, its paint accent, the colour of its
 // light fittings and how worn it is. Same pieces, same plan.
 const identity={
  meridian:{hull:'#8f979f',wall:'#474d54',deck:'#8a9096',accent:'#c9792e',light:'#ffc98a',lamp:[1,.86,.7],grime:.0},
  kepler:{hull:'#a9b4ba',wall:'#4c5862',deck:'#a3abb3',accent:'#3f7fae',light:'#e4f0ff',lamp:[.86,.93,1],grime:.0},
  rusthaven:{hull:'#8a7770',wall:'#4b423c',deck:'#8d8580',accent:'#7a4fa3',light:'#ffc58a',lamp:[1,.74,.52],grime:.3},
  foundry:{hull:'#8c8478',wall:'#4a443c',deck:'#8f8a84',accent:'#d2622a',light:'#ffb872',lamp:[1,.72,.46],grime:.2},
  'sol-belt':{hull:'#9aa6a4',wall:'#455250',deck:'#98a2a2',accent:'#3d9a86',light:'#dff2e8',lamp:[.86,1,.93],grime:.1},
  vigil:{hull:'#d5dde2',wall:'#7f8b93',deck:'#b9c2c8',accent:'#58bfe0',light:'#cfeeff',lamp:[.78,.92,1],grime:.0},
  holdfast:{hull:'#7d7468',wall:'#453e37',deck:'#857d74',accent:'#c8802c',light:'#ffb45e',lamp:[1,.7,.4],grime:.35},
  derelict:{hull:'#6f6d68',wall:'#4d4b47',deck:'#6e6b66',accent:'#8a4a2a',light:'#ff5a3a',lamp:[1,.4,.3],grime:.6}
 };
 const look=id=>identity[id]||identity.meridian;

 // ------------------------------------------------------------------ the file ------------------------------------------------------------------
 // Reads every mesh of a GLB into plain arrays, in the game's coordinates (glTF is right-handed; negating z keeps lettering unmirrored).
 function parseGLB(buffer){
  const dv=new DataView(buffer);if(dv.getUint32(0,true)!==0x46546c67)throw Error('station kit: not a GLB');
  const jsonLength=dv.getUint32(12,true),json=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,20,jsonLength))),bin=20+jsonLength+8;
  const types={5126:Float32Array,5123:Uint16Array,5125:Uint32Array,5121:Uint8Array},width={SCALAR:1,VEC2:2,VEC3:3,VEC4:4};
  const read=i=>{const a=json.accessors[i],view=json.bufferViews[a.bufferView],T=types[a.componentType],start=bin+(view.byteOffset||0)+(a.byteOffset||0);return new T(buffer.slice(start,start+a.count*width[a.type]*T.BYTES_PER_ELEMENT));};
  const pieces={},image=i=>{const im=json.images?.[json.textures?.[i]?.source];if(!im||im.bufferView===undefined||typeof Blob==='undefined')return null;const v=json.bufferViews[im.bufferView];return URL.createObjectURL(new Blob([buffer.slice(bin+(v.byteOffset||0),bin+(v.byteOffset||0)+v.byteLength)],{type:im.mimeType||'image/jpeg'}));};
  // Props carry their own pictures (one material each): colour, normal and occlusion/roughness/metal.
  const own={};for(const m of json.materials||[]){const pm=m.pbrMetallicRoughness||{};if(pm.baseColorTexture)own[m.name]={color:image(pm.baseColorTexture.index),normal:m.normalTexture?image(m.normalTexture.index):null,orm:pm.metallicRoughnessTexture?image(pm.metallicRoughnessTexture.index):null};}
  for(const node of json.nodes||[]){if(node.mesh===undefined)continue;const parts=[];
   for(const prim of json.meshes[node.mesh].primitives){
    const positions=Float32Array.from(read(prim.attributes.POSITION)),normals=Float32Array.from(read(prim.attributes.NORMAL)),uv=prim.attributes.TEXCOORD_0!==undefined?Float32Array.from(read(prim.attributes.TEXCOORD_0)):new Float32Array(positions.length/3*2),indices=Uint32Array.from(read(prim.indices));
    for(let i=2;i<positions.length;i+=3){positions[i]=-positions[i];normals[i]=-normals[i];}
    for(let i=1;i<uv.length;i+=2)uv[i]=1-uv[i];
    // (no winding swap: negating z turns glTF's counter-clockwise fronts into the clockwise fronts Babylon's left-handed space expects)
    parts.push({material:json.materials[prim.material]?.name||'st_gunmetal',positions,normals,uvs:uv,indices});}
   pieces[node.name]=parts;}
  // Two built pieces: a flat deck and a flat ceiling, one metre square, textured in metres where they are put.
  const flat=(material,up)=>[{material,world:true,positions:new Float32Array([-.5,0,-.5,.5,0,-.5,.5,0,.5,-.5,0,.5]),normals:new Float32Array([0,up,0,0,up,0,0,up,0,0,up,0]),uvs:new Float32Array(8),indices:new Uint32Array(up>0?[0,1,2,0,2,3]:[0,2,1,0,3,2])}];
  pieces.unit_deck=flat('st_deck',1);pieces.unit_ceiling=flat('st_dark',-1);pieces.unit_marking=flat('st_marking',1);pieces.unit_hull=flat('st_hull',1);
  return {pieces,own};
 }
 let kit=null,kitPromise=null;const pictures=new Map(),propPictures={},propPromise={};
 const WORLD_TILE={st_deck:4,st_dark:2,st_marking:4,st_hull:8};
 const PICTURES=['st_hull_color','st_hull_normal','st_hull_orm','st_wall_color','st_wall_normal','st_wall_orm','st_deck_color','st_deck_normal','st_deck_orm','st_trim_color','st_trim_normal','st_trim_orm','st_trim_emissive'];
 // Downloads the piece file and the pictures before any scene uses them (a texture still downloading holds a scene's readiness check).
 // Resolves true when everything is there. Never throws: a failure means the older dressing is used.
 function fetchAll(task){
  if(kit)return Promise.resolve(true);if(!base)return Promise.resolve(false);
  return kitPromise??=(async()=>{
   try{
    const get=async path=>{const r=await fetch(new URL(path,base),{signal:task?.signal});if(!r.ok)throw Error(path+' HTTP '+r.status);return r;};
    const [buffer]=await Promise.all([get(FILE).then(r=>r.arrayBuffer()),...PICTURES.map(async name=>{if(!pictures.has(name))pictures.set(name,URL.createObjectURL(await (await get(TEX+name+'.jpg')).blob()));})]);
    kit=parseGLB(buffer).pieces;return true;
   }catch(error){console.warn('[VOID station kit] not available; using the earlier station dressing.',error.message);kitPromise=null;return false;}
  })();
 }
 const ready=()=>!!kit;
 // The Meshy props (tools/assets/station-kit/prepare_props.py): one file for the rooms, one for the hull. Medium quality and above.
 // Optional: a station without them is complete, so a failed download only leaves them out.
 function fetchProps(group,task){
  if(!kit||!base)return Promise.resolve(false);
  return propPromise[group]??=(async()=>{
   try{const r=await fetch(new URL('assets/models/station-kit/station-props-'+group+'.glb',base),{signal:task?.signal});if(!r.ok)throw Error('HTTP '+r.status);
    const parsed=parseGLB(await r.arrayBuffer());for(const [k,v] of Object.entries(parsed.pieces))if(k.startsWith('prop_'))kit[k]=v;Object.assign(propPictures,parsed.own);return true;
   }catch(error){console.warn('[VOID station kit] '+group+' props not available.',error.message);propPromise[group]=null;return false;}
  })();
 }

 // ------------------------------------------------------------------ materials ------------------------------------------------------------------
 /* Baked light. The stations' fittings (ceiling troughs, floods, coves, window spill) are far more than the eight real lights a material
    can take, so their light is worked out once per vertex when a room is built (bake(), from the lamps list) and added in the shader:
    colour = lit colour + surface colour x baked light. No extra lights, no shadow maps, no per-frame cost. */
 let Baked=null;const texturePools=new Map();
 function bakedPlugin(B){
  return Baked??=class VoidStationBaked extends B.MaterialPluginBase{
   constructor(material){super(material,'VoidStationBaked',210,{VOIDSTATIONBAKED:false});this._enable(true);}
   prepareDefines(defines){defines.VOIDSTATIONBAKED=true;}
   getClassName(){return 'VoidStationBaked';}
   getAttributes(attributes){attributes.push('bakedLight');}
   getCustomCode(type){return type==='vertex'?{CUSTOM_VERTEX_DEFINITIONS:'attribute vec3 bakedLight;\nvarying vec3 vBakedLight;',CUSTOM_VERTEX_MAIN_END:'vBakedLight=bakedLight;'}
    :{CUSTOM_FRAGMENT_DEFINITIONS:'varying vec3 vBakedLight;',CUSTOM_FRAGMENT_BEFORE_FINALCOLORCOMPOSITION:'finalDiffuse+=surfaceAlbedo*vBakedLight;'};}
  };
 }
 function hex(B,h,k=1){const c=B.Color3.FromHexString(h);return new B.Color3(c.r*k,c.g*k,c.b*k);}
 function materials(scene,id,quality='medium',{space=false}={}){
  const B=root.BABYLON,L=look(id),owned=[],out={};
  // One GPU texture per picture per scene, shared by every material set in it (a station has an interior set and a hull set); freed with the last set.
  const pool=texturePools.get(scene)||{refs:0,map:new Map()};texturePools.set(scene,pool);pool.refs++;
  const once=(key,make)=>{let t=pool.map.get(key);if(!t){t=make();pool.map.set(key,t);}return t;};
  const picture=(name,linear)=>{const url=pictures.get(name);if(!url)return null;return once(name,()=>{const t=new B.Texture(url,scene,false,true,B.Texture.TRILINEAR_SAMPLINGMODE);t.anisotropicFilteringLevel=quality==='low'?2:quality==='medium'?4:8;if(linear)t.gammaSpace=false;return t;});};
  const shared=(name)=>once('shared:'+name,()=>{const t=new B.Texture(new URL(SHARED+name+'.jpg',base).href,scene,false,true);t.anisotropicFilteringLevel=4;return t;});
  function pbr(name,{set=null,color='#ffffff',k=1,rough=.6,metal=.2,emissive=null,alpha=1,sharedSet=null,bump=1}={}){
   const m=new B.PBRMaterial('station-kit-'+name,scene);m.albedoColor=hex(B,color,k);m.roughness=rough;m.metallic=metal;m.maxSimultaneousLights=8;
   if(set){m.albedoTexture=picture(set+'_color');const orm=picture(set+'_orm',true);if(orm){m.metallicTexture=orm;m.roughness=1;m.metallic=1;m.useRoughnessFromMetallicTextureGreen=true;m.useRoughnessFromMetallicTextureAlpha=false;m.useMetallnessFromMetallicTextureBlue=true;m.useAmbientOcclusionFromMetallicTextureRed=true;}
    if(quality!=='low'||set==='st_deck'){const n=picture(set+'_normal',true);if(n){m.bumpTexture=n;}}}
   if(sharedSet){m.albedoTexture=shared(sharedSet+'_color');if(quality!=='low'){m.bumpTexture=shared(sharedSet+'_normal');}}
   if(emissive){m.emissiveColor=emissive;}
   if(alpha<1){m.alpha=alpha;m.transparencyMode=B.PBRMaterial.PBRMATERIAL_ALPHABLEND;m.backFaceCulling=false;}
   m.environmentIntensity=space?.55:.3;
   if(!emissive&&alpha>=1){try{new (bakedPlugin(B))(m);}catch(error){console.warn('[VOID station kit] baked light unavailable',error.message);}}
   owned.push(m);out[name]=m;return m;
  }
  const dirt=1-L.grime*.35;
  pbr('st_hull',{set:'st_hull',color:space?L.hull:L.wall,k:(space?2.3:1.05)*dirt,bump:1.1});
  pbr('st_hull_dark',{set:'st_hull',color:L.hull,k:1.15*dirt,bump:1.1});pbr('st_hull_paint',{set:'st_hull',color:L.accent,k:2.6*dirt,bump:1.1}); // replacement plates and painted plates on the outer hull // inside (the hangar's big plates) it takes the dark wall tone
  pbr('st_wall',{set:'st_wall',color:L.wall,k:.85*dirt});
  pbr('st_deck',{set:'st_deck',color:L.deck,k:1.25*dirt,bump:1.2});
  pbr('st_tank',{set:'st_wall',color:space?'#dcdccf':'#8f9088',k:space?1.15:1});
  pbr('st_gunmetal',{sharedSet:'kit_gunmetal',color:'#ffffff',k:1.5,rough:.5,metal:.55});
  pbr('st_steel',{sharedSet:'kit_steel',color:'#ffffff',k:1.15,rough:.38,metal:.75});
  pbr('st_dark',{sharedSet:'kit_gunmetal',color:'#ffffff',k:.55,rough:.6,metal:.4});
  pbr('st_accent',{sharedSet:'kit_steel',color:L.accent,k:space?2.6:1.5,rough:.55,metal:.15});
  pbr('st_marking',{color:'#d8a326',rough:.7,metal:0});
  pbr('st_leather',{color:id==='vigil'?'#8d99a3':id==='kepler'?'#2f4a63':id==='holdfast'||id==='foundry'?'#5a3a22':'#3a0c11',rough:.6,metal:0});
  pbr('st_counter',{color:'#0f1012',rough:.36,metal:.1});
  pbr('st_glass',{color:'#3f6d5e',rough:.08,metal:.1,alpha:.55});
  const bottle=pbr('st_bottle',{color:'#8a4f22',rough:.1,metal:.1,emissive:new B.Color3(.2,.09,.03)});bottle.alpha=.92;
  const trim=pbr('st_trim',{set:'st_trim'});trim.emissiveTexture=picture('st_trim_emissive');trim.emissiveColor=new B.Color3(1,1,1);trim.emissiveIntensity=space?1.6:1.15;
  // One material per loaded prop, from the pictures inside its file.
  for(const [name,pics] of Object.entries(propPictures)){if(!pics.color)continue;const m=pbr(name,{rough:1,metal:1});
   const tex=(url,linear)=>once(url,()=>{const t=new B.Texture(url,scene,false,true,B.Texture.TRILINEAR_SAMPLINGMODE);t.anisotropicFilteringLevel=4;if(linear)t.gammaSpace=false;return t;});
   m.albedoTexture=tex(pics.color);if(pics.normal){m.bumpTexture=tex(pics.normal,true);}
   if(pics.orm){m.metallicTexture=tex(pics.orm,true);m.useRoughnessFromMetallicTextureGreen=true;m.useRoughnessFromMetallicTextureAlpha=false;m.useMetallnessFromMetallicTextureBlue=true;}else{m.roughness=.6;m.metallic=.3;}}
  const lamp=pbr('st_light',{color:'#000000',rough:.4,metal:0,emissive:hex(B,L.light,space?1.5:.8)});lamp.disableLighting=true;
  let live=true;return {materials:out,dispose(){if(!live)return;live=false;for(const m of owned)m.dispose(false,false);if(--pool.refs<=0){for(const t of pool.map.values())t.dispose();texturePools.delete(scene);}}};
 }

 // ------------------------------------------------------------------ baking ------------------------------------------------------------------
 // A placement is {key, zone, p:[x,y,z], yaw, s:[sx,sy,sz]} or, for pieces that are not upright, {key, zone, p, basis:[X,Y,Z], s}
 // (the three axes the piece's own x, y and z are turned to).
 function basisOf(pl){
  if(pl.basis)return pl.basis;const c=Math.cos(pl.yaw||0),s=Math.sin(pl.yaw||0);return [[c,0,-s],[0,1,0],[s,0,c]];
 }
 // Axes for a piece whose own x runs along a direction (trusses, pipes, tanks): y stays as close to `up` as it can.
 function along(dir,up=[0,1,0]){
  const n=v=>{const l=Math.hypot(v[0],v[1],v[2])||1;return [v[0]/l,v[1]/l,v[2]/l];},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const X=n(dir);let Z=cross(X,up);if(Math.hypot(Z[0],Z[1],Z[2])<1e-4)Z=cross(X,[0,0,1]);Z=n(Z);const Y=cross(Z,X);return [X,Y,Z];
 }
 function bake(scene,parent,placements,mats,name='station-kit',lamps=null){
  const B=root.BABYLON,node=new B.TransformNode(name,scene);node.parent=parent;
  const groups=new Map();let triangles=0,pieces=0;
  for(const pl of placements){const parts=kit[pl.key];if(!parts)continue;pieces++;
   const [X,Y,Z]=basisOf(pl),s=pl.s||[1,1,1],p=pl.p;
   for(const part of parts){const name=pl.swap?.[part.material]||part.material,key=(pl.zone||'all')+'|'+name;let g=groups.get(key);if(!g)groups.set(key,g={material:name,zone:pl.zone||'all',positions:[],normals:[],uvs:[],indices:[],count:0});
    const src=part.positions,nrm=part.normals,uv=part.uvs,n=src.length/3,offset=g.count,tile=part.world?(WORLD_TILE[g.material]||4):0;
    for(let i=0;i<n;i++){const x=src[i*3]*s[0],y=src[i*3+1]*s[1],z=src[i*3+2]*s[2];
     const wx=p[0]+X[0]*x+Y[0]*y+Z[0]*z,wy=p[1]+X[1]*x+Y[1]*y+Z[1]*z,wz=p[2]+X[2]*x+Y[2]*y+Z[2]*z;g.positions.push(wx,wy,wz);
     const a=nrm[i*3]/s[0],b=nrm[i*3+1]/s[1],c=nrm[i*3+2]/s[2];let nx=X[0]*a+Y[0]*b+Z[0]*c,ny=X[1]*a+Y[1]*b+Z[1]*c,nz=X[2]*a+Y[2]*b+Z[2]*c;const l=Math.hypot(nx,ny,nz)||1;g.normals.push(nx/l,ny/l,nz/l);
     if(tile)g.uvs.push(wx/tile,wz/tile);else g.uvs.push(uv[i*2],uv[i*2+1]);}
    const idx=part.indices;for(let i=0;i<idx.length;i++)g.indices.push(idx[i]+offset);g.count+=n;triangles+=idx.length/3;}}
  const meshes=[];
  for(const g of groups.values()){const material=mats[g.material];if(!material||!g.count)continue;
   const mesh=new B.Mesh(name+'-'+g.zone+'-'+g.material,scene),data=new B.VertexData();data.positions=new Float32Array(g.positions);data.normals=new Float32Array(g.normals);data.uvs=new Float32Array(g.uvs);data.indices=g.count>65535?new Uint32Array(g.indices):new Uint16Array(g.indices);
   data.applyToMesh(mesh,false);if(lamps)mesh.setVerticesData('bakedLight',light(g,lamps),false,3);mesh.material=material;mesh.parent=node;mesh.isPickable=false;mesh.checkCollisions=false;mesh.metadata={stationKit:true,zone:g.zone};
   if(material.alpha>=1)mesh.freezeWorldMatrix?.();meshes.push(mesh);}
  node.metadata={stationKit:true,pieces,triangles,draws:meshes.length};return node;
 }

 // Per-vertex light from a room's lamps: inverse-square with a soft cut-off at the lamp's range, wrapped a little round corners (which
 // stands in for bounce), no shadows. A lamp only lights its own room, so nothing leaks through walls.
 function light(g,lamps){
  const n=g.count,out=new Float32Array(n*3),P=g.positions,N=g.normals,list=lamps.filter(l=>!l.zone||l.zone===g.zone||l.zone+'-detail'===g.zone||l.zone+'-in'===g.zone);
  for(const l of list){const r2=l.range*l.range,k=l.range*.36,k2=k*k,[lx,ly,lz]=l.p,[cr,cg,cb]=l.c,pw=l.power,soft=l.soft??.35;
   for(let i=0;i<n;i++){const dx=lx-P[i*3],dy=ly-P[i*3+1],dz=lz-P[i*3+2],d2=dx*dx+dy*dy+dz*dz;if(d2>=r2)continue;
    const d=Math.sqrt(d2)||1e-4,ndl=(N[i*3]*dx+N[i*3+1]*dy+N[i*3+2]*dz)/d,wrap=(ndl+soft)/(1+soft);if(wrap<=0)continue;
    const w=1-d2/r2,v=pw*wrap*w*w/(1+d2/k2);out[i*3]+=cr*v;out[i*3+1]+=cg*v;out[i*3+2]+=cb*v;}}
  return out;
 }

 // ------------------------------------------------------------------ the interior plan ------------------------------------------------------------------
 const yawFor={'+x':-Math.PI/2,'-x':Math.PI/2,'+z':Math.PI,'-z':0};      // turns a piece's front (-z) to face along a wall's normal
 const MIDS=['wall_mid_a','wall_mid_e','wall_mid_b','wall_mid_a','wall_mid_c','wall_mid_e','wall_mid_d','wall_mid_a'];
 // Shell boxes the kit replaces (their collision solids are untouched; only the drawn box is hidden).
 const HIDDEN=['bar-counter','bar-back','lounge-table','table-pedestal','lounge-sofa','sofa-back','shop-counter','supply-shelf','supply-case','observation-sill','observation-lintel','aft-window-sill','aft-lintel','cargo-crate','ceiling-light','outfitter-category'];
 function interiorPlan(def){
  const out=[],R=def.rooms,F=def.furniture||{},put=(key,zone,p,yaw=0,s=[1,1,1])=>out.push({key,zone,p,yaw,s});
  if(!R)return out;
  let serial=0;
  // One straight run of wall, cut into bays. rows: [[piece or 'mid', bottom]], module: the piece's own width.
  function run(w,from,to,kind){
   const len=to-from;if(len<.25)return;const yaw=yawFor[w.normal],at=(t,y)=>w.axis==='z'?[w.fixed,y,t]:[t,y,w.fixed],zone=w.room;
   if(kind==='hangar'){
    const n=Math.max(1,Math.round(len/4)),bay=len/n;
    for(let i=0;i<n;i++){const c=from+bay*(i+.5),k=serial++;
     for(const h of [-.25,.25]){put('wall_low',zone,at(c+h*bay,0),yaw,[bay/4,1,1]);put(MIDS[(k*2+(h>0?1:0))%MIDS.length],zone,at(c+h*bay,1.1),yaw,[bay/4,1,1]);put('wall_top',zone,at(c+h*bay,w.h-1),yaw,[bay/4,1,1]);}
     put(k%3===1?'hangar_panel_b':'hangar_panel_a',zone,at(c,2.6),yaw,[bay/4,(w.h-3.6)/5.4,1]);
     if(i>0||w.id==='hangar-side')put('hangar_rib',zone,at(from+bay*i,0),yaw,[1,w.h/9,1]);}
    if(w.id==='hangar-side')put('hangar_rib',zone,at(to,0),yaw,[1,w.h/9,1]);
    return;}
   const n=Math.max(1,Math.round(len/2)),bay=len/n,tall=w.h>4.2;
   for(let i=0;i<n;i++){const c=from+bay*(i+.5),k=serial++,sx=bay/2;
    put('wall_low',zone,at(c,0),yaw,[sx,1,1]);
    put(kind==='port'?'wall_mid_port':MIDS[k%MIDS.length],zone,at(c,1.1),yaw,[sx,1,1]);
    if(tall)put('wall_clere',zone,at(c,2.6),yaw,[sx,(w.h-3.6)/1.4,1]);
    put('wall_top',zone,at(c,w.h-1),yaw,[sx,1,1]);
    if(kind!=='port'&&i>0&&i%2===0&&len>5)put(tall?'pilaster_50':'pilaster_36',zone,at(from+bay*i,0),yaw,[1,w.h/(tall?5:3.6),1]);}
  }
  const ports=(F.portholes||[]).slice().sort((a,b)=>a-b);
  for(const w of def.walls||[]){
   if(w.window){const len=w.to-w.from,n=Math.max(1,Math.round(len/4)),bay=len/n;for(let i=0;i<n;i++){const c=w.from+bay*(i+.5);put('window_bay',w.room,w.axis==='z'?[w.fixed,0,c]:[c,0,w.fixed],yawFor[w.normal],[bay/4,1,1]);}continue;}
   if(w.room==='hangar'){run(w,w.from,w.to,'hangar');continue;}
   // The corridor's outer wall has portholes: each gets its own bay with an opening, and plain bays fill between them.
   if(w.id==='corridor-wall-right'&&ports.length){let t=w.from;for(const z of ports){if(z-1<t||z+1>w.to)continue;run(w,t,z-1,'low');run(w,z-1,z+1,'port');t=z+1;}run(w,t,w.to,'low');continue;}
   run(w,w.from,w.to,'low');
  }
  // Door frames: the pressure door between hangar and corridor, the living-area door, the open store front, the hall's entry.
  const C=R.corridor,H=R.hall,G=R.hangar;
  put('door_frame','hangar',[0,0,G.z1-.3],yawFor['-z']);put('portal_3m','corridor',[0,0,C.z0+.3],yawFor['+z'],[3.2/3,1,1]);
  put('portal_3m','corridor',[C.x0,0,12],yawFor['+x']);put('portal_3m','living',[C.x0-.4,0,12],yawFor['-x']);
  put('portal_5m','corridor',[C.x0,0,28],yawFor['+x']);put('portal_5m','store',[C.x0-.4,0,28],yawFor['-x']);
  put('portal_5m','hall',[0,0,H.z0],yawFor['+z'],[(C.x1-C.x0)/5,1,1]);
  // Ceilings.
  for(let z=C.z0+1;z<C.z1;z+=2)put('ceil_corridor','corridor',[0,C.h,z]);
  for(const id of ['living','store','hall']){const r=R[id],w=r.x1-r.x0,d=r.z1-r.z0,nx=Math.max(1,Math.round(w/4)),nz=Math.max(1,Math.round(d/4)),sx=w/nx,sz=d/nz;
   for(let i=0;i<nx;i++)for(let j=0;j<nz;j++)put((i+j)%2?'ceil_room_b':'ceil_room_a',id,[r.x0+sx*(i+.5),r.h,r.z0+sz*(j+.5)],0,[sx/4,1,sz/4]);}
  {const w=G.x1-G.x0,d=G.z1-G.z0;for(let i=0;i<6;i++)for(let j=0;j<5;j++)put('hangar_ceil','hangar',[G.x0+w/6*(i+.5),G.h,G.z0+d/5*(j+.5)],0,[w/36,1,d/30]);
   for(let z=G.z0+3;z<G.z1-1;z+=6)put('hangar_truss','hangar',[0,G.h,z],0,[w/36,1,1]);
   put('hangar_crane','hangar',[0,G.h-2.4,G.z0+15],0,[w/36,1,1]);}
  // Decks: one plate per room (textured in metres), drain gratings down the corridor, markings in the hangar.
  for(const [id,r] of Object.entries(R)){put('unit_deck',id,[(r.x0+r.x1)/2,.03,(r.z0+r.z1)/2],0,[r.x1-r.x0,1,r.z1-r.z0]);}
  for(let z=C.z0+1;z<C.z1;z+=2)for(const x of [C.x0+.62,C.x1-.62])put('floor_grate','corridor',[x,.03,z],Math.PI/2);
  put('pad_ring','hangar',[-7,.03,-9]);
  for(let x=-8;x<=8;x+=4){put('floor_chevron','hangar',[x,.03,G.z0+1.6]);put('floor_hazard','hangar',[x,.03,G.z0+.5]);}
  for(const s of [-1,1])for(let z=G.z0+4;z<G.z1-2;z+=4)put('floor_hazard','hangar',[s*(G.x1-1.2),.03,z],Math.PI/2,[1,1,1]);
  put('floor_hazard','hangar',[0,.03,G.z1-.9],0,[.9,1,1]);put('floor_hazard','corridor',[0,.03,C.z0+.9],0,[.9,1,1]);
  for(const x of [-12,-6,6,12])put('floor_grate','hall',[x,.03,H.z0+11],Math.PI/2,[5,1,1]);
  // Furniture in the places the plan already gives it.
  if(F.bar){const B0=F.bar,n=Math.round(B0.length/2);for(let i=0;i<n;i++){const z=B0.z-B0.length/2+(i+.5)*B0.length/n;put('bar_counter','hall',[B0.x,0,z],yawFor['+x'],[B0.length/n/2,1,1]);put('backbar','hall',[B0.backX-.25,0,z],yawFor['+x'],[B0.length/n/2,1,1]);}}
  if(F.store){const S0=F.store;for(const k of [-.25,.25])put('bar_counter','store',[S0.x,0,S0.z+k*S0.length],yawFor['+x'],[S0.length/4,1,1]);for(const z of S0.shelves||[])put('shop_shelf','store',[S0.shelfX-.3,0,z],yawFor['+x']);}
  for(const t of F.tables||[]){put('table','hall',[t.x,0,t.z]);put('chair','hall',[t.x+1.6,0,t.z],yawFor['-x']);put('chair','hall',[t.x-1.6,0,t.z],yawFor['+x']);}
  for(const s of F.sofas||[])put('booth','hall',[s.x,0,s.z],yawFor['-x'],[s.length/3.2,1,1]);
  for(const p of F.pods||[]){const side=Math.abs((p.facing??Math.PI)-Math.PI/2)<.01;put('pod_shell','living',side?[p.x+1.21,p.y,p.z]:[p.x,p.y,p.z+1.21],yawFor[side?'+x':'+z']);}
  if(F.terminal)put('terminal','corridor',[F.terminal.x-.34,0,F.terminal.z],yawFor['-x']);
  for(const z of ports)put('porthole','corridor',[C.x1,1.75,z],yawFor['-x']);
  // Cargo along the hangar walls and in the hall's corners: clear of the ship, the boarding point and every route (visual only, as before).
  for(const [key,x,z,yaw] of [['crate_a',-15.6,-21,0],['crate_b',-15.7,-18.3,Math.PI/2],['crate_a',-15.7,-16.2,.2],['drum',-14.3,-16.6,0],['drum',-14.1,-15.8,0],['crate_b',-16.3,-1,Math.PI/2],['crate_a',-15.6,1.7,0],['drum',-14.4,2.2,0],
   ['crate_a',15.5,-23.2,0],['crate_a',15.6,-21.6,.1],['crate_b',13.6,-24.4,0],['drum',12.2,-24.3,0],['crate_b',16.3,-6,Math.PI/2],['crate_a',15.8,-3.4,0],['drum',16.4,-1.8,0],['crate_a',14.2,-18.3,.08],['crate_b',14.3,-16.3,.2],['drum',12.8,-15,0],['drum',13.6,-14.1,0]])put(key,'hangar',[x,0,z],yaw);
  put('crate_a','hangar',[15.6,1.2,-22.4],.4,[.8,.8,.8]);
  // Meshy props (Medium and above): hangar service gear against the walls, a vending machine and armchairs off the routes, the bar's stools.
  for(const [key,zone,x,z,yaw] of [['prop_loader','hangar',12.6,-9.5,2.5],['prop_generator','hangar',-15.6,-7.4,Math.PI/2],['prop_fuelpump','hangar',-12.4,-5.2,Math.PI/2],['prop_toolcart','hangar',-11.7,-12.2,1.2],['prop_toolcart','hangar',9.4,1.9,Math.PI],
   ['prop_cylinders','hangar',16.7,-11.4,-Math.PI/2],['prop_cylinders','hangar',-16.7,-23.6,Math.PI/2],['prop_container','hangar',-16.4,-12.6,Math.PI/2],['prop_container','hangar',16.4,-8,-Math.PI/2],
   ['prop_vending','hall',6,40.55,Math.PI],['prop_armchair','hall',11.4,60.4,.25],['prop_armchair','hall',13,60.5,-.2],['prop_armchair','living',-3.9,17.4,Math.PI/2],['prop_armchair','living',-3.9,19.1,Math.PI/2]])put(key,zone,[x,0,z],yaw);
  for(const st of F.stools||[])put('prop_stool','hall',[st.x,0,st.z],0);
  for(const [key,x,z,yaw] of [['crate_b',-14.6,60.8,Math.PI/2],['drum',-12.9,61,0],['drum',14.6,61,0],['crate_a',-14.4,18.9,.2]])put(key,z>40?'hall':'living',[x,0,z],yaw,key==='crate_a'?[.7,.7,.7]:[1,1,1]);
  return out;
 }
 // Where the fittings in interiorPlan shine from. Colours: the station's own lamp colour inside, cooler floods in the hangar, cold
 // light from space at the windows, the bar's amber and violet.
 function interiorLamps(def){
  const R=def.rooms,F=def.furniture||{},L=look(def.id),out=[];if(!R)return out;
  const warm=L.lamp,cool=[.78+.1*L.lamp[0],.86+.06*L.lamp[1],.95],space=[.42,.58,1],lamp=(zone,p,c,power,range,soft)=>out.push({zone,p,c,power,range,soft});
  const C=R.corridor,H=R.hall,G=R.hangar;
  for(let z=C.z0+1;z<C.z1;z+=2)lamp('corridor',[0,C.h-.5,z],warm,.5,7);
  for(const id of ['living','store','hall']){const r=R[id],w=r.x1-r.x0,d=r.z1-r.z0,nx=Math.max(1,Math.round(w/4)),nz=Math.max(1,Math.round(d/4)),sx=w/nx,sz=d/nz;
   for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const x=r.x0+sx*(i+.5),z=r.z0+sz*(j+.5);if((i+j)%2)lamp(id,[x-sx/4,r.h-.5,z+sz/8],warm,r.h>4?.85:.5,r.h>4?11:8);else for(const k of [-1,1])lamp(id,[x,r.h-.55,z+k*sz/4],warm,r.h>4?.9:.55,r.h>4?11:8);}}
  for(let z=G.z0+3;z<G.z1-1;z+=6)for(const x of [-13.5,-4.5,4.5,13.5])lamp('hangar',[x,G.h-2.5,z],cool,1.5,21,.25);
  for(const w of def.walls||[]){const len=w.to-w.from,sign=w.normal[0]==='+'?1:-1,at=(t,y,off)=>w.axis==='z'?[w.fixed+sign*off,y,t]:[t,y,w.fixed+sign*off];
   if(w.window){const n=Math.max(1,Math.round(len/4));for(let i=0;i<n;i++)lamp(w.room,at(w.from+len/n*(i+.5),2.4,.5),space,1.5,7,.6);continue;}
   if(w.id==='hangar-side'){const n=Math.max(1,Math.round(len/4));for(let i=0;i<=n;i++){lamp('hangar',at(w.from+len/n*i,5.6,1.2),warm,1.1,9);if(def.id==='meridian')lamp('hangar',at(w.from+len/n*i,1.2,.9),[1,.16,.1],.5,6,.8);}continue;}
   // the cove under each cable tray: a soft wash down the wall, one lamp every four metres
   if(w.room!=='hangar'){const n=Math.max(1,Math.round(len/4));for(let i=0;i<n;i++)lamp(w.room,at(w.from+len/n*(i+.5),w.h-1.05,.45),warm,.16,4.5,.9);}
  }
  for(const z of F.portholes||[])lamp('corridor',[C.x1-.5,2.3,z],space,.9,4.5,.6);
  if(F.bar){const B0=F.bar;for(let z=B0.z-B0.length/2+1;z<B0.z+B0.length/2;z+=2){lamp('hall',[B0.x+1,.95,z],[1,.56,.24],.9,4.5,.7);lamp('hall',[B0.backX+.75,2,z],[.72,.42,1],1,4.5,.7);}}
  for(const t of F.tables||[])lamp('hall',[t.x,1.5,t.z],[1,.72,.44],.45,4.5,.9);
  if(F.store){const S0=F.store;for(const z of S0.shelves||[])lamp('store',[S0.shelfX+.9,2.4,z],cool,.8,4.5,.6);}
  return out;
 }
 /* Dresses a Meridian-class station's walkable interior. Returns the kit node, or null if the kit is not loaded.
    Call after the station shell is built and before the fit-out batches the remaining boxes. */
 function dressInterior({scene,parent,def,quality='medium'}){
  if(!kit||!def?.rooms)return null;
  try{
   const set=materials(scene,def.id,quality),plan=interiorPlan(def).filter(p=>kit[p.key]&&(quality!=='low'||!/^(prop_|crate|drum|floor_grate|pilaster|hangar_ceil|porthole)/.test(p.key)));
   const node=bake(scene,parent,plan,set.materials,'station-kit-interior',interiorLamps(def));
   const hide=new Set(HIDDEN);for(const m of parent.getChildMeshes(true))if(hide.has(m.name))m.setEnabled(false);
   // Medium and High multiply the finished picture by 0.3 everywhere except the VR simulations (babylon-renderer.js sharpen.colorAmount; vr-core.js
   // puts it to 1 while a simulation runs; docs/development/VR_SESSIONS.md). Raising the exposure to make up for it (as Milked does) leaves white capped
   // at 30% and the picture flat, so the stations ask for the full range the same way the simulations do: `aboard` is read by vr-core.js's keeper.
   aboardNode=node;
   node.onDisposeObservable.addOnce(()=>{if(aboardNode===node)aboardNode=null;set.dispose();});
   node.metadata={...node.metadata,identity:def.id,materials:set.materials};
   parent.metadata={...parent.metadata,stationKit:true,kitProps:!!kit.prop_stool};
   return node;
  }catch(error){console.warn('[VOID station kit] interior dressing failed; using the earlier dressing.',error.message);return null;}
 }

 // ------------------------------------------------------------------ the exterior plan ------------------------------------------------------------------
 // Same design data as the hull builder (meridian-station.js VoidMeridian.design): nothing moves, nothing changes size. The plain hull boxes stay
 // underneath; this clads them and stands the modelled tanks, arrays, trusses, collar, mast and dishes where the builder's plain ones stood.
 function exteriorPlan(design,{occupied=false}={}){
  const out=[],lamps=[],put=(key,zone,p,o={})=>out.push({key,zone,p,...o});out.lamps=lamps;
  let seed=7;const rnd=()=>((seed=seed*16807%2147483647)-1)/2147483646;
  const inside=(p,s)=>occupied&&Math.abs(p[0])<18+s[0]/2&&p[2]+s[2]/2>-26&&p[2]-s[2]/2<66&&p[1]+s[1]/2>0&&p[1]-s[1]/2<9;
  // Plates in rows on one vertical face. n: its outward normal ('+x','-x','+z','-z').
  function face(zone,c,length,height,n,{windows=false}={}){
   const cols=Math.max(1,Math.round(length/4)),rows=Math.max(1,Math.round(height/2)),cw=length/cols,rh=height/rows,yaw=yawFor[n],ax=n[1]==='x';
   for(let r=0;r<rows;r++)for(let k=0;k<cols;k++){const t=-length/2+cw*(k+.5),y=c[1]-height/2+rh*r,v=rnd();
    const key=windows&&r>0&&r<rows-1+(rows<3?1:0)&&v<.62?(v<.3?'hull_d':'hull_e'):v<.5?'hull_a':v<.68?'hull_c':v<.84?'hull_b':'hull_a';
    const w2=rnd();put(key,zone,ax?[c[0],y,c[2]+t]:[c[0]+t,y,c[2]],{yaw,s:[cw/4,rh/2,1],...(w2<.24?{swap:{st_hull:'st_hull_dark'}}:w2>.95?{swap:{st_hull:'st_hull_paint'}}:{})});
    if(v>.93&&rh>1.6)put(['greeble_a','greeble_b','greeble_c'][Math.floor(rnd()*3)],zone+'-detail',ax?[c[0]+(n[0]==='+'?.1:-.1),y+.2,c[2]+t]:[c[0]+t,y+.2,c[2]+(n[0]==='+'?.1:-.1)],{yaw});}
  }
  function roof(zone,c,w,d,units,under=false){
   const cols=Math.max(1,Math.round(w/4)),rows=Math.max(1,Math.round(d/4)),cw=w/cols,cd=d/rows;
   for(let i=0;i<cols;i++)for(let j=0;j<rows;j++)put('roof_plate',zone,[c[0]-w/2+cw*(i+.5),c[1],c[2]-d/2+cd*(j+.5)],under?{basis:[[1,0,0],[0,-1,0],[0,0,-1]],s:[cw/4,1,cd/4]}:{s:[cw/4,1,cd/4]});
   if(under)return;
   for(let k=0;k<units;k++){const x=c[0]-w*.38+rnd()*w*.76,z=c[2]-d*.36+rnd()*d*.72;put(['roof_unit_a','roof_unit_b','roof_unit_c'][k%3],zone+'-detail',[x,c[1]+.14,z],{yaw:Math.floor(rnd()*4)*Math.PI/2});}
   for(const [n,len,x,z] of [['-z',w,c[0],c[2]-d/2],['+z',w,c[0],c[2]+d/2],['-x',d,c[0]-w/2,c[2]],['+x',d,c[0]+w/2,c[2]]]){const m=Math.max(1,Math.round(len/4)),cl=len/m;
    for(let i=0;i<m;i++){const t=-len/2+cl*(i+.5);put('hull_coping',zone+'-detail',n[1]==='z'?[x+t,c[1]+.1,z]:[x,c[1]+.1,z+t],{yaw:yawFor[n],s:[cl/4,1,1]});}}
  }
  function clad(zone,c,size,{front=true,back=true,sides=true,top=true,bottom=true,units=2,windows=false}={}){
   const [w,h,d]=size;
   if(sides){face(zone,[c[0]+w/2,c[1],c[2]],d,h,'+x',{windows});face(zone,[c[0]-w/2,c[1],c[2]],d,h,'-x',{windows});}
   if(back)face(zone,[c[0],c[1],c[2]+d/2],w,h,'+z',{windows});
   if(front)face(zone,[c[0],c[1],c[2]-d/2],w,h,'-z',{windows});
   if(top)roof(zone,[c[0],c[1]+h/2,c[2]],w,d,units);
   if(bottom)roof(zone,[c[0],c[1]-h/2,c[2]],w,d,0,true);
  }
  function trussRun(zone,a,b,k=1){const d=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],len=Math.hypot(d[0],d[1],d[2]),n=Math.max(1,Math.round(len/(8*k))),basis=along(d);
   for(let i=0;i<n;i++){const t=(i+.5)/n;put('truss',zone,[a[0]+d[0]*t,a[1]+d[1]*t,a[2]+d[2]*t],{basis,s:[len/n/8,k,k]});}}
  // Hangars: clad outside; H02 and H03 (seen from space) also get a deck, trusses and a lit mouth. The walkable H01 keeps its own interior.
  for(const g of design.hangars){const zone=g.id,own=occupied&&g.id==='H01';
   if(!own){clad(zone,[g.x,g.h/2-.2,g.z],[g.w+1.7,g.h+1.5,g.d+.8],{front:false,units:4});
    put('unit_deck',zone,[g.x,.02,g.z],{s:[g.w-1,1,g.d-1]});
    face(zone+'-in',[g.x+g.w/2-.42,g.h/2,g.z],g.d-1,g.h,'-x');face(zone+'-in',[g.x-g.w/2+.42,g.h/2,g.z],g.d-1,g.h,'+x');face(zone+'-in',[g.x,g.h/2,g.z+g.d/2-.37],g.w-1,g.h,'-z');put('pad_ring',zone,[g.x,.03,g.z+2]);
    for(let z=-g.d/2+5;z<g.d/2;z+=8)put('hangar_truss',zone,[g.x,g.h-.45,g.z+z],{s:[(g.w-1)/36,1,1]});
    for(const s of [-1,1])for(let z=-g.d/2+4;z<g.d/2-2;z+=8)put('hangar_rib',zone,[g.x+s*(g.w/2-.42),0,g.z+z],{yaw:yawFor[s>0?'-x':'+x'],s:[1,(g.h-.5)/9,1]});
    for(const [key,x,z,yaw] of [['crate_a',-13,8,0],['crate_b',-13.5,5.5,1.57],['crate_a',12.5,9,.3],['drum',11,9.5,0],['prop_container',13.5,3,-1.57],['prop_loader',9,-2,2.2]])put(key,zone,[g.x+x,0,g.z+z],{yaw});}
   // the mouth's own face: plates on the two jambs and over the opening, lit by the frame's lamps
   {const zf=g.z-g.d/2-.46,ow=own?20:g.w*.6,oh=own?7:g.h-1.5,jw=(g.w+1.7-ow-1.6)/2;
    for(const s of [-1,1])face(zone,[g.x+s*(ow/2+.8+jw/2),g.h/2-.2,zf],jw,g.h+1.5,'-z');
    face(zone,[g.x,(oh+.9+g.h+.55)/2,zf],ow+1.6,g.h+.55-oh-.9,'-z');
    for(const s of [-1,1]){lamps.push({zone,p:[g.x+s*(ow/2+.4),4.5,zf-2.5],c:[1,.8,.56],power:3.2,range:13,soft:.5});lamps.push({zone,p:[g.x+s*ow*.25,oh+.5,zf-2.2],c:[1,.86,.66],power:2.4,range:11,soft:.5});}
    if(!own){for(let z=-g.d/2+5;z<g.d/2;z+=8)for(const x of [-13.5,-4.5,4.5,13.5])lamps.push({zone,p:[g.x+x*(g.w-1)/36,g.h-3,g.z+z],c:[1,.9,.74],power:2.6,range:17,soft:.3});}}
   put('mouth_frame',zone,[g.x,0,g.z-g.d/2-.45],{yaw:yawFor['-z'],s:[(own?20:g.w*.6)/20,(own?7:g.h-1.5)/7,1]});
   for(const s of [-1,1])put('thruster',zone+'-detail',[g.x+s*(g.w/2-2),g.h+.5,g.z+g.d/2-3],{yaw:s*Math.PI/4});
  }
  for(const m of design.modules){if(inside(m.position,m.size))continue;clad('hull',m.position,m.size,{units:m.size[0]>40?7:2,windows:m.finish!=='edge'||m.size[0]>40});}
  // Radiators hanging under the service spine.
  for(let x=-36;x<=44;x+=16)put('radiator','hull',[x,-4.2,40],{s:[1,.55,1]});
  // Fuel tanks under the hangar mouths, and the three large aft pressure tanks.
  for(let i=0;i<4;i++){const x=-23+i*7,z=-39+(i%2)*2;put('tank','hull',[x,-5,z],{basis:[[0,0,1],[0,1,0],[-1,0,0]]});trussRun('hull',[x,-2.6,z],[x,.6,z],.45);}
  for(const z of [30,38,46])put('tank','hull',[68.5,6,z],{s:[16/18,4.2/2.6,4.2/2.6]});
  // Solar outriggers: trussed booms with tiled arrays; the four tall wings stand on their masts.
  for(const wing of [{x:-82,z:24,w:40,d:46},{x:93,z:34,w:38,d:36}]){const root0=wing.x<0?-48:60;
   trussRun('hull',[root0,3,wing.z],[wing.x,3,wing.z],1.1);for(const off of [-6,6])trussRun('hull',[root0,.4,wing.z+off],[wing.x,2.6,wing.z],.5);
   const nx=Math.round(wing.w/10),nz=Math.round(wing.d/10),sx=wing.w/nx,sz=wing.d/nz;
   for(let i=0;i<nx;i++)for(let j=0;j<nz;j++)put('solar','hull',[wing.x-wing.w/2+sx*(i+.5),3.5,wing.z-wing.d/2+sz*(j+.5)],{s:[sx/10,1,sz/10]});}
  for(const [x,z] of [[-60,-10],[-30,62],[34,66],[100,-6]]){trussRun('hull',[x,2,z],[x,40,z],.7);
   for(const side of [-1,1])for(let k=0;k<3;k++)put('solar','hull',[x+side*4.4,14+k*10,z-.3],{basis:[[1,0,0],[0,0,-1],[0,1,0]],s:[.7,1,1]});}
  // The large-ship collar on its boom, with two service arms.
  trussRun('hull',[77,2,25],[114,2,8],2);put('collar','hull',[114,3,2]);
  put('prop_arm','hull-detail',[103,3.2,12],{yaw:-.6,s:[.8,.8,.8]});put('prop_arm','hull-detail',[124.5,3,6],{yaw:2.6,s:[.7,.7,.7]});
  // Communications: the mast, the dish, the sensor spire, and the modelled arrays on the roofs.
  put('mast','hull',[-8,24.5,43]);put('dish','hull',[-20,21,40],{basis:[[Math.cos(.5),Math.sin(.5),0],[-Math.sin(.5),Math.cos(.5),0],[0,0,1]]});trussRun('hull',[-20,15,40],[-20,20,40],.5);
  put('mast','hull',[22,8.5,40],{s:[1.3,1.42,1.3]});for(const x of [-48,58])put('mast','hull',[x,8.5,30],{s:[.6,.9,.6]});
  put('prop_dish','hull-detail',[-40,8.5,40.5],{yaw:.7,s:[.55,.55,.55]});put('prop_antenna','hull-detail',[-27,17,33],{yaw:.3});put('prop_antenna','hull-detail',[42,8.5,41],{yaw:2,s:[.8,.8,.8]});
  for(const [x,y,z,b] of [[-47.4,5,42,[[0,1,0],[-1,0,0],[0,0,1]]],[53.4,5,42,[[0,-1,0],[1,0,0],[0,0,1]]],[-47.4,5,37,[[0,1,0],[-1,0,0],[0,0,1]]],[53.4,5,37,[[0,-1,0],[1,0,0],[0,0,1]]]])put('thruster','hull-detail',[x,y,z],{basis:b});
  put('prop_thruster','hull-detail',[3,1.2,46.2],{yaw:-Math.PI/2});put('prop_thruster','hull-detail',[-30,1.2,46.2],{yaw:-Math.PI/2});
  return out;
 }
 /* Dresses the station's exterior (built by VoidMeridian.build with {kit:true}). Returns the node, or null if the kit is not loaded. */
 function dressExterior({scene,parent,id='meridian',occupied=false,quality='medium'}){
  if(!kit||!root.VoidMeridian?.design)return null;
  try{
   const set=materials(scene,id,quality,{space:true}),full=exteriorPlan(root.VoidMeridian.design,{occupied}),exteriorLamps=full.lamps,plan=full.filter(p=>kit[p.key]&&(quality!=='low'||!/-detail$/.test(p.zone)&&!p.key.startsWith('prop_'))
    // from inside the station only the outer faces can be seen (through the windows and the hangar mouth): roofs, undersides and the other hangars' insides are left out
    &&!(occupied&&(/-(detail|in)$/.test(p.zone)||/^(roof_plate|unit_deck|pad_ring|hangar_truss|hangar_rib|crate_|drum|prop_container|prop_loader|prop_generator)/.test(p.key))));
   const node=bake(scene,parent,plan,set.materials,'station-kit-exterior',exteriorLamps);
   // Small fittings are dropped beyond 900 m, where they are smaller than a pixel.
   for(const m of node.getChildMeshes())if(/-detail$/.test(m.metadata?.zone||''))m.addLODLevel(900,null);
   node.onDisposeObservable.addOnce(()=>set.dispose());node.metadata={...node.metadata,identity:id};return node;
  }catch(error){console.warn('[VOID station kit] exterior dressing failed.',error.message);return null;}
 }

 /* The derelict station (derelict-station.js) keeps its own structure, textures and encounter layout. This adds the kit's wall plating along its
    solid side walls, modelled crates where its plain freight and cover boxes stood (same footprints, same collision) and a little abandoned service
    gear, all in the worn 'derelict' finish and lit from that station's own lamps. */
 function dressDerelict({scene,parent,walls=[],lamps=[],crates=[],quality='medium'}){
  if(!kit)return null;
  try{
   const out=[],put=(key,zone,p,yaw=0,s=[1,1,1])=>out.push({key,zone,p,yaw,s});let serial=3;
   for(const w of walls){const len=w.to-w.from;if(len<1)continue;const n=Math.max(1,Math.round(len/3)),bay=len/n,yaw=yawFor[w.normal],at=(t,y)=>w.axis==='x'?[t,y,w.fixed]:[w.fixed,y,t];
    for(let i=0;i<n;i++){const c=w.from+bay*(i+.5),k=serial++,sx=bay/2;if(k%7===3)continue;   // a missing panel here and there: the old wall shows through
     put('wall_low',w.room,at(c,0),yaw,[sx,1,1]);put(MIDS[k%MIDS.length],w.room,at(c,1.1),yaw,[sx,1,1]);
     if(w.h>3.7)put('wall_clere',w.room,at(c,2.6),yaw,[sx,(w.h-3.6)/1.4,1]);
     if(k%5!==1)put('wall_top',w.room,at(c,w.h-1),yaw,[sx,1,1]);}}
   for(const [i,c] of crates.entries()){const [w,h,d]=c.size,wide=w>d*1.5||d>w*1.5,key=wide?'crate_b':'crate_a',turn=wide&&d>w;
    put(key,'cargo',c.p,(c.yaw||0)+(turn?Math.PI/2:0),wide?[(turn?d:w)/1.8,h/.8,(turn?w:d)/1.0]:[w/1.2,h/1.2,d/1.2]);}
   for(const [key,x,z,yaw] of [['prop_generator',15.6,-40,-Math.PI/2],['prop_cylinders',-16.6,-33,Math.PI/2],['prop_toolcart',-11,-62,.6],['prop_container',15.8,-58,-Math.PI/2],['prop_fuelpump',-12.5,-55,Math.PI/2],['drum',9.3,-24.5,0],['drum',-9.2,-25,0],['drum',8.6,-25.3,0]])put(key,'cargo',[x,0,z],yaw);
   const colours={warm:[1,.62,.3],cold:[.5,.78,1],red:[1,.14,.12]};
   const bakeLamps=lamps.map(l=>({p:l.p,c:colours[l.color]||colours.warm,power:l.color==='red'?.9:1.5,range:l.color==='red'?8:13,soft:.4}));
   const set=materials(scene,'derelict',quality),plan=out.filter(p=>kit[p.key]&&(quality!=='low'||!p.key.startsWith('prop_')));
   const node=bake(scene,parent,plan,set.materials,'station-kit-derelict',bakeLamps);
   node.onDisposeObservable.addOnce(()=>set.dispose());node.metadata={...node.metadata,identity:'derelict'};return node;
  }catch(error){console.warn('[VOID station kit] derelict dressing failed.',error.message);return null;}
 }

 // True only while the walk-in station is the scene on screen (it is kept, switched off, while its own space scene is flown).
 let aboardNode=null;
 const api={get aboard(){return !!(aboardNode&&!aboardNode.isDisposed()&&aboardNode.isEnabled());},identity,look,parseGLB,fetchAll,fetchProps,ready,materials,bake,along,interiorPlan,interiorLamps,dressInterior,exteriorPlan,dressExterior,dressDerelict,HIDDEN,yawFor,_set(k){kit=k;}};
 if(typeof module!=='undefined')module.exports=api;else root.VoidStationKit=api;
})(globalThis);
