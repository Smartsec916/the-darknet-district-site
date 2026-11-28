const test=require('node:test'),assert=require('node:assert/strict');
const V=require('../void-runner/vehicle-rules.js');
const E=require('../void-runner/exploration-controller.js');
const S=V.SPEC;
const open={solids:[],bounds:[5000,5000]};
const run=(v,input,seconds,world=open)=>{for(let t=0;t<seconds;t+=1/60)V.step(v,input,1/60,world);return v;};
const pad=(over={})=>{const buttons=Array.from({length:17},()=>({pressed:false,value:0}));for(const [i,val] of Object.entries(over.buttons||{}))buttons[i]={pressed:val>.5,value:val};return {buttons,axes:over.axes||[0,0,0,0],mapping:'standard'};};

test('keyboard: W/Up throttle, S/Down brake, A/D and arrows steer, Space handbrake, Shift boost',()=>{
 assert.equal(V.keyboardInput(new Set(['KeyW'])).throttle,1);
 assert.equal(V.keyboardInput(new Set(['ArrowUp'])).throttle,1);
 assert.equal(V.keyboardInput(new Set(['KeyS'])).brake,1);
 assert.equal(V.keyboardInput(new Set(['ArrowDown'])).brake,1);
 assert.equal(V.keyboardInput(new Set(['KeyA'])).steer,-1);
 assert.equal(V.keyboardInput(new Set(['ArrowRight'])).steer,1);
 assert.equal(V.keyboardInput(new Set(['KeyA','KeyD'])).steer,0);
 assert.equal(V.keyboardInput(new Set(['Space'])).handbrake,true);
 assert.equal(V.keyboardInput(new Set(['ShiftLeft'])).boost,true);
 assert.deepEqual(V.keyboardInput(new Set()),V.none());
});

test('gamepad: triggers, left stick steer with dead zone, right stick look, handbrake and exit follow the game bindings',()=>{
 const i=V.gamepadInput(pad({buttons:{7:.8,6:.03},axes:[.1,0,.5,-.5]}),{bindings:{jump:0,interact:2}});
 assert.ok(Math.abs(i.throttle-(.8-.06)/.94)<1e-9);
 assert.equal(i.brake,0,'a resting trigger inside its dead zone does nothing');
 assert.equal(i.steer,0,'stick drift inside the dead zone does not steer');
 assert.ok(i.lookX>0&&i.lookY<0);
 assert.equal(V.gamepadInput(pad({axes:[-1,0,0,0]})).steer,-1);
 assert.equal(V.gamepadInput(pad({buttons:{15:1}})).steer,1,'D-pad steers too');
 assert.equal(V.gamepadInput(pad({buttons:{0:1}}),{bindings:{jump:0}}).handbrake,true);
 assert.equal(V.gamepadInput(pad({buttons:{3:1}}),{bindings:{jump:3}}).handbrake,true,'a rebound jump button is the handbrake');
 assert.equal(V.gamepadInput(pad({buttons:{2:1}}),{bindings:{interact:2}}).buttons.exit,true);
 assert.equal(V.gamepadInput(pad({buttons:{11:1}})).buttons.camera,true);
 assert.equal(V.gamepadInput(pad({axes:[0,0,0,.5]}),{invertY:true}).lookY<0,true);
 assert.deepEqual(V.edges({exit:true},{exit:true,camera:true}),{exit:false,camera:true});
 const both=V.combine(V.keyboardInput(new Set(['KeyD'])),V.gamepadInput(pad({axes:[.9,0,0,0]})));
 assert.equal(both.steer,1,'keyboard and pad together stay within full lock');
 assert.equal(V.gamepadInput(null).throttle,0);
});

