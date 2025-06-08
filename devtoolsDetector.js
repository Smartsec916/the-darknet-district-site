
// 🔍 DevTools Detection Module for Iris
// Detects when users open Developer Tools and notifies the backend

function notifyBackendOfInspect() {
  // Get the current session ID from chat manager
  const sessionId = window.chatManager?.sessionId || localStorage.getItem("chatSessionId");
  
  if (!sessionId) return;

  fetch("/api/chat/message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: sessionId,
      message: "[user triggered inspect]",
    }),
  }).catch(() => {
    // Silent fail - don't break the user experience
  });
}

// Repeatedly checks if DevTools are open by measuring debugger delay
function detectDevToolsLoop() {
  let alreadyTriggered = false;

  setInterval(() => {
    const start = performance.now();
    debugger;
    const duration = performance.now() - start;

    // If debugger takes longer than 100ms, DevTools are likely open
    if (duration > 100 && !alreadyTriggered) {
      alreadyTriggered = true;
      console.log("🔍 Iris: DevTools detected - trust level decreased");
      notifyBackendOfInspect();
    }

    // Reset if tools are closed (debugger executes quickly)
    if (duration < 50) {
      alreadyTriggered = false;
    }
  }, 2000); // Check every 2 seconds
}

// Additional detection methods for extra coverage
function detectDevToolsAlternative() {
  let devtools = { open: false, orientation: null };
  
  setInterval(() => {
    if (window.outerHeight - window.innerHeight > 200 || 
        window.outerWidth - window.innerWidth > 200) {
      if (!devtools.open) {
        devtools.open = true;
        notifyBackendOfInspect();
      }
    } else {
      devtools.open = false;
    }
  }, 1000);
}

// Initialize detection when page loads
window.addEventListener("load", () => {
  // Small delay to ensure chat manager is initialized
  setTimeout(() => {
    detectDevToolsLoop();
    detectDevToolsAlternative();
  }, 1000);
});

// Export for potential use by other modules
window.devtoolsDetector = {
  notifyBackendOfInspect: notifyBackendOfInspect
};ect
};
