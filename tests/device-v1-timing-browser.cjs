/* V1 interface timing, measured in a real browser with the V1's own scripts and stylesheet, WITHOUT the 3D game (so the numbers are the interface's, not a software renderer's).
   Usage: node tests/device-v1-timing-browser.cjs [chromium|firefox]   (SITE_TEST_URL for the server; default http://127.0.0.1:5187)
   Checks: each transition takes the configured delay (and no more than a few frames over); reduced motion has none; rapid clicking never piles transitions up (the last request wins);
   the page's frame loop and main thread keep running during transitions. */
const pw=require('playwright'),assert=require('node:assert/strict');
const name=process.argv[2]==='firefox'?'firefox':'chromium',base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187';
(async()=>{
 const browser=await pw[name].launch(name==='chromium'?{args:['--no-sandbox']}:{});const errors=[],report={browser:name,version:browser.version()};
 try{
  for(const reducedMotion of ['no-preference','reduce']){
   const page=await browser.newPage({viewport:{width:1280,height:720},reducedMotion});page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(30000);
   await page.setContent('<!doctype html><meta charset=utf-8><link rel=stylesheet href="'+base+'/void-runner/device-v1.css"><body style="margin:0;background:#050a10"><canvas id=c width=10 height=10></canvas></body>');
   await page.evaluate(()=>{window.state={story:{flags:{}},credits:0};window.mode='walking';window.walkingKeys=new Set();window.clearInput=()=>{};window.C={stations:{}};window.walker={};});
   for(const f of ['device-v1.js','personal-device.js'])await page.addScriptTag({url:base+'/void-runner/'+f});
   await page.evaluate(()=>VoidPersonalDevice.open());await page.waitForSelector('#personal-device.open');
   // frame cadence + long tasks while the device works
   await page.evaluate(()=>{window.__f=[];window.__long=0;let last=performance.now();const tick=t=>{window.__f.push(t-last);last=t;requestAnimationFrame(tick);};requestAnimationFrame(tick);try{new PerformanceObserver(l=>{window.__long+=l.getEntries().filter(e=>e.duration>80).length;}).observe({entryTypes:['longtask']});}catch{}});
   const settled=()=>page.waitForFunction(()=>!VoidPersonalDevice.busy);
   const timed=sel=>page.evaluate(async sel=>{const el=document.querySelector(sel),t0=performance.now();el.click();await new Promise(res=>{const tick=()=>{if(!VoidPersonalDevice.busy)return res();requestAnimationFrame(tick);};requestAnimationFrame(tick);});return Math.round(performance.now()-t0);},sel);
   await settled();const cfg=await page.evaluate(()=>({...VoidDeviceV1.DEVICES.v1.ui,still:document.getElementById('personal-device').classList.contains('pd-still')}));
   const t={startup:null,open:[],home:[],tab:[]};
   for(let i=0;i<5;i++){t.open.push(await timed('[data-app=messages]'));t.tab.push(await timed('[data-sub=talk]'));t.home.push(await timed('[data-do=back]'));}
   const med=a=>[...a].sort((x,y)=>x-y)[a.length>>1];
   report[reducedMotion]={config:cfg,openMs:t.open,tabMs:t.tab,homeMs:t.home,median:{open:med(t.open),tab:med(t.tab),home:med(t.home)}};
   if(reducedMotion==='no-preference'){
    assert(med(t.open)>=cfg.appOpenMs-20&&med(t.open)<=cfg.appOpenMs+120,'opening takes about appOpenMs: '+med(t.open));
    assert(med(t.home)>=cfg.homeMs-20&&med(t.home)<=cfg.homeMs+120,'home takes about homeMs: '+med(t.home));
    assert(med(t.tab)>=cfg.tabMs-20&&med(t.tab)<=cfg.tabMs+120,'tab switch takes about tabMs: '+med(t.tab));
    for(const k of ['appOpenMs','homeMs','tabMs'])assert(cfg[k]>=150&&cfg[k]<=450,k);
   }else{assert(cfg.still,'the device is still under reduced motion');assert(med(t.open)<60&&med(t.home)<60&&med(t.tab)<60,'no artificial delay with reduced motion: '+JSON.stringify(report[reducedMotion].median));}
   // rapid clicking: ten different apps within ~100 ms, then back/forward spam; the last request wins, nothing piles up
   const rapid=await page.evaluate(async()=>{const back=()=>{const b=document.querySelector('[data-do=back]');if(b&&!b.hidden)b.click();};await new Promise(r=>setTimeout(r,50));const ids=['missions','messages','social','news','map','store','settings','missions','news','store'];let n=0;
    for(const id of ids){const b=document.querySelector('[data-app='+id+']');if(b){b.click();n++;}else{back();}await new Promise(r=>setTimeout(r,10));}
    for(let i=0;i<10;i++){back();await new Promise(r=>setTimeout(r,12));document.querySelector('[data-app=store]')?.click();await new Promise(r=>setTimeout(r,12));}
    const t0=performance.now();await new Promise(res=>{const k=()=>VoidPersonalDevice.busy?requestAnimationFrame(k):res();k();});
    return {clicked:n,app:VoidPersonalDevice.app,busy:VoidPersonalDevice.busy,cards:document.querySelectorAll('#personal-device .pd-boot').length,title:document.querySelector('#personal-device .pd-title').textContent,drainMs:Math.round(performance.now()-t0),expect:VoidPersonalDevice.app?VoidDeviceV1.APPS[VoidPersonalDevice.app].title:'HOME'};});
   assert.equal(rapid.busy,false);assert.equal(rapid.cards,0,'no loading card is left behind');assert(rapid.drainMs<=cfg.appOpenMs+150,'the burst drains within one transition, not ten: '+rapid.drainMs);
   assert.equal(rapid.title,rapid.expect);
   report[reducedMotion].rapid=rapid;
   // closing mid-transition leaves nothing pending
   const closed=await page.evaluate(async()=>{VoidPersonalDevice.close();document.querySelector('[data-app=news]');VoidPersonalDevice.open();await new Promise(r=>setTimeout(r,20));VoidPersonalDevice.close();await new Promise(r=>setTimeout(r,900));return {open:VoidPersonalDevice.isOpen,busy:VoidPersonalDevice.busy};});
   assert.deepEqual(closed,{open:false,busy:false});
   const frames=await page.evaluate(()=>{const f=window.__f.slice(5);return {n:f.length,max:Math.round(Math.max(...f)),p95:Math.round([...f].sort((a,b)=>a-b)[Math.floor(f.length*.95)]),longTasks:window.__long};});
   report[reducedMotion].frames=frames;assert(frames.max<250,'no main-thread stall while the device works: '+JSON.stringify(frames));assert.equal(frames.longTasks,0,'no long task (>80 ms)');
   await page.close();
  }
  console.log(JSON.stringify(report,null,1));assert.deepEqual(errors,[]);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
