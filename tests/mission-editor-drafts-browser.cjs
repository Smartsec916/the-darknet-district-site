/* The owner's Mission Editor drafts are never lost (the owner, 17 Nov 2026: a new tree "Awakening" with no missions was gone after he cleared his browser history).
   Offline Chromium with a mocked server (the Stage 3B private draft API kept in this script's memory, so it survives reloads and a cleared browser):
   1. an EMPTY tree survives a reload; 2. and a PLAY THIS DRAFT + LEAVE DRAFT round trip; 3. the whole draft is copied to the server as "mission-editor-workspace"
   ("Saved on the server · <time>"); 4. localStorage cleared → opening the editor restores the drafts from the server and says so; 5. a newer server copy over a browser
   copy with content is never applied silently: both are offered; 6. with the server copy unavailable the editor says "Server copy not available — drafts are only in this browser".
   Usage: node tests/mission-editor-drafts-browser.cjs  (own static server on a free port; SITE_TEST_URL, SHOTS, BROWSER_EXECUTABLE optional) */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const shots=process.env.SHOTS||path.resolve(__dirname,'..','docs/development/mission-001');fs.mkdirSync(shots,{recursive:true});
const exe=process.env.BROWSER_EXECUTABLE||['/opt/pw-browsers/chromium','/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'].find(f=>fs.existsSync(f))||null;
function serve(){const root=path.resolve(__dirname,'..'),types={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.ogg':'audio/ogg','.png':'image/png'};
 const srv=http.createServer((req,res)=>{let f;try{f=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));}catch{res.writeHead(400);return res.end();}if(!f.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);return res.end();}res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(d);});});
 return new Promise(r=>srv.listen(0,'127.0.0.1',()=>r(srv)));}
