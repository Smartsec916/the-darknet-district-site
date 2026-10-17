/* Communications with The Relay (David's doc 11 §12–§15, §21). Rules only.
   - The satellite link is separate from radar and scanning: losing it never stops the ship seeing,
     scanning or recording locally. It only decides whether records can be uploaded.
   - Default coverage (decision 4, 2026-10-16): connected in every system, disconnected while in warp
     between systems.
   - Regions: a future mission can change one system's link with setRegion() (a story flag), without
     touching the scanner. Nothing in the game does that yet.
   - Location policy: The Darknet District's premises carry no Relay broadcasts, no WarFlying
     collection and no uploads. Music, arcade, pods, private comms and the store are not affected. */
(function(root){
 'use strict';
 const U=typeof module!=='undefined'?require('./universe.js'):root.VoidUniverse;
 const states=['connected','degraded','disconnected','unavailable'];
 const labels={connected:'CONNECTED',degraded:'WEAK SIGNAL',disconnected:'NO SIGNAL',unavailable:'OFFLINE'};
 // An upload sends a batch, then takes a moment to be acknowledged. A weak link sends less, slower.
 const transfer={connected:{batch:10,seconds:1.5},degraded:{batch:3,seconds:4}};
 // Per place and whether the player is on foot there. Only what is listed is restricted.
 const policies={
  district:{name:'The Darknet District',relay:false,collection:false,uploads:false}
 };
 // On foot at NeoChinatown ('earth') is The Darknet District, as the music and radio treat it.
 function premises(location,onFoot){return onFoot&&location==='earth'?'district':null;}
 // May this activity ('relay', 'collection' or 'uploads') happen here?
 function allows(location,onFoot,activity){const p=policies[premises(location,onFoot)];return !p||p[activity]!==false;}
 const regionFlag=system=>'comms-'+system;
 // Future missions: set a system's link ('degraded', 'disconnected', 'unavailable'), or null to restore it.
 function setRegion(s,system,value){
  if(!U.systems[system]||!s?.story?.flags)return false;
  if(value===null||value==='connected'){delete s.story.flags[regionFlag(system)];return true;}
  if(!states.includes(value))return false;s.story.flags[regionFlag(system)]=value;return true;
 }
 // ctx: {route (flight route or null), onFoot}. Returns {state, reason, system}.
 function status(s,ctx={}){
  const route=ctx.route;
  if(!allows(s?.location,ctx.onFoot,'uploads'))return {state:'unavailable',reason:'premises',system:U.system(s.location)};
  if(route&&U.locations[route.origin]&&U.locations[route.destination]){
   const a=U.system(route.origin),b=U.system(route.destination);
   if(route.phase==='warp'&&a!==b)return {state:'disconnected',reason:'warp',system:null};
  }
  const system=route&&U.locations[route.origin]?U.system((route.progress||0)<.5?route.origin:route.destination):s?.universe?.currentSystem||U.system(s?.location)||'erebus';
  const set=s?.story?.flags?.[regionFlag(system)];
  if(states.includes(set)&&set!=='connected')return {state:set,reason:'region',system};
  return {state:'connected',reason:null,system};
 }
 const canUpload=st=>!!transfer[st?.state||st];
 const api={states,labels,transfer,policies,premises,allows,setRegion,status,canUpload};
 if(typeof module!=='undefined')module.exports=api;else root.VoidComms=api;
})(globalThis);
