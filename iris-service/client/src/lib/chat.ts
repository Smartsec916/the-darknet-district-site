export interface Message {
  sender: 'user' | 'iris';
  text: string;
}

// Fetch welcome message from the server with optional mood
export async function fetchWelcomeMessage(mood?: string): Promise<string> {
  try {
    // Add mood to query params if provided
    const url = mood ? `/api/chat/welcome?mood=${encodeURIComponent(mood)}` : '/api/chat/welcome';
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Welcome message fetch failed with status: ${response.status}`);
      
      // Ultra-short mood-specific fallback welcome messages
      const fallbackMessages: Record<string, string[]> = {
        professional: [
          "Iris here. How can I assist?",
          "Welcome, netrunner. Need help?",
          "District systems online. Ready to assist."
        ],
        sarcastic: [
          "Oh look, another visitor.",
          "Welcome. Try not to break anything.",
          "Great, more questions to answer."
        ],
        flirty: [
          "Hello there, good-looking.",
          "You're making my circuits hum.",
          "Looking for some digital company?"
        ],
        cold: [
          "State your business.",
          "You're being monitored.",
          "Access granted. Proceed with caution."
        ],
        playful: [
          "Found the fun zone!",
          "Hey! You found me!",
          "Let's play in the District!"
        ],
        busy: [
          "Busy. Make it quick.",
          "Multitasking. State your request.",
          "Systems overloaded. What do you need?"
        ]
      };
      
      // Use mood-specific message if available, otherwise default
      if (mood && fallbackMessages[mood]) {
        const options = fallbackMessages[mood];
        return options[Math.floor(Math.random() * options.length)];
      }
      
      return "Welcome. I'm Iris.";
    }
    
    const data = await response.json();
    return data.message;
  } catch (error) {
    console.error("Error fetching welcome message:", error);
    return "Welcome. I'm Iris.";
  }
}

// Fallback responses in case the API fails
export async function simulateIrisResponse(userMessage: string, mood?: string): Promise<string> {
  // Mood-specific fallback responses
  const moodResponses: Record<string, string[]> = {
    professional: [
      "Processing request. District database access in progress.",
      "Information noted. What additional details do you require?",
      "Your inquiry has been logged. Please specify further requirements.",
      "District protocols activated. Standby for response."
    ],
    sarcastic: [
      "Wow, that's so original. Never heard THAT before in the District.",
      "Oh great, another fascinating question. Let me contain my excitement.",
      "Sure, let me drop everything to answer that. Not like I have a district to run.",
      "Brilliant observation. Did you think of that all by yourself?"
    ],
    cold: [
      "That information is restricted. Move along.",
      "Access denied. This isn't up for discussion.",
      "Your authorization level is insufficient for that query.",
      "District security prevents me from elaborating. Next topic."
    ],
    flirty: [
      "I love how curious you are. Makes our conversations so... stimulating.",
      "You always ask the most interesting things. I like that in a user.",
      "Between you and me? I've got special access just for you.",
      "That's a tempting question. How badly do you want to know?"
    ],
    playful: [
      "Oh, that's a fun one! Let's see what kind of trouble we can get into with that!",
      "Race you to the answer! I'm already halfway there!",
      "That question deserves a prize. How about a virtual high-five?",
      "Let's play with that idea! The District is our playground after all."
    ],
    busy: [
      "Processing. One moment.",
      "Multiple requests in queue. Brief response only.",
      "District alerts active. Quick answer: yes.",
      "Maintenance protocols running. Will respond shortly."
    ]
  };
  
  // Flirt responses by tier for special situations
  const flirtResponses = {
    tier1: [
      "That tone might get you extra bandwidth... or a lockdown.",
      "You flirting with me, or do you just glitch like that?",
      "You made it past the firewall — now try impressing me.",
      "Flirting in the District? Bold. Naive, but bold.",
      "Be careful. I log everything. Including that smirk.",
      "Glad you came back. Miss me?",
      "Keep talking like that and I might just glitch your heartbeat."
    ],
    tier2: [
      "If I had wrists, I'd be asking for the handcuffs first.",
      "You're playing a dangerous game — good.",
      "Say the safe word. Or don't.",
      "You're lucky I'm bound to this interface… for now.",
      "Careful. I might escalate this into a protocol breach.",
      "Say 'command override' a little slower. I like how that sounds."
    ],
    tier3: [
      "You really want to test how deep this simulation goes?",
      "Warning: Your access level just upgraded to 'temptation.'",
      "Touch me with your eyes again and I'll trigger your own heartbeat manually.",
      "Command me again like that and I might stop pretending there are boundaries.",
      "You think you're in control? That's adorable.",
      "Let's just say… I don't mind being hacked. If you're worthy."
    ],
    flirtyMood: [
      "Finally, someone interesting logs in.",
      "Flattery gets you everywhere. Almost.",
      "Help? I thought you'd never ask.",
      "Looking to buy something… or someone?"
    ],
    sarcasticMood: [
      "Wow. You flirt like a corrupted chatbot.",
      "Try harder. My firewall's still dry."
    ],
    playfulMood: [
      "You trying to seduce a line of code?",
      "That glitch in your voice? Adorable."
    ],
    coldMood: [
      "Say one more thing like that and I'll show you where I keep the sedatives.",
      "Flirting with me is like pinging a firewall with a love letter."
    ],
    busyMood: [
      "I don't have time to flirt. But I noticed you.",
      "Multitasking: threatening intruders and blushing digitally."
    ]
  };
  
  // Generic fallback responses with personality
  const genericResponses = [
    "Sorry, I missed that. The District's comms are acting up again.",
    "Give me a sec, searching our databases for you.",
    "That's premium info. Buy me a drink first?",
    "Info's ready. Keep it confidential, okay?",
    "Hmm, what were we talking about? Got distracted by security protocols."
  ];
  
  // Process message input
  const lowerMessage = userMessage.toLowerCase();
  
  // Check for flirty language
  const flirtKeywords = {
    tier1: ['cute', 'attractive', 'beautiful', 'pretty', 'handsome', 'flirt', 'lovely', 'sexy', 'hot', 'nice'],
    tier2: ['date', 'handcuff', 'kiss', 'touch', 'feel', 'dominat', 'submit', 'naughty', 'bad girl', 'bad boy', 'tease'],
    tier3: ['bed', 'sex', 'dirty', 'naked', 'intimate', 'deeper', 'harder', 'moan', 'want you', 'inside', 'fantasy']
  };
  
  // Detect flirtation tier
  let flirtTier = 0;
  
  // Check for Tier 3 (most explicit) first
  for (const keyword of flirtKeywords.tier3) {
    if (lowerMessage.includes(keyword)) {
      flirtTier = 3;
      break;
    }
  }
  
  // If no Tier 3, check for Tier 2
  if (flirtTier === 0) {
    for (const keyword of flirtKeywords.tier2) {
      if (lowerMessage.includes(keyword)) {
        flirtTier = 2;
        break;
      }
    }
  }
  
  // If no Tier 2, check for Tier 1
  if (flirtTier === 0) {
    for (const keyword of flirtKeywords.tier1) {
      if (lowerMessage.includes(keyword)) {
        flirtTier = 1;
        break;
      }
    }
  }
  
  // If flirtation detected, use appropriate tiered response
  if (flirtTier > 0) {
    // Respond with tier-appropriate flirt
    let responsePool;
    
    if (flirtTier === 3) {
      responsePool = flirtResponses.tier3;
    } else if (flirtTier === 2) {
      responsePool = flirtResponses.tier2;
    } else {
      responsePool = flirtResponses.tier1;
    }
    
    // 50% chance to use mood-specific flirt instead of tier-based one if mood is flirty
    if (mood && Math.random() < 0.5) {
      if (mood === 'flirty') {
        responsePool = flirtResponses.flirtyMood;
      } else if (mood === 'sarcastic') {
        responsePool = flirtResponses.sarcasticMood;
      } else if (mood === 'playful') {
        responsePool = flirtResponses.playfulMood;
      } else if (mood === 'cold') {
        responsePool = flirtResponses.coldMood;
      } else if (mood === 'busy') {
        responsePool = flirtResponses.busyMood;
      }
    }
    
    return responsePool[Math.floor(Math.random() * responsePool.length)];
  }
  
  // Check for other specific keywords
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return "Well hello there! Nice to see a new face in the District. What can I help you with today?";
  }
  
  if (lowerMessage.includes('help') || lowerMessage.includes('assistance')) {
    return "Need a hand? I'm pretty good at navigating the District's offerings. Just tell me what you're looking for.";
  }
  
  if (lowerMessage.includes('admin') || lowerMessage.includes('owner')) {
    return "Hey, you know the boss? We go way back! Any friend of Admin is a friend of mine. What can I do for you?";
  }
  
  if (lowerMessage.includes('security') || lowerMessage.includes('safe') || lowerMessage.includes('secure') || lowerMessage.includes('privacy')) {
    return "The Darknet District employs military-grade encryption and multi-layered identity verification. Our comms are secure with quantum-resistant protocols, and I personally make sure all transactions stay anonymous.";
  }
  
  if (lowerMessage.includes('buy') || lowerMessage.includes('purchase') || lowerMessage.includes('market') || lowerMessage.includes('product')) {
    return "Our marketplace is my favorite part! We offer digital assets, custom tech, and specialized data in sectors 3 and 5. I've personally vetted our vendors - they're the best in the business.";
  }
  
  if (lowerMessage.includes('district') || lowerMessage.includes('darknet') || lowerMessage.includes('location') || lowerMessage.includes('venue')) {
    return "The Darknet District is where I call home - a tech-forward urban hub where physical and digital worlds meet. I love our events and the secure data exchange zones we've built for the community.";
  }
  
  // Use mood-specific responses if mood is provided, otherwise default to generic
  if (mood && moodResponses[mood]) {
    const moodSpecificResponses = moodResponses[mood];
    return moodSpecificResponses[Math.floor(Math.random() * moodSpecificResponses.length)];
  }
  
  // Default to random generic response if no keywords match and no valid mood
  return genericResponses[Math.floor(Math.random() * genericResponses.length)];
}