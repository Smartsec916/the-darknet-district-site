// Seat geometry and the actual live-content planner, with deterministic local runtime state.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../void-runner/live-content.js'),'utf8');
const Q=require('../void-runner/ncz-quarters.js'),A=require('../void-runner/npc-areas.js'),T=require('../void-runner/road-taxi-rules.js');
const lane=Q.lane('north:bay-s'),cab={x:lane.mid[0],z:lane.mid[1],yaw:Math.PI},seat=T.companionSeat(cab),key='social:test:1';
const start=source.indexOf(' function socialCabPose('),end=source.indexOf(' function roomTick(');
const planner=source.slice(start<0?source.indexOf(' function socialPlan('):start,end);
function run({cabAt=cab,area='oldtown',position=T.companionSeat(cabAt),ride='in-cab',actorKey=key,released=false,exitSeat=null,noJob=false,wrongCab=false,phase,carryArea=null,noPlan=false,mission=false,timeout=false}={}){
 const f={role:'follow',districtTravel:true,maxWait:120},s={phase:'active',generation:1,record:f,area,from:{x:52.8,z:-27.25},waitSince:timeout?Date.now()-121000:null};
 const actor={id:'test',...position,esc:{key:actorKey,ride}};
 const root={VoidNPCAreas:A,VoidNPCPaths:{MOVABLE:{test:{name:'Test'}}},VoidMadeNPCs:{live:()=>({people:[actor]})},VoidRoadTaxi:{world:{job:noJob?null:{cab:{...cabAt,phase,x:cabAt.x+(wrongCab?20:0)},released,exitSeat}}},VoidRoadTaxiRules:T};
 const old={key,area,mode:'escort',social:true,resume:null};
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

// Every internal city vehicle bay in both directions, not just the original North Gate fixture.
for(const lane of Q.LANES){
 const gate=Q.gate(lane.gate),lo=gate.ends.lo?.quarter,hi=gate.ends.hi?.quarter;
 if(lane.kind!=='bay'||gate.shut||!lo||!hi||lo===hi)continue;
 for(const area of [lo,hi])test(`social taxi source authorization at ${lane.key} from ${area}`,()=>{
  const cabAt={x:lane.mid[0],z:lane.mid[1],yaw:Q.yawInto(gate.id,area)};
  assert.equal(A.areaOf(T.companionSeat(cabAt)),null,'actual companion seat is not a pedestrian position');
  const valid=run({cabAt,area});assert.equal(valid.plan?.key,key);assert.equal(valid.plan?.area,area);assert.deepEqual(valid.ended,[]);
  for(const invalid of [{actorKey:'social:test:0'},{released:true},{ride:null}]){
   const r=run({cabAt,area,...invalid});assert.equal(r.plan,null);assert.deepEqual(r.ended,['preempt']);
  }
 });
}

test('only the actual passenger may finish stepping out at the recorded arrival seat',()=>{
 assert.equal(run({released:true,exitSeat:seat}).plan?.key,key);
 for(const opts of [{actorKey:'other'},{ride:null},{exitSeat:{x:seat.x+15,z:seat.z}}])
  assert.equal(run({released:true,exitSeat:seat,...opts}).plan,null);
});
