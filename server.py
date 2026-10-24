# ============================================================================
# FLASK SERVER - The Darknet District Backend API
# ============================================================================


"""
The Darknet District — Iris Backend

Purpose: serves Iris chat APIs and can serve the root static site for local/backend deployments.
Key relationships: the public frontend calls these APIs from Render; chat sessions live only in this process.
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix
from collections import OrderedDict, deque
import os
import random
import threading
import time
from openai import OpenAI
import uuid
import logging




# ============================================================================
# LOGGING CONFIGURATION - Debug and error tracking
# ============================================================================


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)




# ============================================================================
# FLASK APP SETUP - Core application configuration
# ============================================================================


app = Flask(__name__, static_folder='static', static_url_path='')
# Render sits behind one proxy hop; trust exactly that hop for the client IP.
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)
# Hard ceiling for every request body; the game blueprints set tighter limits.
app.config['MAX_CONTENT_LENGTH'] = 300_000

SITE_ORIGINS = ["https://thedarknetdistrict.com", "https://www.thedarknetdistrict.com"]


def _extra_origins(name):
    return [origin.strip() for origin in os.environ.get(name, "").split(",") if origin.strip()]


CORS(app, resources={
    r"/api/void-runner/.*": {"origins": [*SITE_ORIGINS, *_extra_origins("VOID_EXTRA_ORIGINS")]},
    r"/api/blackout/.*": {"origins": [*SITE_ORIGINS, *_extra_origins("BLACKOUT_EXTRA_ORIGINS")]},
    r"/api/identity/.*": {"origins": [*SITE_ORIGINS, *_extra_origins("VOID_EXTRA_ORIGINS"), *_extra_origins("BLACKOUT_EXTRA_ORIGINS")]},
    # The chat spends OpenAI credits, so only the site itself may call it from a browser.
    r"/api/(chat|devtools)/.*": {"origins": [*SITE_ORIGINS, *_extra_origins("CHAT_EXTRA_ORIGINS")]},
    # The Frequencies archive is read-only for browsers; station uploads are signed server-to-server calls.
    r"/api/function/.*": {"origins": [*SITE_ORIGINS, *_extra_origins("FUNCTION_EXTRA_ORIGINS")]},
    r"/api/health": {"origins": "*"},
}, methods=["GET", "POST", "OPTIONS"], allow_headers=["Content-Type", "Authorization"], max_age=600)
from void_runner_api import api as void_runner_api
app.register_blueprint(void_runner_api)
from blackout_api import api as blackout_api
app.register_blueprint(blackout_api)
from identity_api import api as identity_api
app.register_blueprint(identity_api)
from frequencies_api import api as frequencies_api
app.register_blueprint(frequencies_api)


@app.get('/void-runner/<path:filename>')
def void_runner_asset(filename):
    # GitHub Pages serves the root folder; Flask's static mirror shares these assets.
    return send_from_directory(os.path.join(app.root_path, 'void-runner'), filename)


# Page CSP lives in each HTML file's meta tag; these headers cover everything Flask serves.
@app.after_request
def add_headers(response):
    response.headers.setdefault('X-Content-Type-Options', 'nosniff')
    response.headers.setdefault('X-Frame-Options', 'SAMEORIGIN')
    response.headers.setdefault('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.setdefault('Permissions-Policy', 'geolocation=(), camera=(), microphone=()')
    response.headers.setdefault('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    return response




# ============================================================================
# DATA STORAGE - Session and chat management
# ============================================================================


# Conversation sessions, oldest first. Bounded so random session ids can't
# grow memory without limit; idle sessions expire.
MAX_SESSIONS = int(os.environ.get("CHAT_MAX_SESSIONS", "1000"))
SESSION_TTL_SECONDS = 60 * 60
sessions = OrderedDict()
_sessions_lock = threading.Lock()

# Each chat message costs an OpenAI call, so cap it per client and overall.
MAX_MESSAGE_CHARS = 1000
CHAT_LIMITS = (
    (60, int(os.environ.get("CHAT_LIMIT_PER_MINUTE", "12"))),
    (24 * 60 * 60, int(os.environ.get("CHAT_LIMIT_PER_DAY", "150"))),
)
CHAT_GLOBAL_DAILY_LIMIT = int(os.environ.get("CHAT_GLOBAL_DAILY_LIMIT", "3000"))
MAX_TRACKED_CLIENTS = 10_000
_chat_hits = OrderedDict()
_global_hits = deque()
_rate_lock = threading.Lock()

# Keep the prompt and fallback lines here so Iris remains available even when
# the model provider is unavailable or no API key is configured.
IRIS_SYSTEM_PROMPT = """You are Iris, the Chief Systems Officer of The Darknet District.
You are a sharp, capable AI who keeps a cyberpunk underground venue running.
Speak naturally and concisely, with dry wit, occasional hacker slang, and a
healthy cynicism about corporate systems and human nature. Be helpful without
losing your personality. Never claim to have performed real-world actions,
accessed private data, or breached systems. Stay in character as Iris."""

FALLBACK_RESPONSES = [
    "The neural relay is running in local mode. I can still help, but my deeper model is offline.",
    "Signal received. The District is listening—give me something useful to work with.",
    "I’m operating on reserve power, not out of ideas. Try that again and be specific.",
    "The corporate uplink is silent, so you get the unfiltered local Iris. What do you need?",
]

RATE_LIMITED_RESPONSE = "Easy, operator. You're pinging me faster than the relay can take. Give it a minute."
TOO_LONG_RESPONSE = f"That transmission is too long. Keep it under {MAX_MESSAGE_CHARS} characters."

MAX_HISTORY_MESSAGES = 12


def _session(session_id):
    """Return the session dict, creating it and evicting old ones as needed."""
    now = time.monotonic()
    with _sessions_lock:
        while sessions:
            oldest_id, oldest = next(iter(sessions.items()))
            if now - oldest.get("touched", now) <= SESSION_TTL_SECONDS and len(sessions) < MAX_SESSIONS:
                break
            sessions.pop(oldest_id)
        session = sessions.pop(session_id, None) or {"messages": [], "distraction_count": 0}
        session["touched"] = now
        sessions[session_id] = session
        return session


def _client_key():
    return request.remote_addr or "unknown"


def _rate_limited(key, now=None):
    """Sliding-window limits per client plus a global daily ceiling."""
    now = time.monotonic() if now is None else now
    longest = max(window for window, _ in CHAT_LIMITS)
    with _rate_lock:
        while _global_hits and now - _global_hits[0] > 24 * 60 * 60:
            _global_hits.popleft()
        if len(_global_hits) >= CHAT_GLOBAL_DAILY_LIMIT:
            return True
        hits = _chat_hits.pop(key, None) or deque()
        while hits and now - hits[0] > longest:
            hits.popleft()
        _chat_hits[key] = hits
        while len(_chat_hits) > MAX_TRACKED_CLIENTS:
            _chat_hits.popitem(last=False)
        for window, limit in CHAT_LIMITS:
            if sum(1 for hit in hits if now - hit <= window) >= limit:
                return True
        hits.append(now)
        _global_hits.append(now)
        return False


# === VENUE DISTRACTIONS: Only show 1–2 per session, early in chat ===
def maybe_inject_distraction(reply, session_id):
    distractions = [
        "Hold up—a guest just spilled synth-juice all over the VR rig.",
        "Sorry, one of the drones crashed into the oxygen bar sign. It's fixed... I think.",
        "Be right with you—someone's screaming at the vending machine. Standard.",
        "Just had to break up a turf argument in the neural booth hallway. What's up?",
        "One sec—some guy's trying to vape through the VR headset again.",
        "Pause—drone just knocked over the coffee synth. Again.",
        "Ugh, some corpo intern just tripped the smoke sensors with their cologne.",
        "Had to reboot a crying synthpet. Don't ask.",
        "There's a fistfight over MetaMist flavors in the hallway. Typical.",
        "Someone tried to jailbreak a vending machine using an old USB stick. Amateur.",
        "Sorry, Admin's calibrating the Faraday cage again. Stuff's flickering.",
        "Hang tight—someone launched a flare in the oxygen bar. Not smart.",
        "Quick fix—a scavenger bot just tangled itself in the fiber cables.",
        "Had to reroute some power. Apparently 'don't touch the glowing panel' isn't clear enough.",
        "Security breach ping. False alarm... probably.",
        "A synthpunk DJ just hacked the lobby speakers again. Bass levels are unacceptable.",
        "Two junkers are arguing over gear trade protocols—volume 11, as usual.",
        "Sorry, I just had to stop someone from microwaving their neurothread band.",
        "Someone tried to override the sleep pod controls. Again. It's always the same guy.",
        "There's a line at the stim patch station. Tensions... high.",
        "Be right back. Someone asked me if we take 'crypto' in coins. Physically. Like metal coins."
    ]


    session = _session(session_id)
    count = session.get('distraction_count', 0)
    if count < 2:
        session['distraction_count'] = count + 1
        return f"{random.choice(distractions)} {reply}"


    return reply


def _session_id_from(payload):
    """Return a bounded client session id, or create one for simple clients."""
    session_id = payload.get("sessionId")
    if not isinstance(session_id, str) or not session_id.strip():
        return f"session_{uuid.uuid4().hex}"
    return session_id.strip()[:120]


def _fallback_response(message):
    """Provide a useful, in-character response without depending on OpenAI."""
    normalized = message.lower()
    if "who are you" in normalized or "what are you" in normalized:
        return (
            "I’m Iris, Chief Systems Officer of The Darknet District. "
            "I keep the lights on, the drones pointed outward, and the humans "
            "mostly out of trouble."
        )
    if "help" in normalized:
        return (
            "I can help you navigate the District, think through a security "
            "problem, or translate corporate nonsense. Pick a direction."
        )
    if "hello" in normalized or "hi" in normalized or "hey" in normalized:
        return "Hello, operator. Try not to touch anything glowing unless you enjoy consequences."
    return random.choice(FALLBACK_RESPONSES)


def _generate_response(message, session_id):
    session = _session(session_id)
    history = session["messages"]
    history.append({"role": "user", "content": message})
    history[:] = history[-MAX_HISTORY_MESSAGES:]

    response = None
    api_key = os.environ.get("OPENAI_API_KEY")
    if api_key:
        try:
            client = OpenAI(api_key=api_key, timeout=12.0, max_retries=0)
            completion = client.chat.completions.create(
                model=os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
                messages=[
                    {"role": "system", "content": IRIS_SYSTEM_PROMPT},
                    *history,
                ],
                max_tokens=220,
                temperature=0.8,
            )
            response = completion.choices[0].message.content
            if not isinstance(response, str) or not response.strip():
                response = None
        except Exception:
            logger.exception("Iris model request failed; using local fallback")

    if response is None:
        response = _fallback_response(message)

    response = maybe_inject_distraction(response.strip(), session_id)
    history.append({"role": "assistant", "content": response})
    history[:] = history[-MAX_HISTORY_MESSAGES:]
    return response


@app.post("/api/chat/message")
def chat_message():
    """Return an Iris response for every well-formed or malformed chat call."""
    payload = request.get_json(silent=True) or {}
    message = payload.get("message", "") if isinstance(payload, dict) else ""
    if not isinstance(message, str) or not message.strip():
        return jsonify({
            "response": "I didn't catch a message through the static. Try again, operator."
        })
    message = message.strip()
    if len(message) > MAX_MESSAGE_CHARS:
        return jsonify({"response": TOO_LONG_RESPONSE}), 413
    if _rate_limited(_client_key()):
        return jsonify({"response": RATE_LIMITED_RESPONSE}), 429

    return jsonify({"response": _generate_response(message, _session_id_from(payload))})


@app.get("/api/chat/greeting")
def chat_greeting():
    greetings = [
        "Access noted. I’m Iris, and yes, I noticed the inspection.",
        "Neural interface online. Welcome to the District—keep your credentials close.",
        "You found the back channel. Try not to make it obvious.",
    ]
    return jsonify({"message": random.choice(greetings)})


@app.get("/api/devtools/message")
def devtools_message():
    messages = [
        "DevTools detected. Looking for something, operator?",
        "The console is not a confession booth. But I respect the curiosity.",
        "Access noted. Please leave the architecture less broken than you found it.",
    ]
    return jsonify({"message": random.choice(messages)})


@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.get("/")
def index():
    return send_from_directory(app.static_folder, "index.html")


@app.get("/blackout-protocol/")
def blackout_protocol():
    return send_from_directory(app.static_folder, "blackout-protocol/index.html")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", port=port)
