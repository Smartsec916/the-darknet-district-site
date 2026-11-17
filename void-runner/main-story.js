/* THE MAIN STORYLINE (pure data and rules: browser and Node tests; no DOM, no network). Loaded for every player before mission-content.js.
   MISSION NUMBERS (David, 17 Nov 2026: "I also need a backend Mission numbering system, as well as names"): every mission carries a stable number and a name,
   shown as "Mission 001 — Awakening". Numbers are unique, zero-padded to three digits, given in order, and NEVER reused once used, even after a mission is removed.
   NUMBERS below is the shipped ledger of every number ever used (number → mission id). It must equal void-runner/save-manifest.json missionNumbers (a test checks),
   and the server's publish check also keeps every number it has published (void_runner_live_content.py). Internal ids stay stable and separate from numbers.
   MISSION 001 — AWAKENING is David's own mission, APPROVED 17 Nov 2026 (his words are in VOID_RUNNER_HANDOFF.md §11). Admin's introduction to The Darknet District
   (what he says in person at step 3; step 4 is done when that conversation closes) is NOT written yet: the one line below is a clearly marked placeholder for David. It is shown only in the Mission Editor and in draft play; the game never
   shows it to live players (mission-content.js speak() drops placeholder lines outside draft play).
   This tree runs in the game through mission-content.js treeEvent, the same adapter as the owner's own trees; the Mission Editor edits it as the tree "Main storyline". */
(function(root){
 'use strict';
 const TREE_ID='main-storyline';
 // The ledger: every number ever used. Append only. A removed mission keeps its number here forever.
 const NUMBERS={1:'m001-awakening'};
 const PLACEHOLDER='[David: write Admin\'s introduction to The Darknet District here]';
 const isPlaceholder=t=>typeof t==='string'&&/^\s*\[David:/.test(t);
 const pad=n=>String(n).padStart(3,'0');
 /* "Mission 001 — Awakening" (no number: just the name). */
 const label=(number,title)=>Number.isInteger(number)&&number>0?'Mission '+pad(number)+(title?' — '+title:''):String(title||'');
 const AWAKENING={id:'m001-awakening',number:1,title:'Awakening',type:'main',category:'Main storyline / Introduction',giver:'admin',location:'district',objective:'Locate Admin',description:'',
  // HOW IT STARTS (David, 17 Nov 2026): "\"You're awake. Good. When you're ready, come find me. We need to talk.\" comes through Comms. But then they must meet with Admin.
  // Then he says a line in person." A Comms call from Admin on the first exit from the pod; the meeting is in person (step 3, his lines are what is said when it is done).
  start:{how:'notification',channel:'comms',from:'admin',header:'ADMIN // INCOMING MESSAGE',text:'You\'re awake. Good.\nWhen you\'re ready, come find me. We need to talk.',when:{kind:'pod-exit'}},
  offer:[],
  objectives:[
   {id:'exit-pod',kind:'pod-exit',label:'Exit the Sleeping Pod.',npc:'',place:'',item:'',say:[],early:[]},
   {id:'message',kind:'message',label:'Receive Admin\'s message.',npc:'',place:'',item:'',say:[],early:[]},
   {id:'speak',kind:'talk',npc:'admin',label:'Find and speak with Admin.',place:'',item:'',say:[{who:'admin',text:PLACEHOLDER}],early:[]},
   {id:'introduction',kind:'hear',npc:'admin',label:'Receive an introduction to The Darknet District.',place:'',item:'',say:[],early:[]}],
  ending:{npc:'',place:'',label:'',say:[]},choices:[],unlocks:[]};
 const TREE={id:TREE_ID,name:'Main storyline',note:'David\'s main storyline. Mission 001 starts the first time a player leaves their Sleeping Pod.',status:'active',shipped:true,seq:1,missions:[AWAKENING]};
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
 const api={TREE_ID,STORY_TREES,NUMBERS,MISSION_IDS,PLACEHOLDER,TREE,AWAKENING,isPlaceholder,pad,label,trees,numbersIn,numberProblems,nextNumber};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VoidMainStory=api;
})(typeof globalThis!=='undefined'?globalThis:this);
