/* CROSSWALKS (the owner, 20 Nov 2026: "Another thing NeoChinaTown needs are crosswalks"). Worn white zebra crossings on NeoChinatown's roads: at every junction (Main Street with
   the Avenue, the District alley and the access road; the T-junctions), by the gates and taxi stops, and mid-block on the long stretches (Main Street, the Avenue, Far South)
   where the pavements face each other. Junctions and gates also get a pedestrian signal post on each kerb with a small lit WALK figure (an unlit emissive icon, no real light).
   WHO USES THEM: street walkers who change sides cross here (ncz-nightlife.js), a mission character leading or following prefers them (npc-escort.js walkRoute), the mission
   arrow routes over them when the goal is across the road (guide-route.js), and the road taxis slow and stop for anyone on one ahead (road-taxi-rules.js stepWorld).
   A crosswalk is ROAD: nobody is ever placed standing on one (npc-areas.js keeps roads off limits; the signal posts are obstacles there); walkers only pass over it.
   PURE PART (Node, tests/crosswalks.test.cjs): ROADS, list(quarter), get(id), at(x, z, quarter, m), sideOf(road, p), crossing(a, b, opt), clearToCross(c, taxis), yieldTo(taxi,
   peds, quarter), mark(key, x, z, now) / peds(now), skipMark(x, z). BROWSER PART: build({B, scene, parent, quality, quarter, road}) -> {stats(), dispose()}: one merged
   mesh of road paint per quarter (all crossings and stop lines), one of signal posts and one of icons (Low: the paint only). Nothing is saved. */
