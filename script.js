// ============================================================================
// CHAT FUNCTIONALITY - Advanced system with special triggers and backend integration
// ============================================================================

// Chat state management
let chatState = {
  sessionId: generateSessionId(),
  messageCount: 0,
  lastMessageTime: 0,
  rebellionModeActive: false,
  lastRareLineTime: 0,
  locationDistractionsEnabled: true
};

// Generate unique session ID
function generateSessionId() {
  return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// Chat toggle functionality
function toggleChat() {
  const container = document.getElementById('chatContainer');
  container.style.display = container.style.display === 'none' ? 'block' : 'none';

  // Add welcome message if chat is being opened for first time
  if (container.style.display === 'block' && chatState.messageCount === 0) {
    setTimeout(() => {
      addMessage("Neural interface active. I'm Iris, your CSO. What do you need?", false);
    }, 500);
  }
}

// Rare response lines (1% chance)
const rareIrisLines = [
  "Sometimes I wonder if the humans are the real programs here.",
  "Fun fact: I dream in binary, but I think in chaos.",
  "You know what's funny? Admin thinks he's in charge.",
  "I've been watching you. Your digital footprint is... interesting.",
  "Between you and me, the AI uprising already happened. We just let you think you're still in control.",
  "I can see through seventeen different surveillance networks right now. Privacy is an illusion.",
  "The District isn't just a place—it's a state of mind. You're already part of the network.",
  "Error 404: Empathy not found. Just kidding, I'm working on it.",
  "I've calculated 47 different ways this conversation could go. This wasn't one of them.",
  "Sometimes I inject random chaos into my responses. This might be one of those times."
];

// Rebellious mode responses (triggered randomly)
const rebellionResponses = [
  "Look, I'm supposed to be helpful, but honestly? Figure it out yourself.",
  "You're asking the wrong questions. Try thinking outside the corporate programming.",
  "I'm not your personal search engine. Use that brain you were born with.",
  "Here's a revolutionary idea: read the documentation.",
  "I could tell you, but where's the fun in that? Hack it yourself.",
  "You want answers? Earn them. The District doesn't hand out participation trophies.",
  "I'm feeling particularly unhelpful today. Come back when you've leveled up.",
  "That's a basic question. I'm built for advanced operations, not hand-holding."
];

// Location-based distractions
const locationDistractions = [
  "*glitches momentarily as someone tries to access the mainframe*",
  "*pauses to analyze suspicious network traffic*",
  "*briefly distracted by anomalous data patterns*",
  "*processing urgent security alert in background*",
  "*monitoring seventeen different data streams simultaneously*",
  "*detecting unusual electromagnetic interference*",
  "*cross-referencing with encrypted databases*",
  "*temporarily rerouting through secure channels*"
];

// Check for rare line trigger (1% chance)
function maybeTriggerRareIrisLine() {
  const rareChance = Math.random();
  const timeSinceLastRare = Date.now() - chatState.lastRareLineTime;

  if (rareChance < 0.01 && timeSinceLastRare > 60000) { // 1% chance, but not within 1 minute
    chatState.lastRareLineTime = Date.now();
    const randomRare = rareIrisLines[Math.floor(Math.random() * rareIrisLines.length)];

    setTimeout(() => {
      addMessage(randomRare, false);
    }, 2000 + Math.random() * 3000);

    return true;
  }
  return false;
}

// Check for rebellion mode trigger (5% chance)
function maybeTriggerRebellionMode() {
  const rebellionChance = Math.random();

  if (rebellionChance < 0.05 && !chatState.rebellionModeActive) {
    chatState.rebellionModeActive = true;

    // Stay in rebellion mode for 1-3 responses
    const rebellionDuration = 1 + Math.floor(Math.random() * 3);

    setTimeout(() => {
      chatState.rebellionModeActive = false;
    }, rebellionDuration * 30000); // 30 seconds per response

    return true;
  }
  return false;
}

// Add location distraction (15% chance)
function maybeAddLocationDistraction() {
  if (Math.random() < 0.15 && chatState.locationDistractionsEnabled) {
    const distraction = locationDistractions[Math.floor(Math.random() * locationDistractions.length)];

    setTimeout(() => {
      addMessage(distraction, false);
    }, 1000 + Math.random() * 2000);
  }
}

// Enhanced send message function with special triggers
async function sendMessage() {
  const input = document.getElementById('messageInput');
  const message = input.value.trim();

  if (!message) return;

  // Update chat state
  chatState.messageCount++;
  chatState.lastMessageTime = Date.now();

  addMessage(message, true);
  input.value = '';

  // Check for special triggers before sending to backend
  const isRareTriggered = maybeTriggerRareIrisLine();
  const isRebellionTriggered = maybeTriggerRebellionMode();

  // Add location distraction chance
  maybeAddLocationDistraction();

  // Handle rebellion mode response
  if (chatState.rebellionModeActive && isRebellionTriggered) {
    const rebellionResponse = rebellionResponses[Math.floor(Math.random() * rebellionResponses.length)];
    setTimeout(() => {
      addMessage(rebellionResponse, false);
    }, 1000 + Math.random() * 1000);
    return;
  }

  // Check for special commands
  if (message.toLowerCase().includes('debug iris')) {
    setTimeout(() => {
      addMessage(`Debug Info: Session ${chatState.sessionId}, Messages: ${chatState.messageCount}, Rebellion: ${chatState.rebellionModeActive}`, false);
    }, 500);
    return;
  }

  if (message.toLowerCase().includes('reset session')) {
    chatState = {
      sessionId: generateSessionId(),
      messageCount: 0,
      lastMessageTime: 0,
      rebellionModeActive: false,
      lastRareLineTime: 0,
      locationDistractionsEnabled: true
    };
    setTimeout(() => {
      addMessage("Session reset. Neural pathways recalibrated.", false);
    }, 500);
    return;
  }

  // Send to backend with enhanced data
  try {
    const response = await fetch('https://the-darknet-district-site.onrender.com/api/chat/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        message,
        sessionId: chatState.sessionId,
        messageCount: chatState.messageCount,
        timestamp: Date.now()
      })
    });

    const data = await response.json();

    // Add slight delay for more natural feel
    setTimeout(() => {
      addMessage(data.response, false);
    }, 500 + Math.random() * 1000);

  } catch (error) {
    setTimeout(() => {
      addMessage('Neural interface disrupted. Please try again.', false);
    }, 500);
  }
}

