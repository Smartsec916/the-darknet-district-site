const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=f=>path.join(__dirname,'..',f),S=require(R('void-runner/consumable-spec.js')),C=require(R('void-runner/consumables.js'));
test('the shipped seed is valid and matches the JSON the server reads',()=>{assert.deepEqual(C.problems(C.seed()),[]);assert.deepEqual(JSON.parse(fs.readFileSync(R('void-runner/consumable-seed.json'),'utf8')),C.seed());});
test('every effect type builds a valid default effect',()=>{for(const t of Object.keys(S.effects)){assert.deepEqual(C.effectProblems(C.newEffect(t),t),[],t);}});
test('out of range, unknown and unsupported values are refused',()=>{
 const e=C.newEffect('motionTrails');assert.deepEqual(C.effectProblems({...e,intensity:3},'x'),[]);assert.ok(C.effectProblems({...e,intensity:3.01},'x').length);assert.ok(C.effectProblems({...C.newEffect('audioVolume'),intensity:1.01},'x').length);assert.ok(C.effectProblems({...e,params:{...e.params,length:5}},'x').length);
 assert.ok(C.effectProblems({...e,extra:1},'x').length);assert.ok(C.effectProblems({...e,fadeIn:60,fadeOut:60,duration:30},'x').length);
 assert.ok(C.modifierProblems({stat:'meleeEffectiveness',amount:.1,delay:0,duration:5},'m')[0].includes('not available'));
 assert.ok(C.modifierProblems({stat:'walkSpeed',amount:.9,delay:0,duration:5},'m').length);assert.deepEqual(C.modifierProblems({stat:'walkSpeed',amount:.2,delay:0,duration:5},'m'),[]);});
test('items and vendors are checked together',()=>{const c=C.seed();assert.deepEqual(C.problems(c),[]);
 const bad=C.clone(c);bad.vendors[0].entries[0].price=-1;assert.ok(C.problems(bad).length);
 const dup=C.clone(c);dup.items.push(C.clone(dup.items[0]));assert.ok(C.problems(dup).some(x=>x.includes('share the id')));
 const unk=C.clone(c);unk.vendors[0].entity='nowhere';assert.ok(C.problems(unk).length);
 const html=C.clone(c);html.items[0].name='<b>x</b>';assert.ok(C.problems(html).length);});
test('vendor listing uses the vendor price and stock, and hides retired items',()=>{const c=C.seed();c.items.push({...C.newItem('x-pill','X pill'),status:'published'});
 c.vendors[0].entries.push({...C.newVendorEntry('x-pill',33),stock:3,maxStock:3});const l=C.listing(c,'shop-here',null,0);assert.equal(l.entries.find(e=>e.item==='x-pill').price,33);
 c.items.find(it=>it.id==='x-pill').status='retired';assert.ok(!C.listing(c,'shop-here',null,0).entries.some(e=>e.item==='x-pill'));assert.equal(C.listing(c,'nowhere',null,0),null);});
test('restocking adds the amount per interval, never above max',()=>{const en={...C.newVendorEntry('a',1),stock:1,maxStock:4,restock:{mode:'interval',every:60,amount:2}};
 assert.equal(C.restocked(en,{remaining:1,at:0,base:1},130).remaining,4);assert.equal(C.restocked(en,{remaining:1,at:0,base:1},59).remaining,1);assert.equal(C.restocked(en,{remaining:0,at:0,base:9},5).remaining,1);});
test('use returns published definitions only',()=>{const c=C.seed();assert.equal(C.use(c,'sprint-tonic').modifiers.length,2);assert.equal(C.use(c,'nothing'),null);c.items[0].status='draft';assert.equal(C.use(c,'sprint-tonic'),null);});
test('the vendor registry names real game sellers, and kiosks are the three planned',()=>{assert.equal(S.vendorRegistry.filter(v=>v.kind==='kiosk').length,3);assert.equal(S.vendorRegistry.filter(v=>v.kind==='vending').length,3);});

