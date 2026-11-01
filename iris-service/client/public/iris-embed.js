/**
 * Iris Chat Interface Embedding Script
 * This script helps host websites embed Iris securely
 */

(function() {
  // Configuration
  const IRIS_URL = 'https://iris-chat-interface-smartsec916.replit.app/';
  const CONTAINER_ID = 'iris-chat-container';
  const IFRAME_ID = 'iris-chat-frame';
  
  // Create container and iframe if they don't exist
  function initIrisChat() {
    // Check if container already exists
    if (document.getElementById(CONTAINER_ID)) {
      return; // Already initialized
    }
    
    // Create main container
    const container = document.createElement('div');
    container.id = CONTAINER_ID;
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.zIndex = '100001';
    container.style.width = '60px'; // Start with just the button visible
    container.style.height = '60px';
    container.style.transition = 'all 0.3s ease-in-out';
    
    // Create the iframe with proper attributes
    const iframe = document.createElement('iframe');
    iframe.id = IFRAME_ID;
    iframe.src = IRIS_URL;
    iframe.style.width = '400px';
    iframe.style.height = '600px';
    iframe.style.border = 'none';
    iframe.style.background = 'transparent';
    iframe.style.position = 'absolute';
    iframe.style.bottom = '0';
    iframe.style.right = '0';
    iframe.style.visibility = 'visible';
    iframe.style.opacity = '1';
    iframe.style.transition = 'all 0.3s ease-in-out';
    iframe.allow = 'microphone; camera; clipboard-read; clipboard-write';
    iframe.setAttribute('referrerpolicy', 'no-referrer');
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups');
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('importance', 'high');
    iframe.setAttribute('title', 'Iris AI Assistant');
    iframe.setAttribute('crossorigin', 'anonymous');
    
    // Add to DOM
    container.appendChild(iframe);
    document.body.appendChild(container);
    
    // Set up message listening for iframe communication
    window.addEventListener('message', function(event) {
      // Only accept messages from the Iris iframe
      if (event.origin !== new URL(IRIS_URL).origin) {
        return;
      }
      
      // Handle messages from the iframe
      if (event.data === 'iris-loaded') {
        console.log('Iris chat interface loaded successfully');
      }
    });
    
    // Periodically check if the iframe is still accessible
    const healthCheck = setInterval(function() {
      try {
        // Try to ping the iframe - if this fails due to CORS, the iframe may have loaded
        // but we won't be able to communicate with it (that's okay)
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage('ping-iris-frame', '*');
        }
      } catch (e) {
        // Ignore cross-origin errors, which are expected
        if (!e.toString().includes('cross-origin')) {
          console.error('Iris chat health check error:', e);
        }
      }
    }, 5000);
    
    return { iframe, container, healthCheck };
  }
  
  // Initialize when the DOM is fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIrisChat);
  } else {
    initIrisChat();
  }
})();