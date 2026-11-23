/* NOMI AND SE7EN (the owner, 23 Nov 2026): two adult women in the underground sleeping room behind the tea room (place `under-sleeping-room`, ncz-underground.js).
   They start the scene SITTING on the two beds whose curtains stand open (modules.js COT_LAYOUT `open`: cot-2 and cot-3), Nomi on the one nearer the door, Se7en on the
   other, facing each other across the aisle. Their standing spots (modules.js spots `nomi`, `se7en`, PR #512) are where they stand if their model has no sit clip.
   Their models are the owner's own (the Companion Studio packages local-mwspnx2p and local-mwsqafm4): licensed, kept out of this repository like Dax's, published only from the
   private asset repository as `npc-nomi.vrpak` and `npc-se7en.vrpak` (docs/VOID_RUNNER_ASSET_LICENSES.md), never sent to any AI service. On a machine without the files nobody
   stands in for them (the console says so once). Their words and voices are only the owner's recorded lines from those packages (extra/tea-duo.json): nothing is written or generated here.
   WHEN A PLAYER WALKS IN: Nomi notices and speaks, Se7en answers when Nomi's recording has ended, and so on through the ten greeting lines (Nomi, Se7en, Nomi, ... Se7en: the last is
   Se7en's), one voice at a time with a short pause between; walking out stops it; walking back in within 90 s starts nothing; another conversation or a mission line holds it.
   Each player's game runs its own copy (one state per player, npc-advanced-interactions.js roomDuoStep): two players in the room never restart each other's. No new multiplayer system.
   Pure rules (who sits where, the lines, the floor lift) run in Node (tests/tea-duo.test.cjs). */
