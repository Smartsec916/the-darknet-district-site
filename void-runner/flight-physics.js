/* Damped flight assistance: momentum without losing precise arcade aiming. */
(function(root){
 function reset(p){p.x=p.y=p.vx=p.vy=p.bank=p.pitch=0;}
 function step(p,input,dt,handling,bounds){
  if(!(dt>0))return;
  const speed=handling+2;
  let tx=0,ty=0;
  if(input.dx||input.dy){const length=Math.max(1,Math.hypot(input.dx,input.dy));tx=input.dx/length*speed;ty=input.dy/length*speed*(10/12);}
  else if(input.target){tx=Math.max(-speed,Math.min(speed,(input.target.x-p.x)*7));ty=Math.max(-speed*10/12,Math.min(speed*10/12,(input.target.y-p.y)*7));}
  const rate=(tx||ty?9:12)+(handling-10)*.3;
  const decay=Math.exp(-rate*dt),oldX=p.vx||0,oldY=p.vy||0;
  p.x+=tx*dt+(oldX-tx)*(1-decay)/rate;p.y+=ty*dt+(oldY-ty)*(1-decay)/rate;
  p.vx=tx+(oldX-tx)*decay;p.vy=ty+(oldY-ty)*decay;
  if(p.x>bounds.x){p.x=bounds.x;p.vx=Math.min(0,p.vx);}if(p.x< -bounds.x){p.x=-bounds.x;p.vx=Math.max(0,p.vx);}
  if(p.y>bounds.y){p.y=bounds.y;p.vy=Math.min(0,p.vy);}if(p.y< -bounds.y){p.y=-bounds.y;p.vy=Math.max(0,p.vy);}
  const blend=1-Math.exp(-9*dt);
  p.bank=(p.bank||0)+(p.vx/speed*.28-(p.bank||0))*blend;
  p.pitch=(p.pitch||0)+(p.vy/speed*.18-(p.pitch||0))*blend;
 }
 // Canvas sprites point up for the player and down for the enemy fleet.
 function facing(from,to,noseDown=false){const dx=to.x-from.x,dy=to.y-from.y;return Math.hypot(dx,dy)<.001?0:Math.atan2(dy,dx)+(noseDown?-Math.PI/2:Math.PI/2);}
 const api={reset,step,facing};if(typeof module!=='undefined')module.exports=api;else root.VoidFlightPhysics=api;
})(typeof globalThis!=='undefined'?globalThis:this);
