function scrollToTop() {
  window.scrollTo({top: 0, behavior: 'smooth'});
}

// Featured Products
document.addEventListener('DOMContentLoaded', function() {
  const featuredProducts = [
    {
      name: "Flipper Zero",
      image: "attached_assets/top.png",
      link: "https://shop.flipperzero.one"
    },
    {
      name: "HOLOSUN Digital Reflex Sight",
      image: "attached_assets/HOLOSUN Digital Reflex Thermal Sight.jpg",
      link: "store-electronics.html"
    },
    {
      name: "GRAYL Water Purifier",
      image: "attached_assets/GRAYL UltraPress 16.9 oz Water Purifier.jpg",
      link: "store-survival.html"
    }
  ];

  const featuredGrid = document.getElementById('featured-products');
  if (featuredGrid) {
    let currentIndex = 0;
    
    function showProducts() {
      featuredGrid.innerHTML = '';
      for(let i = 0; i < 2; i++) {
        const product = featuredProducts[(currentIndex + i) % featuredProducts.length];
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
          <h3>${product.name}</h3>
          <img src="${product.image}" alt="${product.name}" style="max-width: 200px; margin: 10px auto;">
          <a href="${product.link}" class="button">Learn More</a>
        `;
        featuredGrid.appendChild(card);
      }
      currentIndex = (currentIndex + 1) % featuredProducts.length;
    }

    showProducts();
    setInterval(showProducts, 5000);
  }
});