/* Built-in loadout items use the revisioned Combat Balance API. Catalog merchandise keeps its own stock and IDs. */
(function(root){
 'use strict';
 const sets={
  m1:['M1 Seeker','Missile',{'Damage':['missileM1Damage','missileM1Blast','minimumDamage','maximumDamage','damageMultiplier','shieldScale','hullScale','splashCurve'],'Guidance':['missileM1TurnRate'],'Propulsion':['missileM1Speed'],'Visual effects':['impactStyle'],'Audio':['launchSound','impactSound'],'Timing':['missileLifetime','missileCooldown'],'Advanced':['missileRange','missileM1Price']}],
  m2:['M2 Heavy','Missile',{'Damage':['missileM2Damage','missileM2Blast','minimumDamage','maximumDamage','damageMultiplier','shieldScale','hullScale','splashCurve'],'Guidance':['missileM2TurnRate'],'Propulsion':['missileM2Speed'],'Visual effects':['impactStyle'],'Audio':['launchSound','impactSound'],'Timing':['missileLifetime','missileCooldown'],'Advanced':['missileRange','missileM2Price']}],
  ward:['Ward pistol','Weapon',{'Damage':['pistolDamage','pistolAimBonus'],'Timing':['pistolCooldown'],'Advanced':['pistolRecoil','pistolSpread','pistolPrice']}],
  pulse:['Pulse laser','Energy weapon',{'Damage':['laserDamage','laserDamagePerTier','minimumDamage','maximumDamage','damageMultiplier','shieldScale','hullScale','damageCurve'],'Propulsion':['laserProjectileSpeed','laserRange'],'Timing':['laserFireRate','laserCooldownPerTier']}],
  wraith:['Wraith Cannon','Energy weapon',{'Damage':['premiumLaserDamage','minimumDamage','maximumDamage','damageMultiplier','shieldScale','hullScale','damageCurve'],'Timing':['premiumLaserFireRate']}],
  deflector:['Standard deflector','Shield',{'Defense':['playerShield','absorption','shieldRechargeRate','rechargeCurve'],'Timing':['shieldRechargeDelay']}],
  aegis:['Aegis Shield','Shield',{'Defense':['premiumShield','absorption','premiumShieldRechargeRate','rechargeCurve'],'Timing':['premiumShieldRechargeDelay']}],
  armor:['Hull plating','Armor',{'Defense':['playerHull','hullPerTier']}],
  capacitor:['Reserve capacitor','Combat equipment',{'Defense':['capacity','recharge']}],
  pulseCoils:['Focused pulse coils','Combat equipment',{'Advanced':['cost','heat','energyCurve']}],
  ammo:['Admin missile refills','Ammunition',{'Advanced':['missileM1Price','missileM2Price']}]
 };
 const labels={minimumDamage:'Minimum damage points',maximumDamage:'Damage ceiling',damageMultiplier:'Damage multiplier',damageCurve:'Laser damage by range',energyCurve:'Energy use by remaining charge',shieldScale:'Shield damage multiplier',hullScale:'Armor damage multiplier',absorption:'Damage absorbed (fraction)',capacity:'Additional energy capacity',recharge:'Additional energy per second',cost:'Energy cost multiplier',heat:'Heat multiplier',impactStyle:'Impact effect',launchSound:'Launch cue',impactSound:'Impact cue',splashCurve:'Splash damage by distance',rechargeCurve:'Recharge rate by shield level',playerShield:'Base shield capacity',playerHull:'Base hull capacity',hullPerTier:'Hull per armor tier'};
 const category={'Damage':['◆','#ff8587'],'Guidance':['⌖','#82b9ff'],'Propulsion':['➝','#ffad6c'],'Visual effects':['✦','#c9a2ff'],'Audio':['♪','#72dbec'],'Defense':['⬡','#83dfa0'],'Timing':['◷','#e9ca74'],'Advanced':['⚙','#bac3ce']};
 const profileDefaults={minimumDamage:0,damageMultiplier:1,shieldScale:1,hullScale:1,absorption:1,capacity:24,recharge:3,cost:1.1,heat:1.1,launchSound:'missile',impactSound:'explosion'};
 const bounds={minimumDamage:[0,10000],maximumDamage:[0,10000],damageMultiplier:[0,4],shieldScale:[0,4],hullScale:[0,4],absorption:[0,1],capacity:[0,200],recharge:[0,60],cost:[0,4],heat:[0,4]};
 const keys=new Set(Object.values(sets).flatMap(([, ,groups])=>Object.values(groups).flat()));
 const numericKeys=()=>[...keys].filter(k=>Object.hasOwn(root.VoidBalance.spec,k));
 const label=k=>labels[k]||k.replace(/^missileM[12]/,'').replace(/([a-z])([A-Z])/g,'$1 $2').replace(/^./,x=>x.toUpperCase());
 const clone=x=>structuredClone(x);
 const opts=xs=>xs.map(([id,name])=>'<option value="'+id+'">'+name+'</option>').join('');
 function project(data){
  const values=root.VoidBalance.validate(data.values);
  return {values:Object.fromEntries(numericKeys().map(k=>[k,values[k]])),profiles:clone(root.VoidEquipmentProfiles.validate(data.profiles||{}))};
 }
 function readProject(doc){
  if(doc?.format!=='vr-equipment-1'||!doc.values||Object.keys(doc.values).length!==numericKeys().length||Object.keys(doc.values).some(k=>!numericKeys().includes(k)))throw Error('Choose a Void Runner equipment project.');
  return project(doc);
 }
 async function open(tools,parent){
  if(!tools.authorized||!tools.uid||!parent?.isConnected||parent.querySelector('.eq-studio'))return;
  const uid=tools.uid, dialog=document.createElement('dialog');dialog.className='cs-studio eq-studio';dialog.setAttribute('aria-label','Combat & Equipment Studio');parent.append(dialog);dialog.showModal();
  const active=()=>dialog.isConnected&&tools.authorized&&tools.uid===uid;
  const storeKey='vr-equipment-draft:'+uid;
  let presets=[];try{const stored=JSON.parse(localStorage.getItem(storeKey+':presets')||'[]');if(Array.isArray(stored))presets=stored;}catch{}
  let record,base,draft,id='m1',undo=[],redo=[],sim,playing=false,frame,rate=1,moving=0,vertical=0,cone=false,endpoint=false,target={x:28,z:96},message='',waiting=false,drag=null;
  const q=s=>dialog.querySelector(s);
  const busy=()=>!active()||waiting;
  const profile=()=>draft.profiles[id]||{};
  const val=k=>draft.values[k]??profile()[k]??(k==='impactStyle'?(id==='m2'?'large':'missile'):profileDefaults[k]);
  const isPower=()=>id==='capacitor'||id==='pulseCoils';
  const isRound=()=>id==='m1'||id==='m2',isShield=()=>id==='aegis'||id==='deflector';
  const status=m=>{message=m;if(q('[data-report]'))q('[data-report]').textContent=m;};
  const stop=()=>{playing=false;cancelAnimationFrame(frame);};
  function close(){stop();dialog.remove();}
  dialog.onclose=close;
  function remember(){undo.push(clone(draft));if(undo.length>64)undo.shift();redo=[];}
  function assign(k,v){if(Object.hasOwn(draft.values,k))draft.values[k]=v;else{const p=draft.profiles[id]??={};if(v===undefined)delete p[k];else p[k]=v;}}
  function validate(){return readProject({format:'vr-equipment-1',...draft});}
  function commit(k,v){if(v===val(k))return;remember();assign(k,v);try{validate();}catch(e){draft=undo.pop();const field=q('[data-stat="'+k+'"]');if(field)field.value=val(k)??'';status(e.message);return;}resetSim();status('Unsaved equipment changes');}
  const buttons='<button data-eq="undo">Undo</button><button data-eq="redo">Redo</button><button data-eq="reset">Reset selected equipment</button>';
  function control(k){
   if(k.endsWith('Curve'))return '<div data-curve="'+k+'"></div>';
   const limits=root.VoidBalance.spec[k],range=limits?[limits.min,limits.max]:bounds[k];
   if(range)return '<label>'+label(k)+' <input type="number" step="any" data-stat="'+k+'" min="'+range[0]+'" max="'+range[1]+'" value="'+(val(k)??'')+'" '+(k==='maximumDamage'?'placeholder="Uncapped"':'')+'></label>';
   const list={impactStyle:root.VoidEquipmentProfiles.styles,launchSound:root.VoidEquipmentProfiles.launches,impactSound:root.VoidEquipmentProfiles.impacts}[k];
   return '<label>'+label(k)+' <select data-stat="'+k+'">'+opts(list.map(x=>[x,x]))+'</select></label>'+(k.endsWith('Sound')?'<button data-listen="'+k+'">Play cue</button>':'');
  }
  function render(){
   stop();const openCards=new Set([...dialog.querySelectorAll('details[open]')].map(d=>d.dataset.group));
   const entry=sets[id];
   dialog.innerHTML='<div class="eq-head"><h2>Combat &amp; Equipment</h2><button data-eq="close">Close</button></div>'+
    '<label>Game equipment <select data-item>'+opts(Object.entries(sets).map(([key,v])=>[key,v[0]+' · '+v[1]]))+'</select></label><div class="cs-workspace"><section class="cs-inspector">'+
    Object.entries(entry[2]).map(([group,fields])=>'<details class="cs-card" data-group="'+group+'" style="--category:'+category[group][1]+'"><summary><strong>'+category[group][0]+' '+group+'</strong><small>'+fields.map(label).join(' · ')+'</small></summary>'+fields.map(control).join('')+'</details>').join('')+
    '</section><section class="cs-monitor"><h3>'+ (isRound()?'Flight preview':isShield()?'Shield response':isPower()?'Kestrel power bank':entry[0]+' preview')+'</h3><canvas data-plot width="640" height="340" aria-label="Equipment preview"></canvas><output data-readout></output>'+
    (isRound()?'<p>Drag the target, blue turn handle, or orange blast edge. Faster rounds cover more grid squares while turning.</p><label>Target motion <select data-moving>'+opts([['0','Stationary'],['12','Drift right'],['-12','Drift left'],['24','Fast drift right']])+'</select></label><label>Forward drift <input data-vertical type="number" min="-30" max="30" step="1" value="'+vertical+'"></label><label><input type="checkbox" data-cone> Tracking cone</label><label><input type="checkbox" data-endpoint> Show trial outcome on grid</label>':'')+
    ((isRound()||isShield()||isPower())?'<div><button data-eq="play">Play</button><button data-eq="restart">Restart</button><label>Playback speed <select data-rate>'+opts([['0.25','¼×'],['0.5','½×'],['1','1×'],['2','2×']])+'</select></label>'+(isShield()?'<button data-eq="hit">Apply 20 damage</button>':isPower()?'<button data-eq="draw-energy">Fire pulse</button>':'')+'</div>':'')+
    (Object.hasOwn(sets[id][2],'Damage')?'<section class="eq-dummy"><h4>Practice target</h4><label '+(id==='ward'?'hidden':'')+'>Shield <input data-dummy-shield type="number" min="0" max="10000" value="25"></label><label>'+(id==='ward'?'Health':'Armor')+' <input data-dummy-armor type="number" min="0" max="10000" value="80"></label>'+(['pulse','wraith'].includes(id)?'<label>Distance across range (%) <input data-distance type="number" min="0" max="100" value="0"></label>':'')+'<button data-eq="impact">Simulate hit</button><output data-impact></output></section>':'')+'</section></div><div>'+buttons+'</div><details><summary>Equipment presets and project files</summary><label>Preset name <input data-preset-name maxlength="60"></label><button data-eq="preset-save">Save equipment preset</button><label>Saved presets <select data-preset></select></label><button data-eq="preset-load">Apply preset</button><button data-eq="export">Export project</button><label>Import project <input type="file" data-import-equipment accept=".json"></label></details>'+
    '<div class="cs-actions"><span data-report role="status"></span><button data-eq="save">Save local draft</button><button data-eq="publish">Publish tuning</button></div>';
   const pick=q('[data-preset]');for(const [i,p] of presets.entries())if(p?.id===id)pick.add(new Option(p.name,String(i)));q('[data-eq=preset-load]').disabled=pick.options.length===0;
   q('[data-item]').value=id;for(const panel of dialog.querySelectorAll('[data-group]'))panel.open=openCards.has(panel.dataset.group);
   for(const el of dialog.querySelectorAll('select[data-stat]'))el.value=val(el.dataset.stat);
   if(q('[data-rate]'))q('[data-rate]').value=rate;if(q('[data-moving]')){q('[data-moving]').value=moving;q('[data-cone]').checked=cone;q('[data-endpoint]').checked=endpoint;}
   for(const el of dialog.querySelectorAll('[data-curve]')){
    const k=el.dataset.curve,track={duration:100,curve:clone(profile()[k])};el.append(root.VoidConsumableCurves.editor(track,()=>{remember();assign(k,clone(track.curve));resetSim();status('Unsaved curve changes');},{x:({splashCurve:'Distance across blast (%)',damageCurve:'Distance across range (%)',energyCurve:'Energy remaining (%)',rechargeCurve:'Shield charged (%)'})[k],y:'Output (%)',name:label(k),descending:k==='splashCurve'}));
   }
   resetSim();status(message||'Published revision '+record.revision);
  }
  function settings(){return {...record.values,...draft.values};}
  const zero={x:0,y:0,z:0};
  function roundState(){
   const b=settings(),dummy={...target,y:0,size:2,relationship:'hostile'},o=root.VoidOrdnance.spec(id,b,null,draft.profiles);
   const shot=root.VoidMissiles.launch({ownsMissileLauncher:true,equipped:true,missileCapacity:1,missilesLoaded:1},{progress:1,target:dummy},{f:{x:0,y:0,z:1},r:{x:1,y:0,z:0},u:{x:0,y:1,z:0}},b,0,{...o,origin:{right:0,up:0,forward:0}});
   return {b,dummy,shot,o,path:[[0,0]],time:0,outcome:shot?'Ready':'Target outside game range'};
  }
  function advance(s,dt){
   if(!s.shot||s.shot.dead)return;
   s.time+=dt;s.dummy.x=target.x+moving*s.time;s.dummy.z=target.z+vertical*s.time;
   root.VoidMissiles.step(s.shot,dt,zero,s.b,[s.dummy],()=>{s.outcome='Hit';});
   s.path.push([s.shot.x,s.shot.z]);if(s.shot.dead&&s.outcome!=='Hit')s.outcome='Miss';
  }
  function resetSim(){
   stop();const v=draft.values;
   sim=isRound()?roundState():{time:0,capacity:id==='aegis'?v.premiumShield:v.playerShield,shield:id==='aegis'?v.premiumShield:v.playerShield,hull:v.playerHull,delay:0};
   if(isPower()){
    const P=root.VoidProgression,base=P.tuning.ships.starter,installed=id==='capacitor'?{...P.modules.capacitor.stats,...profile()}:{...P.modules.pulse.stats,...profile()};
    sim.systems={...base,capacity:base.capacity+(installed.capacity||0),recharge:base.recharge+(installed.recharge||0),cost:P.tuning.laser.cost*(installed.cost??1),heat:P.tuning.laser.heat*(installed.heat??1),energyCurve:installed.energyCurve};sim.bank={energy:sim.systems.capacity,heat:0,overheated:false};
   }
   if(q('[data-eq=play]'))q('[data-eq=play]').textContent='Play';paint();
  }
  function paint(){
   const canvas=q('[data-plot]');if(!canvas)return;const g=canvas.getContext('2d');const w=640,h=340;
   g.fillStyle='#091722';g.fillRect(0,0,w,h);g.strokeStyle='#223744';g.lineWidth=1;
   for(let x=0;x<w;x+=32){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke();}
   for(let y=0;y<h;y+=32){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();}
   function dot(x,y,r,color,fill=true){g.beginPath();g.arc(x,y,Math.max(.5,r),0,Math.PI*2);g.strokeStyle=g.fillStyle=color;if(fill)g.fill();else g.stroke();}
   g.font='14px monospace';g.fillStyle='#b7cbd4';
   function bar(title,value,max,y,color){g.fillStyle='#b7cbd4';g.fillText(title,32,y);g.fillStyle='#203543';g.fillRect(32,y+12,475,14);g.fillStyle=color;g.fillRect(32,y+12,475*Math.min(1,value/Math.max(max,1)),14);g.fillText(String(+value.toFixed(2)),520,y+24);}
   if(isRound()){
    const sx=x=>320+x*2,sy=z=>308-z*2,trace=s=>{g.beginPath();s.path.forEach(([x,z],i)=>i?g.lineTo(sx(x),sy(z)):g.moveTo(sx(x),sy(z)));g.stroke();};
    if(!sim.guide){sim.guide=roundState();for(let i=0;i<1800&&sim.guide.shot&&!sim.guide.shot.dead;i++)advance(sim.guide,1/60);}const guide=sim.guide;
    g.strokeStyle='#50687c';trace(guide);g.strokeStyle='#92f1dc';g.lineWidth=2;trace(sim);
    g.fillStyle='#95acba';g.fillText('16 units / square',14,22);const o=sim.o,dx=sx(sim.dummy.x),dy=sy(sim.dummy.z);dot(dx,dy,7,'#f28787');dot(dx,dy,o.blast,'#ae7759',false);dot(dx,dy,2*o.blast,'#e79862',false);dot(dx+2*o.blast,dy,5,'#ffc182');
    const [hx,hz]=guide.path[Math.min(guide.path.length-1,Math.max(1,Math.round(guide.path.length*.28)))];
    const tx=sx(hx),ty=sy(hz);sim.handle=[tx,ty];canvas.dataset.turnX=tx;canvas.dataset.turnY=ty;
    g.strokeStyle='#82b9ff';g.lineWidth=2.5;trace({path:guide.path.slice(0,Math.max(2,Math.round(guide.path.length*.28)+1))});
    dot(tx,ty,7,'#82b9ff');g.fillStyle='#aecdea';g.fillText('Turn',tx-42,ty+4);
    if(endpoint&&guide.shot?.detonated){const end=guide.shot.detonated;dot(sx(end.x),sy(end.z),9,'#d9c987',false);g.fillText(guide.outcome,sx(end.x)+12,sy(end.z)-7);}
    if(sim.shot){const m=sim.shot,x=sx(m.x),y=sy(m.z),angle=Math.atan2(-m.direction.z,m.direction.x);g.save();g.translate(x,y);g.rotate(angle);if(cone){g.fillStyle='#78c5ff22';g.beginPath();g.moveTo(0,0);g.arc(0,0,48,-o.seeker,o.seeker);g.fill();}
     g.fillStyle='#99f4d8';g.beginPath();g.moveTo(8,0);g.lineTo(-5,-4);g.lineTo(-5,4);g.closePath();g.fill();g.restore();}
    q('[data-readout]').textContent=sim.outcome+' · '+o.speed+' game units/s · turn '+o.turn.toFixed(2)+' · '+sim.time.toFixed(2)+' s'+(o.speed*o.lifetime<o.range?' · Lifetime ends before the range limit':'');
   }else if(isPower()){
    bar('ENERGY',sim.bank.energy,sim.systems.capacity,85,'#85d9de');bar('HEAT',sim.bank.heat,sim.systems.heatLimit,160,'#faab73');q('[data-readout]').textContent=(sim.bank.overheated?'Overheated':'Ready')+' · '+sim.time.toFixed(1)+' s';
   }else if(isShield()){
    bar('SHIELD',sim.shield,sim.capacity,85,'#83dfa0');bar('HULL',sim.hull,draft.values.playerHull,160,'#86baff');q('[data-readout]').textContent='Recharge delay '+sim.delay.toFixed(1)+' s · '+sim.time.toFixed(1)+' s';
   }else{
    const values=Object.values(sets[id][2]).flat().filter(k=>typeof val(k)==='number').slice(0,4);values.forEach((k,i)=>bar(label(k),val(k),Math.max(val(k),root.VoidBalance.defaults[k]||profileDefaults[k]||1),45+i*72,'#88b9d2'));
    q('[data-readout]').textContent=sets[id][1]+' · base configuration';
   }
  }
  let turnStart;
  function playback(){
   if(playing){stop();q('[data-eq=play]').textContent='Play';return;}if(isRound()&&(!sim.shot||sim.shot.dead))resetSim();
   playing=true;q('[data-eq=play]').textContent='Pause';let last=performance.now(),acc=0;
   function tick(now){if(!active()){stop();return;}acc+=Math.min(.12,(now-last)/1000)*rate;last=now;
    while(acc>=1/60){acc-=1/60;if(isRound()){advance(sim,1/60);if(sim.shot?.dead)break;}else if(isPower()){sim.time+=1/60;root.VoidProgression.powerStep(sim.bank,null,1/60,sim.systems);}else{sim.time+=1/60;sim.delay=Math.max(0,sim.delay-1/60);if(!sim.delay)sim.shield=root.VoidEquipmentProfiles.recharge(sim.shield,sim.capacity,val(id==='aegis'?'premiumShieldRechargeRate':'shieldRechargeRate')/60,profile().rechargeCurve);}}
    paint();if(isRound()&&(!sim.shot||sim.shot.dead)){stop();q('[data-eq=play]').textContent='Play';}else if(playing)frame=requestAnimationFrame(tick);}
   frame=requestAnimationFrame(tick);
  }
  function point(e){const r=q('[data-plot]').getBoundingClientRect();return [(e.clientX-r.left)*640/r.width,(e.clientY-r.top)*340/r.height];}
  dialog.onpointerdown=e=>{if(!isRound()||!e.target.matches('[data-plot]')||busy())return;const [x,y]=point(e);const tx=320+sim.dummy.x*2,ty=308-sim.dummy.z*2;
   turnStart={x,value:sim.o.turn};drag=Math.hypot(x-sim.handle[0],y-sim.handle[1])<10?'turn':Math.hypot(x-tx,y-ty)<9?'target':Math.hypot(x-tx-2*sim.o.blast,y-ty)<14?'blast':'target';
   if(drag!=='target')remember();e.target.setPointerCapture(e.pointerId);dialog.onpointermove(e);};
  dialog.onpointermove=e=>{if(!drag||busy())return;const [x,y]=point(e);
   if(drag==='target')target={x:Math.max(-145,Math.min(145,(x-320)/2)),z:Math.max(8,Math.min(146,(308-y)/2))};
   else{const k=root.VoidOrdnance.TYPES[id].keys[drag],limit=root.VoidBalance.spec[k],raw=drag==='turn'?turnStart.value*Math.pow(2,(x-turnStart.x)/48):(x-320-target.x*2)/2;
    assign(k,+Math.max(limit.min,Math.min(limit.max,raw)).toFixed(2));q('[data-stat="'+k+'"]').value=val(k);status('Unsaved equipment changes');}resetSim();};
  dialog.onlostpointercapture=()=>{drag=null;};
  dialog.onchange=async e=>{
   if(busy())return;const el=e.target,k=el.dataset.stat;
   if(k){if(k==='maximumDamage'&&el.value===''){commit(k,undefined);return;}if(el.type==='number'&&(!el.checkValidity()||!Number.isFinite(el.valueAsNumber))){el.reportValidity();return;}commit(k,el.type==='number'?el.valueAsNumber:el.value);}
   else if(el.matches('[data-item]')){id=el.value;message=JSON.stringify(draft)===JSON.stringify(base)?'Published revision '+record.revision:'Equipment changes · unpublished';render();}
   else if(el.matches('[data-moving]')){moving=Number(el.value);resetSim();}
   else if(el.matches('[data-vertical]')){if(!el.checkValidity()||!Number.isFinite(el.valueAsNumber)){el.reportValidity();return;}vertical=el.valueAsNumber;resetSim();}
   else if(el.matches('[data-endpoint]')){endpoint=el.checked;paint();}
   else if(el.matches('[data-cone]')){cone=el.checked;paint();}
   else if(el.matches('[data-rate]'))rate=Number(el.value);
   else if(el.matches('[data-import-equipment]')&&el.files[0])try{if(el.files[0].size>131072)throw Error('Equipment project exceeds 128 KB.');const next=readProject(JSON.parse(await el.files[0].text()));if(!active())return;remember();draft=next;message='Imported project · unpublished';render();}catch(error){status(error.message);}
  };
  dialog.onclick=async e=>{
   if(busy())return;const listen=e.target.dataset.listen;if(listen){root.VoidAudio?.event(val(listen));return;}
   const act=e.target.dataset.eq;if(!act)return;
   if(!['close','play','restart','hit'].includes(act)){const invalid=dialog.querySelector('input:invalid');if(invalid){invalid.reportValidity();return;}}
   try{
    if(act==='close'){dialog.close();return;}
    if(act==='impact'){
     const shield=q('[data-dummy-shield]'),armor=q('[data-dummy-armor]');if(!shield.checkValidity()||!armor.checkValidity())return;
     const points=isRound()?sim.o.damage:val(id==='ward'?'pistolDamage':id==='pulse'?'laserDamage':'premiumLaserDamage');
     const scale=profile().damageCurve?root.VoidEquipmentProfiles.sample(profile().damageCurve,q('[data-distance]').valueAsNumber/100):1;
     const result=root.VoidEquipmentProfiles.damageLayers(id==='ward'?0:shield.valueAsNumber,points*scale,profile());
     if(id!=='ward')shield.value=+(shield.valueAsNumber-result.absorbed).toFixed(2);
     armor.value=+Math.max(0,armor.valueAsNumber-result.hullDamage).toFixed(2);
     q('[data-impact]').textContent='Shield −'+result.absorbed.toFixed(1)+' · '+(id==='ward'?'Health':'Armor')+' −'+result.hullDamage.toFixed(1);return;}
    if(act==='play'){playback();return;}if(act==='restart'){resetSim();return;}
    if(act==='draw-energy'){root.VoidProgression.consume(sim.bank,null,sim.systems);paint();return;}
    if(act==='hit'){const blocked=root.VoidEquipmentProfiles.absorb(sim.shield,20,val('absorption'));sim.shield-=blocked;sim.hull=Math.max(0,sim.hull-20+blocked);sim.delay=val(id==='aegis'?'premiumShieldRechargeDelay':'shieldRechargeDelay');paint();return;}
    if(act==='undo'||act==='redo'){const from=act==='undo'?undo:redo,to=act==='undo'?redo:undo;if(from.length){to.push(clone(draft));draft=from.pop();message='Unpublished equipment changes';render();}return;}
    if(act==='reset'){remember();delete draft.profiles[id];for(const k of Object.values(sets[id][2]).flat())if(Object.hasOwn(draft.values,k))draft.values[k]=root.VoidBalance.defaults[k];message='Selected equipment defaults restored · unpublished';render();return;}
    validate();
    const doc={format:'vr-equipment-1',...draft};
    if(act==='preset-save'){
     const name=q('[data-preset-name]').value.trim();if(!name)throw Error('Enter a preset name.');
     if(presets.some(p=>p.id===id&&p.name===name))throw Error('Choose a new preset name.');if(presets.length>=100)throw Error('This browser already has 100 equipment presets.');
     const fields=Object.values(sets[id][2]).flat().filter(k=>Object.hasOwn(draft.values,k));
     const next=[...presets,{id,name,values:Object.fromEntries(fields.map(k=>[k,val(k)])),profile:clone(profile())}];localStorage.setItem(storeKey+':presets',JSON.stringify(next));presets=next;message='Equipment preset saved';render();return;}
    if(act==='preset-load'){
     const selected=presets[Number(q('[data-preset]').value)];if(selected?.id!==id)return;
     const next=clone(draft);for(const k of Object.values(sets[id][2]).flat())if(Object.hasOwn(next.values,k)&&Object.hasOwn(selected.values,k))next.values[k]=selected.values[k];next.profiles[id]=clone(selected.profile);if(!root.VoidEquipmentProfiles.fields[id])delete next.profiles[id];
     readProject({format:'vr-equipment-1',...next});remember();draft=next;message='Preset applied · unpublished';render();return;}
    if(act==='save'){localStorage.setItem(storeKey,JSON.stringify({revision:record.revision,project:doc}));status('Draft saved in this browser');return;}
    if(act==='export'){const url=URL.createObjectURL(new Blob([JSON.stringify(doc,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='void-runner-equipment.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;}
    if(act==='publish'){
     if(!Object.hasOwn(record,'profiles'))throw Error('The game API is still updating. Reopen the Studio before publishing.');
     if(!confirm('Publish this equipment tuning for subsequent flights?'))return;
     waiting=true;stop();dialog.querySelectorAll('input,button,select').forEach(el=>el.disabled=true);const data=await tools.request('developer/balance',{revision:record.revision,values:settings(),profiles:draft.profiles,preset:'CUSTOM'});
     if(!active())return;tools.receive(data);record=data;base=project(data);draft=clone(base);localStorage.removeItem(storeKey);undo=[];redo=[];message='Published revision '+data.revision;render();
    }
   }catch(error){message=error.message;if(act==='publish')render();else status(message);}finally{waiting=false;}
  };
  dialog.innerHTML='<p>Loading equipment…</p><button data-eq="close">Close</button>';
  try{record=await tools.request('developer/balance');if(!active())return;base=project(record);draft=clone(base);
   try{const saved=JSON.parse(localStorage.getItem(storeKey)||'null');if(saved&&saved.revision===record.revision){draft=readProject(saved.project);message='Local draft · unpublished';}else if(saved){message='A newer revision is live. Load the saved draft to review it against this revision.';if(confirm(message)){draft=readProject(saved.project);message='Older draft restored · review before publishing';}}}catch{message='Local draft could not be loaded.';}
   render();
  }catch(error){if(active()){dialog.firstElementChild.textContent=error.message;}}
 }
 root.VoidEquipmentStudio={open};
})(globalThis);
