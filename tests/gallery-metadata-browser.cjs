/* GALLERY › METADATA in the real game (Chromium, software GL, offline). The owner, 18 Nov 2026: "In the Gallery App players can click MetaData on selected pictures, in
   MetaData it shows who was tagged, the location, the device ID on the person who took it". A new character leaves the pod, stands in The Darknet District's bar facing
   Nyx, raises the camera (B) and takes a photo (left click) → V1 (L) › GALLERY › the photo › METADATA: TAGGED (Nyx, and how she was identified), LOCATION "The Bar · The
   Darknet District · Old Town · NeoChinatown · Tessaly System", DEVICE ID (V1-XXXX-XXXX, the same as MY V1 shows), TAKEN (the in-game time "HH:MM · DAY N"). No handle
   anywhere. A reload keeps the device ID. Screenshots at 1366x768 and 1920x1080 in docs/development/gallery-metadata/.
   Usage: node tests/gallery-metadata-browser.cjs   (its own static server on a free port; SITE_TEST_URL to use another; SHOTS=dir; BROWSER_EXECUTABLE=path; SIZES=1366) */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const shots=process.env.SHOTS||path.resolve(__dirname,'..','docs/development/gallery-metadata');fs.mkdirSync(shots,{recursive:true});
const bundled=['/opt/pw-browsers/chromium','/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'].find(f=>fs.existsSync(f)),exe=process.env.BROWSER_EXECUTABLE||bundled||null;
const sizes=(process.env.SIZES||'1366,1920').split(',').map(w=>w==='1920'?[1920,1080]:[1366,768]);
function serve(){const root=path.resolve(__dirname,'..'),types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.ogg':'audio/ogg','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.glb':'model/gltf-binary'};
 const srv=http.createServer((req,res)=>{let f;try{f=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));}catch{res.writeHead(400);return res.end();}if(!f.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);return res.end();}res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(d);});});
 return new Promise(r=>srv.listen(0,'127.0.0.1',()=>r(srv)));}
