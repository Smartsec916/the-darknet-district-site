/* Skirmish FPS reads the shared on-foot Combat Balance (zones.js gun() / skirmish()), in a real browser (offline): a match starts with the shared player health and the
   pistol's magazine; a Combat Balance change (pistolDamage, footEnemyHealth) applies to the next match; a shot hits for the shared damage. Usage: node tests/serve-modern.cjs,
   then node tests/skirmish-balance-browser.cjs (SITE_TEST_URL, SHOTS=dir; the bundled Chromium, software GL). */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shots=process.env.SHOTS||null;if(shots)fs.mkdirSync(shots,{recursive:true});
const bundled=fs.existsSync('/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')?'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome':'/opt/pw-browsers/chromium',exe=process.env.BROWSER_EXECUTABLE||(fs.existsSync(bundled)?bundled:null);
(async()=>{const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'],...(exe?{executablePath:exe}:{})});const errors=[];
 try{const page=await (await browser.newContext({viewport:{width:1280,height:720},serviceWorkers:'block'})).newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline'}));await page.route('**/api/**',r=>r.fulfill({status:503,contentType:'application/json',body:'{}'}));
  await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:180000});
  await page.evaluate(()=>{Object.assign(VOID_BALANCE,{pistolDamage:50,pistolSpread:0,footEnemyHealth:120,footPlayerHealth:140});VoidSkirmish.start();});
  await page.waitForFunction(()=>mode==='skirmish-fps'&&VoidSkirmish.active,null,{timeout:300000});await page.waitForTimeout(1500);
  const m=await page.evaluate(()=>{const s=VoidSkirmish.active;return {health:s.health,ammo:s.ammo,reserve:s.reserve,hp:s.enemies.map(e=>e.hp)};});console.log('[skirmish]',JSON.stringify({...m,hp:[...new Set(m.hp)]}));
  assert.equal(m.health,140);assert.equal(m.ammo,10);assert.equal(m.reserve,96);assert.ok(m.hp.includes(120)&&m.hp.includes(162),'shared enemy health (stronghold x1.35)');
  const gates=await page.evaluate(()=>{const s=VoidSkirmish.active,p=s.player,ammo=s.ammo;VoidSkirmish.action('fire',true);const friendly=s.ammo===ammo;p.z=0;VoidSkirmish.action('fire',true);return {friendly,neutralFire:s.ammo===ammo-1,provoked:s.esc.at==='neutral'};});assert.deepEqual(gates,{friendly:true,neutralFire:true,provoked:true});
  const hit=await page.evaluate(()=>{const s=VoidSkirmish.active,p=s.player;const e=s.enemies.find(x=>!x.dead&&x.zone==='hostile');p.x=e.x;p.z=e.z-4;s.grace=0;const before=e.hp;
   p.yaw=Math.atan2(e.x-p.x,e.z-p.z);p.pitch=Math.atan2(p.y-1.3,4);e.node.computeWorldMatrix(true);e.node.getChildMeshes().forEach(m=>m.computeWorldMatrix(true));s.cooldown=0;s.aim=false;VoidSkirmish.action('fire',true);return {before,after:e.hp,id:e.id,py:p.y,ex:e.x,ez:e.z,px:p.x,pz:p.z,vis:VoidExplorer.blocked(p.x,p.z,VoidDerelictStation.layout)};});
  console.log('[skirmish] shot',JSON.stringify(hit));assert.equal(hit.before-hit.after,50,'the shared pistol damage');
  if(shots)await page.screenshot({path:path.join(shots,'skirmish-shared-balance.png'),timeout:240000});
  assert.deepEqual(errors,[]);console.log('[skirmish] PASS');}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
