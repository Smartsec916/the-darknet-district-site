
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
      
      if (data.type === 'chat-message') {
        const response = await sendChatMessage(data.message);
        chatIframe.contentWindow.postMessage({
          type: 'chat-response',
          response: response
        }, 'https://iris-smartsec916.replit.app');
      }
    } catch (error) {
      console.error('Chat error:', error);
      chatIframe.contentWindow.postMessage({
        type: 'chat-error',
        error: 'Failed to process message'
      }, 'https://iris-smartsec916.replit.app');
    }
  });
});

async function sendChatMessage(message) {
  const response = await fetch('https://iris-smartsec916.replit.app/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message }),
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  const data = await response.json();
  return data.response;
}
