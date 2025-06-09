# ============================================================================
# FLASK SERVER - The Darknet District Backend API
# ============================================================================

from flask import Flask, request, jsonify, send_from_directory
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
app = Flask(__name__)
# Enable CORS for all origins to allow frontend communication
CORS(app, origins=["*"])


# ============================================================================
# DATA STORAGE - Session and chat management
# ============================================================================

# In-memory session storage for chat conversations
sessions = {}


# ============================================================================
# OPENAI CLIENT - AI chatbot integration
# ============================================================================

# Initialize OpenAI client with API key from environment
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))


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
# STATIC FILE ROUTES - Serve HTML, CSS, JS, and assets
# ============================================================================

# Serve main index.html file
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')


# Serve all other static files (HTML pages, CSS, JS, images)
@app.route('/<path:filename>')
def serve_file(filename):
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