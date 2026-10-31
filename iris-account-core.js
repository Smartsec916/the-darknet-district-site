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
  const items = [{ id: 'identity', label: 'SIGNED IN', disabled: true }];
  if (admin) items.push({ id: 'controls', label: 'IRIS CONTROLS' });
  else {
    items.push({ id: 'link', label: 'LINK MY IRIS HISTORY' });
    items.push({ id: 'forget', label: 'FORGET WHAT IRIS REMEMBERS' });
  }
  items.push({ id: 'copy-id', label: 'COPY ACCOUNT ID' });
  items.push({ id: 'logout', label: 'LOG OUT' });
  return items;
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
