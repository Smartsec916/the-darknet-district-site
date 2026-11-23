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
   and talking to Admin plays his Mission 001 lines (the owner's, from the Mission Editor). Until the owner writes them, live players see no dialogue: the mission completes with its
   MISSION COMPLETE notice (the placeholder line is shown only in draft play). The beginner campaign is retired (beginner.js).
   MISSION 002 — EYES ON THE STREET (17 Nov 2026) added: the offer with ACCEPT / NOT NOW (talk-choice.js), the named places of places.js in the place tick (with each
   player's own enter / leave events: VoidPlaces.tracker), a step's lines sent as a Comms call, photo captures (device-camera.js calls photo()) and photos sent in
   Messages (personal-device.js calls sendPhoto()).
   MISSION 003 — CORPORATE CONNECTIONS (17 Nov 2026) added: a line by the V1 translator ('v1-translator') straight after another speaker's line is shown UNDER that line as
   V1 TRANSLATION and its recording plays over it (voice-clips.js `with`), the speaker's gesture on a step's last line (main-story.js GESTURES; Eva toward the staff-only door),
   the V1 contact and the Social follow (a small V1 banner when the conversation closes), and the IN-GAME CLOCK (game-clock.js; story.flags.gameMin) with the
   follow-ups it makes due (main-story.js FOLLOWUPS: Fish's call is a STUB, only the event 'fish-followup-due' fires: window event 'void-tree-event').
   "WHEN WALKED NEAR" (18 Nov 2026): a mission started by notification with the trigger {kind:'near', npc, distance} starts when the player comes within that many metres
   of the person's TALK prompt (its position: walkingLocation.interactions, so people who move, Reverie and Lace, are measured where they are). nearTick, four times a
   second, only while walking: never in a conversation (one floating over walking included: VoidConversationUI.isOpen) or a cutscene (any other mode), the character creator, the KeyMap, the pod card or a draft that has not started. */
(function(root){
 'use strict';
 const MC=root.VoidMissionContent;if(!MC||!root.VoidBeginner||!root.VoidMissions)return;
 const G=root.VoidMissionGivers,env={B:root.VoidBeginner,Missions:root.VoidMissions,U:root.VoidUniverse,givers:G?G.roster({people:root.VoidDistrictPeople?.npcs?.()||[],story:root.VoidStoryContent?.characters||{},temple:root.VoidTemple?.MODEL||{id:'zen-zephyr',name:'Zen Zephyr'}}):[]};MC.snapshot(env);MC.apply(null,env);   // the shipped main storyline runs from the start
 let current={version:0,source:'shipped',content:null,refused:null},lastState=null,draft=false;
 const ctx=()=>({registryIds:new Set(Object.keys(env.shipped.registry).filter(id=>env.shipped.registry[id]?.beginner!==true)),registryObjectives:Object.fromEntries(Object.entries(env.shipped.registry).map(([id,d])=>[id,new Set((d.objectives||[]).map(o=>o.id))])),
  speakers:new Set(Object.values(root.VoidStoryContent?.characters||{}).map(c=>c.name)),...treeCtx()});
 // What a new tree may name: NPCs with a TALK prompt, the places, items a store sells, travel places (mission-givers.js; the server checks the same lists).
 const treeCtx=()=>({givers:new Map(env.givers.map(g=>[g.id,g])),places:G?.placeIds?G.placeIds():new Set((G?.PLACES||[]).map(p=>p.id)),subjects:new Set((G?.photoSubjects?.(env.givers)||[]).map(g=>g.id)),items:new Set(Object.keys(G?G.buyable(root.VoidProgression?.modules):{})),locations:new Set(Object.keys(root.VoidUniverse?.locations||{})),ships:new Map(Object.entries(root.VoidShips?.ships||{}))});
 function use(content,source,version){
  const r=MC.apply(content,env,ctx());
  if(r.refused.length){MC.apply(null,env);try{root.VoidVoiceImports?.use([]);}catch{}current={version:0,source:'shipped',content:null,refused:r.refused};try{console.warn('[VOID//RUNNER] published missions refused; the shipped missions stay in force.',r.refused.slice(0,5));}catch{}return false;}
  current={version:version||0,source,content,refused:null};env.draft=source==='draft';try{root.VoidVoiceImports?.use(env.clips,{draft:source==='draft',givers:env.givers,interactions:Object.values(env.interactions||{}).flatMap(r=>r.clips||[])});}catch{}lastState=null;migrateNow();return true;   // Ordinary audio is scoped independently of mission lines.
 }
 function migrateNow(){
  if(typeof state==='undefined'||!state?.universe||state===lastState&&!draft)return;lastState=state;
  if(state.story?.flags?.missionPool!=='closed')return;   // only District campaigns hold beginner missions
  const acts=MC.migrate(state,env.B.RETIRED?[]:env.B.MISSIONS,env.B.flagOf,env.trees);   // the beginner campaign is retired: none of its missions are completed or paid here
  if(acts.length&&!root.VoidDevTest?.active){try{save();}catch{}}
 }
 // Edited lines are put over the words just before they are shown (every conversation goes through talk() → renderLine()).
 if(typeof renderLine==='function'){const shown=renderLine;renderLine=function(){try{if(typeof speech!=='undefined'&&speech&&Array.isArray(speech.lines))speech.lines=speech.lines.map(l=>MC.mapLine(env,l));}catch{}const out=shown.apply(this,arguments);
  // a translated line: the translation under the original, labelled V1 TRANSLATION (it fades in as the translator's voice starts)
  try{const l=speech&&speech.lines[speech.index],t=l&&l.translation,sp=typeof document!=='undefined'?document.getElementById('spoken-text'):null;if(t&&sp&&!document.querySelector('[data-v1-translation]')){const p=document.createElement('p');p.className='v1-translation';p.dataset.v1Translation='1';
   const lab=document.createElement('span');lab.textContent='V1 TRANSLATION';const tx=document.createElement('span');tx.className='v1-translation-text';tx.textContent=t.text;p.append(lab,tx);sp.after(p);
   const sr=document.querySelector('.speech-body .sr-only');if(sr)sr.textContent+=' V1 translation: '+t.text;}}catch{}
  gestureNow();lineAnim();return out;};}
 if(typeof renderLine==='function'){const r0=renderLine;renderLine=function(){if(lineWaitStart()){const out=r0.apply(this,arguments);try{speech.shown=1;updateSpeech(0);}catch{}return out;}return r0.apply(this,arguments);};}   // a line's wait: render "…" first (LINE TIMERS below)
 try{if(typeof document!=='undefined'&&!document.getElementById('v1-translation-style')){const st=document.createElement('style');st.id='v1-translation-style';
  st.textContent='.v1-translation{margin:.55em 0 0;padding:.45em .7em;border-left:2px solid #39d0ff;background:rgba(10,30,40,.55);color:#cfefff;font-size:.95em;line-height:1.45;animation:v1tr .5s ease .7s both}.v1-translation>span:first-child{display:block;font:700 10px/1.4 ui-monospace,Consolas,monospace;letter-spacing:.18em;color:#39d0ff;margin-bottom:.2em}@keyframes v1tr{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:none}}@media (prefers-reduced-motion:reduce){.v1-translation{animation:none}}';document.head.appendChild(st);}}catch{}
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
 const needAt={};
 function report(r){
  if(!r)return;if(r.need&&!(r.offered||r.objective||r.completed)){const k=r.mission+'/'+r.need,t=Date.now();if(t-(needAt[k]||0)<30000)return;needAt[k]=t;try{announce('YOU NEED '+r.need+' CR'+(r.mission?' · '+title(r.mission):''));}catch{}return;}   // a cost the player cannot pay yet (said at most every 30 s)
  if(!(r.offered||r.objective||r.completed||r.started))return;const m=root.VoidMissions?.definitions?.[r.mission],parts=[];
  const key=(()=>{try{return VoidInput.label(VoidInput.bindings.missionLog||'KeyL');}catch{return 'L';}})(),def=root.VoidMissions?.definitions?.[r.mission];
  if(r.offered)parts.push('NEW MISSION · '+title(r.mission)+(def?.objective?' · OBJECTIVE: '+def.objective:'')+' (tracked in your V1, '+key+')');
  else if(r.completed){parts.push('MISSION COMPLETE · '+title(r.mission));if(r.reward)parts.push('+'+r.reward+' credits');}
  else if(r.objective){const o=m?.objectives?.find(x=>x.id===r.objective);parts.push('MISSION UPDATED · '+title(r.mission)+(o?' · '+o.label+' ✓':''));}
  parts.push(...r.notes);
  try{save();hud();}catch{}try{announce(parts.join('  ·  '));}catch{}
 }
 /* A mission that starts by notification reaches the device (personal-device.js VoidV1.notify: banner, the device's notification sound, unread count):
    messages: kept in Messages > INBOX; comms: a call in the Comms app (its words as a transcript; the voice plays only when a recorded clip exists for that exact line:
    nothing is generated); notify: the banner only. Every one also puts the mission in the Mission Log and tracks it (mission-content.js). */
 function deliver(r){for(const m of (r&&r.messages)||[]){try{const who=String(m.fromName||'').toUpperCase(),hint={text:'open',help:true};
  if(m.channel==='comms'){root.VoidV1?.notify?.({app:'comms',sub:'call',key:'call:'+m.id,from:m.fromName,text:'Incoming call from '+who,hint:{text:'answer',help:true}});
   // The call's voice: only a clip that already exists (voice-clips.js). Admin's ElevenLabs voice is not approved for new lines yet, so his calls are text for now.
   try{if(root.VoidVoiceClips?.has?.(m.from,m.text))root.VoidAudio?.speak?.(m.from,m.text);}catch{}}
  else if(m.channel==='notify')root.VoidV1?.notify?.({app:'missions',key:'note:'+m.id,from:m.fromName,text:[m.header||who,String(m.text||'').replace(/\s+/g,' ').trim().slice(0,90)].filter(Boolean).join(' · '),hint});   // a walk-near start with a header and no body: the header alone
  else root.VoidV1?.notify?.({app:'messages',sub:'inbox',key:'msg:'+m.id,from:m.fromName,header:m.header,text:'New message from '+who,hint});}catch{}}}
 // The NPC's lines; when the mission waits on a 'hear' step, closing the conversation completes it.
 /* A line by the V1 translator straight after another speaker's line becomes that line's translation: one line on screen (the original, then V1 TRANSLATION), and
    the original's recording carries the translation's recording over it (voice-clips.js). */
 const TRANSLATOR='v1-translator';
 function merge(lines){const out=[];for(const l of lines||[]){const prev=out[out.length-1];if(l&&l.who===TRANSLATOR&&prev&&prev.who!=='You'&&prev.who!==TRANSLATOR&&!prev.translation){out[out.length-1]={...prev,translation:{who:TRANSLATOR,text:l.text}};continue;}out.push(l);}return out;}
 const MSx=()=>root.VoidMainStory;
 // the speaker's gesture on the last line of a step (main-story.js GESTURES): Eva turns toward the staff-only door as she says where Fish is
 function gestureNow(){try{const g=typeof speech!=='undefined'&&speech?speech.gesture:null;if(!g||speech.gestured||speech.index!==speech.lines.length-1)return;speech.gestured=true;root.VoidBabylon?.zone?.gesture?.(g.who,g.toward,g.seconds);}catch{}}
 /* A line's animation (npc-gestures.js; "While saying this, <NPC> does: ..."): played on the speaker as the line shows, once per line, then she goes back to her own behaviour. */
 const NG=()=>root.VoidNPCGestures;
 function lineAnim(){try{const l=typeof speech!=='undefined'&&speech?speech.lines[speech.index]:null;if(!l||!l.anim||!l.npc||speech.animAt===speech.index)return;speech.animAt=speech.index;
  NG()?.perform(l.npc,l.anim,l.animFor||NG().lineSeconds(l.text),{plan:(env.npcPlans||{})[l.npc]||null});}catch{}}
 /* LINE TIMERS (mission-content.js TIME): `wait` seconds before a line shows (the conversation shows "…" meanwhile and cannot be skipped past it) and `show` seconds after a
    line has appeared before the conversation goes on by itself (never past a choice). Both count only while the game runs (not in the pause menu or a hidden tab). */
 const lineHeld=()=>typeof speech!=='undefined'&&!!speech&&!!speech.waiting;
 function lineWaitStart(){try{if(typeof speech==='undefined'||!speech||speech.waiting)return false;const i=speech.index,l=speech.lines[i];if(!l||!(l.wait>0)||speech.waitedAt===i)return false;
  speech.waiting={index:i,left:l.wait*1000,line:l,last:performance.now()};speech.lines[i]={who:l.who,text:'…',silent:true,player:true};return true;}catch{return false;}}
 if(typeof advanceSpeech==='function'){const adv=advanceSpeech;advanceSpeech=function(){if(lineHeld())return;return adv.apply(this,arguments);};}
 if(typeof tickSpeech==='function'){const tk=tickSpeech;tickSpeech=function(){if(lineHeld())return;return tk.apply(this,arguments);};}
 if(typeof speakLine==='function'){const sp=speakLine;speakLine=function(){try{const l=speech&&speech.lines[speech.index];if(l&&(l.player||l.silent)){root.VoidAudio?.cancel?.();speech.readyAt=null;speech.voice={index:speech.index,at:performance.now(),started:false,ended:false,clip:false};return;}}catch{}return sp.apply(this,arguments);};}   // the player has no voice
 let lineT=performance.now();
 setInterval(()=>{const now=performance.now(),dt=Math.min(10000,now-lineT);lineT=now;try{if(typeof speech==='undefined'||!speech)return;const w=speech.waiting;if(w){const d=Math.min(dt,now-w.last);w.last=now;if((typeof mode!=='undefined'&&mode==='pause')||document.hidden)return;
  if(w.index!==speech.index){speech.waiting=null;return;}w.left-=d;if(w.left>0)return;speech.lines[w.index]=w.line;speech.waitedAt=w.index;speech.waiting=null;renderLine();return;}
  if((typeof mode!=='undefined'&&mode==='pause')||document.hidden)return;const l=speech.lines[speech.index];if(!l||!(l.show>0)||speech.shown<l.text.length||document.querySelector('#screen .choice-menu,[data-talk-choice]')||document.getElementById('speech-next')?.style.display==='none')return;
  if(speech.showFor!==speech.index){speech.showFor=speech.index;speech.showLeft=l.show*1000;speech.showLast=now;}speech.showLeft-=Math.min(dt,now-speech.showLast);speech.showLast=now;if(speech.showLeft<=0){speech.showFor=-1;advanceSpeech();}}catch{}},100);
 /* ANIMATION STEPS (mission-content.js animNow): when one is the step in progress and no conversation is open, the NPC plays the clip; `hold` seconds later the step is done. */
 const animRun={};
 function animTick(){try{if(!treesOn()||typeof mode==='undefined'||!['walking','dock','arrival'].includes(mode)||(typeof speech!=='undefined'&&speech)||root.VoidConversationUI?.isOpen)return;
  const now=Date.now(),list=MC.animNow(state,env);for(const k of Object.keys(animRun))if(!list.some(a=>a.key===k))delete animRun[k];
  for(const a of list){let r=animRun[a.key];if(!r){r=animRun[a.key]={at:now};NG()?.perform(a.npc,a.clip,Math.max(1,a.hold||0)+.5,{plan:(env.npcPlans||{})[a.npc]||null});}
   if(now-r.at<(a.hold||0)*1000)continue;delete animRun[a.key];const x=MC.treeEvent(state,env,{type:'anim',step:a.key},root.VoidMissions,root.C||root.VoidCampaign);report(x);deliver(x);if(x.lines&&x.lines.length)show(x.lines,x);return;}}catch{}}
 setInterval(animTick,250);
 /* STEP TIMERS (mission-content.js timersNow): a step's "delay before it starts" and a wait step count down only while the player is in the world: never in the pause menu,
    a conversation, a menu, the Sleeping Pod's wake-up, the character creator or the KeyMap (nearBlocked), nor in a hidden tab. A wait step "only while the player stays
    within N m of <NPC>" counts only while they are that close. The seconds left are kept in story.flags, so a reload resumes the countdown. */
 let timerT=performance.now(),timerSaved=0;const timerLeft={};
 // (21 Nov 2026) a call step's delay also counts in the cockpit and waits for the call before it to be heard (mission-content.js timerRuns)
 function uiBusy(){try{return !!root.VoidConversationUI?.isOpen||state?.story?.flags?.podWakePending===true||!!root.VoidCharacterCreator?.isOpen||!!root.VoidKeyMapUI?.open;}catch{return true;}}
 function callBusy(){try{const c=root.VoidV1?.call,n=root.VoidVoiceClips?.now;return !!(c&&!c.ended)||!!(n&&!n.ended);}catch{return false;}}
 function timerTick(){const now=performance.now(),dt=Math.min(10000,now-timerT)/1000;timerT=now;try{if(!treesOn()||(typeof document!=='undefined'&&document.hidden))return;
  const list=MC.timersNow(state,env);for(const k of Object.keys(timerLeft))if(!list.some(x=>x.key+'|'+x.kind===k))delete timerLeft[k];
  const ctx={hidden:false,blocked:nearBlocked(),busy:uiBusy(),mode:typeof mode==='undefined'?'':mode,callBusy:callBusy()};
  for(const x of list){if(MC.timerRuns?!MC.timerRuns(x,ctx):ctx.blocked)continue;const id=x.key+'|'+x.kind;if(!(id in timerLeft))timerLeft[id]=x.left;
   if(x.near){const d=giverDistance(x.npc,walkingLocation,walker.x,walker.z);if(!(d<=x.near))continue;}
   timerLeft[id]=Math.max(0,timerLeft[id]-dt);MC.timerSet(state,x,timerLeft[id]);
   if(timerLeft[id]>0){if(Date.now()-timerSaved>5000&&!root.VoidDevTest?.active){timerSaved=Date.now();try{save();}catch{}}continue;}
   delete timerLeft[id];const r=MC.treeEvent(state,env,x.kind==='wait'?{type:'wait',step:x.key}:{type:'timer'},root.VoidMissions,root.C||root.VoidCampaign);report(r);deliver(r);try{save();}catch{}
   if(r.lines&&r.lines.length&&show(r.lines,r))return;}}catch{}}
 setInterval(timerTick,250);
 /* ACCEPT / DENY IN THE MIDDLE OF A MISSION (mission-content.js ASK_STEP / askNow; the owner, 19 Nov 2026): when an "Ask the player" step is the one in progress and no
 conversation, menu, pod wake-up, creator or KeyMap is open, the question shows in the choice window with the owner's buttons (a price on ACCEPT shows as a cost card; too few
 credits: ACCEPT greyed, "YOU NEED N CR"). The mission waits until the player answers; closed without an answer, it asks again a few seconds later. */
 const askShown={};let askOpen=null;
 function askTick(){try{if(askOpen&&!(typeof speech!=='undefined'&&speech))askOpen=null;if(!treesOn()||nearBlocked()||askOpen||(typeof speech!=='undefined'&&speech)||typeof root.talkChoice!=='function'||[...document.querySelectorAll('#screen .choice-menu,[data-talk-choice]')].some(n=>n.getClientRects().length))return;   // only a choice on screen (a window closed without an answer leaves its hidden buttons)
  const list=MC.askNow(state,env);if(!list.length)return;const a=list[0],now=Date.now();if(now-(askShown[a.key]||0)<4000)return;openAsk(a);}catch{askOpen=null;}}
 /* The choice window of an ask (a.lines: its question; lead: the lines just said that lead into it, for a player reply that is a choice: the buttons then sit on the last of
    them, in the same window). A price shows as a cost card, credits the player gets as a reward card. */
 function openAsk(a,lead){try{askShown[a.key]=Date.now();const M=root.VoidMissions,Cp=root.C||root.VoidCampaign;
  const pick=yes=>()=>{askOpen=null;let x=null;try{x=MC.treeEvent(state,env,{type:yes?'ask-yes':'ask-no',step:a.key},M,Cp);}catch{}if(!x){try{resumeWalking();}catch{}return;}
   if(x.ended){try{announce('MISSION ENDED · '+title(x.mission)+(x.refund?'  ·  +'+x.refund+' credits back':''));save();hud();}catch{}}else if(x.back){const o=root.VoidMissions?.definitions?.[x.mission]?.objectives?.find(y=>y.id===x.back);try{announce('MISSION UPDATED · '+title(x.mission)+' · back to: '+(o?o.label:x.back));save();hud();}catch{}}else report(x);
   deliver(x);if(followUp(x))return;try{resumeWalking();}catch{}};
  const yes={label:a.ask.accept,run:pick(true)},no={label:a.ask.decline,run:pick(false)},choices=a.afford?[yes,no]:[no,{label:yes.label+' · YOU NEED '+a.need+' CR',disabled:true,run:()=>{}}];
  const o=a.price&&!a.paid?{mission:a.mission,title:a.title,description:'',cost:a.price,costWhen:'accept',yes:a.ask.accept,need:a.need}:a.gain?{mission:a.mission,title:a.title,description:'',reward:a.gain,yes:a.ask.accept}:null;askOpen=a.key;
  const ls=lead&&lead.length?lead:a.lines;if(!root.talkChoice(merge(ls.map(l=>MC.mapLine(env,l))),choices,'',o?{offer:o}:{})){askOpen=null;return false;}if(typeof speech!=='undefined'&&speech)speech.askStep=a.key;return true;}catch{askOpen=null;return false;}}
 /* A player reply that is a choice (mission-content.js CHOICE: an inline ask right after the step whose lines were just said). */
 function inlineAsk(r){try{if(!r||!r.mission||!treesOn())return null;return MC.askNow(state,env).find(a=>a.inline&&a.mission===r.mission)||null;}catch{return null;}}
 setInterval(askTick,250);
 /* After the conversation: the V1 banner for a contact added / a profile followed (the Mission Log notice already said it). */
 function contactBanner(r){try{const n=(r&&r.notes||[]).filter(x=>/ADDED TO CONTACTS|^FOLLOWING /.test(x));if(!n.length)return;const who=n[0].replace(/ ADDED TO CONTACTS$| ON SOCIAL$/,'').replace(/^FOLLOWING /,'');
  const name=who.charAt(0)+who.slice(1).toLowerCase();root.VoidV1?.notify?.({app:'social',key:'contact:'+r.mission+':'+who,from:name,text:name+' added to contacts · following on Social',hint:{text:'open',help:true}});lastContact={text:name+' added to contacts · following on Social',at:Date.now()};}catch{}}
 let lastContact=null;
 const heard=r=>()=>{try{const x=MC.treeEvent(state,env,{type:'heard',mission:r.hear.mission},root.VoidMissions,root.C||root.VoidCampaign);report(x);deliver(x);if(x.lines&&x.lines.length&&show(x.lines,x))return;}catch{}try{resumeWalking();}catch{}};   // (20 Nov 2026) the next 'hear' step's lines follow in the same conversation
 const show=(lines,r)=>{try{{const a=inlineAsk(r);if(a&&openAsk(a,lines))return true;}   // the lines lead into the player's choice: its buttons on the last line
  const after=r&&r.hear?heard(r):()=>{try{resumeWalking();}catch{}};talk('',merge(lines.map(l=>MC.mapLine(env,l))),()=>{after();contactBanner(r);},'CONTINUE');
  const g=r&&r.mission&&MSx()?.GESTURES?.[r.mission+'/'+r.objective];if(g&&typeof speech!=='undefined'&&speech){speech.gesture=g;gestureNow();}return true;}catch{return false;}};
 /* An offer with ACCEPT / DENY (talk-choice.js; the owner's labels, default ACCEPT / DENY): the window shows the mission's name, short description and its cost or reward
    (r.offer, mission-content.js offerOf). ACCEPT takes the mission (Mission Log, tracked, the arrow) and charges a cost at ACCEPT once; when the player has too few credits
    ACCEPT is greyed ("YOU NEED N CR") and DENY is the main button. DENY: mission-content.js MONEY (offered again, never, or another mission instead) and the owner's
    DENY lines if any. Without the choice window (it failed to load) the offer is not shown and nothing is taken. */
 function ask(r){if(typeof root.talkChoice!=='function'||!r.lines.length)return false;const a=r.ask,o=r.offer||null,M=root.VoidMissions,Cp=root.C||root.VoidCampaign;
  const pick=type=>()=>{let x=null;try{x=MC.treeEvent(state,env,{type,mission:a.mission},M,Cp);report(x);deliver(x);if(x&&x.declined)declined(x);}catch{}if(x&&followUp(x))return;try{resumeWalking();}catch{}};
  const yes={label:a.accept||'ACCEPT',run:pick('accept')},no={label:a.decline||'DENY',run:pick('decline')};
  const choices=o&&o.afford===false?[no,{label:yes.label+' · YOU NEED '+o.need+' CR',disabled:true,run:()=>{}}]:[yes,no];
  return root.talkChoice(merge(r.lines.map(l=>MC.mapLine(env,l))),choices,'',o?{offer:o}:{});}
 /* DENY said: one short notice of when it comes back (the mission's DENY setting). */
 function declined(x){try{const w=x.denyWait,t=title(x.mission);announce('DECLINED · '+t+(Number.isInteger(w)?' · offered again after '+w+' min of play':w==='pod'?' · offered again after you next leave your Sleeping Pod':x.deny==='never'?' · it will not be offered again':x.deny==='start'?'':''));save();}catch{}}
 /* After a choice: the DENY lines, another mission offered instead (in person or on the device), or nothing. */
 function followUp(x){if(x.ask&&ask(x))return true;if(x.prompt){const p={...x.prompt,lines:[...(x.lines||[]),...x.prompt.lines]};if(offerPrompt(p,true))return true;}if(x.lines&&x.lines.length&&!x.ask&&show(x.lines,x))return true;return false;}
 /* An offer that arrives on the device and asks ACCEPT / DENY (Messages, Comms, a banner, walked near): a banner, then the choice window with the notification's words.
    Never over a conversation or a menu; an offer closed without a choice comes back after a minute while its trigger still holds. */
 const promptAt={};
 function offerPrompt(p,force){try{if(!p||!p.ask||typeof root.talkChoice!=='function'||!(p.lines||[]).length)return false;const id=p.ask.mission,now=Date.now();
  if(!force&&(now-(promptAt[id]||0)<60000||nearBlocked()||(typeof speech!=='undefined'&&speech)))return false;promptAt[id]=now;
  try{root.VoidV1?.notify?.({app:'missions',key:'offer:'+id+':'+now,from:p.fromName,text:'Mission offer · '+p.ask.title,hint:{text:'open',help:true}});}catch{}
  return ask({ask:p.ask,offer:p.offer,lines:p.lines});}catch{return false;}}
 // The beginner campaign keeps its turn with the NPCs it uses.
 const BEGIN={admin:'talk-admin','district-iris':'talk-iris','district-bar':'visit-bar','district-shop':'visit-shop',terminal:'use-terminal'};
 function beginnerWants(action){const B=root.VoidBeginner,ev=BEGIN[action];if(!B||!ev||!B.applies(state))return false;const m=B.current(state),rec=m&&state.universe.missions?.[m.id];return !!(m&&m.objectives.some(o=>o.on===ev&&rec?.objectives?.[o.id]!==true));}
 const ordinaryTalkCounts=new Map();
 function ordinaryTalk(npcs){for(const id of npcs){const r=env.interactions?.[id];if(!r?.talk)continue;const i=ordinaryTalkCounts.get(id)||0;ordinaryTalkCounts.set(id,i+1);const speaker=env.givers.find(g=>g.id===id)?.say||id,lines=[{who:speaker,text:MC.interactionLine(r.talk,i),ambient:true}],close=()=>{try{resumeWalking();}catch{}};if(r.choice&&r.reply&&typeof root.talkChoice==='function')return root.talkChoice(lines,[{label:r.choice,run:()=>show([{who:speaker,text:MC.interactionLine(r.reply,i),ambient:true}],null)},{label:'LEAVE',leave:true,run:close}],'');return show(lines,null);}return false;}
 function talkTo(action,arg,handler,self,args){
  const npcs=G?G.whoAt(env.givers,action,arg?.item?.character):[];
  if(!npcs.length||beginnerWants(action))return handler.apply(self,args);
  if(!treesOn()||!MC.treeWants(state,env,npcs)){if(ordinaryTalk(npcs))return;return handler.apply(self,args);}
  const r=MC.treeEvent(state,env,{type:'talk',npcs},root.VoidMissions,root.C||root.VoidCampaign);report(r);deliver(r);
  if(r.ask&&ask(r))return;if(r.need&&r.mission){try{resumeWalking();}catch{}return;}   // a step that costs: "YOU NEED N CR" (report) and nothing else happens
  const lines=r.lines.length?r.lines:(r.early||[]);if(lines.length&&show(lines,r))return;
  if(r.mission){try{resumeWalking();}catch{}return;}
  return handler.apply(self,args);
 }
 if(root.VoidInteractions?.handlers&&G){const map=root.VoidInteractions.handlers,get=map.get.bind(map);let busy=false;
  map.get=function(action){const h=get(action);if(typeof h!=='function')return h;return function(arg){if(busy||(!treesOn()&&!Object.keys(env.interactions||{}).length))return h.apply(this,arguments);busy=true;try{return talkTo(action,arg,h,this,arguments);}finally{busy=false;}};};}
 // The place the player is in (twice a second): the "go to" places (mission-givers.js) and every named place of places.js the player stands in, with this player's own
 // enter / leave events (a tracker per page: nothing fires twice; a menu, the pod card or a vestibule exchange changes nothing, so walking through it never fires a leave
 // and an enter again). A step "enter NULL" that starts while the player is already in NULL is done on the next tick.
 const tracker=root.VoidPlaces?.tracker?.()||null;let lastPlaces=[];
 const where=()=>{try{const wl=typeof walkingLocation!=='undefined'?walkingLocation:null;if(!wl||typeof walker==='undefined'||!walker)return null;return {scene:wl.id,x:walker.x,y:Number.isFinite(walker.y)?walker.y:undefined,z:walker.z};}catch{return null;}};
 setInterval(()=>{try{if(!treesOn()||!G||typeof mode==='undefined'||!['walking','dock','arrival'].includes(mode))return;
  const wl=typeof walkingLocation!=='undefined'?walkingLocation:null;let places=G.placesNow({walk:wl?.id,area:wl?.area,quarter:wl?.quarter||state.story.flags.quarter,location:state.location,docked:true});
  if(mode==='walking'&&state.story.flags.podWakePending===true)return;   // still in the pod
  const ch=mode==='walking'&&tracker?tracker.update(where()):{entered:[],left:[],inside:tracker?tracker.inside:[]};places=[...new Set([...places,...ch.inside])];lastPlaces=places;
  if(ch.entered.length||ch.left.length)try{root.dispatchEvent?.(new CustomEvent('void-place',{detail:{entered:ch.entered,left:ch.left,inside:ch.inside}}));}catch{}
  // also the moment for missions started by notification "after mission N" or "when a story flag is set" (checked on every event)
  const apt=root.VoidApartments?.inside?.()||null;   // the mission apartment the player is in ("Go into apartment X" steps)
  const mod=apt?(root.VoidApartments?.insideMod?.()||null):null;   // the room of a modular location (modules.js) the player is in ("Go into <module>")
  const r=MC.treeEvent(state,env,{type:'place',places,entered:ch.entered,left:ch.left,apt,mod},root.VoidMissions,root.C||root.VoidCampaign);if(r.need)report(r);if(!(r.objective||r.offered)){if(r.prompt)offerPrompt(r.prompt);return;}report(r);deliver(r);if(r.lines.length&&mode==='walking')show(r.lines,r);}catch{}},500);
 /* A photo was taken (device-camera.js). meta: what the camera judged at the moment of capture {subjects:[{id,valid}], during, place}. A valid photo of the person a
    photo step names completes it. */
 function photo(meta){try{if(!treesOn()||!meta)return null;const subjects=(meta.subjects||[]).filter(x=>x&&x.valid===true).map(x=>x.id);const r=MC.treeEvent(state,env,{type:'photo',subjects},root.VoidMissions,root.C||root.VoidCampaign);report(r);deliver(r);return r;}catch{return null;}}
 /* A photo sent in Messages (personal-device.js). photo: the photo's metadata (never the picture: photos stay in this browser). Returns {ok, lines, mission} (the reply), or
    null when nothing is waiting for a photo from this person. */
 function sendPhoto(to,meta){try{if(!treesOn())return null;const r=MC.treeEvent(state,env,{type:'send-photo',to,photo:meta||{}},root.VoidMissions,root.C||root.VoidCampaign);report(r);deliver(r);return r.reply?{...r.reply,mission:r.mission}:null;}catch{return null;}}
 /* The step in progress of the tracked mission (for the hints, the marker over the person to photograph and the Messages contacts). */
 function stepNow(){try{if(!treesOn())return null;const id=state.universe.trackedMission;for(const t of env.trees)for(const m of t.missions){const rec=state.universe.missions?.[m.id];if(!rec||!rec.acquired||rec.completed)continue;
  const o=m.objectives.find(x=>rec.objectives[x.id]!==true);if(o&&m.id===id)return {tree:t.id,mission:m.id,title:m.title,step:o,tracked:true};}}catch{}return null;}
 /* Who the player can message: whoever an active "send a photo" step is waiting on. */
 function contacts(){const out=new Set();try{if(!treesOn())return [];for(const t of env.trees)for(const m of t.missions){const rec=state.universe.missions?.[m.id];if(!rec||!rec.acquired)continue;for(const o of m.objectives)if(o.kind==='send-photo'&&o.npc&&(rec.objectives[o.id]===true||!rec.completed))out.add(o.npc);}}catch{}return [...out];}
 // A module bought at the outfitter or Admin's counter.
 if(root.VoidProgression?.buy){const P=root.VoidProgression,buy=P.buy;P.buy=function(s,id){const ok=buy.apply(this,arguments);try{if(ok&&typeof state!=='undefined'&&s===state&&treesOn())report(MC.treeEvent(state,env,{type:'buy',item:id},root.VoidMissions,root.C||root.VoidCampaign));}catch{}return ok;};}
 // Leaving the Sleeping Pod (EXIT POD): the one hook into the pod (world-integration.js podAct.exit is wrapped; the room and the music player are untouched).
 // Mission 001 starts on the first exit, or on the next exit for a character who left the pod before it existed. It never starts twice (its record stays in the save).
 function podExit(){try{if(!treesOn())return null;const r=MC.treeEvent(state,env,{type:'pod-exit'},root.VoidMissions,root.C||root.VoidCampaign);if(r.prompt)setTimeout(()=>offerPrompt(r.prompt),r.offered||r.objective?4000:0);if(!(r.offered||r.objective))return r;report(r);deliver(r);return r;}catch{return null;}}
 // The first exit opens the KeyMap (keymap.js); Admin's call waits until the player closes it (the owner, 18 Nov 2026: "Wait to send Admin's first mission until players press K to close the keymap").
 // If the KeyMap was seen before, or does not open within 3 s of walking, the call comes at once.
 function afterKeyMap(seen,fn){const K=root.VoidKeyMapUI;if(seen||!K)return fn();let t=0,opened=false;const id=setInterval(()=>{if(K.open)opened=true;else if((typeof mode!=='undefined'?mode:'')==='walking'&&!root.VoidCharacterCreator?.isOpen)t+=250;if((opened&&!K.open)||(!opened&&t>=3000)){clearInterval(id);fn();}},250);}
 try{if(typeof podAct!=='undefined'&&typeof podAct.exit==='function'){const exit=podAct.exit;podAct.exit=function(){const was=state?.story?.flags?.podWakePending===true,out=exit.apply(this,arguments);if(was&&state?.story?.flags?.podWakePending!==true)afterKeyMap(state?.story?.flags?.keymapSeen===true,podExit);return out;};}}catch{}
 if(root.VoidNetwork?.request)refresh();
 const inbox=channel=>{try{return typeof state!=='undefined'&&state?MC.inbox(state,env,channel):[];}catch{return [];}};
 const markRead=id=>{try{if(MC.markRead(state,id)){try{save();}catch{}return true;}}catch{}return false;};
 const during=()=>{try{return typeof state!=='undefined'&&state?MC.during(state,env):[];}catch{return [];}};
 const giverName=id=>(env.givers.find(g=>g.id===id)||{}).name||id;
 /* THE IN-GAME CLOCK (game-clock.js): once a second, while the tab is visible and the player is walking or flying (not a menu, pause, a conversation, the pod card or a
    hidden tab), the clock runs at 12 in-game minutes a real minute into story.flags.gameMin. A gap (the computer asleep, the tab in the background) counts 5 s at most.
    Saved every 12 in-game minutes and whenever a follow-up becomes due. Follow-ups (main-story.js FOLLOWUPS, in in-game minutes) fire ONCE (story.flags.ev_<event>):
    the window event 'void-tree-event' {id, followup}. Fish's call is a STUB: nothing reaches the player. */
 const GC=root.VoidClock,gcClock=GC?GC.clock():null;let gcLast=null,gcUnsaved=0;const fired=[];
 function playView(){let paused=false,menu=false;try{paused=typeof mode!=='undefined'&&mode==='pause';menu=typeof mode!=='undefined'&&mode==='menu';}catch{}
  return {visible:typeof document==='undefined'||document.visibilityState==='visible',mode:typeof mode!=='undefined'?mode:'',paused,menu,podCard:typeof state!=='undefined'&&state?.story?.flags?.podWakePending===true};}
 function clockTick(now=performance.now()){try{if(!GC||typeof state==='undefined'||!state?.story?.flags||root.VoidDevTest?.active&&!root.VoidDevTest?.clock)return null;const dt=gcLast===null?0:(now-gcLast)/1000;gcLast=now;
  const added=gcClock.add(state,dt,GC.active(playView()));gcUnsaved+=added;const due=treesOn()?GC.fire(state,MSx()?.FOLLOWUPS||[]):[];
  for(const x of due){fired.push({event:x.event,at:Date.now(),gameTime:GC.now(state).label});try{root.dispatchEvent?.(new CustomEvent('void-tree-event',{detail:{id:x.event,followup:x}}));}catch{}try{console.info('[VOID//RUNNER] follow-up due: '+x.event+' ('+(x.status||'')+')');}catch{}}
  if(due.length||gcUnsaved>=12){gcUnsaved=0;try{save();}catch{}}return {added,due};}catch{return null;}}
 setInterval(()=>clockTick(),1000);
 const gameClock=()=>{try{return {minutes:GC?GC.minutes(state):0,now:GC?GC.now(state):null,followups:GC?GC.status(state,MSx()?.FOLLOWUPS||[]):[],fired:fired.slice()};}catch{return {minutes:0,now:null,followups:[],fired:[]};}};
 // ---------------------------------------------------------------- "when walked near"
 // Distances are kept in one object (no allocation per tick); treeEvent runs only when someone on the list is close enough.
 const nearD={};let nearFor=null,nearWatch=[],nearLast=null;
 function giverDistance(id,L,px,pz){const g=env.givers.find(x=>x.id===id);if(!g||!g.targets.length||!L||!Array.isArray(L.interactions))return Infinity;let best=Infinity;
  for(const it of L.interactions){if(!it||!Array.isArray(it.position))continue;for(const t of g.targets)if(it.action===t.action&&(!t.character||it.character===t.character)){const d=Math.hypot(it.position[0]-px,it.position[2]-pz);if(d<best)best=d;}}return best;}
 function nearBlocked(){try{return typeof mode==='undefined'||mode!=='walking'||!!root.VoidConversationUI?.isOpen||typeof walker==='undefined'||!walker||typeof walkingLocation==='undefined'||!walkingLocation||state?.story?.flags?.podWakePending===true||!!root.VoidCharacterCreator?.isOpen||!!root.VoidKeyMapUI?.open;}catch{return true;}}
 function nearTick(){try{if(!treesOn()||nearBlocked())return null;if(nearFor!==env.trees){nearFor=env.trees;nearWatch=MC.nearList(env.trees);}if(!nearWatch.length)return null;
  const recs=state.universe.missions||{};let hit=false;for(const k in nearD)nearD[k]=Infinity;
  for(const n of nearWatch){const r=recs[n.mission];if(r&&(r.acquired||r.completed))continue;if(!(n.npc in nearD)||nearD[n.npc]===Infinity)nearD[n.npc]=giverDistance(n.npc,walkingLocation,walker.x,walker.z);if(MC.nearHit(nearD[n.npc],n.metres))hit=true;}
  for(const id of MC.denyRearm(state,env,nearD))delete promptAt[id];   // a denied walked-near offer whose wait is over comes back once the player has been out of its distance
  if(!hit)return null;const r=MC.treeEvent(state,env,{type:'near',near:nearD},root.VoidMissions,root.C||root.VoidCampaign);if(r.prompt)offerPrompt(r.prompt);if(!(r.offered||r.objective))return r;nearLast={mission:r.mission,at:Date.now()};report(r);deliver(r);if(r.lines&&r.lines.length)show(r.lines,r);else{const a=inlineAsk(r);if(a)openAsk(a);}return r;}catch{return null;}}   // walked near: the giver says her offer lines (and a choice in them shows its buttons)
 const ordinaryNear=new Map(),roomVisits=new Map();let ordinaryFor=null,roomFor=null,roomScene=null,duoState=null;
 function roomTick(blocked){try{const A=root.VoidAdvancedInteractions,P=root.VoidPlaces,U=root.VoidUnderground,L=typeof walkingLocation==='undefined'?null:walkingLocation,W=where();if(!A||!P||!L||!W||mode!=='walking'){roomVisits.clear();roomScene=null;return false;}
  const scene=[L.id,L.area,L.quarter].join('/');if(roomFor!==env.interactions||roomScene!==scene){roomVisits.clear();duoState=null;roomFor=env.interactions;roomScene=scene;}
  const now=Date.now(),under=L.quarter==='underground';let spoken=false;
  const inRoom=(id,p)=>{const u=U?.placeById?.(id);return u?under&&U.placeAt(p.x,p.z)===id:!under&&P.at(p).includes(id);};
  // In the Tea Room's connected sleeping room, play an authored Nomi/Se7en
  // exchange rather than two simultaneous independent entry greetings.
  const duoNames=['nomi','se7en'],duo=duoNames.map(name=>{
   const g=env.givers.find(x=>x.name?.toLowerCase()===name);
   const r=g&&env.interactions?.[g.id];
   return g&&r?.advanced?.room?.id==='under-sleeping-room'?{g,r,name}:null;
  });
  const duoActive=under&&duo.every(Boolean);
  if(duoActive&&A.roomDuoStep){
   const inside=inRoom('under-sleeping-room',W),positions=duo.map(({g})=>{
    let point=null,dist=Infinity;
    for(const it of L.interactions||[]){
     if(!Array.isArray(it.position)||!g.targets.some(t=>it.action===t.action&&(!t.character||it.character===t.character)))continue;
     const [x,y,z]=it.position,d=Math.hypot(x-W.x,z-W.z);
     if(d<dist&&inRoom('under-sleeping-room',{x,y,z})){point=it.position;dist=d;}
    }return {point,dist};
   });
   const present=positions.every(({point})=>!!point),audible=positions.every(({point,dist})=>point&&dist<=8&&Number.isFinite(W.y)&&A.clearRoomLine([W.x,W.y,W.z],point,L.solids));
   const lines=Object.fromEntries(duo.map(({g,r,name})=>[name,String(r.advanced.room.enter||'').split(/\\r?\\n/).map(x=>x.trim()).filter(Boolean)]));
   const busy=blocked||!audible||duo.some(({g})=>g.targets.some(t=>beginnerWants(t.action))||(treesOn()&&MC.treeWants(state,env,[g.id])));
   const next=A.roomDuoStep(duoState,{inside,present,blocked:busy,now,lines,members:duoNames});duoState=next.state;
   if(next.line){const actor=duo.find(x=>x.name===next.line.speaker).g;
    announce(actor.name+' · '+next.line.text);root.VoidAudio?.speak?.(actor.say||actor.id,next.line.text,false,false,true);spoken=true;
    for(const {g} of duo)ordinaryNear.set(g.id,{inside:true,last:now,index:ordinaryNear.get(g.id)?.index||0});
   }
  }else duoState=null;
  for(const [id,r] of Object.entries(env.interactions||{})){const room=r.advanced?.room;if(!room||duoActive&&duo.some(x=>x.g.id===id))continue;const g=env.givers.find(x=>x.id===id);if(!g)continue;let point=null,dist=Infinity;
   for(const it of L.interactions||[]){if(!Array.isArray(it.position)||!g.targets.some(t=>it.action===t.action&&(!t.character||it.character===t.character)))continue;const [x,y,z]=it.position,d=Math.hypot(x-W.x,z-W.z);if(d<dist&&inRoom(room.id,{scene:L.id,x,y,z})){point=it.position;dist=d;}}
   const inside=inRoom(room.id,W),audible=!!point&&dist<=8&&Number.isFinite(W.y)&&A.clearRoomLine([W.x,W.y,W.z],point,L.solids),busy=blocked||spoken||g.targets.some(t=>beginnerWants(t.action))||(treesOn()&&MC.treeWants(state,env,[id]));
   const next=A.roomDialogueStep(room,roomVisits.get(id),{inside,npcPresent:!!point,audible,blocked:busy,now});roomVisits.set(id,next.state);if(!next.line)continue;
   announce(g.name+' · '+next.line);root.VoidAudio?.speak?.(g.say||id,next.line,false,false,true);spoken=true;if(r.near)ordinaryNear.set(id,{inside:true,last:now,index:ordinaryNear.get(id)?.index||0});
  }return spoken;}catch{return false;}}
 function ordinaryTick(){try{if(ordinaryFor!==env.interactions){ordinaryFor=env.interactions;ordinaryNear.clear();ordinaryTalkCounts.clear();}if((typeof document!=='undefined'&&document.hidden)||nearBlocked()||(typeof speech!=='undefined'&&speech)||!env.interactions)return;const now=Date.now();for(const [id,r] of Object.entries(env.interactions)){if(!r.near)continue;const d=giverDistance(id,walkingLocation,walker.x,walker.z),p=ordinaryNear.get(id)||{inside:false,last:-Infinity,index:0};ordinaryNear.set(id,p);if(d>r.distance+.75){p.inside=false;continue;}if(d>r.distance||p.inside)continue;const g=env.givers.find(x=>x.id===id);if(!g||g.targets.some(t=>beginnerWants(t.action))||(treesOn()&&MC.treeWants(state,env,[id])))continue;
  if(walkingLocation.quarter==='underground'){const at=giverPoint(id),U=root.VoidUnderground;if(!at||!U||U.placeAt(...at)!==U.placeAt(walker.x,walker.z)){p.inside=false;continue;}}if(!MC.interactionDue(r,p,d,now))continue;const line=MC.interactionLine(r.near,p.index++);announce(g.name+' · '+line);root.VoidAudio?.speak?.(g.say||id,line,false,false,true);p.last=now;break;}}catch{}}
 const missionNearTick=nearTick;nearTick=function(){const result=missionNearTick(),blocked=!!(result?.offered||result?.objective||result?.prompt||nearBlocked()||(typeof speech!=='undefined'&&speech)||(typeof document!=='undefined'&&document.hidden));if(!roomTick(blocked)&&!blocked)ordinaryTick();return result;};
 setInterval(nearTick,250);
 /* "…AND ONLY WHEN" (start-conditions.js, 20 Nov 2026): what the game measures for a start's extra conditions. mission-content.js asks for it (env.world) only while a
    mission that has such conditions could start, once per event. People: every animated figure in the scene (crowd.js figures: the street crowd, residents, characters made in
    the editor, people placed for a mission), not the person measured from, not the player's companion, not other players (their own condition), not the street cat.
    "Placed" = a named person (metadata.character, not an anonymous crew-* extra); the rest is the crowd. Positions are measured from the person's TALK prompt, as walk near is. */
 function giverPoint(id){const g=env.givers.find(x=>x.id===id),L=typeof walkingLocation!=='undefined'?walkingLocation:null;if(!g||!g.targets.length||!L||!Array.isArray(L.interactions)||typeof walker==='undefined'||!walker)return null;let best=null,bd=Infinity;
  for(const it of L.interactions){if(!it||!Array.isArray(it.position))continue;for(const t of g.targets)if(it.action===t.action&&(!t.character||it.character===t.character)){const d=Math.hypot(it.position[0]-walker.x,it.position[2]-walker.z);if(d<bd){bd=d;best=[it.position[0],it.position[2]];}}}return best;}
 function metaOf(n){const m={};for(let k=0,x=n;x&&k<4;k++,x=x.parent)if(x.metadata&&typeof x.metadata==='object')for(const [a,b] of Object.entries(x.metadata))if(!(a in m))m[a]=b;return m;}
 function peopleNear(id,metres,crowd){const at=giverPoint(id);if(!at)return null;const g=env.givers.find(x=>x.id===id)||{},self=new Set([id,...(g.targets||[]).map(t=>t.character).filter(Boolean)]);let n=0;
  for(const f of root.VoidCrowd?.figures?.()||[]){const node=f&&f.node;if(!node||node.isDisposed?.()||!node.isEnabled?.())continue;const m=metaOf(node);
   if(m.remoteDevice||m.companion||m.streetCat||/^remote-player:/.test(node.name||'')||self.has(m.character)||self.has(m.streetPair)||self.has(m.made))continue;
   const placed=typeof m.character==='string'&&!/^crew-/.test(m.character)&&!m.ambient;if(!placed&&!crowd)continue;
   const p=node.getAbsolutePosition();if(Math.hypot(p.x-at[0],p.z-at[1])<=metres)n++;}
  return n;}
 function playersNear(id,metres){const at=giverPoint(id);if(!at)return null;const sc=root.VoidBabylon?.scene;let n=0;
  for(const p of root.VoidRemotePlayers?.peers||[]){if(!p.drawn)continue;const node=sc?.getTransformNodeByName?.('remote-player:'+p.id);if(!node||!node.isEnabled())continue;const q=node.getAbsolutePosition();if(Math.hypot(q.x-at[0],q.z-at[1])<=metres)n++;}
  return n;}
 env.world=()=>({others:(id,metres,crowd)=>{try{return peopleNear(id,metres,crowd);}catch{return null;}},players:(id,metres)=>{try{return playersNear(id,metres);}catch{return null;}},places:()=>lastPlaces.slice(),
  onFoot:()=>{try{return !['road-taxi','play','arrival'].includes(mode);}catch{return false;}},drawn:()=>{try{return !!groundState.drawn;}catch{return false;}},
  zone:()=>{try{const z=root.VoidZoneRun?.current?.();return (z&&z.zone)||'friendly';}catch{return null;}}});
 /* DENY WAITS (mission-content.js deny 'after', the owner, 19 Nov 2026: "Maybe set a time for return, or remove after"): the minutes count only while the player is in the
    world (nearBlocked: not in a conversation, menu, the pod's wake-up, the creator or the KeyMap) and the tab is shown. Whole seconds are kept in story.flags.md_<mission>
    (a safe integer), so a reload goes on from there; saved every few seconds outside test sessions. In a draft test the banner has SKIP THE WAIT. */
 let denyT=performance.now(),denyAcc=0,denySaved=0;
 function denyClock(){const now=performance.now(),dt=Math.min(10,(now-denyT)/1000);denyT=now;try{skipButton();if(!treesOn()||nearBlocked()||(typeof document!=='undefined'&&document.hidden))return;
  if(!MC.denyWaits(state,env).length){denyAcc=0;return;}denyAcc+=dt;if(denyAcc<1)return;const n=Math.floor(denyAcc);denyAcc-=n;const done=MC.denyTick(state,env,n);for(const id of done)delete promptAt[id];
  if((done.length||Date.now()-denySaved>5000)&&!root.VoidDevTest?.active){denySaved=Date.now();try{save();}catch{}}}catch{}}
 function skipButton(){try{const b=typeof document!=='undefined'&&document.getElementById('dev-test-banner');if(!b)return;let k=b.querySelector('[data-deny-skip]');
  const w=env.draft&&root.VoidDevTest?.active&&treesOn()?MC.denyWaits(state,env):[];if(!w.length){if(k)k.hidden=true;return;}
  if(!k){k=document.createElement('button');k.type='button';k.dataset.denySkip='1';k.title='Test only: a denied offer that waits a number of minutes can be offered again now.';
   k.onclick=()=>{try{const d=MC.denyTick(state,env,0,true);for(const id of d)delete promptAt[id];if(d.length)announce('DENY WAIT SKIPPED · '+d.map(title).join(', ')+' can be offered again');}catch{}k.hidden=true;};b.append(k);}   // after LEAVE DRAFT, so dev-test.js still finds its own button first
  const left=Math.max(...w.map(x=>x.left));k.textContent='SKIP THE WAIT ('+Math.floor(left/60)+':'+String(left%60).padStart(2,'0')+')';k.hidden=false;}catch{}}
 setInterval(denyClock,250);
 // ---------------------------------------------------------------- NPC placements (Developer Tools > NPCs) and "Giver waits at"
 /* What Reverie and Lace do (ncz-street-pair.js asks every frame; worked out twice a second): a mission's "Giver waits at" while that mission waits to be offered by her,
    else the placement published or played from Developer Tools > NPCs (content.npcs; its daily schedule follows the in-game clock, game-clock.js), else her own routine. */
 let planCache={},planAt=0;const escOn=new Set();   // follow / lead / cab steps that have started (escOn: below)
 function plans(){const t=Date.now();if(t-planAt<500)return planCache;planAt=t;const X=root.VoidNPCPaths,out={};if(!X)return planCache=out;let wait={};try{if(treesOn())wait=MC.waitingAt(state,env);}catch{}let minute=null;try{minute=GC?GC.now(state).minuteOfDay:null;}catch{}
  let esc={};try{if(treesOn())esc=MC.escortNow(state,env);}catch{}const E=root.VoidNPCEscort,saved=E?E.decode(state?.story?.flags?.[E.FLAG]):null;
  let inside={};try{if(treesOn()&&MC.insideNow)inside=MC.insideNow(state,env);}catch{}const I=root.VoidEscortIndoors;
  for(const id of Object.keys(X.MOVABLE)){const e=esc[id];
   // INTO A PLACE (20 Nov 2026; npc-escort.js, npc-escort-indoors.js): after a follow step into a place she stays inside it until the mission is done: off the street
   if(!e&&inside[id]&&E&&E.doorAt){const D=E.doorAt(inside[id].door),k='held:'+inside[id].step;out[id]=planCache[id]&&planCache[id].key===k?planCache[id]:{key:k,mode:'stay',area:'indoors',why:'mission',indoors:true,x:D?D.front.x:0,z:D?D.front.z:0,npc:id,mission:inside[id].mission,step:inside[id].step};continue;}
   // a follow / lead / cab step starts only while she is out on the street clock (mission-givers.js onDuty; a draft test simulates a time she is out); once started she
   // finishes it even if her shift ends (ncz-street-pair.js keeps her out for it), then leaves. A reload mid-step: the saved flag says it had started.
   // (also when she is out already for this mission: kept out past her shift while it runs, ncz-street-pair.js out())
   if(e&&E&&!escOn.has(e.key)){const g=env.givers.find(x=>x.id===id);let on=true;try{on=!g||!g.shift||!G?.onDuty||G.onDuty(g);}catch{}if(on||(saved&&saved.key===e.key)||(planCache[id]&&planCache[id].why==='mission'&&livePos(id)))escOn.add(e.key);}
   // a step into a place while she is inside it (or about to come out behind the player): off the street; the indoor figure is npc-escort-indoors.js's
   const D=e&&E&&escOn.has(e.key)&&e.apt!=null&&E.doorAt?E.doorAt(e.door):null;
   if(D&&I&&I.away&&I.away(e.key)){const k='in:'+e.key+':'+I.gen(e.key);out[id]=planCache[id]&&planCache[id].key===k?planCache[id]:{key:k,mode:'stay',area:'indoors',why:'mission',indoors:true,x:D.front.x,z:D.front.z,npc:id,step:e.key,mission:e.mission};continue;}
   if(e&&E&&escOn.has(e.key)){const old=planCache[id];const AR=root.VoidNPCAreas,sq=e.stop&&(root.VoidQuarters?.STOPS||[]).find(q=>q.id===e.stop),area=(D&&E.doorArea?E.doorArea(D):null)||(e.to&&AR?AR.areaOf(e.to):null)||(sq&&AR?(AR.list().find(a=>a.quarter===sq.quarter)||{}).id:null)||'avenue';   // the area the step ENDS in (npc-areas.js): its spot's, its place's door, or its cab stop's quarter
    // from: where she stands when the step starts (the spot she held for the mission), so a figure that appears for it (entering the area, a reload) appears there,
    // never at her routine's spot on The Avenue (ncz-street-pair.js / npc-made.js arrive)
    const from=old&&old.mode==='stay'&&Number.isFinite(old.x)?{x:old.x,z:old.z}:holdAt[id]&&holdAt[id].mission===e.mission?{x:holdAt[id].x,z:holdAt[id].z}:null;
    // into a place: her spot is its street door's front; `door` the point just inside it (she goes in first, npc-escort.js lead); resume: back out behind the player
    // (npc-escort-indoors.js street()), else a reload of a step that had gone inside starts again at the door (resumeInto)
    const C=carry[id]&&carry[id].key===e.key?carry[id]:null,back=D&&I&&I.street?I.street(e.key):null,res=back||C||(saved&&saved.key===e.key?(D?E.resumeInto(saved,D)||saved:saved):null);
    /* ACROSS (20 Nov 2026, npc-escort.js links / legOf, npc-escort-across.js): the area she is in now (carried through a gate, the stairs or the District's door with the
       player; a reload: where the saved flag puts her; else where she stood when the step started), and her leg there: the destination itself in its own area, else the
       next link's waiting point (she walks there and waits for the player; the step is not done there). */
    const lp=AR&&!escHome[e.key]?livePos(id):null,home=escHome[e.key]||(escHome[e.key]=(from&&AR?AR.areaOf(from):null)||(lp?AR.areaOf(lp):null)||null);   // where the step started (remembered once)
    const here=(C&&C.area)||(res&&Number.isFinite(res.x)&&AR?AR.areaOf(res):null)||home||area,dest=D?D.front:e.to||null;
    const L=E.SPOT.has(e.kind)&&E.legOf?E.legOf(id,here,res||from,dest,area):{to:dest,via:null,final:true},fin=L.final!==false,key=E.keyOf(e)+':'+here+(L.via?':'+L.via:'')+(D&&fin?':in'+(I&&I.gen?I.gen(e.key):0):'');
    out[id]=old&&old.key===key?old:{key,area:here,dest:area,mode:'escort',why:'escort',kind:e.kind,npc:id,name:X.MOVABLE[id].name,step:e.key,mission:e.mission,to:fin||!L.to?(dest?{...dest}:null):L.to,final:dest?{...dest}:null,via:L.via||null,door:D&&fin?{...D.inside}:null,doorId:D?D.id:null,stop:e.stop||null,set:{wait:e.wait,lost:e.lost,ifLost:e.ifLost},resume:res,from:back?{x:back.x,z:back.z}:from};continue;}
   let w=wait[id]||null;if(w&&w.inside)w=null;   // inside a place: above (insideNow)
   // her mission is running and she has no spot for it (no "Giver waits at"): she stays where she stood when it started (mission-content.js holdOf; remembered per mission)
   if(w&&w.here){const h=holdAt[id];if(h&&h.mission===w.mission)w={x:h.x,z:h.z,yaw:h.yaw,mission:w.mission,during:true};else{const q=livePos(id);if(q){holdAt[id]={mission:w.mission,x:+q.x.toFixed(2),z:+q.z.toFixed(2),yaw:Number.isFinite(q.yaw)?+q.yaw.toFixed(2):undefined};w={...holdAt[id],during:true};}else w=null;}}
   const p=X.planNow(id,{waiting:w,plan:(env.npcPlans||{})[id]||null,minute});if(p){if(w&&w.during)p.why='mission';const old=planCache[id];if(old&&old.key===p.key)old.why=p.why;out[id]=old&&old.key===p.key?old:p;}}/* the same spot before and after the mission starts: the same plan, now why:'mission' */planCache=out;return out;}
 const holdAt={};   // id -> {mission, x, z, yaw}: where she stood when her mission started (above); after a step that ends where she stands (a cab ride), there
 /* CARRIED THROUGH A LINK (20 Nov 2026, npc-escort-across.js): id -> {key (the step), area, x, z, yaw, phase, ride}: where she is now after coming through a gate, the stairs
    or the District's door with the player (or where she stayed when the player went on without her). Kept in memory; the save keeps x / z in story.flags.npcEsc as before
    (a reload finds the area from them). */
 const carry={},escHome={};   // escHome: step key -> the area she was in when it started
 function setCarry(id,c){if(!id)return;if(c)carry[id]=c;else delete carry[id];planAt=0;try{const E=root.VoidNPCEscort,f=state?.story?.flags;if(c&&E&&f&&Number.isFinite(c.x)){const v=E.encode({key:c.key,phase:c.phase,x:c.x,z:c.z});if(v)f[E.FLAG]=v;}}catch{}}
 /* Where the person of a running escort step is now (for the arrow when she is not in this scene): {x, z, area} or null. */
 function escortWhere(id){const P=plans()[id];if(!P||P.mode!=='escort')return null;const ok=q=>q&&Number.isFinite(q.x)&&Number.isFinite(q.z)?q:null,c=carry[id]&&carry[id].key===P.step?carry[id]:null,t=ok(c)||ok(livePos(id))||ok(P.resume)||ok(P.from)||ok(P.to);return t?{x:t.x,z:t.z,area:P.area}:null;}
 /* Where an NPC the editor can move stands now (the street pair's figure, the cat, a made character), or null when she is not in this scene. */
 function livePos(id){try{const SP=root.VoidStreetPair,st=SP&&SP.live?SP.live():null;if(st){if(id===SP.CAT_ID&&st.cat)return {x:st.cat.x,z:st.cat.z};if(st.her&&st.her.id===id)return {x:st.her.x,z:st.her.z,yaw:st.her.yaw};}
  const M=root.VoidMadeNPCs,ms=M&&M.live?M.live():null,p=ms&&Array.isArray(ms.people)?ms.people.find(q=>q.id===id):null;if(p)return {x:p.x,z:p.z,yaw:p.yaw};}catch{}return null;}
 /* FOLLOW / LEAD / SHARED-CAB steps (npc-escort.js): ncz-street-pair.js moves the NPC and reports what happens. 'done' completes the step; 'failed' (the player got
    lost with "the mission fails") fails the mission; the rest are short notices. While a step runs, story.flags.npcEsc keeps where she is (a reload puts her back). */
 const escortLog=[];let escSavedAt=0;
 function onEscort(x){try{if(!x||!treesOn())return;try{root.VoidEscortIndoors?.onStreet?.(x);}catch{}escortLog.push({event:x.event,phase:x.phase,npc:x.npc,step:x.step,at:Date.now()});if(escortLog.length>40)escortLog.shift();
  const E=root.VoidNPCEscort,who=x.npc===root.VoidStreetPair?.CAT_ID?'The cat':giverName(x.npc),f=state.story.flags;
  if(x.event==='done'){delete f[E.FLAG];delete carry[x.npc];{const P=planCache[x.npc];if(P&&P.mission&&Number.isFinite(x.x)&&Number.isFinite(x.z))holdAt[x.npc]={mission:P.mission,x:+x.x.toFixed(2),z:+x.z.toFixed(2)};}   // (20 Nov 2026) she stays where the step ended (a cab ride to another quarter), not where it started
const r=MC.treeEvent(state,env,{type:'escort',step:x.step},root.VoidMissions,root.C||root.VoidCampaign);report(r);deliver(r);if(r.lines.length&&mode==='walking')show(r.lines,r);return;}
  if(x.event==='failed'){const r=MC.treeEvent(state,env,{type:'escort-fail',step:x.step},root.VoidMissions,root.C||root.VoidCampaign);if(r.failed){try{save();hud();}catch{}const g=(env.trees.flatMap(t=>t.missions).find(m=>m.id===r.mission)||{}).giver;try{announce('MISSION FAILED · '+title(r.mission)+' · you lost '+(x.npc===root.VoidStreetPair?.CAT_ID?'the cat':who)+'. Talk to '+(g?giverName(g):'them')+' to try again.');}catch{}try{root.VoidDevTest?.stepNote?.('you lost '+(x.npc===root.VoidStreetPair?.CAT_ID?'the cat':who)+'; talk to '+(g?giverName(g):'the giver')+' again');}catch{}}return;}
  const v=E&&E.encode({key:x.step,phase:x.phase,x:x.x,z:x.z,w:x.w||(root.VoidEscortIndoors?.away?.(x.step)?'in':'')});if(v&&f[E.FLAG]!==v){f[E.FLAG]=v;if(Date.now()-escSavedAt>4000){escSavedAt=Date.now();try{save();}catch{}}}
  const say={enter:null,in:null,wait:who+' waits for you to catch up.',paused:who+' has stopped: you are too far away. Go back to them.','caught-up':who+' catches up with you.','wrong-stop':who+' is going to '+(((root.VoidQuarters?.STOPS||[]).find(q=>q.id===planCache[x.npc]?.stop)||{}).name||'another stop')+', not there: they stay out of this cab.','hail-failed':who+' could not get a cab: '+(x.reason||'try again in a moment.'),'in-cab':who+' gets in the cab.','ride-out':who+' gets out with you.','no-cab':x.npc===root.VoidStreetPair?.CAT_ID?'The cat does not ride in cabs: it waits here for you.':who+' stays in the city: she does not ride there. She waits here for you.',across:x.text||null}[x.event];
  if(say)try{announce(say);}catch{}}catch{}}
 if(root.VoidStreetPair){root.VoidStreetPair.onEscort=onEscort;root.VoidStreetPair.planFor=id=>plans()[id]||null;root.VoidStreetPair.animsFor=id=>((env.npcPlans||{})[id]||{}).anims||[];}
 /* APARTMENTS (apartments.js, apartment-integration.js): the instances open for this player, the street doors a hack opened, the hack steps in progress; a use of
    something in an apartment and a finished hack are mission events. */
 const aptRun=ev=>{try{if(!treesOn())return null;const r=MC.treeEvent(state,env,ev,root.VoidMissions,root.C||root.VoidCampaign);report(r);deliver(r);if((r.objective||r.offered)&&!root.VoidDevTest?.active)try{save();}catch{}if(r.lines&&r.lines.length&&mode==='walking')setTimeout(()=>show(r.lines,r),600);return r;}catch{return null;}};
 const apartments=()=>{try{return treesOn()?MC.apartmentsNow(state,env):[];}catch{return [];}};
 const hackedDoors=()=>{try{return treesOn()?MC.hackedNow(state,env):[];}catch{return [];}};
 const hacks=()=>{try{return treesOn()?MC.hacksNow(state,env):[];}catch{return [];}};
 const doorsInUse=()=>{try{return treesOn()?MC.doorsInUseNow(state,env):[];}catch{return [];}};
 const aptUse=({mission,apt,object,mod})=>aptRun({type:'apt-use',mission,apt,object,mod:mod||null});
 const stepWants=u=>{try{return treesOn()&&!!MC.stepWants&&MC.stepWants(state,env,u);}catch{return false;}};   // the step in progress needs this thing: no everyday description (21 Nov 2026)
 const hack=job=>aptRun({type:'hack',ap:job.ap,mission:job.mission,step:job.key});
 const zoneStep=key=>aptRun({type:'zone',step:key});   // a "Change zone" step completes as soon as it is reached (zone-integration.js)
 /* A hacked camera feed's recording was saved (camera-feed.js): the event that completes a hack step with a camera feed (cult-room.js). */
 const feedSaved=job=>job&&job.feed?aptRun({type:'feed',ap:job.ap,feed:job.feed,mission:job.mission,step:job.key}):null;
 /* A new throwaway draft session (mission-editor.js play, PLAY FROM THE START OF THIS TREE): forget what the running game remembers about the missions played before it
    (animation and step-timer countdowns, follow / lead / cab steps that had started, offers asked, walked-near distances), so the session starts clean. The saved state is the new session's own. */
 function resetRun(){for(const o of [animRun,timerLeft,promptAt,needAt,nearD])for(const k of Object.keys(o))delete o[k];ordinaryNear.clear();roomVisits.clear();duoState=null;roomScene=null;ordinaryTalkCounts.clear();for(const o of [askShown])for(const k of Object.keys(o))delete o[k];escOn.clear();for(const k of Object.keys(holdAt))delete holdAt[k];for(const k of Object.keys(carry))delete carry[k];for(const k of Object.keys(escHome))delete escHome[k];planCache={};planAt=0;escortLog.length=0;nearFor=null;nearWatch=[];nearLast=null;lastContact=null;askOpen=null;try{root.VoidEscortIndoors?.resetRun?.();}catch{}}
 root.VoidLiveContent={report,deliver,show:(l,r)=>show(l,r),nearBlocked:()=>{try{return nearBlocked();}catch{return true;}},zoneStep,treesOn:()=>{try{return treesOn();}catch{return false;}},denyClock,skipButton,denyWaits:()=>{try{return treesOn()?MC.denyWaits(state,env):[];}catch{return [];}},resetRun,askTick,askNow:()=>{try{return treesOn()?MC.askNow(state,env):[];}catch{return [];}},apartments,hackedDoors,hacks,doorsInUse,aptUse,stepWants,hack,feedSaved,offerPrompt,plans,replan:()=>{planAt=0;},onEscort,setCarry,escortWhere,carried:id=>carry[id]?{...carry[id]}:null,escortLog:()=>escortLog.slice(),escortNow:()=>{try{return treesOn()?MC.escortNow(state,env):{};}catch{return {};}},env,use,useDraft,refresh,podExit,inbox,markRead,photo,sendPhoto,step:stepNow,contacts,during,giverName,merge,gameClock,clockTick,nearTick,nearDistances:()=>({...nearD}),onlyNow:()=>{try{return treesOn()?MC.onlyNow(state,env):[];}catch{return [];}},peopleNear:(id,m,c=true)=>{try{return peopleNear(id,m,c);}catch{return null;}},get nearLast(){return nearLast;},get lastContact(){return lastContact;},places:()=>lastPlaces.slice(),get tracker(){return tracker;},get current(){return current;},get draft(){return draft;}};
})(globalThis);
