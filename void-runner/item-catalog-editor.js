// Dev Tools loads this editor on demand. Only the signed-in developer API can save or publish.
(function(root){
 'use strict';
 const spec=root.VoidConsumableSpec, rules=root.VoidConsumables;
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function options(values,current){
  return values.map(v=>{const [id,name]=Array.isArray(v)?v:[v,v];return '<option value="'+esc(id)+'"'+(id===current?' selected':'')+'>'+esc(name)+'</option>';}).join('');
 }
 function field(key,name,value,choices){
  const control=choices?'<select data-field="'+key+'">'+options(choices,value)+'</select>':
   '<input data-field="'+key+'" '+(typeof value==='number'?'type="number" min="0" step="'+(key==='weight'?'any':'1')+'"':'type="text"')+' value="'+esc(value)+'">';
  return '<label>'+esc(name)+' '+control+'</label>';
 }
 const button=(key,label)=>'<button type="button" data-catalog="'+key+'">'+label+'</button>';
 function uniqueId(items,base){
  const stem=String(base||'new-item').toLowerCase().replace(/[^a-z0-9-]/g,'-').replace(/^[^a-z]+/,'').slice(0,32)||'new-item';
  let id=stem,n=2;while(items.some(i=>i.id===id))id=stem+'-'+n++;return id;
 }
 function sellers(catalog,id){return catalog.vendors.filter(v=>v.entries.some(e=>e.item===id));}
 function filtered(c,f){
  const term=(f.search||'').trim().toLowerCase();
  return c.items.filter(i=>{
   const vs=sellers(c,i.id);
   const venue=v=>(!f.location||v.location===f.location)&&(!f.vendor||v.id===f.vendor)&&(!f.vendorType||v.kind===f.vendorType);
   return (!term||[i.id,i.name,i.description,...vs.map(v=>v.name)].join(' ').toLowerCase().includes(term))&&
    (!f.category||i.category===f.category)&&(!f.status||i.status===f.status)&&(!f.effect||i.consumable?.effects.some(e=>e.type===f.effect))&&
    (!(f.location||f.vendor||f.vendorType||f.stock)||vs.some(v=>venue(v)&&(!f.stock||v.entries.some(e=>e.item===i.id&&e.available&&e.stock>0))));
  });
 }
 let session=null;
 function mount(host,tools){
  if(!tools.uid||!tools.authorized||typeof tools.request!=='function'){host.textContent='Sign in with a developer account to open the catalog.';return;}
  if(!session||session.uid!==tools.uid)session={uid:tools.uid,data:null,revision:0,version:0,history:[],dirty:false,busy:false,filter:{},id:null,message:'',pending:null};
  const s=session;
  const current=()=>tools.uid===s.uid&&tools.authorized&&typeof tools.request==='function';
  const item=()=>s.data?.items.find(i=>i.id===s.id);
  const send=(path,body)=>{if(!current())throw Error('Sign in with the same developer account to continue.');return tools.request(path,body);};
  function setData(d){s.data=rules.clone(d.draft.content||d.live.content);s.revision=d.draft.revision;s.version=d.state.version;s.history=d.state.history||[];s.dirty=false;if(!item())s.id=s.data.items[0]?.id;}
  function mark(){s.dirty=true;s.message='Unsaved changes';}
  function filter(key,title,values){return '<label>'+title+' <select data-filter="'+key+'">'+options([['','All'],...values],s.filter[key]||'')+'</select></label>';}
  function availabilityFields(scope,r={},kiosk=false){
   const wrap=(k,title,val)=>field(k,title,val);
   return '<fieldset data-rule-owner="'+scope+'"><legend>'+ (scope==='vendor'?'Vendor settings':'Product availability')+'</legend>'+
    wrap('opens','Opening hour',r.opens??0)+wrap('closes','Closing hour (same hour = all day)',r.closes??0)+
    wrap('minRep','Minimum civilian reputation',r.minRep??-100).replace('min="0"','min="-100"')+wrap('mission','Required completed mission ID',r.mission||'')+
    (scope==='vendor'?'<label>Interface color <input type="color" data-field="color" value="'+esc(r.color||'#548c98')+'"></label>'+
    (kiosk?field('slot','Physical kiosk bay',r.slot||'',[['','Original bay'],...Object.entries(spec.kioskSlots).map(([id,s])=>[id,s.name])])+field('model','Kiosk cabinet',r.model||'',[['','Original scanner'],...Object.entries(spec.kioskModels).map(([id,m])=>[id,m.name])])+'<label>Screen light <input type="color" data-field="screen" value="'+esc(r.screen||'#68e0db')+'"></label>':'')+
    wrap('message','Promotional message',r.message||'')+wrap('sound','Purchase sound (game asset path)',r.sound||''):'')+'</fieldset>';
  }
  function keycardFields(it){
   const card=it.keycard,A=root.VoidApartments;
   if(!card||!A)return '<p>Open the game property registry to configure door permissions.</p>';
   const doors=A.doors(),current=doors.find(d=>d.id===s.cardBuilding)||doors[0];
   const units=current?A.propertyRecord(current).units:[];
   const targets=current?[[current.id,'Street entrance'],...units.map(u=>[u.id,'Apartment '+u.number])]:[];
   const flag=(id,label)=>'<label><input type="checkbox" data-card-flag="'+id+'" '+(card[id]?'checked':'')+'> '+label+'</label>';
   return '<fieldset><legend>Keycard access</legend><label>Building <select data-card-building>'+options(doors.map(d=>[d.id,d.name]),current?.id)+'</select></label>'+
    targets.map(([id,label])=>'<label><input type="checkbox" data-card-door="'+esc(id)+'" '+(card.doors.includes(id)?'checked':'')+'> '+esc(label)+'</label>').join(' ')+
    '<p>'+card.doors.length+' authorized doors</p>'+
    '<label>Player-visible notes <textarea data-card-text="notes" maxlength="600">'+esc(card.notes)+'</textarea></label>'+
    '<details><summary>Permissions and private notes</summary>'+flag('transferable','Allow transfer')+flag('droppable','Allow dropping')+flag('pickup','Allow pickup')+
    flag('bearer','Any holder can use this card')+'<label>Lifetime in seconds (0 for permanent) <input type="number" min="0" max="315360000" data-card-duration value="'+card.duration+'"></label>'+
    '<label>Private developer notes <textarea data-card-text="privateNotes" maxlength="600">'+esc(card.privateNotes)+'</textarea></label></details></fieldset>';
  }
  function serviceFields(it){
   const svc=it.service,steps=svc?.steps||[],id=tools.catalogNpc?.id||sellers(s.data,it.id).find(v=>v.kind==='npc')?.entity.replace(/^npc-/,'');
   const choices=id&&root.VoidNPCPaths?.actionsFor(id),clips=(choices||[]).map(v=>[v.id||v.clip,v.label||v.name||v.id||v.clip]).filter(v=>v[0]);
   const points=root.VoidLiveContent?.env?.npcPlans?.[id]?.points||[];
   return '<fieldset data-service><legend>Service routine</legend>'+field('participation','Player participation',svc?.participation||'watch',['watch','follow'])+
    field('completion','Completion',svc?.completion||'timer',['timer','confirm'])+steps.map((step,i)=>'<fieldset data-step="'+i+'"><legend>Step '+(i+1)+'</legend>'+
    field('seconds','Duration (seconds)',step.seconds)+field('point','Authored waypoint',step.point||0,points.length?[[0,'Stay here'],...points.map((p,j)=>[j+1,(j+1)+' · '+(p.action||'waypoint')])]:undefined)+field('clip','Animation clip',step.clip||'',clips.length?[['','Normal animation'],...clips]:undefined)+
    field('line','Dialogue',step.line||'')+'<button data-drop-step="'+i+'">Remove step</button></fieldset>').join('')+button('step','Add routine step')+'</fieldset>';
  }
  function assignments(it){
   return [...spec.vendorRegistry,...s.data.vendors.filter(v=>v.kind==='npc'&&!spec.vendorRegistry.some(r=>r.entity===v.entity))].map(reg=>{
    const vendor=s.data.vendors.find(v=>v.entity===reg.entity),e=vendor?.entries.find(x=>x.item===it.id);
    return '<fieldset data-seller="'+esc(reg.entity)+'"><legend><label><input type="checkbox" data-assigned '+(e?'checked':'')+'> '+esc(vendor?.name||reg.name)+'</label></legend><small>'+esc(reg.location)+' · '+esc(reg.kind)+'</small>'+
     (e?'<label>Vendor name <input data-vendor-name value="'+esc(vendor.name)+'"></label><label>Location label <input data-vendor-location value="'+esc(vendor.location)+'"></label>'+availabilityFields('vendor',vendor.rules,reg.kind==='kiosk')+availabilityFields('entry',e.rules)+field('price','Vendor price',e.price)+field('stock','Initial stock',e.stock)+field('maxStock','Maximum stock',e.maxStock)+
     '<label><input type="checkbox" data-sale '+(e.available?'checked':'')+'> On sale</label>'+field('mode','Restock',e.restock.mode,spec.restock)+
     (e.restock.mode==='interval'?field('every','Interval (seconds)',e.restock.every)+field('amount','Units per interval',e.restock.amount):''):'')+'</fieldset>';
   }).join('');
  }
  function draw(){
   if(!host.isConnected||!current())return;
   const c=s.data,it=item(),npc=tools.catalogNpc;
   if(!c){host.innerHTML='<h3>Items &amp; Vendors</h3><p role="status">'+esc(s.message||'Loading catalog…')+'</p>'+(!s.busy?button('reload','Reload catalog'):'');return;}
   const cats=c.categories.map(x=>[x.id,x.name]),list=filtered(c,s.filter),where=it?sellers(c,it.id):[];
   host.innerHTML='<h3>Items &amp; Vendors</h3><p role="status">'+esc(s.message||'Ready')+' · Live version '+s.version+' · Draft '+s.revision+'</p><fieldset '+(s.busy?'disabled':'')+'>'+
    (npc?'<p>'+esc(npc.name)+' '+button('enable-npc',s.data.vendors.some(v=>v.entity==='npc-'+npc.id&&v.enabled!==false)?'Disable vendor':'Enable as vendor')+'</p>':'')+
    '<label>Search <input type="search" data-search value="'+esc(s.filter.search)+'"></label>'+filter('category','Category',cats)+
    filter('vendor','Vendor',c.vendors.map(v=>[v.id,v.name]))+filter('vendorType','Vendor type',spec.vendorKinds)+filter('location','Location',[...new Set(c.vendors.map(v=>v.location))])+
    filter('status','Availability',spec.statuses)+filter('effect','Effect',Object.entries(spec.effects).map(([k,v])=>[k,v.label]))+
    '<label><input type="checkbox" data-instock '+(s.filter.stock?'checked':'')+'> In stock</label><p><label>Items <select data-picker>'+options([['','Choose an item'],...list.map(v=>[v.id,v.name])],s.id)+'</select></label> '+list.length+' items</p>'+
    field('newId','New item ID','')+'<label>Template <select data-example>'+options([['','Blank item'],...Object.entries(root.VoidConsumableStudio?.examples||{}).map(([id,v])=>[id,v[0]])],'')+'</select></label>'+button('new','Create item')+(it?button('duplicate','Duplicate selected'):'')+
    (it?'<fieldset><legend>'+esc(it.name)+' · '+esc(it.id)+'</legend>'+field('name','Name',it.name)+field('description','Description',it.description)+field('category','Category',it.category,cats)+
     field('kind','Item type',it.kind,spec.kinds)+(it.kind==='keycard'?keycardFields(it):'')+(it.kind==='service'?serviceFields(it):'')+field('status','Availability',it.status,spec.statuses)+field('icon','Inventory icon',it.icon)+field('model','Game model path',it.model||'')+
     field('image','Product image path',it.image||'')+field('purchaseSound','Purchase sound',it.purchaseSound||'')+field('useSound','Use sound',it.useSound||'')+field('price','Base price',it.price)+field('stack','Stack limit',it.stack)+field('weight','Weight',it.weight)+field('rarity','Rarity',it.rarity,spec.rarities)+
     ('<button data-effects type="button">Open Consumables Studio</button>')+field('cooldown','Use cooldown (seconds)',it.cooldown||0)+field('animation','Use animation',it.animation||'none',spec.animations)+'</fieldset>'+
     '<h4>Sold at</h4><p>'+esc(where.map(v=>v.name+' · '+v.location).join(', ')||'No vendors assigned')+'</p>'+assignments(it):'')+
    '<p>'+button('category','Add category')+button('save','Save draft')+button('publish','Publish draft')+button('reload','Reload saved draft')+'</p>'+
    '<label>Import catalog <input type="file" data-import accept=".json,application/json"></label>'+button('export','Export JSON')+
    (s.history.length?'<label>Version <select data-version>'+options(s.history.map(v=>[String(v.version),'Version '+v.version+' '+(v.note||'')]),'')+'</select></label>'+button('restore','Restore version'):'')+
    '</fieldset>';
  }
  s.draw=draw;
  async function work(fn){
   if(s.busy||!current())return;s.busy=true;draw();
   try{await fn();}catch(error){s.message=error.message||'Catalog operation failed.';}
   finally{s.busy=false;s.draw();}
  }
  async function save(){
   const d=await send('developer/items/draft',{revision:s.revision,content:s.data});
   s.revision=d.revision;s.dirty=false;s.message=d.problems?.length?'Draft saved. '+d.problems.join(' '):'Draft saved.';
  }
  async function reload(){setData(await send('developer/items'));s.message='Loaded saved catalog.';}
  host.oninput=e=>{
   if(!e.target.matches('[data-search]'))return;
   s.filter.search=e.target.value;const at=e.target.selectionStart;draw();const search=host.querySelector('[data-search]');search.focus();search.setSelectionRange(at,at);
  };
  host.onchange=async e=>{
   if(s.busy||!current())return;const el=e.target,k=el.dataset.field,it=item(),reg=el.closest('[data-seller]')?.dataset.seller;
   if(el.matches('[data-card-building]')){s.cardBuilding=el.value;draw();return;}
   if(it?.keycard){
    const c=it.keycard;
    if(el.dataset.cardDoor){const id=el.dataset.cardDoor;c.doors=c.doors.filter(d=>d!==id);if(el.checked)c.doors.push(id);mark();draw();return;}
    if(el.dataset.cardFlag){c[el.dataset.cardFlag]=el.checked;mark();return;}
    if(el.dataset.cardText){c[el.dataset.cardText]=el.value;mark();return;}
    if(el.matches('[data-card-duration]')){c.duration=el.valueAsNumber;mark();return;}
   }
   if(el.matches('[data-import]')){
    const f=el.files[0];if(!f)return;
    await work(async()=>{if(f.size>spec.limits.bytes)throw Error('File exceeds the catalog size limit.');const c=JSON.parse(await f.text()),p=rules.problems(c);if(p.length)throw Error(p.slice(0,5).join(' '));
     if(s.dirty&&!confirm('Replace your unsaved edits with the imported catalog?'))return;s.data=c;s.id=c.items[0]?.id;mark();});return;
   }
   if(el.matches('[data-picker]')){s.id=el.value;draw();return;}
   if(el.dataset.filter||el.matches('[data-instock]')){s.filter[el.dataset.filter||'stock']=el.type==='checkbox'?el.checked:el.value;draw();return;}
   if(!it||k==='newId'||el.matches('[data-search]'))return;
   if(el.closest('[data-service]')&&k){
    const line=el.closest('[data-step]');const obj=line?it.service.steps[Number(line.dataset.step)]:it.service;
    obj[k]=k==='point'?Number(el.value):el.type==='number'?el.valueAsNumber:el.value;mark();return;
   }
   if(k==='kind'&&!reg){
    it.kind=el.value;
    if(it.kind==='keycard'){
     delete it.service;it.consumable=null;it.stack=1;it.category='keycards';
     if(!s.data.categories.some(c=>c.id==='keycards'))s.data.categories.push({id:'keycards',name:'Keycards'});
     it.keycard||={doors:[],notes:'',privateNotes:'',duration:0,transferable:false,droppable:false,pickup:true,bearer:false};
    }else delete it.keycard;
    if(it.kind==='service'){it.service||={participation:'watch',completion:'timer',steps:[{seconds:15,point:0,clip:'',line:''}]};it.consumable=null;}
    else{delete it.service;if(!it.consumable&&it.kind==='consumable')it.consumable={effects:[],modifiers:[]};}mark();draw();return;
   }
   if(reg){
    const def=spec.vendorRegistry.find(v=>v.entity===reg);let vendor=s.data.vendors.find(v=>v.entity===reg);
    if(!def)return;
    if(el.matches('[data-assigned]')){
     if(!vendor){vendor={...def,id:def.entity,entries:[]};s.data.vendors.push(vendor);}
     if(el.checked&&!vendor.entries.some(x=>x.item===it.id))vendor.entries.push(rules.newVendorEntry(it.id,it.price));
     if(!el.checked)vendor.entries=vendor.entries.filter(x=>x.item!==it.id);
    }else{
     const entry=vendor?.entries.find(x=>x.item===it.id);if(!entry)return;
     const owner=el.closest('[data-rule-owner]')?.dataset.ruleOwner;
     if(owner){const target=owner==='vendor'?vendor:entry;target.rules||={};target.rules[k]=el.type==='number'?el.valueAsNumber:el.value;}
     else if(el.matches('[data-vendor-name]'))vendor.name=el.value;
     else if(el.matches('[data-vendor-location]'))vendor.location=el.value;
     else if(el.matches('[data-sale]'))entry.available=el.checked;
     else if(k==='mode')entry.restock=el.value==='interval'?{mode:'interval',every:300,amount:1}:{mode:'none',every:0,amount:0};
     else if(k==='every'||k==='amount')entry.restock[k]=el.valueAsNumber;
     else if(k)entry[k]=el.valueAsNumber;else return;
    }
   }else if(k){it[k]=el.type==='number'?el.valueAsNumber:k==='model'?(el.value||null):el.value;}else return;
   mark();
   // Keep unrelated controls mounted while focus moves from a field to Save.
   if(el.matches('[data-assigned]')||k==='mode')draw();else host.querySelector('[role=status]').textContent=s.message;
  };
  host.onclick=e=>{
   const remove=e.target.closest('[data-drop-step]');if(remove&&item()?.service&&current()&&!s.busy){item().service.steps.splice(Number(remove.dataset.dropStep),1);mark();draw();return;}
   if(e.target.closest('[data-effects]')&&item()&&!s.busy&&current()){
    root.VoidConsumableStudio.open(item(),s.data.presets,(effects,presets)=>{item().consumable=effects;s.data.presets=presets;mark();draw();},()=>host.isConnected&&!host.closest('[hidden]')&&current());return;
   }
   const act=e.target.closest('[data-catalog]')?.dataset.catalog;if(!act||!current()||s.busy)return;
   const template=host.querySelector('[data-example]')?.value;
   const idText=host.querySelector('[data-field=newId]')?.value.trim(),target=Number(host.querySelector('[data-version]')?.value);
   work(async()=>{
    if(act==='reload'){if(!s.dirty||confirm('Discard unsaved edits and reload?'))await reload();return;}
    if(act==='step'){if(item().service.steps.length>=12)throw Error('The service has twelve steps.');item().service.steps.push({seconds:10,point:0,clip:'',line:''});mark();return;}
    if(act==='enable-npc'){
     const npc=tools.catalogNpc;if(!npc)return;const entity='npc-'+npc.id;let v=s.data.vendors.find(x=>x.entity===entity);
     if(v)v.enabled=v.enabled===false;else{s.data.vendors.push({id:entity,name:npc.name,entity,kind:'npc',location:'With '+npc.name,entries:[],enabled:true});}
     mark();return;
    }
    if(act==='new'||act==='duplicate'){
     const id=idText||uniqueId(s.data.items,act==='new'?(template||'new-item'):item().id+'-copy');
     if(!rules.ID.test(id)||s.data.items.some(i=>i.id===id))throw Error('Choose a unique ID starting with a letter, using lowercase letters, digits and hyphens.');
     const it=act==='new'?(template?root.VoidConsumableStudio.example(template,id):rules.newItem(id,'New item')):{...rules.clone(item()),id,name:item().name+' copy',status:'draft'};s.data.items.push(it);s.id=id;s.filter={};mark();
    }else if(act==='category'){
     const name=prompt('Category name');if(!name?.trim())return;const id=uniqueId(s.data.categories,name);s.data.categories.push({id,name:name.trim()});mark();
    }else if(act==='save')await save();
    else if(act==='publish'){
     const bad=rules.problems(s.data);if(bad.length)throw Error(bad.slice(0,5).join(' '));
     if(!confirm('Publish this catalog to all players?'))return;
     await save();await send('developer/items/publish',{expected:s.version,note:'Items & Vendors editor'});await reload();s.message='Catalog published.';
    }else if(act==='restore'){
     if(!confirm('Publish version '+target+' as a new live version?'))return;
     await send('developer/items/rollback',{expected:s.version,target});const d=await send('developer/items');setData(d);s.data=rules.clone(d.live.content);mark();s.message='Live version restored. Save to use this as your draft.';
    }else if(act==='export'){
     const url=URL.createObjectURL(new Blob([JSON.stringify(s.data,null,2)],{type:'application/json'}));
     const link=document.createElement('a');link.download='void-runner-item-catalog.json';link.href=url;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }
   });
  };
  if(!s.data&&!s.busy)work(reload);else draw();
 }
 root.VoidItemCatalogEditor={mount,reset(){session=null;},filtered,sellers};
})(globalThis);
