/* DEVELOPER STUDIO · the mission flow chart (David's 15 Nov 2026 sketch), shared by the Content Studio (admin/studio.js, Missions tab) and the game's
   Developer Tools > Mission Editor (void-runner/mission-editor.js). Classic script: StudioFlow.board(panel, options) and StudioFlow.svg(missions).
   options: {draft(), setDraft(list), persist(), redraw(), npcNames(), ctx(), base(), summary(), resetSummary(), select(id), details(id)}. Records and rules: studio-model.js.
   Everything it edits is the owner's local draft; nothing here reaches the live game. */
(function(root){
 'use strict';
 const el=(tag,text,cls,attrs)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;for(const [k,v] of Object.entries(attrs||{}))e.setAttribute(k,v);return e;};
function board(p,o){
 const S=root.StudioModel;let draft=o.draft();const persist=()=>{o.setDraft(draft);o.persist();},draw=()=>o.redraw(),npcNames=()=>o.npcNames(),ctx=()=>o.ctx(),base=()=>o.base();
 const giverNames=()=>{const names=[...new Set([...S.SPEAKERS.filter(x=>x!=='You'),...npcNames()])];return names;};
 const order=S.chart(draft),board=el('div','','fc-board');board.setAttribute('aria-label','Mission flow chart');
 const input=(value,placeholder,on,cls)=>{const i=el('input','',cls||'');i.value=value??'';i.placeholder=placeholder||'';i.oninput=()=>{on(i.value);persist();refreshSide();};return i;};
 const area=(value,placeholder,on)=>{const t=el('textarea');t.value=value??'';t.placeholder=placeholder||'';t.oninput=()=>{on(t.value);persist();refreshSide();};return t;};
 const link=()=>el('i','','fc-link');
 const newId=(prefix,taken)=>{let n=1,id;do{id=prefix+'-'+n++;}while(taken.includes(id));return id;};
 for(const step of order){
  const m=draft.find(x=>x.id===step.id),lane=el('section','','fc-step');lane.dataset.mission=m.id;
  // 1. who gives it, its name, what is said
  const who=el('div','','fc-npc'),gs=el('select');gs.setAttribute('aria-label','Who gives this mission');const names=giverNames();if(m.giver&&!names.includes(m.giver))names.push(m.giver);for(const n of names)gs.append(new Option(n,n));gs.value=m.giver||'';gs.onchange=()=>{m.giver=gs.value;for(const l of m.offer||[])l.who=m.giver;persist();refreshSide();};
  who.append(el('small','NPC · WHO GIVES IT'),gs);
  const card=el('div','','fc-mission');card.append(el('small','MISSION NAME'),input(m.title,'Mission name',v=>{m.title=v;}));
  const said=el('div','','fc-said');said.append(el('small','WHAT IS SAID'),area((m.offer||[]).map(l=>l.text).join('\n'),'What '+(m.giver||'the giver')+' says when giving the mission (one line per row)',v=>{const lines=v.split('\n').map(x=>x.trim()).filter(Boolean);if(lines.length)m.offer=lines.map(text=>({who:m.giver||'Admin',text}));else delete m.offer;}));
  card.append(said);const left=el('div','','fc-col');left.append(who,card);
  // 2. what needs to be done
  const todo=el('div','','fc-todo');todo.append(el('small','WHAT NEEDS TO BE DONE'));
  for(const o of m.objectives){const r=el('div','','fc-row');const ev=el('select');ev.setAttribute('aria-label','Completes when');ev.append(new Option('(nothing yet)',''));for(const [k,v] of Object.entries(S.EVENTS))ev.append(new Option(v,k));ev.value=o.on||'';ev.onchange=()=>{o.on=ev.value||undefined;persist();refreshSide();};
   const rm=el('button','×','fc-x',{title:'Remove this step','aria-label':'Remove this step'});rm.onclick=()=>{if(m.objectives.length<2)return;m.objectives=m.objectives.filter(x=>x!==o);for(const x of m.objectives)x.requires=(x.requires||[]).filter(q=>q!==o.id);persist();draw();};
   r.append(input(o.label,'What the player must do',v=>{o.label=v;}),ev,rm);todo.append(r);}
  const addStep=el('button','+ step');addStep.onclick=()=>{m.objectives.push({id:newId('step',m.objectives.map(o=>o.id)),label:'',on:'',requires:[]});persist();draw();};todo.append(addStep);
  // 3. the choices it creates, and the store items it makes available
  const right=el('div','','fc-col');
  (m.choices||[]).forEach((c,i)=>{const box=el('div','','fc-choice');const to=el('select');to.setAttribute('aria-label','Leads to');to.append(new Option('leads to: not decided',''));for(const x of draft.filter(x=>x.id!==m.id))to.append(new Option('leads to: '+x.title,x.id));to.value=c.next||'';to.onchange=()=>{c.next=to.value;persist();refreshSide();};
   const rm=el('button','×','fc-x',{title:'Remove this choice','aria-label':'Remove this choice'});rm.onclick=()=>{m.choices=m.choices.filter(x=>x!==c);if(!m.choices.length)delete m.choices;persist();draw();};
   const head=el('div','','fc-row');head.append(el('small','CHOICE '+String(i+1).padStart(2,'0')),rm);box.append(head,input(c.label,'What the player chooses',v=>{c.label=v;}),to);right.append(box);});
  const addChoice=el('button','+ choice');addChoice.onclick=()=>{(m.choices??=[]).push({id:newId('choice',m.choices.map(c=>c.id)),label:'',next:''});persist();draw();};right.append(addChoice);
  for(const u of m.unlocks||[]){const box=el('div','','fc-unlock');const rm=el('button','×','fc-x',{title:'Remove this item','aria-label':'Remove this item'});rm.onclick=()=>{m.unlocks=m.unlocks.filter(x=>x!==u);if(!m.unlocks.length)delete m.unlocks;persist();draw();};
   const head=el('div','','fc-row');head.append(el('small','STORE ITEM BECOMES AVAILABLE'),rm);
   const seller=el('select');seller.setAttribute('aria-label','Sold by');for(const [v,t] of [['','sold by: nobody named'],['admin','sold by: Admin'],['iris','sold by: Iris']])seller.append(new Option(t,v));seller.value=u.seller||'';seller.onchange=()=>{u.seller=seller.value;persist();refreshSide();};
   const where=el('div','','fc-where');where.append(el('small','WHERE: '+S.whereText(u.where)));
   for(const st of S.STORES){const l=el('label',st.name),c=el('input','','',{type:'checkbox'});c.checked=(u.where||[]).includes(st.id);c.onchange=()=>{u.where=S.toggleWhere(u.where,st.id);persist();draw();};l.prepend(c);where.append(l);}
   box.append(head,input(u.item,'Item name',v=>{u.item=v;}),seller,where,input(u.advert,'Advert line for the V1 News feed (optional)',v=>{if(v)u.advert=v;else delete u.advert;}));right.append(box);}
  const addItem=el('button','+ store item');addItem.onclick=()=>{(m.unlocks??=[]).push({item:'',seller:'',where:['everywhere']});persist();draw();};right.append(addItem);
  const tools=el('div','','fc-tools');const after=el('button','+ mission after this');after.onclick=()=>{const id=newId('new-mission',draft.map(x=>x.id));draft.push({id,title:'NEW MISSION',type:'main',giver:m.giver||'Admin',description:'',destination:m.destination||'earth',rewards:0,prerequisites:[m.id],objectives:[{id:'step-1',label:'',on:'',requires:[]}]});o.select&&o.select(id);persist();draw();};
  const form=el('button','details');form.title='Open this mission in the form editor (id, type, location, reward, prerequisites)';form.onclick=()=>{if(o.details)o.details(m.id);};if(!o.details)form.hidden=true;
  const del=el('button','delete');del.onclick=()=>{if(!confirm('Delete "'+m.title+'" from the draft?'))return;draft=draft.filter(x=>x!==m);for(const o of draft){o.prerequisites=(o.prerequisites||[]).filter(x=>x!==m.id);for(const c of o.choices||[])if(c.next===m.id)c.next='';}persist();draw();};
  tools.append(el('small',m.id+(step.leadsTo.length?' → '+step.leadsTo.join(', '):' · end of the chain')),after,form,del);
  lane.append(left,link(),todo,link(),right,tools);board.append(lane);
 }
 const start=el('button','+ New mission');start.onclick=()=>{const id=newId('new-mission',draft.map(x=>x.id));draft.push({id,title:'NEW MISSION',type:'main',giver:'Admin',description:'',destination:'earth',rewards:0,prerequisites:draft.length?[order[order.length-1].id]:[],objectives:[{id:'step-1',label:'',on:'',requires:[]}]});persist();draw();};
 const side=el('div');side.id='mission-side';
 function refreshSide(){side.replaceChildren();const issues=S.validate(draft,ctx());side.append(el('h3','Validation'));if(!issues.length)side.append(el('div','No problems found.','ok'));for(const i of issues)side.append(el('div',i.where+' — '+i.text,'issue '+i.level));
  const ch=S.diff(base(),draft);side.append(el('h3','Draft status'),el('div',ch.length?ch.length+' change(s) from the shipped definitions:':'Identical to the shipped definitions.'));for(const c of ch.slice(0,30))side.append(el('div','• '+c.summary,'issue'));
  const row=el('div','','row'),ex=el('button','Export draft JSON'),rv=el('button','Revert to shipped');ex.onclick=()=>{const blob=new Blob([JSON.stringify(S.exportDraft(draft,o.summary?o.summary():'',base()),null,1)],{type:'application/json'}),a=el('a');a.href=URL.createObjectURL(blob);a.download='studio-draft.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
  rv.onclick=()=>{if(!confirm('Discard your draft and return to the shipped missions?'))return;draft=base();o.resetSummary&&o.resetSummary();o.select&&o.select(null);persist();draw();};row.append(ex,rv);side.append(row);}
 p.append(el('p','Read left to right: who gives the mission, its name and what is said, what needs to be done, then the choices it creates and the store items it makes available. Each row is one mission; the next row is the mission it leads to. Changes are a local draft in this browser.','note'),board,start,side);refreshSide();
 return {refresh:refreshSide};
}
function svg(draft){const S=root.StudioModel,f=S.flow(draft),W=190,H=64,GX=50,GY=18,rows=Math.max(1,...f.nodes.map(n=>n.row+1)),svg=document.createElementNS('http://www.w3.org/2000/svg','svg');const w=f.levels*(W+GX)+10,h=rows*(H+GY)+10;svg.setAttribute('viewBox','0 0 '+w+' '+h);svg.setAttribute('width',Math.min(w,900));svg.setAttribute('class','flow');svg.setAttribute('role','img');svg.setAttribute('aria-label','Mission flow: arrows run from a prerequisite to the mission it unlocks');
 const pos=id=>{const n=f.nodes.find(x=>x.id===id);return {x:5+n.level*(W+GX),y:5+n.row*(H+GY)};};
 for(const e of f.edges){const a=pos(e.from),b=pos(e.to),p=document.createElementNS(svg.namespaceURI,'path');p.setAttribute('class','e');p.setAttribute('d','M'+(a.x+W)+' '+(a.y+H/2)+'C'+(a.x+W+GX/2)+' '+(a.y+H/2)+' '+(b.x-GX/2)+' '+(b.y+H/2)+' '+b.x+' '+(b.y+H/2));svg.append(p);}
 for(const n of f.nodes){const p=pos(n.id),g=document.createElementNS(svg.namespaceURI,'g'),r=document.createElementNS(svg.namespaceURI,'rect');r.setAttribute('class','n');r.setAttribute('x',p.x);r.setAttribute('y',p.y);r.setAttribute('width',W);r.setAttribute('height',H);const m=draft.find(x=>x.id===n.id);
  const t1=document.createElementNS(svg.namespaceURI,'text');t1.setAttribute('x',p.x+8);t1.setAttribute('y',p.y+20);t1.textContent=(n.title||n.id).slice(0,24);const t2=document.createElementNS(svg.namespaceURI,'text');t2.setAttribute('x',p.x+8);t2.setAttribute('y',p.y+38);t2.textContent=(m.objectives||[]).length+' objectives · '+(Number(m.rewards)||0)+' cr';const t3=document.createElementNS(svg.namespaceURI,'text');t3.setAttribute('x',p.x+8);t3.setAttribute('y',p.y+54);t3.textContent=m.giver||'';g.append(r,t1,t2,t3);svg.append(g);}
 return svg;}
 root.StudioFlow={board,svg};
})(globalThis);
