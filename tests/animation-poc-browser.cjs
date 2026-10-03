const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:5189/tests/animation-poc.html');
  await page.waitForFunction(()=>window.VoidAnimationLab?.result?.skeletons.length===1,{timeout:30000});
  const details=await page.evaluate(()=>({bones:VoidAnimationLab.result.skeletons[0].bones.length,groups:Object.keys(VoidAnimationLab.clips),roots:VoidAnimationLab.result.rootNodes.length,active:VoidAnimationLab.clips.idle_fighting.isPlaying}));
  assert.equal(details.bones,52);
  assert.deepEqual(details.groups.sort(),['clap_slow','idle_fighting']);
  assert(details.roots>0);
  assert(details.active);
  const reuse=await page.evaluate(async()=>{const second=await VoidAnimationLibrary.spawn(VoidAnimationLab.scene,{role:'civilian'});const independent=second.skeletons[0]!==VoidAnimationLab.result.skeletons[0],groups=second.animationGroups.length,plays=second.animator.play('idle_fighting'),group=second.animator.current;group.pause();const hip=group.targetedAnimations.find(item=>item.target.name.includes('Hips')&&item.animation.targetProperty==='position').target;group.goToFrame(group.from);VoidAnimationLab.scene.render();const start=hip.getAbsolutePosition().clone();group.goToFrame(group.to);VoidAnimationLab.scene.render();const end=hip.getAbsolutePosition().clone();const horizontal=Math.hypot(end.x-start.x,end.z-start.z);second.dispose();return {independent,groups,plays,horizontal};});
  assert.equal(reuse.independent,true);assert.equal(reuse.groups,2);assert.equal(reuse.plays,true);assert(reuse.horizontal<.01);
  await page.selectOption('#clip','clap_slow');await page.click('#play');await page.waitForTimeout(400);
  assert(await page.evaluate(()=>VoidAnimationLab.clips.clap_slow.isPlaying));
  assert.equal(await page.evaluate(()=>VoidAnimationLab.clips.idle_fighting.isPlaying),false);
  const rapid=await page.evaluate(async()=>{const animator=VoidAnimationLab.result.animator;animator.play('idle_fighting');animator.play('clap_slow');animator.play('idle_fighting');await new Promise(resolve=>setTimeout(resolve,400));return {idle:VoidAnimationLab.clips.idle_fighting.isPlaying,clap:VoidAnimationLab.clips.clap_slow.isPlaying};});
  assert.deepEqual(rapid,{idle:true,clap:false});
  await page.screenshot({path:'work/animation-poc.png'});
  await page.click('#stop');assert.equal(await page.evaluate(()=>VoidAnimationLab.clips.idle_fighting.isPlaying),false);
  assert.deepEqual(errors,[]);
  console.log('PASS Babylon GLB load, 52-bone skeleton, two clips, blend and stop',details);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
