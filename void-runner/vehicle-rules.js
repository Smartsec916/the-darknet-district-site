/* Drivable utility vehicle: pure rules (no rendering, no clock, no DOM). Runs in the browser (VoidVehicleRules) and in Node (tests/vehicle-rules.test.cjs).
   The browser side is vehicle.js. Everything here is in game metres; yaw 0 faces +z, forward is (sin yaw, cos yaw), right is (cos yaw, -sin yaw).
   - input: keyboard (W/S or Up/Down throttle and brake/reverse, A/D or Left/Right steer, Space handbrake, Shift boost) and a standard-mapping gamepad
     (RT throttle, LT brake/reverse, left stick or D-pad steer, right stick camera, the game's jump button (A / Cross) handbrake, RB boost,
     the game's interact button exits, R3 switches the camera, Menu pauses), with dead zones.
   - step(): arcade physics: speed, acceleration, braking, reversing, steering scaled down with speed, lateral grip (lower on the handbrake, so it slides),
     collision with the location's box solids and bounds as three circles along the body (stop or slide), and the body following the ground height
     with pitch and roll from four wheel samples. groundHeight defaults to flat ground (Vesper is flat today); a road module can supply its own.
   - enter / exit: enter only from on foot with the game's ordinary exploration controls (not during a menu, dialogue or cutscene); exit places the player
     beside the driver door, else the other door, the back or the front, at the first point clear of every solid.
   Look and numbers are reversible defaults (PROPOSED): MODEL, SPOTS and SPEC are plain data so they can be changed without touching the logic. */
