// === DEVTOOLS DETECTOR – FINAL VERSION ===
// Prevents spam. Logs "ACCESS DENIED" and Iris's message at bottom of console.

window.addEventListener("load", () => {
    const heightThreshold = 300;
    const widthThreshold = 400;
    let devtoolsTriggered = false;

    const checkDevTools = () => {
        const heightDiff = window.outerHeight - window.innerHeight;
        const widthDiff = window.outerWidth - window.innerWidth;

        let consoleOpen = false;
        const start = performance.now();
        console.log('%c', '');
        const end = performance.now();
        if (end - start > 150) consoleOpen = true;

        // More conservative screen mismatch check
        const screenMismatch = window.outerWidth > (screen.availWidth + 50) || window.outerHeight > (screen.availHeight + 50);

        // Require multiple indicators or very high thresholds
        const indicators = [
            heightDiff > heightThreshold,
            widthDiff > widthThreshold,
            consoleOpen,
            screenMismatch
        ].filter(Boolean).length;

        const hasDevtools = indicators >= 2 || heightDiff > 500 || widthDiff > 600;

        if (hasDevtools && !devtoolsTriggered) {
            devtoolsTriggered = true;

            // Clear and print messages once
            console.clear();
            const logs = [
                "%cACCESS DENIED",
                "%cUnauthorized development access detected.\nTerminal access revoked.",
                "%c>>> IRIS: Oh, peeking under the hood? You sure you can handle what's under there? <<<"
            ];
            const styles = [
                "color:#ff0000;font-size:50px;font-weight:bold;text-shadow:2px 2px 0px #000000;",
                "color:#ff0000;font-size:16px;font-family:monospace;",
                "color:#00ff00;font-size:14px;font-family:'Courier New',monospace;background:#000;padding:5px;border:1px solid #00ff00;text-shadow:0 0 5px #00ff00;"
            ];
            logs.forEach((msg, i) => console.log(msg, styles[i]));

            // Spacer to keep message visible at bottom
            for (let i = 0; i < 20; i++) console.log(" ");

            // Trigger Iris chat
            setTimeout(() => {
                const chatContainer = document.getElementById('chatContainer');
                if (chatContainer && chatContainer.style.display === 'none') {
                    toggleChat();
                }
                
                // Get varied greeting from backend
                fetch('/api/chat/greeting')
                    .then(response => response.json())
                    .then(data => {
                        setTimeout(() => {
                            addMessage(data.message, false);
                        }, 1000);
                    })
                    .catch(() => {
                        setTimeout(() => {
                            addMessage("Neural interface online. What brings you to the District today?", false);
                        }, 1000);
                    });
                
                // Get devtools message from backend
                fetch('/api/devtools/message')
                    .then(response => response.json())
                    .then(data => {
                        setTimeout(() => {
                            addMessage(data.message, false);
                        }, 3000);
                    })
                    .catch(() => {
                        setTimeout(() => {
                            addMessage("I see you've opened the dev console. Curious minds make dangerous allies.", false);
                        }, 3000);
                    });
            }, 1500);
        }

        // Allow retriggering after devtools have been closed for 5+ seconds
        if (!hasDevtools && devtoolsTriggered) {
            setTimeout(() => {
                const stillClosed =
                    (window.outerHeight - window.innerHeight) < heightThreshold &&
                    (window.outerWidth - window.innerWidth) < widthThreshold;
                if (stillClosed) devtoolsTriggered = false;
            }, 5000);
        }
    };

    setInterval(checkDevTools, 1000);
});