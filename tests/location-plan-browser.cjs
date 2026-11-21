/* The Location card's plan and the street-door map in a real browser (offline; the owner, 20 Nov 2026: a "hallway + apartment" location showed an EMPTY plan; "when I'm
   selecting a number it should show me the door numbers on the street"). A mission is made with the wizard and opened in BLOCKS; + ADD A BLOCK › Location; the street-door
   map is open (no door yet): its numbered doors, hover names one, a click on a marker chooses it (the list follows); Add › Housing › Rundown apartment gives the hallway and
   the apartment, and the plan draws BOTH tiles and the dashed connector "hallway door … → apartment entry" (pixels checked); the summary line; folded and unfolded; then
   the FORM view shows the same card and plan. Screenshots (SHOTS=dir). Usage: node tests/serve-modern.cjs, then node tests/location-plan-browser.cjs (SITE_TEST_URL, SHOTS,
   BROWSER_EXECUTABLE; default the bundled Chromium, software GL). */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shots=process.env.SHOTS||null;if(shots)fs.mkdirSync(shots,{recursive:true});
const bundled=fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',exe=process.env.BROWSER_EXECUTABLE||(fs.existsSync(bundled)?bundled:null);
const log=(...a)=>console.log('[location-plan]',...a);
const shot=async(loc,name)=>{if(shots)await loc.screenshot({path:path.join(shots,name),timeout:180000});};
// how much of a canvas region is lit (not the dark background / grid)
const lit=(cv,box)=>cv.evaluate((c,b)=>{const g=c.getContext('2d'),d=g.getImageData(b[0],b[1],b[2],b[3]).data;let n=0;for(let i=0;i<d.length;i+=4)if(d[i]+d[i+1]+d[i+2]>150)n++;return n;},box);
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'],...(exe?{executablePath:exe}:{})});const errors=[];
 try{
  const page=await (await browser.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'})).newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
  await page.route('**/api/**',r=>{const p=new URL(r.request().url()).pathname.replace('/api/void-runner/','');if(p==='live-content')return r.fulfill({status:404,contentType:'application/json',body:'{"error":"off"}'});return r.fulfill({status:503,contentType:'application/json',body:'{"error":"offline test"}'});});
  const boot=()=>page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:180000});
  await page.goto(base+'/void-runner.html');await boot();
  await page.evaluate(()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;localStorage.setItem('void-runner-campaign-v1',JSON.stringify({...s,savedAt:1700000000000}));localStorage.setItem('editor-tour-done','1');for(const k of ['editor-mode','mission-editor-drafts-v1','mission-editor-view'])localStorage.removeItem(k);});
  await page.reload();await boot();await page.evaluate(()=>VoidDevTools.identity(async p=>{if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1,preset:'NORMAL'};const e=new Error('off');e.status=404;throw e;}));
  const before=await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1'));
  // ---- the wizard: a mission with Lace, opened in Blocks
  await page.evaluate(()=>VoidDevTools.open());await page.waitForSelector('[data-eh-task="make"]',{timeout:60000});await page.locator('[data-eh-task="make"]').click();
  await page.locator('[data-eh-template="talk"]').click();await page.waitForSelector('[data-eh-page="giver"]');await page.locator('[data-eh-giver="ethereal-lace"]').click();await page.locator('[data-eh-next]').click();
  await page.waitForSelector('[data-eh-page="start"]');await page.locator('[data-eh-start="person"]').click();await page.locator('[data-eh-next]').click();
  await page.waitForSelector('[data-eh-page="steps"]');await page.locator('[data-eh-step-npc="0"]').selectOption('ethereal-lace');
  // the wizard's own apartment door choice has the map too
  const addApt=page.locator('[data-eh-apt-add]');if(await addApt.count()){await addApt.click();await page.waitForSelector('[data-door-map="wizard-apt"]',{timeout:20000});const wm=page.locator('[data-door-map="wizard-apt"]');
   assert.ok((await wm.locator('canvas').getAttribute('data-door-map-doors')).split(' ').length>5,'the wizard map shows the doors');await shot(wm,'00-wizard-door-map.png');await page.locator('[data-eh-apt-remove]').click();log('wizard: door map shown');}
  await page.locator('[data-eh-next]').click();
  await page.waitForSelector('[data-eh-page="reward"]');await page.locator('[data-eh-next]').click();
  await page.waitForSelector('[data-eh-page="name"]');await page.locator('[data-eh-title]').fill('TEST: location plan');await page.locator('[data-eh-offer]').fill('TEST LINE: a job.');
  await page.locator('[data-eh-next]').click();await page.waitForSelector('[data-eh-done]');const mid=await page.locator('[data-eh-done]').getAttribute('data-eh-done');
  await page.locator('[data-eh-open="'+mid+'"]').click();const card=page.locator('[data-me-tree-mission="'+mid+'"]');await card.waitFor();const root=card.locator('[data-mb-mission="'+mid+'"]');await root.waitFor({timeout:30000});log('opened in Blocks',mid);
  const draft=()=>page.evaluate(id=>JSON.parse(localStorage.getItem('mission-editor-drafts-v1')).trees.flatMap(t=>t.missions).find(m=>m.id===id),mid);
  // ---- + ADD A BLOCK › Location
  await root.locator('[data-me-add-step="'+mid+'"]').click();await root.locator('[data-mb-pick="apartment"]').click();await root.locator('[data-mb-choose="location"]').click();
  const locCard=root.locator('[data-mod-loc="l1"]');await locCard.waitFor({timeout:30000});
  // the street-door map: open while no door is chosen; numbered doors; hover; click a marker
  const map=locCard.locator('[data-door-map]');await map.waitFor();const cv=map.locator('canvas');
  const doors=(await cv.getAttribute('data-door-map-doors')).split(' ').filter(Boolean);assert.ok(doors.length>5,'the map shows the doors of the part of town');
  await map.locator('[data-door-map-area]').selectOption('oldtown');const pts=await map.evaluate(w=>w.points());const want=pts.find(p=>p.id.startsWith('apt-'))||pts[0];
  await cv.scrollIntoViewIfNeeded();const bb=await cv.boundingBox(),W=await cv.evaluate(c=>[c.width,c.height]);const at={x:bb.x+want.x*bb.width/W[0],y:bb.y+want.y*bb.height/W[1]};
  await shot(map,'01a-door-map.png');log('at',JSON.stringify(at),JSON.stringify(bb),W,JSON.stringify(want),await page.evaluate(p=>{const e=document.elementFromPoint(p.x,p.y);return e&&(e.tagName+'.'+e.className);},at));await page.mouse.move(at.x,at.y);const tip=await map.locator('[data-door-map-tip]').textContent();log('hover:',tip);assert.match(tip,/^No\. \d+, .* — /);
  await shot(map,'01-door-map-hover.png');
  await page.mouse.click(at.x,at.y);await page.waitForTimeout(400);let d=await draft();assert.equal(d.apartments[0].door,want.id,'a click on the map chose that door');
  assert.equal(await locCard.locator('select[data-me-apt-door]').inputValue(),want.id,'the list follows the map');log('chose on the map:',want.id);
  // ---- Add › Housing › Rundown apartment (the owner's case)
  await locCard.locator('[data-mod-cat]').selectOption('housing');await locCard.locator('[data-mod-type]').selectOption('apt-rundown');await locCard.locator('[data-mod-add]').click();await page.waitForTimeout(400);
  d=await draft();const L=d.apartments[0];log('location:',JSON.stringify(L));assert.deepEqual(L.modules.map(x=>x.type),['hall-rundown','apt-rundown']);assert.equal(L.links.length,1);
  const checkPlan=async(where,host)=>{const c=host.locator('canvas[data-mod-plan]');await c.waitFor();const tiles=(await c.getAttribute('data-mod-tiles')).split(' ');
   assert.deepEqual(tiles.sort(),['flat','hall'],where+': the plan draws the hallway and the apartment');assert.equal(await c.getAttribute('data-mod-links'),L.links[0].a+'>'+L.links[0].b,where+': the connector');
   const n=await lit(c,[0,0,300,240]);assert.ok(n>2500,where+': the plan is drawn ('+n+' lit pixels)');
   assert.match(await host.locator('[data-mod-summary]').textContent(),/^Street door No\. \d+, .* → Rundown hallway → Rundown apartment \d+$/);
   assert.match(await host.locator('[data-mod-problems]').textContent(),/Everything fits/);return n;};
  await locCard.locator('[data-mod-floor="0"]').waitFor();const n1=await checkPlan('Blocks',locCard);log('Blocks plan lit',n1,'·',await locCard.locator('[data-mod-summary]').textContent());
  assert.match(await locCard.locator('[data-mod-link]').first().textContent(),/hallway door \d+ ↔ apartment entry/);
  await locCard.locator('.mod-plan-row').scrollIntoViewIfNeeded();await shot(locCard.locator('.mod-plan-row'),'02-blocks-plan.png');await locCard.locator('div[data-mod-links]').scrollIntoViewIfNeeded();await shot(locCard.locator('div[data-mod-links]'),'02b-blocks-connections.png');
  // click the apartment tile on the plan: selected, the portal note
  const pc=locCard.locator('canvas[data-mod-plan]');await pc.scrollIntoViewIfNeeded();const pb=await pc.boundingBox();const tl=await page.evaluate(L=>VoidModuleEditor.planLayout(L,0),L);
  {let {x0,x1,z0,z1}=tl;x0-=2;x1+=2;z0-=2;z1+=2;const sc=Math.min(300/(x1-x0),240/(z1-z0)),ox=(300-(x1-x0)*sc)/2,oz=(240-(z1-z0)*sc)/2,f=tl.tiles.find(t=>t.id==='flat');
   await page.mouse.click(pb.x+(ox+(f.x+f.w/2-x0)*sc)*pb.width/300,pb.y+(240-(oz+(f.z+f.d/2-z0)*sc))*pb.height/240);}
  await locCard.locator('[data-mod-portal-note="flat"]').waitFor({timeout:10000});await locCard.locator('.mod-plan-row').scrollIntoViewIfNeeded();await shot(locCard.locator('.mod-plan-row'),'03-blocks-apartment-selected.png');await locCard.locator('[data-mod-picker]').scrollIntoViewIfNeeded();await shot(locCard.locator('[data-mod-picker]'),'03b-add-picker.png');
  // folded, then unfolded: still drawn
  const blk=root.locator('article[data-mb-type="apartment"]').first(),bid=await blk.getAttribute('data-mb-block');await blk.locator('[data-mb-fold="'+bid+'"]').click();await page.waitForTimeout(300);
  await root.locator('[data-mb-fold="'+bid+'"]').click();await page.waitForTimeout(300);await checkPlan('Blocks unfolded',root.locator('[data-mod-loc="l1"]'));log('fold/unfold ok');
  // ---- the Form view: the same card and plan
  await card.locator('[data-mb-view="form"]').click();await page.waitForTimeout(600);const fcard=card.locator('[data-mod-loc="l1"]');await fcard.waitFor({timeout:30000});await fcard.scrollIntoViewIfNeeded();
  const n2=await checkPlan('Form',fcard);log('Form plan lit',n2);await fcard.locator('.me-row').first().scrollIntoViewIfNeeded();await shot(fcard.locator('.me-row').first(),'04a-form-door-row.png');await fcard.locator('.mod-plan-row').scrollIntoViewIfNeeded();await shot(fcard.locator('.mod-plan-row'),'04-form-plan.png');
  {const fm=fcard.locator('[data-door-map]');await fm.locator('[data-door-map-area]').selectOption('avenue');assert.ok((await fm.locator('canvas').getAttribute('data-door-map-doors')).split(' ').length>20,'the Avenue’s doors');await shot(fm,'05-form-map-avenue.png');
   await fm.locator('[data-door-map-area]').selectOption('outskirts').catch(()=>{});}
  assert.equal(JSON.stringify((await draft()).apartments[0]),JSON.stringify(L),'switching views changes nothing');
  assert.equal(await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1')),before,'the real save is untouched');
  assert.deepEqual(errors,[],'no page errors');log('PASS');
 }catch(e){console.error(e);process.exitCode=1;if(errors.length)console.error('page errors:',errors);}finally{await browser.close();}
})();
