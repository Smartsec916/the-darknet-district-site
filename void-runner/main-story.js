/* THE MAIN STORYLINE (pure data and rules: browser and Node tests; no DOM, no network). Loaded for every player before mission-content.js.
   MISSION NUMBERS (the owner, 17 Nov 2026: "I also need a backend Mission numbering system, as well as names"): every mission carries a stable number and a name,
   shown as "Mission 001 — Awakening". Numbers are unique, zero-padded to three digits, given in order, and NEVER reused once used, even after a mission is removed.
   NUMBERS below is the shipped ledger of every number ever used (number → mission id). It must equal void-runner/save-manifest.json missionNumbers (a test checks),
   and the server's publish check also keeps every number it has published (void_runner_live_content.py). Internal ids stay stable and separate from numbers.
   MISSION 001 — AWAKENING is the owner's own mission, APPROVED 17 Nov 2026 (his words are in VOID_RUNNER_HANDOFF.md §11). Admin's introduction to The Darknet District
   (what he says in person at step 3; step 4 is done when that conversation closes) is NOT written yet: the one line below is a clearly marked placeholder for the owner. It is shown only in the Mission Editor and in draft play; the game never
   shows it to live players (mission-content.js speak() drops placeholder lines outside draft play).
   MISSION 002 — EYES ON THE STREET is the owner's too, APPROVED 17 Nov 2026 (VOID_RUNNER_HANDOFF.md §11): Admin offers it in person after Awakening (ACCEPT / NOT NOW; a player who
   declines can come back), then: walk into NULL (a place trigger; Admin's Comms call about the V1 camera), photograph Juno Vex at NULL's bar (the photo must really show her),
   send the photo to Admin in Messages, and return to him: 100 credits and better standing with Admin (story.relationships.admin), paid once.
   This tree runs in the game through mission-content.js treeEvent, the same adapter as the owner's own trees; the Mission Editor edits it as the tree "Awakening"
   (the owner calls it the Awakening Tree; it was shown as "Main storyline" until 17 Nov 2026; its id main-storyline never changes).
   MISSION 003 — CORPORATE CONNECTIONS is the owner's, APPROVED 17 Nov 2026 (VOID_RUNNER_HANDOFF.md §11, his words verbatim): Admin's briefing in person after Eyes on the Street
   (ACCEPT / NOT NOW, as 002), walk into Milked (Far South), Eva at reception (the staff-only door opens for this player: story flag mf_milkedStaff), Fish in her office
   (her Mandarin line with the V1's English translation over it), Fish is added to the V1 contacts and followed on Social, and the mission ends ("Await Fish's response").
   Her follow-up call becomes DUE after FOLLOWUPS[0].minutes of ACTIVE play (playtime.js); the call itself and the next mission are the owner's to write later (a stub).
   Lines marked in PROPOSED below are Claude's short drafts of what the owner described but did not write word for word: text only (no voice) until he approves them. */
