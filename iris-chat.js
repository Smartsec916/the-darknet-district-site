
function getResponse(message) {
  const responses = {
    "hello": "Hello! How can I assist you today?",
    "hi": "Hi there! How can I help you?",
    "who are you": "I am Iris, an android assistant created by Admin to help maintain security and assist users in The Darknet District.",
    "help": "I can help you navigate The Darknet District, provide information about our services, and assist with security-related questions. Would you like to know about our store items or play our interactive history game?",
    "what can you do": "I can provide information about The Darknet District, help with navigation, answer questions about our services, and assist with security-related inquiries. I can also tell you about our upcoming store items or guide you to our interactive history game!",
    "store": "Our store will feature: Books (digital security guides and cyberpunk fiction), T-Shirts with exclusive designs, Stickers, PVC Patches, Electronics (custom gadgets), Survival Gear, Emergency Supplies, and Apps. These items will be available soon! Would you like to see the store page? Just say 'show store' or 'go to store'.",
    "shop": "Our store will feature: Books (digital security guides and cyberpunk fiction), T-Shirts with exclusive designs, Stickers, PVC Patches, Electronics (custom gadgets), Survival Gear, Emergency Supplies, and Apps. These items will be available soon! Would you like to see the store page? Just say 'show store' or 'go to store'.",
    "items": "Our store will feature: Books (digital security guides and cyberpunk fiction), T-Shirts with exclusive designs, Stickers, PVC Patches, Electronics (custom gadgets), Survival Gear, Emergency Supplies, and Apps. These items will be available soon! Would you like to see the store page? Just say 'show store' or 'go to store'.",
    "products": "Our store will feature: Books (digital security guides and cyberpunk fiction), T-Shirts with exclusive designs, Stickers, PVC Patches, Electronics (custom gadgets), Survival Gear, Emergency Supplies, and Apps. These items will be available soon! Would you like to see the store page? Just say 'show store' or 'go to store'.",
    "game": "We have an interactive history game that takes you through The Darknet District's story! Would you like to play? Just say 'play game' or 'show game'.",
    "play": "We have an interactive history game that takes you through The Darknet District's story! Would you like to play? Just say 'play game' or 'show game'.",
    "show store": "Taking you to the store page...",
    "go to store": "Taking you to the store page...",
    "show game": "Taking you to the game page...",
    "play game": "Taking you to the game page..."
  };

  // Default response if no match is found
  let response = "I understand your message. How can I assist you further?";

  // Check for matching keywords in the message
  const lowercaseMessage = message.toLowerCase();
  for (const [key, value] of Object.entries(responses)) {
    if (lowercaseMessage.includes(key)) {
      response = value;
      break;
    }
  }

  // Handle navigation commands
  if (lowercaseMessage.includes('show store') || lowercaseMessage.includes('go to store')) {
    window.location.href = 'Store-first-page.html';
    return "Redirecting to store...";
  }
  
  if (lowercaseMessage.includes('show game') || lowercaseMessage.includes('play game')) {
    window.location.href = 'game.html';
    return "Redirecting to game...";
  }

  return response;
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

// Allow Enter key to send messages
document.getElementById('userInput').addEventListener('keypress', function(e) {
  if (e.key === 'Enter') {
    sendMessage();
  }
});
