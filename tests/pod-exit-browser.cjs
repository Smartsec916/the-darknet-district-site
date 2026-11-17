/* EXIT THE POD must leave the pod and nothing else (the owner, 16 Nov 2026: clicking it took him to the main menu).
   Cause: after a click on the pod's view the mouse is held by the pod's own screen (#pod-wake), and the first-person mouse code (mouse-control.js) took the game's own release of
   that hold for the player pressing Esc, so as soon as the pod had been left it opened the pause menu. Checks, at two window sizes and two quality settings:
   a click on EXIT THE POD with the mouse held, with the mouse free, and the E key with the mouse held, each ending walking out of the pod with no menu.
   SITE_TEST_URL=http://127.0.0.1:5187 BROWSER_CHANNEL=chromium node tests/pod-exit-browser.cjs   (PODEXIT_FULL=1 runs every combination) */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',channel=process.env.BROWSER_CHANNEL||'msedge',full=!!process.env.PODEXIT_FULL;
const runs=full?[].concat(...[['low',1366,768],['medium',1920,1080],['low',1920,1080],['medium',1366,768]].map(([q,w,h])=>['click-held','click-free','key-held'].map(m=>[q,w,h,m]))):[['low',1366,768,'click-held'],['low',1366,768,'click-free'],['medium',1920,1080,'click-held'],['medium',1920,1080,'key-held']];
const only=process.env.PODEXIT_FILTER;   // e.g. medium-1920x1080-click-held
(async()=>{const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox'],...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:channel==='chromium'?{}:{channel})});
 try{for(const [quality,W,H,how] of runs){if(only&&!(quality+'-'+W+'x'+H+'-'+how).includes(only))continue;
  const page=await browser.newPage({viewport:{width:W,height:H},serviceWorkers:'block'});page.setDefaultTimeout(240000);const errs=[];page.on('pageerror',e=>errs.push(e.message));
  await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
  await page.addInitScript(q=>{localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:q}));},quality);
  await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
  await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');const c=page.locator('[data-action=menu-new-confirm]');if(await c.count())await c.click();
  await page.waitForSelector('#character-creator.on');await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]').disabled);await page.locator('[data-cc=confirm]').click();
  await page.waitForFunction(()=>mode==='pod-waking'&&walker&&VoidAssets.pending===0);await page.waitForTimeout(800);
  const over=()=>page.evaluate(()=>VoidNeoChinatown.podPick(innerWidth/2,innerHeight/2)?.kind||null);
  if(how!=='click-free'){await page.mouse.click(30,H-60);await page.waitForFunction(()=>document.pointerLockElement?.id==='pod-wake',null,{timeout:10000}).catch(()=>{});}   // a click on the view holds the mouse
  let point=[W/2,H/2];
  if(how==='click-free'){point=await page.evaluate(()=>{for(let y=0;y<innerHeight;y+=12)for(let x=0;x<innerWidth;x+=12){const h=VoidNeoChinatown.podPick(x,y);if(h&&h.kind==='exit'&&h.distance<4)return [x,y];}return null;});assert(point,'EXIT THE POD is on the screen from the waking view');}
  else if(how==='click-held'){let found=false;for(let i=0;i<30&&!found;i++){const p=[0,-.06,.06,-.12,.12,-.18,.18,-.24,.24,-.3][i%10]*(1+Math.floor(i/10));await page.evaluate(q=>{walker.pitch=q;},p);await page.waitForTimeout(150);found=await over()==='exit';}assert(found,'the crosshair can be put on EXIT THE POD');}
  if(how==='key-held')await page.keyboard.press('KeyE');else{if(how==='click-free')await page.mouse.move(point[0],point[1]);await page.mouse.click(point[0],point[1]);}
  await page.waitForFunction(()=>mode!=='pod-waking',null,{timeout:90000});await page.waitForTimeout(1500);
  const after=await page.evaluate(()=>({mode,podHidden:document.getElementById('pod-wake').hidden,menuOpen:/RESUME GAME|CONTINUE/.test(document.getElementById('screen')?.innerText||'')&&!document.getElementById('screen').classList.contains('hidden'),pending:state.story.flags.podWakePending===true}));
  assert.equal(after.mode,'walking',quality+' '+W+'x'+H+' '+how+': out of the pod and walking, not in the menu ('+JSON.stringify(after)+')');assert.equal(after.podHidden,true);assert.equal(after.menuOpen,false);assert.equal(after.pending,false);
  assert.deepEqual(errs,[]);console.log(JSON.stringify({ok:true,quality,size:W+'x'+H,how}));await page.close();}
 }finally{await browser.close();}})().catch(e=>{console.error(String(e.stack||e).slice(0,900));process.exit(1);});
