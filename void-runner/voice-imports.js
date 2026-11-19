/* IMPORTED VOICE FILES (the owner, 19 Nov 2026: "how about an import option. So I can type it in to the What they say box, Then go to elevenlabs, make the voice, then
   import it on the dev editor"). Next to every authored line in the Mission Editor and in NPCs > Lines & voice: IMPORT VOICE FILE (mp3, wav, ogg; m4a / webm when the
   browser can play them). The file is decoded here first (it must play), 40 seconds at most and 600 KB at most as stored: a larger file (or an m4a / webm / flac) is
   re-encoded in the browser to Ogg Opus, mono 24 kHz (WebCodecs AudioEncoder) or refused in plain words. The imported file OVERRIDES any generated clip for that exact
   line text; if the words change afterwards the line says "text changed since the voice was imported" and the game does not use the file for the new words.
   WHERE THE AUDIO LIVES: in the draft, in this browser (IndexedDB, guarded; memory if storage is blocked), so PLAY THIS DRAFT uses it at once. PUBLISH uploads each file
   (owner only, POST developer/voice-clips/<sha-256>: checked again on the server, one Firestore document per file, content-addressed) and the published content
   references it by hash (content.clips). Players fetch it with no sign-in (GET voice-clip/<sha-256>, cached for a year: the address never changes) and keep a copy in the
   Cache Storage. It plays through voice-clips.js, so a speaker's live effect (Iris android, Zen Zephyr's monk filter) still applies. Voice tags in the line stay in the
   editor text; the file is used as it is. tools/audio/bake-imported.py moves published files into the repository as ordinary clips.
   Pure rules (Node-tested): LIMIT, sniff, plan, caps, record, recordProblems, clipProblems, status, contentClips, keyOf, sha256, Ogg pages (oggOpus / oggInfo).
   Browser: prepare(file), store / getData (IndexedDB), use(clips) / find / load (the game), upload (publish). */
