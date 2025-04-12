
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
  // Simple response system
  const responses = {
    'hello': 'Hello! Welcome to the Darknet District.',
    'hi': 'Hi there! How can I help you?',
    'help': 'I can help you navigate the District. What would you like to know?',
    'default': "I'm here to assist you with the Darknet District."
  };

  message = message.toLowerCase().trim();
  return responses[message] || responses.default;
}
