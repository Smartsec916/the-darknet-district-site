function scrollToTop() {
  window.scrollTo({top: 0, behavior: 'smooth'});
}

// Featured Products
document.addEventListener('DOMContentLoaded', function() {
  const featuredProducts = [
    {
      name: "Flipper Zero",
      image: "attached_assets/Flipper_Zero.jpg",
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
    featuredProducts.forEach(product => {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.innerHTML = `
        <h3>${product.name}</h3>
        <img src="${product.image}" alt="${product.name}" style="max-width: 200px; margin: 10px auto;">
        <a href="${product.link}" class="button">Learn More</a>
      `;
      featuredGrid.appendChild(card);
    });
  }
});