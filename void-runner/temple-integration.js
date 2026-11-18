/* Zen Zephyr Temple: game wiring (browser only). Registers the walking location, the interaction handlers, the return cab, and Zen Zephyr's conversation.
   The conversation is the owner's approved, voiced script (18 Nov 2026; zen-chat.js), in the game's ordinary conversation window (scenes.js talk(), talk-choice.js menus,
   conversation-ui.js), so the recordings, the auto-advance, the transcript and the speaker's gaze behave as with every other character. No network, no AI.
   Flow: inside the hall, within zen-chat.js GREET_RANGE of his seat and in his sight, he greets the player once per visit ("as if he knew they were coming"). The five
   choices open when the player continues, comes within TALK_RANGE, or presses E (SPEAK WITH ZEN ZEPHYR); E before the greeting plays it first. A choice: a random quote of
   that category and the follow-up line, then the choices again with "Yes" to leave. Nothing is saved except the map fog (temple-build.js) and the taxi's trip (road-taxi-rules.js). */
(function(root){
 'use strict';
 const T=root.VoidTemple,Z=root.VoidZenChat;if(!T||!Z||typeof document==='undefined')return;
 const wait=setInterval(()=>{if(typeof VoidInteractions==='undefined'||!VoidInteractions.register||typeof VoidExplorationData==='undefined'||typeof announce==='undefined'||typeof talk!=='function'||typeof root.talkChoice!=='function')return;clearInterval(wait);start();},400);
 function start(){
  VoidExplorationData.locations.temple=T.layout();
  const done=()=>{try{resumeWalking();}catch{}};
  const note=t=>{done();try{announce(t);}catch{}};
  const R=(a,f)=>VoidInteractions.register(a,f);
  // His name and role in the conversation window
  const chars=root.VoidStoryContent?.characters;if(chars&&!chars[Z.WHO])chars[Z.WHO]={id:Z.WHO,name:Z.NAME,role:Z.ROLE,portrait:'art/characters.png',cell:'0% 0%',faction:'independent',tags:['temple'],biography:'The AI monk of the Sanctum of the Circuit.',relationshipDefault:0};
  R('temple-cab',()=>{done();if(!root.VoidRoadTaxi?.returnFrom){note('The taxi is not available.');return;}root.VoidRoadTaxi.returnFrom('temple','cab');});
  R('temple-walk',()=>{done();if(!root.VoidRoadTaxi?.returnFrom){note('The gate is not available.');return;}root.VoidRoadTaxi.returnFrom('temple','foot');});   // the East Gate's walkers' lane (16 Nov 2026)
  R('temple-altar',({item})=>note(T.ALTAR_TEXT[item?.altar]||'DATA ALTAR: the glass is warm and still.'));
  R('temple-incense',()=>note('Blue-flame incense. It burns without smoke and smells faintly of warm metal and rain.'));
  R('temple-overlook',()=>note('Far below to the south-east the city glows through the mist: towers, traffic, neon. From here it is almost silent.'));
  // ---- Zen Zephyr ----
  let chat=Z.create(),inside=false,stage=null,autoOpened=false;   // stage: 'greeting' (the distant greeting is on screen) | 'menu' | null
  const busy=()=>{try{return !!speech||!!root.VoidConversationUI?.isOpen;}catch{return false;}};
  const seat=()=>({x:T.MODEL.seat[0],z:T.MODEL.seat[1]});
  const distance=()=>{try{const s=seat();return Math.hypot(walker.x-s.x,walker.z-s.z);}catch{return Infinity;}};
  function leave(){stage=null;done();}
  function menu(r){stage='menu';root.talkChoice(r.lines,r.choices.map(c=>({label:c.label,leave:!!c.leave,run:c.leave?leave:()=>menu(chat.pick(c.id))})),'',{menu:true,cancel:leave});}
  function open(){autoOpened=true;menu(chat.open());}
  function greet(){stage='greeting';talk('',chat.greet(),()=>{if(stage==='greeting')open();},'CONTINUE →','');}
  // The greeting window closes by itself if the player turns away from him; it never takes the keys or the mouse back while they walk.
  function quietClose(){stage=null;try{speech=null;root.VoidAudio?.cancel();screen.classList.add('hidden');screen.classList.remove('conversation-live');document.getElementById('conversation-restore')?.setAttribute('hidden','');}catch{}}
  setInterval(()=>{
   let here=false;try{here=typeof walkingLocation!=='undefined'&&walkingLocation?.id===T.ID&&typeof walker!=='undefined'&&!!walker;}catch{}
   if(!here){if(inside){inside=false;stage=null;}return;}
   if(!inside){inside=true;chat=Z.create();T.chat=chat;stage=null;autoOpened=false;}   // a new visit: he greets again, once
   if(mode!=='walking')return;
   const d=distance(),greetingUp=stage==='greeting'&&!!speech&&speech.lines?.[0]?.text===Z.SCRIPT.greeting;if(stage==='greeting'&&!greetingUp)stage=null;
   if(!busy()&&chat.shouldGreet(d,T.seesMonk(walker.x,walker.z))){greet();return;}
   if(greetingUp&&d>Z.GREET_RANGE+8){quietClose();return;}
   // close enough to talk: the choices open once by themselves (after the greeting has been heard, or with it if it has not played)
   if(d<=Z.TALK_RANGE&&!autoOpened&&(!busy()||greetingUp)){const v=speech?.voice;if(greetingUp&&v&&(v.clip&&!v.ended))return;open();}
  },200);
  T.chat=chat;T.zen={open,greet,get stage(){return stage;},get chat(){return chat;},distance};
  R('temple-monk',()=>{if(stage==='menu'&&busy())return;open();});
 }
})(globalThis);
