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
import os
import random
from openai import OpenAI
import uuid
import logging
from datetime import datetime




# ============================================================================
# LOGGING CONFIGURATION - Debug and error tracking
# ============================================================================


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)




# ============================================================================
# FLASK APP SETUP - Core application configuration
# ============================================================================


app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app, origins=["*"], methods=["GET", "POST", "OPTIONS"], allow_headers=["Content-Type"])


# CSP now handled via HTML meta tag
@app.after_request
def add_headers(response):
    return response




# ============================================================================
# DATA STORAGE - Session and chat management
# ============================================================================


# Store conversation sessions
sessions = {}

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

MAX_HISTORY_MESSAGES = 12


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


    if session_id not in sessions:
        sessions[session_id] = {}


    count = sessions[session_id].get('distraction_count', 0)
    if count < 2:
        sessions[session_id]['distraction_count'] = count + 1
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
    session = sessions.setdefault(session_id, {"messages": [], "distraction_count": 0})
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
    message = payload.get("message", "")
    if not isinstance(message, str) or not message.strip():
        return jsonify({
            "response": "I didn't catch a message through the static. Try again, operator."
        })

    return jsonify({"response": _generate_response(message.strip(), _session_id_from(payload))})


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


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", port=port)
