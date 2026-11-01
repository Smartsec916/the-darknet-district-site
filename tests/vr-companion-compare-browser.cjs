/* Before/after pictures of Ava and Eva for texture changes (local tool; needs the locally built models, skips
   without them). Every shot freezes the same clip frame, turns off head tracking, glances and blinking, uses the
   same mood light and camera, and hides the HUD, so two runs differ only by the assets.
   node tests/vr-companion-compare-browser.cjs <label>             -> work/compare/<label>/*.png
   node tests/vr-companion-compare-browser.cjs --diff <a> <b>      -> PSNR and mean difference per shot */
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',root=path.resolve('work/compare');
const models=path.join(__dirname,'../void-runner/assets/models/crowd');
// [name, companion slot, clip, frame, camera distance, height above the floor, side angle, looks to set first]
const shots=[
 ['ava-face',0,'idle',30,.62,1.62,0,{}],['ava-face-side',0,'idle',30,.7,1.62,.9,{}],['ava-full',0,'idle',30,2.7,1.1,0,{}],
 ['ava-hair-long',0,'idle',30,.8,1.6,.5,{'look-ava-hair':'long'}],['ava-glasses',0,'idle',30,.62,1.62,.2,{'look-ava-glasses':'round','look-ava-hair':'bob'}],
 ['ava-makeup',0,'idle',30,.62,1.62,0,{'look-ava-glasses':'none','look-ava-face':'makeup'}],['ava-bikini',0,'idle',30,1.15,1.3,0,{'look-ava-face':'natural','look-ava-outfit':'bikini'}],
 ['ava-walk',0,'walk',20,2.6,1.1,.6,{'look-ava-outfit':'red'}],['ava-sit',0,'sit',40,2.0,.8,.5,{}],
 ['eva-face',1,'idle',30,.62,1.5,0,{}],['eva-face-side',1,'idle',30,.7,1.5,.9,{}],['eva-full',1,'idle',30,2.6,1.0,0,{}],
 ['eva-eyes-green',1,'idle',30,.45,1.52,0,{'look-eva-eyes':'green'}],['eva-hair-ginger',1,'idle',30,.8,1.45,2.6,{'look-eva-eyes':'brown','look-eva-hair':'ginger'}],
 ['eva-makeup-2',1,'idle',30,.62,1.5,0,{'look-eva-hair':'natural','look-eva-face':'2'}],['eva-floral',1,'idle',30,1.1,1.15,0,{'look-eva-face':'5','look-eva-outfit':'blue'}],
 ['eva-walk',1,'walk',20,2.6,1.0,.6,{'look-eva-outfit':'white'}],['eva-sit',1,'sit',40,2.0,.75,.5,{}]];
