/* Run against a local test build, optionally with BROWSER_EXECUTABLE and SITE_TEST_URL. */
'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const root=path.resolve(__dirname,'..');
(async()=>{
 const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404).end();return;}
   res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.wasm':'application/wasm'})[path.extname(file)]||'application/octet-stream');res.end(data);});
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let browser;
 try{
  browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({viewport:{width:1366,height:900},serviceWorkers:'block'});
  page.setDefaultTimeout(45000);
  await page.route('https://**/*',r=>r.abort());
  await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline'}));
  await page.route('**/api/**',r=>r.fulfill({status:404,contentType:'application/json',body:'{"error":"offline"}'}));
  await page.goto('http://127.0.0.1:'+server.address().port+'/void-runner.html');
  await page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:180000});
  await page.evaluate(async()=>{
   await VoidDevTools.identity(async p=>{if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1,preset:'NORMAL'};throw Object.assign(Error('Offline'),{status:404});});
   VoidDevTools.open('npcs');
  });
  const library=page.getByRole('button',{name:'NPC Library',exact:true});
  await library.click();
  const draft=await page.evaluate(()=>JSON.stringify(VoidMissionEditor.shared.local()));
  const picked=page.waitForEvent('filechooser');
  await page.getByRole('button',{name:'Import model or companion package'}).click();
  await (await picked).setFiles(path.join(root,'void-runner/assets/models/crowd/vr-companion-f.glb'));
  const name=page.locator('[data-npc-import-name]');
  await name.waitFor();
  const id=await name.getAttribute('data-npc-import-name');
  await name.fill('Library Test Actor');await name.press('Tab');
  await page.waitForFunction(()=>VoidNPCEditor.imports.some(r=>r.name==='Library Test Actor'));
  assert.equal(await name.getAttribute('data-npc-import-name'),id);
  await library.click();
  let row=page.locator('article').filter({has:page.getByRole('heading',{name:'Library Test Actor',exact:true})});
  await row.getByRole('button',{name:'Duplicate'}).click();
  await page.getByRole('heading',{name:'Library Test Actor 2',exact:true}).waitFor();
  assert.equal(await page.getByText(/Identical model bytes/).count(),2);
  await row.getByRole('button',{name:'Archive',exact:true}).click();
  await row.getByRole('button',{name:'Restore'}).waitFor();
  await row.getByRole('button',{name:'Restore'}).click();
  await row.getByRole('button',{name:'Archive',exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>JSON.stringify(VoidMissionEditor.shared.local())),draft);
  await row.getByRole('button',{name:'Edit / preview'}).click();
  await page.evaluate(id=>{const d=VoidMissionEditor.shared.local();d.npcs={...d.npcs,[id]:{mode:'original'}};VoidMissionEditor.shared.saveLocal(d);},id);
  await page.locator('[data-npc-import-delete]').click();
  await page.getByText(/A world or draft reference uses this asset/).waitFor();
  assert.equal(await page.evaluate(()=>VoidNPCEditor.imports.length),2);
  console.log('PASS: import, stable rename, duplicate evidence, archive/restore, unchanged world draft, referenced delete refused');
 }finally{await browser?.close();server.closeAllConnections();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
