
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
      survival: [
        "Survival section includes Arcturus blankets, Morakniv knives, Jetboil stoves, water filters, MREs, and tactical gear. Built for harsh conditions.",
        "From Sawyer water filters to Mountain House meals, our survival gear is tested for reliability when everything else fails."
      ],
      sleeping: [
        "Sleeping pods offer secure rest spaces within the District. Reserve one when you need downtime between operations.",
        "Our pods provide high-tech sanctuary space - perfect for recharging while maintaining security protocols."
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
    } else if (message.includes('flipper')) {
      responseCategory = 'flipper';
    } else if (message.includes('faraday') || message.includes('mission darkness')) {
      responseCategory = 'faraday';
    } else if (message.includes('holosun') || message.includes('optics') || message.includes('red dot')) {
      responseCategory = 'optics';
    } else if (message.includes('game') || message.includes('blackout') || message.includes('raven')) {
      responseCategory = 'games';
    } else if (message.includes('store') || message.includes('shop') || message.includes('buy')) {
      responseCategory = 'store';
    } else if (message.includes('survival') || message.includes('gear') || message.includes('knife') || message.includes('blanket')) {
      responseCategory = 'survival';
    } else if (message.includes('pod') || message.includes('sleep') || message.includes('rest')) {
      responseCategory = 'sleeping';
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

// Featured products functionality - All products from all store pages
const featuredProducts = [
  // Electronics & Tools
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
  // Survival & Emergency Gear
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
  // Tactical & Optics
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
  // Apps & Software
  {
    name: "Kai Kryptos App",
    price: "Free",
    image: "attached_assets/kai-kryptos-icon.png",
    description: "Cyberpunk terminal for decrypted log access"
  },
  // PPE (Personal Protective Equipment)
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

let currentProductIndex = 0;

function displayFeaturedProducts() {
  const container = document.getElementById('featured-products');
  if (!container) return;
  
  const product1 = featuredProducts[currentProductIndex];
  const product2 = featuredProducts[(currentProductIndex + 1) % featuredProducts.length];
  
  container.innerHTML = `
    <div style="display: flex; gap: 30px; justify-content: center; flex-wrap: wrap;">
      <div class="product-card" style="width: 250px; height: 350px; margin: 10px; transition: opacity 0.5s ease;">
        <img src="${product1.image}" alt="${product1.name}" style="width: 180px; height: 180px; object-fit: contain;">
        <h3 style="color: #00ff9d; margin: 10px 0 5px 0; font-size: 16px;">${product1.name}</h3>
        <p style="color: #cccccc; font-size: 14px; margin: 5px 0;">${product1.description}</p>
        <p style="color: #ff3366; font-weight: bold; font-size: 18px; margin: 10px 0;">${product1.price}</p>
      </div>
      <div class="product-card" style="width: 250px; height: 350px; margin: 10px; transition: opacity 0.5s ease;">
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
  
  // Fade out
  container.style.opacity = '0';
  
  setTimeout(() => {
    // Move to next two products
    currentProductIndex = (currentProductIndex + 2) % featuredProducts.length;
    displayFeaturedProducts();
    
    // Fade in
    container.style.opacity = '1';
  }, 500);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
  displayFeaturedProducts();
  
  // Start rotating featured products every 8 seconds
  setInterval(rotateFeaturedProducts, 8000);
});
