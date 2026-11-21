/* NPC appearance editor (queue item 0c, 18 Nov 2026) in a real browser (offline): NPCs > Appearance reads what the loaded file supports, a new look recolours a street
   figure (one-piece Meshy: whole figure, skin kept) live in the 3D preview, a multi-part figure hides an accessory (never its clothing), the creator's pieces are greyed
   with the reason where the skeleton does not fit, UNDO works, "which look the crowd wears" is saved, and SEE IT ON THE STREET plays the draft on The Avenue where the
   figures wear it (and a multi-part figure placed through the game's own crowd code loses its headset). The model files are never changed.
   Usage: node tests/serve-modern.cjs, then node tests/npc-looks-browser.cjs (SITE_TEST_URL, SHOTS=dir, PART=editor, BROWSER_EXECUTABLE; default the bundled Chromium, software GL). */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shots=process.env.SHOTS||null,PART=process.env.PART||'all';if(shots)fs.mkdirSync(shots,{recursive:true});
const bundled=fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',exe=process.env.BROWSER_EXECUTABLE||(fs.existsSync(bundled)?bundled:null);
const log=(...a)=>console.log('[npc-looks]',...a);
const shot=async(t,name)=>{if(shots)await t.screenshot({path:path.join(shots,name)});};
const hashes=()=>{const crypto=require('node:crypto'),dir=path.join(__dirname,'..','void-runner/assets/models/crowd');return Object.fromEntries(['npc-casual-f.glb','vr-player-a.glb'].map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(path.join(dir,f))).digest('hex')]));};
(async()=>{
 const before=hashes(),browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'],...(exe?{executablePath:exe}:{})});const errors=[];
 try{
  const ctx=await browser.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'}),page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
  await page.route('**/api/**',r=>{const p=new URL(r.request().url()).pathname.replace('/api/void-runner/','');if(p==='live-content')return r.fulfill({status:404,contentType:'application/json',body:'{"error":"off"}'});return r.fulfill({status:503,contentType:'application/json',body:'{"error":"offline test"}'});});
  const boot=()=>page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:180000});
  const dev=()=>page.evaluate(()=>VoidDevTools.identity(async p=>{if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1,preset:'NORMAL'};const e=new Error('Switched off in this offline test');e.status=404;throw e;}));
  await page.goto(base+'/void-runner.html');await boot();
  await page.evaluate(()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;localStorage.setItem('void-runner-campaign-v1',JSON.stringify({...s,savedAt:1700000000000}));for(const k of ['mission-editor-drafts-v1','npc-editor-advanced'])localStorage.removeItem(k);localStorage.setItem('editor-tour-done','1');});
  await page.reload();await boot();await dev();
  await page.evaluate(()=>VoidDevTools.open('home'));await page.waitForSelector('[data-eh-cards]',{timeout:90000});
  const looks=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('mission-editor-drafts-v1')||'{}').looks||{});
  const open=async id=>{await page.evaluate(id=>{VoidDevTools.npcFocus=id;VoidDevTools.open('npcs');},id);await page.waitForSelector('[data-npc-appearance="'+id+'"]',{timeout:90000});};
  const A=id=>page.locator('[data-npc-appearance="'+id+'"]');
  // ---- a one-piece street figure: whole-figure colour only; pieces greyed with the reason
  const cf='crowd:npc-casual-f';await open(cf);assert.equal(await A(cf).locator('[data-npc-look-start]').count(),1,'asks for the 3D preview first');
  await A(cf).locator('[data-npc-look-start]').click();await page.waitForSelector('[data-npc-look-pick="npc-casual-f"]',{timeout:180000});
  await A(cf).locator('[data-npc-look-new]').click();await page.waitForSelector('[data-npc-look-colours="npc-casual-f"]');
  assert.deepEqual(await A(cf).locator('[data-npc-look-colour]').evaluateAll(r=>r.map(x=>x.dataset.npcLookColour)),['*'],'one material: the whole figure');
  assert.match(await A(cf).locator('[data-npc-look-parts]').textContent(),/made in one piece/);
  assert.match(await A(cf).locator('[data-npc-look-pieces-locked]').textContent(),/creator’s skeleton/);assert.equal(await A(cf).locator('[data-npc-look-gear="gear-visor"]').isDisabled(),true);
  await A(cf).locator('[data-npc-look-swatch="crimson"]').first().click();await page.waitForTimeout(300);
  await A(cf).locator('[data-npc-look-name]').fill('Red night');await A(cf).locator('[data-npc-look-name]').press('Enter');await page.waitForTimeout(300);
  await A(cf).locator('[data-npc-look-use="look-1"]').check();await page.waitForTimeout(300);
  let lk=await looks();log('draft looks:',JSON.stringify(lk));assert.deepEqual(lk['npc-casual-f'],{looks:[{id:'look-1',name:'Red night',colour:{'*':{tint:'#8c1f2b'}}}],use:'look-1'});
  const prevMat=await page.evaluate(()=>{const n=document.querySelector('.npc-preview-canvas');const s=BABYLON.EngineStore.Instances.map(e=>e.scenes).flat().find(sc=>sc.getEngine().getRenderingCanvas()===n);const m=s.meshes.find(x=>x.material&&/~look-/.test(x.material.name));return m?m.material.name:null;});
  log('preview material:',prevMat);assert.ok(prevMat,'the preview wears the look (a variant material)');await page.waitForTimeout(800);await shot(A(cf),'01-street-figure-recoloured.png');await shot(page.locator('[data-npc-preview="'+cf+'"]'),'01b-preview-recoloured.png');
  // UNDO / REDO
  await page.locator('[data-dev="undo"]').click();await page.waitForTimeout(300);assert.equal((await looks())['npc-casual-f'].use,'original','UNDO takes the choice back');
  await page.locator('[data-dev="redo"]').click();await page.waitForTimeout(300);assert.equal((await looks())['npc-casual-f'].use,'look-1','REDO');
  // ---- a multi-part figure: hide an accessory; clothing stays
  const vr='crowd:vr-player-a';await open(vr);await A(vr).locator('[data-npc-look-start]').click();await page.waitForSelector('[data-npc-look-pick="vr-player-a"]',{timeout:180000});
  await A(vr).locator('[data-npc-look-new]').click();await page.waitForSelector('[data-npc-look-part]');
  const parts=await A(vr).locator('[data-npc-look-part]').evaluateAll(r=>r.map(x=>x.dataset.npcLookPart));log('hideable:',parts.join(', '));
  assert.ok(parts.includes('vr_player_a.headset0'));assert.ok(!parts.some(p=>/suit|body|shoes|eyebrow/.test(p)),'clothing, body and face are not offered');
  assert.match(await A(vr).locator('[data-npc-look-parts]').textContent(),/Clothing that covers the body, the body and the face always stay/);
  await A(vr).locator('[data-npc-look-part="vr_player_a.headset0"]').uncheck();await page.waitForTimeout(400);
  lk=await looks();assert.deepEqual(lk['vr-player-a'].looks[0].hide,['vr_player_a.headset0','vr_player_a.headset0.lens','vr_player_a.headset0.strap']);
  const hiddenPrev=await page.evaluate(()=>{const n=document.querySelector('.npc-preview-canvas');const s=BABYLON.EngineStore.Instances.map(e=>e.scenes).flat().find(sc=>sc.getEngine().getRenderingCanvas()===n);return s.meshes.filter(m=>/headset0/.test(m.name)).map(m=>m.isEnabled(false));});
  assert.deepEqual(hiddenPrev,[false,false,false],'the headset is hidden in the preview');
  await A(vr).locator('[data-npc-look-colour="vr_player_a.male_casualsuit03"] [data-npc-look-swatch="teal"]').click();await page.waitForTimeout(300);   // the suit
  assert.deepEqual(await A(vr).locator('[data-npc-look-colour]').evaluateAll(r=>r.map(x=>x.dataset.npcLookColour)),['vr_player_a.trackers1.Left','vr_player_a.headset0','vr_player_a.trackers1.Right','vr_player_a.male_casualsuit03','vr_player_a.shoes01','vr_player_a.short02']);
  lk=await looks();log('vr look:',JSON.stringify(lk['vr-player-a']));assert.equal(Object.keys(lk['vr-player-a'].looks[0].colour).length,1);
  await A(vr).locator('[data-npc-look-use="look-1"]').check();await page.waitForTimeout(300);await page.waitForTimeout(800);await shot(A(vr),'02-multipart-headset-hidden.png');await shot(page.locator('[data-npc-preview="'+vr+'"]'),'02b-preview-headset-hidden.png');
  // the whole draft passes the publish check (browser copy)
  const content=await page.evaluate(()=>VoidMissionEditor.draftContent());assert.deepEqual(Object.keys(content.looks).sort(),['npc-casual-f','vr-player-a']);
  assert.deepEqual(await page.evaluate(c=>VoidMissionContent.check({format:c.format,version:c.version,looks:c.looks},{}).errors,content),[]);
  if(PART==='editor'){log('editor part done');assert.deepEqual(errors,[]);return;}
  // ---- SEE IT ON THE STREET: the draft is played on The Avenue; the street figures wear the look
  await open(cf);await page.evaluate(()=>{try{VoidGraphics.quality='low';VoidBabylon.setQuality('low');}catch{}});
  await A(cf).locator('[data-npc-look-street]').click();
  await page.waitForFunction(()=>!document.getElementById('dev-test-banner').hidden&&mode==='walking'&&walkingLocation?.quarter==='avenue',null,{timeout:900000,polling:200});
  assert.deepEqual(await page.evaluate(()=>Object.keys(VoidLiveContent.env.looks||{}).sort()),['npc-casual-f','vr-player-a'],'the draft is in force');
  await page.waitForFunction(()=>VoidBabylon.scene.meshes.some(m=>/^crowd:npc-casual-f-/.test(m.name)&&m.material&&/~look-/.test(m.material.name)),null,{timeout:600000,polling:1000});
  const worn=await page.evaluate(()=>{const ms=VoidBabylon.scene.meshes.filter(m=>/^crowd:npc-casual-f-/.test(m.name)&&m.getTotalVertices()>0);return {all:ms.length,look:ms.filter(m=>m.material&&/~look-/.test(m.material.name)).length,mats:new Set(ms.map(m=>m.material&&m.material.name)).size};});
  log('casual-f figures on the street:',JSON.stringify(worn));assert.ok(worn.look>=1&&worn.look===worn.all,'every casual-f figure wears the look');assert.equal(worn.mats,1,'one shared material for all of them');
  await page.evaluate(()=>{const m=VoidBabylon.scene.meshes.find(m=>/^crowd:npc-casual-f-/.test(m.name)&&m.getTotalVertices()>0);let n=m;while(n.parent)n=n.parent;const p=m.getAbsolutePosition();Object.assign(walker,{x:p.x-3,z:p.z+.4,yaw:Math.PI/2});});
  await page.waitForTimeout(2500);await shot(page,'03-street-figure-wears-look.png');
  // a multi-part figure placed through the game's own crowd code: its headset is off, its clothing on; a player figure is never dressed
  const r=await page.evaluate(async()=>{const sc=VoidBabylon.scene;await VoidCharacterAssembler.ensureLook('vr-player-a',sc);const out={};
   for(const [tag,name] of [['npc','look-test'],['player','character:look-test']]){const holder=new BABYLON.TransformNode(name,sc);holder.position.set(walker.x+Math.sin(walker.yaw)*2.4+(tag==='npc'?0:1),0,walker.z+Math.cos(walker.yaw)*2.4-1.2);holder.rotation.y=walker.yaw+Math.PI;const n=VoidAssets.instance('crowd:vr-player-a',holder);VoidCrowd.animate(n,'vr-player-a','idle');
    const ms=n.getChildMeshes(false);out[tag]={look:n.metadata.npcLook||null,headset:ms.filter(m=>/headset0/.test(m.name)).map(m=>m.isEnabled(false)),suit:ms.filter(m=>/casualsuit/.test(m.name)).map(m=>m.isEnabled(false)),suitMat:(ms.find(m=>/casualsuit/.test(m.name))||{}).material?.name};if(tag==='player')holder.dispose();}
   return out;});
  log('multi-part in game:',JSON.stringify(r));assert.equal(r.npc.look,'look-1');assert.ok(r.npc.headset.length&&r.npc.headset.every(x=>x===false));assert.ok(r.npc.suit.every(x=>x===true));assert.match(r.npc.suitMat,/~look-/);
  assert.equal(r.player.look,null,'a player figure is never dressed in an NPC look');assert.ok(r.player.headset.every(x=>x===true));
  await page.waitForTimeout(1500);await shot(page,'04-multipart-in-game.png');
  assert.deepEqual(hashes(),before,'the model files are unchanged');
  log('page errors:',errors.length?errors.slice(0,5):'none');assert.deepEqual(errors,[]);log('ok');
 }catch(e){console.log('[npc-looks] page errors at failure:',errors.slice(0,8));try{const pg=browser.contexts()[0].pages()[0];if(shots)await pg.screenshot({path:path.join(shots,'failure.png')});}catch{}throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
