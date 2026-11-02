/* The Iris chat window on a phone-sized screen, driven by Playwright's device EMULATION (Pixel 7 profile, touch,
   mobile user agent). This is a simulation, NOT a physical Android phone: no real keyboard, real mobile Chrome,
   real radio or real GPU. The Iris service is replaced by stand-in answers (page.route) so nothing leaves the machine.
   The real-phone checklist is docs/IRIS-MOBILE-CHECKLIST.md.
   Run:  node tests/iris-mobile-emulation-browser.cjs        -> screenshots and results.json in work/iris-mobile/ */
const {chromium,devices}=require('playwright'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'work','iris-mobile');fs.mkdirSync(out,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.mp3':'audio/mpeg'};
const site=http.createServer((req,res)=>{const p=decodeURIComponent(new URL(req.url,'http://x').pathname),f=path.join(root,p==='/'?'index.html':p);
  if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end();}
  res.writeHead(200,{'content-type':mime[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res);});

const results=[];const ok=(name,detail='')=>{results.push({name,ok:true,detail});console.log('ok  ',name,detail);};
async function check(name,fn){try{const d=await fn();ok(name,d||'');}catch(e){results.push({name,ok:false,detail:e.message});console.log('FAIL',name,'-',e.message.split('\n')[0]);}}

(async()=>{
  await new Promise(r=>site.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${site.address().port}`;
  let browser;try{browser=await chromium.launch({channel:'msedge'});}catch{browser=await chromium.launch();}
  const ctx=await browser.newContext({...devices['Pixel 7'],locale:'en-US'});
  const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  let mode='ok',delay=0,sent=[];
  await page.route('**/api/chat/message',async route=>{
    const body=JSON.parse(route.request().postData()||'{}');sent.push(body.message);
    if(delay)await new Promise(r=>setTimeout(r,delay));
    if(mode==='offline')return route.abort('internetdisconnected');
    if(mode==='500')return route.fulfill({status:500,contentType:'application/json',body:'{}'});
    if(mode==='429')return route.fulfill({status:429,contentType:'application/json',body:JSON.stringify({response:'Easy there. Even androids need to breathe.'})});
    const long='Sacramento: 11°C, clear. '.repeat(14);
    route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({response:body.message.includes('long')?long:`Echo: ${body.message}`})});});
  await page.route('**/api/health',r=>r.fulfill({status:200,body:'{}'}));
  await page.route(/hak5_products|firebase|googleapis|gstatic/,r=>r.abort());
  const open=async()=>{await page.goto(base+'/index.html');await page.click('#chatButton');await page.waitForSelector('#chatContainer',{state:'visible'});await page.waitForTimeout(900);};
  const fits=async()=>page.evaluate(()=>{const c=document.getElementById('chatContainer').getBoundingClientRect(),i=document.querySelector('#chatContainer .chat-input').getBoundingClientRect(),h=document.querySelector('#chatContainer .chat-header').getBoundingClientRect(),vv=window.visualViewport;
    return {w:innerWidth,h:innerHeight,left:Math.round(c.left),right:Math.round(c.right),top:Math.round(c.top),bottom:Math.round(c.bottom),inputBottom:Math.round(i.bottom),headerTop:Math.round(h.top),overflowX:document.documentElement.scrollWidth>innerWidth,vvh:vv&&Math.round(vv.height)};});
  const say=async text=>{await page.fill('#messageInput',text);await page.tap('#sendButton');};
  const lastBot=()=>page.locator('#chatMessages .bot-message').last().innerText();
  const waitBot=async(re,ms=15000)=>{await page.waitForFunction(r=>[...document.querySelectorAll('#chatMessages .bot-message')].some(m=>new RegExp(r).test(m.textContent)),re,{timeout:ms});};

  await check('portrait: opens, fits the screen, credit line visible, no sideways scroll',async()=>{await open();const f=await fits();
    assert.ok(f.left>=0&&f.right<=f.w&&f.top>=0&&f.bottom<=f.h+1,JSON.stringify(f));assert.ok(!f.overflowX,'horizontal overflow');
    assert.ok(await page.locator('#chatContainer .chat-credits').isVisible(),'credit line');await page.screenshot({path:path.join(out,'01-portrait.png')});return JSON.stringify(f);});
  await check('welcome line appears; a message gets a reply',async()=>{await waitBot('Neural interface');await say('hello');await waitBot('Echo: hello');});
  await check('multilingual input round-trips (zh-Hans, zh-Hant, ja, es, ru, emoji)',async()=>{
    for(const t of ['今天天气怎么样','今天天氣如何','今日の天気は？','¿Qué tiempo hace en Sacramento?','Какая сегодня погода?','weather ☔ 😀']){await say(t);await waitBot('Echo: '+t.replace(/[?.*+^${}()|[\]\\]/g,'\\$&'));}
    assert.ok(sent.includes('今日の天気は？')&&sent.includes('Какая сегодня погода?'));});
  await check('a long reply wraps inside the window (no sideways scroll)',async()=>{await say('long please');await waitBot('Sacramento: 11');const f=await fits();assert.ok(!f.overflowX&&f.right<=f.w);await page.screenshot({path:path.join(out,'02-long-reply.png')});});
  await check('minimize and restore keep the conversation',async()=>{const before=await page.locator('#chatMessages .message').count();await page.tap('#chatMinimize');
    assert.ok(!(await page.locator('#chatContainer').isVisible()),'hidden');await page.tap('#chatButton');assert.ok(await page.locator('#chatContainer').isVisible());
    assert.equal(await page.locator('#chatMessages .message').count(),before);});
  await check('landscape (915x412): window still fits, input reachable',async()=>{await page.setViewportSize({width:915,height:412});await page.waitForTimeout(500);const f=await fits();
    assert.ok(f.bottom<=f.h+1&&f.top>=0&&!f.overflowX,JSON.stringify(f));await page.screenshot({path:path.join(out,'03-landscape.png')});await page.setViewportSize({width:412,height:915});return JSON.stringify(f);});
  await check('on-screen keyboard (viewport shrinks to 55%): header and input stay on screen',async()=>{await page.setViewportSize({width:412,height:500});await page.waitForTimeout(500);const f=await fits();
    assert.ok(f.headerTop>=0&&f.inputBottom<=f.h+1,JSON.stringify(f));await page.screenshot({path:path.join(out,'04-keyboard.png')});await page.setViewportSize({width:412,height:915});return JSON.stringify(f);});
  await check('small phone (320x568): fits',async()=>{await page.setViewportSize({width:320,height:568});await page.waitForTimeout(400);const f=await fits();assert.ok(f.right<=f.w&&f.bottom<=f.h+1&&!f.overflowX,JSON.stringify(f));await page.screenshot({path:path.join(out,'05-small.png')});await page.setViewportSize({width:412,height:915});});
  await check('slow service: the "waking up" notice shows, then the reply',async()=>{delay=9500;await say('slow one');await waitBot('Uplink is waking up',12000);await waitBot('Echo: slow one',15000);delay=0;});
  await check('network drops: she says the link is disrupted, and it works again when the network returns',async()=>{mode='offline';await say('are you there');await waitBot('Neural interface disrupted',15000);mode='ok';await say('back online');await waitBot('Echo: back online');});
  await check('server error (500): in-character failure message, chat still usable',async()=>{mode='500';await say('boom');await waitBot('Neural interface disrupted',15000);mode='ok';});
  await check('rate limit (429): the in-character reply is shown',async()=>{mode='429';await say('too fast');await waitBot('Easy there',15000);mode='ok';});
  await check('reload: the window is closed again and starts a fresh conversation on screen (server-side memory is separate)',async()=>{await page.reload();await page.waitForTimeout(500);assert.ok(!(await page.locator('#chatContainer').isVisible()));});
  await check('no script errors on the page',async()=>{const real=errors.filter(e=>!/firebase|Failed to fetch|hak5/i.test(e));assert.deepEqual(real,[]);});

  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({simulated:true,device:'Pixel 7 emulation (Playwright)',when:new Date().toISOString(),results},null,1));
  await browser.close();site.close();
  const bad=results.filter(r=>!r.ok);console.log(`\n${results.length-bad.length}/${results.length} passed (EMULATION, not a physical phone)`);process.exit(bad.length?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
