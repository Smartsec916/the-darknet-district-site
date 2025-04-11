
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

// Handle chat iframe expansion
window.addEventListener('message', function(event) {
  const chatIframe = document.querySelector('.chat-iframe');
  if (event.data === 'expand') {
    chatIframe.classList.add('expanded');
  } else if (event.data === 'collapse') {
    chatIframe.classList.remove('expanded');
  }
});
