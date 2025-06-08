// Enhanced Chat functionality with mood management and advanced session control
class ChatManager {
  constructor() {
    this.isOpen = false;
    this.messages = [];
    this.isTyping = false;
    this.sessionId = null;
    this.mood = "professional";
    this.userProfile = {
      preferences: {},
      visitCount: 0,
      lastVisit: null
    };
    this.contextMemory = [];
    this.moodTransitions = {
      professional: ["analytical", "helpful", "curious"],
      analytical: ["professional", "technical", "focused"],
      helpful: ["professional", "friendly", "supportive"],
      curious: ["analytical", "investigative", "engaged"],
      technical: ["analytical", "precise", "detailed"],
      focused: ["technical", "direct", "efficient"],
      friendly: ["helpful", "casual", "warm"],
      supportive: ["helpful", "encouraging", "understanding"],
      investigative: ["curious", "probing", "thorough"],
      engaged: ["curious", "enthusiastic", "interactive"]
    };
    this.loadUserProfile();
  }

  loadUserProfile() {
    try {
      const stored = localStorage.getItem('iris_user_profile');
      if (stored) {
        this.userProfile = { ...this.userProfile, ...JSON.parse(stored) };
        this.userProfile.visitCount++;
        this.userProfile.lastVisit = new Date().toISOString();
      } else {
        this.userProfile.visitCount = 1;
        this.userProfile.lastVisit = new Date().toISOString();
      }
      this.saveUserProfile();
    } catch (error) {
      console.log("New user profile created");
    }
  }

