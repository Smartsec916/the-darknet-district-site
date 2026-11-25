const { chromium } = require('playwright');
const assert = require('node:assert/strict');

async function run() {
 const browser = await chromium.launch(process.env.BROWSER_EXECUTABLE
  ? {executablePath:process.env.BROWSER_EXECUTABLE} : {});
 try {
  for(const slot of [0,1]){
   const context=await browser.newContext({serviceWorkers:'block'});
   try {
    const page=await context.newPage();
    page.on('pageerror',e=>console.error(e.message));
    await page.route('https://**/*',route=>route.abort());
    await page.route('**/api/**',route=>route.fulfill({status:404,body:'{}'}));
    await page.goto((process.env.SITE_TEST_URL||'http://127.0.0.1:5187')+'/void-runner.html');
    await page.waitForFunction(()=>globalThis.VoidStartup?.started);
    await page.evaluate(async slot=>{
     leaveMenu();VoidGraphics.quality='low';VoidBabylon.setQuality('low');
     state=C.startDistrictCampaign(C.fresh());
     state.story.flags.podWakePending=false;state.story.flags.appearanceOffered=true;state.location='earth';
     const door=VoidApartments.door('apt-avenue-n-16');
     const doors=[door.id,VoidApartments.residenceKey(door.id,slot)];
     globalThis.VoidAccount={...globalThis.VoidAccount,user:{uid:'resident-'+slot}};
     globalThis.VoidConsumableGame={...globalThis.VoidConsumableGame,data:{keycards:[{doors}]},request:async(path,body)=>{
      if(path.startsWith('keycards/drops/'))return {cards:[]};
      if(path==='keycards/npc-access')return {allowed:false};
      if(path==='keycards/access')return {allowed:doors.includes(body.door)};
      throw Error('Unexpected inventory request '+path);
     }};
     await enterWalking(VoidDistrictArea.KEY.street,{silent:true,quarter:door.quarter,spawn:[door.front[0],1.7,door.front[1]]});
     await VoidApartments.enterDoor(door.id);
    },slot);
    await page.waitForFunction(()=>walkingLocation?.part==='hall'&&mode==='walking',null,{timeout:120000});
    const tryDoor=async id=>page.evaluate(async id=>{
     const item=walkingLocation.interactions.find(i=>i.action==='apt-hall-door'&&i.slot===id);
     if(!item)throw Error('Missing unit door '+id);
     await VoidInteractions.handlers.get('apt-hall-door')({item});
    },id);
    await tryDoor(1-slot);
    await page.waitForTimeout(900);
    assert.equal(await page.evaluate(()=>walkingLocation.part),'hall');
    await tryDoor(slot);
    for(let attempt=0;attempt<3;attempt++){
     await page.waitForFunction(()=>walkingLocation?.part==='flat'&&mode==='walking'||document.querySelector('[data-action="walk-retry"]'),null,{timeout:180000});
     const retry=page.locator('[data-action="walk-retry"]');
     if(!await retry.isVisible())break;
     if(attempt===2)throw Error(await page.locator('body').innerText());
     await retry.click();
    }
    assert.equal(await page.evaluate(()=>VoidApartments.visit.inst.residenceSlot),slot);
    assert.equal(await page.evaluate(()=>VoidRoadTaxi.world),null,'street traffic stays outside');
   }finally{await context.close();}
  }
  console.log('Two isolated residents entered their shared hallway and only their own apartments.');
 }finally{await browser.close();}
}
run().catch(error=>{console.error(error);process.exitCode=1;});