(async()=>{
 const srv=process.env.SITE_TEST_URL?null:await serve(),base=process.env.SITE_TEST_URL||'http://127.0.0.1:'+srv.address().port;
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'],...(exe?{executablePath:exe}:{})});
 const store={record:null,on:true,posts:0};   // the mocked server's private draft "mission-editor-workspace"
 try{
  const ctx=await browser.newContext({viewport:{width:1366,height:768},serviceWorkers:'block'}),page=await ctx.newPage().then(async p=>{await p.addInitScript(()=>{try{if(!localStorage.getItem('mission-editor-view'))localStorage.setItem('mission-editor-view','form');}catch{}});return p;});page.setDefaultTimeout(240000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));await page.route('**/api/**',r=>r.fulfill({status:503,contentType:'application/json',body:'{}'}));
  await page.exposeFunction('__server',(p,body)=>{
   if(!store.on)return {status:503,error:'off'};
   if(p==='developer/drafts/schema')return {ok:{roles:{editor:true,draftsEnabled:true}}};
   if(p==='developer/drafts')return {ok:{drafts:store.record?[{id:'mission-editor-workspace',revision:store.record.revision}]:[]}};
   if(p==='developer/drafts/mission-editor-workspace'){
    if(!body)return store.record?{ok:store.record}:{status:404,error:'Draft not found.'};
    if(body.revision!==(store.record?store.record.revision:0))return {status:409,error:'Revision conflict.'};
    if(JSON.stringify(body.document).length>96000)return {status:413,error:'too big'};
    store.posts++;store.record={id:'mission-editor-workspace',revision:(store.record?store.record.revision:0)+1,document:body.document,updatedAt:Math.floor(Date.now()/1000)};return {ok:store.record};}
   return {status:404,error:'off in this test'};});
  const boot=()=>page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:120000});
  const developer=()=>page.evaluate(()=>VoidDevTools.identity(async(p,body)=>{if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1,preset:'NORMAL'};const r=await window.__server(p,body);if(r.ok)return r.ok;const e=new Error(r.error);e.status=r.status;throw e;}));
  const openEditor=async()=>{await developer();await page.evaluate(()=>VoidDevTools.open('missions'));await page.waitForSelector('[data-me-tree="main-storyline"]',{timeout:90000});};
  const listed=()=>page.locator('[data-me-tree="draft-awakening"]').count();
  await page.goto(base+'/void-runner.html');await boot();
  await page.evaluate(()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.realSaveMarker=true;localStorage.setItem('void-runner-campaign-v1',JSON.stringify({...s,savedAt:1700000000000}));});
  await page.reload();await boot();await openEditor();
  // 1. an empty tree, as the owner made it
  await page.locator('[data-me-new-tree]').click();await page.locator('[data-me-new-name]').fill('Awakening');await page.locator('[data-me-new-note]').fill('This starts as soon as new players enter The Darknet District from the Sleeping Pod');await page.locator('[data-me-create-tree]').click();
  await page.waitForSelector('[data-me-owner-tree="draft-awakening"]');assert.equal(await listed(),1);
  await page.waitForFunction(()=>VoidMissionEditor.serverCopy.state==='saved',null,{timeout:20000});
  assert.match(await page.locator('[data-me-server-copy]').innerText(),/^Saved on the server · /);assert.ok(store.record.document.data.bundle.trees.some(t=>t.id==='draft-awakening'&&!t.missions.length),'the empty tree is in the server copy');
  await page.screenshot({path:path.join(shots,'editor-server-copy-1366.png')});
  await page.reload();await boot();await openEditor();assert.equal(await listed(),1,'an empty tree survives a reload');
  // 2. PLAY THIS DRAFT + LEAVE DRAFT
  await page.evaluate(()=>{try{VoidGraphics.quality='low';VoidBabylon.setQuality('low');}catch{}});
  await page.locator('[data-me-tree="main-storyline"]').click();await page.locator('[data-me-play="tree:m001-awakening#speak"]').click();
  await page.waitForFunction(()=>!document.getElementById('dev-test-banner').hidden&&mode==='walking',null,{timeout:240000});
  await Promise.all([page.waitForNavigation({timeout:60000}),page.locator('#dev-test-banner button').click()]);await boot();await openEditor();
  assert.equal(await listed(),1,'and after a draft play and LEAVE DRAFT');
  // 3/4. the browser is cleared: the drafts come back from the server copy
  await page.waitForFunction(()=>['saved'].includes(VoidMissionEditor.serverCopy.state),null,{timeout:20000});
  await page.evaluate(()=>localStorage.clear());await page.reload();await boot();await openEditor();
  assert.equal(await listed(),1,'restored from the server after the browser was cleared');
  assert.match(await page.locator('#me-status').innerText(),/Restored your drafts from the server/);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('mission-editor-drafts-v1')).trees.find(t=>t.id==='draft-awakening').note),'This starts as soon as new players enter The Darknet District from the Sleeping Pod');
  await page.screenshot({path:path.join(shots,'editor-restored-1366.png')});
  // 5. a newer server copy over a browser copy with content: both are offered, nothing is overwritten
  const b=JSON.parse(JSON.stringify(store.record.document.data.bundle));b.trees.push({id:'draft-from-elsewhere',name:'From another computer',note:'',missions:[]});b.savedAt=new Date(Date.now()+60000).toISOString();
  store.record={...store.record,revision:store.record.revision+1,document:{...store.record.document,data:{...store.record.document.data,bundle:b}}};
  await page.reload();await boot();await openEditor();await page.waitForSelector('[data-me-conflict]');
  assert.equal(await listed(),1,'the browser copy is still shown');assert.equal(await page.locator('[data-me-tree="draft-from-elsewhere"]').count(),0,'the server copy is not applied silently');
  const before=store.posts;await page.waitForTimeout(6500);assert.equal(store.posts,before,'and is not overwritten either');
  await page.screenshot({path:path.join(shots,'editor-two-copies-1366.png')});
  await page.locator('[data-me-use-server]').click();await page.waitForSelector('[data-me-tree="draft-from-elsewhere"]');assert.equal(await listed(),1);
  // 6. the server copy switched off
  store.on=false;await page.reload();await boot();await openEditor();
  assert.equal(await page.locator('[data-me-server-copy]').innerText(),'Server copy not available — drafts are only in this browser');assert.equal(await listed(),1,'the browser copy still works');
  assert.deepEqual(errors,[],'no page errors');
  console.log('mission editor drafts browser test passed; screenshots in',shots);
 }finally{await browser.close();if(srv)srv.close();}
})().catch(e=>{console.error(String(e.stack||e).slice(0,1500));process.exit(1);});
