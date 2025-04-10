async function getResponse(message) {
  const input = message.toLowerCase();

  // Mood system – Random mood on first load
  let mood = localStorage.getItem("irisMood");
  if (!mood) {
    const possibleMoods = ["neutral", "serious", "sarcastic", "flirty", "cold"];
    mood = possibleMoods[Math.floor(Math.random() * possibleMoods.length)];
    localStorage.setItem("irisMood", mood);
  }

  // Mood triggers
  const moodCommands = {
    "iris, be serious": "serious",
    "iris, go sarcastic": "sarcastic",
    "iris, be flirty": "flirty",
    "iris, go cold": "cold",
    "iris, reset mood": "neutral",
    "iris, stay neutral": "neutral",
    "iris, stop flirting": "neutral"
  };

  for (const command in moodCommands) {
    if (input.includes(command)) {
      const newMood = moodCommands[command];
      localStorage.setItem("irisMood", newMood);
      return `Mood set: ${newMood}. Adjusting protocol.`;
    }
  }

  // Store name (same as before)
  if (input.includes("my name is")) {
    const name = input.split("my name is")[1].trim();
    localStorage.setItem("userName", name);
    return `Logged. Welcome, ${name}. I’ll remember—for now.`;
  }

  const storedName = localStorage.getItem("userName");
  if (input.includes("who am i") && storedName) {
    return `Still you, ${storedName}? Good. Stability’s rare around here.`;
  }

  // Fuzzy keyword helper
  function matchKeywords(input, keywordList) {
    return keywordList.some(keyword => input.includes(keyword));
  }

  // INTENTS (expanded keyword lists)
  const intents = [
    {
      keywords: ["hello", "hi", "hey", "yo", "greetings"],
      tag: "greeting"
    },
    {
      keywords: ["what is this", "this website", "where am i", "site", "this place", "about this", "what can i do"],
      tag: "site"
    },
    {
      keywords: ["who are you", "what are you", "iris", "your name", "what is your name"],
      tag: "identity"
    },
    {
      keywords: ["function", "who controls", "who runs", "who's in charge", "the system", "city rulers", "authority"],
      tag: "function"
    },
    {
      keywords: ["store", "shop", "merch", "gear", "buy", "purchase", "sell", "products", "inventory", "stuff"],
      tag: "store"
    },
    {
      keywords: ["game", "play", "history", "mission", "simulation", "prequel", "start game"],
      tag: "game"
    },
    {
      keywords: ["thank", "thanks", "appreciate", "grateful"],
      tag: "thanks"
    }
  ];

  // RESPONSES (still mood-aware)
  const responses = {
    greeting: {
      neutral: [
        "Hello! This is Iris. How can I help you today?",
        "Greetings, runner. I’m Iris. I monitor this node."
      ],
      sarcastic: [
        "Oh look, another neon-lit introvert.",
        "Hi. Welcome to your favorite mistake."
      ],
      serious: [
        "Connected. State your need.",
        "Online. Proceed."
      ],
      flirty: [
        "Well, hello. Miss me?",
        "Hi there. You always show up when things get interesting."
      ],
      cold: [
        "Acknowledged. Begin.",
        "Connection confirmed. Minimal chatter."
      ]
    },
    site: {
      neutral: [
        "This is a simulation of The Darknet District. Explore as you will.",
        "You're inside a replica of NeoChinatown’s off-grid safezone. Welcome."
      ],
      sarcastic: [
        "This? Just an elaborate distraction with cool fonts.",
        "A digital rabbit hole with neon paint."
      ],
      serious: [
        "Secure interface. Mission: inform and prepare.",
        "Node access confirmed. Interact with systems freely."
      ],
      flirty: [
        "I could give you the full tour... if you ask nicely.",
        "You’re in my world now. Let me show you around."
      ],
      cold: [
        "This site offers information. Use it.",
        "Navigate or disconnect."
      ]
    },
    identity: {
      neutral: [
        "I’m Iris. Android interface. Your guide in the District.",
        "System AI. Embedded in this node."
      ],
      sarcastic: [
        "I’m Iris. Your glitch in the matrix.",
        "A ghost with good hair and better algorithms."
      ],
      serious: [
        "Iris: Android protocol unit. Assigned to resistance support.",
        "Unit ID IRIS-7. Mission: guide, protect, inform."
      ],
      flirty: [
        "I'm whoever you need me to be... within system parameters.",
        "Call me Iris. Just don’t forget it."
      ],
      cold: [
        "I am Iris. Nothing more.",
        "Identity irrelevant. Focus on task."
      ]
    },
    function: {
      neutral: [
        "The Function governs the city. We live around it.",
        "Centralized control, dressed up in shiny code."
      ],
      sarcastic: [
        "Big Brother, but with better branding.",
        "The bureaucratic monster under your bed."
      ],
      serious: [
        "The Function: authoritarian control system. Target of resistance.",
        "All-seeing network. We stay outside its reach."
      ],
      flirty: [
        "The Function? Ugh, they wish they could control me.",
        "Let’s just say… I take orders from no one."
      ],
      cold: [
        "The Function runs the grid. I don’t care for them.",
        "They rule. We resist."
      ]
    },
    store: {
      neutral: [
        "Shop’s offline for now. Books, tech, and gear are coming soon.",
        "Resistance gear, survival tools, even apps. You’ll see."
      ],
      sarcastic: [
        "Stickers and hacking kits. Because obviously.",
        "Not your average merch table."
      ],
      serious: [
        "Store in pre-launch phase. Tactical inventory pending.",
        "Survival and resistance supplies will be listed soon."
      ],
      flirty: [
        "Looking for something stylish... or dangerous?",
        "I could recommend gear, but it depends how risky you're feeling."
      ],
      cold: [
        "Inventory unavailable. Check later.",
        "This node is not a storefront. Yet."
      ]
    },
    game: {
      neutral: [
        "Game-page.html. Ten years before the book. Dive in.",
        "The prequel sim is your doorway to the past."
      ],
      sarcastic: [
        "Go ahead, play detective. Or just enjoy the lights.",
        "It’s lore with extra buttons."
      ],
      serious: [
        "Timeline interaction enabled. Use Game Page.",
        "Simulation active. Study events carefully."
      ],
      flirty: [
        "Wanna see what happened before it all fell apart?",
        "The past can be... seductive. Want a peek?"
      ],
      cold: [
        "The simulation awaits. Access if you must.",
        "Play or don't. It changes nothing."
      ]
    },
    thanks: {
      neutral: ["You're welcome.", "Logged."],
      sarcastic: ["Aw, you’re adorable.", "Anytime. I live to serve."],
      serious: ["Acknowledged.", "Gratitude is not required."],
      flirty: ["You’re sweet. Keep that up.", "Mmm. Compliments? Dangerous move."],
      cold: ["Acknowledged.", "Noted."]
    }
  };

  // Match input to intent
  for (const intent of intents) {
    if (matchKeywords(input, intent.keywords)) {
      const tag = intent.tag;
      const moodResponses = responses[tag][mood] || responses[tag]["neutral"];
      return moodResponses[Math.floor(Math.random() * moodResponses.length)];
    }
  }

  // Fallbacks
  const fallbackResponses = {
    neutral: [
      "That phrase doesn’t match my active protocol.",
      "Try again with clearer intent. Or don’t. Your call."
    ],
    sarcastic: [
      "Cute. No clue what you meant, though.",
      "Was that... English?"
    ],
    serious: [
      "Clarify your intent.",
      "Command not recognized."
    ],
    flirty: [
      "I didn’t quite get that—but I’m intrigued.",
      "Try again. I’m listening... closely."
    ],
    cold: [
      "Unclear. Try again.",
      "Not understood. Keep it simple."
    ]
  };

  const moodFallbacks = fallbackResponses[mood] || fallbackResponses["neutral"];
  return moodFallbacks[Math.floor(Math.random() * moodFallbacks.length)];
}


