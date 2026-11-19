/* Mission apartments in a real browser (offline): a draft mission (Admin gives it) with an apartment behind the street door No. 96, Main Street and four steps
   (go into it, use its safe, hack its entry access point, switch off its lights). Before the mission the street door says LOCKED; after Admin's offer it is ENTER and amber;
   walking into it (it slides open) leads to the hallway, walking into the mission's hallway door to the apartment. Every object is used; the steps complete; the lights
   toggle; the hack runs; leaving goes back to the hallway and then to the same street door. The real save is untouched; no page errors.
   Usage: node tests/serve-modern.cjs, then node tests/apartments-browser.cjs (SITE_TEST_URL, SHOTS=dir, STYLE=rundown|normal|luxury, BROWSER_EXECUTABLE; default the bundled
   Chromium, software GL). */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',shots=process.env.SHOTS||null,style=process.env.STYLE||'normal';if(shots)fs.mkdirSync(shots,{recursive:true});
const bundled=fs.existsSync('/opt/pw-browsers/chromium-1243/chrome-linux64/chrome')?'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome':'/opt/pw-browsers/chromium',exe=process.env.BROWSER_EXECUTABLE||(fs.existsSync(bundled)?bundled:null);
const log=(...a)=>console.log('[apartments]',...a);
const shot=async(page,name)=>{if(shots)await page.screenshot({path:path.join(shots,'walk-'+style+'-'+name+'.png'),timeout:180000});};
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'],...(exe?{executablePath:exe}:{})});const errors=[];
 try{
  const page=await (await browser.newContext({viewport:{width:1280,height:720},serviceWorkers:'block'})).newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline test'}));
  await page.route('**/api/**',r=>r.fulfill({status:503,contentType:'application/json',body:'{"error":"offline test"}'}));
  const arrive=async(fn,what)=>{for(let k=0;k<4;k++){try{await page.waitForFunction(fn,null,{timeout:150000});return;}catch(e){const again=page.getByText('TRY AGAIN',{exact:true});if(await again.count()){log('slow machine: TRY AGAIN ('+what+')');await again.first().click();continue;}throw e;}}throw Error('never arrived: '+what);};
  const boot=()=>page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:180000});
  await page.goto(base+'/void-runner.html');await boot();
  await page.evaluate(()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;s.story.flags.appearanceOffered=true;localStorage.setItem('void-runner-campaign-v1',JSON.stringify({...s,savedAt:1700000000000}));localStorage.setItem('editor-tour-done','1');});
  await page.reload();await boot();const before=await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1'));
  await page.evaluate(()=>VoidDevTools.identity(async p=>{if(p==='developer/balance')return {values:VoidBalance.defaults,revision:1,preset:'NORMAL'};const e=new Error('off');e.status=404;throw e;}));
  const ID='draft-flat-m1',DOOR='apt-main-w-96';
  const r=await page.evaluate(async({ID,DOOR,style})=>{const MC=VoidMissionContent,L=VoidLiveContent;
   const trees=[{id:'draft-flat',name:'The flat',missions:[{id:ID,number:72,title:'Someone’s flat',type:'side',giver:'admin',offer:[{who:'admin',text:'There is a flat on Main Street.'}],
    apartments:[{id:'safehouse',style,door:DOOR,number:13}],
    objectives:[{id:'in',kind:'apt-enter',apt:'safehouse',label:'Get inside'},{id:'safe',kind:'apt-use',apt:'safehouse',object:'safe',label:'Try the safe'},{id:'hack',kind:'hack',ap:'safehouse/entry',hold:2,label:'Hack the entry panel'},{id:'dark',kind:'apt-use',apt:'safehouse',object:'lights',label:'Switch off the lights'}]}]}];
   const content=MC.fromDrafts({local:{trees},givers:L.env.givers});const d=VoidApartments.door(DOOR);
   return await VoidDevTest.session({banner:'APARTMENT TEST',kind:'draft',apply:()=>L.useDraft(content),build:()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;s.story.flags.appearanceOffered=true;return s;},
    enter:async()=>{state.location='earth';await enterWalking(VoidDistrictArea.KEY.street,{silent:true,quarter:d.quarter,spawn:[d.front[0]-d.n[0]*1.5,1.7,d.front[1]-d.n[1]*1.5],yaw:Math.atan2(d.n[0],d.n[1])});}});},{ID,DOOR,style});
  assert.ok(r&&r.started&&!r.problem,JSON.stringify(r));
  await page.waitForFunction(()=>mode==='walking'&&walkingLocation?.area==='street'&&VoidBabylon.district?.aptDoors,null,{timeout:300000});await page.waitForTimeout(1500);
  const label=()=>page.evaluate(id=>walkingLocation.interactions.find(i=>i.door===id)?.label,DOOR);
  assert.match(await label(),/LOCKED/,'locked before the mission');
  await page.evaluate(id=>VoidInteractions.handlers.get('apt-door')({item:{door:id}}),DOOR);await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>walkingLocation.area),'street','a locked door does not open');
  await shot(page,'1-locked');
  const offered=await page.evaluate(()=>{const x=VoidMissionContent.treeEvent(state,VoidLiveContent.env,{type:'talk',npcs:['admin']},VoidMissions,C);return x.offered;});assert.ok(offered,'Admin gives the mission');
  await page.waitForTimeout(1200);log('debug',JSON.stringify(await page.evaluate(id=>({apts:VoidLiveContent.apartments(),pool:state.story.flags.missionPool,rec:state.universe.missions[id],trees:(VoidLiveContent.env.trees||[]).map(t=>t.missions.map(m=>[m.id,!!m.apartments]))}),ID)));assert.match(await label(),/^ENTER/,'open for this player now');
  // walk into the door: it slides open, then the hallway
  await page.evaluate(id=>{const d=VoidApartments.door(id);walker.x=d.x-d.n[0]*.9;walker.z=d.z-d.n[1]*.9;walker.yaw=Math.atan2(d.n[0],d.n[1]);},DOOR);await page.waitForTimeout(1500);await shot(page,'2-open');
  await page.evaluate(id=>{const d=VoidApartments.door(id);walker.x=d.x-d.n[0]*.42;walker.z=d.z-d.n[1]*.42;},DOOR);
  await arrive(()=>walkingLocation?.part==='hall'&&mode==='walking','hallway');log('in the hallway');await page.waitForTimeout(1500);await shot(page,'3-hall');
  const hall=await page.evaluate(()=>({open:walkingLocation.open,style:walkingLocation.style}));assert.equal(hall.open.length,1);assert.equal(hall.open[0].number,13);assert.equal(hall.style,style);
  // a locked hallway door
  await page.evaluate(slot=>VoidInteractions.handlers.get('apt-hall-door')({item:{slot:(slot+1)%10}}),hall.open[0].slot);assert.equal(await page.evaluate(()=>walkingLocation.part),'hall');
  // walk to the mission's door: it opens; walk in
  await page.evaluate(slot=>{const s=VoidApartments.HALL.slots[slot],O=VoidApartments.ORIGIN;walker.x=O[0]+s.x;walker.z=O[1]+(s.z>0?.3:-.3);walker.yaw=s.z>0?0:Math.PI;},hall.open[0].slot);await page.waitForTimeout(1500);
  await page.evaluate(slot=>{const s=VoidApartments.HALL.slots[slot],O=VoidApartments.ORIGIN;walker.z=O[1]+(s.z>0?.85:-.85);},hall.open[0].slot);
  await arrive(()=>walkingLocation?.part==='flat'&&mode==='walking','apartment');log('in the apartment');await page.waitForTimeout(2500);await shot(page,'4-flat');
  const step=()=>page.evaluate(id=>Object.entries(state.universe.missions[id]?.objectives||{}).filter(([,v])=>v===true).map(([k])=>k),ID);
  await page.waitForFunction(id=>state.universe.missions[id]?.objectives?.in===true,ID,{timeout:20000});log('step "go into the apartment" done');
  // every object
  const objs=await page.evaluate(()=>walkingLocation.interactions.filter(i=>i.action==='apt-use').map(i=>i.object));
  const said={};for(const o of objs){said[o]=await page.evaluate(o=>{let t='';const a=globalThis.announce;globalThis.announce=x=>{t=x;};try{const it=walkingLocation.interactions.find(i=>i.object===o);VoidInteractions.handlers.get('apt-use')({item:it});}finally{globalThis.announce=a;}if(typeof speech!=='undefined'&&speech)resumeWalking();return t;},o);if(o==='lights')await page.evaluate(()=>{});}
  log('used',JSON.stringify(said));for(const o of objs)assert.ok(said[o]&&said[o].length>5,o);
  assert.ok((await step()).includes('safe'),'the safe step');
  // the hack at the entry access point
  await page.evaluate(()=>{const it=walkingLocation.interactions.find(i=>i.action==='apt-ap');walker.x=it.position[0];walker.z=it.position[2]+.6;VoidInteractions.handlers.get('apt-ap')({item:it});});
  await page.waitForTimeout(800);assert.equal(await page.evaluate(()=>!!VoidApartments.hacking),true,'the hack runs');await shot(page,'5-hack');
  await page.waitForFunction(id=>state.universe.missions[id]?.objectives?.hack===true,ID,{timeout:30000});log('hack done');
  // lights: the earlier use switched them off; the step is done now that it is the step in progress -> switch again
  const lights=async()=>page.evaluate(()=>{const it=walkingLocation.interactions.find(i=>i.object==='lights');VoidInteractions.handlers.get('apt-use')({item:it});return VoidBabylon.zone.lightsOn;});
  const l1=await lights(),l2=await lights();assert.notEqual(l1,l2,'the lights toggle');if(l2)await lights();await page.waitForTimeout(800);await shot(page,'6-dark');
  await page.waitForFunction(id=>state.universe.missions[id]?.completed===true,ID,{timeout:20000});log('mission complete');
  // leave: hallway, then the street at the same door
  await page.evaluate(()=>{try{resumeWalking();}catch{}VoidInteractions.handlers.get('apt-exit')({item:{}});});await arrive(()=>walkingLocation?.part==='hall'&&mode==='walking','back to the hallway');
  await page.evaluate(()=>VoidInteractions.handlers.get('apt-hall-exit')({item:{}}));await arrive(()=>walkingLocation?.area==='street'&&mode==='walking','the street');
  const back=await page.evaluate(id=>{const d=VoidApartments.door(id);return {q:walkingLocation.quarter,dist:Math.hypot(walker.x-d.front[0],walker.z-d.front[1])};},DOOR);assert.equal(back.q,'oldtown');assert.ok(back.dist<1.5,JSON.stringify(back));
  await page.waitForTimeout(1500);assert.match(await label(),/LOCKED/,'locked again once the mission is done');await shot(page,'7-back');
  assert.equal(await page.evaluate(()=>localStorage.getItem('void-runner-campaign-v1')),before,'the real save is untouched');
  assert.deepEqual(errors.filter(e=>!/offline|Failed to fetch|NetworkError|ERR_/.test(e)),[]);log('PASS',style);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
