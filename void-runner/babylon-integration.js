/* Boundary adapter: the legacy simulation stays authoritative. */
const VoidGraphics = window.VoidGraphics = {
  renderer: 'babylon',
  quality: matchMedia('(pointer:coarse)').matches || navigator.hardwareConcurrency <= 4 ? 'low' : 'medium',
  busy: false,
  error: null
};
try {
  const stored = JSON.parse(localStorage.getItem('void-runner-graphics-v1'));
  if (stored) {
    if (['babylon','legacy'].includes(stored.renderer)) VoidGraphics.renderer = stored.renderer;
    if (VoidBabylon.presets[stored.quality]) VoidGraphics.quality = stored.quality;
  }
} catch {}
const rendererParam = new URLSearchParams(location.search).get('renderer');
if (['legacy', 'babylon'].includes(rendererParam)) VoidGraphics.renderer = rendererParam;
VoidBabylon.setQuality(VoidGraphics.quality);
const navigationReveal = VoidNavigationReveal.create();
let expedition = null,
  walker = null,
  walkingLocation = null,
  walkTarget = null,
  walkingKeys = new Set(),
  lastStepSound = 0;
let ambientTraffic = VoidTraffic.create(() => 0), departureStation = {x:0,y:0,z:-100};
let escortShip = null,
  preparingLaunch = null,
  preparationGeneration = 0,
  activeRenderer = 'legacy',
  preparedDestination = null;
const VoidInteractions = window.VoidInteractions = {
  handlers: new Map(),
  register(action, handler) {
    if (typeof handler !== 'function') throw Error('Interaction handler required.');
    this.handlers.set(action, handler);
  }
};

function graphicsSave() {
  try {
    localStorage.setItem('void-runner-graphics-v1', JSON.stringify({
      renderer: VoidGraphics.renderer,
      quality: VoidGraphics.quality
    }));
  } catch {}
}
const migrationOpenMenu = openGameMenu;
openGameMenu = function() {
  if (['preparing', 'preparing-flight'].includes(mode)) return;
  walkingKeys.clear();
  document.exitPointerLock?.();
  migrationOpenMenu();
};

