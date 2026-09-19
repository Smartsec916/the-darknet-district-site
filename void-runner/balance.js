/* Runtime values change only at a flight boundary. NORMAL preserves existing tuning. */
(function(root){
 const spec=typeof module!=='undefined'?(require('./balance-data.js'),globalThis.VoidBalanceSpec):root.VoidBalanceSpec;
 const defaults=Object.freeze(Object.fromEntries(Object.entries(spec).map(([k,s])=>[k,s.value])));
 const values={...defaults};
 function validate(input){
  if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid balance values.');
  const result={...defaults};
  for(const [k,v]of Object.entries(input)){const s=spec[k];if(!s||typeof v!=='number'||!Number.isFinite(v)||v<s.min||v>s.max)throw Error('Invalid balance value: '+k);result[k]=v;}
  return result;
 }
 function preset(name){const v={...defaults};if(name==='EASY'){v.enemyHull*=.75;v.enemyLaserDamage*=.6;v.enemyFireRate*=.75;v.enemyAccuracy=.75;}else if(name==='HARD'){v.enemyHull*=1.5;v.enemyLaserDamage*=1.4;v.enemyFireRate*=1.25;}else if(name!=='NORMAL')throw Error('Unknown preset.');return v;}
 const api={spec,defaults,values,validate,preset,apply(input){Object.assign(values,validate(input));}};
 if(typeof module!=='undefined')module.exports=api;else {root.VoidBalance=api;root.VOID_BALANCE=values;}
})(globalThis);
