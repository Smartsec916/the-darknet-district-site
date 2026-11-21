/* The Mission Editor stays open (the owner, 21 Nov 2026: "sometimes the mission editor times out and goes to the previous page. also while trying to play through a
   test mission the editor pops up"). Offline Chromium, mocked developer server:
   1. editor open, a box being typed in: the 4-minute account check (VoidDevTools.identity for the same account) runs: the window stays open, same tab, typed text kept;
   2. Escape in a text box leaves the box, not the editor;
   3. signed out while the editor is open: it stays open with the "Sign-in expired" bar; signing in again hides the bar;
   4. the server asleep (two timeouts): "Server waking up / retrying…", then "Saved on the server" by itself; nothing closes;
   5. a new build while the editor was used over the main menu: the update rule says wait, the APPLY UPDATE bar shows; no reload happens by itself;
   6. PLAY THIS DRAFT: the account check runs again during play (it used to open the editor over the game), the game keys are pressed (Space, E, F, V, Escape, `):
      the editor stays closed; a failed step shows the small banner note; LEAVE DRAFT · BACK TO EDITOR brings the editor back.
   Usage: node tests/editor-timeout-browser.cjs  (own static server on a free port; SITE_TEST_URL, SHOTS, BROWSER_EXECUTABLE optional) */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const shots=process.env.SHOTS||path.resolve(__dirname,'..','docs/development/mission-001');fs.mkdirSync(shots,{recursive:true});
const exe=process.env.BROWSER_EXECUTABLE||['/opt/pw-browsers/chromium','/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'].find(f=>fs.existsSync(f))||null;
const OLD=process.env.EXPECT_OLD==='1';   // run against the code before the fix: report what goes wrong instead of failing at the first assert
function serve(){const root=path.resolve(__dirname,'..'),types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.ogg':'audio/ogg','.png':'image/png'};
 const srv=http.createServer((req,res)=>{let f;try{f=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));}catch{res.writeHead(400);return res.end();}if(!f.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);return res.end();}res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(d);});});
 return new Promise(r=>srv.listen(0,'127.0.0.1',()=>r(srv)));}
