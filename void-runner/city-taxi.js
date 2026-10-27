/* Flying taxis in the city (David's brief, 2026-10-27). Rules are in taxi-rules.js; this is the cab and the trip.
   Call one from the Personal HUD (Taxi / Transport). The cab flies in from out of view at 70 m (above every roof),
   descends into the painted zone nearest you, opens its door and waits. BOARD TAXI (E) seats you in the cabin, the
   fare is charged as the door closes, and it climbs, flies to the destination's zone, lands and opens. E gets you out
   beside it; it closes up and leaves. Cancelling before you board costs nothing. Nothing about a trip is saved except
   the charged fare (refunded once if a reload interrupts the trip); after a reload you start from the landing pad. */
(function(){
 const R=VoidTaxiRules,CRUISE=70,SPEED=30,HOLD=120;
 let cab=null,trip=null,look={yaw:0,pitch:.22},lastTime=null;
 const B=()=>globalThis.BABYLON,scene=()=>VoidBabylon.scene;
 const inCity=()=>!!walkingLocation&&walkingLocation.id==='neochinatown'&&!!walker&&state.location==='earth';
 const ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
 const fwd=h=>[Math.sin(h),Math.cos(h)];
 // ---- The cab ----
 function buildCab(){const b=B(),sc=scene(),root=new b.TransformNode('sky-cab',sc),own=[],mat=(n,f)=>{const m=new b.StandardMaterial('sky-cab-'+n,sc);f(m);own.push(m);return m;};
  const paint=mat('paint',m=>{m.diffuseColor=new b.Color3(.78,.6,.12);m.specularColor=new b.Color3(.5,.45,.3);m.specularPower=64;m.emissiveColor=new b.Color3(.26,.19,.03);});
  const dark=mat('dark',m=>{m.diffuseColor=new b.Color3(.07,.07,.08);m.specularColor=new b.Color3(.2,.2,.22);});
  const glass=mat('glass',m=>{m.diffuseColor=new b.Color3(.05,.12,.14);m.specularColor=new b.Color3(.9,.9,1);m.specularPower=128;m.alpha=.32;m.backFaceCulling=false;});
  const glow=(n,hex)=>mat(n,m=>{m.emissiveColor=b.Color3.FromHexString(hex);m.diffuseColor=b.Color3.Black();m.disableLighting=true;});
  const head=glow('head','#f4f8ff'),tail=glow('tail','#ff3b3b'),thrust=glow('thrust','#5ff2ff'),sign=glow('sign','#ffd23f'),cabin=glow('cabin','#24343a');
  const part=(mesh,m,p,r)=>{mesh.material=m;mesh.parent=root;mesh.position.set(...p);if(r)mesh.rotation.set(...r);mesh.isPickable=false;return mesh;};
  const box=(n,s,m,p)=>part(b.MeshBuilder.CreateBox('sky-cab-'+n,{width:s[0],height:s[1],depth:s[2]},sc),m,p);
  // Body (forward is +z), a cabin of glass on top, a floor and two seats you can see from inside.
  box('hull',[2.4,.75,4.8],paint,[0,.75,0]);box('nose',[2.1,.45,.8],paint,[0,.7,2.75]);box('tail',[2.1,.55,.6],paint,[0,.8,-2.65]);
  box('floor',[2.1,.06,3],dark,[0,1.14,0]);box('seat-front',[.8,.5,.55],dark,[-.45,1.4,.35]);box('seat-passenger',[.8,.35,.6],dark,[.45,1.32,.3]);box('seat-back',[1.8,.5,.55],dark,[0,1.4,-.75]);box('dash',[2,.14,.28],cabin,[0,1.28,1.52]);
  box('roof',[2.2,.08,3.1],paint,[0,2.22,.1]);for(const x of [-1.06,1.06])for(const z of [-1.4,1.62])box('pillar',[.08,1,.08],dark,[x,1.7,z]);
  for(const [n,s,p] of [['glass-l',[.04,.9,3],[-1.08,1.7,.1]],['glass-front',[2.1,.9,.04],[0,1.7,1.7]],['glass-back',[2.1,.9,.04],[0,1.7,-1.42]]])box(n,s,glass,p);
  // The door: the right-hand window and panel, which slides back to open.
  const door=box('door',[.06,1.4,1.3],glass,[1.1,1.55,.2]);const doorPanel=box('door-panel',[.08,.5,1.3],paint,[1.12,.92,.2]);
  box('roof-sign',[.9,.28,.4],sign,[0,2.42,-.1]);
  for(const x of [-.75,.75]){box('headlight',[.35,.12,.05],head,[x,.85,3.16]);box('taillight',[.5,.1,.05],tail,[x,.95,-2.96]);}
  // Four lift fans with their glow.
  const fans=[];for(const [x,z] of [[-1.55,1.7],[1.55,1.7],[-1.55,-1.7],[1.55,-1.7]]){const duct=part(b.MeshBuilder.CreateTorus('sky-cab-duct',{diameter:1.1,thickness:.16,tessellation:20},sc),dark,[x,.75,z]);const g=part(b.MeshBuilder.CreateDisc('sky-cab-thrust',{radius:.45,tessellation:16},sc),thrust,[x,.62,z],[Math.PI/2,0,0]);fans.push(g);}
  // Landing light pool under the cab.
  const t=new b.DynamicTexture('sky-cab-pool',{width:128,height:128},sc,true),g=t.getContext(),rg=g.createRadialGradient(64,64,2,64,64,64);rg.addColorStop(0,'#cfefff');rg.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle='#000';g.fillRect(0,0,128,128);g.fillStyle=rg;g.fillRect(0,0,128,128);t.update();own.push(t);
  const poolM=mat('pool',m=>{m.diffuseColor=b.Color3.Black();m.specularColor=b.Color3.Black();m.emissiveTexture=t;m.disableLighting=true;m.alphaMode=b.Engine.ALPHA_ADD;m.alpha=.6;m.disableDepthWrite=true;});
  const pool=b.MeshBuilder.CreateGround('sky-cab-pool',{width:7,height:9},sc);pool.material=poolM;pool.isPickable=false;
  return {root,door,doorPanel,fans,pool,doorOpen:0,dispose(){root.dispose(false,true);pool.dispose();for(const x of own)x.dispose();}};}
 function place(p,y,h){cab.root.position.set(p[0],y,p[1]);cab.root.rotation.y=h;cab.pool.position.set(p[0],.04,p[1]);cab.pool.rotation.y=h;cab.pool.visibility=y<25?Math.max(0,1-y/25):0;}
 // ---- Trips ----
 const zoneOf=id=>R.zone(state,id);
 function playerPos(){return [walker.x,walker.z];}
 function request(destId){
  if(trip||!inCity())return false;const a=status();if(!a.ok){announce(a.reason);return false;}
  const dest=R.destinations(state,{player:playerPos(),layout:walkingLocation}).find(d=>d.id===destId);if(!dest||!dest.ok){announce(dest?.reason||'That destination isn’t available.');return false;}
  const pickup=R.nearestZone(state,playerPos(),dest.zone);
  // From out of view: behind the player, far off and high above the roofs.
  const back=fwd(walker.yaw+Math.PI),from=[pickup.position[0]+back[0]*220,pickup.position[1]+back[1]*220];
  cab?.dispose();cab=buildCab();trip={phase:'approach',t:0,dest,pickup,from,to:pickup.position,heading:Math.atan2(pickup.position[0]-from[0],pickup.position[1]-from[1]),y:CRUISE,wait:0};
  place(from,CRUISE,trip.heading);announce('Sky cab on its way to '+pickup.name+'. Fare '+dest.fare+' CR, paid as you board.');return true;}
 function cancel(){if(!trip||!['approach','descend','landed'].includes(trip.phase))return false;removeBoarding();trip.phase='leave';trip.t=0;announce('Taxi cancelled. No charge.');return true;}
 function addBoarding(){walkingLocation.interactions=walkingLocation.interactions.filter(i=>i.id!=='taxi-board');const [x,z]=cabSide(1.6);walkingLocation.interactions.push({id:'taxi-board',label:'BOARD TAXI · '+trip.dest.fare+' CR',position:[x,1.7,z],action:'taxi-board',range:3.2});}
 function removeBoarding(){if(walkingLocation)walkingLocation.interactions=walkingLocation.interactions.filter(i=>i.id!=='taxi-board');}
 // A point beside the cab's door (its right side), d metres out.
 function cabSide(d){const h=cab.root.rotation.y,r=[Math.cos(h),-Math.sin(h)];return [cab.root.position.x+r[0]*d,cab.root.position.z+r[1]*d];}
 function board(){
  if(!trip||trip.phase!=='landed')return;
  if(!R.charge(state,trip.dest.id,trip.dest.fare)){announce('Not enough credits for this fare. The cab leaves.');removeBoarding();trip.phase='leave';trip.t=0;return;}
  save();hud();removeBoarding();document.exitPointerLock?.();clearInput();walkingKeys?.clear?.();
  trip.phase='boarding';trip.t=0;trip.fromCam={x:walker.x,y:walker.y,z:walker.z,yaw:walker.yaw,pitch:walker.pitch};mode='taxi';look={yaw:0,pitch:.22};
  announce('Fare '+trip.dest.fare+' CR paid. '+trip.dest.label+'.');}
 function exit(){
  if(!trip||trip.phase!=='arrived')return;
  // Out by the door, or whichever side is clear.
  for(const d of [2.2,-2.2]){const [x,z]=cabSide(d);if(!globalThis.VoidExplorer?.blocked?.(x,z,walkingLocation)){walker.x=x;walker.z=z;break;}}
  walker.y=1.7;walker.yaw=cab.root.rotation.y+Math.PI/2;walker.pitch=0;R.arrive(state);save();mode='walking';clearInput();walkingKeys?.clear?.();
  trip.phase='close';trip.t=0;announce('Arrived: '+trip.dest.label+'.');}
 // ---- Each frame ----
 // The passenger sits up front on the right, by the door (the cab drives itself).
 const seat=()=>{const h=cab.root.rotation.y,f=fwd(h);return {x:cab.root.position.x+f[0]*.3+Math.cos(h)*.45,y:cab.root.position.y+1.85,z:cab.root.position.z+f[1]*.3-Math.sin(h)*.45};};
 function fly(dt,to,next){const [x,z]=[cab.root.position.x,cab.root.position.z],dx=to[0]-x,dz=to[1]-z,d=Math.hypot(dx,dz);
  const want=Math.atan2(dx,dz),diff=((want-cab.root.rotation.y+Math.PI*3)%(Math.PI*2))-Math.PI,h=cab.root.rotation.y+diff*Math.min(1,dt*2.2),speed=Math.min(SPEED,Math.max(4,d*.6)),step=Math.min(d,speed*dt);
  place([x+dx/(d||1)*step,z+dz/(d||1)*step],trip.y,h);cab.root.rotation.z=-diff*.25;if(d<.6){cab.root.rotation.z=0;next();}}
 function vertical(dt,target,next){const dy=target-trip.y,rate=Math.max(1.6,Math.min(12,Math.abs(dy)*.7));trip.y+=Math.sign(dy)*Math.min(Math.abs(dy),rate*dt);place([cab.root.position.x,cab.root.position.z],trip.y,cab.root.rotation.y);if(Math.abs(target-trip.y)<.02)next();}
 function doorTo(open,dt){cab.doorOpen=Math.max(0,Math.min(1,cab.doorOpen+(open?1:-1)*dt*1.4));for(const p of [cab.door,cab.doorPanel])p.position.z=.2-cab.doorOpen*1.25;return open?cab.doorOpen>=1:cab.doorOpen<=0;}
 function districtReady(){const d=trip.dest.placeholder&&VoidNeoChinatown.city;return !d||d.live.has(trip.dest.id);}
 function step(dt,time){
  if(!cab||!trip)return;trip.t+=dt;for(const f of cab.fans)f.visibility=.7+Math.sin(time*40+f.position.x)*.25;
  switch(trip.phase){
   case 'approach':fly(dt,trip.pickup.position,()=>{trip.phase='descend';});break;
   case 'descend':{const near=Math.hypot(walker.x-trip.pickup.position[0],walker.z-trip.pickup.position[1])<3.2&&mode==='walking';
    if(near&&trip.y<8){trip.hold=true;break;}trip.hold=false;vertical(dt,0,()=>{trip.phase='landed';trip.wait=0;});break;}
   case 'landed':if(doorTo(true,dt)&&!walkingLocation.interactions.some(i=>i.id==='taxi-board'))addBoarding();trip.wait+=dt;if(trip.wait>HOLD){removeBoarding();announce('The taxi couldn’t wait any longer. No charge.');trip.phase='leave';trip.t=0;}break;
   case 'boarding':{const k=Math.min(1,trip.t/1.1),e=ease(k),s=seat(),f=trip.fromCam;walker.x=f.x+(s.x-f.x)*e;walker.y=f.y+(s.y-f.y)*e;walker.z=f.z+(s.z-f.z)*e;walker.yaw=f.yaw+((cab.root.rotation.y-f.yaw+Math.PI*3)%(Math.PI*2)-Math.PI)*e;walker.pitch=f.pitch*(1-e);doorTo(false,dt);if(k>=1&&cab.doorOpen<=0){trip.phase='climb';trip.t=0;}break;}
   case 'climb':vertical(dt,CRUISE,()=>{trip.phase='cruise';trip.to=zoneOf(trip.dest.zone).position;});break;
   case 'cruise':fly(dt,trip.to,()=>{if(districtReady())trip.phase='land';else trip.phase='circle';});break;
   // The destination isn't ready yet: hold over it rather than land into an empty street.
   case 'circle':{const a=trip.t*.4,c=trip.to;place([c[0]+Math.sin(a)*12,c[1]+Math.cos(a)*12],trip.y,a+Math.PI/2);if(districtReady()&&trip.t>1){place(c,trip.y,cab.root.rotation.y);trip.phase='land';}else if(trip.t>20){trip.phase='land';}break;}
   case 'land':vertical(dt,0,()=>{trip.phase='opening';});break;
   case 'opening':if(doorTo(true,dt)){trip.phase='arrived';announce('Arrived. Press E to get out.');}break;
   case 'arrived':break;
   case 'close':if(doorTo(false,dt)&&trip.t>1.2){trip.phase='leave';trip.t=0;}break;
   case 'leave':if(cab.doorOpen>0){doorTo(false,dt);break;}if(trip.y<CRUISE)vertical(dt,CRUISE,()=>{});else{const f=fwd(cab.root.rotation.y);fly(dt,[cab.root.position.x+f[0]*50,cab.root.position.z+f[1]*50],()=>{});if(trip.t>14){cab.dispose();cab=null;trip=null;}}break;}
  // In the cab: the camera sits in the back seat and looks where you look.
  if(trip&&mode==='taxi'&&trip.phase!=='boarding'){const s=seat();walker.x=s.x;walker.y=s.y;walker.z=s.z;walker.yaw=cab.root.rotation.y+look.yaw;walker.pitch=look.pitch;}
 }
 // ---- Status for the HUD ----
 function status(){if(!inCity())return R.availability(state,{inSpace:mode==='play'||VoidHUD?.isOpen&&!walkingLocation});const area=VoidNeoChinatown.zone({x:walker.x,z:walker.z}).area;
  return R.availability(state,{onFoot:true,area,busy:typeof VoidGraphics!=='undefined'&&VoidGraphics.busy,combat:!!globalThis.VoidFlightSkirmish?.active});}
 const phaseText={approach:'On its way',descend:'Landing',landed:'Waiting for you, door open',boarding:'Boarding',climb:'Climbing',cruise:'In flight',circle:'Holding over the destination',land:'Landing',opening:'Opening the door',arrived:'Arrived',close:'Leaving',leave:'Leaving'};
 function hudHtml(){const esc=s=>escapeText(String(s??''));const a=status();
  if(!a.ok)return '<p class="hud-note">'+esc(a.reason)+'</p>';
  let html='<p class="hud-note">'+esc(a.network)+'. Cabs land in the painted TAXI zones. The fare is paid when you board; cancelling before that costs nothing.</p>';
  if(trip){const d=Math.round(Math.hypot(walker.x-cab.root.position.x,walker.z-cab.root.position.z));
   return html+'<article class="hud-card"><h3>'+esc(trip.dest.label)+' <small class="hud-tag tracked">'+esc((phaseText[trip.phase]||'').toUpperCase())+'</small></h3><p>Pickup: '+esc(trip.pickup.name)+' · '+d+' m away · fare '+esc(trip.dest.fare)+' CR</p>'+(trip.hold?'<p>Step clear of the landing zone so it can set down.</p>':'')+
    (['approach','descend','landed'].includes(trip.phase)?'<div class="hud-actions"><button type="button" data-hud-action="taxi-cancel" data-hud-key="taxi-cancel">CANCEL TAXI</button></div>':'')+'</article>';}
  const list=R.destinations(state,{player:playerPos(),layout:walkingLocation});
  return html+'<h2>DESTINATIONS</h2>'+list.map(d=>'<article class="hud-card"><h3>'+esc(d.label)+(d.placeholder?' <small class="hud-tag">PLACEHOLDER</small>':'')+'</h3><p class="hud-meta">'+esc(d.ok?'Lands at '+(zoneOf(d.zone)?.name||'')+' · '+d.fare+' CR':d.reason)+'</p>'+
   '<button type="button" data-hud-action="taxi-call:'+esc(d.id)+'" data-hud-key="taxi-'+esc(d.id)+'"'+(d.ok?'':' disabled')+'>'+(d.ok?'CALL TAXI · '+esc(d.fare)+' CR':'UNAVAILABLE')+'</button></article>').join('');}
 function action(a,{close,render}){if(a.startsWith('taxi-call:')){if(request(a.slice(10)))close();else render();}else if(a==='taxi-cancel'){cancel();render();}}
 VoidInteractions.register('taxi-board',()=>board());
 // ---- Input in the cab ----
 addEventListener('mousemove',e=>{if(mode!=='taxi')return;look.yaw=Math.max(-1.7,Math.min(1.7,look.yaw+e.movementX*.004));look.pitch=Math.max(-.7,Math.min(.5,look.pitch+e.movementY*.003));});
 addEventListener('keydown',e=>{if(mode!=='taxi')return;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code)){e.preventDefault();look.yaw+=e.code==='ArrowLeft'?-.12:e.code==='ArrowRight'?.12:0;look.pitch+=e.code==='ArrowUp'?-.08:e.code==='ArrowDown'?.08:0;}
  if((e.code==='KeyE'||e.code==='Enter')&&trip?.phase==='arrived'){e.preventDefault();e.stopPropagation();exit();}},true);
 let prevA=false;
 // ---- Hooks: the game loop, the scene leaving, and a marker to the cab ----
 const taxiUpdate=update;update=function(dt){taxiUpdate(dt);
  if(state?.story?.flags?.taxiTrip&&!trip){const back=R.recover(state);if(back){save();hud();announce('Your interrupted taxi trip was refunded: '+back+' CR.');}}
  if(trip&&!inCity()){cab?.dispose();cab=null;trip=null;if(mode==='taxi')mode='walking';return;}
  if(mode==='taxi'){let pad=null;try{pad=[...(navigator.getGamepads?.()||[])].find(p=>p&&p.connected!==false);}catch{}const a=!!pad?.buttons?.[0]?.pressed;if(a&&!prevA&&trip?.phase==='arrived')exit();prevA=a;if(pad){look.yaw=Math.max(-1.7,Math.min(1.7,look.yaw+(pad.axes[2]||0)*dt*1.6));}}
  if(cab&&!scene()?.isDisposed){step(dt,performance.now()/1000);}};
 const taxiDraw=draw;draw=function(){taxiDraw();if(!trip||!cab||!scene())return;
  if(mode==='taxi'){ctx.save();ctx.fillStyle='rgba(6,8,11,.82)';ctx.fillRect(W/2-230,H-86,460,46);ctx.strokeStyle='#2aa6b8';ctx.strokeRect(W/2-230,H-86,460,46);ctx.fillStyle='#ffd23f';ctx.font='bold 14px Consolas,monospace';ctx.textAlign='center';ctx.fillText('SKY CAB · '+trip.dest.label.toUpperCase()+' · '+(phaseText[trip.phase]||'').toUpperCase(),W/2,H-66);ctx.fillStyle='#b9c8ce';ctx.font='12px Consolas,monospace';ctx.fillText(trip.phase==='arrived'?'E / EXIT TAXI':'Mouse or arrow keys to look around',W/2,H-48);ctx.restore();return;}
  if(mode!=='walking'||!['approach','descend','landed'].includes(trip.phase))return;
  // A marker on the cab, or at the screen edge toward it.
  const b=B(),sc=scene(),cam=sc.activeCamera,p=new b.Vector3(cab.root.position.x,cab.root.position.y+2.6,cab.root.position.z),view=b.Vector3.TransformCoordinates(p,sc.getViewMatrix()),s=b.Vector3.Project(p,b.Matrix.Identity(),sc.getTransformMatrix(),cam.viewport.toGlobal(W,H));
  let x=s.x,y=s.y;if(view.z<0){x=W-x;y=H*.85;}x=Math.max(40,Math.min(W-40,x));y=Math.max(60,Math.min(H-80,y));
  const d=Math.round(Math.hypot(walker.x-cab.root.position.x,walker.z-cab.root.position.z));ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);ctx.fillStyle='#ffd23f';ctx.fillRect(-8,-8,16,16);ctx.restore();ctx.save();ctx.fillStyle='#ffd23f';ctx.font='bold 12px Consolas,monospace';ctx.textAlign='center';ctx.fillText('TAXI · '+d+' m'+(trip.hold?' · STEP CLEAR':''),x,y+26);ctx.restore();};
 globalThis.VoidTaxi={hudHtml,action,request,cancel,board,exit,status,get trip(){return trip;},get cab(){return cab;}};
})();
