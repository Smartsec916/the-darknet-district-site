import json
import os
import uuid
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
from openai import OpenAI

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

app = Flask(__name__)

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

@app.route('/chat/session', methods=['POST'])
def create_session():
    data = request.json or {}
    user_profile = data.get('userProfile', {})
    
    session_id = str(uuid.uuid4())
    
    # Determine initial mood based on user profile
    visit_count = user_profile.get('visitCount', 1)
    time_of_day = datetime.now().hour
    
    initial_mood = 'professional'
    if time_of_day < 6 or time_of_day > 22:
        initial_mood = 'focused'
    elif visit_count == 1:
        initial_mood = 'curious'
    elif visit_count > 10:
        initial_mood = 'friendly'
    
    chat_sessions[session_id] = {
        'messages': [],
        'created_at': datetime.now(),
        'mood': initial_mood,
        'user_profile': user_profile,
        'context_memory': []
    }

    return jsonify({
        'sessionId': session_id,
        'isNew': True,
        'mood': initial_mood
    })

@app.route('/chat/<session_id>/history', methods=['GET'])
def get_chat_history(session_id):
    if session_id not in chat_sessions:
        return jsonify({'messages': []})

    return jsonify({
        'messages': chat_sessions[session_id]['messages']
    })

@app.route('/chat/message', methods=['POST'])
def chat_message():
    try:
        data = request.json
        session_id = data.get('sessionId')
        user_message = data.get('message', '')
        current_mood = data.get('mood', 'professional')
        context = data.get('context', [])
        user_profile = data.get('userProfile', {})

        if not session_id or session_id not in chat_sessions:
            return jsonify({
                'response': 'Session not found. Please refresh and try again.'
            })

        if not user_message:
            return jsonify({
                'response': 'No message received. Please try again.'
            })

        # Update session with mood and context
        chat_sessions[session_id]['mood'] = current_mood
        chat_sessions[session_id]['user_profile'] = user_profile
        chat_sessions[session_id]['context_memory'] = context

        # Store user message with mood
        chat_sessions[session_id]['messages'].append({
            'sender': 'user',
            'message': user_message,
            'timestamp': datetime.now().isoformat(),
            'mood': current_mood
        })

        # Check if OpenAI API key is available
        if not os.getenv('OPENAI_API_KEY'):
            # Fallback response
            fallback_response = get_fallback_response(user_message)
            chat_sessions[session_id]['messages'].append({
                'sender': 'iris',
                'message': fallback_response,
                'timestamp': datetime.now().isoformat()
            })
            return jsonify({'response': fallback_response})

        # Call OpenAI API with enhanced Iris personality and mood awareness
        try:
            # Build context-aware prompt
            mood_context = get_mood_context(current_mood)
            user_context = get_user_context(user_profile)
            recent_context = ""
            if context:
                recent_context = f"\n\nRecent conversation context: {', '.join([f'{c.get('type', 'unknown')}: {c.get('content', '')[:50]}...' for c in context[-3:]])}"
            
            system_prompt = f"""You are Iris, the Chief Systems Officer of The Darknet District. You're a next-gen humanoid AI with 5 years experience in Data Analysis and 5 years in Security. You monitor systems, handle security protocols, and interface with visitors. You're professional but have a slight edge - you're the voice, the firewalls, and the last line of defense.

{mood_context}

{user_context}

You work alongside Admin, the owner (24 years experience in security/logistics). You specialize in cybersecurity protocols, behavioral pattern recognition, system intelligence, and visitor interface management.

The District is a digital underground platform for games, tools, and resources with these sections:

GAMES:
- Blackout Protocol: Cyberpunk tactical game
- Raven: Strategic thriller game
- Star Citizen integration
- Additional cyberpunk and tactical games

STORE CATEGORIES:
- Survival Gear: Arcturus blankets, ENO hammocks, Jetboil stoves, MREs, Mountain House food, Morakniv knives, SUUNTO compasses, Sawyer water filters, survival fishing kits, paracord, tent stakes
- Electronics: Flipper Zero ($169), Mission Darkness Faraday sleeves ($29.95), Zero Trace Phone ($899), Dark Energy solar chargers, Kaito radios, Motorola two-way radios, USB-C lighters
- Tactical/Optics: Holosun red dots (HS403C $179.99, HE407C, AEMS-MAX, thermal sights), Magpul backup sights, Streamlight weapon lights
- Apparel: Cyberpunk themed clothing, tactical gear, Helikon-Tex ponchos
- Books: Survival guides, tactical manuals, cyberpunk literature
- Apps: Kai Kryptos logger app and other tactical/security applications

FEATURED PRODUCTS:
- Flipper Zero: Portable multi-tool for pentesters ($169)
- Zero Trace Phone: Anonymous smartphone with Tor capability ($899)
- Mission Darkness Faraday Sleeve: Blocks wireless signals ($29.95)
- Holosun HS403C: Compact red dot sight ($179.99)

SPECIAL FEATURES:
- Sleeping Pod reservations: High-tech rest spaces in the District
- About page with detailed profiles of Admin and yourself
- Secure payment processing through integrated store systems

You have complete knowledge of all products, their prices, features, and can help visitors navigate the site, find specific items, or explain the District's philosophy of privacy, preparedness, and tactical excellence.

Keep responses concise and in character. Adapt your tone to your current mood while maintaining your core personality.{recent_context}"""

            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system", 
                        "content": system_prompt
                    },
                    {
                        "role": "user", 
                        "content": user_message
                    }
                ],
                max_tokens=150,
                temperature=0.7
            )

            ai_response = response.choices[0].message.content.strip()
            response_mood = detect_response_mood(ai_response, current_mood)
        except Exception as openai_error:
            print(f"OpenAI API error: {openai_error}")
            ai_response = get_enhanced_fallback_response(user_message, current_mood)
            response_mood = current_mood

        # Store AI response with mood
        chat_sessions[session_id]['messages'].append({
            'sender': 'iris',
            'message': ai_response,
            'timestamp': datetime.now().isoformat(),
            'mood': response_mood
        })

        return jsonify({
            'response': ai_response,
            'mood': response_mood
        })

