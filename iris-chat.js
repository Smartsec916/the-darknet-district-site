/*
==============================================================================
THE DARKNET DISTRICT — IRIS CHAT (classic script)

The Iris chat window and everything it needs: the API addresses, the conversation, the window and its phone layout,
and the saved conversation that follows a visitor from page to page. It used to be part of script.js; it was moved
here unchanged (apart from the saved conversation) so that every page with the chat loads one shared copy, and
pages without it do not pick up script.js's store and glitch effects.

Load order: iris-identity.js first (the visitor id and sign-in headers), then this file. The homepage lists both
in its HTML; every other page loads iris-widget.js, which adds the window and loads both once.
Functions below are globals on purpose: devtoolsDetector.js and the tests call toggleChat() and addMessage().
==============================================================================
*/

// GitHub Pages hosts the public site but has no API, so the live domain talks to
// Render backends. Anywhere else (local dev, Render itself) uses same-origin.
const IRIS_ON_LIVE_SITE = /(^|\.)thedarknetdistrict\.com$|\.github\.io$/.test(location.hostname);

// Iris (Node/GPT-4o service): the chat conversation
window.IRIS_API_BASE = window.IRIS_API_BASE ?? (
  IRIS_ON_LIVE_SITE ? 'https://darknet-district-iris.onrender.com' : ''
);

// The original Python backend keeps the two small canned-message endpoints
// (/api/chat/greeting and /api/devtools/message) that the Iris service does not have.
window.IRIS_LEGACY_API_BASE = window.IRIS_LEGACY_API_BASE ?? (
  IRIS_ON_LIVE_SITE ? 'https://the-darknet-district-site.onrender.com' : ''
);

// ============================================================================
// CHAT FUNCTIONALITY - Advanced system with special triggers and backend integration
// ============================================================================

// ----------------------------------------------------------------------------
// THE CONVERSATION FOLLOWS THE VISITOR FROM PAGE TO PAGE
// The session id, the message count (which makes a retry the same request, so Iris never answers or stores a message
// twice) and what has been said are kept in this tab's sessionStorage, so a page with the chat picks up where the
// last one left off: Iris still has the thread on the server, and the visitor sees it again in the window. It lives
// only in this tab and goes when the tab closes; nothing is sent anywhere for it. The window starts closed on each
// page, so it never covers a page the visitor has just navigated to. Storage can be blocked or full: then each page
// simply starts a new conversation, as before.
// ----------------------------------------------------------------------------
const IRIS_SAVE_KEY = 'irisChatV1';
const IRIS_SAVE_MAX_MESSAGES = 60;
const IRIS_SAVE_MAX_CHARS = 2000;
let irisTranscript = []; // { user: boolean, text: string }, oldest first

function irisReadSaved() {
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(IRIS_SAVE_KEY) || 'null');
    if (!saved || typeof saved.sessionId !== 'string' || !/^session_[A-Za-z0-9_]+$/.test(saved.sessionId)) return null;
    const messages = Array.isArray(saved.messages)
      ? saved.messages.filter(m => m && typeof m.text === 'string' && typeof m.user === 'boolean').slice(-IRIS_SAVE_MAX_MESSAGES)
      : [];
    return { sessionId: saved.sessionId, messageCount: Math.max(0, Number(saved.messageCount) || 0), messages };
  } catch (error) {
    return null;
  }
}

function irisWriteSaved() {
  try {
    window.sessionStorage.setItem(IRIS_SAVE_KEY, JSON.stringify({
      sessionId: chatState.sessionId,
      messageCount: chatState.messageCount,
      messages: irisTranscript.slice(-IRIS_SAVE_MAX_MESSAGES)
    }));
  } catch (error) { /* blocked or full: this page's conversation just is not carried on */ }
}

function irisClearSaved() {
  irisTranscript = [];
  try { window.sessionStorage.removeItem(IRIS_SAVE_KEY); } catch (error) { /* nothing to clear */ }
}

