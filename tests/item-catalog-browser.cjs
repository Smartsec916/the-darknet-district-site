const assert=require('node:assert/strict');
const {chromium,firefox}=require('playwright');
const path=require('node:path');
const dir=path.resolve(__dirname,'..');
(async()=>{
 for(const [name,engine,opts] of [['Chromium',chromium,process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}],['Firefox',firefox,{}]]){
  const b=await engine.launch(opts);
  try{
   const p=await b.newPage();p.setDefaultTimeout(10000);p.on('dialog',d=>d.accept());const errors=[];p.on('pageerror',err=>errors.push(err.message));
   await p.setContent('<main></main>');for(const f of ['consumable-spec','consumables','item-catalog-editor'])await p.addScriptTag({path:path.join(dir,'void-runner',f+'.js')});
   await p.evaluate(()=>{const original=VoidConsumables.seed();const state={draft:{revision:0,content:null},live:{content:original},state:{version:0,history:[]}};window.catalogFixture=state;
    const cloned=()=>structuredClone(state);
    const tools={uid:'catalog-fixture',authorized:true,request:async(path,body)=>{
     if(path==='developer/items')return cloned();
     if(path.endsWith('/draft')){if(body.revision!==state.draft.revision)throw Error('Draft conflict');state.draft={content:structuredClone(body.content),revision:body.revision+1};return {revision:state.draft.revision,problems:VoidConsumables.problems(body.content)};}
     if(path.endsWith('/publish')){if(body.expected!==state.state.version)throw Error('Live version conflict');state.state.version++;state.state.history.push({version:state.state.version});state.live={content:structuredClone(state.draft.content)};return {version:state.state.version};}throw Error(path);
    }};VoidItemCatalogEditor.mount(document.querySelector('main'),tools);
   });
   await p.getByLabel('New item ID').fill('district-espresso');await p.getByRole('button',{name:'Create item',exact:true}).click();
   await p.getByLabel('Name',{exact:true}).fill('District Espresso');await p.getByLabel('Base price').fill('23');
   const kiosk=p.locator('[data-seller=kiosk-entrance]');await kiosk.locator('[data-assigned]').check();await kiosk.getByLabel('Vendor price').fill('18');
   await p.getByLabel('Base price').fill('31');await p.locator('[data-field=status]').selectOption('published');
   await p.getByRole('button',{name:'Save draft',exact:true}).click();await p.waitForFunction(()=>catalogFixture.draft.revision===1);
   const result=await p.evaluate(()=>{const c=catalogFixture.draft.content;return [c.items.find(i=>i.id==='district-espresso').price,c.vendors.find(v=>v.id==='kiosk-entrance').entries.find(e=>e.item==='district-espresso').price,VoidConsumables.problems(c),catalogFixture.live.content.items.length];});assert.deepEqual(result,[31,18,[],2]);
   await p.getByRole('button',{name:'Publish draft',exact:true}).click();await p.waitForFunction(()=>catalogFixture.state.version===1);
   await p.getByLabel('Search',{exact:true}).fill('espresso');assert.equal(await p.locator('[data-picker] option').count(),2);
   await p.getByRole('button',{name:'Duplicate selected'}).click();await p.getByRole('button',{name:'Save draft',exact:true}).click();
   assert.equal(await p.evaluate(()=>catalogFixture.draft.content.items.length),4);assert.deepEqual(errors,[]);
   console.log(name,'passed item creation, independent kiosk price, saved draft, publish, search and duplication');
  }finally{await b.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
