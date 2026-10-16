/* Repeatable screenshots of the game's main scenes, for comparing graphics before and after a change.
   Usage: node tests/serve-modern.cjs (in another terminal), then
          node tests/graphics-snapshots-browser.cjs <output folder> [quality: low|medium|high]
   Uses the installed Microsoft Edge (Playwright channel 'msedge'). */
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const out=path.resolve(process.argv[2]||'work/graphics'),quality=process.argv[3]||'high';
fs.mkdirSync(out,{recursive:true});
// A campaign far enough along that every location below is reachable.
function setup(location){return `(()=>{const s=C.fresh();s.quest='open';s.location=${JSON.stringify(location)};s.progression.completed=true;s.progression.flags.missileFired=true;s.universe=VoidUniverse.restore({...s.universe,freeTravel:true},s);s.universe.freeTravel=true;s.story.flags.metAdmin=true;state=s;save();})()`;}
const scenes=[
 {name:'menu-meridian',run:async page=>{}},
 {name:'meridian-hangar-kestrel',location:'meridian',walk:true},
 {name:'meridian-bar-rook',location:'meridian',walk:true,stand:[-4,49.5],face:[-4,55]},
 {name:'district-admin',location:'earth',walk:true,stand:[8,43],face:[8,46.2]},
 {name:'vesper-workshop-mara',location:'vesper',walk:true,stand:[3,-5],face:[7,-5]},
 {name:'flight-raider',location:'meridian',flight:true}
];
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true,args:['--use-angle=d3d11','--enable-webgl','--ignore-gpu-blocklist']});
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/void-runner/**',r=>r.fulfill({status:503,body:'offline'}));
 for(const scene of scenes){
  await page.goto('http://127.0.0.1:5187/void-runner.html');
  await page.waitForFunction(()=>window.VoidStartup?.started,null,{timeout:60000});
  await page.evaluate(q=>{VoidGraphics.quality=q;VoidBabylon.setQuality?.(q);},quality);
  await page.waitForTimeout(1500);
  if(scene.location){await page.evaluate(setup(scene.location));}
  if(scene.walk){
   await page.evaluate(async s=>{
    await enterWalking(s.location);
    let stand=s.stand,face=s.face;
    if(s.target){const i=walkingLocation.interactions.find(x=>x.id===s.target||x.action===s.target);const p=i.visualPosition||i.position;face=[p[0],p[2]];stand=[p[0],p[2]-3.2];}
    if(stand){walker.x=stand[0];walker.z=stand[1];walker.yaw=Math.atan2(face[0]-stand[0],face[1]-stand[1]);walker.pitch=0;}
   },scene);
   await page.waitForTimeout(2500);
  }
  if(scene.flight){
   await page.evaluate(async()=>{state.destination='kepler';await launch();});
   await page.waitForFunction(()=>mode==='play',null,{timeout:30000});await page.waitForTimeout(3000);
   await page.evaluate(()=>{const b=flightBasis();enemies.push({relationship:'hostile',x:b.f.x*26+b.r.x*-4,y:b.f.y*26+1.5,z:b.f.z*26+b.r.z*-4,phase:0,fire:99,armor:5,maxArmor:5,size:1,heavy:false,interceptor:false,className:'raider',age:0,velocity:{x:b.r.x*4,y:0,z:b.r.z*4}});});
   await page.waitForTimeout(500);
  }
  await page.waitForTimeout(800);
  const file=path.join(out,scene.name+'.jpg');await page.screenshot({path:file,type:'jpeg',quality:82});
  console.log('saved',file);
 }
 if(errors.length)console.log('page errors:',errors);
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
