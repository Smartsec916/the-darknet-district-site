/* Zooming with the camera app renders detail: the pure rule (void-runner/zoom-detail.js) and that every outdoor distance test uses it. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const Z=require('../void-runner/zoom-detail.js'),NL=require('../void-runner/ncz-nightlife.js'),SS=require('../void-runner/street-sight.js');
const read=f=>fs.readFileSync(path.join(__dirname,'..','void-runner',f),'utf8');
test('a zoomed view judges distance as the picture shows it',()=>{
 assert.equal(Z.factor(1),1);assert.equal(Z.factor(2),.5);assert.ok(Math.abs(Z.factor(3)-1/3)<1e-12);assert.equal(Z.factor(undefined),1);assert.equal(Z.factor(0),1);assert.equal(Z.factor(.5),1,'zooming out never hides more');assert.equal(Z.factor(50),Z.MIN,'bounded');
 assert.equal(Z.effective(60,2),30);assert.equal(Z.effective(60,1),60);
 // a walker 150 m down the street is past the 90 m limit with no zoom, inside it at 2x and 3x
 const limit=NL.config.showRadius;assert.equal(Z.within(150,limit,1),false);assert.equal(Z.within(150,limit,2),true);assert.equal(Z.within(250,limit,3),true);assert.equal(Z.within(300,limit,3),false);
 // a face 60 m away keeps its eyebrows, lashes and eyes at 2x (street-sight drops them past 34 m)
 assert.equal(SS.dropDetail(false,Z.effective(60,1),SS.config),true);assert.equal(SS.dropDetail(false,Z.effective(60,2),SS.config),false);
 assert.equal(SS.rate(Z.effective(60,1),SS.config)>1,true);assert.equal(SS.rate(Z.effective(60,3),SS.config),1,'and is animated every frame at 3x');
});
test('the field-of-view form agrees with the zoom steps of the camera app',()=>{
 for(const z of [1,1.5,2,3]){const fov=2*Math.atan(Math.tan(Z.REF_FOV/2)/z);assert.ok(Math.abs(Z.fromFov(fov)-Z.factor(z))<1e-9,z+'x');}
 assert.equal(Z.fromFov(2),1,'a wider view is not a zoom');assert.equal(Z.fromFov(undefined),1);
});
test('now() is 1 unless the camera app is up, and follows its zoom',()=>{
 assert.equal(Z.now(),1);globalThis.VoidDeviceCamera={active:false,zoom:3};assert.equal(Z.now(),1);globalThis.VoidDeviceCamera={active:true,zoom:2};assert.equal(Z.now(),.5);delete globalThis.VoidDeviceCamera;assert.equal(Z.now(),1);
});
test('every outdoor distance test for people and props uses the zoomed distance',()=>{
 const uses={'ncz-nightlife.js':/VoidZoom/,'ncz-alley.js':/VoidZoom/,'ncz-nightclub.js':/VoidZoom/,'milked-build.js':/VoidZoom/,'neochinatown.js':/VoidZoom/,'remote-players.js':/VoidZoom/};
 for(const [f,re] of Object.entries(uses))assert.match(read(f),re,f);
 assert.match(read('street-sight.js'),/zoom=Math\.tan\(\(cam\.fov/,'street-sight keeps its own field-of-view rule');
 for(const f of ['../void-runner.html','../static/void-runner.html']){const h=read(f);assert.ok(h.includes('void-runner/zoom-detail.js'));assert.ok(h.indexOf('void-runner/zoom-detail.js')<h.indexOf('void-runner/ncz-nightclub.js'),'loaded before its users');}
});
