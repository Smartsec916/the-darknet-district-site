/* VOID//RUNNER: canvas flight and station presentation. No external dependencies. */
'use strict';
const C = VoidCampaign, $ = id => document.getElementById(id);
const canvas = $('space'), ctx = canvas.getContext('2d'), screen = $('screen');
const SAVE_KEY = 'void-runner-campaign-v1';
let state = C.fresh(), hasSave = false, saveAvailable = true;
try { const restored = C.restore(localStorage.getItem(SAVE_KEY)); if (restored) { state = restored; hasSave = true; } } catch { saveAvailable = false; }
let mode = 'title', view = 'dock', W, H, D, time = 0;
let approachTime = 0;
let current = null, elapsed = 0, hp = 100, shot = 0, spawnClock = 0, spawned = 0, resolved = 0, damageTime = 0, noticeTime = 0;
let enemies = [], bullets = [], hostile = [], sparks = [], target = null, pointer = false, firing = false, touchFiring = false;
canvas.tabIndex = 0;
const player = { x: 0, y: 0, vx: 0, vy: 0, bank: 0, pitch: 0 };
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let seed = 734;
function random() { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646; }
const stars = Array.from({ length: 320 }, () => ({ x: (random() - .5) * 300, y: (random() - .5) * 190, z: random() * 260 + 1 }));
function resize() { W = innerWidth; H = innerHeight; D = Math.min(devicePixelRatio || 1, 2); canvas.width = W * D; canvas.height = H * D; ctx.setTransform(D, 0, 0, D, 0, 0); }
addEventListener('resize', resize); resize();
function save() { try { state.savedAt=Date.now(); localStorage.setItem(SAVE_KEY, JSON.stringify(state)); hasSave = true; } catch { saveAvailable = false; announce('Storage unavailable. Keep this tab open to retain progress.'); } }
function announce(text) { $('notice').textContent = text; noticeTime = 4; }
function tone(...args) { globalThis.VoidAudio?.tone(...args); }
function button(label, action, quiet = false, disabled = false) { return `<button data-action="${action}" class="${quiet ? 'quiet' : ''}" ${disabled ? 'disabled' : ''}>${label}</button>`; }
function row(label, value) { return `<div class="data-row"><span>${label}</span><strong>${value}</strong></div>`; }
function panel(eyebrow, title, body, actions, aside = '') { screen.innerHTML = `<div class="layout"><section class="panel lead"><div class="eyebrow">${eyebrow}</div><h1 tabindex="-1">${title}</h1>${body}<div class="actions">${actions}</div></section>${aside ? `<aside class="side-panel">${aside}</aside>` : ''}</div>`; screen.classList.remove('hidden'); screen.querySelector('h1')?.focus({ preventScroll: true }); }
function shipCard() { const s = C.stats(state); return `<div class="eyebrow">YOUR SHIP</div><h2>${VoidShips.get(state).name}</h2><p>Elias’s old courier. Every repair bears your work. Now yours.</p>${row('Pulse cannons', 'MK ' + (state.upgrades.guns + 1))}${row('Hull integrity', s.hull)}${row('Vector thrusters', 'MK ' + (state.upgrades.engines + 1))}<p class="fine">${saveAvailable ? 'Progress saves on this browser at departures, deliveries, and purchases. Hull is serviced at every dock.' : 'Browser saving is unavailable. Progress lasts while this tab stays open.'}</p>`; }
function hud() { const name=document.querySelector('header .wide strong');if(name)name.textContent=VoidShips.get(state).name; $('credits').textContent = state.credits.toLocaleString(); const max = C.stats(state).hull; $('hull').style.width = Math.max(0, hp / max * 100) + '%'; $('hull-number').textContent = `${Math.ceil(hp)} / ${max}`; $('weapon').textContent = `PULSE MK ${state.upgrades.guns + 1} / THRUST MK ${state.upgrades.engines + 1}`; }
let title, dock, bar, shop;
function flightUI(on) { $('flight-hud').classList.toggle('hidden', !on); $('touch-controls').classList.toggle('hidden', !on); $('pause').classList.toggle('hidden', !on); if (!on) $('pause').textContent = 'PAUSE'; }
function clearInput() { VoidInput.held.clear(); pointer = false; firing = false; touchFiring = false; target = null; }
function launch() {
  current = C.flight(state); if (!current) return;
  save(); clearInput(); mode = 'play'; elapsed = 0; approachTime = 0; shot = 0; spawned = 0; resolved = 0; spawnClock = VOID_BALANCE.firstRaiderDelay; damageTime = 0; hp = C.stats(state).hull;
  enemies = []; bullets = []; hostile = []; sparks = []; VoidFlightPhysics.reset(player);
  screen.classList.add('hidden'); canvas.focus({ preventScroll: true }); flightUI(true); $('pause').textContent = 'PAUSE'; document.documentElement.style.setProperty('--mint', C.stations[current.destination].color);
  $('route-name').textContent = C.stations[current.destination].name.toUpperCase(); $('flight-objective').textContent = current.enemies ? 'Protect your cargo. Clear hostiles before docking.' : 'Follow the transit lane. Docking is automatic on arrival.';
  announce(current.legal ? 'Cargo secured. Transponder clear.' : 'Contraband loaded. Stay sharp.'); hud(); tone(280, .4);
}
function routeClear() { return !!current && spawned >= current.enemies && resolved >= current.enemies && enemies.every(e => !VoidStory.hostile(e)); }
function destinationVisible() { return typeof flight!=='undefined'&&flight.route?flight.route.phase==='arrived':routeClear() && elapsed / current.duration > .72; }
function arrive() {
  if (mode !== 'play' || !routeClear() || elapsed < current.duration || (current.enemies && approachTime < VoidWarp.config.approachSeconds)) return;
  const reward = C.complete(state); if (!reward) return;current.repairCharged=reward.repairCharged;
  VoidAudio.event('dock');mode = 'arrival'; clearInput(); save(); flightUI(false); hud();
  const station = C.stations[state.location];
  let story = reward.reward ? `The cargo checks out. ${reward.reward} credits transfer to your account.` : 'Magnetic clamps catch the Kestrel. Engines down. For a moment, the ship is quiet.';
  if(reward.repairCharged)story+=` Dock servicing costs ${reward.repairCharged} credits.`;
  if (reward.gunReward) story += ' Iona Vale meets you at the loading ramp. “You came through when nobody else would. Take these pulse cannons. Next time, come back alive.” Her crew installs your MK 2 guns. Equipment stores and new contracts are now open.';
  else if (state.quest === 'return') story += ' “Tell Rook you kept your word,” the receiver says. Time to head back to Meridian.';
  panel('ARRIVAL CONFIRMED / ' + station.name.toUpperCase(), reward.reward ? 'Cargo <em>delivered.</em>' : 'Welcome<br><em>aboard.</em>', `<p>${story}</p>${reward.reward ? `<div class="manifest">${row('Payment received', '+' + reward.reward + ' CR')}${reward.gunReward ? row('Customer reward', 'MK 2 pulse cannons installed') : ''}</div>` : ''}`, button('EXIT TO SPACE STATION →', 'dock'), shipCard()); tone(620, .3);
}
function hurt(amount) { if (mode !== 'play' || damageTime > 0) return; hp = Math.max(0, hp - amount); damageTime = .45; hud(); tone(65, .25, 'sawtooth'); if (!hp) { mode = 'over'; clearInput(); flightUI(false); panel('DISTRESS BEACON / RECOVERY CREW DISPATCHED', 'One more<br><em>chance.</em>', '<p>The recovery crew pulls your ship out of the lane. Your cargo and upgrades are safe. Retry this route with a repaired hull. No credits are lost.</p>', button('RETRY ROUTE →', 'launch') + (state.quest === 'open' ? button('RETURN TO DOCK', 'dock', true) : ''), shipCard()); } }
function pause() { openGameMenu(); }

