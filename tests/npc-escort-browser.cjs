/* Follow / lead / shared-cab mission steps (queue item 3; 19 Nov 2026) in a real browser (offline): a draft mission made with the "Make a mission" wizard's own builder,
   given by Reverie, with all four new steps: (1) Follow them to a spot (she waits when the player stops, walks on when they catch up), (2) They follow you to a spot,
   (3) They call a cab (both in the cab, both get out at the stop), (4) You call a cab, they ride along. The Mission Editor's step panels (map, distances, greyed stops)
   are checked and photographed first. Nothing is saved: draft play is a throwaway session.
   Usage: node tests/serve-modern.cjs, then node tests/npc-escort-browser.cjs (SITE_TEST_URL, SHOTS=dir, BROWSER_EXECUTABLE; default the bundled Chromium,
   software GL). PART=editor runs only the editor part. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shots=process.env.SHOTS||path.resolve('docs/development/npc-escort');fs.mkdirSync(shots,{recursive:true});
const bundled=fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',exe=process.env.BROWSER_EXECUTABLE||(fs.existsSync(bundled)?bundled:null);
const log=(...a)=>console.log('[npc-escort]',...a),PART=process.env.PART||'all';
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'],...(exe?{executablePath:exe}:{})});const errors=[];
 try{
  const ctx=await browser.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'}),page=await ctx.newPage().then(async p=>{await p.addInitScript(()=>{try{if(!localStorage.getItem('mission-editor-view'))localStorage.setItem('mission-editor-view','form');}catch{}});return p;});page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
  await page.route('**/api/**',r=>{const p=new URL(r.request().url()).pathname.replace('/api/void-runner/','');if(p==='live-content')return r.fulfill({status:404,contentType:'application/json',body:'{"error":"off"}'});return r.fulfill({status:503,contentType:'application/json',body:'{"error":"offline test"}'});});
  const boot=()=>page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:180000});
  const dev=()=>page.evaluate(()=>VoidDevTools.identity(async p=>{if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1,preset:'NORMAL'};const e=new Error('Switched off in this offline test');e.status=404;throw e;}));
  const limits=()=>page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:900000,assets:900000,optional:600000,area:900000,total:1800000,module:600000,artwork:300000}));
  await page.goto(base+'/void-runner.html');await boot();
  await page.evaluate(()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;localStorage.setItem('void-runner-campaign-v1',JSON.stringify({...s,savedAt:1700000000000}));localStorage.removeItem('mission-editor-drafts-v1');localStorage.setItem('editor-tour-done','1');});
  await page.reload();await boot();await limits();await dev();
  await page.evaluate(()=>VoidDevTools.open('missions'));await page.waitForSelector('[data-me-new-tree]',{timeout:60000});
  // ---- the wizard's builder: four steps with Reverie
  const made=await page.evaluate(()=>VoidMissionEditor.shared.addWizardMission((d,o)=>{const E=VoidNPCEscort,sp=n=>E.spots('grey-reverie').find(p=>p.name==='Outside '+n).id,a=VoidEditorWizard.fresh('talk');a.giver='grey-reverie';a.title='TEST: Walk with Reverie';a.offer='TEST LINE: come with me.';
   a.steps=[{kind:'follow-them',npc:'grey-reverie',spot:sp('BIO-CLINIC'),label:'',auto:true},{kind:'they-follow',npc:'grey-reverie',spot:sp('LAUNDRY'),label:'',auto:true},{kind:'their-cab',npc:'grey-reverie',stop:'function-gate',label:'',auto:true},{kind:'shared-cab',npc:'grey-reverie',stop:'east-gate',label:'',auto:true}];
   VoidEditorWizard.relabel(a,{name:id=>id==='grey-reverie'?'Reverie':id});return VoidEditorWizard.build(d,a,o);}));
  log('mission',JSON.stringify(made));
  await page.evaluate(()=>VoidDevTools.render());await page.waitForSelector('[data-me-esc]',{timeout:60000});
  assert.equal(await page.locator('[data-me-esc]').count(),4,'four step panels');
  // the step kinds are in the list; the person list greys everyone who cannot walk with the player
  const kinds=await page.locator('select[data-me-kind]').first().evaluate(s=>[...s.options].map(o=>o.value));for(const k of ['follow-them','they-follow','their-cab','shared-cab'])assert.ok(kinds.includes(k),k);
  const who=await page.locator('[data-me-esc]').first().evaluate(e=>{const s=e.closest('[data-me-tstep]').querySelector('select[data-me-step-npc]');return {value:s.value,admin:[...s.options].find(o=>o.value==='admin')?.disabled,cat:[...s.options].some(o=>o.value==='street-cat'&&!o.disabled)};});
  assert.deepEqual(who,{value:'grey-reverie',admin:true,cat:true});
  // the follow-them settings: change the waiting distance (UNDO-able like any edit), and the lost choice
  const step1=await page.evaluate(m=>m,made.mission),first=page.locator('[data-me-esc]').first();
  await first.locator('input[data-me-esc-wait]').fill('6');await first.locator('input[data-me-esc-wait]').dispatchEvent('change');await page.waitForTimeout(250);
  const draftStep=k=>page.evaluate(([id,k])=>{const d=JSON.parse(localStorage.getItem('mission-editor-drafts-v1'));for(const t of d.trees)for(const m of t.missions)if(m.id===id)return m.objectives[k];return null;},[step1,k]);
  assert.equal((await draftStep(0)).wait,6);
  await page.locator('[data-me-esc]').first().locator('select[data-me-esc-iflost]').selectOption('pause');await page.waitForTimeout(250);assert.equal((await draftStep(0)).ifLost,'pause');
  await page.locator('[data-me-esc]').first().scrollIntoViewIfNeeded();await page.locator('[data-me-esc]').first().screenshot({path:path.join(shots,'01-follow-them-panel.png')});
  // the cab stops: only The Avenue's, the rest greyed with the reason
  const stops=await page.locator('select[data-me-esc-stop]').first().evaluate(s=>[...s.options].filter(o=>o.value).map(o=>[o.value,o.disabled]));
  assert.deepEqual(stops.filter(s=>!s[1]).map(s=>s[0]),['avenue','function-gate','east-gate']);assert.ok(stops.find(s=>s[0]==='corporate')[1]);
  await page.locator('[data-me-esc]').nth(2).scrollIntoViewIfNeeded();await page.locator('[data-me-esc]').nth(2).screenshot({path:path.join(shots,'02-their-cab-panel.png')});
  if(PART==='editor'){log('editor part done; page errors:',errors.length?errors.slice(0,5):'none');return;}
  // ---- the game: JUMP THERE (a throwaway draft session on The Avenue with Reverie out)
  await page.evaluate(()=>{try{VoidGraphics.quality='low';VoidBabylon.setQuality('low');}catch{}});
  await page.locator('[data-me-esc-jump]').first().click();
  await page.waitForFunction(()=>!document.getElementById('dev-test-banner').hidden&&mode==='walking'&&walkingLocation?.quarter==='avenue',null,{timeout:900000,polling:50});
  await page.evaluate(()=>{state.credits=500;});
  await page.waitForFunction(()=>VoidBabylon.district?.streetPair?.stats?.().her?.id==='grey-reverie',null,{timeout:900000,polling:1000});
  const sp=()=>page.evaluate(()=>{const s=VoidBabylon.district.streetPair.stats();return {her:s.her,esc:s.escort?.her||null};});
  // talk to her: the mission is offered (in person)
  let h=(await sp()).her;await page.evaluate(h=>{Object.assign(walker,{x:h.x+1.4,z:h.z-.6,yaw:-Math.PI/2});},h);await page.waitForTimeout(600);
  await page.evaluate(()=>{const it=VoidBabylon.district.streetPair.talkItems['grey-reverie'];try{walkTarget=it;}catch{}VoidInteractions.handlers.get('street-pair')({item:it});});
  await page.waitForTimeout(800);assert.match(await page.evaluate(()=>document.body.innerText),/TEST LINE: come with me\./);
  const closeTalk=async()=>{for(let i=0;i<8&&await page.evaluate(()=>!!VoidConversationUI?.isOpen||mode==='dialogue');i++){await page.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(b=>/CONTINUE|CLOSE/.test(b.textContent)&&b.offsetParent);if(b)b.click();});await page.waitForTimeout(400);}};
  await closeTalk();const rec=()=>page.evaluate(id=>state.universe.missions[id]||null,step1);assert.ok((await rec())?.acquired,'mission taken');
  log('escort now',JSON.stringify(await page.evaluate(()=>VoidLiveContent.escortNow())));
  // (1) FOLLOW THEM: the player follows 3 m behind; then stops (she waits), then catches up (she walks on)
  const follow=on=>page.evaluate(on=>{clearInterval(globalThis.__f);if(!on)return;globalThis.__f=setInterval(()=>{const st=VoidBabylon.district.streetPair.stats(),s=st.her;if(!s)return;const there=st.escort?.her?.phase==='there',tx=there?123:s.x-3*Math.sign(124.5-s.x||1),tz=-6.9,dx=tx-walker.x,dz=tz-walker.z,d=Math.hypot(dx,dz),v=Math.min(d,.35);if(d>.05){walker.x+=dx/d*v;walker.z+=dz/d*v;walker.yaw=Math.atan2(s.x-walker.x,s.z-walker.z);}},100);},on);
  await follow(true);await page.waitForFunction(()=>VoidBabylon.district.streetPair.stats().escort?.her?.phase==='walk',null,{timeout:120000,polling:250});log('(1) she leads:',JSON.stringify((await sp()).esc));
  await page.waitForTimeout(3000);await page.screenshot({path:path.join(shots,'03-follow-them-leading.png')});
  await follow(false);await page.waitForFunction(()=>VoidBabylon.district.streetPair.stats().escort?.her?.phase==='wait',null,{timeout:120000,polling:250});const w1=(await sp()).esc;log('(1) player stopped, she waits:',JSON.stringify(w1));
  await page.waitForTimeout(2000);const w2=(await sp()).esc;assert.ok(Math.abs(w2.x-w1.x)<.05,'she stays while waiting');assert.match(await page.evaluate(()=>document.body.innerText),/waits for you to catch up/);await page.screenshot({path:path.join(shots,'04-follow-them-waiting.png')});
  await follow(true);await page.waitForFunction(()=>VoidBabylon.district.streetPair.stats().escort?.her?.phase==='walk',null,{timeout:120000,polling:250});log('(1) caught up: she walks on');
  await page.waitForFunction(id=>Object.keys(state.universe.missions[id]?.objectives||{}).length>=1,step1,{timeout:600000,polling:500});
  await follow(false);let r=await rec();log('(1) done:',JSON.stringify(r.objectives));assert.equal(Object.keys(r.objectives).length,1);
  // (2) THEY FOLLOW YOU: the player walks west to the LAUNDRY spot at walking pace; she follows behind
  await page.waitForFunction(()=>/they-follow/.test(VoidBabylon.district.streetPair.stats().escort?.her?.key||''),null,{timeout:60000,polling:250});
  const lead=(tx,tz,v=.25)=>page.evaluate(([tx,tz,v])=>{clearInterval(globalThis.__l);globalThis.__l=setInterval(()=>{const dx=tx-walker.x,dz=tz-walker.z,d=Math.hypot(dx,dz);if(d<.05){clearInterval(globalThis.__l);return;}const s=Math.min(d,v);walker.x+=dx/d*s;walker.z+=dz/d*s;walker.yaw=Math.atan2(dx,dz);},100);},[tx,tz,v]);
  await page.evaluate(()=>{walker.z=-6.9;});await lead(103.5,-6.9);let gaps=[];
  for(let i=0;i<60;i++){await page.waitForTimeout(1000);const s=await sp(),d=Math.hypot(s.her.x-await page.evaluate(()=>walker.x),s.her.z-await page.evaluate(()=>walker.z));gaps.push(+d.toFixed(1));if(i===6)await page.screenshot({path:path.join(shots,'05-they-follow-you.png')});if(Object.keys((await rec()).objectives).length>=2)break;}
  log('(2) gaps behind the player (m):',gaps.join(' '));r=await rec();assert.equal(Object.keys(r.objectives).length,2,'they-follow done');assert.ok(Math.max(...gaps.slice(2))<8,'she kept up');
  // (3) THEY CALL A CAB: she goes to the kerb and calls it; it waits; she gets in; the player boards; both ride; both get out at Function Gate
  await page.waitForFunction(()=>/their-cab/.test(VoidBabylon.district.streetPair.stats().escort?.her?.key||''),null,{timeout:60000,polling:250});
  await page.waitForFunction(()=>VoidBabylon.district.streetPair.stats().escort?.her?.phase==='in-cab',null,{timeout:600000,polling:500});log('(3) she is in the cab:',JSON.stringify(await page.evaluate(()=>VoidRoadTaxi.status())));
  await page.evaluate(()=>{const c=VoidRoadTaxi.world.job.cab,d=VoidRoadTaxiRules.doorPoints(c)[0];Object.assign(walker,{x:d.x,z:d.z,yaw:Math.atan2(c.x-d.x,c.z-d.z)});});await page.waitForTimeout(1200);
  await page.screenshot({path:path.join(shots,'06-their-cab-she-is-in.png')});
  const credits0=await page.evaluate(()=>state.credits);await page.evaluate(()=>VoidRoadTaxi.board());assert.equal(await page.evaluate(()=>mode),'road-taxi','the player boards');
  await page.waitForTimeout(2500);await page.screenshot({path:path.join(shots,'07-riding-together.png')});
  const seat=await page.evaluate(()=>{const s=VoidBabylon.district.streetPair.stats(),c=VoidRoadTaxi.world.job.cab;return {her:[s.her.x,s.her.z],cab:[c.x,c.z],clip:s.her.clip};});log('(3) riding:',JSON.stringify(seat));assert.ok(Math.hypot(seat.her[0]-seat.cab[0],seat.her[1]-seat.cab[1])<1.2,'she rides in the cab');assert.equal(seat.clip,'sit');
  await page.waitForFunction(()=>VoidRoadTaxi.world?.job?.cab?.phase==='arrived',null,{timeout:600000,polling:500});await page.evaluate(()=>VoidRoadTaxi.exit());
  await page.waitForFunction(id=>Object.keys(state.universe.missions[id]?.objectives||{}).length>=3,step1,{timeout:60000,polling:250});
  const out=await page.evaluate(()=>{const s=VoidBabylon.district.streetPair.stats();return {her:[+s.her.x.toFixed(1),+s.her.z.toFixed(1)],me:[+walker.x.toFixed(1),+walker.z.toFixed(1)],mode,credits:state.credits};});log('(3) both out at Function Gate:',JSON.stringify(out),'fare paid',credits0-out.credits);
  assert.ok(Math.abs(out.her[0]-20)<12&&Math.abs(out.me[0]-20)<12,'both at Function Gate');await page.waitForTimeout(1200);await page.screenshot({path:path.join(shots,'08-their-cab-both-out.png')});
  // (4) YOU CALL A CAB, THEY RIDE ALONG: the player calls a cab to East Gate; she follows and gets in; both out there
  await page.waitForFunction(()=>/shared-cab/.test(VoidBabylon.district.streetPair.stats().escort?.her?.key||''),null,{timeout:60000,polling:250});
  await page.waitForFunction(()=>VoidBabylon.district.streetPair.stats().escort?.her?.phase==='follow',null,{timeout:60000,polling:250});
  assert.equal(await page.evaluate(()=>VoidRoadTaxi.hail('east-gate')),true,'the player calls a cab');
  await page.waitForFunction(()=>VoidBabylon.district.streetPair.stats().escort?.her?.phase==='in-cab',null,{timeout:600000,polling:500});log('(4) she got in');
  await page.evaluate(()=>{const c=VoidRoadTaxi.world.job.cab,d=VoidRoadTaxiRules.doorPoints(c)[0];Object.assign(walker,{x:d.x,z:d.z});});await page.waitForTimeout(500);await page.evaluate(()=>VoidRoadTaxi.board());
  await page.waitForFunction(()=>VoidRoadTaxi.world?.job?.cab?.phase==='arrived',null,{timeout:600000,polling:500});await page.screenshot({path:path.join(shots,'09-shared-cab-arrived.png')});await page.evaluate(()=>VoidRoadTaxi.exit());
  await page.waitForFunction(id=>state.universe.missions[id]?.completed===true,step1,{timeout:60000,polling:250});
  const end=await page.evaluate(()=>{const s=VoidBabylon.district.streetPair.stats();return {her:[+s.her.x.toFixed(1),+s.her.z.toFixed(1)],me:[+walker.x.toFixed(1),+walker.z.toFixed(1)],flag:state.story.flags.npcEsc??null,plan:s.her.plan};});log('(4) mission complete:',JSON.stringify(end));
  assert.ok(Math.abs(end.her[0]-134)<12,'she got out at East Gate');assert.equal(end.flag,null,'the save flag is cleared');await page.waitForTimeout(1500);await page.screenshot({path:path.join(shots,'10-shared-cab-both-out.png')});
  log('escort log:',JSON.stringify(await page.evaluate(()=>VoidLiveContent.escortLog().map(e=>e.event))));
  log('page errors:',errors.length?errors.slice(0,5):'none');
 }catch(e){console.log('[npc-escort] page errors at failure:',errors.slice(0,8));try{const pg=browser.contexts()[0].pages()[0];console.log(JSON.stringify(await pg.evaluate(()=>({mode,esc:VoidBabylon.district?.streetPair?.stats?.().escort,her:VoidBabylon.district?.streetPair?.stats?.().her,taxi:VoidRoadTaxi.status(),log:VoidLiveContent.escortLog().slice(-8)}))));await pg.screenshot({path:path.join(shots,'failure.png')});}catch{}throw e;}finally{await browser.close();}
 if(errors.length)console.log('[npc-escort] page errors:',errors.slice(0,8));
})().catch(e=>{console.error(e);process.exit(1);});
