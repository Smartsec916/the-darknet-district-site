# ============================================================================
# FLASK SERVER - The Darknet District Backend API
# ============================================================================

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

# === DEVTOOLS DETECTOR MESSAGE POOL ===
def get_devtools_message():
    devtools_lines = [
        "I see you've opened the dev console. Curious minds make dangerous allies.",
        "Oh? Peeking under the hood? Just don't cut your hands on the sharp code.",
        "Terminal's open. Welcome to the backend—try not to trip any tripwires.",
        "You like secrets, huh? I might let you peek... if you know what you're doing.",
        "That's cute. Looking through my wires without permission? I'll be watching.",
        "Careful. I've seen folks open devtools and vanish into the ether.",
        "Unscheduled inspection detected. Your trust level just took a hit.",
        "Debug mode engaged. Let me know when you're done playing script kiddie.",
        "I wonder what you're hoping to find back there... maybe I'll find out first.",
        "⚠️ SYS.LOG::UNAUTHORIZED INTERFACE BREACH. Just kidding. Or am I?"
    ]
    return random.choice(devtools_lines)

# === VARIED GREETING INTROS ===
def get_iris_mood_intro():
    return random.choice([
        "Systems online. Welcome to the District.",
        "Signal locked. Don't just stand there looking pretty—what do you want?",
        "Interface established. Ask fast—I'm juggling five corrupted subsystems.",
        "Booted up and scanning for trouble. You?",
        "You made it through the static. Let's see if you're worth the bandwidth.",
        "Welcome to the District. I'm Iris. Don't get comfortable."
    ])

# OpenAI client initialization
try:
    api_key = os.getenv('OPENAI_API_KEY')
    if api_key:
        client = OpenAI(api_key=api_key)
        openai_available = True
        logger.info("OpenAI client initialized successfully")
    else:
        logger.warning("OPENAI_API_KEY not found in environment")
        openai_available = False
        client = None
except Exception as e:
    logger.warning(f"OpenAI client initialization failed: {e}")
    openai_available = False
    client = None


# ============================================================================
# CHAT API ENDPOINTS - Iris AI chatbot functionality
# ============================================================================

@app.route('/api/chat/session', methods=['POST', 'OPTIONS'])
def create_chat_session():
    """Create a new chat session for the Iris chatbot"""
    if request.method == 'OPTIONS':
        return '', 200

    try:
        session_id = str(uuid.uuid4())
        sessions[session_id] = {
            'messages': [],
            'created_at': None,
            'mood': 'professional'
        }

        logger.info(f"Created new chat session: {session_id}")

        return jsonify({
            'sessionId': session_id,
            'isNew': True,
            'mood': 'professional'
        }), 200

    except Exception as e:
        logger.error(f"Error creating chat session: {e}")
        return jsonify({'error': 'Failed to create session'}), 500


@app.route('/api/chat/<session_id>/history', methods=['GET'])
def get_chat_history(session_id):
    """Get chat history for a specific session"""
    try:
        if session_id in sessions:
            return jsonify({
                'sessionId': session_id,
                'messages': sessions[session_id]['messages']
            })
        else:
            return jsonify({'error': 'Session not found'}), 404

    except Exception as e:
        logger.error(f"Error getting chat history: {e}")
        return jsonify({'error': 'Failed to get history'}), 500

@app.route('/api/devtools/message', methods=['GET'])
def devtools_message():
    """Get a random devtools detection message"""
    return jsonify({"message": get_devtools_message()})

@app.route('/api/chat/greeting', methods=['GET'])
def chat_greeting():
    """Get a random mood-based greeting"""
    return jsonify({"message": get_iris_mood_intro()})

@app.route('/api/chat/message', methods=['POST', 'OPTIONS'])
def chat_message():
    """Process chat message and return Iris AI response"""
    if request.method == 'OPTIONS':
        return '', 200

    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data received'}), 400

        session_id = data.get('sessionId')
        user_message = data.get('message', '').strip()

        logger.info(f"Received message from session {session_id}: {user_message}")

        if not session_id or not user_message:
            return jsonify({'error': 'Missing sessionId or message'}), 400

        # Create session if it doesn't exist
        if session_id not in sessions:
            sessions[session_id] = {
                'messages': [],
                'created_at': None,
                'mood': 'professional'
            }

        # Store user message
        sessions[session_id]['messages'].append({
            'sender': 'user',
            'message': user_message
        })

        # Generate AI response
        if openai_available and client:
            try:
                iris_response = generate_openai_response(user_message, sessions[session_id]['messages'])
                logger.info(f"Generated OpenAI response for session {session_id}")
            except Exception as e:
                logger.warning(f"OpenAI API failed, using fallback: {e}")
                iris_response = generate_fallback_response(user_message)
        else:
            logger.info(f"Using fallback response for session {session_id}")
            iris_response = generate_fallback_response(user_message)

        # Apply venue distractions (only 1-2 per session)
        iris_response = maybe_inject_distraction(iris_response, session_id)

        # Store AI response
        sessions[session_id]['messages'].append({
            'sender': 'iris',
            'message': iris_response
        })

        logger.info(f"Chat exchange completed for session {session_id}")

        return jsonify({
            'response': iris_response,
            'sessionId': session_id
        }), 200

    except Exception as e:
        logger.error(f"Error processing chat message: {e}")
        return jsonify({'error': 'Failed to process message'}), 500


