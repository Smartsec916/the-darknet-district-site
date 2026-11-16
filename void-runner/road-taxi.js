/* Street taxis on NeoChinatown's roads. Rules are in road-taxi-rules.js. The cab is built from simple shapes
   (no external model; see docs/VOID_RUNNER_ASSET_LICENSES.md). Ambient cabs drive the avenue and Main Street.
   Call one from the V1 map. It drives to the nearest road point, waits, and after you board it drives to the stop.
   A person in front of a cab slows it to a stop; it moves again once the road is clear.
   Since the quarters (16 Nov 2026): each quarter has its own cabs. A trip to another quarter, the Corporate District or the Zen Zephyr Temple drives into a
   checkpoint's vehicle bay; the shutters close, the scan runs, the next quarter replaces this one (ncz-gate-transit.js ride) and the cab drives on.
   The ride back from the two far places starts in their gate's bay and is included in the fare. These are the only taxis: the sky cabs are gone. */
(function(){
 'use strict';
 const R=globalThis.VoidRoadTaxiRules;if(!R)return;
 const SPEC=R.SPEC,Q=globalThis.VoidQuarters;
 let crossing=false,exitDoor=null;
 const gates=()=>globalThis.VoidBabylon?.district?.gates||null,quarterNow=()=>walkingLocation?.quarter||null;
 let world=null,own=[],signTex=null,mats=null,look={yaw:0,pitch:.08},visual={};
 const B=()=>globalThis.BABYLON,scene=()=>globalThis.VoidBabylon?.scene;
 const inCity=()=>!!walkingLocation&&walkingLocation.id==='neochinatown'&&walkingLocation.area!=='interior'&&walkingLocation.area!=='milked'&&!!walker&&state?.location==='earth';
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
  for(const m of own)m.dispose?.();own=[];signTex=null;mats=null;world=null;visual={};exitDoor=null;
  if(walkingLocation)walkingLocation.interactions=walkingLocation.interactions.filter(i=>i.id!=='road-taxi-board');
 }
 function ensure(){
  if(!inCity()||!scene()||scene().isDisposed){if(world)teardown();return false;}
  if(world&&world.quarter!==quarterNow()&&!crossing)teardown();   // another quarter: its own roads and its own cabs
  if(world)return true;
  const sc=scene(),q=globalThis.VoidGraphics?.quality||'medium';
  mats=makeMats(sc);own=mats.own;
  world=R.createTraffic(q==='low'?1:2,4127,quarterNow());
  for(const t of world.taxis)t.mesh=buildCab(sc,t.id);
  return true;
 }
 function context(){
  const area=walkingLocation?.area==='interior'?'district':walkingLocation?.area==='milked'?'milked':(globalThis.VoidNeoChinatown?.zone?.({x:walker.x,z:walker.z}).area||'street');
  // On foot includes reading the terminal while on foot: with it open the game's mode is 'hud', and the TAXI / TRANSPORT section used to answer "Taxis pick up on foot, in the city." to everyone (found 16 Nov 2026).
  const onFoot=mode==='walking'||mode==='hud'&&globalThis.VoidHUD?.returnMode==='walking';
  return {onFoot,area,player:[walker.x,walker.z],combat:!!globalThis.VoidFlightSkirmish?.active,busy:!!globalThis.VoidGraphics?.busy,quarter:quarterNow(),inSpace:mode==='play'};
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
  announce?.(res.walk>15?'Street taxi called. It will wait on the road, about '+res.walk+' m from you. Fare '+res.fare+' CR, paid when you board.':'Street taxi on its way to you. Fare '+res.fare+' CR, paid when you board.');
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
 // The cab is standing in a checkpoint's bay with its passenger: hand over to the gate, then carry on in the quarter (or place) on the other side.
 const riderIn=()=>{mode='road-taxi';look={yaw:0,pitch:.08};clearInput?.();walkingKeys?.clear?.();placeRider();paint(0,0);};
 const farArrival=s=>{const A=(s==='corporate'?globalThis.VoidCorporate:globalThis.VoidTemple)?.ARRIVAL;return A?{spawn:A.spawn.slice(),yaw:A.yaw}:{spawn:[0,1.7,0],yaw:0};};
 const doorOn=(laneKey,quarter)=>{const l=Q.lane(laneKey),g=Q.gate(l.gate),e=Q.endOf(g,quarter);return e?{...l.doors[e]}:null;};
 async function cross(){
  const job=world?.job,T=globalThis.VoidGateTransit;if(!job?.via||crossing)return;
  const via=job.via,trip=R.carry(job),seat=R.seatPoint(job.cab),far=via.to.scene,at=far?farArrival(far):{spawn:[seat.x,seat.y,seat.z],yaw:seat.yaw};crossing=true;let ok=false;
  try{ok=!!T&&await T.ride({lane:via.lane,from:via.from,to:via.to,spawn:at.spawn,yaw:at.yaw,after:async()=>{
    if(far){R.arrive(state);teardown();return;}
    teardown();if(!ensure())throw new Error('no roads');R.resume(world,trip);exitDoor=doorOn(via.lane,world.quarter);riderIn();}});}
  catch(e){console.warn('[road taxi]',e);}
  crossing=false;
  if(ok){try{save();hud();}catch{}if(far)announce?.('You step out of the taxi. The ride back is included.');return;}
  // The gate could not take the cab: the fare comes back and the passenger steps out where the cab stands.
  const back=R.recover(state);try{save();hud();}catch{}
  if(mode==='road-taxi'||mode==='preparing'){const j=world?.job;if(j){const d=R.doorPoints(j.cab).find(p=>!globalThis.VoidExplorer?.blocked?.(p.x,p.z,walkingLocation))||{x:j.cab.x,z:j.cab.z};walker.x=d.x;walker.z=d.z;R.release(world,j.cab);}walker.y=1.7;walker.pitch=0;mode='walking';}
  try{gates()?.doors.secure(false);}catch{}
  announce?.('The checkpoint could not take the taxi.'+(back?' Your fare of '+back+' CR was returned.':''));
 }
 // The ride (or the walk) back from the Corporate District or the Temple. The cab ride is included in the fare paid on the way out.
 async function returnFrom(farId,by='cab'){
  const f=Q.far(farId),T=globalThis.VoidGateTransit;if(!f||!T||crossing||T.busy)return false;
  if(by==='foot')return T.arrive({gate:f.gate,by:'foot'});
  const trip=R.returnTrip(farId),lane=Q.lane(trip.through.lane),seat=R.seatPoint({x:lane.mid[0],z:lane.mid[1],yaw:Q.yawInto(f.gate,f.from)});crossing=true;let ok=false;
  try{ok=await T.arrive({gate:f.gate,by:'cab',spawn:[seat.x,seat.y,seat.z],yaw:seat.yaw,after:async()=>{teardown();if(!ensure())throw new Error('no roads');R.resume(world,trip);exitDoor=doorOn(trip.through.lane,world.quarter);riderIn();}});}
  catch(e){console.warn('[road taxi]',e);}
  crossing=false;return ok;
 }
 // The shutters: the one ahead of a cab on its way into a bay rises as it comes near; the one it drove out through drops behind it.
 function shutters(){
  const g=gates(),job=world?.job;if(!g)return;
  if(job&&!job.released&&job.via&&job.cab.phase==='to-dest'){const d=doorOn(job.via.lane,world.quarter);if(d&&Math.hypot(job.cab.x-d.x,job.cab.z-d.z)<17)g.doors.hold(d.id,true);}
  if(exitDoor){const cab=job&&!job.released?job.cab:null;if(!cab||Math.hypot(cab.x-exitDoor.x,cab.z-exitDoor.z)>8.5){g.doors.hold(exitDoor.id,false);exitDoor=null;}}
 }
 // The TAXI / TRANSPORT tab of the terminal (personal-hud.js): the same list the V1 map offers.
 function hudHtml(){const esc=s=>escapeText(String(s??''));
  if(!inCity())return '<p class="hud-note">'+esc(walkingLocation?.corporate||walkingLocation?.temple?'The taxi stop here takes you back to NeoChinatown. The ride back is included in your fare.':'No street taxi service operates here.')+'</p>';
  ensure();const ctx=context(),a=R.availability(state,{...ctx,trip:!!(world?.job&&!world.job.released)}),st=status();
  if(st)return '<article class="hud-card"><h3>'+esc(st.label)+' <small class="hud-tag tracked">'+esc((phaseText[st.phase]||st.phase).toUpperCase())+'</small></h3><p>'+st.distance+' m away · fare '+esc(st.fare)+' CR</p>'+(st.canCancel?'<div class="hud-actions"><button type="button" data-hud-action="taxi-cancel" data-hud-key="taxi-cancel">CANCEL TAXI</button></div>':'')+'</article>';
  if(!a.ok)return '<p class="hud-note">'+esc(a.reason)+'</p>';
  return '<p class="hud-note">'+esc(a.network)+'. A cab drives the roads to you, then to the stop. The fare is paid when you board; cancelling before that costs nothing.</p><h2>DESTINATIONS</h2>'+R.destinations(state,ctx).map(d=>'<article class="hud-card"><h3>'+esc(d.label)+'</h3><p class="hud-meta">'+esc(d.ok?[d.via,d.blurb,d.fare+' CR'].filter(Boolean).join(' · '):d.reason)+'</p><button type="button" data-hud-action="taxi-call:'+esc(d.id)+'" data-hud-key="taxi-'+esc(d.id)+'"'+(d.ok?'':' disabled')+'>'+(d.ok?'CALL TAXI · '+esc(d.fare)+' CR':'UNAVAILABLE')+'</button></article>').join('');}
 function action(a,{close,render}){if(a.startsWith('taxi-call:')){if(hail(a.slice(10)))close();else render();}else if(a==='taxi-cancel'){cancel();render();}}
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
 const phaseText={cruise:'Driving','to-pickup':'On its way',waiting:'Waiting, door open','to-dest':'Driving','in-bay':'Checkpoint',arrived:'Arrived',rejoin:'Leaving',parked:'At the rank'};

 if(globalThis.VoidInteractions)VoidInteractions.register('road-taxi-board',()=>board());
 /* Calling a taxi (David, 16 Nov 2026: "Couldn't figure out how to call a taxi"): CALL A TAXI at the post of every stop and by the District's door, and the G key anywhere on foot.
    Both open the list of destinations with their fares (the terminal's TAXI / TRANSPORT section, the same list the V1 map has). */
 const callList=()=>{if(mode!=='walking')return false;globalThis.VoidHUD?.open?.('taxi');return !!globalThis.VoidHUD?.isOpen;};
 if(globalThis.VoidInteractions)VoidInteractions.register('road-taxi-call',()=>{callList();});
 addEventListener('keydown',e=>{if(e.code!=='KeyG'||e.repeat||e.ctrlKey||e.metaKey||e.altKey||mode!=='walking'||/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName||'')||e.target?.isContentEditable)return;
  if(globalThis.VoidPersonalDevice?.isOpen||globalThis.VoidCharacterCreator?.isOpen||globalThis.VoidVR?.active||document.querySelector('#screen.conversation-live'))return;e.preventDefault();callList();});
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
  if(crossing)return;   // a gate is exchanging quarters round the cab: nothing here runs until it is through
  if(state?.story?.flags?.[R.FLAG]&&!(world?.job&&world.job.charged)){const back=R.recover(state);if(back){try{save();hud();}catch{}announce?.('Your interrupted taxi trip was refunded: '+back+' CR.');}}
  if(!inCity()){if(world?.job?.charged&&world.job.cab?.phase!=='arrived'){const back=R.recover(state);if(back){try{save();hud();}catch{}announce?.('The taxi trip was refunded: '+back+' CR.');}}if(world)teardown();return;}
  if(!scene()||scene().isDisposed)return;
  ensure();if(!world)return;
  if(world.taxis.some(t=>!t.mesh?.root||t.mesh.root.isDisposed())){for(const m of own){try{m.dispose();}catch{}}own=[];mats=null;signTex=null;mats=makeMats(scene());own=mats.own;for(const t of world.taxis)t.mesh=buildCab(scene(),t.id);}
  const riding=mode==='road-taxi';
  const player={x:walker.x,z:walker.z,riding};
  R.stepWorld(world,dt,player);
  shutters();if(world.job&&!world.job.released&&world.job.cab.phase==='in-bay'&&riding){cross();return;}
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

 globalThis.VoidRoadTaxi={hail,cancel,board,exit,status,returnFrom,hudHtml,action,callList,get crossing(){return crossing;},get active(){return !!(world?.job&&!world.job.released);},get world(){return world;}};
})();
