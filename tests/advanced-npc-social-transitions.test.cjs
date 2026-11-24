// Actual scene-transition adapter with mocked browser globals; not a networked or rendered scene test.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../void-runner/npc-escort-across.js'),'utf8');
async function transition(source,{social=true,kind='they-follow',to='oldtown',riding=false,area='avenue'}={}){
 const calls=[],events=[];let rules=0;
 const P={mode:'escort',social,kind,key:'leg',step:'session',area,set:{}};
 const npc={key:P.key,npc:'iris',here:true,x:3,z:4,yaw:1,phase:kind==='follow-them'?'walk':'follow',ride:riding?'in-cab':null};
 const root={
  VoidDistrictArea:{KEY:{street:'street',interior:'interior'}},
  VoidQuarters:{valid:()=>true},
  VoidNPCAreas:{here:(a,q)=>[q||a],areaOf:(p,fallback)=>p.x>=50?'oldtown':fallback,nearest:p=>p},
  VoidNPCPaths:{MOVABLE:{iris:{name:'Iris'}}},
  VoidStreetPair:{live:()=>({escort:{iris:npc}})},
  VoidRoadTaxi:{crossing:riding},
  VoidLiveContent:{plans:()=>({iris:P}),setCarry:(id,c)=>calls.push(c),onEscort:e=>events.push(e),replan:()=>{}},
  VoidNPCEscort:{CAB:new Set(),linkBetween:()=>({id:'gate',ends:{oldtown:{ahead:{x:100,z:0}}}}),arrival:()=>({x:100,z:0,yaw:0}),mayEnter:()=>({ok:true}),across:()=>{rules++;return {go:riding?'ride':'with'};}}
 };
 const enter=new Function('globalThis','document','walker','walkingLocation','enterWalking',source+'\nreturn enterWalking;')(root,{}, {x:1,z:1},{id:'neochinatown',area:'street',quarter:'avenue'},async()=>true);
 await enter(to==='apartment'?'apartment':'street',{quarter:to,spawn:to==='avenue'?[1,0,1]:[100,0,0]});
 return {calls,events,rules,log:root.VoidEscortAcross.log()};
}
test('ordinary follower waits at its last actual position when the player leaves through a gate',async()=>{
 const h=await transition(source);assert.equal(h.calls.length,1);assert.deepEqual(h.calls[0],{key:'session',area:'avenue',x:3,z:4,yaw:1,phase:'paused',ride:null});assert.equal(h.rules,0);assert.equal(h.log[0].go,'stay');
});
test('ordinary leader waits in the origin area instead of being carried ahead',async()=>{
 const h=await transition(source,{kind:'follow-them'});assert.equal(h.calls[0].area,'avenue');assert.equal(h.calls[0].phase,'wait');assert.equal(h.rules,0);
});
test('ordinary escort preserves its location on entering an unsupported interior',async()=>{
 const h=await transition(source,{to:'apartment'});assert.equal(h.calls.length,1);assert.equal(h.calls[0].area,'avenue');assert.equal(h.rules,0);
});
test('ordinary escort does not use the mission taxi carry adapter across areas',async()=>{
 const h=await transition(source,{riding:true});assert.equal(h.calls[0].area,'avenue');assert.equal(h.calls[0].ride,null);assert.equal(h.rules,0);
});
test('mission follower still uses the existing transfer policy',async()=>{
 const h=await transition(source,{social:false});assert.equal(h.rules,1);assert.equal(h.calls[0].area,'oldtown');assert.equal(h.calls[0].x,100);
});
test('same-area rebuild does not restart or carry the social escort',async()=>{
 const h=await transition(source,{to:'avenue'});assert.equal(h.calls.length,0);assert.equal(h.rules,0);
});
test('an escort whose plan belongs to another area is not carried from this scene',async()=>{
 const h=await transition(source,{area:'oldtown'});assert.equal(h.calls.length,0);assert.equal(h.rules,0);
});