screen.addEventListener('click', event => {
  const action = event.target.closest('button')?.dataset.action; if (!action) return;
  if (action === 'launch') launch();
  else if (['dock', 'bar', 'shop'].includes(action)) dock(action);
  else if (action === 'accept' || action.startsWith('contract:')) { if (C.accept(state, action.split(':')[1])) { save(); dock(); announce('Cargo loaded. Ready for departure.'); } }
  else if (action.startsWith('buy:')) { if (mode === 'dock' && C.buy(state, action.split(':')[1])) { save(); hud(); shop(); tone(500, .2); announce('Upgrade installed.'); } }

});
function newJourney(){
  state=C.fresh();current=null;trialGear=null;devMissileTrial=false;clearInput();
  elapsed=approachTime=shot=spawnClock=spawned=resolved=damageTime=0;
  enemies=[];bullets=[];hostile=[];sparks=[];missionObjects=[];
  shieldHP=shieldDelay=driveTime=driveCooldown=droneClock=0;
  hp=C.stats(state).hull;VoidCombatEffects.reset();resetMissileFlight();
  VoidStory.emit(state,'campaignStart');save();hud();updateEquipmentHud();workshopOpening();
}
$('pause').onclick = pause;
addEventListener('blur', () => { clearInput(); if (mode === 'play') pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'play') pause(); });
function aim(e) { const s = Math.min(W, H) * .9 / 14; target = { x: Math.max(-9, Math.min(9, (e.clientX - W / 2) / s)), y: Math.max(-5, Math.min(5, (e.clientY - H * .48) / s)) }; }
canvas.onpointerdown = e => { if (mode !== 'play' || e.button!==0) return; canvas.setPointerCapture(e.pointerId); pointer = true; firing = true; aim(e); };
canvas.onpointermove = e => { if (mode === 'play' && (e.pointerType === 'mouse' || pointer)) aim(e); };
canvas.onpointerup = canvas.onpointercancel = () => { pointer = false; firing = false; };
$('fire').onpointerdown = e => { if (mode !== 'play') return; e.preventDefault(); $('fire').setPointerCapture(e.pointerId); touchFiring = true; };
$('fire').onpointerup = $('fire').onpointercancel = () => touchFiring = false;
function burst(e,color='#ffbd69',kind='ship') { VoidCombatEffects.explode(e,kind);VoidAudio.event('explosion',VoidShips.get(state),e,flightBasis()); }
function spawnEnemy() {
 const i=spawned++,tier=current.tier;
 const heavy=tier>=2&&(i===current.enemies-1||i%5===4);
 const interceptor=!heavy&&tier>=1&&i%3!==0;
 const armor=heavy?12+tier*2:interceptor?3+tier*1.6:2+tier*1.2;
 enemies.push({relationship:'hostile',x:(Math.random()-.5)*12,y:(Math.random()-.5)*6,z:115,phase:Math.random()*Math.PI*2,fire:1.1+Math.random()*.7,armor,maxArmor:armor,size:heavy?1.8:1,heavy,interceptor,className:heavy?'gunship':interceptor?'interceptor':'raider',age:0});
 if(heavy)announce('Heavy gunship incoming.');else if(i===0)announce('Hostile activity detected.');
}
function update(dt) {
  if (mode === 'pause') return;
  time += dt; noticeTime -= dt; if (noticeTime <= 0) $('notice').textContent = '';
  damageTime = Math.max(0, damageTime - dt);
  for (const s of stars) { s.z -= dt * (mode === 'play' ? 25 : reducedMotion ? 0 : 3); if (s.z < 1) s.z += 260; }
}

