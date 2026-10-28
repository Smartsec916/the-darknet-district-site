/* Homepage prototype checks. Run against a static host: SITE_TEST_URL=http://127.0.0.1:5194. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5194';
const output=process.env.NAV_SCREENSHOTS||path.resolve(__dirname,'../work/navigation-review');
const routes=['/','games-list.html','store-first-page.html','resources.html','sleeping_pod.html','about.html'];
const labels=['Home','Arcade','Store','Resources','Sleeping Pod','About'];
const luminance=hex=>{const rgb=hex.match(/[a-f\d]{2}/gi).map(h=>parseInt(h,16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
const contrast=(a,b)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
(async()=>{
 fs.mkdirSync(output,{recursive:true});
 const browser=await chromium.launch({channel:process.env.BROWSER_CHANNEL||'msedge',headless:true});
 const results=[];
 async function page(options={}){
  const p=await browser.newPage(options);
  // External auth, analytics and chat services are outside this static UI check.
  await p.route('https://**/*',r=>r.abort());
  return p;
 }
 try{
  const desktop=await page({viewport:{width:1440,height:900},reducedMotion:'reduce'}),errors=[];
  desktop.on('pageerror',e=>errors.push(e.message));
  await desktop.goto(base+'/index.html');
  const nav=desktop.getByRole('navigation',{name:'Main navigation'});
  await assert.doesNotReject(()=>nav.waitFor());
  assert.deepEqual(await nav.getByRole('link').allTextContents().then(a=>a.map(x=>x.replace(/\s+/g,' ').replace(/^\s*\d+\s*/,'').trim())),labels);
  assert.deepEqual(await nav.locator('a').evaluateAll(a=>a.map(x=>x.getAttribute('href'))),routes);
  assert.equal(await nav.locator('[aria-current="page"]').count(),1);
  assert.equal(await nav.locator('[aria-current="page"] .district-nav__label').textContent(),'Home');
  for(const route of routes){const response=await desktop.request.get(base+'/'+(route==='/'?'index.html':route));assert.equal(response.status(),200,route);}
  for(const width of [320,360,390,540,680,768,900,1024,1280,1440,1920]){
   await desktop.setViewportSize({width,height:900}); await desktop.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const boxes=await nav.locator('a').evaluateAll(aa=>aa.map(a=>{const r=a.getBoundingClientRect(),l=a.querySelector('.district-nav__label').getBoundingClientRect(),s=a.querySelector('svg').getBoundingClientRect();return {x:r.x,right:r.right,y:r.y,bottom:r.bottom,w:r.width,h:r.height,labelLeft:l.left,labelRight:l.right,frameHeight:s.height};}));
   for(const b of boxes){assert(b.x>=0&&b.right<=width+.5,`link outside ${width}px viewport`);assert(b.w>=44&&b.h>=44,'touch target');assert(b.labelLeft>=b.x&&b.labelRight<=b.right,'clipped label '+width+' '+JSON.stringify(b));assert(Math.abs(b.frameHeight-b.h)<1,'frame matches hit area');}
   for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];assert(a.right<=b.x+.5||b.right<=a.x+.5||a.bottom<=b.y+.5||b.bottom<=a.y+.5,'overlapping links');}
   assert(await desktop.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal page overflow');
  }
  results.push('11 viewport widths: readable labels, 44px+ targets, no overlap or horizontal overflow');
  await desktop.setViewportSize({width:1440,height:900});
  await desktop.waitForTimeout(1000);
  await desktop.screenshot({path:path.join(output,'after-desktop.png')});
  await nav.screenshot({path:path.join(output,'after-desktop-navigation.png')});
  // Tab from the document start: decorative SVGs must never become focus stops.
  await desktop.reload();await desktop.evaluate(()=>{document.body.tabIndex=-1;document.body.focus();document.body.removeAttribute('tabindex');});
  for(const label of labels){await desktop.keyboard.press('Tab');assert.equal(await desktop.evaluate(()=>document.activeElement.querySelector('.district-nav__label')?.textContent),label);assert.equal(await desktop.evaluate(()=>getComputedStyle(document.activeElement).outlineStyle),'solid');}
  await desktop.screenshot({path:path.join(output,'keyboard-focus.png')});
  await desktop.keyboard.press('Enter');await desktop.waitForURL('**/about.html');
  results.push('Six keyboard stops in order, visible focus outline, Enter follows About');
  await desktop.goto(base+'/index.html');
  await desktop.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await nav.locator('a').first().evaluate(a=>getComputedStyle(a).animationName),'none');
  assert.equal(await nav.locator('.district-nav__panel').first().evaluate(a=>getComputedStyle(a).transitionDuration),'0s');
  await desktop.emulateMedia({forcedColors:'active'});
  assert.equal(await nav.locator('a').first().evaluate(a=>getComputedStyle(a).borderTopStyle),'solid');
  await desktop.emulateMedia({forcedColors:'none'});
  for(const [text,background]of [['#c3d8de','#0c1b23'],['#c9fffa','#103139'],['#9db2ba','#071116'],['#8caaaf','#0c1b23']])assert(contrast(text,background)>=4.5,'WCAG AA text contrast');
  assert(contrast('#38808b','#0c1b23')>=3,'button boundary contrast');
  results.push('Reduced motion, forced colors, text contrast >=4.5:1 and frame contrast >=3:1');
  const mobile=await page({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1,reducedMotion:'reduce'});
  await mobile.goto(base+'/index.html');await mobile.waitForTimeout(1000);
  await mobile.screenshot({path:path.join(output,'after-mobile.png')});
  await mobile.locator('.district-nav').screenshot({path:path.join(output,'after-mobile-navigation.png')});
  await mobile.getByRole('navigation').getByRole('link',{name:'Arcade'}).tap();await mobile.waitForURL('**/games-list.html');
  results.push('Mobile touch follows Arcade');
  const motion=await page({viewport:{width:1440,height:900}});await motion.goto(base+'/index.html');const arcade=motion.getByRole('navigation').getByRole('link',{name:/Arcade/});await arcade.hover();await motion.waitForTimeout(200);assert.equal(await arcade.locator('.district-nav__panel').evaluate(a=>getComputedStyle(a).fill),'rgb(18, 45, 55)');await motion.evaluate(()=>scrollTo(0,300));assert.equal(Math.round((await motion.locator('.district-nav').boundingBox()).y),0);await motion.locator('#chatButton').click();assert(await motion.locator('#chatContainer').isVisible());results.push('Normal-motion hover, sticky navigation and existing Iris chat toggle');
  const plain=await page({viewport:{width:390,height:844},javaScriptEnabled:false});await plain.goto(base+'/index.html');
  assert.equal(await plain.getByRole('navigation').getByRole('link').count(),6);assert.equal(await plain.locator('[aria-current="page"]').count(),1);
  await plain.getByRole('link',{name:'Resources',exact:true}).click();await plain.waitForURL('**/resources.html');
  results.push('Navigation and active state work with JavaScript disabled');
  for(const route of ['sleeping_pod.html','void-runner.html']){const response=await desktop.request.get(base+'/'+route);const html=await response.text();assert(!html.includes('home-navigation.css')&&!html.includes('district-nav'),'prototype leaked to '+route);}
  results.push('Sleeping Pod and VOID//RUNNER do not load the prototype');
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({status:'passed',results,externalServices:'Mocked offline; authentication, checkout and chat backend not tested'},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
