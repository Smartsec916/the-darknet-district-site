/* The LEDGER: the only thing allowed to say who owns what, and the only thing that changes ownership. The trade logic (trade.cjs) never
   touches a balance or an item; it asks a ledger. Any ledger must satisfy the contract in tests/helpers/ledger-contract.cjs:

     snapshot(uid)                      -> {credits, stacks:[{id,qty}], equipment:[serial], revision} of what the account may offer (tradable items only)
     check(uid, offer)                  -> {ok} | {ok:false, reason}    can this account cover this offer right now? (a quick check; settle checks again)
     settle({tradeId, a:{uid,offer}, b:{uid,offer}})
                                        -> {ok:true, record} | {ok:false, reason}
        ALL OR NOTHING: both sides are re-verified against the stored truth and both are changed together, or neither is. Calling it again with the
        same tradeId returns the first result and changes nothing (replay safe). Two settlements that need the same items cannot both succeed.

   Two implementations exist here:
     DisabledLedger    the production default: refuses everything. Real items and credits cannot move until a persistent, server-owned ledger is
                       approved and built (docs/development/TRADING_ARCHITECTURE.md).
     SimulatedLedger   in-memory, for local tests and the local test harness only: simulated inventories, one lock so settlements run one at a time,
                       an idempotency table, an append-only transaction log, and a fault-injection point to prove that a failure part-way leaves both
                       players exactly as they were. It never reads a save, Firestore, or any real account.                                          */
'use strict';
const {normalizeOffer,isEmpty,serialItem,CATALOG,isStack}=require('./trade-items.cjs');

class DisabledLedger{
 get enabled(){return false;}
 async snapshot(){return {credits:0,stacks:[],equipment:[],revision:0};}
 async check(){return {ok:false,reason:'trading is not enabled'};}
 async settle(){return {ok:false,reason:'trading is not enabled'};}
}

const clone=o=>JSON.parse(JSON.stringify(o));
class SimulatedLedger{
 /* inventories: {uid: {credits, stacks:{id:qty}, equipment:[serial]}}. `defaults(uid)` supplies an inventory for a uid not seen before. */
 constructor({inventories={},defaults=null,now=()=>Date.now(),newId=null}={}){
  this.accounts=new Map(Object.entries(inventories).map(([k,v])=>[k,{credits:0,stacks:{},equipment:[],revision:0,...clone(v)}]));
  this.defaults=defaults;this.now=now;this.log=[];this.results=new Map();this.tail=Promise.resolve();this.fault=null;this.seq=0;
 }
 get enabled(){return true;}
 get simulated(){return true;}
 account(uid){
  let a=this.accounts.get(uid);
  if(!a&&this.defaults){a={credits:0,stacks:{},equipment:[],revision:0,...clone(this.defaults(uid))};this.accounts.set(uid,a);}
  return a||null;
 }
 async snapshot(uid){
  const a=this.account(uid);if(!a)return {credits:0,stacks:[],equipment:[],revision:0};
  const stacks=Object.entries(a.stacks).filter(([id,q])=>q>0&&CATALOG[id]?.tradable).map(([id,qty])=>({id,qty})).sort((x,y)=>x.id<y.id?-1:1);
  const equipment=a.equipment.filter(s=>CATALOG[serialItem(s)]?.tradable).slice().sort();
  return {credits:a.credits,stacks,equipment,revision:a.revision};
 }
 /* Does `a` (an account record) cover `offer` (already normalised)? */
 covers(a,offer){
  if(!a)return {ok:false,reason:'unknown account'};
  if(offer.credits>a.credits)return {ok:false,reason:'not enough credits'};
  for(const s of offer.stacks)if((a.stacks[s.id]||0)<s.qty)return {ok:false,reason:'not enough '+CATALOG[s.id].name};
  for(const e of offer.equipment)if(!a.equipment.includes(e))return {ok:false,reason:'item not owned'};
  return {ok:true};
 }
 async check(uid,offer){const n=normalizeOffer(offer);if(!n.ok)return n;return this.covers(this.account(uid),n.offer);}

