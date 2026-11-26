/* MISSION GIVERS MADE IN THE EDITOR (the owner, 19 Nov 2026: "also in the editor, a mission giver creator. i can select any npc, create their look based on what's available
   for that model, give them a device model (ie V1), a ship, other items (gun, hacking device, etc), place them in the world for a mission"). Developer Tools > NPCs (and the
   Start page) > CREATE A MISSION GIVER makes a NEW character as plain data, no code per character:
     content.characters[id] = {name, role?, model, look?, device?, ship?, items?:[{id, show?}], when?:{mission, step?}}
       id      made from the name (letters, digits and dashes; never one the game already uses)
       name    the owner's words (1 to 40 characters); role: his own short line (80 at most), shown nowhere as lore
       model   any NPC / crowd model the game ships (crowd.js clips); a licensed model only within its licence: recolour and hide accessories, nothing added, no AI tool
       look    the appearance editor's look (npc-looks.js: hide, colour, gear, hair) for this one character only (content.looks is per model, for everyone)
       device  'v1' | 'v2' | 'v3' (npc-device.js tiers: the hologram's colour, how they use it; the V3 // Shadow's eye glows instead) or none
       ship    a ship id of ships.js (data for missions: "their ship"; no new ship scene)
       items   up to 6 of the game's items (the Ward pistol, a hacking device when the game has one, ship modules and gear); show:true puts a cheap prop on them where one
               exists (a holstered pistol on the right hip, a small lit device in the left hand), else the item is data only
       adult   true: "This character is an adult (18+)" (the owner, 19 Nov 2026): only then may they be placed in the adult venues (npc-areas.js: Milked's side street,
               service alley and reception, NULL, the District bar, the VR area, the arcade, the terrace); never on Reverie's or Lace's model
       when    absent: always in the world; {mission}: only while that mission is active; {mission, step}: from that step on, until the mission is done
   WHERE THEY ARE is content.npcs[id] (the same plan as Reverie's and Lace's: one spot, a route, a daily schedule; npc-paths.js), so they are MOVABLE (npc-paths.js setMade):
   the area map's rules apply unchanged (npc-areas.js: never Milked, NULL, the bar, the VR area, the arcade, the terrace, the pod room, the Corporate District or the Temple).
   Voice: content.voices[id] (npc-voices.js) and imported voice files per line, as for anyone. Added animations: content.npcs[id].anims.
   In the game (browser part below): every street quarter and the District interior start their figures with the street pair (ncz-street-pair.js start is wrapped); a
   figure's model is loaded only while the player is in its area, and only while it exists (`when`). A TALK TO <NAME> prompt follows it (action 'made-npc'); missions it gives
   are offered by live-content.js (it wraps every interaction). Published characters are the same for every player (they come with the published content).
   The PURE part (checks, the roster entries, "is she there now") runs in Node: tests/npc-made.test.cjs; the server repeats the checks (void_runner_live_content.py). */
