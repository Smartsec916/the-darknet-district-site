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
import { sendEmailLink, completeEmailLink } from './district-identity.js';
import { accountLabel, irisBase, menuItems, signInMessage } from './iris-account-core.js';

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
  button.append(index, label);

  const menu = el('div', 'district-account__menu');
  menu.setAttribute('role', 'menu');
  menu.hidden = true;

  const modal = el('div', 'district-login');
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
  const status = el('p', 'district-login__status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  const close = el('button', 'district-login__close', 'CLOSE');
  close.type = 'button';
  panel.append(title, intro, google, emailLabel, email, send, status, close);
  modal.append(panel);

  root.append(button);
  // The menu and the sign-in panel live on the page itself, not inside the header, so nothing on the page
  // (the header's own stacking, the hero content) can cover or clip them
  document.body.append(menu, modal);

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
      'Connect the Iris chats from this browser to your account?\n\n'
      + 'Iris will remember them under your account from now on. The anonymous record stays where it is, '
      + 'and nothing is connected unless you choose OK.');
    if (!ok) return;
    try {
      const { result } = await api('/api/me/link-history', { method: 'POST', body: { clientId: identity?.clientId, consent: true } });
      window.alert(result === 'linked' ? 'Done. Iris will remember you under your account.' : 'Iris has no earlier chats from this browser to connect.');
    } catch (error) { window.alert(error.message); }
  }

  async function forgetMemory() {
    closeMenu();
    if (!window.confirm('Erase what Iris remembers about your account (her mood toward you, trust and what you told her)? Your chat transcripts are not affected.')) return;
    try {
      const { erased } = await api('/api/me/forget', { method: 'POST' });
      window.alert(erased ? 'Iris has forgotten you.' : 'Iris had nothing saved for your account.');
    } catch (error) { window.alert(error.message); }
  }

  async function copyId() {
    closeMenu();
    try {
      await navigator.clipboard.writeText(me.accountId || currentUser?.uid || '');
      window.alert('Account ID copied.');
    } catch { window.prompt('Copy your account ID:', me.accountId || currentUser?.uid || ''); }
  }

  const actions = {
    controls: () => { location.href = './iris-controls.html'; },
    link: linkHistory,
    forget: forgetMemory,
    'copy-id': copyId,
    logout: async () => { closeMenu(); await signOut(auth); },
  };

  function renderMenu() {
    menu.replaceChildren();
    for (const item of menuItems({ signedIn: Boolean(currentUser), admin: me.admin })) {
      const entry = el('button', 'district-account__item', item.id === 'identity' ? `${item.label}: ${currentUser.displayName || currentUser.email || 'account'}` : item.label);
      entry.type = 'button';
      entry.setAttribute('role', 'menuitem');
      if (item.disabled) { entry.disabled = true; } else { entry.addEventListener('click', () => actions[item.id]?.()); }
      menu.append(entry);
    }
  }

  button.addEventListener('click', async () => {
    if (!currentUser) { openModal(); return; }
    if (menu.hidden) {
      await refreshMe();
      renderMenu();
      placeMenu();
      menu.hidden = false;
      button.setAttribute('aria-expanded', 'true');
      menu.querySelector('button:not(:disabled)')?.focus();
    } else closeMenu();
  });
  google.addEventListener('click', googleSignIn);
  send.addEventListener('click', emailSignIn);
  email.addEventListener('keydown', event => { if (event.key === 'Enter') emailSignIn(); });
  close.addEventListener('click', closeModal);
  modal.addEventListener('click', event => { if (event.target === modal) closeModal(); });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (!modal.hidden) closeModal(); else if (!menu.hidden) { closeMenu(); button.focus(); }
  });
  document.addEventListener('click', event => { if (!menu.hidden && !root.contains(event.target) && !menu.contains(event.target)) closeMenu(); });
  window.addEventListener('resize', () => { if (!menu.hidden) closeMenu(); });

  onAuthStateChanged(auth, async user => {
    currentUser = user;
    label.textContent = accountLabel(user);
    button.setAttribute('aria-label', user ? `Account menu for ${label.textContent}` : 'Log in');
    // The chat sends this with each message so the server can verify who is talking; signed out it sends nothing
    identity?.setTokenProvider(user ? () => user.getIdToken() : null);
    if (user && !modal.hidden) closeModal();
    await refreshMe();
  });

  // Finish an email sign-in if this page was opened from the emailed link
  completeEmailLink().catch(error => { openModal(); setStatus(error.message, true); });
}
