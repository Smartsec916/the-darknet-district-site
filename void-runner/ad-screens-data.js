/* What the street advertisement screens show, and where (the owner, 16 Nov 2026).
   PURE DATA AND RULES: runs in the browser and in Node (tests/ad-screens.test.cjs). The drawing, the screens and the sound are ad-screens.js.
   How to change things is written up in docs/development/AD_SCREENS.md.

   THE WORDS ARE THE OWNER'S, VERBATIM (docs/void-runner/design-source/12-street-advertisements-owner.md): brand, tagline, punctuation and the trademark sign.
   Do not reword them and do not add to them; new ads, news or announcer lines need him. A test compares this file with his document.
   His seven space-station ads and his news stay in relay-content.json (RELAY below only says which of them the street may show).
   The Function has NO content here: its "civic notice" is the old silent poster, and it gets no voice, look or announcement without the owner. */
(function(root){
 'use strict';
 /* CATEGORIES. title: the owner's own heading (used as the small label only where `label` is set). look: the visual template in ad-screens.js (one per category,
    so a food ad never looks like a government notice). speaker: whose recorded clips are looked up for these lines (tools/audio/npc-voice-registry.json).
    The broadcast voices are PROVISIONAL until the owner picks by ear (docs/development/AD_SCREENS_VOICE_AUDITION.md); a line with no clip is shown silently. */
 const CATEGORIES={
  cyber:{title:'Cybernetic enhancements',look:'cyber',speaker:'commercial-announcer'},
  food:{title:'Food & beverages',look:'food',speaker:'commercial-announcer'},
  dating:{title:'Dating & entertainment',look:'dating',speaker:'commercial-announcer'},
  corporate:{title:'Corporate propaganda',look:'corporate',speaker:'commercial-announcer'},
  health:{title:'Healthcare',look:'health',speaker:'commercial-announcer'},
  housing:{title:'Housing & transportation',look:'housing',speaker:'commercial-announcer'},
  transport:{title:'Housing & transportation',look:'transport',speaker:'commercial-announcer'},
  tech:{title:'Technology & black-market services',look:'tech',speaker:'commercial-announcer'},
  government:{title:'Government announcements',label:'GOVERNMENT ANNOUNCEMENT',look:'government',speaker:'news-anchor'},
  warflying:{title:'Pro-WarFlying advertisements',look:'warflying',speaker:'warflying-host'},
  // The owner's space-station ads (relay-content.json): the speaker is the segment's own.
  shipgear:{title:'Ship equipment (the owner’s space-station ads)',look:'shipgear'},
  police:{title:'Police recruitment (the owner’s space-station ads)',look:'police'},
  district:{title:'The Darknet District apparel (the owner’s space-station ad)',look:'district',district:true},
  // The two things that come round between ads.
  news:{title:'News',label:'NEWS',look:'news'},
  board:{title:'WarFlying Leadership Board',look:'board',speaker:'warflying-host'}
 };
 /* THE ADS. One entry each: {id, cat, brand, line} (a brand and its tagline), {id, cat, line} (an announcement), or {id, cat, title, lines} (a longer ad).
    Optional on any entry:
      era   a lore-timeline tag, or a list of them: the ad runs only in that era. No tag = runs in every era. NO ERAS EXIST YET (ERA below is null); the
            field is here so the content can change with the timeline later without touching the screens.
      tags  free words for later rules (none are used yet). */
 const ADS=[
  {id:'cyber-second-chances',cat:'cyber',brand:"Second Chances™",line:"Lost an arm? Upgrade your poor decisions."},
  {id:'cyber-chromedaddy',cat:'cyber',brand:"ChromeDaddy",line:"Be the man your warranty says you are."},
  {id:'cyber-memorywipe',cat:'cyber',brand:"MemoryWipe™",line:"Forget your ex. Financing available."},
  {id:'cyber-cybereyes-4k',cat:'cyber',brand:"CyberEyes 4K",line:"See red flags in unprecedented detail."},
  {id:'cyber-quietbrain',cat:'cyber',brand:"QuietBrain™",line:"Now with 80% fewer intrusive advertisements."},
  {id:'cyber-budget-bionics',cat:'cyber',brand:"Budget Bionics",line:"An arm and a leg for less than an arm and a leg."},
  {id:'cyber-egoboost-implants',cat:'cyber',brand:"EgoBoost Implants",line:"Confidence sold separately."},
  {id:'food-real-ish-chicken',cat:'food',brand:"Real-ish Chicken™",line:"Genetically convinced it's chicken."},
  {id:'food-null-energy',cat:'food',brand:"NULL Energy",line:"Sleep is a subscription you can't afford."},
  {id:'food-mamas-synthetic-noodles',cat:'food',brand:"Mama's Synthetic Noodles",line:"Just like your mother used to download."},
  {id:'food-corporate-cola',cat:'food',brand:"Corporate Cola",line:"Taste the exploitation."},
  {id:'food-tofu-exe',cat:'food',brand:"TOFU.EXE",line:"Now with downloadable flavors."},
  {id:'food-yesterdays-sushi',cat:'food',brand:"Yesterday's Sushi",line:"Tomorrow's medical emergency."},
  {id:'food-barely-beef',cat:'food',brand:"Barely Beef™",line:"12% cow. 100% attitude."},
  {id:'food-emergency-ramen',cat:'food',brand:"Emergency Ramen",line:"Just add contaminated water."},
  {id:'dating-rent-a-soulmate',cat:'dating',brand:"Rent-A-Soulmate",line:"True love starts at 49 credits per hour."},
  {id:'dating-milked',cat:'dating',brand:"Milked",line:"Come for the atmosphere. Stay because your tab is enormous."},
  {id:'dating-cyberbride',cat:'dating',brand:"CyberBride™",line:"Compatible with most major operating systems."},
  {id:'dating-divorce-exe',cat:'dating',brand:"Divorce.exe",line:"End your marriage without restarting."},
  {id:'dating-null-nightclub',cat:'dating',brand:"NULL Nightclub",line:"Lose your inhibitions. Possibly your wallet."},
  {id:'dating-ex-b-gone',cat:'dating',brand:"Ex-B-Gone™",line:"Emotional uninstall services."},
  {id:'dating-vr-paradise',cat:'dating',brand:"VR Paradise",line:"Reality is a known software defect."},
  {id:'corporate-worklife-industries',cat:'corporate',brand:"WorkLife Industries",line:"Your life. Our property."},
  {id:'corporate-obey',cat:'corporate',brand:"Obey™",line:"Independent thinking was never good for productivity."},
  {id:'corporate-corporate-security',cat:'corporate',brand:"Corporate Security",line:"Protecting shareholders from people like you."},
  {id:'corporate-freedom-plus',cat:'corporate',brand:"Freedom Plus",line:"Upgrade to premium citizenship today."},
  {id:'corporate-trustcorp',cat:'corporate',brand:"TrustCorp",line:"If we were evil, would we have such a friendly logo?"},
  {id:'corporate-employee-wellness-program',cat:'corporate',brand:"Employee Wellness Program",line:"Crying breaks are now billable."},
  {id:'corporate-rent-your-future',cat:'corporate',brand:"Rent Your Future™",line:"Ownership is an outdated concept."},
  {id:'health-medix-express',cat:'health',brand:"Medix Express",line:"Your survival is our secondary priority."},
  {id:'health-traumalite',cat:'health',brand:"TraumaLite",line:"Affordable coverage for non-fatal emergencies."},
  {id:'health-organ-overstock',cat:'health',brand:"Organ Overstock",line:"Everything must go!"},
  {id:'health-respira',cat:'health',brand:"Respira™",line:"Breathing is free for the first 30 days."},
  {id:'health-dr-patch',cat:'health',brand:"Dr. Patch",line:"Have you tried turning yourself off and on again?"},
  {id:'health-immortalife',cat:'health',brand:"ImmortaLife",line:"Live forever. Pay monthly."},
  {id:'housing-coffin-suites',cat:'housing',brand:"Coffin Suites",line:"Technically a bedroom."},
  {id:'housing-microliving',cat:'housing',brand:"MicroLiving™",line:"Now with enough space to have one regret."},
  {id:'transport-deathcab',cat:'transport',brand:"DeathCab",line:"We guarantee arrival. Not necessarily yours."},
  {id:'housing-neochinatown-apartments',cat:'housing',brand:"NeoChinatown Apartments",line:"Stunning views of other apartments."},
  {id:'housing-sleepbox',cat:'housing',brand:"SleepBox",line:"Because homelessness looks bad on your profile."},
  {id:'tech-hackmart',cat:'tech',brand:"HackMart",line:"Probably legal since 2187."},
  {id:'tech-privacy-pro',cat:'tech',brand:"Privacy Pro™",line:"We know how much privacy means to you."},
  {id:'tech-adblock-basic',cat:'tech',brand:"AdBlock Basic",line:"Watch this advertisement to block advertisements."},
  {id:'tech-identity-outlet',cat:'tech',brand:"Identity Outlet",line:"New you. No questions."},
  {id:'tech-totally-legit-cybernetics',cat:'tech',brand:"Totally Legit Cybernetics",line:"Ignore the screaming downstairs."},
  {id:'tech-databrokers-inc',cat:'tech',brand:"DataBrokers Inc.",line:"We know what you did last Tuesday."},
  {id:'tech-free-public-wi-fi',cat:'tech',brand:"Free Public Wi-Fi",line:"Your passwords are our passwords."},
  {id:'government-1',cat:'government',line:"Missing a kidney? Report unauthorized harvesting to your local authorities."},
  {id:'government-2',cat:'government',line:"Remember: Surveillance is just another word for caring."},
  {id:'government-3',cat:'government',line:"Unemployment is a choice. Forced employment is not."},
  {id:'government-4',cat:'government',line:"See something? Say something. Earn 5 credits per reported neighbor."},
  {id:'government-5',cat:'government',line:"Public executions have been postponed due to technical difficulties."},
  {id:'government-6',cat:'government',line:"Your dissatisfaction has been recorded for quality assurance."},
  {id:'government-7',cat:'government',line:"Attention citizens: Unauthorized happiness may indicate illegal substance use."},
  // Pro-WarFlying advertisements (the owner, verbatim; his line breaks inside a sentence are joined).
  {id:'warflying-playground',cat:'warflying',title:'WARFLYING — THE GALAXY IS YOUR PLAYGROUND!',lines:['Think you\'re the best scanner in the Tessaly System?','Prove it!','Download WarFlying from the App Store.','Launch your ship and start scanning.','Hit SUBMIT SCANS to upload your discoveries.','Climb the WarFlying Leaderboard!','GET SCANNING. GET RANKED. GET LEGENDARY.']},
  {id:'warflying-dominate',cat:'warflying',title:'SCAN. SUBMIT. DOMINATE.',lines:['Join the Tessaly System\'s fastest-growing WarFlying community!','Install the WarFlying App from the App Store, explore uncharted frequencies, and submit your scans to climb the global leaderboard.','Who\'s watching the watchers?','YOU ARE.']},
  {id:'warflying-glory',cat:'warflying',title:'PRIVATE FREQUENCIES. PUBLIC GLORY.',lines:['Think you\'ve got what it takes to become the Tessaly System\'s #1 WarFlyer?','DOWNLOAD. FLY. SCAN. SUBMIT.','Thousands of signals.','Hundreds of competitors.','One top spot.','Install WarFlying from your App Store today!']}
 ];
 // The owner's space-station ads the street may show, by their id in relay-content.json, and the category each plays under.
 const RELAY={'ad-maneuvering-thrusters':'shipgear','ad-shield-systems':'shipgear','ad-missile-lock':'shipgear','ad-personal-defense':'shipgear',
  'ad-darknet-district-apparel':'district','police-join-the-force':'police','police-enjoy-authority':'police'};

 /* WHERE EACH CATEGORY PLAYS (proposed table; the owner has not confirmed it, so it is kept as plain data: move a word from one list to another to change it).
    A zone with speaks:false shows its screens silently. */
 const ZONES={
  oldtown:{name:'Old Town',cats:['food','dating','tech','cyber','housing','warflying','district'],speaks:true},
  port:{name:'The Port',cats:['transport','housing','health','shipgear','police','warflying'],speaks:true},
  avenue:{name:'The Avenue',cats:['food','dating','cyber','housing','transport','health','corporate','shipgear','police','warflying','district','government'],speaks:true},
  // The Function Gate end of the Avenue. The owner: no Darknet District advertisements near the Corporate District.
  corporate:{name:'Function Gate end of the Avenue',cats:['corporate','government','health'],speaks:true}
 };
 /* WHICH ZONE A SPOT IS IN. Checked top to bottom; the first match wins. rect is [x0,x1,z0,z1] in street metres (the same numbers as ncz-quarters.js).
    zone:null means NO SCREEN stands there at all (the owner: none near the Temple; its road is the East Gate's). */
 const AREAS=[
  {quarter:'avenue',rect:[106,160,-30,6],zone:null,why:'the East Gate approach: the road to the Zen Zephyr Temple stays quiet'},
  {quarter:'avenue',rect:[-6,36,-30,6],zone:'corporate',why:'the Function Gate end: the Corporate District is next door'},
  {quarter:'avenue',zone:'avenue'},
  {quarter:'oldtown',zone:'oldtown'},
  {quarter:'far-south',zone:'oldtown'},
  {quarter:'outskirts',zone:null,why:'The Outskirts: no advertisement screens (the owner, 16 Nov 2026)'},
  {quarter:'port',zone:'port'}
 ];
 /* Places with their own scene. null = no advertisement screens at all. 'silent' = whatever screens the place already has stay as they are, and nothing speaks.
    (The Darknet District's own anti-WarFlying screens are district-screens.js and are not touched from here.) */
 const SCENES={temple:null,corporate:null,district:'silent',milked:null};
 /* Screens added by hand (the rest stand where the city's old posters stood). kind: 'wall' (a big screen up on a wall) or 'kiosk' (a street-level stand).
    at: [x, y, z] of the middle of the picture; faces: the compass direction the picture looks ('n' +z, 's' -z, 'e' +x, 'w' -x); w: width in metres;
    posts: true stands a wall screen on its own two legs (where no wall is behind it). */
 const PLACES=[
  {id:'port-pad',quarter:'port',kind:'wall',at:[25,9.5,-86.6],faces:'s',w:6,posts:true},
  {id:'port-passage',quarter:'port',kind:'kiosk',at:[38.2,1.55,-96],faces:'e'}
 ];
 /* RECORDING SWITCHES, read by tools/audio/extract-lines.cjs. Both are OFF: the owner picks the voices by ear first, and nothing new is recorded before that.
    ads: the street's ad and announcement lines. board: each of the owner's handles and "a new number one". */
 const RECORD={ads:false,board:false};
 // No screen stands inside a checkpoint or within this many metres of one.
 const GATE_MARGIN=3;
 // The lore era now. null: no eras exist yet, so every ad without an `era` runs and an ad with one does not.
 const ERA=null;
 // Every Nth slot of a screen's programme is news or the board (the owner: "Not every other time, but maybe every 5th").
 const EVERY=5;
 // Seconds a line stays up when it has no recording.
 const TIMING={brand:8,notice:9,title:3.4,line:5,headline:4.5,board:12,gap:.7};

 /* THE STREET-LEVEL SCREENS ON THE WALLS (the owner, 20 Nov 2026: "they would be on the side of buildings, not between the sidewalk and the street. They make the
    sidewalk feel crowded", "a little smaller", "a little less ad screens"). The old kerb stands are gone: each screen hangs flat on the building wall behind its
    old spot, bottom edge 2.8 m up (the awning is cut round it), beside the shop sign and clear of the street doors; 75% of the old 1.6 x 2.4 m picture.
    w, h: the picture; bottom: its lower edge above the pavement; out: the picture's distance in front of the building line; half: half the housing's width;
    sign: half the shop sign's width; door: half a street door's width with its frame; spots: where along its 7 m shopfront a screen may hang (metres from the middle,
    the first that is clear wins). */
 const MOUNT={w:1.2,h:1.8,bottom:2.8,out:.3,half:.72,sign:1.22,door:.75,spots:[0,-1.98,1.98]};
 // Of the street screens a quarter's shopfronts would carry, this share is kept (the owner: "a little less"; the rest are thinned out where they bunch up, see thin()).
 const KEEP_SHARE=2/3;
 /* Where along a shopfront (offset from its middle, metres) a wall screen hangs, or null where nothing fits. sign: the shopfront has a sign in its middle;
    doors: the street doors along the same building line, as offsets from the same middle; half: half the shopfront's usable length. */
 function mountOffset({sign=false,doors=[],half=3.5}={}){
  for(const o of MOUNT.spots){if(Math.abs(o)+MOUNT.half>half)continue;if(sign&&Math.abs(o)<MOUNT.sign+MOUNT.half)continue;if(doors.some(d=>Math.abs(d-o)<MOUNT.door+MOUNT.half))continue;return o;}
  return null;}
 /* Thinning (deterministic): from a list of screens [{x, y, z, side, kind}] keep `share` of them, taking out first the one that is most crowded (nearest
    neighbour on the same side of the street, then the second nearest; a street-level screen before a big wall one; then the later one), so what is left is
    evenly spread. count: how many to keep instead (the city counts the screens it had before any could not be hung). Returns a list of booleans (true = kept). */
 function thin(list,share=KEEP_SHARE,count=null){
  const n=list.length,keep=count==null?Math.round(n*share):Math.max(0,Math.min(n,count)),alive=list.map(()=>true);let left=n;
  const near=i=>{let a=1e9,b=1e9;const p=list[i];for(let j=0;j<n;j++){if(j===i||!alive[j]||list[j].side!==p.side)continue;const q=list[j],d=Math.hypot(p.x-q.x,(p.y||0)-(q.y||0),p.z-q.z);if(d<a){b=a;a=d;}else if(d<b)b=d;}return [a,b];};
  while(left>keep){let best=-1,bk=null;for(let i=0;i<n;i++){if(!alive[i])continue;const [a,b]=near(i),k=[a,b,list[i].kind==='wall'?1:0,-i];
    if(!bk||k[0]<bk[0]-1e-9||Math.abs(k[0]-bk[0])<=1e-9&&(k[1]<bk[1]-1e-9||Math.abs(k[1]-bk[1])<=1e-9&&(k[2]<bk[2]||k[2]===bk[2]&&k[3]<bk[3]))){best=i;bk=k;}}
   alive[best]=false;left--;}
  return alive;}
 const inRect=([x0,x1,z0,z1],x,z)=>x>=x0&&x<=x1&&z>=z0&&z<=z1;
 // The zone id a screen at (x, z) of a quarter belongs to; null where no screen may stand.
 function zoneAt(quarter,x,z){for(const a of AREAS)if(a.quarter===quarter&&(!a.rect||inRect(a.rect,x,z)))return a.zone;return null;}
 // May a screen stand at (x, z) of a quarter: its zone allows one and it is not in or against a checkpoint (gates: VoidQuarters.GATES).
 const allowed=(quarter,x,z,gates=[])=>!!zoneAt(quarter,x,z)&&!gates.some(g=>x>=g.rect[0]-GATE_MARGIN&&x<=g.rect[1]+GATE_MARGIN&&z>=g.rect[2]-GATE_MARGIN&&z<=g.rect[3]+GATE_MARGIN);
 const inEra=(ad,era)=>ad.era===undefined||ad.era===null?true:era!=null&&(Array.isArray(ad.era)?ad.era.includes(era):ad.era===era);
 const mulberry=seed=>{let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};};
 const hash=text=>{let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;};
 const shuffle=(list,r)=>{const a=list.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
 /* The ads of a zone, by category: {cat: [ad, ...]}. relay: the loaded relay-content.json (its ads are the owner's; drafts are never shown). */
 function adsFor(zoneId,{relay=null,era=ERA}={}){
  const zone=ZONES[zoneId],out={};if(!zone)return out;
  for(const cat of zone.cats){
   const own=ADS.filter(a=>a.cat===cat&&inEra(a,era));
   const theirs=Object.entries(RELAY).filter(([,c])=>c===cat).map(([id])=>(relay?.segments||[]).find(s=>s.id===id&&!s.draft&&(s.kind==='ad'||s.kind==='police')))
    .filter(Boolean).map(s=>({id:s.id,cat,title:s.headline||'',lines:s.lines.slice(),speaker:s.speaker||(s.kind==='police'?'police-recruiter':'commercial-announcer'),relay:true}));
   if(own.length||theirs.length)out[cat]=[...own,...theirs];
  }
  return out;
 }
 /* A screen's programme for one zone: a list of slots, each {type:'ad', ad} or {type:'break', n} (n counts the breaks). Every EVERY-th slot is a break.
    Each ad of the zone runs once per cycle, with every category spread evenly through it (so a category's ads never bunch up, and one with a single ad
    comes round once a cycle). seed: screens with different seeds run different orders. */
 function programme(zoneId,{relay=null,era=ERA,seed=1}={}){
  const by=adsFor(zoneId,{relay,era}),cats=Object.keys(by);if(!cats.length)return [];
  const r=mulberry(hash(zoneId+'|'+seed)),keyed=[];
  for(const c of cats){const list=shuffle(by[c],r),off=r();list.forEach((ad,i)=>keyed.push({ad,k:(i+off)/list.length}));}
  const ads=keyed.sort((a,b)=>a.k-b.k).map(x=>x.ad);
  // no category twice in a row where it can be helped
  for(let i=1;i<ads.length;i++)if(ads[i].cat===ads[i-1].cat){const j=ads.findIndex((a,k)=>k>i&&a.cat!==ads[i].cat&&a.cat!==ads[i-1].cat);if(j>0)[ads[i],ads[j]]=[ads[j],ads[i]];}
  const out=[];let n=0;
  for(const ad of ads){out.push({type:'ad',ad});if(out.length%EVERY===EVERY-1)out.push({type:'break',n:n++});}
  return out;
 }
 /* What a break shows: the WarFlying Leadership Board and the owner's news, turn about. news: the reports that may be shown now (see newsFor). With no news
    that fits, it is always the board. Returns {type:'board'} or {type:'news', segment}. */
 function breakSlot(n,news){const list=news||[];if(!list.length||n%2===0)return {type:'board'};return {type:'news',segment:list[((n-1)/2)%list.length]};}
 /* The owner's news the street may show: his own reports only (kind 'news', never a draft, never a faction's or The Function's), and only those whose story
    has happened for this player (occurred: the Relay's record of public events). */
 function newsFor(relay,occurred){return (relay?.segments||[]).filter(s=>s.kind==='news'&&!s.draft&&Array.isArray(s.lines)&&s.lines.length&&(!s.event||occurred?.[s.event]!==undefined));}
 /* One slot as something a screen can show and say. Each slide: {kind, cat, look, speaker, label, title, lines:[{text, say, hold}]}
      kind 'brand'   a brand and its tagline: one spoken line, the whole of the owner's line ("Brand — tagline")
      kind 'notice'  one announcement
      kind 'script'  a title and its lines, one at a time (the title is spoken first when it is the owner's ad title)
      kind 'news'    a headline, then the report's lines
      kind 'board'   the top five; the only thing said is #1's handle or "a new number one"
    say: the exact text a recording is looked up by (null: nothing is ever said for it). hold: seconds on screen without a recording. */
 function slide(slot,{standings=null}={}){
  if(slot.type==='board'){const c=CATEGORIES.board;return {kind:'board',cat:'board',look:c.look,speaker:c.speaker,label:standings?.header||'WARFLYING LEADERSHIP BOARD',title:'',standings,lines:[{text:standings?.spoken||'',say:standings?.spoken||null,hold:TIMING.board}]};}
  if(slot.type==='news'){const s=slot.segment,c=CATEGORIES.news;return {kind:'news',cat:'news',look:c.look,speaker:s.speaker||'news-anchor',label:c.label,title:s.headline||'',id:s.id,lines:[{text:s.headline||'',say:null,hold:TIMING.headline,headline:true},...s.lines.map(t=>({text:t,say:t,hold:TIMING.line}))]};}
  const ad=slot.ad,c=CATEGORIES[ad.cat],base={cat:ad.cat,look:c.look,speaker:ad.speaker||c.speaker,label:c.label||'',id:ad.id};
  if(ad.brand){const full=ad.brand+' — '+ad.line;return {...base,kind:'brand',title:ad.brand,lines:[{text:ad.line,say:full,hold:TIMING.brand}]};}
  if(ad.lines)return {...base,kind:'script',title:ad.title,lines:[...(ad.relay||!ad.title?[]:[{text:ad.title,say:ad.title,hold:TIMING.title,title:true}]),...ad.lines.map(t=>({text:t,say:t,hold:TIMING.line}))]};
  return {...base,kind:'notice',title:'',lines:[{text:ad.line,say:ad.line,hold:TIMING.notice}]};
 }
 // Every line a voice could ever say on a street screen, as {speaker, text, cat, id}: the recording list (see the audition plan). Board handles are separate.
 function spokenLines(relay){const out=[];for(const z of Object.keys(ZONES))for(const list of Object.values(adsFor(z,{relay})))for(const ad of list)for(const l of slide({type:'ad',ad}).lines)if(l.say&&!out.some(o=>o.text===l.say&&o.speaker===(ad.speaker||CATEGORIES[ad.cat].speaker)))out.push({speaker:ad.speaker||CATEGORIES[ad.cat].speaker,text:l.say,cat:ad.cat,id:ad.id,relay:!!ad.relay});return out;}
 const api={CATEGORIES,ADS,RELAY,ZONES,AREAS,SCENES,PLACES,ERA,EVERY,TIMING,GATE_MARGIN,RECORD,MOUNT,KEEP_SHARE,zoneAt,allowed,mountOffset,thin,inEra,adsFor,programme,breakSlot,newsFor,slide,spokenLines,hash,mulberry};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VoidAdData=api;
})(typeof globalThis!=='undefined'?globalThis:this);