function preparationPanel(label) {
  leaveMenu();
  mode = 'preparing';
  clearInput();
  flightUI(false);
  panel('PREPARING ENVIRONMENT', label, '<p id="preparation-status" role="status">Loading the 3D engine and exterior. Your flight will start when ready.</p><div class="loading-activity" aria-label="Loading in progress"></div><p id="preparation-time" class="fine"></p>', button('CANCEL PREPARATION', 'migration-cancel', true, true));
  // A double-click on Board/Launch must not hit a newly inserted Cancel button.
  const cancelButton = screen.querySelector('[data-action="migration-cancel"]');
  setTimeout(() => { if(cancelButton?.isConnected) cancelButton.disabled=false; }, 800);
}
async function boundedPrepare(action) {
  try { return await VoidPreparation.run(action); }
  catch(error) {
    console.error('[VOID//RUNNER preparation]', {reason:error.message, error,
      renderer:VoidGraphics.renderer, activeRenderer, ...VoidBabylon.diagnostics,
      engineReady:VoidBabylon.diagnostics.ready, sceneReady:VoidBabylon.scene?.isReady(),
      phase:error.phase, asset:error.asset, elapsedMs:error.elapsedMs});
    VoidBabylon.release();
    throw error;
  }
}
const migrationLaunch = launch;
launch = function() {
  if (preparingLaunch) {
    if (mode === 'preparing') return preparingLaunch;
    const queuedToken = ++preparationGeneration;
    preparationPanel('Preparing <em>departure.</em>');
    return preparingLaunch.then(() => { if(queuedToken === preparationGeneration) return launch(); });
  }
  ambientTraffic = VoidTraffic.create(() => 0);
  walker = walkingLocation = expedition = null;
  walkingKeys.clear();
  document.exitPointerLock?.();
  if (VoidGraphics.renderer !== 'babylon') {
    VoidBabylon.release();
    activeRenderer = 'legacy';
    escortShip = null;
    migrationLaunch();
    VoidNavigationReveal.reset(navigationReveal, 'launch');
    return;
  }
  if (!C.flight(state) && !trialGear) { dock(); announce('Choose a destination or accept a job before launching.'); return; }
  const token = ++preparationGeneration;
  VoidGraphics.busy = true;
  preparationPanel('Preparing <em>departure.</em>');
  const started = performance.now();
  const progressTimer = setInterval(() => {
    const el = $('preparation-time');
    if (token === preparationGeneration && el) el.textContent = Math.floor((performance.now()-started)/1000)+'s elapsed · '+(VoidPreparation.current?.phase || 'starting')+' · First 3D launch may take longer.';
  }, 250);
  preparingLaunch = (async () => {
    try {
      await boundedPrepare(async task => {
        await VoidBabylon.prepareSpace(state.location, undefined, task);
        if(token === preparationGeneration && $('preparation-status')) $('preparation-status').textContent='Exterior ready. Preparing departure artwork…';
        const image = departureImages[state.location];
        if (image) {
          await task.wait('artwork', async()=>{await image.load();if (!image.naturalWidth) throw Error('Departure artwork unavailable: '+image.src);await image.decode();}, image.src || 'departure artwork');
        }
      });
      if (token !== preparationGeneration) return;
      activeRenderer = 'babylon';
      VoidGraphics.error = null;
      preparedDestination = null;
      migrationLaunch();
      if(mode !== 'play') throw Error('Flight could not start. Choose a route and retry.');
      VoidNavigationReveal.reset(navigationReveal, 'launch');
      escortShip = current?.kind === 'escort' ? VoidEscort.create({
        heading: flight.route?.vector
      }) : null;
      departureStation = {x:0,y:0,z:-100};
      const scriptedCombat = state.story.encounters.some(id => VoidStoryContent.encounters[id]?.ships.some(ship => VoidStory.relationship(VoidStoryContent.ships[ship] || {}) === 'hostile'));
      ambientTraffic = VoidTraffic.create(Math.random, !!current?.enemies || !!trialGear || scriptedCombat);
    } catch (error) {
      if (token !== preparationGeneration) return;
      VoidGraphics.error = error.message;
      mode = 'dock';
      panel('DEPARTURE PREPARATION FAILED', 'Departure <em>held.</em>', '<p>' + escapeText(error.message) + ' Your campaign is unchanged. Retry, or use the original renderer.</p>', button('RETRY', 'launch') + button('USE ORIGINAL RENDERER', 'migration-fallback', true));
    } finally {
      clearInterval(progressTimer);
      if(token !== preparationGeneration) VoidBabylon.release();
      VoidGraphics.busy = false;
      preparingLaunch = null;
    }
  })();
  return preparingLaunch;
};
const migrationEscortImpact = escortImpact;
escortImpact = function(projectile) {
  if (!escortShip) return migrationEscortImpact(projectile);
  if (projectile.escort && !projectile.dead) {
    VoidEscort.damage(escortShip, projectile.damage);
    escortHP = escortShip.health;
    VoidCombatEffects.explode(escortShip, 'impact');
    if (escortShip.dead) {
      mode = 'over';
      clearInput();
      flightUI(false);
      panel('ESCORT LOST', 'Bring them <em>home.</em>', '<p>The shuttle was disabled. Retry from the route checkpoint.</p>', button('RETRY MISSION', 'launch') + button('BACK TO SHIP', 'dock', true));
    }
  }
};
const migrationRouteClear = routeClear;
routeClear = function() {
  return migrationRouteClear() && (!escortShip || escortShip.progress >= 1 && Math.hypot(escortShip.x, escortShip.y, escortShip.z) <= escortShip.range);
};
const migrationArrive = arrive;
arrive = function() {
  const wasFlying = mode === 'play';
  migrationArrive();
  if (escortShip && current?.kind === 'escort' && ['arrival','dialogue'].includes(mode) && state.location === current.destination && !state.contract) escortShip.status = 'complete';
  if(wasFlying && ['arrival','dialogue'].includes(mode)) {ambientTraffic.contacts=[];VoidBabylon.release();}
};
const migrationSettings = settingsPage;
settingsPage = function() {
  migrationSettings();
  screen.querySelector('.settings-panel').insertAdjacentHTML('beforeend', `<h2>Graphics</h2><label>Renderer<select id="renderer-setting"><option value="legacy" ${VoidGraphics.renderer==='legacy'?'selected':''}>Original / recovery</option><option value="babylon" ${VoidGraphics.renderer==='babylon'?'selected':''}>Babylon 3D</option></select></label><label>Quality<select id="quality-setting">${Object.keys(VoidBabylon.presets).map(q=>`<option ${q===VoidGraphics.quality?'selected':''}>${q}</option>`).join('')}</select></label><p class="fine">Renderer changes apply on the next departure. Walking locations use Babylon. Models are prototype blockouts based on the existing artwork.</p><h2>Radio</h2><label>Local station<select id="radio-setting"><option value="">OFF / LOCATION MUSIC</option>${VoidRadio.available().map(([id,s])=>`<option value="${id}" ${VoidRadio.selection===id?'selected':''}>${s.name}</option>`).join('')}</select></label><p id="radio-status" class="fine">${escapeText(VoidRadio.status)}</p>`);
};
screen.addEventListener('change', e => {
  if (e.target.id === 'renderer-setting') {
    VoidGraphics.renderer = e.target.value;
    graphicsSave();
  }
  if (e.target.id === 'quality-setting') {
    VoidGraphics.quality = e.target.value;
    VoidBabylon.setQuality(e.target.value);
    graphicsSave();
  }
});
screen.addEventListener('change', async e => {
  if (e.target.id === 'radio-setting') {
    await VoidRadio.tune(e.target.value);
    if ($('radio-status')) $('radio-status').textContent = VoidRadio.status;
  }
});
const migrationDock = dock;
dock = function(tab = 'dock') {
  ambientTraffic = VoidTraffic.create(() => 0);
  if(activeRenderer === 'babylon' && !VoidGraphics.busy) VoidBabylon.release();
  // The save schema anchors the opening route at Meridian, but the player has
  // not arrived there yet. Cancelling preparation must not show that station.
  if (state.quest === 'arrival') {
    mode = 'dock'; view = 'departure'; clearInput(); flightUI(false);
    panel('VESPER / KESTREL READY', 'Your first <em>flight.</em>', '<p>The Kestrel is ready at Vesper. Launch and fly to Meridian to meet Rook.</p>', button('LAUNCH TO MERIDIAN →', 'launch'));
    scene('vesper');
    return;
  }
  if (walkingLocation) {
    VoidBabylon.release();
    walkingLocation = null;
    walker = null;
  }
  migrationDock(tab);
  if (mode === 'dock' && view === 'dock') screen.querySelector('.actions')?.insertAdjacentHTML('beforeend', button('LEAVE SHIP / 3D HANGAR', 'explore:hangar', true) + (VoidExplorationData.solAvailable(state) ? button('SOL / INTERSTELLAR NAVIGATION', 'sol-map', true) : '') + (VoidExplorationData.destinations[state.story.flags.solDestination] ? button('RESUME SOL VISIT', 'sol-resume', true) : ''));
};
const migrationNavigation = navigation;
navigation = function() {
  migrationNavigation();
  if (VoidExplorationData.solAvailable(state)) screen.querySelector('.hangar-grid')?.insertAdjacentHTML('beforeend', '<article class="card"><h3>SOL</h3><p>Interstellar transit. Earth and Mars landing prototypes.</p>' + button('PLOT INTERSTELLAR ROUTE', 'sol-map', false, !!state.contract) + '</article>');
};

