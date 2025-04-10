function getResponse(message) {
  const patterns = [
    {
      match: /(hi|hello|hey|greetings)/i,
      response: "Hello! I'm Iris, your cybersecurity assistant. How can I help you today?"
    },
    {
      match: /(who|what) are you/i,
      response: "I am Iris, an android assistant created to help maintain security and assist users in The Darknet District."
    },
    {
      match: /security|protect|hack|defense/i,
      response: "Security is crucial in The Darknet District. I recommend starting with our interactive game to learn the basics of cybersecurity. Would you like me to take you there?"
    },
    {
      match: /(how|where|what).+(game|play)/i,
      response: "Our interactive history game will teach you about The Darknet District's origins and basic security concepts. Would you like to play? Just say 'play game' or 'show game'."
    },
    {
      match: /(buy|purchase|store|shop|item|product)/i,
      response: "Our store features cybersecurity books, gear, and tools. Would you like to see what's available? Just say 'show store' or 'go to store'."
    },
    {
      match: /thank|thanks/i,
      response: "You're welcome! Stay safe in The Darknet District."
    }
  ];

  const lowercaseMessage = message.toLowerCase();

  // Check for navigation commands first
  if (lowercaseMessage.includes('show store') || lowercaseMessage.includes('go to store')) {
    window.location.href = 'Store-first-page.html';
    return "Redirecting to store...";
  }

  if (lowercaseMessage.includes('show game') || lowercaseMessage.includes('play game')) {
    window.location.href = 'game.html';
    return "Redirecting to game...";
  }

  // Pattern matching
  for (const pattern of patterns) {
    if (pattern.match.test(lowercaseMessage)) {
      return pattern.response;
    }
  }

  // Default response if no pattern matches
  return "I understand you're interested in The Darknet District. Would you like to know about our store items or try our interactive game?";
}

function sendMessage() {
  const input = document.getElementById('userInput');
  const message = input.value.trim();

  if (message === '') return;

  const chatMessages = document.getElementById('chatMessages');

  // Add user message
  const userDiv = document.createElement('div');
  userDiv.className = 'message user';
  userDiv.textContent = message;
  chatMessages.appendChild(userDiv);

  // Add Iris's response
  setTimeout(() => {
    const irisDiv = document.createElement('div');
    irisDiv.className = 'message iris';
    irisDiv.textContent = getResponse(message);
    chatMessages.appendChild(irisDiv);

    // Auto scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, 500);

  input.value = '';
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Initialize chat functionality
document.addEventListener('DOMContentLoaded', function() {
  const input = document.querySelector('#userInput');
  const sendBtn = document.querySelector('.chat-input button');
  
  if (input) {
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  }
  
  if (sendBtn) {
    sendBtn.addEventListener('click', sendMessage);
  }
});