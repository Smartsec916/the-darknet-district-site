/* Reads what stands on the walkable ground of every area Reverie, Lace and the street cat may be placed in (void-runner/npc-areas.js: the Avenue, Old Town, Far South,
   the Outskirts, the Port, the District interior) from the BUILT scenes, and writes it into npc-areas.js (the GEN block) as committed data:
   - street furniture and room furniture: a grid of downward rays (every 0.25 m; a ray from 6 m down, every surface it passes: something between 0.25 m above the ground
     and 2.3 m is in the way) plus horizontal rays at knee, waist and head height along and across each walkable rectangle (thin poles too);
   - the game's own collision solids (neochinatown.js layout(): walls, counters, benches, crates, container homes) where they touch the walkable rectangles;
   - the ground height under each walkable rectangle (pavement slabs stand about 0.18 m up).
   Blocked cells are merged into rectangles. The scenes' furniture follows their fixed random sequences, so rerun this when a street or a room changes.
   Usage: node tests/serve-modern.cjs, then node tests/npc-obstacles-browser.cjs [--dry] [area ...]. Bundled Chromium, software GL. */
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path');
const bundled=fs.existsSync('/opt/pw-browsers/chromium')?'/opt/pw-browsers/chromium':'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',exe=process.env.BROWSER_EXECUTABLE||(fs.existsSync(bundled)?bundled:null);
const FILE=path.join(__dirname,'..','void-runner','npc-areas.js'),AR=require(FILE),N=require('../void-runner/neochinatown.js');
const args=process.argv.slice(2),dry=args.includes('--dry'),only=args.filter(a=>!a.startsWith('--'));
const NAMES=[[/kiosk|ad-|advert|screen|billboard/i,'an advertising screen'],[/taxi|pole/i,'the taxi pole'],[/lamp|light/i,'a lamp post'],[/bench/i,'a bench'],[/bin|trash|dumpster/i,'a bin'],[/container/i,'a container home'],
 [/crate|box/i,'some crates'],[/counter/i,'a counter'],[/vend/i,'a vending machine'],[/pod/i,'the pods'],[/wall|front|door|partition|glass|jamb/i,'a wall'],[/stair/i,'the stairs'],[/table|chair|stool|sofa/i,'furniture']];
