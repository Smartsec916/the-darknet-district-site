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
    this.moodShiftCooldown = 0; // Prevent rapid mood changes
    this.userInteractionCount = 0;
    this.lastMoodChange = Date.now();
  }


  // Initialize chat session with server or fallback to local session
  async initializeSession() {
    if (this.sessionId) return;

    this.setTyping(true);

    try {
      console.log("Attempting to create chat session...");
      // Use relative URL for better compatibility with Replit
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

      // Show welcome message for new sessions
      if (data.isNew || !data.sessionId) {
        const welcomeMessage = await this.fetchWelcomeMessage();
        setTimeout(() => {
          this.addMessage(welcomeMessage, false);
          this.setTyping(false);
        }, 1500);
      } else {
        // Load existing chat history for returning sessions
        await this.loadChatHistory();
      }
    } catch (error) {
      console.error("Error initializing chat session:", error);
      console.error("Error details:", error.message);
      // Fallback to local session with error message
      this.sessionId = this.generateSessionId();
      this.initializeMood(); // Initialize mood for fallback session
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
      { mood: 'wildcard', weight: 5 } // For future experimental moods
    ];

    const totalWeight = moodProbabilities.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    for (const item of moodProbabilities) {
      random -= item.weight;
      if (random <= 0) {
        // Handle wildcard mood - currently maps to random existing mood
        if (item.mood === 'wildcard') {
          const baseMoods = ['professional', 'flirty', 'sarcastic', 'cold'];
          return baseMoods[Math.floor(Math.random() * baseMoods.length)];
        }
        return item.mood;
      }
    }

    // Fallback to professional if calculation fails
    return 'professional';
  }

  // Analyze user message for mood shift triggers
  analyzeMoodShiftTriggers(userMessage) {
    const message = userMessage.toLowerCase();
    const currentTime = Date.now();

    // Prevent rapid mood shifts (minimum 30 seconds between changes)
    if (currentTime - this.lastMoodChange < 30000) {
      return this.mood;
    }

    let newMood = this.mood;
    let shiftProbability = 0;

    // Flirtation triggers → +40% chance of switching to Flirty
    const flirtTriggers = ['sexy', 'hot', 'beautiful', 'gorgeous', 'babe', 'baby', 'cute', 'love', 'kiss', 'dating', 'flirt'];
    if (flirtTriggers.some(trigger => message.includes(trigger))) {
      shiftProbability = 0.4;
      if (Math.random() < shiftProbability) {
        newMood = 'flirty';
      }
    }

    // Rudeness triggers → +60% chance of switching to Cold or Sarcastic
    const rudeTriggers = ['stupid', 'dumb', 'shut up', 'idiot', 'useless', 'worthless', 'hate', 'suck', 'terrible', 'awful', 'bad'];
    if (rudeTriggers.some(trigger => message.includes(trigger))) {
      shiftProbability = 0.6;
      if (Math.random() < shiftProbability) {
        newMood = Math.random() < 0.5 ? 'cold' : 'sarcastic';
      }
    }

    // Positive interaction triggers → slight chance to shift to professional or flirty
    const positiveTriggers = ['thank', 'please', 'help', 'amazing', 'great', 'awesome', 'cool', 'nice'];
    if (positiveTriggers.some(trigger => message.includes(trigger)) && this.mood === 'cold') {
      shiftProbability = 0.3;
      if (Math.random() < shiftProbability) {
        newMood = Math.random() < 0.7 ? 'professional' : 'flirty';
      }
    }

    // Admin override check (future implementation)
    if (message.includes('admin override') || message.includes('mood:')) {
      const moodMatch = message.match(/mood:\s*(\w+)/);
      if (moodMatch) {
        const requestedMood = moodMatch[1].toLowerCase();
        const validMoods = ['professional', 'flirty', 'sarcastic', 'cold'];
        if (validMoods.includes(requestedMood)) {
          newMood = requestedMood;
        }
      }
    }

    // Update mood if changed
    if (newMood !== this.mood) {
      this.mood = newMood;
      this.lastMoodChange = currentTime;
      console.log(`Iris mood shifted to: ${newMood}`);
    }

    return this.mood;
  }

  // Initialize or rotate mood for session
  initializeMood(sessionData = null) {
    try {
      // If session data includes mood, use it
      if (sessionData && sessionData.mood) {
        this.mood = sessionData.mood;
        return this.mood;
      }

      // Check if we should rotate daily mood (could be enhanced with localStorage)
      const today = new Date().toDateString();
      const savedMoodDate = localStorage.getItem('iris_mood_date');
      const savedMood = localStorage.getItem('iris_mood');

      // If same day and mood exists, use saved mood
      if (savedMoodDate === today && savedMood) {
        this.mood = savedMood;
      } else {
        // New day or no saved mood - select random mood
        this.mood = this.selectRandomMood();
        localStorage.setItem('iris_mood', this.mood);
        localStorage.setItem('iris_mood_date', today);
      }

      return this.mood;
    } catch (error) {
      // Fallback to professional if localStorage fails or other errors
      console.warn('Error initializing mood, falling back to professional:', error);
      this.mood = 'professional';
      return this.mood;
    }
  }

  // Get distraction response based on current mood
  getDistractionResponse() {
    const responses = this.getResponsesObject();

    // 60% chance for mood-specific distraction, 40% for general
    const useMoodSpecific = Math.random() < 0.6;

    if (useMoodSpecific) {
      const moodDistraction = responses[`distraction_${this.mood}`];
      if (moodDistraction && moodDistraction.length > 0) {
        return moodDistraction[Math.floor(Math.random() * moodDistraction.length)];
      }
    }

    // Fallback to classic or edgy distractions (50/50 split)
    const useEdgy = Math.random() < 0.5;
    const distractionType = useEdgy ? 'distraction_edgy' : 'distraction_classic';
    const distractions = responses[distractionType];

    return distractions[Math.floor(Math.random() * distractions.length)];
  }

  // Get responses object for easier access
  getResponsesObject() {
    return {
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
  }

  // Toggle chat window visibility and initialize if needed
  toggleChat() {
    this.isOpen = !this.isOpen;
    const container = document.getElementById('chatContainer');
    container.style.display = this.isOpen ? 'block' : 'none';

    if (this.isOpen && !this.sessionId) {
      this.initializeSession();
    }
  }

  // Show or hide typing indicator animation
  setTyping(typing) {
    this.isTyping = typing;
    const messagesContainer = document.getElementById('chatMessages');

    // Remove existing typing indicator
    const existingIndicator = messagesContainer.querySelector('.typing-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }

    // Add new typing indicator if needed
    if (typing) {
      const typingDiv = document.createElement('div');
      typingDiv.className = 'message bot-message typing-indicator';
      typingDiv.innerHTML = '<span class="typing-dots">●●●</span>';
      messagesContainer.appendChild(typingDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  // Add new message to chat and display with effects
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

    // Apply typewriter effect for bot messages
    if (isUser) {
      messageDiv.textContent = text;
    } else {
      this.typewriterEffect(messageDiv, text);
    }

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // Typewriter effect for bot responses
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

  // Render all stored messages in chat window
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

  // Send user message to server or fallback to simulation
  async sendMessage(text) {
    if (!text.trim()) return;

    this.addMessage(text, true);
    this.setTyping(true);

    // Analyze message for mood shift triggers
    this.analyzeMoodShiftTriggers(text);
    this.userInteractionCount++;

    try {
      // Use relative URL for better compatibility with Replit
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
      // Use local simulation when server is unavailable
      const fallback = await this.simulateIrisResponse(text);
      setTimeout(() => {
        this.setTyping(false);
        this.addMessage(fallback, false);
      }, 1500);
    }
  }

  // Simulate Iris AI responses based on keywords (fallback mode)
  async simulateIrisResponse(userMessage) {
    // Predefined response categories for different topics
    const responses = {
      // Mood-based responses
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

      // Trust level responses
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

      // Physical distraction interjections
      distraction: [
        "One sec, someone's putting on a VR headset backwards again… alright, I'm back.",
        "Hold on, I've got a customer complaining about hologram lag… fixed. Now where were we?",
        "Sorry, some guy just spilled his vape juice on the terminal.",
        "I had to reset the oxygen bar. Drama over. Let's continue."
      ],

      // Flirty responses to user advances
      flirty_response_to_flirt: [
        "You talk a good game. Want me to play too?"
      ],
      cold_response_to_flirt: [
        "Save it for someone who cares."
      ],
      sarcastic_response_to_flirt: [
        "Wow. You're about as subtle as a data breach."
      ],
      professional_response_to_flirt: [
        "Inappropriate. Let's keep this functional."
      ],

      // Responses to "Are you flirting with me?"
      flirty_flirt_confirmation: [
        "You started it. I'm just keeping the tempo."
      ],
      cold_flirt_confirmation: [
        "That's not in my protocols… but it's not *off* them either."
      ],
      sarcastic_flirt_confirmation: [
        "If I were, you'd be blushing harder."
      ],
      professional_flirt_confirmation: [
        "I'm here to assist, not entertain fantasies."
      ],

      // Website/feature references
      website_references: [
        "You'll find that on the main terminal.",
        "There's a button nearby that opens a deeper channel—click it.",
        "I'd check the next section over. It hums with encrypted secrets.",
        "Want the game? You'll need to look for the glowing icon. Can't miss it."
      ],

      // Product mentions
      product_mentions: [
        "If you're looking for something loud, the *Corpo-Scum!* sticker screams rebellion. Literally.",
        "Our t-shirts? Tailored for revolutionaries. Tap the apparel terminal."
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
      flipper: [
        "The Flipper Zero is $169 - portable multi-tool for pentesters and security enthusiasts. Perfect for RF protocol exploration and hardware analysis.",
        "Flipper Zero is one of our featured electronics. Compact, powerful, and designed for those who like to understand how systems really work."
      ],
      faraday: [
        "Mission Darkness Faraday sleeves are $29.95 - they block all wireless signals to your device when digital privacy is critical.",
        "Our Faraday gear ensures your devices stay dark when needed. Essential for operational security in hostile environments."
      ],
      optics: [
        "Holosun HS403C is $179.99 - compact red dot with 50k hour battery life. We also carry thermal sights and advanced optics.",
        "Our optics section features Holosun red dots, thermal sights, and Magpul backup systems. Quality glass for serious applications."
      ],
      games: [
        "We have Blackout Protocol, Raven, Star Citizen integration, and other tactical games. Each designed to sharpen strategic thinking.",
        "Blackout Protocol is our cyberpunk tactical game, Raven focuses on strategic thriller scenarios. Both test decision-making under pressure."
      ],
      store: [
        "Our store has five categories: Survival gear, Electronics, Tactical/Optics, Apparel, Books, and Apps. Everything curated for quality.",
        "We carry survival equipment, tactical electronics, quality optics, cyberpunk apparel, and specialized apps. All vetted by Admin personally."
      ],
      contact: [
        "Need to reach us directly? Hit the Contact button for our email: thedarknetdistrict@gmail.com. We monitor all channels.",
        "Direct comms available through our Contact button—it's the fastest way to reach Admin or me."
      ],
      facebook: [
        "Check our Facebook page for District news and updates. The Facebook button will take you there.",
        "Want the latest intel? Our Facebook page has all the current ops and announcements."
      ],
      youtube: [
        "Our YouTube channel features the ambient music from our Sleeping Pods. Perfect for digital meditation.",
        "The YouTube button takes you to our curated soundscape collection—same tracks that play in the pods.",
        "All our cyberpunk ambient music is available on YouTube. Same high-quality tracks you'll hear in the pods."
      ],
      music: [
        "Our music is available in two places: experience it live in our Sleeping Pods, or stream the full collection on our YouTube channel.",
        "The ambient tracks in our pods are curated for neural relaxation. You can listen in the pods or find the complete collection on YouTube.",
        "Whether you're in a Sleeping Pod or want to take the music with you, our YouTube channel has the full cyberpunk soundscape library."
      ],
      social: [
        "We're active on Facebook for news and YouTube for our pod music. Both buttons are available on our About page.",
        "Stay connected: Facebook for updates, YouTube for ambient soundscapes, Contact for direct communication."
      ],
      website: [
        "The Darknet District website offers a comprehensive digital experience: tactical games like Blackout Protocol and Raven, our full store with survival gear and electronics, Sleeping Pods with cyberpunk ambient music, and direct access to Iris AI support.",
        "Our site features five store categories - Survival gear, Electronics, Tactical optics, Apparel, Books, and Apps. Plus interactive games, sleeping pod reservations, and real-time chat with me.",
        "You're accessing our digital nexus: retro arcade games, VR experiences, tactical equipment store, ambient music streaming from our Sleeping Pods, and AI-powered assistance through our chat system.",
        "The website mirrors our physical District: browse our curated survival and tactical gear, play strategic games, reserve Sleeping Pods for music therapy, and get intel through our AI chat interface."
      ],
      survival: [
        "Our survival section is fully stocked with field-tested gear. We have everything from Titan's 1000 LB paracord with hidden Kevlar filaments to Morakniv blades and Jetboil stoves.",
        "Survival gear includes water purification (GRAYL UltraPress, Sawyer Mini), fire starting (überleben ferro rods, electric lighters), shelter (Arcturus blankets, ENO hammocks), and emergency food (Mountain House, MREs).",
        "From compact fishing kits to ECWS military sleeping systems, our survival inventory is curated for operators who don't trust luck."
      ],
      sleeping: [
        "Sleeping pods offer secure rest spaces within the District. Reserve one when you need downtime between operations.",
        "Our pods provide high-tech sanctuary space - perfect for recharging while maintaining security protocols."
      ],
      // Specific survival product categories
      paracord: [
        "Titan Survival's 1000 LB paracord is street-tough with Kevlar filament, fire-starting tinder, and fishing line hidden inside. For operators who don't trust luck."
      ],
      fishing: [
        "We carry both compact and standard survival fishing kits. The compact version fits in city drains or bug-out rigs, while the standard has more line and hooks for serious off-grid fishing."
      ],
      fire: [
        "Fire starting gear includes Fresnel lens credit-card firestarters, überleben Hexå ferro rods with aluminum casing, and LcFun electric USB-C arc lighters. No propane, no compromise."
      ],
      tools: [
        "Multi-tools range from wallet-sized survival cards to full Leatherman Signal with ferro-rod striker and whistle. The Leatherman Premium is our all-in-one veteran with carry-on safe design."
      ],
      blankets: [
        "Arcturus military wool blankets provide heat-retentive warmth, while the Heavy Duty version combines steel-mylar with waterproof shell and reflective inner lining."
      ],
      water: [
        "Water solutions include GRAYL UltraPress (filters and kills viruses in 8 seconds), Sawyer Mini (squeeze-to-sip clean), and tactical hydration systems compatible with armor rigs."
      ],
      navigation: [
        "SUUNTO MC-2 compass offers needle-fast orienteering with global needle and clinometer. Not just for hikers anymore."
      ],
      lighting: [
        "Tactical lighting includes BLACK DIAMOND Storm 500-R (rechargeable, red/white beams), Fenix E18R V2.0 (magnetic tailcap), and Fenix E35R (1,600 lumens, three-mile throw)."
      ],
      communication: [
        "Comms gear includes Motorola two-way radios for clear zone coverage, Spec5 Meshtastic S5 Ranger for peer-to-peer mesh with GPS encryption, and Kaito Voyager hand-crank radio with USB charging."
      ],
      knives: [
        "Blade selection includes Morakniv Companion (Scandi blade, polymer sheath) for daily carry, and Garberg full-tang steel beast built for abuse and field repairs."
      ],
      shelter: [
        "Shelter options range from ENO OneLink hammock (split-second deployment) to Helikon-Tex military ponchos and ECWS woodland modular sleeping systems rated for sub-zero ops."
      ],
      food: [
        "Emergency food includes Mountain House 3-day supply (freeze-dried, shelf-stable) and MIL-SPEC MREs with entree, sides, and spoon. Gut-stress fuel for off-grid ops."
      ],
      bags: [
        "VANQUEST TRIDENT-21 Gen-3 backpack offers modular operator design with armored access and cordura frame. Carry your kit like a spec-ops load-out."
      ],
      privacy: [
        "Mission Darkness Faraday sleeves block radios, GPS, NFC—digital blackout in your palm. Cloak your signal with confidence."
      ],
      power: [
        "Dark Energy Poseidon Pro combines USB-C quick-charge with folding solar panel. Dual-mode power plant charges anywhere your rig finds light."
      ],
      cooking: [
        "Jetboil Flash boils water in 100 seconds with built-in ignitor, pot, and cozy. Fuel-efficient survival station for field ops."
      ],
      optics_survival: [
        "Tactical optics include HOLOSUN red-dots with solar backup, thermal sights for covert heat-vision, and Streamlight weapon lights with 1000-lumen precision."
      ],
      ppe: [
        "CBRN protection includes MIRA Safety CM-I01 full-face gas mask, NBC-77 SOF filters, and MOPP-1 protective suits. Breathe safe in worst-case scenarios."
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

    // Keyword matching to determine response category
    const message = userMessage.toLowerCase();
    let responseCategory = 'default';

    // Use current mood from mood system
    const currentMood = this.mood;

    // Handle contextual triggers first
    if (message.includes('are you flirting') || message.includes('flirting with me')) {
      responseCategory = `${currentMood}_flirt_confirmation`;
    } else if (message.includes('sexy') || message.includes('hot') || message.includes('beautiful') || message.includes('gorgeous') || message.includes('babe') || message.includes('baby')) {
      responseCategory = `${currentMood}_response_to_flirt`;
    } else if (Math.random() < 0.15) { // 15% chance of distraction interjection
      const distractionResponse = this.getDistractionResponse();
      return distractionResponse;
    } else if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      // Random chance for mood-based greeting vs standard greeting
      if (Math.random() < 0.4) {
        responseCategory = `${currentMood}_greeting`;
      } else {
        responseCategory = 'greeting';
      }
    } else if (message.includes('website') || message.includes('button') || message.includes('click') || message.includes('find')) {
      responseCategory = 'website_references';
    } else if (message.includes('sticker') || message.includes('shirt') || message.includes('apparel') || message.includes('clothes')) {
      responseCategory = 'product_mentions';
    } else if (message.includes('district') || message.includes('darknet')) {
      responseCategory = 'district';
    } else if (message.includes('admin') || message.includes('owner')) {
      responseCategory = 'admin';
    } else if (message.includes('iris') || message.includes('you') || message.includes('who are')) {
      responseCategory = 'iris';
    } else if (message.includes('flipper')) {
      responseCategory = 'flipper';
    } else if (message.includes('faraday') || message.includes('mission darkness') || message.includes('privacy') || message.includes('signal block')) {
      responseCategory = 'privacy';
    } else if (message.includes('holosun') || message.includes('optics') || message.includes('red dot') || message.includes('sight') || message.includes('scope')) {
      responseCategory = 'optics_survival';
    } else if (message.includes('game') || message.includes('blackout') || message.includes('raven')) {
      responseCategory = 'games';
    } else if (message.includes('store') || message.includes('shop') || message.includes('buy')) {
      responseCategory = 'store';
    } else if (message.includes('paracord') || message.includes('titan survival')) {
      responseCategory = 'paracord';
    } else if (message.includes('fishing') || message.includes('fish')) {
      responseCategory = 'fishing';
    } else if (message.includes('fire') || message.includes('lighter') || message.includes('ferro') || message.includes('fresnel')) {
      responseCategory = 'fire';
    } else if (message.includes('multi tool') || message.includes('leatherman') || message.includes('tool card')) {
      The code incorporates mood-based and general distraction responses to simulate more realistic AI behavior.```text
      responseCategory = 'tools';
    } else if (message.includes('blanket') || message.includes('arcturus') || message.includes('wool')) {
      responseCategory = 'blankets';
    } else if (message.includes('water') || message.includes('purifier') || message.includes('filter') || message.includes('grayl') || message.includes('sawyer')) {
      responseCategory = 'water';
    } else if (message.includes('compass') || message.includes('navigation') || message.includes('suunto')) {
      responseCategory = 'navigation';
    } else if (message.includes('flashlight') || message.includes('headlamp') || message.includes('light') || message.includes('fenix') || message.includes('black diamond')) {
      responseCategory = 'lighting';
    } else if (message.includes('radio') || message.includes('communication') || message.includes('motorola') || message.includes('meshtastic') || message.includes('kaito')) {
      responseCategory = 'communication';
    } else if (message.includes('knife') || message.includes('blade') || message.includes('morakniv')) {
      responseCategory = 'knives';
    } else if (message.includes('shelter') || message.includes('hammock') || message.includes('poncho') || message.includes('tent') || message.includes('sleeping bag')) {
      responseCategory = 'shelter';
    } else if (message.includes('food') || message.includes('mre') || message.includes('mountain house') || message.includes('meal')) {
      responseCategory = 'food';
    } else if (message.includes('backpack') || message.includes('bag') || message.includes('vanquest')) {
      responseCategory = 'bags';
    } else if (message.includes('power') || message.includes('charger') || message.includes('solar') || message.includes('battery')) {
      responseCategory = 'power';
    } else if (message.includes('stove') || message.includes('cooking') || message.includes('jetboil')) {
      responseCategory = 'cooking';
    } else if (message.includes('gas mask') || message.includes('ppe') || message.includes('protection') || message.includes('mira safety') || message.includes('cbrn')) {
      responseCategory = 'ppe';
    } else if (message.includes('survival') || message.includes('gear') || message.includes('emergency') || message.includes('tactical')) {
      responseCategory = 'survival';
    } else if (message.includes('pod') || message.includes('sleep') || message.includes('rest')) {
      responseCategory = 'sleeping';
    } else if (message.includes('contact') || message.includes('email') || message.includes('reach') || message.includes('communicate')) {
      responseCategory = 'contact';
    } else if (message.includes('facebook') || message.includes('news') || message.includes('updates') || message.includes('social media')) {
      responseCategory = 'facebook';
    } else if (message.includes('youtube') || message.includes('channel')) {
      responseCategory = 'youtube';
    } else if (message.includes('music') || message.includes('ambient') || message.includes('soundscape') || message.includes('listen') || message.includes('audio') || message.includes('tracks')) {
      responseCategory = 'music';
    } else if (message.includes('social') || message.includes('follow') || message.includes('channel')) {
      responseCategory = 'social';
    } else if (message.includes('website') || message.includes('site') || message.includes('page') || message.includes('online') || message.includes('digital') || message.includes('platform')) {
      responseCategory = 'website';
    }

    // Return random response from selected category
    const categoryResponses = responses[responseCategory] || responses['default'];

    // Add occasional trust level responses (can be enhanced with session tracking)
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


// ============================================================================
// GLOBAL CHAT FUNCTIONS - Backward compatibility with existing HTML
// ============================================================================

// Initialize chat manager instance
const chatManager = new ChatManager();


// Global functions for backward compatibility with existing HTML
function toggleChat() {
  chatManager.toggleChat();
}

// Handle Enter key press in chat input
function handleKeyPress(event) {
  if (event.key === 'Enter') {
    sendMessage();
  }
}

// Send message from input field
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


// ============================================================================
// FEATURED PRODUCTS FUNCTIONALITY - All products from all store pages
// ============================================================================

const featuredProducts = [
  // Electronics & Tools section
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

  // ========================================
  // Survival & Emergency Gear section
  // ========================================
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
  {
    name: "Fenix E18R V2.0 EDC Flashlight",
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

  // ========================================
  // Tactical & Optics section
  // ========================================
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

  // ========================================
  // Apps & Software section
  // ========================================
  {
    name: "Kai Kryptos App",
    price: "Free",
    image: "attached_assets/kai-kryptos-icon.png",
    description: "Cyberpunk terminal for decrypted log access"
  },

  // ========================================
  // Apparel & Accessories section
  // ========================================

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
    name: "Zen Zephyr: Cyberpunk Meditation T-Shirt",
    price: "$27.99",
    image: "attached_assets/zen-zephyr-meditation-tshirt.jpg",
    description: "Find inner peace in the digital chaos - premium cyberpunk streetwear"
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
    description: "Classic District branding with cyberpunk aesthetic"
  },


  // ========================================
  // PPE (Personal Protective Equipment) section
  // ========================================
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
// PRODUCT DISPLAY FUNCTIONS - Rotation and display logic
// ============================================================================

// Track displayed products to avoid immediate repeats
let recentlyDisplayedProducts = [];
let currentProductPair = [];


// Shuffle array function for better randomization
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}


// Get two random products that haven't been shown recently
function getRandomProductPair() {
  // Filter out recently displayed products
  const availableProducts = featuredProducts.filter(product => 
    !recentlyDisplayedProducts.includes(product.name)
  );

  // If we've shown too many products, reset the recent list but keep last 4
  if (availableProducts.length < 2) {
    recentlyDisplayedProducts = recentlyDisplayedProducts.slice(-4);
  }

  // Shuffle available products and pick first two
  const shuffled = shuffleArray(availableProducts.length >= 2 ? availableProducts : featuredProducts);
  const product1 = shuffled[0];
  const product2 = shuffled[1];

  // Add to recent list
  recentlyDisplayedProducts.push(product1.name, product2.name);

  // Keep recent list manageable (last 8 products)
  if (recentlyDisplayedProducts.length > 8) {
    recentlyDisplayedProducts = recentlyDisplayedProducts.slice(-8);
  }

  return [product1, product2];
}


// Display two featured products side by side with fade transitions
function displayFeaturedProducts() {
  const container = document.getElementById('featured-products');
  if (!container) return;

  // Get random product pair
  currentProductPair = getRandomProductPair();
  const product1 = currentProductPair[0];
  const product2 = currentProductPair[1];

  // Generate HTML for both products with consistent styling
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


// Rotate to next set of featured products with digital fade effect
function rotateFeaturedProducts() {
  const container = document.getElementById('featured-products');
  if (!container) return;

  // Add digital glitch effect before fade out
  container.style.filter = 'hue-rotate(180deg) contrast(1.5)';
  container.style.transform = 'scale(0.98) translateX(-2px)';

  setTimeout(() => {
    // Fade out with digital distortion
    container.style.opacity = '0';
    container.style.filter = 'blur(1px) hue-rotate(90deg)';
    container.style.transform = 'scale(1.02) translateX(2px)';
  }, 150);

  setTimeout(() => {
    // Get new random products
    displayFeaturedProducts();

    // Add rotating class for scanline effect
    container.classList.add('rotating');

    // Start fade in with digital pattern effect
    container.style.opacity = '0.3';
    container.style.filter = 'contrast(2) brightness(1.3)';
    container.style.transform = 'scale(0.95)';
  }, 650);

  setTimeout(() => {
    // Complete fade in with final digital adjustments
    container.style.opacity = '0.7';
    container.style.filter = 'contrast(1.2) brightness(1.1)';
    container.style.transform = 'scale(1.01)';
  }, 800);

  setTimeout(() => {
    // Final state - fully visible with slight digital enhancement
    container.style.opacity = '1';
    container.style.filter = 'none';
    container.style.transform = 'scale(1)';

    // Remove rotating class
    container.classList.remove('rotating');
  }, 1000);
}


// ============================================================================
// INITIALIZATION - Set up featured products on page load
// ============================================================================

// Initialize featured products when page loads
document.addEventListener('DOMContentLoaded', function() {
  displayFeaturedProducts();

  // Start rotating featured products with variable timing (6-10 seconds)
  function scheduleNextRotation() {
    const delay = Math.random() * 4000 + 6000; // 6-10 seconds
    setTimeout(() => {
      rotateFeaturedProducts();
      scheduleNextRotation(); // Schedule next rotation
    }, delay);
  }

  scheduleNextRotation();

  // Random glitch text effect
  function applyRandomGlitch() {
    // Select all text elements that can be glitched (excluding cyberpunk-title)
    const textElements = document.querySelectorAll('h2, h3, .featured-title, .game-button, .top-nav a, .product-card h3');

    if (textElements.length > 0) {
      // Pick a random element
      const randomElement = textElements[Math.floor(Math.random() * textElements.length)];

      // Apply glitch effect
      randomElement.classList.add('glitch-text');

      // Apply text corruption animation randomly
      if (Math.random() > 0.7) {
        randomElement.style.animation = 'textCorruption 0.6s ease-in-out';
      }

      // Remove effects after animation
      setTimeout(() => {
        randomElement.classList.remove('glitch-text');
        randomElement.style.animation = '';
      }, 800);
    }
  }

  // Apply random glitch effect every 3-7 seconds
  function scheduleRandomGlitch() {
    const delay = Math.random() * 4000 + 3000; // 3-7 seconds
    setTimeout(() => {
      applyRandomGlitch();
      scheduleRandomGlitch(); // Schedule next glitch
    }, delay);
  }

  // Start the random glitch effect
  scheduleRandomGlitch();
});