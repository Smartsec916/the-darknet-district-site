/* Builds NeoChinatown as 'all', 'street' and 'interior' in Chromium at low and high graphics and checks what each holds.
   Run: node tests/serve-modern.cjs &  then  node tests/district-areas-browser.cjs [low|high]   (Playwright, software GL is fine) */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const BASE=process.env.BASE||'http://127.0.0.1:5187/void-runner.html',tiers=process.argv[2]?[process.argv[2]]:['low','high'];
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
 for(const q of tiers){
  const pg=await (await b.newContext({viewport:{width:1100,height:640}})).newPage(),warns=[],errs=[];
  pg.on('console',m=>{if(/NeoChinatown\]/.test(m.text()))warns.push(m.text());});pg.on('pageerror',e=>errs.push(e.message));
  await pg.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));await pg.route(/firebase|gstatic|googleapis/,r=>r.abort());
  await pg.addInitScript(t=>{try{localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:t}))}catch(e){}},q);
  await pg.goto(BASE+'?visit=darknet-district&v=1');
  await pg.waitForFunction(()=>window.VoidGuest&&VoidGuest.phase==='ready'&&mode==='walking',null,{timeout:240000});await pg.waitForTimeout(4000);
  const snap=()=>pg.evaluate(()=>{const S=VoidBabylon.scene||scene;return {meshes:S.meshes.length,lights:S.lights.length,mats:S.materials.length,solids:walkingLocation.solids.length,ints:walkingLocation.interactions.length,area:walkingLocation.area||'all'};});
  // A guest link now opens just the interior, so the combined environment is built explicitly like the other two.
  const r={};
  for(const area of ['all','street','interior']){
   await pg.evaluate(async a=>{VoidExplorationData.locations['t-'+a]=VoidNeoChinatown.layout(a);walkingLocation=walker=null;mode='menu';await enterWalking('t-'+a);},area);
   await pg.waitForFunction(()=>mode==='walking'&&walker,null,{timeout:240000});await pg.waitForTimeout(3000);r[area]=await snap();}
  console.log(q,JSON.stringify(r));
  assert.equal(r.all.solids,73);assert.equal(r.street.solids,35);assert.equal(r.interior.solids,44);assert.equal(r.street.ints,4);assert.equal(r.interior.ints,11);
  assert(r.street.meshes<r.all.meshes*.9&&r.interior.meshes<r.all.meshes*.5,'each separate environment is smaller than the combined build ('+q+')');
  assert.deepEqual(warns,[],'the random-number seams still match');assert.deepEqual(errs,[],'no page errors');
  await pg.context().close();}
 await b.close();console.log('ok');})().catch(e=>{console.log('FAIL',e.message);process.exit(1)});
