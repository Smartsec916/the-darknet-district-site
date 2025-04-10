
async function getResponse(message) {
  const responses = [
    "Hello! How can I help you today?",
    "That's interesting! Tell me more.",
    "I understand. Please continue.",
    "How does that make you feel?",
    "Could you elaborate on that?",
    "I see. What happened next?",
    "That's fascinating! What do you think about it?",
    "Tell me more about your experience.",
    "I'm here to listen. Please go on.",
    "What are your thoughts on that?"
  ];
  
  // Simple greeting detection
  if (message.toLowerCase().includes('hello') || 
      message.toLowerCase().includes('hi') || 
      message.toLowerCase().includes('hey')) {
    return "Hello! How can I help you today?";
  }
  
  return responses[Math.floor(Math.random() * responses.length)];
}
