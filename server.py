from flask import Flask, request, jsonify, send_from_directory
import os
import openai

app = Flask(__name__)

# Set up OpenAI client
openai.api_key = os.getenv('OPENAI_API_KEY')

@app.route('/')
def home():
    return send_from_directory('.', 'chatbot.html')

@app.route('/<path:path>')
def serve_file(path):
    return send_from_directory('.', path)

@app.route('/chat', methods=['POST'])
def chat():
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
                'response': "Neural interface offline. OpenAI API key not configured."
            })

        # Call OpenAI API with Iris personality
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

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'response': 'Neural interface disrupted. Please try again.'
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)