/* Detailed fleet sprites use source rectangles, preserving the transparent atlas. */
const fleetTexture=texture('ships.png');
const fleetFrames={player:[0,0,627,565],raider:[627,0,627,605],interceptor:[0,570,627,684],gunship:[627,610,627,644]};
const wireframeShip=ship;
ship=function(x,y,z,size,color,rotation=0,kind='player'){
 const f=fleetFrames[kind]||fleetFrames.player,p=project(x,y,z);
 const width=p.s*size*4.2,height=width*f[3]/f[2];
 const combat=mode==='play'||mode==='pause';
 const flying=kind==='player'&&combat;
 let heading=rotation;
 if(combat){
  let aim=project(player.x,player.y,14);
  if(kind==='player'){
   aim=project(player.x,player.y,65);
   let nearest=Infinity;
   for(const enemy of enemies){const point=project(enemy.x,enemy.y,enemy.z),distance=Math.hypot(point.x-p.x,point.y-p.y);if(distance<nearest){nearest=distance;aim=point;}}
  }
  heading=VoidFlightPhysics.facing(p,aim,kind!=='player');
 }
 if(!fleetTexture.complete||!fleetTexture.naturalWidth){wireframeShip(x,y,z,size,color,heading);return;}
 const bank=flying?player.bank*(reducedMotion?.25:1):rotation;
 const pitch=flying?player.pitch*(reducedMotion?.25:1):0;
 ctx.save();ctx.translate(p.x,p.y);ctx.rotate(heading);ctx.scale(Math.cos(bank*1.4),1+pitch*.55);
 if(kind==='player'){
  const pulse=reducedMotion?1:1+Math.sin(time*24)*.12;
  for(const side of [-1,1]){const ex=side*width*.12,ey=height*.35;
   const glow=ctx.createRadialGradient(ex,ey,0,ex,ey,width*.16);glow.addColorStop(0,'#baffffe0');glow.addColorStop(.35,'#48e5ff75');glow.addColorStop(1,'#48e5ff00');ctx.fillStyle=glow;ctx.fillRect(ex-width*.17,ey-width*.17,width*.34,width*.34);
   ctx.fillStyle='#6deaff80';ctx.beginPath();ctx.ellipse(ex,ey+width*.06,width*.028,width*.1*pulse*(1+(flying?Math.hypot(player.vx,player.vy)/25:0)),0,0,Math.PI*2);ctx.fill();
  }
 }
 ctx.drawImage(fleetTexture,f[0],f[1],f[2],f[3],-width/2,-height/2,width,height);
 if(kind==='player'&&combat&&state.upgrades.guns){ctx.fillStyle='#bdff82';for(const side of [-1,1])ctx.fillRect(side*width*.34-2,-height*.12,4+state.upgrades.guns,15);}
 ctx.restore();
};
title();requestAnimationFrame(loop);
