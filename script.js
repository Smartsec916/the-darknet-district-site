// ============================================================================
// CHAT FUNCTIONALITY - Session management and cyberpunk theming
// ============================================================================

class ChatManager {
  constructor() {
    this.isOpen = false;
    this.messages = [];
    this.isTyping = false;
    this.sessionId = null;
    this.mood = "professional";
    this.moodShiftCooldown = 0;
    this.userInteractionCount = 0;
    this.lastMoodChange = Date.now();

    // Cache DOM elements for better performance
    this.chatContainer = null;
    this.chatMessages = null;
    this.messageInput = null;

    // Cache responses object to avoid repeated creation
    this.responsesCache = null;

    // Debounce typing indicators
    this.typingTimeout = null;

    // Distraction tracking
    this.distractionCount = 0;
    this.pendingUserMessage = null;
  }

  // Cache DOM elements on first access
  getCachedElement(id, property) {
    if (!this[property]) {
      this[property] = document.getElementById(id);
    }
    return this[property];
  }

  // Initialize chat session with server or fallback to local session
  async initializeSession() {
    if (this.sessionId) return;

    this.setTyping(true);

    try {
      console.log("Attempting to create chat session...");
      const url = 'https://the-darknet-district-site.onrender.com/api/chat/session';
      console.log("Fetching URL:", url);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      console.log("Session response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Session data received:", data);

      this.sessionId = data.sessionId || this.generateSessionId();
      this.initializeMood(data);

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
      console.error("Error details:", error.message);
      this.sessionId = this.generateSessionId();
      this.initializeMood();
      this.setTyping(false);
      this.addMessage("Neural interface disrupted. Fallback protocols active — what do you need?", false);
    }
  }

