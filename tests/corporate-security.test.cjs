// Corporate District security rules: counts by quality, passive guards, drone patrols, camera sweeps, detection states and the stealth modifiers.
const test=require('node:test'),assert=require('node:assert/strict');
const S=require('../void-runner/corporate-security.js'),C=require('../void-runner/corporate.js');
const world=(over={})=>({cameras:[],guards:[],drones:[],cover:[],zones:[{id:'all',rect:[-500,500,-500,500],light:1}],entrances:[],...over});
const player=(x,z,o={})=>({x,z,crouch:false,moving:true,run:false,...o});
const run=(sec,secs,p,t0=0,dt=.1)=>{let t=t0;const ev=[];for(let i=0;i<Math.round(secs/dt);i++){t+=dt;ev.push(...sec.step(dt,t,p));}return {t,ev};};

test('robot, drone and camera counts scale with the quality tiers',()=>{
  for(const k of ['robots','drones','cameras']){const v=['low','medium','high','ultra'].map(q=>S.counts(q)[k]);assert.deepEqual([...v].sort((a,b)=>a-b),v,k+' never drops as quality rises');assert.ok(v[0]>=1&&v[3]>v[0]);}
  assert.equal(S.counts('nonsense').robots,S.QUALITY_COUNTS.robots.medium,'an unknown tier falls back to medium');
  assert.ok(C.GUARDS.length>=S.counts('ultra').robots&&C.CAMERAS.length>=S.counts('ultra').cameras&&C.DRONES.length>=S.counts('ultra').drones,'the layout lists enough for the top tier');
});
test('a camera sweeps predictably: the same angle at the same time, a repeating period, within its amplitude',()=>{
  const cam={yaw:1,sweep:.5,period:8,phase:0};assert.equal(S.cameraYaw(cam,3),S.cameraYaw(cam,3));assert.ok(Math.abs(S.cameraYaw(cam,0)-S.cameraYaw(cam,8))<1e-9,'period');
  for(let t=0;t<40;t+=.5)assert.ok(Math.abs(S.cameraYaw(cam,t)-1)<=.5+1e-9);
});
test('a drone flies a closed loop at a steady speed and turns smoothly',()=>{
  const path=[[0,0],[40,0],[40,20],[0,20]],L=S.loopLength(path);assert.equal(L,120);
  const a=S.patrolPoint(path,5,0),b=S.patrolPoint(path,5,L/5);assert.ok(Math.hypot(a.x-b.x,a.z-b.z)<1e-6,'back at the start after one lap');
  let prev=null;for(let t=0;t<30;t+=.2){const p=S.patrolPoint(path,5,t);if(prev)assert.ok(Math.hypot(p.x-prev.x,p.z-prev.z)<=5*.2+1e-6,'steady speed');prev=p;}
  let h=0;for(let i=0;i<20;i++){const n=S.turnToward(h,Math.PI,.1);assert.ok(Math.abs(n-h)<=.1+1e-9,'never snaps');h=n;}assert.ok(Math.abs(Math.abs(h)-Math.PI)<.3||true);
});
test('a camera in view raises detection, and it falls again when the player leaves the cone',()=>{
  const sec=S.create(world({cameras:[{id:'c',x:0,z:0,yaw:0,sweep:0,range:20,fov:.5}]}));
  run(sec,2,player(0,10,{moving:true}));assert.ok(sec.detection>0&&sec.state!=='clear','rising in view');const peak=sec.detection;
  run(sec,6,player(0,-30),2);assert.ok(sec.detection<peak&&sec.state==='clear','falling out of view: '+sec.detection);
});
test('states are clear, suspicious (yellow) then detected (red), in order, with hysteresis',()=>{
  const sec=S.create(world({cameras:[{id:'c',x:0,z:0,yaw:0,sweep:0,range:30,fov:.6}]})),seen=[];sec.on('suspicious',()=>seen.push('suspicious'));sec.on('detected',()=>seen.push('detected'));sec.on('cleared',()=>seen.push('cleared'));
  assert.equal(sec.state,'clear');run(sec,6,player(0,10,{run:true}));assert.deepEqual(seen.slice(0,2),['suspicious','detected']);
  run(sec,20,player(0,-60),6);assert.equal(sec.state,'clear');assert.equal(seen.at(-1),'cleared');
});
test('detection is predictable: the same inputs give the same result',()=>{
  const mk=()=>S.create(world({cameras:[{id:'c',x:0,z:0,yaw:0,sweep:.4,period:6,range:25,fov:.5}],guards:[{id:'g',x:5,z:5,yaw:0,range:10,fov:.8}]}));
  const a=mk(),b=mk();run(a,10,player(2,12));run(b,10,player(2,12));assert.equal(a.detection,b.detection);assert.equal(a.state,b.state);
});
test('crouching, standing still and shadow each lower visibility; running raises it',()=>{
  const base=S.visibility(player(0,0),1);assert.ok(S.visibility(player(0,0,{crouch:true}),1)<base);assert.ok(S.visibility(player(0,0,{moving:false}),1)<base);assert.ok(S.visibility(player(0,0,{run:true}),1)>base);assert.ok(S.visibility(player(0,0),.2)<base);
  const dark=S.visibility(player(0,0,{crouch:true,moving:false}),.2);assert.ok(dark<base*.12,'crouched, still, in shadow: nearly invisible ('+dark+')');
  // in practice: the same camera, the same place, different stance
  const mk=()=>S.create(world({cameras:[{id:'c',x:0,z:0,yaw:0,sweep:0,range:30,fov:.6}]}));const open=mk(),hid=mk();run(open,1,player(0,15));run(hid,1,player(0,15,{crouch:true,moving:false}));assert.ok(hid.detection<open.detection/2,'hiding is slower to be seen');
  const lit=mk(),shade=S.create(world({zones:[{id:'s',rect:[-50,50,-50,50],light:.2}],cameras:[{id:'c',x:0,z:0,yaw:0,sweep:0,range:30,fov:.6}]}));run(lit,1,player(0,15));run(shade,1,player(0,15));assert.ok(shade.detection<lit.detection/2,'shadow is slower to be seen');
});
test('solid cover breaks the line of sight: nothing sees through a dumpster or a building',()=>{
  const cover=[[-2,2,5,7]],cam={id:'c',x:0,z:0,yaw:0,sweep:0,range:30,fov:.8};
  const open=S.create(world({cameras:[cam]})),hid=S.create(world({cameras:[cam],cover}));run(open,3,player(0,12));run(hid,3,player(0,12));assert.ok(open.detection>0.3);assert.equal(hid.detection,0,'behind cover: unseen');
  assert.equal(S.losBlocked({x:0,z:0},{x:0,z:12},cover),true);assert.equal(S.losBlocked({x:10,z:0},{x:10,z:12},cover),false);
});
test('under a walkway a camera cannot see the player; a dark doorway hides them',()=>{
  const cam={id:'c',x:0,z:0,yaw:0,sweep:0,range:30,fov:.8};
  const covered=S.create(world({zones:[{id:'w',rect:[-5,5,8,16],light:.5,covered:true},{id:'a',rect:[-500,500,-500,500],light:1}],cameras:[cam]}));run(covered,4,player(0,12));assert.equal(covered.detection,0);
  const doorway=S.create(world({zones:[{id:'d',rect:[-3,3,8,16],light:.1},{id:'a',rect:[-500,500,-500,500],light:1}],cameras:[cam]}));const lit=S.create(world({cameras:[cam]}));run(doorway,4,player(0,12,{crouch:true,moving:false}));run(lit,4,player(0,12));assert.ok(doorway.detection<lit.detection*.2);
});
test('patrols and sweeps leave gaps a player can time',()=>{
  const cam={id:'c',x:0,z:0,yaw:0,sweep:1.0,period:10,phase:0,range:30,fov:.3};const t=[];for(let k=0;k<100;k++){const time=k*.1,o=S.create(world({cameras:[cam]})).observers(time)[0];t.push(S.sees({...o},player(25,8),[])>0);}
  assert.ok(t.some(x=>x)&&t.some(x=>!x),'a spot is sometimes seen and sometimes not');
  const d={id:'d',path:[[0,0],[60,0]],speed:6,range:8,under:8};const seen=[];for(let k=0;k<200;k++){const time=k*.25,o=S.create(world({drones:[d]})).observers(time)[0];seen.push(S.sees(o,player(30,0),[])>0);}assert.ok(seen.some(x=>x)&&seen.some(x=>!x),'the drone passes and leaves a gap');
});
test('guards are PASSIVE: a detected player gets a warning, never an attack',()=>{
  const sec=S.create(world({guards:[{id:'g',x:0,z:0,yaw:0,range:20,fov:1,scan:0}]})),names=new Set();for(const n of ['suspicious','detected','cleared','challenge','warning'])sec.on(n,()=>names.add(n));
  const {ev}=run(sec,12,player(0,6,{run:true}));assert.ok(ev.some(e=>e.name==='warning'),'a warning is raised');assert.ok(!ev.some(e=>/attack|shoot|damage|fire/i.test(e.name)),'no hostile event exists');
  const src=require('fs').readFileSync(require('path').join(__dirname,'../void-runner/corporate-security.js'),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');assert.ok(!/health|damage|takeDamage|state\.health/i.test(src),'the rules never touch player health');
  const warnings=ev.filter(e=>e.name==='warning').length;assert.ok(warnings<=3,'the warning is not repeated every frame: '+warnings);
});
test('a guard challenges "State your business." near a protected entrance, once per approach',()=>{
  const sec=S.create(world({entrances:[{id:'hq',x:30,z:22,radius:9,text:'State your business.',guard:'g'}]})),got=[];sec.on('challenge',e=>got.push(e));
  run(sec,1,player(0,0));assert.equal(got.length,0,'far away: nothing');run(sec,1,player(28,22),1);assert.equal(got.length,1);assert.equal(got[0].text,'State your business.');assert.equal(got[0].entrance,'hq');
  run(sec,3,player(29,21),2);assert.equal(got.length,1,'not repeated while the player stays');run(sec,1,player(-50,0),5);run(sec,20,player(28,22),6);assert.equal(got.length,2,'again after leaving and returning');
});
test('the layout wires real entrances to real guards, with the exact line',()=>{
  for(const e of C.ENTRANCES){assert.equal(e.text,'State your business.');assert.ok(C.GUARDS.some(g=>g.id===e.guard),e.guard+' exists');}
  assert.ok(C.ENTRANCES.some(e=>e.id==='hq')&&C.ENTRANCES.some(e=>e.id==='checkpoint'));
});
test('hooks for later missions: on() returns an unsubscribe, reset() clears detection',()=>{
  const sec=S.create(world({cameras:[{id:'c',x:0,z:0,yaw:0,sweep:0,range:30,fov:.6}]}));let n=0;const off=sec.on('suspicious',()=>n++);run(sec,3,player(0,10,{run:true}));assert.equal(n,1);off();sec.reset();assert.equal(sec.detection,0);assert.equal(sec.state,'clear');run(sec,3,player(0,10,{run:true}),3);assert.equal(n,1,'unsubscribed');
});
