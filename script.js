// Banner rotation functionality
if (typeof window.bannerInitialized === 'undefined') {
  window.bannerInitialized = true;
  window.banners = [
    {
      image: "/attached_assets/881f5832-0a1e-4079-8a66-fbc2c6479931._CR0,0,3000,600_SX3000_.jpg",
      link: "https://mosequipment.com/"
    },
    {
      image: "/attached_assets/cyberpunk_game.jpg",
      link: "https://www.cdprojektred.com/en"
    },
    {
      image: "/attached_assets/epsiloncircle_420_Dark_cyberpunk_cityscape_at_night_glowing_neo_0ca6182c-0ff0-4948-bdfd-a6f406667165.png",
      link: "#",
      style: "height: 600px; object-fit: cover;"
    }
  ];
  window.currentBanner = 0;
}

function initializeBannerRotation() {
  const imageEl = document.getElementById("affiliate-image");
  const linkEl = document.getElementById("affiliate-link");
  const glitchEl = document.getElementById("glitch-effect");
  
  if (!imageEl || !linkEl || !glitchEl) return;

  function glitchEffect() {
    glitchEl.innerHTML = '';
    for (let i = 0; i < 4; i++) {
      const bar = document.createElement("div");
      bar.style.position = "absolute";
      bar.style.left = "0";
      bar.style.width = "100%";
      bar.style.height = `${Math.random() * 4 + 2}px`;
      bar.style.top = `${Math.random() * 100}%`;
      bar.style.background = "#00ff9d";
      bar.style.opacity = "0.15";
      bar.style.animation = `glitchMove 0.3s ease-out forwards`;
      glitchEl.appendChild(bar);
    }
    setTimeout(() => glitchEl.innerHTML = '', 400);
  }

  function rotateBanner() {
    imageEl.style.opacity = 0;
    imageEl.style.boxShadow = 'none';

    setTimeout(() => {
      const banner = banners[currentBanner];
      imageEl.src = banner.image;
      linkEl.href = banner.link;
      if (banner.style) {
        Object.assign(imageEl.style, banner.style);
      }
      glitchEffect();
      imageEl.style.opacity = 1;
      imageEl.style.boxShadow = '0 0 20px #00ff9d';

      currentBanner = (currentBanner + 1) % banners.length;
    }, 500);
  }

  rotateBanner();
  setInterval(rotateBanner, 8000);
}

// Basic scroll functionality
document.addEventListener('DOMContentLoaded', function() {
  const sections = document.querySelectorAll('section');
  const backToTopButton = document.getElementById("backToTop");

  function checkSectionVisibility() {
    sections.forEach(section => {
      // Skip iframe container
      if (section.contains(document.querySelector('iframe'))) {
        return;
      }
      
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

// Chat functionality is handled by the iframe