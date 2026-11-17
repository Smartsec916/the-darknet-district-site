/* Smoothness regression (docs/development/SMOOTHNESS_AUDIT.md), in a real browser. Frame times in software rendering are too noisy to assert, so this checks
   that the work which used to land in the middle of a walk is done while the loading screen is still up:
   1. NeoChinatown street: NULL is already built (hidden) when the street appears; every material already has the light slots the glTF loader would give it,
      so a model arriving later rebuilds no shader; the street people whose looks are on this computer already exist. Walking to the alley mouth (the club is
      revealed at 70 m) compiles at most a handful of new shaders (it compiled 25-40 before).
   2. Milked: with the people's looks in the offline cache, they are standing in the rooms the moment the check-in card lifts.
   SITE_TEST_URL=http://127.0.0.1:5187 node tests/smoothness-browser.cjs [low|medium] */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',tier=process.argv[2]==='medium'?'medium':'low';
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
 const page=await b.newPage({viewport:{width:800,height:450},serviceWorkers:'block'});page.setDefaultTimeout(900000);const errs=[];page.on('pageerror',e=>errs.push(e.message));
 const origin=new URL(base).origin;await page.route(u=>/^https:/.test(u.href)&&u.origin!==origin,r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
 await page.addInitScript(q=>localStorage.setItem('void-runner-graphics-v1',JSON.stringify({renderer:'babylon',quality:q,v:2,chosen:true})),tier);
 await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:900000,assets:300000,optional:300000,area:900000,total:1500000}));
 // a returning player: the crowd figures are in the offline cache (the service worker keeps them after a first visit)
 const crowd=fs.readdirSync(path.join(__dirname,'../void-runner/assets/models/crowd')).filter(f=>f.endsWith('.glb')).map(f=>'void-runner/assets/models/crowd/'+f);
 await page.evaluate(async fl=>{const c=await caches.open('smoothness-test');await c.addAll(fl.map(f=>new URL(f,document.baseURI).href));},crowd);
 await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');const c=page.locator('[data-action=menu-new-confirm]');if(await c.count())await c.click();
 await page.waitForSelector('#character-creator.on');await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]').disabled);await page.locator('[data-cc=confirm]').click();
 await page.waitForFunction(()=>mode==='pod-waking'&&walker);await page.waitForTimeout(3000);await page.keyboard.press('KeyE');await page.waitForFunction(()=>mode==='walking');
 // count shader programs as they are made
 await page.evaluate(()=>{const e=VoidBabylon.scene.getEngine();window.__fx=()=>Object.keys(e._compiledEffects).length;});
 // 1. the street, entered at the District's door (the loader runs neochinatown.js prepare before it hands the street over)
 await page.evaluate(()=>{delete state.story.flags.area;const [x,z]=VoidNeoChinatown.toWorld(2,23.6);return enterWalking(VoidDistrictArea.KEY.street,{silent:true,spawn:[x,1.7,z],yaw:0});});
 const first=await page.waitForFunction(()=>mode==='walking'&&walkingLocation?.area==='street'?{club:VoidNeoChinatown.nightclub?.state(),lights:VoidBabylon.scene.lights.length,
   short:VoidBabylon.scene.materials.filter(m=>m.maxSimultaneousLights!==undefined&&m.maxSimultaneousLights<Math.min(8,VoidBabylon.scene.lights.length)).map(m=>m.name),fx:__fx()}:null,null,{polling:'raf'}).then(h=>h.jsonValue());
 console.log(tier,'street handed over',JSON.stringify({club:first.club,lights:first.lights,short:first.short.length,fx:first.fx}));
 assert.equal(first.club.phase,'ready','NULL is built behind the loading screen');assert.equal(first.club.shown,false,'and stays hidden until the player is within 70 m, as before');
 assert.deepEqual(first.short,[],'every material already has its light slots');
 // standing in the vestibule nothing about NULL shows: the shutter is down and its collision closed
 assert.equal(await page.evaluate(()=>VoidNeoChinatown.nightclub.isOpen()),false);
 // walk out of the vestibule and down the alley to Main Street in 1 m steps: the club is revealed on the way
 const before=await page.evaluate(()=>__fx());
 for(let x=124.9;x>=72;x-=1){await page.evaluate(x=>{walker.x=x;walker.z=-58;walker.yaw=-Math.PI/2;},x);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
 await page.waitForTimeout(4000);
 const after=await page.evaluate(()=>({fx:__fx(),club:VoidNeoChinatown.nightclub.state(),open:VoidNeoChinatown.nightclub.isOpen()}));
 console.log(tier,'down the alley',JSON.stringify({compiled:after.fx-before,club:after.club}));
 assert.equal(after.club.shown,true,'NULL is revealed once the player is within 70 m');assert.equal(after.open,true,'and its doorway opens');
 assert.ok(after.fx-before<=8,'walking from the door to Main Street compiled '+(after.fx-before)+' shader programs (it compiled 25-40 before the fix)');
 // 2. Milked, entered the way its check-in card does (enterWalking with the card's spawn): its people are there at once
 await page.evaluate(()=>enterWalking(VoidMilked.KEY,{silent:true,spawn:[VoidMilked.DOOR.x,1.7,VoidMilked.OFFSET[1]-75.5],yaw:Math.PI}));
 const inside=await page.waitForFunction(()=>mode==='walking'&&walkingLocation?.area===VoidMilked.AREA?VoidBabylon.zone.people.filter(p=>p.spawned).map(p=>p.id):null,null,{polling:'raf'}).then(h=>h.jsonValue());
 console.log(tier,'milked handed over with',inside.length,'people:',inside.join(', '));
 assert.ok(inside.length>=5,'Eva, Fish and the dancers whose looks are on this computer are already in the rooms ('+inside.length+')');
 assert.deepEqual(errs,[],'no page errors');
 console.log('smoothness-browser',tier,'ok');await b.close();})().catch(e=>{console.error(e);process.exit(1);});
