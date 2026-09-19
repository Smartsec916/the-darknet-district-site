/* Assisted first-person flight: 3D camera and movement, billboard ships, swept shots. */
const FM=VoidCockpitMath;
const cockpitArt=texture('cockpit-kestrel.png');
const flight={yaw:0,pitch:0,roll:0,yawRate:0,pitchRate:0,throttle:.8,mouseX:0,mouseY:0,travel:0,rocks:[],nav:{x:0,y:0,z:140},arrows:[]};
const flightBasis=()=>FM.basis(flight.yaw,flight.pitch,flight.roll);
const flightPoint=o=>FM.project(o,flightBasis(),W,H);
const cockpitLaunch=launch;
launch=function(){VoidDevTools?.applyPending();cockpitLaunch();if(mode!=='play')return;Object.assign(flight,{yaw:0,pitch:0,roll:0,yawRate:0,pitchRate:0,throttle:.8,mouseX:0,mouseY:0,travel:0,nav:{x:0,y:0,z:140}});resetMissileFlight();VoidCombatEffects.reset();$('route-status').textContent=`0% / ${current.enemies} HOSTILES`;$('weapon').textContent=C.stats(state).piercing?'WRAITH / PIERCING':`PULSE MK ${state.upgrades.guns+1}`;flight.rocks=Array.from({length:34},(_,i)=>({x:(i%2?1:-1)*(28+random()*100),y:(random()-.5)*120,z:25+random()*300,size:1.5+random()*6,phase:random()*6}));announce('Cockpit online · WASD / arrows turn · Shift / X throttle · Space fires');};
const cockpitUI=flightUI;
flightUI=function(active){cockpitUI(active);document.body.classList.toggle('cockpit-flight',active);};
aim=function(e){const rect=canvas.getBoundingClientRect();flight.mouseX=FM.clamp((e.clientX-rect.left-W/2)/(W*.3),-1,1);flight.mouseY=FM.clamp((e.clientY-rect.top-H*.44)/(H*.3),-1,1);};
canvas.onpointerup=canvas.onpointercancel=()=>{pointer=false;firing=false;flight.mouseX=flight.mouseY=0;};
canvas.onpointerleave=()=>{if(!pointer)flight.mouseX=flight.mouseY=0;};
const cockpitClear=clearInput;
clearInput=function(){cockpitClear();flight.mouseX=flight.mouseY=0;};
const cockpitSpawn=spawnEnemy;
spawnEnemy=function(){cockpitSpawn();const e=enemies[enemies.length-1],b=flightBasis();const spread=e.x*4;e.x=b.f.x*115+b.r.x*spread+b.u.x*e.y*3;e.y=b.f.y*115+b.r.y*spread+b.u.y*e.y*3;e.z=b.f.z*115+b.r.z*spread;const d=FM.unit({x:-e.x,y:-e.y,z:-e.z});e.velocity={x:d.x*19,y:d.y*19,z:d.z*19};e.passTime=0;e.armor*=VOID_BALANCE.enemyHull/2;e.maxArmor=e.armor;e.shield=VOID_BALANCE.enemyShield;e.maxShield=e.shield;};
function moveRelative(o,v,dt){o.x-=v.x*dt;o.y-=v.y*dt;o.z-=v.z*dt;}
function spawnAhead(distance,lateral=0,vertical=0){const b=flightBasis();return {x:b.f.x*distance+b.r.x*lateral+b.u.x*vertical,y:b.f.y*distance+b.r.y*lateral+b.u.y*vertical,z:b.f.z*distance+b.r.z*lateral+b.u.z*vertical};}
function hitEnemy(e,damage){if(e.dead)return;if(!e.generator&&enemies.some(q=>q.generator&&!q.dead))return;const absorbed=Math.min(e.shield||0,damage);e.shield=(e.shield||0)-absorbed;e.armor-=damage-absorbed;if(e.armor<=0){e.dead=true;resolved++;burst(e);}}
function cockpitMission(dt,velocity){
 const stats=C.stats(state);shieldDelay=Math.max(0,shieldDelay-dt);driveCooldown=Math.max(0,driveCooldown-dt);driveTime=Math.max(0,driveTime-dt);if(!shieldDelay)shieldHP=Math.min(stats.shield,shieldHP+dt*stats.shieldRegen);if(keys.has('KeyE'))activateDrive();
 droneClock-=dt;if(stats.drone&&droneClock<=0&&enemies.length){const e=enemies.find(e=>e.generator)||enemies[0];hitEnemy(e,stats.droneDamage);droneClock=stats.droneCooldown;}
 if(current.kind==='salvage'||current.kind==='hazard'){
  objectiveClock-=dt;if(objectiveClock<=0&&(current.kind==='hazard'?elapsed<current.duration:objectiveCount<3)){missionObjects.push({...spawnAhead(100,(random()-.5)*22,(random()-.5)*12),kind:current.kind,size:2,phase:random()*6});objectiveClock=current.kind==='salvage'?4:2.5;}
 }
 for(const o of missionObjects){moveRelative(o,velocity,dt);const distance=FM.length(o);if(distance<(o.kind==='salvage'?7:4)){if(o.kind==='salvage'){objectiveCount++;announce(`Signal recovered / ${Math.min(3,objectiveCount)} of 3`);}else hurt(VOID_BALANCE.collisionDamage*1.5);o.dead=true;}if(distance>230)o.dead=true;}
 missionObjects=missionObjects.filter(o=>!o.dead);
 if(current.kind==='escort'){escortClock-=dt;if(escortClock<=0&&enemies.length){const e=enemies[0];hostile.push({...e,vx:0,vy:0,vz:0,life:5,escort:true,damage:VOID_BALANCE.enemyLaserDamage});const h=hostile[hostile.length-1],d=FM.unit({x:-e.x,y:5-e.y,z:25-e.z});Object.assign(h,{vx:d.x*VOID_BALANCE.enemyProjectileSpeed*(40/55),vy:d.y*VOID_BALANCE.enemyProjectileSpeed*(40/55),vz:d.z*VOID_BALANCE.enemyProjectileSpeed*(40/55),dead:false});escortClock=3.5/(VOID_BALANCE.enemyFireRate*3);}}
 updateEquipmentHud();
}
const cockpitIdleUpdate=update;
update=function(dt){
 if(mode!=='play'){if(mode!=='pause')VoidCombatEffects.step(dt);cockpitIdleUpdate(dt);return;}
 VoidCombatEffects.step(dt);time+=dt;noticeTime-=dt;if(noticeTime<=0)$('notice').textContent='';damageTime=Math.max(0,damageTime-dt);
 const stats=C.stats(state),x=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft')),y=Number(keys.has('KeyS')||keys.has('ArrowDown'))-Number(keys.has('KeyW')||keys.has('ArrowUp'));
 FM.steer(flight,{x:x||flight.mouseX,y:y||flight.mouseY,roll:Number(keys.has('KeyR'))-Number(keys.has('KeyQ')),throttle:Number(keys.has('ShiftLeft')||keys.has('ShiftRight'))-Number(keys.has('KeyX'))},dt,stats.speed);
 const b=flightBasis(),speed=20*flight.throttle*(driveTime>0?2.5:1),velocity={x:b.f.x*speed,y:b.f.y*speed,z:b.f.z*speed};flight.travel+=speed*dt;elapsed+=dt*FM.clamp(flight.throttle/.8,.5,1.5);
 cockpitMission(dt,velocity);if(mode!=='play')return;
 shot-=dt;if((keys.has('Space')||firing||touchFiring)&&shot<=0){shot=stats.cooldown;for(const offset of [-.65,.65])bullets.push({x:b.r.x*offset,y:b.r.y*offset,z:b.r.z*offset,vx:b.f.x*VOID_BALANCE.laserProjectileSpeed,vy:b.f.y*VOID_BALANCE.laserProjectileSpeed,vz:b.f.z*VOID_BALANCE.laserProjectileSpeed,damage:stats.damage,life:VOID_BALANCE.laserRange/VOID_BALANCE.laserProjectileSpeed});tone(600,.055);}
 spawnClock-=dt;if(spawned<current.enemies&&spawnClock<=0&&enemies.length<4+Math.floor(current.tier)){spawnEnemy();spawnClock=Math.max(1.4,(current.duration-10)/Math.max(1,current.enemies));}
 for(const e of enemies){
  if(e.dead)continue;e.age+=dt;const distance=FM.length(e);e.passTime=Math.max(0,(e.passTime||0)-dt);if(distance<20&&!e.passTime)e.passTime=3;
  e.velocity??={x:0,y:0,z:-18};
  if(!e.passTime){const d=FM.unit({x:-e.x,y:-e.y,z:-e.z}),blend=1-Math.exp(-dt*.7),v=e.heavy?9:24;for(const axis of ['x','y','z'])e.velocity[axis]+=(d[axis]*v-e.velocity[axis])*blend;}
  for(const axis of ['x','y','z'])e[axis]+=e.velocity[axis]*dt;moveRelative(e,velocity,dt);e.fire-=dt;
  if(e.fire<=0&&distance<165){e.fire=(e.boss?1.4/3:e.heavy?2/3:Math.max(1,3-current.tier*.2)/3)/VOID_BALANCE.enemyFireRate;const spread=(1-VOID_BALANCE.enemyAccuracy)*distance*.15;const d=FM.unit({x:-e.x+(random()-.5)*spread,y:-e.y+(random()-.5)*spread,z:-e.z});for(const offset of e.boss?[-.07,0,.07]:[0])hostile.push({x:e.x,y:e.y,z:e.z,vx:(d.x+offset)*VOID_BALANCE.enemyProjectileSpeed,vy:d.y*VOID_BALANCE.enemyProjectileSpeed,vz:d.z*VOID_BALANCE.enemyProjectileSpeed,damage:VOID_BALANCE.enemyLaserDamage*(e.heavy?2:1),life:5});}
  if(distance<3+e.size&&!e.colliding){hurt(VOID_BALANCE.collisionDamage*(e.heavy?25/12:1));e.colliding=true;}if(distance>12)e.colliding=false;
 }
 stepMissileCombat(dt,velocity);
 for(const shot of bullets){const from={x:shot.x,y:shot.y,z:shot.previousZ??shot.z};shot.life=(shot.life??2)-dt;if(shot.target&&!shot.target.dead){const d=FM.unit({x:shot.target.x-shot.x,y:shot.target.y-shot.y,z:shot.target.z-shot.z});shot.vx=d.x*VOID_BALANCE.laserProjectileSpeed;shot.vy=d.y*VOID_BALANCE.laserProjectileSpeed;shot.vz=d.z*VOID_BALANCE.laserProjectileSpeed;}shot.x+=(shot.vx||0)*dt;shot.y+=(shot.vy||0)*dt;shot.z+=(shot.vz??VOID_BALANCE.laserProjectileSpeed)*dt;moveRelative(shot,velocity,dt);
  for(const e of enemies)if(!shot.dead&&!e.dead&&!shot.hits?.has(e)&&FM.segmentHit(from,shot,e,e.size*2.1)){(shot.hits??=new Set()).add(e);shot.dead=!stats.piercing;hitEnemy(e,shot.damage);}shot.previousZ=undefined;
 }
 for(const h of hostile){const from={x:h.x,y:h.y,z:h.z};h.x+=(h.vx||0)*dt;h.y+=(h.vy||0)*dt;h.z+=(h.vz??-VOID_BALANCE.enemyProjectileSpeed)*dt;moveRelative(h,velocity,dt);h.life=(h.life??5)-dt;if(h.escort){if(FM.segmentHit(from,h,{x:0,y:5,z:25},4)){h.x=0;h.y=2.4;escortImpact(h);h.dead=true;}}else if(FM.segmentHit(from,h,{x:0,y:0,z:0},1.8)){hurt(h.damage);h.dead=true;}}
 enemies=enemies.filter(e=>!e.dead);bullets=bullets.filter(o=>!o.dead&&o.life>0);hostile=hostile.filter(o=>!o.dead&&o.life>0);
 for(const s of sparks){s.life-=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.z+=s.vz*dt;moveRelative(s,velocity,dt);}sparks=sparks.filter(s=>s.life>0);
 for(const rock of flight.rocks){moveRelative(rock,velocity,dt);if(FM.length(rock)>380||FM.length(rock)<9){Object.assign(rock,spawnAhead(260,(random()-.5)*210,(random()-.5)*140));}}
 const progress=Math.min(1,elapsed/current.duration);$('progress').style.width=progress*100+'%';$('route-status').textContent=`${Math.floor(progress*100)}% / ${Math.max(0,current.enemies-resolved)} HOSTILES`;
 $('flight-objective').textContent=current.kind==='salvage'&&objectiveCount<3?`RECOVER SIGNALS ${objectiveCount} / 3 · Steer through cyan beacons`:current.kind==='escort'?`SHUTTLE ${escortHP}% · Destroy attackers to protect it`:routeClear()?'Route clear · Docking guidance engaged':'Clear hostiles · Red arrows point toward off-screen ships';
 if(destinationVisible()){approachTime+=dt;const blend=1-Math.exp(-dt*1.4);flight.yaw*=1-blend;flight.pitch*=1-blend;flight.mouseX=flight.mouseY=0;}
 if(mode==='play'&&elapsed>=current.duration&&routeClear()&&(!current.enemies||approachTime>=3))arrive();
};
// A surrounding sphere of stars stays fixed in space as the cockpit turns.
const domeStars=Array.from({length:850},()=>{const y=random()*2-1,a=random()*Math.PI*2,r=Math.sqrt(1-y*y);return {x:Math.cos(a)*r*1000,y:y*1000,z:Math.sin(a)*r*1000,bright:random()};});
let skyRenderer;
function makeSkyRenderer(){
 const surface=document.createElement('canvas'),gl=surface.getContext('webgl',{alpha:false,preserveDrawingBuffer:true});if(!gl)return null;
 const vs='attribute vec2 p;varying vec2 uv;void main(){uv=p;gl_Position=vec4(p,0.,1.);}';
 const fs='precision mediump float;varying vec2 uv;uniform vec3 right,up,forward;uniform float aspect;uniform sampler2D sky;void main(){vec3 d=normalize(forward+right*uv.x*aspect*.67-up*uv.y*.67);vec3 w=pow(abs(d),vec3(4.));w/=w.x+w.y+w.z;vec3 c=texture2D(sky,d.yz*.48+.5).rgb*w.x+texture2D(sky,d.xz*.48+.5).rgb*w.y+texture2D(sky,d.xy*.48+.5).rgb*w.z;gl_FragColor=vec4(c*.55,1.);}';
 function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
 const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))return null;gl.useProgram(program);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const attribute=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,2,gl.FLOAT,false,0,0);
 const tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);let loaded;
 return function(image,b){if(!image.complete||!image.naturalWidth)return false;const width=Math.round(W*.7),height=Math.round(H*.7);if(surface.width!==width||surface.height!==height){surface.width=width;surface.height=height;}gl.viewport(0,0,width,height);if(loaded!==image){gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);loaded=image;}for(const [name,v]of [['right',b.r],['up',b.u],['forward',b.f]])gl.uniform3f(gl.getUniformLocation(program,name),v.x,v.y,v.z);gl.uniform1f(gl.getUniformLocation(program,'aspect'),W/H);gl.drawArrays(gl.TRIANGLES,0,6);ctx.drawImage(surface,0,0,W,H);return true;};
}
try{skyRenderer=makeSkyRenderer();}catch{skyRenderer=null;}
function hashNoise(x,y,z){const n=Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453;return n-Math.floor(n);}
function noise(x,y,z){const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z),smooth=v=>v*v*(3-2*v),a=smooth(x-ix),b=smooth(y-iy),c=smooth(z-iz);let sum=0;for(let i=0;i<2;i++)for(let j=0;j<2;j++)for(let k=0;k<2;k++)sum+=hashNoise(ix+i,iy+j,iz+k)*(i?a:1-a)*(j?b:1-b)*(k?c:1-c);return sum;}
function fractal(x,y,z){let n=0,a=.55;for(let i=0;i<5;i++){n+=noise(x,y,z)*a;x*=2.03;y*=2.03;z*=2.03;a*=.5;}return n;}
const planetMaps={};
function planetMap(id){if(planetMaps[id])return planetMaps[id];const size=320,c=document.createElement('canvas');c.width=c.height=size;const g=c.getContext('2d'),data=g.createImageData(size,size);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const nx=(x-size/2)/(size*.48),ny=(y-size/2)/(size*.48),rr=nx*nx+ny*ny;if(rr>1)continue;const nz=Math.sqrt(1-rr),n=fractal(nx*5+12,ny*5+6,nz*5),cloud=fractal(nx*10+30,ny*10,nz*10),light=.09+Math.max(0,-nx*.5-ny*.4+nz*.6)*.95;let rgb;if(id==='meridian'){const bands=Math.sin(ny*48+n*8)*.5+.5;rgb=[160+bands*65,115+bands*60,85+bands*48];}else if(id==='kepler'){rgb=n>.52?[45+n*55,75+n*60,45+n*40]:[12,55+n*35,95+n*85];const clouds=FM.clamp((cloud-.51)*7,0,.85);rgb=rgb.map(v=>v*(1-clouds)+235*clouds);}else if(id==='undertow'){const cracks=Math.abs(n-.48)<.017;rgb=cracks?[43,75,97]:[135+cloud*95,163+cloud*75,180+cloud*65];}else{const lava=Math.abs(n-.5)<.019;rgb=lava?[245,60+n*60,8]:[35+cloud*55,27+cloud*35,28+cloud*30];}const i=(y*size+x)*4;for(let k=0;k<3;k++)data.data[i+k]=rgb[k]*light;data.data[i+3]=Math.min(255,(1-rr)*12000);}g.putImageData(data,0,0);return planetMaps[id]=c;}
function cockpitPlanet(){const id=current.destination,side=id==='kepler'||id==='foundry'?-1:1,point=flightPoint({x:side*330,y:-125,z:800}),radius=point.s*165;if(point.z<1)return;ctx.save();ctx.translate(point.x,point.y);const glow=ctx.createRadialGradient(0,0,radius*.94,0,0,radius*1.09);glow.addColorStop(0,'#80c9ff00');glow.addColorStop(.55,id==='foundry'?'#ff653455':'#73beff55');glow.addColorStop(1,'#73beff00');ctx.fillStyle=glow;ctx.fillRect(-radius*1.1,-radius*1.1,radius*2.2,radius*2.2);if(id==='meridian'){ctx.save();ctx.rotate(-.35);for(let i=0;i<22;i++){ctx.strokeStyle=`rgba(179,157,133,${.15+(i%3)*.12})`;ctx.lineWidth=radius*.014;ctx.beginPath();ctx.ellipse(0,0,radius*(1.25+i*.025),radius*(.32+i*.008),0,0,Math.PI*2);ctx.stroke();}ctx.restore();}ctx.drawImage(planetMap(id),-radius,-radius,radius*2,radius*2);ctx.restore();}
const rockMesh=[];
for(let row=0;row<7;row++)for(let col=0;col<12;col++){const make=(a,b)=>{const phi=a*Math.PI/7,theta=(b%12)*Math.PI/6,r=.75+hashNoise(a,b%12,4)*.28;return {x:Math.sin(phi)*Math.cos(theta)*r,y:Math.cos(phi)*r,z:Math.sin(phi)*Math.sin(theta)*r};};const a=make(row,col),b=make(row+1,col),c=make(row+1,col+1),d=make(row,col+1);rockMesh.push([a,b,c],[a,c,d]);}
function drawRock(rock){const p=flightPoint(rock);if(p.z<2||p.s*rock.size<1||p.x< -200||p.x>W+200||p.y< -200||p.y>H+200)return;const a=rock.phase+time*.07,ca=Math.cos(a),sa=Math.sin(a),r=p.s*rock.size;const faces=rockMesh.map(face=>{const vertices=face.map(v=>({x:v.x*ca+v.z*sa,y:v.y,z:v.z*ca-v.x*sa}));return {vertices,depth:vertices.reduce((s,v)=>s+v.z,0)};}).sort((a,b)=>a.depth-b.depth);ctx.save();ctx.translate(p.x,p.y);for(const face of faces){const [a,b,c]=face.vertices,n=FM.unit({x:(b.y-a.y)*(c.z-a.z)-(b.z-a.z)*(c.y-a.y),y:(b.z-a.z)*(c.x-a.x)-(b.x-a.x)*(c.z-a.z),z:(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x)}),orientation=FM.dot(n,a)<0?-1:1,shade=50+Math.max(0,FM.dot(n,{x:-.5,y:-.6,z:.6})*orientation)*115;ctx.fillStyle=`rgb(${shade|0},${shade*.93|0},${shade*.86|0})`;ctx.beginPath();face.vertices.forEach((v,i)=>i?ctx.lineTo(v.x*r,v.y*r):ctx.moveTo(v.x*r,v.y*r));ctx.closePath();ctx.fill();}for(let i=0;i<26;i++){const u=hashNoise(i,3,7)*2-1,theta=hashNoise(i,8,2)*Math.PI*2,t=Math.sqrt(1-u*u),vx=t*Math.cos(theta),vz=t*Math.sin(theta),cx=vx*ca+vz*sa,cz=vz*ca-vx*sa;if(cz<.2)continue;const cr=r*(.025+hashNoise(i,5,1)*.055);ctx.fillStyle='#171b21aa';ctx.beginPath();ctx.ellipse(cx*r*.72,u*r*.72,cr,cr*(.35+cz*.5),a,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#b2a08b55';ctx.lineWidth=Math.max(.5,r*.008);ctx.beginPath();ctx.ellipse(cx*r*.72,u*r*.72,cr,cr*(.35+cz*.5),a,0,Math.PI);ctx.stroke();}ctx.restore();}
function cockpitEnemy(e){const p=flightPoint(e);if(p.z<1)return;const size=Math.min(H*.55,p.s*e.size*4.2),frame=fleetFrames[e.className]||fleetFrames.raider;if(p.x< -size||p.x>W+size||p.y< -size||p.y>H+size)return;ctx.save();ctx.translate(p.x,p.y);const facing=enemyView(e,flightBasis());ctx.rotate(facing.image?.naturalWidth?facing.bank:facing.heading+facing.bank);ctx.scale(Math.max(.8,Math.cos(facing.bank)),1);if(facing.image?.complete&&facing.image.naturalWidth)ctx.drawImage(facing.image,-size/2,-size/2,size,size);else if(fleetTexture.complete&&fleetTexture.naturalWidth)ctx.drawImage(fleetTexture,...frame,-size/2,-size/2,size,size*frame[3]/frame[2]);else{ctx.fillStyle='#db7994';ctx.beginPath();ctx.moveTo(0,size*.5);ctx.lineTo(-size*.4,-size*.4);ctx.lineTo(size*.4,-size*.4);ctx.fill();}ctx.restore();ctx.strokeStyle=e.generator?'#58ffe1':'#ff728a';const r=Math.max(12,size*.55);ctx.strokeRect(p.x-r,p.y-r,r*2,r*2);ctx.fillStyle=ctx.strokeStyle;ctx.fillRect(p.x-r,p.y-r-6,r*2*Math.max(0,e.armor/e.maxArmor),2);if(e.maxShield){ctx.fillStyle='#58cfff';ctx.fillRect(p.x-r,p.y-r-10,r*2*Math.max(0,e.shield/e.maxShield),2);}if(e.generator||e.boss){ctx.font='12px Consolas';ctx.fillText(e.generator?'SHIELD RELAY':'CAPITAL SHIP',p.x-r,p.y-r-14);}}
function cockpitArrow(o,label,color){const a=FM.arrow(o,flightBasis(),W,H);flight.arrows.push({...a,label});ctx.save();ctx.translate(a.x,a.y);ctx.rotate(a.angle);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(-7,-6);ctx.lineTo(-3,0);ctx.lineTo(-7,6);ctx.fill();ctx.restore();ctx.fillStyle=color;ctx.font='11px Consolas';ctx.textAlign='center';ctx.fillText(a.behind?label+' / BEHIND':label,a.x,a.y+20);ctx.textAlign='left';}
const cockpitDockDraw=draw;
draw=function(){
 if(mode!=='play'&&mode!=='pause'){cockpitDockDraw();VoidCombatEffects.draw();VoidDevTools.debug();return;}
 const b=flightBasis();ctx.fillStyle='#030713';ctx.fillRect(0,0,W,H);if(skyRenderer)skyRenderer(skyboxes[current.destination],b);
 for(const star of domeStars){const p=FM.project(star,b,W,H);if(p.z>0&&p.x>=0&&p.x<W&&p.y>=0&&p.y<H){ctx.fillStyle=star.bright>.85?'#d4eaff':'#6e899c';ctx.fillRect(p.x,p.y,star.bright>.85?1.6:1,star.bright>.85?1.6:1);}}
 cockpitPlanet();for(const rock of [...flight.rocks].sort((a,b)=>flightPoint(b).z-flightPoint(a).z))drawRock(rock);
 if(destinationVisible()){const p=flightPoint({x:0,y:0,z:140}),scale=.2+Math.min(1,approachTime/3)*.6;ctx.save();ctx.translate(p.x-W*.69,p.y-H*.49);ctx.translate(W*.69,H*.49);ctx.scale(scale,scale);ctx.translate(-W*.69,-H*.49);stationScene(C.stations[current.destination].color);ctx.restore();}
 for(const e of [...enemies].sort((a,b)=>flightPoint(b).z-flightPoint(a).z))cockpitEnemy(e);
 for(const list of [bullets,hostile])for(const o of list){const p=flightPoint(o),q=flightPoint({x:o.x-(o.vx||0)*.025,y:o.y-(o.vy||0)*.025,z:o.z-(o.vz||0)*.025});if(p.z>1&&q.z>1){ctx.strokeStyle=list===bullets?'#6bffe3':o.escort?'#ffbf61':'#ff526f';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();}}
 for(const s of sparks){const p=flightPoint(s);if(p.z>1){ctx.globalAlpha=Math.max(0,s.life/.8);ctx.fillStyle=s.color;ctx.fillRect(p.x,p.y,3,3);}}ctx.globalAlpha=1;
 for(const o of missionObjects){if(o.kind==='hazard'){drawRock(o);continue;}const p=flightPoint(o);if(p.z>1){const r=Math.max(7,p.s*2);ctx.strokeStyle='#58ffe1';ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.PI/4);ctx.strokeRect(-r,-r,r*2,r*2);ctx.restore();}}
 if(current.kind==='escort'){const p=flightPoint({x:0,y:5,z:25});if(p.z>1){ctx.strokeStyle='#ffbd69';ctx.strokeRect(p.x-20,p.y-12,40,24);ctx.fillStyle='#ffbd69';ctx.fillText('SHUTTLE',p.x-24,p.y+28);}}
 drawMissiles();
 if(cockpitArt.complete&&cockpitArt.naturalWidth)ctx.drawImage(cockpitArt,0,0,W,H);else{ctx.fillStyle='#091720';ctx.fillRect(0,H*.81,W,H*.19);}
 flight.arrows=[];for(const e of enemies){const p=flightPoint(e);if(p.z<=0||p.x<W*.12||p.x>W*.88||p.y<H*.15||p.y>H*.72)cockpitArrow(e,e.generator?'RELAY':'HOSTILE','#ff718a');}
 for(const o of missionObjects)if(o.kind==='salvage'){const p=flightPoint(o);if(p.z<=0||p.x<0||p.x>W||p.y<0||p.y>H*.75)cockpitArrow(o,'SIGNAL','#58ffe1');}
 ctx.strokeStyle='#8dffe3';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(W/2,H*.44,9,0,Math.PI*2);ctx.moveTo(W/2-22,H*.44);ctx.lineTo(W/2-13,H*.44);ctx.moveTo(W/2+13,H*.44);ctx.lineTo(W/2+22,H*.44);ctx.stroke();
 ctx.fillStyle='#84f7dc';ctx.textAlign='center';ctx.font=`${W<600?11:14}px Consolas`;ctx.fillText(`KESTREL / ${Math.round(flight.throttle*100)}% THRUST`,W*.5,H*.85);ctx.fillText(`HDG ${((flight.yaw*180/Math.PI%360+360)%360).toFixed(0).padStart(3,'0')}   HOSTILES ${Math.max(0,current.enemies-resolved)}`,W*.5,H*.88);ctx.font='11px Consolas';if(W>700)ctx.fillText('WASD TURN · Q/R ROLL · SHIFT/X THROTTLE · SPACE FIRE',W*.5,H*.93);ctx.textAlign='left';
 drawMissileReticle();VoidCombatEffects.draw();VoidDevTools?.debug();
};
// Touch controls remain outside the canopy; buttons alter the same flight throttle.
const throttleControls=document.createElement('div');throttleControls.id='flight-throttle';throttleControls.innerHTML='<button type="button" aria-label="Decrease throttle">− THRUST</button><button type="button" aria-label="Increase throttle">+ THRUST</button>';
document.body.append(throttleControls);throttleControls.children[0].onclick=()=>flight.throttle=FM.clamp(flight.throttle-.15,.3,1.4);throttleControls.children[1].onclick=()=>flight.throttle=FM.clamp(flight.throttle+.15,.3,1.4);
$('controls').textContent='WASD / ARROWS TURN · SPACE FIRE · P PAUSE';
canvas.setAttribute('aria-label','Cockpit flight. WASD or arrows turn, Q and R roll, Shift and X adjust throttle. Space fires. Mouse steers; click fires. Touch drag steers and fires. Red arrows show enemies behind you.');
