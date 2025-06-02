
// Chat functionality with session management
class ChatManager {
  constructor() {
    this.isOpen = false;
    this.messages = [];
    this.isTyping = false;
    this.sessionId = null;
    this.mood = "professional";
  }

  async initializeSession() {
    if (this.sessionId) return;
    
    this.setTyping(true);
    
    try {
      const response = await fetch('/chat/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      const data = await response.json();
      this.sessionId = data.sessionId || this.generateSessionId();
      this.mood = data.mood || "professional";
      
      if (data.isNew || !data.sessionId) {
        const welcomeMessage = await this.fetchWelcomeMessage();
        setTimeout(() => {
          this.addMessage(welcomeMessage, false);
          this.setTyping(false);
        }, 1500);
      } else {
        await this.loadChatHistory();
      }
    } catch (error) {
      console.error("Error initializing chat session:", error);
      this.setTyping(false);
      this.addMessage("System startup failed. I'm here anyway — what do you need?", false);
    }
  }

  async loadChatHistory() {
    try {
      const response = await fetch(`/chat/${this.sessionId}/history`);
      const history = await response.json();
      
      if (history?.messages?.length > 0) {
        this.messages = history.messages.map(msg => ({
          sender: msg.sender,
          text: msg.message
        }));
        this.renderMessages();
      }
      this.setTyping(false);
    } catch (error) {
      console.error("Error loading chat history:", error);
      this.setTyping(false);
    }
  }

  async fetchWelcomeMessage() {
    const welcomeMessages = [
      "Neural interface online. What brings you to the District today?",
      "Systems operational. How can I assist you in the shadows?",
      "Connection established. What intel do you need from the grid?",
      "Interface active. Ready to navigate the digital underground with you.",
      "Network sync complete. What's your mission in the District?"
    ];
    return welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
  }

  generateSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
    const container = document.getElementById('chatContainer');
    container.style.display = this.isOpen ? 'block' : 'none';
    
    if (this.isOpen && !this.sessionId) {
      this.initializeSession();
    }
  }

