/* Consumables and vendors: the catalog rules shared by the browser, Node tests and (mirrored in) void_runner_items.py.
   Pure: no DOM, no network. The catalog is one document {format, version, categories, items, vendors, presets}. Items are the game's item registry for things a vendor can sell;
   a consumable item carries effects (visual, camera, audio) and gameplay modifiers. Prices, stock and amounts are re-checked by the server; nothing here is trusted by it. */
(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports;
 const S=node?require('./consumable-spec.js'):root.VoidConsumableSpec;
 const L=S.limits,ID=/^[a-z][a-z0-9-]{0,39}$/,num=(v,lo,hi)=>typeof v==='number'&&Number.isFinite(v)&&v>=lo&&v<=hi,int=(v,lo,hi)=>Number.isInteger(v)&&v>=lo&&v<=hi;
 const plain=(v,n)=>typeof v==='string'&&v.length<=n&&!/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v);
 const hasOnly=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).every(k=>keys.includes(k));
 const EFFECT_KEYS=['id','type','intensity','delay','duration','fadeIn','fadeOut','speed','stacking','params'],MOD_KEYS=['stat','amount','delay','duration'];
 function effectProblems(e,at){const out=[],n=at+': ';
  if(!hasOnly(e,EFFECT_KEYS))return [n+'an effect has unknown fields'];
  const def=S.effects[e.type];if(!def)return [n+'unknown effect "'+e.type+'"'];
  if(typeof e.id!=='string'||!ID.test(e.id))out.push(n+'the effect id uses lowercase letters, numbers and hyphens');
  for(const k of ['intensity','delay','duration','fadeIn','fadeOut','speed']){const c=S.common[k];if(!num(e[k],c.min,c.max))out.push(n+k+' is a number from '+c.min+' to '+c.max);}
  if(num(e.fadeIn,0,1e9)&&num(e.fadeOut,0,1e9)&&num(e.duration,0,1e9)&&e.fadeIn+e.fadeOut>e.duration+1e-9)out.push(n+'fade in plus fade out is longer than the effect');
  if(!S.stacking.includes(e.stacking))out.push(n+'stacking is '+S.stacking.join(', '));
  if(!e.params||typeof e.params!=='object'||Array.isArray(e.params))out.push(n+'parameters are missing');
  else{for(const k of Object.keys(e.params))if(!def.params[k])out.push(n+'unknown parameter "'+k+'"');
   for(const [k,p] of Object.entries(def.params))if(!num(e.params[k],p.min,p.max))out.push(n+p.label+' is a number from '+p.min+' to '+p.max);}
  return out;}
 function modifierProblems(m,at){const n=at+': ';if(!hasOnly(m,MOD_KEYS))return [n+'a modifier has unknown fields'];const d=S.modifiers[m.stat];
  if(!d)return [n+'unknown gameplay modifier "'+m.stat+'"'];if(!d.supported)return [n+d.label+' is not available: '+d.help];
  const out=[];if(!num(m.amount,d.min,d.max))out.push(n+d.label+' is from '+d.min+' to '+d.max);
  if(!num(m.delay,0,L.delay))out.push(n+'delay is 0 to '+L.delay);if(!num(m.duration,1,L.duration))out.push(n+'duration is 1 to '+L.duration);return out;}
 const ITEM_KEYS=['id','name','description','category','subcategory','kind','icon','model','animation','price','stack','weight','rarity','status','cooldown','registryId','consumable','image','purchaseSound','useSound'];
 function itemProblems(it,cats){const out=[],n=(it&&it.id||'item')+': ';
  if(!hasOnly(it,ITEM_KEYS))return [n+'unknown fields'];
  if(it.image&&!/^assets\/[a-z0-9_/-]+\.(png|jpe?g|webp)$/i.test(it.image))out.push(n+'choose a game image');
  for(const key of ['purchaseSound','useSound'])if(it[key]&&!/^assets\/audio\/[a-z0-9_/-]+\.(mp3|ogg|wav|m4a)$/i.test(it[key]))out.push(n+'choose a game audio file for '+key);
  if(typeof it.id!=='string'||!ID.test(it.id))out.push(n+'the item id uses lowercase letters, numbers and hyphens (1 to 40)');
  if(!plain(it.name,L.name)||!it.name)out.push(n+'name is required (up to '+L.name+' characters, no markup)');
  if(!plain(it.description,L.description))out.push(n+'description has markup or is too long');
  if(!cats.has(it.category))out.push(n+'category "'+it.category+'" does not exist');
  if(it.subcategory!=null&&!plain(it.subcategory,40))out.push(n+'subcategory is too long');
  if(!S.kinds.includes(it.kind))out.push(n+'kind is '+S.kinds.join(', '));
  if(it.icon!=null&&!(typeof it.icon==='string'&&it.icon.length<=8&&plain(it.icon,8)))out.push(n+'icon is a short symbol');
  if(it.model!=null&&!(typeof it.model==='string'&&/^assets\/models\/[a-z0-9_\/-]{1,100}\.glb$/.test(it.model)))out.push(n+'model must be a game model under assets/models');
  if(!S.animations.includes(it.animation||'none'))out.push(n+'animation is '+S.animations.join(', '));
  if(!int(it.price,0,L.price))out.push(n+'price is a whole number from 0 to '+L.price);
  if(!int(it.stack,1,L.stack))out.push(n+'stack size is 1 to '+L.stack);
  if(!num(it.weight,0,L.weight))out.push(n+'weight is 0 to '+L.weight);
  if(!S.rarities.includes(it.rarity))out.push(n+'rarity is '+S.rarities.join(', '));
  if(!S.statuses.includes(it.status))out.push(n+'status is '+S.statuses.join(', '));
  if(!int(it.cooldown||0,0,L.cooldown))out.push(n+'cooldown is 0 to '+L.cooldown+' seconds');
  if(it.registryId!=null&&!S.registryItems[it.registryId])out.push(n+'registryId is not an item the game already has');
  if(it.consumable!=null){const c=it.consumable;if(!hasOnly(c,['effects','modifiers']))out.push(n+'consumable has unknown fields');
   else{const ef=c.effects||[],mo=c.modifiers||[];if(!Array.isArray(ef)||ef.length>L.effects)out.push(n+'at most '+L.effects+' effects');
    else{const ids=new Set();ef.forEach((e,i)=>{out.push(...effectProblems(e,n+'effect '+(i+1)));if(e&&ids.has(e.id))out.push(n+'two effects share the id "'+e.id+'"');ids.add(e&&e.id);});}
    if(!Array.isArray(mo)||mo.length>L.modifiers)out.push(n+'at most '+L.modifiers+' gameplay modifiers');else mo.forEach((m,i)=>out.push(...modifierProblems(m,n+'modifier '+(i+1))));}}
  return out;}
 const ENTRY_KEYS=['item','price','stock','maxStock','restock','available','rules'];
 function sellerRules(r){
  if(r==null)return [];
  if(!hasOnly(r,['opens','closes','minRep','mission','color','message','sound','model']))return ['Unknown vendor setting'];
  const bad=[];for(const key of ['opens','closes'])if(key in r&&!int(r[key],0,23))bad.push('Hours must be 0–23');
  if('minRep' in r&&!int(r.minRep,-100,100))bad.push('Reputation must be -100 to 100');
  if(r.mission&&!ID.test(r.mission))bad.push('Choose a valid mission ID');
  if('message' in r&&!plain(r.message,160))bad.push('Promotional message is too long');
  if(r.color&&!/^#[a-f0-9]{6}$/i.test(r.color))bad.push('Choose a six-digit color');
  if(r.sound&&!/^assets\/audio\/[a-z0-9_/-]+\.(mp3|ogg|wav|m4a)$/i.test(r.sound))bad.push('Choose game audio');
  if(r.model&&!/^assets\/models\/[a-z0-9_/-]+\.glb$/i.test(r.model))bad.push('Choose a game model');
  return bad;
 }
 function entryProblems(en,at,items){const n=at+': ';if(!hasOnly(en,ENTRY_KEYS))return [n+'unknown fields'];const out=[];
  if(!items.has(en.item))out.push(n+'item "'+en.item+'" is not in the catalog');
  if(!int(en.price,0,L.price))out.push(n+'price is a whole number from 0 to '+L.price);
  if(!int(en.maxStock,0,L.stock))out.push(n+'max stock is 0 to '+L.stock);
  if(!int(en.stock,0,L.stock)||(int(en.maxStock,0,L.stock)&&en.stock>en.maxStock))out.push(n+'stock is a whole number from 0 up to max stock');
  const r=en.restock;if(!hasOnly(r,['mode','every','amount'])||!S.restock.includes(r.mode)||!int(r.every,0,L.restockEvery)||!int(r.amount,0,L.stock))out.push(n+'restock needs a mode, an interval and an amount');
  else if(r.mode==='interval'&&(r.every<10||r.amount<1))out.push(n+'an interval restock needs 10 seconds or more and an amount of 1 or more');
  if(typeof en.available!=='boolean')out.push(n+'available is on or off');return out;}
 function problems(c){const out=[];
  if(!hasOnly(c,['format','version','categories','items','vendors','presets']))return ['The catalog has unknown fields.'];
  if(c.format!==S.format||c.version!==S.version)return ['The catalog is not a '+S.format+' version '+S.version+' document.'];
  const cats=new Set();if(!Array.isArray(c.categories)||c.categories.length>L.categories)return ['At most '+L.categories+' categories.'];
  for(const k of c.categories){if(!hasOnly(k,['id','name'])||typeof k.id!=='string'||!ID.test(k.id)||!plain(k.name,40)||!k.name)out.push('A category needs an id and a name.');else if(cats.has(k.id))out.push('Two categories share "'+k.id+'".');else cats.add(k.id);}
  if(!Array.isArray(c.items)||c.items.length>L.items)return out.concat(['At most '+L.items+' items.']);
  const ids=new Set();for(const it of c.items){out.push(...itemProblems(it,cats));if(it&&ids.has(it.id))out.push('Two items share the id "'+it.id+'".');ids.add(it&&it.id);}
  if(!Array.isArray(c.vendors)||c.vendors.length>L.vendors)return out.concat(['At most '+L.vendors+' vendors.']);
  for(const v of c.vendors){if(v){out.push(...sellerRules(v.rules));for(const e of Array.isArray(v.entries)?v.entries:[])if(e)out.push(...sellerRules(e.rules));}}
  const vids=new Set(),known=new Map(S.vendorRegistry.map(v=>[v.entity,v]));
  for(const v of c.vendors){const n=(v&&v.id||'vendor')+': ';if(!hasOnly(v,['id','name','kind','location','entity','entries','rules'])){out.push(n+'unknown fields');continue;}
   if(typeof v.id!=='string'||!ID.test(v.id))out.push(n+'the vendor id uses lowercase letters, numbers and hyphens');else if(vids.has(v.id))out.push(n+'two vendors share this id');vids.add(v.id);
   const reg=known.get(v.entity);if(!reg)out.push(n+'"'+v.entity+'" is not a seller the game has');else if(reg.kind!==v.kind)out.push(n+'kind does not match the game seller');
   if(!plain(v.name,L.name)||!v.name)out.push(n+'name is required');if(!plain(v.location,60))out.push(n+'location is too long');
   if(!Array.isArray(v.entries)||v.entries.length>L.entries)out.push(n+'at most '+L.entries+' entries');
   else{const seen=new Set();v.entries.forEach((en,i)=>{out.push(...entryProblems(en,n+'entry '+(i+1),ids));if(en&&seen.has(en.item))out.push(n+'sells "'+en.item+'" twice');seen.add(en&&en.item);});}}
  const ents=c.vendors.map(v=>v&&v.entity);if(new Set(ents).size!==ents.length)out.push('Two vendors use the same seller.');
  if(!Array.isArray(c.presets)||c.presets.length>L.presets)return out.concat(['At most '+L.presets+' presets.']);
  const pids=new Set();for(const p of c.presets){if(!hasOnly(p,['id','name','effects'])||typeof p.id!=='string'||!ID.test(p.id)||!plain(p.name,L.name)||!Array.isArray(p.effects)||p.effects.length>L.effects){out.push('A preset needs an id, a name and up to '+L.effects+' effects.');continue;}
   if(pids.has(p.id))out.push('Two presets share "'+p.id+'".');pids.add(p.id);p.effects.forEach((e,i)=>out.push(...effectProblems(e,'preset '+p.id+' effect '+(i+1))));}
  return out;}
 /* ---------- builders ---------- */
 const clone=o=>JSON.parse(JSON.stringify(o));
 function defaultParams(type){const d=S.effects[type];return d?Object.fromEntries(Object.entries(d.params).map(([k,p])=>[k,p.def])):{};}
 function newEffect(type,id){const c=S.common;return {id:id||type.replace(/[A-Z]/g,m=>'-'+m.toLowerCase()),type,intensity:c.intensity.def,delay:c.delay.def,duration:c.duration.def,fadeIn:c.fadeIn.def,fadeOut:c.fadeOut.def,speed:c.speed.def,stacking:'max',params:defaultParams(type)};}
 function newItem(id,name){return {id,name,description:'',category:'other',subcategory:'',kind:'consumable',icon:'◈',model:null,animation:'drink',price:20,stack:10,weight:0.1,rarity:'common',status:'draft',cooldown:0,consumable:{effects:[],modifiers:[]}};}
 function newVendorEntry(item,price){return {item,price,stock:10,maxStock:10,restock:{mode:'none',every:0,amount:0},available:true};}
 /* The catalog the game starts with (and shows while nothing is published): the two tonics SHOP HERE has always sold, and the vendor that sells them. */
 function seed(){const sprint=newItem('sprint-tonic','Sprint tonic');Object.assign(sprint,{description:'You move faster for 90 seconds.',category:'stimulants',icon:'⚡',price:40,status:'published',stack:5});
  sprint.consumable={effects:[],modifiers:[{stat:'runSpeed',amount:.2,delay:0,duration:90},{stat:'walkSpeed',amount:.2,delay:0,duration:90}]};
  const tint=newItem('street-tint','Street tint');Object.assign(tint,{description:'A light colour wash for 60 seconds.',category:'substances',icon:'◐',price:15,status:'published',stack:5});
  const fx=newEffect('colorShift','tint-wash');Object.assign(fx.params,{hue:8,hueSpeed:0,saturation:1.15,contrast:1,tintAmount:0});fx.intensity=1;fx.duration=60;fx.fadeIn=2;fx.fadeOut=4;tint.consumable={effects:[fx],modifiers:[]};
  const entries=[newVendorEntry('sprint-tonic',40),newVendorEntry('street-tint',15)];entries.forEach(e=>{e.stock=9999;e.maxStock=9999;});
  const vendors=[{id:'shop-here',name:'SHOP HERE counter',kind:'counter',location:'District store',entity:'shop-here',entries}];
  const initial={'kiosk-entrance':[[sprint,40]],'kiosk-far-1':[[tint,15]],'kiosk-far-2':[[sprint,38],[tint,18]],'vend-drinks':[[sprint,45]],'vend-dispensary':[[sprint,42],[tint,20]],'vend-neurohackers':[[tint,17]]};
  for(const reg of S.vendorRegistry.filter(v=>initial[v.entity])){
   vendors.push({...reg,id:reg.entity,entries:initial[reg.entity].map(([it,price])=>({...newVendorEntry(it.id,price),restock:{mode:'interval',every:600,amount:2}}))});
  }
  return {format:S.format,version:S.version,categories:clone(S.categories),items:[sprint,tint],vendors,presets:[]};}
 /* ---------- vendor listing math (the server runs the same rules on its own stock record) ---------- */
 function restocked(entry,rec,now){const base={remaining:entry.stock,at:now,base:entry.stock};let r=rec&&rec.base===entry.stock?{...rec}:base;
  if(entry.restock.mode==='interval'&&entry.restock.every>0&&r.remaining<entry.maxStock){const k=Math.floor(Math.max(0,now-r.at)/entry.restock.every);if(k>0){r.remaining=Math.min(entry.maxStock,r.remaining+k*entry.restock.amount);r.at+=k*entry.restock.every;}}
  else if(entry.restock.mode!=='interval')r.at=now;return r;}
 function listing(catalog,vendorId,stock,now){const v=catalog.vendors.find(x=>x.id===vendorId||x.entity===vendorId);if(!v)return null;
  const items=new Map(catalog.items.map(i=>[i.id,i]));
  return {vendor:{id:v.id,name:v.name,kind:v.kind,location:v.location,entity:v.entity},entries:v.entries.filter(e=>e.available&&items.get(e.item)&&items.get(e.item).status==='published').map(e=>{const it=items.get(e.item),r=restocked(e,stock&&stock[e.item],now);return {item:it.id,name:it.name,description:it.description,icon:it.icon,category:it.category,rarity:it.rarity,price:e.price,stock:r.remaining,maxStock:e.maxStock};})};}
 /* the effect/modifier definition a player's use of an item runs (published items only; unknown ids give null) */
 function use(catalog,itemId){const it=catalog.items.find(i=>i.id===itemId);if(!it||!it.consumable||it.status==='draft')return null;return {id:it.id,name:it.name,cooldown:it.cooldown||0,animation:it.animation||'none',effects:clone(it.consumable.effects||[]),modifiers:clone(it.consumable.modifiers||[])};}
 const api={problems,itemProblems,effectProblems,modifierProblems,entryProblems,newEffect,newItem,newVendorEntry,defaultParams,seed,restocked,listing,use,clone,ID};
 if(node)module.exports=api;else root.VoidConsumables=api;
})(typeof globalThis!=='undefined'?globalThis:this);
