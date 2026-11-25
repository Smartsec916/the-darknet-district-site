// Seat geometry and the actual live-content planner, with deterministic local runtime state.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../void-runner/live-content.js'),'utf8');
const Q=require('../void-runner/ncz-quarters.js'),A=require('../void-runner/npc-areas.js'),T=require('../void-runner/road-taxi-rules.js');
const lane=Q.lane('north:bay-s'),cab={x:lane.mid[0],z:lane.mid[1],yaw:Math.PI},seat=T.companionSeat(cab),key='social:test:1';
const start=source.indexOf(' function socialCabPose('),end=source.indexOf(' function roomTick(');
const planner=source.slice(start<0?source.indexOf(' function socialPlan('):start,end);
function run({position=seat,ride='in-cab',actorKey=key,released=false,noJob=false,wrongCab=false,phase,carryArea=null,noPlan=false,mission=false,timeout=false}={}){
 const f={role:'follow',districtTravel:true,maxWait:120},s={phase:'active',generation:1,record:f,area:'oldtown',from:{x:52.8,z:-27.25},waitSince:timeout?Date.now()-121000:null};
 const actor={id:'test',...position,esc:{key:actorKey,ride}};
 const root={VoidNPCAreas:A,VoidNPCPaths:{MOVABLE:{test:{name:'Test'}}},VoidMadeNPCs:{live:()=>({people:[actor]})},VoidRoadTaxi:{world:{job:noJob?null:{cab:{...cab,phase,x:cab.x+(wrongCab?20:0)},released}}},VoidRoadTaxiRules:T};
 const old={key,area:'oldtown',mode:'escort',social:true,resume:null};
 const carry=carryArea?{test:{key,area:carryArea,x:position.x,z:position.z}}:{};
 const ended=[];
 const plan=new Function('root','social','env','carry','planCache','livePos','missionBusy','endSocial','socialTravelPolicy',planner+"\nreturn socialPlan('test');")(root,new Map([['test',s]]),{interactions:{test:{advanced:{follow:f}}}},carry,noPlan?{}:{test:old},()=>position,()=>mission,(_,why)=>ended.push(why),()=>({enabled:true,tier:2}));
 return {plan,ended};
}
test('actual taxi seat is outside the pedestrian grid but an active matching social passenger retains its source plan',()=>{
 assert.equal(A.areaOf(seat),null);
 const r=run();assert.equal(r.plan?.key,key);assert.equal(r.plan?.area,'oldtown');assert.deepEqual(r.ended,[]);
});
test('ordinary on-foot plan is unchanged',()=>{
 const r=run({position:{x:52.8,z:-27.25},ride:null,noJob:true});
 assert.equal(r.plan?.area,'oldtown');assert.deepEqual(r.ended,[]);
});
test('an off-grid actor without an actual matching seated taxi state cannot retain the plan',()=>{
 for(const opts of [{ride:null},{ride:'to-cab'},{actorKey:'social:test:0'},{released:true},{noJob:true},{wrongCab:true},{noPlan:true}]){
  const r=run(opts);assert.equal(r.plan,null);assert.deepEqual(r.ended,['preempt']);
 }
});
test('a conflicting carry area, mission preemption and expired invitation still take priority',()=>{
 for(const opts of [{carryArea:'avenue'},{mission:true},{timeout:true}]){
  const r=run(opts);assert.equal(r.plan,null);assert.deepEqual(r.ended,[opts.timeout?'timeout':'preempt']);
 }
});
test('a matching source carry remains attached to the retained plan without advancing the area',()=>{
 const r=run({carryArea:'oldtown'});assert.equal(r.plan?.resume?.area,'oldtown');assert.equal(r.plan?.area,'oldtown');assert.deepEqual(r.ended,[]);
});

test('the curb-to-door approach stays active only at a waiting cab',()=>{
 const door=T.doorPoints(cab)[0];
 assert.equal(run({position:door,ride:'to-cab',phase:'waiting'}).plan?.key,key);
 assert.equal(run({position:door,ride:'to-cab',phase:'to-dest'}).plan,null);
 assert.equal(run({position:door,ride:'to-cab',phase:'waiting',wrongCab:true}).plan,null);
});
