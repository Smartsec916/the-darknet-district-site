// The remote camera feed aims like a wall-mounted pan / tilt security camera (the owner, 21 Nov 2026): limits, soft stops, the servo, and its very quiet sounds.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const R=p=>path.join(__dirname,'..',p),read=p=>fs.readFileSync(R(p),'utf8'),C=require('../void-runner/cult-room.js');
const cam=C.ROOM.camera;

test('the room sets its own aim limits; bad limits fall back to the defaults',()=>{
 assert.deepEqual(C.aimLimits(cam),{pan:[-25,30],tilt:[-15,15],top:0});
 assert.deepEqual(C.aimLimits({}),{pan:C.AIM.pan,tilt:C.AIM.tilt,top:null});
 assert.deepEqual(C.aimLimits({pan:[5,10],tilt:'x'}).pan,C.AIM.pan,'a range must include the default view');
 assert.deepEqual(C.aimLimits({pan:[-20,20],tilt:[-5,8]}),{pan:[-20,20],tilt:[-5,8],top:null});
});

test('clamping: pan and tilt stay inside the limits; wide, the ceiling keeps the camera from looking up',()=>{
 assert.deepEqual(C.aimClamp(cam,-90,-90,cam.fov/3),{pan:-25,tilt:-15});
 assert.deepEqual(C.aimClamp(cam,90,90,cam.fov/3),{pan:30,tilt:15});
 assert.equal(C.aimClamp(cam,0,15,cam.fov).tilt,0,'1x: the top of the picture already reaches level, so no tilt up');
 const b=C.aimBase(cam);for(const z of cam.zooms){const t=C.tiltRange(cam,cam.fov/z)[1];assert.ok(b.pitch+t+cam.fov/z/2*180/Math.PI<=0.001||t===0,'zoom '+z+': the top edge stays at or below level');}
 assert.ok(C.tiltRange(cam,cam.fov/2)[1]>5&&C.tiltRange(cam,cam.fov/3)[1]===15,'zoomed in it may look up');
 assert.deepEqual(C.aimClamp({pan:[-30,30],tilt:[-15,15]},0,15,cam.fov),{pan:0,tilt:15},'no top limit: the tilt limit alone');
});

test('the default view looks where the camera always looked; the altar and the door can be framed at the limits',()=>{
 const p=C.aimLook(cam,0,0),d=[p.x-cam.x,p.y-cam.y,p.z-cam.z],e=[cam.lookX-cam.x,cam.lookY-cam.y,cam.lookZ-cam.z],n=v=>Math.hypot(...v);
 assert.ok(Math.abs(d.reduce((s,v,i)=>s+v*e[i],0)/n(d)/n(e)-1)<1e-9);
 const yaw=(x,z)=>Math.atan2(x-cam.x,z-cam.z)*180/Math.PI-C.aimBase(cam).yaw,half=z=>Math.atan(Math.tan(cam.fov/z/2)*16/9)*180/Math.PI;
 const L=C.aimLimits(cam),A=C.ROOM.altar,D=C.ROOM.door;
 assert.ok(Math.abs(yaw(A.x,A.z)-L.pan[1])<half(3)*.5,'zoomed in at the right limit the altar is near the middle');
 assert.ok(yaw(D.x,D.z)>L.pan[0]-half(2),'the door is in the picture at the left limit, 2x');
});

test('soft stop: the aim slows over the last degrees before a limit and never passes it',()=>{
 assert.equal(C.aimNudge(0,5,-25,30),5);
 const near=C.aimNudge(27,2,-25,30);assert.ok(near>27&&near<29,'slower near the limit');
 let v=0;for(let i=0;i<500;i++)v=C.aimNudge(v,3,-25,30);assert.equal(v,30);
 v=0;for(let i=0;i<500;i++)v=C.aimNudge(v,-3,-25,30);assert.equal(v,-25);
 assert.equal(C.aimNudge(29.9,-2,-25,30),27.9,'moving away from a limit is not slowed');
 assert.equal(C.aimNudge(40,0,-25,30),30,'a goal out of range (the limit tightened as the zoom widened) comes back in');
});

