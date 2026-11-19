/* MISSION BLOCKS (pure rules: browser and Node tests; no DOM, no storage). The owner, 19 Nov 2026: "it would also be nice if in the mission editor were in blocks. i create the
   next block by selecting what kind it is. an action, words, who, an item, a time, etc, adding another npc. color coded based on who and what type. so the player would get a
   blue block within that block i selected an action, actions get an orange block so within the blue block there would be a orange block, etc".
   The Blocks view (mission-blocks-view.js) is a SECOND EDITOR OVER THE SAME MISSION DATA as the Form view (the editor's draft mission: mission-trees.js addMission shape,
   mission-content.js treeStrip / check). There is no second format: toBlocks(m) lists the mission as a vertical timeline (the start, every step in order, the apartments and
   the rewards where they happen, the end) and fromBlocks(model, m) writes that timeline back. Every block keeps the record it came from, untouched, so anything the blocks
   cannot show is kept (and shown as a grey "edit in Form view" block): fromBlocks(toBlocks(m), m) deep-equals m for every mission.
   Positions carry meaning: a reward or an unlock ("Item" blocks) is given when the step ABOVE it is done (unlock.when), or when the mission is done (below the END block); an
   apartment is open from the step above it (apartment.from) or from the start. Lines are the steps' own arrays (say / early / wrong / denySay, the offer, the hand-in):
   the view nests them under who says them (lineGroups), they are never copied elsewhere. */
