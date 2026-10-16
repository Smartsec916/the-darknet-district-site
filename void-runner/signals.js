/* Stable identities for everything WarFlying can detect (David's doc 11 §4 and §7). A source keeps
   the same id every time it is met, so a respawned ship or a revisited beacon is never "new" again.
   - Static emitters per system: stations and settlements (from universe.js), navigation beacons and
     communications satellites.
   - Ships come from a small fixed roster per system and role. Traffic and pirates draw their identity
     from it, so the same logical vessel reappears instead of an endless supply of new ones.
   Names are neutral registration codes, not story names. Pirates broadcast no name. Nothing here
   describes cargo or contents (§29). Rules only. */
(function(root){
 'use strict';
 const U=typeof module!=='undefined'?require('./universe.js'):root.VoidUniverse;
 const categories={
  civilian:'Civilian craft',cargo:'Cargo ship',passenger:'Passenger ship',police:'Police ship',military:'Military ship',pirate:'Pirate ship',
  communion:'Communion ship','natural-order':'Natural Order ship',station:'Station',settlement:'Settlement',beacon:'Navigation beacon',
  satellite:'Communications satellite',satcom:'Satellite link',installation:'Industrial installation',facility:'Remote facility',
  automated:'Automated equipment',transmitter:'Unidentified transmitter',anomaly:'Unusual emission'
 };
 const codes={erebus:'E',sol:'T','communion':'C','natural-order':'G'},systemNames={erebus:'ERB',sol:'TES',communion:'CAN','natural-order':'GAR'};
 const settlements=['vesper','earth','mars','nexus','order-homeworld'];
 // Role -> [category, registration prefix (null: no broadcast name), roster size, systems it appears in].
 const roles={
  civilian:['civilian','CIV',6],cargo:['cargo','FRT',8],passenger:['passenger','PSG',4],pirate:['pirate',null,6],
  police:['police','PATROL',4,['sol']]
 };
 const idPattern=/^[a-z]+:[a-z0-9-]{1,48}$/;
 // Small deterministic hash so registration numbers are stable across sessions.
 function hash(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
 const systemsList=()=>Object.keys(U.systems);
 function staticSources(system){
  if(!U.systems[system])return [];
  const code=systemNames[system],out=[];
  for(const [id,l] of Object.entries(U.locations))if(U.system(id)===system)
   out.push({id:'station:'+id,category:settlements.includes(id)?'settlement':'station',name:l.name||id,system,location:id,affiliation:l.ownerFaction||null});
  for(let n=1;n<=3;n++)out.push({id:'beacon:'+system+'-'+n,category:'beacon',name:'NAV '+code+'-'+n,system,affiliation:null});
  for(let n=1;n<=2;n++)out.push({id:'satellite:'+system+'-'+n,category:'satellite',name:'COMSAT '+code+'-'+n,system,affiliation:null});
  return out;
 }
 function roster(system,role){
  const r=roles[role];if(!r||!U.systems[system]||(r[3]&&!r[3].includes(system)))return [];
  const [category,prefix,size]=r,out=[];
  for(let n=1;n<=size;n++){
   const number=100+hash(system+'|'+role+'|'+n)%900;
   out.push({id:'ship:'+system+'-'+role+'-'+n,category,name:prefix?(role==='police'?'TESSALY '+prefix+' '+n:prefix+'-'+codes[system]+number):null,system,affiliation:role==='police'?'sol-local':role==='pirate'?'pirate':null});
  }
  return out;
 }
 // The faction ships in the border battles (faction-battle.js layouts) are the same crews each time.
 function battleSource(faction,index,className){
  if(!['communion','natural-order'].includes(faction))return null;
  return {id:'ship:battle-'+faction+'-'+index,category:className?.startsWith('communion')?'communion':'natural-order',name:null,system:faction,affiliation:className?.startsWith('communion')?'communion':'natural-order'};
 }
 // Picks a roster vessel for a spawn. Returns null when this system has no such role.
 function pick(system,role,rng=Math.random){const list=roster(system,role);return list.length?list[Math.floor(rng()*list.length)%list.length]:null;}
 // Looks up any known source by id; unknown ids (or malformed ones) are not sources.
 let index=null;
 function source(id){
  if(typeof id!=='string'||!idPattern.test(id))return null;
  index??=new Map(all().map(s=>[s.id,s]));
  if(index.has(id))return index.get(id);
  const b=/^ship:battle-(communion|natural-order)-(\d{1,2})$/.exec(id);return b?battleSource(b[1],Number(b[2]),b[1]==='communion'?'communion-lancer':'order-brawler'):null;
 }
 // Every source that can ever exist: the ceiling on WarFlying points.
 function all(){return systemsList().flatMap(system=>[...staticSources(system),...Object.keys(roles).flatMap(role=>roster(system,role))]);}
 const api={categories,roles,idPattern,staticSources,roster,battleSource,pick,source,all};
 if(typeof module!=='undefined')module.exports=api;else root.VoidSignals=api;
})(globalThis);
