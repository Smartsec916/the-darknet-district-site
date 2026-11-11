const test=require('node:test'),assert=require('node:assert/strict');
const {SimulatedLedger,DisabledLedger}=require('../tools/district-hub/ledger.cjs'),{normalizeOffer,CATALOG,describe}=require('../tools/district-hub/trade-items.cjs'),{runContract}=require('./helpers/ledger-contract.cjs');

runContract({test,assert,make:inv=>new SimulatedLedger({inventories:inv}),faults:true});

test('the production ledger is the disabled one: nothing can move',async()=>{
 const l=new DisabledLedger();assert.equal(l.enabled,false);
 assert.deepEqual(await l.check('a',{credits:1,stacks:[],equipment:[]}),{ok:false,reason:'trading is not enabled'});
 assert.equal((await l.settle({tradeId:'0'.repeat(16)})).ok,false);assert.deepEqual(await l.snapshot('a'),{credits:0,stacks:[],equipment:[],revision:0});
});
test('offers are normalised: sorted, exact shape, tradable only',()=>{
 const n=normalizeOffer({credits:5,stacks:[{id:'scrap-plate',qty:2},{id:'data-core',qty:1}],equipment:['vector-bb01','pulse1-aa01']});
 assert.equal(n.ok,true);assert.deepEqual(n.offer.stacks.map(s=>s.id),['data-core','scrap-plate']);assert.deepEqual(n.offer.equipment,['pulse1-aa01','vector-bb01']);
 for(const bad of [{credits:1,stacks:[],equipment:[],x:1},{credits:1,stacks:[{id:'scrap-plate',qty:1,extra:1}],equipment:[]},{credits:1,stacks:[{id:'Scrap-Plate',qty:1}],equipment:[]},{credits:1,stacks:Array(9).fill({id:'x',qty:1}),equipment:[]},{credits:1,stacks:[],equipment:Array(9).fill('a')}])assert.equal(normalizeOffer(bad).ok,false);
 assert.match(normalizeOffer({credits:0,stacks:[{id:'contract-seal',qty:1}],equipment:[]}).reason,/Restricted/);
 assert.match(normalizeOffer({credits:0,stacks:[],equipment:['wraith-aa09']}).reason,/Purchased equipment/);
 const d=describe(n.offer);assert.equal(d.stacks[0].name,'Encrypted data core');assert.equal(d.equipment[0].name,'Pulse cannon Mk I');
 assert(Object.values(CATALOG).every(c=>c.tradable||c.why),'every item that cannot be traded says why');
});
