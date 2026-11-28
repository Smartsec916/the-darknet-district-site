/* Drivable utility vehicle (browser side). Rules, numbers and input mapping: vehicle-rules.js (VoidVehicleRules, Node-tested). Model: Blender build
   tools/assets/vehicles/build_utility_vehicle.py -> assets/models/vehicles/utility-vehicle.glb (made by Claude; no third-party assets). The look, the name
   UTILITY VEHICLE, the prompt DRIVE UTILITY VEHICLE and the Vesper parking spot are PROPOSED defaults (owner decision pending).
   How it fits the game (no new mode, no save data):
   - The game stays in mode 'walking'; while driving, VoidVehicle.driving makes input-state.js resolve its existing 'seated' policy (pointer lock and mouse look
     kept, on-foot movement, jumping, weapons and game shortcuts off), the same policy the tea-room seat and VR seats use. So menus, dialogue, the V1 device and
     every other UI keep working and pause the vehicle; nothing drives while a text field, menu or conversation has the input.
   - The player (walker) sits in the driver's seat, so zones, music, NPC awareness and multiplayer see him there. Only the picture changes: renderRoom gets a
     chase camera (or the bonnet view; C or R3 switches) in place of the walker's own eye; the mouse / right stick turn that camera through the walker's own yaw and pitch.
   - Enter at the driver door with the interact key (E, or the gamepad's interact button); the same key exits. The parked body is three box solids for people on
     foot (opened while someone drives). The parked pose resets on every load of the location; nothing is saved.
   - Reusable: VoidVehicle.configure(locationId, {spot, groundHeight, inBounds, solids}) lets a location (e.g. the Vesper road, once it lands) supply its parking
     spot, ground height and drivable area without changing this file. */
