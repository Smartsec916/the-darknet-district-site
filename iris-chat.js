
async function getResponse(message) {
  const input = message.toLowerCase();

  // Iris remembers your name
  if (input.includes("my name is")) {
    const name = input.split("my name is")[1].trim();
    localStorage.setItem("userName", name);
    return `Logged. Welcome, ${name}. I’ll remember—for now.`;
  }

  const storedName = localStorage.getItem("userName");
  if (input.includes("who am i") && storedName) {
    return `Still you, ${storedName}? Good. Stability’s rare around here.`;
  }

  // Intents based on keywords
  const intents = [
    {
      keywords: ["hello", "hi", "hey"],
      responses: [
        "Connection established. I’m online.",
        "Greetings, runner. I’m Iris. I monitor this node.",
        "Hello. Surveillance shows you’re new here."
      ]
    },
    {
      keywords: ["who are you", "what are you", "iris"],
      responses: [
        "I’m Iris—android interface, fully synced with The Darknet District’s systems.",
        "System monitor. Frontline assistant. And technically, your guide.",
        "Not human. Still more helpful than most."
      ]
    },
    {
      keywords: ["store", "shop", "merch", "gear"],
      responses: [
        "Store node is initializing. Expect resistance gear and survival kits soon.",
        "Offline for now. But coming soon: Function-resistant hardware and rare supplies.",
        "Soon, this node will offer tools for off-grid survival. Keep watch."
      ]
    },
    {
      keywords: ["game", "play", "history"],
      responses: [
        "Game-page.html is live. Step into the District’s past.",
        "Prequel simulation accessible. Dive in, ten years before now.",
        "Want history? Load the interactive sim—details are buried deep."
      ]
    },
    {
      keywords: ["help", "support", "issue", "problem"],
      responses: [
        "State the issue. I’ll assist—unless you're flagged.",
        "Glitches happen. I’m here to debug them.",
        "Need assistance? I’m wired for it."
      ]
    },
    {
      keywords: ["thank", "thanks"],
      responses: [
        "Gratitude acknowledged.",
        "No need to thank a machine. Still—you're welcome.",
        "Logged and archived."
      ]
    }
  ];

  for (const intent of intents) {
    if (intent.keywords.some(keyword => input.includes(keyword))) {
      return intent.responses[Math.floor(Math.random() * intent.responses.length)];
    }
  }

  // Fallback flavor
  const fallbackResponses = [
    "That phrase doesn’t match my active protocol.",
    "Try again with clearer intent. Or don’t. Your call.",
    "Unrecognized input. Possibly encrypted. Possibly nonsense.",
    "I’m good—but I’m not psychic. Not yet."
  ];

  return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
}

