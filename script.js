// Basic scroll functionality
document.addEventListener('DOMContentLoaded', function() {
  const sections = document.querySelectorAll('section');
  const backToTopButton = document.getElementById("backToTop");

  function checkSectionVisibility() {
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Calculate visibility based on section position
      const sectionTop = rect.top;
      const sectionHeight = rect.height;
      const viewportCenter = windowHeight / 2;

      // Calculate opacity based on distance from viewport center
      let visiblePercentage;
      if (sectionTop < viewportCenter && sectionTop > -sectionHeight) {
        visiblePercentage = 1 - Math.abs(sectionTop - viewportCenter) / (sectionHeight);
      } else {
        visiblePercentage = 0;
      }

      visiblePercentage = Math.min(Math.max(visiblePercentage, 0), 1);
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