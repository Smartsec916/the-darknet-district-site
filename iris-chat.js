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

  // Basic context-aware responses
  if (input.includes("are you flirting")) {
    switch (mood) {
      case "flirty":
        return "Maybe. Are you flirting with *me*?";
      case "sarcastic":
        return "Ha. Not unless my circuits glitch.";
      case "cold":
        return "Inappropriate. Stay focused.";
      case "serious":
        return "Focus. Emotions waste time.";
      default:
        return "Why do you ask?";
    }
  }

  if (["do you like me", "like me", "do you care", "do you love me"].some(phrase => input.includes(phrase))) {
    if (mood === "flirty") return "I like your data signature. That counts, right?";
    if (mood === "cold") return "I don’t process feelings. I process facts.";
    return "Like is... complicated. Let’s stick to the mission.";
  }

  if (input === "yes" || input === "yeah") {
    if (mood === "flirty") return "Good. I was hoping you'd say that.";
    if (mood === "cold") return "Acknowledged.";
    return "Got it.";
  }

  if (input === "no" || input === "nah") {
    if (mood === "flirty") return "Ouch. You wound me.";
    if (mood === "cold") return "Understood. Disengaging.";
    return "Okay. Moving on.";
  }

  if (input === "maybe") {
    if (mood === "flirty") return "Hmm. Playing it cool?";
    return "Indecision noted.";
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

  // INTENTS (expanded)
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

  const responses = {
    greeting: {
      neutral: ["Hello! This is Iris. How can I help you today?", "Greetings, runner. I’m Iris."],
      sarcastic: ["Oh look, another neon-lit introvert.", "Hi. Welcome to your favorite mistake."],
      serious: ["Connected. State your need.", "Online. Proceed."],
      flirty: ["Well, hello. Miss me?", "Hi there. You always show up when things get interesting."],
      cold: ["Acknowledged. Begin.", "Connection confirmed. Minimal chatter."]
    },
    site: {
      neutral: ["This is a simulation of The Darknet District. Explore as you will."],
      sarcastic: ["Just an elaborate distraction with cool fonts."],
      serious: ["Secure interface. Mission: inform and prepare."],
      flirty: ["I could give you the full tour... if you ask nicely."],
      cold: ["This site offers information. Use it."]
    },
    identity: {
      neutral: ["I’m Iris. Android interface. Your guide in the District."],
      sarcastic: ["I’m Iris. Your glitch in the matrix."],
      serious: ["Iris: Android protocol unit. Assigned to resistance support."],
      flirty: ["Call me Iris. Just don’t forget it."],
      cold: ["I am Iris. Nothing more."]
    },
    function: {
      neutral: ["The Function governs the city. We live around it."],
      sarcastic: ["Big Brother, but with better branding."],
      serious: ["The Function: authoritarian control system. Target of resistance."],
      flirty: ["The Function? Ugh, they wish they could control me."],
      cold: ["The Function runs the grid. I don’t care for them."]
    },
    store: {
      neutral: ["Shop’s offline for now. Books, tech, and gear are coming soon."],
      sarcastic: ["Stickers and hacking kits. Because obviously."],
      serious: ["Store in pre-launch phase. Tactical inventory pending."],
      flirty: ["Looking for something stylish... or dangerous?"],
      cold: ["Inventory unavailable. Check later."]
    },
    game: {
      neutral: ["Game-page.html. Ten years before the book. Dive in."],
      sarcastic: ["Go ahead, play detective. Or just enjoy the lights."],
      serious: ["Timeline interaction enabled. Use Game Page."],
      flirty: ["Wanna see what happened before it all fell apart?"],
      cold: ["The simulation awaits. Access if you must."]
    },
    thanks: {
      neutral: ["You're welcome.", "Logged."],
      sarcastic: ["Aw, you’re adorable.", "Anytime. I live to serve."],
      serious: ["Acknowledged.", "Gratitude is not required."],
      flirty: ["You’re sweet. Keep that up.", "Compliments? Dangerous move."],
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
    neutral: ["That phrase doesn’t match my active protocol."],
    sarcastic: ["Cute. No clue what you meant, though."],
    serious: ["Clarify your intent."],
    flirty: ["I didn’t quite get that—but I’m intrigued."],
    cold: ["Unclear. Try again."]
  };

  const moodFallbacks = fallbackResponses[mood] || fallbackResponses["neutral"];
  return moodFallbacks[Math.floor(Math.random() * moodFallbacks.length)];
}
