function sendMessage() {
  const chatWindow = document.querySelector('.floating-chat .chat-window');
  if (!chatWindow) return;

  const input = chatWindow.querySelector('#userInput');
  const chatMessages = chatWindow.querySelector('.chat-messages');

  if (!input || !chatMessages) return;

  const message = input.value.trim();
  if (message === '') return;

  // Add user message
  const userDiv = document.createElement('div');
  userDiv.className = 'message user';
  userDiv.textContent = message;
  chatMessages.appendChild(userDiv);

  // Add Iris's response
  setTimeout(() => {
    const irisDiv = document.createElement('div');
    irisDiv.className = 'message iris';
    const response = getResponse(message);
    irisDiv.textContent = response;
    chatMessages.appendChild(irisDiv);

    // Auto scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, 500);

  input.value = '';
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function initFloatingChat() {
  if (document.querySelector('.floating-chat')) return;

  const chatHtml = `
    <div class="floating-chat">
      <button class="chat-toggle">Chat with Iris</button>
      <div class="chat-window">
        <div class="chat-container">
          <div class="chat-header">
            <div class="avatar"></div>
            <h2>Chatting with Iris</h2>
            <span class="status">ONLINE</span>
          </div>
          <div class="chat-messages">
            <div class="message system">
              Greetings! I am Iris, your cybersecurity assistant in The Darknet District. How may I help you today?
            </div>
          </div>
          <div class="chat-input">
            <input type="text" id="userInput" placeholder="Type your message...">
            <button onclick="sendMessage()">Enter <span style="font-size: 1.2em;">↵</span></button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', chatHtml);

  const chatToggle = document.querySelector('.chat-toggle');
  const chatWindow = document.querySelector('.chat-window');

  if (chatToggle && chatWindow) {
    chatToggle.addEventListener('click', () => {
      chatWindow.classList.toggle('active');
      const input = document.querySelector('#userInput');
      if (input) input.focus();
    });
  }
}

// Initialize floating chat
document.addEventListener('DOMContentLoaded', initFloatingChat);