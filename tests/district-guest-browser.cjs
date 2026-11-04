/* Opens share links in Chromium and checks which environment each lands in: links into the District and the arcade open the interior,
   the street and the stations open outside. A guest never writes a save.
   Run: node tests/serve-modern.cjs &  then  node tests/district-guest-browser.cjs [low|high] [id ...]  (Playwright, software GL) */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const BASE=process.env.BASE||'http://127.0.0.1:5187/void-runner.html',tier=['low','high'].includes(process.argv[2])?process.argv[2]:'low';
const ALL=[['darknet-district','visit','interior'],['district-night','scenario','interior'],['vr-forest','scenario','vr'],['neochinatown','visit','street'],['meridian','visit','station']];
const only=process.argv.slice(['low','high'].includes(process.argv[2])?3:2);
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});let failed=0;
 for(const [id,key,want] of ALL){if(only.length&&!only.includes(id))continue;
  const ctx=await b.newContext({viewport:{width:1000,height:600}}),pg=await ctx.newPage(),errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));await pg.route(/firebase|gstatic|googleapis/,r=>r.abort());
  await pg.addInitScript(t=>{try{localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:t}));localStorage.setItem('void-runner-campaign-v1','REAL-SAVE-SENTINEL');}catch(e){}},tier);
  try{
   await pg.goto(BASE+'?'+key+'='+id+'&v=1');await pg.waitForFunction(()=>window.VoidStartup?.started,null,{timeout:120000});
   await pg.evaluate(()=>{Object.assign(VoidPreparation.limits,{scene:900000,assets:300000,optional:300000,total:1500000});});
   await pg.waitForFunction(()=>window.VoidGuest&&(VoidGuest.phase==='ready'||VoidGuest.phase==='error'),null,{timeout:900000});await pg.waitForTimeout(2500);
   const r=await pg.evaluate(()=>({phase:VoidGuest.phase,err:VoidGuest.error&&VoidGuest.error.message,mode,loc:walkingLocation&&walkingLocation.id,area:walkingLocation&&walkingLocation.area,save:localStorage.getItem('void-runner-campaign-v1')}));
   assert.equal(r.phase,'ready',id+' opens: '+r.err);assert.equal(r.save,'REAL-SAVE-SENTINEL','real save untouched');
   if(want==='interior')assert.equal(r.area,'interior',id+' opens inside the District');
   else if(want==='street')assert.equal(r.area,'street',id+' opens on the street');
   else if(want==='vr')assert.equal(r.mode==='walking'||r.mode==='vr-menu'||r.mode==='play',true,id+' VR session started ('+r.mode+')');
   else assert.notEqual(r.area,'interior',id+' is not the District');
   assert.deepEqual(errs,[],id+' page errors');console.log('ok  ',id,JSON.stringify({mode:r.mode,loc:r.loc,area:r.area}));
  }catch(e){failed++;console.log('FAIL',id,e.message.split('\n')[0]);}
  await ctx.close();}
 await b.close();process.exit(failed?1:0);})();
