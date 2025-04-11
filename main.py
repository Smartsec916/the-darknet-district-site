
from flask import Flask, render_template, jsonify

app = Flask(__name__)

@app.route('/')
def home():
    return app.send_static_file('index.html')

@app.route('/api/chat', methods=['POST'])
def chat():
    # Chat endpoint for future implementation
    return jsonify({"response": "Message received"})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
