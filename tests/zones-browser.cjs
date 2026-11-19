/* Zones and the pistol in a real browser (offline; zones.js, zone-integration.js, zone-editor.js). The walk:
   1. The District (Friendly): the chip says FRIENDLY in green; Admin's stock sells the base pistol (BUY); drawn, the trigger does nothing ("Weapons are locked here").
   2. A draft mission (Admin gives it) with a location behind an Avenue office door: an office hallway (Neutral, a security guard) and an office floor (normal = Friendly,
      a mercenary that a "Change zone" step brings in). In the hallway the chip is NEUTRAL in orange; the first trigger press only warns (the safety catch), the second fires;
      the guard turns on the player and shoots.
   3. The office floor: FRIENDLY again; using the desk computer completes a step, the "Change zone" step after it makes the office HOSTILE at once (red chip) and brings in the
      mercenary, who sees the player and shoots; the player shoots back until it is down.
   4. Taken down: the TAKEN DOWN card, GET UP puts the player on the street outside the door with full health.
   The real save is untouched; no page errors. Usage: node tests/serve-modern.cjs, then node tests/zones-browser.cjs (SITE_TEST_URL, SHOTS=dir, BROWSER_EXECUTABLE;
   default the bundled Chromium, software GL). */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shots=process.env.SHOTS||null;if(shots)fs.mkdirSync(shots,{recursive:true});
