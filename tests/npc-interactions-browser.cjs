// Offline editor smoke; start tests/serve-modern.cjs first. No production calls.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||'/usr/bin/chromium',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader']});try{
 const page=await browser.newPage({viewport:{width:1366,height:900},serviceWorkers:'block'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline'}));await page.route('**/api/**',r=>r.fulfill({status:404,body:'{}'}));
 await page.goto((process.env.SITE_TEST_URL||'http://127.0.0.1:5187')+'/void-runner.html');await page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:180000});
 await page.evaluate(()=>{VoidDevTools.identity(async p=>{if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1,preset:'NORMAL'};const e=new Error('offline test');e.status=404;throw e;});VoidDevTools.npcFocus='tea-host';VoidDevTools.open('npcs');});
 const panel=page.locator('[data-npc-interactions="tea-host"]');await panel.waitFor({timeout:60000});
 const before=await page.evaluate(()=>JSON.stringify(VoidMissionEditor.local().trees));
 await panel.getByLabel('Approach greetings (one alternative per line)').fill('Welcome.\nGood evening.\nTea?');await panel.getByLabel('TALK dialogue (one alternative per line)').fill('What can I get you?');
 await panel.getByRole('button',{name:'SAVE INTERACTION'}).click();assert.match(await panel.textContent(),/Saved to your draft/);
 const result=await page.evaluate(()=>({trees:JSON.stringify(VoidMissionEditor.local().trees),interaction:VoidMissionEditor.draftContent().interactions['tea-host']}));assert.equal(result.trees,before);assert.equal(result.interaction.near,'Welcome.\nGood evening.\nTea?');
 if(process.env.SHOT)await panel.screenshot({path:process.env.SHOT});console.log('NPC interaction editor: saved three alternatives, mission tree unchanged. Page errors:',errors);
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
