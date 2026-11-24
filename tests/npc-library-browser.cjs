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
   await VoidDevTools.identity(async p=>{if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1,preset:'NORMAL'};throw Object.assign(Error('Offline'),{status:404});},{uid:'npc-library-test'});
   VoidDevTools.open('npcs');
  });
  const library=page.getByRole('button',{name:'NPC Library',exact:true});
  await library.click();
  const before=await page.evaluate(()=>VoidNPCEditor.imports.length);
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
  assert.equal(await page.evaluate(()=>VoidNPCEditor.imports.length),before+2);
  await library.click();
  const pinky=page.locator('article').filter({has:page.getByRole('heading',{name:'Pinky',exact:true})});
  await pinky.getByRole('button',{name:'Assign to world draft'}).click();
  await page.locator('[data-npc-make-name]').waitFor();
  assert.equal(await page.locator('[data-npc-make-name]').inputValue(),'Pinky');
  await page.locator('[data-npc-make-next]').click();
  await page.waitForFunction(()=>Object.values(VoidMissionEditor.shared.local().characters||{}).some(c=>c.name==='Pinky'&&c.model==='npc-lib-0f8c22aa'));
  await library.click();await pinky.getByRole('button',{name:'Edit / preview'}).click();
  await page.locator('[data-npc-import-delete]').click();await page.getByText(/A world or draft reference uses this asset/).waitFor();
  if(process.env.NPC_LIBRARY_FOLDER){
   await page.locator('[data-npc-preview-go]').click();
   await page.waitForFunction(()=>VoidNPCEditor.ui.preview?.clips?.length===26);
   await library.click();
   const folder=page.getByLabel('Prepared library folder'),panel=page.locator('details').filter({has:folder});
   await panel.locator('summary').click();
   await folder.setInputFiles(path.resolve(process.env.NPC_LIBRARY_FOLDER));
   await page.getByRole('button',{name:'Import prepared folder'}).click();
   await page.waitForFunction(()=>VoidNPCEditor.imports.length>=25);
   await page.getByRole('button',{name:'Compare in 3D'}).waitFor();
   if(process.env.NPC_MOTION_FOLDER){
    if(!await panel.evaluate(p=>p.open))await panel.locator('summary').click();
    await folder.setInputFiles(path.resolve(process.env.NPC_MOTION_FOLDER));
    await page.getByRole('button',{name:'Import prepared folder'}).click();
    await page.getByText(/^[1-9]\d* motions imported/).waitFor();
   }
   const choices=page.getByLabel('Comparison model 1');
   await choices.selectOption({label:'Pinky'});await page.getByLabel('Comparison model 2').selectOption({label:'Orin Static'});
   await page.getByRole('button',{name:'Compare in 3D'}).click();
   await page.getByLabel('Animation for Pinky').selectOption({label:'walk'});
   await page.getByLabel('Animation for Orin Static').selectOption({label:'sit'});
   if(process.env.NPC_MOTION_FOLDER){
    const pane=page.getByLabel('Shared motion for Pinky').locator('..');
    await pane.getByRole('button',{name:'Test shared motion'}).click();
    const note=pane.getByRole('status');
    await page.waitForFunction(el=>el.textContent.length>0,await note.elementHandle());
    assert.match(await note.innerText(),/^Playing /);
   }
   console.log('PASS: prepared folder import and simultaneous Babylon animation previews');
  }
  console.log('PASS: import, stable rename, duplicate evidence, archive/restore, unchanged world draft, referenced delete refused, registered model assigned to world draft');
 }finally{await browser?.close();server.closeAllConnections();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
