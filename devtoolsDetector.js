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

    // Pixel threshold for detecting dev tools opening
    const threshold = 160;


    // ========================================
    // Detection monitoring loop
    // ========================================

    // Check every 500ms for developer tools
    setInterval(function(){

        // Check if window dimensions suggest dev tools are open
        if(window.outerHeight - window.innerHeight > threshold || 
           window.outerWidth - window.innerWidth > threshold){

            // If dev tools just opened
            if(!devtools.open){
                devtools.open = true;

                // Clear console and show warning
                console.clear();
                console.log('%cACCESS DENIED',
                    "color:#ff0000;font-size:50px;font-weight:bold;text-shadow:2px 2px 0px #000000;");
                console.log('%cUnauthorized development access detected.\nTerminal access revoked.',
                    "color:#ff0000;font-size:16px;font-family:monospace;");
                
                // Typewriter effect for Iris message
                const irisMessage = "Iris: Oh, peeking under the hood?\nYou sure you can handle what's under there?";
                const irisStyle = "color:#00ff00;font-size:14px;font-family:'Courier New',monospace;background:#000000;padding:5px;border:1px solid #00ff00;text-shadow:0 0 5px #00ff00;";
                
                let displayText = "";
                let charIndex = 0;
                
                function typeIrisMessage() {
                    if (charIndex < irisMessage.length) {
                        displayText += irisMessage.charAt(charIndex);
                        console.clear();
                        console.log('%cACCESS DENIED',
                            "color:#ff0000;font-size:50px;font-weight:bold;text-shadow:2px 2px 0px #000000;");
                        console.log('%cUnauthorized development access detected.\nTerminal access revoked.',
                            "color:#ff0000;font-size:16px;font-family:monospace;");
                        console.log('%c' + displayText, irisStyle);
                        charIndex++;
                        setTimeout(typeIrisMessage, 80 + Math.random() * 40); // Variable typing speed
                    }
                }
                
                setTimeout(typeIrisMessage, 500); // Start typing after a brief delay
            }
        } else {
            // Dev tools are closed
            devtools.open = false;
        }

    }, 500); // Check every 500 milliseconds

}(); // Execute immediately