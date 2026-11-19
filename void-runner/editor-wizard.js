/* DEVELOPER TOOLS: THE BEGINNER LAYER (the owner, 18 Nov 2026, queue item 0: "beginner redesign of the whole Developer tools / Mission Editor"). Pure rules, run in the
   browser and in Node (tests/editor-redesign.test.cjs); the screens are in editor-home.js.
   - TEMPLATES: the "Make a mission" wizard's starting points, built ONLY from step kinds the game already runs (mission-givers.js STEP_KINDS, supported: talk, deliver,
     go, photo). The full sentence builder and more templates are a later queue item.
   - The wizard asks one question per page (PAGES); problems() says what is still missing on a page and HOW to fix it, in plain words; build() turns the answers into an
     ordinary draft mission (mission-trees.js addMission / addStep), the same record the Mission Editor makes by hand, so the editor, Guide me, PLAY THIS DRAFT, the publish
     check and the server all treat it like any other mission. No lines are written for anyone: the offer line is the owner's own words or a placeholder.
   - MODE: Basic (default) or Advanced, remembered per browser (localStorage, guarded: a blocked storage just means Basic).
   - createUndo(): the session undo stack behind UNDO / Ctrl+Z (snapshots of the stored draft before and after each save; typing bursts in one box are merged). */
