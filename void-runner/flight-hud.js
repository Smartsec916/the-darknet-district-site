/* Instruments only read simulation state; targeting.js remains the lock authority. */
const hudHeadingLabels=Array.from({length:72},(_,i)=>({angle:i*5,label:({0:'N',90:'E',180:'S',270:'W'})[i*5]||String(i*5).padStart(3,'0')}));
const hudBankTicks=[-180,-120,-90,-60,-30,0,30,60,90,120,180].map(deg=>({deg,a:deg*Math.PI/180}));
function hudLine(x,y,a,b){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(a,b);ctx.stroke();}
function drawFlightHud(){
 const data=VoidHudMath.read(flight,missileLock.target),cx=W*.5,cy=H*.44,small=W<650,unit=Math.min(W,H),span=Math.min(W*.25,210),color=(globalThis.VoidFlightCraft?.ship()||VoidShips.get(state)).id==='ship3'?'#a3deff':(globalThis.VoidFlightCraft?.ship()||VoidShips.get(state)).id==='ship2'?'#85f3ec':'#a1e9c6';
 ctx.save();ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=1;ctx.font=`${small?10:11}px Consolas`;ctx.textAlign='center';
 // Navigation reference heading: no magnetic compass is implied.
 const top=H*(small?.235:.19),step=Math.min(4,W/150);
 ctx.save();ctx.beginPath();ctx.rect(cx-span,top-20,span*2,48);ctx.clip();
 for(const tick of hudHeadingLabels){const offset=VoidHudMath.headingOffset(tick.angle,data.heading),x=cx+offset*step;if(Math.abs(offset*step)>span+20)continue;hudLine(x,top,x,top+(tick.angle%10?4:8));if(tick.angle%10===0)ctx.fillText(tick.label,x,top-6);}
 ctx.restore();hudLine(cx,top+11,cx-4,top+17);hudLine(cx,top+11,cx+4,top+17);ctx.fillText(String(Math.round(data.heading)%360).padStart(3,'0')+' REF',cx,top+30);
 // Pitch-positive means nose-up, opposite the engine's down-positive Y axis.
 ctx.save();ctx.beginPath();ctx.rect(cx-unit*.23,cy-unit*.18,unit*.46,unit*.36);ctx.clip();ctx.translate(cx,cy);ctx.rotate(-flight.roll);ctx.globalAlpha=.66;
 for(let mark=-90;mark<=90;mark+=10){if(Math.abs(data.pitch-mark)>45)continue;const y=VoidHudMath.ladderOffset(data.pitch,mark,unit*.45),gap=unit*.055,wing=unit*.13;
  ctx.setLineDash(mark<0?[4,4]:[]);hudLine(-wing,y,-gap,y);hudLine(gap,y,wing,y);ctx.setLineDash([]);hudLine(-wing,y,-wing,y+(mark<0?-4:4));hudLine(wing,y,wing,y+(mark<0?-4:4));ctx.fillText(mark>0?'+'+mark:String(mark),-wing-17,y+3);ctx.fillText(mark>0?'+'+mark:String(mark),wing+17,y+3);
 }
 ctx.restore();
 // Fixed full-circle scale with a moving bank pointer; flight controls retain their limits.
 const radius=unit*.05,bx=cx+span+unit*.06,by=H*.285;
 ctx.globalAlpha=.7;for(const tick of hudBankTicks){const a=tick.a;hudLine(bx+Math.sin(a)*radius,by-Math.cos(a)*radius,bx+Math.sin(a)*(radius+5),by-Math.cos(a)*(radius+5));}
 ctx.globalAlpha=1;const a=flight.roll;ctx.beginPath();ctx.moveTo(bx+Math.sin(a)*(radius-2),by-Math.cos(a)*(radius-2));ctx.lineTo(bx+Math.sin(a-.11)*(radius-10),by-Math.cos(a-.11)*(radius-10));ctx.lineTo(bx+Math.sin(a+.11)*(radius-10),by-Math.cos(a+.11)*(radius-10));ctx.closePath();ctx.stroke();ctx.fillText(Math.abs(data.bank).toFixed(0)+'° '+(Math.abs(data.bank)>150?'INV':Math.abs(data.bank)<1?'LVL':data.bank<0?'L':'R'),bx,by+4);
 // Boresight and compact measured telemetry; units are simulation units.
 hudLine(cx-17,cy,cx-6,cy);hudLine(cx+6,cy,cx+17,cy);hudLine(cx,cy+6,cx,cy+12);ctx.beginPath();ctx.arc(cx,cy,2,0,Math.PI*2);ctx.stroke();
 const side=Math.min(W*.32,unit*.35),left=cx-side,right=cx+side;
 ctx.textAlign='left';ctx.fillText('SPD '+data.speed.toFixed(1),left,cy-13);ctx.fillText('THR '+Math.round(flight.throttle*100)+'%',left,cy+3);ctx.fillText('P '+(data.pitch>0?'+':'')+data.pitch.toFixed(0)+'°',left,cy+19);
 ctx.textAlign='right';ctx.fillText('MSL '+missileState.missilesLoaded,right,cy-13);
 if(missileLock.target){ctx.fillText('RNG '+data.range.toFixed(0)+'u',right,cy+3);if(!small)ctx.fillText('CLS '+data.closing.toFixed(1)+'u/s',right,cy+19);}
 ctx.restore();
 drawInterdictionWarning();
}

