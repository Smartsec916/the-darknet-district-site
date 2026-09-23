/* Canvas presentation follows the active campaign hull. Replace procedural canopies here later. */
function drawShipCockpit(){
 const ship=VoidShips.get(state);if(ship.cockpit==='salvage'){if(cockpitArt.complete&&cockpitArt.naturalWidth)ctx.drawImage(cockpitArt,0,0,W,H);return;}
 ctx.save();const advanced=ship.cockpit==='spectre',c=ship.color;
 const metal=ctx.createLinearGradient(0,H*.73,0,H);metal.addColorStop(0,advanced?'#19203b':'#22383e');metal.addColorStop(1,'#040910');ctx.fillStyle=metal;ctx.strokeStyle=c;ctx.lineWidth=advanced?1:3;
 const paths=advanced?[[[0,0],[W*.12,0],[W*.05,H*.67],[W*.23,H*.85],[W*.77,H*.85],[W*.95,H*.67],[W*.88,0],[W,0],[W,H],[0,H]]]:[[[0,0],[W*.08,0],[W*.12,H*.65],[W*.3,H*.81],[W*.7,H*.81],[W*.88,H*.65],[W*.92,0],[W,0],[W,H],[0,H]]];
 for(const points of paths){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fill();ctx.stroke();}
 const deck=advanced?H*.91:H*.9;ctx.fillStyle='#071621';ctx.fillRect(W*.3,deck,W*.4,H-deck);ctx.strokeRect(W*.3,deck,W*.4,H-deck);
 for(const side of [.1,.78]){ctx.fillStyle='#08131d';ctx.fillRect(W*side,H*.79,W*.12,H*.1);ctx.strokeRect(W*side,H*.79,W*.12,H*.1);for(let i=0;i<5;i++){ctx.fillStyle=i%2?c:'#436678';ctx.fillRect(W*(side+.01),H*(.805+i*.014),W*(.035+i*.01),2);}}
 if(advanced){ctx.setLineDash([8,12]);ctx.strokeRect(W*.19,H*.12,W*.62,H*.62);ctx.setLineDash([]);}
 ctx.restore();
}
function hudText(id,value){const el=$(id);if(el.textContent!==value)el.textContent=value;}
function updateWarpHud(){const r=flight.route;if(!r)return;
 const alignment=FM.dot(flightBasis().f,r.vector),percent=Math.round(FM.clamp((alignment+1)/2,0,1)*100);
 const width=(r.progress*100).toFixed(1)+'%';if($('progress').style.width!==width)$('progress').style.width=width;
 hudText('route-status',Math.floor(r.progress*100)+'% / '+r.phase.toUpperCase());
 hudText('flight-objective',r.phase==='departure'?'DEPARTING / '+C.stations[r.origin].name:r.phase==='align'?(r.aligned>0?'WARP VECTOR LOCKED':'ALIGN WITH DESTINATION')+' · '+percent+'%':r.phase==='warp'?'WARP / '+C.stations[r.destination].name:r.phase==='arrived'?'ARRIVAL / docking guidance':current.kind==='salvage'?'RECOVER SIGNALS '+objectiveCount+' / 3 · Clear hostiles to resume':current.kind==='escort'?'SHUTTLE '+escortHP+'% · Clear hostiles to resume':'INTERDICTION · HOSTILE ACTIVITY');
}
function drawWarpMarker(){const r=flight.route;if(!r||r.phase!=='align')return;const p=flightPoint(flight.nav);
 if(p.z<1||p.x<W*.12||p.x>W*.88||p.y<H*.16||p.y>H*.72){cockpitArrow(flight.nav,'DESTINATION','#58ffe1');return;}
 ctx.save();ctx.translate(p.x,p.y);ctx.strokeStyle=r.aligned>0?'#ffdd8b':'#58ffe1';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-20);ctx.lineTo(20,0);ctx.lineTo(0,20);ctx.lineTo(-20,0);ctx.closePath();ctx.stroke();ctx.font='11px Consolas';ctx.textAlign='center';ctx.fillStyle=ctx.strokeStyle;ctx.fillText(C.stations[r.destination].name.toUpperCase(),0,39);ctx.restore();
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
const audioHurt=hurt;hurt=function(amount){const beforeHull=hp,beforeShield=shieldHP;audioHurt(amount);if(hp<beforeHull||shieldHP<beforeShield)VoidAudio.event(hp<beforeHull?'hull':'shield',VoidShips.get(state));};
