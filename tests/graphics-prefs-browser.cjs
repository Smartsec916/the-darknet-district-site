/* Graphics defaults and saved preferences in the real game page (software GL is enough: only the menu is needed). New players: Medium. Old saves: see graphics-prefs.js.
   Usage: node tests/graphics-prefs-browser.cjs */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',KEY='void-runner-graphics-v1';
(async()=>{
 const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});const errors=[];
 async function open(saved){
  const ctx=await browser.newContext({viewport:{width:1280,height:720},serviceWorkers:'block'});const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(120000);
  await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
  if(saved!==undefined)await page.addInitScript(([k,v])=>{if(!sessionStorage.getItem('seeded')){localStorage.setItem(k,JSON.stringify(v));sessionStorage.setItem('seeded','1');}},[KEY,saved]);
  await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);await page.waitForTimeout(500);
  return {ctx,page};
 }
 const read=p=>p.evaluate(k=>({quality:VoidGraphics.quality,chosen:VoidGraphics.chosen,engine:VoidBabylon.presets?Object.keys(VoidBabylon.presets):null,stored:JSON.parse(localStorage.getItem(k)||'null')}),KEY);
 const cases=[
  ['nothing saved (new player)',undefined,'medium',false],
  ['old unchosen High (12 Nov default saved with the look sensitivity)',{renderer:'babylon',quality:'high',lookSensitivity:.002},'medium',false],
  ['old automatic Low',{quality:'low',auto:true},'medium',false],
  ['old automatic setting can never become Ultra',{quality:'ultra',auto:true},'medium',false],
  ['old chosen Low',{renderer:'babylon',quality:'low'},'low',true],
  ['old chosen Medium',{renderer:'babylon',quality:'medium'},'medium',true],
  ['old chosen Ultra',{renderer:'babylon',quality:'ultra'},'ultra',true],
  ['chosen High (version 2)',{renderer:'babylon',quality:'high',v:2,chosen:true},'high',true],
  ['unusable value',{quality:'banana'},'medium',false],
 ];
 for(const [name,saved,quality,chosen] of cases){
  const {ctx,page}=await open(saved);const r=await read(page);assert.equal(r.quality,quality,name+': preset');assert.equal(r.chosen,chosen,name+': chosen');
  assert.equal(await page.evaluate(()=>VoidBabylon.renderSize(1920,1080,VoidGraphics.quality).width<=(VoidGraphics.quality==='medium'?2560:5120)),true);
  console.log('ok  ',name,'->',r.quality,JSON.stringify(r.stored));await ctx.close();
 }
 // the migrated value is written once and stays Medium after another start; a chosen High survives a start
 {const {ctx,page}=await open({renderer:'babylon',quality:'high'});await page.waitForTimeout(500);const s=await read(page);assert.deepEqual([s.stored.v,s.stored.chosen,s.stored.quality],[2,false,'medium'],'the corrected value is saved');
  await page.reload();await page.waitForFunction(()=>window.VoidStartup?.started);assert.equal((await read(page)).quality,'medium','still Medium after another start');await ctx.close();}
 // Settings: choosing a preset is kept across a restart and never overridden; Reset returns to Medium and clears the choice
 {const {ctx,page}=await open(undefined);await page.click('[data-action=menu-settings]');await page.waitForSelector('#quality-setting');
  assert.equal(await page.inputValue('#quality-setting'),'medium','Settings show Medium on a new profile');assert.match(await page.textContent('.settings-panel'),/Medium is the default/);assert.doesNotMatch(await page.textContent('.settings-panel'),/High is the default/);
  await page.selectOption('#quality-setting','high');const a=await read(page);assert.deepEqual([a.quality,a.chosen,a.stored.v,a.stored.chosen,a.stored.quality],['high',true,2,true,'high']);
  await page.reload();await page.waitForFunction(()=>window.VoidStartup?.started);const b=await read(page);assert.deepEqual([b.quality,b.chosen],['high',true],'a chosen preset survives a restart');
  await page.click('[data-action=menu-settings]');await page.waitForSelector('#graphics-reset');await page.click('#graphics-reset');
  const c=await read(page);assert.deepEqual([c.quality,c.chosen,c.stored.quality,c.stored.chosen],['medium',false,'medium',false]);assert.equal(await page.inputValue('#quality-setting'),'medium');
  assert.equal(await page.evaluate(()=>VoidBabylon.renderSize(1920,1080).width),1920,'the renderer follows the reset at once');
  await page.reload();await page.waitForFunction(()=>window.VoidStartup?.started);assert.equal((await read(page)).quality,'medium');await ctx.close();}
 // nothing in the page switches quality by itself: leave it running and check
 {const {ctx,page}=await open(undefined);await page.waitForTimeout(8000);assert.equal((await read(page)).quality,'medium','no automatic change');assert.equal(await page.evaluate(()=>localStorage.getItem('void-runner-graphics-v1')),null,'nothing is written until the player changes something');await ctx.close();}
 console.log(JSON.stringify({errors}));assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
