/* Docking and departure in the game (docs/development/STATION_DOCKING.md): joins the pure movement in docking.js to the flight the game already has.
   The game keeps the ship at the centre and moves the world past it, so the station's place on screen is simply the ship's place in the dock frame,
   reversed. Nothing here changes manual flight: it runs only in the route's 'departure' phase at a station, in the last third of the jump (where the
   station is drawn coming up) and in the 'arrived' phase at a station. Planets and Vesper keep their own landings.
   - departureStep(dt): world-integration.js calls it in place of its fixed ramp. Control returns at exactly the speed and heading manual flight holds.
   - arrivalStep(dt): cockpit.js calls it in place of its three-second timer; true when the ship is docked and clamped (then the station is loaded).
   - stationPose(): babylon-renderer.js and the traffic ask where the station stands.
   - camera(basis, dt): a little inertia in the view; render(kit): manoeuvring jets tied to the real thrust, and the hangar's lights and clamps. */
(function(root){
 'use strict';
 const D=root.VoidDocking;if(!D)return;
 const M=D.math;let sim=null,owner=null,view={pitch:0,yaw:0,roll:0,shake:0},revealPlan=null,throttleHome=.8,fx=null,clock=0,lastPhase='';
 const stations=()=>root.VoidStationLayouts?.meridianClass||[];
 const applies=id=>stations().includes(id)&&!root.VoidUniverse?.planetside?.(id)&&root.VoidGraphics?.renderer!=='legacy';
 function config(id){const craft=root.VoidFlightCraft,ship=craft?.ship?.()?.id||'starter';return D.resolve(root.VoidStationLayouts?.docking,id,ship,craft?.stats?.().flight);}
 const sound=name=>{try{root.VoidAudio?.event(name,root.VoidFlightCraft?.stats?.().ship);}catch{}};
 // The simulation's attitude and velocity become the flight's own.
 function apply(){const a=D.anglesOf(sim.q),b=D.qbasis(sim.q);flight.yaw=a.yaw;flight.pitch=a.pitch;flight.roll=a.roll;
  flight.yawRate=M.dot(sim.w,b.u);flight.pitchRate=M.dot(sim.w,b.r);flight.rollRate=-M.dot(sim.w,b.f);flight.velocity={x:sim.v.x,y:sim.v.y,z:sim.v.z};}
 function events(){for(const e of sim.events){if(e==='clamp')sound('lock');else if(e==='creep')sound('door');else if(e==='burn')sound('boost');else if(e==='final')sound('cycle');if(e==='clamp'||e==='creep'||e==='docked')view.shake=1;}}
 function departureStep(dt){
  const r=flight.route;if(!r||r.phase!=='departure'||r.progress>0||!applies(r.origin))return false;
  if(!sim||owner!==r||sim.kind!=='departure'){
   const stats=root.VoidFlightCraft.stats(),gain=1+(root.VoidFlightCraft.upgrades?.().engines||0)*.065;throttleHome=flight.throttle;
   sim=D.beginDeparture({config:config(r.origin),q:D.qfromAngles(flight.yaw,flight.pitch,flight.roll),handoffSpeed:stats.flight.maxSpeed*gain*throttleHome/1.4,heading:r.vector});owner=r;sim.station=r.origin;sound('cycle');view.shake=.6;}
  D.step(sim,dt);apply();events();
  const hold=root.VoidWarp.config.departureSeconds;
  // the engine note follows the thrust; control returns with the throttle where the pilot left it
  flight.throttle=sim.done?throttleHome:M.clamp(.3+(throttleHome-.3)*M.len(sim.v)/Math.max(1,sim.handoffSpeed),.3,throttleHome);
  r.departure=sim.done?hold:Math.min(r.departure,hold-.08);      // the route's own clock waits for the ship
  return true;
 }
 function arrivalStep(dt){
  const r=flight.route;if(!r||r.phase!=='arrived'||!applies(r.destination))return null;
  if(!sim||owner!==r||sim.kind!=='arrival'){const c=config(r.destination),plan=planFor(r,c),v=flight.velocity||{x:0,y:0,z:0};
   // it starts exactly where the station was last drawn
   sim=D.beginArrival({config:c,p:{x:0,y:0,z:-(plan.shown??c.startDistance)},v:{x:v.x,y:v.y,z:plan.speed},q:D.qfromAngles(flight.yaw,flight.pitch,flight.roll)});owner=r;sim.station=r.destination;}
  if(sim.done)return true;
  D.step(sim,dt);apply();events();
  flight.throttle=M.clamp(.3+.5*M.len(sim.v)/sim.config.approachSpeed,.3,.8);
  return sim.done;
 }
 // How the station comes up at the end of the jump: fixed once, from the speed the ship really has, so the hand-over to the approach has no step.
 function planFor(r,c){if(revealPlan?.route===r)return revealPlan;const v=flight.velocity||{z:0};
  return revealPlan={route:r,near:c.startDistance,speed:M.clamp(v.z||0,12,c.approachSpeed),seconds:Math.max(.5,(r.policy?.seconds||root.VoidWarp.config.warpSeconds)/3)};}
 /* Where the station's origin stands (flight space), or null when this system is not flying the ship. u: the jump's reveal, 0 to 1. */
 function stationPose(r=flight.route,u=1){
  if(!r||!applies(r.destination))return null;
  if(r.phase==='arrived'&&sim&&owner===r&&sim.kind==='arrival')return {x:-sim.p.x,y:4-sim.p.y,z:15-sim.p.z};
  if(r.phase==='warp'||r.phase==='arrived'){const c=config(r.destination),plan=planFor(r,c);if(r.phase==='warp')plan.shown=D.reveal(u,plan);return {x:0,y:4,z:15+(plan.shown??plan.near)};}
  return null;
 }
 const active=()=>!!sim&&!sim.done&&owner===flight.route&&mode==='play'&&((sim.kind==='departure'&&flight.route.phase==='departure')||(sim.kind==='arrival'&&flight.route.phase==='arrived'));
 /* The view. The camera rides the hull, so it already turns and moves as smoothly as the ship; this adds the small lag of a pilot's head under thrust
    and a faint tremor as clamps close or release. Fractions of a degree, eased in and out, and it fades to nothing after control returns. */
 function camera(basis,dt=1/60){
  const on=active()||(sim&&sim.kind==='arrival'&&owner===flight.route&&flight.route?.phase==='arrived'),c=sim?.config,k=1-Math.exp(-dt/Math.max(.05,c?.cameraSmoothing||.35));
  const want=on?{pitch:(sim.thrust.forward-sim.thrust.retro)*.006,yaw:-sim.thrust.right*.004,roll:sim.thrust.right*.005+sim.thrust.roll*.003}:{pitch:0,yaw:0,roll:0};
  for(const a of ['pitch','yaw','roll'])view[a]+=(want[a]-view[a])*k;
  view.shake*=Math.exp(-dt/.45);clock+=dt;
  const tremor=view.shake*.0016,jp=view.pitch+Math.sin(clock*47)*tremor,jy=view.yaw+Math.sin(clock*39+1)*tremor*.6,jr=view.roll;
  if(Math.abs(jp)+Math.abs(jy)+Math.abs(jr)<1e-6)return basis;
  const add3=(a,b,kb,c2,kc)=>M.unit({x:a.x+b.x*kb+c2.x*kc,y:a.y+b.y*kb+c2.y*kc,z:a.z+b.z*kb+c2.z*kc});
  const f=add3(basis.f,basis.u,jp,basis.r,jy),r=add3(basis.r,basis.u,jr,basis.f,-jy),u=M.cross(f,r);
  return {f,r,u:M.dot(u,basis.u)<0?M.mul(u,-1):u};
 }
 /* Jets and hangar gear. kit: {B, scene, camera, root}. Each jet's brightness is the thrust the simulation is really using on that axis. */
 function build(kit){const {B,scene,camera:cam}=kit,t=new B.DynamicTexture('dock-jet',{width:128,height:32},scene,false),g=t.getContext(),grad=g.createLinearGradient(0,0,128,0);
  grad.addColorStop(0,'rgba(235,245,255,.95)');grad.addColorStop(.25,'rgba(190,220,255,.5)');grad.addColorStop(1,'rgba(150,190,255,0)');g.fillStyle=grad;g.fillRect(0,0,128,32);
  const fade=g.createLinearGradient(0,0,0,32);fade.addColorStop(0,'rgba(0,0,0,1)');fade.addColorStop(.5,'rgba(0,0,0,0)');fade.addColorStop(1,'rgba(0,0,0,1)');g.globalCompositeOperation='destination-out';g.fillStyle=fade;g.fillRect(0,0,128,32);t.hasAlpha=true;t.update();
  const jets={};
  // name: where the nozzle sits ahead of the pilot (camera space, metres), and which way its exhaust goes on screen
  for(const [name,x,y,z,rot,len] of [['left',-1.5,-.62,2.6,Math.PI,1.1],['right',1.5,-.62,2.6,0,1.1],['downL',-.8,-.86,2.5,-Math.PI/2,.8],['downR',.8,-.86,2.5,-Math.PI/2,.8],['upL',-.9,.95,2.7,Math.PI/2,.7],['upR',.9,.95,2.7,Math.PI/2,.7],['retroL',-1.25,-.7,2.9,Math.PI*.85,.55],['retroR',1.25,-.7,2.9,Math.PI*.15,.55]]){
   const m=new B.StandardMaterial('dock-jet-'+name,scene);m.disableLighting=true;m.emissiveTexture=t;m.opacityTexture=t;m.diffuseColor=new B.Color3(0,0,0);m.alphaMode=B.Engine.ALPHA_ADD;m.backFaceCulling=false;m.alpha=0;
   const p=B.MeshBuilder.CreatePlane('dock-jet-'+name,{width:len,height:.3},scene);p.setPivotPoint(new B.Vector3(-len/2,0,0));p.parent=cam;p.position.set(x+len/2,y,z);p.rotation.z=rot;p.material=m;p.isPickable=false;p.setEnabled(false);jets[name]={mesh:p,mat:m};}
  scene.onDisposeObservable.addOnce(()=>{fx=null;});
  return {scene,jets,texture:t};}
 function render(kit,snapshot){
  if(!fx||fx.scene!==kit.scene){try{fx=build(kit);}catch(error){console.warn('[VOID docking effects]',error.message);fx={scene:kit.scene,jets:{}};}}
  const on=active(),T=on?sim.thrust:null,flick=.82+.18*Math.sin(clock*61),lod=kit.quality==='low'?.75:1;
  const level={left:T?Math.max(0,T.right)+Math.max(0,-T.yaw)*.8:0,right:T?Math.max(0,-T.right)+Math.max(0,T.yaw)*.8:0,downL:T?Math.max(0,-T.up)+Math.max(0,T.roll)*.5:0,downR:T?Math.max(0,-T.up)+Math.max(0,-T.roll)*.5:0,
   upL:T?Math.max(0,T.up)+Math.max(0,-T.roll)*.5:0,upR:T?Math.max(0,T.up)+Math.max(0,T.roll)*.5:0,retroL:T?T.retro:0,retroR:T?T.retro:0};
  for(const [name,j] of Object.entries(fx.jets)){const a=Math.min(.6,(level[name]||0)*1.1)*flick*lod;j.mat.alpha=a;j.mesh.setEnabled(a>.02);if(a>.02)j.mesh.scaling.x=.55+.6*Math.min(1,level[name]);}
  // the hangar's own gear (station-kit.js): approach lights running toward the pad, clamps that close as the ship stops
  const gear=kit.scene.getTransformNodeByName('station-kit-exterior')?.metadata?.docking;
  if(gear){const r=flight.route,mine=sim&&owner===r;gear.update({time:clock,clamp:mine?sim.clamp:(r?.phase==='departure'?1:0),state:!mine?'idle':sim.kind==='arrival'?(sim.phase==='docked'||sim.phase==='clamp'?'locked':'approach'):(sim.phase==='release'?'locked':'clear')});}
  diag.jets=Object.fromEntries(Object.entries(level).map(([k,v])=>[k,+v.toFixed(2)]));
 }
 const diag={jets:{}};
 function debug(){return sim?{kind:sim.kind,phase:sim.phase,t:+sim.t.toFixed(2),p:[sim.p.x,sim.p.y,sim.p.z].map(v=>+v.toFixed(3)),v:[sim.v.x,sim.v.y,sim.v.z].map(v=>+v.toFixed(3)),speed:+M.len(sim.v).toFixed(3),accel:+M.len(sim.a).toFixed(3),spin:+M.len(sim.w).toFixed(4),clamp:+sim.clamp.toFixed(2),done:sim.done,thrust:{...sim.thrust},peak:{...sim.peak},view:{...view},jets:diag.jets,station:sim.station}:null;}
 root.VoidDockingFlight={applies,departureStep,arrivalStep,stationPose,camera,render,active,debug,config,reset(){sim=null;owner=null;revealPlan=null;}};
})(globalThis);
