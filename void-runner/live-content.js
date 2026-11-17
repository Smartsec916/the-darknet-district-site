/* PUBLISHED MISSION CONTENT for every player (browser only). Fetches the one live version from the server (GET live-content, public, read-only), checks it with
   the same rules the server used (mission-content.js check) and puts it over the shipped missions with the same adapter the Mission Editor's PLAY THIS DRAFT uses.
   FAIL SAFE: if the server is unreachable, switched off (404), or the record fails the check, the game keeps the shipped missions. An edited NPC line is shown in
   the dialogue window through renderLine (its old voice clip no longer matches, so it is shown as text, the game's existing behaviour for a line without a clip).
   Saved progress is mapped safely after any change (mission-content.js migrate: nothing is ever deleted from a save). A draft play replaces the live content for
   that throwaway session only and nothing of it is saved.
   NEW TREES (the owner's own mission trees, content.trees): their missions are ordinary mission records run by mission-content.js treeEvent. This file feeds it what
   happens: an NPC's TALK prompt (every interaction goes through VoidInteractions.handlers.get, wrapped here once, so handlers registered later are covered too), the place
   the player is standing in (twice a second), and a module bought (progression.js buy). The beginner campaign keeps its turn: when it is waiting on that same NPC, the
   NPC does what the beginner campaign says. Nothing happens outside a District campaign. */
