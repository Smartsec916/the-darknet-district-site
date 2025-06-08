// Developer tools detection
(function() {
  'use strict';

  let devtools = {
    open: false,
    orientation: null
  };

  const threshold = 160;
  let setInterval_id;

  function detectDevTools() {
    if (window.outerHeight - window.innerHeight > threshold || 
        window.outerWidth - window.innerWidth > threshold) {
      if (!devtools.open) {
        devtools.open = true;
        // Minimal detection without interference
      }
    } else {
      if (devtools.open) {
        devtools.open = false;
      }
    }
  }

  // Start detection
  setInterval_id = setInterval(detectDevTools, 500);

  // Cleanup
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = devtools;
  } else if (typeof window !== 'undefined') {
    window.devtools = devtools;
  }
})();