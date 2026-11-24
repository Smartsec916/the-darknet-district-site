/* A FOLLOW / LEAD STEP'S PERSON COMES THROUGH WITH THE PLAYER (the owner, 20 Nov 2026: a follow step did not carry the person through a city gate, or up / down the stairwells
   between the street and the tunnels: "I need this fixed. whether it's walking or in a taxi"). Browser only; the rules are npc-escort.js (links, across, arrival, rideAlong).
   Every change of walking area goes through enterWalking (a gate's walkers' lane or taxi bay: ncz-gate-transit.js; the stairs: ncz-underground-integration.js; the District's
   and Milked's vestibules: district-transition.js, milked-transition.js). Wrapped here, BEFORE the old place is released: for each running follow / lead / cab step whose
   person is with the player in the place being left, npc-escort.js across() decides:
     with      she comes through too: AHEAD of the player when she leads (out of the far door, at the top of the stairs, inside the checkpoint), BEHIND when she follows
               (inside the lane, on the landing); the step goes on from there (live-content.js setCarry: the plan's area and her resume point)
     ride      she sits in the player's taxi through a gate's bay: in her seat in the next quarter, out with the player at the stop
     stay      she was too far behind (or the player went on without her): she stays where she is in that area; the arrow leads back to her (mission-guide.js)
     fail      a "Follow them" player went further than "lost" with "the mission fails"
     refused   she may not go there (Milked for Reverie / Lace / anyone not marked adult, the Corporate District and the Temple, the cat inside or down into the tunnels):
               she stops at the door / gate and says so; never a silent loss
   Multiplayer: as before, each player's own copy of the street pair and made characters; nothing is sent. Saves: nothing new (story.flags.npcEsc's x / z, written by setCarry). */