/* Brief one-shot route-backed warning; never obstruct the ensuing fight. */
let interdictionAlertRoute=null,interdictionAlertState=null,interdictionAlertStart=0,interdictionAlertKind=null;
function drawInterdictionWarning(){
 const r=flight.route;
 const now=performance.now();
 const status=r?.policy?.interdiction&&r.encounter?.type==='combat'&&!r.encounter.evaded?r.encounter.state:null;
 if(interdictionAlertRoute!==r){interdictionAlertRoute=r;interdictionAlertState=null;interdictionAlertKind=null;}
 const active=status==='active'&&r.phase==='encounter';
 if(active&&interdictionAlertState!=='active'){interdictionAlertKind='active';interdictionAlertStart=now;}
 else if(status==='cleared'&&interdictionAlertState==='active'){interdictionAlertKind='cleared';interdictionAlertStart=now;}
 else if(!active&&status!=='cleared')interdictionAlertKind=null;
 interdictionAlertState=active?'active':status==='cleared'?'cleared':null;
 const age=now-interdictionAlertStart;
 if(!interdictionAlertKind||age>=3000)return;
 const cleared=interdictionAlertKind==='cleared',accent=cleared?'#70f5a7':'#ff686e';
 const cx=W*.5,y=H*(W<650?.145:.112),half=Math.min(W*.34,155),h=34;
 ctx.save();ctx.globalAlpha=age<2500?1:Math.max(0,(3000-age)/500);ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=1;
 ctx.fillStyle=cleared?'rgba(8,24,15,.88)':'rgba(24,8,13,.88)';ctx.strokeStyle=accent;
 ctx.beginPath();ctx.moveTo(cx-half,y-h/2);ctx.lineTo(cx+half-10,y-h/2);ctx.lineTo(cx+half,y-h/2+10);ctx.lineTo(cx+half,y+h/2);ctx.lineTo(cx-half+10,y+h/2);ctx.lineTo(cx-half,y+h/2-10);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle=accent;ctx.fillRect(cx-half+5,y-8,3,16);ctx.fillRect(cx+half-8,y-8,3,16);
 ctx.font='bold 14px Consolas';ctx.fillText(cleared?'INTERDICTION CLEAR':'INTERDICTED',cx,y-6);
 ctx.font='10px Consolas';ctx.fillText(cleared?'WARP DRIVE AVAILABLE':'HOSTILES IN RANGE',cx,y+8);
 ctx.restore();
}
