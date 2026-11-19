/* ELEVENLABS VOICE CHOICES FROM THE EDITOR (pure data and rules: browser and Node tests; no network, no DOM, no API key). Queue item 0b, approved by the owner 18 Nov 2026:
   "The owner picks a voice for any NPC or giver by pasting an ElevenLabs voice link or ID plus a name (no API key in the browser, ever; no listing of his ElevenLabs
   library from the client). Saved as editor content and mirrored into tools/audio/revoice-engines.json format ... Generation is NEVER triggered from the editor."
   A CHOICE (content.voices[who], made in Developer Tools > NPCs > Lines & voice or on a Mission Editor giver card, saved as a draft, published like missions, checked by
   the server: void_runner_live_content.py voice_problems):
     {engine:'elevenlabs', voiceId:'<20 letters and digits>', name:'<what the owner calls it>', chosen:'YYYY-MM-DD by the owner'}
   It decides which voice NEW or CHANGED lines of that character are re-voiced with: the re-voice queue records it, and tools/audio/generate.py --from-queue lists those
   lines as waiting for ElevenLabs (it never records them). Nothing here changes a registered Kokoro voice (tools/audio/npc-voice-registry.json) or a recorded clip.
   REFUSED: the reserved special-character slot, broadcast voices (the Relay's anchor, announcers) and The Function (no voice, no treatment without the owner).
   Reverie and Lace may have one: an ordinary, neutral street voice (the owner's rule; the editor says so).
   COST ESTIMATE (an estimate only, never a quote): ElevenLabs text to speech bills by characters. Assumed: about 1 credit per character (Multilingual v2, v3 and newer
   models on the self-serve plans); Flash / Turbo models about 0.5 credit per character. The owner's plan and model decide the real figure.
   MODEL (the owner, 19 Nov 2026: "choose a model?", "v4?"): a choice may name its ElevenLabs model (MODELS below; the allow-list the server repeats). Default for a new choice:
   eleven_v4 (the model Zen Zephyr was recorded with). A character in revoice-engines.json keeps the model recorded there ("model", or "(model ...)" in "chosen").
   VOICE TAGS (the owner, 19 Nov 2026: "so i can put elevenlabs voice tags into the what is said section?"): a line may carry ElevenLabs audio tags in square brackets,
   e.g. "[whispers] Keep it down." Rules: lowercase letters, spaces and hyphens, 30 characters at most each, 6 per line (tagProblems). Players never see them: strip()
   is applied where content is adapted for the game (mission-content.js apply / mapLine). Only a voice whose model reads tags (MODELS[..].tags) gets them in the text
   it is sent (speakText); Kokoro and the other ElevenLabs models get the line without them (Kokoro would read them aloud). */
