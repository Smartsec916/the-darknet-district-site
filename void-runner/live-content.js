/* PUBLISHED MISSION CONTENT for every player (browser only). Fetches the one live version from the server (GET live-content, public, read-only), checks it with
   the same rules the server used (mission-content.js check) and puts it over the shipped missions with the same adapter the Mission Editor's PLAY THIS DRAFT uses.
   FAIL SAFE: if the server is unreachable, switched off (404), or the record fails the check, the game keeps the shipped missions. An edited NPC line is shown in
   the dialogue window through renderLine (its old voice clip no longer matches, so it is shown as text, the game's existing behaviour for a line without a clip).
   Saved progress is mapped safely after any change (mission-content.js migrate: nothing is ever deleted from a save). A draft play replaces the live content for
   that throwaway session only and nothing of it is saved.
   NEW TREES (the owner's own mission trees, content.trees): their missions are ordinary mission records run by mission-content.js treeEvent. This file feeds it what
   happens: an NPC's TALK prompt (every interaction goes through VoidInteractions.handlers.get, wrapped here once, so handlers registered later are covered too), the place
   the player is standing in (twice a second), and a module bought (progression.js buy). The beginner campaign keeps its turn: when it is waiting on that same NPC, the
   NPC does what the beginner campaign says. Nothing happens outside a District campaign.
   THE MAIN STORYLINE (main-story.js, 17 Nov 2026) is always in force (the shipped tree, or the published copy of it): Mission 001 — Awakening starts when the player leaves the
   Sleeping Pod (podAct.exit in world-integration.js is wrapped here: the pod room itself is untouched), the V1 receives Admin's message (VoidV1.notify, personal-device.js),
   and talking to Admin plays his Mission 001 lines (David's, from the Mission Editor). Until David writes them, live players see no dialogue: the mission completes with its
   MISSION COMPLETE notice (the placeholder line is shown only in draft play). The beginner campaign is retired (beginner.js). */
