/* "Follow them" with the giver, walked-near start (fix, 19 Nov 2026), in a real browser (offline): the owner's own test, "add a mission that starts when you walk near the
   giver, have them say a line, then set it to follow them to another location". A draft mission is made with the "Make a mission" wizard's builder: Starts = when the player
   walks near her (automatic, no ACCEPT), step 1 talk to her (her one line), step 2 "Follow them" to a spot about 35 m away; PLAY THIS DRAFT (the editor's own button).
   The player walks up at walking pace, the mission starts by itself, TALK, the line, CLOSE, then the player follows her about 3 m behind (stopping once: she waits).
   Every frame records her world position, her plan and mode, the step's phase, the player and the conversation. It asserts:
   - she is at the mission-giving spot ("Giver waits at", or her placement) when the session starts and when the mission starts, and still there when the player talks;
   - she does not move during the conversation (her line), then walks;
   - no jump: from one frame to the next she never moves more than her walking speed x the frame's time (+ margin), never disappears, never leaves the area;
   - she stays within 2 m of her route to the spot; the step completes there.
   Usage: node tests/serve-modern.cjs, then node tests/follow-giver-browser.cjs. WHO=grey-reverie|ethereal-lace|street-cat|made (default grey-reverie);
   WHERE=avenue|oldtown (default avenue); WAIT=0 (no "Giver waits at": she is held where she stood); SHOTS=dir; SITE_TEST_URL; BROWSER_EXECUTABLE (default the bundled
   Chromium, software GL; a small render scale keeps the frame rate usable). */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shots=process.env.SHOTS||null;if(shots)fs.mkdirSync(shots,{recursive:true});
