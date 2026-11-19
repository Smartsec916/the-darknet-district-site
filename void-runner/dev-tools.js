/* UI visibility is not authorization: every private read/write is verified by the API. */
// What each balance value does, in plain words, grouped as the game uses them (the owner, 2026-10-24).
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
/* Small line icons for Developer Tools (beginner redesign, 18 Nov 2026): inline SVG, no image files, coloured by the text colour. */
const DEV_ICON_PATHS={mission:'M5 21V4M5 4h11l-2 4 2 4H5',character:'M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 21c0-4 3-6.5 7-6.5s7 2.5 7 6.5',test:'M8 5v14l11-7z',publish:'M12 16V4M7 9l5-5 5 5M5 20h14',balance:'M4 7h10M18 7h2M4 17h4M12 17h8M16 5v4M10 15v4',jump:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM15.5 8.5l-2 5-5 2 2-5z',trophy:'M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8',people:'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3.5 2.5-5.5 6-5.5s6 2 6 5.5M16 5.5a3 3 0 0 1 0 5.5M18 14.8c2 .7 3 2.5 3 5.2',home:'M4 11l8-7 8 7M6 9.5V20h12V9.5',parcel:'M4 8l8-4 8 4v9l-8 4-8-4zM4 8l8 4 8-4M12 12v9',meet:'M8 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20c0-3 2.5-5 6-5 1.5 0 2.8.4 4 1.1 1.2-.7 2.5-1.1 4-1.1 3.5 0 6 2 6 5',pin:'M12 21s-6-6.2-6-11a6 6 0 0 1 12 0c0 4.8-6 11-6 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',camera:'M4 8h3l2-3h6l2 3h3v11H4zM12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',talk:'M4 5h16v11H9l-5 4z',undo:'M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',redo:'M15 14l5-5-5-5M20 9H10a6 6 0 0 0 0 12h3',help:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.5v.01',back:'M15 5l-7 7 7 7',next:'M9 5l7 7-7 7',check:'M5 12.5l4.5 4.5L19 7',plus:'M12 5v14M5 12h14',close:'M6 6l12 12M18 6L6 18',list:'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01'};
const devIcon=(name,size=20)=>'<svg class="dev-icon" width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="'+(DEV_ICON_PATHS[name]||DEV_ICON_PATHS.help)+'"/></svg>';
/* Basic (the default) or Advanced: Advanced shows every setting, internal names (ids) and technical options. Remembered per browser; a blocked storage means Basic. */
const DEV_MODE_KEY='editor-mode';
const devMode=()=>{try{return localStorage.getItem(DEV_MODE_KEY)==='advanced'?'advanced':'basic';}catch{return 'basic';}};
const VoidDevTools={authorized:false,request:null,pending:null,revision:0,values:{...VoidBalance.defaults},preset:'NORMAL',overlay:false,tab:'home',icon:devIcon,
 get mode(){return devMode();},
 setMode(m){m=m==='advanced'?'advanced':'basic';try{localStorage.setItem(DEV_MODE_KEY,m);localStorage.setItem('npc-editor-advanced',m==='advanced'?'1':'0');}catch{}devPanel.classList.toggle('dev-basic',m==='basic');this.render();},
 applyPending(){if(this.pending){VoidBalance.apply(this.pending);this.pending=null;}},
 async identity(request){
  this.authorized=false;this.request=request;this.overlay=false;devPanel.hidden=true;devButton.hidden=true;debugInfo.hidden=true;
  if(devMissileTrial){devMissileTrial=false;resetMissileFlight();}
  if(!request)return;
  try{const data=await request('developer/balance');if(this.request!==request)return;this.authorized=true;this.receive(data);devButton.hidden=false;try{if(sessionStorage.getItem('mission-editor-return'))this.open('missions');else if(sessionStorage.getItem('npc-editor-return'))this.open('npcs');}catch{}}catch{/* Fail closed; ordinary players get no private controls. */}
 },
 receive(data){this.values=VoidBalance.validate(data.values);this.revision=data.revision;this.preset=data.preset||'CUSTOM';this.pending=this.values;},
 open(tab){if(!this.authorized)return;if(mode==='play')pause();if(tab)this.tab=tab;devPanel.hidden=false;devPanel.classList.toggle('dev-basic',devMode()==='basic');this.render();},
 // One window, one section at a time. Sections that aren't built yet are listed, not faked.
 // Start (the welcome screen with the big task cards) comes first; every other tool is one click away. Plain names; each with an icon.
 sections:[['home','Start'],['missions','Mission Editor'],['npcs','NPCs'],['test','Test & Jump To'],['balance','Combat Balance'],['achievements','Achievements']],
 sectionIcons:{home:'home',missions:'mission',npcs:'people',test:'jump',balance:'balance',achievements:'trophy'},
 // The Mission Editor's scripts load only when a confirmed developer opens it (players never download them).
 editorScripts:['admin/studio-model.js','admin/studio-flow.js','void-runner/mission-trees.js','void-runner/editor-guide.js','void-runner/npc-map.js','void-runner/npc-preview.js','void-runner/mission-editor.js','void-runner/npc-behaviour.js','void-runner/npc-editor.js','void-runner/editor-wizard.js','void-runner/editor-home.js'],
 loadEditor(){return this.editorLoad??=this.editorScripts.reduce((p,src)=>p.then(()=>new Promise((ok,fail)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=()=>fail(new Error('Could not load '+src));document.head.append(s);})),Promise.resolve());},
 render(){
  const tabs='<nav class="dev-tabs" aria-label="Developer sections">'+this.sections.map(([id,name])=>`<button data-dev-tab="${id}" class="${this.tab===id?'on':''}" aria-pressed="${this.tab===id}">${devIcon(this.sectionIcons[id],16)}<span>${name}</span></button>`).join('')+'</nav>';
  // UNDO (and REDO) for every edit made in the editors this session; Advanced switch; "?" replays the short tour (editor-home.js).
  const U=globalThis.VoidEditorHome,adv=devMode()==='advanced';
  const head=`<div class="dev-heading"><h2>DEVELOPER TOOLS</h2><span class="dev-head-actions"><button data-dev="undo" title="Puts back your last change (Ctrl+Z)" ${U&&U.canUndo?'':'disabled'}>${devIcon('undo',16)} UNDO</button><button data-dev="redo" title="Does the change again (Ctrl+Shift+Z)" ${U&&U.canRedo?'':'disabled'}>${devIcon('redo',16)} REDO</button><label class="dev-mode" title="Basic shows only what you need. Advanced shows every setting, the internal names (ids) and technical options."><input type="checkbox" data-dev-advanced ${adv?'checked':''}> Advanced</label><button data-dev="tour" class="dev-round" aria-label="Show me around (a short tour)" title="Show me around (a short tour)">${devIcon('help',18)}</button><button data-dev="close">CLOSE</button><button data-dev="exit-menu">EXIT TO MAIN MENU</button></span></div>`+tabs;
  // Start: the welcome screen and the "Make a mission" wizard (editor-home.js, loaded with the editor's scripts)
  if(this.tab==='home'){const heading=()=>{const d=document.createElement('div');d.innerHTML=head;return d;};if(globalThis.VoidEditorHome)return VoidEditorHome.render(devPanel,heading);devPanel.innerHTML=head+'<p class="dev-note">Loading…</p>';this.loadEditor().then(()=>{if(this.tab==='home'&&!devPanel.hidden)VoidEditorHome.render(devPanel,heading);}).catch(e=>{devPanel.innerHTML=head+'<p class="dev-note">The start page could not load ('+escapeText(e.message)+'). Check your connection, then press CLOSE and open Developer tools again.</p>';});return;}
  if(this.tab==='missions'){const heading=()=>{const d=document.createElement('div');d.innerHTML=head;return d;};if(globalThis.VoidMissionEditor)return VoidMissionEditor.render(devPanel,heading);devPanel.innerHTML=head+'<p class="dev-note">Loading the Mission Editor…</p>';this.loadEditor().then(()=>{if(this.tab==='missions'&&!devPanel.hidden)VoidMissionEditor.render(devPanel,heading);}).catch(e=>{devPanel.innerHTML=head+'<p class="dev-note">The Mission Editor could not load ('+escapeText(e.message)+'). Check your connection, then press CLOSE and open Developer tools again.</p>';});return;}
  // Developer Tools > NPCs (18 Nov 2026): the same on-demand scripts and the same draft as the Mission Editor (npc-editor.js)
  if(this.tab==='npcs'){const heading=()=>{const d=document.createElement('div');d.innerHTML=head;return d;};if(globalThis.VoidNPCEditor)return VoidNPCEditor.render(devPanel,heading);devPanel.innerHTML=head+'<p class="dev-note">Loading the NPCs…</p>';this.loadEditor().then(()=>{if(this.tab==='npcs'&&!devPanel.hidden)VoidNPCEditor.render(devPanel,heading);}).catch(e=>{devPanel.innerHTML=head+'<p class="dev-note">The NPCs tab could not load ('+escapeText(e.message)+'). Check your connection, then press CLOSE and open Developer tools again.</p>';});return;}
  if(this.tab==='test'){devPanel.innerHTML=head+(globalThis.VoidDevTest?.render()||'<p>Test tools are loading.</p>');return;}
  if(this.tab==='achievements'){const items=globalThis.VoidAchievements?.definitions||[];devPanel.innerHTML=head+'<p>Read-only catalog preview. Publishing, granting, and revoking require a server-authorized manager that is not enabled yet.</p>'+items.map(d=>'<article class="dev-field"><h3>'+escapeText(d.icon+' '+d.name)+'</h3><p>'+escapeText(d.description)+'</p><p>'+escapeText(d.category+' · '+d.condition.event+' · '+d.condition.count)+'</p></article>').join('');return;}
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
 if(event.target.matches('[data-dev-advanced]')){VoidDevTools.setMode(event.target.checked?'advanced':'basic');return;}
 if(event.target.id==='dev-debug')VoidDevTools.overlay=event.target.checked;
 else if(event.target.id==='dev-preset'){VoidDevTools.preset=event.target.value;if(event.target.value!=='CUSTOM'){VoidDevTools.values=VoidBalance.preset(event.target.value);VoidDevTools.render();}}
 else if(event.target.dataset.balance){VoidDevTools.preset='CUSTOM';devPanel.querySelector('#dev-preset').value='CUSTOM';}
});
devPanel.addEventListener('click',async event=>{
 const tab=event.target.closest('[data-dev-tab]')?.dataset.devTab;if(tab&&VoidDevTools.authorized){if(tab==='home')globalThis.VoidEditorHome?.toStart();VoidDevTools.tab=tab;VoidDevTools.render();return;}
 const action=event.target.closest('[data-dev]')?.dataset.dev;if(!action||!VoidDevTools.authorized)return;
 if(action.startsWith('test-'))return globalThis.VoidDevTest?.action(action,devPanel);
 const tools=VoidDevTools,request=tools.request;
 try{
  if(action==='close'){devPanel.hidden=true;return;}
  if(action==='undo'||action==='redo'||action==='tour'){const H=globalThis.VoidEditorHome;if(H)H[action]();else if(action==='tour'){tools.tab='home';tools.render();}return;}
  // EXIT TO MAIN MENU (the owner, 17 Nov 2026): the game menu's own path (openGameMenu saves first when a normal save would, then shows the main menu). During a test or
  // PLAY THIS DRAFT session it is LEAVE DRAFT (the page reloads with the real save untouched) without reopening the Mission Editor: the game starts on its main menu.
  if(action==='exit-menu'){devPanel.hidden=true;const T=globalThis.VoidDevTest;if(T?.active){try{sessionStorage.removeItem('mission-editor-return');}catch{}T.exit();return;}
   if(typeof mode!=='undefined'&&mode==='menu'){if(typeof renderMainMenu==='function')renderMainMenu();return;}if(typeof openGameMenu==='function')openGameMenu();return;}
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
 }catch(error){if(request===tools.request)devPanel.querySelector('#dev-status').textContent=error.message+(/sign in|401|403/i.test(error.message)?' Sign in again with the developer account, then try once more.':' Check the numbers (each box shows its allowed range) and your connection, then press the button again.');}
});
// A public read exposes numbers, never developer access or a write capability.
VoidNetwork.request('balance').then(data=>{if(!VoidDevTools.authorized)VoidDevTools.pending=VoidBalance.validate(data.values);}).catch(()=>{});
