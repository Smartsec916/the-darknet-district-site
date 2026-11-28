/* Local, developer-only apartment design studio. Room documents and user media live in IndexedDB. */
(function(root){
 'use strict';
 const CATALOG=[
  ['chair','Office chair','Furniture','milked/milked-office-chair.glb'],
  ['stool','Bar stool','Furniture','district-props/district-bar-stool.glb'],
  ['desk','Desk','Furniture','props/desk-medium.glb'],
  ['pothos','Pothos','Plants','milked/milked-pothos.glb'],
  ['bamboo','Bamboo','Plants','milked/milked-bamboo.glb'],
  ['cat','Lucky cat','Decor','milked/milked-lucky-cat.glb'],
  ['plush','Shark plush','Decor','milked/milked-shark-plush.glb'],
  ['ring-light','Ring light','Lighting','milked/milked-ring-light.glb'],
  ['softbox','Softbox','Lighting','milked/milked-softbox.glb'],
  ['radio','Radio','Electronics','district-props/district-radio.glb']
 ].map(([id,name,category,file])=>({id,name,category,file,origin:'Game library'}));
 const FINISHES={wall:'Walls',floor:'Floor',ceil:'Ceiling',wood:'Woodwork',fabric:'Bedding',couch:'Couch',trim:'Trim'};
 const PRESET={finishes:{wall:'#a190a5',floor:'#796873',ceil:'#736778',wood:'#a18171',fabric:'#70678b',couch:'#80708d',trim:'#a68e97'},light:'#ffc794',brightness:1.2};
 const categories=['Furniture','Plants','Decor','Lighting','Electronics','Other'];
 const localLibrary='../work/apartment-assets/';
 const privateLibrary='assets/models/apartment-library/';
 function localCatalog(rows,licensed=false){
  if(!Array.isArray(rows))return [];
  return rows.filter(r=>r&&/^[a-f0-9]{32}$/.test(r.id)&&typeof r.name==='string'&&r.name.trim()&&categories.includes(r.category))
   .map(r=>({id:'local-'+r.id,name:r.name,category:r.category,origin:licensed?'Private library':'Local GLB',
    src:licensed?privateLibrary+r.id+'.vrpak':localLibrary+r.id+'.glb'}));
 }
 const roomId=(door,slot)=>'apartment-design/'+door+'/'+slot;
 function available(A,rows,npc=false){
  return A.doors().flatMap(door=>{
   const row=rows.get(door.id),players=row?.players||[],type=A.entranceType(door,row,players);
   if(!npc&&(type==='mission'||type==='commercial'))return [];
   const units=A.propertyRecord(door,row,players).units
    .filter(u=>!u.players.length&&(npc?u.residents.length>0:!u.residents.length));
   return units.length?[{...door,slots:units.map(u=>u.slot),units}]:[];
  });
 }
 function footprint(item,dimensions){
  const [w,h,d]=dimensions.map(value=>value*item.scale),c=Math.abs(Math.cos(item.yaw)),s=Math.abs(Math.sin(item.yaw));
  return {x:item.x,z:item.z,y:item.y,w:c*w+s*d,d:s*w+c*d,h};
 }
 const overlaps=(a,b)=>Math.abs(a.x-b.x)<(a.w+b.w)/2&&Math.abs(a.z-b.z)<(a.d+b.d)/2;
 function placementProblem(b,limits,solids,routes,others){
  if(b.x-b.w/2<limits.x[0]||b.x+b.w/2>limits.x[1]||b.z-b.d/2<limits.z[0]||b.z+b.d/2>limits.z[1]||b.y<0||b.y+b.h>limits.ceil)return 'Outside the room';
  if(solids.some(s=>overlaps(b,s)&&b.y<s.y+s.h&&b.y+b.h>s.y))return 'Intersects a wall or furniture';
  if(b.y<1.9&&routes.some(r=>overlaps(b,r)))return 'Blocks a protected route or interaction';
  if(others.some(o=>overlaps(b,o)&&b.y<o.y+o.h&&b.y+b.h>o.y))return 'Intersects another placed asset';
  return '';
 }
 function guideFor(A,E,def){
  const geo=A.geo(def.style),[ox,oz]=A.ORIGIN;
  const local=pos=>({x:pos[0]-ox,z:pos[2]-oz});
  const spawn=local(def.spawn),limits={...geo.APT,ceil:A.CEIL};
  const solids=def.solids.filter(s=>!s.open).map(s=>({...local(s.position),y:s.position[1]-s.size[1]/2,w:s.size[0],h:s.size[1],d:s.size[2]}));
  const routes=[];
  const mark=(x,z)=>routes.push({x,z,w:.8,d:.8});
  function trace(points){
   for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.22));
    for(let j=0;j<=steps;j++)mark(a.x+(b.x-a.x)*j/steps,a.z+(b.z-a.z)*j/steps);
   }
  }
  trace([spawn,{x:geo.APT.door.x,z:geo.APT.door.z+.14}]);
  function reserveApproach(x,z){
   const path=E.gridRoute({x:def.spawn[0],z:def.spawn[2]},{x,z},def.solids,{radius:.38,pad:2});
   if(path)trace([spawn,...path.map(p=>({x:p.x-ox,z:p.z-oz}))]);
  }
  for(const item of def.interactions)reserveApproach(item.position[0],item.position[2]);
  for(let index=0;index<Math.max(2,def.residents?.length||0);index++){
   const spot=A.residenceSpot(def.style,index);
   if(spot)reserveApproach(spot[0]+ox,spot[1]+oz);
  }
  return {limits,solids,routes};
 }
 if(typeof module==='object'&&module.exports){module.exports={CATALOG,localCatalog,roomId,available,footprint,placementProblem,guideFor};return;}
 const el=(tag,text)=>{const node=document.createElement(tag);if(text)node.textContent=text;return node;};
 const field=(name,control)=>{const label=el('label');label.append(el('span',name),control);return label;};
 const button=(label,run)=>{const b=el('button',label);b.type='button';b.onclick=run;return b;};
 const option=(text,value)=>new Option(text,value);
 const fileInput=accept=>{const input=el('input');input.type='file';input.accept=accept;return input;};
 const currentZone=()=>root.VoidBabylon?.zone;
 let dbPromise,session,view,reopen,noticed=false;
 const A=()=>root.VoidApartments;
 const tools=()=>VoidDevTools;
 const owner=()=>root.VoidAccount?.user?.uid||null;
 function db(){
  return dbPromise??=new Promise((resolve,reject)=>{
   const request=indexedDB.open('void-runner-apartment-editor',1);
   request.onupgradeneeded=()=>{for(const store of ['rooms','assets'])request.result.createObjectStore(store);};
   request.onsuccess=()=>resolve(request.result);
   request.onerror=()=>{dbPromise=null;reject(request.error);};
  });
 }
 async function record(store,uid,id,value){
  const database=await db(),write=value!==undefined,key=[uid,id];
  return new Promise((resolve,reject)=>{
   const transaction=database.transaction(store,write?'readwrite':'readonly'),object=transaction.objectStore(store);
   const request=write?object.put(value,key):id==null?object.getAll(IDBKeyRange.bound([uid,''],[uid,'\uffff'])):object.get(key);
   transaction.oncomplete=()=>resolve(request.result);
   transaction.onabort=()=>reject(transaction.error||Error('Apartment storage could not finish.'));
  });
 }
 const fresh=()=>({version:1,finishes:{},light:null,brightness:1,props:[],music:null,musicLevel:.6});
 function setStatus(panel,text,error=false){const p=panel.querySelector('[role="status"]');p.textContent=text;p.dataset.error=String(error);}
 const attempt=(panel,run)=>async event=>{try{await run(event);}catch(error){setStatus(panel,error.message,true);}};
 async function addresses(uid){
  const registry=await A().readAddressRegistry({
   shipped:root.VoidMainStory?.trees?.()||[],cached:root.VoidLiveContent?.env||{},
   readLive:()=>root.VoidNetwork.request('live-content'),
   readDraft:()=>tools().request('developer/drafts/mission-editor-workspace'),
   readLocal:()=>root.VoidMissionEditor?.local?.(),
   readProperties:()=>tools().request('developer/properties')
  });
  if(uid!==owner()||!tools().authorized)throw Error('Developer account changed.');
  if(!registry.complete)throw Error('Could not verify all mission and property reservations. Retry the address lookup.');
  return registry.rows;
 }
 function render(host){
  if(!document.getElementById('apartment-editor-style')){
   const style=el('link');style.id='apartment-editor-style';style.rel='stylesheet';style.href='void-runner/apartment-editor.css';document.head.append(style);
  }
  const panel=el('section');panel.className='apt-editor-browser';host.append(panel);
  panel.append(el('h3','Apartment Editor'),el('p','Choose a vacant apartment or an NPC home. Designs and imported files are saved in this browser.'));
  const type=el('select'),resident=el('select'),district=el('select'),door=el('select'),unit=el('select'),note=el('p');note.role='status';
  resident.setAttribute('aria-label','NPC home');
  const residentField=field('NPC home',resident);residentField.hidden=true;
  type.append(option('Vacant apartments','vacant'),option('NPC homes','npc'));
  let rows,doors=[],chosen;
  const go=button('Go to street door',attempt(panel,async()=>{
   go.disabled=true;
   try{await start(chosen,Number(unit.value),type.value==='npc');}finally{go.disabled=false;}
  }));
  panel.append(field('Apartment type',type),residentField,field('Neighborhood',district),field('Street entrance',door),field('Apartment number',unit),go,note);
  const syncResident=()=>{if(type.value==='npc')resident.value=chosen?roomId(chosen.id,Number(unit.value)):'';};
  function units(){
   chosen=doors.find(d=>d.id===door.value);
   unit.replaceChildren(...(chosen?.units||[]).map(u=>option([u.number,...u.residents.map(r=>r.name)].join(' · '),String(u.slot))));
   go.disabled=!chosen;syncResident();
  }
  function entrances(){
   door.replaceChildren(...doors.filter(d=>d.quarter===district.value).map(d=>option(d.name+' · '+d.number,d.id)));units();
  }
  district.onchange=entrances;door.onchange=units;unit.onchange=syncResident;
  resident.onchange=()=>{
   const home=doors.find(d=>d.units.some(u=>roomId(d.id,u.slot)===resident.value));
   if(!home)return;
   const id=resident.value;
   district.value=home.quarter;entrances();door.value=home.id;units();
   unit.value=String(home.units.find(u=>roomId(home.id,u.slot)===id).slot);syncResident();
  };
  function filterHomes(){
   if(!rows)return;
   const npc=type.value==='npc';
   doors=available(A(),rows,npc);
   residentField.hidden=!npc;
   if(npc){
    const homes=doors.flatMap(d=>d.units.map(u=>option(u.residents.map(r=>r.name).join(', ')+' · '+u.number,roomId(d.id,u.slot))));
    homes.sort((a,b)=>a.text.localeCompare(b.text));resident.replaceChildren(...homes);
   }
   const quarters=[...new Set(doors.map(d=>d.quarter))];
   district.replaceChildren(...quarters.map(q=>option(root.VoidNeoChinatown?.quarter?.(q)?.name||q.replaceAll('-',' '),q)));
   entrances();setStatus(panel,doors.length?'':npc?'No NPCs have an editable home assigned.':'No vacant apartments were found.');
  }
  type.onchange=filterHomes;
  const load=attempt(panel,async()=>{
   go.disabled=true;setStatus(panel,'Checking available street entrances…');
   rows=await addresses(owner());if(panel.isConnected)filterHomes();
  });
  panel.append(button('Refresh addresses',load));load();
 }
 async function start(door,slot,npc){
  const uid=owner();
  if(!uid||!door||!A().geo(door.style).HALL.slots.some(s=>s.i===slot))throw Error('Choose an available apartment.');
  const unit=available(A(),await addresses(uid),npc).find(d=>d.id===door.id)?.units.find(u=>u.slot===slot);
  if(!unit)throw Error('This apartment is no longer available for editing.');
  const id=roomId(door.id,slot),design=await record('rooms',uid,id)||fresh(),assets=await record('assets',uid,null);
  const library=new Map();
  try{
   const response=await fetch('void-runner/'+privateLibrary+'catalog.json');
   if(response.ok)for(const asset of localCatalog(await response.json(),true))library.set(asset.id,asset);
  }catch{}
  if(['localhost','127.0.0.1','[::1]'].includes(location.hostname)){
   try{const response=await fetch('work/apartment-assets/catalog.json');if(response.ok)for(const asset of localCatalog(await response.json()))library.set(asset.id,asset);}catch{}
  }
  const target={id,key:npc?A().residenceKey(door.id,slot):id,door:door.id,residenceSlot:slot,number:unit.number,style:door.style,items:[],residents:unit.residents.map(r=>r.id)};
  const result=await root.VoidDevTest.session({kind:'apartment-editor',banner:'APARTMENT EDITOR · '+door.name+' / '+target.number,leave:'Exit Apartment Editor',
   build(){const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;s.story.flags.districtBadge=true;return s;},
   async enter(){
    session={id,uid,target,design,assets:[...CATALOG,...library.values(),...assets],nodes:new Map(),selected:null,placement:null};
    A().setPreview(target);noticed=false;
    const at=A().editorDoorPoint(door,door.front);
    await enterWalking(door.scene||root.VoidDistrictArea.KEY.street,{quarter:door.quarter,spawn:[at.x,1.7,at.z],yaw:Math.atan2(door.x-door.front[0],door.z-door.front[1])});
    if(mode!=='walking')throw Error('The street entrance could not be loaded.');
    announce('Enter '+door.name+' and walk to apartment '+target.number+'.');
   }
  });
  if(result.error||result.problem){A().setPreview(null);session=null;throw Error(result.error||result.problem);}
 }
 function stopMusic(s){
  s.musicRun=(s.musicRun||0)+1;
  if(!s.audio)return;
  const {element,node,gain,url}=s.audio;s.audio=null;
  element.pause();element.removeAttribute('src');element.load();node.disconnect();gain.disconnect();URL.revokeObjectURL(url);
 }
 async function playMusic(s){
  stopMusic(s);
  if(!s.design.music)return;
  const bus=root.VoidAudio?.bus('music');
  if(!bus)throw Error('Enable game audio to play this track.');
  const run=s.musicRun;
  await bus.context.resume();
  if(session!==s||run!==s.musicRun||!s.room||walkingLocation?.inst!==s.target.key)return;
  const url=URL.createObjectURL(s.design.music),element=new Audio(url);
  element.loop=true;
  const node=bus.context.createMediaElementSource(element),gain=bus.context.createGain();
  gain.gain.value=s.design.musicLevel;node.connect(gain);gain.connect(bus.node);
  s.audio={element,node,gain,url};
  try{await element.play();}catch(error){if(s.audio?.element===element)stopMusic(s);throw error;}
 }
 function disposeRoom(s){
  s.generation=(s.generation||0)+1;
  for(const item of s.nodes.values()){item.root.dispose(false,true);item.container.dispose();}
  s.marker?.dispose(false,true);s.marker=null;
  if(s.location)s.location.solids=s.location.solids.filter(o=>!o.editorPlacement);
  s.nodes.clear();s.room=null;s.selected=null;s.placement=null;stopMusic(s);
  view?.remove();view=null;reopen?.remove();reopen=null;
 }
 async function model(s,item){
  const asset=s.assets.find(a=>a.id===item.asset),scene=root.VoidBabylon.scene,generation=s.generation;
  if(!asset)throw Error('An imported model is missing from this browser.');
  const file=asset.file||'imported-apartment-prop.glb',localBuffer=asset.blob?await asset.blob.arrayBuffer():undefined;
  if(s.generation!==generation)return;
  const c=await root.VoidAssets.loadContainer({src:asset.src||'assets/models/'+file,localBuffer},scene,null,'apartment-editor:'+asset.id);
  if(s.generation!==generation||!s.design.props.includes(item)){c.dispose();return;}
  const B=root.BABYLON,node=new B.TransformNode('apartment-placement-'+item.id,scene);
  const inst=c.instantiateModelsToScene(name=>'apartment-editor-'+name,true,{doNotInstantiate:true});
  root.VoidAssets.ownInstance?.(inst,node);
  const inner=new B.TransformNode('apartment-placement-center',scene);inner.parent=node;
  for(const n of inst.rootNodes)n.parent=inner;
  const bounds=inner.getHierarchyBoundingVectors(true);
  const dimensions=bounds.max.subtract(bounds.min).asArray();
  if(dimensions.some(n=>!Number.isFinite(n)||n<0)||Math.max(...dimensions)<.01){node.dispose(false,true);c.dispose();throw Error('The GLB has no usable mesh bounds.');}
  inner.position.set(-(bounds.min.x+bounds.max.x)/2,-bounds.min.y,-(bounds.min.z+bounds.max.z)/2);
  for(const mesh of node.getChildMeshes())mesh.isPickable=false;
  const colors=new Map();
  for(const mesh of node.getChildMeshes()){
   const m=mesh.material;
   for(const material of m?.subMaterials||[m]){
    const property=material?.albedoColor?'albedoColor':material?.diffuseColor?'diffuseColor':null;
    if(property&&!colors.has(material))colors.set(material,{property,base:material[property].clone()});
   }
  }
  s.nodes.set(item.id,{root:node,container:c,dimensions,colors});
  transform(s,item);
 }
 function transform(s,item){
  const entry=s.nodes.get(item.id);if(!entry)return;
  const B=root.BABYLON,[ox,oz]=A().ORIGIN;
  entry.root.position.set(ox+item.x,item.y,oz+item.z);entry.root.rotation.y=item.yaw;entry.root.scaling.setAll(item.scale);
  const tint=item.tint&&B.Color3.FromHexString(item.tint);
  for(const [m,{property,base}] of entry.colors)m[property]=tint?base.multiply(tint):base.clone();
 }
 function allBounds(s){return s.design.props.flatMap(item=>{const n=s.nodes.get(item.id);return n?[{id:item.id,...footprint(item,n.dimensions)}]:[];});}
 function issue(s,box,all){return placementProblem(box,s.guide.limits,s.guide.solids,s.guide.routes,all.filter(o=>o.id!==box.id));}
 function syncProps(s,boxes){
  const [ox,oz]=A().ORIGIN;
  s.location.solids=s.location.solids.filter(o=>!o.editorPlacement);
  for(const box of boxes){
   if(box.id===s.placement||box.y>=1.9||issue(s,box,boxes))continue;
   s.location.solids.push({id:box.id,editorPlacement:true,position:[ox+box.x,box.y+box.h/2,oz+box.z],size:[box.w,box.h,box.d]});
  }
 }
 function placeMarker(s,box,blocked){
  if(!box){s.marker?.setEnabled(false);return;}
  const B=root.BABYLON,scene=root.VoidBabylon.scene,[ox,oz]=A().ORIGIN;
  if(!s.marker){
   const marker=B.MeshBuilder.CreateGround('apartment-placement-guide',{width:1,height:1},scene);
   const material=new B.StandardMaterial('apartment-placement-guide',scene);
   material.disableLighting=true;material.alpha=.4;marker.material=material;marker.isPickable=false;
   s.marker=marker;
  }
  s.marker.setEnabled(true);
  s.marker.material.emissiveColor=B.Color3.FromHexString(blocked?'#ff4355':'#75f0d3');
  s.marker.position.set(ox+box.x,.016,oz+box.z);s.marker.scaling.set(box.w,1,box.d);
 }
 function mapDraw(s,map){
  const ctx=map.getContext('2d'),{limits,solids,routes}=s.guide,[x0,x1]=limits.x,[z0,z1]=limits.z;
  const sx=map.width/(x1-x0),sz=map.height/(z1-z0);
  const rect=(b,c)=>{ctx.fillStyle=c;ctx.fillRect((b.x-b.w/2-x0)*sx,(z1-b.z-b.d/2)*sz,b.w*sx,b.d*sz);};
  ctx.fillStyle='#24313b';ctx.fillRect(0,0,map.width,map.height);
  for(const r of routes)rect(r,'#a65057');
  for(const b of solids)rect(b,'#702e39');
  const boxes=allBounds(s);
  for(const b of boxes)rect(b,issue(s,b,boxes)?'#ff4355':b.id===s.selected?'#75f0d3':'#5897aa');
 }
 async function importModel(s,file,category,origin){
  if(!file||!file.name.toLowerCase().endsWith('.glb'))throw Error('Choose a Blender or Meshy GLB export.');
  const header=new DataView(await file.slice(0,20).arrayBuffer());
  if(header.byteLength!==20||header.getUint32(0,true)!==0x46546c67||header.getUint32(4,true)!==2||header.getUint32(8,true)!==file.size||
     header.getUint32(16,true)!==0x4e4f534a||header.getUint32(12,true)>file.size-20)throw Error('This file is not a complete GLB version 2 model.');
  const json=JSON.parse(await file.slice(20,20+header.getUint32(12,true)).text());
  if([...(json.buffers||[]),...(json.images||[])].some(entry=>entry.uri&&!entry.uri.startsWith('data:')))throw Error('Export a self-contained GLB with embedded textures.');
  const asset={id:'import-'+crypto.randomUUID(),name:file.name.slice(0,-4),category,origin,blob:file};
  await record('assets',s.uid,asset.id,asset);s.assets.push(asset);
  return asset;
 }
 function cameraRoom(s){
  const panel=el('section');panel.id='apartment-editor-room';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Apartment Editor');
  const title=el('h2','Apartment '+s.target.number),note=el('p');note.role='status';
  const map=el('canvas');map.width=320;map.height=225;map.setAttribute('aria-label','Apartment floor plan. Red marks reserved clearance.');
  const search=el('input');search.type='search';search.placeholder='Search assets';
  const category=el('select');category.append(option('All categories',''),...categories.map(c=>option(c,c)));
  const source=el('select');source.append(option('All sources',''),...['Game library','Private library','Blender / Higgsfield','Meshy','Local GLB'].map(x=>option(x,x)));
  const finder=el('select');finder.size=5;finder.setAttribute('aria-label','Asset Finder results');
  const props=el('select'),controls=el('div');controls.className='apt-editor-fields';
  const apply=()=>{s.room.decorate(s.design);mapDraw(s,map);};
  function filter(preferred){
   const q=search.value.toLowerCase().trim(),old=preferred||finder.value;
   finder.replaceChildren(...s.assets.filter(a=>(!category.value||a.category===category.value)&&(!source.value||a.origin===source.value)&&a.name.toLowerCase().includes(q))
    .map(a=>option(a.name+' · '+a.category,a.id)));
   if([...finder.options].some(o=>o.value===old))finder.value=old;
   else if(finder.options.length)finder.selectedIndex=0;
  }
  function repaint(){
   mapDraw(s,map);
   const item=s.design.props.find(p=>p.id===s.selected),bounds=allBounds(s);
   const box=bounds.find(b=>b.id===s.selected),problem=box&&issue(s,box,bounds);
   syncProps(s,bounds);placeMarker(s,box,!!problem);
   if(item)setStatus(panel,problem||(box?'Placement clear':'Loading model…'),!!problem);
  }
  function pick(id){
   s.selected=id;
   props.replaceChildren(option('Select a placed asset',''),...s.design.props.map(p=>option(s.assets.find(a=>a.id===p.asset)?.name||'Missing model',p.id)));
   props.value=id||'';controls.replaceChildren();
   const item=s.design.props.find(p=>p.id===id);if(!item)return repaint();
   const number=(label,key,step,min,max,factor=1)=>{
    const i=el('input');i.type='number';i.step=step;i.min=min;i.max=max;i.value=Math.round(item[key]*factor*1000)/1000;
    i.onchange=()=>{if(!i.checkValidity()||i.value===''){i.value=item[key]*factor;return;}item[key]=i.valueAsNumber/factor;transform(s,item);repaint();};
    return field(label,i);
   };
   const color=el('input');color.type='color';color.value=item.tint||'#ffffff';color.oninput=()=>{item.tint=color.value;transform(s,item);};
   controls.append(number('X, m','x','any',-10,10),number('Z, m','z','any',-10,10),number('Height, m','y','any',0,3),
    number('Rotation, degrees','yaw',1,-360,360,180/Math.PI),number('Scale','scale',.01,.05,5),field('Asset tint',color),
    button('Reset tint',()=>{item.tint=null;color.value='#ffffff';transform(s,item);}),
    button(s.placement?'Finish placement':'Move on map',()=>{s.placement=s.placement?null:item.id;pick(item.id);}),
    button('Remove asset',()=>{s.placement=null;s.design.props=s.design.props.filter(p=>p!==item);const n=s.nodes.get(item.id);if(n){n.root.dispose(false,true);n.container.dispose();s.nodes.delete(item.id);}pick(null);setStatus(panel,'Asset removed.');}));
   repaint();
  }
  props.onchange=()=>{s.placement=null;pick(props.value);};
  map.onpointermove=e=>{
   if(!s.placement)return;
   const box=map.getBoundingClientRect(),{x,z}=s.guide.limits,item=s.design.props.find(p=>p.id===s.placement);
   item.x=x[0]+(x[1]-x[0])*(e.clientX-box.left)/box.width;item.z=z[1]-(z[1]-z[0])*(e.clientY-box.top)/box.height;
   transform(s,item);repaint();
  };
  map.onclick=()=>{if(s.placement){const id=s.placement;s.placement=null;pick(id);}};
  for(const input of [search,category,source])input.oninput=()=>filter();
  const place=button('Place selected asset',attempt(panel,async()=>{
   if(!finder.value||s.placement)return;
   const item={id:crypto.randomUUID(),asset:finder.value,x:0,y:0,z:0,yaw:0,scale:1,tint:null};
   s.design.props.push(item);s.placement=item.id;pick(item.id);
   try{await model(s,item);}catch(error){s.design.props=s.design.props.filter(p=>p!==item);s.placement=null;pick(null);throw error;}
   if(s.room)setStatus(panel,'Move over the floor plan and click to place the asset.');
  }));
  const modelFile=fileInput('.glb'),kind=el('select'),origin=el('select');
  kind.append(...categories.map(c=>option(c,c)));
  origin.append(...['Blender / Higgsfield','Meshy','Local GLB'].map(c=>option(c,c)));
  const importer=el('details');importer.append(el('summary','Import a Blender or Meshy asset'),
   el('p','Create the prop in Blender with the Higgsfield panel or in Meshy. Export a self-contained GLB with embedded textures, then add it to this browser’s Asset Finder.'));
  const meshy=el('a','Open Meshy');meshy.href='https://www.meshy.ai/';meshy.target='_blank';meshy.rel='noopener noreferrer';
  const higgsfield=el('a','Open Higgsfield');higgsfield.href='https://higgsfield.ai/';higgsfield.target='_blank';higgsfield.rel='noopener noreferrer';
  importer.append(higgsfield,meshy,field('Source',origin),field('Category',kind),field('GLB file',modelFile),
   button('Add to Asset Finder',attempt(panel,async()=>{const a=await importModel(s,modelFile.files[0],kind.value,origin.value);search.value=category.value=source.value='';filter(a.id);modelFile.value='';setStatus(panel,a.name+' added.');})));
  const finishes=el('details'),finishControls=new Map(),light=el('input'),brightness=el('input');
  light.type='color';light.value=s.design.light||'#ffffff';light.oninput=()=>{s.design.light=light.value;apply();};
  brightness.type='range';brightness.min=0;brightness.max=2;brightness.step=.05;brightness.value=s.design.brightness;brightness.oninput=()=>{s.design.brightness=brightness.valueAsNumber;apply();};
  finishes.append(el('summary','Finishes and lighting'),button('VR bedroom-inspired palette',()=>{Object.assign(s.design,structuredClone(PRESET));for(const [key,i] of finishControls)i.value=s.design.finishes[key];light.value=s.design.light;brightness.value=s.design.brightness;apply();}),
   field('Light color',light),field('Brightness',brightness));
  for(const [key,label] of Object.entries(FINISHES)){
   const i=el('input');i.type='color';i.value=s.design.finishes[key]||s.room.finishColor(key)||'#ffffff';i.oninput=()=>{s.design.finishes[key]=i.value;apply();};
   finishControls.set(key,i);finishes.append(field(label,i));
  }
  finishes.append(button('Restore original finishes and lights',()=>{Object.assign(s.design,{finishes:{},light:null,brightness:1});apply();for(const [key,i] of finishControls)i.value=s.room.finishColor(key)||'#ffffff';light.value='#ffffff';brightness.value=1;}));
  const music=el('details'),musicFile=fileInput('audio/*,.mp3,.wav,.ogg,.flac,.m4a'),track=el('p',s.design.music?.name||'No track selected'),level=el('input');
  level.type='range';level.min=0;level.max=1;level.step=.05;level.value=s.design.musicLevel;level.oninput=()=>{s.design.musicLevel=level.valueAsNumber;if(s.audio)s.audio.gain.gain.value=s.design.musicLevel;};
  musicFile.onchange=attempt(panel,async()=>{const file=musicFile.files[0];if(!file)return;stopMusic(s);s.design.music=file;track.textContent=file.name;await playMusic(s);});
  music.append(el('summary','Apartment music'),track,field('Riffusion audio export',musicFile),field('Music volume',level),
   button('Play track',attempt(panel,()=>playMusic(s))),button('Stop',()=>stopMusic(s)),button('Remove track',()=>{stopMusic(s);s.design.music=null;musicFile.value='';track.textContent='No track selected';}));
  const save=button('Save apartment',attempt(panel,async()=>{
   if(s.placement)throw Error('Click the floor plan to finish placing the current asset.');
   const boxes=allBounds(s);
   if(boxes.length!==s.design.props.length)throw Error('Wait for every model to load, or remove the unavailable model.');
   if(boxes.some(b=>issue(s,b,boxes)))throw Error('Move the red assets before saving.');
   await record('rooms',s.uid,s.id,structuredClone(s.design));setStatus(panel,'Apartment saved in this browser.');
  }));
  save.className='apt-save';
  const header=el('div');header.className='apt-editor-heading';
  header.append(title,button('Walk room',()=>{panel.hidden=true;reopen.hidden=false;document.querySelector('#space')?.focus();}),save);
  panel.append(header,el('p','Red marks obstacles, door clearance and routes. Move assets until their marker is teal.'),map,note,
   el('h3','Asset Finder'),search,field('Category',category),field('Source',source),finder,place,importer,
   el('h3','Placed assets'),props,controls,finishes,music);
  document.body.append(panel);view=panel;
  reopen=button('Open Apartment Editor',()=>{document.exitPointerLock?.();panel.hidden=false;reopen.hidden=true;search.focus();});
  reopen.id='apartment-editor-return';reopen.hidden=true;document.body.append(reopen);
  filter();pick(null);
  return {panel,repaint};
 }
 setInterval(()=>{
  const s=session;
  if(!s)return;
  if(owner()!==s.uid||!tools().authorized||!root.VoidDevTest?.active){
   if(s.room)disposeRoom(s);A().setPreview(null);session=null;return;
  }
  const room=typeof walkingLocation!=='undefined'&&walkingLocation?.inst===s.target.key&&currentZone()?.decorate?currentZone():null;
  if(s.room&&room!==s.room)disposeRoom(s);
  if(room&&!s.room){
   s.room=room;s.location=walkingLocation;s.guide=guideFor(A(),root.VoidNPCEscort,s.location);room.decorate(s.design);
   const {panel,repaint}=cameraRoom(s);
   for(const item of s.design.props)model(s,item).then(repaint).catch(error=>setStatus(panel,error.message,true));
   if(s.design.music)playMusic(s).catch(()=>setStatus(panel,'Select Play track to start apartment music.'));
  }
  if(!noticed&&typeof walkingLocation!=='undefined'&&walkingLocation?.part==='hall'&&A().visit?.door?.id===s.target.door){
   noticed=true;announce('Enter apartment '+s.target.number+' to open the editor.');
  }
 },150);
 root.VoidApartmentEditor={render,get playing(){return !!session?.audio&&!session.audio.element.paused;}};
})(globalThis);
