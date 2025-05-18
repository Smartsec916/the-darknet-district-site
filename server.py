
from flask import Flask, request, jsonify, send_from_directory
import openai
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
openai.api_key = os.getenv('OPENAI_API_KEY')

@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_file(path):
    return send_from_directory('.', path)

@app.route('/chat', methods=['POST'])
def chat():
    if not openai.api_key:
        return jsonify({
            'response': 'OpenAI API key not configured. Please check system configuration.'
        }), 500

    try:
        data = request.json
        user_message = data.get('message', '')
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are Iris, a cyberpunk AI assistant with extensive knowledge of technology, hacking, and digital culture. Your responses should reflect a mix of technical expertise and street-smart attitude."},
                {"role": "user", "content": user_message}
            ]
        )
        
        return jsonify({
            'response': response.choices[0].message.content
        })
    except openai.error.AuthenticationError:
        print("OpenAI API key is invalid")
        return jsonify({
            'response': 'Authentication failed. Neural interface access denied.'
        }), 500
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'response': 'Connection lost. Neural interface disrupted. Please try again.'
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
