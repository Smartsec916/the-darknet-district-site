/* VR companions for Play in a Bedroom: the registry the terminal's picker reads, each companion's behaviour
   settings, the small "brain" that gives them initiative, head-tracking maths and furniture-aware paths.
   Pure parts run in Node (tests/vr-companions.test.cjs); the bone work runs in the browser (vr-suite.js).
   Adding a companion: build a MakeHuman look with the companion clips (tools/animation-pipeline), or convert a
   licensed model with build_imported_character.py, list it in crowd.js, then register() an entry here with its
   model, preview, dialogue and personality. Nothing else changes.
   DRAFT: every line of companion dialogue is Claude's placeholder for David's review. Every companion's lines are recorded (tools/audio, provisional voices): women's voices for the women, a man's
   voice for the men (David, 2026-11-01). */
(function(root){
 const DEG=Math.PI/180;
 // ---- Behaviour settings (sensible defaults; a companion's personality overrides any of them) ----
 const defaults={
  initiative:.55,        // how readily they start a conversation (0 shy … 1 forward)
  flirtatiousness:.55,   // share of their remarks and gestures that are flirtatious
  approachFrequency:.5,  // how readily they come over to you
  attention:.85,         // how much of the time they look at you (the rest are natural glances away)
  personalSpace:1.05,    // metres they keep from you when they come over
  invitationCooldown:75, // seconds between invitations (dance, sit, lie back)
  declineCooldown:180,   // seconds before asking again what you turned down
  approachCooldown:28,   // seconds between coming over unprompted
  remarkCooldown:22,     // seconds between unprompted remarks
  idleActivity:[12,24],  // seconds between their own idle activities (window, wander, a gesture)
  chatAfter:7,           // seconds of you standing near without interacting before they speak
  welcomeAfter:40,       // seconds apart before they greet you again
  walkSpeed:1.15,        // metres per second
  headTracking:.9,       // strength of the head turn toward you (0 … 1)
  maxHeadYaw:70*DEG,     // most the head/neck/chest turn sideways from the body
  maxHeadPitch:25*DEG,   // most they look up or down
  bodyTurnAt:58*DEG,     // standing: the whole body turns when you are further round than this
  bodyTurnUntil:10*DEG,  // … and stops turning once you are this close to straight ahead
  glanceEvery:[5,11],    // seconds between brief natural glances away
  glanceFor:[.8,1.8]};
 const settings=(entry)=>({...defaults,...(entry?.personality||{})});

 // ---- The registry ----
 const companions=new Map();
 // Clips the bedroom needs a companion's model to carry; a model without them can't be selected.
 const requiredClips=['idle','talk','walk','sit','sit-enter','sit-exit'];
 function register(entry){
  const e={enabled:true,rig:'mixamo-52',voice:null,clips:{},behavior:{},...entry};
  if(!e.id||!e.name||!['female','male'].includes(e.sex)||!e.model)throw new Error('companion needs id, name, sex (female|male) and model');
  companions.set(e.id,e);return e;}
 const get=id=>companions.get(id)||null;
 // The voice a line spoken under a companion's name uses: recorded clips by characterId (tools/audio, Kokoro), else
 // a browser voice of the companion's sex.
 const voiceOf=name=>{const e=[...companions.values()].find(x=>x.name===name);return e?{characterId:e.voice?.characterId||'vr-'+e.id,sex:e.sex}:null;};
 // The model's file in assets/models/crowd: <model>.glb, or a scrambled .vrpak where its licence asks for one.
 const file=entry=>entry?.file||entry?.model+'.glb';
 // Which companions can be chosen now. `has(model)` reports the clips a model carries (crowd.js); `installed`
 // marks models whose file is known to be present (false = missing). Unusable ones carry the reason.
 function list({sex,has,installed}={}){
  return [...companions.values()].filter(e=>!sex||e.sex===sex).map(e=>{const clips=has?has(e.model):null,missing=clips&&requiredClips.filter(c=>!clips.includes(c));
   const reason=!e.enabled?'Not available yet.':installed&&installed[e.model]===false?'Model file is missing.':missing?.length?'Model lacks '+missing.join(', ')+'.':'';
   return {...e,usable:!reason,reason};});}
 // Old saves and links used choice f/m. A retired companion names its successor (replacedBy), so anything that
 // still asks for them gets the successor instead.
 const legacy={f:'seren',m:'kai'};
 const current=e=>{for(let i=0;e?.replacedBy&&i<4;i++)e=get(e.replacedBy)||e;return e||null;};
 const resolve=opts=>current(get(Array.isArray(opts?.companions)?opts.companions[0]:opts?.companion)||get(legacy[opts?.choice]));
 // Who comes along: one companion, or up to `partySize` together (all pairable and of one sex: David, 2026-10-31,
 // "Ava and Dex shouldn't be together"). Unknown ids drop out.
 const partySize=2;
 // Rooms for two offered at the terminal, beside each one's own room (David, 2026-10-31).
 const pairs=[{id:'ava+eva',name:'Ava & Eva',companions:['ava','eva']}];
 function party(opts){
  const ids=Array.isArray(opts?.companions)?opts.companions:[];
  const many=[...new Set(ids.map(id=>current(get(id))).filter(Boolean))].slice(0,partySize);
  if(many.length>1&&many.every(e=>e.pairable&&e.sex===many[0].sex))return many;
  const one=many[0]||resolve(opts);return one?[one]:[];}
 // Offered at the terminal: listed:false never; listed:'dev' only on a local development server (models whose
 // licence isn't confirmed for release yet). licensed:true marks purchased models kept out of the public repository:
 // the live site gets them, encrypted, from the private asset repository (tools/assets/build-pages.cjs).
 const localHost=h=>/^(localhost|127\.0\.0\.1|\[::1\])$/.test(h||'');
 const offered=(e,host=globalThis.location?.hostname)=>e.listed!==false&&!e.replacedBy&&(e.listed!=='dev'||localHost(host));
 // A companion's own clip for a role (its personality picks its gestures), falling back through common names.
 function clipFor(entry,role,has){const want=[...(entry.clips[role]||[]),role,...(fallbackClips[role]||[])];for(const c of want)if(!has||has(c))return c;return 'idle';}
 const fallbackClips={greet:['wave','interact'],flirt:['blow-kiss','coy','head-tilt','interact'],laugh:['laugh','talk'],shy:['coy','head-tilt'],idleAlt:['idle'],dance:['slow-dance','dance'],
  playfulDance:['dance'],sitAlt:['sit-relax','sit'],sitGreet:['sit-wave','sit-talk'],decline:['shrug','head-tilt'],recline:['recline'],glance:['glance-back','head-tilt'],confident:['hips','head-tilt']};

 // Seren and Kai (original adult characters; MakeHuman CC0, Mixamo and Rokoko mocap). DRAFT lines throughout.
 register({id:'seren',name:'Seren',sex:'female',model:'vr-companion-f',preview:'void-runner/assets/vr/companions/seren.jpg',
  about:'Warm, quick-witted and a little teasing. She notices everything.',voice:{characterId:'vr-seren',voiceId:null},
  personality:{initiative:.68,flirtatiousness:.7,approachFrequency:.6,personalSpace:.95},
  clips:{greet:['wave'],flirt:['blow-kiss','coy','head-tilt','hips'],shy:['coy'],idleAlt:['idle-f2','hips','head-tilt'],walk:['walk-f'],dance:['slow-dance'],playfulDance:['dance-belly'],confident:['hips']},
  dialogue:{
   greet:['There you are. I was starting to think the city kept you.','Hey, you. Come in, the view is better from over here.','You made it. Leave NeoChinatown at the door; it\'s just us up here.'],
   chat:['Up here, nobody is selling anything. I like that about this place.','I come out to the balcony when the sun goes down. Everything turns the colour of honey.','Tell me something nobody else knows about you. I\'ll keep it, I promise.','I like how quiet you get when you\'re thinking. It\'s a good look.','The rain never reaches this room. I made sure of it.'],
   compliment:['Careful. Keep saying things like that and I\'ll believe you.','Well. That\'s made my whole evening.','You\'re sweet. I noticed you noticed, by the way.'],
   flirt:['Is that a line? It\'s working, a little.','Mm. You\'re trouble. The good kind.','Say that again, slower.'],
   sit:['Room for two. Come here.','That\'s better. I like having you close.'],
   dance:['Is that an invitation? Then lead.','Don\'t look at your feet. Look at me.','See? You\'re a natural.'],
   hands:['Your hands are warm.','There. Now don\'t let go too soon.'],
   kiss:['Come here.'],kissAfter:['Mm. I was hoping you\'d do that.','Well. That was worth waiting for.'],
   notYet:['Slow down, you. Talk to me a little first.','Not yet. I like the anticipation.'],
   notNow:['Sit with me first, or ask me to dance.'],
   relax:['Just breathe. Nothing out there can find you in here.','This is nice. No need to say anything.'],
   bye:['Go on, then. Come back soon; I\'ll keep the lights low.','Goodnight. Don\'t let the city keep you too long.'],
   // Her own initiative (DRAFT, new).
   approach:['Don\'t hide over there. Come talk to me.','You keep wandering off. I\'m starting to take it personally.','There you are. I was just thinking about you.'],
   window:['Pretty, isn\'t it? From up here even the city looks like it\'s flirting.','All those lights, and you\'re still the most interesting thing in the room.'],
   joinSofa:['Mind if I join you? Too late, I\'m coming over.','Save me a spot. Actually, I\'ll make one.'],
   inviteSit:['Come sit with me. I don\'t bite. Much.','My feet hurt and the sofa\'s lonely. Sit with me?'],
   inviteDance:['This song\'s too good to waste. Dance with me?','Dance with me. One song.'],
   inviteRecline:['Lie back with me a minute? Just to watch the lights.'],
   accepted:['Good answer.','I knew you\'d say yes.'],
   declined:['Fine. But I\'m asking again later.','Your loss. I\'ll be right here.'],
   welcomeBack:['Missed me? Don\'t answer that, I can tell.','Back already? I knew you would be.'],
   aside:['You\'re staring. I like it.','Careful. I could get used to this.','You have no idea how good you look in this light.'],
   comeHere:['On my way.','Mm, you called?'],recline:['This is my favourite view. The ceiling glow, and you.']}});
 register({id:'kai',name:'Kai',sex:'male',model:'vr-companion-m',preview:'void-runner/assets/vr/companions/kai.jpg',
  about:'Calm, wry and attentive. He listens more than he talks.',voice:{characterId:'vr-kai',voiceId:null},
  personality:{initiative:.45,flirtatiousness:.5,approachFrequency:.42,attention:.92,personalSpace:1.15,walkSpeed:1.05},
  clips:{greet:['head-tilt'],flirt:['blow-kiss','head-tilt','laugh'],shy:['head-tilt'],idleAlt:['idle-m2','head-tilt'],dance:['slow-dance'],playfulDance:['dance-samba']},
  dialogue:{
   greet:['Hey. Glad you came up. The city can wait an hour.','There you are. Come in, the view is the best part.','You look like you need somewhere quiet. You found it.'],
   chat:['Up here it\'s just the sea and the sky. No ads, no drones.','I like this hour. The light goes soft and everything slows down.','You don\'t have to tell me about your day. But I\'d listen.','You\'re easy to be around. Not many people are.','I keep the window open a little. The air smells like salt.'],
   compliment:['Now you\'re just being kind. Keep going.','That\'s the best thing I\'ve heard all week.','You\'ve got a way with words. I noticed.'],
   flirt:['Is that so? Tell me more.','You\'re dangerous. I like it.','Say it like you mean it.'],
   sit:['Sit with me.','Better. I like you here.'],
   dance:['Then dance with me. No one\'s watching.','Follow me. There. Just like that.','See? Nothing to it.'],
   hands:['Steady hands.','Stay a while.'],
   kiss:['Come here.'],kissAfter:['I\'ve been wanting to do that.','Well. Hello to you too.'],
   notYet:['Let\'s talk a little first. I like getting to know you.','Not yet. There\'s no rush.'],
   notNow:['Come sit with me, or ask me to dance.'],
   relax:['Close your eyes for a minute. I\'ve got the watch.','This is good. Just this.'],
   bye:['Go on. Come back when the city gets loud.','Goodnight. The view will be here.'],
   approach:['Hey. You looked like you could use some company.','Thought I\'d come over before you got lost in your head.'],
   window:['Best seat in the city. Second best, now that you\'re here.','All that noise down there. Up here it\'s just us.'],
   joinSofa:['Room for one more?','Mind if I sit? I promise I\'m good company.'],
   inviteSit:['Sit with me a while.','Come here. The sofa\'s better with two.'],
   inviteDance:['Dance with me? I\'ll try not to step on you.','One dance. Humour me.'],
   inviteRecline:['Lie back with me for a bit? The ceiling\'s worth it.'],
   accepted:['Yeah? Good.','I was hoping you\'d say that.'],
   declined:['No pressure. The offer stands.','Fair enough. I\'ll ask again when you least expect it.'],
   welcomeBack:['There you are. I was saving your spot.','Welcome back. The view was getting lonely.'],
   aside:['You\'ve got a great laugh. Just so you know.','I could stay up here all night with you.','You make this city look quiet.'],
   comeHere:['Coming.','Right here.'],recline:['Not bad, right? Best ceiling in NeoChinatown.']}});

 // Nadia (named and characterised by David, 2026-10-28): grounded, warm and direct; grew up in NeoChinatown and
 // teases you for being an outsider. Model: "Realistic Contemporary Woman FC1" by Ludovisions (CGTrader, free,
 // Royalty Free License - no AI), converted by build_imported_character.py. Her licence asks that the file not be
 // easy to extract, so she ships scrambled (.vrpak). Every line is a DRAFT for David's review.
 register({id:'nadia',name:'Nadia',sex:'female',model:'vr-companion-fc1',file:'vr-companion-fc1.vrpak',preview:'void-runner/assets/vr/companions/nadia.jpg',
  about:'Grounded, warm and direct. Born and raised in NeoChinatown, and she\'ll never let you forget you weren\'t.',voice:{characterId:'vr-nadia',voiceId:null},
  personality:{initiative:.56,flirtatiousness:.5,approachFrequency:.7,attention:.88,personalSpace:.9,remarkCooldown:18},
  clips:{greet:['wave'],flirt:['head-tilt','laugh','coy'],shy:['head-tilt'],idleAlt:['idle-f2','hips'],walk:['walk-f'],dance:['slow-dance'],playfulDance:['dance-belly'],confident:['hips'],laugh:['laugh']},
  dialogue:{
   greet:['There you are, outsider. Shoes off, the floor\'s new.','Hey. You found the place without a guide. I\'m impressed.','You made it up the stairs. Most tourists take the lift and get lost.'],
   chat:['I grew up six blocks from here. Same noodle stand, same leaky gutter, my whole life.','See that red sign? It\'s been flickering since I was a kid. Nobody fixes it. Nobody wants to.','You still walk like you\'re new here. Eyes up, reading every sign. It\'s cute.','Every street down there has a story. Most of them are true. Some of them are mine.','Tell me where you\'re really from. Not the answer you give at customs.'],
   compliment:['Smooth. Did they teach you that off-world?','Okay. That one landed. Don\'t get used to it.','Ha. You\'re learning how we talk around here.'],
   flirt:['Careful. Locals don\'t fall for lines. Usually.','Say that again and I might believe it.','You\'re bolder than you look, outsider.'],
   sit:['Sit. You\'re making the room nervous.','Better. Now you look like you live here.'],
   dance:['You dance like a tourist. Here, follow me.','Loosen up. Nobody up here is watching but me.','There you go. Almost a local.'],
   hands:['Your hands are cold. Off-world blood.','Hold on. I\'ll show you how it\'s done.'],
   kiss:['Come here.'],kissAfter:['Well. Welcome to NeoChinatown.','Hm. Not bad for an outsider.'],
   notYet:['Easy. Talk to me a bit first.','Slow down, outsider. We\'ve got all night.'],
   notNow:['Sit with me first, or ask me to dance.'],
   relax:['Listen. You can hear the market closing up from here.','Just breathe. The city can run itself for an hour.'],
   bye:['Go on. Try not to get lost on the way down.','Night, outsider. Come back before you forget the way.'],
   // Her own initiative (DRAFT).
   approach:['Don\'t stand there like you\'re waiting for a taxi. Come talk.','You keep drifting off. Something on your mind, or just the view?','Hey. Come here, I want to show you something.'],
   window:['That alley there? I broke my wrist falling off that fire escape. Worth it.','From up here you can tell which stalls are lying about being open.'],
   joinSofa:['Scoot over. Locals get the good side.','Mind if I join you? Rhetorical question.'],
   inviteSit:['Come sit. I\'ll tell you which of the signs out there are lying.','Sit with me a while. Your feet must hurt from all that sightseeing.'],
   inviteDance:['This one\'s an old street song. Dance with me, I\'ll teach you.','Up. One dance. Consider it a cultural lesson.'],
   inviteRecline:['Lie back a minute. The ceiling glow is the only quiet light in this city.'],
   accepted:['Good. You\'re learning.','See? Easy.'],
   declined:['Suit yourself, outsider. Offer stands.','Fine. I\'ll ask again when you\'ve loosened up.'],
   welcomeBack:['Back again? Careful, people will start thinking you live here.','You came back. They always do.'],
   aside:['You\'re staring again. Locals notice that.','You\'re not so bad, for someone from out there.','The city likes you. I can tell. So do I, a little.'],
   comeHere:['Coming, coming.','What, lost already?'],recline:['Best ceiling in NeoChinatown. Don\'t tell anyone.']}});

 // Ava and Eva (names by David, 2026-10-30): characters from models David supplied from CGTrader, "Ava" v2.0 by
 // BGShop and "PrettyGirl_01" (Eva), prepared by prepare_ava.py / prepare_prettygirl.py and converted by
 // build_imported_character.py. Their personalities, descriptions and lines are DRAFTs by Claude (David, 2026-11-01:
 // "Draft it all"), each in their own voice (Ava: quick and stylish, a holo-fashion designer; Eva: gentle and dreamy,
 // she paints the skyline). They can come along together (pairable). Released on
 // the live site (David, 2026-10-31: CGTrader Royalty Free licences, subscription kept active).
 // Default looks are David's picks: Ava in the red top and skirt with the bob and no glasses (the bikini bottom is
 // worn under the skirt, so nothing shows when she sits); Eva in the white slip dress with her natural
 // orange-and-white hair.
 register({id:'ava',name:'Ava',sex:'female',model:'vr-companion-ava',file:'vr-companion-ava.vrpak',preview:'void-runner/assets/vr/companions/ava.jpg',
  about:'Quick, stylish and sure of herself. She designs holo-fashion and has an opinion about everything, including you.',
  licensed:true,pairable:true,personality:{initiative:0.66,flirtatiousness:0.62,approachFrequency:0.6,personalSpace:0.95},
  dialogue:{
   greet:['There you are. I was about to start judging the skyline without you.','Hey, you. Come in, I saved you the good light.','Look who finally showed up. Good timing, too.'],
   chat:['I designed three holo-jackets this week. Two of them were genius. One of them was art.','Everyone down there dresses for the cameras. I dress for the rain.','Half the signs out there use my colours. Nobody pays me for it.','Tell me what you actually like. Not what you think I want to hear.','I can tell a lot about someone from how they stand in a room. You stand like you\'re about to leave. Don\'t.'],
   compliment:['Obviously. But it\'s nice to hear you say it.','Okay, that was smooth. I\'m noting it down.','Flattery works on me. You\'ve just found my weakness.'],
   flirt:['Careful. I could get used to you.','Is that a line? Because I\'m rating it. Eight out of ten.','You\'re trouble. I like trouble.'],
   sit:['Sit. You\'re ruining my composition.','Better. Now the room looks right.'],
   dance:['Finally, someone with taste. Lead, or I will.','Don\'t think, just move. I\'ll make you look good.','See? Style is mostly confidence.'],
   hands:['Your hands are warmer than I expected.','Hold on. I don\'t let go first.'],
   kiss:['Come here.'],
   kissAfter:['Well. That\'s going in my portfolio.','Mm. Ten out of ten. Don\'t let it go to your head.'],
   notYet:['Patience. I like a good build-up.','Not yet. Impress me with words first.'],
   notNow:['Sit with me first. Or dance with me; I\'m not fussy.'],
   relax:['Close your eyes. I\'ll tell you when the city\'s worth looking at again.','This is nice. No deadlines, no clients, just this.'],
   bye:['Go on, then. Come back looking at least this good.','Goodnight. Don\'t let anyone else style you.'],
   approach:['You\'re hovering. Come over here.','I need a second opinion on the view. Yours.','There you are. I was starting to get bored.'],
   window:['Look at that pink sign on the left. I\'d have used a colder magenta.','From up here the whole city looks like a runway.'],
   joinSofa:['Move over. I\'m joining you.','Mind if I sit? I\'m sitting.'],
   inviteSit:['Come sit with me. I want to hear about your day.','Sit with me a minute. I promise I\'ll only criticise the décor.'],
   inviteDance:['This track is too good to waste. Dance with me?','Dance with me. I\'ll make it worth your while.'],
   inviteRecline:['Lie back with me a minute and watch the ceiling glow.'],
   accepted:['Good choice.','I knew you had taste.'],
   declined:['Your loss. I\'ll ask again later.','Fine. I\'m still asking again.'],
   welcomeBack:['Back already? You missed me.','There you are. The room was getting dull.'],
   aside:['You\'re staring. I don\'t mind.','You clean up nicely, you know that?','I\'d put you on a billboard.'],
   comeHere:['On my way.','You called?'],
   recline:['Best view in NeoChinatown. The ceiling, and you.']},voice:{characterId:'vr-ava',voiceId:null},
  clips:{greet:['wave'],flirt:['hips','head-tilt','blow-kiss'],shy:['head-tilt'],confident:['hips'],playfulDance:['dance-belly'],walk:['walk-f'],idleAlt:['idle-f2']},
  looks:[
   {key:'outfit',label:'Outfit',default:'red',options:[{id:'red',label:'Red top and skirt',parts:['top_red','skirt_red','bikini_bottom']},{id:'bikini',label:'Bikini',parts:['bikini_top','bikini_bottom','skin_under']}]},
   {key:'hair',label:'Hairstyle',default:'bob',options:[{id:'bob',label:'Bob',parts:['hair_bob']},{id:'long',label:'Long',parts:['hair_long']},{id:'pixie',label:'Pixie',parts:['hair_pixie']}]},
   {key:'glasses',label:'Glasses',default:'none',options:[{id:'none',label:'None',parts:[]},{id:'round',label:'Round',parts:['glasses_round']},{id:'wire',label:'Wire',parts:['glasses_wire']}]},
   {key:'face',label:'Make-up',default:'natural',options:[{id:'natural',label:'Natural'},{id:'makeup',label:'Make-up',textures:{head:'face-makeup',lips:'face-makeup'}}]}]});
 // Colour and make-up variants are separate textures (assets/models/crowd/<model>/*.vrtex), loaded only when chosen;
 // `textures` maps a material to its variant file.
 const variant=(id,label,dflt,map)=>({id,label,...(id===dflt?{}:{textures:map(id)})});
 register({id:'eva',name:'Eva',sex:'female',model:'vr-companion-pg',file:'vr-companion-pg.vrpak',preview:'void-runner/assets/vr/companions/eva.jpg',
  about:'Gentle and dreamy, a little shy at first. She paints the skyline at night and notices the small things.',
  licensed:true,pairable:true,personality:{initiative:0.4,flirtatiousness:0.45,approachFrequency:0.45,attention:0.9,personalSpace:1.1,walkSpeed:1.05},
  dialogue:{
   greet:['Oh, hi. I hoped you\'d come by.','Hey. Come in, it\'s quiet up here tonight.','You\'re here. I was just watching the lights.'],
   chat:['I paint the skyline sometimes. It\'s never the same twice.','Do you ever listen to the rain on the glass? It sounds like whispering.','I like the hour before dawn. Even the signs look tired.','You don\'t have to say anything. I like the quiet too.','Tell me something you love. Anything at all.'],
   compliment:['Oh. That\'s really kind of you.','You\'re making me blush. Stop. No, don\'t.','Thank you. I\'ll remember that one.'],
   flirt:['You\'re sweet. I\'m not used to that.','Say that again? I want to keep it.','You make it hard to look anywhere else.'],
   sit:['Sit with me? It\'s nicer with two.','There. That\'s nicer.'],
   dance:['I\'m not very good. Will you show me?','Slowly. Like this.','Oh. That was lovely.'],
   hands:['Your hand fits mine.','Stay like this a little while.'],
   kiss:['Come here.'],
   kissAfter:['Oh. I\'ve been wanting that.','I\'ll paint that one. In my head.'],
   notYet:['Wait. Talk to me a little first.','Not yet. I\'m still getting brave.'],
   notNow:['Sit with me first? Or we could dance.'],
   relax:['Just breathe. Nothing out there can reach us.','This is my favourite kind of quiet.'],
   bye:['Goodnight. Come back soon?','Bye. I\'ll leave the light on for you.'],
   approach:['Hi. Can I stand with you a while?','You looked lonely over there. So was I.','Hey. I wanted to be closer.'],
   window:['See that blue glow? I\'ve been trying to paint that colour for weeks.','The city looks softer from up here.'],
   joinSofa:['Can I sit with you?','Is there room for me?'],
   inviteSit:['Will you sit with me a while?','Come sit. I don\'t want to be on my own.'],
   inviteDance:['This song is so pretty. Dance with me?','Dance with me? Just a slow one.'],
   inviteRecline:['Lie back with me? The ceiling looks like stars from there.'],
   accepted:['Really? Good.','I hoped you\'d say yes.'],
   declined:['That\'s okay. Maybe later.','Oh. Alright. I\'ll be here.'],
   welcomeBack:['You came back. I\'m glad.','Hi again. I missed you a little.'],
   aside:['You have kind eyes. Has anyone told you?','I like being near you.','Sorry, I was staring. You\'re easy to look at.'],
   comeHere:['Coming.','I\'m here.'],
   recline:['It does look like stars. I knew it would.']},voice:{characterId:'vr-eva',voiceId:null},
  clips:{greet:['wave'],flirt:['coy','head-tilt'],shy:['coy'],idleAlt:['idle-f2'],playfulDance:['slow-dance'],walk:['walk-f']},
  looks:[
   {key:'outfit',label:'Outfit',default:'white',options:[['white','White slip dress'],['blue','Blue floral slip dress'],['pink','Pink cherry slip dress'],['grey','Grey slip dress']].map(([id,label])=>variant(id,label,'white',c=>({cloth:'cloth-'+c})))},
   {key:'hair',label:'Hair colour',default:'natural',options:[['natural','Natural'],['black','Black'],['blond','Blond'],['ginger','Ginger'],['red','Red'],['white','White'],['blue','Blue']].map(([id,label])=>variant(id,label,'natural',c=>({hair:'hair-'+c})))},
   {key:'eyes',label:'Eye colour',default:'brown',options:[['brown','Brown'],['blue','Blue'],['green','Green'],['hazel','Hazel']].map(([id,label])=>variant(id,label,'brown',c=>({eye_r3:'eyes-'+c,eye_l3:'eyes-'+c})))},
   {key:'face',label:'Make-up',default:'5',options:['1','2','3','4','5','6'].map(n=>variant(n,'Look '+n,'5',()=>({head5:'face-0'+n})))}]});

 // Una and the two base figures (CGTrader packages David supplied, 2026-10-31). Una was a static model: she is rigged
 // on the Female Base skeleton (prepare_una.py); the base figures come rigged (prepare_basemesh.py). Like Ava and Eva:
 // their own DRAFT personality, description, lines and voice (Una: a guarded ex-corporate netrunner; Yuki: sporty
 // and upbeat; Dex: an easy-going dockworker), able to come along in pairs (not Dex). Yuki and Dex are released on the live
 // site (Male Female Base Rig, CGTrader #4027823, Royalty Free no AI); Una stays on a local development server until
 // her product page and licence are identified. The two base figures are Yuki and Dex (names by David, 2026-10-31; ids base-f / base-m); Dex comes in briefs
 // only, until David adds clothing.
 // Una's outfits are David's Style A (default), B and C made from her own clothes, plus the original. A look may
 // also set material values (`materials`: roughness factors) for a glossier finish.
 register({id:'una',name:'Una',sex:'female',model:'vr-companion-una',file:'vr-companion-una.vrpak',preview:'void-runner/assets/vr/companions/una.jpg',
  about:'Cool, precise and a little guarded. A former corporate netrunner who keeps her own hours now, and her own secrets.',
  listed:'dev',licensed:true,pairable:true,personality:{initiative:0.5,flirtatiousness:0.45,approachFrequency:0.48,attention:0.9,personalSpace:1.15},
  dialogue:{
   greet:['You\'re late. I don\'t mind. Much.','Hey. I swept the room for bugs. It\'s just us.','There you are. Shut the door; the corridor has ears.'],
   chat:['I used to run data for a tower down there. Fourteen-hour shifts and a view of nothing.','Every sign out there is logging someone. Up here, nobody logs me.','I quit the day they asked me to trace a friend. Best decision I ever made.','You don\'t talk much about yourself. I respect that. I\'m also curious.','Ask me anything. I might even answer.'],
   compliment:['Noted. And appreciated.','Hm. You meant that. I can tell.','That was nice. Don\'t make it a habit.'],
   flirt:['Careful. I read people for a living.','You\'re harder to predict than most. I like that.','Say that again. I want to check it for lies.'],
   sit:['Sit. Back to the wall; old habit.','Good. I like you where I can see you.'],
   dance:['I don\'t dance. Usually. Lead.','You\'re better at this than you let on.','Hm. Not bad at all.'],
   hands:['Steady hands. Good.','Don\'t let go yet.'],
   kiss:['Come here.'],
   kissAfter:['That wasn\'t in my forecast.','Hm. I\'ll allow it.'],
   notYet:['Slow down. Trust takes a minute.','Not yet. Talk to me first.'],
   notNow:['Sit with me first, or ask me to dance. Then we\'ll see.'],
   relax:['Breathe. Nobody\'s watching. I checked.','This is the only place I ever switch off.'],
   bye:['Go. Watch the cameras on the way down.','Goodnight. Come back when the city gets loud.'],
   approach:['Come here. You\'re standing in a blind spot, and I want to see you.','You keep drifting off. Something on your mind?','Hey. Talk to me.'],
   window:['Count the drones. Seven tonight. Usually it\'s nine.','From here you can see which towers never sleep.'],
   joinSofa:['Mind if I sit? I\'ll take the side by the wall.','Move over a little.'],
   inviteSit:['Sit with me. I could use the company.','Come sit. I\'ll tell you a story I\'m not supposed to.'],
   inviteDance:['One dance. Don\'t tell anyone.','Dance with me. Before I change my mind.'],
   inviteRecline:['Lie back with me a minute. No screens, no noise.'],
   accepted:['Good.','Thought you might.'],
   declined:['Fine. Offer stands.','Your call. I\'ll ask again.'],
   welcomeBack:['Back again. I noticed.','There you are. I kept your seat.'],
   aside:['You\'re more interesting than my old job.','You\'re staring. I don\'t mind this time.','I don\'t trust easily. I\'m trying, with you.'],
   comeHere:['On my way.','Right here.'],
   recline:['Quiet. No pings, no alerts. Just this.']},voice:{characterId:'vr-una',voiceId:null},
  clips:{greet:['head-tilt'],flirt:['head-tilt','hips'],shy:['head-tilt'],confident:['hips'],idleAlt:['idle-f2'],walk:['walk-f']},
  looks:[
   {key:'outfit',label:'Outfit',default:'minimalist',options:[
    {id:'minimalist',label:'Minimalist (charcoal, cyan piping)',parts:['leggings','piping_top','piping_waist'],textures:{outfit_top:'top-charcoal',outfit_pants:'pants-charcoal'}},
    {id:'nightlife',label:'Nightlife (violet shorts, jacket)',parts:['jacket','shorts','piping_shorts'],textures:{outfit_pants:'pants-violet'},materials:{outfit_jacket:{roughness:.55},outfit_top:{roughness:.35},outfit_pants:{roughness:.3}}},
    {id:'elegant',label:'Elegant (violet jacket)',parts:['jacket','jacket_item','leggings','piping_jacket'],textures:{outfit_jacket:'jacket-violet'}},
    {id:'original',label:'Original (black leather)',parts:['jacket','jacket_item','leggings']}]}]});
 register({id:'base-f',name:'Yuki',sex:'female',model:'vr-companion-bf',file:'vr-companion-bf.vrpak',preview:'void-runner/assets/vr/companions/base-f.jpg',
  about:'Bright, sporty and upbeat. She runs the rooftops at dawn, laughs easily and never sits still for long.',
  licensed:true,pairable:true,personality:{initiative:0.7,flirtatiousness:0.52,approachFrequency:0.72,personalSpace:0.9,walkSpeed:1.25,remarkCooldown:18},
  dialogue:{
   greet:['Hey, you! I just got back from a run. Okay, a short run.','There you are! Come in, come in.','Hi! I was hoping it\'d be you.'],
   chat:['I ran the rooftops from here to the noodle market this morning. Personal best!','You should come running with me sometime. I\'ll go slow. Maybe.','I\'ve never been able to sit still. My mum says I was born mid-sprint.','The view\'s better at dawn. Everything turns gold for about four minutes.','Tell me your favourite thing about this city. Mine\'s the food.'],
   compliment:['Aw, stop it! No, keep going.','Ha! You\'re sweet.','Okay, that made my whole day.'],
   flirt:['Ooh. Bold. I like it.','Are you flirting with me? Because it\'s working.','Careful, I might chase you.'],
   sit:['Sit! You look like you need a breather.','There we go. Comfy?'],
   dance:['Yes! Finally! Come on!','Don\'t worry about the steps, just have fun!','Ha! See? You\'re great at this.'],
   hands:['Your hands are cold! Here.','Don\'t let go, okay?'],
   kiss:['Come here.'],
   kissAfter:['Wow. Okay. Again sometime?','Ha. That was nice.'],
   notYet:['Whoa, slow down, speedy. Talk to me first.','Not yet! Let\'s hang out a bit.'],
   notNow:['Sit with me first, or dance with me! Then we\'ll see.'],
   relax:['Okay, I\'ll sit still. For you. For one minute.','This is nice. Even I can enjoy doing nothing.'],
   bye:['Bye! Come back soon, or I\'ll come find you.','Night! Get some sleep, okay?'],
   approach:['Hey! Over here!','You\'re too far away. Come closer.','There you are. I was getting restless.'],
   window:['See that rooftop with the green light? I jumped that gap once. Don\'t tell anyone.','I could stare at this city all night. Well, for a bit.'],
   joinSofa:['Scoot over!','Room for me? Great.'],
   inviteSit:['Sit with me? I promise not to fidget. Much.','Come sit, I want to hear everything.'],
   inviteDance:['Dance with me! Come on, it\'s good for you.','This song! We have to dance.'],
   inviteRecline:['Lie back with me a minute? I\'ll actually stay still.'],
   accepted:['Yes!','Knew you\'d say yes.'],
   declined:['Aw. Okay, next time.','Fine, fine. I\'ll ask again in five minutes.'],
   welcomeBack:['You\'re back! I missed you.','Hey, there you are again!'],
   aside:['You\'ve got a great smile.','I like hanging out with you.','You\'re fun. Has anyone told you that?'],
   comeHere:['Coming!','Right here!'],
   recline:['See? I can relax. Sometimes.']},voice:{characterId:'vr-base-f',voiceId:null},clips:{greet:['wave'],flirt:['blow-kiss','laugh','head-tilt'],shy:['coy'],laugh:['laugh'],playfulDance:['dance-belly'],idleAlt:['idle-f2'],walk:['walk-f']}});
 register({id:'base-m',name:'Dex',sex:'male',model:'vr-companion-bm',file:'vr-companion-bm.vrpak',preview:'void-runner/assets/vr/companions/base-m.jpg',
  about:'Easy-going and funny. He works the cargo docks, loves old music and always has a story ready.',
  licensed:true,pairable:false,personality:{initiative:0.5,flirtatiousness:0.5,approachFrequency:0.5,attention:0.9,personalSpace:1.1,walkSpeed:1.05},
  dialogue:{
   greet:['Hey. Glad you made it up here.','There you are. Grab a seat, or don\'t, I\'m easy.','Evening. The city\'s loud tonight; it\'s quieter up here.'],
   chat:['I spent all day hauling crates at the docks. This is my reward.','You ever listen to old vinyl? Real crackle. Nothing else sounds like it.','A crane operator told me a joke today. I\'ll spare you. It was terrible.','I like this place. Nobody needs anything from me up here.','Tell me about your day. I\'ve got nowhere to be.'],
   compliment:['Well, thanks. You\'re not so bad yourself.','Ha. I\'ll take it.','That\'s the nicest thing I\'ve heard all week.'],
   flirt:['Careful. I\'m easily charmed.','Oh yeah? Go on, I\'m listening.','You\'ve got a way about you, you know that?'],
   sit:['Sit down, take a load off.','There. Much better.'],
   dance:['I\'ve got two left feet, but let\'s go.','Just sway. Nobody\'s judging.','Hey, look at us. Not bad.'],
   hands:['Steady grip. I like that.','Don\'t rush off.'],
   kiss:['Come here.'],
   kissAfter:['Well. That was worth the climb.','Hm. I could get used to that.'],
   notYet:['Easy. Let\'s talk a bit first.','No rush. We\'ve got all night.'],
   notNow:['Sit down first, or ask me for a dance. Then we\'ll talk.'],
   relax:['Close your eyes. I\'ll keep watch.','Can\'t beat this. Honestly.'],
   bye:['Night. Mind the stairs.','Take care out there. Come back soon.'],
   approach:['Hey. Figured you could use a friendly face.','Come on over, I don\'t bite.','There you are.'],
   window:['See those cranes? I worked on the third one from the left.','Listen to that racket down there. You\'d never know from up here.'],
   joinSofa:['Mind if I sit?','Shove over a bit?'],
   inviteSit:['Sit with me a while?','Come sit. My feet are killing me.'],
   inviteDance:['Dance with me? I promise to try.','Come on, one dance. I\'ll only step on you once.'],
   inviteRecline:['Lie back with me for a bit? Best ceiling in town.'],
   accepted:['Yeah? Good.','Was hoping you\'d say that.'],
   declined:['No worries. Offer stands.','Fair enough. Maybe later.'],
   welcomeBack:['There you are. Kept your spot warm.','Welcome back.'],
   aside:['You\'ve got a good laugh, you know that?','I like your company.','You\'re better company than the radio, and I love the radio.'],
   comeHere:['Coming.','Right here.'],
   recline:['Comfy, right? Beats a bunk on the docks.']},voice:{characterId:'vr-base-m',voiceId:null},clips:{greet:['wave'],flirt:['head-tilt','laugh'],shy:['head-tilt'],laugh:['laugh'],playfulDance:['slow-dance'],idleAlt:['head-tilt']}});

 // ---- Looks: outfit, hairstyle, glasses, colours. A group's options each show their `parts` (mesh names; parts no
 // option names are always shown) and may swap `textures`. The choices are a preference kept per browser, like
 // graphics and audio settings (not in the Campaign save, so no save depends on them).
 const lookKey='void-runner-companion-looks-v1';
 const looks=entry=>entry?.looks||[];
 function option(entry,key,id){const g=looks(entry).find(x=>x.key===key);return g?g.options.find(o=>o.id===id)||g.options.find(o=>o.id===g.default)||g.options[0]||null:null;}
 const chosen=(entry,picked={})=>Object.fromEntries(looks(entry).map(g=>[g.key,option(entry,g.key,picked?.[g.key]).id]));
 function wears(entry,picked){const c=chosen(entry,picked),managed=new Set(looks(entry).flatMap(g=>g.options.flatMap(o=>o.parts||[]))),on=new Set(looks(entry).flatMap(g=>option(entry,g.key,c[g.key]).parts||[]));
  return part=>!managed.has(part)||on.has(part);}
 // Material -> variant texture file for the chosen looks (materials not listed keep the model's own texture).
 const lookTextures=(entry,picked)=>{const c=chosen(entry,picked);return Object.assign({},...looks(entry).map(g=>option(entry,g.key,c[g.key]).textures||{}));};
 const variantTextures=entry=>[...new Set(looks(entry).flatMap(g=>g.options.flatMap(o=>Object.keys(o.textures||{}))))];
 // Material values the chosen looks set ({material: {roughness}}), and every material any look touches.
 const lookMaterials=(entry,picked)=>{const c=chosen(entry,picked);return Object.assign({},...looks(entry).map(g=>option(entry,g.key,c[g.key]).materials||{}));};
 const variantMaterials=entry=>[...new Set(looks(entry).flatMap(g=>g.options.flatMap(o=>Object.keys(o.materials||{}))))];
 function readLooks(store){try{return JSON.parse(store?.getItem(lookKey)||'{}')||{};}catch{return {};}}
 const savedLooks=(entry,store=globalThis.localStorage)=>chosen(entry,readLooks(store)[entry.id]);
 function saveLook(entry,key,id,store=globalThis.localStorage){const o=option(entry,key,id);if(!o)return false;try{const all=readLooks(store);all[entry.id]={...chosen(entry,all[entry.id]),[key]:o.id};store.setItem(lookKey,JSON.stringify(all));return true;}catch{return false;}}
 // Whether a companion has lines yet (Ava and Eva don't, until David writes them).
 const speaks=entry=>Object.values(entry?.dialogue||{}).some(p=>p?.length);

 // Lines drawn from a pool never repeat the last one used.
 function pick(pool,mem,key,rnd=Math.random){if(!pool?.length)return '';const options=pool.length>1?pool.filter(l=>l!==mem[key]):pool;const l=options[Math.floor(rnd()*options.length)]||pool[0];mem[key]=l;return l;}

 // ---- The brain: decides what the companion does on their own. Pure: feed it the world each tick. ----
 // world: {dt, player:{x,z,seated,still,interacting}, comp:{x,z,state}, zones:{window(x,z), sofa(seatId)}}
 // Returns an intent or null: {do:'say',pool} {do:'approach',pool,to?} {do:'invite',kind} {do:'join-sofa'}
 //   {do:'watch'} {do:'activity',kind}. The caller reports outcomes with note('declined:dance') etc.
 function brain(cfg,rnd=Math.random){
  const c={...defaults,...cfg},t={now:0,still:0,near:0,apart:0,activity:between(c.idleActivity),atWindow:0,seatedFor:0},last={},declined={};
  let wasNear=false,apartLong=false;
  function between([a,b]){return a+rnd()*(b-a);}
  const ready=(key,cool)=>last[key]==null||t.now-last[key]>=cool;
  const mark=key=>{last[key]=t.now;};
  const okToAsk=kind=>ready('invite',c.invitationCooldown)&&(declined[kind]==null||t.now-declined[kind]>=c.declineCooldown);
  function tick(w){
   const dt=w.dt||0;t.now+=dt;const p=w.player,m=w.comp,d=Math.hypot(p.x-m.x,p.z-m.z);
   // Busy: talking, mid-activity, sitting or dancing with you, a menu open. Timers rest.
   if(p.interacting||m.state==='busy'||m.state==='walk'){t.still=0;return null;}
   t.still=p.still?t.still+dt:0;t.seatedFor=p.seated?t.seatedFor+dt:0;t.atWindow=w.zones?.window&&!p.seated?t.atWindow+dt:0;
   const near=d<3.2;
   if(!near){t.apart+=dt;if(t.apart>c.welcomeAfter)apartLong=true;}
   // You walked away: watch you go for a moment.
   if(wasNear&&!near&&m.state!=='sit'){wasNear=false;return {do:'watch'};}
   if(near&&!wasNear){wasNear=true;t.apart=0;if(apartLong&&ready('welcome',c.welcomeAfter)){apartLong=false;mark('welcome');return {do:'say',pool:'welcomeBack',gesture:'greet'};}apartLong=false;}
   if(m.state==='sit'||m.state==='dance'||m.state==='recline')return null;
   // You sat on the sofa alone: they ask to join you.
   if(p.seated==='sofa'&&t.seatedFor>2.5&&okToAsk('join-sofa')&&rnd()<dt*(.4+c.initiative)){mark('invite');return {do:'invite',kind:'join-sofa',pool:'joinSofa'};}
   // You're at the window: they come over and talk about the view.
   if(t.atWindow>4&&!near&&ready('window',90)&&rnd()<dt*c.approachFrequency){mark('window');mark('approach');return {do:'approach',pool:'window',to:'player'};}
   // You stand near without doing anything: they speak (a remark, a flirt, or an invitation).
   if(near&&!p.seated&&t.still>c.chatAfter*(1.4-c.initiative)&&ready('remark',c.remarkCooldown)){
    t.still=0;mark('remark');const r=rnd();
    if(r<.35&&okToAsk('dance')){mark('invite');return {do:'invite',kind:'dance',pool:'inviteDance'};}
    if(r<.55&&okToAsk('sit')){mark('invite');return {do:'invite',kind:'sit',pool:'inviteSit'};}
    if(r<.62&&okToAsk('recline')){mark('invite');return {do:'invite',kind:'recline',pool:'inviteRecline'};}
    return rnd()<c.flirtatiousness?{do:'say',pool:'aside',gesture:'flirt'}:{do:'say',pool:'chat',gesture:'laugh'};}
   // You're across the room and still: sometimes they come to you.
   if(!near&&!p.seated&&t.still>6&&ready('approach',c.approachCooldown)&&rnd()<dt*c.approachFrequency*.5){mark('approach');t.still=0;return {do:'approach',pool:'approach',to:'player'};}
   // Otherwise, their own idle life.
   t.activity-=dt;if(t.activity<=0){t.activity=between(c.idleActivity);const r=rnd(),kinds=near?['gesture','gesture','window','wander']:['window','wander','gesture','sofa'];return {do:'activity',kind:kinds[Math.floor(r*kinds.length)]};}
   return null;}
  function note(event){const [what,kind]=event.split(':');if(what==='declined')declined[kind]=t.now;if(what==='accepted')delete declined[kind];if(what==='talked'){t.still=0;mark('remark');}}
  return {tick,note,get time(){return t.now;},state:()=>({...t,last:{...last},declined:{...declined}})};}

 // ---- Head tracking maths ----
 // How far round the head must turn to face a target: yaw relative to the body's facing, pitch up/down, both
 // clamped; and whether the whole body should turn (standing only, beyond bodyTurnAt until within bodyTurnUntil).
 const wrap=a=>((a+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;
 function look(bodyYaw,head,target,c=defaults,turning=false){
  const dx=target.x-head.x,dz=target.z-head.z,dy=target.y-head.y,want=Math.atan2(dx,dz),off=wrap(want-bodyYaw),flat=Math.hypot(dx,dz)||1e-6;
  const yaw=Math.max(-c.maxHeadYaw,Math.min(c.maxHeadYaw,off)),pitch=Math.max(-c.maxHeadPitch,Math.min(c.maxHeadPitch,Math.atan2(dy,flat)));
  const turn=turning?Math.abs(off)>c.bodyTurnUntil:Math.abs(off)>c.bodyTurnAt;
  return {yaw,pitch,offset:off,want,turn};}
 // Eases a value toward its target at `rate` per second without overshoot (no snapping).
 const ease=(from,to,rate,dt)=>from+(to-from)*Math.min(1,dt*rate);
 // Shares of the turn each bone takes, chest to head.
 const chain=[['Spine2',.22,.15],['Neck',.33,.35],['Head',.45,.5]];

 // ---- Paths around furniture: A* on a 0.2 m grid over the room's collision, then string-pulled ----
 function path(from,to,blocked,{step=.2,limit=6000}={}){
  const key=(i,j)=>i+','+j,toCell=v=>[Math.round(v[0]/step),Math.round(v[1]/step)],start=toCell(from),goal=toCell(to),free=(i,j)=>!blocked(i*step,j*step);
  const clear=(a,b)=>{const n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/(step/2));for(let k=1;k<n;k++){const x=a[0]+(b[0]-a[0])*k/n,z=a[1]+(b[1]-a[1])*k/n;if(blocked(x,z))return false;}return true;};
  if(clear(from,to)&&!blocked(to[0],to[1]))return [to.slice()];
  // Nearest free cell to the goal (a target inside furniture walks to its edge).
  let g=goal;if(!free(...g)){let best=null;for(let r=1;r<12&&!best;r++)for(let i=-r;i<=r;i++)for(let j=-r;j<=r;j++)if(free(g[0]+i,g[1]+j)&&(!best||Math.hypot(i,j)<best[2]))best=[g[0]+i,g[1]+j,Math.hypot(i,j)];if(!best)return null;g=[best[0],best[1]];}
  const open=new Map([[key(...start),{c:start,g:0,f:0,parent:null}]]),closed=new Map();let found=null;
  for(let n=0;n<limit&&open.size;n++){let cur=null;for(const v of open.values())if(!cur||v.f<cur.f)cur=v;open.delete(key(...cur.c));closed.set(key(...cur.c),cur);
   if(cur.c[0]===g[0]&&cur.c[1]===g[1]){found=cur;break;}
   for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const c2=[cur.c[0]+di,cur.c[1]+dj],k=key(...c2);if(closed.has(k)||!free(...c2))continue;if(di&&dj&&(!free(cur.c[0]+di,cur.c[1])||!free(cur.c[0],cur.c[1]+dj)))continue;
    const gs=cur.g+Math.hypot(di,dj),o=open.get(k);if(o&&o.g<=gs)continue;open.set(k,{c:c2,g:gs,f:gs+Math.hypot(g[0]-c2[0],g[1]-c2[1]),parent:cur});}}
  if(!found)return null;const cells=[];for(let v=found;v;v=v.parent)cells.unshift([v.c[0]*step,v.c[1]*step]);
  // String-pull: keep only the corners.
  const out=[];let at=from;for(let i=1;i<cells.length;i++)if(!clear(at,cells[i])){out.push(cells[i-1]);at=cells[i-1];}
  out.push(cells[cells.length-1]);return out;}

 const api={defaults,settings,register,get,voiceOf,pairs,list,file,resolve,requiredClips,clipFor,pick,brain,look,ease,wrap,chain,path,companions,party,partySize,offered,looks,option,chosen,wears,lookTextures,variantTextures,lookMaterials,variantMaterials,savedLooks,saveLook,speaks};
 if(typeof module!=='undefined')module.exports=api;else root.VoidVRCompanions=api;
})(globalThis);
