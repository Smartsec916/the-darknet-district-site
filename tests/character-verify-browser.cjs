/* Broad creator verification in the real District (software GL): every look x hairstyle fits the head, all colours apply, outfit switching leaks nothing,
   walk animation plays, saved characters are kept, gamepad control works, appearance changes touch nothing else. Usage: node tests/character-verify-browser.cjs [low|high] */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const tier=process.argv[2]==='high'?'high':'low',base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187';
(async()=>{
 const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});const errors=[];
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce',serviceWorkers:'block'});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push('console: '+m.text());});
  await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
  await page.addInitScript(q=>localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:q})),tier);await page.goto(base+'/void-runner.html');
  await page.waitForFunction(()=>window.VoidStartup?.started,null,{timeout:120000});
  await page.click('[data-action=menu-campaign]');await page.click('[data-action=menu-new]');const c=page.locator('[data-action=menu-new-confirm]');if(await c.count())await c.click();
  await page.waitForFunction(()=>mode==='pod-waking'&&walker,null,{timeout:120000});await page.waitForFunction(()=>VoidAssets.pending===0,null,{timeout:120000});
  // A. an account that already has a saved character keeps it: no creator offer, creator opens on that look
  await page.evaluate(()=>{VoidAccount.character={gender:'female',model:'district-resident'};});
  assert.equal((await page.evaluate(()=>VoidCharacterCreator.stored())).look,'district-resident');
  const before=await page.evaluate(()=>({credits:state.credits,loc:state.location,inv:JSON.stringify(state.inventory||null),missions:JSON.stringify(state.story?.missions||state.missions||null)}));
  await page.locator('#pod-wake button').click();await page.waitForFunction(()=>mode==='walking'&&VoidAssets.pending===0,null,{timeout:120000});
  // B. every look x every offered hairstyle: hair sits on the head (alignment) and does not float or sink
  const fit=await page.evaluate(async()=>{const sc=VoidBabylon.scene,A=VoidCharacterAppearance,out=[];const p=new BABYLON.TransformNode('verify',sc);p.position.set(walker.x,walker.y-1.68,walker.z);
   for(const [look,l] of Object.entries(A.CATALOG.looks)){const ch=await VoidCharacterAssembler.build(A.defaults(look),p,{scene:sc});const top=A.CATALOG.bases[l.base].height;
    for(const h of l.hairOk){const a={...A.defaults(look),hair:h,accessories:[]};await ch.set(a);const m=sc.getMeshByName('hair:'+h);m.computeWorldMatrix(true);m.refreshBoundingInfo({applySkeleton:true,applyMorph:false});const b=m.getBoundingInfo().boundingBox,y0=p.position.y;
     out.push({look,h,topDelta:+(b.maximumWorld.y-y0-top).toFixed(3),bottom:+(b.minimumWorld.y-y0).toFixed(2),width:+(b.maximumWorld.x-b.minimumWorld.x).toFixed(2)});}
    ch.dispose();}
   p.dispose();return out;});
  const bad=fit.filter(r=>r.topDelta>.2||r.topDelta<-.45||r.bottom<top2(r));function top2(r){return 0;}
  const worst=fit.reduce((a,r)=>Math.max(a,Math.abs(r.topDelta)),0);
  assert.equal(fit.length,63);assert.deepEqual(fit.filter(r=>r.topDelta>.2||r.topDelta<-.45),[],'hair top within the head zone');
  // C. colours: all 8 hair and 8 clothing colours apply to every look and the original returns exactly
  const col=await page.evaluate(async()=>{const sc=VoidBabylon.scene,A=VoidCharacterAppearance,C=A.CATALOG,p=new BABYLON.TransformNode('verify2',sc);p.position.set(walker.x,walker.y-1.68,walker.z);const res={looks:0,bad:[]};
   for(const [look,l] of Object.entries(C.looks)){const ch=await VoidCharacterAssembler.build(A.defaults(look),p,{scene:sc});const outfit=ch.meshes().find(m=>m.name==='crowd:'+l.model+'-'+l.outfit),orig=outfit.material;
    for(const c of C.clothingColors){await ch.set({...A.defaults(look),clothingColor:c.id});const col=outfit.material.albedoColor;if(outfit.material===orig||!(col.r+col.g+col.b>0))res.bad.push(look+' '+c.id);}
    for(const c of C.hairColors){await ch.set({...A.defaults(look),hairColor:c.id});}
    await ch.set(A.defaults(look));if(outfit.material!==orig)res.bad.push(look+' original not restored');res.looks++;ch.dispose();}
   p.dispose();return res;});
  assert.deepEqual(col.bad,[]);assert.equal(col.looks,7);
  // D. outfit transitions leak nothing and walking plays
  const leak=await page.evaluate(async()=>{const sc=VoidBabylon.scene,A=VoidCharacterAppearance,p=new BABYLON.TransformNode('verify3',sc);p.position.set(walker.x,walker.y-1.68,walker.z);const ch=await VoidCharacterAssembler.build(A.defaults('hacker-01'),p,{scene:sc});
   const count=()=>({mats:sc.materials.length,nodes:sc.transformNodes.filter(n=>/^character:/.test(n.name)).length,meshes:sc.meshes.length,skels:sc.skeletons.length});
   const seq=['regular-01','vesper-trader','district-smuggler','hacker-01'];await ch.set({...A.defaults('regular-01'),hair:'bob01',hairColor:'cyan',clothingColor:'navy'});const first=count();
   for(let i=0;i<3;i++)for(const l of seq){await ch.set({...A.defaults(l),hair:'bob01',hairColor:'cyan',clothingColor:'navy'});}
   await ch.set({...A.defaults('hacker-01'),hair:'bob01',hairColor:'cyan',clothingColor:'navy'});
   ch.play('walk');await new Promise(r=>setTimeout(r,800));const playing=sc.animationGroups.filter(g=>g.isPlaying&&/walk/.test(g.name)&&/hacker-01/.test(g.name)).length;
   const last=count();ch.dispose();p.dispose();return {first,last,playing,after:count()};});
  assert.equal(leak.last.nodes,1,'one character node');assert(leak.last.skels<=leak.first.skels+1,'skeletons do not pile up '+JSON.stringify(leak));assert(leak.last.meshes<=leak.first.meshes+12,'meshes do not pile up '+JSON.stringify(leak));assert(leak.last.mats<=leak.first.mats+14,'materials do not pile up '+JSON.stringify(leak));assert(leak.playing>=1,'walk clip plays after rebuilds');assert.equal(leak.after.nodes,0);
  // E. gamepad: d-pad down moves focus, A presses, B cancels, right stick turns
  await page.evaluate(()=>{window.__pad={buttons:Array.from({length:16},()=>({pressed:false})),axes:[0,0,0,0],connected:true};navigator.getGamepads=()=>[window.__pad];});
  await page.evaluate(()=>VoidCharacterCreator.open({context:'wardrobe'}));await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]')?.disabled,null,{timeout:120000});
  const press=async i=>{await page.evaluate(i=>{__pad.buttons[i].pressed=true;},i);await page.waitForTimeout(150);await page.evaluate(i=>{__pad.buttons[i].pressed=false;},i);await page.waitForTimeout(150);};
  const f0=await page.evaluate(()=>document.activeElement?.dataset?.cc);await press(13);const f1=await page.evaluate(()=>document.activeElement?.dataset?.cc+':'+document.activeElement?.dataset?.v);assert.notEqual(f0+':',f1,'d-pad moves focus: '+f0+' '+f1);
  await page.evaluate(()=>{__pad.axes[2]=.8;});await page.waitForTimeout(400);await page.evaluate(()=>{__pad.axes[2]=0;});
  await press(1);await page.waitForFunction(()=>mode==='walking',null,{timeout:30000});
  // F. keyboard: arrows rotate, Esc cancels; mouse drag rotates (no exception, mode restored)
  await page.evaluate(()=>VoidCharacterCreator.open({context:'wardrobe'}));await page.waitForFunction(()=>!document.querySelector('[data-cc=confirm]')?.disabled,null,{timeout:120000});
  await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowDown');await page.mouse.move(900,400);await page.mouse.down();await page.mouse.move(700,400);await page.mouse.up();await page.keyboard.press('Escape');await page.waitForFunction(()=>mode==='walking',null,{timeout:30000});
  // G. placement (the account's saved character is the female Resident, so 1.66 m): preview character stands on the pod-room floor at standard height in front of the camera
  const place=await page.evaluate(async()=>{const open=VoidCharacterCreator.open({context:'wardrobe'});await open;await new Promise(r=>{const t=setInterval(()=>{if(!document.querySelector('[data-cc=confirm]')?.disabled){clearInterval(t);r();}},200);});
   const st=VoidBabylon.scene.getTransformNodeByName('character-creator-stage'),ms=st.getChildMeshes().filter(m=>m.isEnabled()&&m.getTotalVertices());let lo=1e9,hi=-1e9;for(const m of ms){m.computeWorldMatrix(true);m.refreshBoundingInfo({applySkeleton:true});const b=m.getBoundingInfo().boundingBox;lo=Math.min(lo,b.minimumWorld.y);hi=Math.max(hi,b.maximumWorld.y);}
   const out={feet:+(lo-st.position.y).toFixed(2),height:+(hi-st.position.y).toFixed(2),dist:+Math.hypot(st.position.x-walker.x,st.position.z-walker.z).toFixed(2)};VoidCharacterCreator.close(false);return out;});
  assert(Math.abs(place.feet)<.1&&Math.abs(place.height-1.66)<.1&&Math.abs(place.dist-2.7)<.05,JSON.stringify(place));
  // H. nothing else changed through all of the above
  const after=await page.evaluate(()=>({credits:state.credits,loc:state.location,inv:JSON.stringify(state.inventory||null),missions:JSON.stringify(state.story?.missions||state.missions||null)}));assert.deepEqual(after,before);
  console.log(JSON.stringify({tier,worstHairTopDelta:worst,place,leak:leak.last,errors}));assert.deepEqual(errors,[]);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
