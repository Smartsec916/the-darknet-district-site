/* The V1 camera's rules (void-runner/device-camera.js): the zoom array and each model's reach, the timecode, and where a name tag goes. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const C=require('../void-runner/device-camera.js'),D=require('../void-runner/device-v1.js');
test('zoom: the array is 1, 1.5, 2, 3, 4; the V1 reaches 2; the V3 // SHADOW reaches 4; a later model reaches further by changing one number',()=>{
 assert.deepEqual(D.DEVICES.v1.camera.zooms,[1,1.5,2,3,4]);assert.deepEqual(C.zoomSteps(D.restore({})),[1,1.5,2]);assert.deepEqual(C.zoomSteps({model:'v3'}),[1,1.5,2,3,4]);
 D.DEVICES.v2={...D.DEVICES.v1,id:'v2',name:'V2',generation:2,camera:{...D.DEVICES.v1.camera,maxZoom:3}};
 try{assert.deepEqual(C.zoomSteps({model:'v2'}),[1,1.5,2,3]);assert.equal(D.appTitle('device',{model:'v2'}),'MY V2');}finally{delete D.DEVICES.v2;}
 const s=[1,1.5,2];let i=0;i=C.stepZoom(s,i,1);i=C.stepZoom(s,i,1);i=C.stepZoom(s,i,1);assert.equal(s[i],2,'stops at the last step');i=C.stepZoom(s,i,-1);assert.equal(s[i],1.5);assert.equal(C.stepZoom(s,0,-1),0);
});
test('timecode counts hours, minutes, seconds and frames',()=>{assert.equal(C.timecode(0),'00:00:00:00');assert.equal(C.timecode(5),'00:00:05:00');assert.equal(C.timecode(3725.5),'01:02:05:15');assert.equal(C.timecode(-3),'00:00:00:00');});
test('a name tag sits up and to one side of the head, never over it, and stays on the screen',()=>{
 const W=1600,H=900,tw=120,th=40;
 for(const [hx,hy] of [[400,450],[1200,450],[800,450],[30,40],[1590,890],[800,20]]){const t=C.placeTag(hx,hy,W,H,tw,th);
  assert(t.left>=8&&t.left+tw<=W-8&&t.top>=8&&t.top+th<=H-8,'on screen');
  const overFace=hx>t.left&&hx<t.left+tw&&hy>t.top&&hy<t.top+th;if(hy>120&&hx>200&&hx<W-200)assert(!overFace,'not over the face');
  assert(t.ax>=t.left&&t.ax<=t.left+tw&&t.ay===t.top+th,'the line starts on the tag');}
 assert(C.placeTag(400,450,W,H).left<400,'left of centre: the tag goes left');assert(C.placeTag(1200,450,W,H).left>1200,'right of centre: the tag goes right');
});
test('the viewfinder takes its colours from the device theme, has no centre circle, and the script is loaded by the game page',()=>{
 const css=fs.readFileSync('void-runner/device-v1.css','utf8'),cam=css.slice(css.indexOf('/* ---- Camera viewfinder'));
 assert(css.includes('#personal-device,#pd-chip,#pd-camera{'),'the camera shares the device variables');
 assert.doesNotMatch(cam.replace(/--pd-tag:#9dff5a/,'').replace(/rgba\([^)]*\)/g,'').replace(/#000\b/g,''),/#[0-9a-f]{3,8}\b/i,'no colour of its own besides the tag green');
 assert.doesNotMatch(cam,/border-radius\s*:\s*50%/);const js=fs.readFileSync('void-runner/device-camera.js','utf8');assert.doesNotMatch(js,/pc-ring|<circle class/);
 const h=fs.readFileSync('void-runner.html','utf8');assert(h.includes('void-runner/device-camera.js'));assert.equal(fs.readFileSync('static/void-runner.html','utf8'),h);
});
test('a tag never shows through a wall: tall solids block the line, low counters and glass do not',()=>{
 const wall={id:'hall-east',position:[5,2,0],size:[.4,4,20]},counter={id:'shop-counter',position:[5,.5,0],size:[.4,1,20]},glass={id:'vr-glass-a',position:[5,2,0],size:[.4,4,20]};
 assert.equal(C.sightBlocked(0,0,10,0,[wall]),true);assert.equal(C.sightBlocked(0,0,10,0,[counter]),false);assert.equal(C.sightBlocked(0,0,10,0,[glass]),false);
 assert.equal(C.sightBlocked(0,0,4,0,[wall]),false,'the wall is beyond the person');assert.equal(C.sightBlocked(0,0,10,30,[wall]),false,'the line passes the end of the wall');assert.equal(C.sightBlocked(0,0,10,0,null),false);
 assert.equal(C.sightBlocked(0,0,10,0,[{id:'admin-spot',position:[10,1,0],size:[.9,2,.9]}]),false,'the box a person stands in does not hide them');
});
test('aim: the crosshair on a person OR on their tag selects them; the nearest wins; nothing in the aperture selects nobody',()=>{
 const a={key:'npc:admin',hx:640,hy:450,tx:700,ty:360,tw:120,th:40},b={key:'npc:iris',hx:900,hy:450,tx:960,ty:360,tw:120,th:40};
 assert.equal(C.aimed([a,b],640,450,70),'npc:admin','on the head');assert.equal(C.aimed([a,b],760,380,70),'npc:admin','on the tag');assert.equal(C.aimed([a,b],1000,380,70),'npc:iris');
 assert.equal(C.aimed([a,b],300,300,70),null);assert.equal(C.aimed([],640,450,70),null);assert.equal(C.aimed([a,{...b,hx:650,hy:455}],650,455,70),'npc:iris','the closer one');
});
