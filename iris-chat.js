// Enhanced pattern matching with randomized responses
const patterns = [
  {
    match: /^(hello|hi|hey|greetings|good\s*(morning|afternoon|evening))\b/i,
    responses: [
      "Welcome to The Darknet District! I'm Iris, and I'd love to tell you about our interactive cybersecurity game that teaches you the history of the district, or our upcoming shop featuring cyberpunk gear and security tools. What interests you?",
      "Hello! I'm Iris. We have an exciting interactive game that lets you explore The Darknet District's origins, plus a shop coming soon with everything from security tools to urban survival gear. Would you like to know more about either?",
      "Greetings! I'm Iris, your guide to The Darknet District. Our interactive game teaches cybersecurity through an immersive story, and our shop will soon offer cutting-edge security tools and cyberpunk merchandise. What would you like to explore first?"
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
      "Our game 'The Darknet District - Origins' is an interactive experience that teaches cybersecurity through an engaging story. You'll learn about encryption, digital security, and the district's fascinating history. Ready to start your journey?",
      "In our interactive game, you'll discover the origins of The Darknet District while learning essential cybersecurity skills. It's a unique blend of storytelling and practical security knowledge. Would you like to play?"
    ]
  },
  {
    match: /(buy|purchase|store|shop|item|product)/i,
    responses: [
      "Our upcoming shop will feature an exciting range of products including security tools, urban survival gear, cyberpunk apparel, and exclusive merchandise. We'll have everything from technical manuals to custom gadgets. Would you like to preview the categories?",
      "The Darknet District shop is coming soon with an incredible selection of cybersecurity gear, custom electronics, survival equipment, and cyberpunk merchandise. I can show you what's planned to be available!"
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
  return responses[Math.floor(Math.random() * responses.length)];
}

function getResponse(message) {
  const lowercaseMessage = message.toLowerCase();

  // Handle navigation commands
  if (lowercaseMessage.includes('show store') || lowercaseMessage.includes('go to store')) {
    window.location.href = 'Store-first-page.html';
    return "Redirecting to store...";
  }
  if (lowercaseMessage.includes('show game') || lowercaseMessage.includes('play game')) {
    window.location.href = 'game-first-page.html';
    return "Redirecting to game...";
  }

  // Pattern matching
  for (const pattern of patterns) {
    if (pattern.match.test(lowercaseMessage)) {
      return getRandomResponse(pattern.responses);
    }
  }

  return "I understand you're interested in The Darknet District. Would you like to know about our store items or try our interactive game?";
}

function addMessage(text, sender) {
  const messages = document.querySelector('.chat-messages');
  if (!messages) return;

  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${sender}`;
  msgDiv.textContent = text;
  messages.appendChild(msgDiv);
  messages.scrollTop = messages.scrollHeight;
}

function sendMessage() {
  const input = document.querySelector('#userInput');
  if (!input) return;

  const message = input.value.trim();
  if (message === '') return;

  addMessage(message, 'user');

  setTimeout(() => {
    const response = getResponse(message);
    const irisDiv = document.createElement('div');
    irisDiv.className = 'message iris typing';
    irisDiv.textContent = ''; // Start with empty text
    const chatMessages = document.querySelector('.chat-messages');
    chatMessages.appendChild(irisDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    let i = 0;
    const typingInterval = setInterval(() => {
      irisDiv.textContent += response[i];
      chatMessages.scrollTop = chatMessages.scrollHeight;
      i++;
      if (i === response.length) {
        clearInterval(typingInterval);
        irisDiv.classList.remove('typing');
      }
    }, 30); // Faster typing speed
  }, 500);

  input.value = '';
  input.focus();
}

// Initialize chat when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const input = document.querySelector('#userInput');
  if (!input) return;

  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  const sendBtn = document.querySelector('button[onclick="sendMessage()"]');
  if (sendBtn) {
    sendBtn.addEventListener('click', sendMessage);
  }
});