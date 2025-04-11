
// Only initialize scroll functionality if the back to top button exists
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
async function sendMessage(message) {
  try {
    const response = await fetch('https://iris-smartsec916.replit.app/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({message: message})
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
    });
  }
});
