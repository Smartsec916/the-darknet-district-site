/* One front end, connected to the existing campaign, account and simulation. */
const VoidMenu = window.VoidMenu = {
  page: '',
  returnTo: null,
  capture: null,
  refreshAccount() {
    if (this.page === 'main' && mode === 'menu') renderMainMenu();
  }
};

function menuShell(page, html) {
  VoidAudio.cancel();
  speech = null;
  VoidMenu.page = page;
  mode = 'menu';
  view = 'menu';
  clearInput();
  flightUI(false);
  scene('');
  $('notice').textContent = '';
  noticeTime = 0;
  document.body.classList.add('frontend');
  screen.classList.remove('hidden');
  screen.innerHTML = html;
  screen.querySelector('h1,button')?.focus({
    preventScroll: true
  });
}

function leaveMenu() {
  VoidMenu.page = '';
  VoidMenu.capture = null;
  document.body.classList.remove('frontend');
}

function renderMainMenu() {
  const a = window.VoidAccount,
    u = a?.user;
  menuShell('main',
    `<section class="main-menu"><p class="menu-kicker">THE DARKNET DISTRICT / FLIGHT SYSTEMS ONLINE</p><h1 class="game-logo" tabindex="-1">VOID<span>//</span>RUNNER</h1><p class="menu-subtitle">CARGO & CONSEQUENCES</p><nav class="menu-options" aria-label="Main menu">${VoidMenu.returnTo?button('RESUME GAME','menu-resume'):''}${button('START NEW CAMPAIGN','menu-new')}${button('LOAD CAMPAIGN','menu-load',false,!hasSave&&!a?.cloud)}${button('SETTINGS','menu-settings')}${button('LOGOUT','menu-logout',false,!u||a?.busy)}</nav><div class="menu-account">${u?'SIGNED IN · '+escapeText(u.displayName||u.email||'Pilot'):'LOCAL PILOT · NOT SIGNED IN'}${button(u?'ACCOUNT / CLOUD SAVES':'SIGN IN','menu-account',true)}</div><p class="menu-save">${hasSave?saveDescription(state):'Your journey begins on Vesper.'}</p></section>`
    );
}

function saveDescription(s) {
  const mission = C.allContracts.find(m => m.id === s.contract);
  return escapeText((s.quest === 'inheritance' ? 'Vesper workshop' : C.stations[s.location]?.name || s
      .location) + ' · ' + VoidShips.get(s).name + ' · ' + (mission?.name || s.quest.replaceAll('-', ' '))) +
    (s.savedAt ? '<br>Saved ' + escapeText(new Date(s.savedAt).toLocaleString()) : '');
}
title = function() {
  VoidMenu.returnTo = null;
  renderMainMenu();
};

function openGameMenu() {
  if (mode === 'menu') return;
  const snapshot = {
    mode,
    view,
    speech,
    html: screen.innerHTML,
    scene: screen.dataset.scene,
    hidden: screen.classList.contains('hidden')
  };
  VoidMenu.returnTo = () => {
    leaveMenu();
    mode = snapshot.mode;
    view = snapshot.view;
    scene(snapshot.scene);
    speech = snapshot.speech;
    screen.innerHTML = snapshot.html;
    screen.classList.toggle('hidden', snapshot.hidden);
    flightUI(mode === 'play' || mode === 'pause');
    clearInput();
    if (speech) renderLine();
    if (mode === 'play') canvas.focus({
      preventScroll: true
    });
  };
  renderMainMenu();
}

function resumeMenu() {
  const resume = VoidMenu.returnTo;
  VoidMenu.returnTo = null;
  if (resume) resume();
  else title();
}

function settingsPage() {
  const s = VoidAudio.settings;
  menuShell('settings',
    `<section class="settings-panel"><h1 tabindex="-1">Settings</h1>${[['music','Music volume'],['effects','Sound effects volume'],['voice','Voice volume']].map(([id,label])=>`<label>${label}<input type="range" min="0" max="100" step="1" data-setting="${id}" value="${Math.round(s[id]*100)}"><output>${Math.round(s[id]*100)}</output></label>`).join('')}${button('KEYBINDINGS','menu-bindings')}${button(s.enabled?'MUTE ALL':'UNMUTE ALL','menu-mute',true)}<p class="fine">Audio starts after interaction. Voices use this device’s speech engine. Set a category to zero to mute it.</p>${button('BACK','menu-back',true)}</section>`
    );
}

function bindingsPage() {
  menuShell('bindings',
    `<section class="settings-panel"><h1 tabindex="-1">Keybindings</h1><p>Select an action, then press a key. Escape cancels capture.</p>${Object.entries(VoidInput.actions).map(([id,[label]])=>`<div class="binding-row"><span>${label}</span>${button(VoidInput.label(VoidInput.bindings[id]),'bind:'+id,true)}</div>`).join('')}<p role="status" class="binding-warning" id="binding-warning"></p><p class="fine">Mouse aims; left click fires; right click launches a locked missile. Arrow keys also steer while WASD defaults are unchanged; either Shift key increases thrust while its default is unchanged. Docking is automatic. Drive requires equipped drive hardware. Standard weapons are changed in the Hangar; there is no in-flight weapon cycling.</p>${button('RESET TO DEFAULTS','bindings-reset',true)}${button('BACK','bindings-back',true)}</section>`
    );
}

function loadMenu() {
  menuShell('load',
    `<section class="settings-panel menu-confirm"><h1 tabindex="-1">Load campaign</h1>${hasSave?'<p>'+saveDescription(state)+'</p>'+button('LOAD LOCAL CAMPAIGN','menu-load-local'):'<p>No local campaign saved.</p>'}${window.VoidAccount?.user?button('ACCOUNT CLOUD SAVES','menu-account',true):''}${button('BACK','menu-back',true)}</section>`
    );
}

