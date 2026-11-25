/* MISSION APARTMENTS: game wiring (browser only). apartments.js has the data and rules, apartment-build.js the two interiors. docs/development/APARTMENTS.md.
   - The STREET DOORS: drawn in every street quarter (one batch per part: thin instances, so a quarter's doors cost about a dozen draw calls), each with its house number,
     a frame light and an ACCESS POINT beside it. They are automatic sliding doors (the owner, 19 Nov 2026): they slide into the wall when someone allowed comes near and
     back about 1.5 s after. A door is LOCKED for the player unless one of their missions has an apartment instance on it now (or a hack opened it); then the frame light is
     amber, it opens as they come close, and walking in (or E: ENTER) takes them into the hallway of that apartment's style. A few street people come out of and go into
     these doors now and then (Medium and High; their own door opens for them).
   - The HALLWAY: the open door is the mission's (amber), every other door is locked (red). Its street door goes back out to the same street door.
   - The APARTMENT: everything in it can be used (computer, utility panel, safe, vending machine, closet, lights); each use is reported to the mission engine
     (live-content.js aptUse: "Use something in apartment X" steps). Leaving goes back to the hallway, in front of the same door.
   - ACCESS POINTS: E shows "ACCESS POINT · SECURED", or runs a hack when a "Hack the access point" step is in progress (a progress bar over a scrolling screen; the
     seconds the owner set; cancelled when the player walks away if he chose so; "You need a hacking device." when the step needs one the player does not carry).
     The progress bar is deliberately a stand-in: a real minigame replaces run() later.
   Private: nobody else sees the player inside (remote-players.js: a private location has no shared room). Nothing is saved. */
