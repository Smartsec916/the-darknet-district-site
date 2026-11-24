/* ZONES ON SCREEN AND ON-FOOT COMBAT (browser only; the rules are zones.js). The owner, 19 Nov 2026: the pistol Admin sells can be carried anywhere in NeoChinatown but
   fired only where the zone allows it; a small chip at the top left says where the player is: FRIENDLY (green, weapons locked), NEUTRAL (orange, a shot makes the armed
   people attack and everyone else run), HOSTILE (red, enemies attack on sight; fire freely).
   - THE CHIP: under the page title (and the multiplayer chip when it shows); colour + icon + word + a few words of what it means. Shown only while walking in NeoChinatown.
   - FIRING: pistolAction('fire') is wrapped. Friendly: nothing fires, a quiet "Weapons are locked here". Neutral with the safety catch (Combat Balance neutralSafety): the
     first press warns, a second press within safetyWindow fires; holstering re-arms it. Drawing / holstering never provokes anyone (a Friendly player may still draw to look
     at the gun; it simply cannot be fired). A shot: a muzzle flash on the first-person pistol, a short procedural bang, a hit test against the armed people.
   - ARMED PEOPLE (mission.combat.armed): built in the room they stand in when the player is in that part of the location (the Skirmish raider's body in three outfits),
     guard their post or walk their route, and use zones.js step() (the Skirmish AI): in a Hostile room they attack on sight; in a Neutral one only for guardHostileTime after
     a shot (leaving the location calms them); never in a Friendly one. A "Change zone" step with spawn brings them in only when it is reached.
   - CIVILIANS: a shot in a Neutral area makes the street walkers within civilianFleeRadius turn and walk away (npc-device.js spectacle {flee:true}).
   - TAKEN DOWN: health 0 -> a short "TAKEN DOWN" card; GET UP puts the player outside the location's street door (or in the District hall), health 100; the mission is
     tried again or fails (abandoned: back to its giver) as its combat.onDeath says. Private: each player's own locations and zones (no PvP anywhere). Nothing is saved but
     the pistol (progression.personal.weapons) and what the mission records. */
