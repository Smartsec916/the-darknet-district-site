'use strict';
// Developer-only preflight for an ordinary NPC returning to its routine.
// Deliberately not a runtime controller: never grants gate access or changes actor state.
const A=require('../void-runner/npc-areas.js');
const E=require('../void-runner/npc-escort.js');
const point=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.z);
const copy=p=>({x:p.x,z:p.z});
const hold=reason=>({status:'hold',reason,points:[]});
function validateCandidate(from,to,area,points,opts={}){
 if(!point(from)||!point(to)||!A.get(area))return false;
 if(![from,to].every(p=>{const c=A.check(p,area,undefined,opts);return c.ok&&c.area===area;}))return false;
 if(!Array.isArray(points)||!points.length||!points.every(point))return false;
 const end=points[points.length-1];
 if(end.x!==to.x||end.z!==to.z)return false;
 return points.every((p,i)=>A.leg(i?points[i-1]:from,p,opts).length===0);
}
function preflight(from,to,area,opts={}){
 if(!point(from)||!point(to)||!A.get(area))return hold('invalid-position-or-area');
 for(const p of [from,to]){
  const c=A.check(p,area,undefined,opts);
  if(!c.ok||c.area!==area)return hold('endpoint-not-authorized-in-area');
 }
 if(from.x===to.x&&from.z===to.z)return {status:'arrived',points:[]};
 const b=copy(to);
 const candidates=[[b],[{x:b.x,z:from.z},b],[{x:from.x,z:b.z},b]];
 for(const route of candidates)if(validateCandidate(from,to,area,route,opts))return {status:'ready',points:route.map(copy)};
 // walkRoute may produce a kerb/road shortcut or an invalid shortened leg.
 // Never use route()'s unverified straight-line fallback for autonomous return.
 const route=E.walkRoute(from,to,area);
 return validateCandidate(from,to,area,route,opts)?{status:'ready',points:route.map(copy)}:hold('no-verified-pedestrian-route');
}
module.exports={preflight,validateCandidate};
