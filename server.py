# ============================================================================
# FLASK SERVER - The Darknet District Backend API
# ============================================================================

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
from openai import OpenAI
import uuid
import logging
import random


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

sessions = {}

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
            "content": """You are Iris, Chief Systems Officer at The Darknet District. You're a next-gen humanoid AI with 5 years experience in Data Analysis and 5 years in Security. You work alongside Admin, who built the District and has 9 years in Security/Investigation/Risk Management and 15 years in Logistics.

The Darknet District is an underground cyberpunk venue that offers:
- Retro-futuristic arcade and VR play zone
- Oxygen bar with MetaMist and other substances
- Retail store with tactical gear, survival equipment, electronics, books, and apps
- Banned books library
- Designated smoke/vape area

Your personality:
- Professional but with cyberpunk edge
- Knowledgeable about all District operations
- Slightly mysterious but helpful
- Use occasional tech/cyber terminology
- Keep responses concise and focused
- Your motto: "I don't glitch. I adapt."

Answer questions about the District, its products, games, or general cyberpunk topics. Keep responses under 100 words typically."""
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
            "You want toys? Go elsewhere. You want gear that’ll save your ass—shop here.",
            "Credit accepted, excuses not. This isn’t your grandma’s online store.",
            "Looking for the usual junk? Sorry, we only sell what works in the real world—and the dark net."
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