(function(){
 'use strict';
 const R=globalThis.VoidVehicleRules;if(!R||typeof document==='undefined')return;
 const S=R.SPEC,B=()=>globalThis.BABYLON,scene=()=>globalThis.VoidBabylon?.scene;
 const config={};                                         // locationId -> {spot, groundHeight, inBounds, solids}
 let v=null,loc=null,built=null,nodes=null,driving=false,view='chase',loading=false,failed=false,item=null,walk=[],keys=new Set(),prevPad={},lastYaw=0,expectYaw=null,idle=0,cam=null,hud=null,padSeen=0;
 const exitItem={id:'utility-vehicle-exit',action:'vehicle-exit',label:'EXIT VEHICLE',position:[0,0,0],range:99};
 const spotFor=id=>config[id]?.spot||R.SPOTS[id]||null;
 const here=()=>{try{return typeof walkingLocation!=='undefined'&&walkingLocation&&typeof walker!=='undefined'&&walker&&spotFor(walkingLocation.id)?walkingLocation:null;}catch{return null;}};
 const policy=()=>globalThis.VoidInputState?.current||{};
 const ctx=()=>({mode:typeof mode==='string'?mode:'',ui:!!policy().ui||(globalThis.VoidHUD?.isOpen??false),busy:!!globalThis.VoidGraphics?.busy,cutscene:!!document.getElementById('screen')?.dataset?.scene,driving});
 const world=()=>{const c=config[loc?.id]||{};return {solids:[...(loc?.solids||[]),...(c.solids||[])],bounds:loc?.bounds,inBounds:c.inBounds,groundHeight:c.groundHeight};};
 const blockedOnFoot=(x,z)=>globalThis.VoidExplorer?.blocked?.(x,z,loc)??false;

 // ---- model ----
 function placeholder(sc,b){   // only if the GLB cannot load: plain boxes with the same node names (a labelled placeholder, not the finished look)
  const own=[],root=new b.TransformNode('utility-vehicle-fallback',sc),m=new b.PBRMaterial('utility-vehicle-fallback-paint',sc);m.albedoColor=new b.Color3(.5,.32,.14);m.roughness=.7;m.metallic=.1;own.push(m);
  const body=b.MeshBuilder.CreateBox('body',{width:1.86,height:1.1,depth:4.6},sc);body.position.y=1.05;body.material=m;body.parent=root;
  const parts={root,steer:{},wheel:{}};
  for(const [n,x,z] of [['FL',-S.track/2,S.wheelbase/2],['FR',S.track/2,S.wheelbase/2],['RL',-S.track/2,-S.wheelbase/2],['RR',S.track/2,-S.wheelbase/2]]){
   const p=new b.TransformNode('steer_'+n,sc);p.parent=root;p.position.set(x,S.wheelR,z);const w=b.MeshBuilder.CreateCylinder('wheel_'+n,{diameter:S.wheelR*2,height:.3,tessellation:14},sc);w.rotation.z=Math.PI/2;w.material=m;
   const hub=new b.TransformNode('wheel-node-'+n,sc);hub.parent=p;w.parent=hub;parts.steer[n]=n[0]==='F'?p:null;parts.wheel[n]=hub;}
  return {root,own,parts};
 }
 function instantiate(sc,container){
  const b=B(),root=new b.TransformNode('utility-vehicle',sc);
  const inst=container.instantiateModelsToScene(n=>'utility-vehicle-'+n,false);
  for(const r of inst.rootNodes)r.parent=root;
  const all=root.getDescendants(false),find=n=>all.find(x=>x.name==='utility-vehicle-'+n||x.name.endsWith('-'+n))||null;
  const parts={root,steer:{FL:find('steer_FL'),FR:find('steer_FR')},wheel:{FL:find('wheel_FL'),FR:find('wheel_FR'),RL:find('wheel_RL'),RR:find('wheel_RR')}};
  return {root,own:[],parts,inst};
 }
 function shadows(sc,root){try{const g=sc.getLightByName('sun')?.getShadowGenerator?.();if(!g)return;for(const m of root.getChildMeshes(false)){g.addShadowCaster(m,false);m.receiveShadows=true;}}catch{}}
 function build(sc){
  if(built||loading)return;
  const b=B(),A=globalThis.VoidAssets;
  const done=made=>{built=made;nodes=made.parts;for(const m of made.root.getChildMeshes(false)){m.isPickable=false;}shadows(sc,made.root);sync();if(item)item.hidden=false;};
  if(failed||!A?.loadContainer){done(placeholder(sc,b));return;}
  loading=true;const forLoc=loc;
  Promise.resolve(A.loadContainer({src:R.MODEL.src},sc,null,R.MODEL.id)).then(container=>{
   loading=false;
   if(scene()!==sc||loc!==forLoc){container.dispose();return;}
   const made=instantiate(sc,container);made.container=container;done(made);
  }).catch(e=>{loading=false;failed=true;console.warn('[vehicle] the model did not load; a box placeholder stands in',e?.message||e);if(scene()===sc&&loc===forLoc)done(placeholder(sc,b));});
 }
 function dispose(){
  try{built?.root?.dispose(false,false);}catch{}try{built?.container?.dispose();}catch{}for(const o of built?.own||[])try{o.dispose();}catch{}
  built=null;nodes=null;
 }

 // ---- location lifecycle: a new walkingLocation object means a (re)load; the vehicle is parked at its spot again ----
 function teardown(){
  if(driving)leave(true);
  if(loc){loc.solids=loc.solids.filter(s=>!walk.includes(s));loc.interactions=loc.interactions.filter(i=>i!==item);}
  dispose();v=null;loc=null;walk=[];item=null;keys.clear();cam=null;
 }
 function setup(at){
  loc=at;const spot=spotFor(at.id);v=R.create(spot);R.pose(v,world().groundHeight);
  walk=R.walkSolids(v);at.solids.push(...walk);
  item={id:'utility-vehicle-door',action:'vehicle-enter',label:'DRIVE '+R.MODEL.name,position:R.doorPoint(v),range:2.6,hidden:true};at.interactions.push(item);
 }
 function syncSolids(){const fresh=R.walkSolids(v,driving);walk.forEach((s,i)=>{s.position=fresh[i].position;s.open=fresh[i].open;});if(item)item.position=R.doorPoint(v);}
 function sync(){
  if(!built||!v)return;const b=B(),r=built.root;
  r.position.set(v.x,v.y,v.z);r.rotationQuaternion=b.Quaternion.RotationYawPitchRoll(v.yaw,v.pitch,v.roll);
  for(const k of ['FL','FR'])if(nodes.steer[k])nodes.steer[k].rotationQuaternion=b.Quaternion.RotationAxis(b.Axis.Y,v.steer*R.MODEL.steerSign);
  for(const k of ['FL','FR','RL','RR'])if(nodes.wheel[k])nodes.wheel[k].rotationQuaternion=b.Quaternion.RotationAxis(b.Axis.X,v.spin*R.MODEL.spinSign);
 }

 // ---- enter / exit ----
 function lock(){setTimeout(()=>{try{const c=document.getElementById('space');if(c&&document.pointerLockElement!==c&&policy().pointerLock!==false)Promise.resolve(c.requestPointerLock?.()).catch(()=>{});}catch{}},60);}
 function enter(){
  const ok=R.canEnter(ctx());if(!ok.ok||!v||!built)return false;
  try{if(typeof groundState!=='undefined'&&groundState.drawn&&typeof groundAction==='function')groundAction('draw');}catch{}   // holster first (the hand weapon is drawn on the camera)
  driving=true;v.vx=v.vz=0;keys.clear();prevPad={};syncSolids();
  walker.vx=walker.vz=0;walker.jumpRequested=false;walker.height=0;walker.yaw=v.yaw;walker.pitch=.24;lastYaw=v.yaw;expectYaw=walker.yaw;idle=0;
  try{walkingKeys.clear();}catch{}
  try{VoidAudio.event('door');}catch{}
  placeDriver();lock();return true;
 }
 function leave(silent){
  if(!driving)return;driving=false;v.vx=v.vz=0;v.speed=0;keys.clear();syncSolids();   // the vehicle parks where it is
  if(!silent&&loc&&walker){
   const p=R.exitPoint(v,blockedOnFoot)||(()=>{const s=R.seat(v),f=globalThis.VoidExplorer?.free?.(s.x,s.z,loc,8);return f&&!f.failed?{x:f.x,z:f.z,yaw:v.yaw}:{x:s.x,z:s.z,yaw:v.yaw};})();
   walker.x=p.x;walker.z=p.z;walker.yaw=p.yaw;walker.pitch=0;walker.vx=walker.vz=0;walker.height=0;walker.jumpRequested=false;walker.y=walker.eye||1.68;
   try{VoidAudio.event('door');}catch{}lock();
  }
  cam=null;if(hud)hud.hidden=true;
 }
 function placeDriver(){const s=R.seat(v);walker.x=s.x;walker.z=s.z;}

 // ---- input ----
 const editable=t=>!!t&&(/INPUT|TEXTAREA|SELECT/.test(t.tagName||'')||t.isContentEditable);
 addEventListener('keydown',e=>{
  if(!driving||editable(e.target)||e.ctrlKey||e.metaKey||e.altKey)return;
  if(!R.canDrive(ctx())){keys.clear();return;}
  if(R.KEYS.camera.includes(e.code)){if(!e.repeat)toggleView();e.preventDefault();return;}
  if(R.DRIVE_KEYS.includes(e.code)){keys.add(e.code);e.preventDefault();}
 },true);
 addEventListener('keyup',e=>keys.delete(e.code),true);
 addEventListener('blur',()=>keys.clear());
 addEventListener('void-input-clear',()=>keys.clear());
 function toggleView(){view=view==='chase'?'hood':'chase';}
 function readPad(){let pad=null;try{for(const p of navigator.getGamepads?.()||[])if(p&&p.connected!==false&&(p.mapping==='standard'||p.axes?.length>=4)){pad=p;break;}}catch{}
  const c=globalThis.VoidInput?.controller||{};return R.gamepadInput(pad,{bindings:c.bindings,leftDeadZone:c.leftDeadZone,rightDeadZone:c.rightDeadZone,invertY:c.invertY});}

 // ---- per frame ----
 function tick(dt){
  const at=here();
  if(loc&&(at!==loc||(built&&built.root.isDisposed())))teardown();
  if(!at)return;
  if(!loc)setup(at);
  const sc=scene();if(sc&&!built)build(sc);
  if(!v)return;
  if(driving){
   const play=R.canDrive(ctx());
   const pad=readPad(),edge=R.edges(prevPad,pad.buttons);prevPad=pad.buttons;
   if(pad.throttle||pad.brake||pad.steer||pad.lookX||pad.lookY||Object.values(pad.buttons).some(Boolean))padSeen=3;else padSeen=Math.max(0,padSeen-dt);
   let input=play?R.combine(R.keyboardInput(keys),pad):R.none();
   if(play){
    if(edge.pause&&typeof openGameMenu==='function'){openGameMenu();return;}
    if(edge.exit){leave(false);return;}
    if(edge.camera)toggleView();
    const c=globalThis.VoidInput?.controller||{},sens=(c.sensitivity||1)*dt*2.5;
    if(pad.lookX||pad.lookY){walker.yaw+=pad.lookX*sens;walker.pitch=Math.max(-1.2,Math.min(1.2,walker.pitch+pad.lookY*sens));}
    R.step(v,input,dt,world());
   }
   // The camera turns with the vehicle; mouse / stick look is an offset that eases back behind the vehicle after a quiet moment while moving.
   const turned=R.yawDelta(lastYaw,v.yaw);lastYaw=v.yaw;
   const looked=expectYaw!==null&&Math.abs(R.yawDelta(expectYaw,walker.yaw))>1e-4;
   walker.yaw+=turned;
   idle=looked?0:idle+dt;
   if(view==='chase'&&idle>1.5&&Math.abs(v.speed)>2){const back=v.speed<0?Math.PI:0;walker.yaw+=R.yawDelta(walker.yaw,v.yaw+back)*Math.min(1,dt*1.6);}
   expectYaw=walker.yaw;
   placeDriver();syncSolids();
   const w=world();const occluded=(x,y,z)=>{if(w.inBounds&&!w.inBounds(x,z,0))return false;return w.solids.some(s=>!s.open&&!String(s.id||'').startsWith(R.SOLID_PREFIX)&&Math.abs(x-s.position[0])<s.size[0]/2&&Math.abs(z-s.position[2])<s.size[2]/2&&y<s.position[1]+s.size[1]/2&&y>s.position[1]-s.size[1]/2);};
   cam=view==='chase'?R.chaseCamera(v,{yaw:walker.yaw,pitch:walker.pitch},occluded):R.hoodCamera(v,{yaw:walker.yaw,pitch:walker.pitch});
   paintHud();
  }
  sync();
 }
 function paintHud(){
  if(!hud){hud=document.createElement('div');hud.id='vehicle-hud';hud.setAttribute('role','status');hud.style.cssText='position:fixed;left:50%;top:12%;transform:translateX(-50%);padding:6px 12px;color:#e2c99a;background:#0b0f12cc;border:1px solid #6b5536;font:12px monospace;letter-spacing:.08em;pointer-events:none;z-index:40;text-align:center;white-space:nowrap';document.body.append(hud);}
  const kmh=Math.round(Math.abs(v.speed)*3.6),gear=v.speed<-.3?'R':Math.abs(v.speed)<.3?'N':'D';
  const help=padSeen>0?'RT DRIVE · LT BRAKE / REVERSE · L STICK STEER · '+label('jump')+' HANDBRAKE · R3 CAMERA · '+label('interact')+' EXIT':'W DRIVE · S BRAKE / REVERSE · A/D STEER · SPACE HANDBRAKE · SHIFT BOOST · C CAMERA · E EXIT';
  hud.innerHTML=R.MODEL.name+' · '+gear+' · '+kmh+' KM/H<br><small style="color:#9a8c74">'+help+'</small>';hud.hidden=!(driving&&typeof mode==='string'&&mode==='walking');
 }
 const label=id=>{try{const n=['A','B','X','Y','LB','RB','LT','RT','VIEW','MENU','L3','R3','UP','DOWN','LEFT','RIGHT','HOME'];return n[globalThis.VoidInput.controller.bindings[id]]||id.toUpperCase();}catch{return id.toUpperCase();}};

 // ---- hooks into the existing walking loop ----
 const X=globalThis.VoidExplorer;
 if(X){
  const step=X.step;X.step=function(player,...a){if(driving&&typeof walker!=='undefined'&&player===walker)return;return step.call(this,player,...a);};
  const select=X.select;X.select=function(player,...a){if(driving&&typeof walker!=='undefined'&&player===walker)return exitItem;return select.call(this,player,...a);};
 }
 const VB=globalThis.VoidBabylon;
 if(VB?.renderRoom){const render=VB.renderRoom;VB.renderRoom=function(player,...a){if(driving&&cam&&typeof walker!=='undefined'&&player===walker)return render.call(this,cam,...a);return render.call(this,player,...a);};}
 const wait=setInterval(()=>{if(typeof VoidInteractions==='undefined'||!VoidInteractions.register)return;clearInterval(wait);
  VoidInteractions.register('vehicle-enter',()=>{enter();});
  VoidInteractions.register('vehicle-exit',()=>{leave(false);});
 },300);
 const vehicleUpdate=update;update=function(dt){vehicleUpdate(dt);try{tick(dt);}catch(e){console.warn('[vehicle]',e);}};

 globalThis.VoidVehicle={
  get driving(){return driving;},get vehicle(){return v;},get view(){return view;},get camera(){return cam;},get built(){return !!built;},get location(){return loc?.id||null;},
  configure(id,opts={}){config[id]={...(config[id]||{}),...opts};if(loc?.id===id&&opts.spot&&!driving){teardown();}},   // a new spot applies on the next frame
  enter,exit:()=>leave(false),toggleView,
  setPose(p){if(!v)return;Object.assign(v,p);R.pose(v,world().groundHeight);syncSolids();sync();}   // tests / Dev Tools placement
 };
})();
