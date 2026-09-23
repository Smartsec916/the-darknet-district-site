/* Separate feedback timing from damage immunity, with a capped subtle pulse. */
const VoidCombatEffects={remaining:0,kind:'hull',pulse(kind){this.kind=kind;this.remaining=.22;},reset(){this.remaining=0;$('flash').style.opacity=0;},step(dt){this.remaining=Math.max(0,this.remaining-dt);},draw(){const el=$('flash');el.style.background=this.kind==='shield'?'radial-gradient(ellipse,transparent 35%,#48ceff 100%)':'radial-gradient(ellipse,transparent 25%,#ff183d 100%)';el.style.opacity=this.remaining?Math.min(reducedMotion?.08:.22,this.remaining):0;}};
/* Reused soft plasma sprites, shock rings and ballistic fragments in world space. */
VoidCombatEffects.clouds=[];
VoidCombatEffects.sprites=['#fff6ca','#ff943e','#6ecfff','#403b44'].map(color=>{
 const image=document.createElement('canvas');image.width=image.height=96;const g=image.getContext('2d'),r=g.createRadialGradient(48,48,0,48,48,48);r.addColorStop(0,color);r.addColorStop(.2,color+'e0');r.addColorStop(.6,color+'55');r.addColorStop(1,color+'00');g.fillStyle=r;g.fillRect(0,0,96,96);return image;
});
VoidCombatEffects.explode=function(position,kind='ship'){
 const size={impact:.7,missile:3,ship:5,large:10}[kind]||5,life=kind==='impact'?.3:kind==='large'?2.5:1.5;
 const particles=Array.from({length:reducedMotion?6:kind==='impact'?8:kind==='large'?48:28},(_,i)=>{const a=Math.random()*Math.PI*2,b=Math.random()*2-1,r=Math.sqrt(1-b*b),speed=(1.5+Math.random()*4)*size;return {vx:Math.cos(a)*r*speed,vy:b*speed,vz:Math.sin(a)*r*speed,scale:.2+Math.random()*.5,smoke:i%4===0};});
 this.clouds.push({...position,age:0,life,size,kind,particles});if(this.clouds.length>40)this.clouds.shift();
};
const feedbackReset=VoidCombatEffects.reset,feedbackStep=VoidCombatEffects.step;
VoidCombatEffects.reset=function(){feedbackReset.call(this);this.clouds=[];};
VoidCombatEffects.step=function(dt){feedbackStep.call(this,dt);if(mode!=='play')return;for(const e of this.clouds){e.age+=dt;if(flight.velocity)for(const axis of ['x','y','z'])e[axis]-=flight.velocity[axis]*dt;}this.clouds=this.clouds.filter(e=>e.age<e.life);};
VoidCombatEffects.drawExplosions=function(){
 ctx.save();for(const e of this.clouds){const t=e.age/e.life,center=flightPoint(e);if(center.z<=1)continue;
  ctx.globalCompositeOperation='lighter';if(t<.18){const r=Math.min(W*.2,center.s*e.size*(1+t*5));ctx.globalAlpha=(1-t/.18)*(reducedMotion?.2:.8);ctx.drawImage(this.sprites[0],center.x-r,center.y-r,r*2,r*2);}
  if(t<.7){const r=center.s*e.size*(1.2+t*2);ctx.globalAlpha=(1-t/.7)*.65;ctx.drawImage(this.sprites[1],center.x-r,center.y-r,r*2,r*2);}
  ctx.globalAlpha=(1-t)*.55;ctx.strokeStyle=e.kind==='impact'?'#7ad9ff':'#ffbd78';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(center.x,center.y,Math.min(W,center.s*e.size*(.5+t*8)),Math.min(H,center.s*e.size*(.3+t*4)),0,0,Math.PI*2);ctx.stroke();
  for(const p of e.particles){const q=flightPoint({x:e.x+p.vx*e.age,y:e.y+p.vy*e.age,z:e.z+p.vz*e.age});if(q.z<=1)continue;const r=Math.max(1,Math.min(200,q.s*e.size*p.scale*(p.smoke?1+t*3:1-t*.7)));ctx.globalCompositeOperation=p.smoke?'source-over':'lighter';ctx.globalAlpha=(1-t)*(p.smoke?.35:.8);ctx.drawImage(this.sprites[p.smoke?3:e.kind==='impact'?2:t<.2?0:1],q.x-r,q.y-r,r*2,r*2);if(!p.smoke){const trail=flightPoint({x:e.x+p.vx*Math.max(0,e.age-.08),y:e.y+p.vy*Math.max(0,e.age-.08),z:e.z+p.vz*Math.max(0,e.age-.08)});if(trail.z>1){ctx.globalAlpha=(1-t)*.9;ctx.strokeStyle=e.kind==='impact'?'#bcf3ff':'#ffe6a2';ctx.lineWidth=Math.max(1,Math.min(3,q.s*.1));ctx.beginPath();ctx.moveTo(trail.x,trail.y);ctx.lineTo(q.x,q.y);ctx.stroke();}}}
 }ctx.restore();
};
