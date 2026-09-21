/* Small fixed physics steps keep acceleration and damping consistent at 30–144 Hz. */
(function(root){
 const M=typeof module!=='undefined'?require('./cockpit-math.js'):root.VoidCockpitMath;
 function reset(s){s.velocity={x:0,y:0,z:0};s.yawRate=s.pitchRate=s.rollRate=0;}
 function step(s,input,dt,config,boost=false,engineTier=0){
  s.velocity??={x:0,y:0,z:0};s.rollRate??=0;
  let remaining=M.clamp(Number.isFinite(dt)?dt:0,0,.25);
  while(remaining>1e-8){const h=Math.min(remaining,1/120);remaining-=h;
   const gain=1+engineTier*.065;
   for(const [axis,key,limit] of [['yaw','x',config.yawRate],['pitch','y',config.pitchRate],['roll','roll',config.rollRate]]){
    const demand=M.clamp(input[key]||0,-1,1),rate=axis+'Rate',goal=demand*limit*gain;
    if(demand)s[rate]+=M.clamp(goal-s[rate],-config.angularAcceleration*h,config.angularAcceleration*h);
    else s[rate]*=Math.exp(-config.angularDamping*h);
    s[rate]=M.clamp(s[rate],-limit*gain,limit*gain);s[axis]+=s[rate]*h;
   }
   s.pitch=M.clamp(s.pitch,-1.48,1.48);s.yaw=(s.yaw+Math.PI*3)%(Math.PI*2)-Math.PI;
   if(!input.roll)s.roll*=Math.exp(-2*h);
   s.roll=M.clamp(s.roll,-1.2,1.2);s.throttle=M.clamp(s.throttle+(input.throttle||0)*h*.5,.3,1.4);
   const forward=M.basis(s.yaw,s.pitch,s.roll).f,max=config.maxSpeed*gain*(boost?config.boost:1),target=max*s.throttle/1.4;
   const speed=M.dot(s.velocity,forward),accel=(speed>target?config.braking:config.acceleration)/config.inertia;
   const next=speed+M.clamp(target-speed,-accel*h,accel*h),damping=Math.exp(-config.linearDamping*h);
   for(const a of ['x','y','z'])s.velocity[a]=forward[a]*next+(s.velocity[a]-forward[a]*speed)*damping;
   const length=M.length(s.velocity);if(length>max)for(const a of ['x','y','z'])s.velocity[a]*=max/length;
  }
  return s.velocity;
 }
 const api={reset,step};if(typeof module!=='undefined')module.exports=api;else root.VoidPilotFlight=api;
})(globalThis);
