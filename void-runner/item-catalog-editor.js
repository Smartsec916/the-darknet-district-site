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
  function assignments(it){
   return spec.vendorRegistry.map(reg=>{
    const vendor=s.data.vendors.find(v=>v.entity===reg.entity),e=vendor?.entries.find(x=>x.item===it.id);
    return '<fieldset data-seller="'+esc(reg.entity)+'"><legend><label><input type="checkbox" data-assigned '+(e?'checked':'')+'> '+esc(vendor?.name||reg.name)+'</label></legend><small>'+esc(reg.location)+' · '+esc(reg.kind)+'</small>'+
     (e?field('price','Vendor price',e.price)+field('stock','Initial stock',e.stock)+field('maxStock','Maximum stock',e.maxStock)+
     '<label><input type="checkbox" data-sale '+(e.available?'checked':'')+'> On sale</label>'+field('mode','Restock',e.restock.mode,spec.restock)+
     (e.restock.mode==='interval'?field('every','Interval (seconds)',e.restock.every)+field('amount','Units per interval',e.restock.amount):''):'')+'</fieldset>';
   }).join('');
  }
  function draw(){
   if(!host.isConnected||!current())return;
   const c=s.data,it=item();
   if(!c){host.innerHTML='<h3>Items &amp; Vendors</h3><p role="status">'+esc(s.message||'Loading catalog…')+'</p>'+(!s.busy?button('reload','Reload catalog'):'');return;}
   const cats=c.categories.map(x=>[x.id,x.name]),list=filtered(c,s.filter),where=it?sellers(c,it.id):[];
   host.innerHTML='<h3>Items &amp; Vendors</h3><p role="status">'+esc(s.message||'Ready')+' · Live version '+s.version+' · Draft '+s.revision+'</p><fieldset '+(s.busy?'disabled':'')+'>'+
    '<label>Search <input type="search" data-search value="'+esc(s.filter.search)+'"></label>'+filter('category','Category',cats)+
    filter('vendor','Vendor',c.vendors.map(v=>[v.id,v.name]))+filter('vendorType','Vendor type',spec.vendorKinds)+filter('location','Location',[...new Set(c.vendors.map(v=>v.location))])+
    filter('status','Availability',spec.statuses)+filter('effect','Effect',Object.entries(spec.effects).map(([k,v])=>[k,v.label]))+
    '<label><input type="checkbox" data-instock '+(s.filter.stock?'checked':'')+'> In stock</label><p><label>Items <select data-picker>'+options([['','Choose an item'],...list.map(v=>[v.id,v.name])],s.id)+'</select></label> '+list.length+' items</p>'+
    field('newId','New item ID','')+button('new','Create item')+(it?button('duplicate','Duplicate selected'):'')+
    (it?'<fieldset><legend>'+esc(it.name)+' · '+esc(it.id)+'</legend>'+field('name','Name',it.name)+field('description','Description',it.description)+field('category','Category',it.category,cats)+
     field('kind','Item type',it.kind,spec.kinds)+field('status','Availability',it.status,spec.statuses)+field('icon','Inventory icon',it.icon)+field('model','Game model path',it.model||'')+
     field('price','Base price',it.price)+field('stack','Stack limit',it.stack)+field('weight','Weight',it.weight)+field('rarity','Rarity',it.rarity,spec.rarities)+
     field('cooldown','Use cooldown (seconds)',it.cooldown||0)+field('animation','Use animation',it.animation||'none',spec.animations)+'</fieldset>'+
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
   if(el.matches('[data-import]')){
    const f=el.files[0];if(!f)return;
    await work(async()=>{if(f.size>spec.limits.bytes)throw Error('File exceeds the catalog size limit.');const c=JSON.parse(await f.text()),p=rules.problems(c);if(p.length)throw Error(p.slice(0,5).join(' '));
     if(s.dirty&&!confirm('Replace your unsaved edits with the imported catalog?'))return;s.data=c;s.id=c.items[0]?.id;mark();});return;
   }
   if(el.matches('[data-picker]')){s.id=el.value;draw();return;}
   if(el.dataset.filter||el.matches('[data-instock]')){s.filter[el.dataset.filter||'stock']=el.type==='checkbox'?el.checked:el.value;draw();return;}
   if(!it||k==='newId'||el.matches('[data-search]'))return;
   if(reg){
    const def=spec.vendorRegistry.find(v=>v.entity===reg);let vendor=s.data.vendors.find(v=>v.entity===reg);
    if(!def)return;
    if(el.matches('[data-assigned]')){
     if(!vendor){vendor={...def,id:def.entity,entries:[]};s.data.vendors.push(vendor);}
     if(el.checked&&!vendor.entries.some(x=>x.item===it.id))vendor.entries.push(rules.newVendorEntry(it.id,it.price));
     if(!el.checked)vendor.entries=vendor.entries.filter(x=>x.item!==it.id);
    }else{
     const entry=vendor?.entries.find(x=>x.item===it.id);if(!entry)return;
     if(el.matches('[data-sale]'))entry.available=el.checked;
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
   const act=e.target.closest('[data-catalog]')?.dataset.catalog;if(!act||!current()||s.busy)return;
   const idText=host.querySelector('[data-field=newId]')?.value.trim(),target=Number(host.querySelector('[data-version]')?.value);
   work(async()=>{
    if(act==='reload'){if(!s.dirty||confirm('Discard unsaved edits and reload?'))await reload();return;}
    if(act==='new'||act==='duplicate'){
     const id=idText||uniqueId(s.data.items,act==='new'?'new-item':item().id+'-copy');
     if(!rules.ID.test(id)||s.data.items.some(i=>i.id===id))throw Error('Choose a unique ID starting with a letter, using lowercase letters, digits and hyphens.');
     const it=act==='new'?rules.newItem(id,'New item'):{...rules.clone(item()),id,name:item().name+' copy',status:'draft'};s.data.items.push(it);s.id=id;s.filter={};mark();
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
