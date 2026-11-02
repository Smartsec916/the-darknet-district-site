/* UI visibility is not authorization: every private read/write is verified by the API. */
// What each balance value does, in plain words, grouped as the game uses them (David, 2026-10-24).
const balanceHelp={
 'Your ship':{
  playerHull:['Kestrel hull','How much damage your ship can take before it is destroyed. Bigger hulls scale from this.'],
  playerShield:['Base shield','Shield points before any shield module. Shields soak damage before the hull.'],
  shieldRechargeRate:['Shield recharge speed','Shield points regained per second once recharging starts.'],
  shieldRechargeDelay:['Shield recharge wait','Seconds without being hit before the shield starts recharging.'],
  collisionDamage:['Collision damage','Hull damage when you ram a ship. Heavy ships and debris hit harder.'],
  repairCost:['Repair cost','Credits charged for dock servicing after a run (never more than you have).']},
 'Your lasers':{
  laserDamage:['Laser damage','Damage per laser bolt before upgrades and weapon modules.'],
  laserFireRate:['Laser fire rate','Shots per second while holding fire.'],
  laserProjectileSpeed:['Laser bolt speed','How fast your bolts travel. Faster bolts are easier to land on moving targets.'],
  laserRange:['Laser range','How far a bolt flies before it fades out.']},
 'Your missiles':{
  missileDamage:['Missile damage','Damage per missile hit.'],
  missileSpeed:['Missile speed','How fast missiles fly.'],
  missileTurnRate:['Missile turning','How sharply a locked missile can turn to follow its target.'],
  missileLockTime:['Lock time','Seconds a hostile must stay in the targeting ring before LOCKED.'],
  missileLockRadius:['Lock ring size','Size of the targeting ring as a share of the screen. Bigger is easier to hold a lock.'],
  missileCooldown:['Missile reload','Seconds between missile launches.'],
  missileLifetime:['Missile fuel','Seconds a missile flies before it burns out.'],
  missileRange:['Missile range','Furthest distance you can lock and still hit.']},
 'Enemies':{
  firstRaiderDelay:['First raider arrives','Seconds after departure before the first raider appears.'],
  enemyHull:['Enemy toughness','Raider hull multiplier. 2 is normal; 4 doubles how much damage they take to destroy.'],
  enemyShield:['Enemy shields','Shield points on each raider. 0 means no shields.'],
  enemyLaserDamage:['Enemy laser damage','Damage each raider bolt does to you (heavy ships do double).'],
  enemyFireRate:['Enemy fire rate','How often raiders shoot. Higher means more shots.'],
  enemyAccuracy:['Enemy accuracy','How well raiders aim. 1 is their best; lower spreads their shots.'],
  enemyProjectileSpeed:['Enemy bolt speed','How fast raider bolts travel. Slower bolts are easier to dodge.']},
 'Upgrades (per tier bought)':{
  hullPerTier:['Hull plating','Extra hull for each Hull plating tier.'],
  shieldPerTier:['Deflector shield','Extra shield points for each Deflector shield tier.'],
  laserDamagePerTier:['Pulse cannons damage','Extra laser damage for each Pulse cannons tier.'],
  laserCooldownPerTier:['Pulse cannons speed','Seconds taken off the time between shots for each Pulse cannons tier.']},
 'Premium gear (Wraith Cannon, Aegis Shield)':{
  premiumLaserDamage:['Wraith Cannon damage','Damage per piercing bolt.'],
  premiumLaserFireRate:['Wraith Cannon fire rate','Shots per second.'],
  premiumShield:['Aegis Shield capacity','Shield points.'],
  premiumShieldRechargeRate:['Aegis recharge speed','Shield points regained per second.'],
  premiumShieldRechargeDelay:['Aegis recharge wait','Seconds without being hit before it recharges.']}
};
const VoidDevTools={authorized:false,request:null,pending:null,revision:0,values:{...VoidBalance.defaults},preset:'NORMAL',overlay:false,tab:'balance',
 applyPending(){if(this.pending){VoidBalance.apply(this.pending);this.pending=null;}},
 async identity(request){
  this.authorized=false;this.request=request;this.overlay=false;devPanel.hidden=true;devButton.hidden=true;debugInfo.hidden=true;
  if(devMissileTrial){devMissileTrial=false;resetMissileFlight();}
  if(!request)return;
  try{const data=await request('developer/balance');if(this.request!==request)return;this.authorized=true;this.receive(data);devButton.hidden=false;}catch{/* Fail closed; ordinary players get no private controls. */}
 },
 receive(data){this.values=VoidBalance.validate(data.values);this.revision=data.revision;this.preset=data.preset||'CUSTOM';this.pending=this.values;},
 open(tab){if(!this.authorized)return;if(mode==='play')pause();if(tab)this.tab=tab;devPanel.hidden=false;this.render();},
 // One window, one section at a time. Sections that aren't built yet are listed, not faked.
 sections:[['balance','Combat Balance'],['test','Test & Jump To'],['share','Share Links']],
 render(){
  const tabs='<nav class="dev-tabs" aria-label="Developer sections">'+this.sections.map(([id,name])=>`<button data-dev-tab="${id}" class="${this.tab===id?'on':''}" aria-pressed="${this.tab===id}">${name}</button>`).join('')+'</nav>';
  const head=`<div class="dev-heading"><h2>DEVELOPER TOOLS</h2><button data-dev="close">CLOSE</button></div>`+tabs;
  if(this.tab==='test'){devPanel.innerHTML=head+(globalThis.VoidDevTest?.render()||'<p>Test tools are loading.</p>');return;}
  if(this.tab==='share'){devPanel.innerHTML=head+(globalThis.VoidSharePanel?.render()||'<p>Share tools are loading.</p>');return;}
  const known=new Set(Object.values(balanceHelp).flatMap(g=>Object.keys(g))),field=(key,[name,help])=>{const s=VoidBalance.spec[key];return `<label class="dev-field"><span class="dev-name">${name}</span><input data-balance="${key}" type="number" min="${s.min}" max="${s.max}" step="any" value="${this.values[key]}"><span class="dev-help">${help}</span><span class="dev-range">${key} · ${s.min}–${s.max} · default ${VoidBalance.defaults[key]}</span></label>`;};
  const groups=Object.entries(balanceHelp).map(([title,fields])=>`<h3 class="dev-group">${title}</h3><div class="dev-fields">${Object.entries(fields).filter(([key])=>VoidBalance.spec[key]).map(([key,h])=>field(key,h)).join('')}</div>`).join('');
  const other=Object.keys(VoidBalance.spec).filter(key=>!known.has(key));
  devPanel.innerHTML=head+`<p>Saved values apply to subsequent flights. Save updates the shared server configuration. Preview changes only this session.</p><label>Preset <select id="dev-preset">${['EASY','NORMAL','HARD','CUSTOM'].map(p=>`<option ${this.preset===p?'selected':''}>${p}</option>`).join('')}</select></label>${groups}${other.length?`<h3 class="dev-group">Other</h3><div class="dev-fields">${other.map(key=>field(key,[key,'No description yet.'])).join('')}</div>`:''}<label><input id="dev-debug" type="checkbox" ${this.overlay?'checked':''}> Combat debug overlay</label><div class="dev-actions">${['preview','save','reload','defaults','missile-trial'].map(a=>`<button data-dev="${a}">${{'preview':'PREVIEW NEXT FLIGHT','save':'SAVE','reload':'RELOAD CURRENT VALUES','defaults':'RESET TO DEFAULTS','missile-trial':'MISSILE TRAINING / 12 ROUNDS'}[a]}</button>`).join('')}</div><p id="dev-status" role="status"></p>`;
 },
 read(){return VoidBalance.validate(Object.fromEntries([...devPanel.querySelectorAll('[data-balance]')].map(el=>[el.dataset.balance,el.value===''?NaN:Number(el.value)])));},
 debug(){
  debugInfo.hidden=!this.authorized||!this.overlay||!['play','pause'].includes(mode);if(debugInfo.hidden)return;
  const e=missileLock.target||enemies.find(e=>flightPoint(e).z>0),s=VoidFlightCraft.stats();
  debugInfo.textContent=`PLAYER Hull ${hp.toFixed(1)} Shield ${shieldHP.toFixed(1)}\nLaser ${s.damage.toFixed(2)} Missile ${VOID_BALANCE.missileDamage}\nTARGET ${e?`Hull ${e.armor.toFixed(1)} Shield ${(e.shield||0).toFixed(1)} Distance ${FM.length(e).toFixed(1)} Fire ${e.fire.toFixed(2)}s`:'NONE'}\nLock ${Math.round(missileLock.progress*100)}%`;
 }
};
const devButton=document.createElement('button');devButton.textContent='DEVELOPER TOOLS';devButton.hidden=true;devButton.id='dev-balance-open';document.body.append(devButton);devButton.onclick=()=>VoidDevTools.open();
const devPanel=document.createElement('section');devPanel.id='dev-balance';devPanel.hidden=true;devPanel.setAttribute('aria-label','Developer tools');document.body.append(devPanel);
const debugInfo=document.createElement('pre');debugInfo.id='combat-debug';debugInfo.hidden=true;document.body.append(debugInfo);
devPanel.addEventListener('keydown',event=>{event.stopPropagation();if(event.key==='Escape')devPanel.hidden=true;});
devPanel.addEventListener('change',event=>{
 if(!VoidDevTools.authorized)return;
 if(event.target.id==='dev-debug')VoidDevTools.overlay=event.target.checked;
 else if(event.target.id==='dev-preset'){VoidDevTools.preset=event.target.value;if(event.target.value!=='CUSTOM'){VoidDevTools.values=VoidBalance.preset(event.target.value);VoidDevTools.render();}}
 else if(event.target.dataset.balance){VoidDevTools.preset='CUSTOM';devPanel.querySelector('#dev-preset').value='CUSTOM';}
});
devPanel.addEventListener('click',async event=>{
 const tab=event.target.closest('[data-dev-tab]')?.dataset.devTab;if(tab&&VoidDevTools.authorized){VoidDevTools.tab=tab;VoidDevTools.render();return;}
 const action=event.target.closest('[data-dev]')?.dataset.dev;if(!action||!VoidDevTools.authorized)return;
 if(action.startsWith('test-'))return globalThis.VoidDevTest?.action(action,devPanel);
 const tools=VoidDevTools,request=tools.request;
 try{
  if(action==='close'){devPanel.hidden=true;return;}
  if(action==='defaults'){tools.values={...VoidBalance.defaults};tools.preset='NORMAL';tools.render();return;}
  if(action==='reload'||action==='save'){
   const data=await request('developer/balance',action==='save'?{values:tools.read(),preset:tools.preset,revision:tools.revision}:undefined);
   if(request!==tools.request)return;tools.receive(data);tools.render();
  }else if(action==='preview'){tools.values=tools.read();tools.pending=tools.values;}
  else if(action==='missile-trial'){
   // Revalidate access before granting temporary test equipment.
   await request('developer/balance');if(request!==tools.request)return;
   tools.pending=tools.read();devMissileTrial=true;trialGear='missile';devPanel.hidden=true;launch();return;
  }
  devPanel.querySelector('#dev-status').textContent='Ready. Values take effect on the next flight.';
 }catch(error){if(request===tools.request)devPanel.querySelector('#dev-status').textContent=error.message;}
});
// A public read exposes numbers, never developer access or a write capability.
VoidNetwork.request('balance').then(data=>{if(!VoidDevTools.authorized)VoidDevTools.pending=VoidBalance.validate(data.values);}).catch(()=>{});
