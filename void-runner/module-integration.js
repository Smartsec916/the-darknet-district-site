/* MODULAR INTERIORS: game wiring (browser only). modules.js has the data, the checks and the walking areas, module-build.js the 3D. docs/development/MODULES.md.
   - IN: a street door with one of this player's mission locations (apartmentsNow, `modular`) opens like an apartment door (apartment-integration.js enterDoor hands the
     location over here); walking in leads to the location's entrance module. Only the modules built together with it (its cluster: the modules that touch through doors on
     that floor) are built; everything else is built when the player gets there.
   - DOORS: every door slides open for the player unless it is locked (its access point: a "Hack the access point" step opens it for the rest of the mission). Walking
     through a door that leads elsewhere (a connection to an apartment, the street door) fades to that place; the ELEVATOR's buttons take the player to the same cab on
     another floor (the doors close, a short fade, the doors open).
   - USE: everything usable says what it is (stubs for later gameplay) and each use is a mission event (live-content.js aptUse with the module: "Use something in <module>");
     the light switch puts that module's lights out and on again, the screens switch off and on. Being in a module is "Go into <module>" (the place event's apt and mod).
   Private like the apartments (remote-players.js: a private location has no shared room). Nothing is saved; lights and screens are remembered for the session. */
(function(root){
 'use strict';
 const A=root.VoidApartments,M=root.VoidModules;if(!A||!M||!M.layout||typeof document==='undefined')return;
 const LC=()=>root.VoidLiveContent,KEY='apt-module',STREET_KEY=()=>root.VoidDistrictArea?.KEY?.street||'sacramento';
 let visit=null,busy=false;const memo={lights:new Map(),screens:new Map()};   // visit: {door (the street door record), inst, cluster}
 const here=()=>{try{return typeof walkingLocation!=='undefined'&&walkingLocation?.modular?walkingLocation:null;}catch{return null;}};
 const zone=()=>root.VoidBabylon?.zone||null;
 const note=t=>{try{resumeWalking();}catch{}try{announce(t);}catch{}};
 // the instance as it is now (a hack may have opened a door since the area was built)
 function now(key){let list=[];try{list=A.open?.()||[];}catch{}return list.find(a=>a.key===key&&a.modular)||(visit&&visit.inst&&visit.inst.key===key?visit.inst:null);}
 async function go(key,opts){if(busy)return false;busy=true;try{const V=root.VoidDoorViews;if(V&&V.pass)await V.pass(()=>enterWalking(key,{...(opts||{}),silent:true}));else await enterWalking(key,opts);return true;}finally{busy=false;}}   // a short fade over a silent load (door-views.js pass)
 const DW=d=>(d?.t??0)>.9?0:Math.round(((A.DOOR&&A.DOOR.wait)||.62)*1000);   // the shared door timing: wait for the door to be open
 // a short black fade over a transition inside (elevator rides, doors that lead elsewhere)
 const veil=document.createElement('div');veil.id='mod-veil';veil.style.cssText='position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;transition:opacity .35s ease;z-index:60';document.body.append(veil);
 const fade=v=>new Promise(r=>{veil.style.opacity=v?'1':'0';setTimeout(r,360);});
 async function goCluster(inst,cid,from,{silent=true,veiled=false}={}){const def=M.layout(inst,cid,{from});if(!def)return false;
  for(const m of def.cluster?.mods||[]){const k=inst.key+'|'+m.id;if(memo.lights.has(k))m.lightsOff=!memo.lights.get(k);if(memo.screens.has(k))m.screenOff=!memo.screens.get(k);}
  if(def.legacyPart==='flat'){const k=inst.key+'|'+def.modId;if(memo.lights.has(k))def.lightsOff=!memo.lights.get(k);if(memo.screens.has(k))def.screenOff=!memo.screens.get(k);}
  VoidExplorationData.locations[KEY]=def;visit={...(visit||{}),inst,cluster:def.cluster?.id||cid};return await go(KEY,{silent});}   // go() fades (the elevator's own longer fade stays in ride())
 /* In from the street: the location's entrance. */
 async function enter(door,inst){if(!inst||!inst.loc)return;visit={door,inst,cluster:null};const an=M.analyse(inst.loc),e=M.parseRef(inst.loc.entry),c=e&&an.clusterOf(e.mod);if(!c){note('Locked.');return;}
  return goCluster(inst,c.id,{ref:inst.loc.entry},{silent:false});}
 async function backToStreet(){const d=visit?.door;visit=null;if(!d){await go(STREET_KEY(),{});return;}const yaw=Math.atan2(-d.n[0],-d.n[1]);if(d.scene==='corporate'){await go('corporate',{spawn:[d.front[0],1.7,d.front[1]],yaw});return;}   // the Corporate District's maintenance door (apartments.js CORP_DOORS)
 await go(STREET_KEY(),{quarter:d.quarter,spawn:[d.front[0],1.7,d.front[1]],yaw});}
 /* Through a door that leads elsewhere (a connection) or out to the street. */
 async function cross(doorId){const wl=here();const inst=visit&&now(visit.inst.key);if(!wl||!inst)return;const an=M.analyse(inst.loc),d=an.doors.find(x=>x.id===doorId);if(!d)return;
  if(d.kind==='entry'){await backToStreet();return;}if(M.lockedNow(inst,an,d)){note('DOOR · LOCKED. The access point beside it could be bypassed.');return;}
  const mine=new Set(wl.cluster?.mods?.map(m=>m.id)||[]),pa=M.parseRef(d.a),side=mine.has(pa.mod)?d.a:d.b,to=side===d.a?d.b:d.a,c=an.clusterOf(M.parseRef(to).mod);if(!c)return;
  await goCluster(inst,c.id,{ref:to},{veiled:true});}
 async function ride(floor){const inst=visit&&now(visit.inst.key);const cid=inst&&M.clusterAtFloor(inst,floor);if(!cid){note('That floor does not answer.');return;}
  const z=zone();for(const d of z?.doors||[])if(d.rec?.kind==='snap'&&/elevator|lift/.test(d.id))d.force?.(0);
  try{root.VoidAudio?.event?.('door');}catch{}await fade(1);await new Promise(r=>setTimeout(r,500));await goCluster(inst,cid,{cab:true},{veiled:false});setTimeout(()=>fade(0),200);
  setTimeout(()=>{try{announce('FLOOR '+M.floorName(floor)+'.');}catch{}},700);}
 // ---- the module the player is in (for "Go into <module>") ----
 function moduleAt(wl,x,z){if(wl.legacyPart)return wl.modId;for(const m of wl.cluster?.mods||[]){const hw=m.w*M.GRID/2,hd=m.d*M.GRID/2;if(Math.abs(x-m.cx)<=hw&&Math.abs(z-m.cz)<=hd)return m.id;}return null;}
 {const prevInside=A.inside;A.inside=function(){const wl=here();if(wl&&wl.apt)return wl.apt.mission+'/'+wl.apt.id;return prevInside?prevInside.apply(this,arguments):null;};}
 A.insideMod=function(){const wl=here();if(!wl)return null;try{return moduleAt(wl,walker.x,walker.z);}catch{return null;}};
 // ---- walking through doors; labels; doors a hack opened ----
 setInterval(()=>{try{const wl=here(),z=zone();if(!wl||!z||busy||mode!=='walking'||typeof walker==='undefined'||!walker)return;
  if(wl.legacyPart){for(const d of z.doors||[]){if(!(d.t>.9))continue;const dx=A.ORIGIN[0]+d.at[0]-walker.x,dz=A.ORIGIN[1]+d.at[1]-walker.z;if(dx*dx+dz*dz>.36)continue;
    const sock=d.id==='street'?'street':d.id==='entry'?'entry':d.slot!=null?'d'+d.slot:null;if(!sock)continue;const inst=visit&&now(visit.inst.key);if(!inst)return;const dd=M.doorOf(M.analyse(inst.loc),wl.modId+'.'+sock);if(dd){cross(dd.id);return;}}return;}
  for(const d of z.doors||[]){const r=d.rec;if(!r||!r.leads||!(d.t>.6))continue;const vx=walker.x-r.x,vz=walker.z-r.z,out=vx*r.n[0]+vz*r.n[1],al=vx*r.tg[0]+vz*r.tg[1];if(out>.22&&Math.abs(al)<.6){cross(r.id);return;}}}catch(e){}},120);
 setInterval(()=>{try{const wl=here(),z=zone();if(!wl||!z||!visit)return;const inst=now(visit.inst.key);if(!inst)return;visit.inst=inst;const an=M.analyse(inst.loc);
   for(const d of an.doors){if(M.lockedNow(inst,an,d))continue;if(wl.legacyPart){const k=/\.d(\d+)$/.exec(d.a.startsWith(wl.modId+'.')?d.a:d.b||'');const sd=k&&(z.doors||[]).find(x=>x.slot===+k[1]);if(sd&&sd.locked){sd.set({locked:false,mine:true});}for(const o of wl.open||[])if(o.door===d.id)o.locked=false;}
    else{const zd=z.door?.(d.id);if(zd&&zd.locked)z.unlock(d.id);wl.interactions=wl.interactions.filter(i=>!(i.action==='mod-door'&&i.door===d.id));}}
   for(const it of wl.interactions){if(it.action==='mod-use'&&it.object==='lights')it.label='LIGHTS · '+(z.lightsOf?.(it.mod)===false?'ON':'OFF');else if(it.action==='mod-use'&&it.object==='screen')it.label='TURN SCREEN '+(z.screenOf?.(it.mod)===false?'ON':'OFF');
    else if(it.action==='mod-portal'&&it.door){const d=an.doors.find(x=>x.id===it.door);if(d){const locked=M.lockedNow(inst,an,d),to=wl.legacyPart?null:null;it.label=locked?'DOOR · LOCKED (ACCESS POINT)':wl.legacyPart==='hall'?it.label.replace(/ · LOCKED.*$/,'').replace(/^APARTMENT/,'ENTER APARTMENT').replace(/^ENTER ENTER/,'ENTER'):'GO THROUGH';}}}}catch{}},500);
 // ---- what using things says (stubs for later gameplay) ----
 const SAY={computer:'DESK COMPUTER: a locked workstation. Mail, a ticket queue, a half-written report. It wants a badge and a PIN.','manager-pc':'MANAGER’S COMPUTER: locked behind a biometric pad. A calendar notification glows: “Board call — 09:00”.',
  safe:'SAFE: a keypad safe, bolted down. Locked.',printer:'COPIER: a jam light blinks. Somebody left a page in the tray: a seating plan with names blacked out.',directory:'BUILDING DIRECTORY: suites, a reception desk, a data centre in the basement.',
  rack:'SERVER RACK: blades humming behind a perforated door, status lights steady. A service port, a key lock.',core:'CORE RACK: tagged CORE B4. One amber alarm among the green. The cage lock is engaged.',
  terminal:'TERMINAL: DC-NODE 7. “Core B4: integrity check FAILED.” A login prompt waits.',cooling:'COOLING UNIT: 21.4 °C, fans at 78%. A maintenance panel with a keyed switch.',
  shelves:'SHELVES: stock in boxes, labels in three languages, a clipboard with last week’s count.',kegs:'KEG COOLER: six kegs on their lines, a pressure gauge in the green.',
  cabinet:'MEDICINE CABINET: locked. Antibiotics, painkillers, a box with no label.',fridge:'MED FRIDGE: insulin pens, blood bags, a bottle of something homemade.',lockers:'LOCKERS: four steel lockers, three padlocked. The fourth is empty but for a work shirt.',
  panel:'PANEL: breakers, a junction block and a data port. Nothing to do here yet.',valve:'VALVE: a hand wheel, stiff with rust. The gauge reads low pressure.'};
 const COMPUTER={'shop-back':'STOCK TERMINAL: inventory and deliveries. Tomorrow: “12 crates, no paperwork”.','bar-back':'OFFICE COMPUTER: the bar’s books. Two sets of them.','clinic':'MED TERMINAL: patient records, most of them under made-up names.'};
 const wait=setInterval(()=>{if(typeof VoidInteractions==='undefined'||!VoidInteractions.register||typeof announce==='undefined')return;clearInterval(wait);start();},300);
 function start(){const R=(a,f)=>VoidInteractions.register(a,f);
  R('mod-use',({item})=>{const wl=here(),z=zone(),inst=visit&&now(visit.inst.key),obj=item.object,mod=item.mod;let msg='';const type=(wl?.cluster?.mods||[]).find(m=>m.id===mod)?.type||'';
   if(obj==='lights'){const on=z?.lightsOf?.(mod)===false;z?.lights?.(on,mod);if(inst)memo.lights.set(inst.key+'|'+mod,on);msg='Lights '+(on?'on.':'off.');}
   else if(obj==='screen'){const on=z?.screenOf?.(mod)===false;z?.screen?.(mod,on);if(inst)memo.screens.set(inst.key+'|'+mod,on);msg=on?'You switch the screen on.':'You switch the screen off.';}
   else if(obj==='curtain'&&type==='flophouse'){const open=z?.toggleCurtain?.(mod,item.curtain);msg=open==null?'Curtain.':open?'You draw the curtain open.':'You close the curtain.';}
   else{const tt=M.TYPES[type]||{},pf=tt.opens&&tt.opens[obj]&&root.VoidPanels&&root.VoidPanels[tt.opens[obj]];if(pf)try{pf({mod,type,object:obj});}catch(e){console.warn('[modules] panel',e);}   // a panel (pawn-shop.js), else what the type says (modules.js `say`)
    msg=pf?'':(tt.say&&tt.say[obj])||((obj==='computer'||obj==='terminal')&&COMPUTER[type]?COMPUTER[type]:SAY[obj]||'Nothing to do here yet.');}
   // (the owner, 21 Nov 2026) the thing the mission step in progress needs (the manager's computer in 006) shows only the mission's content, not its everyday description
   if(msg&&!(wl?.apt&&!['lights','screen'].includes(obj)&&LC()?.stepWants?.({mission:wl.apt.mission,apt:wl.apt.id,object:obj,mod})))note(msg);try{if(wl?.apt)LC()?.aptUse?.({mission:wl.apt.mission,apt:wl.apt.id,object:obj,mod});}catch{}});
  R('mod-item',({item})=>{const wl=here(),m=(wl?.cluster?.mods||[]).find(x=>x.id===item.mod),it=m&&(m.items||[])[item.index];note(it?(it.type==='mission-item'?'MISSION ITEM: ':it.type==='loot'?'LOOT: ':it.type==='note'?'NOTE: ':'')+it.label+' (placed for this mission; picking things up comes later).':'Nothing here.');});
  R('mod-exit',()=>{try{resumeWalking();}catch{}const z=zone();let w=0;for(const d of z?.doors||[])if(d.rec?.kind==='entry'||d.id==='street'){d.force?.(1);w=Math.max(w,DW(d));}setTimeout(()=>backToStreet(),w);});
  R('mod-portal',({item})=>{try{resumeWalking();}catch{}if(!item.door){note('Locked.');return;}const z=zone(),d=(z?.doors||[]).find(x=>x.id===item.door||x.rec?.id===item.door);const inst=visit&&now(visit.inst.key),an=inst&&M.analyse(inst.loc),dd=an&&an.doors.find(x=>x.id===item.door);
   if(dd&&M.lockedNow(inst,an,dd)){note('DOOR · LOCKED. The access point beside it could be bypassed.');return;}d?.force?.(1);setTimeout(()=>cross(item.door),DW(d));});
  R('mod-door',()=>note('DOOR · LOCKED. A card reader and a keypad; the access point beside it could be bypassed.'));
  R('mod-elev',({item})=>{try{resumeWalking();}catch{}ride(item.floor);});}
 /* Back in by the street door (the entrance module): Mission 006's way out after being taken down in an alarm (zone-integration.js getUp; 21 Nov 2026). */
 async function reenter(){const v=visit;if(!v||!v.door||!v.inst)return false;const inst=now(v.inst.key);if(!inst)return false;await enter(v.door,inst);return true;}
 Object.assign(M,{enter,reenter,backToStreet,cross,ride,moduleAt,resetRun(){memo.lights.clear();memo.screens.clear();}});
 Object.defineProperty(M,'visit',{get:()=>visit,configurable:true});
})(globalThis);