async function capture(label){
 if(!['vr-companion-ava.vrpak','vr-companion-pg.vrpak'].every(f=>fs.existsSync(path.join(models,f)))){console.log('SKIP: Ava and Eva are not built locally.');return;}
 const out=path.join(root,label);fs.mkdirSync(out,{recursive:true});const errors=[];
 const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'msedge',args:['--enable-gpu','--ignore-gpu-blocklist']});
 try{const page=await browser.newPage({viewport:{width:1280,height:720},serviceWorkers:'block'});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/status of 503/.test(m.text()))errors.push(m.text());});
  await page.route('https://**/*',r=>r.abort());await page.route('**/api/**',r=>r.fulfill({status:503,body:'x'}));await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'x'}));
  await page.goto(base+'/void-runner.html');await page.waitForFunction(()=>VoidStartup.started,null,{timeout:90000});
  await page.evaluate(async()=>{localStorage.removeItem('void-runner-companion-looks-v1');leaveMenu();state=C.fresh();state.quest='open';state.universe.freeTravel=true;state.story.flags.tutorialSkipped=true;state.location='earth';state.universe.currentSystem='sol';
   Object.assign(state.story.flags,{metAdmin:true,metIris:true,districtDoor:true,districtBadge:true});await enterWalking('sacramento');Object.assign(walker,{x:61,z:-65,yaw:0,pitch:0});});
  await page.waitForFunction(()=>VoidAssets.pending===0&&walkingLocation?.id==='neochinatown',null,{timeout:120000});
  await page.evaluate(()=>VoidVR.launch('suite',{companions:['ava','eva']}));await page.waitForFunction(()=>VoidVR.session?.world&&VoidAssets.pending===0,null,{timeout:240000});await page.waitForTimeout(2000);
  // Still life: no brain, tracking, glances or blinks; the same mood; companions placed apart in the open.
  await page.evaluate(()=>{const w=VoidVR.session.world;w.setOption('mood','rose');
   for(const [i,x] of w.companions.entries()){x.c.busy=1e9;x.c.mode='stay';x.c.state='idle';x.c.path=[];x.c.then=null;x.cfg.headTracking=0;x.cfg.attention=1;x.att.glance=null;x.att.glanceIn=1e9;x.node.position.set(i?1.2:-1.2,0,-1.6);x.node.rotation.y=0;
    for(const m of x.node.getChildMeshes()){const mt=m.morphTargetManager;if(mt)for(let j=0;j<mt.numTargets;j++)Object.defineProperty(mt.getTarget(j),'influence',{get:()=>0,set:()=>{},configurable:true});}}
   document.querySelectorAll('[class*=dialogue],#vr-companion-line,#notice,.hud,#hud').forEach(e=>e.style.visibility='hidden');});
  for(const [name,slot,clip,frame,dist,h,side,looks] of shots){
   for(const [k,v] of Object.entries(looks))await page.evaluate(async([k,v])=>{const w=VoidVR.session.world,x=w.companions.find(c=>k.startsWith('look-'+c.who.id+'-'));await x.wear(k.split('-').pop(),v);},[k,v]);
   await page.evaluate(([slot,clip,frame,dist,h,side])=>{const x=VoidVR.session.world.companions[slot],n=x.node;
    for(const y of VoidVR.session.world.companions)for(const g of y.node.metadata.animationGroups)g.stop();
    const g=n.metadata.animationGroups.find(g=>g.name.endsWith('-'+clip));g.start(false,1,frame,frame);g.goToFrame(frame);g.pause();
    // The camera goes where the frozen pose actually faces (the feet's direction), not the node's rotation.
    n.computeWorldMatrix(true);const f=nm=>n.getDescendants(false).find(t=>t.name.endsWith('mixamorig:'+nm)).getAbsolutePosition();
    const fx=f('LeftToeBase').x-f('LeftFoot').x+f('RightToeBase').x-f('RightFoot').x,fz=f('LeftToeBase').z-f('LeftFoot').z+f('RightToeBase').z-f('RightFoot').z;
    const p=n.position,a=Math.atan2(fx,fz)+side;walker.x=p.x+Math.sin(a)*dist;walker.z=p.z+Math.cos(a)*dist;walker.yaw=Math.atan2(p.x-walker.x,p.z-walker.z);
    const eye=1.7;walker.pitch=Math.atan2(eye-h,dist);},[slot,clip,frame,dist,h,side]);
   await page.waitForTimeout(900);await page.screenshot({path:path.join(out,name+'.png'),clip:{x:240,y:40,width:800,height:640}});}
  console.log(label,shots.length,'shots',errors.length?'ERRORS '+errors.join(' | '):'');}finally{await browser.close();}}
async function diff(a,b){const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'msedge'});const page=await browser.newPage();const rows=[];
 try{for(const [name] of shots){const fa=path.join(root,a,name+'.png'),fb=path.join(root,b,name+'.png');if(!fs.existsSync(fa)||!fs.existsSync(fb))continue;
  const r=await page.evaluate(async([x,y])=>{const load=async s=>{const i=await createImageBitmap(await (await fetch(s)).blob());const c=new OffscreenCanvas(i.width,i.height),g=c.getContext('2d');g.drawImage(i,0,0);return g.getImageData(0,0,i.width,i.height).data;};
   const p=await load(x),q=await load(y);let se=0,ae=0,n=0,big=0;for(let i=0;i<p.length;i+=4)for(let k=0;k<3;k++){const d=p[i+k]-q[i+k];se+=d*d;ae+=Math.abs(d);n++;if(Math.abs(d)>24)big++;}
   const mse=se/n;return {psnr:mse?+(10*Math.log10(255*255/mse)).toFixed(1):99,meanDiff:+(ae/n).toFixed(2),pctOver24:+(100*big/n).toFixed(2)};},['data:image/png;base64,'+fs.readFileSync(fa).toString('base64'),'data:image/png;base64,'+fs.readFileSync(fb).toString('base64')]);
  rows.push({shot:name,...r});}}finally{await browser.close();}
 console.table(rows);fs.writeFileSync(path.join(root,'diff-'+a+'-'+b+'.json'),JSON.stringify(rows,null,1));}
const args=process.argv.slice(2);(args[0]==='--diff'?diff(args[1],args[2]):capture(args[0]||'run')).catch(e=>{console.error(e);process.exitCode=1;});
