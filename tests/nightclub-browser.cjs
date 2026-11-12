/* NULL, the nightclub across Main Street from the alley, in a real browser: it opens for everyone (code-built where the purchased model is not published), the
   player can walk in through the open doorway without a key press, round the floor, to the bar and the VIP corner and back out; its people are there; the bar
   answers; the map lists it.   SITE_TEST_URL=http://127.0.0.1:5187 node tests/nightclub-browser.cjs [low|high] */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',tier=process.argv[2]==='high'?'high':'low';
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
 const page=await b.newPage({viewport:{width:1280,height:720},serviceWorkers:'block'});page.setDefaultTimeout(300000);const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
 await page.addInitScript(q=>localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:q})),tier);
 await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
 await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');const c=page.locator('[data-action=menu-new-confirm]');if(await c.count())await c.click();
 await page.waitForSelector('#character-creator.on');await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]').disabled);await page.locator('[data-cc=confirm]').click();
 await page.waitForFunction(()=>mode==='pod-waking'&&walker&&VoidAssets.pending===0);await page.locator('#pod-wake [data-pod=exit]').click();await page.waitForFunction(()=>mode==='walking');
 await page.evaluate(()=>{delete state.story.flags.area;return enterWalking(VoidDistrictArea.KEY.street,{silent:true});});await page.waitForFunction(()=>mode==='walking'&&walkingLocation?.area==='street');
 assert.equal(await page.evaluate(()=>VoidNightclub.enabled()),true,'the club is on for everyone');assert.equal(await page.evaluate(()=>VoidNightclub.NAME),'NULL');
 const at=(x,z,yaw=-Math.PI/2)=>page.evaluate(([x,z,yaw])=>{Object.assign(walker,{x,z,yaw,pitch:0});},[x,z,yaw]);
 // from the alley mouth the club is across the street; before it is ready the doorway is shut
 await at(70,-58.5);await page.waitForFunction(()=>VoidNeoChinatown.nightclub?.isOpen?.());
 const st=await page.evaluate(()=>VoidNeoChinatown.nightclub.state());assert.equal(st.phase,'ready');assert.equal(st.variant,'built','the purchased model is not published here, so the code-built club is used');
 const open=await page.evaluate(()=>walkingLocation.solids.find(s=>s.id==='club-shutter').open);assert.equal(open,true,'the doorway is open: walking in needs no key press');
 // every part of the club is open floor; the furniture is not
 const blocked=(x,z)=>page.evaluate(([x,z])=>VoidExplorer.blocked(x,z,walkingLocation),[x,z]);
 for(const [what,x,z] of [['the doorway',50.5,-58.5],['inside the door',47,-58.5],['the dance floor',35,-58.5],['in front of the bar',31,-52],['the VIP corner',38,-64.4],['in front of the DJ',27,-58.5]])assert.equal(await blocked(x,z),false,what+' is walkable');
 for(const [what,x,z] of [['the bar',31,-50.1],['the VIP sofa',38,-67.8],['the wall beside the door',50.5,-54]])assert.equal(await blocked(x,z),true,what+' is solid');
 // the people arrive as their looks load
 await at(40,-58.5);await page.waitForFunction(n=>VoidNeoChinatown.nightclub.people.filter(p=>p.spawned).length>=n,tier==='low'?5:10,{timeout:240000});
 const people=await page.evaluate(()=>VoidNeoChinatown.nightclub.people);for(const role of ['dj','bartender','door'])assert(people.some(p=>p.id===role&&p.spawned),role+' is there');assert(people.filter(p=>/^dancer/.test(p.id)&&p.spawned).length>=3,'people are dancing');
 await page.waitForTimeout(1500);await page.screenshot({path:'/tmp/club-test-'+tier+'.png'});
 // the bar
 const bar=await page.evaluate(()=>walkingLocation.interactions.find(i=>i.id==='club-bar'));assert.equal(bar.label,'ORDER A DRINK');await page.evaluate(i=>VoidInteractions.handlers.get('club-bar')({item:i}),bar);
 assert.match(await page.evaluate(()=>document.getElementById('notice').textContent),/bartender/);assert.equal(await page.evaluate(()=>mode),'walking');
 // the map knows it
 const map=await page.evaluate(()=>{const m=VoidDistrictMap.model(VoidNeoChinatown);return {b:m.buildings.map(x=>x.name),p:m.pois.filter(x=>/club/.test(x.id)).map(x=>x.name)};});assert(map.b.some(n=>/^NULL/.test(n)));assert(map.p.some(n=>/^NULL/.test(n)));
 // and the way back out is open
 assert.equal(await blocked(52.5,-58.5),false);assert.equal(await blocked(60,-58.5),false);
 assert.deepEqual(errs,[]);console.log(JSON.stringify({ok:true,tier,people:people.filter(p=>p.spawned).length}));await b.close();})().catch(e=>{console.error(String(e.stack||e).slice(0,900));process.exit(1);});
