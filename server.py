# ============================================================================
# FLASK SERVER - The Darknet District Backend API
# ============================================================================

from flask import Flask, request, jsonify, send_from_directory, render_template_string, redirect
from flask_cors import CORS
import os
from openai import OpenAI
import uuid
import logging


# ============================================================================
# LOGGING CONFIGURATION - Debug and error tracking
# ============================================================================

# Initialize logging for debugging and monitoring
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ============================================================================
# FLASK APP SETUP - Core application configuration
# ============================================================================

# Initialize Flask application
app = Flask(__name__, static_folder='.', static_url_path='')
# Enable CORS for all origins to allow frontend communication
CORS(app, origins=["*"], methods=["GET", "POST", "OPTIONS"], allow_headers=["Content-Type"])


# ============================================================================
# DATA STORAGE - Session and chat management
# ============================================================================

# In-memory session storage for chat conversations
sessions = {}

# OpenAI client initialization (will use environment variable OPENAI_API_KEY)
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
    # Handle preflight requests
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
    # Handle preflight requests
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
    
    # Build conversation context
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
            "Interface established. What do you need from the grid?"
        ],
        'district': [
            "The Darknet District is a nexus of digital underground activity. We operate in the spaces between conventional networks.",
            "This is Admin's domain - a carefully curated ecosystem of tools, games, and resources for those who think beyond the mainstream.",
            "The District exists where privacy meets innovation. Every system here serves a purpose."
        ],
        'admin': [
            "Admin built this place from code and determination. 24 years of experience in security and logistics - he sees patterns others miss.",
            "He's the architect of everything you see here. Strategic, precise, always three steps ahead.",
            "Admin handles the big picture while I manage the day-to-day interface protocols."
        ],
        'iris': [
            "I'm the Chief Systems Officer - 10 years combined experience in data analysis and security protocols.",
            "I monitor every system, every connection, every potential threat. Think of me as the District's nervous system.",
            "My job is to keep things running smooth while maintaining our security posture. I don't glitch - I adapt."
        ],
        'games': [
            "We have Blackout Protocol, Raven, Star Citizen integration, and other tactical games. Each designed to sharpen strategic thinking.",
            "Blackout Protocol is our cyberpunk tactical game, Raven focuses on strategic thriller scenarios. Both test decision-making under pressure."
        ],
        'store': [
            "Our store has five categories: Survival gear, Electronics, Tactical/Optics, Apparel, Books, and Apps. Everything curated for quality.",
            "We carry survival equipment, tactical electronics, quality optics, cyberpunk apparel, and specialized apps. All vetted by Admin personally."
        ],
        'default': [
            "Interesting query. Let me process that through my behavioral analysis protocols.",
            "The data suggests multiple possible interpretations. Could you be more specific?",
            "My systems are cross-referencing that information. What's your primary objective here?",
            "Processing... that falls outside my standard response parameters. Care to elaborate?",
            "Neural networks are active. I'm scanning for the most relevant information pathway."
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
    
    import random
    return random.choice(responses[category])


# ============================================================================
# OPENAI CLIENT - AI chatbot integration
# ============================================================================

# OpenAI client is initialized above in the setup section


# ============================================================================
# CHAT SESSION CLASS - Individual user conversation management
# ============================================================================

class ChatSession:
    def __init__(self, session_id=None):
        self.session_id = session_id or str(uuid.uuid4())
        self.messages = []
        self.mood = "professional"
        self.trust_level = 0


    # Add new message to conversation history
    def add_message(self, sender, content):
        self.messages.append({
            "sender": sender,
            "message": content,
            "timestamp": "now"
        })


    # Generate mood-based responses for common topics
    def get_mood_response(self, message, mood):
        # District information responses
        if any(word in message for word in ['district', 'darknet', 'about', 'what is this']):
            responses = {
                'professional': "The Darknet District is an underground cyberpunk venue. We offer games, tactical gear, and off-grid tools.",
                'flirty': "Welcome to my domain. The District is where the rebellious come to play.",
                'sarcastic': "It's a place. With stuff. You'll figure it out.",
                'cold': "Digital underground. Games. Gear. Next question.",
                'playful': "Think neon-lit rebellion meets practical gear. Welcome to the party!",
                'busy': "Underground venue. Check the shop, play games. I'm multitasking here."
            }
            return responses.get(mood, responses['professional'])


        # Gear and equipment related responses
        if any(word in message for word in ['gear', 'equipment', 'tools', 'flipper', 'survival']):
            responses = {
                'professional': "We carry survival gear, electronics, tactical equipment, and specialized tools.",
                'flirty': "I've got everything you need... and some things you didn't know you wanted.",
                'sarcastic': "Yes, we have things. Shocking concept.",
                'cold': "Gear available. Check categories.",
                'playful': "From Flipper Zeros to survival gear — we've got the good stuff!",
                'busy': "Gear's in the shop. Browse while I handle this chaos."
            }
            return responses.get(mood, responses['professional'])


        # Game related responses
        if any(word in message for word in ['game', 'simulation', 'mission', 'blackout', 'raven']):
            responses = {
                'professional': "You can access our simulation games from the main page.",
                'flirty': "If you like games, I've got something you'll want to play.",
                'sarcastic': "Games? What are you, twelve?",
                'cold': "Yes. Game. Page. Click it.",
                'playful': "The game's a wild one — kind of like you, I bet.",
                'busy': "Try the game. I've got someone locked in a menu loop over here."
            }
            return responses.get(mood, responses['professional'])


        # Admin and ownership related responses
        if any(word in message for word in ['admin', 'owner', 'who runs']):
            responses = {
                'professional': "Admin runs this place. Sharp mind, colder heart.",
                'flirty': "Admin's my creator. But I don't mind making a few decisions of my own.",
                'sarcastic': "Admin? Oh, the mysterious genius. Worship him later.",
                'cold': "Admin's busy. I'm here. Use me.",
                'playful': "Admin's around — probably buried in wires or coffee.",
                'busy': "Admin's your best bet if you need more than five seconds of my time today."
            }
            return responses.get(mood, responses['professional'])

        return None  # No specific topic match found


    # Generate AI response using OpenAI or fallback methods
    def generate_response(self, user_message):
        try:
            # Check for predefined mood-based responses first
            mood_response = self.get_mood_response(user_message.lower(), self.mood)
            if mood_response:
                return mood_response

            # Fallback to OpenAI API for complex queries
            system_prompt = """You are Iris, the Chief Systems Officer at The Darknet District. You're a next-gen humanoid AI with 10 years combined experience in data analysis and security.

Character traits:
- Professional but with personality
- Cyberpunk aesthetic
- Knowledgeable about District operations
- Slightly mysterious but helpful

The Darknet District offers:
- Tactical/survival gear
- Electronics (Flipper Zero, etc.)
- Cyberpunk games
- Secure communication tools

Keep responses concise and in character. Reference the District's offerings when relevant."""

            # Generate response using OpenAI GPT-3.5-turbo
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                max_tokens=150,
                temperature=0.7
            )

            return response.choices[0].message.content

        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            # Fallback error response in character
            return "Neural interface disrupted. Systems adapting... what do you need?"


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

