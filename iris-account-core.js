/*
==============================================================================
IRIS ACCOUNT CORE: the pieces of the account button that need no browser,
kept apart so they can be tested on their own.
==============================================================================
*/

/** The Iris service address: Render on the live site, same-origin everywhere else. */
export function irisBase(hostname, override) {
  if (typeof override === 'string') return override;
  return /(^|\.)thedarknetdistrict\.com$|\.github\.io$/.test(hostname || '')
    ? 'https://darknet-district-iris.onrender.com'
    : '';
}

/**
 * What the header button says: LOG IN when signed out, otherwise the public handle in uppercase. The Firebase display
 * name is never used, because for a Google account it is the person's real name; until the handle is known the
 * button just says ACCOUNT.
 */
export function accountLabel(user, handle) {
  if (!user) return 'LOG IN';
  const name = String(handle || '').replace(/[^A-Za-z0-9_]/g, '');
  if (!name) return 'ACCOUNT';
  return name.length > 12 ? name.slice(0, 11).toUpperCase() + '…' : name.toUpperCase();
}

/**
 * The account menu, from what the server confirmed. IRIS CONTROLS appears only when the server said
 * this account is an administrator; hiding it here is a courtesy, the server checks every request.
 */
export function menuItems({ signedIn, admin, needsHandle }) {
  if (!signedIn) return [];
  const items = [];
  if (needsHandle) items.push({ id: 'handle', label: 'CHOOSE YOUR HANDLE' });
  items.push({ id: 'settings', label: 'ACCOUNT SETTINGS' });
  if (admin) items.push({ id: 'controls', label: 'IRIS CONTROLS' });
  items.push({ id: 'switch', label: 'SWITCH ACCOUNT' });
  items.push({ id: 'logout', label: 'LOG OUT' });
  return items;
}

const PROVIDERS = {
  'google.com': 'Google',
  password: 'Email link',
  'emailLink': 'Email link',
};

/** How this account signs in, in plain words; null when Firebase does not say. */
export function providerLabel(user) {
  if (!user) return null;
  if (user.isAnonymous) return 'Game handle (not connected to Google or email)';
  const ids = (user.providerData || []).map(entry => entry && entry.providerId).filter(Boolean);
  if (!ids.length) return null;
  return ids.map(id => PROVIDERS[id] || id).join(' + ');
}

const day = text => {
  const time = Date.parse(text);
  return Number.isFinite(time) ? new Date(time).toISOString().slice(0, 10) : null;
};

/**
 * The rows of the account information panel. Only what the account itself holds: never a token, a
 * credential or anything Iris remembers. Rows with no value are left out.
 */
export function accountDetails(user, me, handle) {
  if (!user) return [];
  const rows = [
    ['HANDLE', handle || null],
    ['EMAIL (PRIVATE)', user.email || null],
    ['SIGN-IN METHOD', providerLabel(user)],
    ['EMAIL VERIFIED', user.email ? (user.emailVerified ? 'Yes' : 'No') : null],
    ['MEMBER SINCE', day(user.metadata && user.metadata.creationTime)],
    ['LAST SIGN-IN', day(user.metadata && user.metadata.lastSignInTime)],
    ['IRIS ACCESS', me && me.admin ? 'Administrator' : null],
    ['ACCOUNT ID', user.uid || null],
  ];
  return rows.filter(([, value]) => value);
}

/**
 * For the administrator only: a short tag on the account button whenever Iris is NOT treating them as the owner, so a
 * test mode can never be left on unnoticed. Empty in Owner mode and for everyone else.
 */
export function modeBadge(me) {
  if (!me || !me.admin) return '';
  return me.mode === 'new' ? 'NEW' : me.mode === 'returning' ? 'RET' : '';
}

/** One plain sentence about the administrator's current Iris mode (empty for everyone else). */
export function modeNote(me) {
  if (!me || !me.admin) return '';
  if (me.mode === 'new') return 'Iris mode: NEW VISITOR. Iris treats you as a stranger and nothing you say is remembered.';
  if (me.mode === 'returning') return 'Iris mode: RETURNING VISITOR. A separate test visitor with its own memory, not yours.';
  return 'Iris mode: OWNER. Iris knows you and remembers your conversations.';
}

/** A short, plain message for each sign-in problem. */
export function signInMessage(code) {
  switch (code) {
    case 'auth/popup-blocked': return 'Allow pop-ups for this site, then try again.';
    case 'auth/network-request-failed': return 'Network problem. Check your connection and try again.';
    case 'auth/too-many-requests': return 'Too many attempts. Wait a few minutes and try again.';
    case 'auth/unauthorized-domain': return 'Sign-in is not enabled for this address yet.';
    case 'auth/operation-not-allowed': return 'This sign-in method is not turned on yet.';
    default: return 'Sign-in did not work. Try again shortly.';
  }
}

/** Mirrors the server's rule, so the form can answer before asking: 3-20 letters, numbers and underscores. */
export const HANDLE_PATTERN = /^[A-Za-z0-9_]{3,20}$/;

/** One plain sentence for the handle form while typing; empty when the shape is fine. */
export function handleHint(value) {
  const text = String(value || '').trim();
  if (!text) return 'Pick 3 to 20 letters, numbers or underscores.';
  if (text.length < 3) return 'At least 3 characters.';
  if (text.length > 20) return 'At most 20 characters.';
  if (!HANDLE_PATTERN.test(text)) return 'Letters, numbers and underscores only.';
  return '';
}
