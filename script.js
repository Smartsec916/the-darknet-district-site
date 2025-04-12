// Basic scroll functionality
document.addEventListener('DOMContentLoaded', function() {
  const backToTopButton = document.getElementById("backToTop");

  if (backToTopButton) {
    window.onscroll = function() {
      if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        backToTopButton.style.display = "block";
      } else {
        backToTopButton.style.display = "none";
      }
    };
  }
});

function scrollToTop() {
  window.scrollTo({top: 0, behavior: 'smooth'});
}

function insertIrisGreeting() {
  const mood = localStorage.getItem("irisMood") || "neutral";

  const moodGreetings = {
    neutral: [
      "Connection secured. I'm online.",
      "You're linked to my node. Ask if you need something.",
      "Terminal active. I'm listening."
    ],
    flirty: [
      "Well hey there, you found me.",
      "Back already? I was hoping you'd connect.",
      "Hey. I was starting to miss your signal."
    ],
    cold: [
      "Node open. Speak with purpose.",
      "You're connected. Don't waste time.",
      "Minimal chatter. Proceed."
    ],
    sarcastic: [
      "Oh, it's you. This'll be fun.",
      "You again? Don't make me regret it.",
      "Welcome to the dark corner of the net. Try not to break anything."
    ],
    serious: [
      "Connection active. Let's keep this tight.",
      "We're live. What's your objective?",
      "You're in. Let's get to it."
    ]
  };

  const greetings = moodGreetings[mood] || moodGreetings["neutral"];
  const greetingMessage = greetings[Math.floor(Math.random() * greetings.length)];

  const chatMessages = document.querySelector('.chat-messages');
  const irisGreeting = document.createElement('div');
  irisGreeting.className = 'message iris';
  irisGreeting.textContent = '';

  chatMessages.appendChild(irisGreeting);

  let i = 0;
  const typingInterval = setInterval(() => {
    if (i < greetingMessage.length) {
      irisGreeting.textContent += greetingMessage[i];
      chatMessages.scrollTop = chatMessages.scrollHeight;
      i++;
    } else {
      clearInterval(typingInterval);
    }
  }, 40);
}

// New chat implementation
document.addEventListener('DOMContentLoaded', function() {
  const chatIframe = document.querySelector('.chat-iframe');

  if (!chatIframe) return;

  // Listen for messages from the iframe
  window.addEventListener('message', async function(event) {
    if (event.origin !== 'https://iris-smartsec916.replit.app') return;

    try {
      const data = event.data;
      console.log('Received message:', data);

      if (data.type === 'chat-message' && data.message) {
        const response = await sendChatMessage(data.message);
        console.log('Sending response:', response);

        if (response) {
          chatIframe.contentWindow.postMessage({
            type: 'chat-response',
            response: response
          }, 'https://iris-smartsec916.replit.app');
        } else {
          throw new Error('Empty response received');
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      chatIframe.contentWindow.postMessage({
        type: 'chat-error',
        error: 'Failed to process message. Please try again.'
      }, 'https://iris-smartsec916.replit.app');
    }
  });
});

async function sendChatMessage(message) {
  try {
    const responses = {
      'hello': 'Hi there! I am Iris, welcome to the Darknet District.',
      'hi': 'Hello! How can I assist you today?',
      'hey': 'Hey! Welcome to the District.',
      'who are you': 'I am Iris, an android assistant in the Darknet District.',
      'what is this': 'This is the Darknet District - a hidden digital stronghold.',
      'help': 'I can help you navigate the District. Would you like to know about our games or shop?',
      'games': 'You can check out our games section for some cyberpunk action.',
      'shop': 'The District shop is currently under construction, but will be opening soon.',
      'bye': 'Goodbye! Stay safe in the District.',
      'default': 'I am here to assist you in the Darknet District. Feel free to ask about our games or shop.'
    };

    message = message.toLowerCase().trim();
    return responses[message] || responses.default;
  } catch (error) {
    console.error('Chat error:', error);
    return 'System malfunction. Please try again.';
  }
}