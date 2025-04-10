
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
// Cyberpunk loading animation
function showLoading(element) {
  element.classList.add('loading');
  element.innerHTML = '[LOADING...]';
  
  const chars = '01';
  let iteration = 0;
  
  const interval = setInterval(() => {
    element.innerHTML = '[' + Array(8).fill(0).map(() => 
      chars[Math.floor(Math.random() * chars.length)]
    ).join('') + ']';
    
    if(iteration > 10) {
      clearInterval(interval);
      element.classList.remove('loading');
      element.innerHTML = element.dataset.originalText;
    }
    iteration++;
  }, 100);
}

// Add loading effect to all product categories
document.addEventListener('DOMContentLoaded', () => {
  const categories = document.querySelectorAll('.product-category');
  categories.forEach(category => {
    category.addEventListener('mouseenter', () => {
      const title = category.querySelector('h3');
      title.dataset.originalText = title.innerHTML;
      showLoading(title);
    });
  });
});
// Matrix rain effect
function createMatrixRain() {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.zIndex = '-1';
  canvas.style.opacity = '0.1';
  document.body.appendChild(canvas);
  
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  const characters = '01';
  const fontSize = 10;
  const columns = canvas.width / fontSize;
  const drops = Array(Math.floor(columns)).fill(1);
  
  function draw() {
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0F0';
    ctx.font = fontSize + 'px monospace';
    
    for(let i = 0; i < drops.length; i++) {
      const text = characters[Math.floor(Math.random() * characters.length)];
      ctx.fillText(text, i * fontSize, drops[i] * fontSize);
      if(drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }
  
  setInterval(draw, 33);
}

document.addEventListener('DOMContentLoaded', createMatrixRain);
