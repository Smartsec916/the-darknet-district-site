/* Developer Studio in a real browser with a STUBBED sign-in (no Firebase, no network): the page must stay locked unless the server confirms an administrator, then the working tools must work.
   The real server-side authorization is tested in tests/test_content_admin.py; this checks what the page does with the server's answer. Usage: node tests/studio-browser.cjs [chromium|firefox]  (SHOTS=dir) */
const pw=require('playwright'),assert=require('node:assert/strict');
const name=process.argv[2]==='firefox'?'firefox':'chromium',base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shots=process.env.SHOTS||'/tmp';
const STUB="export const auth={};export const provider={};export const onAuthStateChanged=(a,cb)=>{setTimeout(()=>cb({email:'dev@example.test',getIdToken:async()=>'stub-token'}),0);return()=>{}};export const signInWithPopup=async()=>{};export const signOut=async()=>{};";
async function open(browser,status,extra=0){
 const ctx=await browser.newContext({viewport:{width:1400,height:900},acceptDownloads:true}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/firebase-auth.js',r=>r.fulfill({contentType:'text/javascript',body:STUB}));
 await page.route('**/developer/content',r=>r.fulfill({status,contentType:'application/json',body:JSON.stringify({missions:[{id:'a'}],characters:[{id:'b'}],lines:[]})}));
 await page.goto(base+'/admin/studio.html');return {ctx,page,errors};
}
(async()=>{
 const browser=await pw[name].launch(name==='chromium'?{args:['--no-sandbox']}:{});
 try{
  // an ordinary player / non-admin: the server says no, the Studio stays locked
  for(const code of [401,403]){const {ctx,page,errors}=await open(browser,code);await page.waitForFunction(()=>/stays locked/.test(document.getElementById('status').textContent));assert.equal(await page.isHidden('#studio'),true,code+': locked');assert.equal(await page.locator('#tabs button').count(),0,'no tools are drawn for a non-admin');assert.deepEqual(errors,[]);await ctx.close();}
  const {ctx,page,errors}=await open(browser,200);await page.waitForSelector('#studio:not([hidden])');
  assert.equal(await page.locator('#tabs button').count(),12);const tabs=await page.locator('#tabs button').allTextContents();assert.ok(/Dashboard.*WORKING/.test(tabs[0])&&/Characters.*PLANNED/.test(tabs[4])&&/NPCs.*PARTIAL/.test(tabs[2]),tabs.join(' | '));
  await page.screenshot({path:shots+'/studio-dashboard.png'});assert.match(await page.textContent('#panel'),/every mission can be reached and finished/);
  // Missions: pick, edit, see validation react, flowchart, preview, draft persistence, export
  await page.click('#tabs button:has-text("Missions")');await page.click('.list button:has-text("DISTRICT ERRAND")');
  assert.equal(await page.locator('svg.flow g').count(),6,'the mission-flow view shows six missions');assert.match(await page.textContent('#mission-side'),/No problems found/);assert.match(await page.textContent('#mission-side'),/All 6 missions complete/);
  await page.screenshot({path:shots+'/studio-missions.png',fullPage:true});
  const reward=page.locator('label:has-text("Reward (credits)") input');await reward.fill('150');assert.match(await page.textContent('#mission-side'),/rewards: 100 → 150/);
  // an invalid edit is caught live: an unknown prerequisite via the objective event
  await page.selectOption('table tr:nth-child(2) select','');assert.match(await page.textContent('#mission-side'),/No completion event/);
  await page.selectOption('table tr:nth-child(2) select','visit-bar');assert.doesNotMatch(await page.textContent('#mission-side'),/Unknown completion event/);
  await page.locator('table tr:nth-child(4) td:nth-child(4) input').fill('ghost');await page.locator('table tr:nth-child(4) td:nth-child(4) input').blur();assert.match(await page.textContent('#mission-side'),/Requires "ghost"/);assert.match(await page.textContent('#mission-side'),/STUCK|cannot finish/i);
  await page.locator('table tr:nth-child(4) td:nth-child(4) input').fill('bar,shop');await page.locator('table tr:nth-child(4) td:nth-child(4) input').blur();assert.match(await page.textContent('#mission-side'),/No problems found/);
  // new mission, chain, validation of its objective
  await page.click('button:has-text("+ New mission")');assert.equal(await page.locator('svg.flow g').count(),7);assert.equal(await page.locator('#mission-side .issue.error').count(),0,'a new mission has no errors');assert.match(await page.textContent('#mission-side'),/No description/,'but the missing description is a warning');
  // persistence: reload keeps the local draft
  await page.reload();await page.waitForSelector('#studio:not([hidden])');await page.click('#tabs button:has-text("Missions")');assert.equal(await page.locator('.list button').count(),7+1,'the draft (7 missions + the New button) survives a reload');
  const [dl]=await Promise.all([page.waitForEvent('download'),page.click('button:has-text("Export draft JSON")')]);const text=require('fs').readFileSync(await dl.path(),'utf8'),ex=JSON.parse(text);assert.equal(ex.status,'DRAFT · not published');assert.ok(ex.changes.some(c=>/rewards: 100 → 150/.test(c)));assert.equal(ex.missions.length,7);
  assert.equal(await page.isDisabled('button:has-text("Publish to the live game")'),true,'publishing is disabled');
  await page.click('button:has-text("Revert to shipped")').catch(()=>{});
  // Dialogue
  page.once('dialog',d=>d.accept());await page.click('button:has-text("Revert to shipped")');await page.waitForTimeout(300);
  await page.click('#tabs button:has-text("Dialogue")');await page.click('.list button:has-text("DISTRICT ERRAND")');assert.match(await page.textContent('#panel'),/Too soon/);assert.ok(await page.locator('.dn.early').count()>=1,'the too-soon branch is drawn');
  await page.screenshot({path:shots+'/studio-dialogue.png',fullPage:true});
  const sp=page.locator('select').first();await sp.selectOption({index:0});assert.match(await page.textContent('#panel'),/No missing links/);
  // NPCs, Locations, planned tabs, settings
  await page.click('#tabs button:has-text("NPCs")');assert.match(await page.textContent('#panel'),/Admin/);assert.match(await page.textContent('#panel'),/Iris/);await page.screenshot({path:shots+'/studio-npcs.png'});
  await page.click('#tabs button:has-text("Locations")');assert.match(await page.textContent('#panel'),/district-iris/);assert.match(await page.textContent('#panel'),/first-ship \/ claim/);
  for(const t of ['Characters','Animations','Asset Library','Stores','Factions','Social']){await page.click('#tabs button:has-text("'+t+'")');assert.match(await page.textContent('#panel'),/PLANNED — not built/,t);assert.equal(await page.locator('#panel button').count(),0,t+' offers no fake controls');}
  await page.click('#tabs button:has-text("Settings")');assert.match(await page.textContent('#panel'),/Publishing is disabled/);assert.match(await page.textContent('#panel'),/NOT READY — Rollback/);await page.screenshot({path:shots+'/studio-settings.png'});
  assert.deepEqual(errors,[]);console.log(JSON.stringify({browser:name,version:browser.version(),errors}));await ctx.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
