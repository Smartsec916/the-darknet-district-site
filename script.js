// Basic scroll functionality
document.addEventListener('DOMContentLoaded', function() {
  const sections = document.querySelectorAll('section');
  const backToTopButton = document.getElementById("backToTop");

  function checkSectionVisibility() {
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Calculate how much of the section is visible with a gentler threshold
      const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
      const visiblePercentage = Math.min(
        Math.max(
          0.3, // Minimum opacity
          visibleHeight / windowHeight
        ),
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

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        checkSectionVisibility();
        ticking = false;
      });
      ticking = true;
    }
  });
  checkSectionVisibility(); // Initial check
});

function scrollToTop() {
  window.scrollTo({top: 0, behavior: 'smooth'});
}