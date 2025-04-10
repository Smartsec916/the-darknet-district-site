// Enhanced pattern matching with randomized responses
const patterns = [
  {
    match: /^(hello|hi|hey|greetings|good\s*(morning|afternoon|evening))\b/i,
    responses: [
      "Welcome to The Darknet District! I'm Iris, and I'd love to tell you about our interactive game that explores the history of the district, or our upcoming shop featuring cyberpunk gear. What interests you?",
      "Hello! I'm Iris. We have an exciting interactive game that lets you explore The Darknet District's origins, plus a shop coming soon with cyberpunk gear and urban survival equipment. Would you like to know more about either?",
      "Greetings! I'm Iris, your guide to The Darknet District. Our interactive game offers an immersive story experience, and our shop will soon offer cyberpunk merchandise. What would you like to explore first?"
    ]
  },
  {
    match: /(who|what) are you/i,
    responses: [
      "I am Iris, an android assistant created to help maintain security and assist users in The Darknet District.",
      "I'm Iris, your guide through The Darknet District. I can help you with games, and shopping."
    ]
  },
  {
    match: /security|protect|hack|defense/i,
    responses: [
      "Security is crucial in The Darknet District. I recommend starting with our interactive game to learn the basics. Would you like me to take you there?",
      "The Darknet District takes security seriously. Let me show you our security basics through our interactive game."
    ]
  },
  {
    match: /(how|where|what).+(game|play)/i,
    responses: [
      "Our game 'The Darknet District - Origins' is an interactive experience that teaches through an engaging story. You'll learn about the district's fascinating history. Ready to start your journey?",
      "In our interactive game, you'll discover the origins of The Darknet District. It's a unique blend of storytelling and practical knowledge. Would you like to play?"
    ]
  },
  {
    match: /(gear|equipment|tools|gadgets)/i,
    responses: [
      "Our gear collection will include urban survival equipment, custom electronics, and tactical tools. We're focusing on high-quality, practical items that blend form and function. Would you like to know about specific categories?",
      "The gear section will feature everything from custom electronic gadgets to urban survival equipment. Each piece is carefully selected for both utility and style."
    ]
  },
  {
    match: /(buy|purchase|store|shop|item|product)/i,
    responses: [
      "Our upcoming shop will feature an exciting range of products including urban survival gear, cyberpunk apparel, and exclusive merchandise. We'll have everything from technical manuals to custom gadgets. Would you like to preview the categories?",
      "The Darknet District shop is coming soon with an incredible selection of custom electronics, survival equipment, and cyberpunk merchandise. I can show you what's planned to be available!"
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
    irisDiv.className = 'message iris';
    irisDiv.textContent = '';
    const chatMessages = document.querySelector('.chat-messages');
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