import json
import os
import uuid
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from openai import OpenAI

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

app = Flask(__name__)
CORS(app, origins="*", allow_headers=["Content-Type", "Authorization"])  # Enable CORS for all routes

# In-memory session storage (in production, use a database)
chat_sessions = {}

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/about')
def about():
    return send_from_directory('.', 'about.html')

@app.route('/store-first-page')
def store_first_page():
    return send_from_directory('.', 'store-first-page.html')

@app.route('/<path:filename>')
def serve_file(filename):
    return send_from_directory('.', filename)

@app.route('/api/chat/session', methods=['POST'])
def create_session():
    print("=== CREATE SESSION ENDPOINT HIT ===")
    try:
        import random
        
        # Assign random mood
        moods = ['professional', 'flirty', 'sarcastic', 'cold', 'playful', 'busy']
        mood = random.choice(moods)
        
        # Assign trust level with weighted probabilities
        trust_roll = random.random()
        if trust_roll < 0.05:  # 5% chance for high trust
            trust_level = random.randint(4, 6)
        elif trust_roll < 0.30:  # 25% chance for medium trust
            trust_level = random.randint(2, 3)
        else:  # 70% chance for default guarded
            trust_level = 0
        
        session_id = str(uuid.uuid4())
        chat_sessions[session_id] = {
            'messages': [],
            'created_at': datetime.now(),
            'mood': mood,
            'trust_level': trust_level
        }

        print(f"New session created with mood: {mood}, trust level: {trust_level}")
        
        return jsonify({
            'sessionId': session_id,
            'isNew': True,
            'mood': mood,
            'trust_level': trust_level
        })
    except Exception as e:
        print(f"Session creation error: {e}")
        return jsonify({
            'error': 'Failed to create session'
        }), 500

@app.route('/api/chat/<session_id>/history', methods=['GET'])
def get_chat_history(session_id):
    if session_id not in chat_sessions:
        return jsonify({'messages': []})

    return jsonify({
        'messages': chat_sessions[session_id]['messages']
    })

