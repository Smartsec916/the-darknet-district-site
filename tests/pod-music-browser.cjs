/* Real audio, spectrum, local-file privacy, and independent Sleeping Pod controls. Run against tests/serve-modern.cjs. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const tier=process.argv[2]==='high'?'high':'low',base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187';
const fixture=path.join(os.tmpdir(),'district-pod-browser-tone.wav');
function tone(){const rate=22050,n=rate*20,b=Buffer.alloc(44+n*2);b.write('RIFF',0);b.writeUInt32LE(36+n*2,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(n*2,40);for(let i=0;i<n;i++){const t=i/rate,v=Math.sin(t*110*Math.PI*2)*.4+Math.sin(t*880*Math.PI*2)*.3;b.writeInt16LE(Math.round(v*32767),44+i*2);}fs.writeFileSync(fixture,b);}
(async()=>{
 tone();const browser=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox','--autoplay-policy=no-user-gesture-required']});
 try{
  const page=await browser.newPage({viewport:{width:1100,height:700},reducedMotion:'reduce',serviceWorkers:'block'}),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push({method:r.method(),url:r.url()}));
  await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));
  await page.addInitScript(q=>localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:q})),tier);
  await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>window.VoidStartup?.started,null,{timeout:120000});
  await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:900000,assets:300000,optional:300000,total:1500000}));
  await page.evaluate(async()=>{state=C.startDistrictCampaign(C.fresh());state.story.flags.appearanceOffered=true;await enterWalking('darknet-district',VoidDistrictArea.resume(state,VoidNeoChinatown));await showPodWake();});
  await page.waitForFunction(()=>mode==='pod-waking'&&walkingLocation?.area==='interior',null,{timeout:180000});
  const parts=await page.evaluate(()=>({screens:VoidBabylon.scene.meshes.filter(m=>m.name==='tesana-pod-screen').length,hatches:walkingLocation.interactions.filter(i=>i.action==='district-pod').length,roomPlayer:walkingLocation.interactions.some(i=>i.action==='district-pod-music')}));
  assert.deepEqual(parts,{screens:10,hatches:10,roomPlayer:false});
  await page.locator('[data-pod=music]').click();await page.waitForSelector('#pod-music');
  assert.equal(await page.locator('#pod-music ol li').count(),27,'hosted catalog remains available');
  await page.locator('[data-action="pod-music:source:mine"]').click();
  await page.locator('[data-action="pod-music:add"]').click();await page.locator('#pod-music-input').setInputFiles(fixture);
  await page.waitForFunction(()=>VoidPodMusic.playing&&VoidPodMusic.element?.currentTime>.2,null,{timeout:30000});
  await page.locator('[data-action="pod-music:light:music"]').click();
  await page.waitForFunction(()=>VoidPodMusic.levels().bass>.02,null,{timeout:15000});
  const light=await page.evaluate(()=>{const a=VoidBabylon.scene.getMaterialByName('ncz-tesana-pod-led-1'),b=VoidBabylon.scene.getMaterialByName('ncz-tesana-pod-led-2');return {a:a?.emissiveColor?.asArray(),b:b?.emissiveColor?.asArray()};});
  assert(light.a&&light.b&&light.a[0]>light.b[0],'music reacts only in occupied pod');
  await page.locator('#pod-music-volume').evaluate(el=>{el.value='35';el.dispatchEvent(new Event('input',{bubbles:true}));});
  assert.equal(await page.evaluate(()=>VoidPodMusic.element.volume),.35);
  await page.locator('[data-action="pod-music:return"]').click();await page.waitForFunction(()=>mode==='pod-waking');
  await page.locator('[data-pod=exit]').click();await page.waitForFunction(()=>mode==='walking'&&!VoidPodMusic.playing,null,{timeout:15000});
  const second=await page.evaluate(()=>walkingLocation.interactions.find(i=>i.podIndex===2));
  await page.evaluate(item=>VoidInteractions.handlers.get('district-pod')({item}),second);await page.waitForFunction(()=>mode==='pod-waking'&&state.story.flags.activePod===2);
  await page.locator('[data-pod=music]').click();await page.waitForSelector('#pod-music');
  assert.equal(await page.locator('#pod-music-volume').inputValue(),'80','pod 02 keeps independent volume');
  assert.equal(await page.evaluate(()=>VoidPodMusic.lists.mine.currentId),null,'pod 02 has not selected pod 01’s song');
  assert.equal(await page.locator('[data-action="pod-music:light:rest"]').getAttribute('aria-pressed'),'true');
  await page.locator('[data-action="pod-music:return"]').click();await page.waitForFunction(()=>mode==='pod-waking');await page.locator('[data-pod=exit]').click();await page.waitForFunction(()=>mode==='walking');
  const first=await page.evaluate(()=>walkingLocation.interactions.find(i=>i.podIndex===1));
  await page.evaluate(item=>VoidInteractions.handlers.get('district-pod')({item}),first);await page.waitForFunction(()=>mode==='pod-waking'&&state.story.flags.activePod===1);
  await page.locator('[data-pod=music]').click();await page.waitForSelector('#pod-music');
  assert.equal(await page.locator('#pod-music-volume').inputValue(),'35');assert.equal(await page.locator('[data-action="pod-music:light:music"]').getAttribute('aria-pressed'),'true');
  assert(await page.evaluate(()=>!!VoidPodMusic.lists.mine.currentId),'pod 01 retains its selected song');
  assert(!requests.some(r=>r.method!=='GET'&&r.url.includes(path.basename(fixture))),'private audio was never uploaded');
  assert.deepEqual(errors,[]);console.log(JSON.stringify({tier,parts,privateAudio:'local only',errors}));
 }finally{await browser.close();fs.rmSync(fixture,{force:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
