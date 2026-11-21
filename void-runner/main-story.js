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
   Her follow-up call becomes DUE after FOLLOWUPS[0].gameMinutes of IN-GAME time (game-clock.js: 6 in-game hours, about 30 minutes of play), so the player can do other things
   meanwhile; the call itself and the next mission are the owner's to write later (a stub).
   Lines marked in PROPOSED below are Claude's short drafts of what the owner described but did not write word for word: text only (no voice) until he approves them. */
(function(root){
 'use strict';
 const TREE_ID='main-storyline';
 // The ledger: every number ever used. Append only. A removed mission keeps its number here forever.
 const NUMBERS={1:'m001-awakening',2:'m002-eyes-on-the-street',3:'m003-corporate-connections',4:'m004-a-promising-investment',5:'m005-behind-closed-doors',6:'m006-hostile-takeover',7:'m007-the-house-always-wins',8:'m008-private-network',9:'m009-ghost-in-the-network',10:'m010-the-price-of-admission',11:'m011-leverage',12:'m012-first-cargo-delivery'};
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
  start:{how:'person',accept:true,no:'NOT NOW'},   // in person: Admin offers it, the player can ACCEPT or say NOT NOW (and come back later); NOT NOW kept as its label (the default is DENY since 19 Nov 2026)
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
 // Approved by the owner 17 Nov 2026: Eva's welcome (his words) and the player's two lines to Eva. Only the player's line to Fish is still a draft.
 const APPROVED={evaWelcome:'Hey there! Welcome to Milked. First time here?',evaBusiness:'We\'re a little different from your average entertainment venue. We\'re both an adult streaming platform and a sperm bank. Our performers earn credits based on the samples collected from viewers tuning in from home.',
  evaWhy:'So, what brings you in today? Business or pleasure?',youFish:'Admin sent me. I\'m here to see Fish.',youHi:'He also said to tell you hi.'};
 APPROVED.youHalden='Admin sent me. He wants anything you can find on a man named Halden Reyes.';   // approved by the owner 18 Nov 2026
 const DRAFT={};
 const PROPOSED=Object.values(DRAFT);
 const isProposed=t=>typeof t==='string'&&PROPOSED.includes(t);
 const ZH='给我一点时间调查一下。如果有什么消息，我会给你打电话。',EN='Give me some time to work on it. I\'ll call you if anything comes up.';
 const CORPORATE={id:'m003-corporate-connections',number:3,title:'Corporate Connections',type:'main',category:'Intelligence gathering',giver:'admin',location:'milked',description:'',
  start:{how:'person',accept:true,no:'NOT NOW'},   // in person, as 002: Admin's briefing, then ACCEPT / NOT NOW
  offer:[A('I did some digging. Halden Reyes has ties to an arms dealer who works closely with The Function.'),A('I know an intel broker named Fish. She\'s a close friend of mine and works over at Milked. She might be able to tell us more.'),
   A('Head over there and let the receptionist, Eva, know you\'re there to see Fish.'),A('And tell Eva I said hi.')],
  objectives:[
   // Objective 1: done as the player walks into Milked (places.js 'milked'); the arrow then leads to Eva at reception
   {id:'travel-milked',kind:'enter',place:'milked',label:'Travel to Milked.',npc:'',item:'',say:[],early:[]},
   // Objective 2: Eva (the drafts, the player's lines, then her two recorded lines); her last line opens the staff-only door for this player (unlock mf_milkedStaff)
   {id:'speak-eva',kind:'talk',npc:'milked-eva',label:'Speak with Eva at reception.',place:'',item:'',early:[],
    say:[EVA(APPROVED.evaWelcome),EVA(APPROVED.evaBusiness),EVA(APPROVED.evaWhy),YOU(APPROVED.youFish),YOU(APPROVED.youHi),EVA('Oh, Admin! Tell him I said hi, too.'),EVA('Fish is through the staff-only door. You\'ll find her in her office.')]},
   // Objective 3: Fish answers in Mandarin; the V1 translation line right after hers (in her OWN voice, English: the owner's standard) is played over it (voice-clips.js) and shown under it as V1 TRANSLATION
   {id:'meet-fish',kind:'talk',npc:'milked-fish',label:'Meet Fish in her office.',place:'',item:'',early:[],say:[YOU(APPROVED.youHalden),FISH(ZH),V1T(EN)]},
   // Objective 4: done by itself right after Fish; her follow-up call becomes due after in-game time (FOLLOWUPS)
   {id:'await-fish',kind:'await-call',npc:'milked-fish',label:'Await Fish\'s response.',place:'',item:'',say:[],early:[]}],
  ending:{npc:'',place:'',label:'',say:[]},choices:[],
  unlocks:[{kind:'flag',id:'milkedStaff',value:true,when:'speak-eva'},{kind:'contact',id:'milked-fish',when:'meet-fish'},{kind:'follow',id:'milked-fish',when:'meet-fish'}]};
 /* Follow-up calls that become due after IN-GAME time (the owner, 17 Nov 2026: Fish's callback waits on in-game time; game-clock.js: 12 in-game minutes a real minute of
    walking or flight; story.flags.gameMin). `after`: the mission whose completion starts the wait; `gameMinutes`: how long, in in-game minutes (the one place to change it:
    360 = 6 in-game hours, about 30 minutes of play: the owner, so a player can finish a side mission meanwhile); `event`: fired once when due (story.flags ev_<event> = true). STUB: the owner's script for the call and the next
    mission are not written; nothing is delivered to the player yet. */
 const FOLLOWUPS=[{event:'fish-followup-due',after:'m003-corporate-connections',gameMinutes:360,from:'milked-fish',channel:'comms',status:'live',note:'Fish\'s follow-up call: delivered by Mission 004 (A Promising Investment), which starts by her Comms call on the same in-game timer (20 Nov 2026).'}];
 /* ======== THE AWAKENING CONTINUATION: MISSIONS 004-011 (the owner's spec, 20 Nov 2026, APPROVED: his dialogue below is used word for word) and the FIRST CARGO
    DELIVERY tree (Mission 012). Built from the reusable mechanics of mission-mechanics.js (observe, overhear, sneak, collect, report, call, in-game wait, camera feed,
    tail, leave, flight; mission cast and evidence) and the existing ones (apartments and locations from modules, hack steps, zones and armed people, photo steps).
    Every word, place, person, reward and timer is data: the Mission Editor edits all of it.
    - Fish speaks Mandarin with the V1's English translation (the owner's standard): her Comms call (Mission 004's start and her reply in step 6) shows the owner's
      English as the V1 TRANSLATION transcript. Her Mandarin originals are NOT written here (no invented text): the owner supplies them (or approves a translation) before
      anything is recorded. Every new line is text only: NEEDS APPROVAL BEFORE RECORDING (docs/VOICE: the re-voice queue; nothing is generated).
    - Places: the underground tea house and fight pit are the shared tunnel network's places (places.js 'under-tea-room', 'under-fight-pit', quarter 'underground').
    - Short functional words (objective labels, notification titles, control hints naming the real keys) are Claude's; the First Cargo Delivery lines of Admin, Iris and
      Rook are PROPOSED placeholders (PROPOSED_CARGO below) until the owner approves or rewrites them. */
 const IRIS=t=>({who:'iris',text:t}),AS1=t=>({who:'tea-associate-1',text:t}),AS2=t=>({who:'tea-associate-2',text:t}),JUNO=t=>({who:'juno-vex',text:t}),BRA=t=>({who:'blackrock-associate',text:t}),ROOK=t=>({who:'rook',text:t});
 const FISH_CALL=['Hey. Remember that man Admin asked you about? Halden Reyes?','I found something interesting. He\'s the founder of a company called Veyra Dynamics. They\'re developing some impressive transportation technology, but they\'re running out of money.',
  'Juno Vex has been arranging meetings between him and a group of private investors.','What\'s strange is that I can\'t find any public records identifying these investors.','I traced some communications to two of Juno\'s associates. They\'re meeting at an underground tea house.',
  'I\'ve sent you their location.','See if you can find out who they\'re working for. And try not to make yourself noticed.'];
 const UT=-3;   // the tunnel network's floor (y), for people placed down there
 // (20 Nov 2026, the tea room host) the tea station became an island 0.8 m out from the partition with the host behind it: the two associates stand 1.05 m further east,
 // in front of it at its south end (the same 1.3 m apart, facing each other), instead of one behind the counter and the counter between them.
 const M004={id:'m004-a-promising-investment',number:4,title:'A Promising Investment',type:'main',category:'Intelligence gathering / Eavesdropping',giver:'milked-fish',location:'under-tea-room',description:'',
  // Fish's follow-up call (replaces the Mission 003 stub): due 6 in-game hours after Corporate Connections (game-clock.js; about 30 minutes of play)
  start:{how:'notification',channel:'comms',from:'milked-fish',header:'FISH // INCOMING CALL · V1 TRANSLATION',text:FISH_CALL.join('\n'),when:{kind:'game-time',mission:'m003-corporate-connections',value:360}},
  offer:[],
  cast:[{id:'tea-associate-1',name:'Associate 1',model:'npc-office-m',place:'under-tea-room',x:-6.55,z:-104.2,y:UT,yaw:1.57,clip:'talk',from:'travel'},{id:'tea-associate-2',name:'Associate 2',model:'npc-executive',place:'under-tea-room',x:-5.25,z:-104.2,y:UT,yaw:-1.57,clip:'listen',from:'travel'}],
  evidence:[{id:'tea-talk',title:'Overheard at the tea house',kind:'audio',text:'Associate 1: "Reyes is getting desperate. He\'s running out of options."\nAssociate 2: "Has he agreed to the percentage?"\nAssociate 1: "Fifty-one. He\'s not happy about it, but he doesn\'t have much choice."\nAssociate 2: "And the admission requirement?"\nAssociate 1: "That comes later. The preliminary agreement has already been sent to his personal computer."\nAssociate 2: "The board wants this completed before the end of the week."'}],
  objectives:[
   {id:'receive-call',kind:'message',label:'Receive Fish\'s call.',npc:'',place:'',item:'',say:[],early:[]},
   // entering the tea house: Iris calls (the owner's lines)
   {id:'travel',kind:'enter',place:'under-tea-room',label:'Travel to the underground tea house.',via:'comms',npc:'',item:'',early:[],say:[IRIS('Fish brought me up to speed. Find somewhere nearby where you can hear them.'),IRIS('Don\'t get too close. You\'re just another customer having tea.')]},
   {id:'locate',kind:'observe',npc:'tea-associate-1',near:12,hold:2,label:'Locate the two associates.'},
   {id:'blend-in',kind:'observe',npc:'tea-associate-1',near:6,close:1.5,hold:6,label:'Sit or stand nearby without drawing attention (stay within about twenty feet, not right beside them).'},
   {id:'overhear',kind:'overhear',npc:'tea-associate-1',near:6,close:1.5,label:'Overhear their conversation.',
    say:[AS1('Reyes is getting desperate. He\'s running out of options.'),AS2('Has he agreed to the percentage?'),AS1('Fifty-one. He\'s not happy about it, but he doesn\'t have much choice.'),AS2('And the admission requirement?'),AS1('That comes later. The preliminary agreement has already been sent to his personal computer.'),AS2('The board wants this completed before the end of the week.')]},
   // the player reports from the V1 (REPORT TO FISH on the mission card); Fish's reply arrives as her call (English: the V1 translation)
   {id:'report',kind:'report',npc:'milked-fish',evidence:['tea-talk'],via:'comms',label:'Report the information to Fish (V1 Mission Log: REPORT TO FISH).',
    say:[FISH('Fifty-one percent? That\'s not an ordinary investment. Someone wants control of his company.'),FISH('I\'ve managed to find his residential address. I\'ll send it to you now.'),FISH('I\'ve also forwarded everything to Admin and Iris.')]}],
  ending:{npc:'',place:'',label:'',say:[]},choices:[],unlocks:[{kind:'evidence',id:'tea-talk',when:'overhear'}]};
 const REYES_LOC={id:'reyes',door:'apt-avenue-n-30',modules:[{id:'hall',type:'hall-luxury'},{id:'flat',type:'apt-luxury',number:105}],entry:'hall.street',links:[{a:'hall.d0',b:'flat.entry'}],locks:['hall.d0']};
 const M005={id:'m005-behind-closed-doors',number:5,title:'Behind Closed Doors',type:'main',category:'Infiltration / Hacking',giver:'iris',location:'avenue',description:'',
  start:{how:'notification',channel:'comms',from:'iris',header:'IRIS // INCOMING CALL',text:['Fish sent me the address. Reyes is away from home at the moment, so now\'s our opportunity.','You\'re going to need to get inside his apartment.','Approach the door\'s access panel. Your device can interface with it.','I\'ll walk you through the process.'].join('\n'),when:{kind:'after-mission',mission:'m004-a-promising-investment'}},
  offer:[],apartments:[REYES_LOC],
  evidence:[{id:'br-proposal',title:'Investment proposal (Halden Reyes)',kind:'document',text:'BLACKROCK HOLDINGS\nRecipient: Veyra Dynamics\nFounder: Halden Reyes\nProposed investment: 12,000,000 CR\nEquity transfer: 51%\nVoting rights: Majority control\nAdditional conditions: Confidential\nStatus: Pending admission'},
   {id:'reyes-message',title:'Message on Halden\'s computer',kind:'document',text:'"Mr. Reyes, your preliminary agreement has been received. Further instructions regarding admission will be provided following your final approval meeting."'},
   {id:'reyes-calendar',title:'Office address and calendar entry',kind:'document',text:'Veyra Dynamics office: No. 41, The Avenue.\nCalendar: confidential investment correspondence is stored on the company\'s internal network.'}],
  objectives:[
   {id:'receive-call',kind:'message',label:'Receive Iris\'s call.',npc:'',place:'',item:'',say:[],early:[]},
   {id:'locate-building',kind:'enter',place:'avenue',label:'Locate the apartment building: No. 31, The Avenue.',npc:'',item:'',say:[],early:[]},
   {id:'find-105',kind:'apt-enter',apt:'reyes',mod:'hall',label:'Find apartment 105 (inside No. 31).',npc:'',place:'',item:'',say:[],early:[]},
   // the existing beginner hack: E at the access point beside the door, hold until the bar fills (apartments.js HACK)
   {id:'hack-door',kind:'hack',ap:'reyes/hall.d0',hold:6,stay:true,unlock:true,label:'Hack the apartment door: face the access panel beside door 105, press E and stay at the panel until the bar fills.',npc:'',place:'',item:'',say:[],early:[]},
   {id:'search',kind:'apt-enter',apt:'reyes',mod:'flat',label:'Enter and search the apartment.',npc:'',place:'',item:'',say:[],early:[]},
   {id:'computer',kind:'apt-use',apt:'reyes',mod:'flat',object:'computer',label:'Access Halden\'s computer (E at the computer).',npc:'',place:'',item:'',say:[],early:[]},
   {id:'copy',kind:'collect',evidence:'br-proposal',apt:'reyes',mod:'flat',object:'computer',label:'Obtain a copy of the investment proposal (COPY TO V1).'},
   {id:'leave',kind:'apt-leave',apt:'reyes',label:'Leave the apartment.'},
   {id:'send',kind:'report',npc:'admin',evidence:['br-proposal'],via:'comms',label:'Send the evidence to Admin (V1 Mission Log: REPORT TO ADMIN).',
    say:[A('Blackrock Holdings. I\'ve heard that name before.'),A('They\'re offering him enough money to save his company, but taking control of it in return.'),A('That\'s not unusual around here. What interests me is this admission requirement.'),A('According to his correspondence, there\'s more information on the company\'s internal network.'),A('Let\'s take a look at his office.')]}],
  ending:{npc:'',place:'',label:'',say:[]},choices:[],unlocks:[{kind:'evidence',id:'reyes-message',when:'copy'},{kind:'evidence',id:'reyes-calendar',when:'copy'}]};
 const VEYRA_LOC={id:'veyra',door:'biz-avenue-n-41',entry:'lobby.s1',modules:[{id:'lobby',type:'elevator-lobby',x:10,z:10,rot:0,floor:0},{id:'lift',type:'elevator',x:11,z:12,rot:0,floor:0},{id:'lift1',type:'elevator',x:11,z:12,rot:0,floor:1},{id:'hall',type:'hall-office',x:11,z:8,rot:0,floor:1},{id:'office',type:'office-floor',x:10,z:3,rot:0,floor:1,lightsOff:true},{id:'store',type:'storage',x:9,z:8,rot:0,floor:1}]};
 const M006={id:'m006-hostile-takeover',number:6,title:'Hostile Takeover',type:'main',category:'Stealth / Corporate infiltration',giver:'iris',location:'avenue',description:'',
  start:{how:'notification',channel:'notify',from:'admin',text:'Veyra Dynamics office: No. 41, The Avenue. After business hours.',when:{kind:'after-mission',mission:'m005-behind-closed-doors'}},
  offer:[],apartments:[VEYRA_LOC],
  // one security guard patrols the office floor (NEUTRAL: he does not shoot; being seen sends the player back to the street: sneak / unseen)
  combat:{places:{veyra:'neutral'},armed:[{id:'night-guard',at:'veyra/office',figure:'security',role:'patrol',x:-4,z:3,yaw:0,route:[[4,3],[4,-3],[-4,-3]]},{id:'hall-guard',at:'veyra/hall',figure:'security',role:'patrol',x:0,z:-3,yaw:0,route:[[0,3]]}],onDeath:'retry'},
  evidence:[{id:'br-letters',title:'Halden Reyes and Blackrock: correspondence',kind:'document',text:'Confidential correspondence between Halden Reyes and Blackrock Holdings (Veyra Dynamics internal network, manager\'s computer).'},
   {id:'br-portfolio',title:'Presentation: businesses Blackrock has funded',kind:'document',text:'An attached presentation lists several businesses that Blackrock has successfully funded under similar investment arrangements.'},
   {id:'br-induction',title:'BLACKROCK — INTERNAL COMMUNICATION',kind:'document',text:'BLACKROCK — INTERNAL COMMUNICATION\nCandidate: Halden Reyes\nSponsor: Juno Vex\nAdmission status: Approved\nCouncil attendance: Six confirmed\nInduction documentation: Mandatory audiovisual recording\nChamber location: Restricted\n\n"Juno, I\'ll be at the usual place watching the fights. Meet me there before the induction. We need to confirm the surveillance arrangements."'}],
  objectives:[
   {id:'enter',kind:'apt-enter',apt:'veyra',mod:'lobby',label:'Enter the office building.',via:'comms',npc:'',place:'',item:'',early:[],
    say:[IRIS('There\'s security inside. Watch how they move before you go anywhere.'),IRIS('Use the furniture and corners to stay out of sight.'),IRIS('You\'re looking for the manager\'s computer. We want information, not a confrontation.')]},
   {id:'reach-floor',kind:'apt-enter',apt:'veyra',mod:'hall',label:'Reach the office floor (the elevator: E at its buttons).',npc:'',place:'',item:'',say:[],early:[]},
   {id:'avoid-guard',kind:'sneak',apt:'veyra',mod:'office',label:'Avoid the security guard (crouch to be seen less; seen: you are put back outside).'},
   {id:'manager-pc',kind:'apt-use',apt:'veyra',mod:'office',object:'manager-pc',unseen:true,label:'Access the manager\'s computer.',npc:'',place:'',item:'',say:[],early:[]},
   {id:'download',kind:'collect',evidence:'br-letters',apt:'veyra',mod:'office',object:'manager-pc',unseen:true,label:'Download internal communications (COPY TO V1).'},
   {id:'documents',kind:'collect',evidence:'br-induction',apt:'veyra',mod:'office',object:'manager-pc',unseen:true,label:'Locate the investment agreement and supporting documentation (COPY TO V1).'},
   {id:'leave',kind:'apt-leave',apt:'veyra',unseen:true,label:'Leave without raising an alarm.'},
   {id:'admin-call',kind:'call',via:'comms',label:'Take Admin\'s call.',say:[A('I had Fish look into those other companies.'),A('Almost every one of their founders has been involved in some kind of public scandal shortly after receiving funding.'),A('That\'s a hell of a coincidence.')]},
   {id:'iris-call',kind:'call',via:'comms',delay:4,label:'Take Iris\'s call.',say:[IRIS('The induction document mentions a mandatory recording.'),IRIS('Whatever happens during this admission ceremony, Blackrock wants a permanent record of it.'),IRIS('If we can find out where they\'re recording it, we might finally understand what they\'re doing.')]},
   {id:'admin-next',kind:'call',via:'comms',delay:4,label:'Take Admin\'s call.',say:[A('Sounds like Juno has another meeting scheduled. Let\'s see what we can learn from that.')]}],
  ending:{npc:'',place:'',label:'',say:[]},choices:[],unlocks:[{kind:'evidence',id:'br-portfolio',when:'documents'}]};
 // The associate's walk in Far South: up the tunnel stairs in the west yard (ncz-backalleys.js under-farsouth), along the west back alley, out onto Main Street to No. 166's back entrance
 const FS_ROUTE=[[36.2,-187.5],[37.5,-186],[37.5,-172.5],[48,-172.5],[52.6,-171.4],[52.6,-166.3]];
 const M007={id:'m007-the-house-always-wins',number:7,title:'The House Always Wins',type:'main',category:'Surveillance / Following',giver:'iris',location:'under-fight-pit',description:'',
  start:{how:'notification',channel:'comms',from:'iris',header:'IRIS // INCOMING CALL',text:['Juno\'s already inside. Find her and keep your distance.','There are enough people down there that you should be able to blend in.'].join('\n'),when:{kind:'after-mission',mission:'m006-hostile-takeover'}},
  offer:[],
  cast:[{id:'juno-vex',name:'Juno Vex',model:'npc-fixer',place:'under-fight-pit',x:-16.6,z:-141.4,y:UT,yaw:1.57,clip:'talk',until:'photograph'},{id:'blackrock-associate',name:'Blackrock associate',model:'npc-cyber-exec',place:'under-fight-pit',x:-15.4,z:-141.4,y:UT,yaw:-1.57,clip:'listen',until:'photograph'},
   {id:'spectator-1',name:'Spectator',model:'npc-club-m',place:'under-fight-pit',x:-12.4,z:-135.4,y:UT,yaw:3.14,clip:'cheer'},{id:'spectator-2',name:'Spectator',model:'npc-merc',place:'under-fight-pit',x:-14,z:-135.4,y:UT,yaw:3.14,clip:'cheer'},{id:'spectator-3',name:'Spectator',model:'npc-casual-f',place:'under-fight-pit',x:-10.8,z:-136.2,y:UT,yaw:-2.6,clip:'watch'},
   {id:'associate-street',name:'Blackrock associate',model:'npc-cyber-exec',place:'far-south',x:FS_ROUTE[0][0],z:FS_ROUTE[0][1],y:0,clip:'walk',route:FS_ROUTE,speed:1.2,from:'follow',until:'follow'},
   {id:'blackrock-entrance',name:'Commercial back entrance',model:'marker',place:'far-south',x:52.6,z:-166.4,y:1.2,from:'follow'}],
  evidence:[{id:'arena-talk',title:'Juno Vex and the Blackrock associate',kind:'audio',text:'Juno Vex: "Is everything prepared for Reyes?"\nBlackrock associate: "The chamber is ready. All six members have confirmed."\nJuno Vex: "Make sure the recording system is operational. We don\'t want a repeat of the last induction."\nBlackrock associate: "It\'s been moved onto a private network. The recording equipment is connected directly to the corporate facility."\nJuno Vex: "Good. Let me know when everything\'s ready."'}],
  objectives:[
   {id:'receive-call',kind:'message',label:'Receive Iris\'s call.',npc:'',place:'',item:'',say:[],early:[]},
   {id:'enter-arena',kind:'enter',place:'under-fight-pit',label:'Enter the underground fighting arena.',npc:'',item:'',say:[],early:[]},
   {id:'find-juno',kind:'observe',npc:'juno-vex',near:15,hold:2,label:'Locate Juno Vex.'},
   {id:'observe',kind:'overhear',npc:'juno-vex',near:8,close:2,label:'Observe her meeting with a Blackrock associate (blend in with the spectators; not too close).',
    say:[JUNO('Is everything prepared for Reyes?'),BRA('The chamber is ready. All six members have confirmed.'),JUNO('Make sure the recording system is operational. We don\'t want a repeat of the last induction.'),BRA('It\'s been moved onto a private network. The recording equipment is connected directly to the corporate facility.'),JUNO('Good. Let me know when everything\'s ready.')]},
   {id:'photograph',kind:'photo',npc:'blackrock-associate',label:'Photograph the associate (V1 Camera: L, Camera app, left click).',place:'',item:'',say:[],early:[]},
   {id:'follow',kind:'tail',npc:'associate-street',near:25,close:3,label:'Follow the associate when he leaves: he comes up the stairs into Far South. Keep your distance.'},
   {id:'see-entrance',kind:'observe',npc:'blackrock-entrance',near:20,hold:1,label:'Observe him entering a commercial back entrance.'},
   {id:'photo-entrance',kind:'photo',npc:'blackrock-entrance',label:'Photograph the entrance.',place:'',item:'',say:[],early:[]},
   {id:'send-location',kind:'report',npc:'iris',via:'comms',label:'Send its location to Iris (V1 Mission Log: REPORT TO IRIS).',
    say:[IRIS('Fish identified the person you photographed.'),IRIS('He works for a surveillance contractor that maintains private security equipment for several corporations.'),IRIS('That building appears to be one of their maintenance offices.'),IRIS('Get me a look inside. We need to find out where that camera system connects.')]}],
  ending:{npc:'',place:'',label:'',say:[]},choices:[],unlocks:[{kind:'evidence',id:'arena-talk',when:'observe'}]};
 const CONTRACTOR_LOC={id:'contractor',door:'biz-main-w-166',from:'enter',entry:'shop.s1',modules:[{id:'shop',type:'shop-back',x:10,z:10,rot:0,floor:0},{id:'hall',type:'hall-commercial',x:11,z:13,rot:0,floor:0},{id:'store',type:'storage',x:8,z:10,rot:0,floor:0},{id:'maint',type:'maint-corridor',x:13,z:10,rot:0,floor:0}]};
 const M008={id:'m008-private-network',number:8,title:'Private Network',type:'main',category:'Commercial infiltration / Network investigation',giver:'iris',location:'far-south',description:'',
  start:{how:'notification',channel:'notify',from:'iris',text:'Surveillance contractor\'s maintenance office: No. 166, Main Street (Far South), back entrance.',when:{kind:'after-mission',mission:'m007-the-house-always-wins'}},
  offer:[],apartments:[CONTRACTOR_LOC],cast:[{id:'blackrock-entrance',name:'Commercial back entrance',model:'marker',place:'far-south',x:52.6,z:-166.4,y:1.2,until:'locate'}],
  evidence:[{id:'br04-route',title:'Junction panel: where the camera network goes',kind:'document',text:'Camera BR-04 — private network route.\nArchive destination: Corporate server facility (Corporate District).'},
   {id:'br04-record',title:'BLACKROCK PRIVATE SURVEILLANCE — BR-04',kind:'document',text:'BLACKROCK PRIVATE SURVEILLANCE\nCamera: BR-04\nLocation: Restricted basement chamber\nAudio capture: Enabled\nRecording: Mandatory\nNetwork access: Internal only\nArchive destination: Corporate server facility\nScheduled activation: Next approved induction'}],
  objectives:[
   {id:'locate',kind:'observe',npc:'blackrock-entrance',near:8,hold:1,label:'Locate the commercial entrance (No. 166, Main Street, Far South).'},
   {id:'hack-panel',kind:'hack',ap:'biz-main-w-166',hold:8,stay:true,unlock:true,label:'Hack the access panel (E at the panel beside the door; stay until the bar fills).',npc:'',place:'',item:'',say:[],early:[]},
   {id:'enter',kind:'apt-enter',apt:'contractor',label:'Enter the maintenance office.',npc:'',place:'',item:'',say:[],early:[]},
   {id:'terminals',kind:'apt-use',apt:'contractor',mod:'shop',object:'computer',label:'Search the available computer terminals.',npc:'',place:'',item:'',say:[],early:[]},
   {id:'junction',kind:'apt-use',apt:'contractor',mod:'maint',object:'panel',label:'Access the junction panel (in the maintenance corridor).',npc:'',place:'',item:'',say:[],early:[]},
   {id:'destination',kind:'collect',evidence:'br04-route',apt:'contractor',mod:'maint',object:'panel',label:'Locate the surveillance network\'s destination (COPY TO V1).'},
   {id:'records',kind:'collect',evidence:'br04-record',apt:'contractor',mod:'shop',object:'computer',label:'Obtain the camera\'s maintenance records (the back room\'s computer: COPY TO V1).'},
   {id:'leave',kind:'apt-leave',apt:'contractor',via:'comms',label:'Leave the building.',
    say:[IRIS('BR-04. That\'s our camera.'),IRIS('The feed is routed through a private server facility in the Corporate District. We won\'t be able to access it from here.'),IRIS('But now we know exactly where to look.'),IRIS('I\'ve marked the facility on your map. We\'re going to have to get inside.')]}],
  ending:{npc:'',place:'',label:'',say:[]},choices:[],unlocks:[]};
 // The network facility behind the Corporate District's MAINTENANCE DOOR (the back alley; corporate.js corp-back-door; apartments.js CORP_DOORS)
 const FACILITY_LOC={id:'facility',door:'biz-corp-s-40',from:'patrols',entry:'maint.s0',modules:[{id:'maint',type:'maint-corridor',x:10,z:10,rot:0,floor:0},{id:'lobby',type:'elevator-lobby',x:9,z:13,rot:0,floor:0},{id:'hall',type:'hall-office',x:6,z:11,rot:1,floor:0},{id:'security',type:'bar-back',x:11,z:10,rot:0,floor:0},{id:'servers',type:'server-room',x:9,z:15,rot:0,floor:0}]};
 const M009={id:'m009-ghost-in-the-network',number:9,title:'Ghost in the Network',type:'main',category:'Corporate infiltration / Advanced hacking',giver:'iris',location:'corporate',description:'',
  start:{how:'notification',channel:'notify',from:'iris',text:'Blackrock network facility: the Corporate District, the maintenance door on the back alley. Marked on your map.',when:{kind:'after-mission',mission:'m008-private-network'}},
  offer:[],apartments:[FACILITY_LOC],
  combat:{places:{facility:'neutral'},armed:[{id:'lobby-guard',at:'facility/lobby',figure:'security',role:'patrol',x:-2,z:0,yaw:1.57,route:[[2,0]]},{id:'security-guard',at:'facility/security',figure:'security',role:'guard',x:1.5,z:1.5,yaw:3.14}],onDeath:'retry'},
  cast:[{id:'facility-door',name:'Maintenance door',model:'marker',place:'corporate',x:-40,z:-90.4,y:1.2,until:'locate'}],
  objectives:[
   {id:'travel',kind:'enter',place:'corporate',via:'comms',label:'Travel to the Corporate District through the Function Gate.',npc:'',item:'',early:[],
    say:[IRIS('The camera feed is on a private network. Once you\'re at the core server, I should be able to establish a connection.'),IRIS('Don\'t touch anything unnecessary. We\'re not here to shut them down.')]},
   {id:'locate',kind:'observe',npc:'facility-door',near:10,hold:1,label:'Locate the network facility (the maintenance door, back alley).'},
   {id:'access',kind:'hack',ap:'biz-corp-s-40',hold:8,stay:true,unlock:true,label:'Obtain access to the restricted area (hack the keypad: E, stay until the bar fills).',npc:'',place:'',item:'',say:[],early:[]},
   {id:'patrols',kind:'sneak',apt:'facility',mod:'servers',label:'Avoid security patrols.'},
   {id:'server-room',kind:'apt-enter',apt:'facility',mod:'servers',unseen:true,label:'Enter the server room.',npc:'',place:'',item:'',say:[],early:[]},
   {id:'core',kind:'apt-use',apt:'facility',mod:'servers',object:'core',unseen:true,label:'Locate the core server rack.',npc:'',place:'',item:'',say:[],early:[]},
   {id:'advanced-hack',kind:'hack',ap:'facility/servers.s1',hold:20,stay:true,unseen:true,label:'Complete an advanced hacking challenge (the server room\'s access point: E, stay 20 seconds).',npc:'',place:'',item:'',say:[],early:[]},
   {id:'find-br04',kind:'apt-use',apt:'facility',mod:'servers',object:'terminal',unseen:true,label:'Locate camera BR-04 (the server room terminal).',npc:'',place:'',item:'',say:[],early:[]},
   {id:'remote-access',kind:'apt-use',apt:'facility',mod:'servers',object:'core',unseen:true,via:'comms',label:'Establish remote access through the V1 (E at the core rack).',npc:'',place:'',item:'',early:[],
    say:[IRIS('That\'s it. I\'ve established a connection to the camera.'),IRIS('The camera isn\'t transmitting yet, but I\'ve configured your device to notify you the moment it becomes active.'),IRIS('Get somewhere safe. When that camera comes online, I want you to record everything.')]},
   {id:'exit',kind:'apt-leave',apt:'facility',unseen:true,label:'Exit the building.'}],
  ending:{npc:'',place:'',label:'',say:[]},choices:[],unlocks:[]};
 // The owner's ritual dialogue on the EXISTING Blackrock Cult Room sequence (cult-room.js defaultScene): the same beats and choreography; only the empty line slots
 // carry his words (the six in unison as "All six (together)", Halden as the initiate), three line slots added before the initiate rises; the laugh slot stays silent
 // ("brief laughter": a laugh voice file can be imported for it). Nothing moves differently.
 const RL=(who,text,extra={})=>({act:'line',who,text,...extra});
 const RITUAL={radius:2.6,speed:.5,beats:[{act:'pause',secs:3},{act:'door',open:true},{act:'enter',wait:.5},{act:'turn',who:'six',to:'initiate',wait:2,secs:3},{act:'door',open:false,wait:.5},
  RL('robed-all','Are you ready for your Awakening, brother?',{wait:2}),RL('initiate','Yes. I am.',{wait:1.5}),
  RL('robed-all','Do you willingly surrender fifty-one percent of your enterprise in exchange for the prosperity, protection and influence of Blackrock?',{wait:1.5}),RL('initiate','I do.',{wait:1.5}),
  RL('robed-all','We offer you wealth in exchange for loyalty. Power in exchange for obedience. Brotherhood in exchange for sacrifice.',{wait:1.5}),
  RL('robed-all','To become one of us, you must surrender more than your enterprise. You must surrender your pride.',{wait:1.5}),
  RL('robed-all','Before you lies the vessel of sacrifice. Within it awaits your humiliation.',{wait:1.5}),
  RL('robed-all','Do you accept that your humiliation must become public knowledge, and that you shall bear its consequences without denial or regret?',{wait:1.5}),
  RL('initiate','Yes.',{wait:1.5}),RL('robed-all','Good. Accept your humiliation, brother.',{wait:1.5}),
  {act:'rise',wait:2},{act:'turn',who:'six',to:'owl',wait:2,secs:4},{act:'walk',who:'initiate',to:'altar',wait:2,speed:.42},{act:'card',wait:1.5},{act:'anim',who:'initiate',clip:'read',secs:5},
  RL('initiate','Fucking dogs!?',{anim:'shock',wait:.5}),RL('robed-all','',{anim:'laugh',secs:3.5,wait:.6}),
  {act:'door',open:true,wait:2},{act:'exit',wait:1},{act:'door',open:false,wait:1},{act:'pause',secs:2}]};
 const M010={id:'m010-the-price-of-admission',number:10,title:'The Price of Admission',type:'main',category:'Remote surveillance',giver:'iris',location:'district',description:'',
  // a short in-game wait after Mission 009 (60 in-game minutes, about 5 minutes of play), then the V1 notification
  start:{how:'notification',channel:'comms',from:'iris',header:'BLACKROCK CAMERA BR-04 — NOW ONLINE',text:'The camera\'s online. Open the feed. Make sure you\'re recording.',when:{kind:'game-time',mission:'m009-ghost-in-the-network',value:60}},
  offer:[],feeds:[{id:'br-04',room:'blackrock-cult',scene:RITUAL}],
  evidence:[{id:'induction-rec',title:'RECORDING — BLACKROCK INDUCTION',kind:'recording',text:'Camera BR-04: the Blackrock induction of Halden Reyes, recorded through the V1 (the video is in your V1 Gallery).'}],
  objectives:[
   {id:'notice',kind:'message',label:'BLACKROCK CAMERA BR-04 — NOW ONLINE.',npc:'',place:'',item:'',say:[],early:[]},
   {id:'open-feed',kind:'feed',feed:'br-04',stage:'open',label:'Open the remote camera feed (V1 Mission Log: OPEN REMOTE FEED).'},
   {id:'observe',kind:'feed',feed:'br-04',stage:'watched',label:'Observe the complete Blackrock initiation.'},
   {id:'record',kind:'feed',feed:'br-04',stage:'recorded',label:'Record the ceremony.'},
   {id:'save',kind:'feed',feed:'br-04',stage:'saved',label:'Save the recording.'},
   {id:'admin-call',kind:'call',via:'comms',delay:3,label:'Take Admin\'s call.',say:[A('Tell me you recorded that.'),A('Good. Don\'t send it over an open channel. Bring it back here.'),A('I think we\'ve just stumbled onto something worth a considerable amount of money.')]},
   {id:'return',kind:'enter',place:'district',label:'Return to The Darknet District.',npc:'',item:'',say:[],early:[]}],
  ending:{npc:'',place:'',label:'',say:[]},choices:[],unlocks:[{kind:'evidence',id:'induction-rec',when:'save'}]};
 // Mission 011: the reward (REWARD below) and the Kestrel; the First Cargo Delivery tree starts when it is done
 const REWARD=5000;   // the owner set it to 5,000 CR (21 Nov 2026; was 25,000); one number, editable in the Mission Editor (the credits unlock at "Receive the credit reward")
 const ALL_EVIDENCE=['tea-talk','br-proposal','br-induction','arena-talk','br04-record','induction-rec'];
 const M011={id:'m011-leverage',number:11,title:'Leverage',type:'main',category:'Information sale',giver:'admin',location:'district-meeting',description:'',
  start:{how:'notification',channel:'notify',from:'admin',text:'Meet Admin and Iris in the private meeting room.',when:{kind:'after-mission',mission:'m010-the-price-of-admission'}},
  offer:[],
  objectives:[
   {id:'meet',kind:'enter',place:'district-meeting',label:'Meet Admin and Iris in the private meeting room.',npc:'',item:'',say:[],early:[]},
   // a hand-over in person: only inside the meeting room, with the evidence collected so far (no return trips)
   {id:'deliver',kind:'report',npc:'admin',place:'district-meeting',evidence:ALL_EVIDENCE,label:'Deliver the complete collection of evidence (V1 Mission Log: HAND OVER TO ADMIN).',
    say:[A('Fifty-one percent of the company, and a public scandal to make sure he never walks away.'),A('Now I understand why so many of these executives seem to destroy their own reputations after receiving funding.'),A('It isn\'t stupidity. It\'s the price of membership.'),
     IRIS('The investment documents establish the financial arrangement. The recording establishes the additional conditions of membership.'),IRIS('Together, they\'re considerably more valuable than either piece of evidence on its own.'),
     A('And someone out there is going to pay very good money for both.'),A('There\'s a shareholder who\'s been trying to figure out exactly what Blackrock is offering Reyes.'),A('Fish thinks they\'ll pay handsomely for what we\'ve collected.'),A('Give us a little time to arrange the transaction.')]},
   // a short in-game wait (120 in-game minutes, about 10 minutes of play): side missions and exploring meanwhile
   {id:'await-sale',kind:'wait-game',minutes:120,label:'Await the completion of the information sale.'},
   {id:'admin-call',kind:'call',via:'comms',label:'Take Admin\'s call.',say:[A('Come see me when you\'ve got a minute. I\'ve got some good news.')]},
   {id:'return',kind:'talk',npc:'admin',label:'Return to Admin.',place:'',item:'',early:[],
    say:[A('Fish found us a buyer. Someone with a rather substantial investment in Veyra Dynamics.'),A('Turns out they weren\'t particularly excited about handing control of their investment to a religious society of corporate psychopaths.')]},
   {id:'reward',kind:'hear',npc:'admin',label:'Receive the credit reward.',place:'',item:'',early:[],say:[A('The money\'s cleared. You\'ve earned your share.')]},
   {id:'kestrel',kind:'hear',npc:'admin',label:'Receive ownership of the Kestrel.',place:'',item:'',early:[],
    say:[A('You\'ve proven you can handle yourself.'),A('You know how to gather information, get into places you shouldn\'t be, and get out without causing too much trouble.'),A('Frankly, I could use someone like you beyond NeoChinatown.'),A('I\'ve got a ship sitting at the Port. She\'s an older light transport, but she\'s reliable.'),A('Her name\'s the Kestrel.'),A('I\'ve transferred ownership to you. Consider it an investment in our future business relationship.')]},
   {id:'instructions',kind:'hear',npc:'admin',label:'Receive instructions for the first off-world cargo delivery.',place:'',item:'',early:[],
    say:[A('There\'s a shipment I need delivered to an associate of mine at Meridian Station. His name is Rook.'),A('The cargo\'s already been loaded aboard.'),A('Get it there safely and he\'ll pay you for the delivery.'),A('Congratulations. You\'re a runner now.')]}],
  ending:{npc:'',place:'',label:'',say:[]},choices:[],
  // paid ONCE (unlocks at a step are applied when that step is done, never again); the Kestrel is the existing ship ('starter' = Kestrel / 01): campaign.js awardStarterShip
  // is idempotent and never resets owned ships; the cargo tree's link fires once (ts_first-cargo-delivery)
  unlocks:[{kind:'credits',amount:REWARD,when:'reward'},{kind:'ship',id:'starter',when:'kestrel'},{kind:'flag',id:'kestrelCargo',value:'aboard',when:'instructions'},{kind:'tree',id:'first-cargo-delivery',when:'instructions'}]};
 /* THE FIRST CARGO DELIVERY TREE (Mission 012): the owner's "Kestrel First Flight and Ship Loadout Tutorial" spec (20 Nov 2026). Unlocked by Mission 011. Iris guides
    the player by Comms from the Kestrel's handover to Rook's payment, on the game's existing systems only: the Ship Loadout app (ship-loadout.js), the Port and Pad 01,
    boarding, the cockpit and flight controls (input.js / keymap.js defaults; the KeyMap, K, shows the player's own), the V1 Map app's navigation (flight-nav.js), the
    jump (Tessaly to Meridian has no interdiction: a peaceful flight, no combat), Meridian docking, Rook at the Dead Channel bar. Each instruction waits for the player to
    do it (the next step only completes when they have); the cockpit is explained in short timed calls once aboard. A missed call never blocks anything: the steps
    complete on what the player does, and every call stays in RECENT CALLS.
    Lines: IRIS_OK are the owner's own (spec sections 2, 4 and 7, APPROVED, verbatim). IRIS_NEW are Claude's wording (spec section 3's examples adapted to what the Ship
    Loadout app really shows, and the short tutorial lines the spec asks for): NEEDS OWNER APPROVAL BEFORE RECORDING. Rook's two lines stay PROPOSED placeholders.
    Payment: 500 CR, the existing Rook freight run's pay (campaign.js rookRunBase). */
 const IRIS_OK={congrats:'Congratulations on your new ship. Admin asked me to help you get familiar with her before your first assignment.',walk:'I\'ll walk you through everything you need to know. Let\'s start with your ship\'s loadout.',
  there:'There she is. The Kestrel. Not the newest ship in the Tessaly System, but she\'s reliable.',boardHer:'Go ahead and board her. Let\'s get you acquainted with the controls.',
  nicely:'Nicely done. You\'ve officially completed your first flight.',rook:'Admin\'s contact, Rook, is expecting you. Get that shipment delivered and collect your payment.'};
 const IRIS_NEW={
  review:'This is where you can review your ship\'s equipment and configuration.',
  slots:'Each slot shows what\'s fitted: primary lasers, shield, drive, missiles, utility and the module bays.',
  manage:'You can manage your loadout from here as you acquire additional equipment. Your default missile is set here too.',
  admin:'If you\'re looking for something with a little more firepower, speak to Admin. He can help you with ship ordnance.',
  port:'When you\'re ready, head to the Port. She\'s waiting on Pad 01.',
  display:'You\'re in. Your speed, hull and shields are on the display. Keep an eye on them.',
  controls:'Mouse to aim. W and S pitch, A and D turn, Q and R roll. Left Shift for thrust, X to brake.',
  weapons:'Space fires the lasers, F a missile. You won\'t need either today. This run should be quiet.',
  nav:'Navigation is on your V1. Open the Map app, select Meridian Station, then fly into its marker.',
  course:'That\'s the one. Hold her steady and the jump starts by itself.',
  jump:'Smooth. Meridian\'s ahead. Docking is automatic once you arrive.'};
 const PROPOSED_CARGO={...IRIS_NEW,rookMeet:'PROPOSED: You\'re Admin\'s new runner. Cargo intact?',rookPay:'PROPOSED: Good. Here\'s your fee. Come back when you want more work.'};
 const M012={id:'m012-first-cargo-delivery',number:12,title:'First Cargo Delivery',type:'cargo',category:'First flight / Off-world cargo delivery',giver:'iris',location:'port',description:'',
  start:{how:'notification',channel:'comms',from:'iris',header:'IRIS // INCOMING CALL',text:IRIS_OK.congrats+'\n'+IRIS_OK.walk,when:{kind:'after-mission',mission:'m011-leverage'}},
  offer:[],rewards:500,
  objectives:[
   {id:'notice',kind:'message',label:'Take Iris\'s call.',npc:'',place:'',item:'',say:[],early:[]},
   // the Ship Loadout app (installed with the ship: ordnance.js grant); its tile glows in mission yellow (step app)
   {id:'loadout',kind:'v1-app',app:'loadout',via:'comms',label:'Open your V1 (L) and select the Ship Loadout app.',
    say:[IRIS(IRIS_NEW.review),IRIS(IRIS_NEW.slots),IRIS(IRIS_NEW.manage),IRIS(IRIS_NEW.admin),IRIS(IRIS_NEW.port)]},
   {id:'port',kind:'enter',place:'port',label:'Travel to the Port.',npc:'',item:'',say:[],early:[]},
   {id:'find-kestrel',kind:'enter',place:'landing-pad',via:'comms',label:'Find the Kestrel on Pad 01.',npc:'',item:'',early:[],say:[IRIS(IRIS_OK.there),IRIS(IRIS_OK.boardHer)]},
   {id:'board',kind:'flight',stage:'board',label:'Board the Kestrel (E at the ship).'},
   // the cockpit in small sections: short timed calls once aboard (nothing to fail; each stays in RECENT CALLS)
   {id:'cockpit-display',kind:'call',via:'comms',delay:3,label:'Listen to Iris: the cockpit display.',say:[IRIS(IRIS_NEW.display)]},
   {id:'cockpit-controls',kind:'call',via:'comms',delay:10,label:'Listen to Iris: the flight controls.',say:[IRIS(IRIS_NEW.controls)]},
   {id:'cockpit-weapons',kind:'call',via:'comms',delay:12,label:'Listen to Iris: the weapons.',say:[IRIS(IRIS_NEW.weapons)]},
   {id:'cockpit-nav',kind:'call',via:'comms',delay:10,label:'Listen to Iris: navigation.',say:[IRIS(IRIS_NEW.nav)]},
   {id:'set-course',kind:'flight',stage:'launch',app:'map',via:'comms',label:'Take off and set Meridian Station as your destination (V1 Map: select it, then fly into its marker).',say:[IRIS(IRIS_NEW.course)]},
   {id:'jump',kind:'flight',stage:'jump',place:'meridian',via:'comms',label:'Make the jump to Meridian Station.',say:[IRIS(IRIS_NEW.jump)]},
   {id:'dock',kind:'arrive',place:'meridian',via:'comms',label:'Approach and dock at Meridian Station.',npc:'',item:'',early:[],say:[IRIS(IRIS_OK.nicely),IRIS(IRIS_OK.rook)]},
   {id:'meet-rook',kind:'talk',npc:'rook',label:'Meet Rook at the Dead Channel bar.',place:'',item:'',early:[],say:[ROOK(PROPOSED_CARGO.rookMeet)]},
   {id:'deliver',kind:'hear',npc:'rook',label:'Deliver the cargo and collect your payment.',place:'',item:'',early:[],say:[ROOK(PROPOSED_CARGO.rookPay)]}],
  ending:{npc:'',place:'',label:'',say:[]},choices:[],unlocks:[{kind:'flag',id:'kestrelCargo',value:'delivered',when:'deliver'},{kind:'contract-flag',id:'rook-first-delivery-done',value:true,when:'deliver'}]};   // the contract with the flight Map / Rook's cargo board (branch claude/flight-map-coords)
 const CARGO_TREE_ID='first-cargo-delivery';
 const CARGO_TREE={id:CARGO_TREE_ID,name:'First Cargo Delivery',note:'Unlocked by Mission 011 (Leverage): Iris\'s Kestrel first flight and Ship Loadout tutorial and the first run, to Rook at Meridian Station. New lines need the owner\'s approval before recording.',status:'active',shipped:true,seq:2,missions:[M012]};
 const isProposedCargo=t=>typeof t==='string'&&Object.values(PROPOSED_CARGO).includes(t);
 const isApprovedCargo=t=>typeof t==='string'&&Object.values(IRIS_OK).includes(t);
 /* What a speaker turns toward while saying a step's last line (milked-build.js gesture): Eva toward the staff-only door. */
 const GESTURES={'m003-corporate-connections/speak-eva':{who:'milked-eva',toward:'staff-door',seconds:4}};
 const TREE={id:TREE_ID,name:'Awakening',note:'Your Awakening tree. Mission 001 starts the first time a player leaves their Sleeping Pod; Missions 002 to 011 follow it (the owner\'s continuation, 20 Nov 2026); Mission 011 starts the First Cargo Delivery tree.',status:'active',shipped:true,seq:1,missions:[AWAKENING,EYES,CORPORATE,M004,M005,M006,M007,M008,M009,M010,M011]};
 const clone=v=>JSON.parse(JSON.stringify(v));
 /* The shipped story trees (copies: callers may edit them). */
 const trees=()=>[clone(TREE),clone(CARGO_TREE)];
 const STORY_TREES=[TREE_ID,CARGO_TREE_ID];
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
 const SUPERSEDED={'m002-eyes-on-the-street/enter-null':[['Your V1 has a camera. Press L to open your device, then select the Camera app.','Point it at the target. Your device should identify them automatically.','Left click will take a picture','Once you\'ve taken the photograph, open Messages, select my conversation, attach the photograph, and send it to me.','Nothing complicated. Just keep your eyes open.']],
  'm003-corporate-connections/speak-eva':[['Welcome to Milked! I\'m Eva. Can I get you a water while you wait?','We\'re the district\'s top adult stream and donor programme. Members watch from home; a courier collects their donations.','Performers are paid by volume collected. Our top earner led the board three quarters running. We\'re so proud of her.','Admin sent me. I\'m here to see Fish.','He also said to tell you hi.','Oh, Admin! Tell him I said hi, too.','Fish is through the staff-only door. You\'ll find her in her office.']]};
 const textsOf=say=>(say||[]).map(l=>l&&l.text);
 function refreshShipped(tree,shipped=TREE){let changed=0;for(const m of (tree&&tree.missions)||[])for(const o of (m&&m.objectives)||[]){const old=SUPERSEDED[m.id+'/'+o.id];if(!old)continue;
   const now=textsOf(o.say);if(!old.some(v=>v.length===now.length&&v.every((t,i)=>t===now[i])))continue;
   const sm=shipped.missions.find(x=>x.id===m.id),so=sm&&sm.objectives.find(x=>x.id===o.id);if(!so)continue;o.say=JSON.parse(JSON.stringify(so.say));changed++;}
  return changed;}
 const api={M004,M005,M006,M007,M008,M009,M010,M011,M012,CARGO_TREE,CARGO_TREE_ID,PROPOSED_CARGO,IRIS_OK,IRIS_NEW,isProposedCargo,isApprovedCargo,REWARD,ALL_EVIDENCE,RITUAL,FISH_CALL,CORPORATE,APPROVED,DRAFT,PROPOSED,isProposed,FOLLOWUPS,GESTURES,TRANSLATION:{zh:ZH,en:EN},TREE_ID,SUPERSEDED,refreshShipped,STORY_TREES,NUMBERS,MISSION_IDS,PLACEHOLDER,TREE,AWAKENING,EYES,OLD_NAME:'Main storyline',isPlaceholder,pad,label,trees,numbersIn,numberProblems,nextNumber};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VoidMainStory=api;
})(typeof globalThis!=='undefined'?globalThis:this);
