
function getResponse(message) {
  const responses = {
    "hello": "Hello! How can I assist you today?",
    "hi": "Hi there! How can I help you?",
    "who are you": "I am Iris, an android assistant created by Admin to help maintain security and assist users in The Darknet District.",
    "help": "I can help you navigate The Darknet District, provide information about our services, and assist with security-related questions.",
    "what can you do": "I can provide information about The Darknet District, help with navigation, answer questions about our services, and assist with security-related inquiries.",
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