(async()=>{
 const srv=process.env.SITE_TEST_URL?null:await serve(),base=process.env.SITE_TEST_URL||'http://127.0.0.1:'+srv.address().port;
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader','--no-sandbox'],...(exe?{executablePath:exe}:{})});
 const log=m=>console.log(new Date().toISOString().slice(11,19),m);
 try{
  for(const [W,H] of sizes){
   const ctx=await browser.newContext({viewport:{width:W,height:H},serviceWorkers:'block'}),page=await ctx.newPage();page.setDefaultTimeout(300000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
   const shot=async n=>{await page.screenshot({path:path.join(shots,n+'-'+W+'.png')});};
   await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));await page.route('**/api/**',r=>r.fulfill({status:503,contentType:'application/json',body:'{}'}));
   await page.addInitScript(()=>{if(!sessionStorage.getItem('i')){localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:'low',v:2,chosen:true}));sessionStorage.setItem('i','1');}});
   await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
   await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:600000,assets:600000,optional:300000,total:1200000,module:600000,artwork:300000}));
   // a fresh browser: the Gallery's database is created at version 2 (the one-time fresh start has nothing to clear)
   assert.equal(await page.evaluate(()=>new Promise(r=>{const q=indexedDB.open('void-runner-gallery');q.onsuccess=()=>{const v=q.result.version;q.result.close();r(v);};q.onerror=()=>r(-1);})),2);
   log(W+'x'+H+' · new character');
   await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');{const c=page.locator('[data-action=menu-new-confirm]');if(await c.count())await c.click();}
   await page.waitForSelector('#character-creator.on');await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]').disabled);await page.locator('[data-cc=confirm]').click();
   await page.waitForFunction(()=>mode==='pod-waking'&&walker&&!document.getElementById('pod-wake').hidden,null,{timeout:300000});
   await page.waitForFunction(()=>VoidAssets.pending===0,null,{timeout:300000});await page.waitForTimeout(800);await page.keyboard.press('KeyE');await page.waitForFunction(()=>mode==='walking'&&walker,null,{timeout:300000});
   await page.evaluate(()=>{VoidV1.bannerMs=1;});
   // the District bar, facing Nyx behind the counter (District plan (10,33) -> world; she stands at (10,40))
   await page.evaluate(()=>{const [x,z]=[126.9-10,-41.9-33.2];Object.assign(walker,{x,z,yaw:Math.PI,pitch:-.08,vx:0,vz:0});});await page.waitForTimeout(1500);
   assert.equal(await page.evaluate(()=>VoidPlaces.deepest({scene:walkingLocation.id,x:walker.x,z:walker.z})),'district-bar');
   await page.keyboard.press('KeyB');await page.waitForFunction(()=>VoidDeviceCamera.active);
   await page.waitForFunction(()=>VoidDeviceCamera.tags.some(t=>t.name==='Nyx'),null,{timeout:60000});await page.waitForTimeout(800);await shot('camera-bar');
   const n0=await page.evaluate(()=>VoidGallery.count),c=[Math.round(W/2),Math.round(H/2)];await page.mouse.click(...c);
   if(!await page.waitForFunction(n=>VoidGallery.count>n||VoidDeviceCamera.shooting,n0,{timeout:4000}).then(()=>true,()=>false))await page.mouse.click(...c);
   await page.waitForFunction(n=>VoidGallery.count>n,n0,{timeout:180000});
   const photo=await page.evaluate(()=>VoidGallery.photos[0]);log('photo '+JSON.stringify({tags:photo.tags,meta:photo.meta}));
   assert.match(photo.meta.device,/^V1-[0-9A-F]{4}-[0-9A-F]{4}$/,'the device ID is recorded at capture');assert.equal(photo.meta.place,'district-bar');assert.match(photo.meta.gameTime,/^\d\d:\d\d · DAY \d+$/);
   assert.ok(photo.tags.some(t=>t.name==='Nyx'&&t.via==='resident'),'Nyx is tagged, identified from the residents');
   const flagsNow=await page.evaluate(()=>({serial:state.story.flags.deviceSerial,handle:VoidAccount.handle}));assert.match(flagsNow.serial,/^[0-9a-f]{8}$/,'kept in the save');
   const blob=JSON.stringify(photo);for(const k of ['handle','uid','email','"player"'])assert.ok(!blob.includes(k),'nothing about the photographer but the device: '+k);
   await page.keyboard.press('KeyB');await page.waitForFunction(()=>!VoidDeviceCamera.active);
   // V1 › GALLERY › the photo › METADATA
   await page.keyboard.press('KeyL');await page.waitForFunction(()=>VoidPersonalDevice.isOpen&&!VoidPersonalDevice.busy);
   await page.evaluate(()=>VoidPersonalDevice.openApp?VoidPersonalDevice.openApp('gallery'):null);await page.waitForFunction(()=>VoidPersonalDevice.app==='gallery'&&!VoidPersonalDevice.busy);
   await page.locator('#personal-device [data-photo]').first().dispatchEvent('click');await page.waitForFunction(()=>VoidPersonalDevice.sub&&!VoidPersonalDevice.busy);
   assert.equal(await page.locator('#personal-device [data-photo-meta]').count(),1,'a METADATA button with the photo open');await shot('photo');
   await page.locator('#personal-device [data-photo-meta]').dispatchEvent('click');await page.waitForSelector('#personal-device .pd-meta');await page.waitForFunction(()=>!VoidPersonalDevice.busy);
   const meta=await page.evaluate(()=>Object.fromEntries([...document.querySelectorAll('#personal-device .pd-meta dt')].map(dt=>[dt.textContent,dt.nextElementSibling.textContent])));log('METADATA '+JSON.stringify(meta));
   assert.deepEqual(Object.keys(meta),['TAGGED','LOCATION','DEVICE ID','TAKEN'],'TAGGED, LOCATION, DEVICE ID and TAKEN only (no handle)');
   assert.match(meta.TAGGED,/Nyx/);assert.match(meta.TAGGED,/District resident registry/);
   assert.equal(meta.LOCATION,'The Bar · The Darknet District · Old Town · NeoChinatown · Tessaly System');
   assert.equal(meta['DEVICE ID'],photo.meta.device);assert.equal(meta.TAKEN,photo.meta.gameTime);
   await page.evaluate(()=>{const b=document.querySelector('#personal-device .pd-body')||document.querySelector('#personal-device');const m=document.querySelector('#personal-device .pd-meta');m&&m.scrollIntoView({block:'start'});});await page.waitForTimeout(300);
   await shot('metadata');
   // MY V1 shows the same device ID
   await page.evaluate(()=>VoidPersonalDevice.openApp('device'));await page.waitForFunction(()=>VoidPersonalDevice.app==='device'&&!VoidPersonalDevice.busy);
   assert.equal(await page.locator('#personal-device [data-device-id]').textContent(),photo.meta.device);
   // a reload keeps the device ID (it is in the save)
   const id=photo.meta.device,serial=flagsNow.serial;
   const kept=await page.evaluate(()=>{const s=JSON.parse(JSON.stringify(state));return VoidDeviceV1.deviceId(VoidDeviceV1.ensureSerial(s.story.flags,{}),'v1');});assert.equal(kept,id,'stable');
   assert.deepEqual(errors,[],'no page errors');
   log(W+' ok: '+id+' serial '+serial);await ctx.close();}
 }finally{await browser.close();srv?.close();}
})().catch(e=>{console.error(e);process.exit(1);});
