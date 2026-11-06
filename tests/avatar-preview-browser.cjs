/* Dev-only avatar preview in the real District (local host only). Usage: node tests/avatar-preview-browser.cjs [low|high]. */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const tier=process.argv[2]==='high'?'high':'low',base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187';
(async()=>{
 const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
 const errors=[],open=async(url,ctx)=>{const page=await (ctx||browser).newPage({viewport:{width:1280,height:800},reducedMotion:'reduce',serviceWorkers:'block'});page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
  await page.addInitScript(q=>localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:q})),tier);await page.goto(url);return page;};
 try{
  // 1. Without the flag nothing exists. (127.0.0.1 is local, but the preview was not asked for.)
  let page=await open(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started,null,{timeout:120000});
  assert.equal(await page.evaluate(()=>typeof VoidAvatarPreview),'undefined','absent unless asked for');await page.close();
  // 2. With the flag, in the District street.
  page=await open(base+'/void-runner.html?avatar-preview=1');await page.waitForFunction(()=>window.VoidStartup?.started,null,{timeout:120000});
  // A new campaign wakes in Sleeping Pod 01 inside The Darknet District, which loads the district looks (the street loads other crowd models).
  await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');
  const confirm=page.locator('[data-action=menu-new-confirm]');if(await confirm.count())await confirm.click();
  await page.waitForFunction(()=>mode==='pod-waking'&&walker,null,{timeout:120000});await page.locator('#pod-wake button').click();
  await page.waitForFunction(()=>mode==='walking'&&walker&&VoidAssets.pending===0,null,{timeout:120000});await page.waitForTimeout(3000);
  const npcBefore=await page.evaluate(()=>VoidBabylon.scene.transformNodes.filter(n=>/^crowd:/.test(n.name)).length);
  const out={};
  for(const m of ['district-smuggler','district-resident']){
   const r=await page.evaluate(m=>VoidAvatarPreview.show({model:m,ahead:1.2}),m);assert(r.ok,m+': '+JSON.stringify(r));await page.waitForFunction(()=>VoidAvatarPreview.active,null,{timeout:120000,polling:250});
   await page.waitForTimeout(1500);
   // Measured the same way for the preview and for an existing NPC of the same look (if one is in this room), so the check compares like with like.
   const info=await page.evaluate(m=>{const sc=VoidBabylon.scene,measure=n=>{const ms=n.getChildMeshes().filter(x=>x.isEnabled()&&x.isVisible);let lo=Infinity,hi=-Infinity;
     for(const x of ms){x.computeWorldMatrix(true);x.refreshBoundingInfo?.({applySkeleton:true,applyMorph:false});const b=x.getBoundingInfo().boundingBox;lo=Math.min(lo,b.minimumWorld.y);hi=Math.max(hi,b.maximumWorld.y);}return {meshes:ms.length,height:+(hi-lo).toFixed(2),floor:+lo.toFixed(2)};};
    const n=sc.getTransformNodeByName('avatar-preview'),ref=sc.transformNodes.find(x=>x.name==='crowd:'+m+'-model'&&x.parent?.name!=='avatar-preview'&&x.isEnabled());
    return {...measure(n),ref:ref?measure(ref):null,eyeY:walker.y};},m);
   assert(info.meshes>0,'visible meshes');if(info.ref)assert(Math.abs(info.height-info.ref.height)<.25,'same height as the existing NPC of this look: '+JSON.stringify(info));out[m]=info;
   if(m==='district-smuggler'){await page.evaluate(()=>{canvas.focus();});await page.waitForTimeout(1500);await page.screenshot({path:'/tmp/dd-avatar-preview-'+tier+'.png'});}
  }
  const adm=await page.evaluate(()=>VoidAvatarPreview.show({model:'admin'}));assert.equal(adm.ok,false);
  assert.equal((await page.evaluate(()=>VoidAvatarPreview.show({model:'nope'}))).ok,false);
  await page.evaluate(()=>VoidAvatarPreview.show({model:'district-resident'}));await page.evaluate(()=>VoidAvatarPreview.hide());
  const npcAfter=await page.evaluate(()=>VoidBabylon.scene.transformNodes.filter(n=>/^crowd:/.test(n.name)).length);
  assert.equal(await page.evaluate(()=>VoidAvatarPreview.active),false);assert.equal(npcAfter,npcBefore,'existing NPC nodes untouched');
  assert.deepEqual(errors,[]);console.log(JSON.stringify({tier,npcBefore,npcAfter,out,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