const bundled=fs.existsSync('/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')?'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome':'/opt/pw-browsers/chromium',exe=process.env.BROWSER_EXECUTABLE||(fs.existsSync(bundled)?bundled:null);
const log=(...a)=>console.log('[zones]',...a);
const shot=async(page,name)=>{if(shots)await page.screenshot({path:path.join(shots,name+'.png'),timeout:240000});};
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required'],...(exe?{executablePath:exe}:{})});const errors=[];
 try{
  const page=await (await browser.newContext({viewport:{width:1366,height:768},serviceWorkers:'block'})).newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
  await page.route('**/api/**',r=>r.fulfill({status:503,contentType:'application/json',body:'{"error":"offline test"}'}));
  const boot=()=>page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:180000});
  const arrive=async(fn,what,arg)=>{for(let k=0;k<4;k++){try{await page.waitForFunction(fn,arg,{timeout:180000});return;}catch(e){const again=page.getByText('TRY AGAIN',{exact:true});if(await again.count()){log('slow machine: TRY AGAIN ('+what+')');await again.first().click();continue;}throw e;}}throw Error('never arrived: '+what);};
  await page.goto(base+'/void-runner.html');await boot();
  await page.evaluate(()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;s.story.flags.appearanceOffered=true;s.credits=1000;localStorage.setItem('void-runner-campaign-v1',JSON.stringify({...s,savedAt:1700000000000}));localStorage.setItem('editor-tour-done','1');});
  await page.reload();await boot();await page.evaluate(()=>{VoidGraphics.quality='low';VoidBabylon.setQuality?.('low');});
  await page.evaluate(()=>VoidDevTools.identity(async p=>{if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1,preset:'NORMAL'};const e=new Error('off');e.status=404;throw e;}));
  await page.waitForTimeout(1500);
  const chip=()=>page.evaluate(()=>{const c=document.getElementById('zone-chip');return {hidden:c.hidden,zone:c.dataset.zone,word:c.querySelector('b').textContent,colour:getComputedStyle(c).getPropertyValue('--zc').trim(),top:c.getBoundingClientRect().top};});
  // ---- 1. the District: Friendly; Admin sells the pistol
  await page.evaluate(async()=>{const d=JSON.parse(localStorage.getItem('void-runner-campaign-v1'));state=d;state.progression=VoidProgression.restore(state.progression,state);walkingLocation=walker=null;mode='menu';document.getElementById('screen')?.classList.add('hidden');state.location='earth';await enterWalking(VoidDistrictArea.KEY.interior,{silent:true,...VoidDistrictArea.resume(state,VoidNeoChinatown)});});
  await arrive(()=>mode==='walking'&&walkingLocation?.area==='interior','the District');await page.waitForTimeout(1500);
  let c=await chip();log('District chip',c);assert.equal(c.hidden,false);assert.equal(c.word,'FRIENDLY');assert.equal(c.colour,'#37d67a');
  await page.evaluate(()=>{walkTarget=walkingLocation.interactions.find(i=>i.action==='admin');interactWalking();});
  await page.waitForSelector('[data-action="admin-buy-weapon:base-pistol"]',{state:'attached',timeout:90000});await shot(page,'1-admin-stock');
  await page.evaluate(()=>document.querySelector('[data-action="admin-buy-weapon:base-pistol"]').click());
  const bought=await page.evaluate(()=>({weapons:state.progression.personal.weapons,weapon:state.progression.personal.weapon,credits:state.credits,label:document.querySelector('[data-admin-item="base-pistol"] button')?.textContent}));
  log('bought',bought);assert.deepEqual(bought.weapons,['base-pistol']);assert.equal(bought.weapon,'base-pistol');assert.equal(bought.credits,1000-350);assert.match(bought.label,/OWNED/);
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('void-runner-campaign-v1')).progression.personal.weapons);assert.deepEqual(saved,['base-pistol'],'saved');
  await page.evaluate(()=>resumeWalking());await page.waitForTimeout(500);
  const locked=await page.evaluate(()=>{groundAction('draw');const a=state.progression.personal.ammo;groundAction('fire');return {drawn:groundState.drawn,before:a,after:state.progression.personal.ammo,toast:document.getElementById('zone-toast').textContent,shots:VoidZoneRun.stats.shots};});
  log('Friendly trigger',locked);assert.equal(locked.drawn,true);assert.equal(locked.after,locked.before);assert.match(locked.toast,/Weapons are locked here/);assert.equal(locked.shots,0);
  await page.waitForTimeout(400);await shot(page,'2-district-friendly-locked');
  // ---- 2. the draft mission: build its location with the Location card (module-editor.js), as the Mission Editor shows it
  await page.evaluate(()=>new Promise((ok,no)=>{const s=document.createElement('script');s.src='void-runner/module-editor.js';s.onload=ok;s.onerror=no;document.head.append(s);}));
  const DOOR='biz-avenue-n-13';
  const L=await page.evaluate(async DOOR=>{const ME=VoidModuleEditor,host=document.createElement('div');host.style.cssText='position:fixed;left:0;top:0;width:640px;z-index:99;background:#111';document.body.append(host);
   let m={id:'draft-zt-m1',objectives:[],apartments:[]};const ed=fn=>{const x=JSON.parse(JSON.stringify(m));fn(x);m=x;draw();};
   const doorSelect=(v,on,attrs)=>{const s=document.createElement('select');for(const [k,val] of Object.entries(attrs||{}))s.setAttribute(k,val);s.append(new Option('—',''));for(const d of VoidApartments.doors())s.append(new Option(d.name,d.id));s.value=v||'';s.onchange=()=>on(s.value);return s;};
   function draw(){host.innerHTML='';if(!m.apartments.length){host.append(ME.picker(null,type=>ME.create(m,type,ed),{}));return;}m.apartments.forEach((a,k)=>host.append(ME.card({m,a,k,ed,doorSelect,jump:()=>{}})));}
   const pick=(cat,type,to)=>{const c=host.querySelector('[data-mod-cat]');c.value=cat;c.dispatchEvent(new Event('change'));const t=host.querySelector('[data-mod-type]');t.value=type;t.dispatchEvent(new Event('change'));if(to){const s=host.querySelector('[data-mod-to]');s.value=to;}host.querySelector('[data-mod-add]').click();};
   draw();pick('hallway','hall-office');const ds=host.querySelector('[data-me-apt-door]');ds.value=DOOR;ds.dispatchEvent(new Event('change'));pick('office','office-floor','hall.n0');const loc=m.apartments[0];host.remove();return loc;},DOOR);
  log('location',JSON.stringify(L.modules.map(x=>x.id+':'+x.type)));
  const ID='draft-zt-m1';
  const r=await page.evaluate(async({ID,L,DOOR})=>{const MC=VoidMissionContent,LC=VoidLiveContent;
   const objectives=[{id:'in',kind:'apt-enter',apt:L.id,mod:'hall',label:'Get into the building'},{id:'pc',kind:'apt-use',apt:L.id,mod:'office',object:'computer',label:'Use a desk computer'},
    {id:'z',kind:'zone',target:L.id+'/office',zone:'hostile',spawn:true,label:'The office turns hostile'},{id:'rack',kind:'apt-use',apt:L.id,mod:'office',object:'printer',label:'Use the copier'}];
   const combat={places:{[L.id+'/hall']:'neutral'},armed:[{id:'guard',at:L.id+'/hall',x:0,z:1,figure:'security',role:'guard',yaw:0},{id:'merc',at:L.id+'/office',x:2,z:2,figure:'merc',role:'patrol',route:[[-2,2]]}],onDeath:'retry'};
   const trees=[{id:'draft-zt',name:'Zones test',missions:[{id:ID,number:82,title:'Zones test',type:'side',giver:'admin',offer:[{who:'admin',text:'There is an office on the Avenue.'}],apartments:[L],objectives,combat}]}];
   const content=MC.fromDrafts({local:{trees,zones:{}},givers:LC.env.givers});const chk=MC.check(content,{givers:new Map(LC.env.givers.map(g=>[g.id,g])),places:VoidMissionGivers.placeIds()});if(!chk.ok)return {problem:chk.errors.join(' | ')};
   if(!content.trees[0].missions[0].combat)return {problem:'combat stripped'};const d=VoidApartments.door(DOOR);
   return await VoidDevTest.session({banner:'ZONES TEST',kind:'draft',apply:()=>LC.useDraft(content),build:()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;s.story.flags.appearanceOffered=true;s.progression=VoidProgression.restore({...VoidProgression.fresh(),personal:{...VoidProgression.fresh().personal,weapons:['base-pistol']}},s);return s;},
    enter:async()=>{state.location='earth';await enterWalking(VoidDistrictArea.KEY.street,{silent:true,quarter:d.quarter,spawn:[d.front[0]-d.n[0]*1.5,1.7,d.front[1]-d.n[1]*1.5],yaw:Math.atan2(d.n[0],d.n[1])});}});},{ID,L,DOOR});
  assert.ok(r&&r.started&&!r.problem,JSON.stringify(r));
  await arrive(()=>mode==='walking'&&walkingLocation?.area==='street'&&VoidBabylon.district?.aptDoors,'the street');await page.waitForTimeout(1500);
  c=await chip();log('street chip',c);assert.equal(c.word,'FRIENDLY');await shot(page,'3-street-friendly');
  assert.ok(await page.evaluate(()=>VoidMissionContent.treeEvent(state,VoidLiveContent.env,{type:'talk',npcs:['admin']},VoidMissions,C).offered),'Admin gives the mission');await page.waitForTimeout(1200);
  await page.evaluate(()=>Object.assign(VOID_BALANCE,{footEnemyDamage:3,footEnemyAccuracy:.9,footEnemyReaction:.6}));   // the test needs the player to live through it
  await page.evaluate(id=>{const d=VoidApartments.door(id);walker.x=d.x-d.n[0]*.9;walker.z=d.z-d.n[1]*.9;},DOOR);await page.waitForTimeout(1500);
  await page.evaluate(id=>{const d=VoidApartments.door(id);walker.x=d.x-d.n[0]*.42;walker.z=d.z-d.n[1]*.42;},DOOR);
  await arrive(()=>walkingLocation?.modular&&mode==='walking'&&walkingLocation.cluster?.mods?.some(m=>m.id==='hall'),'the office hallway');log('in the hallway');await page.waitForTimeout(2500);
  // stand in the hallway facing the guard
  const face=async who=>page.evaluate(who=>{const e=VoidZoneRun.enemies.find(x=>x.id===who);walker.yaw=Math.atan2(e.x-walker.x,e.z-walker.z);walker.pitch=Math.atan2(walker.y-1.3,Math.hypot(e.x-walker.x,e.z-walker.z));return e;},who);
  await page.evaluate(()=>{const h=walkingLocation.cluster.mods.find(m=>m.id==='hall');walker.x=h.cx;walker.z=h.cz-1.5;});await page.waitForTimeout(1200);
  c=await chip();log('hallway chip',c);assert.equal(c.word,'NEUTRAL');assert.equal(c.colour,'#ff9a2e');
  const g0=await face('guard');log('guard',JSON.stringify({x:g0.x,z:g0.z,alert:g0.alert}));assert.equal(g0.alert,false,'the guard is calm before a shot');
  await page.waitForTimeout(2500);assert.equal((await page.evaluate(()=>VoidZoneRun.stats.enemyShots)),0,'the guard does not shoot an armed player who has not fired');
  const warn=await page.evaluate(()=>{if(!groundState.drawn)groundAction('draw');const a=state.progression.personal.ammo;groundAction('fire');return {before:a,after:state.progression.personal.ammo,toast:document.getElementById('zone-toast').textContent};});
  log('Neutral first press',warn);assert.equal(warn.after,warn.before,'the safety catch holds the first press');assert.match(warn.toast,/NEUTRAL AREA/);
  const fired=await page.evaluate(()=>{const a=state.progression.personal.ammo;groundAction('fire');return {before:a,after:state.progression.personal.ammo,esc:VoidZoneRun.escalation,shots:VoidZoneRun.stats.shots};});
  log('Neutral second press',fired);await shot(page,'4-hallway-neutral-safety-then-shot');assert.equal(fired.after,fired.before-1);assert.ok(fired.esc.at,'the area is provoked');
  await page.waitForFunction(()=>VoidZoneRun.stats.enemyShots>0&&groundState.health<100,null,{timeout:60000});
  log('the guard attacks',await page.evaluate(()=>({health:groundState.health,shots:VoidZoneRun.stats.enemyShots,alert:VoidZoneRun.enemies.find(e=>e.id==='guard').alert})));await shot(page,'5-hallway-guard-attacks');
  // ---- 3. the office floor: Friendly, then the "Change zone" step makes it Hostile and brings the mercenary in
  await page.evaluate(()=>{groundState.health=100;const o=walkingLocation.cluster.mods.find(m=>m.id==='office');walker.x=o.cx;walker.z=o.cz;});await page.waitForTimeout(1200);
  c=await chip();log('office chip before',c);assert.equal(c.word,'FRIENDLY');assert.equal(await page.evaluate(()=>VoidZoneRun.enemies.some(e=>e.id==='merc')),false,'the mercenary waits for the Change zone step');
  const lockedOffice=await page.evaluate(()=>{const a=state.progression.personal.ammo;groundAction('fire');return a===state.progression.personal.ammo;});assert.ok(lockedOffice,'Friendly office: locked');
  await page.evaluate(()=>{const it=walkingLocation.interactions.find(i=>i.action==='mod-use'&&i.object==='computer');walker.x=it.position[0];walker.z=it.position[2];VoidInteractions.handlers.get('mod-use')({item:it});resumeWalking();});
  await page.waitForFunction(id=>state.universe.missions[id]?.objectives?.z===true,ID,{timeout:20000});log('the Change zone step is done');
  await page.waitForFunction(()=>document.getElementById('zone-chip').dataset.zone==='hostile',null,{timeout:5000});c=await chip();log('office chip after',c);assert.equal(c.word,'HOSTILE');assert.equal(c.colour,'#ff4646');
  await page.waitForFunction(()=>VoidZoneRun.enemies.some(e=>e.id==='merc'),null,{timeout:5000});
  await page.evaluate(()=>{const o=walkingLocation.cluster.mods.find(m=>m.id==='office');walker.x=o.cx;walker.z=o.cz-2.5;});
  const s0=await page.evaluate(()=>VoidZoneRun.stats.enemyShots);
  await page.waitForFunction(()=>VoidZoneRun.enemies.find(e=>e.id==='merc')?.alert,null,{timeout:30000});
  await page.waitForFunction(s0=>VoidZoneRun.stats.enemyShots>s0,s0,{timeout:30000});log('the mercenary sees the player and shoots',await page.evaluate(()=>({health:groundState.health,merc:VoidZoneRun.enemies.find(e=>e.id==='merc')})));
  await face('merc');await page.waitForTimeout(300);await shot(page,'6-office-hostile-merc');
  for(let k=0;k<14;k++){const dead=await page.evaluate(()=>{groundState.health=100;const e=VoidZoneRun.enemies.find(x=>x.id==='merc');walker.yaw=Math.atan2(e.x-walker.x,e.z-walker.z);walker.pitch=Math.atan2(walker.y-1.25,Math.hypot(e.x-walker.x,e.z-walker.z));if(groundState.reload)return e.dead;if(state.progression.personal.ammo<1){groundAction('reload');return e.dead;}groundState.cooldown=0;groundAction('fire');return e.dead;});if(dead)break;await page.waitForTimeout(500);}
  const merc=await page.evaluate(()=>VoidZoneRun.enemies.find(x=>x.id==='merc'));log('mercenary',JSON.stringify({hp:merc.hp,dead:merc.dead}),'hits',await page.evaluate(()=>VoidZoneRun.stats.hits));assert.equal(merc.dead,true,'the player shoots the mercenary down');
  await page.waitForTimeout(800);await shot(page,'7-office-merc-down');
  // ---- 4. taken down, then GET UP outside
  await page.evaluate(()=>{groundState.health=5;VoidZoneRun.hurtPlayer(20);});await page.waitForSelector('#zone-down:not([hidden])',{timeout:5000});await shot(page,'8-taken-down');
  await page.click('[data-zone-up]');await arrive(()=>mode==='walking'&&walkingLocation?.area==='street'&&!VoidZoneRun.down,'the street after GET UP');
  await page.waitForFunction(()=>!document.getElementById('zone-chip').hidden&&document.getElementById('zone-chip').dataset.zone==='friendly',null,{timeout:10000}).catch(()=>{});   // the chip repaints four times a second
  const after=await page.evaluate(id=>({health:groundState.health,taken:!!state.universe.missions[id]?.acquired,chip:document.getElementById('zone-chip').dataset.zone}),ID);log('after GET UP',after);
  assert.equal(after.health,100);assert.equal(after.taken,true,'retry: the mission is still taken');assert.equal(after.chip,'friendly');await page.waitForTimeout(1200);await shot(page,'9-street-after');
  await page.evaluate(()=>VoidDevTest.end?.());
  const real=await page.evaluate(()=>JSON.parse(localStorage.getItem('void-runner-campaign-v1')).progression.personal.weapons);assert.deepEqual(real,['base-pistol'],'the real save keeps the bought pistol only');
  assert.deepEqual(errors,[],'no page errors');log('PASS');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
