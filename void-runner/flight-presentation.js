/* Canvas presentation follows the active campaign hull. Replace procedural canopies here later. */
function drawShipCockpit(){
 const ship=(globalThis.VoidFlightCraft?.ship()||VoidShips.get(state));
 ctx.save();const advanced=ship.cockpit==='spectre',trim=advanced?'#7286a9':'#788582',accent=advanced?'#6eafcf':'#b77843';
 function shape(points,fill,stroke=trim,line=2){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0]*W,p[1]*H):ctx.moveTo(p[0]*W,p[1]*H));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=line;ctx.stroke();}}
 const shell=ctx.createLinearGradient(0,0,0,H);shell.addColorStop(0,'#1e292c');shell.addColorStop(.48,'#3b4140');shell.addColorStop(1,'#111b21');
 // Only the physical ribs and dashboard are drawn; the open aperture shows the live 3D scene.
 shape([[0,0],[.18,0],[.11,.10],[.08,.44],[.13,.70],[.25,.79],[.25,.83],[0,.83]],shell);
 shape([[1,0],[.82,0],[.89,.10],[.92,.44],[.87,.70],[.75,.79],[.75,.83],[1,.83]],shell);
 shape([[0,0],[1,0],[.84,.067],[.16,.067]],'#222c30',accent,3);
 shape([[.16,.066],[.175,.066],[.25,.79],[.235,.79]],'#485150','#12191d',2);
 shape([[.84,.066],[.825,.066],[.75,.79],[.765,.79]],'#485150','#12191d',2);
 shape([[0,.83],[.25,.78],[.37,.81],[.63,.81],[.75,.78],[1,.83],[1,1],[0,1]],'#1a2428',trim,3);
 shape([[.23,.81],[.37,.80],[.63,.80],[.77,.81],[.71,.95],[.29,.95]],'#303a3d','#11191c',3);
 shape([[.41,.88],[.59,.88],[.66,1],[.34,1]],'#151e22',accent,2);
 // Flush dark displays are ready for live navigation, targeting and ship-state UI.
 for(const side of [-1,1]){const x=side<0?.07:.78;
  shape([[x,.806],[x+.15,.806],[x+.13,.898],[x-.008,.898]],'#0b1318','#57676a',2);
  shape([[x+.012,.817],[x+.135,.817],[x+.119,.883],[x+.004,.883]],'#071119',null);
  shape([[x+.033,.932],[x+.13,.932],[x+.142,.98],[x+.022,.98]],'#101d22','#4b5a5b',1);
  for(let i=0;i<5;i++){ctx.fillStyle=i===0?accent:'#485457';ctx.fillRect(W*(x+.015+i*.025),H*.910,W*.012,H*.004);}
 }
 shape([[.385,.832],[.615,.832],[.605,.907],[.395,.907]],'#081218','#637275',2);
 for(const x of [.265,.735]){ctx.fillStyle='#9b8e75';ctx.fillRect(W*x,H*.814,Math.max(3,W*.004),Math.max(3,H*.006));}
 // Hardware seams and fasteners reinforce the worn, inexpensive Kestrel construction.
 for(const side of [-1,1])for(let i=0;i<6;i++){const x=(side<0?.039:.961)*W,y=(.14+i*.10)*H;ctx.fillStyle='#87908a';ctx.beginPath();ctx.arc(x,y,Math.max(1.5,W*.0015),0,Math.PI*2);ctx.fill();}
 ctx.strokeStyle='#090f11';ctx.lineWidth=3;for(const y of [.87,.925]){ctx.beginPath();ctx.moveTo(W*.25,H*y);ctx.lineTo(W*.75,H*y);ctx.stroke();}
 ctx.restore();
}
function hudText(id,value){const el=$(id);if(el.textContent!==value)el.textContent=value;}
function updateWarpHud(){const r=flight.route;if(!r)return;
 const alignment=FM.dot(flightBasis().f,r.vector),percent=Math.round(FM.clamp((alignment+1)/2,0,1)*100);
 const width=(r.progress*100).toFixed(1)+'%';if($('progress').style.width!==width)$('progress').style.width=width;
 hudText('route-status',Math.floor(r.progress*100)+'% / '+r.phase.toUpperCase());
 hudText('flight-objective',r.phase==='departure'?'DEPARTING / '+C.stations[r.origin].name:r.phase==='align'?(r.aligned>0?'WARP VECTOR LOCKED':'ALIGN WITH DESTINATION')+' · '+percent+'%':r.phase==='warp'?(r.policy?.kind==='interstellar'?'INTERSTELLAR JUMP / ':'IN-SYSTEM JUMP / ')+C.stations[r.destination].name:r.phase==='arrived'?'ARRIVAL / docking guidance':current.kind==='salvage'?'RECOVER SIGNALS '+objectiveCount+' / 3 · Clear hostiles to resume':current.kind==='escort'?'SHUTTLE '+escortHP+'% · Clear hostiles to resume':'INTERDICTION · HOSTILE ACTIVITY');
}
const navigationEdge={name:null,angle:0,last:0};
function drawNavigationEdge(vector,name,color='#ffe58b'){
 const edge=FM.arrow(vector,flightBasis(),W,H),now=performance.now();let angle=edge.angle;
 if(navigationEdge.name===name&&now-navigationEdge.last<1200&&!reducedMotion){const delta=Math.atan2(Math.sin(angle-navigationEdge.angle),Math.cos(angle-navigationEdge.angle));angle=navigationEdge.angle+delta*Math.min(1,Math.max(.08,(now-navigationEdge.last)/90));}
 navigationEdge.name=name;navigationEdge.angle=angle;navigationEdge.last=now;
 edge.x=W*.5+Math.cos(angle)*W*.38;edge.y=H*.44+Math.sin(angle)*H*.28;edge.angle=angle;
 ctx.save();ctx.translate(edge.x,edge.y);ctx.rotate(edge.angle);ctx.fillStyle='#07131c';ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(17,0);ctx.lineTo(-9,-9);ctx.lineTo(-5,0);ctx.lineTo(-9,9);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
 ctx.save();ctx.font='bold 12px Consolas';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#07131c';ctx.fillStyle=color;const label=(edge.behind?'BEHIND / ':'')+name;ctx.strokeText(label,edge.x,edge.y+25);ctx.fillText(label,edge.x,edge.y+25);ctx.restore();
}
function drawWarpMarker(){const r=flight.route;if(!r||r.phase!=='align')return;const p=flightPoint(flight.nav);
 const name=C.stations[r.destination].name.toUpperCase(),color='#ffe58b';
 if(p.z<1||p.x<W*.12||p.x>W*.88||p.y<H*.16||p.y>H*.72){drawNavigationEdge(flight.nav,name,color);return;}
 ctx.save();ctx.translate(p.x,p.y);ctx.shadowColor='#07131c';ctx.shadowBlur=12;ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-24);ctx.lineTo(24,0);ctx.lineTo(0,24);ctx.lineTo(-24,0);ctx.closePath();ctx.stroke();ctx.fillStyle=color;ctx.fillRect(-3,-3,6,6);ctx.font='bold 12px Consolas';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#07131c';ctx.strokeText(name,0,43);ctx.fillText(name,0,43);ctx.restore();
}
function drawWarpEffect(){const r=flight.route;if(!r||r.phase!=='warp')return;
 const slow=warpSpeed(r);drawWarpObjects(r,slow);
 ctx.save();ctx.globalAlpha=(reducedMotion?.12:.65)*slow;ctx.lineWidth=1.5;
 const cx=W*.5,cy=H*.44;
 for(let i=0;i<(reducedMotion?12:70);i++){const a=i*2.39996,n=((time*(.8+i%3*.1)+i*.137)%1),radius=20+n*Math.max(W,H),length=(30+n*140)*slow;ctx.strokeStyle=i%2?'#78fff0':'#ba7bff';ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*radius,cy+Math.sin(a)*radius);ctx.lineTo(cx+Math.cos(a)*(radius+length),cy+Math.sin(a)*(radius+length));ctx.stroke();}
 ctx.fillStyle='#6abfff';ctx.globalAlpha=.05;ctx.fillRect(0,0,W,H);ctx.restore();
}
addEventListener('pointerdown',()=>VoidAudio.unlock(),{passive:true});addEventListener('keydown',()=>VoidAudio.unlock());
addEventListener('pagehide',()=>VoidAudio.suspend());
document.addEventListener('visibilitychange',()=>{if(document.hidden)VoidAudio.suspend();});
const audioHurt=hurt;hurt=function(amount){const beforeHull=hp,beforeShield=shieldHP;audioHurt(amount);if(hp<beforeHull||shieldHP<beforeShield)VoidAudio.event(hp<beforeHull?'hull':'shield',(globalThis.VoidFlightCraft?.ship()||VoidShips.get(state)));};
