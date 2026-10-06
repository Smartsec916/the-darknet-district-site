/* Shared sensor definitions. Each flight owns its own mutable sensor state. */
(function(root){
 'use strict';
 const profiles={standard:{range:280,passiveRange:75,sensitivity:1,acquisition:1.5,lockQuality:1,emissions:1}};
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
 function create(profile='standard'){return {radar:true,profile:{...(profiles[profile]||profiles.standard)},weapons:0,signature:{radar:1,engines:0,weapons:0,electronics:.25,total:1.25}};}
 function step(s,dt,{throttle=0,firing=false}={}){s.weapons=firing?1:Math.max(0,s.weapons-Math.max(0,dt)*.35);const radar=s.radar?s.profile.emissions:0,engines=clamp(throttle,0,1)*.8,weapons=s.weapons*1.4,electronics=s.radar?.25:.08;s.signature={radar,engines,weapons,electronics,total:radar+engines+weapons+electronics};return s.signature;}
 function range(s){return s.radar?s.profile.range:s.profile.passiveRange;}
 function detects(s,contact){if(!contact||contact.dead)return false;const signature=contact.signature?.total??1.5;return Math.hypot(contact.x,contact.y,contact.z)<=range(s)*s.profile.sensitivity*Math.sqrt(Math.max(.08,signature)/1.5);}
 function detectableAt(signature,observer=profiles.standard){return observer.range*observer.sensitivity*Math.sqrt(Math.max(.08,signature.total)/1.5);}
 const api={profiles,create,step,range,detects,detectableAt};if(typeof module!=='undefined')module.exports=api;else root.VoidSensors=api;
})(globalThis);
