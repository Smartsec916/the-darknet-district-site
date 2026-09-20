/* Browser regressions use mocked Firebase identity/API; no real purchases or cloud writes. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const defaults=require('../void-runner/balance.js').defaults;
(async()=>{
 const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'msedge'});
 const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 let admin=false,cloud={version:2,quest:'open',location:'undertow',credits:9800,reputation:25,completed:8,upgrades:{guns:3,armor:2,engines:2,shields:2},cleared:['belt-1'],contract:'ghost',creditGear:['scout'],loadout:{weapon:'wraith',shield:'aegis',utility:'scout'},loginOfferSeen:true},revision=3;
 const originalCloud=JSON.stringify(cloud);let balance={values:{...defaults},revision:0,preset:'NORMAL'};
 await page.route('**/firebase-auth.js',r=>r.fulfill({contentType:'text/javascript',body:`export const auth={currentUser:null},provider={};let listener;const user={uid:'pilot',displayName:'Test Pilot',getIdToken:async()=> 'test-token'};export const onAuthStateChanged=(a,fn)=>{listener=fn;queueMicrotask(()=>fn(null));};export const getRedirectResult=async()=>null;export const signInWithPopup=async()=>{auth.currentUser=user;listener(user);return {user};};export const signOut=async()=>{auth.currentUser=null;listener(null);};`}));
 await page.route('**/api/void-runner/**',async r=>{
  const p=new URL(r.request().url()).pathname;let body={},status=200;
  if(p.endsWith('/developer/balance')){if(!admin){status=403;body={error:'Not authorized'};}else{if(r.request().method()==='POST'){const d=r.request().postDataJSON();balance={...d,revision:balance.revision+1};}body=balance;}}
  else if(p.endsWith('/balance'))body={values:defaults};
  else if(p.endsWith('/catalog'))body={products:[],testMode:true};
  else if(p.endsWith('/account'))body={owned:['wraith','aegis'],save:cloud,revision};
  else if(p.endsWith('/save')){cloud=r.request().postDataJSON().save;body={revision:++revision};}
  await r.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
 });
 await page.goto('http://127.0.0.1:5000/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
 assert.equal(await page.locator('#dev-balance-open').isVisible(),false);
 const progress=JSON.parse(originalCloud);
 for(const signedIn of [false,true]){
  await page.evaluate(s=>{state=s;save();title();},progress);
  if(signedIn){await page.locator('#expansion-nav [data-action="account"]').click();await page.getByRole('button',{name:'SIGN IN WITH GOOGLE',exact:true}).click();await page.waitForFunction(()=>VoidAccount.user&&!VoidAccount.busy&&ownedGear.length===2);await page.evaluate(()=>title());}
  await page.getByRole('button',{name:'NEW JOURNEY',exact:true}).click();await page.getByRole('button',{name:'REPLACE SAVE',exact:true}).click();
  const reset=await page.evaluate(()=>({save:JSON.parse(localStorage.getItem(SAVE_KEY)),state,credits:$('credits').textContent,hp,shieldHP,current,owned:ownedGear}));
  assert.equal(reset.credits,'100');assert.equal(reset.state.credits,100);assert.equal(reset.save.credits,100);assert.equal(reset.state.reputation,undefined);assert.equal(reset.state.completed,0);assert.deepEqual(reset.state.cleared,[]);assert.equal(reset.state.contract,null);assert.equal(reset.current,null);assert.equal(reset.hp,100);assert.equal(reset.shieldHP,0);assert.equal(reset.owned.length,signedIn?2:0);assert.equal(JSON.stringify(cloud),originalCloud);
 }
 await page.reload();await page.waitForFunction(()=>window.VoidStartup?.started);assert.equal(await page.evaluate(()=>state.credits),100);
 // Explicit cloud load is the sole route back to the old campaign.
 await page.evaluate(()=>{state.completed=1;dock();});await page.locator('#expansion-nav [data-action="account"]').click();await page.getByRole('button',{name:'SIGN IN WITH GOOGLE',exact:true}).click();await page.waitForFunction(()=>VoidAccount.user&&!VoidAccount.busy);
 await page.getByRole('button',{name:'LOAD CLOUD JOURNEY',exact:true}).click();assert.equal(await page.evaluate(()=>state.credits),100);await page.getByRole('button',{name:'LOAD CLOUD SAVE',exact:true}).click();assert.equal(await page.evaluate(()=>state.credits),9800);
 // Real enemy fire produces a visible hostile object. A miss causes no damage.
 const combat=await page.evaluate(()=>{
  state=C.fresh();state.quest='legal-run';state.upgrades.shields=1;launch();spawnEnemy();const e=enemies[0];Object.assign(e,{x:0,y:0,z:70,fire:0,velocity:{x:0,y:0,z:0},passTime:10});update(.01);const fired=hostile.length>0;const before=hp;
  enemies=[];hostile=[{x:20,y:0,z:1,vx:0,vy:0,vz:-55,damage:10,life:3}];update(.04);const missed=hp===before&&shieldHP===15;
  hostile=[{x:0,y:0,z:1,vx:0,vy:0,vz:-55,damage:10,life:3}];update(.04);const shield=shieldHP;const shieldKind=VoidCombatEffects.kind;
  damageTime=0;hostile=[{x:0,y:0,z:1,vx:0,vy:0,vz:-55,damage:10,life:3}];update(.04);draw();const hull=hp,kind=VoidCombatEffects.kind,opacity=Number($('flash').style.opacity);
  update(.3);draw();const faded=Number($('flash').style.opacity)===0;mode='pause';return {fired,missed,shield,shieldKind,hull,kind,opacity,faded};
 });assert(combat.fired&&combat.missed&&combat.faded);assert.equal(combat.shield,5);assert.equal(combat.shieldKind,'shield');assert.equal(combat.hull,95);assert.equal(combat.kind,'hull');assert(combat.opacity>0&&combat.opacity<=.22);
 await page.evaluate(()=>{mode='play';firing=false;});await page.locator('#space').dispatchEvent('pointerdown',{button:2,pointerId:1,pointerType:'mouse'});assert.equal(await page.evaluate(()=>missiles.length),0);assert.equal(await page.evaluate(()=>firing),false);
 assert(await page.evaluate(()=>!canvas.dispatchEvent(new MouseEvent('contextmenu',{cancelable:true}))));await page.evaluate(()=>mode='pause');assert(await page.evaluate(()=>canvas.dispatchEvent(new MouseEvent('contextmenu',{cancelable:true}))));
 // Sign out, enable test-admin response, sign in through the real account UI.
 await page.evaluate(()=>{state.completed=1;dock();});await page.locator('#expansion-nav [data-action="account"]').click();await page.getByRole('button',{name:'SIGN OUT',exact:true}).click();await page.waitForFunction(()=>!VoidAccount.busy);admin=true;
 await page.getByRole('button',{name:'SIGN IN WITH GOOGLE',exact:true}).click();await page.waitForFunction(()=>VoidDevTools.authorized&&!VoidAccount.busy);
 await page.locator('#dev-balance-open').click();await page.locator('[data-balance="missileDamage"]').fill('19');await page.getByRole('button',{name:'SAVE',exact:true}).click();await page.waitForFunction(()=>VoidDevTools.revision===1);assert.equal(balance.values.missileDamage,19);
 await page.locator('#dev-debug').check();await page.getByRole('button',{name:'MISSILE TRAINING / 12 ROUNDS',exact:true}).click();await page.waitForFunction(()=>trialGear==='missile'&&mode==='play');
 const locked=await page.evaluate(()=>{spawnEnemy();const e=enemies[0];Object.assign(e,{x:0,y:0,z:55,armor:100,maxArmor:100,shield:0,fire:99,velocity:{x:0,y:0,z:0}});mode='pause';for(let i=0;i<80;i++)stepMissileCombat(.02,{x:0,y:0,z:0});draw();return {lock:missileLock.progress,owned:missileState.ownsMissileLauncher,ammo:missileState.missilesLoaded};});assert.deepEqual(locked,{lock:1,owned:true,ammo:12});
 await page.evaluate(()=>{mode='play';});await page.locator('#space').dispatchEvent('pointerdown',{button:2,pointerId:2,pointerType:'mouse'});
 const missile=await page.evaluate(()=>{mode='pause';const launched=missiles.length===1,ammo=missileState.missilesLoaded;const before=missiles[0].life;update(.5);const frozen=missiles[0].life===before;for(let i=0;i<100;i++)stepMissileCombat(.02,{x:0,y:0,z:0});draw();return {launched,ammo,frozen,armor:enemies[0].armor,impact:sparks.length>0};});assert(missile.launched&&missile.frozen&&missile.impact);assert.equal(missile.ammo,11);assert.equal(missile.armor,81);
 const damageOrder=await page.evaluate(()=>{const e={x:0,y:0,z:50,size:1,armor:2,shield:5};hitEnemy(e,3);const shieldFirst=e.armor===2&&e.shield===2;hitEnemy(e,4);return {shieldFirst,destroyed:e.dead};});assert(damageOrder.shieldFirst&&damageOrder.destroyed);
 // Rendering direction is tied to velocity and relative position.
 const views=await page.evaluate(()=>{const e={x:0,y:0,z:50,className:'raider',velocity:{x:0,y:0,z:-10}};const front=enemyView(e,flightBasis()).direction;e.velocity.z=10;const rear=enemyView(e,flightBasis()).direction;e.velocity={x:10,y:0,z:0};const right=enemyView(e,flightBasis()).direction;e.velocity.x=-10;return {front,rear,right,left:enemyView(e,flightBasis()).direction};});assert.deepEqual(views,{front:'front',rear:'rear',right:'right',left:'left'});
 const out=process.env.VOID_SCREENSHOT_DIR;if(out){fs.mkdirSync(out,{recursive:true});await page.screenshot({path:path.join(out,'missile-combat.png')});}
 await page.locator('#dev-balance-open').click();if(out)await page.screenshot({path:path.join(out,'developer-balance.png')});await page.getByRole('button',{name:'CLOSE',exact:true}).click();
 await page.evaluate(async()=>{await keplerStationTexture.decode();trialGear=null;devMissileTrial=false;state.location='kepler';state.quest='return';dock();});if(out)await page.screenshot({path:path.join(out,'kepler-interior.png')});
 await page.evaluate(()=>{state.quest='legal-run';launch();enemies=[];spawned=resolved=current.enemies;elapsed=current.duration;approachTime=3;mode='pause';draw();});if(out)await page.screenshot({path:path.join(out,'kepler-approach.png')});
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>draw());assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));if(out)await page.screenshot({path:path.join(out,'combat-mobile.png')});
 await page.evaluate(()=>{trialGear=null;dock();});await page.locator('#expansion-nav [data-action="account"]').click();await page.getByRole('button',{name:'SIGN OUT',exact:true}).click();await page.waitForFunction(()=>!VoidAccount.busy);assert.equal(await page.locator('#dev-balance-open').isVisible(),false);assert.equal(await page.evaluate(()=>missileState.ownsMissileLauncher),false);
 const touch=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});touch.on('pageerror',e=>errors.push(e.message));
 await touch.route('**/firebase-auth.js',r=>r.fulfill({contentType:'text/javascript',body:'export const auth={},provider={};export const onAuthStateChanged=(a,fn)=>fn(null);export const getRedirectResult=async()=>null;'}));
 await touch.goto('http://127.0.0.1:5000/void-runner.html');await touch.waitForFunction(()=>window.VoidStartup?.started);await touch.waitForFunction(()=>typeof flight!=='undefined');
 await touch.evaluate(()=>{VoidDevTools.authorized=true;devMissileTrial=true;trialGear='missile';launch();spawnEnemy();Object.assign(enemies[0],{x:0,y:0,z:55,fire:99,velocity:{x:0,y:0,z:0}});mode='pause';stepMissileCombat(2,{x:0,y:0,z:0});draw();});
 await touch.locator('#missile-fire').waitFor({state:'visible'});assert.equal(await touch.locator('#missile-fire').evaluate(el=>getComputedStyle(el).pointerEvents),'auto');
 await touch.evaluate(()=>{mode='play';});await touch.locator('#missile-fire').dispatchEvent('pointerdown',{pointerType:'touch',button:0,pointerId:4});assert.equal(await touch.evaluate(()=>missileState.missilesLoaded),11);
 await touch.evaluate(()=>{$('fire').addEventListener('pointerdown',()=>{window.testTouchFired=touchFiring;},{once:true});});await touch.locator('#fire').tap();assert(await touch.evaluate(()=>window.testTouchFired));assert.equal(await touch.evaluate(()=>touchFiring),false);if(out)await touch.screenshot({path:path.join(out,'missile-touch.png')});
 assert.deepEqual(errors,[]);await browser.close();console.log('Combat browser regressions passed: guest/account reset, stored saves, ownership, explicit cloud load, real enemy shots, misses, shields/hull feedback, missile gating/lock/fire/impact/pause, private panel save/signout, directions, station and mobile layout.');
})().catch(e=>{console.error(e);process.exit(1);});
