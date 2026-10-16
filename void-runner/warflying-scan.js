/* WarFlying passive scanning and the in-universe leaderboard (David's doc 11 §5 and §17). Rules only.
   - The scanner listens; it never pings. A ship is heard according to its own emissions: the
     quieter it runs, the closer you must be. Near the edge of hearing a contact is only "partial"
     (logged, no point) until it is heard clearly. It never reveals a ship that can't be heard.
   - Fixed emitters (stations, beacons, satellites) are passed along a route. Each route passes its
     own subset, so new routes and new systems turn up new signals.
   - The leaderboard's rivals are fictional and advance slowly with play time; they stay beatable. */
(function(root){
 'use strict';
 const U=typeof module!=='undefined'?require('./universe.js'):root.VoidUniverse;
 const Signals=typeof module!=='undefined'?require('./signals.js'):root.VoidSignals;
 const config={interval:.5,range:220,confirmShare:.7,passShare:3};
 const hash=text=>{let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;};
 // How far away a source with this emission level can be heard at all.
 function hearingRange(signature){return config.range*Math.sqrt(Math.max(.08,Number(signature)||0)/1.5);}
 // null: not heard. 'partial': heard, identity not established. 'confirmed': clearly identified.
 function classify(distance,signature){const r=hearingRange(signature);return !(distance<=r)?null:distance<=r*config.confirmShare?'confirmed':'partial';}
 // Fixed emitters passed on a route, each at a point along it (0..1). Stations: the origin as you
 // leave, the destination as you arrive. Beacons and satellites: about a third of each system's,
 // chosen per route; the origin system's in the first half, the destination's in the second.
 function routeSources(origin,destination){
  if(!U.locations[origin]||!U.locations[destination])return [];
  const key=origin+'>'+destination,a=U.system(origin),b=U.system(destination),out=[];
  const station=id=>Signals.source('station:'+id);
  if(station(origin))out.push({source:station(origin),at:.02});
  for(const [system,from,span] of a===b?[[a,.1,.8]]:[[a,.05,.4],[b,.55,.4]])
   for(const s of Signals.staticSources(system).filter(s=>s.category==='beacon'||s.category==='satellite'))
    if(hash(key+'|'+s.id)%config.passShare===0)out.push({source:s,at:from+(hash(s.id+'|'+key)%1000)/1000*span});
  if(station(destination))out.push({source:station(destination),at:.98});
  return out.sort((x,y)=>x.at-y.at);
 }
 // Emitters passed while the route moved from progress `from` to `to`.
 function passed(origin,destination,from,to){return routeSources(origin,destination).filter(p=>p.at>from&&p.at<=to);}
 // Which roster a moving contact belongs to.
 function role(contact){
  if(contact?.relationship==='hostile')return 'pirate';
  if(contact?.traffic)return contact.role==='cargo arrival'||contact.className==='hauler'?'cargo':contact.className==='shuttle'?'passenger':'civilian';
  return null;
 }

 // ---- Leaderboard: fictional rivals (doc 11 §17). [name, starting points, play-minutes per point, ceiling]
 const rivals=[['GhostVector',48,40,118],['SignalWraith',36,50,104],['EchoNine',24,60,90],['VoidWalker',14,75,76],['RiftRunner',6,90,62]];
 function leaderboard(clockSeconds,playerPoints,playerName='YOU'){
  const minutes=Math.max(0,Number(clockSeconds)||0)/60;
  const rows=rivals.map(([name,start,per,cap])=>({name,points:Math.min(cap,start+Math.floor(minutes/per)),player:false}));
  rows.push({name:playerName,points:playerPoints,player:true});
  // Ties: the rival who got there first stays ahead.
  return rows.sort((x,y)=>y.points-x.points||(x.player?1:y.player?-1:0)).map((r,i)=>({...r,rank:i+1}));
 }
 const api={config,hearingRange,classify,routeSources,passed,role,rivals,leaderboard};
 if(typeof module!=='undefined')module.exports=api;else root.VoidWarFlyingScan=api;
})(globalThis);