(function(root){
 'use strict';
 const SPEC=Object.freeze({
  wheelbase:2.7,track:1.66,wheelR:.43,
  maxSpeed:15,boostSpeed:20,reverseSpeed:5.5,           // m/s (15 m/s = 54 km/h)
  accel:6.5,boostAccel:9,brake:14,reverseAccel:4.5,
  rolling:.45,drag:.03,                                  // coasting: a constant plus a share of speed
  handbrake:9,maxSteer:.6,steerRate:2.8,steerFalloff:11, // the steering angle at speed v is maxSteer / (1 + v / steerFalloff)
  grip:9,handbrakeGrip:1.4,
  circles:[-1.55,0,1.55],circleR:.95,                    // the body against solids: three circles along its length
  walkBoxes:[-1.6,0,1.6],walkHalf:.8,                    // the parked body as box solids for people on foot (ids start with SOLID_PREFIX)
  seat:[-.42,1.62,.35],                                  // the driver's eye, local (x right, y up, z forward)
  hood:[0,1.5,1.7],                                      // the second camera: just above the bonnet, in front of the windscreen
  door:[-1.75,1.4,.35],                                  // where the DRIVE prompt sits, beside the driver door
  exits:[[-1.75,.35],[1.75,.35],[0,-3.25],[0,3.25],[-2.6,.35],[2.6,.35],[0,-4.2],[0,4.2]],
  chase:{distance:6.6,height:1.5,minPitch:-.15,maxPitch:1.05,near:1.2},
  lowSolid:.3,highSolid:2.4                              // solids lower than this (kerbs, rugs) or starting higher (signs) do not stop the body
 });
 const MODEL=Object.freeze({id:'vehicle:utility',src:'assets/models/vehicles/utility-vehicle.glb',name:'UTILITY VEHICLE',spinSign:1,steerSign:-1});   // the glTF loader mirrors X, so the steering pivot turns the other way
 // Where the vehicle is parked when a location loads (reset on every load; nothing is saved). Vesper: in the open east of the workshop's right wall,
 // clear of the garage door (x -11..11 at z 0), the landing pad (x 1..23, z 13..37), the shooting lane (x 34..50) and Mara, the doors and the spawn.
 const SPOTS={vesper:{x:19.5,z:-8,yaw:0}};
 const SOLID_PREFIX='utility-vehicle-';
 const KEYS=Object.freeze({throttle:['KeyW','ArrowUp'],brake:['KeyS','ArrowDown'],left:['KeyA','ArrowLeft'],right:['KeyD','ArrowRight'],handbrake:['Space'],boost:['ShiftLeft','ShiftRight'],camera:['KeyC']});
 const DRIVE_KEYS=Object.freeze([...new Set(Object.values(KEYS).flat())]);
 const PAD=Object.freeze({throttle:7,brake:6,boost:5,camera:11,pause:9,left:14,right:15,triggerDeadZone:.06});

 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const approach=(a,b,d)=>a+Math.sign(b-a)*Math.min(Math.abs(b-a),Math.max(0,d));
 const dead=(value,threshold)=>{const n=Math.abs(value||0);return n<=threshold?0:Math.sign(value)*Math.min(1,(n-threshold)/(1-threshold));};
 const basis=yaw=>({fx:Math.sin(yaw),fz:Math.cos(yaw),rx:Math.cos(yaw),rz:-Math.sin(yaw)});
 function local(v,lx,lz){const b=basis(v.yaw);return {x:v.x+b.rx*lx+b.fx*lz,z:v.z+b.rz*lx+b.fz*lz};}

 const none=()=>({throttle:0,brake:0,steer:0,handbrake:false,boost:false,lookX:0,lookY:0});
 function keyboardInput(held){
  const has=list=>list.some(k=>held&&held.has(k));
  const i=none();i.throttle=has(KEYS.throttle)?1:0;i.brake=has(KEYS.brake)?1:0;i.steer=(has(KEYS.right)?1:0)-(has(KEYS.left)?1:0);i.handbrake=has(KEYS.handbrake);i.boost=has(KEYS.boost);return i;
 }
 const pressed=b=>!!b&&(b.pressed||b.value>.55);
 const value=b=>!b?0:typeof b.value==='number'?b.value:b.pressed?1:0;
 // A standard-mapping pad. opt: {bindings:{jump,interact}, leftDeadZone, rightDeadZone, triggerDeadZone, invertY}. buttons are this frame's raw states (edges: edges()).
 function gamepadInput(pad,opt={}){
  const i=none();i.buttons={exit:false,camera:false,pause:false};if(!pad)return i;
  const btn=pad.buttons||[],ax=pad.axes||[],bind=opt.bindings||{},tdz=opt.triggerDeadZone??PAD.triggerDeadZone;
  i.throttle=dead(value(btn[PAD.throttle]),tdz);i.brake=dead(value(btn[PAD.brake]),tdz);
  i.steer=clamp(dead(ax[0],opt.leftDeadZone??.16)+(pressed(btn[PAD.right])?1:0)-(pressed(btn[PAD.left])?1:0),-1,1);
  i.lookX=dead(ax[2],opt.rightDeadZone??.18);i.lookY=dead(ax[3],opt.rightDeadZone??.18)*(opt.invertY?-1:1);
  i.handbrake=pressed(btn[bind.jump??0]);i.boost=pressed(btn[PAD.boost]);
  i.buttons={exit:pressed(btn[bind.interact??2]),camera:pressed(btn[PAD.camera]),pause:pressed(btn[PAD.pause])};
  return i;
 }
 function combine(a,b){return {throttle:Math.max(a.throttle,b.throttle),brake:Math.max(a.brake,b.brake),steer:clamp(a.steer+b.steer,-1,1),handbrake:!!(a.handbrake||b.handbrake),boost:!!(a.boost||b.boost),lookX:(a.lookX||0)+(b.lookX||0),lookY:(a.lookY||0)+(b.lookY||0)};}
 function edges(prev,now){const out={};for(const k of Object.keys(now||{}))out[k]=!!now[k]&&!(prev&&prev[k]);return out;}

 function create(spot={x:0,z:0,yaw:0}){return {x:spot.x,z:spot.z,yaw:spot.yaw||0,vx:0,vz:0,steer:0,spin:0,y:0,pitch:0,roll:0,speed:0,blocked:false};}
 const forward=v=>{const b=basis(v.yaw);return v.vx*b.fx+v.vz*b.fz;};

 // Does the body at (x, z, yaw) overlap a solid or leave the area? world: {solids, bounds:[hx,hz], inBounds(x,z,r)?, ignore(id)?}
 function collides(x,z,yaw,world){
  const b=basis(yaw),R=SPEC.circleR,solids=world?.solids||[];
  for(const c of SPEC.circles){const cx=x+b.fx*c,cz=z+b.fz*c;
   if(world?.inBounds){if(!world.inBounds(cx,cz,R))return true;}
   else if(world?.bounds&&(Math.abs(cx)>world.bounds[0]-R||Math.abs(cz)>world.bounds[1]-R))return true;
   for(const s of solids){
    if(!s||s.open||String(s.id||'').startsWith(SOLID_PREFIX)||world.ignore?.(s))continue;
    const top=s.position[1]+s.size[1]/2,bottom=s.position[1]-s.size[1]/2;if(top<SPEC.lowSolid||bottom>SPEC.highSolid)continue;
    const dx=Math.max(Math.abs(cx-s.position[0])-s.size[0]/2,0),dz=Math.max(Math.abs(cz-s.position[2])-s.size[2]/2,0);
    if(dx*dx+dz*dz<R*R)return true;
   }
  }
  return false;
 }

 // The body on the ground: height from the four wheel contacts, nose-down pitch positive, right-side-up roll positive (Babylon's yaw/pitch/roll).
 function pose(v,groundHeight){
  const g=typeof groundHeight==='function'?groundHeight:()=>0,h=SPEC.wheelbase/2,t=SPEC.track/2;
  const at=(lx,lz)=>{const p=local(v,lx,lz);const y=Number(g(p.x,p.z));return Number.isFinite(y)?y:0;};
  const fl=at(-t,h),fr=at(t,h),rl=at(-t,-h),rr=at(t,-h);
  v.y=(fl+fr+rl+rr)/4;v.pitch=Math.atan2((rl+rr)/2-(fl+fr)/2,SPEC.wheelbase);v.roll=Math.atan2((fr+rr)/2-(fl+rl)/2,SPEC.track);
  return v;
 }

 // One frame. input from keyboardInput/gamepadInput/combine; world: {solids, bounds, inBounds?, ignore?, groundHeight?}.
 function step(v,input,dt,world={}){
  dt=clamp(Number(dt)||0,0,.1);const n=Math.max(1,Math.ceil(dt/(1/60))),h=dt/n,inp=input||none();
  const throttle=clamp(inp.throttle||0,0,1),brake=clamp(inp.brake||0,0,1),steerIn=clamp(inp.steer||0,-1,1);
  v.blocked=false;
  for(let k=0;k<n;k++){
   const b=basis(v.yaw);let fwd=v.vx*b.fx+v.vz*b.fz,lat=v.vx*b.rx+v.vz*b.rz;
   const vmax=inp.boost?SPEC.boostSpeed:SPEC.maxSpeed,acc=inp.boost?SPEC.boostAccel:SPEC.accel;
   const target=steerIn*SPEC.maxSteer/(1+Math.abs(fwd)/SPEC.steerFalloff);
   v.steer=approach(v.steer,target,SPEC.steerRate*h);
   if(throttle>0&&fwd>=-.5){if(fwd<vmax*throttle)fwd=Math.min(vmax*throttle,fwd+acc*throttle*(1-Math.max(0,fwd)/vmax*.6)*h);}
   else if(throttle>0)fwd=approach(fwd,0,SPEC.brake*throttle*h);                       // throttle while rolling back: brake first
   if(brake>0&&fwd>.5)fwd=approach(fwd,0,SPEC.brake*brake*h);
   else if(brake>0&&throttle===0)fwd=approach(fwd,-SPEC.reverseSpeed*brake,SPEC.reverseAccel*brake*h);   // stopped (or nearly): reverse
   if(!throttle&&!brake)fwd=approach(fwd,0,(SPEC.rolling+SPEC.drag*Math.abs(fwd))*h);
   if(fwd>vmax)fwd=approach(fwd,vmax,SPEC.brake*.3*h);                                  // boost released
   if(inp.handbrake)fwd=approach(fwd,0,SPEC.handbrake*h);
   lat*=Math.exp(-(inp.handbrake?SPEC.handbrakeGrip:SPEC.grip)*h);
   v.vx=b.fx*fwd+b.rx*lat;v.vz=b.fz*fwd+b.rz*lat;
   const yaw=v.yaw+fwd/SPEC.wheelbase*Math.tan(v.steer)*h;
   const nx=v.x+v.vx*h,nz=v.z+v.vz*h;
   if(!collides(nx,nz,yaw,world)){v.x=nx;v.z=nz;v.yaw=yaw;}
   else if(!collides(nx,nz,v.yaw,world)){v.x=nx;v.z=nz;}
   else if(!collides(nx,v.z,v.yaw,world)){v.x=nx;v.vz=0;v.vx*=.985;v.blocked=true;}   // slide along (the blocked axis stops, the free one keeps most of its speed)
   else if(!collides(v.x,nz,v.yaw,world)){v.z=nz;v.vx=0;v.vz*=.985;v.blocked=true;}
   else{v.vx=0;v.vz=0;v.blocked=true;}
   v.spin=(v.spin+forward(v)/SPEC.wheelR*h)%(Math.PI*2);
  }
  v.speed=forward(v);
  pose(v,world.groundHeight);
  return v;
 }

 // Walking players treat the parked body as three boxes (open while someone drives, so the driver's own seat is never inside a wall).
 function walkSolids(v,open=false){return SPEC.walkBoxes.map((c,i)=>{const p=local(v,0,c);return {id:SOLID_PREFIX+i,position:[p.x,1,p.z],size:[SPEC.walkHalf*2,2,SPEC.walkHalf*2],open:!!open};});}
 const seat=v=>{const p=local(v,SPEC.seat[0],SPEC.seat[2]);return {x:p.x,y:v.y+SPEC.seat[1],z:p.z};};
 const doorPoint=v=>{const p=local(v,SPEC.door[0],SPEC.door[2]);return [p.x,v.y+SPEC.door[1],p.z];};
 // blocked(x, z): the location's on-foot test (VoidExplorer.blocked with the parked body's walkSolids in place). null when every candidate is blocked.
 function exitPoint(v,blocked){
  for(const [lx,lz] of SPEC.exits){const p=local(v,lx,lz);if(!blocked(p.x,p.z))return {x:p.x,z:p.z,yaw:v.yaw};}
  return null;
 }

 // ctx: {mode, ui, busy, cutscene, driving}. The only gate: the game's ordinary on-foot state (mode 'walking' with exploration controls).
 function canEnter(ctx={}){
  if(ctx.driving)return {ok:false,reason:'driving'};
  if(ctx.mode!=='walking')return {ok:false,reason:'not-on-foot'};
  if(ctx.ui||ctx.cutscene||ctx.busy)return {ok:false,reason:'busy'};
  return {ok:true};
 }
 const canDrive=ctx=>!!ctx&&ctx.mode==='walking'&&!ctx.ui&&!ctx.cutscene;

 // Cameras. look: the player's own yaw / pitch (mouse or right stick). occluded(x, y, z): true inside something solid (pulls the chase camera in).
 function chaseCamera(v,look,occluded){
  const c=SPEC.chase,pitch=clamp(look.pitch,c.minPitch,c.maxPitch),yaw=look.yaw;
  const dx=Math.sin(yaw)*Math.cos(pitch),dy=-Math.sin(pitch),dz=Math.cos(yaw)*Math.cos(pitch);
  const tx=v.x,ty=v.y+c.height,tz=v.z;let d=c.distance;
  if(occluded)for(let s=c.near;s<=c.distance;s+=.25){if(occluded(tx-dx*s,ty-dy*s,tz-dz*s)){d=Math.max(c.near,s-.35);break;}}
  return {x:tx-dx*d,y:Math.max(v.y+.45,ty-dy*d),z:tz-dz*d,yaw,pitch,distance:d};
 }
 function hoodCamera(v,look){const p=local(v,SPEC.hood[0],SPEC.hood[2]);return {x:p.x,y:v.y+SPEC.hood[1],z:p.z,yaw:look.yaw,pitch:clamp(look.pitch,-.6,.8)};}
 const yawDelta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));

 const api={SPEC,MODEL,SPOTS,SOLID_PREFIX,KEYS,DRIVE_KEYS,PAD,dead,keyboardInput,gamepadInput,combine,edges,create,forward,collides,pose,step,walkSolids,seat,doorPoint,exitPoint,canEnter,canDrive,chaseCamera,hoodCamera,yawDelta,local,none};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.VoidVehicleRules=api;
})(globalThis);
