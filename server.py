from flask import Flask, request, jsonify, send_from_directory
import os

app = Flask(__name__)

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

        # Static response for now until OpenAI integration is added later
        return jsonify({
            'response': "OpenAI integration will be added later. For now, I am Iris responding with a static message. Try asking me something else!"
        })
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'response': 'Connection lost. Neural interface disrupted. Please try again.'
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)