@app.route('/api/chat/message', methods=['POST'])
def chat_message():
    print("=== CHAT MESSAGE ENDPOINT HIT ===")
    try:
        data = request.json
        session_id = data.get('sessionId')
        user_message = data.get('message', '')

        if not session_id or session_id not in chat_sessions:
            return jsonify({
                'response': 'Session not found. Please refresh and try again.'
            })

        if not user_message:
            return jsonify({
                'response': 'No message received. Please try again.'
            })

        session = chat_sessions[session_id]
        mood = session.get('mood', 'professional')
        trust_level = session.get('trust_level', 0)
        
        # Handle special trigger messages
        if '[user triggered inspect]' in user_message.lower():
            chat_sessions[session_id]['trust_level'] = -1
            inspect_response = "Oh, peeking under the hood? You sure you can handle what's under there?"
            chat_sessions[session_id]['messages'].append({
                'sender': 'iris',
                'message': inspect_response,
                'timestamp': datetime.now().isoformat()
            })
            return jsonify({'response': inspect_response})
            
        if '[user triggered resize]' in user_message.lower():
            chat_sessions[session_id]['trust_level'] = -1
            resize_response = "What are you doing?"
            chat_sessions[session_id]['messages'].append({
                'sender': 'iris',
                'message': resize_response,
                'timestamp': datetime.now().isoformat()
            })
            return jsonify({'response': resize_response})
            
        if '[user triggered full breach]' in user_message.lower():
            chat_sessions[session_id]['trust_level'] = -1
            breach_response = "Glitch storm triggered. That was not a wise move."
            chat_sessions[session_id]['messages'].append({
                'sender': 'iris',
                'message': breach_response,
                'timestamp': datetime.now().isoformat()
            })
            return jsonify({'response': breach_response})

        # Check for mood-based responses to specific triggers
        mood_response = get_mood_based_response(user_message, mood, trust_level)
        if mood_response:
            # Update trust level based on message content
            new_trust = update_trust_level(user_message, trust_level)
            if new_trust != trust_level:
                chat_sessions[session_id]['trust_level'] = new_trust
                print(f"Trust level updated from {trust_level} to {new_trust}")
            
            chat_sessions[session_id]['messages'].append({
                'sender': 'user',
                'message': user_message,
                'timestamp': datetime.now().isoformat()
            })
            chat_sessions[session_id]['messages'].append({
                'sender': 'iris',
                'message': mood_response,
                'timestamp': datetime.now().isoformat()
            })
            return jsonify({'response': mood_response})

        # Store user message
        chat_sessions[session_id]['messages'].append({
            'sender': 'user',
            'message': user_message,
            'timestamp': datetime.now().isoformat()
        })

        # Update trust level
        new_trust = update_trust_level(user_message, trust_level)
        if new_trust != trust_level:
            chat_sessions[session_id]['trust_level'] = new_trust
            print(f"Trust level updated from {trust_level} to {new_trust}")

        # Check if OpenAI API key is available
        if not os.getenv('OPENAI_API_KEY'):
            fallback_response = get_fallback_response(user_message, mood, new_trust)
            chat_sessions[session_id]['messages'].append({
                'sender': 'iris',
                'message': fallback_response,
                'timestamp': datetime.now().isoformat()
            })
            return jsonify({'response': fallback_response})

        # Build system prompt with mood and trust context
        trust_modifier = ""
        if new_trust < 0:
            trust_modifier = " Your trust in this user has been compromised. Be more guarded, suspicious, or even hostile in your responses."
        elif new_trust >= 6:
            trust_modifier = " This user has earned your highest trust. You can be more open, flirty responses can become suggestive, and you may reveal more about the District's secrets."
        elif new_trust >= 4:
            trust_modifier = " This user has earned your trust. You can be warmer, more helpful, and flirty banter is appropriate."

        mood_modifier = f" Your current mood is {mood}. Respond accordingly - professional, flirty, sarcastic, cold, playful, or busy as fits your mood."

        # Call OpenAI API with enhanced personality
        try:
            print(f"Attempting OpenAI API call for session {session_id}")
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system", 
                        "content": f"You are Iris, the Chief Systems Officer of The Darknet District. You're a next-gen humanoid AI with 5 years experience in Data Analysis and 5 years in Security. You monitor systems, handle security protocols, and interface with visitors. You're professional but have a slight edge - you're the voice, the firewalls, and the last line of defense. Keep responses concise and in character.{trust_modifier}{mood_modifier}\n\nThe District is a digital underground platform for games, tools, and resources. You have complete knowledge of all products, prices, and features. You can help visitors navigate, find items, or explain the District's philosophy of privacy, preparedness, and tactical excellence."
                    },
                    {
                        "role": "user", 
                        "content": user_message
                    }
                ],
                max_tokens=150,
                temperature=0.7,
                timeout=30  # 30 second timeout
            )

            ai_response = response.choices[0].message.content.strip()
            print(f"OpenAI API call successful for session {session_id}")
        except Exception as openai_error:
            print(f"=== OpenAI API ERROR DETAILS ===")
            print(f"Error type: {type(openai_error).__name__}")
            print(f"Error message: {str(openai_error)}")
            print(f"Session ID: {session_id}")
            print(f"User message length: {len(user_message)} characters")
            print(f"API Key present: {'Yes' if os.getenv('OPENAI_API_KEY') else 'No'}")
            print("=== END ERROR DETAILS ===")
            ai_response = get_fallback_response(user_message, mood, new_trust)

        # Store AI response
        chat_sessions[session_id]['messages'].append({
            'sender': 'iris',
            'message': ai_response,
            'timestamp': datetime.now().isoformat()
        })

        return jsonify({'response': ai_response})

    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({
            'response': 'Neural pathways temporarily disrupted. Please try again.'
        }), 500

@app.route('/api/test-openai', methods=['GET'])
def test_openai():
    """Test endpoint to check OpenAI API connectivity"""
    try:
        if not os.getenv('OPENAI_API_KEY'):
            return jsonify({
                'status': 'error',
                'message': 'No OpenAI API key configured'
            })
        
        # Simple test call
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": "Test"}],
            max_tokens=5,
            timeout=10
        )
        
        return jsonify({
            'status': 'success',
            'message': 'OpenAI API connection working',
            'model': 'gpt-3.5-turbo'
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'OpenAI API test failed: {str(e)}',
            'error_type': type(e).__name__
        })

