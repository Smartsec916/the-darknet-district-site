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
==============================================================================
*/
(function () {
  var KEY = 'irisClientId';

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

  window.IrisIdentity = {
    clientId: clientId,
    // The administrator's current Iris mode ('owner', 'new', 'returning'), or null for everyone else
    mode: null,
    setMode: function (mode) { this.mode = mode || null; },
    setTokenProvider: function (provider) { tokenProvider = typeof provider === 'function' ? provider : null; },
    authHeaders: function () {
      if (!tokenProvider) return Promise.resolve({});
      return Promise.resolve()
        .then(tokenProvider)
        .then(function (token) { return token ? { Authorization: 'Bearer ' + token } : {}; })
        .catch(function () { return {}; });
    }
  };
})();
