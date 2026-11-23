/* Local-only bridge from Companion Studio transfers to the NPC import checklist.
 * No server calls, roster mutation, publishing, or automatic model registration.
 * Reuse the real Companion Studio format and the NPC glTF security checks.
 */
(function(root){
 'use strict';
 const node=typeof module==='object'&&!!module.exports;
 const studio=node?require('./vr-companion-studio.js'):root.VoidVRCompanionStudio;
 const npc=node?require('./npc-paths.js'):root.VoidNPCPaths;
 const LIMIT=15*1024*1024;
 async function inspect(file){
  if(!studio||typeof studio.unpackTransfer!=='function'||!npc||typeof npc.importDocument!=='function')
   throw Error('Companion Studio or NPC model validation is unavailable.');
  const transfer=await studio.unpackTransfer(file);
  const meta=transfer.meta;
  if(!meta||typeof meta.id!=='string'||!/^[a-z][a-z0-9-]{1,39}$/.test(meta.id)
    ||typeof meta.name!=='string'||!meta.name.trim()||meta.name.length>40)
   throw Error('Invalid companion identity.');
  const models=transfer.parts.filter(p=>p.meta.kind==='model');
  if(models.length!==1)throw Error('A companion transfer must contain exactly one model.');
  const model=models[0].blob;
  if(model.size>LIMIT)throw Error('Companion model exceeds the 15 MB NPC limit.');
  const bytes=new Uint8Array(await model.arrayBuffer());
  const gltf=npc.importDocument(bytes,'.glb');
  const motions=transfer.parts.filter(p=>p.meta.kind==='motion');
  const voices=transfer.parts.filter(p=>p.meta.kind==='voice');
  for(const p of transfer.parts)if(!['model','motion','voice'].includes(p.meta.kind))
   throw Error('Unsupported companion transfer part.');
  for(const p of motions)if(typeof p.meta.clip!=='string'||!p.meta.clip.trim())
   throw Error('Companion animation has no clip name.');
  for(const p of voices)if(!p.meta.record||typeof p.meta.record.text!=='string')
   throw Error('Companion voice recording has no matching dialogue text.');
  return {
   id:meta.id,name:meta.name,sex:meta.sex||null,about:meta.about||'',
   personality:meta.personality||{},dialogue:meta.dialogue||{},
   worldBehavior:meta.worldBehavior||null,relationships:meta.relationships||[],
   residence:meta.residence||null,roomPlan:meta.roomPlan||null,
   model,modelBytes:model.size,gltf,
   skeletonCount:(gltf.skins||[]).length,
   animationNames:(gltf.animations||[]).map((a,i)=>a.name||'animation-'+i),
   motions:motions.map(p=>({clip:p.meta.clip,name:p.meta.name||p.meta.clip,blob:p.blob})),
   voices:voices.map(p=>({record:p.meta.record,blob:p.blob})),
   localTestOnly:true,
   warnings:[...(gltf.skins||[]).length?[]:['Model has no skeleton; it cannot perform skeletal animations yet.'],
             ...(gltf.animations||[]).length||motions.length?[]:['No animations were supplied.']]
  };
 }
 const api={inspect};
 if(node)module.exports=api;else root.VoidNPCCompanionImport=api;
})(typeof globalThis!=='undefined'?globalThis:this);
