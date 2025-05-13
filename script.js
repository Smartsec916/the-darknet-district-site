
// Shopify Buy SDK
var scriptURL = 'https://sdks.shopifycdn.com/buy-button-storefront/latest/buy-button-storefront.min.js';
var client;
var ui;

function loadShopifyBuySDK() {
  if (window.ShopifyBuy) {
    initBuyClient();
  } else {
    var script = document.createElement('script');
    script.async = true;
    script.src = scriptURL;
    script.onload = initBuyClient;
    document.getElementsByTagName('head')[0].appendChild(script);
  }
}

function initBuyClient() {
  client = ShopifyBuy.buildClient({
    domain: 'YOUR-SHOPIFY-STORE.myshopify.com', // Replace with your store domain
    storefrontAccessToken: 'YOUR-STOREFRONT-ACCESS-TOKEN' // You'll get this from Shopify Admin
  });
  
  ShopifyBuy.UI.onReady(client).then(function (ui) {
    ui.createComponent('cart', {
      moneyFormat: '%24%7B%7Bamount%7D%7D',
      cart: {
        popup: false,
        startOpen: false,
        styles: {
          button: {
            'background-color': '#00ff9d',
            'color': 'black',
            ':hover': {
              'background-color': '#00cc7a'
            }
          }
        }
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', function() {
  loadShopifyBuySDK();
  // Keep existing initialization
  if(typeof initializeBannerRotation === 'function') {
    initializeBannerRotation();
  }
});

// Banner rotation functionality
if (typeof window.bannerInitialized === 'undefined') {
  window.bannerInitialized = true;
  window.banners = [
    {
      image: "./attached_assets/mission_darkness_banner.jpg",
      link: "https://mosequipment.com/"
    },
    {
      image: "./attached_assets/cyberpunk_game.jpg",
      link: "https://www.cdprojektred.com/en"
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
      glitchEffect();
      imageEl.style.opacity = 1;
      imageEl.style.boxShadow = '0 0 20px #00ff9d';

      currentBanner = (currentBanner + 1) % banners.length;
    }, 500);
  }

  rotateBanner();
  setInterval(rotateBanner, 8000);
}

// Featured Products functionality
const products = [
  // Electronics
  {
    name: "Flipper Zero",
    image: "./attached_assets/on_orange.png",
    description: "Portable multi-tool for hackers and geeks.",
    link: "store-electronics.html"
  },
  // Survival Gear
  {
    name: "HOLOSUN Digital Reflex Thermal Sight",
    image: "attached_assets/HOLOSUN Digital Reflex Thermal Sight.jpg",
    description: "Advanced thermal optics for tactical situations.",
    link: "store-survival.html"
  },
  {
    name: "Streamlight TLR-8 HL-X",
    image: "attached_assets/Streamlight 69467 TLR-8 HL-X sub USB 1000-Lumen Weapon Rail-Mounted Rechargeable Tactical Flashlight.jpg",
    description: "1000-Lumen tactical weapon light.",
    link: "store-survival.html"
  },
  {
    name: "Mission Darkness Faraday Bag",
    image: "attached_assets/Mission Darkness Dry Shield Faraday Phone Sleeve.jpg",
    description: "Military-grade Faraday bag for secure device storage.",
    link: "store-survival.html"
  },
  // Apparel
  {
    name: "Admin Surveillance T-Shirt",
    image: "attached_assets/unisex-staple-t-shirt-black-front-6802b3d593026.png",
    description: "Wear the resistance. This isn't just a shirt — it's a statement.",
    link: "store-apparel.html"
  },
  {
    name: "Zen Zephyr T-Shirt",
    image: "attached_assets/zen-zephyr-shirt_front.png",
    description: "Drift through the chaos with calm precision.",
    link: "store-apparel.html"
  },
  // Apps
  {
    name: "Kai Kryptos App",
    image: "attached_assets/kai-kryptos-icon.png",
    description: "Cyberpunk terminal for decrypted log access.",
    link: "store-apps.html"
  }
];

function getRandomProducts(count) {
  const seed = Math.floor(new Date().getTime() / (1000 * 60 * 60 * 24)); // Changes daily
  const shuffled = [...products];
  
  // Fisher-Yates shuffle with seeded random
  for (let i = shuffled.length - 1; i > 0; i--) {
    const seededRandom = ((i * seed) % shuffled.length);
    [shuffled[i], shuffled[seededRandom]] = [shuffled[seededRandom], shuffled[i]];
  }
  
  return shuffled.slice(0, count);
}

let featuredProducts;

function displayFeaturedProducts() {
  const container = document.getElementById('featured-products');
  if (!container) return;

  let currentIndex = 0;

  function updateProducts() {
    const startIndex = currentIndex;
    const productsToShow = [
      products[startIndex],
      products[(startIndex + 1) % products.length]
    ];

    container.innerHTML = productsToShow.map(product => `
      <div class="product-card" style="opacity: 0; transform: translateY(10px); transition: opacity 0.5s ease, transform 0.5s ease;">
        <img src="${product.image}" alt="${product.name}">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <a href="${product.link}" class="button">Learn More</a>
      </div>
    `).join('');

    // Trigger glitch effect and fade-in
    setTimeout(() => {
      const cards = container.querySelectorAll('.product-card');
      cards.forEach(card => {
        const glitchEl = document.createElement('div');
        glitchEl.style.position = 'absolute';
        glitchEl.style.inset = '0';
        glitchEl.style.zIndex = '1';
        card.style.position = 'relative';
        card.appendChild(glitchEl);

        // Create glitch bars
        for (let i = 0; i < 4; i++) {
          const bar = document.createElement('div');
          bar.style.position = 'absolute';
          bar.style.left = '0';
          bar.style.width = '100%';
          bar.style.height = `${Math.random() * 4 + 2}px`;
          bar.style.top = `${Math.random() * 100}%`;
          bar.style.background = '#00ff9d';
          bar.style.opacity = '0.15';
          glitchEl.appendChild(bar);
        }

        // Fade in the card
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';

        // Clean up glitch effect
        setTimeout(() => {
          glitchEl.remove();
        }, 400);
      });
    }, 50);

    currentIndex = (currentIndex + 2) % products.length;
  }

  updateProducts();
  setInterval(updateProducts, 15000);
}

// Basic scroll functionality
document.addEventListener('DOMContentLoaded', function() {
  displayFeaturedProducts();
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