function solMap() {
  if (!VoidExplorationData.solAvailable(state) || state.contract) {
    announce('Finish your current cargo run before plotting Sol.');
    return;
  }
  leaveMenu();
  mode = 'dock';
  view = 'sol';
  flightUI(false);
  panel('INTERSTELLAR NAVIGATION', 'The <em>Sol system.</em>', '<p>Align the Kestrel with the interstellar vector. Earth and Mars are separate, compact landing areas. Frontier campaign progress stays anchored at your last station.</p><div class="hangar-grid">' + Object.entries(VoidExplorationData.destinations).map(([id, d]) => '<article class="card"><h2>' + d.name + '</h2><p>Orbital approach → landing facility → walking blockout.</p>' + button('PLOT ' + id.toUpperCase(), 'sol-travel:' + id) + '</article>').join('') + '</div>', button('RETURN TO FRONTIER STATION', 'sol-return', true));
}
async function solTravel(id) {
  if (!VoidExplorationData.destinations[id] || !VoidExplorationData.solAvailable(state) || state.contract) return;
  if (VoidGraphics.busy) return;
  VoidGraphics.busy = true;
  const token = ++preparationGeneration;
  preparationPanel('Plotting <em>Sol transit.</em>');
  try {
    await boundedPrepare(task => VoidBabylon.prepareSpace(id, undefined, task));
    if (token !== preparationGeneration) return;
    expedition = {
      id,
      phase: 'align',
      clock: 0,
      aligned: 0,
      pilot: {
        yaw: 0,
        pitch: 0,
        roll: 0,
        yawRate: 0,
        pitchRate: 0,
        throttle: .8
      },
      vector: {
        x: .35,
        y: 0,
        z: Math.sqrt(1 - .35 * .35)
      },
      rocks: Array.from({
        length: 34
      }, (_, i) => ({
        x: (i % 2 ? 1 : -1) * (35 + i),
        y: Math.sin(i) * 70,
        z: 80 + i * 7,
        size: 2 + i % 4,
        phase: i
      }))
    };
    VoidPilotFlight.reset(expedition.pilot);
    mode = 'transit3d';
    scene('');
    screen.classList.add('hidden');
    clearInput();
    canvas.focus();
    VoidNavigationReveal.reset(navigationReveal, 'sol');
  } catch (error) {
    mode = 'dock';
    panel('TRANSIT UNAVAILABLE', 'Route <em>held.</em>', '<p>' + escapeText(error.message) + '</p>', button('BACK', 'sol-map'));
  } finally {
    VoidGraphics.busy = false;
  }
}

