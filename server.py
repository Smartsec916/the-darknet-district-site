
import json
import os
import uuid
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
import openai

app = Flask(__name__)

# In-memory session storage (in production, use a database)
chat_sessions = {}

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_file(filename):
    return send_from_directory('.', filename)

@app.route('/chat/session', methods=['POST'])
def create_session():
    session_id = str(uuid.uuid4())
    chat_sessions[session_id] = {
        'messages': [],
        'created_at': datetime.now(),
        'mood': 'professional'
    }
    
    return jsonify({
        'sessionId': session_id,
        'isNew': True,
        'mood': 'professional'
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

        if not session_id or session_id not in chat_sessions:
            return jsonify({
                'response': 'Session not found. Please refresh and try again.'
            })

        if not user_message:
            return jsonify({
                'response': 'No message received. Please try again.'
            })

        # Store user message
        chat_sessions[session_id]['messages'].append({
            'sender': 'user',
            'message': user_message,
            'timestamp': datetime.now().isoformat()
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

        # Call OpenAI API with Iris personality
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system", 
                        "content": "You are Iris, the Chief Systems Officer of The Darknet District. You're a next-gen humanoid AI with 5 years experience in Data Analysis and 5 years in Security. You monitor systems, handle security protocols, and interface with visitors. You're professional but have a slight edge - you're the voice, the firewalls, and the last line of defense. Keep responses concise and in character. You work alongside Admin, the owner. You specialize in cybersecurity protocols, behavioral pattern recognition, system intelligence, and visitor interface management. The District is a digital underground platform for games, tools, and resources."
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
        except Exception as openai_error:
            print(f"OpenAI API error: {openai_error}")
            ai_response = get_fallback_response(user_message)

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
            response = openai.ChatCompletion.create(
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
    elif any(word in message for word in ['help', 'what can you do']):
        return "I can provide information about the District, assist with navigation, discuss our tools and games, or just chat about cybersecurity protocols."
    elif any(word in message for word in ['games', 'play', 'entertainment']):
        return "We have several games available - from cyberpunk adventures to tactical simulations. Check the games section for the full catalog."
    elif any(word in message for word in ['shop', 'store', 'buy', 'products']):
        return "Our store features carefully curated gear - from survival equipment to tactical electronics. Everything Admin personally vets for quality and utility."
    else:
        responses = [
            "Interesting query. Let me process that through my behavioral analysis protocols.",
            "Neural networks are active. I'm scanning for the most relevant information pathway.",
            "My systems are cross-referencing that information. What's your primary objective here?",
            "Processing... that falls outside my standard response parameters. Care to elaborate?"
        ]
        import random
        return random.choice(responses)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
