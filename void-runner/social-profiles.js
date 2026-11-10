/* Shared presentation data for local NPCs and future authenticated players. No network authority lives here. */
(function(root){
 const safe=s=>String(s??'').slice(0,200);
 function player(id,name,details={}){return {key:'player:'+safe(id),kind:'player',name:safe(name)||'Local Pilot',portrait:details.portrait||null,bio:safe(details.bio)||'District visitor',stats:details.stats||{},achievements:details.achievements||[],actions:['message','friend','block','report']};}
 function npc(id,name,details={}){return {key:'npc:'+safe(id),kind:'npc',name:safe(name),portrait:details.portrait||null,bio:safe(details.bio)||'District resident',stats:details.stats||{},achievements:details.achievements||[],actions:['converse']};}
 const api={player,npc};if(typeof module==='object'&&module.exports)module.exports=api;else root.VoidSocialProfiles=api;
})(typeof globalThis!=='undefined'?globalThis:this);
