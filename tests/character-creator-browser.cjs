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
  // 1. A new campaign opens the creator before showing the pod wake screen.
  await page.waitForSelector('#character-creator.on',{timeout:120000});
  await page.waitForFunction(()=>VoidAssets.pending===0,null,{timeout:120000});
  assert.equal(await page.evaluate(()=>VoidCharacterCreator.stored()),null);
  assert.equal(await page.locator('#pod-wake').isVisible(),false,'the player has not spawned in the pod yet');
  await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]').disabled,null,{timeout:120000});
  assert.equal(await page.evaluate(()=>mode),'character-creator');
  const before=await page.evaluate(()=>({credits:state.credits,loc:state.location,inv:JSON.stringify(state.inventory||null)}));
  const click=async(k,v)=>{await page.locator(`[data-cc="${k}"][data-v="${v}"]`).click();await page.waitForTimeout(700);};
  await page.waitForTimeout(1500);await page.screenshot({path:shot+'/dd-creator-first-'+tier+'.png'});
  // 2. choices apply to the real preview
  await click('base','female');await click('look','ncz-neon');await click('hair','ponytail01');await click('hairColor','cyan');await click('clothingColor','crimson');
  const tinted=await page.evaluate(()=>VoidBabylon.scene.meshes.filter(m=>/female_sportsuit01/.test(m.name)).map(m=>({name:m.name,material:m.material?.name,color:m.material?.albedoColor?.toHexString()})));
  assert(tinted.some(m=>m.material?.endsWith('-tint')),'outfit mesh must receive the selected colour: '+JSON.stringify(tinted));
  const d=await page.evaluate(()=>JSON.stringify(document.querySelector('#character-creator')&&[...document.querySelectorAll('#character-creator [aria-pressed=true]')].map(b=>b.dataset.cc+':'+(b.dataset.v||''))));
  assert.match(d,/base:female/);assert.match(d,/hair:ponytail01/);assert.match(d,/hairColor:cyan/);assert.match(d,/clothingColor:crimson/);
  await page.waitForTimeout(2500);await page.screenshot({path:shot+'/dd-creator-female-'+tier+'.png'});
  // 3. confirm saves locally and returns to the pod card
  await page.locator('[data-cc=confirm]').click();await page.waitForFunction(()=>mode==='pod-waking'&&!document.querySelector('#character-creator.on'),null,{timeout:30000});
  const saved=await page.evaluate(()=>VoidCharacterCreator.stored());assert.equal(saved.look,'ncz-neon');assert.equal(saved.hair,'ponytail01');assert.equal(saved.hairColor,'cyan');assert.equal(saved.clothingColor,'crimson');
  const after=await page.evaluate(()=>({credits:state.credits,loc:state.location,inv:JSON.stringify(state.inventory||null)}));assert.deepEqual(after,before,'credits, location and inventory unchanged');
  assert.equal(await page.locator('#pod-wake').isVisible(),true);
  const podParts=await page.evaluate(()=>({screens:VoidBabylon.scene.meshes.filter(m=>m.name==='tesana-pod-screen').length,lights:VoidBabylon.scene.materials.filter(m=>/^ncz-tesana-pod-led-\d+$/.test(m.name)).length}));
  assert.deepEqual(podParts,{screens:10,lights:10},'each pod has a local screen and lighting material');
  await page.screenshot({path:shot+'/dd-pod01-'+tier+'.png'});
  await page.locator('[data-pod=look]').click();assert.equal(await page.evaluate(()=>walker.yaw),Math.PI/2);
  await page.screenshot({path:shot+'/dd-pod01-inside-'+tier+'.png'});
  await page.locator('[data-pod=look]').click();assert.equal(await page.evaluate(()=>walker.yaw),-Math.PI/2);
  await page.locator('[data-pod=music]').click();await page.waitForSelector('#pod-music');
  await page.locator('[data-action="pod-music:light:reading"]').click();
  await page.locator('#pod-music-volume').evaluate(el=>{el.value='35';el.dispatchEvent(new Event('input',{bubbles:true}));});
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('darknet-pod-controls-1'))),{volume:.35,lighting:'reading'});
  await page.locator('[data-action="pod-music:return"]').click();await page.waitForFunction(()=>mode==='pod-waking');
  // 4. EXIT POD proceeds normally after creation.
  await page.locator('#pod-wake button').click();await page.waitForFunction(()=>mode==='walking',null,{timeout:60000});
  // Pod 01 can be entered again from its hatch, and exiting it returns to open floor.
  assert.equal(await page.evaluate(()=>VoidInteractions.handlers.get('district-pod')()),undefined);
  await page.waitForFunction(()=>mode==='pod-waking',null,{timeout:30000});
  assert.equal(await page.locator('#character-creator.on').count(),0,'re-entering a saved pod does not reopen creation');
  await page.locator('#pod-wake button').click();await page.waitForFunction(()=>mode==='walking',null,{timeout:60000});
  assert.equal(await page.evaluate(()=>VoidExplorer.blocked(walker.x,walker.z,walkingLocation)),false,'pod exit is clear');
  const tenth=await page.evaluate(()=>walkingLocation.interactions.find(i=>i.podIndex===10));
  assert(tenth&&tenth.action==='district-pod');
  await page.evaluate(item=>VoidInteractions.handlers.get('district-pod')({item}),tenth);
  await page.waitForFunction(()=>mode==='pod-waking'&&state.story.flags.activePod===10,null,{timeout:30000});
  assert.match(await page.locator('#pod-wake .pod-wake-card p').textContent(),/POD 10/);
  await page.screenshot({path:shot+'/dd-pod10-'+tier+'.png'});
  await page.locator('[data-pod=music]').click();await page.waitForSelector('#pod-music');
  assert.equal(await page.locator('#pod-music-volume').inputValue(),'80','another pod retains its own volume');
  await page.locator('[data-action="pod-music:light:music"]').click();
  await page.locator('[data-action="pod-music:return"]').click();await page.waitForFunction(()=>mode==='pod-waking');
  await page.locator('#pod-wake button').click();await page.waitForFunction(()=>mode==='walking',null,{timeout:60000});
  assert.equal(await page.evaluate(()=>VoidExplorer.blocked(walker.x,walker.z,walkingLocation)),false,'upper pod returns to clear floor');
  // 4b. the wardrobe station exists in the pod room and opens the same screen
  const st=await page.evaluate(()=>{const i=walkingLocation.interactions.find(x=>x.action==='district-wardrobe'),m=VoidBabylon.scene.getMeshByName('pod-wardrobe-panel');return {i:!!i,mesh:!!m,handler:VoidInteractions.handlers.has('district-wardrobe'),pos:i?.position};});
  assert(st.i&&st.mesh&&st.handler,'wardrobe station: '+JSON.stringify(st));
  await page.evaluate(([x,z])=>{{const P=VoidDistrictArea.POINT.podExit,e=VoidDistrictArea.podExit(VoidNeoChinatown),cx=e.spawn[0]+P[0],cz=e.spawn[2]+P[1];Object.assign(walker,{x:cx+5.4,z:cz-65.6,yaw:Math.PI,pitch:0,vx:0,vz:0});}},[0,0]);await page.waitForTimeout(1500);await page.screenshot({path:shot+'/dd-wardrobe-station-'+tier+'.png'});
  await page.evaluate(()=>VoidInteractions.handlers.get('district-wardrobe')());await page.waitForSelector('#character-creator.on');assert.match(await page.textContent('#character-creator h1'),/WARDROBE/);
  await page.keyboard.press('Escape');await page.waitForFunction(()=>mode==='walking',null,{timeout:30000});
  // 5. wardrobe via the API (the station uses the same call): cancel keeps the saved look, confirm changes it, escape cancels
  await page.evaluate(()=>VoidCharacterCreator.open({context:'wardrobe'}));await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]')?.disabled,null,{timeout:120000});
  assert.equal(await page.evaluate(()=>mode),'character-creator');await click('hair','none');await page.keyboard.press('Escape');
  await page.waitForFunction(()=>mode==='walking',null,{timeout:30000});assert.equal((await page.evaluate(()=>VoidCharacterCreator.stored())).hair,'ponytail01');
  await page.evaluate(()=>VoidCharacterCreator.open({context:'wardrobe'}));await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]')?.disabled,null,{timeout:120000});
  await click('base','male');await click('look','district-smuggler');await click('hair','short02');await click('clothingColor','teal');
  const maleTint=await page.evaluate(()=>VoidBabylon.scene.meshes.filter(m=>/male_casualsuit01/.test(m.name)).map(m=>({name:m.name,material:m.material?.name})));
  assert(maleTint.some(m=>m.material?.endsWith('-tint')),'male outfit mesh must receive the selected colour: '+JSON.stringify(maleTint));
  await page.screenshot({path:shot+'/dd-creator-male-'+tier+'.png'});
  await page.locator('[data-cc=confirm]').click();await page.waitForFunction(()=>mode==='walking',null,{timeout:30000});
  const maleSaved=await page.evaluate(()=>VoidCharacterCreator.stored());assert.equal(maleSaved.base,'male');assert.equal(maleSaved.hair,'short02');assert.equal(maleSaved.clothingColor,'teal');
  // 6. nothing leaked: no creator node left in the scene, nothing moved
  const left=await page.evaluate(()=>VoidBabylon.scene.transformNodes.filter(n=>/^character-creator-stage|^character:/.test(n.name)).length);assert.equal(left,0,'preview nodes disposed');
  await page.evaluate(()=>openGameMenu());await page.locator('[data-action=menu-resume]').click();await page.waitForFunction(()=>mode==='walking');
  assert.equal(await page.locator('#character-creator.on').count(),0,'menu resume does not reopen creation');
  await page.reload();await page.waitForFunction(()=>window.VoidStartup?.started,null,{timeout:120000});
  await page.locator('[data-action=menu-continue]').click();await page.waitForFunction(()=>mode==='pod-waking',null,{timeout:120000});
  assert.equal(await page.locator('#character-creator.on').count(),0,'existing saved character is reused on campaign resume');
  await page.locator('#pod-wake button').click();await page.waitForFunction(()=>mode==='walking',null,{timeout:60000});
  console.log(JSON.stringify({tier,saved,errors}));assert.deepEqual(errors,[]);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
