/* Run against python server.py. Firebase and payments are mocked; no real purchases. */
const {chromium}=require('playwright');const assert=require('node:assert/strict');const path=require('node:path');
const output=process.env.VOID_SCREENSHOT_DIR;const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error('Browser error:',e.message);});
 let cloud=null,revision=0,owned=[];
 await page.route('**/firebase-auth.js',r=>r.fulfill({contentType:'text/javascript',body:`export const auth={currentUser:null},provider={};let listener;const user={uid:'pilot',displayName:'Test Pilot',getIdToken:async()=> 'test-token'};export const onAuthStateChanged=(a,fn)=>{listener=fn;queueMicrotask(()=>fn(null));};export const getRedirectResult=async()=>null;export const signInWithPopup=async()=>{auth.currentUser=user;listener(user);return {user};};export const signInWithRedirect=signInWithPopup;export const signOut=async()=>{auth.currentUser=null;listener(null);};`}));
 await page.route('**/api/void-runner/**',async r=>{
   const p=new URL(r.request().url()).pathname;let body={};let status=200;
   if(p.endsWith('/catalog'))body={testMode:true,products:['wraith','aegis','ghost','sentinel'].map(id=>({id,amount:499,currency:'usd'}))};
   else if(p.endsWith('/account'))body={owned,save:cloud,revision};
   else if(p.endsWith('/save')){const data=r.request().postDataJSON();if(data.revision!==revision){status=409;body={error:'Cloud save changed on another device.'};}else{cloud=data.save;body={revision:++revision,savedAt:Date.now()/1000};}}
   else {status=503;body={error:'Checkout is disabled in browser tests.'};}
   await r.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
 });
 await page.goto('http://127.0.0.1:5000/void-runner.html#market');await page.waitForFunction(()=>window.VoidStartup?.started);
 assert.equal(await page.locator('#expansion-nav').isVisible(),false);
 await page.getByRole('button',{name:'MEET MARA →',exact:true}).click();assert((await page.locator('#spoken-text').textContent()).includes('Elias passed away'));
 await page.getByRole('button',{name:'NEXT →',exact:true}).click();assert((await page.locator('#spoken-text').textContent()).includes('The ship is yours'));
 await page.getByRole('button',{name:'NEXT →',exact:true}).click();await page.getByRole('button',{name:'BOARD SHIP →',exact:true}).click();
 await page.evaluate(()=>{elapsed=current.duration;spawned=resolved=current.enemies;enemies=[];approachTime=4;mode='play';arrive();});
 await page.getByRole('button',{name:'OPEN STATION MENU →',exact:true}).click();await page.getByRole('button',{name:'GO TO BAR →',exact:true}).click();await page.getByRole('button',{name:'ROOK · TALK',exact:true}).click();await page.getByRole('button',{name:'ACCEPT JOB →',exact:true}).click();
 assert.equal(await page.locator('#expansion-nav').isVisible(),false);
 await page.getByRole('button',{name:'LAUNCH →',exact:true}).click();
 await page.evaluate(()=>{elapsed=current.duration;spawned=resolved=current.enemies;enemies=[];approachTime=4;mode='play';arrive();});
 assert((await page.locator('#spoken-text').textContent()).includes('350 credits'));
 await page.getByRole('button',{name:'OPEN STATION MENU →',exact:true}).click();await page.getByRole('button',{name:'SIGN IN & SAVE PROGRESS',exact:true}).waitFor();
 if(output){fs.mkdirSync(output,{recursive:true});await page.screenshot({path:path.join(output,'first-delivery-offer.png'),fullPage:true});}
 await page.getByRole('button',{name:'KEEP PLAYING',exact:true}).click();assert.equal(await page.evaluate(()=>state.quest),'return');assert.equal(await page.evaluate(()=>state.credits),450);
 await page.locator('#expansion-nav [data-action="shop"]').click();assert.equal(await page.locator('.shop-placeholder').count(),2);assert.equal(await page.locator('[data-action^="buy:"],[data-action^="purchase:"]').count(),0);
 if(output)await page.screenshot({path:path.join(output,'credit-upgrades.png'),fullPage:true});
 await page.getByRole('button',{name:'CAMPAIGN',exact:true}).click();await page.locator('.mission-grid .card').last().waitFor();assert.equal(await page.locator('.mission-grid .card').count(),12);
 assert.equal(await page.getByRole('button',{name:'FINISH OPENING DELIVERIES'}).count(),12);
 await page.evaluate(()=>{state=C.fresh();state.quest='open';state.credits=1500;state.completed=2;save();campaignBoard();});
 await page.getByRole('button',{name:'ACCEPT MISSION',exact:true}).first().click();assert.equal(await page.evaluate(()=>state.contract),'belt-1');
 await page.getByRole('button',{name:'LAUNCH →',exact:true}).click();assert.equal(await page.evaluate(()=>current.kind),'salvage');
 await page.evaluate(()=>{mode='pause';}); // Deterministic simulation of collection and trial mechanics.
 const salvage=await page.evaluate(()=>{mode='play';missionObjects=[{x:0,y:0,z:3,kind:'salvage'}];cockpitMission(.01,{x:0,y:0,z:0});mode='pause';return objectiveCount;});assert.equal(salvage,1);
 await page.evaluate(()=>{state.contract=null;dock();market();});
 await page.evaluate(()=>{trialGear='aegis';launch();}); // Retained training engine, no public catalog offer.
 const trial=await page.evaluate(()=>{mode='pause';return {shield:shieldHP,stats:C.stats(state).shield,credits:state.credits};});assert.equal(trial.shield,70);assert.equal(trial.stats,70);
 const absorbed=await page.evaluate(()=>{mode='play';damageTime=0;hurt(25);mode='pause';return {hp,shieldHP};});assert.equal(absorbed.shieldHP,45);assert.equal(absorbed.hp,100);
 await page.getByRole('button',{name:'LEAVE TRAINING'}).click();assert.equal(await page.evaluate(()=>state.credits),trial.credits);assert.equal(await page.evaluate(()=>C.stats(state).shield),0);
 await page.getByRole('button',{name:'SIGN IN',exact:true}).click();await page.getByRole('button',{name:'SIGN IN WITH GOOGLE'}).click();
 await page.getByRole('button',{name:'SAVE THIS JOURNEY TO CLOUD'}).waitFor();await page.waitForFunction(()=>!window.VoidAccount.busy);
 await page.getByRole('button',{name:'SAVE THIS JOURNEY TO CLOUD'}).click();await page.getByRole('button',{name:'SAVE TO CLOUD',exact:true}).click();await page.waitForFunction(()=>!window.VoidAccount.busy);assert.equal(revision,1);
 await page.evaluate(()=>{state.credits=1;save();});await page.getByRole('button',{name:'LOAD CLOUD JOURNEY'}).click();await page.getByRole('button',{name:'LOAD CLOUD SAVE',exact:true}).click();assert.equal(await page.evaluate(()=>state.credits),1500);
 owned=['wraith','aegis','ghost','sentinel'];await page.getByRole('button',{name:'REFRESH / RESTORE PURCHASES'}).click();await page.waitForFunction(()=>!window.VoidAccount.busy);
 await page.locator('#expansion-nav [data-action="shop"]').click();await page.getByRole('button',{name:'EQUIP',exact:true}).nth(0).click();assert.equal(await page.evaluate(()=>C.stats(state).damage),3.6875);
 await page.locator('[aria-label="Previously owned equipment"] .card').nth(2).getByRole('button',{name:'EQUIP',exact:true}).click();await page.locator('[aria-label="Previously owned equipment"] .card').nth(3).getByRole('button',{name:'EQUIP',exact:true}).click();assert.equal(await page.evaluate(()=>state.loadout.utility),'sentinel');
 if(output){fs.mkdirSync(output,{recursive:true});await page.screenshot({path:path.join(output,'black-market-desktop.png'),fullPage:true});await page.getByRole('button',{name:'CAMPAIGN',exact:true}).click();await page.screenshot({path:path.join(output,'campaign-desktop.png'),fullPage:true});}
 // Boss phases, relay protection, and escort failure exercise the real update loop.
 const mechanics=await page.evaluate(()=>{
   state.cleared=VoidContent.missions.map(m=>m.id);state.loadout={weapon:null,shield:null,utility:null};state.contract='lockdown-2';launch();mode='play';spawnEnemy();spawnEnemy();const relay=enemies[0],targetEnemy=enemies[1];relay.z=60;targetEnemy.z=50;targetEnemy.x=5;targetEnemy.y=0;const before=targetEnemy.armor;
   bullets=[{x:5,y:0,z:50,previousZ:50,damage:100}];update(0);const protectedArmor=targetEnemy.armor;relay.dead=true;bullets=[{x:5,y:0,z:50,previousZ:50,damage:100}];update(0);const killed=targetEnemy.dead;
   state.contract='gate-4';launch();spawned=current.enemies-1;spawnEnemy();const boss=enemies[0];const bossExists=boss.boss&&boss.maxArmor>100;
   state.contract='belt-3';launch();escortHP=10;escortImpact({escort:true,x:0,y:2.4,damage:10});const escortFailed=mode==='over';
   state.contract=null;dock();return {before,protectedArmor,killed,bossExists,escortFailed};
 });assert.equal(mechanics.before,mechanics.protectedArmor);assert(mechanics.killed&&mechanics.bossExists&&mechanics.escortFailed);
 await page.getByRole('button',{name:'ACCOUNT',exact:true}).click();await page.getByRole('button',{name:'SIGN OUT',exact:true}).click();await page.waitForFunction(()=>!window.VoidAccount.busy);assert.equal(await page.evaluate(()=>ownedGear.length),0);
 if(output){for(const id of ['meridian','kepler','undertow','foundry']){await page.evaluate(async id=>{if(id!=='meridian'){const image=new Image();image.src='void-runner/art/concourse-'+id+'.png';await image.decode();}state.location=id;state.contract=null;dock();},id);await page.waitForFunction(()=>[...document.images].every(i=>i.complete));await page.screenshot({path:path.join(output,'station-'+id+'.png'),fullPage:true});}}
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{state.location='undertow';dock();});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 if(output)await page.screenshot({path:path.join(output,'station-mobile.png'),fullPage:true});
 await page.locator('#expansion-nav [data-action="shop"]').click();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 if(output)await page.screenshot({path:path.join(output,'credit-upgrades-mobile.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.locator('#expansion-nav [data-action="shop"]').click();
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 if(output)await page.screenshot({path:path.join(output,'black-market-mobile.png'),fullPage:true});
 await page.goto('http://127.0.0.1:5000/');await page.getByRole('button',{name:'Enter the District',exact:true}).click();await page.locator('.pilot-name').waitFor();assert.equal(await page.locator('.pilot-name').textContent(),'Test Pilot');
 await page.goto('http://127.0.0.1:5000/store-first-page.html');assert.equal(await page.getByRole('link',{name:/VOID\/\/RUNNER Equipment/}).getAttribute('href'),'void-runner.html#market');
 assert.deepEqual(errors,[]);console.log('Browser checks passed: missions, training, shields, account saves, inventory, equipment slots, boss, relay, escort, mobile layout, shared homepage login and store entry.');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