(function(root){
 'use strict';
 const MODE_KEY='editor-mode',TOUR_KEY='editor-tour-done';
 const mode={KEY:MODE_KEY,read(storage){try{return storage&&storage.getItem(MODE_KEY)==='advanced'?'advanced':'basic';}catch{return 'basic';}},
  write(storage,v){const m=v==='advanced'?'advanced':'basic';try{storage&&storage.setItem(MODE_KEY,m);return true;}catch{return false;}}};
 // ---------------------------------------------------------------- undo (one stack per page session)
 function createUndo({limit=80,mergeMs=1200,now=()=>Date.now()}={}){
  const done=[],undone=[];
  return {
   /* group: the text box being typed in (or null). Only saves from the same box within a moment merge, so a click (add, remove, choose) is always its own step. */
   record(key,before,after,group=null){if(before===after)return false;const t=now(),top=done[done.length-1];
    if(top&&group!=null&&top.group===group&&top.key===key&&top.after===before&&t-top.at<mergeMs){top.after=after;top.at=t;}else{done.push({key,before,after,at:t,group});if(done.length>limit)done.shift();}
    undone.length=0;return true;},
   undo(){const e=done.pop();if(!e)return null;undone.push(e);return {key:e.key,value:e.before};},
   redo(){const e=undone.pop();if(!e)return null;done.push({...e,at:-Infinity});return {key:e.key,value:e.after};},
   get canUndo(){return done.length>0;},get canRedo(){return undone.length>0;},get size(){return done.length;},clear(){done.length=0;undone.length=0;}};}
 // ---------------------------------------------------------------- the wizard
 const STEPS=[   // what a wizard step can ask for: only kinds the game runs today
  {id:'talk',name:'Talk to someone',needs:'npc',ask:'Who do they talk to?'},
  {id:'deliver',name:'Deliver something to someone',needs:'npc',ask:'Who gets the delivery?'},
  {id:'go',name:'Go to a place',needs:'place',ask:'Where do they go?'},
  {id:'photo',name:'Take a photo of someone with the V1',needs:'subject',ask:'Who must be in the photo?'}];
 const TEMPLATES=[
  {id:'deliver',icon:'parcel',title:'Deliver something',line:'The player takes a package to someone.',steps:['deliver']},
  {id:'meet',icon:'meet',title:'Meet someone',line:'The player goes to a place and meets a person there.',steps:['go','talk']},
  {id:'go',icon:'pin',title:'Go somewhere',line:'The player walks to a place.',steps:['go']},
  {id:'photo',icon:'camera',title:'Photograph something with the V1',line:'The player takes a photo of someone with their V1 camera.',steps:['photo']},
  {id:'talk',icon:'talk',title:'Talk to someone',line:'The player finds a person and talks to them.',steps:['talk']}];
 const STARTS=[
  {id:'person',title:'When the player talks to them',line:'The player walks up, presses TALK, and the mission is offered.'},
  {id:'person-accept',title:'They ask, the player says ACCEPT or DENY',line:'Like above, but the player chooses ACCEPT or DENY. DENY: they are asked again next time.'},
  {id:'near',title:'When the player walks near them',line:'A short banner pops up when the player comes within 5 metres. No talking needed.'},
  {id:'messages',title:'A text message on the V1',line:'Arrives in the V1 Messages app when the player first leaves their Sleeping Pod.'}];
 const PAGES=[
  {id:'kind',title:'What kind of mission?',help:'Pick the one closest to your idea. You can change everything later.'},
  {id:'giver',title:'Who gives the mission?',help:'The person who hands it to the player. Only people the player can talk to in the game are listed.'},
  {id:'start',title:'How does it start?',help:'How the player first hears about it.'},
  {id:'steps',title:'What must the player do?',help:'One step at a time, in order. Each step starts when the one before it is done; a yellow arrow shows the way.'},
  {id:'reward',title:'What does the player get, or pay?',help:'Player gets: credits paid once, when the mission is done (0 is fine too). Player pays: credits taken once, when they press ACCEPT (never below 0).'},
  {id:'name',title:'What is it called?',help:'The name the player sees in the V1 Mission Log.'}];
 const REWARDS=[0,50,100,250,500];
 const template=id=>TEMPLATES.find(t=>t.id===id)||null;
 const stepOf=kind=>({kind,npc:'',place:'',label:'',auto:true});
 function fresh(templateId){const t=template(templateId);return {template:t?t.id:'',giver:'',start:'person',message:{header:'',text:''},steps:t?t.steps.map(stepOf):[],rewards:100,pays:false,ask:false,title:'',description:'',offer:'',tree:''};}
 /* Choosing a template replaces the steps unless the owner already filled them in. */
 function setTemplate(a,id){const t=template(id);if(!t)return a;const touched=a.steps.some(s=>s.npc||s.place||(s.label&&!s.auto));a.template=t.id;if(!touched)a.steps=t.steps.map(stepOf);return a;}
 /* The Mission Log line for a step, made from its choices (used until the owner types his own). ctx.name(id), ctx.place(id). */
 function labelFor(s,ctx={}){const who=s.npc?(ctx.name?ctx.name(s.npc):s.npc):'someone',where=s.place?(ctx.place?ctx.place(s.place):s.place):'the place';
  return s.kind==='talk'?'Talk to '+who:s.kind==='deliver'?'Take the package to '+who:s.kind==='go'?'Go to '+where:s.kind==='photo'?'Take a photo of '+who+' with your V1':'';}
 function relabel(a,ctx){for(const s of a.steps)if(s.auto||!String(s.label||'').trim()){s.label=labelFor(s,ctx);s.auto=true;}return a;}
 /* Who can give a mission or be talked to: a TALK prompt in the game and playable in a draft (mission-content.js treeNeeds uses the same test). */
 const canTalk=(givers,id)=>{const g=(givers||[]).find(x=>x.id===id);return !!(g&&g.canTalk&&g.draft);};
 const nameOf=(givers,id)=>((givers||[]).find(x=>x.id===id)||{}).name||id;
 /* What still stops this page, in plain words, each saying how to fix it. ctx: {givers, places (Set of ids), subjects (Set of ids)}. */
 function problems(a,page,ctx={}){const out=[],g=ctx.givers||[];
  if(page==='kind'&&!template(a.template))out.push('Pick one of the cards: click the kind of mission you want to make.');
  if(page==='giver'){if(!a.giver)out.push('Choose who gives the mission: pick a name from the list.');
   else if(!canTalk(g,a.giver))out.push(nameOf(g,a.giver)+' cannot give missions in the game yet ('+(((g.find(x=>x.id===a.giver)||{}).why)||'no TALK prompt')+'). Pick someone else from the list.');}
  if(page==='start'){if(!STARTS.some(s=>s.id===a.start))out.push('Choose how it starts: click one of the choices.');
   if((a.start==='messages'||a.start==='near')&&!String(a.message&&a.message.text||'').trim())out.push(a.start==='messages'?'Write the message the player gets: type it in the box “What the message says”.':'Write the banner text: type it in the box “What the banner says”.');}
  if(page==='steps'){if(!a.steps.length)out.push('Add at least one step: press “+ ADD A STEP”.');
   a.steps.forEach((s,i)=>{const n='Step '+(i+1)+': ',k=STEPS.find(x=>x.id===s.kind);
    if(!k){out.push(n+'choose what the player does, from the first list on that step.');return;}
    if(k.needs==='npc'){if(!s.npc)out.push(n+'choose who, from the list on that step.');else if(!canTalk(g,s.npc))out.push(n+nameOf(g,s.npc)+' cannot be talked to in the game yet. Choose someone else from the list.');}
    if(k.needs==='place'&&!s.place)out.push(n+'choose the place, from the list on that step.');else if(k.needs==='place'&&ctx.places&&!ctx.places.has(s.place))out.push(n+'that place is not in the game. Choose another one from the list.');
    if(k.needs==='subject'&&!s.npc)out.push(n+'choose who must be in the photo, from the list on that step.');else if(k.needs==='subject'&&ctx.subjects&&!ctx.subjects.has(s.npc))out.push(n+nameOf(g,s.npc)+' cannot be recognised by the V1 camera. Choose someone else from the list.');
    if(!String(s.label||'').trim())out.push(n+'write what the Mission Log says, for example “Talk to Iris”.');});}
  if(page==='reward'){const r=Number(a.rewards);if(!(Number.isInteger(r)&&r>=0&&r<=100000))out.push('Credits must be a whole number from 0 to 100000. Type a number like 100, or press one of the buttons.');
   else if(a.pays&&r<1)out.push('Type how much the player pays (for example 100), or press “Player gets” if they pay nothing.');}
  if(page==='name'&&!String(a.title||'').trim())out.push('Give the mission a name: type it in the box “Mission name” (for example “A parcel for Iris”).');
  return out;}
 /* Does the offer ask ACCEPT / DENY? Always when the player pays (the cost is charged at ACCEPT) or the start is "they ask"; otherwise the reward page's yes / no. */
 const asks=a=>!!(a&&(a.ask===true||a.start==='person-accept'||(a.pays&&Number(a.rewards)>0)));
 const allProblems=(a,ctx)=>PAGES.flatMap(p=>problems(a,p.id,ctx));
 /* The answers -> an ordinary draft mission. draft: the editor's local draft (changed in place); opts: {T (mission-trees.js), number (next free mission number),
    treeName}. The mission goes into a.tree when that is one of the owner's trees, otherwise into "My missions" (made once). Returns {tree, mission}. */
 function build(draft,a,{T,number,treeName='My missions'}={}){
  draft.trees=draft.trees||[];let tree=a.tree?draft.trees.find(t=>t.id===a.tree&&!t.shipped):null;
  if(!tree){const want='draft-'+T.slug(treeName);tree=draft.trees.find(t=>t.id===want&&!t.shipped);if(!tree){tree=T.newTree(draft.trees,{name:treeName,note:'Missions made with “Make a mission”.'});draft.trees.push(tree);}}
  const m=T.addMission(tree,{giver:a.giver});if(Number.isInteger(number))m.number=number;
  m.title=String(a.title||'').trim().slice(0,60);m.description=String(a.description||'').trim().slice(0,600);const r=Number(a.rewards),n=Number.isInteger(r)&&r>=0?Math.min(r,100000):0;
  // "Player pays" (19 Nov 2026): a cost charged once when the player presses ACCEPT, so the offer always asks ACCEPT / DENY
  if(a.pays&&n>0){m.rewards=0;m.cost={amount:n,when:'accept'};}else m.rewards=n;const ask=asks(a);
  m.offer=[{who:a.giver,text:String(a.offer||'').trim().slice(0,500)}];
  const text=String(a.message&&a.message.text||'').trim().slice(0,500);
  if(a.start==='person-accept'||(a.start==='person'&&ask))m.start={how:'person',accept:true};
  else if(a.start==='near')m.start={how:'notification',channel:'notify',from:a.giver,header:'',text,when:{kind:'near',npc:a.giver,distance:5}};
  else if(a.start==='messages')m.start={how:'notification',channel:'messages',from:a.giver,header:String(a.message.header||'').trim().slice(0,80)||'MESSAGE',text,when:{kind:'pod-exit'}};
  if(ask&&m.start)m.start.accept=true;
  m.objectives=[];m.seq=0;
  for(const s of a.steps){const o=T.addStep(m,{kind:s.kind});o.label=String(s.label||'').trim().slice(0,500);if(s.kind==='go')o.place=s.place;else o.npc=s.npc;}
  return {tree,mission:m};}
 const ICON_IDS=['mission','character','test','publish','balance','jump','trophy','people','parcel','meet','pin','camera','talk','undo','help','back','next','check'];
 const api={MODE_KEY,TOUR_KEY,mode,createUndo,STEPS,TEMPLATES,STARTS,PAGES,REWARDS,asks,template,fresh,setTemplate,labelFor,relabel,canTalk,problems,allProblems,build,ICON_IDS};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VoidEditorWizard=api;
})(typeof globalThis!=='undefined'?globalThis:this);