(function(root){
 'use strict';
 if(typeof document==='undefined'||typeof enterWalking==='undefined')return;
 const E=()=>root.VoidNPCEscort,LC=()=>root.VoidLiveContent,AR=()=>root.VoidNPCAreas;
 const log=[];
 // The walking areas of the place being entered (npc-areas.js), and whether it is a far place beyond a gate (the Corporate District, the Temple)
 function target(id,o){o=o||{};const K=root.VoidDistrictArea?.KEY||{},A=AR(),Q=root.VoidQuarters;if(!A)return {areas:[],far:false};
  if(id===K.street){let q=Q&&Q.valid&&Q.valid(o.quarter)?o.quarter:null;try{if(!q&&root.VoidGateTransitRules&&Q)q=root.VoidGateTransitRules.resolve(Q,o,typeof state!=='undefined'?state:null);}catch{}return {areas:q?A.here('street',q):[],far:false};}
  if(id===K.interior)return {areas:A.here('interior'),far:false};
  if(root.VoidMilked&&id===root.VoidMilked.KEY)return {areas:A.here('milked'),far:false};
  let d=null;try{d=VoidExplorationData.locations[id];}catch{}return {areas:[],far:!!(d&&(d.corporate||d.temple))};}
 // The walking areas of the place the player stands in now
 function here(){const L=typeof walkingLocation!=='undefined'?walkingLocation:null,A=AR();if(!L||!A||L.apartment||L.modular||L.id!=='neochinatown')return [];
  return L.area==='street'?A.here('street',L.quarter||null):L.area==='interior'?A.here('interior'):L.area==='milked'?A.here('milked'):[];}
 const pick=(areas,p)=>{const A=AR();if(!areas.length)return null;const a=p&&A?A.areaOf(p,areas[0]):null;return a&&areas.includes(a)?a:areas[0];};
 // Who is with the player now: every running escort plan whose person's figure is in this scene: {npc, plan, x, z, yaw, phase, ride}
 function present(){const out=[];let plans={};try{plans=LC()?.plans?.()||{};}catch{}const sp=root.VoidStreetPair?.live?.()||null,mk=root.VoidMadeNPCs?.live?.()||null;
  for(const [npc,P] of Object.entries(plans)){if(!P||P.mode!=='escort')continue;let s=null;
   if(sp&&sp.escort)for(const e of Object.values(sp.escort))if(e&&e.key===P.key&&e.here&&e.npc===npc)s=e;
   if(!s&&mk&&Array.isArray(mk.people)){const p=mk.people.find(q=>q.id===npc&&q.esc&&q.esc.key===P.key);if(p)s=p.esc;}
   if(s)out.push({npc,plan:P,x:s.x,z:s.z,yaw:s.yaw||0,phase:s.phase,ride:s.ride||null});}
  return out;}
 function decide(id,o){const R=E(),C=LC(),A=AR();if(!R||!R.across||!C||!A||typeof walker==='undefined'||!walker)return;
  const from=here();if(!from.length)return;const people=present();if(!people.length)return;
  const t=target(id,o),me={x:walker.x,z:walker.z},fromArea=pick(from,me),sp=Array.isArray(o&&o.spawn)?{x:o.spawn[0],z:o.spawn[2],yaw:Number.isFinite(o.yaw)?o.yaw:0}:null,toArea=pick(t.areas,sp);
  if(toArea&&toArea===fromArea)return;   // the same area again (a recovery, a re-lay)
  const riding=!!root.VoidRoadTaxi?.crossing,link=toArea&&!riding?R.linkBetween(fromArea,toArea,me):null;
  for(const h of people){const P=h.plan,M=(root.VoidNPCPaths?.MOVABLE||{})[h.npc]||{},who=h.npc===root.VoidStreetPair?.CAT_ID?'The cat':M.name||'They';
   // Ordinary escorts are local until the checked, opted-in multi-leg route is wired. Keep the last
   // actual position even when the player enters an unregistered interior; do not use mission transfer.
   if(P.social){if(P.area!==fromArea||!Number.isFinite(h.x)||!Number.isFinite(h.z))continue;
    C.setCarry(h.npc,{key:P.step,area:fromArea,x:+h.x.toFixed(2),z:+h.z.toFixed(2),yaw:h.yaw,phase:P.kind==='follow-them'?'wait':'paused',ride:null});
    log.push({npc:h.npc,step:P.step,from:fromArea,to:toArea,via:link?link.id:null,go:'stay',dist:+Math.hypot(h.x-me.x,h.z-me.z).toFixed(1),at:Date.now()});if(log.length>30)log.shift();continue;}
   const place=P.kind==='follow-them'?'ahead':'behind',inCab=h.ride==='in-cab'||h.phase==='in-cab';
   const at=riding?(sp?{x:sp.x,z:sp.z,yaw:sp.yaw}:null):R.arrival(link,toArea,place,sp);
   const check=link&&link.ends[toArea]?link.ends[toArea].ahead:at&&A.nearest?A.nearest(at,toArea,4)||at:at;
   const allowed=toArea?R.mayEnter(h.npc,toArea,riding?null:check):{ok:false,why:who+' stays in the city: '+(M.cat?'it waits':'she waits')+' for you at the gate.'};
   const d=Math.hypot(h.x-me.x,h.z-me.z),r=R.across({kind:P.kind,set:P.set,npc:h.npc,from:fromArea,to:toArea,herArea:P.area||fromArea,dist:d,riding,inCab,allowed,farScene:t.far});
   log.push({npc:h.npc,step:P.step,from:fromArea,to:toArea,via:link?link.id:null,go:r.go,dist:+d.toFixed(1),at:Date.now()});if(log.length>30)log.shift();
   const stay=()=>C.setCarry(h.npc,{key:P.step,area:fromArea,x:+h.x.toFixed(2),z:+h.z.toFixed(2),yaw:h.yaw,phase:P.kind==='follow-them'&&h.phase==='walk'?'wait':h.phase,ride:null});
   if(r.go==='with'&&at)C.setCarry(h.npc,{key:P.step,area:toArea,x:at.x,z:at.z,yaw:at.yaw,phase:P.kind==='follow-them'?'wait':h.phase,ride:null,via:link?link.id:null});
   else if(r.go==='ride'&&at)C.setCarry(h.npc,{key:P.step,area:toArea,x:at.x,z:at.z,yaw:at.yaw,phase:R.CAB.has(P.kind)?'in-cab':h.phase,ride:R.CAB.has(P.kind)?null:'in-cab'});
   else if(r.go==='fail'){try{C.onEscort({npc:h.npc,key:P.key,step:P.step,kind:P.kind,event:'failed',phase:'failed',x:h.x,z:h.z});}catch{}}
   else if(r.go==='refused'){stay();try{C.onEscort({npc:h.npc,key:P.key,step:P.step,kind:P.kind,event:'across',text:r.why||(who+' waits for you here.'),phase:h.phase,x:h.x,z:h.z});}catch{}}
   else if(r.go==='stay'&&(toArea||t.far))stay();}
  try{C.replan();}catch{}}
 const prev=enterWalking;
 enterWalking=async function(id,options){try{decide(id,options||{});}catch(e){try{console.warn('[escort across]',e);}catch{}}const r=await prev.apply(this,arguments);try{LC()?.replan?.();}catch{}return r;};
 root.VoidEscortAcross={log:()=>log.slice(),target,here,present};
})(globalThis);