test('the servo eases: it starts and stops smoothly, does not overshoot, and lags more zoomed in',()=>{
 const run=(zoom,secs=3)=>{let s={pan:0,tilt:0,vp:0,vt:0};const out=[];for(let t=0;t<secs;t+=1/60){s=C.aimFollow(s,{pan:20,tilt:-10},1/60,zoom);out.push(s);}return out;};
 const w=run(1),z=run(3);
 assert.ok(w[0].pan<1,'a gentle start');assert.ok(w.every(s=>s.pan<=20+1e-9&&s.tilt>=-10-1e-9),'no overshoot');
 assert.ok(Math.abs(w.at(-1).pan-20)<.01&&Math.abs(w.at(-1).tilt+10)<.01,'arrives');
 const at=(a,k)=>a.findIndex(s=>s.pan>=20*k);assert.ok(at(z,.9)>at(w,.9),'zoomed in the head is slower');assert.ok(at(w,.9)/60<.8,'1x: most of the way within a moment');
 const sp=w.map(s=>Math.hypot(s.vp,s.vt));assert.ok(sp[2]<Math.max(...sp)&&sp.at(-1)<sp[30],'speed rises then settles');
 assert.equal(C.aimLag(3)>C.aimLag(1),true);
});

test('input: mouse and keys aim, slower zoomed in; the readout',()=>{
 assert.ok(C.aimInput(100,0,1).pan>0&&C.aimInput(0,100,1).tilt<0,'right pans right, down tilts down');
 assert.ok(Math.abs(C.aimInput(100,0,3).pan-C.aimInput(100,0,1).pan/3)<1e-9);
 assert.ok(C.aimKeys(1,0,1,3).pan<C.aimKeys(1,0,1,1).pan&&C.aimKeys(-1,1,1,1).pan<0&&C.aimKeys(0,1,1,1).tilt>0);
 assert.equal(C.aimLabel(-12.3,4.4),'PAN -12° TILT 4°');
});

test('the motor whir only while moving, very quiet, pitch follows the speed',()=>{
 assert.equal(C.motorAt(0).gain,0);assert.equal(C.motorAt(.2).gain,0);
 const a=C.motorAt(10),b=C.motorAt(40),c=C.motorAt(400);assert.ok(a.gain>0&&b.gain>a.gain&&c.gain===b.gain&&b.hz>a.hz&&b.noise>a.noise);
 assert.ok(b.gain<=.05&&C.AIM_SOUND.zoomLevel<=.05,'far under a voice line (0.8)');
});

test('the feed wires it in: aim keys pass the block only to the camera, the mouse is captured, the sounds use the effects channel, the HUD shows pan / tilt',()=>{
 const f=read('void-runner/camera-feed.js');
 assert.match(f,/AIM_KEYS=\{ArrowLeft:\[-1,0\],KeyA:\[-1,0\],ArrowRight:\[1,0\],KeyD:\[1,0\],ArrowUp:\[0,1\],KeyW:\[0,1\],ArrowDown:\[0,-1\],KeyS:\[0,-1\]\}/);
 assert.match(f,/const keyBlock=e=>\{if\(!F\)return;e\.preventDefault\(\);e\.stopImmediatePropagation\(\);/,'every key is still kept from the game');
 assert.match(f,/for\(const t of MOUSE_EV\)addEventListener\(t,onMouse,\{capture:true\}\)/);assert.match(f,/for\(const t of MOUSE_EV\)removeEventListener\(t,onMouse,\{capture:true\}\)/);
 assert.match(f,/VoidAudio\?\.bus\?\.\('effects'\)/);assert.doesNotMatch(f,/new Audio\(|\.mp3|\.ogg|\.wav/,'no sound files');
 assert.match(f,/MOUSE · AIM &nbsp; WHEEL · ZOOM &nbsp; RECORDING STOPS BY ITSELF/);assert.match(f,/data-cf="aim"/);
 assert.match(f,/cam\.setTarget\(/);assert.match(f,/C\.aimFollow\(F\.aim,F\.goal,dt,F\.zf\)/);
 assert.match(read('void-runner-sw.js').split(/\n/)[3],/^const BUILD='\d{4}-\d{2}-\d{2}-[a-z0-9-]+';\r?$/);
 assert.equal(read('void-runner.html'),read('static/void-runner.html'));
});
