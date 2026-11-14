/* The cyberpunk gear in the REAL character creator (docs/development/CHARACTER_GEAR.md), in a real browser (Chromium + SwiftShader).
   Drives the creator by clicking its buttons and checks the real scene after each click:
     - each of the four pieces toggles on its own; nothing else changes (other pieces, native hat, hair, colours);
     - the visor hides the outfit's own eyewear and the tech collar its own collar, only while on; switching the gear off brings the original back;
     - changing outfit or body keeps the chosen gear, disposes the old character completely and puts the gear on the NEW character's skeleton;
     - save and reload: the gear is in the saved appearance, valid, and read back by a fresh page; an appearance without gear still loads without any;
     - screenshots (SHOTS=dir): male and female with all four, the outfits that matter (CYBORG, OUTLAW, PILOT, HOST, NETRUNNER, WORKER, TRADER), gear off again,
       and gear on characters playing walk, talk, sit and dance in the District;
     - cost: triangles, draw calls and render time with and without gear (render time here is the SOFTWARE renderer: only the difference between rows means anything).
   SITE_TEST_URL=http://127.0.0.1:5187 SHOTS=/some/dir node tests/character-gear-creator-browser.cjs */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shots=process.env.SHOTS||null,GEAR=['gear-visor','gear-collar','gear-shoulders','gear-chest'],report={};
