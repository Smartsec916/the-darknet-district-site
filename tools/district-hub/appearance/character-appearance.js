/* Appearance rules for the character creator: what a saved or received appearance may contain, how an old {gender, model} character maps to one, and what the
   creator may offer. PURE (no engine, no storage of its own); runs in the browser and in Node. Only IDs from character-catalog.json are ever accepted, never paths. */
(function(root){
 'use strict';
 const CAT=typeof module!=='undefined'&&module.exports?require('./character-catalog.json'):root.VoidCharacterCatalog;
 const ID=/^[a-z0-9][a-z0-9-]{0,39}$/,KEYS=['v','base','look','hair','hairColor','clothingColor','accessories'];
 const has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
 const DEFAULT_LOOK={male:'district-smuggler',female:'district-resident'};

 function defaults(lookId){
  const l=CAT.looks[lookId];
  return {v:1,base:l.base,look:lookId,hair:'native',hairColor:null,clothingColor:null,accessories:[...l.defaultAccessories]};
 }
 /* Why an appearance is not acceptable. Returns [] when valid. Never throws, whatever it is given. */
 function problems(a){
  const e=[];
  if(!a||typeof a!=='object'||Array.isArray(a))return ['appearance must be an object'];
  for(const k of Object.keys(a))if(!KEYS.includes(k))e.push('unknown field '+String(k).slice(0,30));
  if(a.v!==1)e.push('unsupported version');
  const idOk=v=>typeof v==='string'&&ID.test(v);
  if(!idOk(a.base)||!has(CAT.bases,a.base)){e.push('unknown base');return e;}
  if(!idOk(a.look)||!has(CAT.looks,a.look)){e.push('unknown look');return e;}
  const look=CAT.looks[a.look];
  if(look.base!==a.base)e.push('look does not belong to this base');
  if(a.hair!=='native'&&a.hair!=='none'){
   if(!idOk(a.hair)||!has(CAT.hair,a.hair))e.push('unknown hairstyle');
   else if(!look.hairOk.includes(a.hair))e.push('hairstyle does not fit this body');
  }
  if(a.hairColor!==null&&(!idOk(a.hairColor)||!CAT.hairColors.some(c=>c.id===a.hairColor)))e.push('unknown hair colour');
  if(a.clothingColor!==null&&(!idOk(a.clothingColor)||!CAT.clothingColors.some(c=>c.id===a.clothingColor)))e.push('unknown clothing colour');
  if(!Array.isArray(a.accessories)||a.accessories.length>8)e.push('accessories must be a short list');
  else{
   const seen=new Set();
   for(const x of a.accessories){
    if(!idOk(x)||!has(look.accessories,x))e.push('accessory not available on this look');
    else if(seen.has(x))e.push('duplicate accessory');
    seen.add(x);
   }
   // clipping rule: a hat cannot be worn over a hairstyle that is not made for it
   if(seen.has('hat')&&a.hair!=='native'&&a.hair!=='none'&&has(CAT.hair,a.hair)&&!CAT.hair[a.hair].hatOk)e.push('hat does not fit this hairstyle');
  }
  return e;
 }
 const validate=a=>problems(a).length===0;
 /* Always returns a valid appearance: the given one if valid, otherwise the fallback (never a half-repaired object). */
 function normalize(a,fallbackLook){
  if(validate(a)){
   return {v:1,base:a.base,look:a.look,hair:a.hair,hairColor:a.hairColor,clothingColor:a.clothingColor,accessories:[...a.accessories]};
  }
  return defaults(fallbackLook&&has(CAT.looks,fallbackLook)?fallbackLook:DEFAULT_LOOK.male);
 }
 /* Saved characters from before the creator are {gender, model}. They keep their look exactly. */
 function fromLegacy(c){
  if(!c||typeof c!=='object')return null;
  for(const [id,l] of Object.entries(CAT.looks))if(l.legacy&&l.legacy.gender===c.gender&&l.legacy.model===c.model)return defaults(id);
  return null;
 }
 /* What the older server record can carry: gender plus the preset that matches. Keeps old clients and old validation working. */
 function toLegacy(a){
  const look=CAT.looks[a.look],preset=look&&look.preset?a.look:DEFAULT_LOOK[a.base];
  return {gender:a.base,model:CAT.looks[preset].legacy.model};
 }
 /* The creator offers only what is valid together; this is the single place that decides. */
 function options(a){
  const look=CAT.looks[a.look],hat=a.accessories.includes('hat');
  return {
   looks:Object.entries(CAT.looks).filter(([,l])=>l.base===a.base).map(([id,l])=>({id,label:l.label})),
   hair:[{id:'native',label:'ORIGINAL',enabled:true},{id:'none',label:'NONE',enabled:true},...Object.entries(CAT.hair).map(([id,h])=>({id,label:h.label,enabled:look.hairOk.includes(id)&&(!hat||h.hatOk),reason:!look.hairOk.includes(id)?'does not fit this body':(hat&&!h.hatOk?'not with a hat':'')}))],
   hairColors:CAT.hairColors,clothingColors:CAT.clothingColors,
   accessories:Object.keys(look.accessories).map(id=>({id,label:CAT.accessories[id].label,enabled:true,gear:!!CAT.accessories[id].gear}))
  };
 }
 /* Uniform scale that brings a body whose bind-pose height is `topY` to the standard height of its base. */
 const heightScale=(base,topY)=>CAT.bases[base].height/topY;
 const eyeHeight=base=>CAT.bases[base].eyeHeight;

 /* Local persistence. `storage` is anything with getItem/setItem (localStorage in the game, a plain object in tests). Keyed by account id or 'guest'. */
 const KEY='void-runner-appearance:';
 function load(storage,owner,legacyCharacter){
  try{const raw=storage.getItem(KEY+(owner||'guest'));if(raw){const a=JSON.parse(raw);if(validate(a))return normalize(a);}}catch(e){}
  return fromLegacy(legacyCharacter);   // nothing saved yet: an old character keeps its look; null means "never created"
 }
 function save(storage,owner,a){
  if(!validate(a))return false;
  try{storage.setItem(KEY+(owner||'guest'),JSON.stringify(normalize(a)));return true;}catch(e){return false;}
 }
 const api={CATALOG:CAT,DEFAULT_LOOK,defaults,problems,validate,normalize,fromLegacy,toLegacy,options,heightScale,eyeHeight,load,save,KEY};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VoidCharacterAppearance=api;
})(typeof globalThis!=='undefined'?globalThis:this);
