function scrollToTop() {
  window.scrollTo({top: 0, behavior: 'smooth'});
}

// Featured Products
document.addEventListener('DOMContentLoaded', function() {
  const featuredProducts = [
    {
      name: "Flipper Zero",
      image: "attached_assets/top.png",
      link: "store-electronics.html"
    },
    {
      name: "HOLOSUN Digital Reflex Thermal Sight",
      image: "attached_assets/HOLOSUN Digital Reflex Thermal Sight.jpg",
      link: "store-electronics.html"
    },
    {
      name: "GRAYL Water Purifier",
      image: "attached_assets/GRAYL UltraPress 16.9 oz Water Purifier.jpg",
      link: "store-survival.html"
    },
    {
      name: "Morakniv Companion",
      image: "attached_assets/Morakniv Companion Fixed Blade.jpg",
      link: "store-survival.html"
    },
    {
      name: "BLACK DIAMOND Storm Headlamp",
      image: "attached_assets/BLACK DIAMOND Storm 500-R Rechargeable LED Headlamp.jpg",
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
      currentIndex = (currentIndex + 2) % featuredProducts.length;
    }

    showProducts();
    setInterval(showProducts, 5000);
  }
});

function toggleChat() {
  const container = document.getElementById('chatContainer');
  container.style.display = container.style.display === 'none' ? 'block' : 'none';
}

async function sendMessage() {
  const input = document.getElementById('messageInput');
  const message = input.value.trim();

  if (!message) return;

  addMessage(message, true);
  input.value = '';

  try {
    const response = await fetch('/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    });

    const data = await response.json();
    addMessage(data.response, false);
  } catch (error) {
    addMessage('Neural interface disrupted. Please try again.', false);
  }
}

function handleKeyPress(event) {
  if (event.key === 'Enter') {
    sendMessage();
  }
}

function addMessage(text, isUser) {
  const messages = document.getElementById('chatMessages');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
  messageDiv.textContent = text;
  messages.appendChild(messageDiv);
  messages.scrollTop = messages.scrollHeight;
}