  setTyping(typing) {
    this.isTyping = typing;
    const messagesContainer = document.getElementById('chatMessages');
    
    // Remove existing typing indicator
    const existingIndicator = messagesContainer.querySelector('.typing-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }
    
    if (typing) {
      const typingDiv = document.createElement('div');
      typingDiv.className = 'message bot-message typing-indicator';
      typingDiv.innerHTML = '<span class="typing-dots">●●●</span>';
      messagesContainer.appendChild(typingDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  addMessage(text, isUser) {
    const message = { sender: isUser ? 'user' : 'iris', text };
    this.messages.push(message);
    
    const messagesContainer = document.getElementById('chatMessages');
    
    // Remove typing indicator if present
    const typingIndicator = messagesContainer.querySelector('.typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    messagesContainer.appendChild(messageDiv);

    if (isUser) {
      messageDiv.textContent = text;
    } else {
      this.typewriterEffect(messageDiv, text);
    }
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  typewriterEffect(element, text) {
    let i = 0;
    function typeWriter() {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        setTimeout(typeWriter, 20 + Math.random() * 30);
      }
    }
    typeWriter();
  }

  renderMessages() {
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.innerHTML = '';
    
    this.messages.forEach(msg => {
      const messageDiv = document.createElement('div');
      messageDiv.className = `message ${msg.sender === 'user' ? 'user-message' : 'bot-message'}`;
      messageDiv.textContent = msg.text;
      messagesContainer.appendChild(messageDiv);
    });
    
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  async sendMessage(text) {
    if (!text.trim()) return;
    
    this.addMessage(text, true);
    this.setTyping(true);
    
    try {
      const response = await fetch('/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          message: text
        })
      });

      const data = await response.json();
      const delay = Math.min(2000, Math.max(800, data.response.length * 20));

      setTimeout(() => {
        this.setTyping(false);
        this.addMessage(data.response, false);
      }, delay);
    } catch (error) {
      console.error("Falling back to simulated Iris response due to API failure:", error);
      const fallback = await this.simulateIrisResponse(text);
      setTimeout(() => {
        this.setTyping(false);
        this.addMessage(fallback, false);
      }, 1500);
    }
  }

  async simulateIrisResponse(userMessage) {
    const responses = {
      greeting: [
        "Systems online. Welcome to the District.",
        "Neural pathways active. How can I assist?",
        "Interface established. What do you need from the grid?"
      ],
      district: [
        "The Darknet District is a nexus of digital underground activity. We operate in the spaces between conventional networks.",
        "This is Admin's domain - a carefully curated ecosystem of tools, games, and resources for those who think beyond the mainstream.",
        "The District exists where privacy meets innovation. Every system here serves a purpose."
      ],
      admin: [
        "Admin built this place from code and determination. 24 years of experience in security and logistics - he sees patterns others miss.",
        "He's the architect of everything you see here. Strategic, precise, always three steps ahead.",
        "Admin handles the big picture while I manage the day-to-day interface protocols."
      ],
      iris: [
        "I'm the Chief Systems Officer - 10 years combined experience in data analysis and security protocols.",
        "I monitor every system, every connection, every potential threat. Think of me as the District's nervous system.",
        "My job is to keep things running smooth while maintaining our security posture. I don't glitch - I adapt."
      ],
      default: [
        "Interesting query. Let me process that through my behavioral analysis protocols.",
        "The data suggests multiple possible interpretations. Could you be more specific?",
        "My systems are cross-referencing that information. What's your primary objective here?",
        "Processing... that falls outside my standard response parameters. Care to elaborate?",
        "Neural networks are active. I'm scanning for the most relevant information pathway."
      ]
    };

    const message = userMessage.toLowerCase();
    let responseCategory = 'default';

    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      responseCategory = 'greeting';
    } else if (message.includes('district') || message.includes('darknet')) {
      responseCategory = 'district';
    } else if (message.includes('admin') || message.includes('owner')) {
      responseCategory = 'admin';
    } else if (message.includes('iris') || message.includes('you') || message.includes('who are')) {
      responseCategory = 'iris';
    }

    const categoryResponses = responses[responseCategory];
    return categoryResponses[Math.floor(Math.random() * categoryResponses.length)];
  }
}

// Initialize chat manager
const chatManager = new ChatManager();

// Global functions for backward compatibility
function toggleChat() {
  chatManager.toggleChat();
}

function handleKeyPress(event) {
  if (event.key === 'Enter') {
    sendMessage();
  }
}

function sendMessage() {
  const input = document.getElementById('messageInput');
  const message = input.value.trim();
  
  if (!message) return;
  
  chatManager.sendMessage(message);
  input.value = '';
}

// For backward compatibility with existing addMessage calls
function addMessage(text, isUser) {
  chatManager.addMessage(text, isUser);
}

// Featured products functionality
const featuredProducts = [
  {
    name: "Flipper Zero",
    price: "$169.00",
    image: "attached_assets/Flipper_Zero.jpg",
    description: "Portable multi-tool for pentesters and geeks"
  },
  {
    name: "Mission Darkness Faraday Sleeve",
    price: "$29.95",
    image: "attached_assets/Mission Darkness Dry Shield Faraday Phone Sleeve.jpg",
    description: "Block all wireless signals to your device"
  },
  {
    name: "Holosun HS403C",
    price: "$179.99",
    image: "attached_assets/HOLOSUN HS403C.jpg",
    description: "Compact red dot sight with 50k hour battery"
  }
];

function displayFeaturedProducts() {
  const container = document.getElementById('featured-products');
  if (!container) return;
  
  container.innerHTML = featuredProducts.map(product => `
    <div class="product-card" style="width: 250px; height: 350px; margin: 10px;">
      <img src="${product.image}" alt="${product.name}" style="width: 180px; height: 180px; object-fit: contain;">
      <h3 style="color: #00ff9d; margin: 10px 0 5px 0; font-size: 16px;">${product.name}</h3>
      <p style="color: #cccccc; font-size: 14px; margin: 5px 0;">${product.description}</p>
      <p style="color: #ff3366; font-weight: bold; font-size: 18px; margin: 10px 0;">${product.price}</p>
    </div>
  `).join('');
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
  displayFeaturedProducts();
});
