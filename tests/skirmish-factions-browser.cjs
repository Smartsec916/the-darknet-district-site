const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const base=process.env.BASE||'http://127.0.0.1:5196',browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE||undefined,args:['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 try{
 const p=await browser.newPage({viewport:{width:760,height:440},serviceWorkers:'block',ignoreHTTPSErrors:true});p.setDefaultTimeout(120000);
 await p.addInitScript(()=>localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:'low',chosen:true,v:2})));
 await p.goto(base+'/void-runner.html');await p.waitForFunction(()=>window.VoidStartup?.started);
 await p.locator('[data-action=menu-skirmish]').click();
 await p.locator('[data-action="skirmish-type:zones"]').click();
 assert.equal(await p.evaluate(()=>VoidSkirmish.selection.type),'zones');
 await p.locator('[data-action=skirmish-enter]').click();
 await p.waitForFunction(()=>VoidSkirmish.active?.type==='zones'&&mode==='skirmish-fps');
 const profile=await p.evaluate(()=>JSON.stringify(state));
 const result=await p.evaluate(()=>{
  const m=VoidSkirmish.active,at=(x,z)=>{m.player.x=x;m.player.z=z;update(.04);},fire=()=>VoidSkirmish.action('fire',true);
  const passage=[];for(const z of [-27,72])for(let w=z-1;w<=z+1;w+=.2)passage.push(!VoidExplorer.blocked(0,w,VoidDerelictStation.layout));
  const friendly=m.zone,ammo=m.ammo;fire();const locked=m.ammo===ammo;
  at(-20,26);const neutral=m.zone,calm=m.enemies.every(e=>!e.alert);fire();
  for(let i=0;i<6;i++)update(.04);
  const fled=m.enemies.some(e=>e.civilian&&e.state==='flee'),provoked=VoidZones.hostileNow(m.esc,'neutral',m.elapsed);
  at(0,86);for(let i=0;i<20;i++)update(.04);const hostile=m.zone;
  const alerted=m.enemies.some(e=>e.zone==='hostile'&&e.alert);
  at(0,-63);return {friendly,neutral,hostile,locked,calm,fled,provoked,alerted,returned:m.zone,passage:passage.every(Boolean),enemies:m.enemies.length};
 });console.log(JSON.stringify(result));assert.deepEqual([result.friendly,result.neutral,result.hostile,result.returned],['friendly','neutral','hostile','friendly']);for(const k of ['locked','calm','fled','provoked','alerted','passage'])assert.ok(result[k],k);
 await p.evaluate(()=>VoidSkirmish.end());assert.equal(await p.evaluate(()=>JSON.stringify(state)),profile);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
