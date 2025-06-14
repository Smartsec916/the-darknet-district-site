// ============================================================================
// DEVELOPER TOOLS DETECTION - Anti-debugging security measure
// ============================================================================

// Anonymous function to prevent global scope pollution
!function(){

    // ========================================
    // State tracking variables
    // ========================================

    // Track developer tools state and orientation
    var devtools = {
        open: false,
        orientation: null
    };


    // ========================================
    // Detection threshold configuration
    // ========================================

    // Detection threshold - lowered for better sensitivity
    const baseThreshold = 200; // More sensitive threshold
    let initialOuterWidth = window.outerWidth;
    let initialOuterHeight = window.outerHeight;
    let initialInnerWidth = window.innerWidth;
    let initialInnerHeight = window.innerHeight;
    let suspiciousChangeCount = 0;
    let lastSuspiciousTime = 0;


    // ========================================
    // Detection monitoring loop
    // ========================================

    // Check every 1000ms for developer tools (less frequent)
    setInterval(function(){

        // Calculate current differences
        const heightDiff = window.outerHeight - window.innerHeight;
        const widthDiff = window.outerWidth - window.innerWidth;
        
        // Calculate change from initial state
        const heightChange = Math.abs(window.outerHeight - initialOuterHeight);
        const widthChange = Math.abs(window.outerWidth - initialOuterWidth);
        
        // Simplified detection: trigger on significant size differences
        const significantHeightDiff = heightDiff > baseThreshold;
        const significantWidthDiff = widthDiff > baseThreshold;
        const currentTime = Date.now();
        
        // Track when we detect potential devtools opening
        if((significantHeightDiff || significantWidthDiff) && currentTime - lastSuspiciousTime > 1000) {
            suspiciousChangeCount++;
            lastSuspiciousTime = currentTime;
        } else if(currentTime - lastSuspiciousTime > 3000) {
            suspiciousChangeCount = 0; // Reset if no recent activity
        }
        
        // Trigger if we have significant difference OR multiple detections
        if(significantHeightDiff || significantWidthDiff || suspiciousChangeCount >= 1){

            // If dev tools just opened
            if(!devtools.open){
                devtools.open = true;

                // Clear console and show warning
                console.clear();
                console.log('%cACCESS DENIED',
                    "color:#ff0000;font-size:50px;font-weight:bold;text-shadow:2px 2px 0px #000000;");
                console.log('%cUnauthorized development access detected.\nTerminal access revoked.',
                    "color:#ff0000;font-size:16px;font-family:monospace;");
                
                // Typewriter effect for Iris message - no flickering
                const irisMessage = "\nIris: Oh, peeking under the hood?\nYou sure you can handle what's under there?";
                const irisStyle = "color:#00ff00;font-size:14px;font-family:'Courier New',monospace;background:#000000;padding:5px;border:1px solid #00ff00;text-shadow:0 0 5px #00ff00;";
                
                let displayText = "";
                let charIndex = 0;
                
                // Clear console once at the start
                console.clear();
                console.log('%cACCESS DENIED',
                    "color:#ff0000;font-size:50px;font-weight:bold;text-shadow:2px 2px 0px #000000;");
                console.log('%cUnauthorized development access detected.\nTerminal access revoked.',
                    "color:#ff0000;font-size:16px;font-family:monospace;");
                
                function typeIrisMessage() {
                    if (charIndex < irisMessage.length) {
                        displayText += irisMessage.charAt(charIndex);
                        // Update only the Iris message line without clearing
                        console.log('%c' + displayText, irisStyle);
                        charIndex++;
                        setTimeout(typeIrisMessage, 40 + Math.random() * 30);
                    }
                }
                
                setTimeout(typeIrisMessage, 500); // Start typing after a brief delay
                
                // Trigger chatbot with dev tools message
                setTimeout(() => {
                    triggerChatbotDevToolsMessage();
                }, 2000); // Wait for console animation to finish
            }
        } else {
            // Dev tools are closed
            devtools.open = false;
            
            // Update baseline measurements when devtools are closed (gradual adaptation to legitimate resizing)
            if(!devtools.open && (Math.abs(window.outerWidth - initialOuterWidth) < 100 || Math.abs(window.outerHeight - initialOuterHeight) < 100)) {
                initialOuterWidth = window.outerWidth;
                initialOuterHeight = window.outerHeight;
                initialInnerWidth = window.innerWidth;
                initialInnerHeight = window.innerHeight;
            }
        }

    }, 500); // Check every 500 milliseconds for faster detection

    // ========================================
    // Chatbot integration function
    // ========================================
    
    function triggerChatbotDevToolsMessage() {
        try {
            // Check if chatManager exists (from script.js)
            if (typeof chatManager !== 'undefined') {
                // Open the chat if it's not already open
                if (!chatManager.isOpen) {
                    chatManager.toggleChat();
                }
                
                // Wait a moment for chat to open, then send Iris's message
                setTimeout(() => {
                    const devToolsMessages = [
                        "I see you've opened the developer tools. Curious about how the District operates behind the scenes?",
                        "Developer console detected. Are you trying to peek into the neural pathways of the system?",
                        "Ah, a fellow code explorer. What brings you to the digital underground of my interface?",
                        "Console access granted. Though I should warn you - some secrets are better left encrypted.",
                        "Dev tools active. I admire the curiosity, but what exactly are you looking for in there?"
                    ];
                    
                    const randomMessage = devToolsMessages[Math.floor(Math.random() * devToolsMessages.length)];
                    chatManager.addMessage(randomMessage, false);
                }, 1000);
            }
        } catch (error) {
            console.log("Chatbot integration failed:", error);
        }
    }

}(); // Execute immediately