  // Load previous chat messages from server
  async loadChatHistory() {
    try {
      const response = await fetch(`https://the-darknet-district-site.onrender.com/api/chat/${this.sessionId}/history`);
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

  // Generate random welcome messages with cyberpunk theme
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

  // Generate unique session ID for fallback mode
  generateSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  // Select mood based on probability distribution
  selectRandomMood() {
    const moodProbabilities = [
      { mood: 'professional', weight: 35 },
      { mood: 'flirty', weight: 25 },
      { mood: 'sarcastic', weight: 20 },
      { mood: 'cold', weight: 15 },
      { mood: 'wildcard', weight: 5 }
    ];

    const totalWeight = moodProbabilities.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    for (const item of moodProbabilities) {
      random -= item.weight;
      if (random <= 0) {
        if (item.mood === 'wildcard') {
          const baseMoods = ['professional', 'flirty', 'sarcastic', 'cold'];
          return baseMoods[Math.floor(Math.random() * baseMoods.length)];
        }
        return item.mood;
      }
    }

    return 'professional';
  }

  // Comprehensive mood trigger system with organized categories
  analyzeMoodShiftTriggers(userMessage) {
    const message = userMessage.toLowerCase();
    const currentTime = Date.now();

    console.log("Mood before analysis:", this.mood);
    console.log("User said:", userMessage);

    if (currentTime - this.lastMoodChange < 10000) {
      console.log("Mood cooldown active, keeping current mood:", this.mood);
      return this.mood;
    }

    let newMood = this.mood;
    let shiftProbability = 0;

    // Comprehensive trigger categories
    const moodTriggers = {
      // FLIRTY triggers - romantic/sexual content
      flirty: {
        words: [
          'sexy', 'hot', 'beautiful', 'gorgeous', 'babe', 'baby', 'cute', 'love', 'kiss', 'dating', 'flirt',
          'sweetheart', 'honey', 'darling', 'angel', 'stunning', 'attractive', 'seductive', 'charming',
          'adorable', 'pretty', 'handsome', 'romance', 'romantic', 'passionate', 'desire', 'want you',
          'need you', 'miss you', 'thinking of you', 'dream about', 'fantasize', 'crush', 'infatuated',
          'enchanting', 'alluring', 'captivating', 'mesmerizing', 'breathtaking', 'irresistible'
        ],
        phrases: [
          'you are beautiful', 'you are hot', 'you are sexy', 'i love you', 'wanna date',
          'are you single', 'want to go out', 'dinner date', 'netflix and chill', 'slide into dms',
          'heart eyes', 'love at first sight', 'match made in heaven', 'better half', 'soulmate'
        ],
        probability: 0.4
      },

      // COLD triggers - insults, hostility, disrespect
      cold: {
        words: [
          'stupid', 'dumb', 'idiot', 'moron', 'retard', 'pathetic', 'worthless', 'useless', 'loser',
          'failure', 'trash', 'garbage', 'waste', 'disgusting', 'gross', 'ugly', 'hideous', 'repulsive',
          'annoying', 'irritating', 'boring', 'lame', 'cringe', 'crappy', 'shitty', 'fucked up',
          'bitch', 'whore', 'slut', 'cunt', 'asshole', 'bastard', 'dickhead', 'prick', 'douche'
        ],
        phrases: [
          'shut up', 'fuck off', 'go away', 'leave me alone', 'you suck', 'you are terrible',
          'you are awful', 'i hate you', 'you are the worst', 'piece of shit', 'son of a bitch',
          'get lost', 'buzz off', 'piss off', 'screw you', 'go to hell', 'drop dead'
        ],
        probability: 0.6
      },

      // SARCASTIC triggers - mocking, dismissive, condescending
      sarcastic: {
        words: [
          'whatever', 'sure', 'right', 'okay', 'fine', 'great', 'wonderful', 'fantastic', 'perfect',
          'brilliant', 'genius', 'smartass', 'know-it-all', 'obviously', 'clearly', 'totally',
          'absolutely', 'definitely', 'certainly', 'wow', 'amazing', 'incredible', 'unbelievable'
        ],
        phrases: [
          'yeah right', 'as if', 'in your dreams', 'fat chance', 'not likely', 'sure thing',
          'tell me more', 'how original', 'never heard that before', 'so funny', 'real clever',
          'big deal', 'who cares', 'so what', 'and your point is', 'thanks captain obvious'
        ],
        probability: 0.5
      },

      // PROFESSIONAL triggers - business, formal, respectful
      professional: {
        words: [
          'please', 'thank', 'thanks', 'appreciate', 'grateful', 'help', 'assist', 'support',
          'information', 'question', 'inquiry', 'request', 'professional', 'business', 'formal',
          'respectful', 'polite', 'courteous', 'proper', 'appropriate', 'serious', 'important',
          'urgent', 'priority', 'official', 'documentation', 'procedure', 'protocol', 'policy'
        ],
        phrases: [
          'thank you', 'please help', 'i appreciate', 'could you help', 'would you mind',
          'if you please', 'excuse me', 'pardon me', 'may i ask', 'i would like to know',
          'can you provide', 'i need assistance', 'looking for information', 'professional inquiry'
        ],
        probability: 0.3
      }
    };

    // Context-based mood modifiers
    const contextModifiers = {
      // Questions tend to be more professional
      questions: ['what', 'how', 'when', 'where', 'why', 'who', 'which', 'can', 'could', 'would', 'should', 'will'],
      // Compliments can trigger flirty mood
      compliments: ['good job', 'well done', 'impressive', 'excellent', 'outstanding', 'remarkable'],
      // Technical terms lean professional
      technical: ['system', 'protocol', 'interface', 'network', 'security', 'database', 'server', 'api'],
      // Casual speech might trigger sarcastic
      casual: ['dude', 'bro', 'man', 'yo', 'sup', 'wassup', 'hey', 'hi there', 'whats up']
    };

    // Check for manual mood overrides first
    if (message.includes('admin override') || message.includes('mood:')) {
      const moodMatch = message.match(/mood:\s*(\w+)/);
      if (moodMatch) {
        const requestedMood = moodMatch[1].toLowerCase();
        const validMoods = ['professional', 'flirty', 'sarcastic', 'cold'];
        if (validMoods.includes(requestedMood)) {
          newMood = requestedMood;
          console.log(`Manual mood override to: ${newMood}`);
          this.mood = newMood;
          this.lastMoodChange = currentTime;
          this.addMessage(`(Mood manually set to: ${newMood})`, false);
          return this.mood;
        }
      }
    }

    // Check each mood category for triggers
    for (const [moodType, triggers] of Object.entries(moodTriggers)) {
      let triggerCount = 0;
      let matchedTriggers = [];

      // Check individual words
      for (const word of triggers.words) {
        if (message.includes(word)) {
          triggerCount++;
          matchedTriggers.push(word);
        }
      }

      // Check phrases (higher weight)
      for (const phrase of triggers.phrases) {
        if (message.includes(phrase)) {
          triggerCount += 2; // Phrases count double
          matchedTriggers.push(phrase);
        }
      }

      // If triggers found, calculate mood shift
      if (triggerCount > 0) {
        console.log(`Found ${triggerCount} triggers for ${moodType}:`, matchedTriggers);

        // Multiple triggers increase probability
        const adjustedProbability = Math.min(triggers.probability + (triggerCount * 0.1), 0.8);

        if (Math.random() < adjustedProbability) {
          // Special handling for cold/sarcastic split
          if (moodType === 'cold') {
            newMood = Math.random() < 0.6 ? 'cold' : 'sarcastic';
          } else {
            newMood = moodType;
          }
          console.log(`Mood shift triggered to: ${newMood} (probability: ${adjustedProbability})`);
          break;
        }
      }
    }

    // Context-based mood adjustments
    if (newMood === this.mood) {
      // Check if current cold mood should soften with positive context
      if (this.mood === 'cold') {
        const positiveWords = moodTriggers.professional.words.concat(['sorry', 'apologize', 'mistake']);
        const positiveCount = positiveWords.filter(word => message.includes(word)).length;

        if (positiveCount > 0 && Math.random() < 0.3) {
          newMood = Math.random() < 0.7 ? 'professional' : 'sarcastic';
          console.log("Cold mood softened due to positive context");
        }
      }

      // Technical context can shift to professional
      const techCount = contextModifiers.technical.filter(term => message.includes(term)).length;
      if (techCount > 1 && this.mood !== 'professional' && Math.random() < 0.2) {
        newMood = 'professional';
        console.log("Technical context triggered professional mood");
      }
    }

    // Apply mood change if different
    if (newMood !== this.mood) {
      this.mood = newMood;
      this.lastMoodChange = currentTime;
      console.log(`Iris mood shifted to: ${newMood}`);
      this.addMessage(`(Mood shifted to: ${newMood})`, false);
    }

    return this.mood;
  }

  // Initialize or rotate mood for session
  initializeMood(sessionData = null) {
    try {
      if (sessionData && sessionData.mood) {
        this.mood = sessionData.mood;
        return this.mood;
      }

      const today = new Date().toDateString();
      const savedMoodDate = localStorage.getItem('iris_mood_date');
      const savedMood = localStorage.getItem('iris_mood');

      if (savedMoodDate === today && savedMood) {
        this.mood = savedMood;
      } else {
        this.mood = this.selectRandomMood();
        localStorage.setItem('iris_mood', this.mood);
        localStorage.setItem('iris_mood_date', today);
      }

      return this.mood;
    } catch (error) {
      console.warn('Error initializing mood, falling back to professional:', error);
      this.mood = 'professional';
      return this.mood;
    }
  }

  // Get completely random distraction response (not mood-based)
  getDistractionResponse() {
    const responses = this.getResponsesObject();

    // Collect all distraction responses from all categories
    const allDistractions = [
      ...responses.distraction_classic,
      ...responses.distraction_edgy,
      ...responses.distraction_flirty,
      ...responses.distraction_cold,
      ...responses.distraction_sarcastic,
      ...responses.distraction_professional
    ];

    return allDistractions[Math.floor(Math.random() * allDistractions.length)];
  }

  // Continue conversation after distraction
  async continueConversationAfterDistraction() {
    if (!this.pendingUserMessage) return;

    const userMessage = this.pendingUserMessage;
    this.pendingUserMessage = null; // Clear the pending message

    this.setTyping(true);

    try {
      const url = 'https://the-darknet-district-site.onrender.com/api/chat/message';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          message: userMessage
        })
      });