(function(root){
 'use strict';
 const ID=/^[A-Za-z0-9]{20}$/,WHO=/^[a-z][a-z0-9-]{0,40}$/,TAGS=/<[^>]*>|[\x00-\x08\x0b\x0c\x0e-\x1f]/;
 // Never voiced from here, whatever the registry says (the registry's reserved and broadcast entries are refused too).
 const REFUSED={'special-character':'This slot is reserved for a special character the owner will introduce later: no voice is assigned to it.',
  'the-function':'The Function has no voice: it gets no voice or treatment without the owner.',
  'news-anchor':'Broadcast voices (The Relay) are not chosen here.','commercial-announcer':'Broadcast voices (The Relay) are not chosen here.','warflying-host':'Broadcast voices (The Relay) are not chosen here.'};
 const STREET=['grey-reverie','ethereal-lace'];   // ordinary street voices only (the owner's rule for Reverie and Lace)
 const CREDITS={perChar:1,fast:.5,text:'Estimate only: about 1 credit per character (ElevenLabs Multilingual v2 / v3 and newer models); Flash / Turbo models use about half. Your plan and model decide the real cost.'};
 const LIMIT={voices:80,name:60,tags:6,tag:30};
 // ElevenLabs text to speech models offered in the Voice box (credits per character: an ESTIMATE on the self-serve plans). tags: reads [audio tags].
 const MODELS={
  eleven_v4:{label:'Eleven v4 (newest; supports voice tags — used for Zen Zephyr)',text:'Most expressive. Reads voice tags like [whispers] and [laughs].',tags:true,rate:1},
  eleven_v3:{label:'Eleven v3 (supports voice tags)',text:'Expressive. Reads voice tags like [whispers] and [laughs].',tags:true,rate:1},
  eleven_multilingual_v2:{label:'Multilingual v2',text:'The most natural, steady reading. No voice tags (they are left out when it records).',tags:false,rate:1},
  eleven_flash_v2_5:{label:'Flash v2.5',text:'Fastest and cheapest (about half the credits). No voice tags.',tags:false,rate:.5},
  eleven_turbo_v2_5:{label:'Turbo v2.5',text:'Fast and cheap (about half the credits). No voice tags.',tags:false,rate:.5}};
 const DEFAULT_MODEL='eleven_v4';
 /* ---- voice tags ---- */
 const PLACEHOLDER=/^\s*\[(?:[^\]:]{1,20}:\s*)?write\b/i;   // "[Write ... here]": a placeholder for the owner (main-story.js isPlaceholder), not a voice tag
 const TAG_ONE=/[ \t]*\[([a-z](?:[a-z -]{0,28}[a-z])?)\][ \t]*/g,TAG_BODY=/^[a-z](?:[a-z -]*[a-z])?$/;
 const tags=t=>{const out=[];String(t==null?'':t).replace(/\[([^\[\]]*)\]/g,(m,b)=>{out.push(b);return m;});return out;};
 const hasTags=t=>typeof t==='string'&&t.includes('[')&&tags(t).some(b=>TAG_BODY.test(b)&&b.length<=LIMIT.tag);
 /* What players see: the line without its voice tags (spaces tidied). A line without tags is returned exactly as it is (voice clips are found by their text). */
 function strip(t){if(typeof t!=='string'||!t.includes('['))return t;let any=false;const s=t.replace(TAG_ONE,()=>{any=true;return ' ';});if(!any)return t;
  return s.replace(/[ \t]{2,}/g,' ').replace(/ +([,.!?;:…])/g,'$1').replace(/^[ \t]+|[ \t]+$/gm,'').trim();}
 /* Problems with a line's voice tags (plain words; empty = fine). */
 function tagProblems(t){if(typeof t!=='string'||(!t.includes('[')&&!t.includes(']'))||PLACEHOLDER.test(t))return [];const out=[],list=tags(t),rest=t.replace(/\[[^\[\]]*\]/g,'');
  if(rest.includes('[')||rest.includes(']'))out.push('A square bracket is not closed. Write voice tags like [whispers], with one [ and one ] around each.');
  for(const b of list){if(!b.trim()){out.push('Empty brackets []: write a voice tag inside them, like [whispers], or remove them.');continue;}
   if(b.length>LIMIT.tag)out.push('The voice tag ['+b.slice(0,40)+'] is too long ('+LIMIT.tag+' characters at most).');
   else if(!TAG_BODY.test(b))out.push('The voice tag ['+b.slice(0,40)+'] may only use lowercase letters, spaces and hyphens, like [whispers] or [sighs].');}
  if(list.length>LIMIT.tags)out.push('Too many voice tags in one line ('+list.length+'; '+LIMIT.tags+' at most).');
  if(!out.length&&list.length&&!strip(t).trim())out.push('The line needs words besides its voice tags.');
  return out;}
 const modelOk=m=>typeof m==='string'&&Object.prototype.hasOwnProperty.call(MODELS,m);
 /* The model of a choice or a revoice-engines.json entry: its own "model", else "(model ...)" in "chosen", else the default. */
 function modelOf(v){if(v&&modelOk(v.model))return v.model;const m=/\(model ([a-z0-9_]+)\)/.exec(String((v&&v.chosen)||''));return m&&modelOk(m[1])?m[1]:DEFAULT_MODEL;}
 const readsTags=voice=>!!(voice&&voice.kind!=='kokoro'&&voice.kind!=='none'&&(voice.kind==='elevenlabs'||voice.engine==='elevenlabs')&&MODELS[voice.model||DEFAULT_MODEL]&&MODELS[voice.model||DEFAULT_MODEL].tags);
 /* The text a voice is sent: with its tags for a model that reads them, without them for every other voice (Kokoro, Multilingual v2, Flash, Turbo).
    voice: current() (kind / model) or a queue engine record (engine / model). */
 const speakText=(t,voice)=>{const s=String(t==null?'':t);return readsTags(voice)?s.replace(/[ \t]{2,}/g,' ').trim():String(strip(s)).trim();};
 /* A plain warning for the editor when a line's tags will not be used by this speaker's voice, or null. */
 function tagWarning(t,voice,name){if(!hasTags(t))return null;const who=name||'This character';
  if(!voice||voice.kind==='none')return who+' has no voice yet: the voice tags are only used if you choose an ElevenLabs voice.';
  if(voice.kind==='kokoro')return who+' speaks with a Kokoro voice, which cannot use voice tags: they are left out when the line is recorded.';
  if(!readsTags(voice))return (MODELS[voice.model]||{label:voice.model}).label+' does not read voice tags: they are left out when the line is recorded. Choose Eleven v4 or v3 to use them.';
  return null;}
 const plain=(v,max)=>typeof v==='string'&&v.trim().length>0&&v.length<=max&&!TAGS.test(v);
 const keysOk=(o,allowed)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).every(k=>allowed.includes(k));
 const today=(d=new Date())=>d.toISOString().slice(0,10);
 const listenUrl=id=>ID.test(String(id||''))?'https://elevenlabs.io/voices/'+id:null;
 /* A pasted ElevenLabs voice link or a bare voice id -> {ok, id} | {ok:false, why (plain words)}. Links: elevenlabs.io/voices/<id>, .../voice-library?voiceId=<id>,
    .../voice-lab/share/<x>/<id>, .../voice/<id>; any elevenlabs.io address with a 20-character id as its last part. Nothing is fetched. */
 function parse(input){const s=String(input==null?'':input).trim();if(!s)return {ok:false,why:'Paste an ElevenLabs voice link or its voice ID.'};
  if(ID.test(s))return {ok:true,id:s};
  if(/^[A-Za-z0-9]{8,40}$/.test(s))return {ok:false,why:'An ElevenLabs voice ID is exactly 20 letters and digits; this one has '+s.length+'. Copy it again from the voice’s page.'};
  let u=null;try{u=new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(s)?s:'https://'+s);}catch{return {ok:false,why:'That is not a link or a voice ID. Paste the address of the voice’s page on elevenlabs.io, or its 20-character ID.'};}
  if(!/(^|\.)elevenlabs\.io$/i.test(u.hostname))return {ok:false,why:'Only an elevenlabs.io link can be used (this one is '+u.hostname+').'};
  for(const k of ['voiceId','voice_id','voice'])if(ID.test(u.searchParams.get(k)||''))return {ok:true,id:u.searchParams.get(k)};
  const parts=u.pathname.split('/').filter(Boolean),hit=parts.slice().reverse().find(p=>ID.test(p));
  if(hit)return {ok:true,id:hit};
  return {ok:false,why:'That elevenlabs.io link has no voice ID in it. Open the voice in ElevenLabs and copy the link of its own page (it ends in a 20-character ID), or copy its ID.'};}
 /* Why this character cannot have an ElevenLabs voice chosen here (plain words), or null. reg: npc-voice-registry.json. */
 function refusal(who,reg){if(typeof who!=='string'||!WHO.test(who))return 'Unknown character.';if(REFUSED[who])return REFUSED[who];
  if(reg&&reg.reserved&&reg.reserved[who])return REFUSED['special-character'];if(reg&&reg.broadcast&&reg.broadcast[who])return REFUSED['news-anchor'];
  const n=reg&&reg.npcs&&reg.npcs[who];if(n&&(n.broadcast||/the function/i.test(n.displayName||'')))return n.broadcast?REFUSED['news-anchor']:REFUSED['the-function'];return null;}
 const note=who=>STREET.includes(who)?'Choose an ordinary, neutral street voice for her (your rule for Reverie and Lace).':'';
 /* A choice from the form -> {ok, voice} | {ok:false, why}. */
 function make(who,input,name,{registry,date,model}={}){const r=refusal(who,registry);if(r)return {ok:false,why:r};const p=parse(input);if(!p.ok)return p;
  const n=String(name==null?'':name).trim();if(!n)return {ok:false,why:'Give the voice a name (what you call it, e.g. “Gravel street vendor”).'};if(n.length>LIMIT.name)return {ok:false,why:'The name is too long ('+LIMIT.name+' characters at most).'};
  if(TAGS.test(n))return {ok:false,why:'The name must be plain text.'};if(model!=null&&!modelOk(model))return {ok:false,why:'Choose one of the ElevenLabs models in the list.'};
  return {ok:true,voice:{engine:'elevenlabs',voiceId:p.id,name:n,chosen:(date||today())+' by the owner',model:model||DEFAULT_MODEL}};}
 const clean=v=>keysOk(v,['engine','voiceId','name','chosen','model'])&&v.engine==='elevenlabs'&&ID.test(v.voiceId||'')&&plain(v.name,LIMIT.name)&&/^\d{4}-\d{2}-\d{2} by the owner$/.test(v.chosen||'')&&(v.model==null||modelOk(v.model))?{engine:'elevenlabs',voiceId:v.voiceId,name:v.name.trim(),chosen:v.chosen,...(v.model!=null?{model:v.model}:{})}:null;
 /* content.voices -> problems (plain words; empty = fine). ctx: {registry, givers: Set of roster ids (optional)}. The server repeats these rules. */
 function problems(voices,ctx={}){if(!voices||typeof voices!=='object'||Array.isArray(voices)||Object.keys(voices).length>LIMIT.voices)return ['Voice choices have an unknown shape.'];
  const out=[];for(const [who,v] of Object.entries(voices)){const r=refusal(who,ctx.registry);if(r){out.push(who+': '+r);continue;}
   if(ctx.givers&&!ctx.givers.has(who)){out.push(who+': not a character the editor knows.');continue;}
   if(v&&v.model!=null&&!modelOk(v.model))out.push(who+': unknown ElevenLabs model "'+String(v.model).slice(0,40)+'" (choose one from the list).');else if(!clean(v))out.push(who+': a voice choice needs an ElevenLabs voice ID (20 letters and digits), a plain name and the date it was chosen.');}
  return out;}
 /* The voice a character speaks with now: a choice in the editor (draft or published), else the re-voice file's ElevenLabs voice, else the registered Kokoro voice.
    {kind:'elevenlabs', from:'editor'|'file', name, voiceId, chosen, kokoro} | {kind:'kokoro', voice, status} | {kind:'none'} (kokoro: the registered voice of their recorded lines). */
 function current(who,{registry,engines,voices}={}){const reg=registry&&registry.npcs&&registry.npcs[who],kokoro=reg?{voice:reg.voice,status:reg.status}:null;
  const v=voices&&clean(voices[who]);if(v)return {kind:'elevenlabs',from:'editor',name:v.name,voiceId:v.voiceId,chosen:v.chosen,model:modelOf(v),kokoro};
  const e=engines&&engines[who];if(e&&e.engine==='elevenlabs'&&ID.test(e.voiceId||''))return {kind:'elevenlabs',from:'file',name:e.voice||'ElevenLabs voice',voiceId:e.voiceId,chosen:e.chosen||'',model:modelOf(e),kokoro};
  return kokoro?{kind:'kokoro',...kokoro}:{kind:'none'};}
 /* One plain summary of current() for the top of an NPC's page, list badges and giver cards (the owner, 19 Nov 2026: "show which Elevenlabs voice was selected for them.
    Maybe link to it"). -> {kind, text, model, modelLabel, from, fromText, url, badge}. Nothing is fetched: url is only the voice's public page. */
 const modelLabel=m=>String((MODELS[m]||MODELS[DEFAULT_MODEL]).label).replace(/\s*\(.*$/,'');
 const shortName=n=>String(n||'ElevenLabs voice').replace(/\s*\(ElevenLabs\)/i,'').replace(/,\s*chosen by the owner.*$/i,'').replace(/^ElevenLabs voice (chosen|named) by the owner\b/i,'the voice $1').trim()||'ElevenLabs voice';
 function summary(cur){const c=cur||{kind:'none'};
  if(c.kind==='elevenlabs'){const m=modelOk(c.model)?c.model:DEFAULT_MODEL,ml=modelLabel(m),nm=shortName(c.name);
   return {kind:'elevenlabs',text:'ElevenLabs — '+nm+' ('+ml+')',name:nm,model:m,modelLabel:ml,from:c.from,fromText:c.from==='editor'?'your draft choice (PUBLISH keeps it)':'saved in the voice file (revoice-engines.json)',url:listenUrl(c.voiceId),voiceId:c.voiceId,badge:'EL'};}
  if(c.kind==='kokoro')return {kind:'kokoro',text:'free local voice '+(c.voice||'?')+' (locked)',badge:'K'};
  return {kind:'none',text:'none yet — choose one in Lines & voice',badge:''};}
 /* Re-voicing cost: texts (strings, as they are SENT: speakText) -> {lines, chars, credits, fast, text}. Empty lines are not spoken and not counted.
    model: credits at that model's rate (an estimate); without it, about 1 credit per character. */
 function estimate(texts,model){const t=(texts||[]).map(x=>String(x==null?'':x).trim()).filter(Boolean),chars=t.reduce((a,x)=>a+[...x].length,0),rate=model&&MODELS[model]?MODELS[model].rate:CREDITS.perChar;
  return {lines:t.length,chars,credits:Math.ceil(chars*rate),fast:Math.ceil(chars*CREDITS.fast),text:CREDITS.text,...(model?{model}:{})};}
 /* The editor's choices in tools/audio/revoice-engines.json format, merged over that file's own characters (file: its parsed JSON, optional).
    Each editor entry: engine elevenlabs, voice (the name), voiceId, chosen "YYYY-MM-DD by the owner (link)", and a note that its lines wait for the owner's approval. */
 function exportEngines(voices,file){const base=file&&file.characters?JSON.parse(JSON.stringify(file.characters)):{};
  for(const [who,v0] of Object.entries(voices||{})){const v=clean(v0);if(!v||REFUSED[who])continue;
   base[who]={engine:'elevenlabs',voice:v.name+' (ElevenLabs), chosen by the owner in Developer Tools',voiceId:v.voiceId,model:modelOf(v),chosen:v.chosen+' ('+listenUrl(v.voiceId)+')',note:'chosen in Developer Tools (Mission Editor content); waiting for ElevenLabs re-voice: spend not yet approved'};}
  return {about:(file&&file.about)||'Which engine re-voices a character\'s edited lines from the Mission Editor\'s re-voice queue. ElevenLabs lines are NOT generated by any tool in this repository: they wait in the queue until the owner approves the spend.',characters:base};}
 const api={ID,WHO,REFUSED,STREET,CREDITS,LIMIT,MODELS,DEFAULT_MODEL,modelOk,modelOf,tags,hasTags,strip,tagProblems,readsTags,speakText,tagWarning,parse,refusal,note,make,clean,problems,current,estimate,exportEngines,listenUrl,today,summary,modelLabel};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VoidNPCVoices=api;
})(typeof globalThis!=='undefined'?globalThis:this);