test('published items can reference packaged artwork and sounds',()=>{
 const c=C.seed();Object.assign(c.items[0],{image:'assets/textures/store/shelf.png',purchaseSound:'assets/audio/shop/paid.ogg',useSound:'assets/audio/shop/open.mp3'});
 assert.deepEqual(C.problems(c),[]);c.items[0].image='outside.png';assert.ok(C.problems(c).length);
});
test('gameplay layers honor faded health recovery, capped intensity, extension and expiry',()=>{
 const R=require('../void-runner/consumable-renderer.js'),mod={stat:'healthRecovery',amount:.04,fadeIn:10,fadeOut:5,delay:0,duration:20};
 const a={startedAt:10,gain:2,extension:5,until:35,definition:{modifiers:[mod]}};
 assert.deepEqual(R.sample([a],15).modifiers,{healthRecovery:.04});assert.deepEqual(R.sample([a],34).modifiers,{healthRecovery:.016});assert.deepEqual(R.sample([a],35).modifiers,{});
 assert.deepEqual(C.modifierProblems(mod,'m'),[]);
 assert.ok(C.modifierProblems({...mod,fadeOut:18},'m').length);
});
test('a sprint reserve only limits speed while a stamina modifier is active; perception retains wall checks',()=>{
 const explorer=require('../void-runner/exploration-controller.js');
 const char=()=>({x:0,y:1.68,z:0,yaw:0,stamina:.02}),player=char(),input={x:0,z:1,run:true},world={bounds:[100,100],solids:[],interactions:[]};
 const old=global.VoidConsumableGame;
 try{global.VoidConsumableGame={modifier:k=>k==='staminaDrain'?.2:k==='perception'?.5:0};
  for(let i=0;i<8;i++)explorer.step(player,input,.1,world);const a=char();global.VoidConsumableGame={modifier:()=>0};for(let i=0;i<8;i++)explorer.step(a,input,.1,world);assert.ok(a.z>player.z);assert.equal(a.stamina,undefined);
  const it={label:'Open',position:[0,1,2.5],range:2};world.interactions=[it];assert.equal(explorer.select(char(),world),null);
  global.VoidConsumableGame={modifier:k=>k==='perception'?.5:0};assert.equal(explorer.select(char(),world),it);
 }finally{global.VoidConsumableGame=old;}
});
test('published kiosk placements share the same named bay for signs, geometry and collision',()=>{
 const N=require('../void-runner/neochinatown.js'),c=C.seed(),v=c.vendors.find(v=>v.id==='kiosk-entrance');
 v.rules={slot:'shop-center',model:'assets/models/district-interior/district_arcade_change_1m.glb',screen:'#bd53ff'};v.name='Night Market';
 assert.deepEqual(C.problems(c),[]);const old=global.VoidNPCServices;
 try{global.VoidNPCServices={kiosks:c.vendors.filter(v=>v.kind==='kiosk')};const zone=N.layout('interior'),k=zone.kiosks.find(k=>k.id===v.id);assert.equal(k.kit,'arcade_change_1m');assert.equal(k.screen,'#bd53ff');
  const target=zone.interactions.find(i=>i.id===v.id),solid=zone.solids.find(i=>i.id===v.id);assert.equal(target.label,'SHOP · NIGHT MARKET');
  assert.deepEqual([solid.position[0],solid.position[2]],N.toWorld(k.x,k.z));assert.deepEqual([target.position[0],target.position[2]],N.toWorld(k.x,k.z+.48));
  const original=N.configuredKiosks([]).find(row=>row.id===v.id);assert.notEqual(original.x,k.x);
  v.rules.slot='kiosk-far-2';assert.ok(C.problems(c).includes('Two kiosks occupy the same bay'));v.rules.slot='through-a-wall';assert.ok(C.problems(c).some(e=>e.includes('District kiosk bay')));
 }finally{global.VoidNPCServices=old;}
});
