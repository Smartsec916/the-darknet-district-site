// ============================================================================
// DEVELOPER TOOLS DETECTION - Anti-debugging security measure
// ============================================================================

window.addEventListener("load", () => {
    const heightThreshold = 150; // More reasonable threshold for height differences
    const widthThreshold = 200; // More reasonable threshold for width differences
    let devtoolsOpen = false;
    let lastTriggerTime = 0;
    
    setInterval(() => {
        const heightDiff = window.outerHeight - window.innerHeight;
        const widthDiff = window.outerWidth - window.innerWidth;
        const currentTime = Date.now();

        // More conservative detection - only trigger on significant size differences
        const significantHeightDiff = heightDiff > heightThreshold;
        const significantWidthDiff = widthDiff > widthThreshold;
        
        // Console detection method (more reliable)
        let consoleOpen = false;
        const start = performance.now();
        console.log('%c', '');
        const end = performance.now();
        if (end - start > 100) {
            consoleOpen = true;
        }
        
        // Only trigger if we have strong indicators AND haven't triggered recently
        const hasDevtools = (significantHeightDiff || significantWidthDiff || consoleOpen);
        const enoughTimePassed = currentTime - lastTriggerTime > 3000; // 3 second cooldown
        
        if (hasDevtools && !devtoolsOpen && enoughTimePassed) {
            devtoolsOpen = true;
            lastTriggerTime = currentTime;

                console.clear();
                console.log('%cACCESS DENIED', "color:#ff0000;font-size:50px;font-weight:bold;text-shadow:2px 2px 0px #000000;");
                console.log('%cUnauthorized development access detected.\nTerminal access revoked.', "color:#ff0000;font-size:16px;font-family:monospace;");

                const irisMessage = ">>> IRIS: Oh, peeking under the hood? You sure you can handle what's under there? <<<";
                
                setTimeout(() => {
                    console.log('%c' + irisMessage, "color:#00ff00;font-size:14px;font-family:'Courier New',monospace;background:#000;padding:5px;border:1px solid #00ff00;text-shadow:0 0 5px #00ff00;");
                }, 500);

                setTimeout(() => {
                    if (typeof chatManager !== 'undefined') {
                        if (!chatManager.isOpen) chatManager.toggleChat();
                        
                        // First send a default opening message
                        setTimeout(() => {
                            const openingMessages = [
                                "Neural interface online. What brings you to the District today?",
                                "Systems operational. How can I assist you in the shadows?",
                                "Connection established. What intel do you need from the grid?",
                                "Interface active. Ready to navigate the digital underground with you.",
                                "Network sync complete. What's your mission in the District?"
                            ];
                            const openingMsg = openingMessages[Math.floor(Math.random() * openingMessages.length)];
                            chatManager.addMessage(openingMsg, false);
                        }, 1000);
                        
                        // Then send the devtools questioning message
                        setTimeout(() => {
                            const devtoolsMessages = [
                                "I see you've opened the developer tools. Curious about how the District operates behind the scenes?",
                                "Developer console detected. Are you trying to peek into the neural pathways of the system?",
                                "Ah, a fellow code explorer. What brings you to the digital underground of my interface?",
                                "Console access granted. Though I should warn you - some secrets are better left encrypted.",
                                "Dev tools active. I admire the curiosity, but what exactly are you looking for in there?"
                            ];
                            const devtoolsMsg = devtoolsMessages[Math.floor(Math.random() * devtoolsMessages.length)];
                            chatManager.addMessage(devtoolsMsg, false);
                        }, 3000);
                    }
                }, 2000);
        } else if (!hasDevtools && devtoolsOpen && enoughTimePassed) {
            // Reset when devtools are clearly closed
            devtoolsOpen = false;
        }
    }, 1000); // Check less frequently to reduce false positives
});