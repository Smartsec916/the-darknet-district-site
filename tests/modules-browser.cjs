/* Modular interiors in a real browser (offline): the location "street → office hallway → office floor → elevator → server room" is built with the Location card's own
   buttons (module-editor.js: Add > category > module, joining at a free door; + FLOOR BELOW; the door lock), then played as a draft mission (Admin gives it) behind the
   office entrance on the Avenue. The street door is LOCKED before the mission and ENTER after; walking in leads to the office hallway; the office door is locked until its
   access point is hacked; the desk computer, the elevator (to B1), the server rack are used; the steps complete; back up and out to the same street door. The real save is
   untouched; no page errors. Usage: node tests/serve-modern.cjs, then node tests/modules-browser.cjs (SITE_TEST_URL, SHOTS=dir, QUALITY=low|medium|high, BROWSER_EXECUTABLE;
   default the bundled Chromium, software GL). */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shots=process.env.SHOTS||null,quality=process.env.QUALITY||'medium';if(shots)fs.mkdirSync(shots,{recursive:true});
const bundled=fs.existsSync('/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')?'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome':'/opt/pw-browsers/chromium',exe=process.env.BROWSER_EXECUTABLE||(fs.existsSync(bundled)?bundled:null);
const log=(...a)=>console.log('[modules]',...a);
const shot=async(page,name)=>{if(shots)await page.screenshot({path:path.join(shots,'walk-'+quality+'-'+name+'.png'),timeout:240000});};
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'],...(exe?{executablePath:exe}:{})});const errors=[];
 try{
  const page=await (await browser.newContext({viewport:{width:960,height:540},serviceWorkers:'block'})).newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
  await page.route('**/api/**',r=>r.fulfill({status:503,contentType:'application/json',body:'{"error":"offline test"}'}));
  const arrive=async(fn,what)=>{for(let k=0;k<4;k++){try{await page.waitForFunction(fn,null,{timeout:180000});return;}catch(e){const again=page.getByText('TRY AGAIN',{exact:true});if(await again.count()){log('slow machine: TRY AGAIN ('+what+')');await again.first().click();continue;}throw e;}}throw Error('never arrived: '+what);};
  const boot=()=>page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:180000});
  await page.goto(base+'/void-runner.html');await boot();
  await page.evaluate(()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;s.story.flags.appearanceOffered=true;localStorage.setItem('void-runner-campaign-v1',JSON.stringify({...s,savedAt:1700000000000}));localStorage.setItem('editor-tour-done','1');});
  await page.reload();await boot();await page.evaluate(q=>{VoidGraphics.quality=q;VoidBabylon.setQuality?.(q);},quality);
  await page.evaluate(()=>VoidDevTools.identity(async p=>{if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1,preset:'NORMAL'};const e=new Error('off');e.status=404;throw e;}));
  await page.waitForTimeout(2000);const before=await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1'));
  // ---- build the location with the Location card (module-editor.js), as the Mission Editor shows it ----
  await page.evaluate(()=>new Promise((ok,no)=>{const s=document.createElement('script');s.src='void-runner/module-editor.js';s.onload=ok;s.onerror=no;document.head.append(s);}));
  const DOOR='biz-avenue-n-13';
  const loc=await page.evaluate(async DOOR=>{const ME=VoidModuleEditor,host=document.createElement('div');host.id='mod-test-host';host.style.cssText='position:fixed;left:0;top:0;width:640px;max-height:100vh;overflow:auto;background:#111;color:#ddd;z-index:99;font:12px sans-serif';document.body.append(host);
   let m={id:'draft-hq-m1',objectives:[],apartments:[]};const ed=(fn)=>{const x=JSON.parse(JSON.stringify(m));fn(x);m=x;draw();};
   const doorSelect=(v,on,attrs)=>{const s=document.createElement('select');for(const [k,val] of Object.entries(attrs||{}))s.setAttribute(k,val);s.append(new Option('—',''));for(const d of VoidApartments.doors())s.append(new Option(d.name,d.id));s.value=v||'';s.onchange=()=>on(s.value);return s;};
   function draw(){host.innerHTML='';if(!m.apartments.length){host.append(ME.picker(null,type=>ME.create(m,type,ed),{}));return;}m.apartments.forEach((a,k)=>host.append(ME.card({m,a,k,ed,doorSelect,jump:()=>{}})));}
   const pick=(cat,type,to)=>{const c=host.querySelector('[data-mod-cat]');c.value=cat;c.dispatchEvent(new Event('change'));const t=host.querySelector('[data-mod-type]');t.value=type;t.dispatchEvent(new Event('change'));if(to){const s=host.querySelector('[data-mod-to]');s.value=to;}host.querySelector('[data-mod-add]').click();};
   draw();pick('hallway','hall-office');const ds=host.querySelector('[data-me-apt-door]');ds.value=DOOR;ds.dispatchEvent(new Event('change'));
   pick('office','office-floor','hall.n0');pick('elevator','elevator','office.e2');host.querySelector('[data-mod-floor-add="-1"]').click();pick('server','server-room','');
   host.querySelector('[data-mod-floor="0"]').click();const lockable=[...host.querySelectorAll('[data-mod-lock]')];
   // select the hallway on the plan and lock its door to the office
   ed(()=>{});const cv=host.querySelector('[data-mod-plan]');const a=m.apartments[0];const an=VoidModules.analyse(a);
   ed(x=>{x.apartments[0].locks=['hall.n0'];});const probs=host.querySelector('[data-mod-problems]').textContent;const res={loc:m.apartments[0],probs,plan:!!cv,html:host.innerHTML.length};host.remove();return res;},DOOR);
  log('built with the card:',JSON.stringify(loc.loc.modules.map(x=>x.id+':'+x.type+'@'+(x.floor||0))),'·',loc.probs);
  assert.match(loc.probs,/Everything fits/);assert.deepEqual(loc.loc.modules.map(x=>x.type),['hall-office','office-floor','elevator','elevator','server-room']);
  const ID='draft-hq-m1',L=loc.loc;
  const r=await page.evaluate(async({ID,L,DOOR})=>{const MC=VoidMissionContent,LC=VoidLiveContent;
   const objectives=[{id:'in',kind:'apt-enter',apt:L.id,mod:'hall',label:'Get into the building'},{id:'hack',kind:'hack',ap:L.id+'/hall.n0',hold:2,label:'Hack the office door'},
    {id:'pc',kind:'apt-use',apt:L.id,mod:'office',object:'computer',label:'Use a desk computer'},{id:'down',kind:'apt-enter',apt:L.id,mod:'servers',label:'Go down to the server room'},{id:'rack',kind:'apt-use',apt:L.id,mod:'servers',object:'rack',label:'Use a server rack'}];
   const trees=[{id:'draft-hq',name:'The office',missions:[{id:ID,number:81,title:'The office',type:'side',giver:'admin',offer:[{who:'admin',text:'There is an office on the Avenue.'}],apartments:[L],objectives}]}];
   const content=MC.fromDrafts({local:{trees},givers:LC.env.givers});const chk=MC.check(content,{givers:new Map(LC.env.givers.map(g=>[g.id,g])),places:VoidMissionGivers.placeIds()});if(!chk.ok)return {problem:chk.errors.join(' | ')};const d=VoidApartments.door(DOOR);
   return await VoidDevTest.session({banner:'MODULES TEST',kind:'draft',apply:()=>LC.useDraft(content),build:()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;s.story.flags.appearanceOffered=true;return s;},
    enter:async()=>{state.location='earth';await enterWalking(VoidDistrictArea.KEY.street,{silent:true,quarter:d.quarter,spawn:[d.front[0]-d.n[0]*1.5,1.7,d.front[1]-d.n[1]*1.5],yaw:Math.atan2(d.n[0],d.n[1])});}});},{ID,L,DOOR});
  assert.ok(r&&r.started&&!r.problem,JSON.stringify(r));
  await page.waitForFunction(()=>mode==='walking'&&walkingLocation?.area==='street'&&VoidBabylon.district?.aptDoors,null,{timeout:300000});await page.waitForTimeout(1500);
  const label=()=>page.evaluate(id=>walkingLocation.interactions.find(i=>i.door===id)?.label,DOOR);
  assert.match(await label(),/LOCKED/,'locked before the mission');await shot(page,'1-street');
  assert.ok(await page.evaluate(()=>VoidMissionContent.treeEvent(state,VoidLiveContent.env,{type:'talk',npcs:['admin']},VoidMissions,C).offered),'Admin gives the mission');
  await page.waitForTimeout(1200);assert.match(await label(),/^ENTER/,'open for this player now');
  await page.evaluate(id=>{const d=VoidApartments.door(id);walker.x=d.x-d.n[0]*.9;walker.z=d.z-d.n[1]*.9;},DOOR);await page.waitForTimeout(1500);
  await page.evaluate(id=>{const d=VoidApartments.door(id);walker.x=d.x-d.n[0]*.42;walker.z=d.z-d.n[1]*.42;},DOOR);
  await arrive(()=>walkingLocation?.modular&&mode==='walking'&&walkingLocation.cluster?.mods?.some(m=>m.id==='hall'),'the office hallway');log('in the hallway');await page.waitForTimeout(3000);
  const done=()=>page.evaluate(id=>Object.entries(state.universe.missions[id]?.objectives||{}).filter(([,v])=>v===true).map(([k])=>k),ID);
  await page.waitForFunction(id=>state.universe.missions[id]?.objectives?.in===true,ID,{timeout:20000});log('step "get into the building" done');await shot(page,'2-hallway');
  const cost={};const measure=async k=>{cost[k]=await page.evaluate(async()=>{const S=VoidBabylon.scene,inst=new BABYLON.SceneInstrumentation(S);await new Promise(r=>setTimeout(r,1500));const n=inst.drawCallsCounter.current;inst.dispose();return {draws:n,meshes:S.getActiveMeshes().length,lights:S.lights.length};});};
  await measure('hallway + office + lift (floor 0)');
  // the office door is locked: walk up to it (it stays shut), hack its access point
  const door=await page.evaluate(()=>walkingLocation.cluster.doors.find(d=>d.a==='hall.n0'||d.b==='hall.n0'));
  await page.evaluate(d=>{walker.x=d.x-d.n[0]*1;walker.z=d.z-d.n[1]*1;walker.yaw=Math.atan2(d.n[0],d.n[1]);},door);await page.waitForTimeout(1500);
  assert.equal(await page.evaluate(id=>VoidBabylon.zone.door(id).t,door.id),0,'a locked door does not open');assert.equal(await page.evaluate(id=>walkingLocation.solids.find(s=>s.door===id).open,door.id),false);
  await page.evaluate(()=>{const it=walkingLocation.interactions.find(i=>i.action==='apt-ap'&&/hall\.n0$/.test(i.ap));walker.x=it.position[0]-.4*Math.sign(it.position[0]-walker.x||1)*0;VoidInteractions.handlers.get('apt-ap')({item:it});});
  await page.waitForTimeout(700);assert.equal(await page.evaluate(()=>!!VoidApartments.hacking),true,'the hack runs');await shot(page,'3-hack');
  await page.waitForFunction(id=>state.universe.missions[id]?.objectives?.hack===true,ID,{timeout:30000});log('hack done');
  await page.waitForFunction(id=>VoidBabylon.zone.door(id)&&!VoidBabylon.zone.door(id).locked,door.id,{timeout:5000});await page.waitForTimeout(1500);
  await page.evaluate(d=>{walker.x=d.x-d.n[0]*.9;walker.z=d.z-d.n[1]*.9;},door);
  try{await page.waitForFunction(id=>VoidBabylon.zone.door(id).t>.6&&walkingLocation.solids.find(s=>s.door===id).open,door.id,{timeout:30000});}
  catch(e){throw Error('the hacked door slides open as the player comes near: '+JSON.stringify(await page.evaluate(id=>{const d=VoidBabylon.zone.door(id);return {fps:VoidBabylon.scene.getEngine().getFps(),t:d.t,locked:d.locked,range:d.range,rec:[d.rec.x,d.rec.z],walker:[walker.x,walker.z],mode,solid:walkingLocation.solids.find(s=>s.door===id)};},door.id)));}
  // walk through into the office floor
  for(const k of [.4,-.6,-1.6])await page.evaluate(([d,k])=>{walker.x=d.x+d.n[0]*k;walker.z=d.z+d.n[1]*k;},[door,k]).then(()=>page.waitForTimeout(250));
  await page.evaluate(d=>{walker.x=d.x+d.n[0]*2.5;walker.z=d.z+d.n[1]*2.5;walker.yaw=Math.atan2(d.n[0],d.n[1]);walker.pitch=.08;},door);
  await page.waitForFunction(()=>VoidApartments.insideMod()==='office',null,{timeout:5000});await page.waitForTimeout(1500);await shot(page,'4-office');
  const pcSay=await page.evaluate(()=>{let t='';const a=globalThis.announce;globalThis.announce=x=>{t+=x+' | ';};try{const it=walkingLocation.interactions.find(i=>i.action==='mod-use'&&i.object==='computer');walker.x=it.position[0];walker.z=it.position[2];VoidInteractions.handlers.get('mod-use')({item:it});}finally{globalThis.announce=a;}resumeWalking();return t;});
  assert.match(pcSay,/COMPUTER/);await page.waitForFunction(id=>state.universe.missions[id]?.objectives?.pc===true,ID,{timeout:20000});log('desk computer used:',pcSay);
  // lights off and on again in the office
  const lights=await page.evaluate(()=>{const it=walkingLocation.interactions.find(i=>i.mod==='office'&&i.object==='lights');VoidInteractions.handlers.get('mod-use')({item:it});const a=VoidBabylon.zone.lightsOf('office');VoidInteractions.handlers.get('mod-use')({item:it});resumeWalking();return [a,VoidBabylon.zone.lightsOf('office')];});
  assert.deepEqual(lights,[false,true],'the office lights switch');
  // into the elevator, down to B1
  await page.evaluate(()=>{const cab=walkingLocation.cluster.mods.find(m=>m.type==='elevator');walker.x=cab.cx;walker.z=cab.cz;walker.yaw=Math.PI/2;});await page.waitForTimeout(1500);
  await page.evaluate(()=>{const c=walkingLocation.cluster.mods.find(m=>m.type==='elevator');walker.x=c.cx+.4;walker.z=c.cz;walker.yaw=-Math.PI/2;});await page.waitForTimeout(800);await shot(page,'5-elevator');
  await page.evaluate(()=>{const it=walkingLocation.interactions.find(i=>i.action==='mod-elev'&&i.floor===-1);VoidInteractions.handlers.get('mod-elev')({item:it});});
  await arrive(()=>walkingLocation?.modular&&mode==='walking'&&walkingLocation.cluster?.mods?.some(m=>m.id==='servers'),'the server room floor');log('down to B1');await page.waitForTimeout(3000);await measure('lift + server room (B1)');
  await page.evaluate(()=>{const s=walkingLocation.cluster.mods.find(m=>m.id==='servers');walker.x=s.cx-1;walker.z=s.cz-3.2;walker.yaw=0;walker.pitch=.05;});
  await page.waitForFunction(id=>state.universe.missions[id]?.objectives?.down===true,ID,{timeout:20000});await page.waitForTimeout(1200);await shot(page,'6-servers');
  const rackSay=await page.evaluate(()=>{let t='';const a=globalThis.announce;globalThis.announce=x=>{t+=x+' | ';};try{const it=walkingLocation.interactions.find(i=>i.object==='rack');walker.x=it.position[0];walker.z=it.position[2];VoidInteractions.handlers.get('mod-use')({item:it});}finally{globalThis.announce=a;}resumeWalking();return t;});
  assert.match(rackSay,/RACK/);await page.waitForFunction(id=>state.universe.missions[id]?.completed===true,ID,{timeout:20000});log('server rack used; mission complete');
  // back up and out
  await page.evaluate(()=>{const it=walkingLocation.interactions.find(i=>i.action==='mod-elev');VoidInteractions.handlers.get('mod-elev')({item:it});});
  await arrive(()=>walkingLocation?.modular&&mode==='walking'&&walkingLocation.cluster?.mods?.some(m=>m.id==='hall'),'back up');
  await page.evaluate(()=>VoidInteractions.handlers.get('mod-exit')({item:{}}));await arrive(()=>walkingLocation?.area==='street'&&mode==='walking','the street');
  const back=await page.evaluate(id=>{const d=VoidApartments.door(id);return {dist:Math.hypot(walker.x-d.front[0],walker.z-d.front[1])};},DOOR);assert.ok(back.dist<1.5,JSON.stringify(back));
  await page.waitForTimeout(1500);assert.match(await label(),/LOCKED/,'locked again once the mission is done');
  log('draw calls',JSON.stringify(cost));log('steps',JSON.stringify(await done()));
  assert.equal(await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1')),before,'the real save is untouched');
  assert.deepEqual(errors.filter(e=>!/offline|Failed to fetch|NetworkError|ERR_/.test(e)),[]);log('PASS',quality);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
