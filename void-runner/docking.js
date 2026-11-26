/* Docking and departure movement for every station (docs/development/STATION_DOCKING.md). PURE: no game globals, no rendering; runs in Node for the tests.

   The ship is a body with mass: it keeps the velocity and attitude it arrives with, and thrust changes them gradually.
   - Linear: a desired velocity is worked out from where the ship is (a braking curve along the hangar's axis, a funnel that brings it onto the axis),
     the thrust needed to reach it is limited (maxAcceleration / maxDeceleration) and itself changes gradually (thrust builds and fades, it never steps).
   - Angular: attitude is a quaternion with an angular velocity; a torque-limited controller turns it the short way round and damps it to rest.
   - Fixed 1/120 s steps, so 30 and 144 frames a second give the same flight.
   Everything is in the DOCK FRAME, in the game's flight space: the docking point is the origin, +z is the way the ship faces when docked.
   Arrival: the ship comes in from -z and stops at the origin. Departure: it leaves the origin along +z.
   Configuration lives with the stations (station-layouts.js `docking`): defaults, per-station and per-ship values. */
(function(root){
 'use strict';
 const V=(x=0,y=0,z=0)=>({x,y,z}),add=(a,b)=>V(a.x+b.x,a.y+b.y,a.z+b.z),sub=(a,b)=>V(a.x-b.x,a.y-b.y,a.z-b.z),mul=(a,k)=>V(a.x*k,a.y*k,a.z*k),dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z,len=a=>Math.hypot(a.x,a.y,a.z);
 const cross=(a,b)=>V(a.y*b.z-a.z*b.y,a.z*b.x-a.x*b.z,a.x*b.y-a.y*b.x),unit=a=>{const n=len(a);return n>1e-9?mul(a,1/n):V(0,0,1);},clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const limit=(a,max)=>{const n=len(a);return n>max?mul(a,max/n):a;},smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
 // Quaternions [x,y,z,w].
 const qmul=(a,b)=>[a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]];
 const qconj=q=>[-q[0],-q[1],-q[2],q[3]],qnorm=q=>{const n=Math.hypot(q[0],q[1],q[2],q[3])||1;return [q[0]/n,q[1]/n,q[2]/n,q[3]/n];};
 const qrot=(q,v)=>{const u=V(q[0],q[1],q[2]),t=mul(cross(u,v),2);return add(add(v,mul(t,q[3])),cross(u,t));};
 // From three perpendicular axes (the columns r, u, f of the game's flight basis) and back.
 function qfromBasis(b){const m=[b.r.x,b.u.x,b.f.x,b.r.y,b.u.y,b.f.y,b.r.z,b.u.z,b.f.z],t=m[0]+m[4]+m[8];let q;
  if(t>0){const s=Math.sqrt(t+1)*2;q=[(m[7]-m[5])/s,(m[2]-m[6])/s,(m[3]-m[1])/s,s/4];}
  else if(m[0]>m[4]&&m[0]>m[8]){const s=Math.sqrt(1+m[0]-m[4]-m[8])*2;q=[s/4,(m[1]+m[3])/s,(m[2]+m[6])/s,(m[7]-m[5])/s];}
  else if(m[4]>m[8]){const s=Math.sqrt(1+m[4]-m[0]-m[8])*2;q=[(m[1]+m[3])/s,s/4,(m[5]+m[7])/s,(m[2]-m[6])/s];}
  else{const s=Math.sqrt(1+m[8]-m[0]-m[4])*2;q=[(m[2]+m[6])/s,(m[5]+m[7])/s,s/4,(m[3]-m[1])/s];}
  return qnorm(q);}
 const qbasis=q=>({r:qrot(q,V(1,0,0)),u:qrot(q,V(0,1,0)),f:qrot(q,V(0,0,1))});
 // The game's own angles (cockpit-math.js basis): yaw about the vertical, pitch, roll.
 function basisOf(yaw,pitch,roll=0){const f=V(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch)),r=V(Math.cos(yaw),0,-Math.sin(yaw)),u=V(-Math.sin(yaw)*Math.sin(pitch),Math.cos(pitch),-Math.cos(yaw)*Math.sin(pitch)),c=Math.cos(roll),s=Math.sin(roll);
  return {f,r:add(mul(r,c),mul(u,s)),u:sub(mul(u,c),mul(r,s))};}
 function anglesOf(q){const b=qbasis(q),pitch=Math.asin(clamp(b.f.y,-1,1)),yaw=Math.atan2(b.f.x,b.f.z),r0=V(Math.cos(yaw),0,-Math.sin(yaw)),u0=V(-Math.sin(yaw)*Math.sin(pitch),Math.cos(pitch),-Math.cos(yaw)*Math.sin(pitch));
  return {yaw,pitch,roll:Math.atan2(dot(b.r,u0),dot(b.r,r0))};}
 const qfromAngles=(yaw,pitch,roll)=>qfromBasis(basisOf(yaw,pitch,roll));
 // The short rotation from q to target, as an axis (world) and an angle.
 function turnTo(q,target){let e=qmul(target,qconj(q));if(e[3]<0)e=[-e[0],-e[1],-e[2],-e[3]];const s=Math.hypot(e[0],e[1],e[2]),angle=2*Math.atan2(s,e[3]);return {axis:s>1e-9?V(e[0]/s,e[1]/s,e[2]/s):V(0,1,0),angle};}
 function spin(q,w,h){const a=len(w)*h;if(a<1e-12)return q;const k=unit(w),s=Math.sin(a/2);return qnorm(qmul([k.x*s,k.y*s,k.z*s,Math.cos(a/2)],q));}

 const FALLBACK={approachSpeed:34,finalSpeed:5,finalDistance:9,departureSpeed:7,maxAcceleration:9,maxDeceleration:11,maxRotationSpeed:.6,angularAcceleration:.95,alignmentTolerance:.012,positionTolerance:.2,
  thrusterIntensity:1,safeDepartureDistance:15,cameraSmoothing:.35,transitionSeconds:1.2,startDistance:130,mouthDepth:11,funnel:.22,thrustRise:.22,departureTurn:.28,settleSeconds:.35};
 /* The values for one docking: station defaults, then that station's, then that ship's; a hull's own flight figures scale thrust and turning, so a
    heavy ship takes longer to stop and turn than a light one. table: station-layouts.js `docking`. flightStats: the hull's flight block (ships.js). */
 function resolve(table,station,ship,flightStats){
  const c={...FALLBACK,...(table?.defaults||{}),...(table?.stations?.[station]||{}),...(table?.ships?.[ship]||{})};
  if(flightStats){const push=clamp(Math.sqrt((flightStats.acceleration||10)/10)/Math.sqrt((flightStats.inertia||1.4)/1.4),.6,1.7),turn=clamp((flightStats.yawRate||1.1)/1.1,.7,1.5);
   c.maxAcceleration*=push;c.maxDeceleration*=push;c.angularAcceleration*=turn;c.maxRotationSpeed*=Math.sqrt(turn);}
  return c;
 }
 function make(kind,c,p,v,q,w){return {kind,config:c,p,v,q,w:w||V(),a:V(),alpha:V(),phase:kind==='arrival'?'approach':'release',t:0,phaseTime:0,clamp:kind==='arrival'?0:1,done:false,events:[],thrust:{forward:0,retro:0,right:0,up:0,yaw:0,pitch:0,roll:0},peak:{accel:0,jerk:0,spin:0}};}
 /* Arrival. p: the ship's place relative to the docking point; v: its velocity; q: its attitude; w: its angular velocity. Nothing is reset. */
 function beginArrival({config,p,v,q,w}){return make('arrival',config,{...p},{...v},q.slice(),w&&{...w});}
 /* Departure. handoffSpeed: the speed manual flight will hold when control returns; heading: the unit direction of the route (the ship turns part of
    the way toward it); q: the docked attitude. */
 function beginDeparture({config,q,handoffSpeed=14,heading=null}){const s=make('departure',config,V(),V(),q?q.slice():[0,0,0,1]);s.handoffSpeed=handoffSpeed;s.heading=heading&&unit(heading);s.out=qrot(s.q,V(0,0,1));return s;}

 function enter(s,phase){if(s.phase===phase)return;s.phase=phase;s.phaseTime=0;s.events.push(phase);}
 // One fixed step. want: desired velocity (or, with `thrust`, the acceleration asked for directly); brakeLimit: how hard it may slow down; target: desired attitude.
 function advance(s,h,want,target,brakeLimit,thrust=null){
  const c=s.config;
  // linear: the thrust that would reach the desired velocity in about half a second, limited, and eased in and out
  const dv=thrust||sub(want,s.v),slowing=dot(dv,s.v)<0;let cmd=thrust||mul(dv,1/.55);cmd=limit(cmd,slowing?brakeLimit:c.maxAcceleration);
  const k=1-Math.exp(-h/c.thrustRise),before=s.a;s.a=add(s.a,mul(sub(cmd,s.a),k));
  s.v=add(s.v,mul(s.a,h));s.p=add(s.p,mul(s.v,h));
  // angular: turn the short way, never faster than the hull can, and brake the turn in time to stop on the mark
  // (critically damped: the turn rate asked for falls with the angle left, so it comes to rest on the mark without swinging past it)
  const wr=1.35,e=turnTo(s.q,target),rate=Math.min(c.maxRotationSpeed,wr*.5*e.angle),wwant=mul(e.axis,rate);
  let acmd=limit(mul(sub(wwant,s.w),2*wr),c.angularAcceleration);s.alpha=add(s.alpha,mul(sub(acmd,s.alpha),1-Math.exp(-h/(c.thrustRise*.6))));
  s.w=add(s.w,mul(s.alpha,h));s.q=spin(s.q,s.w,h);
  s.peak.accel=Math.max(s.peak.accel,len(s.a));s.peak.jerk=Math.max(s.peak.jerk,len(sub(s.a,before))/h);s.peak.spin=Math.max(s.peak.spin,len(s.w));
  return e.angle;
 }
 function stepArrival(s,h){
  const c=s.config,ahead=-s.p.z,lateral=V(s.p.x,s.p.y,0),off=len(lateral),level=[0,0,0,1];
  if(s.phase==='approach'||s.phase==='final'){
   if(s.phase==='approach'&&ahead<=c.finalDistance+c.mouthDepth)enter(s,'final');
   // along the axis: cruise, then a braking curve down to the final speed. The curve is read a little ahead of the ship, because thrust takes time to build.
   const zone=c.finalDistance+c.mouthDepth,comfort=c.maxDeceleration*.5,lead=Math.max(0,ahead-Math.max(0,s.v.z)*.45);
   let along=lead>zone?Math.min(c.approachSpeed,Math.sqrt(c.finalSpeed*c.finalSpeed+2*comfort*(lead-zone))):c.finalSpeed;
   // the funnel: the farther off the axis for this distance, the slower it closes, so it is lined up before the mouth
   const allowed=1.2+c.funnel*Math.max(0,ahead-c.mouthDepth);if(off>allowed)along*=clamp(allowed/off,.12,1);
   // if it arrived too fast to stop at a comfortable rate, it may brake harder, up to three times
   const needed=ahead>1?Math.max(0,s.v.z)*Math.max(0,s.v.z)/(2*ahead):0,brake=clamp(Math.max(c.maxDeceleration,needed*1.15),c.maxDeceleration,c.maxDeceleration*3);
   // The thrust asked for: toward the cruise or braking speed, but never more than a critically damped approach to the mark allows. Far out the
   // second is far larger and the first rules; close in the second takes over and brings the ship to rest ON the mark, with no overshoot.
   const w0=1.2,wl=.6,soft=w0*w0*ahead-2*w0*s.v.z,az=Math.min((along-s.v.z)/.55,soft);
   const angle=advance(s,h,null,level,brake,V(-wl*wl*s.p.x-2*wl*s.v.x,-wl*wl*s.p.y-2*wl*s.v.y,az));
   if(Math.abs(s.p.z)<c.positionTolerance&&off<c.positionTolerance*2&&len(s.v)<.06&&angle<c.alignmentTolerance&&len(s.w)<.01)enter(s,'clamp');
  }else if(s.phase==='clamp'){
   // held: the last of the motion dies away as the clamps close
   advance(s,h,mul(s.p,-.8),level,c.maxDeceleration);s.clamp=smooth(s.phaseTime/c.transitionSeconds);
   if(s.phaseTime>=c.transitionSeconds+c.settleSeconds){s.clamp=1;enter(s,'docked');s.done=true;}
  }
 }
 function stepDeparture(s,h){
  const c=s.config,out=s.out,gone=dot(s.p,out),docked=qfromBasis(lookAlong(out,qrot(s.q,V(0,1,0))));
  if(s.phase==='release'){
   s.clamp=1-smooth(s.phaseTime/c.transitionSeconds);advance(s,h,V(),s.home||(s.home=s.q.slice()),c.maxDeceleration);
   if(s.phaseTime>=c.transitionSeconds){s.clamp=0;enter(s,'creep');}
  }else if(s.phase==='creep'){
   // out of the hangar under manoeuvring thrust only, held to the station's speed limit
   advance(s,h,mul(out,c.departureSpeed),s.home,c.maxDeceleration);
   if(gone>=c.mouthDepth+c.safeDepartureDistance)enter(s,'burn');
  }else if(s.phase==='burn'){
   // clear of the station: the main engine comes up, and the nose swings part of the way toward the route
   s.target??=turnToward(s.home,s.heading,c.departureTurn);
   const f=qrot(s.q,V(0,0,1));advance(s,h,mul(f,s.handoffSpeed),s.target,c.maxDeceleration);
   const along=dot(s.v,f),across=len(sub(s.v,mul(f,along)));
   if(Math.abs(along-s.handoffSpeed)<.25&&across<.6&&len(s.a)<.9&&turnTo(s.q,s.target).angle<.03&&len(s.w)<.03){enter(s,'free');s.done=true;}
  }
 }
 // Axes for a ship facing along f with its head as near `up` as it can be.
 function lookAlong(f,up){f=unit(f);let r=cross(up,f);if(len(r)<1e-6)r=cross(V(0,1,0),f);r=unit(r);return {f,r,u:cross(f,r)};}
 // An attitude turned from `home` toward a heading by at most `most` radians, stopping well short of pointing at it (the pilot still aligns the jump).
 function turnToward(home,heading,most){
  if(!heading)return home;const b=qbasis(home),angle=Math.acos(clamp(dot(b.f,heading),-1,1)),turn=Math.min(most,Math.max(0,angle-.2));if(turn<1e-4)return home;
  const axis=unit(cross(b.f,heading)),s=Math.sin(turn/2);return qnorm(qmul([axis.x*s,axis.y*s,axis.z*s,Math.cos(turn/2)],home));
 }
 /* Advances a docking by dt seconds of game time (any frame rate). Returns the state: p, v, q, w, a (linear acceleration), alpha (angular), phase,
    clamp (0 open to 1 closed), thrust (each jet, 0..1, in the ship's own axes), events (phase changes since the last call), done. */
 function step(s,dt){
  s.events.length=0;let left=clamp(Number.isFinite(dt)?dt:0,0,.25);
  while(left>1e-9&&!s.done){const h=Math.min(left,1/120);left-=h;s.t+=h;s.phaseTime+=h;if(s.kind==='arrival')stepArrival(s,h);else stepDeparture(s,h);}
  if(s.done){s.a=V();s.alpha=V();if(s.kind==='arrival'){s.v=V();s.w=V();}}
  // what each thruster is doing, from the acceleration the ship actually has
  const b=qbasis(s.q),c=s.config,la=V(dot(s.a,b.r),dot(s.a,b.u),dot(s.a,b.f)),ra=V(dot(s.alpha,b.r),dot(s.alpha,b.u),dot(s.alpha,b.f)),g=c.thrusterIntensity,T=s.thrust;
  T.forward=clamp(la.z/c.maxAcceleration,0,1)*g;T.retro=clamp(-la.z/c.maxDeceleration,0,1)*g;T.right=clamp(la.x/(c.maxAcceleration*.5),-1,1)*g;T.up=clamp(la.y/(c.maxAcceleration*.5),-1,1)*g;
  T.yaw=clamp(ra.y/c.angularAcceleration,-1,1)*g;T.pitch=clamp(ra.x/c.angularAcceleration,-1,1)*g;T.roll=clamp(ra.z/c.angularAcceleration,-1,1)*g;
  return s;
 }
 /* Where a station is drawn as the jump ends, so it arrives at the docking system's start with the speed the ship really has: distance to the station
    for u = 0 (first seen) to 1 (the jump ends), closing at `speed` at the end. far: the distance at first sight; seconds: how long the reveal lasts. */
 function reveal(u,{far=1500,near=230,speed=20,seconds=4}={}){u=clamp(u,0,1);const run=Math.min(speed*seconds,(far-near)*.8),k=1-u;return near+run*k+(far-near-run)*k*k*k;}

 const api={FALLBACK,resolve,beginArrival,beginDeparture,step,reveal,qfromAngles,qfromBasis,qbasis,anglesOf,basisOf,turnTo,qrot,math:{V,add,sub,mul,dot,len,unit,cross,clamp,smooth}};
 if(typeof module!=='undefined')module.exports=api;else root.VoidDocking=api;
})(globalThis);
