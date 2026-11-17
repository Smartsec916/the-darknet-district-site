/* MISSION TREES (pure: browser and Node tests; no network, no DOM). Read-only extraction for the Developer Tools > Mission Editor.
   It lists every mission tree that exists in the game's own data, never invents one: the beginner campaign (beginner.js), the registry missions (mission-log.js,
   grouped by the arcs campaign.js runs), Rook's contract board (campaign.js contracts), the free chapters (content.js), and the owner's drafts. For each mission it
   gathers the NPCs involved (giver, speakers, who you deliver to) with their registered voice (read-only), what each NPC says (from the beginner records, the
   structured story scenes, and the plain-text lines of the scene scripts listed in SCENES below), the steps, where the mission ends and what becomes available.
   Lines from David's own scripts (design docs 05, 06, 07, 09, 10, 12) are LOCKED. Inline lines are read from the scripts' text: only plain quoted lines are listed;
   a scene whose lines are partly assembled by code says so (partial). Nothing here changes the game. */
(function(root){
 'use strict';
 const STATUS={active:'ACTIVE · in the current District game',historical:'HISTORICAL · not reachable in the current District game',draft:'DRAFT · not in the game'};
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
  {file:'void-runner/faction-scenes.js',title:'Admin offers the two deliveries',from:'// ---- Admin (doc 05) ----',to:'// ---- "Don\'t Ask Questions"',at:[['communion-delivery','offer'],['order-delivery','offer']],doc:'05',shared:true},
  {file:'void-runner/faction-scenes.js',title:'Admin offers the sealed crate',from:'// ---- "Don\'t Ask Questions"',to:'// ---- Admin introduces WarFlying',at:[['admin-sealed-cargo-01','offer']],placeholder:true},
  {file:'void-runner/faction-scenes.js',title:'Afterwards: Admin introduces WarFlying',from:'// ---- Admin introduces WarFlying',to:'const warflyingDue',at:[['admin-sealed-cargo-01','after']],doc:'12'},
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
  {file:'void-runner/scenes.js',title:'Rook at the bar offers the next job',from:'function rookConversation(){',to:'// Leaving the offer never commits',at:[['legal-run','offer'],['illegal-run','offer']],shared:true},
  {file:'void-runner/hangar.js',title:'Rook’s missile launcher voucher',from:'const rookMissileLine',to:'\n',at:[['combat-qualification','offer']]}];
 const FILES=[...new Set(SCENES.map(s=>s.file))];
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
  const recorded=new Set(Object.values((src.manifest&&src.manifest.lines)||{}).map(l=>l.speaker+'|'+l.text));
  const locs=src.locations||{},stations=(src.campaign&&src.campaign.stations)||{};
  const place=id=>id?((stations[id]&&stations[id].name)||(locs[id]&&locs[id].name)||({earth:'NeoChinatown'})[id]||id):'';
  const labels={'landing-terminal':'Landing terminal'};
  const canon=who=>{if(!who)return '';if(PLAYER.has(who))return 'player';if(ALIAS[who])return ALIAS[who];if(reg[who])return who;if(byName[who])return byName[who];const l=String(who).toLowerCase();if(reg[l])return l;const id=l.replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');labels[id]=String(who);return id;};
  const npcName=id=>id==='player'?'You (the player)':reg[id]?reg[id].displayName:labels[id]||id;
  const line=(who,text,extra)=>{const id=canon(who);return {id:'L-'+id+'-'+hash(id+'|'+text),who:id,name:npcName(id),text,recorded:recorded.has(id+'|'+text),voice:reg[id]?{voice:reg[id].voice,status:reg[id].status}:null,...extra};};
  const trees=[];
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
   note:'Runs for every new District campaign. The wording is PROPOSED placeholder text David has not approved yet (docs/development/BEGINNER_CAMPAIGN.md). The Developer Studio edits the same records.'+(studio?' Showing your Studio draft.':''),missions:bMissions});
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
    const lines=r.lines.map(l=>{const locked=!!sc.doc&&!l.placeholder;return line(l.who,l.text,{kind:'inline',source:sc.file,locked,lock:locked?lockLabel(sc.doc):'',placeholder:l.placeholder,editable:locked?false:'local',scene:sc.title});});
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
  // ---- drafts ----
  if(studio){const added=studio.filter(m=>!B.some(x=>x.id===m.id));if(added.length)trees.push({id:'draft-studio',title:'Your draft: new beginner missions',status:'draft',statusText:STATUS.draft,engine:'beginner',source:'Developer Studio draft (this browser)',note:'Missions you added in the Studio draft. They are part of the beginner campaign tree above too.',missions:bMissions.filter(m=>added.some(a=>a.id===m.id)).map(m=>({...m,tree:'draft-studio'}))});}
  if(Array.isArray(src.serverDrafts)&&src.serverDrafts.length)trees.push({id:'draft-server',title:'Your private server drafts',status:'draft',statusText:STATUS.draft,engine:'server',source:'Stage 3B private drafts',note:'Drafts saved on the server. Open them in the Content atlas (admin/void-runner.html) for full editing.',
   missions:src.serverDrafts.map((d,i)=>({key:'server:'+d.id,id:d.id,tree:'draft-server',engine:'server',title:d.title||d.id,type:d.kind||'draft',description:'Private server draft r'+(d.revision||0)+'.',giver:'',giverName:'',credits:0,steps:[],offer:[],scenes:[],ending:{text:'',next:[],branches:[]},unlocks:[],order:i,server:null}))});
  // ---- NPCs per tree ----
  for(const t of trees){const npcs=new Map();const add=(id,role,m)=>{if(!id||id==='player')return;const n=npcs.get(id)||{id,name:npcName(id),roles:new Set(),missions:new Set(),voice:reg[id]?{voice:reg[id].voice,status:reg[id].status}:null,registered:!!reg[id]};n.roles.add(role);n.missions.add(m.id);npcs.set(id,n);};
   for(const m of t.missions){add(m.giver,'gives the mission',m);if(m.target)add(m.target,'you deliver to them',m);for(const s of m.steps){if(s.interaction&&TARGETS[s.interaction])add(TARGETS[s.interaction],'a step happens with them',m);for(const l of [...s.lines,...s.early])add(l.who,'speaks',m);}for(const l of m.offer)add(l.who,'speaks',m);for(const sc of m.scenes)for(const l of sc.lines)add(l.who,'speaks',m);}
   t.npcs=[...npcs.values()].map(n=>({...n,roles:[...n.roles],missions:[...n.missions]})).sort((a,b)=>a.name.localeCompare(b.name));}
  return {trees,counts:counts(trees),statusText:STATUS};
 }
 function counts(trees){const c={trees:trees.length,missions:0,active:0,historical:0,draft:0,lines:0,locked:0};for(const t of trees){c[t.status]++;c.missions+=t.missions.length;for(const m of t.missions){const ls=allLines(m);c.lines+=ls.length;c.locked+=ls.filter(l=>l.locked).length;}}return c;}
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
  return {items,ships:Object.fromEntries(Object.entries(src.ships||{}).map(([id,s])=>[id,s.name])),locations:Object.fromEntries(Object.entries(src.locations||{}).map(([id,l])=>[id,((src.campaign&&src.campaign.stations&&src.campaign.stations[id]&&src.campaign.stations[id].name)||l.name||id)])),
   stores:Object.fromEntries((src.stores||[]).map(s=>[s.id,s.name])),npcs:Object.fromEntries(Object.entries((src.registry&&src.registry.npcs)||{}).map(([id,n])=>[id,n.displayName])),factions:{communion:'The Communion','natural-order':'The Natural Order'}};}
 /* Validates the owner's local edits for one mission against the real registries. edit: {title,description,steps{},lines{},credits,reputation[],unlocks[]}. */
 function validateEdit(mission,edit,r){
  const out=[],e=(t)=>out.push({level:'error',text:t}),w=(t)=>out.push({level:'warn',text:t}),TAG=/<[^>]*>/;
  if(edit.title!=null&&(!String(edit.title).trim()||edit.title.length>60||TAG.test(edit.title)))e('The title must be plain text, 1 to 60 characters.');
  if(edit.description!=null&&(edit.description.length>600||TAG.test(edit.description)))e('The description must be plain text, 600 characters at most.');
  for(const [id,label] of Object.entries(edit.steps||{})){if(!mission.steps.some(s=>s.id===id))e('Step "'+id+'" is not a step of this mission.');if(!String(label).trim()||label.length>500||TAG.test(label))e('Step "'+id+'": the label must be plain text.');}
  const lines=new Map(allLines(mission).map(l=>[l.key,l]));
  for(const [key,text] of Object.entries(edit.lines||{})){const l=lines.get(key);if(!l){e('A changed line no longer exists in the game: '+key);continue;}if(l.locked)e('“'+l.text.slice(0,40)+'…” is '+l.lock+'. It cannot be changed here.');if(!String(text).trim()||text.length>500||TAG.test(text))e('A line must be plain text, 500 characters at most.');if(l.recorded&&text!==l.text)w('“'+text.slice(0,40)+'…”: voice clip out of date. Text only until re-voiced.');}
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
 const api={STATUS,ARCS,SCENES,FILES,DOCS,build,sceneLines,allLines,refs,validateEdit,hash,lockLabel};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VoidMissionTrees=api;
})(typeof globalThis!=='undefined'?globalThis:this);
