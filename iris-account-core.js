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

/** What the header button says: LOG IN when signed out, otherwise a short uppercase name. */
export function accountLabel(user) {
  if (!user) return 'LOG IN';
  const name = String(user.displayName || '').replace(/[^\p{L}\p{N}_\- ]/gu, '').trim();
  if (!name) return 'ACCOUNT';
  return name.length > 12 ? name.slice(0, 11).toUpperCase() + '…' : name.toUpperCase();
}

/**
 * The account menu, from what the server confirmed. IRIS CONTROLS appears only when the server said
 * this account is an administrator; hiding it here is a courtesy, the server checks every request.
 */
export function menuItems({ signedIn, admin }) {
  if (!signedIn) return [];
  const items = [{ id: 'settings', label: 'ACCOUNT SETTINGS' }];
  if (admin) items.push({ id: 'controls', label: 'IRIS CONTROLS' });
  else {
    items.push({ id: 'link', label: 'LINK MY IRIS HISTORY' });
    items.push({ id: 'forget', label: 'FORGET WHAT IRIS REMEMBERS' });
  }
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
export function accountDetails(user, me) {
  if (!user) return [];
  const rows = [
    ['NAME', user.displayName || null],
    ['EMAIL', user.email || null],
    ['SIGN-IN METHOD', providerLabel(user)],
    ['EMAIL VERIFIED', user.email ? (user.emailVerified ? 'Yes' : 'No') : null],
    ['MEMBER SINCE', day(user.metadata && user.metadata.creationTime)],
    ['LAST SIGN-IN', day(user.metadata && user.metadata.lastSignInTime)],
    ['IRIS ACCESS', me && me.admin ? 'Administrator' : null],
    ['ACCOUNT ID', user.uid || null],
  ];
  return rows.filter(([, value]) => value);
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