(function(root){
 'use strict';
 const MC=root.VoidMissionContent;if(!MC||!root.VoidBeginner||!root.VoidMissions)return;
 const G=root.VoidMissionGivers,env={B:root.VoidBeginner,Missions:root.VoidMissions,U:root.VoidUniverse,givers:G?G.roster({people:root.VoidDistrictPeople?.npcs?.()||[],story:root.VoidStoryContent?.characters||{},temple:root.VoidTemple?.MODEL||{id:'zen-zephyr',name:'Zen Zephyr'}}):[]};MC.snapshot(env);
 let current={version:0,source:'shipped',content:null,refused:null},lastState=null,draft=false;
 const ctx=()=>({registryIds:new Set(Object.keys(env.shipped.registry).filter(id=>env.shipped.registry[id]?.beginner!==true)),registryObjectives:Object.fromEntries(Object.entries(env.shipped.registry).map(([id,d])=>[id,new Set((d.objectives||[]).map(o=>o.id))])),
  speakers:new Set(Object.values(root.VoidStoryContent?.characters||{}).map(c=>c.name)),...treeCtx()});
 // What a new tree may name: NPCs with a TALK prompt, the places, items a store sells, travel places (mission-givers.js; the server checks the same lists).
 const treeCtx=()=>({givers:new Map(env.givers.map(g=>[g.id,g])),places:new Set((G?.PLACES||[]).map(p=>p.id)),items:new Set(Object.keys(G?G.buyable(root.VoidProgression?.modules):{})),locations:new Set(Object.keys(root.VoidUniverse?.locations||{})),ships:new Map(Object.entries(root.VoidShips?.ships||{}))});
 function use(content,source,version){
  const r=MC.apply(content,env,ctx());
  if(r.refused.length){MC.apply(null,env);current={version:0,source:'shipped',content:null,refused:r.refused};try{console.warn('[VOID//RUNNER] published missions refused; the shipped missions stay in force.',r.refused.slice(0,5));}catch{}return false;}
  current={version:version||0,source,content,refused:null};lastState=null;migrateNow();return true;
 }
 function migrateNow(){
  if(typeof state==='undefined'||!state?.universe||state===lastState&&!draft)return;lastState=state;
  if(state.story?.flags?.missionPool!=='closed')return;   // only District campaigns hold beginner missions
  const acts=MC.migrate(state,env.B.MISSIONS,env.B.flagOf,env.trees);
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
 // ---------------------------------------------------------------- new trees in the running game
 const treesOn=()=>Array.isArray(env.trees)&&env.trees.length>0&&typeof state!=='undefined'&&state?.story?.flags?.missionPool==='closed'&&!!state.universe;
 const title=id=>root.VoidMissions?.definitions?.[id]?.title||id;
 // Names for the dialogue window: a tree's speaker who is not a story character yet gets a name card (as milked-integration.js does for Eva and Fish).
 try{const chars=root.VoidStoryContent?.characters;if(chars)for(const g of env.givers)if(g.canTalk&&/^[a-z]/.test(g.say)&&!chars[g.say])chars[g.say]={id:g.say,name:g.name,role:'',portrait:'art/characters.png',cell:'0% 0%',faction:'independent',tags:['mission-tree'],biography:''};}catch{}
 function report(r){
  if(!r||!(r.offered||r.objective||r.completed))return;const m=root.VoidMissions?.definitions?.[r.mission],parts=[];
  if(r.offered)parts.push('NEW MISSION · '+title(r.mission)+' (tracked in your V1, L)');
  else if(r.completed){parts.push('MISSION COMPLETE · '+title(r.mission));if(r.reward)parts.push('+'+r.reward+' credits');}
  else{const o=m?.objectives?.find(x=>x.id===r.objective);parts.push('MISSION UPDATED · '+title(r.mission)+(o?' · '+o.label+' ✓':''));}
  parts.push(...r.notes);
  try{save();hud();}catch{}try{announce(parts.join('  ·  '));}catch{}
 }
 const show=(lines)=>{try{talk('',lines.map(l=>MC.mapLine(env,l)),()=>{try{resumeWalking();}catch{}},'CONTINUE');return true;}catch{return false;}};
 // The beginner campaign keeps its turn with the NPCs it uses.
 const BEGIN={admin:'talk-admin','district-iris':'talk-iris','district-bar':'visit-bar','district-shop':'visit-shop',terminal:'use-terminal'};
 function beginnerWants(action){const B=root.VoidBeginner,ev=BEGIN[action];if(!B||!ev||!B.applies(state))return false;const m=B.current(state),rec=m&&state.universe.missions?.[m.id];return !!(m&&m.objectives.some(o=>o.on===ev&&rec?.objectives?.[o.id]!==true));}
 function talkTo(action,arg,handler,self,args){
  const npcs=G?G.whoAt(env.givers,action,arg?.item?.character):[];
  if(!npcs.length||beginnerWants(action)||!MC.treeWants(state,env,npcs))return handler.apply(self,args);
  const r=MC.treeEvent(state,env,{type:'talk',npcs},root.VoidMissions,root.C||root.VoidCampaign);report(r);
  const lines=r.lines.length?r.lines:(r.early||[]);if(lines.length&&show(lines))return;
  if(r.mission){try{resumeWalking();}catch{}return;}
  return handler.apply(self,args);
 }
 if(root.VoidInteractions?.handlers&&G){const map=root.VoidInteractions.handlers,get=map.get.bind(map);let busy=false;
  map.get=function(action){const h=get(action);if(typeof h!=='function')return h;return function(arg){if(busy||!treesOn())return h.apply(this,arguments);busy=true;try{return talkTo(action,arg,h,this,arguments);}finally{busy=false;}};};}
 // The place the player is in (twice a second).
 setInterval(()=>{try{if(!treesOn()||!G||typeof mode==='undefined'||!['walking','dock','arrival'].includes(mode))return;
  const wl=typeof walkingLocation!=='undefined'?walkingLocation:null,places=G.placesNow({walk:wl?.id,area:wl?.area,quarter:wl?.quarter||state.story.flags.quarter,location:state.location,docked:true});if(!places.length)return;
  const r=MC.treeEvent(state,env,{type:'place',places},root.VoidMissions,root.C||root.VoidCampaign);if(!r.objective)return;report(r);if(r.lines.length&&mode==='walking')show(r.lines);}catch{}},500);
 // A module bought at the outfitter or Admin's counter.
 if(root.VoidProgression?.buy){const P=root.VoidProgression,buy=P.buy;P.buy=function(s,id){const ok=buy.apply(this,arguments);try{if(ok&&typeof state!=='undefined'&&s===state&&treesOn())report(MC.treeEvent(state,env,{type:'buy',item:id},root.VoidMissions,root.C||root.VoidCampaign));}catch{}return ok;};}
 if(root.VoidNetwork?.request)refresh();
 root.VoidLiveContent={env,use,useDraft,refresh,get current(){return current;},get draft(){return draft;}};
})(globalThis);
