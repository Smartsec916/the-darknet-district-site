/* Campaign navigation, equipment trials and mission mechanics. */
'use strict';
let ownedGear = [], trialGear = null, shieldHP = 0, shieldDelay = 0, driveTime = 0, driveCooldown = 0, droneClock = 0;
let missionObjects = [], objectiveCount = 0, objectiveClock = 1, escortHP = 100, escortClock = 3;
const baseStats = C.stats;
C.stats = s => trialGear && VoidContent.gear[trialGear] ? baseStats({...s,loadout:{...s.loadout,[VoidContent.gear[trialGear].slot]:trialGear}},[...ownedGear,trialGear]) : baseStats(s,ownedGear);
function escapeText(value) { return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function menuPage(eyebrow,heading,body) {
  globalThis.VoidMenu&&leaveMenu();
  speech=null;scene('');mode='dock';clearInput();flightUI(false);screen.classList.remove('hidden');
  screen.innerHTML=`<section class="shop-layout panel expansion-panel"><div class="shop-heading"><div><div class="eyebrow">${eyebrow}</div><h1>${heading}</h1></div>${button('BACK TO SHIP','ship-home',true)}</div>${body}</section>`;
  const h=screen.querySelector('h1');h.tabIndex=-1;h.focus({preventScroll:true});
}
function campaignBoard() {
  if(state.completed<1){title();return;}
  view='campaign';
  menuPage('FREE CAMPAIGN / 12 NEW MISSIONS','Beyond the <em>freight lane.</em>',
    `<p>Three chapters. Twelve routes. One ship with a future to build. Complete Rook’s opening deliveries to begin.</p>${VoidContent.chapters.map((ch,i)=>`<section class="chapter" style="--chapter-color:${ch.color}"><div class="chapter-heading"><span>0${i+2}</span><div><h2>${ch.name}</h2><p>${ch.subtitle}</p></div><b>${state.cleared.filter(id=>id.startsWith(ch.id+'-')).length} / 4</b></div><div class="mission-grid">${VoidContent.missions.filter(m=>m.chapter===ch.id).map(m=>{
      const available=C.unlocked(state,m),cleared=state.cleared.includes(m.id);
      const label=state.contract===m.id?'MISSION LOADED':state.contract?'DELIVER CURRENT CARGO':!available?(state.quest!=='open'?'FINISH OPENING DELIVERIES':m.requires&&!state.cleared.includes(m.requires)?'COMPLETE PREVIOUS MISSION':'COMPLETE OPENING DELIVERIES'):cleared?'REPLAY MISSION':'ACCEPT MISSION';
      return `<article class="card"><span class="tag">${cleared?'CLEARED':m.kind.toUpperCase()}</span><h3>${m.name}</h3><p>${m.briefing}</p>${row('Reward',m.reward+' CR')}${button(label,'mission:'+m.id,false,!!state.contract||!available)}</article>`;
    }).join('')}</div></section>`).join('')}`);
}
function market(){shop();}
function equipGear(id) {
  const gear={...VoidContent.gear,...VoidContent.creditGear};
  if ((!ownedGear.includes(id)&&!state.creditGear.includes(id))||!gear[id]) return;
  const slot=gear[id].slot;
  if(!C.equip(state,id,ownedGear))return;save();hud();view==='shop'?shop():market();
}
shop=function(){
 if(state.completed<1){shipHome();return;}
 view='shop';
 const owned=[...ownedGear,...state.creditGear];
 const gear={...VoidContent.gear,...VoidContent.creditGear};
 const restored=owned.filter(id=>gear[id]).map(id=>{const g=gear[id],equipped=state.loadout[g.slot]===id;return '<div class="card"><h3>'+g.name+'</h3>'+button(equipped?'UNEQUIP':'EQUIP','equip:'+id,equipped)+'</div>';}).join('');
 menuPage('STATION OUTFITTER','Upgrade <em>shop.</em>',
 '<div class="gear-grid"><section class="card shop-placeholder"><h2>EXCLUSIVE</h2><p>EXCLUSIVE ITEM — COMING SOON</p></section></div>'+
 (restored?'<section aria-label="Previously owned equipment"><h2>Your existing equipment</h2>'+restored+'</section>':'')+
 '<p>Buy ships and standard upgrades below. Manage owned equipment in the Hangar.</p>'+button('ACCOUNT & CLOUD SAVES','account',true));
};
function firstDeliveryOffer(){
  state.loginOfferSeen=true;save();view='first-delivery-offer';
  menuPage('FIRST DELIVERY COMPLETE / 350 CR EARNED','Make this ship <em>your own.</em>',
    `<p>Your first job is done. Rook is waiting back at Meridian.</p><p>Sign in to save your journey online and access exclusive ship upgrades. You can also keep playing as a guest.</p><div class="account-actions">${button(window.VoidAccount?.user?'SAVE PROGRESS / ACCOUNT':'SIGN IN & SAVE PROGRESS','account')}${button('KEEP PLAYING','dock',true)}${button('VIEW UPGRADE SHOP','shop',true)}</div><p class="fine">Signing in is optional. Your progress already saves in this browser. The upgrade catalog is being prepared.</p>`);
}
function setOwnedGear(ids) {
  ownedGear=Array.isArray(ids)?ids.filter(id=>Object.hasOwn(VoidContent.gear,id)||id==='spectre'):[];
  VoidShips.verify(ownedGear);
  if(state.activeShip==='ship3'&&!VoidShips.owns(state,'ship3')){C.switchShip(state,'starter');save();hud();}
  if(view==='hangar'&&mode==='dock')hangar();
  const stats=C.stats(state);shieldHP=Math.min(shieldHP,stats.shield);hp=Math.min(hp,stats.hull);
  missileState.missileCapacity=Math.min(missileState.missileCapacity,stats.ship.missile.capacity);
  missileState.missilesLoaded=Math.min(missileState.missilesLoaded,missileState.missileCapacity);
  if (['market','shop'].includes(view)&&mode==='dock') market();
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

const expansionLaunch=launch;
launch=function(){
  if (trialGear) {
    const normalFlight=C.flight;
    C.flight=()=>({name:'Equipment proving ground',destination:'meridian',enemies:8,tier:1.5,duration:30,reward:0,legal:true,kind:'training'});
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
function activateDrive(){const s=C.stats(state);if(mode==='play'&&s.drive&&driveCooldown<=0){driveTime=s.driveDuration;driveCooldown=s.driveCooldown;VoidAudio.event('boost');}}
function updateEquipmentHud(){
  const s=C.stats(state);hudText('shield-number',s.shield?`${Math.ceil(shieldHP)} / ${s.shield}`:'NONE');
  const width=s.shield?(100*shieldHP/s.shield).toFixed(1)+'%':'0%';if($('shield-bar').style.width!==width)$('shield-bar').style.width=width;
  const disabled=!s.drive||driveCooldown>0;if($('drive').disabled!==disabled)$('drive').disabled=disabled;
  hudText('drive',s.drive?(driveCooldown>0?`DRIVE ${Math.ceil(driveCooldown)}s`:'DRIVE / '+VoidInput.label(VoidInput.bindings.boost)):'DRIVE / NONE');
}
function escortImpact(b){
  if(b.escort&&!b.dead&&Math.hypot(b.x,b.y-2.4)<1){escortHP=Math.max(0,escortHP-b.damage);if(!escortHP){mode='over';clearInput();flightUI(false);panel('ESCORT LOST','Bring them <em>home.</em>','<p>The shuttle was disabled. Retry the mission; your campaign and equipment are safe.</p>',button('RETRY MISSION','launch')+button('BACK TO SHIP','dock',true));}}
}
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

$('drive').onclick=activateDrive;
$('leave-trial').onclick=()=>{if(trialGear){trialGear=null;current=null;market();}};
const equipmentFlightUI=flightUI;
flightUI=function(on){equipmentFlightUI(on);$('drive').classList.toggle('hidden',!on);$('leave-trial').classList.toggle('hidden',!on||!trialGear);};
// A store link never skips the original workshop, inheritance and first delivery.
// bootstrap.js handles initial navigation after registration.
