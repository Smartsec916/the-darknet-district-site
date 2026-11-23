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
  // Validate exported personality using Studio's own schema, never trust package metadata as executable content.
  const profile=studio.profile(meta);
  const validLines=new Set(Object.values(profile.dialogue).flat());
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
   throw Error('Companion voice recording has invalid dialogue metadata.');
  // A saved companion may still contain old recordings after its text was edited.
  // Keep them marked as unused rather than refusing the entire character import.
  const attachedVoices=voices.filter(p=>validLines.has(p.meta.record.text));
  const orphanVoices=voices.length-attachedVoices.length;
  return {
   id:meta.id,name:meta.name,sex:meta.sex||null,about:profile.about,
   personality:profile.personality,dialogue:profile.dialogue,
   worldBehavior:meta.worldBehavior||null,relationships:meta.relationships||[],
   residence:meta.residence||null,roomPlan:meta.roomPlan||null,
   model,modelBytes:model.size,gltf,
   skeletonCount:(gltf.skins||[]).length,
   animationNames:(gltf.animations||[]).map((a,i)=>a.name||'animation-'+i),
   motions:motions.map(p=>({clip:p.meta.clip,name:p.meta.name||p.meta.clip,blob:p.blob})),
   voices:attachedVoices.map(p=>({record:p.meta.record,blob:p.blob})),
   orphanVoiceCount:orphanVoices,
   dialogueLineCount:validLines.size,recordedLineCount:new Set(attachedVoices.map(p=>p.meta.record.text)).size,
   missingVoiceLines:[...validLines].filter(line=>!attachedVoices.some(p=>p.meta.record.text===line)),
   localTestOnly:true,
   warnings:[...(orphanVoices?['Ignored '+orphanVoices+' old voice recording(s) whose text is no longer in the personality dialogue.']:[]),
             ...(gltf.skins||[]).length?[]:['Model has no skeleton; it cannot perform skeletal animations yet.'],
             ...(gltf.animations||[]).length||motions.length?[]:['No animations were supplied.']]
  };
 }
 const api={inspect};
 if(node)module.exports=api;else root.VoidNPCCompanionImport=api;
})(typeof globalThis!=='undefined'?globalThis:this);
