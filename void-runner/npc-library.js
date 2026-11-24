/* Local asset metadata shared by the NPC Importer and Library. */
(function(root){
 'use strict';
 const fold=value=>String(value||'').normalize('NFKC').trim().toLowerCase();
 function availableName(base,existing,limit=60){
  const used=new Set(existing.map(fold)), name=base.trim().slice(0,limit)||'Neon Vale';
  if(!used.has(fold(name)))return name;
  for(let i=2;;i++){const suffix=' '+i, candidate=name.slice(0,limit-suffix.length)+suffix;if(!used.has(fold(candidate)))return candidate;}
 }
 function referenced(data,ids){
  if(typeof data==='string')return ids.has(data);
  if(!data||typeof data!=='object')return false;
  return Object.entries(data).some(([k,v])=>ids.has(k)||referenced(v,ids));
 }
 async function digest(buffer){
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',buffer)),n=>n.toString(16).padStart(2,'0')).join('');
 }
 async function inspect(buffer,doc){
  const skins=doc.skins||[],primitives=doc.meshes.flatMap(m=>m.primitives);
  const attributes=primitives.map(p=>Object.keys(p.attributes).sort().map(k=>[k,doc.accessors[p.attributes[k]].count]));
  const bones=skins.map(s=>s.joints.map(i=>doc.nodes[i].name||''));
  const bytes=new Uint8Array(buffer),view=new DataView(buffer);
  const isGlb=bytes.length>=28&&view.getUint32(0,true)===0x46546c67;
  const bin=isGlb?28+view.getUint32(12,true):null;
  const hashes=new Map();
  async function viewHash(index){
   if(bin==null||index==null)return null;
   if(hashes.has(index))return hashes.get(index);
   const v=doc.bufferViews?.[index];if(!v||v.buffer!==0||!Number.isInteger(v.byteLength))return null;
   const start=bin+(v.byteOffset||0);if(start+v.byteLength>bytes.length)return null;
   const hash=digest(bytes.subarray(start,start+v.byteLength));hashes.set(index,hash);return hash;
  }
  const positions=await Promise.all(primitives.map(p=>viewHash(doc.accessors[p.attributes.POSITION]?.bufferView)));
  const images=await Promise.all((doc.images||[]).map(i=>viewHash(i.bufferView)));
  return {sha256:await digest(buffer),shape:JSON.stringify([attributes,bones]),positions:positions.every(Boolean)?positions.join():null,images:images.length&&images.every(Boolean)?images.join():null,materials:(doc.materials||[]).length,
   textures:(doc.textures||[]).length,rigged:skins.length>0&&primitives.some(p=>p.attributes.WEIGHTS_0!=null),
   clips:(doc.animations||[]).map(a=>a.name||'(unnamed)')};
 }
 function match(a,b){
  if(!a||!b)return '';
  if(a.sha256===b.sha256)return 'Identical model bytes';
  if(a.positions&&a.positions===b.positions&&a.images&&a.images===b.images)return 'Matching position buffers and textures';
  if(a.images&&a.images===b.images)return 'Matching texture files';
  if(a.shape===b.shape)return 'Similar geometry counts and skeleton';
  return '';
 }
 const api={fold,availableName,referenced,inspect,match};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.VoidNPCLibrary=api;
})(globalThis);
