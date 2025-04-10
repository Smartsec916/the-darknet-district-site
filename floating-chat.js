
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
          <div class="chat-messages" id="chatMessages">
            <div class="message system">
              Welcome to The Darknet District. I am Iris, your assistance android.
            </div>
          </div>
          <div class="chat-input">
            <input type="text" id="userInput" placeholder="Type your message...">
            <button onclick="sendMessage()">Send</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', chatHtml);

  const chatToggle = document.querySelector('.chat-toggle');
  const chatWindow = document.querySelector('.chat-window');

  chatToggle.addEventListener('click', () => {
    chatWindow.classList.toggle('active');
  });
}

document.addEventListener('DOMContentLoaded', initFloatingChat);