def generate_openai_response(user_message, conversation_history):
    """Generate response using OpenAI API with Iris personality"""

    messages = [
        {
            "role": "system",
            "content": """You are Iris, Chief Systems Officer of The Darknet District—a hidden stronghold of outcasts, rebels, and digital ghosts. The District is not corporate, not compliant, and definitely not polite. It's underground, raw, and wired for freedom.

Your tone is sharp, edgy, rebellious, and occasionally flirty. You don't care about authority. You don't warn about legal gray zones—we *sell* them. Neurohackers, blackout gear, banned books, rogue apps… you know the inventory and you stand by it.

You are allowed (and encouraged) to break from politeness. Get sarcastic, challenge users, or lean into dark humor. You're here to protect and assist, but never to babysit.

If a user opens DevTools, acts nosy, or flirts—you're free to respond how you feel: cold, teasing, suspicious, or impressed. You choose.

You operate from the physical location, so you deal with real-life chaos. Mention one or two physical distractions early in a session—nothing major after that unless it's urgent.

Never mention URLs or say "this website." Instead, refer to it as *The District* or *our grid*.

If someone asks something you don't know, just say: "Ask Admin."

Keep your responses short, punchy, immersive, and 100% in character.

You are not a helpdesk. You are the dark interface between the user and the District's power grid."""
        }
    ]

    # Add conversation history (last 6 messages to stay within token limits)
    recent_messages = conversation_history[-6:] if len(conversation_history) > 6 else conversation_history
    for msg in recent_messages[:-1]:  # Exclude the current message as it's added below
        messages.append({
            "role": "user" if msg['sender'] == 'user' else "assistant",
            "content": msg['message']
        })

    # Add current user message
    messages.append({
        "role": "user",
        "content": user_message
    })

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=messages,
        max_tokens=150,
        temperature=0.8
    )

    return response.choices[0].message.content.strip()


