
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
