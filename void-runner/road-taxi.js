/* Street taxis on NeoChinatown's roads. Rules are in road-taxi-rules.js. The cab is built from simple shapes
   (no external model; see docs/VOID_RUNNER_ASSET_LICENSES.md). Ambient cabs drive the avenue and Main Street.
   Call one from the V1 map. It drives to the nearest road point, waits, and after you board it drives to the stop.
   A person in front of a cab slows it to a stop; it moves again once the road is clear. */
(function(){
 'use strict';
 const R=globalThis.VoidRoadTaxiRules;if(!R)return;
 const SPEC=R.SPEC;
 let world=null,own=[],signTex=null,mats=null,look={yaw:0,pitch:.08},visual={};
 const B=()=>globalThis.BABYLON,scene=()=>globalThis.VoidBabylon?.scene;
 const inCity=()=>!!walkingLocation&&walkingLocation.id==='neochinatown'&&walkingLocation.area!=='interior'&&!!walker&&state?.location==='earth';
 const yawDelta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));

 function makeMats(sc){
  const b=B(),ownM=[];
  const mat=(n,f)=>{const m=new b.StandardMaterial('road-taxi-'+n,sc);f(m);ownM.push(m);return m;};
  const body=mat('body',m=>{m.diffuseColor=b.Color3.FromHexString('#14181e');m.specularColor=new b.Color3(.04,.05,.06);});
  const glass=mat('glass',m=>{m.diffuseColor=b.Color3.FromHexString('#9fd0dc');m.emissiveColor=b.Color3.FromHexString('#9fd0dc').scale(.12);m.alpha=.38;m.backFaceCulling=false;});
  const glow=(n,hex)=>mat(n,m=>{m.diffuseColor=b.Color3.Black();m.emissiveColor=b.Color3.FromHexString(hex);m.disableLighting=true;});
  const skirt=glow('skirt','#38e8ff'),head=glow('head','#f4f8ff'),tail=glow('tail','#ff3b3b'),lamp=glow('lamp','#ffb347');
  const t=new b.DynamicTexture('road-taxi-sign',{width:256,height:64},sc,true),g=t.getContext();
  g.fillStyle='#140c00';g.fillRect(0,0,256,64);g.fillStyle='#ffb347';g.font='bold 42px monospace';g.textAlign='center';g.textBaseline='middle';g.fillText('TAXI',128,34);t.update();
  const sign=mat('sign',m=>{m.diffuseColor=b.Color3.Black();m.emissiveTexture=t;m.disableLighting=true;});
  ownM.push(t);signTex=t;return {own:ownM,body,glass,skirt,head,tail,lamp,sign};
 }
 function buildCab(sc,id){
  const b=B(),root=new b.TransformNode('road-taxi-'+id,sc),parts=[],box=(n,s,m,p)=>{const mesh=b.MeshBuilder.CreateBox(n,{width:s[0],height:s[1],depth:s[2]},sc);mesh.material=m;mesh.position.set(p[0],p[1],p[2]);mesh.parent=root;mesh.isPickable=false;parts.push(mesh);return mesh;};
  box('body',[1.85,.5,4.2],mats.body,[0,.62,0]);
  box('nose',[1.5,.28,1.1],mats.body,[0,.5,1.7]);
  box('glass',[1.5,.42,2.15],mats.glass,[0,1.02,.15]);
  box('skirt',[1.95,.07,4.35],mats.skirt,[0,.28,0]);
  const door=box('door',[.06,.42,1.15],mats.glass,[.96,.95,.2]);
  box('sign',[.72,.2,.08],mats.sign,[0,1.38,0]);
  box('head-l',[.22,.1,.08],mats.head,[-.55,.55,2.08]);box('head-r',[.22,.1,.08],mats.head,[.55,.55,2.08]);
  box('tail-l',[.28,.08,.06],mats.tail,[-.6,.55,-2.08]);box('tail-r',[.28,.08,.06],mats.tail,[.6,.55,-2.08]);
  box('lamp',[.16,.08,.16],mats.lamp,[0,1.28,-.2]);
  const wheels=[];
  for(const [x,z] of [[-.95,1.25],[.95,1.25],[-.95,-1.25],[.95,-1.25]]){
   const w=b.MeshBuilder.CreateCylinder('road-taxi-wheel',{diameter:.52,height:.16,tessellation:12},sc);
   w.material=mats.body;w.parent=root;w.position.set(x,.28,z);w.rotation.z=Math.PI/2;w.isPickable=false;parts.push(w);wheels.push(w);
  }
  return {root,parts,door,wheels,doorOpen:0};
 }
 function disposeCab(cab){cab?.root?.dispose?.();}
 function teardown(){
  if(world)for(const t of world.taxis)disposeCab(t.mesh);
  for(const m of own)m.dispose?.();own=[];signTex=null;mats=null;world=null;visual={};
  if(walkingLocation)walkingLocation.interactions=walkingLocation.interactions.filter(i=>i.id!=='road-taxi-board');
 }
 function ensure(){
  if(!inCity()||!scene()||scene().isDisposed){if(world)teardown();return false;}
  if(world)return true;
  const sc=scene(),q=globalThis.VoidGraphics?.quality||'medium';
  mats=makeMats(sc);own=mats.own;
  world=R.createTraffic(q==='low'?2:4,4127);
  for(const t of world.taxis)t.mesh=buildCab(sc,t.id);
  return true;
 }
 function context(){
  const area=walkingLocation?.area==='interior'?'district':(globalThis.VoidNeoChinatown?.zone?.({x:walker.x,z:walker.z}).area||'street');
  return {onFoot:mode==='walking',area,player:[walker.x,walker.z],combat:!!globalThis.VoidFlightSkirmish?.active,busy:!!globalThis.VoidGraphics?.busy,trip:!!globalThis.VoidTaxi?.trip,inSpace:mode==='play'};
 }
 function syncBoard(){
  if(!walkingLocation)return;
  walkingLocation.interactions=walkingLocation.interactions.filter(i=>i.id!=='road-taxi-board');
  const job=world?.job;if(!job||job.released||job.cab.phase!=='waiting'||mode!=='walking')return;
  const d=R.doorPoints(job.cab)[0];
  walkingLocation.interactions.push({id:'road-taxi-board',label:'BOARD TAXI · '+job.fare+' CR',position:[d.x,1.7,d.z],action:'road-taxi-board',range:3.2});
 }
 function placeRider(){
  const job=world?.job;if(!job||job.released||mode!=='road-taxi')return;
  const s=R.seatPoint(job.cab);
  walker.x=s.x;walker.y=s.y;walker.z=s.z;walker.yaw=s.yaw+look.yaw;walker.pitch=look.pitch;
 }
 function hail(destId){
  if(!ensure()){announce?.('Street taxis run in NeoChinatown, on the roads.');return false;}
  const player={x:walker.x,z:walker.z,riding:false};
  const res=R.hail(world,state,player,destId,context());
  if(!res.ok){announce?.(res.reason);return false;}
  announce?.('Street taxi on its way to you. Fare '+res.fare+' CR, paid when you board.');
  try{globalThis.VoidPersonalDevice?.close?.();}catch{}
  return true;
 }
 function cancel(){if(!world)return false;const res=R.cancel(world);if(res.ok)announce?.('Taxi cancelled. No charge.');return !!res.ok;}
 function board(){
  if(!world)return;
  const res=R.board(world,state);
  if(!res.ok){announce?.(res.reason||'The taxi is not ready.');return;}
  try{save();hud();}catch{}
  mode='road-taxi';look={yaw:0,pitch:.08};clearInput?.();walkingKeys?.clear?.();syncBoard();
  announce?.('Fare '+world.job.fare+' CR. The taxi is driving you to '+world.job.dest.label+'.');
 }
 function exit(){
  if(!world?.job||world.job.cab.phase!=='arrived')return;
  const doors=R.doorPoints(world.job.cab),yaw=world.job.cab.yaw;
  const res=R.exitRide(world,state);if(!res.ok)return;
  try{save();hud();}catch{}
  let placed=false;
  for(const d of doors){if(!globalThis.VoidExplorer?.blocked?.(d.x,d.z,walkingLocation)){walker.x=d.x;walker.z=d.z;placed=true;break;}}
  if(!placed){walker.x=doors[2].x;walker.z=doors[2].z;}
  walker.y=1.7;walker.yaw=yaw;walker.pitch=0;mode='walking';clearInput?.();walkingKeys?.clear?.();
  announce?.('You step out.');
 }
 function paint(dt,time){
  if(!world)return;
  for(const t of world.taxis){const cab=t.mesh;if(!cab?.root||cab.root.isDisposed())continue;
   const vy=visual[t.id]??t.yaw;visual[t.id]=vy+yawDelta(vy,t.yaw)*Math.min(1,dt*5);
   cab.root.position.set(t.x,0,t.z);cab.root.rotation.y=visual[t.id];
   const open=t.phase==='waiting'||t.phase==='arrived',target=open?1:0;
   cab.doorOpen+=(target-cab.doorOpen)*Math.min(1,dt*3);cab.door.position.x=.96+cab.doorOpen*.55;
   const spin=t.speed*dt*1.6;for(const w of cab.wheels)w.rotation.x+=spin;
   cab.root.setEnabled(true);
  }
 }
 function status(){
  const job=world?.job;if(!job||job.released||!walker)return null;
  const cab=job.cab,d=Math.round(Math.hypot((walker.x||0)-cab.x,(walker.z||0)-cab.z));
  return {phase:cab.phase,label:job.dest.label,fare:job.fare,distance:d,canCancel:!job.charged&&['to-pickup','waiting'].includes(cab.phase)};
 }
 const phaseText={cruise:'Driving','to-pickup':'On its way',waiting:'Waiting, door open','to-dest':'Driving',arrived:'Arrived',rejoin:'Leaving'};

 if(globalThis.VoidInteractions)VoidInteractions.register('road-taxi-board',()=>board());
 addEventListener('mousemove',e=>{if(mode!=='road-taxi')return;look.yaw=Math.max(-1.5,Math.min(1.5,look.yaw+e.movementX*.004));look.pitch=Math.max(-.6,Math.min(.45,look.pitch+e.movementY*.003));});
 addEventListener('keydown',e=>{if(mode!=='road-taxi')return;
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code)){e.preventDefault();look.yaw+=e.code==='ArrowLeft'?-.12:e.code==='ArrowRight'?.12:0;look.pitch+=e.code==='ArrowUp'?-.08:e.code==='ArrowDown'?.08:0;}
  if((e.code==='KeyE'||e.code==='Enter')&&world?.job?.cab?.phase==='arrived'){e.preventDefault();e.stopPropagation();exit();}},true);
 let prevA=false;
 const chip=document.createElement('div');chip.id='road-taxi-chip';chip.hidden=true;chip.setAttribute('role','status');
 chip.innerHTML='<span></span><button type="button">CANCEL</button>';
 const css=document.createElement('style');css.textContent='#road-taxi-chip{position:fixed;left:50%;top:148px;transform:translateX(-50%);z-index:40;display:flex;align-items:center;gap:10px;padding:6px 8px 6px 12px;border:1px solid rgba(255,179,71,.55);background:rgba(8,10,14,.82);color:#ffe3b0;font:11px/1.3 ui-monospace,Consolas,monospace;letter-spacing:.08em}#road-taxi-chip[hidden]{display:none}#road-taxi-chip button{font:inherit;letter-spacing:.1em;color:#140c00;background:#ffb347;border:0;padding:4px 8px;cursor:pointer}';
 document.head.appendChild(css);document.body.appendChild(chip);
 chip.querySelector('button').addEventListener('click',()=>cancel());

 const taxiUpdate=update;update=function(dt){taxiUpdate(dt);
  if(state?.story?.flags?.[R.FLAG]&&!(world?.job&&world.job.charged)){const back=R.recover(state);if(back){try{save();hud();}catch{}announce?.('Your interrupted taxi trip was refunded: '+back+' CR.');}}
  if(!inCity()){if(world?.job?.charged&&world.job.cab?.phase!=='arrived'){const back=R.recover(state);if(back){try{save();hud();}catch{}announce?.('The taxi trip was refunded: '+back+' CR.');}}if(world)teardown();return;}
  if(!scene()||scene().isDisposed)return;
  ensure();if(!world)return;
  if(world.taxis.some(t=>!t.mesh?.root||t.mesh.root.isDisposed())){for(const m of own){try{m.dispose();}catch{}}own=[];mats=null;signTex=null;mats=makeMats(scene());own=mats.own;for(const t of world.taxis)t.mesh=buildCab(scene(),t.id);}
  const riding=mode==='road-taxi';
  const player={x:walker.x,z:walker.z,riding};
  R.stepWorld(world,dt,player);
  if(riding){if(!world.job||world.job.released||world.job.cab.phase==='rejoin'){mode='walking';}else placeRider();}
  if(mode==='road-taxi'){let pad=null;try{pad=[...(navigator.getGamepads?.()||[])].find(p=>p&&p.connected!==false);}catch{}const a=!!pad?.buttons?.[0]?.pressed;if(a&&!prevA&&world?.job?.cab?.phase==='arrived')exit();prevA=a;if(pad)look.yaw=Math.max(-1.5,Math.min(1.5,look.yaw+(pad.axes?.[2]||0)*dt*1.6));}
  syncBoard();paint(dt,performance.now()/1000);
  const st=status();
  if(st&&st.canCancel&&mode==='walking'){chip.hidden=false;chip.querySelector('span').textContent='STREET TAXI · '+st.label.toUpperCase()+' · '+st.distance+' M';}
  else chip.hidden=true;
 };
 const taxiDraw=draw;draw=function(){taxiDraw();
  if(mode!=='road-taxi'||!world?.job||world.job.released)return;
  const job=world.job,text=phaseText[job.cab.phase]||job.cab.phase;
  ctx.save();ctx.fillStyle='rgba(6,8,11,.82)';ctx.fillRect(W/2-250,H-86,500,46);ctx.strokeStyle='#ffb347';ctx.strokeRect(W/2-250,H-86,500,46);
  ctx.fillStyle='#ffb347';ctx.font='bold 14px Consolas,monospace';ctx.textAlign='center';ctx.fillText('STREET TAXI · '+job.dest.label.toUpperCase()+' · '+String(text).toUpperCase(),W/2,H-66);
  ctx.fillStyle='#b9c8ce';ctx.font='12px Consolas,monospace';ctx.fillText(job.cab.phase==='arrived'?'E / STEP OUT':'Mouse or arrow keys to look around',W/2,H-48);ctx.restore();};

 globalThis.VoidRoadTaxi={hail,cancel,board,exit,status,get active(){return !!(world?.job&&!world.job.released);},get world(){return world;}};
})();
