/* What can be offered in a player trade, and the one shape an offer may have. Pure; no storage, no network.
   This is the TRADE catalog: which item ids exist, their category, and whether they may change hands. It is not the game's equipment list,
   and nothing here reads or writes a save. Real ids are added only when a persistent, server-owned inventory exists (see
   docs/development/TRADING_ARCHITECTURE.md); until then the simulated ledger uses this catalog in local tests only.

   Three kinds of thing can be offered:
     credits    a whole number
     stacks     [{id, qty}]   salvage and ordinary inventory items that are counted (salvage from destroyed ships, med-gel, data cores...)
     equipment  [serial]      one-of-a-kind pieces of equipment and ship components, each with its own serial, so a piece can never exist twice   */
'use strict';

const LIMITS={maxCredits:1_000_000_000,maxStacks:8,maxQty:9999,maxEquipment:8};
const ID=/^[a-z][a-z0-9-]{1,31}$/,SERIAL=/^[a-z0-9]{3,16}-[0-9a-f]{4,12}$/;

/* tradable:false items can be held but never offered; `why` is what the player is told. Premium (purchased) equipment is bound to the
   account that bought it: the shop records it as an entitlement, and moving it would move a real-money purchase. */
const CATALOG={
 // salvage recovered from destroyed ships, and counted inventory
 'scrap-plate':{name:'Hull scrap',kind:'salvage',tradable:true},
 'drive-coil':{name:'Salvaged drive coil',kind:'salvage',tradable:true},
 'data-core':{name:'Encrypted data core',kind:'salvage',tradable:true},
 'med-gel':{name:'Med-gel canister',kind:'inventory',tradable:true},
 'ration-pack':{name:'Ration pack',kind:'inventory',tradable:true},
 // equipment and ship components (unique serials)
 'pulse1':{name:'Pulse cannon Mk I',kind:'component',tradable:true},
 'shield1':{name:'Shield generator Mk I',kind:'component',tradable:true},
 'vector':{name:'Vector thrusters',kind:'component',tradable:true},
 'scout':{name:'Scout sensor array',kind:'component',tradable:true},
 // held but never traded
 'ward-pistol':{name:'Ward pistol',kind:'equipment',tradable:false,why:'Personal weapons are bound to their owner.'},
 'wraith':{name:'Wraith hull (purchased)',kind:'premium',tradable:false,why:'Purchased equipment is bound to the account that bought it.'},
 'contract-seal':{name:'Contract seal',kind:'inventory',tradable:false,why:'Restricted: this item cannot change hands.'}
};
const STACK_KINDS=new Set(['salvage','inventory']),UNIQUE_KINDS=new Set(['component','equipment','premium','restricted']);
const isStack=id=>STACK_KINDS.has(CATALOG[id]?.kind),isUnique=id=>UNIQUE_KINDS.has(CATALOG[id]?.kind);
const serialItem=serial=>String(serial).split('-')[0];   // serials look like "pulse1-00a3f2": the part before the dash names the catalog item

const int=(v,max)=>Number.isSafeInteger(v)&&v>=0&&v<=max;
const emptyOffer=()=>({credits:0,stacks:[],equipment:[]});

/* Checks the SHAPE of an offer (not ownership: that is the ledger's job). Returns {ok, offer} with a normalised copy (sorted, merged) or {ok:false, reason}.
   Rejects anything unexpected rather than guessing: extra fields, floats, negatives, duplicates, unknown ids, non-tradable items. */
function normalizeOffer(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return {ok:false,reason:'bad offer'};
 const keys=Object.keys(raw).sort().join();if(keys!=='credits,equipment,stacks')return {ok:false,reason:'bad offer'};
 if(!int(raw.credits,LIMITS.maxCredits))return {ok:false,reason:'bad credits'};
 if(!Array.isArray(raw.stacks)||raw.stacks.length>LIMITS.maxStacks||!Array.isArray(raw.equipment)||raw.equipment.length>LIMITS.maxEquipment)return {ok:false,reason:'too many items'};
 const stacks=[],seen=new Set();
 for(const s of raw.stacks){
  if(!s||typeof s!=='object'||Object.keys(s).sort().join()!=='id,qty'||typeof s.id!=='string'||!ID.test(s.id)||!int(s.qty,LIMITS.maxQty)||s.qty<1)return {ok:false,reason:'bad item'};
  if(!CATALOG[s.id]||!isStack(s.id))return {ok:false,reason:'unknown item'};
  if(!CATALOG[s.id].tradable)return {ok:false,reason:CATALOG[s.id].why||'not tradable'};
  if(seen.has(s.id))return {ok:false,reason:'duplicate item'};seen.add(s.id);stacks.push({id:s.id,qty:s.qty});
 }
 const equipment=[],serials=new Set();
 for(const e of raw.equipment){
  if(typeof e!=='string'||!SERIAL.test(e)||serials.has(e))return {ok:false,reason:'bad equipment'};serials.add(e);
  const def=CATALOG[serialItem(e)];if(!def||!isUnique(serialItem(e)))return {ok:false,reason:'unknown equipment'};
  if(!def.tradable)return {ok:false,reason:def.why||'not tradable'};equipment.push(e);
 }
 stacks.sort((a,b)=>a.id<b.id?-1:1);equipment.sort();
 return {ok:true,offer:{credits:raw.credits,stacks,equipment}};
}
const isEmpty=o=>!o.credits&&!o.stacks.length&&!o.equipment.length;
const describe=(offer)=>({credits:offer.credits,stacks:offer.stacks.map(s=>({id:s.id,name:CATALOG[s.id].name,kind:CATALOG[s.id].kind,qty:s.qty})),
 equipment:offer.equipment.map(e=>({serial:e,id:serialItem(e),name:CATALOG[serialItem(e)].name,kind:CATALOG[serialItem(e)].kind}))});
module.exports={CATALOG,LIMITS,ID,SERIAL,normalizeOffer,emptyOffer,isEmpty,describe,isStack,isUnique,serialItem};
