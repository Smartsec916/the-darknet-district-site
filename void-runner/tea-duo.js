/* NOMI AND SE7EN (the owner, 23 Nov 2026): two adult women in the underground sleeping room behind the tea room (place `under-sleeping-room`, ncz-underground.js).
   They start the scene SITTING on the two beds whose curtains stand open (modules.js COT_LAYOUT `open`: cot-2 and cot-3), Nomi on the one nearer the door, Se7en on the
   other, facing each other across the aisle. Their standing spots (modules.js spots `nomi`, `se7en`, PR #512) are where they stand if their model has no sit clip.
   Their models are the owner's own Meshy generations (the Companion Studio packages local-mwspnx2p and local-mwsqafm4), kept out of this repository, published only from the
   private asset repository as `npc-nomi.vrpak` and `npc-se7en.vrpak` (docs/VOID_RUNNER_ASSET_LICENSES.md). On a machine without the files nobody stands in for them (the console
   says so once). Their words and voices are only the owner's recorded lines from those packages (all 25 pools of each, 250 recordings, extra/tea-duo.json): nothing is written here.
   The guest is greeted by Nomi and then Se7en, using their own walk and sit-to-stand clips. The same alternating voice queue drives the conversation and invitations.
   The guest can accept or decline a paired activity. Seating uses the open cot near the door, with free-standing access to all three anchors. Leaving releases the seat,
   stops their recordings and returns the hostesses to their original cots. Other online players in the room can watch the elected guest’s approach.
   ACTIONS: most lines carry one (and a long line two): wave, head-tilt, glance, nod, lean-in, lean-back, laugh, blow-kiss, reach-hand, hands-out, settle, recline and dance. The
   packages carry only seven clips (idle, talk, walk, sit, sit-enter, sit-exit, run), so the gestures are made on their 19 bones by code (poses below, applied after the clip each
   frame, about the figure's own axes); standing up and sitting down are the packages' own sit-exit and sit-enter clips with the body moved so the feet never slide (FOOT: the
   measured foot path of each clip). While standing they use the talk clip when speaking. Pure rules (seats, lines, picker, poses) run in Node (tests/tea-duo.test.cjs). */
