// ============================================================================
// DEVELOPER TOOLS DETECTION - Anti-debugging security measure
// ============================================================================

window.addEventListener("load", () => {
    const baseThreshold = 50; // Lowered from 100 to 50 for better sensitivity
    let initialOuterWidth = window.outerWidth;
    let initialOuterHeight = window.outerHeight;
    let initialInnerWidth = window.innerWidth;
    let initialInnerHeight = window.innerHeight;
    let suspiciousChangeCount = 0;
    let lastSuspiciousTime = 0;
    let devtoolsOpen = false;

    setInterval(() => {
        const heightDiff = window.outerHeight - window.innerHeight;
        const widthDiff = window.outerWidth - window.innerWidth;

        // Multiple detection methods for better coverage
        const significantHeightDiff = heightDiff > baseThreshold;
        const significantWidthDiff = widthDiff > baseThreshold;
        
        // Additional detection: check for common devtools dimensions
        const possibleDevtoolsHeight = window.innerHeight < window.outerHeight - 200;
        const possibleDevtoolsWidth = window.innerWidth < window.outerWidth - 200;
        
        // Console detection method
        let consoleOpen = false;
        const start = performance.now();
        console.log('%c', '');
        const end = performance.now();
        if (end - start > 100) {
            consoleOpen = true;
        }
        
        const currentTime = Date.now();

        if ((significantHeightDiff || significantWidthDiff || possibleDevtoolsHeight || possibleDevtoolsWidth || consoleOpen) && currentTime - lastSuspiciousTime > 500) {
            suspiciousChangeCount++;
            lastSuspiciousTime = currentTime;
            console.log("[DevTools Detector] Suspicious activity detected");
        } else if (currentTime - lastSuspiciousTime > 2000) {
            suspiciousChangeCount = 0;
        }

        if (significantHeightDiff || significantWidthDiff || possibleDevtoolsHeight || possibleDevtoolsWidth || consoleOpen || suspiciousChangeCount >= 1) {
            if (!devtoolsOpen) {
                devtoolsOpen = true;

                console.clear();
                console.log('%cACCESS DENIED', "color:#ff0000;font-size:50px;font-weight:bold;text-shadow:2px 2px 0px #000000;");
                console.log('%cUnauthorized development access detected.\nTerminal access revoked.', "color:#ff0000;font-size:16px;font-family:monospace;");

                const irisMessage = ">>> IRIS: Oh, peeking under the hood? You sure you can handle what's under there? <<<";
                let displayIndex = 0;
                const scrollWidth = 80; // Width of the scrolling window

                function scrollIrisMessage() {
                    if (displayIndex < irisMessage.length + scrollWidth) {
                        let visibleText = "";
                        for (let i = 0; i < scrollWidth; i++) {
                            const charPos = displayIndex - i;
                            if (charPos >= 0 && charPos < irisMessage.length) {
                                visibleText = irisMessage.charAt(charPos) + visibleText;
                            } else {
                                visibleText = " " + visibleText;
                            }
                        }
                        console.log('%c' + visibleText, "color:#00ff00;font-size:14px;font-family:'Courier New',monospace;background:#000;padding:5px;border:1px solid #00ff00;text-shadow:0 0 5px #00ff00;");
                        displayIndex++;
                        setTimeout(scrollIrisMessage, 80);
                    }
                }

                setTimeout(scrollIrisMessage, 500);

                setTimeout(() => {
                    if (typeof chatManager !== 'undefined') {
                        if (!chatManager.isOpen) chatManager.toggleChat();
                        setTimeout(() => {
                            const messages = [
                                "I see you've opened the developer tools. Curious about how the District operates behind the scenes?",
                                "Developer console detected. Are you trying to peek into the neural pathways of the system?",
                                "Ah, a fellow code explorer. What brings you to the digital underground of my interface?",
                                "Console access granted. Though I should warn you - some secrets are better left encrypted.",
                                "Dev tools active. I admire the curiosity, but what exactly are you looking for in there?"
                            ];
                            const msg = messages[Math.floor(Math.random() * messages.length)];
                            chatManager.addMessage(msg, false);
                        }, 1000);
                    }
                }, 2000);
            }
        } else {
            if (devtoolsOpen) {
                devtoolsOpen = false;
                suspiciousChangeCount = 0;
            }
        }
    }, 500);
});