const bundled=fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',exe=process.env.BROWSER_EXECUTABLE||(fs.existsSync(bundled)?bundled:null);
const WHO=process.env.WHO||'grey-reverie',WHERE=process.env.WHERE||'avenue',USE_WAIT=process.env.WAIT!=='0';
// her spot and the spot she leads to (about 35 m), per area
const SPOTS={avenue:{wait:{x:104,z:-6.4},to:{x:68.5,z:-6.4}},oldtown:{wait:{x:69.5,z:-85.5},to:{x:69.5,z:-50.5}}},S=SPOTS[WHERE];
const id=WHO==='made'?'kara-voss':WHO,log=(...a)=>console.log('[follow-giver '+WHO+' '+WHERE+']',...a);
const shot=async(page,name)=>{if(shots)await page.screenshot({path:path.join(shots,WHO+'-'+WHERE+'-'+name),timeout:300000}).catch(()=>{});};
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'],...(exe?{executablePath:exe}:{})});const errors=[];
 try{
  const ctx=await browser.newContext({viewport:{width:960,height:540},serviceWorkers:'block'}),page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('pageerror',e=>console.log('[follow-giver] page error stack:',String(e.stack||e).slice(0,700)));
  await page.addInitScript(()=>{try{localStorage.setItem('mission-editor-view','form');}catch{}});
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
  await page.route('**/api/**',r=>{const p=new URL(r.request().url()).pathname.replace('/api/void-runner/','');if(p==='live-content')return r.fulfill({status:404,contentType:'application/json',body:'{"error":"off"}'});return r.fulfill({status:503,contentType:'application/json',body:'{"error":"offline test"}'});});
  const boot=()=>page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:600000});
  await page.goto(base+'/void-runner.html');await boot();
  await page.evaluate(()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;localStorage.setItem('void-runner-campaign-v1',JSON.stringify({...s,savedAt:1700000000000}));localStorage.removeItem('mission-editor-drafts-v1');localStorage.setItem('editor-tour-done','1');});
  await page.reload();await boot();
  await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:900000,assets:900000,optional:600000,area:900000,total:1800000,module:600000,artwork:300000}));
  await page.evaluate(()=>VoidDevTools.identity(async p=>{if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1,preset:'NORMAL'};const e=new Error('Switched off in this offline test');e.status=404;throw e;}));
  await page.evaluate(()=>VoidDevTools.open('missions'));await page.waitForSelector('[data-me-new-tree]',{timeout:60000});
  // the mission, with the wizard's builder (a made character: the giver creator's data, placed at the spot)
  const made=await page.evaluate(([WHO,id,S,USE_WAIT])=>{
   if(WHO==='made'){const SH=VoidMissionEditor.shared,d=SH.local();d.characters=d.characters||{};d.characters[id]={name:'Kara Voss',role:'TEST: a fixer',model:'npc-courier',device:'v3',items:[]};d.npcs=d.npcs||{};d.npcs[id]={mode:'stay',x:S.wait.x,z:S.wait.z,yaw:Math.PI,actions:['idle']};SH.saveLocal(d);}
   return VoidMissionEditor.shared.addWizardMission((d,o)=>{const a=VoidEditorWizard.fresh('talk');a.giver=id;a.title='TEST: follow her';a.start='near';a.message={header:'',text:'TEST: over here.'};
    a.steps=[{kind:'talk',npc:id,label:'',auto:true},{kind:'follow-them',npc:id,spot:'',label:'',auto:true}];VoidEditorWizard.relabel(a,{name:x=>x});const r=VoidEditorWizard.build(d,a,o);
    r.mission.objectives[0].say=[{who:id,text:'TEST LINE: follow me.'}];r.mission.objectives[1].to={...S.to};if(USE_WAIT&&WHO!=='made')r.mission.waitAt={...S.wait,yaw:Math.PI};return r;});},[WHO,id,S,USE_WAIT]);
  const mid=made.mission;log('mission',mid);
  await page.evaluate(()=>{VoidDevTools.tab='missions';VoidDevTools.render();});await page.waitForSelector('[data-me-play="tree:'+mid+'"]',{timeout:60000});
  await page.evaluate(()=>{try{VoidGraphics.quality='low';VoidBabylon.setQuality('low');}catch{}});
  await page.locator('[data-me-play="tree:'+mid+'"]').click();
  await page.waitForFunction(()=>!document.getElementById('dev-test-banner').hidden&&mode==='walking',null,{timeout:900000,polling:200});
  // the per-frame record (after each render): her figure, her plan, the step's phase, the player, the conversation
  await page.evaluate(([id,mid])=>{const R=globalThis.__rec=[];let last=performance.now();try{(VoidBabylon.scene||BABYLON.EngineStore.LastCreatedScene).getEngine().setHardwareScalingLevel(3);}catch{}
   (VoidBabylon.scene||BABYLON.EngineStore.LastCreatedScene).onAfterRenderObservable.add(()=>{try{const now=performance.now(),D=VoidBabylon.district,sp=D&&D.streetPair,st=sp&&sp.stats();let h=null;
    if(id==='street-cat')h=st&&st.cat?{x:st.cat.x,z:st.cat.z,mode:st.cat.mode}:null;
    else if(sp&&sp.made&&sp.made.people&&sp.made.people.get(id)){const p=sp.made.people.get(id);h={x:p.node.position.x,z:p.node.position.z,mode:p.s.mode};}
    else if(st&&st.her&&st.her.id===id)h={x:st.her.x,z:st.her.z,mode:st.her.mode};
    const P=VoidLiveContent.plans()[id]||null,e=st&&st.escort?(id==='street-cat'?st.escort.cat:st.escort.her):null,m=sp&&sp.made&&sp.made.people&&sp.made.people.get(id);
    R.push({t:+((now-last)/1000).toFixed(3),h,P:P?{key:P.key,mode:P.mode,why:P.why||null}:null,phase:e?e.phase:m&&m.esc?m.esc.st.phase:null,me:{x:walker.x,z:walker.z},convo:!!VoidConversationUI?.isOpen||mode==='dialogue',rec:(state.universe.missions||{})[mid]||null});last=now;}catch(err){R.push({err:String(err)});}});},[id,mid]);
  const latest=()=>page.evaluate(()=>{const r=globalThis.__rec;for(let i=r.length-1;i>=0;i--)if(r[i].h)return r[i];return null;});
  await page.waitForFunction(()=>globalThis.__rec.some(r=>r.h),null,{timeout:300000,polling:500});
  let p=await latest();log('at the start',JSON.stringify(p.h));await shot(page,'01-start.png');
  assert.ok(Math.hypot(p.h.x-S.wait.x,p.h.z-S.wait.z)<(USE_WAIT||WHO==='made'?1.2:40),'she is at the mission-giving spot');
  const start={x:p.h.x,z:p.h.z};
  // the player walks up at walking pace (3.9 m/s) until the mission starts by itself (5 m)
  const walkTo=(tx,tz,v=3.9)=>page.evaluate(([tx,tz,v])=>new Promise(res=>{clearInterval(globalThis.__w);let last=performance.now();globalThis.__w=setInterval(()=>{const now=performance.now(),dt=Math.min(.2,(now-last)/1000);last=now;const dx=tx-walker.x,dz=tz-walker.z,d=Math.hypot(dx,dz);if(d<.1){clearInterval(globalThis.__w);res(true);return;}const s=Math.min(d,v*dt);walker.x+=dx/d*s;walker.z+=dz/d*s;walker.yaw=Math.atan2(dx,dz);},50);}),[tx,tz,v]);
  const side=WHERE==='avenue'?{x:2.5,z:-.4}:{x:-2.5,z:0};
  await walkTo(p.h.x+side.x*4,p.h.z+side.z);for(let i=0;i<60;i++){if((await page.evaluate(m=>!!state.universe.missions[m]?.acquired,mid)))break;p=await latest();await walkTo(p.h.x+side.x*.7,p.h.z+side.z,1.5);await page.waitForTimeout(300);}
  assert.ok(await page.evaluate(m=>!!state.universe.missions[m]?.acquired,mid),'started by walking near');assert.equal(await page.evaluate(()=>document.querySelectorAll('[data-talk-choice],[data-talk-offer]').length),0,'no ACCEPT window');
  // where she is held from now on: her spot, or (no "Giver waits at") where she stood when it started
  p=await latest();const held={x:p.h.x,z:p.h.z};log('held at',JSON.stringify(held));if(USE_WAIT||WHO==='made')assert.ok(Math.hypot(held.x-start.x,held.z-start.z)<1.2,'still at the mission-giving spot when it starts');
  await page.waitForTimeout(4000);p=await latest();log('4 s after it started',JSON.stringify(p.h),JSON.stringify(p.P));await shot(page,'02-started.png');
  assert.ok(Math.hypot(p.h.x-held.x,p.h.z-held.z)<1.5,'she stays at her spot once the mission has started (was: walked off or vanished)');assert.equal(p.P&&p.P.why,'mission','held for her mission (kept out past a shift change)');
  // TALK: her line; she holds still while it shows
  const t0=await page.evaluate(()=>globalThis.__rec.length);
  assert.equal(await page.evaluate(id=>{const sp=VoidBabylon.district.streetPair,it=id==='street-cat'?sp.catItem:sp.talkItems?.[id]||walkingLocation.interactions.find(i=>i.character===id);if(!it)return 'no prompt';try{walkTarget=it;}catch{}VoidInteractions.handlers.get(it.action)({item:it});return 'ok';},id),'ok');
  await page.waitForTimeout(1500);assert.match(await page.evaluate(()=>document.body.innerText),/TEST LINE: follow me\./);await shot(page,'03-her-line.png');await page.waitForTimeout(3000);
  for(let i=0;i<8&&await page.evaluate(()=>!!VoidConversationUI?.isOpen||mode==='dialogue');i++){await page.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(b=>/CONTINUE|CLOSE/.test(b.textContent)&&b.offsetParent);if(b)b.click();});await page.waitForTimeout(400);}
  const during=await page.evaluate(t0=>globalThis.__rec.slice(t0).filter(r=>r.convo&&r.h),t0);assert.ok(during.length>0,'frames during her line');
  const moved=Math.max(...during.map(r=>Math.hypot(r.h.x-during[0].h.x,r.h.z-during[0].h.z)));log('moved during her line (m)',moved.toFixed(2));assert.ok(moved<.3,'she does not walk off while she is talking');
  // follow her, 3 m behind at walking pace; stop once (she must wait), then on to the spot
  const chase=on=>page.evaluate(on=>{clearInterval(globalThis.__c);if(!on)return;let last=performance.now();globalThis.__c=setInterval(()=>{const now=performance.now(),dt=Math.min(.2,(now-last)/1000);last=now;const r=globalThis.__rec;let x=null;for(let i=r.length-1;i>=0&&!x;i--)x=r[i];if(!x||!x.h)return;const there=x.phase==='there',tx=there?globalThis.__to.x:x.h.x,tz=there?globalThis.__to.z:x.h.z,dx=tx-walker.x,dz=tz-walker.z,d=Math.hypot(dx,dz),keep=there?0:3;if(d>keep+.05){const s=Math.min(d-keep,3.9*dt);walker.x+=dx/d*s;walker.z+=dz/d*s;}walker.yaw=Math.atan2(x.h.x-walker.x,x.h.z-walker.z);},50);},on);
  await page.evaluate(to=>{globalThis.__to=to;},S.to);await chase(true);
  await page.waitForFunction(()=>globalThis.__rec.slice(-1)[0]?.phase==='walk',null,{timeout:300000,polling:500});await shot(page,'04-she-leads.png');
  await page.waitForTimeout(20000);await chase(false);
  await page.waitForFunction(()=>globalThis.__rec.slice(-1)[0]?.phase==='wait',null,{timeout:600000,polling:500});log('the player stopped: she waits');await shot(page,'05-she-waits.png');
  await chase(true);
  await page.waitForFunction(m=>!!state.universe.missions[m]?.objectives?.['step-2'],mid,{timeout:3000000,polling:1000});await chase(false);
  p=await latest();log('step done at',JSON.stringify(p.h));await shot(page,'06-there.png');
  assert.ok(Math.hypot(p.h.x-S.to.x,p.h.z-S.to.z)<1.5,'she is at the spot');
  await page.waitForTimeout(3000);
  // the record: no jump, never gone, in the area, on her route
  const rec=await page.evaluate(()=>globalThis.__rec);if(shots)fs.writeFileSync(path.join(shots,WHO+'-'+WHERE+'-frames.json'),JSON.stringify(rec));
  const A=require(path.resolve(__dirname,'../void-runner/npc-areas.js')),E=require(path.resolve(__dirname,'../void-runner/npc-escort.js'));
  const v=WHO==='street-cat'?E.SPEED.catDash:E.SPEED.max,first=rec.findIndex(r=>r.h);let worst=0,gone=0,off=0,far=0;
  const route=[held,...E.route(held,S.to,WHERE)],toRoute=q=>{let b=Infinity;for(let i=1;i<route.length;i++){const a=route[i-1],c=route[i],dx=c.x-a.x,dz=c.z-a.z,l=dx*dx+dz*dz||1,k=Math.max(0,Math.min(1,((q.x-a.x)*dx+(q.z-a.z)*dz)/l));b=Math.min(b,Math.hypot(q.x-a.x-dx*k,q.z-a.z-dz*k));}return b;};
  for(let i=first+1;i<rec.length;i++){const r=rec[i],q=rec[i-1];if(!r.h){gone++;continue;}if(!q.h)continue;const d=Math.hypot(r.h.x-q.h.x,r.h.z-q.h.z),lim=v*Math.min(.1,r.t)+.06;worst=Math.max(worst,d-lim);
   if(d>lim)log('JUMP',i,d.toFixed(2),'>',lim.toFixed(2),JSON.stringify(q.h),'->',JSON.stringify(r.h),JSON.stringify(r.P));if(A.areaOf(r.h,WHERE)&&A.areaOf(r.h,WHERE)!==WHERE)off++;if(r.phase&&toRoute(r.h)>2)far++;}
  log('frames',rec.length,'worst over the limit (m)',worst.toFixed(3),'gone',gone,'off-area',off,'off-route',far);
  assert.ok(worst<=0,'no jump bigger than her speed x the frame time');assert.equal(gone,0,'never gone');assert.equal(off,0,'never out of her area');assert.equal(far,0,'within 2 m of her route');
  // cache.js re-checks the service worker every 15 minutes; with service workers blocked in this test the stub registration has no update() (a test-only error, not the game's)
  assert.deepEqual(errors.filter(e=>!/reading 'update'/.test(e)),[]);log('PASS');
 }catch(e){console.log('[follow-giver] page errors:',errors.slice(0,6));try{const pg=browser.contexts()[0].pages()[0];console.log(JSON.stringify(await pg.evaluate(id=>({mode,q:walkingLocation?.quarter,me:[walker?.x,walker?.z],chars:Object.keys(VoidLiveContent.env.characters||{}),plan:VoidLiveContent.plans()[id]||null,made:VoidBabylon.district?.streetPair?.made?.stats?.()||null,pair:(({here,onStreet,her,cat})=>({here,onStreet,her,cat}))(VoidBabylon.district?.streetPair?.stats?.()||{}),last:(globalThis.__rec||[]).slice(-2)}),id)).slice(0,3000));if(shots)await pg.screenshot({path:path.join(shots,WHO+'-'+WHERE+'-failure.png')});}catch(x){console.log('no diagnostics',x.message);}throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