(function(root){
 'use strict';
 const Z=root.VoidZones;if(!Z||typeof document==='undefined')return;
 const cfg=()=>Z.tune(root.VOID_BALANCE);
 const LC=()=>root.VoidLiveContent,MC=()=>root.VoidMissionContent,MOD=()=>root.VoidModules,APT=()=>root.VoidApartments;
 const live=()=>{try{return typeof mode!=='undefined'&&mode==='walking'&&typeof walkingLocation!=='undefined'&&!!walkingLocation&&typeof walker!=='undefined'&&!!walker;}catch{return false;}};
 const inCity=()=>{try{return state&&state.location==='earth';}catch{return false;}};
 const now=()=>performance.now()/1000;
 // ---------------------------------------------------------------- the taken missions and where the player is
 function taken(){const env=LC()&&LC().env;if(!env||!Array.isArray(env.trees))return [];const recs=(state&&state.universe&&state.universe.missions)||{},out=[];
  for(const t of env.trees)for(const m of t.missions||[]){const rec=recs[m.id];if(rec&&rec.acquired&&!rec.completed)out.push({m,rec});}return out;}
 function insideNow(){const wl=walkingLocation;if(!wl||!wl.apt)return null;const out={mission:wl.apt.mission,loc:wl.apt.id,mod:null,type:null};
  if(wl.modular&&!wl.legacyPart){const id=MOD()?.moduleAt?.(wl,walker.x,walker.z);const mm=(wl.cluster?.mods||[]).find(x=>x.id===id);if(mm){out.mod=mm.id;out.type=mm.type;}}
  else if(wl.legacyPart){out.mod=wl.modId||wl.legacyPart;out.type=(wl.legacyPart==='hall'?'hall-':'apt-')+wl.style;}
  else if(wl.part){out.mod=wl.part;out.type=(wl.part==='hall'?'hall-':'apt-')+wl.style;}return out;}
 function placesNow(){try{return root.VoidPlaces?.at?.({scene:walkingLocation.id,x:walker.x,y:walker.y,z:walker.z})||[];}catch{return [];}}
 function areaKey(places){const P=root.VoidPlaces;for(const id of places){const n=P?.node?.(id);if(n&&(n.level==='area'||n.level==='venue'))return 'area:'+id;}return places.length?'area:'+places[places.length-1]:'area:?';}
 /* {zone, source, at, key (what a shot provokes: the location or the area)} or null outside NeoChinatown. */
 function current(){if(!live()||!inCity())return null;const ms=taken(),inside=insideNow(),places=inside?[]:placesNow();
  const r=Z.zoneAt({table:LC()?.env?.zones||{},missions:ms.map(({m,rec})=>({id:m.id,combat:m.combat,changes:Z.changesNow(m,rec)})),inside,places});
  r.key=inside?'loc:'+inside.mission+'/'+inside.loc:areaKey(places);r.inside=inside;return r;}
 /* The zone of one room of a location (for the armed people standing in it). */
 function zoneOfRoom(mission,loc,mod,type){const ms=taken();return Z.zoneAt({table:LC()?.env?.zones||{},missions:ms.map(({m,rec})=>({id:m.id,combat:m.combat,changes:Z.changesNow(m,rec)})),inside:{mission,loc,mod,type},places:[]}).zone;}
 // ---------------------------------------------------------------- the chip
 const chip=document.createElement('div');chip.id='zone-chip';chip.hidden=true;chip.setAttribute('role','status');chip.setAttribute('aria-live','polite');
 chip.innerHTML='<i aria-hidden="true"></i><b></b><span></span>';document.body.append(chip);
 const style=document.createElement('style');style.textContent='#zone-chip[hidden],#zone-down[hidden],#zone-toast[hidden]{display:none!important}#zone-chip{position:fixed;left:32px;top:112px;z-index:31;display:flex;align-items:center;gap:7px;padding:5px 11px 5px 9px;background:rgba(6,10,14,.82);border:1px solid var(--zc);border-left:4px solid var(--zc);color:#e8eef2;font:700 12px/1.2 ui-monospace,Consolas,monospace;letter-spacing:.16em;pointer-events:none;box-shadow:0 0 14px -6px var(--zc)}'
  +'#zone-chip i{font-style:normal;color:var(--zc);font-size:13px}#zone-chip b{color:var(--zc)}#zone-chip span{font-weight:500;font-size:10px;letter-spacing:.1em;color:#b9c4cb}#zone-chip.flash{animation:zcf .5s ease 2}@keyframes zcf{50%{background:var(--zc);color:#06090c}}'
  +'#zone-toast{position:fixed;left:50%;top:62%;transform:translateX(-50%);padding:7px 14px;background:rgba(6,10,14,.85);border:1px solid var(--zc,#ff9a2e);color:#f3e7d8;font:600 13px/1.3 ui-monospace,Consolas,monospace;letter-spacing:.08em;pointer-events:none;z-index:41;max-width:80vw;text-align:center}'
  +'#zone-hit{position:fixed;inset:0;pointer-events:none;z-index:30;box-shadow:inset 0 0 160px 40px rgba(220,30,30,.0);transition:box-shadow .25s ease}#zone-hit.on{box-shadow:inset 0 0 160px 40px rgba(220,30,30,.55);transition:none}'
  +'#zone-down{position:fixed;inset:0;z-index:70;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:rgba(40,0,0,.72);color:#fff;font:600 15px/1.4 ui-monospace,Consolas,monospace;text-align:center}#zone-down h2{margin:0;font-size:30px;letter-spacing:.3em;color:#ff6b6b}#zone-down button{font:700 14px ui-monospace,Consolas,monospace;letter-spacing:.2em;padding:10px 22px;background:#140808;color:#fff;border:1px solid #ff6b6b;cursor:pointer}';
 document.head.append(style);
 const SUB={friendly:'WEAPONS LOCKED',neutral:'FIRING MAKES THEM ATTACK',hostile:'ENEMIES ATTACK ON SIGHT'};
 let shown=null,last=null;
 function place(){const top=[document.getElementById('mp-chip'),document.querySelector('.hud-title,#hud h1,#title,#game-title,header h1')].filter(e=>e&&!e.hidden&&e.offsetParent!==null).map(e=>e.getBoundingClientRect()).filter(r=>r.height>0&&r.top<200&&r.left<400);
  const y=top.length?Math.max(...top.map(r=>r.bottom))+8:112;chip.style.top=Math.round(Math.min(y,180))+'px';}
 function paint(r){const vr=!!root.VoidVR?.active;chip.hidden=!r||vr;last=r;if(!r)return;const I=Z.INFO[r.zone];chip.style.setProperty('--zc',I.colour);if(shown!==r.zone){chip.querySelector('i').textContent=I.icon;chip.querySelector('b').textContent=I.word;chip.querySelector('span').textContent=SUB[r.zone];
   chip.dataset.zone=r.zone;chip.title=I.help;if(shown){chip.classList.remove('flash');void chip.offsetWidth;chip.classList.add('flash');}shown=r.zone;}place();}
 // a quiet line in the middle of the screen
 const toastEl=document.createElement('div');toastEl.id='zone-toast';toastEl.hidden=true;document.body.append(toastEl);let toastTimer=0;
 function toast(text,colour,ms=1800){toastEl.textContent=text;toastEl.style.setProperty('--zc',colour||'#ff9a2e');toastEl.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{toastEl.hidden=true;},ms);}
 const hitEl=document.createElement('div');hitEl.id='zone-hit';document.body.append(hitEl);
 // ---------------------------------------------------------------- sound and the muzzle flash
 let ac=null;function audio(){try{ac=ac||new (root.AudioContext||root.webkitAudioContext)();if(ac.state==='suspended')ac.resume();return ac;}catch{return null;}}
 function bang(dist=0){const a=audio();if(!a)return;const t=a.currentTime,len=.32,buf=a.createBuffer(1,Math.floor(a.sampleRate*len),a.sampleRate),d=buf.getChannelData(0);for(let i=0;i<d.length;i++){const k=i/d.length;d[i]=(Math.random()*2-1)*Math.pow(1-k,dist?3:4.5);}
  const src=a.createBufferSource();src.buffer=buf;const lp=a.createBiquadFilter();lp.type='lowpass';lp.frequency.value=dist?1600:4200;const g=a.createGain();const vol=Math.max(.05,.42-dist*.012)*(Number(root.VoidAudio?.settings?.master??1)||1);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+len);
  src.connect(lp).connect(g).connect(a.destination);src.start(t);const o=a.createOscillator(),og=a.createGain();o.type='sine';o.frequency.setValueAtTime(140,t);o.frequency.exponentialRampToValueAtTime(42,t+.16);og.gain.setValueAtTime(vol*.9,t);og.gain.exponentialRampToValueAtTime(.001,t+.18);o.connect(og).connect(a.destination);o.start(t);o.stop(t+.2);}
 let flashMesh=null,flashLight=null,flashOff=0;
 function muzzle(){const S=root.VoidBabylon?.scene,B=root.BABYLON;if(!S||!B)return;const gun=S.getTransformNodeByName?.('hand-ward-pistol');if(!gun)return;
  if(!flashMesh||flashMesh.isDisposed()||flashMesh.getScene()!==S){const m=new B.StandardMaterial('zone-muzzle',S);m.emissiveColor=new B.Color3(1,.78,.4);m.disableLighting=true;m.alpha=.9;flashMesh=B.MeshBuilder.CreateDisc('zone-muzzle',{radius:.07,tessellation:7},S);flashMesh.material=m;flashMesh.renderingGroupId=1;flashMesh.isPickable=false;
   flashLight=new B.PointLight('zone-muzzle-light',B.Vector3.Zero(),S);flashLight.diffuse=new B.Color3(1,.72,.38);flashLight.range=7;flashLight.intensity=0;}
  flashMesh.parent=gun;flashMesh.position.set(0,.01,.19);flashMesh.rotation.z=Math.random()*3;flashMesh.setEnabled(true);flashLight.parent=gun;flashLight.position.set(0,0,.3);flashLight.intensity=2.4;flashOff=performance.now()+55;}
 // ---------------------------------------------------------------- firing
 const safety={armedAt:null},esc={at:null,until:0};let lastLocked=0;
 const drawn=()=>{try{return !!groundState.drawn;}catch{return false;}};
 if(typeof pistolHandlingAction==='function'){const real=pistolHandlingAction;pistolHandlingAction=function(action){const was=drawn();const out=real.apply(this,arguments);if(action==='draw'&&was&&!drawn())Z.rearm(safety);return out;};}   // holstering re-arms the safety; drawing never provokes
 if(typeof pistolAction==='function'){const real=pistolAction;pistolAction=function(action){
   if(action!=='fire'||root.VoidVR?.active||!drawn())return real.apply(this,arguments);const r=current();if(down)return;
   if(r){const t=now(),c=cfg(),p=Z.press(safety,r.zone,t,c);
    if(p==='locked'){if(t-lastLocked>1.2){toast('Weapons are locked here.',Z.INFO.friendly.colour,1400);lastLocked=t;}return;}
    if(p==='warn'){toast('NEUTRAL AREA — firing will make people attack you. Press fire again to shoot.',Z.INFO.neutral.colour,Math.round(c.safetyWindow*1000));return;}}
   const before=Number(state?.progression?.personal?.ammo);const A=root.VoidAudio,ev=A&&A.event;if(A&&r)A.event=function(name){if(name==='laser')return;return ev.apply(this,arguments);};   // a gun, not a laser, in the city
   try{real.apply(this,arguments);}finally{if(A&&r)A.event=ev;}
   if(Number(state?.progression?.personal?.ammo)<before){const g=Z.gun(root.VOID_BALANCE,root.VoidProgression?.tuning?.ground);try{groundState.cooldown=g.cooldown;walker.pitch=Math.max(-1.4,walker.pitch-g.recoil*Math.PI/180);}catch{}if(r)shot(r);}};}   // the shared gun (zones.js gun(), Skirmish FPS reads the same): time between shots, recoil
 function aimRay(spread=0){const B=root.BABYLON;const dir=new B.Vector3(...Z.shotDir(walker.yaw,walker.pitch,spread,!!groundState.aim));return new B.Ray(new B.Vector3(walker.x,walker.y,walker.z),dir,60);}
 function shot(r){muzzle();bang(0);const c=cfg(),t=now();stats.shots++;
  // what the bullet meets: an armed person in this part of the location, not behind a wall
  let hitE=null;try{const S=root.VoidBabylon.scene,hit=S.pickWithRay(aimRay(Z.gun(root.VOID_BALANCE).spread),m=>m.isPickable&&m.metadata&&m.metadata.zoneEnemy!=null);if(hit&&hit.hit){const e=enemies.find(x=>x.e.id===hit.pickedMesh.metadata.zoneEnemy);if(e&&!e.e.dead&&Z.lineClear({x:walker.x,z:walker.z},{x:e.e.x,z:e.e.z},walkingLocation.solids))hitE=e;}}catch{}
  if(hitE){const gg=Z.gun(root.VOID_BALANCE),g=groundState.aim?gg.aimDamage:gg.damage;const killed=Z.hurt(hitE.e,g);stats.hits++;hitE.flash=performance.now()+120;if(killed){deadSet.add(hitE.key);stats.kills++;toast(Z.FIGURES[hitE.e.figure].name.toUpperCase()+' DOWN',Z.INFO.hostile.colour,1100);}}
  if(r.zone==='neutral'){const already=Z.hostileNow(esc,r.key,t);Z.provoke(esc,r.key,t,c);stats.provoked++;if(!already)setTimeout(()=>{try{announce('SHOTS FIRED · The armed people here are after you. Leave the area to calm things down.');}catch{}},50);
   try{if(c.civilianFleeRadius>0)root.VoidNPCDevice?.spectacle?.({x:walker.x,z:walker.z,radius:c.civilianFleeRadius,kind:'gunfire',duration:14,flee:true});}catch{}}
  else if(r.zone==='hostile'){for(const x of enemies)if(!x.e.dead&&Math.hypot(x.e.x-walker.x,x.e.z-walker.z)<14){x.e.alert=true;x.e.last={x:walker.x,z:walker.z};}}}   // the noise brings the near ones
 // ---------------------------------------------------------------- the armed people of the location the player is in
 let enemies=[],builtFor=null;const deadSet=new Set();const stats={shots:0,hits:0,kills:0,provoked:0,enemyShots:0,enemyHits:0,deaths:0};
 function figure(S,B,e,key){const F=Z.FIGURES[e.figure]||Z.FIGURES.security,node=new B.TransformNode('zone-armed-'+e.id,S),owned=[];
  const mat=(n,hex,em=0)=>{const m=new B.StandardMaterial('zone-armed-'+n+'-'+e.id,S);m.diffuseColor=B.Color3.FromHexString(hex);m.specularColor=new B.Color3(.25,.25,.25);if(em)m.emissiveColor=B.Color3.FromHexString(hex).scale(em);owned.push(m);return m;};
  const armour=mat('armour',F.armour,.08),trim=mat('trim',F.trim,.04),visor=mat('visor',F.visor,.9);
  const part=(name,shape,size,px,py,pz,m)=>{const mesh=shape==='capsule'?B.MeshBuilder.CreateCapsule(name,{radius:size[0],height:size[1],tessellation:10},S):shape==='sphere'?B.MeshBuilder.CreateSphere(name,{diameter:1,segments:10},S):B.MeshBuilder.CreateBox(name,{width:size[0],height:size[1],depth:size[2]},S);mesh.parent=node;mesh.position.set(px,py,pz);mesh.material=m;mesh.metadata={zoneEnemy:e.id};mesh.isPickable=true;return mesh;};
  const torso=part('core','capsule',[.33,.9],0,1.22,0,armour);torso.scaling.z=.72;part('chest-plate','box',[.6,.58,.12],0,1.36,.24,armour);part('webbing','box',[.63,.09,.07],0,1.29,.31,trim);
  const helmet=part('helmet','sphere',[],0,1.9,0,armour);helmet.scaling.set(.26,.28,.28);part('visor','box',[.44,.1,.07],0,1.93,.23,visor);part('respirator','box',[.2,.15,.15],0,1.78,.25,trim);
  const legs=[];for(const side of [-1,1]){const sh=part('shoulder','sphere',[],side*.39,1.5,0,armour);sh.scaling.set(.21,.17,.22);part('arm','capsule',[.11,.7],side*.42,1.02,.02,armour);part('glove','box',[.2,.18,.24],side*.42,.74,.07,trim);
   const leg=new B.TransformNode('leg',S);leg.parent=node;leg.position.set(side*.2,.92,0);legs.push(leg);const th=part('thigh','capsule',[.14,.86],0,-.44,0,armour);th.parent=leg;const bt=part('boot','box',[.26,.2,.38],0,-.82,.08,trim);bt.parent=leg;}
  part('pack','box',[.48,.52,.22],0,1.25,-.33,trim);part('rifle','box',[.11,.15,.58],.38,1.05,.36,trim);part('barrel','box',[.07,.07,.4],.38,1.03,.82,armour);
  const flash=B.MeshBuilder.CreateDisc('zone-armed-flash-'+e.id,{radius:.09,tessellation:7},S);const fm=mat('flash','#ffc66a',1);fm.disableLighting=true;flash.material=fm;flash.parent=node;flash.position.set(.38,1.03,1.04);flash.isPickable=false;flash.setEnabled(false);
  node.position.set(e.x,0,e.z);node.rotation.y=e.yaw;return {node,legs,flash,owned,dispose(){node.dispose(false,true);owned.forEach(m=>m.dispose());}};}
 function clearEnemies(){for(const x of enemies)try{x.view.dispose();}catch{}enemies=[];builtFor=null;}
 function roomsHere(wl){if(wl.modular&&!wl.legacyPart)return (wl.cluster?.mods||[]).map(m=>({id:m.id,type:m.type,toWorld:(x,z)=>{const r=MOD().rotP(m.rot,x,z);return {x:m.cx+r[0],z:m.cz+r[1]};}}));
  const O=APT()?.ORIGIN||[0,0],id=wl.legacyPart?(wl.modId||wl.legacyPart):wl.part,part=wl.legacyPart||wl.part;if(!id)return [];return [{id,type:(part==='hall'?'hall-':'apt-')+wl.style,toWorld:(x,z)=>({x:O[0]+x,z:O[1]+z})}];}
 function build(){const wl=walkingLocation;clearEnemies();builtFor=wl;if(!wl||!wl.apt)return;const S=root.VoidBabylon?.scene,B=root.BABYLON;if(!S||!B)return;
  const t=taken().find(x=>x.m.id===wl.apt.mission);if(!t||!t.m.combat||!Array.isArray(t.m.combat.armed))return;const rooms=roomsHere(wl),c=cfg();
  for(const a of t.m.combat.armed){const ref=Z.REF.exec(a.at||'');if(!ref||ref[1]!==wl.apt.id)continue;const room=rooms.find(r=>r.id===ref[2]);if(!room)continue;const key=t.m.id+'/'+a.id;if(deadSet.has(key)||Z.waiting(t.m,t.rec,a))continue;
   const p=room.toWorld(a.x,a.z),route=(a.route||[]).map(q=>room.toWorld(q[0],q[1]));if(a.role==='patrol')route.unshift({x:p.x,z:p.z});const e=Z.enemy(a,{x:p.x,z:p.z,route},c);
   enemies.push({e,key,mission:t.m.id,loc:wl.apt.id,mod:room.id,type:room.type,view:figure(S,B,e,key),walk:0,flash:0});}}
 // ---------------------------------------------------------------- the frame: the chip, the enemies, the player's health
 let down=false,lastTick=performance.now(),calmSince=0,zoneTimer=0,lastBuildCheck=0,stepBusy=false;
 const solidsBlocked=(x,z)=>{try{return root.VoidExplorer.blocked(x,z,walkingLocation);}catch{return false;}};
 function hurtPlayer(dmg,from){try{groundState.health=Math.max(0,Math.round(groundState.health-dmg*(1-(root.VoidConsumableGame?.modifier('damageResist')||0))));}catch{return;}calmSince=performance.now();hitEl.classList.add('on');setTimeout(()=>hitEl.classList.remove('on'),140);
  try{root.VoidAudio?.tone?.(90,.12,'square',.03);}catch{}if(groundState.health<=0)takenDown();}
 function frame(){requestAnimationFrame(frame);const t=performance.now(),dt=Math.min(.1,(t-lastTick)/1000);lastTick=t;
  if(flashMesh&&t>flashOff){flashMesh.setEnabled(false);if(flashLight)flashLight.intensity=0;}
  try{if((zoneTimer-=dt)<=0){zoneTimer=.25;paint(current());dueSteps();}}catch(e){stats.error=e.message;}
  if(!live()){if(enemies.length&&(typeof walkingLocation==='undefined'||walkingLocation!==builtFor))clearEnemies();return;}
  if(walkingLocation!==builtFor)build();else if(t-lastBuildCheck>1000){lastBuildCheck=t;const t0=taken().find(x=>x.m.id===walkingLocation.apt?.mission);if(t0&&(t0.m.combat?.armed||[]).some(a=>!deadSet.has(t0.m.id+'/'+a.id)&&!Z.waiting(t0.m,t0.rec,a)&&!enemies.some(x=>x.key===t0.m.id+'/'+a.id)&&Z.REF.exec(a.at||'')?.[1]===walkingLocation.apt.id))build();}
  if(down){try{walkingKeys.clear();}catch{}return;}
  {const mx=cfg().footPlayerHealth;try{if(groundState.healthMax!==mx){groundState.health=Math.max(1,Math.round(groundState.health*mx/(groundState.healthMax||100)));groundState.healthMax=mx;}}catch{}}   // Combat Balance footPlayerHealth (shared with Skirmish FPS)
  const c=cfg(),tt=now(),r=last,player={x:walker.x,z:walker.z,crouch:(()=>{try{return walkingKeys.has('KeyC')||walkingKeys.has('ControlLeft');}catch{return false;}})(),dead:down};
  if(r&&r.key!==esc.at)Z.hostileNow(esc,r?r.key:null,tt);   // leaving the area or location calms everyone
  for(const x of enemies){const e=x.e,v=x.view;if(e.dead){if(v.node.rotation.x>-1.45)v.node.rotation.x=Math.max(-1.5,v.node.rotation.x-dt*5);v.node.position.y=Math.max(-.05,v.node.position.y);continue;}
   const zone=zoneOfRoom(x.mission,x.loc,x.mod,x.type),hostile=zone==='hostile'||(zone==='neutral'&&Z.hostileNow(esc,'loc:'+x.mission+'/'+x.loc,tt));
   const px=e.x,pz=e.z,o=Z.step(e,player,dt,{hostile,cfg:c,clear:(a,b)=>Z.lineClear(a,b,walkingLocation.solids),blocked:solidsBlocked});
   v.node.position.set(e.x,0,e.z);v.node.rotation.y=e.yaw;const moved=Math.hypot(e.x-px,e.z-pz)/Math.max(dt,1e-3);x.walk+=moved*dt*5;const sw=moved>.2?Math.sin(x.walk)*.45:0;v.legs[0].rotation.x=sw;v.legs[1].rotation.x=-sw;
   if(o.shot){stats.enemyShots++;v.flash.setEnabled(true);x.flash=t+70;bang(Math.hypot(e.x-walker.x,e.z-walker.z));if(o.hit){stats.enemyHits++;hurtPlayer(o.damage,x);}}
   if(x.flash&&t>x.flash){v.flash.setEnabled(false);x.flash=0;}}
  // health comes back slowly after 8 s without a hit
  try{const mx=c.footPlayerHealth;const recovery=(t-calmSince>8000?4:0)+mx*(root.VoidConsumableGame?.modifier('healthRecovery')||0);if(groundState.health<mx&&recovery>0){groundState.regen=(groundState.regen||0)+dt*recovery;if(groundState.regen>=1){const n=Math.floor(groundState.regen);groundState.regen-=n;groundState.health=Math.min(mx,groundState.health+n);}}}catch{}}
 requestAnimationFrame(frame);
 // "Change zone" steps complete the moment they are reached
 function dueSteps(){if(stepBusy||!LC()?.zoneStep)return;for(const {m,rec} of taken()){const d=Z.dueNow(m,rec);if(d){stepBusy=true;try{LC().zoneStep(d.mission+'/'+d.step);}finally{stepBusy=false;}}}}
 // ---------------------------------------------------------------- taken down
 const downEl=document.createElement('div');downEl.id='zone-down';downEl.hidden=true;document.body.append(downEl);
 function takenDown(){if(down)return;down=true;stats.deaths++;try{groundState.drawn=false;groundState.aim=false;}catch{}try{document.exitPointerLock?.();}catch{}
  const inside=insideNow(),t=inside&&taken().find(x=>x.m.id===inside.mission),fail=!!(t&&t.m.combat&&t.m.combat.onDeath==='fail');
  const back=!fail&&!!(inside&&alarmRetry(inside.mission));downEl.dataset.back=back?'1':'';
  downEl.innerHTML='<h2>TAKEN DOWN</h2><p>'+(fail?'The mission failed. It goes back to whoever gave it to you.':back?'You come round by the way out. The mission is still yours: get to the street.':inside?'You come round outside. The mission is still yours: try again.':'You come round somewhere safe.')+'</p><button type="button" data-zone-up>GET UP</button>';downEl.hidden=false;downEl.dataset.fail=fail?'1':'';downEl.dataset.mission=t?t.m.id:'';}
 downEl.addEventListener('click',e=>{if(e.target.closest('[data-zone-up]'))getUp();});
 async function getUp(){if(!down)return;const fail=downEl.dataset.fail==='1',mission=downEl.dataset.mission,wl=walkingLocation;downEl.hidden=true;
  for(const k of [...deadSet])if(!mission||k.startsWith(mission+'/'))deadSet.delete(k);esc.at=null;esc.until=0;Z.rearm(safety);clearEnemies();
  try{if(fail&&mission){MC().abandon(state,LC().env,mission);announce('MISSION FAILED · '+(root.VoidMissions?.definitions?.[mission]?.title||mission));try{root.VoidDevTest?.stepNote?.('you went down; the mission failed, its giver offers it again');}catch{}}save();}catch{}
  try{groundState.health=cfg().footPlayerHealth;const pp=state.progression.personal,T=root.VoidProgression?.tuning?.ground;if(T){pp.ammo=T.magazine;pp.reserve=Math.max(24,pp.reserve);}}catch{}   // as the old checkpoint respawn: a full magazine, at least 24 in reserve
  try{if(wl&&wl.apt&&wl.modular&&MOD()?.backToStreet){if(!(downEl.dataset.back==='1'&&MOD().reenter&&await MOD().reenter()))await MOD().backToStreet();}else if(wl&&wl.apt&&APT()?.door){const d=APT().door(wl.door||'');if(d)await enterWalking(root.VoidDistrictArea.KEY.street,{quarter:d.quarter,spawn:[d.front[0],1.7,d.front[1]],yaw:Math.atan2(-d.n[0],-d.n[1])});else await enterWalking(root.VoidDistrictArea.KEY.interior,{silent:true});}
   else await enterWalking(root.VoidDistrictArea.KEY.interior,{silent:true,spawn:(()=>{try{const [x,z]=root.VoidNeoChinatown.toWorld(0,28.5);return [x,1.7,z];}catch{return undefined;}})(),yaw:Math.PI});}catch(e){stats.error=e.message;}
  down=false;}
 // ---------------------------------------------------------------- the ammo panel names the gun in hand
 setInterval(()=>{try{const el=document.querySelector('#fps-ammo-hud .ammo-title');if(el){const w=state?.progression?.personal?.weapon;const n=w==='base-pistol'?'PISTOL':'WARD PISTOL';if(el.textContent!==n)el.textContent=n;}}catch{}},500);
 /* ALARM (mission-mechanics.js onSpotted:'alarm', 21 Nov 2026): the armed people of the location the player is in turn on them now (the Neutral rule's guardHostileTime,
    as after a shot) and head for where they stand. alarmed(): still after the player. alarmRetry(mission): that mission's step in progress takes an alarm (taken
    down: the player comes round inside by the way out, so the step is not done by being carried to the street). */
 function alarm(){const r=current();if(!r||!r.inside)return false;Z.provoke(esc,r.key,now(),cfg());for(const x of enemies)if(!x.e.dead){x.e.alert=true;x.e.lost=0;x.e.last={x:walker.x,z:walker.z};}return true;}
 function alarmed(){const r=current();return !!r&&Z.hostileNow(esc,r.key,now());}
 function alarmRetry(mission){try{return (root.VoidMissionMechanicsGame?.now?.()||[]).some(x=>x.mission===mission&&x.o&&x.o.onSpotted==='alarm');}catch{return false;}}
 root.VoidZoneRun={alarm,alarmed,current,paint,get chip(){return chip;},get enemies(){return enemies.map(x=>({...x.e,key:x.key,mod:x.mod}));},get escalation(){return {...esc};},get safety(){return {...safety};},stats,
  get down(){return down;},getUp,takenDown,build,hurtPlayer,toast,shot,reset(){deadSet.clear();esc.at=null;esc.until=0;Z.rearm(safety);clearEnemies();}};
})(globalThis);