(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports;
 const req=f=>{try{return require(f);}catch{return null;}};
 const NPX=()=>node?require('./npc-paths.js'):root.VoidNPCPaths;
 const NPL=()=>node?require('./npc-looks.js'):root.VoidNPCLooks;
 const CROWD=()=>node?require('./crowd.js'):root.VoidCrowd;
 const AR=()=>node?require('./npc-areas.js'):root.VoidNPCAreas;
 const SHIPS=()=>node?req('./ships.js'):root.VoidShips;
 const PROG=()=>node?req('./progression.js'):root.VoidProgression;
 const CONTENT=()=>node?req('./content.js'):root.VoidContent;
 const COMP=()=>node?req('./vr-companions.js'):root.VoidVRCompanions;
 const ITEMS_REG=()=>node?req('./items.js'):root.VoidItems;   // a future item registry (the hacking device is being added on another branch): read if it exists
 const ACTION='made-npc';
 const SEAT_BACK_STREET=.1;   // seated, a street figure's hips sit ~0.08 m behind its feet (measured in the game, 20 Nov 2026): the origin stays this far in front of a seat's middle
 /* CHARACTERS OF THE GAME DRAWN BY THIS RUNTIME (built in, not made in the editor; never in content.characters): the tea room host (the owner, 20 Nov 2026), an adult East
    Asian man behind the underground tea room's tea station, in a dark work jacket. Model: the old street cook (npc-cook-old, a Meshy street figure of the game, not a
    licensed model), its jacket darkened by a look (npc-looks.js colour, skin kept). His post and actions: npc-paths.js MOVABLE['tea-host'].home; the roster entry and
    TALK prompt: mission-givers.js FACTS (action ACTION). Placeholder name; no lines. */
 const BUILTIN={'tea-host':{name:'Tea Room Host',model:'npc-cook-old',look:{colour:{'*':{tint:'#30343a',sat:.55,bright:.62}}}}};
 const YOUNG=['npc-street-cat'];   // models that read youthful: never marked adult (npc-paths.js YOUNG_MODELS)
 const adultAllowed=asset=>!YOUNG.includes(asset);
 const ID=/^[a-z][a-z0-9-]{1,39}$/,TAGS=/<[^>]*>|[\u0000-\u001f]/;
 const LIMIT={characters:12,name:40,role:80,items:6};
 const KEYS=['name','role','model','adult','look','device','ship','items','when','companionProfile','worldBehavior','relationships','residence'];
 const residenceMinute=s=>typeof s==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(s)?Number(s.slice(0,2))*60+Number(s.slice(3)):null;
 function validShift(s){
  return keysOk(s,['open','breakStart','breakEnd','close','x','z','yaw','greetingCooldown'])&&
   ['open','breakStart','breakEnd','close'].every(k=>Number.isInteger(s[k])&&s[k]>=0&&s[k]<1440)&&
   s.open<s.breakStart&&s.breakStart<s.breakEnd&&(s.close<s.open||s.close>s.breakEnd)&&
   ['x','z','yaw','greetingCooldown'].every(k=>Number.isFinite(s[k]))&&Math.abs(s.x)<=512&&Math.abs(s.z)<=512&&
   Math.abs(s.yaw)<=Math.PI*2&&s.greetingCooldown>=1&&s.greetingCooldown<=3600;
 }
 function validResidence(r){return keysOk(r,['door','slot','mode','from','to','streetAccess','apartmentAccess','visitMinutes','vendorShift'])&&(r.vendorShift===undefined||validShift(r.vendorShift))&&(r.visitMinutes===undefined||(Number.isInteger(r.visitMinutes)&&r.visitMinutes>=1&&r.visitMinutes<=10))&&typeof r.door==='string'&&r.door.length<=100&&Number.isInteger(r.slot)&&r.slot>=0&&r.slot<10&&['always','schedule'].includes(r.mode)&&residenceMinute(r.from)!=null&&residenceMinute(r.to)!=null&&(r.mode==='always'||r.from!==r.to)&&[r.streetAccess,r.apartmentAccess].every(a=>(node?req('./apartments.js'):root.VoidApartments)?.validAccess(a)??a==null);}
 function residenceAtHome(r,minute){if(!validResidence(r))return false;if(r.mode==='always')return true;if(!Number.isFinite(minute))return false;const a=residenceMinute(r.from),b=residenceMinute(r.to);return a<b?minute>=a&&minute<b:minute>=a||minute<b;}
 const REL_TYPES=['friend','coworker','partner','rival','acquaintance'];
 function validRelationships(a){return Array.isArray(a)&&a.length<=8&&new Set(a.map(r=>r?.target)).size===a.length&&a.every(r=>keysOk(r,['target','type','affection','distance','activity','lines'])&&(r.target==='player'||ID.test(r.target||''))&&REL_TYPES.includes(r.type)&&typeof r.affection==='number'&&Number.isFinite(r.affection)&&r.affection>=0&&r.affection<=1&&typeof r.distance==='number'&&r.distance>=1&&r.distance<=8&&['greet','approach','seat'].includes(r.activity)&&Array.isArray(r.lines)&&r.lines.length<=10&&r.lines.every(t=>plain(t,500)&&!/[<>]/.test(t)));}
 function selectRelationship(a,origin,locate,self){if(!validRelationships(a))return null;return a.map(r=>({r,w:r.target!==self?locate(r.target):null})).filter(x=>x.w&&Number.isFinite(x.w.x+x.w.z)&&Math.hypot(x.w.x-origin.x,x.w.z-origin.z)<=x.r.distance).sort((a,b)=>Math.hypot(a.w.x-origin.x,a.w.z-origin.z)-Math.hypot(b.w.x-origin.x,b.w.z-origin.z))[0]||null;}
 const WORLD_DEFAULT={trigger:'interact',distance:3,activity:'greet',room:'auto'};
 function validWorldBehavior(b){return keysOk(b,['trigger','distance','activity','room'])&&['interact','near'].includes(b.trigger)&&typeof b.distance==='number'&&Number.isFinite(b.distance)&&b.distance>=1&&b.distance<=8&&['greet','approach','seat'].includes(b.activity)&&['auto','tea','sleeping','apartment','container','office','custom'].includes(b.room);}
 function nearbySeat(seats,origin,allowed){return seats.filter(s=>s&&Number.isFinite(s.x+s.z)&&allowed(s)).sort((a,b)=>Math.hypot(a.x-origin.x,a.z-origin.z)-Math.hypot(b.x-origin.x,b.z-origin.z))[0]||null;}
 function proximityActive(b,d,was=false){return validWorldBehavior(b)&&b.trigger==='near'&&Number.isFinite(d)&&d<=b.distance+(was?.75:0);}
 const PROFILE_RANGES={initiative:[0,1],flirtatiousness:[0,1],approachFrequency:[0,1],attention:[0,1],personalSpace:[.7,2],walkSpeed:[.5,1.6],remarkCooldown:[10,120]};
 const PROFILE_POOLS='greet chat compliment flirt sit dance hands kiss kissAfter notYet notNow relax bye approach window joinSofa inviteSit inviteDance inviteRecline accepted declined welcomeBack aside comeHere recline'.split(' ');
 function validProfile(p){return keysOk(p,['about','personality','dialogue'])&&typeof p.about==='string'&&p.about.length<=600&&!/[<>\u0000-\u001f]/.test(p.about)&&keysOk(p.personality,Object.keys(PROFILE_RANGES))&&Object.entries(p.personality).every(([k,v])=>typeof v==='number'&&Number.isFinite(v)&&v>=PROFILE_RANGES[k][0]&&v<=PROFILE_RANGES[k][1])&&keysOk(p.dialogue,PROFILE_POOLS)&&Object.values(p.dialogue).every(a=>Array.isArray(a)&&a.length<=20&&a.every(t=>plain(t,500)&&!/[<>]/.test(t)));}
 function conversationLines(c,rnd=Math.random){const p=c?.companionProfile;if(!validProfile(p))return ['…'];const d=p.dialogue,settings=p.personality,pick=a=>a?.length?a[Math.min(a.length-1,Math.floor(rnd()*a.length))]:null;const greeting=pick(d.greet)||pick(d.welcomeBack),chat=pick(d.chat)||pick(d.aside),extra=rnd()<(settings.initiative??.5)?chat:null;return [...new Set([greeting,extra||(!greeting?chat:null)].filter(Boolean))].length?[...new Set([greeting,extra||(!greeting?chat:null)].filter(Boolean))]:['…'];}
 const DEVICES={v1:{name:'V1',help:'The everyday device: a teal hologram in front of the face, photos with a small frame in the hand.'},
  v2:{name:'V2',help:'Like the V1 in a different colour (a placeholder colour until the V2 has its own look).'},
  v3:{name:'V3 // SHADOW',help:'Streamed into the left eye: no hologram, the eye glows a little while they use it. They never take selfies or film.'}};
 // Items that can be SEEN on a figure, and how (a cheap prop built in code, attached to the figure's own bones).
 const SHOW={'ward-pistol':'hip','hacking-device':'hand'},SHOW_TEXT={hip:'on the right hip (a holstered pistol)',hand:'in the left hand (a small lit device)'};
 const keysOk=(o,allowed)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).every(k=>allowed.includes(k));
 const plain=(v,max)=>typeof v==='string'&&v.trim().length>0&&v.length<=max&&!TAGS.test(v);
 /* The id a name gives: lower case, dashes for spaces and punctuation; never one in `taken` (a number is added). */
 function slug(name){return String(name||'').normalize('NFKD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').replace(/^[^a-z]+/,'').slice(0,34).replace(/-+$/,'');}
 function idFor(name,taken=new Set()){const has=x=>taken instanceof Set?taken.has(x):!!(taken&&taken[x]);let b=slug(name);if(b.length<2)b='giver';let id=b,n=2;while(has(id)){id=b+'-'+n;n++;}return id;}
 /* Every model a giver can be made from: the game's NPC and crowd files that can stand (an idle clip). The street cat is moved by its own code, so it is not offered. */
 const LICENSED=()=>(NPL()&&NPL().LICENSED)||/^(vr-companion-.+|studio-warrior|npc-dax|npc-upload-[0-9a-f]{32})$/;
 const pretty=a=>a.replace(/^npc-|^vr-/,'').replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
 function models(){const C=CROWD()||{},clips=C.clips||{},street=C.street||{},out=[];
  for(const [asset,list] of Object.entries(clips)){if(asset==='npc-street-cat'||asset.startsWith('local-model-')||!Array.isArray(list)||!list.includes('idle'))continue;const lic=LICENSED().test(asset);
   out.push({asset,label:C.prepared?.find(p=>p.asset===asset)?.name||pretty(asset),licensed:lic,clips:list.slice(),walk:list.includes('walk'),group:lic?'licensed':street[asset]?'street':/^npc-/.test(asset)?'named':'older'});}
  const rank={street:0,named:1,older:2,licensed:3};return out.sort((a,b)=>rank[a.group]-rank[b.group]||a.asset.localeCompare(b.asset));}
 const GROUPS={street:'Street people',named:'Named characters’ models',older:'Older figures (off-world places)',licensed:'Licensed models (recolour and hide only, never any AI tool)'};
 const modelOf=a=>models().find(m=>m.asset===a)||null;
 /* The file the game loads for a model: a licensed one ships scrambled (.vrpak) where its licence asks for it (vr-companions.js says which). */
 function teaResident(asset){const duo=node?req('./tea-duo.js'):root.VoidTeaDuo;return Object.values(duo?.PEOPLE||{}).find(p=>p.model===asset);}
 function fileOf(asset){if(/^npc-upload-[a-f0-9]{32}$/.test(asset)||CROWD()?.prepared?.some(p=>p.asset===asset))return 'assets/models/crowd/'+asset+'.vrpak';const tea=teaResident(asset);if(tea)return tea.file;const C=COMP();const e=C&&C.list?C.list().find(x=>x&&x.model===asset&&x.file):null;if(e)return 'assets/models/crowd/'+e.file;if(/^(studio-warrior|npc-dax)$/.test(asset))return 'assets/models/crowd/'+asset+'.vrpak';return 'assets/models/crowd/'+asset+'.glb';}
 /* Every item a giver can carry: personal gear, a hacking device when the game has one, ship modules and ship gear. show: how it is seen on them, or null (data only). */
 function items(){const out=new Map(),add=(id,name,kind)=>{if(typeof id==='string'&&/^[a-z][a-z0-9-]{0,40}$/.test(id)&&!out.has(id))out.set(id,{id,name:String(name||id),kind,show:SHOW[id]||null});};
  add('ward-pistol','Ward pistol (gun)','weapon');add('red-dot','Red-dot sight (pistol optic)','weapon part');
  const R=ITEMS_REG();if(R){const src=R.items||R.ITEMS||R.catalog||R;const list=Array.isArray(src)?src:Object.entries(src).map(([id,v])=>({id,...(v&&typeof v==='object'?v:{})}));for(const x of list)if(x&&typeof x==='object')add(x.id,x.name||x.label,x.kind||'item');}
  for(const [id,it] of Object.entries((PROG()&&PROG().personalItems)||{}))add(id,it.name,'carried item');   // progression.js personalItems: the Ward kit and the reserved hacking device (apartments, 19 Nov 2026)
  for(const [id,m] of Object.entries((PROG()&&PROG().modules)||{}))add(id,m.name,'ship module');
  const Ct=CONTENT();for(const [id,g] of Object.entries(Object.assign({},(Ct&&Ct.gear)||{},(Ct&&Ct.creditGear)||{})))add(id,g.name,'ship gear');
  return [...out.values()];}
 const ships=()=>Object.values((SHIPS()&&SHIPS().ships)||{}).map(s=>({id:s.id,name:s.name,premium:!!s.premium}));
 /* A character as it is stored and sent: known fields only, trimmed. */
 function clean(c){if(!c||typeof c!=='object')return null;const x={name:String(c.name||'').trim().slice(0,LIMIT.name),model:String(c.model||'')};if(typeof c.role==='string'&&c.role.trim())x.role=c.role.trim().slice(0,LIMIT.role);
  if(c.look&&typeof c.look==='object'){const l={};if(Array.isArray(c.look.hide)&&c.look.hide.length)l.hide=c.look.hide.slice();if(c.look.colour&&Object.keys(c.look.colour).length)l.colour=JSON.parse(JSON.stringify(c.look.colour));if(Array.isArray(c.look.gear)&&c.look.gear.length)l.gear=c.look.gear.slice();if(c.look.hair)l.hair=c.look.hair;if(Object.keys(l).length)x.look=l;}
  if(c.adult===true&&!YOUNG.includes(x.model))x.adult=true;if(DEVICES[c.device])x.device=c.device;if(typeof c.ship==='string'&&c.ship)x.ship=c.ship;
  if(Array.isArray(c.items)&&c.items.length)x.items=c.items.filter(i=>i&&typeof i.id==='string').slice(0,LIMIT.items).map(i=>i.show===true&&SHOW[i.id]?{id:i.id,show:true}:{id:i.id});
  if(c.when&&typeof c.when==='object'&&typeof c.when.mission==='string'&&c.when.mission)x.when=c.when.step?{mission:c.when.mission,step:String(c.when.step)}:{mission:c.when.mission};
  if(validProfile(c.companionProfile))x.companionProfile=JSON.parse(JSON.stringify(c.companionProfile));if(validWorldBehavior(c.worldBehavior))x.worldBehavior={...c.worldBehavior};if(validRelationships(c.relationships))x.relationships=JSON.parse(JSON.stringify(c.relationships));if(validResidence(c.residence))x.residence={...c.residence};return x;}
 /* Where a character stands all day (her plan without the schedule), or null. */
 function basePlan(p){if(!p||typeof p!=='object')return null;const {schedule,...rest}=p;return rest.mode==='stay'||rest.mode==='path'?rest:null;}
 /* The area she is placed in (npc-areas.js), from her plan: the all-day spot or route, else her first time block with a place. */
 function areaOf(p){const A=AR();if(!A||!p)return null;const at=q=>q&&q.mode==='stay'?A.areaOf(q):q&&q.mode==='path'&&q.points&&q.points[0]?A.areaOf(q.points[0]):null;const b=basePlan(p);if(b)return at(b);for(const x of (p&&p.schedule)||[]){const a=at(x);if(a)return a;}return null;}
 const usesPath=p=>!!p&&(p.mode==='path'||(Array.isArray(p.schedule)&&p.schedule.some(b=>b&&b.mode==='path')));
 /* content.characters -> problems in plain words (empty: fine). ctx: {npcs: content.npcs, missions: Map(id -> [step ids]) of the trees in force, reserved: Set of ids the game
    already uses, givesOffer: Map(mission id -> giver) for missions offered in person}. */
 function problems(chars,ctx={}){if(chars==null)return [];if(!chars||typeof chars!=='object'||Array.isArray(chars)||Object.keys(chars).length>LIMIT.characters)return ['Made characters have an unknown shape ('+LIMIT.characters+' at most).'];
  const out=[],ms=new Map(models().map(m=>[m.asset,m])),it=new Map(items().map(i=>[i.id,i])),sh=new Set(ships().map(s=>s.id)),npcs=ctx.npcs||{};
  for(const [id,c] of Object.entries(chars)){const w=(c&&typeof c.name==='string'&&c.name.trim()?c.name.trim().slice(0,40):id)+': ';
   if(!ID.test(id)){out.push(w+'the id must be 2 to 40 lower-case letters, digits or dashes, starting with a letter.');continue;}
   if(ctx.reserved&&ctx.reserved.has(id)){out.push(w+'the id “'+id+'” is already used by a character of the game: give a different name.');continue;}
   if(!keysOk(c,KEYS)){out.push(w+'unknown fields.');continue;}
   if(!plain(c.name,LIMIT.name))out.push(w+'a name is needed (plain words, '+LIMIT.name+' characters at most).');
   if(c.role!=null&&!plain(c.role,LIMIT.role))out.push(w+'the short role line must be plain words ('+LIMIT.role+' characters at most).');
   if(c.companionProfile!=null&&!validProfile(c.companionProfile))out.push(w+'invalid transferred companion personality or dialogue.');
   if(c.worldBehavior!=null&&!validWorldBehavior(c.worldBehavior))out.push(w+'invalid companion behavior trigger.');
   if(c.relationships!=null&&(!validRelationships(c.relationships)||c.relationships.some(r=>r.target===id)))out.push(w+'invalid relationship target or settings.');
   if(c.residence!=null&&!validResidence(c.residence))out.push(w+'invalid residence settings.');
   const m=ms.get(c.model);if(!m){out.push(w+'choose the model they are made from (one of the game’s NPC models).');continue;}
   if(c.adult!=null&&c.adult!==true)out.push(w+'“adult (18+)” is either ticked or left out.');else if(c.adult===true&&!adultAllowed(c.model))out.push(w+'this model reads youthful (Reverie’s and Lace’s models): it can never be marked adult.');
   if(c.look!=null){const L=NPL();if(!keysOk(c.look,['hide','colour','gear','hair']))out.push(w+'the look has unknown fields.');else if(L)for(const p of L.entryProblems(c.model,{looks:[{id:'own',name:'own look',...c.look}],use:'own'},ctx.lookInventory&&ctx.lookInventory[c.model]))out.push(w+p.replace(/^[^:]+: look “own look”: /,'look: '));}
   if(c.device!=null&&!DEVICES[c.device])out.push(w+'the device must be V1, V2, V3 or none.');
   if(c.ship!=null&&!sh.has(c.ship))out.push(w+'“'+c.ship+'” is not a ship of the game.');
   if(c.items!=null){if(!Array.isArray(c.items)||c.items.length>LIMIT.items)out.push(w+'items: '+LIMIT.items+' at most.');else{const seen=new Set();for(const i of c.items){if(!keysOk(i,['id','show'])||typeof i.id!=='string'){out.push(w+'an item has an unknown shape.');continue;}
     if(!it.has(i.id))out.push(w+'“'+i.id+'” is not an item of the game.');else if(i.show!=null&&(i.show!==true||!SHOW[i.id]))out.push(w+'“'+it.get(i.id).name+'” cannot be shown on them (data only).');if(seen.has(i.id))out.push(w+'“'+i.id+'” is listed twice.');seen.add(i.id);}}}
   if(c.when!=null){const x=c.when;if(!keysOk(x,['mission','step'])||typeof x.mission!=='string')out.push(w+'“when they are there” has an unknown shape.');
    else if(ctx.missions&&!ctx.missions.has(x.mission))out.push(w+'they are there only during a mission that is not in your missions (“'+x.mission+'”).');
    else if(x.step!=null&&(typeof x.step!=='string'||(ctx.missions&&!(ctx.missions.get(x.mission)||[]).includes(x.step))))out.push(w+'the step they appear from is not a step of that mission.');
    else if(ctx.givesOffer&&ctx.givesOffer.get(x.mission)===id)out.push(w+'they appear only while that mission is active, so they cannot be the one who offers it: choose “always”, or another giver.');}
   const p=npcs[id],home=validResidence(c.residence)&&c.residence.mode==='always';if(!home&&(!p||!(basePlan(p)||(Array.isArray(p.schedule)&&p.schedule.some(b=>b&&(b.mode==='stay'||b.mode==='path'))))))out.push(w+'put them somewhere in the world (Where they are: a spot or a route).');
   else if(!home&&!basePlan(p))out.push(w+'outside their time blocks they need a place too: keep them at a spot or give them a route for the rest of the day.');
   if(p&&!m.walk&&usesPath(p))out.push(w+'this model has no walking animation: keep them at one spot.');}
  return out;}
 /* Roster entries (mission-givers.js roster) for made characters: a TALK prompt that follows the figure, in the District game, reachable by players. npcs: content.npcs. */
 function giverFacts(chars,npcs){const out={};for(const [id,c] of Object.entries(chars||{})){if(!ID.test(id)||!c||typeof c!=='object')continue;const A=AR(),a=areaOf((npcs||{})[id]),an=a&&A&&A.get(a)?A.get(a).name:null;
  out[id]={name:typeof c.name==='string'&&c.name.trim()?c.name.trim():id,group:'district',say:id,made:true,role:typeof c.role==='string'?c.role:'',model:c.model,
   where:'Made in Developer Tools > NPCs'+(an?': '+an:' (not placed yet)')+' (npc-made.js: TALK TO '+String(c.name||id).toUpperCase()+').',targets:[{action:ACTION,character:id}],layout:null,enter:a&&A?A.enter(a):{walk:'sacramento',quarter:'avenue'},players:true,draft:true,
   note:'Made in the editor'+(c.when?': in the world only while '+(c.when.step?'step “'+c.when.step+'” of ':'')+'mission “'+c.when.mission+'” is in progress.':'.')};}return out;}
 /* Is she in the world now? s: the campaign state; trees: the trees in force (for a "from this step" rule). */
 function exists(c,s,trees){const w=c&&c.when;if(!w)return true;const r=s&&s.universe&&s.universe.missions&&s.universe.missions[w.mission];if(!r||!r.acquired||r.completed)return false;if(!w.step)return true;
  let m=null;for(const t of trees||[])for(const x of (t&&t.missions)||[])if(x&&x.id===w.mission)m=x;if(!m)return true;const k=(m.objectives||[]).findIndex(o=>o&&o.id===w.step);if(k<0)return true;
  return (m.objectives||[]).slice(0,k).every(o=>r.objectives&&r.objectives[o.id]===true);}
 /* For the admin inventory (the server's copy): every model with what a made character on it may do (npc-paths.js / npc-gestures.js / npc-escort.js, worked out once per model). */
 function inventory(only=null){const X=NPX(),out={limits:LIMIT,devices:Object.keys(DEVICES),items:Object.fromEntries(items().map(i=>[i.id,{name:i.name,show:i.show}])),ships:ships().map(s=>s.id),models:{}};
  const NG=req('./npc-gestures.js'),E=req('./npc-escort.js'),before=X.madeNow();
  // Store each donor's identical clip list once across the model inventory.
  out.animationLists=[];const listIndices=new Map();
  function motionLists(ids){
   const groups=new Map();for(const id of ids){const key=id.includes('/')?id.split('/')[0]:id.split('-')[0];if(!groups.has(key))groups.set(key,[]);groups.get(key).push(id);}
   return [...groups.values()].map(list=>{const key=JSON.stringify(list);if(!listIndices.has(key)){listIndices.set(key,out.animationLists.length);out.animationLists.push(list);}return listIndices.get(key);});
  }
  const K='made-model-check',one=(m,adult)=>{X.setMade({[K]:{name:'Made',model:m.asset,...(adult?{adult:true}:{})}});const mv=X.inventory().movable[K];
   return {movable:mv?{actions:mv.actions,animationLists:motionLists(mv.anims),pathOnly:mv.pathOnly}:null,gestures:NG?((NG.inventory([K])[K]||{clips:[]}).clips):[],escort:E?((E.inventory().npcs||{})[K]||null):null};};
  for(const m of models()){if(only&&!only.has(m.asset))continue;const a=one(m,false);out.models[m.asset]={licensed:m.licensed,walk:m.walk,adultOk:adultAllowed(m.asset),...a,...(adultAllowed(m.asset)?{adult:one(m,true)}:{})};}
  X.setMade(before);return out;}
 function deletionReferences(draft,id){
  const uses=value=>value===id||!!value&&typeof value==='object'&&Object.values(value).some(uses);
  const refs=(draft.trees||[]).filter(uses).map(tree=>tree.name||tree.id);
  for(const [other,record] of Object.entries(draft.interactions||{}))
   if(other!==id&&record.advanced?.group?.members?.includes(id))refs.push('interaction with '+other);
  for(const [other,record] of Object.entries(draft.characters||{}))
   if(other!==id&&record.relationships?.some(r=>r.target===id))refs.push('relationship with '+(record.name||other));
  for(const [mission,record] of Object.entries(draft.missions||{}))if(uses(record))refs.push(mission);
  return refs;
 }
 function deleteCharacter(draft,id){
  if(!Object.hasOwn(draft.characters||{},id)||deletionReferences(draft,id).length)return false;
  for(const key of ['characters','npcs','voices','names','interactions'])if(draft[key])delete draft[key][id];
  if(draft.animRequests)draft.animRequests=draft.animRequests.filter(r=>r.npc!==id);
  for(const [key,clip] of Object.entries(draft.clips||{}))if(clip?.who===id)delete draft.clips[key];
  return true;
 }
 const api={deletionReferences,deleteCharacter,BUILTIN,YOUNG,adultAllowed,ACTION,ID,LIMIT,KEYS,DEVICES,SHOW,SHOW_TEXT,GROUPS,slug,idFor,models,modelOf,fileOf,teaResident,items,ships,clean,validProfile,conversationLines,WORLD_DEFAULT,validWorldBehavior,validRelationships,validShift,validResidence,residenceAtHome,selectRelationship,nearbySeat,proximityActive,basePlan,areaOf,usesPath,problems,giverFacts,exists,inventory};
 if(node){module.exports=api;return;}

 // ================================================================= browser: the figures in the game
 const env=()=>(root.VoidLiveContent&&root.VoidLiveContent.env)||null;
 const chars=()=>{const own=(env()&&env().characters)||{},out={...BUILTIN};for(const [id,c] of Object.entries(own))if(!BUILTIN[id])out[id]=c;return out;};   // the built-in ones first (an editor character never takes their id)
 const plansAll=()=>{try{return (root.VoidLiveContent&&root.VoidLiveContent.plans&&root.VoidLiveContent.plans())||{};}catch{return {};}};
 /* What she does now: the plan live-content.js works out (a mission's "waits at", a follow / lead step, her daily schedule), else her all-day spot or route. */
 let visitDoor=null,visitPaths=null;
 let patchAddress='',patchPaths=null;
 function outingMinute(){
  const shared=root.VoidRemotePlayers?.serverNow?.();
  return Number.isFinite(shared)?shared*root.VoidClock.RATE/60000:root.VoidLiveContent?.campaignMinute?.();
 }
 function residentOuting(id,c){
  if(env()?.npcPlans?.[id])return null;
  if(id==='tacta')return tactaOuting(c);
  const life=root.VoidDistrictLife,home=c?.residence;
  if(id!=='patch'||c?.model!=='npc-patch'||!home?.door||!life||!root.VoidApartments||!root.VoidCrosswalks||!root.VoidNPCEscort)return null;
  const shift={...life.PATCH_SHIFT,...home.vendorShift},address=[home.door,home.slot,shift.x,shift.z].join('|');
  if(address!==patchAddress){
   patchPaths=life.patchRoute(root.VoidApartments.door(home.door),shift,root.VoidNPCEscort,root.VoidApartments,root.VoidCrosswalks,home.slot);
   patchAddress=address;
  }
  return life.patchAt(outingMinute(),patchPaths,shift,root.VoidClock.RATE);
 }
 function tactaOuting(c){
  const life=root.VoidDistrictLife,home=c?.residence;
  if(c?.model!=='npc-tacta'||home?.mode!=='always'||!home.door||!life||!root.VoidNPCEscort||!root.VoidCrosswalks||!root.VoidNeoChinatown||!root.VoidApartments)return null;
  const minute=outingMinute();
  if(!Number.isFinite(minute))return null;
  const address=home.door+'|'+home.slot;
  if(address!==visitDoor){
   visitPaths=life.tactaRoute(root.VoidApartments.door(home.door),root.VoidNeoChinatown,root.VoidCrosswalks,root.VoidNPCEscort,root.VoidApartments,home.slot);
   visitDoor=address;
  }
  if(!visitPaths)return null;
  return life.tactaAt(1+Math.floor(minute/1440),minute%1440,visitPaths,root.VoidClock.RATE,home.visitMinutes);
 }
 function planOf(id){const P=plansAll()[id];if(P)return P;
  if(id==='tacta'||id==='patch'){
   const outing=residentOuting(id,env()?.characters?.[id]);
   if(outing){
    const sceneArea=outing.area==='checkpoint'&&typeof walkingLocation!=='undefined'?walkingLocation?.area:outing.area;
    const area=sceneArea==='street'?'oldtown':sceneArea==='interior'?'district':null;
    if(!area)return null;
    return {mode:'stay',area,key:id+'-outing-'+outing.key,x:outing.x,z:outing.z,yaw:outing.yaw,outing};
   }
  }
  const b=basePlan(((env()&&env().npcPlans)||{})[id]);return NPX().planNow(id,{plan:b||null});}   // no plan: a built-in character's post (npc-paths.js homePlan), else nothing
 const areaOfPlan=P=>P?(P.area||(AR()&&AR().areaOf(P.mode==='path'?P.points[0]:P))||null):null;
 function present(id){const c=chars()[id];if(!c)return false;try{return exists(c,typeof state!=='undefined'?state:null,env()&&env().trees);}catch{return true;}}
 function atHome(c){if(c&&['patch','tacta'].some(id=>c===env()?.characters?.[id]&&residentOuting(id,c)))return false;return residenceAtHome(c?.residence,root.VoidClock?.now?.(typeof state!=='undefined'?state:null)?.minuteOfDay);}
 // ---- props: a holstered pistol and a hand-held device, built from boxes (one merged mesh, one shared material each per scene), on the figure's own bones
 function mat(scene,name,hex,glow){const B=root.BABYLON;let m=scene.getMaterialByName(name);if(m)return m;m=new B.PBRMaterial(name,scene);m.albedoColor=B.Color3.FromHexString(hex);m.metallic=.55;m.roughness=.45;if(glow){m.emissiveColor=B.Color3.FromHexString(glow);m.emissiveIntensity=1.4;}return m;}
 function boxes(scene,name,parts){const B=root.BABYLON,ms=parts.map(([w,h,d,x,y,z],i)=>{const b=B.MeshBuilder.CreateBox(name+'-'+i,{width:w,height:h,depth:d},scene);b.position.set(x,y,z);return b;});return B.Mesh.MergeMeshes(ms,true,true);}
 function boneOf(n,b){for(const t of n.getDescendants(false))if(t.name===b||t.name.endsWith(':'+b)||t.name.endsWith('-'+b))return t;return null;}
 /* Put mesh m on bone t so that it sits at world position p, turned with the figure (yaw): the bone's own scale and turn are taken out once. */
 function onBone(m,t,p,yaw){const B=root.BABYLON;t.computeWorldMatrix(true);const want=B.Matrix.Compose(new B.Vector3(1,1,1),B.Quaternion.RotationYawPitchRoll(yaw,0,0),p),inv=t.getWorldMatrix().clone().invert(),loc=want.multiply(inv),s=new B.Vector3(),r=new B.Quaternion(),x=new B.Vector3();loc.decompose(s,r,x);
  m.parent=t;m.scaling.copyFrom(s);m.rotationQuaternion=r;m.position.copyFrom(x);m.isPickable=false;}
 function props(n,c){const out=[],scene=n.getScene(),B=root.BABYLON,yaw=n.rotation.y||0,right=new B.Vector3(-Math.cos(yaw),0,Math.sin(yaw)),fwd=new B.Vector3(Math.sin(yaw),0,Math.cos(yaw));n.computeWorldMatrix(true);
  for(const i of (c.items||[]))if(i.show&&SHOW[i.id]){try{
   if(SHOW[i.id]==='hip'){const h=boneOf(n,'Hips');if(!h)continue;h.computeWorldMatrix(true);const hp=h.getAbsolutePosition();
    const g=boxes(scene,'made-pistol',[[.045,.17,.06,0,0,0],[.05,.05,.17,0,.1,.04],[.03,.06,.05,0,.04,-.04]]);g.material=mat(scene,'made-prop-pistol','#1b1e22');onBone(g,h,hp.add(right.scale(.19)).add(new B.Vector3(0,-.12,0)).add(fwd.scale(.02)),yaw);out.push(g);}
   else{const h=boneOf(n,'LeftHand');if(!h)continue;h.computeWorldMatrix(true);const hp=h.getAbsolutePosition();
    const d=boxes(scene,'made-device',[[.09,.016,.13,0,0,0]]);d.material=mat(scene,'made-prop-device','#15181d');const s=boxes(scene,'made-device-screen',[[.075,.004,.1,0,.01,0]]);s.material=mat(scene,'made-prop-screen','#0a2a33','#39d0ff');
    const at=hp.add(fwd.scale(.06)).add(new B.Vector3(0,-.02,0));onBone(d,h,at,yaw);onBone(s,h,at,yaw);out.push(d,s);}}catch(e){try{console.warn('[VOID//RUNNER made givers] prop',e&&e.message||e);}catch{}}}
  return out;}
 // ---- one scene's figures (every street quarter and the District interior)
 function start({B=root.BABYLON,scene,parent,quality='medium',where={scene:'street',quarter:'avenue'}}={}){
  const A=root.VoidAssets,SP=root.VoidStreetPair,Ar=AR(),HERE=new Set(Ar?Ar.here(where.scene||'street',where.quarter||null):[]),cfg=SP&&SP.config;if(!A||!SP||!cfg||!scene)return null;
  const shift=Ar?.SCENE_SHIFT?.[where.scene]||null,scenePlan=P=>{if(!shift||!P)return P;const u=q=>q&&Number.isFinite(q.x)?{...q,x:q.x-shift.x,z:q.z-shift.z}:q;if(P.mode==='stay')return u(P);if(P.mode==='path')return {...P,points:(P.points||[]).map(u)};if(P.mode==='escort')return {...P,to:u(P.to),from:u(P.from),resume:u(P.resume),final:u(P.final)};return P;};
  const people=new Map(),asked=new Map(),items=new Map(),away=new Set(),rnd=Math.random;let clock=0,scan=0,disposed=false;
  const wl=()=>typeof walkingLocation!=='undefined'?walkingLocation:null,me=()=>typeof walker!=='undefined'?walker:null;
  const yAt=(x,z,last)=>{try{const s=root.VoidBackAlleys?.groundAt?.(x,z);if((where.scene||'street')==='street'&&Number.isFinite(s)&&s<0)return s;}catch{}const g=Ar?Ar.groundY({x,z}):null;return Number.isFinite(g)?g:Number.isFinite(last)?last:.18;};   // on the stairs to the tunnels: the steps' height
  const animRadius=quality==='low'?cfg.lowAnimRadius:cfg.animRadius;
  const has=m=>!!A.container?.('crowd:'+m);
  function ask(m){const t=asked.get(m);if(t!=null&&clock<t)return;asked.set(m,clock+20);Promise.resolve(A.load('crowd:'+m,{src:fileOf(m),background:true},scene)).catch(e=>{try{console.info('[VOID//RUNNER made givers] '+m+' is not on this machine ('+(e&&e.message||e)+').');}catch{}});}
  function itemFor(id,c){let it=items.get(id);if(!it){it={id:'made-'+id,action:ACTION,character:id,label:'TALK TO '+String(c.name||id).toUpperCase(),position:[0,1.6,0],range:2.2,talk:true};items.set(id,it);}it.label='TALK TO '+String(c.name||id).toUpperCase();return it;}
  function leave(id){const p=people.get(id);if(!p)return;people.delete(id);const L=wl(),it=items.get(id);if(L&&Array.isArray(L.interactions)&&it){const k=L.interactions.indexOf(it);if(k>=0)L.interactions.splice(k,1);}try{p.anim?.dispose?.();}catch{}for(const x of p.props)try{x.dispose();}catch{}try{p.node.dispose();}catch{}}
  function arrive(id,c,P){P=scenePlan(P);const n=A.instance?.('crowd:'+c.model,parent);if(!n)return;n.metadata={...n.metadata,character:id,made:id,displayName:c.name};
   for(const m of n.getChildMeshes(false)){m.isPickable=false;if(m.material&&m.material.maxSimultaneousLights<8)m.material.maxSimultaneousLights=8;}
   // a follow / lead step: where it had got to (a reload), else where she stood when it started (P.from, live-content.js; fix 19 Nov 2026: she appeared at 0, 0)
   const ok=q=>q&&Number.isFinite(q.x)&&Number.isFinite(q.z)?q:null,t=P&&(P.mode==='stay'?P:P.mode==='path'?P.points[0]:P.mode==='escort'?ok(P.resume)||ok(P.from)||ok(P.to):null)||{x:0,z:0};
   const s={who:id,mode:'plan-go',x:t.x,z:t.z,dir:1,left:0,step:null,yaw:Number.isFinite(P&&P.yaw)?P.yaw:0,clip:'idle',once:false,device:null,face:null,sub:null,seatBack:SEAT_BACK_STREET};
   const p={id,c,node:n,s,anim:null,clip:null,y:yAt(t.x,t.z),props:[],esc:null,key:P?P.key:null};people.set(id,p);n.position.set(s.x,p.y,s.z);n.rotation.y=s.yaw;
   if(id==='tacta'||id==='patch')root.VoidTeaDuo?.attachGaze(n,()=>{
    const camera=scene.activeCamera?.globalPosition;
    if(!camera||Math.hypot(camera.x-n.position.x,camera.z-n.position.z)>(id==='patch'?1.22:12))return null;
    if(p.s.mode==='walk')return null;
    if(p.plan?.outing?.phase==='visit'&&chatting()!==id){
     const holder=scene.getTransformNodeByName('npc-iris');
     if(holder){const q=holder.getAbsolutePosition();return {x:q.x,y:q.y+1.57,z:q.z};}
    }
    return camera;
   });
   p.anim=root.VoidCrowd?.animate?.(n,c.model,'idle')||null;p.clip='idle';for(const g of n.metadata?.animationGroups||[])g.blendingSpeed=cfg.blend;
   try{NPL()?.applyLook?.(n,c.model,c.look?{id:'made-'+id,name:c.name,...c.look}:null,{scene});}catch{}   // her own look (or the model as made), never the model's crowd look
   {const an=((env()&&env().npcPlans)||{})[id]?.anims||[];if(an.length&&NPX()?.applyAnims)NPX().applyAnims(n,c.model,an).catch(()=>{});}
   if(DEVICES[c.device])try{root.VoidNPCDevice?.enlist?.(n,{kind:'walker',tier:c.device,state:()=>({moving:p.s.mode==='plan-go'||p.s.mode==='esc',can:p.s.sub!=='chat'}),force:()=>p.node===n?p.s.device:null});}catch{}
   setTimeout(()=>{if(!n.isDisposed())p.props=props(n,c);},0);}
  // talking to her: a conversation opened from her prompt (latched until it closes)
  const convo=()=>!!root.VoidConversationUI?.isOpen||(typeof mode!=='undefined'&&mode==='dialogue');let chatSeen=false,chatWho=null;
  // (fix 19 Nov 2026) else the made character whose lines the conversation has: walkTarget is picked again every frame while a conversation floats over walking
  const speaker=()=>{try{if(typeof speech==='undefined'||!speech||!Array.isArray(speech.lines))return null;const cs=chars();const l=speech.lines.find(x=>x&&cs[x.who]);return l?l.who:null;}catch{return null;}};
  function chatting(){if(!convo()){chatSeen=false;chatWho=null;return null;}if(!chatSeen){chatSeen=true;const t=typeof walkTarget!=='undefined'?walkTarget:null;chatWho=t&&t.action===ACTION?t.character:speaker();}return chatWho;}
  // a follow / lead step (npc-escort.js; cab rides are only Reverie's and Lace's)
  /* the player's street taxi (road-taxi.js), as ncz-street-pair.js reads it: a follow / lead step's person rides along (20 Nov 2026) */
  function taxiJob(){const T=root.VoidRoadTaxi,R=root.VoidRoadTaxiRules,j=T&&T.world&&T.world.job;if(!j||j.released||!j.cab)return null;const did=j.dest&&j.dest.id;return {id:j.cab.id+':'+did,phase:j.cab.phase,dest:did,far:!!(root.VoidQuarters?.FAR||[]).some(f=>f.id===did),released:false,cab:{x:j.cab.x,z:j.cab.z,yaw:j.cab.yaw},doors:R?R.doorPoints(j.cab):[]};}
  function escTick(p,P,dt){const E=root.VoidNPCEscort;if(!E)return 'idle';let e=p.esc;
   if(!e||e.key!==P.key){e=p.esc={key:P.key,st:{x:p.s.x,z:p.s.z,yaw:p.s.yaw||0,phase:null},trail:{pts:[],shifted:0},cab:null};const r=P.resume;if(r&&Number.isFinite(r.x)&&Number.isFinite(r.z)){e.st.x=r.x;e.st.z=r.z;if(Number.isFinite(r.yaw))e.st.yaw=r.yaw;}if(r&&P.kind==='follow-them'&&['walk','wait','paused','there'].includes(r.phase))e.st.phase=r.phase==='walk'?'wait':r.phase;if(r&&r.unarmed)e.st.unarmed=true;if(r&&r.ride==='in-cab')e.st.ride='in-cab';}
   const w=me(),mp=w&&Number.isFinite(w.x+w.z)?{x:w.x,z:w.z}:null,md=typeof mode!=='undefined'?mode:'',walking=md==='walking',riding=md==='road-taxi';if(walking&&mp)E.trailPush(e.trail,mp);
   const crossing=!!root.VoidRoadTaxi?.crossing||md==='preparing',job=taxiJob(),tellE=(ev,x)=>{try{root.VoidStreetPair?.onEscort?.({npc:p.id,key:P.key,step:P.step,kind:P.kind,event:ev,phase:e.st.phase,x:e.st.x,z:e.st.z,...(x||{})});}catch{}};
   // her taxi ride with the player (npc-escort.js rideAlong): seated in the companion's seat (the model's sit clip, else out of sight behind the tinted glass)
   const rr=E.rideAlong?E.rideAlong(e.st,{me:mp,job,riding,dt,set:P.set,crossing,can:true}):{busy:false,ev:null};if(rr.busy&&job&&e.st.ride==='in-cab')e.cab=job.cab;
   if(rr.ev==='ride-out'||rr.ev==='ride-left'){e.trail.pts.length=0;e.trail.shifted=0;const R=root.VoidRoadTaxiRules,c=e.cab;if(c&&R){const ds=R.doorPoints(c),pick=ds.filter(q=>{try{return !root.VoidExplorer?.blocked?.(q.x,q.z,wl());}catch{return true;}}).sort((a,b)=>mp?Math.hypot(b.x-mp.x,b.z-mp.z)-Math.hypot(a.x-mp.x,a.z-mp.z):0)[0]||ds[2];if(pick){
     const landing=P.social&&P.area?root.VoidNPCAreas?.nearest(pick,P.area,12):null;
     e.st.x=landing?.x??pick.x;e.st.z=landing?.z??pick.z;e.st.yaw=c.yaw||0;
    }}e.cab=null;}
   if(rr.ev)tellE(rr.ev,{ride:e.st.ride||null});
   if(e.st.ride==='in-cab'){p.seat=e.cab&&root.VoidRoadTaxiRules?.companionSeat?root.VoidRoadTaxiRules.companionSeat(e.cab):null;if(p.seat){e.st.x=p.seat.x;e.st.z=p.seat.z;e.st.yaw=p.seat.yaw;}p.s.x=e.st.x;p.s.z=e.st.z;p.s.yaw=e.st.yaw;return 'sit';}
   p.seat=null;if(e.st.ride==='to-cab'){p.s.x=e.st.x;p.s.z=e.st.z;p.s.yaw=e.st.yaw;return e.st.clip||'walk';}
   const inp={area:P.area||'avenue',me:riding?null:mp,to:P.to||null,door:P.door||null,noDone:!!P.via,social:!!P.social,set:P.set,dt,cat:false,trail:e.trail,seen:true,kind:P.kind,walking};
   const ev=P.kind==='follow-them'?E.lead(e.st,inp):P.kind==='they-follow'?E.follow(e.st,inp):null;p.s.x=e.st.x;p.s.z=e.st.z;p.s.yaw=e.st.yaw;
   if(P.social){const others=[...people.values()].filter(o=>o!==p&&o.node?.isEnabled?.()).map(o=>({x:o.s.x,z:o.s.z}));if(mp)others.push(mp);const n=root.VoidAdvancedInteractions?.separate?.({x:p.s.x,z:p.s.z},others,.85);if(n&&Ar&&!Ar.leg({x:p.s.x,z:p.s.z},n,{passing:true,adult:!!p.c.adult,made:true}).length){p.s.x=e.st.x=n.x;p.s.z=e.st.z=n.z;}}
   if(ev)tellE(ev);return e.st.clip||'idle';}
  /* NEVER POPPED IN OR OUT IN FRONT OF THE PLAYER (the owner, 19 Nov 2026; as ncz-street-pair.js): a new plan she cannot walk to straight is held while she is in view
     (p.hold: the plan she keeps), and a figure that should go (its mission is over, its plan left this area) stays on its last plan until it is out of view (p.going). */
  function seenAt(x,y,z,cam){if(!cam||!Number.isFinite(x+z))return false;if(Math.hypot(cam.x-x,cam.z-z)*(root.VoidZoom?root.VoidZoom.now():1)>cfg.showRadius)return false;
   try{const v=new B.Vector3(x,(Number.isFinite(y)?y:0)+1,z);for(const pl of B.Frustum.GetPlanes(scene.getTransformMatrix()))if(pl.dotCoordinate(v)<-1.2)return false;return true;}catch{return true;}}
  const inView=(n,cam)=>!!cam&&n.isEnabled()&&seenAt(n.position.x,n.position.y,n.position.z,cam);
  const camNow=()=>scene.activeCamera?.globalPosition||null;
  function companionPlan(p,plan,w,talk){const player=w,atStop=plan.mode==='path'&&p.s.mode==='plan-do';if(talk||p.going||(!atStop&&plan.mode!=='stay')||typeof mode!=='undefined'&&mode!=='walking'){p.near=false;return plan;}const origin=atStop?{x:p.s.x,z:p.s.z}:plan,locate=id=>{if(id==='player')return player;const peer=people.get(id);if(peer?.node?.isEnabled()&&!peer.going)return {x:peer.s.x,z:peer.s.z};const f=root.VoidNPCGestures?.figure(id),n=f?.node;if(!n||n.isDisposed?.()||!n.isEnabled?.()||n.getScene?.()!==scene)return null;const v=n.getAbsolutePosition();return {x:v.x,z:v.z};},rel=selectRelationship(p.c.relationships,origin,locate,p.id),b=rel?{...(p.c.worldBehavior||WORLD_DEFAULT),trigger:'near',distance:rel.r.distance,activity:rel.r.activity}:p.c.worldBehavior,traits=p.c.companionProfile?.personality||{};if(rel)w=rel.w;const key=rel?.r.target||'player';if(p.nearKey!==key){p.near=false;p.nearTarget=null;p.nearKey=key;}if(!validWorldBehavior(b)||!w||talk||p.going||(!atStop&&plan.mode!=='stay')||b.trigger!=='near'||typeof mode!=='undefined'&&mode!=='walking'){p.near=false;return plan;}
   // Mission routes, escorts and active missions retain priority over ambient companion actions.
   try{if(typeof state!=='undefined'&&(env()?.trees||[]).some(t=>(t.missions||[]).some(m=>{const rec=state.universe?.missions?.[m.id];return rec?.acquired&&!rec.completed&&(m.giver===p.id||(m.objectives||[]).some(o=>[o.npc,o.who,o.subject,o.recipient,o.giver].includes(p.id)));}))){p.near=false;return plan;}}catch{}
   if(!['auto','tea','sleeping'].includes(b.room)||b.room!=='auto'&&root.VoidUnderground?.placeAt(plan.x,plan.z)!==(b.room==='tea'?'under-tea-room':'under-sleeping-room')){p.near=false;return plan;}
   const d=Math.hypot(w.x-origin.x,w.z-origin.z),active=proximityActive(b,d,p.near);if(!active){p.near=false;p.nearTarget=null;return plan;}
   if(!p.near){p.near=true;p.nearTarget=null;const last=p.lastRemark??-Infinity;if(clock-last>=(traits.remarkCooldown??30)){p.lastRemark=clock;const lines=rel?.r.lines.length?[rel.r.lines[Math.floor(rnd()*rel.r.lines.length)]]:conversationLines(p.c,rnd);if(lines[0]!=='…'&&rnd()<(rel?rel.r.affection:traits.initiative??.5)&&(!rel||rel.r.target==='player'||player&&Math.hypot(player.x-origin.x,player.z-origin.z)<8)){try{if(typeof announce==='function')announce(p.c.name+(rel&&rel.r.target!=='player'?' → '+rel.r.target:'')+' · '+lines[0]);}catch{}}}
    const canWalk=!atStop&&NPX()?.crowdClips?.(p.c.model)?.includes('walk');if(canWalk&&b.activity==='approach'&&rnd()<(traits.approachFrequency??.5)&&d>.2){const space=traits.personalSpace??1.2,ratio=Math.max(0,d-space)/d,t={x:plan.x+(w.x-plan.x)*ratio,z:plan.z+(w.z-plan.z)*ratio};if(!Ar.leg(plan,t,{made:true,adult:!!p.c.adult}).length)p.nearTarget={...plan,...t,key:plan.key+':companion-near',actions:['idle'],yaw:Math.atan2(w.x-t.x,w.z-t.z)};}
    if(canWalk&&b.activity==='seat'&&['auto','tea','sleeping'].includes(b.room)){const actions=NPX().actionsFor(p.id),seat=nearbySeat(SP.seats?.()||[],plan,s=>{const f=SP.standOf(s);return Math.hypot(f.x-plan.x,f.z-plan.z)<=b.distance&&(!Ar.leg(plan,f,{made:true,adult:!!p.c.adult}).length)&&(b.room==='auto'||String(s.id).startsWith(b.room==='tea'?'under-tea-room-':'under-sleeping-room-'))&&actions.some(a=>a.pose&&(s.poses||['chair']).includes(a.pose))&&![...people.values()].some(o=>o!==p&&Math.hypot(o.s.x-s.x,o.s.z-s.z)<.65);});if(seat){const f=SP.standOf(seat),a=actions.find(a=>a.pose&&(seat.poses||['chair']).includes(a.pose));p.nearTarget={...plan,x:f.x,z:f.z,yaw:seat.yaw,actions:[a.id],key:plan.key+':companion-seat'};}}
   }const target=p.nearTarget||plan;if(b.activity!=='seat'&&(traits.attention??.5)>=.5)return {...target,yaw:Math.atan2(w.x-target.x,w.z-target.z)};return target;
  }
  function step(p,dt,cam){const n=p.node,R=p.going?p.plan:scenePlan(planOf(p.id)),talk=chatting()===p.id,w=me();
   if(!p.going&&R&&R.key!==p.key&&R.mode!=='escort'){   /* (follow fix) the end of a follow step is held too, as in ncz-street-pair.js */const t=R.mode==='stay'?R:R.mode==='path'?R.points[0]:null;if(t&&Ar&&Ar.leg({x:n.position.x,z:n.position.z},t).length&&(inView(n,cam)||seenAt(t.x,n.position.y,t.z,cam)))p.hold=true;else p.hold=false;}else if(!R||R.key===p.key)p.hold=false;
   const P=p.hold?p.plan:R;if(!p.hold)p.plan=P;
   const d=cam?Math.hypot(cam.x-n.position.x,cam.z-n.position.z)*(root.VoidZoom?root.VoidZoom.now():1):0,far=d>cfg.showRadius;if(n.isEnabled()===far)n.setEnabled(!far);
   if(P&&P.key!==p.key){p.key=P.key;const t=P.mode==='stay'?P:P.mode==='path'?P.points[0]:null;if(t&&Ar&&Ar.leg({x:n.position.x,z:n.position.z},t).length){p.s.x=t.x;p.s.z=t.z;p.y=yAt(t.x,t.z,p.y);}}   // a new spot she cannot walk to straight: she is put there
   let clip;
   if(P?.outing){
    const target=P.outing,walking=target.phase==='walk';
    p.s.x=target.x;p.s.z=target.z;p.s.mode=walking?'walk':'stay';
    const near=p.id==='patch'&&target.phase==='sell'&&w&&Math.hypot(w.x-target.x,w.z-target.z)<=1.22;
    if(near&&!p.wasNear&&!talk)root.VoidNPCServices?.greet?.(p.c.residence?.vendorShift?.greetingCooldown??root.VoidDistrictLife.PATCH_SHIFT.greetingCooldown);
    p.wasNear=!!near;
    const yaw=near?Math.atan2(w.x-target.x,w.z-target.z):target.yaw??p.s.yaw;
    p.s.yaw+=Math.atan2(Math.sin(yaw-p.s.yaw),Math.cos(yaw-p.s.yaw))*Math.min(1,dt*5);
    const voice=root.VoidAudio?.voiceStatus;
    const expression=p.id==='tacta'?root.VoidDistrictLife.visitGesture(p.id):null;
    clip=walking?'walk':p.anim?.has?.(expression)?expression:voice?.active&&voice.id===p.id?'talk':'idle';
    if(target.phase==='visit'&&!voice?.active){
     const sign=target.remaining<4?'wave':target.elapsed<4?'wave':null;
     if(sign&&p.anim?.has?.(sign))clip=sign;
    }
    if(walking){
     const crossing=root.VoidCrosswalks?.at(target.x,target.z,'oldtown');
     if(crossing)root.VoidCrosswalks.mark('made-'+p.id,target.x,target.z);
     const doors=root.VoidBabylon?.district?.doors;
     if(p.id==='tacta'&&doors&&!doors.secured){
      const [x,z]=root.VoidNeoChinatown.toWorld(target.x,target.z);
      const street=target.area==='street';
      if(Math.abs(x)<2&&Math.abs(z-(street?20:26))<3)doors.kick(street?'district-door':'district-inner-door',.4);
     }
    }
   }
   else if(P&&P.mode==='escort'&&!talk&&(P.kind==='follow-them'||P.kind==='they-follow')){clip=escTick(p,P,dt);p.s.mode='esc';p.s.device=null;}
   else{if(P&&P.mode==='escort'){/* talked to during the step: she stops for the conversation */}
    if(talk&&SP.floorPose&&SP.floorPose(p.s)&&['sit','floor-in','floor-turn','floor-down','floor-up'].includes(p.s.mode)){if(!/^floor-(down|up)$/.test(p.s.mode))p.s.left=Math.max(p.s.left||0,2);}   // on a cushion or a cot (the floor poses): she stays seated to talk (sitting down / standing up: the clip finishes)
    else if(talk){const s=p.s;s.mode='stop';s.sub='chat';s.clip='idle';s.device=null;s.left=Math.max(s.left||0,1.2);if(w)s.face={x:w.x,z:w.z};}else if(p.s.sub==='chat'){p.s.sub=null;p.s.face=null;p.s.left=Math.min(p.s.left,1.2);}
    if(p.s.mode==='esc')p.s.mode='plan-go';const plan=P&&(P.mode==='stay'||P.mode==='path')?P:{key:'here',mode:'stay',x:p.s.x,z:p.s.z,yaw:p.s.yaw,actions:['idle']};
    SP.routineStep(p.s,dt,rnd,p.c.companionProfile?.personality?.walkSpeed?{...cfg,speed:p.c.companionProfile.personality.walkSpeed}:cfg,{plan:companionPlan(p,plan,w,talk),player:w?{x:w.x,z:w.z}:null,cat:null,has:c=>!!p.anim&&!!p.anim.has&&p.anim.has(c)});if(p.s.mode==='walk'||p.s.mode==='run')p.s.mode='plan-go';clip=p.s.clip||'idle';}
   if(!Number.isFinite(p.s.x+p.s.z+p.s.yaw)){const t=P&&(P.mode==='stay'?P:P.points?P.points[0]:null)||{x:n.position.x,z:n.position.z};p.s.x=t.x;p.s.z=t.z;p.s.yaw=0;}
   if(clip==='sit'&&p.seat&&p.esc&&p.esc.st.ride==='in-cab'){const sit=(NPX()?.crowdClips?.(p.c.model)||[]).includes('sit');n.position.set(p.s.x,p.seat.y,p.s.z);n.rotation.y=p.s.yaw;if(n.isEnabled()!==sit)n.setEnabled(sit);if(sit&&p.anim&&p.clip!=='sit'){p.clip='sit';p.anim.play('sit');}p.anim?.setActive?.(sit&&d<animRadius);const it=items.get(p.id);if(it){it.position[0]=n.position.x;it.position[2]=n.position.z;}return;}   // riding in the player's taxi
   p.y+=(yAt(p.s.x,p.s.z,p.y)-p.y)*Math.min(1,dt*8);{const o=SP.seatOffset?SP.seatOffset(p.s,p.s.zo||0):{x:0,z:0};n.position.set(p.s.x+o.x,p.y+(p.s.lift||0),p.s.z+o.z);}/* seated (lift: a floor pose on a cushion or cot top): the routine's eased offset (ledges and the tunnels' seats) */n.rotation.y=p.s.yaw;p.anim?.setActive?.(!far&&d<animRadius);
   {const sp=root.VoidLiveContent?.socialPose?.(p.id);if(sp&&p.s.mode!=='esc'){const clips=NPX()?.crowdClips?.(p.c.model)||[];clip=sp==='talk'&&clips.includes('talk')?'talk':clips.includes('idle')?'idle':clip;if(sp==='talk'&&w)p.s.yaw=Math.atan2(w.x-p.s.x,w.z-p.s.z);}}
   if(p.anim&&clip!==p.clip){p.clip=clip;if(p.s.once&&p.s.after&&p.anim.playOnce)p.anim.playOnce(clip,p.s.after);else p.anim.play(clip);}   // a floor seat's sit-down / stand-up clip plays once, then its pose (ncz-street-pair.js FLOOR_MOVE)
   const it=items.get(p.id);if(it){it.position[0]=n.position.x;it.position[2]=n.position.z;}}
  function sync(){const L=wl(),cs=chars();
   const cam=camNow();for(const [id,p] of [...people])if(!cs[id]||!present(id)||atHome(cs[id])){if(cs[id]&&inView(p.node,cam)&&!atHome(cs[id]))p.going=true;else leave(id);}else p.going=false;
   for(const [id,c] of Object.entries(cs)){if(!present(id)||atHome(c))continue;const P=planOf(id),a=areaOfPlan(P);if(P&&P.indoors)away.add(id);   // inside a place (npc-escort-indoors.js)
    if(!a||!HERE.has(a)){const p=people.get(id);if(p&&inView(p.node,cam))p.going=true;else if(p)leave(id);continue;}
    if(people.has(id)&&people.get(id).c!==c){leave(id);}   // changed in a new version of the content: made again
    if(!people.has(id)){const t=P&&(P.mode==='stay'?P:P.mode==='path'?P.points[0]:null);if(away.has(id)&&t&&seenAt(t.x,0,t.z,cam))continue;   // back from inside a place: never in front of the player
     if(has(c.model)){away.delete(id);arrive(id,c,P);}else ask(c.model);}}
   if(L&&Array.isArray(L.interactions))for(const [id,p] of people){const it=itemFor(id,p.c),k=L.interactions.indexOf(it),want=p.node.isEnabled()&&!p.going;if(want&&k<0)L.interactions.push(it);else if(!want&&k>=0)L.interactions.splice(k,1);}
   nameCards();}
  function tick(dt){if(disposed)return;clock+=dt;if((scan-=dt)<=0){scan=.25;try{sync();}catch(e){try{console.warn('[VOID//RUNNER made givers]',e);}catch{}}}const cam=scene.activeCamera?.globalPosition||null;for(const p of people.values())try{step(p,dt,cam);}catch{}}
  const self={tick,stats:()=>({here:[...HERE],people:[...people.values()].map(p=>({id:p.id,name:p.c.name,model:p.c.model,x:+p.node.position.x.toFixed(2),z:+p.node.position.z.toFixed(2),yaw:+(p.node.rotation.y||0).toFixed(2),mode:p.s.mode,clip:p.clip,device:p.c.device||null,props:p.props.map(m=>m.name),talk:!!wl()?.interactions?.includes(items.get(p.id)),look:p.node.metadata?.npcLook||null,enabled:p.node.isEnabled(),esc:p.esc?{key:p.esc.key,phase:p.esc.st.phase,ride:p.esc.st.ride||null,x:+p.esc.st.x.toFixed(2),z:+p.esc.st.z.toFixed(2),yaw:+(p.esc.st.yaw||0).toFixed(2)}:null}))}),
   get people(){return people;},dispose(){disposed=true;for(const id of [...people.keys()])leave(id);if(root.VoidMadeNPCs&&root.VoidMadeNPCs.live===liveFn)root.VoidMadeNPCs.live=null;}};
  const liveFn=()=>self.stats();liveFn.visible=id=>people.get(id)?.node.isEnabled()===true;root.VoidMadeNPCs.live=liveFn;return self;}
 /* Name cards for the dialogue window (as mission-givers do for their speakers). */
 function nameCards(){const ch=root.VoidStoryContent?.characters;if(!ch)return;for(const [id,c] of Object.entries(chars()))if(!ch[id]||ch[id].made)ch[id]={id,name:c.name,role:'',portrait:'art/characters.png',cell:'0% 0%',faction:'independent',tags:['made'],biography:'',relationshipDefault:0,made:true};}
 function startResidents({scene,parent,def}){
  const A=root.VoidAssets,AP=root.VoidApartments,people=new Map(),pending=new Set(),failed=new Set();
  const hall=def.part==='hall';
  let stopped=false;
  function remove(id){
   const p=people.get(id);if(!p)return;
   p.anim?.dispose?.();p.node.dispose(false,false);
   const i=def.interactions.indexOf(p.item);if(i>=0)def.interactions.splice(i,1);
   people.delete(id);
  }
  function pose(id,c,index){
   if(!c||!present(id)||root.VoidEncounterGame?.hidesResident?.(id))return null;
   const outing=residentOuting(id,c);
   if(outing){
    if(outing.area!==def.part)return null;
    return {x:outing.x,z:outing.z,yaw:outing.yaw,clip:'walk'};
   }
   if(hall||!atHome(c))return null;
   const spot=AP.residenceSpot(def.style,index);
   return spot?{x:spot[0],z:spot[1],yaw:0,clip:'idle'}:null;
  }
  function position(p,target){
   p.node.position.set(target.x,0,target.z);p.node.rotation.y=target.yaw;
   p.item.position=AP.world([target.x,1.6,target.z]);
   if(p.clip!==target.clip){p.anim?.play?.(target.clip);p.clip=target.clip;}
  }
  function load(id,c,index){
   pending.add(id);
   const key='crowd:'+c.model;
   Promise.resolve(A.container?.(key)||A.load(key,{src:fileOf(c.model),background:true},scene)).then(()=>{
    if(stopped)return;
    const target=pose(id,chars()[id],index);if(!target)return;
    const n=A.instance(key,parent);if(!n)return;
    n.metadata={...n.metadata,character:id,made:id,displayName:c.name};
    for(const m of n.getChildMeshes(false))m.isPickable=false;
    try{NPL()?.applyLook?.(n,c.model,c.look?{id:'made-'+id,name:c.name,...c.look}:null,{scene});}catch{}
    const anim=root.VoidCrowd?.animate?.(n,c.model,target.clip);
    const item={id:'made-'+id,action:ACTION,character:id,label:'TALK TO '+c.name.toUpperCase(),range:2.2,talk:true};
    const p={node:n,anim,item,clip:target.clip};
    position(p,target);def.interactions.push(item);people.set(id,p);nameCards();
   }).catch(()=>failed.add(id)).finally(()=>pending.delete(id));
  }
  function tick(){
   if(stopped)return;
   const cs=chars();
   const ids=hall?['tacta','patch'].filter(id=>cs[id]?.residence?.door===def.street):def.residents||[];
   for(const id of people.keys())if(!ids.includes(id))remove(id);
   for(const [i,id] of ids.entries()){
    const c=cs[id],p=people.get(id),target=pose(id,c,i);
    if(!target){if(p)remove(id);continue;}
    if(p){if(target.clip==='walk'||p.clip!==target.clip)position(p,target);}
    else if(!pending.has(id)&&!failed.has(id))load(id,c,i);
   }
  }
  return {tick,walkingNear(x,z,radius){
   return [...people.values()].some(p=>p.clip==='walk'&&Math.hypot(p.node.position.x-x,p.node.position.z-z)<radius);
  },dispose(){stopped=true;for(const id of people.keys())remove(id);}};
 }
 root.VoidMadeNPCs={...api,start,startResidents,planOf,present,props,live:null,nameCards,patchOuting:()=>residentOuting('patch',env()?.characters?.patch),tactaOuting:()=>tactaOuting(env()?.characters?.tacta)};
 if(root.VoidDevTools?.standalone)return; // lightweight companion editor: no game runtime or interaction polling
 // every street quarter and the District interior: started (and ticked, and disposed) with the street pair, which neochinatown.js starts in each of them
 (function wrap(){const S=root.VoidStreetPair;if(!S||!S.start||S.start.made)return;const s0=S.start;const s1=function(o){const a=s0.apply(this,arguments);let b=null;try{b=start(o||{});}catch(e){try{console.warn('[VOID//RUNNER made givers]',e);}catch{}}
   if(!a||!b)return a;const t=a.tick,d=a.dispose;a.tick=function(dt){t.apply(this,arguments);b.tick(dt);};a.dispose=function(){try{b.dispose();}catch{}return d.apply(this,arguments);};a.made=b;return a;};s1.made=true;S.start=s1;})();
 // the inside of Milked (milked-build.js build, its own scene): reception, for adult made characters only (npc-areas.js area 'milked')
 (function wrapMilked(){const MK=root.VoidMilked;if(!MK||!MK.build||MK.build.made)return;const b0=MK.build;const b1=function(o){const h=b0.apply(this,arguments);let m=null;try{m=start({...(o||{}),where:{scene:'milked'}});}catch(e){}
   if(!h||!m)return h;let last=null;const t=h.tick,d=h.dispose;h.tick=function(time){const r=t.apply(this,arguments);const now=performance.now()/1000,dt=last==null?0:Math.min(.1,now-last);last=now;m.tick(dt);return r;};h.dispose=function(){try{m.dispose();}catch{}return d.apply(this,arguments);};h.made=m;return h;};b1.made=true;MK.build=b1;})();
 function watchScene(sceneId,owner){if(!owner||typeof owner.build!=='function'||owner.build.made)return;const b0=owner.build;const b1=function(o){const h=b0.apply(this,arguments);let m=null;try{m=start({...(o||{}),where:{scene:sceneId}});}catch(e){}
   if(!h||!m)return h;let last=null;const t=h.tick,d=h.dispose;h.tick=function(time){const r=t.apply(this,arguments);const now=performance.now()/1000,dt=last==null?0:Math.min(.1,now-last);last=now;m.tick(dt);return r;};h.dispose=function(){try{m.dispose();}catch{}return d.apply(this,arguments);};h.made=m;return h;};b1.made=true;owner.build=b1;}
 root.VoidMadeNPCs.watchScene=watchScene;watchScene('corporate',root.VoidCorporate);watchScene('temple',root.VoidTemple);
 // TALK TO <NAME> with no mission waiting: a silent beat (no words are invented for them; live-content.js offers their missions first)
 const wait=setInterval(()=>{if(typeof VoidInteractions==='undefined'||!VoidInteractions.register||typeof talk!=='function')return;clearInterval(wait);nameCards();
  VoidInteractions.register(ACTION,({item}={})=>{const id=item&&item.character;nameCards();const contextual=root.VoidNPCServices?.conversation?.(id);talk('',(contextual?[contextual]:conversationLines(chars()[id])).map(text=>({who:id,text})),()=>{try{resumeWalking();}catch{}},'CLOSE');});},300);
})(typeof globalThis!=='undefined'?globalThis:this);