(function(root){
 'use strict';
 const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
 /* Block TYPES: a colour (the header tint) AND an icon AND a word, so nothing depends on colour alone (colour-blind friendly). */
 const TYPES={
  start:{name:'Start',color:'#9fb4c8',icon:'start'},who:{name:'Who',color:'#4da3ff',icon:'who'},words:{name:'Words',color:'#d4dae2',icon:'words'},
  action:{name:'Action',color:'#ff8a3d',icon:'action'},item:{name:'Item',color:'#3fd17a',icon:'item'},time:{name:'Time',color:'#b08cff',icon:'time'},
  ask:{name:'Ask',color:'#ffd23f',icon:'ask'},apartment:{name:'Location',color:'#22c5b8',icon:'apartment'},end:{name:'End',color:'#9fb4c8',icon:'end'},other:{name:'Form view only',color:'#8b949e',icon:'other'}};
 /* WHO colours: the player is always blue; every NPC gets a stable colour from its id (the same everywhere), and inside one mission no two people share one (the next free
    colour is taken in the order they appear). None of them is the player's blue. */
 const PLAYER='#4da3ff',PALETTE=['#ff5fa2','#e07bff','#ff6b5e','#b9e65a','#e8c27a','#5ef2c2','#ff9ec7','#f2e85a'];
 const hash=s=>{let h=2166136261;for(const c of String(s))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h;};
 const isPlayer=id=>id==='You'||id==='player';
 function whoColor(id){if(isPlayer(id))return PLAYER;if(!id)return TYPES.other.color;return PALETTE[hash(id)%PALETTE.length];}
 /* ids in order of appearance -> Map id -> colour (no two NPCs of one mission share a colour while the palette lasts). */
 function castColors(ids){const out=new Map(),used=new Set();for(const id of ids){if(!id||out.has(id))continue;if(isPlayer(id)){out.set(id,PLAYER);continue;}let k=hash(id)%PALETTE.length;
   for(let n=0;n<PALETTE.length&&used.has(PALETTE[k]);n++)k=(k+1)%PALETTE.length;out.set(id,PALETTE[k]);used.add(PALETTE[k]);}return out;}
 /* What a step is, as a block: its type (header tint), its WHO (border) and the line groups it carries (with the speaker lines default to). */
 const KIND_TYPE={talk:'who',hear:'who',deliver:'item',buy:'item',go:'action',arrive:'action',enter:'action',leave:'action',photo:'action','send-photo':'action','pod-exit':'action',
  'follow-them':'action','they-follow':'action','their-cab':'action','shared-cab':'action',anim:'action','apt-enter':'action','apt-use':'action',hack:'action',message:'words','await-call':'words',wait:'time',ask:'ask'};
 const typeOf=o=>(o&&KIND_TYPE[o.kind])||'other';
 const NPC_DOES=['talk','hear','anim','follow-them','they-follow','their-cab','shared-cab','ask'];
 function stepWho(o,m){if(!o)return null;if(o.kind==='wait')return o.near&&o.npc?o.npc:null;if(o.kind==='hear'||o.kind==='ask')return o.npc||(m&&m.giver)||null;
  if(o.kind==='message'||o.kind==='await-call')return o.npc||(m&&m.start&&m.start.from)||(m&&m.giver)||null;if(NPC_DOES.includes(o.kind))return o.npc||null;if(!KIND_TYPE[o.kind])return o.npc||null;return 'You';}
 /* The line groups of a step (the Form view shows the same ones): [{key, title, who (default speaker), player (may the player speak here?), anim (may a line carry an animation?)}]. */
 function lineSets(o,m){if(!o)return [];const k=o.kind,dev=o.via==='comms'||o.via==='messages',who=k==='photo'?(m&&m.giver):o.npc||(m&&m.giver);
  if(['message','pod-exit','anim','wait'].includes(k))return [];
  if(k==='ask')return [{key:'say',title:'After ACCEPT',who,player:true,anim:true},{key:'denySay',title:'After DENY',who,player:true,anim:true}];
  if(k==='send-photo')return [{key:'say',title:'Reply to the right photo',who,player:false,anim:false},{key:'wrong',title:'Reply to any other photo',who,player:false,anim:false}];
  const out=[{key:'say',title:k==='talk'||k==='deliver'||k==='hear'?'What is said':'What is said when this is done',who,player:!dev,anim:!dev}];
  if(k==='talk'||k==='deliver')out.push({key:'early',title:'If the player comes too soon',who,player:true,anim:true,more:true});return out;}
 /* Consecutive lines by the same speaker, for the view: [{who (the speaker id, '' = the part's own person), k0 (index of the first), lines:[{line, k}]}]. */
 function lineGroups(lines,defWho){const out=[];(lines||[]).forEach((l,k)=>{const w=l&&l.who?l.who:(defWho||'');const last=out[out.length-1];if(last&&last.who===w)last.lines.push({line:l,k});else out.push({who:w,k0:k,lines:[{line:l,k}]});});return out;}
 // ---------------------------------------------------------------- the timeline
 const anchorOf=(v,ids,start)=>v==null||v===start?start:ids.includes(v)?v:'dangling:'+v;
 /* The mission as a timeline: {mission, blocks:[{bid, type:'start'|'step'|'apt'|'unlock'|'end', raw?, idx?, anchor0?}]}. */
 function toBlocks(m){const objs=(m&&Array.isArray(m.objectives))?m.objectives:[],ids=objs.map(o=>o&&o.id),apts=Array.isArray(m&&m.apartments)?m.apartments:[],uns=Array.isArray(m&&m.unlocks)?m.unlocks:[];
  const ap=apts.map((a,idx)=>({bid:'apt:'+((a&&a.id)||idx),type:'apt',raw:a,idx,anchor0:anchorOf(a&&a.from,ids,'start')}));
  const un=uns.map((u,idx)=>({bid:'unlock:'+idx,type:'unlock',raw:u,idx,anchor0:anchorOf(u&&u.when,ids,'complete')}));
  const blocks=[{bid:'start',type:'start'}];const after=a=>[...ap.filter(x=>x.anchor0===a),...un.filter(x=>x.anchor0===a)];
  blocks.push(...ap.filter(x=>x.anchor0==='start'));
  for(const o of objs){blocks.push({bid:'step:'+(o&&o.id),type:'step',raw:o});blocks.push(...after(o&&o.id));}
  blocks.push(...ap.filter(x=>x.anchor0.startsWith('dangling:')||x.anchor0==='complete'));   // an apartment open from a step that is gone: kept, before the end, flagged
  blocks.push({bid:'end',type:'end'});blocks.push(...un.filter(x=>x.anchor0==='complete'||x.anchor0.startsWith('dangling:')));   // rewards when the mission is done (and a step that is gone: kept, flagged)
  return {mission:m&&m.id,blocks};}
 /* The timeline back into the mission (a new object; m is not changed). Only what a move changes is written: a block that stays under the same step keeps its record as it was. */
 function fromBlocks(model,m){const x=clone(m),bl=model.blocks;
  x.objectives=bl.filter(b=>b.type==='step').map(b=>clone(b.raw));
  const un=[],ap=[];let anchor='start';
  for(const b of bl){if(b.type==='step')anchor=b.raw.id;else if(b.type==='end')anchor='complete';else if(b.type==='unlock')un.push([b,anchor]);else if(b.type==='apt')ap.push([b,anchor]);}
  const placed=(b,a,key,base)=>{const r=clone(b.raw);if(a===b.anchor0||(b.anchor0&&b.anchor0.startsWith('dangling:')&&a===(key==='when'?'complete':'start')))return r;if(a===base)delete r[key];else r[key]=a;return r;};
  const order=list=>list.map((p,i)=>[p,i]).sort((a,b)=>((a[0][0].idx??1e9+a[1])-(b[0][0].idx??1e9+b[1]))).map(p=>p[0]);
  if(un.length||m.unlocks!==undefined)x.unlocks=order(un).map(([b,a])=>placed(b,a,'when','complete'));
  if(ap.length)x.apartments=order(ap).map(([b,a])=>placed(b,a,'from','start'));else if(m.apartments!==undefined){if(Array.isArray(m.apartments)&&!m.apartments.length)x.apartments=[];else delete x.apartments;}
  return x;}
 /* The order rules of a timeline: START first, END after every step, at least one step, an apartment between START and END, a reward below a step (or below END). */
 function orderProblem(bl){if(!bl.length||bl[0].type!=='start')return 'The START block stays at the top.';const e=bl.findIndex(b=>b.type==='end');if(e<0)return 'The END block is missing.';
  if(!bl.some(b=>b.type==='step'))return 'A mission needs at least one step.';if(bl.slice(e+1).some(b=>b.type==='step'))return 'Steps go above the END block.';
  if(bl.slice(e+1).some(b=>b.type==='apt'))return 'An apartment goes above the END block (it is open from the step above it until the mission ends).';
  const first=bl.findIndex(b=>b.type==='step');if(bl.slice(0,first).some(b=>b.type==='unlock'))return 'A reward is given when the block above it is done: put it below a step (or below END for “when the mission is done”).';return '';}
 /* Writes a new mission object into m in place (the editor's draft holds references to it). */
 function put(m,y){for(const k of Object.keys(m))delete m[k];Object.assign(m,y);return m;}
 /* A free step id (the Form view's rule: step-N, N from the mission's counter). */
 function nextStepId(m){m.seq=(m.seq||0)+1;let id='step-'+m.seq;while((m.objectives||[]).some(o=>o&&o.id===id)){m.seq++;id='step-'+m.seq;}return id;}
 /* Moves a block. to: the index (in the current list) it should end up before; to = length puts it last. Returns '' or the plain reason it cannot go there. */
 function move(m,bid,to){const md=toBlocks(m),bl=md.blocks,i=bl.findIndex(b=>b.bid===bid);if(i<0)return 'That block is gone.';const b=bl[i];if(b.type==='start'||b.type==='end')return 'The START and END blocks do not move.';
  to=Math.max(0,Math.min(bl.length,to));const rest=bl.filter((_,k)=>k!==i),at=to>i?to-1:to;rest.splice(at,0,b);const p=orderProblem(rest);if(p)return p;put(m,fromBlocks({...md,blocks:rest},m));return '';}
 /* One place up or down (the keyboard / ▲ ▼ buttons). Skips over a spot it may not take (a reward above the first step) instead of refusing. */
 function nudge(m,bid,dir){const bl=toBlocks(m).blocks,i=bl.findIndex(b=>b.bid===bid);if(i<0)return 'That block is gone.';for(let to=dir<0?i-1:i+2;dir<0?to>=0:to<=bl.length;to+=dir){const r=move(m,bid,to);if(!r)return '';if(/do not move|gone/.test(r))return r;}return dir<0?'It is already as high as it can go.':'It is already as low as it can go.';}
 /* Inserts a block at index `at` (before the block now there). spec: {step} | {unlock} | {apt}. A new step gets a free id when it has none. Returns {ok, bid, why}. */
 function insert(m,at,spec){const md=toBlocks(m),bl=md.blocks.slice();let b;
  if(spec.step){const o=clone(spec.step);if(!o.id||(m.objectives||[]).some(x=>x&&x.id===o.id))o.id=nextStepId(m);b={bid:'step:'+o.id,type:'step',raw:o};}
  else if(spec.unlock)b={bid:'unlock:new',type:'unlock',raw:clone(spec.unlock),anchor0:null};else if(spec.apt)b={bid:'apt:'+spec.apt.id,type:'apt',raw:clone(spec.apt),anchor0:null};else return {ok:false,why:'Unknown kind of block.'};
  at=Math.max(1,Math.min(bl.length,at));bl.splice(at,0,b);const p=orderProblem(bl);if(p)return {ok:false,why:p};
  put(m,fromBlocks({...md,blocks:bl},m));return {ok:true,bid:spec.unlock?'unlock:'+(m.unlocks.length-1):b.bid};}   // a new reward is listed last in unlocks
 /* Removes a block (never START / END, never the last step). Returns '' or the reason. */
 function remove(m,bid){const md=toBlocks(m),b=md.blocks.find(x=>x.bid===bid);if(!b)return 'That block is gone.';if(b.type==='start'||b.type==='end')return 'The START and END blocks cannot be deleted.';
  if(b.type==='step'&&md.blocks.filter(x=>x.type==='step').length<2)return 'A mission needs at least one step: add another block first, then delete this one.';
  put(m,fromBlocks({...md,blocks:md.blocks.filter(x=>x!==b)},m));return '';}
 /* A copy right below the block (a step gets a new id; a reward is copied as it is; an apartment cannot be copied: it needs its own door). Returns {ok, bid, why}. */
 function duplicate(m,bid){const md=toBlocks(m),i=md.blocks.findIndex(x=>x.bid===bid),b=md.blocks[i];if(!b)return {ok:false,why:'That block is gone.'};
  if(b.type==='step'){const o=clone(b.raw);o.id=nextStepId(m);return insert(m,i+1,{step:o});}
  if(b.type==='unlock'){const u=clone(b.raw);const r=insert(m,i+1,{unlock:u});return r;}
  return {ok:false,why:b.type==='apt'?'An apartment needs its own street door: add a new Apartment block instead.':'The START and END blocks cannot be copied.'};}
 /* The step above a position (the anchor a new reward there gets), or null. */
 function stepAbove(m,at){const bl=toBlocks(m).blocks;for(let k=Math.min(at,bl.length)-1;k>=0;k--){if(bl[k].type==='step')return bl[k].raw.id;if(bl[k].type==='end')return 'complete';}return null;}
 // ---------------------------------------------------------------- what can be added (the "+ ADD A BLOCK" picker)
 /* The picker's first level: the owner's kinds of block, each with its icon and a one-line help. */
 const PICK=[
  {id:'who',type:'who',name:'Who',help:'Someone does something: the player, or any character (they talk, play an animation, lead the way …).'},
  {id:'words',type:'words',name:'Words',help:'Someone says something: in person, as a Comms call or as a message.'},
  {id:'action',type:'action',name:'Action',help:'The player does something: go somewhere, take a photo, hack, follow, ride a cab, pet the cat …'},
  {id:'item',type:'item',name:'Item',help:'Buy or deliver something, or the player gets credits, a ship or a contact here.'},
  {id:'time',type:'time',name:'Time',help:'Wait a number of seconds before the mission goes on.'},
  {id:'ask',type:'ask',name:'Ask ACCEPT / DENY',help:'The mission stops and asks the player. You choose what DENY does.'},
  {id:'apartment',type:'apartment',name:'Location',help:'An apartment, or a place built from modules (an office, a server room, a shop back room …) behind a street door for this mission (open from the block above).'},
  {id:'npc',type:'who',name:'Add another NPC',help:'Bring another character into the mission: the player talks to them next.'}];
 /* Second level: what exactly. kind: the step kind (or 'unlock:<kind>', 'cost', 'apartment'); who: 'npc' (choose a character) or 'player'; adv: only shown in Advanced. */
 const CHOICES={
  who:[{id:'talk',kind:'talk',who:'npc',name:'The player talks to them',help:'Done when the player walks up and presses TALK. Their words go inside.'},
   {id:'anim',kind:'anim',who:'npc',name:'They play an animation',help:'A shrug, a laugh, looking about … where they stand.'},
   {id:'follow-them',kind:'follow-them',who:'npc',name:'They lead the way',help:'They walk to a spot you pick on a map; the player follows.'},
   {id:'they-follow',kind:'they-follow',who:'npc',name:'They follow the player',help:'They follow the player to a spot you pick.'},
   {id:'their-cab',kind:'their-cab',who:'npc',name:'They call a cab, you ride together',help:'Only Reverie or Lace.'},
   {id:'shared-cab',kind:'shared-cab',who:'npc',name:'You call a cab, they ride along',help:'Only Reverie or Lace.'},
   {id:'hear',kind:'hear',who:'npc',name:'More of the conversation',help:'Their words right after the talk block before it.',adv:true},
   {id:'player',kind:null,who:'player',name:'The player (blue) …',help:'Pick what the player does next (the Action list).'}],
  words:[{id:'person',kind:'talk',who:'npc',via:'talk',name:'In person',help:'The player walks up to them and presses TALK; then the words show.'},
   {id:'comms',kind:'talk',who:'npc',via:'comms',name:'As a Comms call',help:'They call the player’s V1 when the player talks to them … or use “Enter a place” with a call (Form view).'},
   {id:'messages',kind:'talk',who:'npc',via:'messages',name:'As a message',help:'They text the player’s V1 Messages.'}],
  action:[{id:'go',kind:'go',name:'Go to an area',help:'Done when the player reaches that area, e.g. The Avenue.'},
   {id:'enter',kind:'enter',name:'Go into a place',help:'Done while the player is inside it.'},{id:'leave',kind:'leave',name:'Leave a place',help:'Done when the player is outside it.'},
   {id:'photo',kind:'photo',name:'Take a photo of someone',help:'With the V1 camera; it must really show them.'},
   {id:'send-photo',kind:'send-photo',name:'Send a photo to someone',help:'In V1 Messages.'},
   {id:'pet-cat',kind:'talk',npc:'street-cat',name:'Pet the street cat',help:'PET THE CAT on The Avenue (where the cat is placed).'},
   {id:'apt-enter',kind:'apt-enter',name:'Go into a place',help:'A room of one of this mission’s locations or apartments, picked by its name (add a Location block first).'},
   {id:'apt-use',kind:'apt-use',name:'Use something',help:'In one of this mission’s rooms: a computer, a server rack, the safe, the light switch …'},
   {id:'hack',kind:'hack',name:'Hack an access point',help:'E at a door’s card reader, then a progress bar.'},
   {id:'follow-them',kind:'follow-them',who:'npc',name:'Follow someone',help:'They lead the way to a spot.'},{id:'they-follow',kind:'they-follow',who:'npc',name:'Someone follows the player',help:'To a spot you pick.'},
   {id:'their-cab',kind:'their-cab',who:'npc',name:'Ride a cab with someone (they call it)',help:'Only Reverie or Lace.'},{id:'shared-cab',kind:'shared-cab',who:'npc',name:'Ride a cab with someone (you call it)',help:'Only Reverie or Lace.'},
   {id:'anim',kind:'anim',who:'npc',name:'Someone plays an animation',help:'Between two blocks.'},
   {id:'pod-exit',kind:'pod-exit',name:'Leave the Sleeping Pod',help:'Done when the player presses EXIT POD.',adv:true},{id:'arrive',kind:'arrive',name:'Fly to a place',help:'Needs a ship.',adv:true},
   {id:'await-call',kind:'await-call',name:'Wait for their call',help:'Done by itself; the call comes from a later mission.',adv:true}],
  item:[{id:'buy',kind:'buy',name:'Buy an item',help:'At the outfitter or Admin’s counter.'},{id:'deliver',kind:'deliver',who:'npc',name:'Deliver to someone',help:'Done when the player talks to them.'},
   {id:'credits',kind:'unlock:credits',name:'The player gets credits here',help:'Given when the block above is done.'},
   {id:'pays',kind:'cost',name:'The player pays credits here',help:'The block above waits until the player has them (once per mission).'},
   {id:'ship',kind:'unlock:ship',name:'The player gets a ship here',help:'A ship that is not a paid purchase.'},
   {id:'contact',kind:'unlock:contact',who:'npc',name:'Someone is added to the V1 contacts',help:'Given when the block above is done.'},
   {id:'reputation',kind:'unlock:reputation',who:'npc',name:'Standing with someone changes',help:'A number from −100 to 100.',adv:true},
   {id:'flag',kind:'unlock:flag',name:'A story flag is set',help:'For later missions to check.',adv:true},{id:'location',kind:'unlock:location',name:'A place opens',help:'For travel.',adv:true},
   {id:'follow',kind:'unlock:follow',who:'npc',name:'Follow someone on Social',help:'',adv:true},{id:'tree',kind:'unlock:tree',name:'Start another tree',help:'Its first mission becomes available.',adv:true},
   {id:'take',kind:null,name:'Take an item from the player',help:'Not in the game yet (the game has no inventory for that).',off:true}],
  time:[{id:'wait',kind:'wait',name:'Wait a number of seconds',help:'1 to 600 seconds; optionally only while the player stays near someone.'},
   {id:'clock',kind:null,name:'Only at a time of the in-game day',help:'Not for single blocks yet: use a mission that starts “after in-game time” (Form view).',off:true}],
  ask:[{id:'ask',kind:'ask',name:'Ask the player: ACCEPT or DENY',help:'Your question and buttons; ACCEPT goes on, DENY does what you choose.'}],
  apartment:[{id:'location',kind:'location',name:'Build a location from modules',help:'Housing, commercial, office, server room, hallways, elevator, other: modules that join at their doors.'},{id:'apartment',kind:'apartment',name:'Instance an apartment',help:'Pick its style and its street door.'}],
  npc:[{id:'talk',kind:'talk',who:'npc',fresh:true,name:'Bring someone in',help:'Choose who; the player talks to them next.'}]};
 /* A new step of a kind, in the editor's draft shape (what + STEP in the Form view makes), with a Mission Log label filled in from the names. */
 function stepFor(kind,{npc='',via=null,name=id=>id,giver=''}={}){const o={id:'',label:'',kind};const nm=npc?name(npc):'';
  if(['talk','deliver','hear'].includes(kind)){o.npc=npc;o.place='';o.item='';o.say=[{who:'',text:''}];if(kind!=='hear')o.early=[];if(via&&via!=='talk')o.via=via;}
  else if(kind==='anim'){o.npc=npc;o.clip='';o.hold=3;}else if(kind==='wait'){o.hold=10;}else if(kind==='ask'){o.npc='';o.question='';o.say=[];o.denySay=[];}
  else if(['follow-them','they-follow','their-cab','shared-cab'].includes(kind)){o.npc=npc;o.say=[];}
  else if(kind==='photo'){o.npc=npc;o.say=[];}else if(kind==='send-photo'){o.npc=npc;o.subject='';o.say=[];o.wrong=[];}
  else if(kind==='go'||kind==='enter'||kind==='leave'||kind==='arrive'){o.place='';o.say=[];}else if(kind==='buy'){o.item='';o.say=[];}
  else if(kind==='apt-enter'||kind==='apt-use'){o.apt='';o.say=[];}else if(kind==='hack'){o.say=[];}else o.say=[];
  o.label=autoLabel(o,{name});return o;}
 /* The Mission Log text a new block starts with (the owner can change it; "Talk to Lace", "Follow Lace" …). */
 function autoLabel(o,{name=id=>id,place=id=>id}={}){const n=o.npc?name(o.npc):'',p=o.place?place(o.place):'';
  switch(o.kind){case 'talk':return o.npc==='street-cat'?'Pet the street cat':n?'Talk to '+n:'';case 'deliver':return n?'Deliver to '+n:'';case 'hear':return n?'Listen to '+n:'';
   case 'go':return p?'Go to '+p:'';case 'enter':return p?'Go into '+p:'';case 'leave':return p?'Leave '+p:'';case 'arrive':return p?'Fly to '+p:'';
   case 'photo':return n?'Photograph '+n:'';case 'send-photo':return n?'Send the photo to '+n:'';case 'buy':return 'Buy the item';case 'follow-them':return n?'Follow '+n:'';
   case 'they-follow':return n?'Take '+n+' along':'';case 'their-cab':case 'shared-cab':return n?'Ride with '+n:'';case 'apt-enter':return 'Go into the apartment';case 'apt-use':return 'Use it';
   case 'hack':return 'Hack the access point';case 'pod-exit':return 'Leave the Sleeping Pod';case 'await-call':return 'Await their call';case 'ask':return 'Decide';case 'anim':case 'wait':return '';default:return '';}}
 /* Everyone in the mission, in the order they appear (for the colours and the cast bar): the giver, the steps' people, the speakers of lines, the hand-in. */
 function cast(m){const ids=[];const add=id=>{if(id&&!ids.includes(id))ids.push(id);};add(m&&m.giver);for(const l of (m&&m.offer)||[])add(l&&l.who);
  for(const o of (m&&m.objectives)||[]){if(!o)continue;add(stepWho(o,m));for(const k of ['say','early','wrong','denySay'])for(const l of o[k]||[])add(l&&l.who);if(Array.isArray(o.subjects))o.subjects.forEach(add);add(o.subject);}
  if(m&&m.ending){add(m.ending.npc);for(const l of m.ending.say||[])add(l&&l.who);}return ids;}
 /* Per-block problems for the inline red outline and its plain fix: Map bid -> [{text, field}]. needs: mission-content.js treeNeeds(m) (the play / publish check). */
 const START_FIELDS=/^(title|giver|start-|cost-when|wait-at)/;
 function problems(m,needs){const out=new Map(),add=(bid,x)=>{if(!out.has(bid))out.set(bid,[]);out.get(bid).push(x);};
  for(const n of needs||[]){if(n.step)add('step:'+n.step,n);else if(n.field==='ending')add('end',n);else if(n.field==='apt-door'){const a=(m.apartments||[]).find(a=>a&&n.text.includes('“'+a.id+'”'))||(m.apartments||[]).find(a=>a&&!a.door);add(a?'apt:'+a.id:'start',n);}
   else if(n.field==='add-step')add('end',n);else add('start',n);}
  const ids=(m.objectives||[]).map(o=>o&&o.id);
  (m.unlocks||[]).forEach((u,i)=>{if(u&&u.when&&u.when!=='complete'&&!ids.includes(u.when))add('unlock:'+i,{text:'the step it was given at is gone: drag it below the step it belongs to',field:'unlock'});});
  for(const a of m.apartments||[])if(a&&a.from&&a.from!=='start'&&!ids.includes(a.from))add('apt:'+a.id,{text:'the step it opened from is gone: drag it below the step it opens from',field:'apt-from'});
  return out;}
 /* PLACES OF THIS MISSION BY THEIR REAL NAMES (the owner, 19 Nov 2026, of a "Go into" step for an office that said "Go into the apartment": "I won't remember this. Can it be
    in a drop-down?"). placeOptions(m, kind): this mission's locations and apartments as one list, each room by its type's name and its street door ("Office floor (No. 13,
    The Avenue, offices)", "Server room (…)", "Rundown apartment 104 (…)", "Container apartment, rundown (…)"); value '<apt>' (any room of it, Go into only) or '<apt>/<module>'.
    placeWords(o, m): the step's Mission Log words made from the chosen place ("Go into the office floor", "Use the server rack in the server room", "Hack the access point at
    the door between the office hallway and the office floor"). wordsAuto(o, m): the step still has words made for it (empty, these words, or the older fixed words), so a
    change of place may replace them; the owner's own words are kept (the editor offers "Use the automatic words"). hackOptions(m): the access points by the same names. */
 const reqP=f=>{try{return require(f);}catch{return null;}};
 const APL=()=>typeof module!=='undefined'&&module.exports?reqP('./apartments.js'):root.VoidApartments;
 const MDL=()=>typeof module!=='undefined'&&module.exports?reqP('./modules.js'):root.VoidModules;
 const LEGACY_WORDS=/^(Go into the apartment( at .*)?|Use it|Hack the access point|Go into the place)$/;
 const lc=s=>String(s||'').charAt(0).toLowerCase()+String(s||'').slice(1),uc=s=>String(s||'').charAt(0).toUpperCase()+String(s||'').slice(1);
 const the=n=>/^(apartment |no\. |the )/i.test(n)?n:'the '+n;
 function doorText(id){const X=APL();let d=null;try{d=X&&id?X.door(id):null;}catch{}return d?d.name.replace(/\s*\(([^)]*)\)\s*$/,', $1'):'';}
 function styleName(st){const X=APL(),s=X&&(X.STYLES||[]).find(x=>x.id===st);if(!s)return 'Apartment';return s.container?'Container apartment, '+lc(s.name.replace(/^Container\s*[—-]\s*/,'')):s.name;}
 /* One room's name and noun: {name ("Office floor"), noun ("office floor"), type}. Two of a kind in one location: their floor ("Elevator cab, floor B1") or their id. */
 function rooms(a){const M=MDL();if(!a||!Array.isArray(a.modules)||!M)return [];const list=a.modules.filter(x=>x&&M.TYPES[x.type]),out=[];
  for(const x of list){const t=M.TYPES[x.type],twins=list.filter(y=>y.type===x.type);let extra='';if(twins.length>1){const fl=Number.isInteger(x.floor)?x.floor:0,same=twins.filter(y=>(Number.isInteger(y.floor)?y.floor:0)===fl).length>1;extra=same?' '+x.id:fl===0?', ground floor':', floor '+M.floorName(fl);}
   out.push({id:x.id,type:x.type,name:t.name+extra,noun:lc(t.name)+extra,objects:M.objectsOf(x.type)||[],hall:t.cat==='hallway',cab:!!t.cab});}return out;}
 const aptNoun=a=>{if(Number.isInteger(a.number))return 'apartment '+a.number;const X=APL(),s=X&&(X.STYLES||[]).find(x=>x.id===(a.style||'normal'));return s&&s.container?lc(s.name.replace(/^Container\s*[—-]\s*/,''))+' container apartment':lc(styleName(a.style||'normal'));};
 function placeOptions(m,kind){const out=[];for(const a of (m&&m.apartments)||[]){if(!a||!a.id)continue;const door=doorText(a.door),at=door?' ('+door+')':' (no street door yet)';
   if(Array.isArray(a.modules)){const rs=rooms(a);if(kind!=='apt-use'){const main=rs.find(r=>!r.hall&&!r.cab)||rs[0];out.push({value:a.id,apt:a.id,mod:null,label:'Anywhere inside'+at,noun:door?'the building at '+door:'the '+(main?main.noun:'location'),any:true});}
    for(const r of rs){if(kind==='apt-use'&&!r.objects.length)continue;out.push({value:a.id+'/'+r.id,apt:a.id,mod:r.id,label:r.name+at,noun:r.noun,objects:r.objects});}continue;}
   const X=APL();out.push({value:a.id,apt:a.id,mod:null,label:styleName(a.style||'normal')+(Number.isInteger(a.number)?' '+a.number:'')+at,noun:aptNoun(a),objects:((X&&X.OBJECTS)||[]).filter(o=>!o.styles||o.styles.includes(a.style||'normal'))});}
  return out;}
 const placeValue=o=>o&&o.apt?o.apt+(o.mod?'/'+o.mod:''):'';
 /* The step's place from a list value: o.apt, o.mod; a used object the new room does not have is cleared. */
 function placeSet(o,value,m){const v=String(value||''),i=v.indexOf('/');if(!v){delete o.apt;delete o.mod;}else{o.apt=i<0?v:v.slice(0,i);if(i<0)delete o.mod;else o.mod=v.slice(i+1);}
  if(o.kind==='apt-use'&&o.object){const p=placeOptions(m,'apt-use').find(x=>x.value===placeValue(o));if(!p||!(p.objects||[]).some(x=>x.id===o.object))delete o.object;}return o;}
 const objName=n=>String(n||'').replace(/\s*\([^)]*\)\s*$/,'').replace(/^an? /,'the ');
 /* An access point (hack step o.ap) by its real name: a module door ('<loc>/<module>.<socket>'), an apartment's hallway or entry door ('<apt>/hall', '<apt>/entry') or a street door id. */
 function apName(m,ap){if(!ap)return '';const v=String(ap),i=v.indexOf('/');if(i<0){const d=doorText(v);return d?'the street door of '+d:'';}
  const a=((m&&m.apartments)||[]).find(x=>x&&x.id===v.slice(0,i)),ref=v.slice(i+1);if(!a)return '';
  if(!Array.isArray(a.modules)){const n=aptNoun(a);return ref==='hall'?'the hallway door of '+(the(n))+'':ref==='entry'?'the door inside '+the(n):'';}
  const M=MDL(),rs=rooms(a),nm=r=>{const x=rs.find(y=>y.id===String(r).split('.')[0]);return x?x.noun:String(r);};let an=null;try{an=M&&M.analyse(a);}catch{}
  const d=an&&an.doors.find(x=>x.a===ref||x.b===ref);if(!d)return 'the door '+ref+' of the '+nm(ref);
  if(d.kind==='entry')return 'the entrance door of the '+nm(d.a);if(d.kind==='portal'||!d.b)return 'the door of the '+nm(ref)+' that leads elsewhere';return 'the door between the '+nm(d.a)+' and the '+nm(d.b);}
 function hackOptions(m){const out=[],M=MDL();for(const a of (m&&m.apartments)||[]){if(!a||!a.id)continue;const door=doorText(a.door);
   if(Array.isArray(a.modules)){let an=null;try{an=M&&M.analyse(a);}catch{}const seen=new Set();for(const d of (an&&an.doors)||[])for(const r of [d.a,d.b]){if(!r||seen.has(r))continue;seen.add(r);const ap=a.id+'/'+r,rs=rooms(a),here=(rs.find(y=>y.id===r.split('.')[0])||{}).name||r;
     const d2=d.a===r?d.b:d.a,other=d2?(rs.find(y=>y.id===d2.split('.')[0])||{}).noun:null;out.push({ap,label:here+': '+(d.kind==='entry'?'its entrance door':other?'its door to the '+other:'its door that leads elsewhere')+(door?' ('+door+')':'')});}
    if(a.door)out.push({ap:a.door,label:'Street door'+(door?' ('+door+')':'')});continue;}
   const n=uc(aptNoun(a));out.push({ap:a.id+'/hall',label:n+': its door in the hallway'+(door?' ('+door+')':'')},{ap:a.id+'/entry',label:n+': inside, by its entry door'});if(a.door)out.push({ap:a.door,label:n+': its street door ('+door+')'});}
  return out;}
 function placeWords(o,m){if(!o)return '';const k=o.kind;
  if(k==='hack'){const n=apName(m,o.ap);return n?'Hack the access point at '+n:'';}
  if(k!=='apt-enter'&&k!=='apt-use')return '';const p=placeOptions(m,k==='apt-use'?'apt-use':'apt-enter').find(x=>x.value===placeValue(o))||(k==='apt-use'&&o.apt&&!o.mod?null:null);
  if(k==='apt-enter')return p?'Go into '+(p.any?p.noun:the(p.noun)):'';
  const ob=p?(p.objects||[]).find(x=>x.id===o.object):null;if(!p)return '';const room=the(p.noun),prep=/floor$/.test(p.noun)?'on':'in';return ob?'Use '+objName(ob.name)+' '+prep+' '+room:'Use something '+prep+' '+room;}
 const wordsAuto=(o,m)=>{const l=String((o&&o.label)||'').trim();return !l||l===placeWords(o,m)||LEGACY_WORDS.test(l);};
 /* After a change of place (fn changes the step): the words follow when they were automatic. */
 function rewordAfter(o,m,fn){const was=wordsAuto(o,m);fn(o);if(was){const w=placeWords(o,m);if(w)o.label=w;}return o;}
 const api={TYPES,PLAYER,PALETTE,KIND_TYPE,PICK,CHOICES,whoColor,castColors,isPlayer,typeOf,stepWho,lineSets,lineGroups,toBlocks,fromBlocks,orderProblem,move,nudge,insert,remove,duplicate,stepAbove,nextStepId,stepFor,autoLabel,cast,problems,START_FIELDS,clone,placeOptions,placeValue,placeSet,placeWords,wordsAuto,rewordAfter,hackOptions,apName,LEGACY_WORDS};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VoidMissionBlocks=api;
})(globalThis);