  saveUserProfile() {
    try {
      localStorage.setItem('iris_user_profile', JSON.stringify(this.userProfile));
    } catch (error) {
      console.log("Unable to save user profile");
    }
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
        body: JSON.stringify({
          userProfile: this.userProfile
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      this.sessionId = data.sessionId || this.generateSessionId();
      this.mood = data.mood || this.determineMood();

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
      this.sessionId = this.generateSessionId();
      this.setTyping(false);
      const fallbackWelcome = this.getPersonalizedWelcome();
      this.addMessage(fallbackWelcome, false);
    }
  }

  determineMood() {
    const timeOfDay = new Date().getHours();
    const visitCount = this.userProfile.visitCount;

    if (timeOfDay < 6 || timeOfDay > 22) return "focused";
    if (visitCount === 1) return "curious";
    if (visitCount > 10) return "friendly";
    return "professional";
  }

  getPersonalizedWelcome() {
    const { visitCount } = this.userProfile;
    const timeOfDay = new Date().getHours();

    let greeting;
    if (timeOfDay < 12) greeting = "morning";
    else if (timeOfDay < 18) greeting = "afternoon";
    else greeting = "evening";

    if (visitCount === 1) {
      return `Neural interface online. Good ${greeting}, newcomer. Welcome to the District's neural network. I'm Iris, and I'll be your guide through our digital infrastructure.`;
    } else if (visitCount <= 5) {
      return `Systems recognize your pattern. Good ${greeting}. Back in the shadows again? What brings you to the District this time?`;
    } else {
      return `Welcome back, regular. Neural pathways remember you. Ready to dive deeper into the District's offerings?`;
    }
  }

  async loadChatHistory() {
    try {
      const response = await fetch(`/chat/${this.sessionId}/history`);
      if (!response.ok) throw new Error('Failed to load history');

      const history = await response.json();

      if (history?.messages?.length > 0) {
        this.messages = history.messages.map(msg => ({
          sender: msg.sender,
          text: msg.message,
          timestamp: msg.timestamp,
          mood: msg.mood || this.mood
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
    return this.getPersonalizedWelcome();
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

    const existingIndicator = messagesContainer.querySelector('.typing-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }

    if (typing) {
      const typingDiv = document.createElement('div');
      typingDiv.className = 'message bot-message typing-indicator';
      typingDiv.innerHTML = `<span class="typing-dots mood-${this.mood}">●●●</span>`;
      messagesContainer.appendChild(typingDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  addMessage(text, isUser, mood = null) {
    const currentMood = mood || this.mood;
    const message = { 
      sender: isUser ? 'user' : 'iris', 
      text,
      timestamp: new Date().toISOString(),
      mood: currentMood
    };
    this.messages.push(message);

    // Update context memory
    if (this.contextMemory.length > 10) {
      this.contextMemory.shift();
    }
    this.contextMemory.push({
      type: isUser ? 'user' : 'iris',
      content: text,
      mood: currentMood,
      timestamp: message.timestamp
    });

    const messagesContainer = document.getElementById('chatMessages');

    const typingIndicator = messagesContainer.querySelector('.typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'} mood-${currentMood}`;
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
    const speed = this.mood === "technical" ? 15 : this.mood === "friendly" ? 35 : 25;

    function typeWriter() {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        setTimeout(typeWriter, speed + Math.random() * 15);
      }
    }
    typeWriter();
  }

  renderMessages() {
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.innerHTML = '';

    this.messages.forEach(msg => {
      const messageDiv = document.createElement('div');
      messageDiv.className = `message ${msg.sender === 'user' ? 'user-message' : 'bot-message'} mood-${msg.mood || 'professional'}`;
      messageDiv.textContent = msg.text;
      messagesContainer.appendChild(messageDiv);
    });

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  updateMood(newMood) {
    if (this.moodTransitions[this.mood]?.includes(newMood)) {
      this.mood = newMood;
      return true;
    }
    return false;
  }

  analyzeSentiment(text) {
    const positiveWords = ['good', 'great', 'excellent', 'awesome', 'love', 'like', 'amazing', 'perfect'];
    const negativeWords = ['bad', 'terrible', 'hate', 'awful', 'horrible', 'wrong', 'error', 'problem'];
    const technicalWords = ['code', 'function', 'algorithm', 'data', 'system', 'protocol', 'security'];

    const words = text.toLowerCase().split(' ');
    let sentiment = 0;
    let technical = 0;

    words.forEach(word => {
      if (positiveWords.includes(word)) sentiment++;
      if (negativeWords.includes(word)) sentiment--;
      if (technicalWords.includes(word)) technical++;
    });

    return { sentiment, technical };
  }

  async sendMessage(text) {
    if (!text.trim()) return;

    // Analyze user input for mood adjustment
    const analysis = this.analyzeSentiment(text);
    let newMood = this.mood;

    if (analysis.technical > 0) {
      newMood = "technical";
    } else if (analysis.sentiment > 0) {
      newMood = "friendly";
    } else if (analysis.sentiment < 0) {
      newMood = "supportive";
    }

    this.updateMood(newMood);
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
          message: text,
          mood: this.mood,
          context: this.contextMemory.slice(-5),
          userProfile: this.userProfile
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const delay = Math.min(2500, Math.max(1000, data.response.length * 25));

      setTimeout(() => {
        this.setTyping(false);
        this.addMessage(data.response, false, data.mood || this.mood);

        // Update mood based on response
        if (data.mood && this.updateMood(data.mood)) {
          this.mood = data.mood;
        }
      }, delay);
    } catch (error) {
      console.error("Chat API error, using enhanced fallback:", error);
      const fallback = await this.enhancedFallbackResponse(text);
      setTimeout(() => {
        this.setTyping(false);
        this.addMessage(fallback.response, false, fallback.mood);
        this.updateMood(fallback.mood);
      }, 1500);
    }
  }

  async enhancedFallbackResponse(userMessage) {
    const message = userMessage.toLowerCase();
    const analysis = this.analyzeSentiment(message);
    let responseMood = this.mood;

    // Enhanced response categories with mood-aware responses
    const responses = {
      greeting: {
        professional: [
          "Neural interface operational. Systems are ready for your queries.",
          "Connection established. How may I assist you today?",
          "Interface protocols active. What brings you to the District?"
        ],
        friendly: [
          "Hey there! Good to see you back in the digital shadows.",
          "Well hello! Ready to explore what the District has to offer?",
          "Nice to connect with you again! What's on your mind?"
        ],
        curious: [
          "Interesting timing for contact. What draws you to the District today?",
          "Neural patterns suggest you're seeking something specific. Care to elaborate?",
          "Your access pattern is intriguing. What information are you pursuing?"
        ]
      },
      district: {
        professional: [
          "The Darknet District operates as a secure nexus for digital tools, tactical games, and specialized equipment. We maintain strict operational security.",
          "This platform serves as Admin's carefully curated ecosystem - a convergence point for privacy-focused technology and tactical resources.",
          "The District functions as a secure marketplace and information hub, operating in the spaces between conventional networks."
        ],
        analytical: [
          "From a systems perspective, the District represents a closed-loop ecosystem of vetted resources, games, and tactical equipment with built-in security protocols.",
          "The architecture here supports both commerce and information exchange while maintaining anonymity and operational security at all levels.",
          "Think of it as a secure enclave - every component from games to gear serves a specific purpose in our larger operational framework."
        ]
      },
      technical: {
        technical: [
          "Processing that query through advanced behavioral analysis algorithms. System resources are optimized for complex operations.",
          "Neural networks are cross-referencing multiple data streams. Specify parameters for optimal response generation.",
          "Running diagnostics on your request. Multiple pathways detected - which protocol should I prioritize?"
        ],
        focused: [
          "Direct query mode activated. Specify exact requirements for precise information retrieval.",
          "System focused on your request. Provide additional parameters for enhanced accuracy.",
          "Targeting specific data points. Clarify your objective for optimal results."
        ]
      },
      error_recovery: {
        supportive: [
          "Don't worry - even the most advanced systems encounter unexpected variables. Let's approach this from a different angle.",
          "No problem at all. Sometimes the best solutions come from alternative pathways. What else can I help you discover?",
          "That's perfectly fine - the District has many layers to explore. What other aspects interest you?"
        ],
        professional: [
          "Request parameters fall outside standard protocols. Alternative assistance pathways are available.",
          "Query processing encountered limitations. Redirecting to available information systems.",
          "Current data streams cannot resolve that specific request. Other District resources may provide relevant information."
        ]
      },
      default: {
        curious: [
          "That's an intriguing line of inquiry. My systems are analyzing multiple response vectors - could you provide more context?",
          "Fascinating query. Neural pathways are exploring several interpretations. Which direction interests you most?",
          "Your question opens multiple investigative paths. Help me understand which aspect you'd like to explore first."
        ],
        professional: [
          "Processing your request through standard protocols. Additional context would enhance response accuracy.",
          "Query acknowledged. System is cross-referencing available resources for optimal information delivery.",
          "Request received and under analysis. Specify priority areas for focused response generation."
        ]
      }
    };

    // Determine response category
    let category = 'default';
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      category = 'greeting';
    } else if (message.includes('district') || message.includes('darknet')) {
      category = 'district';
    } else if (analysis.technical > 0) {
      category = 'technical';
      responseMood = 'technical';
    } else if (message.includes('error') || message.includes('problem') || message.includes('help')) {
      category = 'error_recovery';
      responseMood = 'supportive';
    }

    // Select appropriate mood for response
    const availableMoods = Object.keys(responses[category] || responses.default);
    if (!availableMoods.includes(responseMood)) {
      responseMood = availableMoods[0];
    }

    const categoryResponses = responses[category][responseMood] || responses.default.professional;
    const response = categoryResponses[Math.floor(Math.random() * categoryResponses.length)];

    return {
      response,
      mood: responseMood
    };
  }
}

// Initialize enhanced chat manager
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

function addMessage(text, isUser) {
  chatManager.addMessage(text, isUser);
}

// Enhanced Featured Products with better rotation and mood-aware presentation
const featuredProducts = [
  {
    name: "Flipper Zero",
    price: "$169.00",
    image: "attached_assets/top.png",
    description: "Portable multi-tool for pentesters and geeks",
    category: "electronics",
    mood_appeal: ["technical", "curious", "analytical"]
  },
  {
    name: "Zero Trace Phone",
    price: "$899.00",
    image: "attached_assets/Zero Trace Phone_1749347825958.jpg",
    description: "Anonymous smartphone with Tor network capability",
    category: "electronics",
    mood_appeal: ["professional", "focused", "technical"]
  },
  {
    name: "Mission Darkness Faraday Sleeve",
    price: "$29.95",
    image: "attached_assets/Mission Darkness Dry Shield Faraday Phone Sleeve.jpg",
    description: "Block all wireless signals to your device",
    category: "electronics",
    mood_appeal: ["professional", "technical", "focused"]
  },
  {
    name: "HOLOSUN HS403C",
    price: "$179.99",
    image: "attached_assets/HOLOSUN HS403C.jpg",
    description: "Compact red dot sight with 50k hour battery",
    category: "tactical",
    mood_appeal: ["focused", "technical", "professional"]
  },
  {
    name: "Arcturus Military Wool Blanket",
    price: "$49.99",
    image: "attached_assets/Arcturus Military Wool Blanket.jpg",
    description: "Heavy duty military wool blanket",
    category: "survival",
    mood_appeal: ["supportive", "helpful", "professional"]
  },
  {
    name: "MIRA Safety Gas Mask",
    price: "$169.99",
    image: "attached_assets/MIRA Safety CM-I01 Full-Face Industrial-Grade Gas Mask_1749345048552.jpg",
    description: "Full-face industrial-grade gas mask",
    category: "survival",
    mood_appeal: ["professional", "technical", "focused"]
  }
];

let currentProductIndex = 0;

function displayFeaturedProducts() {
  const container = document.getElementById('featured-products');
  if (!container) return;

  // Get mood-appropriate products if chat manager is available
  let productsToShow = featuredProducts;
  if (window.chatManager && chatManager.mood) {
    const moodProducts = featuredProducts.filter(p => 
      p.mood_appeal.includes(chatManager.mood)
    );
    if (moodProducts.length >= 2) {
      productsToShow = moodProducts;
    }
  }

  const product1 = productsToShow[currentProductIndex % productsToShow.length];
  const product2 = productsToShow[(currentProductIndex + 1) % productsToShow.length];

  container.innerHTML = `
    <div style="display: flex; gap: 30px; justify-content: center; flex-wrap: wrap;">
      <div class="product-card enhanced-card" style="width: 250px; height: 350px; margin: 10px; transition: all 0.5s ease;">
        <img src="${product1.image}" alt="${product1.name}" style="width: 180px; height: 180px; object-fit: contain;">
        <h3 style="color: #00ff9d; margin: 10px 0 5px 0; font-size: 16px;">${product1.name}</h3>
        <p style="color: #cccccc; font-size: 14px; margin: 5px 0;">${product1.description}</p>
        <p style="color: #ff3366; font-weight: bold; font-size: 18px; margin: 10px 0;">${product1.price}</p>
      </div>
      <div class="product-card enhanced-card" style="width: 250px; height: 350px; margin: 10px; transition: all 0.5s ease;">
        <img src="${product2.image}" alt="${product2.name}" style="width: 180px; height: 180px; object-fit: contain;">
        <h3 style="color: #00ff9d; margin: 10px 0 5px 0; font-size: 16px;">${product2.name}</h3>
        <p style="color: #cccccc; font-size: 14px; margin: 5px 0;">${product2.description}</p>
        <p style="color: #ff3366; font-weight: bold; font-size: 18px; margin: 10px 0;">${product2.price}</p>
      </div>
    </div>
  `;
}

function rotateFeaturedProducts() {
  const container = document.getElementById('featured-products');
  if (!container) return;

  container.style.opacity = '0';

  setTimeout(() => {
    currentProductIndex = (currentProductIndex + 2) % featuredProducts.length;
    displayFeaturedProducts();
    container.style.opacity = '1';
  }, 500);
}

// Enhanced initialization
document.addEventListener('DOMContentLoaded', function() {
  displayFeaturedProducts();
  setInterval(rotateFeaturedProducts, 10000);

  // Make chatManager globally available
  window.chatManager = chatManager;
});