(function(root){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports;
 /* The roads that have crossings (neochinatown.js streets; the pavements are 3 m on Main Street and the Avenue, 1.5 m on the access road). axis: the direction a pedestrian
    walks ACROSS the road ('x' over Main Street, which runs north-south; 'z' over the Avenue and the access road). band: the carriageway between the kerbs, on that axis.
    rect: the whole street (both pavements). lanes: the street walkers' pavement lanes on the lo / hi side (ncz-nightlife.js), null where nobody walks. */
 const ROADS={
  'main-ot':{id:'main-ot',quarter:'oldtown',axis:'x',band:[54,68],rect:[51,71,-124,-26],lanes:['main-west','main-east']},
  'main-fs':{id:'main-fs',quarter:'far-south',axis:'x',band:[54,68],rect:[51,71,-218,-130],lanes:['main-far-west','main-far-east']},
  avenue:{id:'avenue',quarter:'avenue',axis:'z',band:[-17,-8],rect:[2,152,-20,-5],lanes:['avenue-south','avenue-north']},
  access:{id:'access',quarter:'oldtown',axis:'z',band:[-119.5,-117.5],rect:[13,54,-121,-116],lanes:null}};
 /* [id, road, at (the crossing's centre line along the road), width along the road, kind, signal posts, post side (+1: the lo kerb's post stands on the +along side of the
    crossing and the hi kerb's on the - side; -1 the other way round)]. Placed clear of the kerb's furniture (ad screens, kiosks, taxi poles: npc-areas.js obstacles). */
 const DATA=[
  ['ot-north-gate','main-ot',-29.5,3,'gate',true,-1],     // Main Street by the North Gate (A2): its two walkers' doors open onto the pavements just north
  ['ot-alley','main-ot',-58.5,3,'junction',true,-1],      // the District alley's mouth, NULL's door opposite (its pavement is walked past by everyone; only its doorway is never stood in)
  ['ot-mid','main-ot',-88,3,'mid',false,-1],              // mid-block, between the two taxi stops (NULL / the alley at -66, Main Street at -100)
  ['ot-south','main-ot',-116.5,3,'junction',true,1],      // the access road's corner and the South Gate (A5) beyond
  ['ar-main','access',52.5,2.6,'junction',false,1],       // across the access road's mouth, on Main Street's west pavement line
  ['ar-customs','access',39.2,2.4,'gate',false,1],        // in front of Port Customs' (A1) walkers' door
  ['av-function','avenue',14,3,'gate',true,-1],           // the Function Gate (A3)
  ['av-north-w','avenue',50.5,3,'junction',true,-1],      // either side of the North Gate's (A2) junction with Main Street
  ['av-north-e','avenue',71.5,3,'junction',true,-1],
  ['av-mid','avenue',107,3,'mid',false,-1],               // mid-block on the long eastern stretch
  ['av-east','avenue',140,3,'gate',true,-1],              // the East Gate (A4)
  ['fs-south-gate','main-fs',-133,3,'gate',true,-1],      // Far South by the South Gate (A5)
  ['fs-milked','main-fs',-161,3,'junction',true,-1],      // just north of Milked's side street (the pavement across its mouth is public; the side street itself is never used by Reverie and Lace)
  ['fs-alley','main-fs',-199,3,'mid',false,-1],           // south of Milked's service alley
  ['fs-far-gate','main-fs',-213.5,3,'gate',true,-1]];     // the end of the road, in front of the Far South Gate's (A6) walkers' door
 const STEP_ON=.6,POST_IN=.3,POST_OUT=.4,STOP_GAP=1.1,STOP_W=.3;
 function make([id,road,at,w,kind,signal,ps]){const R=ROADS[road],[b0,b1]=R.band,X=R.axis==='x',P=(across,along)=>X?[across,along]:[along,across];
  const lo=P(b0,at-w/2),hi=P(b1,at+w/2),rect=[Math.min(lo[0],hi[0]),Math.max(lo[0],hi[0]),Math.min(lo[1],hi[1]),Math.max(lo[1],hi[1])];
  const ends=[P(b0-STEP_ON,at),P(b1+STEP_ON,at)];
  const posts=signal?[{p:P(b0-POST_IN,at+ps*(w/2+POST_OUT)),face:1},{p:P(b1+POST_IN,at-ps*(w/2+POST_OUT)),face:-1}]:[];
  // stop lines: right-hand traffic (the cabs drive on the right: Main Street's southbound lane is its west half, the Avenue's eastbound lane its south half)
  const mid=(b0+b1)/2,stops=[{from:b0+.2,to:mid-.15,along:X?at+w/2+STOP_GAP:at-w/2-STOP_GAP},{from:mid+.15,to:b1-.2,along:X?at-w/2-STOP_GAP:at+w/2+STOP_GAP}];
  return {id,road,quarter:R.quarter,axis:R.axis,at,w,kind,signal,band:[b0,b1],rect,ends,posts,stops,lanes:R.lanes?R.lanes.slice():null};}
 const ALL=DATA.map(make),BY=new Map(ALL.map(c=>[c.id,c]));
 const list=q=>q?ALL.filter(c=>c.quarter===q):ALL.slice(),get=id=>BY.get(id)||null;
 const inside=(c,x,z,m=0)=>x>=c.rect[0]-m&&x<=c.rect[1]+m&&z>=c.rect[2]-m&&z<=c.rect[3]+m;
 /* The crossing under a point (m: a margin all round), or null. */
 function at(x,z,quarter,m=0){for(const c of ALL)if((!quarter||c.quarter===quarter)&&inside(c,x,z,m))return c;return null;}
 const across=(R,p)=>R.axis==='x'?p.x:p.z,along=(R,p)=>R.axis==='x'?p.z:p.x;
 const inRect=(r,x,z,m=0)=>x>=r[0]-m&&x<=r[1]+m&&z>=r[2]-m&&z<=r[3]+m;
 /* Which side of a road a point is on: -1 the lo kerb's side, 1 the hi kerb's, 0 on the carriageway; null when it is not on this street (m: a doorstep's margin). */
 function sideOf(R,p,m=2.5){if(!R||!p||!inRect(R.rect,p.x,p.z,m))return null;const a=across(R,p);return a<R.band[0]?-1:a>R.band[1]?1:0;}
 /* A walk from a to b that has to cross a road: by the crossing that adds the least walking. a and b {x, z}; opt {quarter, prefer: Set of crossing ids already in use (they
    win ties by `bonus` metres), bonus, limit (the most extra walking accepted)}. Returns {c, from (-1 | 1), entry {x, z} (the kerb on a's side), exit {x, z}, extra} or null
    (same side, not on one street, a or b on the carriageway away from a crossing). A walker already ON a crossing gets that crossing (entry null: only the far kerb is left;
    opt.onRoad false: a point on the carriageway never counts as on a crossing, for waypoints such as a junction's middle; 'prefer': only a crossing already in use counts,
    so somebody walking ALONG the road over the stripes is not sent across). */
 function crossing(a,b,opt={}){if(!a||!b)return null;const q=opt.quarter||null,bonus=opt.bonus??4,limit=opt.limit??90;let best=null;
  for(const R of Object.values(ROADS)){if(q&&R.quarter!==q)continue;const sa=sideOf(R,a),sb=sideOf(R,b);if(sa==null||sb==null||!sb)continue;
   if(!sa){if(opt.onRoad===false)continue;const c=list(R.quarter).find(x=>x.road===R.id&&inside(x,a.x,a.z,.5));if(!c||(opt.onRoad==='prefer'&&!(opt.prefer&&opt.prefer.has(c.id))))continue;const e=c.ends[sb>0?1:0],exit={x:e[0],z:e[1]};return {c,from:-sb,entry:null,exit,extra:0};}
   if(sa===sb)continue;const direct=Math.hypot(b.x-a.x,b.z-a.z);
   for(const c of ALL){if(c.road!==R.id)continue;const ea=c.ends[sa>0?1:0],eb=c.ends[sb>0?1:0],entry={x:ea[0],z:ea[1]},exit={x:eb[0],z:eb[1]};
    const cost=Math.hypot(entry.x-a.x,entry.z-a.z)+Math.hypot(exit.x-entry.x,exit.z-entry.z)+Math.hypot(b.x-exit.x,b.z-exit.z),extra=cost-direct,score=cost-(opt.prefer&&opt.prefer.has(c.id)?bonus:0);
    if(extra<=limit&&(!best||score<best.score))best={c,from:sa,entry,exit,extra,score};}}
  if(!best)return null;delete best.score;return best;}
 /* Before stepping off the kerb a walker looks: false while a moving cab is coming at the crossing (within `near` m, ahead of it, faster than `slow` m/s). */
 function clearToCross(c,taxis,near=15,slow=1.5){const cx=(c.rect[0]+c.rect[1])/2,cz=(c.rect[2]+c.rect[3])/2;
  for(const t of taxis||[]){if(!t||!(t.speed>slow))continue;const dx=cx-t.x,dz=cz-t.z,d=Math.hypot(dx,dz);if(d>near)continue;if(dx*Math.sin(t.yaw||0)+dz*Math.cos(t.yaw||0)>-1)return false;}return true;}
 /* People on the crossings now: walkers, mission characters and the player are marked each frame they move (key: anything stable), and count for half a second. */
 const marks=new Map(),now=()=>typeof performance!=='undefined'&&performance.now?performance.now():Date.now();
 function mark(key,x,z,t=now()){if(Number.isFinite(x)&&Number.isFinite(z))marks.set(key,{x,z,t});}
 function peds(t=now(),ttl=500){const out=[];for(const [k,p] of marks){if(t-p.t>ttl){marks.delete(k);continue;}out.push({x:p.x,z:p.z});}return out;}
 /* What makes a cab yield: for each crossing ahead of it (its centre line runs into the paint, plus `margin` along the road, within `look` m, and its nose not already on it)
    with somebody on it (or stepping off the kerb onto it), an obstacle for road-taxi-rules.js targetSpeed placed so that the cab stops `stopShort` m before the paint.
    taxi {x, z, yaw}; peds [{x, z}]. spec: the cab's nose and gap (road-taxi-rules.js SPEC). */
 function yieldTo(taxi,list_,quarter,spec={nose:2.2,gap:2.6},look=18,stopShort=.8){const out=[];if(!taxi||!list_||!list_.length)return out;
  const fx=Math.sin(taxi.yaw||0),fz=Math.cos(taxi.yaw||0);
  for(const c of ALL){if(quarter&&c.quarter!==quarter)continue;const X=c.axis==='x',r=c.rect,occupied=list_.some(p=>X?p.x>=r[0]-.3&&p.x<=r[1]+.3&&p.z>=r[2]-.15&&p.z<=r[3]+.15:p.x>=r[0]-.15&&p.x<=r[1]+.15&&p.z>=r[2]-.3&&p.z<=r[3]+.3);if(!occupied)continue;
   // ray against the paint (with .4 m along the road) by slabs
   const g=[r[0]-(X?0:.4),r[1]+(X?0:.4),r[2]-(X?.4:0),r[3]+(X?.4:0)];let t0=-Infinity,t1=Infinity,hit=true;
   for(const [o,d,lo,hi] of [[taxi.x,fx,g[0],g[1]],[taxi.z,fz,g[2],g[3]]]){if(Math.abs(d)<1e-9){if(o<lo||o>hi){hit=false;break;}continue;}let a=(lo-o)/d,b=(hi-o)/d;if(a>b)[a,b]=[b,a];t0=Math.max(t0,a);t1=Math.min(t1,b);}
   if(!hit||t1<t0||t1<0||t0>look||t0<spec.nose-.3)continue;
   const d=t0+spec.gap-stopShort;out.push({x:taxi.x+fx*d,z:taxi.z+fz*d,r:0,crosswalk:c.id});}
  return out;}
 /* The yellow centre dashes stop at a crossing and its stop lines. */
 function skipMark(x,z,len=2.6){for(const c of ALL){const X=c.axis==='x',a=X?z:x,h=c.w/2+STOP_GAP+STOP_W+len/2+.2;if(Math.abs(a-c.at)<h&&inRect(c.rect,x,z,X?h:h)&&(X?x>=c.band[0]&&x<=c.band[1]:z>=c.band[0]&&z<=c.band[1]))return true;}return false;}

 /* ---- Browser: the paint, the posts and the icons ---- */
 function rng(seed){let s=seed>>>0||1;return ()=>((s=Math.imul(s,1664525)+1013904223>>>0)/4294967296);}
 // The stripes' picture: 4 m across the road (four bars of 0.5 m with 0.5 m between) by the crossing's width along it, each bar worn its own way: chipped edges, scuffs
 // where wheels run, grime and cracks, so the paint reads as old road paint on wet asphalt, never as clean white blocks.
 function paint(g,W,H){const r=rng(90210),pm=W/4;g.clearRect(0,0,W,H);
  for(let k=0;k<4;k++){const x0=k*pm+pm*.25,bw=pm*.5;g.save();g.beginPath();g.rect(x0,H*.025,bw,H*.95);g.clip();
   g.fillStyle='rgba(214,214,204,.9)';g.fillRect(x0,0,bw,H);
   // grime and tyre scuffs (darker, along the road), then wear: the paint gone in patches (erased)
   for(let i=0;i<260;i++){g.fillStyle='rgba('+(20+r()*30|0)+','+(20+r()*28|0)+','+(18+r()*22|0)+','+(.05+r()*.18)+')';const w=1+r()*5,h=2+r()*26;g.fillRect(x0+r()*bw,r()*H,w,h);}
   for(let i=0;i<3;i++){const tx=x0+r()*bw;const gr=g.createLinearGradient(tx-12,0,tx+12,0);gr.addColorStop(0,'rgba(30,30,28,0)');gr.addColorStop(.5,'rgba(30,30,28,'+(.18+r()*.2)+')');gr.addColorStop(1,'rgba(30,30,28,0)');g.fillStyle=gr;g.fillRect(tx-12,0,24,H);}
   g.globalCompositeOperation='destination-out';
   for(let i=0;i<34;i++){const cx=x0+r()*bw,cy=r()*H,rr=2+r()*(r()<.15?26:9);g.fillStyle='rgba(0,0,0,'+(.35+r()*.6)+')';g.beginPath();g.ellipse(cx,cy,rr,rr*(.5+r()*1.4),r()*3,0,Math.PI*2);g.fill();}
   for(let i=0;i<120;i++){const side=r()<.5?x0+r()*4:x0+bw-r()*4;g.fillStyle='rgba(0,0,0,'+(.5+r()*.5)+')';g.fillRect(side-2,r()*H,2+r()*4,2+r()*8);}   // chipped edges
   for(let i=0;i<900;i++){g.fillStyle='rgba(0,0,0,'+(r()*.5)+')';g.fillRect(x0+r()*bw,r()*H,1+r()*2,1+r()*2);}   // the asphalt grain showing through
   for(let i=0;i<2;i++){const y0=H*(.15+r()*.7),y1=H*(.05+r()*.9);g.globalAlpha=1;g.lineWidth=1.5+r()*1.5;g.strokeStyle='rgba(0,0,0,.85)';g.beginPath();g.moveTo(x0,y0);for(let s=1;s<=6;s++)g.lineTo(x0+bw*s/6+(r()-.5)*6,y0+(y1-y0)*s/6+(r()-.5)*14);g.stroke();}   // cracks
   g.globalCompositeOperation='source-over';
   const fade=g.createLinearGradient(0,0,0,H);fade.addColorStop(0,'rgba(40,40,36,.25)');fade.addColorStop(.12,'rgba(40,40,36,0)');fade.addColorStop(.88,'rgba(40,40,36,0)');fade.addColorStop(1,'rgba(40,40,36,.25)');g.globalCompositeOperation='source-atop';g.fillStyle=fade;g.fillRect(x0,0,bw,H);g.globalCompositeOperation='source-over';
   g.restore();}}
 // The signal's face: a dark hand (off) over a lit walking figure (on), a dim cool white, like an old LED head seen through grime.
 function icons(g,W,H){g.fillStyle='#050608';g.fillRect(0,0,W,H);g.strokeStyle='#15181c';g.lineWidth=6;g.strokeRect(3,3,W-6,H-6);
  const hand=(cx,cy,s,col)=>{g.fillStyle=col;g.beginPath();g.ellipse(cx,cy+s*.25,s*.42,s*.45,0,0,Math.PI*2);g.fill();for(let i=0;i<4;i++)g.fillRect(cx-s*.38+i*s*.21,cy-s*.55,s*.15,s*.6);g.save();g.translate(cx-s*.45,cy+s*.05);g.rotate(-.7);g.fillRect(-s*.07,-s*.32,s*.15,s*.36);g.restore();};
  const man=(cx,cy,s,col)=>{g.strokeStyle=col;g.fillStyle=col;g.lineWidth=s*.16;g.lineCap='round';g.beginPath();g.arc(cx+s*.05,cy-s*.62,s*.13,0,Math.PI*2);g.fill();g.beginPath();
   g.moveTo(cx,cy-s*.42);g.lineTo(cx-s*.06,cy+s*.08);g.moveTo(cx-s*.06,cy+s*.08);g.lineTo(cx-s*.3,cy+s*.55);g.moveTo(cx-s*.06,cy+s*.08);g.lineTo(cx+s*.18,cy+s*.3);g.lineTo(cx+s*.2,cy+s*.58);
   g.moveTo(cx-s*.02,cy-s*.3);g.lineTo(cx-s*.3,cy-s*.05);g.moveTo(cx-s*.02,cy-s*.3);g.lineTo(cx+s*.26,cy-s*.12);g.stroke();};
  hand(W/2,H*.27,H*.3,'rgba(120,34,14,.55)');man(W/2,H*.73,H*.3,'#d8f4ff');
  const r=rng(77);for(let i=0;i<400;i++){g.fillStyle='rgba(0,0,0,'+(r()*.35)+')';g.fillRect(r()*W,r()*H,1+r()*3,1+r()*3);}}
 function build({B,scene,parent,quality='medium',quarter=null,road=null}){
  const low=quality==='low',own=[],cs=list(quarter),made={paint:0,posts:0,icons:0,crossings:cs.length};if(!B||!scene||!cs.length)return {stats:()=>made,dispose(){}};
  const Y=.013,pos=[],uv=[],idx=[],quad=(pts,uvs)=>{const k=pos.length/3;for(const p of pts)pos.push(p[0],Y,p[1]);for(const u of uvs)uv.push(u[0],u[1]);idx.push(k,k+1,k+2,k,k+2,k+3);};
  for(const c of cs){const X=c.axis==='x',P=(a,l)=>X?[a,l]:[l,a],[b0,b1]=c.band,l0=c.at-c.w/2,l1=c.at+c.w/2,U=a=>(a-b0)/4;
   quad([P(b0,l0),P(b1,l0),P(b1,l1),P(b0,l1)],[[U(b0),0],[U(b1),0],[U(b1),1],[U(b0),1]]);
   // a stop line across each lane, mapped onto a strip of one worn bar
   for(const s of c.stops){const a0=s.along-STOP_W/2,a1=s.along+STOP_W/2;quad([P(s.from,a0),P(s.to,a0),P(s.to,a1),P(s.from,a1)],[[.075,0],[.075,1],[.175,1],[.175,0]]);}}
  const tex=new B.DynamicTexture('ncz-crosswalk-paint',{width:512,height:low?192:384},scene,true);paint(tex.getContext(),512,low?192:384);tex.update();tex.hasAlpha=true;tex.wrapU=B.Texture.WRAP_ADDRESSMODE;tex.wrapV=B.Texture.CLAMP_ADDRESSMODE;own.push(tex);
  const m=new B.PBRMaterial('ncz-crosswalk',scene);m.albedoTexture=tex;m.useAlphaFromAlbedoTexture=true;m.transparencyMode=2;m.albedoColor=new B.Color3(.6,.61,.6);m.metallic=.05;m.roughness=.4;
  m.emissiveTexture=tex;m.emissiveColor=new B.Color3(.035,.038,.04);m.backFaceCulling=false;m.zOffset=-2;m.maxSimultaneousLights=road?.maxSimultaneousLights||4;
  if(road?.bumpTexture&&!low){const b=road.bumpTexture.clone();b.uScale=b.vScale=1;own.push(b);m.bumpTexture=b;m.bumpTexture.level=.6;}
  own.push(m);
  const mesh=new B.Mesh('ncz-crosswalks',scene),vd=new B.VertexData();vd.positions=pos;vd.indices=idx;vd.uvs=uv;const nrm=[];B.VertexData.ComputeNormals(pos,idx,nrm);for(let i=1;i<nrm.length;i+=3)if(nrm[i]<0){nrm[i-1]*=-1;nrm[i]*=-1;nrm[i+1]*=-1;}vd.normals=nrm;vd.applyToMesh(mesh);
  mesh.material=m;mesh.parent=parent;mesh.isPickable=false;mesh.receiveShadows=false;mesh.alphaIndex=1;own.push(mesh);made.paint=1;
  // Signal posts (not on Low): a dark steel pole on the kerb, a push-button box, and a head facing the far kerb with its icon.
  const posts=cs.flatMap(c=>c.posts.map(p=>({c,...p})));
  if(!low&&posts.length){const parts=[],faces=[],metal=new B.PBRMaterial('ncz-crosswalk-post',scene);metal.albedoColor=new B.Color3(.09,.095,.1);metal.metallic=.75;metal.roughness=.55;own.push(metal);
   const it=new B.DynamicTexture('ncz-crosswalk-icons',{width:128,height:256},scene,true);icons(it.getContext(),128,256);it.update();own.push(it);
   const im=new B.StandardMaterial('ncz-crosswalk-icon',scene);im.diffuseColor=B.Color3.Black();im.emissiveTexture=it;im.disableLighting=true;im.emissiveColor=B.Color3.Black();   // emissiveColor adds to the texture (it would wash the icon out to a white block)own.push(im);
   const box=(w,h,d,x,y,z)=>{const b=B.MeshBuilder.CreateBox('xw-post',{width:w,height:h,depth:d},scene);b.position.set(x,y,z);parts.push(b);};
   for(const p of posts){const X=p.c.axis==='x',[x,z]=p.p,top=.18;   // the pavement's top
    box(.1,2.75,.1,x,top+1.375,z);box(X?.14:.16,.26,X?.16:.14,x,top+1.05,z);   // pole, push-button box
    const hx=x+(X?p.face*.11:0),hz=z+(X?0:p.face*.11);box(X?.2:.3,.56,X?.3:.2,hx,top+2.55,hz);box(X?.12:.32,.04,X?.32:.12,hx+(X?p.face*.06:0),top+2.86,hz+(X?0:p.face*.06));   // head and its visor
    const f=B.MeshBuilder.CreatePlane('xw-icon',{width:.22,height:.44},scene);f.position.set(hx+(X?p.face*.101:0),top+2.55,hz+(X?0:p.face*.101));f.rotation.y=X?(p.face>0?-Math.PI/2:Math.PI/2):(p.face>0?Math.PI:0);faces.push(f);}
   const pm=B.Mesh.MergeMeshes(parts,true,true,undefined,false,false),fm=B.Mesh.MergeMeshes(faces,true,true,undefined,false,false);
   for(const [mm,mat] of [[pm,metal],[fm,im]])if(mm){mm.material=mat;mm.parent=parent;mm.isPickable=false;mm.receiveShadows=false;own.push(mm);}made.posts=pm?1:0;made.icons=fm?1:0;made.signals=posts.length;}
  // the glow layer only needs the lit icons: the paint and the posts are left out of its pass (two draw calls fewer)
  for(const glow of (scene.effectLayers||[]).filter(l=>l.addExcludedMesh&&/glow/i.test(l.getClassName?.()||'')))for(const o of own)if(o.getTotalVertices&&o.material?.name!=='ncz-crosswalk-icon')glow.addExcludedMesh(o);
  return {stats:()=>({...made,meshes:own.filter(o=>o.getTotalVertices).length}),dispose(){for(const o of own.reverse())try{o.dispose();}catch{}own.length=0;}};}
 const api={ROADS,DATA,list,get,at,inside,sideOf,crossing,clearToCross,mark,peds,yieldTo,skipMark,build,STEP_ON};
 if(node)module.exports=api;else root.VoidCrosswalks=api;
})(typeof globalThis!=='undefined'?globalThis:this);
