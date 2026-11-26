(function(root){
 'use strict';
 const groups={
  visual:['◉','Visual effects','#bd9aff'],audio:['♫','Audio effects','#82b6ff'],
  movement:['↗','Physical and movement','#8ce9aa'],health:['♥','Health and recovery','#ff979d'],
  combat:['◇','Combat enhancements','#ffb375'],status:['◎','Status and gameplay','#67dbbd'],
  timing:['◷','Timing and effect behavior','#f4cd77']
 };
 function group(track){
  if(track.type)return track.type.startsWith('audio')?'audio':'visual';
  if(['healthRecovery','healthLoss','maxHealth'].includes(track.stat))return 'health';
  if(['damageResist','accuracy','recoilReduction','damageDealt','reloadSpeed','shieldRecovery','energyRecovery'].includes(track.stat))return 'combat';
  if(track.stat==='perception')return 'status';
  return 'movement';
 }
 function dashboard(dialog,draft,spec,onAdd,onSolo,copyFrom){
  const box=dialog.querySelector('[data-layers]'),cards={},sections={};
  for(const [id,[icon,title,color]] of Object.entries(groups)){
   const card=document.createElement('details'),head=document.createElement('summary'),label=document.createElement('strong'),note=document.createElement('small');
   card.className='cs-card';card.style.setProperty('--category',color);card.dataset.category=id;label.textContent=icon+'  '+title;head.append(label,note);card.append(head);
   const body=document.createElement('div');card.append(body);box.append(card);cards[id]={card,note};sections[id]=body;
   if(id==='timing')continue;
   const list=document.createElement('select');list.setAttribute('aria-label',title+' track');
   for(const [key,d] of Object.entries({...spec.effects,...spec.modifiers})){
    const fx=!!spec.effects[key];if(d.supported===false||group(fx?{type:key}:{stat:key})!==id)continue;
    list.add(new Option(d.label,key));
   }
   function button(name,fn){const b=document.createElement('button');b.type='button';b.textContent=name;b.onclick=fn;body.append(b);}
   body.append(list);button('Add track',()=>onAdd(list.value));button('Preview category',()=>onSolo(id));
   if(copyFrom.length){const source=document.createElement('select');source.setAttribute('aria-label','Copy '+title+' from item');
    for(const it of copyFrom)source.add(new Option(it.name,it.id));body.append(source);
    button('Copy tracks',()=>onAdd(null,id,source.value));
   }
   const children=document.createElement('div');body.append(children);sections[id]=children;
  }
  sections.timing.append(dialog.querySelector('[data-repeat]').closest('fieldset'));
  function refresh(){for(const [id,{note}] of Object.entries(cards)){
   const layers=[...draft.effects,...draft.modifiers].filter(t=>id==='timing'||group(t)===id);
   const names=layers.map(t=>(spec.effects[t.type]||spec.modifiers[t.stat]).label);
   if(id==='health'&&draft.onUseHealth)names.push('Health on use');if(id==='health'&&draft.onUseStamina)names.push('Stamina on use');
   const active=names.length>layers.length||layers.some(t=>(t.intensity??t.amount)!==0);
   note.textContent=(active?'Enabled':'Inactive')+' · '+names.length+(names.length===1?' track':' tracks')+(names.length?' · '+names.join(', '):'');
  }}
  return {sections,refresh};
 }
 function timeline(host,draft,spec,select,finish){
  host.replaceChildren();const tracks=[...draft.effects,...draft.modifiers],end=Math.max(1,...tracks.map(t=>t.delay+t.duration));
  for(const track of tracks){
   const row=document.createElement('div'),name=document.createElement('button'),lane=document.createElement('div'),bar=document.createElement('button'),edge=document.createElement('span');
   row.className='cs-row';lane.className='cs-lane';bar.className='cs-bar';edge.className='cs-edge';edge.textContent='↔';bar.append(edge);
   const label=(spec.effects[track.type]||spec.modifiers[track.stat]).label;name.textContent=label;name.onclick=()=>select(track);bar.setAttribute('aria-label',label+' timing');bar.title='Drag to move. Drag the right edge to resize. Use arrow keys to move, Shift + arrow to resize.';
   row.style.setProperty('--category',groups[group(track)][2]);
   function paint(){
    const up=100*(track.fadeIn||0)/track.duration,down=100-100*(track.fadeOut||0)/track.duration;
    bar.style.background='linear-gradient(90deg,transparent,var(--category) '+up+'%,var(--category) '+down+'%,transparent)';
    bar.title=label+' · starts at '+track.delay+' s · fade in '+(track.fadeIn||0)+' s · peak '+Math.round((track.intensity??1)*100)+'% · fade out '+(track.fadeOut||0)+' s. Drag to move or resize.';
bar.style.left=100*track.delay/end+'%';bar.style.width=100*track.duration/end+'%';bar.setAttribute('aria-description',track.delay+' seconds, duration '+track.duration+' seconds');}
   function change(k,value){const min=k==='delay'?0:Math.max(1,(track.fadeIn||0)+(track.fadeOut||0));track[k]=Math.max(min,Math.min(spec.limits[k],Math.round(value*10)/10));paint();}
   bar.onpointerdown=e=>{e.preventDefault();const key=e.target===edge?'duration':'delay',start=e.clientX,base=track[key],width=lane.clientWidth;bar.setPointerCapture(e.pointerId);
    bar.onpointermove=m=>change(key,base+end*(m.clientX-start)/width);
    bar.onlostpointercapture=()=>{bar.onpointermove=null;finish();};};
   bar.onkeydown=e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();const key=e.shiftKey?'duration':'delay';change(key,track[key]+(e.key==='ArrowLeft'?-1:1));finish();};
   paint();lane.append(bar);row.append(name,lane);host.append(row);
  }
 }
 root.VoidConsumableDashboard={dashboard,group,timeline};
})(globalThis);
