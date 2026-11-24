'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
(async()=>{
 const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
  fs.readFile(file,(err,b)=>{if(err)return res.writeHead(404).end();res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':'application/octet-stream');res.end(b);});
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  const {open}=await import('../void-runner/rig-workshop.mjs'),{GLB}=await import('../void-runner/rig-motion.mjs');
  const model=await open(new Blob([fs.readFileSync(process.env.RIG_BROWSER_MODEL||path.join(root,'void-runner/assets/models/crowd/vr-companion-f.glb'))]));
  model.json.animations=[];const testFile={name:'Rig test.glb',mimeType:'model/gltf-binary',buffer:Buffer.from(GLB.write(model.json,model.binary))};
  browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage({serviceWorkers:'block'}),base='http://127.0.0.1:'+server.address().port;
  page.setDefaultTimeout(60000);
  await page.route('https://**/*',r=>r.abort());
  await page.route('**/firebase-auth.js',r=>r.fulfill({contentType:'text/javascript',body:"export const auth={currentUser:{uid:'rig-test',getIdToken:async()=>''}},provider={},getRedirectResult=async()=>{},signInWithPopup=async()=>{},signInWithRedirect=async()=>{},signOut=async()=>{},onAuthStateChanged=(a,fn)=>fn(a.currentUser);"}));
  await page.route('**/api/void-runner/developer/balance',r=>r.fulfill({json:{values:{},revision:1}}));
  for(const editor of ['companion','npc']){
   if(editor==='companion'){
    await page.goto(base+'/vr-companion-studio.html');await page.getByRole('button',{name:'Auto-Fix All',exact:true}).waitFor();
    await page.locator('input[type=file][accept*=".glb"]').first().setInputFiles(testFile);
   }else{
    await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:180000});
    await page.evaluate(async()=>{await VoidDevTools.identity(async p=>{if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1};throw Error('offline');},{uid:'rig-test'});VoidDevTools.open('npcs');});
    const picked=page.waitForEvent('filechooser');await page.locator('[data-npc-start-card=import]').click();await (await picked).setFiles(testFile);
   }
   console.log('Testing',editor);await page.getByRole('button',{name:'Auto-Fix All',exact:true}).click();
   await page.getByRole('status').filter({hasText:'Added sit-exit'}).waitFor();
   await page.getByRole('button',{name:'Preview repaired character'}).click();
   await page.getByLabel('Repaired animation').selectOption('walk');
   const displacement=await page.evaluate(async()=>{
    const scene=BABYLON.Engine.LastCreatedScene,g=scene.animationGroups.find(g=>g.name==='walk'||g.name.endsWith('-walk'));
    const mesh=scene.meshes.find(m=>m.skeleton&&m.getVerticesData(BABYLON.VertexBuffer.MatricesWeightsKind));
    async function sample(frame){g.goToFrame(frame);await new Promise(requestAnimationFrame);scene.render();mesh.skeleton.prepare(true);return Array.from(mesh.skeleton.getTransformMatrices(mesh));}
    g.pause();const a=await sample(g.from),b=await sample(g.from+(g.to-g.from)*.25);return Math.max(...a.map((v,i)=>Math.abs(v-b[i])));
   });assert.ok(displacement>.01,editor+' animated skeleton matrix variation '+displacement);
   await page.getByRole('button',{name:'Undo rig repair'}).click();
   console.log('PASS',editor,'Babylon animated skin matrix delta',displacement);
  }
 }finally{await browser?.close();server.closeAllConnections();server.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});
