/* VOID//RUNNER: canvas flight and station presentation. No external dependencies. */
'use strict';
const C = VoidCampaign, $ = id => document.getElementById(id);
const canvas = $('space'), ctx = canvas.getContext('2d'), screen = $('screen');
const SAVE_KEY = 'void-runner-campaign-v1';
let state = C.fresh(), hasSave = false, saveAvailable = true;
try { const restored = C.restore(localStorage.getItem(SAVE_KEY)); if (restored) { state = restored; hasSave = true; } } catch { saveAvailable = false; }
let mode = 'title', view = 'dock', W, H, D, time = 0, muted = true, audio;
let approachTime = 0;
let current = null, elapsed = 0, hp = 100, shot = 0, spawnClock = 0, spawned = 0, resolved = 0, damageTime = 0, noticeTime = 0;
let enemies = [], bullets = [], hostile = [], sparks = [], target = null, pointer = false, firing = false, touchFiring = false;
canvas.tabIndex = 0;
const player = { x: 0, y: 0, vx: 0, vy: 0, bank: 0, pitch: 0 }, keys = new Set();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let seed = 734;
function random() { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646; }
const stars = Array.from({ length: 320 }, () => ({ x: (random() - .5) * 300, y: (random() - .5) * 190, z: random() * 260 + 1 }));
function resize() { W = innerWidth; H = innerHeight; D = Math.min(devicePixelRatio || 1, 2); canvas.width = W * D; canvas.height = H * D; ctx.setTransform(D, 0, 0, D, 0, 0); }
addEventListener('resize', resize); resize();
function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); hasSave = true; } catch { saveAvailable = false; announce('Storage unavailable. Keep this tab open to retain progress.'); } }
function announce(text) { $('notice').textContent = text; noticeTime = 4; }
function tone(freq, duration, type = 'sine', volume = .025) { if (muted) return; try { audio ??= new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); const o = audio.createOscillator(), g = audio.createGain(); o.type = type; o.frequency.setValueAtTime(freq, audio.currentTime); o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * .4), audio.currentTime + duration); g.gain.setValueAtTime(volume, audio.currentTime); g.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration); o.connect(g); g.connect(audio.destination); o.start(); o.stop(audio.currentTime + duration); } catch {} }
function button(label, action, quiet = false, disabled = false) { return `<button data-action="${action}" class="${quiet ? 'quiet' : ''}" ${disabled ? 'disabled' : ''}>${label}</button>`; }
function row(label, value) { return `<div class="data-row"><span>${label}</span><strong>${value}</strong></div>`; }
function panel(eyebrow, title, body, actions, aside = '') { screen.innerHTML = `<div class="layout"><section class="panel lead"><div class="eyebrow">${eyebrow}</div><h1 tabindex="-1">${title}</h1>${body}<div class="actions">${actions}</div></section>${aside ? `<aside class="side-panel">${aside}</aside>` : ''}</div>`; screen.classList.remove('hidden'); screen.querySelector('h1')?.focus({ preventScroll: true }); }
function shipCard() { const s = C.stats(state); return `<div class="eyebrow">YOUR SHIP</div><h2>KESTREL / 01</h2><p>Elias’s old courier. Every repair bears your work. Now yours.</p>${row('Pulse cannons', 'MK ' + (state.upgrades.guns + 1))}${row('Hull integrity', s.hull)}${row('Vector thrusters', 'MK ' + (state.upgrades.engines + 1))}<p class="fine">${saveAvailable ? 'Progress saves on this browser at departures, deliveries, and purchases. Hull is serviced at every dock.' : 'Browser saving is unavailable. Progress lasts while this tab stays open.'}</p>`; }
function hud() { $('credits').textContent = state.credits.toLocaleString(); $('reputation').textContent = `${state.reputation} / ${state.reputation < 2 ? 'Unknown' : state.reputation < 5 ? 'Reliable' : state.reputation < 10 ? 'Connected' : 'Trusted'}`; const max = C.stats(state).hull; $('hull').style.width = Math.max(0, hp / max * 100) + '%'; $('hull-number').textContent = `${Math.ceil(hp)} / ${max}`; $('weapon').textContent = `PULSE MK ${state.upgrades.guns + 1} / THRUST MK ${state.upgrades.engines + 1}`; }
function title() { mode = 'title'; hud(); panel('CHAPTER 01 / A SHIP OF YOUR OWN', 'Your ship.<br>Your <em>next move.</em>', '<p>The transfer clears. An old courier called Kestrel is finally yours. Meridian Station glows ahead. You have 100 credits, an empty hold, and no one waiting for you.</p><p>There is always work at the Dead Channel. You just have to get there.</p>', button(hasSave ? 'CONTINUE JOURNEY →' : 'TAKE THE HELM →', 'continue') + (hasSave ? button('NEW JOURNEY', 'reset-prompt', true) : ''), shipCard()); }
function dock(tab = 'dock') {
  mode = 'dock'; view = tab; clearInput(); flightUI(false); hud();
  const station = C.stations[state.location]; document.documentElement.style.setProperty('--mint', station.color);
  if (tab === 'shop') return shop();
  if (tab === 'bar') return bar();
  const f = C.flight(state);
  let copy = '', actions = '';
  if (state.quest === 'legal-offer') { copy = 'Your first docking is behind you. The concourse smells of hot wiring and recycled air. A bartender points toward a broker sitting beneath a broken neon sign.'; actions = button('GO TO THE BAR →', 'bar'); }
  else if (state.quest === 'illegal-offer') { copy = 'Back at Meridian. Rook has heard about the delivery. The same booth, two fresh drinks, and an offer that pays better than water filters.'; actions = button('MEET ROOK AT THE BAR →', 'bar'); }
  else if (state.quest === 'return') { copy = 'The filtration parts are unloaded and your payment has cleared. Rook asked you to come back to Meridian once the job was done.'; actions = button('RETURN TO MERIDIAN →', 'launch'); }
  else if (f) { copy = `Your cargo is secured: ${f.cargo.toLowerCase()}. The destination is ${C.stations[f.destination].name}. Dock control has cleared you for departure.`; actions = button('LAUNCH DELIVERY →', 'launch'); }
  else { copy = 'Dock crews refuel the Kestrel while new contracts arrive on your comm. Your name is starting to travel ahead of you.'; actions = button('FIND A CONTRACT →', 'bar'); }
  if (state.quest === 'open') actions += button('EQUIPMENT STORE', 'shop', true) + button('BAR / CONTRACTS', 'bar', true);
  panel(station.district, station.name.replace(' ', '<br>'), `<span class="tag">DOCKED / HULL SERVICED</span><p>${copy}</p>`, actions, shipCard());
}
function bar() {
  const station = C.stations[state.location];
  if (state.quest === 'legal-offer' || state.quest === 'illegal-offer') {
    const illegal = state.quest === 'illegal-offer';
    panel(`${station.name.toUpperCase()} / THE DEAD CHANNEL`, illegal ? 'Trust has<br>a <em>price.</em>' : 'An honest<br><em>living.</em>', `<div class="contact">ROOK / INDEPENDENT CARGO BROKER</div><p class="quote">${illegal ? '“You delivered. No excuses, no missing cargo. I have another run: memory wafers, no registration. Corporate law calls them contraband. Undertow calls them a lifeline. Eight hundred credits. More heat this time.”' : '“New ship? Then you need a first paycheck. Filtration parts to Kepler Exchange. Licensed cargo, clean paperwork. Three hundred and fifty credits. Watch the lane — even honest freight attracts thieves.”'}</p><span class="tag ${illegal ? 'illegal' : ''}">${illegal ? 'ILLEGAL CARGO / HIGHER RISK' : 'LEGAL CARGO / LOW RISK'}</span><div class="manifest">${row('Destination', illegal ? 'Undertow Dock' : 'Kepler Exchange')}${row('Payment', illegal ? '800 CR' : '350 CR')}${row('Reputation', illegal ? '+3' : '+2')}</div>`, button('ACCEPT THE JOB →', 'accept') + button('BACK TO DOCK', 'dock', true), `<div class="eyebrow">${station.bar.toUpperCase()}</div><h2>${illegal ? 'The same booth.' : 'Your first contact.'}</h2><p>Magenta light spills across the table. Behind Rook, the docking windows frame a slow procession of freighters.</p><p class="fine">Accepting loads the cargo. You launch when ready from the dock.</p>`);
    return;
  }
  if (state.quest !== 'open') return dock();
  screen.innerHTML = `<section class="shop-layout panel"><div class="shop-heading"><div><div class="eyebrow">${station.name.toUpperCase()} / ${station.bar.toUpperCase()}</div><h1>Word gets around.</h1></div>${button('BACK TO DOCK', 'dock', true)}</div><p>${state.contract ? 'Your current cargo is already loaded. Complete the delivery before taking another job.' : 'Pick a contract. Build your reputation to unlock more dangerous work.'}</p><div class="shop-grid">${C.contracts.map(c => `<article class="card"><span class="tag ${c.legal ? '' : 'illegal'}">${c.legal ? 'LEGAL' : 'ILLEGAL'} / LEVEL ${c.tier + 1}</span><h2>${c.name}</h2><div class="contact">${c.contact.toUpperCase()}</div><p>${c.briefing}</p>${row('Cargo', c.cargo)}${row('Destination', C.stations[c.destination === state.location ? 'meridian' : c.destination].name)}${row('Payment', c.reward + ' CR')}${row('Reputation', '+' + c.rep)}${button(state.reputation < c.requirement ? `REQUIRES ${c.requirement} REP` : state.contract === c.id ? 'CARGO LOADED' : 'ACCEPT CONTRACT', 'contract:' + c.id, false, !!state.contract || state.reputation < c.requirement)}</article>`).join('')}</div><p class="fine">Contracts can be repeated. Each route has a fixed difficulty; earn credits on familiar routes before moving into harder sectors.</p></section>`;
}
function shop() {
  const unlocked=state.quest==='open';
  screen.innerHTML = `<section class="shop-layout panel"><div class="shop-heading"><div><div class="eyebrow">EQUIPMENT STORE / ${state.credits.toLocaleString()} CR AVAILABLE</div><h1>Build your <em>ship.</em></h1></div>${button('BACK TO DOCK','dock',true)}</div><p>${unlocked?'Buy tiers in order. Prices shown are per upgrade.':'Browse now. Purchases unlock after Rook’s second delivery.'}</p><div class="shop-grid">${Object.entries(C.upgrades).map(([key,u])=>`<article class="card"><h2>${u.name}</h2><p>${u.description}</p>${u.prices.map((cost,i)=>{const installed=state.upgrades[key]>i,next=state.upgrades[key]===i;const benefit=key==='armor'?(100+(i+1)*30)+' hull':key==='guns'?(1+(i+1)*.65).toFixed(2)+' damage / bolt':(10+(i+1)*2.5)+' handling';const label=installed?'INSTALLED':!unlocked?'UNLOCK AFTER SECOND DELIVERY':!next?'REQUIRES MK '+(i+1):state.credits<cost?'NEED '+(cost-state.credits)+' MORE CR':'INSTALL / '+cost+' CR';return `<div class="upgrade-tier">${row('MK '+(i+2),cost.toLocaleString()+' CR')}<p class="fine">${benefit}${!installed&&state.credits<cost?' · Save '+(cost-state.credits).toLocaleString()+' more CR':''}</p>${button(label,'buy:'+key,false,installed||!unlocked||!next||state.credits<cost)}</div>`;}).join('')}</article>`).join('')}</div><p class="fine">Delivery pays once cargo arrives. Repairs are free. Rook’s second delivery also awards MK 2 pulse cannons.</p></section>`;
}
function flightUI(on) { $('flight-hud').classList.toggle('hidden', !on); $('touch-controls').classList.toggle('hidden', !on); $('pause').classList.toggle('hidden', !on); if (!on) $('pause').textContent = 'PAUSE'; }
function clearInput() { keys.clear(); pointer = false; firing = false; touchFiring = false; target = null; }
function launch() {
  current = C.flight(state); if (!current) return;
  save(); clearInput(); mode = 'play'; elapsed = 0; approachTime = 0; shot = 0; spawned = 0; resolved = 0; spawnClock = 5; damageTime = 0; hp = C.stats(state).hull;
  enemies = []; bullets = []; hostile = []; sparks = []; VoidFlightPhysics.reset(player);
  screen.classList.add('hidden'); canvas.focus({ preventScroll: true }); flightUI(true); $('pause').textContent = 'PAUSE'; document.documentElement.style.setProperty('--mint', C.stations[current.destination].color);
  $('route-name').textContent = C.stations[current.destination].name.toUpperCase(); $('flight-objective').textContent = current.enemies ? 'Protect your cargo. Clear hostiles before docking.' : 'Follow the transit lane. Docking is automatic on arrival.';
  announce(state.quest === 'arrival' ? 'WASD / arrows to steer. Hold Space to fire. Touch: drag to move and fire.' : current.legal ? 'Cargo secured. Transponder clear.' : 'Contraband loaded. Stay sharp.'); hud(); tone(280, .4);
}
function routeClear() { return !!current && spawned >= current.enemies && resolved >= current.enemies && enemies.every(e => e.dead); }
function destinationVisible() { return routeClear() && elapsed / current.duration > .72; }
function arrive() {
  if (mode !== 'play' || !routeClear() || elapsed < current.duration || (current.enemies && approachTime < 3)) return;
  const reward = C.complete(state); if (!reward) return;
  mode = 'arrival'; clearInput(); save(); flightUI(false); hud();
  const station = C.stations[state.location];
  let story = reward.reward ? `The cargo checks out. ${reward.reward} credits transfer to your account. Your reputation increases by ${reward.rep}.` : 'Magnetic clamps catch the Kestrel. Engines down. For a moment, the ship is quiet.';
  if (reward.gunReward) story += ' Iona Vale meets you at the loading ramp. “You came through when nobody else would. Take these pulse cannons. Next time, come back alive.” Her crew installs your MK 2 guns. Equipment stores and new contracts are now open.';
  else if (state.quest === 'return') story += ' “Tell Rook you kept your word,” the receiver says. Time to head back to Meridian.';
  panel('ARRIVAL CONFIRMED / ' + station.name.toUpperCase(), reward.reward ? 'Cargo <em>delivered.</em>' : 'Welcome<br><em>aboard.</em>', `<p>${story}</p>${reward.reward ? `<div class="manifest">${row('Payment received', '+' + reward.reward + ' CR')}${row('Reputation earned', '+' + reward.rep)}${reward.gunReward ? row('Customer reward', 'MK 2 pulse cannons installed') : ''}</div>` : ''}`, button('ENTER ' + station.name.toUpperCase() + ' →', 'dock'), shipCard()); tone(620, .3);
}
function hurt(amount) { if (mode !== 'play' || damageTime > 0) return; hp = Math.max(0, hp - amount); damageTime = .45; hud(); tone(65, .25, 'sawtooth'); if (!hp) { mode = 'over'; clearInput(); flightUI(false); panel('DISTRESS BEACON / RECOVERY CREW DISPATCHED', 'One more<br><em>chance.</em>', '<p>The recovery crew pulls your ship out of the lane. Your cargo and upgrades are safe. Retry this route with a repaired hull. No credits or reputation are lost.</p>', button('RETRY ROUTE →', 'launch') + (state.quest === 'open' ? button('RETURN TO DOCK', 'dock', true) : ''), shipCard()); } }
function pause() { if (mode === 'play') { mode = 'pause'; clearInput(); $('pause').textContent = 'RESUME'; panel('FLIGHT PAUSED', 'Holding<br><em>position.</em>', '<p>Your route is paused. Resume when you are ready.</p>', button('RESUME FLIGHT →', 'resume')); } else if (mode === 'pause') { mode = 'play'; screen.classList.add('hidden'); canvas.focus({ preventScroll: true }); $('pause').textContent = 'PAUSE'; } }
screen.addEventListener('click', event => {
  const action = event.target.closest('button')?.dataset.action; if (!action) return;
  if (action === 'continue') { if (state.quest === 'inheritance') inheritance(); else if (state.quest === 'arrival') launch(); else dock(); }
  else if (action === 'launch') launch();
  else if (action === 'resume') pause();
  else if (['dock', 'bar', 'shop'].includes(action)) dock(action);
  else if (action === 'accept' || action.startsWith('contract:')) { if (C.accept(state, action.split(':')[1])) { save(); dock(); announce('Cargo loaded. Ready for departure.'); } }
  else if (action.startsWith('buy:')) { if (mode === 'dock' && C.buy(state, action.split(':')[1])) { save(); hud(); shop(); tone(500, .2); announce('Upgrade installed.'); } }
  else if (action === 'reset-prompt') panel('NEW JOURNEY', 'Start <em>again?</em>', '<p>This replaces the campaign saved in this browser, including credits, reputation, and upgrades.</p>', button('KEEP CURRENT JOURNEY', 'cancel-reset') + button('REPLACE SAVE', 'reset', true));
  else if (action === 'cancel-reset') title();
  else if (action === 'reset') { state = C.fresh(); save(); inheritance(); }
});
$('pause').onclick = pause;
$('sound').onclick = () => { muted = !muted; $('sound').textContent = muted ? 'SOUND OFF' : 'SOUND ON'; $('sound').setAttribute('aria-pressed', String(!muted)); tone(550, .1); if (mode === 'play') canvas.focus({ preventScroll: true }); };
addEventListener('keydown', e => { if (mode !== 'play' && mode !== 'pause') return; if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code) && e.target.tagName !== 'BUTTON') e.preventDefault(); if (e.target.tagName !== 'BUTTON') keys.add(e.code); if (e.code === 'KeyP' && !e.repeat) pause(); });
addEventListener('keyup', e => keys.delete(e.code));
addEventListener('blur', () => { clearInput(); if (mode === 'play') pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'play') pause(); });
function aim(e) { const s = Math.min(W, H) * .9 / 14; target = { x: Math.max(-9, Math.min(9, (e.clientX - W / 2) / s)), y: Math.max(-5, Math.min(5, (e.clientY - H * .48) / s)) }; }
canvas.onpointerdown = e => { if (mode !== 'play') return; canvas.setPointerCapture(e.pointerId); pointer = true; firing = true; aim(e); };
canvas.onpointermove = e => { if (mode === 'play' && (e.pointerType === 'mouse' || pointer)) aim(e); };
canvas.onpointerup = canvas.onpointercancel = () => { pointer = false; firing = false; };
$('fire').onpointerdown = e => { if (mode !== 'play') return; e.preventDefault(); $('fire').setPointerCapture(e.pointerId); touchFiring = true; };
$('fire').onpointerup = $('fire').onpointercancel = () => touchFiring = false;
function burst(e, color = '#ffbd69') { for (let i = 0; i < 26; i++) sparks.push({ x: e.x, y: e.y, z: e.z, vx: (Math.random() - .5) * 12, vy: (Math.random() - .5) * 12, vz: (Math.random() - .5) * 14, life: .8, color }); tone(90, .2, 'square'); }
function spawnEnemy() {
 const i=spawned++,tier=current.tier;
 const heavy=tier>=2&&(i===current.enemies-1||i%5===4);
 const interceptor=!heavy&&tier>=1&&i%3!==0;
 const armor=heavy?12+tier*2:interceptor?3+tier*1.6:2+tier*1.2;
 enemies.push({x:(Math.random()-.5)*12,y:(Math.random()-.5)*6,z:115,phase:Math.random()*Math.PI*2,fire:1.1+Math.random()*.7,armor,maxArmor:armor,size:heavy?1.8:1,heavy,interceptor,className:heavy?'gunship':interceptor?'interceptor':'raider',age:0});
 if(heavy)announce('Heavy gunship incoming.');else if(i===0)announce(current.enemies===1?'Lone raider incoming.':'Hostile squadron incoming.');
}
function update(dt) {
  if (mode === 'pause') return;
  time += dt; noticeTime -= dt; if (noticeTime <= 0) $('notice').textContent = '';
  damageTime = Math.max(0, damageTime - dt);
  for (const s of stars) { s.z -= dt * (mode === 'play' ? 25 : reducedMotion ? 0 : 3); if (s.z < 1) s.z += 260; }
  if (mode !== 'play') return;
  elapsed += dt; const stats = C.stats(state);
  const dx = Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft'));
  const dy = Number(keys.has('KeyS') || keys.has('ArrowDown')) - Number(keys.has('KeyW') || keys.has('ArrowUp'));
  if(dx||dy)target=null;
  const scale=Math.min(W,H)*.9/14;
  const bounds={x:Math.min(9,Math.max(1,(W/2-50)/scale)),y:Math.min(5,Math.max(1,(H*.42-50)/scale))};
  VoidFlightPhysics.step(player,{dx,dy,target},dt,stats.speed,bounds);
  shot -= dt;
  if ((keys.has('Space') || firing || touchFiring) && shot <= 0) { shot = stats.cooldown; for (const offset of [-.28, .28]) bullets.push({ x: player.x + offset, y: player.y, z: 15, previousZ: 15, damage: stats.damage }); tone(600, .055); }
  spawnClock -= dt;
  if (spawned < current.enemies && spawnClock <= 0 && enemies.length < 4 + Math.floor(current.tier)) { const group=current.tier>=4?3:current.tier>=1?2:1; for(let i=0;i<group&&spawned<current.enemies&&enemies.length<4+Math.floor(current.tier);i++)spawnEnemy(); spawnClock = Math.max(1.2, (current.duration - 12) / Math.max(1, current.enemies) * group); }
  for (const b of bullets) { b.previousZ = b.z; b.z += dt * 105; }
  for (const e of enemies) {
    e.age += dt; e.z = Math.max(e.heavy ? 46 : 35, e.z - dt * (10 + current.tier * 2));
    e.x += Math.sin(time * .9 + e.phase) * dt * (e.heavy ? .6 : e.interceptor ? 2 + current.tier * .15 : 1.2); e.x = Math.max(-7, Math.min(7, e.x)); e.fire -= dt;
    if (e.fire <= 0 && e.z < 95) { e.fire = Math.max(.7, 2.6 - current.tier * .3 - (e.interceptor ? .2 : 0)); const flightTime = Math.max(.4, (e.z - 14) / 32); for(const spread of (e.heavy ? [-.65,.65] : [0])) hostile.push({ x: e.x + spread, y: e.y, z: e.z, vx: (player.x - e.x + spread) / flightTime, vy: (player.y - e.y) / flightTime, damage: e.heavy ? 20 : 10 + current.tier * 1.6 }); }
    for (const b of bullets) if (!b.dead && !e.dead && b.previousZ <= e.z + 3 && b.z >= e.z - 3 && Math.hypot(b.x - e.x, b.y - e.y) < 1.35 * e.size) { b.dead = true; e.armor -= b.damage; if (e.armor <= 0) { e.dead = true; resolved++; burst(e); } }
    // Surviving a pursuer also clears the route; new pilots cannot get stuck indefinitely.
  }
  for (const b of hostile) { b.z -= dt * 32; b.x += b.vx * dt; b.y += b.vy * dt; if (b.z <= 15 && !b.dead) { if (Math.hypot(b.x - player.x, b.y - player.y) < .75) hurt(b.damage); b.dead = true; } }
  enemies = enemies.filter(e => !e.dead); bullets = bullets.filter(b => !b.dead && b.z < 155); hostile = hostile.filter(b => !b.dead);
  for (const s of sparks) { s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt; } sparks = sparks.filter(s => s.life > 0);
  const progress = Math.min(1, elapsed / current.duration);
  $('progress').style.width = progress * 100 + '%'; $('route-status').textContent = `${Math.floor(progress * 100)}% / ${Math.max(0, current.enemies - resolved)} HOSTILES REMAINING`;
  if (destinationVisible()) approachTime += dt;
  if (progress === 1 && !routeClear()) $('flight-objective').textContent = 'Destroy all hostiles to unlock the dock.';
  if (routeClear()) $('flight-objective').textContent = 'Route clear. Approaching delivery dock.';
  if (mode === 'play' && elapsed >= current.duration && routeClear() && (!current.enemies || approachTime >= 3)) arrive();
}
function project(x,y,z){const s=Math.min(W,H)*.9/Math.max(z,1);return{x:W/2+(x-player.x*.12)*s,y:H*.48+(y-player.y*.12)*s,s}}
const verts=[[0,-.35,-2],[-1.8,.1,1.2],[-.6,.2,.7],[0,.55,1.1],[.6,.2,.7],[1.8,.1,1.2],[0,-.65,.4]];const faces=[[0,1,2],[0,2,6],[0,6,4],[0,4,5],[2,3,4],[1,3,2],[3,5,4]];
function ship(x,y,z,size,color,rotation=0){const ps=verts.map(v=>{let a=v[0]*Math.cos(rotation)-v[1]*Math.sin(rotation),b=v[0]*Math.sin(rotation)+v[1]*Math.cos(rotation);return project(x+a*size,y+b*size,z+v[2]*size)});ctx.lineWidth=1;faces.forEach((f,i)=>{ctx.beginPath();f.forEach((v,j)=>j?ctx.lineTo(ps[v].x,ps[v].y):ctx.moveTo(ps[v].x,ps[v].y));ctx.closePath();ctx.fillStyle=['#11263d','#184053','#102536','#162c45'][i%4];ctx.fill();ctx.strokeStyle=color;ctx.stroke()});const p=project(x,y+.25*size,z+size);ctx.shadowBlur=20;ctx.shadowColor=color;ctx.fillStyle=color;ctx.fillRect(p.x-3*p.s*size/10,p.y,6*p.s*size/10,Math.max(3,p.s*size*(.3+Math.random()*.4)));ctx.shadowBlur=0}
function stationScene(color) {
  const cx = W * .76, cy = H * .48, radius = Math.min(W, H) * .3;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-.18);
  ctx.strokeStyle = '#344f68'; ctx.lineWidth = radius * .09;
  ctx.beginPath(); ctx.ellipse(0, 0, radius, radius * .55, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = '#162534'; ctx.lineWidth = radius * .045; ctx.stroke();
  ctx.strokeStyle = color; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.ellipse(0, 0, radius * 1.06, radius * .59, 0, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; const x = Math.cos(a) * radius, y = Math.sin(a) * radius * .55;
    ctx.strokeStyle = '#486079'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x * .22, y * .22); ctx.lineTo(x, y); ctx.stroke();
    ctx.fillStyle = '#142639'; ctx.strokeStyle = '#527589'; ctx.lineWidth = 1; ctx.fillRect(x - 15, y - 12, 30, 24); ctx.strokeRect(x - 15, y - 12, 30, 24);
    ctx.fillStyle = i % 3 ? color : '#ffc681'; ctx.fillRect(x - 10, y - 3, 20, 3);
  }
  ctx.fillStyle = '#162c40'; ctx.strokeStyle = color; ctx.fillRect(-radius * .13, -radius * .62, radius * .26, radius * 1.24); ctx.strokeRect(-radius * .13, -radius * .62, radius * .26, radius * 1.24);
  for (let i = -5; i <= 5; i++) { ctx.fillStyle = i % 2 ? '#ffa9ed' : color; ctx.fillRect(-radius * .085, i * radius * .1, radius * .17, 2); }
  ctx.restore();
}
function draw() {
  ctx.fillStyle = '#030713'; ctx.fillRect(0, 0, W, H);
  const dest = current && (mode === 'play' || mode === 'pause') ? current.destination : state.location;
  const color = C.stations[dest].color;
  const glow = ctx.createRadialGradient(W * .7, H * .4, 0, W * .7, H * .4, W * .7);
  glow.addColorStop(0, dest === 'undertow' ? '#2b1449' : dest === 'foundry' ? '#38222c' : '#122d43'); glow.addColorStop(.5, '#0b1326'); glow.addColorStop(1, '#030713'); ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
  drawDeepSpace(dest);
  drawPlanets(dest);
  drawAsteroids();
  for (const s of stars) { const p = project(s.x, s.y, s.z); ctx.globalAlpha = Math.min(1, 25 / s.z + .15); ctx.fillStyle = s.z % 3 < 1 ? color : '#b5cce6'; ctx.fillRect(p.x, p.y, Math.min(2, p.s * .07), Math.max(1, p.s * (mode === 'play' && !reducedMotion ? .32 : .08))); } ctx.globalAlpha = 1;
  if (mode === 'play' || mode === 'pause') {
    for (let i = 7; i >= 0; i--) { const z = 25 + i * 25 - (time * (reducedMotion ? 0 : 9) % 25); ctx.strokeStyle = i % 2 ? '#214b5e66' : color + '30'; ctx.lineWidth = 1; ctx.beginPath(); for (let j = 0; j <= 8; j++) { const a = j * Math.PI / 4, p = project(Math.cos(a) * 22, Math.sin(a) * 14, z); j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); } ctx.stroke(); }
    if (destinationVisible()) { ctx.save(); ctx.globalAlpha = 1; stationScene(color); ctx.restore(); }
    [...enemies].sort((a, b) => b.z - a.z).forEach(e => { ship(e.x, e.y, e.z, e.size, e.heavy ? '#ffad63' : '#ff65b8', Math.sin(time + e.phase) * .2, e.className); const p = project(e.x, e.y - e.size * 2.3, e.z); ctx.fillStyle = '#311c35'; ctx.fillRect(p.x - 20, p.y, 40, 3); ctx.fillStyle = '#ff65b8'; ctx.fillRect(p.x - 20, p.y, Math.max(0, e.armor / e.maxArmor) * 40, 3); });
    ctx.shadowBlur = 12;
    for (const list of [bullets, hostile]) for (const b of list) { const p = project(b.x, b.y, b.z), q = project(b.x, b.y, b.z + 5); ctx.strokeStyle = list === bullets ? state.upgrades.guns >= 1 ? '#a9ff6b' : '#69ffe1' : '#ff4787'; ctx.shadowColor = ctx.strokeStyle; ctx.lineWidth = Math.max(2, p.s * .05); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y + 2); ctx.stroke(); }
    for (const s of sparks) { const p = project(s.x, s.y, s.z); ctx.fillStyle = s.color; ctx.globalAlpha = Math.max(0, s.life / .8); ctx.fillRect(p.x, p.y, 3, 3); } ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    ship(player.x, player.y, 14, .55, state.upgrades.armor ? '#8ce4ff' : '#58ffe1', -player.x * .025);
    // Upgrade hardware is drawn in the same perspective as the existing ship mesh.
    const p = project(player.x, player.y, 65); ctx.strokeStyle = '#a6f7edaa'; ctx.lineWidth = 1; ctx.strokeRect(p.x - 10, p.y - 10, 20, 20); ctx.beginPath(); ctx.moveTo(p.x - 17, p.y); ctx.lineTo(p.x + 17, p.y); ctx.moveTo(p.x, p.y - 17); ctx.lineTo(p.x, p.y + 17); ctx.stroke();
  } else { stationScene(color); if (W > 800) ship(6, 3.4, 19, 1.1, color, -.1); }
  $('flash').style.opacity = reducedMotion ? 0 : damageTime * .8;
}
let last = performance.now();
function loop(now) { const dt = Math.min((now - last) / 1000, .04); last = now; update(dt); draw(); requestAnimationFrame(loop); }
// scenes.js starts the loop after all scene renderers are loaded.