// Exercise the same adapter with public registry geometry, including the space inside the scanner.
async function gateVisit({riding=false,seated=false,load=true,scanned=true,near=true,tier=2,from='avenue',to='oldtown'}={}){
 const E=require('../void-runner/npc-escort'),A=require('../void-runner/npc-areas'),Q=require('../void-runner/ncz-quarters'),X=require('../void-runner/npc-paths');
 const lane=Q.lane(riding?'north:bay-s':'north:foot-w'),link=E.linkById('gate:north:foot-w'),id='grey-reverie',session='social:'+id+':3';
 const actual={id:'neochinatown',area:'street',quarter:from},walker={x:lane.mid[0],z:lane.mid[1]},point=riding?walker:link.ends[from].wait;
 const plan={mode:'escort',social:true,key:session,step:session,kind:'they-follow',area:from,set:{}};
 const actor={key:session,here:true,npc:id,...point,x:near?point.x:point.x-25,yaw:0,phase:'follow',ride:seated?'in-cab':null};
 const policy={tier,enabled:true,session,leg:0,allowGate:(_id,_gate,a,b)=>[from,to].includes(a)&&[from,to].includes(b)};
 let arrival=null,stay=null;
 const root={VoidQuarters:Q,VoidNPCEscort:E,VoidNPCAreas:A,VoidNPCPaths:X,VoidDistrictArea:{KEY:{street:'street'}},
  VoidGateTransit:{busy:true,state:'EXCHANGE',lane:lane.key},
  VoidRoadTaxi:{crossing:riding},VoidStreetPair:{live:()=>({escort:{[id]:actor}})},
  VoidLiveContent:{plans:()=>({[id]:plan}),socialTravelPolicy:()=>tier>=2?policy:null,replan(){},setCarry:(_,c)=>stay=c,
   arriveSocial:(_id,key,origin,p)=>{assert.equal(key,session);assert.equal(origin,from);arrival=p;}}};
 const enter=new Function('globalThis','document','walker','walkingLocation','enterWalking',source+'\nreturn enterWalking;')(root,{},walker,actual,async()=>{if(load)actual.quarter=to;return load;});
 await enter('street',{quarter:to,spawn:[walker.x,1.7,walker.z],gateLane:scanned?lane.key:undefined});
 return {arrival,stay};
}
test('an opted-in advanced follower traverses an actual scanned gate in both directions',async()=>{
 for(const [from,to] of [['avenue','oldtown'],['oldtown','avenue']])assert.equal((await gateVisit({from,to})).arrival?.area,to);
 for(const args of [{load:false},{scanned:false},{near:false},{tier:1}])assert.equal((await gateVisit(args)).arrival,null);
});
test('only a seated advanced passenger transfers through a successful taxi bay exchange',async()=>{
 const ok=await gateVisit({riding:true,seated:true,tier:3});assert.equal(ok.arrival?.ride,'in-cab');assert.equal(ok.arrival.area,'oldtown');
 for(const args of [{seated:false},{seated:true,load:false},{seated:true,near:false},{seated:true,scanned:false}])assert.equal((await gateVisit({riding:true,...args})).arrival,null);
});


 // A gateLane option is only a destination hint, not proof of a live scanner exchange.
 async function checkedTransit(controller,riding=false){
  const lane={key:riding?'north:bay-s':'north:foot-w',gate:'north',kind:riding?'bay':'foot'},g={shut:false},id='iris',session='social:iris:1';
  const P={mode:'escort',social:true,key:session,step:session,kind:'they-follow',area:'avenue',set:{}};
  const L={id:'neochinatown',area:'street',quarter:'avenue'},walker={x:3,z:4},actor={npc:id,key:session,here:true,...walker,phase:'follow',ride:riding?'in-cab':null};
  const arrivals=[],stays=[];
  const root={VoidGateTransit:controller,VoidRoadTaxi:{crossing:riding},VoidDistrictArea:{KEY:{street:'street'}},
   VoidQuarters:{valid:()=>true,lane:()=>lane,gate:()=>g},
   VoidNPCAreas:{here:(_a,q)=>[q],areaOf:(_p,fallback)=>fallback},
   VoidNPCPaths:{MOVABLE:{iris:{name:'Iris'}}},VoidStreetPair:{live:()=>({escort:{iris:actor}})},
   VoidNPCEscort:{across:()=>{},linkBetween:()=>null,linkById:()=>({ends:{oldtown:{ahead:{x:10,z:4}}}}),mayEnter:()=>({ok:true}),
    socialGateLeg:()=>({via:'gate:'+lane.key}),socialGateCross:()=>({area:'oldtown',leg:0,x:10,z:4})},
   VoidLiveContent:{plans:()=>({iris:P}),socialTravelPolicy:()=>({session,leg:0,allowGate:()=>true}),setCarry:(_id,c)=>stays.push(c),arriveSocial:(_id,_key,_from,c)=>arrivals.push(c),replan(){}}
  };
  const enter=new Function('globalThis','document','walker','walkingLocation','enterWalking',source+'\nreturn enterWalking;')(root,{},walker,L,async()=>{L.quarter='oldtown';return true;});
  await enter('street',{quarter:'oldtown',spawn:[10,1.7,4],gateLane:lane.key});
  return {arrivals,stays};
 }
 test('social foot crossing requires the active scanner exchange for the exact lane',async()=>{
  const good={busy:true,state:'EXCHANGE',lane:'north:foot-w'};
  assert.equal((await checkedTransit(good)).arrivals.length,1);
  for(const controller of [undefined,{...good,busy:false},{...good,state:'SCAN'},{...good,state:'RECOVERY'},{...good,lane:'north:foot-e'}]){
   const result=await checkedTransit(controller);assert.equal(result.arrivals.length,0);assert.equal(result.stays.length,1);
  }
 });
 test('social taxi crossing also requires the active exchange for the exact bay',async()=>{
  const good={busy:true,state:'EXCHANGE',lane:'north:bay-s'};
  assert.equal((await checkedTransit(good,true)).arrivals.length,1);
  for(const controller of [undefined,{...good,busy:false},{...good,state:'SCAN'},{...good,state:'RECOVERY'},{...good,lane:'north:foot-w'}]){
   const result=await checkedTransit(controller,true);assert.equal(result.arrivals.length,0);assert.equal(result.stays.length,1);
  }
 });
