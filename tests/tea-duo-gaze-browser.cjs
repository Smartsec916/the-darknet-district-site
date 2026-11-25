// Render both real models, their embedded sit clips and the production frame observer in an isolated Tea Room scene.
// Use SITE_TEST_URL with a deployed build or set TEA_MODEL_DIR to the local licensed .vrpak directory.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path');
(async()=>{
 const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',packs=process.env.TEA_MODEL_DIR;
 const b=await chromium.launch({...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{}),args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
 const page=await b.newPage({serviceWorkers:'block'});page.on('pageerror',console.error);
 page.on('console',m=>{if(m.type()==='error'||m.text().includes('not on this machine'))console.log(m.text().slice(0,200))});
 await page.route('**/__tea_gaze_test',r=>r.fulfill({contentType:'text/html',body:'<canvas width="500" height="400"></canvas>'}));
 if(packs)await page.route('**/npc-*.vrpak',r=>r.fulfill({path:path.resolve(packs,path.basename(new URL(r.request().url()).pathname))}));
 await page.goto(base+'/__tea_gaze_test');
 for(const s of ['vendor/babylon-8.26.0.js','vendor/babylonjs-loaders-8.26.0.min.js','asset-pipeline.js','modules.js','ncz-underground.js','crowd.js','tea-duo.js'])await page.addScriptTag({url:base+'/void-runner/'+s});
 await page.evaluate(()=>{
 const B=BABYLON,T=VoidTeaDuo;
 const scene=new B.Scene(new B.Engine(document.querySelector('canvas'),true));window.VoidBabylon={scene};
 const seat=T.placement('nomi');window.walker={x:seat.x,z:seat.z,y:seat.y+1.6};window.walkingLocation={id:'neochinatown',area:'street',quarter:'underground'};window.mode='walking';
 const cam=new B.FreeCamera('camera',new B.Vector3(seat.x,seat.y+1.6,seat.z+2.2),scene);cam.setTarget(new B.Vector3(seat.x,seat.y+1,seat.z));new B.HemisphericLight('test',B.Axis.Y,scene);
 T.tick();
 });await page.waitForFunction(()=>VoidTeaDuo.ready,null,{timeout:90000});
 const result=await page.evaluate(async()=>{
 const T=VoidTeaDuo,sc=VoidBabylon.scene,B=BABYLON,results=[];
 for(const id of T.MEMBERS){
 const f=T.figure(id);f.idleAt=f.epAt=Infinity;
 const read=()=>{const m=f.head.computeWorldMatrix(true),v=B.Vector3.TransformNormal(f.faceAxis,m).normalize(),l=B.Vector3.TransformNormal(v,f.node.computeWorldMatrix(true).clone().invert()).normalize();return [Math.atan2(l.x,l.z)*180/Math.PI,Math.asin(l.y)*180/Math.PI]};
 for(let i=0;i<25;i++){sc.render();await new Promise(r=>setTimeout(r,20))}
 const origin=f.node.position.clone();
 for(const [side,height] of [[-.58,-.42],[.58,.5]]){
 const head=f.head.computeWorldMatrix(true).getTranslation(),offset=B.Vector3.TransformNormal(new B.Vector3(side,height,1.05),f.node.computeWorldMatrix(true));
 Object.assign(walker,{x:head.x+offset.x,y:head.y+offset.y,z:head.z+offset.z});
 if(VoidUnderground.placeAt(walker.x,walker.z)!==T.ROOM)throw Error('outside bedroom');
 for(let i=0;i<55;i++){sc.render();await new Promise(r=>setTimeout(r,18))}
 results.push({id,side,height,face:read(),yaw:f.lookY,pitch:f.lookPitch,displacement:B.Vector3.Distance(origin,f.node.position),clip:f.clip});
 }}
 return results;
 });console.log(JSON.stringify(result)); for(const x of result){assert.ok(x.face[0]*Math.sign(x.side)>10);assert.ok(x.face[1]*Math.sign(x.height)>7);assert.equal(x.displacement,0);assert.equal(x.clip,'sit');}
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1});