/* Docking and departure movement (void-runner/docking.js): the ship keeps what it arrives with, changes it gradually, and ends exactly where it should. */
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const D=require('../void-runner/docking.js'),L=require('../void-runner/station-layouts.js'),Ships=require('../void-runner/ships.js');
const M=D.math,flightOf=id=>(Ships.ships?.[id]||Ships.get?.({ship:id})||{}).flight||{acceleration:10,inertia:1.4,yawRate:1.1};
const cfg=(station='meridian',ship='starter')=>D.resolve(L.docking,station,ship,flightOf(ship));
function fly(s,dt,limit=90){let t=0,minAhead=Infinity,maxStep=0,maxTurn=0,maxSpeed=0,prev=M.len(s.v),pq=s.q;const phases=[];
 while(!s.done&&t<limit){D.step(s,dt);t+=dt;minAhead=Math.min(minAhead,-s.p.z);const sp=M.len(s.v);maxStep=Math.max(maxStep,Math.abs(sp-prev)/dt);prev=sp;maxTurn=Math.max(maxTurn,D.turnTo(pq,s.q).angle/dt);pq=s.q;maxSpeed=Math.max(maxSpeed,sp);for(const e of s.events)phases.push(e);}
 return {t,minAhead,maxStep,maxTurn,maxSpeed,phases};}