function orbit() {
  const id = expedition?.id || state.story.flags.solDestination;
  if (!VoidExplorationData.destinations[id]) return solMap();
  mode = 'dock';
  view = 'orbit';
  clearInput();
  flightUI(false);
  state.story.flags.solDestination = id;
  save();
  const d = VoidExplorationData.destinations[id];
  panel('SOL / ORBITAL APPROACH', d.name, '<p>Landing clearance received. The next area is a small exploration blockout.</p>', button('LAND / ' + d.location.toUpperCase(), 'explore:' + d.location) + button('SOL NAVIGATION', 'sol-map', true));
}
async function enterWalking(id) {
  const def = VoidExplorationData.locations[id];
  if (!def) return;
  if (id !== 'hangar' && !VoidExplorationData.solAvailable(state)) return;
  if (VoidGraphics.busy) return;
  VoidGraphics.busy = true;
  const token = ++preparationGeneration;
  preparationPanel('Preparing <em>' + escapeText(def.name) + '.</em>');
  try {
    await boundedPrepare(task => VoidBabylon.prepareRoom(def, task));
    if (token !== preparationGeneration) return;
    walker = {
      x: def.spawn[0],
      y: def.spawn[1],
      z: def.spawn[2],
      yaw: 0,
      pitch: 0
    };
    walkingLocation = def;
    resumeWalking();
    VoidAudio.event('door');
  } catch (error) {
    walkingLocation = null;
    mode = 'dock';
    panel('LOCATION UNAVAILABLE', 'Access <em>held.</em>', '<p>' + escapeText(error.message) + '</p>', button('RETURN TO SHIP', 'dock'));
  } finally {
    VoidGraphics.busy = false;
  }
}

function resumeWalking() {
  mode = 'walking';
  view = 'walking';
  speech = null;
  scene('');
  screen.classList.add('hidden');
  leaveMenu();
  clearInput();
  walkingKeys.clear();
  flightUI(false);
  canvas.focus();
  $('controls').textContent = 'WASD MOVE · MOUSE LOOK (CLICK TO CAPTURE) · E INTERACT · SHIFT RUN · ESC MENU';
  $('notice').textContent = '';
  noticeTime = 0;
}

async function leaveWalking() {
  document.exitPointerLock?.();
  const destination = walkingLocation?.kind === 'city' ? 'earth' : walkingLocation?.kind === 'underground' ? 'mars' : null;
  walkingLocation = null;
  walker = null;
  walkingKeys.clear();
  VoidBabylon.release();
  if (!destination) { dock(); return; }
  const token = ++preparationGeneration;
  VoidGraphics.busy = true;
  preparationPanel('Returning to <em>orbit.</em>');
  try {
    await boundedPrepare(task => VoidBabylon.prepareSpace(destination, undefined, task));
    if (token !== preparationGeneration) return;
    expedition = {id:destination, rocks:[]};
    orbit();
  } catch (error) {
    mode = 'dock';
    panel('ORBIT UNAVAILABLE', 'Transit <em>held.</em>', '<p>'+escapeText(error.message)+'</p>', button('SOL NAVIGATION','sol-map'));
  } finally { VoidGraphics.busy = false; }
}

const migrationJourney = newJourney;
newJourney = function() {
  preparationGeneration++;
  walkingLocation = walker = expedition = escortShip = null;
  walkingKeys.clear();
  VoidBabylon.release();
  migrationJourney();
};

