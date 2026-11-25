/* Crowd looks: which CC0 MakeHuman figures (tools/animation-pipeline/characters) dress the ambient crew-* NPCs
   at each place, and which mocap clip each one plays. Named characters never use these. Data and small helpers;
   the pure part is tested in Node. Missing models fall back to the procedural crew figure. */
(function(root){
 const base='assets/models/crowd/';
 // Clips each look carries (must match its character spec).
 const clips={
  'vesper-mechanic':['idle','talk','work','watch','walk'],'vesper-pilot':['idle','talk','work','watch','sit','walk'],'vesper-trader':['idle','talk','work','watch','sit','walk','sit-enter','sit-exit','sit-talk','interact','look'],
  'order-farmhand':['idle','talk','work','watch','walk'],'order-grower':['idle','talk','work','watch','walk'],'order-militia':['idle','talk','work','watch','walk'],
  'communion-worker':['idle','talk','work','watch','walk'],'communion-tech':['idle','talk','work','watch','sit','walk'],'cyborg-01':['idle','talk','work','watch','sit','walk','sit-enter','sit-exit','sit-talk','interact','look'],
  'ncz-neon':['idle','talk','watch','walk','drunk-walk','drunk-idle','drunk-sway','laugh','smoke'],'fixer-01':['idle','talk','watch','sit','walk','sit-enter','sit-exit','sit-talk','interact','look'],'runner-02':['idle','talk','watch','walk','drunk-walk','drunk-idle','drunk-sway','laugh'],
  'hacker-01':['idle','talk','sit','smoke','watch','walk','sit-enter','sit-exit','sit-talk','interact','look'],'district-smuggler':['idle','talk','sit','smoke','walk'],'district-resident':['idle','talk','sit','smoke','walk','drink','laugh','dance'],
  'outlaw-01':['idle','talk','sit','smoke','watch','walk','sit-enter','sit-exit','sit-talk','interact','look','laugh','drink'],'regular-01':['idle','talk','sit','watch','walk','sit-enter','sit-exit','sit-talk','interact','look','laugh','drink'],
  'meridian-bartender':['idle','talk','interact','pickup','wipe','walk'],
  // The District's VR arcade players (neochinatown.js runs their routines).
  'vr-player-a':['idle','vr-aim','vr-aim-up','vr-aim-down','vr-shoot','vr-hit','vr-duck','walk'],'vr-player-b':['idle','dance','pickup','interact','menu','menu-tap','talk','walk'],   // walk: grafted 17 Nov 2026 (tools/animation-pipeline/graft_clip.py), for stepping out of the booth
  // Dax (dax.js): a licensed model, published with the live site only.
  'npc-kai':['idle','talk','walk','sit','sit-enter','sit-exit','sit-talk','dance','interact','idle-m2','blow-kiss','head-tilt','laugh','glance-back','slow-dance','dance-samba','sit-relax','sit-wave','shrug','recline'],   // Kai's own model (Meshy, 16 Nov 2026): the clips of the old Kai figure, retargeted
  'npc-luna':['idle','talk','walk','sit','sit-enter','sit-exit','sit-talk','dance','interact','idle-f2','walk-f','wave','blow-kiss','coy','head-tilt','hips','laugh','glance-back','slow-dance','dance-belly','sit-relax','sit-wave','shrug','recline'],   // Luna's own model (the owner's Meshy dancer, made standing and rigged 21 Nov 2026; a female companion): the female companion clips (vr-companion-f), retargeted. VR bedroom only: never a street, crowd or floor-pose figure
  'npc-zane':['idle','talk','walk','sit','sit-enter','sit-exit','sit-talk','dance','interact','idle-m2','blow-kiss','head-tilt','laugh','glance-back','slow-dance','dance-samba','sit-relax','sit-wave','shrug','recline'],   // Zane's own model (Meshy, 18 Nov 2026; the second male companion): Kai's clips, retargeted the same way
  'npc-fish':['idle','talk','walk','look','watch','sit','smoke','drink','laugh','shrug'],   // Fish, Milked's owner: her own model (Meshy, 16 Nov 2026)
  'npc-dax':['idle','talk','look','watch','walk','glance-back','shrug'],
  // Nomi and Se7en (tea-duo.js; the owner's own models from his Companion Studio packages, licensed, private .vrpak): the seven clips each package carries plus the female companion clip set retargeted onto them (23 Nov 2026, tools/animation-pipeline/prepare_nomi_se7en.py), embedded in the model.
  'npc-nomi':['idle','talk','walk','sit','sit-enter','sit-exit','run','sit-talk','sit-relax','sit-wave','coy','head-tilt','laugh','blow-kiss','glance-back','recline','shrug','interact','idle-f2','wave','hips','dance','slow-dance','dance-belly','idle-f','talk-f'],'npc-se7en':['idle','talk','walk','sit','sit-enter','sit-exit','run','sit-talk','sit-relax','sit-wave','coy','head-tilt','laugh','blow-kiss','glance-back','recline','shrug','interact','idle-f2','wave','hips','dance','slow-dance','dance-belly','idle-f','talk-f'],
  // Characters made with Meshy from the owner's reference pictures (docs/development/MESHY_CHARACTERS.md): one skinned mesh each on a 24-joint skeleton (no fingers).
  'npc-admin':['idle','talk','walk','look','shrug'],'npc-iris':['idle','talk','walk','look','shrug'],
  'npc-nyx':['idle','talk','walk','look','watch','laugh','shrug','wipe'],   // Nyx, the District's bartender: her own model (Meshy, 16 Nov 2026)
  // The named District residents' own models (district-people.js `own`).
  'npc-rin':['idle','talk','walk','look','watch','sit','smoke','drink','laugh','shrug'],'npc-jonah':['idle','talk','walk','look','watch','sit','smoke','drink','laugh','shrug'],'npc-sable':['idle','talk','walk','look','watch','sit','smoke','drink','laugh','shrug'],'npc-kei':['idle','talk','walk','look','watch','sit','smoke','drink','laugh','shrug'],'npc-mags':['idle','talk','walk','look','watch','sit','smoke','drink','laugh','shrug'],'npc-tavi':['idle','talk','walk','look','watch','sit','smoke','drink','laugh','shrug'],'npc-bishop':['idle','talk','walk','look','watch','sit','smoke','drink','laugh','shrug'],
  // The monks (Meshy, 18 Nov 2026, from the owner's reference picture of three monks; docs/development/MESHY_CHARACTERS.md): the elder in saffron, the tech monk, the grey monk.
  // On the streets more of them toward the East Gate (ncz-nightlife.js monkShare); at the Temple most people are monks (temple-build.js).
  'npc-monk-elder':['idle','talk','walk','look','watch','sit'],'npc-monk-tech':['idle','talk','walk','look','watch','sit'],'npc-monk-grey':['idle','talk','walk','look','watch','sit'],
  // The Avenue's street pair (ncz-street-pair.js; the owner's own Meshy generations, remade standing in an A-pose and rigged 18 Nov 2026): the same casual street
  // library for both (VoidStreetPair.CLIP_LIST; never sensual, flirt or club clips). The street cat (npc-street-cat) is moved by code and has no clips.
  // VR arcade companions (vr-suite.js).
  'studio-warrior':['slow-dance','dance','idle'],'npc-milked-auburn':['idle','dance','dance-allnight','dance-shake','dance-lovepop','dance-denim','dance-omg'],   /* her five Meshy library club dances (18 Nov 2026, the owner: "she just swaying a little") */   // Milked studio 4's dancer Auburn (the owner's Meshy model, 18 Nov 2026): vr-player-b's dance and idle, retargeted   // Milked studio 2's dancer (licensed Female Warrior, private .vrpak; 18 Nov 2026)
  'vr-companion-f':['idle','talk','walk','sit','sit-enter','sit-exit','sit-talk','dance','interact','idle-f2','walk-f','wave','blow-kiss','coy','head-tilt','hips','laugh','glance-back','slow-dance','dance-belly','sit-relax','sit-wave','shrug','recline'],'vr-companion-fc1':['idle','talk','walk','sit','sit-enter','sit-exit','sit-talk','dance','interact','idle-f2','walk-f','wave','blow-kiss','coy','head-tilt','hips','laugh','glance-back','slow-dance','dance-belly','sit-relax','sit-wave','shrug','recline'],
  'vr-companion-ava':['idle','talk','walk','sit','sit-enter','sit-exit','sit-talk','dance','interact','idle-f2','walk-f','wave','blow-kiss','coy','head-tilt','hips','laugh','glance-back','slow-dance','dance-belly','sit-relax','sit-wave','shrug','recline'],'vr-companion-pg':['idle','talk','walk','sit','sit-enter','sit-exit','sit-talk','dance','interact','idle-f2','walk-f','wave','blow-kiss','coy','head-tilt','hips','laugh','glance-back','slow-dance','dance-belly','sit-relax','sit-wave','shrug','recline'],'vr-companion-una':['idle','talk','walk','sit','sit-enter','sit-exit','sit-talk','dance','interact','idle-f2','walk-f','wave','blow-kiss','coy','head-tilt','hips','laugh','glance-back','slow-dance','dance-belly','sit-relax','sit-wave','shrug','recline'],'vr-companion-bf':['idle','talk','walk','sit','sit-enter','sit-exit','sit-talk','dance','interact','idle-f2','walk-f','wave','blow-kiss','coy','head-tilt','hips','laugh','glance-back','slow-dance','dance-belly','sit-relax','sit-wave','shrug','recline'],'vr-companion-bm':['idle','talk','walk','sit','sit-enter','sit-exit','sit-talk','dance','interact','idle-f2','walk-f','wave','blow-kiss','coy','head-tilt','hips','laugh','glance-back','slow-dance','dance-belly','sit-relax','sit-wave','shrug','recline','dance-hiphop','dance-hiphop-2','dance-hiphop-3','dance-groove','dance-bass','dance-samba'],   /* Dex: + six men's dances for Milked studio 3, retargeted locally onto his rig (18 Nov 2026) */'vr-companion-m':['idle','talk','walk','sit','sit-enter','sit-exit','sit-talk','dance','interact','idle-m2','blow-kiss','head-tilt','laugh','glance-back','slow-dance','dance-samba','sit-relax','sit-wave','shrug','recline']
 };
 // Each place has its own feel; the order spreads looks across a scene's crew.
 const frontierMix=['vesper-mechanic','regular-01','vesper-pilot','communion-worker','outlaw-01'];
 const casts={
  vesper:['vesper-mechanic','vesper-trader','vesper-pilot'],                       // Outer Rim desert frontier
  meridian:['hacker-01','vesper-trader','fixer-01','outlaw-01','cyborg-01','regular-01'], // everyone passes through
  kepler:frontierMix,foundry:frontierMix,'sol-belt':frontierMix,mars:frontierMix,
  rusthaven:['outlaw-01','district-smuggler','vesper-trader','regular-01'],          // pirates and outlaws
  vigil:['communion-worker','communion-tech','cyborg-01'],nexus:['communion-worker','communion-tech','cyborg-01'],
  holdfast:['order-farmhand','order-militia','order-grower'],'order-homeworld':['order-farmhand','order-grower','order-militia','vesper-mechanic'],
  neochinatown:['npc-casual-f','npc-office-m'],        // street crowd (the street's standing crew; the walkers: ncz-nightlife.js). Before 18 Nov 2026: ncz-neon, fixer-01, runner-02, communion-tech
  district:['npc-hacker','npc-lookout','npc-fixer','npc-enforcer','npc-merc','npc-student','npc-cyber-bouncer','npc-cyber-samurai']   // The Darknet District (before 18 Nov 2026: hacker-01, district-smuggler, district-resident, outlaw-01)
 };
 // The monks' looks (ncz-nightlife.js deals them to the street's monks; temple-build.js to the Temple's).
 const monks=['npc-monk-elder','npc-monk-tech','npc-monk-grey'];
 // The street people (NPC upgrade, 18 Nov 2026: docs/development/NPC_UPGRADE.md): 25 figures made with Meshy from the owner's approved concept pictures, one skinned mesh
 // each on the 24-joint skeleton, rigged and given the street's clips (the crowd's own walk, sit-down, drunk and dance clips grafted from the old looks). They replace the
 // anonymous MakeHuman figures on NeoChinatown's streets and in the District (`replaced` below; the old files stay for the off-world places and named characters built on them).
 // n: the concept number; roles: where they belong (placement below and in ncz-nightlife.js). Each wears one of 2-4 colour variants (npc-variants.js).
 const STREET_CLIPS=['idle','talk','walk','look','watch','sit','smoke','drink','laugh','shrug','sit-enter','sit-exit','sit-talk','interact','drunk-walk','drunk-idle','drunk-sway','dance'];
 const street={
  'npc-office-f':{n:1,sex:'f',roles:['mixed','corporate']},'npc-office-m':{n:2,sex:'m',roles:['mixed','corporate','drunk']},'npc-security':{n:3,sex:'m',roles:['corporate'],extra:['vr-aim','vr-aim-up','vr-aim-down','vr-shoot','vr-hit','vr-duck']},
  'npc-executive':{n:4,sex:'f',roles:['corporate']},'npc-cook-old':{n:5,sex:'m',roles:['cook']},'npc-courier':{n:6,sex:'f',roles:['mixed','district','outskirts']},'npc-cook-f':{n:7,sex:'f',roles:['cook']},
  'npc-club-f':{n:8,sex:'f',roles:['club','drunk'],extra:['pickup','menu','menu-tap']},'npc-club-m':{n:9,sex:'m',roles:['club','drunk','district']},'npc-hacker':{n:10,sex:'m',roles:['mixed','club','district','drunk']},
  'npc-merc':{n:11,sex:'f',roles:['mixed','district']},'npc-veteran':{n:12,sex:'m',roles:['mixed','outskirts','drunk']},'npc-fixer':{n:13,sex:'m',roles:['mixed','district']},'npc-vendor':{n:14,sex:'f',roles:['vendor']},
  'npc-student':{n:15,sex:'f',roles:['mixed','club','district']},'npc-tourist':{n:16,sex:'m',roles:['mixed']},'npc-medic':{n:17,sex:'f',roles:['mixed']},'npc-enforcer':{n:19,sex:'m',roles:['mixed','club','district','drunk']},
  'npc-lookout':{n:20,sex:'f',roles:['mixed','club','district']},'npc-outskirts-f':{n:21,sex:'f',roles:['outskirts']},'npc-outskirts-m':{n:22,sex:'m',roles:['outskirts']},'npc-elder-f':{n:23,sex:'f',roles:['mixed','outskirts']},
  'npc-busker':{n:24,sex:'m',roles:['busker','drunk']},'npc-casual-f':{n:26,sex:'f',roles:['mixed','club','outskirts','creator']},'npc-casual-m':{n:27,sex:'m',roles:['mixed','outskirts','creator']},
  // The cyberpunk figures (19 Nov 2026, docs/development/NPC_UPGRADE.md "The cyberpunk figures"): six more Meshy figures with visible cybernetics and layered techwear, also the creator's CYBERPUNK PRESETS.
  'npc-cyber-samurai':{n:28,sex:'m',roles:['mixed','district','club','creator'],cyber:true},'npc-cyber-exec':{n:29,sex:'f',roles:['corporate','creator'],cyber:true},
  'npc-cyber-respirator':{n:30,sex:'m',roles:['mixed','district','outskirts','creator'],cyber:true},'npc-cyber-pvc':{n:31,sex:'f',roles:['club','mixed','creator'],cyber:true},
  'npc-cyber-bouncer':{n:32,sex:'m',roles:['club','district','creator'],cyber:true},'npc-cyber-courier':{n:33,sex:'f',roles:['mixed','district','creator'],cyber:true}};
 for(const [id,f] of Object.entries(street))clips[id]=[...STREET_CLIPS,...(f.extra||[])];
 /* FLOOR POSES (21 Nov 2026, the owner: "can you add kneeling and cross-legged pose? add them to any npc that has the correct skeleton. also a sitting knee to chest pose"):
    posed by code on every figure here with the shared mixamorig skeleton (tools/animation-pipeline/make_floor_poses.py). Not the VR companions' figures (Kai, Zane, Luna and the
    companion files: their own rules) nor the licensed files kept outside this repository. The figure's origin goes on the floor / cushion / cot top (the seat's height). */
 const FLOOR=['floor-kneel','floor-cross','floor-knees'],NO_FLOOR=/^(vr-companion|npc-kai$|npc-zane$|npc-luna$|npc-dax$|studio-warrior$|npc-nomi$|npc-se7en$)/;
 /* With them, sitting down to each and standing up from it (21 Nov 2026, one-shot, posed by code the same way; the '-hi' pairs from the edge of a cot or a bench):
    played by the seat runtime (ncz-street-pair.js FLOOR_MOVE), never offered as a choice in the editors (npc-gestures.js NO). */
 const FLOOR_MOVES=['kneel','cross','knees'].flatMap(p=>['floor-'+p+'-down','floor-'+p+'-up']).concat(['cross','knees'].flatMap(p=>['floor-'+p+'-down-hi','floor-'+p+'-up-hi']));
 for(const k of Object.keys(clips))if(!NO_FLOOR.test(k))clips[k]=[...clips[k],...FLOOR,...FLOOR_MOVES];
 const pool=role=>Object.keys(street).filter(id=>street[id].roles.includes(role));
 const pools={mixed:pool('mixed'),corporate:pool('corporate'),club:pool('club'),cook:pool('cook'),outskirts:pool('outskirts'),drunk:pool('drunk'),district:pool('district'),vendor:pool('vendor'),busker:pool('busker')};
 // The old anonymous looks and who now stands in their place (code that still names an old look, a crowd member of an old build, a saved id: swap(look)).
 // vr-player-a/b are the VR booth players Cade and Lumi (district-people.js `figure`); vr-player-b also stays Milked studio 4's dancer (not part of this upgrade).
 const replaced={'district-resident':'npc-casual-f','regular-01':'npc-office-m','ncz-neon':'npc-club-f','fixer-01':'npc-executive','runner-02':'npc-courier','hacker-01':'npc-hacker','outlaw-01':'npc-enforcer',
  'district-smuggler':'npc-fixer','cyborg-01':'npc-merc','communion-tech':'npc-medic','vr-player-a':'npc-security','vr-player-b':'npc-club-f'};
 const swap=look=>replaced[look]||look;
 /* Where each kind of person is (pure, tests/npc-upgrade.test.cjs). The weight of a look at a point of the city: corporate types toward the Function Gate (the Avenue's west
    end, x 6), club-goers round NULL's door, the Outskirts' own people in the Outskirts, everyone else mixed through the streets. Monks are dealt separately (monkShare). */
 const ZONES={functionGate:[6,-12.5],corpFar:70,nullDoor:[50.5,-58.5],clubNear:8,clubFar:34};
 const clamp01=v=>Math.max(0,Math.min(1,v));
 function weightAt(look,x,z,quarter){const f=street[look];if(!f)return 0;const r=f.roles;
  if(quarter==='outskirts')return r.includes('outskirts')?(look.startsWith('npc-outskirts')?6:1.5):r.includes('mixed')?.25:0;
  if(!r.includes('mixed')&&!r.includes('corporate')&&!r.includes('club'))return 0;   // cooks, the vendor, the busker and the Outskirts' poor have their own spots
  const corp=quarter==='avenue'||quarter==null?clamp01(1-(Math.hypot(x-ZONES.functionGate[0],z-ZONES.functionGate[1])-10)/(ZONES.corpFar-10)):0,
   club=clamp01(1-(Math.hypot(x-ZONES.nullDoor[0],z-ZONES.nullDoor[1])-ZONES.clubNear)/(ZONES.clubFar-ZONES.clubNear));
  const m=r.includes('mixed');let w=m?1:0;if(r.includes('corporate'))w+=m?.2+3*corp:.12+4.5*corp;if(r.includes('club'))w+=m?1.2*club:.15+6*club;return w;}   // the specialists (the security contractor, the executive, the two club-goers) most where they belong
 const unit=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}h^=h>>>15;h=Math.imul(h,2246822507);h^=h>>>13;return ((h>>>0)+.5)/4294967296;};
 /* The looks to try for one person at (x,z), best first: a weighted order without repeats, fixed by `key` (their id), so the same person always has the same face. */
 function orderAt(x,z,quarter,key,looks=Object.keys(street)){return looks.map(l=>({l,w:weightAt(l,x,z,quarter)})).filter(o=>o.w>0).map(o=>({l:o.l,k:Math.pow(unit(key+'|'+o.l),1/o.w)})).sort((a,b)=>b.k-a.k).map(o=>o.l);}
 /* Which street figures a quarter downloads (background, as the monks): the quarter's own kinds first, then the mixed crowd, capped per quality so Low downloads fewer files. */
 const QUARTER_KINDS={oldtown:['club'],'far-south':[],avenue:['corporate'],outskirts:['outskirts'],port:[]},SPOTS={oldtown:['cook','vendor','busker'],'far-south':['cook','vendor'],avenue:['cook','busker'],outskirts:[],port:[]};
 const STREET_CAP={low:8,medium:14,high:31,ultra:31},CORE=['npc-casual-f','npc-office-m','npc-security'];   // CORE: always there (the street's standing crew, casts.neochinatown; the private gates' guards, ncz-gates.js)
 function streetFigures(quarter,quality='medium'){const cap=STREET_CAP[quality]??STREET_CAP.medium,set=new Set(CORE),add=l=>{if(set.size<cap)set.add(l);};
  for(const k of quarter?SPOTS[quarter]||[]:['cook','vendor','busker'])pools[k].forEach(l=>set.add(l));   // the cooks, the vendor and the busker have fixed spots: always theirs
  for(const k of quarter?QUARTER_KINDS[quarter]||[]:['corporate','club','outskirts'])[...pools[k]].sort((x,y)=>(street[x].roles.includes('mixed')?1:0)-(street[y].roles.includes('mixed')?1:0)||(street[y].cyber?1:0)-(street[x].cyber?1:0)).forEach(add);   // the quarter's own kinds, the specialists first, then the cyberpunk figures
  [...pools.mixed].sort((x,y)=>(street[y].cyber?1:0)-(street[x].cyber?1:0)||unit('fill|'+x)-unit('fill|'+y)).forEach(add);return [...set];}   // the cyberpunk figures (19 Nov 2026) first in the mixed fill
 /* Dresses a placed street figure in its colour variant (npc-variants.js), chosen from `key` so neighbours differ and a person keeps theirs. */
 function dress(node,look,key,variant){const V=typeof module!=='undefined'&&module.exports?null:root.VoidNPCVariants;if(!V||!street[look])return null;return V.apply(node,look,variant||V.pick(look,key));}
 // NeoChinatown and The Darknet District share one scene; these crew belong to the District.
 const districtCrew=/^crew-(vr|bar|smoke)/;
 // Behind each bar: Meridian's own bartender; elsewhere a local look (they polish and pour with the reach move).
 const staff={meridian:['meridian-bartender'],kepler:['regular-01'],rusthaven:['outlaw-01'],foundry:['fixer-01'],'sol-belt':['regular-01'],vigil:['cyborg-01'],holdfast:['order-militia']};
 function castFor(location,id){if(id==='crew-bartender')return staff[location]||null;return location==='neochinatown'&&districtCrew.test(id)?casts.district:casts[location]||null;}
 function hash(s){let h=7;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;return h;}
 function clipFor(id){
  if(/smoke/.test(id))return 'smoke';
  if(/crew-vr|patient|-sit/.test(id))return 'sit'; // VR chairs, the couch, cots, stools
  if(/pray|watch/.test(id))return 'watch';
  if(/repair|work/.test(id))return 'work';
  if(/farm/.test(id))return Number(id.replace(/\D/g,''))%2?'work':'watch';
  if(/teach|learn|medic|bar|talk/.test(id))return 'talk';
  return ['idle','talk','watch'][hash(id)%3];
 }
 // Which station activity state plays which clip (Meridian's moving crew).
 const activityClip={sit:'sit',drink:'sit',device:'sit','talk-seated':'sit-talk','sit-down':'sit',stand:'idle',talk:'talk',window:'look',terminal:'typing',browse:'watch','get-drink':'idle',waiting:'idle',idle:'idle',
  serve:'talk',wipe:'wipe',pour:'wipe',shelf:'idle'};
 // One-shot moves played on entering a state: [move, then loop].
 const onceClip={'sit-down':['sit-enter','sit'],stand:['sit-exit','idle'],'get-drink':['interact','idle'],terminal:['interact','typing'],browse:['interact','watch'],pour:['pickup','wipe'],shelf:['interact','idle']};
 // Now and then a figure breaks its loop with a one-off that suits it (a laugh in conversation, a drink and a sway
 // at the bar); only clips the look actually carries are used.
 const variety={talk:['laugh','drink'],idle:['laugh','drink'],watch:['laugh'],'sit-talk':['laugh']};
 const varietyFor=(look,base)=>(variety[base]||[]).filter(c=>(clips[look]||[]).includes(c));
 // A look without a clip falls back to the nearest one it has, then to idle.
 const fallback={look:'watch','sit-talk':'sit','sit-wave':'sit',typing:'watch',wipe:'interact',pickup:'interact'};   // sit-wave: a seated wave falls back to sitting (20 Nov 2026: street figures seated by the made-giver runtime stood up to wave)
 function clipIn(look,want){const have=clips[look]||[];for(let w=want;w;w=fallback[w])if(have.includes(w))return w;return 'idle';}
 // Model definitions to preload for a place, at every quality (the owner, 2026-10-28: no primitive stand-ins on the
 // street). Low quality simply has fewer people (ncz-nightlife.js).
 function models(location,quality,area='all',quarter=null){
  if(!casts[location])return {};
  // area: NeoChinatown's street and the District interior are separate environments; each needs only its own people.
  const set=new Set(area==='interior'&&location==='neochinatown'?[]:[...casts[location],...(staff[location]||[])]);if(location==='neochinatown'&&area!=='interior'){monks.forEach(l=>set.add(l));   /* the street's monks (ncz-nightlife.js) */streetFigures(quarter,quality).forEach(l=>set.add(l));}   /* the street people of this quarter (ncz-nightlife.js, ncz-outskirts-life.js, NULL) */if(location==='neochinatown'&&area!=='street')casts.district.forEach(l=>set.add(l));
  // Dedicated food stand figures use their measured apron and seat rigs; do not replace the newer street cast.
  if(location==='neochinatown'&&area!=='interior'){const F=typeof module!=='undefined'?require('./ncz-food-stands.js'):root.VoidFoodStands,stand=F?.STANDS[quarter];if(stand){set.add(stand.look);set.add('fixer-01');}}
  // Background: a figure that isn't downloaded within the scene's few seconds keeps loading and is
  // swapped in when it arrives (asset-pipeline.js), instead of being dropped for the procedural crew.
  // The named residents' own models are loaded with the District's people, so each is there when their spot is filled; if one fails, a look of the place stands in (babylon-renderer.js).
  if(location==='neochinatown'&&area!=='street')for(const n of people()?.NPCS||[])if(n.own&&n.crew&&n.area==='interior'&&clips[n.own])set.add(n.own);
  return Object.fromEntries([...set].map(l=>['crowd:'+l,{src:base+l+'.glb',background:true}]));
 }
 // Looks are dealt round-robin per place so neighbours differ, skipping looks without the clip that spot needs.
 let dealt=new Map();
 const people=()=>typeof module!=='undefined'&&module.exports?require('./district-people.js'):root.VoidDistrictPeople;
 function begin(){dealt=new Map();}
 function pick(location,id,clip=clipFor(id)){const cast=castFor(location,id);if(!cast)return null;const named=people()?.lookFor?.(id);if(named&&clips[named]?.includes(clip))return named;   /* a named District resident keeps one face (district-people.js) */const key=cast===casts.district?'district':location,n=dealt.get(key)||0;dealt.set(key,n+1);for(let i=0;i<cast.length;i++){const look=cast[(n+i)%cast.length];if(clips[look].includes(clip))return look;}return cast[n%cast.length];}

 // Browser side: one controller per figure, playing a clip from its own cloned animation groups.
 const groups=new Set(),controllers=new Set();let made=0;
 const ctrls=new WeakMap();   // the animation controller of each figure, for scripts that move a figure the scene already placed (district-life.js)
 function animate(node,look,clip){const made=animate_(node,look,clip);if(made)ctrls.set(node,made);return made;}
 function animate_(node,look,clip){
  const list=node.metadata?.animationGroups||[];list.forEach(g=>groups.add(g));
  const bones={};for(const t of node.getDescendants(false))for(const b of ['LeftUpLeg','RightUpLeg','LeftLeg','RightLeg','LeftArm','RightArm'])if(t.name.endsWith('mixamorig:'+b)&&t.rotationQuaternion)bones[b]={node:t,rest:t.rotationQuaternion.clone()};
  const speed=.9+(hash(node.name)%20)/100;let current=null,named=clip,walking=false,active=true,culled=false,held=false,heldAt=0,heldFor=0,heldN=0,disposed=false;
  // A figure animates only while its owner wants it to (setActive) AND it is not hidden behind a building or out of view (setCulled, street-sight.js).
  const live=()=>active&&!culled;
  // Clips cross-fade instead of snapping.
  for(const g of list){g.enableBlending=true;g.blendingSpeed=.06;}
  const groupFor=name=>list.find(g=>g.name===name||g.name.endsWith('-'+name))||list.find(g=>g.name.replace(/\.\d{3}$/,'').endsWith('-'+name));   /* Blender names a second clip of the same name walk.001 (Dax's walk): without this she slid along in her idle */
  // Moving crew call this every frame. It must leave a clip that is already playing alone: group names carry
  // the figure's prefix (crowd:look-walk), so compare the group itself, never the bare clip name. Comparing
  // names restarted the clip each frame and froze it on one pose while the figure slid along.
  // Shared actions are bound on first explicit use. Ambient selection still uses the native catalog.
  let requested=null;const unavailable=new Set();
  function loadShared(name){
   const L=root.VoidAnimLibrary,src=L?.clip?.(name),m=/^([a-z0-9-]+)\/([a-z0-9-]+)$/.exec(name);
   if(!src&&!m)return false;
   if(src?.library==='sexyzips'){
    const P=root.VoidNPCPaths,M=P?.MOVABLE[node.metadata?.character];
    if(M?(!M.adult||M.youthful):!P?.ADULT.test(look))return false;
   }
   if(m&&!clips[m[1]]?.includes(m[2]))return false;
   if(unavailable.has(name))return false;if(requested===name)return true;requested=name;
   root.VoidNPCPaths?.applyAnims(node,look,[name]).then(added=>{
    if(!added.includes(name))unavailable.add(name);if(!disposed&&requested===name){requested=null;if(added.includes(name)&&groupFor(name))play(name);}
   }).catch(()=>{if(requested===name)requested=null;});return true;
  }
  function play(name){
   if(disposed)return;if(perf){perf.wanted=name;return;}if(!groupFor(name)&&loadShared(name))return;requested=null;name=groupFor(name)?name:clipIn(look,name);const next=groupFor(name)||list[0];if(!next)return;named=name;
   if(current===next&&!walking&&!once)return;walking=false;once=null;
   for(const g of list)if(g!==next)g.stop();
   next.start(true,speed,next.from,next.to);next.goToFrame(next.from+(next.to-next.from)*((hash(node.name+name)%100)/100));current=next;held=false;if(!live())next.pause();
  }
  // A one-shot clip (sitting down, standing up, reaching), then `after` (a clip name) loops. Returns its length in
  // seconds, or 0 if the figure lacks it (the caller then just switches clips).
  let once=null;
  function playOnce(name,after){
   if(disposed)return 0;if(perf){if(after)perf.wanted=after;return 0;}
   const g=groupFor(name);if(!g){if(after)play(after);return 0;}
   // Claim the figure first: stopping the previous one-shot fires its end handler, which must not start another clip.
   walking=false;current=g;once=g;held=false;for(const o of list)if(o!==g)o.stop();
   g.start(false,1,g.from,g.to);g.onAnimationGroupEndObservable.addOnce(()=>{if(!disposed&&!node.isDisposed?.()&&once===g){once=null;if(after)play(after);}});
   if(!live())g.pause();return (g.to-g.from)/(g.animatables[0]?.animation?.framePerSecond||g.targetedAnimations[0]?.animation.framePerSecond||15);
  }
  // Walking plays the Quaternius walk loop (CC0). A look without it holds the idle clip's first pose (arms down)
  // and swings its legs and arms from there.
  function walk(time){requested=null;
   if(perf){perf.wanted='walk';return;}if(clipIn(look,'walk')==='walk'){play('walk');return;}
   const B=root.BABYLON;
   if(!walking){const idle=list.find(g=>g.name==='idle'||g.name.endsWith('-idle'))||list[0];for(const g of list)if(g!==idle)g.stop();
    if(idle){idle.start(false,1,idle.from,idle.to);idle.goToFrame(idle.from);idle.pause();}current=null;walking=true;held=false;
    for(const b of Object.values(bones))b.base=b.node.rotationQuaternion.clone();}
   const s=Math.sin(time*5.2),bend=x=>Math.max(0,x)*.55;
   const swing=(b,angle)=>{const k=bones[b];if(k?.base)k.node.rotationQuaternion.copyFrom(k.base.multiply(B.Quaternion.RotationAxis(B.Axis.X,angle)));};
   swing('LeftUpLeg',s*.36);swing('RightUpLeg',-s*.36);swing('LeftLeg',bend(-Math.sin(time*5.2+1.3)));swing('RightLeg',bend(Math.sin(time*5.2+1.3)));swing('LeftArm',-s*.18);swing('RightArm',s*.18);
  }
  /* A clip asked for by a mission line or an animation step (npc-gestures.js): it plays for `seconds` (a one-movement clip once, at most `seconds`), while the scene's own
     calls (play / playOnce / walk) wait; then the clip the scene wanted last (or the one playing before) comes back. Returns the seconds it will take, or 0. */
  let perf=null;
  function perform(name,{seconds=3,once:one=false}={}){requested=null;
   if(disposed)return 0;const g=groupFor(name);if(!g)return 0;const prev=perf?perf.wanted:named;if(perf)clearTimeout(perf.timer);
   walking=false;once=null;held=false;for(const o of list)if(o!==g)o.stop();g.start(!one,1,g.from,g.to);current=g;if(!live())g.pause();
   const len=(g.to-g.from)/(g.targetedAnimations[0]?.animation?.framePerSecond||30),secs=Math.max(.5,Math.min(30,one?Math.min(len,Math.max(seconds,len)):seconds));
   const me={clip:name,wanted:prev,until:performance.now()+secs*1000};me.timer=setTimeout(()=>{if(perf!==me)return;perf=null;if(disposed||node.isDisposed?.())return;current=null;const w=me.wanted||'idle';if(w==='walk')walk(0);else play(w);},secs*1000);perf=me;return secs;}
  function gate(){held=false;if(!live()){for(const g of list)g.pause();}else if(current)current.play(current.loopAnimation);}
  function setActive(value){if(disposed||active===value)return;const was=live();active=value;if(was!==live())gate();}
  function setCulled(value){value=!!value;if(disposed||culled===value)return;const was=live();culled=value;if(was!==live())gate();}
  // Far-away figures (street-sight.js): lod(n, seconds since the last call) once a frame. With n>1 the playing loop is held and moved on by hand every nth frame,
  // at the same speed, so the figure costs 1/n of the animation work. One-off moves, the hand-swung walk and paused figures are left alone; lod(1) hands the clip back.
  function lod(n,dt){
   if(disposed)return;
   if(!(n>1)||!live()||!current||once||walking||perf){if(held){held=false;if(live()&&current)current.play(current.loopAnimation);}return;}
   if(!held){const a=current.animatables?.[0];if(!a)return;held=true;heldAt=a.masterFrame;heldFor=0;heldN=serial%n;current.pause();}
   heldFor+=dt;if(++heldN%n)return;
   const span=current.to-current.from;if(!(span>0))return;const fps=current.targetedAnimations[0]?.animation.framePerSecond||30;
   heldAt=current.from+(((heldAt-current.from+heldFor*fps*speed)%span)+span)%span;heldFor=0;current.goToFrame(heldAt);
  }
  function dispose(){if(disposed)return;disposed=true;once=null;if(perf){clearTimeout(perf.timer);perf=null;}for(const g of list){groups.delete(g);g.stop();}controllers.delete(api);}
  const serial=made++,api={play,playOnce,walk,look,node,setActive,setCulled,lod,dispose,has:name=>clipIn(look,name)===name,perform,get performing(){return perf?perf.clip:null;},get busy(){return !!once||!!perf;},get clip(){return named;},get active(){return active;},get culled(){return culled;},get held(){return held;}};
  controllers.add(api);node.onDisposeObservable?.addOnce(dispose);play(clip);return api;
 }
 function release(){for(const c of [...controllers])c.dispose();groups.clear();}

 const api={casts,staff,clips,FLOOR,FLOOR_MOVES,monks,street,pools,replaced,swap,weightAt,orderAt,streetFigures,dress,STREET_CLIPS,ZONES,STREET_CAP,SPOTS,castFor,clipFor,activityClip,onceClip,clipIn,models,begin,pick,animate,controller:node=>ctrls.get(node)||null,figures:()=>controllers,release,variety,varietyFor};
 if(typeof module!=='undefined')module.exports=api;else root.VoidCrowd=api;
})(globalThis);
