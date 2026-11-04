/* Walks the real game through the security vestibule both ways and checks loading, unloading, resource cleanup and saved locations.
   Run: node tests/serve-modern.cjs &  then  node tests/district-transition-browser.cjs [low|high]  (Playwright, software GL is fine; slow in software GL: 20 to 30 minutes per tier; TRIPS (default 3, minimum 3) sets the round trips)
   SHOT_DIR=/some/dir saves screenshots of the checkpoint overlay and each side. */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const BASE=process.env.BASE||'http://127.0.0.1:5187/void-runner.html',tiers=process.argv[2]?[process.argv[2]]:['low','high'],SHOTS=process.env.SHOT_DIR;
const TRIPS=+(process.env.TRIPS||3);
const within=(a,b,pct)=>Math.abs(a-b)<=Math.max(3,Math.max(a,b)*pct);
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--no-sandbox']});
 for(const q of tiers){
  const ctx=await b.newContext({viewport:{width:1100,height:640}}),errs=[],warns=[];
  const open=async()=>{const pg=await ctx.newPage();pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(/NeoChinatown\]|District transition/.test(m.text()))warns.push(m.text());});
   await pg.route('**/api/**',r=>r.fulfill({status:503,body:'{}'}));await pg.route(/firebase|gstatic|googleapis/,r=>r.abort());return pg;};
  await ctx.addInitScript(t=>{try{if(!localStorage.getItem('void-runner-graphics-v1'))localStorage.setItem('void-runner-graphics-v1',JSON.stringify({quality:t}));}catch(e){}},q);
  let pg=await open();
  // Software rendering compiles shaders on the CPU, and this sandbox has no licensed models (every load waits out their 404 retries), so the loader's limits (tuned for real GPUs) are raised here only.
  const ready=async()=>{await pg.waitForFunction(()=>window.VoidStartup?.started,null,{timeout:120000});await pg.evaluate(()=>{Object.assign(VoidPreparation.limits,{scene:900000,assets:300000,optional:300000,total:1500000});});};
  const settle=async(area,ms=5000)=>{const deadline=Date.now()+(+process.env.SETTLE_MS||900000);let why='timed out';
   for(;;){const ok=await pg.evaluate(a=>walkingLocation?.area===a&&mode==='walking'&&!!walker,area).catch(()=>false);if(ok)break;
    if(warns.some(w=>/did not load|did not cycle/.test(w))){why='the transition reported an error';}else if(Date.now()<deadline){await pg.waitForTimeout(2000);continue;}
    const where=await pg.evaluate(()=>({mode,area:walkingLocation&&walkingLocation.area,busy:VoidGraphics.busy,flags:state.story.flags,overlay:!document.getElementById('district-transition').hidden,screen:document.getElementById('screen').textContent.slice(0,160)})).catch(x=>String(x));
    console.log('STUCK waiting for',area,'('+why+')',JSON.stringify(where),'warnings',JSON.stringify(warns.slice(-6)),'errors',JSON.stringify(errs.slice(-4)));throw new Error('stuck waiting for '+area+': '+why);}
   await pg.waitForTimeout(ms);};
  const snap=()=>pg.evaluate(()=>{const S=VoidBabylon.scene||scene,[lx,lz]=VoidNeoChinatown.toWorld(walker.x,walker.z),n=r=>S.meshes.filter(m=>r.test(m.name)).length;
   return {area:walkingLocation.area,local:[lx,lz],meshes:S.meshes.length,lights:S.lights.length,mats:S.materials.length,tex:S.textures.length,nodes:S.transformNodes.length,
    street:n(/city-block|ncz-batch|taxi-zone|landing-pad/),interior:n(/district-floor|hall-|vr-booth|pods-|bar-counter/),flags:{area:state.story.flags.area,badge:state.story.flags.districtBadge,door:state.story.flags.districtDoor},location:state.location,overlay:!document.getElementById('district-transition').hidden};});
  const shot=async n=>{if(SHOTS)await pg.screenshot({path:SHOTS+'/'+n+'-'+q+'.png'});};
  const toVestibule=()=>pg.evaluate(()=>{const [x,z]=VoidNeoChinatown.toWorld(2.0,23.6);walker.x=x;walker.z=z;walker.yaw=Math.PI;});
  const walkOut=()=>pg.evaluate(()=>{const [x,z]=VoidNeoChinatown.toWorld(0,20.6);walker.x=x;walker.z=z;walker.yaw=0;});
  // 1. A new campaign starts in the street, outside the doors.
  await pg.goto(BASE);await ready();await pg.click('[data-action=menu-campaign]');await pg.click('[data-action=menu-new]');await pg.waitForTimeout(1500);
  const c=await pg.$('[data-action=menu-new-confirm]');if(c)await c.click();
  await settle('street');let s=await snap();console.log(q,'start',JSON.stringify(s));
  assert.equal(s.area,'street');assert.equal(s.flags.area,undefined);assert(Math.abs(s.local[0])<.1&&Math.abs(s.local[1]-17)<.1,'outside the doors');assert.equal(s.interior,0,'no District inside the street');
  const street1=s;
  // 2. Scan: the street is released while the interior loads, then only the interior exists.
  await pg.evaluate(()=>VoidInteractions.handlers.get('tdd')());await toVestibule();await pg.waitForTimeout(500);
  await pg.evaluate(()=>VoidInteractions.handlers.get('district-scan')());await pg.waitForTimeout(900);
  s=await snap();console.log(q,'during',JSON.stringify(s));await shot('checkpoint');
  assert.equal(s.overlay,true,'the checkpoint overlay is up');assert.equal(s.street,0,'the street is gone while the overlay is up: never both loaded');assert(s.meshes<20||s.interior>0,'what is loaded is the interior alone (meshes '+s.meshes+')');
  await settle('interior');s=await snap();console.log(q,'inside',JSON.stringify(s));await shot('inside');
  assert.equal(s.area,'interior');assert.equal(s.street,0,'no street left loaded');assert(s.interior>0);assert.equal(s.overlay,false);
  assert.deepEqual(s.flags,{area:'district',badge:true,door:true});assert.equal(s.location,'earth','the saved location id is unchanged');
  assert(Math.abs(s.local[0]-2)<.3&&Math.abs(s.local[1]-23.6)<.3,'the player stays where they stood in the vestibule');
  assert(s.meshes<street1.meshes*.8,'the interior alone is much smaller than the street ('+s.meshes+' vs '+street1.meshes+')');
  const interior1=s;
  // 3. Walking out through the outer door cycles back to the street, outside the door.
  await walkOut();await pg.waitForTimeout(900);s=await snap();assert.equal(s.overlay,true);assert.equal(s.interior,0,'the interior is gone while the overlay is up: never both loaded');assert(s.meshes<20||s.street>0,'what is loaded is the street alone (meshes '+s.meshes+')');await shot('airlock');
  await settle('street');s=await snap();console.log(q,'out',JSON.stringify(s));await shot('outside');
  assert.equal(s.area,'street');assert.equal(s.interior,0,'no District left loaded');assert.equal(s.flags.area,undefined);assert(Math.abs(s.local[0])<.1&&Math.abs(s.local[1]-17.4)<.1,'in the alley outside the door');
  // 4. Repeated trips settle to the same size: nothing accumulates.
  const streets=[],insides=[];
  for(let i=0;i<TRIPS;i++){
   await toVestibule();await pg.waitForTimeout(400);await pg.evaluate(()=>VoidInteractions.handlers.get('district-scan')());await settle('interior',6000);insides.push(await snap());
   await walkOut();await settle('street',6000);streets.push(await snap());}
  console.log(q,'streets',JSON.stringify(streets.map(x=>[x.meshes,x.mats,x.tex,x.lights,x.nodes])),'interiors',JSON.stringify(insides.map(x=>[x.meshes,x.mats,x.tex,x.lights,x.nodes])));
  // The first visit to each environment is lighter (character models still download in the background). The interior has no randomness: from the second trip on its
  // counts must be identical. The street's pedestrians and nightlife are random, so its mesh, node and texture counts may drift either way, but must never grow.
  assert(TRIPS>=3,'TRIPS must be at least 3: one warm-up trip and two to compare');
  const last=TRIPS-1;
  for(const k of ['meshes','mats','tex','lights','nodes'])assert(within(insides[last-1][k],insides[last][k],.03),'interior '+k+' is level between the last two trips: '+insides.map(x=>x[k]));
  for(const k of ['mats','lights'])assert(within(streets[last-1][k],streets[last][k],.03),'street '+k+' is level: '+streets.map(x=>x[k]));
  // Pedestrian numbers swing by about 10 percent from load to load; a leaked environment would add 40 percent or more every trip.
  for(const k of ['meshes','tex','nodes'])assert(streets[last][k]<=Math.min(streets[0][k],streets[1][k])*1.25,'street '+k+' does not grow across trips: '+streets.map(x=>x[k]));
  assert(streets[last].mats<=streets[0].mats*1.05&&insides[last].mats<=insides[0].mats*1.3,'materials do not pile up across trips');
  // 5. Saved locations: inside resumes inside (in the hall, past the inner door); outside resumes outside.
  await toVestibule();await pg.waitForTimeout(400);await pg.evaluate(()=>VoidInteractions.handlers.get('district-scan')());await settle('interior',3000);
  let saved=await pg.evaluate(()=>{save();return JSON.parse(localStorage.getItem('void-runner-campaign-v1'));});
  assert.equal(saved.location,'earth');assert.equal(saved.story.flags.area,'district');
  await pg.goto(BASE);await ready();await pg.click('[data-action=menu-continue]');await settle('interior',3000);s=await snap();console.log(q,'resumed inside',JSON.stringify(s));
  assert.equal(s.area,'interior');assert.equal(s.street,0);assert(s.local[1]>27&&s.local[1]<30,'in the hall past the inner door');assert(Math.abs(s.local[0])<.5);
  await pg.evaluate(()=>{const [x,z]=VoidNeoChinatown.toWorld(0,20.6);walker.x=x;walker.z=z;walker.yaw=0;});
  await settle('street',3000);saved=await pg.evaluate(()=>{save();return JSON.parse(localStorage.getItem('void-runner-campaign-v1'));});assert.equal(saved.story.flags.area,undefined);
  await pg.goto(BASE);await ready();await pg.click('[data-action=menu-continue]');await settle('street',3000);s=await snap();console.log(q,'resumed outside',JSON.stringify(s));
  assert.equal(s.area,'street');assert.equal(s.interior,0);
  // 6. A save made before this change (no area flag) resumes on the street as it always did.
  await pg.evaluate(()=>{const raw=JSON.parse(localStorage.getItem('void-runner-campaign-v1'));delete raw.story.flags.area;localStorage.setItem('void-runner-campaign-v1',JSON.stringify(raw));});
  await pg.goto(BASE);await ready();await pg.click('[data-action=menu-continue]');await settle('street',2000);
  assert.deepEqual(errs,[],'no page errors');assert.deepEqual(warns.filter(w=>!/did not cycle/.test(w)),[],'no seam or transition warnings');
  console.log(q,'ok');await ctx.close();}
 await b.close();})().catch(e=>{console.log('FAIL',e.message.split('\n')[0]);process.exit(1)});
