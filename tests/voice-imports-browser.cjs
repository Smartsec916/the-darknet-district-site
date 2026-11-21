/* Imported voice files (Developer Tools, 19 Nov 2026), in a real browser (offline, fake server): a line typed in the Mission Editor gets IMPORT VOICE FILE; a 41 s file is
   refused in plain words; a big WAV is made smaller in the browser (Ogg Opus) and still plays; a short WAV is kept as it is; the line shows "Voice: imported file" and,
   once its words change, "text changed since the voice was imported"; UNDO puts a removal back; PLAY THIS DRAFT speaks the line with the imported file from this browser
   (the conversation's clip is the import); PUBLISH uploads the file first (fake server: type, size, address checked) and publishes content.clips; a player with no
   sign-in then hears the published file through the public address (Cache Storage kept). Usage: node tests/serve-modern.cjs, then node tests/voice-imports-browser.cjs
   (SITE_TEST_URL, SHOTS=dir, BROWSER_EXECUTABLE; default the bundled Chromium, software GL). */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shots=process.env.SHOTS||null;if(shots)fs.mkdirSync(shots,{recursive:true});
const bundled=fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',exe=process.env.BROWSER_EXECUTABLE||(fs.existsSync(bundled)?bundled:null);
const log=(...a)=>console.log('[voice-imports]',...a),shot=async(t,name)=>{if(shots)try{await t.screenshot({path:path.join(shots,name),timeout:15000});}catch(e){log('no screenshot '+name+': '+e.message.split('\n')[0]);}};
const TEXT='[whispers] Keep your voice down in here, pilot.';
function wav(seconds,rate=16000,channels=1,freq=220){const n=Math.round(seconds*rate),b=Buffer.alloc(44+n*2*channels);b.write('RIFF',0);b.writeUInt32LE(36+n*2*channels,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(channels,22);b.writeUInt32LE(rate,24);b.writeUInt32LE(rate*2*channels,28);b.writeUInt16LE(2*channels,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(n*2*channels,40);
 for(let i=0;i<n;i++){const v=Math.round(Math.sin(2*Math.PI*freq*i/rate)*12000*(1-i/n));for(let c=0;c<channels;c++)b.writeInt16LE(v,44+(i*channels+c)*2);}return b;}
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required'],...(exe?{executablePath:exe}:{})});const errors=[];
 const server={clips:new Map(),published:null,uploads:0};
 try{
  const ctx=await browser.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'}),page=await ctx.newPage().then(async p=>{await p.addInitScript(()=>{try{if(!localStorage.getItem('mission-editor-view'))localStorage.setItem('mission-editor-view','form');}catch{}});return p;});page.on('pageerror',e=>errors.push(e.stack||e.message));page.on('dialog',d=>d.accept());
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
  await page.route('**/api/**',r=>{const p=new URL(r.request().url()).pathname.replace('/api/void-runner/','');if(p==='live-content')return r.fulfill({status:404,contentType:'application/json',body:'{"error":"off"}'});return r.fulfill({status:503,contentType:'application/json',body:'{"error":"offline test"}'});});
  const boot=()=>page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:180000});
  // the owner's fake server: publishing on; voice files checked like void_runner_live_content.store_clip (address, type from the bytes, size)
  await page.exposeFunction('fakeServer',(p,body)=>{
   if(p==='developer/balance')return {values:null,revision:1,preset:'NORMAL'};
   if(p==='developer/live-content')return {enabled:true,editor:true,version:server.published?1:0,history:server.published?[{version:1,at:1700000000,action:'publish',from:null,note:''}]:[],numbers:{}};
   if(p==='developer/voice-clips')return {missing:body.hashes.filter(h=>!server.clips.has(h))};
   if(p.startsWith('developer/voice-clips/')){const h=p.split('/').pop(),data=Buffer.from(body.data,'base64');if(crypto.createHash('sha256').update(data).digest('hex')!==h)return {status:422,error:'address'};if(data.length>600000)return {status:413,error:'big'};
    const kind=data.subarray(0,4).toString('latin1')==='OggS'?'audio/ogg':data.subarray(0,4).toString('latin1')==='RIFF'?'audio/wav':null;if(kind!==body.type)return {status:415,error:'type'};server.clips.set(h,{type:kind,data});server.uploads++;return {hash:h,type:kind,bytes:data.length,stored:true,existed:false};}
   if(p==='developer/live-content/publish'){const missing=(body.content.clips||[]).filter(c=>!server.clips.has(c.hash));if(missing.length)return {status:422,error:'missing'};server.published=body.content;return {version:1,content:body.content};}
   return {status:404,error:'Switched off in this offline test'};});
  const dev=()=>page.evaluate(()=>VoidDevTools.identity(async(p,body)=>{const r=await fakeServer(p,body);if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1,preset:'NORMAL'};if(r&&r.status){const e=new Error(r.error);e.status=r.status;throw e;}return r;}));
  await page.goto(base+'/void-runner.html');await boot();
  await page.evaluate(()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;localStorage.setItem('void-runner-campaign-v1',JSON.stringify({...s,savedAt:1700000000000}));for(const k of ['mission-editor-drafts-v1','editor-mode'])localStorage.removeItem(k);localStorage.setItem('editor-tour-done','1');});
  await page.reload();await boot();await dev();
  // ---- a mission whose offer line the owner typed (with a voice tag): Admin offers it, talk to Iris
  await page.evaluate(()=>VoidDevTools.open('missions'));await page.waitForFunction(()=>globalThis.VoidMissionEditor?.built,null,{timeout:120000});
  const mid=await page.evaluate(t=>{const S=VoidMissionEditor.shared,W=VoidEditorWizard,a=W.fresh('talk');a.giver='admin';a.steps=[{kind:'talk',npc:'iris',place:'',label:'Talk to Iris',auto:false}];a.title='TEST: Voice import';a.offer=t;
   const r=S.addWizardMission((d,o)=>W.build(d,a,{T:o.T,number:o.number}));VoidDevTools.render();return r.mission;},TEXT);
  log('blockers:',JSON.stringify(await page.evaluate(m=>VoidMissionEditor.shared.blockers(VoidMissionEditor.local().trees.flatMap(t=>t.missions).find(x=>x.id===m)),mid)));
  const KEY='tree:'+mid+'/offer/0',box=()=>page.locator('[data-me-import="'+KEY+'"]');await box().waitFor({timeout:120000});await box().scrollIntoViewIfNeeded();
  assert.match(await box().textContent(),/IMPORT VOICE FILE.*Made the line in ElevenLabs\? Download it/);await shot(box(),'01-import-button.png');
  const pick=async(name,buf,mime='audio/wav')=>{await page.locator('[data-me-import-file="'+KEY+'"]').setInputFiles({name,mimeType:mime,buffer:buf});};
  // ---- 41 seconds: refused in plain words, nothing saved
  await pick('too-long.wav',wav(41,8000));await page.waitForFunction(k=>/limit is 40 seconds/.test(document.querySelector('[data-me-import-msg="'+k+'"]')?.textContent||''),KEY,{timeout:60000});
  assert.equal(await page.evaluate(()=>Object.keys(VoidMissionEditor.local().clips||{}).length),0,'a refused file is not saved');
  // ---- a big WAV (12 s, stereo, 44.1 kHz: about 2 MB) is made smaller in the browser: Ogg Opus, mono, under 600 KB, and still plays
  const canEncode=await page.evaluate(()=>VoidVoiceImports.canEncode());log('WebCodecs AudioEncoder:',canEncode);
  if(canEncode){await pick('big.wav',wav(12,44100,2));await page.waitForSelector('[data-me-import-status="ok"]',{timeout:90000});
   const r=await page.evaluate(k=>VoidMissionEditor.local().clips[k],KEY);log('re-encoded:',JSON.stringify(r));
   assert.equal(r.type,'audio/ogg');assert.equal(r.reencoded,true);assert.ok(r.bytes<600000&&r.bytes>5000,String(r.bytes));assert.ok(Math.abs(r.duration-12)<0.1);
   const info=await page.evaluate(async h=>{const d=await VoidVoiceImports.getData(h);const i=VoidVoiceImports.oggInfo(new Uint8Array(d)),ab=await VoidVoiceImports.decode(d);return {i,dur:ab.duration,ch:ab.numberOfChannels};},r.hash);
   log('ogg:',JSON.stringify(info));assert.equal(info.i.codec,'opus');assert.equal(info.i.crcOk,true);assert.ok(Math.abs(info.i.duration-12)<0.05);assert.ok(Math.abs(info.dur-12)<0.1,'the smaller copy decodes');
   assert.match(await page.locator('[data-me-import-info="'+KEY+'"]').textContent(),/big\.wav · 12\.0 s · \d+ KB · made smaller \(Ogg Opus\)/);}
  // ---- REPLACE with a short WAV: kept as it is
  const small=wav(1.6);await pick('admin-line.wav',small);await page.waitForFunction(k=>/admin-line\.wav/.test(document.querySelector('[data-me-import-info="'+k+'"]')?.textContent||''),KEY,{timeout:60000});
  const rec=await page.evaluate(k=>VoidMissionEditor.local().clips[k],KEY);log('imported:',JSON.stringify(rec));
  assert.equal(rec.hash,crypto.createHash('sha256').update(small).digest('hex'),'the address is the file’s SHA-256');assert.equal(rec.type,'audio/wav');assert.equal(rec.text,TEXT,'voice tags stay in the editor text');assert.equal(rec.who,'admin');
  assert.match(await box().locator('[data-me-import-status]').textContent(),/Voice: imported file \(used instead of any recorded clip\)/);await shot(box(),'02-imported.png');
  assert.ok(await page.evaluate(async h=>(await VoidVoiceImports.getData(h)).byteLength,rec.hash)===small.length,'kept in this browser');
  // ---- words changed: flagged; put back: fine again
  const ta=page.locator('[data-me-tree-mission="'+mid+'"] [data-me-tline="offer/0"] textarea').first();await ta.fill(TEXT+' Now.');
  await page.waitForSelector('[data-me-import="'+KEY+'"] [data-me-import-status="changed"]');assert.match(await box().textContent(),/text changed since the voice was imported/);await shot(box(),'03-text-changed.png');
  assert.equal((await page.evaluate(()=>VoidMissionEditor.draftContent().clips))===undefined,true,'a changed line’s file is not sent');
  await ta.fill(TEXT);await page.waitForSelector('[data-me-import="'+KEY+'"] [data-me-import-status="ok"]');
  // ---- REMOVE, then UNDO puts it back
  await box().locator('[data-me-import-remove]').click();assert.equal(await page.evaluate(k=>!!(VoidMissionEditor.local().clips||{})[k],KEY),false);
  await page.locator('[data-dev="undo"]').click();await page.waitForTimeout(300);assert.equal(await page.evaluate(k=>VoidMissionEditor.local().clips[k].hash,KEY),rec.hash,'UNDO puts the import back');
  // ---- NPCs > Lines & voice shows the same import on the same line, and IMPORT VOICE FILE on Admin's other lines
  await page.evaluate(()=>{VoidDevTools.npcFocus='admin';VoidDevTools.open('npcs');});const nb=page.locator('#npc-root [data-me-import="'+KEY+'"]');await nb.waitFor({state:'attached',timeout:90000});await nb.evaluate(n=>{for(let d=n.parentElement;d;d=d.parentElement)if(d.tagName==='DETAILS')d.open=true;});await nb.scrollIntoViewIfNeeded({timeout:15000}).catch(()=>{});   // the NPCs tab may still be settling (its 3D preview loads); the checks below do not need it on screen
  
  assert.equal(await nb.locator('[data-me-import-status]').getAttribute('data-me-import-status'),'ok');assert.match(await nb.locator('xpath=ancestor::*[contains(@class,"me-line")][1]').locator('.me-vs').first().textContent(),/Voice: imported file/);
  assert.ok(await page.locator('#npc-root [data-me-import-btn]').count()>3,'every other line of Admin can take a file');await shot(nb.locator('xpath=ancestor::*[contains(@class,"me-line")][1]'),'03b-npcs-tab.png');
  await page.evaluate(()=>VoidDevTools.open('missions'));await box().waitFor({timeout:90000});
  // ---- the content: the import is referenced by hash and passes the same check as publishing
  const content=await page.evaluate(()=>VoidMissionEditor.draftContent());assert.deepEqual(content.clips,[{who:'admin',text:TEXT,hash:rec.hash,type:'audio/wav',duration:rec.duration,bytes:small.length}]);
  // ---- PLAY THIS DRAFT: Admin's offer is spoken with the imported file from this browser
  await page.evaluate(()=>{try{VoidGraphics.quality='low';VoidBabylon.setQuality('low');}catch{}});
  const pb=page.locator('[data-me-play="tree:'+mid+'"]').first();await pb.scrollIntoViewIfNeeded();await pb.click();await page.waitForFunction(()=>!document.getElementById('dev-test-banner').hidden&&mode==='walking',null,{timeout:900000,polling:100});
  if(process.env.PART==='editor'){assert.deepEqual(errors,[]);log('editor part OK');return;}
  assert.equal(await page.evaluate(()=>VoidVoiceImports.source),'draft');
  await page.evaluate(()=>VoidInteractions.handlers.get('admin')());
  const said=await page.evaluate(()=>({lines:speech?.lines?.map(l=>({who:l.who,text:l.text}))||[],clip:speech?.voice?.clip}));log('conversation:',JSON.stringify(said));
  const line=said.lines.find(l=>/Keep your voice down in here, pilot\./.test(l.text));assert.ok(line,'Admin offers the mission');
  assert.equal(await page.evaluate(l=>VoidVoiceClips.has(l.who,l.text),line),true,'the line has a voice: the imported file');
  const heard=await page.evaluate(async l=>{const c=new AudioContext(),bus=c.createGain();bus.connect(c.destination);await VoidVoiceClips.speak({characterId:l.who,text:l.text,bus});return VoidVoiceClips.played.at(-1).primary;},line);
  log('heard:',JSON.stringify(heard));assert.equal(heard.id,'import:'+rec.hash);assert.equal(heard.imported,'draft');assert.ok(Math.abs(heard.duration-1.6)<0.05);assert.equal(heard.speaker,'admin');
  assert.ok(await page.evaluate(h=>VoidVoiceImports.log.some(x=>x.hash===h&&x.how==='browser'),rec.hash),'loaded from this browser');
  await shot(page,'04-draft-play.png');
  await Promise.all([page.waitForNavigation({timeout:120000}),page.locator('#dev-test-banner button').click()]);await boot();await dev();
  // ---- PUBLISH: the file is uploaded first (checked by the fake server), then content.clips is published
  await page.evaluate(()=>VoidDevTools.open('missions'));await page.waitForSelector('[data-me-mode="publish"]',{timeout:120000});await page.locator('[data-me-mode="publish"]').click();
  await page.waitForSelector('[data-me-publish-clips="1"]');assert.match(await page.locator('[data-me-publish-clips]').textContent(),/1 imported voice file\(s\)/);await shot(page.locator('#me-check'),'05-publish-check.png');
  await page.locator('[data-me-publish]').click();await page.waitForFunction(()=>/Published version 1/.test(VoidMissionEditor.status),null,{timeout:60000});
  assert.equal(server.uploads,1);assert.deepEqual(server.clips.get(rec.hash).data,small,'the same bytes on the server');assert.deepEqual(server.published.clips,content.clips);
  // ---- a player (new browser, no sign-in, nothing in its storage) hears the published file
  const ctx2=await browser.newContext({viewport:{width:1280,height:800},serviceWorkers:'block'}),p2=await ctx2.newPage();p2.on('pageerror',e=>errors.push(e.message));const clipGets=[];
  await p2.route('https://**/*',r=>r.abort());await p2.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
  await p2.route('**/api/**',r=>{const q=r.request(),p=new URL(q.url()).pathname.replace('/api/void-runner/','');
   if(p==='live-content')return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({version:1,content:server.published})});
   if(p.startsWith('voice-clip/')){clipGets.push({auth:!!q.headers().authorization});const c=server.clips.get(p.split('/').pop());return c?r.fulfill({status:200,contentType:c.type,headers:{'Cache-Control':'public, max-age=31536000, immutable'},body:c.data}):r.fulfill({status:404,body:'{}'});}
   return r.fulfill({status:503,contentType:'application/json',body:'{"error":"offline test"}'});});
  await p2.goto(base+'/void-runner.html');await p2.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:180000});
  await p2.waitForFunction(()=>VoidLiveContent.current.source==='live',null,{timeout:60000});assert.equal(await p2.evaluate(()=>VoidVoiceImports.source),'live');
  const heard2=await p2.evaluate(async t=>{const c=new AudioContext(),bus=c.createGain();bus.connect(c.destination);await VoidVoiceClips.speak({characterId:'Admin',text:t,bus});await VoidVoiceClips.speak({characterId:'Admin',text:t,bus});return {p:VoidVoiceClips.played.at(-1).primary,log:VoidVoiceImports.log};},TEXT);
  log('player heard:',JSON.stringify(heard2));assert.equal(heard2.p.id,'import:'+rec.hash);assert.equal(heard2.p.imported,'live');assert.ok(heard2.log.some(x=>x.how==='network'),'fetched from the public address');
  assert.ok(clipGets.length>=1&&clipGets.every(g=>!g.auth),'no sign-in needed');
  assert.ok(await p2.evaluate(async h=>!!(await (await caches.open('void-runner-voice-imports-v1')).match(VoidVoiceImports.url(h))),rec.hash),'kept in the Cache Storage');
  assert.deepEqual(errors,[],'no page errors');log('OK');
 }catch(e){console.error(e);console.error('page errors:',errors);process.exitCode=1;}finally{await browser.close();}
})();
