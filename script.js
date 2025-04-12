
// Basic scroll functionality
document.addEventListener('DOMContentLoaded', function() {
  const sections = document.querySelectorAll('section');
  const backToTopButton = document.getElementById("backToTop");

  function checkSectionVisibility() {
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate how much of the section is visible
      const visiblePercentage = Math.min(
        Math.max(
          0,
          Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0)
        ) / windowHeight,
        1
      );
      
      section.style.opacity = visiblePercentage;
    });

    if (backToTopButton) {
      if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        backToTopButton.style.display = "block";
      } else {
        backToTopButton.style.display = "none";
      }
    }
  }

  window.addEventListener('scroll', checkSectionVisibility);
  checkSectionVisibility(); // Initial check
});

function scrollToTop() {
  window.scrollTo({top: 0, behavior: 'smooth'});
}
