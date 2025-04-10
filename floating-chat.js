
function sendMessage() {
  const chatContainer = document.querySelector('.floating-chat');
  if (!chatContainer) return;
  
  const input = chatContainer.querySelector('#userInput');
  const chatMessages = chatContainer.querySelector('.chat-messages');
  
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
  const chatHtml = `
    <div class="floating-chat">
      <button class="chat-toggle">Chat with Iris</button>
      <div class="chat-window">
        <div class="chat-container">
          <div class="chat-header">
            <div class="avatar"></div>
            <h2>IRIS</h2>
            <span class="status">ONLINE</span>
          </div>
          <div class="chat-messages">
            <div class="message system">
              Welcome to The Darknet District. I am Iris, your assistance android.
            </div>
          </div>
          <div class="chat-input">
            <input type="text" id="userInput" placeholder="Type your message...">
            <button class="send-button">Send</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', chatHtml);

  const chatToggle = document.querySelector('.floating-chat .chat-toggle');
  const chatWindow = document.querySelector('.floating-chat .chat-window');
  const sendButton = document.querySelector('.floating-chat .send-button');
  const input = document.querySelector('.floating-chat #userInput');

  if (chatToggle && chatWindow) {
    chatToggle.addEventListener('click', () => {
      chatWindow.classList.toggle('active');
    });
  }

  if (sendButton) {
    sendButton.addEventListener('click', sendMessage);
  }

  if (input) {
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', initFloatingChat);