(async()=>{
 const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
 const page=await b.newPage({viewport:{width:1280,height:720},serviceWorkers:'block'});page.setDefaultTimeout(90000);const errs=[];page.on('pageerror',e=>errs.push(e.message));
 await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
 await page.addInitScript(()=>localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:'high'})));
 await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started);
 await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:120000,assets:120000,optional:60000}));
 await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');const c=page.locator('[data-action=menu-new-confirm]');if(await c.count())await c.click();
 await page.waitForSelector('#character-creator.on');await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]').disabled);await page.waitForTimeout(1500);
 const btn=(k,v)=>page.locator('[data-cc="'+k+'"][data-v="'+v+'"]');
 const pressed=async(k,v)=>(await btn(k,v).getAttribute('aria-pressed'))==='true';
 const gearState=()=>Promise.all(GEAR.map(g=>pressed('acc',g)));
 const holderInfo=look=>page.evaluate(look=>{const S=VoidBabylon.scene,h=S.getTransformNodeByName('character:'+look);if(!h)return null;const ms=h.getChildMeshes(),g=ms.filter(m=>/^gear:/.test(m.name)&&!m.isDisposed()),body=ms.find(m=>m.skeleton&&!/^gear:/.test(m.name));
  const nat=n=>ms.filter(m=>new RegExp(n,'i').test(m.name)&&!/^gear:/.test(m.name)).map(m=>m.isEnabled());
  return {gear:g.length,tris:g.reduce((t,m)=>t+m.getTotalIndices()/3,0),underHolder:g.every(m=>m.isDescendantOf(h)),sameSkeleton:g.every(m=>m.skeleton===body.skeleton),eyewear:nat('shades0|visor0'),collar:nat('collar[0-9]'),holders:S.transformNodes.filter(n=>/^character:/.test(n.name)&&!n.isDisposed()).map(n=>n.name)};},look);
 const waitGear=(look,n)=>page.waitForFunction(([look,n])=>{const h=VoidBabylon.scene.getTransformNodeByName('character:'+look);return !!h&&h.getChildMeshes().filter(m=>/^gear:/.test(m.name)&&!m.isDisposed()).length===n;},[look,n]);
 const waitLook=look=>page.waitForFunction(look=>!!VoidBabylon.scene.getTransformNodeByName('character:'+look),look);
 // the preview spins by itself: stop it and turn the character to face the camera (spin 0), using the creator's own arrow keys (0.15 rad each), so every picture is a front view
 const faceFront=async()=>{if((await page.locator('[data-cc=auto]').getAttribute('aria-pressed'))==='true')await page.locator('[data-cc=auto]').click();
  const r=await page.evaluate(()=>{const h=[...VoidBabylon.scene.transformNodes].find(n=>/^character:/.test(n.name)&&!n.isDisposed());return h?h.parent.rotation.y:0;});
  const target=Math.round(r/(2*Math.PI))*2*Math.PI,steps=Math.round((target-r)/.15);await page.locator('#character-creator .cc-panel').click({position:{x:5,y:5},force:true}).catch(()=>{});
  for(let i=0;i<Math.abs(steps);i++)await page.keyboard.press(steps>0?'ArrowRight':'ArrowLeft');await page.waitForTimeout(400);};
 let shotN=0;const shot=async name=>{if(!shots)return;await faceFront();await page.waitForTimeout(4500);await page.screenshot({path:path.join(shots,name+'.png'),clip:{x:440,y:0,width:840,height:720}});shotN++;};

 // --- the creator starts with no gear
 assert.deepEqual(await gearState(),[false,false,false,false],'no gear pressed at the start');
 let h=await holderInfo('district-smuggler');assert.equal(h.gear,0,'no gear meshes at the start');const nativeEye=h.eyewear;assert(nativeEye.length&&nativeEye.every(Boolean),'the outfit\'s own eyewear is showing');
 assert.equal(await pressed('acc','hat'),true);assert.equal(await pressed('acc','eyewear'),true);
 // set colours first: they must never change
 await btn('clothingColor','black').click().catch(()=>{});await btn('hairColor','magenta').click().catch(()=>{});await btn('hair','short01').click().catch(()=>{});await page.waitForTimeout(1500);
 const colours=await page.evaluate(()=>[...document.querySelectorAll('#character-creator [data-cc=clothingColor],#character-creator [data-cc=hairColor],#character-creator [data-cc=hair]')].filter(x=>x.getAttribute('aria-pressed')==='true').map(x=>x.dataset.cc+':'+x.dataset.v));
 // --- each piece alone
 for(let i=0;i<4;i++){
  await btn('acc',GEAR[i]).click();await waitGear('district-smuggler',2);const st=await gearState();assert.deepEqual(st,GEAR.map((_,j)=>j===i),'only '+GEAR[i]+' is on');
  h=await holderInfo('district-smuggler');assert(h.underHolder&&h.sameSkeleton,'gear is part of this character and on its skeleton');assert(h.tris>0&&h.tris<=300,GEAR[i]+' triangles '+h.tris);
  if(GEAR[i]==='gear-visor'){assert.equal(await pressed('acc','eyewear'),false,'the visor replaces eyewear');assert(h.eyewear.every(x=>!x),'native eyewear hidden only while the visor is on');}
  else{assert.equal(await pressed('acc','eyewear'),true,'other gear leaves the eyewear alone');assert(h.eyewear.every(Boolean));}
  assert.equal(await pressed('acc','hat'),true,'the hat is untouched');
  await btn('acc',GEAR[i]).click();await waitGear('district-smuggler',0);assert.deepEqual(await gearState(),[false,false,false,false]);
  h=await holderInfo('district-smuggler');assert.equal(await pressed('acc','eyewear'),true,'eyewear back after gear off');assert(h.eyewear.every(Boolean),'the original eyewear shows again');}
 console.log('creator: each of the four pieces switches on and off alone; visor/eyewear swap restores');
 const late=process.env.PHASE==='late';   // PHASE=late: skip the long outfit and screenshot loops and run the saving, reload, cost and animation phases
 if(!late){
 // --- all four, screenshots
 for(const g of GEAR)await btn('acc',g).click();await waitGear('district-smuggler',2);h=await holderInfo('district-smuggler');report.maleAll={tris:h.tris,meshes:h.gear};
 assert.deepEqual(await gearState(),[true,true,true,true]);assert.equal(await pressed('acc','eyewear'),false);
 const after=await page.evaluate(()=>[...document.querySelectorAll('#character-creator [data-cc=clothingColor],#character-creator [data-cc=hairColor],#character-creator [data-cc=hair]')].filter(x=>x.getAttribute('aria-pressed')==='true').map(x=>x.dataset.cc+':'+x.dataset.v));
 assert.deepEqual(after,colours,'hair, hair colour and clothing colour did not change');
 await shot('male-smuggler-all-four');
 // --- other outfits keep the gear, on their own skeleton, old character gone
 const looks=[['hacker-01','male-netrunner-small'],['regular-01','male-worker-small'],['vesper-trader','male-trader-small'],['outlaw-01','male-outlaw'],['cyborg-01','male-cyborg']];let prev='district-smuggler';
 for(const [look,name] of looks){await btn('look',look).click();await waitLook(look);await waitGear(look,2);h=await holderInfo(look);
  assert(!h.holders.includes('character:'+prev),'the previous character ('+prev+') is gone, not left behind with its gear');assert.equal(h.holders.length,1,'exactly one character in the creator: '+h.holders);
  assert(h.underHolder&&h.sameSkeleton,look+' gear is on the new character');assert.deepEqual(await gearState(),[true,true,true,true],look+' keeps all four');
  assert(h.eyewear.every(x=>!x),look+': the outfit\'s own eyewear is hidden under the visor');report[look]={tris:h.tris,meshes:h.gear};await shot(name);prev=look;}
 await btn('acc','gear-visor').click();await waitGear('cyborg-01',2);h=await holderInfo('cyborg-01');console.log('creator: gear survives outfit changes and sits on each new character; old character is disposed');
 // --- outfit back, gear off => the original appearance
 await btn('look','district-smuggler').click();await waitLook('district-smuggler');await waitGear('district-smuggler',2);
 for(const g of GEAR)if(await pressed('acc',g))await btn('acc',g).click();await waitGear('district-smuggler',0);h=await holderInfo('district-smuggler');
 assert.deepEqual(await gearState(),[false,false,false,false]);assert(h.eyewear.every(Boolean),'original eyewear restored');await shot('male-smuggler-gear-off-original');
 // --- female
 await btn('base','female').click();await waitLook('district-resident');for(const g of GEAR)await btn('acc',g).click();await waitGear('district-resident',2);h=await holderInfo('district-resident');assert(h.underHolder&&h.sameSkeleton);report.femaleAll={tris:h.tris,meshes:h.gear};await shot('female-resident-all-four');
 for(const [look,name] of [['ncz-neon','female-neon'],['fixer-01','female-fixer'],['vesper-pilot','female-pilot'],['meridian-bartender','female-host']]){await btn('look',look).click();await waitLook(look);await waitGear(look,2);h=await holderInfo(look);assert(h.underHolder&&h.sameSkeleton,look);assert.deepEqual(await gearState(),[true,true,true,true],look);assert.equal(h.holders.length,1);report[look]={tris:h.tris,meshes:h.gear};await shot(name);}
 console.log('creator: 11 outfits checked with all four pieces on (male 7 incl. smuggler, female 5 incl. resident)');
 }
 // --- save a mixed selection (visor and shoulder plates only, a hairstyle, colours set earlier), then read it back in a fresh page
 if((await btn('base','male').getAttribute('aria-pressed'))!=='true'){await btn('base','male').click();}await waitLook('district-smuggler');
 if((await btn('look','district-smuggler').getAttribute('aria-pressed'))!=='true')await btn('look','district-smuggler').click();
 for(const g of GEAR){const want=g==='gear-visor'||g==='gear-shoulders';if((await pressed('acc',g))!==want)await btn('acc',g).click();}
 await btn('hair','short01').click();await waitGear('district-smuggler',2);await page.waitForTimeout(1500);
 const intended=await page.evaluate(()=>[...document.querySelectorAll('#character-creator [data-cc=acc][aria-pressed=true]')].map(x=>x.dataset.v).sort());
 assert.deepEqual(intended.filter(x=>x.startsWith('gear-')),['gear-shoulders','gear-visor'],'exactly the chosen gear is on in the creator');
 await page.locator('[data-cc=confirm]').click();await page.waitForFunction(()=>mode==='pod-waking'||mode==='walking');
 const saved=await page.evaluate(()=>{const A=VoidCharacterAppearance,keys=Object.keys(localStorage).filter(k=>k.startsWith(A.KEY));const a=keys.length?JSON.parse(localStorage.getItem(keys[0])):null;return {keys,a,valid:a?A.validate(a):false};});
 assert.equal(saved.keys.length,1,'one saved appearance');assert(saved.valid,'the saved appearance is valid');assert.deepEqual(saved.a.accessories.filter(x=>x.startsWith('gear-')).sort(),intended.filter(x=>x.startsWith('gear-')).sort(),'exactly the chosen gear was saved');
 assert.equal(saved.a.look,'district-smuggler');assert.equal(saved.a.hair,'short01');assert.equal(saved.a.clothingColor,'black','clothing colour saved');assert.equal(saved.a.hairColor,'magenta','hair colour saved');report.saved=saved.a;
 await page.reload();await page.waitForFunction(()=>window.VoidStartup?.started);
 const reread=await page.evaluate(()=>{const A=VoidCharacterAppearance,cur=VoidCharacterCreator.current();return {cur,valid:A.validate(cur),gear:cur.accessories.filter(x=>x.startsWith('gear-')).sort()};});
 assert(reread.valid);assert.deepEqual(reread.gear,saved.a.accessories.filter(x=>x.startsWith('gear-')).sort(),'a fresh page reads back the same gear');assert.deepEqual(reread.cur,saved.a,'the whole appearance reads back unchanged');
 console.log('persistence: saved with gear ('+reread.gear.join(', ')+'), valid, and read back unchanged after a reload');
 // an appearance without gear (like every older save) loads with none
 const legacy=await page.evaluate(()=>{const A=VoidCharacterAppearance,old={v:1,base:'female',look:'ncz-neon',hair:'native',hairColor:null,clothingColor:null,accessories:[]};localStorage.setItem(A.KEY+'guest',JSON.stringify(old));const cur=VoidCharacterCreator.current();return {gear:cur.accessories.filter(x=>x.startsWith('gear-')),look:cur.look};});
 assert.deepEqual(legacy.gear,[]);assert.equal(legacy.look,'ncz-neon');console.log('persistence: an older saved character loads with no gear');

 // --- cost, and gear in the District on moving characters (a character with a saved look is never asked to create one again, so forget it first)
 await page.evaluate(()=>{for(const k of Object.keys(localStorage).filter(k=>k.startsWith(VoidCharacterAppearance.KEY)))localStorage.removeItem(k);});
 await page.reload();await page.waitForFunction(()=>window.VoidStartup?.started);
 await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');const c2=page.locator('[data-action=menu-new-confirm]');if(await c2.count())await c2.click();
 await page.waitForSelector('#character-creator.on');await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]').disabled);
 await page.locator('[data-cc=confirm]').click();await page.waitForFunction(()=>mode==='pod-waking'&&walker&&VoidAssets.pending===0);await page.locator('#pod-wake [data-pod=exit]').click();await page.waitForFunction(()=>mode==='walking');
 // stand in the open hallway, looking down it, so characters placed in front of the player are in plain view (at the pod exit the point in front is inside the pod wall)
 await page.evaluate(()=>{const w=VoidNeoChinatown.toWorld(0,40);Object.assign(walker,{x:w.x??w[0],z:w.z??w[1],yaw:Math.PI,pitch:0});});await page.waitForTimeout(5000);
 const cost=await page.evaluate(async()=>{
  const A=VoidCharacterAppearance,S=VoidBabylon.scene,B=BABYLON,inst=new B.SceneInstrumentation(S);inst.captureFrameTime=true;inst.captureRenderTime=true;
  const cam=S.activeCamera,dir=cam.getForwardRay().direction.clone();dir.y=0;dir.normalize();const side=new B.Vector3(dir.z,0,-dir.x),floor=cam.globalPosition.y-1.55,out={};
  const place=(ch,k,dist)=>{const p=cam.globalPosition.add(dir.scale(dist)).add(side.scale(k));ch.node.position.set(p.x,floor,p.z);ch.node.rotation.y=Math.atan2(cam.globalPosition.x-p.x,cam.globalPosition.z-p.z);};
  const read=async label=>{await new Promise(r=>setTimeout(r,2500));const t=S.getActiveMeshes().length;out[label]={drawCalls:inst.drawCallsCounter.current,activeMeshes:t,renderMs:+inst.renderTimeCounter.lastSecAverage.toFixed(2),frameMs:+inst.frameTimeCounter.lastSecAverage.toFixed(2)};};
  const mk=async(look,acc,clip)=>{const holder=new B.TransformNode('cost-'+look,S);const ch=await VoidCharacterAssembler.build({...A.defaults(look),accessories:acc},holder,{scene:S,clip});ch.holder=holder;return ch;};
  await read('baseline (no extra characters)');
  const plain=[],geared=[];const looks=['district-smuggler','hacker-01','regular-01','outlaw-01','district-resident','ncz-neon','fixer-01','vesper-pilot'];
  for(let i=0;i<looks.length;i++){const ch=await mk(looks[i],A.defaults(looks[i]).accessories,'idle');plain.push(ch);place({node:ch.node},-3.5+i,3.2);}
  await read('8 characters, no gear');
  for(let i=0;i<looks.length;i++)await plain[i].set({...A.defaults(looks[i]),accessories:[...A.defaults(looks[i]).accessories.filter(x=>!(x==='eyewear'||x==='collar')),...['gear-visor','gear-collar','gear-shoulders','gear-chest']]});
  await read('8 characters, all four gear pieces each');
  out.gearTrianglesPerCharacter=plain.map(ch=>ch.meshes().filter(m=>/^gear:/.test(m.name)).reduce((t,m)=>t+m.getTotalIndices()/3,0));
  out.gearMeshesPerCharacter=plain.map(ch=>ch.meshes().filter(m=>/^gear:/.test(m.name)).length);
  for(const ch of plain){ch.dispose();ch.holder.dispose();}
  await read('after removing them');
  return out;});
 report.cost=cost;console.log('cost:',JSON.stringify(cost));
 const per=cost['8 characters, all four gear pieces each'].drawCalls-cost['8 characters, no gear'].drawCalls;assert(cost['8 characters, no gear'].drawCalls>cost['baseline (no extra characters)'].drawCalls,'the eight characters really are drawn');report.drawCallsPerCharacterForGear=per/8;assert(per<=8*4,'gear adds at most four draw calls per character (two meshes, each drawn in the main pass and again in the glow-layer pass, like every other glowing thing in the scene): '+per);
 assert(cost.gearMeshesPerCharacter.every(n=>n<=2));
 if(shots){
  const anim=async(set,name)=>{await page.evaluate(async set=>{const A=VoidCharacterAppearance,S=VoidBabylon.scene,B=BABYLON,cam=S.activeCamera,dir=cam.getForwardRay().direction.clone();dir.y=0;dir.normalize();const side=new B.Vector3(dir.z,0,-dir.x),floor=cam.globalPosition.y-1.55;window.__animChars=window.__animChars||[];
   for(const ch of window.__animChars){ch.dispose();ch.__h.dispose();}window.__animChars=[];
   for(let i=0;i<set.length;i++){const [look,clip]=set[i],h=new B.TransformNode('anim-'+look,S);const ch=await VoidCharacterAssembler.build({...A.defaults(look),accessories:['gear-visor','gear-collar','gear-shoulders','gear-chest']},h,{scene:S,clip});ch.__h=h;const k=(i-(set.length-1)/2)*1.3,p=cam.globalPosition.add(dir.scale(2.6)).add(side.scale(k));h.position.set(p.x,floor,p.z);h.rotation.y=Math.atan2(cam.globalPosition.x-p.x,cam.globalPosition.z-p.z)+((clip==='sit')?0:0);window.__animChars.push(ch);}},set);
   await page.waitForTimeout(3500);await page.screenshot({path:path.join(shots,name+'.png')});shotN++;};
  await page.evaluate(()=>{const w=VoidNeoChinatown.toWorld(0,40);Object.assign(walker,{x:w.x??w[0],z:w.z??w[1],yaw:Math.PI,pitch:0});});await page.waitForTimeout(3000);
 await anim([['district-smuggler','walk'],['hacker-01','talk'],['outlaw-01','sit'],['cyborg-01','idle']],'animation-male-walk-talk-sit-idle');
  await anim([['district-resident','dance'],['vesper-pilot','dance'],['fixer-01','walk'],['meridian-bartender','talk']],'animation-female-dance-walk-talk');
  await page.evaluate(()=>{for(const ch of window.__animChars){ch.dispose();ch.__h.dispose();}});
 }
 fs.writeFileSync(path.join(shots||'.','gear-creator-report.json'),JSON.stringify(report,null,1));
 console.log('screenshots taken:',shotN);assert.deepEqual(errs,[],'no page errors');console.log('GEAR CREATOR CHECK PASSED');await b.close();
})().catch(e=>{console.error(String(e.stack||e).slice(0,1200));process.exit(1);});
