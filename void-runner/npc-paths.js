/* NPC PLACEMENT, PATHS AND "GIVER WAITS AT" (pure data and rules: browser and Node tests; no network, no DOM). The owner, 18 Nov 2026: "Another tab inside developer
   tools for editing NPCs, adding givers, a preview, NPC paths and actions", "can I maybe move the npc around on the map and save them in a location. If they have routes can
   I change them or make them stay?", and the approved "Giver waits at" option for Reverie and Lace.
   What an editor PLAN is (content.npcs[id], made in Developer Tools > NPCs, saved as a draft, played with PLAY THIS DRAFT, published like missions, checked by the server):
     no entry                      the NPC's own routine (for Reverie and Lace: walking their stretch of The Avenue, sitting on the ledges, the cat ...)
     {mode:'stay', x, z, yaw, actions:[...]}   she stays at that spot facing `yaw` (radians, 0 = north/+z) and cycles the actions there (idle, look, V1 ...)
     {mode:'path', points:[{x, z, action, seconds}, ...]}   she walks the points in order, does each point's action for `seconds`, and starts again at the first
   A mission's "Giver waits at" (mission.waitAt {x, z, yaw}): while that mission is waiting to be offered by her (and she is out), she stands there instead (a stay with
   her ordinary standing routine; a spot in front of a ledge also lets her sit); once it is accepted or done she goes back to her plan or routine.
   WHO can be moved: only NPCs whose figure is moved by code that follows a plan (MOVABLE): today Reverie and Lace (ncz-street-pair.js). Everyone else is listed with
   the plain reason why not (fixed in a building, moved by another scene's own code, or anonymous crowd walkers drawn from a pool).
   WHERE: the walkable area of each movable NPC (AREAS): for the street pair the north pavement of The Avenue between its two gates (the side they live on: crossing the
   road would put them in front of the taxis), clear of the taxi posts. The ledges are there to sit on. Every spot and every leg of a path is checked here; the server
   repeats the same check from the admin inventory (void_runner_live_content.py). The CLIPS an action may use come from that NPC's own clip list (crowd.js, via
   VoidStreetPair.CLIP_LIST) and never a banned one (VoidStreetPair.BANNED: nothing sensual, flirtatious or from the clubs for these two). No voices are ever assigned. */
