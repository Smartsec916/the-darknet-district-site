function getRandomResponse(responses) {
  return responses[Math.floor(Math.random() * responses.length)];
}

function getResponse(message) {
  console.log('Getting response for:', message);
  const lowercaseMessage = message.toLowerCase();

  const patterns = [
    {
      match: /^(hello|hi|hey|greetings|good\s*(morning|afternoon|evening))\b/i,
      responses: [
        "Hello! I'm Iris, your cybersecurity assistant. How can I help you today?",
        "Greetings! I'm here to help with security and navigation in The Darknet District.",
        "Hi there! I'm Iris. What would you like to know about The Darknet District?"
      ]
    },
    // Add more patterns here
  ];

  // Check navigation commands first
  if (lowercaseMessage.includes('show store')) {
    window.location.href = 'store.html';
    return "Redirecting to the store...";
  }

  if (lowercaseMessage.includes('play game')) {
    window.location.href = 'game.html';
    return "Redirecting to the game...";
  }

  // Match pattern
  for (const pattern of patterns) {
    if (pattern.match.test(lowercaseMessage)) {
      return getRandomResponse(pattern.responses);
    }
  }

  return "I'm not sure I understand. How can I assist you in The Darknet District?";
}

function sendMessage() {
  const input = document.querySelector('#userInput');
  const chatMessages = document.querySelector('.chat-messages');

  if (!input || !chatMessages) {
    console.error('Missing chat elements');
    return;
  }

  const message = input.value.trim();
  if (message === '') return;

  // Add user message
  const userDiv = document.createElement('div');
  userDiv.className = 'message user';
  userDiv.textContent = message;
  chatMessages.appendChild(userDiv);

  // Add response
  setTimeout(() => {
    const irisDiv = document.createElement('div');
    irisDiv.className = 'message iris';
    const response = getResponse(message);
    irisDiv.textContent = response;
    chatMessages.appendChild(irisDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, 500);

  input.value = '';
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('Chat initialized');
  const input = document.querySelector('#userInput');
  if (input) {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  }
});
