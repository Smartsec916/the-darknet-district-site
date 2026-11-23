/* Reusable, side-effect-free ElevenLabs missing-line planner for NPC dialogue.
 * No network request and no billing. Generation requires a separate authorized
 * user action and authenticated backend. Issue #520.
 */
(function(root){
 'use strict';
 const isNode=typeof module==='object'&&!!module.exports;
 const Studio=isNode?require('./vr-companion-studio.js'):root.VoidVRCompanionStudio;
 const Voices=isNode?require('./npc-voices.js'):root.VoidNPCVoices;
 function plan(raw,{id,recordings=[],voice=null}={}){
  if(!Studio?.profile||!Studio?.voiceBatch)throw Error('Companion profile tools unavailable.');
  if(!Voices?.estimate||!Voices?.speakText)throw Error('NPC voice tools unavailable.');
  if(!/^[a-z][a-z0-9-]{1,39}$/.test(id||''))throw Error('Invalid NPC ID.');
  const p=Studio.profile(raw);
  const rows=Studio.voiceBatch({...p,id});
  const existing=Array.isArray(recordings)?recordings:Object.values(recordings||{});
  const normalized=existing.filter(x=>x&&typeof x.text==='string');
  const matches=(line)=>{
   return normalized.some(r=>{
    if(r.text!==line.text)return false;
    // Existing manual recordings are preserved unless a recorded voice ID
    // explicitly says this recording belongs to a different selected voice.
    if(voice?.voiceId && r.voiceId && voice.voiceId!==r.voiceId)return false;
    if(voice?.model && r.model && voice.model!==r.model)return false;
    return true;
   });
  };
  const missing=rows.filter(r=>!matches(r));
  const selected=voice?.kind==='elevenlabs'&&typeof voice.voiceId==='string'&&voice.voiceId.trim();
  const spoken=missing.map(r=>Voices.speakText(r.text,voice));
  const estimate=Voices.estimate(spoken,voice?.model);
  return {total:rows.length,existing:rows.length-missing.length,missing:missing.length,
   canGenerate:!!selected,voiceId:selected?voice.voiceId:null,
   jobs:missing.map((r,i)=>({id:r.id,pool:r.pool,text:r.text,speakText:spoken[i]})),
   estimate,requiresExplicitConfirmation:true};
 }
 const api={plan};
 if(isNode)module.exports=api;else root.VoidNPCVoiceBatch=api;
})(typeof globalThis!=='undefined'?globalThis:this);
