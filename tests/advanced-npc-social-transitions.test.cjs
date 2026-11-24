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
