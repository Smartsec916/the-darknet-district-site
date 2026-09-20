/* Layered space environments. Foreground rocks are scenery, outside the flight lane. */
const skyboxes = {};
const artBase=new URL('art/',document.currentScript.src);
function texture(path){
 const img=new Image();
 const url=new URL(path,artBase).href;
 img.ready=new Promise(resolve=>{img.onload=()=>resolve(true);img.onerror=()=>{console.warn('[VOID//RUNNER] Asset failed to load: '+url);resolve(false);};});
 img.fetchPriority=['cockpit-kestrel.png','station.png','vesper-people.png'].includes(path)?'high':'low';
 img.src=url;return img;
}
for (const id of Object.keys(C.stations)) skyboxes[id] = texture('sky-' + id + '.png');
const stationTexture = texture('station.png');
const keplerStationTexture = texture('station-kepler.png');
const undertowStationTexture = texture('station-undertow.png');
function skyboxTransform(progress, width, height, imageWidth, imageHeight, still = reducedMotion) {
 const zoom = still ? 1.04 : 1.08 + Math.min(1, Math.max(0, progress)) * .14;
 const scale = Math.max(width / imageWidth, height / imageHeight) * zoom;
 return { width: imageWidth * scale, height: imageHeight * scale, zoom };
}
function drawDeepSpace(dest) {
 const img = skyboxes[dest]; if (!img?.complete || !img.naturalWidth) return;
 const flying = mode === 'play' || mode === 'pause';
 const t = skyboxTransform(flying ? elapsed / current.duration : 0, W, H, img.naturalWidth, img.naturalHeight);
 const driftX = reducedMotion ? 0 : Math.sin(time * .035) * W * .008 - player.x * .65;
 const driftY = reducedMotion ? 0 : Math.cos(time * .027) * H * .006 - player.y * .5;
 ctx.drawImage(img, (W-t.width)/2+driftX, (H-t.height)/2+driftY, t.width, t.height);
 ctx.fillStyle = '#02061024'; ctx.fillRect(0,0,W,H);
}

