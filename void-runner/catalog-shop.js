// The store uses the signed-in catalog. A purchase receipt, stock, credits and holdings commit together.
(function(root){
 'use strict';
 let panel=null;
 const receipts=new Map();
 function open(vendor){
  if(panel?.open){panel.focus();return;}
  const game=root.VoidConsumableGame,account=root.VoidAccount,uid=account?.user?.uid;
  const dialog=document.createElement('dialog');panel=dialog;dialog.setAttribute('aria-label',vendor?'Vendor catalog':'Consumable inventory');
  dialog.style.cssText='background:#0a151bcc;color:#d1eeea;border:1px solid #548c98;width:min(540px,90vw);max-height:78vh;overflow:auto;padding:18px';
  document.body.append(dialog);dialog.showModal();
  const title=document.createElement('h3'),summary=document.createElement('p'),content=document.createElement('section'),note=document.createElement('p'),footer=document.createElement('footer');
  note.setAttribute('role','status');dialog.append(title,summary,content,note,footer);
  let listing=null,bag=null,tab=vendor?'shop':'bag',busy=false,category='';
  const campaign=()=>typeof state==='undefined'?null:state;
  const same=()=>uid&&account?.user?.uid===uid&&dialog.open;
  function action(host,label,fn){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=fn;host.append(b);return b;}
  function close(){dialog.close();dialog.remove();if(panel===dialog)panel=null;}
  dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
  const fmt=n=>Number.isFinite(n)?n.toLocaleString():'—';
  function receipt(key){
   const k='vr-shop:'+uid+':'+key;let nonce=receipts.get(k);try{nonce||=sessionStorage.getItem(k);}catch{}
   if(!nonce)nonce=crypto.randomUUID();receipts.set(k,nonce);try{sessionStorage.setItem(k,nonce);}catch{}return {nonce,clear(){receipts.delete(k);try{sessionStorage.removeItem(k);}catch{}}};
  }
  async function operation(fn){if(busy)return;busy=true;dialog.setAttribute('aria-busy','true');
   for(const b of dialog.querySelectorAll('button,select,input'))b.disabled=true;
   try{if(!same())throw Error('Sign in with your District account to shop.');await fn();}
   catch(e){if(dialog.open)note.textContent=e.message||'The shop could not complete the request.';}
   finally{busy=false;dialog.removeAttribute('aria-busy');if(dialog.open)draw();}
  }
  async function refresh(){const [inventory,data]=await Promise.all([game.refresh(),vendor?game.request('shop/vendor/'+encodeURIComponent(vendor)):null]);
   if(same()){bag=inventory;listing=data;}}
  async function sync(){
   const current=campaign();if(!current||!confirm('Save this browser campaign to your account for shopping? This replaces the current cloud campaign.'))return;
   const snapshot=JSON.parse(JSON.stringify(current)),v=await game.request('save',{save:snapshot,revision:account.revision});
   if(!same())return;account.revision=v.revision;account.cloud=snapshot;account.savedAt=v.savedAt;note.textContent='Campaign saved.';
  }
  function buy(entry,qty){
   const current=campaign(),credits=current?.credits,revision=account.revision;
   if(!Number.isInteger(qty)||qty<1||qty>entry.stock||qty>entry.stack){note.textContent='Choose a quantity within the stock and carry limits.';return;}
   const cost=qty*entry.price;
   if(!confirm('Buy '+qty+' × '+entry.name+' for '+fmt(cost)+' credits?'))return;
   operation(async()=>{
    if(!account.cloud||account.cloud.credits!==credits)throw Error('Save the current campaign before buying.');
    const r=receipt([vendor,entry.item,qty,credits,revision].join('/'));
    let result;try{result=await game.request('shop/purchase',{vendor,item:entry.item,qty,credits,revision,nonce:r.nonce});}
    catch(e){if(e.status>=400&&e.status<500)r.clear();throw e;}
    if(!same())return;
    if(campaign()===current&&Number.isFinite(current.credits)){
     current.credits=Math.max(0,current.credits+result.credits-credits);if(typeof save==='function')save();
    }
    account.cloud={...account.cloud,credits:result.credits};account.revision=result.revision;r.clear();
    const sound=entry.purchaseSound||listing?.vendor.rules?.sound;if(sound&&/^assets\/audio\/[a-z0-9_/-]+\.(mp3|ogg|wav|m4a)$/i.test(sound)){const a=new Audio('void-runner/'+sound);a.volume=.45;a.play().catch(()=>{});}note.textContent=entry.name+' added to inventory.';await refresh();
   });
  }
  function use(id){operation(async()=>{const r=receipt('use/'+id+'/'+bag.owned[id]);let data;
    try{data=await game.request('shop/use',{item:id,nonce:r.nonce});}catch(e){if(e.status>=400&&e.status<500)r.clear();throw e;}
    r.clear();if(!same())return;const sound=bag.items[id]?.useSound;if(sound&&/^assets\/audio\/[a-z0-9_/-]+\.(mp3|ogg|wav|m4a)$/i.test(sound)){const a=new Audio('void-runner/'+sound);a.volume=.45;a.play().catch(()=>{});}note.textContent=(data.definition?.name||id)+' used.';await refresh();});}
  function draw(){
   title.textContent=tab==='bag'?'Consumable inventory':listing?.vendor.name||'Vendor catalog';
   summary.textContent=uid?'Available credits · '+fmt(campaign()?.credits):'Sign in with a District account to use this catalog.';
   content.replaceChildren();footer.replaceChildren();action(footer,'Close',close).dataset.inputDismiss='1';
   if(!same())return;
   if(vendor)action(footer,tab==='shop'?'Inventory':'Shop',()=>{tab=tab==='shop'?'bag':'shop';draw();});
   action(footer,'Refresh',()=>operation(refresh));
   if(tab==='bag'){for(const [id,n] of Object.entries(bag?.owned||{})){const it=bag.items[id],row=document.createElement('p');row.append((it?.icon||'')+' '+(it?.name||id)+' × '+n+' ');action(row,'Use',()=>use(id));content.append(row);}
    if(!content.childNodes.length)content.textContent='Inventory is empty.';return;}
   if(!listing)return;
   const options=listing.vendor.rules||{};if(options.color)dialog.style.borderColor=options.color;
   if(options.message){const p=document.createElement('p');p.textContent=options.message;content.append(p);}
   if(!account.cloud||account.cloud.credits!==campaign()?.credits)action(content,'Save current campaign for shopping',()=>operation(sync));
   const cats=[...new Set(listing.entries.map(e=>e.category))],sel=document.createElement('select');sel.setAttribute('aria-label','Product category');
   for(const value of ['',...cats]){const opt=document.createElement('option');opt.value=value;opt.textContent=value||'All categories';sel.append(opt);}sel.value=category;sel.onchange=()=>{category=sel.value;draw();};content.append(sel);
   for(const entry of listing.entries.filter(e=>!category||e.category===category)){
    const row=document.createElement('fieldset'),name=document.createElement('legend'),desc=document.createElement('p'),fx=document.createElement('small'),qty=document.createElement('input');
    name.textContent=(entry.icon||'')+' '+entry.name+' · '+fmt(entry.price)+' CR';desc.textContent=entry.description+' · '+entry.stock+' in stock';
    const def=entry.definition;fx.textContent=[...(def?.effects||[]).map(e=>e.type+' · '+e.duration+' s'),...(def?.modifiers||[]).map(m=>m.stat+' '+(m.amount>0?'+':'')+Math.round(m.amount*100)+'% · '+m.duration+' s')].join(' / ');
    if(entry.condition)desc.append(' · '+entry.condition);
    if(entry.image&&/^assets\/[a-z0-9_/-]+\.(png|jpe?g|webp)$/i.test(entry.image)){const img=document.createElement('img');img.src='void-runner/'+entry.image;img.alt=entry.name;img.width=72;img.loading='lazy';row.append(img);}
    qty.type='number';qty.min='1';qty.max=String(Math.min(entry.stock,entry.stack));qty.value='1';qty.setAttribute('aria-label',entry.name+' quantity');row.append(name,desc,fx,document.createElement('br'),qty);
    const b=action(row,'Buy',()=>buy(entry,Number(qty.value)));b.disabled=!!entry.condition||!entry.stock||!account.cloud||account.cloud.credits!==campaign()?.credits;content.append(row);
   }
   if(!listing.entries.length)content.append('No products on sale.');
  }
  draw();if(same())operation(refresh);
 }
 root.VoidCatalogShop={open};
 const ready=setInterval(()=>{if(!root.VoidInteractions?.register)return;clearInterval(ready);root.VoidInteractions.register('catalog-vendor',({item})=>open(item.vendor));},300);
})(globalThis);
