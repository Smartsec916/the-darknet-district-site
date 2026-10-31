import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/crt.css";
import "./styles/cyberpunk-effects.css";
import { patchViteHMR } from "./lib/errorHandling";

// Apply Vite HMR error handling patches
patchViteHMR();

// Global unhandled rejection handler
window.addEventListener('unhandledrejection', (event) => {
  // Extract error details
  const error = event.reason;
  const errorString = String(error || '');
  
  // Check if this is a DOMException (storage, clipboard, etc.)
  const isDOMException = error instanceof DOMException || 
                        errorString.includes('DOMException') || 
                        errorString.includes('storage') || 
                        errorString.includes('localStorage') || 
                        errorString.includes('sessionStorage') ||
                        errorString.includes('quota');
  
  // Check if this is a Vite HMR related error which can be safely ignored
  const isViteHmrError = 
    errorString.includes('[vite]') || 
    errorString.includes('WebSocket') || 
    errorString.includes('socket') ||
    errorString.includes('network') ||
    errorString.includes('cors') ||
    errorString.includes('connecting') ||
    errorString.includes('Failed to fetch') ||
    error === null || 
    typeof error === 'undefined';
  
  // Handle known error types
  if (isDOMException) {
    console.log('Storage or DOM API issue handled silently:', errorString.slice(0, 150));
    event.preventDefault(); // Suppress the error
    return;
  }
  
  // Only log errors that aren't related to Vite HMR
  if (!isViteHmrError) {
    console.error('UNHANDLED PROMISE REJECTION:', error);
  }
  
  // Prevent the error from showing in the console if it's a known Vite issue
  if (isViteHmrError) {
    event.preventDefault();
  }
});

// Handle cross-origin communication for embedding
// This tells browsers that it's safe to embed this content
try {
  // Add a cross-origin message listener to improve iframe embedding
  window.addEventListener('message', (event) => {
    // Check if this is a ping to verify the iframe is loaded
    if (event.data === 'ping-iris-frame') {
      // Respond to let the parent know we're here
      if (event.source && typeof event.source.postMessage === 'function') {
        event.source.postMessage('iris-frame-ready', '*');
      }
    }
  });

  // Post a message to the parent to indicate we're ready
  // This helps the parent know when the iframe is fully loaded
  if (window.parent !== window) {
    // This indicates we're in an iframe
    window.parent.postMessage('iris-loaded', '*');
  }
} catch (error) {
  console.log('Cross-origin communication setup error:', error);
}

// Use React 18 createRoot API
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// === Iris Inspect Detection and Glitch Storm Trigger ===
function sendIrisTrigger(type: string): void {
  // Get sessionId with error handling for localStorage access restrictions
  let sessionId: string | null = null;
  
  try {
    sessionId = localStorage.getItem("chatSessionId");
  } catch (storageError) {
    console.log("localStorage access error handled:", storageError);
    // Continue with sessionId as null - feature will degrade gracefully
  }
  
  if (!sessionId) return;

  fetch("/api/chat/message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      message: `[user triggered ${type}]`
    })
  })
  .catch((e) => {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    console.log(`Failed to send security trigger: ${errorMessage}`);
  });
}

let triggered = {
  inspect: false,
  resize: false,
  console: false
};

function checkForFullBreach(): void {
  // Only proceed if all security triggers have been activated
  if (triggered.inspect && triggered.resize && triggered.console) {
    try {
      // Use Promise with catch to handle potential async errors
      Promise.resolve().then(() => {
        // Send the full breach trigger with its own error handling
        return sendIrisTrigger("full breach");
      }).catch(error => {
        console.log("Full breach trigger error handled:", error);
      }).finally(() => {
        // Always attempt to add the glitch effect class, even if the trigger fails
        try {
          document.body.classList.add("glitch-storm");
        } catch (classError) {
          console.log("Failed to add glitch effect:", classError);
        }
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(`Failed to handle full breach: ${errorMessage}`);
    }
  }
}

// Option 1: debugger timing trap - optimized to run less frequently and use less resources
// Use a smaller number of checks in non-production environments to reduce console noise
let debuggerCheckCounter = 0;
const MAX_DEBUGGER_CHECKS = 5; // Reduced count to minimize console noise during development
const INTERVAL_TIME = 5000; // Increased interval to further reduce performance impact

// Wrap the debugger check in a try/catch to prevent unhandled promise rejections
try {
  const debuggerCheckInterval = setInterval(() => {
    try {
      // Only run a limited number of checks if no trigger detected yet
      if (debuggerCheckCounter >= MAX_DEBUGGER_CHECKS && !triggered.inspect) {
        clearInterval(debuggerCheckInterval);
        return;
      }
      
      const before = new Date().getTime();
      debugger;
      const after = new Date().getTime();
      
      if (after - before > 100 && !triggered.inspect) {
        triggered.inspect = true;
        sendIrisTrigger("inspect");
        checkForFullBreach();
        clearInterval(debuggerCheckInterval); // Stop checking once triggered
      }
      
      debuggerCheckCounter++;
    } catch (error) {
      // Silently handle errors in the interval function
      console.log("Debug check error handled:", error);
      clearInterval(debuggerCheckInterval);
    }
  }, INTERVAL_TIME);
} catch (error) {
  // Handle any errors from setting up the interval itself
  console.log("Debug trap setup error handled:", error);
}

// Option 2: resize trap - optimized with debounce and better error handling
let resizeTimeout: number | null = null;
let resizeChecks = 0;
const MAX_RESIZE_CHECKS = 10; // Reduced for less overhead during development

// Add a more efficient resize listener with debounce and better error handling
const handleResize = () => {
  try {
    // Limit checks to prevent excessive processing
    if (resizeChecks >= MAX_RESIZE_CHECKS || triggered.resize) {
      window.removeEventListener("resize", handleResize);
      return;
    }
    
    // Clear any existing timeout
    if (resizeTimeout) {
      window.clearTimeout(resizeTimeout);
    }
    
    // Debounce to avoid excessive calculations
    resizeTimeout = window.setTimeout(() => {
      try {
        const wDiff = window.outerWidth - window.innerWidth;
        const hDiff = window.outerHeight - window.innerHeight;
        
        if ((wDiff > 100 || hDiff > 100) && !triggered.resize) {
          triggered.resize = true;
          // Wrap in a promise catch to prevent unhandled rejection
          Promise.resolve().then(() => sendIrisTrigger("resize")).catch(err => 
            console.log("Resize trigger error handled:", err)
          );
          checkForFullBreach();
          window.removeEventListener("resize", handleResize); // Stop listening once triggered
        }
        
        resizeChecks++;
      } catch (error) {
        console.log("Resize calculation error handled:", error);
      }
    }, 300); // Increased debounce time
  } catch (error) {
    console.log("Resize handler error handled:", error);
  }
};

try {
  window.addEventListener("resize", handleResize);
} catch (error) {
  console.log("Failed to add resize listener:", error);
}

// Option 3: console access trap with improved error handling
try {
  Object.defineProperty(console, "_commandLineAPI", {
    get() {
      if (!triggered.console) {
        triggered.console = true;
        // Use promise with catch to prevent unhandled rejections
        Promise.resolve().then(() => {
          sendIrisTrigger("inspect");
          checkForFullBreach();
        }).catch(error => {
          console.log("Console trap trigger error handled:", error);
        });
      }
      return function() {}; // Return a dummy function to avoid errors
    }
  });
} catch (error) {
  // Silently fail if we can't set the trap - likely due to browser security policies
  console.log("Console trap setup error handled:", error);
}