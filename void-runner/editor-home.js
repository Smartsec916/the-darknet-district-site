/* DEVELOPER TOOLS > START (the owner, 18 Nov 2026, queue item 0: a beginner-first Developer tools for someone who has never made a game). Browser only; loaded on
   demand with the Mission Editor's scripts (dev-tools.js editorScripts), after editor-wizard.js (the pure rules) and the two editors.
   - The welcome screen: four big task cards (Make a mission, Place a character, Test my mission, Publish) and every other tool one click away.
   - "Make a mission": one question per page with BACK / NEXT and a progress bar; it makes an ordinary draft mission (editor-wizard.js build) through the Mission
     Editor's own draft (shared.addWizardMission), so Guide me, help text, PLAY THIS DRAFT, publishing and the server's checks are the same as for a hand-made one.
   - "Test my mission": each of your missions, ready (PLAY) or what is still missing (OPEN TO FIX).
   - UNDO / REDO for every saved edit in the editors this session (mission-editor.js saveLocal / saveStudio report each save here), also Ctrl+Z / Ctrl+Shift+Z.
   - Basic mode (default): rarely used settings, internal names (ids) and technical options are hidden in the Mission Editor and the NPCs tab (marked "adv-only" after
     each draw; CSS hides them under #dev-balance.dev-basic). Advanced shows everything (dev-tools.js setMode).
   - A short tour (7 stops, skippable, replayed with the "?" button) pointing at the real controls; shown once by itself on the first visit. */
