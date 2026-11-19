/* The Mission giver creator (19 Nov 2026) in a real browser (offline): Start page > Create a mission giver; a street figure (npc-courier), a name, a new colour, a V3, a
   ship, a Ward pistol visible on the hip, placed in Old Town; then a draft mission she gives (the "Make a mission" builder), PLAY THIS DRAFT, walk up to her, TALK TO her:
   the mission is offered; talk again: the step is done. Nothing is saved: draft play is a throwaway session.
   Usage: node tests/serve-modern.cjs, then node tests/npc-made-browser.cjs (SITE_TEST_URL, SHOTS=dir, BROWSER_EXECUTABLE; default the bundled Chromium, software GL). */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shots=process.env.SHOTS||path.resolve('docs/development/npc-made');fs.mkdirSync(shots,{recursive:true});
const bundled=fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',exe=process.env.BROWSER_EXECUTABLE||(fs.existsSync(bundled)?bundled:null);
const log=(...a)=>console.log('[npc-made]',...a);
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'],...(exe?{executablePath:exe}:{})});const errors=[];
 try{
  const ctx=await browser.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'}),page=await ctx.newPage().then(async p=>{await p.addInitScript(()=>{try{if(!localStorage.getItem('mission-editor-view'))localStorage.setItem('mission-editor-view','form');}catch{}});return p;});page.on('pageerror',e=>errors.push(String(e.stack||e.message).slice(0,600)));
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
  await page.route('**/api/**',r=>{const p=new URL(r.request().url()).pathname.replace('/api/void-runner/','');if(p==='live-content')return r.fulfill({status:404,contentType:'application/json',body:'{"error":"off"}'});return r.fulfill({status:503,contentType:'application/json',body:'{"error":"offline test"}'});});
  const boot=()=>page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:180000});
  const dev=()=>page.evaluate(()=>VoidDevTools.identity(async p=>{if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1,preset:'NORMAL'};const e=new Error('Switched off in this offline test');e.status=404;throw e;}));
  const limits=()=>page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:900000,assets:900000,optional:600000,area:900000,total:1800000,module:600000,artwork:300000}));
  await page.goto(base+'/void-runner.html');await boot();
  await page.evaluate(()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;localStorage.setItem('void-runner-campaign-v1',JSON.stringify({...s,savedAt:1700000000000}));localStorage.removeItem('mission-editor-drafts-v1');localStorage.setItem('editor-tour-done','1');});
  await page.reload();await boot();await limits();await dev();
  // ---- Start page > Create a mission giver
  await page.evaluate(()=>VoidDevTools.open('home'));await page.waitForSelector('[data-eh-task="giver"]',{timeout:90000});await page.locator('[data-eh-task="giver"]').click();
  await page.waitForSelector('[data-npc-make="model"]',{timeout:60000});
  // 1. model: a street figure, with the 3D preview
  await page.locator('select[data-npc-make-model]').selectOption('npc-courier');await page.waitForSelector('[data-npc-clip]',{timeout:120000});
  await page.locator('#npc-root').screenshot({path:path.join(shots,'01-model.png')});
  // NEXT without a name: the plain reason
  await page.locator('[data-npc-make-next]').click();await page.waitForSelector('[data-npc-make="name"]');await page.locator('[data-npc-make-next]').click();assert.match(await page.locator('[data-npc-make-need]').textContent(),/type their name/);
  // 2. name; the adult box defaults off
  assert.equal(await page.locator('[data-npc-make-adult]').isChecked(),false);
  await page.locator('[data-npc-make-name]').fill('Kara Voss');await page.locator('[data-npc-make-role]').fill('TEST: a fixer');await page.locator('[data-npc-make-next]').click();
  await page.waitForSelector('[data-npc-make="look"]');const id=await page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('mission-editor-drafts-v1')).characters)[0]);assert.equal(id,'kara-voss');
  // 3. look: recolour the whole figure
  const go=page.locator('[data-npc-look-start]');if(await go.count())await go.click();await page.waitForSelector('[data-npc-look-swatch]',{timeout:120000});await page.locator('[data-npc-look-colour="*"] [data-npc-look-swatch]').nth(3).click();
  await page.waitForFunction(()=>!!JSON.parse(localStorage.getItem('mission-editor-drafts-v1')).characters['kara-voss'].look,null,{timeout:10000});
  await page.waitForTimeout(800);await page.locator('#npc-root').screenshot({path:path.join(shots,'02-look.png')});
  // 4. device V3, 5. ship, 6. the Ward pistol, visible
  await page.locator('[data-npc-make-next]').click();await page.locator('input[data-npc-make-device="v3"]').check();await page.waitForTimeout(200);
  await page.locator('[data-npc-make-next]').click();await page.locator('input[data-npc-make-ship="ship2"]').check();await page.waitForTimeout(200);
  await page.locator('[data-npc-make-next]').click();await page.locator('[data-npc-make-item-on="ward-pistol"]').check();await page.waitForTimeout(200);await page.locator('[data-npc-make-item-show="ward-pistol"]').check();await page.waitForTimeout(200);
  await page.locator('#npc-root').screenshot({path:path.join(shots,'03-items.png')});
  // 7. voice and 8. animations: shown, left as they are
  await page.locator('[data-npc-make-next]').click();await page.waitForSelector('[data-npc-make="voice"]');await page.locator('[data-npc-make-next]').click();await page.waitForSelector('[data-npc-make="anims"]');
  // 9. place: one spot; the spot is moved onto Old Town's Main Street (east pavement), facing the street
  await page.locator('[data-npc-make-next]').click();await page.waitForSelector('[data-npc-make="place"]');await page.locator('[data-npc-mode="stay"]').click();await page.waitForTimeout(300);
  await page.evaluate(()=>{const S=VoidMissionEditor.shared,d=S.local();d.npcs['kara-voss']={...d.npcs['kara-voss'],x:69.5,z:-85,yaw:-Math.PI/2};S.saveLocal(d);VoidNPCEditor.draw();});await page.waitForTimeout(400);
  // a NULL spot is refused while she is not marked adult
  const refused=await page.evaluate(()=>VoidNPCPaths.spotProblems('kara-voss',{x:30,z:-55}).join(' '));assert.match(refused,/NULL/);
  await page.locator('[data-npc-place]').screenshot({path:path.join(shots,'04-place.png')});
  await page.locator('[data-npc-make-next]').click();await page.waitForSelector('[data-npc-make="done"]');assert.equal(await page.locator('[data-npc-make-ready]').getAttribute('data-npc-make-ready'),'1',await page.locator('[data-npc-make-ready]').textContent());
  await page.locator('#npc-root').screenshot({path:path.join(shots,'05-done.png')});
  const ch=await page.evaluate(()=>JSON.parse(localStorage.getItem('mission-editor-drafts-v1')).characters['kara-voss']);log('character',JSON.stringify(ch));
  assert.deepEqual({device:ch.device,ship:ch.ship,items:ch.items,model:ch.model},{device:'v3',ship:'ship2',items:[{id:'ward-pistol',show:true}],model:'npc-courier'});
  // UNDO takes the last change back (and REDO puts it again)
  await page.locator('[data-dev="undo"]').click();await page.waitForTimeout(300);await page.locator('[data-dev="redo"]').click();await page.waitForTimeout(300);
  // ---- a draft mission she gives: two talks with her
  const made=await page.evaluate(()=>VoidMissionEditor.shared.addWizardMission((d,o)=>{const a=VoidEditorWizard.fresh('talk');a.giver='kara-voss';a.title='TEST: A word with Kara';a.offer='TEST LINE: I have a job for you.';
   a.steps=[{kind:'talk',npc:'kara-voss',label:'',auto:true}];VoidEditorWizard.relabel(a,{name:id=>id==='kara-voss'?'Kara Voss':id});return VoidEditorWizard.build(d,a,o);}));log('mission',JSON.stringify(made));
  await page.evaluate(()=>{VoidDevTools.tab='missions';VoidDevTools.render();});await page.waitForSelector('[data-me-play="tree:'+made.mission+'"]',{timeout:60000});
  await page.evaluate(()=>{try{VoidGraphics.quality='low';VoidBabylon.setQuality('low');}catch{}});
  await page.locator('[data-me-play="tree:'+made.mission+'"]').first().click();
  await page.waitForFunction(()=>!document.getElementById('dev-test-banner').hidden&&mode==='walking',null,{timeout:900000,polling:100});
  log('draft session in',await page.evaluate(()=>walkingLocation.quarter));
  await page.waitForFunction(()=>(VoidBabylon.district?.streetPair?.made?.stats?.().people||[]).some(p=>p.id==='kara-voss'),null,{timeout:900000,polling:1000});
  const st=await page.evaluate(()=>VoidBabylon.district.streetPair.made.stats().people.find(p=>p.id==='kara-voss'));log('her figure',JSON.stringify(st));
  assert.equal(st.device,'v3');assert.ok(st.look,'her own look is on');
  await page.waitForFunction(()=>VoidBabylon.district.streetPair.made.stats().people.find(p=>p.id==='kara-voss').props.length>0,null,{timeout:30000,polling:500});
  await page.evaluate(h=>{Object.assign(walker,{x:h.x-2.2,z:h.z+.4,yaw:Math.PI/2});},st);await page.waitForTimeout(2500);
  const talk=await page.evaluate(()=>VoidBabylon.district.streetPair.made.stats().people.find(p=>p.id==='kara-voss').talk);assert.equal(talk,true,'her TALK prompt is in the scene');
  await page.screenshot({path:path.join(shots,'06-in-old-town.png')});
  // TALK TO KARA VOSS: the mission is offered
  await page.evaluate(()=>{const it=walkingLocation.interactions.find(i=>i.action==='made-npc'&&i.character==='kara-voss');try{walkTarget=it;}catch{}VoidInteractions.handlers.get('made-npc')({item:it});});
  await page.waitForFunction(()=>(speech&&speech.lines.length)||document.querySelector('[data-talk-choice]'),null,{timeout:30000});
  const said=await page.evaluate(()=>speech?speech.lines.map(l=>[l.who,l.text]):[]);log('offer',JSON.stringify(said));await page.waitForTimeout(500);await page.screenshot({path:path.join(shots,'07-offer.png')});
  await page.evaluate(()=>{let n=0;while(speech&&n++<60)advanceSpeech();});await page.waitForFunction(id=>!!state.universe.missions[id]?.acquired,made.mission,{timeout:30000});
  // talk again: the step is done (the mission completes)
  await page.waitForTimeout(800);await page.evaluate(()=>{const it=walkingLocation.interactions.find(i=>i.action==='made-npc'&&i.character==='kara-voss');try{walkTarget=it;}catch{}VoidInteractions.handlers.get('made-npc')({item:it});});
  await page.evaluate(()=>{let n=0;while(speech&&n++<60)advanceSpeech();});await page.waitForFunction(id=>!!state.universe.missions[id]?.completed,made.mission,{timeout:30000});
  log('mission complete; page errors:',errors.length?errors.slice(0,5):'none');
 }catch(e){console.log('[npc-made] page errors at failure:',errors.slice(0,8));try{const pg=browser.contexts()[0].pages()[0];await pg.screenshot({path:path.join(shots,'failure.png')});}catch{}throw e;}
 finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
