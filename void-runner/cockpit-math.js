/* Camera and swept collision math shared by the cockpit renderer and tests. */
(function(root){
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
 const length=a=>Math.hypot(a.x,a.y,a.z);
 const unit=a=>{const n=length(a)||1;return {x:a.x/n,y:a.y/n,z:a.z/n};};
 function basis(yaw,pitch,roll=0){
  const f={x:Math.sin(yaw)*Math.cos(pitch),y:Math.sin(pitch),z:Math.cos(yaw)*Math.cos(pitch)};
  const r={x:Math.cos(yaw),y:0,z:-Math.sin(yaw)},u={x:-Math.sin(yaw)*Math.sin(pitch),y:Math.cos(pitch),z:-Math.cos(yaw)*Math.sin(pitch)};
  return {f,r:{x:r.x*Math.cos(roll)+u.x*Math.sin(roll),y:r.y*Math.cos(roll)+u.y*Math.sin(roll),z:r.z*Math.cos(roll)+u.z*Math.sin(roll)},u:{x:u.x*Math.cos(roll)-r.x*Math.sin(roll),y:u.y*Math.cos(roll)-r.y*Math.sin(roll),z:u.z*Math.cos(roll)-r.z*Math.sin(roll)}};
 }
 function project(v,b,w,h){const x=dot(v,b.r),y=dot(v,b.u),z=dot(v,b.f),f=Math.min(w,h)*.82;return {x:w/2+x*f/Math.max(.1,z),y:h*.44+y*f/Math.max(.1,z),z,s:f/Math.max(.1,z),cx:x,cy:y};}
 function arrow(v,b,w,h){const p=project(v,b,w,h);let x=p.cx,y=p.cy;if(Math.hypot(x,y)<.01){x=1;y=0;}const a=Math.atan2(y,x),rx=w*.38,ry=h*.28;return {x:w/2+Math.cos(a)*rx,y:h*.44+Math.sin(a)*ry,angle:a,behind:p.z<=0};}
 function segmentHit(a,b,c,r){const d={x:b.x-a.x,y:b.y-a.y,z:b.z-a.z},q={x:c.x-a.x,y:c.y-a.y,z:c.z-a.z};const t=clamp(dot(q,d)/(dot(d,d)||1),0,1);return Math.hypot(a.x+d.x*t-c.x,a.y+d.y*t-c.y,a.z+d.z*t-c.z)<=r;}
 function steer(s,input,dt,handling=10){
  const gain=1+(handling-10)*.035,blend=1-Math.exp(-7*dt);
  s.yawRate+=(input.x*1.1*gain-s.yawRate)*blend;s.pitchRate+=(input.y*.9*gain-s.pitchRate)*blend;
  s.yaw+=s.yawRate*dt;s.pitch=clamp(s.pitch+s.pitchRate*dt,-1.48,1.48);
  s.roll+=(input.roll*.65-s.yawRate*.24-s.roll)*blend;s.throttle=clamp(s.throttle+input.throttle*dt*.5,.3,1.4);
 }
 const api={clamp,dot,length,unit,basis,project,arrow,segmentHit,steer};if(typeof module!=='undefined')module.exports=api;else root.VoidCockpitMath=api;
})(globalThis);