function project(x,y,z){const s=Math.min(W,H)*.9/Math.max(z,1);return{x:W/2+(x-player.x*.12)*s,y:H*.48+(y-player.y*.12)*s,s}}
const verts=[[0,-.35,-2],[-1.8,.1,1.2],[-.6,.2,.7],[0,.55,1.1],[.6,.2,.7],[1.8,.1,1.2],[0,-.65,.4]];const faces=[[0,1,2],[0,2,6],[0,6,4],[0,4,5],[2,3,4],[1,3,2],[3,5,4]];
function ship(x,y,z,size,color,rotation=0){const ps=verts.map(v=>{let a=v[0]*Math.cos(rotation)-v[1]*Math.sin(rotation),b=v[0]*Math.sin(rotation)+v[1]*Math.cos(rotation);return project(x+a*size,y+b*size,z+v[2]*size)});ctx.lineWidth=1;faces.forEach((f,i)=>{ctx.beginPath();f.forEach((v,j)=>j?ctx.lineTo(ps[v].x,ps[v].y):ctx.moveTo(ps[v].x,ps[v].y));ctx.closePath();ctx.fillStyle=['#11263d','#184053','#102536','#162c45'][i%4];ctx.fill();ctx.strokeStyle=color;ctx.stroke()});const p=project(x,y+.25*size,z+size);ctx.shadowBlur=20;ctx.shadowColor=color;ctx.fillStyle=color;ctx.fillRect(p.x-3*p.s*size/10,p.y,6*p.s*size/10,Math.max(3,p.s*size*(.3+Math.random()*.4)));ctx.shadowBlur=0}
let stationScene;
function draw() {
  ctx.clearRect(0,0,W,H);
  if(screen.dataset.scene)return; // Interiors own their background; no exterior underneath.
  ctx.fillStyle = '#030713'; ctx.fillRect(0, 0, W, H);
  const dest = current && (mode === 'play' || mode === 'pause') ? current.destination : state.location;
  const color = C.stations[dest].color;
  const glow = ctx.createRadialGradient(W * .7, H * .4, 0, W * .7, H * .4, W * .7);
  glow.addColorStop(0, dest === 'undertow' ? '#2b1449' : dest === 'foundry' ? '#38222c' : '#122d43'); glow.addColorStop(.5, '#0b1326'); glow.addColorStop(1, '#030713'); ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
  drawDeepSpace(dest);
  drawPlanets(dest);
  drawAsteroids();
  for (const s of stars) { const p = project(s.x, s.y, s.z); ctx.globalAlpha = Math.min(1, 25 / s.z + .15); ctx.fillStyle = s.z % 3 < 1 ? color : '#b5cce6'; ctx.fillRect(p.x, p.y, Math.min(2, p.s * .07), Math.max(1, p.s * (mode === 'play' && !reducedMotion ? .32 : .08))); } ctx.globalAlpha = 1;
  stationScene(color); if (W > 800) ship(6, 3.4, 19, 1.1, color, -.1);
  $('flash').style.opacity = reducedMotion ? 0 : damageTime * .8;
}
let last = performance.now();
function loop(now) { const dt = Math.min((now - last) / 1000, .04); last = now; update(dt); draw(); requestAnimationFrame(loop); }
// bootstrap.js starts the only animation loop after all modules are registered.
