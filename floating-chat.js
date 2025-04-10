document.addEventListener('DOMContentLoaded', function() {
  const floatingChat = document.createElement('div');
  floatingChat.className = 'floating-chat';

  const chatToggle = document.createElement('div');
  chatToggle.className = 'chat-toggle';
  chatToggle.textContent = 'Chat with Iris';

  const chatWindow = document.createElement('div');
  chatWindow.className = 'chat-window';

  const chatMessages = document.createElement('div');
  chatMessages.className = 'chat-messages';

  // Add Iris avatar and status
  const irisHeader = document.createElement('div');
  irisHeader.className = 'iris-header';
  
  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  
  const status = document.createElement('span');
  status.className = 'status-indicator';
  status.textContent = 'Online';
  
  irisHeader.appendChild(avatar);
  irisHeader.appendChild(status);
  chatWindow.insertBefore(irisHeader, chatMessages);

  // Add initial greeting
  const greeting = document.createElement('div');
  greeting.className = 'message iris';
  greeting.textContent = "Hello! How can I help you today?";
  chatMessages.appendChild(greeting);

  const inputContainer = document.createElement('div');
  inputContainer.style.display = 'flex';
  inputContainer.style.padding = '10px';
  inputContainer.style.gap = '10px';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Type your message...';

  const sendButton = document.createElement('button');
  sendButton.textContent = '↵';

  inputContainer.appendChild(input);
  inputContainer.appendChild(sendButton);

  chatWindow.appendChild(chatMessages);
  chatWindow.appendChild(inputContainer);

  const floatingChat = document.createElement('div');
  floatingChat.className = 'floating-chat';
  floatingChat.appendChild(chatWindow);
  floatingChat.appendChild(chatToggle);

  document.body.appendChild(floatingChat);

  let isOpen = false;

  function toggleChat() {
    isOpen = !isOpen;
    chatWindow.style.display = isOpen ? 'block' : 'none';
    if (isOpen) {
      setTimeout(() => {
        chatWindow.classList.add('active');
        input.focus();
      }, 0);
    } else {
      chatWindow.classList.remove('active');
    }
  }

  chatToggle.addEventListener('click', toggleChat);

  function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    messageDiv.textContent = text;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function handleSend() {
    const message = input.value.trim();
    if (message) {
      addMessage(message, 'user');
      input.value = '';

      // Add Iris's response
      setTimeout(async () => {
        const response = await getResponse(message);
        const irisDiv = document.createElement('div');
        irisDiv.className = 'message iris';
        irisDiv.textContent = '';
        chatMessages.appendChild(irisDiv);

        let i = 0;
        const typingInterval = setInterval(() => {
          if (i < response.length) {
            irisDiv.textContent += response[i];
            chatMessages.scrollTop = chatMessages.scrollHeight;
            i++;
          } else {
            clearInterval(typingInterval);
          }
        }, 50);
      }, 500);
    }
  }

  sendButton.addEventListener('click', handleSend);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  });
});