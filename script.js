
// Scroll functionality
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

// Chat functionality
window.addEventListener('message', function(event) {
  if (event.origin === 'https://iris-smartsec916.replit.app') {
    console.log('Received message:', event.data);
    handleChatMessage(event.data);
  }
});

function handleChatMessage(message) {
  if (message && message.type === 'chat') {
    sendMessage(message.content)
      .then(response => {
        const chatIframe = document.querySelector('.chat-iframe');
        if (chatIframe && chatIframe.contentWindow) {
          chatIframe.contentWindow.postMessage({ type: 'response', content: response }, 'https://iris-smartsec916.replit.app');
        }
      })
      .catch(error => console.error('Chat error:', error));
  }
}

async function sendMessage(message) {
  try {
    const response = await fetch('https://iris-smartsec916.replit.app/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: message }),
      credentials: 'include'
    });
    
    const data = await response.json();
    if (data.response) {
      return data.response;
    } else if (data.error) {
      console.error('Error:', data.error);
      return 'Sorry, I encountered an error. Please try again.';
    }
  } catch (error) {
    console.error('Fetch error:', error);
    return 'Sorry, I encountered a connection error. Please try again.';
  }
}

// Initialize chat when iframe loads
document.addEventListener('DOMContentLoaded', function() {
  const chatIframe = document.querySelector('.chat-iframe');
  if (chatIframe) {
    chatIframe.addEventListener('load', function() {
      console.log('Chat iframe loaded');
      // Send ready message to iframe
      chatIframe.contentWindow.postMessage({ type: 'ready' }, 'https://iris-smartsec916.replit.app');
    });
  }
});
