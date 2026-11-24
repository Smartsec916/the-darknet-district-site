import * as motion from './rig-motion.mjs';
const {GLB,Rig,map,inspect,clipOK,bake}=motion;
const required=()=>globalThis.VoidVRCompanions?.requiredClips||GLB.basicNames;
let library,runLibrary;
export async function open(file){
 const buffer=await file.arrayBuffer();
 try{return GLB.read(buffer);}catch(error){
  if(!error.message.includes('geometry-compressed'))throw error;
  const head=new DataView(buffer),len=head.getUint32(12,true),j=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,20,len)));
  if(j.extensionsUsed?.includes('KHR_draco_mesh_compression'))throw Error('Decompress Draco geometry in Blender before editing the rig.');
  const mod=await import('./vendor/meshopt_decoder-1.3.0.js');const decoder=globalThis.MeshoptDecoder||mod.default;await decoder.ready;
  const bin=new Uint8Array(buffer,28+len),parts=[];let offset=0;
  for(const v of j.bufferViews){const e=v.extensions?.EXT_meshopt_compression;let bytes;
   if(e){if(e.buffer!==0||!Number.isSafeInteger(e.count*e.byteStride)||e.count*e.byteStride>100*1024*1024-offset)throw Error('Unsupported compressed stream size');
    bytes=new Uint8Array(e.count*e.byteStride);decoder.decodeGltfBuffer(bytes,e.count,e.byteStride,bin.subarray(e.byteOffset||0,(e.byteOffset||0)+e.byteLength),e.mode,e.filter);
    delete v.extensions.EXT_meshopt_compression;if(!Object.keys(v.extensions).length)delete v.extensions;
   }else{if(v.buffer!==0)throw Error('External GLB buffer');bytes=bin.subarray(v.byteOffset||0,(v.byteOffset||0)+v.byteLength);}
   offset=Math.ceil(offset/4)*4;parts.push([offset,bytes]);v.buffer=0;v.byteOffset=offset;v.byteLength=bytes.length;offset+=bytes.length;
  }
  for(const key of ['extensionsUsed','extensionsRequired'])if(j[key])j[key]=j[key].filter(x=>x!=='EXT_meshopt_compression');
  j.buffers=[{byteLength:offset}];const binary=new Uint8Array(offset);for(const [i,b] of parts)binary.set(b,i);return {json:j,binary,decoded:true};
 }
}
async function running(){
 if(!runLibrary)runLibrary=(async()=>{const response=await fetch(new URL('assets/models/crowd/npc-grey-reverie.glb',import.meta.url));if(!response.ok)throw Error('Run source unavailable');const doc=await open(await response.blob());return {doc,rig:map(doc)};})().catch(e=>{runLibrary=null;throw e;});
 return runLibrary;
}
async function approved(){
 if(!library)library=(async()=>{const res=await fetch(new URL('assets/models/crowd/vr-companion-f.glb',import.meta.url));if(!res.ok)throw Error('Could not load companion animation library');const doc=await open(await res.blob()),rig=map(doc);if(!rig.ready)throw Error('Unmapped donor: '+JSON.stringify(rig.ambiguous));return {doc,rig};})().catch(e=>{library=null;throw e;});
 return library;
}
const blobOf=doc=>new Blob([GLB.write(doc.json,doc.binary)],{type:'model/gltf-binary'});
export async function check(file,overrides={}){
 const doc=await open(file),rig=inspect(doc,{...doc.json.extras?.voidHumanoidMapping,...overrides});
 const clips=rig.ready?motion.validNames(doc,rig):[];
 return {doc,rig,clips,missing:required().filter(n=>!clips.includes(n))};
}
export async function repair(file,{names=null,overrides={},progress=()=>{},donor=null}={}){
 const {doc,rig,clips}=await check(file,overrides);
 if(!rig.ready)throw Error([...rig.issues,...rig.missing.map(r=>'Map '+r),...Object.keys(rig.ambiguous).map(r=>'Choose joint for '+r)].join(' · ')||'Create and bind a humanoid skeleton first.');
 const source=donor||await approved(),plan=Rig.planAliases(doc.json,rig),added=[],review=[];
 let blob=file;
 for(const role of names||[...required(),'run']){
  if(clips.includes(role))continue;progress('Checking '+role);
  const conflict=doc.json.animations?.some(a=>a.name===role);
  const alias=plan.aliases.find(a=>a.role===role);
  if(alias&&clipOK(doc,doc.json.animations[alias.index],rig,role)){
   const next=await open(blob);next.json.animations.push({...next.json.animations[alias.index],name:role});blob=blobOf(next);added.push(role);continue;
  }
  let chosen=source;if(role==='run'&&!source.doc.json.animations.some(a=>a.name===role)&&!donor?.local)chosen=await running();
  const a=chosen.doc.json.animations.find(a=>a.name===role);
  if(!a){review.push(role+' has no approved source in this library');continue;}
  try{if(!clipOK(chosen.doc,a,chosen.rig,role))throw Error('Source has insufficient joint motion');
   const frames=bake(chosen.doc,chosen.rig,a,doc,rig);
   let input=blob===file&&doc.decoded?blobOf(doc):blob;
   if(conflict){const clean=await open(input);for(const a of clean.json.animations.filter(a=>a.name===role)){
    let label=role+'-original';while(clean.json.animations.some(b=>b.name===label))label+='-copy';a.name=label;
   }input=blobOf(clean);}
   const next=await GLB.animate(input,frames,role);
   const checked=GLB.read(await next.arrayBuffer());
   if(!clipOK(checked,checked.json.animations.at(-1),rig,role))throw Error('Baked track did not pass joint motion checks');
   blob=next;added.push(role);
  }catch(e){review.push(role+' — '+e.message);}
  await new Promise(resolve=>setTimeout(resolve,0));
 }
 if(added.length||Object.keys(overrides).length){const edited=await open(blob);edited.json.extras={...edited.json.extras,voidHumanoidMapping:{...edited.json.extras?.voidHumanoidMapping,...overrides},voidAddedAnimations:[...new Set([...(edited.json.extras?.voidAddedAnimations||[]),...added])]};blob=blobOf(edited);}
 if(blob.size>GLB.TARGET&&blob!==file)throw Error('Result exceeds the 15 MiB export limit. Downsize the model first.');
 return {blob,added,review};
}
export function panel(host,{get,set,preview}){
 const box=document.createElement('section'),status=document.createElement('p'),controls=document.createElement('div'),details=document.createElement('details'),summary=document.createElement('summary');
 box.className='me-check';summary.textContent='Bone assignments and animation selection';details.append(summary,controls);status.setAttribute('role','status');
 let backup=null,overrides={},selected=null,last=null,busy=false;
 function button(label,fn){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=async()=>{if(busy)return;busy=true;try{await fn();}catch(e){status.textContent=e.message;}finally{busy=false;}};box.append(b);}
 async function display(){
  const file=get();if(!file){status.textContent='Choose a character model.';return;}if(last!==file){overrides={};backup=null;last=file;}
  const r=await check(file,overrides);if(get()!==file)return;
  controls.replaceChildren();const classification=r.rig.ready?'Fully rigged':r.rig.state==='unrigged'?'Unrigged':r.rig.issues.length?'Incorrect or unsupported rig':'Partially mapped rig';
  status.textContent=[classification+' · '+r.rig.joints.length+' joints · '+(file.size/1048576).toFixed(2)+' MiB',...r.rig.issues].join(' · ');
  for(const role of required()){const line=document.createElement('p'),ok=r.clips.includes(role);line.textContent=(ok?'Passed':r.rig.ready?'Repairable':'Requires bone mapping')+' · '+role;line.style.color=ok?'#81d49e':r.rig.ready?'#eac36f':'#ff9292';if(!ok&&r.rig.ready){const fix=document.createElement('button');fix.type='button';fix.textContent='Repair '+role;fix.onclick=async()=>{if(busy)return;busy=true;try{await apply(false,[role]);}catch(e){status.textContent=e.message;}finally{busy=false;}};line.append(fix);}controls.append(line);}
  if(!r.rig.joints.length){controls.append('Not applicable · No bound skeleton to map. Use the manual humanoid skeleton tool.');}
  const generated=r.doc.json.extras?.voidAddedAnimations||[];
  for(const name of generated){const remove=document.createElement('button');remove.type='button';remove.textContent='Remove '+name;
   remove.onclick=async()=>{if(busy||get()!==file)return;busy=true;try{const doc=await open(file);doc.json.animations=doc.json.animations.filter(a=>a.name!==name);doc.json.extras.voidAddedAnimations=generated.filter(n=>n!==name);
    backup=file;await set(blobOf(doc));last=get();await display();}catch(e){status.textContent=e.message;}finally{busy=false;}};controls.append(remove);}

  for(const role of Rig.roles){const label=document.createElement('label'),s=document.createElement('select');label.textContent=role;s.add(new Option('Choose a joint',''));for(const b of r.rig.joints)s.add(new Option(b.name||'Joint '+b.index,String(b.index)));s.value=String(r.rig.mapping[role]??'');s.onchange=()=>{if(s.value)overrides[role]=Number(s.value);else delete overrides[role];display().catch(e=>status.textContent=e.message);};label.append(s);controls.append(label);}
 }
 async function available(all){
  const sources=[await approved()];if(!all)return sources;
  const run=await running();sources.push({...run,doc:{...run.doc,json:{...run.doc.json,animations:run.doc.json.animations.filter(a=>a.name==='run')}}});
  for(const m of globalThis.VoidVRCompanionStudio?.exportableMotionSources?.()||[]){
   try{const doc=await open(m.blob),rig=map(doc);
    if(rig.ready)sources.push({local:true,rig,doc:{...doc,json:{...doc.json,animations:doc.json.animations.filter(a=>a.name===m.clip)}}});
   }catch(e){status.textContent='Review '+m.name+' · '+e.message;}
  }
  return sources;
 }
 async function apply(all,only=null){
  const file=get();if(!file)throw Error('Choose a GLB first');const sources=await available(all);
  let blob=file;const reports=[];
  if(!all&&!only){const model=await open(blob),rig=map(model);
   if(rig.state==='unrigged'&&!model.json.skins?.length&&!model.json.animations?.length){
    const result=await GLB.rig(model.decoded?blobOf(model):blob);blob=result.blob;reports.push('Created an approximate humanoid skeleton. Review joint placement.');
   }
  }
  for(const source of sources){const names=all?source.doc.json.animations.map(a=>a.name).filter(n=>selected===null||selected.has(n)):only;
   const result=await repair(blob,{names,overrides,donor:source,progress:m=>status.textContent=m});blob=result.blob;reports.push(...result.added.map(n=>'Added '+n),...result.review);if(!all)break;}
  if(get()!==file||!box.isConnected)throw Error('Character changed. Run inspection again.');
  if(blob!==file){backup=file;await set(blob);last=get();}
  await display();status.textContent+=' · '+(reports.join(' · ')||'All selected clips already present.');
 }
 button('Auto-Fix All',()=>apply(false));button('Add All Compatible Animations',()=>apply(true));
 button('Select animations',async()=>{const sources=await available(true);selected=new Set();for(const source of sources)for(const a of source.doc.json.animations){const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.checked=true;selected.add(a.name);input.onchange=()=>input.checked?selected.add(a.name):selected.delete(a.name);label.append(input,a.name);controls.append(label);}details.open=true;});
 button('Preview repaired character',async()=>{
  const file=get(),view=await preview(file);if(!view)return;
  box.querySelector('[data-rig-playback]')?.remove();
  const bar=document.createElement('div');bar.dataset.rigPlayback='';box.append(bar);
  const select=document.createElement('select');select.setAttribute('aria-label','Repaired animation');for(const name of view.clips)select.add(new Option(name,name));bar.append(select);
  function field(title,type,value){const label=document.createElement('label'),input=document.createElement('input');input.type=type;label.append(title,input);bar.append(label);if(type==='checkbox')input.checked=value;else input.value=value;return input;}
  const loop=field('Loop','checkbox',true),speed=field('Playback speed','number','1');speed.min='.05';speed.max='3';speed.step='.05';
  const seek=field('Timeline','range',0);seek.min=0;seek.max=1;seek.step='.005';
  const play=()=>view.play(select.value,Math.min(3,Math.max(.05,+speed.value||1)),loop.checked);
  for(const [title,fn] of [['Play',play],['Pause',()=>view.scene.animationGroups.filter(g=>g.isPlaying).forEach(g=>g.pause())]]){
   const b=document.createElement('button');b.type='button';b.textContent=title;b.onclick=fn;bar.append(b);
  }
  select.onchange=loop.onchange=play;speed.onchange=()=>view.setSpeed(+speed.value||1);seek.oninput=()=>{const g=view.scene.animationGroups.find(g=>g.name===select.value||g.name.endsWith('-'+select.value));if(g){if(!g.isStarted)play();g.pause();g.goToFrame(g.from+(g.to-g.from)*Number(seek.value));}};
  const grid=field('Ground grid','checkbox',true);view.showGrid?.(true);grid.onchange=()=>view.showGrid?.(grid.checked);
  const skeleton=field('Show bone mapping','checkbox',false),overlay=[];
  skeleton.onchange=async()=>{
   overlay.splice(0).forEach(mesh=>mesh.dispose());if(!skeleton.checked)return;
   const r=await check(file,overrides),mapped=new Set(Object.values(r.rig.mapping).map(i=>r.doc.json.nodes[i].name)),ambiguous=new Set(Object.values(r.rig.ambiguous).flat().map(i=>r.doc.json.nodes[i].name)),B=globalThis.BABYLON;
   for(const sk of view.container?.skeletons||[])for(const bone of sk.bones){const node=bone.getTransformNode?.();if(!node)continue;
    const sphere=B.MeshBuilder.CreateSphere('mapping-'+bone.name,{diameter:.019,segments:4},view.scene);sphere.parent=node;
    const world=node.computeWorldMatrix(true),sc=new B.Vector3();world.decompose(sc);sphere.scaling.set(1/Math.max(.001,Math.abs(sc.x)),1/Math.max(.001,Math.abs(sc.y)),1/Math.max(.001,Math.abs(sc.z)));
    const mat=new B.StandardMaterial('joint-status',view.scene);mat.disableLighting=true;mat.emissiveColor=B.Color3.FromHexString(mapped.has(bone.name)?'#42df8c':ambiguous.has(bone.name)?'#ffb341':'#8e939c');
    sphere.material=mat;sphere.isPickable=false;sphere.renderingGroupId=2;sphere.onDisposeObservable.addOnce(()=>mat.dispose());overlay.push(sphere);
   }
  };if(select.value)play();
 });button('Undo rig repair',async()=>{if(!backup)throw Error('No repair to undo');await set(backup);backup=null;await display();});
 button('Inspect rig',display);box.append(status,details);host.append(box);if(get())display().catch(e=>status.textContent=e.message);return display;
}
