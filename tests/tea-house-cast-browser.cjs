// Real mission 004 on Low. Delay the executive model to reproduce a missing second witness.
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const path = require('node:path');
const base = process.env.BASE || 'http://localhost:5196';
const mission = 'm004-a-promising-investment';

(async () => {
  const browser = await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE || undefined,
    args:['--autoplay-policy=no-user-gesture-required','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
  try {
    const ctx = await browser.newContext({viewport:{width:800,height:500},ignoreHTTPSErrors:true,serviceWorkers:'block'});
    await ctx.route('**/api/**', route => route.fulfill({status:503,body:'{}'}));
    const page = await ctx.newPage();
    page.setDefaultTimeout(180000);
    await page.addInitScript(() => localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:'low',chosen:true,v:2})));
    let allowExecutive=false, refused=0;
    await page.route('**/npc-executive.glb', route => {
      if(allowExecutive)return route.continue();
      refused++;
      return route.fulfill({status:503,body:'unavailable'});
    });
    await page.goto(base+'/void-runner.html');
    await page.waitForFunction(()=>window.VoidStartup?.started);
    const profile=JSON.parse(execFileSync(process.execPath,[path.join(__dirname,'awakening-make-save003.cjs')],{encoding:'utf8'}));
    const enterWith=async data=>page.evaluate(async data=>{
      VoidAudio.set({enabled:true,voiceEnabled:true,voice:1});VoidAudio.unlock();
      state=data;
      Object.assign(state.story.flags,{podWakePending:false,appearanceOffered:true,keymapSeen:true});
      state.story.flags.gameMin=(state.story.flags.gameMin||0)+361;
      const r=VoidMissionContent.treeEvent(state,VoidLiveContent.env,{type:'place',places:['avenue']},VoidMissions,C);
      VoidLiveContent.report(r);VoidLiveContent.deliver(r);
      const prepare=VoidAssets.prepare;
      VoidAssets.prepare=(scene,defs,task)=>{
        scene.getEngine().setHardwareScalingLevel(5);
        return prepare(scene,Object.fromEntries(Object.entries(defs).filter(([,v])=>!v.background)),task);
      };
      await enterWalking(VoidDistrictArea.KEY.street,{silent:true,quarter:'underground',spawn:[-6.3,1.7,-100.8]});
    },data);
    await enterWith(profile);
    const actors=()=>page.evaluate(()=>VoidMissionMechanicsGame.cast().filter(x=>x.id.startsWith('tea-associate')));
    await page.waitForFunction(()=>VoidMissionMechanicsGame.cast().some(x=>x.id==='tea-associate-1'));
    await page.waitForTimeout(9500);
    assert.ok(refused>=1);
    assert.equal((await actors()).length,1);
    assert.equal(await page.evaluate(id=>!!state.universe.missions[id].objectives.overhear,mission),false);
    allowExecutive=true;
    await page.waitForFunction(()=>VoidMissionMechanicsGame.cast().filter(x=>x.id.startsWith('tea-associate')).length===2);
    const saved=await page.evaluate(()=>JSON.parse(JSON.stringify(state)));
    await page.evaluate(async()=>{await enterWalking(VoidDistrictArea.KEY.street,{silent:true,quarter:'oldtown'});});
    assert.equal((await actors()).length,0);
    await page.reload();await page.waitForFunction(()=>window.VoidStartup?.started);
    allowExecutive=true;
    await enterWith(saved);
    await page.waitForFunction(()=>VoidMissionMechanicsGame.cast().filter(x=>x.id.startsWith('tea-associate')).length===2);
    const cast=await actors();
    assert.equal(cast.find(x=>x.id==='tea-associate-1').pos.x,-6.55);
    assert.equal(cast.find(x=>x.id==='tea-associate-2').pos.x,-5.25);
    await page.waitForFunction(id=>!!state.universe.missions[id]?.objectives.overhear,mission,{timeout:240000});
    const heard=await page.evaluate(()=>VoidVoiceClips.played.map(r=>r.primary.speaker).filter(s=>s.startsWith('tea-associate')));
    assert.deepEqual(heard,['tea-associate-1','tea-associate-2','tea-associate-1','tea-associate-2','tea-associate-1','tea-associate-2']);
    await page.evaluate(()=>VoidPersonalDevice.openApp('missions'));
    await page.locator('[data-mx-report]').first().click();
    await page.waitForFunction(id=>state.universe.missions[id]?.completed,mission);
    console.log(JSON.stringify({cast,heard,refused,completed:true}));
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