function interactWalking() {
  if (mode !== 'walking' || !walkTarget) return;
  const item = walkTarget;
  walkingKeys.clear();
  document.exitPointerLock?.();
  VoidAudio.event('cycle');
  if (VoidInteractions.handlers.has(item.action)) return VoidInteractions.handlers.get(item.action)({
    item,
    state,
    resume: resumeWalking,
    save
  });
  if (item.action === 'board') return leaveWalking();
  if (item.action === 'talk') {
    // Rook's existing job logic is retained; the added back button returns to physical space.
    if (item.scene) playStoryScene(item.scene);
    else if (item.character === 'rook') rookConversation();
    else if (item.lines) talk('dock', item.lines, resumeWalking, 'RETURN TO EXPLORATION');
    screen.querySelector('.speech-controls,.cinematic-space')?.insertAdjacentHTML('beforeend', button('RETURN TO EXPLORATION', 'walk-resume', true));
    return;
  }
  if (item.action === 'services') {
    hangar();
    screen.querySelector('.shop-heading')?.insertAdjacentHTML('beforeend', button('RETURN TO HANGAR', 'walk-resume', true));
    return;
  }
  if (item.action === 'airlock') {
    walker.z = walker.z < -6 ? -3 : -10;
    VoidAudio.event('door');
    resumeWalking();
    return;
  }
  if (item.action === 'inspectProduct') {
    mode = 'walking-info';
    panel('SHOP / DISPLAY OBJECT', escapeText(item.product?.title || 'Display item'), '<p>' + escapeText(item.product?.description || 'Product details will be added later.') + '</p>', button('RETURN TO EXPLORATION', 'walk-resume'));
    return;
  }
  mode = 'walking-info';
  panel(item.action === 'tdd' ? 'THE DARKNET DISTRICT / ENTRANCE' : 'LOCAL TERMINAL', item.action === 'tdd' ? 'Entrance <em>reserved.</em>' : 'Local <em>services.</em>', item.action === 'tdd' ? '<p>The security vestibule and interior will be designed separately. This prototype ends at the entrance.</p>' : '<p>Landing terminal online. Future jobs, shops, local radio and transit services connect here. No purchases or rewards are granted by this prototype.</p>', button('RETURN TO EXPLORATION', 'walk-resume'));
}
screen.addEventListener('click', e => {
  const a = e.target.closest('button')?.dataset.action;
  if (!a) return;
  if (a === 'migration-cancel') {
    preparationGeneration++;
    dock();
  }
  if (a === 'migration-fallback') {
    VoidGraphics.renderer = 'legacy';
    graphicsSave();
    launch();
  }
  if (a.startsWith('explore:')) enterWalking(a.slice(8));
  if (a === 'walk-resume' && walkingLocation) resumeWalking();
  if (a === 'sol-map') solMap();
  if (a === 'sol-return') {
    delete state.story.flags.solDestination;
    expedition = null;
    save();
    VoidBabylon.release();
    dock();
  }
  if (a === 'sol-resume') solTravel(state.story.flags.solDestination);
  if (a.startsWith('sol-travel:')) solTravel(a.slice(11));
});
const walkingUI = document.createElement('div');
walkingUI.id = 'walking-ui';
walkingUI.innerHTML = '<span id="walking-caption"></span><button id="walking-interact">E / INTERACT</button><div id="walking-touch"><button data-walk="KeyW">↑</button><button data-walk="KeyA">←</button><button data-walk="KeyS">↓</button><button data-walk="KeyD">→</button></div>';
document.body.append(walkingUI);
$('walking-interact').onclick = interactWalking;
walkingUI.addEventListener('pointerdown', e => {
  const key = e.target.dataset.walk;
  if (key) {
    e.preventDefault();
    e.target.setPointerCapture(e.pointerId);
    walkingKeys.add(key);
  }
});
for (const event of ['pointerup', 'pointercancel']) walkingUI.addEventListener(event, e => walkingKeys.delete(e.target.dataset.walk));
addEventListener('keydown', e => {
  if (!['walking', 'transit3d'].includes(mode) || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight', 'KeyQ', 'KeyR', 'KeyX'].includes(e.code)) {
    e.preventDefault();
    walkingKeys.add(e.code);
  }
  if (e.code === 'KeyE' && !e.repeat) interactWalking();
});
addEventListener('keyup', e => walkingKeys.delete(e.code));
addEventListener('blur', () => {
  walkingKeys.clear();
  if (['walking', 'transit3d'].includes(mode)) openGameMenu();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    walkingKeys.clear();
    if (['walking', 'transit3d'].includes(mode)) openGameMenu();
  }
});
canvas.addEventListener('click', () => {
  if (mode === 'walking' && !matchMedia('(pointer:coarse)').matches) canvas.requestPointerLock?.()?.catch?.(() => {});
});
let lookPointer = null;
canvas.addEventListener('pointerdown', e => {
  if (mode === 'walking') lookPointer = {
    x: e.clientX,
    y: e.clientY
  };
});
canvas.addEventListener('pointerup', () => lookPointer = null);
canvas.addEventListener('pointermove', e => {
  if (mode !== 'walking' || !walker) return;
  const locked = document.pointerLockElement === canvas;
  if (!locked && !lookPointer) return;
  const dx = locked ? e.movementX : e.clientX - lookPointer.x,
    dy = locked ? e.movementY : e.clientY - lookPointer.y;
  walker.yaw += dx * .0025;
  walker.pitch = FM.clamp(walker.pitch + dy * .0025, -1.35, 1.35);
  if (lookPointer) lookPointer = {
    x: e.clientX,
    y: e.clientY
  };
});
const migrationUpdate = update;
async function prepareDestination() {
  const id = current.destination;
  preparedDestination = id;
  mode = 'preparing-flight';
  clearInput();
  // Keep the current rendered frame visible behind the warp preparation message.
  screen.classList.remove('hidden');
  screen.innerHTML = '<section class="opening-card"><p>WARP FIELD / SYNCHRONIZING DESTINATION</p></section>';
  try {
    await boundedPrepare(task => VoidBabylon.prepareSpace(id, undefined, task));
    if (mode !== 'preparing-flight') return;
    screen.classList.add('hidden');
    mode = 'play';
    last = performance.now();
  } catch (error) {
    mode = 'dock';
    flightUI(false);
    panel('WARP HELD', 'Destination <em>unavailable.</em>', '<p>' + escapeText(error.message) + ' The route checkpoint is saved.</p>', button('RETRY ROUTE', 'launch') + button('USE ORIGINAL RENDERER', 'migration-fallback', true));
  }
}
update = function(dt) {
  const region = walkingLocation?.kind === 'city' ? 'earth' : walkingLocation?.kind === 'underground' ? 'mars' : expedition ? 'sol' : 'frontier';
  VoidRadio.setContext(region, state);
  VoidRadio.category(mode === 'play' ? (enemies.some(VoidStory.hostile) ? 'combat' : 'flight') : walkingLocation?.music || 'station');
  const before = flight.route?.phase;
  if (mode === 'walking') {
    const moving = {
      x: Number(walkingKeys.has('KeyD')) - Number(walkingKeys.has('KeyA')),
      z: Number(walkingKeys.has('KeyW')) - Number(walkingKeys.has('KeyS')),
      run: walkingKeys.has('ShiftLeft') || walkingKeys.has('ShiftRight')
    };
    VoidExplorer.step(walker, moving, dt, walkingLocation);
    walkTarget = VoidExplorer.select(walker, walkingLocation, item => !item.when || VoidStory.matches(state, item.when));
    time += dt;
    $('walking-caption').textContent = walkingLocation.name + ' / BLOCKOUT';
    $('walking-interact').textContent = walkTarget ? '[E] ' + walkTarget.label : 'Look toward a nearby object';
    $('walking-interact').disabled = !walkTarget;
    lastStepSound -= dt;
    if ((moving.x || moving.z) && lastStepSound <= 0) {
      VoidAudio.tone(95, .06, 'triangle', .009);
      lastStepSound = moving.run ? .28 : .48;
    }
    VoidAudio.scene('bar');
    VoidAudio.tick(dt);
    return;
  }
  if (mode === 'transit3d') {
    time += dt;
    const e = expedition;
    VoidNavigationReveal.step(navigationReveal, dt, 'sol');
    if (e.phase === 'align') {
      VoidPilotFlight.step(e.pilot, {
        x: Number(walkingKeys.has('KeyD')) - Number(walkingKeys.has('KeyA')),
        y: Number(walkingKeys.has('KeyS')) - Number(walkingKeys.has('KeyW')),
        roll: Number(walkingKeys.has('KeyR')) - Number(walkingKeys.has('KeyQ')),
        throttle: Number(walkingKeys.has('ShiftLeft')) - Number(walkingKeys.has('KeyX'))
      }, dt, C.stats(state).flight);
      const b = FM.basis(e.pilot.yaw, e.pilot.pitch, e.pilot.roll);
      e.aligned = FM.dot(b.f, e.vector) > .99 && VoidNavigationReveal.opacity(navigationReveal) > 0 ? e.aligned + dt : 0;
      if (e.aligned > .65) {
        e.phase = 'warp';
        e.clock = 0;
        VoidAudio.event('warp');
      }
    } else {
      e.clock += dt;
      if (e.clock >= 8) {
        orbit();
        VoidAudio.event('exit');
      }
    }
    VoidAudio.update(VoidShips.get(state), .8, 0, e.phase, true);
    return;
  }
  migrationUpdate(dt);
  if (mode === 'play') {
    const phase = flight.route?.phase || 'encounter';
    VoidNavigationReveal.step(navigationReveal, before === phase ? dt : 0, phase);
    if (escortShip && current.kind === 'escort' && phase === 'encounter') {
      VoidEscort.step(escortShip, dt, flight.velocity, flightBasis().f, enemies.some(VoidStory.hostile));
      escortHP = escortShip.health;
    }
    if(phase==='warp'||phase==='encounter'||enemies.some(VoidStory.hostile)) ambientTraffic.contacts=[];
    else VoidTraffic.step(ambientTraffic,dt,flight.velocity);
    if(phase==='departure'||phase==='align') for(const axis of ['x','y','z']) departureStation[axis]-=(flight.velocity?.[axis]||0)*dt;
    enemies = enemies.filter(e => !e.dead);
    if (activeRenderer === 'babylon' && phase === 'warp' && preparedDestination !== current.destination) prepareDestination();
  }
};
const migrationMarker = drawWarpMarker;
drawWarpMarker = function() {
  const alpha = VoidNavigationReveal.opacity(navigationReveal);
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  migrationMarker();
  if (activeRenderer === 'babylon' && flight.route?.phase === 'align') {
    const p = flightPoint(flight.nav);
    if (p.z > 0 && p.x > W * .12 && p.x < W * .88 && p.y > H * .16 && p.y < H * .72) {
      const align = Math.round(FM.clamp((FM.dot(flightBasis().f, flight.route.vector) + 1) / 2, 0, 1) * 100),
        radius = 29;
      ctx.strokeStyle = flight.route.aligned > 0 ? '#ffdd8b' : '#78cdbb';
      ctx.fillStyle = ctx.strokeStyle;
      ctx.lineWidth = 1;
      for (const x of [-1, 1])
        for (const y of [-1, 1]) {
          ctx.beginPath();
          ctx.moveTo(p.x + x * (radius - 7), p.y + y * radius);
          ctx.lineTo(p.x + x * radius, p.y + y * radius);
          ctx.lineTo(p.x + x * radius, p.y + y * (radius - 7));
          ctx.stroke();
        }
      ctx.font = '10px Consolas';
      ctx.textAlign = 'center';
      ctx.fillText(align + '% ALIGNMENT' + (flight.route.aligned > 0 ? ' / VECTOR LOCK' : ''), p.x, p.y + 54);
      ctx.textAlign = 'left';
    }
  }
  ctx.restore();
};

