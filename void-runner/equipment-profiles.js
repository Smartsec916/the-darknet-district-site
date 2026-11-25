/* Optional presentation and response curves for built-in equipment. Old records use the original game rules. */
globalThis.VoidEquipmentFields = {
  "pulse": ["shieldScale","hullScale","damageCurve"],
  "wraith": ["shieldScale","hullScale","damageCurve"],
  "capacitor": ["capacity","recharge"],
  "pulseCoils": ["cost","heat","energyCurve"],
  "m1": ["shieldScale","hullScale","splashCurve","impactStyle","launchSound","impactSound"],
  "m2": ["shieldScale","hullScale","splashCurve","impactStyle","launchSound","impactSound"],
  "deflector": ["rechargeCurve","absorption"],
  "aegis": ["rechargeCurve","absorption"]
};
(function(root){
 'use strict';
 const fields=root.VoidEquipmentFields;
 const styles=['missile','large','impact'], launches=['missile','laser'], impacts=['explosion','hit','shieldHit'];
 function validate(profiles){
  if(!profiles||typeof profiles!=='object'||Array.isArray(profiles))throw Error('Expected equipment profiles.');
  for(const [id,options] of Object.entries(profiles)){
   if(!Object.hasOwn(fields,id)||!options||typeof options!=='object'||Array.isArray(options))throw Error('Unknown equipment profile.');
   for(const [key,value] of Object.entries(options)){
    if(!fields[id].includes(key))throw Error('Unsupported '+id+' setting '+key);
    let valid;
    if(key.endsWith('Curve'))valid=(typeof module!=='undefined'?require('./consumables.js'):root.VoidConsumables).validCurve(value);
    else if(key==='absorption')valid=Number.isFinite(value)&&value>=0&&value<=1;
    else if(['capacity','recharge','cost','heat','shieldScale','hullScale'].includes(key))valid=Number.isFinite(value)&&value>=0&&value<=({capacity:200,recharge:60,cost:4,heat:4,shieldScale:4,hullScale:4})[key];
    else valid=({impactStyle:styles,launchSound:launches,impactSound:impacts})[key]?.includes(value);
    if(!valid)throw Error('Invalid '+id+' '+key);
   }
  }
  return profiles;
 }
 const sample=(curve,t)=>(typeof module!=='undefined'?require('./consumable-renderer.js'):root.VoidConsumableRenderer).curveValue(curve,t);
 function splash(fraction,curve){return .5*(curve?sample(curve,fraction):Math.max(0,1-fraction));}
 function absorb(shield,damage,share=1){return Math.min(shield,damage*share);}
 function recharge(shield,capacity,amount,curve){return Math.min(capacity,shield+amount*(curve&&capacity?sample(curve,shield/capacity):1));}
 function damageLayers(shield,points,profile={}){
  const multiplier=profile.shieldScale??1;
  const absorbed=Math.min(shield,points*multiplier);
  const spent=multiplier?absorbed/multiplier:0;
  return {absorbed,hullDamage:Math.max(0,points-spent)*(profile.hullScale??1)};
 }
 const api={sample,damageLayers,fields,styles,launches,impacts,validate,splash,absorb,recharge};
 if(typeof module!=='undefined')module.exports=api;else root.VoidEquipmentProfiles=api;
})(globalThis);
