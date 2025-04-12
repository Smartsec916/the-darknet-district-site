
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
  const CHAT_API_URL = 'https://iris-smartsec916.replit.app/chat';
  
  try {
    if (!message || typeof message !== 'string') {
      throw new Error('Invalid message format');
    }

    const response = await fetch(CHAT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ message: message.trim() }),
      credentials: 'include',
      timeout: 10000 // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data || typeof data.response !== 'string') {
      throw new Error('Invalid response format from server');
    }
    
    return data.response;
  } catch (error) {
    console.error('Chat API error:', error);
    return 'Sorry, I encountered an error. Please try again.';
  }
}
