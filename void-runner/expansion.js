/* Campaign navigation, equipment trials and mission mechanics. */
'use strict';
let ownedGear = [], trialGear = null, shieldHP = 0, shieldDelay = 0, driveTime = 0, driveCooldown = 0, droneClock = 0;
let missionObjects = [], objectiveCount = 0, objectiveClock = 1, escortHP = 100, escortClock = 3;
const baseStats = C.stats;
C.stats = s => trialGear && VoidContent.gear[trialGear] ? baseStats({...s,loadout:{...s.loadout,[VoidContent.gear[trialGear].slot]:trialGear}},[...ownedGear,trialGear]) : baseStats(s,ownedGear);
function escapeText(value) { return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function menuPage(eyebrow,heading,body) {
  speech=null;scene('');mode='dock';clearInput();flightUI(false);screen.classList.remove('hidden');
  screen.innerHTML=`<section class="shop-layout panel expansion-panel"><div class="shop-heading"><div><div class="eyebrow">${eyebrow}</div><h1>${heading}</h1></div>${button('BACK TO SHIP','ship-home',true)}</div>${body}</section>`;
  const h=screen.querySelector('h1');h.tabIndex=-1;h.focus({preventScroll:true});
}
function campaignBoard() {
  if(state.completed<1){title();return;}
  view='campaign';
  menuPage('FREE CAMPAIGN / 12 NEW MISSIONS','Beyond the <em>freight lane.</em>',
    `<p>Three chapters. Twelve routes. One ship with a reputation to earn. Complete Rook’s opening deliveries to begin.</p>${VoidContent.chapters.map((ch,i)=>`<section class="chapter" style="--chapter-color:${ch.color}"><div class="chapter-heading"><span>0${i+2}</span><div><h2>${ch.name}</h2><p>${ch.subtitle}</p></div><b>${state.cleared.filter(id=>id.startsWith(ch.id+'-')).length} / 4</b></div><div class="mission-grid">${VoidContent.missions.filter(m=>m.chapter===ch.id).map(m=>{
      const available=C.unlocked(state,m),cleared=state.cleared.includes(m.id);
      const label=state.contract===m.id?'MISSION LOADED':state.contract?'DELIVER CURRENT CARGO':!available?(state.quest!=='open'?'FINISH OPENING DELIVERIES':m.requires&&!state.cleared.includes(m.requires)?'COMPLETE PREVIOUS MISSION':`REQUIRES ${m.requirement} REP`):cleared?'REPLAY MISSION':'ACCEPT MISSION';
      return `<article class="card"><span class="tag">${cleared?'CLEARED':m.kind.toUpperCase()}</span><h3>${m.name}</h3><p>${m.briefing}</p>${row('Reward',m.reward+' CR / +3 REP')}${button(label,'mission:'+m.id,false,!!state.contract||!available)}</article>`;
    }).join('')}</div></section>`).join('')}`);
}
function gearArt(id) {
  const paths={
    wraith:'M18 47h31l12-10h47v12H72l-10 8H39l-8 13H18z M84 37V23h8v14 M100 37V20h8v17 M27 47V35h16v12 M50 57v13h10V57',
    aegis:'M64 12 99 27v28c0 23-20 38-35 46-15-8-35-23-35-46V27z M64 24 88 34v21c0 15-13 28-24 35-11-7-24-20-24-35V34z M50 55h28 M64 41v28',
    ghost:'M23 68 44 20h20l-7 23h26L61 92H41l9-24z M83 27h24 M88 40h26 M79 81h28 M87 68h27',
    sentinel:'M45 42 64 29 83 42v24L64 79 45 66z M52 48h24v12H52z M45 47 26 34H12v13h14l19 10 M83 47l19-13h14v13h-14L83 57 M58 79v13 M70 79v13'
  };
  return '<svg viewBox="0 0 128 112" aria-hidden="true"><path d="'+paths[id]+'" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="M7 12h17M7 12v17M121 83v17h-17" fill="none" stroke="currentColor" opacity=".35"/></svg>';
}
function market() {
  if(state.completed<1){title();return;}
  view='market'; const account=window.VoidAccount;
  const status=account?.status || 'Connecting to the equipment store…';
  menuPage('EXCLUSIVE TIER / REAL-MONEY PURCHASES','A little <em>unfair.</em>',
    `${equipmentTabs('exclusive')}<p>The best tier of ship hardware. These exclusive upgrades cost real money. Standard weapons, shields and utilities are available for earned credits.</p><div class="market-status" role="status">${escapeText(status)}</div><div class="gear-grid">${Object.entries(VoidContent.gear).map(([id,g])=>{
      const owned=ownedGear.includes(id),equipped=state.loadout[g.slot]===id;
      const product=account?.products?.find(p=>p.id===id);
      const price=product?new Intl.NumberFormat(undefined,{style:'currency',currency:product.currency}).format(product.amount/100):'Sales opening soon';
      return `<article class="card gear-card" style="--gear-color:${g.color}"><div class="gear-art" aria-hidden="true">${gearArt(id)}</div><span class="eyebrow">${g.slot.toUpperCase()} / PERMANENT</span><h2>${g.name}</h2><p>${g.description}</p><strong class="price">${owned?'OWNED':escapeText(price)}</strong>${owned?button(equipped?'UNEQUIP':'EQUIP','equip:'+id,equipped):button(account?.user?'BUY EQUIPMENT':'SIGN IN TO BUY','purchase:'+id,false,!product||account?.busy)}${button('TRY IN TRAINING','trial:'+id,true)}</article>`;
    }).join('')}</div><p class="fine">Training is free and does not change your campaign. Equipment survives ship loss and new journeys. Purchases belong to your signed-in account. All campaign chapters are free.</p>${button('ACCOUNT & CLOUD SAVES','account',true)}`);
}
function equipGear(id) {
  const gear={...VoidContent.gear,...VoidContent.creditGear};
  if ((!ownedGear.includes(id)&&!state.creditGear.includes(id))||!gear[id]) return;
  const slot=gear[id].slot;
  state.loadout[slot]=state.loadout[slot]===id?null:id;save();hud();view==='shop'?shop():market();
}
function equipmentTabs(selected){return `<div class="equipment-tabs" aria-label="Upgrade currency">${button('STANDARD / EARNED CREDITS','shop',selected!=='credits')}${button('EXCLUSIVE / REAL MONEY','market',selected!=='exclusive')}</div>`;}
shop=function(){
  if(state.completed<1){shipHome();return;}
  view='shop';
  menuPage(`STATION OUTFITTER / ${state.credits.toLocaleString()} CR`,'Built with <em>your earnings.</em>',
    `${equipmentTabs('credits')}<p>Spend mission credits on standard ship systems. No account or real money needed. Exclusive equipment is available in the separate real-money tier.</p><div class="gear-grid standard-grid">${Object.entries(C.upgrades).map(([key,u])=>`<article class="card"><span class="tag">STANDARD / CREDITS</span><h2>${u.name}</h2><p>${u.description}</p>${u.prices.map((cost,i)=>{
      const installed=state.upgrades[key]>i,next=state.upgrades[key]===i;
      const benefit=key==='armor'?`${VOID_BALANCE.playerHull+(i+1)*VOID_BALANCE.hullPerTier} hull`:key==='guns'?`${(VOID_BALANCE.laserDamage+(i+1)*VOID_BALANCE.laserDamagePerTier).toFixed(2)} damage / bolt`:key==='shields'?`${VOID_BALANCE.playerShield+(i+1)*VOID_BALANCE.shieldPerTier} shield`:`${10+(i+1)*2.5} handling`;
      const label=installed?'INSTALLED':!next?'INSTALL PREVIOUS TIER':state.credits<cost?`NEED ${cost-state.credits} MORE CR`:`INSTALL / ${cost} CR`;
      return `<div class="upgrade-tier">${row('TIER '+(i+1),cost+' CR')}<p>${benefit}</p>${button(label,'buy:'+key,false,installed||!next||state.credits<cost)}</div>`;
    }).join('')}</article>`).join('')}</div><h2 class="utility-heading">Utility bay / choose one</h2><div class="credit-utilities">${Object.entries(VoidContent.creditGear).map(([id,g])=>{const owned=state.creditGear.includes(id),equipped=state.loadout.utility===id;return `<article class="card gear-card" style="--gear-color:${g.color}"><div class="gear-art">${gearArt(g.art)}</div><span class="tag">STANDARD / CREDITS</span><h2>${g.name}</h2><p>${g.description}</p>${owned?button(equipped?'UNEQUIP':'EQUIP','equip:'+id,equipped):button('BUY / '+g.price+' CR','credit-gear:'+id,false,state.credits<g.price)}</article>`;}).join('')}</div><p class="fine">Dock servicing: ${VOID_BALANCE.repairCost?Math.round(VOID_BALANCE.repairCost)+' CR per arrival (limited to available credits)':'free'}. Credit upgrades belong to this campaign and are included in cloud saves. A new journey resets earned equipment. Account-owned exclusive items remain available.</p>`);
};
function firstDeliveryOffer(){
  state.loginOfferSeen=true;save();view='first-delivery-offer';
  menuPage('FIRST DELIVERY COMPLETE / 350 CR EARNED','Make this ship <em>your own.</em>',
    `<p>Your first job is done. Rook is waiting back at Meridian.</p><p>Sign in to save your journey online and access exclusive ship upgrades. You can also keep playing as a guest and spend your mission credits at station outfitters.</p><div class="account-actions">${button(window.VoidAccount?.user?'SAVE PROGRESS / ACCOUNT':'SIGN IN & SAVE PROGRESS','account')}${button('KEEP PLAYING','dock',true)}${button('SPEND EARNED CREDITS','shop',true)}</div><p class="fine">Signing in is optional. Your progress already saves in this browser. Exclusive upgrades cost real money; standard upgrades use credits.</p>`);
}
function setOwnedGear(ids) {
  ownedGear=ids.filter(id=>Object.hasOwn(VoidContent.gear,id));
  shieldHP=Math.min(shieldHP,C.stats(state).shield);
  if (view==='market'&&mode==='dock') market();
}
const expansionDock=dock;
dock=function(tab='dock') {
  trialGear=null;
  if(state.quest==='return'&&state.completed===1&&!state.loginOfferSeen){firstDeliveryOffer();return;}
  expansionDock(tab);
  if(tab==='dock'&&state.location!=='meridian'){
    scene('dock');screen.classList.add('station-dock');
    const descriptions={kepler:'Scuffed deck plates, exposed pipes and a canteen full of tired freight crews.',undertow:'A weathered crescent of salvage docks, patched hull plating and magenta harbor lights.',foundry:'Hot steel, cargo cranes and the steady thunder of the refinery.'};
    screen.querySelector('.lead p')?.insertAdjacentHTML('beforeend','<br><span class="station-detail">'+descriptions[state.location]+'</span>');
  }
};
const expansionTitle=title;
title=function(){trialGear=null;expansionTitle();};
const expansionLaunch=launch;
launch=function(){
  if (trialGear) {
    const normalFlight=C.flight;
    C.flight=()=>({name:'Equipment proving ground',destination:'meridian',enemies:8,tier:1.5,duration:30,reward:0,rep:0,legal:true,kind:'training'});
    try { expansionLaunch(); } finally { C.flight=normalFlight; }
  } else expansionLaunch();
  if (mode!=='play') return;
  shieldHP=C.stats(state).shield;shieldDelay=driveTime=driveCooldown=droneClock=0;
  missionObjects=[];objectiveCount=0;objectiveClock=1;escortHP=100;escortClock=3;
  $('flight-objective').textContent=trialGear?'TRAINING / E or DRIVE activates Ghost Drive. Leave at any time.':current.briefing||$('flight-objective').textContent;
  updateEquipmentHud();
};
const expansionArrive=arrive;
arrive=function(){if(trialGear){trialGear=null;current=null;market();announce('Training complete. Campaign unchanged.');return;} expansionArrive();};
const expansionClear=routeClear;
routeClear=function(){return expansionClear()&&(current.kind!=='salvage'||objectiveCount>=3)&&(current.kind!=='escort'||escortHP>0);};
const expansionHurt=hurt;
hurt=function(amount){
  if(mode!=='play'||amount<=0||damageTime>0||driveTime>0)return;
  shieldDelay=C.stats(state).shieldDelay;const absorbed=Math.min(shieldHP,amount);shieldHP-=absorbed;
  if(amount>absorbed){expansionHurt(amount-absorbed);VoidCombatEffects.pulse('hull');}else {damageTime=.25;tone(320,.1);VoidCombatEffects.pulse('shield');}
  updateEquipmentHud();
};
const expansionSpawn=spawnEnemy;
spawnEnemy=function(){
  expansionSpawn();const e=enemies[enemies.length-1];
  if(current.kind==='generator'&&spawned===1){Object.assign(e,{generator:true,x:0,y:0,size:2,armor:22+current.tier*4,maxArmor:22+current.tier*4});announce('Shield relay online. Destroy the central relay first.');}
  if(current.kind==='boss'&&spawned===current.enemies){Object.assign(e,{boss:true,heavy:true,interceptor:false,className:'gunship',size:3,x:0,y:-1,armor:90+current.tier*15,maxArmor:90+current.tier*15});announce(current.name.toUpperCase()+' / CAPITAL SHIP INBOUND');}
};
function activateDrive(){const s=C.stats(state);if(mode==='play'&&s.drive&&driveCooldown<=0){driveTime=s.driveDuration;driveCooldown=s.driveCooldown;tone(220,.3);}}
function updateEquipmentHud(){
  const s=C.stats(state);$('shield-number').textContent=s.shield?`${Math.ceil(shieldHP)} / ${s.shield}`:'NONE';
  $('shield-bar').style.width=s.shield?100*shieldHP/s.shield+'%':'0%';
  $('drive').disabled=!s.drive||driveCooldown>0;
  $('drive').textContent=s.drive?(driveCooldown>0?`DRIVE ${Math.ceil(driveCooldown)}s`:'DRIVE / E'):'DRIVE / NONE';
}
function stepMission(dt){
  const stats=C.stats(state);
  shieldDelay=Math.max(0,shieldDelay-dt);driveCooldown=Math.max(0,driveCooldown-dt);driveTime=Math.max(0,driveTime-dt);
  if(!shieldDelay)shieldHP=Math.min(stats.shield,shieldHP+dt*stats.shieldRegen);
  if(keys.has('KeyE'))activateDrive();
  droneClock-=dt;
  if(stats.drone&&droneClock<=0&&enemies.length){const e=enemies.find(e=>e.generator)||enemies[0];bullets.push({x:e.x,y:e.y,z:15,previousZ:15,damage:stats.droneDamage,target:e});droneClock=stats.droneCooldown;}
  if(current.kind==='salvage'||current.kind==='hazard'){
    objectiveClock-=dt;
    if(objectiveClock<=0&&(current.kind==='hazard'?elapsed<current.duration:objectiveCount<3)){
      const scale=Math.min(W,H)*.9/14, bx=Math.min(7,Math.max(1,(W/2-60)/scale)),by=Math.min(3.5,Math.max(1,(H*.42-60)/scale));
      missionObjects.push({x:(Math.random()-.5)*bx*2,y:(Math.random()-.5)*by*2,z:110,kind:current.kind});objectiveClock=current.kind==='salvage'?4:2;
    }
  }
  for(const o of missionObjects){o.z-=dt*20;if(o.z<=15&&!o.dead){if(Math.hypot(o.x-player.x,o.y-player.y)<(o.kind==='salvage'?1.8:1.1)){if(o.kind==='salvage'){objectiveCount++;announce(`Signal recovered / ${Math.min(3,objectiveCount)} of 3`);}else hurt(18);}o.dead=true;}}
  missionObjects=missionObjects.filter(o=>!o.dead);
  if(current.kind==='escort'){
    escortClock-=dt;
    if(escortClock<=0&&enemies.length){const e=enemies[0],t=(e.z-14)/32;hostile.push({x:e.x,y:e.y,z:e.z,vx:(0-e.x)/t,vy:(2.4-e.y)/t,damage:10,escort:true});escortClock=2.8;}
  }
  updateEquipmentHud();
}
function escortImpact(b){
  if(b.escort&&!b.dead&&Math.hypot(b.x,b.y-2.4)<1){escortHP=Math.max(0,escortHP-b.damage);if(!escortHP){mode='over';clearInput();flightUI(false);panel('ESCORT LOST','Bring them <em>home.</em>','<p>The shuttle was disabled. Retry the mission; your campaign and equipment are safe.</p>',button('RETRY MISSION','launch')+button('BACK TO SHIP','dock',true));}}
}
const expansionUpdate=update;
update=function(dt){if(mode==='play')stepMission(dt);expansionUpdate(dt);if(mode==='play'){
  if(current.kind==='salvage'&&objectiveCount<3)$('flight-objective').textContent=`RECOVER SIGNALS ${objectiveCount} / 3 · Fly through cyan diamonds. Missed signals return.`;
  if(current.kind==='escort')$('flight-objective').textContent=`SHUTTLE ${escortHP}% · Block amber fire aimed at the shuttle below center.`;
}};
const expansionDraw=draw;
draw=function(){expansionDraw();if(mode!=='play'&&mode!=='pause')return;
  for(const o of missionObjects){const p=project(o.x,o.y,o.z),r=p.s*(o.kind==='salvage'?1.4:1);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.PI/4);ctx.fillStyle=o.kind==='salvage'?'#58ffe170':'#ffbd6970';ctx.strokeStyle=o.kind==='salvage'?'#58ffe1':'#ffbd69';ctx.lineWidth=2;ctx.fillRect(-r,-r,r*2,r*2);ctx.strokeRect(-r,-r,r*2,r*2);ctx.restore();}
  if(current.kind==='escort'){const p=project(0,2.4,14);ctx.strokeStyle='#ffbd69';ctx.lineWidth=3;ctx.strokeRect(p.x-22,p.y-12,44,24);ctx.fillStyle='#ffbd69';ctx.font='12px Consolas';ctx.fillText('SHUTTLE',p.x-25,p.y+30);}
  for(const e of enemies)if(e.generator||e.boss){const p=project(e.x,e.y,e.z);ctx.strokeStyle=e.generator?'#58ffe1':'#ff795f';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,Math.max(16,p.s*e.size*1.5),0,Math.PI*2);ctx.stroke();ctx.fillStyle=ctx.strokeStyle;ctx.font='12px Consolas';ctx.fillText(e.generator?'SHIELD RELAY':'CAPITAL SHIP',p.x-42,p.y-24);}
  if(shieldHP>0||driveTime>0){const p=project(player.x,player.y,14);ctx.strokeStyle=driveTime>0?'#ffbd69':'#58ffe180';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(p.x,p.y,35,45,0,0,Math.PI*2);ctx.stroke();}
  if(C.stats(state).drone){const p=project(player.x+1,player.y+.5,14);ctx.fillStyle='#a9ff6b';ctx.fillRect(p.x-5,p.y-5,10,10);}
};
function shipHome(){trialGear=null;if(state.quest==='inheritance'||state.quest==='arrival')title();else dock();}
function navigateExpansion(action){
  if(['play','pause'].includes(mode)){if(action==='leave-trial'&&trialGear){trialGear=null;current=null;market();}return;}
  if(action==='campaign')campaignBoard();else if(action==='market')market();else if(action==='ship-home')shipHome();
  else if(action==='shop')shop();
  else if(action?.startsWith('credit-gear:')){if(C.buyGear(state,action.slice(12))){save();hud();shop();announce('Standard utility installed.');}}
  else if(action?.startsWith('mission:')){if(C.accept(state,action.slice(8))){save();dock();}}
  else if(action?.startsWith('equip:'))equipGear(action.slice(6));
  else if(action?.startsWith('trial:')){trialGear=action.slice(6);if(VoidContent.gear[trialGear])launch();}
}
screen.addEventListener('click',e=>navigateExpansion(e.target.closest('button')?.dataset.action));
document.querySelector('#expansion-nav').addEventListener('click',e=>navigateExpansion(e.target.closest('button')?.dataset.action));
$('drive').onclick=activateDrive;
$('leave-trial').onclick=()=>{if(trialGear){trialGear=null;current=null;market();}};
const equipmentFlightUI=flightUI;
flightUI=function(on){equipmentFlightUI(on);$('drive').classList.toggle('hidden',!on);$('leave-trial').classList.toggle('hidden',!on||!trialGear);$('expansion-nav').classList.toggle('hidden',state.completed<1);for(const b of document.querySelectorAll('#expansion-nav button'))b.disabled=on;};
// A store link never skips the original workshop, inheritance and first delivery.
if(location.hash==='#market'&&state.completed>=1)setTimeout(market,0);
