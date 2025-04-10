
const responses = {
  "hello": "Greetings, patron. How may I assist you today?",
  "hi": "Greetings, patron. How may I assist you today?",
  "help": "I can assist you with: \n- Security protocols\n- Navigation\n- Product information\n- Emergency services",
  "who are you": "I am Iris, an advanced security android created by Admin to protect and assist patrons of The Darknet District.",
  "security": "Security protocols are active and all systems are currently operating at optimal levels. No threats detected.",
  "products": "Our store offers various cyberpunk merchandise including books, t-shirts, stickers, patches, electronics, and survival gear. All items are currently under construction.",
  "location": "The Darknet District exists in the digital realm. Physical coordinates are irrelevant here.",
  "emergency": "Emergency protocols activated. Please specify the nature of your emergency. Security teams are on standby.",
  "default": "I understand your inquiry. However, this response pattern is not in my current database. Please rephrase or ask another question."
};

function getResponse(input) {
  input = input.toLowerCase().trim();
  for (let key in responses) {
    if (input.includes(key)) {
      return responses[key];
    }
  }
  return responses.default;
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