stationScene = function(color) {
 if ((mode==='play'||mode==='pause') && !destinationVisible()) return;
 const flying=mode==='play'||mode==='pause';
 const arrival=flying?Math.min(1,approachTime/3):1;
 const width=Math.min(W*(flying?.18+arrival*.58:.66),1200);
 const destination=flying?current.destination:state.location;
 if(destination==='undertow'&&undertowStationTexture.complete&&undertowStationTexture.naturalWidth){
  const height=width*undertowStationTexture.naturalHeight/undertowStationTexture.naturalWidth;
  ctx.save();ctx.globalAlpha=1;ctx.drawImage(undertowStationTexture,W*.69-width/2,H*.49-height/2,width,height);ctx.restore();return;
 }
 if(destination==='kepler'&&keplerStationTexture.complete&&keplerStationTexture.naturalWidth){
  const height=width*keplerStationTexture.naturalHeight/keplerStationTexture.naturalWidth;
  ctx.drawImage(keplerStationTexture,W*.69-width/2,H*.49-height/2,width,height);return;
 }
 if(destination==='foundry'){drawStationStructure(destination,W*.69,H*.49,width);return;}
 if(destination!=='meridian')return;
 if (!stationTexture.complete || !stationTexture.naturalWidth) return;
 const height=width*stationTexture.naturalHeight/stationTexture.naturalWidth;
 ctx.save(); ctx.globalAlpha=1; ctx.drawImage(stationTexture,W*.69-width/2,H*.49-height/2,width,height);ctx.restore();
};
// Distinct exterior silhouettes complement each station's illustrated concourse.
function drawStationStructure(id,x,y,width){
 ctx.save();ctx.translate(x,y);ctx.scale(width/800,width/800);
 const palette=['#635a51','#241d1b','#ff9a43'];
 const metal=ctx.createLinearGradient(0,-150,0,150);metal.addColorStop(0,palette[0]);metal.addColorStop(1,palette[1]);
 function box(bx,by,bw,bh){ctx.fillStyle=metal;ctx.strokeStyle=palette[0];ctx.lineWidth=2;ctx.fillRect(bx,by,bw,bh);ctx.strokeRect(bx,by,bw,bh);ctx.fillStyle=palette[2];for(let wx=bx+8;wx<bx+bw-5;wx+=14)ctx.fillRect(wx,by+bh*.45,5,3);}
   box(-280,15,540,55);box(-225,85,460,30);
   for(let i=0;i<5;i++){const bx=-230+i*108,top=-100-(i%2)*65;box(bx,top,42,115-top);box(bx-9,top-9,60,14);ctx.fillStyle='#ff9a4377';ctx.fillRect(bx+13,top+20,16,58);}
   for(let i=0;i<8;i++){ctx.strokeStyle='#b5964e';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-260+i*64,15);ctx.lineTo(-242+i*64,35);ctx.stroke();}
   ctx.strokeStyle='#967149';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(-285,-15);ctx.lineTo(-285,-110);ctx.lineTo(-120,-110);ctx.lineTo(-120,-72);ctx.stroke();
 ctx.restore();
}
const rockBelt = Array.from({length:24},(_,i)=>({x:(i%2?1:-1)*(19+(i*17%32)),y:Math.sin(i*3.9)*24,z:20+(i*41%240),size:1.5+(i%5)*.45,phase:i*2.3}));
function asteroidPosition(rock,travel){return {x:rock.x,y:rock.y,z:8+((rock.z-travel)%260+260)%260};}
function drawAsteroids(){
 if(mode!=='play'&&mode!=='pause')return;
 const travel=elapsed*(reducedMotion?5:16);
 for(const rock of rockBelt){const pos=asteroidPosition(rock,travel),p=project(pos.x,pos.y,pos.z),r=p.s*rock.size;
 if(p.x+r<0||p.x-r>W||p.y+r<0||p.y-r>H)continue;
 ctx.save();ctx.translate(p.x,p.y);ctx.rotate(rock.phase+(reducedMotion?0:elapsed*.07));
 ctx.beginPath();for(let j=0;j<10;j++){const a=j*Math.PI/5,rr=r*(.76+.16*Math.sin(j*4+rock.phase));j?ctx.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):ctx.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);}ctx.closePath();
 const shade=ctx.createLinearGradient(-r,-r,r,r);shade.addColorStop(0,'#8c8b88');shade.addColorStop(.45,'#55575c');shade.addColorStop(1,'#131c29');ctx.fillStyle=shade;ctx.fill();ctx.clip();
 ctx.strokeStyle='#a6a29b40';ctx.lineWidth=Math.max(1,r*.018);ctx.beginPath();ctx.moveTo(-r,-r*.3);ctx.lineTo(r*.2,r*.1);ctx.lineTo(r*.5,r);ctx.stroke();
 for(let j=0;j<5;j++){const cr=r*(.09+j*.01),cx=Math.sin(j*5+rock.phase)*r*.5,cy=Math.cos(j*3)*r*.45;ctx.fillStyle='#15203088';ctx.beginPath();ctx.ellipse(cx,cy,cr,cr*.7,.4,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#c8bda744';ctx.stroke();}
 ctx.restore();
 }
}
// Short station navigation keeps the next action visible.
dock=function(tab='dock'){
 speech=null;scene('');mode='dock';view=tab;clearInput();flightUI(false);hud();
 if(tab==='bar')return barRoom();if(tab==='shop')return shop();
 const port=C.stations[state.location],f=C.flight(state);document.documentElement.style.setProperty('--mint',port.color);
 let actions='',summary='';
 if(state.quest==='legal-offer'||state.quest==='illegal-offer'){summary='Rook is waiting at the bar.';actions=button('GO TO BAR →','bar');}
 else if(state.quest==='return'){summary='Paid. Return to Rook for the next job.';actions=button('RETURN TO MERIDIAN →','launch');}
 else if(f){summary=f.cargo+' → '+C.stations[f.destination].name+(f.enemies?' · '+f.enemies+' hostiles':'');actions=button('LAUNCH →','launch');}
 else {summary='Repaired and ready.';actions=button('FIND WORK →','bar');}
 if(state.completed>=1)actions+=button('UPGRADES','shop',true);
 if(state.quest==='open')actions+=button('BAR','bar',true);
 panel('DOCKED / HULL REPAIRED',port.name,'<p>'+summary+'</p>',actions);
};
// The scene art contains each character; small name labels are the interaction targets.
// bootstrap.js owns startup after all renderers are registered.
