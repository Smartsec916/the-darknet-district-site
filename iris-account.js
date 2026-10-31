/*
==============================================================================
THE DARKNET DISTRICT — ACCOUNT BUTTON

One sign-in for the whole site. It uses the same Firebase project and the same
firebase-auth.js as every game, so a visitor who signs in here is already signed
in on the other pages (the browser keeps the session) until they log out.

Anonymous browsing stays available: nothing here is required to read the site
or to chat with Iris, and nothing here appears inside the chat box.

The administrator entry (IRIS CONTROLS) is shown only when the Iris server
confirms the signed-in account is on its administrator list. Hiding it is a
courtesy; the server checks every request.
==============================================================================
*/
import {
  auth, provider, signInWithPopup, signInWithRedirect, linkWithPopup, onAuthStateChanged, signOut,
} from './firebase-auth.js';
import { sendEmailLink, completeEmailLink, fetchHandle, claimHandle, checkHandle, handleOf } from './district-identity.js';
import { accountDetails, accountLabel, handleHint, irisBase, menuItems, modeBadge, modeNote, providerLabel, signInMessage } from './iris-account-core.js';

const root = document.querySelector('[data-district-account]');
const identity = window.IrisIdentity;
const base = irisBase(location.hostname, window.IRIS_API_BASE);

const FRAME = '<svg class="district-account__frame" viewBox="0 0 150 48" preserveAspectRatio="none" aria-hidden="true" focusable="false">'
  + '<path class="district-account__panel" d="M.5 .5H139.5L149.5 10V47.5H10L.5 37.5Z"/>'
  + '<path class="district-account__rail" d="M6 44H37M149 18V32M104 4H134"/></svg>';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

let me = { authenticated: false, admin: false };
let currentUser = null;
// The public handle from the handle registry: undefined while unknown (or the handle service is down), null when the
// account has none yet, otherwise the handle. Never derived from the Firebase display name, which can be a real name.
let handle;
let handleNextChange = null;

async function refreshHandle() {
  handle = undefined;
  handleNextChange = null;
  const user = currentUser;
  if (!user) return;
  try {
    const mine = await fetchHandle(user);
    if (user !== currentUser) return;
    handle = mine.handle || null;
    handleNextChange = mine.nextChangeAt || null;
  } catch {
    // Handle service asleep or switched off: show only what is safe (a game-handle account's own name)
    if (user === currentUser) handle = handleOf(user) || undefined;
  }
}

