/* Measures what a creator character costs (software GL, so only counts are meaningful, not frame times). Usage: node tests/character-performance-browser.cjs [low|high] */
const {chromium}=require('playwright');
const tier=process.argv[2]==='high'?'high':'low',base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187';
(async()=>{
 const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce',serviceWorkers:'block'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
  await page.addInitScript(q=>localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:q})),tier);await page.goto(base+'/void-runner.html');
  await page.waitForFunction(()=>window.VoidStartup?.started,null,{timeout:120000});
  await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');const c=page.locator('[data-action=menu-new-confirm]');if(await c.count())await c.click();
  await page.waitForFunction(()=>mode==='pod-waking'&&walker,null,{timeout:120000});await page.evaluate(()=>{state.story.flags.appearanceOffered=true;});await page.locator('#pod-wake button').click();
  await page.waitForFunction(()=>mode==='walking'&&VoidAssets.pending===0,null,{timeout:120000});
  const out=await page.evaluate(async()=>{
   const sc=VoidBabylon.scene,A=VoidCharacterAppearance,looks=Object.keys(A.CATALOG.looks),res={perLook:{},rooms:{}},made=[];
   const count=n=>{let tris=0,draws=0,mats=new Set();for(const m of n.getChildMeshes()){if(!m.isEnabled()||!m.getTotalVertices())continue;tris+=m.getTotalIndices()/3;draws+=m.subMeshes?.length||1;mats.add(m.material?.uniqueId);}return {tris:Math.round(tris),draws,materials:mats.size};};
   const room=async(n)=>{const holders=[];for(let i=0;i<n;i++){const p=new BABYLON.TransformNode('perf',sc);p.position.set(walker.x+Math.sin(walker.yaw)*(3+i%4*.7)+Math.cos(walker.yaw)*(i-n/2)*.5,walker.y-1.68,walker.z+Math.cos(walker.yaw)*(3+i%4*.7));const a=A.defaults(looks[i%looks.length]);a.hair=Object.keys(A.CATALOG.hair)[i%9];a.hairColor=A.CATALOG.hairColors[i%8].id;
     a.accessories=a.accessories.filter(x=>x!=='hat'||CATALOG_OK(a));holders.push([p,await VoidCharacterAssembler.build(a,p,{scene:sc})]);}return holders;};
   const CATALOG_OK=a=>A.CATALOG.hair[a.hair].hatOk;
   for(const l of looks){const p=new BABYLON.TransformNode('perf1',sc);const ch=await VoidCharacterAssembler.build(A.defaults(l),p,{scene:sc});res.perLook[l]=count(ch.node);const a2=A.defaults(l);a2.hair='bob01';a2.accessories=[];await ch.set(a2);res.perLook[l+'+bob01']=count(ch.node);ch.dispose();p.dispose();}
   for(const n of [1,4,8,12]){const t0=performance.now(),h=await room(n);const t=h.reduce((s,[,ch])=>{const x=count(ch.node);return {tris:s.tris+x.tris,draws:s.draws+x.draws};},{tris:0,draws:0});res.rooms[n]={...t,buildMs:Math.round(performance.now()-t0),heapMB:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null};for(const [p,ch] of h){ch.dispose();p.dispose();}}
   return res;});
  console.log(JSON.stringify({tier,out,errors},null,1));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
