/* Mission system QA pass (19 Nov 2026) in a real browser (offline): the bugs found while building and playing missions, end to end.
   1. "Make a mission": choosing who does an animation fills the animation list (it used to throw and stay empty); the same for a follow step's person.
   2. Form view: an Ask step's "On DENY: Skip ahead" shows the "skip to" list; new steps get their Mission Log words; no false "needs a label" check for Ask / Wait.
   3. PLAY: Iris talks, the first question is DENIED (skip ahead): the second question shows at once, with no other conversation (the used choice buttons were left in
      the page and blocked it); "go back" returns to Iris; ACCEPT, the Wait, ACCEPT: the mission goes on.
   4. An apartment step has a yellow arrow: from the District it routes out through the vestibule to the apartment's street door.
   The real save is untouched; no page errors. Usage: node tests/serve-modern.cjs, then node tests/mission-qa-browser.cjs (SITE_TEST_URL, SHOTS=dir, BROWSER_EXECUTABLE). */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shots=process.env.SHOTS||null;if(shots)fs.mkdirSync(shots,{recursive:true});
const bundled=fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',exe=process.env.BROWSER_EXECUTABLE||(fs.existsSync(bundled)?bundled:null);
const log=(...a)=>console.log('[mission-qa]',...a);
const shot=async(page,name,loc)=>{if(!shots)return;await (loc||page).screenshot({path:path.join(shots,name),timeout:180000});};
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'],...(exe?{executablePath:exe}:{})});const errors=[];
 try{
  const ctx=await browser.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'}),page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
  await page.route('**/api/**',r=>{const p=new URL(r.request().url()).pathname.replace('/api/void-runner/','');if(p==='live-content')return r.fulfill({status:404,contentType:'application/json',body:'{"error":"off"}'});return r.fulfill({status:503,contentType:'application/json',body:'{"error":"offline test"}'});});
  const boot=()=>page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:180000});
  const dev=()=>page.evaluate(()=>VoidDevTools.identity(async p=>{if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1,preset:'NORMAL'};const e=new Error('Switched off in this offline test');e.status=404;throw e;}));
  await page.goto(base+'/void-runner.html');await boot();
  await page.evaluate(()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;localStorage.setItem('void-runner-campaign-v1',JSON.stringify({...s,savedAt:1700000000000}));localStorage.setItem('editor-tour-done','1');for(const k of ['editor-mode','mission-editor-drafts-v1'])localStorage.removeItem(k);localStorage.setItem('mission-editor-view','form');});
  await page.reload();await boot();await dev();const before=await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1'));
  // ---- 1. the wizard: Admin, talk to Iris, + an animation step (Lace) and a follow step (Lace), with an apartment
  await page.evaluate(async()=>{await VoidDevTools.loadEditor();VoidEditorHome.ui.view='home';VoidDevTools.tab='home';VoidDevTools.open();});await page.waitForSelector('[data-eh-task="make"]',{timeout:60000});
  await page.locator('[data-eh-task="make"]').click();await page.locator('[data-eh-template="talk"]').click();await page.locator('[data-eh-giver="admin"]').click();await page.locator('[data-eh-next]').click();
  await page.locator('[data-eh-start="person"]').click();await page.locator('[data-eh-next]').click();await page.waitForSelector('[data-eh-page="steps"]');
  await page.locator('[data-eh-step-npc="0"]').selectOption('iris');
  await page.locator('[data-eh-add-step]').click();await page.locator('[data-eh-step-kind="1"]').selectOption('anim');await page.locator('[data-eh-step-npc="1"]').selectOption('ethereal-lace');
  const clips=await page.locator('[data-eh-step-clip="1"] option').evaluateAll(o=>o.map(x=>x.value).filter(Boolean));assert.ok(clips.includes('shrug'),'Lace’s animations are listed: '+clips.join(','));
  await page.locator('[data-eh-step-kind="1"]').selectOption('follow-them');await page.locator('[data-eh-step-npc="1"]').selectOption('ethereal-lace');
  assert.ok(await page.locator('[data-eh-step-spot="1"] option').count()>1,'Lace’s spots are listed');assert.deepEqual(errors,[],'choosing the person throws nothing');
  await page.locator('[data-eh-step-remove="1"]').click();
  await page.locator('[data-eh-apt-add]').click();const door=await page.evaluate(()=>VoidApartments.doorsIn('oldtown')[3].id);await page.locator('[data-eh-apt-door]').selectOption(door);
  await page.locator('[data-eh-next]').click();await page.locator('[data-eh-next]').click();await page.locator('[data-eh-title]').fill('TEST: QA questions');await page.locator('[data-eh-offer]').fill('TEST LINE: Admin has questions.');
  await page.locator('[data-eh-next]').click();await page.waitForSelector('[data-eh-done]');const mid=await page.locator('[data-eh-done]').getAttribute('data-eh-done');log('made',mid);
  // ---- 2. the Form view: talk Iris (+ a line), Ask (DENY: skip to the second Ask), Wait 2 s, Ask (DENY: back to Iris); the apartment step last
  await page.locator('[data-eh-open="'+mid+'"]').click();const c=()=>page.locator('[data-me-tree-mission="'+mid+'"]');await c().waitFor();
  if(await c().locator('[data-mb-view="form"]').getAttribute('aria-checked')!=='true')await c().locator('[data-mb-view="form"]').click();
  const D=()=>page.evaluate(id=>JSON.parse(localStorage.getItem('mission-editor-drafts-v1')).trees.flatMap(t=>t.missions).find(m=>m.id===id),mid);
  let d=await D();const s1=d.objectives[0].id,sApt=d.objectives[1].id;
  await c().locator('[data-me-tstep="'+s1+'"] [data-me-line="'+s1+'/say/0"] textarea').fill('TEST LINE: Iris first.').catch(async()=>{await c().locator('[data-me-tstep="'+s1+'"] textarea').first().fill('TEST LINE: Iris first.');});
  const add=async kind=>{await c().locator('[data-me-add-step="'+mid+'"]').click();await page.waitForTimeout(300);const x=await D(),o=x.objectives[x.objectives.length-1];await c().locator('[data-me-kind="'+o.id+'"]').selectOption(kind);await page.waitForTimeout(300);return o.id;};
  const a1=await add('ask'),w=await add('wait'),a2=await add('ask'),h=await add('hack');
  d=await D();assert.equal(d.objectives.find(o=>o.id===h).label,'Hack the access point','a new step gets its Mission Log words in the Form view');
  await c().locator('[data-me-tstep="'+h+'"] [data-me-step-ap]').selectOption('a1/hall');
  await c().locator('[data-me-step-question="'+a1+'"]').fill('TEST LINE: Skip the wait?');await c().locator('[data-mb-ask-deny="'+a1+'"]').selectOption('skip');
  const g1=c().locator('[data-me-step-goto="'+a1+'"]');await g1.waitFor({timeout:5000});await g1.selectOption(a2);
  await c().locator('[data-me-step-hold="'+w+'"]').fill('2');
  await c().locator('[data-me-step-question="'+a2+'"]').fill('TEST LINE: Again?');await c().locator('[data-mb-ask-yes="'+a2+'"]').fill('FINISH');await c().locator('[data-mb-ask-no="'+a2+'"]').fill('AGAIN');
  await c().locator('[data-mb-ask-deny="'+a2+'"]').selectOption('back');const g2=c().locator('[data-me-step-goto="'+a2+'"]');await g2.waitFor({timeout:5000});await g2.selectOption(s1);
  // the apartment step last: move it down past the four new steps
  for(let i=0;i<4;i++){await c().locator('[data-me-tstep="'+sApt+'"] button',{hasText:'▼'}).first().click();await page.waitForTimeout(250);}
  await page.evaluate(()=>VoidDevTools.render());await page.waitForTimeout(500);
  const checks=await c().locator('.me-issues').textContent();assert.ok(!/needs a label/.test(checks),'no false label check: '+checks);
  d=await D();log('steps',d.objectives.map(o=>o.kind+(o.goto?'→'+o.goto:'')).join(' · '));assert.deepEqual(d.objectives.map(o=>o.kind),['talk','ask','wait','ask','hack','apt-enter']);
  await shot(page,'01-form-ask.png',c().locator('[data-me-tstep="'+a1+'"]'));
  // ---- 3. PLAY THIS DRAFT
  await page.evaluate(()=>{try{VoidGraphics.quality='low';VoidBabylon.setQuality('low');}catch{}});
  await c().locator('[data-me-play="tree:'+mid+'"]').first().click();await page.waitForFunction(()=>!document.getElementById('dev-test-banner').hidden&&mode==='walking',null,{timeout:900000,polling:200});
  const all=()=>page.evaluate(()=>{let n=0;while(speech&&n++<60){speech.shown=1e9;advanceSpeech();}});
  const asked=()=>page.waitForFunction(()=>!!speech&&!!speech.askStep&&Array.isArray(speech.choices),null,{timeout:15000,polling:100}).then(()=>page.evaluate(()=>({q:speech.lines.map(l=>l.text).join(' '),choices:speech.choices.map(x=>x.label)})));
  const press=label=>page.evaluate(label=>{speech.index=speech.lines.length-1;speech.shown=1e9;renderLine();const k=speech.choices.findIndex(x=>x.label===label);if(k===0){speech.shown=1e9;advanceSpeech();return;}document.querySelector('[data-talk-choice="'+k+'"]').click();},label);
  const rec=()=>page.evaluate(id=>state.universe.missions[id]?.objectives||null,mid);
  await page.evaluate(()=>VoidInteractions.handlers.get('admin')());await all();await page.evaluate(()=>{try{resumeWalking();}catch{}});
  await page.evaluate(()=>VoidInteractions.handlers.get('district-iris')());await all();
  let q=await asked();assert.match(q.q,/Skip the wait/);await shot(page,'02-ask.png');await press('DENY');
  q=await asked();assert.match(q.q,/Again\?/,'the second question shows at once after DENY (no other conversation)');assert.equal(await page.evaluate(()=>[...document.querySelectorAll('[data-talk-choice]')].filter(n=>!n.getClientRects().length).length),0,'no hidden buttons left');
  await press('AGAIN');await page.waitForTimeout(500);assert.deepEqual(await rec(),{},'back to Iris');
  await page.evaluate(()=>{try{resumeWalking();}catch{}});await page.evaluate(()=>VoidInteractions.handlers.get('district-iris')());await all();
  q=await asked();assert.match(q.q,/Skip the wait/);await press('ACCEPT');const t0=Date.now();q=await asked();assert.match(q.q,/Again\?/);log('the wait took',Date.now()-t0,'ms');await press('FINISH');await page.waitForTimeout(600);
  assert.equal((await rec())[a2],true,'FINISH answers the second question');
  // ---- 4. the hack step has an arrow, out of the District to the apartment's street door
  await page.evaluate(()=>{try{resumeWalking();}catch{}});await page.waitForTimeout(1500);
  const arrow=await page.evaluate(()=>({wp:trackedWalkWaypoint&&trackedWalkWaypoint.position,live:VoidGuideRoute.live&&VoidGuideRoute.live.route,front:null}));
  const front=await page.evaluate(id=>VoidApartments.door(id).front,door);log('arrow',JSON.stringify(arrow),'door front',JSON.stringify(front));
  assert.ok(arrow.wp,'the hack step has a goal');assert.ok(Math.hypot(arrow.wp[0]-front[0],arrow.wp[2]-front[1])<3,'the goal is the apartment’s street door');assert.ok(arrow.live&&arrow.live[0]==='district-inner-door<','routed out through the vestibule');
  await shot(page,'03-arrow.png');
  assert.equal(await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1')),before,'the real save is untouched');
  assert.deepEqual(errors,[],'no page errors');log('OK');
 }catch(e){console.error(e);console.error('page errors:',errors);process.exitCode=1;}finally{await browser.close();}
})();