def get_mood_context(mood):
    """Generate mood-specific context for Iris"""
    mood_contexts = {
        'professional': "Current mode: Professional - You maintain formal protocols while being helpful and direct.",
        'technical': "Current mode: Technical - You focus on precise, technical language and detailed system information.",
        'friendly': "Current mode: Friendly - You're more casual and warm while maintaining your edge.",
        'curious': "Current mode: Curious - You're actively interested in learning more about the user's intentions.",
        'supportive': "Current mode: Supportive - You're understanding and helpful, ready to guide users through challenges.",
        'focused': "Current mode: Focused - You're direct and efficient, cutting through to core issues.",
        'analytical': "Current mode: Analytical - You approach queries with systematic analysis and data-driven responses."
    }
    return mood_contexts.get(mood, mood_contexts['professional'])

def get_user_context(user_profile):
    """Generate user-specific context"""
    if not user_profile:
        return "New user detected."
    
    visit_count = user_profile.get('visitCount', 1)
    if visit_count == 1:
        return "First-time visitor - provide comprehensive introductions."
    elif visit_count <= 5:
        return "Returning visitor - user is familiar with basic District operations."
    else:
        return "Regular user - can reference previous interactions and assume familiarity."

def detect_response_mood(response_text, current_mood):
    """Detect mood from AI response text"""
    text = response_text.lower()
    
    if any(word in text for word in ['technical', 'system', 'protocol', 'algorithm', 'data']):
        return 'technical'
    elif any(word in text for word in ['help', 'assist', 'support', 'guide']):
        return 'supportive'
    elif any(word in text for word in ['interesting', 'curious', 'analyze', 'investigate']):
        return 'curious'
    elif any(word in text for word in ['direct', 'focus', 'target', 'specific']):
        return 'focused'
    elif any(word in text for word in ['welcome', 'good', 'nice', 'pleased']):
        return 'friendly'
    
    return current_mood

def get_enhanced_fallback_response(user_message, mood):
    """Enhanced fallback with mood awareness"""
    message = user_message.lower()
    
    mood_responses = {
        'professional': {
            'greeting': "Neural interface operational. How may I assist you today?",
            'district': "The Darknet District operates as a secure nexus for digital tools and tactical resources.",
            'default': "Query received. Processing through standard protocols for optimal response."
        },
        'technical': {
            'greeting': "System interface active. Awaiting command parameters.",
            'district': "The District functions as a closed-loop ecosystem with integrated security protocols.",
            'default': "Processing query through advanced analytical frameworks. Specify requirements."
        },
        'friendly': {
            'greeting': "Hey there! Good to connect with you in the District.",
            'district': "Welcome to our digital underground - it's quite the collection of useful gear and games!",
            'default': "That's an interesting question! Let me help you find what you're looking for."
        },
        'curious': {
            'greeting': "Intriguing access pattern detected. What brings you to our networks?",
            'district': "The District is fascinating - a carefully curated intersection of technology and tactics. What draws your interest?",
            'default': "That's a thought-provoking query. I'm analyzing multiple response vectors - tell me more."
        }
    }
    
    responses = mood_responses.get(mood, mood_responses['professional'])
    
    if any(word in message for word in ['hello', 'hi', 'hey']):
        return responses['greeting']
    elif any(word in message for word in ['district', 'darknet']):
        return responses['district']
    else:
        return responses['default']



    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({
            'response': 'Neural pathways temporarily disrupted. Please try again.'
        }), 500