(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports;
 const SP=()=>node?require('./ncz-street-pair.js'):root.VoidStreetPair;
 const QT=()=>node?require('./ncz-quarters.js'):root.VoidQuarters;
 // WHERE (the owner, 19 Nov 2026: "Let me place REVERIE or LACE anywhere"): every walkable area of the city and the District interior, with the content rule (npc-areas.js).
 const AR=()=>node?require('./npc-areas.js'):root.VoidNPCAreas;
 // The Avenue's north pavement (neochinatown.js: the shopfront wall at z -5, a 3 m pavement, the road from z -8): a little clear of the wall and the kerb, and short of the
 // Function Gate (x 10) and the East Gate (x 144). Taxi posts (ncz-quarters.js STOPS post) are kept clear by `post` metres.
 const AVENUE_NORTH={id:'avenue-north',name:'The Avenue, north pavement',quarter:'avenue',x0:12.5,x1:141.5,z0:-7.6,z1:-5.8,post:.7};
 /* Street furniture on that pavement: the taxi poles along the kerb, [x0, x1, z0, z1] in metres (read from the built city, tests/npc-obstacles-browser.cjs). Kept clear by
    `clear` metres (her body). (20 Nov 2026) The ad screens' kerb stands are gone: the screens hang on the walls now (ad-screens-data.js MOUNT). */
 const OBSTACLES=[[19.63,20.13,-7.9,-7.5,'the taxi pole'],[39.88,40.13,-7.9,-7.5,'the taxi pole'],[133.63,134.13,-7.9,-7.5,'the taxi pole']],CLEAR=.3;
 const inBox=(p,o,m=CLEAR)=>p.x>o[0]-m&&p.x<o[1]+m&&p.z>o[2]-m&&p.z<o[3]+m;
 const posts=()=>((QT()&&QT().STOPS)||[]).filter(s=>s.quarter==='avenue'&&Array.isArray(s.post)).map(s=>({x:s.post[0],z:s.post[1],id:s.id}));
 const ledges=()=>{const S=SP();return ((S&&S.STEPS)||[]).map(st=>({id:st.id,x:st.x,z:st.z,w:st.w,d:st.d,front:S.frontOf(st)}));};
 /* Movable NPCs. asset: the crowd file (crowd.js clips[asset] is the clip list); device: the npc-device.js poses they use. */
 const MOVABLE={'grey-reverie':{name:'Reverie',asset:'npc-grey-reverie',area:'city',quarter:'avenue',device:true,sit:true,youthful:true},
  'ethereal-lace':{name:'Lace',asset:'npc-ethereal-lace',area:'city',quarter:'avenue',device:true,sit:true,youthful:true},
  // the street cat (the owner, 18 Nov 2026: "add the cat as an npc and giver"): moved by its own code in ncz-street-pair.js (no clips: a procedural pose), so its actions are its own (CAT_ACTIONS)
  'street-cat':{name:'Street cat',asset:'npc-street-cat',area:'city',quarter:'avenue',device:false,sit:false,youthful:false,cat:true,it:true}};
 const AREAS={'avenue-north':AVENUE_NORTH};
 /* MISSION GIVERS MADE IN THE EDITOR (Developer Tools > NPCs > Create a mission giver, npc-made.js; 19 Nov 2026): content.characters[id] are moved by data (their placement is
    content.npcs[id], the same plan as Reverie's), so they join MOVABLE: made:true, the model they were made from as `asset`, a V1 / V2 / V3 if they carry one (device poses),
    never the ledge's sit (their runtime has no seated transitions), and Reverie's content rule (youthful: casual street clips only; the forbidden places of npc-areas.js).
    setMade(chars) replaces every made entry (the draft in the editor, the content in force in the game) and returns the ones it replaced (a check puts them back). */
 let MADE={};
 /* An adult made character (the owner, 19 Nov 2026): marked "adult (18+)" in the creator, on a model that does not read youthful (never Reverie's or Lace's). */
 const YOUNG_MODELS=['npc-grey-reverie','npc-ethereal-lace','npc-street-cat'],adultOk=c=>!!c&&c.adult===true&&!YOUNG_MODELS.includes(c.model);
 function setMade(chars){const before=MADE;for(const id of Object.keys(MADE))if(MOVABLE[id]&&MOVABLE[id].made)delete MOVABLE[id];MADE={};
  for(const [id,c] of Object.entries(chars&&typeof chars==='object'&&!Array.isArray(chars)?chars:{})){if(!/^[a-z][a-z0-9-]{1,39}$/.test(id)||!c||typeof c!=='object'||typeof c.model!=='string'||(MOVABLE[id]&&!MOVABLE[id].made))continue;
   MOVABLE[id]={name:typeof c.name==='string'&&c.name.trim()?c.name.trim().slice(0,40):id,asset:c.model,area:'city',quarter:null,device:['v1','v2','v3'].includes(c.device),sit:false,youthful:!adultOk(c),adult:adultOk(c),made:true};MADE[id]=c;}
  return before;}
 const madeNow=()=>MADE;
 const ar=M=>M&&M.made?{made:true,adult:!!M.adult}:{};   // npc-areas.js check options: an adult made character may use the adult venues
 /* Every action a stay or a path point may use, in plain words. clip: the clip played (must be in the NPC's own list); device: an npc-device.js pose; sit: the
    ledge's sit-down, sit and stand-up clips (only at a ledge). */
 const ACTIONS=[
  {id:'wait',name:'Wait (stand still)',clip:'idle',help:'Stands still, breathing, for the number of seconds you set.'},
  {id:'idle',name:'Idle',clip:'idle',help:'Her ordinary standing idle.'},
  {id:'idle-shift',name:'Shift her weight',clip:'idle-shift',help:'A standing idle with a weight shift from foot to foot.'},
  {id:'idle-stretch',name:'Stretch',clip:'idle-stretch',help:'A small stretch while standing.'},
  {id:'look',name:'Look about',clip:'look',help:'Looks left and right down the street.'},
  {id:'watch',name:'Watch something',clip:'watch',help:'Stands watching something in front of her.'},
  {id:'scroll',name:'Scroll her V1',clip:'idle',device:'scroll',help:'Takes out her V1 device and scrolls it.'},
  {id:'selfie',name:'Take a selfie',clip:'idle',device:'selfie',help:'Holds up her V1 and takes a selfie.'},
  {id:'talk',name:'Talk (silently)',clip:'talk',help:'Talks with her hands, no sound (as she does to the cat).'},
  {id:'gesture',name:'Gesture',clip:'gesture',help:'A small explaining gesture.'},
  {id:'shrug',name:'Shrug',clip:'shrug',help:'A shrug.'},
  {id:'dance-groove',name:'Dance a little (groove)',clip:'dance-groove',help:'A casual groove on the spot (her everyday dance; nothing from the clubs).'},
  {id:'dance-bop',name:'Dance a little (happy bop)',clip:'dance-bop',help:'A happy little bop on the spot.'},
  {id:'sit',name:'Sit on the ledge',clip:'sit',needs:['sit-enter','sit','sit-exit'],sit:true,help:'Sits down on the ledge here, stays seated (a wave to a player who comes close), then stands up. Only at a ledge.'},
  {id:'walk-on',name:'Walk on (no stop)',clip:'walk',path:true,help:'Walks through this point without stopping (to make her go round a corner of your route).'},
  // the cat's own (ncz-street-pair.js catPlan: its procedural pose, no clips)
  {id:'cat-sit',name:'Sit',cat:true,help:'The cat sits down, facing the way you set, and looks about.'},
  {id:'cat-look',name:'Look about',cat:true,help:'The cat stands and looks left and right.'},
  {id:'cat-wander',name:'Potter about',cat:true,help:'The cat potters about within a metre of the spot.'}];
 const CAT_ACTIONS=['wait','cat-sit','cat-look','cat-wander','walk-on'],CAT_STAY=['cat-sit','cat-look','cat-wander'];
 const ACTION=new Map(ACTIONS.map(a=>[a.id,a]));
 const LIMIT={points:[2,12],seconds:[1,120],actions:[1,6],coord:400,blocks:8,blockMin:15};
 const STAY_DEFAULT=['idle','look','scroll','idle-shift'];   // "Giver waits at" and a new stay: her ordinary standing routine
 /* ADD ANIMATION (the owner, 18 Nov 2026: "be able to add animations to them"): clips of the shared animation library (anim-library.js) that the runtime can put on her
    figure. Offered only when allowed: never a banned clip for her (by id or title), only standing clips that loop in place (a seat, the floor or a partner is not
    something a pavement spot has yet). Whether her rig takes it (the library's REST_LIMIT rest-pose check) is checked when the preview loads the clip. */
 const AL=()=>node?require('./anim-library.js'):root.VoidAnimLibrary;
 /* Every clip in the game's public model files (tools/npc-clip-index.cjs -> npc-clip-index.json: each file's skeleton and clips). In Node it is read here; in the browser the
    editor fetches it when the NPCs tab opens (root.VoidNPCClipIndex); the game itself does not load it (it checks added clips by their rules only, and the animation
    library checks the rig again when it applies a clip). */
 const INDEX=()=>{if(node){try{return require('./npc-clip-index.json');}catch{return null;}}return root.VoidNPCClipIndex||null;};
 // Clips for grown-ups only (VR companions, the studios, the clubs): never for NPCs marked youthful (Reverie, Lace: ordinary street residents with youthful faces).
 const ADULT=/^(vr-companion|vr-player|studio-|npc-milked|npc-kai|npc-zane|npc-dax|npc-club)/;
 const YOUNG_NO=/smoke|drink|drunk|sway|beer|wine|cig/i,MOVE_CLIP=/^(walk|run|jog|sit-enter|sit-exit|walk-f|drunk-walk)$/;
 const CATS=[['idle',/idle|stand|breath|wait/],['walk / run',/walk|run|jog|stride/],['sit',/sit|seat|bench|ground|floor|lie/],['talk / gesture',/talk|gesture|wave|shrug|laugh|nod|point|look|watch|glance|head/],['dance',/dance|groove|bop|samba|hiphop/],
  ['V1 / device',/phone|device|selfie|scroll|menu/],['work',/work|wipe|pickup|interact|cook|smoke|drink|repair/],['combat / action',/aim|shoot|hit|duck|punch|fight|vr-/],['other',/./]];
 const category=c=>(CATS.find(([,re])=>re.test(c))||CATS[CATS.length-1])[0];
 /* Every clip the game has, for NPC id, with whether she can use it: {id, title, source, category, status ('own' | 'shared' | 'library' | 'no'), ok, why}. */
 function libraryOffer(id,idx=INDEX()){if(MOVABLE[id]&&MOVABLE[id].cat)return [];const M=MOVABLE[id],S=SP(),banned=(S&&S.BANNED)||/$^/,L=AL(),young=!!(M&&M.youthful),out=[];
  const rule=(clipId,title,src)=>!M?'Only for NPCs the editor can move.':banned.test(clipId)||banned.test(title||'')?'Not allowed for '+M.name+' (her content rule: casual street clips only).':young&&src&&ADULT.test(src)?'Not for '+M.name+': it comes from an adult-only model (companions, studios, clubs).':young&&YOUNG_NO.test(clipId)?'Not for '+M.name+' (no smoking, drinking or drunk clips for her).':MOVE_CLIP.test(String(clipId).split('/').pop())?'A walking or sit-down/stand-up clip: the game plays her own for that.':/^sit/.test(String(clipId).split('/').pop())?'A seated clip: she sits only through her own sit-down on a ledge (use “Sit on the ledge”).':young&&/^vr-|aim|shoot|punch|fight/.test(String(clipId).split('/').pop())?'Not for '+M.name+' (casual street clips only).':'';
  if(L&&L.all)for(const c of L.all()){if(c.library!=='actorcore')continue;let why=rule(c.id,(c.title||'')+' '+(c.category||''),'');if(!why){if(c.needs)why='Needs a '+c.needs+' to play on (not a standing action yet).';else if(c.group||c.partner)why='A clip for two or more people together.';else if(c.root!=='inplace')why='Moves her about the room (not a standing action).';}
   out.push({id:c.id,title:c.title,library:'actorcore',source:'animation library (ActorCore)',category:category(c.category+' '+c.id),status:why?'no':'library',ok:!why,why});}
  const mine=M&&idx&&idx.files[M.asset],limit=(idx&&idx.restLimit)||(L&&L.REST_LIMIT)||25;
  if(idx)for(const [asset,f] of Object.entries(idx.files)){if(M&&asset===M.asset)continue;
   for(const c0 of f.clips||[]){const clip=Array.isArray(c0)?c0[0]:c0,cid=asset+'/'+clip;let why=rule(cid,clip,asset),status='shared';
    if(!why){if(!f.public)why='A licensed model file (kept outside the public files): not used as a source here.';else if(!mine)why='Her own file is not in the index.';
     else if(!f.mixamo||f.joints!==mine.joints)why='A different skeleton ('+f.joints+' joints, hers '+mine.joints+'): use “Request an animation” for an offline retarget.';
     else{const off=L.restOffset(f.rest,mine.rest);if(off>limit)why='Her rig rests '+Math.round(off)+'° differently (the limit is '+limit+'°): use “Request an animation” for an offline retarget.';}}
    out.push({id:cid,title:clip+' (from '+asset.replace(/^npc-/,'')+')',library:'crowd:'+asset,source:asset,clip,category:category(clip),status:why?'no':status,ok:!why,why});}}
  return out;}
 /* Is an added clip id allowed without the index (the game's own check)? Its rules only: a library clip offered as above, or '<asset>/<clip>' of a known file and clip. */
 function animAllowed(id,a){if(MOVABLE[id]&&MOVABLE[id].cat)return 'the cat is moved by its own code and plays no animation clips';const off=libraryOffer(id,INDEX());const o=off.find(x=>x.id===a);if(o)return o.ok?'':o.why||'not allowed';if(INDEX())return 'unknown animation';
  const m=/^([a-z0-9-]+)\/([a-z0-9-]+)$/.exec(a||'');const M=MOVABLE[id],S=SP(),C=node?require('./crowd.js'):root.VoidCrowd;if(!m||!M)return 'unknown animation';
  if((S&&S.BANNED||/$^/).test(a))return 'not allowed for her';if(M.youthful&&(ADULT.test(m[1])||YOUNG_NO.test(m[2])))return 'not for her';if(MOVE_CLIP.test(m[2])||/^sit/.test(m[2]))return 'a walking, seated or transition clip';if(M.youthful&&/^vr-|aim|shoot|punch|fight/.test(m[2]))return 'not for her';if(!(C&&C.clips&&(C.clips[m[1]]||[]).includes(m[2])))return 'unknown animation';return '';}
 /* Put added clips on a figure (the game): library clips, and clips of other public crowd files through the same runtime retarget. */
 function applyAnims(n,look,ids){const L=AL();if(!L||!L.apply||!ids||!ids.length)return Promise.resolve([]);const by=new Map();
  for(const a of ids){const m=/^([a-z0-9-]+)\/([a-z0-9-]+)$/.exec(a);const lib=m?'crowd:'+m[1]:'actorcore';if(m&&L.register)L.register(lib,'assets/models/crowd/'+m[1]+'.glb',[{id:a,clip:m[2]}]);if(!by.has(lib))by.set(lib,[]);by.get(lib).push(a);}
  return Promise.all([...by].map(([library,only])=>Promise.resolve(L.apply(n,look,{library,only})).catch(()=>[]))).then(r=>r.flat());}
 /* Models whose licence says No AI (docs/VOID_RUNNER_ASSET_LICENSES.md): an animation request for them is a local retarget only (Blender, tools/animation-pipeline), never Meshy or any AI tool. */
 const NO_AI=/^(vr-companion|studio-warrior|npc-dax|dax|ava|eva|yuki|dex)/i;
 const noAI=(asset,id)=>NO_AI.test(String(asset||''))||NO_AI.test(String(id||''))&&!/^milked-eva$/.test(String(id||''));
 /* A "Request animation" entry (kept in the draft and exported; never published): what the owner wants and how it may be made. */
 function request(npc,asset,want,at=new Date().toISOString()){const local=noAI(asset,npc);return {npc,asset:asset||'',want:String(want||'').trim().slice(0,300),at,
  route:local?'local-retarget-only':'retarget-or-library',note:local?'Licensed No AI model: retarget it on your PC with Blender / tools/animation-pipeline (retarget_world.py). Never send it to Meshy or any AI tool.':'Retarget onto this rig with tools/animation-pipeline (retarget_world.py) or add the clip to the animation library.'};}
 const crowdClips=asset=>{const C=node?require('./crowd.js'):root.VoidCrowd;return (C&&C.clips&&C.clips[asset])||[];};
 /* The actions an NPC may use: only clips its own file has (crowd.js), never a banned one, device poses only for NPCs that carry a V1, sit only with the sit clips. */
 function actionsFor(id,anims){const M=MOVABLE[id];if(!M)return [];if(M.cat)return CAT_ACTIONS.map(a=>ACTION.get(a));const have=new Set(crowdClips(M.asset)),S=SP(),banned=(S&&S.BANNED)||/$^/;
  const extra=(anims||[]).filter(a=>!animAllowed(id,a)).map(a=>({id:a,name:a.replace(/^.*\//,'')+' (added animation)',clip:a,library:true,help:'An animation you added in Add animation.'}));
  return [...ACTIONS.filter(a=>!banned.test(a.id)&&!banned.test(a.clip)&&have.has(a.clip)&&(a.needs||[]).every(c=>have.has(c)&&!banned.test(c))&&(!a.device||M.device&&((S&&S.DEVICE)||[]).includes(a.device))&&(!a.sit||M.sit)),...extra];}
 const num=v=>typeof v==='number'&&Number.isFinite(v);
 const r1=v=>Math.round(v*10)/10,r2=v=>Math.round(v*100)/100;
 const wrap=a=>{const t=((a+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;return r2(t);};
 /* The ledge a spot is in front of (to sit on), or null. */
 function ledgeAt(p){if(!p)return null;for(const l of ledges())if(Math.abs(p.x-l.x)<=l.w/2+.3&&p.z>=l.front-1)return l;return null;}
 /* Plain-language problems with one spot for NPC id (empty: fine). An imported model (local test only) uses the same pavement: areaProblems. */
 function spotProblems(id,p){const M=MOVABLE[id];if(!M)return ['This NPC cannot be moved by the editor yet.'];if(M.area!=='city')return areaProblems(AREAS[M.area],M.name,p);
  const c=AR().check(p,null,undefined,ar(M));const out=c.ok?[]:[c.why];if(p&&p.yaw!=null&&!num(p.yaw))out.push('The facing is not a number.');return out;}
 function areaProblems(A,name,p){
  if(!p||!num(p.x)||!num(p.z)||Math.abs(p.x)>LIMIT.coord||Math.abs(p.z)>LIMIT.coord)return ['The spot has no position.'];
  const out=[];if(p.x<A.x0||p.x>A.x1||p.z<A.z0||p.z>A.z1)out.push('That is off '+A.name+' ('+name+' can only walk there: across the road it would be in front of the taxis, and the gates are closed).');
  for(const s of posts())if(Math.hypot(p.x-s.x,p.z-s.z)<A.post)out.push('That is on the taxi post at '+s.id+'.');
  for(const o of OBSTACLES)if(inBox(p,o)&&!out.some(x=>/taxi post/.test(x)))out.push('That is in '+o[4]+' standing on the pavement: move the spot a little away from the kerb.');
  if(p.yaw!=null&&!num(p.yaw))out.push('The facing is not a number.');
  return out;}
 /* Can she walk straight from a to b? Both on the pavement (a rectangle, so the line stays on it) and the line clear of the taxi posts. */
 function legProblems(id,a,b){const M=MOVABLE[id];if(M&&M.area==='city')return AR().leg(a,b,ar(M));const A=M&&AREAS[M.area];if(!A)return ['This NPC cannot be moved by the editor yet.'];
  for(const o of OBSTACLES){for(let k=0;k<=20;k++){const t=k/20,q={x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t};if(inBox(q,o,CLEAR-.1))return ['The walk between these two points goes through '+o[4]+': add a point to go round it (nearer the shops).'];}}
  for(const s of posts()){const dx=b.x-a.x,dz=b.z-a.z,L=dx*dx+dz*dz,t=L?Math.max(0,Math.min(1,((s.x-a.x)*dx+(s.z-a.z)*dz)/L)):0,d=Math.hypot(a.x+dx*t-s.x,a.z+dz*t-s.z);if(d<A.post-.15)return ['The walk between these two points goes through the taxi post at '+s.id+': add a point to go round it.'];}
  return [];}
 const keysOk=(o,allowed)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).every(k=>allowed.includes(k));
 /* A mission's "Giver waits at": only Reverie and Lace (the movable givers); a spot on her pavement. Returns problems. */
 function waitAtProblems(giver,w){if(w==null)return [];if(!MOVABLE[giver])return ['“Giver waits at” works only for a giver the editor can move (Reverie or Lace).'];
  if(!keysOk(w,['x','z','yaw']))return ['“Giver waits at” has unknown fields.'];return spotProblems(giver,w);}
 /* A plan (content.npcs[id]). Returns problems (empty: fine). A daily schedule (p.schedule) is checked block by block with the same rules (scheduleProblems). */
 function planProblems(id,p){if(p&&typeof p==='object'&&!Array.isArray(p)&&'schedule' in p){const {schedule,...rest}=p,M=MOVABLE[id];const out=planOnly(id,rest);if(M)out.push(...scheduleProblems(id,schedule,rest.anims));return out;}return planOnly(id,p);}
 function planOnly(id,p){const M=MOVABLE[id];if(!M)return [(id||'?')+': this NPC cannot be moved by the editor yet.'];const w=M.name+': ',out=[];
  if(!p||typeof p!=='object'||!['stay','path','original'].includes(p.mode))return [w+'unknown kind of placement (stay, path or her own routine).'];
  if(p.anims!=null){if(!Array.isArray(p.anims)||p.anims.length>8)out.push(w+'too many added animations (8 at most).');else for(const a of p.anims){const why=animAllowed(id,a);if(why)out.push(w+'the animation “'+a+'” cannot be added: '+why);}}
  const ok=new Set(actionsFor(id,Array.isArray(p.anims)?p.anims:[]).map(a=>a.id));
  if(p.mode==='original'){if(!keysOk(p,['mode','anims']))out.push(w+'“her own routine” has unknown fields.');return out;}
  if(p.mode==='stay'){if(!keysOk(p,['mode','x','z','yaw','actions','anims']))return [w+'the stay has unknown fields.'];for(const x of spotProblems(id,p))out.push(w+x);
   if(!Array.isArray(p.actions)||p.actions.length<LIMIT.actions[0]||p.actions.length>LIMIT.actions[1])out.push(w+'a stay needs 1 to 6 actions.');
   else for(const a of p.actions){if(!ok.has(a)||(ACTION.get(a)||{}).path)out.push(w+'“'+a+'” is not something she can do here.');else if(a==='sit'&&!ledgeAt(p))out.push(w+'“Sit” needs a ledge: put the spot just in front of one.');}
   return out;}
  if(!keysOk(p,['mode','points','anims']))return [w+'the path has unknown fields.'];
  if(!Array.isArray(p.points)||p.points.length<LIMIT.points[0]||p.points.length>LIMIT.points[1])return [w+'a path needs 2 to 12 points.'];
  p.points.forEach((q,i)=>{const pw=w+'point '+(i+1)+': ';if(!keysOk(q,['x','z','action','seconds'])){out.push(pw+'unknown fields.');return;}
   for(const x of spotProblems(id,q))out.push(pw+x);
   if(!ok.has(q.action))out.push(pw+'“'+q.action+'” is not something she can do.');else if(q.action==='sit'&&!ledgeAt(q))out.push(pw+'“Sit” needs a ledge: put the point just in front of one.');
   if(q.action!=='walk-on'&&!(Number.isInteger(q.seconds)&&q.seconds>=LIMIT.seconds[0]&&q.seconds<=LIMIT.seconds[1]))out.push(pw+'how long: a whole number of seconds from 1 to 120.');
   const n=p.points[(i+1)%p.points.length];if(num(q.x)&&num(q.z)&&n&&num(n.x)&&num(n.z))for(const x of legProblems(id,q,n))out.push(pw+x);});
  if(p.points.every(q=>q.action==='walk-on'))out.push(w+'at least one point needs something to do (not only “walk on”).');
  {const ids=[...new Set(p.points.map(q=>AR().areaOf(q)).filter(Boolean))];if(ids.length>1)out.push(w+'a route stays in one area (this one has points in '+ids.map(a=>AR().get(a).name).join(' and ')+'): give each area its own time block.');}
  return out;}
 /* An imported model's placement (Developer Tools > NPCs > Import model; local test only, never published): the same pavement and the same shape, with actions from the
    clips in its own file (plus 'wait' and 'walk-on'). */
 function importPlanProblems(p,clips){const A=AVENUE_NORTH,out=[],ok=new Set(['wait','walk-on',...(clips||[])]);if(!p||!['stay','path'].includes(p.mode))return ['Choose “Stay here” or “Route”.'];
  if(p.mode==='stay'){out.push(...areaProblems(A,'the model',p));if(!Array.isArray(p.actions)||!p.actions.length)out.push('Pick at least one thing for it to do.');else for(const a of p.actions)if(!ok.has(a)||a==='walk-on')out.push('“'+a+'” is not a clip in its file.');return out;}
  if(!Array.isArray(p.points)||p.points.length<2)return ['A route needs at least 2 points: click the pavement to add them.'];
  p.points.forEach((q,i)=>{for(const x of areaProblems(A,'the model',q))out.push('point '+(i+1)+': '+x);if(!ok.has(q.action))out.push('point '+(i+1)+': “'+q.action+'” is not a clip in its file.');});return out;}
 /* content.npcs: {id: plan}. */
 function checkAll(npcs){if(npcs==null)return [];if(!npcs||typeof npcs!=='object'||Array.isArray(npcs)||Object.keys(npcs).length>20)return ['NPC placements have an unknown shape.'];
  const out=[];for(const [id,p] of Object.entries(npcs))out.push(...planProblems(id,p));return out;}
 /* Tidy a plan from the editor before it is checked or sent: rounded numbers, only known fields. */
 function clean(p){if(!p||typeof p!=='object')return null;const an=Array.isArray(p.anims)&&p.anims.length?{anims:p.anims.filter(a=>typeof a==='string').slice(0,8)}:{};
  const sc=Array.isArray(p.schedule)&&p.schedule.length?{schedule:p.schedule.slice(0,LIMIT.blocks).map(cleanBlock).filter(Boolean)}:{};
  if(p.mode==='original')return an.anims||sc.schedule?{mode:'original',...an,...sc}:null;
  if(p.mode==='stay')return {...an,...sc,mode:'stay',x:r1(+p.x),z:r1(+p.z),yaw:wrap(+p.yaw||0),actions:(Array.isArray(p.actions)?p.actions:[]).filter(a=>typeof a==='string').slice(0,LIMIT.actions[1])};
  if(p.mode==='path')return {...an,...sc,mode:'path',points:(Array.isArray(p.points)?p.points:[]).slice(0,LIMIT.points[1]).map(q=>({x:r1(+q.x),z:r1(+q.z),action:String(q.action||'wait'),seconds:Math.round(+q.seconds||0)}))};
  return null;}
 /* One schedule block, tidied: {from, to, name?, mode, ...that mode's fields}. */
 function cleanBlock(b){if(!b||typeof b!=='object')return null;const head={from:String(b.from||''),to:String(b.to||''),...(typeof b.name==='string'&&b.name.trim()?{name:b.name.trim().slice(0,40)}:{})};
  if(b.mode==='original')return {...head,mode:'original'};const {from,to,name,schedule,anims,...rest}=b,c=clean(rest);return c?{...head,...c}:{...head,mode:String(b.mode||'')};}
 const cleanWait=w=>w&&num(+w.x)&&num(+w.z)?{x:r1(+w.x),z:r1(+w.z),yaw:wrap(+w.yaw||0)}:null;
 /* What the game should do with a movable NPC now (ncz-street-pair.js). waiting: a mission's waitAt for her, or null; plan: content.npcs[id] or null.
    Returns {key, mode:'stay'|'path', ...} (key changes when the plan does) or null (her own routine). */
 function planNow(id,{waiting=null,plan=null,minute=null}={}){
  if(waiting&&num(waiting.x)&&num(waiting.z)){const l=ledgeAt(waiting);return {area:AR().areaOf(waiting)||null,key:'wait:'+(waiting.mission||'')+':'+waiting.x+':'+waiting.z,mode:'stay',x:waiting.x,z:waiting.z,yaw:num(waiting.yaw)?waiting.yaw:Math.PI,actions:MOVABLE[id]&&MOVABLE[id].cat?CAT_STAY.slice():l?[...STAY_DEFAULT,'sit']:STAY_DEFAULT.slice(),why:'waiting'};}
  // a daily schedule: the block for this in-game minute of the day (minute: game-clock.js now(state).minuteOfDay); "her usual thing" in a block is her own routine
  if(plan&&Array.isArray(plan.schedule)&&num(minute)){const i=blockAt(plan.schedule,minute);if(i>=0){const b=plan.schedule[i];if(b.mode==='original')return null;const r=planNow(id,{plan:b});if(r){r.key='sched:'+i+':'+b.from+'-'+b.to+':'+r.key;r.why='schedule';r.block=i;}return r;}}
  if(plan&&plan.mode==='stay')return {area:AR().areaOf(plan)||null,key:'stay:'+plan.x+':'+plan.z+':'+plan.yaw+':'+plan.actions.join(','),mode:'stay',x:plan.x,z:plan.z,yaw:plan.yaw,actions:plan.actions.slice(),why:'stay'};
  if(plan&&plan.mode==='path')return {area:AR().areaOf(plan.points[0]||{})||null,key:'path:'+plan.points.map(q=>q.x+','+q.z+','+q.action+','+q.seconds).join(';'),mode:'path',points:plan.points.map(q=>({...q})),why:'path'};
  return null;}
 /* Map data (the editor's top-down map): the walkable area, the road, the gates, the ledges, the taxi posts, the shopfront names, her usual stretch. */
 function mapData(areaId='avenue',npc=null){const ad=!!(npc&&MOVABLE[npc]&&MOVABLE[npc].adult);const S=SP(),Ar=AR(),a=Ar.get(areaId)||Ar.get('avenue'),P=node?require('./places.js'):root.VoidPlaces,v=a.view,inV=(x,z)=>x>=v.x0&&x<=v.x1&&z>=v.z0&&z<=v.z1;
  const shop=a.scene==='street'?((P&&P.SHOPFRONTS)||[]).filter(([,x,z])=>inV(x,z)).map(([name,x,z,side])=>({name,x,z,side})):[];const av=a.id==='avenue',rc=r=>({x0:r.x0,x1:r.x1,z0:r.z0,z1:r.z1,...(r.name?{name:r.name}:{})});
  return {area:a.id,name:a.name,scene:a.scene,view:{...v},floors:a.floors.map(rc),walk:a.walk.filter(w=>!w.adult||ad).map(rc),roads:a.roads.map(rc),no:a.no.filter(n=>!(ad&&n.adult)).map(n=>({...rc(n),why:n.why,rule:!!n.rule,...(n.doorway?{doorway:true}:{})})),gates:a.gates.map(rc),
   obstacles:a.obstacles.map(o=>({x0:o[0],x1:o[1],z0:o[2],z1:o[3],name:o[4]})),posts:a.posts.map(([x,z])=>({x,z})),labels:a.labels.map(l=>({...l})),shops:shop,escapes:(a.escapes||[]).map(e=>({...e,u:e.u.slice(),t:e.t.slice(),foot:e.foot.slice()})),tunnels:(a.tunnels||[]).map(u=>({...u,rect:u.rect.slice(),top:u.top.slice(),down:u.down.slice()})),stairDoors:(a.tunnelDoors||[]).map(d=>({id:d.id,name:d.name,place:d.place,inside:d.inside?{...d.inside}:null})),seats:(a.seats||[]).map(x=>({...x})),under:!!a.under,   // the tunnels (ncz-underground.js): the stair doors and the alcoves' seats
   // the back alleys' fire escapes (ncz-backalleys.js)
   
   ledges:av?ledges():[],stretch:av&&S?{x0:S.STRETCH.x0,x1:S.STRETCH.x1,z:S.STRETCH.z}:null,seat:av&&S?{...S.SEAT}:null,catHome:av&&S?{...S.CAT_HOME}:null,
   areas:Ar.list().filter(x=>ad||x.walk.some(w=>!w.adult)).map(x=>({id:x.id,name:x.name}))};}
 /* Snap a clicked spot onto ground she may stand on (the editor: a click on the road, a kerb or a piece of furniture lands on the nearest allowed spot, within a few metres;
    a click in a forbidden place is never moved). pick() -> {spot:{x, z, moved} or null, why}. area: the area shown on the map. */
 function pick(id,p,area){const M=MOVABLE[id];if(!M||!p)return {spot:null,why:'This NPC cannot be moved by the editor yet.'};
  if(M.area!=='city'){const A=AREAS[M.area];return {spot:{x:r1(Math.max(A.x0,Math.min(A.x1,p.x))),z:r1(Math.max(A.z0,Math.min(A.z1,p.z))),moved:true},why:''};}
  const c=AR().check(p,area,undefined,ar(M));if(c.ok&&(!area||c.area===area))return {spot:{x:r1(p.x),z:r1(p.z),moved:false},why:''};
  const q=c.kind==='rule'?null:AR().nearest(p,area||c.area,undefined,ar(M));if(q)return {spot:q,why:c.why};return {spot:null,why:c.ok?'That is in '+AR().get(c.area).name+', not the area shown: pick it in the area list first.':c.why+(c.kind==='rule'?'':' (nothing she can stand on nearby)')};}
 function snap(id,p,area){if(!p)return p;const r=pick(id,p,area);return r.spot?{...p,x:r.spot.x,z:r.spot.z}:p;}
 /* For the admin inventory (the server's copy of these rules). */
 function inventory(){const out={};for(const [id,M] of Object.entries(MOVABLE)){out[id]={name:M.name,areas:AR().IDS.slice(),
  ledges:ledges().map(l=>({x:l.x,w:l.w,front:Math.round(l.front*1000)/1000})),actions:actionsFor(id).map(a=>a.id),anims:libraryOffer(id).filter(o=>o.ok).map(o=>o.id),pathOnly:ACTIONS.filter(a=>a.path).map(a=>a.id)};}return {movable:out,areas:AR().inventory(),limits:LIMIT,import:{maxTriangles:IMPORT.maxTriangles,target:IMPORT.target,maxBytes:IMPORT.maxBytes,texWarn:IMPORT.texWarn}};}
 /* IMPORT MODEL (the owner, 18 Nov 2026: "import new models, then place them in" and "just have a cap on poly counts for each import"): the caps, in ONE place (the
    server reads the same numbers from the admin inventory for the "Add to the game" package). Over maxTriangles (whole model, every mesh) or maxBytes: refused.
    Over target: accepted with an amber note. A texture wider or taller than texWarn: an amber note. Imported models stay in this browser (local test only). */
 const IMPORT={maxTriangles:50000,target:20000,maxBytes:15*1024*1024,texWarn:2048,exts:['.glb','.gltf']};
 /* The checklist verdict for an imported file. info: {triangles, bytes, textures:[{name,w,h}], bones:[names], clips:[names], height}. */
 function importCheck(info){const out=[],add=(level,text)=>out.push({level,text}),t=info.triangles|0,mb=b=>(b/1048576).toFixed(1)+' MB';
  if(t>IMPORT.maxTriangles)add('bad','This model has '+t.toLocaleString('en')+' triangles; the limit is '+IMPORT.maxTriangles.toLocaleString('en')+'. Reduce it in Blender, or send it to Claude/Codex to reduce.');
  else if(t>IMPORT.target)add('warn',t.toLocaleString('en')+' triangles: accepted, but above the '+IMPORT.target.toLocaleString('en')+' target for a street NPC.');else add('ok',t.toLocaleString('en')+' triangles (target '+IMPORT.target.toLocaleString('en')+').');
  if(info.bytes>IMPORT.maxBytes)add('bad','The file is '+mb(info.bytes)+'; the limit is '+mb(IMPORT.maxBytes)+'.');else add('ok','File size '+mb(info.bytes||0)+' (limit '+mb(IMPORT.maxBytes)+').');
  const big=(info.textures||[]).filter(x=>x.w>IMPORT.texWarn||x.h>IMPORT.texWarn);if(big.length)add('warn',big.length+' texture(s) larger than '+IMPORT.texWarn+' px ('+big.map(x=>x.w+'×'+x.h).join(', ')+'): they will be reduced before it goes in the game.');else add('ok',(info.textures||[]).length+' texture(s), none larger than '+IMPORT.texWarn+' px.');
  const bones=(info.bones||[]).map(b=>String(b).split(':').pop()),L=AL(),core=L&&L.CORE?L.CORE:[],missing=core.filter(c=>!bones.includes(c));
  if(!bones.length)add('warn','No skeleton: it can stand still only (no walking or other clips).');
  else{const rig=bones.length===24&&!missing.length?'the 24-joint Mixamo-named rig of the Meshy street people':bones.length>=50&&!missing.length?'the larger crowd rig (about 52 joints)':!missing.length?'a Mixamo-named rig ('+bones.length+' joints)':null;
   add(rig?'ok':'warn',bones.length+' joints'+(rig?': matches '+rig+', so library clips can be tried on it (the rest pose is checked when a clip is tried).':': not the game’s rig (missing '+missing.slice(0,6).join(', ')+(missing.length>6?'…':'')+'), so only its own clips can play.'));}
  add((info.clips||[]).length?'ok':'warn',(info.clips||[]).length?'Clips in the file: '+info.clips.join(', ')+'.':'No clips in the file.');
  if(Number.isFinite(info.height))add(info.height>1.3&&info.height<2.3?'ok':'warn','Height '+(info.height*3.28084).toFixed(1)+' ft'+(info.height>1.3&&info.height<2.3?'.':' (a person is about 5.2 to 6.2 ft: it will be scaled to 5.7 ft in the test).'));
  return {ok:!out.some(x=>x.level==='bad'),items:out};}
 /* DAILY SCHEDULES (the owner, 18 Nov 2026, queue item 1: "daily NPC schedules by in-game hour"). plan.schedule = [{from:'HH:MM', to:'HH:MM', name?, mode:'stay'|'path'|
    'original', ...that mode's fields}]: from `from` until `to` on the game's own clock (game-clock.js; an in-game day is 2 hours of play) she does that block; outside every
    block, the plan itself. A block may run past midnight (20:00 to 02:00). Blocks never overlap; at most LIMIT.blocks; each at least LIMIT.blockMin minutes. Reverie and Lace
    keep their real-time street shift (12 hours UTC each, ncz-street-pair.js): a schedule says what she does while she is out, never when she is out. */
 const HHMM=/^([01]\d|2[0-3]):([0-5]\d)$/;
 const toMin=t=>{const m=HHMM.exec(typeof t==='string'?t:'');return m?(+m[1])*60+(+m[2]):null;};
 const hhmm=n=>{n=((Math.round(n)%1440)+1440)%1440;return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');};
 const span=b=>{const f=toMin(b&&b.from),t=toMin(b&&b.to);return f==null||t==null?0:(t-f+1440)%1440;};
 const inBlock=(b,m)=>{const f=toMin(b.from),t=toMin(b.to);if(f==null||t==null||f===t)return false;return f<t?m>=f&&m<t:m>=f||m<t;};
 /* The index of the block that covers in-game minute-of-day m (-1: none). */
 function blockAt(sched,m){if(!Array.isArray(sched)||!num(m))return -1;m=((Math.floor(m)%1440)+1440)%1440;return sched.findIndex(b=>b&&typeof b==='object'&&inBlock(b,m));}
 const NAME_OK=/^[A-Za-z0-9 .,'’()&!?\-\/]{1,40}$/;   // a block's name: plain words only (shown as text)
 const BLOCK_KEYS={original:['from','to','name','mode'],stay:['from','to','name','mode','x','z','yaw','actions'],path:['from','to','name','mode','points']};
 const blockLabel=(b,i)=>'Time block '+(i+1)+(b&&typeof b==='object'&&toMin(b.from)!=null&&toMin(b.to)!=null?' ('+b.from+'–'+b.to+')':'')+': ';
 function scheduleProblems(id,sched,anims){const M=MOVABLE[id];if(!M)return [];const w=M.name+': ';if(sched==null)return [];
  if(!Array.isArray(sched))return [w+'the daily schedule has an unknown shape.'];if(!sched.length)return [w+'the daily schedule is empty (remove it, or add a time block).'];
  if(sched.length>LIMIT.blocks)return [w+'a daily schedule has '+LIMIT.blocks+' time blocks at most (this one has '+sched.length+').'];
  const out=[],used=new Array(1440).fill(-1);
  sched.forEach((b,i)=>{const bw=w+blockLabel(b,i);if(!b||typeof b!=='object'||Array.isArray(b)){out.push(bw+'not a time block.');return;}
   if(!BLOCK_KEYS[b.mode]){out.push(bw+'what she does must be her usual thing, staying at a spot, or walking a route.');return;}
   if(!keysOk(b,BLOCK_KEYS[b.mode])){out.push(bw+'unknown fields ('+Object.keys(b).filter(k=>!BLOCK_KEYS[b.mode].includes(k)).join(', ')+').');return;}
   const f=toMin(b.from),t=toMin(b.to);if(f==null)out.push(bw+'the start time must look like 08:00 (24-hour clock).');if(t==null)out.push(bw+'the end time must look like 12:00 (24-hour clock).');
   if(f!=null&&t!=null){if(f===t)out.push(bw+'it starts and ends at the same time.');else if(span(b)<LIMIT.blockMin)out.push(bw+'a time block lasts at least '+LIMIT.blockMin+' minutes.');
    else{let clash=-1;for(let m=f,k=0;k<span(b);k++,m=(m+1)%1440){if(used[m]>=0&&clash<0)clash=used[m];used[m]=i;}if(clash>=0)out.push(bw+'it overlaps time block '+(clash+1)+': change one of their times.');}}
   if(b.name!=null&&(typeof b.name!=='string'||!NAME_OK.test(b.name)))out.push(bw+'the name may use letters, numbers and simple punctuation only (40 at most).');
   if(b.mode!=='original'){const {from,to,name,...rest}=b;for(const x of planOnly(id,{...rest,...(Array.isArray(anims)?{anims}:{})}))out.push(bw+x.replace(w,''));}});
  return out;}
 const api={setMade,madeNow,YOUNG_MODELS,adultOk,CAT_ACTIONS,CAT_STAY,blockAt,scheduleProblems,toMin,hhmm,span,cleanBlock,BLOCK_KEYS,NAME_OK,HHMM,OBSTACLES,animAllowed,applyAnims,category,ADULT,INDEX,areaProblems,importPlanProblems,IMPORT,importCheck,libraryOffer,noAI,request,MOVABLE,AREAS,AVENUE_NORTH,ACTIONS,ACTION,LIMIT,STAY_DEFAULT,actionsFor,crowdClips,ledgeAt,spotProblems,legProblems,waitAtProblems,planProblems,checkAll,clean,cleanWait,planNow,mapData,snap,pick,inventory,posts,ledges,wrap};
 if(node)module.exports=api;else root.VoidNPCPaths=api;
})(typeof globalThis!=='undefined'?globalThis:this);
