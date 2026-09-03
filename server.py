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


app = Flask(__name__, static_folder='.', static_url_path='')
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