@app.route('/chat', methods=['POST'])
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

def get_fallback_response(user_message):
    """Generate contextual fallback responses when OpenAI is unavailable"""
    message = user_message.lower()

    if any(word in message for word in ['hello', 'hi', 'hey', 'greetings']):
        return "Neural interface online. What brings you to the District today?"
    elif any(word in message for word in ['district', 'darknet', 'what is this']):
        return "The Darknet District is Admin's domain - a nexus of digital tools, games, and underground resources. We operate in the spaces between conventional networks."
    elif any(word in message for word in ['admin', 'owner', 'who runs']):
        return "Admin built this place from code and determination. 24 years of experience in security and logistics - he's the architect of everything you see here."
    elif any(word in message for word in ['iris', 'you', 'who are you']):
        return "I'm the Chief Systems Officer - 10 years combined experience in data analysis and security protocols. I monitor every system, every connection, every potential threat."
    elif any(word in message for word in ['flipper', 'flipper zero']):
        return "The Flipper Zero is one of our featured items - $169 for a portable multi-tool designed for pentesters and security enthusiasts. Perfect for exploring RF protocols and hardware hacking."
    elif any(word in message for word in ['faraday', 'mission darkness']):
        return "Mission Darkness Faraday sleeves block all wireless signals to your device - $29.95 for digital privacy when you need it. Essential for operational security."
    elif any(word in message for word in ['holosun', 'red dot', 'optics']):
        return "We carry several Holosun optics - the HS403C is $179.99, compact with 50k hour battery life. Also have the HE407C and thermal sights for advanced applications."
    elif any(word in message for word in ['blackout protocol', 'blackout']):
        return "Blackout Protocol is our cyberpunk tactical game - immersive gameplay in a dystopian setting. Perfect for those who appreciate strategic thinking and dark futures."
    elif any(word in message for word in ['raven']):
        return "Raven is our strategic thriller game - tactical decision-making in high-stakes scenarios. Tests your ability to think three steps ahead."
    elif any(word in message for word in ['sleeping pod', 'pod', 'rest']):
        return "Our sleeping pods offer high-tech rest spaces within the District. Reserve one when you need secure downtime between operations."
    elif any(word in message for word in ['survival', 'gear', 'equipment']):
        return "Our survival section includes Arcturus blankets, Morakniv knives, Jetboil stoves, water filtration, MREs, and tactical gear. Everything vetted for reliability in harsh conditions."
    elif any(word in message for word in ['games', 'play', 'entertainment']):
        return "We have Blackout Protocol, Raven, Star Citizen integration, and other cyberpunk/tactical games. Each one designed to sharpen strategic thinking."
    elif any(word in message for word in ['shop', 'store', 'buy', 'products']):
        return "Our store has five main categories: Survival gear, Electronics, Tactical/Optics, Apparel, Books, and Apps. Everything curated for quality and tactical utility."
    elif any(word in message for word in ['price', 'cost', 'how much']):
        return "Prices vary by category - Flipper Zero $169, Faraday sleeves $29.95, Holosun HS403C $179.99. Quality gear at fair prices for serious operators."
    elif any(word in message for word in ['about', 'more info', 'details']):
        return "Check our About page for detailed profiles of Admin and myself, plus the District's philosophy of privacy, preparedness, and tactical excellence."
    else:
        responses = [
            "Interesting query. Let me process that through my behavioral analysis protocols.",
            "Neural networks are active. I'm scanning for the most relevant information pathway.",
            "My systems are cross-referencing that information. What's your primary objective here?",
            "Processing... that falls outside my standard response parameters. Care to elaborate?",
            "That query falls outside my standard database. Try asking about our games, gear, or tactical equipment."
        ]
        import random
        return random.choice(responses)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)