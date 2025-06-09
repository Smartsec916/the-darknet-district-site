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
            }
        } else {
            // Dev tools are closed
            devtools.open = false;
        }

    }, 500); // Check every 500 milliseconds

}(); // Execute immediately