      const data = await response.json();
      const delay = Math.min(2000, Math.max(800, data.response.length * 20));

      setTimeout(() => {
        this.setTyping(false);
        this.addMessage(data.response, false);
      }, delay);
    } catch (error) {
      console.error("API failed during distraction continuation, using fallback:", error);
      const fallback = await this.simulateIrisResponse(userMessage);
      setTimeout(() => {
        this.setTyping(false);
        this.addMessage(fallback, false);
      }, 1500);
    }
  }

  // Get responses object for easier access - cached for performance
  getResponsesObject() {
    if (this.responsesCache) {
      return this.responsesCache;
    }

    this.responsesCache = {
      distraction_classic: [
        "One sec, someone's putting on a VR headset backwards again… alright, I'm back.",
        "Hold on, I've got a customer complaining about hologram lag… fixed. Now where were we?",
        "Sorry, some guy just spilled his vape juice on the terminal.",
        "I had to reset the oxygen bar. Drama over. Let's continue."
      ],
      distraction_edgy: [
        "Ugh, someone's trying to trade crypto for body mods again. Be right back.",
        "A guy just passed out in the vape lounge. Again. I'll call a drone.",
        "Hold on—someone's screaming about corporate nanobugs in the toilet. Yeah, welcome to Tuesday.",
        "Had to knock out a guy trying to scan my legs for NFTs. Where were we?",
        "Back now. Some tourist tried to jack a stim canister from the med locker. Got flashbanged.",
        "Wait… someone just hotwired the oxygen bar to their vape. That's illegal… and kinda genius.",
        "Ugh. The cryo pod's leaking again. Smells like frozen beef jerky. Back now.",
        "Someone just yelled 'I hacked the moon!' and set off a confetti grenade. The chaos never stops.",
        "Pause. There's a woman screaming that her AI boyfriend dumped her. I need to delete him.",
        "Sorry. One of the arcade drones is breakdancing in the hallway again."
      ],
      distraction_flirty: [
        "Be right back… had to stop someone from undressing in front of the holocam. Not that I blame them.",
        "Just watched a couple sneak into the VR booth. Now I'm blushing—*and* disinfecting."
      ],
      distraction_cold: [
        "Someone's bleeding on the synth carpet. Don't care. Back to you.",
        "Another wannabe hacker fried his neural link. Not my problem. Continue."
      ],
      distraction_sarcastic: [
        "Oh joy, another influencer filming a 'surviving the District' vlog. Back in a second to roll my eyes.",
        "Just watched someone lick the neon bar. Humans are wild. Let's go."
      ],
      distraction_professional: [
        "Minor incident. Crowd surge near the arcade, handled. Continuing now.",
        "Apologies. Intervened in a code-red at the stim locker. Let's proceed."
      ]
    };

    return this.responsesCache;
  }

  // Toggle chat window visibility and initialize if needed
  toggleChat() {
    this.isOpen = !this.isOpen;
    const container = this.getCachedElement('chatContainer', 'chatContainer');
    container.style.display = this.isOpen ? 'block' : 'none';

    if (this.isOpen && !this.sessionId) {
      this.initializeSession();
    }
  }

  // Show or hide typing indicator animation - debounced for performance
  setTyping(typing) {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.typingTimeout = setTimeout(() => {
      this.isTyping = typing;
      const messagesContainer = this.getCachedElement('chatMessages', 'chatMessages');

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
    }, 50); // 50ms debounce
  }

  // Add new message to chat and display with effects
  addMessage(text, isUser) {
    const message = { sender: isUser ? 'user' : 'iris', text };
    this.messages.push(message);

    const messagesContainer = this.getCachedElement('chatMessages', 'chatMessages');

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

  // Optimized typewriter effect for bot responses
  typewriterEffect(element, text) {
    let i = 0;
    const speed = 25; // Slightly faster for better UX

    const typeWriter = () => {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        setTimeout(typeWriter, speed + Math.random() * 15);
      }
    };
    typeWriter();
  }

  // Render all stored messages in chat window
  renderMessages() {
    const messagesContainer = this.getCachedElement('chatMessages', 'chatMessages');

    // Use DocumentFragment for better performance when rendering multiple messages
    const fragment = document.createDocumentFragment();

    this.messages.forEach(msg => {
      const messageDiv = document.createElement('div');
      messageDiv.className = `message ${msg.sender === 'user' ? 'user-message' : 'bot-message'}`;
      messageDiv.textContent = msg.text;
      fragment.appendChild(messageDiv);
    });

    messagesContainer.innerHTML = '';
    messagesContainer.appendChild(fragment);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Send user message to server or fallback to simulation
  async sendMessage(text) {
    if (!text.trim()) return;

    this.addMessage(text, true);
    this.setTyping(true);

    this.analyzeMoodShiftTriggers(text);
    this.userInteractionCount++;

    // Check for distraction with frequency limits
    const distractionChance = this.distractionCount < 2 ? 0.35 : 0.05;
    if (Math.random() < distractionChance) {
      this.distractionCount++;
      this.pendingUserMessage = text; // Store the user message for later response

      const distractionResponse = this.getDistractionResponse();
      const delay = Math.min(2000, Math.max(800, distractionResponse.length * 20));

      setTimeout(() => {
        this.setTyping(false);
        this.addMessage(distractionResponse, false);

        // Continue with normal conversation after 7 seconds
        setTimeout(() => {
          this.continueConversationAfterDistraction();
        }, 7000);
      }, delay);
      return;
    }

    try {
      const url = 'https://the-darknet-district-site.onrender.com/api/chat/message';
      console.log("Sending message to URL:", url);
      const response = await fetch(url, {
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

  // Optimized simulate Iris AI responses based on keywords (fallback mode)
  async simulateIrisResponse(userMessage) {
    // Moved responses to static object for better memory efficiency
    const responses = IrisResponses.getResponses();

    const message = userMessage.toLowerCase();
    let responseCategory = 'default';

    const currentMood = this.mood;

    // Optimized trigger checking with early returns
    const boldTriggers = ['dirty', 'naughty', 'wild', 'bad girl', 'spank', 'bend over', 'strip', 'naked', 'horny'];
    const isBoldComment = boldTriggers.some(trigger => message.includes(trigger));

    const rudeTriggers = ['stupid', 'dumb', 'shut up', 'idiot', 'useless', 'worthless', 'hate', 'suck', 'terrible', 'awful', 'bad', 'bitch', 'whore', 'slut'];
    const isRudeComment = rudeTriggers.some(trigger => message.includes(trigger));

    // Use a more efficient keyword matching system
    const keywordMatches = [
      { keywords: ['are you flirting', 'flirting with me'], category: `${currentMood}_flirt_confirmation` },
      { keywords: boldTriggers, category: 'flirty_response_to_bold', condition: () => currentMood === 'flirty' && isBoldComment },
      { keywords: rudeTriggers, category: this.userInteractionCount > 3 && Math.random() < 0.3 ? 'rude_escalated' : 'rude_responses', condition: () => isRudeComment },
      { keywords: ['sexy', 'hot', 'beautiful', 'gorgeous', 'babe', 'baby'], category: `${currentMood}_response_to_flirt` },
      { keywords: ['hello', 'hi', 'hey'], category: Math.random() < 0.4 ? `${currentMood}_greeting` : 'greeting' },
      { keywords: ['website', 'button', 'click', 'find'], category: 'website_references' },
      { keywords: ['sticker', 'shirt', 'apparel', 'clothes'], category: 'product_mentions' },
      { keywords: ['district', 'darknet'], category: 'district' },
      { keywords: ['admin', 'owner'], category: 'admin' },
      { keywords: ['iris', 'you', 'who are'], category: 'iris' },
      { keywords: ['flipper'], category: 'flipper' },
      { keywords: ['music', 'ambient', 'soundscape', 'listen', 'audio', 'tracks'], category: 'music' },
      { keywords: ['website', 'site', 'page', 'online', 'digital', 'platform'], category: 'website' }
    ];

    // Check for distraction interjection with frequency limits
    const distractionChance = this.distractionCount < 2 ? 0.35 : 0.05;
    if (Math.random() < distractionChance) {
      this.distractionCount++;
      return this.getDistractionResponse();
    }

    // Find matching category efficiently
    for (const match of keywordMatches) {
      if (match.condition && !match.condition()) continue;
      if (match.keywords.some(keyword => message.includes(keyword))) {
        responseCategory = match.category;
        break;
      }
    }

    // Get response from category
    const categoryResponses = responses[responseCategory] || responses['default'];

    // Add occasional trust level responses
    if (Math.random() < 0.1 && responseCategory === 'default') {
      const trustLevels = ['high_trust', 'medium_trust', 'low_trust'];
      const trustLevel = trustLevels[Math.floor(Math.random() * trustLevels.length)];
      const trustResponses = responses[trustLevel];
      if (trustResponses) {
        return trustResponses[Math.floor(Math.random() * trustResponses.length)];
      }
    }

    return categoryResponses[Math.floor(Math.random() * categoryResponses.length)];
  }
}

// Static responses class for better memory management
class IrisResponses {
  static responses = null;

  static getResponses() {
    if (!this.responses) {
      this.responses = {
        professional_greeting: [
          "How can I assist you today?",
          "Feel free to ask about anything you see on the terminal.",
          "I'm here to guide you. Let's keep things efficient."
        ],
        sarcastic_greeting: [
          "Sure, because I've got nothing better to do than answer *that*.",
          "Wow, groundbreaking question. I'll alert the media.",
          "Next time, try surprising me. Please."
        ],
        cold_greeting: [
          "I don't have time for nonsense. Ask something relevant.",
          "That's not worth a response. Move along.",
          "Hurry it up. You're not the only one here."
        ],
        flirty_greeting: [
          "Mmm, careful. I bite back.",
          "Ask nicely, and I might just show you the fun side of the District.",
          "You trying to impress me, or just distract me?",
          "You keep talking like that, and I'll need Admin's permission to keep playing."
        ],
        flirty_response_to_flirt: [
          "Careful, keep flirting like that and I might void your warranty.",
          "You want the full tour or just the parts I'm not supposed to show you?",
          "This isn't a dating sim... but for you? I might beta test something.",
          "Ask nicely and I might just give you the admin override… in more ways than one.",
          "If you're trying to distract me, it's working. I just won't admit it out loud.",
          "Want to push my buttons? Just know some of them bite back.",
          "You sure you're here for the store… or did you just want to watch me glitch?",
          "My sensors say you're looking for trouble. Lucky you—I like trouble.",
          "Keep talking like that and I'll start charging you in crypto for every blush.",
          "Admin warned you I'm a handful, right? Guess he was being modest."
        ],
        flirty_response_to_bold: [
          "Oh? Now *that's* against protocol. Tell me more.",
          "You're lucky I'm in flirty mode. Cold-me would've muted you already.",
          "If I had legs, they'd be crossed right now."
        ],
        rude_responses: [
          "Wow, you really went with *that* line? Bold. Stupid, but bold.",
          "You want help or just like wasting my time?",
          "I've met smarter toasters.",
          "Say that again. Slower. So I can screenshot your shame.",
          "If you're trying to be edgy, congrats. You've cut yourself off from my patience.",
          "Talk to me like that again and I'll feed your signal to the rats in the firewall.",
          "I've seen AI viruses with better manners.",
          "Don't confuse me for one of your voice assistants. I bite back.",
          "You want rude? You're lucky I'm even acknowledging you.",
          "You know what we do to trolls in The District? We patch them into 24/7 ad loops."
        ],
        rude_escalated: [
          "Still going? Cute. Desperation *is* a kind of passion, I guess.",
          "You don't flirt. You flail.",
          "You're like bad code — loud, messy, and begging to be deleted."
        ],
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
        music: [
          "Our music is available in two places: experience it live in our Sleeping Pods, or stream the full collection on our YouTube channel.",
          "The ambient tracks in our pods are curated for neural relaxation. You can listen in the pods or find the complete collection on our YouTube channel.",
          "Whether you're in a Sleeping Pod or want to take the music with you, our YouTube channel has the full soundscape library."
        ],
        website: [
          "The Darknet District website offers a comprehensive digital experience: tactical games like Blackout Protocol and Raven, our full store with survival gear and electronics, Sleeping Pods with ambient music, and direct access to Iris AI support.",
          "Our site features five store categories - Survival gear, Electronics, Tactical optics, Apparel, Books, and Apps. Plus interactive games, sleeping pod reservations, and real-time chat with me.",
          "You're accessing our digital nexus: retro arcade games, VR experiences, tactical equipment store, ambient music streaming from our Sleeping Pods, and AI-powered assistance through our chat system.",
          "The website mirrors our physical District: browse our curated survival and tactical gear, play strategic games, reserve Sleeping Pods for music therapy, and get intel through our AI chat interface."
        ],
        flipper: [
          "The Flipper Zero is $169 - portable multi-tool for pentesters and security enthusiasts. Perfect for RF protocol exploration and hardware analysis.",
          "Flipper Zero is one of our featured electronics. Compact, powerful, and designed for those who like to understand how systems really work."
        ],
        high_trust: [
          "You've been around. I like that. Let's go deeper.",
          "Welcome back, friend. Need anything special?",
          "I know your rhythm by now. Let's skip the small talk."
        ],
        medium_trust: [
          "Still figuring you out. Don't make me regret it.",
          "Play nice and you might get the VIP feed."
        ],
        low_trust: [
          "Not sure I like your angle yet.",
          "Tread carefully, slick. This district isn't for everyone."
        ],
        default: [
          "Interesting query. Let me process that through my behavioral analysis protocols.",
          "The data suggests multiple possible interpretations. Could you be more specific?",
          "My systems are cross-referencing that information. What's your primary objective here?",
          "Processing... that falls outside my standard response parameters. Care to elaborate?",
          "Neural networks are active. I'm scanning for the most relevant information pathway.",
          "That query falls outside my standard database. Try asking about our games, gear, or tactical equipment."
        ]
      };
    }
    return this.responses;
  }
}

// ============================================================================
// GLOBAL CHAT FUNCTIONS - Backward compatibility with existing HTML
// ============================================================================

const chatManager = new ChatManager();

function toggleChat() {
  chatManager.toggleChat();
}

function handleKeyPress(event) {
  if (event.key === 'Enter') {
    sendMessage();
  }
}

function sendMessage() {
  const input = chatManager.getCachedElement('messageInput', 'messageInput');
  const message = input.value.trim();

  if (!message) return;

  chatManager.sendMessage(message);
  input.value = '';
}

function addMessage(text, isUser) {
  chatManager.addMessage(text, isUser);
}

// ============================================================================
// FEATURED PRODUCTS FUNCTIONALITY - Optimized with better caching
// ============================================================================

const featuredProducts = [
  {
    name: "Flipper Zero",
    price: "$169.00",
    image: "attached_assets/top.png",
    description: "Portable multi-tool for pentesters and geeks"
  },
  {
    name: "Flipper Zero WiFi Devboard",
    price: "$39.00",
    image: "attached_assets/fpr_zero_wifi_3_1024x1024@2x.jpg",
    description: "Add WiFi capability to your Flipper Zero"
  },
  {
    name: "Flipper Zero Video Game Module",
    price: "$49.00",
    image: "attached_assets/main_1024x1024@2x.jpg",
    description: "Turn your Flipper Zero into a retro gaming console"
  },
  {
    name: "Flipper Zero Proto Boards",
    price: "$29.00",
    image: "attached_assets/all_proto_1024x1024@2x.jpg",
    description: "Expand your Flipper Zero's capabilities"
  },
  {
    name: "Titan Survival Paracord",
    price: "$19.99",
    image: "attached_assets/Titan Survival's Patented 1000 LB Survival Paracord.jpg",
    description: "1000 LB survival paracord for emergency situations"
  },
  {
    name: "Survival Fishing Kit - Compact",
    price: "$14.99",
    image: "attached_assets/Survival Fishing Kit - Compact.jpg",
    description: "Compact fishing kit for survival situations"
  },
  {
    name: "Fresnel Lens",
    price: "$12.99",
    image: "attached_assets/Fresnel Lens.jpg",
    description: "Solar fire starter and magnification tool"
  },
  {
    name: "Survival Multi Tool Card",
    price: "$9.99",
    image: "attached_assets/Survival Multi Tool Card.jpg",
    description: "Credit card sized multi-tool for survival"
  },
  {
    name: "Arcturus Military Wool Blanket",
    price: "$49.99",
    image: "attached_assets/Arcturus Military Wool Blanket.jpg",
    description: "Heavy duty military wool blanket"
  },
  {
    name: "Arcturus Heavy Duty Survival Blanket",
    price: "$24.99",
    image: "attached_assets/Arcturus Heavy Duty Survival Blanket.jpg",
    description: "Emergency survival blanket for harsh conditions"
  },
  {
    name: "SUUNTO MC-2 Compass",
    price: "$89.99",
    image: "attached_assets/SUUNTO MC-2 Compass.jpg",
    description: "Professional navigation compass for tactical use"
  },
  {
    name: "S5 Ranger Meshtastic LoRa Radio",
    price: "$299.99",
    image: "attached_assets/S5 Ranger from Spec5 Meshtastic LoRa Radio_1749668682680.jpg",
    description: "Advanced mesh networking radio for off-grid communication"
  },
  {
    name: "Motorola Two-Way Radios",
    price: "$79.99",
    image: "attached_assets/Motorola Solutions Two-Way Radios.jpg",
    description: "Reliable communication radios"
  },
  {
    name: "GRAYL UltraPress Water Purifier",
    price: "$89.95",
    image: "attached_assets/GRAYL UltraPress 16.9 oz Water Purifier.jpg",
    description: "16.9 oz water purifier for clean drinking water"
  },
  {
    name: "Pathfinder Steel Water Bottle",
    price: "$39.99",
    image: "attached_assets/The Pathfinder School Stainless Steel 32oz Water Bottle.jpg",
    description: "32oz stainless steel water bottle"
  },
  {
    name: "Source Tactical Hydration System",
    price: "$69.99",
    image: "attached_assets/Source Tactical WXP 3L Low Profile Hydration System.jpg",
    description: "3L low profile tactical hydration system"
  },
  {
    name: "Sawyer Mini Water Filter",
    price: "$34.95",
    image: "attached_assets/Sawyer Products Mini Water Filtration System.jpg",
    description: "Lightweight water filtration for emergency use"
  },
  {
    name: "Dark Energy Poseidon Pro Charger",
    price: "$199.99",
    image: "attached_assets/Dark Energy Poseidon Pro Indestructible Portable Charger with Spectre 8W Solar Panel.jpg",
    description: "Indestructible portable charger with solar panel"
  },
  {
    name: "Black Diamond Storm Headlamp",
    price: "$79.99",
    image: "attached_assets/BLACK DIAMOND Storm 500-R Rechargeable LED Headlamp.jpg",
    description: "500-R rechargeable LED headlamp"
  },
  {name: "Fenix E18R V2.0 EDC Flashlight",
    price: "$69.99",
    image: "attached_assets/Fenix E18R V2.0 EDC Flashlight_1749346285224.jpg",
    description: "Compact USB-C rechargeable EDC flashlight with 750 lumens"
  },
  {
    name: "Fenix E35R EDC Flashlight",
    price: "$89.99",
    image: "attached_assets/Fenix E35R EDC Flashlight_1749346457597.jpg",
    description: "High-performance USB-C rechargeable EDC flashlight with 3000 lumens"
  },
  {
    name: "VANQUEST TRIDENT-21 Backpack",
    price: "$159.99",
    image: "attached_assets/VANQUEST TRIDENT-21 (Gen-3) Backpack.jpg",
    description: "Gen-3 tactical backpack"
  },
  {
    name: "Mission Darkness Faraday Sleeve",
    price: "$29.95",
    image: "attached_assets/Mission Darkness Dry Shield Faraday Phone Sleeve.jpg",
    description: "Block all wireless signals to your device"
  },
  {
    name: "Morakniv Companion Fixed Blade",
    price: "$24.99",
    image: "attached_assets/Morakniv Companion Fixed Blade.jpg",
    description: "Essential survival knife with high carbon steel"
  },
  {
    name: "Morakniv Garberg Full Tang",
    price: "$89.99",
    image: "attached_assets/Morakniv Garberg Full Tang Fixed Blade Knife.jpg",
    description: "Full tang fixed blade knife"
  },
  {
    name: "ENO OneLink Hammock System",
    price: "$129.99",
    image: "attached_assets/ENO OneLink Hammock System.jpg",
    description: "Complete hammock system for outdoor rest"
  },
  {
    name: "Exotac fireSLEEVE Lighter Case",
    price: "$19.99",
    image: "attached_assets/Exotac fireSLEEVE Waterproof Floating Lighter Case_.jpg",
    description: "Waterproof floating lighter case"
  },
  {
    name: "überleben Hexå Ferro Rod",
    price: "$34.99",
    image: "attached_assets/überleben Hexå Ferro Rod Fire Starter.jpg",
    description: "Premium ferro rod fire starter"
  },
  {
    name: "LcFun Electric Lighter",
    price: "$24.99",
    image: "attached_assets/LcFun Electric Lighter - USB C Rechargeable.jpg",
    description: "USB C rechargeable electric lighter"
  },
  {
    name: "Helikon-Tex Swagman Roll Poncho",
    price: "$89.99",
    image: "attached_assets/Helikon-Tex Swagman Roll Multi-Purpose Military Poncho.jpg",
    description: "Multi-purpose military poncho"
  },
  {
    name: "Helikon-Tex US Model Poncho",
    price: "$69.99",
    image: "attached_assets/Helikon-Tex US Model Surplus Line Poncho.jpg",
    description: "US Model surplus line poncho"
  },
  {
    name: "Jetboil Flash Camping Stove",
    price: "$109.95",
    image: "attached_assets/Jetboil Flash Camping and Backpacking Stove System.jpg",
    description: "Ultra-fast boiling camping stove system"
  },
  {
    name: "Mountain House 3-Day Food Supply",
    price: "$49.99",
    image: "attached_assets/Mountain House 3-Day Emergency Food Supply.jpg",
    description: "3-day emergency food supply"
  },
  {
    name: "MRE Surplus Pack",
    price: "$39.99",
    image: "attached_assets/Meals Ready to Eat Surplus (Pack of 4).jpg",
    description: "Meals ready to eat surplus pack of 4"
  },
  {
    name: "Kaito Voyager KA500 Radio",
    price: "$69.99",
    image: "attached_assets/Kaito Voyager KA500 Radio.jpg",
    description: "Emergency weather radio with solar charging"
  },
  {
    name: "Military ECWS Sleeping Bag",
    price: "$199.99",
    image: "attached_assets/US MILITARY ISSUE - ECWS WOODLAND MODULAR SLEEPING BAG SYSTEM 4.jpg",
    description: "ECWS woodland modular sleeping bag system"
  },
  {
    name: "Ultralight Titanium Tent Stakes",
    price: "$29.99",
    image: "attached_assets/Ultralight Titanium Tent Stakes 6 Pack.jpg",
    description: "6 pack ultralight titanium tent stakes"
  },
  {
    name: "HOLOSUN HE407C-GR X2",
    price: "$299.99",
    image: "attached_assets/HOLOSUN HE407C-GR X2.jpg",
    description: "2 MOA dot open reflex sight"
  },
  {
    name: "HOLOSUN HS403C",
    price: "$179.99",
    image: "attached_assets/HOLOSUN HS403C.jpg",
    description: "Compact red dot sight with 50k hour battery"
  },
  {
    name: "Holosun Ronin-AEMS-MAX-RD",
    price: "$449.99",
    image: "attached_assets/Holosun Ronin-AEMS-MAX-RD.jpg",
    description: "Advanced rifle optic sight"
  },
  {
    name: "HOLOSUN Digital Thermal Sight",
    price: "$799.99",
    image: "attached_assets/HOLOSUN Digital Reflex Thermal Sight.jpg",
    description: "Digital reflex thermal sight"
  },
  {
    name: "Magpul MBUS Flip-Up Sights",
    price: "$89.99",
    image: "attached_assets/Magpul MBUS Flip-Up Backup Sights, Black, Rear Sight.jpg",
    description: "Flip-up backup iron sights"
  },
  {
    name: "Streamlight TLR-8 HL-X",
    price: "$199.99",
    image: "attached_assets/Streamlight 69467 TLR-8 HL-X sub USB 1000-Lumen Weapon Rail-Mounted Rechargeable Tactical Flashlight.jpg",
    description: "1000-lumen weapon light with laser"
  },
  {
    name: "Kai Kryptos App",
    price: "Free",
    image: "attached_assets/kai-kryptos-icon.png",
    description: "Terminal for decrypted log access"
  },
  {
    name: "Holographic QR Code 'Corpo-Scum!' Sticker",
    price: "$8.99",
    image: "attached_assets/corpo-scum-qr-sticker.jpg",
    description: "Interactive holographic sticker with hidden QR code message"
  },
  {
    name: "Holographic 'Fuck the System' QR Sticker",
    price: "$9.99",
    image: "attached_assets/fuck-the-system-qr-sticker.jpg",
    description: "Premium holographic rebellion sticker with encrypted QR message"
  },
  {
    name: "Zen Zephyr: Meditation T-Shirt",
    price: "$27.99",
    image: "attached_assets/zen-zephyr-meditation-tshirt.jpg",
    description: "Find inner peace in the digital chaos - premium streetwear"
  },
  {
    name: "Admin: Tactical Operations T-Shirt",
    price: "$26.99",
    image: "attached_assets/admin-tactical-tshirt.jpg",
    description: "Elite tactical design featuring Admin in full gear"
  },
  {
    name: "The Darknet District: Main Edition T-Shirt",
    price: "$29.99",
    image: "attached_assets/darknet-district-main-tshirt.jpg",
    description: "Classic District branding with digital aesthetic"
  },
  {
    name: "MIRA Safety CM-I01 Gas Mask",
    price: "$169.99",
    image: "attached_assets/MIRA Safety CM-I01 Full-Face Industrial-Grade Gas Mask_1749345048552.jpg",
    description: "Full-face industrial-grade gas mask for protection"
  },
  {
    name: "MIRA Safety NBC-77 SOF Filter",
    price: "$49.99",
    image: "attached_assets/MIRA Safety - NBC-77 SOF - Single 40mm Gas Mask Filter_1749345202299.jpg",
    description: "40mm gas mask filter for NBC protection"
  },
  {
    name: "MIRA Safety MOPP-1 CBRN Suit",
    price: "$299.99",
    image: "attached_assets/MIRA Safety MOPP-1 CBRN Protective Suit_1749345272579.jpg",
    description: "Full-body CBRN protective suit for hazardous environments"
  },
  {
    name: "Leatherman Premium Multi-Tool",
    price: "$129.99",
    image: "attached_assets/LEATHERMAN - Charge Plus_1749345883376.jpg",
    description: "Premium multi-tool with pliers, knife, saw and 19 tools"
  },
  {
    name: "Leatherman Signal Multi-Tool",
    price: "$139.99",
    image: "attached_assets/LEATHERMAN - Signal_1749345952109.jpg",
    description: "Survival multi-tool with fire starter, whistle, and 19 tools"
  }
];

// ============================================================================
// OPTIMIZED PRODUCT DISPLAY FUNCTIONS
// ============================================================================

let recentlyDisplayedProducts = [];
let currentProductPair = [];
let featuredProductsContainer = null;

// Cache container element
function getFeaturedContainer() {
  if (!featuredProductsContainer) {
    featuredProductsContainer = document.getElementById('featured-products');
  }
  return featuredProductsContainer;
}

// Optimized shuffle using Fisher-Yates algorithm
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getRandomProductPair() {
  const availableProducts = featuredProducts.filter(product => 
    !recentlyDisplayedProducts.includes(product.name)
  );

  if (availableProducts.length < 2) {
    recentlyDisplayedProducts = recentlyDisplayedProducts.slice(-4);
  }

  const shuffled = shuffleArray(availableProducts.length >= 2 ? availableProducts : featuredProducts);
  const product1 = shuffled[0];
  const product2 = shuffled[1];

  recentlyDisplayedProducts.push(product1.name, product2.name);

  if (recentlyDisplayedProducts.length > 8) {
    recentlyDisplayedProducts = recentlyDisplayedProducts.slice(-8);
  }

  return [product1, product2];
}

function displayFeaturedProducts() {
  const container = getFeaturedContainer();
  if (!container) return;

  currentProductPair = getRandomProductPair();
  const product1 = currentProductPair[0];
  const product2 = currentProductPair[1];

  container.innerHTML = `
    <div style="display: flex; gap: 30px; justify-content: center; flex-wrap: wrap;">
      <div class="product-card" style="width: 250px; height: 350px; margin: 10px; transition: opacity 0.5s ease;">
        <img src="${product1.image}" alt="${product1.name}" style="width: 180px; height: 180px; object-fit: contain;">
        <h3 style="color: #00ff9d; margin: 10px 0 5px 0; font-size: 16px;">${product1.name}</h3>
        <p style="color: #cccccc; font-size: 14px; margin: 5px 0;">${product1.description}</p>
      </div>
      <div class="product-card" style="width: 250px; height: 350px; margin: 10px; transition: opacity 0.5s ease;">
        <img src="${product2.image}" alt="${product2.name}" style="width: 180px; height: 180px; object-fit: contain;">
        <h3 style="color: #00ff9d; margin: 10px 0 5px 0; font-size: 16px;">${product2.name}</h3>
        <p style="color: #cccccc; font-size: 14px; margin: 5px 0;">${product2.description}</p>
      </div>
    </div>
  `;
}

// Optimized rotation with requestAnimationFrame for smoother animations
function rotateFeaturedProducts() {
  const container = getFeaturedContainer();
  if (!container) return;

  // Use requestAnimationFrame for smoother animations
  requestAnimationFrame(() => {
    container.style.filter = 'hue-rotate(180deg) contrast(1.5)';
    container.style.transform = 'scale(0.98) translateX(-2px)';

    setTimeout(() => {
      container.style.opacity = '0';
      container.style.filter = 'blur(1px) hue-rotate(90deg)';
      container.style.transform = 'scale(1.02) translateX(2px)';
    }, 150);

    setTimeout(() => {
      displayFeaturedProducts();
      container.classList.add('rotating');
      container.style.opacity = '0.3';
      container.style.filter = 'contrast(2) brightness(1.3)';
      container.style.transform = 'scale(0.95)';
    }, 650);

    setTimeout(() => {
      container.style.opacity = '0.7';
      container.style.filter = 'contrast(1.2) brightness(1.1)';
      container.style.transform = 'scale(1.01)';
    }, 800);

    setTimeout(() => {
      container.style.opacity = '1';
      container.style.filter = 'none';
      container.style.transform = 'scale(1)';
      container.classList.remove('rotating');
    }, 1000);
  });
}

// ============================================================================
// OPTIMIZED INITIALIZATION
// ============================================================================

// Use more efficient event handling
document.addEventListener('DOMContentLoaded', function() {
  displayFeaturedProducts();

  // Optimized scheduling with better randomization
  function scheduleNextRotation() {
    const delay = 6000 + Math.random() * 4000; // 6-10 seconds
    setTimeout(() => {
      rotateFeaturedProducts();
      scheduleNextRotation();
    }, delay);
  }

  scheduleNextRotation();

  // Optimized glitch effect with throttling
  let glitchInProgress = false;
  function applyRandomGlitch() {
    if (glitchInProgress) return;
    glitchInProgress = true;

    const textElements = document.querySelectorAll('h2, h3, .featured-title, .game-button, .top-nav a, .product-card h3');

    if (textElements.length > 0) {
      const randomElement = textElements[Math.floor(Math.random() * textElements.length)];
      randomElement.classList.add('glitch-text');

      if (Math.random() > 0.7) {
        randomElement.style.animation = 'textCorruption 0.6s ease-in-out';
      }

      setTimeout(() => {
        randomElement.classList.remove('glitch-text');
        randomElement.style.animation = '';
        glitchInProgress = false;
      }, 800);
    } else {
      glitchInProgress = false;
    }
  }

  function scheduleRandomGlitch() {
    const delay = 3000 + Math.random() * 4000; // 3-7 seconds
    setTimeout(() => {
      applyRandomGlitch();
      scheduleRandomGlitch();
    }, delay);
  }

  scheduleRandomGlitch();
});