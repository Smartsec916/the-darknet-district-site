/*
==============================================================================
IRIS VISITOR IDENTITY (classic script, loaded before script.js)

Gives the chat two things, with no visible change to it:
  - clientId: a random id this browser makes once and keeps in its own storage,
    so Iris can recognize a returning visitor. It is not derived from the IP
    address, the device or anything else, and clearing site data makes the
    browser a stranger again.
  - authHeaders(): when someone is signed in (see iris-account.js), the sign-in
    token to send with chat requests so the server can verify who they are.
    Signed out, it sends nothing extra and the chat works exactly as before.

A signed-in person must never be silently treated as a stranger. The browser
restores a saved sign-in a moment after the page loads, so:
  - the page remembers (in this browser only) that someone was signed in, and
    while it is waiting to hear back, the first message waits up to 3 seconds;
  - a request from a browser that expects to be signed in carries
    X-Iris-Signed-In: 1, so the server can refuse it (instead of filing it under
    no one) if the token is missing or expired, and the chat refreshes the token
    and tries again (see script.js);
  - a visitor who is not signed in is never delayed and sends no such header.
==============================================================================
*/
(function () {
  var KEY = 'irisClientId';
  var HINT = 'irisSignedIn';
  var WAIT_MS = 3000;

  function randomId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    var bytes = new Uint8Array(16);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(bytes);
    else for (var i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    return 'client_' + Array.prototype.map.call(bytes, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
  }

  var clientId;
  try {
    clientId = window.localStorage.getItem(KEY);
    if (!clientId) {
      clientId = randomId();
      window.localStorage.setItem(KEY, clientId);
    }
  } catch (error) {
    // Storage blocked: an id for this page view only, so nothing is remembered afterwards
    clientId = 'temp_' + randomId();
  }

  var tokenProvider = null;
  var ready = false;
  var waiters = [];

  function becomeReady() {
    ready = true;
    var pending = waiters.splice(0);
    for (var i = 0; i < pending.length; i++) pending[i]();
  }

  function readHint() {
    try { return window.localStorage.getItem(HINT) === '1'; } catch (error) { return false; }
  }
  function writeHint(on) {
    try {
      if (on) window.localStorage.setItem(HINT, '1');
      else window.localStorage.removeItem(HINT);
    } catch (error) { /* nothing to remember it with */ }
  }

  // Resolves when the page knows whether anyone is signed in, or after ms, whichever comes first
  function whenReady(ms) {
    if (ready) return Promise.resolve();
    return new Promise(function (resolve) {
      var timer = setTimeout(resolve, ms);
      waiters.push(function () { clearTimeout(timer); resolve(); });
    });
  }

  window.IrisIdentity = {
    clientId: clientId,
    // The administrator's current Iris mode ('owner', 'new', 'returning'), or null for everyone else
    mode: null,
    setMode: function (mode) { this.mode = mode || null; },
    // provider(forceRefresh) returns the current sign-in token (a fresh one when forceRefresh is true)
    setTokenProvider: function (provider) { tokenProvider = typeof provider === 'function' ? provider : null; },
    // Called once the page has heard from the sign-in service, signed in or not
    markReady: function () { becomeReady(); },
    // Remembered in this browser only: someone was signed in here the last time we heard
    setSignedInHint: function (on) { writeHint(Boolean(on)); },
    signedInHint: readHint,

    // The headers for a chat request. Never throws: a token problem means "no token", and the server decides.
    authHeaders: function (forceRefresh) {
      var wait = !tokenProvider && readHint() && !ready ? whenReady(WAIT_MS) : Promise.resolve();
      return wait.then(function () {
        var expectsSignIn = readHint();
        var marker = expectsSignIn ? { 'X-Iris-Signed-In': '1' } : {};
        if (!tokenProvider) return marker;
        return Promise.resolve()
          .then(function () { return tokenProvider(Boolean(forceRefresh)); })
          .then(function (token) { return token ? { Authorization: 'Bearer ' + token, 'X-Iris-Signed-In': '1' } : marker; })
          .catch(function () { return marker; });
      });
    },
    // The last resort when the sign-in cannot be attached: an ordinary anonymous request
    anonymousHeaders: function () { return {}; }
  };
})();