(function(root){
 'use strict';
 const MC=root.VoidMissionContent;if(!MC||!root.VoidBeginner||!root.VoidMissions)return;
 const G=root.VoidMissionGivers,env={B:root.VoidBeginner,Missions:root.VoidMissions,U:root.VoidUniverse,givers:G?G.roster({people:root.VoidDistrictPeople?.npcs?.()||[],story:root.VoidStoryContent?.characters||{},temple:root.VoidTemple?.MODEL||{id:'zen-zephyr',name:'Zen Zephyr'}}):[]};MC.snapshot(env);MC.apply(null,env);   // the shipped main storyline runs from the start
 let current={version:0,source:'shipped',content:null,refused:null},lastState=null,draft=false;
 const ctx=()=>({registryIds:new Set(Object.keys(env.shipped.registry).filter(id=>env.shipped.registry[id]?.beginner!==true)),registryObjectives:Object.fromEntries(Object.entries(env.shipped.registry).map(([id,d])=>[id,new Set((d.objectives||[]).map(o=>o.id))])),
  speakers:new Set(Object.values(root.VoidStoryContent?.characters||{}).map(c=>c.name)),...treeCtx()});
 // What a new tree may name: NPCs with a TALK prompt, the places, items a store sells, travel places (mission-givers.js; the server checks the same lists).
 const treeCtx=()=>({givers:new Map(env.givers.map(g=>[g.id,g])),places:new Set((G?.PLACES||[]).map(p=>p.id)),items:new Set(Object.keys(G?G.buyable(root.VoidProgression?.modules):{})),locations:new Set(Object.keys(root.VoidUniverse?.locations||{})),ships:new Map(Object.entries(root.VoidShips?.ships||{}))});
 function use(content,source,version){
  const r=MC.apply(content,env,ctx());
  if(r.refused.length){MC.apply(null,env);current={version:0,source:'shipped',content:null,refused:r.refused};try{console.warn('[VOID//RUNNER] published missions refused; the shipped missions stay in force.',r.refused.slice(0,5));}catch{}return false;}
  current={version:version||0,source,content,refused:null};env.draft=source==='draft';lastState=null;migrateNow();return true;
 }
 function migrateNow(){
  if(typeof state==='undefined'||!state?.universe||state===lastState&&!draft)return;lastState=state;
  if(state.story?.flags?.missionPool!=='closed')return;   // only District campaigns hold beginner missions
  const acts=MC.migrate(state,env.B.RETIRED?[]:env.B.MISSIONS,env.B.flagOf,env.trees);   // the beginner campaign is retired: none of its missions are completed or paid here
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
 function useDraft(content){draft=true;env.draft=true;return use(content,'draft',0);}
 setInterval(()=>{try{migrateNow();}catch{}},4000);
 // ---------------------------------------------------------------- new trees in the running game
 const treesOn=()=>Array.isArray(env.trees)&&env.trees.length>0&&typeof state!=='undefined'&&state?.story?.flags?.missionPool==='closed'&&!!state.universe;
 const title=id=>root.VoidMissions?.definitions?.[id]?.title||id;
 // Names for the dialogue window: a tree's speaker who is not a story character yet gets a name card (as milked-integration.js does for Eva and Fish).
 try{const chars=root.VoidStoryContent?.characters;if(chars)for(const g of env.givers)if(g.canTalk&&/^[a-z]/.test(g.say)&&!chars[g.say])chars[g.say]={id:g.say,name:g.name,role:'',portrait:'art/characters.png',cell:'0% 0%',faction:'independent',tags:['mission-tree'],biography:''};}catch{}
 function report(r){
  if(!r||!(r.offered||r.objective||r.completed))return;const m=root.VoidMissions?.definitions?.[r.mission],parts=[];
  const key=(()=>{try{return VoidInput.label(VoidInput.bindings.missionLog||'KeyL');}catch{return 'L';}})(),def=root.VoidMissions?.definitions?.[r.mission];
  if(r.offered)parts.push('NEW MISSION · '+title(r.mission)+(def?.objective?' · OBJECTIVE: '+def.objective:'')+' (tracked in your V1, '+key+')');
  else if(r.completed){parts.push('MISSION COMPLETE · '+title(r.mission));if(r.reward)parts.push('+'+r.reward+' credits');}
  else{const o=m?.objectives?.find(x=>x.id===r.objective);parts.push('MISSION UPDATED · '+title(r.mission)+(o?' · '+o.label+' ✓':''));}
  parts.push(...r.notes);
  try{save();hud();}catch{}try{announce(parts.join('  ·  '));}catch{}
 }
 /* A mission that starts by notification reaches the device (personal-device.js VoidV1.notify: banner, the device's notification sound, unread count):
    messages: kept in Messages > INBOX; comms: a call in the Comms app (its words as a transcript; the voice plays only when a recorded clip exists for that exact line:
    nothing is generated); notify: the banner only. Every one also puts the mission in the Mission Log and tracks it (mission-content.js). */
 function deliver(r){for(const m of (r&&r.messages)||[]){try{const who=String(m.fromName||'').toUpperCase(),hint={text:'open',help:true};
  if(m.channel==='comms'){root.VoidV1?.notify?.({app:'comms',key:'call:'+m.id,from:m.fromName,text:'Incoming call from '+who,hint});
   // The call's voice: only a clip that already exists (voice-clips.js). Admin's ElevenLabs voice is not approved for new lines yet, so his calls are text for now.
   try{if(root.VoidVoiceClips?.has?.(m.from,m.text))root.VoidAudio?.speak?.(m.from,m.text);}catch{}}
  else if(m.channel==='notify')root.VoidV1?.notify?.({app:'missions',key:'note:'+m.id,from:m.fromName,text:(m.header||who)+' · '+String(m.text).replace(/\s+/g,' ').slice(0,90),hint});
  else root.VoidV1?.notify?.({app:'messages',sub:'inbox',key:'msg:'+m.id,from:m.fromName,header:m.header,text:'New message from '+who,hint});}catch{}}}
 // The NPC's lines; when the mission waits on a 'hear' step, closing the conversation completes it.
 const heard=r=>()=>{try{const x=MC.treeEvent(state,env,{type:'heard',mission:r.hear.mission},root.VoidMissions,root.C||root.VoidCampaign);report(x);deliver(x);}catch{}try{resumeWalking();}catch{}};
 const show=(lines,r)=>{try{talk('',lines.map(l=>MC.mapLine(env,l)),r&&r.hear?heard(r):()=>{try{resumeWalking();}catch{}},'CONTINUE');return true;}catch{return false;}};
 // The beginner campaign keeps its turn with the NPCs it uses.
 const BEGIN={admin:'talk-admin','district-iris':'talk-iris','district-bar':'visit-bar','district-shop':'visit-shop',terminal:'use-terminal'};
 function beginnerWants(action){const B=root.VoidBeginner,ev=BEGIN[action];if(!B||!ev||!B.applies(state))return false;const m=B.current(state),rec=m&&state.universe.missions?.[m.id];return !!(m&&m.objectives.some(o=>o.on===ev&&rec?.objectives?.[o.id]!==true));}
 function talkTo(action,arg,handler,self,args){
  const npcs=G?G.whoAt(env.givers,action,arg?.item?.character):[];
  if(!npcs.length||beginnerWants(action)||!MC.treeWants(state,env,npcs))return handler.apply(self,args);
  const r=MC.treeEvent(state,env,{type:'talk',npcs},root.VoidMissions,root.C||root.VoidCampaign);report(r);deliver(r);
  const lines=r.lines.length?r.lines:(r.early||[]);if(lines.length&&show(lines,r))return;
  if(r.mission){try{resumeWalking();}catch{}return;}
  return handler.apply(self,args);
 }
 if(root.VoidInteractions?.handlers&&G){const map=root.VoidInteractions.handlers,get=map.get.bind(map);let busy=false;
  map.get=function(action){const h=get(action);if(typeof h!=='function')return h;return function(arg){if(busy||!treesOn())return h.apply(this,arguments);busy=true;try{return talkTo(action,arg,h,this,arguments);}finally{busy=false;}};};}
 // The place the player is in (twice a second).
 setInterval(()=>{try{if(!treesOn()||!G||typeof mode==='undefined'||!['walking','dock','arrival'].includes(mode))return;
  const wl=typeof walkingLocation!=='undefined'?walkingLocation:null,places=G.placesNow({walk:wl?.id,area:wl?.area,quarter:wl?.quarter||state.story.flags.quarter,location:state.location,docked:true});
  if(mode==='walking'&&state.story.flags.podWakePending===true)return;   // still in the pod
  // also the moment for missions started by notification "after mission N" or "when a story flag is set" (checked on every event)
  const r=MC.treeEvent(state,env,{type:'place',places},root.VoidMissions,root.C||root.VoidCampaign);if(!(r.objective||r.offered))return;report(r);deliver(r);if(r.lines.length&&mode==='walking')show(r.lines,r);}catch{}},500);
 // A module bought at the outfitter or Admin's counter.
 if(root.VoidProgression?.buy){const P=root.VoidProgression,buy=P.buy;P.buy=function(s,id){const ok=buy.apply(this,arguments);try{if(ok&&typeof state!=='undefined'&&s===state&&treesOn())report(MC.treeEvent(state,env,{type:'buy',item:id},root.VoidMissions,root.C||root.VoidCampaign));}catch{}return ok;};}
 // Leaving the Sleeping Pod (EXIT POD): the one hook into the pod (world-integration.js podAct.exit is wrapped; the room and the music player are untouched).
 // Mission 001 starts on the first exit, or on the next exit for a character who left the pod before it existed. It never starts twice (its record stays in the save).
 function podExit(){try{if(!treesOn())return null;const r=MC.treeEvent(state,env,{type:'pod-exit'},root.VoidMissions,root.C||root.VoidCampaign);if(!(r.offered||r.objective))return r;report(r);deliver(r);return r;}catch{return null;}}
 try{if(typeof podAct!=='undefined'&&typeof podAct.exit==='function'){const exit=podAct.exit;podAct.exit=function(){const was=state?.story?.flags?.podWakePending===true,out=exit.apply(this,arguments);if(was&&state?.story?.flags?.podWakePending!==true)podExit();return out;};}}catch{}
 if(root.VoidNetwork?.request)refresh();
 const inbox=channel=>{try{return typeof state!=='undefined'&&state?MC.inbox(state,env,channel):[];}catch{return [];}};
 const markRead=id=>{try{if(MC.markRead(state,id)){try{save();}catch{}return true;}}catch{}return false;};
 root.VoidLiveContent={env,use,useDraft,refresh,podExit,inbox,markRead,get current(){return current;},get draft(){return draft;}};
})(globalThis);