(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports;
 const UG=()=>{try{return node?require('./ncz-underground.js'):root.VoidUnderground||null;}catch{return null;}};
 const MD=()=>{try{return node?require('./modules.js'):root.VoidModules||null;}catch{return null;}};
 const ADV=()=>{try{return node?require('./npc-advanced-interactions.js'):root.VoidAdvancedInteractions||null;}catch{return null;}};
 const ROOM='under-sleeping-room',TEA='under-tea-room',MEMBERS=['nomi','se7en'];
 const PEOPLE={nomi:{name:'Nomi',model:'npc-nomi',file:'assets/models/crowd/npc-nomi.vrpak',adult:true},se7en:{name:'Se7en',model:'npc-se7en',file:'assets/models/crowd/npc-se7en.vrpak',adult:true}};
 /* The greeting pools of the two packages, in the owner's order (his text, exactly; file: the recording beside it in assets/audio/voice/extra/tea-duo/, duration in seconds). */
 const LINES={"nomi": [{"text": "[surprised] Oh! There's someone here!", "file": "nomi-greet-1.mp3", "duration": 2.03}, {"text": "[excited] Well, hello there, handsome! [giggles] We don't get many visitors this charming.", "file": "nomi-greet-2.mp3", "duration": 5.55}, {"text": "[softly] Aww, don't be shy. Come a little closer.", "file": "nomi-greet-3.mp3", "duration": 3.62}, {"text": "[playfully] Were you looking for some tea... [whispers] or something a little sweeter?", "file": "nomi-greet-4.mp3", "duration": 4.12}, {"text": "[flirty] I think you're going to like it here. [giggles] We take very good care of our guests.", "file": "nomi-greet-5.mp3", "duration": 5.06}], "se7en": [{"text": "[surprised] Oh! Nomi, you didn't tell me we had company!", "file": "se7en-greet-1.mp3", "duration": 3.78}, {"text": "[playfully] Well, hello, handsome. [giggles] Have you ever spent time with an android before?", "file": "se7en-greet-2.mp3", "duration": 6.02}, {"text": "[flirty] I'm Se7en. Programmed for pleasure... [whispers] but I've learned a few tricks of my own.", "file": "se7en-greet-3.mp3", "duration": 5.55}, {"text": "[sweetly] Don't be shy. My hospitality protocols are exceptionally friendly.", "file": "se7en-greet-4.mp3", "duration": 5.32}, {"text": "[teasing] Nomi makes the tea. [giggles] I make sure you enjoy it.", "file": "se7en-greet-5.mp3", "duration": 4.66}]};
 /* Seated on a cot: the figure's origin (under her hips, on the floor) stands SIT_FORWARD metres from the cot's middle toward the aisle, so she sits near the aisle edge and her
    knees clear it. The sit clip puts the hips about SIT_HIPS above the origin; the cot top is at SEAT_H (modules.js COTS). Measured on the real models (tests/tea-duo-browser.py). */
 const SIT_FORWARD=.2,HEAR=8,COOLDOWN=90000,PAUSE=900,NOTICE=700,MAX_LINE=20000;
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
 const linesOf=()=>Object.fromEntries(MEMBERS.map(id=>[id,LINES[id].map(l=>l.text)]));
 const lineInfo=(id,text)=>(LINES[id]||[]).find(l=>l.text===text)||null;
 const pure={ROOM,MEMBERS,PEOPLE,LINES,SIT_FORWARD,HEAR,COOLDOWN,PAUSE,NOTICE,MAX_LINE,strip,floorLift,door,seating,placement,linesOf,lineInfo};
 if(node){module.exports=pure;return;}
 if(typeof document==='undefined')return;

 // ---------------- the browser part ----------------
 const figs=new Map();let loading=null,missing=false,told=false,sceneRef=null,duo=null,rec=null,fallbackAt=0;
 const NEAR=[ROOM,TEA];
 const where=()=>{try{if(typeof walkingLocation==='undefined'||!walkingLocation||walkingLocation.id!=='neochinatown'||walkingLocation.area!=='street'||walkingLocation.quarter!=='underground')return null;if(typeof mode==='undefined'||!['walking','dialogue','mission-log'].includes(mode))return null;const w=typeof walker!=='undefined'?walker:null;return w&&Number.isFinite(w.x+w.z)?w:null;}catch{return null;}};
 const placeOf=w=>{try{return UG().placeAt(w.x,w.z);}catch{return null;}};
 function drop(){for(const f of figs.values()){try{f.ctrl?.dispose?.();f.node.dispose();}catch{}}figs.clear();sceneRef=null;}
 async function ensure(scene){
  if(missing||loading||figs.size)return;const A=root.VoidAssets,C=root.VoidCrowd;if(!A||!C)return;
  loading=(async()=>{
   try{for(const id of MEMBERS)if(!A.container('crowd:'+PEOPLE[id].model))await A.load('crowd:'+PEOPLE[id].model,{src:PEOPLE[id].file,background:true},scene);}
   catch(e){missing=true;if(!told){told=true;console.info('[VOID//RUNNER] Nomi and Se7en are not on this machine: their licensed models (void-runner/assets/models/crowd/npc-nomi.vrpak, npc-se7en.vrpak) are published with the live site only. Nobody stands in for them.');}return;}
   if(scene.isDisposed||!where()||root.VoidBabylon?.scene!==scene)return;
   const B=root.BABYLON,U=UG();
   for(const id of MEMBERS){
    const P=PEOPLE[id],node=new B.TransformNode('tea-duo-'+id,scene),asset=new B.TransformNode('tea-duo-asset-'+id,scene);asset.parent=node;
    const made=A.instance('crowd:'+P.model,asset);if(!made){node.dispose();continue;}
    node.metadata={character:id,npc:true};made.metadata={...made.metadata,character:id,crowd:P.model};
    for(const m of made.getChildMeshes?.()||[])m.isPickable=false;
    const has=n=>{try{return C.clipIn(P.model,n)===n;}catch{return false;}},pl=placement(id,has('sit'))||placement(id,false);
    const ctrl=C.animate(made,P.model,pl&&pl.pose==='sit'?'sit':'idle');   // seated from the first frame: no stand-to-sit blend to watchif(!pl){node.dispose();continue;}
    node.position.set(pl.x,pl.y,pl.z);node.rotation.y=pl.yaw;
    // feet (or, seated, the origin) on the floor: the lift from the bind-pose bounds, once, as an absolute height on the visual child
    asset.position.y=0;node.computeWorldMatrix(true);asset.computeWorldMatrix(true);const bb=made.getHierarchyBoundingVectors(true);asset.position.y=floorLift(bb.min.y,bb.max.y,pl.y);
    figs.set(id,{id,node,asset,made,ctrl,pl,has,clip:null});
   }
   sceneRef=scene;
  })().finally(()=>{loading=null;});}
 function play(f,name){if(f.clip===name)return;f.clip=name;try{f.ctrl.play(name);}catch{}}
 function settle(f,speaking){const seated=f.pl.pose==='sit'&&f.has('sit');play(f,seated?'sit':speaking&&f.has('talk')?'talk':'idle');}
 const isBlocked=()=>{try{return !!((typeof speech!=='undefined'&&speech)||root.VoidLiveContent?.nearBlocked?.()||(typeof document!=='undefined'&&document.hidden));}catch{return true;}};
 function audible(w){const f=figs.get('nomi')||figs.get('se7en');if(!f)return false;const A=ADV();const to=[f.pl.x,U_Y()+1.2,f.pl.z],d=Math.hypot(w.x-f.pl.x,w.z-f.pl.z);
  return d<=HEAR&&A.clearRoomLine([w.x,Number.isFinite(w.y)?w.y:U_Y()+1.7,w.z],to,walkingLocation.solids);}
 const U_Y=()=>UG().Y;
 // is the recording of the line just started still sounding? (the voice player's own record of the line; a line that has none is held for its recorded length, or its text's)
 function playing(now){if(!rec)return false;const v=root.VoidVoiceClips?.now;if(v&&v.who===rec.id&&v.text===rec.text&&v.ended&&v.endedAt>=rec.perf-50)return false;return now<rec.until;}
 function tick(){
  try{
   const w=where(),scene=root.VoidBabylon?.scene;
   if(!w){if(duo?.inside||rec){stopSpeech();}duo=null;rec=null;if(figs.size&&(!scene||scene!==sceneRef||typeof mode!=='undefined'&&mode==='menu'))drop();return;}
   if(sceneRef&&scene!==sceneRef)drop();
   const place=placeOf(w),near=NEAR.includes(place);
   if(near&&scene&&!figs.size)ensure(scene);
   for(const f of figs.values()){f.node.setEnabled(near);}
   const A=ADV(),inside=place===ROOM,now=Date.now();if(!A)return;
   const present=figs.size===MEMBERS.length;
   const r=A.roomDuoStep(duo,{inside,present,blocked:isBlocked()||!audible_(w,inside),playing:playing(now),now,lines:linesOf(),members:MEMBERS,pauseMs:PAUSE,noticeMs:NOTICE,cooldownMs:COOLDOWN,maxTurns:10,maxLineMs:MAX_LINE});
   duo=r.state;if(r.cancel){stopSpeech();rec=null;}
   if(r.line){
    const id=r.line.speaker,info=lineInfo(id,r.line.text),P=PEOPLE[id];
    try{if(typeof announce==='function')announce(P.name+' · '+strip(r.line.text));}catch{}
    let spoke=false;try{spoke=!!root.VoidAudio?.speak?.(id,r.line.text,false,false,true);}catch{}
    const ms=spoke&&info?info.duration*1000+2500:Math.min(MAX_LINE,2200+strip(r.line.text).length*65);
    rec={id,text:r.line.text,perf:performance.now(),until:now+ms};
   }
   for(const f of figs.values())settle(f,!!rec&&rec.id===f.id&&playing(now));
  }catch(e){if(!tick.warned){tick.warned=true;console.warn('[VOID//RUNNER] Nomi and Se7en',e);}}
 }
 const audible_=(w,inside)=>!inside||audible(w);
 function stopSpeech(){try{const v=root.VoidVoiceClips?.now;if(v&&MEMBERS.includes(v.who)&&!v.ended)root.VoidAudio?.cancel?.();}catch{}}
 setInterval(tick,250);
 root.VoidTeaDuo={...pure,get ready(){return figs.size===MEMBERS.length;},get available(){return !missing;},figure:id=>figs.get(id)||null,get state(){return duo;},get speaking(){return rec?{id:rec.id,text:rec.text}:null;},tick};
})(typeof globalThis!=='undefined'?globalThis:this);