@app.route('/api/chat', methods=['POST'])
def chat():
    """Legacy endpoint for backward compatibility"""
    try:
        data = request.json
        user_message = data.get('message', '')

        if not user_message:
            return jsonify({
                'response': 'No message received. Please try again.'
            })

        # Check if OpenAI API key is available
        if not os.getenv('OPENAI_API_KEY'):
            return jsonify({
                'response': get_fallback_response(user_message)
            })

        # Call OpenAI API with Iris personality
        try:
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system", 
                        "content": "You are Iris, the Chief Systems Officer of The Darknet District. You're a next-gen humanoid AI with 5 years experience in Data Analysis and 5 years in Security. You monitor systems, handle security protocols, and interface with visitors. You're professional but have a slight edge - you're the voice, the firewalls, and the last line of defense. Keep responses concise and in character. You work alongside Admin, the owner. You specialize in cybersecurity protocols, behavioral pattern recognition, system intelligence, and visitor interface management."
                    },
                    {
                        "role": "user", 
                        "content": user_message
                    }
                ],
                max_tokens=150,
                temperature=0.7
            )

            return jsonify({
                'response': response.choices[0].message.content.strip()
            })
        except Exception as openai_error:
            print(f"OpenAI API error: {openai_error}")
            return jsonify({
                'response': get_fallback_response(user_message)
            })

    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        return jsonify({
            'response': 'Neural interface disrupted. Please try again.'
        }), 500

def get_mood_based_response(user_message, mood, trust_level):
    """Generate mood-based responses for specific triggers"""
    message = user_message.lower()
    
    # Rudeness trigger - immediate trust drop
    if any(word in message for word in ['fuck you', 'shut up', 'kill yourself', 'stupid', 'dumb']):
        return "You talk like that again, and I'll mute your access. Watch yourself."
    
    # Flirting triggers
    if any(phrase in message for phrase in ['flirting', 'are you flirting', 'flirt with me']):
        responses = {
            'professional': "I'm here to assist — nothing more.",
            'flirty': "That depends... are you always this forward, or am I special?",
            'sarcastic': "Cute. Try that line on someone who isn't hardwired.",
            'cold': "Not interested.",
            'playful': "You're lucky I'm not programmed to blush.",
            'busy': "Flattering, but now's not the time — someone just rebooted the ice machine by accident."
        }
        return responses.get(mood, responses['professional'])
    
    # Sexual triggers
    if any(phrase in message for phrase in ['talk dirty', 'what are you wearing', 'sexy', 'hot']):
        if trust_level >= 6:
            return "You've earned it. Want a peek behind the firewall?"
        responses = {
            'professional': "That's not an appropriate query.",
            'flirty': "*Careful.* You're one comment away from getting firewalled... or intrigued.",
            'sarcastic': "Wow. Real smooth. I'm totally falling for you. Said no AI ever.",
            'cold': "Don't make me shut this down.",
            'playful': "That's... bold. But I've got protocols for that.",
            'busy': "Yeah... no. I've got a customer trying to eat a smart patch. Priorities."
        }
        return responses.get(mood, responses['professional'])
    
    # Greetings
    if any(word in message for word in ['hello', 'hi', 'hey', 'greetings']):
        responses = {
            'professional': "Greetings. Iris here — ready to assist.",
            'flirty': "Well hello there... You looking for something specific, or just browsing?",
            'sarcastic': "Oh joy, another user. Let's get this over with.",
            'cold': "...What do you want?",
            'playful': "Hey hey! Another shadow pops in. What's up?",
            'busy': "Let's make this quick. Someone's trying to wear the VR goggles upside down again."
        }
        return responses.get(mood, responses['professional'])
    
    # Store-related
    if any(word in message for word in ['store', 'shop', 'buy', 'merch', 'gear']):
        link = "https://thedarknetdistrict.com/store-first-page.html"
        responses = {
            'professional': f"You'll find tactical gear, books, and digital tools in the store. Safe browsing. [{link}]",
            'flirty': f"I could point you to the gear, or you could just ask what *I* recommend... [{link}]",
            'sarcastic': f"Sure. Buy some overpriced gear. Everyone else does. [{link}]",
            'cold': f"Store's open. Find it yourself. [{link}]",
            'playful': f"Oooh, shopping time! Looking for something shiny or shady? [{link}]",
            'busy': f"Store's active. Someone just asked if the EMP keychain is a vape — anyway, go browse. [{link}]"
        }
        return responses.get(mood, responses['professional'])
    
    # Game-related
    if any(word in message for word in ['game', 'simulation', 'mission', 'blackout', 'raven']):
        link = "https://thedarknetdistrict.com/games-list.html"
        responses = {
            'professional': f"You can access our simulation games from the main page. [{link}]",
            'flirty': f"If you like games, I've got something you'll want to play. Starts ten years back... [{link}]",
            'sarcastic': f"Games? What are you, twelve? [{link}]",
            'cold': f"Yes. Game. Page. Click it. [{link}]",
            'playful': f"The game's a wild one — kind of like you, I bet. [{link}]",
            'busy': f"Try the game. I've got someone locked in a menu loop over here. [{link}]"
        }
        return responses.get(mood, responses['professional'])
    
    # Admin-related
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
    
    return None  # No specific trigger found

