const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const identity=`export const auth={currentUser:null},provider={};let listener;export function onAuthStateChanged(a,fn){listener=fn;queueMicrotask(()=>fn(null));return ()=>{};}export async function getRedirectResult(){}export async function signInWithPopup(){auth.currentUser={uid:'test-pilot',displayName:'Test Pilot',getIdToken:async()=> 'test-pilot'};listener(auth.currentUser);}export async function signOut(){auth.currentUser=null;listener(null);}`;
 let cloud=null,revision=0;
 await page.route('**/firebase-auth.js',r=>r.fulfill({contentType:'text/javascript',body:identity}));
 await page.route('**/api/void-runner/**',async r=>{
  const action=r.request().url().split('/').pop();let body;
  if(action==='account')body={owned:[],revision,save:cloud,savedAt:cloud?.savedAt};
  else if(action==='save'){const data=r.request().postDataJSON();assert.equal(data.revision,revision);cloud=data.save;revision++;body={revision,savedAt:Date.now()};}
  else if(action==='catalog')body={products:[]};else body={values:{},revision:0};
  await r.fulfill({contentType:'application/json',body:JSON.stringify(body)});
 });
 try{
  await page.goto('http://127.0.0.1:5187/void-runner.html');await page.waitForFunction(()=>VoidStartup.started&&VoidAccount.request);
  await page.evaluate(()=>{
   state=C.fresh();state.location='vesper';Object.assign(state.progression.opening,{hologram:true,pistol:true,cans:[0,1,2,3]});
   state.progression.personal.weapon='ward-pistol';state.progression.personal.ammo=10;P.repairOpening(state);state.credits=765;save();
  });
  await page.locator('[data-action="menu-account"]').click();await page.locator('[data-action="sign-in"]').click();await page.waitForFunction(()=>VoidAccount.user&&!VoidAccount.busy);
  await page.locator('[data-action="cloud-save-prompt"]').click();await page.locator('[data-action="cloud-save"]').click();await page.waitForFunction(()=>!VoidAccount.busy);
  assert.equal(cloud.progression.personal.ammo,10);assert.equal(cloud.progression.flags.shootingTutorialComplete,true);assert.equal(cloud.credits,765);
  await page.locator('[data-action="account-main-menu"]').click();const local=await page.evaluate(()=>localStorage.getItem(SAVE_KEY));
  await page.locator('[data-action="menu-logout"]').click();await page.waitForFunction(()=>!VoidAccount.user&&!VoidAccount.busy);
  assert.equal(await page.evaluate(()=>localStorage.getItem(SAVE_KEY)),local);
  await page.locator('[data-action="menu-account"]').click();await page.locator('[data-action="sign-in"]').click();await page.waitForFunction(()=>VoidAccount.user&&!VoidAccount.busy&&VoidAccount.cloud);
  await page.locator('[data-action="cloud-load-prompt"]').click();await page.locator('[data-action="cloud-load"]').click();
  assert.equal(await page.evaluate(()=>state.credits),765);assert.equal(await page.evaluate(()=>VoidOpening.next(state)),'handoff');
  await page.locator('[data-action="account-main-menu"]').click();await page.locator('[data-action="menu-campaign"]').click();await page.locator('[data-action="menu-new"]').click();
  assert.equal(await page.locator('[data-action="menu-new-confirm"]').count(),1);assert.equal(await page.evaluate(()=>state.credits),765);
  await page.locator('[data-action="menu-back"]').click();assert.equal(await page.evaluate(()=>state.credits),765);
  assert.deepEqual(errors,[]);console.log('PASS simulated identity login/logout, local continuity, manual cloud copy/restore, ten-round magazine, tutorial continuity, new-Campaign overwrite confirmation.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