(function(root){
 'use strict';
 const W=()=>root.VoidEditorWizard,ME=()=>root.VoidMissionEditor,S=()=>root.VoidMissionEditor&&root.VoidMissionEditor.shared,G=()=>root.VoidMissionGivers;
 const DTX=()=>typeof VoidDevTools!=='undefined'?VoidDevTools:null,panel=()=>typeof devPanel!=='undefined'?devPanel:document.getElementById('dev-balance');
 const el=(tag,text,cls,attrs)=>{const e=document.createElement(tag);if(text!==undefined&&text!==null)e.textContent=text;if(cls)e.className=cls;for(const [k,v] of Object.entries(attrs||{}))e.setAttribute(k,v);return e;};
 const btn=(text,fn,cls,attrs)=>{const b=el('button',text,cls,{type:'button',...(attrs||{})});b.onclick=e=>{e.preventDefault();fn(e);};return b;};
 const icon=(name,size=20)=>{const s=el('span','','eh-ic');s.innerHTML=DTX()?DTX().icon(name,size):'';return s;};
 const iconBtn=(name,text,fn,cls,attrs)=>{const b=btn('',fn,cls,attrs);b.append(icon(name,16),document.createTextNode(' '+text));return b;};
 const store={get(k){try{return root.localStorage.getItem(k);}catch{return null;}},set(k,v){try{root.localStorage.setItem(k,v);}catch{}}};
 let host=null,headNode=null,toastT=0;
 const ui={view:'home',a:null,page:0,tried:false,made:null,note:''};
 const undo=W().createUndo();
 // ---------------------------------------------------------------- helpers over the Mission Editor's data
 const givers=()=>(S()&&S().givers)||[];
 const nameOf=id=>(givers().find(g=>g.id===id)||{}).name||id;
 const placeName=id=>((G().PLACE.get(id)||{}).name)||id;
 const talkers=()=>givers().filter(g=>g.canTalk&&g.draft);
 const walkPlaces=()=>G().PLACES.filter(p=>!p.location);
 const subjects=()=>G().photoSubjects(givers());
 const ctx=()=>({givers:givers(),places:G().placeIds(),subjects:new Set(subjects().map(g=>g.id))});
 const relabel=()=>W().relabel(ui.a,{name:nameOf,place:placeName});
 function go(tab,after){const D=DTX();if(!D)return;if(after)after();D.tab=tab;D.render();}
 // ---------------------------------------------------------------- render
 function render(p,head){host=p;headNode=head;syncNpcMode();observe();
  if(!S()||!S().built){p.innerHTML='';p.append(head(),el('p','Loading your missions and characters…','dev-note'));S().ensure().then(()=>{if(DTX()&&DTX().tab==='home'&&!panel().hidden)draw();}).catch(e=>{p.append(el('p','Developer tools could not load ('+e.message+'). Check your connection, then press CLOSE and open Developer tools again.','me-bad'));});return;}
  draw();}
 function draw(){if(!host)return;host.innerHTML='';host.append(headNode());const r=el('div','','me-root eh-root',{id:'eh-root'});host.append(r);
  if(ui.note){r.append(el('p',ui.note,'me-status',{role:'status'}));ui.note='';}
  if(ui.view==='wizard')wizard(r);else if(ui.view==='done')done(r);else if(ui.view==='test')testView(r);else home(r);
  if(ui.view==='home'&&store.get(W().TOUR_KEY)!=='1'&&!tour.on)setTimeout(()=>{if(ui.view==='home'&&DTX()?.tab==='home'&&!panel().hidden)tour.start();},60);
  else if(tour.on)setTimeout(()=>tour.place(),0);}
 // ---------------- the welcome screen
 const TASKS=[
  ['make','mission','Make a mission','Answer a few easy questions, one at a time. Nothing reaches players until you publish.'],
  ['place','character','Place a character','Put Reverie or Lace at a spot, or make them walk a route on the map.'],
  ['test','test','Test my mission','Play your mission in a practice game. Your real save is never touched.'],
  ['publish','publish','Publish','Check your missions, then send them to every player.']];
 const MORE=[['missions','mission','Mission Editor','Every mission and every setting'],['npcs','people','NPCs','Every character: look, lines, places'],['test','jump','Test & Jump To','Jump to any place to look around'],['balance','balance','Combat Balance','Ship and enemy numbers'],['achievements','trophy','Achievements','The list of achievements']];
 function home(r){r.append(el('h3','What do you want to do?','eh-title'),el('p','Pick a task. Everything you make is a DRAFT: only you see it until you publish it. UNDO (top right) puts back your last change.','dev-note'));
  const g=el('div','','eh-cards',{'data-eh-cards':'1'});
  for(const [id,ic,title,line] of TASKS){const b=btn('',()=>task(id),'eh-card',{'data-eh-task':id});const big=icon(ic,40);big.classList.add('eh-big');b.append(big,el('b',title),el('span',line));g.append(b);}r.append(g);
  r.append(el('h4','More tools','eh-sub'));const m=el('div','','eh-more',{'data-eh-more':'1'});
  for(const [tab,ic,title,line] of MORE){const b=btn('',()=>go(tab),'eh-tool',{'data-eh-tab':tab});b.append(icon(ic,22),el('b',title),el('span',line));m.append(b);}r.append(m);
  const tr=el('p','','me-row');tr.append(iconBtn('help','Show me around',()=>tour.start(),'eh-link',{'data-eh-tour':'1'}));r.append(tr);}
 function task(id){if(id==='make'){ui.view='wizard';ui.a=W().fresh('');ui.page=0;ui.tried=false;draw();return;}
  if(id==='place')return go('npcs');if(id==='publish')return go('missions',()=>S().goto({mode:'publish'}));if(id==='test'){ui.view='test';draw();}}
 // ---------------- "Make a mission"
 function wizard(r){const P=W().PAGES,p=P[ui.page],a=ui.a,probs=W().problems(a,p.id,ctx());
  const top=el('div','','eh-wtop');top.append(btn('',()=>{if(!confirm('Leave “Make a mission”? Nothing has been made yet; your answers will be lost.'))return;ui.view='home';draw();},'eh-link',{'data-eh-cancel':'1'}));top.lastChild.append(icon('close',14),document.createTextNode(' Cancel'));
  const bar=el('div','','eh-progress',{role:'progressbar','aria-valuemin':'1','aria-valuemax':String(P.length),'aria-valuenow':String(ui.page+1),'aria-label':'Question '+(ui.page+1)+' of '+P.length,'data-eh-progress':String(ui.page+1)});
  const fill=el('span');fill.style.width=Math.round((ui.page+1)/P.length*100)+'%';bar.append(fill);top.append(el('span','Question '+(ui.page+1)+' of '+P.length,'me-small'),bar);r.append(top);
  const box=el('section','','eh-page',{'data-eh-page':p.id});box.append(el('h3',p.title,'eh-title'),el('p',p.help,'dev-note'));r.append(box);
  ({kind:pageKind,giver:pageGiver,start:pageStart,steps:pageSteps,reward:pageReward,name:pageName})[p.id](box,a);
  if(ui.tried&&probs.length){const pb=el('div','','eh-problems',{role:'alert','data-eh-problems':'1'});pb.append(el('b','Before you go on:'));const ul=el('ul');for(const t of probs)ul.append(el('li',t));pb.append(ul);r.append(pb);}
  const nav=el('div','','eh-nav');
  nav.append(iconBtn('back','BACK',()=>{if(ui.page===0){ui.view='home';}else{ui.page--;ui.tried=false;}draw();},'',{'data-eh-back':'1'}));
  const last=ui.page===P.length-1,nx=btn('',()=>next(),'eh-primary',{'data-eh-next':'1'});nx.append(document.createTextNode(last?'MAKE MY MISSION ':'NEXT '),icon(last?'check':'next',16));nav.append(nx);r.append(nav);}
 function next(){const P=W().PAGES,p=P[ui.page];relabel();const probs=W().problems(ui.a,p.id,ctx());if(probs.length){ui.tried=true;draw();setTimeout(()=>host&&host.querySelector('[data-eh-problems]')?.scrollIntoView({block:'nearest'}),0);return;}
  ui.tried=false;if(ui.page<P.length-1){ui.page++;draw();return;}finish();}
 function finish(){const all=W().allProblems(ui.a,ctx());if(all.length){ui.tried=true;ui.page=W().PAGES.findIndex(p=>W().problems(ui.a,p.id,ctx()).length);draw();return;}
  const a=ui.a,r=S().addWizardMission((d,{T,number})=>W().build(d,a,{T,number}));ui.made={...r,title:a.title.trim()};ui.view='done';draw();}
 const choice=(list,cur,attr,on)=>{const g=el('div','','eh-choices',{role:'radiogroup'});for(const x of list){const b=btn('',()=>on(x.id),'eh-choice'+(cur===x.id?' on':''),{role:'radio','aria-checked':String(cur===x.id),[attr]:x.id});if(x.icon)b.append(icon(x.icon,32));b.append(el('b',x.title),el('span',x.line||''));g.append(b);}return g;};
 function pageKind(box,a){box.append(choice(W().TEMPLATES,a.template,'data-eh-template',id=>{W().setTemplate(a,id);relabel();ui.tried=false;ui.page++;draw();}));}
 function pageGiver(box,a){const list=talkers(),now=list.filter(g=>g.players),later=list.filter(g=>!g.players);
  const grp=(title,xs,note)=>{if(!xs.length)return;box.append(el('h4',title,'eh-sub'));if(note)box.append(el('p',note,'me-small'));
   box.append(choice(xs.map(g=>({id:g.id,title:g.name,line:(g.where||'').replace(/\s*\(.*$/,'').slice(0,90)})),a.giver,'data-eh-giver',id=>{a.giver=id;draw();}));};
  grp('People players can meet in the game today',now);grp('Only in a practice game for now',later,'Players cannot reach these people yet, so a mission from them can be tested but would not show up for players.');
  if(a.giver)box.append(el('p',G().status(givers().find(g=>g.id===a.giver)),'me-small'));}
 function pageStart(box,a){box.append(choice(W().STARTS,a.start,'data-eh-start',id=>{a.start=id;draw();}));
  if(a.start==='messages'||a.start==='near'){const f=el('div','','eh-fields');
   if(a.start==='messages'){const l=el('label','','me-field');l.append(el('span','Top line of the message (optional)'));const i=el('input','','',{'data-eh-header':'1',maxlength:'80',placeholder:nameOf(a.giver).toUpperCase()+' // MESSAGE'});i.value=a.message.header||'';i.oninput=()=>{a.message.header=i.value;};l.append(i);f.append(l);}
   const l=el('label','','me-field');l.append(el('span',a.start==='messages'?'What the message says':'What the banner says'));const t=el('textarea','','',{'data-eh-message':'1',rows:'3',maxlength:'500',placeholder:'(your words)'});t.value=a.message.text||'';t.oninput=()=>{a.message.text=t.value;};l.append(t,el('span','Text only: no voice is made.','me-help'));f.append(l);box.append(f);}}
 function pageSteps(box,a){relabel();const kinds=W().STEPS;
  a.steps.forEach((s,i)=>{const c=el('div','','eh-step',{'data-eh-step':String(i)});const head=el('div','','me-row');head.append(el('b','Step '+(i+1)));
   const k=el('select','','',{'aria-label':'What the player does in step '+(i+1),'data-eh-step-kind':String(i)});for(const x of kinds)k.append(new Option(x.name,x.id));k.value=s.kind;k.onchange=()=>{s.kind=k.value;s.npc='';s.place='';if(s.auto)s.label='';draw();};head.append(k);
   head.append(btn('▲',()=>{[a.steps[i-1],a.steps[i]]=[a.steps[i],a.steps[i-1]];draw();},'',{'aria-label':'Move step '+(i+1)+' up',...(i?{}:{disabled:''})}),btn('▼',()=>{[a.steps[i+1],a.steps[i]]=[a.steps[i],a.steps[i+1]];draw();},'',{'aria-label':'Move step '+(i+1)+' down',...(i<a.steps.length-1?{}:{disabled:''})}),
    btn('×',()=>{a.steps.splice(i,1);ui.note='Step '+(i+1)+' removed. Press “+ ADD A STEP” to add one again.';draw();},'me-x',{'aria-label':'Remove step '+(i+1),'data-eh-step-remove':String(i)}));c.append(head);
   const kd=kinds.find(x=>x.id===s.kind),row=el('label','','me-field');row.append(el('span',kd.ask));let sel;
   if(kd.needs==='place'){sel=el('select','','',{'aria-label':kd.ask,'data-eh-step-place':String(i)});sel.append(new Option('— choose a place —',''));for(const p of walkPlaces())sel.append(new Option(p.name+(p.players?'':' (not open to players yet)'),p.id));sel.value=s.place||'';sel.onchange=()=>{s.place=sel.value;draw();};}
   else{const list=kd.needs==='subject'?subjects():talkers();sel=el('select','','',{'aria-label':kd.ask,'data-eh-step-npc':String(i)});sel.append(new Option('— choose a person —',''));for(const g of list)sel.append(new Option(g.name+(g.players?'':' (practice game only)'),g.id));sel.value=s.npc||'';sel.onchange=()=>{s.npc=sel.value;draw();};}
   row.append(sel);c.append(row);
   const lab=el('label','','me-field');lab.append(el('span','What the Mission Log says'));const li=el('input','','',{'data-eh-step-label':String(i),maxlength:'200'});li.value=s.label||'';li.oninput=()=>{s.label=li.value;s.auto=!li.value.trim();};lab.append(li,el('span','Filled in for you; change it to your own words if you like.','me-help'));c.append(lab);box.append(c);});
  box.append(iconBtn('plus','ADD A STEP',()=>{a.steps.push({kind:'talk',npc:'',place:'',label:'',auto:true});draw();},'',{'data-eh-add-step':'1'}));}
 function pageReward(box,a){const dir=el('div','','me-row',{role:'radiogroup','aria-label':'Player gets or pays'});
  for(const [v,n] of [[false,'Player gets'],[true,'Player pays']])dir.append(btn(n,()=>{a.pays=v;if(v&&!(Number(a.rewards)>0))a.rewards=100;draw();},!!a.pays===v?'on':'',{role:'radio','data-eh-dir':v?'pays':'gets','aria-checked':String(!!a.pays===v)}));
  box.append(dir,el('p',a.pays?'The player pays this once, when they press ACCEPT. If they have less, ACCEPT is greyed with “You need … CR” and the mission does not start. Credits never go below 0.':'Paid once, when the mission is done.','me-help'));
  const row=el('div','','me-row');for(const v of W().REWARDS)if(!a.pays||v)row.append(btn(v?v+' credits':'Nothing',()=>{a.rewards=v;draw();},Number(a.rewards)===v?'on':'',{'data-eh-reward':String(v),'aria-pressed':String(Number(a.rewards)===v)}));box.append(row);
  const l=el('label','','me-field');l.append(el('span',a.pays?'Or type how much the player pays':'Or type the number of credits'));const i=el('input','','',{type:'number',min:'0',max:'100000',step:'1','data-eh-rewards':'1',style:'max-width:12em'});i.value=String(a.rewards);i.oninput=()=>{a.rewards=i.value===''?NaN:Number(i.value);};l.append(i);box.append(l);
  // "Ask ACCEPT / DENY" yes / no (always yes when the player pays, or when the start is "they ask")
  const forced=a.pays||a.start==='person-accept',on=W().asks(a),q=el('div','','me-row',{role:'radiogroup','aria-label':'Ask the player ACCEPT or DENY first?'});q.append(el('b','Ask the player ACCEPT or DENY first?'));
  for(const [v,n] of [[true,'Yes'],[false,'No']])q.append(btn(n,()=>{a.ask=v;draw();},on===v?'on':'',{role:'radio','data-eh-ask':v?'yes':'no','aria-checked':String(on===v),...(forced&&!v?{disabled:'',title:'The player '+(a.pays?'pays when accepting':'is asked (chosen on “How does it start?”)')+', so the offer always asks.'}:{})}));
  box.append(q,el('p','Yes: the player sees the name, the description and the '+(a.pays?'cost':'reward')+', then chooses ACCEPT or DENY (DENY: asked again later). Change the button words and what DENY does in the Mission Editor afterwards.','me-help'));}
 function summary(a){const st=W().STARTS.find(s=>s.id===a.start);return nameOf(a.giver)+' gives it. Starts: '+(st?st.title.toLowerCase():'')+(W().asks(a)?' (asks ACCEPT / DENY)':'')+'. '+a.steps.map((s,i)=>'Step '+(i+1)+': '+s.label+'.').join(' ')+(a.pays?' The player pays '+(Number(a.rewards)||0)+' credits when accepting.':' Reward: '+(Number(a.rewards)||0)+' credits.');}
 function pageName(box,a){box.append(el('p',summary(a),'eh-summary',{'data-eh-summary':'1'}));
  const f=(label,attr,value,on,area,help,max)=>{const l=el('label','','me-field');l.append(el('span',label));const i=el(area?'textarea':'input','','',{[attr]:'1',maxlength:String(max),...(area?{rows:'2'}:{}),placeholder:'(your words)'});i.value=value||'';i.oninput=()=>on(i.value);l.append(i);if(help)l.append(el('span',help,'me-help'));box.append(l);return i;};
  f('Mission name','data-eh-title',a.title,v=>{a.title=v;},false,'For example “A parcel for Iris”.',60);
  f('Description (optional)','data-eh-description',a.description,v=>{a.description=v;},true,'A longer text under the name in the Mission Log.',600);
  if(a.start==='person'||a.start==='person-accept')f('What '+nameOf(a.giver)+' says when offering it (optional)','data-eh-offer',a.offer,v=>{a.offer=v;},true,'Your own words. Left empty it is a placeholder you can fill in later (text only until recorded).',500);
  const own=(S().local().trees||[]).filter(t=>!t.shipped);const l=el('label','','me-field');l.append(el('span','Put it in'));const sel=el('select','','',{'data-eh-tree':'1'});sel.append(new Option('My missions',''));for(const t of own)if(t.id!=='draft-my-missions')sel.append(new Option(t.name||t.id,t.id));sel.value=a.tree||'';sel.onchange=()=>{a.tree=sel.value;};
  l.append(sel,el('span','A tree is a list of missions played in order. “My missions” is made for you the first time.','me-help'));box.append(l);}
 // ---------------- after the wizard
 function done(r){const m=ui.made;const b=el('section','','eh-page eh-done',{'data-eh-done':m.mission});const ic=icon('check',44);ic.classList.add('eh-big');b.append(ic,el('h3','Your mission “'+m.title+'” is ready','eh-title'),el('p','It is saved as a DRAFT in this browser (and on the server copy when that is on). Only you can see it. Try it now in a practice game: your real save is never touched, and LEAVE DRAFT brings you back.','dev-note'));
  const row=el('div','','eh-nav');row.append(iconBtn('test','PLAY IT NOW',()=>S().playTree(m.mission),'eh-primary',{'data-eh-play':m.mission}),iconBtn('mission','OPEN IT IN THE MISSION EDITOR',()=>go('missions',()=>S().goto({mode:'trees',tree:m.tree,mission:'tree:'+m.mission,scrollTo:true})),'',{'data-eh-open':m.mission}),
   iconBtn('plus','MAKE ANOTHER',()=>task('make'),'',{'data-eh-another':'1'}),iconBtn('home','BACK TO START',()=>{ui.view='home';draw();},'',{'data-eh-home':'1'}));b.append(row);r.append(b);}
 function testView(r){r.append(el('h3','Test my mission','eh-title'),el('p','Press PLAY to try a mission in a practice game. Your real save is never touched; LEAVE DRAFT brings you back here.','dev-note'));
  const list=el('div','','eh-tests',{'data-eh-tests':'1'});let n=0;
  for(const t of S().local().trees||[])for(const m of t.missions||[]){n++;const b=S().blockers(m),row=el('div','','eh-test-row',{'data-eh-test':m.id});
   row.append(el('b',(Number.isInteger(m.number)?'Mission '+String(m.number).padStart(3,'0')+' — ':'')+(m.title||'(no name yet)')),el('span',(t.name||t.id)+' · given by '+(m.giver?nameOf(m.giver):'nobody yet'),'me-small'));
   if(!b.length)row.append(iconBtn('test','PLAY',()=>S().playTree(m.id),'eh-primary',{'data-eh-play':m.id}));
   else row.append(el('span','Not ready yet: '+b[0]+'.','me-warn'),iconBtn('mission','OPEN TO FIX',()=>go('missions',()=>S().goto({mode:'trees',tree:t.id,mission:'tree:'+m.id,scrollTo:true})),'',{'data-eh-fix':m.id}));list.append(row);}
  if(!n)list.append(el('p','You have no missions yet. Press “Make a mission” on the Start page to make one.','me-small'));r.append(list);
  const nav=el('div','','eh-nav');nav.append(iconBtn('home','BACK TO START',()=>{ui.view='home';draw();},'',{'data-eh-home':'1'}),iconBtn('mission','MAKE A MISSION',()=>task('make'),'',{}));r.append(nav);}
 // ---------------------------------------------------------------- undo / redo
 function record(k,before,after){const a=document.activeElement,typing=a&&(a.tagName==='TEXTAREA'||(a.tagName==='INPUT'&&!/^(checkbox|radio|button)$/.test(a.type)))?a:null;undo.record(k,before,after,typing);refreshHead();}
 function apply(e,word){if(!e){toast(word==='Undone'?'Nothing to undo yet. UNDO works on changes made since Developer tools opened.':'Nothing to redo. REDO works right after UNDO.');return;}
  if(!S()||!S().restoreRaw(e.key,e.value)){toast('That change could not be put back (this browser’s storage is blocked or full). Press EXPORT MY EDITS in the Mission Editor to keep a copy.');return;}
  const D=DTX();if(D&&!panel().hidden)D.render();toast(word==='Undone'?'Undone: your last change was put back. REDO does it again.':'Redone.');}
 function toast(t){const p=panel();if(!p)return;let n=document.getElementById('eh-toast');if(!n){n=el('div','','eh-toast',{id:'eh-toast',role:'status'});document.body.append(n);}n.textContent=t;n.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>{n.hidden=true;},4500);}
 function refreshHead(){const p=panel();if(!p)return;const u=p.querySelector('[data-dev="undo"]'),r=p.querySelector('[data-dev="redo"]');if(u)u.disabled=!undo.canUndo;if(r)r.disabled=!undo.canRedo;}
 // ---------------------------------------------------------------- Basic mode: hide what a beginner never needs (Advanced shows everything)
 const basic=()=>!!panel()&&panel().classList.contains('dev-basic');
 function syncNpcMode(){store.set('npc-editor-advanced',DTX()&&DTX().mode==='advanced'?'1':'0');}
 const ADV_SEL=['[data-me-number]','[data-me-number] + .me-help','.me-how','[data-me-followups]','.me-flow','[data-me-flow]','[data-me-tree-mission] .me-grid:has([data-me-field="category"])','.me-row:has(> [data-me-help-location])','.me-row:has(> select[aria-label="Mission type"])'];
 function mark(){const p=panel();if(!p||p.hidden)return;refreshHead();
  for(const n of p.querySelectorAll('[data-npc-advanced]'))n.closest('label')?.classList.add('eh-dup');   // one Advanced switch for all of Developer tools
  for(const n of p.querySelectorAll(ADV_SEL.join(',')))n.classList.add('adv-only');
  for(const h of p.querySelectorAll('.me-end > h4, .me-scene > h5, [data-me-owner-tree] > h4'))if(/^(Branches|If the player comes too soon|Flow chart)/.test(h.textContent))(h.tagName==='H4'&&h.parentElement.matches('[data-me-owner-tree]')?h:h.parentElement).classList.add('adv-only');
  for(const s of p.querySelectorAll('.me-small'))if(/^(id \S+ \(never changes\)|Source: )/.test(s.textContent))s.classList.add('adv-only');
  for(const o of p.querySelectorAll('select[data-me-kind] option'))if(/needs a code change/.test(o.textContent)&&!o.selected)o.classList.add('adv-only');
  for(const b of p.querySelectorAll('[data-me-tstep] > .me-row > b:first-child')){const full=b.dataset.ehFull||b.textContent;b.dataset.ehFull=full;const want=basic()?full.replace(/ · .*$/,''):full;if(b.textContent!==want)b.textContent=want;}}
 let obs=null,markT=0;
 function observe(){const p=panel();if(obs||!p)return;obs=new MutationObserver(list=>{if(list.some(m=>m.type==='attributes')&&p.hidden)tour.end(false);cancelAnimationFrame(markT);markT=requestAnimationFrame(mark);});
  obs.observe(p,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
  p.addEventListener('keydown',e=>{if(!(e.ctrlKey||e.metaKey)||e.key.toLowerCase()!=='z'||/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))return;e.preventDefault();e.shiftKey?api.redo():api.undo();});}
 // ---------------------------------------------------------------- the short tour (points at the real controls)
 const STOPS=[
  {sel:'.dev-tabs',title:'All your tools',text:'These tabs are every tool in Developer tools. Start is this page; you can always come back to it.'},
  {sel:'[data-eh-task="make"]',title:'Make a mission',text:'Start here. It asks one easy question at a time: who gives it, how it starts, what the player does, the reward and a name.'},
  {sel:'[data-eh-task="place"]',title:'Place a character',text:'Put a character at a spot on the map or make them walk a route.'},
  {sel:'[data-eh-task="test"]',title:'Test my mission',text:'Play your mission in a practice game. Your real save is never touched.'},
  {sel:'[data-eh-task="publish"]',title:'Publish',text:'When a mission is ready, check it and send it to every player. Until then everything is a private DRAFT.'},
  {sel:'[data-dev="undo"]',title:'Undo',text:'Made a mistake? UNDO puts back your last change (or press Ctrl+Z). REDO does it again.'},
  {sel:'.dev-mode',title:'Basic and Advanced',text:'Basic shows only what you need. Tick Advanced to see every setting and the internal names. Press the round ? button to see this tour again.'}];
 const tour={on:false,i:0,box:null,
  start(){const D=DTX();if(D&&D.tab!=='home'){ui.view='home';D.tab='home';D.render();}else if(ui.view!=='home'){ui.view='home';draw();}this.on=true;this.i=0;this.show();},
  stops(){const p=panel();return STOPS.filter(s=>p&&p.querySelector(s.sel));},
  show(){const list=this.stops();if(!this.on||!list.length)return this.end(true);this.i=Math.max(0,Math.min(this.i,list.length-1));const s=list[this.i];
   if(!this.box){this.box=el('div','','eh-tour',{role:'dialog','aria-label':'Short tour','data-eh-tour-box':'1'});document.body.append(this.box);}
   const b=this.box;b.innerHTML='';b.append(el('span','Tour · '+(this.i+1)+' of '+list.length,'me-small'),el('b',s.title),el('p',s.text));
   const row=el('div','','me-row');row.append(btn('SKIP TOUR',()=>this.end(true),'eh-link',{'data-eh-tour-skip':'1'}),btn('BACK',()=>{this.i--;this.show();},'',{...(this.i?{}:{disabled:''})}),btn(this.i===list.length-1?'DONE':'NEXT',()=>{if(this.i===list.length-1)this.end(true);else{this.i++;this.show();}},'eh-primary',{'data-eh-tour-next':'1'}));b.append(row);
   this.place();},
  place(){if(!this.on||!this.box)return;const list=this.stops(),s=list[this.i];for(const n of document.querySelectorAll('.eh-tour-target'))n.classList.remove('eh-tour-target');if(!s)return;const t=panel().querySelector(s.sel);t.classList.add('eh-tour-target');
   try{t.scrollIntoView({block:'nearest'});}catch{}const r=t.getBoundingClientRect(),b=this.box,w=Math.min(340,innerWidth-24);b.style.width=w+'px';
   const below=r.bottom+12+180<innerHeight;b.style.top=Math.max(12,below?r.bottom+12:r.top-12-b.offsetHeight)+'px';b.style.left=Math.max(12,Math.min(innerWidth-w-12,r.left))+'px';b.querySelector('[data-eh-tour-next]')?.focus({preventScroll:true});},
  end(finished){if(finished)store.set(W().TOUR_KEY,'1');this.on=false;for(const n of document.querySelectorAll('.eh-tour-target'))n.classList.remove('eh-tour-target');this.box?.remove();this.box=null;}};
 root.addEventListener?.('resize',()=>tour.place());
 const api={render,draw,record,toStart(){if(ui.view!=='wizard')ui.view='home';},undo:()=>apply(undo.undo(),'Undone'),redo:()=>apply(undo.redo(),'Redone'),tour:()=>tour.start(),get canUndo(){return undo.canUndo;},get canRedo(){return undo.canRedo;},mark,get ui(){return ui;},get touring(){return tour.on;},endTour:()=>tour.end(true)};
 root.VoidEditorHome=api;
})(globalThis);
