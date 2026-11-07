/* The contract EVERY ledger must satisfy, simulated today and any persistent, server-owned ledger later. A real ledger is not accepted until it
   passes this same suite (against a test database, never production). `make(inventories)` returns a fresh ledger; `faults` says whether it can
   inject a failure part-way (the simulated one can; a database ledger proves the same thing with a transaction abort). */
'use strict';
const hex=n=>[...Array(n)].map(()=>Math.floor(Math.random()*16).toString(16)).join('');
const offer=(o={})=>({credits:0,stacks:[],equipment:[],...o});
const INV=()=>({
 alice:{credits:500,stacks:{'scrap-plate':10,'med-gel':3},equipment:['pulse1-aa01','shield1-aa02','ward-pistol-aa03'.replace('ward-pistol','wardpistol')]},
 bob:{credits:200,stacks:{'drive-coil':4,'scrap-plate':1},equipment:['vector-bb01']},
 carol:{credits:50,stacks:{},equipment:[]},
 dave:{credits:1000,stacks:{'data-core':2},equipment:['scout-dd01']}
});

function runContract({test,assert,make,faults=false}){
 const fresh=()=>make(INV());
 const bal=async(l,u)=>JSON.stringify(await l.snapshot(u));

 test('ledger: a snapshot lists only what may be offered',async()=>{
  const l=make({...INV(),eve:{credits:5,stacks:{'scrap-plate':2,'contract-seal':1},equipment:['pulse1-ee01','wraith-ee02']}});
  const s=await l.snapshot('eve');assert.deepEqual(s.stacks,[{id:'scrap-plate',qty:2}]);assert.deepEqual(s.equipment,['pulse1-ee01']);assert.equal(s.credits,5);
  assert.deepEqual(await l.snapshot('nobody-here'),{credits:0,stacks:[],equipment:[],revision:0});
 });
 test('ledger: a fair swap moves everything and nothing else, once',async()=>{
  const l=fresh(),before=l.totals?.(),id=hex(16);
  const r=await l.settle({tradeId:id,a:{uid:'alice',offer:offer({credits:100,stacks:[{id:'scrap-plate',qty:4}],equipment:['pulse1-aa01']})},b:{uid:'bob',offer:offer({credits:20,stacks:[{id:'drive-coil',qty:2}]})}});
  assert.equal(r.ok,true,JSON.stringify(r));
  const a=await l.snapshot('alice'),b=await l.snapshot('bob');
  assert.equal(a.credits,500-100+20);assert.equal(b.credits,200+100-20);
  assert.deepEqual(a.stacks,[{id:'drive-coil',qty:2},{id:'med-gel',qty:3},{id:'scrap-plate',qty:6}]);assert.deepEqual(b.stacks,[{id:'drive-coil',qty:2},{id:'scrap-plate',qty:5}]);
  assert(!a.equipment.includes('pulse1-aa01')&&b.equipment.includes('pulse1-aa01'));
  assert.equal(r.record.tradeId,id);assert.equal(r.record.outcome,'completed');
  if(before)assert.deepEqual(l.totals(),before,'nothing created or destroyed');
 });
 test('ledger: refuses what an account does not own, in every way',async()=>{
  const l=fresh(),snap={a:await bal(l,'alice'),b:await bal(l,'bob')};
  const bad=[['too many credits',{credits:501}],['too many of a stack',{stacks:[{id:'scrap-plate',qty:11}]}],['a stack it has none of',{stacks:[{id:'data-core',qty:1}]}],
   ['equipment it does not own',{equipment:['vector-bb01']}],['made-up equipment',{equipment:['pulse1-ffff']}],['negative credits',{credits:-5}],['fractional credits',{credits:1.5}],
   ['not-a-number credits',{credits:NaN}],['huge credits',{credits:2**60}],['zero quantity',{stacks:[{id:'scrap-plate',qty:0}]}],['negative quantity',{stacks:[{id:'scrap-plate',qty:-1}]}],
   ['fractional quantity',{stacks:[{id:'scrap-plate',qty:.5}]}],['the same stack twice',{stacks:[{id:'scrap-plate',qty:1},{id:'scrap-plate',qty:1}]}],['the same serial twice',{equipment:['pulse1-aa01','pulse1-aa01']}],
   ['an unknown item',{stacks:[{id:'plasma-rifle',qty:1}]}],['an item that cannot be traded',{stacks:[{id:'contract-seal',qty:1}]}],['premium equipment',{equipment:['wraith-aa09']}]];
  for(const [why,o] of bad){const r=await l.settle({tradeId:hex(16),a:{uid:'alice',offer:offer(o)},b:{uid:'bob',offer:offer({credits:1})}});assert.equal(r.ok,false,why);}
  assert.equal(await bal(l,'alice'),snap.a);assert.equal(await bal(l,'bob'),snap.b,'a refused trade changes nothing');
  for(const o of [null,undefined,'x',7,[],{credits:1},{credits:1,stacks:[],equipment:[],extra:1},{credits:'1',stacks:[],equipment:[]}]){const r=await l.settle({tradeId:hex(16),a:{uid:'alice',offer:o},b:{uid:'bob',offer:offer({credits:1})}});assert.equal(r.ok,false,JSON.stringify(o));}
 });
 test('ledger: the other side is verified too; a trade with nothing, with oneself, or with a bad id is refused',async()=>{
  const l=fresh();
  assert.equal((await l.settle({tradeId:hex(16),a:{uid:'alice',offer:offer({credits:1})},b:{uid:'carol',offer:offer({credits:51})}})).ok,false,'carol cannot cover 51');
  assert.equal((await l.settle({tradeId:hex(16),a:{uid:'alice',offer:offer()},b:{uid:'bob',offer:offer()}})).ok,false,'nothing offered');
  assert.equal((await l.settle({tradeId:hex(16),a:{uid:'alice',offer:offer({credits:1})},b:{uid:'alice',offer:offer({credits:1})}})).ok,false,'with oneself');
  for(const id of ['',undefined,'short','not hex not hex not hex!',123,'../etc'])assert.equal((await l.settle({tradeId:id,a:{uid:'alice',offer:offer({credits:1})},b:{uid:'bob',offer:offer({credits:1})}})).ok,false,String(id));
  assert.equal((await l.settle({tradeId:hex(16),a:{uid:'alice',offer:offer({credits:1})},b:{uid:'ghost',offer:offer({credits:1})}})).ok,false,'an unknown account');
  assert.equal((await l.settle({tradeId:hex(16),a:null,b:null})).ok,false);
 });
 test('ledger: a repeated trade id changes nothing the second time',async()=>{
  const l=fresh(),id=hex(16),req={tradeId:id,a:{uid:'alice',offer:offer({credits:100})},b:{uid:'bob',offer:offer({stacks:[{id:'drive-coil',qty:1}]})}};
  const first=await l.settle(req),mid=await bal(l,'alice');
  const again=await l.settle(req),third=await l.settle({...req,a:{uid:'alice',offer:offer({credits:400})}});
  assert.equal(first.ok,true);assert.deepEqual(again,first);assert.deepEqual(third,first,'the same id never applies different terms');assert.equal(await bal(l,'alice'),mid);
 });
 test('ledger: two trades that need the same item cannot both succeed',async()=>{
  const l=fresh();
  const rs=await Promise.all([l.settle({tradeId:hex(16),a:{uid:'alice',offer:offer({equipment:['pulse1-aa01']})},b:{uid:'bob',offer:offer({credits:10})}}),
   l.settle({tradeId:hex(16),a:{uid:'alice',offer:offer({equipment:['pulse1-aa01']})},b:{uid:'dave',offer:offer({credits:10})}}),
   l.settle({tradeId:hex(16),a:{uid:'carol',offer:offer({credits:10})},b:{uid:'alice',offer:offer({equipment:['pulse1-aa01']})}})]);
  assert.equal(rs.filter(r=>r.ok).length,1,JSON.stringify(rs.map(r=>r.ok||r.reason)));
  const owners=[];for(const u of ['alice','bob','carol','dave'])if((await l.snapshot(u)).equipment.includes('pulse1-aa01'))owners.push(u);assert.equal(owners.length,1,'exactly one owner: '+owners);
 });
 test('ledger: two trades that together overspend credits cannot both succeed',async()=>{
  const l=fresh();
  const rs=await Promise.all([l.settle({tradeId:hex(16),a:{uid:'carol',offer:offer({credits:40})},b:{uid:'alice',offer:offer({credits:1})}}),l.settle({tradeId:hex(16),a:{uid:'carol',offer:offer({credits:40})},b:{uid:'dave',offer:offer({credits:1})}})]);
  assert.equal(rs.filter(r=>r.ok).length,1);assert((await l.snapshot('carol')).credits>=0);
 });
 if(faults)test('ledger: a failure part-way leaves BOTH players exactly as they were',async()=>{
  for(const fault of ['before-commit','between-writes']){
   const l=fresh(),before=[await bal(l,'alice'),await bal(l,'bob')],tot=l.totals();l.fault=fault;
   await assert.rejects(l.settle({tradeId:hex(16),a:{uid:'alice',offer:offer({credits:100,equipment:['pulse1-aa01']})},b:{uid:'bob',offer:offer({stacks:[{id:'drive-coil',qty:2}]})}}),/injected/,fault);
   assert.deepEqual([await bal(l,'alice'),await bal(l,'bob')],before,fault+': nothing moved');assert.deepEqual(l.totals(),tot);
   const retry=await l.settle({tradeId:hex(16),a:{uid:'alice',offer:offer({credits:100})},b:{uid:'bob',offer:offer({credits:1})}});assert.equal(retry.ok,true,'the ledger still works afterwards');
  }
 });
 test('ledger: hundreds of random and concurrent trades never create, destroy, duplicate or overdraw anything',async()=>{
  const l=fresh(),users=['alice','bob','carol','dave'],tot0=l.totals?.();let ok=0;
  const rnd=n=>Math.floor(Math.random()*n),pick=a=>a[rnd(a.length)];
  const randomOffer=async u=>{const s=await l.snapshot(u),o=offer();if(Math.random()<.6)o.credits=rnd(s.credits+30);
   if(s.stacks.length&&Math.random()<.5){const st=pick(s.stacks);o.stacks=[{id:st.id,qty:1+rnd(st.qty+1)}];}if(s.equipment.length&&Math.random()<.4)o.equipment=[pick(s.equipment)];return o;};
  for(let round=0;round<30;round++){
   const batch=[];for(let k=0;k<10;k++){const [x,y]=[pick(users),pick(users)];batch.push((async()=>l.settle({tradeId:hex(16),a:{uid:x,offer:await randomOffer(x)},b:{uid:y,offer:await randomOffer(y)}}))());}
   ok+=(await Promise.all(batch)).filter(r=>r.ok).length;
   for(const u of users){const s=await l.snapshot(u);assert(s.credits>=0&&Number.isSafeInteger(s.credits));for(const st of s.stacks)assert(st.qty>0);assert.equal(new Set(s.equipment).size,s.equipment.length);}
  }
  assert(ok>5,'some trades should have been valid ('+ok+')');if(tot0)assert.deepEqual(l.totals(),tot0,'conservation: totals unchanged');
  const all=[];for(const u of users)all.push(...(await l.snapshot(u)).equipment);assert.equal(new Set(all).size,all.length,'no serial is held by two accounts');
 });
}
module.exports={runContract,hex,offer,INV};