test('throttle accelerates to the speed cap; boost raises it; coasting slows down',()=>{
 const v=run(V.create(),{throttle:1},20);
 assert.ok(Math.abs(v.speed-S.maxSpeed)<.05,'capped at maxSpeed: '+v.speed);
 assert.ok(v.z>100&&Math.abs(v.x)<1e-6,'drives straight along +z at yaw 0');
 run(v,{throttle:1,boost:true},10);assert.ok(v.speed>S.maxSpeed+3&&v.speed<=S.boostSpeed+1e-9);
 run(v,{throttle:1},10);assert.ok(v.speed<=S.maxSpeed+.05,'back under the normal cap when boost is released');
 const before=v.speed;run(v,V.none(),2);assert.ok(v.speed<before&&v.speed>0);
});

test('brake stops a moving vehicle, then holding it reverses up to the reverse cap; throttle while rolling back brakes first',()=>{
 const v=run(V.create(),{throttle:1},5),fast=v.speed;
 run(v,{brake:1},fast/S.brake+.1);assert.ok(Math.abs(v.speed)<.6,'stopped: '+v.speed);
 run(v,{brake:1},10);assert.ok(Math.abs(v.speed+S.reverseSpeed)<.05,'reversing at the cap: '+v.speed);
 assert.ok(v.z<run(V.create(),{throttle:1},5).z);
 run(v,{throttle:1},.2);assert.ok(v.speed<0&&v.speed>-S.reverseSpeed,'braking out of reverse before driving forward');
});

test('handbrake stops the vehicle and lets it slide (less grip)',()=>{
 const v=run(V.create(),{throttle:1},4);run(v,{handbrake:true},3);assert.ok(Math.abs(v.speed)<.05);
 const grip=run(V.create(),{throttle:1},4),slide=run(V.create(),{throttle:1},4);
 run(grip,{steer:1},.6);run(slide,{steer:1,handbrake:true},.6);
 const lateral=v=>{const r={x:Math.cos(v.yaw),z:-Math.sin(v.yaw)};return Math.abs(v.vx*r.x+v.vz*r.z);};
 assert.ok(lateral(slide)>lateral(grip)*1.5,'the handbrake turn slides sideways more');
});

test('steering turns right for positive steer and less sharply at speed',()=>{
 const slow=run(V.create(),{throttle:.3,steer:1},2);assert.ok(slow.yaw>0&&slow.x>0,'right turn heads toward +x');
 const left=run(V.create(),{throttle:.3,steer:-1},2);assert.ok(left.yaw<0&&left.x<0);
 const at=v0=>{const v=V.create();v.vz=v0;V.step(v,{steer:1},1/60,open);for(let i=0;i<60;i++)V.step(v,{steer:1,throttle:v0/S.maxSpeed},1/60,open);return v.steer;};
 assert.ok(at(14)<at(3)*.75,'less lock at speed');
 const parked=run(V.create(),{steer:1},1);assert.equal(parked.yaw,0,'turning the wheel does not rotate a stopped vehicle');
});

test('collision: driving into a wall stops the vehicle short of it; a glancing hit slides along it',()=>{
 const wall={id:'wall',position:[0,2,20],size:[40,4,.5]};const world={solids:[wall],bounds:[500,500]};
 const v=run(V.create(),{throttle:1},8,world);
 assert.ok(v.z<20-S.circles[2]-S.circleR+.3&&v.z>10,'stopped at the wall: '+v.z);assert.ok(Math.abs(v.speed)<.5);assert.equal(v.blocked,true);
 const side={id:'side',position:[3,2,0],size:[.5,4,200]};const glance=V.create({x:0,z:0,yaw:.35});
 run(glance,{throttle:1},4,{solids:[side],bounds:[500,500]});
 assert.ok(glance.z>8,'kept moving along the wall: '+glance.z);assert.ok(glance.x<3-S.circleR+.05);
 const kerb={id:'kerb',position:[0,.1,10],size:[10,.2,1]};assert.ok(run(V.create(),{throttle:1},3,{solids:[kerb],bounds:[500,500]}).z>12,'low kerbs do not stop it');
 const sign={id:'sign',position:[0,4,10],size:[10,1,1]};assert.ok(run(V.create(),{throttle:1},3,{solids:[sign],bounds:[500,500]}).z>12,'overhead signs do not stop it');
 const door={id:'door',position:[0,2,10],size:[10,4,1],open:true};assert.ok(run(V.create(),{throttle:1},3,{solids:[door],bounds:[500,500]}).z>12,'open doors do not stop it');
});

