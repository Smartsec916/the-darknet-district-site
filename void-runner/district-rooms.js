/* The Darknet District's rooms, made to look real (David, 16 Nov 2026; docs/development/DISTRICT_UPGRADE.md): the vending machines, the oxygen bar, the store counter's
   display cases and the VR play area. Looks only: every solid, interaction, person and room size stays where neochinatown.js puts it.
   The top part is plain data and runs in Node (tests/district-rooms.test.cjs); build() is browser only and is handed neochinatown.js's own kit (box, cyl, mat, texture...),
   so everything it makes is merged, owned and released with the rest of the interior.
   Low keeps plain materials and fewer pieces; Medium and above use the District interior kit's physically based metals and concrete. */
(function(root){'use strict';
 const lcg=s=>()=>((s=(s*1103515245+12345)&0x7fffffff)/0x7fffffff);
 // ---- Vending: which pod-vending goods each hallway machine stocks (by the machine's existing label) ----
 const MACHINES=[{label:'DRINKS',accent:'#38e8ff',categories:['DRINKS']},{label:'DISPENSARY',accent:'#ff5bd0',categories:['DISPENSARY'],extra:['GREEN NEON','MIDNIGHT KUSH']},{label:'NEUROHACKERS',accent:'#ffb347',categories:['ELECTRONICS','POWER','MEDICAL','VAPES']}];
 function machineStock(all,i){const M=MACHINES[i],list=(all||[]).filter(d=>M.categories.includes(d.category)||(M.extra||[]).includes(d.name));return list;}
 const WRAP=/^(tub|jar|can|bottle|stubby|spray|vape)$/;   // shapes that are round (their picture wraps a cylinder); the rest are flat packs
 // ---- Store counter: glass display cases on the counter, clear of where Admin (x 8) and Iris (x 12.5) face a customer ----
 const COUNTER={x0:6,x1:14,z0:46.65,z1:47.75,top:1.1},CASES=[[6.12,7.42],[8.62,10.22],[10.3,11.9],[13.1,13.9]],STAFF=[8,12.5];
 /* What lies in the cases: small versions of goods the District's store already shows (assets/textures/store/store-atlas.json: the survival range) and of the gun wall behind
    the shirts (pistols, magazines, ammunition). `like` is the store-atlas name each one stands for. No new product. */
 const ITEMS=[
  {kind:'pistol',like:'gun wall'},{kind:'magazine',like:'gun wall'},{kind:'ammo',like:'gun wall'},{kind:'knife',like:'Morakniv Companion Fixed Blade'},{kind:'multitool',like:'Leatherman Multi-Tool'},
  {kind:'sight',like:'HOLOSUN HS403C'},{kind:'flashlight',like:'Fenix E35R EDC Flashlight'},{kind:'weaponlight',like:'Streamlight TLR-8 HL-X Weapon Light'},{kind:'radio',like:'Two-Way Radios'},
  {kind:'compass',like:'SUUNTO Compass'},{kind:'powerbank',like:'Portable Charger'},{kind:'firestarter',like:'Ferro Rod Fire Starter'},{kind:'lighter',like:'LcFun Electric Lighter'},
  {kind:'filter',like:'Sawyer Mini Water Filter'},{kind:'paracord',like:'Survival Paracord'},{kind:'stakes',like:'Ultralight Titanium Tent Stakes'},{kind:'canister',like:'MIRA Safety NBC-77 SOF Filter'},
  {kind:'tin',like:'Standard Survival Fishing Kit'},{kind:'card',like:'Multi Tool Card'},{kind:'headlamp',like:'LED Headlamp'}];
 const FOOT={knife:[.24,.07],multitool:[.13,.06],flashlight:[.17,.05],compass:[.07,.1],radio:[.07,.05],powerbank:[.09,.105],firestarter:[.045,.045],lighter:[.05,.04],sight:[.07,.08],weaponlight:[.09,.05],filter:[.15,.045],
  paracord:[.15,.08],stakes:[.19,.1],canister:[.1,.1],tin:[.11,.08],card:[.1,.07],headlamp:[.1,.07],pistol:[.2,.105],magazine:[.045,.07],ammo:[.09,.06]};
 /* Where each item lies: every case is cut into bays of one kind of item, each bay filled in rows, front (low) and back (raised) tier. Pure, so a test can check that nothing
    leaves its case or sits in front of a member of staff. dense=false (Low) halves the count. */
 const SCALE=1.25,TIERS=[[.025,.165,.045],[.175,.315,.1],[.33,.47,.2]];   // items are made a quarter larger than life so they read through the glass; tiers: [from, to (m behind the front pane), height above the counter]
 /* How tall each item stands, life size, in whichever form is taller (the modelled radio with its antenna is 0.17; the built one 0.165), and the underside of a case's top pane above the
    counter. An item is only laid on a tier where it clears the pane (David, 16 Nov 2026: the radios on the top shelf stood through the top of the case). */
 const TALL={knife:.026,multitool:.026,flashlight:.036,compass:.022,radio:.17,powerbank:.016,firestarter:.095,lighter:.083,sight:.06,weaponlight:.03,filter:.032,paracord:.061,stakes:.012,canister:.075,tin:.024,card:.01,headlamp:.031,pistol:.045,magazine:.106,ammo:.058},
  CASE_CEILING=.332,CASE_CLEAR=.015;
 const fitsTier=(kind,t)=>TIERS[t][2]+TALL[kind]*SCALE<=CASE_CEILING-CASE_CLEAR;
 function counterItems(dense=true){const out=[],rnd=lcg(977);let k=0;
  CASES.forEach(([a,b],c)=>{const zf=COUNTER.z0+.1,tiers=TIERS.map(([f,t,h])=>[zf+f,zf+t,COUNTER.top+h]);let x=a+.05;
   while(x<b-.1){const item=ITEMS[k++%ITEMS.length],[fw,fd]=FOOT[item.kind].map(v=>v*SCALE),pitch=fw+.012,bay=Math.min(b-.05-x,Math.max(1,Math.round((.17+rnd()*.1)/pitch))*pitch);if(bay<fw+.01)break;
    tiers.forEach(([z0,z1,y],t)=>{if(!fitsTier(item.kind,t))return;const nx=Math.max(1,Math.floor((bay+.001)/pitch)),nz=Math.max(1,Math.floor((z1-z0)/(fd+.01))),sx=bay/nx,sz=(z1-z0)/nz;
     for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){if(!dense&&(i+j+t)%2)continue;out.push({kind:item.kind,like:item.like,case:c,tier:t,x:x+sx*(i+.5),y,z:z0+sz*(j+.5),yaw:(rnd()-.5)*.14,v:Math.floor(rnd()*4)});}});
    out.push({kind:'tag',case:c,tier:0,x:x+bay/2,y:COUNTER.top+.045,z:zf+.008,yaw:0,v:0});x+=bay+.012;}});
  return out;}
 // ---- Oxygen bar ----
 const BAR={counter:{x0:5.5,x1:14.5,z0:37.95,z1:39.05,top:1.11},back:{x0:6.4,x1:14.6,z:41.8},seats:[6.5,9,11.5,14],tanks:[[3.75,41.25],[4.42,41.25],[15.5,41.25],[16.15,41.25]],
  sign:['THE DARKNET DISTRICT','OXYGEN LOUNGE'],neon:['O₂  OXYGEN BAR']};
 /* The anti-WarFlying campaign screens (David, 16 Nov 2026): five lit panels (two in the hallway, two in the arcade where the posters for games not built yet hung, one in the bar) that show his lines one at a time, all of them the same
    line (they share one picture). The header and every line are his, word for word: add a line by adding it to `lines`. No voice and no sound. `seconds` is how long a line stays,
    `fade` how long one gives way to the next. `screens`: `face` is the way a panel looks, (x, z) the middle of it on the wall's surface, y its middle height, `wall` the solid it hangs on.
    Each is whole on solid wall, clear of every doorway (a test checks the margin). `hall` screens follow the hallway's lining (the bare wall is 0.3 m further out). */
 const CAMPAIGN={header:'ANTI-WARFLYING CAMPAIGN',seconds:10,fade:.9,near:16,w:1.2,h:1.8,frame:.08,screens:[
  {id:'hall-south',wall:'hall-east-0',hall:true,face:'-x',x:2.52,z:28.2,y:2.0},{id:'hall-mid',wall:'hall-west-1',hall:true,face:'+x',x:-2.52,z:44.3,y:2.0},
  {id:'arcade-north',wall:'arc-north',face:'+z',x:-4.4,z:57.7,y:2.0,replaces:'laser-moth'},{id:'arcade-south',wall:'arc-south',face:'-z',x:-6.5,z:66.3,y:2.0,replaces:'turbo-kelp'},{id:'bar',wall:'bar-north',face:'+z',x:10,z:28.2,y:2.2}],lines:[
  "WarFlying is not a hobby. It's an invasion.","My ship. My signal. My business.","Just because you can scan it doesn't mean you should.","Space is vast. Get out of my bandwidth.","Respect orbital privacy. Say NO to WarFlying.",
  "Your curiosity ends where my encryption begins.","Keep your scanners to yourself.","WarFlying: Stalking with a spaceship.","Uninvited scans are not a friendly gesture.","My frequency is not your playground.",
  "Fly responsibly. Scan consensually.","Nobody invited you into my network.","Privacy doesn't end at the airlock.","An open frequency is not an open invitation.","Don't be a cosmic creep. Stop WarFlying.",
  "The vacuum of space is silent. So should your scanners be.","Not everything in space belongs to you.","Be a pilot, not a peeping Tom.","Your scanner. Your problem. My privacy.","Scan my ship again and we'll discover how good your shields are.",
  "WarFlying today. Criminal charges tomorrow.","Keep your nose out of my packets.","Real pilots respect personal bandwidth.","Unauthorized scanning is digital trespassing.","The Tessaly System has room for everyone. Except snoops."]};
 // Which line shows at time t (seconds), which one it is giving way to, and how far the change has gone (0 = the old line, 1 = the new one).
 function campaignAt(t,C=CAMPAIGN){const n=C.lines.length,k=Math.floor(Math.max(0,t)/C.seconds),into=Math.max(0,t)-k*C.seconds,mix=k===0?1:Math.min(1,into/C.fade);return {index:k%n,from:(k+n-1)%n,mix};}
 /* Modelled props (David, 16 Nov 2026: the simplest built props replaced where they are seen close up). Each is one file in assets/models/district-props/ (made with Meshy:
    docs/development/DISTRICT_UPGRADE.md), loaded after the room is up on Medium and above and drawn as instances of one mesh. Low, and any quality where a file cannot be loaded,
    shows the built prop it replaces. `fit`: the size in metres the model is brought to along one of its axes once it is posed ('y' its height, 'x' its length). `pose`: the turn that
    stands the model the way the built prop stood (x, y, z in radians). `face`: a further turn about the vertical so its front looks the way the built prop looked.
    `self`: how much of its own colour it gives back (the rooms have one lamp each at most). `glow`: a lit prop (the tank's fluid) that the glow pass may bloom. */
 const PROP_DIR='assets/models/district-props/',PROPS={
  'bar-stool':{fit:['y',.85],self:.3},'o2-station':{fit:['y',.34],face:Math.PI,self:.2},'o2-tank':{fit:['y',1.3],face:Math.PI,self:.2,glow:[.09,.5,.5]},'vr-headset':{fit:['x',.21],self:.4},
  pistol:{fit:['x',.19],pose:[Math.PI/2,0,0],self:.42},radio:{fit:['y',.17],face:Math.PI,self:.3},flashlight:{fit:['x',.13],self:.42}};
 const propFile=name=>PROP_DIR+'district-'+name+'.glb';
 const api={CAMPAIGN,campaignAt,MACHINES,machineStock,COUNTER,CASES,STAFF,ITEMS,FOOT,TALL,CASE_CEILING,CASE_CLEAR,fitsTier,SCALE,TIERS,counterItems,BAR,PROPS,PROP_DIR,propFile,build:null};

 // =====================================================================================================================================================
 function build(K){
  const {B,scene,low,box,cyl,plane,add,mat,glowMat,texture,texMat,neon,glass,kitMat,lightPool,wallGlow,lightShaft}=K,PI=Math.PI,ticks=[];
  // A plain material that still reads with no lamp near it (the rooms have none of their own): it gives back a share of its own colour.
  // Low's sky light shows a plain colour about twice as bright as it is written (Medium and above dim the whole picture instead), so Low takes a darker share of the same colour.
  const pm=(key,hex,rough=.6,metal=.3,self=.22,lowK=.45)=>{const m=mat('dr-'+key,hex,{rough,metal});if(!m.metadata?.dr){m.metadata={dr:1};const c=B.Color3.FromHexString(hex);if(low)m.albedoColor=c.scale(lowK);m.emissiveColor=c.scale(low?self*lowK:self);}return m;};
  // Surfaces: the interior kit's metals on Medium and above, plain colours on Low. Each is this file's own copy of the kit material (same textures): the hallway's modules carry
  // vertex colours and these boxes do not, and meshes that differ like that cannot be merged into one, so sharing the material would undo the hallway's merge.
  // The copies give back a little more of their own colour than the hallway's do: these rooms have one lamp each at most, and dark must not mean black.
  const own=n=>{const m=kitMat(n).clone('ncz-dr-'+n);m.emissiveColor=n==='kit_steel'?new B.Color3(.26,.27,.3):n==='kit_concrete'?new B.Color3(.4,.4,.44):new B.Color3(.34,.35,.4);K.owned.push(m);return m;};
  // Glass: physically based, so the rooms' lamps (which are set for such materials) do not burn it white; it carries its own faint light.
  const pg=(key,hex,alpha=1,self=.3,rough=.12)=>{const m=mat('dr-g-'+key,hex,{rough,metal:0,alpha});if(!m.metadata?.dr){m.metadata={dr:1};const c=B.Color3.FromHexString(hex);if(low)m.albedoColor=c.scale(.45);m.emissiveColor=c.scale(low?self*.6:self);m.directIntensity=.35;m.backFaceCulling=alpha>=1;}return m;};
  const S=low?{plate:pm('plate','#1d2026',.6,.55),gun:pm('gun','#2a3038',.55,.6),steel:pm('steel','#5b616a',.4,.8,.16),concrete:pm('concrete','#34363b',.9,0),paint:pm('paint','#1f2f48',.6,.4)}
   :Object.fromEntries([['plate','kit_metal'],['gun','kit_gunmetal'],['steel','kit_steel'],['concrete','kit_concrete'],['paint','kit_paint']].map(([k,n])=>[k,own(n)]));
  const dark=pm('dark','#111317',.5,.7,.3),black=pm('black','#07080a',.7,.2,.2),rubber=pm('rubber','#0c0d10',.95,0,.25),chrome=pm('chrome','#9aa2ad',.25,.95,.2),brass=pm('brass','#8c6a32',.35,.9,.24),
   leather=pm('leather','#1e0a0d',.5,.05,.2),white=pm('white','#c9ced6',.5,.1,.3);
  const glowC=(key,hex,i=1)=>glowMat('dr-'+key,hex,i);
  /* ---- modelled props: prop(name, {x, y, z, yaw, k}, standIn). The model is brought to its listed size (times k), stood with the middle of its underside at (x, y, z) and turned by yaw.
     Every copy after the first is an instance of the same mesh. standIn() builds the code prop instead: at once on Low, or later if the file cannot be loaded. ---- */
  const propModels=new Map(),propNodes=[],propBoxes=[];let propsGone=false;
  K.owned.push({dispose(){propsGone=true;for(const n of propNodes)try{n.dispose(false,false);}catch{}for(const c of propBoxes)try{c.dispose();}catch{}propNodes.length=propBoxes.length=0;}});
  const propModel=name=>{let p=propModels.get(name);if(!p){const spec=api.PROPS[name];p=root.VoidAssets.loadContainer({src:api.propFile(name)},scene,null,'district-prop:'+name).then(c=>{if(propsGone||scene.isDisposed){c.dispose();throw Error('gone');}propBoxes.push(c);
     for(const m of c.materials){if('usePhysicalLightFalloff' in m){m.usePhysicalLightFalloff=false;m.environmentIntensity=.5;m.directIntensity=1.4;if(m.albedoTexture){m.emissiveTexture=m.albedoTexture;m.emissiveColor=spec.glow?new B.Color3(...spec.glow):new B.Color3(spec.self,spec.self,spec.self*1.06);}}}return {c,spec,fit:null};});propModels.set(name,p);}return p;};
  const prop=(name,at,standIn)=>{const propHome=K.target;if(low||!root.VoidAssets?.loadContainer||!propHome){standIn?.();return;}
   propModel(name).then(M=>{if(propsGone)return;const {c,spec}=M,n=new B.TransformNode('dr-prop-'+name,scene),q=new B.TransformNode('dr-prop-pose',scene),inst=c.instantiateModelsToScene(s=>'dr-prop-'+name+'-'+s,false,{doNotInstantiate:false});
     n.parent=propHome;q.parent=n;if(spec.pose)q.rotation.set(...spec.pose);q.rotation.y+=spec.face||0;for(const r0 of inst.rootNodes)r0.parent=q;propNodes.push(n);for(const g of inst.animationGroups||[])g.dispose();
     const meshes=n.getChildMeshes(false);
     if(!M.fit){n.computeWorldMatrix(true);for(const m of meshes){m.computeWorldMatrix(true);m.refreshBoundingInfo?.();}const inv=n.getWorldMatrix().clone().invert(),lo=new B.Vector3(1e9,1e9,1e9),hi=new B.Vector3(-1e9,-1e9,-1e9);
      for(const m of meshes)for(const v of m.getBoundingInfo().boundingBox.vectorsWorld){const p=B.Vector3.TransformCoordinates(v,inv);lo.minimizeInPlace(p);hi.maximizeInPlace(p);}
      const size=hi.subtract(lo),[axis,want]=spec.fit;M.fit={k:want/Math.max(.001,size[axis]),off:[-(lo.x+hi.x)/2,-lo.y,-(lo.z+hi.z)/2],size:[size.x,size.y,size.z]};}
     q.position.set(...M.fit.off);n.scaling.setAll(M.fit.k*(at.k||1));n.position.set(at.x,at.y||0,at.z);n.rotation.y=at.yaw||0;n.computeWorldMatrix(true);q.computeWorldMatrix(true);
     for(const m of meshes){m.isPickable=false;m.receiveShadows=false;m.computeWorldMatrix(true);m.freezeWorldMatrix?.();if(!spec.glow)for(const l of scene.effectLayers||[])l.addExcludedMesh?.(m);}try{at.done?.({k:M.fit.k*(at.k||1),size:M.fit.size});}catch{}})
    .catch(e=>{if(propsGone||scene.isDisposed)return;if(!propModels.get(name).said){propModels.get(name).said=true;console.info('[District] prop model not available, the built one is shown: '+name);}try{standIn?.();}catch{}});};
  const M=(mesh,m,p,merge=true,r)=>{add(mesh,m,p,merge);if(r)mesh.rotation.set(r[0]||0,r[1]||0,r[2]||0);return mesh;};
  // A box whose texture repeats every `tile` metres (the kit's textures are a metre or two of surface, not one picture per box).
  const tbox=(name,size,p,m,tile=1.6)=>{const mesh=B.MeshBuilder.CreateBox(name,{width:size[0],height:size[1],depth:size[2]},scene);if(!low){const uv=mesh.getVerticesData('uv'),d=[[size[0],size[1]],[size[0],size[1]],[size[2],size[1]],[size[2],size[1]],[size[0],size[2]],[size[0],size[2]]];
    for(let f=0;f<6;f++)for(let k=0;k<4;k++){const i=(f*4+k)*2;uv[i]*=d[f][0]/tile;uv[i+1]*=d[f][1]/tile;}mesh.setVerticesData('uv',uv);}return add(mesh,m,p,true);};
  const cone=(name,r0,r1,h,p,m,t=low?8:12,merge=true)=>add(B.MeshBuilder.CreateCylinder(name,{diameterBottom:r0*2,diameterTop:r1*2,height:h,tessellation:t},scene),m,p,merge);
  const rod=(name,r,len,p,m,axis='x',t=6)=>{const c=cyl(name,r,len,p,m,true,t);if(axis==='x')c.rotation.z=PI/2;else if(axis==='z')c.rotation.x=PI/2;return c;};
  const torus=(name,d,th,p,m,r,t=low?6:8)=>M(B.MeshBuilder.CreateTorus(name,{diameter:d,thickness:th,tessellation:t},scene),m,p,true,r);
  const dome=(name,d,p,m,slice=.5,seg=low?6:8,r)=>M(B.MeshBuilder.CreateSphere(name,{diameter:d,segments:seg,slice},scene),m,p,true,r);
  // A cylinder or a plane showing one cell of a picture sheet (cols x rows).
  const cell=(mesh,c,r,cols,rows)=>{const uv=mesh.getVerticesData('uv');for(let i=0;i<uv.length;i+=2){uv[i]=(c+Math.min(1,Math.max(0,uv[i])))/cols;uv[i+1]=1-(r+1)/rows+Math.min(1,Math.max(0,uv[i+1]))/rows;}mesh.setVerticesData('uv',uv);return mesh;};
  const hexRgb=h=>{const n=parseInt(h.slice(1),16);return [n>>16,n>>8&255,n&255];},rgba=(h,a)=>'rgba('+hexRgb(h).join(',')+','+a+')';
  // A self-lit picture (lit from its own cabinet): the light is drawn into the picture.
  const litMat=(key,t,alpha=false)=>{const m=texMat('dr-'+key,t,{glow:true,alpha});m.backFaceCulling=!alpha;return m;};

  // ================================================== VENDING MACHINES ==================================================
  /* A real machine: steel body, a glazed product bay with depth, lit shelves of goods standing in rows, dividers, price strips, a payment panel with a keypad, a display, a card
     reader and a coin slot, a delivery hatch with a flap, a kick plate, feet, a vented top and a conduit to the wall. It faces +x; (x, z) is where the old one stood. */
  let stockSheet=null,dispM=null,keysM=null;const stockCell=new Map();
  function stockArt(all){if(stockSheet)return stockSheet;const cols=8,rows=4,W=low?512:1024,H=low?512:1024,cw=W/cols,ch=H/rows;
   const t=texture('dr-vending-stock',W,H,(g)=>{g.fillStyle='#000';g.fillRect(0,0,W,H);
    all.slice(0,cols*rows).forEach((d,i)=>{const cx=(i%cols)*cw,cy=Math.floor(i/cols)*ch,wrap=WRAP.test(d.kind),[a0,a1,ink,acc]=d.art,rnd=lcg(i*7919+17);stockCell.set(d.name,[i%cols,Math.floor(i/cols)]);
     g.save();g.beginPath();g.rect(cx,cy,cw,ch);g.clip();g.textAlign='center';g.textBaseline='middle';
     const pack=d.kind==='tub'||d.kind==='jar'||d.kind==='pouch';
     for(let half=0;half<(wrap?2:1);half++){const w=wrap?cw/2:cw,x=cx+half*w;
      if(pack){   // clear plastic with flower heaped inside and a dark label
       g.fillStyle=d.kind==='pouch'?'#2c4a36':'#39424a';g.fillRect(x,cy,w,ch);const top=cy+ch*(d.kind==='pouch'?.16:.14);
       for(let n=0;n<(wrap?70:150);n++){const px=x+rnd()*w,py=top+rnd()*(cy+ch-top),pr=w*(.03+rnd()*.05),s=rnd();g.fillStyle=s>.95?'#c88a34':s>.68?'#a2c670':s>.42?'#78a84c':s>.2?'#5a8a3a':'#3c6a2c';g.beginPath();g.arc(px,py,pr,0,7);g.fill();}
       g.fillStyle='#08080b';g.beginPath();g.ellipse(x+w/2,cy+ch*.62,w*.36,ch*.11,0,0,7);g.fill();g.fillStyle=acc;let size=Math.round(ch*.07);const words=d.name.split(/[ \/]+/).filter(Boolean).slice(0,2);g.font='900 '+size+'px Arial,Helvetica,sans-serif';while(size>5&&Math.max(...words.map(s=>g.measureText(s).width))>w*.7){size--;g.font='900 '+size+'px Arial,Helvetica,sans-serif';}
       words.forEach((s,n)=>g.fillText(s,x+w/2,cy+ch*.62+(n-(words.length-1)/2)*(size+1)));
       if(d.kind==='pouch'){g.fillStyle='rgba(235,245,255,.9)';g.fillRect(x,cy+ch*.06,w,ch*.025);g.fillStyle=acc;g.fillRect(x,cy+ch*.1,w,ch*.012);}}
      else{const fill=g.createLinearGradient(x,cy,x+w,cy+ch);fill.addColorStop(0,a0);fill.addColorStop(1,a1);g.fillStyle=fill;g.fillRect(x,cy,w,ch);g.fillStyle=acc;g.fillRect(x,cy+ch*.78,w,ch*.035);g.fillRect(x,cy+ch*.1,w,ch*.015);
       g.fillStyle=ink;g.save();g.translate(x+w/2,cy+ch*.45);const tall=wrap;if(tall)g.rotate(-PI/2);const span=(tall?ch*.6:w*.86),words=tall?[d.name]:d.name.split(/[ \/]+/).filter(Boolean).slice(0,3);let size=Math.round((tall?w:ch)*.3);g.font='900 '+size+'px Arial,Helvetica,sans-serif';while(size>6&&Math.max(...words.map(s=>g.measureText(s).width))>span){size--;g.font='900 '+size+'px Arial,Helvetica,sans-serif';}
       words.forEach((s,n)=>g.fillText(s,0,(n-(words.length-1)/2)*(size+2)));g.restore();}
      const hi=g.createLinearGradient(x,0,x+w,0);hi.addColorStop(0,'rgba(0,0,0,.22)');hi.addColorStop(.3,'rgba(255,255,255,.22)');hi.addColorStop(.45,'rgba(255,255,255,0)');hi.addColorStop(1,'rgba(0,0,0,.28)');g.fillStyle=hi;g.fillRect(x,cy,w,ch);}
     const sh=g.createLinearGradient(0,cy,0,cy+ch);sh.addColorStop(0,'rgba(255,255,255,.2)');sh.addColorStop(.3,'rgba(0,0,0,0)');sh.addColorStop(1,'rgba(0,0,0,.3)');g.fillStyle=sh;g.fillRect(cx,cy,cw,ch);g.restore();});});
   if(!low)t.level=1.5;   // Medium and above dim the finished picture; the goods stand in their cabinet's light and must still read
   stockSheet={mat:litMat('vending-stock',t),cols,rows};return stockSheet;}
  function machine(i,x,z,all){
   const MC=api.MACHINES[i],stock=api.machineStock(all,i),sheet=stockArt(all),P=(dx,y,dz)=>[x+dx,y,z+dz],tag='vendm-',body=S.paint,trim=low?dark:S.steel,acc=MC.accent;
   const liner=pm('vend-liner','#171b21',.7,.2,.45),ledW=glowC('vend-led','#eaf2ff',1.25),ledA=glowC('vend-led-'+i,acc,1.1),pane=pg('vend-pane','#bfe2ff',.07,.12),flapM=pg('vend-flap','#10151c',.6,.1);
   // body
   box(tag+'kick',[.9,.1,1.5],P(0,.05,0),black);for(const dz of [-.7,.7])for(const dx of [-.4,.4])cyl(tag+'foot',.035,.05,P(dx,.025,dz),chrome,true,8);
   tbox(tag+'back',[.06,2.1,1.6],P(-.47,1.15,0),body);tbox(tag+'side',[1,2.1,.05],P(0,1.15,-.775),body);tbox(tag+'side',[1,2.1,.05],P(0,1.15,.775),body);tbox(tag+'top',[1,.06,1.6],P(0,2.17,0),body);tbox(tag+'floor',[1,.06,1.6],P(0,.13,0),body);
   tbox(tag+'column',[.05,1.44,.4],P(.475,1.31,.575),body);tbox(tag+'column-side',[.9,1.44,.03],P(.02,1.31,.375),dark);
   tbox(tag+'header',[.05,.22,1.6],P(.475,2.03,0),dark);box(tag+'header-lamp',[.02,.02,1.5],P(.5,1.91,0),ledA);
   // lower front with the delivery hatch
   tbox(tag+'apron',[.05,.09,1.6],P(.475,.205,0),body);tbox(tag+'apron',[.05,.12,1.6],P(.475,.53,0),body);tbox(tag+'apron',[.05,.22,.2],P(.475,.36,-.7),body);tbox(tag+'apron',[.05,.22,.56],P(.475,.36,.52),body);
   box(tag+'hatch-back',[.02,.24,.86],P(.16,.36,-.18),black);box(tag+'hatch-tray',[.32,.02,.86],P(.32,.255,-.18),trim);box(tag+'hatch-light',[.02,.012,.8],P(.44,.462,-.18),glowC('vend-hatch','#9fb6d0',.55));
   {const f=box(tag+'hatch-flap',[.012,.215,.82],P(.455,.365,-.18),flapM,true);f.rotation.z=.16;box(tag+'hatch-rim',[.03,.02,.9],P(.49,.48,-.18),trim);box(tag+'hatch-rim',[.03,.02,.9],P(.49,.245,-.18),trim);}
   // the product bay: lit liner, glass, frame
   box(tag+'bay-back',[.02,1.34,1.1],P(-.43,1.25,-.18),liner);box(tag+'bay-side',[.86,1.34,.015],P(0,1.25,-.745),liner);box(tag+'bay-side',[.86,1.34,.015],P(0,1.25,.36),liner);box(tag+'bay-roof',[.86,.02,1.1],P(0,1.915,-.18),liner);
   box(tag+'bay-lamp',[.03,.025,1.02],P(.4,1.895,-.18),ledW);
   box(tag+'pane',[.012,1.32,1.1],P(.47,1.25,-.18),pane,true);for(const dz of [-.745,.385])box(tag+'frame',[.04,1.36,.035],P(.485,1.25,dz),trim);for(const y of [.6,1.92])box(tag+'frame',[.04,.035,1.16],P(.485,y,-.18),trim);
   // shelves, dividers, price strips, goods
   const rowsN=4,colsN=5,deep=2,strip=texture('dr-vend-price-'+i,512,128,(g,W,H)=>{g.fillStyle='#0b0d12';g.fillRect(0,0,W,H);g.textAlign='center';g.textBaseline='middle';g.font='700 16px Consolas,Menlo,monospace';
    for(let r=0;r<rowsN;r++)for(let c=0;c<colsN;c++){const d=stock[(r*colsN+c)%Math.max(1,stock.length)];g.fillStyle='#1a1f28';g.fillRect(c*W/colsN+6,r*H/rowsN+4,W/colsN-12,H/rowsN-8);g.fillStyle='#ffb84a';g.fillText('ABCD'[r]+(c+1)+' '+(d?d.price.toFixed(2):''),(c+.5)*W/colsN,(r+.5)*H/rowsN+1);}}),stripM=litMat('vend-price-'+i,strip);
   for(let r=0;r<rowsN;r++){const sy=.64+(rowsN-1-r)*.315;   // r 0 is the top shelf
    box(tag+'shelf',[.8,.014,1.06],P(-.02,sy,-.18),trim);box(tag+'shelf-lip',[.02,.05,1.06],P(.39,sy+.012,-.18),dark);
    {const p=B.MeshBuilder.CreatePlane(tag+'price',{width:1.04,height:.042},scene);const uv=p.getVerticesData('uv');for(let k=1;k<uv.length;k+=2)uv[k]=1-(r+1-uv[k])/rowsN;p.setVerticesData('uv',uv);M(p,stripM,P(.402,sy+.012,-.18),true,[0,-PI/2,0]);}
    if(r<rowsN-1)box(tag+'shelf-lamp',[.016,.012,1.0],P(.36,sy-.014,-.18),r===2?ledA:ledW);
    for(let c=0;c<=colsN;c++)box(tag+'divider',[.74,.06,.004],P(-.03,sy+.037,-.7+c*.208),trim);
    for(let c=0;c<colsN;c++){const d=stock[(r*colsN+c)%Math.max(1,stock.length)];if(!d)continue;const at=sheet&&stockCell.get(d.name);if(!at)continue;const dz=-.596+c*.208,k=d.kind,y0=sy+.007;
     for(let n=0;n<deep;n++){const dx=.27-n*.27,rt=low||n?8:10;
      if(k==='tub'||k==='jar'){box(tag+'foot',[.13,.03,.15],P(dx,y0+.015,dz),black);if(!n)box(tag+'button',[.006,.014,.03],P(dx+.066,y0+.015,dz+.04),ledA);
       add(cell(B.MeshBuilder.CreateCylinder(tag+'tub',{diameterBottom:.094,diameterTop:k==='jar'?.094:.124,height:.14,tessellation:rt},scene),at[0],at[1],sheet.cols,sheet.rows),sheet.mat,P(dx,y0+.1,dz));cyl(tag+'lid',k==='jar'?.05:.065,.014,P(dx,y0+.176,dz),white,true,rt);}
      else if(WRAP.test(k)){const r0=k==='can'?.033:k==='stubby'?.037:k==='vape'?.014:.03,h=k==='can'?.118:k==='stubby'?.09:k==='vape'?.13:.135;
       add(cell(B.MeshBuilder.CreateCylinder(tag+'can',{diameter:r0*2,height:h,tessellation:rt-2},scene),at[0],at[1],sheet.cols,sheet.rows),sheet.mat,P(dx,y0+h/2,dz));
       if(k==='can')cyl(tag+'can-top',r0*.9,.006,P(dx,y0+h+.002,dz),chrome,true,6);else if(k!=='vape'){cone(tag+'neck',r0,.012,.03,P(dx,y0+h+.015,dz),white,6);cyl(tag+'cap',.014,.03,P(dx,y0+h+.044,dz),ledA,true,5);}}
      else{const w=k==='pouch'?.13:k==='bento'||k==='medkit'||k==='parcel'?.15:.12,h=k==='pouch'?.18:k==='bento'||k==='tin'?.1:.16;box(tag+'pack',[.035,h,w],P(dx-.02,y0+h/2,dz),black);
       M(cell(B.MeshBuilder.CreatePlane(tag+'pack-face',{width:w,height:h},scene),at[0],at[1],sheet.cols,sheet.rows),sheet.mat,P(dx,y0+h/2,dz),true,[0,-PI/2,0]);}}}}
   // the payment panel
   const fx=.502;
   {const t=dispM?null:texture('dr-vend-display',128,48,(g,W,H)=>{g.fillStyle='#04140c';g.fillRect(0,0,W,H);g.fillStyle='#6cff9e';g.font='700 17px Consolas,Menlo,monospace';g.textAlign='center';g.textBaseline='middle';g.fillText('ENTER CODE',W/2,H/2+1);});box(tag+'display-bezel',[.02,.11,.3],P(fx,1.8,.575),black);
    M(B.MeshBuilder.CreatePlane(tag+'display',{width:.26,height:.08},scene),dispM||(dispM=litMat('vend-display',t)),P(fx+.012,1.8,.575),true,[0,-PI/2,0]);}
   {const t=keysM||(keysM=litMat('vend-keys',texture('dr-vend-keys',128,160,(g,W,H)=>{g.fillStyle='#0c0e12';g.fillRect(0,0,W,H);const keys=['1','2','3','4','5','6','7','8','9','A','0','B'];g.textAlign='center';g.textBaseline='middle';g.font='700 20px Arial,sans-serif';
      keys.forEach((s,n)=>{const kx=6+(n%3)*40,ky=6+Math.floor(n/3)*38;const gr=g.createLinearGradient(0,ky,0,ky+32);gr.addColorStop(0,'#4a505a');gr.addColorStop(1,'#23272e');g.fillStyle=gr;g.fillRect(kx,ky,36,32);g.fillStyle='rgba(255,255,255,.18)';g.fillRect(kx,ky,36,2);g.fillStyle='#dfe6ee';g.fillText(s,kx+18,ky+17);});})));
    box(tag+'keypad',[.022,.25,.2],P(fx,1.55,.575),black);M(B.MeshBuilder.CreatePlane(tag+'keys',{width:.18,height:.225},scene),t,P(fx+.013,1.55,.575),true,[0,-PI/2,0]);}
   box(tag+'reader',[.05,.11,.15],P(fx+.01,1.3,.575),black);box(tag+'reader-slot',[.012,.012,.11],P(fx+.037,1.31,.575),dark);box(tag+'reader-lamp',[.008,.014,.03],P(fx+.036,1.265,.62),glowC('vend-ok','#6cff9e',1));
   box(tag+'coin-plate',[.014,.1,.07],P(fx,1.12,.5),trim);box(tag+'coin-slot',[.006,.05,.008],P(fx+.008,1.13,.5),black);box(tag+'note',[.04,.05,.17],P(fx+.005,1.11,.63),black);box(tag+'note-lamp',[.006,.008,.13],P(fx+.027,1.11,.63),glowC('vend-note','#4f9bff',.9));
   box(tag+'return',[.03,.1,.12],P(fx,.92,.575),black);box(tag+'return-cup',[.03,.03,.1],P(fx+.02,.885,.575),trim);cyl(tag+'lock',.014,.02,P(fx+.005,2.0-.32,.71),chrome,true,8).rotation.z=PI/2;
   // the top and the supply
   tbox(tag+'vent',[.6,.12,1.0],P(-.1,2.26,0),dark);for(let n=0;n<5;n++)box(tag+'vent-slat',[.02,.02,.9],P(.21,2.215+n*.022,0),trim);cyl(tag+'conduit',.03,1.75,P(-.34,3.19,.5),trim,true,8);box(tag+'junction',[.16,.2,.2],P(-.38,2.5,.5),dark);
   if(!low){for(let n=0;n<4;n++)box(tag+'louvre',[.5,.012,.012],P(-.1,.3+n*.05,-.803),trim);lightPool(acc,2.2,2,[x+1.25,.04,z],.3);lightPool('#dbe8ff',1.8,1.6,[x+1.1,.041,z-.18],.22);}}

  /* The alcove the machines stand in: lined walls, a dado rail, a caged lamp and conduit overhead (Medium and above), and a kick strip of worn hazard paint on the floor in front. */
  function alcove(){
   if(!low){tbox('vend-liner',[.05,4,5.6],[-6.775,2.05,49.5],S.concrete,3);tbox('vend-liner',[3.6,4,.05],[-5,2.05,46.725],S.gun,2.4);tbox('vend-liner',[3.6,4,.05],[-5,2.05,52.275],S.gun,2.4);
    tbox('vend-dado',[3.6,.1,.04],[-5,1.12,46.77],S.steel,1.2);tbox('vend-dado',[3.6,.1,.04],[-5,1.12,52.23],S.steel,1.2);for(const z of [46.82,52.18])tbox('vend-pilaster',[.26,4,.12],[-3.4,2.05,z],S.plate,1.2);}
   tbox('vend-beam',[3.8,.18,.16],[-5,3.96,49.5],dark,1.5);rod('vend-conduit',.03,5.6,[-6.6,3.7,49.5],low?dark:S.steel,'z',6);
   cyl('vend-lamp-cord',.008,.5,[-4.9,3.75,49.5],black,true,5);cone('vend-lamp-shade',.22,.06,.14,[-4.9,3.44,49.5],dark,low?8:12);cyl('vend-lamp-bulb',.06,.1,[-4.9,3.35,49.5],glowC('vend-bulb','#dfe9ff',1.1),true,8);
   for(const a of [0,1.05,2.09,3.14,4.19,5.24])cyl('vend-lamp-cage',.004,.16,[-4.9+Math.cos(a)*.08,3.33,49.5+Math.sin(a)*.08],dark,true,4);
   if(!low){lightShaft('#cfe0ff',-4.9,49.5,3.3,1.6,true,.5);lightPool('#cfe0ff',3,3.4,[-4.9,.039,49.5],.16);}}

  // ================================================== THE CAMPAIGN SCREENS ==================================================
  /* Each is a lit panel on a wall: a steel housing with depth, a bezel, a hood and a status lamp, on two brackets with a conduit up the wall.
     One drawn picture. It is redrawn only while one line gives way to the next (about twelve times a second for under a second) and only while the player is near; Low shows the first line and never redraws. */
  function campaign(hallLined){
   const C=api.CAMPAIGN,W=low?256:512,H=low?384:768,trim=low?dark:S.steel,w=C.w,h=C.h,anchors=[],lamp=glowC('vend-ok','#6cff9e',1);
   const hang=sc=>{const nx=sc.face==='-x'?-1:sc.face==='+x'?1:0,nz=sc.face==='-z'?-1:sc.face==='+z'?1:0,out=sc.hall&&!hallLined?-.3:0,X=sc.x-nx*out,Z=sc.z-nz*out,y=sc.y;
    // d: out from the wall; u: along it; a box given as [depth, height, width]
    const P=(d,yy,u)=>[X+nx*d+Math.abs(nz)*u,yy,Z+nz*d+Math.abs(nx)*u],sz=(d,hh,ww)=>nx?[d,hh,ww]:[ww,hh,d],ry={'-x':PI/2,'+x':-PI/2,'-z':0,'+z':PI}[sc.face];
    tbox('campaign-housing',sz(.1,h+.16,w+.16),P(.05,y,0),low?dark:S.plate,1.2);for(const u of [-(w/2+.05),w/2+.05])box('campaign-bezel',sz(.03,h+.16,.06),P(.11,y,u),trim);for(const dy of [-(h/2+.05),h/2+.05])box('campaign-bezel',sz(.03,.06,w+.16),P(.11,y+dy,0),trim);
    box('campaign-hood',sz(.16,.03,w+.2),P(.1,y+h/2+.1,0),dark);box('campaign-lamp',sz(.012,.016,.04),P(.127,y-h/2-.05,w/2-.06),lamp);
    cyl('campaign-conduit',.02,4.05-(y+h/2+.08),P(.04,(4.05+y+h/2+.08)/2,.4),trim,true,6);box('campaign-junction',sz(.08,.14,.14),P(.05,y+h/2+.2,.4),dark);
    for(const [dy,u] of [[h/2+.05,w/2+.05],[h/2+.05,-w/2-.05],[-h/2-.05,w/2+.05],[-h/2-.05,-w/2-.05]]){const b=cyl('campaign-bolt',.012,.012,P(.128,y+dy,u),chrome,true,6);if(nx)b.rotation.z=PI/2;else b.rotation.x=PI/2;}
    plane('campaign-screen',w,h,P(.103,y,0),m,ry,true);const a=box('campaign-anchor',[.01,.01,.01],P(.1,y,0),black,false);a.isVisible=false;anchors.push(a);
    if(!low){wallGlow('#ff5a5f',2.4,2.6,P(.135,y,0),ry,.12);lightPool('#ffd9d9',2,1.8,P(1.1,.037,0),.14);}};
   const wrap=(g,text,max)=>{const out=[];let line='';for(const w of text.split(' ')){const t=line?line+' '+w:w;if(line&&g.measureText(t).width>max){out.push(line);line=w;}else line=t;}if(line)out.push(line);return out;};
   const say=(g,text,a)=>{if(a<=.01)return;let size=Math.round(W*.15);g.font='800 '+size+'px "Arial Narrow",Arial,Helvetica,sans-serif';let rows=wrap(g,text,W*.86);while(size>W*.06&&(rows.length*size*1.18>H*.52||rows.some(r=>g.measureText(r).width>W*.9))){size-=2;g.font='800 '+size+'px "Arial Narrow",Arial,Helvetica,sans-serif';rows=wrap(g,text,W*.86);}
    g.globalAlpha=a;g.fillStyle='#eef4f8';g.textAlign='center';g.textBaseline='middle';const y0=H*.5-(rows.length-1)*size*.59;rows.forEach((r,n)=>g.fillText(r,W/2,y0+n*size*1.18+(1-a)*H*.02));g.globalAlpha=1;};
   const draw=(g,st)=>{const bg=g.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#140608');bg.addColorStop(.5,'#0a0b10');bg.addColorStop(1,'#06070a');g.fillStyle=bg;g.fillRect(0,0,W,H);
    g.fillStyle='#d8262e';g.fillRect(0,0,W,H*.012);g.fillRect(0,H*.2,W,H*.006);g.textAlign='center';g.textBaseline='middle';let hs=Math.round(W*.105);g.font='900 '+hs+'px "Arial Narrow",Arial,Helvetica,sans-serif';const head=wrap(g,C.header,W*.86);
    g.fillStyle='#ff4a4f';head.forEach((r,n)=>g.fillText(r,W/2,H*.075+n*hs*1.08+(head.length===1?H*.03:0)));
    // a scanner's sweep, struck through (a picture, no words)
    const cx=W/2,cy=H*.885,r=W*.085;g.strokeStyle='rgba(238,244,248,.75)';g.lineWidth=Math.max(2,W*.008);for(const k of [.45,.75,1.05]){g.beginPath();g.arc(cx,cy+r*.5,r*k,-2.4,-.74);g.stroke();}g.fillStyle='rgba(238,244,248,.8)';g.beginPath();g.arc(cx,cy+r*.5,r*.12,0,7);g.fill();
    g.strokeStyle='#ff4a4f';g.lineWidth=Math.max(3,W*.014);g.beginPath();g.arc(cx,cy,r*1.25,0,7);g.stroke();g.beginPath();g.moveTo(cx-r*.88,cy-r*.88);g.lineTo(cx+r*.88,cy+r*.88);g.stroke();
    say(g,C.lines[st.from],1-st.mix);say(g,C.lines[st.index],st.mix);
    for(let y=0;y<H;y+=4){g.fillStyle='rgba(0,0,0,.12)';g.fillRect(0,y,W,1);}};
   const t=texture('dr-campaign',W,H,g=>draw(g,{index:0,from:0,mix:1})),m=litMat('campaign',t,true);m.opacityTexture=null;   /* one picture and one material for every panel; drawn on both faces so it reads whichever way the wall looks */
   for(const sc of C.screens)hang(sc);
   if(low)return;
   let clock=0,shown='0|1',wait=0;
   ticks.push(dt=>{clock+=dt;wait-=dt;if(wait>0)return;const st=api.campaignAt(clock),moving=st.mix<1,key=st.index+'|'+(moving?st.mix.toFixed(2):1);if(key===shown){wait=.1;return;}
    const cam=scene.activeCamera?.globalPosition;if(!cam||!anchors.some(a=>B.Vector3.DistanceSquared(cam,a.getAbsolutePosition())<C.near*C.near)){wait=.5;return;}
    draw(t.getContext(),st);t.update();shown=key;wait=moving?.08:.1;});}

  // ================================================== OXYGEN BAR ==================================================
  function bar(){
   const C=api.BAR.counter,top=C.top,warm=glowC('bar-warm','#ffb45e',1),pink=glowC('bar-pink','#ff3fb4',1.15),teal=glowC('bar-teal','#3fe0d8',1),T=low?8:12;
   const glassM=pg('bar-glass','#8fb0b8',.2,.1),tintM=[['amber','#c9761c'],['clear','#9fb4b8'],['green','#2f7a4a'],['teal','#2fb6c4'],['red','#a8243e'],['amber2','#8a4a12']].map(([n,h])=>pg('bottle-'+n,h,1,.5,.16));
   // ---- the room: lined walls, ceiling services (Medium and above; Low keeps its plain walls)
   if(!low){tbox('bar-liner',[.05,4,13.6],[16.775,2.05,35],S.concrete,3);tbox('bar-liner',[13.6,4,.05],[10,2.05,28.225],S.gun,2.4);tbox('bar-liner',[13.6,4,.05],[10,2.05,41.775],S.plate,2.4);tbox('bar-liner',[.05,4,2.3],[3.225,2.05,29.35],S.gun,2.4);tbox('bar-liner',[.05,4,6.3],[3.225,2.05,38.65],S.gun,2.4);
    for(const z of [30.2,33,37,40])tbox('bar-pilaster',[.12,4,.26],[16.7,2.05,z],S.plate,1.2);for(const x of [5.2,8.4,11.6,14.8])tbox('bar-pilaster',[.26,4,.12],[x,2.05,28.3],S.plate,1.2);
    tbox('bar-dado',[.04,.1,13.6],[16.73,1.12,35],S.steel,1.2);tbox('bar-dado',[13.6,.1,.04],[10,1.12,28.27],S.steel,1.2);
    rod('bar-conduit',.022,13.4,[16.7,3.2,35],S.steel,'z');rod('bar-conduit',.016,13.4,[16.71,3.3,35],dark,'z');for(const z of [31.5,36,39])box('bar-junction',[.1,.22,.2],[16.7,3.22,z],dark);}
   for(const z of [31,35.2,40.6])tbox('bar-beam',[13.6,.2,.18],[10,3.95,z],dark,1.5);
   {rod('bar-duct',.27,13.2,[10,3.62,33.4],S.steel,'x',low?10:16);for(let x=4.2;x<16.5;x+=1.55)rod('bar-duct-ring',.285,.06,[x,3.62,33.4],dark,'x',low?10:16);for(const x of [5.6,10,14.4]){box('bar-duct-strap',[.04,.34,.04],[x,3.9,33.4],dark);box('bar-duct-vent',[.5,.05,.3],[x+.9,3.34,33.4],dark);}
    rod('bar-pipe',.05,13.2,[10,3.78,36.6],brass,'x',8);rod('bar-pipe',.035,13.2,[10,3.82,36.85],S.steel,'x',8);for(const x of [4.6,8.2,11.8,15.4])box('bar-pipe-clamp',[.05,.2,.4],[x,3.86,36.72],dark);}
   // ---- the counter: riveted plate front, straps, a worn steel top with an overhang, a brass foot rail, a pink line tucked under the lip
   box('bar-kick',[8.9,.1,.98],[10,.05,38.52],black);tbox('bar-counter-body',[8.96,.98,1.0],[10,.59,38.5],S.plate,1.5);tbox('bar-counter-top',[9.24,.06,1.26],[10,top-.03,38.47],S.steel,2.2);
   for(let x=5.62;x<14.5;x+=1.094)box('bar-counter-strap',[.07,.96,.025],[x,.59,37.99],dark);box('bar-counter-rail',[8.96,.05,.03],[10,1.03,37.985],dark);box('bar-counter-rail',[8.96,.05,.03],[10,.16,37.985],dark);
   if(!low)for(let x=5.62;x<14.5;x+=1.094)for(const y of [.25,.6,.95])for(const dx of [-.022,.022])cyl('bar-rivet',.008,.012,[x+dx,y,37.974],chrome,true,6).rotation.x=PI/2;
   box('bar-counter-pink',[9.1,.02,.03],[10,1.035,37.885],pink);rod('bar-foot-rail',.026,8.8,[10,.24,37.8],brass,'x',8);for(let x=5.9;x<14.5;x+=1.64){box('bar-foot-bracket',[.035,.035,.2],[x,.24,37.9],brass);}
   for(const x of [7.2,10.3,12.9])box('bar-mat',[1.1,.012,.26],[x,top+.006,38.86],rubber);box('bar-drip',[8.9,.02,.05],[10,top+.01,39.02],dark);
   // ---- stools: a floor plate, a column, a foot ring, a leather seat in a chrome band
   const stoolBuilt=x=>{cyl('bar-stool-base',.21,.03,[x,.035,37.2],chrome,true,T);cone('bar-stool-skirt',.1,.04,.1,[x,.1,37.2],chrome,T);cyl('bar-stool-post',.034,.6,[x,.44,37.2],chrome,true,8);torus('bar-stool-ring',.34,.022,[x,.3,37.2],chrome);
    for(const a of [0,2.094,4.189])rod('bar-stool-spoke',.01,.15,[x+Math.cos(a)*.09,.3,37.2+Math.sin(a)*.09],chrome,'x',5).rotation.y=-a;
    cyl('bar-stool-band',.215,.05,[x,.755,37.2],chrome,true,T);cyl('bar-stool-seat',.205,.07,[x,.8,37.2],leather,true,T);cone('bar-stool-crown',.205,.15,.03,[x,.85,37.2],leather,T);};
   api.BAR.seats.forEach((x,i)=>prop('bar-stool',{x,y:0,z:37.2,yaw:i*1.3},()=>stoolBuilt(x)));
   // ---- oxygen at every seat: a small regulator post with a gauge, a coiled hose and a clear mask on its hook
   const mask=pm('o2-mask','#9fd8e0',.3,.1,.35),hose=pm('o2-hose','#b9d4dc',.5,.1,.3);mask.alpha=.62;mask.transparencyMode=2;
   const gaugeT=texture('dr-o2-gauge',64,64,(g,W,H)=>{g.fillStyle='#0a0c10';g.fillRect(0,0,W,H);g.fillStyle='#e8eef2';g.beginPath();g.arc(32,32,28,0,7);g.fill();g.strokeStyle='#20252c';g.lineWidth=2;for(let a=-2.2;a<=.6;a+=.35){g.beginPath();g.moveTo(32+Math.cos(a)*20,32+Math.sin(a)*20);g.lineTo(32+Math.cos(a)*26,32+Math.sin(a)*26);g.stroke();}g.strokeStyle='#2bbfa8';g.lineWidth=4;g.beginPath();g.arc(32,32,23,-2.2,-.9);g.stroke();g.strokeStyle='#c8242e';g.lineWidth=3;g.beginPath();g.moveTo(32,32);g.lineTo(46,18);g.stroke();g.fillStyle='#20252c';g.font='700 13px Arial';g.textAlign='center';g.fillText('O₂',32,50);}),gaugeM=litMat('o2-gauge',gaugeT);
   const stationBuilt=(x,y,z,face=0)=>{cyl('o2-station-base',.06,.02,[x,y+.01,z],chrome,true,10);cyl('o2-station-post',.018,.3,[x,y+.17,z],brass,true,8);cyl('o2-station-reg',.034,.06,[x,y+.3,z],chrome,true,10);rod('o2-station-knob',.02,.05,[x+.05,y+.3,z],dark,'x',8);
    const gz=face?1:-1;rod('o2-station-gauge',.04,.02,[x,y+.22,z+gz*.03],chrome,'z',10);M(B.MeshBuilder.CreatePlane('o2-station-dial',{width:.066,height:.066},scene),gaugeM,[x,y+.22,z+gz*.042],true,[0,face?PI:0,0]);
    rod('o2-station-arm',.007,.13,[x-.065,y+.33,z],chrome,'x',5);cyl('o2-station-hook',.007,.05,[x-.13,y+.305,z],chrome,true,5);
    dome('o2-mask-cup',.1,[x-.13,y+.2,z],mask,.6,low?5:7,[PI/2*gz,0,0]);torus('o2-mask-rim',.082,.008,[x-.13,y+.2,z+gz*.012],hose,[PI/2,0,0]);cyl('o2-mask-port',.012,.03,[x-.13,y+.165,z],hose,true,6);
    if(!low){for(let k=0;k<3;k++)torus('o2-hose-coil',.1+k*.012,.008,[x+.13,y+.008+k*.009,z+.02],hose,null,10);rod('o2-hose-run',.005,.17,[x+.05,y+.02,z+.01],hose,'x',5);}};
   const station=(x,y,z,face=0)=>prop('o2-station',{x,y,z,yaw:face?PI:0},()=>stationBuilt(x,y,z,face));
   for(const x of api.BAR.seats)station(x+.34,top,38.3);
   // ---- on the counter: tumblers, coasters, lanterns with a small flame, a shaker and jiggers near the bartender, a stack of menus-size cards left blank
   {const rnd=lcg(41),amberM=tintM[0];for(const [x,z] of [[6.2,38.2],[7.9,38.35],[8.7,38.15],[10.9,38.25],[12.4,38.3],[13.6,38.15],[9.5,38.8],[11.9,38.85]]){cyl('bar-coaster',.05,.006,[x,top+.003,z],black,true,10);cyl('bar-tumbler',.036,.085,[x,top+.049,z],glassM,true,low?8:10);if(rnd()>.35)cyl('bar-drink',.031,.03,[x,top+.022,z],amberM,true,8);}
    for(const x of [7.3,12.9]){cyl('bar-lantern-base',.05,.02,[x,top+.01,38.62],brass,true,8);cyl('bar-lantern-glass',.042,.1,[x,top+.07,38.62],glowC('bar-flame','#ffb05a',.85),true,8);cyl('bar-lantern-cap',.05,.02,[x,top+.13,38.62],brass,true,8);for(const a of [0,1.57,3.14,4.71])cyl('bar-lantern-bar',.004,.1,[x+Math.cos(a)*.046,top+.07,38.62+Math.sin(a)*.046],brass,true,4);if(!low)lightPool('#ffa040',.9,.7,[x,top+.004,38.6],.5);}
    cone('bar-shaker',.035,.042,.15,[10.65,top+.075,38.82],chrome,10);cone('bar-shaker-cap',.042,.02,.05,[10.65,top+.175,38.82],chrome,10);for(const x of [10.82,10.93]){cone('bar-jigger',.012,.026,.045,[x,top+.07,38.86],chrome,8);cone('bar-jigger',.022,.012,.04,[x,top+.02,38.86],chrome,8);}
    box('bar-cards',[.1,.03,.15],[8.9,top+.015,38.75],black);}
   // ---- the back bar: a steel-topped cabinet, three underlit shelves on uprights, bottles, glassware, taps
   const bx0=api.BAR.back.x0,bx1=api.BAR.back.x1,bw=bx1-bx0,bxc=(bx0+bx1)/2;
   tbox('bar-back-cabinet',[bw,.9,.52],[bxc,.45,41.5],S.plate,1.5);tbox('bar-back-top',[bw+.06,.04,.58],[bxc,.92,41.48],S.steel,2);box('bar-back-kick',[bw,.08,.03],[bxc,.04,41.22],black);
   for(let x=bx0+.82;x<bx1-.2;x+=.82){box('bar-back-seam',[.012,.78,.012],[x,.47,41.236],black);box('bar-back-handle',[.02,.16,.02],[x-.07,.62,41.225],chrome);}
   const shelfY=[1.45,1.96,2.47];for(const y of shelfY){tbox('bar-shelf',[bw,.035,.32],[bxc,y,41.6],S.steel,2);box('bar-shelf-light',[bw-.1,.012,.022],[bxc,y-.024,41.46],warm);}
   for(let x=bx0;x<=bx1+.01;x+=bw/4)tbox('bar-upright',[.05,1.95,.34],[x,1.9,41.6],dark,1.5);
   {const rnd=lcg(2026),labelT=texture('dr-bottle-labels',256,64,(g,W,H)=>{const cs=['#e8e2d0','#1b1b20','#b5262e','#d9c27a','#2a4f7a','#e8e2d0','#101014','#d8d8dc'];for(let n=0;n<8;n++){const x=n*32;g.fillStyle=cs[n];g.fillRect(x,0,32,H);g.fillStyle=n%2?'rgba(255,255,255,.75)':'rgba(10,10,14,.8)';g.fillRect(x+5,10,22,3);g.fillRect(x+5,H-13,22,3);g.beginPath();if(n%3===0)g.arc(x+16,32,8,0,7);else if(n%3===1){g.moveTo(x+16,20);g.lineTo(x+25,32);g.lineTo(x+16,44);g.lineTo(x+7,32);}else g.rect(x+8,24,16,16);g.fill();}}),labelM=pm('bottle-label','#ffffff',.8,0,0);if(!labelM.albedoTexture){labelM.albedoTexture=labelT;labelM.emissiveTexture=labelT;labelM.emissiveColor=new B.Color3(.5,.45,.4);}
    const bottle=(x,y,z,n)=>{const m=tintM[n%tintM.length],s=n%4,t=6;
     if(s===0){cyl('bar-bottle',.037,.19,[x,y+.095,z],m,true,t);cone('bar-bottle',.037,.013,.05,[x,y+.215,z],m,t);cyl('bar-bottle',.013,.06,[x,y+.27,z],m,true,5);}
     else if(s===1){box('bar-bottle',[.085,.15,.085],[x,y+.075,z],m).rotation.y=(rnd()-.5)*.5;cyl('bar-bottle',.016,.06,[x,y+.18,z],m,true,5);}
     else if(s===2){cyl('bar-bottle',.05,.11,[x,y+.055,z],m,true,t);cone('bar-bottle',.05,.014,.04,[x,y+.13,z],m,t);cyl('bar-bottle',.014,.11,[x,y+.205,z],m,true,5);}
     else{cyl('bar-bottle',.03,.25,[x,y+.125,z],m,true,t);cone('bar-bottle',.03,.012,.03,[x,y+.265,z],m,t);cyl('bar-bottle',.012,.04,[x,y+.3,z],m,true,5);}
     const topY=y+[.3,.21,.26,.32][s];cyl('bar-bottle-cap',.016,.022,[x,topY+.008,z],n%3?black:brass,true,5);
     if(!low){const lw=[.05,.07,.06,.042][s],lh=[.08,.07,.05,.1][s],p=B.MeshBuilder.CreatePlane('bar-bottle-label',{width:lw,height:lh},scene),uv=p.getVerticesData('uv'),c=Math.floor(rnd()*8);for(let k=0;k<uv.length;k+=2)uv[k]=(c+uv[k])/8;p.setVerticesData('uv',uv);M(p,labelM,[x,y+[.1,.08,.06,.13][s],z-[.039,.045,.052,.032][s]],true);}};
    let n=0;for(const y of shelfY)for(let x=bx0+.14;x<bx1-.1;x+=low?.3:.2+rnd()*.05){if(Math.abs(((x-bx0)%(bw/4))-(bw/4))<.07||((x-bx0)%(bw/4))<.07)continue;bottle(x,y+.018,41.6+(rnd()-.5)*.06,n+=1+Math.floor(rnd()*3));if(!low&&rnd()>.62)bottle(x+.02,y+.018,41.72,n+2);}
    // glassware on the cabinet top, stem glasses hanging under the first shelf, a tap tower
    for(let x=bx0+.3;x<bx0+3.2;x+=.11)for(const z of low?[41.42]:[41.38,41.5])cyl('bar-glass',.034,.09,[x,.985,z],glassM,true,6);
    for(let x=bx1-3.4;x<bx1-1.4;x+=.2)for(const z of [41.42,41.56]){cone('bar-shaker-row',.034,.04,.14,[x,1.01,z],chrome,8);}
    if(!low)for(let x=bx0+2.4;x<bx0+4;x+=.13){cone('bar-stem-bowl',.006,.04,.07,[x,1.345,41.5],glassM,8);cyl('bar-stem',.004,.06,[x,1.4,41.5],glassM,true,4);cyl('bar-stem-foot',.03,.004,[x,1.43,41.5],glassM,true,8);}
    {const tx=bx1-.75;cyl('bar-tap-column',.05,.36,[tx,1.12,41.4],brass,true,10);rod('bar-tap-bar',.035,.62,[tx,1.3,41.4],brass,'x',10);for(const dx of [-.22,0,.22]){cyl('bar-tap-spout',.012,.1,[tx+dx,1.22,41.33],chrome,true,6);const h=cone('bar-tap-handle',.014,.024,.17,[tx+dx,1.42,41.36],black,8);h.rotation.x=-.25;}box('bar-tap-tray',[.7,.02,.22],[tx,.95,41.33],chrome);}}
   // ---- oxygen: tall glass tanks of lit, bubbling fluid on steel bases, each capped with a valve wheel and piped to a manifold along the wall; spare cylinders; masks on a rail
   const bubbleT=texture('dr-o2-bubbles',64,256,(g,W,H)=>{const gr=g.createLinearGradient(0,0,W,0);gr.addColorStop(0,'#085660');gr.addColorStop(.35,'#1fb4bc');gr.addColorStop(.6,'#27c2c8');gr.addColorStop(1,'#07444e');g.fillStyle=gr;g.fillRect(0,0,W,H);const rnd=lcg(5);for(let n=0;n<90;n++){const x=rnd()*W,y=rnd()*H,r=1+rnd()*3.2;g.fillStyle='rgba(225,255,255,'+(.35+rnd()*.5)+')';g.beginPath();g.arc(x,y,r,0,7);g.fill();if(y<r){g.beginPath();g.arc(x,y+H,r,0,7);g.fill();}}}),bubbleM=litMat('o2-bubbles',bubbleT);
   bubbleT.wrapV=B.Texture.WRAP_ADDRESSMODE;bubbleT.uScale=2;ticks.push(dt=>{bubbleT.vOffset=(bubbleT.vOffset+dt*.11)%1;});
   const tubeM=pg('o2-tube','#9ff0f2',.12,.2),o2T=texture('dr-o2-mark',128,96,(g,W,H)=>{g.clearRect(0,0,W,H);g.fillStyle='rgba(240,255,255,.95)';g.font='700 64px Arial,Helvetica,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillText('O',W/2-14,H/2);g.font='700 34px Arial,Helvetica,sans-serif';g.fillText('2',W/2+30,H/2+22);});o2T.hasAlpha=true;const o2M=litMat('o2-mark',o2T,true);
   const manifoldY=3.66;rod('bar-o2-manifold',.04,13.2,[10,manifoldY,41.62],S.steel,'x',8);for(let x=4;x<16.5;x+=2.05){box('bar-o2-bracket',[.05,.14,.16],[x,manifoldY,41.69],dark);}for(const x of [5.4,14.9]){rod('bar-o2-gauge',.07,.03,[x,manifoldY+.02,41.56],chrome,'z',12);M(B.MeshBuilder.CreatePlane('bar-o2-dial',{width:.12,height:.12},scene),gaugeM,[x,manifoldY+.02,41.542],true);}
   const tankBuilt=(x,z)=>{cyl('bar-o2-base',.24,.3,[x,.15,z],S.steel,true,T);cyl('bar-o2-base-ring',.255,.04,[x,.3,z],chrome,true,T);box('bar-o2-control',[.2,.14,.03],[x,.16,z-.238],black);box('bar-o2-lamp',[.03,.02,.006],[x-.05,.19,z-.255],glowC('vend-ok','#6cff9e',1));box('bar-o2-lamp',[.08,.012,.006],[x+.03,.15,z-.255],teal);
    cyl('bar-o2-fluid',.17,1.36,[x,1,z],bubbleM,true,T);cyl('bar-o2-glass',.2,1.36,[x,1,z],tubeM,true,T);for(const y of [.6,1.4])torus('bar-o2-hoop',.41,.02,[x,y,z],chrome);for(const a of [.6,2.5,3.8,5.6])cyl('bar-o2-stay',.01,1.36,[x+Math.cos(a)*.21,1,z+Math.sin(a)*.21],chrome,true,5);
    M(B.MeshBuilder.CreatePlane('bar-o2-mark',{width:.24,height:.18},scene),o2M,[x,1.12,z-.206],true);
    cyl('bar-o2-cap',.24,.16,[x,1.76,z],S.steel,true,T);dome('bar-o2-dome',.42,[x,1.84,z],S.steel,.5);cyl('bar-o2-stem',.035,.2,[x,2.1,z],brass,true,8);torus('bar-o2-wheel',.2,.02,[x,2.2,z],pm('valve-red','#8c1c1c',.5,.4,.3));rod('bar-o2-spoke',.008,.19,[x,2.2,z],chrome,'x',5);rod('bar-o2-spoke',.008,.19,[x,2.2,z],chrome,'z',5);};
   /* Medium and above: the modelled tank (a glass cylinder of lit fluid in a steel frame with a valve wheel) stands on a steel plinth, as the tanks in David's picture stand on the back counter;
      a sleeve of rising bubbles moves over its glass. The pipe up to the manifold is the same. */
   const sleeveT=low?null:texture('dr-o2-sleeve',64,256,(g,W,H)=>{g.clearRect(0,0,W,H);const rnd=lcg(11);for(let n=0;n<46;n++){const x=rnd()*W,y=rnd()*H,r=.8+rnd()*2.2;g.fillStyle='rgba(225,255,255,'+(.3+rnd()*.5)+')';g.beginPath();g.arc(x,y,r,0,7);g.fill();if(y<r){g.beginPath();g.arc(x,y+H,r,0,7);g.fill();}}}),sleeveM=low?null:litMat('o2-sleeve',sleeveT,true);
   if(sleeveT){sleeveT.hasAlpha=true;sleeveT.wrapV=B.Texture.WRAP_ADDRESSMODE;sleeveT.uScale=2;ticks.push(dt=>{sleeveT.vOffset=(sleeveT.vOffset+dt*.09)%1;});}
   /* The plinths are one mesh of this file's own, so that they can be taken away again if the model never arrives (the built tank then stands on the floor as it did). */
   const plinthY=.8,plinthParts=[],pb=(size,p,m)=>{const e=B.MeshBuilder.CreateBox('bar-o2-plinth',{width:size[0],height:size[1],depth:size[2]},scene);e.material=m;e.position.set(...p);plinthParts.push(e);};let plinth=null,sleeve0=null;
   const dressed=(x,z)=>info=>{const w=Math.min(info.size[0],info.size[2])*info.k,h=info.size[1]*info.k,r=w*.405,sh=h*.52,sy=plinthY+h*.43;
     const sl=sleeve0?sleeve0.createInstance('bar-o2-sleeve'):B.MeshBuilder.CreateCylinder('bar-o2-sleeve',{diameter:r*2,height:sh,tessellation:16,cap:B.Mesh.NO_CAP},scene);if(!sleeve0){sleeve0=sl;sl.material=sleeveM;}sl.parent=K.target;sl.position.set(x,sy,z);sl.isPickable=false;propNodes.push(sl);};
   for(const [x,z] of api.BAR.tanks){
    if(low)tankBuilt(x,z);else{prop('o2-tank',{x,y:plinthY,z,done:dressed(x,z)},()=>{if(plinth){plinth.dispose();plinth=null;}tankBuilt(x,z);});
     pb([.62,plinthY-.09,.62],[x,(plinthY-.09)/2+.06,z],S.plate);pb([.56,.06,.56],[x,.03,z],black);pb([.65,.03,.65],[x,plinthY-.015,z],dark);pb([.3,.16,.012],[x,.34,z-.315],black);pb([.05,.02,.008],[x-.18,.62,z-.315],glowC('vend-ok','#6cff9e',1));pb([.12,.012,.008],[x+.12,.62,z-.315],teal);}
    cyl('bar-o2-riser',.022,manifoldY-2.0,[x+.12,(manifoldY+2.0)/2,z+.3],brass,true,6);rod('bar-o2-elbow',.022,.34,[x+.12,2.0,z+.14],brass,'z',6);
    if(!low){lightPool('#3fe0d8',1.9,1.9,[x,.046,z-.45],.5);}}
   if(plinthParts.length){plinth=B.Mesh.MergeMeshes(plinthParts,true,true,undefined,false,true);if(plinth){plinth.name='bar-o2-plinths';plinth.parent=K.target;plinth.isPickable=false;propNodes.push(plinth);if(plinth.material?.subMaterials)K.owned.push(plinth.material);}}
   if(!low){wallGlow('#3fe0d8',2.8,2.8,[4.1,1.2,41.74],PI,.3);wallGlow('#3fe0d8',2.8,2.8,[15.85,1.2,41.74],PI,.3);}
   {const tankM=pm('o2-cylinder','#27504a',.45,.6,.26),band=white,can=(x,z,h=.5,r=.06)=>{cyl('bar-o2-can',r,h,[x,h/2,z],tankM,true,low?8:10);dome('bar-o2-can-top',r*2,[x,h,z],band,.5,low?5:6);cyl('bar-o2-can-neck',.016,.05,[x,h+r+.02,z],brass,true,6);rod('bar-o2-can-valve',.012,.07,[x,h+r+.04,z],chrome,'x',6);cyl('bar-o2-can-band',r+.002,.04,[x,h*.72,z],band,true,low?8:10);};
    // a floor rack of spare cylinders at each end of the back bar, and a row of small ones on the cabinet top under the mask rail
    for(const [x0,z0] of [[5.35,41.5],[14.95,41.5]]){box('bar-o2-rack',[.6,.04,.44],[x0+.21,.02,z0-.08],dark);for(const y of [.22,.42]){box('bar-o2-rack-rail',[.6,.02,.02],[x0+.21,y,z0-.29],chrome);}for(const dx of [-.07,.5])box('bar-o2-rack-post',[.02,.46,.02],[x0+dx,.23,z0-.29],chrome);for(let i=0;i<4;i++)for(let j=0;j<2;j++)can(x0+i*.14,z0-.2+j*.15,.5+((i+j)%2)*.06);}}
   // the mask rail (on the wall between the left tanks and the shelves): a pipe on brackets with masks hanging by their hoses
   {const rx=5.6,ry=2.05,rz=41.66;rod('bar-mask-rail',.016,1.2,[rx,ry,rz],brass,'x',8);for(const dx of [-.56,.56])box('bar-mask-bracket',[.03,.03,.14],[rx+dx,ry,rz+.06],brass);
    for(let k=0;k<(low?3:4);k++){const x=rx-.42+k*.28;cyl('bar-mask-strap',.004,.16,[x,ry-.09,rz],hose,true,4);dome('o2-mask-cup',.11,[x,ry-.22,rz-.01],mask,.6,low?5:7,[-PI/2,0,0]);torus('o2-mask-rim',.09,.008,[x,ry-.22,rz-.022],hose,[PI/2,0,0]);if(!low){for(let c=0;c<3;c++)torus('o2-hose-coil',.1,.008,[x,ry-.36-c*.05,rz],hose,[PI/2,0,0]);cyl('o2-hose-drop',.005,.3,[x+.05,ry-.6,rz],hose,true,4);}}}
   // ---- signs and menu screens (the wording is the game's own): the lounge's name plate, the neon over the bottles, the two menu screens hung from the ceiling, the wall menu's frame
   {const t=texture('dr-bar-plate',512,320,(g,W,H)=>{g.fillStyle='#0b0a10';g.fillRect(0,0,W,H);g.strokeStyle='#2a2630';g.lineWidth=6;g.strokeRect(5,5,W-10,H-10);g.textAlign='left';g.textBaseline='alphabetic';g.shadowColor='#ff3fa8';g.shadowBlur=16;g.fillStyle='#ff5fb8';g.font='900 64px "Arial Narrow",Arial,sans-serif';['THE','DARKNET','DISTRICT'].forEach((s,n)=>g.fillText(s,34,78+n*62));
     g.shadowColor='#3fe0d8';g.fillStyle='#7ff0e6';g.fillRect(34,222,W-68,3);g.font='700 44px Arial,sans-serif';g.fillText('OXYGEN LOUNGE',34,282);g.shadowBlur=0;});
    box('bar-plate-frame',[1.24,.8,.06],[5.5,2.86,41.73],dark);plane('bar-plate',1.16,.725,[5.5,2.86,41.695],litMat('bar-plate',t),0);for(const dx of [-.5,.5])cyl('bar-plate-rod',.012,.42,[5.5+dx,3.45,41.72],chrome,true,5);}
   box('bar-neon-back',[3.6,.74,.05],[10,3.36,41.72],dark);neon('bar-oxygen-sign',api.BAR.neon,['#58e8ff'],3.4,.6,[10,3.36,41.685],0,'rgba(6,8,14,.9)',true);
   const screen=(name,x,title,rows,c)=>{const y=3.3,z=41.28;const f=box('bar-screen-case',[1.74,1.02,.1],[x,y,z+.06],dark);f.rotation.x=-.16;for(const dx of [-.6,.6])cyl('bar-screen-rod',.014,.5,[x+dx,3.86,z+.1],chrome,true,6);
    const p=plane(name,1.6,.9,[x,y,z],texMat(name,texture(name,384,216,(g,W,H)=>{g.fillStyle='#05080d';g.fillRect(0,0,W,H);g.fillStyle=c;g.font='bold 24px Consolas,monospace';g.fillText(title,16,34);g.fillRect(16,44,W-32,2);g.font='16px Consolas,monospace';rows.forEach(([n,v],i)=>{g.fillStyle='#d8e6f0';g.fillText(n,16,76+i*27);g.fillStyle=c;g.textAlign='right';g.fillText(v,W-16,76+i*27);g.textAlign='left';});}),{glow:true}),0);p.rotation.x=-.16;};
   screen('bar-oxygen-menu',6.9,'OXYGEN MENU',[['O₂ PURITY BLEND','12'],['HYPER FOCUS','16'],['RECOVERY','14'],['CALM','12'],['SLEEP PREP','15']],'#58e8ff');screen('bar-drink-menu',13.1,'DRINK MENU',[['VANTOR STOUT','9'],['RECLAIMED-WATER GIN','14'],['SYNTH COLA','4'],['KAIJU FUEL','6'],['HOUSE TEA','3']],'#ff8ad0');
   box('bar-menu-frame',[.05,1.32,2.32],[16.745,2.4,35],dark);
   // ---- lamps: enamel dome pendants over the counter (pink, as before), two caged work lamps over the back bar (warm)
   for(const x of [6.6,10,13.4]){cyl('bar-pendant-cord',.008,.84,[x,3.6,37.6],black,true,5);cone('bar-pendant-shade',.3,.07,.2,[x,3.1,37.6],dark,T);cyl('bar-pendant-rim',.305,.02,[x,3.0,37.6],chrome,true,T);cyl('bar-pendant-light',.24,.02,[x,3.02,37.6],pink,true,T);if(!low){lightShaft('#ff3fb4',x,37.6,3.0,1.5,false);lightPool('#ff3fb4',2.6,2.6,[x,.046,37.4],.4);}}
   for(const x of [8.3,11.7]){cyl('bar-work-cord',.008,.7,[x,3.6,40.7],black,true,5);cone('bar-work-shade',.2,.06,.14,[x,3.2,40.7],brass,T);cyl('bar-work-bulb',.06,.1,[x,3.1,40.7],glowC('bar-bulb','#ffc98a',1.2),true,8);for(const a of [0,1.05,2.09,3.14,4.19,5.24])cyl('bar-work-cage',.004,.16,[x+Math.cos(a)*.08,3.08,40.7+Math.sin(a)*.08],brass,true,4);torus('bar-work-cage-ring',.16,.008,[x,3.0,40.7],brass);
    if(!low){lightShaft('#ffb45e',x,40.7,3.0,1.6,false,.8);lightPool('#ffb45e',3,2,[x,.046,40.3],.34);wallGlow('#ffb45e',3.4,2.6,[x,2,41.74],PI,.3);}}
   if(!low)lightPool('#ff3fb4',9,1.4,[10,.045,37.1],.3);
   tbox('bar-floor-mat',[8.2,.02,1.5],[10,.03,40.2],rubber,1);
   // ---- the lounge: two leather booths with steel tables, a lantern and an oxygen post on each, a pink dome lamp over each table
   for(const z of [29.5,32.5]){tbox('booth-base',[3.5,.36,.92],[14.5,.18,z],S.plate,1.4);box('booth-seat',[3.4,.12,.84],[14.5,.42,z+.02],leather);box('booth-back',[3.4,.72,.14],[14.5,.86,z-.4],leather);box('booth-back-cap',[3.5,.05,.18],[14.5,1.25,z-.4],dark);
    if(!low)for(let x=12.95;x<16.2;x+=.425)box('booth-tuft',[.012,.66,.02],[x,.86,z-.325],black);
    tbox('booth-table',[2.6,.05,.86],[14.5,.775,z+1],S.steel,1.6);box('booth-table-edge',[2.62,.03,.88],[14.5,.74,z+1],dark);for(const dx of [-.8,.8]){cyl('booth-table-leg',.04,.72,[14.5+dx,.37,z+1],chrome,true,8);cyl('booth-table-foot',.2,.025,[14.5+dx,.0325,z+1],chrome,true,T);}
    station(15.2,.8,z+1.1,1);cyl('bar-lantern-base',.05,.02,[14.2,.81,z+1],brass,true,8);cyl('bar-lantern-glass',.042,.1,[14.2,.87,z+1],glowC('bar-flame','#ffb05a',.85),true,8);cyl('bar-lantern-cap',.05,.02,[14.2,.93,z+1],brass,true,8);
    cyl('bar-tumbler',.036,.085,[13.7,.845,z+.9],glassM,true,low?8:10);cyl('bar-coaster',.05,.006,[13.7,.803,z+.9],black,true,10);
    cyl('bar-pendant-cord',.008,1.2,[14.5,3.4,z+1],black,true,5);cone('bar-pendant-shade',.3,.07,.2,[14.5,2.7,z+1],dark,T);cyl('bar-pendant-rim',.305,.02,[14.5,2.6,z+1],chrome,true,T);cyl('bar-pendant-light',.24,.02,[14.5,2.62,z+1],pink,true,T);if(!low){lightPool('#ff3fb4',3,2.4,[14.5,.046,z+1],.32);lightPool('#ff7ac8',1.6,.7,[14.5,.81,z+1],.4);}}
  }

  // ================================================== STORE COUNTER ==================================================
  /* Glass display cases along the customers' edge of the counter, each packed with rows of small goods on a low front tier and a raised back tier, a cold light strip under
     the cap, blank price tags; more stock standing on the counter between and behind them. The counter model, Admin and Iris are untouched. */
  function store(){
   const C=api.COUNTER,top=C.top,cs=low?dark:S.steel,pane=pg('case-pane','#cfe8ff',.06,.1),edge=glowC('case-edge','#9fd2e8',.34),led=glowC('case-led','#dcebff',1.1),felt=pm('case-felt','#0b0c10',.95,0,.4),tagM=pm('case-tag','#cfcabd',.9,0,.4),shelfM=pg('case-shelf','#bfe0ea',.22,.2);
   const steel=pm('item-steel','#7d848c',.3,.9,.42,.85),blk=pm('item-black','#1d2025',.5,.4,.42,.85),orange=pm('item-orange','#c4500f',.6,.1,.42,.85),olive=pm('item-olive','#3a4224',.8,.1,.42,.85),blue=pm('item-blue','#173f86',.5,.2,.42,.85),tan=pm('item-tan','#6e5a3c',.8,.1,.42,.85),green=pm('item-green','#23763a',.6,.1,.42,.85),yellow=pm('item-yellow','#a88a14',.6,.2,.42,.85),brass2=pm('item-brass','#94722a',.35,.9,.42,.85),lens=glowC('item-lens','#ff5a3a',.8),lensT=glowC('item-lens-teal','#5fe0ff',.8),clear=pg('item-clear','#d8f0f4',.3,.3),gunM=pm('item-gun','#2a2e34',.4,.8,.42,.85);
   const H=.3;
   for(const [a,b] of api.CASES){const w=b-a,xc=(a+b)/2,z0=C.z0+.08,d=.54,zc=z0+d/2;
    box('shop-case-base',[w,.03,d],[xc,top+.015,zc],cs);box('shop-case-felt',[w-.04,.012,d-.04],[xc,top+.036,zc],felt);box('shop-case-riser',[w-.04,.056,.15],[xc,top+.07,z0+.265],felt);
    box('shop-case-shelf',[w-.04,.008,.16],[xc,top+.194,z0+.42],shelfM);for(const x of [a+.05,xc,b-.05])box('shop-case-shelf-leg',[.012,.155,.012],[x,top+.115,z0+.345],cs);box('shop-case-shelf-light',[w-.1,.006,.01],[xc,top+.186,z0+.35],led);
    {let x=a+.05;const rnd=lcg(Math.round(a*100));while(x<b-.12){const bw=.07+rnd()*.07,bh=.04+rnd()*.07;box('shop-case-stock',[bw,bh,.1],[x+bw/2,top+.042+bh/2,z0+.43],[brass2,olive,blk,tan][Math.floor(rnd()*4)]);x+=bw+.012;}}
    for(const x of [a+.012,b-.012])for(const z of [z0+.012,z0+d-.012])box('shop-case-post',[.022,H,.022],[x,top+.03+H/2,z],cs);box('shop-case-cap',[w,.022,.05],[xc,top+.03+H,z0+.025],cs);box('shop-case-cap',[w,.022,.05],[xc,top+.03+H,z0+d-.025],cs);for(const x of [a+.012,b-.012])box('shop-case-cap',[.024,.022,d],[x,top+.03+H,zc],cs);
    box('shop-case-pane',[w-.03,H-.01,.008],[xc,top+.03+H/2,z0+.008],pane,true);box('shop-case-pane',[w-.03,.008,d-.03],[xc,top+.036+H,zc],pane,true);for(const x of [a+.008,b-.008])box('shop-case-pane',[.008,H-.01,d-.03],[x,top+.03+H/2,zc],pane,true);
    box('shop-case-edge',[w-.04,.006,.006],[xc,top+.034+H,z0+.052],edge);box('shop-case-led',[w-.08,.01,.014],[xc,top+.012+H,z0+.06],led);box('shop-case-back',[w,.16,.012],[xc,top+.03+.08,z0+d-.006],cs);
    box('shop-case-strip',[w-.02,.007,.012],[xc,top-.03,C.z0-.008],glowC('shop-pink-strip','#ff3fb4',.95));
    if(!low)lightPool('#cfe2ff',w+.5,1.1,[xc,.04,C.z0-.5],.18);}
   const at=(m,x,y,z,yaw,r)=>{m.position.set(x,y,z);m.rotation.set(r?.[0]||0,yaw+(r?.[1]||0),r?.[2]||0);return m;};
   const bx=(n,s,m)=>box(n,s,[0,0,0],m),cy=(n,r,h,m,t=low?6:8)=>cyl(n,r,h,[0,0,0],m,true,t);
   // An item is built in its own frame (x along it, y up from what it rests on, z toward the staff), turned by its yaw and made SCALE times life size.
   const frame=(x,y,z,yaw,k=api.SCALE)=>{const c=Math.cos(yaw),sn=Math.sin(yaw),P=(dx,dy,dz)=>[x+k*(dx*c+dz*sn),y+k*dy,z+k*(dz*c-dx*sn)],R=(e,r)=>{e.rotation.set(r?.[0]||0,yaw+(r?.[1]||0),r?.[2]||0);return e;};
    return {b:(sz,m,dx=0,dy=0,dz=0,r)=>R(box('shop-item',sz.map(v=>v*k),P(dx,dy,dz),m),r),c:(rad,h,m,dx=0,dy=0,dz=0,r,t)=>R(cyl('shop-item',rad*k,h*k,P(dx,dy,dz),m,true,t||(low?6:8)),r)};},LIE=[0,0,PI/2];
   const make={
    knife:(f,v)=>{f.b([.105,.005,.022],steel,.05,.012);f.b([.1,.022,.028],[blue,blk,olive,orange][v],-.055,.012);f.b([.012,.026,.034],blk,-.002,.013);},
    multitool:(f,v)=>{f.b([.1,.016,.03],steel,0,.008);f.b([.07,.006,.012],blk,.01,.02,0,[0,.5,0]);f.c(.006,.018,blk,-.04,.009,0,null,6);},
    flashlight:(f,v)=>{f.c(.013,.11,blk,-.012,.016,0,LIE);f.c(.018,.035,blk,.058,.018,0,LIE);f.c(.014,.004,lensT,.077,.018,0,LIE);f.c(.0135,.012,steel,-.03,.016,0,LIE);},
    compass:(f,v)=>{f.b([.06,.005,.095],clear,0,.003);f.c(.026,.012,blk,0,.012,-.015,null,10);f.c(.02,.002,tagM,0,.019,-.015,null,10);f.b([.003,.003,.03],lens,0,.021,-.015);},
    radio:(f,v)=>{f.b([.052,.105,.03],v%2?orange:blk,0,.053);f.c(.006,.06,blk,-.016,.135,0,null,5);f.b([.034,.03,.004],felt,0,.07,-.017);f.b([.03,.02,.004],blk,0,.03,-.017);},
    powerbank:(f,v)=>{f.b([.07,.016,.1],v%2?orange:blk,0,.008);f.b([.02,.004,.004],lensT,0,.012,-.05);},
    firestarter:(f,v)=>{f.c(.015,.075,orange,0,.038);f.c(.016,.02,blk,0,.085);},
    lighter:(f,v)=>{f.b([.036,.065,.02],orange,0,.033);f.b([.036,.018,.02],blk,0,.074);},
    sight:(f,v)=>{f.b([.045,.02,.065],blk,0,.01);f.b([.04,.04,.012],blk,0,.04,-.02);f.b([.03,.028,.004],lens,0,.04,-.027);f.c(.006,.01,steel,.026,.012,.01,LIE,6);},
    weaponlight:(f,v)=>{f.b([.07,.028,.03],blk,0,.014);f.c(.015,.02,blk,.04,.016,0,LIE);f.c(.011,.004,lensT,.051,.016,0,LIE);},
    filter:(f,v)=>{f.c(.015,.12,blue,0,.016,0,LIE);f.c(.01,.03,blk,.07,.016,0,LIE);f.c(.016,.02,tagM,-.02,.016,0,LIE);},
    paracord:(f,v)=>{f.c(.03,.12,v%2?olive:orange,0,.03,0,LIE);f.c(.031,.03,tagM,0,.03,0,LIE);},
    stakes:(f,v)=>{for(let k=0;k<5;k++){f.c(.004,.17,steel,0,.005,-.036+k*.018,LIE,4);f.b([.016,.006,.012],orange,-.08,.006,-.036+k*.018);}},
    canister:(f,v)=>{f.c(.048,.055,tagM,0,.028,0,null,10);f.c(.02,.02,blk,0,.065);f.c(.049,.012,blk,0,.02,0,null,10);},
    tin:(f,v)=>{f.b([.095,.022,.062],v%2?yellow:green,0,.011);f.b([.06,.002,.035],tagM,0,.023);},
    card:(f,v)=>{const m=v%2?green:steel;f.b([.085,.003,.054],m,0,.003);f.b([.085,.003,.054],m,.006,.007,.004,[0,.2,0]);},
    headlamp:(f,v)=>{f.b([.05,.03,.03],blk,0,.016,-.012);f.b([.09,.02,.004],v%2?blue:olive,0,.016,.006);f.b([.02,.016,.004],lensT,0,.018,-.028);},
    pistol:(f,v)=>{f.b([.19,.026,.034],gunM,0,.016,-.028);f.b([.05,.026,.085],blk,-.058,.016,.028,[0,.18,0]);f.b([.05,.012,.03],blk,-.005,.01,.004);f.b([.04,.004,.02],steel,.04,.03,-.028);},
    magazine:(f,v)=>{f.b([.024,.1,.05],blk,0,.05,0,[-.2,0,0]);f.b([.02,.006,.04],brass2,0,.1,-.01,[-.2,0,0]);},
    ammo:(f,v)=>{const h=.04+v*.006;f.b([.08,h,.05],v%2?brass2:olive,0,h/2);f.b([.081,.012,.051],tagM,0,h*.6);},
    tag:(f)=>{f.b([.05,.03,.003],tagM,0,.016,0,[-.35,0,0]);}};
   /* The pistols, radios and flashlights are modelled (Medium and above); a pistol lies on a felt pad either way. */
   const lies={pistol:{y:.01,yaw:0},radio:{y:0,yaw:0},flashlight:{y:0,yaw:0}};
   for(const it of api.counterItems(true)){const f=frame(it.x,it.y,it.z,it.yaw,it.kind==='tag'?1:api.SCALE),L=lies[it.kind];if(it.kind==='pistol')f.b([.16,.012,.1],felt,-.01,.004,0);
    if(L)prop(it.kind,{x:it.x,y:it.y+L.y*api.SCALE,z:it.z,yaw:it.yaw+L.yaw,k:api.SCALE},()=>make[it.kind](f,it.v));else make[it.kind](f,it.v);}
   // on the counter between the cases (never in front of Admin or Iris): boxed stock in stacks, steel bottles, a stove, a radio set, a card reader and a tray
   {const rnd=lcg(77),y=top;for(const [x0,x1,z] of [[6.15,7.4,47.5],[8.7,10.2,47.52],[10.35,11.85,47.52],[13.15,13.9,47.5]]){let x=x0;while(x<x1-.12){const k=Math.floor(rnd()*5),w=.1+rnd()*.1;
      if(k===0){const n=1+Math.floor(rnd()*3);for(let s=0;s<n;s++)at(bx('shop-stock',[w,.05,.14],[tan,olive,brass2][Math.floor(rnd()*3)]),x+w/2,y+.025+s*.052,z,(rnd()-.5)*.2);}
      else if(k===1){at(cy('shop-stock',.036,.2,[steel,olive,blk][Math.floor(rnd()*3)],10),x+w/2,y+.1,z,0);at(cy('shop-stock',.02,.03,blk),x+w/2,y+.215,z,0);}
      else if(k===2){at(bx('shop-stock',[w,.13,.09],[green,orange,blk][Math.floor(rnd()*3)]),x+w/2,y+.065,z,(rnd()-.5)*.3);at(cy('shop-stock',.005,.09,blk,4),x+w/2-.03,y+.17,z,0);}
      else if(k===3){for(let s=0;s<3;s++)at(bx('shop-stock',[w*.9,.014,.12],tan),x+w/2,y+.008+s*.016,z+s*.006,(rnd()-.5)*.3);}
      else{at(cy('shop-stock',.045,.11,olive,10),x+w/2,y+.055,z,0);at(cy('shop-stock',.03,.05,steel,8),x+w/2,y+.135,z,0);}
      x+=w+.03+rnd()*.05;}}
    for(const x of api.STAFF){at(bx('shop-reader',[.09,.03,.14],blk),x+.42,y+.02,47.0,0,[-.3,0,0]);at(bx('shop-reader-screen',[.07,.004,.06],glowC('vend-ok','#6cff9e',1)),x+.42,y+.045,46.985,0,[-.3,0,0]);at(bx('shop-tray',[.3,.012,.2],felt),x-.05,y+.006,46.95,0);}}
  }

  // ================================================== VR PLAY AREA ==================================================
  /* The two booths and the viewing strip keep their size, glass, players and terminal. This gives each booth steel framing with clamps, a dotted play floor with a thin
     boundary, a wall grid with a headset and controllers on hooks, a floor unit with cables, tracking cameras on arms, and a real lamp housing; and the strip a headset rack. */
  function vr(booths){
   const frame=low?dark:S.steel,T=low?8:12;
   const dotT=texture('dr-vr-floor',256,256,(g,W,H)=>{g.fillStyle='#20242c';g.fillRect(0,0,W,H);const rnd=lcg(9);for(let n=0;n<26;n++){const x=rnd()*W,y=rnd()*H,r=20+rnd()*60,gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(8,9,12,.6)');gr.addColorStop(1,'rgba(8,9,12,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}g.strokeStyle='rgba(0,0,0,.6)';g.lineWidth=2;g.strokeRect(1,1,W-2,H-2);g.fillStyle='rgba(170,190,210,.8)';for(let y=32;y<H;y+=64)for(let x=32;x<W;x+=64){g.beginPath();g.arc(x,y,2.2,0,7);g.fill();}}),padM=pm('vr-pad-dots','#ffffff',.42,.3,0);
   if(!padM.albedoTexture){dotT.uScale=7.4;dotT.vScale=6.4;padM.albedoTexture=dotT;padM.emissiveTexture=dotT;padM.emissiveColor=new B.Color3(.45,.45,.5);}
   const visor=pm('vr-visor','#b4b9c0',.35,.1,.3),foam=pm('vr-foam','#08090b',.9,0,.4),gridM=pm('vr-grid','#2a2e35',.4,.8,.4);
   // A headset hung by its strap, visor outward: `face` is the axis it looks along ('x' off the west wall, 'z' off the north wall).
   const gloss=pm('vr-gloss','#06070a',.12,.5,.3),headsetBuilt=(x,y,z,face,glow)=>{const at=(d,h,l)=>face==='x'?[x+d,y+h,z+l]:[x+l,y+h,z+d],sz=(a,b,c)=>face==='x'?[a,b,c]:[c,b,a];
    box('vr-hmd',sz(.1,.105,.2),at(0,0,0),visor);box('vr-hmd-front',sz(.014,.09,.18),at(.055,0,0),gloss);box('vr-hmd-lens',sz(.006,.016,.13),at(.064,.012,0),glow);box('vr-hmd-face',sz(.03,.09,.17),at(-.062,0,0),foam);
    for(const l of [-.098,.098])box('vr-hmd-strap',sz(.15,.03,.012),at(-.14,.012,l),foam);box('vr-hmd-pad',sz(.03,.08,.13),at(-.215,.012,0),foam);box('vr-hmd-top',sz(.2,.012,.03),at(-.11,.06,0),foam);for(const l of [-.07,.07])box('vr-hmd-cam',sz(.006,.016,.016),at(.064,-.03,l),visor);};
   const headset=(x,y,z,face,glow)=>prop('vr-headset',{x:face==='x'?x-.06:x,y:y-.07,z:face==='x'?z:z-.06,yaw:face==='x'?PI/2:0},()=>headsetBuilt(x,y,z,face,glow));
   const controller=(x,y,z,glow)=>{cyl('vr-ctl-grip',.016,.11,[x,y,z],visor,true,6);torus('vr-ctl-ring',.085,.012,[x+.01,y+.075,z],visor,[0,0,PI/2]);box('vr-ctl-lamp',[.006,.012,.012],[x+.018,y+.02,z],glow);};
   for(const b of booths){const zc=(b.z0+b.z1)/2,len=b.z1-b.z0,c=b.tint,glow=b.color,lampM=glowC('vr-lamp-'+c,c,1.15);
    // floor: a dotted rubber pad, a thin boundary with corner brackets
    box('vr-pad',[7.4,.03,len-.6],[-12.7,.035,zc],padM);for(const [w,d,x,z] of [[6.6,.03,-12.7,b.z0+.7],[6.6,.03,-12.7,b.z1-.7],[.03,len-1.4,-16,zc],[.03,len-1.4,-9.4,zc]])box('vr-boundary',[w,.012,d],[x,.052,z],glow);
    for(const sx of [-1,1])for(const sz of [-1,1]){const x=-12.7+sx*2.7,z=zc+sz*(len/2-1.15);box('vr-corner-mark',[.42,.012,.05],[x-sx*.185,.052,z],glow);box('vr-corner-mark',[.05,.012,.42],[x,.052,z-sz*.185],glow);}
    // glass front: steel posts, a base channel and a header, clamps holding the pane
    for(const z of [b.z0,b.z1])tbox('vr-post',[.12,3.05,.12],[-8.5,1.525,z],frame,1.2);for(const z of [b.z0+.075,b.z1-.075])box('vr-glass-edge',[.012,2.84,.012],[-8.46,1.5,z],glowC('vr-edge-'+c,c,.45));tbox('vr-sill',[.2,.08,len],[-8.5,.04,zc],frame,1.2);tbox('vr-header',[.2,.14,len],[-8.5,2.98,zc],frame,1.2);
    if(!low)for(const z of [b.z0+.9,zc-.9,zc+.9,b.z1-.9])for(const y of [.16,2.84]){box('vr-clamp',[.1,.1,.08],[-8.5,y,z],dark);for(const dx of [-.052,.052])cyl('vr-clamp-bolt',.012,.012,[-8.5+dx,y,z],chrome,true,6).rotation.z=PI/2;}
    box('vr-sill-lamp',[.02,.02,len-.5],[-8.38,.09,zc],glow);
    // overhead: the lamp in a housing with a frame and hangers, tracking cameras on arms at the corners, slung cables
    tbox('vr-bar-housing',[3.5,.12,.62],[-12.7,3.52,zc],dark,1.2);box('vr-bar-light',[3.1,.02,.36],[-12.7,3.455,zc],lampM);for(const dx of [-1.6,1.6]){box('vr-bar-end',[.08,.16,.66],[-12.7+dx,3.5,zc],frame);cyl('vr-bar-hanger',.012,.5,[-12.7+dx*.8,3.82,zc],chrome,true,5);}
    for(const [x,z] of [[-16.3,b.z0+.5],[-9.1,b.z0+.5],[-16.3,b.z1-.5],[-9.1,b.z1-.5]]){const sx=x<-12?1:-1,sz=z<zc?1:-1,yaw=Math.atan2(sx,sz);box('vr-cam-arm',[.04,.3,.04],[x,3.42,z],dark);const body=box('vr-cam',[.14,.11,.2],[x+sx*.06,3.24,z+sz*.06],visor);body.rotation.y=yaw;body.rotation.x=.35;
     const l=cyl('vr-cam-lens',.04,.03,[x+sx*.13,3.2,z+sz*.13],black,true,10);l.rotation.x=PI/2+.35;l.rotation.y=yaw;const r=torus('vr-cam-ring',.085,.012,[x+sx*.138,3.197,z+sz*.138],glow,[PI/2+.35,yaw,0]);void r;}
    if(!low)for(const [x,z0,z1,sag] of [[-14.6,b.z0+.4,zc,.22],[-11.2,zc,b.z1-.4,.3]]){const n=6;for(let k=0;k<n;k++){const t0=k/n,t1=(k+1)/n,y0=3.58-sag*Math.sin(t0*PI),y1=3.58-sag*Math.sin(t1*PI),za=z0+(z1-z0)*t0,zb=z0+(z1-z0)*t1,L=Math.hypot(zb-za,y1-y0),s=cyl('vr-cable',.012,L,[x,(y0+y1)/2,(za+zb)/2],black,true,5);s.rotation.x=PI/2-Math.atan2(y1-y0,zb-za);}}
    // back wall: a wire grid with a headset and two controllers on hooks, a short lamp above and below it; a floor unit with a lit slot, cabled to the wall
    {const gx=-16.5,gz=zc+(zc<36?-1.3:1.3),gy=1.72;box('vr-grid-frame',[.03,1.3,.04],[gx,gy,gz-.55],gridM);box('vr-grid-frame',[.03,1.3,.04],[gx,gy,gz+.55],gridM);box('vr-grid-frame',[.03,.04,1.14],[gx,gy+.65,gz],gridM);box('vr-grid-frame',[.03,.04,1.14],[gx,gy-.65,gz],gridM);
     for(let k=1;k<(low?5:10);k++)box('vr-grid-wire',[.012,1.3,.012],[gx,gy,gz-.55+k*1.1/(low?5:10)],gridM);for(let k=1;k<(low?6:12);k++)box('vr-grid-wire',[.012,.012,1.1],[gx,gy-.65+k*1.3/(low?6:12),gz],gridM);
     box('vr-grid-hook',[.12,.02,.02],[gx+.06,gy+.36,gz],chrome);headset(gx+.29,gy+.28,gz,'x',glow);for(const dz of [-.2,.2]){box('vr-grid-hook',[.1,.02,.02],[gx+.05,gy-.2,gz+dz],chrome);controller(gx+.1,gy-.28,gz+dz,glow);}
     box('vr-grid-lamp',[.02,.02,1.0],[gx+.02,gy+.76,gz],glow);box('vr-grid-lamp',[.02,.02,1.0],[gx+.02,gy-.76,gz],glow);
     tbox('vr-unit',[.5,.52,.8],[gx+.2,.26,gz],S.plate,1);for(let k=0;k<4;k++)box('vr-unit-slat',[.02,.02,.6],[gx+.455,.32+k*.045,gz],black);box('vr-unit-lamp',[.02,.03,.4],[gx+.455,.14,gz],glow);
     rod('vr-unit-cable',.02,1.6,[gx+.08,.06,gz+(zc<36?1.2:-1.2)],black,'z',6);rod('vr-unit-cable',.014,1.3,[gx+.12,.045,gz+(zc<36?1.05:-1.05)],black,'z',6);cyl('vr-unit-riser',.02,1.2,[gx+.06,.6,gz+(zc<36?.5:-.5)],black,true,6);
     if(!low){wallGlow(c,2.2,2.2,[gx+.03,gy,gz],-PI/2,.3);lightPool(c,1.4,1.4,[gx+.8,.056,gz],.3);}}
    if(!low){lightPool(c,6.4,5.6,[-12.7,.056,zc],.3);lightPool(c,2.2,5,[-7.3,.045,zc],.22);}}
   // ceiling services where the coloured tube grid was: beams, a cable tray, conduits
   for(const z of [30,36,42])tbox('vr-beam',[13.4,.18,.16],[-10,3.96,z],dark,1.5);tbox('vr-tray',[.5,.05,13.4],[-10.6,3.78,36],dark,1);for(const dz of [-.22,.22])box('vr-tray-edge',[.02,.1,13.4],[-10.6+dz,3.8,36],frame);
   rod('vr-conduit',.03,13.4,[-6.4,3.84,36],frame,'z',6);rod('vr-conduit',.02,13.4,[-6.2,3.88,36],dark,'z',6);for(const z of [30.5,36,41.5])box('vr-tray-hanger',[.56,.03,.03],[-10.6,3.74,z],frame);
   // the viewing strip: a worn painted line in place of the glowing one, and a rack of spare headsets by the north wall
   {const t=texture('dr-vr-line',64,256,(g,W,H)=>{g.clearRect(0,0,W,H);const rnd=lcg(3);for(let y=0;y<H;y+=32){g.fillStyle='rgba(214,176,48,.82)';g.beginPath();g.moveTo(0,y+20);g.lineTo(W,y);g.lineTo(W,y+12);g.lineTo(0,y+32);g.fill();}g.globalCompositeOperation='destination-out';for(let n=0;n<260;n++){g.fillStyle='rgba(0,0,0,'+(.3+rnd()*.6)+')';g.fillRect(rnd()*W,rnd()*H,2+rnd()*9,1+rnd()*4);}g.globalCompositeOperation='source-over';});t.hasAlpha=true;t.vScale=14;const m=litMat('vr-line',t,true);m.emissiveTexture.level=.5;
    const g=B.MeshBuilder.CreateGround('vr-floor-line',{width:.12,height:13.6},scene);add(g,m,[-7.9,.041,36],false);}
   {const x0=-6.9,z=28.5;tbox('vr-rack-board',[2.2,1.5,.04],[x0+1.1,1.75,z-.04],S.plate,1.2);for(const dx of [.04,2.16])box('vr-rack-post',[.05,2.5,.06],[x0+dx,1.25,z],dark);tbox('vr-rack-shelf',[2.2,.03,.32],[x0+1.1,1.0,z+.14],frame,1);
    for(let k=0;k<3;k++){const x=x0+.42+k*.68,g=k%2?booths[1]?.color||booths[0].color:booths[0].color;box('vr-rack-hook',[.02,.02,.16],[x,2.2,z+.07],chrome);
     headset(x,2.12,z+.3,'z',g);
     for(const dx of [-.12,.12]){box('vr-rack-hook',[.02,.02,.1],[x+dx,1.62,z+.04],chrome);cyl('vr-ctl-grip',.016,.11,[x+dx,1.55,z+.09],visor,true,6);torus('vr-ctl-ring',.085,.012,[x+dx,1.625,z+.1],visor,[PI/2,0,0]);}
     box('vr-rack-dock',[.3,.04,.2],[x,1.035,z+.14],black);box('vr-rack-dock-lamp',[.1,.008,.006],[x,1.04,z+.243],glowC('vend-ok','#6cff9e',1));}
    box('vr-rack-lamp',[2.0,.02,.03],[x0+1.1,2.52,z+.06],glowC('case-led','#dcebff',1.1));if(!low){wallGlow('#cfe2ff',2.6,1.8,[x0+1.1,1.9,z-.015],0,.2);}}
  }
  return {machine,alcove,campaign,bar,store,vr,every(fn){ticks.push(fn);},tick(dt){for(const t of ticks)t(dt);}};
 }
 api.build=build;
 if(typeof module!=='undefined')module.exports=api;else root.VoidDistrictRooms=api;
})(globalThis);
