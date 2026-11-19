/* Remote players drawn from the hub's appearance (software GL). The hub messages are injected on a local page; the hub itself is covered by tests/district-hub-prod-ws.cjs.
   Usage: node tests/character-remote-browser.cjs [low|high] */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const tier=process.argv[2]==='high'?'high':'low',base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shot=process.env.SHOTS||'/tmp';
(async()=>{
 const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});const errors=[];
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce',serviceWorkers:'block'});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push('console: '+m.text());});
  await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));await page.route('ws://**',r=>r.abort());
  await page.addInitScript(q=>localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:q})),tier);await page.goto(base+'/void-runner.html?multiplayer=1');
  await page.waitForFunction(()=>window.VoidStartup?.started,null,{timeout:120000});
  await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');const c=page.locator('[data-action=menu-new-confirm]');if(await c.count())await c.click();
  await page.waitForFunction(()=>mode==='pod-waking'&&walker,null,{timeout:120000});await page.evaluate(()=>{state.story.flags.appearanceOffered=true;});await page.locator('#pod-wake button').click();
  await page.waitForFunction(()=>mode==='walking'&&VoidAssets.pending===0&&window.VoidRemotePlayers?._message,null,{timeout:120000});
  const A={v:1,base:'female',look:'ncz-neon',hair:'ponytail01',hairColor:'cyan',clothingColor:'crimson',accessories:['collar']};
  await page.evaluate(a=>{VoidRemotePlayers._message({t:'join',peer:{id:'aaaaaaaaaaaa',name:'Neon_Fox',model:'ncz-neon',appearance:a,x:walker.x+Math.sin(walker.yaw)*2.2,z:walker.z+Math.cos(walker.yaw)*2.2,yaw:walker.yaw+Math.PI,clip:'idle'}});
   VoidRemotePlayers._message({t:'join',peer:{id:'bbbbbbbbbbbb',name:'Old_Timer',model:'district-smuggler',x:walker.x+Math.sin(walker.yaw+.6)*2.6,z:walker.z+Math.cos(walker.yaw+.6)*2.6,yaw:walker.yaw+Math.PI,clip:'idle'}});},A);
  await page.waitForFunction(()=>VoidRemotePlayers.peers.length===2&&VoidRemotePlayers.peers.every(p=>p.drawn),null,{timeout:120000});
  await page.waitForFunction(()=>VoidBabylon.scene.transformNodes.some(n=>n.name==='character:ncz-neon'),null,{timeout:120000});await page.waitForTimeout(1500);
  await page.waitForFunction(()=>VoidBabylon.scene.meshes.some(m=>m.name==='hair:ponytail01'),null,{timeout:120000});
  const r=await page.evaluate(()=>({peers:VoidRemotePlayers.peers.map(p=>({n:p.name,a:p.appearance&&p.appearance.look,tag:p.tagged})),hair:VoidBabylon.scene.meshes.some(m=>m.name==='hair:ponytail01')}));
  assert.equal(r.hair,true);assert.equal(r.peers.find(p=>p.n==='Neon_Fox').a,'ncz-neon');assert.equal(r.peers.find(p=>p.n==='Old_Timer').a,null,'a legacy peer still uses the plain model');assert(r.peers.every(p=>p.tag),'name tags kept');
  await page.screenshot({path:shot+'/dd-remote-appearance-'+tier+'.png'});
  // the wardrobe: nearby players are updated in place
  await page.evaluate(a=>VoidRemotePlayers._message({t:'look',id:'aaaaaaaaaaaa',model:'fixer-01',appearance:{...a,base:'female',look:'fixer-01',hair:'bob01',hairColor:'violet',clothingColor:null,accessories:[]}}),A);
  await page.waitForFunction(()=>VoidBabylon.scene.transformNodes.some(n=>n.name==='character:fixer-01')&&!VoidBabylon.scene.transformNodes.some(n=>n.name==='character:ncz-neon'),null,{timeout:120000});
  // a hostile look is refused by the client too
  await page.evaluate(()=>VoidRemotePlayers._message({t:'look',id:'bbbbbbbbbbbb',model:'x',appearance:{v:1,base:'male',look:'../../x',hair:'native',hairColor:null,clothingColor:null,accessories:[]}}));await page.waitForTimeout(500);
  assert.equal((await page.evaluate(()=>VoidRemotePlayers.peers.find(p=>p.name==='Old_Timer').appearance)),null);
  await page.evaluate(()=>VoidRemotePlayers._message({t:'leave',id:'aaaaaaaaaaaa'}));await page.evaluate(()=>VoidRemotePlayers._message({t:'leave',id:'bbbbbbbbbbbb'}));await page.waitForTimeout(500);
  assert.equal(await page.evaluate(()=>VoidBabylon.scene.transformNodes.filter(n=>/^character:|^remote-player:/.test(n.name)).length),0,'nothing left behind');
  console.log(JSON.stringify({tier,r,errors}));assert.deepEqual(errors,[]);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
