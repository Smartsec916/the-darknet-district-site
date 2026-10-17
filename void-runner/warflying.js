/* The WarFlying discovery database (David's doc 11 §6–§10). One record per unique signal source,
   kept locally in the save so it works with or without a connection to the Relay.
   Scoring has exactly one rule, here and nowhere else: a source earns ONE point the first time it is
   confidently identified. Repeat sightings, other locations and partial contacts earn nothing more.
   A partial contact (identity not yet established) is recorded without a point until it is
   confirmed. Records hold no cargo, contents or manifests (§29). Rules only. */
(function(root){
 'use strict';
 const Signals=typeof module!=='undefined'?require('./signals.js'):root.VoidSignals;
 const POINTS_PER_SOURCE=1;
 const limits={records:2000,places:6,text:48,sightingGap:60000,trail:8};
 const confidence=['partial','confirmed'],uploads=['local','pending','uploaded'];
 const placePattern=/^[a-z0-9][a-z0-9:>-]{0,47}$/;
 // clock: seconds of play, which paces the leaderboard rivals.
 // trail: other pilots' sightings of the player's own ship, as uploaded to the Relay (§25).
 const freshTrail=()=>({linked:0,unlinked:0,recent:[]});
 function fresh(){return {version:1,records:{},autoUpload:true,clock:0,trail:freshTrail()};}
 // The only scoring rule. Every category counts the same.
 function pointsFor(record){return record?.p===1?POINTS_PER_SOURCE:0;}
 function points(db){return Object.values(db?.records||{}).reduce((n,r)=>n+pointsFor(r),0);}
 function discoveries(db){return Object.values(db?.records||{}).filter(r=>r.p===1).length;}
 const clean=(v,max=limits.text)=>typeof v==='string'&&v.length&&v.length<=max?v:null;
 /* Records one observation. obs: {sourceId, confidence:'partial'|'confirmed', place, time,
    strength (0..1, optional)}. Category, name and affiliation come from the signal registry, never
    from the contact itself. Returns {status:'new'|'confirmed'|'repeat'|'ignored', points, record}. */
 function observe(db,obs,now=Date.now()){
  const src=Signals.source(obs?.sourceId);
  if(!db||!src||!confidence.includes(obs.confidence))return {status:'ignored',points:0,record:null};
  const place=placePattern.test(obs.place||'')?obs.place:src.system;
  let r=db.records[src.id],status='repeat';
  if(!r){
   if(Object.keys(db.records).length>=limits.records)return {status:'ignored',points:0,record:null};
   r=db.records[src.id]={c:src.category,n:null,f:now,l:now,k:0,conf:'partial',places:[],aff:src.affiliation||null,p:0,u:'local'};status='new';
  }
  // A sighting is one encounter: continuous listening in the same place within a minute is the
  // same observation, not a new one.
  const moved=r.places[r.places.length-1]!==place;
  // Anything new about the source (a sighting or an identification) waits in the upload queue.
  if(status==='new'||moved||now-r.l>=limits.sightingGap){r.k=Math.min(r.k+1,1e6);r.u='pending';}
  r.l=Math.max(r.l,now);
  if(moved){r.places.push(place);if(r.places.length>limits.places)r.places.shift();}
  if(typeof obs.strength==='number'&&Number.isFinite(obs.strength))r.s=Math.round(Math.max(0,Math.min(1,obs.strength))*100)/100;
  let earned=0;
  if(obs.confidence==='confirmed'){
   r.conf='confirmed';r.n=src.name;
   // The point is awarded once, on the first confident identification.
   if(r.p!==1){r.p=1;earned=POINTS_PER_SOURCE;r.u='pending';if(status==='repeat')status='confirmed';}
  }
  return {status,points:earned,record:r};
 }
 // ---- Uploading to the Relay (§13–§14). Points never depend on it. ----
 function queue(db){return Object.entries(db?.records||{}).filter(([,r])=>r.u==='pending').sort((a,b)=>a[1].l-b[1].l).map(([id])=>id);}
 /* Takes up to `max` queued records for one transfer. The batch remembers what was sent, so a
    record that gains a new sighting while in transit stays queued for the next one. A transfer that
    is interrupted is simply never finished: its records are still pending (and nothing in-flight is
    saved), so nothing is lost and nothing is sent twice. */
 function beginUpload(db,max=10){return queue(db).slice(0,Math.max(0,max)).map(id=>({id,k:db.records[id].k,conf:db.records[id].conf}));}
 function finishUpload(db,batch){
  let sent=0;
  for(const b of batch||[]){const r=db?.records?.[b.id];if(r&&r.u==='pending'&&r.k===b.k&&r.conf===b.conf){r.u='uploaded';sent++;}}
  return sent;
 }
 /* Another pilot's scanner logged the player's ship and uploaded it. Without a scrambler the
    sighting is linked to the ship's identity; with one it is an unconfirmed contact that can't be
    tied to the others. Earlier sightings are never changed or removed. */
 function noteSighting(db,{place,time,scrambled}){
  if(!db)return null;const t=db.trail||=freshTrail();
  const entry={t:Number.isSafeInteger(time)&&time>0?time:0,place:placePattern.test(place||'')?place:'unknown',linked:scrambled?0:1};
  if(entry.linked)t.linked=Math.min(t.linked+1,1e6);else t.unlinked=Math.min(t.unlinked+1,1e6);
  t.recent.push(entry);if(t.recent.length>limits.trail)t.recent.shift();
  return entry;
 }
 // Validates a saved database; anything unknown or malformed is dropped, never trusted.
 function restore(raw){
  const db=fresh();if(!raw||typeof raw!=='object')return db;
  db.autoUpload=raw.autoUpload!==false;db.clock=Number.isSafeInteger(raw.clock)&&raw.clock>0?Math.min(raw.clock,1e9):0;
  for(const [id,r] of Object.entries(raw.records||{}).slice(0,limits.records)){
   const src=Signals.source(id);if(!src||!r||typeof r!=='object')continue;
   const f=Number.isSafeInteger(r.f)&&r.f>0?r.f:0,l=Number.isSafeInteger(r.l)&&r.l>=f?r.l:f;
   const conf=confidence.includes(r.conf)?r.conf:'partial';
   db.records[id]={c:src.category,n:conf==='confirmed'?src.name:null,f,l,k:Number.isSafeInteger(r.k)&&r.k>0?Math.min(r.k,1e6):1,conf,
    places:(Array.isArray(r.places)?r.places:[]).filter(p=>typeof p==='string'&&placePattern.test(p)).slice(-limits.places),
    // Records from before uploads existed ('local') join the queue.
    aff:src.affiliation||null,p:conf==='confirmed'&&r.p===1?1:0,u:r.u==='uploaded'?'uploaded':'pending',...(typeof r.s==='number'&&r.s>=0&&r.s<=1?{s:r.s}:{})};
  }
  const t=raw.trail,count=v=>Number.isSafeInteger(v)&&v>0?Math.min(v,1e6):0;
  if(t&&typeof t==='object')db.trail={linked:count(t.linked),unlinked:count(t.unlinked),
   recent:(Array.isArray(t.recent)?t.recent:[]).filter(e=>e&&typeof e==='object').slice(-limits.trail)
    .map(e=>({t:Number.isSafeInteger(e.t)&&e.t>0?e.t:0,place:placePattern.test(e.place||'')?e.place:'unknown',linked:e.linked===0?0:1}))};
  return db;
 }
 function summary(db){return {points:points(db),discoveries:discoveries(db),records:Object.keys(db?.records||{}).length,pending:queue(db).length};}
 const api={POINTS_PER_SOURCE,limits,uploads,fresh,pointsFor,points,discoveries,observe,queue,beginUpload,finishUpload,noteSighting,restore,summary};
 if(typeof module!=='undefined')module.exports=api;else root.VoidWarFlying=api;
})(globalThis);