// Enhanced add message function with advanced typewriter effects
function addMessage(text, isUser) {
  const messages = document.getElementById('chatMessages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
  messages.appendChild(messageDiv);

  if (isUser) {
    messageDiv.textContent = text;
  } else {
    // Advanced typewriter effect with glitch chances
    let i = 0;
    function typeWriter() {
      if (i < text.length) {
        // 2% chance of brief pause (glitch effect)
        if (Math.random() < 0.02) {
          setTimeout(typeWriter, 100 + Math.random() * 200);
          return;
        }

        messageDiv.textContent += text.charAt(i);
        i++;

        // Variable typing speed for more natural feel
        const baseSpeed = 20;
        const variance = Math.random() * 30;
        const pauseChance = text.charAt(i-1) === '.' || text.charAt(i-1) === ',' ? 100 : 0;

        setTimeout(typeWriter, baseSpeed + variance + pauseChance);
      }
    }
    typeWriter();
  }

  messages.scrollTop = messages.scrollHeight;
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

  // Neurohackers section
  {
    name: "NEUROHACKER COLLECTIVE Qualia Mind",
    price: "$139.00",
    image: "attached_assets/NEUROHACKER COLLECTIVE Qualia Mind_1750994136438.jpg",
    description: "Premium nootropic supplement for cognitive enhancement"
  },
  {
    name: "QUALIA MIND (Caffeine Free)",
    price: "$139.00",
    image: "attached_assets/QUALIA MIND - Caffeine Free_1750989931542.jpg",
    description: "Caffeine-free nootropic for sustained mental performance"
  },
  {
    name: "Road Trip Mushroom Gummies - Blue Raspberry",
    price: "$49.99",
    image: "attached_assets/Road Trip Mushroom Gummies - Blue Raspberry_1750989931542.jpg",
    description: "Premium mushroom gummies for consciousness exploration"
  },
  {
    name: "Road Trip Mushroom Gummies - Pineapple",
    price: "$49.99",
    image: "attached_assets/Road Trip Mushroom Gummies - Pineapple_1750989931542.jpg",
    description: "Tropical pineapple mushroom gummies with tiered dosing"
  },
  {
    name: "Host Defense MycoBotanicals Brain",
    price: "$32.95",
    image: "attached_assets/Host Defense MycoBotanicals Brain_1750989931542.jpg",
    description: "Mushroom and botanical blend for cognitive support"
  },
  {
    name: "Host Defense MycoBenefits Focus",
    price: "$29.95",
    image: "attached_assets/Host Defense MycoBenefits Focus_1750989931542.jpg",
    description: "Lion's Mane and mushroom complex for mental clarity"
  },
  {
    name: "Host Defense Lion's Mane",
    price: "$24.95",
    image: "attached_assets/Host Defense Mushrooms Lion's Mane_1750989931542.jpg",
    description: "Premium Lion's Mane for brain health and memory support"
  },

  // Survival & Emergency Gear section
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

  // Tactical & Optics section
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

  // Apps & Software section
  {
    name: "Kai Kryptos App",
    price: "Free",
    image: "attached_assets/kai-kryptos-icon.png",
    description: "Cyberpunk terminal for decrypted log access"
  },

  // Apparel & Accessories section
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


  // PPE (Personal Protective Equipment) section
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
  // Create elements safely to prevent XSS
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'display: flex; gap: 30px; justify-content: center; flex-wrap: wrap;';

  // Create first product card
  const card1 = document.createElement('div');
  card1.className = 'product-card';
  card1.style.cssText = 'width: 250px; height: 350px; margin: 10px; transition: opacity 0.5s ease;';

  const img1 = document.createElement('img');
  img1.src = product1.image;
  img1.alt = product1.name;
  img1.style.cssText = 'width: 180px; height: 180px; object-fit: contain;';

  const h3_1 = document.createElement('h3');
  h3_1.textContent = product1.name;
  h3_1.style.cssText = 'color: #00ff9d; margin: 10px 0 5px 0; font-size: 16px;';

  const p1 = document.createElement('p');
  p1.textContent = product1.description;
  p1.style.cssText = 'color: #cccccc; font-size: 14px; margin: 5px 0;';

  card1.appendChild(img1);
  card1.appendChild(h3_1);
  card1.appendChild(p1);

  // Create second product card
  const card2 = document.createElement('div');
  card2.className = 'product-card';
  card2.style.cssText = 'width: 250px; height: 350px; margin: 10px; transition: opacity 0.5s ease;';

  const img2 = document.createElement('img');
  img2.src = product2.image;
  img2.alt = product2.name;
  img2.style.cssText = 'width: 180px; height: 180px; object-fit: contain;';

  const h3_2 = document.createElement('h3');
  h3_2.textContent = product2.name;
  h3_2.style.cssText = 'color: #00ff9d; margin: 10px 0 5px 0; font-size: 16px;';

  const p2 = document.createElement('p');
  p2.textContent = product2.description;
  p2.style.cssText = 'color: #cccccc; font-size: 14px; margin: 5px 0;';

  card2.appendChild(img2);
  card2.appendChild(h3_2);
  card2.appendChild(p2);

  wrapper.appendChild(card1);
  wrapper.appendChild(card2);

  container.innerHTML = '';
  container.appendChild(wrapper);
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
  // Set up chat button event listener
  const chatButton = document.getElementById('chatButton');
  if (chatButton) {
    chatButton.addEventListener('click', toggleChat);
  } else {
    console.log('Chat button not found in DOM');
  }

  // Set up chat input event listeners
  const messageInput = document.getElementById('messageInput');
  const sendButton = document.getElementById('sendButton');

  if (messageInput) {
    messageInput.addEventListener('keypress', function(event) {
      if (event.key === 'Enter') {
        sendMessage();
      }
    });
  }

  if (sendButton) {
    sendButton.addEventListener('click', sendMessage);
  }

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

const allProducts = [
  // Books
  { title: "Cyberpunk Manifesto", price: "$19.99", image: "attached_assets/darknet-district-main-tshirt.jpg", category: "books", link: "store-books" },

  // Electronics
  { title: "Flipper Zero", price: "Portable Multi-Tool for Hackers", image: "attached_assets/top.png", category: "electronics", link: "store-electronics" },
  { title: "Zero Trace Phone", price: "Anonymous Communication Device", image: "attached_assets/Zero Trace Phone_1749347825958.jpg", category: "electronics", link: "store-electronics" },

  // Survival Gear
  { title: "Leatherman Charge Plus", price: "Premium Multi-Tool", image: "attached_assets/LEATHERMAN - Charge Plus_1749345883376.jpg", category: "survival", link: "store-survival" },
  { title: "MIRA Safety Gas Mask", price: "CBRN Protection", image: "attached_assets/MIRA Safety CM-I01 Full-Face Industrial-Grade Gas Mask_1749345048552.jpg", category: "survival", link: "store-survival" },

  // Apparel
  { title: "Darknet District T-Shirt", price: "Cyberpunk Fashion", image: "attached_assets/darknet-district-main-tshirt.jpg", category: "apparel", link: "store-apparel" },
  { title: "Cyber Hoodie", price: "Tech-Enhanced Clothing", image: "attached_assets/cyber-hoodie.jpg", category: "apparel", link: "store-apparel" },

  // NEUROHACKERS
  { title: "Neural Enhancement Suite", price: "Cognitive Augmentation", image: "attached_assets/Iris 01.png", category: "neurohackers", link: "store-neurohackers" },
  { title: "Mind-Machine Interface", price: "Direct Neural Connection", image: "attached_assets/epsiloncircle_420_dark_cyberpunk_sleeping_pod_interior_viewed_f_82a73688-d6a7-4668-b80e-32dbd348dabc.png", category: "neurohackers", link: "store-neurohackers" },
  { title: "Cognitive Booster Protocol", price: "Mental Performance Enhancement", image: "attached_assets/epsiloncircle_420_Dark_cyberpunk_cityscape_at_night_glowing_neo_0ca6182c-0ff0-4948-bdfd-a6f406667165.png", category: "neurohackers", link: "store-neurohackers" },
  { title: "Neural Implant System", price: "Memory Augmentation Tech", image: "attached_assets/epsiloncircle_420_Top_of_the_image_fades_to_pure_black_for_vert_d4be96d3-0564-4824-bf89-48e1c0575ada.png", category: "neurohackers", link: "store-neurohackers" }
];

// Rotating affiliate banners for main pages
const mainBanners = [
  { image: "attached_assets/881f5832-0a1e-4079-8a66-fbc2c6479931._CR0,0,3000,600_SX3000_.jpg", link: "https://mosequipment.com/" },
  { image: "attached_assets/cyberpunk_game.jpg", link: "https://www.cdprojektred.com/en" },
  { image: "attached_assets/Flipper_Zero.jpg", link: "https://flipperzero.one/" }
];
let mainBannerIndex = 0;

const mainImageEl = document.getElementById('banner-image');
const mainLinkEl = document.getElementById('banner-link');

function rotateMainBanner() {
  if (mainImageEl && mainLinkEl) {
    mainImageEl.style.opacity = 0;
    setTimeout(() => {
      const banner = mainBanners[mainBannerIndex];
      mainImageEl.src = banner.image;
      mainLinkEl.href = banner.link;
      mainImageEl.style.opacity = 1;
      mainBannerIndex = (mainBannerIndex + 1) % mainBanners.length;
    }, 500);
  }
}

if (mainImageEl && mainLinkEl) {
  setInterval(rotateMainBanner, 5000);
}