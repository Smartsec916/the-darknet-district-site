// Basic scroll functionality
document.addEventListener('DOMContentLoaded', function() {
  const backToTopButton = document.getElementById("backToTop");

  if (backToTopButton) {
    window.onscroll = function() {
      if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        backToTopButton.style.display = "block";
      } else {
        backToTopButton.style.display = "none";
      }
    };
  }

  // Initialize chat
  insertIrisChat();
});

function scrollToTop() {
  window.scrollTo({top: 0, behavior: 'smooth'});
}

const greetings = {
  neutral: [
    "Connection secured. I'm online.",
    "You're linked to my node. Ask if you need something."
  ],
  flirty: [
    "Well hey there, you found me.",
    "Back already? I was hoping you'd connect."
  ],
  cold: [
    "Node open. Speak with purpose.",
    "You're connected. Don't waste time."
  ],
  sarcastic: [
    "Oh, it's you. This'll be fun.",
    "You again? Don't make me regret it."
  ],
  serious: [
    "Connection active. Let's keep this tight.",
    "We're live. What's your objective?"
  ]
};

function displayMessage(message, className) {
  const chatBox = document.getElementById('chat-box');
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message ' + className;
  messageDiv.textContent = message;
  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function insertIrisChat() {
  const chatHTML = `
    <div id="chat-container" class="chat-container">
      <div class="chat-header">
        <div class="profile-info">
          <img src="attached_assets/008.jpg" alt="Profile Picture" class="profile-pic">
          <div class="user-status">
            <div class="name">Chatting with Iris</div>
            <div class="status"><span class="status-dot"></span> online</div>
          </div>
        </div>
      </div>
      <div id="chat-box"></div>
      <div class="input-container">
        <input type="text" id="user-input" placeholder="Type your message...">
        <button onclick="sendMessage()">Send</button>
      </div>
    </div>
    <button class="chat-toggle" onclick="toggleChat()">Chat with Iris</button>
  `;

  document.body.insertAdjacentHTML('beforeend', chatHTML);

  document.getElementById('user-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') sendMessage();
  });

  // Add initial greeting
  setTimeout(() => {
    const mood = localStorage.getItem("irisMood") || "neutral";
    const moodGreetings = greetings[mood] || greetings["neutral"];
    const message = moodGreetings[Math.floor(Math.random() * moodGreetings.length)];
    displayMessage('Iris: ' + message, 'bot-message');
  }, 500);
}

async function sendMessage() {
  const input = document.getElementById('user-input');
  const message = input.value.trim();
  if (!message) return;

  displayMessage('You: ' + message, 'user-message');
  input.value = '';

  try {
    const response = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: message })
    });
    const data = await response.json();
    displayMessage('Iris: ' + data.response, 'bot-message');
  } catch (error) {
    displayMessage('Error: ' + error.message, 'error');
  }
}

function toggleChat() {
  const chatContainer = document.getElementById('chat-container');
  chatContainer.classList.toggle('active');
}