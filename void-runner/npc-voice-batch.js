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
  const recorded=new Set(existing.filter(r=>typeof r?.text==='string').map(r=>r.text));
  const missing=rows.filter(row=>!recorded.has(row.text));
  const selected=voice?.kind==='elevenlabs'&&Voices.ID.test(voice.voiceId||'')&&(!voice.model||Voices.modelOk(voice.model));
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
