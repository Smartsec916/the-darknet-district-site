/* Two Mission Editor changes (19 Nov 2026), in a real browser (offline).
   1. "Go into" by the place's real name: a mission with an office location (Office floor, then a Server room joined to it); the step "Go into" picks the place from ONE
      list by name ("Office floor (…)", "Server room (…)"); the words follow ("Go into the office floor", then "Go into the server room"); the owner's own words are kept
      when the place changes, and USE THE AUTOMATIC WORDS puts the made words back. The Blocks view has the same list and words.
   2. A walked-near offer the player DENIES: "Offer again after 1 minute": not offered again while the wait runs; SKIP THE WAIT in the draft banner ends it; it comes back only
      after the player walks out of the distance and back; then a real minute of play brings it back too. "Never offer again (remove it)": never offered again.
   The real save is untouched; no page errors. Usage: node tests/serve-modern.cjs, then node tests/deny-retry-browser.cjs (SITE_TEST_URL, SHOTS=dir, BROWSER_EXECUTABLE;
   default the bundled Chromium, software GL). */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shots=process.env.SHOTS||null;if(shots)fs.mkdirSync(shots,{recursive:true});
const bundled=fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',exe=process.env.BROWSER_EXECUTABLE||(fs.existsSync(bundled)?bundled:null);
const PART=process.env.PART||'all';
const log=(...a)=>console.log('[deny-retry]',...a);
const shot=async(page,name,loc)=>{if(!shots)return;if(loc)await loc.screenshot({path:path.join(shots,name),timeout:300000});else await page.screenshot({path:path.join(shots,name),timeout:300000});};
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'],...(exe?{executablePath:exe}:{})});const errors=[];
 try{
  const ctx=await browser.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'}),page=await ctx.newPage().then(async p=>{await p.addInitScript(()=>{try{if(!localStorage.getItem('mission-editor-view'))localStorage.setItem('mission-editor-view','form');}catch{}});return p;});page.on('pageerror',e=>{errors.push(e.message);console.log('PAGEERROR',e.message);});
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
  await page.route('**/api/**',r=>{const p=new URL(r.request().url()).pathname.replace('/api/void-runner/','');if(p==='live-content')return r.fulfill({status:404,contentType:'application/json',body:'{"error":"off"}'});return r.fulfill({status:503,contentType:'application/json',body:'{"error":"offline test"}'});});
  const boot=()=>page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:600000});
  const dev=async()=>{await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:900000,assets:900000,optional:600000,area:900000,total:1800000,module:600000,artwork:300000}));
   await page.evaluate(()=>VoidDevTools.identity(async p=>{if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1,preset:'NORMAL'};const e=new Error('Switched off in this offline test');e.status=404;throw e;}));};
  await page.goto(base+'/void-runner.html');await boot();
  await page.evaluate(()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;localStorage.setItem('void-runner-campaign-v1',JSON.stringify({...s,savedAt:1700000000000}));localStorage.setItem('editor-tour-done','1');localStorage.setItem('editor-mode','advanced');localStorage.removeItem('mission-editor-drafts-v1');});
  await page.reload();await boot();await dev();const before=await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1'));
  const drafts=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('mission-editor-drafts-v1')));
  const mission=id=>drafts().then(d=>d.trees.flatMap(t=>t.missions).find(m=>m.id===id));
  await page.evaluate(()=>VoidDevTools.open('missions'));await page.waitForSelector('[data-me-new-tree]',{timeout:60000});
  const newTree=async name=>{await page.locator('[data-me-new-tree]').first().click();await page.locator('[data-me-new-name]').fill(name);await page.locator('[data-me-create-tree]').click();};
  if(PART==='all'||PART==='words'){
   // ---- 1. an office location and "Go into" by name
   await newTree('Office words');const T='draft-office-words',m1=T+'-m1';await page.locator('[data-me-tree="'+T+'"]').click();await page.locator('[data-me-add-mission]').click();
   const c=()=>page.locator('[data-me-tree-mission="'+m1+'"]');await c().waitFor();await c().locator('[data-me-giver]').selectOption('admin');await c().locator('[data-me-field="title"]').fill('TEST: the office');
   const pick=async(scope,cat,type)=>{const p=scope.locator('.mod-pick').first();await p.locator('[data-mod-cat]').selectOption(cat);await p.locator('[data-mod-type]').selectOption(type);await p.locator('[data-mod-add]').click();};
   await c().locator('[data-me-loc-add="'+m1+'"]').waitFor({timeout:60000});await pick(c().locator('[data-me-loc-add="'+m1+'"]').locator('xpath=..'),'office','office-floor');
   let m=await mission(m1);const loc=m.apartments[0];log('location',loc.id,JSON.stringify(loc.modules.map(x=>x.id+':'+x.type)));
   await c().locator('[data-mod-picker="'+loc.id+'"]').waitFor();const pk=c().locator('[data-mod-picker="'+loc.id+'"]');await pk.locator('[data-mod-cat]').selectOption('server');await pk.locator('[data-mod-type]').selectOption('server-room');await pk.locator('[data-mod-add]').click();
   m=await mission(m1);const mods=m.apartments[0].modules;log('modules',JSON.stringify(mods.map(x=>x.id+':'+x.type)));const off=mods.find(x=>x.type==='office-floor').id,srv=mods.find(x=>x.type==='server-room').id;
   const sid=m.objectives[0].id;await c().locator('[data-me-kind="'+sid+'"]').selectOption('apt-enter');await c().locator('[data-me-label="'+sid+'"]').fill('Go into the apartment');   // the older fixed words
   const placeSel=c().locator('[data-me-step-apt="'+sid+'"]');await placeSel.waitFor();
   const opts=await placeSel.locator('option').allTextContents();log('places',JSON.stringify(opts));
   assert.ok(opts.some(t=>/^Office floor \(/.test(t)),'the office floor by its name');assert.ok(opts.some(t=>/^Server room \(/.test(t)),'the server room by its name');assert.ok(!opts.some(t=>/apartment/i.test(t)),'no apartment here');
   await placeSel.selectOption(loc.id+'/'+off);let lab=await c().locator('[data-me-label="'+sid+'"]').inputValue();assert.equal(lab,'Go into the office floor');
   assert.equal(await c().locator('[data-me-auto-words="'+sid+'"]').isHidden(),true,'automatic words: no button');
   await c().locator('[data-me-step-apt="'+sid+'"]').scrollIntoViewIfNeeded();await shot(page,'01-go-into-dropdown.png',c().locator('[data-me-step="'+sid+'"]'));
   await c().locator('[data-me-step-apt="'+sid+'"]').selectOption(loc.id+'/'+srv);assert.equal(await c().locator('[data-me-label="'+sid+'"]').inputValue(),'Go into the server room','the words follow the place');
   await c().locator('[data-me-label="'+sid+'"]').fill('Get to the racks');assert.equal(await c().locator('[data-me-auto-words="'+sid+'"]').isHidden(),false,'own words: the button shows');
   await c().locator('[data-me-step-apt="'+sid+'"]').selectOption(loc.id+'/'+off);assert.equal(await c().locator('[data-me-label="'+sid+'"]').inputValue(),'Get to the racks','own words kept');
   await shot(page,'02-own-words-button.png',c().locator('[data-me-step="'+sid+'"]'));
   await c().locator('[data-me-auto-words="'+sid+'"]').click();assert.equal(await c().locator('[data-me-label="'+sid+'"]').inputValue(),'Go into the office floor');
   m=await mission(m1);assert.deepEqual([m.objectives[0].apt,m.objectives[0].mod,m.objectives[0].label],[loc.id,off,'Go into the office floor']);
   // Use something: the room, then what is used
   await c().locator('[data-me-kind="'+sid+'"]').selectOption('apt-use');await c().locator('[data-me-step-apt="'+sid+'"]').selectOption(loc.id+'/'+srv);await c().locator('[data-me-step-object="'+sid+'"]').selectOption('rack');
   assert.equal(await c().locator('[data-me-label="'+sid+'"]').inputValue(),'Use the server rack in the server room');
   // the Blocks view: the same list and words
   await c().locator('[data-mb-view="blocks"]').click();const blk=c().locator('[data-mb-mission="'+m1+'"]');await blk.waitFor();
   const bsel=blk.locator('[data-me-step-apt="'+sid+'"]');await bsel.waitFor();await bsel.selectOption(loc.id+'/'+off);
   assert.equal(await blk.locator('[data-me-label="'+sid+'"]').inputValue(),'Use something on the office floor');await blk.locator('[data-me-step-object="'+sid+'"]').selectOption('manager-pc');
   assert.equal(await blk.locator('[data-me-label="'+sid+'"]').inputValue(),'Use the manager’s computer on the office floor');
   await bsel.scrollIntoViewIfNeeded();await shot(page,'03-blocks-use.png',blk.locator('[data-mb-block="step:'+sid+'"]'));
   await c().locator('[data-mb-view="form"]').click();log('words: PASS');}
  if(PART==='all'||PART==='deny'){
   // ---- 2. walked near Admin, DENY, offered again after the wait
   await newTree('Near deny');const T='draft-near-deny',m1=T+'-m1';await page.locator('[data-me-tree="'+T+'"]').click();await page.locator('[data-me-add-mission]').click();
   const c=()=>page.locator('[data-me-tree-mission="'+m1+'"]');await c().waitFor();await c().locator('[data-me-giver]').selectOption('admin');await c().locator('[data-me-field="title"]').fill('TEST: walk-by job');
   await c().locator('[data-me-starts]').selectOption('messages');await c().locator('[data-me-start-header]').fill('TEST');await c().locator('[data-me-start-text]').fill('TEST: got a job, interested?');
   await c().locator('[data-me-start-when]').selectOption('near');await c().locator('[data-me-near-switch]').click();
   const sid=(await mission(m1)).objectives[0].id;await c().locator('[data-me-step-npc="'+sid+'"]').selectOption('iris');await c().locator('[data-me-label="'+sid+'"]').fill('Talk to Iris (test)');
   const dn=c().locator('[data-me-ask-deny="'+m1+'"]');const dopts=await dn.locator('option').allTextContents();log('deny options',JSON.stringify(dopts));
   assert.ok(dopts.includes('Offer again after a number of minutes'));assert.ok(dopts.includes('Offer again after the next pod exit'));assert.ok(dopts.includes('Never offer again (remove it)'));assert.equal(await dn.inputValue(),'again','an existing setting stays “after the next pod exit”');
   await dn.selectOption('after');const mins=c().locator('[data-me-ask-deny-minutes="'+m1+'"]');await mins.waitFor();assert.equal(await mins.inputValue(),'10','default 10 minutes');await mins.fill('1');
   let st=(await mission(m1)).start;assert.deepEqual([st.deny,st.denyMinutes],['after',1]);await dn.scrollIntoViewIfNeeded();await shot(page,'04-deny-after.png',c().locator('[data-me-ask="'+m1+'"]'));
   await page.evaluate(()=>{try{VoidGraphics.quality='low';VoidBabylon.setQuality('low');}catch{}});
   const play=async()=>{await page.locator('[data-me-play="tree:'+m1+'"]').click();await page.waitForFunction(()=>!document.getElementById('dev-test-banner').hidden&&mode==='walking',null,{timeout:900000,polling:100});};
   await play();
   const ad=await page.evaluate(()=>walkingLocation.interactions.find(i=>i.action==='admin')?.position||null);assert.ok(ad,'Admin is in this scene');
   const at=d=>page.evaluate(([p,d])=>{Object.assign(walker,{x:p[0]+d,z:p[2]});},[ad,d]);
   const offer=()=>page.evaluate(()=>!!(typeof speech!=='undefined'&&speech&&document.querySelector('[data-talk-choice]')));
   const flag=()=>page.evaluate(id=>state.story.flags['md_'+id],m1);
   const deny=async()=>{await page.evaluate(()=>{let n=0;while(speech&&(speech.index<speech.lines.length-1||speech.shown<speech.lines[speech.index].text.length)&&n++<40)advanceSpeech();});await page.locator('[data-talk-choice]').dispatchEvent('click');await page.waitForFunction(()=>mode==='walking'&&!speech,null,{timeout:20000});};
   await at(2.5);await page.waitForFunction(()=>!!(typeof speech!=='undefined'&&speech&&document.querySelector('[data-talk-choice]')),null,{timeout:20000});await shot(page,'05-walked-near-offer.png');
   await deny();let f=await flag();assert.ok(Number.isInteger(f)&&f>50&&f<=60,'one minute of play to wait: '+f);assert.equal(await page.evaluate(id=>state.universe.missions[id]||null,m1),null);
   await page.waitForSelector('#dev-test-banner [data-deny-skip]:not([hidden])',{timeout:10000});await shot(page,'06-banner-skip.png',page.locator('#dev-test-banner'));
   await at(20);await page.waitForTimeout(800);await at(2.5);await page.waitForTimeout(1500);assert.equal(await offer(),false,'not offered while the wait runs');
   await page.locator('#dev-test-banner [data-deny-skip]').click();assert.equal(await flag(),'away','the wait is over; the player is still near');
   await page.waitForTimeout(1500);assert.equal(await offer(),false,'still standing within the distance: not yet');
   await at(20);await page.waitForFunction(id=>state.story.flags['md_'+id]===undefined,m1,{timeout:10000});await at(2.5);
   await page.waitForFunction(()=>!!(typeof speech!=='undefined'&&speech&&document.querySelector('[data-talk-choice]')),null,{timeout:20000});log('offered again after SKIP THE WAIT + walking away and back');
   // a real minute of play
   await deny();f=await flag();assert.ok(Number.isInteger(f)&&f>50&&f<=60);await at(20);const t0=Date.now();
   await page.waitForFunction(id=>state.story.flags['md_'+id]===undefined,m1,{timeout:150000,polling:500});log('a minute of play passed in',Math.round((Date.now()-t0)/1000),'s');
   await at(2.5);await page.waitForFunction(()=>!!(typeof speech!=='undefined'&&speech&&document.querySelector('[data-talk-choice]')),null,{timeout:20000});log('offered again after one minute');await deny();
   // ---- "never offer again"
   await page.locator('#dev-test-banner button').first().click();await page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:600000});await dev();
   await page.evaluate(()=>VoidDevTools.open('missions'));await page.waitForSelector('[data-me-tree="'+T+'"]',{timeout:60000});await page.locator('[data-me-tree="'+T+'"]').click();await c().waitFor();
   await c().locator('[data-me-ask-deny="'+m1+'"]').selectOption('never');st=(await mission(m1)).start;assert.equal(st.deny,'never');assert.equal(st.denyMinutes,undefined);
   await page.evaluate(()=>{try{VoidGraphics.quality='low';VoidBabylon.setQuality('low');}catch{}});await play();
   await at(2.5);await page.waitForFunction(()=>!!(typeof speech!=='undefined'&&speech&&document.querySelector('[data-talk-choice]')),null,{timeout:20000});await deny();
   assert.equal(await flag(),'never');assert.equal(await page.locator('#dev-test-banner [data-deny-skip]:not([hidden])').count(),0,'nothing to skip');
   await at(20);await page.waitForTimeout(1500);await at(2.5);await page.waitForTimeout(2500);assert.equal(await offer(),false,'never offered again');
   log('deny: PASS');}
  await page.waitForTimeout(1200);assert.equal(await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1')),before,'the real save is untouched');
  assert.deepEqual(errors,[]);log('PASS');
 }finally{await browser.close();}
})().catch(e=>{console.error(String(e).slice(0,400));process.exit(1);});