const log=m=>console.log('·',m),seen=[];const check=(ok,msg)=>{seen.push((ok?'OK   ':'FAIL ')+msg);if(!OLD)assert.ok(ok,msg);};
(async()=>{
 const srv=process.env.SITE_TEST_URL?null:await serve(),base=process.env.SITE_TEST_URL||'http://127.0.0.1:'+srv.address().port;
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'],...(exe?{executablePath:exe}:{})});
 const store={record:null,sleep:0,posts:0};
 try{
  const ctx=await browser.newContext({viewport:{width:1366,height:768},serviceWorkers:'block'}),page=await ctx.newPage();page.setDefaultTimeout(240000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{try{if(!localStorage.getItem('mission-editor-view'))localStorage.setItem('mission-editor-view','form');}catch{}});
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));await page.route('**/api/**',r=>r.fulfill({status:503,contentType:'application/json',body:'{}'}));
  await page.exposeFunction('__server',(p,body)=>{
   if(p==='developer/drafts/schema')return {ok:{roles:{editor:true,draftsEnabled:true}}};
   if(p==='developer/drafts')return {ok:{drafts:[]}};
   if(p==='developer/drafts/mission-editor-workspace'){
    if(store.sleep>0){store.sleep--;return {status:0,kind:'timeout',error:'The VOID NETWORK connection timed out. Local play is ready.'};}
    if(!body)return store.record?{ok:store.record}:{status:404,error:'Draft not found.'};
    if(body.revision!==(store.record?store.record.revision:0))return {status:409,error:'Revision conflict.'};
    store.posts++;store.record={id:'mission-editor-workspace',revision:(store.record?store.record.revision:0)+1,document:body.document,updatedAt:Math.floor(Date.now()/1000)};return {ok:store.record};}
   return {status:404,error:'off in this test'};});
  const boot=()=>page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:120000});
  // what account.js does on every successful account check (first load, every 4 minutes, tab focus): the same account, a new request function
  const confirm=()=>page.evaluate(()=>VoidDevTools.identity(async(p,body)=>{if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1,preset:'NORMAL'};const r=await window.__server(p,body);if(r.ok)return r.ok;const e=new Error(r.error);e.status=r.status;if(r.kind)e.kind=r.kind;throw e;},{uid:'owner-test'}));
  const open=()=>page.evaluate(()=>!document.getElementById('dev-balance').hidden);
  const reopen=async()=>{if(OLD&&!(await open())){await page.evaluate(()=>VoidDevTools.open('missions'));await page.waitForSelector('[data-me-tree-mission="m001-awakening"]');}};   // the old code closed it: open it again to see the next problem
  await page.goto(base+'/void-runner.html');await boot();
  await page.evaluate(()=>{const s=C.startDistrictCampaign(C.fresh());localStorage.setItem('void-runner-campaign-v1',JSON.stringify({...s,savedAt:1700000000000}));});
  await page.reload();await boot();await confirm();await page.evaluate(()=>VoidDevTools.open('missions'));await page.waitForSelector('[data-me-tree="main-storyline"]',{timeout:90000});
  await page.locator('[data-me-tree="main-storyline"]').click();await page.waitForSelector('[data-me-tree-mission="m001-awakening"]');
  // 1. the account check while typing
  const box=page.locator('[data-me-tline="speak/say/0"] textarea').first();await box.click();if(OLD)page.setDefaultTimeout(30000);await box.pressSequentially(' still typing',{delay:5});
  await confirm();await page.waitForTimeout(300);
  check(await open(),'1. the account check left the editor open');check(await page.evaluate(()=>VoidDevTools.tab)==='missions','1. same tab');
  check((await box.inputValue()).endsWith(' still typing'),'1. the text being typed is still there');log('1 done');
  await reopen();// 2. Escape in the box
  await box.focus();await page.keyboard.press('Escape');check(await open(),'2. Escape in a text box did not close the editor');log('2 done');
  await reopen();// 3. signed out, then signed in again
  await page.evaluate(()=>VoidDevTools.identity(null,{uid:null}));await page.waitForTimeout(200);
  check(await open(),'3. signed out: the editor stays open');check(await page.evaluate(()=>{const b=document.getElementById('dev-session-bar');return !!b&&!b.hidden&&/Sign-in expired/.test(b.textContent)&&/SIGN IN/.test(b.textContent);}),'3. the Sign-in expired bar shows');
  await page.screenshot({path:path.join(shots,'editor-signin-bar-1366.png')});
  await confirm();check(await page.evaluate(()=>{const b=document.getElementById('dev-session-bar');return !!b&&b.hidden;}),'3. signed in again: the bar is gone');check(await open(),'3. still open');log('3 done');
  await reopen();// 4. the server asleep: two timeouts, then it answers
  store.sleep=2;await box.fill('Server nap test line');await box.blur();
  await page.waitForFunction(()=>/Server waking up \/ retrying/.test(document.querySelector('[data-me-server-copy]')?.textContent||''),null,{timeout:30000}).then(()=>check(true,'4. "Server waking up / retrying…" shown'),()=>check(false,'4. "Server waking up / retrying…" shown'));
  await page.screenshot({path:path.join(shots,'editor-server-waking-1366.png')});
  await page.waitForFunction(()=>/^Saved on the server/.test(document.querySelector('[data-me-server-copy]')?.textContent||''),null,{timeout:60000}).then(()=>check(true,'4. saved by itself after the server woke'),()=>check(false,'4. saved by itself after the server woke'));
  check(await open(),'4. still open');log('4 done');
  // 5. a new build while the editor was used (closed again, the main menu behind it)
  await page.evaluate(()=>{document.getElementById('dev-balance').hidden=true;});
  const decision=await page.evaluate(()=>VoidUpdate.when({started:true,mode,mainMenu:!!document.querySelector('#screen:not(.hidden) .main-menu'),testing:!!VoidDevTest.active,editor:!!VoidDevTools.used}));
  check(decision==='wait','5. a new build waits (no reload by itself): '+decision);
  if(!OLD)await page.evaluate(()=>VoidDevTools.updateReady?.());check(await page.evaluate(()=>/APPLY UPDATE/.test(document.getElementById('dev-session-bar')?.textContent||'')&&!document.getElementById('dev-session-bar').hidden),'5. the APPLY UPDATE bar shows');
  await page.screenshot({path:path.join(shots,'editor-update-bar-1366.png')});log('5 done');
  // 6. draft play
  await confirm();await page.evaluate(()=>VoidDevTools.open('missions'));await page.waitForSelector('[data-me-play="tree:m001-awakening#speak"]');
  await page.evaluate(()=>{try{VoidGraphics.quality='low';VoidBabylon.setQuality('low');}catch{}});
  await page.locator('[data-me-play="tree:m001-awakening#speak"]').click();
  await page.waitForFunction(()=>!document.getElementById('dev-test-banner').hidden&&mode==='walking',null,{timeout:180000});
  check(!(await open()),'6. the editor is closed while the draft plays');
  await confirm();await page.waitForTimeout(500);check(!(await open()),'6. the account check during draft play did not open the editor');
  for(const k of ['Space','KeyE','KeyF','KeyV','Escape','Backquote','Enter']){await page.keyboard.press(k);await page.waitForTimeout(150);if(k==='Escape'||k==='KeyV'){await page.evaluate(()=>{try{if(mode==='pause')resume?.();}catch{}});}}
  check(!(await open()),'6. game keys did not open the editor');
  const noted=await page.evaluate(()=>VoidDevTest.stepNote?.('SPOTTED by security; you are back outside'));check(!!noted&&await page.evaluate(()=>/Draft: step failed/.test(document.getElementById('dev-test-banner').textContent)),'6. a failed step shows the banner note');
  check(!(await open()),'6. still no editor after the failed step');
  await page.screenshot({path:path.join(shots,'draft-step-failed-note-1366.png'),timeout:180000});
  check(/BACK TO EDITOR/.test(await page.locator('#dev-test-banner button').textContent()),'6. the banner has LEAVE DRAFT · BACK TO EDITOR');
  await Promise.all([page.waitForNavigation({timeout:60000}),page.locator('#dev-test-banner button').dispatchEvent('click')]);await boot();await confirm();
  await page.waitForSelector('[data-me-tree-mission="m001-awakening"]',{timeout:60000});check(await open(),'6. BACK TO EDITOR: the editor is back');
  await confirm();await page.waitForTimeout(300);check(await open(),'6. and stays open through the next account check');
  check(!errors.length,'no page errors: '+errors.join(' | '));
 }finally{console.log(seen.join('\n'));await browser.close();srv&&srv.close();}
 if(!OLD)console.log('editor-timeout-browser: all passed');
})().catch(e=>{console.error(e);process.exit(1);});
