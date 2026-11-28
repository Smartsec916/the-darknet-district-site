const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXECUTABLE });
  try {
    const page = await browser.newPage({viewport:{width:360,height:780},isMobile:true,hasTouch:true,serviceWorkers:'block'});
    const origin = 'https://phone.test';
    let saved;
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route(origin+'/**', route => {
      let pathname = new URL(route.request().url()).pathname;
      if (pathname.endsWith('/')) pathname += 'index.html';
      if (pathname === '/firebase-auth.js') return route.fulfill({contentType:'text/javascript',body:
        "export const auth={},provider={},signOut=()=>{},signInWithPopup=()=>{},onAuthStateChanged=(_,cb)=>cb({uid:'tester',getIdToken:async()=>'fixture'});"});
      const file = path.join(__dirname,'..',pathname);
      return route.fulfill({body:fs.readFileSync(file),contentType:({'.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.html':'text/html'})[path.extname(file)]||'application/octet-stream'});
    });
    await page.route('https://the-darknet-district-site.onrender.com/**', route => {
      const url = route.request().url(), post = route.request().postDataJSON();
      if (url.endsWith('/schema')) return route.fulfill({json:{roles:{editor:true,draftsEnabled:true}}});
      if (url.endsWith('/developer/content')) return route.fulfill({json:{missionEditor:{places:['district-store'],givers:{}}}});
      if (url.endsWith('/mission-editor-workspace')) return route.fulfill({status:404,json:{}});
      if (url.endsWith('/voice-clips')) return route.fulfill({json:{missing:[]}});
      assert.ok(url.endsWith('/developer/chance-encounters'));
      if (!post) return route.fulfill({json:{encounters:saved?[saved]:[]}});
      assert.equal(post.action,'save');
      saved={id:post.id,revision:post.revision+1,draft:post.graph};
      return route.fulfill({json:saved});
    });
    await page.goto(origin+'/dev-tools-mobile/#encounters');
    const name = page.getByLabel('Name',{exact:true});
    const picker = page.getByLabel('Select an encounter');
    assert.equal(await picker.inputValue(), '');
    assert.equal(await name.count(), 0);
    await picker.selectOption({label:'Pleasure Breach'});
    await page.getByText(/^Dialogue \(\d+ slots\)$/).click();
    assert.ok(await page.getByLabel('Spoken line',{exact:true}).count()>0);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth));
    assert.equal(await page.getByRole('button',{name:'Publish',exact:true}).count(),0);
    await page.getByRole('button',{name:'Duplicate',exact:true}).click();
    await name.fill('Phone draft');
    await page.getByText('Eligibility and repeat visits',{exact:true}).click();
    const dailyLimit=page.getByLabel('Maximum occurrences per game day (0 = unlimited, 0.5 = every other day)',{exact:true});
    await dailyLimit.fill('0.5');
    await page.getByLabel('Chance (%)',{exact:true}).fill('37');
    await page.getByRole('button',{name:'Save draft',exact:true}).click();
    await page.getByText('Saved draft',{exact:true}).waitFor();
    assert.equal(saved.draft.conditions.chance,37);
    assert.equal(saved.draft.conditions.dailyLimit,0.5);
    await page.reload();
    assert.equal(await picker.inputValue(), '');
    assert.equal(await name.count(), 0);
    await picker.selectOption(saved.id);
    assert.equal(await name.inputValue(),'Phone draft');
    assert.deepEqual(errors,[]);
    console.log('Phone encounter editing, dialogue, touch layout, saving and reopening passed.');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