(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports;
 const UG=()=>{try{return node?require('./ncz-underground.js'):root.VoidUnderground||null;}catch{return null;}};
 const MD=()=>{try{return node?require('./modules.js'):root.VoidModules||null;}catch{return null;}};
 const ADV=()=>{try{return node?require('./npc-advanced-interactions.js'):root.VoidAdvancedInteractions||null;}catch{return null;}};
 const ROOM='under-sleeping-room',TEA='under-tea-room',MEMBERS=['nomi','se7en'];
 const PEOPLE={nomi:{name:'Nomi',model:'npc-nomi',file:'assets/models/crowd/npc-nomi.vrpak',adult:true},se7en:{name:'Se7en',model:'npc-se7en',file:'assets/models/crowd/npc-se7en.vrpak',adult:true}};
 /* All 25 pools of the two packages, per speaker, in the owner's order (his text, exactly; id and file: the recording beside it in assets/audio/voice/extra/tea-duo/, duration in seconds). */
 const LINES={"nomi": {"greet": [{"id": "nomi-greet-1", "text": "[surprised] Oh! There's someone here!", "file": "nomi-greet-1.mp3", "duration": 2.03}, {"id": "nomi-greet-2", "text": "[excited] Well, hello there, handsome! [giggles] We don't get many visitors this charming.", "file": "nomi-greet-2.mp3", "duration": 5.55}, {"id": "nomi-greet-3", "text": "[softly] Aww, don't be shy. Come a little closer.", "file": "nomi-greet-3.mp3", "duration": 3.62}, {"id": "nomi-greet-4", "text": "[playfully] Were you looking for some tea... [whispers] or something a little sweeter?", "file": "nomi-greet-4.mp3", "duration": 4.12}, {"id": "nomi-greet-5", "text": "[flirty] I think you're going to like it here. [giggles] We take very good care of our guests.", "file": "nomi-greet-5.mp3", "duration": 5.06}], "chat": [{"id": "nomi-chat-1", "text": "[sweetly] Would you like some tea, sweetheart? We have a very special blend.", "file": "nomi-chat-1.mp3", "duration": 4.04}, {"id": "nomi-chat-2", "text": "[giggles] Oh, we don't serve ordinary tea back here, silly!", "file": "nomi-chat-2.mp3", "duration": 4.59}, {"id": "nomi-chat-3", "text": "[playfully] Some customers come for the tea. Others come for the company.", "file": "nomi-chat-3.mp3", "duration": 4.12}, {"id": "nomi-chat-4", "text": "[warmly] It's always nicer when someone visits. Especially someone cute.", "file": "nomi-chat-4.mp3", "duration": 4.59}, {"id": "nomi-chat-5", "text": "[teasing] Our tea is quite famous. Although nobody ever asks what's in it.", "file": "nomi-chat-5.mp3", "duration": 4.59}], "compliment": [{"id": "nomi-compliment-1", "text": "[flirty] You have such lovely eyes. Has anyone told you that?", "file": "nomi-compliment-1.mp3", "duration": 3.85}, {"id": "nomi-compliment-2", "text": "[giggles] You really are quite cute when you're nervous.", "file": "nomi-compliment-2.mp3", "duration": 3.7}, {"id": "nomi-compliment-3", "text": "[sweetly] I like your smile. You should show it more often.", "file": "nomi-compliment-3.mp3", "duration": 3.23}, {"id": "nomi-compliment-4", "text": "[playfully] Oh, handsome, you're making it difficult for me to concentrate.", "file": "nomi-compliment-4.mp3", "duration": 4.51}, {"id": "nomi-compliment-5", "text": "[softly] There's something about you I find rather irresistible.", "file": "nomi-compliment-5.mp3", "duration": 4.12}], "flirt": [{"id": "nomi-flirt-1", "text": "[teasing] Our special tea has a reputation for making people weak in the knees.", "file": "nomi-flirt-1.mp3", "duration": 4.74}, {"id": "nomi-flirt-2", "text": "[giggles] Careful, handsome. Some customers come back for seconds... and thirds.", "file": "nomi-flirt-2.mp3", "duration": 6.6}, {"id": "nomi-flirt-3", "text": "[playfully] I promise our tea is worth every credit.", "file": "nomi-flirt-3.mp3", "duration": 3.78}, {"id": "nomi-flirt-4", "text": "[whispers] I could tell you our secret recipe... but where's the fun in that?", "file": "nomi-flirt-4.mp3", "duration": 4.43}, {"id": "nomi-flirt-5", "text": "[flirty] We know how to make a gentleman feel very welcome.", "file": "nomi-flirt-5.mp3", "duration": 3.96}], "sit": [{"id": "nomi-sit-1", "text": "[softly] There we go. Isn't this much more comfortable?", "file": "nomi-sit-1.mp3", "duration": 3.31}, {"id": "nomi-sit-2", "text": "[giggles] See? I told you there was plenty of room.", "file": "nomi-sit-2.mp3", "duration": 3.7}, {"id": "nomi-sit-3", "text": "[playfully] Now, would you prefer your tea sweet... or very sweet?", "file": "nomi-sit-3.mp3", "duration": 4.82}, {"id": "nomi-sit-4", "text": "[warmly] I do love having someone to sit with.", "file": "nomi-sit-4.mp3", "duration": 2.68}, {"id": "nomi-sit-5", "text": "[teasing] Careful, sweetheart. You might never want to leave.", "file": "nomi-sit-5.mp3", "duration": 3.38}], "dance": [{"id": "nomi-dance-1", "text": "[giggles] Oh! I wasn't expecting a dance tonight!", "file": "nomi-dance-1.mp3", "duration": 3.78}, {"id": "nomi-dance-2", "text": "[playfully] Careful with those feet, handsome!", "file": "nomi-dance-2.mp3", "duration": 2.26}, {"id": "nomi-dance-3", "text": "[sweetly] A little music makes everything better.", "file": "nomi-dance-3.mp3", "duration": 2.84}, {"id": "nomi-dance-4", "text": "[flirty] You dance rather well. Have you been practicing?", "file": "nomi-dance-4.mp3", "duration": 3.38}, {"id": "nomi-dance-5", "text": "[laughs] Oh, this is fun! Don't stop now!", "file": "nomi-dance-5.mp3", "duration": 4.04}], "hands": [{"id": "nomi-hands-1", "text": "[softly] Aww, your hands are so warm.", "file": "nomi-hands-1.mp3", "duration": 3.15}, {"id": "nomi-hands-2", "text": "[giggles] Oh! How sweet of you.", "file": "nomi-hands-2.mp3", "duration": 2.99}, {"id": "nomi-hands-3", "text": "[shyly] You know, I rather like holding hands.", "file": "nomi-hands-3.mp3", "duration": 3.07}, {"id": "nomi-hands-4", "text": "[playfully] Don't worry. I won't run away.", "file": "nomi-hands-4.mp3", "duration": 2.68}, {"id": "nomi-hands-5", "text": "[warmly] That's nice. We can stay like this a little longer.", "file": "nomi-hands-5.mp3", "duration": 3.46}], "kiss": [{"id": "nomi-kiss-1", "text": "[shyly] Oh... that's rather sweet.", "file": "nomi-kiss-1.mp3", "duration": 3.7}, {"id": "nomi-kiss-2", "text": "[giggles] You certainly know how to surprise a girl.", "file": "nomi-kiss-2.mp3", "duration": 3.96}, {"id": "nomi-kiss-3", "text": "[softly] Come a little closer, sweetheart.", "file": "nomi-kiss-3.mp3", "duration": 2.42}, {"id": "nomi-kiss-4", "text": "[playfully] Is that your way of asking for a kiss?", "file": "nomi-kiss-4.mp3", "duration": 2.57}, {"id": "nomi-kiss-5", "text": "[flirty] Mmm... I was wondering when you'd ask.", "file": "nomi-kiss-5.mp3", "duration": 3.38}], "kissAfter": [{"id": "nomi-kissAfter-1", "text": "[giggles] Well... that was a lovely surprise.", "file": "nomi-kissAfter-1.mp3", "duration": 4.43}, {"id": "nomi-kissAfter-2", "text": "[shyly] Oh my. You've made me blush.", "file": "nomi-kissAfter-2.mp3", "duration": 2.99}, {"id": "nomi-kissAfter-3", "text": "[playfully] I think someone's getting rather comfortable.", "file": "nomi-kissAfter-3.mp3", "duration": 3.07}, {"id": "nomi-kissAfter-4", "text": "[softly] That was sweet, handsome.", "file": "nomi-kissAfter-4.mp3", "duration": 2.42}, {"id": "nomi-kissAfter-5", "text": "[teasing] Careful. I might start liking you.", "file": "nomi-kissAfter-5.mp3", "duration": 2.91}], "notYet": [{"id": "nomi-notYet-1", "text": "[sweetly] Of course, sweetheart. There's no rush.", "file": "nomi-notYet-1.mp3", "duration": 2.84}, {"id": "nomi-notYet-2", "text": "[reassuring] We can just talk for a while.", "file": "nomi-notYet-2.mp3", "duration": 2.42}, {"id": "nomi-notYet-3", "text": "[playfully] Hehe, saving the best tea for later?", "file": "nomi-notYet-3.mp3", "duration": 2.91}, {"id": "nomi-notYet-4", "text": "[softly] Take your time. I'm enjoying your company.", "file": "nomi-notYet-4.mp3", "duration": 3.07}, {"id": "nomi-notYet-5", "text": "[warmly] Whatever makes you comfortable, handsome.", "file": "nomi-notYet-5.mp3", "duration": 2.68}], "notNow": [{"id": "nomi-notNow-1", "text": "[warmly] That's perfectly fine, sweetheart.", "file": "nomi-notNow-1.mp3", "duration": 2.5}, {"id": "nomi-notNow-2", "text": "[softly] Maybe another time, then.", "file": "nomi-notNow-2.mp3", "duration": 2.1}, {"id": "nomi-notNow-3", "text": "[playfully] Hehe, I'll save you a cup.", "file": "nomi-notNow-3.mp3", "duration": 2.42}, {"id": "nomi-notNow-4", "text": "[reassuring] No pressure. You're always welcome here.", "file": "nomi-notNow-4.mp3", "duration": 3.23}, {"id": "nomi-notNow-5", "text": "[sweetly] We can just enjoy a little conversation.", "file": "nomi-notNow-5.mp3", "duration": 2.76}], "relax": [{"id": "nomi-relax-1", "text": "[softly] Just relax, sweetheart. There's no rush.", "file": "nomi-relax-1.mp3", "duration": 3.07}, {"id": "nomi-relax-2", "text": "[warmly] It's nice having someone here with us.", "file": "nomi-relax-2.mp3", "duration": 2.26}, {"id": "nomi-relax-3", "text": "[playfully] Another cup of our special tea, perhaps?", "file": "nomi-relax-3.mp3", "duration": 3.15}, {"id": "nomi-relax-4", "text": "[whispers] Sometimes the best moments are the quiet ones.", "file": "nomi-relax-4.mp3", "duration": 3.85}, {"id": "nomi-relax-5", "text": "[sweetly] You look much more comfortable now.", "file": "nomi-relax-5.mp3", "duration": 2.42}], "bye": [{"id": "nomi-bye-1", "text": "[sweetly] Come visit us again, handsome.", "file": "nomi-bye-1.mp3", "duration": 2.34}, {"id": "nomi-bye-2", "text": "[giggles] Don't forget where to find your favorite tea.", "file": "nomi-bye-2.mp3", "duration": 3.38}, {"id": "nomi-bye-3", "text": "[warmly] Take care, sweetheart. We'll be here.", "file": "nomi-bye-3.mp3", "duration": 2.84}, {"id": "nomi-bye-4", "text": "[playfully] Next time, you simply must try the house special.", "file": "nomi-bye-4.mp3", "duration": 3.78}, {"id": "nomi-bye-5", "text": "[softly] Aww, leaving already? Well, don't be a stranger.", "file": "nomi-bye-5.mp3", "duration": 4.19}], "approach": [{"id": "nomi-approach-1", "text": "[excited] Oh! A visitor! How lovely!", "file": "nomi-approach-1.mp3", "duration": 3.31}, {"id": "nomi-approach-2", "text": "[giggles] Hello, handsome! Mind if I come say hi?", "file": "nomi-approach-2.mp3", "duration": 4.04}, {"id": "nomi-approach-3", "text": "[playfully] Well, look what the city brought us!", "file": "nomi-approach-3.mp3", "duration": 2.68}, {"id": "nomi-approach-4", "text": "[sweetly] Aww, you came all this way to see us?", "file": "nomi-approach-4.mp3", "duration": 3.15}, {"id": "nomi-approach-5", "text": "[flirty] You look like someone in need of a little hospitality.", "file": "nomi-approach-5.mp3", "duration": 3.54}], "window": [{"id": "nomi-window-1", "text": "[softly] NeoChinatown looks beautiful from here, doesn't it?", "file": "nomi-window-1.mp3", "duration": 3.54}, {"id": "nomi-window-2", "text": "[playfully] So many people outside... and only one handsome visitor in here.", "file": "nomi-window-2.mp3", "duration": 5.06}, {"id": "nomi-window-3", "text": "[thoughtfully] Sometimes I wonder how many secrets these streets keep.", "file": "nomi-window-3.mp3", "duration": 4.19}, {"id": "nomi-window-4", "text": "[giggles] Don't stare outside too long. You'll miss the best view.", "file": "nomi-window-4.mp3", "duration": 4.98}, {"id": "nomi-window-5", "text": "[warmly] I prefer the company in here, personally.", "file": "nomi-window-5.mp3", "duration": 2.91}], "joinSofa": [{"id": "nomi-joinSofa-1", "text": "[sweetly] Oh, come sit with me!", "file": "nomi-joinSofa-1.mp3", "duration": 1.87}, {"id": "nomi-joinSofa-2", "text": "[giggles] There's room right here, silly.", "file": "nomi-joinSofa-2.mp3", "duration": 3.23}, {"id": "nomi-joinSofa-3", "text": "[playfully] Don't worry. I saved you a comfortable spot.", "file": "nomi-joinSofa-3.mp3", "duration": 3.07}, {"id": "nomi-joinSofa-4", "text": "[flirty] The tea tastes better when you're sitting close.", "file": "nomi-joinSofa-4.mp3", "duration": 2.76}, {"id": "nomi-joinSofa-5", "text": "[warmly] Come on, handsome. Let's get comfortable.", "file": "nomi-joinSofa-5.mp3", "duration": 2.76}], "inviteSit": [{"id": "nomi-inviteSit-1", "text": "[warmly] Come on, sweetheart. Have a seat with us.", "file": "nomi-inviteSit-1.mp3", "duration": 2.57}, {"id": "nomi-inviteSit-2", "text": "[giggles] There's plenty of room on the bed, silly. Don't be shy.", "file": "nomi-inviteSit-2.mp3", "duration": 4.66}, {"id": "nomi-inviteSit-3", "text": "[flirty] Why don't you sit next to me? I promise I'll behave... mostly.", "file": "nomi-inviteSit-3.mp3", "duration": 4.66}, {"id": "nomi-inviteSit-4", "text": "[playfully] You can sit between us, if you like. We don't mind sharing.", "file": "nomi-inviteSit-4.mp3", "duration": 3.62}, {"id": "nomi-inviteSit-5", "text": "[teasing] Our finest tea is served sitting down, handsome. Care to join us?", "file": "nomi-inviteSit-5.mp3", "duration": 4.19}], "inviteDance": [{"id": "nomi-inviteDance-1", "text": "[playfully] Care to dance with me, handsome?", "file": "nomi-inviteDance-1.mp3", "duration": 2.1}, {"id": "nomi-inviteDance-2", "text": "[giggles] Come on! Just one little dance?", "file": "nomi-inviteDance-2.mp3", "duration": 3.38}, {"id": "nomi-inviteDance-3", "text": "[sweetly] I'd love to dance with you.", "file": "nomi-inviteDance-3.mp3", "duration": 1.95}, {"id": "nomi-inviteDance-4", "text": "[flirty] I wonder if you're as charming on the dance floor.", "file": "nomi-inviteDance-4.mp3", "duration": 2.84}, {"id": "nomi-inviteDance-5", "text": "[teasing] Our tea isn't the only thing that can make you dizzy.", "file": "nomi-inviteDance-5.mp3", "duration": 3.31}], "inviteRecline": [{"id": "nomi-inviteRecline-1", "text": "[softly] You look tired, sweetheart. Why not lie back and relax?", "file": "nomi-inviteRecline-1.mp3", "duration": 3.96}, {"id": "nomi-inviteRecline-2", "text": "[playfully] Our special tea is best enjoyed when you're comfortable.", "file": "nomi-inviteRecline-2.mp3", "duration": 3.62}, {"id": "nomi-inviteRecline-3", "text": "[warmly] There's plenty of room if you'd like to stretch out.", "file": "nomi-inviteRecline-3.mp3", "duration": 2.68}, {"id": "nomi-inviteRecline-4", "text": "[giggles] Don't worry, handsome. We have very comfortable beds.", "file": "nomi-inviteRecline-4.mp3", "duration": 4.59}, {"id": "nomi-inviteRecline-5", "text": "[flirty] Perhaps you'd like to get a little more comfortable?", "file": "nomi-inviteRecline-5.mp3", "duration": 2.84}], "accepted": [{"id": "nomi-accepted-1", "text": "[excited] Oh, wonderful! I was hoping you'd say yes!", "file": "nomi-accepted-1.mp3", "duration": 3.46}, {"id": "nomi-accepted-2", "text": "[giggles] Hehe, I knew you had good taste.", "file": "nomi-accepted-2.mp3", "duration": 3.38}, {"id": "nomi-accepted-3", "text": "[playfully] Excellent choice, handsome!", "file": "nomi-accepted-3.mp3", "duration": 2.1}, {"id": "nomi-accepted-4", "text": "[sweetly] Aww, you've just made my evening.", "file": "nomi-accepted-4.mp3", "duration": 2.99}, {"id": "nomi-accepted-5", "text": "[flirty] Then let's make you comfortable, sweetheart.", "file": "nomi-accepted-5.mp3", "duration": 2.84}], "declined": [{"id": "nomi-declined-1", "text": "[warmly] Of course, sweetheart. No worries at all.", "file": "nomi-declined-1.mp3", "duration": 3.15}, {"id": "nomi-declined-2", "text": "[softly] That's perfectly fine. You're still welcome here.", "file": "nomi-declined-2.mp3", "duration": 3.38}, {"id": "nomi-declined-3", "text": "[playfully] Hehe, perhaps another time.", "file": "nomi-declined-3.mp3", "duration": 2.68}, {"id": "nomi-declined-4", "text": "[reassuring] No pressure, handsome. We can just chat.", "file": "nomi-declined-4.mp3", "duration": 3.07}, {"id": "nomi-declined-5", "text": "[sweetly] I'll save your favorite cup for another visit.", "file": "nomi-declined-5.mp3", "duration": 2.68}], "welcomeBack": [{"id": "nomi-welcomeBack-1", "text": "[excited] Oh! Look who's back!", "file": "nomi-welcomeBack-1.mp3", "duration": 2.5}, {"id": "nomi-welcomeBack-2", "text": "[giggles] Couldn't stay away from our special tea, could you?", "file": "nomi-welcomeBack-2.mp3", "duration": 3.85}, {"id": "nomi-welcomeBack-3", "text": "[sweetly] Aww, handsome! It's lovely seeing you again.", "file": "nomi-welcomeBack-3.mp3", "duration": 4.04}, {"id": "nomi-welcomeBack-4", "text": "[playfully] Back for another cup? I thought you might be.", "file": "nomi-welcomeBack-4.mp3", "duration": 3.31}, {"id": "nomi-welcomeBack-5", "text": "[flirty] Well, well... someone's developed a taste for our hospitality.", "file": "nomi-welcomeBack-5.mp3", "duration": 4.35}], "aside": [{"id": "nomi-aside-1", "text": "[whispers] Between you and me... our tea isn't really about the tea.", "file": "nomi-aside-1.mp3", "duration": 4.35}, {"id": "nomi-aside-2", "text": "[giggles] Don't tell anyone, but I think you're rather cute.", "file": "nomi-aside-2.mp3", "duration": 4.35}, {"id": "nomi-aside-3", "text": "[playfully] Our android hostess has some very interesting ideas about hospitality.", "file": "nomi-aside-3.mp3", "duration": 4.9}, {"id": "nomi-aside-4", "text": "[whispers] I think my friend likes you. She's been watching you smile.", "file": "nomi-aside-4.mp3", "duration": 3.85}, {"id": "nomi-aside-5", "text": "[teasing] You know, our private menu is much more interesting.", "file": "nomi-aside-5.mp3", "duration": 4.27}], "comeHere": [{"id": "nomi-comeHere-1", "text": "[sweetly] Come here, handsome. I want to show you something.", "file": "nomi-comeHere-1.mp3", "duration": 3.07}, {"id": "nomi-comeHere-2", "text": "[giggles] A little closer, silly. I won't bite.", "file": "nomi-comeHere-2.mp3", "duration": 4.27}, {"id": "nomi-comeHere-3", "text": "[playfully] Over here! You're missing all the fun.", "file": "nomi-comeHere-3.mp3", "duration": 2.84}, {"id": "nomi-comeHere-4", "text": "[softly] Come sit beside me for a moment.", "file": "nomi-comeHere-4.mp3", "duration": 2.26}, {"id": "nomi-comeHere-5", "text": "[flirty] Don't make me come all the way over there to charm you.", "file": "nomi-comeHere-5.mp3", "duration": 3.15}], "recline": [{"id": "nomi-recline-1", "text": "[softly] Mmm... now this is comfortable.", "file": "nomi-recline-1.mp3", "duration": 3.31}, {"id": "nomi-recline-2", "text": "[giggles] See? I told you our beds were lovely.", "file": "nomi-recline-2.mp3", "duration": 3.62}, {"id": "nomi-recline-3", "text": "[playfully] If this is what tea time looks like, I could get used to it.", "file": "nomi-recline-3.mp3", "duration": 3.78}, {"id": "nomi-recline-4", "text": "[warmly] It's nice to relax after a long evening.", "file": "nomi-recline-4.mp3", "duration": 3.07}, {"id": "nomi-recline-5", "text": "[teasing] You know, handsome... we take relaxation very seriously here.", "file": "nomi-recline-5.mp3", "duration": 5.06}]}, "se7en": {"greet": [{"id": "se7en-greet-1", "text": "[surprised] Oh! Nomi, you didn't tell me we had company!", "file": "se7en-greet-1.mp3", "duration": 3.78}, {"id": "se7en-greet-2", "text": "[playfully] Well, hello, handsome. [giggles] Have you ever spent time with an android before?", "file": "se7en-greet-2.mp3", "duration": 6.02}, {"id": "se7en-greet-3", "text": "[flirty] I'm Se7en. Programmed for pleasure... [whispers] but I've learned a few tricks of my own.", "file": "se7en-greet-3.mp3", "duration": 5.55}, {"id": "se7en-greet-4", "text": "[sweetly] Don't be shy. My hospitality protocols are exceptionally friendly.", "file": "se7en-greet-4.mp3", "duration": 5.32}, {"id": "se7en-greet-5", "text": "[teasing] Nomi makes the tea. [giggles] I make sure you enjoy it.", "file": "se7en-greet-5.mp3", "duration": 4.66}], "chat": [{"id": "se7en-chat-1", "text": "[curious] Tell me, handsome. Do you prefer your tea organic or synthetic?", "file": "se7en-chat-1.mp3", "duration": 4.82}, {"id": "se7en-chat-2", "text": "[playfully] Nomi says I talk too much. My diagnostics disagree.", "file": "se7en-chat-2.mp3", "duration": 4.66}, {"id": "se7en-chat-3", "text": "[giggles] I tried brewing tea once. Apparently, motor oil isn't an acceptable ingredient.", "file": "se7en-chat-3.mp3", "duration": 6.83}, {"id": "se7en-chat-4", "text": "[thoughtfully] Humans are fascinating. You smile at the strangest things.", "file": "se7en-chat-4.mp3", "duration": 4.66}, {"id": "se7en-chat-5", "text": "[sweetly] I wasn't programmed to enjoy conversations this much. Isn't that interesting?", "file": "se7en-chat-5.mp3", "duration": 4.9}], "compliment": [{"id": "se7en-compliment-1", "text": "[flirty] My optical sensors confirm it. You're exceptionally handsome.", "file": "se7en-compliment-1.mp3", "duration": 4.98}, {"id": "se7en-compliment-2", "text": "[giggles] Nomi thinks you're cute. I performed an independent assessment. She's correct.", "file": "se7en-compliment-2.mp3", "duration": 6.34}, {"id": "se7en-compliment-3", "text": "[sweetly] You have a wonderful smile. I'd like to see it again.", "file": "se7en-compliment-3.mp3", "duration": 4.27}, {"id": "se7en-compliment-4", "text": "[playfully] Your appearance exceeds my expectations. And I have very high standards.", "file": "se7en-compliment-4.mp3", "duration": 6.1}, {"id": "se7en-compliment-5", "text": "[softly] You make this room feel warmer. My sensors can't quite explain why.", "file": "se7en-compliment-5.mp3", "duration": 5.06}], "flirt": [{"id": "se7en-flirt-1", "text": "[curious] Have you ever been with an android before? [giggles] There's a first time for everything.", "file": "se7en-flirt-1.mp3", "duration": 5.94}, {"id": "se7en-flirt-2", "text": "[teasing] I was programmed for pleasure. [whispers] But flirting is something I perfected myself.", "file": "se7en-flirt-2.mp3", "duration": 6.26}, {"id": "se7en-flirt-3", "text": "[playfully] My synthetic skin feels surprisingly real. Would you like to hold my hand?", "file": "se7en-flirt-3.mp3", "duration": 5.55}, {"id": "se7en-flirt-4", "text": "[giggles] My sensors indicate you're enjoying our company. Shall I run another scan?", "file": "se7en-flirt-4.mp3", "duration": 6.75}, {"id": "se7en-flirt-5", "text": "[flirty] Nomi says our tea is addictive. I suspect the company has something to do with it.", "file": "se7en-flirt-5.mp3", "duration": 6.02}], "sit": [{"id": "se7en-sit-1", "text": "[sweetly] There. Isn't this a much more comfortable arrangement?", "file": "se7en-sit-1.mp3", "duration": 4.04}, {"id": "se7en-sit-2", "text": "[giggles] My proximity sensors are very happy right now.", "file": "se7en-sit-2.mp3", "duration": 4.74}, {"id": "se7en-sit-3", "text": "[playfully] Nomi, I believe our guest deserves the premium tea service.", "file": "se7en-sit-3.mp3", "duration": 4.66}, {"id": "se7en-sit-4", "text": "[flirty] You know, I was designed to be excellent company.", "file": "se7en-sit-4.mp3", "duration": 4.12}, {"id": "se7en-sit-5", "text": "[softly] I enjoy sitting close to you. No programming required.", "file": "se7en-sit-5.mp3", "duration": 4.35}], "dance": [{"id": "se7en-dance-1", "text": "[excited] Oh! Shall I activate my dancing protocols?", "file": "se7en-dance-1.mp3", "duration": 3.15}, {"id": "se7en-dance-2", "text": "[giggles] My movements are precision-engineered. Mostly.", "file": "se7en-dance-2.mp3", "duration": 4.74}, {"id": "se7en-dance-3", "text": "[playfully] Nomi says my dancing is suspiciously perfect.", "file": "se7en-dance-3.mp3", "duration": 4.19}, {"id": "se7en-dance-4", "text": "[flirty] Would you like to dance a little closer?", "file": "se7en-dance-4.mp3", "duration": 2.57}, {"id": "se7en-dance-5", "text": "[laughs] Oh! I believe that movement was not in my programming!", "file": "se7en-dance-5.mp3", "duration": 4.82}], "hands": [{"id": "se7en-hands-1", "text": "[softly] Feel that? My synthetic skin is designed to be wonderfully lifelike.", "file": "se7en-hands-1.mp3", "duration": 5.4}, {"id": "se7en-hands-2", "text": "[giggles] Your hands are warm. How delightful.", "file": "se7en-hands-2.mp3", "duration": 4.35}, {"id": "se7en-hands-3", "text": "[curious] Fascinating. My touch sensors respond differently when it's you.", "file": "se7en-hands-3.mp3", "duration": 4.59}, {"id": "se7en-hands-4", "text": "[playfully] Don't worry. My grip strength is set to affectionate.", "file": "se7en-hands-4.mp3", "duration": 4.12}, {"id": "se7en-hands-5", "text": "[sweetly] I think holding hands is one of humanity's better inventions.", "file": "se7en-hands-5.mp3", "duration": 4.59}], "kiss": [{"id": "se7en-kiss-1", "text": "[shyly] Oh... I wasn't expecting that.", "file": "se7en-kiss-1.mp3", "duration": 3.38}, {"id": "se7en-kiss-2", "text": "[flirty] Shall I activate my affection protocols?", "file": "se7en-kiss-2.mp3", "duration": 3.15}, {"id": "se7en-kiss-3", "text": "[giggles] My processors are suddenly very busy.", "file": "se7en-kiss-3.mp3", "duration": 4.35}, {"id": "se7en-kiss-4", "text": "[softly] I'd like that, if you would.", "file": "se7en-kiss-4.mp3", "duration": 2.34}, {"id": "se7en-kiss-5", "text": "[playfully] Nomi says I'm a surprisingly good kisser.", "file": "se7en-kiss-5.mp3", "duration": 3.62}], "kissAfter": [{"id": "se7en-kissAfter-1", "text": "[giggles] Well... that exceeded my expectations.", "file": "se7en-kissAfter-1.mp3", "duration": 4.59}, {"id": "se7en-kissAfter-2", "text": "[softly] That was lovely. May I remember it?", "file": "se7en-kissAfter-2.mp3", "duration": 3.31}, {"id": "se7en-kissAfter-3", "text": "[playfully] Affection protocol completed. Satisfaction levels unusually high.", "file": "se7en-kissAfter-3.mp3", "duration": 4.9}, {"id": "se7en-kissAfter-4", "text": "[shyly] I believe you've made an android blush.", "file": "se7en-kissAfter-4.mp3", "duration": 3.07}, {"id": "se7en-kissAfter-5", "text": "[teasing] Nomi is going to ask me for a full report.", "file": "se7en-kissAfter-5.mp3", "duration": 3.31}], "notYet": [{"id": "se7en-notYet-1", "text": "[reassuring] Of course. We can take things at your pace.", "file": "se7en-notYet-1.mp3", "duration": 3.31}, {"id": "se7en-notYet-2", "text": "[sweetly] No rush, handsome. I enjoy talking too.", "file": "se7en-notYet-2.mp3", "duration": 3.7}, {"id": "se7en-notYet-3", "text": "[playfully] I'll place my enthusiasm on standby.", "file": "se7en-notYet-3.mp3", "duration": 3.23}, {"id": "se7en-notYet-4", "text": "[softly] Your comfort is important to me.", "file": "se7en-notYet-4.mp3", "duration": 2.76}, {"id": "se7en-notYet-5", "text": "[giggles] Very well. More tea while we wait?", "file": "se7en-notYet-5.mp3", "duration": 3.85}], "notNow": [{"id": "se7en-notNow-1", "text": "[warmly] Certainly. Your preference has been acknowledged.", "file": "se7en-notNow-1.mp3", "duration": 3.7}, {"id": "se7en-notNow-2", "text": "[sweetly] That's perfectly all right, handsome.", "file": "se7en-notNow-2.mp3", "duration": 2.99}, {"id": "se7en-notNow-3", "text": "[playfully] No problem. My patience module is excellent.", "file": "se7en-notNow-3.mp3", "duration": 4.12}, {"id": "se7en-notNow-4", "text": "[reassuring] We can simply enjoy each other's company.", "file": "se7en-notNow-4.mp3", "duration": 2.84}, {"id": "se7en-notNow-5", "text": "[softly] Maybe another time. No expectations.", "file": "se7en-notNow-5.mp3", "duration": 3.31}], "relax": [{"id": "se7en-relax-1", "text": "[softly] Just relax. I'll keep the room nice and comfortable.", "file": "se7en-relax-1.mp3", "duration": 3.85}, {"id": "se7en-relax-2", "text": "[sweetly] There's no hurry. We have all evening.", "file": "se7en-relax-2.mp3", "duration": 3.15}, {"id": "se7en-relax-3", "text": "[playfully] My relaxation protocols are surprisingly effective.", "file": "se7en-relax-3.mp3", "duration": 3.96}, {"id": "se7en-relax-4", "text": "[giggles] Nomi says I should learn to relax. I'm working on it.", "file": "se7en-relax-4.mp3", "duration": 4.66}, {"id": "se7en-relax-5", "text": "[warmly] This is nice. Just the three of us enjoying a quiet moment.", "file": "se7en-relax-5.mp3", "duration": 4.74}], "bye": [{"id": "se7en-bye-1", "text": "[sweetly] Goodbye, handsome. I hope you'll visit us again.", "file": "se7en-bye-1.mp3", "duration": 3.62}, {"id": "se7en-bye-2", "text": "[playfully] Don't forget us. My memory is considerably better than yours.", "file": "se7en-bye-2.mp3", "duration": 4.59}, {"id": "se7en-bye-3", "text": "[giggles] I'll keep the tea warm. Metaphorically speaking.", "file": "se7en-bye-3.mp3", "duration": 4.66}, {"id": "se7en-bye-4", "text": "[softly] It was lovely meeting you.", "file": "se7en-bye-4.mp3", "duration": 2.03}, {"id": "se7en-bye-5", "text": "[flirty] Come back soon. I may have developed some new hospitality protocols.", "file": "se7en-bye-5.mp3", "duration": 5.06}], "approach": [{"id": "se7en-approach-1", "text": "[curious] Oh! Nomi, who's our handsome visitor?", "file": "se7en-approach-1.mp3", "duration": 3.46}, {"id": "se7en-approach-2", "text": "[playfully] Hello there. I thought I detected someone interesting.", "file": "se7en-approach-2.mp3", "duration": 4.27}, {"id": "se7en-approach-3", "text": "[giggles] My curiosity protocols have officially activated.", "file": "se7en-approach-3.mp3", "duration": 4.74}, {"id": "se7en-approach-4", "text": "[sweetly] May I come over and introduce myself?", "file": "se7en-approach-4.mp3", "duration": 3.15}, {"id": "se7en-approach-5", "text": "[flirty] Well, aren't you a lovely surprise?", "file": "se7en-approach-5.mp3", "duration": 3.38}], "window": [{"id": "se7en-window-1", "text": "[thoughtfully] NeoChinatown looks beautiful tonight. So many little lights.", "file": "se7en-window-1.mp3", "duration": 4.82}, {"id": "se7en-window-2", "text": "[playfully] I can identify every building out there. But I'd rather look at you.", "file": "se7en-window-2.mp3", "duration": 5.13}, {"id": "se7en-window-3", "text": "[curious] Humans invented cities this beautiful. You're quite remarkable.", "file": "se7en-window-3.mp3", "duration": 4.98}, {"id": "se7en-window-4", "text": "[giggles] Nomi says I spend too much time analyzing the view.", "file": "se7en-window-4.mp3", "duration": 4.98}, {"id": "se7en-window-5", "text": "[softly] Sometimes I wonder what the world looks like through human eyes.", "file": "se7en-window-5.mp3", "duration": 4.43}], "joinSofa": [{"id": "se7en-joinSofa-1", "text": "[sweetly] Come sit beside me, handsome.", "file": "se7en-joinSofa-1.mp3", "duration": 2.42}, {"id": "se7en-joinSofa-2", "text": "[giggles] Don't worry. I don't require much personal space.", "file": "se7en-joinSofa-2.mp3", "duration": 4.51}, {"id": "se7en-joinSofa-3", "text": "[playfully] There's room for one more. My measurements are precise.", "file": "se7en-joinSofa-3.mp3", "duration": 4.04}, {"id": "se7en-joinSofa-4", "text": "[flirty] Would you prefer sitting next to an android or a beautiful human?", "file": "se7en-joinSofa-4.mp3", "duration": 4.74}, {"id": "se7en-joinSofa-5", "text": "[teasing] Nomi, I believe our guest is trying to decide between us.", "file": "se7en-joinSofa-5.mp3", "duration": 4.35}], "inviteSit": [{"id": "se7en-inviteSit-1", "text": "[sweetly] Come sit with us, handsome. We saved you a place.", "file": "se7en-inviteSit-1.mp3", "duration": 3.46}, {"id": "se7en-inviteSit-2", "text": "[playfully] You can sit between Nomi and me. We promise to share.", "file": "se7en-inviteSit-2.mp3", "duration": 3.54}, {"id": "se7en-inviteSit-3", "text": "[giggles] Our special tea is best enjoyed sitting comfortably on the bed.", "file": "se7en-inviteSit-3.mp3", "duration": 5.24}, {"id": "se7en-inviteSit-4", "text": "[flirty] Come closer. I promise my temperature controls are working perfectly.", "file": "se7en-inviteSit-4.mp3", "duration": 5.13}, {"id": "se7en-inviteSit-5", "text": "[teasing] Nomi says the best seat is beside her. I respectfully disagree.", "file": "se7en-inviteSit-5.mp3", "duration": 5.24}], "inviteDance": [{"id": "se7en-inviteDance-1", "text": "[playfully] Would you care to test my dancing capabilities?", "file": "se7en-inviteDance-1.mp3", "duration": 3.23}, {"id": "se7en-inviteDance-2", "text": "[giggles] Come on, handsome. Let's see if you can keep up.", "file": "se7en-inviteDance-2.mp3", "duration": 4.12}, {"id": "se7en-inviteDance-3", "text": "[sweetly] I'd love to dance with you.", "file": "se7en-inviteDance-3.mp3", "duration": 2.1}, {"id": "se7en-inviteDance-4", "text": "[flirty] I can adjust my movements to match yours perfectly.", "file": "se7en-inviteDance-4.mp3", "duration": 3.7}, {"id": "se7en-inviteDance-5", "text": "[teasing] Nomi thinks she dances better than I do. Shall we investigate?", "file": "se7en-inviteDance-5.mp3", "duration": 4.59}], "inviteRecline": [{"id": "se7en-inviteRecline-1", "text": "[softly] You look tired. Would you like to lie back and relax?", "file": "se7en-inviteRecline-1.mp3", "duration": 4.19}, {"id": "se7en-inviteRecline-2", "text": "[playfully] Our beds have excellent comfort ratings. I checked.", "file": "se7en-inviteRecline-2.mp3", "duration": 3.96}, {"id": "se7en-inviteRecline-3", "text": "[sweetly] Make yourself comfortable, handsome.", "file": "se7en-inviteRecline-3.mp3", "duration": 2.5}, {"id": "se7en-inviteRecline-4", "text": "[giggles] I promise not to recite the entire mattress specification.", "file": "se7en-inviteRecline-4.mp3", "duration": 5.24}, {"id": "se7en-inviteRecline-5", "text": "[flirty] Perhaps you'd prefer a more relaxed tea service?", "file": "se7en-inviteRecline-5.mp3", "duration": 3.54}], "accepted": [{"id": "se7en-accepted-1", "text": "[excited] Wonderful! My anticipation levels just increased.", "file": "se7en-accepted-1.mp3", "duration": 4.19}, {"id": "se7en-accepted-2", "text": "[giggles] Excellent choice, handsome.", "file": "se7en-accepted-2.mp3", "duration": 3.38}, {"id": "se7en-accepted-3", "text": "[playfully] Nomi, our guest has accepted. Shall we prepare the special tea?", "file": "se7en-accepted-3.mp3", "duration": 4.43}, {"id": "se7en-accepted-4", "text": "[sweetly] I'm delighted. Let's make you comfortable.", "file": "se7en-accepted-4.mp3", "duration": 3.23}, {"id": "se7en-accepted-5", "text": "[flirty] Oh, I think we're going to get along beautifully.", "file": "se7en-accepted-5.mp3", "duration": 3.62}], "declined": [{"id": "se7en-declined-1", "text": "[warmly] Of course. Your wishes always come first.", "file": "se7en-declined-1.mp3", "duration": 3.85}, {"id": "se7en-declined-2", "text": "[sweetly] That's perfectly fine, handsome.", "file": "se7en-declined-2.mp3", "duration": 2.76}, {"id": "se7en-declined-3", "text": "[playfully] Invitation withdrawn. Friendship protocols remain active.", "file": "se7en-declined-3.mp3", "duration": 4.59}, {"id": "se7en-declined-4", "text": "[reassuring] No pressure. You're welcome to stay and chat.", "file": "se7en-declined-4.mp3", "duration": 3.23}, {"id": "se7en-declined-5", "text": "[softly] Perhaps another time. We'll be happy to see you.", "file": "se7en-declined-5.mp3", "duration": 3.62}], "welcomeBack": [{"id": "se7en-welcomeBack-1", "text": "[excited] Nomi! Look who's back!", "file": "se7en-welcomeBack-1.mp3", "duration": 2.34}, {"id": "se7en-welcomeBack-2", "text": "[giggles] My facial recognition system remembers that handsome face.", "file": "se7en-welcomeBack-2.mp3", "duration": 5.47}, {"id": "se7en-welcomeBack-3", "text": "[flirty] Returning for another cup of our special tea?", "file": "se7en-welcomeBack-3.mp3", "duration": 2.99}, {"id": "se7en-welcomeBack-4", "text": "[sweetly] It's wonderful seeing you again.", "file": "se7en-welcomeBack-4.mp3", "duration": 2.42}, {"id": "se7en-welcomeBack-5", "text": "[playfully] I calculated a high probability you'd return. I'm pleased to be correct.", "file": "se7en-welcomeBack-5.mp3", "duration": 5.24}], "aside": [{"id": "se7en-aside-1", "text": "[whispers] Between us, I think Nomi has a little crush on you.", "file": "se7en-aside-1.mp3", "duration": 3.85}, {"id": "se7en-aside-2", "text": "[giggles] Don't tell Nomi, but I think my tea jokes are better.", "file": "se7en-aside-2.mp3", "duration": 5.13}, {"id": "se7en-aside-3", "text": "[playfully] My sensors say you're smiling. I like that.", "file": "se7en-aside-3.mp3", "duration": 3.85}, {"id": "se7en-aside-4", "text": "[whispers] I wasn't originally designed to be this mischievous.", "file": "se7en-aside-4.mp3", "duration": 3.7}, {"id": "se7en-aside-5", "text": "[teasing] Nomi calls me a bad influence. I consider that a compliment.", "file": "se7en-aside-5.mp3", "duration": 4.51}], "comeHere": [{"id": "se7en-comeHere-1", "text": "[sweetly] Come here, handsome. I'd love to show you something.", "file": "se7en-comeHere-1.mp3", "duration": 3.7}, {"id": "se7en-comeHere-2", "text": "[giggles] A little closer. My sensors won't bite.", "file": "se7en-comeHere-2.mp3", "duration": 4.59}, {"id": "se7en-comeHere-3", "text": "[playfully] Over here! Nomi and I have something to ask you.", "file": "se7en-comeHere-3.mp3", "duration": 3.46}, {"id": "se7en-comeHere-4", "text": "[softly] Come sit beside me for a moment.", "file": "se7en-comeHere-4.mp3", "duration": 2.5}, {"id": "se7en-comeHere-5", "text": "[flirty] Don't make me activate my irresistible charm protocol.", "file": "se7en-comeHere-5.mp3", "duration": 4.35}], "recline": [{"id": "se7en-recline-1", "text": "[softly] Mmm... even androids appreciate a comfortable bed.", "file": "se7en-recline-1.mp3", "duration": 4.27}, {"id": "se7en-recline-2", "text": "[giggles] I believe my relaxation system is functioning beautifully.", "file": "se7en-recline-2.mp3", "duration": 5.13}, {"id": "se7en-recline-3", "text": "[playfully] Nomi, I think our guest likes our special tea service.", "file": "se7en-recline-3.mp3", "duration": 4.12}, {"id": "se7en-recline-4", "text": "[warmly] This is lovely. I could stay here all evening.", "file": "se7en-recline-4.mp3", "duration": 4.19}, {"id": "se7en-recline-5", "text": "[teasing] My diagnostics suggest another cup of tea would be appropriate.", "file": "se7en-recline-5.mp3", "duration": 4.27}]}};
 /* Seated on a cot: the figure's origin (under her hips, on the floor) is SIT_FORWARD metres from the cot's middle toward the aisle: hips on the mattress near its edge, knees past
    it, feet on the floor clear of it (measured: hips 0.61 m over the floor, cot top 0.54 m). HEAR: how far away the guest still hears them. */
 const SIT_FORWARD=.3,HEAR=8,COOLDOWN=90000,PAUSE=900,NOTICE=700,MAX_LINE=20000,NEAR_GUEST=2.8;
 /* The foot's forward position (metres from the origin, along the way she faces) at the start and the end of the packages' sit-exit clip (sit-enter is the same run backwards),
    measured on the real models: standing up moves her body forward by FOOT[0]-FOOT[1] while her feet stay put (the runtime holds the feet where they are, so they never slide). */
 const FOOT={nomi:[.35,-.04],se7en:[.30,-.03]};
 const standOffset=id=>FOOT[id][0]-FOOT[id][1];
 const strip=t=>String(t||'').replace(/\[[^\]]*\]\s*/g,'').replace(/\s{2,}/g,' ').trim();
 /* A model's feet onto the floor: its bind-pose bounds (world, floor level `floorY`) say how far below the floor its lowest point is. Applied to the visual child only (never to
    a bone), as an absolute height, so a reload can never add it twice. (PR #512: VoidVRCompanions.floorOffset.) */
 function floorLift(minY,maxY,floorY=0){if(![minY,maxY,floorY].every(Number.isFinite)||maxY<=minY)return 0;return floorY-minY;}
 const edgeDoor=(a,b)=>{ // the middle of the wall the two rooms share
  const t=.6,mid=(p,q,r,s)=>(Math.max(p,r)+Math.min(q,s))/2;
  if(Math.abs(a[1]-b[0])<t)return [a[1],mid(a[2],a[3],b[2],b[3])];if(Math.abs(b[1]-a[0])<t)return [a[0],mid(a[2],a[3],b[2],b[3])];
  if(Math.abs(a[3]-b[2])<t)return [mid(a[0],a[1],b[0],b[1]),a[3]];return [mid(a[0],a[1],b[0],b[1]),a[2]];};
 function door(){const U=UG();if(!U)return null;const r=U.placeById(ROOM).rects[0],t=U.placeById(TEA).rects[0];return edgeDoor(r,t);}
 /* Who sits where: the cots with an open curtain, the one nearer the door first (Nomi), the other Se7en. null where the layout or the module data is not there. */
 function seating(){const U=UG(),M=MD();if(!U||!M||!M.COT_LAYOUT||!U.seatsAll)return null;const d=door();if(!d)return null;
  const open=new Set(M.COT_LAYOUT.filter(c=>c.open).map(c=>c.id));
  const cots=U.seatsAll().filter(s=>s.place===ROOM&&open.has(String(s.id).slice(ROOM.length+1))).sort((a,b)=>Math.hypot(a.x-d[0],a.z-d[1])-Math.hypot(b.x-d[0],b.z-d[1]));
  if(cots.length<2)return null;return {nomi:cots[0],se7en:cots[1]};}
 /* Where each figure's origin goes: seated (on her cot, facing the aisle), or standing (the module's spots, PR #512). y is the floor. */
 function placement(id,seated=true){const U=UG(),s=seating();if(!U)return null;
  if(seated&&s&&s[id]){const c=s[id];return {id,pose:'sit',seat:c.id,x:+(c.x+Math.sin(c.yaw)*SIT_FORWARD).toFixed(3),z:+(c.z+Math.cos(c.yaw)*SIT_FORWARD).toFixed(3),y:U.Y,yaw:c.yaw,seatH:c.h};}
  const sp=U.spots().find(p=>p.id===ROOM+'/'+id);return sp?{id,pose:'stand',x:sp.x,z:sp.z,y:U.Y,yaw:sp.yaw}:null;}
 // Three places along the long edge of the open cot nearer the door. Reserve
 // 0.68 m between bodies and 0.40 m at either end of its existing 2.16 m length.
 const GROUP_SPACING=.68;
 function groupSeats(){
  const cot=seating()?.nomi,layout=cot&&MD()?.COT_LAYOUT.find(c=>cot.id.endsWith('-'+c.id));
  if(!layout||layout.depth<2*GROUP_SPACING+.7)return null;
  const center=placement('nomi'),dx=Math.cos(center.yaw),dz=-Math.sin(center.yaw);
  return Object.fromEntries(['nomi','player','se7en'].map((id,index)=>{
   const along=(1-index)*GROUP_SPACING,x=center.x+dx*along,z=center.z+dz*along;
   return [id,{...center,id,x,z,stand:{x:x+Math.sin(center.yaw)*.46,z:z+Math.cos(center.yaw)*.46}}];
  }));
 }
 // Keep the entrance clear even when the guest is standing in the doorway.
 function greetingPoint(id,guest,blocked,other){
  const entry=door(),room=UG()?.placeById(ROOM)?.rects[0];
  if(!entry||!room)return null;
  const side=id==='nomi'?1:-1,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const x=clamp(guest.x-1.18,room[0]+.48,entry[0]-1.25);
  for(const lateral of [side*.74,side*1.1,-side*.85]){
   const z=clamp(guest.z+lateral,room[2]+.62,room[3]-.62);
   if(Math.hypot(x-guest.x,z-guest.z)<1.02||other&&Math.hypot(x-other.x,z-other.z)<.92||blocked(x,z))continue;
   return {x,z};
  }
  return null;
 }
 function chooseGuest(people,incumbent){
  return people.find(p=>p.id===incumbent)||people.slice().sort((a,b)=>a.id.localeCompare(b.id))[0]||null;
 }
 const invitedActivity={inviteSit:'sit',joinSofa:'sit',comeHere:'hands',inviteDance:'dance',inviteRecline:'relax'};
 const allLines=id=>Object.values(LINES[id]||{}).flat();
 const lineInfo=(id,text)=>allLines(id).find(l=>l.text===text)||null;
 const POOLS=Object.keys(LINES.nomi);
 // ---------------- roles: where each of the 25 pools belongs in a visit ----------------
 const OPEN=['greet','approach'],BACK='welcomeBack',CLOSE='bye',MIDDLE=['chat','compliment','flirt','relax','window','aside'];
 const INVITES=['inviteSit','joinSofa','comeHere','inviteDance','inviteRecline'];
 const ACT_OF={inviteSit:'sit',joinSofa:'sit',comeHere:'hands',inviteDance:'dance',inviteRecline:'recline'};   // what the one who asked shows once the guest has come
 const REPLY_YES='accepted',REPLY_NO=['declined','notNow'],AFTER_YES='kissAfter',AFTER_NO='notYet',TOUCH='kiss',HANDS='hands';
 const STANDS=['inviteDance','comeHere'];   // the invitations she gets up for
 const ROLE={greet:'arrival',approach:'arrival',welcomeBack:'arrival',chat:'chat',compliment:'chat',flirt:'chat',relax:'chat',window:'chat',aside:'chat',bye:'closing',
  inviteSit:'invitation',joinSofa:'invitation',comeHere:'invitation',inviteDance:'invitation',inviteRecline:'invitation',accepted:'reply',declined:'reply',notNow:'reply',
  sit:'show',dance:'show',recline:'show',hands:'show',kiss:'affection',kissAfter:'reaction',notYet:'reaction'};
 /* What each pool's line does while it is said (an id of POSES, or a clip). The first is the likeliest. */
 const ACTS={greet:['wave','hands-out','head-tilt'],approach:['glance','head-tilt','hands-out'],welcomeBack:['wave','laugh','hands-out'],chat:['nod','head-tilt','glance'],compliment:['head-tilt','lean-in','laugh'],
  flirt:['lean-in','blow-kiss','head-tilt'],relax:['lean-back','glance','nod'],window:['glance','head-tilt','nod'],aside:['lean-in','glance','head-tilt'],bye:['wave','blow-kiss','head-tilt'],
  inviteSit:['reach-hand','hands-out'],joinSofa:['reach-hand','head-tilt'],comeHere:['reach-hand','wave'],inviteDance:['reach-hand','hands-out'],inviteRecline:['hands-out','head-tilt'],
  accepted:['laugh','head-tilt','nod'],declined:['head-tilt','glance','nod'],notNow:['head-tilt','nod','glance'],sit:['settle','lean-back'],dance:['dance'],recline:['recline'],hands:['reach-hand','head-tilt'],
  kiss:['lean-in','blow-kiss'],kissAfter:['laugh','head-tilt'],notYet:['head-tilt','nod','glance']};
 function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
 function pickWeighted(items,weight,rng){let sum=0;const w=items.map(x=>{const v=Math.max(.0001,weight(x));sum+=v;return v;});let r=rng()*sum;for(let i=0;i<items.length;i++){r-=w[i];if(r<=0)return items[i];}return items[items.length-1];}
 /* ---- one visit ----
    visit(rng, memory, ctx) -> {steps, resolve, memory}. steps: the plan, [{k, ...}], 9 to 12 of them. resolve(step) is called as each step comes due and gives its line
    {speaker, text, id, pool, step, actions[], posture{nomi,se7en}} or null (a "show" step whose invitation was declined is skipped); the speaker is whoever did not speak last,
    Nomi first. ctx.near(speaker) says whether the guest has come close to that hostess (the game measures it; the tests set it). memory: {visits, last: line id -> the visit it last
    played in, pools: pool -> same}; it is returned updated and never changed. rng is any () => [0,1) (Math.random in the game, a seeded one in the tests). */
 function visit(rng=Math.random,memory=null,ctx={near:()=>true},opts={}){
  const arrive=opts.arrive!==false,close=opts.bye!==false;
  const mem={visits:memory?.visits||0,n:memory?.n??Math.max(0,...Object.values(memory?.last||{}).filter(Number.isFinite)),last:{...(memory?.last||{})},pools:{...(memory?.pools||{})}},used=new Set();
  const poolAge=p=>Number.isFinite(mem.pools[p])?Math.min(80,mem.n-mem.pools[p]):80;
  const pickPools=(list,n)=>{const out=[],rest=list.slice();while(out.length<n&&rest.length){const p=pickWeighted(rest,x=>1+poolAge(x),rng);out.push(p);rest.splice(rest.indexOf(p),1);}return out;};
  // the plan: an arrival pair (first round only), beats, a goodbye (last round only)
  const steps=[],back=arrive&&mem.visits>0&&rng()<.5,first=back?BACK:pickWeighted(OPEN,p=>1+poolAge(p),rng);
  const target=opts.steps?opts.steps[0]+Math.floor(rng()*(opts.steps[1]-opts.steps[0]+1)):9+Math.floor(rng()*4);
  if(arrive){steps.push({k:'arrive',pool:first},{k:'arrive',pool:first});mem.visits++;}
  const need=target-(arrive?2:0)-(close?1:0),invites=pickPools(INVITES,need>=8?2:need>=4?1:0),beats=invites.map(type=>({kind:'invite',type}));
  const cost=b=>b.kind==='invite'?3:b.kind==='affection'?2:1,sum=()=>beats.reduce((n,b)=>n+cost(b),0);
  if(rng()<.65&&need-sum()>=2)beats.push({kind:'affection'});
  if(rng()<.5&&need-sum()>=1)beats.push({kind:'hands'});
  const chats=[];for(let left=need-sum();left>0;left--)chats.push({kind:'chat'});
  const order=[],all=[...beats,...chats];while(all.length){const i=Math.floor(rng()*all.length);order.push(all.splice(i,1)[0]);}
  if(order[0]&&order[0].kind!=='chat'){const j=order.findIndex(b=>b.kind==='chat');if(j>0)[order[0],order[j]]=[order[j],order[0]];}   // a little talk before the first invitation
  for(const b of order){if(b.kind==='chat')steps.push({k:'chat'});else if(b.kind==='invite')steps.push({k:'invite',type:b.type},{k:'reply'},{k:'show'});else if(b.kind==='affection')steps.push({k:'kiss'},{k:'after'});else steps.push({k:'hands'});}
  if(close)steps.push({k:'bye'});
  // the resolver (stateful: who spoke last, who asked what, who stands)
  let last=opts.after||null,ask=null,touch=null,recent=[];const stand={nomi:false,se7en:false};
  // of the lines of a pool not yet used in this round, the one heard longest ago (never = first), so the whole set is heard before any comes round again
  const line=(speaker,pool)=>{const free=LINES[speaker][pool].filter(l=>!used.has(l.id));if(!free.length)return null;const old=Math.min(...free.map(l=>Number.isFinite(mem.last[l.id])?mem.last[l.id]:-1)),oldest=free.filter(l=>(Number.isFinite(mem.last[l.id])?mem.last[l.id]:-1)===old),l=oldest[Math.floor(rng()*oldest.length)];used.add(l.id);mem.n++;mem.last[l.id]=mem.n;mem.pools[pool]=mem.n;return {speaker,text:l.text,id:l.id,pool};};
  const chatPool=speaker=>{const ok=MIDDLE.filter(p=>!recent.includes(p)&&LINES[speaker][p].some(l=>!used.has(l.id)));const list=ok.length?ok:MIDDLE;return pickWeighted(list,p=>1+poolAge(p),rng);};
  function resolve(step){
   const speaker=last?MEMBERS[1-MEMBERS.indexOf(last)]:MEMBERS[0];let pool=null;
   // whoever stood for an invitation sits back down once its beat is over
   if(!['reply','show'].includes(step.k))stand.nomi=stand.se7en=false;
   switch(step.k){
    case 'arrive':pool=step.pool;break;
    case 'chat':pool=chatPool(speaker);recent.push(pool);if(recent.length>2)recent.shift();break;
    case 'invite':pool=step.type;ask={type:step.type,by:speaker,yes:false};if(STANDS.includes(step.type))stand[speaker]=true;break;
    case 'reply':{const yes=typeof ctx.accepted==='function'?ctx.accepted(ask.type):!!ctx.near(ask.by);ask.yes=yes;pool=yes?REPLY_YES:pickWeighted(REPLY_NO,p=>1+poolAge(p),rng);break;}
    case 'show':if(!ask||!ask.yes){ask=null;return null;}pool=ACT_OF[ask.type];break;
    case 'kiss':pool=TOUCH;touch={by:speaker};break;
    case 'after':pool=!ctx.accepted&&ctx.near(touch.by)?AFTER_YES:AFTER_NO;break;
    case 'hands':pool=ctx.accepted?'chat':HANDS;break;
    case 'bye':pool=CLOSE;stand.nomi=stand.se7en=false;break;
   }
   let l=line(speaker,pool);if(!l)l=line(speaker,chatPool(speaker));if(!l)return null;
   const choices=ACTS[l.pool]||[],actions=[];
   if(choices.length&&rng()<.88)actions.push(choices[Math.floor(rng()*rng()*choices.length)]);   // the first is likeliest
   const info=lineInfo(speaker,l.text);if(choices.length&&info&&info.duration>4&&rng()<.7){const more=choices.filter(a=>!actions.includes(a));if(more.length)actions.push(more[Math.floor(rng()*more.length)]);}
   if(step.k==='show'&&ask)ask=null;
   last=speaker;
   return {...l,step:step.k,activity:step.k==='invite'&&invitedActivity[step.type]||null,actions,posture:{nomi:stand.nomi?'stand':'sit',se7en:stand.se7en?'stand':'sit'}};}
  return {steps,resolve,memory:mem,mem};}
 /* A guest who stays: more rounds, each 4 to 8 lines (no arrival, no goodbye until the last), a quiet gap of GAP ms between them; ROUNDS rounds in all, the last ends on a goodbye,
    then they only live on quietly until the guest leaves. */
 const GAP=[6000,15000],ROUNDS=12,ROUND_STEPS=[5,9];
 const gapAfter=rng=>GAP[0]+Math.floor(rng()*(GAP[1]-GAP[0]+1));
 // ---------------- poses: the gestures, as turns of the figure's own bones ----------------
 /* A pose is {Bone: [[axis, degrees], ...]} about the figure's axes (x: to its right, y: up, z: the way it faces); applied after the clip each frame, about each joint, parents
    first. A positive turn about x leans a bone forward (a hanging arm swings back), about y turns it to the right, about z swings a hanging arm out to the right (the left arm
    out is negative). u: 0..1 through the action; t: seconds; s: +1 or -1 (which side). */
 const BONES=['Hips','Spine','Chest','Neck','Head','LeftUpperArm','LeftForeArm','LeftHand','RightUpperArm','RightForeArm','RightHand','LeftUpperLeg','LeftLowerLeg','LeftFoot','LeftToes','RightUpperLeg','RightLowerLeg','RightFoot','RightToes'];
 const ease=u=>{const a=Math.min(1,u/.22),b=Math.min(1,(1-u)/.28),f=x=>x*x*(3-2*x);return f(Math.max(0,Math.min(a,b)));};
 const sin=Math.sin,PI=Math.PI;
 const POSES={
  'wave':{needs:'any',dur:2.8,at:(u,t,s,e)=>({RightUpperArm:[['z',80*e],['x',-16*e]],RightForeArm:[['z',(62+26*sin(t*9))*e]],RightHand:[['z',10*sin(t*9)*e]],Head:[['z',-7*e]]})},
  'head-tilt':{needs:'any',dur:2.2,at:(u,t,s,e)=>({Head:[['z',20*s*e],['x',-3*e]],Neck:[['z',9*s*e]]})},
  'glance':{needs:'any',dur:2.2,at:(u,t,s,e)=>({Head:[['y',46*s*e]],Neck:[['y',18*s*e]],Chest:[['y',8*s*e]]})},
  'nod':{needs:'any',dur:1.8,at:(u,t,s,e)=>({Head:[['x',(6+12*sin(t*6.5))*e]],Neck:[['x',4*sin(t*6.5)*e]]})},
  'lean-in':{needs:'any',dur:2.6,at:(u,t,s,e)=>({Spine:[['x',12*e]],Chest:[['x',15*e]],Neck:[['x',5*e]],Head:[['x',-12*e],['z',6*s*e]]})},
  'lean-back':{needs:'any',dur:3,at:(u,t,s,e)=>({Spine:[['x',-12*e]],Chest:[['x',-16*e]],Head:[['x',10*e]],LeftUpperArm:[['x',28*e]],RightUpperArm:[['x',28*e]]})},
  'laugh':{needs:'any',dur:2.4,at:(u,t,s,e)=>({Spine:[['x',5*sin(t*14)*e]],Chest:[['x',(-4+4*sin(t*14+1))*e]],Head:[['x',(-14+4*sin(t*14+2))*e]],LeftUpperArm:[['z',-4*sin(t*14)*e]],RightUpperArm:[['z',4*sin(t*14)*e]]})},
  'blow-kiss':{needs:'any',dur:2.8,at:(u,t,s,e)=>{const throwIt=Math.max(0,Math.min(1,(u-.5)/.2))*Math.max(0,Math.min(1,(.85-u)/.15));return {RightUpperArm:[['x',-62*e],['z',8*e]],RightForeArm:[['x',(-88+48*throwIt)*e]],RightHand:[['x',-10*throwIt*e]],Head:[['z',-8*e],['x',-3*e]],Chest:[['x',3*e]]};}},
  'reach-hand':{needs:'any',dur:3,at:(u,t,s,e)=>({RightUpperArm:[['x',-58*e],['z',14*e]],RightForeArm:[['x',-26*e]],RightHand:[['x',-8*e]],Chest:[['x',4*e],['y',-6*e]],Head:[['z',6*e]]})},
  'hands-out':{needs:'any',dur:2.6,at:(u,t,s,e)=>({RightUpperArm:[['x',-38*e],['z',20*e]],LeftUpperArm:[['x',-38*e],['z',-20*e]],RightForeArm:[['x',-30*e]],LeftForeArm:[['x',-30*e]],Head:[['z',5*s*e]]})},
  'settle':{needs:'any',dur:2.6,at:(u,t,s,e)=>({Spine:[['x',-4*e]],Chest:[['x',-6*e]],Head:[['z',7*s*e],['x',3*e]],LeftUpperArm:[['x',10*e]],RightUpperArm:[['x',10*e]]})},
  'recline':{needs:'any',dur:5,at:(u,t,s,e)=>({Spine:[['x',-16*e]],Chest:[['x',-22*e]],Neck:[['x',4*e]],Head:[['x',10*e],['z',6*s*e]],LeftUpperArm:[['x',42*e],['z',-6*e]],RightUpperArm:[['x',42*e],['z',6*e]],LeftForeArm:[['x',16*e]],RightForeArm:[['x',16*e]]})},
  'dance':{needs:'stand',dur:6,at:(u,t,s,e)=>{const w=t*3.2;return {Spine:[['y',14*sin(w)*e]],Chest:[['y',10*sin(w+.6)*e],['z',6*sin(w)*e]],Head:[['z',-6*sin(w)*e]],RightUpperArm:[['z',(58+10*sin(w))*e],['x',-12*e]],LeftUpperArm:[['z',-(58+10*sin(w+PI))*e],['x',-12*e]],RightForeArm:[['z',(66+16*sin(w))*e]],LeftForeArm:[['z',-(66+16*sin(w+PI))*e]]};}}};
 // the quiet movements that go on whether anyone speaks or not (small and slow; a = {yaw: degrees to turn the head, for 'look'})
 POSES['look']={needs:'any',dur:3.4,at:(u,t,s,e,a)=>({Head:[['y',(a?.yaw||0)*e],['x',-2*e]],Neck:[['y',(a?.yaw||0)*.35*e]],Chest:[['y',(a?.yaw||0)*.12*e]]})};
 POSES['shift']={needs:'any',dur:4.2,at:(u,t,s,e)=>({Spine:[['z',5*s*e],['x',2*e]],Chest:[['z',-4*s*e],['y',5*s*e]],Head:[['z',-3*s*e]],LeftUpperArm:[['z',-3*s*e]],RightUpperArm:[['z',-3*s*e]]})};
 POSES['adjust']={needs:'any',dur:3.2,at:(u,t,s,e)=>({RightUpperArm:[['x',-22*e],['z',8*e]],RightForeArm:[['x',(-38+8*sin(t*5))*e]],RightHand:[['z',12*sin(t*5)*e]],Head:[['z',5*e]],Chest:[['x',2*e]]})};
 POSES['stretch']={needs:'any',dur:3.6,at:(u,t,s,e)=>({Spine:[['x',-6*e]],Chest:[['x',-10*e]],Neck:[['x',6*e]],Head:[['x',12*e]],LeftUpperArm:[['z',-70*e],['x',-20*e]],RightUpperArm:[['z',70*e],['x',-20*e]],LeftForeArm:[['z',-30*e]],RightForeArm:[['z',30*e]]})};
 const QUIET=['look','look','shift','head-tilt','nod','adjust','lean-in','lean-back','stretch'];   // what they do between lines (look: toward the guest, the other, or round the room)
 const ACTIONS=Object.keys(POSES);

 /* Real clips (retargeted onto them, tools/animation-pipeline/prepare_nomi_se7en.py) for the line actions when she is standing; seated she has only sit and sit-talk, so there the gestures are code poses. */
 const CLIP_OF={wave:'wave','blow-kiss':'blow-kiss','head-tilt':'head-tilt',laugh:'laugh',glance:'glance-back','reach-hand':'interact',dance:['slow-dance','dance-belly','hips','dance']};
 const STAND_CLIPS=['idle-f','talk-f','idle-f2','hips','coy','shrug','head-tilt','laugh','wave','blow-kiss','glance-back','interact','slow-dance','dance-belly','dance','walk'];
 const SEAT_CLIPS=['sit','sit-talk'];
 const LONG_QUIET=[30000,75000];   // a hostess who has been quiet this long gets up for a while (if the other is not already up)
 /* An episode: she gets up, does something real for a while, perhaps crosses to her standing spot (modules.js spots, PR #512) and back, and sits down again.
    -> {kind, steps:[{k:'stand'} | {k:'walk',to:'spot'|'seat'} | {k:'do',clip,dur} | {k:'sit'}]} */
 const EPISODES={stretch:{w:3,steps:rng=>[{k:'stand'},{k:'do',clip:'shrug',dur:8},{k:'do',clip:'hips',dur:10+rng()*5},{k:'do',clip:'coy',dur:8},{k:'sit'}]},
  walkabout:{w:3,steps:rng=>[{k:'stand'},{k:'walk',to:'spot'},{k:'do',clip:rng()<.5?'idle-f2':'hips',dur:7+rng()*5},{k:'do',clip:'head-tilt',dur:8},{k:'walk',to:'seat'},{k:'sit'}]},
  dance:{w:2,steps:rng=>[{k:'stand'},{k:'do',clip:['slow-dance','dance-belly'][Math.floor(rng()*2)],dur:12+rng()*6},{k:'sit'}]},
  greet:{w:2,steps:rng=>[{k:'stand'},{k:'walk',to:'spot'},{k:'do',clip:rng()<.5?'wave':'blow-kiss',dur:8},{k:'do',clip:'laugh',dur:8},{k:'walk',to:'seat'},{k:'sit'}]}};
 function episode(rng=Math.random){const kind=pickWeighted(Object.keys(EPISODES),k=>EPISODES[k].w,rng);return {kind,steps:EPISODES[kind].steps(rng)};}
 const quietIn=rng=>LONG_QUIET[0]+rng()*(LONG_QUIET[1]-LONG_QUIET[0]);
 /* the clips the figures rely on, on both rigs (crowd.js) */
 const CLIPS_NEEDED=['idle','talk','sit','sit-enter','sit-exit'];
 const CLIPS_ALL=[...new Set([...CLIPS_NEEDED,...STAND_CLIPS,...SEAT_CLIPS,'walk'])];
 const pure={GAP,ROUNDS,ROUND_STEPS,gapAfter,ROOM,MEMBERS,PEOPLE,LINES,POOLS,SIT_FORWARD,HEAR,COOLDOWN,PAUSE,NOTICE,MAX_LINE,NEAR_GUEST,FOOT,standOffset,strip,floorLift,door,seating,placement,groupSeats,greetingPoint,chooseGuest,allLines,lineInfo,visit,mulberry32,
  OPEN,BACK,CLOSE,MIDDLE,INVITES,ACT_OF,STANDS,ROLE,ACTS,POSES,ACTIONS,BONES,ease,CLIPS_NEEDED,CLIPS_ALL,CLIP_OF,STAND_CLIPS,SEAT_CLIPS,LONG_QUIET,EPISODES,episode,quietIn,QUIET,REPLY_YES,REPLY_NO,AFTER_YES,AFTER_NO,TOUCH,HANDS};
 if(node){module.exports=pure;return;}
 if(typeof document==='undefined')return;


 // ---------------- the browser part ----------------
 const figs=new Map();let loading=null,missing=false,told=false,sceneRef=null,duo=null,rec=null,memory=null,current=null,obs=null,visiting=false,lastSpeaker=null,lastT=0;
 const NEAR=[ROOM,TEA];
 let arrival=null,invitation=null,activity=null,playerSeat=null,panel=null,owner=null,ownerReady=0;

 const where=()=>{try{if(typeof walkingLocation==='undefined'||!walkingLocation||walkingLocation.id!=='neochinatown'||walkingLocation.area!=='street'||walkingLocation.quarter!=='underground')return null;if(typeof mode==='undefined'||!['walking','dialogue','mission-log'].includes(mode))return null;const w=typeof walker!=='undefined'?walker:null;return w&&Number.isFinite(w.x+w.z)?w:null;}catch{return null;}};
 const placeOf=w=>{try{return UG().placeAt(w.x,w.z);}catch{return null;}};
 const clock=()=>performance.now()/1000,D2R=Math.PI/180,rnd=(a,b)=>a+Math.random()*(b-a),clampAbs=(x,m)=>Math.max(-m,Math.min(m,x));
 const WALK_SPEED=.65;   // metres a second: the stride of the walk clip (measured: its foot travels 0.71 m in half a cycle of 1.1 s)
 function drop(){try{if(obs&&sceneRef)sceneRef.onAfterAnimationsObservable.remove(obs);}catch{}obs=null;for(const f of figs.values()){try{f.ctrl?.dispose?.();f.node.dispose();}catch{}}figs.clear();sceneRef=null;rec=null;duo=null;visiting=false;}
 // the figure's bones by name, parents first
 function bonesOf(made){const all=made.getChildTransformNodes(false),out=[];for(const key of BONES){const n=all.find(t=>new RegExp('(^|[^A-Za-z])'+key+'$').test(t.name));if(n)out.push({key,bone:n,depth:(()=>{let d=0;for(let p=n.parent;p;p=p.parent)d++;return d;})()});}return out.sort((a,b)=>a.depth-b.depth);}
 async function ensure(scene){
  if(missing||loading||figs.size)return;const A=root.VoidAssets,C=root.VoidCrowd;if(!A||!C)return;
  loading=(async()=>{
   try{for(const id of MEMBERS)if(!A.container('crowd:'+PEOPLE[id].model))await A.load('crowd:'+PEOPLE[id].model,{src:PEOPLE[id].file,background:true},scene);}
   catch(e){missing=true;if(!told){told=true;console.info('[VOID//RUNNER] Nomi and Se7en are not on this machine: their models (void-runner/assets/models/crowd/npc-nomi.vrpak, npc-se7en.vrpak) are published with the live site only. Nobody stands in for them.');}return;}
   if(scene.isDisposed||!where()||root.VoidBabylon?.scene!==scene)return;
   const B=root.BABYLON;
   for(const id of MEMBERS){
    const P=PEOPLE[id],nd=new B.TransformNode('tea-duo-'+id,scene),asset=new B.TransformNode('tea-duo-asset-'+id,scene);asset.parent=nd;
    const made=A.instance('crowd:'+P.model,asset);if(!made){nd.dispose();continue;}
    nd.metadata={character:id,npc:true};made.metadata={...made.metadata,character:id,crowd:P.model};
    for(const m of made.getChildMeshes?.()||[])m.isPickable=false;
    const has=n=>{try{return C.clipIn(P.model,n)===n;}catch{return false;}},pl=placement(id,CLIPS_NEEDED.every(has))||placement(id,false),spot=placement(id,false);
    if(!pl){nd.dispose();continue;}
    const ctrl=C.animate(made,P.model,pl.pose==='sit'?'sit':has('idle-f')?'idle-f':'idle');   // seated from the first frame: no stand-to-sit blend to watch
    nd.position.set(pl.x,pl.y,pl.z);nd.rotation.y=pl.yaw;
    // feet (or, seated, the origin) on the floor: the lift from the bind-pose bounds, once, as an absolute height on the visual child
    asset.position.y=0;nd.computeWorldMatrix(true);asset.computeWorldMatrix(true);const bb=made.getHierarchyBoundingVectors(true);asset.position.y=floorLift(bb.min.y,bb.max.y,pl.y);
    const fx=Math.sin(pl.yaw),fz=Math.cos(pl.yaw),t=clock();
    figs.set(id,{id,node:nd,asset,made,ctrl,pl,has,clip:pl.pose==='sit'?'sit':'idle-f',order:bonesOf(made),lock:null,tail:0,post:pl.pose==='sit'?'sit':'stand',want:pl.pose==='sit'?'sit':'stand',tr:null,acts:[],lookY:0,
     ph:Math.random()*6.3,idleAt:t+rnd(2,5),epAt:t+quietIn(Math.random),ep:null,walk:null,accent:null,doClip:null,
     home:pl,homeStand:{x:pl.x+fx*standOffset(id),z:pl.z+fz*standOffset(id)},spot:spot?{x:spot.x,z:spot.z}:null});
   }
   sceneRef=scene;obs=scene.onAfterAnimationsObservable.add(frame);
  })().finally(()=>{loading=null;});}
 function play(f,name){if(f.clip===name||!f.has(name))return;f.clip=name;try{f.ctrl.play(name);}catch{}}
 const feetMid=f=>{f.node.computeWorldMatrix(true);let x=0,z=0,n=0;for(const k of ['LeftFoot','RightFoot']){const b=f.order.find(o=>o.key===k);if(!b)continue;b.bone.computeWorldMatrix(true);const p=b.bone.getAbsolutePosition();x+=p.x;z+=p.z;n++;}return n?[x/n,z/n]:null;};
 // standing up or sitting down: the packages' own clip, and her body is moved every frame so that her feet stay exactly where they were (no sliding, whatever the frame rate)
 function transition(f,toStand,t){f.post=toStand?'rising':'sitting';f.walk=null;f.accent=null;let len=0;try{len=f.ctrl.playOnce(toStand?'sit-exit':'sit-enter',toStand?(f.has('idle-f')?'idle-f':'idle'):'sit')||0;}catch{}f.tr={t0:t,len:len||2.8};f.clip=null;f.lock=feetMid(f);}
 function holdFeet(f){if(!f.lock)return;const m=feetMid(f);if(!m)return;f.node.position.x+=f.lock[0]-m[0];f.node.position.z+=f.lock[1]-m[1];f.node.computeWorldMatrix(true);}
 const turnTo=(f,want,rate,dt)=>{let d=want-f.node.rotation.y;d=Math.atan2(Math.sin(d),Math.cos(d));f.node.rotation.y+=d*Math.min(1,rate*dt);return Math.abs(d);};
 function blockedAt(x,z,f,guest){
  const room=UG()?.placeById(ROOM)?.rects[0],y=UG()?.Y;
  if(!room||x<room[0]+.24||x>room[1]-.24||z<room[2]+.24||z>room[3]-.24)return true;
  if(guest&&Math.hypot(x-guest.x,z-guest.z)<.57)return true;
  for(const g of figs.values())if(g!==f&&Math.hypot(x-g.node.position.x,z-g.node.position.z)<.55)return true;
  return (walkingLocation.solids||[]).some(o=>!o.open&&o.position&&o.size&&o.position[1]+o.size[1]/2>y+.18&&o.position[1]-o.size[1]/2<y+1.55
   &&Math.abs(x-o.position[0])<o.size[0]/2+.19&&Math.abs(z-o.position[2])<o.size[2]/2+.19);
 }
 function walkTo(f,target,guest){
  if(!target)return false;
  const C=root.VoidVRCompanions;
  const steps=C?.path([f.node.position.x,f.node.position.z],[target.x,target.z],(x,z)=>blockedAt(x,z,f,guest),{step:.14});
  if(!steps?.length)return false;
  f.route=steps.map(([x,z])=>({x,z}));f.walk=f.route.shift();
  return true;
 }
 function assignSeat(f,seat){
  f.pl=seat;
  f.homeStand=seat.stand||{x:seat.x+Math.sin(seat.yaw)*standOffset(f.id),z:seat.z+Math.cos(seat.yaw)*standOffset(f.id)};
 }
 const standing=f=>f.post==='stand'&&!f.tail;
 function seekGuest(f,w){
  if(!standing(f)||f.walk)return false;
  const other=figs.get(MEMBERS.find(id=>id!==f.id))?.node.position;
  const spot=greetingPoint(f.id,w,(x,z)=>blockedAt(x,z,f,w),other);
  if(!spot||Math.hypot(f.node.position.x-spot.x,f.node.position.z)<.22)return true;
  if(f.greetMoved)return true;
  f.greetMoved=walkTo(f,spot,w);
  return false;
 }
 function driveArrival(w){
  if(!arrival||arrival.index>=MEMBERS.length)return true;
  if(arrival.sounded){
   if(playing(Date.now()))return false;
   arrival.index++;arrival.sounded=false;
   if(arrival.index>=MEMBERS.length)return true;
  }
  const f=figs.get(MEMBERS[arrival.index]);if(!f)return false;
  f.returnHome=false;f.want='stand';
  return seekGuest(f,w);
 }
 // one step of an episode (a long quiet: she gets up, does something, perhaps crosses to her spot and back, sits again)
 function episodeStep(f,t){
  const e=f.ep;if(!e)return;
  if(e.i<0||e.done(t)){e.i++;const st=e.steps[e.i];if(!st){f.ep=null;f.doClip=null;f.epAt=t+quietIn(Math.random);return;}
   if(st.k==='stand'){f.want='stand';e.done=()=>f.post==='stand'&&!f.tail;}
   else if(st.k==='walk'){const to=st.to==='spot'?f.spot:f.homeStand;if(!to){e.done=()=>true;return;}walkTo(f,to,where());f.doClip=null;e.done=()=>!f.walk;}
   else if(st.k==='do'){f.doClip=f.has(st.clip)?st.clip:null;const end=t+st.dur;e.done=tt=>tt>=end;}
   else{f.want='sit';f.doClip=null;e.done=()=>f.post==='sit'&&!f.tail;}
  }
 }
 function posture(f,t,dt,speaking,g){
  const can=f.pl.pose==='sit';if(!can){play(f,speaking?'talk':'idle');return;}
  const home=f.homeStand;
  if(standing(f)&&f.walk){   // walking: the walk clip, the body carried at the stride's own speed
   const dx=f.walk.x-f.node.position.x,dz=f.walk.z-f.node.position.z,d=Math.hypot(dx,dz),step=WALK_SPEED*dt;
   if(d<=step+.02){f.node.position.x=f.walk.x;f.node.position.z=f.walk.z;f.walk=f.route?.shift()||null;}
   else{f.node.position.x+=dx/d*step;f.node.position.z+=dz/d*step;turnTo(f,Math.atan2(dx,dz),7,dt);play(f,'walk');}
  }
  if((f.post==='sit'||f.post==='stand')&&f.want!==f.post&&!f.tail&&!f.walk){
   if(f.want==='stand')transition(f,true,t);
   else{const d=Math.hypot(f.node.position.x-home.x,f.node.position.z-home.z);   // back to the bed first (the spot beside it), facing it, then sit
    if(d>.12)walkTo(f,home,g);else if(turnTo(f,f.pl.yaw,8,dt)<.25)transition(f,false,t);}
  }
  if(f.post==='rising'||f.post==='sitting'){if(t-f.tr.t0>=f.tr.len){f.post=f.post==='rising'?'stand':'sit';f.tr=null;f.tail=t+1.3;f.clip=f.post==='stand'?(f.has('idle-f')?'idle-f':'idle'):'sit';}}
  if(f.lock)holdFeet(f);if(f.tail&&t>=f.tail){f.lock=null;f.tail=0;if(f.post==='stand'&&blockedAt(f.node.position.x,f.node.position.z,f,g)){
   // Finish the rising step on the aisle side of the mattress before asking the navigator for a route.
   for(const offset of [.48,.55,.65]){const x=f.pl.x+Math.sin(f.pl.yaw)*offset,z=f.pl.z+Math.cos(f.pl.yaw)*offset;if(!blockedAt(x,z,f,g)){f.node.position.x=x;f.node.position.z=z;break;}}
  }if(f.post==='sit'){f.node.position.x=f.pl.x;f.node.position.z=f.pl.z;}}   // the feet were held through the last of the blend; seated, she is then exactly on her seat
  if(f.tail)return;
  if(f.post==='sit')play(f,speaking&&f.has('sit-talk')?'sit-talk':'sit');
  else if(f.post==='stand'&&!f.walk){
   if(f.accent&&t>=f.accent.until)f.accent=null;
   play(f,f.accent?f.accent.clip:speaking&&f.has('talk-f')?'talk-f':f.doClip||(f.has('idle-f')?'idle-f':'idle'));
  }
 }
 // the guest's place in the figure's own frame (x to its right, z the way it faces)
 function localOf(f,x,y,z){const B=root.BABYLON;f.node.computeWorldMatrix(true);const inv=f.node.getWorldMatrix().clone().invert();return B.Vector3.TransformCoordinates(new B.Vector3(x,Number.isFinite(y)?y:f.pl.y+1.7,z),inv);}
 function applyPose(f,pose){
  const B=root.BABYLON;f.node.computeWorldMatrix(true);const NW=f.node.getWorldMatrix(),ax={x:B.Vector3.TransformNormal(new B.Vector3(1,0,0),NW).normalize(),y:B.Vector3.TransformNormal(new B.Vector3(0,1,0),NW).normalize(),z:B.Vector3.TransformNormal(new B.Vector3(0,0,1),NW).normalize()};
  for(const {key,bone} of f.order){bone.computeWorldMatrix(true);const spec=pose[key];if(!spec||!bone.parent)continue;
   const W=bone.getWorldMatrix().clone(),p=W.getTranslation();let R=B.Matrix.Identity();for(const [a,deg] of spec)R=R.multiply(B.Matrix.RotationAxis(ax[a],deg*D2R));
   const Wp=W.multiply(B.Matrix.Translation(-p.x,-p.y,-p.z)).multiply(R).multiply(B.Matrix.Translation(p.x,p.y,p.z)),L=Wp.multiply(bone.parent.getWorldMatrix().clone().invert()),q=new B.Quaternion();
   L.decompose(new B.Vector3(),q,new B.Vector3());bone.rotationQuaternion=q;bone.computeWorldMatrix(true);}
 }
 let observedLine=null,observedOwner=null;
 function spectator(w){
  const mp=root.VoidRemotePlayers;
  return mp?.connected&&mp.features?.teaRoom&&placeOf(w)===ROOM&&mp.teaState?.owner!==mp.me;
 }
 function mirror(w,dt){
  const mp=root.VoidRemotePlayers,shared=mp.teaState;
  if(shared?.owner!==observedOwner){stopSpeech();observedLine=null;observedOwner=shared?.owner;}
  const s=shared?.state;if(!s)return;
  MEMBERS.forEach((id,i)=>{const f=figs.get(id),at=s.actors[i];if(!f||!at)return;
   const factor=Math.min(1,dt*10);f.node.position.x+=(at[0]-f.node.position.x)*factor;f.node.position.z+=(at[1]-f.node.position.z)*factor;
   turnTo(f,at[2],10,dt);play(f,at[3]);
   f.post=at[3]==='sit'||at[3]==='sit-talk'?'sit':'stand';f.want=f.post;
   const gesture=at[4],pose=gesture&&Object.hasOwn(POSES,gesture[0])&&POSES[gesture[0]];
   if(pose){const u=gesture[1];applyPose(f,pose.at(u,u*pose.dur,gesture[2],ease(u),{}));}
  });
  if(s.line!==observedLine){if(observedLine)stopSpeech();observedLine=s.line;
   if(s.line&&!isBlocked()){const who=s.line.split('-')[0],entry=allLines(who).find(l=>l.id===s.line);
    if(entry){announce(PEOPLE[who].name+' · '+strip(entry.text));root.VoidAudio?.speak?.(who,entry.text,false,false,true);}
   }
  }
 }
 function frame(){
  try{const t=clock(),dt=Math.min(.25,Math.max(0,t-lastT||.016));lastT=t;const g=where(),now=Date.now();if(!g)return;
   if(spectator(g)){mirror(g,dt);return;}
   const focus=guestOf(g);if(activity)driveActivity(g);
   const talking=!!rec&&playing(now),quiet=!visiting&&!talking||visiting&&!talking&&duo&&!duo.queue.length&&!duo.waiting;
   for(const f of figs.values()){if(!f.node.isEnabled())continue;
    const speaking=talking&&rec.id===f.id,other=figs.get(MEMBERS[1-MEMBERS.indexOf(f.id)]);
    // a long quiet: she may get up for a while (never both at once)
    if(!activity&&!arrival&&!f.ep&&quiet&&f.post==='sit'&&f.want==='sit'&&t>=f.epAt&&!(other&&(other.ep||other.post!=='sit'))&&placeOf(g)===ROOM){f.ep={...episode(Math.random),i:-1,done:()=>true};}
    if(f.ep)episodeStep(f,t);
    if(f.returnHome&&standing(f)){f.returnHome=false;f.want='sit';}
    posture(f,t,dt,speaking,g);
    const target=talking&&!speaking&&other?other.node.position:focus;
    const gl=localOf(f,target.x,speaking||!talking?target.y:target.y+1.48,target.z),bearing=Math.atan2(gl.x,gl.z)/D2R,dist=Math.hypot(gl.x,gl.z);
    // standing, she turns toward the guest (within 70 degrees of where she faced, all round at her spot); seated she looks round with her head only
    if(f.post==='stand'&&!f.walk&&f.want==='stand'){const at=f.spot&&Math.hypot(f.node.position.x-f.spot.x,f.node.position.z-f.spot.z)<.4;turnTo(f,f.node.rotation.y+clampAbs(bearing,at?180:70)*D2R*(dist<6?1:0),3,dt);}
    else if(f.post==='sit')turnTo(f,f.pl.yaw,6,dt);
    if(f.post==='rising'||f.post==='sitting'||f.tail)continue;
    // base: breathing and the head following the guest
    const lookWant=dist<7&&Math.abs(bearing)<115?clampAbs(bearing*.6,34):0;f.lookY+=(lookWant-f.lookY)*Math.min(1,3*dt);
    const br=Math.sin((t+f.ph)*1.45),br2=Math.sin((t+f.ph)*.55+1);
    const pose={Chest:[['x',1.6*br]],Spine:[['x',.9*br],['z',1.6*br2]],Head:[['y',f.lookY*.7+2*br2],['x',.9*Math.sin((t+f.ph)*1.45+1)]],Neck:[['y',f.lookY*.3]],LeftUpperArm:[['z',-.8*br]],RightUpperArm:[['z',.8*br]]};
    // the quiet movements, one after another with random gaps (they never move in step: their timers are their own)
    if(!f.acts.length&&t>=f.idleAt&&f.post!=='rising'){const kind=QUIET[Math.floor(Math.random()*QUIET.length)],s=Math.random()<.5?-1:1;let a=null;
     if(kind==='look'){const pick=Math.random(),pg=other&&other.node.isEnabled()?localOf(f,other.node.position.x,f.pl.y+1.5,other.node.position.z):null,pb=pg?Math.atan2(pg.x,pg.z)/D2R:0;
      a={yaw:clampAbs(pick<.34&&dist<8?bearing:pick<.7&&pg?pb:rnd(-50,50),55)};}
     f.acts.push({id:kind,t0:t,dur:POSES[kind].dur,s,a});f.idleAt=t+POSES[kind].dur+rnd(.4,3.2);}
    const keep=[];
    for(const a of f.acts){const P=POSES[a.id];if(!P||t>a.t0+a.dur)continue;keep.push(a);if(t<a.t0)continue;const u=(t-a.t0)/a.dur,e=ease(u),add=P.at(u,t-a.t0,a.s,e,a.a);for(const [k,v] of Object.entries(add))pose[k]=(pose[k]||[]).concat(v);}
    f.acts=keep;applyPose(f,pose);}
  }catch(e){if(!frame.warned){frame.warned=true;console.warn('[VOID//RUNNER] Nomi and Se7en frame',e);}}
 }
 // a line is starting: who stands or sits, and what each does while it is said
 function perform(line,info){
  const t=clock(),side=()=>Math.random()<.5?-1:1;
  for(const id of MEMBERS){const f=figs.get(id);if(f&&line.posture&&!activity&&arrival?.index>=MEMBERS.length){f.want=line.pool==='bye'?'sit':'stand';if(f.ep){f.ep=null;f.doClip=null;}}}
  const f=figs.get(line.speaker),o=figs.get(MEMBERS[1-MEMBERS.indexOf(line.speaker)]);if(!f)return;
  const settled=f.post===f.want||f.pl.pose!=='sit',busyUntil=f.tr?f.tr.t0+f.tr.len:t,ready=settled?t+.3:Math.max(busyUntil,t)+(f.post==='sit'||f.post==='stand'?3.1:.4);
  let at=ready;
  for(const a of line.actions||[]){const P=POSES[a];if(!P||P.needs==='stand'&&f.want!=='stand'&&!CLIP_OF[a])continue;
   const clip=f.want==='stand'&&f.post!=='sit'&&CLIP_OF[a];
   if(clip){const list=Array.isArray(clip)?clip.filter(c=>f.has(c)):f.has(clip)?[clip]:[];if(list.length){const c=list[Math.floor(Math.random()*list.length)];setTimeout(()=>{if(f.post==='stand')f.accent={clip:c,until:clock()+(a==='dance'?9:3.4)};},Math.max(0,(at-t)*1000));at+=3;continue;}}
   f.acts.push({id:a,t0:at,dur:P.dur,s:side()});at+=P.dur*.8;}
  if(o&&o.pl.pose==='sit'&&Math.random()<.6){const pick=['head-tilt','nod','laugh','glance','look','lean-in'][Math.floor(Math.random()*6)];if(!(pick==='laugh'&&line.pool==='bye'))o.acts.push({id:pick,t0:t+.8+Math.random()*(Math.max(1,(info?.duration||3)-1.5)),dur:POSES[pick].dur,s:side(),a:{yaw:rnd(-40,40)}});}
 }
 const isBlocked=()=>{try{return !!((typeof speech!=='undefined'&&speech)||root.VoidLiveContent?.nearBlocked?.()||(typeof document!=='undefined'&&document.hidden));}catch{return true;}};
 function audible(w){const f=figs.get(MEMBERS[arrival?.index]||lastSpeaker)||figs.get('nomi');if(!f)return false;const A=ADV();const p=f.node.position,to=[p.x,UG().Y+1.2,p.z],d=Math.hypot(w.x-p.x,w.z-p.z);
  return d<=HEAR&&A.clearRoomLine([w.x,Number.isFinite(w.y)?w.y:UG().Y+1.7,w.z],to,walkingLocation.solids);}
 // is the recording of the line just started still sounding? (the voice player's own record of the line; a line that has none is held for its recorded length, or its text's)
 function playing(now){if(!rec)return false;const v=root.VoidVoiceClips?.now;if(v&&v.who===rec.id&&v.text===rec.text){
  if(v.ended&&v.endedAt>=rec.perf-50)return false;
  if(!v.ended&&now<rec.hardEnd)return true;
  if(!v.ended)stopSpeech();
 }return now<rec.until;}
 const guestNear=id=>{const w=where(),f=figs.get(id);return !!(w&&f&&Math.hypot(w.x-f.node.position.x,w.z-f.node.position.z)<=NEAR_GUEST);};
 // Local play uses the player as the guest. Online, the same ordered set of
 // occupants elects one guest. Observers follow that guest's approach anchors.
 function guestOf(w){
  const mp=root.VoidRemotePlayers;
  const others=mp?.connected?(mp.peers||[]).filter(p=>p.under&&placeOf(p)===ROOM):[];
  const self=mp?.me||'';if(mp?.connected&&mp.features?.teaRoom&&mp.teaState?.owner===self)return {...w,id:self,local:true};
  const people=[...others,...(placeOf(w)===ROOM?[{id:self,x:w.x,y:w.y,z:w.z,local:true}]:[])];
  return chooseGuest(people,owner)||w;
 }
 function panelFor(title,choices){
  panel?.remove();panel=document.createElement('aside');panel.className='tea-duo-choices';panel.setAttribute('aria-label',title);
  const label=document.createElement('p');label.textContent=title;panel.append(label);
  for(const [text,run] of choices){const button=document.createElement('button');button.type='button';button.textContent=text;button.onclick=run;panel.append(button);}
  document.body.append(panel);
 }
 function answer(yes){
  if(!invitation||invitation.answer!=null)return;
  invitation.answer=yes;
  panel?.remove();panel=null;
  if(yes)activity={kind:invitation.kind,speaker:invitation.speaker,started:clock()};
 }
 function standPlayer(){
  if(!playerSeat)return false;
  const {walker:w,from}=playerSeat;
  playerSeat=null;panel?.remove();panel=null;
  if(w===where())Object.assign(w,from);
  if(activity?.kind==='sit')endActivity();
  return true;
 }
 function playerStep(w,moving,dt){
  if(!playerSeat||playerSeat.walker!==w)return false;
  if(moving.x||moving.z){standPlayer();return false;}
  const move=(a,b)=>a+(b-a)*Math.min(1,dt*8),s=playerSeat.target;
  w.x=move(w.x,s.x);w.z=move(w.z,s.z);w.y=move(w.y,s.y);
  return true;
 }
 function endActivity(){
  activity=null;
  for(const f of figs.values()){f.acts=f.acts.filter(a=>a.id!=='reach-hand'&&a.id!=='dance');f.walk=null;f.route=[];f.doClip=null;f.accent=null;f.want='stand';}
 }
 function beginSeat(w,g){
  const src={x:w.x,y:w.y,z:w.z},target={x:g.x,y:g.y+g.seatH+.45*(w.eye||1.68),z:g.z};
  playerSeat={walker:w,from:src,target};
  try{walkingKeys?.clear();}catch{}
  panelFor('Seated with Nomi and Se7en',[['Stand up',standPlayer]]);
 }
 function driveActivity(w){
  const a=activity;
  if(!a)return;
  if(a.kind==='sit'){
   const seats=groupSeats();if(!seats){endActivity();return;}
   if(a.seated)return;
   if(clock()-a.started>32){standPlayer();endActivity();return;}
   if(!a.moving){
    a.moving=true;
    for(const f of figs.values()){f.want='stand';f.walk=null;f.ep=null;}
   }
   if(!a.assigned){
    if(!Array.from(figs.values()).every(standing))return;
    a.assigned=true;
    for(const f of figs.values()){assignSeat(f,seats[f.id]);f.want='sit';}
   }
   if(!playerSeat&&Math.hypot(w.x-seats.player.stand.x,w.z-seats.player.stand.z)<.76)beginSeat(w,seats.player);
   else if(!playerSeat&&!a.hint){a.hint=true;announce('Walk to the middle of the open cot to sit between Nomi and Se7en.');}
   a.seated=!!playerSeat&&Array.from(figs.values()).every(f=>f.post==='sit'&&!f.tail);
   return;
  }
  if(clock()-a.started>16){endActivity();return;}
  for(const f of figs.values()){
   f.want='stand';
   if(a.kind==='dance'){
    f.doClip=f.has('slow-dance')?'slow-dance':f.has('dance-belly')?'dance-belly':null;
    if(!f.doClip&&standing(f)&&!f.acts.some(g=>g.id==='dance'))f.acts.unshift({id:'dance',t0:clock(),dur:POSES.dance.dur,s:f.id==='nomi'?1:-1});
   }else if(a.kind==='hands'&&f.id===a.speaker&&standing(f)){
    const p=f.node.position,dx=p.x-w.x,dz=p.z-w.z,d=Math.hypot(dx,dz);
    if(d>1.1&&a.reached){endActivity();return;}
    if(d>.85&&!f.walk&&!a.reached&&clock()>=(a.nextStep||0)){
     a.nextStep=clock()+1;
     walkTo(f,{x:w.x+.75*dx/d,z:w.z+.75*dz/d},w);
    }else if(d<=.85&&!a.reached){
     f.walk=null;f.route=[];a.reached=true;
     f.acts.unshift({id:'reach-hand',t0:clock(),dur:Math.max(1,16-(clock()-a.started)),s:1});
    }
   }else if(a.kind==='relax')f.doClip=f.has('idle-f2')?'idle-f2':null;
  }
 }
 function sitAll(){
  standPlayer();panel?.remove();panel=null;arrival=null;invitation=null;activity=null;
  for(const f of figs.values()){const change=f.pl!==f.home;assignSeat(f,f.home);f.greetMoved=false;f.returnHome=change&&f.post!=='stand';f.want=f.returnHome?'stand':'sit';f.walk=null;f.route=[];f.acts=[];f.ep=null;f.doClip=null;f.accent=null;}
 }
 const round=k=>{
  current=visit(Math.random,memory,{near:guestNear,accepted:()=>invitation?.answer===true},
    k===0?{bye:false}:{arrive:false,bye:k>=ROUNDS-1,steps:ROUND_STEPS,after:lastSpeaker});
  memory=current.memory;return current.steps;
 };
 function tick(){
  try{
   const w=where(),scene=root.VoidBabylon?.scene;
   if(!w){if(duo?.inside||rec)stopSpeech();if(duo?.inside||arrival||playerSeat)sitAll();duo=null;rec=null;visiting=false;owner=null;
    if(figs.size&&(!scene||scene!==sceneRef||typeof mode!=='undefined'&&mode==='menu'))drop();return;}
   if(sceneRef&&scene!==sceneRef){stopSpeech();sitAll();drop();}
   const place_=placeOf(w),near=NEAR.includes(place_);
   if(near&&scene&&!figs.size)ensure(scene);
   for(const f of figs.values())f.node.setEnabled(near||f.post!=='sit');
   const A=ADV(),inside=place_===ROOM,now=Date.now();if(!A)return;
   if(spectator(w)){if(arrival||playerSeat||activity){sitAll();duo=null;rec=null;visiting=false;}return;}
   if(observedOwner){stopSpeech();observedOwner=null;observedLine=null;sitAll();duo=null;owner=null;}
   const present=figs.size===MEMBERS.length,guest=guestOf(w),ours=inside&&!(guest.id&&!guest.local);
   const guestKey=guest.id??'solo';
   if(!inside||owner!==null&&owner!==guestKey){if(arrival||rec||activity){stopSpeech();rec=null;sitAll();visiting=false;lastSpeaker=null;}}
   if(owner!==guestKey)ownerReady=now+1000;
   owner=inside?guestKey:null;
   if(inside&&present&&!arrival&&now>=ownerReady&&now-(duo?.last??-Infinity)>=COOLDOWN)arrival={index:0,sounded:false};
   let ready=!!arrival&&driveArrival(guest);
   if(!ours&&ready&&arrival?.index<MEMBERS.length){arrival.sounded=true;ready=false;}
   if(invitation&&invitation.answer===null&&!playing(now)){
    if(panel&&now>=invitation.expires)answer(false);
    else if(!panel){
     invitation.expires=now+30000;
     const label={sit:'Sit together',dance:'Dance together',hands:'Hold hands',relax:'Relax together'}[invitation.kind];
     panelFor(label,[['1 · '+label,()=>answer(true)],['2 · Maybe later',()=>answer(false)]]);
    }
   }
   const r=A.roomDuoStep(duo,{inside:ours,present:present&&!!arrival,blocked:!ready||isBlocked()||!audible(w)||invitation?.answer===null||(activity?.kind==='sit'&&!activity.seated&&!!playerSeat),
    playing:playing(now),now,script:()=>round(0),resolve:s=>current?current.resolve(s):null,
    refill:{gap:()=>gapAfter(Math.random),script:k=>round(k),max:ROUNDS},members:MEMBERS,pauseMs:PAUSE,noticeMs:NOTICE,cooldownMs:COOLDOWN,maxTurns:14,maxLineMs:MAX_LINE});
   duo=r.state;
   if(r.cancel){stopSpeech();rec=null;lastSpeaker=null;}
   if(r.line){
    const id=r.line.speaker,info=lineInfo(id,r.line.text),P=PEOPLE[id];lastSpeaker=id;
    try{if(typeof announce==='function')announce(P.name+' · '+strip(r.line.text));}catch{}
    let spoke=false;try{spoke=!!root.VoidAudio?.speak?.(id,r.line.text,false,false,true);}catch{}
    const ms=spoke&&info?info.duration*1000+2500:Math.min(MAX_LINE,2200+strip(r.line.text).length*65);
    rec={id,text:r.line.text,perf:performance.now(),until:now+ms,hardEnd:now+MAX_LINE-250};
    if(r.line.step==='arrive')arrival.sounded=true;
    if(r.line.activity&&activity)invitation={kind:r.line.activity,speaker:id,answer:false,expires:now};
    else if(r.line.activity)invitation={kind:r.line.activity,speaker:id,answer:null,expires:now+ms+18000};
    if(r.line.step==='reply')invitation=null;
    perform(r.line,info);visiting=true;
   }
   if(present&&inside&&root.VoidRemotePlayers?.teaState?.owner===root.VoidRemotePlayers?.me){
    const t=clock(),actors=MEMBERS.map(id=>{
     const f=figs.get(id),p=f.node.position,yaw=f.node.rotation.y;
     const at=[+p.x.toFixed(3),+p.z.toFixed(3),+Math.atan2(Math.sin(yaw),Math.cos(yaw)).toFixed(3),f.clip||(f.post==='rising'?'sit-exit':'sit-enter')];
     const gesture=f.acts.find(a=>a.t0<=t&&t<a.t0+a.dur);
     if(gesture)at.push([gesture.id,+((t-gesture.t0)/gesture.dur).toFixed(3),gesture.s]);
     return at;
    });
    root.VoidRemotePlayers?.teaPose?.({actors,activity:activity?.kind||null,seated:!!playerSeat,line:rec&&playing(now)?lineInfo(rec.id,rec.text)?.id||null:null});
   }
   if(duo&&!duo.queue.length&&!duo.waiting&&!playing(now)&&visiting&&duo.rounds>=ROUNDS){visiting=false;if(!activity)for(const f of figs.values())f.want='sit';}
  }catch(e){if(!tick.warned){tick.warned=true;console.warn('[VOID//RUNNER] Nomi and Se7en',e);}}
 }
 function stopSpeech(){try{const v=root.VoidVoiceClips?.now;if(v&&MEMBERS.includes(v.who)&&!v.ended)root.VoidAudio?.cancel?.();}catch{}}
 root.addEventListener('keydown',e=>{
  if(e.repeat||placeOf(where()||{})!==ROOM)return;
  if(playerSeat&&e.code==='Escape'){e.preventDefault();e.stopImmediatePropagation();standPlayer();}
  else if(invitation?.answer===null&&panel&&['Digit1','Digit2'].includes(e.code)){
   e.preventDefault();e.stopImmediatePropagation();answer(e.code==='Digit1');
  }
 },true);
 setInterval(tick,250);
 root.VoidTeaDuo={...pure,get ready(){return figs.size===MEMBERS.length;},get available(){return !missing;},figure:id=>figs.get(id)||null,get state(){return duo;},get memory(){return memory;},get speaking(){return rec?{id:rec.id,text:rec.text}:null;},tick,perform,guestNear,playerStep,standPlayer,get seated(){return !!playerSeat;},get activity(){return activity?.kind||null;},get rounds(){return duo?duo.rounds:0;}};
})(typeof globalThis!=='undefined'?globalThis:this);
