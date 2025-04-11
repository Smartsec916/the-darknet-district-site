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

// Simplified chat implementation
document.addEventListener('DOMContentLoaded', function() {
  const chatIframe = document.querySelector('.chat-iframe');

  if (!chatIframe) return;

  window.addEventListener('message', async function(event) {
    if (event.origin !== 'https://iris-smartsec916.replit.app') return;

    try {
      if (!event.data || !event.data.message) return;

      const response = await fetch('https://iris-smartsec916.replit.app/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: event.data.message })
      });

      const data = await response.json();

      chatIframe.contentWindow.postMessage({
        type: 'response',
        response: data.response || 'Sorry, I could not process that request.'
      }, 'https://iris-smartsec916.replit.app');

    } catch (error) {
      console.error('Chat error:', error);
      chatIframe.contentWindow.postMessage({
        type: 'error',
        error: 'Failed to process message'
      }, 'https://iris-smartsec916.replit.app');
    }
  });
});