(function(root){
 'use strict';
 const NODE=typeof module!=='undefined'&&module.exports&&typeof document==='undefined';
 const LIMIT={seconds:40,bytes:600000,clips:200,name:120,read:25*1024*1024,bitrate:48000,rate:24000};
 // Kept as they are (every desktop browser plays them); anything else is re-encoded to Ogg Opus.
 const TYPES={'audio/ogg':'ogg','audio/mpeg':'mp3','audio/wav':'wav'};
 const HASH=/^[0-9a-f]{64}$/,WHO=/^[a-z][a-z0-9-]{0,40}$/,TAGS=/<[^>]*>|[\u0000-\u0008\u000b\u000c\u000e-\u001f]/,KEY=/^[^\u0000-\u001f]{1,700}$/;
 const NPV=()=>NODE?(()=>{try{return require('./npc-voices.js');}catch{return null;}})():root.VoidNPCVoices;
 // What players hear the line as: voice tags removed (npc-voices.js strip, when present), trimmed.
 const strip=t=>{const V=NPV(),s=String(t==null?'':t);return String(V&&typeof V.strip==='function'?V.strip(s):s).trim();};
 const ALIAS={you:'player',pilot:'player',player:'player','arcade attendant':'attendant','landing terminal':'landing-terminal'};
 const norm=w=>{const l=String(w||'').toLowerCase().trim();return ALIAS[l]||l.replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');};
 const keyOf=(who,text)=>norm(who)+'|'+strip(text);
 const kb=n=>Math.round(n/1024)+' KB',secs=d=>(Math.round(d*10)/10)+' s';
 /* ---- what a file is (its first bytes, not its name) ---- */
 function sniff(u8){u8=u8 instanceof Uint8Array?u8:new Uint8Array(u8||[]);const s=(a,b)=>String.fromCharCode(...u8.subarray(a,b));if(u8.length<12)return null;
  if(s(0,4)==='OggS')return 'audio/ogg';if(s(0,4)==='RIFF'&&s(8,12)==='WAVE')return 'audio/wav';if(s(0,3)==='ID3'||(u8[0]===0xff&&(u8[1]&0xe0)===0xe0))return 'audio/mpeg';
  if(s(0,4)==='fLaC')return 'audio/flac';if(s(4,8)==='ftyp')return 'audio/mp4';if(u8[0]===0x1a&&u8[1]===0x45&&u8[2]===0xdf&&u8[3]===0xa3)return 'audio/webm';return null;}
 /* keep: stored as imported. encode: re-encoded to Ogg Opus (too big, or a type not every browser plays). */
 const plan=(type,bytes)=>TYPES[type]&&bytes<=LIMIT.bytes?'keep':'encode';
 /* Plain problems with a prepared file (empty = fine). */
 function caps({duration,bytes}){const out=[];
  if(!(duration>0.05))out.push('This file has no sound in it. Export the line again from ElevenLabs and import that.');
  else if(duration>LIMIT.seconds+0.05)out.push('This recording is '+secs(duration)+' long; the limit is '+LIMIT.seconds+' seconds. Split the line into two shorter lines and import a file for each.');
  if(bytes>LIMIT.bytes)out.push('This file is '+kb(bytes)+'; the limit is '+kb(LIMIT.bytes)+'. In ElevenLabs, download it as a lower-quality MP3 (for example 64 kbps) and import that.');
  return out;}
 /* ---- the draft's record of an imported file (local().clips[lineKey]) ---- */
 const r2=n=>Math.round(n*100)/100;
 function record(o){return {who:String(o.who),text:String(o.text==null?'':o.text).trim().slice(0,500),hash:o.hash,type:o.type,duration:r2(o.duration),bytes:o.bytes|0,name:String(o.name||'voice file').replace(TAGS,'').slice(0,LIMIT.name),at:o.at||new Date().toISOString(),...(o.reencoded?{reencoded:true}:{})};}
 const plainText=(t,max)=>typeof t==='string'&&t.trim().length>0&&t.length<=max&&!TAGS.test(t);
 function clipShape(c,extra){const out=[];if(!c||typeof c!=='object'||Array.isArray(c))return ['An imported voice file has an unknown shape.'];
  const allowed=['who','text','hash','type','duration','bytes',...(extra||[])];if(Object.keys(c).some(k=>!allowed.includes(k)))out.push('An imported voice file has unknown fields.');
  if(typeof c.who!=='string'||!WHO.test(c.who)||c.who==='player')out.push('An imported voice file must belong to a character (not the player).');
  if(!plainText(c.text,500))out.push('An imported voice file must belong to a line of plain text (500 characters at most).');
  if(typeof c.hash!=='string'||!HASH.test(c.hash))out.push('An imported voice file has a bad file address.');
  if(!TYPES[c.type])out.push('An imported voice file must be MP3, WAV or Ogg.');
  if(typeof c.duration!=='number'||!(c.duration>0)||c.duration>LIMIT.seconds+0.05)out.push('An imported voice file must be 40 seconds at most.');
  if(!Number.isInteger(c.bytes)||c.bytes<1||c.bytes>LIMIT.bytes)out.push('An imported voice file must be 600 KB at most.');
  return out;}
 /* The editor draft's records (keyed by the line's key; checked by the server copy too). */
 function recordProblems(recs){if(!recs||typeof recs!=='object'||Array.isArray(recs))return ['The imported voice files have an unknown shape.'];const e=Object.entries(recs);if(e.length>LIMIT.clips)return ['Too many imported voice files ('+e.length+'; '+LIMIT.clips+' at most).'];
  const out=[];for(const [k,r] of e){if(!KEY.test(k)){out.push('An imported voice file is attached to an unknown line.');continue;}for(const p of clipShape(r,['name','at','reencoded']))if(!out.includes(p))out.push(p);
   if(r&&r.name!=null&&!(typeof r.name==='string'&&r.name.length<=LIMIT.name&&!TAGS.test(r.name)))out.push('An imported voice file has a bad name.');if(r&&r.at!=null&&!(typeof r.at==='string'&&r.at.length<=40))out.push('An imported voice file has a bad date.');
   if(r&&r.reencoded!=null&&r.reencoded!==true)out.push('An imported voice file has a bad note.');}return out;}
 /* Published content.clips: [{who, text, hash, type, duration, bytes}] (mission-content.js check and the server's clip_problems). */
 function clipProblems(list){if(!Array.isArray(list))return ['The imported voice files have an unknown shape.'];if(list.length>LIMIT.clips)return ['Too many imported voice files ('+list.length+'; '+LIMIT.clips+' at most).'];
  const out=[],seen=new Set();for(const c of list){for(const p of clipShape(c))if(!out.includes(p))out.push(p);if(c&&typeof c.who==='string'){const k=keyOf(c.who,c.text);if(seen.has(k))out.push('Two imported voice files are attached to the same line ('+String(c.text).slice(0,40)+').');seen.add(k);}}return out;}
 /* The voice status of a line with an import. current: the line's text now. available: false when the file is neither in this browser nor on the server. */
 function status(rec,current,opt={}){if(!rec)return null;const same=String(current==null?'':current).trim()===rec.text;
  if(!same)return {state:'changed',text:'Voice: imported file · text changed since the voice was imported (the game does not use it for the new words: REPLACE it, or put the words back)',cls:'bad'};
  if(opt.available===false)return {state:'missing',text:'Voice: imported file · the file is not in this browser (imported on another computer?): import it again here, or publish from that computer',cls:'warn'};
  return {state:'ok',text:'Voice: imported file (used instead of any recorded clip)',cls:'ok'};}
 /* The draft's imports that still match their line's text, for the content (textOf(lineKey) -> the line's text now; undefined: keep). One per spoken line. */
 function contentClips(recs,textOf){const by=new Map();for(const [k,r] of Object.entries(recs||{})){if(!r||clipShape(r,['name','at','reencoded']).length)continue;
   if(typeof textOf==='function'){const now=textOf(k);if(now!==undefined&&String(now==null?'':now).trim()!==r.text)continue;}by.set(keyOf(r.who,r.text),{who:r.who,text:r.text,hash:r.hash,type:r.type,duration:r.duration,bytes:r.bytes});}
  return [...by.values()].slice(0,LIMIT.clips);}
 /* ---- SHA-256 (the file's address; crypto.subtle when there is one) ---- */
 const K=new Uint32Array([0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);
 function sha256Sync(input){const m=input instanceof Uint8Array?input:new Uint8Array(input),l=m.length,n=((l+9+63)>>6)<<6,b=new Uint8Array(n);b.set(m);b[l]=0x80;const dv=new DataView(b.buffer);dv.setUint32(n-8,Math.floor(l/0x20000000));dv.setUint32(n-4,(l<<3)>>>0);
  const h=new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]),w=new Uint32Array(64),rr=(x,s)=>(x>>>s)|(x<<(32-s));
  for(let o=0;o<n;o+=64){for(let i=0;i<16;i++)w[i]=dv.getUint32(o+i*4);for(let i=16;i<64;i++){const a=w[i-15],c=w[i-2];w[i]=(w[i-16]+(rr(a,7)^rr(a,18)^(a>>>3))+w[i-7]+(rr(c,17)^rr(c,19)^(c>>>10)))>>>0;}
   let [A,B,C,D,E,F,G,H]=h;for(let i=0;i<64;i++){const t1=(H+(rr(E,6)^rr(E,11)^rr(E,25))+((E&F)^(~E&G))+K[i]+w[i])>>>0,t2=((rr(A,2)^rr(A,13)^rr(A,22))+((A&B)^(A&C)^(B&C)))>>>0;H=G;G=F;F=E;E=(D+t1)>>>0;D=C;C=B;B=A;A=(t1+t2)>>>0;}
   h[0]+=A;h[1]+=B;h[2]+=C;h[3]+=D;h[4]+=E;h[5]+=F;h[6]+=G;h[7]+=H;}
  return [...h].map(x=>x.toString(16).padStart(8,'0')).join('');}
 async function sha256(buf){const u8=buf instanceof Uint8Array?buf:new Uint8Array(buf);try{const s=root.crypto&&root.crypto.subtle;if(s){const d=await s.digest('SHA-256',u8);return [...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join('');}}catch{}return sha256Sync(u8);}
 /* ---- Ogg pages (RFC 3533) and Ogg Opus (RFC 7845): the muxer for re-encoded files and a reader (lengths, CRC) for checks ---- */
 const CRC=(()=>{const t=new Uint32Array(256);for(let i=0;i<256;i++){let r=i<<24;for(let j=0;j<8;j++)r=r&0x80000000?((r<<1)^0x04c11db7)>>>0:(r<<1)>>>0;t[i]=r>>>0;}return t;})();
 const crc32=u8=>{let c=0;for(let i=0;i<u8.length;i++)c=((c<<8)^CRC[((c>>>24)^u8[i])&0xff])>>>0;return c>>>0;};
 function page(flags,granule,serial,seq,packets){const lace=[];for(const p of packets){let n=p.length;while(n>=255){lace.push(255);n-=255;}lace.push(n);}
  const size=27+lace.length+packets.reduce((s,p)=>s+p.length,0),u=new Uint8Array(size),dv=new DataView(u.buffer);u.set([0x4f,0x67,0x67,0x53,0,flags]);
  dv.setUint32(6,granule%0x100000000,true);dv.setUint32(10,Math.floor(granule/0x100000000),true);dv.setUint32(14,serial,true);dv.setUint32(18,seq,true);u[26]=lace.length;u.set(lace,27);
  let o=27+lace.length;for(const p of packets){u.set(p,o);o+=p.length;}dv.setUint32(22,crc32(u),true);return u;}
 /* packets: [{data:Uint8Array, samples (at 48 kHz)}]; preSkip (48 kHz samples), inputRate, length (input samples at inputRate: the exact end). */
 function oggOpus(packets,{preSkip=312,inputRate=48000,length=null,serial=0x56524f50,vendor='VOID//RUNNER voice import'}={}){
  const head=new Uint8Array(19),hd=new DataView(head.buffer);head.set([...'OpusHead'].map(c=>c.charCodeAt(0)));head[8]=1;head[9]=1;hd.setUint16(10,preSkip,true);hd.setUint32(12,inputRate,true);
  const ven=[...vendor].map(c=>c.charCodeAt(0)&0x7f),tags=new Uint8Array(8+4+ven.length+4),td=new DataView(tags.buffer);tags.set([...'OpusTags'].map(c=>c.charCodeAt(0)));td.setUint32(8,ven.length,true);tags.set(ven,12);
  const pages=[page(2,0,serial,0,[head]),page(0,0,serial,1,[tags])],end=length!=null?preSkip+Math.round(length*48000/inputRate):Infinity;
  let gran=preSkip,seq=2,cur=[],laces=0;
  const flush=last=>{if(!cur.length&&!last)return;pages.push(page(last?4:0,Math.min(gran,end),serial,seq++,cur));cur=[];laces=0;};
  packets.forEach((p,i)=>{const need=Math.floor(p.data.length/255)+1;if(laces+need>255||cur.length>=50)flush(false);cur.push(p.data);laces+=need;gran+=p.samples;if(i===packets.length-1)flush(true);});
  if(!packets.length)flush(true);
  const out=new Uint8Array(pages.reduce((s,p)=>s+p.length,0));let o=0;for(const p of pages){out.set(p,o);o+=p.length;}return out;}
 /* Reads an Ogg file: {codec, rate, preSkip, granule, duration, pages, crcOk} or null. */
 function oggInfo(input){const u=input instanceof Uint8Array?input:new Uint8Array(input),dv=new DataView(u.buffer,u.byteOffset,u.byteLength);let o=0,pages=0,crcOk=true,codec=null,rate=0,preSkip=0,granule=0,serial=null;
  while(o+27<=u.length){if(u[o]!==0x4f||u[o+1]!==0x67||u[o+2]!==0x67||u[o+3]!==0x53)return null;const nseg=u[o+26],lace=u.subarray(o+27,o+27+nseg),len=lace.reduce((s,x)=>s+x,0),size=27+nseg+len;if(o+size>u.length)return null;
   const pg=Uint8Array.from(u.subarray(o,o+size)),want=dv.getUint32(o+22,true);pg[22]=pg[23]=pg[24]=pg[25]=0;if(crc32(pg)!==want)crcOk=false;
   const s=dv.getUint32(o+14,true);if(serial===null)serial=s;
   if(pages===0){const b=u.subarray(o+27+nseg,o+size),t=String.fromCharCode(...b.subarray(0,8));if(t==='OpusHead'){codec='opus';rate=48000;preSkip=b[10]|(b[11]<<8);}else if(b[0]===1&&String.fromCharCode(...b.subarray(1,7))==='vorbis'){codec='vorbis';rate=new DataView(b.buffer,b.byteOffset).getUint32(12,true);}}
   const g=dv.getUint32(o+6,true)+dv.getUint32(o+10,true)*0x100000000;if(s===serial&&g!==0xffffffffffffffff&&dv.getInt32(o+10,true)!==-1)granule=Math.max(granule,g);pages++;o+=size;}
  if(!pages||o!==u.length||!codec||!rate)return null;return {codec,rate,preSkip,granule,duration:Math.max(0,granule-preSkip)/rate,pages,crcOk};}
 const api={LIMIT,TYPES,HASH,strip,norm,keyOf,sniff,plan,caps,record,recordProblems,clipProblems,status,contentClips,sha256,sha256Sync,crc32,oggOpus,oggInfo};
 if(NODE){module.exports=api;return;}
 /* ================================================================ browser ================================================================ */
 const DB='void-runner-voice-imports',STORE='clips',CACHE='void-runner-voice-imports-v1',memory=new Map(),log=[];
 const idb=()=>new Promise((res,rej)=>{try{const r=root.indexedDB.open(DB,1);r.onupgradeneeded=()=>{try{r.result.createObjectStore(STORE,{keyPath:'hash'});}catch{}};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);r.onblocked=()=>rej(new Error('blocked'));}catch(e){rej(e);}});
 async function store(hash,type,data,duration){memory.set(hash,{hash,type,data:data.slice(0),duration});try{const db=await idb();await new Promise((res,rej)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put({hash,type,data:data.slice(0),duration,at:Date.now()});tx.oncomplete=res;tx.onerror=()=>rej(tx.error);});db.close();return true;}catch{return false;}}
 async function local(hash){if(memory.has(hash))return memory.get(hash);try{const db=await idb();const v=await new Promise((res,rej)=>{const r=db.transaction(STORE,'readonly').objectStore(STORE).get(hash);r.onsuccess=()=>res(r.result||null);r.onerror=()=>rej(r.error);});db.close();if(v)memory.set(hash,v);return v;}catch{return null;}}
 const url=hash=>(root.VoidNetwork&&root.VoidNetwork.base||'')+'/api/void-runner/voice-clip/'+hash;
 /* The published copy (no sign-in): the Cache Storage first, then the network (kept in the cache; the address is the content, so it never goes stale). */
 async function remote(hash){let res=null,how='network';try{const c=await root.caches.open(CACHE);res=await c.match(url(hash));if(res)how='cache';}catch{}
  if(!res){res=await fetch(url(hash),{credentials:'omit'});if(!res.ok)throw new Error('Imported voice file '+res.status);try{const c=await root.caches.open(CACHE);await c.put(url(hash),res.clone());}catch{}}
  const data=await res.arrayBuffer();if(await sha256(data)!==hash)throw new Error('Imported voice file does not match its address');return {data,how};}
 /* The audio of a file (ArrayBuffer, a fresh copy every time: decodeAudioData takes it). Draft play: this browser first, then the published copy. */
 async function getData(hash,{draft=true}={}){if(draft){const v=await local(hash);if(v){log.push({hash,how:'browser'});return v.data.slice(0);}}const r=await remote(hash);log.push({hash,how:r.how});return r.data;}
 async function available(hash){return !!(await local(hash));}
 function ctxFor(rate){const O=root.OfflineAudioContext||root.webkitOfflineAudioContext;return new O(1,Math.max(1,Math.ceil(rate)),rate);}
 async function decode(buf){return await ctxFor(44100).decodeAudioData(buf.slice(0));}
 /* Mono at `rate` (Float32Array). */
 async function monoAt(ab,rate){const O=root.OfflineAudioContext||root.webkitOfflineAudioContext,n=Math.max(1,Math.ceil(ab.duration*rate)),ctx=new O(1,n,rate),s=ctx.createBufferSource();s.buffer=ab;s.connect(ctx.destination);s.start();return (await ctx.startRendering()).getChannelData(0);}
 const canEncode=()=>typeof root.AudioEncoder==='function'&&typeof root.AudioData==='function';
 /* Re-encodes to Ogg Opus, mono, 24 kHz (48 kHz when the encoder only takes that), LIMIT.bitrate. */
 async function encodeOpus(ab){let rate=LIMIT.rate;const cfg=r=>({codec:'opus',sampleRate:r,numberOfChannels:1,bitrate:LIMIT.bitrate});
  try{if(!(await root.AudioEncoder.isConfigSupported(cfg(rate))).supported)rate=48000;}catch{rate=48000;}
  const pcm=await monoAt(ab,rate),chunks=[];let pre=null,fail=null;
  const enc=new root.AudioEncoder({output:(ch,meta)=>{const d=new Uint8Array(ch.byteLength);ch.copyTo(d);chunks.push({data:d,us:ch.duration});const desc=meta&&meta.decoderConfig&&meta.decoderConfig.description;
   if(desc&&pre===null){const u=new Uint8Array(desc.buffer?desc.buffer.slice(desc.byteOffset||0,(desc.byteOffset||0)+desc.byteLength):desc);if(u.length>=12&&String.fromCharCode(...u.subarray(0,8))==='OpusHead')pre=u[10]|(u[11]<<8);}},error:e=>{fail=e;}});
  enc.configure(cfg(rate));const step=rate/50;
  for(let i=0;i<pcm.length;i+=step){const part=pcm.subarray(i,Math.min(pcm.length,i+step));enc.encode(new root.AudioData({format:'f32-planar',sampleRate:rate,numberOfFrames:part.length,numberOfChannels:1,timestamp:Math.round(i/rate*1e6),data:part}));}
  await enc.flush();enc.close();if(fail)throw fail;
  const packets=chunks.map(c=>({data:c.data,samples:Math.round((c.us||20000)*48/1000)}));
  return oggOpus(packets,{preSkip:pre==null?312:pre,inputRate:rate,length:pcm.length});}
 /* An imported file -> {ok, data, hash, type, duration, bytes, reencoded, name} or {ok:false, why}. step(text) reports progress in plain words. */
 async function prepare(file,step=()=>{}){
  const fail=why=>({ok:false,why});
  if(!file)return fail('No file was chosen.');if(file.size>LIMIT.read)return fail('This file is '+Math.round(file.size/1048576)+' MB, far too big for one line. In ElevenLabs, download the line as an MP3 and import that.');
  step('Reading '+file.name+'…');let data;try{data=await file.arrayBuffer();}catch{return fail('The file could not be read. Try again, or save it to your computer first and import that copy.');}
  let type=sniff(new Uint8Array(data))||String(file.type||'').split(';')[0];step('Checking that it plays…');let ab;try{ab=await decode(data);}catch{return fail('Your browser cannot play this file ('+(file.name.split('.').pop()||'unknown').toUpperCase()+'). In ElevenLabs, download the line as an MP3 and import that.');}
  const duration=ab.duration;{const p=caps({duration,bytes:0});if(p.length)return fail(p[0]);}
  let reencoded=false;
  if(plan(type,data.byteLength)==='encode'){
   if(!canEncode())return fail(TYPES[type]?caps({duration,bytes:data.byteLength})[0]+' (This browser cannot make it smaller by itself.)':'This browser cannot store a '+(type||'file of this kind').replace('audio/','').toUpperCase()+' file as it is. In ElevenLabs, download the line as an MP3 and import that.');
   step('Making it smaller (Ogg Opus, mono, 24 kHz)…');try{data=(await encodeOpus(ab)).buffer;type='audio/ogg';reencoded=true;}catch{return fail('The file could not be made smaller in this browser. In ElevenLabs, download the line as a lower-quality MP3 (for example 64 kbps) and import that.');}
   try{await decode(data);}catch{return fail('The smaller copy did not play back. In ElevenLabs, download the line as an MP3 and import that.');}}
  {const p=caps({duration,bytes:data.byteLength});if(p.length)return fail(p[0]);}
  const hash=await sha256(data);return {ok:true,data,hash,type,duration:r2(duration),bytes:data.byteLength,reencoded,name:String(file.name||'voice file').slice(0,LIMIT.name)};}
 /* ---- the game: which lines have an imported file (draft or published) ---- */
 let byKey=new Map(),source='none';
 function use(list,opt={}){byKey=new Map();source=opt.draft?'draft':'live';const givers=opt.givers||[];
  for(const c of Array.isArray(list)?list:[]){if(clipShape(c).length)continue;const e={...c,src:source},g=givers.find(x=>x&&x.id===c.who),names=new Set([c.who,g&&g.say,g&&g.name].filter(Boolean));for(const n of names)byKey.set(keyOf(n,c.text),e);}
  return byKey.size;}
 const find=(who,text)=>byKey.get(keyOf(who,text))||null;
 const load=e=>getData(e.hash,{draft:e.src==='draft'});
 /* ---- PUBLISH: upload what the server does not have yet. request: VoidDevTools.request. Returns {uploaded, kept}. ---- */
 const b64=buf=>{const u=new Uint8Array(buf);let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s);};
 async function upload(request,clips,step=()=>{}){const hashes=[...new Set((clips||[]).map(c=>c.hash))];if(!hashes.length)return {uploaded:0,kept:0};
  const missing=(await request('developer/voice-clips',{hashes})).missing||[];let n=0;
  for(const h of missing){const c=clips.find(x=>x.hash===h),v=await local(h);if(!v)throw new Error('The voice file for “'+String(c.text).slice(0,40)+'” is not in this browser. Import it again (REPLACE), then publish.');
   step('Uploading voice file '+(++n)+' of '+missing.length+'…');await request('developer/voice-clips/'+h,{type:v.type||c.type,data:b64(v.data)});}
  return {uploaded:missing.length,kept:hashes.length-missing.length};}
 root.VoidVoiceImports={...api,url,store,getData,available,decode,prepare,canEncode,encodeOpus,use,find,load,upload,get source(){return source;},get count(){return byKey.size;},get log(){return log.slice();}};
})(globalThis);
