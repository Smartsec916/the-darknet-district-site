const assert=require('node:assert/strict');
const path=require('node:path');
const {chromium,firefox}=require('playwright');
const assets=path.join(__dirname,'../void-runner');
(async()=>{
 for(const [name,engine,options] of [['Chromium',chromium,process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}],['Firefox',firefox,{}]]){
  const browser=await engine.launch(options);
  try{
   const page=await browser.newPage({viewport:{width:1440,height:960}});
   await page.route('http://studio.test/',route=>route.fulfill({contentType:'text/html',body:'<main></main>'}));
   await page.goto('http://studio.test/');
   const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
   for(const module of ['balance-data','balance','equipment-profiles','ships','progression','ordnance','cockpit-math','missiles','consumable-spec','consumables','consumable-renderer','consumable-curves','equipment-studio','item-catalog-editor'])await page.addScriptTag({path:path.join(assets,module+'.js')});
   await page.addStyleTag({path:path.join(assets,'consumable-studio.css')});
   await page.evaluate(()=>{
    window.stateFixture={values:{...VoidBalance.defaults},profiles:{},revision:1,preset:'NORMAL'};
    const tools={authorized:true,uid:'fixture',receive(data){window.received=data;},request:async(path,body)=>{
     if(path==='developer/items')return {draft:{revision:0},live:{content:VoidConsumables.seed()},state:{version:1}};
     assertPath(path);if(body){if(body.revision!==stateFixture.revision)throw Error('Revision conflict');stateFixture={...structuredClone(body),revision:body.revision+1};}return structuredClone(stateFixture);
    }};
    function assertPath(p){if(p!=='developer/balance')throw Error(p);}
    VoidItemCatalogEditor.mount(document.querySelector('main'),tools);
   });
   await page.getByRole('button',{name:'Combat & Equipment',exact:true}).click();
   const open=()=>page.getByRole('button',{name:'Open Combat & Equipment Studio'}).click();
   await open();const dialog=page.getByRole('dialog'),plot=dialog.locator('canvas');
   await dialog.getByRole('button',{name:'Play',exact:true}).click();
   await page.waitForFunction(()=>/Hit|Miss/.test(document.querySelector('[data-readout]').textContent));
   await dialog.locator('details[data-group="Guidance"] summary').click();
   const rect=await plot.boundingBox(),x=rect.x+(78+160*Math.log10(3.6)/Math.log10(11))*rect.width/640,y=rect.y+282*rect.height/340;
   await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+30,y,{steps:3});await page.mouse.up();
   assert.notEqual(await dialog.locator('[data-stat=missileM1TurnRate]').inputValue(),'2.6');
   await dialog.getByRole('button',{name:'Undo',exact:true}).click();
   assert.equal(await dialog.locator('[data-stat=missileM1TurnRate]').inputValue(),'2.6');
   await dialog.locator('[data-item]').selectOption('aegis');await dialog.locator('[data-group=Defense] summary').click();
   await dialog.locator('[data-stat=premiumShield]').fill('84');await dialog.locator('[data-stat=premiumShield]').press('Tab');
   await dialog.getByRole('button',{name:'Apply 20 damage'}).click();assert.match(await dialog.locator('[data-readout]').innerText(),/4.0 s/);
   await dialog.getByRole('button',{name:'Add point'}).click();await dialog.locator('[data-y]').fill('75');await dialog.locator('[data-y]').press('Tab');
   await dialog.getByRole('button',{name:'Save local draft'}).click();
   assert.equal(await page.evaluate(()=>stateFixture.values.premiumShield),70);
   if(process.env.EQUIPMENT_SCREENSHOTS)await dialog.screenshot({path:path.join(process.env.EQUIPMENT_SCREENSHOTS,'equipment-shield-'+name+'.png')});
   await dialog.getByRole('button',{name:'Close',exact:true}).click();await open();
   await dialog.locator('[data-item]').selectOption('aegis');assert.equal(await dialog.locator('[data-stat=premiumShield]').inputValue(),'84');
   await dialog.getByText('Equipment presets and project files',{exact:true}).click();const downloadPromise=page.waitForEvent('download');await dialog.getByRole('button',{name:'Export project'}).click();const file=await downloadPromise;
   const chunks=[];for await(const c of await file.createReadStream())chunks.push(c);const bytes=Buffer.concat(chunks),doc=JSON.parse(bytes);assert.deepEqual(doc.profiles.aegis.rechargeCurve.points,[[0,1],[.5,.75],[1,1]]);
   doc.values.premiumShield=86;await dialog.locator('[data-import-equipment]').setInputFiles({name:'gear.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(doc))});
   await page.waitForFunction(()=>document.querySelector('[data-stat=premiumShield]').value==='86');
   await dialog.getByRole('button',{name:'Publish tuning'}).click();await page.waitForFunction(()=>window.received?.revision===2);assert.equal(await page.evaluate(()=>stateFixture.values.premiumShield),86);
   await dialog.locator('[data-item]').selectOption('m2');await dialog.locator('[data-moving]').selectOption('12');await dialog.locator('[data-cone]').check();
   if(process.env.EQUIPMENT_SCREENSHOTS)await dialog.screenshot({path:path.join(process.env.EQUIPMENT_SCREENSHOTS,'equipment-flight-'+name+'.png')});
   await page.evaluate(()=>stateFixture.revision++);await dialog.getByRole('button',{name:'Publish tuning'}).click();await page.waitForFunction(()=>document.querySelector('[data-report]').textContent.includes('Revision conflict'));
   assert.equal(await page.evaluate(()=>VoidBalance.values.premiumShield),70);assert.deepEqual(errors,[]);
   console.log(name+' equipment editing, flight playback, pointer edits, curves, undo, draft, import/export, publish and conflict passed');
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