const nameOf=(n,interior)=>{for(const [re,t] of NAMES)if(re.test(n))return t;return interior?'furniture':'street furniture';};
(async()=>{const b=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'],...(exe?{executablePath:exe}:{})});
 const gen={version:1,read:new Date().toISOString().slice(0,10),areas:{}};
 try{const page=await (await b.newContext({viewport:{width:1000,height:700},serviceWorkers:'block'})).newPage(),base=process.env.SITE_TEST_URL||'http://127.0.0.1:5187';
  page.on('pageerror',e=>console.error('page error',e.message));
  await page.route('https://**/*',r=>r.abort());await page.route('**/firebase-auth.js',r=>r.fulfill({status:503,body:'x'}));await page.route('**/api/**',r=>r.fulfill({status:404,contentType:'application/json',body:'{}'}));
  const boot=()=>page.waitForFunction(()=>globalThis.VoidStartup?.started,null,{timeout:180000});await page.goto(base+'/void-runner.html');await boot();
  await page.evaluate(()=>{const s=C.startDistrictCampaign(C.fresh());s.story.flags.podWakePending=false;localStorage.setItem('void-runner-campaign-v1',JSON.stringify({...s,savedAt:1700000000000}));});await page.reload();await boot();
  await page.evaluate(()=>Object.assign(VoidPreparation.limits,{scene:900000,assets:900000,optional:600000,area:900000,total:1800000,module:600000,artwork:300000}));
  for(const a of AR.list()){if(only.length&&!only.includes(a.id))continue;const t0=Date.now();
   await page.evaluate(async([scene,quarter])=>{state=C.startDistrictCampaign(C.fresh());state.story.flags.podWakePending=false;state.location='earth';
    if(scene==='interior'){state.story.flags.area='district';state.story.flags.districtBadge=true;await enterWalking(VoidDistrictArea.KEY.interior,{silent:true});}
    else{delete state.story.flags.area;await enterWalking(VoidDistrictArea.KEY.street,{silent:true,quarter});}},[a.scene,a.quarter]);
   await page.waitForFunction(([scene,quarter])=>mode==='walking'&&(scene==='interior'?walkingLocation?.area==='interior':walkingLocation?.quarter===quarter),[a.scene,a.quarter],{timeout:900000});
   await page.waitForFunction(()=>VoidAssets.pending===0,null,{timeout:900000});await page.waitForTimeout(3000);
   const out=await page.evaluate(({walk,interior})=>{const B=BABYLON,sc=VoidBabylon.scene,G=.25,M=.4;
    const skip=/^(street-pair|robot|remote-player|walker|crowd|npc|cat|player|ironeye)|glow|pool|wash|puddle|decal|shadow|sky|smog|rain|spill|beam|haze|fog|lane-mark|stripe|runner|threshold|shaft/i;
    const charOf=m=>{for(let q=m;q;q=q.parent)if(/crowd|npc|street-pair|remote-player|alley-|nightlife|outskirts-life|district-person|resident/i.test(q.name||'')&&q!==m)return true;return false;};
    const box=walk.map(w=>({x0:w[0]-M,x1:w[1]+M,z0:w[2]-M,z1:w[3]+M}));
    const near=new Set(sc.meshes.filter(m=>{if(!m.isEnabled()||!m.isVisible||!m.getTotalVertices||m.getTotalVertices()<=0||skip.test(m.name)||m.skeleton||charOf(m))return false;try{const bb=m.getBoundingInfo().boundingBox,a=bb.minimumWorld,c=bb.maximumWorld;return box.some(r=>a.x<r.x1&&c.x>r.x0&&a.z<r.z1&&c.z>r.z0);}catch{return false;}}));
    const ok=m=>near.has(m),cells=new Map(),ys=[],key=(x,z)=>Math.round(x/G)+','+Math.round(z/G),mark=(x,z,n)=>{if(!box.some(r=>x>=r.x0&&x<=r.x1&&z>=r.z0&&z<=r.z1))return;const k=key(x,z);if(!cells.has(k))cells.set(k,n);};
    walk.forEach((w,i)=>{const r=box[i],gy=[];
     for(let x=r.x0+G/2;x<r.x1;x+=G)for(let z=r.z0+G/2;z<r.z1;z+=G){const hs=sc.multiPickWithRay(new B.Ray(new B.Vector3(x,6,z),new B.Vector3(0,-1,0),6.5),ok)||[];let g=0;for(const h of hs)if(h.pickedPoint.y<=.35&&h.pickedPoint.y>g)g=h.pickedPoint.y;
      if(x>w[0]&&x<w[1]&&z>w[2]&&z<w[3])gy.push(g);const hit=hs.find(h=>h.pickedPoint.y>g+.25&&h.pickedPoint.y<=2.3);if(hit)mark(x,z,hit.pickedMesh.name);}
     gy.sort((p,q)=>p-q);const g0=gy.length?gy[gy.length>>1]:0;ys.push(+g0.toFixed(3));
     for(const dy of [.5,1.1,1.7]){const y=g0+dy;for(let z=r.z0;z<=r.z1;z+=.1)for(const h of sc.multiPickWithRay(new B.Ray(new B.Vector3(r.x0-1,y,z),new B.Vector3(1,0,0),r.x1-r.x0+2),ok)||[])mark(h.pickedPoint.x,h.pickedPoint.z,h.pickedMesh.name);
      for(let x=r.x0;x<=r.x1;x+=.1)for(const h of sc.multiPickWithRay(new B.Ray(new B.Vector3(x,y,r.z0-1),new B.Vector3(0,0,1),r.z1-r.z0+2),ok)||[])mark(h.pickedPoint.x,h.pickedPoint.z,h.pickedMesh.name);}});
    return {cells:[...cells].map(([k,n])=>{const [i,j]=k.split(',').map(Number);return [i,j,n.replace(/[-_.]?\d+$/,'')];}),ys,meshes:near.size};},{walk:a.walk.map(w=>[w.x0,w.x1,w.z0,w.z1]),interior:a.scene==='interior'});
   // the game's own collision solids touching the walkable ground (not the gates: those are blocked whole)
   const lay=a.scene==='interior'?N.layout('interior'):N.layout('street',a.quarter),M=.4,G=.25,cells=new Map(out.cells.map(([i,j,n])=>[i+','+j,nameOf(n,a.scene==='interior')]));
   for(const s of lay.solids){if(/^gate-|^ship$|^city-block/.test(s.id)||s.shipHull)continue;const [x,,z]=s.position,[w,,d]=s.size,r=[x-w/2,x+w/2,z-d/2,z+d/2];
    for(const v of a.walk){const c=[Math.max(r[0],v.x0-M),Math.min(r[1],v.x1+M),Math.max(r[2],v.z0-M),Math.min(r[3],v.z1+M)];if(c[0]>=c[1]||c[2]>=c[3])continue;
     for(let i=Math.round(c[0]/G);i<=Math.round(c[1]/G);i++)for(let j=Math.round(c[2]/G);j<=Math.round(c[3]/G);j++){const k=i+','+j;if(!cells.has(k)||/furniture/.test(cells.get(k)))cells.set(k,nameOf(s.id,a.scene==='interior'));}}}
   // merge: runs down each column (same name), then neighbouring columns with the same run
   const cols=new Map();for(const [k,n] of cells){const [i,j]=k.split(',').map(Number);if(!cols.has(i))cols.set(i,[]);cols.get(i).push([j,n]);}
   const rects=[],open=new Map();
   for(const i of [...cols.keys()].sort((p,q)=>p-q)){const js=cols.get(i).sort((p,q)=>p[0]-q[0]),runs=[];for(const [j,n] of js){const r=runs[runs.length-1];if(r&&j===r[1]+1&&r[2]===n)r[1]=j;else runs.push([j,j,n]);}
    const next=new Map();for(const [j0,j1,n] of runs){const k=j0+':'+j1+':'+n,prev=open.get(k);if(prev&&prev.i1===i-1){prev.i1=i;next.set(k,prev);}else{const r={i0:i,i1:i,j0,j1,n};rects.push(r);next.set(k,r);}}open.clear();for(const [k,v] of next)open.set(k,v);}
   const f=v=>+v.toFixed(3);
   gen.areas[a.id]={y:out.ys,obstacles:rects.map(r=>[f(r.i0*G-G/2),f(r.i1*G+G/2),f(r.j0*G-G/2),f(r.j1*G+G/2),r.n])};
   console.error(a.id,'meshes',out.meshes,'cells',cells.size,'rects',rects.length,'ground',JSON.stringify(out.ys),((Date.now()-t0)/1000).toFixed(0)+' s');}
  if(dry){console.log(JSON.stringify(gen));return;}
  const src=fs.readFileSync(FILE,'utf8'),m=/\/\*GEN-BEGIN\*\/[\s\S]*?\/\*GEN-END\*\//.exec(src);if(!m)throw new Error('no GEN block in npc-areas.js');
  let old=null;try{old=AR.GEN;}catch{}const merged={...gen,areas:{...((old&&old.areas)||{}),...gen.areas}};
  fs.writeFileSync(FILE,src.replace(m[0],'/*GEN-BEGIN*/const GEN='+JSON.stringify(merged)+';/*GEN-END*/'));console.error('written',FILE);
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1);});
