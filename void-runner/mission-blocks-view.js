/* MISSION EDITOR > BLOCKS VIEW (browser only; loaded with the editor's scripts). The owner, 19 Nov 2026: the mission "in blocks": "+ ADD A BLOCK" between any two blocks
   picks what kind it is (Who, Words, Action, Item, Time, Ask ACCEPT / DENY, Apartment, Add another NPC); blocks nest (a blue player block holds an orange Action block; a
   Lace block holds her Words, and a Words block holds the Action she does while saying it); each WHO has its own colour (the border and a named chip; the player is blue),
   each TYPE its own colour, icon and word (the header). Drag a block by its handle (or ▲ ▼) to move it; ▾ folds it; ⧉ copies it; × deletes it (UNDO puts it back).
   It edits the SAME draft mission as the Form view (mission-blocks.js maps it; every change goes through the Mission Editor's own editTree, so UNDO, the server copy, Guide me,
   PLAY THIS DRAFT and publishing are unchanged). Its controls carry the Form view's data-me-* names, so Guide me highlights the next required box inside the blocks.
   Anything the blocks cannot show is a grey "Form view only" block: kept, movable, and one click opens it in the Form view. */
(function(root){
 'use strict';
 const B=()=>root.VoidMissionBlocks,DTX=()=>typeof VoidDevTools!=='undefined'?VoidDevTools:null;
 const VIEW_KEY='mission-editor-view',over={},collapsed=new Set(),opened=new Set();let pick=null,drag=null,lastNote=null;
 const store={get(k){try{return root.localStorage.getItem(k);}catch{return null;}},set(k,v){try{root.localStorage.setItem(k,v);}catch{}}};
 const panel=()=>typeof devPanel!=='undefined'?devPanel:document.getElementById('dev-balance');
 const basic=()=>{const p=panel();return !p||p.classList.contains('dev-basic');};
 /* Which view a mission opens in: the one chosen for it this session, else the view last chosen with the switch (remembered in this browser), else Blocks in Basic mode
    and Form in Advanced. */
 function on(mid){if(over[mid])return over[mid]==='blocks';const p=store.get(VIEW_KEY);if(p==='blocks'||p==='form')return p==='blocks';return basic();}
 function set(mid,v){over[mid]=v;store.set(VIEW_KEY,v);}
 /* After "Make a mission": the new mission opens in Blocks (unless the person switched to the Form view themselves before). */
 function openBlocks(mid){if(store.get(VIEW_KEY)!=='form')over[mid]='blocks';}
 // ---------------------------------------------------------------- small helpers
 const ICON={start:'M5 21V4h11l-2 4 2 4H5',who:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 4-6 8-6s8 2 8 6',words:'M4 5h16v11H9l-5 4z',action:'M6 4l13 8-13 8z',
  item:'M12 3l8 4v10l-8 4-8-4V7zM4 7l8 4 8-4M12 11v10',time:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 3',ask:'M9 9a3 3 0 1 1 4.5 2.6c-1 .6-1.5 1.2-1.5 2.4M12 18h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
  apartment:'M4 21V8l8-5 8 5v13M10 21v-6h4v6',zone:'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM12 8v5M12 16h.01',end:'M5 13l4 4L19 7',other:'M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-2.5z',
  npc:'M10 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c0-4 4-6 8-6M18 14v6M15 17h6',drag:'M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01'};
 const svg=(name,size=16)=>'<svg class="mb-ic" width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="'+(ICON[name]||ICON.other)+'"/></svg>';
 function icon(name,size){const s=document.createElement('span');s.className='mb-icw';s.innerHTML=svg(name,size);return s;}
 /* Pure-state helpers bound to one mission draw. */
 function ctxOf(c){const k=c.kit,m=c.m,ids=B().cast(m),cols=B().castColors(['You',...ids]);
  const name=id=>B().isPlayer(id)?'You (the player)':id?((k.giver(id)||{}).name||id):'nobody yet';
  const short=id=>B().isPlayer(id)?'You':id?((k.giver(id)||{}).name||id):'—';
  const color=id=>id?(cols.get(id)||B().whoColor(id)):B().TYPES.other.color;
  const place=id=>id?(((k.G().PLACE.get(id)||{}).name)||root.VoidPlaces?.node?.(id)?.name||(k.refs&&k.refs.locations&&k.refs.locations[id])||id):'';
  return {...c,name,short,color,place,ids};}
 const el=(c,...a)=>c.kit.el(...a),btn=(c,...a)=>c.kit.btn(...a),hint=(c,t,a)=>c.kit.hint(t,a);
 /* One change of the draft: through the Mission Editor's editTree (saved, one UNDO step). fn(mission) may return a plain reason it could not be done. */
 function change(c,fn,{redraw=true,note=''}={}){let why='';c.ed(x=>{why=fn(x)||'';},redraw);if(why)c.kit.status(why);else if(note)c.kit.status(note);return !why;}
 // ---------------------------------------------------------------- the switch (Blocks | Form)
 function toggle(mid,redraw){const box=document.createElement('div');box.className='mb-switch';box.setAttribute('role','radiogroup');box.setAttribute('aria-label','How this mission is shown');box.dataset.mbSwitch=mid;
  const cur=on(mid)?'blocks':'form';
  for(const [v,label,ic,help] of [['blocks','Blocks','apartment','The mission as a timeline of coloured blocks.'],['form','Form','words','Every setting as a list of boxes (the full editor).']]){const b=document.createElement('button');b.type='button';b.className='mb-sw'+(cur===v?' on':'');
   b.setAttribute('role','radio');b.setAttribute('aria-checked',String(cur===v));b.dataset.mbView=v;b.title=help;b.append(icon(v==='blocks'?'item':'words',14),document.createTextNode(' '+label));b.onclick=e=>{e.preventDefault();if(cur===v)return;set(mid,v);redraw();};box.append(b);}
  const h=document.createElement('span');h.className='me-help';h.textContent=cur==='blocks'?'Blocks: the same mission as a timeline. Both views edit the same draft.':'Form: every setting as boxes. Blocks shows the same mission as a timeline.';box.append(h);return box;}
 // ---------------------------------------------------------------- the view
 function view(c0){const c=ctxOf(c0),{m,kit}=c,MB=B(),root_=el(c,'section','','mb-root',{'data-mb-mission':m.id});
  const model=MB.toBlocks(m),probs=MB.problems(m,kit.needs(m));c.probs=probs;c.model=model;
  root_.append(el(c,'h4','The mission, block by block','mb-title'),hint(c,'Read it from top to bottom: it plays in this order. + ADD A BLOCK (between any two blocks) adds the next thing that happens. Drag a block by its ⠿ handle, or use ↑ ↓, to move it; FOLD hides a block’s details. The coloured edge says WHO, the header says WHAT (with its icon and word).'));
  root_.append(castBar(c));
  if(lastNote&&lastNote.mid===m.id){const n=el(c,'p','','me-status mb-note',{role:'status','data-mb-note':'1'});n.append(document.createTextNode(lastNote.text+' '));if(lastNote.undo)n.append(btn(c,'UNDO',()=>{root.VoidEditorHome?.undo();},'mb-undo',{'data-mb-undo':'1'}));root_.append(n);lastNote=null;}
  const tl=el(c,'ol','','mb-timeline',{'aria-label':'Mission timeline'});c.tl=tl;
  model.blocks.forEach((b,i)=>{if(i>0)tl.append(gap(c,i,b.type==='end'));const li=el(c,'li','','mb-item',{'data-mb-at':String(i)});li.append(blockEl(c,b,i));tl.append(li);
});
  tl.append(gap(c,model.blocks.length,false,true));root_.append(tl);
  return root_;}
 /* Who is in this mission (the colours), and what the colours and icons mean. */
 function castBar(c){const bar=el(c,'div','','mb-cast',{'data-mb-cast':'1'});bar.append(el(c,'b','In this mission:'));
  for(const id of ['You',...c.ids.filter(x=>!B().isPlayer(x))]){const ch=chip(c,id);bar.append(ch);}
  const lg=el(c,'details','','mb-legend');lg.append(el(c,'summary','What the colours mean'));const ul=el(c,'ul');
  ul.append(el(c,'li','The coloured edge and the name chip: WHO (the player is always blue; every character has their own colour).'));
  for(const t of ['who','words','action','item','time','ask','zone','apartment','other']){const T=B().TYPES[t],li=el(c,'li','','mb-legend-row');const sw=el(c,'span','','mb-typechip mb-t-'+t,{style:'--type:'+T.color});sw.append(icon(T.icon,14),document.createTextNode(' '+T.name.toUpperCase()));li.append(sw,document.createTextNode(' '+({who:'someone does something',words:'what is said',action:'something is done',item:'items, credits and rewards',time:'a wait',ask:'the player chooses ACCEPT or DENY',apartment:'an apartment for this mission',other:'kept, but changed only in the Form view'}[t])));ul.append(li);}
  lg.append(ul);bar.append(lg);return bar;}
 function chip(c,id,small){const s=el(c,'span','','mb-chip'+(small?' small':''),{style:'--who:'+c.color(id),'data-mb-who':B().isPlayer(id)?'player':id||'none',title:c.name(id)});
  const dot=el(c,'span',(c.short(id)||'?').slice(0,1).toUpperCase(),'mb-dot');s.append(dot,document.createTextNode(c.short(id)));return s;}
 // ---------------------------------------------------------------- "+ ADD A BLOCK" and the drop zones
 function gap(c,at,beforeEnd,last){const g=el(c,'li','','mb-gap'+(beforeEnd?' main':'')+(last?' last':''),{'data-mb-gap':String(at)});
  const b=btn(c,'',()=>{pick=pick&&pick.at===at&&pick.mid===c.m.id?null:{mid:c.m.id,at,level:null};c.kit.draw();},beforeEnd?'mb-add big':'mb-add',{'aria-label':'Add a block here','aria-expanded':String(!!(pick&&pick.at===at&&pick.mid===c.m.id)),...(beforeEnd?{'data-me-add-step':c.m.id}:{}),'data-mb-add':String(at)});
  b.append(document.createTextNode(beforeEnd?'+ ADD A BLOCK':last?'+ add a reward after the end':'+'));g.append(b);
  if(pick&&pick.mid===c.m.id&&pick.at===at)g.append(picker(c,at));return g;}
 /* DRAG (pointer events, so it works the same with a mouse, a pen or a touch screen): hold the ⠿ handle and move; the gap or the half of a block under the pointer is
    highlighted (the upper half of a block: above it; the lower half: below it); let go to move the block there. Esc or letting go outside the timeline cancels. */
 function dropTarget(c,x,y){const n=document.elementFromPoint(x,y),g=n&&n.closest('.mb-gap'),li=n&&n.closest('.mb-item');if(g&&c.tl.contains(g))return {node:g,at:Number(g.dataset.mbGap),cls:'over'};
  if(li&&c.tl.contains(li)){const r=li.getBoundingClientRect(),i=Number(li.dataset.mbAt),up=y<r.top+Math.min(r.height/2,60);return {node:li,at:up?i:i+1,cls:up?'drop-above':'drop-below'};}return null;}
 function startDrag(c,bid,hd,e){if(e.button!==0&&e.pointerType==='mouse')return;e.preventDefault();drag=bid;const rootEl=c.tl.closest('.mb-root');rootEl.classList.add('mb-dragging');hd.closest('.mb-block')?.classList.add('mb-lifted');
  try{hd.setPointerCapture(e.pointerId);}catch{}let cur=null;const clear=()=>{if(cur)cur.node.classList.remove(cur.cls);cur=null;};
  const move=ev=>{const t=dropTarget(c,ev.clientX,ev.clientY);clear();if(t){cur=t;t.node.classList.add(t.cls);}const pr=c.tl.closest('#dev-balance');if(pr){if(ev.clientY<60)pr.scrollTop-=12;else if(ev.clientY>innerHeight-60)pr.scrollTop+=12;}};
  const end=(ev,cancel)=>{hd.removeEventListener('pointermove',move);hd.removeEventListener('pointerup',up);hd.removeEventListener('pointercancel',no);document.removeEventListener('keydown',esc,true);
   const t=cancel?null:dropTarget(c,ev.clientX,ev.clientY);clear();drag=null;rootEl.classList.remove('mb-dragging');hd.closest('.mb-block')?.classList.remove('mb-lifted');if(t)dropAt(c,bid,t.at);};
  const up=ev=>end(ev,false),no=ev=>end(ev,true),esc=ev=>{if(ev.key==='Escape'){ev.preventDefault();end(ev,true);}};
  hd.addEventListener('pointermove',move);hd.addEventListener('pointerup',up);hd.addEventListener('pointercancel',no);document.addEventListener('keydown',esc,true);}
 function dropAt(c,bid,at){change(c,x=>B().move(x,bid,at),{note:'Moved. UNDO puts it back.'});}
 /* The picker: the owner's kinds of block first, then what exactly (and who). */
 function picker(c,at){const P=el(c,'div','','mb-picker',{'data-mb-picker':String(at),role:'dialog','aria-label':'What kind of block?'}),MB=B();
  if(!pick.level){P.append(el(c,'b','What kind of block?'));const g=el(c,'div','','mb-tiles');
   for(const k of MB.PICK){const T=MB.TYPES[k.type],t=btn(c,'',()=>{pick.level=k.id;c.kit.draw();},'mb-tile mb-t-'+k.type,{style:'--type:'+(k.id==='who'||k.id==='npc'?MB.PLAYER:T.color),'data-mb-pick':k.id});
    t.append(icon(k.id==='npc'?'npc':T.icon,22),el(c,'b',k.name),el(c,'span',k.help));g.append(t);}
   P.append(g,btn(c,'CANCEL',()=>{pick=null;c.kit.draw();},'mb-cancel'));return P;}
  const lv=pick.level,list=(MB.CHOICES[lv]||[]).filter(x=>!x.adv||!basic());
  P.append(el(c,'b',(MB.PICK.find(x=>x.id===lv)||{}).name+': what exactly?'));const ul=el(c,'div','','mb-choices');
  for(const ch of list){const row=el(c,'div','','mb-choice'+(ch.off?' off':''),{'data-mb-choice':ch.id});const T=MB.TYPES[ch.kind&&MB.KIND_TYPE[ch.kind]||(lv==='item'?'item':lv==='time'?'time':lv==='ask'?'ask':lv==='apartment'?'apartment':'action')]||MB.TYPES.action;
   row.style.setProperty('--type',T.color);row.append(icon(T.icon,18));const tx=el(c,'span','','mb-choice-text');tx.append(el(c,'b',ch.name),el(c,'span',ch.help,'me-help'));row.append(tx);
   if(ch.off){row.append(el(c,'span','not in the game yet','me-small me-warn'));ul.append(row);continue;}
   if(ch.who==='player'){row.append(btn(c,'CHOOSE',()=>{pick.level='action';c.kit.draw();},'',{'data-mb-choose':ch.id}));ul.append(row);continue;}
   if(ch.who==='npc'){const fresh=ch.fresh||lv==='npc',sel=c.kit.npcSelect('',v=>{if(v)make(c,at,ch,v);},{label:'Who',empty:fresh?'— choose who joins —':'— choose who —',attrs:{'data-mb-choose-npc':ch.id}});
    if(fresh)for(const o of [...sel.options])if(c.ids.includes(o.value)&&o.value)o.textContent+=' (already in it)';row.append(sel);ul.append(row);continue;}
   row.append(btn(c,'ADD',()=>make(c,at,ch,ch.npc||''),'',{'data-mb-choose':ch.id}));ul.append(row);}
  P.append(ul);const nav=el(c,'div','','me-row');nav.append(btn(c,'◀ BACK',()=>{pick.level=null;c.kit.draw();},'',{'data-mb-pick-back':'1'}),btn(c,'CANCEL',()=>{pick=null;c.kit.draw();},'mb-cancel'));P.append(nav);return P;}
 /* Makes the chosen block at `at` and opens it (Guide me then points at its first empty box). */
 function make(c,at,ch,npc){const MB=B(),name=id=>c.short(id);let bid=null,note='';
  const ok=change(c,x=>{const k=ch.kind;
   if(k==='cost'){const above=MB.stepAbove(x,at);if(!above||above==='complete')return 'The player pays when the block above is done: put it below a step.';if(x.cost)return 'This mission already has a cost (Credits, at the top). A mission has one cost; a question can also charge on ACCEPT (Ask block).';
    c.kit.MC().setSigned(x,-100);x.cost.when=above;bid='step:'+above;note='The player pays 100 credits when the block above is done (it waits until they have them). Change the amount under Credits at the top.';return '';}
   if(k==='location'){const ids=new Set((x.apartments||[]).map(a=>a.id));if(ids.size>=4)return 'A mission can have up to 4 apartments and locations.';let n=1;while(ids.has('l'+n))n++;const r=MB.insert(x,at,{apt:{id:'l'+n,door:'',modules:[]}});if(!r.ok)return r.why;bid=r.bid;note='New location: add its first module (category, then module), then choose its street door.';return '';}
   if(k==='apartment'){const ids=new Set((x.apartments||[]).map(a=>a.id));if(ids.size>=4)return 'A mission can have up to 4 apartments.';let n=1;while(ids.has('a'+n))n++;const r=MB.insert(x,at,{apt:{id:'a'+n,style:'normal',door:''}});if(!r.ok)return r.why;bid=r.bid;note='New apartment: choose its street door.';return '';}
   if(k&&k.startsWith('unlock:')){const u=unlockFor(c,k.slice(7),npc);const r=MB.insert(x,at,{unlock:u});if(!r.ok)return r.why;bid=r.bid;note='Added: '+ch.name.toLowerCase()+'.';return '';}
   const o=MB.stepFor(k,{npc,via:ch.via,name});if(ch.id==='pet-cat')o.label='Pet the street cat';const r=MB.insert(x,at,{step:o});if(!r.ok)return r.why;bid=r.bid;note='Added: '+ch.name+(npc?' ('+name(npc)+')':'')+'. Fill in the box that glows.';return '';},{redraw:false});
  if(!ok)return;pick=null;if(bid){opened.add(bid);collapsed.delete(bid);}lastNote={mid:c.m.id,text:note};root.VoidEditorGuide?.focusNext();c.kit.draw();}
 function unlockFor(c,kind,npc){const ships=Object.entries(root.VoidShips?.ships||{}).filter(([,s])=>!s.premium).map(([id])=>id);
  return kind==='credits'?{kind,amount:100}:kind==='ship'?{kind,id:ships[0]||'starter'}:kind==='reputation'?{kind,id:npc,amount:10}:kind==='flag'?{kind,id:'',value:true}:kind==='missiles'?{kind,id:'m1',amount:6}:{kind,id:npc||''};}
 // ---------------------------------------------------------------- one block
 /* The frame every block shares: the WHO edge and chip, the TYPE header (icon + word + tint), the title, the tools (▲ ▼ ⧉ × ▾), its problems with their plain fix. */
 function frame(c,{bid,type,who,title,tools=true,dragOk=true,nested=false,attrs={}}){const MB=B(),T0=MB.TYPES[type]||MB.TYPES.other,T=type==='who'&&who?{...T0,color:c.color(who)}:T0,bad=!nested&&c.probs.get(bid);   // a WHO block's header is its person's colour
  const a=el(c,'article','','mb-block mb-t-'+type+(nested?' mb-nested':'')+(bad?' mb-bad':''),{style:'--who:'+(who===undefined?T.color:c.color(who))+';--type:'+T.color,'data-mb-block':bid||'','data-mb-type':type,...attrs});
  const h=el(c,'div','','mb-head');a.append(h);
  if(tools&&dragOk&&!nested){const hd=el(c,'span','','mb-handle',{title:'Drag to move (or use ▲ ▼)','aria-hidden':'true','data-mb-handle':bid});hd.innerHTML=svg('drag',16);hd.addEventListener('pointerdown',e=>startDrag(c,bid,hd,e));h.append(hd);}
  const tc=el(c,'span','','mb-typechip',{'data-mb-typechip':type});tc.append(icon(T.icon,15),document.createTextNode(' '+T.name.toUpperCase()));h.append(tc);
  if(who!==undefined&&who!==null)h.append(chip(c,who,nested));
  const tt=el(c,'span',title||'','mb-title-text');h.append(tt);
  const body=el(c,'div','','mb-body');
  if(tools&&!nested){const tl=el(c,'span','','mb-tools');const fold=collapsed.has(bid)&&!bad;
   if(dragOk)tl.append(btn(c,'↑',()=>change(c,x=>B().nudge(x,bid,-1)),'',{'aria-label':'Move up','data-mb-up':bid}),btn(c,'↓',()=>change(c,x=>B().nudge(x,bid,1)),'',{'aria-label':'Move down','data-mb-down':bid}));
   if(dragOk&&type!=='apartment')tl.append(btn(c,'⧉',()=>{let nb=null;change(c,x=>{const r=B().duplicate(x,bid);nb=r.bid;return r.ok?'':r.why;},{note:'Copied: the copy is right below.'});if(nb)opened.add(nb);},'',{'aria-label':'Copy this block','title':'Copy','data-mb-copy':bid}));
   if(dragOk)tl.append(btn(c,'×',()=>{if(change(c,x=>B().remove(x,bid),{redraw:false})){lastNote={mid:c.m.id,text:'Block deleted.',undo:true};c.kit.draw();}},'me-x',{'aria-label':'Delete this block','title':'Delete (UNDO puts it back)','data-mb-del':bid}));
   tl.append(btn(c,fold?'OPEN':'FOLD',()=>{if(collapsed.has(bid))collapsed.delete(bid);else collapsed.add(bid);c.kit.draw();},'mb-fold',{'aria-label':fold?'Show this block':'Fold this block','aria-expanded':String(!fold),'data-mb-fold':bid}));h.append(tl);if(fold)body.hidden=true;}
  if(bad){const f=el(c,'ul','','mb-fixes',{'data-mb-fixes':bid});for(const p of bad)f.append(el(c,'li','To fix: '+p.text.replace(/^step \d+:? ?/,'')));a.append(f);}
  a.append(body);a.body=body;a.titleEl=tt;return a;}
 const MC=c=>c.kit.MC();
 function blockEl(c,b,i){if(b.type==='start')return startBlock(c);if(b.type==='end')return endBlock(c);if(b.type==='apt')return aptBlock(c,b);if(b.type==='unlock')return unlockBlock(c,b);return stepBlock(c,b,i);}
 // ---- START
 /* The Start block (19 Nov 2026: the owner could not find "when the player walks near the giver"): an editable "How it starts" (mission-blocks.js START_MODES, the same
    list as the Form view's Starts), with the distance and the banner words right here when it is walk near. */
 function startBlock(c){const {m,kit}=c,st=m.start||{how:'person'},by=st.how==='notification',w=st.when||{},G=kit.G(),MB=B(),mode=MB.startMode(m),near=mode==='near'||mode==='near-accept';
  const a=frame(c,{bid:'start',type:'start',who:m.giver||null,title:'The mission starts',dragOk:false});
  const r=el(c,'div','','me-row mb-fields'),sel=el(c,'select','','',{'aria-label':'How it starts','data-mb-start-mode':m.id});for(const x of MB.START_MODES)sel.append(new Option(x.name,x.id));sel.value=mode;
  sel.onchange=()=>change(c,x=>{MB.setStartMode(x,sel.value);return '';},{note:'Starts: '+((MB.START_MODES.find(x=>x.id===sel.value)||{}).name||sel.value)+'.'});r.append(el(c,'b','How it starts'),sel);a.body.append(r);
  a.body.append(hint(c,(MB.START_MODES.find(x=>x.id===mode)||{}).help||''));
  if(near){const N=G.NEAR,who=w.npc||m.giver||'',r2=el(c,'div','','me-row mb-fields'),NF=VoidUnits.ftRange(N.min,N.max),di=el(c,'input','','',{type:'number',min:String(NF[0]),max:String(NF[1]),step:'1','aria-label':'Distance in feet','data-mb-start-distance':m.id,style:'width:5em'});
   di.value=String(VoidUnits.ft(G.nearMetres(w.distance)));di.onchange=()=>{const v=VoidUnits.m(di.value,G.nearMetres(w.distance),{min:N.min,max:N.max});di.value=String(VoidUnits.ft(v));change(c,x=>{x.start.when={...(x.start.when||{}),kind:'near',distance:v};return '';},{redraw:false});};
   r2.append(el(c,'span','Starts when the player comes within','me-small'),di,el(c,'span','ft of '+c.short(who),'me-small'));a.body.append(r2);
   const pay=MC(c).costOf(m);a.body.append(el(c,'p',mode==='near'?'Starts automatically — no click: walking near starts it at once.':pay&&pay.when==='accept'?'Asks '+(st.yes||'ACCEPT')+' / '+(st.no||'DENY')+': the player pays '+pay.amount+' CR when accepting, so it must ask.':'Asks '+(st.yes||'ACCEPT')+' / '+(st.no||'DENY')+': it starts only when the player presses '+(st.yes||'ACCEPT')+'.',mode==='near'?'me-ok':'me-small',{'data-mb-near-auto':String(mode==='near')}));
   const tl=el(c,'label','','me-field');tl.append(el(c,'span','The banner (a short notification when it starts)'));const ta=el(c,'textarea','','',{rows:'2',maxlength:'500','aria-label':'Banner text','data-mb-start-text':m.id,placeholder:'(your words, e.g. who wants a word)'});ta.value=st.text||'';
   ta.oninput=()=>{change(c,x=>{if(x.start)x.start.text=ta.value.slice(0,500);return '';},{redraw:false});kit.guideSoon();};tl.append(ta);a.body.append(tl);}
  else if(by)a.body.append(el(c,'p',((G.START_CHANNELS.find(x=>x.id===st.channel)||{}).name||st.channel)+' from '+c.short(st.from||m.giver)+' · '+(((G.START_WHEN.find(x=>x.id===w.kind)||{}).name)||'its trigger').toLowerCase()+'.','mb-line'),hint(c,'The sender, the words and when it arrives are set in “How this mission starts” above.'));
  if(!by||near)a.body.append(words(c,'offer',m.offer||[],m.giver,{title:near?'What '+c.short(m.giver)+' says when the player walks near':'What '+c.short(m.giver)+' says when offering it',player:true,anim:true,choice:MC(c).choiceOk(m,null)}));
  const pay=MC(c).costOf(m);if(pay&&pay.when==='accept')a.body.append(mini(c,'item',null,'The player pays '+pay.amount+' CR when they press '+(st.yes||'ACCEPT')+' (Credits, at the top).'));
  if(st.accept===true){const ask=frame(c,{type:'ask',who:by?st.from||m.giver:m.giver,title:'The player chooses '+(st.yes||'ACCEPT')+' or '+(st.no||'DENY'),nested:true});
   ask.body.append(el(c,'p','On DENY: '+({again:by?'offered again after the next pod exit':'offered again the next time they talk',pod:'offered again after the next pod exit',after:'offered again after '+MC(c).denyMinutes(st.denyMinutes)+' minutes of play',never:'never offered again (removed)',start:'another mission starts instead'}[st.deny||'again'])+'. Buttons and DENY are set in “How this mission starts” above.','me-small'));a.body.append(ask);}
  else a.body.append(hint(c,'No question at the offer: tick “Ask the player: ACCEPT or DENY” above, or add an Ask block anywhere below.'));
  return a;}
 // ---- END
 function endBlock(c){const {m,kit}=c,e=m.ending||{};const a=frame(c,{bid:'end',type:'end',who:e.npc||null,title:e.npc?'Hand in to '+c.short(e.npc):'The mission is done',dragOk:false});
  const r=el(c,'div','','me-row');r.append(el(c,'span','Hand in to','me-small'),kit.npcSelect(e.npc||'',v=>change(c,x=>{x.ending=x.ending||{npc:'',place:'',label:'',say:[]};x.ending.npc=v;}),{label:'Hand-in NPC',empty:'— nobody: it ends when the last block is done —',attrs:{'data-me-ending':m.id}}));a.body.append(r,hint(c,kit.HELP.ending));
  if(e.npc){a.body.append(labelBox(c,e.label||'',v=>change(c,x=>{x.ending.label=v.slice(0,200);},{redraw:false}),'(empty: “Hand in to '+c.short(e.npc)+'”)','data-mb-end-label'));a.body.append(words(c,'ending',e.say||[],e.npc,{title:'What is said at the hand-in',player:true,anim:true}));}
  if(Number(m.rewards)>0)a.body.append(mini(c,'item',null,'The player gets '+m.rewards+' credits when it is done (Credits, at the top).'));
  a.body.append(hint(c,'Rewards below this block are given when the mission is done.'));return a;}
 // ---- a STEP
 const STEP_TITLE={talk:'talks',hear:'says more',deliver:'Deliver',buy:'Buy',go:'Go to',arrive:'Fly to',enter:'Go into',leave:'Leave',photo:'Photograph','send-photo':'Send a photo','pod-exit':'Leave the Sleeping Pod',
  'follow-them':'leads the way','they-follow':'follows the player','their-cab':'calls a cab','shared-cab':'rides in your cab',anim:'plays an animation','apt-enter':'Go into a place','apt-use':'Use something',hack:'Hack an access point',
  message:'The notification arrives','await-call':'Wait for their call',wait:'Wait',ask:'asks the player',zone:'Change zone'};
 function stepTitle(c,o){const who=B().stepWho(o,c.m),t=STEP_TITLE[o.kind]||'';if(['talk','hear','follow-them','they-follow','their-cab','shared-cab','anim','ask'].includes(o.kind))return (who?c.short(who):'Someone')+' '+t;
  if(o.kind==='go'||o.kind==='enter'||o.kind==='leave'||o.kind==='arrive')return t+' '+(o.place?c.place(o.place):'…');if(o.kind==='photo')return t+' '+(o.npc?c.short(o.npc):'…');if(o.kind==='deliver')return t+' to '+(o.npc?c.short(o.npc):'…');
  if(['apt-enter','apt-use','hack'].includes(o.kind)){const w=B().placeWords(o,c.m);if(w)return w;}
  if(o.kind==='wait')return 'Wait '+(Number.isInteger(o.hold)?o.hold:10)+' s'+(o.near&&o.npc?' near '+c.short(o.npc):'');if(o.kind==='zone')return root.VoidZoneEditor?root.VoidZoneEditor.title(c.m,o):'Change zone';return t||('“'+(o.kind||'?')+'” (Form view only)');}
 function stepBlock(c,b,i){const {m,kit}=c,o=b.raw,MB=B(),type=MB.typeOf(o),who=MB.stepWho(o,m),bid=b.bid;
  const eo=(fn,redraw=true)=>c.ed(x=>{const oo=(x.objectives||[]).find(y=>y.id===o.id);if(oo)fn(oo,x);},redraw);
  // a timeline step is a WHO block (its person's colour) holding a TYPE block (Action, Item, Words, Time, Ask); a talk step holds the conversation itself
  const outer=type==='time'||type==='other'||type==='zone'?type:type==='ask'?'ask':'who';
  const a=frame(c,{bid,type:outer,who:outer==='who'||outer==='ask'?who:undefined,title:stepTitle(c,o),attrs:{'data-me-tstep':o.id,'data-me-step':o.id}});
  if(type==='other'){a.body.append(el(c,'p','This block is a “'+(o.kind||'?')+'” step. The Blocks view does not show its settings yet; it is kept exactly as it is.','me-small'),btn(c,'EDIT IN FORM VIEW',()=>formAt(c,o.id),'',{'data-me-kind':o.id,'data-mb-form':o.id}));return a;}
  if(o.delay>0||opened.has(bid)||!basic())a.body.append(delayRow(c,o,eo));
  const cost=MC(c).costOf(m);if(cost&&cost.when===o.id)a.body.append(mini(c,'item','You','The player pays '+cost.amount+' CR to finish this block (it waits until they have them). Amount: Credits, at the top.'));
  if(type==='who'){a.body.append(talkFields(c,o,eo));}
  else if(type==='zone'){a.body.append(...kindFields(c,o,eo));}
  else{const inner=frame(c,{type,who:type==='ask'?undefined:who,title:innerTitle(c,o),nested:true,attrs:{'data-mb-inner':o.id}});inner.body.append(...kindFields(c,o,eo));a.body.append(inner);}
  if(o.kind!=='anim'&&o.kind!=='wait'){const lb=labelBox(c,o.label||'',v=>eo(x=>{x.label=v.slice(0,500);},false),'(your words)','data-me-label',o.id);
   if(['apt-enter','apt-use','hack'].includes(o.kind)&&c.kit.autoWordsBtn){const ab=c.kit.autoWordsBtn(m,o,eo);lb.append(ab);lb.querySelector('input').addEventListener('input',e=>ab.refresh(e.target.value));}a.body.append(lb);}
  for(const s of MB.lineSets(o,m)){const box=words(c,o.id+'/'+s.key,o[s.key]||[],s.who,{...s,via:o.via});if(s.more){const d=el(c,'details','','mb-more');d.open=(o[s.key]||[]).length>0;d.append(el(c,'summary','More: '+s.title.toLowerCase()),box);a.body.append(d);}else a.body.append(box);}
  return a;}
 const innerTitle=(c,o)=>({go:'Go to an area',arrive:'Fly to',enter:'Go into a place',leave:'Leave a place',photo:'Take a photo','send-photo':'Send a photo','pod-exit':'Leave the Sleeping Pod','follow-them':'Lead the way','they-follow':'Follow the player','their-cab':'Their cab','shared-cab':'Your cab',
  anim:'Animation','apt-enter':'Go into a place','apt-use':'Use something',hack:'Hack',buy:'Buy an item',deliver:'Deliver',message:'Notification','await-call':'Their call',wait:'Wait',ask:'ACCEPT or DENY'}[o.kind]||o.kind);
 /* "Who" steps: the player talks to someone (or hears more from them). */
 function talkFields(c,o,eo){const {kit}=c,r=el(c,'div','','me-row mb-fields');
  const sel=kit.npcSelect(o.npc||'',v=>eo(x=>{const was=B().autoLabel(x,{name:c.short});x.npc=v;if(!x.label||x.label===was)x.label=B().autoLabel(x,{name:c.short});}),{label:o.kind==='hear'?'Who is heard':'Who the player talks to',empty:o.kind==='hear'?'(the giver)':'— choose who —',attrs:{'data-me-step-npc':o.id}});
  r.append(el(c,'span',o.kind==='hear'?'More of the conversation with':o.npc==='street-cat'?'The player pets':'The player walks up to','me-small'),sel,el(c,'span',o.kind==='hear'?'(right after the talk block before it)':o.npc==='street-cat'?'(PET THE CAT)':'and presses TALK','me-small'));
  if(o.kind==='talk'){const vs=el(c,'select','','',{'aria-label':'How it is said','data-me-step-via':o.id});for(const [v,n] of [['talk','in person'],['comms','as a Comms call'],['messages','as a message']])vs.append(new Option(n,v));vs.value=o.via||'talk';
   vs.onchange=()=>eo(x=>{if(vs.value==='talk')delete x.via;else{x.via=vs.value;for(const l of x.say||[])if(l&&l.who==='You')l.who='';}});r.append(el(c,'span','· said','me-small'),vs);}
  return r;}
 /* The TYPE block's settings for each kind of step: the Form view's own pickers (the same data-me-* names, so Guide me finds them). */
 function kindFields(c,o,eo){const {m,kit}=c,k=o.kind,out=[],row=()=>{const r=el(c,'div','','me-row mb-fields');out.push(r);return r;},relabel=x=>{const was=x.__was;delete x.__was;if(!x.label||x.label===was)x.label=B().autoLabel(x,{name:c.short,place:c.place});};
  const keep=x=>{x.__was=B().autoLabel(x,{name:c.short,place:c.place});};
  if(k==='go'||k==='arrive')row().append(el(c,'span',k==='arrive'?'Fly to':'Go to','me-small'),kit.placeSelect(o.place,v=>eo(x=>{keep(x);x.place=v;relabel(x);}),k==='arrive'?'Place to fly to':'Place to go to',k==='arrive',{'data-me-step-place':o.id}));
  else if(k==='enter'||k==='leave')row().append(el(c,'span',k==='enter'?'Go into':'Leave','me-small'),kit.regionSelect(o.place,v=>eo(x=>{keep(x);x.place=v;relabel(x);}),k==='enter'?'Place to enter':'Place to leave',{'data-me-step-place':o.id}));
  else if(k==='buy')row().append(el(c,'span','Buy','me-small'),kit.itemSelect(o.item,v=>eo(x=>{x.item=v;}),{'data-me-step-item':o.id}));
  else if(k==='deliver')row().append(el(c,'span','Deliver to','me-small'),kit.npcSelect(o.npc,v=>eo(x=>{keep(x);x.npc=v;relabel(x);}),{label:'Who it is delivered to',attrs:{'data-me-step-npc':o.id}}),el(c,'span','(done when the player talks to them)','me-small'));
  else if(k==='photo'||k==='send-photo'){const r=row();const people=Array.isArray(o.subjects)&&o.subjects.length?o.subjects:[k==='photo'?o.npc:o.subject].filter(Boolean),key=k==='photo'?'npc':'subject';
   if(k==='send-photo')r.append(el(c,'span','Send to','me-small'),kit.npcSelect(o.npc,v=>eo(x=>{keep(x);x.npc=v;relabel(x);}),{label:'Who the photo is sent to',attrs:{'data-me-step-npc':o.id}}));
   r.append(el(c,'span',k==='photo'?'Photograph':'showing','me-small'),kit.subjectsPicker(people,v=>eo(x=>{keep(x);x[key]=v[0]||'';if(v.length>1)x.subjects=v.slice();else delete x.subjects;relabel(x);}),'Who is photographed',{'data-me-step-subject':o.id}));}
  else if(kit.EX()&&kit.EX().IDS.includes(k)){row().append(el(c,'span','With','me-small'),kit.escortWho(o,eo));out.push(kit.escortPanel(m,o,eo));}
  else if(k==='anim'){const r=row();r.append(kit.npcSelect(o.npc,v=>eo(x=>{x.npc=v;const A=kit.NGS();if(x.clip&&A&&A.problem(v,x.clip,{plan:((kit.local().npcs)||{})[v]||null}))delete x.clip;}),{label:'Who plays the animation',attrs:{'data-me-step-npc':o.id}}));
   if(o.npc){const {sel,r:rr}=kit.animPick(o.npc,o.clip,v=>eo(x=>{if(v)x.clip=v;else delete x.clip;}),{'data-me-step-clip':o.id},'— choose the animation —');r.append(el(c,'span','plays','me-small'),sel);if(!rr.ok)r.append(el(c,'span',rr.why,'me-warn'));}
   row().append(kit.numBox('then the mission waits',Number.isInteger(o.hold)?o.hold:3,0,30,v=>eo(x=>{x.hold=v==null?3:v;},false),{'data-me-step-hold':o.id}),el(c,'span','seconds','me-small'));}
  else if(k==='wait'){const r=row(),words_=el(c,'span',kit.waitWords(o),'me-small',{'data-me-wait-words':o.id});
   r.append(kit.numBox('Wait',Number.isInteger(o.hold)?o.hold:10,1,600,v=>eo(x=>{x.hold=v||10;words_.textContent=kit.waitWords(x);},false),{'data-me-step-hold':o.id}),el(c,'span','seconds','me-small'));
   const r2=row();r2.append(kit.numBox('only while the player stays within (feet)',Number.isInteger(o.near)?VoidUnits.ft(o.near):'',...VoidUnits.ftRange(1,50),v=>eo(x=>{if(v)x.near=VoidUnits.m(v,o.near,{min:1,max:50,whole:true});else delete x.near;words_.textContent=kit.waitWords(x);},false),{'data-me-step-near':o.id},'—'),el(c,'span','ft of','me-small'),
    kit.npcSelect(o.npc,v=>eo(x=>{x.npc=v;}),{label:'Who the player stays near',empty:'— anyone / anywhere —',attrs:{'data-me-step-npc':o.id}}));out.push(words_);}
  else if(k==='apt-enter'||k==='apt-use'){row().append(...kit.placeRow(m,o,eo));   // the place by its real name; the words follow it (mission-editor.js placeRow)
   if(!(m.apartments||[]).length)out.push(hint(c,'Add a Location block above this one first (+ ADD A BLOCK › Location).'));}
  else if(k==='hack')row().append(...kit.hackRow(m,o,eo));
  else if(k==='zone'&&root.VoidZoneEditor)out.push(...root.VoidZoneEditor.stepFields(m,o,eo));
  else if(k==='ask')out.push(...askFields({t:c.t,m,o,eo,kit}));
  else if(k==='pod-exit')out.push(el(c,'p','Done when the player leaves their Sleeping Pod (EXIT POD).','me-small'));
  else if(k==='message')out.push(el(c,'p',m.start&&m.start.how==='notification'?'Done as the mission’s notification reaches the device.':'Needs the mission to start by notification (How this mission starts, above).',m.start&&m.start.how==='notification'?'me-small':'me-warn'));
  else if(k==='await-call')out.push(el(c,'p','Done by itself right after the block above; the call itself comes from a later mission.','me-small'));
  const note=(kit.G().STEP_KINDS.find(x=>x.id===k)||{}).note||kit.HELP_STEP[k];if(note&&k!=='ask')out.push(hint(c,note));return out;}
 /* ACCEPT / DENY in the middle of a mission (mission-content.js ASK_STEP): the same fields in its block and in the Form view's step. */
 const ASK_HELP={end:'The mission ends now and goes back to its giver, who can offer it again.',skip:'The mission jumps ahead to the block you choose; the blocks in between are skipped (they give nothing).',back:'The mission goes back to the block you choose; the player does those blocks again.',tree:'This mission ends and the first mission of the tree you choose starts.',continue:'Nothing else: the mission just goes on to the next block (no credits, and not the lines after ACCEPT).'};
 function askFields({t,m,o,eo,kit}){const el_=kit.el,out=[],d=o.deny||'end',ids=(m.objectives||[]).map(x=>x.id),i=ids.indexOf(o.id);
  const q=el_('label','','me-field mb-question');q.append(el_('span','The question (your words)'));const ta=el_('textarea','','',{rows:'2',maxlength:'300','aria-label':'The question the player answers','data-me-step-question':o.id,placeholder:'e.g. Will you take the package across town?'});ta.value=o.question||'';
  ta.oninput=()=>{eo(x=>{x.question=ta.value.slice(0,300);},false);kit.guideSoon();};q.append(ta,kit.hint('The window shows it with two buttons; the mission waits until the player answers. Voice tags like [whispers] are allowed (only ElevenLabs voices use them).'));out.push(q);
  const r1=el_('div','','me-row');r1.append(el_('span','Asked by','me-small'),kit.npcSelect(o.npc||'',v=>eo(x=>{if(v)x.npc=v;else x.npc='';}),{label:'Who asks',empty:'(the giver)',attrs:{'data-mb-ask-npc':o.id}}));
  const lab=(k,ph)=>{const inp=el_('input','','',{'aria-label':ph+' button label',['data-mb-ask-'+k]:o.id,maxlength:'20',size:'10',placeholder:ph});inp.value=o[k]||'';inp.oninput=()=>eo(x=>{const v=inp.value.slice(0,20);if(v.trim())x[k]=v;else delete x[k];},false);return inp;};
  r1.append(el_('span','· buttons','me-small'),lab('yes','ACCEPT'),lab('no','DENY'));out.push(r1);
  const r2=el_('div','','me-row'),dn=el_('select','','',{'aria-label':'What happens on DENY','data-mb-ask-deny':o.id});for(const [v,n] of [['end','End the mission'],['skip','Skip ahead to a later block'],['back','Go back to an earlier block'],['tree','Start another tree'],['continue','Just go on']])dn.append(new Option(n,v));dn.value=d;
  dn.onchange=()=>eo(x=>{x.deny=dn.value;if(dn.value==='end')delete x.deny;if(dn.value!=='skip'&&dn.value!=='back')delete x.goto;else if(x.goto&&!((dn.value==='skip'&&ids.indexOf(x.goto)>i)||(dn.value==='back'&&ids.indexOf(x.goto)>=0&&ids.indexOf(x.goto)<i)))delete x.goto;if(dn.value!=='tree')delete x.denyStart;});
  r2.append(el_('b','On DENY'),dn);
  if(d==='skip'||d==='back'){const gs=el_('select','','',{'aria-label':d==='skip'?'Skip to':'Go back to','data-me-step-goto':o.id});gs.append(new Option(d==='skip'?'— skip to which block? —':'— back to which block? —',''));
   (m.objectives||[]).forEach((x,k)=>{if(d==='skip'?k>i+1:k<i)gs.append(new Option('step '+(k+1)+': '+String(x.label||x.kind).slice(0,40),x.id));});gs.value=o.goto||'';gs.onchange=()=>eo(x=>{if(gs.value)x.goto=gs.value;else delete x.goto;});r2.append(gs);
   if(d==='skip'&&!(m.objectives||[]).some((x,k)=>k>i+1))r2.append(el_('span','Add the block to skip to below the one after this first.','me-small me-warn'));if(d==='back'&&i<1)r2.append(el_('span','There is no block above this one to go back to.','me-small me-warn'));}
  if(d==='tree'){const ms=el_('select','','',{'aria-label':'Tree started on DENY','data-me-step-deny-start':o.id});ms.append(new Option('— choose a tree —',''));for(const tt of kit.local().trees||[])if(tt.id!==(t&&t.id)&&tt.missions&&tt.missions[0])ms.append(new Option(kit.numLabel(tt.missions[0].number,tt.missions[0].title||tt.missions[0].id)+' (first of '+(tt.name||tt.id)+')',tt.missions[0].id));
   ms.value=o.denyStart||'';ms.onchange=()=>eo(x=>{if(ms.value)x.denyStart=ms.value;else delete x.denyStart;});r2.append(ms);}
  out.push(r2,kit.hint(ASK_HELP[d]));
  const r3=el_('div','','me-row');r3.append(kit.numBox('ACCEPT costs',Number.isInteger(o.price)?o.price:'',1,100000,v=>eo(x=>{if(v){x.price=v;delete x.gain;}else delete x.price;},false),{'data-mb-ask-price':o.id},'free'),el_('span','CR (optional; charged once, never below 0: with too few credits ACCEPT is greyed)','me-small'));out.push(r3);
  const r4=el_('div','','me-row');r4.append(kit.numBox('or ACCEPT gives',Number.isInteger(o.gain)?o.gain:'',1,100000,v=>eo(x=>{if(v){x.gain=v;delete x.price;}else delete x.gain;},false),{'data-mb-ask-gain':o.id},'nothing'),el_('span','CR to the player (optional; given once)','me-small'));out.push(r4);
  return out;}
 /* A PLAYER REPLY AS A CHOICE (mission-content.js CHOICE; the owner, 19 Nov 2026: "in player reply add the accept or deny option, credit changes if accepted"): the same
    fields in the Blocks view (a blue Player reply block) and the Form view (a player line). set(fn, redraw): one change of this line; ref: the line's key; i: the index of its
    step (-1: the offer); after(branch): the editor of the lines said next ('yesSay' / 'noSay'). Guide me: data-me-line-choice-goto / -tree. */
 const CHOICE_HELP={end:'The mission ends now and goes back to its giver, who can offer it again.',skip:'The mission jumps ahead to the block you choose; the blocks in between give nothing.',back:'The mission goes back to the block you choose (it can be this one): the player does them again.',tree:'This mission ends and the first mission of the tree you choose starts.',continue:'The conversation just goes on with the lines after this reply (no credits).'};
 function choiceFields({t,m,line,ref,i,set,kit,after}){const el_=kit.el,out=el_('div','','mb-choice',{'data-mb-choice':ref}),c=line.choice&&typeof line.choice==='object'?line.choice:null;
  const on=el_('label','','mb-choice-on'),cb=el_('input','','',{type:'checkbox','data-mb-choice-on':ref});cb.checked=!!c;cb.onchange=()=>set(l=>{if(cb.checked)l.choice=l.choice&&typeof l.choice==='object'?l.choice:{};else delete l.choice;});
  on.append(cb,el_('b',' Make this a choice: '+((c&&c.yes)||'ACCEPT')+' / '+((c&&c.no)||'DENY')));out.append(on);
  if(!c){out.append(kit.hint('Tick it and this reply becomes two buttons for the player (your words, default ACCEPT / DENY). The conversation waits until they press one, then goes on. You can give or take credits on ACCEPT and choose what DENY does.'));return out;}
  const lab=(k,ph)=>{const inp=el_('input','','',{'aria-label':ph+' button words',['data-mb-choice-'+k]:ref,maxlength:'20',size:'10',placeholder:ph});inp.value=c[k]||'';inp.oninput=()=>set(l=>{const v=inp.value.slice(0,20);if(v.trim())l.choice[k]=v;else delete l.choice[k];},false);return inp;};
  const r1=el_('div','','me-row');r1.append(el_('span','Buttons','me-small'),lab('yes','ACCEPT'),lab('no','DENY'),el_('span','(empty: ACCEPT / DENY)','me-small'));out.append(r1);
  const nl=el_('label','','me-field');nl.append(el_('span','Your reply when they press '+(c.no||'DENY')+' (optional)'));const nt=el_('textarea','','',{rows:'2',maxlength:'500','aria-label':'The player’s reply on DENY','data-mb-choice-notext':ref,placeholder:'(optional: what the player says when they press '+(c.no||'DENY')+')'});nt.value=c.noText||'';
  nt.oninput=()=>set(l=>{const v=nt.value.slice(0,500);if(v.trim())l.choice.noText=v;else delete l.choice.noText;},false);nl.append(nt);out.append(nl);
  // Credits if accepted: one signed number (+ gets, - pays), the MONEY rules
  const cr=Number.isInteger(c.credits)?c.credits:0,way=cr>0?'gets':cr<0?'pays':'none',r2=el_('div','','me-row mb-choice-credits');const ws=el_('select','','',{'aria-label':'Credits if accepted','data-mb-choice-way':ref});
  for(const [v,n] of [['none','No credits'],['gets','Player gets'],['pays','Player pays']])ws.append(new Option(n,v));ws.value=way;
  ws.onchange=()=>set(l=>{const a=Math.abs(Number(l.choice.credits)||0)||100;if(ws.value==='none')delete l.choice.credits;else l.choice.credits=ws.value==='pays'?-a:a;});
  r2.append(el_('b','Credits if accepted'),ws);if(way!=='none')r2.append(kit.numBox('Amount',Math.abs(cr),1,100000,v=>set(l=>{const a=v||1;l.choice.credits=(Number(l.choice.credits)<0?-1:1)*a;},false),{'data-mb-choice-credits':ref}),el_('span','CR','me-small'));out.append(r2);
  out.append(kit.hint(way==='pays'?'Taken once when the player presses '+(c.yes||'ACCEPT')+', never below 0: with too few credits the button is greyed (“YOU NEED N CR”).':way==='gets'?'Given once when the player presses '+(c.yes||'ACCEPT')+' (never twice, even after a reload).':'Nothing is given or taken. Choose Player gets or Player pays to change the player’s credits on '+(c.yes||'ACCEPT')+'.'));
  // What DENY does
  const d=c.deny||'end',r3=el_('div','','me-row'),dn=el_('select','','',{'aria-label':'What happens on DENY','data-mb-choice-deny':ref});
  for(const [v,n] of [['end','End the mission'],['skip','Skip ahead to a later block'],['back','Go back to a block'],['tree','Start another tree'],['continue','Just continue the conversation']])dn.append(new Option(n,v));dn.value=d;
  dn.onchange=()=>set(l=>{const v=dn.value;if(v==='end')delete l.choice.deny;else l.choice.deny=v;delete l.choice.goto;if(v!=='tree')delete l.choice.denyStart;});
  r3.append(el_('b','On '+(c.no||'DENY')),dn);
  if(d==='skip'||d==='back'){const gs=el_('select','','',{'aria-label':d==='skip'?'Skip to':'Go back to','data-mb-choice-goto':ref,'data-me-line-choice-goto':ref});gs.append(new Option(d==='skip'?'— skip to which block? —':'— back to which block? —',''));
   (m.objectives||[]).forEach((x,k)=>{if(x&&(d==='skip'?k>i:k<=i))gs.append(new Option('step '+(k+1)+': '+String(x.label||x.kind).slice(0,40),x.id));});gs.value=c.goto||'';gs.onchange=()=>set(l=>{if(gs.value)l.choice.goto=gs.value;else delete l.choice.goto;});r3.append(gs);
   if(d==='skip'&&!(m.objectives||[]).some((x,k)=>k>i))r3.append(el_('span','Add the block to skip to below this one first.','me-small me-warn'));if(d==='back'&&i<0)r3.append(el_('span','The offer has no block above it to go back to.','me-small me-warn'));}
  if(d==='tree'){const ms=el_('select','','',{'aria-label':'Tree started on DENY','data-mb-choice-tree':ref,'data-me-line-choice-tree':ref});ms.append(new Option('— choose a tree —',''));for(const tt of kit.local().trees||[])if(tt.id!==(t&&t.id)&&tt.missions&&tt.missions[0])ms.append(new Option(kit.numLabel(tt.missions[0].number,tt.missions[0].title||tt.missions[0].id)+' (first of '+(tt.name||tt.id)+')',tt.missions[0].id));
   ms.value=c.denyStart||'';ms.onchange=()=>set(l=>{if(ms.value)l.choice.denyStart=ms.value;else delete l.choice.denyStart;});r3.append(ms);}
  out.append(r3,kit.hint(CHOICE_HELP[d]+' The lines after this reply are said after '+(c.yes||'ACCEPT')+(d==='continue'?' and after '+(c.no||'DENY'):'')+'.'));
  if(after)out.append(after('yesSay'),after('noSay'));return out;}
 function delayRow(c,o,eo){const {kit}=c,box=mini(c,'time',undefined,'');const words_=el(c,'span',o.delay>0?'Starts '+kit.secWords(o.delay)+' after the block above is done.':'Starts as soon as the block above is done.','me-small');
  const r=el(c,'div','','me-row');r.append(kit.numBox('Wait before this block',o.delay||0,0,600,v=>{eo(x=>{if(v)x.delay=v;else delete x.delay;},false);words_.textContent=v?'Starts '+kit.secWords(v)+' after the block above is done.':'Starts as soon as the block above is done.';},{'data-me-step-delay':o.id}),el(c,'span','s ·','me-small'),words_);box.body.append(r);return box;}
 /* A small nested block (Time / Item notes inside a block). */
 function mini(c,type,who,text){const f=frame(c,{type,who:who===undefined?undefined:who,title:text,nested:true});return f;}
 function labelBox(c,value,on,ph,attr,id){const l=el(c,'label','','me-field mb-label');l.append(el(c,'span','What the V1 Mission Log says'));const inp=el(c,'input','','',{placeholder:ph,maxlength:'500',[attr]:id||c.m.id});inp.value=value;inp.oninput=()=>{on(inp.value);c.kit.guideSoon();};l.append(inp);return l;}
 // ---- WORDS: a line set, nested by who says each line (a player line is a blue block inside; another character's lines are their own colour)
 /* key: 'offer', 'ending', '<step>/<set>', and for the lines after a player's choice '<…>/<line index>/yesSay' or '…/noSay' (mission-content.js CHOICE). */
 const linesAt=(x,key)=>{const p=String(key).split('/');let L;if(p[0]==='offer'){L=(x.offer=x.offer||[]);p.splice(0,1);}else if(p[0]==='ending'){x.ending=x.ending||{npc:'',place:'',label:'',say:[]};L=(x.ending.say=x.ending.say||[]);p.splice(0,1);}
  else{const o=(x.objectives||[]).find(y=>y.id===p[0]);if(!o)return null;if(!Array.isArray(o[p[1]]))o[p[1]]=[];L=o[p[1]];p.splice(0,2);}
  if(p.length===2){const l=L[Number(p[0])];if(!l||!l.choice||typeof l.choice!=='object'||!['yesSay','noSay'].includes(p[1]))return null;if(!Array.isArray(l.choice[p[1]]))l.choice[p[1]]=[];return l.choice[p[1]];}return L;};
 function words(c,key,lines,defWho,opt={}){const {kit}=c,box=el(c,'div','','mb-words',{'data-mb-lines':key,'data-me-lines':key});box.append(el(c,'h5',opt.title||'What is said','mb-words-title'));
  const groups=B().lineGroups(lines,defWho||'');
  for(const g of groups){const speaker=g.who||defWho||'',own=!g.lines[0].line.who||g.who===defWho;
   const holder=own&&!B().isPlayer(speaker)?box:(()=>{const f=frame(c,{type:'who',who:B().isPlayer(speaker)?'You':speaker||null,title:B().isPlayer(speaker)?'The player says':c.short(speaker)+' says',nested:true,attrs:{'data-mb-who-group':key+'/'+g.k0}});box.append(f);return f.body;})();
   for(const {line,k} of g.lines)holder.append(wordsBlock(c,key,line,k,lines.length,defWho,opt));}
  const full=lines.length>=12,add=(who,what)=>change(c,x=>{const L=linesAt(x,key);if(!L)return 'That part is gone.';if(L.length>=12)return '12 lines at most here.';L.push({who,text:''});return '';},{note:what});
  const r=el(c,'div','','me-row mb-add-lines');
  r.append(btn(c,'+ WORDS'+(defWho?' FOR '+c.short(defWho).toUpperCase():''),()=>add('','New line: type it in the new box.'),'mb-add-w',{'data-mb-add-line':key,'data-me-add-npc-line':key,...(full?{disabled:''}:{})}));
  if(opt.player!==false)r.append(btn(c,'+ PLAYER REPLY',()=>add('You','New player line (blue): type what the player says.'),'mb-add-p',{'data-mb-add-player':key,'data-me-add-player-line':key,...(full?{disabled:''}:{})}));
  if(opt.player!==false){const other=kit.npcSelect('',v=>{if(v)add(v,'New line for '+c.short(v)+'.');},{label:'Another character says',empty:'+ another character says…',attrs:{'data-mb-add-other':key}});if(full)other.disabled=true;r.append(other);}
  box.append(r);if(opt.player===false)box.append(hint(c,'A message or a call comes from one character: no player lines here.'));return box;}
 function wordsBlock(c,key,l,k,n,defWho,opt){const {kit,m}=c,you=B().isPlayer(l.who),who=you?'You':l.who||defWho||'',ref=key+'/'+k,ch=you&&opt.choice&&l.choice&&typeof l.choice==='object'?l.choice:null;
  const f=frame(c,{type:ch?'ask':'words',who:you?'You':who||null,title:ch?'The player chooses '+(ch.yes||'ACCEPT')+' or '+(ch.no||'DENY'):'',nested:true,attrs:{'data-mb-line':ref,'data-me-tline':ref,'data-me-line-who':you?'player':'npc'}});
  const ta=el(c,'textarea','','',{rows:'2',maxlength:'500','aria-label':ch?'The player’s reply when they press '+(ch.yes||'ACCEPT'):you?'What the player says':'What '+c.short(who)+' says',placeholder:ch?'(optional: what the player says when they press '+(ch.yes||'ACCEPT')+')':you?'(what the player says back)':'(what '+c.short(who)+' says; empty: a placeholder)'});ta.value=l.text||'';
  ta.oninput=()=>{change(c,x=>{const L=linesAt(x,key);if(L&&L[k])L[k].text=ta.value.slice(0,500);return '';},{redraw:false});};
  f.titleEl.append(btn(c,'↑',()=>change(c,x=>{const L=linesAt(x,key);if(L&&k>0)[L[k-1],L[k]]=[L[k],L[k-1]];}),'',{'aria-label':'Move line up',...(k?{}:{disabled:''})}),btn(c,'↓',()=>change(c,x=>{const L=linesAt(x,key);if(L&&k<L.length-1)[L[k+1],L[k]]=[L[k],L[k+1]];}),'',{'aria-label':'Move line down',...(k<n-1?{}:{disabled:''})}),
   btn(c,'×',()=>{if(change(c,x=>{const L=linesAt(x,key);if(L)L.splice(k,1);},{redraw:false})){lastNote={mid:m.id,text:'Line deleted.',undo:true};kit.draw();}},'me-x',{'aria-label':'Delete line','data-mb-del-line':ref}));
  if(ch)f.body.append(el(c,'span','Your reply when they press '+(ch.yes||'ACCEPT')+' (optional):','me-small'));f.body.append(ta);
  // A player reply as a choice: ACCEPT / DENY buttons, credits if accepted, what DENY does, what is said after each (choiceFields; not inside those follow-up lines)
  if(you&&opt.choice&&!opt.nested){const ys=(l.choice&&l.choice.yes)||'ACCEPT',ns=(l.choice&&l.choice.no)||'DENY';
   f.body.append(choiceFields({t:c.t,m,line:l,ref,i:key==='offer'?-1:(m.objectives||[]).findIndex(o=>o&&o.id===key.split('/')[0]),kit,
    set:(fn,redraw=true)=>change(c,x=>{const L=linesAt(x,key);if(L&&L[k])fn(L[k]);return '';},{redraw}),
    after:b=>words(c,ref+'/'+b,(l.choice&&l.choice[b])||[],defWho,{title:b==='yesSay'?'After '+ys+', said next (optional)':'After '+ns+', said next (optional)',player:true,anim:true,nested:true})}));}
  if(!you&&who&&opt.anim!==false&&kit.giver(who)){const act=frame(c,{type:'action',who,title:'While saying this, '+c.short(who)+' does',nested:true,attrs:{'data-mb-line-anim':ref,'data-me-line-anim':ref}});const {sel,r}=kit.animPick(who,l.anim,v=>change(c,x=>{const L=linesAt(x,key);if(!L||!L[k])return;if(v)L[k].anim=v;else{delete L[k].anim;delete L[k].animFor;}}),{'data-me-line-anim-pick':ref});act.body.append(sel);if(!r.ok)act.body.append(el(c,'span',r.why,'me-small me-muted'));f.body.append(act);}
  {const d=el(c,'details','','mb-time',{'data-me-line-time':ref}),sm=el(c,'summary',kit.lineTimeWords(l));d.open=!!(l.wait||l.show);d.append(sm);const cur={...l};
   const put=(fld,v)=>{if(v==null||(!v&&fld!=='wait'))delete cur[fld];else cur[fld]=v;if(fld==='wait'&&!v)delete cur.wait;sm.textContent=kit.lineTimeWords(cur);change(c,x=>{const L=linesAt(x,key);if(!L||!L[k])return;if(cur[fld]==null)delete L[k][fld];else L[k][fld]=cur[fld];},{redraw:false});};
   d.append(kit.numBox('Wait before this line',l.wait||0,0,60,v=>put('wait',v),{'data-me-line-wait':ref}),el(c,'span','s','me-small'),kit.numBox('· show for',l.show||'',1,60,v=>put('show',v),{'data-me-line-show':ref},'—'),el(c,'span','s then go on by itself','me-small'));f.body.append(d);}
  if(!you&&who&&kit.giver(who)&&key!=='deny'){const ik=key==='offer'||key==='ending'?key:key;const ib=kit.importBox('tree:'+m.id+'/'+ik+'/'+k,who,()=>ta.value);f.body.append(ib);ta.addEventListener('input',()=>ib.refresh());}
  return f;}
 // ---- APARTMENT and ITEM (reward) blocks
 function aptBlock(c,b){const {m,kit}=c,a=b.raw||{},X=root.VoidApartments,ea=(fn,redraw=true)=>c.ed(x=>{const y=(x.apartments||[]).find(z=>z.id===a.id);if(y)fn(y,x);},redraw);
  const loc=Array.isArray(a.modules);const f=frame(c,{bid:b.bid,type:'apartment',title:(loc?'Location ':'Apartment ')+a.id+(a.door&&X?' · '+((X.door(a.door)||{}).name||a.door):''),attrs:{'data-me-apt-panel':m.id,'data-me-apt':a.id}});if(!X||(kit.aptReady&&!kit.aptReady())){f.body.append(el(c,'p','Loading the street doors…','me-small',{'data-me-apt-loading':m.id}));if(kit.aptEnsure)kit.aptEnsure().then(ok=>{if(ok)kit.draw();});return f;}
  if(loc){if(root.VoidModuleEditor)f.body.append(root.VoidModuleEditor.card({m,a,k:(m.apartments||[]).indexOf(a),ed:(fn,redraw)=>c.ed(fn,redraw!==false),doorSelect:kit.doorSelect,jump:inside=>kit.jumpApt(m,a,inside)}));f.body.append(hint(c,'Open for the player from the block above it (or from the start) until the mission ends.'));return f;}
  const r=el(c,'div','','me-row mb-fields'),st=el(c,'select','','',{'aria-label':'Apartment style','data-me-apt-style':a.id});for(const s of X.STYLES)st.append(new Option(s.name,s.id));st.value=a.style||'normal';
  st.onchange=()=>ea(y=>{y.style=st.value;if(!X.AD_SCREEN.styles.includes(y.style))delete y.screenOff;const dd=X.door(y.door);if(dd&&(dd.family==='container')!==!!X.isContainer(y.style))y.door='';});
  r.append(el(c,'span','A','me-small'),st,el(c,'span','behind','me-small'),kit.doorSelect(a.door,v=>ea(y=>{y.door=v;}),{'data-me-apt-door':a.id},null,a.style||'normal',{key:m.id+'/'+a.id,used:root.VoidModuleEditor?root.VoidModuleEditor.usedDoors(m,a):{}}));f.body.append(r);
  const r2=el(c,'div','','me-row');const lk=el(c,'label','','me-small'),lki=el(c,'input','','',{type:'checkbox','data-me-apt-locked':a.id});lki.checked=a.locked===true;lki.onchange=()=>ea(y=>{if(lki.checked)y.locked=true;else delete y.locked;},false);lk.append(lki,document.createTextNode(' locked until the player hacks its access point'));
  r2.append(lk,kit.numBox('· number on its hallway door',a.number||'',1,9999,v=>ea(y=>{if(v)y.number=v;else delete y.number;},false),{'data-me-apt-number':a.id},'(own)'));f.body.append(r2);
  const r3=el(c,'div','','me-row');r3.append(btn(c,'JUMP TO THE DOOR',()=>kit.jumpApt(m,a,false),'',{...(a.door?{}:{disabled:''})}),btn(c,'JUMP INSIDE',()=>kit.jumpApt(m,a,true),'',{...(a.door?{}:{disabled:''})}));f.body.append(r3);
  f.body.append(hint(c,'Open for the player from the block above it (or from the start) until the mission ends. The map, the lights and the screen: Form view.'));return f;}
 function unlockBlock(c,b){const {m,kit}=c,u=b.raw||{},i=b.idx,eu=(fn,redraw=true)=>c.ed(x=>{const y=(x.unlocks||[])[i];if(y)fn(y,x);},redraw),UK=(kit.G().UNLOCK_KINDS.find(k=>k.id===u.kind)||{});
  const npcish=['contact','follow','reputation'].includes(u.kind)&&u.id&&kit.giver(u.id),bl=B().toBlocks(m).blocks,k=bl.findIndex(x=>x.bid===b.bid),above=bl.slice(0,k).reverse().find(x=>x.type==='step'||x.type==='end');
  const f=frame(c,{bid:b.bid,type:'item',who:npcish?u.id:undefined,title:(UK.name||u.kind)+': '+unlockText(c,u)});const r=el(c,'div','','me-row mb-fields');
  if(u.kind==='credits')r.append(kit.numBox('The player gets',u.amount||'',1,100000,v=>eu(y=>{y.amount=v||1;},false),{'data-mb-unlock-amount':String(i)}),el(c,'span','credits','me-small'));
  else if(u.kind==='reputation'){r.append(kit.npcSelect(u.id,v=>eu(y=>{y.id=v;}),{label:'Standing with',attrs:{'data-mb-unlock-id':String(i)}}),kit.numBox('changes by',u.amount||'',-100,100,v=>eu(y=>{y.amount=v||1;},false),{'data-mb-unlock-amount':String(i)}));}
  else if(u.kind==='missiles'){const sel=el(c,'select','','',{'aria-label':'Which missile','data-mb-unlock-id':String(i)});for(const [id,x] of Object.entries(root.VoidOrdnance?.TYPES||{m1:{title:'M1'},m2:{title:'M2'}}))sel.append(new Option(x.title,id));sel.value=u.id||'m1';sel.onchange=()=>eu(y=>{y.id=sel.value;});r.append(kit.numBox('The player gets',u.amount||'',1,30,v=>eu(y=>{y.amount=v||1;},false),{'data-mb-unlock-amount':String(i)}),sel,el(c,'span','missiles (only what fits the rack is kept)','me-small'));}
  else if(u.kind==='contact'||u.kind==='follow')r.append(kit.npcSelect(u.id,v=>eu(y=>{y.id=v;}),{label:'Who',attrs:{'data-mb-unlock-id':String(i)}}));
  else if(u.kind==='flag'){const inp=el(c,'input','','',{'aria-label':'Story flag name',placeholder:'flag name (letters, digits, - _)',maxlength:'48','data-mb-unlock-id':String(i)});inp.value=u.id||'';inp.oninput=()=>eu(y=>{y.id=inp.value.trim();},false);r.append(el(c,'span','Story flag mf_','me-small'),inp,el(c,'span','= true','me-small'));}
  else{const list=u.kind==='ship'?Object.fromEntries(Object.entries(root.VoidShips?.ships||{}).filter(([,s])=>!s.premium).map(([id,s])=>[id,s.name])):u.kind==='location'?(kit.refs&&kit.refs.locations)||{}:u.kind==='tree'?Object.fromEntries((kit.local().trees||[]).filter(x=>x.id!==(c.t&&c.t.id)).map(x=>[x.id,x.name||x.id])):null;
   if(list){const sel=el(c,'select','','',{'aria-label':'Which','data-mb-unlock-id':String(i)});sel.append(new Option('— choose —',''));for(const [id,n] of Object.entries(list))sel.append(new Option(n,id));sel.value=u.id||'';sel.onchange=()=>eu(y=>{y.id=sel.value;});r.append(sel);}else r.append(el(c,'span','Change it in the Form view (What becomes available).','me-small'));}
  f.body.append(r,hint(c,!above?'':above.type==='end'?'Given when the mission is done (it is below END).':'Given when the block above it is done: “'+String(above.raw.label||above.raw.kind).slice(0,50)+'”. Drag it to give it at another point.'));
  if(UK.supported===false)f.body.append(el(c,'p','Needs a code change: the game cannot give this yet.','me-small me-warn'));return f;}
 function unlockText(c,u){return u.kind==='credits'?'+'+(u.amount||0)+' credits':u.kind==='ship'?((root.VoidShips?.ships?.[u.id]||{}).name||u.id||'…'):u.kind==='reputation'?c.short(u.id)+' '+(u.amount>0?'+':'')+(u.amount||0):u.kind==='contact'?c.short(u.id)+' added to contacts':u.kind==='follow'?'follow '+c.short(u.id):u.kind==='flag'?'mf_'+(u.id||'…'):u.kind==='location'?c.place(u.id)||'…':u.kind==='tree'?(((c.kit.local().trees||[]).find(x=>x.id===u.id)||{}).name||u.id||'…'):u.kind==='missiles'?(u.amount||0)+' × '+(((root.VoidOrdnance?.TYPES||{})[u.id]||{}).name||u.id||'…'):u.id||'';}
 /* "Edit in Form view": switches this mission to the Form view and scrolls to that step. */
 function formAt(c,stepId){over[c.m.id]='form';c.kit.draw();setTimeout(()=>{const n=document.querySelector('[data-me-tree-mission="'+CSS.escape(c.m.id)+'"] [data-me-tstep="'+CSS.escape(stepId)+'"]');try{n?.scrollIntoView({block:'center'});}catch{}},0);}
 root.VoidMissionBlocksView={on,set,openBlocks,toggle,view,askFields,choiceFields,VIEW_KEY,get picking(){return pick;},collapsed,opened};
})(globalThis);
