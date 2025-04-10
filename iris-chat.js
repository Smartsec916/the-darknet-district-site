
// Enhanced pattern matching with randomized responses
const patterns = [
  {
    match: /(hi|hello|hey|greetings)/i,
    responses: [
      "Hello! I'm Iris, your cybersecurity assistant. How can I help you today?",
      "Greetings! I'm here to help with security and navigation in The Darknet District.",
      "Hi there! I'm Iris. What would you like to know about The Darknet District?"
    ]
  },
  {
    match: /(who|what) are you/i,
    responses: [
      "I am Iris, an android assistant created to help maintain security and assist users in The Darknet District.",
      "I'm Iris, your cybersecurity guide through The Darknet District. I can help you with security, games, and shopping."
    ]
  },
  {
    match: /security|protect|hack|defense/i,
    responses: [
      "Security is crucial in The Darknet District. I recommend starting with our interactive game to learn the basics of cybersecurity. Would you like me to take you there?",
      "The Darknet District takes security seriously. Let me show you our security basics through our interactive game."
    ]
  },
  {
    match: /(how|where|what).+(game|play)/i,
    responses: [
      "Our interactive game will teach you about security concepts. Ready to play?",
      "I can take you to our game section where you'll learn about cybersecurity through gameplay."
    ]
  },
  {
    match: /(buy|purchase|store|shop|item|product)/i,
    responses: [
      "Our store features cybersecurity gear and tools. Would you like to see what's available?",
      "I can show you our collection of security tools and cyberpunk merchandise in the store."
    ]
  },
  {
    match: /thank|thanks/i,
    responses: [
      "You're welcome! Stay safe in The Darknet District.",
      "Anytime! Remember to stay vigilant in The Darknet District."
    ]
  }
];

function getRandomResponse(responses) {
  const index = Math.floor(Math.random() * responses.length);
  return responses[index];
}

function getResponse(message) {
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

  // Pattern matching with random responses
  for (const pattern of patterns) {
    if (pattern.match.test(lowercaseMessage)) {
      return getRandomResponse(pattern.responses);
    }
  }

  return "I understand you're interested in The Darknet District. Would you like to know about our store items or try our interactive game?";
}

function sendMessage() {
  const chatWindow = document.querySelector('.chat-window');
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
