/*
==============================================================================
THE DARKNET DISTRICT — HANDLES

Shared by every game. A visitor registers a public handle without any Google
account (a Firebase anonymous account), can secure it later with an email
link or Google so it survives on other devices, and can still just use Google.

The server only ever sees the account's ID, so saves, leaderboards and
purchases work the same whichever way someone signs in.
==============================================================================
*/

const BASE = ['localhost', '127.0.0.1'].includes(location.hostname) ? '' : 'https://the-darknet-district-site.onrender.com';
const ROOT = `${BASE}/api/identity`;
const EMAIL_KEY = 'districtEmailForSignIn';
export const HANDLE_PATTERN = /^[A-Za-z0-9_]{3,20}$/;

let firebasePromise = null;
function firebase() {
  firebasePromise ??= import(new URL('./firebase-auth.js', import.meta.url).href);
  return firebasePromise;
}

async function request(path, { method = 'GET', body, user, timeout = 8000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (user) headers.Authorization = `Bearer ${await user.getIdToken()}`;
    const response = await fetch(ROOT + path, {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store', credentials: 'omit', signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'The handle service is unavailable right now.');
    return data;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('The handle service timed out. Try again shortly.');
    if (error instanceof TypeError) throw new Error('The handle service is unreachable right now. Check your connection and try again.');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/** True when the account can be recovered on another device. */
export function isSecured(user) {
  return Boolean(user && !user.isAnonymous);
}

/**
 * The public handle of a signed-in account, from the handle registry (never from the Firebase display name, which
 * can be the real name Google holds). Resolves { handle: string | null, nextChangeAt }; rejects when the handle
 * service cannot be reached, so callers can tell "no handle yet" from "unknown".
 */
export function fetchHandle(user) {
  return request('/me', { user });
}

/** A handle that is safe to show for an account whose registry entry is not known: only anonymous handle accounts. */
export function handleOf(user) {
  return user?.isAnonymous && HANDLE_PATTERN.test(user.displayName || '') ? user.displayName : null;
}

export function checkHandle(handle) {
  if (!HANDLE_PATTERN.test(handle || '')) return Promise.reject(new Error('Use 3–20 letters, numbers, or underscores.'));
  return request(`/handles/${encodeURIComponent(handle)}/available`);
}

/**
 * Register (or change) the visitor's public handle. Creates an anonymous
 * account first when nobody is signed in. Returns the signed-in user.
 */
export async function registerHandle(handle) {
  return (await claimHandle(handle)).user;
}

/** Like registerHandle, but also returns the handle exactly as the server stored it: { handle, nextChangeAt, user }. */
export async function claimHandle(handle) {
  handle = String(handle || '').trim();
  if (!HANDLE_PATTERN.test(handle)) throw new Error('Use 3–20 letters, numbers, or underscores.');
  const fb = await firebase();
  if (!fb.auth.currentUser) {
    const { available } = await checkHandle(handle);
    if (!available) throw new Error('That handle is taken.');
    try {
      await fb.signInAnonymously(fb.auth);
    } catch (error) {
      throw new Error('Handle registration is unavailable right now. Try again shortly.');
    }
  }
  const user = fb.auth.currentUser;
  const saved = await request('/handle', { method: 'POST', body: { handle }, user });
  // Pick up the display name the server just set. The registry answer above is what counts, so a failure here is harmless.
  try { await user.reload(); await user.getIdToken(true); } catch { /* the handle is saved either way */ }
  return { handle: saved.handle, nextChangeAt: saved.nextChangeAt, user: fb.auth.currentUser };
}

/** Email a one-time sign-in link. Secures an anonymous handle when opened. */
export async function sendEmailLink(email) {
  email = String(email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.');
  const fb = await firebase();
  const url = new URL(location.href);
  for (const key of ['apiKey', 'oobCode', 'mode', 'lang', 'continueUrl']) url.searchParams.delete(key);
  await fb.sendSignInLinkToEmail(fb.auth, email, { url: url.href, handleCodeInApp: true });
  try { localStorage.setItem(EMAIL_KEY, email); } catch {}
  return email;
}

function cleanLinkFromAddress() {
  const url = new URL(location.href);
  for (const key of ['apiKey', 'oobCode', 'mode', 'lang', 'continueUrl']) url.searchParams.delete(key);
  history.replaceState(null, '', url.href);
}

/**
 * Finish an email sign-in link if this page was opened from one.
 * Returns null, or { result: 'secured' | 'signed-in' | 'switched', user }.
 * 'secured' keeps the current handle; 'switched' means the email already
 * belonged to another account, which is now signed in instead.
 */
export async function completeEmailLink(askForEmail = () => window.prompt('Confirm the email address this link was sent to:')) {
  const fb = await firebase();
  if (!fb.isSignInWithEmailLink(fb.auth, location.href)) return null;
  let email = null;
  try { email = localStorage.getItem(EMAIL_KEY); } catch {}
  email ||= askForEmail();
  if (!email) return null;
  const link = location.href;
  try {
    const current = fb.auth.currentUser;
    if (current && current.isAnonymous) {
      try {
        await fb.linkWithCredential(current, fb.EmailAuthProvider.credentialWithLink(email, link));
        return { result: 'secured', user: fb.auth.currentUser };
      } catch (error) {
        if (!['auth/email-already-in-use', 'auth/credential-already-in-use', 'auth/provider-already-linked'].includes(error.code)) throw error;
        await fb.signInWithEmailLink(fb.auth, email, link);
        return { result: 'switched', user: fb.auth.currentUser };
      }
    }
    await fb.signInWithEmailLink(fb.auth, email, link);
    return { result: 'signed-in', user: fb.auth.currentUser };
  } catch (error) {
    if (error.code === 'auth/invalid-action-code' || error.code === 'auth/expired-action-code') {
      throw new Error('That sign-in link has expired or was already used. Request a new one.');
    }
    if (error.code === 'auth/invalid-email') throw new Error('That email does not match the one the link was sent to.');
    throw new Error('Email sign-in failed. Request a new link and try again.');
  } finally {
    try { localStorage.removeItem(EMAIL_KEY); } catch {}
    cleanLinkFromAddress();
  }
}

/** Attach Google to an anonymous handle so it can be recovered anywhere. */
export async function secureWithGoogle() {
  const fb = await firebase();
  const user = fb.auth.currentUser;
  if (!user) throw new Error('Register a handle first.');
  try {
    await fb.linkWithPopup(user, fb.provider);
    return fb.auth.currentUser;
  } catch (error) {
    if (error.code === 'auth/popup-closed-by-user') return null;
    if (error.code === 'auth/popup-blocked') throw new Error('Allow the Google popup, then try again.');
    if (error.code === 'auth/credential-already-in-use') {
      throw new Error('That Google account already has its own handle. Sign out and sign in with Google to use it.');
    }
    throw new Error('Could not connect Google. Try again shortly.');
  }
}