async function api(path, { method = 'GET', body } = {}) {
  const token = await currentUser.getIdToken();
  const response = await fetch(base + path, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Iris did not answer. Try again shortly.');
  return data;
}

async function refreshMe() {
  if (!currentUser) { me = { authenticated: false, admin: false }; identity?.setMode(null); return; }
  try {
    me = await api('/api/me');
    identity?.setMode(me.admin ? me.mode : null);
  } catch {
    // Iris may be waking up; the menu simply lacks the administrator entry until the next try
    me = { authenticated: true, admin: false };
  }
}

if (root) {
  root.hidden = false;

  const button = el('button', 'district-account__button');
  button.type = 'button';
  button.setAttribute('aria-haspopup', 'dialog');
  button.setAttribute('aria-expanded', 'false');
  button.insertAdjacentHTML('beforeend', FRAME);
  const index = el('span', 'district-account__index', 'ID');
  index.setAttribute('aria-hidden', 'true');
  const label = el('span', 'district-account__label', 'LOG IN');
  // Administrator only: shows NEW or RET while Iris is not treating them as the owner (hidden when empty)
  const modeTag = el('span', 'district-account__mode');
  button.append(index, label, modeTag);
  const renderMode = () => {
    modeTag.textContent = modeBadge(me);
    modeTag.title = modeNote(me);
  };

  const menu = el('div', 'district-account__menu');
  menu.setAttribute('role', 'menu');
  menu.hidden = true;

  const settings = el('div', 'district-login');
  settings.id = 'districtSettings';
  settings.hidden = true;
  settings.setAttribute('role', 'dialog');
  settings.setAttribute('aria-modal', 'true');
  settings.setAttribute('aria-labelledby', 'districtSettingsTitle');
  const settingsPanel = el('div', 'district-login__panel');
  const settingsTitle = el('h2', 'district-login__title', 'ACCOUNT SETTINGS');
  settingsTitle.id = 'districtSettingsTitle';
  const details = el('dl', 'district-account__details');
  const settingsNote = el('p', 'district-login__text', 'This is what your account holds. Your game progress and your Iris chats are not affected by anything on this page.');
  const settingsActions = el('div', 'district-account__row');
  const handleNote = el('p', 'district-login__text');
  const handleButton = el('button', 'district-login__action', 'CHANGE HANDLE');
  handleButton.type = 'button';
  handleButton.dataset.action = 'change-handle';
  const copyButton = el('button', 'district-login__action district-login__action--quiet', 'COPY ACCOUNT ID');
  copyButton.type = 'button';
  const settingsClose = el('button', 'district-login__close', 'CLOSE');
  settingsClose.type = 'button';
  settingsActions.append(handleButton, copyButton, settingsClose);
  settingsPanel.append(settingsTitle, details, handleNote, settingsNote, settingsActions);
  settings.append(settingsPanel);

  const modal = el('div', 'district-login');
  modal.id = 'districtLogin';
  modal.hidden = true;
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'districtLoginTitle');
  const panel = el('div', 'district-login__panel');
  const title = el('h2', 'district-login__title', 'ACCESS TERMINAL');
  title.id = 'districtLoginTitle';
  const intro = el('p', 'district-login__text', 'Log in once and stay logged in across the District. You never need an account to browse the site or talk to Iris.');
  const google = el('button', 'district-login__action', 'CONTINUE WITH GOOGLE');
  google.type = 'button';
  const emailLabel = el('label', 'district-login__label', 'OR GET A SIGN-IN LINK BY EMAIL');
  emailLabel.setAttribute('for', 'districtLoginEmail');
  const email = el('input', 'district-login__input');
  email.id = 'districtLoginEmail'; email.type = 'email'; email.autocomplete = 'email'; email.placeholder = 'you@example.com'; email.maxLength = 120;
  const send = el('button', 'district-login__action district-login__action--quiet', 'EMAIL ME A LINK');
  send.type = 'button';
  const forgetBrowser = el('button', 'district-login__close district-login__forget', "DELETE WHAT IRIS REMEMBERS ABOUT THIS BROWSER");
  forgetBrowser.type = 'button';
  const status = el('p', 'district-login__status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  const close = el('button', 'district-login__close', 'CLOSE');
  close.type = 'button';
  panel.append(title, intro, google, emailLabel, email, send, status, forgetBrowser, close);
  modal.append(panel);

  // Choose or change the public handle. The server decides (unique, 3-20 letters/numbers/underscores, not reserved);
  // the checks here only save a round trip.
  const handleModal = el('div', 'district-login');
  handleModal.id = 'districtHandle';
  handleModal.hidden = true;
  handleModal.setAttribute('role', 'dialog');
  handleModal.setAttribute('aria-modal', 'true');
  handleModal.setAttribute('aria-labelledby', 'districtHandleTitle');
  const handlePanel = el('div', 'district-login__panel');
  const handleTitle = el('h2', 'district-login__title', 'CHOOSE YOUR HANDLE');
  handleTitle.id = 'districtHandleTitle';
  const handleIntro = el('p', 'district-login__text');
  const handleLabel = el('label', 'district-login__label', 'PUBLIC HANDLE');
  handleLabel.setAttribute('for', 'districtHandleInput');
  const handleInput = el('input', 'district-login__input');
  handleInput.id = 'districtHandleInput'; handleInput.type = 'text'; handleInput.autocomplete = 'off'; handleInput.spellcheck = false;
  handleInput.maxLength = 20; handleInput.placeholder = 'Ghost_01';
  const handleCheck = el('button', 'district-login__action district-login__action--quiet', 'CHECK AVAILABILITY');
  handleCheck.type = 'button';
  const handleSave = el('button', 'district-login__action', 'SAVE HANDLE');
  handleSave.type = 'button';
  const handleStatus = el('p', 'district-login__status');
  handleStatus.setAttribute('role', 'status');
  handleStatus.setAttribute('aria-live', 'polite');
  const handleClose = el('button', 'district-login__close', 'NOT NOW');
  handleClose.type = 'button';
  handlePanel.append(handleTitle, handleIntro, handleLabel, handleInput, handleCheck, handleSave, handleStatus, handleClose);
  handleModal.append(handlePanel);

  root.append(button);
  // The menu and the sign-in panel live on the page itself, not inside the header, so nothing on the page
  // (the header's own stacking, the hero content) can cover or clip them
  document.body.append(menu, modal, settings, handleModal);

  const setStatus = (text, isError = false) => {
    status.textContent = text;
    status.dataset.state = isError ? 'error' : 'ok';
  };

  function openModal() {
    closeMenu();
    modal.hidden = false;
    setStatus('');
    (currentUser?.isAnonymous
      ? setStatus('You are using a game handle. Signing in connects it to your account when possible.')
      : undefined);
    google.focus();
  }
  function closeModal() { modal.hidden = true; button.focus(); }
  function closeSettings() { settings.hidden = true; button.focus(); }
  const renderLabel = () => {
    label.textContent = accountLabel(currentUser, handle);
    button.setAttribute('aria-label', currentUser ? `Account menu for ${label.textContent}` : 'Log in');
  };
  const setHandleStatus = (text, isError = false) => {
    handleStatus.textContent = text;
    handleStatus.dataset.state = isError ? 'error' : 'ok';
  };
  const promptKey = () => `districtHandlePrompt:${currentUser?.uid}`;
  function openHandle({ first = false } = {}) {
    if (!currentUser) return;
    closeMenu();
    const changing = Boolean(handle);
    handleTitle.textContent = changing ? 'CHANGE YOUR HANDLE' : 'CHOOSE YOUR HANDLE';
    handleIntro.textContent = (changing
      ? `Your handle is ${handle}. `
      : 'This is the name other players see in the games and on leaderboards, instead of your Google or email name. ')
      + '3 to 20 letters, numbers or underscores. Your progress, purchases and Iris chats stay exactly as they are. You can change it once every 30 days.';
    handleClose.textContent = first ? 'NOT NOW' : 'CANCEL';
    handleInput.value = handle || '';
    setHandleStatus(handleHint(handleInput.value));
    handleModal.hidden = false;
    handleInput.focus({ preventScroll: true });
    handleInput.select();
  }
  function dismissHandlePrompt() {
    try { sessionStorage.setItem(promptKey(), '1'); } catch { /* the prompt may simply show again next page */ }
    handleModal.hidden = true;
    button.focus({ preventScroll: true });
  }
  async function checkTypedHandle() {
    const value = handleInput.value.trim();
    const hint = handleHint(value);
    if (hint) { setHandleStatus(hint, true); return; }
    setHandleStatus('Checking…');
    try {
      const { available } = await checkHandle(value);
      setHandleStatus(available ? `${value} is available.` : `${value} is already taken. Try another.`, !available);
    } catch (error) { setHandleStatus(error.message, true); }
  }
  let savingHandle = false;
  async function saveTypedHandle() {
    if (savingHandle) return;
    const value = handleInput.value.trim();
    const hint = handleHint(value);
    if (hint) { setHandleStatus(hint, true); return; }
    savingHandle = true;
    handleSave.disabled = true;
    setHandleStatus('Saving…');
    try {
      const saved = await claimHandle(value);
      handle = saved.handle;
      handleNextChange = saved.nextChangeAt || null;
      renderLabel();
      handleModal.hidden = true;
      button.focus({ preventScroll: true });
    } catch (error) {
      setHandleStatus(error.message || 'Could not save the handle. Try again shortly.', true);
    } finally { savingHandle = false; handleSave.disabled = false; }
  }
  function openSettings() {
    closeMenu();
    details.replaceChildren();
    handleButton.textContent = handle ? 'CHANGE HANDLE' : 'CHOOSE HANDLE';
    const waiting = handleNextChange && handleNextChange * 1000 > Date.now();
    handleNote.textContent = handle === undefined
      ? 'Your handle could not be loaded just now. It is the name other players see. Try again shortly.'
      : waiting ? `Your handle is the name other players see. You can change it again on ${new Date(handleNextChange * 1000).toISOString().slice(0, 10)}.`
        : 'Your handle is the name other players see in the games and on leaderboards.';
    for (const [name, value] of accountDetails(currentUser, me, handle)) {
      const row = el('div', 'district-account__detail');
      row.append(el('dt', undefined, name), el('dd', undefined, value));
      details.append(row);
    }
    settings.hidden = false;
    settingsClose.focus({ preventScroll: true });
  }
  function closeMenu() { menu.hidden = true; button.setAttribute('aria-expanded', 'false'); }
  function placeMenu() {
    const box = button.getBoundingClientRect();
    menu.style.top = `${Math.round(box.bottom + 8)}px`;
    menu.style.right = `${Math.max(8, Math.round(window.innerWidth - box.right))}px`;
  }

  async function googleSignIn() {
    setStatus('Opening Google…');
    try {
      if (window.self !== window.top) { await signInWithRedirect(auth, provider); return; }
      if (auth.currentUser && auth.currentUser.isAnonymous) {
        // Keep the handle the visitor already uses in the games: attach Google to it; if that Google account
        // already exists, sign in to it instead (the handle account is left as it was, not deleted)
        try { await linkWithPopup(auth.currentUser, provider); }
        catch (error) {
          if (error.code !== 'auth/credential-already-in-use') throw error;
          await signInWithPopup(auth, provider);
        }
      } else {
        await signInWithPopup(auth, provider);
      }
      closeModal();
    } catch (error) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') { setStatus(''); return; }
      if (error.code === 'auth/popup-blocked' || error.code === 'auth/web-storage-unsupported') {
        try { await signInWithRedirect(auth, provider); return; } catch { /* fall through to the message */ }
      }
      setStatus(signInMessage(error.code), true);
    }
  }

  async function emailSignIn() {
    setStatus('Sending…');
    try {
      await sendEmailLink(email.value);
      setStatus('Check your email for the sign-in link. Open it on this device.');
    } catch (error) {
      setStatus(error.message || signInMessage(error.code), true);
    }
  }

  async function linkHistory() {
    closeMenu();
    const ok = window.confirm(
      'Connect the Iris conversations from this browser to your account?\n\n'
      + 'Iris will be able to remember them under your account from now on. The anonymous record stays where it is, '
      + 'and nothing is connected unless you choose OK.');
    if (!ok) return;
    try {
      const { result } = await api('/api/me/link-history', { method: 'POST', body: { clientId: identity?.clientId, consent: true } });
      window.alert(result === 'linked' ? 'Done. Iris will remember you under your account.' : 'Iris has no earlier chats from this browser to connect.');
    } catch (error) { window.alert(error.message); }
  }

  // What Iris holds is counted first, then deleted only after an explicit OK. Game progress, your sign-in and this
  // browser's own Iris id are not touched.
  async function forgetMemory() {
    closeMenu();
    try {
      const held = await api('/api/me/memory');
      const messages = held.conversationMessages ?? 0;
      if (!messages && !held.relationship) { window.alert('Iris has nothing saved about your account.'); return; }
      const ok = window.confirm(
        `Delete what Iris remembers about your account?\n\n`
        + `• ${messages} saved message${messages === 1 ? '' : 's'} from your conversations`
        + (held.linkedBrowsers ? ` (including ${held.linkedBrowsers} connected browser${held.linkedBrowsers === 1 ? '' : 's'})` : '') + `\n`
        + `• Her notes and feelings about you\n\n`
        + 'This cannot be undone. Your game progress, your sign-in and this browser\'s Iris ID are not affected.');
      if (!ok) return;
      const done = await api('/api/me/memory', { method: 'DELETE', body: { confirm: held.confirmation, scope: 'all' } });
      window.alert(`Done. ${done.conversationMessages ?? 0} saved messages were deleted and Iris has forgotten you.`);
    } catch (error) { window.alert(error.message); }
  }

  // The same, for someone who has not signed in: this browser's own anonymous memories. The browser's random id is the proof.
  async function forgetThisBrowser() {
    try {
      const url = base + '/api/chat/';
      const post = async (path, body) => {
        const response = await fetch(url + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), cache: 'no-store' });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Iris did not answer. Try again shortly.');
        return data;
      };
      const held = await post('memory', { clientId: identity?.clientId });
      const messages = held.conversationMessages ?? 0;
      if (!messages && !held.relationship) { setStatus('Iris has nothing saved about this browser.'); return; }
      const ok = window.confirm(
        `Delete what Iris remembers about this browser?\n\n• ${messages} saved message${messages === 1 ? '' : 's'}\n• Her notes about you\n\n`
        + 'This cannot be undone. Game progress and your sign-in are not affected.');
      if (!ok) return;
      const done = await post('forget', { clientId: identity?.clientId, confirm: held.confirmation, scope: 'all' });
      setStatus(`Done. ${done.conversationMessages ?? 0} saved messages were deleted.`);
    } catch (error) { setStatus(error.message, true); }
  }

  // Sign out of this Firebase session first, then ask Google again with the account chooser forced, so the
  // previous account is never picked automatically. If the visitor backs out they are simply signed out.
  async function switchAccount() {
    closeMenu();
    if (currentUser?.isAnonymous && !window.confirm(
      'This is a game handle that is not connected to Google or email. Switching accounts signs it out, and you may not be able to get back into it from this device. Switch anyway?')) return;
    await signOut(auth);
    const chooser = new provider.constructor();
    if (typeof chooser.setCustomParameters === 'function') chooser.setCustomParameters({ prompt: 'select_account' });
    try {
      if (window.self !== window.top) { await signInWithRedirect(auth, chooser); return; }
      await signInWithPopup(auth, chooser);
    } catch (error) {
      const cancelled = error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request';
      openModal();
      setStatus(cancelled ? 'Account switch cancelled. You are signed out.' : signInMessage(error.code), !cancelled);
    }
  }

  // Only signs out of Firebase. Nothing stored for the games or Iris (saves, the browser's Iris id) is touched.
  async function logOut() {
    closeMenu();
    if (currentUser?.isAnonymous && !window.confirm(
      'This is a game handle that is not connected to Google or email. Logging out may mean you cannot get back into it from this device. Log out anyway?')) return;
    try { await signOut(auth); }
    catch { window.alert('Could not log out. Check your connection and try again.'); }
  }

  const actions = {
    handle: () => openHandle(),
    settings: openSettings,
    controls: () => { location.href = './iris-controls.html'; },
    link: linkHistory,
    forget: forgetMemory,
    switch: switchAccount,
    logout: logOut,
  };

  const menuButtons = () => [...menu.querySelectorAll('button')];

  function renderMenu() {
    menu.replaceChildren();
    const who = el('div', 'district-account__who');
    who.append(
      el('strong', undefined, handle || 'Account'),
      ...(providerLabel(currentUser) ? [el('span', 'district-account__provider', providerLabel(currentUser))] : []),
    );
    menu.append(who);
    if (modeNote(me)) {
      const mode = el('div', 'district-account__modeline' + (modeBadge(me) ? ' district-account__modeline--test' : ''), modeNote(me));
      menu.append(mode);
    }
    for (const item of menuItems({ signedIn: true, admin: me.admin, needsHandle: handle === null })) {
      const entry = el('button', 'district-account__item', item.label);
      entry.type = 'button';
      entry.setAttribute('role', 'menuitem');
      entry.addEventListener('click', () => actions[item.id]?.());
      menu.append(entry);
    }
  }

  button.addEventListener('click', event => {
    event.preventDefault(); // the account name is a button, never a link or an in-page jump
    if (!currentUser) { openModal(); return; }
    if (!menu.hidden) { closeMenu(); return; }
    // Opens at once; what the Iris server says (administrator or not) fills in a moment later if it was not known yet
    renderMenu();
    placeMenu();
    menu.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    menuButtons()[0]?.focus({ preventScroll: true });
    refreshMe().then(() => {
      renderMode();
      if (menu.hidden || !currentUser) return;
      const position = menuButtons().indexOf(document.activeElement);
      renderMenu();
      if (position >= 0) menuButtons()[Math.min(position, menuButtons().length - 1)]?.focus({ preventScroll: true });
    });
  });
  menu.addEventListener('keydown', event => {
    const items = menuButtons();
    const at = items.indexOf(document.activeElement);
    const move = { ArrowDown: (at + 1) % items.length, ArrowUp: (at - 1 + items.length) % items.length, Home: 0, End: items.length - 1 }[event.key];
    if (move === undefined) return;
    event.preventDefault();
    items[move]?.focus({ preventScroll: true });
  });
  // Tab leaves the menu (arrow keys move within it): it closes and focus returns to the account button
  menu.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    event.preventDefault();
    closeMenu();
    button.focus({ preventScroll: true });
  });
  google.addEventListener('click', googleSignIn);
  forgetBrowser.addEventListener('click', forgetThisBrowser);
  send.addEventListener('click', emailSignIn);
  email.addEventListener('keydown', event => { if (event.key === 'Enter') emailSignIn(); });
  close.addEventListener('click', closeModal);
  modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
  settingsClose.addEventListener('click', closeSettings);
  settings.addEventListener('click', event => { if (event.target === settings) closeSettings(); });
  handleButton.addEventListener('click', () => { settings.hidden = true; openHandle(); });
  handleCheck.addEventListener('click', checkTypedHandle);
  handleSave.addEventListener('click', saveTypedHandle);
  handleInput.addEventListener('input', () => setHandleStatus(handleHint(handleInput.value)));
  handleInput.addEventListener('keydown', event => { if (event.key === 'Enter') saveTypedHandle(); });
  handleClose.addEventListener('click', dismissHandlePrompt);
  handleModal.addEventListener('click', event => { if (event.target === handleModal) dismissHandlePrompt(); });
  copyButton.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(currentUser?.uid || ''); copyButton.textContent = 'COPIED'; }
    catch { window.prompt('Copy your account ID:', currentUser?.uid || ''); }
    setTimeout(() => { copyButton.textContent = 'COPY ACCOUNT ID'; }, 1500);
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (!handleModal.hidden) dismissHandlePrompt();
    else if (!settings.hidden) closeSettings();
    else if (!modal.hidden) closeModal();
    else if (!menu.hidden) { closeMenu(); button.focus({ preventScroll: true }); }
  });
  document.addEventListener('click', event => { if (!menu.hidden && !root.contains(event.target) && !menu.contains(event.target)) closeMenu(); });
  window.addEventListener('resize', () => { if (!menu.hidden) closeMenu(); });

  onAuthStateChanged(auth, async user => {
    currentUser = user;
    handle = undefined;
    handleNextChange = null;
    renderLabel();
    // The chat sends this with each message so the server can verify who is talking; signed out it sends nothing
    identity?.setTokenProvider(user ? force => user.getIdToken(Boolean(force)) : null);
    // Remember (in this browser) whether anyone is signed in, and tell the chat the answer is now known, so its first
    // message is never sent before the saved sign-in has been restored
    identity?.setSignedInHint(Boolean(user));
    identity?.markReady();
    if (user && !modal.hidden) closeModal();
    if (!user) { closeMenu(); settings.hidden = true; handleModal.hidden = true; }
    await Promise.all([refreshMe(), refreshHandle()]);
    if (user !== currentUser) return;
    renderLabel();
    renderMode();
    // First sign-in without a handle: ask once per browser session (never blocks anything; NOT NOW is always there)
    let asked = false;
    try { asked = Boolean(sessionStorage.getItem(promptKey())); } catch { /* no storage: ask */ }
    if (user && handle === null && !asked && handleModal.hidden && modal.hidden) openHandle({ first: true });
  });

  // Finish an email sign-in if this page was opened from the emailed link
  completeEmailLink().catch(error => { openModal(); setStatus(error.message, true); });
}