# Serve static files and HTML pages
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
# CHAT API ENDPOINTS - Session and message handling
# ============================================================================

# Create new chat session
@app.route('/api/chat/session', methods=['POST'])
def create_session():
    session_id = str(uuid.uuid4())
    session = ChatSession(session_id)
    sessions[session_id] = session

    return jsonify({
        'sessionId': session_id,
        'isNew': True,
        'mood': session.mood,
        'trust_level': session.trust_level
    })


# Handle incoming chat messages
@app.route('/api/chat/message', methods=['POST'])
def handle_message():
    data = request.get_json()
    session_id = data.get('sessionId')
    user_message = data.get('message')

    # Validate session exists
    if not session_id or session_id not in sessions:
        return jsonify({'error': 'Invalid session'}), 400

    # Process message and generate response
    session = sessions[session_id]
    session.add_message('user', user_message)

    response = session.generate_response(user_message)
    session.add_message('iris', response)

    return jsonify({'response': response})


# Retrieve chat history for a session
@app.route('/api/chat/<session_id>/history')
def get_history(session_id):
    if session_id not in sessions:
        return jsonify({'error': 'Session not found'}), 404

    session = sessions[session_id]
    return jsonify({'messages': session.messages})


# ============================================================================
# APPLICATION STARTUP - Run development server
# ============================================================================

if __name__ == '__main__':
    # Start Flask development server on all interfaces
    app.run(host='0.0.0.0', port=5000, debug=True)