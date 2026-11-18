/* Reads the street furniture on The Avenue's north pavement from the built city (ad kiosks, taxi poles, lamp posts, bins, benches ...), for npc-paths.js OBSTACLES:
   a grid of downward rays (every 0.25 m x 0.2 m) over the walkable strip; a ray (from 6 m down, every surface it passes) that meets something between 0.25 m above the paving and 2.2 m is blocked.
   Blocked cells are merged into rectangles and printed as JSON. The city's street furniture follows its fixed random sequence, so rerun this when the street changes.
   Usage: node tests/serve-modern.cjs, then node tests/npc-obstacles-browser.cjs [out.json]. Bundled Chromium, software GL. */
const {chromium}=require('playwright'),fs=require('node:fs');
const bundled=fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',exe=process.env.BROWSER_EXECUTABLE||(fs.existsSync(bundled)?bundled:null);
(async()=>{const b=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'],...(exe?{executablePath:exe}:{})});
 try{const page=await (await b.newContext({viewport:{width:1000,height:700},serviceWorkers:'block'})).newPage(),base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187';
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'x'}));await page.route('**/api/**',r=>r.fulfill({status:404,contentType:'application/json',body:'{}'}));
  const boot=()=>page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:180000});await page.goto(base+'/void-runner.html');await boot();
  await page.evaluate(()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;localStorage.setItem('void-runner-campaign-v1',JSON.stringify({...s,savedAt:1700000000000}));});await page.reload();await boot();
  await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:900000,assets:900000,optional:600000,area:900000,total:1800000,module:600000,artwork:300000}));
  await page.evaluate(async()=>{state=C.startDistrictCampaign(C.fresh());state.story.flags.podWakePending=false;state.location='earth';await enterWalking(VoidDistrictArea.KEY.street,{silent:true,quarter:'avenue'});});
  await page.waitForFunction(()=>mode==='walking'&&walkingLocation?.quarter==='avenue',null,{timeout:900000});await page.waitForFunction(()=>VoidAssets.pending===0,null,{timeout:900000});await page.waitForTimeout(3000);
  const out=await page.evaluate(()=>{const B=BABYLON,sc=VoidBabylon.scene,A=VoidNPCPaths.AVENUE_NORTH,skip=/^(sidewalk|storefront|street-pair|robot|remote-player|walker|crowd|npc|cat)|glow|pool|wash|puddle|decal|shadow|sky|rain/i,pave=.18;
   const ok=m=>m.isEnabled()&&m.isVisible&&m.getTotalVertices&&m.getTotalVertices()>0&&!skip.test(m.name)&&!(m.parent&&/crowd|npc|street-pair/i.test(m.parent.name||''))&&!m.skeleton;
   // horizontal rays at knee, waist and head height, along the street and across it: every surface they cross is something in the way (thin poles too)
   const blocked=[],names={},cell=new Set(),mark=(x,z,n)=>{if(x<A.x0-.3||x>A.x1+.3||z<A.z0-.3||z>A.z1+.3)return;const cx=Math.round(x/.25)*.25,cz=Math.round(z/.2)*.2,k=cx.toFixed(2)+','+cz.toFixed(2);if(!cell.has(k)){cell.add(k);blocked.push([+cx.toFixed(2),+cz.toFixed(2)]);}names[n]=(names[n]||0)+1;};
   for(const y of [.5,1.1,1.7]){for(let z=A.z0-.3;z<=A.z1+.3;z+=.1){for(const h of sc.multiPickWithRay(new B.Ray(new B.Vector3(A.x0-1,y,z),new B.Vector3(1,0,0),A.x1-A.x0+2),ok)||[])mark(h.pickedPoint.x,h.pickedPoint.z,h.pickedMesh.name.replace(/[-_]?\d+$/,''));}
    for(let x=A.x0;x<=A.x1;x+=.25){for(const h of sc.multiPickWithRay(new B.Ray(new B.Vector3(x,y,A.z0-1),new B.Vector3(0,0,1),A.z1-A.z0+2),ok)||[])mark(h.pickedPoint.x,h.pickedPoint.z,h.pickedMesh.name.replace(/[-_]?\d+$/,''));}}
   const probe=[];for(const [x,z] of [[96,-6.9],[40,-7.7],[20,-7.7],[96.5,-7.9],[90.5,-5.3]]){const hs=sc.multiPickWithRay(new B.Ray(new B.Vector3(x,6,z),new B.Vector3(0,-1,0),6.2),m=>m.isEnabled())||[];probe.push([x,z,hs.map(h=>h.pickedMesh.name+'@'+h.pickedPoint.y.toFixed(2)).join(',')]);}
   const near=sc.meshes.filter(m=>{try{const c=m.getBoundingInfo().boundingBox.centerWorld;return Math.abs(c.x-96.5)<1.5&&c.z>-9&&c.z<-5;}catch{return false;}}).map(m=>m.name+':'+m.isPickable+':'+(m.hasThinInstances?'thin':'')+':'+m.isVisible).slice(0,30);
   return {blocked,names,probe,near};});
  // merge: per x column runs, then join neighbouring columns with the same run
  const cols=new Map();for(const [x,z] of out.blocked){if(!cols.has(x))cols.set(x,[]);cols.get(x).push(z);}
  const rects=[];for(const [x,zs] of [...cols].sort((a,b)=>a[0]-b[0])){zs.sort((a,b)=>a-b);const runs=[];for(const z of zs){const r=runs[runs.length-1];if(r&&z-r[1]<.21)r[1]=z;else runs.push([z,z]);}
   for(const [z0,z1] of runs){const prev=rects.find(r=>Math.abs(r.x1-(x-.125))<.01&&Math.abs(r.z0-(z0-.1))<.05&&Math.abs(r.z1-(z1+.1))<.05);if(prev)prev.x1=+(x+.125).toFixed(3);else rects.push({x0:+(x-.125).toFixed(3),x1:+(x+.125).toFixed(3),z0:+(z0-.1).toFixed(2),z1:+(z1+.1).toFixed(2)});}}
  const res={rects:rects.map(r=>[r.x0,r.x1,r.z0,r.z1]),names:out.names,cells:out.blocked.length};fs.writeFileSync(process.argv[2]||'/dev/stdout',JSON.stringify(res));console.error(JSON.stringify(out.probe),JSON.stringify(out.near));console.error('blocked cells',res.cells,'rects',res.rects.length,res.names);
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1);});
