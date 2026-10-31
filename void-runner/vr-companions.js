/* VR companions for Play in a Bedroom: the registry the terminal's picker reads, each companion's behaviour
   settings, the small "brain" that gives them initiative, head-tracking maths and furniture-aware paths.
   Pure parts run in Node (tests/vr-companions.test.cjs); the bone work runs in the browser (vr-suite.js).
   Adding a companion: build a MakeHuman look with the companion clips (tools/animation-pipeline), or convert a
   licensed model with build_imported_character.py, list it in crowd.js, then register() an entry here with its
   model, preview, dialogue and personality. Nothing else changes.
   DRAFT: every line of companion dialogue is Claude's placeholder for David's review. Companions are unvoiced. */
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
 // Who comes along: one companion, or up to `partySize` together (all of them must be pairable). Unknown ids drop out.
 const partySize=2;
 function party(opts){
  const ids=Array.isArray(opts?.companions)?opts.companions:[];
  const many=[...new Set(ids.map(id=>current(get(id))).filter(Boolean))].slice(0,partySize);
  if(many.length>1&&many.every(e=>e.pairable))return many;
  const one=many[0]||resolve(opts);return one?[one]:[];}
 // Offered at the terminal: listed:false never; listed:'dev' only on a local development server (models whose
 // licence isn't confirmed for release yet).
 const localHost=h=>/^(localhost|127\.0\.0\.1|\[::1\])$/.test(h||'');
 const offered=(e,host=globalThis.location?.hostname)=>e.listed!==false&&!e.replacedBy&&(e.listed!=='dev'||localHost(host));
 // A companion's own clip for a role (its personality picks its gestures), falling back through common names.
 function clipFor(entry,role,has){const want=[...(entry.clips[role]||[]),role,...(fallbackClips[role]||[])];for(const c of want)if(!has||has(c))return c;return 'idle';}
 const fallbackClips={greet:['wave','interact'],flirt:['blow-kiss','coy','head-tilt','interact'],laugh:['laugh','talk'],shy:['coy','head-tilt'],idleAlt:['idle'],dance:['slow-dance','dance'],
  playfulDance:['dance'],sitAlt:['sit-relax','sit'],sitGreet:['sit-wave','sit-talk'],decline:['shrug','head-tilt'],recline:['recline'],glance:['glance-back','head-tilt'],confident:['hips','head-tilt']};

 // Seren and Kai (original adult characters; MakeHuman CC0, Mixamo and Rokoko mocap). DRAFT lines throughout.
 register({id:'seren',name:'Seren',sex:'female',model:'vr-companion-f',preview:'void-runner/assets/vr/companions/seren.jpg',
  about:'Warm, quick-witted and a little teasing. She notices everything.',voice:null,
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
  about:'Calm, wry and attentive. He listens more than he talks.',voice:null,
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
  about:'Grounded, warm and direct. Born and raised in NeoChinatown, and she\'ll never let you forget you weren\'t.',voice:null,
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
 // build_imported_character.py. Their personalities, lines and voices are still to come from David: each has its
 // own empty personality and dialogue and its own voice identity to fill, and nothing of Seren's. Without lines they
 // don't speak, and the bedroom offers only what needs no words. They can come along together (pairable). Until
 // their licences are confirmed for release they are offered only on a local development server (listed:'dev').
 // Default looks are David's picks: Ava in the red top and skirt with the bob and no glasses (the bikini bottom is
 // worn under the skirt, so nothing shows when she sits); Eva in the white slip dress with her natural
 // orange-and-white hair.
 register({id:'ava',name:'Ava',sex:'female',model:'vr-companion-ava',file:'vr-companion-ava.vrpak',preview:'void-runner/assets/vr/companions/ava.jpg',
  listed:'dev',pairable:true,personality:{},dialogue:{},voice:{characterId:'vr-ava',voiceId:null},
  clips:{walk:['walk-f'],idleAlt:['idle-f2']},
  looks:[
   {key:'outfit',label:'Outfit',default:'red',options:[{id:'red',label:'Red top and skirt',parts:['top_red','skirt_red','bikini_bottom']},{id:'bikini',label:'Bikini',parts:['bikini_top','bikini_bottom','skin_under']}]},
   {key:'hair',label:'Hairstyle',default:'bob',options:[{id:'bob',label:'Bob',parts:['hair_bob']},{id:'long',label:'Long',parts:['hair_long']},{id:'pixie',label:'Pixie',parts:['hair_pixie']}]},
   {key:'glasses',label:'Glasses',default:'none',options:[{id:'none',label:'None',parts:[]},{id:'round',label:'Round',parts:['glasses_round']},{id:'wire',label:'Wire',parts:['glasses_wire']}]},
   {key:'face',label:'Make-up',default:'natural',options:[{id:'natural',label:'Natural'},{id:'makeup',label:'Make-up',textures:{head:'face-makeup',lips:'face-makeup'}}]}]});
 // Colour and make-up variants are separate textures (assets/models/crowd/<model>/*.vrtex), loaded only when chosen;
 // `textures` maps a material to its variant file.
 const variant=(id,label,dflt,map)=>({id,label,...(id===dflt?{}:{textures:map(id)})});
 register({id:'eva',name:'Eva',sex:'female',model:'vr-companion-pg',file:'vr-companion-pg.vrpak',preview:'void-runner/assets/vr/companions/eva.jpg',
  listed:'dev',pairable:true,personality:{},dialogue:{},voice:{characterId:'vr-eva',voiceId:null},
  clips:{walk:['walk-f'],idleAlt:['idle-f2']},
  looks:[
   {key:'outfit',label:'Outfit',default:'white',options:[['white','White slip dress'],['blue','Blue floral slip dress'],['pink','Pink cherry slip dress'],['grey','Grey slip dress']].map(([id,label])=>({id,label,parts:['dress_'+id,'slippers_'+id]}))},
   {key:'hair',label:'Hair colour',default:'natural',options:[['natural','Natural'],['black','Black'],['blond','Blond'],['ginger','Ginger'],['red','Red'],['white','White'],['blue','Blue']].map(([id,label])=>variant(id,label,'natural',c=>({hair:'hair-'+c})))},
   {key:'eyes',label:'Eye colour',default:'brown',options:[['brown','Brown'],['blue','Blue'],['green','Green'],['hazel','Hazel']].map(([id,label])=>variant(id,label,'brown',c=>({eye_r3:'eyes-'+c,eye_l3:'eyes-'+c})))},
   {key:'face',label:'Make-up',default:'5',options:['1','2','3','4','5','6'].map(n=>variant(n,'Look '+n,'5',()=>({head5:'face-0'+n})))}]});

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

 const api={defaults,settings,register,get,list,file,resolve,requiredClips,clipFor,pick,brain,look,ease,wrap,chain,path,companions,party,partySize,offered,looks,option,chosen,wears,lookTextures,variantTextures,savedLooks,saveLook,speaks};
 if(typeof module!=='undefined')module.exports=api;else root.VoidVRCompanions=api;
})(globalThis);