(function(root){
 'use strict';
 const A=root.VoidApartments;if(!A||!A.doors||typeof document==='undefined')return;
 const N=()=>root.VoidNeoChinatown,LC=()=>root.VoidLiveContent;
 const base=document.currentScript?new URL('.',document.currentScript.src):null,url=p=>base?new URL(p,base).href:p;
 const STREET_KEY=()=>root.VoidDistrictArea?.KEY?.street||'sacramento';
 // ---- what is open for this player now ----
 let preview=null;   // the Mission Editor's "JUMP INSIDE" (a throwaway test session): {style, door, number, key, items}
 function open(){let list=[];try{list=LC()?.apartments?.()||[];}catch{}if(preview&&!list.some(a=>a.key===preview.key))list=[...list,preview];return A.mergeResidenceInstances(list,A.residenceInstances(LC()?.env?.characters));}
 function hacked(){try{return LC()?.hackedDoors?.()||[];}catch{return [];}}
 const onDoor=id=>open().filter(a=>a.door===id);
 const playerState=()=>typeof state==='undefined'?null:state;
 const deviceModel=()=>root.VoidDeviceV1?.restore?.(playerState()?.story?.flags)?.model||'v1';
 const ruleAllows=(rule,door,slot)=>A.accessAllows(rule,playerState(),A.accessKey(door,slot),deviceModel());
 const allowed=id=>{const list=onDoor(id);return list.some(a=>a.mission||a.modular||!a.streetAccess||ruleAllows(a.streetAccess,id))||hacked().some(h=>h.door===id);};
 const roomLocked=a=>a.residenceSlot!=null?!ruleAllows(a.apartmentAccess,a.door,a.residenceSlot):!!a.locked;
 const accessHint=a=>!a?'A keypad and an intercom; nobody answers.':a.mode==='item'?'Requires '+(root.VoidProgression?.personalItems?.[a.value]?.name||a.value)+'.':a.mode==='device'?'Requires '+a.value.toUpperCase()+'.':a.mode==='hack'?'Use the access point with a hacking device.':a.mode==='mission'?'Authorization required.':'Access denied.';
 /* Street doors IN USE for this player (the owner, 20 Nov 2026: "doors on the streets without anything placed on them shouldn't show the option to open it when walking by"):
    only these show their prompts (the door and its access point; apartments.js doorsInUse: a taken mission's apartment or location on it, from-step reached or not, a hack
    step aimed at it) or one a hack opened, or the Mission Editor's test apartment. Every other street door shows nothing: the door itself is still drawn, locked. */
 function inUse(){const u=new Set();try{for(const id of LC()?.doorsInUse?.()||[])u.add(id);}catch{}for(const a of open())u.add(a.door);for(const h of hacked())u.add(h.door);for(const c of root.VoidConsumableGame?.data?.keycards||[])for(const id of c.doors||[])if(!id.includes('/'))u.add(id);return u;}
 let visit=null;   // {door (street door record), list (instances on it), inst (the one inside), slots}
 const here=()=>{try{return typeof walkingLocation!=='undefined'&&walkingLocation?.apartment?walkingLocation:null;}catch{return null;}};
 // ---- the locations ----
 for(const st of A.STYLE_IDS)for(const part of ['hall','flat'])VoidExplorationData.locations[A.keyOf(part,st)]=A.layout(part,st);
 const note=t=>{try{resumeWalking();}catch{}try{announce(t);}catch{}};
 let busy=false;const screenOff=new Set(),screenSet=new Set(),lightOff=new Set(),lightSet=new Set();   // ad screens switched off, per apartment instance, for this session
 const DW=()=>Math.round(((A.DOOR&&A.DOOR.wait)||.62)*1000);   // the shared door timing (apartments.js DOOR): the door is open before the fade
 // every pass through a door: a short black fade over the game's silent load (no "Preparing" card), the doorway showing the next place first (door-views.js)
 async function go(key,opts){if(busy)return;busy=true;try{const V=root.VoidDoorViews;if(V&&V.pass)await V.pass(()=>enterWalking(key,{...(opts||{}),silent:true}));else await enterWalking(key,opts);}finally{busy=false;}}
 async function enterHall(door,list,at){list=(list||[]).filter(a=>!a.modular);const style=(list[0]&&list[0].style)||door.style,slots=A.slotsFor(list,style);visit={door,list,inst:null,slots};
  const def=A.layout('hall',style);def.open=list.map(a=>({slot:slots[a.key],number:a.number,key:a.key,locked:roomLocked(a),id:a.id,mission:a.mission}));def.street=door.id;
  const GH=A.geo(style);for(const sl of GH.HALL.slots){const o=def.open.find(x=>x.slot===sl.i),w=A.world([sl.x-.75,1.4,sl.z>0?(GH.container?.55:.62):(GH.container?-.55:-.62)]);def.interactions.push({id:'hall-ap-'+sl.i,label:'ACCESS POINT',position:w,action:'apt-ap',ap:o?o.id+'/hall':'hall-slot-'+sl.i,mission:o?o.mission:null,range:1.0});}
  if(at&&Array.isArray(at.spawn)){def.spawn=at.spawn.slice();def.yaw=at.yaw;}   // at: where he comes out (in front of the apartment's door), so the fade lifts on the right view
  VoidExplorationData.locations[A.keyOf('hall',style)]=def;await go(A.keyOf('hall',style));}
 async function enterFlat(inst){const def=A.layout('flat',inst.style,{items:inst.items});def.inst=inst.key;def.items=inst.items;def.residents=inst.residents||[];if(inst.mission)def.apt={mission:inst.mission,id:inst.id};def.door=inst.door;def.screenOff=screenSet.has(inst.key)?screenOff.has(inst.key):inst.screenOff===true;def.lightsOff=lightSet.has(inst.key)?lightOff.has(inst.key):inst.lightsOff===true;if(inst.mission)def.interactions.push({id:'apt-ap',label:'ACCESS POINT',position:(()=>{const ap=A.geo(inst.style).AP;return A.world([ap.x,1.4,ap.z+.45]);})(),action:'apt-ap',ap:inst.id+'/entry',mission:inst.mission,range:1.0});VoidExplorationData.locations[A.keyOf('flat',inst.style)]=def;visit={...(visit||{}),inst};await go(A.keyOf('flat',inst.style));}
 async function backToHall(){const v=visit;if(!v||!v.door){return backToStreet();}const slot=v.inst?v.slots?.[v.inst.key]:0;const style=(v.list[0]&&v.list[0].style)||v.door.style;await enterHall(v.door,v.list.length?v.list:[],A.hallFront(slot||0,style));}
 // at: {spawn, yaw} to come out somewhere else than the street door (the hallway's window: the foot of the building's fire escape, ncz-backalleys-integration.js)
 async function backToStreet(at){const d=visit?.door;visit=null;if(!d){await go(STREET_KEY(),{});return;}if(at&&Array.isArray(at.spawn)){await go(STREET_KEY(),{quarter:at.quarter||d.quarter,spawn:at.spawn.slice(),yaw:at.yaw});return;}const yaw=Math.atan2(-d.n[0],-d.n[1]);await go(STREET_KEY(),{quarter:d.quarter,spawn:[d.front[0],1.7,d.front[1]],yaw});}
 // ---- street doors: the layout's prompts (two per door: the door, its access point) ----
 const apPos=d=>{const t=d.n[0]?[0,1]:[1,0];return [d.x+t[0]*.85-d.n[0]*(.12+(d.reach||0)),d.z+t[1]*.85-d.n[1]*(.12+(d.reach||0))];};
 function streetPrompts(q){const used=inUse();return A.doorsIn(q).flatMap(d=>{const ap=apPos(d);return [{id:'aptdoor-'+d.id,label:d.name.toUpperCase()+' · LOCKED',position:[d.x-d.n[0]*(.55+(d.reach||0)),1.7,d.z-d.n[1]*(.55+(d.reach||0))],action:'apt-door',door:d.id,range:1.6},
  {id:'aptap-'+d.id,label:'ACCESS POINT',position:[ap[0]-d.n[0]*.3,1.5,ap[1]-d.n[1]*.3],action:'apt-ap',ap:d.id,range:1.1}].map(it=>({...it,hidden:!used.has(d.id)}));});}
 {const NC=N();if(NC&&NC.layout&&!NC.layout.apartments){const orig=NC.layout;NC.layout=function(area,quarter){const l=orig.apply(this,arguments);if(area==='street'&&l&&l.quarter)l.interactions=[...l.interactions,...streetPrompts(l.quarter)];return l;};NC.layout.apartments=true;}}
 // the labels follow the player's missions (twice a second)
 setInterval(()=>{try{const wl=typeof walkingLocation!=='undefined'?walkingLocation:null;if(!wl)return;
   if(wl.area==='street'&&wl.id==='neochinatown'){const used=inUse();for(const it of wl.interactions){if(it.action==='apt-door'){const d=A.door(it.door);if(!d)continue;it.label=allowed(d.id)?'ENTER · '+d.name.toUpperCase():d.name.toUpperCase()+' · LOCKED';it.hidden=!used.has(d.id)&&!root.VoidConsumableGame?.data?.keycards?.some(c=>c.discoverable===false);}
    else if(it.action==='apt-ap'&&/^aptap-/.test(it.id||''))it.hidden=!used.has(it.ap);}}
   else if(wl.apartment&&wl.part==='hall'){const op=new Map((wl.open||[]).map(o=>[o.slot,o]));for(const o of op.values()){const a=(visit?.list||[]).find(x=>x.key===o.key);if(a?.residenceSlot!=null){o.locked=roomLocked(a);root.VoidBabylon?.zone?.doors?.find(d=>d.slot===o.slot)?.set?.({locked:o.locked});}}for(const it of wl.interactions)if(it.action==='apt-hall-door'){const o=op.get(it.slot),num=o&&o.number||A.slotNumber(it.slot,wl.style);it.label=o?(o.locked?'APARTMENT '+num+' · LOCKED (ACCESS POINT)':'ENTER APARTMENT '+num):'APARTMENT '+num+' · LOCKED';}}
   else if(wl.apartment&&wl.part==='flat'){for(const it of wl.interactions){if(it.object==='lights')it.label='LIGHTS · '+(root.VoidBabylon?.zone?.lightsOn===false?'ON':'OFF');if(it.object==='screen')it.label='TURN SCREEN '+(root.VoidBabylon?.zone?.interactive?.screen?.open===false?'ON':'OFF');}}}catch{}},500);
 // ---- the street doors in 3D (thin instances), their lights and the people who use them ----
 function streetDoors({scene,parent,quality,quarter,instance}){
  const B=root.BABYLON,list=A.doorsIn(quarter);if(!list.length||!B)return null;const own=[],low=quality==='low';
  const tex=f=>{const t=new B.Texture(url('assets/textures/'+f),scene,false,true);t.wrapU=t.wrapV=B.Texture.WRAP_ADDRESSMODE;own.push(t);return t;};
  const P=(n,c,o={})=>{const m=new B.PBRMaterial('aptst-'+n,scene);m.albedoColor=B.Color3.FromHexString(c);m.roughness=o.r??.6;m.metallic=o.m??.4;m.usePhysicalLightFalloff=false;if(o.t)m.albedoTexture=tex(o.t);if(o.nrm&&!low)m.bumpTexture=tex(o.nrm);m.maxSimultaneousLights=8;own.push(m);return m;};
  const G=(n,c,k=1)=>{const m=new B.StandardMaterial('aptst-'+n,scene);m.disableLighting=true;m.emissiveColor=B.Color3.FromHexString(c).scale(k);m.diffuseColor=B.Color3.Black();m.specularColor=B.Color3.Black();own.push(m);return m;};
  const slabMat={office:P('slab-o','#1a2026',{t:'district-interior/kit_glass_color.jpg',r:.12,m:.6}),commercial:P('slab-c','#4a4c4e',{t:'district-interior/kit_metal_color.jpg',nrm:'district-interior/kit_metal_normal.jpg',r:.5,m:.75}),rundown:P('slab-r','#6a5e52',{t:'ncz/metal-leaks-color.jpg',nrm:'ncz/metal-leaks-normal.jpg',r:.55,m:.6}),normal:P('slab-n','#434951',{t:'district-interior/kit_gunmetal_color.jpg',r:.45,m:.7}),luxury:P('slab-l','#2a211a',{r:.35,m:.2})};
  const frame=P('frame','#2a2c30',{r:.5,m:.7}),surround=P('surround','#4a4c50',{t:'ncz/concrete-old-color.jpg',nrm:'ncz/concrete-old-normal.jpg',r:.9,m:0}),dark=G('recess','#030304'),panel=P('ap','#1d2024',{r:.4,m:.8}),screen=G('ap-screen','#2a8fb0',1.0);
  const lamp={locked:G('red','#ff2a2a',1.1),mine:G('amber','#ffb347',1.1),open:G('green','#39ff9c',1.1)};
  const unit=(name,mat,w,h,d)=>{const m=B.MeshBuilder.CreateBox('aptst-'+name,{width:w,height:h,depth:d},scene);m.material=mat;m.parent=parent;m.isPickable=false;m.alwaysSelectAsActiveMesh=true;own.push(m);return m;};
  const SLAB={rundown:'rundown',normal:'normal',luxury:'luxury','container-rundown':'rundown','container-regular':'normal',office:'office',commercial:'commercial'};
  const M=B.Matrix,Q=B.Quaternion,V=B.Vector3;const mat=(x,y,z,ry,s=[1,1,1])=>M.Compose(new V(...s),Q.RotationYawPitchRoll(ry,0,0),new V(x,y,z));
  const slab={rundown:unit('slab-r',slabMat.rundown,1,2.15,.05),normal:unit('slab-n',slabMat.normal,1,2.15,.05),luxury:unit('slab-l',slabMat.luxury,1,2.15,.05),office:unit('slab-o',slabMat.office,1,2.15,.05),commercial:unit('slab-c',slabMat.commercial,1,2.15,.05)},lampM={locked:unit('lamp-red',lamp.locked,.7,.035,.03),mine:unit('lamp-amber',lamp.mine,.7,.035,.03),open:unit('lamp-green',lamp.open,.7,.035,.03)};
  // behind each door, the place it leads to (door-views.js): its hallway, or the first room of a module location placed on it now
  const DV=root.VoidDoorViews,viewCache=DV?DV.cache(B,scene,own):null,views={};
  const viewKey=d=>{if(!DV)return 'dark';try{const loc=open().find(a=>a.door===d.id&&a.modular&&a.loc);if(loc){const MM=root.VoidModules,e=MM.parseRef(loc.loc.entry),m=e&&(loc.loc.modules||[]).find(x=>x.id===e.mod),t=m&&MM.TYPES[m.type];if(t&&t.legacy)return DV.housing('hall',t.legacy.style);if(t)return DV.mod(t.style);}
   const inst=open().find(a=>a.door===d.id);if(d.family==='office')return DV.mod('corp');if(d.family==='commercial')return DV.mod('back');return DV.housing('hall',(inst&&inst.style)||d.style);}catch{return DV.housing('hall',d.style);}};
  const jamb=unit('jamb',frame,.09,2.27,.16),head=unit('head',frame,1.18,.1,.16),fill=unit('fill',surround,.16,3.1,.1),over=unit('over',surround,1.5,.86,.1),rec=unit('recess',dark,1.05,2.2,.02),apBox=unit('ap',panel,.2,.32,.05),apScr=unit('ap-scr',screen,.13,.09,.01);
  // number plates: one atlas, one merged mesh
  const nt=new B.DynamicTexture('aptst-numbers',{width:2048,height:64},scene,true);own.push(nt);const g=nt.getContext(),cw=2048/Math.max(1,list.length);g.fillStyle='#0d0d0f';g.fillRect(0,0,2048,64);g.fillStyle='#e7e1d4';g.font='bold 52px monospace';g.textAlign='center';g.textBaseline='middle';list.forEach((d,i)=>g.fillText(String(d.number),i*cw+cw/2,34));nt.update();
  const nm=new B.StandardMaterial('aptst-num',scene);nm.diffuseTexture=nt;nm.emissiveTexture=nt;nm.emissiveColor=new B.Color3(.55,.55,.55);nm.disableLighting=true;own.push(nm);const plates=[];
  const doors=[],light={};
  list.forEach((d,i)=>{const ry=d.ry,n=d.n,t=n[0]?[0,1]:[1,0],P0=(a,b,c)=>[d.x+t[0]*a-n[0]*c,b,d.z+t[1]*a-n[1]*c];   // a: along the wall, b: height, c: out into the street
   const add=(mesh,a,b,c,s)=>{const p=P0(a,b,c);return mesh.thinInstanceAdd(mat(p[0],p[1],p[2],ry,s),false);};
   add(jamb,-.545,1.135,.11);add(jamb,.545,1.135,.11);add(head,0,2.3,.11);if(d.family!=='container'&&d.family!=='office'&&d.family!=='commercial'){add(fill,-.67,1.55,.05);add(fill,.67,1.55,.05);add(over,0,2.78,.05);}   // a container door is cut into the steel: no shopfront filleradd(rec,0,1.1,.035);
   const ai=add(apBox,.85,1.35,.12),si=add(apScr,.85,1.42,.15);
   const li={};for(const k of Object.keys(lampM))li[k]=add(lampM[k],0,2.37,.2,[1,1,1]);
   {const k=viewKey(d);if(!views[k]){const m=B.MeshBuilder.CreatePlane('aptst-view-'+k,{width:1.05,height:2.2},scene);m.material=viewCache?viewCache.get(k):dark;m.parent=parent;m.isPickable=false;m.alwaysSelectAsActiveMesh=true;own.push(m);views[k]=m;}add(views[k],0,1.1,.03);}   // the place behind the door, seen as it slides open (door-views.js)
   const sk=SLAB[d.style]||'normal',si2=add(slab[sk],0,1.075,.08);const ld={};for(const k of Object.keys(lampM))ld[k]=add(lampM[k],.85,1.25,.15,[.08,1,1]);   // the access point's LED
   const pl=B.MeshBuilder.CreatePlane('aptst-plate',{width:.44,height:.15,frontUVs:new B.Vector4(i/list.length,0,(i+1)/list.length,1),backUVs:new B.Vector4(i/list.length,0,(i+1)/list.length,1),sideOrientation:B.Mesh.DOUBLESIDE},scene);
   const pp=P0(-.85,1.62,.11);pl.position.set(pp[0],pp[1],pp[2]);pl.rotation.y=ry;plates.push(pl);
   const s=A.slider({mesh:{position:new V(0,0,0)},dir:[t[0],t[1]],dist:1.02,locked:true});s.door=d;s.slab=si2;s.style=sk;s.lamps=li;s.leds=ld;s.P0=P0;doors.push(s);});
  const plateMesh=B.Mesh.MergeMeshes(plates,true,true);if(plateMesh){plateMesh.material=nm;plateMesh.parent=parent;plateMesh.isPickable=false;own.push(plateMesh);}
  for(const m of [jamb,head,fill,over,rec,apBox,apScr,...Object.values(slab),...Object.values(lampM),...Object.values(views)]){m.thinInstanceRefreshBoundingInfo?.(false);m.freezeWorldMatrix();}
  const hide=[0,0,0];
  function show(s,state){for(const k of Object.keys(lampM)){const p=s.P0(0,2.37,.2);lampM[k].thinInstanceSetMatrixAt(s.lamps[k],mat(p[0],p[1],p[2],s.door.ry,k===state?[1,1,1]:hide),false);const q=s.P0(.85,1.25,.15);lampM[k].thinInstanceSetMatrixAt(s.leds[k],mat(q[0],q[1],q[2],s.door.ry,k===(state==='open'?'open':state)?[.08,1,1]:hide),false);}dirty=true;}
  let dirty=true,clock=0,check=0;
  // the people who live here: a few figures walk out of one door and into another (Medium: 2, High: 4; none on Low)
  const residents=[],R=root.VoidCrowd,count=low||!instance||!R?0:quality==='high'||quality==='ultra'?4:2;let rs=quarter.length*7919;const rnd=()=>((rs=rs*16807%2147483647)-1)/2147483646;
  const pairs=[];for(const a of list)for(const b of list)if(a!==b&&a.street===b.street&&a.side===b.side){const k=Math.hypot(a.x-b.x,a.z-b.z);if(k>6&&k<40)pairs.push([a,b]);}
  for(let i=0;i<count&&pairs.length;i++)residents.push({id:'resident-'+quarter+'-'+i,wait:3+rnd()*15,node:null,anim:null,phase:'away'});
  const doorOf=new Map(doors.map(s=>[s.door.id,s]));
  function resTick(r,dt){if(r.phase==='away'){r.wait-=dt;if(r.wait>0)return;const [a,b]=pairs[Math.floor(rnd()*pairs.length)];r.from=a;r.to=b;
    if(!r.node){const looks=R.orderAt?.(a.x,a.z,quarter,r.id)||[];for(const l of looks){const nd=instance('crowd:'+l,parent);if(nd){r.node=nd;R.dress?.(nd,l,r.id);r.anim=R.animate?.(nd,l,'walk');break;}}if(!r.node){r.wait=5;return;}}
    r.path=[[a.x+a.n[0]*.25,a.z+a.n[1]*.25],[a.front[0],a.front[1]],[b.front[0],b.front[1]],[b.x+b.n[0]*.25,b.z+b.n[1]*.25]];r.leg=0;r.k=0;r.phase='walk';r.node.position.set(r.path[0][0],0,r.path[0][1]);r.node.setEnabled(true);r.anim?.play?.('walk');return;}
   const [p,q]=[r.path[r.leg],r.path[r.leg+1]],L=Math.hypot(q[0]-p[0],q[1]-p[1])||.01;r.k+=dt*1.3/L;const x=p[0]+(q[0]-p[0])*Math.min(1,r.k),z=p[1]+(q[1]-p[1])*Math.min(1,r.k);r.node.position.set(x,0,z);r.node.rotation.y=Math.atan2(q[0]-p[0],q[1]-p[1]);
   for(const id of [r.from.id,r.to.id]){const s=doorOf.get(id),dd=Math.hypot(s.door.x-x,s.door.z-z);if(dd<2.2)s.nearNpc=clock;}
   if(r.k>=1){r.leg++;r.k=0;if(r.leg>=r.path.length-1){r.phase='away';r.wait=12+rnd()*30;r.node.setEnabled(false);}}}
  function tick(dt){clock+=dt;const p=typeof walker!=='undefined'?walker:null;check-=dt;
   if(check<=0){check=.5;const mine=new Set([...open().map(a=>a.door),...hacked().map(h=>h.door)].filter(allowed));for(const s of doors){const ok=mine.has(s.door.id);s.locked=!ok&&!(clock-(s.nearNpc??-9)<1.6);s.mine=ok;}}
   for(const r of residents)try{resTick(r,dt);}catch{}
   for(const s of doors){const npc=clock-(s.nearNpc??-9)<1.6;if(npc)s.locked=false;let near=npc;if(p&&s.mine){const dx=s.door.x-p.x,dz=s.door.z-p.z;near=near||dx*dx+dz*dz<3.2+(s.door.reach||0)*2.6;}s.near(near);const t0=s.t;s.tick(dt);
    const state=s.t>.02?'open':s.mine?'mine':'locked';if(state!==s.shown){s.shown=state;show(s,state);}
    if(s.t!==t0){const k=s.t<.5?2*s.t*s.t:1-Math.pow(-2*s.t+2,2)/2,q=s.P0(k*1.02,1.075,.08);slab[s.style].thinInstanceSetMatrixAt(s.slab,mat(q[0],q[1],q[2],s.door.ry),false);dirty=true;}
    // walking into an open door takes the player in
    if(p&&s.mine&&s.t>.9&&mode==='walking'&&!busy){const dx=s.door.x-p.x,dz=s.door.z-p.z,rr=.6+(s.door.reach||0);if(dx*dx+dz*dz<rr*rr)enterDoor(s.door.id);}}
   if(dirty){dirty=false;for(const m of [...Object.values(slab),...Object.values(lampM)])m.thinInstanceBufferUpdated('matrix');}}
  for(const s of doors){s.shown='locked';show(s,'locked');}
  return {tick,doors,draws:()=>12,dispose(){for(const r of residents)r.node?.dispose?.(false,false);for(const x of own)try{x.dispose();}catch{}},forceOpen(id){const s=doorOf.get(id);if(s){s.locked=false;s.force(1);}},residents};}
 {const NC=N();if(NC&&NC.build&&!NC.build.apartments){const orig=NC.build;NC.build=function(args){const h=orig.apply(this,arguments);try{if(args&&args.area==='street'&&h&&h.quarter){const sd=streetDoors({...args,quarter:h.quarter});if(sd){h.aptDoors=sd;const t=h.tick,d=h.dispose;let last=null;
   h.tick=function(time){const r=t.apply(this,arguments);const dt=last===null?0:Math.min(.1,Math.max(0,time-last));last=time;try{sd.tick(dt);}catch(e){console.warn('[apartments]',e);}return r;};h.dispose=function(){try{sd.dispose();}catch{}return d.apply(this,arguments);};}}}catch(e){console.warn('[apartments] street doors',e);}return h;};NC.build.apartments=true;}}
 // ---- going in and out ----
 async function presentCard(door){
  const shop=root.VoidConsumableGame,uid=root.VoidAccount?.user?.uid;
  if(!uid||!shop)return false;
  try{
   const held=shop.data||await shop.refresh();
   if(!held?.keycards?.some(c=>c.discoverable===false||c.doors?.includes(door)))return false;
   const result=await shop.request('keycards/access',{door});
   return uid===root.VoidAccount?.user?.uid&&result.allowed===true;
  }catch{return false;}
 }
 async function enterDoor(id){const d=A.door(id);if(!d||busy)return;const list=onDoor(id),scene=walkingLocation;if(!allowed(id)&&!await presentCard(id)){note(d.name.toUpperCase()+': locked. '+accessHint(list.find(a=>a.streetAccess)?.streetAccess));return;}
  if(busy||walkingLocation!==scene)return;
  let was=1;try{const h=root.VoidBabylon?.district?.aptDoors;was=h?.doors?.find(s=>s.door.id===id)?.t??0;h?.forceOpen(id);}catch{}if(was<.9)await new Promise(r=>setTimeout(r,DW()));
  const loc=list.find(a=>a.modular);if(loc&&root.VoidModules?.enter){await root.VoidModules.enter(d,loc);return;}   // a location built from modules (modules.js, module-integration.js)
  await enterHall(d,list);}
 // ---- the hack (a stand-in for a later minigame): a progress bar over a scrolling screen ----
 let hacking=null;
 const css=document.createElement('style');css.textContent='#apt-hack{position:fixed;left:50%;bottom:16vh;transform:translateX(-50%);z-index:55;width:min(440px,86vw);padding:12px 16px;background:rgba(4,10,12,.86);border:1px solid #39ff9c;border-radius:8px;font:12px/1.4 ui-monospace,Consolas,monospace;color:#9af5c8;pointer-events:none}#apt-hack[hidden]{display:none}#apt-hack pre{margin:0 0 8px;height:72px;overflow:hidden;color:#59ff8a;opacity:.85}#apt-hack .bar{height:8px;background:#0c2a1c;border-radius:4px;overflow:hidden}#apt-hack .bar i{display:block;height:100%;width:0;background:#39ff9c}#apt-hack b{color:#e8fff3;letter-spacing:.12em}';document.head.append(css);
 const hud=document.createElement('div');hud.id='apt-hack';hud.hidden=true;hud.setAttribute('role','status');hud.innerHTML='<b>HACKING ACCESS POINT</b><pre></pre><div class="bar"><i></i></div>';document.body.append(hud);
 function run(job,pos){hacking={job,pos,t:0};hud.hidden=false;const pre=hud.querySelector('pre'),bar=hud.querySelector('i'),lines=[];let last=0;
  const id=setInterval(()=>{if(!hacking){clearInterval(id);return;}const now=performance.now();if(!last)last=now;const dt=Math.min(.25,(now-last)/1000);last=now;if(typeof mode!=='undefined'&&mode==='pause')return;hacking.t+=dt;
   lines.push(Array.from({length:6},()=>Math.floor(Math.random()*65536).toString(16).padStart(4,'0')).join(' ')+(Math.random()<.2?'  >> handshake':''));if(lines.length>5)lines.shift();pre.textContent=lines.join('\n');bar.style.width=Math.min(100,hacking.t/job.hold*100)+'%';
   if(job.stay&&typeof walker!=='undefined'&&walker&&Math.hypot(walker.x-pos[0],walker.z-pos[2])>1.8){end(false,'Connection lost: you walked away from the access point. Go back and press E at it to try again.');return;}
   if(hacking.t>=job.hold)end(true);},80);}
 function end(ok,why){const job=hacking&&hacking.job;hacking=null;hud.hidden=true;if(!job)return;if(!ok){try{announce(why||'Hack cancelled.');}catch{}return;}
  if(job.residenceKey){const f=playerState()?.story?.flags;if(f){f[job.residenceKey]=true;try{save();}catch{}}try{announce('ACCESS POINT: bypassed. The door is open to you.');}catch{}return;}
  let r=null;try{r=LC()?.hack?.(job);}catch{}
  try{const wl=here(),z=root.VoidBabylon?.zone;if(wl&&wl.part==='hall'&&job.unlock)for(const o of wl.open||[])if(o.id+'/hall'===job.ap&&o.mission===job.mission){o.locked=false;z?.doors?.find(d=>d.slot===o.slot)?.set?.({locked:false});}
   z?.accessPoint?.(job.ap,'open');}catch{}try{announce('ACCESS POINT: bypassed.'+(job.unlock?' The door is open to you.':''));}catch{}}
 function useAP(item){const ap=item.ap;const wl=here(),mission=wl&&wl.apt?wl.apt.mission:item.mission||null;let jobs=[];try{jobs=LC()?.hacks?.()||[];}catch{}
  let job=jobs.find(j=>j.ap===ap&&(!/\//.test(ap)||!mission||j.mission===mission));if(!job){const room=wl?.part==='hall'?(visit?.list||[]).find(a=>ap===a.id+'/hall'&&a.residenceSlot!=null):null,home=room||(!wl?onDoor(ap).find(a=>a.streetAccess):null),rule=room?.apartmentAccess||home?.streetAccess;if(home&&rule?.mode==='hack'&&!ruleAllows(rule,home.door,room?.residenceSlot))job={residenceKey:A.accessKey(home.door,room?.residenceSlot),needs:'hacking-device',hold:4,stay:true,unlock:true};}if(!job){// already bypassed in a mission in progress (Awakening QA 20 Nov 2026: E at No. 31's panel after the hack said SECURED)
   const by=(()=>{try{const recs=state.universe.missions||{};return (LC()?.env?.trees||[]).some(t=>(t.missions||[]).some(m=>{const r=recs[m.id];return r&&r.acquired&&!r.completed&&(m.objectives||[]).some(o=>o.kind==='hack'&&o.ap===ap&&(r.objectives||{})[o.id]===true);}));}catch{return false;}})();
   note(by?'ACCESS POINT · BYPASSED. The door is open to you.':'ACCESS POINT · SECURED. A card reader, a keypad and a small status screen.');return;}
  if(job.needs){const has=(state?.progression?.personal?.items||[]).includes(job.needs);if(!has){const nm=(root.VoidProgression?.personalItems?.[job.needs]?.name||job.needs).toLowerCase();note('You need a'+(/^[aeiou]/.test(nm)?'n ':' ')+nm+'.');return;}}
  if(hacking){note('Already connected.');return;}try{resumeWalking();}catch{}run(job,item.position);}
 // ---- interactions ----
 const wait=setInterval(()=>{if(typeof VoidInteractions==='undefined'||!VoidInteractions.register||typeof announce==='undefined')return;clearInterval(wait);start();},300);
 function start(){const R=(a,f)=>VoidInteractions.register(a,f);
  R('apt-door',({item})=>{try{resumeWalking();}catch{}enterDoor(item.door);});
  R('apt-ap',({item})=>useAP(item));
  R('apt-hall-exit',()=>{try{resumeWalking();}catch{}backToStreet();});
  R('apt-hall-door',async({item})=>{
   const wl=here(),v=visit;if(!wl||!v?.door)return;
   const o=(wl.open||[]).find(x=>x.slot===item.slot);
   const home=o&&v.list.find(x=>x.key===o.key&&x.residenceSlot!=null);
   const target=A.residenceKey(v.door.id,item.slot);
   const number=A.slotNumber(item.slot,wl.style);
   if((!o||(home?roomLocked(home):o.locked))&&!await presentCard(target)){
    note('APARTMENT '+number+': locked. '+(home?accessHint(home.apartmentAccess):''));return;
   }
   if(here()!==wl||visit!==v||busy)return;
   const inst=o?(v.list.find(a=>a.key===o.key)||open().find(a=>a.key===o.key)):
    {key:target,id:'residence-'+item.slot,door:v.door.id,style:wl.style,residenceSlot:item.slot,number,items:[],residents:[]};
   if(!inst){note('Locked.');return;}
   v.slots[inst.key]=item.slot;
   try{resumeWalking();}catch{}const z=root.VoidBabylon?.zone;const d=z?.doors?.find(x=>x.slot===item.slot);d?.force?.(1);setTimeout(()=>enterFlat(inst),(d?.t??0)>.9?0:DW());});
  R('apt-exit',()=>{try{resumeWalking();}catch{}const z=root.VoidBabylon?.zone;const d=z?.doors?.find(x=>x.id==='entry');d?.force?.(1);setTimeout(()=>backToHall(),(d?.t??0)>.9?0:DW());});
  R('apt-item',({item})=>{const wl=here(),it=(wl?.items||[])[item.index];note(it?(it.type==='mission-item'?'MISSION ITEM: ':it.type==='loot'?'LOOT: ':it.type==='note'?'NOTE: ':'')+it.label+' (placed for this mission; picking things up comes later).':'Nothing here.');});
  const TEXT={
   computer:{rundown:'COMPUTER: a cracked screen on a bootleg OS. Borrowed signal, an empty wallet, a mail client that has not synced in weeks.',normal:'COMPUTER: HomeOS asks for a passcode. Three unread messages, rent due in four days.',luxury:'COMPUTER: a secure home node, locked behind a biometric reader. The concierge service is online.'},
   safe:{rundown:'SAFE: a cheap floor safe, bolted down. Locked.',normal:'SAFE: a keypad safe. Locked.',luxury:'SAFE: a heavy biometric safe. Locked.'},
   closet:{rundown:'CLOSET: worn jackets, a box of cables, boots by the door.',normal:'CLOSET: work clothes, a rain shell, storage boxes on the shelf.',luxury:'CLOSET: tailored coats, a shoe rack, boxes with designer labels.'},
   panel:'UTILITY PANEL: breakers, a junction block and a data port. Nothing to do here yet.'};
  R('apt-use',({item})=>{const wl=here(),z=root.VoidBabylon?.zone,st0=wl?.style||'normal',st=st0==='container-rundown'?'rundown':st0==='container-regular'?'normal':st0,obj=item.object;let msg='';
   if(obj==='lights'){const on=!(z?.lightsOn!==false);z?.lights?.(on);const k=visit?.inst?.key;if(k){lightSet.add(k);if(on)lightOff.delete(k);else lightOff.add(k);}msg='Lights '+(on?'on.':'off.');}
   else if(obj==='closet'||obj==='panel'){const v=z?.toggle?.(obj);msg=v===false?(obj==='closet'?'You close the closet.':'You close the utility panel.'):(obj==='panel'?TEXT.panel:TEXT.closet[st]);}
   else if(obj==='screen'){const v=z?.toggle?.('screen');const k=visit?.inst?.key;if(k){screenSet.add(k);if(v===false)screenOff.add(k);else screenOff.delete(k);}msg=v===false?'You switch the screen off.':'You switch the screen on. The city’s adverts, as on every street screen.';}
   else if(obj==='safe'){z?.toggle?.('safe');msg=TEXT.safe[st];}else if(obj==='computer')msg=TEXT.computer[st];
   else if(obj==='vending'){const g=(root.VoidPodVending?.products||[]).filter((d,i)=>(i+({rundown:0,normal:3,luxury:6}[st]||0))%3===0).slice(0,5);msg=({rundown:'VENDING (old, scuffed, half the lights dead): ',normal:'VENDING: ',luxury:'PANTRY DISPENSER: '}[st])+(g.length?g.map(d=>d.name+' '+Number(d.price).toFixed(2)).join(' · '):'food and drinks')+'. (Buying here comes later.)';}
   // (the owner, 21 Nov 2026) the thing the mission step in progress needs (Halden's computer in 005) shows only the mission's content, not its everyday description
   if(!(wl?.apt&&!['lights','screen'].includes(obj)&&LC()?.stepWants?.({mission:wl.apt.mission,apt:wl.apt.id,object:obj,mod:wl.modId||null})))note(msg);try{if(wl?.apt)LC()?.aptUse?.({mission:wl.apt.mission,apt:wl.apt.id,object:obj,mod:wl.modId||null});}catch{}});}
 // walking through an open door inside: hallway door -> apartment, the apartment's door -> hallway, the hallway's street door -> street
 setInterval(()=>{try{const wl=here(),z=root.VoidBabylon?.zone;if(!wl||wl.modular||!z||busy||mode!=='walking'||typeof walker==='undefined'||!walker)return;
  for(const d of z.doors||[]){if(!(d.t>.9))continue;const dx=A.ORIGIN[0]+d.at[0]-walker.x,dz=A.ORIGIN[1]+d.at[1]-walker.z;if(dx*dx+dz*dz>.36)continue;
   if(d.id==='street'){backToStreet();return;}if(d.id==='entry'){backToHall();return;}
   if(d.slot!=null){const o=(wl.open||[]).find(x=>x.slot===d.slot);const inst=o&&((visit?.list||[]).find(a=>a.key===o.key)||open().find(a=>a.key===o.key));if(inst&&!(inst.residenceSlot!=null?roomLocked(inst):o.locked)){enterFlat(inst);return;}}}}catch{}},120);
 // the apartment the player is inside now ('<mission>/<id>'), for the mission engine's place events
 function inside(){const wl=here();return wl&&wl.part==='flat'&&wl.apt?wl.apt.mission+'/'+wl.apt.id:null;}
 Object.assign(root.VoidApartments,{open,allowed,inUse,inside,enterDoor,enterHall,enterFlat,backToStreet,backToHall,useAP,setPreview(p){preview=p||null;},resetRun(){preview=null;for(const x of [screenOff,screenSet,lightOff,lightSet])x.clear();},streetDoorsBuild:streetDoors});
 Object.defineProperties(root.VoidApartments,{visit:{get:()=>visit,configurable:true},hacking:{get:()=>hacking,configurable:true}});   // live values (Object.assign would copy them once)
})(globalThis);