 /* Settlements run one at a time (a real ledger gets the same effect from a database transaction). */
 settle(req){const run=this.tail.then(()=>this._settle(req));this.tail=run.catch(()=>{});return run;}
 async _settle({tradeId,a,b}){
  if(typeof tradeId!=='string'||!/^[0-9a-f]{16,32}$/.test(tradeId))return {ok:false,reason:'bad trade id'};
  if(this.results.has(tradeId))return this.results.get(tradeId);            // replay: the first answer, nothing applied twice
  const fail=reason=>{const r={ok:false,reason};this.log.push({tradeId,at:this.now(),outcome:'refused',reason,parties:[a?.uid,b?.uid]});return r;};
  if(!a||!b||typeof a.uid!=='string'||typeof b.uid!=='string'||a.uid===b.uid)return fail('bad parties');
  const na=normalizeOffer(a.offer),nb=normalizeOffer(b.offer);if(!na.ok||!nb.ok)return fail((na.ok?nb:na).reason);
  if(isEmpty(na.offer)&&isEmpty(nb.offer))return fail('nothing offered');
  await Promise.resolve();                                                   // a real store is asynchronous: other requests may be waiting right here
  const A=this.account(a.uid),B=this.account(b.uid);
  const ca=this.covers(A,na.offer),cb=this.covers(B,nb.offer);if(!ca.ok)return fail(ca.reason);if(!cb.ok)return fail(cb.reason);
  // Work on copies; the live records are replaced only when everything has succeeded.
  const nextA=clone(A),nextB=clone(B);
  const give=(from,offer)=>{from.credits-=offer.credits;for(const s of offer.stacks){from.stacks[s.id]-=s.qty;if(!from.stacks[s.id])delete from.stacks[s.id];}for(const e of offer.equipment)from.equipment.splice(from.equipment.indexOf(e),1);};
  const take=(to,offer)=>{to.credits+=offer.credits;for(const s of offer.stacks)to.stacks[s.id]=(to.stacks[s.id]||0)+s.qty;to.equipment.push(...offer.equipment);};
  give(nextA,na.offer);give(nextB,nb.offer);take(nextA,nb.offer);take(nextB,na.offer);
  for(const x of [nextA,nextB]){if(!Number.isSafeInteger(x.credits)||x.credits<0)return fail('balance error');for(const q of Object.values(x.stacks))if(!Number.isSafeInteger(q)||q<0)return fail('balance error');if(new Set(x.equipment).size!==x.equipment.length)return fail('duplicate equipment');}
  if(this.fault==='before-commit'){this.fault=null;throw new Error('injected failure before commit');}
  nextA.revision=A.revision+1;nextB.revision=B.revision+1;
  this.accounts.set(a.uid,nextA);
  if(this.fault==='between-writes'){this.fault=null;this.accounts.set(a.uid,A);throw new Error('injected failure between writes');}   // proves a half-done trade is undone
  this.accounts.set(b.uid,nextB);
  const record={tradeId,at:this.now(),seq:++this.seq,a:{uid:a.uid,gave:na.offer,got:nb.offer},b:{uid:b.uid,gave:nb.offer,got:na.offer},outcome:'completed'};
  this.log.push(record);const result={ok:true,record:clone(record)};this.results.set(tradeId,result);return result;
 }
 /* Test helpers: totals across every account, to prove nothing is created or destroyed. */
 totals(){const t={credits:0,stacks:{},equipment:[]};for(const a of this.accounts.values()){t.credits+=a.credits;for(const [k,v] of Object.entries(a.stacks))t.stacks[k]=(t.stacks[k]||0)+v;t.equipment.push(...a.equipment);}t.equipment.sort();return t;}
}
module.exports={DisabledLedger,SimulatedLedger};