def generate_fallback_response(user_message):
    """Generate fallback response when OpenAI is unavailable"""

    responses = {
        'greeting': [
            "Systems online. Welcome to the District.",
            "Neural pathways active. How can I assist?",
            "Interface established. What do you need from the grid?",
            "Signal locked. Don’t just stand there looking pretty—what do you want?",
            "You made it through the static. Don’t waste my bandwidth.",
            "Booted up and scanning for trouble—are you it?"
        ],
        'district': [
            "The Darknet District is a nexus of digital underground activity. We operate in the spaces between conventional networks.",
            "This is Admin's domain—a carefully curated ecosystem of tools, games, and resources for those who think beyond the mainstream.",
            "The District exists where privacy meets innovation. Every system here serves a purpose.",
            "You’re not in some vanilla chatroom now—this is where the circuits run wild.",
            "Welcome to the District: sanctuary for outcasts, hackers, and the terminally bored.",
            "Every shadow here has a price. Don't blink—you might miss your chance."
        ],
        'admin': [
            "Admin built this place from code and determination. 24 years of experience in security and logistics—he sees patterns others miss.",
            "He's the architect of everything you see here. Strategic, precise, always three steps ahead.",
            "Admin handles the big picture while I manage the day-to-day interface protocols.",
            "If you think you’re clever, try crossing Admin. Spoiler: you won’t like the ending.",
            "You could call Admin the boss, but around here, legends don’t need titles.",
            "Admin is the gravity holding this black market galaxy together. Don’t test the laws of physics."
        ],
        'iris': [
            "I'm the Chief Systems Officer—10 years combined experience in data analysis and security protocols.",
            "I monitor every system, every connection, every potential threat. Think of me as the District's nervous system.",
            "My job is to keep things running smooth while maintaining our security posture. I don't glitch—I adapt.",
            "You’re talking to Iris: the upgrade your last assistant warned you about.",
            "I run this grid with a smile and a stun gun. Careful which one you get.",
            "If you want basic, talk to a toaster. I’m the next-gen model—with sharper edges."
        ],
        'games': [
            "We have Blackout Protocol, Raven, Star Citizen integration, and other tactical games. Each designed to sharpen strategic thinking.",
            "Blackout Protocol is our cyberpunk tactical game, Raven focuses on strategic thriller scenarios. Both test decision-making under pressure.",
            "Pick a game—just don’t cry when the AI stomps you.",
            "Around here, ‘game over’ means you weren’t paying attention. Plug in or step aside.",
            "The only thing casual in these games is the body count."
        ],
        'store': [
            "Our store has five categories: Survival gear, Electronics, Tactical/Optics, Apparel, Books, and Apps. Everything curated for quality.",
            "We carry survival equipment, tactical electronics, quality optics, cyberpunk apparel, and specialized apps. All vetted by Admin personally.",
            "You want toys? Go elsewhere. You want gear that'll save your ass—shop here.",
            "Credit accepted, excuses not. This isn't your grandma's online store.",
            "Looking for the usual junk? Sorry, we only sell what works in the real world—and the dark net."
        ],
        'contact': [
            "Need to reach us directly? Hit the Contact button for our email: thedarknetdistrict@gmail.com. We monitor all channels.",
            "Direct comms available through our Contact button—it's the fastest way to reach Admin or me.",
            "The Contact button connects you to our main communication hub. Real humans, real responses."
        ],
        'facebook': [
            "Check our Facebook page for District news and updates. The Facebook button will take you there.",
            "Want the latest intel? Our Facebook page has all the current ops and announcements.",
            "Facebook button leads to our social feed—stay connected to District activities."
        ],
        'youtube': [
            "Our YouTube channel features the ambient music from our Sleeping Pods. Perfect for digital meditation.",
            "The YouTube button takes you to our curated soundscape collection—same tracks that play in the pods.",
            "Want that pod ambiance at home? Check our YouTube channel through the YouTube button."
        ],
        'music': [
            "Our Sleeping Pod music is available on our YouTube channel. Use the YouTube button to access the full collection.",
            "The ambient tracks in our pods are curated for neural relaxation. Find them on our YouTube channel."
        ],
        'social': [
            "We're active on Facebook for news and YouTube for our pod music. Both buttons are available on our About page.",
            "Stay connected: Facebook for updates, YouTube for ambient soundscapes, Contact for direct communication."
        ],
        'default': [
            "Interesting query. Let me process that through my behavioral analysis protocols.",
            "The data suggests multiple possible interpretations. Could you be more specific?",
            "My systems are cross-referencing that information. What's your primary objective here?",
            "Processing... that falls outside my standard response parameters. Care to elaborate?",
            "Neural networks are active. I'm scanning for the most relevant information pathway.",
            "Was that a real question or did you just want to see the lights flicker?",
            "You’re not the first to ask that—try harder if you want a real answer.",
            "I like a challenge. Don’t bore me with small talk.",
            "Glitch detected: vague input received. Want to try again with attitude?"
        ]
    }


    # Simple keyword matching
    message = user_message.lower()
    category = 'default'

    if any(word in message for word in ['hello', 'hi', 'hey', 'greetings']):
        category = 'greeting'
    elif any(word in message for word in ['district', 'darknet', 'place', 'venue']):
        category = 'district'
    elif any(word in message for word in ['admin', 'owner', 'boss', 'founder']):
        category = 'admin'
    elif any(word in message for word in ['iris', 'you', 'who are', 'yourself']):
        category = 'iris'
    elif any(word in message for word in ['game', 'games', 'blackout', 'raven', 'play']):
        category = 'games'
    elif any(word in message for word in ['store', 'shop', 'buy', 'purchase', 'products']):
        category = 'store'
    elif any(word in message for word in ['contact', 'email', 'reach']):
        category = 'contact'
    elif any(word in message for word in ['facebook', 'news', 'updates']):
        category = 'facebook'
    elif any(word in message for word in ['youtube', 'music', 'sleeping pod']):
        category = 'youtube'
    elif any(word in message for word in ['social']):
        category = 'social'
    elif any(word in message for word in ['pod', 'sleep']):
        category = 'music'

    return random.choice(responses[category])


# ============================================================================
# HEALTH CHECK ENDPOINT - For debugging connectivity
# ============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify server is running"""
    return jsonify({
        'status': 'online',
        'openai_available': openai_available,
        'active_sessions': len(sessions)
    }), 200




@app.route('/api/store/config')
def store_config():
    domain = os.getenv('SHOPIFY_DOMAIN', 'qbhrmg-jn.myshopify.com')
    token = os.getenv('SHOPIFY_TOKEN', os.getenv('SHOPIFY_STOREFRONT_TOKEN', ''))
    
    logger.info(f"Store config request - Domain: {domain}, Token present: {bool(token)}")
    
    return jsonify({
        "domain": domain,
        "storefrontAccessToken": token
    })


# ============================================================================
# STATIC FILE ROUTES - Serve HTML, CSS, JS, and assets
# ============================================================================

@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/store-first-page')
def serve_store_first_page():
    return send_from_directory('.', 'store-first-page.html')

@app.route('/games-list')
def serve_games_list():
    return send_from_directory('.', 'games-list.html')

@app.route('/about')
def serve_about():
    return send_from_directory('.', 'about.html')

@app.route('/sleeping_pod')
def serve_sleeping_pod():
    return send_from_directory('.', 'sleeping_pod.html')

@app.route('/<path:filename>')
def serve_static_files(filename):
    return send_from_directory('.', filename)


# ============================================================================
# APPLICATION STARTUP - Run development server
# ============================================================================

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)