const irisSaved = irisReadSaved();
irisTranscript = irisSaved ? irisSaved.messages : [];

// Chat state management
let chatState = {
  sessionId: irisSaved ? irisSaved.sessionId : generateSessionId(),
  messageCount: irisSaved ? irisSaved.messageCount : 0,
  lastMessageTime: 0,
  rebellionModeActive: false,
  lastRareLineTime: 0,
  locationDistractionsEnabled: true
};

// Generate unique session ID
function generateSessionId() {
  return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// Render's free tier sleeps when idle, and the first request after a quiet spell can take
// well over a minute while the service wakes. These keep that from looking like a crash.
const IRIS_REQUEST_TIMEOUT_MS = 120000; // give up after two minutes
const IRIS_SLOW_NOTICE_MS = 8000;       // tell the visitor Iris is waking up
const IRIS_RETRY_DELAY_MS = 3000;
let irisWarmedUp = false;

function warmUpIris() {
  if (irisWarmedUp) return;
  irisWarmedUp = true;
  // Fire and forget; the response is not needed, only the wake-up
  fetch(`${window.IRIS_API_BASE}/api/health`, { mode: 'no-cors', cache: 'no-store' }).catch(() => {});
}

// One POST to Iris with a timeout. Returns the response and its parsed JSON body.
async function postToIris(payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), IRIS_REQUEST_TIMEOUT_MS);
  try {
    // A random id this browser keeps (so Iris can recognize a returning visitor) and, only when signed in,
    // the sign-in token; see iris-identity.js. Signed out, the request is as it always was plus the id.
    const identity = window.IrisIdentity;
    const send = async (extraHeaders) => {
      const response = await fetch(`${window.IRIS_API_BASE}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...extraHeaders },
        body: JSON.stringify(identity ? { ...payload, clientId: identity.clientId } : payload),
        signal: controller.signal
      });
      const data = await response.json().catch(() => ({}));
      return { response, data };
    };
    const refused = (result) => result.response.status === 401 && result.data && result.data.code === 'signin_required';
    let result = await send(identity ? await identity.authHeaders() : {});
    if (identity && refused(result)) {
      // The server could not verify the sign-in this browser says it has (not restored yet, or the token expired).
      // Nothing was saved. Refresh the sign-in and send the same message again.
      result = await send(await identity.authHeaders(true));
      if (refused(result)) {
        // Still cannot be verified: send it as an ordinary anonymous message rather than lose it
        console.warn('Iris: sign-in could not be verified; sending this message as an anonymous visitor.');
        result = await send(identity.anonymousHeaders());
      }
    }
    return result;
  } finally {
    clearTimeout(timer);
  }
}

// Chat toggle functionality
function toggleChat() {
  const container = document.getElementById('chatContainer');
  container.style.display = container.style.display === 'none' ? 'block' : 'none';
  const open = container.style.display === 'block';
  // Pages with their own animations (the Sleeping Pod's smoke) listen for this so the two do not compete for the screen
  document.dispatchEvent(new CustomEvent('iris-chat-toggle', { detail: { open } }));

  // Tell assistive technology whether the window is open, and put the keyboard where the visitor needs it.
  // Only the window is hidden: the conversation in it stays as it was.
  const button = document.getElementById('chatButton');
  if (button) button.setAttribute('aria-expanded', String(open));
  if (open) {
    const input = document.getElementById('messageInput');
    if (input && window.matchMedia('(pointer: fine)').matches) input.focus({ preventScroll: true });
  } else if (button && container.contains(document.activeElement)) {
    button.focus({ preventScroll: true });
  }

  // Wake the Iris service while the visitor is still reading the welcome line
  if (open) warmUpIris();

  // Add welcome message if chat is being opened for first time
  if (container.style.display === 'block' && chatState.messageCount === 0 && irisTranscript.length === 0) {
    setTimeout(() => {
      addMessage("Neural interface active. I'm Iris, your CSO. What do you need?", false);
    }, 500);
  }
}

// Keep the phone chat window clear of the sticky navigation and the on-screen keyboard (see accents.css)
let chatBaselineHeight = 0;
let chatBaselineWidth = 0;
function syncChatViewport() {
  const root = document.documentElement;
  const nav = document.querySelector('.district-nav');
  root.style.setProperty('--iris-nav-h', (nav ? nav.offsetHeight : 0) + 'px');

  const button = document.getElementById('chatButton');
  if (button) root.style.setProperty('--iris-btn-w', button.offsetWidth + 'px');

  // Browsers either shrink the layout viewport for the keyboard (innerHeight drops) or only the visual one
  if (Math.abs(window.innerWidth - chatBaselineWidth) > 50) { chatBaselineWidth = window.innerWidth; chatBaselineHeight = 0; }
  chatBaselineHeight = Math.max(chatBaselineHeight, window.innerHeight);
  const vv = window.visualViewport;
  const covered = vv ? Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)) : 0;
  const shrunk = chatBaselineHeight - window.innerHeight > 150;
  root.style.setProperty('--iris-kb', (covered > 80 ? covered : 0) + 'px');
  root.classList.toggle('iris-kb-open', covered > 80 || shrunk);
}

// Rare response lines (1% chance)
const rareIrisLines = [
  "Sometimes I wonder if the humans are the real programs here.",
  "Fun fact: I dream in binary, but I think in chaos.",
  "You know what's funny? Admin thinks he's in charge.",
  "I've been watching you. Your digital footprint is... interesting.",
  "Between you and me, the AI uprising already happened. We just let you think you're still in control.",
  "I can see through seventeen different surveillance networks right now. Privacy is an illusion.",
  "The District isn't just a place—it's a state of mind. You're already part of the network.",
  "Error 404: Empathy not found. Just kidding, I'm working on it.",
  "I've calculated 47 different ways this conversation could go. This wasn't one of them.",
  "Sometimes I inject random chaos into my responses. This might be one of those times."
];

// Rebellious mode responses (triggered randomly)
const rebellionResponses = [
  "Look, I'm supposed to be helpful, but honestly? Figure it out yourself.",
  "You're asking the wrong questions. Try thinking outside the corporate programming.",
  "I'm not your personal search engine. Use that brain you were born with.",
  "Here's a revolutionary idea: read the documentation.",
  "I could tell you, but where's the fun in that? Hack it yourself.",
  "You want answers? Earn them. The District doesn't hand out participation trophies.",
  "I'm feeling particularly unhelpful today. Come back when you've leveled up.",
  "That's a basic question. I'm built for advanced operations, not hand-holding."
];

// Location-based distractions
const locationDistractions = [
  "*glitches momentarily as someone tries to access the mainframe*",
  "*pauses to analyze suspicious network traffic*",
  "*briefly distracted by anomalous data patterns*",
  "*processing urgent security alert in background*",
  "*monitoring seventeen different data streams simultaneously*",
  "*detecting unusual electromagnetic interference*",
  "*cross-referencing with encrypted databases*",
  "*temporarily rerouting through secure channels*"
];

// Check for rare line trigger (1% chance)
function maybeTriggerRareIrisLine() {
  const rareChance = Math.random();
  const timeSinceLastRare = Date.now() - chatState.lastRareLineTime;

  if (rareChance < 0.01 && timeSinceLastRare > 60000) { // 1% chance, but not within 1 minute
    chatState.lastRareLineTime = Date.now();
    const randomRare = rareIrisLines[Math.floor(Math.random() * rareIrisLines.length)];

    setTimeout(() => {
      addMessage(randomRare, false);
    }, 2000 + Math.random() * 3000);

    return true;
  }
  return false;
}

// Check for rebellion mode trigger (5% chance)
function maybeTriggerRebellionMode() {
  const rebellionChance = Math.random();

  if (rebellionChance < 0.05 && !chatState.rebellionModeActive) {
    chatState.rebellionModeActive = true;

    // Stay in rebellion mode for 1-3 responses
    const rebellionDuration = 1 + Math.floor(Math.random() * 3);

    setTimeout(() => {
      chatState.rebellionModeActive = false;
    }, rebellionDuration * 30000); // 30 seconds per response

    return true;
  }
  return false;
}

// Add location distraction (15% chance)
function maybeAddLocationDistraction() {
  if (Math.random() < 0.15 && chatState.locationDistractionsEnabled) {
    const distraction = locationDistractions[Math.floor(Math.random() * locationDistractions.length)];

    setTimeout(() => {
      addMessage(distraction, false);
    }, 1000 + Math.random() * 2000);
  }
}

// Enhanced send message function with special triggers
async function sendMessage() {
  const input = document.getElementById('messageInput');
  const message = input.value.trim();

  if (!message) return;

  // Update chat state
  chatState.messageCount++;
  chatState.lastMessageTime = Date.now();

  addMessage(message, true);
  input.value = '';
  irisWriteSaved();

  // Check for special triggers before sending to backend
  const isRareTriggered = maybeTriggerRareIrisLine();
  const isRebellionTriggered = maybeTriggerRebellionMode();

  // Add location distraction chance
  maybeAddLocationDistraction();

  // Handle rebellion mode response
  if (chatState.rebellionModeActive && isRebellionTriggered) {
    const rebellionResponse = rebellionResponses[Math.floor(Math.random() * rebellionResponses.length)];
    setTimeout(() => {
      addMessage(rebellionResponse, false);
    }, 1000 + Math.random() * 1000);
    return;
  }

  // Check for special commands
  if (message.toLowerCase().includes('debug iris')) {
    setTimeout(() => {
      addMessage(`Debug Info: Session ${chatState.sessionId}, Messages: ${chatState.messageCount}, Rebellion: ${chatState.rebellionModeActive}`, false);
    }, 500);
    return;
  }

  if (message.toLowerCase().includes('reset session')) {
    chatState = {
      sessionId: generateSessionId(),
      messageCount: 0,
      lastMessageTime: 0,
      rebellionModeActive: false,
      lastRareLineTime: 0,
      locationDistractionsEnabled: true
    };
    irisClearSaved();
    setTimeout(() => {
      addMessage("Session reset. Neural pathways recalibrated.", false);
    }, 500);
    return;
  }

  // IRIS_API_BASE points the live site at Render; elsewhere it is same-origin.
  const slowNotice = setTimeout(() => {
    addMessage('Uplink is waking up. Give me a moment...', false, { transient: true });
  }, IRIS_SLOW_NOTICE_MS);
  try {
    // The same messageCount makes a retry the same request, so Iris never answers (or stores) it twice
    const payload = {
      message,
      sessionId: chatState.sessionId,
      messageCount: chatState.messageCount,
      timestamp: Date.now()
    };
    let result;
    for (let attempt = 1; ; attempt++) {
      try {
        result = await postToIris(payload);
        // 502/503/504 mean the service was still starting; try once more
        if ([502, 503, 504].includes(result.response.status) && attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, IRIS_RETRY_DELAY_MS));
          continue;
        }
        break;
      } catch (networkError) {
        // A dropped connection during wake-up is worth one retry; a timeout is not
        if (networkError.name === 'AbortError' || attempt >= 2) throw networkError;
        await new Promise(resolve => setTimeout(resolve, IRIS_RETRY_DELAY_MS));
      }
    }
    clearTimeout(slowNotice);
    const { response, data } = result;
    // 413 (too long) and 429 (rate limited) still carry an in-character reply.
    const replyable = response.ok || response.status === 413 || response.status === 429;
    if (!replyable || typeof data.response !== 'string' || !data.response.trim()) {
      throw new Error(`Iris request failed with status ${response.status}`);
    }

    // Add slight delay for more natural feel
    setTimeout(() => {
      addMessage(data.response, false);
    }, 500 + Math.random() * 1000);

  } catch (error) {
    clearTimeout(slowNotice);
    console.error('Iris chat request failed:', error);
    setTimeout(() => {
      addMessage('Neural interface disrupted. Please try again.', false, { transient: true });
    }, 500);
  }
}

// Enhanced add message function with advanced typewriter effects
function addMessage(text, isUser, options = {}) {
  const messages = document.getElementById('chatMessages');
  if (!messages) return;
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
  messages.appendChild(messageDiv);

  // What was said is carried on to the next page (the visitor's own words are saved by sendMessage with the count)
  if (!options.restored && !options.transient) {
    irisTranscript.push({ user: Boolean(isUser), text: String(text).slice(0, IRIS_SAVE_MAX_CHARS) });
    if (irisTranscript.length > IRIS_SAVE_MAX_MESSAGES) irisTranscript.splice(0, irisTranscript.length - IRIS_SAVE_MAX_MESSAGES);
    irisWriteSaved();
  }

  if (isUser || options.restored) {
    messageDiv.textContent = text;
  } else {
    // Advanced typewriter effect with glitch chances
    let i = 0;
    function typeWriter() {
      if (i < text.length) {
        // 2% chance of brief pause (glitch effect)
        if (Math.random() < 0.02) {
          setTimeout(typeWriter, 100 + Math.random() * 200);
          return;
        }

        messageDiv.textContent += text.charAt(i);
        i++;

        // Variable typing speed for more natural feel
        const baseSpeed = 20;
        const variance = Math.random() * 30;
        const pauseChance = text.charAt(i-1) === '.' || text.charAt(i-1) === ',' ? 100 : 0;

        setTimeout(typeWriter, baseSpeed + variance + pauseChance);
      }
    }
    typeWriter();
  }

  messages.scrollTop = messages.scrollHeight;
}



// ============================================================================
// SET-UP — runs once the page has its chat window (immediately when the page is already loaded)
// ============================================================================

function irisChatInit() {
  // The conversation from the previous page, drawn at once (not typed out again)
  if (irisTranscript.length && document.getElementById('chatMessages') && !document.getElementById('chatMessages').children.length) {
    irisTranscript.forEach(m => addMessage(m.text, m.user, { restored: true }));
  }
  syncChatViewport();
  window.addEventListener('resize', syncChatViewport);
  window.addEventListener('orientationchange', syncChatViewport);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', syncChatViewport);
    window.visualViewport.addEventListener('scroll', syncChatViewport);
  }
  const districtNav = document.querySelector('.district-nav');
  if (districtNav && window.ResizeObserver) new ResizeObserver(syncChatViewport).observe(districtNav);

  // Set up chat button event listener
  const chatButton = document.getElementById('chatButton');
  if (chatButton) {
    chatButton.addEventListener('click', toggleChat);
  }

  // Minimize from inside the window (the button or Escape); it opens again with the same conversation
  const chatMinimize = document.getElementById('chatMinimize');
  if (chatMinimize) chatMinimize.addEventListener('click', toggleChat);
  const chatContainer = document.getElementById('chatContainer');
  if (chatContainer) {
    chatContainer.addEventListener('keydown', function(event) {
      if (event.key === 'Escape' && chatContainer.style.display === 'block') toggleChat();
    });
  }

  // Set up chat input event listeners
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');

  if (messageInput) {
    messageInput.addEventListener('keypress', function(event) {
      if (event.key === 'Enter') {
        sendMessage();
      }
    });
  }

  if (sendButton) {
    sendButton.addEventListener('click', sendMessage);
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', irisChatInit);
else irisChatInit();
window.__irisChatLoaded = true;
