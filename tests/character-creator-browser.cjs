/* Character creator in the real District (software GL): first-run offer, choices, confirm/cancel, persistence, wardrobe. Usage: node tests/character-creator-browser.cjs [low|high]. */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const tier=process.argv[2]==='high'?'high':'low',base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shot=process.env.SHOTS||'/tmp';
(async()=>{
 const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
 const errors=[];
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce',serviceWorkers:'block'});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push('console: '+m.text());});
  await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
  await page.addInitScript(q=>localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:q})),tier);await page.goto(base+'/void-runner.html');
  await page.waitForFunction(()=>window.VoidStartup?.started,null,{timeout:120000});
  await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');const confirm=page.locator('[data-action=menu-new-confirm]');if(await confirm.count())await confirm.click();
  await page.waitForFunction(()=>mode==='pod-waking'&&walker,null,{timeout:120000});
  await page.waitForFunction(()=>VoidAssets.pending===0,null,{timeout:120000});
  // 1. EXIT POD in a new campaign opens the creator first (nothing saved yet)
  assert.equal(await page.evaluate(()=>VoidCharacterCreator.stored()),null);
  await page.locator('#pod-wake button').click();
  await page.waitForSelector('#character-creator.on',{timeout:30000});await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]').disabled,null,{timeout:120000});
  assert.equal(await page.evaluate(()=>mode),'character-creator');
  const before=await page.evaluate(()=>({credits:state.credits,loc:state.location,inv:JSON.stringify(state.inventory||null)}));
  const click=async(k,v)=>{await page.locator(`[data-cc="${k}"][data-v="${v}"]`).click();await page.waitForTimeout(700);};
  await page.waitForTimeout(1500);await page.screenshot({path:shot+'/dd-creator-first-'+tier+'.png'});
  // 2. choices apply to the real preview
  await click('base','female');await click('look','ncz-neon');await click('hair','ponytail01');await click('hairColor','cyan');await click('clothingColor','crimson');
  const d=await page.evaluate(()=>JSON.stringify(document.querySelector('#character-creator')&&[...document.querySelectorAll('#character-creator [aria-pressed=true]')].map(b=>b.dataset.cc+':'+(b.dataset.v||''))));
  assert.match(d,/base:female/);assert.match(d,/hair:ponytail01/);assert.match(d,/hairColor:cyan/);assert.match(d,/clothingColor:crimson/);
  await page.waitForTimeout(2500);await page.screenshot({path:shot+'/dd-creator-female-'+tier+'.png'});
  // 3. confirm saves locally and returns to the pod card
  await page.locator('[data-cc=confirm]').click();await page.waitForFunction(()=>mode==='pod-waking'&&!document.querySelector('#character-creator.on'),null,{timeout:30000});
  const saved=await page.evaluate(()=>VoidCharacterCreator.stored());assert.equal(saved.look,'ncz-neon');assert.equal(saved.hair,'ponytail01');assert.equal(saved.hairColor,'cyan');assert.equal(saved.clothingColor,'crimson');
  const after=await page.evaluate(()=>({credits:state.credits,loc:state.location,inv:JSON.stringify(state.inventory||null)}));assert.deepEqual(after,before,'credits, location and inventory unchanged');
  assert.equal(await page.locator('#pod-wake').isVisible(),true);
  // 4. second EXIT POD proceeds normally (the creator is offered once)
  await page.locator('#pod-wake button').click();await page.waitForFunction(()=>mode==='walking',null,{timeout:60000});
  // 5. wardrobe via the API (the station uses the same call): cancel keeps the saved look, confirm changes it, escape cancels
  await page.evaluate(()=>VoidCharacterCreator.open({context:'wardrobe'}));await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]')?.disabled,null,{timeout:120000});
  assert.equal(await page.evaluate(()=>mode),'character-creator');await click('hair','none');await page.keyboard.press('Escape');
  await page.waitForFunction(()=>mode==='walking',null,{timeout:30000});assert.equal((await page.evaluate(()=>VoidCharacterCreator.stored())).hair,'ponytail01');
  await page.evaluate(()=>VoidCharacterCreator.open({context:'wardrobe'}));await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]')?.disabled,null,{timeout:120000});
  await click('hair','short02');await page.locator('[data-cc=confirm]').click();await page.waitForFunction(()=>mode==='walking',null,{timeout:30000});
  assert.equal((await page.evaluate(()=>VoidCharacterCreator.stored())).hair,'short02');
  // 6. nothing leaked: no creator node left in the scene, nothing moved
  const left=await page.evaluate(()=>VoidBabylon.scene.transformNodes.filter(n=>/^character-creator-stage|^character:/.test(n.name)).length);assert.equal(left,0,'preview nodes disposed');
  console.log(JSON.stringify({tier,saved,errors}));assert.deepEqual(errors,[]);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