function migrationSnapshot() {
  return {
    basis: flightBasis(),
    route: flight.route,
    rocks: flight.rocks,
    ships: [...enemies,...VoidTraffic.visible(ambientTraffic),...(escortShip?[escortShip]:[])],
    departureStation,
    bullets,
    hostile,
    missiles: [...missiles, ...enemyMissiles],
    effects: VoidCombatEffects.clouds,
    time,
    approach: approachTime
  };
}

function drawContactMarkers() {
  flight.arrows = [];
  for (const e of [...enemies,...VoidTraffic.visible(ambientTraffic)]) {
    if(e.marker==='none')continue;
    const p = flightPoint(e),
      hostile = VoidStory.hostile(e),
      color = VoidStory.contactColors[VoidStory.relationship(e)];
    if(e.traffic && (p.z<=0 || Math.abs(p.x-W*.5)<70 && Math.abs(p.y-H*.44)<70)) continue;
    if (p.z <= 0 || p.x < W * .12 || p.x > W * .88 || p.y < H * .15 || p.y > H * .72) !e.traffic && cockpitArrow(e, hostile ? 'HOSTILE' : VoidStory.relationship(e).toUpperCase(), color);
    else {
      const r = Math.max(12, Math.min(80, p.s * e.size * 2.8));
      ctx.strokeStyle = color;
      ctx.strokeRect(p.x - r, p.y - r, r * 2, r * 2);
      ctx.fillStyle = color;
      if(e.maxArmor>0) ctx.fillRect(p.x - r, p.y - r - 5, r * 2 * Math.max(0, e.armor / e.maxArmor), 2);
    }
  }
  if (escortShip) cockpitArrow(escortShip, 'ESCORT ' + Math.round(escortShip.health) + '%', VoidStory.contactColors[VoidStory.relationship(escortShip)]);
  for (const o of missionObjects) {
    const p = flightPoint(o);
    if (p.z > 0) {
      ctx.strokeStyle = '#58ffe1';
      ctx.strokeRect(p.x - 10, p.y - 10, 20, 20);
    } else cockpitArrow(o, 'SIGNAL', '#58ffe1');
  }
}
const migrationDraw = draw;
draw = function() {
  walkingUI.hidden = !['walking', 'transit3d'].includes(mode);
  if (mode === 'preparing-flight') return;
  if (mode === 'walking') {
    const image = VoidBabylon.renderRoom(walker, W, H, time, when => VoidStory.matches(state, when));
    if (image) ctx.drawImage(image, 0, 0, W, H);
    ctx.fillStyle = '#b8d4cf';
    ctx.fillRect(W / 2 - 2, H / 2 - 2, 4, 4);
    return;
  }
  if (mode === 'transit3d') {
    $('walking-caption').textContent = 'SOL / HOLD ALIGNMENT TO ENGAGE TRANSIT';
    $('walking-interact').textContent = 'WASD OR DIRECTION BUTTONS TO ALIGN';
    $('walking-interact').disabled = true;
    const e = expedition,
      basis = FM.basis(e.pilot.yaw, e.pilot.pitch, e.pilot.roll),
      image = VoidBabylon.renderFlight({
        basis,
        route: {
          phase: e.phase,
          progress: e.clock / 8
        },
        rocks: e.rocks,
        ships: [],
        bullets: [],
        hostile: [],
        missiles: [],
        effects: [],
        time,
        approach: 0
      }, W, H);
    if (image) ctx.drawImage(image, 0, 0, W, H);
    drawShipCockpit();
    ctx.fillStyle = '#83d5c8';
    ctx.font = '16px Consolas';
    ctx.textAlign = 'center';
    ctx.fillText(e.phase === 'align' ? 'SOL / ALIGN INTERSTELLAR VECTOR — WASD' : 'SOL / INTERSTELLAR TRANSIT', W / 2, H * .2);
    if (e.phase === 'align' && VoidNavigationReveal.opacity(navigationReveal) > 0) {
      const p = FM.project(e.vector, basis, W, H);
      ctx.strokeStyle = '#83d5c8';
      ctx.strokeRect(p.x - 20, p.y - 20, 40, 40);
      ctx.fillText('SOL → ' + e.id.toUpperCase(), p.x, p.y + 43);
    }
    ctx.textAlign = 'left';
    return;
  }
  if (view === 'orbit' && expedition && VoidBabylon.diagnostics.exteriorReady) {
    const image = VoidBabylon.renderFlight({
      basis: FM.basis(0, 0, 0),
      route: null,
      rocks: expedition.rocks,
      ships: [],
      bullets: [],
      hostile: [],
      missiles: [],
      effects: [],
      time,
      approach: 0
    }, W, H);
    if (image) {
      ctx.drawImage(image, 0, 0, W, H);
      return;
    }
  }
  if (activeRenderer === 'babylon' && ['play', 'pause'].includes(mode) && VoidBabylon.diagnostics.exteriorReady) {
    const image = VoidBabylon.renderFlight(migrationSnapshot(), W, H);
    if (!image) {
      migrationDraw();
      return;
    }
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(image, 0, 0, W, H);
    drawWarpEffect();
    drawDeparture();
    ctx.save();
    if (!reducedMotion) {
      const amplitude = Math.min(1.5, damageTime * 2 + Math.abs(flight.yawRate) * .35);
      ctx.translate(Math.sin(time * 35) * amplitude, Math.cos(time * 27) * amplitude);
    }
    drawShipCockpit();
    ctx.restore();
    drawContactMarkers();
    drawFlightHud();
    drawWarpMarker();
    drawMissileReticle();
    drawEnemyLockWarning();
    VoidCombatEffects.draw();
    return;
  }
  migrationDraw();
};