test('stays inside the location bounds (or a supplied inBounds test)',()=>{
 const v=run(V.create(),{throttle:1,boost:true},30,{solids:[],bounds:[72,80]});
 assert.ok(v.z+S.circles[2]+S.circleR<=80+1e-6&&v.z>60,'stopped at the edge: '+v.z);
 const road=(x,z,r)=>Math.abs(x)<=4-r;   // an 8 m wide corridor (a road module can supply this)
 const r=run(V.create({x:0,z:-5,yaw:.6}),{throttle:1},6,{solids:[],inBounds:road});
 assert.ok(Math.abs(r.x)+Math.sin(.6)*S.circles[2]<=4+1e-6,'kept inside the corridor');assert.ok(r.z>5,'and slid along it: '+r.z);
});

test('ground following: flat stays level; a slope pitches the nose; a camber rolls the body',()=>{
 const flat=run(V.create(),{throttle:1},1);assert.equal(flat.y,0);assert.equal(flat.pitch,0);assert.equal(flat.roll,0);
 const up={solids:[],bounds:[500,500],groundHeight:(x,z)=>z*.1};
 const v=run(V.create(),{throttle:.5},1,up);assert.ok(Math.abs(v.y-v.z*.1)<1e-9);assert.ok(Math.abs(v.pitch+Math.atan(.1))<1e-9,'climbing: nose up (negative pitch)');
 const camber=V.pose(V.create(),(x)=>x*.05);assert.ok(camber.roll>0,'right side higher: positive roll');
 assert.equal(V.pose(V.create(),()=>NaN).y,0,'a broken height sample falls back to the ground');
});

test('enter / exit: only from on foot with game controls; driving freezes under any UI',()=>{
 assert.equal(V.canEnter({mode:'walking'}).ok,true);
 for(const ctx of [{mode:'dialogue'},{mode:'menu'},{mode:'walking',ui:true},{mode:'walking',cutscene:true},{mode:'walking',driving:true},{mode:'road-taxi'}])assert.equal(V.canEnter(ctx).ok,false,JSON.stringify(ctx));
 assert.equal(V.canDrive({mode:'walking'}),true);
 assert.equal(V.canDrive({mode:'walking',ui:true}),false);
 assert.equal(V.canDrive({mode:'dialogue'}),false);
 assert.equal(V.canDrive({mode:'pause'}),false);
});

test('exit lands beside the driver door, else the next clear side; never inside a solid or the vehicle',()=>{
 for(const yaw of [0,.4,Math.PI/4,1.3,Math.PI,-2.2]){
  const v=V.create({x:5,z:5,yaw});const loc={bounds:[72,80],solids:V.walkSolids(v)};
  const p=V.exitPoint(v,(x,z)=>E.blocked(x,z,loc));assert.ok(p,'found a spot at yaw '+yaw);
  assert.equal(E.blocked(p.x,p.z,loc),false);
  const door=V.local(v,S.exits[0][0],S.exits[0][1]);assert.ok(Math.hypot(p.x-door.x,p.z-door.z)<1e-9,'driver side at yaw '+yaw);
  // the DRIVE prompt is reachable and in sight from where the player stands
  const d=V.doorPoint(v);assert.equal(E.blocked(d[0],d[2],loc),false,'door point clear at yaw '+yaw);
  const me={x:d[0]-Math.cos(yaw)*1.2,z:d[2]+Math.sin(yaw)*1.2};   // 1.2 m further out from the driver side
  const item={id:'door',action:'vehicle-enter',label:'DRIVE UTILITY VEHICLE',position:d,range:2.6};
  const look=Math.atan2(d[0]-me.x,d[2]-me.z);assert.equal(E.select({...me,yaw:look},{...loc,interactions:[item]})?.id,'door','prompt selectable at yaw '+yaw);
 }
 const v=V.create();const wall={id:'wall',position:[-1.75,2,0],size:[1,4,10]};const loc={bounds:[72,80],solids:[...V.walkSolids(v),wall]};
 const p=V.exitPoint(v,(x,z)=>E.blocked(x,z,loc));assert.ok(p.x>0,'driver door against a wall: out of the passenger side');
 assert.equal(V.exitPoint(v,()=>true),null,'boxed in: the caller falls back to the nearest free floor');
});

