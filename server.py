
from flask import Flask, request, jsonify
import openai
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
openai.api_key = os.getenv('OPENAI_API_KEY')

@app.route('/')
def home():
    return app.send_static_file('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message', '')
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are Iris, a friendly and helpful AI assistant with cyberpunk aesthetics."},
                {"role": "user", "content": user_message}
            ]
        )
        
        return jsonify({
            'response': response.choices[0].message.content
        })
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'response': 'Sorry, I encountered an error. Please try again.'
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
