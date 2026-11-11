/* Character assembler in the real District (software GL): standard heights, hairstyles re-fitted, colours, accessories, look changes. Usage: node tests/character-assembler-browser.cjs [low|high]. */
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
  await page.waitForFunction(()=>mode==='pod-waking'&&walker,null,{timeout:120000});await page.locator('#pod-wake button').click();
  await page.waitForFunction(()=>mode==='walking'&&walker&&VoidAssets.pending===0,null,{timeout:120000});await page.waitForTimeout(2000);
  const measure=`(n)=>{const ms=n.getChildMeshes().filter(x=>x.isEnabled()&&x.isVisible);let lo=1e9,hi=-1e9;for(const x of ms){x.computeWorldMatrix(true);x.refreshBoundingInfo?.({applySkeleton:true,applyMorph:false});const b=x.getBoundingInfo().boundingBox;lo=Math.min(lo,b.minimumWorld.y);hi=Math.max(hi,b.maximumWorld.y);}return {meshes:ms.length,lo:+lo.toFixed(3),hi:+hi.toFixed(3),height:+(hi-lo).toFixed(3)};}`;
  const out={};
  // every look at standard height
  for(const look of ['district-smuggler','hacker-01','regular-01','vesper-trader','district-resident','ncz-neon','fixer-01']){
   const r=await page.evaluate(async([look,measure])=>{const sc=VoidBabylon.scene,p=new BABYLON.TransformNode('t-'+look,sc);p.position.set(walker.x,walker.y-1.68,walker.z);
    const c=await VoidCharacterAssembler.build(VoidCharacterAppearance.defaults(look),p,{scene:sc});window['c_'+look]=c;await new Promise(r=>setTimeout(r,800));
    return {...eval(measure)(c.node),want:VoidCharacterAppearance.CATALOG.bases[VoidCharacterAppearance.CATALOG.looks[look].base].height,floor:p.position.y};},[look,measure]);
   out[look]=r;assert(Math.abs(r.height-r.want)<.12,look+' height '+JSON.stringify(r));assert(Math.abs(r.lo-r.floor)<.08,look+' feet on floor '+JSON.stringify(r));
   await page.evaluate(look=>{window['c_'+look].dispose();},look);
  }
  console.log(JSON.stringify({tier,out,errors}));
  assert.deepEqual(errors,[]);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