test('walk solids open while driving and are skipped by the vehicle itself',()=>{
 const v=V.create();assert.ok(V.walkSolids(v,true).every(s=>s.open));
 assert.equal(V.collides(0,0,0,{solids:V.walkSolids(v),bounds:[72,80]}),false,'its own parked boxes never block it');
 const s=V.seat(v);assert.ok(E.blocked(s.x,s.z,{bounds:[72,80],solids:V.walkSolids(v)}),'the seat is inside the parked body (no walking through it)');
 assert.equal(E.blocked(s.x,s.z,{bounds:[72,80],solids:V.walkSolids(v,true)}),false);
});

test('chase camera sits behind the vehicle, looks at it, and pulls in when a wall is behind',()=>{
 const v=V.create({x:0,z:0,yaw:0});const c=V.chaseCamera(v,{yaw:0,pitch:.25});
 assert.ok(c.z<-5&&c.y>v.y+S.chase.height,'behind and above');
 const wall=(x,y,z)=>z<-3;const near=V.chaseCamera(v,{yaw:0,pitch:.25},wall);assert.ok(near.z>=-3.2&&near.distance<c.distance);
 assert.ok(V.chaseCamera(v,{yaw:0,pitch:-1.2}).pitch>=S.chase.minPitch,'pitch clamped');
 const ck=V.hoodCamera(v,{yaw:.3,pitch:0});assert.ok(Math.abs(ck.z-S.hood[2])<1e-9&&ck.y===S.hood[1]&&ck.yaw===.3);
});

test('Vesper parking spot is clear of the workshop solids, doors, interactions and the spawn',()=>{
 const O=require('../void-runner/opening-data.js');const loc=O.layout(),spot=V.SPOTS.vesper,v=V.create(spot);
 assert.equal(V.collides(v.x,v.z,v.yaw,loc),false);
 const solids=[...loc.solids,...V.walkSolids(v)];
 for(const i of loc.interactions)assert.ok(Math.hypot(i.position[0]-v.x,i.position[2]-v.z)>6,i.id+' is well away');
 assert.ok(Math.hypot(loc.spawn[0]-v.x,loc.spawn[2]-v.z)>10);
 assert.equal(E.blocked(loc.spawn[0],loc.spawn[2],{...loc,solids}),false,'the spawn stays free');
 const p=V.exitPoint(v,(x,z)=>E.blocked(x,z,{...loc,solids}));assert.ok(p);
 const d=V.doorPoint(v);assert.equal(E.blocked(d[0],d[2],{...loc,solids}),false);
 // the garage mouth (x -11..11 at z 0) to the landing pad stays open for walking
 for(let x=-10;x<=10;x+=2)for(let z=1;z<=12;z+=1)assert.equal(E.blocked(x,z,{...loc,solids}),false,'garage apron '+x+','+z);
});

test('model data is configurable and points at a locally hosted GLB',()=>{
 assert.match(V.MODEL.src,/^assets\/models\/vehicles\/.+\.glb$/);
 assert.ok(require('node:fs').existsSync(require('node:path').join(__dirname,'..','void-runner',V.MODEL.src)));
});