function mainAction(a) {
  if (a === 'game-menu') openGameMenu();
  else if (a === 'menu-resume') resumeMenu();
  else if (a === 'menu-settings') settingsPage();
  else if (a === 'menu-mute') {
    VoidAudio.set({
      enabled: !VoidAudio.settings.enabled
    });
    VoidAudio.unlock();
    settingsPage();
  } else if (a === 'menu-bindings') bindingsPage();
  else if (a === 'bindings-back') settingsPage();
  else if (a === 'menu-back') renderMainMenu();
  else if (a === 'menu-load') loadMenu();
  else if (a === 'menu-new') {
    if (hasSave) menuShell('confirm',
      `<section class="settings-panel menu-confirm"><h1 tabindex="-1">Start new campaign?</h1><p>Existing campaign data was found. Starting a new campaign will overwrite your current local campaign. Account purchases and your cloud save are preserved.</p>${button('CANCEL','menu-back',true)}${button('START NEW CAMPAIGN','menu-new-confirm')}</section>`
      );
    else mainAction('menu-new-confirm');
  } else if (a === 'menu-new-confirm') {
    VoidMenu.returnTo = null;
    leaveMenu();
    newJourney();
  } else if (a === 'menu-load-local' && hasSave) {
    try {
      const restored = C.restore(localStorage.getItem(SAVE_KEY));
      if (restored) state = restored;
    } catch {}
    VoidMenu.returnTo = null;
    leaveMenu();
    if (resumeStoryScene()) return;
    if (state.quest === 'inheritance') workshopOpening();
    else if (C.flight(state)) launch();
    else dock();
  } else if (a === 'menu-account') {
    leaveMenu();
    if (window.VoidAccount?.request) window.VoidAccount.request('account');
    else {
      renderMainMenu();
      announce('Account services are still loading. Try again shortly.');
    }
  } else if (a === 'account-main-menu') renderMainMenu();
  else if (a === 'menu-logout') {
    VoidMenu.returnTo = null;
    window.VoidAccount?.request?.('sign-out');
  } else if (a === 'bindings-reset') {
    VoidInput.reset();
    bindingsPage();
  } else if (a?.startsWith('bind:')) {
    VoidMenu.capture = a.slice(5);
    $('binding-warning').textContent = 'Press a key for ' + VoidInput.actions[VoidMenu.capture][0] + '…';
  }
}
document.addEventListener('click', e => mainAction(e.target.closest('button')?.dataset.action));
screen.addEventListener('input', e => {
  const id = e.target.dataset.setting;
  if (!id) return;
  VoidAudio.set({
    [id]: Number(e.target.value) / 100,
    enabled: true,
    voiceEnabled: true
  });
  VoidAudio.unlock();
  e.target.nextElementSibling.value = e.target.value;
});
addEventListener('keydown', e => {
  if (VoidMenu.capture) {
    e.preventDefault();
    e.stopImmediatePropagation();
    if (e.code === 'Escape') {
      VoidMenu.capture = null;
      $('binding-warning').textContent = 'Cancelled.';
      return;
    }
    const result = VoidInput.bind(VoidMenu.capture, e.code);
    if (result.error) {
      $('binding-warning').textContent = result.error;
      return;
    }
    VoidMenu.capture = null;
    bindingsPage();
    $('binding-warning').textContent = result.saved ? 'Binding saved.' :
      'Storage unavailable; binding lasts for this session.';
    return;
  }
  if (/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || e.target.isContentEditable) return;
  const action = VoidInput.action(e.code);
  if (!action) return;
  if (action === 'pause' && !e.repeat) {
    e.preventDefault();
    if (mode === 'menu') resumeMenu();
    else openGameMenu();
    return;
  }
  if (mode !== 'play') return;
  e.preventDefault();
  VoidInput.held.add(e.code);
  if (e.repeat) return;
  if (action === 'missile') fireMissile();
  else if (['nearest', 'next', 'previous', 'clear', 'lock'].includes(action)) selectCombatTarget(action);
}, true);
addEventListener('keyup', e => VoidInput.held.delete(e.code));
const menuUpdate = update;
update = function(dt) {
  menuUpdate(dt);
  VoidAudio.scene(mode === 'menu' ? 'menu' : mode === 'play' ? 'flight' : view === 'bar' ? 'bar' : state
    .location, mode === 'play' && enemies.some(VoidStory.hostile), mode === 'play' && hp < C.stats(state)
    .hull * .25);
  VoidAudio.tick(dt);
};
const menuDraw = draw;
draw = function() {
  if (mode !== 'menu') {
    menuDraw();
    return;
  }
  ctx.fillStyle = '#030915';
  ctx.fillRect(0, 0, W, H);
  drawDeepSpace('meridian');
  ctx.save();
  ctx.globalAlpha = .7;
  drawStationExterior('meridian', W * .77 + (reducedMotion ? 0 : Math.sin(time * .04) * 15), H * .51, W *
    .34);
  ctx.restore();
  for (let i = 0; i < 80; i++) {
    const x = (i * 173.71 + (reducedMotion ? 0 : time * (.3 + i % 3 * .15))) % W,
      y = (i * 91.13) % H;
    ctx.fillStyle = i % 3 ? '#c4e1ed80' : '#6bd4d580';
    ctx.fillRect(x, y, 1, 1);
  }
};
ensureLocationAssets('meridian');