(function(root){
 'use strict';
 const TREE_ID='main-storyline';
 // The ledger: every number ever used. Append only. A removed mission keeps its number here forever.
 const NUMBERS={1:'m001-awakening',2:'m002-eyes-on-the-street',3:'m003-corporate-connections'};
 const PLACEHOLDER='[Write Admin\'s introduction to The Darknet District here]';
 const isPlaceholder=t=>typeof t==='string'&&/^\s*\[(?:[^\]:]{1,20}:\s*)?write\b/i.test(t);
 const pad=n=>String(n).padStart(3,'0');
 /* "Mission 001 — Awakening" (no number: just the name). */
 const label=(number,title)=>Number.isInteger(number)&&number>0?'Mission '+pad(number)+(title?' — '+title:''):String(title||'');
 const AWAKENING={id:'m001-awakening',number:1,title:'Awakening',type:'main',category:'Main storyline / Introduction',giver:'admin',location:'district',objective:'Locate Admin',description:'',
  // HOW IT STARTS (the owner, 17 Nov 2026): "\"You're awake. Good. When you're ready, come find me. We need to talk.\" comes through Comms. But then they must meet with Admin.
  // Then he says a line in person." A Comms call from Admin on the first exit from the pod; the meeting is in person (step 3, his lines are what is said when it is done).
  start:{how:'notification',channel:'comms',from:'admin',header:'ADMIN // INCOMING MESSAGE',text:'You\'re awake. Good.\nWhen you\'re ready, come find me. We need to talk.',when:{kind:'pod-exit'}},
  offer:[],
  objectives:[
   {id:'exit-pod',kind:'pod-exit',label:'Exit the Sleeping Pod.',npc:'',place:'',item:'',say:[],early:[]},
   {id:'message',kind:'message',label:'Receive Admin\'s message.',npc:'',place:'',item:'',say:[],early:[]},
   {id:'speak',kind:'talk',npc:'admin',label:'Find and speak with Admin.',place:'',item:'',say:[{who:'admin',text:PLACEHOLDER}],early:[]},
   {id:'introduction',kind:'hear',npc:'admin',label:'Receive an introduction to The Darknet District.',place:'',item:'',say:[],early:[]}],
  ending:{npc:'',place:'',label:'',say:[]},choices:[],unlocks:[]};
 // MISSION 002 (the owner's words, verbatim; text only until recorded). Players see the name only.
 const A=t=>({who:'admin',text:t});
 const EYES={id:'m002-eyes-on-the-street',number:2,title:'Eyes on the Street',type:'main',category:'Intelligence gathering / Reconnaissance',giver:'admin',description:'',
  start:{how:'person',accept:true},   // in person: Admin offers it, the player can ACCEPT or say NOT NOW (and come back later)
  offer:[A('I heard you\'re looking for work.'),A('Before I trust you with anything important, I need you to do a little reconnaissance.'),
   A('Head outside. Across the street, you\'ll find a nightclub called NULL. There\'s someone hanging out in there I need you to take their picture so I can scrape it for more data'),A('I\'ll mark their location')],
  objectives:[
   // the first LOCATION TRIGGER: done when the player is inside NULL; what is said then reaches the V1 as a Comms call from Admin
   {id:'enter-null',kind:'enter',place:'null',label:'Go to NULL, across the street.',via:'comms',npc:'',item:'',early:[],
    say:[A('Your V1 has a camera. Press L to open your device, then select the Camera app.'),A('Point it at the target. Your device should identify them automatically.'),A('Left click will take a picture'),A('You can also zoom with the camera by using the mouse wheel'),
     A('Once you\'ve taken the photograph, open Messages, select my conversation, attach the photograph, and send it to me.'),A('Nothing complicated. Just keep your eyes open.')]},
   // the photo must show BOTH Juno Vex and Halden Reyes, the man she is talking with (the owner, 17 Nov 2026): each in the frame, within 15 m, not blocked, in the same photo
   {id:'photograph',kind:'photo',npc:'juno-vex',subjects:['juno-vex','halden-reyes'],label:'Photograph the target.',place:'',item:'',say:[],early:[]},
   {id:'send-photo',kind:'send-photo',npc:'admin',subject:'juno-vex',subjects:['juno-vex','halden-reyes'],label:'Send the photo to Admin.',place:'',item:'',early:[],
    say:[A('Received. That\'s exactly what I needed. Come back when you\'re ready.')],wrong:[A('That\'s not the person I\'m looking for. Check the description and try again.')]},
   {id:'return',kind:'talk',npc:'admin',label:'Return to Admin.',place:'',item:'',early:[],say:[A('Not bad. You can follow instructions and keep a low profile. I might have more work for you.')]}],
  rewards:100,ending:{npc:'',place:'',label:'',say:[]},choices:[],unlocks:[{kind:'reputation',id:'admin',amount:10}]};
 // MISSION 003 (the owner's words verbatim where he wrote them; the PROPOSED lines are drafts awaiting his approval). Players see the name only. No reward (none specified).
 const EVA=t=>({who:'milked-eva',text:t}),FISH=t=>({who:'milked-fish',text:t}),YOU=t=>({who:'You',text:t}),V1T=t=>({who:'v1-translator',text:t});
 // The PROPOSED drafts (Claude's wording, 17 Nov 2026; text only until the owner approves them; editable in the Mission Editor). Eva's tone (the owner: "this game is made to make
 // people uncomfortable about possible futures and cultural changes through time"): cheerful corporate normalcy about something unsettling (metrics, payouts, a donor
 // pipeline, viewers at home); the discomfort is in how ordinary she makes it sound. Non-explicit, no crude or graphic words, every performer an adult.
 const DRAFT={evaWelcome:'Welcome to Milked! I\'m Eva. Can I get you a water while you wait?',evaBusiness:'We\'re the district\'s top adult stream and donor programme. Members watch from home; a courier collects their donations.',
  evaPaid:'Performers are paid by volume collected. Our top earner led the board three quarters running. We\'re so proud of her.',youFish:'Admin sent me. I\'m here to see Fish.',youHi:'He also said to tell you hi.',
  youHalden:'Admin sent me. He wants anything you can find on a man named Halden Reyes.'};
 const PROPOSED=Object.values(DRAFT);
 const isProposed=t=>typeof t==='string'&&PROPOSED.includes(t);
 const ZH='给我一点时间调查一下。如果有什么消息，我会给你打电话。',EN='Give me some time to work on it. I\'ll call you if anything comes up.';
 const CORPORATE={id:'m003-corporate-connections',number:3,title:'Corporate Connections',type:'main',category:'Intelligence gathering',giver:'admin',location:'milked',description:'',
  start:{how:'person',accept:true},   // in person, as 002: Admin's briefing, then ACCEPT / NOT NOW
  offer:[A('I did some digging. Halden Reyes has ties to an arms dealer who works closely with The Function.'),A('I know an intel broker named Fish. She\'s a close friend of mine and works over at Milked. She might be able to tell us more.'),
   A('Head over there and let the receptionist, Eva, know you\'re there to see Fish.'),A('And tell Eva I said hi.')],
  objectives:[
   // Objective 1: done as the player walks into Milked (places.js 'milked'); the arrow then leads to Eva at reception
   {id:'travel-milked',kind:'enter',place:'milked',label:'Travel to Milked.',npc:'',item:'',say:[],early:[]},
   // Objective 2: Eva (the drafts, the player's lines, then her two recorded lines); her last line opens the staff-only door for this player (unlock mf_milkedStaff)
   {id:'speak-eva',kind:'talk',npc:'milked-eva',label:'Speak with Eva at reception.',place:'',item:'',early:[],
    say:[EVA(DRAFT.evaWelcome),EVA(DRAFT.evaBusiness),EVA(DRAFT.evaPaid),YOU(DRAFT.youFish),YOU(DRAFT.youHi),EVA('Oh, Admin! Tell him I said hi, too.'),EVA('Fish is through the staff-only door. You\'ll find her in her office.')]},
   // Objective 3: Fish answers in Mandarin; the V1 translation line right after hers (in her OWN voice, English: the owner's standard) is played over it (voice-clips.js) and shown under it as V1 TRANSLATION
   {id:'meet-fish',kind:'talk',npc:'milked-fish',label:'Meet Fish in her office.',place:'',item:'',early:[],say:[YOU(DRAFT.youHalden),FISH(ZH),V1T(EN)]},
   // Objective 4: done by itself right after Fish; her follow-up call becomes due after active play (FOLLOWUPS)
   {id:'await-fish',kind:'await-call',npc:'milked-fish',label:'Await Fish\'s response.',place:'',item:'',say:[],early:[]}],
  ending:{npc:'',place:'',label:'',say:[]},choices:[],
  unlocks:[{kind:'flag',id:'milkedStaff',value:true,when:'speak-eva'},{kind:'contact',id:'milked-fish',when:'meet-fish'},{kind:'follow',id:'milked-fish',when:'meet-fish'}]};
 /* Follow-up calls that become due after ACTIVE play (playtime.js counts only visible, in-play time; story.flags.playSec). `after`: the mission whose completion starts the
    clock; `minutes`: how long (the one place to change it); `event`: the tree event fired once when due (story.flags ev_<event> = true). STUB: the owner's script for the call
    and the next mission are not written; nothing is delivered to the player yet. */
 const FOLLOWUPS=[{event:'fish-followup-due',after:'m003-corporate-connections',minutes:15,from:'milked-fish',channel:'comms',status:'stub',note:'Fish\'s follow-up call: the owner\'s script and the next mission are not written yet. Nothing is delivered.'}];
 /* What a speaker turns toward while saying a step's last line (milked-build.js gesture): Eva toward the staff-only door. */
 const GESTURES={'m003-corporate-connections/speak-eva':{who:'milked-eva',toward:'staff-door',seconds:4}};
 const TREE={id:TREE_ID,name:'Awakening',note:'Your Awakening tree. Mission 001 starts the first time a player leaves their Sleeping Pod; Mission 002 and Mission 003 follow it.',status:'active',shipped:true,seq:1,missions:[AWAKENING,EYES,CORPORATE]};
 const clone=v=>JSON.parse(JSON.stringify(v));
 /* The shipped story trees (copies: callers may edit them). */
 const trees=()=>[clone(TREE)];
 const STORY_TREES=[TREE_ID];
 /* Every mission id any version of the shipped game has run (save-manifest.json storyMissions lists the same). */
 const MISSION_IDS=Object.values(NUMBERS);
 /* Numbers in a list of trees: [{number,id,title,tree}]. */
 function numbersIn(list){const out=[];for(const t of list||[])for(const m of (t&&t.missions)||[])if(m&&Number.isInteger(m.number))out.push({number:m.number,id:m.id,title:m.title||'',tree:t.id});return out;}
 /* Problems with numbers: duplicates inside the trees, and numbers already used by a different mission (ledger: {number: id}, the shipped one plus any published). */
 function numberProblems(list,ledger=NUMBERS){const out=[],seen=new Map();
  for(const x of numbersIn(list)){
   if(!(x.number>=1&&x.number<=999))out.push('"'+(x.title||x.id)+'": a mission number must be between 001 and 999.');
   if(seen.has(x.number)&&seen.get(x.number)!==x.id)out.push('Mission '+pad(x.number)+' is given to two missions ("'+x.id+'" and "'+seen.get(x.number)+'"). Numbers are unique.');
   seen.set(x.number,x.id);
   const used=ledger&&ledger[x.number];if(used&&used!==x.id)out.push('Mission '+pad(x.number)+' was already used by "'+used+'". A number is never reused, even after a mission is removed.');}
  return out;}
 /* The next free number: one past the highest number ever used (the ledgers, the trees and any numbers retired in a draft). */
 function nextNumber(list,...ledgers){let max=0;for(const l of ledgers)for(const k of Object.keys(l||{})){const n=Number(k);if(Number.isInteger(n)&&n>max)max=n;}
  for(const x of numbersIn(list))if(x.number>max)max=x.number;return Math.min(999,max+1);}
 /* Shipped lines that were later changed by the owner. A saved editor draft that still holds one of these, word for word, is an untouched copy: the shipped
    (or published) text wins and replaces it. A step whose lines the owner edited himself is left as he wrote it. 17 Nov 2026: the zoom line added to 002's call. */
 const SUPERSEDED={'m002-eyes-on-the-street/enter-null':[['Your V1 has a camera. Press L to open your device, then select the Camera app.','Point it at the target. Your device should identify them automatically.','Left click will take a picture','Once you\'ve taken the photograph, open Messages, select my conversation, attach the photograph, and send it to me.','Nothing complicated. Just keep your eyes open.']]};
 const textsOf=say=>(say||[]).map(l=>l&&l.text);
 function refreshShipped(tree,shipped=TREE){let changed=0;for(const m of (tree&&tree.missions)||[])for(const o of (m&&m.objectives)||[]){const old=SUPERSEDED[m.id+'/'+o.id];if(!old)continue;
   const now=textsOf(o.say);if(!old.some(v=>v.length===now.length&&v.every((t,i)=>t===now[i])))continue;
   const sm=shipped.missions.find(x=>x.id===m.id),so=sm&&sm.objectives.find(x=>x.id===o.id);if(!so)continue;o.say=JSON.parse(JSON.stringify(so.say));changed++;}
  return changed;}
 const api={CORPORATE,DRAFT,PROPOSED,isProposed,FOLLOWUPS,GESTURES,TRANSLATION:{zh:ZH,en:EN},TREE_ID,SUPERSEDED,refreshShipped,STORY_TREES,NUMBERS,MISSION_IDS,PLACEHOLDER,TREE,AWAKENING,EYES,OLD_NAME:'Main storyline',isPlaceholder,pad,label,trees,numbersIn,numberProblems,nextNumber};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VoidMainStory=api;
})(typeof globalThis!=='undefined'?globalThis:this);