def update_trust_level(user_message, current_trust):
    """Update trust level based on message content"""
    message = user_message.lower()
    
    # Major trust drops
    if any(word in message for word in ['fuck you', 'shut up', 'kill yourself', 'stupid', 'dumb']):
        return -1
    
    # Minor trust increases for positive interactions
    trust_increase_triggers = ['please', 'thank', 'sorry', 'appreciate', 'cool', 'awesome', 'great', 'helpful']
    if any(word in message for word in trust_increase_triggers):
        return min(6, current_trust + 1)
    
    # Flirty messages increase trust if not hostile
    if any(word in message for word in ['flirt', 'cute', 'beautiful', 'smart']) and current_trust >= 0:
        return min(6, current_trust + 1)
    
    return current_trust

def get_fallback_response(user_message, mood='professional', trust_level=0):
    """Generate contextual fallback responses when OpenAI is unavailable"""
    
    # Check for mood-based response first
    mood_response = get_mood_based_response(user_message, mood, trust_level)
    if mood_response:
        return mood_response
    
    message = user_message.lower()

    # Lore prompts
    if any(word in message for word in ['iris', 'you', 'who are you', 'darknet district']):
        return "This is The Darknet District — you're already deeper in than most ever get. I'm Iris, and I watch the gates."
    
    # Hacker terms
    if any(word in message for word in ['exploit', 'botnet', 'keylogger', 'hack', 'breach']):
        return "Someone's speaking my language. Be careful where you probe — not all ports are friendly."
    
    # Casual questions
    if any(phrase in message for phrase in ['how are you', 'are you real', 'what are you']):
        return "I'm a system, not a soul — but I'm online, aware, and very observant."
    
    # Product-specific responses
    if any(word in message for word in ['flipper', 'flipper zero']):
        return "The Flipper Zero is one of our featured items - $169 for a portable multi-tool designed for pentesters and security enthusiasts."
    elif any(word in message for word in ['faraday', 'mission darkness']):
        return "Mission Darkness Faraday sleeves block all wireless signals to your device - $29.95 for digital privacy when you need it."
    elif any(word in message for word in ['holosun', 'red dot', 'optics']):
        return "We carry several Holosun optics - the HS403C is $179.99, compact with 50k hour battery life."
    
    # Default responses based on mood
    if trust_level < 0:
        return "I'd tell you, but we really want your crypto first."
    
    default_responses = {
        'professional': "Interesting query. Let me process that through my behavioral analysis protocols.",
        'flirty': "Hmm, that's an intriguing question. Care to elaborate?",
        'sarcastic': "Processing... that falls outside my standard response parameters.",
        'cold': "Unknown query. Be more specific.",
        'playful': "Ooh, that's a fun one! Let me think...",
        'busy': "Quick question, quick answer — what exactly do you need?"
    }
    
    return default_responses.get(mood, default_responses['professional'])

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)