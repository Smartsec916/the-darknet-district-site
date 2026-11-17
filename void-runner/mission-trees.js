/* MISSION TREES (pure: browser and Node tests; no network, no DOM). Read-only extraction for the Developer Tools > Mission Editor.
   It lists every mission tree that exists in the game's own data, never invents one: the beginner campaign (beginner.js), the registry missions (mission-log.js,
   grouped by the arcs campaign.js runs), Rook's contract board (campaign.js contracts), the free chapters (content.js), and the owner's drafts. For each mission it
   gathers the NPCs involved (giver, speakers, who you deliver to) with their registered voice (read-only), what each NPC says (from the beginner records, the
   structured story scenes, and the plain-text lines of the scene scripts listed in SCENES below), the steps, where the mission ends and what becomes available.
   Lines from David's own scripts (design docs 05, 06, 07, 09, 10, 12) are LOCKED. Inline lines are read from the scripts' text: only plain quoted lines are listed;
   a scene whose lines are partly assembled by code says so (partial). Nothing here changes the game. */
(function(root){
 'use strict';
 const STATUS={active:'ACTIVE · in the current District game',historical:'HISTORICAL · not reachable in the current District game',draft:'DRAFT · not in the game',
  archived:'REMOVED FROM THE GAME (archived) · not in the game. Kept to read and to copy into a new tree.'};
 const PL_=()=>typeof module!=='undefined'&&module.exports?require('./places.js'):root.VoidPlaces;
 const MS_=()=>typeof module!=='undefined'&&module.exports?require('./main-story.js'):root.VoidMainStory;
 // Every older tree was removed from the game on 17 Nov 2026 (David: "Go ahead and remove all missions in the game"); only the main storyline and the owner's trees run.
 const ARCHIVED=new Set(['beginner','vesper-opening','sealed-cargo','communion','natural-order','other-registry','rook-contracts','district-drafts','draft-studio']);
 const MC_=()=>typeof module!=='undefined'&&module.exports?require('./mission-content.js'):root.VoidMissionContent;
 const G_=()=>typeof module!=='undefined'&&module.exports?require('./mission-givers.js'):root.VoidMissionGivers;
 const DOCS={'05':'design doc 05 (Admin, the Communion and the Natural Order)','06':'design doc 06 (Iris, return for payment)','07':'design doc 07 (the cargo recipients)',
  '09':'design doc 09 (Iris’s follow-up contracts)','10':'design doc 10 (the faction homeworlds)','12':'design doc 12 (Admin introduces WarFlying)'};
 const lockLabel=doc=>'David’s script — locked ('+DOCS[doc]+')';
 /* Registry missions grouped by the arc that runs them (campaign.js). Any registry mission missing from these lists still appears, under "Other registry missions". */
 const ARCS=[
  {id:'vesper-opening',title:'Vesper opening and Rook’s first jobs',missions:['ground-training','flight-training','meet-rook','first-station','combat-qualification','legal-run','return','illegal-run','meet-admin'],
   note:'The October 2026 opening (Mara, Elias’s recording, Rook at Meridian). A new District campaign never reaches it; Developer Tools > Test & Jump To can.'},
  {id:'sealed-cargo',title:'Don’t Ask Questions (Admin’s sealed cargo for Rook)',missions:['admin-sealed-cargo-01'],note:'Offered by Admin once the faction deliveries are under way, in an old (open mission pool) campaign only.'},
  {id:'communion',title:'The Communion arc',missions:['communion-delivery','communion-supply','communion-origin-mission-01','communion-restoration-01'],note:'Admin’s Communion delivery, Iris’s follow-up contract, Elara’s homeworld run and Dr. Kess’s work on The Nexus. Old (open mission pool) campaigns only.'},
  {id:'natural-order',title:'The Natural Order arc',missions:['order-delivery','order-supply','natural-order-origin-mission-01','natural-order-agriculture-01'],note:'Admin’s Natural Order delivery, Iris’s follow-up contract, Marcus’s homeworld run and Daniel Mercer’s work. Old (open mission pool) campaigns only.'}];
 /* Where each mission's lines are in the scene scripts. at: [mission, slot] where slot is 'offer', 'after' or a step id. from/to: text anchors in the file (to is searched after from).
    who: the main speaker of lines written as plain strings (questions and farewells). doc: David's script (locked). placeholder: Claude's UNREVIEWED lines. */
 const SCENES=[
  {file:'void-runner/faction-scenes.js',title:'Taking a delivery (or a full hold)',from:'function take(faction,giver){',to:'// ---- Admin (doc 05) ----',at:[['communion-delivery','offer'],['order-delivery','offer']],shared:true},
  {file:'void-runner/faction-scenes.js',title:'Admin offers the two deliveries',from:'// ---- Admin (doc 05) ----',to:'// ---- "Don\'t Ask Questions"',at:[['communion-delivery','offer'],['order-delivery','offer']],doc:'05',shared:true},
  {file:'void-runner/faction-scenes.js',title:'Admin offers the sealed crate',from:'// ---- "Don\'t Ask Questions"',to:'// ---- Admin introduces WarFlying',at:[['admin-sealed-cargo-01','offer']],placeholder:true},
  {file:'void-runner/faction-scenes.js',title:'Afterwards: Admin introduces WarFlying',from:'// ---- Admin introduces WarFlying',to:'const warflyingDue',at:[['admin-sealed-cargo-01','after']],doc:'12'},
  {file:'void-runner/faction-scenes.js',title:'Admin between jobs',from:'const warflyingDue',to:'// ---- Rook takes the sealed crate',at:[['communion-delivery','after'],['order-delivery','after'],['admin-sealed-cargo-01','after']],shared:true},
  {file:'void-runner/faction-scenes.js',title:'Rook takes the crate and pays',from:'// ---- Rook takes the sealed crate',to:'// ---- Iris (doc 06) ----',at:[['admin-sealed-cargo-01','deliver']],placeholder:true},
  {file:'void-runner/faction-scenes.js',title:'Iris offers the delivery you did not take',from:'// ---- Iris (doc 06) ----',to:'// ---- Iris\'s follow-up contracts (doc 09) ----',at:[['communion-delivery','payment'],['order-delivery','payment']],doc:'06',shared:true},
  {file:'void-runner/faction-scenes.js',title:'Iris pays and offers the follow-up contracts',from:'// ---- Iris\'s follow-up contracts (doc 09) ----',to:'// ---- Recipients (doc 07) ----',at:[['communion-delivery','payment'],['order-delivery','payment'],['communion-supply','offer'],['order-supply','offer']],doc:'09',shared:true},
  {file:'void-runner/faction-scenes.js',title:'Dr. Elara Voss receives the delivery',from:'communion:{who:elara,intro:[',to:'\'natural-order\':{who:marcus,intro:[',at:[['communion-delivery','deliver']],doc:'07',who:'elara'},
  {file:'void-runner/faction-scenes.js',title:'Marcus Vale receives the delivery',from:'\'natural-order\':{who:marcus,intro:[',to:'// Follow-up deliveries (doc 09)',at:[['order-delivery','deliver']],doc:'07',who:'marcus'},
  {file:'void-runner/faction-scenes.js',title:'Elara receives the supply shipment and raises the homeworld run',from:'recipients.communion.supply=[',to:'recipients[\'natural-order\'].supply=[',at:[['communion-supply','deliver']],doc:'09'},
  {file:'void-runner/faction-scenes.js',title:'Marcus receives the supply shipment and raises the homeworld run',from:'recipients[\'natural-order\'].supply=[',to:'const paymentDue',at:[['order-supply','deliver']],doc:'09'},
  {file:'void-runner/homeworld-scenes.js',title:'Dr. Adrian Kess receives the shipment',from:'arrival:[kess(',to:'offer:[kess(',at:[['communion-origin-mission-01','deliver']],doc:'10'},
  {file:'void-runner/homeworld-scenes.js',title:'Dr. Kess offers work on The Nexus',from:'offer:[kess(',to:'\'natural-order\':{who:mercer,',at:[['communion-restoration-01','offer']],doc:'10',who:'kess'},
  {file:'void-runner/homeworld-scenes.js',title:'Daniel Mercer receives the shipment',from:'arrival:[mercer(',to:'offer:[mercer(',at:[['natural-order-origin-mission-01','deliver']],doc:'10'},
  {file:'void-runner/homeworld-scenes.js',title:'Daniel Mercer offers work on the homeworld',from:'offer:[mercer(',to:' function offer(faction',at:[['natural-order-agriculture-01','offer']],doc:'10',who:'mercer'},
  {file:'void-runner/prologue-integration.js',title:'Elias’s recording and Mara in the workshop',from:'VoidInteractions.register(\'opening-recording\'',to:'function openingCockpit',at:[['ground-training','offer']]},
  {file:'void-runner/prologue-integration.js',title:'Mara offers the lessons, or sends you to Rook',from:'function skipTutorial',to:'screen.addEventListener(\'click\',e=>{const a=e.target.closest(\'button\')?.dataset.action;if(a===\'tutorial-yes\')',at:[['meet-rook','offer']]},
  {file:'void-runner/prologue-integration.js',title:'Iris at the District scanner (Rook vouched for you)',from:'function districtBadgeIssued',to:'VoidInteractions.register(\'district-scan\'',at:[['meet-admin','meet-admin']]},
  {file:'void-runner/prologue-integration.js',title:'Admin and Iris welcome you to the District',from:'VoidInteractions.register(\'admin\',()=>{state.universe.completedObjectives',to:'VoidInteractions.register(\'terminal\'',at:[['meet-admin','meet-admin']]},
  {file:'void-runner/scenes.js',title:'Rook at the bar offers the next job',from:'function rookConversation(){',to:'// Leaving the offer never commits',at:[['legal-run','offer'],['illegal-run','offer']],shared:true},
  {file:'void-runner/hangar.js',title:'Rook’s missile launcher voucher',from:'const rookMissileLine',to:'\n',at:[['combat-qualification','offer']]}];
 const FILES=[...new Set(SCENES.map(s=>s.file))];
 // Scripts whose lines are shown through talk() → renderLine(), so live-content.js can put an edited line over them at play time. Lines elsewhere need a code change.
 const TALK_FILES=['void-runner/faction-scenes.js','void-runner/homeworld-scenes.js','void-runner/prologue-integration.js','void-runner/scenes.js','void-runner/world-integration.js','void-runner/hangar.js','void-runner/story-content.js','void-runner/milked.js'];
 /* The engine a re-voiced line goes through, per character. Default: Kokoro through tools/audio/generate.py --from-queue with the character's registered approved voice.
    Admin: ElevenLabs "Bill Adams" (the voice of his ElevenLabs lines in assets/audio/voice/extra/manifest.json). Nothing is generated from the editor; ElevenLabs re-voicing waits for David's approval. */
 const VOICE_ENGINES={admin:{engine:'elevenlabs',voice:'ElevenLabs voice chosen by David on 17 Nov 2026',voiceId:'DMyrgzQFny3JI1Y1paM5',note:'waiting for ElevenLabs re-voice (needs approval)'},iris:{engine:'elevenlabs',voice:'ElevenLabs voice chosen by David on 17 Nov 2026 (android effect still applied)',voiceId:'CvD6hF1BJzAFN428j1cO',note:'waiting for ElevenLabs re-voice (needs approval)'},
  rook:{engine:'elevenlabs',voice:'ElevenLabs voice chosen by David on 17 Nov 2026',voiceId:'wzVFxVZCBIi6KBxNhQDI',note:'waiting for ElevenLabs re-voice (needs approval)'}};
 const PLAYER=new Set(['pilot','You','you','player']);
 const ALIAS={Admin:'admin',Iris:'iris',Bartender:'bartender','Arcade attendant':'attendant','Landing terminal':'landing-terminal'};
 const TARGETS={admin:'admin','district-iris':'iris','district-bar':'bartender','district-shop':null,terminal:'landing-terminal',board:null,rook:'rook',elara:'elara',marcus:'marcus',kess:'kess',mercer:'mercer'};
 const PLACE_INTERACTIONS={admin:'The Darknet District counter','district-iris':'Iris at The Darknet District','district-bar':'the District bar','district-shop':'the District shop',terminal:'the Landing Terminal on the street',board:'Pad 01'};
 // FNV-1a: a short stable id for a line (speaker + text).
 const hash=s=>{let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}return h.toString(16).padStart(8,'0');};
 const unq=s=>s.replace(/\\(['\\])/g,'$1');
 /* Lines in one scene section. Returns {lines:[{who,text,placeholder}], partial}. */
 function sceneLines(text,scene){
  const a=text.indexOf(scene.from);if(a<0)return null;const b=scene.to==='\n'?text.indexOf('\n',a):text.indexOf(scene.to,a+scene.from.length);const end=b<0?text.length:b,part=text.slice(a,end);
  const helpers={};for(const m of text.matchAll(/(\w+)=line\('([^']+)'\)/g))helpers[m[1]]=m[2];for(const m of text.matchAll(/(\w+)=text=>\(\{who:'([^']+)',text\}\)/g))helpers[m[1]]=m[2];
  const found=[],S="'((?:[^'\\\\\\n]|\\\\.)*)'";
  if(Object.keys(helpers).length)for(const m of part.matchAll(new RegExp('\\b('+Object.keys(helpers).join('|')+')\\('+S+'\\)','g')))found.push({at:m.index,who:helpers[m[1]],text:unq(m[2])});
  for(const m of part.matchAll(new RegExp("\\{who:'([^']+)',text:"+S+'\\}','g')))found.push({at:m.index,who:m[1],text:unq(m[2])});
  if(scene.who){for(const m of part.matchAll(new RegExp('\\['+S+','+S+','+S+'\\]','g'))){found.push({at:m.index,who:'pilot',text:unq(m[2])});found.push({at:m.index+1,who:scene.who,text:unq(m[3])});}
   for(const m of part.matchAll(new RegExp('farewell:'+S,'g')))found.push({at:m.index,who:scene.who,text:unq(m[1])});
   for(const m of part.matchAll(new RegExp('accept:'+S,'g')))found.push({at:m.index,who:'pilot',text:unq(m[1])});}
  found.sort((x,y)=>x.at-y.at);
  const src=part.split('\n');let pos=0;const lineOf=[];for(let i=0;i<src.length;i++){lineOf.push(pos);pos+=src[i].length+1;}
  const row=at=>{let i=0;while(i+1<lineOf.length&&lineOf[i+1]<=at)i++;return i;};
  const lines=found.map(f=>{const i=row(f.at);return {who:f.who,text:f.text,placeholder:!!scene.placeholder||/UNREVIEWED/.test(src[i])||(i>0&&/^\s*\/\/.*UNREVIEWED/.test(src[i-1]))};});
  const partial=/text:`|text:'[^'\n]*'\s*\+|text:[a-zA-Z(]|\$\{/.test(part);
  return {lines,partial};
 }
 /* Build every tree. src: {missions (VoidMissions.definitions), beginner (VoidBeginner.MISSIONS), content (VoidContent), campaign (VoidCampaign), story (story-content api),
    registry (npc-voice-registry.json), manifest (voice manifest, optional), files {path:text}, modules (progression modules), ships (VoidShips.ships), locations (VoidUniverse.locations),
    stores (StudioModel.STORES), studioDraft ({missions}|null), localDraft ({missions}|null), serverDrafts ([{id,title,kind,revision}]|null)} */
 function build(src){
  const reg=(src.registry&&src.registry.npcs)||{},byName={};for(const [id,n] of Object.entries(reg))byName[n.displayName]=id;
  const clips=new Map();for(const [m,label] of [[src.manifest,'kokoro'],[src.extraManifest,'elevenlabs']])for(const [cid,l] of Object.entries((m&&m.lines)||{}))clips.set(l.speaker+'|'+l.text,{id:cid,engine:label,voice:l.voice||null,source:l.source});
  const recorded=new Set(clips.keys()),clipOf=(id,text)=>clips.get(id+'|'+text)||null,engineOf=id=>VOICE_ENGINES[id]||(reg[id]?{engine:'kokoro',voice:reg[id].voice}:null);
  const locs=src.locations||{},stations=(src.campaign&&src.campaign.stations)||{};
  const place=id=>id?((stations[id]&&stations[id].name)||(locs[id]&&locs[id].name)||({earth:'NeoChinatown'})[id]||id):'';
  const labels={'landing-terminal':'Landing terminal'};
  const canon=who=>{if(!who)return '';if(PLAYER.has(who))return 'player';if(ALIAS[who])return ALIAS[who];if(reg[who])return who;if(byName[who])return byName[who];const l=String(who).toLowerCase();if(reg[l])return l;const id=l.replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');labels[id]=String(who);return id;};
  const npcName=id=>id==='player'?'You (the player)':reg[id]?reg[id].displayName:labels[id]||id;
  const line=(who,text,extra)=>{const id=canon(who);const l={id:'L-'+id+'-'+hash(id+'|'+text),ref:id+'|'+text,who:id,name:npcName(id),text,recorded:recorded.has(id+'|'+text),clip:clipOf(id,text),voice:reg[id]?{voice:reg[id].voice,status:reg[id].status}:null,engine:engineOf(id),...extra};l.adapter=l.kind==='beginner'||l.kind==='design'?'records':TALK_FILES.includes(l.source)?'talk':'code-change';return l;};
  const trees=[],extraLines=[];
  // ---- the beginner campaign (active) ----
  const B=src.beginner||[],studio=src.studioDraft&&Array.isArray(src.studioDraft.missions)?src.studioDraft.missions:null,useB=studio||B;
  const bMissions=useB.map((m,i)=>{
   const shipped=B.find(x=>x.id===m.id),steps=(m.objectives||[]).map(o=>({id:o.id,label:o.label,event:o.on||'',requires:o.requires||[],where:o.interaction?(PLACE_INTERACTIONS[o.interaction]||o.interaction):o.destination?place(o.destination):'',interaction:o.interaction||'',
    lines:(o.say||[]).map((l,k)=>line(l.who,l.text,{key:'beginner:'+m.id+'/'+o.id+'/say/'+k,kind:'beginner',editable:'studio',source:'void-runner/beginner.js'})),
    early:(o.early||[]).map((l,k)=>line(l.who,l.text,{key:'beginner:'+m.id+'/'+o.id+'/early/'+k,kind:'beginner',editable:'studio',source:'void-runner/beginner.js'}))}));
   const last=(m.objectives||[])[m.objectives.length-1]||{},unlocks=[];
   for(const o of m.objectives||[])if(o.award==='ship'){unlocks.push({kind:'ship',id:'starter',when:o.id,name:(src.ships&&src.ships.starter&&src.ships.starter.name)||'starter',note:'The courier hull is registered to the player and appears on Pad 01.',source:'void-runner/beginner.js award, campaign.js awardStarterShip'});
    unlocks.push({kind:'travel',id:'free-travel',when:o.id,name:'Free travel',note:'Every place can be chosen as a destination.',source:'void-runner/campaign.js awardStarterShip'});}
   if(Number(m.rewards)>0)unlocks.push({kind:'credits',id:'credits',amount:Number(m.rewards),when:'complete',name:Number(m.rewards)+' credits',source:'void-runner/beginner.js'});
   unlocks.push({kind:'flag',id:'br_'+m.id,when:'complete',name:'story flag br_'+m.id,note:'Records that this mission’s reward was paid.',source:'void-runner/beginner.js'});
   for(const u of m.unlocks||[])unlocks.push({kind:'design-item',id:u.item,when:'complete',name:u.item,note:'Studio design note (sold by '+(u.seller||'nobody named')+'). The game does not act on it yet.',draftOnly:true,source:'Developer Studio draft'});
   const next=useB.filter(x=>(x.prerequisites||[]).includes(m.id));
   return {key:'beginner:'+m.id,id:m.id,tree:'beginner',engine:'beginner',title:m.title,type:m.type,description:m.description||'',giver:canon(m.giver||''),giverName:npcName(canon(m.giver||'')),
    start:'earth',destination:m.destination||'',credits:Number(m.rewards)||0,draftOnly:!shipped,steps,
    offer:(m.offer||[]).map((l,k)=>line(l.who,l.text,{key:'beginner:'+m.id+'/offer/'+k,kind:'design',editable:'studio',source:'Developer Studio draft',designOnly:true})),scenes:[],
    ending:{text:last.interaction?'Ends at '+(PLACE_INTERACTIONS[last.interaction]||last.interaction)+(last.say&&last.say.length?' ('+npcName(canon(last.say[0].who))+' speaks)':''):last.destination?'Ends on arrival at '+place(last.destination):'Ends when its last step is done',
     next:next.map(x=>x.id),branches:(m.choices||[]).map(c=>({text:'Choice: '+c.label+(c.next?' → '+c.next:' → not decided'),draftOnly:true}))},
    unlocks,order:i,server:null};});
  trees.push({id:'beginner',title:'Beginner campaign: Sleeping Pod to first ship',status:'active',statusText:STATUS.active,engine:'beginner',source:'void-runner/beginner.js',
   note:'Removed from the game on 17 Nov 2026 (Mission 001 — Awakening replaced it). It was never approved: its wording was PROPOSED placeholder text (docs/development/BEGINNER_CAMPAIGN.md). Its FIRST DEPARTURE used to give the courier hull and Meridian; nothing gives a ship now until a future mission does.'+(studio?' Showing your Studio draft.':''),missions:bMissions});
  // ---- registry missions (historical arcs) ----
  const defs=src.missions||{},C=src.campaign||{},seen=new Set();
  const facts=registryUnlocks(C,src);
  const regMission=(id,tree,i)=>{const d=defs[id];seen.add(id);
   const steps=(d.objectives||[]).map(o=>({id:o.id,label:o.label,optional:o.required===false,event:'',requires:[],where:o.interaction?(o.interaction+(o.destination?' · '+place(o.destination):'')):o.destination?place(o.destination):'',interaction:o.interaction||'',lines:[],early:[]}));
   const giver=canon(d.giver||'');const target=d.interaction&&TARGETS[d.interaction]!==undefined?TARGETS[d.interaction]:d.interaction?canon(d.interaction):null;
   let ending;if(d.after&&d.after.deliver)ending='Deliver to '+npcName(target)+' at '+place(d.destination)+', then collect payment from '+npcName(TARGETS[d.after.deliver.interaction]||d.after.deliver.interaction)+' at '+place(d.after.deliver.destination)+'.';
   else if(d.interaction)ending='Ends with '+npcName(target)+' at '+place(d.end||d.destination)+'.';else if(d.destination)ending='Ends on arrival at '+place(d.destination)+'.';else ending='Ends when its last step is done.';
   const branches=[];if(['communion-delivery','order-delivery'].includes(id))branches.push({text:'Admin offers this and the other faction’s delivery in the same conversation; the player picks one first, and Iris offers the other afterwards.',source:'void-runner/faction-scenes.js (design docs 05, 06)'});
   if(['legal-run','illegal-run'].includes(id))branches.push({text:'Rook offers the legal run first and the illegal run after it, at the Meridian bar.',source:'void-runner/scenes.js'});
   const credits=facts.credits[id]!=null?facts.credits[id]:Number.isFinite(Number(d.rewards))?Number(d.rewards):0;
   const unlocks=[...(credits>0?[{kind:'credits',id:'credits',amount:credits,when:'complete',name:credits+' credits',source:facts.creditSource[id]||'void-runner/mission-log.js'}]:[]),...(facts.list[id]||[])];
   return {key:'registry:'+id,id,tree,engine:'registry',title:d.title,type:d.type,description:d.description||'',giver,giverName:npcName(giver),target,start:d.start||'',destination:d.destination||'',credits,steps,offer:[],scenes:[],
    ending:{text:ending,next:[],branches},unlocks,order:i,server:'registry:'+id};};
  for(const arc of ARCS){const ms=arc.missions.filter(id=>defs[id]&&defs[id].beginner!==true).map((id,i)=>regMission(id,arc.id,i));ms.forEach((m,i)=>{if(ms[i+1])m.ending.next=[ms[i+1].id];});
   trees.push({id:arc.id,title:arc.title,status:'historical',statusText:STATUS.historical,engine:'registry',source:'void-runner/mission-log.js, void-runner/campaign.js',note:arc.note,missions:ms});}
  const other=Object.keys(defs).filter(id=>!seen.has(id)&&defs[id]&&defs[id].beginner!==true);
  if(other.length)trees.push({id:'other-registry',title:'Other registry missions',status:'historical',statusText:STATUS.historical,engine:'registry',source:'void-runner/mission-log.js',note:'Registry missions not run by any arc above.',missions:other.map((id,i)=>regMission(id,'other-registry',i))});
  // ---- scene lines (inline scripts and structured scenes) ----
  const all=new Map();for(const t of trees)for(const m of t.missions)all.set(m.id,m);
  for(const sc of SCENES){const text=(src.files||{})[sc.file];if(text==null)continue;const r=sceneLines(text,sc);if(!r)continue;
   for(const [mid,slot] of sc.at){const m=all.get(mid);if(!m)continue;
    const lines=r.lines.map(l=>{const locked=!!sc.doc&&!l.placeholder;return line(l.who,l.text,{kind:'inline',source:sc.file,locked,lock:locked?lockLabel(sc.doc):'',placeholder:l.placeholder,editable:'local',scene:sc.title});});
    for(const l of lines)l.key=m.key+'/'+slot+'/'+l.id;
    const scene={title:sc.title,slot,source:sc.file,doc:sc.doc||null,lock:sc.doc?lockLabel(sc.doc):'',partial:r.partial,shared:!!sc.shared,lines};
    m.scenes.push(scene);const step=m.steps.find(s=>s.id===slot);if(step)step.lines.push(...lines);else if(slot==='offer')m.offer.push(...lines);}}
  // the structured opening scene (story-content.js dialogue): Mara's first conversation (old opening)
  const dlg=src.story&&src.story.dialogue&&src.story.dialogue.mara_workshop_intro,gt=all.get('ground-training');
  if(dlg&&gt){const lines=Object.entries(dlg.nodes).filter(([,n])=>n.text).map(([nid,n])=>({...line(n.character,n.text,{kind:'structured',source:'void-runner/story-content.js',editable:'local',scene:'mara_workshop_intro'}),key:gt.key+'/offer/structured:'+nid,node:nid}));
   gt.scenes.unshift({title:'A last gift (structured scene mara_workshop_intro)',slot:'offer',source:'void-runner/story-content.js',doc:null,lock:'',partial:false,lines});gt.offer.unshift(...lines);}
  // ---- Rook's contract board and the free chapters (flown contracts) ----
  const contract=(c,tree,i,source,status)=>{const giver=canon(c.contact||'');return {key:tree+':'+c.id,id:c.id,tree,engine:'contract',title:c.name,type:'cargo',description:c.briefing||'',giver,giverName:npcName(giver),start:'meridian',destination:c.destination,credits:Number(c.reward)||0,
   steps:[{id:'arrive',label:'Fly '+(c.cargo||'the cargo').toLowerCase()+' to '+place(c.destination)+(c.legal===false?' (illegal cargo)':''),event:'',requires:[],where:place(c.destination),interaction:'',lines:[],early:[]}],
   offer:c.briefing?[line(c.contact||'',c.briefing,{key:tree+':'+c.id+'/offer/briefing',kind:'briefing',editable:'local',source,scene:'Briefing (shown on the contract card)'})]:[],scenes:[],
   ending:{text:'Ends on arrival at '+place(c.destination)+' (a flown contract).',next:[],branches:[]},unlocks:[...(Number(c.reward)>0?[{kind:'credits',id:'credits',amount:Number(c.reward),when:'complete',name:c.reward+' credits',source}]:[]),...(c.requires===undefined?[]:[])],order:i,server:tree==='campaign'?null:null};};
  if(Array.isArray(C.contracts)&&C.contracts.length)trees.push({id:'rook-contracts',title:'Rook’s contract board (Meridian)',status:'historical',statusText:STATUS.historical,engine:'contract',source:'void-runner/campaign.js contracts',note:'Flown cargo contracts with their contacts. Old (open mission pool) campaigns only.',missions:C.contracts.map((c,i)=>contract(c,'rook-contracts',i,'void-runner/campaign.js'))});
  const content=src.content||{};
  for(const ch of content.chapters||[]){const ms=(content.missions||[]).filter(m=>m.chapter===ch.id).map((c,i)=>{const m=contract(c,'chapter-'+ch.id,i,'void-runner/content.js');m.key='campaign:'+c.id;m.server='campaign:'+c.id;return m;});
   ms.forEach((m,i)=>{if(ms[i+1]){m.ending.next=[ms[i+1].id];m.unlocks.push({kind:'mission',id:ms[i+1].id,when:'complete',name:'Next contract: '+ms[i+1].title,source:'void-runner/content.js requires'});}});
   trees.push({id:'chapter-'+ch.id,title:'Chapter: '+ch.name,status:'historical',statusText:STATUS.historical,engine:'contract',source:'void-runner/content.js',note:ch.subtitle+' Free flown contracts (combat runs). Old (open mission pool) campaigns only.',missions:ms});}
  // ---- District drafts kept as data in the game (inactive, not started by anything) ----
  const MK=src.milked;
  if(MK&&MK.MISSION){const M=MK.MISSION,npc=M.npc,dl=(MK.DIALOGUE||{})[(String((M.dialogue||[])[0]||'').split('.')[0])]||{},said=((dl.greeting)||[]).map(t=>line(npc,t,{kind:'inline',source:'void-runner/milked.js',editable:'local',scene:'Eva’s greeting at reception'}));
   const m={key:'district:'+M.id,id:M.id,tree:'district-drafts',engine:'data',title:M.title,type:'side',description:M.objective||'',giver:npc,giverName:line(npc,'').name,target:npc,start:'earth',destination:'earth',credits:0,
    steps:(M.steps||[]).map(x=>({id:x.id,label:x.text,event:'',requires:[],where:'Milked',interaction:x.id==='reception'?'milked-eva':'',lines:x.id==='reception'?said:[],early:[]})),offer:[],
    scenes:[{title:'Eva’s greeting at reception',slot:'reception',source:'void-runner/milked.js',doc:null,lock:'',partial:false,lines:said}],ending:{text:'Ends at Milked reception with Eva.',next:[],branches:[]},unlocks:[],order:0,server:null,inactive:true};
   for(const l of said)l.key=m.key+'/reception/'+l.id;
   trees.push({id:'district-drafts',title:'District drafts in the game data (inactive)',status:'draft',statusText:STATUS.draft,engine:'data',source:'void-runner/milked.js MISSION',note:(M.approval||'PROPOSED')+'. Data only: nothing registers or starts it. Activating it needs David’s approval.',missions:[m]});
   for(const [who,d] of Object.entries(MK.DIALOGUE||{})){const id=(MK.MODELS&&MK.MODELS[who]&&MK.MODELS[who].id)||who;for(const t of d.greeting||[])extraLines.push(line(id,t,{kind:'outside',source:'void-runner/milked.js',editable:'local',group:'Greetings, idle and “come back later” lines'}));}}
  // ---- drafts ----
  if(studio){const added=studio.filter(m=>!B.some(x=>x.id===m.id));if(added.length)trees.push({id:'draft-studio',title:'Your draft: new beginner missions',status:'draft',statusText:STATUS.draft,engine:'beginner',source:'Developer Studio draft (this browser)',note:'Missions you added in the Studio draft. They are part of the beginner campaign tree above too.',missions:bMissions.filter(m=>added.some(a=>a.id===m.id)).map(m=>({...m,tree:'draft-studio'}))});}
  // ---- the owner's NEW trees (local draft; ids start with draft-, never change) ----
  const roster=src.givers||G_().roster({registry:src.registry,people:src.people,story:src.story&&src.story.characters,temple:src.temple}),gname=id=>(roster.find(g=>g.id===id)||{}).name||id||'';
  const MSx=MS_(),num=(n,t)=>MSx?MSx.label(n,t):t;
  for(const ot of src.ownerTrees||[]){const story=!!(MSx&&MSx.STORY_TREES.includes(ot.id));const ms=(ot.missions||[]).map((m,i)=>{
    const steps=(m.objectives||[]).map(o=>({id:o.id,label:o.label||'',kind:o.kind,event:'',requires:[],where:o.kind==='go'||o.kind==='enter'||o.kind==='leave'?((G_().PLACE.get(o.place)||{}).name||(PL_()&&PL_().node(o.place)?PL_().label(o.place):'')||o.place||''):o.kind==='send-photo'?'the V1 (Messages) · to '+gname(o.npc):o.kind==='pod-exit'?'the Sleeping Pod':o.kind==='message'?'the V1 (Messages)':o.npc?gname(o.npc):o.item||'',interaction:'',message:o.message||null,
     lines:[...(o.say||[]).map((l,k)=>line(l.who||(o.kind==='photo'?m.giver:o.npc||m.giver),l.text||'',{key:'tree:'+m.id+'/'+o.id+'/say/'+k,kind:'tree',editable:'tree',source:'your new tree (draft)',needsVoice:true})),
      ...(o.wrong||[]).map((l,k)=>line(l.who||o.npc||m.giver,l.text||'',{key:'tree:'+m.id+'/'+o.id+'/wrong/'+k,kind:'tree',editable:'tree',source:'your new tree (draft): reply to the wrong photo',needsVoice:true}))],
     early:(o.early||[]).map((l,k)=>line(l.who||o.npc||m.giver,l.text||'',{key:'tree:'+m.id+'/'+o.id+'/early/'+k,kind:'tree',editable:'tree',source:'your new tree (draft)',needsVoice:true}))}));
    const e=m.ending||{};
    return {key:'tree:'+m.id,id:m.id,tree:ot.id,engine:'tree',title:num(m.number,m.title||'(no name yet)'),name:m.title||'',number:Number.isInteger(m.number)?m.number:null,type:m.type||'side',description:m.description||'',giver:m.giver||'',giverName:gname(m.giver),start:'',destination:'',credits:Number(m.rewards)||0,draftOnly:true,steps,
     offer:(m.offer||[]).map((l,k)=>line(l.who||m.giver,l.text||'',{key:'tree:'+m.id+'/offer/'+k,kind:'tree',editable:'tree',source:'your new tree (draft)',needsVoice:true})),scenes:[],
     ending:{text:e.npc?'Ends when the player hands in to '+gname(e.npc)+(e.place?' at '+((G_().PLACE.get(e.place)||{}).name||e.place):''):'Ends when its last step is done',next:ot.missions[i+1]?[ot.missions[i+1].id]:[],branches:(m.choices||[]).map(c=>({text:'Choice: '+(c.label||'(no text)')+(c.next?' → '+c.next:' → not decided'),draftOnly:true}))},
     unlocks:(m.unlocks||[]).map(u=>({...u,when:u.when||'complete',name:u.kind==='credits'?u.amount+' credits':u.kind==='flag'?'story flag mf_'+u.id:u.id||u.kind,source:'your new tree (draft)'})),order:i,server:null,raw:m};});
   trees.push({id:ot.id,title:ot.name||ot.id,status:story?'active':'draft',statusText:story?STATUS.active:STATUS.draft,engine:'tree',source:story?'The main storyline (void-runner/main-story.js; your edits are this browser’s draft until published)':'Your new tree (this browser’s draft; id '+ot.id+')',note:ot.note||'',ownerTree:true,story,missions:ms});}
  if(Array.isArray(src.serverDrafts)&&src.serverDrafts.length)trees.push({id:'draft-server',title:'Your private server drafts',status:'draft',statusText:STATUS.draft,engine:'server',source:'Stage 3B private drafts',note:'Drafts saved on the server. Open them in the Content atlas (admin/void-runner.html) for full editing.',
   missions:src.serverDrafts.map((d,i)=>({key:'server:'+d.id,id:d.id,tree:'draft-server',engine:'server',title:d.title||d.id,type:d.kind||'draft',description:'Private server draft r'+(d.revision||0)+'.',giver:'',giverName:'',credits:0,steps:[],offer:[],scenes:[],ending:{text:'',next:[],branches:[]},unlocks:[],order:i,server:null}))});
  // ---- everything older is archived (removed from the game; still readable and copyable) ----
  for(const t of trees)if(ARCHIVED.has(t.id)||t.id.startsWith('chapter-')){t.status='archived';t.statusText=STATUS.archived;t.archived=true;}
  // ---- display names (renames never change ids) ----
  for(const t of trees){t.originalTitle=t.title;const n=src.names&&src.names[t.id];if(typeof n==='string'&&n.trim()&&!t.ownerTree)t.title=n.trim();}
  // ---- NPCs per tree ----
  for(const t of trees){const npcs=new Map();const add=(id,role,m)=>{if(!id||id==='player')return;const n=npcs.get(id)||{id,name:npcName(id),roles:new Set(),missions:new Set(),voice:reg[id]?{voice:reg[id].voice,status:reg[id].status}:null,engine:VOICE_ENGINES[id]||(reg[id]?{engine:'kokoro',voice:reg[id].voice}:null),registered:!!reg[id]};n.roles.add(role);n.missions.add(m.id);npcs.set(id,n);};
   for(const m of t.missions){add(m.giver,'gives the mission',m);if(m.target)add(m.target,'you deliver to them',m);for(const s of m.steps){if(s.interaction&&TARGETS[s.interaction])add(TARGETS[s.interaction],'a step happens with them',m);for(const l of [...s.lines,...s.early])add(l.who,'speaks',m);}for(const l of m.offer)add(l.who,'speaks',m);for(const sc of m.scenes)for(const l of sc.lines)add(l.who,'speaks',m);}
   t.npcs=[...npcs.values()].map(n=>({...n,roles:[...n.roles],missions:[...n.missions]})).sort((a,b)=>a.name.localeCompare(b.name));}
  const npcs=npcView(trees,src,line,clips,reg,canon,extraLines);
  return {trees,npcs,counts:counts(trees),statusText:STATUS};
 }
 /* "All lines for <NPC>": every line a character speaks, in missions (by tree, mission, step and scene) and outside missions (both voice manifests: greetings, idle remarks,
    rules such as Admin's scanning line, shop and bar lines). Relay broadcasts are David's own lines for the broadcast voices and are not listed (never edited here). */
 function npcView(trees,src,line,clips,reg,canon,extra=[]){
  const out=new Map(),get=id=>{if(!out.has(id))out.set(id,{id,name:line(id,'').name,voice:reg[id]?{voice:reg[id].voice,status:reg[id].status}:null,engine:line(id,'').engine,inMissions:[],outside:[]});return out.get(id);};
  const seen=new Set();
  for(const t of trees)for(const m of t.missions){
   const push=(l,where)=>{if(l.who==='player'||!l.text)return;get(l.who).inMissions.push({...l,tree:t.id,treeTitle:t.title,mission:m.id,missionTitle:m.title,where});seen.add(l.ref);};
   for(const l of m.offer)push(l,'When the mission is offered');for(const s of m.steps){for(const l of s.lines)push(l,'Step: '+s.label);for(const l of s.early)push(l,'Too soon at: '+s.label);}
   for(const sc of m.scenes)for(const l of sc.lines)if(!m.offer.includes(l)&&!m.steps.some(s=>s.lines.includes(l)))push(l,'Scene: '+sc.title);}
  for(const [ref,c] of clips){const [who,...rest]=ref.split('|'),text=rest.join('|');if(seen.has(ref)||/relay-content\.json$/.test(c.source||''))continue;if(!reg[who])continue;
   const src2=c.source?(c.source.startsWith('void-runner/')?c.source:'void-runner/'+c.source):'';const l=line(who,text,{kind:'outside',source:src2,editable:'local'});seen.add(ref);
   l.group=/companion/.test(src2)?'VR companion talk':/district-people/.test(src2)?'Rules and remarks in the District':/prologue|world-integration|scenes\.js|hangar/.test(src2)?'Greetings, idle and “come back later” lines':'Other lines';get(who).outside.push(l);}
  for(const l of extra)if(!seen.has(l.ref)){seen.add(l.ref);get(l.who).outside.push(l);}
  for(const n of out.values()){n.inMissions.sort((a,b)=>a.treeTitle.localeCompare(b.treeTitle));n.counts={inMissions:n.inMissions.length,outside:n.outside.length,locked:n.inMissions.filter(l=>l.locked).length};}
  // Admin first (David starts with Admin), then everyone else by name.
  return [...out.values()].sort((a,b)=>(b.id==='admin')-(a.id==='admin')||a.name.localeCompare(b.name));
 }
 /* Validates line edits (local.lines: {ref:{to,unlocked?}}) against every known line. Locked lines (David's own scripts) need the owner's explicit unlock. */
 function validateLines(edits,index){
  const out=[],TAG=/<[^>]*>/;
  for(const [ref,e] of Object.entries(edits||{})){const l=index.get(ref);if(!l){out.push({level:'error',text:'A changed line no longer exists in the game: '+ref.slice(0,60)});continue;}
   const to=e&&e.to;if(typeof to!=='string'||!to.trim()||to.length>500||TAG.test(to)){out.push({level:'error',text:'“'+l.text.slice(0,40)+'…”: a line must be plain text, 500 characters at most.'});continue;}
   if(l.locked&&!e.unlocked)out.push({level:'error',text:'“'+l.text.slice(0,40)+'…” is '+l.lock+'. Unlock it first to change your own script.'});
   if(l.recorded&&to!==l.text)out.push({level:'warn',text:'“'+to.slice(0,40)+'…”: voice clip out of date. Text only until re-voiced.'});
   if(l.adapter==='code-change'&&to!==l.text)out.push({level:'warn',text:'“'+to.slice(0,40)+'…”: can be edited after the next update (needs a code change). Saved as a draft and exported for Claude or Codex.'});}
  return out;
 }
 function lineIndex(built){const idx=new Map();for(const t of built.trees)for(const m of t.missions)for(const l of allLines(m))if(l.ref&&l.kind!=='beginner'&&l.kind!=='design'&&l.kind!=='tree')idx.set(l.ref,l);for(const n of built.npcs||[])for(const l of n.outside)if(!idx.has(l.ref))idx.set(l.ref,l);return idx;}
 function counts(trees){const c={trees:trees.length,missions:0,active:0,historical:0,draft:0,archived:0,lines:0,locked:0};for(const t of trees){c[t.status]++;c.missions+=t.missions.length;for(const m of t.missions){const ls=allLines(m);c.lines+=ls.length;c.locked+=ls.filter(l=>l.locked).length;}}return c;}
 function allLines(m){const seen=new Set(),out=[];for(const l of [...m.offer,...m.steps.flatMap(s=>[...s.lines,...s.early]),...m.scenes.flatMap(s=>s.lines)])if(!seen.has(l.key)){seen.add(l.key);out.push(l);}return out;}
 /* Unlock facts for registry missions, read from campaign.js data (never invented): places discovered on accepting, payments, story flags, follow-up missions and rewards. */
 function registryUnlocks(C,src){
  const list={},credits={},creditSource={},mods=src.modules||{},add=(id,u)=>(list[id]??=[]).push(u);
  for(const d of Object.values(C.factionDeliveries||{})){add(d.id,{kind:'location',id:d.destination,when:'accept',name:d.destination,note:'Discovered when the delivery is accepted.',source:'void-runner/campaign.js acceptFaction'});add(d.id,{kind:'flag',id:d.flag,when:'accept',name:'story flag '+d.flag+' (accepted → delivered → paid)',source:'void-runner/campaign.js'});credits[d.id]=d.payment;creditSource[d.id]='void-runner/campaign.js factionDeliveries (paid by Iris)';}
  for(const d of Object.values(C.supplyDeliveries||{})){add(d.id,{kind:'location',id:d.destination,when:'accept',name:d.destination,note:'Discovered when the contract is accepted.',source:'void-runner/campaign.js acceptSupply'});add(d.id,{kind:'flag',id:d.flag,when:'accept',name:'story flag '+d.flag,source:'void-runner/campaign.js'});credits[d.id]=d.payment;creditSource[d.id]='void-runner/campaign.js supplyDeliveries (paid by Iris)';
   const intro=Object.values(C.factionDeliveries||{}).find(x=>x.faction===d.faction);if(intro)add(intro.id,{kind:'mission',id:d.id,when:'complete',name:'Iris’s follow-up contract',note:'Offered once both introductory deliveries are paid.',source:'void-runner/campaign.js supplyOffers'});}
  for(const [faction,h] of Object.entries(C.homeworlds||{})){const o=(C.originMissions||{})[faction];
   if(o){add(o.id,{kind:'location',id:h.planet,when:'accept',name:h.planet,note:'The homeworld opens when the run is accepted.',source:'void-runner/campaign.js acceptOrigin'});add(o.id,{kind:'flag',id:o.flag,when:'accept',name:'story flag '+o.flag,source:'void-runner/campaign.js'});add(o.id,{kind:'mission',id:h.work.id,when:'complete',name:'Work on the homeworld',note:'Offered by the person who receives the shipment.',source:'void-runner/homeworld-scenes.js'});
    const sup=Object.values(C.supplyDeliveries||{}).find(x=>x.faction===faction);if(sup)add(sup.id,{kind:'mission',id:o.id,when:'complete',name:'The homeworld run',note:'Raised by the recipient when the supply shipment arrives.',source:'void-runner/faction-scenes.js'});}
   add(h.work.id,{kind:'item',id:h.reward,store:'reward',when:'complete',name:(mods[h.reward]&&mods[h.reward].name)||h.reward,note:'A ship module given as the reward (never sold); fitted at any hangar.',source:'void-runner/campaign.js homeworlds, progression.js'});
   add(h.work.id,{kind:'flag',id:h.earned,when:'complete',name:'story flag '+h.earned,source:'void-runner/campaign.js'});}
  const s=C.sealedCargo;if(s){credits[s.id]=s.payment;creditSource[s.id]='void-runner/campaign.js sealedCargo (paid by Rook)';add(s.id,{kind:'flag',id:s.flag,when:'accept',name:'story flag '+s.flag,source:'void-runner/campaign.js'});
   add(s.id,{kind:'item',id:'warflying-scrambler',store:'district-store',when:'after',name:(mods['warflying-scrambler']&&mods['warflying-scrambler'].name)||'warflying-scrambler',note:'After the delivery Admin introduces WarFlying and sells the scrambler at the District counter.',source:'void-runner/faction-scenes.js adminStore'});}
  add('combat-qualification',{kind:'item',id:'launcher',store:'station-outfitter',when:'complete',name:'Missile launcher',note:'Rook’s voucher: free at the Ship Outfitter, fitted at the hangar.',source:'void-runner/hangar.js, content.js creditGear'});
  add('combat-qualification',{kind:'travel',id:'free-travel',when:'offer',name:'Free travel',note:'Independent routes open once Rook’s launcher offer is seen.',source:'void-runner/progression.js'});
  add('ground-training',{kind:'ship',id:'starter',when:'complete',name:'Kestrel / 01',note:'Mara hands over the Kestrel after the lessons.',source:'void-runner/prologue-integration.js openingHandoff'});
  return {list,credits,creditSource};
 }
 /* The unlock kinds the editor offers, with the real ids they may name (validation: only real NPCs, items, ships, locations and store ids). */
 function refs(src){const items={};for(const [id,m] of Object.entries(src.modules||{}))items[id]=m.name;for(const [id,g] of Object.entries((src.content&&src.content.creditGear)||{}))items[id]=g.name;for(const [id,g] of Object.entries((src.content&&src.content.gear)||{}))items[id]=g.name;
  return {items,ships:Object.fromEntries(Object.entries(src.ships||{}).map(([id,s])=>[id,s.name])),premium:new Set(Object.entries(src.ships||{}).filter(([,s])=>s.premium).map(([id])=>id)),locations:Object.fromEntries(Object.entries(src.locations||{}).map(([id,l])=>[id,((src.campaign&&src.campaign.stations&&src.campaign.stations[id]&&src.campaign.stations[id].name)||l.name||id)])),
   stores:Object.fromEntries((src.stores||[]).map(s=>[s.id,s.name])),npcs:Object.fromEntries(Object.entries((src.registry&&src.registry.npcs)||{}).map(([id,n])=>[id,n.displayName])),factions:{communion:'The Communion','natural-order':'The Natural Order'}};}
 /* Validates the owner's local edits for one mission against the real registries. edit: {title,description,steps{},lines{},credits,reputation[],unlocks[]}. */
 function validateEdit(mission,edit,r){
  const out=[],e=(t)=>out.push({level:'error',text:t}),w=(t)=>out.push({level:'warn',text:t}),TAG=/<[^>]*>/;
  if(edit.title!=null&&(!String(edit.title).trim()||edit.title.length>60||TAG.test(edit.title)))e('The title must be plain text, 1 to 60 characters.');
  if(edit.description!=null&&(edit.description.length>600||TAG.test(edit.description)))e('The description must be plain text, 600 characters at most.');
  for(const [id,label] of Object.entries(edit.steps||{})){if(!mission.steps.some(s=>s.id===id))e('Step "'+id+'" is not a step of this mission.');if(!String(label).trim()||label.length>500||TAG.test(label))e('Step "'+id+'": the label must be plain text.');}
  if(edit.credits!=null&&!(Number.isInteger(edit.credits)&&edit.credits>=0&&edit.credits<=100000))e('Credits must be a whole number between 0 and 100000.');
  for(const x of edit.reputation||[]){if(!r.factions[x.faction])e('Unknown faction "'+x.faction+'".');if(!(Number.isInteger(x.amount)&&x.amount>=-100&&x.amount<=100))e('Reputation must be a whole number between -100 and 100.');}
  for(const u of edit.unlocks||[]){
   if(u.kind==='item'){if(!r.items[u.id])e('Unknown store item "'+u.id+'".');if(!r.stores[u.store])e('Unknown store "'+u.store+'".');}
   else if(u.kind==='ship'){if(!r.ships[u.id])e('Unknown ship "'+u.id+'".');}
   else if(u.kind==='location'){if(!r.locations[u.id])e('Unknown place "'+u.id+'".');}
   else if(u.kind==='flag'){if(!/^[a-zA-Z][a-zA-Z0-9_-]{0,47}$/.test(u.id||''))e('A story flag name must be letters, digits, - or _ (48 at most).');if(!(typeof u.value==='boolean'||(typeof u.value==='string'&&u.value.length<=200&&!TAG.test(u.value))||Number.isSafeInteger(u.value)))e('A story flag value must be true/false, a number or short text.');}
   else e('Unknown kind of unlock "'+u.kind+'".');
   if(u.when&&u.when!=='complete'&&!mission.steps.some(s=>s.id===u.when))e('Unlock timing "'+u.when+'" is not a step of this mission.');}
  return out;
 }
 // ---------------------------------------------------------------- the owner's NEW trees (pure operations on the local draft; ids are made once and never change)
 const slug=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,24).replace(/-+$/,'')||'tree';
 const blank=who=>({who:who||'',text:''});
 /* A new tree: draft-<name>, unique among the trees given. */
 function newTree(trees,{name,note}={}){const base='draft-'+slug(name);let id=base,n=2;while((trees||[]).some(t=>t.id===id))id=base+'-'+n++;return {id,name:String(name||'').trim().slice(0,60),note:String(note||'').trim().slice(0,300),status:'draft',seq:0,missions:[]};}
 /* A new mission at the end of the tree (id <tree id>-m<n>, never reused), with one empty step. */
 function addMission(tree,{giver}={}){tree.seq=(tree.seq||0)+1;const id=(tree.id+'-m'+tree.seq).slice(0,60);
  const m={id,title:'',type:'side',giver:giver||'',description:'',rewards:0,seq:0,offer:[blank(giver)],objectives:[],ending:{npc:'',place:'',label:'',say:[]},choices:[],unlocks:[]};addStep(m);tree.missions.push(m);return m;}
 function addStep(m,{kind='talk'}={}){m.seq=(m.seq||0)+1;let id='step-'+m.seq;while(m.objectives.some(o=>o.id===id)){m.seq++;id='step-'+m.seq;}const o={id,label:'',kind,npc:'',place:'',item:'',say:[blank('')],early:[]};m.objectives.push(o);return o;}
 const move=(list,i,dir)=>{const j=i+dir;if(i<0||j<0||j>=list.length)return false;[list[i],list[j]]=[list[j],list[i]];return true;};
 function moveMission(tree,id,dir){return move(tree.missions,tree.missions.findIndex(m=>m.id===id),dir);}
 function moveStep(m,id,dir){return move(m.objectives,m.objectives.findIndex(o=>o.id===id),dir);}
 function removeMission(tree,id){const i=tree.missions.findIndex(m=>m.id===id);if(i<0)return false;tree.missions.splice(i,1);for(const m of tree.missions)for(const c of m.choices||[])if(c.next===id)c.next='';return true;}
 function removeStep(m,id){if(m.objectives.length<2)return false;const i=m.objectives.findIndex(o=>o.id===id);if(i<0)return false;m.objectives.splice(i,1);for(const u of m.unlocks||[])if(u.when===id)u.when='complete';return true;}
 /* Copies archived missions into a NEW draft tree (David's starting point for a new tree; the archived tree itself never changes). Every step becomes "talk to someone"
    (with the NPC it named, when that NPC is in the giver list; otherwise left for David to choose), lines are copied as they are, credits kept, and each mission gets the
    next free mission number. built: missions from build() (one tree's, or one). Returns the new tree. */
 function copyToTree(trees,missions,{name,givers,next}={}){const t=newTree(trees,{name:name||'Copy',note:'Copied from a removed (archived) tree. Not in the game until you publish it.'});const known=id=>(givers||[]).some(g=>g.id===id);let n=next||null;
  for(const bm of missions||[]){const m=addMission(t,{giver:known(bm.giver)?bm.giver:''});m.title=String(bm.name||bm.title||'').replace(/^Mission \d{3} — /,'').slice(0,60);m.type=['main','side','cargo','campaign','tutorial','bounty','station'].includes(bm.type)?bm.type:'side';m.description=String(bm.description||'').slice(0,600);m.rewards=Number(bm.credits)||0;
   if(Number.isInteger(n)){m.number=n;n++;}
   const line=l=>({who:l.who==='player'?'You':l.who,text:String(l.text||'').slice(0,500)});
   m.offer=(bm.offer||[]).map(line);if(!m.offer.length)m.offer=[blank(m.giver)];
   m.objectives=[];m.seq=0;for(const st of bm.steps||[]){const o=addStep(m);const npc=st.interaction&&TARGETS[st.interaction];o.label=String(st.label||'').slice(0,500);o.kind='talk';o.npc=npc&&known(npc)?npc:'';o.say=(st.lines||[]).map(line);o.early=(st.early||[]).map(line);if(!o.say.length)o.say=[blank('')];}
   if(!m.objectives.length)addStep(m);}
  return t;}
 /* Gives a mission a number (renumbering): the old number is kept in retired so it is never given again. Returns the old number. */
 function setNumber(draft,missionId,number){for(const t of draft.trees||[])for(const m of t.missions||[])if(m.id===missionId){const old=m.number;if(Number.isInteger(old)&&old!==number){draft.retiredNumbers=[...new Set([...(draft.retiredNumbers||[]),old])];}m.number=number;return old;}return null;}
 /* Renames a tree. A new tree keeps its name on the tree itself; an existing tree gets a display name in names{} (removed when it matches the original). Ids never change. */
 function renameTree(draft,id,name,original){const n=String(name||'').slice(0,60);const t=(draft.trees||[]).find(x=>x.id===id);if(t){t.name=n;return true;}
  draft.names=draft.names||{};if(!n.trim()||n.trim()===original)delete draft.names[id];else draft.names[id]=n;return true;}
 /* Checks one new tree: the Studio's mission model (ids, names, types, order, choices), the unlock validator (real items, ships, places, stores), the adapter's own check,
    and whether each mission can run in the game today. ctx: {givers (roster), refs (refs()), items (Set), studio (StudioModel)}. Returns [{level,where,text}]. */
 function validateTree(tree,ctx={}){
  const out=[],add=(level,where,text)=>out.push({level,where,text}),MC=MC_(),G=G_(),givers=ctx.givers||[],g=id=>givers.find(x=>x.id===id);
  if(!String(tree.name||'').trim())add('error',tree.id,'The tree needs a name.');if(!tree.missions.length)add('warn',tree.id,'No missions yet: press + NEW MISSION.');
  if(ctx.studio){const proj=tree.missions.map((m,i)=>({id:m.id,title:m.title,type:m.type,giver:(g(m.giver)||{}).name||m.giver,description:m.description,rewards:m.rewards,prerequisites:i?[tree.missions[i-1].id]:[],choices:m.choices,
    objectives:m.objectives.map((o,k)=>({id:o.id,label:o.label,on:'talk-admin',requires:k?[m.objectives[k-1].id]:[]}))}));
   for(const i of ctx.studio.validate(proj,{npcs:new Set(givers.map(x=>x.name))}))if(!/store items|completion event/.test(i.text))add(i.level,i.where,i.text);}
  for(const m of tree.missions){const w=m.title||m.id;
   if(!m.giver)add('error',w,'Choose who gives this mission.');else{const x=g(m.giver);if(!x)add('error',w,'"'+m.giver+'" is not a known NPC.');else if(!x.players)add('warn',w,x.name+': '+G.status(x));}
   for(const o of m.objectives){const st=G.STEP_KINDS.find(k=>k.id===o.kind);if(!st)add('error',w+' / '+o.id,'Unknown kind of step.');else if(!st.supported)add('warn',w+' / '+o.id,'“'+st.name+'” needs a code change: the game cannot run it yet.');
    if((o.kind==='go'||o.kind==='arrive'||o.kind==='enter'||o.kind==='leave')&&o.place&&!G.placeIds().has(o.place))add('error',w+' / '+o.id,'Unknown place "'+o.place+'".');if(o.kind==='arrive'&&o.place&&!(G.PLACE.get(o.place)||{}).location)add('error',w+' / '+o.id,'A flight has to end at a station or planet.');if(o.kind==='buy'&&o.item&&ctx.items&&!ctx.items.has(o.item))add('error',w+' / '+o.id,'"'+o.item+'" is not sold in any store.');
    for(const who of [o.npc].filter(Boolean)){const x=g(who);if(!x)add('error',w+' / '+o.id,'"'+who+'" is not a known NPC.');else if(!x.players&&x.canTalk)add('warn',w+' / '+o.id,x.name+': '+G.status(x));}}
   if(ctx.refs){const vu=(m.unlocks||[]).filter(u=>['item','ship','location','flag'].includes(u.kind)).map(u=>({...u,when:u.when||'complete'}));for(const i of validateEdit({steps:m.objectives.map(o=>({id:o.id}))},{unlocks:vu},ctx.refs))add(i.level,w,i.text);}
   for(const u of m.unlocks||[]){if(u.kind==='credits'&&!(Number.isInteger(u.amount)&&u.amount>0&&u.amount<=100000))add('error',w,'Credits must be a whole number between 1 and 100000.');
    const k=G.UNLOCK_KINDS.find(x=>x.id===u.kind);if(!k)add('error',w,'Unknown kind of unlock "'+u.kind+'".');else if(!k.supported)add('warn',w,(k.name)+': needs a code change. '+(k.why||k.note||''));
    if(u.kind==='ship'&&ctx.refs&&ctx.refs.premium&&ctx.refs.premium.has(u.id))add('error',w,'A paid hull is never given by a mission.');
    if(u.kind==='tree'&&(!ctx.trees||!ctx.trees.some(x=>x.id===u.id)||u.id===tree.id))add('error',w,'“Start tree” must name another of your trees.');}
   if((m.choices||[]).length)add('warn',w,'Branches are a design note: the game does not offer mission choices yet (needs a code change).');
   const empty=[...m.offer,...m.objectives.flatMap(o=>[...(o.say||[]),...(o.early||[]),...(o.wrong||[])]),...(m.ending.say||[])].filter(l=>!String(l.text||'').trim()).length;if(empty)add('warn',w,empty+' empty line(s): placeholders, not spoken. Write the lines yourself.');
   const b=MC.treeBlockers(m,givers,ctx.items);if(b.length)add('warn',w,'Cannot be played or published yet: '+b.join('; ')+'.');}
  const every=ctx.trees&&ctx.trees.some(x=>x.id===tree.id)?ctx.trees:[...(ctx.trees||[]),tree],c=MC.treesContent(every,{givers,items:ctx.items});if(c.trees.some(x=>x.id===tree.id)){const chk=MC.check({format:MC.FORMAT,version:MC.VERSION,trees:c.trees},{givers:new Map(givers.map(x=>[x.id,x])),places:G.placeIds(),subjects:new Set(G.photoSubjects(givers).map(x=>x.id)),items:ctx.items,locations:ctx.refs?new Set(Object.keys(ctx.refs.locations)):null});for(const e of chk.errors)if(e.startsWith(tree.id+':')||e.startsWith(tree.id+' /'))add('error',(tree.missions.find(m=>e.startsWith(tree.id+' / '+m.id))||{}).id||tree.id,e);}
  return out;}
 /* What this tree can do today, in plain words (the editor shows it on every new tree). */
 function capability(tree,ctx={}){const MC=MC_(),givers=ctx.givers||[],every=ctx.trees&&ctx.trees.some(x=>x.id===tree.id)?ctx.trees:[tree],all=MC.treesContent(every,{givers,items:ctx.items}),c={trees:all.trees.filter(x=>x.id===tree.id),skipped:all.skipped.filter(x=>x.tree===tree.id)},runs=c.trees[0]?c.trees[0].missions.length:0,g=id=>givers.find(x=>x.id===id);
  const unreachable=[...new Set(tree.missions.flatMap(m=>MC.treeTouches(m).npcs))].map(g).filter(x=>x&&x.canTalk&&!x.players);
  return {draft:true,export:true,play:runs,publish:runs,total:tree.missions.length,skipped:c.skipped,unreachable:unreachable.map(x=>({id:x.id,name:x.name,status:G_().status(x)}))};}
 const api={copyToTree,setNumber,ARCHIVED,STATUS,ARCS,SCENES,FILES,TALK_FILES,VOICE_ENGINES,DOCS,build,validateLines,lineIndex,sceneLines,allLines,refs,validateEdit,hash,lockLabel,newTree,addMission,addStep,moveMission,moveStep,removeMission,removeStep,renameTree,validateTree,capability,slug};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VoidMissionTrees=api;
})(typeof globalThis!=='undefined'?globalThis:this);
