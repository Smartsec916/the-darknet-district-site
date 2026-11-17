/* PUBLISHED MISSION CONTENT for every player (browser only). Fetches the one live version from the server (GET live-content, public, read-only), checks it with
   the same rules the server used (mission-content.js check) and puts it over the shipped missions with the same adapter the Mission Editor's PLAY THIS DRAFT uses.
   FAIL SAFE: if the server is unreachable, switched off (404), or the record fails the check, the game keeps the shipped missions. An edited NPC line is shown in
   the dialogue window through renderLine (its old voice clip no longer matches, so it is shown as text, the game's existing behaviour for a line without a clip).
   Saved progress is mapped safely after any change (mission-content.js migrate: nothing is ever deleted from a save). A draft play replaces the live content for
   that throwaway session only and nothing of it is saved. */
(function(root){
 'use strict';
 const MC=root.VoidMissionContent;if(!MC||!root.VoidBeginner||!root.VoidMissions)return;
 const env={B:root.VoidBeginner,Missions:root.VoidMissions};MC.snapshot(env);
 let current={version:0,source:'shipped',content:null,refused:null},lastState=null,draft=false;
 const ctx=()=>({registryIds:new Set(Object.keys(env.shipped.registry).filter(id=>env.shipped.registry[id]?.beginner!==true)),registryObjectives:Object.fromEntries(Object.entries(env.shipped.registry).map(([id,d])=>[id,new Set((d.objectives||[]).map(o=>o.id))])),
  speakers:new Set(Object.values(root.VoidStoryContent?.characters||{}).map(c=>c.name))});
 function use(content,source,version){
  const r=MC.apply(content,env,ctx());
  if(r.refused.length){MC.apply(null,env);current={version:0,source:'shipped',content:null,refused:r.refused};try{console.warn('[VOID//RUNNER] published missions refused; the shipped missions stay in force.',r.refused.slice(0,5));}catch{}return false;}
  current={version:version||0,source,content,refused:null};lastState=null;migrateNow();return true;
 }
 function migrateNow(){
  if(typeof state==='undefined'||!state?.universe||state===lastState&&!draft)return;lastState=state;
  if(state.story?.flags?.missionPool!=='closed')return;   // only District campaigns hold beginner missions
  const acts=MC.migrate(state,env.B.MISSIONS,env.B.flagOf);
  if(acts.length&&!root.VoidDevTest?.active){try{save();}catch{}}
 }
 // Edited lines are put over the words just before they are shown (every conversation goes through talk() → renderLine()).
 if(typeof renderLine==='function'){const shown=renderLine;renderLine=function(){try{if(typeof speech!=='undefined'&&speech&&Array.isArray(speech.lines))speech.lines=speech.lines.map(l=>MC.mapLine(env,l));}catch{}return shown.apply(this,arguments);};}
 async function refresh(){
  if(draft||root.VoidDevTest?.active)return current;
  try{const d=await root.VoidNetwork.request('live-content');if(draft)return current;if(d&&Number.isInteger(d.version)&&d.version>0&&d.content)use(d.content,'live',d.version);else use(null,'shipped',0);}
  catch{/* unreachable or switched off: the shipped missions stay */}
  return current;
 }
 // Draft play (owner only, throwaway session): the draft replaces whatever is live until the page reloads.
 function useDraft(content){draft=true;return use(content,'draft',0);}
 setInterval(()=>{try{migrateNow();}catch{}},4000);
 if(root.VoidNetwork?.request)refresh();
 root.VoidLiveContent={env,use,useDraft,refresh,get current(){return current;},get draft(){return draft;}};
})(globalThis);
