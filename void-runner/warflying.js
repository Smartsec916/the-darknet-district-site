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
 const limits={records:2000,places:6,text:48};
 const confidence=['partial','confirmed'],uploads=['local','pending','uploaded'];
 const placePattern=/^[a-z0-9][a-z0-9:>-]{0,47}$/;
 function fresh(){return {version:1,records:{},autoUpload:true};}
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
  r.k=Math.min(r.k+1,1e6);r.l=Math.max(r.l,now);
  if(r.places[r.places.length-1]!==place){r.places.push(place);if(r.places.length>limits.places)r.places.shift();}
  if(typeof obs.strength==='number'&&Number.isFinite(obs.strength))r.s=Math.round(Math.max(0,Math.min(1,obs.strength))*100)/100;
  let earned=0;
  if(obs.confidence==='confirmed'){
   r.conf='confirmed';r.n=src.name;
   // The point is awarded once, on the first confident identification.
   if(r.p!==1){r.p=1;earned=POINTS_PER_SOURCE;if(status==='repeat')status='confirmed';}
  }
  return {status,points:earned,record:r};
 }
 // Validates a saved database; anything unknown or malformed is dropped, never trusted.
 function restore(raw){
  const db=fresh();if(!raw||typeof raw!=='object')return db;
  db.autoUpload=raw.autoUpload!==false;
  for(const [id,r] of Object.entries(raw.records||{}).slice(0,limits.records)){
   const src=Signals.source(id);if(!src||!r||typeof r!=='object')continue;
   const f=Number.isSafeInteger(r.f)&&r.f>0?r.f:0,l=Number.isSafeInteger(r.l)&&r.l>=f?r.l:f;
   const conf=confidence.includes(r.conf)?r.conf:'partial';
   db.records[id]={c:src.category,n:conf==='confirmed'?src.name:null,f,l,k:Number.isSafeInteger(r.k)&&r.k>0?Math.min(r.k,1e6):1,conf,
    places:(Array.isArray(r.places)?r.places:[]).filter(p=>typeof p==='string'&&placePattern.test(p)).slice(-limits.places),
    aff:src.affiliation||null,p:conf==='confirmed'&&r.p===1?1:0,u:uploads.includes(r.u)?r.u:'local',...(typeof r.s==='number'&&r.s>=0&&r.s<=1?{s:r.s}:{})};
  }
  return db;
 }
 function summary(db){return {points:points(db),discoveries:discoveries(db),records:Object.keys(db?.records||{}).length,pending:Object.values(db?.records||{}).filter(r=>r.u==='pending').length};}
 const api={POINTS_PER_SOURCE,limits,fresh,pointsFor,points,discoveries,observe,restore,summary};
 if(typeof module!=='undefined')module.exports=api;else root.VoidWarFlying=api;
})(globalThis);