test('every station and every hull has docking values, and overrides stack: defaults, station, ship',()=>{
 for(const id of L.meridianClass)assert(id in L.docking.stations,id);
 for(const key of ['approachSpeed','finalSpeed','departureSpeed','maxAcceleration','maxDeceleration','maxRotationSpeed','alignmentTolerance','thrusterIntensity','safeDepartureDistance','cameraSmoothing','transitionSeconds'])assert(Number.isFinite(L.docking.defaults[key]),key);
 assert.equal(cfg('vigil').finalSpeed,4);assert.equal(cfg('meridian').finalSpeed,L.docking.defaults.finalSpeed);
 assert(D.resolve(L.docking,'meridian','x',{acceleration:21,inertia:.8,yawRate:1.2}).maxAcceleration>D.resolve(L.docking,'meridian','x',{acceleration:10,inertia:1.4,yawRate:1.1}).maxAcceleration,'a lighter, stronger hull stops and starts sooner');
});
test('arrival keeps the position, velocity and attitude it starts with',()=>{
 const c=cfg(),q=D.qfromAngles(.5,.1,.2),s=D.beginArrival({config:c,p:{x:6,y:-2,z:-c.startDistance},v:{x:7,y:1,z:14},q});
 D.step(s,1/60);
 assert(Math.abs(s.p.x-6-7/60)<.01&&Math.abs(s.p.z+c.startDistance-14/60)<.01,'it moved on by its own velocity');assert(M.len(M.sub(s.v,{x:7,y:1,z:14}))<.05,'velocity carried over');assert(D.turnTo(q,s.q).angle<.001,'attitude carried over');
});
test('arrival ends at rest ON the mark, level, without passing it, from any angle and speed',()=>{
 for(const [p,v,ang] of [[{x:0,y:0,z:-130},{x:0,y:0,z:13.7},[0,0,0]],[{x:0,y:0,z:-130},{x:9,y:2,z:20},[.6,.1,.3]],[{x:35,y:-12,z:-150},{x:-6,y:0,z:55},[-2.6,-.3,0]],[{x:-20,y:8,z:-90},{x:0,y:0,z:0},[3.1,0,-.8]],[{x:0,y:0,z:-130},{x:0,y:0,z:-10},[1.2,.4,0]]]){
  const c=cfg(),s=D.beginArrival({config:c,p,v,q:D.qfromAngles(...ang)}),r=fly(s,1/60);
  assert(s.done,'docked '+JSON.stringify(ang));assert(M.len(s.p)<.35,'on the mark '+M.len(s.p));assert.equal(M.len(s.v),0);assert(D.turnTo(s.q,[0,0,0,1]).angle<.02,'level and straight');
  assert(r.minAhead>-.6,'never more than half a metre past the mark: '+r.minAhead);assert(r.t<45,'in reasonable time '+r.t);assert.equal(s.clamp,1);
  assert.deepEqual(r.phases.filter(e=>['final','clamp','docked'].includes(e)),['final','clamp','docked']);
 }
});
test('nothing snaps: speed and attitude change no faster than the thrust allows, and thrust itself builds gradually',()=>{
 const c=cfg(),s=D.beginArrival({config:c,p:{x:0,y:0,z:-c.startDistance},v:{x:9,y:2,z:20},q:D.qfromAngles(.6,.1,.3)}),r=fly(s,1/120);
 assert(r.maxStep<=c.maxDeceleration*3*1.05,'speed changes within the hardest braking allowed: '+r.maxStep);
 assert(r.maxTurn<=c.maxRotationSpeed*1.1,'turns no faster than the hull may: '+r.maxTurn);
 assert(s.peak.jerk<=c.maxDeceleration*3/c.thrustRise*1.05,'thrust eases in');
 // the last metres are slow
 const t=D.beginArrival({config:c,p:{x:0,y:0,z:-c.startDistance},v:{x:0,y:0,z:14},q:[0,0,0,1]});let inside=0;while(!t.done){D.step(t,1/60);if(-t.p.z<c.mouthDepth)inside=Math.max(inside,M.len(t.v));}
 assert(inside<=c.finalSpeed*1.05,'through the mouth at the final speed or less: '+inside);
});
test('the same flight at 24, 30, 60 and 144 frames a second',()=>{
 const run=dt=>{const c=cfg(),s=D.beginArrival({config:c,p:{x:10,y:0,z:-c.startDistance},v:{x:5,y:0,z:18},q:D.qfromAngles(.4,0,.1)});return fly(s,dt).t;},base=run(1/60);
 for(const fps of [24,30,144])assert(Math.abs(run(1/fps)-base)<.15,fps+' fps');
 const dep=dt=>{const s=D.beginDeparture({config:cfg(),handoffSpeed:13.7,heading:{x:.6,y:0,z:.8}});fly(s,dt);return s.p;},a=dep(1/30),b=dep(1/144);assert(M.len(M.sub(a,b))<.8,'departure path');
});
test('departure: held, released, a slow creep out of the hangar, then the engine comes up to exactly the speed manual flight holds',()=>{
 for(const ship of ['starter','ship2','ship3'])for(const station of ['meridian','vigil','foundry']){
  const c=cfg(station,ship),heading=M.unit({x:.65,y:-.1,z:.75}),s=D.beginDeparture({config:c,handoffSpeed:16.5,heading});let t=0,inHangar=0,first=null,held=0;
  while(!s.done&&t<60){D.step(s,1/60);t+=1/60;if(s.phase==='release')held=Math.max(held,M.len(s.v));if(s.p.z<c.mouthDepth+c.safeDepartureDistance)inHangar=Math.max(inHangar,M.len(s.v));first??=s.events.includes('creep')?t:null;}
  assert(s.done,ship+' at '+station);assert(held<.05,'does not move while clamped');assert(Math.abs(first-c.transitionSeconds)<.05,'released after the clamps open');
  assert(inHangar<=c.departureSpeed*1.06,'holds the station speed limit near the hangar: '+inHangar);
  const f=D.qrot(s.q,{x:0,y:0,z:1}),along=M.dot(s.v,f);assert(Math.abs(along-16.5)<.3,'hand-over speed '+along);assert(M.len(M.sub(s.v,M.mul(f,along)))<.7,'flying where it points');
  const turned=Math.acos(Math.min(1,f.z)),left=Math.acos(Math.min(1,M.dot(f,heading)));assert(turned<=c.departureTurn+.02,'turns only part of the way');assert(left>=.19,'the pilot still aligns the jump');assert.equal(s.clamp,0);
 }
});
test('the jump shows the station arriving at the speed the approach starts with',()=>{
 const plan={far:1500,near:130,speed:14,seconds:4};assert.equal(D.reveal(1,plan),130);assert.equal(D.reveal(0,plan),1500);
 assert(Math.abs((D.reveal(.999,plan)-D.reveal(1,plan))/(.001*plan.seconds)-plan.speed)<.2,'closing speed at the hand-over');
 let last=Infinity;for(let u=0;u<=1;u+=.02){const d=D.reveal(u,plan);assert(d<=last);last=d;}
});
test('the angles the game uses survive the trip through a quaternion',()=>{
 for(const a of [[.3,.2,.1],[-2.4,-.9,.7],[3,1.2,-1]]){const b=D.anglesOf(D.qfromAngles(...a));for(let i=0;i<3;i++)assert(Math.abs([b.yaw,b.pitch,b.roll][i]-a[i])<1e-6);}
});
test('the game calls the shared system and keeps its old timer for planets and as a fallback',()=>{
 const read=f=>fs.readFileSync(path.join(__dirname,'..','void-runner',f),'utf8');
 assert(read('cockpit.js').includes("const docked=globalThis.VoidDockingFlight?.arrivalStep(dt);if(docked===null||docked===undefined){alignDockingFlight(dt);return approachTime+dt>=VoidWarp.config.approachSeconds;}"));
 assert(read('world-integration.js').includes("&&!globalThis.VoidDockingFlight?.departureStep(dt)){const speed="));
 const glue=read('docking-flight.js');assert(glue.includes("!root.VoidUniverse?.planetside?.(id)"));assert(!/VoidPilotFlight\.step|hurt\(|C\.complete/.test(glue),'no flight-model, combat or campaign code');
});
