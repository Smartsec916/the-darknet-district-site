/* Shared exterior identity for departure, warp reveal and final approach. */
function warpSpeed(r){const c=VoidWarp.config,seconds=r.progress*c.warpSeconds;return Math.max(.12,Math.min(1,(c.warpSeconds-seconds)/c.decelerationSeconds));}
const warpObjects=Array.from({length:38},(_,i)=>({angle:i*2.39996,offset:(i*.6180339)%1,lane:.25+(i%7)*.14,size:.35+(i%4)*.23}));
function drawWarpObjects(r,speed){
 const c=VoidWarp.config,elapsedWarp=r.progress*c.warpSeconds,late=Math.max(0,elapsedWarp-(c.warpSeconds-c.decelerationSeconds)),seconds=elapsedWarp-.44*late*late/c.decelerationSeconds,cx=W*.5,cy=H*.44,focal=H*.68;
 ctx.save();
 // Rocks occupy near lanes: perspective expansion sends them outside the canopy.
 if(!reducedMotion)for(const o of warpObjects){const t=(seconds*.31+o.offset)%1,z=8+(1-t)*190,k=focal/z,rad=o.size*k,lane=o.lane*65;const x=cx+Math.cos(o.angle)*lane*k,y=cy+Math.sin(o.angle)*lane*k;
  if(x+rad<0||x-rad>W||y+rad<0||y-rad>H)continue;
  ctx.fillStyle='#5f6572';ctx.strokeStyle='#a0b7bc';ctx.lineWidth=1;ctx.beginPath();for(let j=0;j<7;j++){const a=j*Math.PI*2/7+o.angle,rr=rad*(j%2?.72:1);j?ctx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr):ctx.moveTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}ctx.closePath();ctx.fill();ctx.stroke();
 }
 // Celestial bodies remain distant, with slow parallax instead of near-rock motion.
 for(let i=0;i<2;i++){const t=(seconds*.035+i*.43)%1,z=2.8-t*1.8,rad=H*(i?.11:.19)/z,x=cx+(i?-1:1)*W*.76/z,y=H*(i?.24:.65);const g=ctx.createRadialGradient(x-rad*.35,y-rad*.3,rad*.02,x,y,rad);g.addColorStop(0,i?'#9589a7':'#5487a6');g.addColorStop(.65,i?'#4c425d':'#284864');g.addColorStop(1,'#060b18');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,rad,0,Math.PI*2);ctx.fill();}
 ctx.restore();
}
function drawTravelStation(){
 const r=flight.route;if(!r)return;const c=VoidWarp.config,seconds=r.progress*c.warpSeconds;
 if(r.phase!=='arrived'&&(r.phase!=='warp'||seconds<c.destinationRevealSeconds))return;
 const reveal=Math.max(0,Math.min(1,(seconds-c.destinationRevealSeconds)/(c.warpSeconds-c.destinationRevealSeconds)));
 const approach=r.phase==='arrived'?Math.min(1,approachTime/c.approachSeconds):0;
 // Continuous width at warp exit; no replacement station or scale jump.
 const width=W*(.012+.34*reveal*reveal+.40*approach*approach);
 ctx.save();drawStationExterior(r.destination,W*.5,H*.44,width);ctx.restore();
}
