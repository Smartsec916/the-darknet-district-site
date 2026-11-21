/* Bakes the doorway pictures (void-runner/door-views.js, void-runner/art/door-views/<key>.webp, 256 x 512): each destination rendered by the game itself in a headless
   browser, from that doorway at eye height, looking in (the hallways from their street door, the hallways from an apartment's door, the apartments from their entry door,
   one street per quarter from an apartment-building door looking out, the first room of each module style from its door, the tunnels' checkpoint and stair landing).
   Usage: node tests/serve-modern.cjs (or any static host of this repo), then
     node tools/door-views/bake.cjs                      (all keys)
     ONLY=hall-normal,apt-luxury node tools/door-views/bake.cjs
   Env: SITE_TEST_URL (default http://127.0.0.1:5187), BROWSER_EXECUTABLE (default the bundled Chromium; software GL), OUT (default void-runner/art/door-views). */
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path');
const base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187',out=process.env.OUT||path.join(__dirname,'..','..','void-runner','art','door-views');fs.mkdirSync(out,{recursive:true});
const bundled=['/opt/pw-browsers/chromium-1243/chrome-linux64/chrome','/opt/pw-browsers/chromium'].find(p=>fs.existsSync(p)),exe=process.env.BROWSER_EXECUTABLE||bundled||null;
const log=(...a)=>console.log('[door-views]',...a);
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'],...(exe?{executablePath:exe}:{})});
 try{
  const page=await (await browser.newContext({viewport:{width:1280,height:720},serviceWorkers:'block'})).newPage();page.on('pageerror',e=>log('page error',e.message));
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'offline'}));
  await page.route('**/api/**',r=>r.fulfill({status:503,contentType:'application/json',body:'{"error":"offline"}'}));
  const boot=()=>page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:300000});
  await page.goto(base+'/void-runner.html');await boot();
  await page.evaluate(()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;s.story.flags.appearanceOffered=true;localStorage.setItem('void-runner-campaign-v1',JSON.stringify({...s,savedAt:1700000000000}));localStorage.setItem('editor-tour-done','1');});
  await page.reload();await boot();await page.waitForTimeout(2000);
  const keys=await page.evaluate(()=>VoidDoorViews.KEYS);const only=(process.env.ONLY||'').split(',').filter(Boolean);
  // where each picture is taken: {key, enter:[location key, options], cam:[x, z, yaw]} (worked out in the page from the game's own data)
  const plan=await page.evaluate(()=>{const A=VoidApartments,M=VoidModules,U=VoidUnderground,BA=VoidBackAlleys,DV=VoidDoorViews,O=A.ORIGIN,out=[];
   for(const st of DV.HOUSING){const G=A.geo(st),H=G.HALL,P=G.APT,s0=H.slots[0];
    out.push({key:'hall-'+st,kind:'hall',style:st,cam:[O[0]+H.street.x+.3,O[1],Math.PI/2]});
    out.push({key:'hallx-'+st,kind:'hall',style:st,cam:[O[0]+s0.x,O[1]+(s0.z>0?s0.z-.3:s0.z+.3),s0.z>0?Math.PI:0]});
    out.push({key:'apt-'+st,kind:'flat',style:st,cam:[O[0]+P.door.x,O[1]+P.z[0]+.3,0]});}
   for(const q of DV.QUARTERS){const d=A.doorsIn(q).find(x=>(x.family||'city')===(q==='outskirts'?'container':'city'))||A.doorsIn(q)[0];if(!d)continue;out.push({key:'street-'+q,kind:'street',quarter:q,cam:[d.x-d.n[0]*.45,d.z-d.n[1]*.45,Math.atan2(-d.n[0],-d.n[1])]});}
   for(const s of DV.MOD_STYLES){const type=DV.MOD_SAMPLE[s],t=M.TYPES[type];if(!t)continue;const sock=t.sockets[0];out.push({key:'mod-'+s,kind:'module',type,sock:sock.id});}
   const e=U.ENTRANCES[0],a=U.arrive(e.id),f=[Math.sin(a.yaw),Math.cos(a.yaw)];out.push({key:'checkpoint',kind:'street',quarter:U.ID,cam:[a.spawn[0]-f[0]*.9,a.spawn[2]-f[1]*.9,a.yaw]});
   const u=BA.UNDERGROUND_ENTRANCES.find(x=>x.id===e.id);out.push({key:'landing',kind:'street',quarter:u.quarter,cam:[u.bottom[0]+u.facing[0]*.35,u.bottom[2]+u.facing[1]*.35,u.yaw]});
   return out;});
  await page.addStyleTag({content:'body *:not(canvas){visibility:hidden!important}canvas{visibility:visible!important}'});
  for(const p of plan){if(only.length&&!only.includes(p.key))continue;if(!keys.includes(p.key)){log('skip (not a key)',p.key);continue;}
   log('taking',p.key);try{
   let ok=false;for(let tries=0;tries<3&&!ok;tries++)ok=await page.evaluate(async p=>{state.location='earth';const A=VoidApartments,M=VoidModules,X=VoidExplorationData.locations;let key,opts={silent:true};
    if(p.kind==='hall'||p.kind==='flat'){const def=A.layout(p.kind,p.style);if(p.kind==='hall'){def.open=[{slot:0,number:101,key:'bake',locked:false,id:'bake',mission:'bake'}];def.street=(A.doorsIn(p.style.startsWith('container')?'outskirts':'avenue')[0]||{}).id;}key=A.keyOf(p.kind,p.style);X[key]=def;opts.spawn=[p.cam[0],1.7,p.cam[1]];opts.yaw=p.cam[2];}
    else if(p.kind==='street'){key=VoidDistrictArea.KEY.street;opts.quarter=p.quarter;opts.spawn=[p.cam[0],1.7,p.cam[1]];opts.yaw=p.cam[2];}
    else{const loc={id:'bake',door:'',entry:'m.'+p.sock,modules:[{id:'m',type:p.type,x:10,z:10}]},inst={key:'bake/m',mission:'bake',id:'bake',door:'',modular:true,loc,hacked:[]},def=M.layout(inst,null,{});
     const d=def.cluster.doors.find(x=>x.kind==='entry');key='apt-module';X[key]=def;opts.spawn=[d.x-d.n[0]*.3,1.7,d.z-d.n[1]*.3];opts.yaw=def.yaw;}
    for(let w=0;w<100&&VoidGraphics.busy;w++)await new Promise(r=>setTimeout(r,200));await enterWalking(key,opts);if(mode!=='walking')return false;walker.x=opts.spawn[0];walker.z=opts.spawn[2];walker.yaw=opts.yaw;walker.pitch=0;return true;},p);
   if(!ok){log('could not enter',p.key);continue;}
   await page.waitForTimeout(6000);await page.evaluate(p=>{walker.yaw=p.cam?p.cam[2]:walker.yaw;walker.pitch=0;},p);await page.waitForTimeout(800);
   const png=await page.screenshot({clip:{x:460,y:0,width:360,height:720},timeout:180000});
   const webp=await page.evaluate(async b64=>{const img=new Image();img.src='data:image/png;base64,'+b64;await img.decode();const c=document.createElement('canvas');c.width=256;c.height=512;const g=c.getContext('2d');g.filter='brightness(1.12)';g.drawImage(img,0,0,256,512);g.filter='none';g.drawImage(c,124,244,8,8,124,252,8,8);   /* paint over the walking crosshair (drawn in the middle of the game's 2D canvas) with the pixels just above it */return c.toDataURL('image/webp',.72).split(',')[1];},png.toString('base64'));
   fs.writeFileSync(path.join(out,p.key+'.webp'),Buffer.from(webp,'base64'));log('wrote',p.key,Math.round(Buffer.from(webp,'base64').length/1024)+' KB');
   }catch(e){log('failed',p.key,String(e.message||e).split('\n')[0]);try{await page.reload();await boot();await page.waitForTimeout(2000);await page.addStyleTag({content:'body *:not(canvas){visibility:hidden!important}canvas{visibility:visible!important}'});}catch(e2){log('reload failed',e2.message);}}}
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
